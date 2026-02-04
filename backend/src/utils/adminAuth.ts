import type { FastifyRequest, FastifyReply } from 'fastify';
import type { App } from '../index.js';

/**
 * Admin authentication:
 * Supports multiple authentication methods:
 * 1. Headers: x-admin-password and x-admin-secret (both optional, either works)
 * 2. Single password header: x-admin-password only
 * Both must match ADMIN_PASSWORD for successful authentication
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
    const passwordHeader = request.headers['x-admin-password'] as string | undefined;
    const secretHeader = request.headers['x-admin-secret'] as string | undefined;

    // Log the authentication attempt
    app.logger.info(
      {
        hasPasswordHeader: !!passwordHeader,
        hasSecretHeader: !!secretHeader,
      },
      'Admin authentication attempt'
    );

    // Check if at least one credential header is present
    if (!passwordHeader && !secretHeader) {
      app.logger.warn(
        {
          hasPasswordHeader: !!passwordHeader,
          hasSecretHeader: !!secretHeader,
        },
        'Admin auth failed: Missing required headers'
      );
      reply.status(403).send({
        error: 'Missing admin credentials. Please provide x-admin-password header.',
      });
      return null;
    }

    // Verify admin password header (primary authentication)
    if (passwordHeader) {
      if (passwordHeader !== ADMIN_PASSWORD) {
        app.logger.warn(
          { receivedLength: passwordHeader.length, expectedLength: ADMIN_PASSWORD.length },
          'Admin auth failed: Invalid admin password'
        );
        reply.status(403).send({ error: 'Invalid admin password' });
        return null;
      }
    }

    // Verify admin secret header (secondary, optional)
    if (secretHeader) {
      if (secretHeader !== ADMIN_PASSWORD) {
        app.logger.warn(
          { receivedLength: secretHeader.length, expectedLength: ADMIN_PASSWORD.length },
          'Admin auth failed: Invalid admin secret'
        );
        reply.status(403).send({ error: 'Invalid admin secret' });
        return null;
      }
    }

    // If only one header is provided, verify it matches
    if (!passwordHeader && secretHeader) {
      if (secretHeader !== ADMIN_PASSWORD) {
        app.logger.warn({}, 'Admin auth failed: Invalid secret (used as password)');
        reply.status(403).send({ error: 'Invalid admin secret' });
        return null;
      }
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
 * Validate admin credentials
 * Can validate password only, or both password and secret
 */
export async function validateAdminCredentials(
  password?: string,
  secret?: string
): Promise<boolean> {
  // If both provided, both must match
  if (password && secret) {
    return password === ADMIN_PASSWORD && secret === ADMIN_PASSWORD;
  }

  // If only password provided, validate it
  if (password) {
    return password === ADMIN_PASSWORD;
  }

  // If only secret provided, validate it as password
  if (secret) {
    return secret === ADMIN_PASSWORD;
  }

  // Neither provided
  return false;
}
