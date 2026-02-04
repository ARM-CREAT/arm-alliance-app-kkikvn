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
    // Get admin credentials from request headers (handle both string and array headers)
    const passwordHeaderRaw = request.headers['x-admin-password'];
    const secretHeaderRaw = request.headers['x-admin-secret'];

    // Normalize headers (Fastify may return arrays for duplicate headers)
    const passwordHeader = Array.isArray(passwordHeaderRaw)
      ? passwordHeaderRaw[0]
      : (passwordHeaderRaw as string | undefined);
    const secretHeader = Array.isArray(secretHeaderRaw)
      ? secretHeaderRaw[0]
      : (secretHeaderRaw as string | undefined);

    // Log the authentication attempt
    app.logger.info(
      {
        hasPasswordHeader: !!passwordHeader,
        hasSecretHeader: !!secretHeader,
        method: request.method,
        path: request.url,
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
          {
            receivedLength: passwordHeader.length,
            expectedLength: ADMIN_PASSWORD.length,
            headerType: 'x-admin-password'
          },
          'Admin auth failed: Invalid admin password'
        );
        reply.status(403).send({
          error: 'Unauthorized',
          message: 'Invalid x-admin-password header'
        });
        return null;
      }
    }

    // Verify admin secret header (secondary, optional)
    if (secretHeader) {
      if (secretHeader !== ADMIN_PASSWORD) {
        app.logger.warn(
          {
            receivedLength: secretHeader.length,
            expectedLength: ADMIN_PASSWORD.length,
            headerType: 'x-admin-secret'
          },
          'Admin auth failed: Invalid admin secret'
        );
        reply.status(403).send({
          error: 'Unauthorized',
          message: 'Invalid x-admin-secret header'
        });
        return null;
      }
    }

    // If only secret header is provided without password, use it as password
    if (!passwordHeader && secretHeader) {
      // Already validated above, no need to re-check
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
