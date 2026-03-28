import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { eq, ilike, and, or, desc, count, gte, isNotNull, sql } from 'drizzle-orm';
import * as schema from '../db/schema.js';
import type { App } from '../index.js';

interface RegisterMemberBody {
  full_name: string;
  phone: string;
  email?: string;
  region?: string;
  commune?: string;
  profession?: string;
  date_of_birth?: string;
  gender?: string;
}

interface UpdateMemberBody {
  status?: string;
  full_name?: string;
  email?: string;
  region?: string;
  commune?: string;
  profession?: string;
  date_of_birth?: string;
  gender?: string;
  phone?: string;
}

/**
 * Validate admin password from x-admin-password header
 */
function validateAdminPassword(request: FastifyRequest): boolean {
  const adminPassword = request.headers['x-admin-password'];
  const expectedPassword = process.env.ADMIN_PASSWORD || 'admin123';
  return adminPassword === expectedPassword;
}

/**
 * Format member object with member_number aliased as membership_number
 */
function formatMember(m: any) {
  return {
    id: m.id,
    full_name: m.fullName,
    membership_number: m.memberNumber,
    phone: m.phone,
    email: m.email,
    region: m.region,
    commune: m.commune,
    profession: m.profession,
    date_of_birth: m.dateOfBirth,
    gender: m.gender,
    status: m.status,
    created_at: m.createdAt.toISOString(),
  };
}

/**
 * Generate membership number: ARM-YYYY-XXXXXX (6-digit sequence)
 */
async function generateMembershipNumber(app: App): Promise<string> {
  const year = new Date().getFullYear();
  const countResult = await app.db
    .select({ count: count() })
    .from(schema.members);
  const sequence = (countResult[0]?.count || 0) + 1;
  const paddedSequence = String(sequence).padStart(6, '0');
  return `ARM-${year}-${paddedSequence}`;
}

