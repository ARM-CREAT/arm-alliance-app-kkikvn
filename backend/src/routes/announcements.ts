import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { eq, desc } from 'drizzle-orm';
import * as schema from '../db/schema.js';
import type { App } from '../index.js';

interface CreateAnnouncementBody {
  title: string;
  body: string;
  priority?: 'normal' | 'urgent';
  published?: boolean;
}

interface UpdateAnnouncementBody {
  title?: string;
  body?: string;
  priority?: 'normal' | 'urgent';
  published?: boolean;
}

function verifyAdminPassword(request: FastifyRequest, reply: FastifyReply): boolean {
  const password = request.headers['x-admin-password'];
  if (!password || password !== 'admin123') {
    reply.status(401);
    return false;
  }
  return true;
}

export function register(app: App, fastify: FastifyInstance) {
  // GET /api/announcements - Get all announcements ordered by created_at DESC
  fastify.get(
    '/api/announcements',
    {
      schema: {
        description: 'Get all announcements',
        tags: ['announcements'],
        response: {
          200: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string', format: 'uuid' },
                title: { type: 'string' },
                body: { type: 'string' },
                priority: { type: 'string' },
                published: { type: 'boolean' },
                created_at: { type: 'string', format: 'date-time' },
                updated_at: { type: 'string', format: 'date-time' },
              },
            },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      app.logger.info('Fetching all announcements');

      try {
        const announcements = await app.db
          .select()
          .from(schema.announcements)
          .orderBy(desc(schema.announcements.createdAt));

        app.logger.info({ count: announcements.length }, 'Announcements retrieved');

        return announcements.map(a => ({
          id: a.id,
          title: a.title,
          body: a.body,
          priority: a.priority,
          published: a.published,
          created_at: a.createdAt.toISOString(),
          updated_at: a.updatedAt.toISOString(),
        }));
      } catch (error) {
        app.logger.error({ err: error }, 'Failed to fetch announcements');
        throw error;
      }
    }
  );

  // GET /api/announcements/:id - Get single announcement
  fastify.get<{ Params: { id: string } }>(
    '/api/announcements/:id',
    {
      schema: {
        description: 'Get an announcement by ID',
        tags: ['announcements'],
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
      app.logger.info({ announcementId: id }, 'Fetching announcement');

      try {
        const announcements = await app.db
          .select()
          .from(schema.announcements)
          .where(eq(schema.announcements.id, id));

        if (announcements.length === 0) {
          app.logger.info({ announcementId: id }, 'Announcement not found');
          reply.status(404);
          return { error: 'Not found' };
        }

        const a = announcements[0];
        return {
          id: a.id,
          title: a.title,
          body: a.body,
          priority: a.priority,
          published: a.published,
          created_at: a.createdAt.toISOString(),
          updated_at: a.updatedAt.toISOString(),
        };
      } catch (error) {
        app.logger.error({ err: error, announcementId: id }, 'Failed to fetch announcement');
        throw error;
      }
    }
  );

  // POST /api/announcements - Create announcement (admin only)
  fastify.post<{ Body: CreateAnnouncementBody }>(
    '/api/announcements',
    {
      schema: {
        description: 'Create announcement (admin only)',
        tags: ['announcements'],
        body: {
          type: 'object',
          required: ['title', 'body'],
          properties: {
            title: { type: 'string' },
            body: { type: 'string' },
            priority: { type: 'string', enum: ['normal', 'urgent'] },
            published: { type: 'boolean' },
          },
        },
        response: {
          201: { type: 'object' },
          400: { type: 'object', properties: { error: { type: 'string' } } },
          401: { type: 'object', properties: { error: { type: 'string' } } },
        },
      },
    },
    async (request: FastifyRequest<{ Body: CreateAnnouncementBody }>, reply: FastifyReply) => {
      if (!verifyAdminPassword(request, reply)) return;

      const { title, body, priority, published } = request.body;

      if (!title || !body) {
        app.logger.warn({ title, body }, 'Missing required fields');
        reply.status(400);
        return { error: 'title and body are required' };
      }

      app.logger.info({ title }, 'Creating announcement');

      try {
        const now = new Date();
        const result = await app.db
          .insert(schema.announcements)
          .values({
            title,
            body,
            priority: priority ?? 'normal',
            published: published ?? false,
            createdAt: now,
            updatedAt: now,
          })
          .returning();

        const announcement = result[0];
        app.logger.info({ announcementId: announcement.id }, 'Announcement created');

        reply.status(201);
        return {
          id: announcement.id,
          title: announcement.title,
          body: announcement.body,
          priority: announcement.priority,
          published: announcement.published,
          created_at: announcement.createdAt.toISOString(),
          updated_at: announcement.updatedAt.toISOString(),
        };
      } catch (error) {
        app.logger.error({ err: error, title }, 'Failed to create announcement');
        throw error;
      }
    }
  );

  // PUT /api/announcements/:id - Update announcement (admin only)
  fastify.put<{ Params: { id: string }; Body: UpdateAnnouncementBody }>(
    '/api/announcements/:id',
    {
      schema: {
        description: 'Update announcement (admin only)',
        tags: ['announcements'],
        params: {
          type: 'object',
          required: ['id'],
          properties: { id: { type: 'string', format: 'uuid' } },
        },
        body: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            body: { type: 'string' },
            priority: { type: 'string', enum: ['normal', 'urgent'] },
            published: { type: 'boolean' },
          },
        },
        response: {
          200: { type: 'object' },
          401: { type: 'object', properties: { error: { type: 'string' } } },
          404: { type: 'object', properties: { error: { type: 'string' } } },
        },
      },
    },
    async (request: FastifyRequest<{ Params: { id: string }; Body: UpdateAnnouncementBody }>, reply: FastifyReply) => {
      if (!verifyAdminPassword(request, reply)) return;

      const { id } = request.params;
      const body = request.body;

      app.logger.info({ announcementId: id }, 'Updating announcement');

      try {
        const updates: any = {};
        if (body.title !== undefined) updates.title = body.title;
        if (body.body !== undefined) updates.body = body.body;
        if (body.priority !== undefined) updates.priority = body.priority;
        if (body.published !== undefined) updates.published = body.published;
        updates.updatedAt = new Date();

        const result = await app.db
          .update(schema.announcements)
          .set(updates)
          .where(eq(schema.announcements.id, id))
          .returning();

        if (result.length === 0) {
          app.logger.info({ announcementId: id }, 'Announcement not found');
          reply.status(404);
          return { error: 'Not found' };
        }

        const announcement = result[0];
        app.logger.info({ announcementId: id }, 'Announcement updated');

        return {
          id: announcement.id,
          title: announcement.title,
          body: announcement.body,
          priority: announcement.priority,
          published: announcement.published,
          created_at: announcement.createdAt.toISOString(),
          updated_at: announcement.updatedAt.toISOString(),
        };
      } catch (error) {
        app.logger.error({ err: error, announcementId: id }, 'Failed to update announcement');
        throw error;
      }
    }
  );

  // DELETE /api/announcements/:id - Delete announcement (admin only)
  fastify.delete<{ Params: { id: string } }>(
    '/api/announcements/:id',
    {
      schema: {
        description: 'Delete announcement (admin only)',
        tags: ['announcements'],
        params: {
          type: 'object',
          required: ['id'],
          properties: { id: { type: 'string', format: 'uuid' } },
        },
        response: {
          200: { type: 'object', properties: { success: { type: 'boolean' } } },
          401: { type: 'object', properties: { error: { type: 'string' } } },
          404: { type: 'object', properties: { error: { type: 'string' } } },
        },
      },
    },
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      if (!verifyAdminPassword(request, reply)) return;

      const { id } = request.params;

      app.logger.info({ announcementId: id }, 'Deleting announcement');

      try {
        const result = await app.db
          .delete(schema.announcements)
          .where(eq(schema.announcements.id, id))
          .returning();

        if (result.length === 0) {
          app.logger.info({ announcementId: id }, 'Announcement not found');
          reply.status(404);
          return { error: 'Not found' };
        }

        app.logger.info({ announcementId: id }, 'Announcement deleted');
        return { success: true };
      } catch (error) {
        app.logger.error({ err: error, announcementId: id }, 'Failed to delete announcement');
        throw error;
      }
    }
  );
}

