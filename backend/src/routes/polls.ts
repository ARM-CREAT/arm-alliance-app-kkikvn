import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { eq, desc, count, and } from 'drizzle-orm';
import * as schema from '../db/schema.js';
import type { App } from '../index.js';

export function register(app: App, fastify: FastifyInstance) {
  const requireAuth = app.requireAuth();

  // PUBLIC ENDPOINTS

  // GET /api/public/announcements
  fastify.get<{ Querystring: { limit?: string; offset?: string } }>(
    '/api/public/announcements',
    {
      schema: {
        description: 'Get published announcements',
        tags: ['announcements'],
        querystring: {
          type: 'object',
          properties: {
            limit: { type: 'string', default: '20' },
            offset: { type: 'string', default: '0' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              announcements: {
                type: 'array',
                items: { type: 'object' },
              },
              total: { type: 'number' },
            },
          },
        },
      },
    },
    async (request: FastifyRequest<{ Querystring: { limit?: string; offset?: string } }>, reply: FastifyReply) => {
      const pageLimit = Math.max(1, parseInt(request.query.limit || '20', 10));
      const pageOffset = Math.max(0, parseInt(request.query.offset || '0', 10));

      app.logger.info({ limit: pageLimit, offset: pageOffset }, 'Fetching published announcements');

      try {
        const totalResult = await app.db
          .select({ count: count() })
          .from(schema.announcements)
          .where(eq(schema.announcements.published, true));
        const total = totalResult[0]?.count || 0;

        const announcements = await app.db
          .select()
          .from(schema.announcements)
          .where(eq(schema.announcements.published, true))
          .orderBy(desc(schema.announcements.createdAt))
          .limit(pageLimit)
          .offset(pageOffset);

        app.logger.info({ count: announcements.length, total }, 'Announcements retrieved');

        return {
          announcements: announcements.map(a => ({
            id: a.id,
            title: a.title,
            body: a.body,
            priority: a.priority,
            published: a.published,
            created_at: a.createdAt.toISOString(),
            updated_at: a.updatedAt.toISOString(),
          })),
          total,
        };
      } catch (error) {
        app.logger.error({ err: error }, 'Failed to fetch announcements');
        throw error;
      }
    }
  );

  // GET /api/polls
  fastify.get<{ Querystring: { status?: string; limit?: string; offset?: string } }>(
    '/api/polls',
    {
      schema: {
        description: 'Get polls',
        tags: ['polls'],
        querystring: {
          type: 'object',
          properties: {
            status: { type: 'string' },
            limit: { type: 'string', default: '20' },
            offset: { type: 'string', default: '0' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              polls: { type: 'array', items: { type: 'object' } },
              total: { type: 'number' },
            },
          },
        },
      },
    },
    async (request: FastifyRequest<{ Querystring: { status?: string; limit?: string; offset?: string } }>, reply: FastifyReply) => {
      const { status } = request.query;
      const pageLimit = Math.max(1, parseInt(request.query.limit || '20', 10));
      const pageOffset = Math.max(0, parseInt(request.query.offset || '0', 10));

      app.logger.info({ status, limit: pageLimit, offset: pageOffset }, 'Fetching polls');

      try {
        const whereCondition = status ? eq(schema.polls.status, status) : undefined;

        const countResult = whereCondition
          ? await app.db
              .select({ count: count() })
              .from(schema.polls)
              .where(whereCondition)
          : await app.db.select({ count: count() }).from(schema.polls);
        const total = countResult[0]?.count || 0;

        const polls = whereCondition
          ? await app.db
              .select()
              .from(schema.polls)
              .where(whereCondition)
              .orderBy(desc(schema.polls.createdAt))
              .limit(pageLimit)
              .offset(pageOffset)
          : await app.db
              .select()
              .from(schema.polls)
              .orderBy(desc(schema.polls.createdAt))
              .limit(pageLimit)
              .offset(pageOffset);

        app.logger.info({ count: polls.length, total }, 'Polls retrieved');

        return {
          polls: polls.map(p => ({
            id: p.id,
            title: p.title,
            description: p.description,
            options: p.options,
            status: p.status,
            total_votes: p.totalVotes,
            created_by: p.createdBy,
            ends_at: p.endsAt ? p.endsAt.toISOString() : null,
            created_at: p.createdAt.toISOString(),
            updated_at: p.updatedAt.toISOString(),
          })),
          total,
        };
      } catch (error) {
        app.logger.error({ err: error }, 'Failed to fetch polls');
        throw error;
      }
    }
  );

  // GET /api/polls/:id
  fastify.get<{ Params: { id: string } }>(
    '/api/polls/:id',
    {
      schema: {
        description: 'Get poll by ID',
        tags: ['polls'],
        params: {
          type: 'object',
          required: ['id'],
          properties: { id: { type: 'string', format: 'uuid' } },
        },
        response: {
          200: { type: 'object' },
          404: { type: 'object', properties: { error: { type: 'string' } } },
        },
      },
    },
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const { id } = request.params;
      app.logger.info({ pollId: id }, 'Fetching poll');

      try {
        const polls = await app.db.select().from(schema.polls).where(eq(schema.polls.id, id));

        if (polls.length === 0) {
          app.logger.info({ pollId: id }, 'Poll not found');
          reply.status(404);
          return { error: 'Poll not found' };
        }

        const p = polls[0];
        app.logger.info({ pollId: id }, 'Poll retrieved');

        return {
          id: p.id,
          title: p.title,
          description: p.description,
          options: p.options,
          status: p.status,
          total_votes: p.totalVotes,
          created_by: p.createdBy,
          ends_at: p.endsAt ? p.endsAt.toISOString() : null,
          created_at: p.createdAt.toISOString(),
          updated_at: p.updatedAt.toISOString(),
        };
      } catch (error) {
        app.logger.error({ err: error, pollId: id }, 'Failed to fetch poll');
        throw error;
      }
    }
  );

  // POST /api/polls/:id/vote
  fastify.post<{ Params: { id: string }; Body: { optionId: string } }>(
    '/api/polls/:id/vote',
    {
      schema: {
        description: 'Vote on a poll option',
        tags: ['polls'],
        params: {
          type: 'object',
          required: ['id'],
          properties: { id: { type: 'string', format: 'uuid' } },
        },
        body: {
          type: 'object',
          required: ['optionId'],
          properties: { optionId: { type: 'string' } },
        },
        response: {
          200: { type: 'object' },
          400: { type: 'object', properties: { error: { type: 'string' } } },
          404: { type: 'object', properties: { error: { type: 'string' } } },
        },
      },
    },
    async (request: FastifyRequest<{ Params: { id: string }; Body: { optionId: string } }>, reply: FastifyReply) => {
      const { id } = request.params;
      const { optionId } = request.body;

      app.logger.info({ pollId: id, optionId }, 'Processing poll vote');

      try {
        const polls = await app.db.select().from(schema.polls).where(eq(schema.polls.id, id));

        if (polls.length === 0) {
          app.logger.info({ pollId: id }, 'Poll not found');
          reply.status(404);
          return { error: 'Poll not found' };
        }

        const poll = polls[0];

        if (poll.status === 'closed') {
          app.logger.warn({ pollId: id }, 'Poll is closed');
          reply.status(400);
          return { error: 'Poll is closed' };
        }

        const options = poll.options as any[];
        const optionIndex = options.findIndex((o: any) => o.id === optionId);

        if (optionIndex === -1) {
          app.logger.warn({ pollId: id, optionId }, 'Invalid option ID');
          reply.status(400);
          return { error: 'Invalid option ID' };
        }

        // Update option votes and total votes
        options[optionIndex].votes = (options[optionIndex].votes || 0) + 1;
        const newTotalVotes = poll.totalVotes + 1;

        const updated = await app.db
          .update(schema.polls)
          .set({
            options,
            totalVotes: newTotalVotes,
            updatedAt: new Date(),
          })
          .where(eq(schema.polls.id, id))
          .returning();

        const p = updated[0];
        app.logger.info({ pollId: id, optionId }, 'Vote recorded');

        return {
          id: p.id,
          title: p.title,
          description: p.description,
          options: p.options,
          status: p.status,
          total_votes: p.totalVotes,
          created_by: p.createdBy,
          ends_at: p.endsAt ? p.endsAt.toISOString() : null,
          created_at: p.createdAt.toISOString(),
          updated_at: p.updatedAt.toISOString(),
        };
      } catch (error) {
        app.logger.error({ err: error, pollId: id }, 'Failed to record vote');
        throw error;
      }
    }
  );

  // ADMIN ENDPOINTS

  // GET /api/admin/polls
  fastify.get<{ Querystring: { status?: string; limit?: string; offset?: string } }>(
    '/api/admin/polls',
    {
      schema: {
        description: 'Get polls (admin)',
        tags: ['admin', 'polls'],
        querystring: {
          type: 'object',
          properties: {
            status: { type: 'string' },
            limit: { type: 'string', default: '20' },
            offset: { type: 'string', default: '0' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              polls: { type: 'array', items: { type: 'object' } },
              total: { type: 'number' },
            },
          },
          401: { type: 'object', properties: { error: { type: 'string' } } },
        },
      },
    },
    async (request: FastifyRequest<{ Querystring: { status?: string; limit?: string; offset?: string } }>, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      const { status } = request.query;
      const pageLimit = Math.max(1, parseInt(request.query.limit || '20', 10));
      const pageOffset = Math.max(0, parseInt(request.query.offset || '0', 10));

      app.logger.info({ userId: session.user.id, status }, 'Admin fetching polls');

      try {
        const whereCondition = status ? eq(schema.polls.status, status) : undefined;

        const countResult = whereCondition
          ? await app.db
              .select({ count: count() })
              .from(schema.polls)
              .where(whereCondition)
          : await app.db.select({ count: count() }).from(schema.polls);
        const total = countResult[0]?.count || 0;

        const polls = whereCondition
          ? await app.db
              .select()
              .from(schema.polls)
              .where(whereCondition)
              .orderBy(desc(schema.polls.createdAt))
              .limit(pageLimit)
              .offset(pageOffset)
          : await app.db
              .select()
              .from(schema.polls)
              .orderBy(desc(schema.polls.createdAt))
              .limit(pageLimit)
              .offset(pageOffset);

        return {
          polls: polls.map(p => ({
            id: p.id,
            title: p.title,
            description: p.description,
            options: p.options,
            status: p.status,
            total_votes: p.totalVotes,
            created_by: p.createdBy,
            ends_at: p.endsAt ? p.endsAt.toISOString() : null,
            created_at: p.createdAt.toISOString(),
            updated_at: p.updatedAt.toISOString(),
          })),
          total,
        };
      } catch (error) {
        app.logger.error({ err: error, userId: session.user.id }, 'Failed to fetch polls');
        throw error;
      }
    }
  );

  // POST /api/admin/polls
  fastify.post<{
    Body: { title: string; description?: string; options: Array<{ id: string; text: string }>; status?: string; ends_at?: string; created_by?: string };
  }>(
    '/api/admin/polls',
    {
      schema: {
        description: 'Create poll (admin)',
        tags: ['admin', 'polls'],
        body: {
          type: 'object',
          required: ['title', 'options'],
          properties: {
            title: { type: 'string' },
            description: { type: 'string' },
            options: {
              type: 'array',
              items: {
                type: 'object',
                required: ['id', 'text'],
                properties: {
                  id: { type: 'string' },
                  text: { type: 'string' },
                },
              },
            },
            status: { type: 'string' },
            ends_at: { type: 'string' },
            created_by: { type: 'string' },
          },
        },
        response: {
          201: { type: 'object' },
          401: { type: 'object', properties: { error: { type: 'string' } } },
        },
      },
    },
    async (
      request: FastifyRequest<{
        Body: { title: string; description?: string; options: Array<{ id: string; text: string }>; status?: string; ends_at?: string; created_by?: string };
      }>,
      reply: FastifyReply
    ) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      const { title, description, options, status, ends_at, created_by } = request.body;

      app.logger.info({ userId: session.user.id, title }, 'Admin creating poll');

      try {
        const optionsWithVotes = options.map((o: any) => ({
          id: o.id,
          text: o.text,
          votes: 0,
        }));

        const now = new Date();
        const result = await app.db
          .insert(schema.polls)
          .values({
            title,
            description: description || null,
            options: optionsWithVotes,
            status: status || 'active',
            totalVotes: 0,
            createdBy: created_by || null,
            endsAt: ends_at ? new Date(ends_at) : null,
            createdAt: now,
            updatedAt: now,
          })
          .returning();

        const p = result[0];
        app.logger.info({ userId: session.user.id, pollId: p.id }, 'Poll created');

        reply.status(201);
        return {
          id: p.id,
          title: p.title,
          description: p.description,
          options: p.options,
          status: p.status,
          total_votes: p.totalVotes,
          created_by: p.createdBy,
          ends_at: p.endsAt ? p.endsAt.toISOString() : null,
          created_at: p.createdAt.toISOString(),
          updated_at: p.updatedAt.toISOString(),
        };
      } catch (error) {
        app.logger.error({ err: error, userId: session.user.id }, 'Failed to create poll');
        throw error;
      }
    }
  );

  // PUT /api/admin/polls/:id
  fastify.put<{
    Params: { id: string };
    Body: { title?: string; description?: string; options?: Array<{ id: string; text: string; votes?: number }>; status?: string; ends_at?: string };
  }>(
    '/api/admin/polls/:id',
    {
      schema: {
        description: 'Update poll (admin)',
        tags: ['admin', 'polls'],
        params: {
          type: 'object',
          required: ['id'],
          properties: { id: { type: 'string', format: 'uuid' } },
        },
        body: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            description: { type: 'string' },
            options: { type: 'array', items: { type: 'object' } },
            status: { type: 'string' },
            ends_at: { type: 'string' },
          },
        },
        response: {
          200: { type: 'object' },
          401: { type: 'object', properties: { error: { type: 'string' } } },
          404: { type: 'object', properties: { error: { type: 'string' } } },
        },
      },
    },
    async (
      request: FastifyRequest<{
        Params: { id: string };
        Body: { title?: string; description?: string; options?: Array<{ id: string; text: string; votes?: number }>; status?: string; ends_at?: string };
      }>,
      reply: FastifyReply
    ) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      const { id } = request.params;
      const { title, description, options, status, ends_at } = request.body;

      app.logger.info({ userId: session.user.id, pollId: id }, 'Admin updating poll');

      try {
        const updates: any = {};
        if (title !== undefined) updates.title = title;
        if (description !== undefined) updates.description = description;
        if (options !== undefined) updates.options = options;
        if (status !== undefined) updates.status = status;
        if (ends_at !== undefined) updates.endsAt = new Date(ends_at);
        updates.updatedAt = new Date();

        const result = await app.db
          .update(schema.polls)
          .set(updates)
          .where(eq(schema.polls.id, id))
          .returning();

        if (result.length === 0) {
          app.logger.info({ pollId: id }, 'Poll not found');
          reply.status(404);
          return { error: 'Poll not found' };
        }

        const p = result[0];
        app.logger.info({ userId: session.user.id, pollId: id }, 'Poll updated');

        return {
          id: p.id,
          title: p.title,
          description: p.description,
          options: p.options,
          status: p.status,
          total_votes: p.totalVotes,
          created_by: p.createdBy,
          ends_at: p.endsAt ? p.endsAt.toISOString() : null,
          created_at: p.createdAt.toISOString(),
          updated_at: p.updatedAt.toISOString(),
        };
      } catch (error) {
        app.logger.error({ err: error, userId: session.user.id, pollId: id }, 'Failed to update poll');
        throw error;
      }
    }
  );

  // DELETE /api/admin/polls/:id
  fastify.delete<{ Params: { id: string } }>(
    '/api/admin/polls/:id',
    {
      schema: {
        description: 'Delete poll (admin)',
        tags: ['admin', 'polls'],
        params: {
          type: 'object',
          required: ['id'],
          properties: { id: { type: 'string', format: 'uuid' } },
        },
        response: {
          204: { description: 'Poll deleted' },
          401: { type: 'object', properties: { error: { type: 'string' } } },
          404: { type: 'object', properties: { error: { type: 'string' } } },
        },
      },
    },
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      const { id } = request.params;

      app.logger.info({ userId: session.user.id, pollId: id }, 'Admin deleting poll');

      try {
        const result = await app.db.delete(schema.polls).where(eq(schema.polls.id, id)).returning();

        if (result.length === 0) {
          app.logger.info({ pollId: id }, 'Poll not found');
          reply.status(404);
          return { error: 'Poll not found' };
        }

        app.logger.info({ userId: session.user.id, pollId: id }, 'Poll deleted');
        reply.status(204);
      } catch (error) {
        app.logger.error({ err: error, userId: session.user.id, pollId: id }, 'Failed to delete poll');
        throw error;
      }
    }
  );
}

