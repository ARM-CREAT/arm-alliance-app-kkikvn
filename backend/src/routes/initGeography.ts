import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import * as schema from '../db/schema.js';
import type { App } from '../index.js';
import { verifyAdminAuth } from '../utils/adminAuth.js';

// Mali's geographic structure
const MALI_GEOGRAPHY = [
  {
    name: 'Kayes',
    code: 'KAY',
    cercles: [
      { name: 'Kayes', code: 'KAY-KAY', communes: ['Kayes', 'Kita', 'Yelimane'] },
      { name: 'Kéniéba', code: 'KAY-KEN', communes: ['Kéniéba', 'Kemecounda'] },
      { name: 'Kouroussa', code: 'KAY-KOU', communes: ['Kouroussa', 'Siguiri'] },
    ],
  },
  {
    name: 'Koulikoro',
    code: 'KOU',
    cercles: [
      { name: 'Koulikoro', code: 'KOU-KOU', communes: ['Koulikoro', 'Kangaba', 'Bancoumana'] },
      { name: 'Kati', code: 'KOU-KAT', communes: ['Kati', 'Niono', 'Kolokani'] },
      { name: 'Dioila', code: 'KOU-DIO', communes: ['Dioila', 'Ouélessébougou'] },
    ],
  },
  {
    name: 'Bamako',
    code: 'BAM',
    cercles: [
      {
        name: 'Bamako',
        code: 'BAM-BAM',
        communes: ['District 1', 'District 2', 'District 3', 'District 4', 'District 5', 'District 6'],
      },
    ],
  },
  {
    name: 'Ségou',
    code: 'SEG',
    cercles: [
      {
        name: 'Ségou',
        code: 'SEG-SEG',
        communes: ['Ségou', 'Niono', 'Markala', 'Tominian'],
      },
      { name: 'Niono', code: 'SEG-NIO', communes: ['Niono', 'Toroto'] },
      { name: 'Barouéli', code: 'SEG-BAR', communes: ['Barouéli', 'San'] },
    ],
  },
  {
    name: 'Sikasso',
    code: 'SIK',
    cercles: [
      {
        name: 'Sikasso',
        code: 'SIK-SIK',
        communes: ['Sikasso', 'Bougouni', 'Kolokani'],
      },
      {
        name: 'Bougouni',
        code: 'SIK-BOU',
        communes: ['Bougouni', 'Yanfolila'],
      },
      { name: 'Yorosso', code: 'SIK-YOR', communes: ['Yorosso', 'Kadiolo'] },
    ],
  },
  {
    name: 'Mopti',
    code: 'MOP',
    cercles: [
      {
        name: 'Mopti',
        code: 'MOP-MOP',
        communes: ['Mopti', 'Bandiagara', 'Djenné'],
      },
      { name: 'Djenné', code: 'MOP-DJE', communes: ['Djenné', 'Koriziome'] },
      { name: 'Talo', code: 'MOP-TAL', communes: ['Talo', 'Goundaka'] },
    ],
  },
  {
    name: 'Tombouctou',
    code: 'TOM',
    cercles: [
      {
        name: 'Tombouctou',
        code: 'TOM-TOM',
        communes: ['Tombouctou', 'Araouane', 'Goundam'],
      },
      { name: 'Gao', code: 'TOM-GAO', communes: ['Gao', 'Bourem'] },
      { name: 'Niafunké', code: 'TOM-NIA', communes: ['Niafunké'] },
    ],
  },
  {
    name: 'Gao',
    code: 'GAO',
    cercles: [
      {
        name: 'Gao',
        code: 'GAO-GAO',
        communes: ['Gao', 'Bourem', 'Haoussa-Foulani'],
      },
      { name: 'Kidal', code: 'GAO-KID', communes: ['Kidal', 'Araouane'] },
      { name: 'Ménaka', code: 'GAO-MEN', communes: ['Ménaka', 'Anderamboukane'] },
    ],
  },
];

export function register(app: App, fastify: FastifyInstance) {
  // POST /api/admin/init-geography - Initialize geographic data (admin only)
  fastify.post(
    '/api/admin/init-geography',
    {
      schema: {
        description: 'Initialize Mali regions, cercles, and communes (admin only)',
        tags: ['admin', 'geography'],
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              regionsCreated: { type: 'number' },
              cerclesCreated: { type: 'number' },
              communesCreated: { type: 'number' },
            },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const admin = await verifyAdminAuth(request, reply, app);
      if (!admin) return;

      app.logger.info({ adminId: admin.userId }, 'Initializing geographic data');

      try {
        // Check if already initialized
        const existingRegions = await app.db.select().from(schema.regionsTable);
        if (existingRegions.length > 0) {
          return reply.status(400).send({ error: 'Geographic data already initialized' });
        }

        let regionsCreated = 0;
        let cerclesCreated = 0;
        let communesCreated = 0;

        // Insert regions
        for (const regionData of MALI_GEOGRAPHY) {
          const regionResult = await app.db
            .insert(schema.regionsTable)
            .values({
              name: regionData.name,
              code: regionData.code,
              memberCount: 0,
            })
            .returning();

          regionsCreated++;
          const regionId = regionResult[0].id;

          // Insert cercles for this region
          for (const cercleData of regionData.cercles) {
            const cercleResult = await app.db
              .insert(schema.cercles)
              .values({
                regionId,
                name: cercleData.name,
                code: cercleData.code,
                memberCount: 0,
              })
              .returning();

            cerclesCreated++;
            const cercleId = cercleResult[0].id;

            // Insert communes for this cercle
            for (const communeName of cercleData.communes) {
              await app.db
                .insert(schema.communes)
                .values({
                  cercleId,
                  name: communeName,
                  code: `${cercleData.code}-${communeName.replace(/\s+/g, '-').toUpperCase()}`,
                  memberCount: 0,
                });

              communesCreated++;
            }
          }
        }

        app.logger.info(
          { adminId: admin.userId, regionsCreated, cerclesCreated, communesCreated },
          'Geographic data initialized successfully'
        );

        return {
          success: true,
          regionsCreated,
          cerclesCreated,
          communesCreated,
        };
      } catch (error) {
        app.logger.error(
          { err: error, adminId: admin.userId },
          'Failed to initialize geographic data'
        );
        throw error;
      }
    }
  );
}
