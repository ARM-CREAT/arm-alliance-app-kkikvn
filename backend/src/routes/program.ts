import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { eq } from 'drizzle-orm';
import * as schema from '../db/schema.js';
import type { App } from '../index.js';

interface ProgramBody {
  category: string;
  title: string;
  description: string;
  order?: number;
}

interface ProgramUpdateBody {
  category?: string;
  title?: string;
  description?: string;
  order?: number;
}

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

const DEFAULT_PROGRAMS = [
  {
    category: 'Sécurité',
    title: 'Sécurité Nationale',
    description: 'Renforcer les forces de défense et de sécurité pour protéger l\'intégrité territoriale et assurer la paix dans toutes les régions du Mali.',
    order: 1,
  },
  {
    category: 'Économie',
    title: 'Développement Économique',
    description: 'Promouvoir une économie diversifiée, créer des emplois durables et soutenir les entrepreneurs maliens pour une croissance inclusive.',
    order: 2,
  },
  {
    category: 'Éducation',
    title: 'Éducation Pour Tous',
    description: 'Garantir un accès universel à une éducation de qualité, moderniser les infrastructures scolaires et valoriser les enseignants.',
    order: 3,
  },
];

function verifyAdminPassword(request: FastifyRequest, reply: FastifyReply): boolean {
  const password = request.headers['x-admin-password'];
  if (!password || password !== ADMIN_PASSWORD) {
    reply.status(401).send({ error: 'Unauthorized' });
    return false;
  }
  return true;
}

function formatProgram(prog: any) {
  return {
    id: prog.id,
    category: prog.category,
    title: prog.title,
    description: prog.description,
    order: prog.order,
  };
}

export function register(app: App, fastify: FastifyInstance) {
  // GET /api/program - Get all program items (public)
  fastify.get(
    '/api/program',
    {
      schema: {
        description: 'Get all political program items',
        tags: ['program'],
        response: {
          200: { type: 'array' },
        },
      },
    },
    async (request, reply) => {
      app.logger.info('Fetching program items');

      try {
        // Check if empty and seed
        const existingCount = await app.db.select().from(schema.politicalProgram);
        if (existingCount.length === 0) {
          app.logger.info('Program table empty, seeding defaults');
          await app.db
            .insert(schema.politicalProgram)
            .values(DEFAULT_PROGRAMS.map((p) => ({ ...p, createdBy: 'admin' })));
        }

        // Fetch all
        const result = await app.db
          .select()
          .from(schema.politicalProgram)
          .orderBy(schema.politicalProgram.order);

        app.logger.info({ count: result.length }, 'Program items fetched');
        return result.map(formatProgram);
      } catch (error) {
        app.logger.error({ err: error }, 'Failed to fetch program');
        throw error;
      }
    }
  );

  // POST /api/program - Create program item (admin only)
  fastify.post<{ Body: ProgramBody }>(
    '/api/program',
    {
      schema: {
        description: 'Create a political program item (admin only)',
        tags: ['program'],
        body: {
          type: 'object',
          properties: {
            category: { type: 'string' },
            title: { type: 'string' },
            description: { type: 'string' },
            order: { type: 'number' },
          },
          required: ['category', 'title', 'description'],
        },
        response: {
          201: { type: 'object' },
          400: { type: 'object' },
          401: { type: 'object' },
        },
      },
    },
    async (request, reply) => {
      if (!verifyAdminPassword(request, reply)) return;

      const { category, title, description, order } = request.body;

      if (!category || !title || !description) {
        reply.status(400);
        return { error: 'Missing required fields' };
      }

      app.logger.info({ title }, 'Creating program item');

      try {
        const result = await app.db
          .insert(schema.politicalProgram)
          .values({
            category,
            title,
            description,
            order: order || 0,
            createdBy: 'admin',
          })
          .returning();

        app.logger.info({ itemId: result[0].id }, 'Program item created');
        reply.status(201);
        return formatProgram(result[0]);
      } catch (error) {
        app.logger.error({ err: error, title }, 'Failed to create program');
        throw error;
      }
    }
  );

  // PUT /api/program/:id - Update program item (admin only)
  fastify.put<{ Params: { id: string }; Body: ProgramUpdateBody }>(
    '/api/program/:id',
    {
      schema: {
        description: 'Update a political program item (admin only)',
        tags: ['program'],
        params: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
          },
        },
        body: {
          type: 'object',
          properties: {
            category: { type: 'string' },
            title: { type: 'string' },
            description: { type: 'string' },
            order: { type: 'number' },
          },
        },
        response: {
          200: { type: 'object' },
          404: { type: 'object' },
          401: { type: 'object' },
        },
      },
    },
    async (request, reply) => {
      if (!verifyAdminPassword(request, reply)) return;

      const { id } = request.params;
      const updates = request.body;

      app.logger.info({ itemId: id }, 'Updating program item');

      try {
        const result = await app.db
          .update(schema.politicalProgram)
          .set(updates)
          .where(eq(schema.politicalProgram.id, id))
          .returning();

        if (result.length === 0) {
          app.logger.warn({ itemId: id }, 'Program item not found');
          reply.status(404);
          return { error: 'Not found' };
        }

        app.logger.info({ itemId: id }, 'Program item updated');
        return formatProgram(result[0]);
      } catch (error) {
        app.logger.error({ err: error, itemId: id }, 'Failed to update program');
        throw error;
      }
    }
  );

  // DELETE /api/program/:id - Delete program item (admin only)
  fastify.delete<{ Params: { id: string } }>(
    '/api/program/:id',
    {
      schema: {
        description: 'Delete a political program item (admin only)',
        tags: ['program'],
        params: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
          },
        },
        response: {
          200: { type: 'object' },
          404: { type: 'object' },
          401: { type: 'object' },
        },
      },
    },
    async (request, reply) => {
      if (!verifyAdminPassword(request, reply)) return;

      const { id } = request.params;
      app.logger.info({ itemId: id }, 'Deleting program item');

      try {
        const result = await app.db
          .delete(schema.politicalProgram)
          .where(eq(schema.politicalProgram.id, id))
          .returning();

        if (result.length === 0) {
          app.logger.warn({ itemId: id }, 'Program item not found');
          reply.status(404);
          return { error: 'Not found' };
        }

        app.logger.info({ itemId: id }, 'Program item deleted');
        return { success: true };
      } catch (error) {
        app.logger.error({ err: error, itemId: id }, 'Failed to delete program');
        throw error;
      }
    }
  );
}
