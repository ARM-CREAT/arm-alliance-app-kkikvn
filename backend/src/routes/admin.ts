import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { eq } from 'drizzle-orm';
import * as schema from '../db/schema.js';
import type { App } from '../index.js';
import { verifyAdminAuth } from '../utils/adminAuth.js';

interface NewsBody {
  title: string;
  content: string;
  imageUrl?: string;
  videoUrl?: string;
}

interface EventBody {
  title: string;
  description: string;
  date: string;
  location: string;
  imageUrl?: string;
}

interface LeadershipBody {
  name: string;
  position: string;
  phone?: string;
  address?: string;
  location?: string;
  order?: number;
}

interface ProgramBody {
  category: string;
  title: string;
  description: string;
  order?: number;
}

interface AdminLoginBody {
  password: string;
  secret?: string;
}

/**
 * Create a masked password hint showing first 3 and last 3 characters with *** in between
 * Example: "admin123" -> "adm***123"
 */
function getMaskedPasswordHint(password: string): string {
  if (password.length <= 6) {
    return password.replace(/./g, '*');
  }
  const first3 = password.substring(0, 3);
  const last3 = password.substring(password.length - 3);
  return `${first3}***${last3}`;
}

export function register(app: App, fastify: FastifyInstance) {
  // GET /api/admin/config-info - Public endpoint for password configuration info
  fastify.get(
    '/api/admin/config-info',
    {
      schema: {
        description: 'Get admin password configuration info (public, for diagnostics)',
        tags: ['admin', 'auth'],
        response: {
          200: {
            type: 'object',
            properties: {
              passwordConfigured: { type: 'boolean' },
              passwordLength: { type: 'number' },
              passwordHint: { type: 'string' },
              environment: { type: 'string' },
              isDefault: { type: 'boolean' },
            },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
      const isDefaultPassword = !process.env.ADMIN_PASSWORD;
      const environment = process.env.NODE_ENV || 'development';

      app.logger.info(
        { environment, isDefault: isDefaultPassword },
        'Config info endpoint accessed'
      );

      return reply.status(200).send({
        passwordConfigured: !!process.env.ADMIN_PASSWORD,
        passwordLength: ADMIN_PASSWORD.length,
        passwordHint: getMaskedPasswordHint(ADMIN_PASSWORD),
        environment,
        isDefault: isDefaultPassword,
      });
    }
  );

  // POST /api/admin/login - Admin login endpoint
  fastify.post<{ Body: AdminLoginBody }>(
    '/api/admin/login',
    {
      schema: {
        description: 'Admin login - authenticate with admin credentials',
        tags: ['admin', 'auth'],
        body: {
          type: 'object',
          properties: {
            password: { type: 'string' },
            secret: { type: 'string' },
          },
          required: ['password'],
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              userId: { type: 'string' },
              username: { type: 'string' },
              message: { type: 'string' },
            },
          },
          401: {
            type: 'object',
            properties: {
              error: { type: 'string' },
              details: { type: 'string' },
            },
          },
        },
      },
    },
    async (request: FastifyRequest<{ Body: AdminLoginBody }>, reply: FastifyReply) => {
      const { password, secret } = request.body;
      const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

      app.logger.info(
        { hasPassword: !!password, hasSecret: !!secret },
        'Admin login attempt started'
      );

      try {
        // Step 1: Validate password presence
        if (!password) {
          app.logger.warn(
            {},
            'Login step 1 failed: Password field is missing'
          );
          return reply.status(401).send({
            error: 'Authentication failed',
            details: 'Password field is required',
          });
        }

        app.logger.debug(
          { receivedLength: password.length },
          'Login step 1 passed: Password field present'
        );

        // Step 2: Validate password length matches
        if (password.length !== ADMIN_PASSWORD.length) {
          const hint = getMaskedPasswordHint(ADMIN_PASSWORD);
          app.logger.warn(
            {
              receivedLength: password.length,
              expectedLength: ADMIN_PASSWORD.length,
              expectedHint: hint,
            },
            'Login step 2 failed: Password length mismatch'
          );
          return reply.status(401).send({
            error: 'Authentication failed',
            details: `Password length mismatch. Expected ${ADMIN_PASSWORD.length} characters, got ${password.length}. Expected format: ${hint}`,
          });
        }

        app.logger.debug(
          { passwordLength: password.length },
          'Login step 2 passed: Password length correct'
        );

        // Step 3: Validate password value
        if (password !== ADMIN_PASSWORD) {
          const hint = getMaskedPasswordHint(ADMIN_PASSWORD);
          app.logger.warn(
            {
              receivedHint: getMaskedPasswordHint(password),
              expectedHint: hint,
            },
            'Login step 3 failed: Password value mismatch'
          );
          return reply.status(401).send({
            error: 'Authentication failed',
            details: `Password incorrect. Expected format: ${hint}`,
          });
        }

        app.logger.debug({}, 'Login step 3 passed: Password value correct');

        // Step 4: Validate optional secret if provided
        if (secret !== undefined) {
          if (secret.length !== ADMIN_PASSWORD.length) {
            app.logger.warn(
              {
                secretReceivedLength: secret.length,
                secretExpectedLength: ADMIN_PASSWORD.length,
              },
              'Login step 4 failed: Secret length mismatch'
            );
            return reply.status(401).send({
              error: 'Authentication failed',
              details: `Secret length mismatch. Expected ${ADMIN_PASSWORD.length} characters, got ${secret.length}`,
            });
          }

          if (secret !== ADMIN_PASSWORD) {
            const hint = getMaskedPasswordHint(ADMIN_PASSWORD);
            app.logger.warn(
              {
                secretHint: getMaskedPasswordHint(secret),
                expectedHint: hint,
              },
              'Login step 4 failed: Secret value mismatch'
            );
            return reply.status(401).send({
              error: 'Authentication failed',
              details: `Secret incorrect. Expected format: ${hint}`,
            });
          }

          app.logger.debug({}, 'Login step 4 passed: Secret value correct');
        } else {
          app.logger.debug({}, 'Login step 4 skipped: No secret provided');
        }

        app.logger.info({}, 'Admin login successful - all authentication steps passed');

        return reply.status(200).send({
          success: true,
          userId: 'admin',
          username: 'administrator',
          message: 'Admin authentication successful',
        });
      } catch (error) {
        app.logger.error(
          { err: error },
          'Error during admin login'
        );
        return reply.status(500).send({
          error: 'Authentication error',
          details: 'An unexpected error occurred during authentication',
        });
      }
    }
  );

  // POST /api/admin/verify - Verify admin credentials via headers
  fastify.post(
    '/api/admin/verify',
    {
      schema: {
        description: 'Verify admin credentials provided in headers',
        tags: ['admin', 'auth'],
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              message: { type: 'string' },
            },
          },
          403: {
            type: 'object',
            properties: {
              error: { type: 'string' },
            },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const admin = await verifyAdminAuth(request, reply, app);
      if (!admin) {
        return;
      }

      return reply.status(200).send({
        success: true,
        message: 'Admin credentials verified successfully',
      });
    }
  );
  // Admin News Management

  // POST /api/admin/news - Create news article
  fastify.post<{ Body: NewsBody }>(
    '/api/admin/news',
    {
      schema: {
        description: 'Create a news article (admin only)',
        tags: ['admin', 'news'],
        body: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            content: { type: 'string' },
            imageUrl: { type: 'string' },
            videoUrl: { type: 'string' },
          },
          required: ['title', 'content'],
        },
        response: {
          200: { type: 'object' },
        },
      },
    },
    async (request: FastifyRequest<{ Body: NewsBody }>, reply: FastifyReply) => {
      const admin = await verifyAdminAuth(request, reply, app);
      if (!admin) return;

      const { title, content, imageUrl, videoUrl } = request.body;
      app.logger.info({ title, adminId: admin.userId }, 'Admin creating news');

      try {
        const result = await app.db
          .insert(schema.news)
          .values({
            title,
            content,
            imageUrl,
            videoUrl,
            createdBy: admin.username,
          })
          .returning();

        app.logger.info(
          { newsId: result[0].id, adminId: admin.userId },
          'News article created by admin'
        );
        return result[0];
      } catch (error) {
        app.logger.error(
          { err: error, title, adminId: admin.userId },
          'Failed to create news article'
        );
        throw error;
      }
    }
  );

  // PUT /api/admin/news/:id - Update news article
  fastify.put<{ Params: { id: string }; Body: Partial<NewsBody> }>(
    '/api/admin/news/:id',
    {
      schema: {
        description: 'Update a news article (admin only)',
        tags: ['admin', 'news'],
        params: {
          type: 'object',
          properties: {
            id: { type: 'string' },
          },
        },
        body: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            content: { type: 'string' },
            imageUrl: { type: 'string' },
            videoUrl: { type: 'string' },
          },
        },
        response: {
          200: { type: 'object' },
        },
      },
    },
    async (
      request: FastifyRequest<{ Params: { id: string }; Body: Partial<NewsBody> }>,
      reply: FastifyReply
    ) => {
      const admin = await verifyAdminAuth(request, reply, app);
      if (!admin) return;

      const { id } = request.params;
      const updates = request.body;
      app.logger.info({ newsId: id, adminId: admin.userId }, 'Admin updating news');

      try {
        const result = await app.db
          .update(schema.news)
          .set(updates)
          .where(eq(schema.news.id, id))
          .returning();

        app.logger.info(
          { newsId: id, adminId: admin.userId },
          'News article updated by admin'
        );
        return result[0];
      } catch (error) {
        app.logger.error(
          { err: error, newsId: id, adminId: admin.userId },
          'Failed to update news article'
        );
        throw error;
      }
    }
  );

  // DELETE /api/admin/news/:id - Delete news article
  fastify.delete<{ Params: { id: string } }>(
    '/api/admin/news/:id',
    {
      schema: {
        description: 'Delete a news article (admin only)',
        tags: ['admin', 'news'],
        params: {
          type: 'object',
          properties: {
            id: { type: 'string' },
          },
        },
        response: {
          200: { type: 'object' },
        },
      },
    },
    async (
      request: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply
    ) => {
      const admin = await verifyAdminAuth(request, reply, app);
      if (!admin) return;

      const { id } = request.params;
      app.logger.info({ newsId: id, adminId: admin.userId }, 'Admin deleting news');

      try {
        const result = await app.db
          .delete(schema.news)
          .where(eq(schema.news.id, id))
          .returning();

        app.logger.info(
          { newsId: id, adminId: admin.userId },
          'News article deleted by admin'
        );
        return { success: true };
      } catch (error) {
        app.logger.error(
          { err: error, newsId: id, adminId: admin.userId },
          'Failed to delete news article'
        );
        throw error;
      }
    }
  );

  // Admin Events Management

  // POST /api/admin/events - Create event (public)
  fastify.post<{ Body: EventBody }>(
    '/api/admin/events',
    {
      schema: {
        description: 'Create an event',
        tags: ['admin', 'events'],
        body: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            description: { type: 'string' },
            date: { type: 'string' },
            location: { type: 'string' },
            imageUrl: { type: 'string' },
          },
          required: ['title', 'description', 'date', 'location'],
        },
        response: {
          200: { type: 'object' },
        },
      },
    },
    async (request: FastifyRequest<{ Body: EventBody }>, reply: FastifyReply) => {
      const { title, description, date, location, imageUrl } = request.body;
      app.logger.info({ title }, 'Creating event');

      try {
        const result = await app.db
          .insert(schema.events)
          .values({
            title,
            description,
            date: new Date(date),
            location,
            imageUrl,
          })
          .returning();

        app.logger.info(
          { eventId: result[0].id },
          'Event created successfully'
        );
        return result[0];
      } catch (error) {
        app.logger.error(
          { err: error, title },
          'Failed to create event'
        );
        throw error;
      }
    }
  );

  // PUT /api/admin/events/:id - Update event
  fastify.put<{ Params: { id: string }; Body: Partial<EventBody> }>(
    '/api/admin/events/:id',
    {
      schema: {
        description: 'Update an event (admin only)',
        tags: ['admin', 'events'],
        params: {
          type: 'object',
          properties: {
            id: { type: 'string' },
          },
        },
        body: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            description: { type: 'string' },
            date: { type: 'string' },
            location: { type: 'string' },
            imageUrl: { type: 'string' },
          },
        },
        response: {
          200: { type: 'object' },
        },
      },
    },
    async (
      request: FastifyRequest<{ Params: { id: string }; Body: Partial<EventBody> }>,
      reply: FastifyReply
    ) => {
      const { id } = request.params;
      const updates = {
        ...request.body,
        ...(request.body.date && { date: new Date(request.body.date) }),
      };

      app.logger.info({ eventId: id }, 'Updating event');

      try {
        const result = await app.db
          .update(schema.events)
          .set(updates)
          .where(eq(schema.events.id, id))
          .returning();

        app.logger.info(
          { eventId: id },
          'Event updated successfully'
        );
        return result[0];
      } catch (error) {
        app.logger.error(
          { err: error, eventId: id },
          'Failed to update event'
        );
        throw error;
      }
    }
  );

  // DELETE /api/admin/events/:id - Delete event (public)
  fastify.delete<{ Params: { id: string } }>(
    '/api/admin/events/:id',
    {
      schema: {
        description: 'Delete an event',
        tags: ['admin', 'events'],
        params: {
          type: 'object',
          properties: {
            id: { type: 'string' },
          },
        },
        response: {
          200: { type: 'object' },
        },
      },
    },
    async (
      request: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply
    ) => {
      const { id } = request.params;
      app.logger.info({ eventId: id }, 'Deleting event');

      try {
        await app.db
          .delete(schema.events)
          .where(eq(schema.events.id, id));

        app.logger.info(
          { eventId: id },
          'Event deleted successfully'
        );
        return { success: true };
      } catch (error) {
        app.logger.error(
          { err: error, eventId: id },
          'Failed to delete event'
        );
        throw error;
      }
    }
  );

  // Admin Leadership Management

  // POST /api/admin/leadership - Create leadership member (public)
  fastify.post<{ Body: LeadershipBody }>(
    '/api/admin/leadership',
    {
      schema: {
        description: 'Create a leadership member',
        tags: ['admin', 'leadership'],
        body: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            position: { type: 'string' },
            phone: { type: 'string' },
            address: { type: 'string' },
            location: { type: 'string' },
            order: { type: 'number' },
          },
          required: ['name', 'position'],
        },
        response: {
          200: { type: 'object' },
        },
      },
    },
    async (request: FastifyRequest<{ Body: LeadershipBody }>, reply: FastifyReply) => {
      const { name, position, phone, address, location, order } = request.body;
      app.logger.info({ position }, 'Creating leadership member');

      try {
        const result = await app.db
          .insert(schema.leadership)
          .values({
            name,
            position,
            phone,
            address,
            location,
            order: order || 0,
          })
          .returning();

        app.logger.info(
          { leaderId: result[0].id },
          'Leadership member created successfully'
        );
        return result[0];
      } catch (error) {
        app.logger.error(
          { err: error, position },
          'Failed to create leadership member'
        );
        throw error;
      }
    }
  );

  // PUT /api/admin/leadership/:id - Update leadership member (public)
  fastify.put<{ Params: { id: string }; Body: Partial<LeadershipBody> }>(
    '/api/admin/leadership/:id',
    {
      schema: {
        description: 'Update a leadership member',
        tags: ['admin', 'leadership'],
        params: {
          type: 'object',
          properties: {
            id: { type: 'string' },
          },
        },
        body: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            position: { type: 'string' },
            phone: { type: 'string' },
            address: { type: 'string' },
            location: { type: 'string' },
            order: { type: 'number' },
          },
        },
        response: {
          200: { type: 'object' },
        },
      },
    },
    async (
      request: FastifyRequest<{ Params: { id: string }; Body: Partial<LeadershipBody> }>,
      reply: FastifyReply
    ) => {
      const { id } = request.params;
      const updates = request.body;
      app.logger.info({ leaderId: id }, 'Updating leadership member');

      try {
        const result = await app.db
          .update(schema.leadership)
          .set(updates)
          .where(eq(schema.leadership.id, id))
          .returning();

        app.logger.info(
          { leaderId: id },
          'Leadership member updated successfully'
        );
        return result[0];
      } catch (error) {
        app.logger.error(
          { err: error, leaderId: id },
          'Failed to update leadership member'
        );
        throw error;
      }
    }
  );

  // DELETE /api/admin/leadership/:id - Delete leadership member (public)
  fastify.delete<{ Params: { id: string } }>(
    '/api/admin/leadership/:id',
    {
      schema: {
        description: 'Delete a leadership member',
        tags: ['admin', 'leadership'],
        params: {
          type: 'object',
          properties: {
            id: { type: 'string' },
          },
        },
        response: {
          200: { type: 'object' },
        },
      },
    },
    async (
      request: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply
    ) => {
      const { id } = request.params;
      app.logger.info({ leaderId: id }, 'Deleting leadership member');

      try {
        await app.db
          .delete(schema.leadership)
          .where(eq(schema.leadership.id, id));

        app.logger.info(
          { leaderId: id },
          'Leadership member deleted successfully'
        );
        return { success: true };
      } catch (error) {
        app.logger.error(
          { err: error, leaderId: id },
          'Failed to delete leadership member'
        );
        throw error;
      }
    }
  );

  // Admin Program Management

  // POST /api/admin/program - Create program item (public)
  fastify.post<{ Body: ProgramBody }>(
    '/api/admin/program',
    {
      schema: {
        description: 'Create a program item',
        tags: ['admin', 'program'],
        body: {
          type: 'object',
          properties: {
            category: { type: 'string' },
            title: { type: 'string' },
            description: { type: 'string' },
            order: { type: 'number' },
          },
          required: ['category', 'title', 'description'],
        },
        response: {
          200: { type: 'object' },
        },
      },
    },
    async (request: FastifyRequest<{ Body: ProgramBody }>, reply: FastifyReply) => {
      const { category, title, description, order } = request.body;
      app.logger.info({ category }, 'Creating program item');

      try {
        const result = await app.db
          .insert(schema.politicalProgram)
          .values({
            category,
            title,
            description,
            order: order || 0,
          })
          .returning();

        app.logger.info(
          { programId: result[0].id },
          'Program item created successfully'
        );
        return result[0];
      } catch (error) {
        app.logger.error(
          { err: error, category },
          'Failed to create program item'
        );
        throw error;
      }
    }
  );

  // PUT /api/admin/program/:id - Update program item (public)
  fastify.put<{ Params: { id: string }; Body: Partial<ProgramBody> }>(
    '/api/admin/program/:id',
    {
      schema: {
        description: 'Update a program item',
        tags: ['admin', 'program'],
        params: {
          type: 'object',
          properties: {
            id: { type: 'string' },
          },
        },
        body: {
          type: 'object',
          properties: {
            category: { type: 'string' },
            title: { type: 'string' },
            description: { type: 'string' },
            order: { type: 'number' },
          },
        },
        response: {
          200: { type: 'object' },
        },
      },
    },
    async (
      request: FastifyRequest<{ Params: { id: string }; Body: Partial<ProgramBody> }>,
      reply: FastifyReply
    ) => {
      const { id } = request.params;
      const updates = request.body;
      app.logger.info({ programId: id }, 'Updating program item');

      try {
        const result = await app.db
          .update(schema.politicalProgram)
          .set(updates)
          .where(eq(schema.politicalProgram.id, id))
          .returning();

        app.logger.info(
          { programId: id },
          'Program item updated successfully'
        );
        return result[0];
      } catch (error) {
        app.logger.error(
          { err: error, programId: id },
          'Failed to update program item'
        );
        throw error;
      }
    }
  );

  // DELETE /api/admin/program/:id - Delete program item (public)
  fastify.delete<{ Params: { id: string } }>(
    '/api/admin/program/:id',
    {
      schema: {
        description: 'Delete a program item',
        tags: ['admin', 'program'],
        params: {
          type: 'object',
          properties: {
            id: { type: 'string' },
          },
        },
        response: {
          200: { type: 'object' },
        },
      },
    },
    async (
      request: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply
    ) => {
      const { id } = request.params;
      app.logger.info({ programId: id }, 'Deleting program item');

      try {
        await app.db
          .delete(schema.politicalProgram)
          .where(eq(schema.politicalProgram.id, id));

        app.logger.info(
          { programId: id },
          'Program item deleted successfully'
        );
        return { success: true };
      } catch (error) {
        app.logger.error(
          { err: error, programId: id },
          'Failed to delete program item'
        );
        throw error;
      }
    }
  );
}
