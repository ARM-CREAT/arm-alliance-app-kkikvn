import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { eq, and, or } from 'drizzle-orm';
import * as schema from '../db/schema.js';
import type { App } from '../index.js';

interface InitiateCallBody {
  targetMemberId: string;
  callType: 'audio' | 'video';
}

function generateRoomCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

function formatCall(call: any) {
  return {
    callId: call.id,
    roomCode: call.roomCode,
    joinUrl: call.joinUrl,
    callType: call.callType,
    initiatorId: call.initiatorId,
    targetMemberId: call.targetMemberId,
    createdAt: call.createdAt.toISOString(),
  };
}

export function register(app: App, fastify: FastifyInstance) {
  const requireAuth = app.requireAuth();

  // POST /api/calls/initiate - Initiate a call (authenticated)
  fastify.post<{ Body: InitiateCallBody }>(
    '/api/calls/initiate',
    {
      schema: {
        description: 'Initiate a voice or video call',
        tags: ['calls'],
        body: {
          type: 'object',
          properties: {
            targetMemberId: { type: 'string' },
            callType: {
              type: 'string',
              enum: ['audio', 'video'],
            },
          },
          required: ['targetMemberId', 'callType'],
        },
        response: {
          201: { type: 'object' },
          401: { type: 'object' },
        },
      },
    },
    async (request, reply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      const { targetMemberId, callType } = request.body;
      const initiatorId = session.user.id;
      const roomCode = generateRoomCode();
      const joinUrl = `https://meet.jit.si/AllianceARM-Call-${roomCode}`;

      app.logger.info(
        { initiatorId, targetMemberId, callType },
        'Initiating call'
      );

      try {
        const result = await app.db
          .insert(schema.calls)
          .values({
            initiatorId,
            targetMemberId,
            callType,
            roomCode,
            joinUrl,
            status: 'active',
          })
          .returning();

        app.logger.info(
          { callId: result[0].id, initiatorId, targetMemberId },
          'Call initiated successfully'
        );
        reply.status(201);
        return {
          callId: result[0].id,
          roomCode,
          joinUrl,
          callType,
        };
      } catch (error) {
        app.logger.error(
          { err: error, initiatorId, targetMemberId },
          'Failed to initiate call'
        );
        throw error;
      }
    }
  );

  // GET /api/calls/active - Get active calls for current user (authenticated)
  fastify.get(
    '/api/calls/active',
    {
      schema: {
        description: 'Get active calls for current user',
        tags: ['calls'],
        response: {
          200: { type: 'array' },
          401: { type: 'object' },
        },
      },
    },
    async (request, reply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      const userId = session.user.id;
      app.logger.info({ userId }, 'Fetching active calls');

      try {
        const result = await app.db
          .select()
          .from(schema.calls)
          .where(
            and(
              or(
                eq(schema.calls.initiatorId, userId),
                eq(schema.calls.targetMemberId, userId)
              ),
              eq(schema.calls.status, 'active')
            )
          );

        app.logger.info(
          { userId, count: result.length },
          'Active calls fetched successfully'
        );
        return result.map(formatCall);
      } catch (error) {
        app.logger.error({ err: error, userId }, 'Failed to fetch active calls');
        throw error;
      }
    }
  );

  // POST /api/calls/:callId/end - End a call (authenticated)
  fastify.post<{ Params: { callId: string } }>(
    '/api/calls/:callId/end',
    {
      schema: {
        description: 'End a call',
        tags: ['calls'],
        params: {
          type: 'object',
          properties: {
            callId: { type: 'string', format: 'uuid' },
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
      const session = await requireAuth(request, reply);
      if (!session) return;

      const { callId } = request.params;
      const userId = session.user.id;
      app.logger.info({ callId, userId }, 'Ending call');

      try {
        // First get the call to check authorization
        const callResult = await app.db
          .select()
          .from(schema.calls)
          .where(eq(schema.calls.id, callId));

        if (callResult.length === 0) {
          app.logger.warn({ callId }, 'Call not found');
          reply.status(404);
          return { error: 'NotFound', message: 'Call not found' };
        }

        const call = callResult[0];
        if (call.initiatorId !== userId && call.targetMemberId !== userId) {
          app.logger.warn(
            { callId, userId, initiatorId: call.initiatorId, targetId: call.targetMemberId },
            'User not authorized to end this call'
          );
          reply.status(401);
          return { error: 'Unauthorized', message: 'Not authorized to end this call' };
        }

        // End the call
        const result = await app.db
          .update(schema.calls)
          .set({
            status: 'ended',
            endedAt: new Date(),
          })
          .where(eq(schema.calls.id, callId))
          .returning();

        app.logger.info({ callId, userId }, 'Call ended successfully');
        return {
          callId: result[0].id,
          status: result[0].status,
        };
      } catch (error) {
        app.logger.error({ err: error, callId, userId }, 'Failed to end call');
        throw error;
      }
    }
  );
}
