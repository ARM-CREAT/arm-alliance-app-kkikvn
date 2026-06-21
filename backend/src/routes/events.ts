import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { eq, asc, count, desc, gte } from 'drizzle-orm';
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
        title: 'Congrès National ARM 2025',
        description: 'Grand congrès annuel de l\'Alliance pour la République et la Modernité. Rassemblement des délégués de toutes les régions du Mali.',
        date: new Date('2025-09-15T09:00:00Z'),
        location: 'Bamako, Palais des Congrès',
        imageUrl: 'https://picsum.photos/seed/event1/800/400',
        createdBy: 'system',
      },
      {
        title: 'Assemblée Régionale de Kayes',
        description: 'Réunion des membres ARM de la région de Kayes pour discuter des enjeux locaux et préparer les prochaines élections.',
        date: new Date('2025-10-20T10:00:00Z'),
        location: 'Kayes, Maison des Jeunes',
        imageUrl: 'https://picsum.photos/seed/event2/800/400',
        createdBy: 'system',
      },
      {
        title: 'Forum Jeunesse ARM 2026',
        description: 'Forum national dédié à la jeunesse ARM. Ateliers, débats et élection du bureau national des jeunes.',
        date: new Date('2026-02-10T08:00:00Z'),
        location: 'Sikasso, Centre Culturel',
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
  fastify.get<{ Querystring: { page?: string; limit?: string; upcoming?: string } }>(
    '/api/events',
    {
      schema: {
        description: 'Get all events ordered by date (paginated). Use ?upcoming=true to filter future events, ?limit=N for page size (default 20), ?page=N for pagination.',
        tags: ['events'],
        querystring: {
          type: 'object',
          properties: {
            page: { type: 'string', default: '1', description: 'Page number (default 1)' },
            limit: { type: 'string', default: '20', description: 'Items per page (default 20)' },
            upcoming: { type: 'string', description: 'Filter upcoming events: true or false' },
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
    async (request: FastifyRequest<{ Querystring: { page?: string; limit?: string; upcoming?: string } }>, reply) => {
      const page = Math.max(1, parseInt(request.query.page || '1', 10));
      const pageLimit = Math.max(1, parseInt(request.query.limit || '20', 10));
      const offsetValue = (page - 1) * pageLimit;
      const upcoming = request.query.upcoming === 'true';

      app.logger.info({ page, limit: pageLimit, upcoming }, 'Fetching events');

      try {
        const now = new Date();

        // Build query with conditional filter
        const whereCondition = upcoming ? gte(schema.events.date, now) : undefined;

        const totalResult = whereCondition
          ? await app.db.select({ count: count() }).from(schema.events).where(whereCondition)
          : await app.db.select({ count: count() }).from(schema.events);
        const total = totalResult[0]?.count || 0;

        // Build result query
        const orderBy = upcoming ? asc(schema.events.date) : desc(schema.events.date);
        const resultQuery = whereCondition
          ? await app.db.select().from(schema.events).where(whereCondition).orderBy(orderBy).limit(pageLimit).offset(offsetValue)
          : await app.db.select().from(schema.events).orderBy(orderBy).limit(pageLimit).offset(offsetValue);

        app.logger.info({ count: resultQuery.length, page, total, upcoming }, 'Events fetched successfully');
        return {
          data: resultQuery.map(formatEvent),
          page,
          limit: pageLimit,
          total,
        };
      } catch (error) {
        app.logger.error({ err: error, upcoming }, 'Failed to fetch events');
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
