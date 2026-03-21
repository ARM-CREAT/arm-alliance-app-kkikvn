import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { eq, and, desc } from 'drizzle-orm';
import * as schema from '../db/schema.js';
import type { App } from '../index.js';

interface CreateNotificationBody {
  title: string;
  content: string;
  type: 'public' | 'militants' | 'all';
  category: 'actualite' | 'evenement' | 'annonce' | 'urgent';
  imageUrl?: string;
  isPublished?: boolean;
}

interface UpdateNotificationBody {
  title?: string;
  content?: string;
  type?: 'public' | 'militants' | 'all';
  category?: 'actualite' | 'evenement' | 'annonce' | 'urgent';
  imageUrl?: string;
  isPublished?: boolean;
}

function formatNotification(notif: any, includePublished: boolean = false) {
  const formatted = {
    id: notif.id,
    title: notif.title,
    content: notif.content,
    type: notif.type,
    category: notif.category,
    imageUrl: notif.imageUrl || null,
    createdAt: notif.createdAt instanceof Date ? notif.createdAt.toISOString() : new Date(notif.createdAt).toISOString(),
  };

  if (includePublished) {
    (formatted as any).isPublished = notif.isPublished;
    (formatted as any).updatedAt = notif.updatedAt instanceof Date ? notif.updatedAt.toISOString() : new Date(notif.updatedAt).toISOString();
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
        content: 'Alliance pour la République et la Modernité vous souhaite la bienvenue. Rejoignez-nous pour construire un Mali meilleur.',
        type: 'all',
        category: 'annonce',
        isPublished: true,
      },
      {
        title: 'Réunion régionale de Bamako',
        content: 'Une réunion régionale se tiendra le 15 du mois prochain à Bamako. Tous les militants sont invités à participer.',
        type: 'militants',
        category: 'evenement',
        isPublished: true,
      },
      {
        title: 'Actualité politique',
        content: 'Alliance ARM continue son engagement pour la démocratie et le développement du Mali.',
        type: 'public',
        category: 'actualite',
        isPublished: true,
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

  // GET /api/notifications - Get published notifications (public)
  fastify.get(
    '/api/notifications',
    {
      schema: {
        description: 'Get published notifications',
        tags: ['notifications'],
        querystring: {
          type: 'object',
          properties: {
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
      const { type, category } = request.query as { type?: string; category?: string };
      app.logger.info({ type, category }, 'Fetching notifications');

      try {
        const conditions = [eq(schema.notifications.isPublished, true)];
        if (type) conditions.push(eq(schema.notifications.type, type));
        if (category) conditions.push(eq(schema.notifications.category, category));

        const result = await app.db
          .select()
          .from(schema.notifications)
          .where(and(...conditions))
          .orderBy(desc(schema.notifications.createdAt));

        app.logger.info({ count: result.length }, 'Notifications fetched successfully');
        return {
          notifications: result.map((n: any) => formatNotification(n, false)),
        };
      } catch (error) {
        app.logger.error({ err: error }, 'Failed to fetch notifications');
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
            type: { type: 'string', enum: ['public', 'militants', 'all'] },
            category: { type: 'string', enum: ['actualite', 'evenement', 'annonce', 'urgent'] },
            imageUrl: { type: 'string' },
            isPublished: { type: 'boolean' },
          },
          required: ['title', 'content', 'type', 'category'],
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

      const { title, content, type, category, imageUrl, isPublished } = request.body;
      app.logger.info({ userId: session.user.id, title }, 'Creating notification');

      try {
        const result = await app.db
          .insert(schema.notifications)
          .values({
            title,
            content,
            type,
            category,
            imageUrl: imageUrl || null,
            isPublished: isPublished !== false,
            createdBy: session.user.id,
          })
          .returning();

        reply.status(201);
        app.logger.info({ notificationId: result[0].id }, 'Notification created successfully');
        return {
          notification: formatNotification(result[0], true),
        };
      } catch (error) {
        app.logger.error({ err: error, userId: session.user.id }, 'Failed to create notification');
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
            type: { type: 'string', enum: ['public', 'militants', 'all'] },
            category: { type: 'string', enum: ['actualite', 'evenement', 'annonce', 'urgent'] },
            imageUrl: { type: 'string' },
            isPublished: { type: 'boolean' },
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
      if (body.type !== undefined) updates.type = body.type;
      if (body.category !== undefined) updates.category = body.category;
      if (body.imageUrl !== undefined) updates.imageUrl = body.imageUrl || null;
      if (body.isPublished !== undefined) updates.isPublished = body.isPublished;

      app.logger.info({ userId: session.user.id, notificationId: id }, 'Updating notification');

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
        app.logger.error({ err: error, userId: session.user.id }, 'Failed to update notification');
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
      app.logger.info({ userId: session.user.id, notificationId: id }, 'Deleting notification');

      try {
        const result = await app.db
          .delete(schema.notifications)
          .where(eq(schema.notifications.id, id as any))
          .returning();

        if (result.length === 0) {
          reply.status(404);
          return { error: 'Notification not found' };
        }

        app.logger.info({ notificationId: id }, 'Notification deleted successfully');
        return { success: true };
      } catch (error) {
        app.logger.error({ err: error, userId: session.user.id }, 'Failed to delete notification');
        throw error;
      }
    }
  );
}
