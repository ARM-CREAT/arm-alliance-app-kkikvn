import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { eq } from 'drizzle-orm';
import * as schema from '../db/schema.js';
import type { App } from '../index.js';

interface ConferenceBody {
  title: string;
  description?: string;
  scheduledAt: string;
  duration: number;
  hostName: string;
}

interface ConferenceUpdateBody {
  title?: string;
  description?: string;
  scheduledAt?: string;
  duration?: number;
  hostName?: string;
  status?: 'scheduled' | 'active' | 'completed' | 'cancelled';
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
    createdAt: conf.createdAt.toISOString(),
  };
}

export async function seedConferences(app: App) {
  try {
    const existing = await app.db.select().from(schema.conferences);
    if (existing.length === 0) {
      const sampleConferences = [
        {
          title: 'Réunion du Bureau Politique',
          description: 'Réunion mensuelle du bureau politique pour discuter des orientations stratégiques du parti.',
          scheduledAt: new Date('2025-08-15T10:00:00Z'),
          duration: 120,
          hostName: 'Dr. Modibo Keïta',
          roomCode: 'ARM001',
          joinUrl: 'https://meet.jit.si/AllianceARM-ARM001',
          status: 'scheduled',
        },
        {
          title: 'Assemblée Générale des Militants',
          description: 'Assemblée générale ouverte à tous les militants pour présenter le bilan des activités.',
          scheduledAt: new Date('2025-09-05T14:00:00Z'),
          duration: 180,
          hostName: 'Mme. Fatoumata Diallo',
          roomCode: 'ARM002',
          joinUrl: 'https://meet.jit.si/AllianceARM-ARM002',
          status: 'scheduled',
        },
        {
          title: 'Conférence de Presse Virtuelle',
          description: 'Conférence de presse en ligne pour présenter le programme électoral de l\'Alliance ARM.',
          scheduledAt: new Date('2025-09-20T09:00:00Z'),
          duration: 90,
          hostName: 'M. Ibrahim Coulibaly',
          roomCode: 'ARM003',
          joinUrl: 'https://meet.jit.si/AllianceARM-ARM003',
          status: 'scheduled',
        },
      ];

      await app.db.insert(schema.conferences).values(sampleConferences);
      app.logger.info({ count: sampleConferences.length }, 'Sample conferences seeded');
    }
  } catch (error) {
    app.logger.error({ err: error }, 'Failed to seed conferences');
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
          200: { type: 'array' },
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
        return result.map(formatConference);
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
          },
          required: ['title', 'scheduledAt', 'duration', 'hostName'],
        },
        response: {
          201: { type: 'object' },
        },
      },
    },
    async (request, reply) => {
      if (!verifyAdminPassword(request, reply)) return;

      const { title, description, scheduledAt, duration, hostName } = request.body;
      const roomCode = generateRoomCode();
      const joinUrl = `https://meet.jit.si/AllianceARM-${roomCode}`;

      app.logger.info({ title, roomCode }, 'Creating conference');

      try {
        const result = await app.db
          .insert(schema.conferences)
          .values({
            title,
            description,
            scheduledAt: new Date(scheduledAt),
            duration,
            hostName,
            roomCode,
            joinUrl,
            status: 'scheduled',
          })
          .returning();

        app.logger.info(
          { conferenceId: result[0].id, roomCode },
          'Conference created successfully'
        );
        reply.status(201);
        return formatConference(result[0]);
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
            status: {
              type: 'string',
              enum: ['scheduled', 'active', 'completed', 'cancelled'],
            },
          },
        },
        response: {
          200: { type: 'object' },
          404: { type: 'object' },
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
        return formatConference(result[0]);
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
          204: {},
          404: { type: 'object' },
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
        reply.status(204);
        return;
      } catch (error) {
        app.logger.error({ err: error, conferenceId: id }, 'Failed to delete conference');
        throw error;
      }
    }
  );
}
