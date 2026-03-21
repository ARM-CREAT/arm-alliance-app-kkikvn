import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { eq, asc, and, max, count } from 'drizzle-orm';
import * as schema from '../db/schema.js';
import type { App } from '../index.js';

interface CreateSectionBody {
  title: string;
  description: string;
  icon?: string;
  orderIndex?: number;
}

interface UpdateSectionBody {
  title?: string;
  description?: string;
  icon?: string;
  orderIndex?: number;
}

const PROGRAM_SECTIONS_SEED = [
  {
    orderIndex: 1,
    title: 'Démocratie & Gouvernance',
    icon: 'building.columns',
    description: 'Alliance ARM s\'engage pour une démocratie forte, des institutions transparentes et une gouvernance au service du peuple malien. Nous défendons l\'État de droit, la séparation des pouvoirs et la lutte contre la corruption à tous les niveaux de l\'État.',
  },
  {
    orderIndex: 2,
    title: 'Développement Économique',
    icon: 'chart.line.uptrend.xyaxis',
    description: 'Notre programme économique vise à créer des emplois durables, soutenir l\'agriculture, développer les PME et attirer les investissements étrangers. Nous croyons en une économie inclusive qui profite à tous les Maliens sans exception.',
  },
  {
    orderIndex: 3,
    title: 'Éducation & Formation',
    icon: 'book.fill',
    description: 'L\'éducation est notre priorité absolue. Nous nous engageons à améliorer la qualité de l\'enseignement, construire des écoles modernes, former des enseignants qualifiés et garantir l\'accès à l\'éducation pour tous les enfants maliens.',
  },
  {
    orderIndex: 4,
    title: 'Santé & Protection Sociale',
    icon: 'heart.fill',
    description: 'Nous voulons un système de santé accessible à tous les Maliens. Notre programme prévoit la construction d\'hôpitaux, le recrutement de personnel médical qualifié et la mise en place d\'une couverture santé universelle.',
  },
  {
    orderIndex: 5,
    title: 'Sécurité & Paix',
    icon: 'shield.fill',
    description: 'La sécurité du peuple malien est notre engagement premier. Nous travaillerons pour renforcer les forces de défense et de sécurité, promouvoir le dialogue inter-communautaire et restaurer la paix dans toutes les régions du Mali.',
  },
  {
    orderIndex: 6,
    title: 'Agriculture & Environnement',
    icon: 'leaf.fill',
    description: 'Le Mali est une terre agricole. Nous soutiendrons les agriculteurs avec des équipements modernes, des semences améliorées et des systèmes d\'irrigation performants. Nous protégerons aussi l\'environnement pour les générations futures.',
  },
];

function formatSection(section: any) {
  return {
    id: section.id,
    orderIndex: section.orderIndex,
    title: section.title,
    description: section.description,
    icon: section.icon || null,
    createdAt: section.createdAt instanceof Date ? section.createdAt.toISOString() : new Date(section.createdAt).toISOString(),
  };
}

async function checkAdminRole(app: App, userId: string): Promise<boolean> {
  const member = await app.db
    .select()
    .from(schema.memberProfiles)
    .where(and(eq(schema.memberProfiles.userId, userId)));
  return member.length > 0 && member[0].role === 'admin';
}

