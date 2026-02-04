import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import * as schema from '../db/schema.js';
import type { App } from '../index.js';
import { verifyAdminAuth } from '../utils/adminAuth.js';

export function register(app: App, fastify: FastifyInstance) {
  // GET /api/admin/analytics - Get admin analytics dashboard
  fastify.get(
    '/api/admin/analytics',
    {
      schema: {
        description: 'Get admin analytics dashboard (admin only)',
        tags: ['admin', 'analytics'],
        response: {
          200: {
            type: 'object',
            properties: {
              totalMembers: { type: 'number' },
              totalDonations: { type: 'string' },
              totalMessages: { type: 'number' },
              recentActivity: { type: 'array' },
            },
          },
          401: {
            type: 'object',
            properties: {
              error: { type: 'string' },
            },
          },
          403: {
            type: 'object',
            properties: {
              error: { type: 'string' },
            },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      app.logger.info({}, 'Admin analytics endpoint called');

      const admin = await verifyAdminAuth(request, reply, app);
      if (!admin) {
        app.logger.warn({}, 'Admin analytics request rejected due to failed authentication');
        return;
      }

      app.logger.info(
        { adminId: admin.userId },
        'Admin authentication successful, fetching analytics data'
      );

      try {
        // Fetch all required data in parallel
        const [members, donations, messages, news, events] = await Promise.all([
          app.db.select().from(schema.members).catch(() => []),
          app.db.select().from(schema.donations).catch(() => []),
          app.db.select().from(schema.messages).catch(() => []),
          app.db.select().from(schema.news).catch(() => []),
          app.db.select().from(schema.events).catch(() => []),
        ]);

        app.logger.debug(
          { memberCount: members.length, donationCount: donations.length, messageCount: messages.length },
          'Data fetched from database'
        );

        // Calculate totals
        const totalMembers = members?.length || 0;
        const completedDonations = donations?.filter(d => d?.status === 'completed') || [];
        const totalDonations = completedDonations.length > 0
          ? completedDonations
              .reduce((sum, d) => sum + parseFloat(d.amount as unknown as string), 0)
              .toFixed(2)
          : '0.00';
        const totalMessages = messages?.length || 0;

        // Build recent activity
        const recentActivity = [
          ...(messages?.slice(-5) || []).map(m => ({
            type: 'message',
            title: m.subject,
            description: `From: ${m.senderName}`,
            timestamp: m.createdAt,
          })),
          ...(news?.slice(-5) || []).map(n => ({
            type: 'news',
            title: n.title,
            description: 'News article published',
            timestamp: n.publishedAt,
          })),
          ...(events?.slice(-5) || []).map(e => ({
            type: 'event',
            title: e.title,
            description: `Scheduled for ${e.date?.toLocaleDateString?.()}`,
            timestamp: e.createdAt,
          })),
        ]
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
          .slice(0, 20);

        const analytics = {
          totalMembers,
          totalDonations,
          totalMessages,
          recentActivity,
        };

        app.logger.info(
          { adminId: admin.userId, totalMembers, totalMessages, totalDonations },
          'Admin analytics calculated successfully'
        );

        reply.status(200).send(analytics);
      } catch (error) {
        app.logger.error(
          { err: error, adminId: admin.userId },
          'Failed to fetch admin analytics'
        );
        reply.status(500).send({
          error: 'Failed to fetch analytics data',
          message: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  );
}
