import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { eq, desc, count, and, or } from 'drizzle-orm';
import * as schema from '../db/schema.js';
import type { App } from '../index.js';

interface AdhesionBody {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  region?: string;
  commune?: string;
  cercle?: string;
  profession?: string;
  date_of_birth?: string;
  gender?: string;
  membership_type?: string;
  message?: string;
}

function generateMembershipNumber(existingCount: number): string {
  const year = new Date().getFullYear();
  const sequentialNumber = (existingCount + 1).toString().padStart(5, '0');
  return `ARM-${year}-${sequentialNumber}`;
}

function formatMember(member: any) {
  return {
    id: member.id,
    first_name: member.firstName,
    last_name: member.lastName,
    full_name: member.fullName,
    email: member.email,
    phone: member.phone,
    address: member.address,
    city: member.city,
    country: member.country,
    region: member.region,
    commune: member.commune,
    profession: member.profession,
    date_of_birth: member.dateOfBirth,
    gender: member.gender,
    status: member.status,
    membership_type: member.membershipType,
    membership_number: member.memberNumber,
    member_number: member.memberNumber,
    message: member.message,
    created_at: member.createdAt.toISOString(),
    updated_at: member.updatedAt.toISOString(),
  };
}

export function register(app: App, fastify: FastifyInstance) {
  // POST /api/adhesion - Register new member
  fastify.post<{ Body: AdhesionBody }>(
    '/api/adhesion',
    {
      schema: {
        description: 'Register a new member (adhesion)',
        tags: ['adhesion', 'members'],
        body: {
          type: 'object',
          required: ['first_name', 'last_name', 'email'],
          properties: {
            first_name: { type: 'string', description: 'First name' },
            last_name: { type: 'string', description: 'Last name' },
            email: { type: 'string', format: 'email', description: 'Email address' },
            phone: { type: 'string', description: 'Phone number' },
            address: { type: 'string', description: 'Street address' },
            city: { type: 'string', description: 'City' },
            country: { type: 'string', description: 'Country (default: Mali)' },
            region: { type: 'string', description: 'Region' },
            commune: { type: 'string', description: 'Commune' },
            cercle: { type: 'string', description: 'Cercle' },
            profession: { type: 'string', description: 'Profession' },
            date_of_birth: { type: 'string', description: 'Date of birth' },
            gender: { type: 'string', description: 'Gender' },
            membership_type: { type: 'string', description: 'Membership type (default: standard)' },
            message: { type: 'string', description: 'Additional message' },
          },
        },
        response: {
          201: {
            description: 'Member registered successfully',
            type: 'object',
            properties: {
              membership_number: { type: 'string' },
              member: { type: 'object' },
            },
          },
          400: {
            description: 'Validation error',
            type: 'object',
            properties: { error: { type: 'string' } },
          },
          409: {
            description: 'Email already exists',
            type: 'object',
            properties: { error: { type: 'string' } },
          },
        },
      },
    },
    async (request: FastifyRequest<{ Body: AdhesionBody }>, reply: FastifyReply) => {
      const { first_name, last_name, email, phone, address, city, country, region, commune, cercle, profession, date_of_birth, gender, membership_type, message } = request.body;

      // Validate required fields
      if (!first_name?.trim() || !last_name?.trim() || !email?.trim()) {
        app.logger.warn({ first_name, last_name, email }, 'Validation error: missing required fields');
        reply.status(400);
        return { error: 'first_name, last_name, and email are required' };
      }

      const normalizedEmail = email.trim().toLowerCase();

      app.logger.info({ email: normalizedEmail, first_name, last_name }, 'New adhesion registration');

      try {
        // Check for duplicate email
        const existingMembers = await app.db
          .select()
          .from(schema.members)
          .where(eq(schema.members.email, normalizedEmail));

        if (existingMembers.length > 0) {
          app.logger.warn({ email: normalizedEmail }, 'Email already exists');
          reply.status(409);
          return { error: 'Un membre avec cet email existe déjà' };
        }

        // Get count of existing members to generate sequential membership number
        const countResult = await app.db.select({ count: count() }).from(schema.members);
        const existingCount = countResult[0]?.count || 0;
        const membershipNumber = generateMembershipNumber(existingCount);

        const fullName = `${first_name.trim()} ${last_name.trim()}`;
        const now = new Date();

        // Insert into members table
        const membersResult = await app.db
          .insert(schema.members)
          .values({
            id: undefined as any,
            memberNumber: membershipNumber,
            membershipNumber,
            fullName,
            firstName: first_name.trim(),
            lastName: last_name.trim(),
            email: normalizedEmail,
            phone: phone?.trim() || null,
            address: address?.trim() || null,
            city: city?.trim() || null,
            country: country?.trim() || 'Mali',
            region: region?.trim() || null,
            commune: commune?.trim() || null,
            profession: profession?.trim() || null,
            dateOfBirth: date_of_birth || null,
            gender: gender?.trim() || null,
            status: 'pending',
            membershipType: membership_type?.trim() || 'standard',
            message: message?.trim() || null,
            createdAt: now,
            updatedAt: now,
          })
          .returning();

        const member = membersResult[0];
        app.logger.info({ memberId: member.id, membershipNumber }, 'Member inserted into members table');

        // Also insert into memberships table
        try {
          await app.db
            .insert(schema.memberships)
            .values({
              id: undefined as any,
              membershipNumber,
              userId: null,
              firstName: first_name.trim(),
              lastName: last_name.trim(),
              email: normalizedEmail,
              phone: phone?.trim() || null,
              address: address?.trim() || null,
              city: city?.trim() || null,
              country: country?.trim() || 'Mali',
              birthDate: date_of_birth || null,
              status: 'pending',
              createdAt: now,
              updatedAt: now,
            });
          app.logger.info({ membershipNumber }, 'Member inserted into memberships table');
        } catch (membershipError) {
          app.logger.warn({ err: membershipError, membershipNumber }, 'Failed to insert into memberships table (non-blocking)');
        }

        reply.status(201);
        return {
          membership_number: membershipNumber,
          member: formatMember(member),
        };
      } catch (error) {
        app.logger.error({ err: error, email: normalizedEmail }, 'Failed to register member');
        throw error;
      }
    }
  );

  // GET /api/members - Get all members with filtering and pagination
  fastify.get<{ Querystring: { status?: string; search?: string; limit?: string; offset?: string } }>(
    '/api/members',
    {
      schema: {
        description: 'Get all members with optional filtering',
        tags: ['members'],
        querystring: {
          type: 'object',
          properties: {
            status: { type: 'string', description: 'Filter by status (active, pending, rejected, suspended)' },
            search: { type: 'string', description: 'Search by full_name, email, or phone' },
            limit: { type: 'string', default: '100', description: 'Max results' },
            offset: { type: 'string', default: '0', description: 'Skip results' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              members: { type: 'array', items: { type: 'object' } },
              total: { type: 'number' },
            },
          },
        },
      },
    },
    async (request: FastifyRequest<{ Querystring: { status?: string; search?: string; limit?: string; offset?: string } }>, reply: FastifyReply) => {
      const { status, search, limit: limitStr, offset: offsetStr } = request.query;
      const pageLimit = Math.max(1, parseInt(limitStr || '100', 10));
      const pageOffset = Math.max(0, parseInt(offsetStr || '0', 10));

      app.logger.info({ status, search, limit: pageLimit, offset: pageOffset }, 'Fetching members');

      try {
        const conditions: any[] = [];

        if (status) {
          conditions.push(eq(schema.members.status, status));
        }

        // For search, we need to check multiple fields
        if (search) {
          const searchTerm = `%${search.toLowerCase()}%`;
          // Create search condition for full_name, email, or phone
          const fullNameLower = schema.members.fullName;
          const emailLower = schema.members.email;
          const phoneLower = schema.members.phone;

          // We'll do the filtering in application code for simplicity
        }

        // Build the WHERE clause
        let whereCondition: any = undefined;
        if (conditions.length > 0) {
          whereCondition = and(...conditions);
        }

        // Count total
        const countQueryBuilder = app.db.select({ count: count() }).from(schema.members);
        const totalResult = whereCondition
          ? await countQueryBuilder.where(whereCondition)
          : await countQueryBuilder;
        const total = totalResult[0]?.count || 0;

        // Fetch members
        const membersQueryBuilder = app.db.select().from(schema.members).orderBy(desc(schema.members.createdAt));
        let members = whereCondition
          ? await membersQueryBuilder.where(whereCondition).limit(pageLimit).offset(pageOffset)
          : await membersQueryBuilder.limit(pageLimit).offset(pageOffset);

        // Apply search filter in-memory if provided
        if (search) {
          const searchLower = search.toLowerCase();
          members = members.filter(m =>
            (m.fullName?.toLowerCase().includes(searchLower)) ||
            (m.email?.toLowerCase().includes(searchLower)) ||
            (m.phone?.toLowerCase().includes(searchLower))
          );
        }

        app.logger.info({ count: members.length, total }, 'Members retrieved');

        return {
          members: members.map(formatMember),
          total,
        };
      } catch (error) {
        app.logger.error({ err: error }, 'Failed to fetch members');
        throw error;
      }
    }
  );

  // GET /api/members/:id - Get single member by ID
  fastify.get<{ Params: { id: string } }>(
    '/api/members/:id',
    {
      schema: {
        description: 'Get a single member by ID',
        tags: ['members'],
        params: {
          type: 'object',
          required: ['id'],
          properties: { id: { type: 'string', format: 'uuid' } },
        },
        response: {
          200: { type: 'object' },
          404: { type: 'object', properties: { error: { type: 'string' } } },
        },
      },
    },
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const { id } = request.params;

      app.logger.info({ memberId: id }, 'Fetching member by ID');

      try {
        const members = await app.db
          .select()
          .from(schema.members)
          .where(eq(schema.members.id, id));

        if (members.length === 0) {
          app.logger.info({ memberId: id }, 'Member not found');
          reply.status(404);
          return { error: 'Member not found' };
        }

        app.logger.info({ memberId: id }, 'Member retrieved');
        return formatMember(members[0]);
      } catch (error) {
        app.logger.error({ err: error, memberId: id }, 'Failed to fetch member');
        throw error;
      }
    }
  );

  // PATCH /api/members/:id - Update member status
  fastify.patch<{ Params: { id: string }; Body: { status: string } }>(
    '/api/members/:id',
    {
      schema: {
        description: 'Update member status',
        tags: ['members'],
        params: {
          type: 'object',
          required: ['id'],
          properties: { id: { type: 'string', format: 'uuid' } },
        },
        body: {
          type: 'object',
          required: ['status'],
          properties: { status: { type: 'string', enum: ['active', 'pending', 'rejected', 'suspended'] } },
        },
        response: {
          200: { type: 'object' },
          404: { type: 'object', properties: { error: { type: 'string' } } },
        },
      },
    },
    async (request: FastifyRequest<{ Params: { id: string }; Body: { status: string } }>, reply: FastifyReply) => {
      const { id } = request.params;
      const { status } = request.body;

      app.logger.info({ memberId: id, status }, 'Updating member status');

      try {
        // Get the member first to retrieve their email
        const members = await app.db
          .select()
          .from(schema.members)
          .where(eq(schema.members.id, id));

        if (members.length === 0) {
          app.logger.info({ memberId: id }, 'Member not found');
          reply.status(404);
          return { error: 'Member not found' };
        }

        const member = members[0];
        const now = new Date();

        // Update members table
        const updatedMembers = await app.db
          .update(schema.members)
          .set({ status, updatedAt: now })
          .where(eq(schema.members.id, id))
          .returning();

        // Also update memberships table by email
        try {
          await app.db
            .update(schema.memberships)
            .set({ status, updatedAt: now })
            .where(eq(schema.memberships.email, member.email));
        } catch (membershipError) {
          app.logger.warn({ err: membershipError, email: member.email }, 'Failed to update memberships table (non-blocking)');
        }

        app.logger.info({ memberId: id, status }, 'Member status updated');
        return formatMember(updatedMembers[0]);
      } catch (error) {
        app.logger.error({ err: error, memberId: id }, 'Failed to update member status');
        throw error;
      }
    }
  );

  // DELETE /api/members/:id - Delete member
  fastify.delete<{ Params: { id: string } }>(
    '/api/members/:id',
    {
      schema: {
        description: 'Delete a member',
        tags: ['members'],
        params: {
          type: 'object',
          required: ['id'],
          properties: { id: { type: 'string', format: 'uuid' } },
        },
        response: {
          200: { type: 'object', properties: { success: { type: 'boolean' } } },
          404: { type: 'object', properties: { error: { type: 'string' } } },
        },
      },
    },
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
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
        throw error;
      }
    }
  );

  // GET /api/members/stats - Member statistics
  fastify.get(
    '/api/members/stats',
    {
      schema: {
        description: 'Get member statistics',
        tags: ['members'],
        response: {
          200: {
            type: 'object',
            properties: {
              total: { type: 'number' },
              active: { type: 'number' },
              pending: { type: 'number' },
              rejected: { type: 'number' },
              by_region: { type: 'object' },
            },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      app.logger.info('Fetching member statistics');

      try {
        const totalResult = await app.db.select({ count: count() }).from(schema.members);
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

        const rejectedResult = await app.db
          .select({ count: count() })
          .from(schema.members)
          .where(eq(schema.members.status, 'rejected'));
        const rejected = rejectedResult[0]?.count || 0;

        // By region
        const byRegionResults = await app.db
          .select({
            region: schema.members.region,
            count: count(),
          })
          .from(schema.members)
          .groupBy(schema.members.region)
          .orderBy(desc(count()));

        const byRegion: Record<string, number> = {};
        byRegionResults.forEach(r => {
          if (r.region) {
            byRegion[r.region] = r.count;
          }
        });

        app.logger.info({ total, active, pending, rejected }, 'Statistics retrieved');

        return {
          total,
          active,
          pending,
          rejected,
          by_region: byRegion,
        };
      } catch (error) {
        app.logger.error({ err: error }, 'Failed to fetch statistics');
        throw error;
      }
    }
  );
}

export async function seedAdhesion(app: App) {
  try {
    // Check if we already have members
    const existing = await app.db.select({ count: count() }).from(schema.members);
    const existingCount = existing[0]?.count || 0;

    if (existingCount < 3) {
      app.logger.info('Seeding members table');

      const now = new Date();
      const year = new Date().getFullYear();

      const seedData = [
        {
          id: undefined as any,
          memberNumber: `ARM-${year}-00001`,
          membershipNumber: `ARM-${year}-00001`,
          fullName: 'Amadou Coulibaly',
          firstName: 'Amadou',
          lastName: 'Coulibaly',
          email: 'amadou.coulibaly@example.com',
          phone: '+223 76 12 34 56',
          address: 'Quartier du Fleuve',
          city: 'Bamako',
          country: 'Mali',
          region: 'Bamako',
          commune: 'Commune I',
          profession: 'Enseignant',
          dateOfBirth: null,
          gender: 'male',
          status: 'active',
          membershipType: 'standard',
          message: null,
          createdAt: now,
          updatedAt: now,
        },
        {
          id: undefined as any,
          memberNumber: `ARM-${year}-00002`,
          membershipNumber: `ARM-${year}-00002`,
          fullName: 'Fatoumata Diallo',
          firstName: 'Fatoumata',
          lastName: 'Diallo',
          email: 'fatoumata.diallo@example.com',
          phone: '+223 65 98 76 54',
          address: 'Hamdallaye ACI',
          city: 'Bamako',
          country: 'Mali',
          region: 'Bamako',
          commune: 'Commune IV',
          profession: 'Commerçante',
          dateOfBirth: null,
          gender: 'female',
          status: 'active',
          membershipType: 'sympathisant',
          message: null,
          createdAt: now,
          updatedAt: now,
        },
        {
          id: undefined as any,
          memberNumber: `ARM-${year}-00003`,
          membershipNumber: `ARM-${year}-00003`,
          fullName: 'Ibrahim Traoré',
          firstName: 'Ibrahim',
          lastName: 'Traoré',
          email: 'ibrahim.traore@example.com',
          phone: '+223 79 45 67 89',
          address: 'Médine',
          city: 'Bamako',
          country: 'Mali',
          region: 'Koulikoro',
          commune: 'Kati',
          profession: 'Agriculteur',
          dateOfBirth: null,
          gender: 'male',
          status: 'pending',
          membershipType: 'standard',
          message: null,
          createdAt: now,
          updatedAt: now,
        },
      ];

      await app.db.insert(schema.members).values(seedData.slice(existingCount));
      app.logger.info({ count: seedData.length - existingCount }, 'Members seeded');
    }

    // Seed memberships table
    const existingMemberships = await app.db.select({ count: count() }).from(schema.memberships);
    const membershipCount = existingMemberships[0]?.count || 0;

    if (membershipCount < 3) {
      app.logger.info('Seeding memberships table');

      const now = new Date();
      const year = new Date().getFullYear();

      const membershipSeedData = [
        {
          id: undefined as any,
          membershipNumber: `ARM-${year}-00001`,
          userId: null,
          firstName: 'Amadou',
          lastName: 'Coulibaly',
          email: 'amadou.coulibaly@example.com',
          phone: '+223 76 12 34 56',
          address: 'Quartier du Fleuve',
          city: 'Bamako',
          country: 'Mali',
          birthDate: null,
          status: 'active',
          createdAt: now,
          updatedAt: now,
        },
        {
          id: undefined as any,
          membershipNumber: `ARM-${year}-00002`,
          userId: null,
          firstName: 'Fatoumata',
          lastName: 'Diallo',
          email: 'fatoumata.diallo@example.com',
          phone: '+223 65 98 76 54',
          address: 'Hamdallaye ACI',
          city: 'Bamako',
          country: 'Mali',
          birthDate: null,
          status: 'active',
          createdAt: now,
          updatedAt: now,
        },
        {
          id: undefined as any,
          membershipNumber: `ARM-${year}-00003`,
          userId: null,
          firstName: 'Ibrahim',
          lastName: 'Traoré',
          email: 'ibrahim.traore@example.com',
          phone: '+223 79 45 67 89',
          address: 'Médine',
          city: 'Bamako',
          country: 'Mali',
          birthDate: null,
          status: 'pending',
          createdAt: now,
          updatedAt: now,
        },
      ];

      await app.db.insert(schema.memberships).values(membershipSeedData.slice(membershipCount));
      app.logger.info({ count: membershipSeedData.length - membershipCount }, 'Memberships seeded');
    }
  } catch (error) {
    app.logger.error({ err: error }, 'Failed to seed adhesion data');
  }
}
