import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import * as schema from '../db/schema.js';
import type { App } from '../index.js';
import { getParticipants } from '../utils/conferenceStore.js';

interface ConferenceBody {
  title: string;
  description?: string;
  scheduledAt: string;
  duration?: number;
  hostName: string;
  status?: string;
  joinUrl?: string;
}

interface JoinConferenceBody {
  roomCode: string;
  participantName: string;
}

interface ConferenceUpdateBody {
  title?: string;
  description?: string;
  scheduledAt?: string;
  duration?: number;
  hostName?: string;
  status?: string;
  joinUrl?: string;
}

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

function verifyAdminPassword(request: FastifyRequest, reply: FastifyReply): boolean {
  const password = request.headers['x-admin-password'];
  if (password !== ADMIN_PASSWORD) {
    reply.status(401).send({
      error: 'Unauthorized',
      message: 'Invalid admin password',
    });
    return false;
  }
  return true;
}

function generateRoomCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

function generateARMRoomCode(): string {
  const digits = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `ARM-${digits}`;
}

function formatConference(conf: any) {
  return {
    id: conf.id,
    title: conf.title,
    description: conf.description,
    scheduledAt: conf.scheduledAt.toISOString(),
    duration: conf.duration,
    hostName: conf.hostName,
    roomCode: conf.roomCode,
    joinUrl: conf.joinUrl,
    status: conf.status,
    participantCount: conf.participantCount,
    startedAt: conf.startedAt ? conf.startedAt.toISOString() : null,
    endedAt: conf.endedAt ? conf.endedAt.toISOString() : null,
    createdAt: conf.createdAt.toISOString(),
  };
}

export async function seedDefaultConference(app: App) {
  try {
    const existing = await app.db
      .select()
      .from(schema.conferences)
      .where(eq(schema.conferences.roomCode, 'ARM-0001'));

    if (existing.length === 0) {
      const now = new Date();
      await app.db.insert(schema.conferences).values({
        title: 'Conférence ARM en Direct',
        description: 'Conférence officielle de l\'Alliance pour le Rassemblement Malien',
        hostName: 'ARM',
        status: 'active',
        roomCode: 'ARM-0001',
        joinUrl: '/conference/ARM-0001',
        scheduledAt: now,
        duration: 120,
        participantCount: 0,
        startedAt: now,
      });
      app.logger.info('Default active conference seeded');
    }
  } catch (error) {
    app.logger.error({ err: error }, 'Failed to seed default conference');
  }
}

