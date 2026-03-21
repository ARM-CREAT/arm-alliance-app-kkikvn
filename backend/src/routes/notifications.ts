import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { eq, and, desc } from 'drizzle-orm';
import * as schema from '../db/schema.js';
import type { App } from '../index.js';

interface CreateNotificationBody {
  title: string;
  content?: string;
  body?: string;
  type: 'public' | 'militants' | 'all';
  category: 'actualite' | 'evenement' | 'annonce' | 'urgent';
  imageUrl?: string;
  isPublished?: boolean;
  published?: boolean;
  publishedAt?: string;
  createdBy?: string;
}

interface UpdateNotificationBody {
  title?: string;
  content?: string;
  body?: string;
  type?: 'public' | 'militants' | 'all';
  category?: 'actualite' | 'evenement' | 'annonce' | 'urgent';
  imageUrl?: string;
  isPublished?: boolean;
  published?: boolean;
  publishedAt?: string;
}

function formatNotification(notif: any, includePublished: boolean = false) {
  const formatted: any = {
    id: notif.id,
    title: notif.title,
    content: notif.content,
    body: notif.body || notif.content, // Alias for content
    type: notif.type,
    category: notif.category,
    imageUrl: notif.imageUrl || null,
    createdAt: notif.createdAt instanceof Date ? notif.createdAt.toISOString() : new Date(notif.createdAt).toISOString(),
  };

  if (includePublished) {
    formatted.isPublished = notif.isPublished;
    formatted.published = notif.isPublished; // Alias for isPublished
    formatted.publishedAt = notif.publishedAt instanceof Date ? notif.publishedAt.toISOString() : (notif.publishedAt ? new Date(notif.publishedAt).toISOString() : null);
    formatted.updatedAt = notif.updatedAt instanceof Date ? notif.updatedAt.toISOString() : new Date(notif.updatedAt).toISOString();
  }

  return formatted;
}

export async function seedNotifications(app: App) {
  app.logger.info('Checking notifications table for seeding');
  try {
    const existing = await app.db.select().from(schema.notifications).limit(1);
    if (existing.length > 0) {
      app.logger.info('Notifications table already has data, skipping seed');
      return;
    }

    const sampleNotifications = [
      {
        title: 'Bienvenue sur Alliance ARM',
        content: 'Bienvenue sur l\'application officielle du parti Alliance ARM. Restez informé de toutes nos activités.',
        body: 'Bienvenue sur l\'application officielle du parti Alliance ARM. Restez informé de toutes nos activités.',
        type: 'public',
        category: 'general',
        isPublished: true,
        publishedAt: new Date(),
      },
      {
        title: 'Rassemblement National - Bamako',
        content: 'Un grand rassemblement national aura lieu à Bamako le 15 avril 2024. Tous les membres sont invités.',
        body: 'Un grand rassemblement national aura lieu à Bamako le 15 avril 2024. Tous les membres sont invités.',
        type: 'all',
        category: 'evenements',
        isPublished: true,
        publishedAt: new Date(),
      },
      {
        title: 'Mise à jour des cotisations',
        content: 'Les cotisations pour l\'année 2024 sont maintenant ouvertes. Veuillez vous acquitter de vos cotisations.',
        body: 'Les cotisations pour l\'année 2024 sont maintenant ouvertes. Veuillez vous acquitter de vos cotisations.',
        type: 'militants',
        category: 'cotisations',
        isPublished: false,
      },
    ];

    await app.db.insert(schema.notifications).values(sampleNotifications);
    app.logger.info({ count: sampleNotifications.length }, 'Notifications seeded successfully');
  } catch (error) {
    app.logger.error({ err: error }, 'Failed to seed notifications');
    throw error;
  }
}

