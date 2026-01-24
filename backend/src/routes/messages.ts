import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { eq } from 'drizzle-orm';
import * as schema from '../db/schema.js';
import type { App } from '../index.js';

interface MessageBody {
  senderName: string;
  senderEmail: string;
  subject: string;
  message: string;
}

interface UpdateStatusBody {
  status: 'unread' | 'read' | 'replied';
}

export function register(app: App, fastify: FastifyInstance) {
  const requireAuth = app.requireAuth();

  // POST /api/messages - Create contact message
  fastify.post<{ Body: MessageBody }>(
    '/api/messages',
    {
      schema: {
        description: 'Send a contact message',
        tags: ['messages'],
        body: {
          type: 'object',
          properties: {
            senderName: { type: 'string' },
            senderEmail: { type: 'string' },
            subject: { type: 'string' },
            message: { type: 'string' },
          },
          required: ['senderName', 'senderEmail', 'subject', 'message'],
        },
        response: {
          200: { type: 'object' },
        },
      },
    },
    async (request, reply) => {
      const { senderName, senderEmail, subject, message } = request.body;
      app.logger.info(
        { senderEmail, subject },
        'Receiving contact message'
      );

      try {
        const result = await app.db
          .insert(schema.messages)
          .values({
            senderName,
            senderEmail,
            subject,
            message,
          })
          .returning();

        app.logger.info(
          { messageId: result[0].id, subject },
          'Contact message received and stored'
        );
        return result[0];
      } catch (error) {
        app.logger.error(
          { err: error, senderEmail },
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
