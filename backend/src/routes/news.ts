import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { eq, desc } from 'drizzle-orm';
import * as schema from '../db/schema.js';
import type { App } from '../index.js';

interface NewsBody {
  title: string;
  content: string;
  publishedAt?: string;
  published_at?: string;
  imageUrl?: string;
  image_url?: string;
  videoUrl?: string;
  video_url?: string;
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

function formatNews(news: any) {
  const publishedAtISO = news.publishedAt instanceof Date ? news.publishedAt.toISOString() : new Date(news.publishedAt).toISOString();
  return {
    id: news.id,
    title: news.title,
    content: news.content,
    imageUrl: news.imageUrl || null,
    videoUrl: news.videoUrl || null,
    publishedAt: publishedAtISO,
    published_at: publishedAtISO,
  };
}

export function register(app: App, fastify: FastifyInstance) {
  // GET /api/news - Get all news articles ordered by published_at DESC (public)
  fastify.get(
    '/api/news',
    {
      schema: {
        description: 'Get all news articles ordered by published date',
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
          .orderBy(desc(schema.news.publishedAt));

        app.logger.info(
          { count: result.length },
          'News articles fetched successfully'
        );
        return result.map(formatNews);
      } catch (error) {
        app.logger.error({ err: error }, 'Failed to fetch news articles');
        throw error;
      }
    }
  );

  // GET /api/news/:id - Get single news article (public)
  fastify.get<{ Params: { id: string } }>(
    '/api/news/:id',
    {
      schema: {
        description: 'Get a single news article by ID',
        tags: ['news'],
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
      app.logger.info({ newsId: id }, 'Fetching news article');

      try {
        const result = await app.db
          .select()
          .from(schema.news)
          .where(eq(schema.news.id, id));

        if (result.length === 0) {
          app.logger.warn({ newsId: id }, 'News article not found');
          reply.status(404);
          return { error: 'News article not found' };
        }

        app.logger.info({ newsId: id }, 'News article fetched successfully');
        return formatNews(result[0]);
      } catch (error) {
        app.logger.error({ err: error, newsId: id }, 'Failed to fetch news article');
        throw error;
      }
    }
  );

  // POST /api/admin/news - Create news article (admin only)
  fastify.post<{ Body: NewsBody }>(
    '/api/admin/news',
    {
      schema: {
        description: 'Create a news article (admin only)',
        tags: ['news'],
        body: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            content: { type: 'string' },
            publishedAt: { type: 'string', format: 'date-time' },
            published_at: { type: 'string', format: 'date-time' },
            imageUrl: { type: 'string' },
            image_url: { type: 'string' },
            videoUrl: { type: 'string' },
            video_url: { type: 'string' },
          },
          required: ['title', 'content'],
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

      const body = request.body as any;
      const { title, content } = body;

      if (!title || !content) {
        app.logger.warn({ body }, 'Missing required fields for news creation');
        reply.status(400);
        return { error: 'Missing required fields: title, content' };
      }

      // Map camelCase to correct field names
      const imageUrl = body.imageUrl || body.image_url || null;
      const videoUrl = body.videoUrl || body.video_url || null;
      const publishedAtInput = body.publishedAt || body.published_at;
      const publishedAt = publishedAtInput ? new Date(publishedAtInput) : new Date();

      app.logger.info({ title }, 'Creating news article');

      try {
        const result = await app.db
          .insert(schema.news)
          .values({
            title,
            content,
            imageUrl,
            videoUrl,
            publishedAt,
            createdBy: 'admin',
          })
          .returning();

        app.logger.info(
          { newsId: result[0].id, title },
          'News article created successfully'
        );
        reply.status(201);
        return formatNews(result[0]);
      } catch (error) {
        app.logger.error(
          { err: error, title },
          'Failed to create news article'
        );
        throw error;
      }
    }
  );

  // PUT /api/admin/news/:id - Update news article (admin only)
  fastify.put<{ Params: { id: string }; Body: Partial<NewsBody> }>(
    '/api/admin/news/:id',
    {
      schema: {
        description: 'Update a news article (admin only)',
        tags: ['news'],
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
            content: { type: 'string' },
            publishedAt: { type: 'string', format: 'date-time' },
            published_at: { type: 'string', format: 'date-time' },
            imageUrl: { type: 'string' },
            image_url: { type: 'string' },
            videoUrl: { type: 'string' },
            video_url: { type: 'string' },
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
      const body = request.body as any;
      const updates: any = {};

      if (body.title !== undefined) updates.title = body.title;
      if (body.content !== undefined) updates.content = body.content;
      if (body.publishedAt !== undefined) updates.publishedAt = new Date(body.publishedAt);
      if (body.published_at !== undefined) updates.publishedAt = new Date(body.published_at);
      if (body.imageUrl !== undefined) updates.imageUrl = body.imageUrl;
      if (body.image_url !== undefined) updates.imageUrl = body.image_url;
      if (body.videoUrl !== undefined) updates.videoUrl = body.videoUrl;
      if (body.video_url !== undefined) updates.videoUrl = body.video_url;

      if (Object.keys(updates).length === 0) {
        app.logger.warn({ newsId: id }, 'No fields to update');
        reply.status(400);
        return { error: 'No fields to update' };
      }

      app.logger.info({ newsId: id }, 'Updating news article');

      try {
        const result = await app.db
          .update(schema.news)
          .set(updates)
          .where(eq(schema.news.id, id))
          .returning();

        if (result.length === 0) {
          app.logger.warn({ newsId: id }, 'News article not found');
          reply.status(404);
          return { error: 'News article not found' };
        }

        app.logger.info(
          { newsId: id },
          'News article updated successfully'
        );
        return formatNews(result[0]);
      } catch (error) {
        app.logger.error(
          { err: error, newsId: id },
          'Failed to update news article'
        );
        throw error;
      }
    }
  );

  // DELETE /api/admin/news/:id - Delete news article (admin only)
  fastify.delete<{ Params: { id: string } }>(
    '/api/admin/news/:id',
    {
      schema: {
        description: 'Delete a news article (admin only)',
        tags: ['news'],
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
      app.logger.info({ newsId: id }, 'Deleting news article');

      try {
        const result = await app.db
          .delete(schema.news)
          .where(eq(schema.news.id, id))
          .returning();

        if (result.length === 0) {
          app.logger.warn({ newsId: id }, 'News article not found');
          reply.status(404);
          return { error: 'News article not found' };
        }

        app.logger.info(
          { newsId: id },
          'News article deleted successfully'
        );
        return { success: true, message: 'News article deleted successfully' };
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
