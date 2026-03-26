import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { eq, desc, ilike, and, count } from 'drizzle-orm';
import * as schema from '../db/schema.js';
import type { App } from '../index.js';

interface CreateArticleBody {
  title: string;
  content: string;
  category: string;
  image_url?: string;
  summary?: string;
}

interface UpdateArticleBody {
  title?: string;
  content?: string;
  category?: string;
  image_url?: string;
  summary?: string;
  published?: boolean;
}

interface ArticleSummary {
  id: string;
  title: string;
  summary: string;
  category: string;
  image_url: string;
  published_at: string;
  published: boolean;
}

interface Article extends ArticleSummary {
  content: string;
}

export function register(app: App, fastify: FastifyInstance) {
  // GET /api/news - Get published articles with filtering and pagination
  fastify.get<{ Querystring: { category?: string; limit?: string; offset?: string } }>(
    '/api/news',
    {
      schema: {
        description: 'Get published news articles with optional filtering and pagination',
        tags: ['news'],
        querystring: {
          type: 'object',
          properties: {
            category: { type: 'string', description: 'Filter by category (case-insensitive)' },
            limit: { type: 'string', description: 'Max results (default 20)' },
            offset: { type: 'string', description: 'Skip results (default 0)' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              articles: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string', format: 'uuid' },
                    title: { type: 'string' },
                    summary: { type: 'string' },
                    category: { type: 'string' },
                    image_url: { type: 'string' },
                    published_at: { type: 'string', format: 'date-time' },
                    published: { type: 'boolean' },
                  },
                },
              },
              total: { type: 'number' },
            },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const query = request.query as { category?: string; limit?: string; offset?: string };
      const limit = parseInt(query.limit || '20', 10);
      const offset = parseInt(query.offset || '0', 10);
      const category = query.category;

      app.logger.info({ category, limit, offset }, 'Fetching published news articles');

      try {
        // Build the where clause
        let whereClause: any = eq(schema.newsArticles.published, true);

        if (category) {
          whereClause = and(
            whereClause,
            ilike(schema.newsArticles.category, `%${category}%`)
          );
        }

        // Get total count
        const countResult = await app.db
          .select({ count: count() })
          .from(schema.newsArticles)
          .where(whereClause);
        const total = countResult[0]?.count || 0;

        // Get articles
        const articles = await app.db
          .select()
          .from(schema.newsArticles)
          .where(whereClause)
          .orderBy(desc(schema.newsArticles.publishedAt))
          .limit(limit)
          .offset(offset);

        app.logger.info({ count: articles.length, total }, 'News articles retrieved');

        const formattedArticles: ArticleSummary[] = articles.map(a => ({
          id: a.id,
          title: a.title,
          summary: a.summary,
          category: a.category,
          image_url: a.imageUrl,
          published_at: a.publishedAt.toISOString(),
          published: a.published,
        }));

        return { articles: formattedArticles, total };
      } catch (error) {
        app.logger.error({ err: error }, 'Failed to fetch news articles');
        throw error;
      }
    }
  );

  // POST /api/news - Create new article (authenticated)
  fastify.post<{ Body: CreateArticleBody }>(
    '/api/news',
    {
      schema: {
        description: 'Create a new news article (authenticated)',
        tags: ['news'],
        body: {
          type: 'object',
          required: ['title', 'content', 'category'],
          properties: {
            title: { type: 'string' },
            content: { type: 'string' },
            category: { type: 'string' },
            image_url: { type: 'string' },
            summary: { type: 'string' },
          },
        },
        response: {
          201: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              title: { type: 'string' },
              content: { type: 'string' },
              summary: { type: 'string' },
              category: { type: 'string' },
              image_url: { type: 'string' },
              published: { type: 'boolean' },
              published_at: { type: 'string', format: 'date-time' },
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
      const requireAuth = app.requireAuth();
      const session = await requireAuth(request, reply);
      if (!session) return;

      const body = request.body as CreateArticleBody;
      const { title, content, category, image_url, summary } = body;

      app.logger.info({ title, category }, 'Creating news article');

      try {
        const result = await app.db
          .insert(schema.newsArticles)
          .values({
            title,
            content,
            category,
            imageUrl: image_url || '',
            summary: summary || '',
            published: true,
          })
          .returning();

        const article = result[0];
        app.logger.info({ articleId: article.id }, 'News article created');

        reply.status(201);
        return {
          id: article.id,
          title: article.title,
          content: article.content,
          summary: article.summary,
          category: article.category,
          image_url: article.imageUrl,
          published: article.published,
          published_at: article.publishedAt.toISOString(),
          created_at: article.createdAt.toISOString(),
          updated_at: article.updatedAt.toISOString(),
        };
      } catch (error) {
        app.logger.error({ err: error, title, category }, 'Failed to create news article');
        throw error;
      }
    }
  );

  // GET /api/news/:id - Get article by ID (returns regardless of published status)
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
          200: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              title: { type: 'string' },
              content: { type: 'string' },
              summary: { type: 'string' },
              category: { type: 'string' },
              image_url: { type: 'string' },
              published: { type: 'boolean' },
              published_at: { type: 'string', format: 'date-time' },
              created_at: { type: 'string', format: 'date-time' },
              updated_at: { type: 'string', format: 'date-time' },
            },
          },
          404: {
            type: 'object',
            properties: { error: { type: 'string' } },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { id } = request.params as { id: string };

      app.logger.info({ articleId: id }, 'Fetching news article');

      try {
        const articles = await app.db
          .select()
          .from(schema.newsArticles)
          .where(eq(schema.newsArticles.id, id));

        if (articles.length === 0) {
          app.logger.info({ articleId: id }, 'News article not found');
          reply.status(404);
          return { error: 'Article not found' };
        }

        const article = articles[0];
        app.logger.info({ articleId: id }, 'News article retrieved');

        return {
          id: article.id,
          title: article.title,
          content: article.content,
          summary: article.summary,
          category: article.category,
          image_url: article.imageUrl,
          published: article.published,
          published_at: article.publishedAt.toISOString(),
          created_at: article.createdAt.toISOString(),
          updated_at: article.updatedAt.toISOString(),
        };
      } catch (error) {
        app.logger.error({ err: error, articleId: id }, 'Failed to fetch news article');
        throw error;
      }
    }
  );

  // PUT /api/news/:id - Update article (authenticated)
  fastify.put<{ Params: { id: string }; Body: UpdateArticleBody }>(
    '/api/news/:id',
    {
      schema: {
        description: 'Update a news article (authenticated)',
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
            category: { type: 'string' },
            image_url: { type: 'string' },
            summary: { type: 'string' },
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
              summary: { type: 'string' },
              category: { type: 'string' },
              image_url: { type: 'string' },
              published: { type: 'boolean' },
              published_at: { type: 'string', format: 'date-time' },
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
      const requireAuth = app.requireAuth();
      const session = await requireAuth(request, reply);
      if (!session) return;

      const { id } = request.params as { id: string };
      const body = request.body as UpdateArticleBody;

      app.logger.info({ articleId: id }, 'Updating news article');

      try {
        const updates: any = {};
        if (body.title !== undefined) updates.title = body.title;
        if (body.content !== undefined) updates.content = body.content;
        if (body.category !== undefined) updates.category = body.category;
        if (body.image_url !== undefined) updates.imageUrl = body.image_url;
        if (body.summary !== undefined) updates.summary = body.summary;
        if (body.published !== undefined) updates.published = body.published;
        updates.updatedAt = new Date();

        const result = await app.db
          .update(schema.newsArticles)
          .set(updates)
          .where(eq(schema.newsArticles.id, id))
          .returning();

        if (result.length === 0) {
          app.logger.info({ articleId: id }, 'News article not found for update');
          reply.status(404);
          return { error: 'Article not found' };
        }

        const article = result[0];
        app.logger.info({ articleId: id }, 'News article updated');

        return {
          id: article.id,
          title: article.title,
          content: article.content,
          summary: article.summary,
          category: article.category,
          image_url: article.imageUrl,
          published: article.published,
          published_at: article.publishedAt.toISOString(),
          created_at: article.createdAt.toISOString(),
          updated_at: article.updatedAt.toISOString(),
        };
      } catch (error) {
        app.logger.error({ err: error, articleId: id }, 'Failed to update news article');
        throw error;
      }
    }
  );

  // DELETE /api/news/:id - Delete article (authenticated)
  fastify.delete<{ Params: { id: string } }>(
    '/api/news/:id',
    {
      schema: {
        description: 'Delete a news article (authenticated)',
        tags: ['news'],
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
      const requireAuth = app.requireAuth();
      const session = await requireAuth(request, reply);
      if (!session) return;

      const { id } = request.params as { id: string };

      app.logger.info({ articleId: id }, 'Deleting news article');

      try {
        const result = await app.db
          .delete(schema.newsArticles)
          .where(eq(schema.newsArticles.id, id))
          .returning();

        if (result.length === 0) {
          app.logger.info({ articleId: id }, 'News article not found for deletion');
          reply.status(404);
          return { error: 'Article not found' };
        }

        app.logger.info({ articleId: id }, 'News article deleted');
        return { success: true };
      } catch (error) {
        app.logger.error({ err: error, articleId: id }, 'Failed to delete news article');
        throw error;
      }
    }
  );
}

export async function seedNewsArticles(app: App) {
  try {
    const existing = await app.db.select().from(schema.newsArticles);

    if (existing.length === 0) {
      app.logger.info('Seeding news articles');

      const seedData = [
        {
          title: 'ARM renforce sa présence dans les régions du Nord',
          content: 'L\'Alliance pour la République et le Mali (ARM) a tenu une série de réunions dans les régions de Tombouctou, Gao et Kidal au cours des dernières semaines. Ces rencontres visaient à consolider les structures locales du parti et à recueillir les préoccupations des populations. Le président du parti a souligné l\'importance d\'une présence forte sur l\'ensemble du territoire national pour porter les aspirations de tous les Maliens. Des comités régionaux ont été mis en place et des responsables locaux désignés pour coordonner les activités du parti dans ces zones stratégiques.',
          summary: 'ARM consolide ses structures dans les régions du Nord avec des réunions à Tombouctou, Gao et Kidal.',
          category: 'Politique',
          imageUrl: 'https://picsum.photos/seed/mali-nord/800/400',
          published: true,
          publishedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        },
        {
          title: 'Sécurité au Sahel : ARM propose un plan de paix global',
          content: 'Face à la dégradation continue de la situation sécuritaire au Sahel, le parti ARM a présenté un plan de paix en cinq points lors d\'une conférence de presse tenue à Bamako. Ce plan prévoit notamment le renforcement des forces armées maliennes, le dialogue avec les communautés locales, la lutte contre la pauvreté comme vecteur de radicalisation, la coopération régionale renforcée et la mise en place de mécanismes de réconciliation nationale. Le porte-parole du parti a insisté sur la nécessité d\'une approche holistique pour résoudre durablement la crise sécuritaire.',
          summary: 'ARM présente un plan de paix en cinq points pour répondre à la crise sécuritaire au Sahel.',
          category: 'Sécurité',
          imageUrl: 'https://picsum.photos/seed/sahel-securite/800/400',
          published: true,
          publishedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
        },
        {
          title: 'Économie malienne : ARM plaide pour la diversification',
          content: 'Le bureau économique du parti ARM a publié un rapport détaillé sur les perspectives de diversification de l\'économie malienne. Le document recommande de réduire la dépendance à l\'or et au coton en développant l\'agro-industrie, le tourisme culturel et les énergies renouvelables. ARM propose également la création de zones économiques spéciales dans plusieurs régions pour attirer les investissements étrangers. Le rapport souligne que le Mali dispose d\'un potentiel considérable qui reste largement inexploité faute de politiques adaptées.',
          summary: 'ARM publie un rapport sur la diversification économique du Mali, misant sur l\'agro-industrie et les énergies renouvelables.',
          category: 'Économie',
          imageUrl: 'https://picsum.photos/seed/economie-mali/800/400',
          published: true,
          publishedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
        },
        {
          title: 'La diaspora malienne se mobilise autour d\'ARM en Europe',
          content: 'Des sections du parti ARM ont été officiellement créées en France, en Belgique, en Espagne et en Italie lors d\'une tournée du secrétaire général du parti. Ces nouvelles structures permettront à la diaspora malienne de participer activement à la vie politique du pays depuis l\'étranger. Les membres de la diaspora ont exprimé leur attachement au Mali et leur volonté de contribuer au développement du pays. ARM s\'engage à défendre les droits des Maliens de l\'extérieur et à faciliter leurs investissements au pays.',
          summary: 'Des sections ARM sont créées en France, Belgique, Espagne et Italie pour mobiliser la diaspora malienne.',
          category: 'Diaspora',
          imageUrl: 'https://picsum.photos/seed/diaspora-mali/800/400',
          published: true,
          publishedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
        },
        {
          title: 'ARM lance un programme d\'aide aux familles vulnérables',
          content: 'Dans le cadre de ses actions sociales, le parti ARM a lancé un programme d\'aide aux familles vulnérables dans les communes périurbaines de Bamako. Ce programme prévoit la distribution de kits alimentaires, la prise en charge médicale des enfants de moins de cinq ans et l\'accompagnement des femmes chefs de ménage dans leurs activités génératrices de revenus. Plus de 2 000 familles bénéficieront de ce programme dans un premier temps, avec l\'objectif d\'étendre l\'initiative à d\'autres régions du pays.',
          summary: 'ARM lance un programme social ciblant 2 000 familles vulnérables dans les communes périurbaines de Bamako.',
          category: 'Social',
          imageUrl: 'https://picsum.photos/seed/social-mali/800/400',
          published: true,
          publishedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        },
        {
          title: 'Congrès national d\'ARM : adoption d\'une nouvelle charte',
          content: 'Le congrès national du parti ARM s\'est tenu à Bamako avec la participation de délégués venus de toutes les régions du Mali. Les congressistes ont adopté une nouvelle charte du parti qui réaffirme les valeurs fondamentales d\'ARM : démocratie, justice sociale, unité nationale et développement durable. De nouveaux statuts ont également été approuvés pour moderniser le fonctionnement interne du parti et renforcer la participation des jeunes et des femmes aux instances dirigeantes.',
          summary: 'Le congrès national d\'ARM adopte une nouvelle charte réaffirmant les valeurs démocratiques et sociales du parti.',
          category: 'Politique',
          imageUrl: 'https://picsum.photos/seed/congres-arm/800/400',
          published: true,
          publishedAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000),
        },
        {
          title: 'Crise alimentaire : ARM interpelle le gouvernement',
          content: 'Face à la recrudescence de l\'insécurité alimentaire dans les régions de Mopti et Ségou, le parti ARM a adressé une lettre ouverte au gouvernement de transition pour demander des mesures d\'urgence. ARM réclame la mise en place d\'un fonds d\'urgence alimentaire, le renforcement des stocks nationaux de sécurité et l\'accélération des programmes d\'irrigation pour sécuriser la production agricole. Le parti appelle également à une meilleure coordination avec les organisations humanitaires internationales présentes sur le terrain.',
          summary: 'ARM interpelle le gouvernement sur la crise alimentaire à Mopti et Ségou, réclamant des mesures d\'urgence.',
          category: 'Social',
          imageUrl: 'https://picsum.photos/seed/crise-alimentaire/800/400',
          published: true,
          publishedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
        },
        {
          title: 'Mines et ressources naturelles : ARM pour une meilleure redistribution',
          content: 'Le parti ARM a organisé un forum sur la gestion des ressources naturelles du Mali, réunissant experts, représentants de la société civile et élus locaux. Les participants ont débattu des moyens d\'améliorer la redistribution des revenus miniers au profit des communautés locales. ARM propose la révision du code minier pour augmenter la part des collectivités territoriales dans les recettes générées par l\'exploitation des ressources naturelles. Le parti plaide également pour plus de transparence dans la gestion des contrats miniers.',
          summary: 'ARM organise un forum sur la redistribution des revenus miniers au profit des communautés locales.',
          category: 'Économie',
          imageUrl: 'https://picsum.photos/seed/mines-mali/800/400',
          published: true,
          publishedAt: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000),
        },
        {
          title: 'ARM et les jeunes : un pacte pour l\'avenir du Mali',
          content: 'Le mouvement des jeunes d\'ARM a tenu son assemblée générale annuelle à Bamako, rassemblant plus de 500 jeunes militants venus de tout le pays. L\'assemblée a adopté un pacte pour l\'avenir qui identifie les priorités de la jeunesse malienne : emploi, éducation de qualité, accès aux nouvelles technologies et participation politique. Le président du parti a rencontré les délégués et s\'est engagé à placer les jeunes au cœur du projet politique d\'ARM. Un fonds de soutien à l\'entrepreneuriat jeune sera créé dans les prochains mois.',
          summary: 'Le mouvement des jeunes d\'ARM adopte un pacte pour l\'avenir axé sur l\'emploi, l\'éducation et l\'entrepreneuriat.',
          category: 'Social',
          imageUrl: 'https://picsum.photos/seed/jeunes-mali/800/400',
          published: true,
          publishedAt: new Date(Date.now() - 22 * 24 * 60 * 60 * 1000),
        },
        {
          title: 'La diaspora malienne investit dans l\'agriculture avec le soutien d\'ARM',
          content: 'ARM a facilité la signature d\'un accord de partenariat entre des associations de la diaspora malienne en France et des coopératives agricoles dans les régions de Sikasso et Koulikoro. Cet accord prévoit des investissements de plusieurs millions de francs CFA dans la modernisation des équipements agricoles et la formation des producteurs. ARM voit dans la diaspora un levier essentiel pour le développement économique du Mali et s\'engage à créer un cadre juridique favorable aux investissements des Maliens de l\'extérieur.',
          summary: 'ARM facilite un accord entre la diaspora en France et des coopératives agricoles de Sikasso et Koulikoro.',
          category: 'Diaspora',
          imageUrl: 'https://picsum.photos/seed/diaspora-agriculture/800/400',
          published: true,
          publishedAt: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000),
        },
      ];

      await app.db.insert(schema.newsArticles).values(seedData);
      app.logger.info({ count: seedData.length }, 'News articles seeded');
    }
  } catch (error) {
    app.logger.error({ err: error }, 'Failed to seed news articles');
  }
}