export async function seedAnnouncements(app: App) {
  try {
    const count = await app.db.select().from(schema.announcements);

    if (count.length === 0) {
      app.logger.info('Seeding announcements');

      const now = new Date();
      const seedData = [
        {
          title: 'Réunion du Bureau Politique',
          body: 'Le Bureau Politique de l\'ARM se réunira le samedi prochain à 10h00 au siège national. Tous les membres du bureau sont priés d\'être présents. Ordre du jour: bilan des activités et planification du prochain trimestre.',
          priority: 'normal',
          published: true,
          createdAt: now,
          updatedAt: now,
        },
        {
          title: 'URGENT: Mobilisation pour le Meeting',
          body: 'Un grand meeting populaire est organisé ce weekend à Bamako. Tous les militants sont appelés à mobiliser massivement. Des bus seront mis à disposition depuis les différentes communes. Contactez votre coordinateur de zone pour les détails.',
          priority: 'urgent',
          published: true,
          createdAt: now,
          updatedAt: now,
        },
        {
          title: 'Formation des Responsables Locaux',
          body: 'Une session de formation est organisée pour tous les responsables locaux de l\'ARM. La formation portera sur les techniques de mobilisation, la communication politique et la gestion des sections locales. Inscription obligatoire avant le 15 du mois.',
          priority: 'normal',
          published: true,
          createdAt: now,
          updatedAt: now,
        },
      ];

      await app.db.insert(schema.announcements).values(seedData);
      app.logger.info({ count: seedData.length }, 'Announcements seeded');
    }
  } catch (error) {
    app.logger.error({ err: error }, 'Failed to seed announcements');
  }
}
