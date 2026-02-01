import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { eq } from 'drizzle-orm';
import * as schema from '../db/schema.js';
import type { App } from '../index.js';

interface CreateMemberBody {
  name: string;
  email: string;
  phone: string;
  region: string;
  cercle?: string;
  commune?: string;
}

interface UpdateStatusBody {
  status: 'approved' | 'rejected';
}

export function register(app: App, fastify: FastifyInstance) {
  const requireAuth = app.requireAuth();

  // POST /api/membership - Create a new membership application
  fastify.post<{ Body: CreateMemberBody }>(
    '/api/membership',
    {
      schema: {
        description: 'Create a new membership application',
        tags: ['membership'],
        body: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            email: { type: 'string' },
            phone: { type: 'string' },
            region: { type: 'string' },
            cercle: { type: 'string' },
            commune: { type: 'string' },
          },
          required: ['name', 'email', 'phone', 'region'],
        },
        response: {
          200: { type: 'object' },
        },
      },
    },
    async (request, reply) => {
      const { name, email, phone, region, cercle, commune } = request.body;
      app.logger.info(
        { email, region },
        'Creating membership application'
      );

      try {
        const result = await app.db
          .insert(schema.members)
          .values({
            name,
            email,
            phone,
            region,
            cercle,
            commune,
          })
          .returning();

        app.logger.info(
          { memberId: result[0].id },
          'Membership application created'
        );
        return result[0];
      } catch (error) {
        app.logger.error(
          { err: error, email },
          'Failed to create membership application'
        );
        throw error;
      }
    }
  );

  // GET /api/membership - Get all members (admin only)
  fastify.get<{ Querystring: { status?: string } }>(
    '/api/membership',
    {
      schema: {
        description: 'Get all members (admin only)',
        tags: ['membership'],
        querystring: {
          type: 'object',
          properties: {
            status: { type: 'string' },
          },
        },
        response: {
          200: { type: 'array' },
        },
      },
    },
    async (request, reply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      const { status } = request.query;
      app.logger.info({ status }, 'Fetching members');

      try {
        let query = app.db.select().from(schema.members);
        if (status) {
          query = query.where(eq(schema.members.status, status)) as any;
        }
        const result = await query;
        app.logger.info({ count: result.length }, 'Members fetched successfully');
        return result;
      } catch (error) {
        app.logger.error({ err: error }, 'Failed to fetch members');
        throw error;
      }
    }
  );

  // PUT /api/membership/:id/status - Approve or reject membership (admin)
  fastify.put<{ Params: { id: string }; Body: UpdateStatusBody }>(
    '/api/membership/:id/status',
    {
      schema: {
        description: 'Update membership status (admin only)',
        tags: ['membership'],
        params: {
          type: 'object',
          properties: {
            id: { type: 'string' },
          },
        },
        body: {
          type: 'object',
          properties: {
            status: { type: 'string', enum: ['approved', 'rejected'] },
          },
          required: ['status'],
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
      const { status } = request.body;
      app.logger.info({ memberId: id, status }, 'Updating membership status');

      try {
        const result = await app.db
          .update(schema.members)
          .set({ status })
          .where(eq(schema.members.id, id))
          .returning();

        app.logger.info(
          { memberId: id, status },
          'Membership status updated'
        );
        return result[0];
      } catch (error) {
        app.logger.error(
          { err: error, memberId: id },
          'Failed to update membership status'
        );
        throw error;
      }
    }
  );
}
