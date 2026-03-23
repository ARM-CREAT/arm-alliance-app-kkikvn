import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { eq, and, or, ilike, desc } from 'drizzle-orm';
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
  fastify.get<{ Querystring: { status?: string; search?: string } }>(
    '/api/members',
    {
      schema: {
        description: 'Get all members with optional filtering by status and search',
        tags: ['members'],
        querystring: {
          type: 'object',
          properties: {
            status: { type: 'string', enum: ['active', 'pending', 'suspended'] },
            search: { type: 'string', description: 'Search by full name, phone, or commune' },
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
                    fullName: { type: 'string' },
                    firstName: { type: 'string' },
                    lastName: { type: 'string' },
                    email: { type: 'string' },
                    phone: { type: 'string' },
                    commune: { type: 'string' },
                    region: { type: 'string' },
                    cercle: { type: 'string' },
                    profession: { type: 'string' },
                    membershipNumber: { type: 'string' },
                    status: { type: 'string' },
                    role: { type: 'string' },
                    joinedAt: { type: 'string', format: 'date-time' },
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
      const { status, search } = request.query as { status?: string; search?: string };

      app.logger.info({ userId, status, search }, 'Fetching members');

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

        // Query members from memberProfiles with optional filters
        let query = app.db.select().from(schema.memberProfiles);

        if (status) {
          query = query.where(eq(schema.memberProfiles.status, status)) as any;
        }

        if (search) {
          const searchTerm = `%${search}%`;
          query = query.where(
            or(
              ilike(schema.memberProfiles.fullName, searchTerm),
              ilike(schema.memberProfiles.phone, searchTerm),
              ilike(schema.memberProfiles.commune, searchTerm)
            )
          ) as any;
        }

        // Order by created_at DESC
        const result = (await (query.orderBy(desc(schema.memberProfiles.createdAt)) as any)) as any[];

        // Format response
        const members = result.map((member: any) => ({
          id: member.id,
          fullName: member.fullName,
          firstName: member.firstName,
          lastName: member.lastName,
          email: member.email,
          phone: member.phone,
          commune: member.commune,
          region: member.region,
          cercle: member.cercle,
          profession: member.profession,
          membershipNumber: member.membershipNumber,
          status: member.status,
          role: member.role,
          joinedAt: member.createdAt instanceof Date
            ? member.createdAt.toISOString()
            : new Date(member.createdAt).toISOString(),
        }));

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
