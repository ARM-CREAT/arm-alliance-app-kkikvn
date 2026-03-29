import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { eq, desc } from 'drizzle-orm';
import * as schema from '../db/schema.js';
import type { App } from '../index.js';

interface CreatePoliticalMessageBody {
  title: string;
  content: string;
}

interface UpdatePoliticalMessageBody {
  title?: string;
  content?: string;
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
            items: { type: 'object' },
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
          created_at: m.createdAt.toISOString(),
        }));
      } catch (error) {
        app.logger.error({ err: error }, 'Failed to fetch political messages');
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
          },
        },
        response: {
          201: { type: 'object' },
          401: { type: 'object' },
        },
      },
    },
    async (request: FastifyRequest<{ Body: CreatePoliticalMessageBody }>, reply: FastifyReply) => {
      if (!verifyAdminPassword(request, reply)) return;

      const { title, content } = request.body;

      app.logger.info({ title }, 'Creating political message');

      try {
        const now = new Date();
        const result = await app.db
          .insert(schema.politicalMessages)
          .values({
            title,
            content,
            published: true,
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
          created_at: message.createdAt.toISOString(),
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
          },
        },
        response: {
          200: { type: 'object' },
          401: { type: 'object' },
          404: { type: 'object' },
        },
      },
    },
    async (request: FastifyRequest<{ Params: { id: string }; Body: UpdatePoliticalMessageBody }>, reply: FastifyReply) => {
      if (!verifyAdminPassword(request, reply)) return;

      const { id } = request.params;
      const { title, content } = request.body;

      app.logger.info({ messageId: id }, 'Updating political message');

      try {
        const updates: any = {};
        if (title !== undefined) updates.title = title;
        if (content !== undefined) updates.content = content;
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
          created_at: message.createdAt.toISOString(),
        };
      } catch (error) {
        app.logger.error({ err: error, messageId: id }, 'Failed to update political message');
        throw error;
      }
    }
  );

  // DELETE /api/political-messages/:id - Delete political message (admin only, no body)
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
          200: { type: 'object' },
          401: { type: 'object' },
          404: { type: 'object' },
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
    // Check if already seeded
    const existing = await app.db.select().from(schema.politicalMessages);

    if (existing.length === 0) {
      app.logger.info('Seeding political_messages table');

      const now = new Date();
      const seedData = [
        {
          title: 'Notre vision pour le Mali',
          content: "L'Alliance ARM s'engage à construire un Mali démocratique, prospère et uni, où chaque citoyen a sa place et peut contribuer au développement national.",
          published: true,
          createdAt: now,
          updatedAt: now,
        },
        {
          title: 'Appel à l\'unité nationale',
          content: 'Face aux défis actuels, nous appelons tous les Maliens à l\'unité et à la solidarité. Ensemble, nous pouvons surmonter les obstacles et bâtir un avenir meilleur.',
          published: true,
          createdAt: now,
          updatedAt: now,
        },
        {
          title: 'Programme économique de l\'Alliance',
          content: "Notre programme économique vise à créer des emplois, développer l'agriculture, et améliorer les infrastructures dans toutes les régions du Mali.",
          published: true,
          createdAt: now,
          updatedAt: now,
        },
      ];

      await app.db.insert(schema.politicalMessages).values(seedData);
      app.logger.info({ count: seedData.length }, 'Political messages seeded');
    }
  } catch (error) {
    app.logger.error({ err: error }, 'Failed to seed political_messages');
  }
}
