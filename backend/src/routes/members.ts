import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { eq, and, or, ilike, desc } from 'drizzle-orm';
import * as schema from '../db/schema.js';
import type { App } from '../index.js';

const SAMPLE_MEMBERS = [
  {
    memberNumber: 'ARM-2025-00001',
    fullName: 'Amadou Coulibaly',
    phone: '+22376543210',
    commune: 'Bamako',
    status: 'active',
  },
  {
    memberNumber: 'ARM-2025-00002',
    fullName: 'Fatoumata Diarra',
    phone: '+22365432109',
    commune: 'Sikasso',
    status: 'active',
  },
  {
    memberNumber: 'ARM-2025-00003',
    fullName: 'Moussa Traoré',
    phone: '+22354321098',
    commune: 'Mopti',
    status: 'pending',
  },
  {
    memberNumber: 'ARM-2025-00004',
    fullName: 'Mariam Koné',
    phone: '+22343210987',
    commune: 'Kayes',
    status: 'active',
  },
  {
    memberNumber: 'ARM-2025-00005',
    fullName: 'Ibrahim Sanogo',
    phone: '+22332109876',
    commune: 'Ségou',
    status: 'suspended',
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
