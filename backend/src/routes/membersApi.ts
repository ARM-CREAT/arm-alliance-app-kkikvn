import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { eq, ilike, or, desc, and } from 'drizzle-orm';
import { sql } from 'drizzle-orm';
import * as schema from '../db/schema.js';
import type { App } from '../index.js';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

function verifyAdminPassword(request: FastifyRequest, reply: FastifyReply): boolean {
  const password = request.headers['x-admin-password'];
  if (!password || password !== ADMIN_PASSWORD) {
    reply.status(401);
    return false;
  }
  return true;
}

async function generateMemberNumber(app: App): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `ARM-${year}-`;

  // Get the highest sequence number for this year
  const result = await app.db
    .select()
    .from(schema.members)
    .where(sql`${schema.members.memberNumber} LIKE ${prefix + '%'}`);

  let nextSeq = 1;
  if (result.length > 0) {
    // Extract the numeric part from existing member numbers
    const numbers = result
      .map(m => parseInt(m.memberNumber.split('-')[2], 10))
      .filter(n => !isNaN(n))
      .sort((a, b) => b - a);

    if (numbers.length > 0) {
      nextSeq = numbers[0] + 1;
    }
  }

  return `${prefix}${String(nextSeq).padStart(5, '0')}`;
}

export async function seedMembers(app: App) {
  try {
    const existing = await app.db.select().from(schema.members);

    if (existing.length === 0) {
      app.logger.info('Seeding members table');
      const SAMPLE_MEMBERS = [
        {
          memberNumber: 'ARM-2025-00001',
          fullName: 'Amadou Coulibaly',
          phone: '+22376543210',
          commune: 'Bamako',
          status: 'active',
        },
        {
          memberNumber: 'ARM-2025-00002',
          fullName: 'Fatoumata Diarra',
          phone: '+22365432109',
          commune: 'Sikasso',
          status: 'active',
        },
        {
          memberNumber: 'ARM-2025-00003',
          fullName: 'Moussa Traoré',
          phone: '+22354321098',
          commune: 'Mopti',
          status: 'pending',
        },
        {
          memberNumber: 'ARM-2025-00004',
          fullName: 'Mariam Koné',
          phone: '+22343210987',
          commune: 'Kayes',
          status: 'active',
        },
        {
          memberNumber: 'ARM-2025-00005',
          fullName: 'Ibrahim Sanogo',
          phone: '+22332109876',
          commune: 'Ségou',
          status: 'suspended',
        },
      ];

      await app.db.insert(schema.members).values(SAMPLE_MEMBERS);
      app.logger.info({ count: SAMPLE_MEMBERS.length }, 'Members seeded');
    }
  } catch (error) {
    app.logger.error({ err: error }, 'Failed to seed members');
  }
}

