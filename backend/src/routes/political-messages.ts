import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { eq, desc } from 'drizzle-orm';
import * as schema from '../db/schema.js';
import type { App } from '../index.js';

interface CreatePoliticalMessageBody {
  title: string;
  content: string;
  author: string;
  published?: boolean;
}

interface UpdatePoliticalMessageBody {
  title?: string;
  content?: string;
  author?: string;
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
  // GET /api/political-messages - Public endpoint (only published)
  fastify.get(
    '/api/political-messages',
    {
      schema: {
        description: 'Get political messages',
        tags: ['political-messages'],
        response: {
          200: {
            type: 'object',
            properties: {
              messages: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string', format: 'uuid' },
                    title: { type: 'string' },
                    content: { type: 'string' },
                    author: { type: 'string' },
                    published: { type: 'boolean' },
                    created_at: { type: 'string', format: 'date-time' },
                    updated_at: { type: 'string', format: 'date-time' },
                  },
                },
              },
            },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      app.logger.info('Fetching political messages');

      try {
        const messages = await app.db
          .select()
          .from(schema.politicalMessages)
          .where(eq(schema.politicalMessages.published, true))
          .orderBy(desc(schema.politicalMessages.createdAt));

        app.logger.info({ count: messages.length }, 'Political messages retrieved');
        return { messages };
      } catch (error) {
        app.logger.error({ err: error }, 'Failed to fetch political messages');
        throw error;
      }
    }
  );

  // POST /api/political-messages - Admin only
  fastify.post<{ Body: CreatePoliticalMessageBody }>(
    '/api/political-messages',
    {
      schema: {
        description: 'Create political message (admin only)',
        tags: ['political-messages'],
        body: {
          type: 'object',
          required: ['title', 'content', 'author'],
          properties: {
            title: { type: 'string' },
            content: { type: 'string' },
            author: { type: 'string' },
            published: { type: 'boolean' },
          },
        },
        response: {
          201: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              title: { type: 'string' },
              content: { type: 'string' },
              author: { type: 'string' },
              published: { type: 'boolean' },
              created_at: { type: 'string', format: 'date-time' },
              updated_at: { type: 'string', format: 'date-time' },
            },
          },
          401: {
            type: 'object',
            properties: { error: { type: 'string' } },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      if (!verifyAdminPassword(request, reply)) return;

      const body = request.body as CreatePoliticalMessageBody;
      const { title, content, author, published } = body;
      app.logger.info({ title }, 'Creating political message');

      try {
        const result = await app.db
          .insert(schema.politicalMessages)
          .values({
            title,
            content,
            author,
            published: published ?? true,
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
          created_at: message.createdAt,
          updated_at: message.updatedAt,
        };
      } catch (error) {
        app.logger.error({ err: error, title }, 'Failed to create political message');
        throw error;
      }
    }
  );

  // PUT /api/political-messages/:id - Admin only
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
            author: { type: 'string' },
            published: { type: 'boolean' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              title: { type: 'string' },
              content: { type: 'string' },
              author: { type: 'string' },
              published: { type: 'boolean' },
              created_at: { type: 'string', format: 'date-time' },
              updated_at: { type: 'string', format: 'date-time' },
            },
          },
          401: {
            type: 'object',
            properties: { error: { type: 'string' } },
          },
          404: {
            type: 'object',
            properties: { error: { type: 'string' } },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      if (!verifyAdminPassword(request, reply)) return;

      const { id } = request.params as { id: string };
      const updateBody = request.body as UpdatePoliticalMessageBody;

      app.logger.info({ messageId: id }, 'Updating political message');

      try {
        const updates: any = {};
        if (updateBody.title !== undefined) updates.title = updateBody.title;
        if (updateBody.content !== undefined) updates.content = updateBody.content;
        if (updateBody.author !== undefined) updates.author = updateBody.author;
        if (updateBody.published !== undefined) updates.published = updateBody.published;
        updates.updatedAt = new Date();

        const result = await app.db
          .update(schema.politicalMessages)
          .set(updates)
          .where(eq(schema.politicalMessages.id, id))
          .returning();

        if (result.length === 0) {
          reply.status(404);
          return { error: 'Political message not found' };
        }

        const message = result[0];
        app.logger.info({ messageId: id }, 'Political message updated');

        return {
          id: message.id,
          title: message.title,
          content: message.content,
          author: message.author,
          published: message.published,
          created_at: message.createdAt,
          updated_at: message.updatedAt,
        };
      } catch (error) {
        app.logger.error({ err: error, messageId: id }, 'Failed to update political message');
        throw error;
      }
    }
  );

  // DELETE /api/political-messages/:id - Admin only
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
          200: {
            type: 'object',
            properties: { success: { type: 'boolean' } },
          },
          401: {
            type: 'object',
            properties: { error: { type: 'string' } },
          },
          404: {
            type: 'object',
            properties: { error: { type: 'string' } },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      if (!verifyAdminPassword(request, reply)) return;

      const { id } = request.params as { id: string };

      app.logger.info({ messageId: id }, 'Deleting political message');

      try {
        const result = await app.db
          .delete(schema.politicalMessages)
          .where(eq(schema.politicalMessages.id, id))
          .returning();

        if (result.length === 0) {
          reply.status(404);
          return { error: 'Political message not found' };
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

      const seedData = [
        {
          title: 'Notre vision pour un Mali souverain et prospère',
          content: 'Le Mali traverse une période charnière de son histoire. L\'Alliance ARM s\'engage à défendre la souveraineté nationale, à promouvoir une gouvernance transparente et à mettre en place des politiques économiques qui profitent à l\'ensemble de la population malienne. Ensemble, nous bâtirons un Mali fort, uni et prospère.',
          author: 'Dr. Moussa Coulibaly, Président de l\'Alliance ARM',
          published: true,
        },
        {
          title: 'Message aux jeunes militants',
          content: 'La jeunesse malienne est l\'avenir de notre nation. C\'est pourquoi l\'Alliance ARM place la formation et l\'encadrement des jeunes au cœur de son programme. Nous vous invitons à rejoindre notre mouvement et à contribuer activement à la construction d\'un Mali meilleur pour les générations futures.',
          author: 'Aminata Diallo, Secrétaire Générale',
          published: true,
        },
        {
          title: 'Appel à l\'unité nationale',
          content: 'Face aux défis sécuritaires et économiques qui menacent notre pays, l\'heure est à l\'unité et à la solidarité. L\'Alliance ARM appelle tous les Maliens, sans distinction d\'ethnie, de région ou de religion, à se rassembler autour des valeurs communes de paix, de justice et de développement durable.',
          author: 'Ibrahim Traoré, Vice-Président',
          published: true,
        },
      ];

      await app.db.insert(schema.politicalMessages).values(seedData);
      app.logger.info({ count: seedData.length }, 'Political messages seeded');
    }
  } catch (error) {
    app.logger.error({ err: error }, 'Failed to seed political messages');
  }
}
