import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { eq, inArray } from 'drizzle-orm';
import * as schema from '../db/schema.js';
import type { App } from '../index.js';

interface IdeologyUpdateBody {
  title: string;
  content: string;
}

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

const DEFAULT_IDEOLOGY = [
  {
    key: 'vision',
    title: 'Notre Vision',
    content: 'L\'Alliance ARM est un mouvement politique engagé pour la souveraineté, la dignité et le développement du peuple malien. Nous croyons en une gouvernance transparente, inclusive et au service du peuple.',
  },
  {
    key: 'valeurs',
    title: 'Nos Valeurs',
    content: 'Fraternité, Liberté, Égalité. Ces trois piliers fondamentaux guident chacune de nos actions et décisions politiques.',
  },
  {
    key: 'programme',
    title: 'Notre Programme',
    content: 'Un programme politique axé sur la sécurité nationale, le développement économique, l\'éducation pour tous, et la justice sociale pour chaque citoyen malien.',
  },
];

function verifyAdminPassword(request: FastifyRequest, reply: FastifyReply): boolean {
  const password = request.headers['x-admin-password'];
  if (!password || password !== ADMIN_PASSWORD) {
    reply.status(401).send({ error: 'Unauthorized' });
    return false;
  }
  return true;
}

export function register(app: App, fastify: FastifyInstance) {
  // GET /api/ideology - Get ideology sections (public)
  fastify.get(
    '/api/ideology',
    {
      schema: {
        description: 'Get ideology sections',
        tags: ['ideology'],
        response: {
          200: { type: 'object' },
        },
      },
    },
    async (request, reply) => {
      app.logger.info('Fetching ideology sections');

      try {
        // Get existing ones
        const existing = await app.db
          .select()
          .from(schema.appContent)
          .where(inArray(schema.appContent.key, ['vision', 'valeurs', 'programme']));

        // Find missing ones
        const existingKeys = existing.map((e) => e.key);
        const missing = DEFAULT_IDEOLOGY.filter((d) => !existingKeys.includes(d.key));

        // Insert missing
        if (missing.length > 0) {
          app.logger.info({ count: missing.length }, 'Seeding missing ideology');
          await app.db.insert(schema.appContent).values(missing);
        }

        // Fetch all three
        const result = await app.db
          .select()
          .from(schema.appContent)
          .where(inArray(schema.appContent.key, ['vision', 'valeurs', 'programme']))
          .orderBy(schema.appContent.key);

        const sections = result.map((r) => ({
          key: r.key,
          title: r.title,
          content: r.content,
        }));

        app.logger.info({ count: sections.length }, 'Ideology sections fetched');
        return { sections };
      } catch (error) {
        app.logger.error({ err: error }, 'Failed to fetch ideology');
        throw error;
      }
    }
  );

  // PUT /api/admin/ideology/:key - Update ideology section (admin only)
  fastify.put<{ Params: { key: string }; Body: IdeologyUpdateBody }>(
    '/api/admin/ideology/:key',
    {
      schema: {
        description: 'Update ideology section (admin only)',
        tags: ['ideology'],
        params: {
          type: 'object',
          properties: {
            key: { type: 'string' },
          },
        },
        body: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            content: { type: 'string' },
          },
          required: ['title', 'content'],
        },
        response: {
          200: { type: 'object' },
          401: { type: 'object' },
        },
      },
    },
    async (request, reply) => {
      if (!verifyAdminPassword(request, reply)) return;

      const { key } = request.params;
      const { title, content } = request.body;

      app.logger.info({ key }, 'Updating ideology section');

      try {
        // Try update first
        const updated = await app.db
          .update(schema.appContent)
          .set({ title, content, updatedAt: new Date() })
          .where(eq(schema.appContent.key, key))
          .returning();

        // If nothing updated, insert
        if (updated.length === 0) {
          app.logger.info({ key }, 'Inserting new ideology section');
          const inserted = await app.db
            .insert(schema.appContent)
            .values({ key, title, content })
            .returning();
          return { key, title: inserted[0].title, content: inserted[0].content };
        }

        app.logger.info({ key }, 'Ideology section updated');
        return { key, title: updated[0].title, content: updated[0].content };
      } catch (error) {
        app.logger.error({ err: error, key }, 'Failed to update ideology');
        throw error;
      }
    }
  );
}
