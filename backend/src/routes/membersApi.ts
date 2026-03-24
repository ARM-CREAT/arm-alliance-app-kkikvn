import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { eq, sql } from 'drizzle-orm';
import * as schema from '../db/schema.js';
import type { App } from '../index.js';

export function register(app: App, fastify: FastifyInstance) {
  // POST /api/members - Create new member (PUBLIC)
  fastify.post<{ Body: { first_name: string; last_name: string; phone: string; location: string } }>(
    '/api/members',
    {
      schema: {
        description: 'Register a new member',
        tags: ['members'],
        body: {
          type: 'object',
          required: ['first_name', 'last_name', 'phone', 'location'],
          properties: {
            first_name: { type: 'string' },
            last_name: { type: 'string' },
            phone: { type: 'string' },
            location: { type: 'string' },
          },
        },
        response: {
          201: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              member_number: { type: 'string' },
              first_name: { type: 'string' },
              last_name: { type: 'string' },
              phone: { type: 'string' },
              location: { type: 'string' },
              created_at: { type: 'string', format: 'date-time' },
            },
          },
          400: {
            type: 'object',
            properties: {
              error: { type: 'string' },
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
      const { first_name, last_name, phone, location } = request.body as { first_name: string; last_name: string; phone: string; location: string };

      app.logger.info({ first_name, last_name, phone, location }, 'Creating new member');

      // Validate required fields
      if (!first_name || !last_name || !phone || !location) {
        const missing = [];
        if (!first_name) missing.push('first_name');
        if (!last_name) missing.push('last_name');
        if (!phone) missing.push('phone');
        if (!location) missing.push('location');
        reply.status(400);
        return { error: `Missing required fields: ${missing.join(', ')}` };
      }

      try {
        // Get next sequence value
        const seqResult = await app.db.execute(sql`SELECT nextval('members_seq') as seq_val`);
        const seqNum = (seqResult as any)[0]?.seq_val;
        const memberNumber = `ARM-${String(seqNum).padStart(5, '0')}`;

        app.logger.info({ memberNumber }, 'Generated member number');

        // Insert member
        const result = await app.db
          .insert(schema.members)
          .values({
            memberNumber,
            firstName: first_name,
            lastName: last_name,
            phone,
            location,
          })
          .returning();

        const member = result[0];
        app.logger.info({ memberId: member.id, memberNumber }, 'Member created successfully');

        reply.status(201);
        return {
          id: member.id,
          member_number: member.memberNumber,
          first_name: member.firstName,
          last_name: member.lastName,
          phone: member.phone,
          location: member.location,
          created_at: member.createdAt?.toISOString() || new Date().toISOString(),
        };
      } catch (error: any) {
        app.logger.error({ err: error, first_name, last_name, phone, location }, 'Failed to create member');
        reply.status(500);
        return {
          error: 'Internal server error',
          details: error?.message || 'Unknown error',
        };
      }
    }
  );

  // GET /api/members/count - Get member count (PUBLIC) - MUST be before :member_number
  fastify.get(
    '/api/members/count',
    {
      schema: {
        description: 'Get total member count',
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
        const result = await app.db.execute(sql`SELECT COUNT(*) as count FROM members`);
        const count = (result as any)[0]?.count || 0;

        app.logger.info({ count }, 'Member count retrieved');
        return { count: parseInt(count, 10) };
      } catch (error) {
        app.logger.error({ err: error }, 'Failed to fetch member count');
        throw error;
      }
    }
  );

  // GET /api/members/:member_number - Get member by number (PUBLIC)
  fastify.get<{ Params: { member_number: string } }>(
    '/api/members/:member_number',
    {
      schema: {
        description: 'Get member by member number',
        tags: ['members'],
        params: {
          type: 'object',
          required: ['member_number'],
          properties: {
            member_number: { type: 'string', description: 'Member number (e.g. ARM-00001)' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              member_number: { type: 'string' },
              first_name: { type: 'string' },
              last_name: { type: 'string' },
              phone: { type: 'string' },
              location: { type: 'string' },
              created_at: { type: 'string', format: 'date-time' },
            },
          },
          404: {
            type: 'object',
            properties: {
              error: { type: 'string' },
            },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { member_number } = request.params as { member_number: string };

      app.logger.info({ memberNumber: member_number }, 'Fetching member by number');

      try {
        const members = await app.db
          .select()
          .from(schema.members)
          .where(eq(schema.members.memberNumber, member_number))
          .limit(1);

        if (members.length === 0) {
          app.logger.info({ memberNumber: member_number }, 'Member not found');
          reply.status(404);
          return { error: 'Member not found' };
        }

        const member = members[0];
        app.logger.info({ memberId: member.id }, 'Member retrieved');

        return {
          id: member.id,
          member_number: member.memberNumber,
          first_name: member.firstName,
          last_name: member.lastName,
          phone: member.phone,
          location: member.location,
          created_at: member.createdAt?.toISOString() || new Date().toISOString(),
        };
      } catch (error) {
        app.logger.error({ err: error, memberNumber: member_number }, 'Failed to fetch member');
        throw error;
      }
    }
  );

  // GET /api/members - Get all members (PROTECTED - admin password)
  fastify.get<{ Querystring: { sort?: string } }>(
    '/api/members',
    {
      schema: {
        description: 'Get all members (requires x-admin-password header)',
        tags: ['members'],
        querystring: {
          type: 'object',
          properties: {
            sort: { type: 'string', enum: ['asc', 'desc'], description: 'Sort by created_at' },
          },
        },
        response: {
          200: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string', format: 'uuid' },
                member_number: { type: 'string' },
                first_name: { type: 'string' },
                last_name: { type: 'string' },
                phone: { type: 'string' },
                location: { type: 'string' },
                created_at: { type: 'string', format: 'date-time' },
              },
            },
          },
          401: {
            type: 'object',
            properties: {
              error: { type: 'string' },
            },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const adminPassword = request.headers['x-admin-password'] as string;
      const expectedPassword = process.env.ADMIN_PASSWORD || 'admin123';

      app.logger.info('Admin attempting to fetch members');

      if (!adminPassword || adminPassword !== expectedPassword) {
        app.logger.warn('Unauthorized admin access attempt');
        reply.status(401);
        return { error: 'Unauthorized' };
      }

      try {
        const members = await app.db.select().from(schema.members).orderBy(sql`created_at DESC`);

        app.logger.info({ count: members.length }, 'Members list retrieved');

        return members.map(m => ({
          id: m.id,
          member_number: m.memberNumber,
          first_name: m.firstName,
          last_name: m.lastName,
          phone: m.phone,
          location: m.location,
          created_at: m.createdAt?.toISOString() || new Date().toISOString(),
        }));
      } catch (error) {
        app.logger.error({ err: error }, 'Failed to fetch members');
        throw error;
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
        await app.db.execute(sql`CREATE SEQUENCE IF NOT EXISTS members_seq START 1 INCREMENT 1`);
      } catch (e) {
        // Sequence might already exist
      }

      // Seed 3 members
      const seedData = [
        {
          memberNumber: 'ARM-00001',
          firstName: 'Amadou',
          lastName: 'Coulibaly',
          phone: '+22376543210',
          location: 'Bamako',
        },
        {
          memberNumber: 'ARM-00002',
          firstName: 'Fatoumata',
          lastName: 'Diallo',
          phone: '+22365432109',
          location: 'Sikasso',
        },
        {
          memberNumber: 'ARM-00003',
          firstName: 'Ibrahim',
          lastName: 'Traoré',
          phone: '+22354321098',
          location: 'Mopti',
        },
      ];

      for (const member of seedData) {
        await app.db.insert(schema.members).values(member);
      }

      // Advance sequence to 3
      await app.db.execute(sql`SELECT setval('members_seq', 3)`);

      app.logger.info({ count: seedData.length }, 'Members seeded');
    }
  } catch (error) {
    app.logger.error({ err: error }, 'Failed to seed members');
  }
}
