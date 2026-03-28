import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { eq, desc } from 'drizzle-orm';
import * as schema from '../db/schema.js';
import type { App } from '../index.js';

interface CreateNewsBody {
  title: string;
  content: string;
  image_url?: string;
  imageUrl?: string;
  published?: boolean;
}

interface UpdateNewsBody {
  title?: string;
  content?: string;
  image_url?: string;
  imageUrl?: string;
  published?: boolean;
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
  // GET /api/news - Get all news articles ordered by created_at DESC
  fastify.get(
    '/api/news',
    {
      schema: {
        description: 'Get all news articles',
        tags: ['news'],
        response: {
          200: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string', format: 'uuid' },
                title: { type: 'string' },
                content: { type: 'string' },
                image_url: { type: ['string', 'null'] },
                published: { type: 'boolean' },
                created_at: { type: 'string', format: 'date-time' },
                updated_at: { type: 'string', format: 'date-time' },
              },
            },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      app.logger.info('Fetching all news articles');

      try {
        const articles = await app.db
          .select()
          .from(schema.apiNews)
          .orderBy(desc(schema.apiNews.createdAt));

        app.logger.info({ count: articles.length }, 'News articles retrieved');

        return articles.map(a => ({
          id: a.id,
          title: a.title,
          content: a.content,
          image_url: a.imageUrl,
          published: a.published,
          created_at: a.createdAt.toISOString(),
          updated_at: a.updatedAt.toISOString(),
        }));
      } catch (error) {
        app.logger.error({ err: error }, 'Failed to fetch news articles');
        throw error;
      }
    }
  );

  // GET /api/news/:id - Get single news article
  fastify.get<{ Params: { id: string } }>(
    '/api/news/:id',
    {
      schema: {
        description: 'Get a news article by ID',
        tags: ['news'],
        params: {
          type: 'object',
          required: ['id'],
          properties: { id: { type: 'string', format: 'uuid' } },
        },
        response: {
          200: { type: 'object' },
          404: { type: 'object', properties: { error: { type: 'string' } } },
        },
      },
    },
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const { id } = request.params;
      app.logger.info({ newsId: id }, 'Fetching news article');

      try {
        const articles = await app.db
          .select()
          .from(schema.apiNews)
          .where(eq(schema.apiNews.id, id));

        if (articles.length === 0) {
          app.logger.info({ newsId: id }, 'News article not found');
          reply.status(404);
          return { error: 'Not found' };
        }

        const a = articles[0];
        return {
          id: a.id,
          title: a.title,
          content: a.content,
          image_url: a.imageUrl,
          published: a.published,
          created_at: a.createdAt.toISOString(),
          updated_at: a.updatedAt.toISOString(),
        };
      } catch (error) {
        app.logger.error({ err: error, newsId: id }, 'Failed to fetch news article');
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
            imageUrl: { type: 'string' },
            published: { type: 'boolean' },
          },
        },
        response: {
          201: { type: 'object' },
          400: { type: 'object', properties: { error: { type: 'string' } } },
          401: { type: 'object', properties: { error: { type: 'string' } } },
        },
      },
    },
    async (request: FastifyRequest<{ Body: CreateNewsBody }>, reply: FastifyReply) => {
      if (!verifyAdminPassword(request, reply)) return;

      const { title, content, published } = request.body;
      const imageUrl = request.body.image_url || request.body.imageUrl;

      if (!title || !content) {
        app.logger.warn({ title, content }, 'Missing required fields');
        reply.status(400);
        return { error: 'title and content are required' };
      }

      app.logger.info({ title }, 'Creating news article');

      try {
        const now = new Date();
        const result = await app.db
          .insert(schema.apiNews)
          .values({
            title,
            content,
            imageUrl: imageUrl || null,
            published: published ?? false,
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
          published: article.published,
          created_at: article.createdAt.toISOString(),
          updated_at: article.updatedAt.toISOString(),
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
            imageUrl: { type: 'string' },
            published: { type: 'boolean' },
          },
        },
        response: {
          200: { type: 'object' },
          401: { type: 'object', properties: { error: { type: 'string' } } },
          404: { type: 'object', properties: { error: { type: 'string' } } },
        },
      },
    },
    async (request: FastifyRequest<{ Params: { id: string }; Body: UpdateNewsBody }>, reply: FastifyReply) => {
      if (!verifyAdminPassword(request, reply)) return;

      const { id } = request.params;
      const body = request.body;

      app.logger.info({ newsId: id }, 'Updating news article');

      try {
        const updates: any = {};
        if (body.title !== undefined) updates.title = body.title;
        if (body.content !== undefined) updates.content = body.content;
        if (body.image_url !== undefined) updates.imageUrl = body.image_url;
        if (body.imageUrl !== undefined) updates.imageUrl = body.imageUrl;
        if (body.published !== undefined) updates.published = body.published;
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
          published: article.published,
          created_at: article.createdAt.toISOString(),
          updated_at: article.updatedAt.toISOString(),
        };
      } catch (error) {
        app.logger.error({ err: error, newsId: id }, 'Failed to update news article');
        throw error;
      }
    }
  );

  // DELETE /api/news/:id - Delete news article (admin only)
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
          200: { type: 'object', properties: { success: { type: 'boolean' } } },
          401: { type: 'object', properties: { error: { type: 'string' } } },
          404: { type: 'object', properties: { error: { type: 'string' } } },
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
    const count = await app.db.select().from(schema.apiNews);

    if (count.length === 0) {
      app.logger.info('Seeding api_news');

      const now = new Date();
      const seedData = [
        {
          title: "L'ARM renforce sa présence dans les régions",
          content: 'L\'Alliance pour la Refondation du Mali a tenu des assemblées générales dans les huit régions du pays au cours du mois dernier. Ces rencontres ont permis de renforcer les structures locales et d\'enrôler de nouveaux militants. Le président national a personnellement présidé les assemblées de Kayes et Sikasso.',
          imageUrl: 'https://picsum.photos/seed/news1/800/400',
          published: true,
          createdAt: now,
          updatedAt: now,
        },
        {
          title: 'Conférence de presse sur le programme économique',
          content: 'Le porte-parole de l\'ARM a présenté lors d\'une conférence de presse les grandes lignes du programme économique du parti. Ce programme prévoit notamment la création de 500 000 emplois en cinq ans, le développement des infrastructures rurales et le soutien aux PME maliennes.',
          imageUrl: 'https://picsum.photos/seed/news2/800/400',
          published: true,
          createdAt: now,
          updatedAt: now,
        },
        {
          title: 'Journée de solidarité avec les déplacés',
          content: 'L\'ARM a organisé une journée de solidarité avec les populations déplacées par les conflits dans le nord et le centre du Mali. Des vivres, des médicaments et des vêtements ont été distribués à plus de 2000 familles. Cette action s\'inscrit dans la politique sociale du parti.',
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
