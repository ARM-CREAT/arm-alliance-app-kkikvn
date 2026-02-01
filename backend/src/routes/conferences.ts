import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { eq, gte } from 'drizzle-orm';
import * as schema from '../db/schema.js';
import type { App } from '../index.js';
import { verifyAdminAuth } from '../utils/adminAuth.js';

interface ConferenceBody {
  title: string;
  description?: string;
  scheduledAt: string;
  meetingUrl: string;
}

interface ConferenceUpdateBody {
  title?: string;
  description?: string;
  scheduledAt?: string;
  meetingUrl?: string;
  status?: 'scheduled' | 'active' | 'completed' | 'cancelled';
}

export function register(app: App, fastify: FastifyInstance) {
  // GET /api/conferences - Get all scheduled and active conferences
  fastify.get(
    '/api/conferences',
    {
      schema: {
        description: 'Get all scheduled and active video conferences',
        tags: ['conferences'],
        response: {
          200: { type: 'array' },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      app.logger.info('Fetching video conferences');

      try {
        const result = await app.db
          .select()
          .from(schema.videoConferences)
          .where(
            gte(
              schema.videoConferences.scheduledAt,
              new Date(Date.now() - 24 * 60 * 60 * 1000) // Show conferences from last 24 hours
            )
          )
          .orderBy(schema.videoConferences.scheduledAt);

        app.logger.info(
          { count: result.length },
          'Video conferences fetched successfully'
        );
        return result;
      } catch (error) {
        app.logger.error(
          { err: error },
          'Failed to fetch video conferences'
        );
        throw error;
      }
    }
  );

  // POST /api/admin/conferences - Create video conference (admin only)
  fastify.post<{ Body: ConferenceBody }>(
    '/api/admin/conferences',
    {
      schema: {
        description: 'Create a video conference (admin only)',
        tags: ['admin', 'conferences'],
        body: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            description: { type: 'string' },
            scheduledAt: { type: 'string' },
            meetingUrl: { type: 'string' },
          },
          required: ['title', 'scheduledAt', 'meetingUrl'],
        },
        response: {
          200: { type: 'object' },
        },
      },
    },
    async (request: FastifyRequest<{ Body: ConferenceBody }>, reply: FastifyReply) => {
      const admin = await verifyAdminAuth(request, reply, app);
      if (!admin) return;

      const { title, description, scheduledAt, meetingUrl } = request.body;
      app.logger.info(
        { title, adminId: admin.userId },
        'Admin creating video conference'
      );

      try {
        const result = await app.db
          .insert(schema.videoConferences)
          .values({
            title,
            description,
            scheduledAt: new Date(scheduledAt),
            meetingUrl,
            createdBy: admin.username,
          })
          .returning();

        app.logger.info(
          { conferenceId: result[0].id, adminId: admin.userId },
          'Video conference created by admin'
        );
        return result[0];
      } catch (error) {
        app.logger.error(
          { err: error, title, adminId: admin.userId },
          'Failed to create video conference'
        );
        throw error;
      }
    }
  );

  // PUT /api/admin/conferences/:id - Update video conference (admin only)
  fastify.put<{ Params: { id: string }; Body: ConferenceUpdateBody }>(
    '/api/admin/conferences/:id',
    {
      schema: {
        description: 'Update a video conference (admin only)',
        tags: ['admin', 'conferences'],
        params: {
          type: 'object',
          properties: {
            id: { type: 'string' },
          },
        },
        body: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            description: { type: 'string' },
            scheduledAt: { type: 'string' },
            meetingUrl: { type: 'string' },
            status: {
              type: 'string',
              enum: ['scheduled', 'active', 'completed', 'cancelled'],
            },
          },
        },
        response: {
          200: { type: 'object' },
        },
      },
    },
    async (
      request: FastifyRequest<{
        Params: { id: string };
        Body: ConferenceUpdateBody;
      }>,
      reply: FastifyReply
    ) => {
      const admin = await verifyAdminAuth(request, reply, app);
      if (!admin) return;

      const { id } = request.params;
      const updates = {
        ...request.body,
        ...(request.body.scheduledAt && {
          scheduledAt: new Date(request.body.scheduledAt),
        }),
      };

      app.logger.info(
        { conferenceId: id, adminId: admin.userId },
        'Admin updating video conference'
      );

      try {
        const result = await app.db
          .update(schema.videoConferences)
          .set(updates)
          .where(eq(schema.videoConferences.id, id))
          .returning();

        app.logger.info(
          { conferenceId: id, adminId: admin.userId },
          'Video conference updated by admin'
        );
        return result[0];
      } catch (error) {
        app.logger.error(
          { err: error, conferenceId: id, adminId: admin.userId },
          'Failed to update video conference'
        );
        throw error;
      }
    }
  );

  // DELETE /api/admin/conferences/:id - Delete video conference (admin only)
  fastify.delete<{ Params: { id: string } }>(
    '/api/admin/conferences/:id',
    {
      schema: {
        description: 'Delete a video conference (admin only)',
        tags: ['admin', 'conferences'],
        params: {
          type: 'object',
          properties: {
            id: { type: 'string' },
          },
        },
        response: {
          200: { type: 'object' },
        },
      },
    },
    async (
      request: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply
    ) => {
      const admin = await verifyAdminAuth(request, reply, app);
      if (!admin) return;

      const { id } = request.params;
      app.logger.info(
        { conferenceId: id, adminId: admin.userId },
        'Admin deleting video conference'
      );

      try {
        await app.db
          .delete(schema.videoConferences)
          .where(eq(schema.videoConferences.id, id));

        app.logger.info(
          { conferenceId: id, adminId: admin.userId },
          'Video conference deleted by admin'
        );
        return { success: true };
      } catch (error) {
        app.logger.error(
          { err: error, conferenceId: id, adminId: admin.userId },
          'Failed to delete video conference'
        );
        throw error;
      }
    }
  );
}
