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

export function register(app: App, fastify: FastifyInstance) {
  const requireAuth = app.requireAuth();

  // GET /api/program - Get all program items ordered by category and order
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
          .orderBy(schema.politicalProgram.category);

        // Sort by order within each category in memory
        const sorted = result.sort((a, b) => {
          if (a.category !== b.category) {
            return a.category.localeCompare(b.category);
          }
          return (a.order || 0) - (b.order || 0);
        });

        app.logger.info(
          { count: result.length },
          'Program items fetched successfully'
        );
        return sorted;
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
          200: { type: 'object' },
        },
      },
    },
    async (request, reply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

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
        return result[0];
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
        description: 'Update a political program item (admin only)',
        tags: ['program'],
        params: {
          type: 'object',
          properties: {
            id: { type: 'string' },
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
        },
      },
    },
    async (request, reply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      const { id } = request.params;
      const updates = request.body;
      app.logger.info({ itemId: id }, 'Updating program item');

      try {
        const result = await app.db
          .update(schema.politicalProgram)
          .set(updates)
          .where(eq(schema.politicalProgram.id, id))
          .returning();

        app.logger.info(
          { itemId: id },
          'Program item updated successfully'
        );
        return result[0];
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
        description: 'Delete a political program item (admin only)',
        tags: ['program'],
        params: {
          type: 'object',
          properties: {
            id: { type: 'string' },
          },
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
      app.logger.info({ itemId: id }, 'Deleting program item');

      try {
        const result = await app.db
          .delete(schema.politicalProgram)
          .where(eq(schema.politicalProgram.id, id))
          .returning();

        app.logger.info(
          { itemId: id },
          'Program item deleted successfully'
        );
        return result[0];
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