export function register(app: App, fastify: FastifyInstance) {
  const requireAuth = app.requireAuth();

  // GET /api/program - Get all program sections (public)
  fastify.get(
    '/api/program',
    {
      schema: {
        description: 'Get all program sections ordered by order_index',
        tags: ['program'],
        response: {
          200: {
            type: 'object',
            properties: {
              sections: { type: 'array' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      app.logger.info('Fetching program sections');

      try {
        const result = await app.db
          .select()
          .from(schema.programSections)
          .orderBy(asc(schema.programSections.orderIndex));

        app.logger.info({ count: result.length }, 'Program sections fetched');
        return {
          sections: result.map(formatSection),
        };
      } catch (error) {
        app.logger.error({ err: error }, 'Failed to fetch program sections');
        throw error;
      }
    }
  );

  // POST /api/admin/program - Create program section (authenticated, admin only)
  fastify.post<{ Body: CreateSectionBody }>(
    '/api/admin/program',
    {
      schema: {
        description: 'Create a new program section (admin only)',
        tags: ['admin', 'program'],
        body: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            description: { type: 'string' },
            icon: { type: 'string' },
            orderIndex: { type: 'number' },
          },
          required: ['title', 'description'],
        },
        response: {
          201: {
            type: 'object',
            properties: {
              section: { type: 'object' },
            },
          },
          400: { type: 'object' },
          401: { type: 'object' },
          403: { type: 'object' },
        },
      },
    },
    async (request, reply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      const { title, description, icon, orderIndex } = request.body;
      const userId = session.user.id;

      app.logger.info({ userId, title }, 'Creating program section');

      try {
        const isAdmin = await checkAdminRole(app, userId);
        if (!isAdmin) {
          reply.status(403);
          return { error: 'Accès refusé' };
        }

        let finalOrderIndex = orderIndex;
        if (!orderIndex) {
          const maxOrder = await app.db
            .select({ maxIdx: max(schema.programSections.orderIndex) })
            .from(schema.programSections);
          finalOrderIndex = (maxOrder[0]?.maxIdx ?? 0) + 1;
        }

        const result = await app.db
          .insert(schema.programSections)
          .values({
            title,
            description,
            icon: icon || null,
            orderIndex: finalOrderIndex,
          })
          .returning();

        reply.status(201);
        app.logger.info({ sectionId: result[0].id, title }, 'Program section created');
        return {
          section: formatSection(result[0]),
        };
      } catch (error) {
        app.logger.error({ err: error, userId, title }, 'Failed to create program section');
        throw error;
      }
    }
  );

  // PATCH /api/admin/program/:id - Update program section (authenticated, admin only)
  fastify.patch<{ Params: { id: string }; Body: UpdateSectionBody }>(
    '/api/admin/program/:id',
    {
      schema: {
        description: 'Update a program section (admin only)',
        tags: ['admin', 'program'],
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
            icon: { type: 'string' },
            orderIndex: { type: 'number' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              section: { type: 'object' },
            },
          },
          400: { type: 'object' },
          401: { type: 'object' },
          403: { type: 'object' },
          404: { type: 'object' },
        },
      },
    },
    async (request, reply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      const { id } = request.params;
      const { title, description, icon, orderIndex } = request.body;
      const userId = session.user.id;

      app.logger.info({ userId, sectionId: id }, 'Updating program section');

      try {
        const isAdmin = await checkAdminRole(app, userId);
        if (!isAdmin) {
          reply.status(403);
          return { error: 'Accès refusé' };
        }

        const updates: any = {};
        if (title !== undefined) updates.title = title;
        if (description !== undefined) updates.description = description;
        if (icon !== undefined) updates.icon = icon;
        if (orderIndex !== undefined) updates.orderIndex = orderIndex;
        updates.updatedAt = new Date();

        const result = await app.db
          .update(schema.programSections)
          .set(updates)
          .where(eq(schema.programSections.id, id as any))
          .returning();

        if (result.length === 0) {
          reply.status(404);
          return { error: 'Section non trouvée' };
        }

        app.logger.info({ sectionId: id }, 'Program section updated');
        return {
          section: formatSection(result[0]),
        };
      } catch (error) {
        app.logger.error({ err: error, userId, sectionId: id }, 'Failed to update program section');
        throw error;
      }
    }
  );

  // DELETE /api/admin/program/:id - Delete program section (authenticated, admin only)
  fastify.delete<{ Params: { id: string } }>(
    '/api/admin/program/:id',
    {
      schema: {
        description: 'Delete a program section (admin only)',
        tags: ['admin', 'program'],
        params: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
            },
          },
          401: { type: 'object' },
          403: { type: 'object' },
          404: { type: 'object' },
        },
      },
    },
    async (request, reply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      const { id } = request.params;
      const userId = session.user.id;

      app.logger.info({ userId, sectionId: id }, 'Deleting program section');

      try {
        const isAdmin = await checkAdminRole(app, userId);
        if (!isAdmin) {
          reply.status(403);
          return { error: 'Accès refusé' };
        }

        const result = await app.db
          .delete(schema.programSections)
          .where(eq(schema.programSections.id, id as any))
          .returning();

        if (result.length === 0) {
          reply.status(404);
          return { error: 'Section non trouvée' };
        }

        app.logger.info({ sectionId: id }, 'Program section deleted');
        return { success: true };
      } catch (error) {
        app.logger.error({ err: error, userId, sectionId: id }, 'Failed to delete program section');
        throw error;
      }
    }
  );
}

export async function seedProgramSections(app: App) {
  try {
    const existing = await app.db
      .select({ count: count() })
      .from(schema.programSections);

    if (existing[0]?.count === 0) {
      app.logger.info('Seeding program sections');
      await app.db
        .insert(schema.programSections)
        .values(PROGRAM_SECTIONS_SEED);
      app.logger.info({ count: PROGRAM_SECTIONS_SEED.length }, 'Program sections seeded');
    }
  } catch (error) {
    app.logger.error({ err: error }, 'Failed to seed program sections');
  }
}
