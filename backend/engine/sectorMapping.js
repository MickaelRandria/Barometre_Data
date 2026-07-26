/**
 * Mapping sectoriel → articles Wikipédia servant de proxys d'intention.
 *
 * Règles appliquées après audit :
 *  1. Chaque article assigné à une dimension doit avoir un rapport sémantique
 *     défendable en une phrase. Les associations indéfendables de la version
 *     précédente (Automobile × « bien-être » → Station-service / Lavage
 *     automobile ; High-tech × « activité extérieure » pour un logiciel de
 *     comptabilité) ont été supprimées, pas remplacées par un autre bricolage.
 *  2. Une dimension SANS proxy défendable est simplement absente du secteur.
 *     Mieux vaut quatre axes honnêtes que cinq axes dont un est décoratif.
 *  3. La détection est pondérée par spécificité : un mot générique seul
 *     ("logiciel", "service") ne suffit plus à retenir un secteur.
 *  4. Un secteur peut se déclarer non météo-sensible : son signal est alors
 *     affiché sans jamais être pondéré dans le score.
 */

/** Poids attribué aux mots-clés selon leur spécificité. */
export const STRONG_KEYWORD_WEIGHT = 2;
export const WEAK_KEYWORD_WEIGHT = 1;
/** Score de détection minimal pour retenir un secteur autre que « défaut ». */
export const SECTOR_MATCH_THRESHOLD = 2;

export const DEFAULT_SECTOR = {
  label: 'Analyse générale',
  weatherSensitive: true,
  rationale: 'Proxys grand public non sectoriels : ils mesurent l’humeur collective générale, à défaut d’un secteur identifié avec certitude.',
  articlesByDimension: {
    cocooning: ['Raclette', 'Jeu_de_société'],
    sortie: ['Restaurant', 'Cinéma'],
    'activité extérieure': ['Randonnée', 'Pique-nique'],
    'bien-être': ['Yoga', 'Méditation'],
    'loisirs créatifs': ['Tricot', 'Poterie'],
  },
};