export function register(app: App, fastify: FastifyInstance) {
  // GET /api/conferences - List all conferences (public)
  fastify.get(
    '/api/conferences',
    {
      schema: {
        description: 'Get all conferences',
        tags: ['conferences'],
        response: {
          200: { type: 'object' },
        },
      },
    },
    async (request, reply) => {
      app.logger.info('Fetching conferences');

      try {
        const result = await app.db
          .select()
          .from(schema.conferences)
          .orderBy(schema.conferences.scheduledAt);

        app.logger.info(
          { count: result.length },
          'Conferences fetched successfully'
        );
        return { conferences: result.map(formatConference) };
      } catch (error) {
        app.logger.error({ err: error }, 'Failed to fetch conferences');
        throw error;
      }
    }
  );

  // GET /api/conferences/:id - Get single conference (public)
  fastify.get<{ Params: { id: string } }>(
    '/api/conferences/:id',
    {
      schema: {
        description: 'Get a single conference',
        tags: ['conferences'],
        params: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
          },
        },
        response: {
          200: { type: 'object' },
          404: { type: 'object' },
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params;
      app.logger.info({ conferenceId: id }, 'Fetching conference');

      try {
        const result = await app.db
          .select()
          .from(schema.conferences)
          .where(eq(schema.conferences.id, id));

        if (result.length === 0) {
          app.logger.warn({ conferenceId: id }, 'Conference not found');
          reply.status(404);
          return { error: 'NotFound', message: 'Conference not found' };
        }

        app.logger.info({ conferenceId: id }, 'Conference fetched successfully');
        return formatConference(result[0]);
      } catch (error) {
        app.logger.error({ err: error, conferenceId: id }, 'Failed to fetch conference');
        throw error;
      }
    }
  );

  // POST /api/conferences - Create conference (admin)
  fastify.post<{ Body: ConferenceBody }>(
    '/api/conferences',
    {
      schema: {
        description: 'Create a conference (requires admin password)',
        tags: ['conferences'],
        body: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            description: { type: 'string' },
            scheduledAt: { type: 'string', format: 'date-time' },
            duration: { type: 'number' },
            hostName: { type: 'string' },
            status: { type: 'string' },
            joinUrl: { type: 'string' },
          },
          required: ['title', 'scheduledAt', 'hostName'],
        },
        response: {
          201: { type: 'object' },
          400: { type: 'object' },
          401: { type: 'object' },
        },
      },
    },
    async (request, reply) => {
      if (!verifyAdminPassword(request, reply)) return;

      const { title, description, scheduledAt, duration, hostName, status, joinUrl } = request.body;

      if (!title) {
        reply.status(400);
        return { error: 'BadRequest', message: 'Title is required' };
      }

      const roomCode = generateRoomCode();
      const finalJoinUrl = joinUrl || `https://meet.jit.si/AllianceARM-${roomCode}`;

      app.logger.info({ title, roomCode }, 'Creating conference');

      try {
        const result = await app.db
          .insert(schema.conferences)
          .values({
            title,
            description,
            scheduledAt: new Date(scheduledAt),
            duration: duration || 60,
            hostName,
            roomCode,
            joinUrl: finalJoinUrl,
            status: status || 'scheduled',
            participantCount: 0,
          })
          .returning();

        app.logger.info(
          { conferenceId: result[0].id, roomCode },
          'Conference created successfully'
        );
        reply.status(201);
        return { conference: formatConference(result[0]) };
      } catch (error) {
        app.logger.error({ err: error, title }, 'Failed to create conference');
        throw error;
      }
    }
  );

  // PUT /api/conferences/:id - Update conference (admin)
  fastify.put<{ Params: { id: string }; Body: ConferenceUpdateBody }>(
    '/api/conferences/:id',
    {
      schema: {
        description: 'Update a conference (requires admin password)',
        tags: ['conferences'],
        params: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
          },
        },
        body: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            description: { type: 'string' },
            scheduledAt: { type: 'string', format: 'date-time' },
            duration: { type: 'number' },
            hostName: { type: 'string' },
            status: { type: 'string' },
            joinUrl: { type: 'string' },
          },
        },
        response: {
          200: { type: 'object' },
          404: { type: 'object' },
          401: { type: 'object' },
        },
      },
    },
    async (request, reply) => {
      if (!verifyAdminPassword(request, reply)) return;

      const { id } = request.params;
      const updates = {
        ...request.body,
        ...(request.body.scheduledAt && {
          scheduledAt: new Date(request.body.scheduledAt),
        }),
      };

      app.logger.info({ conferenceId: id }, 'Updating conference');

      try {
        const result = await app.db
          .update(schema.conferences)
          .set(updates)
          .where(eq(schema.conferences.id, id))
          .returning();

        if (result.length === 0) {
          app.logger.warn({ conferenceId: id }, 'Conference not found');
          reply.status(404);
          return { error: 'NotFound', message: 'Conference not found' };
        }

        app.logger.info({ conferenceId: id }, 'Conference updated successfully');
        return { conference: formatConference(result[0]) };
      } catch (error) {
        app.logger.error({ err: error, conferenceId: id }, 'Failed to update conference');
        throw error;
      }
    }
  );

  // DELETE /api/conferences/:id - Delete conference (admin)
  fastify.delete<{ Params: { id: string } }>(
    '/api/conferences/:id',
    {
      schema: {
        description: 'Delete a conference (requires admin password)',
        tags: ['conferences'],
        params: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
          },
        },
        response: {
          200: { type: 'object' },
          404: { type: 'object' },
          401: { type: 'object' },
        },
      },
    },
    async (request, reply) => {
      if (!verifyAdminPassword(request, reply)) return;

      const { id } = request.params;
      app.logger.info({ conferenceId: id }, 'Deleting conference');

      try {
        const result = await app.db
          .delete(schema.conferences)
          .where(eq(schema.conferences.id, id))
          .returning();

        if (result.length === 0) {
          app.logger.warn({ conferenceId: id }, 'Conference not found');
          reply.status(404);
          return { error: 'NotFound', message: 'Conference not found' };
        }

        app.logger.info({ conferenceId: id }, 'Conference deleted successfully');
        return { success: true };
      } catch (error) {
        app.logger.error({ err: error, conferenceId: id }, 'Failed to delete conference');
        throw error;
      }
    }
  );

  // POST /api/conferences/:id/start - Start conference (admin)
  fastify.post<{ Params: { id: string } }>(
    '/api/conferences/:id/start',
    {
      schema: {
        description: 'Start a conference (admin only)',
        tags: ['conferences'],
        params: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
          },
        },
        response: {
          200: { type: 'object' },
          404: { type: 'object' },
          401: { type: 'object' },
        },
      },
    },
    async (request, reply) => {
      if (!verifyAdminPassword(request, reply)) return;

      const { id } = request.params;
      const now = new Date();

      app.logger.info({ conferenceId: id }, 'Starting conference');

      try {
        // Get conference
        const conf = await app.db
          .select()
          .from(schema.conferences)
          .where(eq(schema.conferences.id, id));

        if (conf.length === 0) {
          app.logger.warn({ conferenceId: id }, 'Conference not found');
          reply.status(404);
          return { error: 'NotFound', message: 'Conference not found' };
        }

        // Generate room code if missing
        let roomCode = conf[0].roomCode;
        if (!roomCode) {
          roomCode = generateARMRoomCode();
        }

        // Update conference
        const result = await app.db
          .update(schema.conferences)
          .set({
            status: 'active',
            startedAt: now,
            roomCode,
          })
          .where(eq(schema.conferences.id, id))
          .returning();

        app.logger.info(
          { conferenceId: id, roomCode },
          'Conference started successfully'
        );
        return formatConference(result[0]);
      } catch (error) {
        app.logger.error({ err: error, conferenceId: id }, 'Failed to start conference');
        throw error;
      }
    }
  );

  // POST /api/conferences/:id/end - End conference (admin)
  fastify.post<{ Params: { id: string } }>(
    '/api/conferences/:id/end',
    {
      schema: {
        description: 'End a conference (admin only)',
        tags: ['conferences'],
        params: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
          },
        },
        response: {
          200: { type: 'object' },
          404: { type: 'object' },
          401: { type: 'object' },
        },
      },
    },
    async (request, reply) => {
      if (!verifyAdminPassword(request, reply)) return;

      const { id } = request.params;
      const now = new Date();

      app.logger.info({ conferenceId: id }, 'Ending conference');

      try {
        const result = await app.db
          .update(schema.conferences)
          .set({
            status: 'ended',
            endedAt: now,
          })
          .where(eq(schema.conferences.id, id))
          .returning();

        if (result.length === 0) {
          app.logger.warn({ conferenceId: id }, 'Conference not found');
          reply.status(404);
          return { error: 'NotFound', message: 'Conference not found' };
        }

        app.logger.info({ conferenceId: id }, 'Conference ended successfully');
        return formatConference(result[0]);
      } catch (error) {
        app.logger.error({ err: error, conferenceId: id }, 'Failed to end conference');
        throw error;
      }
    }
  );

  // GET /api/conferences/:id/participants - Get participants in a conference
  fastify.get<{ Params: { id: string } }>(
    '/api/conferences/:id/participants',
    {
      schema: {
        description: 'Get participants in a conference',
        tags: ['conferences'],
        params: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
          },
        },
        response: {
          200: { type: 'array' },
          404: { type: 'object' },
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params;
      app.logger.info({ conferenceId: id }, 'Fetching participants');

      try {
        const conf = await app.db
          .select()
          .from(schema.conferences)
          .where(eq(schema.conferences.id, id));

        if (conf.length === 0) {
          app.logger.warn({ conferenceId: id }, 'Conference not found');
          reply.status(404);
          return { error: 'NotFound', message: 'Conference not found' };
        }

        const roomCode = conf[0].roomCode;
        const participants = getParticipants(roomCode);
        const formatted = participants.map((p, index) => ({
          id: index,
          name: p.name,
          joinedAt: p.joinedAt.toISOString(),
          isHost: p.isHost,
        }));

        app.logger.info(
          { conferenceId: id, count: formatted.length },
          'Participants fetched successfully'
        );
        return formatted;
      } catch (error) {
        app.logger.error(
          { err: error, conferenceId: id },
          'Failed to fetch participants'
        );
        throw error;
      }
    }
  );

  // POST /api/conferences/join - Join a conference
  fastify.post<{ Body: JoinConferenceBody }>(
    '/api/conferences/join',
    {
      schema: {
        description: 'Join a conference',
        tags: ['conferences'],
        body: {
          type: 'object',
          properties: {
            roomCode: { type: 'string' },
            participantName: { type: 'string' },
          },
          required: ['roomCode', 'participantName'],
        },
        response: {
          200: { type: 'object' },
          400: { type: 'object' },
        },
      },
    },
    async (request, reply) => {
      const { roomCode, participantName } = request.body;
      app.logger.info({ roomCode, participantName }, 'Joining conference');

      try {
        const conf = await app.db
          .select()
          .from(schema.conferences)
          .where(eq(schema.conferences.roomCode, roomCode));

        if (conf.length === 0 || conf[0].status !== 'active') {
          app.logger.warn({ roomCode }, 'Conference not found or not active');
          reply.status(400);
          return {
            error: 'Conference not found or not active',
            message: 'The conference is not available',
          };
        }

        const participantToken = randomUUID();
        app.logger.info(
          { roomCode, participantToken },
          'Participant joined conference'
        );

        return {
          conferenceId: conf[0].id,
          title: conf[0].title,
          hostName: conf[0].hostName,
          roomCode,
          participantToken,
        };
      } catch (error) {
        app.logger.error({ err: error, roomCode }, 'Failed to join conference');
        throw error;
      }
    }
  );
}
