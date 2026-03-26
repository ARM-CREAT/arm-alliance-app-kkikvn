import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { eq, and, inArray } from 'drizzle-orm';
import * as schema from '../db/schema.js';
import type { App } from '../index.js';

interface ConversationBody {
  participant_id: string;
}

interface MessageBody {
  content: string;
}

interface ReadMessageBody {
  messageId: string;
}

export function register(app: App, fastify: FastifyInstance) {
  const requireAuth = app.requireAuth();

  // GET /api/conversations - List conversations for current user (authenticated)
  fastify.get(
    '/api/conversations',
    {
      schema: {
        description: 'List conversations for current user',
        tags: ['conversations'],
        response: {
          200: {
            type: 'array',
          },
          401: { type: 'object' },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      const userId = session.user.id;
      app.logger.info({ userId }, 'Fetching conversations');

      try {
        const result = await app.db
          .select()
          .from(schema.conversations)
          .where(inArray(schema.conversations.participantIds, [userId]));

        app.logger.info({ userId, count: result.length }, 'Conversations fetched successfully');
        return result.map((conv) => ({
          id: conv.id,
          participantIds: conv.participantIds,
          lastMessage: conv.lastMessage || null,
          lastMessageAt: conv.lastMessageAt instanceof Date ? conv.lastMessageAt.toISOString() : conv.lastMessageAt ? new Date(conv.lastMessageAt).toISOString() : null,
          createdAt: conv.createdAt instanceof Date ? conv.createdAt.toISOString() : new Date(conv.createdAt).toISOString(),
        }));
      } catch (error) {
        app.logger.error({ err: error, userId }, 'Failed to fetch conversations');
        throw error;
      }
    }
  );

  // POST /api/conversations - Create or get existing conversation (authenticated)
  fastify.post<{ Body: ConversationBody }>(
    '/api/conversations',
    {
      schema: {
        description: 'Create or get existing conversation',
        tags: ['conversations'],
        body: {
          type: 'object',
          properties: {
            participant_id: { type: 'string' },
          },
          required: ['participant_id'],
        },
        response: {
          200: { type: 'object' },
          400: { type: 'object' },
          401: { type: 'object' },
        },
      },
    },
    async (request: FastifyRequest<{ Body: ConversationBody }>, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      const userId = session.user.id;
      const { participant_id } = request.body;

      if (!participant_id) {
        app.logger.warn({ userId }, 'Missing participant_id');
        reply.status(400);
        return { error: 'Missing required field: participant_id' };
      }

      app.logger.info({ userId, participantId: participant_id }, 'Creating/getting conversation');

      try {
        // Check if conversation already exists between these two users
        const existing = await app.db
          .select()
          .from(schema.conversations)
          .where(
            inArray(schema.conversations.participantIds, [userId])
          );

        const conv = existing.find((c) =>
          c.participantIds?.includes(participant_id) && c.participantIds?.includes(userId)
        );

        if (conv) {
          app.logger.info({ conversationId: conv.id }, 'Existing conversation found');
          reply.status(200);
          return {
            id: conv.id,
            participantIds: conv.participantIds,
            lastMessage: conv.lastMessage || null,
            lastMessageAt: conv.lastMessageAt instanceof Date ? conv.lastMessageAt.toISOString() : conv.lastMessageAt ? new Date(conv.lastMessageAt).toISOString() : null,
            createdAt: conv.createdAt instanceof Date ? conv.createdAt.toISOString() : new Date(conv.createdAt).toISOString(),
          };
        }

        // Create new conversation
        const result = await app.db
          .insert(schema.conversations)
          .values({
            participantIds: [userId, participant_id],
          })
          .returning();

        app.logger.info({ conversationId: result[0].id }, 'Conversation created successfully');
        reply.status(201);
        return {
          id: result[0].id,
          participantIds: result[0].participantIds,
          lastMessage: null,
          lastMessageAt: null,
          createdAt: result[0].createdAt instanceof Date ? result[0].createdAt.toISOString() : new Date(result[0].createdAt).toISOString(),
        };
      } catch (error) {
        app.logger.error({ err: error, userId, participantId: participant_id }, 'Failed to create/get conversation');
        throw error;
      }
    }
  );

  // GET /api/conversations/:id/messages - Get messages in a conversation (authenticated, must be participant)
  fastify.get<{ Params: { id: string } }>(
    '/api/conversations/:id/messages',
    {
      schema: {
        description: 'Get messages in a conversation',
        tags: ['conversations'],
        params: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
          },
        },
        response: {
          200: { type: 'array' },
          401: { type: 'object' },
          403: { type: 'object' },
          404: { type: 'object' },
        },
      },
    },
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      const userId = session.user.id;
      const { id } = request.params;

      app.logger.info({ conversationId: id, userId }, 'Fetching conversation messages');

      try {
        // Check if conversation exists
        const conv = await app.db
          .select()
          .from(schema.conversations)
          .where(eq(schema.conversations.id, id));

        if (conv.length === 0) {
          app.logger.warn({ conversationId: id }, 'Conversation not found');
          reply.status(404);
          return { error: 'Conversation not found' };
        }

        // Check if user is a participant
        if (!conv[0].participantIds?.includes(userId)) {
          app.logger.warn({ conversationId: id, userId }, 'User not a participant');
          reply.status(403);
          return { error: 'Forbidden' };
        }

        const messages = await app.db
          .select()
          .from(schema.chatMessages)
          .where(eq(schema.chatMessages.conversationId, id));

        app.logger.info({ conversationId: id, count: messages.length }, 'Messages fetched successfully');
        return messages.map((msg) => ({
          id: msg.id,
          conversationId: msg.conversationId,
          senderId: msg.senderId,
          senderName: msg.senderName,
          content: msg.content,
          readBy: msg.readBy || [],
          createdAt: msg.createdAt instanceof Date ? msg.createdAt.toISOString() : new Date(msg.createdAt).toISOString(),
        }));
      } catch (error) {
        app.logger.error({ err: error, conversationId: id, userId }, 'Failed to fetch messages');
        throw error;
      }
    }
  );

  // POST /api/conversations/:id/messages - Send message in conversation (authenticated, must be participant)
  fastify.post<{ Params: { id: string }; Body: MessageBody }>(
    '/api/conversations/:id/messages',
    {
      schema: {
        description: 'Send message in conversation',
        tags: ['conversations'],
        params: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
          },
        },
        body: {
          type: 'object',
          properties: {
            content: { type: 'string' },
          },
          required: ['content'],
        },
        response: {
          201: { type: 'object' },
          400: { type: 'object' },
          401: { type: 'object' },
          403: { type: 'object' },
          404: { type: 'object' },
        },
      },
    },
    async (request: FastifyRequest<{ Params: { id: string }; Body: MessageBody }>, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      const userId = session.user.id;
      const userName = session.user.name || 'Anonymous';
      const { id } = request.params;
      const { content } = request.body;

      if (!content) {
        app.logger.warn({ conversationId: id }, 'Missing content');
        reply.status(400);
        return { error: 'Missing required field: content' };
      }

      app.logger.info({ conversationId: id, userId }, 'Sending message');

      try {
        // Check if conversation exists
        const conv = await app.db
          .select()
          .from(schema.conversations)
          .where(eq(schema.conversations.id, id));

        if (conv.length === 0) {
          app.logger.warn({ conversationId: id }, 'Conversation not found');
          reply.status(404);
          return { error: 'Conversation not found' };
        }

        // Check if user is a participant
        if (!conv[0].participantIds?.includes(userId)) {
          app.logger.warn({ conversationId: id, userId }, 'User not a participant');
          reply.status(403);
          return { error: 'Forbidden' };
        }

        // Insert message
        const result = await app.db
          .insert(schema.chatMessages)
          .values({
            conversationId: id,
            senderId: userId,
            senderName: userName,
            content,
          })
          .returning();

        const msg = result[0];

        // Update conversation with last message
        await app.db
          .update(schema.conversations)
          .set({
            lastMessage: content,
            lastMessageAt: new Date(),
          })
          .where(eq(schema.conversations.id, id));

        app.logger.info({ messageId: msg.id, conversationId: id }, 'Message sent successfully');
        reply.status(201);
        return {
          id: msg.id,
          conversationId: msg.conversationId,
          senderId: msg.senderId,
          senderName: msg.senderName,
          content: msg.content,
          readBy: msg.readBy || [],
          createdAt: msg.createdAt instanceof Date ? msg.createdAt.toISOString() : new Date(msg.createdAt).toISOString(),
        };
      } catch (error) {
        app.logger.error({ err: error, conversationId: id, userId }, 'Failed to send message');
        throw error;
      }
    }
  );

  // PUT /api/conversations/:id/messages/:messageId/read - Mark message as read (authenticated)
  fastify.put<{ Params: { id: string; messageId: string } }>(
    '/api/conversations/:id/messages/:messageId/read',
    {
      schema: {
        description: 'Mark message as read',
        tags: ['conversations'],
        params: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            messageId: { type: 'string', format: 'uuid' },
          },
        },
        response: {
          200: { type: 'object' },
          401: { type: 'object' },
          403: { type: 'object' },
          404: { type: 'object' },
        },
      },
    },
    async (request: FastifyRequest<{ Params: { id: string; messageId: string } }>, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      const userId = session.user.id;
      const { id, messageId } = request.params;

      app.logger.info({ conversationId: id, messageId, userId }, 'Marking message as read');

      try {
        // Check if message exists
        const msg = await app.db
          .select()
          .from(schema.chatMessages)
          .where(and(eq(schema.chatMessages.id, messageId), eq(schema.chatMessages.conversationId, id)));

        if (msg.length === 0) {
          app.logger.warn({ messageId }, 'Message not found');
          reply.status(404);
          return { error: 'Message not found' };
        }

        // Update readBy array
        const readBy = msg[0].readBy || [];
        if (!readBy.includes(userId)) {
          readBy.push(userId);
        }

        const result = await app.db
          .update(schema.chatMessages)
          .set({ readBy })
          .where(eq(schema.chatMessages.id, messageId))
          .returning();

        app.logger.info({ messageId }, 'Message marked as read');
        return {
          id: result[0].id,
          conversationId: result[0].conversationId,
          senderId: result[0].senderId,
          senderName: result[0].senderName,
          content: result[0].content,
          readBy: result[0].readBy || [],
          createdAt: result[0].createdAt instanceof Date ? result[0].createdAt.toISOString() : new Date(result[0].createdAt).toISOString(),
        };
      } catch (error) {
        app.logger.error({ err: error, conversationId: id, messageId, userId }, 'Failed to mark message as read');
        throw error;
      }
    }
  );
}
