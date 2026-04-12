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
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const randomFourDigits = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `ARM-${year}${month}${day}-${randomFourDigits}`;
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
          full_name: m.fullName,
          email: m.email,
          phone: m.phone,
          region: m.region,
          cercle: m.commune, // cercle field (using commune value)
          commune: m.commune,
          profession: m.profession,
          membership_number: m.memberNumber,
          member_number: m.memberNumber,
          status: m.status,
          date_of_birth: m.dateOfBirth,
          gender: m.gender,
          address: m.address,
          city: m.city,
          country: m.country,
          membership_type: m.membershipType,
          message: m.message,
          created_at: m.createdAt.toISOString(),
          updated_at: m.updatedAt.toISOString(),
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

        // Also insert into member_profiles (non-blocking if it fails)
        try {
          await app.db
            .insert(schema.memberProfiles)
            .values({
              fullName,
              firstName: first_name,
              lastName: last_name,
              email,
              phone: normalizedPhone,
              commune: '',
              profession: '',
              region,
              motivation: address || null,
              membershipNumber,
              qrCode: membershipNumber,
              status: 'active',
              role: 'member',
              userId: null,
              nina: null,
              cercle: null,
              createdAt: new Date(),
              updatedAt: new Date(),
            });
          app.logger.info({ memberId: member.id, membershipNumber }, 'Member profile created');
        } catch (profileError) {
          // Non-blocking error - don't fail the registration if profile insert fails
          app.logger.warn({ err: profileError, memberId: member.id }, 'Failed to create member profile');
        }

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

  // GET /api/member-profiles - Get all member profiles
  fastify.get(
    '/api/member-profiles',
    {
      schema: {
        description: 'Get all member profiles',
        tags: ['member-profiles'],
        response: {
          200: { type: 'array', items: { type: 'object' } },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      app.logger.info('Fetching all member profiles');

      try {
        const profiles = await app.db
          .select()
          .from(schema.memberProfiles)
          .orderBy(desc(schema.memberProfiles.createdAt));

        app.logger.info({ count: profiles.length }, 'Member profiles retrieved');

        return profiles.map(p => ({
          id: p.id,
          first_name: p.firstName,
          last_name: p.lastName,
          full_name: p.fullName,
          email: p.email,
          phone: p.phone,
          region: p.region,
          cercle: p.cercle,
          commune: p.commune,
          profession: p.profession,
          membership_number: p.membershipNumber,
          role: p.role,
          status: p.status,
          nina: p.nina,
          qr_code: p.qrCode,
          motivation: p.motivation,
          user_id: p.userId,
          created_at: p.createdAt.toISOString(),
          updated_at: p.updatedAt.toISOString(),
        }));
      } catch (error) {
        app.logger.error({ err: error }, 'Failed to fetch member profiles');
        throw error;
      }
    }
  );

  // GET /api/member-profiles/lookup - Look up member profile by phone
  fastify.get<{ Querystring: { phone: string } }>(
    '/api/member-profiles/lookup',
    {
      schema: {
        description: 'Look up member profile by phone number',
        tags: ['member-profiles'],
        querystring: {
          type: 'object',
          required: ['phone'],
          properties: {
            phone: { type: 'string', description: 'Phone number to search for' },
          },
        },
        response: {
          200: { type: 'object' },
          404: { type: 'object' },
        },
      },
    },
    async (request: FastifyRequest<{ Querystring: { phone: string } }>, reply: FastifyReply) => {
      const { phone } = request.query;

      app.logger.info({ phone }, 'Looking up member profile by phone');

      try {
        const profiles = await app.db
          .select()
          .from(schema.memberProfiles)
          .where(eq(schema.memberProfiles.phone, phone));

        if (profiles.length === 0) {
          app.logger.info({ phone }, 'Member profile not found');
          reply.status(404);
          return { error: 'Member not found' };
        }

        const profile = profiles[0];
        app.logger.info({ phone, profileId: profile.id }, 'Member profile found');

        return {
          id: profile.id,
          full_name: profile.fullName,
          first_name: profile.firstName,
          last_name: profile.lastName,
          membership_number: profile.membershipNumber,
          commune: profile.commune,
          region: profile.region,
          profession: profile.profession,
          phone: profile.phone,
          email: profile.email,
          status: profile.status,
          role: profile.role,
          qr_code: profile.qrCode,
          created_at: profile.createdAt.toISOString(),
        };
      } catch (error) {
        app.logger.error({ err: error, phone }, 'Failed to look up member profile');
        throw error;
      }
    }
  );

  // GET /api/members/lookup - Look up member by phone (searches both members and member_profiles)
  fastify.get<{ Querystring: { phone: string } }>(
    '/api/members/lookup',
    {
      schema: {
        description: 'Look up member by phone number (searches members and member_profiles)',
        tags: ['members'],
        querystring: {
          type: 'object',
          required: ['phone'],
          properties: {
            phone: { type: 'string', description: 'Phone number to search for' },
          },
        },
        response: {
          200: { type: 'object' },
          404: { type: 'object' },
        },
      },
    },
    async (request: FastifyRequest<{ Querystring: { phone: string } }>, reply: FastifyReply) => {
      const { phone } = request.query;

      app.logger.info({ phone }, 'Looking up member by phone');

      try {
        // First search in members table
        const members = await app.db
          .select()
          .from(schema.members)
          .where(eq(schema.members.phone, phone));

        if (members.length > 0) {
          const m = members[0];
          app.logger.info({ phone, memberId: m.id }, 'Member found in members table');
          return {
            id: m.id,
            member_number: m.memberNumber,
            full_name: m.fullName,
            first_name: m.firstName,
            last_name: m.lastName,
            commune: m.commune,
            region: m.region,
            status: m.status,
            created_at: m.createdAt.toISOString(),
            phone: m.phone,
            email: m.email,
            membership_number: m.memberNumber,
          };
        }

        // If not found in members, search in member_profiles
        const profiles = await app.db
          .select()
          .from(schema.memberProfiles)
          .where(eq(schema.memberProfiles.phone, phone));

        if (profiles.length > 0) {
          const p = profiles[0];
          app.logger.info({ phone, profileId: p.id }, 'Member found in member_profiles table');
          return {
            id: p.id,
            member_number: p.membershipNumber,
            full_name: p.fullName,
            first_name: p.firstName,
            last_name: p.lastName,
            commune: p.commune,
            region: p.region,
            status: p.status,
            created_at: p.createdAt.toISOString(),
            phone: p.phone,
            email: p.email,
            membership_number: p.membershipNumber,
          };
        }

        app.logger.info({ phone }, 'Member not found in either table');
        reply.status(404);
        return { error: 'Member not found' };
      } catch (error) {
        app.logger.error({ err: error, phone }, 'Failed to look up member');
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

    // Seed member_profiles if it has fewer than 3 rows
    const existingProfiles = await app.db.select().from(schema.memberProfiles);
    if (existingProfiles.length < 3) {
      app.logger.info('Seeding member_profiles table');

      const now = new Date();
      const profileSeedData = [
        {
          firstName: 'Amadou',
          lastName: 'Coulibaly',
          fullName: 'Amadou Coulibaly',
          email: 'amadou.coulibaly@example.com',
          phone: '+22376543210',
          region: 'Bamako',
          cercle: 'Bamako',
          commune: 'Commune I',
          profession: 'Enseignant',
          membershipNumber: 'ARM-20240101-0001',
          qrCode: 'ARM-20240101-0001',
          status: 'active',
          role: 'member',
          userId: null,
          nina: null,
          motivation: null,
          createdAt: now,
          updatedAt: now,
        },
        {
          firstName: 'Fatoumata',
          lastName: 'Diallo',
          fullName: 'Fatoumata Diallo',
          email: 'fatoumata.diallo@example.com',
          phone: '+22365432109',
          region: 'Sikasso',
          cercle: 'Sikasso',
          commune: 'Sikasso',
          profession: 'Commerçante',
          membershipNumber: 'ARM-20240102-0002',
          qrCode: 'ARM-20240102-0002',
          status: 'active',
          role: 'member',
          userId: null,
          nina: null,
          motivation: null,
          createdAt: now,
          updatedAt: now,
        },
        {
          firstName: 'Ibrahim',
          lastName: 'Traoré',
          fullName: 'Ibrahim Traoré',
          email: 'ibrahim.traore@example.com',
          phone: '+22354321098',
          region: 'Mopti',
          cercle: 'Mopti',
          commune: 'Mopti',
          profession: 'Médecin',
          membershipNumber: 'ARM-20240103-0003',
          qrCode: 'ARM-20240103-0003',
          status: 'active',
          role: 'coordinator',
          userId: null,
          nina: null,
          motivation: null,
          createdAt: now,
          updatedAt: now,
        },
      ];

      await app.db.insert(schema.memberProfiles).values(profileSeedData);
      app.logger.info({ count: profileSeedData.length }, 'Member profiles seeded');
    }
  } catch (error) {
    app.logger.error({ err: error }, 'Failed to seed members');
  }
}