export function register(app: App, fastify: FastifyInstance) {
  // GET /api/members/stats - Membership statistics
  fastify.get(
    '/api/members/stats',
    {
      schema: {
        description: 'Get membership statistics',
        tags: ['members'],
        response: {
          200: {
            type: 'object',
            properties: {
              total: { type: 'number' },
              active: { type: 'number' },
              pending: { type: 'number' },
              suspended: { type: 'number' },
              thisMonth: { type: 'number' },
              recentCount: { type: 'number' },
              byRegion: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    region: { type: 'string' },
                    count: { type: 'number' },
                  },
                },
              },
            },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      app.logger.info('Fetching membership statistics');

      try {
        // Total count
        const totalResult = await app.db
          .select({ count: count() })
          .from(schema.members);
        const total = totalResult[0]?.count || 0;

        // Count by status
        const activeResult = await app.db
          .select({ count: count() })
          .from(schema.members)
          .where(eq(schema.members.status, 'active'));
        const active = activeResult[0]?.count || 0;

        const pendingResult = await app.db
          .select({ count: count() })
          .from(schema.members)
          .where(eq(schema.members.status, 'pending'));
        const pending = pendingResult[0]?.count || 0;

        const suspendedResult = await app.db
          .select({ count: count() })
          .from(schema.members)
          .where(eq(schema.members.status, 'suspended'));
        const suspended = suspendedResult[0]?.count || 0;

        // This month
        const now = new Date();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const thisMonthResult = await app.db
          .select({ count: count() })
          .from(schema.members)
          .where(gte(schema.members.createdAt, firstDayOfMonth));
        const thisMonth = thisMonthResult[0]?.count || 0;

        // Recent (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const recentResult = await app.db
          .select({ count: count() })
          .from(schema.members)
          .where(gte(schema.members.createdAt, thirtyDaysAgo));
        const recentCount = recentResult[0]?.count || 0;

        // By region
        const byRegionResults = await app.db
          .select({
            region: schema.members.region,
            count: count(),
          })
          .from(schema.members)
          .where(isNotNull(schema.members.region))
          .groupBy(schema.members.region)
          .orderBy(desc(count()));

        const byRegion = byRegionResults.map(r => ({
          region: r.region || 'Unknown',
          count: r.count,
        }));

        app.logger.info({ total, active, pending, suspended }, 'Statistics retrieved');

        return {
          total,
          active,
          pending,
          suspended,
          thisMonth,
          recentCount,
          byRegion,
        };
      } catch (error) {
        app.logger.error({ err: error }, 'Failed to fetch statistics');
        reply.status(500);
        return { error: 'Failed to fetch statistics' };
      }
    }
  );

  // GET /api/stats/members - Extended statistics
  fastify.get(
    '/api/stats/members',
    {
      schema: {
        description: 'Get extended membership statistics',
        tags: ['members'],
        response: {
          200: {
            type: 'object',
            properties: {
              total: { type: 'number' },
              active: { type: 'number' },
              pending: { type: 'number' },
              suspended: { type: 'number' },
              recent_registrations: { type: 'number' },
              by_region: { type: 'array' },
              by_gender: { type: 'array' },
              members_list: { type: 'array' },
            },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      app.logger.info('Fetching extended member statistics');

      try {
        // Counts
        const totalResult = await app.db
          .select({ count: count() })
          .from(schema.members);
        const total = totalResult[0]?.count || 0;

        const activeResult = await app.db
          .select({ count: count() })
          .from(schema.members)
          .where(eq(schema.members.status, 'active'));
        const active = activeResult[0]?.count || 0;

        const pendingResult = await app.db
          .select({ count: count() })
          .from(schema.members)
          .where(eq(schema.members.status, 'pending'));
        const pending = pendingResult[0]?.count || 0;

        const suspendedResult = await app.db
          .select({ count: count() })
          .from(schema.members)
          .where(eq(schema.members.status, 'suspended'));
        const suspended = suspendedResult[0]?.count || 0;

        // Recent (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const recentResult = await app.db
          .select({ count: count() })
          .from(schema.members)
          .where(gte(schema.members.createdAt, thirtyDaysAgo));
        const recent_registrations = recentResult[0]?.count || 0;

        // By region
        const byRegionResults = await app.db
          .select({
            region: schema.members.region,
            count: count(),
          })
          .from(schema.members)
          .where(isNotNull(schema.members.region))
          .groupBy(schema.members.region)
          .orderBy(desc(count()));

        const by_region = byRegionResults.map(r => ({
          region: r.region || 'Unknown',
          count: r.count,
        }));

        // By gender
        const byGenderResults = await app.db
          .select({
            gender: schema.members.gender,
            count: count(),
          })
          .from(schema.members)
          .where(isNotNull(schema.members.gender))
          .groupBy(schema.members.gender)
          .orderBy(desc(count()));

        const by_gender = byGenderResults.map(g => ({
          gender: g.gender || 'Unknown',
          count: g.count,
        }));

        // Members list (last 100)
        const membersList = await app.db
          .select()
          .from(schema.members)
          .orderBy(desc(schema.members.createdAt))
          .limit(100);

        const members_list = membersList.map(m => ({
          id: m.id,
          full_name: m.fullName,
          membership_number: m.memberNumber,
          region: m.region,
          commune: m.commune,
          status: m.status,
          created_at: m.createdAt.toISOString(),
          gender: m.gender,
        }));

        return {
          total,
          active,
          pending,
          suspended,
          recent_registrations,
          by_region,
          by_gender,
          members_list,
        };
      } catch (error) {
        app.logger.error({ err: error }, 'Failed to fetch extended statistics');
        reply.status(500);
        return { error: 'Failed to fetch extended statistics' };
      }
    }
  );

  // GET /api/members - List members with filtering
  fastify.get<{ Querystring: { limit?: string; offset?: string; search?: string; status?: string } }>(
    '/api/members',
    {
      schema: {
        description: 'List members with filtering and pagination',
        tags: ['members'],
        querystring: {
          type: 'object',
          properties: {
            limit: { type: 'string', default: '50' },
            offset: { type: 'string', default: '0' },
            search: { type: 'string', description: 'Search by full_name, phone, or member_number' },
            status: { type: 'string', description: 'Filter by status' },
          },
        },
        response: {
          200: {
            type: 'array',
            items: { type: 'object' },
          },
        },
      },
    },
    async (request: FastifyRequest<{ Querystring: { limit?: string; offset?: string; search?: string; status?: string } }>, reply: FastifyReply) => {
      const limit = Math.min(parseInt(request.query.limit || '50', 10), 200);
      const offset = parseInt(request.query.offset || '0', 10);
      const search = request.query.search;
      const statusFilter = request.query.status;

      app.logger.info({ limit, offset, search, status: statusFilter }, 'Listing members');

      try {
        const conditions: any[] = [];

        if (search) {
          conditions.push(
            or(
              ilike(schema.members.fullName, `%${search}%`),
              ilike(schema.members.phone, `%${search}%`),
              ilike(schema.members.memberNumber, `%${search}%`)
            )
          );
        }

        if (statusFilter) {
          conditions.push(eq(schema.members.status, statusFilter));
        }

        const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

        const members = await app.db
          .select()
          .from(schema.members)
          .where(whereClause)
          .orderBy(desc(schema.members.createdAt))
          .limit(limit)
          .offset(offset);

        app.logger.info({ count: members.length }, 'Members retrieved');

        return members.map(formatMember);
      } catch (error) {
        app.logger.error({ err: error }, 'Failed to list members');
        reply.status(500);
        return { error: 'Failed to list members' };
      }
    }
  );

  // POST /api/members/register - Register new member
  fastify.post<{ Body: RegisterMemberBody }>(
    '/api/members/register',
    {
      schema: {
        description: 'Register a new member',
        tags: ['members'],
        body: {
          type: 'object',
          required: ['full_name', 'phone'],
          properties: {
            full_name: { type: 'string' },
            phone: { type: 'string' },
            email: { type: 'string' },
            region: { type: 'string' },
            commune: { type: 'string' },
            profession: { type: 'string' },
            date_of_birth: { type: 'string' },
            gender: { type: 'string' },
          },
        },
        response: {
          201: {
            type: 'object',
            properties: {
              membership_number: { type: 'string' },
              full_name: { type: 'string' },
              id: { type: 'string' },
            },
          },
          409: {
            type: 'object',
            properties: {
              error: { type: 'string' },
              membership_number: { type: 'string' },
              full_name: { type: 'string' },
            },
          },
        },
      },
    },
    async (request: FastifyRequest<{ Body: RegisterMemberBody }>, reply: FastifyReply) => {
      const { full_name, phone, email, region, commune, profession, date_of_birth, gender } = request.body;

      app.logger.info({ full_name, phone }, 'Registering new member');

      try {
        // Check for duplicate phone
        const existing = await app.db
          .select()
          .from(schema.members)
          .where(eq(schema.members.phone, phone));

        if (existing.length > 0) {
          app.logger.warn({ phone }, 'Phone already registered');
          reply.status(409);
          return {
            error: 'already_exists',
            membership_number: existing[0].memberNumber,
            full_name: existing[0].fullName,
          };
        }

        // Generate membership number
        const membershipNumber = await generateMembershipNumber(app);
        app.logger.debug({ membershipNumber }, 'Generated membership number');

        // Insert member
        const now = new Date();
        const result = await app.db
          .insert(schema.members)
          .values({
            memberNumber: membershipNumber,
            fullName: full_name,
            phone,
            email,
            region,
            commune,
            profession,
            dateOfBirth: date_of_birth,
            gender,
            status: 'pending',
            createdAt: now,
            updatedAt: now,
          })
          .returning();

        const member = result[0];
        app.logger.info({ memberId: member.id, membershipNumber }, 'Member registered');

        reply.status(201);
        return {
          membership_number: member.memberNumber,
          full_name: member.fullName,
          id: member.id,
        };
      } catch (error) {
        app.logger.error({ err: error, phone }, 'Failed to register member');
        reply.status(500);
        return { error: 'Failed to register member' };
      }
    }
  );

  // GET /api/members/lookup - Lookup member by phone
  fastify.get<{ Querystring: { phone?: string } }>(
    '/api/members/lookup',
    {
      schema: {
        description: 'Lookup a member by phone number',
        tags: ['members'],
        querystring: {
          type: 'object',
          properties: {
            phone: { type: 'string', description: 'Phone number to lookup' },
          },
        },
        response: {
          200: { type: 'object' },
          404: { type: 'object', properties: { error: { type: 'string' } } },
        },
      },
    },
    async (request: FastifyRequest<{ Querystring: { phone?: string } }>, reply: FastifyReply) => {
      const phone = request.query.phone;

      if (!phone) {
        app.logger.warn('Phone parameter missing');
        reply.status(400);
        return { error: 'phone query parameter is required' };
      }

      app.logger.info({ phone }, 'Looking up member');

      try {
        const result = await app.db
          .select()
          .from(schema.members)
          .where(eq(schema.members.phone, phone));

        if (result.length === 0) {
          app.logger.info({ phone }, 'Member not found');
          reply.status(404);
          return { error: 'not_found' };
        }

        return formatMember(result[0]);
      } catch (error) {
        app.logger.error({ err: error, phone }, 'Failed to lookup member');
        reply.status(500);
        return { error: 'Failed to lookup member' };
      }
    }
  );

  // PUT /api/members/:id - Update member
  fastify.put<{ Params: { id: string }; Body: UpdateMemberBody }>(
    '/api/members/:id',
    {
      schema: {
        description: 'Update a member (admin only)',
        tags: ['members'],
        params: {
          type: 'object',
          required: ['id'],
          properties: { id: { type: 'string', format: 'uuid' } },
        },
        body: {
          type: 'object',
          properties: {
            status: { type: 'string' },
            full_name: { type: 'string' },
            email: { type: 'string' },
            region: { type: 'string' },
            commune: { type: 'string' },
            profession: { type: 'string' },
            date_of_birth: { type: 'string' },
            gender: { type: 'string' },
            phone: { type: 'string' },
          },
        },
        response: {
          200: { type: 'object' },
          401: { type: 'object', properties: { error: { type: 'string' } } },
          404: { type: 'object', properties: { error: { type: 'string' } } },
        },
      },
    },
    async (request: FastifyRequest<{ Params: { id: string }; Body: UpdateMemberBody }>, reply: FastifyReply) => {
      if (!validateAdminPassword(request)) {
        app.logger.warn('Unauthorized member update attempt');
        reply.status(401);
        return { error: 'unauthorized' };
      }

      const { id } = request.params;
      const body = request.body;

      app.logger.info({ memberId: id }, 'Updating member');

      try {
        const updates: any = {};
        if (body.status !== undefined) updates.status = body.status;
        if (body.full_name !== undefined) updates.fullName = body.full_name;
        if (body.email !== undefined) updates.email = body.email;
        if (body.region !== undefined) updates.region = body.region;
        if (body.commune !== undefined) updates.commune = body.commune;
        if (body.profession !== undefined) updates.profession = body.profession;
        if (body.date_of_birth !== undefined) updates.dateOfBirth = body.date_of_birth;
        if (body.gender !== undefined) updates.gender = body.gender;
        if (body.phone !== undefined) updates.phone = body.phone;
        updates.updatedAt = new Date();

        const result = await app.db
          .update(schema.members)
          .set(updates)
          .where(eq(schema.members.id, id))
          .returning();

        if (result.length === 0) {
          app.logger.info({ memberId: id }, 'Member not found');
          reply.status(404);
          return { error: 'Member not found' };
        }

        app.logger.info({ memberId: id }, 'Member updated');
        return formatMember(result[0]);
      } catch (error) {
        app.logger.error({ err: error, memberId: id }, 'Failed to update member');
        reply.status(500);
        return { error: 'Failed to update member' };
      }
    }
  );

  // DELETE /api/members/:id - Delete member
  fastify.delete<{ Params: { id: string } }>(
    '/api/members/:id',
    {
      schema: {
        description: 'Delete a member (admin only)',
        tags: ['members'],
        params: {
          type: 'object',
          required: ['id'],
          properties: { id: { type: 'string', format: 'uuid' } },
        },
        response: {
          200: { type: 'object', properties: { success: { type: 'boolean' } } },
          401: { type: 'object', properties: { error: { type: 'string' } } },
          404: { type: 'object', properties: { error: { type: 'string' } } },
        },
      },
    },
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      if (!validateAdminPassword(request)) {
        app.logger.warn('Unauthorized member deletion attempt');
        reply.status(401);
        return { error: 'unauthorized' };
      }

      const { id } = request.params;

      app.logger.info({ memberId: id }, 'Deleting member');

      try {
        const result = await app.db
          .delete(schema.members)
          .where(eq(schema.members.id, id))
          .returning();

        if (result.length === 0) {
          app.logger.info({ memberId: id }, 'Member not found');
          reply.status(404);
          return { error: 'Member not found' };
        }

        app.logger.info({ memberId: id }, 'Member deleted');
        return { success: true };
      } catch (error) {
        app.logger.error({ err: error, memberId: id }, 'Failed to delete member');
        reply.status(500);
        return { error: 'Failed to delete member' };
      }
    }
  );
}

export async function seedMembers(app: App) {
  try {
    const existing = await app.db.select().from(schema.members);

    if (existing.length === 0) {
      app.logger.info('Seeding members table');

      const now = new Date();
      const seedData = [
        {
          memberNumber: 'ARM-2025-000001',
          fullName: 'Amadou Coulibaly',
          phone: '+22376543210',
          email: 'amadou@example.com',
          commune: 'Bamako',
          region: 'Bamako',
          profession: 'Ingénieur',
          status: 'active',
          createdAt: now,
          updatedAt: now,
        },
        {
          memberNumber: 'ARM-2025-000002',
          fullName: 'Fatoumata Diallo',
          phone: '+22365432109',
          email: 'fatoumata@example.com',
          commune: 'Sikasso',
          region: 'Sikasso',
          profession: 'Médecin',
          status: 'active',
          createdAt: now,
          updatedAt: now,
        },
        {
          memberNumber: 'ARM-2025-000003',
          fullName: 'Ibrahim Traoré',
          phone: '+22354321098',
          email: 'ibrahim@example.com',
          commune: 'Mopti',
          region: 'Mopti',
          profession: 'Professeur',
          status: 'pending',
          createdAt: now,
          updatedAt: now,
        },
      ];

      for (const member of seedData) {
        await app.db.insert(schema.members).values(member);
      }

      app.logger.info({ count: seedData.length }, 'Members seeded');
    }
  } catch (error) {
    app.logger.error({ err: error }, 'Failed to seed members');
  }
}
