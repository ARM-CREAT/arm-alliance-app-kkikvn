import type { FastifyRequest, FastifyReply } from 'fastify';
import type { App } from '../index.js';

/**
 * Admin authentication:
 * Requires both x-admin-password and x-admin-secret headers
 * Both headers must match ADMIN_PASSWORD for successful authentication
 */

// Admin password from environment
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

export async function verifyAdminAuth(
  request: FastifyRequest,
  reply: FastifyReply,
  app: App
): Promise<{ userId: string; username: string } | null> {
  try {
    // Get admin credentials from request headers
    const passwordHeader = request.headers['x-admin-password'];
    const secretHeader = request.headers['x-admin-secret'];

    // Log the authentication attempt
    app.logger.info(
      {
        hasPasswordHeader: !!passwordHeader,
        hasSecretHeader: !!secretHeader,
      },
      'Admin authentication attempt'
    );

    // Check if both headers are present
    if (!passwordHeader || !secretHeader) {
      app.logger.warn(
        {
          hasPasswordHeader: !!passwordHeader,
          hasSecretHeader: !!secretHeader,
        },
        'Admin auth failed: Missing required headers'
      );
      reply.status(403).send({
        error: 'Missing admin credentials. Please provide both x-admin-password and x-admin-secret headers.',
      });
      return null;
    }

    // Verify admin password header
    if (passwordHeader !== ADMIN_PASSWORD) {
      app.logger.warn({}, 'Admin auth failed: Invalid admin password');
      reply.status(403).send({ error: 'Invalid admin password' });
      return null;
    }

    // Verify admin secret header
    if (secretHeader !== ADMIN_PASSWORD) {
      app.logger.warn({}, 'Admin auth failed: Invalid admin secret');
      reply.status(403).send({ error: 'Invalid admin secret' });
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
 * Validate admin credentials (both password and secret)
 */
export async function validateAdminCredentials(
  password: string,
  secret: string
): Promise<boolean> {
  return password === ADMIN_PASSWORD && secret === ADMIN_PASSWORD;
}
