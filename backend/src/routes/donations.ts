import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { eq, sql } from 'drizzle-orm';
import * as schema from '../db/schema.js';
import type { App } from '../index.js';

interface DonationBody {
  donorName: string;
  donorEmail: string;
  amount: string;
  paymentMethod?: string;
  currency?: string;
  contributionType?: 'one-time' | 'monthly' | 'annual';
}

export function register(app: App, fastify: FastifyInstance) {
  const requireAuth = app.requireAuth();

  // POST /api/donations - Create donation
  fastify.post<{ Body: DonationBody }>(
    '/api/donations',
    {
      schema: {
        description: 'Create a donation',
        tags: ['donations'],
        body: {
          type: 'object',
          properties: {
            donorName: { type: 'string' },
            donorEmail: { type: 'string' },
            amount: { type: 'string' },
            paymentMethod: { type: 'string' },
            currency: { type: 'string' },
            contributionType: { type: 'string', enum: ['one-time', 'monthly', 'annual'] },
          },
          required: ['donorName', 'donorEmail', 'amount'],
        },
        response: {
          200: { type: 'object' },
        },
      },
    },
    async (request, reply) => {
      const { donorName, donorEmail, amount, paymentMethod, currency, contributionType } =
        request.body;
      app.logger.info(
        { donorEmail, amount },
        'Creating donation record'
      );

      try {
        const result = await app.db
          .insert(schema.donations)
          .values({
            donorName,
            donorEmail,
            amount: amount as any,
            paymentMethod,
            currency: currency || 'EUR',
            contributionType: (contributionType || 'one-time') as any,
          })
          .returning();

        app.logger.info(
          { donationId: result[0].id, amount },
          'Donation record created'
        );
        return result[0];
      } catch (error) {
        app.logger.error(
          { err: error, donorEmail },
          'Failed to create donation'
        );
        throw error;
      }
    }
  );

  // GET /api/donations - Get all donations (admin only)
  fastify.get(
    '/api/donations',
    {
      schema: {
        description: 'Get all donations (admin only)',
        tags: ['donations'],
        response: {
          200: { type: 'array' },
        },
      },
    },
    async (request, reply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      app.logger.info('Fetching all donations');

      try {
        const result = await app.db
          .select()
          .from(schema.donations)
          .orderBy(schema.donations.createdAt);

        app.logger.info(
          { count: result.length },
          'Donations fetched successfully'
        );
        return result;
      } catch (error) {
        app.logger.error({ err: error }, 'Failed to fetch donations');
        throw error;
      }
    }
  );

  // GET /api/donations/stats - Get donation statistics
  fastify.get(
    '/api/donations/stats',
    {
      schema: {
        description: 'Get donation statistics',
        tags: ['donations'],
        response: {
          200: {
            type: 'object',
            properties: {
              totalAmount: { type: 'string' },
              donationCount: { type: 'number' },
              completedCount: { type: 'number' },
              pendingCount: { type: 'number' },
              currency: { type: 'string' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      app.logger.info('Fetching donation statistics');

      try {
        const donations = await app.db
          .select()
          .from(schema.donations);

        const completed = donations.filter(d => d.status === 'completed');
        const pending = donations.filter(d => d.status === 'pending');

        const totalAmount = completed.reduce(
          (sum, d) => sum + parseFloat(d.amount as unknown as string),
          0
        );

        const stats = {
          totalAmount: totalAmount.toFixed(2),
          donationCount: donations.length,
          completedCount: completed.length,
          pendingCount: pending.length,
          currency: 'EUR',
        };

        app.logger.info(stats, 'Donation statistics calculated');
        return stats;
      } catch (error) {
        app.logger.error(
          { err: error },
          'Failed to fetch donation statistics'
        );
        throw error;
      }
    }
  );
}
