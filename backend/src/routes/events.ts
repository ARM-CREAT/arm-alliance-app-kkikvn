import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { eq, desc } from 'drizzle-orm';
import * as schema from '../db/schema.js';
import type { App } from '../index.js';

interface EventBody {
  title: string;
  description: string;
  date: string;
  location: string;
  imageUrl?: string;
}

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

function verifyAdminPassword(request: FastifyRequest, reply: FastifyReply): boolean {
  const password = request.headers['x-admin-password'];
  if (!password || password !== ADMIN_PASSWORD) {
    reply.status(401).send({ error: 'Unauthorized' });
    return false;
  }
  return true;
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
    createdBy: event.createdBy || null,
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
  // GET /api/events - Get all events (public)
  fastify.get(
    '/api/events',
    {
      schema: {
        description: 'Get all events',
        tags: ['events'],
        response: {
          200: {
            type: 'object',
            properties: {
              events: { type: 'array' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      app.logger.info('Fetching all events');

      try {
        const result = await app.db
          .select()
          .from(schema.events)
          .orderBy(desc(schema.events.date));

        app.logger.info({ count: result.length }, 'Events fetched');
        return { events: result.map(formatEvent) };
      } catch (error) {
        app.logger.error({ err: error }, 'Failed to fetch events');
        throw error;
      }
    }
  );

  // POST /api/events - Create event (admin only)
  fastify.post<{ Body: EventBody }>(
    '/api/events',
    {
      schema: {
        description: 'Create an event (admin only)',
        tags: ['events'],
        body: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            description: { type: 'string' },
            date: { type: 'string', format: 'date-time' },
            location: { type: 'string' },
            imageUrl: { type: 'string' },
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
      if (!verifyAdminPassword(request, reply)) return;

      const { title, description, date, location, imageUrl } = request.body;

      if (!title || !description || !date || !location) {
        reply.status(400);
        return { error: 'Missing required fields' };
      }

      app.logger.info({ title }, 'Creating event');

      try {
        const result = await app.db
          .insert(schema.events)
          .values({
            title,
            description,
            date: new Date(date),
            location,
            imageUrl: imageUrl || null,
            createdBy: 'admin',
          })
          .returning();

        app.logger.info({ eventId: result[0].id }, 'Event created');
        reply.status(201);
        return { event: formatEvent(result[0]) };
      } catch (error) {
        app.logger.error({ err: error, title }, 'Failed to create event');
        throw error;
      }
    }
  );

  // PUT /api/events/:id - Update event (admin only)
  fastify.put<{ Params: { id: string }; Body: Partial<EventBody> }>(
    '/api/events/:id',
    {
      schema: {
        description: 'Update an event (admin only)',
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
      const updates: any = {};

      if (request.body.title) updates.title = request.body.title;
      if (request.body.description) updates.description = request.body.description;
      if (request.body.date) updates.date = new Date(request.body.date);
      if (request.body.location) updates.location = request.body.location;
      if (request.body.imageUrl !== undefined) updates.imageUrl = request.body.imageUrl;

      app.logger.info({ eventId: id }, 'Updating event');

      try {
        const result = await app.db
          .update(schema.events)
          .set(updates)
          .where(eq(schema.events.id, id))
          .returning();

        if (result.length === 0) {
          app.logger.warn({ eventId: id }, 'Event not found');
          reply.status(404);
          return { error: 'Not found' };
        }

        app.logger.info({ eventId: id }, 'Event updated');
        return { event: formatEvent(result[0]) };
      } catch (error) {
        app.logger.error({ err: error, eventId: id }, 'Failed to update event');
        throw error;
      }
    }
  );

  // DELETE /api/events/:id - Delete event (admin only)
  fastify.delete<{ Params: { id: string } }>(
    '/api/events/:id',
    {
      schema: {
        description: 'Delete an event (admin only)',
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
      if (!verifyAdminPassword(request, reply)) return;

      const { id } = request.params;
      app.logger.info({ eventId: id }, 'Deleting event');

      try {
        const result = await app.db
          .delete(schema.events)
          .where(eq(schema.events.id, id))
          .returning();

        if (result.length === 0) {
          app.logger.warn({ eventId: id }, 'Event not found');
          reply.status(404);
          return { error: 'Not found' };
        }

        app.logger.info({ eventId: id }, 'Event deleted');
        return { success: true };
      } catch (error) {
        app.logger.error({ err: error, eventId: id }, 'Failed to delete event');
        throw error;
      }
    }
  );
}
