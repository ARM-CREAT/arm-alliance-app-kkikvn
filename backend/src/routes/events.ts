import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { eq, asc, count } from 'drizzle-orm';
import * as schema from '../db/schema.js';
import type { App } from '../index.js';

interface EventBody {
  title: string;
  description: string;
  date: string;
  location: string;
  imageUrl?: string;
  image_url?: string;
}

function formatEvent(event: any) {
  return {
    id: event.id,
    title: event.title,
    description: event.description,
    date: event.date instanceof Date ? event.date.toISOString() : new Date(event.date).toISOString(),
    location: event.location,
    imageUrl: event.imageUrl || null,
    createdAt: event.createdAt instanceof Date ? event.createdAt.toISOString() : new Date(event.createdAt).toISOString(),
  };
}

export async function seedEvents(app: App) {
  app.logger.info('Checking events table for seeding');
  try {
    const existing = await app.db.select().from(schema.events).limit(1);
    if (existing.length > 0) {
      app.logger.info('Events table already has data, skipping seed');
      return;
    }

    const sampleEvents = [
      {
        title: 'Congrès National de l\'Alliance ARM',
        description: 'Grand rassemblement des membres de l\'Alliance ARM pour discuter des orientations politiques.',
        date: new Date('2025-03-15'),
        location: 'Bamako, Mali',
        imageUrl: 'https://picsum.photos/seed/event1/800/400',
        createdBy: 'system',
      },
      {
        title: 'Meeting Régional de Sikasso',
        description: 'Rencontre des membres de la région de Sikasso pour renforcer l\'organisation locale.',
        date: new Date('2025-04-20'),
        location: 'Sikasso, Mali',
        imageUrl: 'https://picsum.photos/seed/event2/800/400',
        createdBy: 'system',
      },
      {
        title: 'Forum des Jeunes Alliance ARM',
        description: 'Forum dédié à la jeunesse militante de l\'Alliance ARM.',
        date: new Date('2025-05-10'),
        location: 'Mopti, Mali',
        imageUrl: 'https://picsum.photos/seed/event3/800/400',
        createdBy: 'system',
      },
    ];

    await app.db.insert(schema.events).values(sampleEvents);
    app.logger.info({ count: sampleEvents.length }, 'Events seeded successfully');
  } catch (error) {
    app.logger.error({ err: error }, 'Failed to seed events');
    throw error;
  }
}

