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

function formatMember(member: any) {
  return {
    id: member.id,
    userId: member.userId || null,
    fullName: member.fullName,
    nina: member.nina || null,
    commune: member.commune,
    profession: member.profession,
    phone: member.phone,
    email: member.email || null,
    membershipNumber: member.membershipNumber,
    qrCode: member.qrCode || null,
    status: member.status,
    role: member.role,
    createdAt: member.createdAt instanceof Date ? member.createdAt.toISOString() : new Date(member.createdAt).toISOString(),
    updatedAt: member.updatedAt instanceof Date ? member.updatedAt.toISOString() : new Date(member.updatedAt).toISOString(),
  };
}

export function register(app: App, fastify: FastifyInstance) {
  const requireAuth = app.requireAuth();

  // GET /api/membership - Get all members (bearer token or admin password)
  fastify.get(
    '/api/membership',
    {
      schema: {
        description: 'Get all members (authenticated users or admin)',
        tags: ['membership'],
        response: {
          200: {
            type: 'object',
            properties: {
              members: { type: 'array' },
            },
          },
          401: { type: 'object' },
        },
      },
    },
    async (request, reply) => {
      // Check for admin password or bearer token
      const adminPassword = request.headers['x-admin-password'];
      const bearerToken = request.headers.authorization?.startsWith('Bearer ') ? request.headers.authorization.slice(7) : null;

      const isAdmin = adminPassword && adminPassword === ADMIN_PASSWORD;
      const hasAuth = isAdmin || bearerToken;

      if (!hasAuth) {
        reply.status(401).send({ error: 'Unauthorized' });
        return;
      }

      app.logger.info('Fetching all members');

      try {
        const result = await app.db.select().from(schema.memberProfiles);

        app.logger.info({ count: result.length }, 'Members fetched');
        return { members: result.map(formatMember) };
      } catch (error) {
        app.logger.error({ err: error }, 'Failed to fetch members');
        throw error;
      }
    }
  );

  // PUT /api/membership/:id/status - Update member status (bearer token or admin password)
  fastify.put<{ Params: { id: string }; Body: { status: string } }>(
    '/api/membership/:id/status',
    {
      schema: {
        description: 'Update member status (authenticated users or admin)',
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
            status: { type: 'string' },
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
      // Check for admin password or bearer token
      const adminPassword = request.headers['x-admin-password'];
      const bearerToken = request.headers.authorization?.startsWith('Bearer ') ? request.headers.authorization.slice(7) : null;

      const isAdmin = adminPassword && adminPassword === ADMIN_PASSWORD;
      const hasAuth = isAdmin || bearerToken;

      if (!hasAuth) {
        reply.status(401).send({ error: 'Unauthorized' });
        return;
      }

      const { id } = request.params;
      const { status } = request.body;

      // Map status values
      let mappedStatus = status;
      if (status === 'approved') mappedStatus = 'active';
      if (status === 'rejected') mappedStatus = 'suspended';

      app.logger.info({ memberId: id, status: mappedStatus }, 'Updating member status');

      try {
        const result = await app.db
          .update(schema.memberProfiles)
          .set({ status: mappedStatus, updatedAt: new Date() })
          .where(eq(schema.memberProfiles.id, id))
          .returning();

        if (result.length === 0) {
          app.logger.warn({ memberId: id }, 'Member not found');
          reply.status(404);
          return { error: 'Not found' };
        }

        app.logger.info({ memberId: id, status: mappedStatus }, 'Member status updated');
        return { member: formatMember(result[0]) };
      } catch (error) {
        app.logger.error({ err: error, memberId: id }, 'Failed to update member status');
        throw error;
      }
    }
  );

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

}
