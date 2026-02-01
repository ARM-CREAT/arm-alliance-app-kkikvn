import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { eq } from 'drizzle-orm';
import * as schema from '../db/schema.js';
import type { App } from '../index.js';

interface LeadershipBody {
  name: string;
  position: string;
  phone?: string;
  address?: string;
  location?: string;
  order?: number;
}

export function register(app: App, fastify: FastifyInstance) {
  const requireAuth = app.requireAuth();

  // GET /api/leadership - Get all leadership members ordered by position
  fastify.get(
    '/api/leadership',
    {
      schema: {
        description: 'Get all leadership members',
        tags: ['leadership'],
        response: {
          200: { type: 'array' },
        },
      },
    },
    async (request, reply) => {
      app.logger.info('Fetching leadership members');

      try {
        const result = await app.db
          .select()
          .from(schema.leadership)
          .orderBy(schema.leadership.order);

        app.logger.info(
          { count: result.length },
          'Leadership members fetched successfully'
        );
        return result;
      } catch (error) {
        app.logger.error({ err: error }, 'Failed to fetch leadership members');
        throw error;
      }
    }
  );

  // POST /api/leadership - Create leader (admin)
  fastify.post<{ Body: LeadershipBody }>(
    '/api/leadership',
    {
      schema: {
        description: 'Create a leadership member (admin only)',
        tags: ['leadership'],
        body: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            position: { type: 'string' },
            phone: { type: 'string' },
            address: { type: 'string' },
            location: { type: 'string' },
            order: { type: 'number' },
          },
          required: ['name', 'position'],
        },
        response: {
          200: { type: 'object' },
        },
      },
    },
    async (request, reply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      const { name, position, phone, address, location, order } = request.body;
      app.logger.info({ position }, 'Creating leadership member');

      try {
        const result = await app.db
          .insert(schema.leadership)
          .values({
            name,
            position,
            phone,
            address,
            location,
            order: order || 0,
          })
          .returning();

        app.logger.info(
          { leaderId: result[0].id, position },
          'Leadership member created'
        );
        return result[0];
      } catch (error) {
        app.logger.error({ err: error, position }, 'Failed to create leader');
        throw error;
      }
    }
  );

  // PUT /api/leadership/:id - Update leader info (admin)
  fastify.put<{ Params: { id: string }; Body: Partial<LeadershipBody> }>(
    '/api/leadership/:id',
    {
      schema: {
        description: 'Update leadership member info (admin only)',
        tags: ['leadership'],
        params: {
          type: 'object',
          properties: {
            id: { type: 'string' },
          },
        },
        body: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            position: { type: 'string' },
            phone: { type: 'string' },
            address: { type: 'string' },
            location: { type: 'string' },
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
      app.logger.info({ leaderId: id }, 'Updating leadership member');

      try {
        const result = await app.db
          .update(schema.leadership)
          .set(updates)
          .where(eq(schema.leadership.id, id))
          .returning();

        app.logger.info(
          { leaderId: id },
          'Leadership member updated successfully'
        );
        return result[0];
      } catch (error) {
        app.logger.error(
          { err: error, leaderId: id },
          'Failed to update leadership member'
        );
        throw error;
      }
    }
  );

  // DELETE /api/leadership/:id - Delete leader (admin)
  fastify.delete<{ Params: { id: string } }>(
    '/api/leadership/:id',
    {
      schema: {
        description: 'Delete a leadership member (admin only)',
        tags: ['leadership'],
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
      app.logger.info({ leaderId: id }, 'Deleting leadership member');

      try {
        const result = await app.db
          .delete(schema.leadership)
          .where(eq(schema.leadership.id, id))
          .returning();

        app.logger.info(
          { leaderId: id },
          'Leadership member deleted successfully'
        );
        return result[0];
      } catch (error) {
        app.logger.error(
          { err: error, leaderId: id },
          'Failed to delete leadership member'
        );
        throw error;
      }
    }
  );
}
