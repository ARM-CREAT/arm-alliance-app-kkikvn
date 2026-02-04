import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { eq, desc } from 'drizzle-orm';
import * as schema from '../db/schema.js';
import type { App } from '../index.js';
import {
  generateMembershipNumber,
  generateQRCode,
  getPaymentInstructions,
} from '../utils/membershipUtils.js';

interface RegisterMemberBody {
  fullName: string;
  nina?: string;
  commune: string;
  profession: string;
  phone: string;
  email?: string;
}

interface UpdateMemberBody {
  fullName?: string;
  commune?: string;
  profession?: string;
  phone?: string;
  email?: string;
}

interface InitiateCotisationBody {
  amount: number;
  type: 'monthly' | 'annual' | 'one-time';
  paymentMethod: 'sama_money' | 'orange_money' | 'moov_money' | 'bank_transfer';
}

interface ConfirmCotisationBody {
  cotisationId: string;
  transactionId: string;
}

export function register(app: App, fastify: FastifyInstance) {
  const requireAuth = app.requireAuth();

  // POST /api/members/register - Register new member (protected - requires authentication)
  fastify.post<{ Body: RegisterMemberBody }>(
    '/api/members/register',
    {
      schema: {
        description: 'Register as a new member (protected - requires authentication)',
        tags: ['members'],
        body: {
          type: 'object',
          properties: {
            fullName: { type: 'string' },
            nina: { type: 'string' },
            commune: { type: 'string' },
            profession: { type: 'string' },
            phone: { type: 'string' },
            email: { type: 'string' },
          },
          required: ['fullName', 'commune', 'profession', 'phone'],
        },
        response: {
          200: {
            type: 'object',
            properties: {
              member: { type: 'object' },
              membershipNumber: { type: 'string' },
              qrCode: { type: 'string' },
            },
          },
        },
      },
    },
    async (request: FastifyRequest<{ Body: RegisterMemberBody }>, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      const { fullName, nina, commune, profession, phone, email } = request.body;
      app.logger.info({ userId: session.user.id, fullName, phone }, 'New member registration');

      try {
        // Check if user already has a member profile
        const existingProfile = await app.db
          .select()
          .from(schema.memberProfiles)
          .where(eq(schema.memberProfiles.userId, session.user.id));

        if (existingProfile.length > 0) {
          app.logger.warn(
            { userId: session.user.id, memberId: existingProfile[0].id },
            'User attempted to register again but already has a member profile'
          );
          return reply.status(409).send({
            error: 'You already have a member profile',
            membershipNumber: existingProfile[0].membershipNumber,
          });
        }

        // Get the next sequence number
        const allMembers = await app.db
          .select()
          .from(schema.memberProfiles)
          .orderBy(desc(schema.memberProfiles.createdAt));

        const sequenceNumber = allMembers.length + 1;
        const membershipNumber = generateMembershipNumber(sequenceNumber);
        const qrCode = await generateQRCode(membershipNumber, fullName, 'pending');

        const result = await app.db
          .insert(schema.memberProfiles)
          .values({
            userId: session.user.id,
            fullName,
            nina,
            commune,
            profession,
            phone,
            email,
            membershipNumber,
            qrCode,
            status: 'pending',
            role: 'militant',
          })
          .returning();

        app.logger.info(
          { userId: session.user.id, memberId: result[0].id, membershipNumber },
          'Member registered successfully and linked to user account'
        );

        return {
          member: result[0],
          membershipNumber,
          qrCode,
        };
      } catch (error) {
        app.logger.error(
          { err: error, userId: session.user.id, fullName, phone },
          'Failed to register member'
        );
        throw error;
      }
    }
  );

  // GET /api/members/card/:membershipNumber - Get member card (public)
  fastify.get<{ Params: { membershipNumber: string } }>(
    '/api/members/card/:membershipNumber',
    {
      schema: {
        description: 'Get member card data (public - for verification)',
        tags: ['members'],
        params: {
          type: 'object',
          properties: {
            membershipNumber: { type: 'string' },
          },
        },
        response: {
          200: { type: 'object' },
        },
      },
    },
    async (
      request: FastifyRequest<{ Params: { membershipNumber: string } }>,
      reply: FastifyReply
    ) => {
      const { membershipNumber } = request.params;
      app.logger.info({ membershipNumber }, 'Fetching member card');

      try {
        const result = await app.db
          .select()
          .from(schema.memberProfiles)
          .where(eq(schema.memberProfiles.membershipNumber, membershipNumber));

        if (result.length === 0) {
          return reply.status(404).send({ error: 'Member not found' });
        }

        const member = result[0];
        app.logger.info(
          { membershipNumber },
          'Member card fetched successfully'
        );

        return {
          membershipNumber: member.membershipNumber,
          fullName: member.fullName,
          status: member.status,
          qrCode: member.qrCode,
          commune: member.commune,
        };
      } catch (error) {
        app.logger.error(
          { err: error, membershipNumber },
          'Failed to fetch member card'
        );
        throw error;
      }
    }
  );

  // GET /api/members/me - Get current user's member profile (protected)
  fastify.get(
    '/api/members/me',
    {
      schema: {
        description: 'Get current user\'s member profile (protected)',
        tags: ['members'],
        response: {
          200: { type: 'object' },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      app.logger.info({ userId: session.user.id }, 'Fetching user member profile');

      try {
        const result = await app.db
          .select()
          .from(schema.memberProfiles)
          .where(eq(schema.memberProfiles.userId, session.user.id));

        if (result.length === 0) {
          return reply.status(404).send({ error: 'Member profile not found' });
        }

        app.logger.info(
          { userId: session.user.id },
          'Member profile fetched successfully'
        );
        return result[0];
      } catch (error) {
        app.logger.error(
          { err: error, userId: session.user.id },
          'Failed to fetch member profile'
        );
        throw error;
      }
    }
  );

  // PUT /api/members/me - Update current user's member profile (protected)
  fastify.put<{ Body: UpdateMemberBody }>(
    '/api/members/me',
    {
      schema: {
        description: 'Update current user\'s member profile (protected)',
        tags: ['members'],
        body: {
          type: 'object',
          properties: {
            fullName: { type: 'string' },
            commune: { type: 'string' },
            profession: { type: 'string' },
            phone: { type: 'string' },
            email: { type: 'string' },
          },
        },
        response: {
          200: { type: 'object' },
        },
      },
    },
    async (request: FastifyRequest<{ Body: UpdateMemberBody }>, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      const updates = request.body;
      app.logger.info({ userId: session.user.id }, 'Updating member profile');

      try {
        const result = await app.db
          .update(schema.memberProfiles)
          .set({
            ...updates,
            updatedAt: new Date(),
          })
          .where(eq(schema.memberProfiles.userId, session.user.id))
          .returning();

        if (result.length === 0) {
          return reply.status(404).send({ error: 'Member profile not found' });
        }

        app.logger.info(
          { userId: session.user.id },
          'Member profile updated successfully'
        );
        return result[0];
      } catch (error) {
        app.logger.error(
          { err: error, userId: session.user.id },
          'Failed to update member profile'
        );
        throw error;
      }
    }
  );

  // POST /api/cotisations/initiate - Initiate payment (protected)
  fastify.post<{ Body: InitiateCotisationBody }>(
    '/api/cotisations/initiate',
    {
      schema: {
        description: 'Initiate membership fee payment (protected)',
        tags: ['cotisations'],
        body: {
          type: 'object',
          properties: {
            amount: { type: 'number' },
            type: { type: 'string', enum: ['monthly', 'annual', 'one-time'] },
            paymentMethod: {
              type: 'string',
              enum: ['sama_money', 'orange_money', 'moov_money', 'bank_transfer'],
            },
          },
          required: ['amount', 'type', 'paymentMethod'],
        },
        response: {
          200: {
            type: 'object',
            properties: {
              cotisationId: { type: 'string' },
              paymentInstructions: { type: 'object' },
            },
          },
        },
      },
    },
    async (request: FastifyRequest<{ Body: InitiateCotisationBody }>, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      const { amount, type, paymentMethod } = request.body;
      app.logger.info(
        { userId: session.user.id, amount, type },
        'Initiating cotisation payment'
      );

      try {
        // Find member by userId
        const memberResult = await app.db
          .select()
          .from(schema.memberProfiles)
          .where(eq(schema.memberProfiles.userId, session.user.id));

        if (memberResult.length === 0) {
          return reply.status(404).send({ error: 'Member profile not found' });
        }

        const memberId = memberResult[0].id;
        const transactionRef = `TXN-${Date.now()}`;

        // Create cotisation record
        const result = await app.db
          .insert(schema.cotisations)
          .values({
            memberId,
            amount: amount.toString() as any,
            type,
            paymentMethod,
            status: 'pending',
          })
          .returning();

        const paymentInstructions = getPaymentInstructions(
          paymentMethod,
          amount,
          transactionRef
        );

        app.logger.info(
          { cotisationId: result[0].id, userId: session.user.id },
          'Cotisation payment initiated'
        );

        return {
          cotisationId: result[0].id,
          paymentInstructions,
        };
      } catch (error) {
        app.logger.error(
          { err: error, userId: session.user.id },
          'Failed to initiate cotisation payment'
        );
        throw error;
      }
    }
  );

  // POST /api/cotisations/confirm - Confirm payment (protected)
  fastify.post<{ Body: ConfirmCotisationBody }>(
    '/api/cotisations/confirm',
    {
      schema: {
        description: 'Confirm membership fee payment (protected)',
        tags: ['cotisations'],
        body: {
          type: 'object',
          properties: {
            cotisationId: { type: 'string' },
            transactionId: { type: 'string' },
          },
          required: ['cotisationId', 'transactionId'],
        },
        response: {
          200: { type: 'object' },
        },
      },
    },
    async (request: FastifyRequest<{ Body: ConfirmCotisationBody }>, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      const { cotisationId, transactionId } = request.body;
      app.logger.info(
        { userId: session.user.id, cotisationId, transactionId },
        'Confirming cotisation payment'
      );

      try {
        const result = await app.db
          .update(schema.cotisations)
          .set({
            status: 'completed',
            transactionId,
            paidAt: new Date(),
          })
          .where(eq(schema.cotisations.id, cotisationId as any))
          .returning();

        if (result.length === 0) {
          return reply.status(404).send({ error: 'Cotisation not found' });
        }

        app.logger.info(
          { cotisationId, userId: session.user.id },
          'Cotisation payment confirmed'
        );
        return result[0];
      } catch (error) {
        app.logger.error(
          { err: error, cotisationId, userId: session.user.id },
          'Failed to confirm cotisation payment'
        );
        throw error;
      }
    }
  );

  // GET /api/cotisations/my-history - Get payment history (protected)
  fastify.get(
    '/api/cotisations/my-history',
    {
      schema: {
        description: 'Get user\'s cotisation payment history (protected)',
        tags: ['cotisations'],
        response: {
          200: { type: 'array' },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      app.logger.info({ userId: session.user.id }, 'Fetching cotisation history');

      try {
        // Find member by userId
        const memberResult = await app.db
          .select()
          .from(schema.memberProfiles)
          .where(eq(schema.memberProfiles.userId, session.user.id));

        if (memberResult.length === 0) {
          return reply.status(404).send({ error: 'Member profile not found' });
        }

        const memberId = memberResult[0].id;

        // Get cotisations for this member
        const result = await app.db
          .select()
          .from(schema.cotisations)
          .where(eq(schema.cotisations.memberId, memberId))
          .orderBy(desc(schema.cotisations.createdAt));

        app.logger.info(
          { userId: session.user.id, count: result.length },
          'Cotisation history fetched'
        );
        return result;
      } catch (error) {
        app.logger.error(
          { err: error, userId: session.user.id },
          'Failed to fetch cotisation history'
        );
        throw error;
      }
    }
  );

  // GET /api/members/card/download/:membershipNumber - Download member card (public)
  fastify.get<{ Params: { membershipNumber: string } }>(
    '/api/members/card/download/:membershipNumber',
    {
      schema: {
        description: 'Download member card as image (public)',
        tags: ['members'],
        params: {
          type: 'object',
          properties: {
            membershipNumber: { type: 'string' },
          },
        },
        response: {
          200: { type: 'string' },
        },
      },
    },
    async (
      request: FastifyRequest<{ Params: { membershipNumber: string } }>,
      reply: FastifyReply
    ) => {
      const { membershipNumber } = request.params;
      app.logger.info({ membershipNumber }, 'Downloading member card');

      try {
        const result = await app.db
          .select()
          .from(schema.memberProfiles)
          .where(eq(schema.memberProfiles.membershipNumber, membershipNumber));

        if (result.length === 0) {
          return reply.status(404).send({ error: 'Member not found' });
        }

        const member = result[0];
        const qrCodeData = member.qrCode;

        // Set response headers for image download
        reply.header('Content-Type', 'image/png');
        reply.header('Content-Disposition', `attachment; filename="card-${membershipNumber}.png"`);

        app.logger.info({ membershipNumber }, 'Member card downloaded successfully');

        // Return the QR code data URL as PNG
        return qrCodeData;
      } catch (error) {
        app.logger.error(
          { err: error, membershipNumber },
          'Failed to download member card'
        );
        throw error;
      }
    }
  );

  // GET /api/members/all-members - Get all members with cards (public - for admin view)
  fastify.get(
    '/api/members/all-members',
    {
      schema: {
        description: 'Get all members with their cards (public)',
        tags: ['members'],
        response: {
          200: { type: 'array' },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      app.logger.info({}, 'Fetching all members');

      try {
        const result = await app.db
          .select()
          .from(schema.memberProfiles)
          .orderBy(desc(schema.memberProfiles.createdAt));

        app.logger.info({ count: result.length }, 'All members fetched successfully');

        return result.map(member => ({
          id: member.id,
          fullName: member.fullName,
          membershipNumber: member.membershipNumber,
          commune: member.commune,
          phone: member.phone,
          status: member.status,
          role: member.role,
          qrCode: member.qrCode,
          createdAt: member.createdAt,
        }));
      } catch (error) {
        app.logger.error({ err: error }, 'Failed to fetch all members');
        throw error;
      }
    }
  );
}
