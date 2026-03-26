import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { eq } from 'drizzle-orm';
import * as schema from '../db/schema.js';
import type { App } from '../index.js';

interface SettingsUpdateBody {
  appName?: string;
  welcomeMessage?: string;
  donationEnabled?: string;
  conferenceEnabled?: string;
  contactPhone?: string;
  contactEmail?: string;
  contactAddress?: string;
  [key: string]: string | undefined;
}

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
const DEFAULT_SETTINGS = {
  appName: 'Alliance ARM',
  welcomeMessage: 'Bienvenue dans l\'Alliance pour le Rassemblement Malien',
  donationEnabled: 'true',
  conferenceEnabled: 'true',
  contactPhone: '+223 XX XX XX XX',
  contactEmail: 'contact@arm-mali.org',
  contactAddress: 'Bamako, Mali',
};

function verifyAdminPassword(request: FastifyRequest, reply: FastifyReply): boolean {
  const password = request.headers['x-admin-password'];
  if (password !== ADMIN_PASSWORD) {
    reply.status(401).send({
      error: 'Unauthorized',
      message: 'Invalid admin password',
    });
    return false;
  }
  return true;
}

export async function seedSettings(app: App) {
  try {
    const existing = await app.db.select().from(schema.appSettings);
    if (existing.length === 0) {
      const settingsList = Object.entries(DEFAULT_SETTINGS).map(([key, value]) => ({
        key,
        value,
      }));

      await app.db.insert(schema.appSettings).values(settingsList);
      app.logger.info({ count: settingsList.length }, 'Default settings seeded');
    }
  } catch (error) {
    app.logger.error({ err: error }, 'Failed to seed settings');
  }
}

export function register(app: App, fastify: FastifyInstance) {
  // GET /api/admin/settings - Get all settings (admin)
  fastify.get(
    '/api/admin/settings',
    {
      schema: {
        description: 'Get all app settings (admin only)',
        tags: ['admin', 'settings'],
        response: {
          200: { type: 'object' },
          401: { type: 'object' },
        },
      },
    },
    async (request, reply) => {
      if (!verifyAdminPassword(request, reply)) return;

      app.logger.info('Fetching app settings');

      try {
        const rows = await app.db.select().from(schema.appSettings);

        const settings: Record<string, string> = {};
        rows.forEach(row => {
          settings[row.key] = row.value;
        });

        app.logger.info({ count: rows.length }, 'Settings fetched successfully');
        return { settings };
      } catch (error) {
        app.logger.error({ err: error }, 'Failed to fetch settings');
        throw error;
      }
    }
  );

  // PUT /api/admin/settings - Update settings (admin)
  fastify.put<{ Body: SettingsUpdateBody }>(
    '/api/admin/settings',
    {
      schema: {
        description: 'Update app settings (admin only)',
        tags: ['admin', 'settings'],
        body: {
          type: 'object',
          properties: {
            appName: { type: 'string' },
            welcomeMessage: { type: 'string' },
            donationEnabled: { type: 'string' },
            conferenceEnabled: { type: 'string' },
            contactPhone: { type: 'string' },
            contactEmail: { type: 'string' },
            contactAddress: { type: 'string' },
          },
        },
        response: {
          200: { type: 'object' },
          400: { type: 'object' },
          401: { type: 'object' },
        },
      },
    },
    async (request, reply) => {
      if (!verifyAdminPassword(request, reply)) return;

      const body = request.body;

      // Check if body has any keys
      if (Object.keys(body).length === 0) {
        reply.status(400);
        return { error: 'BadRequest', message: 'At least one setting must be provided' };
      }

      app.logger.info({ keys: Object.keys(body) }, 'Updating app settings');

      try {
        // Upsert each setting
        for (const [key, value] of Object.entries(body)) {
          if (value === undefined) continue;

          const existing = await app.db
            .select()
            .from(schema.appSettings)
            .where(eq(schema.appSettings.key, key));

          if (existing.length > 0) {
            await app.db
              .update(schema.appSettings)
              .set({
                value,
                updatedAt: new Date(),
              })
              .where(eq(schema.appSettings.key, key));
          } else {
            await app.db.insert(schema.appSettings).values({
              key,
              value,
            });
          }
        }

        // Return all settings after update
        const rows = await app.db.select().from(schema.appSettings);
        const settings: Record<string, string> = {};
        rows.forEach(row => {
          settings[row.key] = row.value;
        });

        app.logger.info({ keys: Object.keys(body) }, 'Settings updated successfully');
        return { settings };
      } catch (error) {
        app.logger.error({ err: error }, 'Failed to update settings');
        throw error;
      }
    }
  );
}
