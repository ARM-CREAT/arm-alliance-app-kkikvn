import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { eq, desc, count } from 'drizzle-orm';
import * as schema from '../db/schema.js';
import type { App } from '../index.js';

interface CreateAnnouncementBody {
  title: string;
  content: string;
}

interface UpdateAnnouncementBody {
  title?: string;
  content?: string;
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
  // GET /api/announcements - Get published announcements (paginated)
  fastify.get<{ Querystring: { limit?: string; page?: string } }>(
    '/api/announcements',
    {
      schema: {
        description: 'Get published announcements (paginated). Filter by published=true, ordered by created_at DESC.',
        tags: ['announcements'],
        querystring: {
          type: 'object',
          properties: {
            limit: { type: 'string', default: '20', description: 'Items per page (default 20)' },
            page: { type: 'string', default: '1', description: 'Page number (default 1)' },
          },
        },
        response: {
          200: {
            type: 'array',
            items: { type: 'object' },
          },
        },
      },
    },
    async (request: FastifyRequest<{ Querystring: { limit?: string; page?: string } }>, reply: FastifyReply) => {
      const pageLimit = Math.max(1, parseInt(request.query.limit || '20', 10));
      const page = Math.max(1, parseInt(request.query.page || '1', 10));
      const pageOffset = (page - 1) * pageLimit;

      app.logger.info({ limit: pageLimit, page }, 'Fetching announcements');

      try {
        const announcements = await app.db
          .select()
          .from(schema.announcements)
          .where(eq(schema.announcements.published, true))
          .orderBy(desc(schema.announcements.createdAt))
          .limit(pageLimit)
          .offset(pageOffset);

        app.logger.info({ count: announcements.length, page }, 'Announcements retrieved');

        return announcements.map(a => ({
          id: a.id,
          title: a.title,
          content: a.body, // Map body column to content field
          published: a.published,
          created_at: a.createdAt.toISOString(),
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
        description: 'Get a single published announcement by ID',
        tags: ['announcements'],
        params: {
          type: 'object',
          required: ['id'],
          properties: { id: { type: 'string', format: 'uuid' } },
        },
        response: {
          200: { type: 'object' },
          404: { type: 'object' },
        },
      },
    },
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const { id } = request.params;
      app.logger.info({ announcementId: id }, 'Fetching announcement');

      try {
        const result = await app.db
          .select()
          .from(schema.announcements)
          .where(eq(schema.announcements.id, id));

        if (result.length === 0) {
          app.logger.warn({ announcementId: id }, 'Announcement not found');
          reply.status(404);
          return { error: 'Not found' };
        }

        const a = result[0];
        app.logger.info({ announcementId: id }, 'Announcement retrieved');

        return {
          id: a.id,
          title: a.title,
          content: a.body,
          published: a.published,
          created_at: a.createdAt.toISOString(),
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
          required: ['title', 'content'],
          properties: {
            title: { type: 'string' },
            content: { type: 'string' },
          },
        },
        response: {
          201: { type: 'object' },
          401: { type: 'object' },
        },
      },
    },
    async (request: FastifyRequest<{ Body: CreateAnnouncementBody }>, reply: FastifyReply) => {
      if (!verifyAdminPassword(request, reply)) return;

      const { title, content } = request.body;

      app.logger.info({ title }, 'Creating announcement');

      try {
        const now = new Date();
        const result = await app.db
          .insert(schema.announcements)
          .values({
            title,
            body: content, // Store content in body column
            priority: 'normal',
            published: true,
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
          content: announcement.body,
          created_at: announcement.createdAt.toISOString(),
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
            content: { type: 'string' },
          },
        },
        response: {
          200: { type: 'object' },
          401: { type: 'object' },
          404: { type: 'object' },
        },
      },
    },
    async (request: FastifyRequest<{ Params: { id: string }; Body: UpdateAnnouncementBody }>, reply: FastifyReply) => {
      if (!verifyAdminPassword(request, reply)) return;

      const { id } = request.params;
      const { title, content } = request.body;

      app.logger.info({ announcementId: id }, 'Updating announcement');

      try {
        const updates: any = {};
        if (title !== undefined) updates.title = title;
        if (content !== undefined) updates.body = content; // content maps to body column
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
          content: announcement.body,
          created_at: announcement.createdAt.toISOString(),
        };
      } catch (error) {
        app.logger.error({ err: error, announcementId: id }, 'Failed to update announcement');
        throw error;
      }
    }
  );

  // DELETE /api/announcements/:id - Delete announcement (admin only, no body)
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
          200: { type: 'object' },
          401: { type: 'object' },
          404: { type: 'object' },
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
    // Check if already seeded
    const existing = await app.db.select().from(schema.announcements);

    if (existing.length === 0) {
      app.logger.info('Seeding announcements table');

      const now = new Date();
      const seedData = [
        {
          title: 'Ouverture des adhésions 2025',
          body: 'L\'Alliance ARM ouvre officiellement les adhésions pour l\'année 2025. Rejoignez le mouvement et participez à la construction d\'un Mali moderne et prospère. Les inscriptions sont ouvertes dans toutes les régions.',
          priority: 'high',
          published: true,
          createdAt: now,
          updatedAt: now,
        },
        {
          title: 'Réunion du Bureau Politique',
          body: 'Le Bureau Politique de l\'ARM se réunira le 30 juillet 2025 à Bamako pour examiner la situation politique nationale et définir la stratégie du parti pour les prochains mois.',
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
