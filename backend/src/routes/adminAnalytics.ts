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
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const admin = await verifyAdminAuth(request, reply, app);
      if (!admin) return;

      app.logger.info(
        { adminId: admin.userId },
        'Fetching admin analytics'
      );

      try {
        // Fetch all required data in parallel
        const [members, donations, messages, news, events] = await Promise.all([
          app.db.select().from(schema.members),
          app.db.select().from(schema.donations),
          app.db.select().from(schema.messages),
          app.db.select().from(schema.news),
          app.db.select().from(schema.events),
        ]);

        // Calculate totals
        const totalMembers = members.length;
        const completedDonations = donations.filter(d => d.status === 'completed');
        const totalDonations = completedDonations
          .reduce((sum, d) => sum + parseFloat(d.amount as unknown as string), 0)
          .toFixed(2);
        const totalMessages = messages.length;

        // Build recent activity
        const recentActivity = [
          ...messages.slice(-5).map(m => ({
            type: 'message',
            title: m.subject,
            description: `From: ${m.senderName}`,
            timestamp: m.createdAt,
          })),
          ...news.slice(-5).map(n => ({
            type: 'news',
            title: n.title,
            description: 'News article published',
            timestamp: n.publishedAt,
          })),
          ...events.slice(-5).map(e => ({
            type: 'event',
            title: e.title,
            description: `Scheduled for ${e.date?.toLocaleDateString()}`,
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
          { adminId: admin.userId, totalMembers, totalMessages },
          'Admin analytics calculated'
        );

        return analytics;
      } catch (error) {
        app.logger.error(
          { err: error, adminId: admin.userId },
          'Failed to fetch admin analytics'
        );
        throw error;
      }
    }
  );
}
