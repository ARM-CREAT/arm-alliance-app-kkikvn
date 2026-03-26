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

    // Check if extended programs already exist
    const existingPrograms = await app.db
      .select()
      .from(schema.programs);

    if (existingPrograms.length === 0) {
      const programs = [
        {
          title: 'Éducation pour tous',
          category: 'Éducation',
          summary: 'Un système éducatif équitable et de qualité',
          content: 'Nous nous engageons à assurer un accès équitable à une éducation de qualité pour tous les enfants maliens, avec des écoles bien équipées et des enseignants formés.',
          icon: 'book',
          color: '#2563EB',
          order: 1,
          published: true,
        },
        {
          title: 'Santé universelle',
          category: 'Santé',
          summary: 'Une couverture sanitaire pour tous',
          content: 'Établir un système de santé accessible et de qualité pour tous les Maliens, avec des centres de santé équipés dans chaque commune.',
          icon: 'heart',
          color: '#DC2626',
          order: 1,
          published: true,
        },
        {
          title: 'Environnement durable',
          category: 'Environnement',
          summary: 'Protection de notre environnement',
          content: 'Promouvoir une économie verte et durable, protéger nos ressources naturelles et combattre le changement climatique.',
          icon: 'leaf',
          color: '#16A34A',
          order: 1,
          published: true,
        },
        {
          title: 'Infrastructures modernes',
          category: 'Infrastructure',
          summary: 'Routes et services publics pour tous',
          content: 'Investir dans les routes rurales, l\'électricité et l\'eau potable pour atteindre les zones reculées du Mali.',
          icon: 'building',
          color: '#D97706',
          order: 1,
          published: true,
        },
        {
          title: 'Gouvernance transparente',
          category: 'Gouvernance',
          summary: 'Gestion responsable des affaires publiques',
          content: 'Établir une gouvernance transparente, combattre la corruption et renforcer l\'état de droit au Mali.',
          icon: 'shield',
          color: '#7C3AED',
          order: 1,
          published: true,
        },
        {
          title: 'Économie inclusive',
          category: 'Économie',
          summary: 'Création d\'emplois et opportunités',
          content: 'Créer des opportunités économiques pour tous, soutenir l\'entrepreneuriat local et les petites entreprises.',
          icon: 'chart-bar',
          color: '#0891B2',
          order: 1,
          published: true,
        },
      ];

      await app.db.insert(schema.programs).values(programs as any);
      app.logger.info({ count: programs.length }, 'Extended programs initialized');
    }

    // Check if app content already exists
    const existingContent = await app.db
      .select()
      .from(schema.appContent);

    if (existingContent.length === 0) {
      const content = [
        {
          key: 'about_us',
          title: 'À propos de nous',
          content: 'L\'Alliance pour le Rassemblement Malien (ARM) est un parti politique dédié à l\'unité, la prospérité et la démocratie au Mali.',
        },
        {
          key: 'ideology',
          title: 'Notre Idéologie',
          content: 'Nous croyons en la fraternité, la liberté, l\'égalité et la justice pour tous les Maliens. Notre mission est de construire un Mali fort, uni et prospère.',
        },
        {
          key: 'manifesto',
          title: 'Notre Manifeste',
          content: 'ARM s\'engage à servir le peuple malien avec intégrité, transparence et dévouement. Nous travaillons pour un Mali de paix, de justice et de développement.',
        },
        {
          key: 'history',
          title: 'Notre Histoire',
          content: 'Fondée avec une vision claire de transformation du Mali, ARM rassemble des militants dévoués de toutes les régions du pays.',
        },
      ];

      await app.db.insert(schema.appContent).values(content as any);
      app.logger.info({ count: content.length }, 'App content initialized');
    }

    // Check if app settings already exist
    const existingSettings = await app.db
      .select()
      .from(schema.appSettings);

    if (existingSettings.length === 0) {
      const settings = [
        {
          key: 'donation_enabled',
          value: 'true',
        },
        {
          key: 'membership_fee',
          value: '5000',
        },
        {
          key: 'contact_email',
          value: 'contact@alliance-arm.ml',
        },
      ];

      await app.db.insert(schema.appSettings).values(settings as any);
      app.logger.info({ count: settings.length }, 'App settings initialized');
    }

    // Check if member profiles already exist
    const existingMembers = await app.db
      .select()
      .from(schema.memberProfiles);

    if (existingMembers.length === 0) {
      const members = [
        {
          fullName: 'Diadié Keita',
          nina: 'M001234567890',
          commune: 'Sebenikoro',
          profession: 'Enseignant',
          phone: '0022376000001',
          email: 'diadie@alliance-arm.ml',
          membershipNumber: 'ARM-2024-00001',
          qrCode: 'ARM-2024-00001',
          status: 'active',
          role: 'member',
        },
        {
          fullName: 'Aissatou Cissé',
          nina: 'M001234567891',
          commune: 'Kalabamako',
          profession: 'Infirmière',
          phone: '0022376000002',
          email: 'aissatou@alliance-arm.ml',
          membershipNumber: 'ARM-2024-00002',
          qrCode: 'ARM-2024-00002',
          status: 'active',
          role: 'member',
        },
        {
          fullName: 'Mamadou Traore',
          nina: 'M001234567892',
          commune: 'ACI 2000',
          profession: 'Commerçant',
          phone: '0022376000003',
          membershipNumber: 'ARM-2024-00003',
          qrCode: 'ARM-2024-00003',
          status: 'pending',
          role: 'member',
        },
      ];

      await app.db.insert(schema.memberProfiles).values(members as any);
      app.logger.info({ count: members.length }, 'Member profiles initialized');
    }

    // Check if donations already exist
    const existingDonations = await app.db
      .select()
      .from(schema.donations);

    if (existingDonations.length === 0) {
      const donations = [
        {
          donorName: 'Ahmed Cissé',
          donorEmail: 'ahmed@example.ml',
          amount: '25000',
          currency: 'XOF',
          paymentMethod: 'mobile_money',
          status: 'completed',
          contributionType: 'donation',
        },
        {
          donorName: 'Fatoumata Diallo',
          donorEmail: 'fatoumata@example.ml',
          amount: '50000',
          currency: 'XOF',
          paymentMethod: 'bank_transfer',
          status: 'completed',
          contributionType: 'donation',
        },
      ];

      await app.db.insert(schema.donations).values(donations as any);
      app.logger.info({ count: donations.length }, 'Donations initialized');
    }

    // Check if news already exists
    const existingNews = await app.db
      .select()
      .from(schema.news);

    if (existingNews.length === 0) {
      const news = [
        {
          title: 'Congrès national d\'ARM 2024',
          content: 'Le congrès national de l\'Alliance pour le Rassemblement Malien s\'est tenu à Bamako avec la participation de délégués de toutes les régions.',
          imageUrl: 'https://picsum.photos/seed/news1/800/400',
          publishedAt: new Date('2024-03-15'),
          createdBy: 'admin',
        },
        {
          title: 'Nouvelle initiative pour l\'emploi des jeunes',
          content: 'ARM lance un programme d\'accompagnement pour l\'employabilité des jeunes dans les zones rurales.',
          imageUrl: 'https://picsum.photos/seed/news2/800/400',
          publishedAt: new Date('2024-03-10'),
          createdBy: 'admin',
        },
      ];

      await app.db.insert(schema.news).values(news as any);
      app.logger.info({ count: news.length }, 'News items initialized');
    }

    // Check if events already exist
    const existingEvents = await app.db
      .select()
      .from(schema.events);

    if (existingEvents.length === 0) {
      const events = [
        {
          title: 'Meeting régional de Kayes',
          description: 'Rencontre avec les militants et discussions sur les priorités régionales',
          date: new Date('2024-04-15'),
          location: 'Kayes, Mali',
          imageUrl: 'https://picsum.photos/seed/event1/800/400',
          createdBy: 'admin',
        },
        {
          title: 'Formation politique pour les collecteurs',
          description: 'Formation des collecteurs de membres sur les principes et politiques d\'ARM',
          date: new Date('2024-04-20'),
          location: 'Bamako, Mali',
          imageUrl: 'https://picsum.photos/seed/event2/800/400',
          createdBy: 'admin',
        },
      ];

      await app.db.insert(schema.events).values(events as any);
      app.logger.info({ count: events.length }, 'Events initialized');
    }

    // Check if contacts already exist
    const existingContacts = await app.db
      .select()
      .from(schema.contacts);

    if (existingContacts.length === 0) {
      const contacts = [
        {
          name: 'Siège National ARM',
          role: 'Bureau National',
          phone: '+223 20 22 00 00',
          email: 'contact@alliance-arm.ml',
          address: 'Bamako Sebenikoro, Rue 530, Porte 245',
          type: 'siege',
        },
        {
          name: 'Coordination Régionale Kayes',
          role: 'Région de Kayes',
          phone: '+223 21 22 00 00',
          email: 'kayes@alliance-arm.ml',
          address: 'Kayes, Mali',
          type: 'regional',
        },
        {
          name: 'Relations Médias',
          role: 'Service Communication',
          phone: '+223 20 22 00 01',
          email: 'media@alliance-arm.ml',
          address: 'Bamako, Mali',
          type: 'media',
        },
      ];

      await app.db.insert(schema.contacts).values(contacts as any);
      app.logger.info({ count: contacts.length }, 'Contacts initialized');
    }

    // Check if public chat messages already exist
    const existingChat = await app.db
      .select()
      .from(schema.publicChat);

    if (existingChat.length === 0) {
      const chatMessages = [
        {
          userName: 'Diadié Keita',
          message: 'Bienvenue à tous les membres d\'ARM!',
        },
        {
          userName: 'Aissatou Cissé',
          message: 'Merci de votre engagement pour le Mali',
        },
      ];

      await app.db.insert(schema.publicChat).values(chatMessages as any);
      app.logger.info({ count: chatMessages.length }, 'Public chat initialized');
    }

    // Check if internal messages already exist
    const existingInternalMessages = await app.db
      .select()
      .from(schema.internalMessages);

    if (existingInternalMessages.length === 0) {
      const internalMessages = [
        {
          title: 'Bienvenue dans ARM',
          content: 'Nous vous souhaitons la bienvenue dans cette grande famille d\'engagement pour le Mali.',
          senderId: 'system',
          targetRole: null,
        },
        {
          title: 'Prochaines réunions régionales',
          content: 'Les réunions régionales auront lieu le mois prochain dans chaque région.',
          senderId: 'system',
          targetRole: null,
        },
      ];

      await app.db.insert(schema.internalMessages).values(internalMessages as any);
      app.logger.info({ count: internalMessages.length }, 'Internal messages initialized');
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
