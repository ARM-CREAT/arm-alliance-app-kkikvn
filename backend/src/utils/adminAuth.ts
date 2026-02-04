import type { FastifyRequest, FastifyReply } from 'fastify';
import type { App } from '../index.js';

/**
 * Simplified admin authentication:
 * Single password verification via X-Admin-Password header
 */

// Admin password from environment
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

export async function verifyAdminAuth(
  request: FastifyRequest,
  reply: FastifyReply,
  app: App
): Promise<{ userId: string; username: string } | null> {
  try {
    // Get admin password from request header
    const authHeader = request.headers['x-admin-password'];

    if (!authHeader) {
      app.logger.warn({}, 'Admin auth failed: Missing admin password header');
      reply.status(403).send({ error: 'Missing admin password' });
      return null;
    }

    // Verify admin password
    if (authHeader !== ADMIN_PASSWORD) {
      app.logger.warn({}, 'Admin auth failed: Invalid admin password');
      reply.status(403).send({ error: 'Invalid admin password' });
      return null;
    }

    app.logger.info({}, 'Admin authentication successful');

    return {
      userId: 'admin',
      username: 'administrator',
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
 * Validate admin credentials from request body
 */
export async function validateAdminCredentials(password: string): Promise<boolean> {
  return password === ADMIN_PASSWORD;
}
