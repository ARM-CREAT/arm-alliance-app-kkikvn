import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { eq, desc, count } from 'drizzle-orm';
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

interface UpdateStatusBody {
  status: 'pending' | 'confirmed' | 'cancelled';
}

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

function verifyAdminPassword(request: FastifyRequest, reply: FastifyReply): boolean {
  const password = request.headers['x-admin-password'];
  if (password !== ADMIN_PASSWORD) {
    reply.status(401).send({
      error: 'Unauthorized',
      message: 'Invalid admin password',
    });
    return false;
  }
  return true;
}

function formatDonation(donation: any) {
  return {
    id: donation.id,
    donorName: donation.donorName,
    donorEmail: donation.donorEmail,
    amount: donation.amount.toString(),
    currency: donation.currency,
    paymentMethod: donation.paymentMethod,
    status: donation.status,
    contributionType: donation.contributionType,
    createdAt: donation.createdAt.toISOString(),
  };
}

export function register(app: App, fastify: FastifyInstance) {
  // POST /api/donations - Create donation (public)
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
          201: { type: 'object' },
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
        reply.status(201);
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

  // GET /api/donations - Get all donations (public, paginated)
  fastify.get<{ Querystring: { page?: string; limit?: string } }>(
    '/api/donations',
    {
      schema: {
        description: 'Get all donations (paginated)',
        tags: ['donations'],
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

      app.logger.info({ page, limit: pageLimit }, 'Fetching donations');

      try {
        const totalResult = await app.db.select({ count: count() }).from(schema.donations);
        const total = totalResult[0]?.count || 0;

        const result = await app.db
          .select()
          .from(schema.donations)
          .orderBy(desc(schema.donations.createdAt))
          .limit(pageLimit)
          .offset(offsetValue);

        app.logger.info({ count: result.length, page, total }, 'Donations fetched successfully');

        return {
          data: result.map(formatDonation),
          page,
          limit: pageLimit,
          total,
        };
      } catch (error) {
        app.logger.error({ err: error }, 'Failed to fetch donations');
        throw error;
      }
    }
  );

  // GET /api/admin/donations - Get all donations (admin, authenticated, paginated)
  fastify.get<{ Querystring: { page?: string; limit?: string } }>(
    '/api/admin/donations',
    {
      schema: {
        description: 'Get all donations (admin only, paginated)',
        tags: ['admin', 'donations'],
        querystring: {
          type: 'object',
          properties: {
            page: { type: 'string', default: '1', description: 'Page number (default 1)' },
            limit: { type: 'string', default: '50', description: 'Items per page (default 50)' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              data: { type: 'array', items: { type: 'object' } },
              total: { type: 'number' },
            },
          },
          401: { type: 'object' },
        },
      },
    },
    async (request: FastifyRequest<{ Querystring: { page?: string; limit?: string } }>, reply: FastifyReply) => {
      const session = await app.requireAuth()(request, reply);
      if (!session) return;

      const page = Math.max(1, parseInt(request.query.page || '1', 10));
      const pageLimit = Math.max(1, parseInt(request.query.limit || '50', 10));
      const offsetValue = (page - 1) * pageLimit;

      app.logger.info({ page, limit: pageLimit }, 'Admin fetching all donations');

      try {
        const totalResult = await app.db.select({ count: count() }).from(schema.donations);
        const total = totalResult[0]?.count || 0;

        const result = await app.db
          .select()
          .from(schema.donations)
          .orderBy(desc(schema.donations.createdAt))
          .limit(pageLimit)
          .offset(offsetValue);

        app.logger.info(
          { count: result.length, page, total },
          'Admin donations fetched successfully'
        );
        return { data: result.map(formatDonation), total };
      } catch (error) {
        app.logger.error({ err: error }, 'Failed to fetch donations');
        throw error;
      }
    }
  );

  // GET /api/admin/donations/stats - Get donation statistics (admin)
  fastify.get(
    '/api/admin/donations/stats',
    {
      schema: {
        description: 'Get donation statistics (admin only)',
        tags: ['admin', 'donations'],
        response: {
          200: { type: 'object' },
          401: { type: 'object' },
        },
      },
    },
    async (request, reply) => {
      if (!verifyAdminPassword(request, reply)) return;

      app.logger.info('Fetching donation statistics');

      try {
        const donations = await app.db
          .select()
          .from(schema.donations);

        const totalCount = donations.length;
        const totalAmount = donations.reduce(
          (sum, d) => sum + parseFloat(d.amount as unknown as string),
          0
        );

        // Group by contribution type
        const byContributionType: Record<string, number> = {};
        donations.forEach(d => {
          byContributionType[d.contributionType || 'one-time'] =
            (byContributionType[d.contributionType || 'one-time'] || 0) + 1;
        });

        // Group by status
        const byStatus: Record<string, number> = {};
        donations.forEach(d => {
          byStatus[d.status] = (byStatus[d.status] || 0) + 1;
        });

        const stats = {
          totalCount,
          totalAmount,
          byContributionType,
          byStatus,
        };

        app.logger.info(stats, 'Donation statistics calculated');
        return { stats };
      } catch (error) {
        app.logger.error(
          { err: error },
          'Failed to fetch donation statistics'
        );
        throw error;
      }
    }
  );

  // PUT /api/admin/donations/:id/status - Update donation status (admin)
  fastify.put<{ Params: { id: string }; Body: UpdateStatusBody }>(
    '/api/admin/donations/:id/status',
    {
      schema: {
        description: 'Update donation status (admin only)',
        tags: ['admin', 'donations'],
        params: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
          },
        },
        body: {
          type: 'object',
          properties: {
            status: { type: 'string', enum: ['pending', 'confirmed', 'cancelled'] },
          },
          required: ['status'],
        },
        response: {
          200: { type: 'object' },
          400: { type: 'object' },
          404: { type: 'object' },
          401: { type: 'object' },
        },
      },
    },
    async (request, reply) => {
      if (!verifyAdminPassword(request, reply)) return;

      const { id } = request.params;
      const { status } = request.body;

      if (!['pending', 'confirmed', 'cancelled'].includes(status)) {
        reply.status(400);
        return { error: 'BadRequest', message: 'Invalid status' };
      }

      app.logger.info({ donationId: id, status }, 'Updating donation status');

      try {
        const result = await app.db
          .update(schema.donations)
          .set({ status })
          .where(eq(schema.donations.id, id))
          .returning();

        if (result.length === 0) {
          app.logger.warn({ donationId: id }, 'Donation not found');
          reply.status(404);
          return { error: 'NotFound', message: 'Donation not found' };
        }

        app.logger.info({ donationId: id, status }, 'Donation status updated');
        return { donation: formatDonation(result[0]) };
      } catch (error) {
        app.logger.error(
          { err: error, donationId: id },
          'Failed to update donation status'
        );
        throw error;
      }
    }
  );

  // DELETE /api/admin/donations/:id - Delete donation (admin)
  fastify.delete<{ Params: { id: string } }>(
    '/api/admin/donations/:id',
    {
      schema: {
        description: 'Delete a donation (admin only)',
        tags: ['admin', 'donations'],
        params: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
          },
        },
        response: {
          200: { type: 'object' },
          404: { type: 'object' },
          401: { type: 'object' },
        },
      },
    },
    async (request, reply) => {
      if (!verifyAdminPassword(request, reply)) return;

      const { id } = request.params;
      app.logger.info({ donationId: id }, 'Deleting donation');

      try {
        const result = await app.db
          .delete(schema.donations)
          .where(eq(schema.donations.id, id))
          .returning();

        if (result.length === 0) {
          app.logger.warn({ donationId: id }, 'Donation not found');
          reply.status(404);
          return { error: 'NotFound', message: 'Donation not found' };
        }

        app.logger.info({ donationId: id }, 'Donation deleted successfully');
        return { success: true };
      } catch (error) {
        app.logger.error({ err: error, donationId: id }, 'Failed to delete donation');
        throw error;
      }
    }
  );
}
