import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { eq } from 'drizzle-orm';
import * as schema from '../db/schema.js';
import type { App } from '../index.js';
import { randomBytes } from 'crypto';

interface RegisterMemberBody {
  full_name: string;
  phone: string;
  email?: string;
  commune?: string;
  region?: string;
  profession?: string;
  date_of_birth?: string;
  gender?: string;
}

/**
 * Generate a unique member_number in format ARM-XXXXXX (ARM- followed by 6 random digits)
 * Checks database for uniqueness and regenerates if collision occurs
 */
async function generateUniqueMemberNumber(app: App, maxAttempts: number = 10): Promise<string> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const randomDigits = randomBytes(3).readUIntBE(0, 3) % 1000000;
    const memberNumber = `ARM-${String(randomDigits).padStart(6, '0')}`;

    // Check if this member_number already exists
    const existing = await app.db
      .select()
      .from(schema.members)
      .where(eq(schema.members.memberNumber, memberNumber));

    if (existing.length === 0) {
      return memberNumber;
    }
  }

  throw new Error('Failed to generate unique member_number after max attempts');
}

export function register(app: App, fastify: FastifyInstance) {
  // POST /api/members/register - Register a new member (PUBLIC)
  fastify.post<{ Body: RegisterMemberBody }>(
    '/api/members/register',
    {
      schema: {
        description: 'Register a new member (public, no authentication required)',
        tags: ['members'],
        body: {
          type: 'object',
          required: ['full_name', 'phone'],
          properties: {
            full_name: { type: 'string', description: 'Full name (required)' },
            phone: { type: 'string', description: 'Phone number (required, must be unique)' },
            email: { type: 'string', format: 'email', description: 'Email address (optional)' },
            commune: { type: 'string', description: 'Commune (optional)' },
            region: { type: 'string', description: 'Region (optional)' },
            profession: { type: 'string', description: 'Profession (optional)' },
            date_of_birth: { type: 'string', description: 'Date of birth (optional)' },
            gender: { type: 'string', description: 'Gender (optional)' },
          },
        },
        response: {
          201: {
            description: 'Member registered successfully',
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              member_number: { type: 'string' },
              full_name: { type: 'string' },
              status: { type: 'string' },
            },
          },
          400: {
            description: 'Missing required fields',
            type: 'object',
            properties: {
              error: { type: 'string' },
              message: { type: 'string' },
            },
          },
          409: {
            description: 'Phone number already registered',
            type: 'object',
            properties: {
              error: { type: 'string' },
              message: { type: 'string' },
              member_number: { type: 'string' },
              full_name: { type: 'string' },
              status: { type: 'string' },
            },
          },
          500: {
            description: 'Internal server error',
            type: 'object',
            properties: {
              error: { type: 'string' },
              message: { type: 'string' },
            },
          },
        },
      },
    },
    async (request: FastifyRequest<{ Body: RegisterMemberBody }>, reply: FastifyReply) => {
      const { full_name, phone, email, commune, region, profession, date_of_birth, gender } = request.body;

      app.logger.info({ full_name, phone }, 'Member registration attempt');

      try {
        // Step 1: Validate required fields
        if (!full_name || !phone) {
          app.logger.warn({ full_name, phone }, 'Missing required fields');
          reply.status(400);
          return {
            error: 'MISSING_FIELDS',
            message: 'full_name et phone sont requis',
          };
        }

        // Step 2: Check for duplicate phone
        const existing = await app.db
          .select()
          .from(schema.members)
          .where(eq(schema.members.phone, phone));

        if (existing.length > 0) {
          app.logger.warn({ phone, memberNumber: existing[0].memberNumber }, 'Phone number already registered');
          reply.status(409);
          return {
            error: 'PHONE_EXISTS',
            message: 'Ce numéro est déjà inscrit',
            member_number: existing[0].memberNumber,
            full_name: existing[0].fullName,
            status: existing[0].status,
          };
        }

        // Step 3: Generate unique member_number
        const memberNumber = await generateUniqueMemberNumber(app);
        app.logger.debug({ memberNumber }, 'Generated member number');

        // Step 4: Insert new member
        const now = new Date();
        const result = await app.db
          .insert(schema.members)
          .values({
            memberNumber,
            fullName: full_name,
            phone,
            email,
            commune,
            region,
            profession,
            dateOfBirth: date_of_birth,
            gender,
            status: 'pending',
            createdAt: now,
            updatedAt: now,
          })
          .returning();

        const member = result[0];
        app.logger.info(
          { memberId: member.id, memberNumber, phone },
          'Member registered successfully'
        );

        reply.status(201);
        return {
          success: true,
          member_number: member.memberNumber,
          full_name: member.fullName,
          status: member.status,
        };
      } catch (error) {
        app.logger.error(
          { err: error, full_name, phone },
          'Failed to register member'
        );
        reply.status(500);
        return {
          error: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Une erreur est survenue lors de l\'enregistrement',
        };
      }
    }
  );

  // GET /api/members/lookup - Look up a member by phone (PUBLIC)
  fastify.get<{ Querystring: { phone?: string } }>(
    '/api/members/lookup',
    {
      schema: {
        description: 'Look up a member by phone number (public, no authentication required)',
        tags: ['members'],
        querystring: {
          type: 'object',
          properties: {
            phone: { type: 'string', description: 'Phone number to look up (required)' },
          },
        },
        response: {
          200: {
            description: 'Member found',
            type: 'object',
            properties: {
              member_number: { type: 'string' },
              full_name: { type: 'string' },
              status: { type: 'string' },
              created_at: { type: 'string', format: 'date-time' },
            },
          },
          400: {
            description: 'Missing phone parameter',
            type: 'object',
            properties: {
              error: { type: 'string' },
              message: { type: 'string' },
            },
          },
          404: {
            description: 'Member not found',
            type: 'object',
            properties: {
              error: { type: 'string' },
              message: { type: 'string' },
            },
          },
          500: {
            description: 'Internal server error',
            type: 'object',
            properties: {
              error: { type: 'string' },
              message: { type: 'string' },
            },
          },
        },
      },
    },
    async (request: FastifyRequest<{ Querystring: { phone?: string } }>, reply: FastifyReply) => {
      const { phone } = request.query;

      app.logger.info({ phone }, 'Member lookup attempt');

      try {
        // Step 1: Validate phone parameter
        if (!phone) {
          app.logger.warn('Phone parameter missing');
          reply.status(400);
          return {
            error: 'MISSING_PHONE',
            message: 'Le paramètre phone est requis',
          };
        }

        // Step 2: Look up member by phone
        const result = await app.db
          .select()
          .from(schema.members)
          .where(eq(schema.members.phone, phone));

        // Step 3: Handle found/not found
        if (result.length === 0) {
          app.logger.info({ phone }, 'Member not found');
          reply.status(404);
          return {
            error: 'NOT_FOUND',
            message: 'Aucun membre trouvé avec ce numéro',
          };
        }

        const member = result[0];
        app.logger.info(
          { phone, memberNumber: member.memberNumber },
          'Member lookup successful'
        );

        reply.status(200);
        return {
          member_number: member.memberNumber,
          full_name: member.fullName,
          status: member.status,
          created_at: member.createdAt.toISOString(),
        };
      } catch (error) {
        app.logger.error({ err: error, phone }, 'Failed to look up member');
        reply.status(500);
        return {
          error: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Une erreur est survenue lors de la recherche',
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

      const now = new Date();
      const seedData = [
        {
          memberNumber: 'ARM-123456',
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
          memberNumber: 'ARM-234567',
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
          memberNumber: 'ARM-345678',
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

      app.logger.info({ count: seedData.length }, 'Members table seeded');
    }
  } catch (error) {
    app.logger.error({ err: error }, 'Failed to seed members');
  }
}
