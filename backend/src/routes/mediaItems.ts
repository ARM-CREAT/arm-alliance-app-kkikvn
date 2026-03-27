import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { eq, desc } from 'drizzle-orm';
import * as schema from '../db/schema.js';
import type { App } from '../index.js';

interface CreateMediaItemBody {
  title: string;
  description?: string;
  type: 'photo' | 'video';
  url: string;
  thumbnail_url?: string;
  created_by?: string;
}

/**
 * Validate admin token from Authorization header
 * Checks app_settings table for admin_token match
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
  // GET /api/media - List all media items
  fastify.get<{ Querystring: { type?: string } }>(
    '/api/media',
    {
      schema: {
        description: 'Get all media items (photos and videos)',
        tags: ['media'],
        querystring: {
          type: 'object',
          properties: {
            type: { type: 'string', enum: ['photo', 'video'], description: 'Filter by type' },
          },
        },
        response: {
          200: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                title: { type: 'string' },
                description: { type: 'string' },
                type: { type: 'string' },
                url: { type: 'string' },
                thumbnail_url: { type: 'string' },
                created_by: { type: 'string' },
                created_at: { type: 'string', format: 'date-time' },
              },
            },
          },
        },
      },
    },
    async (request: FastifyRequest<{ Querystring: { type?: string } }>, reply: FastifyReply) => {
      app.logger.info({ type: request.query.type }, 'Fetching media items');

      try {
        let items: typeof schema.mediaItems.$inferSelect[];

        if (request.query.type && ['photo', 'video'].includes(request.query.type)) {
          items = await app.db
            .select()
            .from(schema.mediaItems)
            .where(eq(schema.mediaItems.type, request.query.type))
            .orderBy(desc(schema.mediaItems.createdAt));
        } else {
          items = await app.db
            .select()
            .from(schema.mediaItems)
            .orderBy(desc(schema.mediaItems.createdAt));
        }

        app.logger.info({ count: items.length }, 'Media items retrieved');

        return items.map(item => ({
          id: item.id,
          title: item.title,
          description: item.description,
          type: item.type,
          url: item.url,
          thumbnail_url: item.thumbnailUrl,
          created_by: item.createdBy,
          created_at: item.createdAt.toISOString(),
        }));
      } catch (error) {
        app.logger.error({ err: error }, 'Failed to fetch media items');
        reply.status(500);
        return { error: 'Failed to fetch media items' };
      }
    }
  );

  // POST /api/media - Create new media item (admin only)
  fastify.post<{ Body: CreateMediaItemBody }>(
    '/api/media',
    {
      schema: {
        description: 'Create a new media item (admin only)',
        tags: ['media'],
        body: {
          type: 'object',
          required: ['title', 'type', 'url'],
          properties: {
            title: { type: 'string' },
            description: { type: 'string' },
            type: { type: 'string', enum: ['photo', 'video'] },
            url: { type: 'string' },
            thumbnail_url: { type: 'string' },
            created_by: { type: 'string' },
          },
        },
        response: {
          201: { type: 'object' },
          401: { type: 'object', properties: { error: { type: 'string' } } },
          500: { type: 'object', properties: { error: { type: 'string' } } },
        },
      },
    },
    async (request: FastifyRequest<{ Body: CreateMediaItemBody }>, reply: FastifyReply) => {
      const isAdmin = await validateAdminToken(app, request);
      if (!isAdmin) {
        app.logger.warn('Unauthorized media creation attempt');
        reply.status(401);
        return { error: 'Unauthorized' };
      }

      const { title, description, type, url, thumbnail_url, created_by } = request.body;

      app.logger.info({ title, type }, 'Creating media item');

      try {
        const result = await app.db
          .insert(schema.mediaItems)
          .values({
            title,
            description,
            type: type as 'photo' | 'video',
            url,
            thumbnailUrl: thumbnail_url,
            createdBy: created_by,
            createdAt: new Date(),
          })
          .returning();

        app.logger.info({ mediaId: result[0].id }, 'Media item created');

        reply.status(201);
        return {
          id: result[0].id,
          title: result[0].title,
          type: result[0].type,
          url: result[0].url,
          created_at: result[0].createdAt.toISOString(),
        };
      } catch (error) {
        app.logger.error({ err: error }, 'Failed to create media item');
        reply.status(500);
        return { error: 'Failed to create media item' };
      }
    }
  );

  // DELETE /api/media/:id - Delete media item (admin only)
  fastify.delete<{ Params: { id: string } }>(
    '/api/media/:id',
    {
      schema: {
        description: 'Delete a media item (admin only)',
        tags: ['media'],
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
        app.logger.warn('Unauthorized media deletion attempt');
        reply.status(401);
        return { error: 'Unauthorized' };
      }

      const { id } = request.params;

      app.logger.info({ mediaId: id }, 'Deleting media item');

      try {
        const result = await app.db
          .delete(schema.mediaItems)
          .where(eq(schema.mediaItems.id, id))
          .returning();

        if (result.length === 0) {
          app.logger.info({ mediaId: id }, 'Media item not found');
          reply.status(404);
          return { error: 'Media item not found' };
        }

        app.logger.info({ mediaId: id }, 'Media item deleted');
        return { success: true };
      } catch (error) {
        app.logger.error({ err: error, mediaId: id }, 'Failed to delete media item');
        reply.status(500);
        return { error: 'Failed to delete media item' };
      }
    }
  );
}

export async function seedMediaItems(app: App) {
  try {
    const existing = await app.db.select().from(schema.mediaItems);

    if (existing.length === 0) {
      app.logger.info('Seeding media_items table');

      const seedData = [
        {
          title: 'Rassemblement National ARM',
          description: 'Photos du grand rassemblement',
          type: 'photo' as const,
          url: 'https://picsum.photos/seed/arm1/800/600',
          thumbnailUrl: null,
          createdBy: 'admin',
          createdAt: new Date(),
        },
        {
          title: 'Congrès ARM Bamako 2024',
          description: 'Congrès annuel du parti',
          type: 'photo' as const,
          url: 'https://picsum.photos/seed/arm2/800/600',
          thumbnailUrl: null,
          createdBy: 'admin',
          createdAt: new Date(),
        },
        {
          title: 'Réunion des militants',
          description: 'Réunion régionale des militants ARM',
          type: 'photo' as const,
          url: 'https://picsum.photos/seed/arm3/800/600',
          thumbnailUrl: null,
          createdBy: 'admin',
          createdAt: new Date(),
        },
        {
          title: 'Discours du Président ARM',
          description: 'Discours officiel du président',
          type: 'video' as const,
          url: 'https://www.w3schools.com/html/mov_bbb.mp4',
          thumbnailUrl: 'https://picsum.photos/seed/armv1/800/600',
          createdBy: 'admin',
          createdAt: new Date(),
        },
        {
          title: 'Conférence de Presse ARM',
          description: 'Conférence de presse nationale',
          type: 'video' as const,
          url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
          thumbnailUrl: 'https://picsum.photos/seed/armv2/800/600',
          createdBy: 'admin',
          createdAt: new Date(),
        },
        {
          title: 'Meeting ARM Sikasso',
          description: 'Meeting politique à Sikasso',
          type: 'video' as const,
          url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
          thumbnailUrl: 'https://picsum.photos/seed/armv3/800/600',
          createdBy: 'admin',
          createdAt: new Date(),
        },
      ];

      for (const item of seedData) {
        await app.db.insert(schema.mediaItems).values(item);
      }

      app.logger.info({ count: seedData.length }, 'Media items seeded');
    }
  } catch (error) {
    app.logger.error({ err: error }, 'Failed to seed media items');
  }
}
