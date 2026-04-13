import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { eq, desc, count } from 'drizzle-orm';
import * as schema from '../db/schema.js';
import type { App } from '../index.js';

interface CreateNewsBody {
  title: string;
  content: string;
  image_url?: string;
}

interface UpdateNewsBody {
  title?: string;
  content?: string;
  image_url?: string;
}

function verifyAdminPassword(request: FastifyRequest, reply: FastifyReply): boolean {
  const password = request.headers['x-admin-password'];
  if (!password || password !== 'admin123') {
    reply.status(401);
    return false;
  }
  return true;
}

export function register(app: App, fastify: FastifyInstance) {
  // GET /api/news - Get all news articles ordered by created_at DESC (paginated)
  fastify.get<{ Querystring: { page?: string; limit?: string } }>(
    '/api/news',
    {
      schema: {
        description: 'Get all news articles (paginated)',
        tags: ['news'],
        querystring: {
          type: 'object',
          properties: {
            page: { type: 'string', default: '1', description: 'Page number (default 1)' },
            limit: { type: 'string', default: '20', description: 'Items per page (default 20)' },
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
    async (request: FastifyRequest<{ Querystring: { page?: string; limit?: string } }>, reply: FastifyReply) => {
      const page = Math.max(1, parseInt(request.query.page || '1', 10));
      const pageLimit = Math.max(1, parseInt(request.query.limit || '20', 10));
      const offsetValue = (page - 1) * pageLimit;

      app.logger.info({ page, limit: pageLimit }, 'Fetching news articles');

      try {
        const totalResult = await app.db.select({ count: count() }).from(schema.apiNews);
        const total = totalResult[0]?.count || 0;

        const articles = await app.db
          .select()
          .from(schema.apiNews)
          .orderBy(desc(schema.apiNews.createdAt))
          .limit(pageLimit)
          .offset(offsetValue);

        app.logger.info({ count: articles.length, page, total }, 'News articles retrieved');

        return {
          data: articles.map(a => ({
            id: a.id,
            title: a.title,
            content: a.content,
            image_url: a.imageUrl,
            created_at: a.createdAt.toISOString(),
          })),
          page,
          limit: pageLimit,
          total,
        };
      } catch (error) {
        app.logger.error({ err: error }, 'Failed to fetch news articles');
        throw error;
      }
    }
  );

  // POST /api/news - Create news article (admin only)
  fastify.post<{ Body: CreateNewsBody }>(
    '/api/news',
    {
      schema: {
        description: 'Create news article (admin only)',
        tags: ['news'],
        body: {
          type: 'object',
          required: ['title', 'content'],
          properties: {
            title: { type: 'string' },
            content: { type: 'string' },
            image_url: { type: 'string' },
          },
        },
        response: {
          201: { type: 'object' },
          401: { type: 'object' },
        },
      },
    },
    async (request: FastifyRequest<{ Body: CreateNewsBody }>, reply: FastifyReply) => {
      if (!verifyAdminPassword(request, reply)) return;

      const { title, content, image_url } = request.body;

      app.logger.info({ title }, 'Creating news article');

      try {
        const now = new Date();
        const result = await app.db
          .insert(schema.apiNews)
          .values({
            title,
            content,
            imageUrl: image_url || null,
            published: true,
            createdAt: now,
            updatedAt: now,
          })
          .returning();

        const article = result[0];
        app.logger.info({ newsId: article.id }, 'News article created');

        reply.status(201);
        return {
          id: article.id,
          title: article.title,
          content: article.content,
          image_url: article.imageUrl,
          created_at: article.createdAt.toISOString(),
        };
      } catch (error) {
        app.logger.error({ err: error, title }, 'Failed to create news article');
        throw error;
      }
    }
  );

  // PUT /api/news/:id - Update news article (admin only)
  fastify.put<{ Params: { id: string }; Body: UpdateNewsBody }>(
    '/api/news/:id',
    {
      schema: {
        description: 'Update news article (admin only)',
        tags: ['news'],
        params: {
          type: 'object',
          required: ['id'],
          properties: { id: { type: 'string', format: 'uuid' } },
        },
        body: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            content: { type: 'string' },
            image_url: { type: 'string' },
          },
        },
        response: {
          200: { type: 'object' },
          401: { type: 'object' },
          404: { type: 'object' },
        },
      },
    },
    async (request: FastifyRequest<{ Params: { id: string }; Body: UpdateNewsBody }>, reply: FastifyReply) => {
      if (!verifyAdminPassword(request, reply)) return;

      const { id } = request.params;
      const { title, content, image_url } = request.body;

      app.logger.info({ newsId: id }, 'Updating news article');

      try {
        const updates: any = {};
        if (title !== undefined) updates.title = title;
        if (content !== undefined) updates.content = content;
        if (image_url !== undefined) updates.imageUrl = image_url;
        updates.updatedAt = new Date();

        const result = await app.db
          .update(schema.apiNews)
          .set(updates)
          .where(eq(schema.apiNews.id, id))
          .returning();

        if (result.length === 0) {
          app.logger.info({ newsId: id }, 'News article not found');
          reply.status(404);
          return { error: 'Not found' };
        }

        const article = result[0];
        app.logger.info({ newsId: id }, 'News article updated');

        return {
          id: article.id,
          title: article.title,
          content: article.content,
          image_url: article.imageUrl,
          created_at: article.createdAt.toISOString(),
        };
      } catch (error) {
        app.logger.error({ err: error, newsId: id }, 'Failed to update news article');
        throw error;
      }
    }
  );

  // DELETE /api/news/:id - Delete news article (admin only, no body)
  fastify.delete<{ Params: { id: string } }>(
    '/api/news/:id',
    {
      schema: {
        description: 'Delete news article (admin only)',
        tags: ['news'],
        params: {
          type: 'object',
          required: ['id'],
          properties: { id: { type: 'string', format: 'uuid' } },
        },
        response: {
          200: { type: 'object' },
          401: { type: 'object' },
          404: { type: 'object' },
        },
      },
    },
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      if (!verifyAdminPassword(request, reply)) return;

      const { id } = request.params;

      app.logger.info({ newsId: id }, 'Deleting news article');

      try {
        const result = await app.db
          .delete(schema.apiNews)
          .where(eq(schema.apiNews.id, id))
          .returning();

        if (result.length === 0) {
          app.logger.info({ newsId: id }, 'News article not found');
          reply.status(404);
          return { error: 'Not found' };
        }

        app.logger.info({ newsId: id }, 'News article deleted');
        return { success: true };
      } catch (error) {
        app.logger.error({ err: error, newsId: id }, 'Failed to delete news article');
        throw error;
      }
    }
  );
}

export async function seedApiNews(app: App) {
  try {
    // Check if already seeded
    const existing = await app.db.select().from(schema.apiNews);

    if (existing.length === 0) {
      app.logger.info('Seeding api_news table');

      const now = new Date();
      const seedData = [
        {
          title: 'Alliance ARM lance sa campagne nationale',
          content: "L'Alliance pour la République du Mali lance officiellement sa grande campagne nationale de sensibilisation à travers toutes les régions du pays.",
          imageUrl: 'https://picsum.photos/seed/news1/800/400',
          published: true,
          createdAt: now,
          updatedAt: now,
        },
        {
          title: 'Conférence régionale à Bamako',
          content: 'Une conférence régionale réunissant les délégués de toutes les régions s\'est tenue à Bamako pour discuter des enjeux politiques actuels.',
          imageUrl: 'https://picsum.photos/seed/news2/800/400',
          published: true,
          createdAt: now,
          updatedAt: now,
        },
        {
          title: 'Nouveau programme de formation des militants',
          content: "L'Alliance ARM annonce un nouveau programme de formation destiné à renforcer les capacités de ses militants sur le terrain.",
          imageUrl: 'https://picsum.photos/seed/news3/800/400',
          published: true,
          createdAt: now,
          updatedAt: now,
        },
      ];

      await app.db.insert(schema.apiNews).values(seedData);
      app.logger.info({ count: seedData.length }, 'API news seeded');
    }
  } catch (error) {
    app.logger.error({ err: error }, 'Failed to seed api_news');
  }
}
