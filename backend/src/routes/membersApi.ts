import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { eq, desc, count, gte, isNotNull } from 'drizzle-orm';
import * as schema from '../db/schema.js';
import type { App } from '../index.js';

interface RegisterMemberBody {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  region: string;
  gender: string;
  date_of_birth: string;
  address?: string;
}

interface UpdateMemberBody {
  status?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  region?: string;
  gender?: string;
  date_of_birth?: string;
  address?: string;
}

function verifyAdminPassword(request: FastifyRequest, reply: FastifyReply): boolean {
  const password = request.headers['x-admin-password'];
  if (!password || password !== 'admin123') {
    reply.status(401);
    return false;
  }
  return true;
}

function generateMembershipNumber(): string {
  const year = new Date().getFullYear();
  const randomDigits = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
  return `ARM-${year}-${randomDigits}`;
}

export function register(app: App, fastify: FastifyInstance) {
  // GET /api/members - Get all members
  fastify.get(
    '/api/members',
    {
      schema: {
        description: 'Get all members',
        tags: ['members'],
        response: {
          200: {
            type: 'array',
            items: { type: 'object' },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      app.logger.info('Fetching all members');

      try {
        const members = await app.db
          .select()
          .from(schema.members)
          .orderBy(desc(schema.members.createdAt));

        app.logger.info({ count: members.length }, 'Members retrieved');

        return members.map(m => ({
          id: m.id,
          first_name: m.firstName,
          last_name: m.lastName,
          email: m.email,
          phone: m.phone,
          region: m.region,
          gender: m.gender,
          date_of_birth: m.dateOfBirth,
          membership_number: m.memberNumber,
          status: m.status,
          created_at: m.createdAt.toISOString(),
        }));
      } catch (error) {
        app.logger.error({ err: error }, 'Failed to fetch members');
        throw error;
      }
    }
  );

  // GET /api/members/count - Get total count of members (public)
  fastify.get(
    '/api/members/count',
    {
      schema: {
        description: 'Get total count of registered members',
        tags: ['members'],
        response: {
          200: {
            type: 'object',
            properties: {
              count: { type: 'number' },
            },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      app.logger.info('Fetching member count');

      try {
        const result = await app.db
          .select({ count: count() })
          .from(schema.members);

        const memberCount = result[0]?.count || 0;
        app.logger.info({ count: memberCount }, 'Member count retrieved');

        return { count: memberCount };
      } catch (error) {
        app.logger.error({ err: error }, 'Failed to fetch member count');
        return { count: 0 };
      }
    }
  );

  // POST /api/members/register - Register new member (NO admin password required)
  fastify.post<{ Body: RegisterMemberBody }>(
    '/api/members/register',
    {
      schema: {
        description: 'Register a new member',
        tags: ['members'],
        body: {
          type: 'object',
          required: ['first_name', 'last_name', 'email', 'region', 'gender', 'date_of_birth'],
          properties: {
            first_name: { type: 'string' },
            last_name: { type: 'string' },
            email: { type: 'string' },
            phone: { type: 'string' },
            region: { type: 'string' },
            gender: { type: 'string' },
            date_of_birth: { type: 'string' },
            address: { type: 'string' },
          },
        },
        response: {
          201: { type: 'object' },
          409: { type: 'object' },
        },
      },
    },
    async (request: FastifyRequest<{ Body: RegisterMemberBody }>, reply: FastifyReply) => {
      const { first_name, last_name, email, phone, region, gender, date_of_birth, address } = request.body;

      // Normalize phone: trim and convert empty string to null
      const normalizedPhone = phone && phone.trim() ? phone.trim() : null;

      app.logger.info({ email, phone: normalizedPhone }, 'Registering new member');

      try {
        // Check for duplicate email
        const existingMember = await app.db
          .select()
          .from(schema.members)
          .where(eq(schema.members.email, email));

        if (existingMember.length > 0) {
          app.logger.warn({ email }, 'Email already registered');
          reply.status(409);
          return {
            membership_number: existingMember[0].memberNumber,
            member_number: existingMember[0].memberNumber,
            member_name: `${existingMember[0].firstName} ${existingMember[0].lastName}`,
            message: 'Member already registered',
          };
        }

        // Generate membership number
        const membershipNumber = generateMembershipNumber();
        const fullName = `${first_name} ${last_name}`;
        const now = new Date();

        const result = await app.db
          .insert(schema.members)
          .values({
            memberNumber: membershipNumber,
            membershipNumber: membershipNumber,
            fullName,
            firstName: first_name,
            lastName: last_name,
            email,
            phone: normalizedPhone,
            region,
            gender,
            dateOfBirth: date_of_birth,
            address: address || null,
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
          member_number: member.memberNumber,
          member_name: fullName,
          status: 'pending',
          message: 'Registration successful',
        };
      } catch (error: any) {
        // Handle unique constraint violation on phone field
        if (error.code === '23505' && error.constraint && error.constraint.includes('phone')) {
          app.logger.warn({ phone: normalizedPhone }, 'Phone number already registered');
          reply.status(409);
          return { error: 'Ce numéro de téléphone est déjà enregistré.' };
        }

        app.logger.error({ err: error, email }, 'Failed to register member');
        throw error;
      }
    }
  );

  // GET /api/members/stats - Get member statistics
  fastify.get(
    '/api/members/stats',
    {
      schema: {
        description: 'Get member statistics',
        tags: ['members'],
        response: {
          200: { type: 'object' },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      app.logger.info('Fetching member statistics');

      try {
        // Get counts
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

        // Recent registrations (last 30 days)
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

        const byGender = byGenderResults.map(g => ({
          gender: g.gender || 'Unknown',
          count: g.count,
        }));

        app.logger.info({ total, active, pending, suspended }, 'Statistics retrieved');

        // Return with both camelCase and snake_case keys for compatibility
        return {
          total,
          active,
          pending,
          suspended,
          by_region: byRegion,
          by_gender: byGender,
          recent_registrations: recentCount,
          thisMonth: recentCount,
          recentCount,
        };
      } catch (error) {
        app.logger.error({ err: error }, 'Failed to fetch statistics');
        throw error;
      }
    }
  );

  // GET /api/stats/members - Alias for /api/members/stats
  fastify.get(
    '/api/stats/members',
    {
      schema: {
        description: 'Get member statistics (alias)',
        tags: ['members'],
        response: {
          200: { type: 'object' },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      app.logger.info('Fetching member statistics (alias)');

      try {
        // Get counts
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

        // Recent registrations (last 30 days)
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

        const byGender = byGenderResults.map(g => ({
          gender: g.gender || 'Unknown',
          count: g.count,
        }));

        // Return with both camelCase and snake_case keys for compatibility
        return {
          total,
          active,
          pending,
          suspended,
          by_region: byRegion,
          by_gender: byGender,
          recent_registrations: recentCount,
          thisMonth: recentCount,
          recentCount,
        };
      } catch (error) {
        app.logger.error({ err: error }, 'Failed to fetch statistics');
        throw error;
      }
    }
  );

  // PUT /api/members/:id - Update member (admin only)
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
            first_name: { type: 'string' },
            last_name: { type: 'string' },
            email: { type: 'string' },
            phone: { type: 'string' },
            region: { type: 'string' },
            gender: { type: 'string' },
            date_of_birth: { type: 'string' },
            address: { type: 'string' },
          },
        },
        response: {
          200: { type: 'object' },
          401: { type: 'object' },
          404: { type: 'object' },
        },
      },
    },
    async (request: FastifyRequest<{ Params: { id: string }; Body: UpdateMemberBody }>, reply: FastifyReply) => {
      if (!verifyAdminPassword(request, reply)) return;

      const { id } = request.params;
      const body = request.body;

      app.logger.info({ memberId: id }, 'Updating member');

      try {
        const updates: any = {};
        if (body.status !== undefined) updates.status = body.status;
        if (body.first_name !== undefined) updates.firstName = body.first_name;
        if (body.last_name !== undefined) updates.lastName = body.last_name;
        if (body.email !== undefined) updates.email = body.email;
        if (body.phone !== undefined) updates.phone = body.phone;
        if (body.region !== undefined) updates.region = body.region;
        if (body.gender !== undefined) updates.gender = body.gender;
        if (body.date_of_birth !== undefined) updates.dateOfBirth = body.date_of_birth;
        if (body.address !== undefined) updates.address = body.address;

        // Update fullName if first_name or last_name provided
        if (body.first_name !== undefined || body.last_name !== undefined) {
          const member = await app.db
            .select()
            .from(schema.members)
            .where(eq(schema.members.id, id));
          if (member.length > 0) {
            const firstName = body.first_name || member[0].firstName;
            const lastName = body.last_name || member[0].lastName;
            updates.fullName = `${firstName} ${lastName}`;
          }
        }

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

        const m = result[0];
        app.logger.info({ memberId: id }, 'Member updated');

        return {
          id: m.id,
          first_name: m.firstName,
          last_name: m.lastName,
          email: m.email,
          phone: m.phone,
          region: m.region,
          gender: m.gender,
          date_of_birth: m.dateOfBirth,
          membership_number: m.memberNumber,
          status: m.status,
          address: m.address,
          created_at: m.createdAt.toISOString(),
        };
      } catch (error) {
        app.logger.error({ err: error, memberId: id }, 'Failed to update member');
        throw error;
      }
    }
  );

  // DELETE /api/members/:id - Delete member (admin only, no body)
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
          200: { type: 'object' },
          401: { type: 'object' },
          404: { type: 'object' },
        },
      },
    },
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      if (!verifyAdminPassword(request, reply)) return;

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
        return { success: true, message: 'Member deleted' };
      } catch (error) {
        app.logger.error({ err: error, memberId: id }, 'Failed to delete member');
        throw error;
      }
    }
  );
}

