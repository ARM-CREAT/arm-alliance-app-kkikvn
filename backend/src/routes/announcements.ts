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
  // GET /api/announcements - Public endpoint (only published)
  fastify.get(
    '/api/announcements',
    {
      schema: {
        description: 'Get announcements',
        tags: ['announcements'],
        response: {
          200: {
            type: 'object',
            properties: {
              announcements: {
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
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      app.logger.info('Fetching announcements');

      try {
        const announcements = await app.db
          .select()
          .from(schema.announcements)
          .where(eq(schema.announcements.published, true))
          .orderBy(desc(schema.announcements.createdAt));

        app.logger.info({ count: announcements.length }, 'Announcements retrieved');
        return { announcements };
      } catch (error) {
        app.logger.error({ err: error }, 'Failed to fetch announcements');
        throw error;
      }
    }
  );

  // POST /api/announcements - Admin only
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
          201: {
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
          401: {
            type: 'object',
            properties: { error: { type: 'string' } },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      if (!verifyAdminPassword(request, reply)) return;

      const body = request.body as CreateAnnouncementBody;
      const { title, body: bodyText, priority, published } = body;
      app.logger.info({ title }, 'Creating announcement');

      try {
        const result = await app.db
          .insert(schema.announcements)
          .values({
            title,
            body: bodyText,
            priority: priority ?? 'normal',
            published: published ?? true,
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
          created_at: announcement.createdAt,
          updated_at: announcement.updatedAt,
        };
      } catch (error) {
        app.logger.error({ err: error, title }, 'Failed to create announcement');
        throw error;
      }
    }
  );

  // PUT /api/announcements/:id - Admin only
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
          200: {
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
          401: {
            type: 'object',
            properties: { error: { type: 'string' } },
          },
          404: {
            type: 'object',
            properties: { error: { type: 'string' } },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      if (!verifyAdminPassword(request, reply)) return;

      const { id } = request.params as { id: string };
      const updateBody = request.body as UpdateAnnouncementBody;

      app.logger.info({ announcementId: id }, 'Updating announcement');

      try {
        const updates: any = {};
        if (updateBody.title !== undefined) updates.title = updateBody.title;
        if (updateBody.body !== undefined) updates.body = updateBody.body;
        if (updateBody.priority !== undefined) updates.priority = updateBody.priority;
        if (updateBody.published !== undefined) updates.published = updateBody.published;
        updates.updatedAt = new Date();

        const result = await app.db
          .update(schema.announcements)
          .set(updates)
          .where(eq(schema.announcements.id, id))
          .returning();

        if (result.length === 0) {
          reply.status(404);
          return { error: 'Announcement not found' };
        }

        const announcement = result[0];
        app.logger.info({ announcementId: id }, 'Announcement updated');

        return {
          id: announcement.id,
          title: announcement.title,
          body: announcement.body,
          priority: announcement.priority,
          published: announcement.published,
          created_at: announcement.createdAt,
          updated_at: announcement.updatedAt,
        };
      } catch (error) {
        app.logger.error({ err: error, announcementId: id }, 'Failed to update announcement');
        throw error;
      }
    }
  );

  // DELETE /api/announcements/:id - Admin only
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
          200: {
            type: 'object',
            properties: { success: { type: 'boolean' } },
          },
          401: {
            type: 'object',
            properties: { error: { type: 'string' } },
          },
          404: {
            type: 'object',
            properties: { error: { type: 'string' } },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      if (!verifyAdminPassword(request, reply)) return;

      const { id } = request.params as { id: string };

      app.logger.info({ announcementId: id }, 'Deleting announcement');

      try {
        const result = await app.db
          .delete(schema.announcements)
          .where(eq(schema.announcements.id, id))
          .returning();

        if (result.length === 0) {
          reply.status(404);
          return { error: 'Announcement not found' };
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

      const seedData = [
        {
          title: 'Réunion du bureau exécutif',
          body: 'Le bureau exécutif national se réunira le samedi prochain à 9h00 au siège du parti à Bamako. La présence de tous les membres titulaires est obligatoire. Ordre du jour : bilan des activités du trimestre et planification des prochaines échéances électorales.',
          priority: 'normal',
          published: true,
        },
        {
          title: 'URGENT : Mobilisation générale pour le meeting de Bamako',
          body: 'Tous les militants et sympathisants sont appelés à se mobiliser massivement pour le grand meeting national prévu ce dimanche à la Place de l\'Indépendance. Le transport sera assuré depuis les différents quartiers. Soyez présents nombreux pour démontrer la force de notre mouvement.',
          priority: 'urgent',
          published: true,
        },
        {
          title: 'Mise à jour des cotisations 2024',
          body: 'Nous rappelons à tous les membres que les cotisations annuelles pour l\'année 2024 sont dues avant le 31 mars. Les membres à jour recevront leur nouvelle carte d\'adhérent. Contactez votre responsable de section pour effectuer votre paiement.',
          priority: 'normal',
          published: true,
        },
      ];

      await app.db.insert(schema.announcements).values(seedData);
      app.logger.info({ count: seedData.length }, 'Announcements seeded');
    }
  } catch (error) {
    app.logger.error({ err: error }, 'Failed to seed announcements');
  }
}
