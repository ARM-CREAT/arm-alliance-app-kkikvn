import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { desc, count } from 'drizzle-orm';
import * as schema from '../db/schema.js';
import type { App } from '../index.js';

function formatCotisation(cotisation: any) {
  return {
    id: cotisation.id,
    member_id: cotisation.memberId,
    amount: cotisation.amount.toString(),
    type: cotisation.type,
    payment_method: cotisation.paymentMethod,
    transaction_id: cotisation.transactionId,
    status: cotisation.status,
    paid_at: cotisation.paidAt ? new Date(cotisation.paidAt).toISOString() : null,
    created_at: new Date(cotisation.createdAt).toISOString(),
  };
}

export function register(app: App, fastify: FastifyInstance) {
  // GET /api/cotisations - Get all cotisations (paginated)
  fastify.get<{ Querystring: { page?: string; limit?: string } }>(
    '/api/cotisations',
    {
      schema: {
        description: 'Get all cotisations (paginated)',
        tags: ['cotisations'],
        querystring: {
          type: 'object',
          properties: {
            page: { type: 'string', default: '1', description: 'Page number (default 1)' },
            limit: { type: 'string', default: '20', description: 'Items per page (default 20)' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              data: { type: 'array', items: { type: 'object' } },
              page: { type: 'number' },
              limit: { type: 'number' },
              total: { type: 'number' },
            },
          },
        },
      },
    },
    async (request: FastifyRequest<{ Querystring: { page?: string; limit?: string } }>, reply: FastifyReply) => {
      const page = Math.max(1, parseInt(request.query.page || '1', 10));
      const pageLimit = Math.max(1, parseInt(request.query.limit || '20', 10));
      const offsetValue = (page - 1) * pageLimit;

      app.logger.info({ page, limit: pageLimit }, 'Fetching cotisations');

      try {
        const totalResult = await app.db.select({ count: count() }).from(schema.cotisations);
        const total = totalResult[0]?.count || 0;

        const result = await app.db
          .select()
          .from(schema.cotisations)
          .orderBy(desc(schema.cotisations.createdAt))
          .limit(pageLimit)
          .offset(offsetValue);

        app.logger.info({ count: result.length, page, total }, 'Cotisations fetched successfully');

        return {
          data: result.map(formatCotisation),
          page,
          limit: pageLimit,
          total,
        };
      } catch (error) {
        app.logger.error({ err: error }, 'Failed to fetch cotisations');
        throw error;
      }
    }
  );
}
