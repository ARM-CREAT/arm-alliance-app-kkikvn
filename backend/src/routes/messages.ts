import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { eq } from 'drizzle-orm';
import * as schema from '../db/schema.js';
import type { App } from '../index.js';

interface MessageBody {
  name: string;
  email: string;
  subject: string;
  message: string;
}

interface UpdateStatusBody {
  status: 'unread' | 'read' | 'replied';
}

export function register(app: App, fastify: FastifyInstance) {
  const requireAuth = app.requireAuth();

  // POST /api/messages - Create contact message (public)
  fastify.post<{ Body: MessageBody }>(
    '/api/messages',
    {
      schema: {
        description: 'Send a contact message',
        tags: ['messages'],
        body: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            email: { type: 'string' },
            subject: { type: 'string' },
            message: { type: 'string' },
          },
          required: ['name', 'email', 'subject', 'message'],
        },
        response: {
          201: { type: 'object' },
          400: { type: 'object' },
        },
      },
    },
    async (request, reply) => {
      const { name, email, subject, message } = request.body;

      // Validate required fields
      if (!name || !email || !subject || !message) {
        app.logger.warn(
          { email, subject },
          'Missing required fields in contact message'
        );
        reply.status(400);
        return { error: 'Missing required fields' };
      }

      app.logger.info(
        { email, subject },
        'Receiving contact message'
      );

      try {
        const result = await app.db
          .insert(schema.messages)
          .values({
            senderName: name,
            senderEmail: email,
            subject,
            message,
            status: 'unread',
          })
          .returning();

        app.logger.info(
          { messageId: result[0].id, subject },
          'Contact message received and stored'
        );
        reply.status(201);
        return { success: true, id: result[0].id };
      } catch (error) {
        app.logger.error(
          { err: error, email },
          'Failed to create message'
        );
        throw error;
      }
    }
  );

  // GET /api/messages - Get all messages (admin only)
  fastify.get<{ Querystring: { status?: string } }>(
    '/api/messages',
    {
      schema: {
        description: 'Get all messages (admin only)',
        tags: ['messages'],
        querystring: {
          type: 'object',
          properties: {
            status: { type: 'string' },
          },
        },
        response: {
          200: { type: 'array' },
        },
      },
    },
    async (request, reply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      const { status } = request.query;
      app.logger.info({ status }, 'Fetching messages');

      try {
        let query = app.db.select().from(schema.messages);
        if (status) {
          query = query.where(eq(schema.messages.status, status)) as any;
        }
        const result = await query.orderBy(schema.messages.createdAt);

        app.logger.info(
          { count: result.length, status },
          'Messages fetched successfully'
        );
        return result;
      } catch (error) {
        app.logger.error({ err: error }, 'Failed to fetch messages');
        throw error;
      }
    }
  );

  // PUT /api/messages/:id/status - Update message status (admin)
  fastify.put<{ Params: { id: string }; Body: UpdateStatusBody }>(
    '/api/messages/:id/status',
    {
      schema: {
        description: 'Update message status (admin only)',
        tags: ['messages'],
        params: {
          type: 'object',
          properties: {
            id: { type: 'string' },
          },
        },
        body: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              enum: ['unread', 'read', 'replied'],
            },
          },
          required: ['status'],
        },
        response: {
          200: { type: 'object' },
        },
      },
    },
    async (request, reply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      const { id } = request.params;
      const { status } = request.body;
      app.logger.info({ messageId: id, status }, 'Updating message status');

      try {
        const result = await app.db
          .update(schema.messages)
          .set({ status })
          .where(eq(schema.messages.id, id))
          .returning();

        app.logger.info(
          { messageId: id, status },
          'Message status updated successfully'
        );
        return result[0];
      } catch (error) {
        app.logger.error(
          { err: error, messageId: id },
          'Failed to update message status'
        );
        throw error;
      }
    }
  );
}
