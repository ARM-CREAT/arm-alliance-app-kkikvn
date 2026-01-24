import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { eq, gt } from 'drizzle-orm';
import * as schema from '../db/schema.js';
import type { App } from '../index.js';

interface EventBody {
  title: string;
  description: string;
  date: string;
  location: string;
  imageUrl?: string;
}

export function register(app: App, fastify: FastifyInstance) {
  const requireAuth = app.requireAuth();

  // GET /api/events - Get all upcoming events
  fastify.get(
    '/api/events',
    {
      schema: {
        description: 'Get all upcoming events',
        tags: ['events'],
        response: {
          200: { type: 'array' },
        },
      },
    },
    async (request, reply) => {
      app.logger.info('Fetching upcoming events');

      try {
        const result = await app.db
          .select()
          .from(schema.events)
          .where(gt(schema.events.date, new Date()))
          .orderBy(schema.events.date);

        app.logger.info(
          { count: result.length },
          'Events fetched successfully'
        );
        return result;
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
        description: 'Create an event (admin only)',
        tags: ['events'],
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
    async (request, reply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

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
        return result[0];
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
        description: 'Update an event (admin only)',
        tags: ['events'],
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
    async (request, reply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

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

        app.logger.info({ eventId: id }, 'Event updated successfully');
        return result[0];
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
        description: 'Delete an event (admin only)',
        tags: ['events'],
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
    async (request, reply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      const { id } = request.params;
      app.logger.info({ eventId: id }, 'Deleting event');

      try {
        const result = await app.db
          .delete(schema.events)
          .where(eq(schema.events.id, id))
          .returning();

        app.logger.info({ eventId: id }, 'Event deleted successfully');
        return result[0];
      } catch (error) {
        app.logger.error({ err: error, eventId: id }, 'Failed to delete event');
        throw error;
      }
    }
  );
}
