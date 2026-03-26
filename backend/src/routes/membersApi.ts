import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { eq, ilike, and, or, desc, count, sql } from 'drizzle-orm';
import * as schema from '../db/schema.js';
import type { App } from '../index.js';

const ADMIN_PASSWORD = 'admin123';

function verifyAdminPassword(request: FastifyRequest, reply: FastifyReply): boolean {
  const password = request.headers['x-admin-password'];
  if (!password || password !== ADMIN_PASSWORD) {
    reply.status(401);
    return false;
  }
  return true;
}

function getMemberNumberForYear(year: number, sequenceNumber: number): string {
  return `ARM-${year}-${String(sequenceNumber).padStart(5, '0')}`;
}

interface CreateMemberBody {
  full_name: string;
  phone: string;
  email?: string;
  commune?: string;
  region?: string;
  profession?: string;
  date_of_birth?: string;
  gender?: string;
  first_name?: string;
  last_name?: string;
}

interface UpdateMemberBody {
  full_name?: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  email?: string;
  commune?: string;
  region?: string;
  profession?: string;
  date_of_birth?: string;
  gender?: string;
  status?: string;
}

interface UpdateStatusBody {
  status: string;
}

export function register(app: App, fastify: FastifyInstance) {
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
            commune: { type: 'string' },
            region: { type: 'string' },
            profession: { type: 'string' },
            date_of_birth: { type: 'string' },
            gender: { type: 'string' },
            first_name: { type: 'string' },
            last_name: { type: 'string' },
          },
        },
        response: {
          201: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              member_number: { type: 'string' },
              full_name: { type: 'string' },
              phone: { type: 'string' },
              status: { type: 'string' },
              created_at: { type: 'string', format: 'date-time' },
            },
          },
          400: {
            type: 'object',
            properties: { error: { type: 'string' } },
          },
          409: {
            type: 'object',
            properties: {
              error: { type: 'string' },
              member_number: { type: 'string' },
            },
          },
          500: {
            type: 'object',
            properties: {
              error: { type: 'string' },
              details: { type: 'string' },
            },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const body = request.body as CreateMemberBody;
      const { full_name, phone, email, commune, region, profession, date_of_birth, gender, first_name, last_name } = body;

      app.logger.info({ full_name, phone }, 'Creating new member');

      try {
        // Validate required fields
        if (!full_name || !phone) {
          app.logger.warn('Missing required fields: full_name or phone');
          reply.status(400);
          return { error: 'full_name and phone are required' };
        }

        // Check for duplicate phone
        const existing = await app.db
          .select()
          .from(schema.members)
          .where(eq(schema.members.phone, phone));

        if (existing.length > 0) {
          app.logger.warn({ phone }, 'Phone number already exists');
          reply.status(409);
          return {
            error: 'A member with this phone number already exists',
            member_number: existing[0].memberNumber,
          };
        }

        // Generate member number using sequence
        const currentYear = new Date().getFullYear();
        const seqResult = await app.db.execute(
          sql`SELECT nextval('member_number_seq') as seq_val`
        );
        const seqNum = (seqResult as any)[0]?.seq_val || 1;
        const memberNumber = getMemberNumberForYear(currentYear, seqNum);

        app.logger.info({ memberNumber }, 'Generated member number');

        // Create member
        const result = await app.db
          .insert(schema.members)
          .values({
            memberNumber,
            fullName: full_name,
            firstName: first_name || '',
            lastName: last_name || '',
            phone,
            email,
            commune,
            region,
            profession,
            dateOfBirth: date_of_birth,
            gender,
            status: 'pending',
          })
          .returning();

        const member = result[0];
        app.logger.info({ memberId: member.id, memberNumber }, 'Member created successfully');

        reply.status(201);
        return {
          id: member.id,
          member_number: member.memberNumber,
          full_name: member.fullName,
          phone: member.phone,
          status: member.status,
          created_at: member.createdAt.toISOString(),
        };
      } catch (error) {
        app.logger.error({ err: error, full_name, phone }, 'Failed to create member');
        reply.status(500);
        return {
          error: 'Internal server error',
          details: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }
  );

  // GET /api/members - Get members (ADMIN ONLY)
  fastify.get<{ Querystring: { limit?: string; offset?: string; search?: string; status?: string } }>(
    '/api/members',
    {
      schema: {
        description: 'Get members list (requires x-admin-password header)',
        tags: ['members'],
        querystring: {
          type: 'object',
          properties: {
            limit: { type: 'string', description: 'Limit (default 100)' },
            offset: { type: 'string', description: 'Offset (default 0)' },
            search: { type: 'string', description: 'Search by full_name, phone, member_number, or commune' },
            status: { type: 'string', description: 'Filter by status' },
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
          401: {
            type: 'object',
            properties: { error: { type: 'string' } },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      if (!verifyAdminPassword(request, reply)) {
        return { error: 'Unauthorized' };
      }

      const query = request.query as { limit?: string; offset?: string; search?: string; status?: string };
      const limit = parseInt(query.limit || '100', 10);
      const offset = parseInt(query.offset || '0', 10);
      const search = query.search;
      const statusFilter = query.status;

      app.logger.info({ limit, offset, search, status: statusFilter }, 'Fetching members list');

      try {
        let whereClause: any = undefined;

        if (search && statusFilter) {
          whereClause = and(
            or(
              ilike(schema.members.fullName, `%${search}%`),
              ilike(schema.members.phone, `%${search}%`),
              ilike(schema.members.memberNumber, `%${search}%`),
              ilike(schema.members.commune, `%${search}%`)
            ),
            eq(schema.members.status, statusFilter)
          );
        } else if (search) {
          whereClause = or(
            ilike(schema.members.fullName, `%${search}%`),
            ilike(schema.members.phone, `%${search}%`),
            ilike(schema.members.memberNumber, `%${search}%`),
            ilike(schema.members.commune, `%${search}%`)
          );
        } else if (statusFilter) {
          whereClause = eq(schema.members.status, statusFilter);
        }

        // Get total count
        const countResult = await app.db
          .select({ count: count() })
          .from(schema.members)
          .where(whereClause);
        const total = countResult[0]?.count || 0;

        // Get paginated results
        const members = await app.db
          .select()
          .from(schema.members)
          .where(whereClause)
          .orderBy(desc(schema.members.createdAt))
          .limit(limit)
          .offset(offset);

        app.logger.info({ count: members.length, total }, 'Members list retrieved');

        return {
          members: members.map(m => ({
            id: m.id,
            member_number: m.memberNumber,
            full_name: m.fullName,
            first_name: m.firstName,
            last_name: m.lastName,
            phone: m.phone,
            email: m.email,
            commune: m.commune,
            region: m.region,
            profession: m.profession,
            date_of_birth: m.dateOfBirth,
            gender: m.gender,
            status: m.status,
            created_at: m.createdAt.toISOString(),
            updated_at: m.updatedAt.toISOString(),
          })),
          total,
        };
      } catch (error) {
        app.logger.error({ err: error }, 'Failed to fetch members list');
        reply.status(500);
        return {
          error: 'Internal server error',
          details: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }
  );

  // GET /api/members/:id - Get member by ID (ADMIN ONLY)
  fastify.get<{ Params: { id: string } }>(
    '/api/members/:id',
    {
      schema: {
        description: 'Get member by ID (requires x-admin-password header)',
        tags: ['members'],
        params: {
          type: 'object',
          required: ['id'],
          properties: { id: { type: 'string', format: 'uuid' } },
        },
        response: {
          200: { type: 'object' },
          401: { type: 'object', properties: { error: { type: 'string' } } },
          404: { type: 'object', properties: { error: { type: 'string' } } },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      if (!verifyAdminPassword(request, reply)) {
        return { error: 'Unauthorized' };
      }

      const { id } = request.params as { id: string };

      app.logger.info({ memberId: id }, 'Fetching member');

      try {
        const result = await app.db
          .select()
          .from(schema.members)
          .where(eq(schema.members.id, id));

        if (result.length === 0) {
          app.logger.info({ memberId: id }, 'Member not found');
          reply.status(404);
          return { error: 'Member not found' };
        }

        const m = result[0];
        app.logger.info({ memberId: id }, 'Member retrieved');

        return {
          id: m.id,
          member_number: m.memberNumber,
          full_name: m.fullName,
          first_name: m.firstName,
          last_name: m.lastName,
          phone: m.phone,
          email: m.email,
          commune: m.commune,
          region: m.region,
          profession: m.profession,
          date_of_birth: m.dateOfBirth,
          gender: m.gender,
          status: m.status,
          created_at: m.createdAt.toISOString(),
          updated_at: m.updatedAt.toISOString(),
        };
      } catch (error) {
        app.logger.error({ err: error, memberId: id }, 'Failed to fetch member');
        reply.status(500);
        return {
          error: 'Internal server error',
          details: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }
  );

  // PATCH /api/members/:id - Update member (ADMIN ONLY)
  fastify.patch<{ Params: { id: string }; Body: UpdateMemberBody }>(
    '/api/members/:id',
    {
      schema: {
        description: 'Update member (requires x-admin-password header)',
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
            first_name: { type: 'string' },
            last_name: { type: 'string' },
            phone: { type: 'string' },
            email: { type: 'string' },
            commune: { type: 'string' },
            region: { type: 'string' },
            profession: { type: 'string' },
            date_of_birth: { type: 'string' },
            gender: { type: 'string' },
            status: { type: 'string' },
          },
        },
        response: {
          200: { type: 'object' },
          401: { type: 'object', properties: { error: { type: 'string' } } },
          404: { type: 'object', properties: { error: { type: 'string' } } },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      if (!verifyAdminPassword(request, reply)) {
        return { error: 'Unauthorized' };
      }

      const { id } = request.params as { id: string };
      const body = request.body as UpdateMemberBody;

      app.logger.info({ memberId: id }, 'Updating member');

      try {
        const updates: any = {};
        if (body.full_name !== undefined) updates.fullName = body.full_name;
        if (body.first_name !== undefined) updates.firstName = body.first_name;
        if (body.last_name !== undefined) updates.lastName = body.last_name;
        if (body.phone !== undefined) updates.phone = body.phone;
        if (body.email !== undefined) updates.email = body.email;
        if (body.commune !== undefined) updates.commune = body.commune;
        if (body.region !== undefined) updates.region = body.region;
        if (body.profession !== undefined) updates.profession = body.profession;
        if (body.date_of_birth !== undefined) updates.dateOfBirth = body.date_of_birth;
        if (body.gender !== undefined) updates.gender = body.gender;
        if (body.status !== undefined) updates.status = body.status;
        updates.updatedAt = new Date();

        const result = await app.db
          .update(schema.members)
          .set(updates)
          .where(eq(schema.members.id, id))
          .returning();

        if (result.length === 0) {
          app.logger.info({ memberId: id }, 'Member not found for update');
          reply.status(404);
          return { error: 'Member not found' };
        }

        const m = result[0];
        app.logger.info({ memberId: id }, 'Member updated');

        return {
          id: m.id,
          member_number: m.memberNumber,
          full_name: m.fullName,
          first_name: m.firstName,
          last_name: m.lastName,
          phone: m.phone,
          email: m.email,
          commune: m.commune,
          region: m.region,
          profession: m.profession,
          date_of_birth: m.dateOfBirth,
          gender: m.gender,
          status: m.status,
          created_at: m.createdAt.toISOString(),
          updated_at: m.updatedAt.toISOString(),
        };
      } catch (error) {
        app.logger.error({ err: error, memberId: id }, 'Failed to update member');
        reply.status(500);
        return {
          error: 'Internal server error',
          details: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }
  );

  // PATCH /api/members/:id/status - Update member status (ADMIN ONLY)
  fastify.patch<{ Params: { id: string }; Body: UpdateStatusBody }>(
    '/api/members/:id/status',
    {
      schema: {
        description: 'Update member status (requires x-admin-password header)',
        tags: ['members'],
        params: {
          type: 'object',
          required: ['id'],
          properties: { id: { type: 'string', format: 'uuid' } },
        },
        body: {
          type: 'object',
          required: ['status'],
          properties: { status: { type: 'string', enum: ['pending', 'approved', 'rejected'] } },
        },
        response: {
          200: { type: 'object' },
          400: { type: 'object', properties: { error: { type: 'string' } } },
          401: { type: 'object', properties: { error: { type: 'string' } } },
          404: { type: 'object', properties: { error: { type: 'string' } } },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      if (!verifyAdminPassword(request, reply)) {
        return { error: 'Unauthorized' };
      }

      const { id } = request.params as { id: string };
      const { status } = request.body as UpdateStatusBody;

      app.logger.info({ memberId: id, status }, 'Updating member status');

      try {
        // Validate status
        const validStatuses = ['pending', 'approved', 'rejected'];
        if (!validStatuses.includes(status)) {
          app.logger.warn({ status }, 'Invalid status provided');
          reply.status(400);
          return { error: `Status must be one of: ${validStatuses.join(', ')}` };
        }

        const result = await app.db
          .update(schema.members)
          .set({ status, updatedAt: new Date() })
          .where(eq(schema.members.id, id))
          .returning();

        if (result.length === 0) {
          app.logger.info({ memberId: id }, 'Member not found for status update');
          reply.status(404);
          return { error: 'Member not found' };
        }

        const m = result[0];
        app.logger.info({ memberId: id, status }, 'Member status updated');

        return {
          id: m.id,
          member_number: m.memberNumber,
          full_name: m.fullName,
          first_name: m.firstName,
          last_name: m.lastName,
          phone: m.phone,
          email: m.email,
          commune: m.commune,
          region: m.region,
          profession: m.profession,
          date_of_birth: m.dateOfBirth,
          gender: m.gender,
          status: m.status,
          created_at: m.createdAt.toISOString(),
          updated_at: m.updatedAt.toISOString(),
        };
      } catch (error) {
        app.logger.error({ err: error, memberId: id }, 'Failed to update member status');
        reply.status(500);
        return {
          error: 'Internal server error',
          details: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }
  );

  // DELETE /api/members/:id - Delete member (ADMIN ONLY)
  fastify.delete<{ Params: { id: string } }>(
    '/api/members/:id',
    {
      schema: {
        description: 'Delete member (requires x-admin-password header)',
        tags: ['members'],
        params: {
          type: 'object',
          required: ['id'],
          properties: { id: { type: 'string', format: 'uuid' } },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              message: { type: 'string' },
            },
          },
          401: { type: 'object', properties: { error: { type: 'string' } } },
          404: { type: 'object', properties: { error: { type: 'string' } } },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      if (!verifyAdminPassword(request, reply)) {
        return { error: 'Unauthorized' };
      }

      const { id } = request.params as { id: string };

      app.logger.info({ memberId: id }, 'Deleting member');

      try {
        const result = await app.db
          .delete(schema.members)
          .where(eq(schema.members.id, id))
          .returning();

        if (result.length === 0) {
          app.logger.info({ memberId: id }, 'Member not found for deletion');
          reply.status(404);
          return { error: 'Member not found' };
        }

        app.logger.info({ memberId: id }, 'Member deleted successfully');
        return {
          success: true,
          message: 'Member deleted successfully',
        };
      } catch (error) {
        app.logger.error({ err: error, memberId: id }, 'Failed to delete member');
        reply.status(500);
        return {
          error: 'Internal server error',
          details: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }
  );
}

export async function seedMembers(app: App) {
  try {
    const existing = await app.db.select().from(schema.members);

    if (existing.length === 0) {
      app.logger.info('Seeding members table');

      // Create sequence if it doesn't exist
      try {
        await app.db.execute(sql`CREATE SEQUENCE IF NOT EXISTS member_number_seq START 1 INCREMENT 1`);
      } catch (e) {
        // Sequence might already exist
      }

      const currentYear = new Date().getFullYear();
      const seedData = [
        {
          memberNumber: getMemberNumberForYear(currentYear, 1),
          fullName: 'Amadou Coulibaly',
          firstName: 'Amadou',
          lastName: 'Coulibaly',
          phone: '+22376543210',
          commune: 'Bamako',
          status: 'approved',
        },
        {
          memberNumber: getMemberNumberForYear(currentYear, 2),
          fullName: 'Fatoumata Diallo',
          firstName: 'Fatoumata',
          lastName: 'Diallo',
          phone: '+22365432109',
          commune: 'Sikasso',
          status: 'approved',
        },
        {
          memberNumber: getMemberNumberForYear(currentYear, 3),
          fullName: 'Ibrahim Traoré',
          firstName: 'Ibrahim',
          lastName: 'Traoré',
          phone: '+22354321098',
          commune: 'Mopti',
          status: 'pending',
        },
      ];

      for (const member of seedData) {
        await app.db.insert(schema.members).values(member);
      }

      // Advance sequence to match the last inserted member
      await app.db.execute(sql`SELECT setval('member_number_seq', 3)`);

      app.logger.info({ count: seedData.length }, 'Members seeded');
    }
  } catch (error) {
    app.logger.error({ err: error }, 'Failed to seed members');
  }
}