export async function seedMembers(app: App) {
  try {
    // Check by email to see if already seeded
    const existing = await app.db.select().from(schema.members).where(eq(schema.members.email, 'amadou.coulibaly@example.com'));

    if (existing.length === 0) {
      app.logger.info('Seeding members table');

      const now = new Date();
      const seedData = [
        {
          memberNumber: 'ARM-2024-100001',
          membershipNumber: 'ARM-2024-100001',
          fullName: 'Amadou Coulibaly',
          firstName: 'Amadou',
          lastName: 'Coulibaly',
          email: 'amadou.coulibaly@example.com',
          phone: '+22376543210',
          region: 'Bamako',
          gender: 'male',
          dateOfBirth: '1985-03-15',
          status: 'active',
          createdAt: now,
          updatedAt: now,
        },
        {
          memberNumber: 'ARM-2024-100002',
          membershipNumber: 'ARM-2024-100002',
          fullName: 'Fatoumata Diallo',
          firstName: 'Fatoumata',
          lastName: 'Diallo',
          email: 'fatoumata.diallo@example.com',
          phone: '+22365432109',
          region: 'Sikasso',
          gender: 'female',
          dateOfBirth: '1990-07-22',
          status: 'active',
          createdAt: now,
          updatedAt: now,
        },
        {
          memberNumber: 'ARM-2024-100003',
          membershipNumber: 'ARM-2024-100003',
          fullName: 'Ibrahim Traoré',
          firstName: 'Ibrahim',
          lastName: 'Traoré',
          email: 'ibrahim.traore@example.com',
          phone: '+22354321098',
          region: 'Mopti',
          gender: 'male',
          dateOfBirth: '1978-11-08',
          status: 'pending',
          createdAt: now,
          updatedAt: now,
        },
        {
          memberNumber: 'ARM-2024-100004',
          membershipNumber: 'ARM-2024-100004',
          fullName: 'Mariam Keita',
          firstName: 'Mariam',
          lastName: 'Keita',
          email: 'mariam.keita@example.com',
          phone: '+22343210987',
          region: 'Kayes',
          gender: 'female',
          dateOfBirth: '1995-01-30',
          status: 'pending',
          createdAt: now,
          updatedAt: now,
        },
        {
          memberNumber: 'ARM-2024-100005',
          membershipNumber: 'ARM-2024-100005',
          fullName: 'Oumar Sanogo',
          firstName: 'Oumar',
          lastName: 'Sanogo',
          email: 'oumar.sanogo@example.com',
          phone: '+22332109876',
          region: 'Ségou',
          gender: 'male',
          dateOfBirth: '1982-09-14',
          status: 'suspended',
          createdAt: now,
          updatedAt: now,
        },
      ];

      await app.db.insert(schema.members).values(seedData);
      app.logger.info({ count: seedData.length }, 'Members seeded');
    }
  } catch (error) {
    app.logger.error({ err: error }, 'Failed to seed members');
  }
}
