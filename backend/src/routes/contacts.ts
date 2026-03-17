import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { eq } from 'drizzle-orm';
import * as schema from '../db/schema.js';
import type { App } from '../index.js';

interface ContactBody {
  name: string;
  role: string;
  phone?: string;
  email?: string;
  address?: string;
  type: string;
}

interface ContactUpdateBody {
  name?: string;
  role?: string;
  phone?: string;
  email?: string;
  address?: string;
  type?: string;
}

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

const DEFAULT_CONTACTS = [
  {
    name: 'Siège National ARM',
    role: 'Bureau National',
    phone: '+223 20 22 00 00',
    email: 'contact@alliance-arm.ml',
    address: 'Bamako, Mali',
    type: 'general',
  },
  {
    name: 'Coordination Régionale',
    role: 'Région de Kayes',
    phone: '+223 21 22 00 00',
    email: 'kayes@alliance-arm.ml',
    address: 'Kayes, Mali',
    type: 'regional',
  },
  {
    name: 'Relations Médias',
    role: 'Service Communication',
    phone: '+223 20 22 00 01',
    email: 'media@alliance-arm.ml',
    address: 'Bamako, Mali',
    type: 'media',
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

function formatContact(contact: any) {
  return {
    id: contact.id,
    name: contact.name,
    role: contact.role,
    phone: contact.phone,
    email: contact.email,
    address: contact.address,
    type: contact.type,
  };
}

export function register(app: App, fastify: FastifyInstance) {
  // GET /api/contacts - Get all contacts (public)
  fastify.get(
    '/api/contacts',
    {
      schema: {
        description: 'Get all contacts',
        tags: ['contacts'],
        response: {
          200: { type: 'array' },
        },
      },
    },
    async (request, reply) => {
      app.logger.info('Fetching contacts');

      try {
        // Check if empty and seed
        const existing = await app.db.select().from(schema.contacts);
        if (existing.length === 0) {
          app.logger.info('Seeding default contacts');
          await app.db.insert(schema.contacts).values(DEFAULT_CONTACTS);
        }

        // Fetch all
        const result = await app.db
          .select()
          .from(schema.contacts)
          .orderBy(schema.contacts.createdAt);

        app.logger.info({ count: result.length }, 'Contacts fetched');
        return result.map(formatContact);
      } catch (error) {
        app.logger.error({ err: error }, 'Failed to fetch contacts');
        throw error;
      }
    }
  );

  // POST /api/admin/contacts - Create contact (admin only)
  fastify.post<{ Body: ContactBody }>(
    '/api/admin/contacts',
    {
      schema: {
        description: 'Create a contact (admin only)',
        tags: ['admin', 'contacts'],
        body: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            role: { type: 'string' },
            type: { type: 'string' },
            phone: { type: 'string' },
            email: { type: 'string' },
            address: { type: 'string' },
          },
          required: ['name', 'role', 'type'],
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

      const { name, role, type, phone, email, address } = request.body;

      if (!name || !role || !type) {
        reply.status(400);
        return { error: 'Missing required fields' };
      }

      app.logger.info({ name }, 'Creating contact');

      try {
        const result = await app.db
          .insert(schema.contacts)
          .values({
            name,
            role,
            type,
            phone,
            email,
            address,
          })
          .returning();

        app.logger.info({ contactId: result[0].id }, 'Contact created');
        reply.status(201);
        return formatContact(result[0]);
      } catch (error) {
        app.logger.error({ err: error, name }, 'Failed to create contact');
        throw error;
      }
    }
  );

  // PUT /api/admin/contacts/:id - Update contact (admin only)
  fastify.put<{ Params: { id: string }; Body: ContactUpdateBody }>(
    '/api/admin/contacts/:id',
    {
      schema: {
        description: 'Update a contact (admin only)',
        tags: ['admin', 'contacts'],
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
            role: { type: 'string' },
            type: { type: 'string' },
            phone: { type: 'string' },
            email: { type: 'string' },
            address: { type: 'string' },
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
      const updates = { ...request.body, updatedAt: new Date() };

      app.logger.info({ contactId: id }, 'Updating contact');

      try {
        const result = await app.db
          .update(schema.contacts)
          .set(updates)
          .where(eq(schema.contacts.id, id))
          .returning();

        if (result.length === 0) {
          app.logger.warn({ contactId: id }, 'Contact not found');
          reply.status(404);
          return { error: 'Not found' };
        }

        app.logger.info({ contactId: id }, 'Contact updated');
        return formatContact(result[0]);
      } catch (error) {
        app.logger.error({ err: error, contactId: id }, 'Failed to update contact');
        throw error;
      }
    }
  );

  // DELETE /api/admin/contacts/:id - Delete contact (admin only)
  fastify.delete<{ Params: { id: string } }>(
    '/api/admin/contacts/:id',
    {
      schema: {
        description: 'Delete a contact (admin only)',
        tags: ['admin', 'contacts'],
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
      app.logger.info({ contactId: id }, 'Deleting contact');

      try {
        const result = await app.db
          .delete(schema.contacts)
          .where(eq(schema.contacts.id, id))
          .returning();

        if (result.length === 0) {
          app.logger.warn({ contactId: id }, 'Contact not found');
          reply.status(404);
          return { error: 'Not found' };
        }

        app.logger.info({ contactId: id }, 'Contact deleted');
        return { success: true };
      } catch (error) {
        app.logger.error({ err: error, contactId: id }, 'Failed to delete contact');
        throw error;
      }
    }
  );
}
