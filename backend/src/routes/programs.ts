import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { eq, asc } from 'drizzle-orm';
import * as schema from '../db/schema.js';
import type { App } from '../index.js';

interface ProgramBody {
  title: string;
  category: string;
  summary: string;
  content: string;
  icon?: string;
  color?: string;
  order?: number;
  published?: boolean;
}

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

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
    title: prog.title,
    category: prog.category,
    summary: prog.summary,
    content: prog.content,
    icon: prog.icon || null,
    color: prog.color || null,
    order: prog.order || 0,
    published: prog.published !== false,
    createdAt: prog.createdAt instanceof Date ? prog.createdAt.toISOString() : new Date(prog.createdAt).toISOString(),
    updatedAt: prog.updatedAt instanceof Date ? prog.updatedAt.toISOString() : new Date(prog.updatedAt).toISOString(),
  };
}

export function register(app: App, fastify: FastifyInstance) {
  // GET /api/programs - List all programs (public)
  fastify.get(
    '/api/programs',
    {
      schema: {
        description: 'Get all programs',
        tags: ['programs'],
        querystring: {
          type: 'object',
          properties: {
            category: { type: 'string' },
          },
        },
        response: {
          200: { type: 'array' },
        },
      },
    },
    async (request, reply) => {
      const { category } = request.query as { category?: string };
      app.logger.info({ category }, 'Fetching programs');

      try {
        let query = app.db.select().from(schema.programs).where(
          category ? eq(schema.programs.category, category) : undefined
        ).orderBy(asc(schema.programs.order));

        const result = await query;

        app.logger.info({ count: result.length }, 'Programs fetched successfully');
        return {
          success: true,
          data: result.map(formatProgram),
          total: result.length,
        };
      } catch (error) {
        app.logger.error({ err: error }, 'Failed to fetch programs');
        throw error;
      }
    }
  );

  // GET /api/programs/:id - Get single program (public)
  fastify.get<{ Params: { id: string } }>(
    '/api/programs/:id',
    {
      schema: {
        description: 'Get a single program by ID',
        tags: ['programs'],
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
      app.logger.info({ programId: id }, 'Fetching program');

      try {
        const result = await app.db
          .select()
          .from(schema.programs)
          .where(eq(schema.programs.id, id));

        if (result.length === 0) {
          app.logger.warn({ programId: id }, 'Program not found');
          reply.status(404);
          return { success: false, error: 'Programme non trouvé' };
        }

        app.logger.info({ programId: id }, 'Program fetched successfully');
        return { success: true, data: formatProgram(result[0]) };
      } catch (error) {
        app.logger.error({ err: error, programId: id }, 'Failed to fetch program');
        throw error;
      }
    }
  );

  // POST /api/programs - Create program (admin only)
  fastify.post<{ Body: ProgramBody }>(
    '/api/programs',
    {
      schema: {
        description: 'Create a program (admin only)',
        tags: ['programs'],
        body: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            category: { type: 'string' },
            summary: { type: 'string' },
            content: { type: 'string' },
            icon: { type: 'string' },
            color: { type: 'string' },
            order: { type: 'number' },
            published: { type: 'boolean' },
          },
          required: ['title', 'category', 'summary', 'content'],
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

      const { title, category, summary, content, icon, color, order, published } = request.body;

      if (!title || !category || !summary || !content) {
        app.logger.warn({ body: request.body }, 'Missing required fields for program creation');
        reply.status(400);
        return { success: false, error: 'Missing required fields: title, category, summary, content' };
      }

      app.logger.info({ title, category }, 'Creating program');

      try {
        const result = await app.db
          .insert(schema.programs)
          .values({
            title,
            category,
            summary,
            content,
            icon: icon || null,
            color: color || null,
            order: order || 0,
            published: published !== false,
          })
          .returning();

        app.logger.info({ programId: result[0].id, title }, 'Program created successfully');
        reply.status(201);
        return {
          success: true,
          message: 'Programme créé avec succès',
          data: formatProgram(result[0]),
        };
      } catch (error) {
        app.logger.error({ err: error, title }, 'Failed to create program');
        throw error;
      }
    }
  );

  // PUT /api/programs/:id - Update program (admin only)
  fastify.put<{ Params: { id: string }; Body: Partial<ProgramBody> }>(
    '/api/programs/:id',
    {
      schema: {
        description: 'Update a program (admin only)',
        tags: ['programs'],
        params: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
          },
        },
        body: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            category: { type: 'string' },
            summary: { type: 'string' },
            content: { type: 'string' },
            icon: { type: 'string' },
            color: { type: 'string' },
            order: { type: 'number' },
            published: { type: 'boolean' },
          },
        },
        response: {
          200: { type: 'object' },
          400: { type: 'object' },
          401: { type: 'object' },
          404: { type: 'object' },
        },
      },
    },
    async (request, reply) => {
      if (!verifyAdminPassword(request, reply)) return;

      const { id } = request.params;
      const updates: any = {};

      if (request.body.title !== undefined) updates.title = request.body.title;
      if (request.body.category !== undefined) updates.category = request.body.category;
      if (request.body.summary !== undefined) updates.summary = request.body.summary;
      if (request.body.content !== undefined) updates.content = request.body.content;
      if (request.body.icon !== undefined) updates.icon = request.body.icon;
      if (request.body.color !== undefined) updates.color = request.body.color;
      if (request.body.order !== undefined) updates.order = request.body.order;
      if (request.body.published !== undefined) updates.published = request.body.published;
      updates.updatedAt = new Date();

      if (Object.keys(updates).length === 1) {
        app.logger.warn({ programId: id }, 'No fields to update');
        reply.status(400);
        return { success: false, error: 'No fields to update' };
      }

      app.logger.info({ programId: id }, 'Updating program');

      try {
        const result = await app.db
          .update(schema.programs)
          .set(updates)
          .where(eq(schema.programs.id, id))
          .returning();

        if (result.length === 0) {
          app.logger.warn({ programId: id }, 'Program not found');
          reply.status(404);
          return { success: false, error: 'Programme non trouvé' };
        }

        app.logger.info({ programId: id }, 'Program updated successfully');
        return {
          success: true,
          message: 'Programme mis à jour avec succès',
          data: formatProgram(result[0]),
        };
      } catch (error) {
        app.logger.error({ err: error, programId: id }, 'Failed to update program');
        throw error;
      }
    }
  );

  // DELETE /api/programs/:id - Delete program (admin only)
  fastify.delete<{ Params: { id: string } }>(
    '/api/programs/:id',
    {
      schema: {
        description: 'Delete a program (admin only)',
        tags: ['programs'],
        params: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
          },
        },
        response: {
          200: { type: 'object' },
          401: { type: 'object' },
          404: { type: 'object' },
        },
      },
    },
    async (request, reply) => {
      if (!verifyAdminPassword(request, reply)) return;

      const { id } = request.params;
      app.logger.info({ programId: id }, 'Deleting program');

      try {
        const result = await app.db
          .delete(schema.programs)
          .where(eq(schema.programs.id, id))
          .returning();

        if (result.length === 0) {
          app.logger.warn({ programId: id }, 'Program not found');
          reply.status(404);
          return { success: false, error: 'Programme non trouvé' };
        }

        app.logger.info({ programId: id }, 'Program deleted successfully');
        return { success: true, message: 'Programme supprimé' };
      } catch (error) {
        app.logger.error({ err: error, programId: id }, 'Failed to delete program');
        throw error;
      }
    }
  );
}
