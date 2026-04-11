import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { eq, desc } from 'drizzle-orm';
import * as schema from '../db/schema.js';
import type { App } from '../index.js';

interface InboxMessageBody {
  author_name: string;
  author_email?: string;
  content: string;
}

export function register(app: App, fastify: FastifyInstance) {
  // POST /api/inbox-messages - Create inbox message
  fastify.post<{ Body: InboxMessageBody }>(
    '/api/inbox-messages',
    {
      schema: {
        description: 'Create inbox message',
        tags: ['inbox-messages'],
        body: {
          type: 'object',
          required: ['author_name', 'content'],
          properties: {
            author_name: { type: 'string' },
            author_email: { type: 'string' },
            content: { type: 'string' },
          },
        },
        response: {
          201: { type: 'object' },
        },
      },
    },
    async (request: FastifyRequest<{ Body: InboxMessageBody }>, reply: FastifyReply) => {
      const { author_name, author_email, content } = request.body;

      app.logger.info({ authorName: author_name }, 'Creating inbox message');

      try {
        const result = await app.db
          .insert(schema.inboxMessages)
          .values({
            authorName: author_name,
            authorEmail: author_email || null,
            content,
            isRead: false,
            createdAt: new Date(),
          })
          .returning();

        const message = result[0];
        app.logger.info({ messageId: message.id }, 'Inbox message created');

        reply.status(201);
        return {
          success: true,
          message: {
            id: message.id,
            author_name: message.authorName,
            content: message.content,
            created_at: message.createdAt.toISOString(),
          },
        };
      } catch (error) {
        app.logger.error({ err: error, authorName: author_name }, 'Failed to create inbox message');
        throw error;
      }
    }
  );

  // GET /api/inbox-messages - Get all inbox messages
  fastify.get(
    '/api/inbox-messages',
    {
      schema: {
        description: 'Get all inbox messages',
        tags: ['inbox-messages'],
        response: {
          200: { type: 'object' },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      app.logger.info('Fetching all inbox messages');

      try {
        const allMessages = await app.db
          .select()
          .from(schema.inboxMessages)
          .orderBy(desc(schema.inboxMessages.createdAt));

        const total = allMessages.length;
        const unread = allMessages.filter(m => !m.isRead).length;

        app.logger.info({ total, unread }, 'Inbox messages retrieved');

        return {
          messages: allMessages.map(m => ({
            id: m.id,
            author_name: m.authorName,
            author_email: m.authorEmail,
            content: m.content,
            is_read: m.isRead,
            created_at: m.createdAt.toISOString(),
          })),
          total,
          unread,
        };
      } catch (error) {
        app.logger.error({ err: error }, 'Failed to fetch inbox messages');
        throw error;
      }
    }
  );

  // PATCH /api/inbox-messages/:id/read - Mark message as read
  fastify.patch<{ Params: { id: string } }>(
    '/api/inbox-messages/:id/read',
    {
      schema: {
        description: 'Mark inbox message as read',
        tags: ['inbox-messages'],
        params: {
          type: 'object',
          required: ['id'],
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
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const { id } = request.params;

      app.logger.info({ messageId: id }, 'Marking message as read');

      try {
        const result = await app.db
          .update(schema.inboxMessages)
          .set({ isRead: true })
          .where(eq(schema.inboxMessages.id, id))
          .returning();

        if (result.length === 0) {
          app.logger.info({ messageId: id }, 'Message not found');
          reply.status(404);
          return { error: 'Message not found' };
        }

        app.logger.info({ messageId: id }, 'Message marked as read');
        return { success: true };
      } catch (error) {
        app.logger.error({ err: error, messageId: id }, 'Failed to mark message as read');
        throw error;
      }
    }
  );

  // DELETE /api/inbox-messages/:id - Delete inbox message
  fastify.delete<{ Params: { id: string } }>(
    '/api/inbox-messages/:id',
    {
      schema: {
        description: 'Delete inbox message',
        tags: ['inbox-messages'],
        params: {
          type: 'object',
          required: ['id'],
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
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const { id } = request.params;

      app.logger.info({ messageId: id }, 'Deleting inbox message');

      try {
        const result = await app.db
          .delete(schema.inboxMessages)
          .where(eq(schema.inboxMessages.id, id))
          .returning();

        if (result.length === 0) {
          app.logger.info({ messageId: id }, 'Message not found');
          reply.status(404);
          return { error: 'Message not found' };
        }

        app.logger.info({ messageId: id }, 'Inbox message deleted');
        return { success: true };
      } catch (error) {
        app.logger.error({ err: error, messageId: id }, 'Failed to delete inbox message');
        throw error;
      }
    }
  );

  // GET /api/admin/stats - Get admin statistics
  fastify.get(
    '/api/admin/stats',
    {
      schema: {
        description: 'Get admin statistics',
        tags: ['admin'],
        response: {
          200: { type: 'object' },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      app.logger.info('Fetching admin statistics');

      try {
        const allMembers = await app.db.select().from(schema.members);
        const allMessages = await app.db.select().from(schema.inboxMessages);

        const totalMembers = allMembers.length;
        const pendingMembers = allMembers.filter(m => m.status === 'pending').length;
        const approvedMembers = allMembers.filter(m => m.status === 'approved').length;
        const totalMessages = allMessages.length;
        const unreadMessages = allMessages.filter(m => !m.isRead).length;

        app.logger.info(
          { totalMembers, pendingMembers, approvedMembers, totalMessages, unreadMessages },
          'Admin statistics retrieved'
        );

        return {
          total_members: totalMembers,
          pending_members: pendingMembers,
          approved_members: approvedMembers,
          total_messages: totalMessages,
          unread_messages: unreadMessages,
        };
      } catch (error) {
        app.logger.error({ err: error }, 'Failed to fetch admin statistics');
        throw error;
      }
    }
  );
}

export async function seedMembersAndMessages(app: App) {
  try {
    app.logger.info('Seeding members and inbox messages');

    // Seed members
    const existingMembers = await app.db.select().from(schema.members);
    if (existingMembers.length === 0) {
      const seedMembers = [
        {
          memberNumber: 'ARM-001',
          fullName: 'Amadou Coulibaly',
          email: 'amadou@example.com',
          phone: '0022376123456',
          city: 'Bamako',
          country: 'Mali',
          membershipType: 'actif' as const,
          status: 'approved',
        },
        {
          memberNumber: 'ARM-002',
          fullName: 'Fatoumata Diallo',
          email: 'fatoumata@example.com',
          phone: '0022375987654',
          city: 'Sikasso',
          country: 'Mali',
          membershipType: 'standard' as const,
          status: 'pending',
        },
        {
          memberNumber: 'ARM-003',
          fullName: 'Ibrahim Traoré',
          email: 'ibrahim@example.com',
          phone: '0034612345678',
          city: 'Barcelona',
          country: 'Spain',
          membershipType: 'sympathisant' as const,
          status: 'approved',
        },
      ];

      const now = new Date();
      await app.db.insert(schema.members).values(
        seedMembers.map(m => ({
          ...m,
          createdAt: now,
          updatedAt: now,
        }))
      );

      app.logger.info({ count: seedMembers.length }, 'Members seeded');
    }

    // Seed inbox messages
    const existingMessages = await app.db.select().from(schema.inboxMessages);
    if (existingMessages.length === 0) {
      const seedMessages = [
        {
          authorName: 'Moussa Keita',
          authorEmail: 'moussa@example.com',
          content: "Bonjour, je souhaite avoir plus d'informations sur les activités du parti.",
        },
        {
          authorName: 'Aminata Sanogo',
          authorEmail: 'aminata@example.com',
          content: 'Félicitations pour le travail accompli. Nous sommes fiers de notre parti.',
        },
        {
          authorName: 'Seydou Bah',
          authorEmail: 'seydou@example.com',
          content: 'Quand aura lieu la prochaine réunion des membres ?',
        },
      ];

      const now = new Date();
      await app.db.insert(schema.inboxMessages).values(
        seedMessages.map(m => ({
          ...m,
          isRead: false,
          createdAt: now,
        }))
      );

      app.logger.info({ count: seedMessages.length }, 'Inbox messages seeded');
    }
  } catch (error) {
    app.logger.error({ err: error }, 'Failed to seed members and messages');
  }
}
