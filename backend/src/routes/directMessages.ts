import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { eq, or, desc } from 'drizzle-orm';
import * as schema from '../db/schema.js';
import type { App } from '../index.js';

interface SendMessageBody {
  sender_id: string;
  sender_name: string;
  recipient_id: string;
  content: string;
}

/**
 * Validate admin token from Authorization header
 */
async function validateAdminToken(app: App, request: FastifyRequest): Promise<boolean> {
  try {
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return false;
    }

    const token = authHeader.substring(7);
    const result = await app.db
      .select()
      .from(schema.appSettings)
      .where(eq(schema.appSettings.key, 'admin_token'));

    if (result.length === 0) {
      return false;
    }

    return result[0].value === token;
  } catch (error) {
    return false;
  }
}

export function register(app: App, fastify: FastifyInstance) {
  // GET /api/direct-messages/conversations - List all conversations (admin only)
  fastify.get(
    '/api/direct-messages/conversations',
    {
      schema: {
        description: 'Get all direct message conversations (admin only)',
        tags: ['messages'],
        response: {
          200: {
            type: 'array',
            items: { type: 'object' },
          },
          401: { type: 'object', properties: { error: { type: 'string' } } },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const isAdmin = await validateAdminToken(app, request);
      if (!isAdmin) {
        app.logger.warn('Unauthorized conversations list attempt');
        reply.status(401);
        return { error: 'Unauthorized' };
      }

      app.logger.info('Fetching all conversations');

      try {
        const conversations = await app.db
          .select()
          .from(schema.dmConversations)
          .orderBy(desc(schema.dmConversations.lastMessageAt));

        app.logger.info({ count: conversations.length }, 'Conversations retrieved');

        return conversations.map(c => ({
          id: c.id,
          member_id: c.memberId,
          member_name: c.memberName,
          last_message: c.lastMessage,
          last_message_at: c.lastMessageAt.toISOString(),
          unread_count: c.unreadCount,
          created_at: c.createdAt.toISOString(),
        }));
      } catch (error) {
        app.logger.error({ err: error }, 'Failed to fetch conversations');
        reply.status(500);
        return { error: 'Failed to fetch conversations' };
      }
    }
  );

  // GET /api/direct-messages/conversations/:member_id - Get or create conversation for a member
  fastify.get<{ Params: { member_id: string } }>(
    '/api/direct-messages/conversations/:member_id',
    {
      schema: {
        description: 'Get or create a conversation with a member',
        tags: ['messages'],
        params: {
          type: 'object',
          required: ['member_id'],
          properties: { member_id: { type: 'string' } },
        },
        response: {
          200: { type: 'object' },
          500: { type: 'object', properties: { error: { type: 'string' } } },
        },
      },
    },
    async (request: FastifyRequest<{ Params: { member_id: string } }>, reply: FastifyReply) => {
      const { member_id } = request.params;

      app.logger.info({ memberId: member_id }, 'Getting or creating conversation');

      try {
        let conversation = await app.db
          .select()
          .from(schema.dmConversations)
          .where(eq(schema.dmConversations.memberId, member_id));

        if (conversation.length === 0) {
          app.logger.info({ memberId: member_id }, 'Creating new conversation');
          const result = await app.db
            .insert(schema.dmConversations)
            .values({
              memberId: member_id,
              memberName: 'Membre',
              lastMessageAt: new Date(),
              unreadCount: 0,
              createdAt: new Date(),
            })
            .returning();

          conversation = result;
        }

        const c = conversation[0];
        return {
          id: c.id,
          member_id: c.memberId,
          member_name: c.memberName,
          last_message: c.lastMessage,
          last_message_at: c.lastMessageAt.toISOString(),
          unread_count: c.unreadCount,
          created_at: c.createdAt.toISOString(),
        };
      } catch (error) {
        app.logger.error({ err: error, memberId: member_id }, 'Failed to get/create conversation');
        reply.status(500);
        return { error: 'Failed to get/create conversation' };
      }
    }
  );

  // GET /api/direct-messages/messages/:member_id - Get all messages for a member
  fastify.get<{ Params: { member_id: string } }>(
    '/api/direct-messages/messages/:member_id',
    {
      schema: {
        description: 'Get all messages for a member conversation',
        tags: ['messages'],
        params: {
          type: 'object',
          required: ['member_id'],
          properties: { member_id: { type: 'string' } },
        },
        response: {
          200: {
            type: 'array',
            items: { type: 'object' },
          },
          500: { type: 'object', properties: { error: { type: 'string' } } },
        },
      },
    },
    async (request: FastifyRequest<{ Params: { member_id: string } }>, reply: FastifyReply) => {
      const { member_id } = request.params;

      app.logger.info({ memberId: member_id }, 'Fetching messages');

      try {
        const messages = await app.db
          .select()
          .from(schema.dmMessages)
          .where(
            or(
              eq(schema.dmMessages.senderId, member_id),
              eq(schema.dmMessages.recipientId, member_id)
            )
          )
          .orderBy((t) => t.createdAt);

        app.logger.info({ memberId: member_id, count: messages.length }, 'Messages retrieved');

        return messages.map(m => ({
          id: m.id,
          sender_id: m.senderId,
          sender_name: m.senderName,
          recipient_id: m.recipientId,
          content: m.content,
          is_read: m.isRead,
          created_at: m.createdAt.toISOString(),
        }));
      } catch (error) {
        app.logger.error({ err: error, memberId: member_id }, 'Failed to fetch messages');
        reply.status(500);
        return { error: 'Failed to fetch messages' };
      }
    }
  );

  // POST /api/direct-messages/messages - Send a message
  fastify.post<{ Body: SendMessageBody }>(
    '/api/direct-messages/messages',
    {
      schema: {
        description: 'Send a direct message',
        tags: ['messages'],
        body: {
          type: 'object',
          required: ['sender_id', 'sender_name', 'recipient_id', 'content'],
          properties: {
            sender_id: { type: 'string' },
            sender_name: { type: 'string' },
            recipient_id: { type: 'string' },
            content: { type: 'string' },
          },
        },
        response: {
          201: { type: 'object' },
          500: { type: 'object', properties: { error: { type: 'string' } } },
        },
      },
    },
    async (request: FastifyRequest<{ Body: SendMessageBody }>, reply: FastifyReply) => {
      const { sender_id, sender_name, recipient_id, content } = request.body;

      app.logger.info({ senderId: sender_id, recipientId: recipient_id }, 'Sending message');

      try {
        // Insert message
        const messageResult = await app.db
          .insert(schema.dmMessages)
          .values({
            senderId: sender_id,
            senderName: sender_name,
            recipientId: recipient_id,
            content,
            isRead: false,
            createdAt: new Date(),
          })
          .returning();

        const message = messageResult[0];

        // Determine which member_id to upsert conversation for
        const conversationMemberId = sender_id !== 'admin' ? sender_id : recipient_id;

        // Check if conversation exists
        const existingConversation = await app.db
          .select()
          .from(schema.dmConversations)
          .where(eq(schema.dmConversations.memberId, conversationMemberId));

        if (existingConversation.length > 0) {
          // Update existing conversation
          const updateData: any = {
            lastMessage: content,
            lastMessageAt: new Date(),
          };

          // Increment unread_count if sender is not admin
          if (sender_id !== 'admin') {
            updateData.unreadCount = (existingConversation[0].unreadCount || 0) + 1;
          }

          await app.db
            .update(schema.dmConversations)
            .set(updateData)
            .where(eq(schema.dmConversations.memberId, conversationMemberId));
        } else {
          // Create new conversation
          const unreadCount = sender_id !== 'admin' ? 1 : 0;
          await app.db
            .insert(schema.dmConversations)
            .values({
              memberId: conversationMemberId,
              memberName: sender_id !== 'admin' ? sender_name : 'Admin',
              lastMessage: content,
              lastMessageAt: new Date(),
              unreadCount,
              createdAt: new Date(),
            });
        }

        app.logger.info({ messageId: message.id }, 'Message sent successfully');

        reply.status(201);
        return {
          id: message.id,
          sender_id: message.senderId,
          sender_name: message.senderName,
          recipient_id: message.recipientId,
          content: message.content,
          is_read: message.isRead,
          created_at: message.createdAt.toISOString(),
        };
      } catch (error) {
        app.logger.error({ err: error, senderId: sender_id }, 'Failed to send message');
        reply.status(500);
        return { error: 'Failed to send message' };
      }
    }
  );

  // PATCH /api/direct-messages/messages/:member_id/read - Mark all messages as read (admin only)
  fastify.patch<{ Params: { member_id: string } }>(
    '/api/direct-messages/messages/:member_id/read',
    {
      schema: {
        description: 'Mark all messages from a member as read (admin only)',
        tags: ['messages'],
        params: {
          type: 'object',
          required: ['member_id'],
          properties: { member_id: { type: 'string' } },
        },
        response: {
          200: { type: 'object', properties: { success: { type: 'boolean' }, updated: { type: 'number' } } },
          401: { type: 'object', properties: { error: { type: 'string' } } },
          500: { type: 'object', properties: { error: { type: 'string' } } },
        },
      },
    },
    async (request: FastifyRequest<{ Params: { member_id: string } }>, reply: FastifyReply) => {
      const isAdmin = await validateAdminToken(app, request);
      if (!isAdmin) {
        app.logger.warn('Unauthorized mark as read attempt');
        reply.status(401);
        return { error: 'Unauthorized' };
      }

      const { member_id } = request.params;

      app.logger.info({ memberId: member_id }, 'Marking messages as read');

      try {
        // Get unread messages count
        const unreadMessages = await app.db
          .select()
          .from(schema.dmMessages)
          .where(
            eq(schema.dmMessages.senderId, member_id)
          );

        const unreadCount = unreadMessages.filter(m => !m.isRead).length;

        // Update messages to read
        if (unreadCount > 0) {
          await app.db
            .update(schema.dmMessages)
            .set({ isRead: true })
            .where(
              eq(schema.dmMessages.senderId, member_id)
            );
        }

        // Reset unread_count in conversation
        await app.db
          .update(schema.dmConversations)
          .set({ unreadCount: 0 })
          .where(eq(schema.dmConversations.memberId, member_id));

        app.logger.info({ memberId: member_id, updated: unreadCount }, 'Messages marked as read');

        return { success: true, updated: unreadCount };
      } catch (error) {
        app.logger.error({ err: error, memberId: member_id }, 'Failed to mark messages as read');
        reply.status(500);
        return { error: 'Failed to mark messages as read' };
      }
    }
  );
}
