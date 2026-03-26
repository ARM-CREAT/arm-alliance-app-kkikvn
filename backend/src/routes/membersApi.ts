import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { eq, ilike, and, or, desc, count, isNotNull } from 'drizzle-orm';
import * as schema from '../db/schema.js';
import type { App } from '../index.js';

interface CreateMemberBody {
  full_name: string;
  phone: string;
  email?: string;
  region?: string;
  commune?: string;
  profession?: string;
  role?: string;
  motivation?: string;
  nina?: string;
  cercle?: string;
  first_name?: string;
  last_name?: string;
}

interface UpdateMemberBody {
  full_name?: string;
  phone?: string;
  email?: string;
  region?: string;
  commune?: string;
  profession?: string;
  role?: string;
  status?: string;
  motivation?: string;
  nina?: string;
  cercle?: string;
  first_name?: string;
  last_name?: string;
}

/**
 * Generate membership number in format ARM-YYYY-XXXX
 * YYYY = current year, XXXX = zero-padded count (count + 1)
 */
function generateMembershipNumber(count: number): string {
  const year = new Date().getFullYear();
  const sequence = String(count + 1).padStart(4, '0');
  return `ARM-${year}-${sequence}`;
}

/**
 * Format member_profiles row to API response
 */
function formatMemberResponse(m: any) {
  return {
    id: m.id,
    user_id: m.userId,
    full_name: m.fullName,
    first_name: m.firstName,
    last_name: m.lastName,
    phone: m.phone,
    email: m.email,
    nina: m.nina,
    commune: m.commune,
    region: m.region,
    cercle: m.cercle,
    profession: m.profession,
    motivation: m.motivation,
    membership_number: m.membershipNumber,
    qr_code: m.qrCode,
    status: m.status,
    role: m.role,
    created_at: m.createdAt.toISOString(),
    updated_at: m.updatedAt.toISOString(),
  };
}

/**
 * Shared member creation logic used by both POST endpoints
 */
