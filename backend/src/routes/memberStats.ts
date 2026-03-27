import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { eq, count, desc, isNotNull, gte, sql } from 'drizzle-orm';
import * as schema from '../db/schema.js';
import type { App } from '../index.js';

export function register(app: App, fastify: FastifyInstance) {
  // GET /api/stats/members - Get member statistics
  fastify.get(
    '/api/stats/members',
    {
      schema: {
        description: 'Get member statistics',
        tags: ['stats'],
        response: {
          200: {
            type: 'object',
            properties: {
              total: { type: 'number' },
              active: { type: 'number' },
              pending: { type: 'number' },
              suspended: { type: 'number' },
              by_region: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    region: { type: 'string' },
                    count: { type: 'number' },
                  },
                },
              },
              by_gender: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    gender: { type: 'string' },
                    count: { type: 'number' },
                  },
                },
              },
              recent_registrations: { type: 'number' },
              members_list: {
                type: 'array',
                items: { type: 'object' },
              },
            },
          },
          500: { type: 'object', properties: { error: { type: 'string' } } },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      app.logger.info('Fetching member statistics');

      try {
        // Total members
        const totalResult = await app.db
          .select({ count: count() })
          .from(schema.members);
        const total = totalResult[0]?.count || 0;

        // Active members
        const activeResult = await app.db
          .select({ count: count() })
          .from(schema.members)
          .where(eq(schema.members.status, 'active'));
        const active = activeResult[0]?.count || 0;

        // Pending members
        const pendingResult = await app.db
          .select({ count: count() })
          .from(schema.members)
          .where(eq(schema.members.status, 'pending'));
        const pending = pendingResult[0]?.count || 0;

        // Suspended members
        const suspendedResult = await app.db
          .select({ count: count() })
          .from(schema.members)
          .where(eq(schema.members.status, 'suspended'));
        const suspended = suspendedResult[0]?.count || 0;

        // By region
        const byRegionResults = await app.db
          .select({
            region: schema.members.region,
            count: count(),
          })
          .from(schema.members)
          .where(isNotNull(schema.members.region))
          .groupBy(schema.members.region)
          .orderBy(desc(count()));

        const byRegion = byRegionResults.map(r => ({
          region: r.region || 'Unknown',
          count: r.count,
        }));

        // By gender
        const byGenderResults = await app.db
          .select({
            gender: schema.members.gender,
            count: count(),
          })
          .from(schema.members)
          .where(isNotNull(schema.members.gender))
          .groupBy(schema.members.gender)
          .orderBy(desc(count()));

        const byGender = byGenderResults.map(g => ({
          gender: g.gender || 'Unknown',
          count: g.count,
        }));

        // Recent registrations (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const recentResult = await app.db
          .select({ count: count() })
          .from(schema.members)
          .where(gte(schema.members.createdAt, thirtyDaysAgo));
        const recentRegistrations = recentResult[0]?.count || 0;

        // All members list
        const membersList = await app.db
          .select()
          .from(schema.members)
          .orderBy(desc(schema.members.createdAt));

        const formattedMembers = membersList.map(m => ({
          id: m.id,
          member_number: m.memberNumber,
          full_name: m.fullName,
          region: m.region,
          commune: m.commune,
          status: m.status,
          created_at: m.createdAt.toISOString(),
        }));

        app.logger.info(
          { total, active, pending, suspended, recent: recentRegistrations },
          'Member statistics retrieved'
        );

        return {
          total,
          active,
          pending,
          suspended,
          by_region: byRegion,
          by_gender: byGender,
          recent_registrations: recentRegistrations,
          members_list: formattedMembers,
        };
      } catch (error) {
        app.logger.error({ err: error }, 'Failed to fetch member statistics');
        reply.status(500);
        return { error: 'Failed to fetch member statistics' };
      }
    }
  );
}
