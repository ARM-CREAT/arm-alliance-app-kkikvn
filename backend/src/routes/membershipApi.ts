import type { FastifyInstance } from 'fastify';
import { eq, and, ilike, or, isNull } from 'drizzle-orm';
import * as schema from '../db/schema.js';
import type { App } from '../index.js';

export function register(app: App, fastify: FastifyInstance) {
  const requireAuth = app.requireAuth();

  // GET /api/cotisations/my-history
  fastify.get('/api/cotisations/my-history', {
    schema: {
      description: 'Get user cotisation history',
      tags: ['cotisations'],
      response: { 200: { type: 'object' }, 401: { type: 'object' }, 404: { type: 'object' } },
    },
  }, async (request, reply) => {
    const session = await requireAuth(request, reply);
    if (!session) return;

    app.logger.info({ userId: session.user.id }, 'Fetching cotisation history');

    try {
      const memberProfile = await app.db.select().from(schema.memberProfiles).where(eq(schema.memberProfiles.userId, session.user.id as any)).limit(1) as any;

      if (!memberProfile || memberProfile.length === 0) {
        reply.status(404);
        return { error: 'Profil membre non trouvé' };
      }

      const cotisations = await app.db.select().from(schema.cotisations).where(eq(schema.cotisations.memberId, memberProfile[0].id)).orderBy(schema.cotisations.createdAt) as any;

      app.logger.info({ count: cotisations.length }, 'Cotisation history fetched');
      return {
        cotisations: cotisations.map((c: any) => ({
          id: c.id,
          amount: c.amount.toString(),
          type: c.type,
          paymentMethod: c.paymentMethod,
          transactionId: c.transactionId,
          status: c.status,
          paidAt: c.paidAt,
          createdAt: c.createdAt,
        })),
      };
    } catch (error) {
      app.logger.error({ err: error, userId: session.user.id }, 'Failed to fetch cotisation history');
      throw error;
    }
  });

  // GET /api/messages/my-messages
  fastify.get('/api/messages/my-messages', {
    schema: {
      description: 'Get messages targeted to user',
      tags: ['messages'],
      response: { 200: { type: 'object' }, 401: { type: 'object' }, 404: { type: 'object' } },
    },
  }, async (request, reply) => {
    const session = await requireAuth(request, reply);
    if (!session) return;

    app.logger.info({ userId: session.user.id }, 'Fetching user messages');

    try {
      const memberProfiles = await app.db.select().from(schema.memberProfiles).where(eq(schema.memberProfiles.userId, session.user.id as any)).limit(1) as any;

      if (!memberProfiles || memberProfiles.length === 0) {
        reply.status(404);
        return { error: 'Profil membre non trouvé' };
      }

      const member = memberProfiles[0];

      const allMessages = await app.db.select().from(schema.internalMessages) as any;
      const messageReadsData = await app.db.select().from(schema.messageReads) as any;

      const filteredMessages = allMessages.filter((msg: any) => {
        const roleMatches = !msg.targetRole || msg.targetRole === member.role;
        const regionMatches = !msg.targetRegion || msg.targetRegion === member.region;
        const cercleMatches = !msg.targetCercle || msg.targetCercle === member.cercle;
        const communeMatches = !msg.targetCommune || msg.targetCommune === member.commune;
        return roleMatches && regionMatches && cercleMatches && communeMatches;
      });

      const result = filteredMessages.map((msg: any) => {
        const isRead = messageReadsData.some((mr: any) => mr.messageId === msg.id && mr.memberProfileId === member.id);
        return {
          id: msg.id,
          title: msg.title,
          content: msg.content,
          sentAt: msg.sentAt,
          isRead,
        };
      });

      result.sort((a: any, b: any) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime());

      app.logger.info({ count: result.length }, 'User messages fetched');
      return { messages: result };
    } catch (error) {
      app.logger.error({ err: error, userId: session.user.id }, 'Failed to fetch messages');
      throw error;
    }
  });

  // POST /api/messages/mark-read/:id
  fastify.post('/api/messages/mark-read/:id', {
    schema: {
      description: 'Mark a message as read',
      tags: ['messages'],
      params: { type: 'object', properties: { id: { type: 'string', format: 'uuid' } } },
      response: { 200: { type: 'object' }, 401: { type: 'object' }, 404: { type: 'object' } },
    },
  }, async (request, reply) => {
    const session = await requireAuth(request, reply);
    if (!session) return;

    const { id } = request.params as any;
    app.logger.info({ userId: session.user.id, messageId: id }, 'Marking message as read');

    try {
      const memberProfile = await app.db.select().from(schema.memberProfiles).where(eq(schema.memberProfiles.userId, session.user.id as any)).limit(1) as any;

      if (!memberProfile || memberProfile.length === 0) {
        reply.status(404);
        return { error: 'Profil membre non trouvé' };
      }

      const existing = await app.db.select().from(schema.messageReads).where(and(eq(schema.messageReads.messageId, id as any), eq(schema.messageReads.memberProfileId, memberProfile[0].id))).limit(1) as any;

      if (!existing || existing.length === 0) {
        await app.db
          .insert(schema.messageReads)
          .values({
            messageId: id as any,
            memberProfileId: memberProfile[0].id,
            readAt: new Date(),
          } as any);
      }

      app.logger.info({ messageId: id }, 'Message marked as read');
      return { success: true };
    } catch (error) {
      app.logger.error({ err: error, userId: session.user.id }, 'Failed to mark message as read');
      throw error;
    }
  });

  // POST /api/elections/submit-results
  fastify.post('/api/elections/submit-results', {
    schema: {
      description: 'Submit election results',
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
      response: { 201: { type: 'object' }, 401: { type: 'object' }, 404: { type: 'object' } },
    },
  }, async (request, reply) => {
    const session = await requireAuth(request, reply);
    if (!session) return;

    const { electionType, region, cercle, commune, bureauVote, resultsData, pvPhotoUrl } = request.body as any;
    app.logger.info({ userId: session.user.id, electionType }, 'Submitting election results');

    try {
      const memberProfile = await app.db.select().from(schema.memberProfiles).where(eq(schema.memberProfiles.userId, session.user.id as any)).limit(1) as any;

      if (!memberProfile || memberProfile.length === 0) {
        reply.status(404);
        return { error: 'Profil membre non trouvé' };
      }

      const resultData = await app.db
        .insert(schema.electionResults)
        .values({
          memberId: memberProfile[0].id,
          electionType,
          region,
          cercle,
          commune,
          bureauVote,
          resultsData,
          pvPhotoUrl: pvPhotoUrl || null,
          submittedAt: new Date(),
          status: 'submitted',
        } as any)
        .returning() as any;

      reply.status(201);
      app.logger.info({ resultId: resultData[0].id }, 'Election results submitted');
      return {
        resultId: resultData[0].id,
        status: 'submitted',
      };
    } catch (error) {
      app.logger.error({ err: error, userId: session.user.id }, 'Failed to submit election results');
      throw error;
    }
  });
}
