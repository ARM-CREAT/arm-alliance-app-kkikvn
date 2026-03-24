import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { eq, and, or, ilike, desc } from 'drizzle-orm';
import * as schema from '../db/schema.js';
import type { App } from '../index.js';

const SAMPLE_MEMBERS = [
  {
    memberNumber: 'ARM-00001',
    firstName: 'Amadou',
    lastName: 'Coulibaly',
    phone: '+22376543210',
    location: 'Bamako',
  },
  {
    memberNumber: 'ARM-00002',
    firstName: 'Fatoumata',
    lastName: 'Diallo',
    phone: '+22365432109',
    location: 'Sikasso',
  },
  {
    memberNumber: 'ARM-00003',
    firstName: 'Ibrahim',
    lastName: 'Traoré',
    phone: '+22354321098',
    location: 'Mopti',
  },
];

export function register(app: App, fastify: FastifyInstance) {
  const requireAuth = app.requireAuth();

}

export async function seedMembers(app: App) {
  try {
    const existing = await app.db
      .select()
      .from(schema.members);

    if (existing.length < 3) {
      app.logger.info('Seeding members table');
      await app.db
        .insert(schema.members)
        .values(SAMPLE_MEMBERS);
      app.logger.info({ count: SAMPLE_MEMBERS.length }, 'Members seeded');
    }
  } catch (error) {
    app.logger.error({ err: error }, 'Failed to seed members');
  }
}
