import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { eq, desc, count, isNull, and } from 'drizzle-orm';
import * as schema from '../db/schema.js';
import type { App } from '../index.js';

export function register(app: App, fastify: FastifyInstance) {
  const requireAuth = app.requireAuth();

  // POST /api/notifications/read-all - Mark all notifications as read (register before /:id/read)
  fastify.post(
    '/api/notifications/read-all',
    {
      schema: {
        description: 'Mark all notifications as read for authenticated user',
        tags: ['notifications'],
        response: {
          200: {
            description: 'All notifications marked as read',
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              updated: { type: 'number' },
            },
          },
          401: {
            description: 'Unauthorized',
            type: 'object',
            properties: { error: { type: 'string' } },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      const userId = session.user.id;
      app.logger.info({ userId }, 'Marking all notifications as read');

      try {
        // Count unread before updating
        const countBefore = await app.db
          .select({ count: count() })
          .from(schema.userNotifications)
          .where(
            and(
              eq(schema.userNotifications.userId, userId),
              isNull(schema.userNotifications.readAt)
            )
          );
        const unreadCount = countBefore[0]?.count || 0;

        // Mark all as read
        const now = new Date();
        await app.db
          .update(schema.userNotifications)
          .set({ readAt: now })
          .where(
            and(
              eq(schema.userNotifications.userId, userId),
              isNull(schema.userNotifications.readAt)
            )
          );

        app.logger.info({ userId, updated: unreadCount }, 'All notifications marked as read');

        return {
          success: true,
          updated: unreadCount,
        };
      } catch (error) {
        app.logger.error({ err: error, userId }, 'Failed to mark all notifications as read');
        throw error;
      }
    }
  );

  // GET /api/notifications - Get user notifications
  fastify.get(
    '/api/notifications',
    {
      schema: {
        description: 'Get notifications for authenticated user',
        tags: ['notifications'],
        response: {
          200: {
            description: 'User notifications',
            type: 'object',
            properties: {
              notifications: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    title: { type: 'string' },
                    body: { type: 'string' },
                    category: { type: 'string' },
                    data: { type: 'object' },
                    read_at: { type: ['string', 'null'] },
                    created_at: { type: 'string', format: 'date-time' },
                  },
                },
              },
              unread_count: { type: 'number' },
            },
          },
          401: {
            description: 'Unauthorized',
            type: 'object',
            properties: { error: { type: 'string' } },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      const userId = session.user.id;
      app.logger.info({ userId }, 'Fetching user notifications');

      try {
        // Get 50 most recent notifications
        const notifications = await app.db
          .select()
          .from(schema.userNotifications)
          .where(eq(schema.userNotifications.userId, userId))
          .orderBy(desc(schema.userNotifications.createdAt))
          .limit(50);

        // Count unread notifications
        const unreadResult = await app.db
          .select({ count: count() })
          .from(schema.userNotifications)
          .where(
            and(
              eq(schema.userNotifications.userId, userId),
              isNull(schema.userNotifications.readAt)
            )
          );
        const unreadCount = unreadResult[0]?.count || 0;

        app.logger.info({ userId, count: notifications.length, unreadCount }, 'Notifications retrieved');

        return {
          notifications: notifications.map(n => ({
            id: n.id,
            title: n.title,
            body: n.body,
            category: n.category,
            data: n.data,
            read_at: n.readAt ? n.readAt.toISOString() : null,
            created_at: n.createdAt.toISOString(),
          })),
          unread_count: unreadCount,
        };
      } catch (error) {
        app.logger.error({ err: error, userId }, 'Failed to fetch notifications');
        throw error;
      }
    }
  );

  // POST /api/notifications/:id/read - Mark single notification as read
  fastify.post<{ Params: { id: string } }>(
    '/api/notifications/:id/read',
    {
      schema: {
        description: 'Mark a notification as read',
        tags: ['notifications'],
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string', format: 'uuid' },
          },
        },
        response: {
          200: {
            description: 'Notification marked as read',
            type: 'object',
            properties: { success: { type: 'boolean' } },
          },
          401: {
            description: 'Unauthorized',
            type: 'object',
            properties: { error: { type: 'string' } },
          },
          403: {
            description: 'Forbidden - notification does not belong to user',
            type: 'object',
            properties: { error: { type: 'string' } },
          },
          404: {
            description: 'Notification not found',
            type: 'object',
            properties: { error: { type: 'string' } },
          },
        },
      },
    },
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      const userId = session.user.id;
      const { id } = request.params;

      app.logger.info({ userId, notificationId: id }, 'Marking notification as read');

      try {
        // Find notification
        const notifications = await app.db
          .select()
          .from(schema.userNotifications)
          .where(eq(schema.userNotifications.id, id));

        if (notifications.length === 0) {
          app.logger.info({ userId, notificationId: id }, 'Notification not found');
          reply.status(404);
          return { error: 'Notification not found' };
        }

        const notification = notifications[0];

        // Verify ownership
        if (notification.userId !== userId) {
          app.logger.warn({ userId, notificationId: id, ownerId: notification.userId }, 'Unauthorized: user does not own notification');
          reply.status(403);
          return { error: 'Forbidden' };
        }

        // Mark as read
        const now = new Date();
        await app.db
          .update(schema.userNotifications)
          .set({ readAt: now })
          .where(eq(schema.userNotifications.id, id));

        app.logger.info({ userId, notificationId: id }, 'Notification marked as read');

        return { success: true };
      } catch (error) {
        app.logger.error({ err: error, userId, notificationId: id }, 'Failed to mark notification as read');
        throw error;
      }
    }
  );
}

// Helper function to create bulk notifications for active members
export async function notifyActiveMembers(
  app: App,
  title: string,
  body: string,
  category: 'announcements' | 'news' | 'events' | 'political-messages',
  resourceId: string,
  resourceType: string
): Promise<void> {
  // Non-blocking: fire and forget
  (async () => {
    try {
      app.logger.info({ category, resourceId }, 'Starting bulk notification creation for active members');

      // Get all active members
      const activeMembers = await app.db
        .select({ id: schema.members.id })
        .from(schema.members)
        .where(eq(schema.members.status, 'active'));

      if (activeMembers.length === 0) {
        app.logger.info({ category, resourceId }, 'No active members found for notification');
        return;
      }

      // Create notification rows for each active member
      const now = new Date();
      const truncatedBody = body.substring(0, 100);
      const notificationData = activeMembers.map(member => ({
        userId: member.id,
        title,
        body: truncatedBody,
        category,
        data: {
          resource_id: resourceId,
          resource_type: resourceType,
        } as any,
        createdAt: now,
        readAt: null,
      }));

      await app.db.insert(schema.userNotifications).values(notificationData);

      app.logger.info(
        { category, resourceId, memberCount: activeMembers.length },
        'Bulk notifications created for active members'
      );
    } catch (error) {
      app.logger.error(
        { err: error, category, resourceId },
        'Failed to create bulk notifications for active members'
      );
      // Do not rethrow - this is non-blocking background work
    }
  })();
}
