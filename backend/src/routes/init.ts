import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import * as schema from '../db/schema.js';
import type { App } from '../index.js';

export async function initializeData(app: App) {
  try {
    app.logger.info('Initializing default party data');

    // Check if leadership already exists
    const existingLeadership = await app.db
      .select()
      .from(schema.leadership);

    if (existingLeadership.length === 0) {
      // Initialize default leadership
      const defaultLeadership = [
        {
          name: 'Lassine Diakité',
          position: 'Président',
          phone: '0034632607101',
          address: 'Avenida Castilla la Mancha 122 Yuncos Toledo Espagne',
          location: 'Spain',
          order: 1,
        },
        {
          name: 'Dadou Sangare',
          position: 'Premier Vice-Président',
          location: 'Milan, Italie',
          order: 2,
        },
        {
          name: 'Oumar Keita',
          position: 'Deuxième Vice-Président',
          phone: '0022376304869',
          address: 'Koutiala Mali',
          location: 'Koutiala, Mali',
          order: 3,
        },
        {
          name: 'Karifa Keita',
          position: 'Secrétaire Général',
          location: 'Bamako, Mali',
          order: 4,
        },
        {
          name: 'Modibo Keita',
          position: 'Secrétaire Administratif',
          address: 'Bamako Sebenikoro',
          location: 'Bamako, Mali',
          order: 5,
        },
        {
          name: 'Sokona Keita',
          position: 'Trésorière',
          phone: '0022375179920',
          address: 'Bamako Sebenikoro',
          location: 'Bamako, Mali',
          order: 6,
        },
      ];

      await app.db
        .insert(schema.leadership)
        .values(defaultLeadership as any);

      app.logger.info(
        { count: defaultLeadership.length },
        'Default leadership initialized'
      );
    }

    // Check if regions already exist
    const existingRegions = await app.db
      .select()
      .from(schema.regions);

    if (existingRegions.length === 0) {
      // Initialize Mali regions with cercles and communes
      const regions = [
        {
          name: 'Kayes',
          cercles: [
            { name: 'Kayes', communes: ['Kayes', 'Kita'] },
            { name: 'Kéniéba', communes: ['Kéniéba'] },
          ],
        },
        {
          name: 'Koulikoro',
          cercles: [
            { name: 'Koulikoro', communes: ['Koulikoro', 'Kangaba'] },
            { name: 'Kati', communes: ['Kati', 'Niono'] },
          ],
        },
        {
          name: 'Bamako',
          cercles: [
            { name: 'Bamako', communes: ['Sebenikoro', 'ACI 2000', 'Kalabamako'] },
          ],
        },
        {
          name: 'Segou',
          cercles: [
            { name: 'Segou', communes: ['Segou', 'Samoguelam'] },
            { name: 'Markala', communes: ['Markala'] },
          ],
        },
        {
          name: 'Sikasso',
          cercles: [
            { name: 'Sikasso', communes: ['Sikasso', 'Kolokani'] },
            { name: 'Bougouni', communes: ['Bougouni'] },
          ],
        },
        {
          name: 'Mopti',
          cercles: [
            { name: 'Mopti', communes: ['Mopti', 'Bandiagara'] },
            { name: 'Djenne', communes: ['Djenne'] },
          ],
        },
        {
          name: 'Timbuktu',
          cercles: [
            { name: 'Timbuktu', communes: ['Timbuktu', 'Araouane'] },
            { name: 'Gao', communes: ['Gao'] },
          ],
        },
        {
          name: 'Gao',
          cercles: [
            { name: 'Gao', communes: ['Gao', 'Bourem'] },
            { name: 'Kidal', communes: ['Kidal'] },
          ],
        },
      ];

      await app.db
        .insert(schema.regions)
        .values(regions as any);

      app.logger.info(
        { count: regions.length },
        'Mali regions initialized'
      );
    }

    // Check if program items already exist
    const existingProgram = await app.db
      .select()
      .from(schema.politicalProgram);

    if (existingProgram.length === 0) {
      // Initialize political program
      const program = [
        {
          category: 'Éducation',
          title: 'Accès à l\'éducation de qualité',
          description: 'Assurer un accès équitable à une éducation de qualité pour tous les enfants maliens',
          order: 1,
        },
        {
          category: 'Santé',
          title: 'Système de santé universel',
          description: 'Établir un système de santé accessible et de qualité pour tous',
          order: 1,
        },
        {
          category: 'Économie',
          title: 'Développement économique durable',
          description: 'Créer des opportunités économiques et promouvoir une croissance durable',
          order: 1,
        },
        {
          category: 'Économie',
          title: 'Soutien aux petites entreprises',
          description: 'Fournir des ressources et des formations aux entrepreneurs locaux',
          order: 2,
        },
        {
          category: 'Sécurité',
          title: 'Renforcement de la sécurité',
          description: 'Améliorer la sécurité publique et l\'état de droit',
          order: 1,
        },
        {
          category: 'Agriculture',
          title: 'Modernisation agricole',
          description: 'Promouvoir l\'agriculture moderne et durable pour les petits paysans',
          order: 1,
        },
        {
          category: 'Infrastructure',
          title: 'Développement des routes et eau potable',
          description: 'Investir dans les routes rurales et l\'accès à l\'eau potable',
          order: 1,
        },
      ];

      await app.db
        .insert(schema.politicalProgram)
        .values(program as any);

      app.logger.info(
        { count: program.length },
        'Political program items initialized'
      );
    }

    app.logger.info('Database initialization completed successfully');
  } catch (error) {
    app.logger.error(
      { err: error },
      'Failed to initialize database with default data'
    );
    throw error;
  }
}

export function register(app: App, fastify: FastifyInstance) {
  // This route is not exposed - initialization happens on app startup
  // But we export register to match the route module pattern
}
