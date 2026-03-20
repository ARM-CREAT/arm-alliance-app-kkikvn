import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import * as schema from '../db/schema.js';
import type { App } from '../index.js';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

function verifyAdminPassword(request: FastifyRequest, reply: FastifyReply): boolean {
  const password = request.headers['x-admin-password'];
  if (!password || password !== ADMIN_PASSWORD) {
    reply.status(401).send({ success: false, error: 'Non autorisé' });
    return false;
  }
  return true;
}

function formatMember(member: any) {
  return {
    id: member.id,
    full_name: member.name,
    email: member.email,
    phone: member.phone,
    membership_date: member.membershipDate instanceof Date ? member.membershipDate.toISOString() : new Date(member.membershipDate).toISOString(),
    status: member.status,
    region: member.region,
    cercle: member.cercle || null,
    commune: member.commune || null,
  };
}

function formatMemberProfile(profile: any) {
  return {
    id: profile.id,
    user_id: profile.userId || null,
    full_name: profile.fullName,
    email: profile.email || null,
    phone: profile.phone,
    membership_number: profile.membershipNumber,
    status: profile.status,
    role: profile.role,
    commune: profile.commune,
    created_at: profile.createdAt instanceof Date ? profile.createdAt.toISOString() : new Date(profile.createdAt).toISOString(),
  };
}

export function register(app: App, fastify: FastifyInstance) {
  // GET /api/admin/memberships - Get all members (admin only)
  fastify.get(
    '/api/admin/memberships',
    {
      schema: {
        description: 'Get all members (admin only)',
        tags: ['admin', 'memberships'],
        response: {
          200: { type: 'object' },
          401: { type: 'object' },
        },
      },
    },
    async (request, reply) => {
      if (!verifyAdminPassword(request, reply)) return;

      app.logger.info('Fetching members (admin)');

      try {
        const result = await app.db.select().from(schema.members);

        app.logger.info({ count: result.length }, 'Members fetched successfully');
        return {
          success: true,
          data: result.map(formatMember),
          total: result.length,
        };
      } catch (error) {
        app.logger.error({ err: error }, 'Failed to fetch members');
        throw error;
      }
    }
  );

  // GET /api/admin/memberships/profiles - Get all member profiles (admin only)
  fastify.get(
    '/api/admin/memberships/profiles',
    {
      schema: {
        description: 'Get all member profiles (admin only)',
        tags: ['admin', 'memberships'],
        response: {
          200: { type: 'object' },
          401: { type: 'object' },
        },
      },
    },
    async (request, reply) => {
      if (!verifyAdminPassword(request, reply)) return;

      app.logger.info('Fetching member profiles (admin)');

      try {
        const result = await app.db.select().from(schema.memberProfiles);

        app.logger.info({ count: result.length }, 'Member profiles fetched successfully');
        return {
          success: true,
          data: result.map(formatMemberProfile),
          total: result.length,
        };
      } catch (error) {
        app.logger.error({ err: error }, 'Failed to fetch member profiles');
        throw error;
      }
    }
  );
}
