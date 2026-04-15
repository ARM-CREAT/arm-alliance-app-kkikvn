import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { eq, desc, count, gte, isNotNull } from 'drizzle-orm';
import * as schema from '../db/schema.js';
import type { App } from '../index.js';

interface RegisterMemberBody {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  region?: string;
  gender?: string;
  date_of_birth?: string;
  address?: string;
  city?: string;
  country?: string;
  profession?: string;
  membership_type?: string;
  message?: string;
  nina?: string;
  commune?: string;
  cercle?: string;
  motivation?: string;
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

interface CreateMemberProfileBody {
  full_name: string;
  first_name?: string;
  last_name?: string;
  commune: string;
  profession: string;
  phone?: string;
  email?: string;
  nina?: string;
  region?: string;
  cercle?: string;
  motivation?: string;
  role?: string;
}

interface UpdateMemberProfileBody {
  full_name?: string;
  first_name?: string;
  last_name?: string;
  commune?: string;
  profession?: string;
  phone?: string;
  email?: string;
  nina?: string;
  region?: string;
  cercle?: string;
  motivation?: string;
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
  const randomFourDigits = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `ARM-${year}-${randomFourDigits}`;
}

export function register(app: App, fastify: FastifyInstance) {
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

  // POST /api/members/register - Register new member (maximally permissive)
  fastify.post<{ Body: RegisterMemberBody }>(
    '/api/members/register',
    {
      schema: {
        description: 'Register a new member',
        tags: ['members'],
        body: {
          type: 'object',
          required: ['first_name', 'last_name', 'email'],
          properties: {
            first_name: { type: 'string' },
            last_name: { type: 'string' },
            email: { type: 'string' },
            phone: { type: 'string' },
            region: { type: 'string' },
            gender: { type: 'string' },
            date_of_birth: { type: 'string' },
            address: { type: 'string' },
            city: { type: 'string' },
            country: { type: 'string' },
            profession: { type: 'string' },
            membership_type: { type: 'string' },
            message: { type: 'string' },
            nina: { type: 'string' },
            commune: { type: 'string' },
            cercle: { type: 'string' },
            motivation: { type: 'string' },
          },
        },
        response: {
          201: { type: 'object' },
          400: { type: 'object' },
          409: { type: 'object' },
          500: { type: 'object' },
        },
      },
    },
    async (request: FastifyRequest<{ Body: RegisterMemberBody }>, reply: FastifyReply) => {
      try {
        const body = request.body;
        const first_name = (body.first_name || '').trim();
        const last_name = (body.last_name || '').trim();
        const email = (body.email || '').trim().toLowerCase();

        // Validate required fields
        if (!first_name || !last_name || !email) {
          app.logger.warn({ first_name, last_name, email }, 'Validation error: missing required fields');
          reply.status(400);
          return {
            error: 'validation_error',
            message: 'first_name, last_name et email sont obligatoires',
          };
        }

        // Normalize phone
        let normalizedPhone: string | null = null;
        if (body.phone && typeof body.phone === 'string') {
          const trimmedPhone = body.phone.trim();
          if (trimmedPhone.length > 0) {
            normalizedPhone = trimmedPhone;
          }
        }

        app.logger.info({ email, phone: normalizedPhone }, 'Registering new member');

        // Check for duplicate email (case-insensitive)
        const existingByEmail = await app.db
          .select()
          .from(schema.members)
          .where(eq(schema.members.email, email));

        if (existingByEmail.length > 0) {
          app.logger.warn({ email }, 'Email already exists');
          reply.status(409);
          return {
            error: 'email_exists',
            message: 'Cet email est déjà utilisé',
          };
        }

        // Check for duplicate phone (only if phone is not null)
        if (normalizedPhone) {
          const existingByPhone = await app.db
            .select()
            .from(schema.members)
            .where(eq(schema.members.phone, normalizedPhone));

          if (existingByPhone.length > 0) {
            app.logger.warn({ phone: normalizedPhone }, 'Phone already exists');
            reply.status(409);
            return {
              error: 'phone_exists',
              message: 'Ce numéro est déjà utilisé',
            };
          }
        }

        // Generate membership number
        const membershipNumber = generateMembershipNumber();
        const fullName = `${first_name} ${last_name}`;
        const now = new Date();

        // Insert into members table
        const membersResult = await app.db
          .insert(schema.members)
          .values({
            id: undefined as any,
            memberNumber: membershipNumber,
            membershipNumber,
            fullName,
            firstName: first_name,
            lastName: last_name,
            email,
            phone: normalizedPhone,
            region: body.region || null,
            profession: body.profession || null,
            dateOfBirth: body.date_of_birth || null,
            gender: body.gender || null,
            address: body.address || null,
            city: body.city || null,
            country: body.country || null,
            membershipType: body.membership_type || 'standard',
            message: body.message || null,
            status: 'pending',
            createdAt: now,
            updatedAt: now,
          })
          .returning();

        const member = membersResult[0];
        app.logger.info({ memberId: member.id, membershipNumber }, 'Member inserted into members table');

        // Insert into member_profiles (non-blocking if it fails)
        try {
          await app.db
            .insert(schema.memberProfiles)
            .values({
              id: undefined as any,
              userId: null,
              firstName: first_name,
              lastName: last_name,
              fullName,
              email,
              phone: normalizedPhone,
              nina: body.nina || null,
              commune: body.commune || null,
              profession: body.profession || null,
              membershipNumber,
              qrCode: membershipNumber,
              status: 'pending',
              role: 'member',
              region: body.region || null,
              cercle: body.cercle || null,
              motivation: body.motivation || null,
              createdAt: now,
              updatedAt: now,
            });
          app.logger.info({ memberId: member.id, membershipNumber }, 'Member inserted into member_profiles table');
        } catch (profileError) {
          // Non-blocking error - log but don't fail the registration
          app.logger.warn({ err: profileError, memberId: member.id }, 'Failed to insert into member_profiles');
        }

        reply.status(201);
        return {
          success: true,
          member: {
            id: member.id,
            first_name: member.firstName,
            last_name: member.lastName,
            full_name: member.fullName,
            email: member.email,
            phone: member.phone,
            region: member.region,
            cercle: member.commune,
            commune: member.commune,
            profession: member.profession,
            membership_number: member.memberNumber,
            member_number: member.memberNumber,
            status: member.status,
            date_of_birth: member.dateOfBirth,
            gender: member.gender,
            address: member.address,
            city: member.city,
            country: member.country,
            membership_type: member.membershipType,
            message: member.message,
            created_at: member.createdAt.toISOString(),
            updated_at: member.updatedAt.toISOString(),
          },
          membership_number: membershipNumber,
        };
      } catch (error: any) {
        app.logger.error({ err: error }, 'Unexpected error during member registration');
        reply.status(500);
        return {
          error: 'server_error',
          message: 'Une erreur est survenue, réessayez',
        };
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

  // GET /api/member-profiles - Get all member profiles (paginated)
  fastify.get<{ Querystring: { page?: string; limit?: string } }>(
    '/api/member-profiles',
    {
      schema: {
        description: 'Get all member profiles (paginated)',
        tags: ['member-profiles'],
        querystring: {
          type: 'object',
          properties: {
            page: { type: 'string', default: '1', description: 'Page number (default 1)' },
            limit: { type: 'string', default: '20', description: 'Items per page (default 20)' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              data: { type: 'array', items: { type: 'object' } },
              page: { type: 'number' },
              limit: { type: 'number' },
              total: { type: 'number' },
            },
          },
        },
      },
    },
    async (request: FastifyRequest<{ Querystring: { page?: string; limit?: string } }>, reply: FastifyReply) => {
      const page = Math.max(1, parseInt(request.query.page || '1', 10));
      const pageLimit = Math.max(1, parseInt(request.query.limit || '20', 10));
      const offsetValue = (page - 1) * pageLimit;

      app.logger.info({ page, limit: pageLimit }, 'Fetching member profiles');

      try {
        const totalResult = await app.db.select({ count: count() }).from(schema.memberProfiles);
        const total = totalResult[0]?.count || 0;

        const profiles = await app.db
          .select()
          .from(schema.memberProfiles)
          .orderBy(desc(schema.memberProfiles.createdAt))
          .limit(pageLimit)
          .offset(offsetValue);

        app.logger.info({ count: profiles.length, page, total }, 'Member profiles retrieved');

        return {
          data: profiles.map(p => ({
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
          })),
          page,
          limit: pageLimit,
          total,
        };
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

  // GET /api/member-profiles/me - Get authenticated user's member profile
  fastify.get(
    '/api/member-profiles/me',
    {
      schema: {
        description: 'Get the authenticated user\'s member profile',
        tags: ['member-profiles'],
        response: {
          200: { type: 'object' },
          401: { type: 'object', properties: { error: { type: 'string' } } },
          404: { type: 'object', properties: { error: { type: 'string' } } },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const requireAuth = app.requireAuth();
      const session = await requireAuth(request, reply);
      if (!session) return;

      const userId = session.user.id;
      app.logger.info({ userId }, 'Fetching authenticated user\'s member profile');

      try {
        const profiles = await app.db
          .select()
          .from(schema.memberProfiles)
          .where(eq(schema.memberProfiles.userId, userId));

        if (profiles.length === 0) {
          app.logger.info({ userId }, 'Member profile not found for authenticated user');
          reply.status(404);
          return { error: 'Member profile not found' };
        }

        const p = profiles[0];
        app.logger.info({ userId, profileId: p.id }, 'Authenticated user\'s member profile retrieved');

        return {
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
        };
      } catch (error) {
        app.logger.error({ err: error, userId }, 'Failed to fetch authenticated user\'s member profile');
        throw error;
      }
    }
  );

  // GET /api/member-profiles/:memberId - Get single member profile by ID
  fastify.get<{ Params: { memberId: string } }>(
    '/api/member-profiles/:memberId',
    {
      schema: {
        description: 'Get a member profile by ID',
        tags: ['member-profiles'],
        params: {
          type: 'object',
          required: ['memberId'],
          properties: { memberId: { type: 'string', format: 'uuid', description: 'Member profile ID' } },
        },
        response: {
          200: { type: 'object' },
          404: { type: 'object', properties: { error: { type: 'string' } } },
        },
      },
    },
    async (request: FastifyRequest<{ Params: { memberId: string } }>, reply: FastifyReply) => {
      const { memberId } = request.params;
      app.logger.info({ memberId }, 'Fetching member profile by ID');

      try {
        const profiles = await app.db
          .select()
          .from(schema.memberProfiles)
          .where(eq(schema.memberProfiles.id, memberId));

        if (profiles.length === 0) {
          app.logger.info({ memberId }, 'Member profile not found');
          reply.status(404);
          return { error: 'Member profile not found' };
        }

        const p = profiles[0];
        app.logger.info({ memberId }, 'Member profile retrieved');

        return {
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
        };
      } catch (error) {
        app.logger.error({ err: error, memberId }, 'Failed to fetch member profile');
        throw error;
      }
    }
  );

  // POST /api/member-profiles - Create new member profile
  fastify.post<{ Body: CreateMemberProfileBody }>(
    '/api/member-profiles',
    {
      schema: {
        description: 'Create a new member profile',
        tags: ['member-profiles'],
        body: {
          type: 'object',
          required: ['full_name', 'commune', 'profession'],
          properties: {
            full_name: { type: 'string' },
            first_name: { type: 'string' },
            last_name: { type: 'string' },
            commune: { type: 'string' },
            profession: { type: 'string' },
            phone: { type: 'string' },
            email: { type: 'string' },
            nina: { type: 'string' },
            region: { type: 'string' },
            cercle: { type: 'string' },
            motivation: { type: 'string' },
            role: { type: 'string' },
          },
        },
        response: {
          201: { type: 'object' },
          400: { type: 'object', properties: { error: { type: 'string' } } },
        },
      },
    },
    async (request: FastifyRequest<{ Body: CreateMemberProfileBody }>, reply: FastifyReply) => {
      const { full_name, first_name, last_name, commune, profession, phone, email, nina, region, cercle, motivation, role } = request.body;

      if (!full_name || !commune || !profession) {
        app.logger.warn({ full_name, commune, profession }, 'Validation error: missing required fields for member profile');
        reply.status(400);
        return { error: 'full_name, commune, and profession are required' };
      }

      app.logger.info({ email, full_name }, 'Creating new member profile');

      try {
        const membershipNumber = generateMembershipNumber();
        const now = new Date();

        // Try to get user_id from authenticated session
        let userId: string | null = null;
        try {
          const requireAuth = app.requireAuth();
          const session = await requireAuth(request, reply);
          if (session) {
            userId = session.user.id;
          }
        } catch {
          // If authentication fails, continue without user_id
          userId = null;
        }

        const result = await app.db
          .insert(schema.memberProfiles)
          .values({
            id: undefined as any,
            userId,
            fullName: full_name,
            firstName: first_name || null,
            lastName: last_name || null,
            commune,
            profession,
            phone: phone || null,
            email: email || null,
            nina: nina || null,
            region: region || null,
            cercle: cercle || null,
            motivation: motivation || null,
            membershipNumber,
            qrCode: membershipNumber,
            status: 'active',
            role: role || 'member',
            createdAt: now,
            updatedAt: now,
          })
          .returning();

        const p = result[0];
        app.logger.info({ profileId: p.id, membershipNumber }, 'Member profile created');

        reply.status(201);
        return {
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
        };
      } catch (error) {
        app.logger.error({ err: error, full_name, email }, 'Failed to create member profile');
        throw error;
      }
    }
  );

  // PUT /api/member-profiles/me - Update authenticated user's member profile
  fastify.put<{ Body: UpdateMemberProfileBody }>(
    '/api/member-profiles/me',
    {
      schema: {
        description: 'Update the authenticated user\'s member profile',
        tags: ['member-profiles'],
        body: {
          type: 'object',
          properties: {
            full_name: { type: 'string' },
            first_name: { type: 'string' },
            last_name: { type: 'string' },
            commune: { type: 'string' },
            profession: { type: 'string' },
            phone: { type: 'string' },
            email: { type: 'string' },
            nina: { type: 'string' },
            region: { type: 'string' },
            cercle: { type: 'string' },
            motivation: { type: 'string' },
          },
        },
        response: {
          200: { type: 'object' },
          401: { type: 'object', properties: { error: { type: 'string' } } },
          404: { type: 'object', properties: { error: { type: 'string' } } },
        },
      },
    },
    async (request: FastifyRequest<{ Body: UpdateMemberProfileBody }>, reply: FastifyReply) => {
      const requireAuth = app.requireAuth();
      const session = await requireAuth(request, reply);
      if (!session) return;

      const userId = session.user.id;
      app.logger.info({ userId }, 'Updating authenticated user\'s member profile');

      try {
        const updates: any = {};
        const body = request.body;

        if (body.full_name !== undefined) updates.fullName = body.full_name;
        if (body.first_name !== undefined) updates.firstName = body.first_name;
        if (body.last_name !== undefined) updates.lastName = body.last_name;
        if (body.commune !== undefined) updates.commune = body.commune;
        if (body.profession !== undefined) updates.profession = body.profession;
        if (body.phone !== undefined) updates.phone = body.phone || null;
        if (body.email !== undefined) updates.email = body.email || null;
        if (body.nina !== undefined) updates.nina = body.nina || null;
        if (body.region !== undefined) updates.region = body.region || null;
        if (body.cercle !== undefined) updates.cercle = body.cercle || null;
        if (body.motivation !== undefined) updates.motivation = body.motivation || null;

        updates.updatedAt = new Date();

        const result = await app.db
          .update(schema.memberProfiles)
          .set(updates)
          .where(eq(schema.memberProfiles.userId, userId))
          .returning();

        if (result.length === 0) {
          app.logger.info({ userId }, 'Member profile not found for authenticated user');
          reply.status(404);
          return { error: 'Member profile not found' };
        }

        const p = result[0];
        app.logger.info({ userId, profileId: p.id }, 'Authenticated user\'s member profile updated');

        return {
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
        };
      } catch (error) {
        app.logger.error({ err: error, userId }, 'Failed to update authenticated user\'s member profile');
        throw error;
      }
    }
  );

  // PUT /api/member-profiles/:memberId - Update member profile by ID (requires authentication)
  fastify.put<{ Params: { memberId: string }; Body: UpdateMemberProfileBody }>(
    '/api/member-profiles/:memberId',
    {
      schema: {
        description: 'Update a member profile by ID',
        tags: ['member-profiles'],
        params: {
          type: 'object',
          required: ['memberId'],
          properties: { memberId: { type: 'string', format: 'uuid' } },
        },
        body: {
          type: 'object',
          properties: {
            full_name: { type: 'string' },
            first_name: { type: 'string' },
            last_name: { type: 'string' },
            commune: { type: 'string' },
            profession: { type: 'string' },
            phone: { type: 'string' },
            email: { type: 'string' },
            nina: { type: 'string' },
            region: { type: 'string' },
            cercle: { type: 'string' },
            motivation: { type: 'string' },
          },
        },
        response: {
          200: { type: 'object' },
          401: { type: 'object', properties: { error: { type: 'string' } } },
          404: { type: 'object', properties: { error: { type: 'string' } } },
        },
      },
    },
    async (request: FastifyRequest<{ Params: { memberId: string }; Body: UpdateMemberProfileBody }>, reply: FastifyReply) => {
      const requireAuth = app.requireAuth();
      const session = await requireAuth(request, reply);
      if (!session) return;

      const { memberId } = request.params;
      app.logger.info({ memberId }, 'Updating member profile');

      try {
        const updates: any = {};
        const body = request.body;

        if (body.full_name !== undefined) updates.fullName = body.full_name;
        if (body.first_name !== undefined) updates.firstName = body.first_name;
        if (body.last_name !== undefined) updates.lastName = body.last_name;
        if (body.commune !== undefined) updates.commune = body.commune;
        if (body.profession !== undefined) updates.profession = body.profession;
        if (body.phone !== undefined) updates.phone = body.phone || null;
        if (body.email !== undefined) updates.email = body.email || null;
        if (body.nina !== undefined) updates.nina = body.nina || null;
        if (body.region !== undefined) updates.region = body.region || null;
        if (body.cercle !== undefined) updates.cercle = body.cercle || null;
        if (body.motivation !== undefined) updates.motivation = body.motivation || null;

        updates.updatedAt = new Date();

        const result = await app.db
          .update(schema.memberProfiles)
          .set(updates)
          .where(eq(schema.memberProfiles.id, memberId))
          .returning();

        if (result.length === 0) {
          app.logger.info({ memberId }, 'Member profile not found');
          reply.status(404);
          return { error: 'Member profile not found' };
        }

        const p = result[0];
        app.logger.info({ memberId }, 'Member profile updated');

        return {
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
        };
      } catch (error) {
        app.logger.error({ err: error, memberId }, 'Failed to update member profile');
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
