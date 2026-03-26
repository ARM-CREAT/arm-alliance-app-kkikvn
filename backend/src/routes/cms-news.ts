import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { eq, desc } from 'drizzle-orm';
import * as schema from '../db/schema.js';
import type { App } from '../index.js';

interface CreateCmsNewsBody {
  title: string;
  content: string;
  image_url?: string;
  published?: boolean;
}

interface UpdateCmsNewsBody {
  title?: string;
  content?: string;
  image_url?: string;
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
  // GET /api/cms/news - Public endpoint
  fastify.get<{ Querystring: { published?: string } }>(
    '/api/cms/news',
    {
      schema: {
        description: 'Get CMS news articles',
        tags: ['cms'],
        querystring: {
          type: 'object',
          properties: {
            published: { type: 'string', enum: ['true', 'false'], description: 'Filter by published status' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              news: {
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
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const query = request.query as { published?: string };
      app.logger.info({ published: query.published }, 'Fetching CMS news');

      try {
        let queryBuilder: any = app.db.select().from(schema.cmsNews);

        // Only return published items unless admin requests otherwise
        if (query.published !== 'false') {
          queryBuilder = queryBuilder.where(eq(schema.cmsNews.published, true));
        }

        const news = await queryBuilder.orderBy(desc(schema.cmsNews.createdAt));

        app.logger.info({ count: news.length }, 'CMS news retrieved');
        return { news };
      } catch (error) {
        app.logger.error({ err: error }, 'Failed to fetch CMS news');
        throw error;
      }
    }
  );

  // POST /api/cms/news - Admin only
  fastify.post<{ Body: CreateCmsNewsBody }>(
    '/api/cms/news',
    {
      schema: {
        description: 'Create CMS news article (admin only)',
        tags: ['cms'],
        body: {
          type: 'object',
          required: ['title', 'content'],
          properties: {
            title: { type: 'string' },
            content: { type: 'string' },
            image_url: { type: 'string' },
            published: { type: 'boolean' },
          },
        },
        response: {
          201: {
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
          401: {
            type: 'object',
            properties: { error: { type: 'string' } },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      if (!verifyAdminPassword(request, reply)) return;

      const body = request.body as CreateCmsNewsBody;
      const { title, content, image_url, published } = body;
      app.logger.info({ title }, 'Creating CMS news');

      try {
        const result = await app.db
          .insert(schema.cmsNews)
          .values({
            title,
            content,
            imageUrl: image_url,
            published: published ?? true,
          })
          .returning();

        const article = result[0];
        app.logger.info({ newsId: article.id }, 'CMS news created');

        reply.status(201);
        return {
          id: article.id,
          title: article.title,
          content: article.content,
          image_url: article.imageUrl,
          published: article.published,
          created_at: article.createdAt,
          updated_at: article.updatedAt,
        };
      } catch (error) {
        app.logger.error({ err: error, title }, 'Failed to create CMS news');
        throw error;
      }
    }
  );

  // PUT /api/cms/news/:id - Admin only
  fastify.put<{ Params: { id: string }; Body: UpdateCmsNewsBody }>(
    '/api/cms/news/:id',
    {
      schema: {
        description: 'Update CMS news article (admin only)',
        tags: ['cms'],
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
            published: { type: 'boolean' },
          },
        },
        response: {
          200: {
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
          401: {
            type: 'object',
            properties: { error: { type: 'string' } },
          },
          404: {
            type: 'object',
            properties: { error: { type: 'string' } },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      if (!verifyAdminPassword(request, reply)) return;

      const { id } = request.params as { id: string };
      const body = request.body as UpdateCmsNewsBody;
      const { title, content, image_url, published } = body;

      app.logger.info({ newsId: id }, 'Updating CMS news');

      try {
        const updates: any = {};
        if (title !== undefined) updates.title = title;
        if (content !== undefined) updates.content = content;
        if (image_url !== undefined) updates.imageUrl = image_url;
        if (published !== undefined) updates.published = published;
        updates.updatedAt = new Date();

        const result = await app.db
          .update(schema.cmsNews)
          .set(updates)
          .where(eq(schema.cmsNews.id, id))
          .returning();

        if (result.length === 0) {
          reply.status(404);
          return { error: 'News article not found' };
        }

        const article = result[0];
        app.logger.info({ newsId: id }, 'CMS news updated');

        return {
          id: article.id,
          title: article.title,
          content: article.content,
          image_url: article.imageUrl,
          published: article.published,
          created_at: article.createdAt,
          updated_at: article.updatedAt,
        };
      } catch (error) {
        app.logger.error({ err: error, newsId: id }, 'Failed to update CMS news');
        throw error;
      }
    }
  );

  // DELETE /api/cms/news/:id - Admin only
  fastify.delete<{ Params: { id: string } }>(
    '/api/cms/news/:id',
    {
      schema: {
        description: 'Delete CMS news article (admin only)',
        tags: ['cms'],
        params: {
          type: 'object',
          required: ['id'],
          properties: { id: { type: 'string', format: 'uuid' } },
        },
        response: {
          200: {
            type: 'object',
            properties: { success: { type: 'boolean' } },
          },
          401: {
            type: 'object',
            properties: { error: { type: 'string' } },
          },
          404: {
            type: 'object',
            properties: { error: { type: 'string' } },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      if (!verifyAdminPassword(request, reply)) return;

      const { id } = request.params as { id: string };

      app.logger.info({ newsId: id }, 'Deleting CMS news');

      try {
        const result = await app.db
          .delete(schema.cmsNews)
          .where(eq(schema.cmsNews.id, id))
          .returning();

        if (result.length === 0) {
          reply.status(404);
          return { error: 'News article not found' };
        }

        app.logger.info({ newsId: id }, 'CMS news deleted');
        return { success: true };
      } catch (error) {
        app.logger.error({ err: error, newsId: id }, 'Failed to delete CMS news');
        throw error;
      }
    }
  );
}

export async function seedCmsNews(app: App) {
  try {
    const count = await app.db.select().from(schema.cmsNews);

    if (count.length === 0) {
      app.logger.info('Seeding CMS news');

      const seedData = [
        {
          title: 'Alliance ARM remporte une victoire historique',
          content: "L'Alliance pour la Refondation du Mali a obtenu un soutien massif lors des dernières consultations populaires, marquant un tournant décisif dans l'histoire politique du pays. Des milliers de militants ont exprimé leur confiance dans le programme de gouvernance proposé par le parti.",
          imageUrl: 'https://picsum.photos/seed/news1/800/400',
          published: true,
        },
        {
          title: 'Nouveau programme de développement rural annoncé',
          content: 'Le bureau exécutif de l\'Alliance ARM a présenté un ambitieux programme de développement rural visant à améliorer les conditions de vie des populations rurales. Ce programme comprend des investissements dans l\'agriculture, l\'éducation et les infrastructures sanitaires dans toutes les régions du Mali.',
          imageUrl: 'https://picsum.photos/seed/news2/800/400',
          published: true,
        },
        {
          title: 'Conférence nationale sur la réconciliation',
          content: 'Une grande conférence nationale sur la réconciliation et le dialogue inter-malien sera organisée prochainement sous l\'égide de l\'Alliance ARM. Cet événement réunira des représentants de toutes les régions du pays pour discuter des voies et moyens de renforcer la cohésion nationale.',
          imageUrl: 'https://picsum.photos/seed/news3/800/400',
          published: true,
        },
      ];

      await app.db.insert(schema.cmsNews).values(seedData);
      app.logger.info({ count: seedData.length }, 'CMS news seeded');
    }
  } catch (error) {
    app.logger.error({ err: error }, 'Failed to seed CMS news');
  }
}