export function register(app: App, fastify: FastifyInstance) {
  const requireAuth = app.requireAuth();
  // GET /api/events - Get all events (public, paginated)
  fastify.get<{ Querystring: { page?: string; limit?: string } }>(
    '/api/events',
    {
      schema: {
        description: 'Get all events ordered by date (paginated)',
        tags: ['events'],
        querystring: {
          type: 'object',
          properties: {
            page: { type: 'string', default: '1', description: 'Page number (default 1)' },
            limit: { type: 'string', default: '20', description: 'Items per page (default 20)' },
          },
        },
        response: {
          200: { type: 'object' },
        },
      },
    },
    async (request: FastifyRequest<{ Querystring: { page?: string; limit?: string } }>, reply) => {
      const page = Math.max(1, parseInt(request.query.page || '1', 10));
      const pageLimit = Math.max(1, parseInt(request.query.limit || '20', 10));
      const offsetValue = (page - 1) * pageLimit;

      app.logger.info({ page, limit: pageLimit }, 'Fetching events');

      try {
        const totalResult = await app.db.select({ count: count() }).from(schema.events);
        const total = totalResult[0]?.count || 0;

        const result = await app.db
          .select()
          .from(schema.events)
          .orderBy(asc(schema.events.date))
          .limit(pageLimit)
          .offset(offsetValue);

        app.logger.info({ count: result.length, page, total }, 'Events fetched successfully');
        return {
          success: true,
          data: result.map(formatEvent),
          page,
          limit: pageLimit,
          total,
        };
      } catch (error) {
        app.logger.error({ err: error }, 'Failed to fetch events');
        throw error;
      }
    }
  );

  // GET /api/events/:id - Get single event (public)
  fastify.get<{ Params: { id: string } }>(
    '/api/events/:id',
    {
      schema: {
        description: 'Get a single event by ID',
        tags: ['events'],
        params: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
          },
        },
        response: {
          200: { type: 'object' },
          404: { type: 'object' },
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params;
      app.logger.info({ eventId: id }, 'Fetching event');

      try {
        const result = await app.db
          .select()
          .from(schema.events)
          .where(eq(schema.events.id, id));

        if (result.length === 0) {
          app.logger.warn({ eventId: id }, 'Event not found');
          reply.status(404);
          return { success: false, error: 'Événement non trouvé' };
        }

        app.logger.info({ eventId: id }, 'Event fetched successfully');
        return { success: true, data: formatEvent(result[0]) };
      } catch (error) {
        app.logger.error({ err: error, eventId: id }, 'Failed to fetch event');
        throw error;
      }
    }
  );

  // POST /api/events - Create event (authenticated)
  fastify.post<{ Body: EventBody }>(
    '/api/events',
    {
      schema: {
        description: 'Create an event (authenticated)',
        tags: ['events'],
        body: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            description: { type: 'string' },
            date: { type: 'string', format: 'date-time' },
            location: { type: 'string' },
            imageUrl: { type: 'string' },
            image_url: { type: 'string' },
          },
          required: ['title', 'description', 'date', 'location'],
        },
        response: {
          201: { type: 'object' },
          400: { type: 'object' },
          401: { type: 'object' },
        },
      },
    },
    async (request, reply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      const { title, description, date, location, imageUrl, image_url } = request.body as any;

      if (!title || !description || !date || !location) {
        app.logger.warn({ body: request.body, userId: session.user.id }, 'Missing required fields for event creation');
        reply.status(400);
        return { success: false, error: 'Missing required fields: title, description, date, location' };
      }

      // Map imageUrl to image_url
      const finalImageUrl = imageUrl || image_url || null;

      app.logger.info({ title, location, userId: session.user.id }, 'Creating event');

      try {
        const result = await app.db
          .insert(schema.events)
          .values({
            title,
            description,
            date: new Date(date),
            location,
            imageUrl: finalImageUrl,
            createdBy: 'admin',
          })
          .returning();

        app.logger.info({ eventId: result[0].id, title, userId: session.user.id }, 'Event created successfully');
        reply.status(201);
        return {
          success: true,
          message: 'Événement créé avec succès',
          data: formatEvent(result[0]),
        };
      } catch (error) {
        app.logger.error({ err: error, title, userId: session.user.id }, 'Failed to create event');
        throw error;
      }
    }
  );

  // PUT /api/events/:id - Update event (authenticated)
  fastify.put<{ Params: { id: string }; Body: Partial<EventBody> }>(
    '/api/events/:id',
    {
      schema: {
        description: 'Update an event (authenticated)',
        tags: ['events'],
        params: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
          },
        },
        body: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            description: { type: 'string' },
            date: { type: 'string', format: 'date-time' },
            location: { type: 'string' },
            imageUrl: { type: 'string' },
            image_url: { type: 'string' },
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
      const session = await requireAuth(request, reply);
      if (!session) return;

      const { id } = request.params;
      const body = request.body as any;
      const updates: any = {};

      if (body.title !== undefined) updates.title = body.title;
      if (body.description !== undefined) updates.description = body.description;
      if (body.date !== undefined) updates.date = new Date(body.date);
      if (body.location !== undefined) updates.location = body.location;
      if (body.imageUrl !== undefined) updates.imageUrl = body.imageUrl;
      if (body.image_url !== undefined) updates.imageUrl = body.image_url;

      if (Object.keys(updates).length === 0) {
        app.logger.warn({ eventId: id, userId: session.user.id }, 'No fields to update');
        reply.status(400);
        return { success: false, error: 'No fields to update' };
      }

      app.logger.info({ eventId: id, userId: session.user.id }, 'Updating event');

      try {
        const result = await app.db
          .update(schema.events)
          .set(updates)
          .where(eq(schema.events.id, id))
          .returning();

        if (result.length === 0) {
          app.logger.warn({ eventId: id, userId: session.user.id }, 'Event not found');
          reply.status(404);
          return { success: false, error: 'Événement non trouvé' };
        }

        app.logger.info({ eventId: id, userId: session.user.id }, 'Event updated successfully');
        return {
          success: true,
          message: 'Événement mis à jour avec succès',
          data: formatEvent(result[0]),
        };
      } catch (error) {
        app.logger.error({ err: error, eventId: id, userId: session.user.id }, 'Failed to update event');
        throw error;
      }
    }
  );

  // DELETE /api/events/:id - Delete event (authenticated)
  fastify.delete<{ Params: { id: string } }>(
    '/api/events/:id',
    {
      schema: {
        description: 'Delete an event (authenticated)',
        tags: ['events'],
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
      const session = await requireAuth(request, reply);
      if (!session) return;

      const { id } = request.params;
      app.logger.info({ eventId: id, userId: session.user.id }, 'Deleting event');

      try {
        const result = await app.db
          .delete(schema.events)
          .where(eq(schema.events.id, id))
          .returning();

        if (result.length === 0) {
          app.logger.warn({ eventId: id, userId: session.user.id }, 'Event not found');
          reply.status(404);
          return { success: false, error: 'Événement non trouvé' };
        }

        app.logger.info({ eventId: id, userId: session.user.id }, 'Event deleted successfully');
        return { success: true, message: 'Événement supprimé' };
      } catch (error) {
        app.logger.error({ err: error, eventId: id, userId: session.user.id }, 'Failed to delete event');
        throw error;
      }
    }
  );
}