// Seed function
export async function seedPolls(app: App) {
  try {
    const existing = await app.db.select({ count: count() }).from(schema.polls);
    const existingCount = existing[0]?.count || 0;

    if (existingCount === 0) {
      app.logger.info('Seeding polls table');

      const now = new Date();
      const seedData = [
        {
          id: undefined as any,
          title: 'Quelle est votre priorité pour le Mali ?',
          description: 'Dites-nous quelle est la priorité absolue pour le développement du Mali.',
          options: [
            { id: '1', text: 'Sécurité nationale', votes: 0 },
            { id: '2', text: 'Développement économique', votes: 0 },
            { id: '3', text: 'Éducation', votes: 0 },
            { id: '4', text: 'Santé publique', votes: 0 },
          ],
          status: 'active',
          totalVotes: 0,
          createdBy: null,
          endsAt: null,
          createdAt: now,
          updatedAt: now,
        },
        {
          id: undefined as any,
          title: 'Soutenez-vous l\'Alliance des États du Sahel ?',
          description: 'Partagez votre opinion sur l\'Alliance des États du Sahel.',
          options: [
            { id: '1', text: 'Oui, totalement', votes: 0 },
            { id: '2', text: 'Oui, avec réserves', votes: 0 },
            { id: '3', text: 'Non', votes: 0 },
          ],
          status: 'active',
          totalVotes: 0,
          createdBy: null,
          endsAt: null,
          createdAt: now,
          updatedAt: now,
        },
      ];

      await app.db.insert(schema.polls).values(seedData);
      app.logger.info({ count: seedData.length }, 'Polls seeded');
    }
  } catch (error) {
    app.logger.error({ err: error }, 'Failed to seed polls');
  }
}
