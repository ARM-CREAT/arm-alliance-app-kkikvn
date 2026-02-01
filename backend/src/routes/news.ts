import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { eq } from 'drizzle-orm';
import * as schema from '../db/schema.js';
import type { App } from '../index.js';

interface NewsBody {
  title: string;
  content: string;
  imageUrl?: string;
  videoUrl?: string;
}

export function register(app: App, fastify: FastifyInstance) {
  const requireAuth = app.requireAuth();

  // GET /api/news - Get all news articles ordered by date
  fastify.get(
    '/api/news',
    {
      schema: {
        description: 'Get all news articles',
        tags: ['news'],
        response: {
          200: { type: 'array' },
        },
      },
    },
    async (request, reply) => {
      app.logger.info('Fetching news articles');

      try {
        const result = await app.db
          .select()
          .from(schema.news)
          .orderBy(schema.news.publishedAt);

        app.logger.info(
          { count: result.length },
          'News articles fetched successfully'
        );
        return result;
      } catch (error) {
        app.logger.error({ err: error }, 'Failed to fetch news articles');
        throw error;
      }
    }
  );

  // POST /api/news - Create news article (admin)
  fastify.post<{ Body: NewsBody }>(
    '/api/news',
    {
      schema: {
        description: 'Create a news article (admin only)',
        tags: ['news'],
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
    async (request, reply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      const { title, content, imageUrl, videoUrl } = request.body;
      app.logger.info({ title }, 'Creating news article');

      try {
        const result = await app.db
          .insert(schema.news)
          .values({
            title,
            content,
            imageUrl,
            videoUrl,
          })
          .returning();

        app.logger.info(
          { newsId: result[0].id, title },
          'News article created successfully'
        );
        return result[0];
      } catch (error) {
        app.logger.error(
          { err: error, title },
          'Failed to create news article'
        );
        throw error;
      }
    }
  );

  // PUT /api/news/:id - Update news article (admin)
  fastify.put<{ Params: { id: string }; Body: Partial<NewsBody> }>(
    '/api/news/:id',
    {
      schema: {
        description: 'Update a news article (admin only)',
        tags: ['news'],
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
    async (request, reply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      const { id } = request.params;
      const updates = request.body;
      app.logger.info({ newsId: id }, 'Updating news article');

      try {
        const result = await app.db
          .update(schema.news)
          .set(updates)
          .where(eq(schema.news.id, id))
          .returning();

        app.logger.info(
          { newsId: id },
          'News article updated successfully'
        );
        return result[0];
      } catch (error) {
        app.logger.error(
          { err: error, newsId: id },
          'Failed to update news article'
        );
        throw error;
      }
    }
  );

  // DELETE /api/news/:id - Delete news article (admin)
  fastify.delete<{ Params: { id: string } }>(
    '/api/news/:id',
    {
      schema: {
        description: 'Delete a news article (admin only)',
        tags: ['news'],
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
      app.logger.info({ newsId: id }, 'Deleting news article');

      try {
        const result = await app.db
          .delete(schema.news)
          .where(eq(schema.news.id, id))
          .returning();

        app.logger.info(
          { newsId: id },
          'News article deleted successfully'
        );
        return result[0];
      } catch (error) {
        app.logger.error(
          { err: error, newsId: id },
          'Failed to delete news article'
        );
        throw error;
      }
    }
  );
}
