import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { eq, asc } from 'drizzle-orm';
import * as schema from '../db/schema.js';
import type { App } from '../index.js';

interface CreateDirectionBody {
  firstName: string;
  lastName: string;
  role: string; // position alias
  bio?: string;
  photoUrl?: string;
  orderIndex?: number;
  phone?: string;
  email?: string;
}

interface UpdateDirectionBody {
  firstName?: string;
  lastName?: string;
  role?: string;
  bio?: string;
  photoUrl?: string;
  orderIndex?: number;
  phone?: string;
  email?: string;
}

function formatDirection(member: any) {
  return {
    id: member.id,
    firstName: member.firstName,
    lastName: member.lastName,
    role: member.position, // Map position to role
    bio: member.bio || null,
    photoUrl: member.photoUrl || null,
    orderIndex: member.orderIndex ?? member.order,
    phone: member.phone || null,
    email: member.email || null,
  };
}

export function register(app: App, fastify: FastifyInstance) {
  // GET /api/direction - Get all board members (public)
  fastify.get(
    '/api/direction',
    {
      schema: {
        description: 'Get all board/direction members',
        tags: ['direction'],
        response: {
          200: {
            type: 'object',
            properties: {
              members: { type: 'array' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      app.logger.info('Fetching direction members');

      try {
        const result = await app.db
          .select()
          .from(schema.leadership)
          .orderBy(asc(schema.leadership.order));

        app.logger.info({ count: result.length }, 'Direction members fetched');
        return {
          members: result.map(formatDirection),
        };
      } catch (error) {
        app.logger.error({ err: error }, 'Failed to fetch direction members');
        throw error;
      }
    }
  );

  // GET /api/direction/:id - Get single board member (public)
  fastify.get<{ Params: { id: string } }>(
    '/api/direction/:id',
    {
      schema: {
        description: 'Get a single board member by ID',
        tags: ['direction'],
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
      app.logger.info({ memberId: id }, 'Fetching direction member');

      try {
        const result = await app.db
          .select()
          .from(schema.leadership)
          .where(eq(schema.leadership.id, id as any));

        if (result.length === 0) {
          reply.status(404);
          return { error: 'Member not found' };
        }

        app.logger.info({ memberId: id }, 'Direction member fetched');
        return {
          member: formatDirection(result[0]),
        };
      } catch (error) {
        app.logger.error({ err: error, memberId: id }, 'Failed to fetch direction member');
        throw error;
      }
    }
  );

  // POST /api/direction - Create board member (public)
  fastify.post<{ Body: CreateDirectionBody }>(
    '/api/direction',
    {
      schema: {
        description: 'Create a new board member',
        tags: ['direction'],
        body: {
          type: 'object',
          properties: {
            firstName: { type: 'string' },
            lastName: { type: 'string' },
            role: { type: 'string' },
            bio: { type: 'string' },
            photoUrl: { type: 'string' },
            orderIndex: { type: 'number' },
            phone: { type: 'string' },
            email: { type: 'string' },
          },
          required: ['firstName', 'lastName', 'role'],
        },
        response: {
          201: { type: 'object' },
          400: { type: 'object' },
        },
      },
    },
    async (request, reply) => {
      const { firstName, lastName, role, bio, photoUrl, orderIndex, phone, email } = request.body;
      const name = `${firstName} ${lastName}`;

      app.logger.info({ firstName, lastName, role }, 'Creating direction member');

      try {
        const result = await app.db
          .insert(schema.leadership)
          .values({
            name,
            firstName,
            lastName,
            position: role,
            bio: bio || null,
            photoUrl: photoUrl || null,
            orderIndex: orderIndex || null,
            order: orderIndex || 0,
            phone: phone || null,
            email: email || null,
          })
          .returning();

        reply.status(201);
        app.logger.info({ memberId: result[0].id }, 'Direction member created');
        return {
          member: formatDirection(result[0]),
        };
      } catch (error) {
        app.logger.error({ err: error, firstName, lastName }, 'Failed to create direction member');
        throw error;
      }
    }
  );

  // PUT /api/direction/:id - Update board member (public)
  fastify.put<{ Params: { id: string }; Body: UpdateDirectionBody }>(
    '/api/direction/:id',
    {
      schema: {
        description: 'Update a board member',
        tags: ['direction'],
        params: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
          },
        },
        body: {
          type: 'object',
          properties: {
            firstName: { type: 'string' },
            lastName: { type: 'string' },
            role: { type: 'string' },
            bio: { type: 'string' },
            photoUrl: { type: 'string' },
            orderIndex: { type: 'number' },
            phone: { type: 'string' },
            email: { type: 'string' },
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
      const { firstName, lastName, role, bio, photoUrl, orderIndex, phone, email } = request.body;

      app.logger.info({ memberId: id }, 'Updating direction member');

      try {
        const updates: any = {};
        if (firstName !== undefined || lastName !== undefined) {
          const fn = firstName !== undefined ? firstName : undefined;
          const ln = lastName !== undefined ? lastName : undefined;

          // Get existing record to use current values if not provided
          const existing = await app.db
            .select()
            .from(schema.leadership)
            .where(eq(schema.leadership.id, id as any));

          if (existing.length === 0) {
            reply.status(404);
            return { error: 'Member not found' };
          }

          const currentFirstName = fn !== undefined ? fn : existing[0].firstName;
          const currentLastName = ln !== undefined ? ln : existing[0].lastName;

          updates.firstName = currentFirstName;
          updates.lastName = currentLastName;
          updates.name = `${currentFirstName} ${currentLastName}`;
        }

        if (role !== undefined) updates.position = role;
        if (bio !== undefined) updates.bio = bio;
        if (photoUrl !== undefined) updates.photoUrl = photoUrl;
        if (orderIndex !== undefined) {
          updates.orderIndex = orderIndex;
          updates.order = orderIndex;
        }
        if (phone !== undefined) updates.phone = phone;
        if (email !== undefined) updates.email = email;

        const result = await app.db
          .update(schema.leadership)
          .set(updates)
          .where(eq(schema.leadership.id, id as any))
          .returning();

        if (result.length === 0) {
          reply.status(404);
          return { error: 'Member not found' };
        }

        app.logger.info({ memberId: id }, 'Direction member updated');
        return {
          member: formatDirection(result[0]),
        };
      } catch (error) {
        app.logger.error({ err: error, memberId: id }, 'Failed to update direction member');
        throw error;
      }
    }
  );

  // DELETE /api/direction/:id - Delete board member (public)
  fastify.delete<{ Params: { id: string } }>(
    '/api/direction/:id',
    {
      schema: {
        description: 'Delete a board member',
        tags: ['direction'],
        params: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
          },
        },
        response: {
          204: { type: 'null' },
          404: { type: 'object' },
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params;
      app.logger.info({ memberId: id }, 'Deleting direction member');

      try {
        const result = await app.db
          .delete(schema.leadership)
          .where(eq(schema.leadership.id, id as any))
          .returning();

        if (result.length === 0) {
          reply.status(404);
          return { error: 'Member not found' };
        }

        reply.status(204);
        app.logger.info({ memberId: id }, 'Direction member deleted');
      } catch (error) {
        app.logger.error({ err: error, memberId: id }, 'Failed to delete direction member');
        throw error;
      }
    }
  );
}

export async function seedDirection(app: App) {
  try {
    const existing = await app.db
      .select()
      .from(schema.leadership)
      .limit(1);

    if (existing.length === 0) {
      app.logger.info('Seeding direction members');
      const sampleMembers = [
        {
          name: 'Ibrahim Boubacar',
          firstName: 'Ibrahim',
          lastName: 'Boubacar',
          position: 'Président',
          bio: 'Fondateur et président du parti Alliance ARM, engagé pour le développement du Mali.',
          photoUrl: 'https://picsum.photos/seed/ibrahim/200/200',
          order: 1,
          orderIndex: 1,
        },
        {
          name: 'Fatoumata Diallo',
          firstName: 'Fatoumata',
          lastName: 'Diallo',
          position: 'Vice-Présidente',
          bio: 'Vice-présidente chargée des affaires sociales et de la mobilisation des femmes.',
          photoUrl: 'https://picsum.photos/seed/fatoumata/200/200',
          order: 2,
          orderIndex: 2,
        },
        {
          name: 'Moussa Coulibaly',
          firstName: 'Moussa',
          lastName: 'Coulibaly',
          position: 'Secrétaire Général',
          bio: 'Secrétaire général responsable de la coordination des activités du parti.',
          photoUrl: 'https://picsum.photos/seed/moussa/200/200',
          order: 3,
          orderIndex: 3,
        },
      ];

      await app.db.insert(schema.leadership).values(sampleMembers);
      app.logger.info({ count: sampleMembers.length }, 'Direction members seeded');
    }
  } catch (error) {
    app.logger.error({ err: error }, 'Failed to seed direction members');
  }
}
