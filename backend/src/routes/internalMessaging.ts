import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { eq, and, or } from 'drizzle-orm';
import * as schema from '../db/schema.js';
import type { App } from '../index.js';
import { verifyAdminAuth } from '../utils/adminAuth.js';

interface SendMessageBody {
  title: string;
  content: string;
  targetRole?: string;
  targetRegion?: string;
  targetCercle?: string;
  targetCommune?: string;
}

export function register(app: App, fastify: FastifyInstance) {
  const requireAuth = app.requireAuth();

  // GET /api/messages/my-messages - Get messages for current user (protected)
  fastify.get(
    '/api/messages/my-messages',
    {
      schema: {
        description: 'Get messages for current user based on role/location',
        tags: ['messaging'],
        response: {
          200: {
            type: 'object',
            properties: {
              messages: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    title: { type: 'string' },
                    content: { type: 'string' },
                    sentAt: { type: 'string', format: 'date-time' },
                    isRead: { type: 'boolean' },
                  },
                },
              },
            },
          },
          401: { type: 'object' },
          404: { type: 'object' },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      app.logger.info({ userId: session.user.id }, 'Fetching user messages');

      try {
        // Get user's member profile to check role and location
        const memberResult = await app.db
          .select()
          .from(schema.memberProfiles)
          .where(eq(schema.memberProfiles.userId, session.user.id));

        if (memberResult.length === 0) {
          return reply.status(404).send({ error: 'Profil membre non trouvé' });
        }

        const member = memberResult[0];

        // Get all messages
        const allMessages = await app.db.select().from(schema.internalMessages);

        // Filter messages based on member's role, region, cercle, commune
        const userMessages = allMessages.filter(msg => {
          // Message must match user's filters (OR logic for each filter type)
          const roleMatches = !msg.targetRole || msg.targetRole === member.role;
          const regionMatches = !msg.targetRegion || msg.targetRegion === member.region;
          const cercleMatches = !msg.targetCercle || msg.targetCercle === member.cercle;
          const communeMatches = !msg.targetCommune || msg.targetCommune === member.commune;

          return roleMatches && regionMatches && cercleMatches && communeMatches;
        });

        // Get read status for each message
        const messageReads = await app.db.select().from(schema.messageReads);

        const messages = userMessages.map(msg => {
          const isRead = messageReads.some(
            read => read.messageId === msg.id && read.memberProfileId === member.id
          );

          return {
            id: msg.id,
            title: msg.title,
            content: msg.content,
            sentAt: msg.sentAt instanceof Date ? msg.sentAt.toISOString() : new Date(msg.sentAt).toISOString(),
            isRead,
          };
        });

        // Sort by sentAt DESC
        messages.sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime());

        app.logger.info(
          { userId: session.user.id, count: messages.length },
          'User messages fetched'
        );
        return { messages };
      } catch (error) {
        app.logger.error(
          { err: error, userId: session.user.id },
          'Failed to fetch user messages'
        );
        throw error;
      }
    }
  );

  // POST /api/messages/mark-read/:id - Mark as read (protected)
  fastify.post<{ Params: { id: string } }>(
    '/api/messages/mark-read/:id',
    {
      schema: {
        description: 'Mark message as read',
        tags: ['messaging'],
        params: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
          },
        },
        response: {
          200: { type: 'object' },
          401: { type: 'object' },
          404: { type: 'object' },
        },
      },
    },
    async (
      request: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply
    ) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      const { id: messageId } = request.params;
      app.logger.info(
        { userId: session.user.id, messageId },
        'Marking message as read'
      );

      try {
        // Get user's member profile
        const memberResult = await app.db
          .select()
          .from(schema.memberProfiles)
          .where(eq(schema.memberProfiles.userId, session.user.id));

        if (memberResult.length === 0) {
          return reply.status(404).send({ error: 'Profil membre non trouvé' });
        }

        const memberProfileId = memberResult[0].id;

        // Check if message exists
        const message = await app.db
          .select()
          .from(schema.internalMessages)
          .where(eq(schema.internalMessages.id, messageId as any));

        if (message.length === 0) {
          return reply.status(404).send({ error: 'Message non trouvé' });
        }

        // Check if already marked as read
        const existingRead = await app.db
          .select()
          .from(schema.messageReads)
          .where(
            and(
              eq(schema.messageReads.messageId, messageId as any),
              eq(schema.messageReads.memberProfileId, memberProfileId)
            )
          );

        // If not already read, insert
        if (existingRead.length === 0) {
          await app.db
            .insert(schema.messageReads)
            .values({
              messageId: messageId as any,
              memberProfileId,
              readAt: new Date(),
            });
        }

        app.logger.info({ messageId }, 'Message marked as read');
        return { success: true };
      } catch (error) {
        app.logger.error(
          { err: error, userId: session.user.id, messageId },
          'Failed to mark message as read'
        );
        throw error;
      }
    }
  );

  // POST /api/notifications/send - Send notification message (admin)
  fastify.post<{ Body: SendMessageBody }>(
    '/api/notifications/send',
    {
      schema: {
        description: 'Send notification message to targeted members (admin)',
        tags: ['admin', 'notifications'],
        body: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            content: { type: 'string' },
            targetRole: { type: 'string' },
            targetRegion: { type: 'string' },
            targetCercle: { type: 'string' },
            targetCommune: { type: 'string' },
          },
          required: ['title', 'content'],
        },
        response: {
          201: {
            type: 'object',
            properties: {
              messageId: { type: 'string' },
              sent: { type: 'boolean' },
            },
          },
          401: { type: 'object' },
        },
      },
    },
    async (request: FastifyRequest<{ Body: SendMessageBody }>, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      const { title, content, targetRole, targetRegion, targetCercle, targetCommune } = request.body;

      app.logger.info(
        { userId: session.user.id, title },
        'Sending notification message'
      );

      try {
        const result = await app.db
          .insert(schema.internalMessages)
          .values({
            title,
            content,
            senderId: session.user.id,
            targetRole: targetRole || null,
            targetRegion: targetRegion || null,
            targetCercle: targetCercle || null,
            targetCommune: targetCommune || null,
            sentAt: new Date(),
            createdAt: new Date(),
          })
          .returning();

        reply.status(201);
        app.logger.info(
          { messageId: result[0].id, userId: session.user.id },
          'Notification message sent'
        );
        return { messageId: result[0].id, sent: true };
      } catch (error) {
        app.logger.error(
          { err: error, userId: session.user.id },
          'Failed to send notification message'
        );
        throw error;
      }
    }
  );

  // POST /api/admin/messages/send - Send internal message (admin only)
  fastify.post<{ Body: SendMessageBody }>(
    '/api/admin/messages/send',
    {
      schema: {
        description: 'Send internal message (admin only)',
        tags: ['admin', 'messaging'],
        body: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            content: { type: 'string' },
            targetRole: { type: 'string' },
            targetRegion: { type: 'string' },
            targetCercle: { type: 'string' },
            targetCommune: { type: 'string' },
          },
          required: ['title', 'content'],
        },
        response: {
          200: { type: 'object' },
        },
      },
    },
    async (request: FastifyRequest<{ Body: SendMessageBody }>, reply: FastifyReply) => {
      const admin = await verifyAdminAuth(request, reply, app);
      if (!admin) return;

      const { title, content, targetRole, targetRegion, targetCercle, targetCommune } =
        request.body;
      app.logger.info(
        { adminId: admin.userId, title, targetRole },
        'Admin sending internal message'
      );

      try {
        const result = await app.db
          .insert(schema.internalMessages)
          .values({
            title,
            content,
            senderId: admin.username,
            targetRole,
            targetRegion,
            targetCercle,
            targetCommune,
          })
          .returning();

        app.logger.info(
          { messageId: result[0].id, adminId: admin.userId },
          'Internal message sent'
        );
        return result[0];
      } catch (error) {
        app.logger.error(
          { err: error, adminId: admin.userId },
          'Failed to send internal message'
        );
        throw error;
      }
    }
  );
}
