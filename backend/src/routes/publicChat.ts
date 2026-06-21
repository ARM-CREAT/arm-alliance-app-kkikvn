import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { desc, count } from 'drizzle-orm';
import * as schema from '../db/schema.js';
import type { App } from '../index.js';

interface PublicChatMessageBody {
  user_name: string;
  message: string;
}

export function register(app: App, fastify: FastifyInstance) {
  // GET /api/public-chat - Get last 50 messages from public chat
  fastify.get<{ Querystring: { limit?: string } }>(
    '/api/public-chat',
    {
      schema: {
        description: 'Get recent messages from public chat (max 50)',
        tags: ['public-chat'],
        querystring: {
          type: 'object',
          properties: {
            limit: { type: 'string', default: '50', description: 'Number of messages (default 50, max 50)' },
          },
        },
        response: {
          200: {
            type: 'array',
            items: { type: 'object' },
          },
        },
      },
    },
    async (request: FastifyRequest<{ Querystring: { limit?: string } }>, reply: FastifyReply) => {
      const pageLimit = Math.min(50, Math.max(1, parseInt(request.query.limit || '50', 10)));

      app.logger.info({ limit: pageLimit }, 'Fetching public chat messages');

      try {
        const messages = await app.db
          .select()
          .from(schema.publicChat)
          .orderBy(desc(schema.publicChat.createdAt))
          .limit(pageLimit);

        app.logger.info({ count: messages.length }, 'Public chat messages retrieved');

        return messages.reverse().map(m => ({
          id: m.id,
          user_name: m.userName,
          message: m.message,
          created_at: m.createdAt instanceof Date ? m.createdAt.toISOString() : new Date(m.createdAt).toISOString(),
        }));
      } catch (error) {
        app.logger.error({ err: error }, 'Failed to fetch public chat messages');
        throw error;
      }
    }
  );

  // POST /api/public-chat - Post a message to public chat
  fastify.post<{ Body: PublicChatMessageBody }>(
    '/api/public-chat',
    {
      schema: {
        description: 'Post a message to public chat',
        tags: ['public-chat'],
        body: {
          type: 'object',
          required: ['user_name', 'message'],
          properties: {
            user_name: { type: 'string', description: 'Username' },
            message: { type: 'string', maxLength: 500, description: 'Message (max 500 chars)' },
          },
        },
        response: {
          201: { type: 'object' },
          400: { type: 'object' },
        },
      },
    },
    async (request: FastifyRequest<{ Body: PublicChatMessageBody }>, reply: FastifyReply) => {
      const { user_name, message } = request.body;

      // Validate required fields
      if (!user_name || !message) {
        app.logger.warn({ body: request.body }, 'Missing required fields for public chat message');
        reply.status(400);
        return { error: 'user_name and message are required' };
      }

      // Validate message length
      if (message.length > 500) {
        app.logger.warn({ messageLength: message.length }, 'Message exceeds max length');
        reply.status(400);
        return { error: 'Message must be 500 characters or less' };
      }

      app.logger.info({ user_name }, 'Creating public chat message');

      try {
        const result = await app.db
          .insert(schema.publicChat)
          .values({
            userName: user_name.trim(),
            message: message.trim(),
            createdAt: new Date(),
          })
          .returning();

        const msg = result[0];
        app.logger.info({ messageId: msg.id, user_name }, 'Public chat message created');

        reply.status(201);
        return {
          id: msg.id,
          user_name: msg.userName,
          message: msg.message,
          created_at: msg.createdAt instanceof Date ? msg.createdAt.toISOString() : new Date(msg.createdAt).toISOString(),
        };
      } catch (error) {
        app.logger.error({ err: error, user_name }, 'Failed to create public chat message');
        throw error;
      }
    }
  );
}
