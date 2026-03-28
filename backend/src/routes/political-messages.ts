import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { eq, desc } from 'drizzle-orm';
import * as schema from '../db/schema.js';
import type { App } from '../index.js';

interface CreatePoliticalMessageBody {
  title: string;
  content: string;
  author?: string | null;
  published?: boolean;
}

interface UpdatePoliticalMessageBody {
  title?: string;
  content?: string;
  author?: string | null;
  published?: boolean;
}

function verifyAdminPassword(request: FastifyRequest, reply: FastifyReply): boolean {
  const password = request.headers['x-admin-password'];
  if (!password || password !== 'admin123') {
    reply.status(401);
    return false;
  }
  return true;
}

export function register(app: App, fastify: FastifyInstance) {
  // GET /api/political-messages - Get all political messages ordered by created_at DESC
  fastify.get(
    '/api/political-messages',
    {
      schema: {
        description: 'Get all political messages',
        tags: ['political-messages'],
        response: {
          200: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string', format: 'uuid' },
                title: { type: 'string' },
                content: { type: 'string' },
                author: { type: ['string', 'null'] },
                published: { type: 'boolean' },
                created_at: { type: 'string', format: 'date-time' },
                updated_at: { type: 'string', format: 'date-time' },
              },
            },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      app.logger.info('Fetching all political messages');

      try {
        const messages = await app.db
          .select()
          .from(schema.politicalMessages)
          .orderBy(desc(schema.politicalMessages.createdAt));

        app.logger.info({ count: messages.length }, 'Political messages retrieved');

        return messages.map(m => ({
          id: m.id,
          title: m.title,
          content: m.content,
          author: m.author,
          published: m.published,
          created_at: m.createdAt.toISOString(),
          updated_at: m.updatedAt.toISOString(),
        }));
      } catch (error) {
        app.logger.error({ err: error }, 'Failed to fetch political messages');
        throw error;
      }
    }
  );

  // GET /api/political-messages/:id - Get single political message
  fastify.get<{ Params: { id: string } }>(
    '/api/political-messages/:id',
    {
      schema: {
        description: 'Get a political message by ID',
        tags: ['political-messages'],
        params: {
          type: 'object',
          required: ['id'],
          properties: { id: { type: 'string', format: 'uuid' } },
        },
        response: {
          200: { type: 'object' },
          404: { type: 'object', properties: { error: { type: 'string' } } },
        },
      },
    },
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const { id } = request.params;
      app.logger.info({ messageId: id }, 'Fetching political message');

      try {
        const messages = await app.db
          .select()
          .from(schema.politicalMessages)
          .where(eq(schema.politicalMessages.id, id));

        if (messages.length === 0) {
          app.logger.info({ messageId: id }, 'Political message not found');
          reply.status(404);
          return { error: 'Not found' };
        }

        const m = messages[0];
        return {
          id: m.id,
          title: m.title,
          content: m.content,
          author: m.author,
          published: m.published,
          created_at: m.createdAt.toISOString(),
          updated_at: m.updatedAt.toISOString(),
        };
      } catch (error) {
        app.logger.error({ err: error, messageId: id }, 'Failed to fetch political message');
        throw error;
      }
    }
  );

  // POST /api/political-messages - Create political message (admin only)
  fastify.post<{ Body: CreatePoliticalMessageBody }>(
    '/api/political-messages',
    {
      schema: {
        description: 'Create political message (admin only)',
        tags: ['political-messages'],
        body: {
          type: 'object',
          required: ['title', 'content'],
          properties: {
            title: { type: 'string' },
            content: { type: 'string' },
            author: { type: ['string', 'null'] },
            published: { type: 'boolean' },
          },
        },
        response: {
          201: { type: 'object' },
          400: { type: 'object', properties: { error: { type: 'string' } } },
          401: { type: 'object', properties: { error: { type: 'string' } } },
        },
      },
    },
    async (request: FastifyRequest<{ Body: CreatePoliticalMessageBody }>, reply: FastifyReply) => {
      if (!verifyAdminPassword(request, reply)) return;

      const { title, content, author, published } = request.body;

      if (!title || !content) {
        app.logger.warn({ title, content }, 'Missing required fields');
        reply.status(400);
        return { error: 'title and content are required' };
      }

      app.logger.info({ title }, 'Creating political message');

      try {
        const now = new Date();
        const result = await app.db
          .insert(schema.politicalMessages)
          .values({
            title,
            content,
            author: author ?? null,
            published: published ?? false,
            createdAt: now,
            updatedAt: now,
          })
          .returning();

        const message = result[0];
        app.logger.info({ messageId: message.id }, 'Political message created');

        reply.status(201);
        return {
          id: message.id,
          title: message.title,
          content: message.content,
          author: message.author,
          published: message.published,
          created_at: message.createdAt.toISOString(),
          updated_at: message.updatedAt.toISOString(),
        };
      } catch (error) {
        app.logger.error({ err: error, title }, 'Failed to create political message');
        throw error;
      }
    }
  );

  // PUT /api/political-messages/:id - Update political message (admin only)
  fastify.put<{ Params: { id: string }; Body: UpdatePoliticalMessageBody }>(
    '/api/political-messages/:id',
    {
      schema: {
        description: 'Update political message (admin only)',
        tags: ['political-messages'],
        params: {
          type: 'object',
          required: ['id'],
          properties: { id: { type: 'string', format: 'uuid' } },
        },
        body: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            content: { type: 'string' },
            author: { type: ['string', 'null'] },
            published: { type: 'boolean' },
          },
        },
        response: {
          200: { type: 'object' },
          401: { type: 'object', properties: { error: { type: 'string' } } },
          404: { type: 'object', properties: { error: { type: 'string' } } },
        },
      },
    },
    async (request: FastifyRequest<{ Params: { id: string }; Body: UpdatePoliticalMessageBody }>, reply: FastifyReply) => {
      if (!verifyAdminPassword(request, reply)) return;

      const { id } = request.params;
      const body = request.body;

      app.logger.info({ messageId: id }, 'Updating political message');

      try {
        const updates: any = {};
        if (body.title !== undefined) updates.title = body.title;
        if (body.content !== undefined) updates.content = body.content;
        if (body.author !== undefined) updates.author = body.author;
        if (body.published !== undefined) updates.published = body.published;
        updates.updatedAt = new Date();

        const result = await app.db
          .update(schema.politicalMessages)
          .set(updates)
          .where(eq(schema.politicalMessages.id, id))
          .returning();

        if (result.length === 0) {
          app.logger.info({ messageId: id }, 'Political message not found');
          reply.status(404);
          return { error: 'Not found' };
        }

        const message = result[0];
        app.logger.info({ messageId: id }, 'Political message updated');

        return {
          id: message.id,
          title: message.title,
          content: message.content,
          author: message.author,
          published: message.published,
          created_at: message.createdAt.toISOString(),
          updated_at: message.updatedAt.toISOString(),
        };
      } catch (error) {
        app.logger.error({ err: error, messageId: id }, 'Failed to update political message');
        throw error;
      }
    }
  );

  // DELETE /api/political-messages/:id - Delete political message (admin only)
  fastify.delete<{ Params: { id: string } }>(
    '/api/political-messages/:id',
    {
      schema: {
        description: 'Delete political message (admin only)',
        tags: ['political-messages'],
        params: {
          type: 'object',
          required: ['id'],
          properties: { id: { type: 'string', format: 'uuid' } },
        },
        response: {
          200: { type: 'object', properties: { success: { type: 'boolean' } } },
          401: { type: 'object', properties: { error: { type: 'string' } } },
          404: { type: 'object', properties: { error: { type: 'string' } } },
        },
      },
    },
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      if (!verifyAdminPassword(request, reply)) return;

      const { id } = request.params;

      app.logger.info({ messageId: id }, 'Deleting political message');

      try {
        const result = await app.db
          .delete(schema.politicalMessages)
          .where(eq(schema.politicalMessages.id, id))
          .returning();

        if (result.length === 0) {
          app.logger.info({ messageId: id }, 'Political message not found');
          reply.status(404);
          return { error: 'Not found' };
        }

        app.logger.info({ messageId: id }, 'Political message deleted');
        return { success: true };
      } catch (error) {
        app.logger.error({ err: error, messageId: id }, 'Failed to delete political message');
        throw error;
      }
    }
  );
}

