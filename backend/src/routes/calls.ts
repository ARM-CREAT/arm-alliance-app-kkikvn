import type { FastifyInstance } from 'fastify';
import { eq, inArray } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import * as schema from '../db/schema.js';
import type { App } from '../index.js';

interface InitiateCallBody {
  targetMemberId: string;
  callType: 'audio' | 'video';
}

export function register(app: App, fastify: FastifyInstance) {
  // GET /api/calls/active - Get active calls (public)
  fastify.get(
    '/api/calls/active',
    {
      schema: {
        description: 'Get active calls',
        tags: ['calls'],
        response: {
          200: { type: 'array' },
        },
      },
    },
    async (request, reply) => {
      app.logger.info('Fetching active calls');

      try {
        const result = await app.db
          .select()
          .from(schema.calls)
          .where(inArray(schema.calls.status, ['initiating', 'active']))
          .orderBy(schema.calls.createdAt);

        const formatted = result.map((c) => ({
          id: c.id,
          callType: c.callType,
          status: c.status,
          joinUrl: c.joinUrl,
          initiatorId: c.initiatorId,
          targetMemberId: c.targetMemberId,
          createdAt: c.createdAt.toISOString(),
        }));

        app.logger.info({ count: formatted.length }, 'Active calls fetched');
        return formatted;
      } catch (error) {
        app.logger.error({ err: error }, 'Failed to fetch calls');
        throw error;
      }
    }
  );

  // POST /api/calls/initiate - Initiate a call (public)
  fastify.post<{ Body: InitiateCallBody }>(
    '/api/calls/initiate',
    {
      schema: {
        description: 'Initiate a call',
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
        },
      },
    },
    async (request, reply) => {
      const { targetMemberId, callType } = request.body;

      if (!targetMemberId || !callType) {
        reply.status(400);
        return { error: 'Missing required fields' };
      }

      const callId = randomUUID();
      const roomCode = `alliance-arm-${callId}`;
      const joinUrl = `https://meet.jit.si/${roomCode}`;

      app.logger.info({ callId, targetMemberId }, 'Initiating call');

      try {
        await app.db.insert(schema.calls).values({
          id: callId,
          initiatorId: 'anonymous',
          targetMemberId,
          callType,
          roomCode,
          joinUrl,
          status: 'initiating',
        });

        app.logger.info({ callId }, 'Call initiated');
        reply.status(201);
        return { callId, joinUrl, status: 'initiating' };
      } catch (error) {
        app.logger.error({ err: error, callId }, 'Failed to initiate call');
        throw error;
      }
    }
  );
}
