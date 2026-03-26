import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { eq, inArray } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import * as schema from '../db/schema.js';
import type { App } from '../index.js';

interface InitiateCallBody {
  targetMemberId: string;
  callType: 'audio' | 'video';
}

function formatCall(call: any) {
  return {
    id: call.id,
    initiatorId: call.initiatorId,
    targetMemberId: call.targetMemberId,
    callType: call.callType,
    roomCode: call.roomCode,
    joinUrl: call.joinUrl,
    status: call.status,
    createdAt: call.createdAt instanceof Date ? call.createdAt.toISOString() : new Date(call.createdAt).toISOString(),
    endedAt: call.endedAt ? (call.endedAt instanceof Date ? call.endedAt.toISOString() : new Date(call.endedAt).toISOString()) : null,
  };
}

export function register(app: App, fastify: FastifyInstance) {
  const requireAuth = app.requireAuth();

  // GET /api/calls/active - Get active calls (public or authenticated)
  fastify.get(
    '/api/calls/active',
    {
      schema: {
        description: 'Get active calls',
        tags: ['calls'],
        response: {
          200: {
            type: 'object',
            properties: {
              calls: { type: 'array' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      app.logger.info('Fetching active calls');

      try {
        const result = await app.db
          .select()
          .from(schema.calls)
          .where(eq(schema.calls.status, 'active'))
          .orderBy(schema.calls.createdAt);

        app.logger.info({ count: result.length }, 'Active calls fetched');
        return { calls: result.map(formatCall) };
      } catch (error) {
        app.logger.error({ err: error }, 'Failed to fetch calls');
        throw error;
      }
    }
  );

  // POST /api/calls/initiate - Initiate a call (requires authentication)
  fastify.post<{ Body: InitiateCallBody }>(
    '/api/calls/initiate',
    {
      schema: {
        description: 'Initiate a call (requires authentication)',
        tags: ['calls'],
        body: {
          type: 'object',
          properties: {
            targetMemberId: { type: 'string' },
            callType: { type: 'string', enum: ['audio', 'video'] },
          },
          required: ['targetMemberId', 'callType'],
        },
        response: {
          201: { type: 'object' },
          400: { type: 'object' },
          401: { type: 'object' },
        },
      },
    },
    async (request: FastifyRequest<{ Body: InitiateCallBody }>, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      const { targetMemberId, callType } = request.body;

      if (!targetMemberId || !callType) {
        reply.status(400);
        return { error: 'Missing required fields: targetMemberId, callType' };
      }

      const callId = randomUUID();
      const roomCode = `alliance-arm-${callId}`;
      const joinUrl = `https://meet.jit.si/${roomCode}`;

      app.logger.info({ callId, targetMemberId, userId: session.user.id }, 'Initiating call');

      try {
        await app.db.insert(schema.calls).values({
          id: callId,
          initiatorId: session.user.id,
          targetMemberId,
          callType,
          roomCode,
          joinUrl,
          status: 'active',
        });

        app.logger.info({ callId, roomCode }, 'Call initiated successfully');
        reply.status(201);
        return { joinUrl, callId, roomCode };
      } catch (error) {
        app.logger.error({ err: error, callId, targetMemberId }, 'Failed to initiate call');
        throw error;
      }
    }
  );
}