export const SECTORS = {
  mode_vetements: {
    label: 'Mode & vêtements',
    weatherSensitive: true,
    rationale: 'Chaque dimension correspond à une catégorie de vêtement réellement portée dans cette situation : vêtement d’intérieur, tenue de sortie, tenue de sport, textile de détente, pratique textile amateur.',
    strongKeywords: ['robe', 'manteau', 'doudoune', 'pull', 'veste', 'prêt-à-porter', 'vêtement', 'chaussures', 'textile', 'maille'],
    weakKeywords: ['mode', 'collection', 'dressing', 'silhouette'],
    articlesByDimension: {
      cocooning: ['Pyjama', 'Chausson'],
      sortie: ['Robe_(vêtement)', 'Chemise'],
      'activité extérieure': ['Vêtement_de_sport', 'Chaussure_de_sport'],
      'bien-être': ['Peignoir'],
      'loisirs créatifs': ['Couture', 'Tricot'],
    },
  },

  beaute_cosmetique: {
    label: 'Beauté & cosmétique',
    weatherSensitive: true,
    rationale: 'Les proxys suivent le geste beauté associé à chaque situation : soin à la maison, maquillage de sortie, protection en extérieur, soin du corps, gestes réalisés soi-même.',
    strongKeywords: ['cosmétique', 'maquillage', 'parfum', 'crème', 'soin du visage', 'soin de la peau', 'shampoing', 'épilation'],
    weakKeywords: ['beauté', 'soin', 'peau', 'visage', 'teint'],
    articlesByDimension: {
      cocooning: ['Savon', 'Bain'],
      sortie: ['Maquillage', 'Rouge_à_lèvres'],
      'activité extérieure': ['Produit_de_protection_solaire', 'Lunettes_de_soleil'],
      'bien-être': ['Sauna', 'Peau'],
      'loisirs créatifs': ['Manucure', 'Coiffure'],
    },
  },

  alimentation_boisson: {
    label: 'Alimentation & boissons',
    weatherSensitive: true,
    rationale: 'Chaque article est un plat ou une boisson dont la consommation est directement liée à la situation : raclette et chocolat chaud au repli, restaurant et apéritif en sortie, barbecue en extérieur, thé au bien-être, pâtisserie en pratique amateur.',
    strongKeywords: ['recette', 'apéritif', 'chocolat', 'vin', 'bière', 'épicerie', 'restaurant', 'pâtisserie', 'fromage'],
    weakKeywords: ['boisson', 'thé', 'café', 'cuisine', 'gourmand', 'saveur'],
    articlesByDimension: {
      cocooning: ['Raclette', 'Chocolat_chaud'],
      sortie: ['Restaurant', 'Apéritif'],
      'activité extérieure': ['Barbecue', 'Pique-nique'],
      'bien-être': ['Thé', 'Infusion'],
      'loisirs créatifs': ['Pâtisserie', 'Cuisine'],
    },
  },

  maison_deco: {
    label: 'Maison & décoration',
    weatherSensitive: true,
    rationale: 'Les proxys correspondent aux pièces et objets mobilisés selon la situation. L’axe « sortie » est ici l’équivalent domestique de la sortie : recevoir chez soi (art de la table, salle à manger).',
    strongKeywords: ['décoration', 'bougie', 'coussin', 'meuble', 'mobilier', 'linge de maison', 'luminaire', 'tapis'],
    weakKeywords: ['déco', 'intérieur', 'ambiance', 'maison', 'linge'],
    articlesByDimension: {
      cocooning: ['Bougie', 'Cheminée'],
      sortie: ['Arts_de_la_table', 'Salle_à_manger'],
      'activité extérieure': ['Jardin', 'Terrasse_(architecture)'],
      'bien-être': ['Salle_de_bains', 'Literie'],
      'loisirs créatifs': ['Poterie', 'Bricolage'],
    },
  },

  high_tech: {
    label: 'High-tech',
    weatherSensitive: true,
    rationale: 'Les proxys sont des équipements dont l’usage est situé : console et téléviseur à la maison, casque et appareil photo qu’on emporte, montre connectée et vélo électrique en extérieur, domotique pour le confort du logement.',
    strongKeywords: ['smartphone', 'ordinateur', 'console', 'téléviseur', 'écouteurs', 'casque audio', 'montre connectée', 'objet connecté', 'tablette'],
    weakKeywords: ['high-tech', 'électronique', 'connecté', 'gadget', 'application', 'numérique'],
    articlesByDimension: {
      cocooning: ['Console_de_jeux_vidéo', 'Téléviseur'],
      sortie: ['Casque_audio', 'Appareil_photographique_numérique'],
      'activité extérieure': ['Smartwatch', 'Vélo_à_assistance_électrique'],
      'bien-être': ['Domotique'],
      'loisirs créatifs': ['Impression_3D', 'Jeu_vidéo'],
    },
  },

  logiciel_b2b: {
    label: 'Logiciels & services B2B',
    // Le rythme d'achat d'un logiciel de gestion ne dépend pas de la météo :
    // le signal est affiché pour information mais jamais pondéré dans le score.
    weatherSensitive: false,
    rationale: 'Les axes ne sont pas comportementaux mais fonctionnels (gestion, fiscalité, outillage) : un logiciel de gestion ne se vend pas selon qu’il fait beau. Le secteur est explicitement déclaré non météo-sensible.',
    strongKeywords: ['comptabilité', 'comptable', 'liasse fiscale', 'bilan', 'facturation', 'paie', 'erp', 'saas', 'crm', 'progiciel', 'gestion commerciale'],
    weakKeywords: ['logiciel', 'module', 'licence', 'abonnement logiciel', 'plateforme'],
    articlesByDimension: {
      gestion: ['Comptabilité', 'Facture'],
      fiscalité: ['Droit_fiscal', 'Salaire'],
      outillage: ['Tableur', 'Logiciel'],
    },
  },

  sport_outdoor: {
    label: 'Sport & outdoor',
    weatherSensitive: true,
    rationale: 'Les proxys distinguent la pratique praticable en intérieur, la pratique sociale en salle ou en club, et la pratique de plein air. La dimension « loisirs créatifs » n’a pas de proxy défendable ici et a été retirée.',
    strongKeywords: ['running', 'randonnée', 'cyclisme', 'fitness', 'musculation', 'natation', 'trail', 'escalade', 'équipement sportif'],
    weakKeywords: ['sport', 'vélo', 'entraînement', 'performance'],
    articlesByDimension: {
      cocooning: ['Yoga', 'Musculation'],
      sortie: ['Football', 'Salle_de_sport'],
      'activité extérieure': ['Randonnée', 'Cyclisme'],
      'bien-être': ['Natation', 'Méditation'],
    },
  },

  voyage_tourisme: {
    label: 'Voyage & tourisme',
    weatherSensitive: true,
    rationale: 'Chaque article correspond à un type de séjour : séjour cosy, tourisme urbain et événementiel, séjour de plein air, séjour de soin, et pratique photographique du voyage.',
    strongKeywords: ['voyage', 'vacances', 'hôtel', 'séjour', 'destination', 'croisière', 'camping', 'billet d’avion'],
    weakKeywords: ['tourisme', 'valise', 'escapade', 'week-end'],
    articlesByDimension: {
      cocooning: ['Thermalisme', 'Chalet'],
      sortie: ['Tourisme', 'Festival'],
      'activité extérieure': ['Randonnée', 'Camping'],
      'bien-être': ['Sauna', 'Thalassothérapie'],
      'loisirs créatifs': ['Photographie'],
    },
  },

  finance_assurance: {
    label: 'Finance & assurance',
    weatherSensitive: true,
    rationale: 'Les proxys couvrent les objets assurés ou financés selon la situation : le logement, la mobilité, la santé et la prévoyance. Les axes « sortie » et « loisirs créatifs », qui pointaient précédemment vers Banque, Crédit et Investissement sans rapport avec ces dimensions, ont été retirés.',
    strongKeywords: ['assurance', 'épargne', 'crédit', 'placement', 'mutuelle', 'prêt immobilier', 'retraite', 'prévoyance'],
    weakKeywords: ['banque', 'contrat', 'taux', 'financement'],
    articlesByDimension: {
      cocooning: ['Assurance_habitation', 'Épargne'],
      'activité extérieure': ['Assurance_automobile'],
      'bien-être': ['Assurance_maladie', 'Retraite_(économie)'],
    },
  },

  culture_loisirs: {
    label: 'Culture & loisirs',
    weatherSensitive: true,
    rationale: 'Les proxys distinguent la consommation culturelle à domicile, la sortie culturelle, l’événement de plein air, la lecture comme temps pour soi, et la pratique créative amateur.',
    strongKeywords: ['livre', 'roman', 'cinéma', 'concert', 'musique', 'spectacle', 'bande dessinée', 'jeu de société'],
    weakKeywords: ['culture', 'lecture', 'loisir', 'jeu', 'scène'],
    articlesByDimension: {
      cocooning: ['Livre', 'Jeu_de_société'],
      sortie: ['Cinéma', 'Concert'],
      'activité extérieure': ['Festival'],
      'bien-être': ['Lecture'],
      'loisirs créatifs': ['Dessin', 'Photographie'],
    },
  },

  enfance_puericulture: {
    label: 'Enfance & puériculture',
    weatherSensitive: true,
    rationale: 'Les proxys suivent l’activité de l’enfant selon la situation : jeu calme à la maison, sortie familiale, jeu de plein air, sommeil, et activité créative encadrée.',
    strongKeywords: ['bébé', 'nourrisson', 'poussette', 'puériculture', 'maternité', 'jouet', 'siège auto'],
    weakKeywords: ['enfant', 'famille', 'éveil', 'école'],
    articlesByDimension: {
      cocooning: ['Peluche', 'Jouet'],
      sortie: ['Parc_de_loisirs'],
      'activité extérieure': ['Jeu_de_plein_air', 'Poussette'],
      'bien-être': ['Sommeil'],
      'loisirs créatifs': ['Dessin', 'Pâte_à_modeler'],
    },
  },

  animalerie: {
    label: 'Animalerie',
    weatherSensitive: true,
    rationale: 'Les proxys distinguent l’animal d’intérieur, la sortie et l’activité canine, le soin vétérinaire, et la pratique d’élevage amateur. L’axe « sortie » n’a pas de proxy distinct de l’activité extérieure et a été retiré.',
    strongKeywords: ['croquettes', 'animalerie', 'vétérinaire', 'toilettage', 'litière', 'aquarium', 'chien', 'chat'],
    weakKeywords: ['animal', 'compagnie', 'race', 'panier'],
    articlesByDimension: {
      cocooning: ['Chat', 'Animal_de_compagnie'],
      'activité extérieure': ['Chien', 'Agility'],
      'bien-être': ['Médecine_vétérinaire', 'Toilettage'],
      'loisirs créatifs': ['Aquariophilie'],
    },
  },

  bricolage_jardinage: {
    label: 'Bricolage & jardinage',
    weatherSensitive: true,
    rationale: 'Les proxys distinguent les travaux de confort intérieur, le jardinage productif en extérieur, le jardin comme lieu de détente, et la pratique manuelle. L’axe « sortie » n’avait pas de proxy défendable et a été retiré.',
    strongKeywords: ['bricolage', 'jardinage', 'outillage', 'potager', 'menuiserie', 'perceuse', 'tondeuse', 'rénovation'],
    weakKeywords: ['jardin', 'travaux', 'plante', 'atelier'],
    articlesByDimension: {
      cocooning: ['Cheminée', 'Isolation_thermique'],
      'activité extérieure': ['Jardinage', 'Potager'],
      'bien-être': ['Jardin'],
      'loisirs créatifs': ['Bricolage', 'Menuiserie'],
    },
  },

  automobile: {
    label: 'Automobile',
    weatherSensitive: true,
    rationale: 'Les proxys distinguent le déplacement quotidien, le voyage motorisé de plein air, et la pratique mécanique amateur. Les axes « cocooning » et « bien-être », qui pointaient précédemment vers Pneumatique et Lavage automobile, ont été retirés faute de rapport défendable.',
    strongKeywords: ['automobile', 'voiture', 'véhicule', 'pneu', 'carburant', 'garage', 'camping-car', 'motorisation'],
    weakKeywords: ['auto', 'route', 'conduite', 'entretien'],
    articlesByDimension: {
      sortie: ['Automobile', 'Covoiturage'],
      'activité extérieure': ['Camping-car', 'Caravane_(véhicule)'],
      'loisirs créatifs': ['Tuning', "Fonctionnement_de_l'automobile"],
    },
  },

  services_generaux: {
    label: 'Services du quotidien',
    weatherSensitive: true,
    rationale: 'Les proxys distinguent le service rendu à domicile, la consommation hors domicile, la mobilité, l’aide à la personne et la formation.',
    strongKeywords: ['livraison', 'déménagement', 'réparation', 'ménage', 'garde d’enfants', 'formation professionnelle', 'pressing'],
    weakKeywords: ['service', 'assistance', 'abonnement', 'intervention'],
    articlesByDimension: {
      cocooning: ['Télétravail', 'Livraison'],
      sortie: ['Restauration_rapide'],
      'activité extérieure': ['Transport_en_commun'],
      'bien-être': ['Services_à_la_personne_en_France'],
      'loisirs créatifs': ['Formation_professionnelle'],
    },
  },
};

export function getSectorLabel(sector) {
  return SECTORS[sector]?.label ?? DEFAULT_SECTOR.label;
}

export function getSectorRationale(sector) {
  return SECTORS[sector]?.rationale ?? DEFAULT_SECTOR.rationale;
}

/** Un secteur non météo-sensible ne doit jamais peser dans le score. */
export function isSectorWeatherSensitive(sector) {
  const entry = SECTORS[sector] ?? DEFAULT_SECTOR;
  return entry.weatherSensitive !== false;
}
