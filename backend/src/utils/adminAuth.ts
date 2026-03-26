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

/**
 * Create a masked password hint showing first 3 and last 3 characters with *** in between
 */
function getMaskedPasswordHint(password: string): string {
  if (password.length <= 6) {
    return password.replace(/./g, '*');
  }
  const first3 = password.substring(0, 3);
  const last3 = password.substring(password.length - 3);
  return `${first3}***${last3}`;
}

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

    // Log the authentication attempt with detailed context
    app.logger.info(
      {
        hasPasswordHeader: !!passwordHeader,
        hasSecretHeader: !!secretHeader,
        method: request.method,
        path: request.url,
        passwordLength: passwordHeader?.length,
        secretLength: secretHeader?.length,
      },
      'Admin header authentication attempt'
    );

    // Check if at least one credential header is present
    if (!passwordHeader && !secretHeader) {
      app.logger.warn(
        {
          hasPasswordHeader: !!passwordHeader,
          hasSecretHeader: !!secretHeader,
          method: request.method,
          path: request.url,
        },
        'Header auth failed: No credentials provided'
      );
      reply.status(403).send({
        error: 'Missing admin credentials. Please provide x-admin-password header.',
      });
      return null;
    }

    // Verify admin password header (primary authentication)
    if (passwordHeader) {
      if (passwordHeader.length !== ADMIN_PASSWORD.length) {
        app.logger.warn(
          {
            step: 'password_length_check',
            receivedLength: passwordHeader.length,
            expectedLength: ADMIN_PASSWORD.length,
            expectedHint: getMaskedPasswordHint(ADMIN_PASSWORD),
            headerType: 'x-admin-password'
          },
          'Header auth failed: Password length mismatch'
        );
        reply.status(403).send({
          error: 'Unauthorized',
          message: `Invalid x-admin-password: length mismatch (expected ${ADMIN_PASSWORD.length} chars)`
        });
        return null;
      }

      if (passwordHeader !== ADMIN_PASSWORD) {
        app.logger.warn(
          {
            step: 'password_value_check',
            receivedHint: getMaskedPasswordHint(passwordHeader),
            expectedHint: getMaskedPasswordHint(ADMIN_PASSWORD),
            headerType: 'x-admin-password'
          },
          'Header auth failed: Password value mismatch'
        );
        reply.status(403).send({
          error: 'Unauthorized',
          message: 'Invalid x-admin-password header'
        });
        return null;
      }

      app.logger.debug({}, 'Header auth step: Password header validated');
    }

    // Verify admin secret header (secondary, optional)
    if (secretHeader) {
      if (secretHeader.length !== ADMIN_PASSWORD.length) {
        app.logger.warn(
          {
            step: 'secret_length_check',
            receivedLength: secretHeader.length,
            expectedLength: ADMIN_PASSWORD.length,
            expectedHint: getMaskedPasswordHint(ADMIN_PASSWORD),
            headerType: 'x-admin-secret'
          },
          'Header auth failed: Secret length mismatch'
        );
        reply.status(403).send({
          error: 'Unauthorized',
          message: `Invalid x-admin-secret: length mismatch (expected ${ADMIN_PASSWORD.length} chars)`
        });
        return null;
      }

      if (secretHeader !== ADMIN_PASSWORD) {
        app.logger.warn(
          {
            step: 'secret_value_check',
            receivedHint: getMaskedPasswordHint(secretHeader),
            expectedHint: getMaskedPasswordHint(ADMIN_PASSWORD),
            headerType: 'x-admin-secret'
          },
          'Header auth failed: Secret value mismatch'
        );
        reply.status(403).send({
          error: 'Unauthorized',
          message: 'Invalid x-admin-secret header'
        });
        return null;
      }

      app.logger.debug({}, 'Header auth step: Secret header validated');
    }

    app.logger.info({}, 'Header authentication successful - all credentials validated');

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
