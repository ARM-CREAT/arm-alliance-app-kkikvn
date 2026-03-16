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

function formatProgramItem(item: any) {
  return {
    id: item.id,
    category: item.category,
    title: item.title,
    description: item.description,
    order: item.order,
    createdAt: item.createdAt.toISOString(),
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
      app.logger.info('Fetching political program items');

      try {
        const result = await app.db
          .select()
          .from(schema.politicalProgram)
          .orderBy(schema.politicalProgram.order);

        app.logger.info(
          { count: result.length },
          'Program items fetched successfully'
        );
        return result.map(formatProgramItem);
      } catch (error) {
        app.logger.error(
          { err: error },
          'Failed to fetch program items'
        );
        throw error;
      }
    }
  );

  // POST /api/program - Create program item (admin)
  fastify.post<{ Body: ProgramBody }>(
    '/api/program',
    {
      schema: {
        description: 'Create a political program item (requires admin password)',
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
        },
      },
    },
    async (request, reply) => {
      if (!verifyAdminPassword(request, reply)) return;

      const { category, title, description, order } = request.body;
      app.logger.info({ category, title }, 'Creating program item');

      try {
        const result = await app.db
          .insert(schema.politicalProgram)
          .values({
            category,
            title,
            description,
            order: order || 0,
          })
          .returning();

        app.logger.info(
          { itemId: result[0].id, category },
          'Program item created successfully'
        );
        reply.status(201);
        return formatProgramItem(result[0]);
      } catch (error) {
        app.logger.error(
          { err: error, category },
          'Failed to create program item'
        );
        throw error;
      }
    }
  );

  // PUT /api/program/:id - Update program item (admin)
  fastify.put<{ Params: { id: string }; Body: Partial<ProgramBody> }>(
    '/api/program/:id',
    {
      schema: {
        description: 'Update a political program item (requires admin password)',
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
          return { error: 'NotFound', message: 'Program item not found' };
        }

        app.logger.info(
          { itemId: id },
          'Program item updated successfully'
        );
        return formatProgramItem(result[0]);
      } catch (error) {
        app.logger.error(
          { err: error, itemId: id },
          'Failed to update program item'
        );
        throw error;
      }
    }
  );

  // DELETE /api/program/:id - Delete program item (admin)
  fastify.delete<{ Params: { id: string } }>(
    '/api/program/:id',
    {
      schema: {
        description: 'Delete a political program item (requires admin password)',
        tags: ['program'],
        params: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
          },
        },
        response: {
          204: {},
          404: { type: 'object' },
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
          return { error: 'NotFound', message: 'Program item not found' };
        }

        app.logger.info(
          { itemId: id },
          'Program item deleted successfully'
        );
        reply.status(204);
        return;
      } catch (error) {
        app.logger.error(
          { err: error, itemId: id },
          'Failed to delete program item'
        );
        throw error;
      }
    }
  );
}
