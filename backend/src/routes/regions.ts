import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { eq } from 'drizzle-orm';
import * as schema from '../db/schema.js';
import type { App } from '../index.js';

interface RegionBody {
  name: string;
  cercles: Array<{
    name: string;
    communes: string[];
  }>;
}

export function register(app: App, fastify: FastifyInstance) {
  const requireAuth = app.requireAuth();

  // POST /api/regions - Create region (admin)
  fastify.post<{ Body: RegionBody }>(
    '/api/regions',
    {
      schema: {
        description: 'Create a region (admin only)',
        tags: ['regions'],
        body: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            cercles: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  communes: {
                    type: 'array',
                    items: { type: 'string' },
                  },
                },
              },
            },
          },
          required: ['name', 'cercles'],
        },
        response: {
          200: { type: 'object' },
        },
      },
    },
    async (request, reply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      const { name, cercles } = request.body;
      app.logger.info({ name }, 'Creating region');

      try {
        const result = await app.db
          .insert(schema.regions)
          .values({
            name,
            cercles: cercles as any,
          })
          .returning();

        app.logger.info(
          { regionId: result[0].id, name },
          'Region created successfully'
        );
        return result[0];
      } catch (error) {
        app.logger.error(
          { err: error, name },
          'Failed to create region'
        );
        throw error;
      }
    }
  );
}
