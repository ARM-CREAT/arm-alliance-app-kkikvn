import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { eq } from 'drizzle-orm';
import * as schema from '../db/schema.js';
import type { App } from '../index.js';

interface IdeologyUpdateBody {
  title?: string;
  content?: string;
}

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

function verifyAdminPassword(request: FastifyRequest, reply: FastifyReply): boolean {
  const password = request.headers['x-admin-password'];
  if (password !== ADMIN_PASSWORD) {
    reply.status(401).send({
      error: 'Unauthorized',
      message: 'Invalid admin password',
    });
    return false;
  }
  return true;
}

function formatSection(section: any) {
  return {
    key: section.key,
    title: section.title,
    content: section.content,
    updatedAt: section.updatedAt.toISOString(),
  };
}

export async function seedAppContent(app: App) {
  try {
    const existing = await app.db.select().from(schema.appContent);
    if (existing.length === 0) {
      const sampleContent = [
        {
          key: 'fondements',
          title: 'Fondements de l\'idéologie',
          content: 'L\'Alliance pour le Rassemblement Malien est un mouvement politique...',
        },
        {
          key: 'piliers',
          title: 'Les Trois Piliers',
          content: 'Fraternité, Liberté, Égalité',
        },
        {
          key: 'priorites',
          title: 'Grandes Priorités',
          content: 'Rassembler, Refonder l\'État, Éduquer pour libérer',
        },
        {
          key: 'discours',
          title: 'Discours Officiel du Président',
          content: 'Chers compatriotes, Chers militants...',
        },
      ];

      await app.db.insert(schema.appContent).values(sampleContent);
      app.logger.info({ count: sampleContent.length }, 'Sample content seeded');
    }
  } catch (error) {
    app.logger.error({ err: error }, 'Failed to seed app content');
  }
}

export function register(app: App, fastify: FastifyInstance) {
  // GET /api/ideology - Get all ideology sections (public)
  fastify.get(
    '/api/ideology',
    {
      schema: {
        description: 'Get all ideology sections',
        tags: ['ideology'],
        response: {
          200: { type: 'object' },
        },
      },
    },
    async (request, reply) => {
      app.logger.info('Fetching ideology sections');

      try {
        const result = await app.db
          .select()
          .from(schema.appContent)
          .orderBy(schema.appContent.key);

        app.logger.info(
          { count: result.length },
          'Ideology sections fetched successfully'
        );
        return { sections: result.map(formatSection) };
      } catch (error) {
        app.logger.error({ err: error }, 'Failed to fetch ideology sections');
        throw error;
      }
    }
  );

  // PUT /api/admin/ideology/:key - Upsert ideology section (admin)
  fastify.put<{ Params: { key: string }; Body: IdeologyUpdateBody }>(
    '/api/admin/ideology/:key',
    {
      schema: {
        description: 'Update or create an ideology section (admin only)',
        tags: ['admin', 'ideology'],
        params: {
          type: 'object',
          properties: {
            key: { type: 'string' },
          },
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
          400: { type: 'object' },
          401: { type: 'object' },
        },
      },
    },
    async (request, reply) => {
      if (!verifyAdminPassword(request, reply)) return;

      const { key } = request.params;
      const { title, content } = request.body;

      if (!title && !content) {
        reply.status(400);
        return {
          error: 'BadRequest',
          message: 'At least one of title or content is required',
        };
      }

      app.logger.info({ key }, 'Upserting ideology section');

      try {
        // Check if exists
        const existing = await app.db
          .select()
          .from(schema.appContent)
          .where(eq(schema.appContent.key, key));

        let result;
        if (existing.length > 0) {
          // Update
          result = await app.db
            .update(schema.appContent)
            .set({
              ...(title && { title }),
              ...(content && { content }),
              updatedAt: new Date(),
            })
            .where(eq(schema.appContent.key, key))
            .returning();
        } else {
          // Insert
          if (!title || !content) {
            reply.status(400);
            return {
              error: 'BadRequest',
              message: 'Both title and content are required when creating a new section',
            };
          }

          result = await app.db
            .insert(schema.appContent)
            .values({
              key,
              title,
              content,
            })
            .returning();
        }

        app.logger.info({ key }, 'Ideology section upserted successfully');
        return { section: formatSection(result[0]) };
      } catch (error) {
        app.logger.error(
          { err: error, key },
          'Failed to upsert ideology section'
        );
        throw error;
      }
    }
  );
}
