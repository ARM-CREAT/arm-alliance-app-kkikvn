import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { eq } from 'drizzle-orm';
import * as schema from '../db/schema.js';
import type { App } from '../index.js';
import { verifyAdminAuth } from '../utils/adminAuth.js';

interface NewsBody {
  title: string;
  content: string;
  imageUrl?: string;
  videoUrl?: string;
}

interface EventBody {
  title: string;
  description: string;
  date: string;
  location: string;
  imageUrl?: string;
}

interface LeadershipBody {
  name: string;
  position: string;
  phone?: string;
  address?: string;
  location?: string;
  order?: number;
}

interface ProgramBody {
  category: string;
  title: string;
  description: string;
  order?: number;
}

export function register(app: App, fastify: FastifyInstance) {
  // Admin News Management

  // POST /api/admin/news - Create news article
  fastify.post<{ Body: NewsBody }>(
    '/api/admin/news',
    {
      schema: {
        description: 'Create a news article (admin only)',
        tags: ['admin', 'news'],
        body: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            content: { type: 'string' },
            imageUrl: { type: 'string' },
            videoUrl: { type: 'string' },
          },
          required: ['title', 'content'],
        },
        response: {
          200: { type: 'object' },
        },
      },
    },
    async (request: FastifyRequest<{ Body: NewsBody }>, reply: FastifyReply) => {
      const admin = await verifyAdminAuth(request, reply, app);
      if (!admin) return;

      const { title, content, imageUrl, videoUrl } = request.body;
      app.logger.info({ title, adminId: admin.userId }, 'Admin creating news');

      try {
        const result = await app.db
          .insert(schema.news)
          .values({
            title,
            content,
            imageUrl,
            videoUrl,
            createdBy: admin.username,
          })
          .returning();

        app.logger.info(
          { newsId: result[0].id, adminId: admin.userId },
          'News article created by admin'
        );
        return result[0];
      } catch (error) {
        app.logger.error(
          { err: error, title, adminId: admin.userId },
          'Failed to create news article'
        );
        throw error;
      }
    }
  );

  // PUT /api/admin/news/:id - Update news article
  fastify.put<{ Params: { id: string }; Body: Partial<NewsBody> }>(
    '/api/admin/news/:id',
    {
      schema: {
        description: 'Update a news article (admin only)',
        tags: ['admin', 'news'],
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
            content: { type: 'string' },
            imageUrl: { type: 'string' },
            videoUrl: { type: 'string' },
          },
        },
        response: {
          200: { type: 'object' },
        },
      },
    },
    async (
      request: FastifyRequest<{ Params: { id: string }; Body: Partial<NewsBody> }>,
      reply: FastifyReply
    ) => {
      const admin = await verifyAdminAuth(request, reply, app);
      if (!admin) return;

      const { id } = request.params;
      const updates = request.body;
      app.logger.info({ newsId: id, adminId: admin.userId }, 'Admin updating news');

      try {
        const result = await app.db
          .update(schema.news)
          .set(updates)
          .where(eq(schema.news.id, id))
          .returning();

        app.logger.info(
          { newsId: id, adminId: admin.userId },
          'News article updated by admin'
        );
        return result[0];
      } catch (error) {
        app.logger.error(
          { err: error, newsId: id, adminId: admin.userId },
          'Failed to update news article'
        );
        throw error;
      }
    }
  );

  // DELETE /api/admin/news/:id - Delete news article
  fastify.delete<{ Params: { id: string } }>(
    '/api/admin/news/:id',
    {
      schema: {
        description: 'Delete a news article (admin only)',
        tags: ['admin', 'news'],
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
      app.logger.info({ newsId: id, adminId: admin.userId }, 'Admin deleting news');

      try {
        const result = await app.db
          .delete(schema.news)
          .where(eq(schema.news.id, id))
          .returning();

        app.logger.info(
          { newsId: id, adminId: admin.userId },
          'News article deleted by admin'
        );
        return { success: true };
      } catch (error) {
        app.logger.error(
          { err: error, newsId: id, adminId: admin.userId },
          'Failed to delete news article'
        );
        throw error;
      }
    }
  );

  // Admin Events Management

  // POST /api/admin/events - Create event
  fastify.post<{ Body: EventBody }>(
    '/api/admin/events',
    {
      schema: {
        description: 'Create an event (admin only)',
        tags: ['admin', 'events'],
        body: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            description: { type: 'string' },
            date: { type: 'string' },
            location: { type: 'string' },
            imageUrl: { type: 'string' },
          },
          required: ['title', 'description', 'date', 'location'],
        },
        response: {
          200: { type: 'object' },
        },
      },
    },
    async (request: FastifyRequest<{ Body: EventBody }>, reply: FastifyReply) => {
      const admin = await verifyAdminAuth(request, reply, app);
      if (!admin) return;

      const { title, description, date, location, imageUrl } = request.body;
      app.logger.info({ title, adminId: admin.userId }, 'Admin creating event');

      try {
        const result = await app.db
          .insert(schema.events)
          .values({
            title,
            description,
            date: new Date(date),
            location,
            imageUrl,
            createdBy: admin.username,
          })
          .returning();

        app.logger.info(
          { eventId: result[0].id, adminId: admin.userId },
          'Event created by admin'
        );
        return result[0];
      } catch (error) {
        app.logger.error(
          { err: error, title, adminId: admin.userId },
          'Failed to create event'
        );
        throw error;
      }
    }
  );

  // PUT /api/admin/events/:id - Update event
  fastify.put<{ Params: { id: string }; Body: Partial<EventBody> }>(
    '/api/admin/events/:id',
    {
      schema: {
        description: 'Update an event (admin only)',
        tags: ['admin', 'events'],
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
            date: { type: 'string' },
            location: { type: 'string' },
            imageUrl: { type: 'string' },
          },
        },
        response: {
          200: { type: 'object' },
        },
      },
    },
    async (
      request: FastifyRequest<{ Params: { id: string }; Body: Partial<EventBody> }>,
      reply: FastifyReply
    ) => {
      const admin = await verifyAdminAuth(request, reply, app);
      if (!admin) return;

      const { id } = request.params;
      const updates = {
        ...request.body,
        ...(request.body.date && { date: new Date(request.body.date) }),
      };

      app.logger.info({ eventId: id, adminId: admin.userId }, 'Admin updating event');

      try {
        const result = await app.db
          .update(schema.events)
          .set(updates)
          .where(eq(schema.events.id, id))
          .returning();

        app.logger.info(
          { eventId: id, adminId: admin.userId },
          'Event updated by admin'
        );
        return result[0];
      } catch (error) {
        app.logger.error(
          { err: error, eventId: id, adminId: admin.userId },
          'Failed to update event'
        );
        throw error;
      }
    }
  );

  // DELETE /api/admin/events/:id - Delete event
  fastify.delete<{ Params: { id: string } }>(
    '/api/admin/events/:id',
    {
      schema: {
        description: 'Delete an event (admin only)',
        tags: ['admin', 'events'],
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
      app.logger.info({ eventId: id, adminId: admin.userId }, 'Admin deleting event');

      try {
        await app.db
          .delete(schema.events)
          .where(eq(schema.events.id, id));

        app.logger.info(
          { eventId: id, adminId: admin.userId },
          'Event deleted by admin'
        );
        return { success: true };
      } catch (error) {
        app.logger.error(
          { err: error, eventId: id, adminId: admin.userId },
          'Failed to delete event'
        );
        throw error;
      }
    }
  );

  // Admin Leadership Management

  // POST /api/admin/leadership - Create leadership member
  fastify.post<{ Body: LeadershipBody }>(
    '/api/admin/leadership',
    {
      schema: {
        description: 'Create a leadership member (admin only)',
        tags: ['admin', 'leadership'],
        body: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            position: { type: 'string' },
            phone: { type: 'string' },
            address: { type: 'string' },
            location: { type: 'string' },
            order: { type: 'number' },
          },
          required: ['name', 'position'],
        },
        response: {
          200: { type: 'object' },
        },
      },
    },
    async (request: FastifyRequest<{ Body: LeadershipBody }>, reply: FastifyReply) => {
      const admin = await verifyAdminAuth(request, reply, app);
      if (!admin) return;

      const { name, position, phone, address, location, order } = request.body;
      app.logger.info({ position, adminId: admin.userId }, 'Admin creating leadership');

      try {
        const result = await app.db
          .insert(schema.leadership)
          .values({
            name,
            position,
            phone,
            address,
            location,
            order: order || 0,
            createdBy: admin.username,
          })
          .returning();

        app.logger.info(
          { leaderId: result[0].id, adminId: admin.userId },
          'Leadership member created by admin'
        );
        return result[0];
      } catch (error) {
        app.logger.error(
          { err: error, position, adminId: admin.userId },
          'Failed to create leadership member'
        );
        throw error;
      }
    }
  );

  // PUT /api/admin/leadership/:id - Update leadership member
  fastify.put<{ Params: { id: string }; Body: Partial<LeadershipBody> }>(
    '/api/admin/leadership/:id',
    {
      schema: {
        description: 'Update a leadership member (admin only)',
        tags: ['admin', 'leadership'],
        params: {
          type: 'object',
          properties: {
            id: { type: 'string' },
          },
        },
        body: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            position: { type: 'string' },
            phone: { type: 'string' },
            address: { type: 'string' },
            location: { type: 'string' },
            order: { type: 'number' },
          },
        },
        response: {
          200: { type: 'object' },
        },
      },
    },
    async (
      request: FastifyRequest<{ Params: { id: string }; Body: Partial<LeadershipBody> }>,
      reply: FastifyReply
    ) => {
      const admin = await verifyAdminAuth(request, reply, app);
      if (!admin) return;

      const { id } = request.params;
      const updates = request.body;
      app.logger.info({ leaderId: id, adminId: admin.userId }, 'Admin updating leadership');

      try {
        const result = await app.db
          .update(schema.leadership)
          .set(updates)
          .where(eq(schema.leadership.id, id))
          .returning();

        app.logger.info(
          { leaderId: id, adminId: admin.userId },
          'Leadership member updated by admin'
        );
        return result[0];
      } catch (error) {
        app.logger.error(
          { err: error, leaderId: id, adminId: admin.userId },
          'Failed to update leadership member'
        );
        throw error;
      }
    }
  );

  // DELETE /api/admin/leadership/:id - Delete leadership member
  fastify.delete<{ Params: { id: string } }>(
    '/api/admin/leadership/:id',
    {
      schema: {
        description: 'Delete a leadership member (admin only)',
        tags: ['admin', 'leadership'],
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
      app.logger.info({ leaderId: id, adminId: admin.userId }, 'Admin deleting leadership');

      try {
        await app.db
          .delete(schema.leadership)
          .where(eq(schema.leadership.id, id));

        app.logger.info(
          { leaderId: id, adminId: admin.userId },
          'Leadership member deleted by admin'
        );
        return { success: true };
      } catch (error) {
        app.logger.error(
          { err: error, leaderId: id, adminId: admin.userId },
          'Failed to delete leadership member'
        );
        throw error;
      }
    }
  );

  // Admin Program Management

  // POST /api/admin/program - Create program item
  fastify.post<{ Body: ProgramBody }>(
    '/api/admin/program',
    {
      schema: {
        description: 'Create a program item (admin only)',
        tags: ['admin', 'program'],
        body: {
          type: 'object',
          properties: {
            category: { type: 'string' },
            title: { type: 'string' },
            description: { type: 'string' },
            order: { type: 'number' },
          },
          required: ['category', 'title', 'description'],
        },
        response: {
          200: { type: 'object' },
        },
      },
    },
    async (request: FastifyRequest<{ Body: ProgramBody }>, reply: FastifyReply) => {
      const admin = await verifyAdminAuth(request, reply, app);
      if (!admin) return;

      const { category, title, description, order } = request.body;
      app.logger.info({ category, adminId: admin.userId }, 'Admin creating program');

      try {
        const result = await app.db
          .insert(schema.politicalProgram)
          .values({
            category,
            title,
            description,
            order: order || 0,
            createdBy: admin.username,
          })
          .returning();

        app.logger.info(
          { programId: result[0].id, adminId: admin.userId },
          'Program item created by admin'
        );
        return result[0];
      } catch (error) {
        app.logger.error(
          { err: error, category, adminId: admin.userId },
          'Failed to create program item'
        );
        throw error;
      }
    }
  );

  // PUT /api/admin/program/:id - Update program item
  fastify.put<{ Params: { id: string }; Body: Partial<ProgramBody> }>(
    '/api/admin/program/:id',
    {
      schema: {
        description: 'Update a program item (admin only)',
        tags: ['admin', 'program'],
        params: {
          type: 'object',
          properties: {
            id: { type: 'string' },
          },
        },
        body: {
          type: 'object',
          properties: {
            category: { type: 'string' },
            title: { type: 'string' },
            description: { type: 'string' },
            order: { type: 'number' },
          },
        },
        response: {
          200: { type: 'object' },
        },
      },
    },
    async (
      request: FastifyRequest<{ Params: { id: string }; Body: Partial<ProgramBody> }>,
      reply: FastifyReply
    ) => {
      const admin = await verifyAdminAuth(request, reply, app);
      if (!admin) return;

      const { id } = request.params;
      const updates = request.body;
      app.logger.info({ programId: id, adminId: admin.userId }, 'Admin updating program');

      try {
        const result = await app.db
          .update(schema.politicalProgram)
          .set(updates)
          .where(eq(schema.politicalProgram.id, id))
          .returning();

        app.logger.info(
          { programId: id, adminId: admin.userId },
          'Program item updated by admin'
        );
        return result[0];
      } catch (error) {
        app.logger.error(
          { err: error, programId: id, adminId: admin.userId },
          'Failed to update program item'
        );
        throw error;
      }
    }
  );

  // DELETE /api/admin/program/:id - Delete program item
  fastify.delete<{ Params: { id: string } }>(
    '/api/admin/program/:id',
    {
      schema: {
        description: 'Delete a program item (admin only)',
        tags: ['admin', 'program'],
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
      app.logger.info({ programId: id, adminId: admin.userId }, 'Admin deleting program');

      try {
        await app.db
          .delete(schema.politicalProgram)
          .where(eq(schema.politicalProgram.id, id));

        app.logger.info(
          { programId: id, adminId: admin.userId },
          'Program item deleted by admin'
        );
        return { success: true };
      } catch (error) {
        app.logger.error(
          { err: error, programId: id, adminId: admin.userId },
          'Failed to delete program item'
        );
        throw error;
      }
    }
  );
}
