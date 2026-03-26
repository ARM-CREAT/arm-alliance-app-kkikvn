import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { eq, desc, asc } from 'drizzle-orm';
import * as schema from '../db/schema.js';
import type { App } from '../index.js';

interface ContactMessageBody {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
}

interface ContactBody {
  name: string;
  role: string;
  phone?: string;
  email?: string;
  address?: string;
  type?: string;
}

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

function verifyAdminPassword(request: FastifyRequest, reply: FastifyReply): boolean {
  const password = request.headers['x-admin-password'];
  if (!password || password !== ADMIN_PASSWORD) {
    reply.status(401).send({ success: false, error: 'Non autorisé' });
    return false;
  }
  return true;
}

function formatContactMessage(msg: any) {
  return {
    id: msg.id,
    name: msg.name,
    email: msg.email,
    phone: msg.phone || null,
    subject: msg.subject,
    message: msg.message,
    status: msg.status,
    createdAt: msg.createdAt instanceof Date ? msg.createdAt.toISOString() : new Date(msg.createdAt).toISOString(),
  };
}

function formatContact(contact: any) {
  return {
    id: contact.id,
    name: contact.name,
    role: contact.role,
    phone: contact.phone || null,
    email: contact.email || null,
    address: contact.address || null,
    type: contact.type,
    imageUrl: null,
    createdAt: contact.createdAt instanceof Date ? contact.createdAt.toISOString() : new Date(contact.createdAt).toISOString(),
    updatedAt: contact.updatedAt instanceof Date ? contact.updatedAt.toISOString() : new Date(contact.updatedAt).toISOString(),
  };
}

