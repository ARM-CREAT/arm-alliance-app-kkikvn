import { Ionicons } from '@expo/vector-icons';

export interface ProgramPoint {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  subpoints: { title: string; description: string }[];
}

export const PROGRAM_POINTS: ProgramPoint[] = [
  {
    title: 'Sécurité et Défense',
    icon: 'shield-checkmark-outline',
    color: '#1B5E20',
    subpoints: [
      {
        title: 'Renforcement des Forces Armées',
        description:
          "Augmenter le budget de la défense pour moderniser l'équipement militaire et améliorer les conditions de vie des soldats.",
      },
      {
        title: 'Lutte contre le Terrorisme',
        description:
          "Renforcer la coopération avec les pays voisins et les partenaires internationaux pour éradiquer les groupes terroristes.",
      },
      {
        title: 'Sécurisation des Frontières',
        description:
          "Mettre en place des postes de contrôle supplémentaires et utiliser des technologies modernes pour surveiller les frontières.",
      },
    ],
  },
  {
    title: 'Santé',
    icon: 'medkit-outline',
    color: '#AD1457',
    subpoints: [
      {
        title: 'Accès aux Soins',
        description:
          "Construire de nouveaux centres de santé dans les zones rurales et subventionner les soins pour les populations vulnérables.",
      },
      {
        title: 'Formation du Personnel Médical',
        description:
          "Envoyer des professionnels de santé en formation continue et attirer des médecins étrangers pour combler le déficit.",
      },
      {
        title: 'Prévention des Maladies',
        description:
          "Lancer des campagnes de vaccination et de sensibilisation pour lutter contre les maladies endémiques.",
      },
    ],
  },
  {
    title: 'Éducation et Formation',
    icon: 'school-outline',
    color: '#1565C0',
    subpoints: [
      {
        title: 'Réforme du Système Éducatif',
        description:
          "Introduire des programmes d'enseignement modernes et adapter le curriculum aux besoins du marché du travail.",
      },
      {
        title: "Construction d'Écoles",
        description:
          "Ériger de nouvelles écoles primaires et secondaires, en particulier dans les zones rurales.",
      },
      {
        title: 'Promotion de la Formation Professionnelle',
        description:
          "Établir des centres de formation technique pour préparer les jeunes aux métiers demandés sur le marché.",
      },
    ],
  },
  {
    title: 'Emploi et Économie',
    icon: 'trending-up-outline',
    color: '#E65100',
    subpoints: [
      {
        title: "Soutien à l'Entrepreneuriat",
        description:
          "Offrir des prêts à faible taux d'intérêt et des formations en gestion d'entreprise pour les jeunes entrepreneurs.",
      },
      {
        title: 'Développement des Infrastructures',
        description:
          "Investir dans la construction et la réhabilitation des routes, des ponts et des réseaux électriques pour stimuler l'économie.",
      },
      {
        title: 'Attraction des Investissements Étrangers',
        description:
          "Simplifier les procédures administratives et offrir des incitations fiscales pour attirer les investisseurs étrangers.",
      },
    ],
  },
  {
    title: 'Agriculture',
    icon: 'leaf-outline',
    color: '#2E7D32',
    subpoints: [
      {
        title: 'Modernisation Agricole',
        description:
          "Introduire des techniques agricoles modernes et fournir des semences de qualité pour augmenter la productivité.",
      },
      {
        title: 'Accès au Crédit Agricole',
        description:
          "Mettre en place des fonds de garantie pour faciliter l'accès au crédit pour les agriculteurs.",
      },
      {
        title: "Gestion de l'Eau",
        description:
          "Construire des systèmes d'irrigation pour assurer une production agricole stable, même en période de sécheresse.",
      },
    ],
  },
  {
    title: 'Infrastructures',
    icon: 'construct-outline',
    color: '#4527A0',
    subpoints: [
      {
        title: 'Routières',
        description:
          "Asphalter les routes principales reliant les grandes villes et entretenir les routes secondaires pour faciliter le commerce.",
      },
      {
        title: 'Ferroviaires',
        description:
          "Réhabiliter le réseau ferroviaire pour améliorer le transport des marchandises et des passagers.",
      },
      {
        title: 'Énergétiques',
        description:
          "Étendre le réseau électrique national et promouvoir les énergies renouvelables pour diversifier les sources d'énergie.",
      },
    ],
  },
  {
    title: 'Ressources Naturelles',
    icon: 'diamond-outline',
    color: '#00695C',
    subpoints: [
      {
        title: 'Gestion Durable',
        description:
          "Établir des réglementations strictes pour l'exploitation minière et pétrolière afin de préserver l'environnement.",
      },
      {
        title: 'Valorisation des Ressources',
        description:
          "Créer des industries de transformation pour ajouter de la valeur aux ressources naturelles extraites.",
      },
      {
        title: 'Partage des Revenus',
        description:
          "Assurer que les communautés locales bénéficient directement des revenus générés par l'exploitation des ressources.",
      },
    ],
  },
  {
    title: 'Protection Sociale',
    icon: 'people-outline',
    color: '#6A1B9A',
    subpoints: [
      {
        title: 'Système de Santé Universel',
        description:
          "Mettre en place une couverture maladie universelle pour tous les citoyens.",
      },
      {
        title: 'Retraites et Pensions',
        description:
          "Établir un système de retraite public et garantir des pensions décentes pour les retraités.",
      },
      {
        title: 'Assistance Sociale',
        description:
          "Offrir des aides financières et des services de soutien aux familles vulnérables.",
      },
    ],
  },
  {
    title: 'Famille et Enfance',
    icon: 'heart-outline',
    color: '#C62828',
    subpoints: [
      {
        title: 'Protection des Enfants',
        description:
          "Renforcer les lois contre la maltraitance infantile et créer des centres d'accueil pour les enfants en difficulté.",
      },
      {
        title: 'Soutien aux Familles',
        description:
          "Offrir des allocations familiales et des services de garde d'enfants abordables.",
      },
      {
        title: 'Éducation Parentale',
        description:
          "Organiser des programmes pour éduquer les parents sur les meilleures pratiques en matière d'éducation et de soins.",
      },
    ],
  },
  {
    title: 'Diaspora Malienne',
    icon: 'globe-outline',
    color: '#0277BD',
    subpoints: [
      {
        title: 'Renforcement des Liens',
        description:
          "Organiser des forums annuels pour connecter la diaspora avec le gouvernement et les entreprises locales.",
      },
      {
        title: 'Soutien aux Investissements',
        description:
          "Offrir des incitations fiscales et des garanties pour encourager les investissements de la diaspora.",
      },
      {
        title: 'Valorisation des Compétences',
        description:
          "Créer des programmes pour intégrer les compétences et les expertises de la diaspora dans le développement national.",
      },
    ],
  },
  {
    title: 'Administration et Gouvernance',
    icon: 'business-outline',
    color: '#37474F',
    subpoints: [
      {
        title: "Réforme de l'Administration Publique",
        description:
          "Mettre fin à la bureaucratie lourde et inefficace. Digitaliser les services administratifs pour faciliter les démarches citoyennes (état civil, fiscalité, permis, documents officiels, etc.).",
      },
      {
        title: 'Lutte contre la Corruption',
        description:
          "Renforcer les institutions de contrôle (BVG, Pôle économique, Cour des comptes) et appliquer rigoureusement les sanctions contre les abus de pouvoir et détournements.",
      },
      {
        title: 'Décentralisation Équilibrée',
        description:
          "Accélérer le processus de décentralisation en dotant les collectivités locales de ressources humaines, matérielles et financières suffisantes pour leur autonomie de gestion.",
      },
    ],
  },
  {
    title: 'Fiscalité et Contribution Citoyenne',
    icon: 'cash-outline',
    color: '#558B2F',
    subpoints: [
      {
        title: 'Élargissement de la Base Fiscale',
        description:
          "Intégrer le secteur informel par une politique douce et incitative, permettant aux petits opérateurs économiques de contribuer progressivement aux recettes de l'État.",
      },
      {
        title: 'Sécurité Sociale pour Tous',
        description:
          "Créer un système de cotisation inclusif où chaque Malien, qu'il soit agriculteur, commerçant, artisan ou salarié, contribue selon ses moyens pour bénéficier d'un accès aux soins, à la retraite, à la pension et à l'assurance chômage.",
      },
    ],
  },
  {
    title: 'Politique des Infrastructures et de la Modernisation',
    icon: 'train-outline',
    color: '#4527A0',
    subpoints: [
      {
        title: 'Réseaux Routiers et Ferroviaires',
        description:
          "Lancer un vaste programme de construction et réhabilitation des routes nationales et de création d'un corridor ferroviaire reliant le Nord au Sud et l'Est à l'Ouest.",
      },
      {
        title: 'Modernisation des Transports',
        description:
          "Promouvoir un transport public urbain structuré, écologique et accessible, notamment à Bamako, avec des bus, minibus, taxis collectifs modernes.",
      },
      {
        title: 'Développement Urbain',
        description:
          "Élaborer des plans d'urbanisme dans toutes les grandes villes pour mettre fin à l'habitat anarchique et renforcer l'accès à l'eau, à l'électricité et aux logements sociaux.",
      },
    ],
  },
  {
    title: 'Énergie et Environnement',
    icon: 'sunny-outline',
    color: '#F57F17',
    subpoints: [
      {
        title: 'Transition Énergétique',
        description:
          "Promouvoir l'énergie solaire, hydraulique et éolienne, avec un objectif de 60% d'énergie renouvelable d'ici 2035.",
      },
      {
        title: "Protection de l'Environnement",
        description:
          "Lancer une politique de reboisement national, lutter contre la désertification, promouvoir des pratiques agricoles durables et sanctionner la pollution industrielle.",
      },
      {
        title: 'Économie Verte',
        description:
          "Soutenir les initiatives économiques éco-responsables et les start-up vertes comme moteur d'un développement durable.",
      },
    ],
  },
  {
    title: "Justice et Droits de l'Homme",
    icon: 'scale-outline',
    color: '#1A237E',
    subpoints: [
      {
        title: 'Indépendance de la Justice',
        description:
          "Garantir la séparation des pouvoirs, renforcer les moyens de la justice, former et protéger les magistrats contre toute pression politique ou économique.",
      },
      {
        title: 'Droits des Femmes et des Enfants',
        description:
          "Appliquer les conventions internationales signées par le Mali en matière de protection des femmes et des enfants, et renforcer les campagnes de sensibilisation contre les violences basées sur le genre.",
      },
    ],
  },
  {
    title: 'Diplomatie et Souveraineté',
    icon: 'flag-outline',
    color: '#BF360C',
    subpoints: [
      {
        title: 'Politique Étrangère Souveraine',
        description:
          "Développer des relations diplomatiques fondées sur le respect mutuel, les intérêts réciproques et la non-ingérence, tout en renforçant la coopération avec les pays du Sahel, de l'Afrique et du reste du monde.",
      },
      {
        title: "Promotion de l'Image du Mali",
        description:
          "Relancer une diplomatie culturelle et économique dynamique, valoriser le patrimoine malien et encourager les échanges universitaires et technologiques.",
      },
    ],
  },
];
