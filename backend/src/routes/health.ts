import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import type { App } from '../index.js';
import * as schema from '../db/schema.js';

export function register(app: App, fastify: FastifyInstance) {
  // GET /status - Health check endpoint
  fastify.get(
    '/status',
    {
      schema: {
        description: 'Status check endpoint - verifies backend is running',
        tags: ['system'],
        response: {
          200: {
            type: 'object',
            properties: {
              status: { type: 'string' },
              timestamp: { type: 'string' },
              uptime: { type: 'number' },
            },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const uptime = process.uptime();
      app.logger.debug({ uptime }, 'Health check request');

      reply.status(200).send({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: Math.round(uptime * 100) / 100,
      });
    }
  );

  // GET /api/health - API health check endpoint with more details
  fastify.get(
    '/api/health',
    {
      schema: {
        description: 'API health check endpoint - verifies database connectivity',
        tags: ['system'],
        response: {
          200: {
            type: 'object',
            properties: {
              status: { type: 'string' },
              timestamp: { type: 'string' },
              uptime: { type: 'number' },
              database: { type: 'string' },
            },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const uptime = process.uptime();

      try {
        // Test database connectivity by querying a simple count from members table
        await app.db.select().from(schema.members).limit(1);
        const dbStatus = 'connected';

        app.logger.debug({ uptime, database: dbStatus }, 'API health check passed');

        return reply.status(200).send({
          status: 'healthy',
          timestamp: new Date().toISOString(),
          uptime: Math.round(uptime * 100) / 100,
          database: dbStatus,
        });
      } catch (error) {
        app.logger.error(
          { err: error, uptime },
          'API health check failed - database connection issue'
        );

        return reply.status(503).send({
          status: 'unhealthy',
          timestamp: new Date().toISOString(),
          uptime: Math.round(uptime * 100) / 100,
          database: 'disconnected',
          error: 'Database connection failed',
        });
      }
    }
  );

  // GET /api/admin/health - Admin area health check (requires auth)
  fastify.get(
    '/api/admin/health',
    {
      schema: {
        description: 'Admin health check - verifies admin authentication and backend status',
        tags: ['admin', 'system'],
        response: {
          200: {
            type: 'object',
            properties: {
              status: { type: 'string' },
              timestamp: { type: 'string' },
              uptime: { type: 'number' },
              database: { type: 'string' },
              authentication: { type: 'string' },
            },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const uptime = process.uptime();

      // Check for admin headers
      const passwordHeader = request.headers['x-admin-password'];
      const secretHeader = request.headers['x-admin-secret'];

      app.logger.info(
        {
          hasPasswordHeader: !!passwordHeader,
          hasSecretHeader: !!secretHeader,
          uptime,
        },
        'Admin health check request'
      );

      try {
        // Test database connectivity by querying a simple count from members table
        await app.db.select().from(schema.members).limit(1);
        const dbStatus = 'connected';

        // Check admin credentials presence
        const authStatus = passwordHeader && secretHeader ? 'present' : 'missing';

        app.logger.info(
          { uptime, database: dbStatus, authentication: authStatus },
          'Admin health check passed'
        );

        return reply.status(200).send({
          status: 'healthy',
          timestamp: new Date().toISOString(),
          uptime: Math.round(uptime * 100) / 100,
          database: dbStatus,
          authentication: authStatus,
        });
      } catch (error) {
        app.logger.error(
          { err: error, uptime },
          'Admin health check failed'
        );

        return reply.status(503).send({
          status: 'unhealthy',
          timestamp: new Date().toISOString(),
          uptime: Math.round(uptime * 100) / 100,
          database: 'disconnected',
          error: 'Database connection failed',
        });
      }
    }
  );
}
