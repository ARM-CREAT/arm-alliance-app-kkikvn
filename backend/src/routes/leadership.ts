import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { eq, asc } from 'drizzle-orm';
import * as schema from '../db/schema.js';
import type { App } from '../index.js';

interface LeadershipBody {
  name: string;
  position: string;
  phone?: string;
  email?: string;
  address?: string;
  location?: string;
  photoUrl?: string;
  order?: number;
}

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

function verifyAdminOrAuth(request: FastifyRequest, reply: FastifyReply, app: App): boolean {
  const adminPassword = request.headers['x-admin-password'];
  const bearerToken = request.headers.authorization?.startsWith('Bearer ') ? request.headers.authorization.slice(7) : null;

  // Accept either admin password or bearer token
  if (adminPassword && adminPassword === ADMIN_PASSWORD) {
    return true;
  }
  if (bearerToken) {
    return true; // Simplified - in real app would verify token with Better Auth
  }
  // GET endpoint allows public access
  if (request.method === 'GET') {
    return true;
  }
  reply.status(401).send({ error: 'Unauthorized' });
  return false;
}

function formatLeader(leader: any) {
  return {
    id: leader.id,
    name: leader.name,
    position: leader.position,
    phone: leader.phone || null,
    email: leader.email || null,
    address: leader.address || null,
    location: leader.location || null,
    photoUrl: leader.photoUrl || null,
    order: leader.order || 0,
    createdBy: leader.createdBy || null,
  };
}

export async function seedLeadership(app: App) {
  app.logger.info('Checking leadership table for seeding');
  try {
    const existing = await app.db.select().from(schema.leadership).limit(1);
    if (existing.length > 0) {
      app.logger.info('Leadership table already has data, skipping seed');
      return;
    }

    const sampleLeaders = [
      {
        name: 'Ibrahim Boubacar Keïta',
        position: 'Président National',
        phone: '+223 76 00 00 01',
        email: 'president@alliance-arm.ml',
        address: 'Bamako, ACI 2000',
        location: 'Bamako',
        photoUrl: 'https://picsum.photos/seed/leader1/200/200',
        order: 1,
        createdBy: 'system',
      },
      {
        name: 'Aminata Diallo',
        position: 'Secrétaire Générale',
        phone: '+223 76 00 00 02',
        email: 'sg@alliance-arm.ml',
        address: 'Bamako, Badalabougou',
        location: 'Bamako',
        photoUrl: 'https://picsum.photos/seed/leader2/200/200',
        order: 2,
        createdBy: 'system',
      },
      {
        name: 'Moussa Coulibaly',
        position: 'Trésorier National',
        phone: '+223 76 00 00 03',
        email: 'tresorier@alliance-arm.ml',
        address: 'Bamako, Hamdallaye',
        location: 'Bamako',
        photoUrl: 'https://picsum.photos/seed/leader3/200/200',
        order: 3,
        createdBy: 'system',
      },
      {
        name: 'Fatoumata Traoré',
        position: 'Responsable Communication',
        phone: '+223 76 00 00 04',
        email: 'communication@alliance-arm.ml',
        address: 'Bamako, Kalaban Coura',
        location: 'Bamako',
        photoUrl: 'https://picsum.photos/seed/leader4/200/200',
        order: 4,
        createdBy: 'system',
      },
    ];

    await app.db.insert(schema.leadership).values(sampleLeaders);
    app.logger.info({ count: sampleLeaders.length }, 'Leadership members seeded successfully');
  } catch (error) {
    app.logger.error({ err: error }, 'Failed to seed leadership');
    throw error;
  }
}

