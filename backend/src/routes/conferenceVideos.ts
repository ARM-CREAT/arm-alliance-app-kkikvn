import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { eq, desc } from 'drizzle-orm';
import * as schema from '../db/schema.js';
import type { App } from '../index.js';

interface CreateConferenceVideoBody {
  title: string;
  description?: string;
  video_url: string;
  thumbnail_url?: string;
  speaker?: string;
  duration?: string;
  event_date?: string;
}

/**
 * Validate admin token from Authorization header
 */
async function validateAdminToken(app: App, request: FastifyRequest): Promise<boolean> {
  try {
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return false;
    }

    const token = authHeader.substring(7);
    const result = await app.db
      .select()
      .from(schema.appSettings)
      .where(eq(schema.appSettings.key, 'admin_token'));

    if (result.length === 0) {
      return false;
    }

    return result[0].value === token;
  } catch (error) {
    return false;
  }
}

export function register(app: App, fastify: FastifyInstance) {
  // GET /api/conference-videos - List all conference videos
  fastify.get(
    '/api/conference-videos',
    {
      schema: {
        description: 'Get all conference videos',
        tags: ['conference'],
        response: {
          200: {
            type: 'array',
            items: { type: 'object' },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      app.logger.info('Fetching conference videos');

      try {
        const videos = await app.db
          .select()
          .from(schema.conferenceVideos)
          .orderBy(desc(schema.conferenceVideos.eventDate));

        app.logger.info({ count: videos.length }, 'Conference videos retrieved');

        return videos.map(v => ({
          id: v.id,
          title: v.title,
          description: v.description,
          video_url: v.videoUrl,
          thumbnail_url: v.thumbnailUrl,
          speaker: v.speaker,
          duration: v.duration,
          event_date: v.eventDate,
          created_at: v.createdAt.toISOString(),
        }));
      } catch (error) {
        app.logger.error({ err: error }, 'Failed to fetch conference videos');
        reply.status(500);
        return { error: 'Failed to fetch conference videos' };
      }
    }
  );

  // GET /api/conference-videos/:id - Get single conference video
  fastify.get<{ Params: { id: string } }>(
    '/api/conference-videos/:id',
    {
      schema: {
        description: 'Get a conference video by ID',
        tags: ['conference'],
        params: {
          type: 'object',
          required: ['id'],
          properties: { id: { type: 'string', format: 'uuid' } },
        },
        response: {
          200: { type: 'object' },
          404: { type: 'object', properties: { error: { type: 'string' } } },
        },
      },
    },
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const { id } = request.params;

      app.logger.info({ videoId: id }, 'Fetching conference video');

      try {
        const result = await app.db
          .select()
          .from(schema.conferenceVideos)
          .where(eq(schema.conferenceVideos.id, id));

        if (result.length === 0) {
          app.logger.info({ videoId: id }, 'Conference video not found');
          reply.status(404);
          return { error: 'Conference video not found' };
        }

        const v = result[0];
        return {
          id: v.id,
          title: v.title,
          description: v.description,
          video_url: v.videoUrl,
          thumbnail_url: v.thumbnailUrl,
          speaker: v.speaker,
          duration: v.duration,
          event_date: v.eventDate,
          created_at: v.createdAt.toISOString(),
        };
      } catch (error) {
        app.logger.error({ err: error, videoId: id }, 'Failed to fetch conference video');
        reply.status(500);
        return { error: 'Failed to fetch conference video' };
      }
    }
  );

  // POST /api/conference-videos - Create conference video (admin only)
  fastify.post<{ Body: CreateConferenceVideoBody }>(
    '/api/conference-videos',
    {
      schema: {
        description: 'Create a new conference video (admin only)',
        tags: ['conference'],
        body: {
          type: 'object',
          required: ['title', 'video_url'],
          properties: {
            title: { type: 'string' },
            description: { type: 'string' },
            video_url: { type: 'string' },
            thumbnail_url: { type: 'string' },
            speaker: { type: 'string' },
            duration: { type: 'string' },
            event_date: { type: 'string' },
          },
        },
        response: {
          201: { type: 'object' },
          401: { type: 'object', properties: { error: { type: 'string' } } },
          500: { type: 'object', properties: { error: { type: 'string' } } },
        },
      },
    },
    async (request: FastifyRequest<{ Body: CreateConferenceVideoBody }>, reply: FastifyReply) => {
      const isAdmin = await validateAdminToken(app, request);
      if (!isAdmin) {
        app.logger.warn('Unauthorized conference video creation attempt');
        reply.status(401);
        return { error: 'Unauthorized' };
      }

      const { title, description, video_url, thumbnail_url, speaker, duration, event_date } = request.body;

      app.logger.info({ title }, 'Creating conference video');

      try {
        const result = await app.db
          .insert(schema.conferenceVideos)
          .values({
            title,
            description,
            videoUrl: video_url,
            thumbnailUrl: thumbnail_url,
            speaker,
            duration,
            eventDate: event_date,
            createdAt: new Date(),
          })
          .returning();

        app.logger.info({ videoId: result[0].id }, 'Conference video created');

        reply.status(201);
        return {
          id: result[0].id,
          title: result[0].title,
          video_url: result[0].videoUrl,
          created_at: result[0].createdAt.toISOString(),
        };
      } catch (error) {
        app.logger.error({ err: error }, 'Failed to create conference video');
        reply.status(500);
        return { error: 'Failed to create conference video' };
      }
    }
  );

  // DELETE /api/conference-videos/:id - Delete conference video (admin only)
  fastify.delete<{ Params: { id: string } }>(
    '/api/conference-videos/:id',
    {
      schema: {
        description: 'Delete a conference video (admin only)',
        tags: ['conference'],
        params: {
          type: 'object',
          required: ['id'],
          properties: { id: { type: 'string', format: 'uuid' } },
        },
        response: {
          200: { type: 'object', properties: { success: { type: 'boolean' } } },
          401: { type: 'object', properties: { error: { type: 'string' } } },
          404: { type: 'object', properties: { error: { type: 'string' } } },
          500: { type: 'object', properties: { error: { type: 'string' } } },
        },
      },
    },
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const isAdmin = await validateAdminToken(app, request);
      if (!isAdmin) {
        app.logger.warn('Unauthorized conference video deletion attempt');
        reply.status(401);
        return { error: 'Unauthorized' };
      }

      const { id } = request.params;

      app.logger.info({ videoId: id }, 'Deleting conference video');

      try {
        const result = await app.db
          .delete(schema.conferenceVideos)
          .where(eq(schema.conferenceVideos.id, id))
          .returning();

        if (result.length === 0) {
          app.logger.info({ videoId: id }, 'Conference video not found');
          reply.status(404);
          return { error: 'Conference video not found' };
        }

        app.logger.info({ videoId: id }, 'Conference video deleted');
        return { success: true };
      } catch (error) {
        app.logger.error({ err: error, videoId: id }, 'Failed to delete conference video');
        reply.status(500);
        return { error: 'Failed to delete conference video' };
      }
    }
  );
}

export async function seedConferenceVideos(app: App) {
  try {
    const existing = await app.db.select().from(schema.conferenceVideos);

    if (existing.length === 0) {
      app.logger.info('Seeding conference_videos table');

      const seedData = [
        {
          title: 'Conférence Nationale ARM 2024',
          description: 'Conférence nationale annuelle du parti Alliance pour la République du Mali',
          videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
          thumbnailUrl: 'https://picsum.photos/seed/conf1/800/600',
          speaker: 'Dr. Moussa Coulibaly',
          duration: '1h 23min',
          eventDate: '2024-03-15',
          createdAt: new Date(),
        },
        {
          title: 'Discours du Président - Journée Nationale',
          description: 'Allocution officielle du président lors de la journée nationale ARM',
          videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
          thumbnailUrl: 'https://picsum.photos/seed/conf2/800/600',
          speaker: 'Président Ibrahim Diallo',
          duration: '45min',
          eventDate: '2024-06-20',
          createdAt: new Date(),
        },
        {
          title: 'Forum des Jeunes ARM 2024',
          description: 'Forum national de la jeunesse ARM sur le développement du Mali',
          videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
          thumbnailUrl: 'https://picsum.photos/seed/conf3/800/600',
          speaker: 'Aminata Traoré',
          duration: '2h 05min',
          eventDate: '2024-09-10',
          createdAt: new Date(),
        },
        {
          title: 'Assemblée Générale ARM - Bilan 2024',
          description: 'Assemblée générale annuelle avec bilan des activités et perspectives',
          videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4',
          thumbnailUrl: 'https://picsum.photos/seed/conf4/800/600',
          speaker: 'Secrétaire Général Oumar Keita',
          duration: '1h 47min',
          eventDate: '2024-11-30',
          createdAt: new Date(),
        },
      ];

      for (const video of seedData) {
        await app.db.insert(schema.conferenceVideos).values(video);
      }

      app.logger.info({ count: seedData.length }, 'Conference videos seeded');
    }
  } catch (error) {
    app.logger.error({ err: error }, 'Failed to seed conference videos');
  }
}
