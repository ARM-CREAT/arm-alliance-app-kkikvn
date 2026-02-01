import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { eq } from 'drizzle-orm';
import * as schema from '../db/schema.js';
import type { App } from '../index.js';

export function register(app: App, fastify: FastifyInstance) {
  // GET /api/regions - Get all regions with member counts
  fastify.get(
    '/api/regions',
    {
      schema: {
        description: 'Get all regions with member counts',
        tags: ['geography'],
        response: {
          200: { type: 'array' },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      app.logger.info('Fetching all regions');

      try {
        const result = await app.db
          .select()
          .from(schema.regionsTable);

        app.logger.info(
          { count: result.length },
          'Regions fetched successfully'
        );
        return result;
      } catch (error) {
        app.logger.error({ err: error }, 'Failed to fetch regions');
        throw error;
      }
    }
  );

  // GET /api/regions/:regionId/cercles - Get cercles in a region
  fastify.get<{ Params: { regionId: string } }>(
    '/api/regions/:regionId/cercles',
    {
      schema: {
        description: 'Get cercles in a region',
        tags: ['geography'],
        params: {
          type: 'object',
          properties: {
            regionId: { type: 'string' },
          },
        },
        response: {
          200: { type: 'array' },
        },
      },
    },
    async (
      request: FastifyRequest<{ Params: { regionId: string } }>,
      reply: FastifyReply
    ) => {
      const { regionId } = request.params;
      app.logger.info({ regionId }, 'Fetching cercles');

      try {
        const result = await app.db
          .select()
          .from(schema.cercles)
          .where(eq(schema.cercles.regionId, regionId as any));

        app.logger.info(
          { regionId, count: result.length },
          'Cercles fetched successfully'
        );
        return result;
      } catch (error) {
        app.logger.error(
          { err: error, regionId },
          'Failed to fetch cercles'
        );
        throw error;
      }
    }
  );

  // GET /api/cercles/:cercleId/communes - Get communes in a cercle
  fastify.get<{ Params: { cercleId: string } }>(
    '/api/cercles/:cercleId/communes',
    {
      schema: {
        description: 'Get communes in a cercle',
        tags: ['geography'],
        params: {
          type: 'object',
          properties: {
            cercleId: { type: 'string' },
          },
        },
        response: {
          200: { type: 'array' },
        },
      },
    },
    async (
      request: FastifyRequest<{ Params: { cercleId: string } }>,
      reply: FastifyReply
    ) => {
      const { cercleId } = request.params;
      app.logger.info({ cercleId }, 'Fetching communes');

      try {
        const result = await app.db
          .select()
          .from(schema.communes)
          .where(eq(schema.communes.cercleId, cercleId as any));

        app.logger.info(
          { cercleId, count: result.length },
          'Communes fetched successfully'
        );
        return result;
      } catch (error) {
        app.logger.error(
          { err: error, cercleId },
          'Failed to fetch communes'
        );
        throw error;
      }
    }
  );

  // GET /api/cartography - Full geographic breakdown with member distribution
  fastify.get(
    '/api/cartography',
    {
      schema: {
        description: 'Get full geographic breakdown with member distribution',
        tags: ['geography'],
        response: {
          200: {
            type: 'object',
            properties: {
              regions: { type: 'array' },
              totalMembers: { type: 'number' },
            },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      app.logger.info('Fetching cartography data');

      try {
        const regions = await app.db.select().from(schema.regionsTable);
        const cerclesList = await app.db.select().from(schema.cercles);
        const communesList = await app.db.select().from(schema.communes);

        // Build hierarchical structure
        const cartography = regions.map(region => ({
          ...region,
          cercles: cerclesList
            .filter(c => c.regionId === region.id)
            .map(cercle => ({
              ...cercle,
              communes: communesList.filter(c => c.cercleId === cercle.id),
            })),
        }));

        // Count total members
        const members = await app.db.select().from(schema.memberProfiles);
        const totalMembers = members.length;

        app.logger.info(
          { regionCount: regions.length, totalMembers },
          'Cartography data fetched'
        );

        return {
          regions: cartography,
          totalMembers,
        };
      } catch (error) {
        app.logger.error({ err: error }, 'Failed to fetch cartography data');
        throw error;
      }
    }
  );
}
