import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { eq, asc, isNull, desc } from 'drizzle-orm';
import * as schema from '../db/schema.js';
import type { App } from '../index.js';

interface ProgramBody {
  category?: string;
  title: string;
  description: string;
  order?: number;
  icon?: any;
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
    reply.status(401).send({ success: false, error: 'Non autorisé' });
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
    orderIndex: prog.order,
    icon: null,
    createdAt: prog.createdAt instanceof Date ? prog.createdAt.toISOString() : new Date(prog.createdAt).toISOString(),
  };
}

export function register(app: App, fastify: FastifyInstance) {
  // GET /api/program - Get all program items ordered by order ASC NULLS LAST then created_at ASC (public)
  fastify.get(
    '/api/program',
    {
      schema: {
        description: 'Get all political program items ordered by order and creation date',
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

        // Fetch all, ordered by order asc (nulls last), then created_at asc
        const result = await app.db
          .select()
          .from(schema.politicalProgram)
          .orderBy(
            isNull(schema.politicalProgram.order) ? desc(schema.politicalProgram.order) : asc(schema.politicalProgram.order),
            asc(schema.politicalProgram.createdAt)
          );

        app.logger.info({ count: result.length }, 'Program items fetched successfully');
        return {
          success: true,
          data: result.map(formatProgram),
          total: result.length,
        };
      } catch (error) {
        app.logger.error({ err: error }, 'Failed to fetch program');
        throw error;
      }
    }
  );

  // GET /api/program/:id - Get single program item (public)
  fastify.get<{ Params: { id: string } }>(
    '/api/program/:id',
    {
      schema: {
        description: 'Get a single political program item by ID',
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
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params;
      app.logger.info({ itemId: id }, 'Fetching program item');

      try {
        const result = await app.db
          .select()
          .from(schema.politicalProgram)
          .where(eq(schema.politicalProgram.id, id));

        if (result.length === 0) {
          app.logger.warn({ itemId: id }, 'Program item not found');
          reply.status(404);
          return { success: false, error: 'Programme politique non trouvé' };
        }

        app.logger.info({ itemId: id }, 'Program item fetched successfully');
        return { success: true, data: formatProgram(result[0]) };
      } catch (error) {
        app.logger.error({ err: error, itemId: id }, 'Failed to fetch program item');
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
            icon: { type: 'string' },
          },
          required: ['title', 'description'],
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

      const { title, description, order } = request.body;
      const category = request.body.category || 'general';

      if (!title || !description) {
        app.logger.warn({ body: request.body }, 'Missing required fields for program creation');
        reply.status(400);
        return { success: false, error: 'Missing required fields: title, description' };
      }

      app.logger.info({ title, category }, 'Creating program item');

      try {
        const result = await app.db
          .insert(schema.politicalProgram)
          .values({
            category,
            title,
            description,
            order: order || null,
            createdBy: 'admin',
          })
          .returning();

        app.logger.info({ itemId: result[0].id, title }, 'Program item created successfully');
        reply.status(201);
        return {
          success: true,
          message: 'Programme politique créé avec succès',
          data: formatProgram(result[0]),
        };
      } catch (error) {
        app.logger.error({ err: error, title }, 'Failed to create program');
        throw error;
      }
    }
  );

  // PUT /api/program/:id - Update program item (admin only)
  fastify.put<{ Params: { id: string }; Body: Partial<ProgramBody> }>(
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
            icon: { type: 'string' },
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
      const updates: any = {};

      if (request.body.category !== undefined) updates.category = request.body.category;
      if (request.body.title !== undefined) updates.title = request.body.title;
      if (request.body.description !== undefined) updates.description = request.body.description;
      if (request.body.order !== undefined) updates.order = request.body.order;

      if (Object.keys(updates).length === 0) {
        app.logger.warn({ itemId: id }, 'No fields to update');
        reply.status(400);
        return { success: false, error: 'No fields to update' };
      }

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
          return { success: false, error: 'Programme politique non trouvé' };
        }

        app.logger.info({ itemId: id }, 'Program item updated successfully');
        return {
          success: true,
          message: 'Programme politique mis à jour avec succès',
          data: formatProgram(result[0]),
        };
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
          return { success: false, error: 'Programme politique non trouvé' };
        }

        app.logger.info({ itemId: id }, 'Program item deleted successfully');
        return { success: true, message: 'Programme politique supprimé' };
      } catch (error) {
        app.logger.error({ err: error, itemId: id }, 'Failed to delete program');
        throw error;
      }
    }
  );
}
