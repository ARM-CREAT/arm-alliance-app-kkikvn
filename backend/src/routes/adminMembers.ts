import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { eq, desc } from 'drizzle-orm';
import * as schema from '../db/schema.js';
import type { App } from '../index.js';
import { verifyAdminAuth } from '../utils/adminAuth.js';

interface UpdateRoleBody {
  role: 'militant' | 'collecteur' | 'superviseur' | 'administrateur';
}

interface UpdateStatusBody {
  status: 'active' | 'suspended';
}

export function register(app: App, fastify: FastifyInstance) {
  // GET /api/admin/members - Get all members (admin only)
  fastify.get<{ Querystring: { status?: string; role?: string; region?: string } }>(
    '/api/admin/members',
    {
      schema: {
        description: 'Get all members with filters (admin only)',
        tags: ['admin', 'members'],
        querystring: {
          type: 'object',
          properties: {
            status: { type: 'string' },
            role: { type: 'string' },
            region: { type: 'string' },
          },
        },
        response: {
          200: { type: 'array' },
        },
      },
    },
    async (
      request: FastifyRequest<{ Querystring: { status?: string; role?: string; region?: string } }>,
      reply: FastifyReply
    ) => {
      const admin = await verifyAdminAuth(request, reply, app);
      if (!admin) return;

      const { status, role, region } = request.query;
      app.logger.info(
        { adminId: admin.userId, filters: { status, role, region } },
        'Admin fetching members'
      );

      try {
        let members = await app.db.select().from(schema.memberProfiles);

        // Apply filters
        if (status) {
          members = members.filter(m => m.status === status);
        }
        if (role) {
          members = members.filter(m => m.role === role);
        }
        if (region) {
          members = members.filter(m => m.commune === region);
        }

        app.logger.info(
          { adminId: admin.userId, count: members.length },
          'Members fetched successfully'
        );
        return members;
      } catch (error) {
        app.logger.error(
          { err: error, adminId: admin.userId },
          'Failed to fetch members'
        );
        throw error;
      }
    }
  );

  // PUT /api/admin/members/:id/role - Update member role (admin only)
  fastify.put<{ Params: { id: string }; Body: UpdateRoleBody }>(
    '/api/admin/members/:id/role',
    {
      schema: {
        description: 'Update member role (admin only)',
        tags: ['admin', 'members'],
        params: {
          type: 'object',
          properties: {
            id: { type: 'string' },
          },
        },
        body: {
          type: 'object',
          properties: {
            role: {
              type: 'string',
              enum: ['militant', 'collecteur', 'superviseur', 'administrateur'],
            },
          },
          required: ['role'],
        },
        response: {
          200: { type: 'object' },
        },
      },
    },
    async (
      request: FastifyRequest<{ Params: { id: string }; Body: UpdateRoleBody }>,
      reply: FastifyReply
    ) => {
      const admin = await verifyAdminAuth(request, reply, app);
      if (!admin) return;

      const { id } = request.params;
      const { role } = request.body;
      app.logger.info(
        { adminId: admin.userId, memberId: id, newRole: role },
        'Admin updating member role'
      );

      try {
        const result = await app.db
          .update(schema.memberProfiles)
          .set({
            role: role as any,
            updatedAt: new Date(),
          })
          .where(eq(schema.memberProfiles.id, id as any))
          .returning();

        if (result.length === 0) {
          return reply.status(404).send({ error: 'Member not found' });
        }

        app.logger.info(
          { adminId: admin.userId, memberId: id, newRole: role },
          'Member role updated'
        );
        return result[0];
      } catch (error) {
        app.logger.error(
          { err: error, adminId: admin.userId, memberId: id },
          'Failed to update member role'
        );
        throw error;
      }
    }
  );

  // PUT /api/admin/members/:id/status - Update member status (admin only)
  fastify.put<{ Params: { id: string }; Body: UpdateStatusBody }>(
    '/api/admin/members/:id/status',
    {
      schema: {
        description: 'Update member status (admin only)',
        tags: ['admin', 'members'],
        params: {
          type: 'object',
          properties: {
            id: { type: 'string' },
          },
        },
        body: {
          type: 'object',
          properties: {
            status: { type: 'string', enum: ['active', 'suspended'] },
          },
          required: ['status'],
        },
        response: {
          200: { type: 'object' },
        },
      },
    },
    async (
      request: FastifyRequest<{ Params: { id: string }; Body: UpdateStatusBody }>,
      reply: FastifyReply
    ) => {
      const admin = await verifyAdminAuth(request, reply, app);
      if (!admin) return;

      const { id } = request.params;
      const { status } = request.body;
      app.logger.info(
        { adminId: admin.userId, memberId: id, newStatus: status },
        'Admin updating member status'
      );

      try {
        const result = await app.db
          .update(schema.memberProfiles)
          .set({
            status: status as any,
            updatedAt: new Date(),
          })
          .where(eq(schema.memberProfiles.id, id as any))
          .returning();

        if (result.length === 0) {
          return reply.status(404).send({ error: 'Member not found' });
        }

        app.logger.info(
          { adminId: admin.userId, memberId: id, newStatus: status },
          'Member status updated'
        );
        return result[0];
      } catch (error) {
        app.logger.error(
          { err: error, adminId: admin.userId, memberId: id },
          'Failed to update member status'
        );
        throw error;
      }
    }
  );

  // GET /api/admin/statistics - Get admin statistics (admin only)
  fastify.get(
    '/api/admin/statistics',
    {
      schema: {
        description: 'Get admin statistics dashboard (admin only)',
        tags: ['admin', 'statistics'],
        response: {
          200: {
            type: 'object',
            properties: {
              totalMembers: { type: 'number' },
              activeMembers: { type: 'number' },
              pendingMembers: { type: 'number' },
              totalCotisations: { type: 'string' },
              monthlyRevenue: { type: 'string' },
              membersByRegion: { type: 'object' },
              membersByRole: { type: 'object' },
              recentActivity: { type: 'array' },
            },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const admin = await verifyAdminAuth(request, reply, app);
      if (!admin) return;

      app.logger.info({ adminId: admin.userId }, 'Fetching admin statistics');

      try {
        const [members, cotisations] = await Promise.all([
          app.db.select().from(schema.memberProfiles),
          app.db.select().from(schema.cotisations),
        ]);

        const activeMembers = members.filter(m => m.status === 'active').length;
        const pendingMembers = members.filter(m => m.status === 'pending').length;
        const completedCotisations = cotisations.filter(c => c.status === 'completed');
        const totalCotisations = completedCotisations
          .reduce((sum, c) => sum + parseFloat(c.amount as unknown as string), 0)
          .toFixed(2);

        // Get current month's revenue
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const monthlyRevenue = completedCotisations
          .filter(c => new Date(c.paidAt || '') >= monthStart)
          .reduce((sum, c) => sum + parseFloat(c.amount as unknown as string), 0)
          .toFixed(2);

        // Count by region
        const membersByRegion: Record<string, number> = {};
        members.forEach(m => {
          membersByRegion[m.commune] = (membersByRegion[m.commune] || 0) + 1;
        });

        // Count by role
        const membersByRole: Record<string, number> = {};
        members.forEach(m => {
          membersByRole[m.role] = (membersByRole[m.role] || 0) + 1;
        });

        // Recent activity
        const recentActivity = members
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 10)
          .map(m => ({
            type: 'member_signup',
            name: m.fullName,
            timestamp: m.createdAt,
          }));

        const statistics = {
          totalMembers: members.length,
          activeMembers,
          pendingMembers,
          totalCotisations,
          monthlyRevenue,
          membersByRegion,
          membersByRole,
          recentActivity,
        };

        app.logger.info(
          { adminId: admin.userId, totalMembers: members.length },
          'Admin statistics calculated'
        );

        return statistics;
      } catch (error) {
        app.logger.error(
          { err: error, adminId: admin.userId },
          'Failed to fetch admin statistics'
        );
        throw error;
      }
    }
  );
}