export function register(app: App, fastify: FastifyInstance) {
  // POST /api/members - Register new member (PUBLIC)
  fastify.post<{ Body: { full_name: string; phone: string; commune: string } }>(
    '/api/members',
    {
      schema: {
        description: 'Register a new member',
        tags: ['members'],
        body: {
          type: 'object',
          properties: {
            full_name: { type: 'string' },
            phone: { type: 'string' },
            commune: { type: 'string' },
          },
          required: ['full_name', 'phone', 'commune'],
        },
        response: {
          201: { type: 'object' },
          400: { type: 'object' },
          409: { type: 'object' },
        },
      },
    },
    async (request, reply) => {
      const { full_name, phone, commune } = request.body;

      // Validate required fields
      if (!full_name || typeof full_name !== 'string' || !full_name.trim()) {
        app.logger.warn({ body: request.body }, 'Missing or invalid full_name');
        reply.status(400);
        return { error: 'full_name is required and must be a non-empty string' };
      }

      if (!phone || typeof phone !== 'string' || !phone.trim()) {
        app.logger.warn({ body: request.body }, 'Missing or invalid phone');
        reply.status(400);
        return { error: 'phone is required and must be a non-empty string' };
      }

      if (!commune || typeof commune !== 'string' || !commune.trim()) {
        app.logger.warn({ body: request.body }, 'Missing or invalid commune');
        reply.status(400);
        return { error: 'commune is required and must be a non-empty string' };
      }

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
            error: 'duplicate',
            member_number: existing[0].memberNumber,
            full_name: existing[0].fullName,
          };
        }

        // Generate member number
        const memberNumber = await generateMemberNumber(app);

        // Insert member
        const result = await app.db
          .insert(schema.members)
          .values({
            memberNumber,
            fullName: full_name.trim(),
            phone: phone.trim(),
            commune: commune.trim(),
            status: 'active',
          })
          .returning();

        reply.status(201);
        app.logger.info({ memberId: result[0].id, memberNumber }, 'Member registered');

        return {
          id: result[0].id,
          member_number: result[0].memberNumber,
          full_name: result[0].fullName,
          phone: result[0].phone,
          commune: result[0].commune,
          status: result[0].status,
          created_at: result[0].createdAt,
        };
      } catch (error) {
        app.logger.error({ err: error, phone }, 'Failed to register member');
        throw error;
      }
    }
  );

  // GET /api/members/stats - Get member statistics (ADMIN)
  fastify.get(
    '/api/members/stats',
    {
      schema: {
        description: 'Get member statistics (admin only)',
        tags: ['members'],
        response: {
          200: { type: 'object' },
          401: { type: 'object' },
        },
      },
    },
    async (request, reply) => {
      if (!verifyAdminPassword(request, reply)) {
        return { error: 'unauthorized' };
      }

      app.logger.info('Fetching member statistics');

      try {
        const allMembers = await app.db.select().from(schema.members);

        const stats = {
          total: allMembers.length,
          active: allMembers.filter(m => m.status === 'active').length,
          pending: allMembers.filter(m => m.status === 'pending').length,
          suspended: allMembers.filter(m => m.status === 'suspended').length,
        };

        app.logger.info(stats, 'Member statistics retrieved');
        return stats;
      } catch (error) {
        app.logger.error({ err: error }, 'Failed to fetch statistics');
        throw error;
      }
    }
  );

  // GET /api/members/by-phone/:phone - Get member by phone (PUBLIC)
  fastify.get<{ Params: { phone: string } }>(
    '/api/members/by-phone/:phone',
    {
      schema: {
        description: 'Get member by phone number',
        tags: ['members'],
        params: {
          type: 'object',
          properties: {
            phone: { type: 'string' },
          },
        },
        response: {
          200: { type: 'object' },
          404: { type: 'object' },
        },
      },
    },
    async (request, reply) => {
      const { phone } = request.params;

      app.logger.info({ phone }, 'Fetching member by phone');

      try {
        const member = await app.db
          .select()
          .from(schema.members)
          .where(eq(schema.members.phone, phone))
          .limit(1);

        if (member.length === 0) {
          reply.status(404);
          return { error: 'not_found' };
        }

        const m = member[0];
        return {
          member_number: m.memberNumber,
          full_name: m.fullName,
          commune: m.commune,
          status: m.status,
          created_at: m.createdAt,
        };
      } catch (error) {
        app.logger.error({ err: error, phone }, 'Failed to fetch member by phone');
        throw error;
      }
    }
  );

  // GET /api/members - Get all members with search and pagination (ADMIN)
  fastify.get<{
    Querystring: { search?: string; status?: string; page?: string; limit?: string };
  }>(
    '/api/members',
    {
      schema: {
        description: 'Get all members (admin only)',
        tags: ['members'],
        querystring: {
          type: 'object',
          properties: {
            search: { type: 'string' },
            status: { type: 'string' },
            page: { type: 'string' },
            limit: { type: 'string' },
          },
        },
        response: {
          200: { type: 'object' },
          401: { type: 'object' },
        },
      },
    },
    async (request, reply) => {
      if (!verifyAdminPassword(request, reply)) {
        return { error: 'unauthorized' };
      }

      const search = (request.query.search as string) || '';
      const statusFilter = (request.query.status as string) || '';
      const page = Math.max(1, parseInt(request.query.page as string) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(request.query.limit as string) || 50));

      app.logger.info({ search, statusFilter, page, limit }, 'Fetching members');

      try {
        let query = app.db.select().from(schema.members);

        // Apply search filter
        if (search) {
          const searchTerm = `%${search}%`;
          query = query.where(
            or(
              ilike(schema.members.fullName, searchTerm),
              ilike(schema.members.phone, searchTerm),
              ilike(schema.members.commune, searchTerm)
            )
          ) as any;
        }

        // Apply status filter
        if (statusFilter) {
          query = query.where(eq(schema.members.status, statusFilter)) as any;
        }

        // Get total count
        const countResult = await (query as any);
        const total = countResult.length;

        // Apply pagination
        const offset = (page - 1) * limit;
        const results = await (query
          .orderBy(desc(schema.members.createdAt))
          .limit(limit)
          .offset(offset) as any);

        const members = results.map((m: any) => ({
          id: m.id,
          member_number: m.memberNumber,
          full_name: m.fullName,
          phone: m.phone,
          commune: m.commune,
          status: m.status,
          created_at: m.createdAt,
        }));

        app.logger.info({ count: members.length, total }, 'Members fetched');

        return {
          members,
          total,
          page,
          limit,
        };
      } catch (error) {
        app.logger.error({ err: error }, 'Failed to fetch members');
        throw error;
      }
    }
  );

  // GET /api/members/:id - Get member by ID (ADMIN)
  fastify.get<{ Params: { id: string } }>(
    '/api/members/:id',
    {
      schema: {
        description: 'Get member by ID (admin only)',
        tags: ['members'],
        params: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
          },
        },
        response: {
          200: { type: 'object' },
          401: { type: 'object' },
          404: { type: 'object' },
        },
      },
    },
    async (request, reply) => {
      if (!verifyAdminPassword(request, reply)) {
        return { error: 'unauthorized' };
      }

      const { id } = request.params;

      app.logger.info({ id }, 'Fetching member by ID');

      try {
        const member = await app.db
          .select()
          .from(schema.members)
          .where(eq(schema.members.id, id as any))
          .limit(1);

        if (member.length === 0) {
          reply.status(404);
          return { error: 'not_found' };
        }

        const m = member[0];
        return {
          id: m.id,
          member_number: m.memberNumber,
          full_name: m.fullName,
          phone: m.phone,
          commune: m.commune,
          status: m.status,
          created_at: m.createdAt,
        };
      } catch (error) {
        app.logger.error({ err: error, id }, 'Failed to fetch member');
        throw error;
      }
    }
  );

  // PATCH /api/members/:id/status - Update member status (ADMIN)
  fastify.patch<{ Params: { id: string }; Body: { status: string } }>(
    '/api/members/:id/status',
    {
      schema: {
        description: 'Update member status (admin only)',
        tags: ['members'],
        params: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
          },
        },
        body: {
          type: 'object',
          properties: {
            status: { type: 'string', enum: ['active', 'pending', 'suspended'] },
          },
          required: ['status'],
        },
        response: {
          200: { type: 'object' },
          400: { type: 'object' },
          401: { type: 'object' },
          404: { type: 'object' },
        },
      },
    },
    async (request, reply) => {
      if (!verifyAdminPassword(request, reply)) {
        return { error: 'unauthorized' };
      }

      const { id } = request.params;
      const { status } = request.body;

      if (!['active', 'pending', 'suspended'].includes(status)) {
        reply.status(400);
        return { error: 'invalid_status' };
      }

      app.logger.info({ id, status }, 'Updating member status');

      try {
        const result = await app.db
          .update(schema.members)
          .set({ status })
          .where(eq(schema.members.id, id as any))
          .returning();

        if (result.length === 0) {
          reply.status(404);
          return { error: 'not_found' };
        }

        const m = result[0];
        app.logger.info({ id, status }, 'Member status updated');

        return {
          id: m.id,
          member_number: m.memberNumber,
          full_name: m.fullName,
          phone: m.phone,
          commune: m.commune,
          status: m.status,
          created_at: m.createdAt,
        };
      } catch (error) {
        app.logger.error({ err: error, id }, 'Failed to update member status');
        throw error;
      }
    }
  );
}