async function createMember(app: App, body: CreateMemberBody): Promise<{
  success: boolean;
  statusCode: number;
  data?: any;
  error?: string;
}> {
  const { full_name, phone, email, region, commune, profession, role, motivation, nina, cercle, first_name, last_name } = body;

  app.logger.info({ full_name, phone }, 'Starting member creation');

  try {
    // Validate required fields
    if (!full_name || !phone) {
      app.logger.warn('Missing required fields: full_name or phone');
      return {
        success: false,
        statusCode: 400,
        error: 'full_name and phone are required',
      };
    }

    // Check for duplicate phone
    const existing = await app.db
      .select()
      .from(schema.memberProfiles)
      .where(eq(schema.memberProfiles.phone, phone));

    if (existing.length > 0) {
      app.logger.warn({ phone }, 'Phone number already exists');
      return {
        success: false,
        statusCode: 409,
        error: 'Un membre avec ce numéro de téléphone existe déjà.',
      };
    }

    // Count existing members to generate membership number
    const countResult = await app.db
      .select({ count: count() })
      .from(schema.memberProfiles);
    const memberCount = countResult[0]?.count || 0;
    const membershipNumber = generateMembershipNumber(memberCount);
    const qrCode = membershipNumber; // QR code = membership number

    app.logger.debug({ membershipNumber }, 'Generated membership number');

    // Insert member into member_profiles
    const result = await app.db
      .insert(schema.memberProfiles)
      .values({
        fullName: full_name,
        firstName: first_name,
        lastName: last_name,
        phone,
        email,
        nina,
        commune: commune || 'Non renseigné',
        region,
        cercle,
        profession: profession || 'Non renseigné',
        motivation,
        membershipNumber,
        qrCode,
        status: 'pending',
        role: role || 'member',
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    const member = result[0];
    app.logger.info({ memberId: member.id, membershipNumber }, 'Member created successfully');

    return {
      success: true,
      statusCode: 201,
      data: formatMemberResponse(member),
    };
  } catch (error) {
    app.logger.error({ err: error, full_name, phone }, 'Failed to create member');
    return {
      success: false,
      statusCode: 500,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export function register(app: App, fastify: FastifyInstance) {
  // POST /api/members/register - Create new member (PUBLIC)
  fastify.post<{ Body: CreateMemberBody }>(
    '/api/members/register',
    {
      schema: {
        description: 'Register a new member (public, no authentication required)',
        tags: ['members'],
        body: {
          type: 'object',
          required: ['full_name', 'phone'],
          properties: {
            full_name: { type: 'string' },
            phone: { type: 'string' },
            email: { type: 'string', format: 'email' },
            region: { type: 'string' },
            commune: { type: 'string' },
            profession: { type: 'string' },
            role: { type: 'string' },
            motivation: { type: 'string' },
            nina: { type: 'string' },
            cercle: { type: 'string' },
            first_name: { type: 'string' },
            last_name: { type: 'string' },
          },
        },
        response: {
          201: {
            type: 'object',
            properties: { id: { type: 'string' }, membership_number: { type: 'string' } },
          },
          400: { type: 'object', properties: { error: { type: 'string' } } },
          409: { type: 'object', properties: { error: { type: 'string' } } },
          500: { type: 'object', properties: { error: { type: 'string' } } },
        },
      },
    },
    async (request: FastifyRequest<{ Body: CreateMemberBody }>, reply: FastifyReply) => {
      const result = await createMember(app, request.body);
      reply.status(result.statusCode);
      return result.data || { error: result.error };
    }
  );

  // GET /api/members/stats - Get statistics (MUST be before GET /:id)
  fastify.get(
    '/api/members/stats',
    {
      schema: {
        description: 'Get members statistics',
        tags: ['members'],
        response: {
          200: {
            type: 'object',
            properties: {
              total: { type: 'number' },
              pending: { type: 'number' },
              active: { type: 'number' },
              suspended: { type: 'number' },
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
          500: { type: 'object', properties: { error: { type: 'string' } } },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      app.logger.info('Fetching members statistics');

      try {
        // Count by status
        const countResult = await app.db
          .select({ count: count() })
          .from(schema.memberProfiles);
        const total = countResult[0]?.count || 0;

        const pendingResult = await app.db
          .select({ count: count() })
          .from(schema.memberProfiles)
          .where(eq(schema.memberProfiles.status, 'pending'));
        const pending = pendingResult[0]?.count || 0;

        const activeResult = await app.db
          .select({ count: count() })
          .from(schema.memberProfiles)
          .where(eq(schema.memberProfiles.status, 'active'));
        const active = activeResult[0]?.count || 0;

        const suspendedResult = await app.db
          .select({ count: count() })
          .from(schema.memberProfiles)
          .where(eq(schema.memberProfiles.status, 'suspended'));
        const suspended = suspendedResult[0]?.count || 0;

        // Count by region (exclude null regions)
        const regionResults = await app.db
          .select({
            region: schema.memberProfiles.region,
            count: count(),
          })
          .from(schema.memberProfiles)
          .where(isNotNull(schema.memberProfiles.region))
          .groupBy(schema.memberProfiles.region)
          .orderBy(desc(count()));

        const byRegion = regionResults.map(r => ({
          region: r.region || 'Unknown',
          count: r.count,
        }));

        app.logger.info({ total, pending, active, suspended }, 'Statistics retrieved');

        return {
          total,
          pending,
          active,
          suspended,
          byRegion,
        };
      } catch (error) {
        app.logger.error({ err: error }, 'Failed to fetch statistics');
        reply.status(500);
        return { error: error instanceof Error ? error.message : 'Unknown error' };
      }
    }
  );

  // GET /api/members - List members
  fastify.get<{ Querystring: { page?: string; limit?: string; status?: string; region?: string; search?: string } }>(
    '/api/members',
    {
      schema: {
        description: 'Get members list',
        tags: ['members'],
        querystring: {
          type: 'object',
          properties: {
            page: { type: 'string', default: '1' },
            limit: { type: 'string', default: '20' },
            status: { type: 'string', description: 'Filter by status' },
            region: { type: 'string', description: 'Filter by region' },
            search: { type: 'string', description: 'Search by full_name or phone' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              members: { type: 'array', items: { type: 'object' } },
              total: { type: 'number' },
              page: { type: 'number' },
              limit: { type: 'number' },
            },
          },
          500: { type: 'object', properties: { error: { type: 'string' } } },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const query = request.query as { page?: string; limit?: string; status?: string; region?: string; search?: string };
      const page = Math.max(1, parseInt(query.page || '1', 10));
      const limit = Math.max(1, parseInt(query.limit || '20', 10));
      const offset = (page - 1) * limit;

      app.logger.info({ page, limit, status: query.status, region: query.region, search: query.search }, 'Fetching members list');

      try {
        // Build WHERE clause
        const conditions: any[] = [];

        if (query.status) {
          conditions.push(eq(schema.memberProfiles.status, query.status));
        }

        if (query.region) {
          conditions.push(eq(schema.memberProfiles.region, query.region));
        }

        if (query.search) {
          conditions.push(
            or(
              ilike(schema.memberProfiles.fullName, `%${query.search}%`),
              ilike(schema.memberProfiles.phone, `%${query.search}%`)
            )
          );
        }

        const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

        // Get total count
        const countResult = await app.db
          .select({ count: count() })
          .from(schema.memberProfiles)
          .where(whereClause);
        const total = countResult[0]?.count || 0;

        // Get paginated results
        const members = await app.db
          .select()
          .from(schema.memberProfiles)
          .where(whereClause)
          .orderBy(desc(schema.memberProfiles.createdAt))
          .limit(limit)
          .offset(offset);

        app.logger.info({ count: members.length, total }, 'Members list retrieved');

        return {
          members: members.map(formatMemberResponse),
          total,
          page,
          limit,
        };
      } catch (error) {
        app.logger.error({ err: error }, 'Failed to fetch members list');
        reply.status(500);
        return { error: error instanceof Error ? error.message : 'Unknown error' };
      }
    }
  );

  // POST /api/members - Create new member (PUBLIC)
  fastify.post<{ Body: CreateMemberBody }>(
    '/api/members',
    {
      schema: {
        description: 'Register a new member (public, no authentication required)',
        tags: ['members'],
        body: {
          type: 'object',
          required: ['full_name', 'phone'],
          properties: {
            full_name: { type: 'string' },
            phone: { type: 'string' },
            email: { type: 'string', format: 'email' },
            region: { type: 'string' },
            commune: { type: 'string' },
            profession: { type: 'string' },
            role: { type: 'string' },
            motivation: { type: 'string' },
            nina: { type: 'string' },
            cercle: { type: 'string' },
            first_name: { type: 'string' },
            last_name: { type: 'string' },
          },
        },
        response: {
          201: {
            type: 'object',
            properties: { id: { type: 'string' }, membership_number: { type: 'string' } },
          },
          400: { type: 'object', properties: { error: { type: 'string' } } },
          409: { type: 'object', properties: { error: { type: 'string' } } },
          500: { type: 'object', properties: { error: { type: 'string' } } },
        },
      },
    },
    async (request: FastifyRequest<{ Body: CreateMemberBody }>, reply: FastifyReply) => {
      const result = await createMember(app, request.body);
      reply.status(result.statusCode);
      return result.data || { error: result.error };
    }
  );

  // GET /api/members/:id - Get member by ID (MUST be after /stats and /)
  fastify.get<{ Params: { id: string } }>(
    '/api/members/:id',
    {
      schema: {
        description: 'Get member by ID',
        tags: ['members'],
        params: {
          type: 'object',
          required: ['id'],
          properties: { id: { type: 'string', format: 'uuid' } },
        },
        response: {
          200: { type: 'object' },
          404: { type: 'object', properties: { error: { type: 'string' } } },
          500: { type: 'object', properties: { error: { type: 'string' } } },
        },
      },
    },
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const { id } = request.params;

      app.logger.info({ memberId: id }, 'Fetching member');

      try {
        const result = await app.db
          .select()
          .from(schema.memberProfiles)
          .where(eq(schema.memberProfiles.id, id));

        if (result.length === 0) {
          app.logger.info({ memberId: id }, 'Member not found');
          reply.status(404);
          return { error: 'Member not found' };
        }

        app.logger.info({ memberId: id }, 'Member retrieved');
        return formatMemberResponse(result[0]);
      } catch (error) {
        app.logger.error({ err: error, memberId: id }, 'Failed to fetch member');
        reply.status(500);
        return { error: error instanceof Error ? error.message : 'Unknown error' };
      }
    }
  );

  // PUT /api/members/:id - Update member
  fastify.put<{ Params: { id: string }; Body: UpdateMemberBody }>(
    '/api/members/:id',
    {
      schema: {
        description: 'Update member',
        tags: ['members'],
        params: {
          type: 'object',
          required: ['id'],
          properties: { id: { type: 'string', format: 'uuid' } },
        },
        body: {
          type: 'object',
          properties: {
            full_name: { type: 'string' },
            phone: { type: 'string' },
            email: { type: 'string' },
            region: { type: 'string' },
            commune: { type: 'string' },
            profession: { type: 'string' },
            role: { type: 'string' },
            status: { type: 'string' },
            motivation: { type: 'string' },
            nina: { type: 'string' },
            cercle: { type: 'string' },
            first_name: { type: 'string' },
            last_name: { type: 'string' },
          },
        },
        response: {
          200: { type: 'object' },
          404: { type: 'object', properties: { error: { type: 'string' } } },
          500: { type: 'object', properties: { error: { type: 'string' } } },
        },
      },
    },
    async (request: FastifyRequest<{ Params: { id: string }; Body: UpdateMemberBody }>, reply: FastifyReply) => {
      const { id } = request.params;
      const body = request.body;

      app.logger.info({ memberId: id }, 'Updating member');

      try {
        // Build updates object dynamically
        const updates: any = {};
        if (body.full_name !== undefined) updates.fullName = body.full_name;
        if (body.first_name !== undefined) updates.firstName = body.first_name;
        if (body.last_name !== undefined) updates.lastName = body.last_name;
        if (body.phone !== undefined) updates.phone = body.phone;
        if (body.email !== undefined) updates.email = body.email;
        if (body.nina !== undefined) updates.nina = body.nina;
        if (body.commune !== undefined) updates.commune = body.commune;
        if (body.region !== undefined) updates.region = body.region;
        if (body.cercle !== undefined) updates.cercle = body.cercle;
        if (body.profession !== undefined) updates.profession = body.profession;
        if (body.motivation !== undefined) updates.motivation = body.motivation;
        if (body.role !== undefined) updates.role = body.role;
        if (body.status !== undefined) updates.status = body.status;
        updates.updatedAt = new Date();

        const result = await app.db
          .update(schema.memberProfiles)
          .set(updates)
          .where(eq(schema.memberProfiles.id, id))
          .returning();

        if (result.length === 0) {
          app.logger.info({ memberId: id }, 'Member not found for update');
          reply.status(404);
          return { error: 'Member not found' };
        }

        app.logger.info({ memberId: id }, 'Member updated');
        return formatMemberResponse(result[0]);
      } catch (error) {
        app.logger.error({ err: error, memberId: id }, 'Failed to update member');
        reply.status(500);
        return { error: error instanceof Error ? error.message : 'Unknown error' };
      }
    }
  );

  // DELETE /api/members/:id - Delete member
  fastify.delete<{ Params: { id: string } }>(
    '/api/members/:id',
    {
      schema: {
        description: 'Delete member',
        tags: ['members'],
        params: {
          type: 'object',
          required: ['id'],
          properties: { id: { type: 'string', format: 'uuid' } },
        },
        response: {
          200: { type: 'object', properties: { success: { type: 'boolean' } } },
          404: { type: 'object', properties: { error: { type: 'string' } } },
          500: { type: 'object', properties: { error: { type: 'string' } } },
        },
      },
    },
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const { id } = request.params;

      app.logger.info({ memberId: id }, 'Deleting member');

      try {
        const result = await app.db
          .delete(schema.memberProfiles)
          .where(eq(schema.memberProfiles.id, id))
          .returning();

        if (result.length === 0) {
          app.logger.info({ memberId: id }, 'Member not found for deletion');
          reply.status(404);
          return { error: 'Member not found' };
        }

        app.logger.info({ memberId: id }, 'Member deleted successfully');
        return { success: true };
      } catch (error) {
        app.logger.error({ err: error, memberId: id }, 'Failed to delete member');
        reply.status(500);
        return { error: error instanceof Error ? error.message : 'Unknown error' };
      }
    }
  );
}

export async function seedMembers(app: App) {
  try {
    const existing = await app.db.select().from(schema.memberProfiles);

    if (existing.length === 0) {
      app.logger.info('Seeding member_profiles table');

      const currentYear = new Date().getFullYear();
      const seedData = [
        {
          fullName: 'Amadou Coulibaly',
          firstName: 'Amadou',
          lastName: 'Coulibaly',
          phone: '+22376543210',
          commune: 'Bamako',
          region: 'Bamako',
          profession: 'Ingénieur',
          membershipNumber: generateMembershipNumber(0),
          qrCode: generateMembershipNumber(0),
          status: 'active',
          role: 'member',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          fullName: 'Fatoumata Diallo',
          firstName: 'Fatoumata',
          lastName: 'Diallo',
          phone: '+22365432109',
          commune: 'Sikasso',
          region: 'Sikasso',
          profession: 'Médecin',
          membershipNumber: generateMembershipNumber(1),
          qrCode: generateMembershipNumber(1),
          status: 'active',
          role: 'member',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          fullName: 'Ibrahim Traoré',
          firstName: 'Ibrahim',
          lastName: 'Traoré',
          phone: '+22354321098',
          commune: 'Mopti',
          region: 'Mopti',
          profession: 'Professeur',
          membershipNumber: generateMembershipNumber(2),
          qrCode: generateMembershipNumber(2),
          status: 'pending',
          role: 'member',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      for (const member of seedData) {
        await app.db.insert(schema.memberProfiles).values(member);
      }

      app.logger.info({ count: seedData.length }, 'Members seeded');
    }
  } catch (error) {
    app.logger.error({ err: error }, 'Failed to seed members');
  }
}
