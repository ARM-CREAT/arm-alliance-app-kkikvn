import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { eq } from 'drizzle-orm';
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
  if (password !== ADMIN_PASSWORD) {
    reply.status(401).send({
      error: 'Unauthorized',
      message: 'Invalid admin password',
    });
    return false;
  }
  return true;
}

function formatEvent(event: any) {
  return {
    id: event.id,
    title: event.title,
    description: event.description,
    date: event.date.toISOString(),
    location: event.location,
    imageUrl: event.imageUrl,
    createdAt: event.createdAt.toISOString(),
  };
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
          200: { type: 'array' },
        },
      },
    },
    async (request, reply) => {
      app.logger.info('Fetching events');

      try {
        const result = await app.db
          .select()
          .from(schema.events)
          .orderBy(schema.events.date);

        app.logger.info(
          { count: result.length },
          'Events fetched successfully'
        );
        return result.map(formatEvent);
      } catch (error) {
        app.logger.error({ err: error }, 'Failed to fetch events');
        throw error;
      }
    }
  );

  // POST /api/events - Create event (admin)
  fastify.post<{ Body: EventBody }>(
    '/api/events',
    {
      schema: {
        description: 'Create an event (requires admin password)',
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
        },
      },
    },
    async (request, reply) => {
      if (!verifyAdminPassword(request, reply)) return;

      const { title, description, date, location, imageUrl } = request.body;
      app.logger.info({ title, date }, 'Creating event');

      try {
        const result = await app.db
          .insert(schema.events)
          .values({
            title,
            description,
            date: new Date(date),
            location,
            imageUrl,
          })
          .returning();

        app.logger.info(
          { eventId: result[0].id, title },
          'Event created successfully'
        );
        reply.status(201);
        return formatEvent(result[0]);
      } catch (error) {
        app.logger.error({ err: error, title }, 'Failed to create event');
        throw error;
      }
    }
  );

  // PUT /api/events/:id - Update event (admin)
  fastify.put<{ Params: { id: string }; Body: Partial<EventBody> }>(
    '/api/events/:id',
    {
      schema: {
        description: 'Update an event (requires admin password)',
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
        },
      },
    },
    async (request, reply) => {
      if (!verifyAdminPassword(request, reply)) return;

      const { id } = request.params;
      const updates = request.body;

      // Convert date if provided
      const updatedData = {
        ...updates,
        ...(updates.date && { date: new Date(updates.date) }),
      };

      app.logger.info({ eventId: id }, 'Updating event');

      try {
        const result = await app.db
          .update(schema.events)
          .set(updatedData)
          .where(eq(schema.events.id, id))
          .returning();

        if (result.length === 0) {
          app.logger.warn({ eventId: id }, 'Event not found');
          reply.status(404);
          return { error: 'NotFound', message: 'Event not found' };
        }

        app.logger.info({ eventId: id }, 'Event updated successfully');
        return formatEvent(result[0]);
      } catch (error) {
        app.logger.error(
          { err: error, eventId: id },
          'Failed to update event'
        );
        throw error;
      }
    }
  );

  // DELETE /api/events/:id - Delete event (admin)
  fastify.delete<{ Params: { id: string } }>(
    '/api/events/:id',
    {
      schema: {
        description: 'Delete an event (requires admin password)',
        tags: ['events'],
        params: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
          },
        },
        response: {
          204: {},
          404: { type: 'object' },
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
          return { error: 'NotFound', message: 'Event not found' };
        }

        app.logger.info({ eventId: id }, 'Event deleted successfully');
        reply.status(204);
        return;
      } catch (error) {
        app.logger.error({ err: error, eventId: id }, 'Failed to delete event');
        throw error;
      }
    }
  );
}
