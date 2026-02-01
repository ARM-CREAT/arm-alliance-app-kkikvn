import type { FastifyRequest, FastifyReply } from 'fastify';
import type { App } from '../index.js';

/**
 * Admin authentication with 3-factor security:
 * 1. Better Auth session (via requireAuth)
 * 2. Admin password verification
 * 3. Secret code verification
 */

interface AdminCredentials {
  password: string;
  secretCode: string;
}

// In-memory admin store - in production, this would come from environment/secure storage
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
const ADMIN_SECRET_CODE = process.env.ADMIN_SECRET_CODE || 'arm2024secure';

export async function verifyAdminAuth(
  request: FastifyRequest,
  reply: FastifyReply,
  app: App
): Promise<{ userId: string; username: string } | null> {
  try {
    // First, verify the user has a valid Better Auth session
    const session = await app.requireAuth()(request, reply);
    if (!session) {
      app.logger.warn({}, 'Admin auth failed: No valid session');
      return null;
    }

    // Get admin credentials from request headers or body
    const authHeader = request.headers['x-admin-password'];
    const secretHeader = request.headers['x-admin-secret'];

    if (!authHeader || !secretHeader) {
      app.logger.warn(
        { userId: session.user.id },
        'Admin auth failed: Missing admin credentials'
      );
      reply.status(403).send({ error: 'Missing admin credentials' });
      return null;
    }

    // Verify admin password
    if (authHeader !== ADMIN_PASSWORD) {
      app.logger.warn(
        { userId: session.user.id },
        'Admin auth failed: Invalid admin password'
      );
      reply.status(403).send({ error: 'Invalid admin password' });
      return null;
    }

    // Verify secret code
    if (secretHeader !== ADMIN_SECRET_CODE) {
      app.logger.warn(
        { userId: session.user.id },
        'Admin auth failed: Invalid secret code'
      );
      reply.status(403).send({ error: 'Invalid secret code' });
      return null;
    }

    app.logger.info(
      { userId: session.user.id, email: session.user.email },
      'Admin authentication successful'
    );

    return {
      userId: session.user.id,
      username: session.user.email || 'admin',
    };
  } catch (error) {
    app.logger.error(
      { err: error },
      'Error during admin authentication verification'
    );
    reply.status(500).send({ error: 'Authentication error' });
    return null;
  }
}

/**
 * Alternative admin auth that checks credentials from request body
 * Useful for login endpoints
 */
export async function validateAdminCredentials(
  password: string,
  secretCode: string
): Promise<boolean> {
  return password === ADMIN_PASSWORD && secretCode === ADMIN_SECRET_CODE;
}
