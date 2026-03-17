import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { eq } from 'drizzle-orm';
import * as schema from '../db/schema.js';
import type { App } from '../index.js';

interface UpdateStatusBody {
  status: 'approved' | 'rejected' | 'suspended';
}

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

function verifyAdminPassword(request: FastifyRequest, reply: FastifyReply): boolean {
  const password = request.headers['x-admin-password'];
  if (!password || password !== ADMIN_PASSWORD) {
    reply.status(401).send({ error: 'Unauthorized' });
    return false;
  }
  return true;
}

function formatMemberCard(profile: any) {
  return {
    membershipNumber: profile.membershipNumber,
    fullName: profile.fullName,
    commune: profile.commune,
    profession: profile.profession,
    phone: profile.phone,
    email: profile.email || null,
    status: profile.status,
    joinedAt: profile.createdAt.toISOString(),
    photoUrl: null,
  };
}

export function register(app: App, fastify: FastifyInstance) {
  const requireAuth = app.requireAuth();

  // GET /api/membership/my-card - Get authenticated member's card (authenticated)
  fastify.get(
    '/api/membership/my-card',
    {
      schema: {
        description: 'Get authenticated member card',
        tags: ['membership'],
        response: {
          200: { type: 'object' },
          401: { type: 'object' },
          404: { type: 'object' },
        },
      },
    },
    async (request, reply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      const userId = session.user.id;
      app.logger.info({ userId }, 'Fetching authenticated member card');

      try {
        const result = await app.db
          .select()
          .from(schema.memberProfiles)
          .where(eq(schema.memberProfiles.userId, userId));

        if (result.length === 0) {
          app.logger.warn({ userId }, 'Member profile not found');
          reply.status(404);
          return { error: 'Not found' };
        }

        app.logger.info({ userId }, 'Authenticated member card fetched');
        return formatMemberCard(result[0]);
      } catch (error) {
        app.logger.error({ err: error, userId }, 'Failed to fetch member card');
        throw error;
      }
    }
  );

  // GET /api/membership - Get all members (admin only)
  fastify.get(
    '/api/membership',
    {
      schema: {
        description: 'Get all members (admin only)',
        tags: ['membership'],
        response: {
          200: { type: 'array' },
          401: { type: 'object' },
        },
      },
    },
    async (request, reply) => {
      if (!verifyAdminPassword(request, reply)) return;

      app.logger.info('Admin fetching all members');

      reply.header('Cache-Control', 'no-store');

      try {
        const result = await app.db
          .select()
          .from(schema.memberProfiles)
          .orderBy(schema.memberProfiles.createdAt);

        const formatted = result.map((p) => ({
          id: p.id,
          fullName: p.fullName,
          email: p.email || null,
          phone: p.phone,
          commune: p.commune,
          profession: p.profession,
          status: p.status,
          membershipNumber: p.membershipNumber,
          joinedAt: p.createdAt.toISOString(),
          nina: p.nina || null,
        }));

        app.logger.info({ count: formatted.length }, 'Admin members fetched');
        return formatted;
      } catch (error) {
        app.logger.error({ err: error }, 'Failed to fetch members');
        throw error;
      }
    }
  );

  // PUT /api/membership/:id/status - Update member status (admin only)
  fastify.put<{ Params: { id: string }; Body: UpdateStatusBody }>(
    '/api/membership/:id/status',
    {
      schema: {
        description: 'Update member status (admin only)',
        tags: ['membership'],
        params: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
          },
        },
        body: {
          type: 'object',
          properties: {
            status: { type: 'string', enum: ['approved', 'rejected', 'suspended'] },
          },
          required: ['status'],
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
      const { status } = request.body;
      app.logger.info({ memberId: id, status }, 'Updating member status');

      try {
        const result = await app.db
          .update(schema.memberProfiles)
          .set({ status })
          .where(eq(schema.memberProfiles.id, id))
          .returning();

        if (result.length === 0) {
          app.logger.warn({ memberId: id }, 'Member not found');
          reply.status(404);
          return { error: 'Not found' };
        }

        app.logger.info({ memberId: id, status }, 'Member status updated');
        return { success: true, id, status };
      } catch (error) {
        app.logger.error({ err: error, memberId: id }, 'Failed to update member status');
        throw error;
      }
    }
  );

}