export function register(app: App, fastify: FastifyInstance) {
  const requireAuth = app.requireAuth();

  // GET /api/notifications - Get notifications (public, with optional published filter)
  fastify.get(
    '/api/notifications',
    {
      schema: {
        description: 'Get notifications with optional filters',
        tags: ['notifications'],
        querystring: {
          type: 'object',
          properties: {
            published: { type: 'string', enum: ['true', 'false'] },
            type: { type: 'string', enum: ['public', 'militants', 'all'] },
            category: { type: 'string', enum: ['actualite', 'evenement', 'annonce', 'urgent'] },
          },
        },
        response: {
          200: { type: 'object' },
        },
      },
    },
    async (request, reply) => {
      const { published, type, category } = request.query as { published?: string; type?: string; category?: string };
      app.logger.info({ published, type, category }, 'Fetching notifications');

      try {
        const conditions: any[] = [];

        // If published param is provided, filter by it; otherwise default to published only
        if (published !== undefined) {
          conditions.push(eq(schema.notifications.isPublished, published === 'true'));
        } else {
          conditions.push(eq(schema.notifications.isPublished, true));
        }

        if (type) conditions.push(eq(schema.notifications.type, type));
        if (category) conditions.push(eq(schema.notifications.category, category));

        const result = await app.db
          .select()
          .from(schema.notifications)
          .where(and(...conditions))
          .orderBy(desc(schema.notifications.createdAt));

        app.logger.info({ count: result.length }, 'Notifications fetched successfully');
        return {
          notifications: result.map((n: any) => formatNotification(n, true)),
        };
      } catch (error) {
        app.logger.error({ err: error }, 'Failed to fetch notifications');
        throw error;
      }
    }
  );

  // GET /api/notifications/:id - Get single notification (public)
  fastify.get<{ Params: { id: string } }>(
    '/api/notifications/:id',
    {
      schema: {
        description: 'Get a single notification by ID',
        tags: ['notifications'],
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
      app.logger.info({ notificationId: id }, 'Fetching notification');

      try {
        const result = await app.db
          .select()
          .from(schema.notifications)
          .where(eq(schema.notifications.id, id as any));

        if (result.length === 0) {
          reply.status(404);
          return { error: 'Notification not found' };
        }

        app.logger.info({ notificationId: id }, 'Notification fetched');
        return {
          notification: formatNotification(result[0], true),
        };
      } catch (error) {
        app.logger.error({ err: error, notificationId: id }, 'Failed to fetch notification');
        throw error;
      }
    }
  );

  // GET /api/admin/notifications - Get all notifications (admin)
  fastify.get(
    '/api/admin/notifications',
    {
      schema: {
        description: 'Get all notifications (admin only)',
        tags: ['admin', 'notifications'],
        response: {
          200: { type: 'object' },
          401: { type: 'object' },
        },
      },
    },
    async (request, reply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      app.logger.info({ userId: session.user.id }, 'Fetching all notifications (admin)');

      try {
        const result = await app.db
          .select()
          .from(schema.notifications)
          .orderBy(desc(schema.notifications.createdAt));

        app.logger.info({ count: result.length }, 'All notifications fetched successfully');
        return {
          notifications: result.map((n: any) => formatNotification(n, true)),
        };
      } catch (error) {
        app.logger.error({ err: error }, 'Failed to fetch notifications');
        throw error;
      }
    }
  );

  // POST /api/notifications - Create notification (public)
  fastify.post<{ Body: CreateNotificationBody }>(
    '/api/notifications',
    {
      schema: {
        description: 'Create notification',
        tags: ['notifications'],
        body: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            content: { type: 'string' },
            body: { type: 'string' },
            type: { type: 'string', enum: ['public', 'militants', 'all'] },
            category: { type: 'string', enum: ['actualite', 'evenement', 'annonce', 'urgent'] },
            imageUrl: { type: 'string' },
            isPublished: { type: 'boolean' },
            published: { type: 'boolean' },
            publishedAt: { type: 'string' },
            createdBy: { type: 'string' },
          },
          required: ['title', 'type', 'category'],
        },
        response: {
          201: { type: 'object' },
        },
      },
    },
    async (request, reply) => {
      const { title, content, body, type, category, imageUrl, isPublished, published, publishedAt, createdBy } = request.body as CreateNotificationBody;
      const finalContent = content || body || '';
      const finalPublished = published !== undefined ? published : (isPublished !== undefined ? isPublished : false);
      let finalPublishedAt: Date | null = null;

      if (publishedAt) {
        finalPublishedAt = new Date(publishedAt);
      } else if (finalPublished) {
        finalPublishedAt = new Date();
      }

      app.logger.info({ title }, 'Creating notification');

      try {
        const result = await app.db
          .insert(schema.notifications)
          .values({
            title,
            content: finalContent,
            body: finalContent,
            type,
            category,
            imageUrl: imageUrl || null,
            isPublished: finalPublished,
            publishedAt: finalPublishedAt,
            createdBy: createdBy || null,
          })
          .returning();

        reply.status(201);
        app.logger.info({ notificationId: result[0].id }, 'Notification created successfully');
        return {
          notification: formatNotification(result[0], true),
        };
      } catch (error) {
        app.logger.error({ err: error }, 'Failed to create notification');
        throw error;
      }
    }
  );

  // POST /api/admin/notifications - Create notification (admin)
  fastify.post<{ Body: CreateNotificationBody }>(
    '/api/admin/notifications',
    {
      schema: {
        description: 'Create notification (admin only)',
        tags: ['admin', 'notifications'],
        body: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            content: { type: 'string' },
            body: { type: 'string' },
            type: { type: 'string', enum: ['public', 'militants', 'all'] },
            category: { type: 'string', enum: ['actualite', 'evenement', 'annonce', 'urgent'] },
            imageUrl: { type: 'string' },
            isPublished: { type: 'boolean' },
            published: { type: 'boolean' },
            publishedAt: { type: 'string' },
          },
          required: ['title', 'type', 'category'],
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

      const { title, content, body, type, category, imageUrl, isPublished, published, publishedAt } = request.body as CreateNotificationBody;
      const finalContent = content || body || '';
      const finalPublished = published !== undefined ? published : (isPublished !== undefined ? isPublished : false);
      let finalPublishedAt: Date | null = null;

      if (publishedAt) {
        finalPublishedAt = new Date(publishedAt);
      } else if (finalPublished) {
        finalPublishedAt = new Date();
      }

      app.logger.info({ userId: session.user.id, title }, 'Creating notification (admin)');

      try {
        const result = await app.db
          .insert(schema.notifications)
          .values({
            title,
            content: finalContent,
            body: finalContent,
            type,
            category,
            imageUrl: imageUrl || null,
            isPublished: finalPublished,
            publishedAt: finalPublishedAt,
            createdBy: session.user.id,
          })
          .returning();

        reply.status(201);
        app.logger.info({ notificationId: result[0].id }, 'Notification created successfully (admin)');
        return {
          notification: formatNotification(result[0], true),
        };
      } catch (error) {
        app.logger.error({ err: error, userId: session.user.id }, 'Failed to create notification');
        throw error;
      }
    }
  );

  // PUT /api/notifications/:id - Update notification (public)
  fastify.put<{ Params: { id: string }; Body: UpdateNotificationBody }>(
    '/api/notifications/:id',
    {
      schema: {
        description: 'Update notification',
        tags: ['notifications'],
        params: {
          type: 'object',
          properties: { id: { type: 'string', format: 'uuid' } },
        },
        body: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            content: { type: 'string' },
            body: { type: 'string' },
            type: { type: 'string', enum: ['public', 'militants', 'all'] },
            category: { type: 'string', enum: ['actualite', 'evenement', 'annonce', 'urgent'] },
            imageUrl: { type: 'string' },
            isPublished: { type: 'boolean' },
            published: { type: 'boolean' },
            publishedAt: { type: 'string' },
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
      const updates: any = { updatedAt: new Date() };

      const body = request.body as UpdateNotificationBody;
      if (body.title !== undefined) updates.title = body.title;
      if (body.content !== undefined) updates.content = body.content;
      if (body.body !== undefined) updates.body = body.body;
      if (body.type !== undefined) updates.type = body.type;
      if (body.category !== undefined) updates.category = body.category;
      if (body.imageUrl !== undefined) updates.imageUrl = body.imageUrl || null;

      const finalPublished = body.published !== undefined ? body.published : body.isPublished;
      if (finalPublished !== undefined) {
        updates.isPublished = finalPublished;
        if (finalPublished && !body.publishedAt) {
          updates.publishedAt = new Date();
        }
      }
      if (body.publishedAt !== undefined) updates.publishedAt = body.publishedAt ? new Date(body.publishedAt) : null;

      app.logger.info({ notificationId: id }, 'Updating notification');

      try {
        const result = await app.db
          .update(schema.notifications)
          .set(updates)
          .where(eq(schema.notifications.id, id as any))
          .returning();

        if (result.length === 0) {
          reply.status(404);
          return { error: 'Notification not found' };
        }

        app.logger.info({ notificationId: id }, 'Notification updated successfully');
        return {
          notification: formatNotification(result[0], true),
        };
      } catch (error) {
        app.logger.error({ err: error, notificationId: id }, 'Failed to update notification');
        throw error;
      }
    }
  );

  // PATCH /api/admin/notifications/:id - Update notification (admin)
  fastify.patch<{ Params: { id: string }; Body: UpdateNotificationBody }>(
    '/api/admin/notifications/:id',
    {
      schema: {
        description: 'Update notification (admin only)',
        tags: ['admin', 'notifications'],
        params: {
          type: 'object',
          properties: { id: { type: 'string', format: 'uuid' } },
        },
        body: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            content: { type: 'string' },
            body: { type: 'string' },
            type: { type: 'string', enum: ['public', 'militants', 'all'] },
            category: { type: 'string', enum: ['actualite', 'evenement', 'annonce', 'urgent'] },
            imageUrl: { type: 'string' },
            isPublished: { type: 'boolean' },
            published: { type: 'boolean' },
            publishedAt: { type: 'string' },
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

      const { id } = request.params;
      const updates: any = { updatedAt: new Date() };

      const body = request.body as UpdateNotificationBody;
      if (body.title !== undefined) updates.title = body.title;
      if (body.content !== undefined) updates.content = body.content;
      if (body.body !== undefined) updates.body = body.body;
      if (body.type !== undefined) updates.type = body.type;
      if (body.category !== undefined) updates.category = body.category;
      if (body.imageUrl !== undefined) updates.imageUrl = body.imageUrl || null;

      const finalPublished = body.published !== undefined ? body.published : body.isPublished;
      if (finalPublished !== undefined) {
        updates.isPublished = finalPublished;
        if (finalPublished && !body.publishedAt) {
          updates.publishedAt = new Date();
        }
      }
      if (body.publishedAt !== undefined) updates.publishedAt = body.publishedAt ? new Date(body.publishedAt) : null;

      app.logger.info({ userId: session.user.id, notificationId: id }, 'Updating notification (admin)');

      try {
        const result = await app.db
          .update(schema.notifications)
          .set(updates)
          .where(eq(schema.notifications.id, id as any))
          .returning();

        if (result.length === 0) {
          reply.status(404);
          return { error: 'Notification not found' };
        }

        app.logger.info({ notificationId: id }, 'Notification updated successfully (admin)');
        return {
          notification: formatNotification(result[0], true),
        };
      } catch (error) {
        app.logger.error({ err: error, userId: session.user.id }, 'Failed to update notification');
        throw error;
      }
    }
  );

  // DELETE /api/notifications/:id - Delete notification (public)
  fastify.delete<{ Params: { id: string } }>(
    '/api/notifications/:id',
    {
      schema: {
        description: 'Delete notification',
        tags: ['notifications'],
        params: {
          type: 'object',
          properties: { id: { type: 'string', format: 'uuid' } },
        },
        response: {
          204: { type: 'null' },
          404: { type: 'object' },
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params;
      app.logger.info({ notificationId: id }, 'Deleting notification');

      try {
        const result = await app.db
          .delete(schema.notifications)
          .where(eq(schema.notifications.id, id as any))
          .returning();

        if (result.length === 0) {
          reply.status(404);
          return { error: 'Notification not found' };
        }

        reply.status(204);
        app.logger.info({ notificationId: id }, 'Notification deleted successfully');
      } catch (error) {
        app.logger.error({ err: error, notificationId: id }, 'Failed to delete notification');
        throw error;
      }
    }
  );

  // DELETE /api/admin/notifications/:id - Delete notification (admin)
  fastify.delete<{ Params: { id: string } }>(
    '/api/admin/notifications/:id',
    {
      schema: {
        description: 'Delete notification (admin only)',
        tags: ['admin', 'notifications'],
        params: {
          type: 'object',
          properties: { id: { type: 'string', format: 'uuid' } },
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

      const { id } = request.params;
      app.logger.info({ userId: session.user.id, notificationId: id }, 'Deleting notification (admin)');

      try {
        const result = await app.db
          .delete(schema.notifications)
          .where(eq(schema.notifications.id, id as any))
          .returning();

        if (result.length === 0) {
          reply.status(404);
          return { error: 'Notification not found' };
        }

        app.logger.info({ notificationId: id }, 'Notification deleted successfully (admin)');
        return { success: true };
      } catch (error) {
        app.logger.error({ err: error, userId: session.user.id }, 'Failed to delete notification');
        throw error;
      }
    }
  );

  // POST /api/notifications/:id/publish - Publish notification (public)
  fastify.post<{ Params: { id: string } }>(
    '/api/notifications/:id/publish',
    {
      schema: {
        description: 'Publish a notification',
        tags: ['notifications'],
        params: {
          type: 'object',
          properties: { id: { type: 'string', format: 'uuid' } },
        },
        response: {
          200: { type: 'object' },
          404: { type: 'object' },
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params;
      app.logger.info({ notificationId: id }, 'Publishing notification');

      try {
        const result = await app.db
          .update(schema.notifications)
          .set({
            isPublished: true,
            publishedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(schema.notifications.id, id as any))
          .returning();

        if (result.length === 0) {
          reply.status(404);
          return { error: 'Notification not found' };
        }

        app.logger.info({ notificationId: id }, 'Notification published successfully');
        return {
          notification: formatNotification(result[0], true),
        };
      } catch (error) {
        app.logger.error({ err: error, notificationId: id }, 'Failed to publish notification');
        throw error;
      }
    }
  );

  // POST /api/notifications/:id/unpublish - Unpublish notification (public)
  fastify.post<{ Params: { id: string } }>(
    '/api/notifications/:id/unpublish',
    {
      schema: {
        description: 'Unpublish a notification',
        tags: ['notifications'],
        params: {
          type: 'object',
          properties: { id: { type: 'string', format: 'uuid' } },
        },
        response: {
          200: { type: 'object' },
          404: { type: 'object' },
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params;
      app.logger.info({ notificationId: id }, 'Unpublishing notification');

      try {
        const result = await app.db
          .update(schema.notifications)
          .set({
            isPublished: false,
            updatedAt: new Date(),
          })
          .where(eq(schema.notifications.id, id as any))
          .returning();

        if (result.length === 0) {
          reply.status(404);
          return { error: 'Notification not found' };
        }

        app.logger.info({ notificationId: id }, 'Notification unpublished successfully');
        return {
          notification: formatNotification(result[0], true),
        };
      } catch (error) {
        app.logger.error({ err: error, notificationId: id }, 'Failed to unpublish notification');
        throw error;
      }
    }
  );
}
