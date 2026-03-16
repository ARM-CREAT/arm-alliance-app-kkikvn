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
  type?: string;
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
    name: 'Secrétariat ARM',
    role: 'Contact principal',
    phone: '+34632607101',
    email: 'contact@arm-mali.org',
    address: 'Rue 530, Porte 245, Sebenikoro, Bamako, Mali',
    type: 'general',
  },
  {
    name: 'Bureau Mali',
    role: 'Représentation nationale',
    phone: '+22376304869',
    email: 'mali@arm-mali.org',
    address: 'Bamako, Mali',
    type: 'regional',
  },
  {
    name: 'Relations Presse',
    role: 'Communication & Médias',
    phone: '+34632607101',
    email: 'presse@arm-mali.org',
    address: 'Bamako, Mali',
    type: 'media',
  },
];

function verifyAdminPassword(request: FastifyRequest, reply: FastifyReply): boolean {
  const password = request.headers['x-admin-password'];
  if (password !== ADMIN_PASSWORD) {
    reply.status(401).send({
      error: 'Unauthorized',
    });
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
    createdAt: contact.createdAt.toISOString(),
    updatedAt: contact.updatedAt.toISOString(),
  };
}

export async function seedContacts(app: App) {
  try {
    const existing = await app.db.select().from(schema.contacts);
    if (existing.length === 0) {
      await app.db.insert(schema.contacts).values(DEFAULT_CONTACTS);
      app.logger.info(
        { count: DEFAULT_CONTACTS.length },
        'Default contacts seeded'
      );
    }
  } catch (error) {
    app.logger.error({ err: error }, 'Failed to seed contacts');
  }
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
          200: { type: 'object' },
        },
      },
    },
    async (request, reply) => {
      app.logger.info('Fetching contacts');

      try {
        // Check if table is empty and seed if needed
        const existingCount = await app.db
          .select()
          .from(schema.contacts);

        if (existingCount.length === 0) {
          app.logger.info('Contacts table is empty, seeding default contacts');
          await app.db.insert(schema.contacts).values(DEFAULT_CONTACTS);
        }

        // Fetch all contacts
        const result = await app.db
          .select()
          .from(schema.contacts)
          .orderBy(schema.contacts.createdAt);

        app.logger.info(
          { count: result.length },
          'Contacts fetched successfully'
        );
        return { contacts: result.map(formatContact) };
      } catch (error) {
        app.logger.error({ err: error }, 'Failed to fetch contacts');
        throw error;
      }
    }
  );

  // GET /api/admin/contacts - Get all contacts (admin)
  fastify.get(
    '/api/admin/contacts',
    {
      schema: {
        description: 'Get all contacts (admin only)',
        tags: ['admin', 'contacts'],
        response: {
          200: { type: 'object' },
          401: { type: 'object' },
        },
      },
    },
    async (request, reply) => {
      if (!verifyAdminPassword(request, reply)) return;

      app.logger.info('Admin fetching contacts');

      try {
        const result = await app.db
          .select()
          .from(schema.contacts)
          .orderBy(schema.contacts.createdAt);

        app.logger.info(
          { count: result.length },
          'Admin contacts fetched successfully'
        );
        return { contacts: result.map(formatContact) };
      } catch (error) {
        app.logger.error({ err: error }, 'Failed to fetch admin contacts');
        throw error;
      }
    }
  );

  // POST /api/admin/contacts - Create contact (admin)
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
            phone: { type: 'string' },
            email: { type: 'string' },
            address: { type: 'string' },
            type: { type: 'string' },
          },
          required: ['name', 'role'],
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

      const { name, role, phone, email, address, type } = request.body;

      // Validate required fields
      if (!name || !role) {
        app.logger.warn(
          { name, role },
          'Missing required fields for contact creation'
        );
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
            phone,
            email,
            address,
            type: type || 'general',
          })
          .returning();

        app.logger.info({ contactId: result[0].id }, 'Contact created successfully');
        reply.status(201);
        return { success: true, contact: formatContact(result[0]) };
      } catch (error) {
        app.logger.error({ err: error, name }, 'Failed to create contact');
        throw error;
      }
    }
  );

  // PUT /api/admin/contacts/:id - Update contact (admin)
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
            phone: { type: 'string' },
            email: { type: 'string' },
            address: { type: 'string' },
            type: { type: 'string' },
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
      const updates = request.body;

      app.logger.info({ contactId: id }, 'Updating contact');

      try {
        const result = await app.db
          .update(schema.contacts)
          .set({
            ...updates,
            updatedAt: new Date(),
          })
          .where(eq(schema.contacts.id, id))
          .returning();

        if (result.length === 0) {
          app.logger.warn({ contactId: id }, 'Contact not found');
          reply.status(404);
          return { error: 'Contact not found' };
        }

        app.logger.info({ contactId: id }, 'Contact updated successfully');
        return { success: true, contact: formatContact(result[0]) };
      } catch (error) {
        app.logger.error(
          { err: error, contactId: id },
          'Failed to update contact'
        );
        throw error;
      }
    }
  );

  // DELETE /api/admin/contacts/:id - Delete contact (admin)
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
          return { error: 'Contact not found' };
        }

        app.logger.info({ contactId: id }, 'Contact deleted successfully');
        return { success: true };
      } catch (error) {
        app.logger.error(
          { err: error, contactId: id },
          'Failed to delete contact'
        );
        throw error;
      }
    }
  );
}
