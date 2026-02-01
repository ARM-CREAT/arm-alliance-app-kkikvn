import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { eq, and } from 'drizzle-orm';
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
          200: { type: 'array' },
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
          return reply.status(404).send({ error: 'Member profile not found' });
        }

        const member = memberResult[0];

        // Get messages for this user
        // Messages are for: all (no target), user's role, user's region, cercle, or commune
        const allMessages = await app.db.select().from(schema.internalMessages);

        const userMessages = allMessages.filter(msg => {
          // Check if message is for everyone
          if (!msg.targetRole && !msg.targetRegion && !msg.targetCercle && !msg.targetCommune) {
            return true;
          }

          // Check role filter
          if (msg.targetRole && msg.targetRole === member.role) {
            return true;
          }

          // Check region filter
          if (msg.targetRegion && msg.targetRegion === member.commune) {
            return true;
          }

          // Check cercle filter
          if (msg.targetCercle && msg.targetCercle === member.commune) {
            return true;
          }

          // Check commune filter
          if (msg.targetCommune && msg.targetCommune === member.commune) {
            return true;
          }

          return false;
        });

        app.logger.info(
          { userId: session.user.id, count: userMessages.length },
          'User messages fetched'
        );
        return userMessages;
      } catch (error) {
        app.logger.error(
          { err: error, userId: session.user.id },
          'Failed to fetch user messages'
        );
        throw error;
      }
    }
  );

  // POST /api/messages/mark-read/:messageId - Mark as read (protected)
  fastify.post<{ Params: { messageId: string } }>(
    '/api/messages/mark-read/:messageId',
    {
      schema: {
        description: 'Mark message as read',
        tags: ['messaging'],
        params: {
          type: 'object',
          properties: {
            messageId: { type: 'string' },
          },
        },
        response: {
          200: { type: 'object' },
        },
      },
    },
    async (
      request: FastifyRequest<{ Params: { messageId: string } }>,
      reply: FastifyReply
    ) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      const { messageId } = request.params;
      app.logger.info(
        { userId: session.user.id, messageId },
        'Marking message as read'
      );

      // In a production system, you would track read status
      // For now, we just acknowledge the request
      return { success: true };
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
