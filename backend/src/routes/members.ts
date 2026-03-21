import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { eq, and } from 'drizzle-orm';
import * as schema from '../db/schema.js';
import type { App } from '../index.js';

const SAMPLE_MEMBERS = [
  {
    name: 'Amadou Coulibaly',
    firstName: 'Amadou',
    lastName: 'Coulibaly',
    email: 'amadou.coulibaly@example.com',
    phone: '+22376543210',
    region: 'Bamako',
    membershipDate: new Date('2023-01-15'),
    status: 'active',
  },
  {
    name: 'Fatoumata Diallo',
    firstName: 'Fatoumata',
    lastName: 'Diallo',
    email: 'fatoumata.diallo@example.com',
    phone: '+22365432109',
    region: 'Sikasso',
    membershipDate: new Date('2023-03-22'),
    status: 'active',
  },
  {
    name: 'Ibrahim Traoré',
    firstName: 'Ibrahim',
    lastName: 'Traoré',
    email: 'ibrahim.traore@example.com',
    phone: '+22354321098',
    region: 'Mopti',
    membershipDate: new Date('2023-06-10'),
    status: 'inactive',
  },
  {
    name: 'Mariam Keita',
    firstName: 'Mariam',
    lastName: 'Keita',
    email: 'mariam.keita@example.com',
    phone: '+22343210987',
    region: 'Kayes',
    membershipDate: new Date('2024-01-05'),
    status: 'active',
  },
  {
    name: 'Oumar Sanogo',
    firstName: 'Oumar',
    lastName: 'Sanogo',
    email: 'oumar.sanogo@example.com',
    phone: '+22332109876',
    region: 'Ségou',
    membershipDate: new Date('2024-02-18'),
    status: 'active',
  },
];

export function register(app: App, fastify: FastifyInstance) {
  const requireAuth = app.requireAuth();

  // GET /api/members - Get all members (authenticated, admin only)
  fastify.get<{ Querystring: { status?: string } }>(
    '/api/members',
    {
      schema: {
        description: 'Get all members (admin only)',
        tags: ['members'],
        querystring: {
          type: 'object',
          properties: {
            status: { type: 'string', enum: ['active', 'inactive'] },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              members: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string', format: 'uuid' },
                    firstName: { type: 'string' },
                    lastName: { type: 'string' },
                    email: { type: 'string' },
                    phone: { type: 'string' },
                    membershipDate: { type: 'string', format: 'date-time' },
                    status: { type: 'string' },
                  },
                },
              },
              total: { type: 'number' },
            },
          },
          401: {
            type: 'object',
            properties: { error: { type: 'string' } },
          },
          403: {
            type: 'object',
            properties: { error: { type: 'string' } },
          },
        },
      },
    },
    async (request, reply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      const userId = session.user.id;
      const statusFilter = (request.query as any).status;

      app.logger.info({ userId, statusFilter }, 'Fetching members');

      try {
        // Check if user is admin
        const memberProfile = await app.db
          .select()
          .from(schema.memberProfiles)
          .where(eq(schema.memberProfiles.userId, userId))
          .limit(1);

        if (memberProfile.length === 0 || memberProfile[0].role !== 'admin') {
          reply.status(403);
          return { error: 'Accès refusé' };
        }

        // Query members with optional status filter
        let query = app.db.select().from(schema.members);

        if (statusFilter && ['active', 'inactive'].includes(statusFilter)) {
          query = query.where(eq(schema.members.status, statusFilter)) as any;
        }

        const result = await query;

        // Format response
        const members = result.map((member: any) => {
          const firstName = member.firstName || (member.name.split(' ')[0] || '');
          const lastName = member.lastName || (member.name.split(' ').slice(1).join(' ') || '');

          return {
            id: member.id,
            firstName,
            lastName,
            email: member.email,
            phone: member.phone,
            membershipDate: member.membershipDate instanceof Date
              ? member.membershipDate.toISOString()
              : new Date(member.membershipDate).toISOString(),
            status: member.status,
          };
        });

        app.logger.info({ count: members.length }, 'Members fetched');
        return {
          members,
          total: members.length,
        };
      } catch (error) {
        app.logger.error({ err: error, userId }, 'Failed to fetch members');
        throw error;
      }
    }
  );
}

export async function seedMembers(app: App) {
  try {
    const existing = await app.db
      .select()
      .from(schema.members);

    if (existing.length < 3) {
      app.logger.info('Seeding members table');
      await app.db
        .insert(schema.members)
        .values(SAMPLE_MEMBERS);
      app.logger.info({ count: SAMPLE_MEMBERS.length }, 'Members seeded');
    }
  } catch (error) {
    app.logger.error({ err: error }, 'Failed to seed members');
  }
}