export async function seedPoliticalMessages(app: App) {
  try {
    const count = await app.db.select().from(schema.politicalMessages);

    if (count.length === 0) {
      app.logger.info('Seeding political messages');

      const now = new Date();
      const seedData = [
        {
          title: 'Notre Vision pour le Mali',
          content: "L'Alliance pour la Refondation du Mali s'engage à construire un État fort, démocratique et au service de tous les citoyens maliens. Notre programme repose sur trois piliers fondamentaux: la sécurité, le développement économique et la justice sociale.",
          author: 'Direction Nationale ARM',
          published: true,
          createdAt: now,
          updatedAt: now,
        },
        {
          title: 'Message aux Militants',
          content: 'Chers militants et sympathisants, votre engagement quotidien est la force de notre mouvement. Ensemble, nous bâtissons le Mali de demain. Continuez à mobiliser vos communautés et à porter les valeurs de l\'ARM.',
          author: 'Secrétariat Général',
          published: true,
          createdAt: now,
          updatedAt: now,
        },
        {
          title: 'Appel à l\'Unité Nationale',
          content: 'Face aux défis qui se posent à notre nation, l\'ARM appelle à l\'unité de tous les Maliens. La division ne profite qu\'à nos adversaires. Unissons-nous autour de valeurs communes pour un Mali prospère et en paix.',
          author: null,
          published: true,
          createdAt: now,
          updatedAt: now,
        },
      ];

      await app.db.insert(schema.politicalMessages).values(seedData);
      app.logger.info({ count: seedData.length }, 'Political messages seeded');
    }
  } catch (error) {
    app.logger.error({ err: error }, 'Failed to seed political messages');
  }
}
