import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { eq, ilike, and, count, or } from 'drizzle-orm';
import * as schema from '../db/schema.js';
import type { App } from '../index.js';

interface CreateMembershipBody {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  birth_date?: string;
}

interface UpdateMembershipBody {
  status?: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
}

export function register(app: App, fastify: FastifyInstance) {
  // GET /api/memberships/check-email - Check if email exists
  fastify.get<{ Querystring: { email?: string } }>(
    '/api/memberships/check-email',
    {
      schema: {
        description: 'Check if email already exists in memberships',
        tags: ['memberships'],
        querystring: {
          type: 'object',
          required: ['email'],
          properties: {
            email: { type: 'string', format: 'email' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              exists: { type: 'boolean' },
            },
          },
          400: {
            type: 'object',
            properties: { error: { type: 'string' } },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const query = request.query as { email?: string };
      const email = query.email;

      if (!email) {
        app.logger.warn('Email check requested without email parameter');
        reply.status(400);
        return { error: 'Email parameter is required' };
      }

      app.logger.info({ email }, 'Checking if email exists');

      try {
        const result = await app.db
          .select()
          .from(schema.memberships)
          .where(ilike(schema.memberships.email, email));

        const exists = result.length > 0;
        app.logger.info({ email, exists }, 'Email check completed');
        return { exists };
      } catch (error) {
        app.logger.error({ err: error, email }, 'Failed to check email');
        throw error;
      }
    }
  );

  // POST /api/memberships - Create new membership
  fastify.post<{ Body: CreateMembershipBody }>(
    '/api/memberships',
    {
      schema: {
        description: 'Create a new membership',
        tags: ['memberships'],
        body: {
          type: 'object',
          required: ['first_name', 'last_name', 'email'],
          properties: {
            first_name: { type: 'string' },
            last_name: { type: 'string' },
            email: { type: 'string', format: 'email' },
            phone: { type: 'string' },
            address: { type: 'string' },
            city: { type: 'string' },
            country: { type: 'string' },
            birth_date: { type: 'string' },
          },
        },
        response: {
          201: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              membership_number: { type: 'string' },
              first_name: { type: 'string' },
              last_name: { type: 'string' },
              email: { type: 'string' },
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
            properties: { error: { type: 'string' } },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const body = request.body as CreateMembershipBody;
      const { first_name, last_name, email, phone, address, city, country, birth_date } = body;

      app.logger.info({ email, first_name, last_name }, 'Creating new membership');

      // Validate required fields
      if (!first_name || !last_name || !email) {
        app.logger.warn({ email }, 'Missing required fields');
        reply.status(400);
        return { error: 'first_name, last_name and email are required' };
      }

      try {
        // Check if email already exists (case-insensitive)
        const existing = await app.db
          .select()
          .from(schema.memberships)
          .where(ilike(schema.memberships.email, email));

        if (existing.length > 0) {
          app.logger.warn({ email }, 'Email already exists');
          reply.status(409);
          return { error: 'Un adhérent avec cet email existe déjà' };
        }

        // Get current year
        const currentYear = new Date().getFullYear();

        // Count existing memberships for current year
        const allMemberships = await app.db
          .select()
          .from(schema.memberships)
          .where(ilike(schema.memberships.membershipNumber, `ARM-${currentYear}-%`));

        const nextNumber = allMemberships.length + 1;
        const membershipNumber = `ARM-${currentYear}-${String(nextNumber).padStart(5, '0')}`;

        app.logger.info({ membershipNumber }, 'Generated membership number');

        // Insert membership
        const result = await app.db
          .insert(schema.memberships)
          .values({
            membershipNumber,
            firstName: first_name,
            lastName: last_name,
            email,
            phone,
            address,
            city,
            country: country || 'France',
            birthDate: birth_date,
            status: 'pending',
          })
          .returning();

        const membership = result[0];
        app.logger.info({ membershipId: membership.id, membershipNumber }, 'Membership created');

        reply.status(201);
        return {
          id: membership.id,
          membership_number: membership.membershipNumber,
          first_name: membership.firstName,
          last_name: membership.lastName,
          email: membership.email,
          status: membership.status,
          created_at: membership.createdAt.toISOString(),
        };
      } catch (error) {
        app.logger.error({ err: error, email }, 'Failed to create membership');
        throw error;
      }
    }
  );

  // GET /api/memberships - List memberships (admin only)
  fastify.get<{ Querystring: { page?: string; limit?: string; status?: string; search?: string } }>(
    '/api/memberships',
    {
      schema: {
        description: 'List memberships (admin only)',
        tags: ['memberships'],
        querystring: {
          type: 'object',
          properties: {
            page: { type: 'string', description: 'Page number (default 1)' },
            limit: { type: 'string', description: 'Results per page (default 20)' },
            status: { type: 'string', description: 'Filter by status' },
            search: { type: 'string', description: 'Search by name, email, or membership number' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              data: {
                type: 'array',
                items: { type: 'object' },
              },
              total: { type: 'number' },
              page: { type: 'number' },
              limit: { type: 'number' },
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
      const requireAuth = app.requireAuth();
      const session = await requireAuth(request, reply);
      if (!session) return;

      const query = request.query as { page?: string; limit?: string; status?: string; search?: string };
      const page = parseInt(query.page || '1', 10);
      const limit = parseInt(query.limit || '20', 10);
      const status = query.status;
      const search = query.search;

      app.logger.info({ page, limit, status, search }, 'Fetching memberships list');

      try {
        let whereClause: any = undefined;

        // Build where clause
        if (status && search) {
          whereClause = and(
            eq(schema.memberships.status, status),
            or(
              ilike(schema.memberships.firstName, `%${search}%`),
              ilike(schema.memberships.lastName, `%${search}%`),
              ilike(schema.memberships.email, `%${search}%`),
              ilike(schema.memberships.membershipNumber, `%${search}%`)
            )
          );
        } else if (status) {
          whereClause = eq(schema.memberships.status, status);
        } else if (search) {
          whereClause = or(
            ilike(schema.memberships.firstName, `%${search}%`),
            ilike(schema.memberships.lastName, `%${search}%`),
            ilike(schema.memberships.email, `%${search}%`),
            ilike(schema.memberships.membershipNumber, `%${search}%`)
          );
        }

        // Get total count
        const countResult = await app.db
          .select({ count: count() })
          .from(schema.memberships)
          .where(whereClause);
        const total = countResult[0]?.count || 0;

        // Get paginated results
        const offset = (page - 1) * limit;
        const data = await app.db
          .select()
          .from(schema.memberships)
          .where(whereClause)
          .limit(limit)
          .offset(offset);

        app.logger.info({ count: data.length, total, page, limit }, 'Memberships list retrieved');

        return {
          data: data.map(m => ({
            id: m.id,
            membership_number: m.membershipNumber,
            user_id: m.userId,
            first_name: m.firstName,
            last_name: m.lastName,
            email: m.email,
            phone: m.phone,
            address: m.address,
            city: m.city,
            country: m.country,
            birth_date: m.birthDate,
            status: m.status,
            created_at: m.createdAt.toISOString(),
            updated_at: m.updatedAt.toISOString(),
          })),
          total,
          page,
          limit,
        };
      } catch (error) {
        app.logger.error({ err: error }, 'Failed to fetch memberships');
        throw error;
      }
    }
  );

  // GET /api/memberships/:id - Get single membership (admin only)
  fastify.get<{ Params: { id: string } }>(
    '/api/memberships/:id',
    {
      schema: {
        description: 'Get a membership by ID (admin only)',
        tags: ['memberships'],
        params: {
          type: 'object',
          required: ['id'],
          properties: { id: { type: 'string', format: 'uuid' } },
        },
        response: {
          200: { type: 'object' },
          401: {
            type: 'object',
            properties: { error: { type: 'string' } },
          },
          404: {
            type: 'object',
            properties: { error: { type: 'string' } },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const requireAuth = app.requireAuth();
      const session = await requireAuth(request, reply);
      if (!session) return;

      const { id } = request.params as { id: string };

      app.logger.info({ membershipId: id }, 'Fetching membership');

      try {
        const result = await app.db
          .select()
          .from(schema.memberships)
          .where(eq(schema.memberships.id, id));

        if (result.length === 0) {
          app.logger.info({ membershipId: id }, 'Membership not found');
          reply.status(404);
          return { error: 'Adhésion introuvable' };
        }

        const m = result[0];
        app.logger.info({ membershipId: id }, 'Membership retrieved');

        return {
          id: m.id,
          membership_number: m.membershipNumber,
          user_id: m.userId,
          first_name: m.firstName,
          last_name: m.lastName,
          email: m.email,
          phone: m.phone,
          address: m.address,
          city: m.city,
          country: m.country,
          birth_date: m.birthDate,
          status: m.status,
          created_at: m.createdAt.toISOString(),
          updated_at: m.updatedAt.toISOString(),
        };
      } catch (error) {
        app.logger.error({ err: error, membershipId: id }, 'Failed to fetch membership');
        throw error;
      }
    }
  );

  // PATCH /api/memberships/:id - Update membership (admin only)
  fastify.patch<{ Params: { id: string }; Body: UpdateMembershipBody }>(
    '/api/memberships/:id',
    {
      schema: {
        description: 'Update a membership (admin only)',
        tags: ['memberships'],
        params: {
          type: 'object',
          required: ['id'],
          properties: { id: { type: 'string', format: 'uuid' } },
        },
        body: {
          type: 'object',
          properties: {
            status: { type: 'string' },
            phone: { type: 'string' },
            address: { type: 'string' },
            city: { type: 'string' },
            country: { type: 'string' },
          },
        },
        response: {
          200: { type: 'object' },
          401: {
            type: 'object',
            properties: { error: { type: 'string' } },
          },
          404: {
            type: 'object',
            properties: { error: { type: 'string' } },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const requireAuth = app.requireAuth();
      const session = await requireAuth(request, reply);
      if (!session) return;

      const { id } = request.params as { id: string };
      const body = request.body as UpdateMembershipBody;

      app.logger.info({ membershipId: id }, 'Updating membership');

      try {
        const updates: any = {};
        if (body.status !== undefined) updates.status = body.status;
        if (body.phone !== undefined) updates.phone = body.phone;
        if (body.address !== undefined) updates.address = body.address;
        if (body.city !== undefined) updates.city = body.city;
        if (body.country !== undefined) updates.country = body.country;
        updates.updatedAt = new Date();

        const result = await app.db
          .update(schema.memberships)
          .set(updates)
          .where(eq(schema.memberships.id, id))
          .returning();

        if (result.length === 0) {
          app.logger.info({ membershipId: id }, 'Membership not found for update');
          reply.status(404);
          return { error: 'Adhésion introuvable' };
        }

        const m = result[0];
        app.logger.info({ membershipId: id }, 'Membership updated');

        return {
          id: m.id,
          membership_number: m.membershipNumber,
          user_id: m.userId,
          first_name: m.firstName,
          last_name: m.lastName,
          email: m.email,
          phone: m.phone,
          address: m.address,
          city: m.city,
          country: m.country,
          birth_date: m.birthDate,
          status: m.status,
          created_at: m.createdAt.toISOString(),
          updated_at: m.updatedAt.toISOString(),
        };
      } catch (error) {
        app.logger.error({ err: error, membershipId: id }, 'Failed to update membership');
        throw error;
      }
    }
  );
}

export async function seedMemberships(app: App) {
  try {
    const existing = await app.db.select().from(schema.memberships);

    if (existing.length === 0) {
      app.logger.info('Seeding memberships');

      const seedData = [
        {
          membershipNumber: 'ARM-2025-00001',
          firstName: 'Amadou',
          lastName: 'Coulibaly',
          email: 'amadou.coulibaly@gmail.com',
          phone: '+33 6 12 34 56 78',
          address: '12 Rue de la Paix',
          city: 'Paris',
          country: 'France',
          birthDate: '1985-03-15',
          status: 'active',
        },
        {
          membershipNumber: 'ARM-2025-00002',
          firstName: 'Fatoumata',
          lastName: 'Diallo',
          email: 'fatoumata.diallo@yahoo.fr',
          phone: '+33 7 98 76 54 32',
          address: '45 Avenue Victor Hugo',
          city: 'Lyon',
          country: 'France',
          birthDate: '1990-07-22',
          status: 'active',
        },
        {
          membershipNumber: 'ARM-2025-00003',
          firstName: 'Ibrahim',
          lastName: 'Traoré',
          email: 'ibrahim.traore@hotmail.com',
          phone: '+223 76 54 32 10',
          address: 'Quartier du Fleuve',
          city: 'Bamako',
          country: 'Mali',
          birthDate: '1978-11-08',
          status: 'pending',
        },
        {
          membershipNumber: 'ARM-2025-00004',
          firstName: 'Mariam',
          lastName: 'Keïta',
          email: 'mariam.keita@gmail.com',
          phone: '+33 6 55 44 33 22',
          address: '8 Rue des Lilas',
          city: 'Marseille',
          country: 'France',
          birthDate: '1995-01-30',
          status: 'pending',
        },
        {
          membershipNumber: 'ARM-2025-00005',
          firstName: 'Oumar',
          lastName: 'Sanogo',
          email: 'oumar.sanogo@outlook.com',
          phone: '+33 6 77 88 99 00',
          address: '23 Boulevard Gambetta',
          city: 'Bordeaux',
          country: 'France',
          birthDate: '1982-06-14',
          status: 'suspended',
        },
      ];

      await app.db.insert(schema.memberships).values(seedData);
      app.logger.info({ count: seedData.length }, 'Memberships seeded');
    }
  } catch (error) {
    app.logger.error({ err: error }, 'Failed to seed memberships');
  }
}
