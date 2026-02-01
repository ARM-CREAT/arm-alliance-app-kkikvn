import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { eq } from 'drizzle-orm';
import * as schema from '../db/schema.js';
import type { App } from '../index.js';

export function register(app: App, fastify: FastifyInstance) {
  const requireAuth = app.requireAuth();

  // GET /api/analytics/overview - Get dashboard overview
  fastify.get(
    '/api/analytics/overview',
    {
      schema: {
        description: 'Get analytics overview (admin only)',
        tags: ['analytics'],
        response: {
          200: {
            type: 'object',
            properties: {
              memberCount: { type: 'number' },
              approvedMembers: { type: 'number' },
              pendingMembers: { type: 'number' },
              totalDonations: { type: 'string' },
              messageCount: { type: 'number' },
              unreadMessages: { type: 'number' },
              eventCount: { type: 'number' },
              newsCount: { type: 'number' },
            },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      app.logger.info('Fetching analytics overview');

      try {
        const [members, donations, messages, events, news] = await Promise.all([
          app.db.select().from(schema.members),
          app.db.select().from(schema.donations),
          app.db.select().from(schema.messages),
          app.db.select().from(schema.events),
          app.db.select().from(schema.news),
        ]);

        const approvedMembers = members.filter(m => m.status === 'approved').length;
        const pendingMembers = members.filter(m => m.status === 'pending').length;
        const completedDonations = donations.filter(d => d.status === 'completed');
        const totalDonations = completedDonations
          .reduce((sum, d) => sum + parseFloat(d.amount as unknown as string), 0)
          .toFixed(2);
        const unreadMessages = messages.filter(m => m.status === 'unread').length;

        const overview = {
          memberCount: members.length,
          approvedMembers,
          pendingMembers,
          totalDonations,
          messageCount: messages.length,
          unreadMessages,
          eventCount: events.length,
          newsCount: news.length,
        };

        app.logger.info(overview, 'Analytics overview calculated');
        return overview;
      } catch (error) {
        app.logger.error(
          { err: error },
          'Failed to fetch analytics overview'
        );
        throw error;
      }
    }
  );

  // GET /api/analytics/members - Member analytics
  fastify.get(
    '/api/analytics/members',
    {
      schema: {
        description: 'Get member analytics (admin only)',
        tags: ['analytics'],
        response: {
          200: {
            type: 'object',
            properties: {
              byRegion: { type: 'object' },
              byStatus: { type: 'object' },
              totalMembers: { type: 'number' },
            },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      app.logger.info('Fetching member analytics');

      try {
        const members = await app.db
          .select()
          .from(schema.members);

        // Count by region
        const byRegion: Record<string, number> = {};
        members.forEach(m => {
          byRegion[m.region] = (byRegion[m.region] || 0) + 1;
        });

        // Count by status
        const byStatus: Record<string, number> = {};
        members.forEach(m => {
          byStatus[m.status] = (byStatus[m.status] || 0) + 1;
        });

        const analytics = {
          byRegion,
          byStatus,
          totalMembers: members.length,
        };

        app.logger.info(
          { totalMembers: members.length },
          'Member analytics calculated'
        );
        return analytics;
      } catch (error) {
        app.logger.error(
          { err: error },
          'Failed to fetch member analytics'
        );
        throw error;
      }
    }
  );

  // GET /api/analytics/donations - Donation analytics
  fastify.get(
    '/api/analytics/donations',
    {
      schema: {
        description: 'Get donation analytics (admin only)',
        tags: ['analytics'],
        response: {
          200: {
            type: 'object',
            properties: {
              byStatus: { type: 'object' },
              byPaymentMethod: { type: 'object' },
              totalAmount: { type: 'string' },
              averageAmount: { type: 'string' },
            },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      app.logger.info('Fetching donation analytics');

      try {
        const donations = await app.db
          .select()
          .from(schema.donations);

        // Count by status
        const byStatus: Record<string, number> = {};
        donations.forEach(d => {
          byStatus[d.status] = (byStatus[d.status] || 0) + 1;
        });

        // Count by payment method
        const byPaymentMethod: Record<string, number> = {};
        donations.forEach(d => {
          if (d.paymentMethod) {
            byPaymentMethod[d.paymentMethod] =
              (byPaymentMethod[d.paymentMethod] || 0) + 1;
          }
        });

        // Calculate totals
        const completed = donations.filter(d => d.status === 'completed');
        const totalAmount = completed
          .reduce((sum, d) => sum + parseFloat(d.amount as unknown as string), 0)
          .toFixed(2);
        const averageAmount = (
          parseFloat(totalAmount) / (completed.length || 1)
        ).toFixed(2);

        const analytics = {
          byStatus,
          byPaymentMethod,
          totalAmount,
          averageAmount,
        };

        app.logger.info(
          { totalAmount, donationCount: donations.length },
          'Donation analytics calculated'
        );
        return analytics;
      } catch (error) {
        app.logger.error(
          { err: error },
          'Failed to fetch donation analytics'
        );
        throw error;
      }
    }
  );
}