export function register(app: App, fastify: FastifyInstance) {
  const requireAuth = app.requireAuth();

  // ==================== CONTACT MESSAGES ====================

  // POST /api/contacts - Submit contact form message (public)
  fastify.post<{ Body: ContactMessageBody }>(
    '/api/contacts',
    {
      schema: {
        description: 'Submit a contact form message',
        tags: ['contacts'],
        body: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            email: { type: 'string' },
            phone: { type: 'string' },
            subject: { type: 'string' },
            message: { type: 'string' },
          },
          required: ['name', 'email', 'subject', 'message'],
        },
        response: {
          201: { type: 'object' },
          400: { type: 'object' },
        },
      },
    },
    async (request, reply) => {
      const { name, email, phone, subject, message } = request.body;

      if (!name || !email || !subject || !message) {
        app.logger.warn({ body: request.body }, 'Missing required fields in contact message');
        reply.status(400);
        return { success: false, error: 'Missing required fields: name, email, subject, message' };
      }

      app.logger.info({ email, subject }, 'Receiving contact message');

      try {
        const result = await app.db
          .insert(schema.contactMessages)
          .values({
            name,
            email,
            phone: phone || null,
            subject,
            message,
            status: 'unread',
          })
          .returning();

        app.logger.info({ messageId: result[0].id, subject }, 'Contact message received');
        reply.status(201);
        return {
          success: true,
          message: 'Message envoyé avec succès',
          data: {
            id: result[0].id,
            name: result[0].name,
            email: result[0].email,
            subject: result[0].subject,
            createdAt: result[0].createdAt instanceof Date ? result[0].createdAt.toISOString() : new Date(result[0].createdAt).toISOString(),
          },
        };
      } catch (error) {
        app.logger.error({ err: error, email }, 'Failed to create contact message');
        throw error;
      }
    }
  );

  // GET /api/admin/contacts - Get all contact messages (admin only)
  fastify.get(
    '/api/admin/contacts',
    {
      schema: {
        description: 'Get all contact form messages (admin only)',
        tags: ['admin', 'contacts'],
        response: {
          200: { type: 'object' },
          401: { type: 'object' },
        },
      },
    },
    async (request, reply) => {
      if (!verifyAdminPassword(request, reply)) return;

      app.logger.info('Fetching contact messages (admin)');

      try {
        const result = await app.db
          .select()
          .from(schema.contactMessages)
          .orderBy(desc(schema.contactMessages.createdAt));

        app.logger.info({ count: result.length }, 'Contact messages fetched');
        return {
          success: true,
          data: result.map(formatContactMessage),
          total: result.length,
        };
      } catch (error) {
        app.logger.error({ err: error }, 'Failed to fetch contact messages');
        throw error;
      }
    }
  );

  // ==================== PARTY CONTACTS ====================

  // GET /api/admin/party-contacts - Get all party contacts (admin only)
  fastify.get(
    '/api/admin/party-contacts',
    {
      schema: {
        description: 'Get all party contacts (admin only)',
        tags: ['admin', 'contacts'],
        response: {
          200: { type: 'object' },
          401: { type: 'object' },
        },
      },
    },
    async (request, reply) => {
      if (!verifyAdminPassword(request, reply)) return;

      app.logger.info('Fetching party contacts');

      try {
        const result = await app.db
          .select()
          .from(schema.contacts)
          .orderBy(asc(schema.contacts.createdAt));

        app.logger.info({ count: result.length }, 'Party contacts fetched');
        return {
          success: true,
          data: result.map(formatContact),
          total: result.length,
        };
      } catch (error) {
        app.logger.error({ err: error }, 'Failed to fetch party contacts');
        throw error;
      }
    }
  );

  // POST /api/admin/party-contacts - Create party contact (admin only)
  fastify.post<{ Body: ContactBody }>(
    '/api/admin/party-contacts',
    {
      schema: {
        description: 'Create a party contact (admin only)',
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

      const { name, role, phone, email, address } = request.body;
      const type = request.body.type || 'general';

      if (!name || !role) {
        app.logger.warn({ body: request.body }, 'Missing required fields');
        reply.status(400);
        return { success: false, error: 'Missing required fields: name, role' };
      }

      app.logger.info({ name, role }, 'Creating party contact');

      try {
        const result = await app.db
          .insert(schema.contacts)
          .values({
            name,
            role,
            type,
            phone: phone || null,
            email: email || null,
            address: address || null,
          })
          .returning();

        app.logger.info({ contactId: result[0].id, name }, 'Party contact created');
        reply.status(201);
        return {
          success: true,
          message: 'Contact créé avec succès',
          data: formatContact(result[0]),
        };
      } catch (error) {
        app.logger.error({ err: error, name }, 'Failed to create party contact');
        throw error;
      }
    }
  );

  // PUT /api/admin/party-contacts/:id - Update party contact (admin only)
  fastify.put<{ Params: { id: string }; Body: Partial<ContactBody> }>(
    '/api/admin/party-contacts/:id',
    {
      schema: {
        description: 'Update a party contact (admin only)',
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
      const updates: any = {};

      if (request.body.name !== undefined) updates.name = request.body.name;
      if (request.body.role !== undefined) updates.role = request.body.role;
      if (request.body.type !== undefined) updates.type = request.body.type;
      if (request.body.phone !== undefined) updates.phone = request.body.phone;
      if (request.body.email !== undefined) updates.email = request.body.email;
      if (request.body.address !== undefined) updates.address = request.body.address;
      updates.updatedAt = new Date();

      if (Object.keys(updates).length === 1) {
        app.logger.warn({ contactId: id }, 'No fields to update');
        reply.status(400);
        return { success: false, error: 'No fields to update' };
      }

      app.logger.info({ contactId: id }, 'Updating party contact');

      try {
        const result = await app.db
          .update(schema.contacts)
          .set(updates)
          .where(eq(schema.contacts.id, id))
          .returning();

        if (result.length === 0) {
          app.logger.warn({ contactId: id }, 'Party contact not found');
          reply.status(404);
          return { success: false, error: 'Contact non trouvé' };
        }

        app.logger.info({ contactId: id }, 'Party contact updated');
        return {
          success: true,
          message: 'Contact mis à jour avec succès',
          data: formatContact(result[0]),
        };
      } catch (error) {
        app.logger.error({ err: error, contactId: id }, 'Failed to update party contact');
        throw error;
      }
    }
  );

  // DELETE /api/admin/party-contacts/:id - Delete party contact (admin only)
  fastify.delete<{ Params: { id: string } }>(
    '/api/admin/party-contacts/:id',
    {
      schema: {
        description: 'Delete a party contact (admin only)',
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
      app.logger.info({ contactId: id }, 'Deleting party contact');

      try {
        const result = await app.db
          .delete(schema.contacts)
          .where(eq(schema.contacts.id, id))
          .returning();

        if (result.length === 0) {
          app.logger.warn({ contactId: id }, 'Party contact not found');
          reply.status(404);
          return { success: false, error: 'Contact non trouvé' };
        }

        app.logger.info({ contactId: id }, 'Party contact deleted');
        return {
          success: true,
          message: 'Contact supprimé avec succès',
        };
      } catch (error) {
        app.logger.error({ err: error, contactId: id }, 'Failed to delete party contact');
        throw error;
      }
    }
  );
}
