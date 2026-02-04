import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { eq, desc } from 'drizzle-orm';
import * as schema from '../db/schema.js';
import type { App } from '../index.js';
import { verifyAdminAuth } from '../utils/adminAuth.js';

interface SubmitResultsBody {
  electionType: string;
  region: string;
  cercle: string;
  commune: string;
  bureauVote: string;
  resultsData: Record<string, number>;
  pvPhotoUrl?: string;
}

interface VerifyResultBody {
  status: 'verified' | 'rejected';
  notes?: string;
}

export function register(app: App, fastify: FastifyInstance) {
  const requireAuth = app.requireAuth();

  // POST /api/elections/submit-results - Submit election results (protected)
  fastify.post<{ Body: SubmitResultsBody }>(
    '/api/elections/submit-results',
    {
      schema: {
        description: 'Submit election results (Module Sentinelle)',
        tags: ['elections'],
        body: {
          type: 'object',
          properties: {
            electionType: { type: 'string' },
            region: { type: 'string' },
            cercle: { type: 'string' },
            commune: { type: 'string' },
            bureauVote: { type: 'string' },
            resultsData: { type: 'object' },
            pvPhotoUrl: { type: 'string' },
          },
          required: ['electionType', 'region', 'cercle', 'commune', 'bureauVote', 'resultsData'],
        },
        response: {
          200: {
            type: 'object',
            properties: {
              resultId: { type: 'string' },
              status: { type: 'string' },
            },
          },
        },
      },
    },
    async (request: FastifyRequest<{ Body: SubmitResultsBody }>, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      const { electionType, region, cercle, commune, bureauVote, resultsData, pvPhotoUrl } =
        request.body;
      app.logger.info(
        { userId: session.user.id, electionType, bureauVote },
        'Submitting election results'
      );

      try {
        // Validate required fields
        if (!electionType || !region || !cercle || !commune || !bureauVote || !resultsData) {
          return reply.status(400).send({ error: 'Missing required fields' });
        }

        // Find member by userId or create a temporary reference
        let memberId: string | null = null;
        const memberResult = await app.db
          .select()
          .from(schema.memberProfiles)
          .where(eq(schema.memberProfiles.userId, session.user.id));

        if (memberResult.length > 0) {
          memberId = memberResult[0].id;
        } else {
          // Log warning but allow submission from non-registered users
          app.logger.warn(
            { userId: session.user.id },
            'Election result submission from user without member profile'
          );
          // Create a temporary member profile if needed
          const tempMember = await app.db
            .insert(schema.memberProfiles)
            .values({
              userId: session.user.id,
              fullName: 'Pending Verification',
              commune: commune || 'Unknown',
              profession: 'Sentinel',
              phone: '',
              membershipNumber: `TEMP-${Date.now()}`,
              qrCode: '',
              status: 'pending',
              role: 'militant',
            })
            .returning();
          memberId = tempMember[0].id;
        }

        const result = await app.db
          .insert(schema.electionResults)
          .values({
            memberId: memberId as any,
            electionType,
            region,
            cercle,
            commune,
            bureauVote,
            resultsData: resultsData as any,
            pvPhotoUrl,
            status: 'pending',
          })
          .returning();

        app.logger.info(
          { resultId: result[0].id, userId: session.user.id, electionType, bureauVote },
          'Election results submitted successfully'
        );

        return {
          resultId: result[0].id,
          status: 'pending',
          message: 'Results submitted successfully and pending verification',
        };
      } catch (error) {
        app.logger.error(
          { err: error, userId: session.user.id, electionType },
          'Failed to submit election results'
        );
        return reply.status(500).send({ error: 'Failed to submit election results' });
      }
    }
  );

  // GET /api/elections/my-submissions - Get user's submissions (protected)
  fastify.get(
    '/api/elections/my-submissions',
    {
      schema: {
        description: 'Get user\'s submitted election results (protected)',
        tags: ['elections'],
        response: {
          200: { type: 'array' },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      app.logger.info({ userId: session.user.id }, 'Fetching user election submissions');

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

        const result = await app.db
          .select()
          .from(schema.electionResults)
          .where(eq(schema.electionResults.memberId, memberId))
          .orderBy(desc(schema.electionResults.submittedAt));

        app.logger.info(
          { userId: session.user.id, count: result.length },
          'Election submissions fetched'
        );
        return result;
      } catch (error) {
        app.logger.error(
          { err: error, userId: session.user.id },
          'Failed to fetch election submissions'
        );
        throw error;
      }
    }
  );

  // GET /api/elections/results/:id - Get specific result (protected)
  fastify.get<{ Params: { id: string } }>(
    '/api/elections/results/:id',
    {
      schema: {
        description: 'Get specific election result details (protected)',
        tags: ['elections'],
        params: {
          type: 'object',
          properties: {
            id: { type: 'string' },
          },
        },
        response: {
          200: { type: 'object' },
        },
      },
    },
    async (
      request: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply
    ) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      const { id } = request.params;
      app.logger.info({ userId: session.user.id, resultId: id }, 'Fetching election result');

      try {
        const result = await app.db
          .select()
          .from(schema.electionResults)
          .where(eq(schema.electionResults.id, id as any));

        if (result.length === 0) {
          return reply.status(404).send({ error: 'Result not found' });
        }

        app.logger.info(
          { userId: session.user.id, resultId: id },
          'Election result fetched'
        );
        return result[0];
      } catch (error) {
        app.logger.error(
          { err: error, userId: session.user.id, resultId: id },
          'Failed to fetch election result'
        );
        throw error;
      }
    }
  );

  // GET /api/admin/elections/pending - Get pending results (admin only)
  fastify.get(
    '/api/admin/elections/pending',
    {
      schema: {
        description: 'Get pending election results for verification (admin only)',
        tags: ['admin', 'elections'],
        response: {
          200: { type: 'array' },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const admin = await verifyAdminAuth(request, reply, app);
      if (!admin) return;

      app.logger.info({ adminId: admin.userId }, 'Fetching pending election results');

      try {
        const result = await app.db
          .select()
          .from(schema.electionResults)
          .where(eq(schema.electionResults.status, 'pending'))
          .orderBy(desc(schema.electionResults.submittedAt));

        app.logger.info(
          { adminId: admin.userId, count: result.length },
          'Pending election results fetched'
        );
        return result;
      } catch (error) {
        app.logger.error(
          { err: error, adminId: admin.userId },
          'Failed to fetch pending election results'
        );
        throw error;
      }
    }
  );

  // PUT /api/admin/elections/:id/verify - Verify result (admin only)
  fastify.put<{ Params: { id: string }; Body: VerifyResultBody }>(
    '/api/admin/elections/:id/verify',
    {
      schema: {
        description: 'Verify election result (admin only)',
        tags: ['admin', 'elections'],
        params: {
          type: 'object',
          properties: {
            id: { type: 'string' },
          },
        },
        body: {
          type: 'object',
          properties: {
            status: { type: 'string', enum: ['verified', 'rejected'] },
            notes: { type: 'string' },
          },
          required: ['status'],
        },
        response: {
          200: { type: 'object' },
        },
      },
    },
    async (
      request: FastifyRequest<{ Params: { id: string }; Body: VerifyResultBody }>,
      reply: FastifyReply
    ) => {
      const admin = await verifyAdminAuth(request, reply, app);
      if (!admin) return;

      const { id } = request.params;
      const { status } = request.body;
      app.logger.info(
        { adminId: admin.userId, resultId: id, status },
        'Verifying election result'
      );

      try {
        const result = await app.db
          .update(schema.electionResults)
          .set({
            status: status as any,
            verifiedBy: admin.username,
            verifiedAt: new Date(),
          })
          .where(eq(schema.electionResults.id, id as any))
          .returning();

        if (result.length === 0) {
          return reply.status(404).send({ error: 'Result not found' });
        }

        app.logger.info(
          { adminId: admin.userId, resultId: id, status },
          'Election result verified'
        );
        return result[0];
      } catch (error) {
        app.logger.error(
          { err: error, adminId: admin.userId, resultId: id },
          'Failed to verify election result'
        );
        throw error;
      }
    }
  );
}