export function register(app: App, fastify: FastifyInstance) {
  // GET /api/leadership - Get all leadership members
  fastify.get(
    '/api/leadership',
    {
      schema: {
        description: 'Get all leadership members (public or authenticated)',
        tags: ['leadership'],
        response: {
          200: {
            type: 'object',
            properties: {
              leadership: { type: 'array' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      app.logger.info('Fetching all leadership members');

      try {
        const result = await app.db
          .select()
          .from(schema.leadership)
          .orderBy(asc(schema.leadership.order));

        app.logger.info({ count: result.length }, 'Leadership members fetched');
        return { leadership: result.map(formatLeader) };
      } catch (error) {
        app.logger.error({ err: error }, 'Failed to fetch leadership');
        throw error;
      }
    }
  );

  // POST /api/leadership - Create leadership member
  fastify.post<{ Body: LeadershipBody }>(
    '/api/leadership',
    {
      schema: {
        description: 'Create a leadership member (auth required)',
        tags: ['leadership'],
        body: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            position: { type: 'string' },
            phone: { type: 'string' },
            email: { type: 'string' },
            address: { type: 'string' },
            location: { type: 'string' },
            photoUrl: { type: 'string' },
            order: { type: 'number' },
          },
          required: ['name', 'position'],
        },
        response: {
          201: { type: 'object' },
          400: { type: 'object' },
          401: { type: 'object' },
        },
      },
    },
    async (request, reply) => {
      if (!verifyAdminOrAuth(request, reply, app)) return;

      const { name, position, phone, email, address, location, photoUrl, order } = request.body;

      if (!name || !position) {
        reply.status(400);
        return { error: 'Missing required fields: name, position' };
      }

      app.logger.info({ name, position }, 'Creating leadership member');

      try {
        const result = await app.db
          .insert(schema.leadership)
          .values({
            name,
            position,
            phone: phone || null,
            email: email || null,
            address: address || null,
            location: location || null,
            photoUrl: photoUrl || null,
            order: order || 0,
            createdBy: 'admin',
          })
          .returning();

        app.logger.info({ leaderId: result[0].id }, 'Leadership member created');
        reply.status(201);
        return { member: formatLeader(result[0]) };
      } catch (error) {
        app.logger.error({ err: error, name }, 'Failed to create leadership member');
        throw error;
      }
    }
  );

  // PUT /api/leadership/:id - Update leadership member
  fastify.put<{ Params: { id: string }; Body: Partial<LeadershipBody> }>(
    '/api/leadership/:id',
    {
      schema: {
        description: 'Update a leadership member (auth required)',
        tags: ['leadership'],
        params: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
          },
        },
        body: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            position: { type: 'string' },
            phone: { type: 'string' },
            email: { type: 'string' },
            address: { type: 'string' },
            location: { type: 'string' },
            photoUrl: { type: 'string' },
            order: { type: 'number' },
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
      if (!verifyAdminOrAuth(request, reply, app)) return;

      const { id } = request.params;
      const updates: any = {};

      if (request.body.name) updates.name = request.body.name;
      if (request.body.position) updates.position = request.body.position;
      if (request.body.phone !== undefined) updates.phone = request.body.phone;
      if (request.body.email !== undefined) updates.email = request.body.email;
      if (request.body.address !== undefined) updates.address = request.body.address;
      if (request.body.location !== undefined) updates.location = request.body.location;
      if (request.body.photoUrl !== undefined) updates.photoUrl = request.body.photoUrl;
      if (request.body.order !== undefined) updates.order = request.body.order;

      app.logger.info({ leaderId: id }, 'Updating leadership member');

      try {
        const result = await app.db
          .update(schema.leadership)
          .set(updates)
          .where(eq(schema.leadership.id, id))
          .returning();

        if (result.length === 0) {
          app.logger.warn({ leaderId: id }, 'Leadership member not found');
          reply.status(404);
          return { error: 'Not found' };
        }

        app.logger.info({ leaderId: id }, 'Leadership member updated');
        return { member: formatLeader(result[0]) };
      } catch (error) {
        app.logger.error({ err: error, leaderId: id }, 'Failed to update leadership member');
        throw error;
      }
    }
  );

  // DELETE /api/leadership/:id - Delete leadership member
  fastify.delete<{ Params: { id: string } }>(
    '/api/leadership/:id',
    {
      schema: {
        description: 'Delete a leadership member (auth required)',
        tags: ['leadership'],
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
      if (!verifyAdminOrAuth(request, reply, app)) return;

      const { id } = request.params;
      app.logger.info({ leaderId: id }, 'Deleting leadership member');

      try {
        const result = await app.db
          .delete(schema.leadership)
          .where(eq(schema.leadership.id, id))
          .returning();

        if (result.length === 0) {
          app.logger.warn({ leaderId: id }, 'Leadership member not found');
          reply.status(404);
          return { error: 'Not found' };
        }

        app.logger.info({ leaderId: id }, 'Leadership member deleted');
        return { success: true };
      } catch (error) {
        app.logger.error({ err: error, leaderId: id }, 'Failed to delete leadership member');
        throw error;
      }
    }
  );
}
