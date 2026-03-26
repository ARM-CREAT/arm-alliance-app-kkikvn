import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { eq } from 'drizzle-orm';
import * as schema from '../db/schema.js';
import type { App } from '../index.js';

interface MemberLoginBody {
  email: string;
  password: string;
}

export function register(app: App, fastify: FastifyInstance) {
  // POST /api/auth/sign-in/email - Intercept regular member login and check role
  // This wraps the Better Auth sign-in to add role-based access control
  fastify.post<{ Body: MemberLoginBody }>(
    '/api/member/login',
    {
      schema: {
        description: 'Member login - authenticate with email and password (non-admin only)',
        tags: ['auth', 'members'],
        body: {
          type: 'object',
          properties: {
            email: { type: 'string', format: 'email' },
            password: { type: 'string' },
          },
          required: ['email', 'password'],
        },
        response: {
          200: {
            type: 'object',
            properties: {
              user: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  email: { type: 'string' },
                  name: { type: 'string' },
                  role: { type: 'string' },
                },
              },
              session: { type: 'object' },
            },
          },
          403: {
            type: 'object',
            properties: {
              error: { type: 'string' },
            },
          },
          401: {
            type: 'object',
            properties: {
              error: { type: 'string' },
            },
          },
        },
      },
    },
    async (request: FastifyRequest<{ Body: MemberLoginBody }>, reply: FastifyReply) => {
      const { email, password } = request.body;

      app.logger.info({ email }, 'Member login attempt started');

      try {
        // Step 1: Check user's role in member_profiles
        app.logger.debug({ email }, 'Checking user role in member_profiles');

        const profile = await app.db
          .select()
          .from(schema.memberProfiles)
          .where(eq(schema.memberProfiles.email, email));

        if (profile.length === 0) {
          app.logger.warn({ email }, 'Member login failed: User not found in member_profiles');
          return reply.status(401).send({
            error: 'Authentication failed',
          });
        }

        const userRole = profile[0].role;
        app.logger.debug({ email, userRole }, 'User role retrieved from member_profiles');

        // Step 2: Deny if user is admin
        if (userRole === 'admin' || userRole === 'administrateur') {
          app.logger.warn({ email, userRole }, 'Member login blocked: User is admin');
          return reply.status(403).send({
            error: 'Please use the admin login portal.',
          });
        }

        app.logger.info({ email, userRole }, 'Member login role check passed');

        // Step 3: Delegate to Better Auth sign-in
        // We call the Better Auth API directly to authenticate
        try {
          const result = await (app as any).auth.api.signInEmail({
            body: { email, password },
            asResponse: true,
          });

          // Check if sign-in was successful
          if (!result.ok && result.status >= 400) {
            app.logger.warn({ email, status: result.status }, 'Better Auth sign-in failed');
            return reply.status(result.status).send(await result.json());
          }

          // Parse the response
          const authResult = await result.json();

          // Add role to the user object
          if (authResult.user) {
            authResult.user.role = userRole;
          }

          app.logger.info({ email, userRole }, 'Member login successful');

          return reply.status(200).send(authResult);
        } catch (authError) {
          app.logger.error({ err: authError, email }, 'Better Auth sign-in error');
          return reply.status(401).send({
            error: 'Authentication failed',
          });
        }
      } catch (error) {
        app.logger.error({ err: error, email }, 'Error during member login');
        return reply.status(500).send({
          error: 'An unexpected error occurred',
        });
      }
    }
  );
}
