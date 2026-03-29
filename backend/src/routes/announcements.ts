import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { eq, desc } from 'drizzle-orm';
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
            items: { type: 'object' },
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
          content: a.body, // Map body column to content field
          created_at: a.createdAt.toISOString(),
        }));
      } catch (error) {
        app.logger.error({ err: error }, 'Failed to fetch announcements');
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
          title: 'Réunion du bureau exécutif',
          body: "Le bureau exécutif de l'Alliance ARM se réunira le 15 du mois prochain. Tous les membres du bureau sont priés d'être présents.",
          priority: 'high',
          published: true,
          createdAt: now,
          updatedAt: now,
        },
        {
          title: 'Collecte de cotisations',
          body: 'La période de collecte des cotisations annuelles est ouverte. Les membres sont invités à régulariser leur situation avant la fin du mois.',
          priority: 'normal',
          published: true,
          createdAt: now,
          updatedAt: now,
        },
        {
          title: 'Journée de solidarité',
          body: "L'Alliance ARM organise une journée de solidarité en faveur des populations vulnérables. Votre participation est la bienvenue.",
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
