export const CHAPTERS = [
  {
    id: 'presentation',
    num: null,
    label: 'Présentation',
    title: 'Note de présentation',
    subtitle: 'Contexte, auteur & promesse du livre blanc',
    accent: 'neon',
    blocks: [
      {
        type: 'callout',
        label: 'Livre blanc V4',
        text: 'Marketing prédictif & agents IA — Comment transformer les signaux contextuels en décisions marketing activables ?',
      },
      {
        type: 'p',
        text: 'Les marques n\'ont jamais eu accès à autant de données : visites, achats, clics, ouvertures d\'e-mails, paniers abandonnés, recherches internes, performances média, parcours de navigation, données CRM et signaux comportementaux.',
      },
      {
        type: 'p',
        text: 'Pourtant, une grande partie des campagnes marketing reste encore pensée selon une logique fixe : un calendrier, une cible, un message, une date d\'envoi. Cette logique est utile pour organiser les équipes, mais elle montre vite ses limites.',
      },
      {
        type: 'p',
        text: 'Le consommateur ne réagit pas uniquement en fonction de son profil ou de son historique d\'achat. Il réagit aussi en fonction de son contexte : la météo, la saison, le moment de la journée, son niveau d\'attention, son intention récente ou encore sa disponibilité mentale.',
      },
      {
        type: 'quote',
        text: 'Une même personne peut être très réceptive à un message un samedi pluvieux de janvier et totalement indifférente au même message un mardi ensoleillé de juin. Ce n\'est pas forcément le client qui a changé. C\'est son contexte.',
      },
      {
        type: 'callout',
        label: 'Concept central',
        text: 'Ce décalage entre le contexte réel dans lequel se trouve une audience et le message envoyé par la marque constitue ce que ce livre blanc appelle le Contextual Gap.',
      },
      {
        type: 'h3',
        text: 'Présentation de l\'auteur',
      },
      {
        type: 'p',
        text: 'Mickael Randrianandraina — Web Analyst en alternance chez Cultura, étudiant en Mastère Data Marketing & IA. Son quotidien professionnel consiste à analyser des données de navigation, de trafic, de performance commerciale et de comportement utilisateur pour aider les équipes marketing à mieux comprendre ce qui se passe sur leurs canaux digitaux.',
      },
      {
        type: 'p',
        text: 'Ce livre blanc s\'inscrit dans la continuité de ce parcours. Il part d\'une conviction simple : le rôle du Web Analyst ne se limite plus à expliquer ce qui s\'est passé. Il doit aussi contribuer à concevoir des systèmes capables d\'anticiper ce qui peut se passer, puis de transformer cette anticipation en action mesurable.',
      },
      {
        type: 'quote',
        text: 'La data prédictive identifie l\'opportunité. L\'agent IA orchestre l\'action.',
      },
    ],
  },
  {
    id: 'exec-summary',
    num: null,
    label: 'Executive Summary',
    title: 'Executive Summary',
    subtitle: 'Méthode en 5 étapes pour passer d\'un marketing planifié à un marketing contextuel',
    accent: 'blue',
    blocks: [
      {
        type: 'p',
        text: 'Les campagnes marketing sont encore trop souvent pensées comme des séquences fixes : une date, une cible, un message. Cette logique permet d\'organiser les équipes, mais elle ne suffit plus à capter la réalité du comportement client.',
      },
      {
        type: 'p',
        text: 'Un consommateur n\'est pas uniquement défini par son âge, son historique d\'achat ou son segment CRM. Il est aussi influencé par son contexte immédiat : météo, saison, moment de la journée, niveau d\'attention, disponibilité mentale, intention récente ou pression commerciale déjà reçue.',
      },
      {
        type: 'callout',
        label: 'Le Contextual Gap',
        text: 'Le problème apparaît lorsque la marque envoie un message cohérent dans son calendrier, mais moins cohérent avec le contexte réel de réception.',
      },
      {
        type: 'p',
        text: 'La data prédictive permet d\'exploiter certains signaux pour estimer la probabilité qu\'un message soit pertinent à un instant donné. Mais la prédiction seule ne suffit pas. C\'est ici que les agents IA deviennent stratégiques.',
      },
      {
        type: 'h3',
        text: 'Méthode en 5 étapes',
      },
      {
        type: 'steps',
        items: [
          { num: 1, title: 'Identifier le Contextual Gap', desc: 'Repérer l\'écart entre le contexte réel de l\'audience et le message envoyé par la marque.' },
          { num: 2, title: 'Exploiter les signaux contextuels', desc: 'Croiser météo, saisonnalité, navigation, CRM, engagement, recherches internes et signaux business.' },
          { num: 3, title: 'Estimer la réceptivité', desc: 'Construire des scores, règles ou modèles pour prioriser les actions les plus pertinentes.' },
          { num: 4, title: 'Concevoir un Agent Marketing Contextuel', desc: 'Mettre en place une boucle capable d\'observer, recommander, activer, mesurer et apprendre.' },
          { num: 5, title: 'Encadrer l\'activation', desc: 'Maintenir des garde-fous humains, RGPD, éthiques et opérationnels.' },
        ],
      },
      {
        type: 'p',
        text: 'La musique est utilisée comme exemple pédagogique. Des études à grande échelle montrent que les préférences musicales varient selon les cycles journaliers, les saisons et les conditions météo. Elle illustre un principe plus large : certains comportements humains changent avec le contexte, et ces changements peuvent être mesurés.',
      },
      {
        type: 'p',
        text: 'Mais l\'application principale de ce livre blanc est B2B : CRM, e-commerce, retail, personnalisation onsite, campagnes e-mail, segmentation, scoring et aide à la décision marketing.',
      },
    ],
  },
  {
    id: 'intro',
    num: null,
    label: 'Introduction',
    title: 'Introduction',
    subtitle: 'Du calendrier marketing au marketing contextuel',
    accent: 'mint',
    blocks: [
      {
        type: 'h3',
        text: 'Le problème : les marques planifient, les consommateurs réagissent',
      },
      {
        type: 'p',
        text: 'Le marketing a besoin de planification. Les campagnes se préparent à l\'avance, les budgets se valident, les temps forts commerciaux sont inscrits dans un calendrier annuel et les équipes s\'organisent autour de dates clés. Cette organisation est nécessaire. Mais elle crée un risque : confondre le calendrier de la marque avec le contexte réel du consommateur.',
      },
      {
        type: 'p',
        text: 'Une campagne "été" peut être lancée au bon moment dans le planning, mais tomber pendant une semaine froide et pluvieuse. Une newsletter dynamique peut être envoyée au bon segment CRM, mais arriver à un moment où l\'audience est fatiguée, peu disponible ou déjà surexposée.',
      },
      {
        type: 'callout',
        label: 'Contextual Gap',
        text: 'L\'écart entre le contexte réel dans lequel se trouve une audience et le message que la marque lui adresse.',
      },
      {
        type: 'h3',
        text: 'La limite des automatisations classiques',
      },
      {
        type: 'p',
        text: 'Les marques ont déjà commencé à répondre à ce problème avec l\'automatisation marketing : scénarios CRM, relances panier abandonné, triggers comportementaux, personnalisation onsite ou recommandations produits.',
      },
      {
        type: 'list',
        items: [
          'si panier abandonné depuis 24 heures, alors envoyer un e-mail ;',
          'si client inactif depuis 90 jours, alors envoyer une offre de réactivation ;',
          'si température inférieure à 10°C, alors afficher une sélection hiver ;',
          'si client a consulté une catégorie, alors pousser des produits similaires.',
        ],
      },
      {
        type: 'p',
        text: 'Ces règles fonctionnent dans des cas simples. Mais elles atteignent vite leurs limites lorsque les signaux se multiplient. Un client peut avoir abandonné un panier, mais être déjà saturé par les e-mails. Il peut être dans une zone froide, mais consulter des produits d\'été.',
      },
      {
        type: 'h3',
        text: 'Pourquoi les agents IA changent la logique',
      },
      {
        type: 'p',
        text: 'Un agent IA n\'est pas seulement un chatbot. Dans une logique marketing, il peut être défini comme un système capable de percevoir des signaux, analyser une situation, recommander une action, utiliser des outils ou sources externes, produire ou adapter un contenu, mesurer les résultats et apprendre des performances passées.',
      },
      {
        type: 'quote',
        text: 'Là où une automatisation classique applique une règle, un agent IA peut orchestrer une décision.',
      },
      {
        type: 'callout',
        label: 'Problématique',
        text: 'Comment les marques peuvent-elles utiliser les agents IA pour passer d\'un marketing planifié à un marketing prédictif, capable d\'observer le contexte client, de recommander le bon message et d\'optimiser les campagnes en continu ?',
      },
    ],
  },
  {
    id: 'partie1',
    num: '1',
    label: 'Contextual Gap',
    title: 'Le Contextual Gap',
    subtitle: 'Quand le message est bon, mais pas le moment',
    accent: 'neon',
    blocks: [
      {
        type: 'h3',
        text: '1.1. Le client n\'est pas seulement un profil',
      },
      {
        type: 'p',
        text: 'Dans les outils marketing, un client est souvent représenté par une ligne dans une base de données. On lui associe un identifiant, un segment, une valeur client, une fréquence d\'achat, des catégories d\'intérêt ou un score d\'engagement. Cette représentation est utile, mais elle reste incomplète.',
      },
      {
        type: 'p',
        text: 'Le marketing prédictif ne consiste donc pas à remplacer la segmentation classique. Il consiste à lui ajouter une couche dynamique : celle du contexte.',
      },
      {
        type: 'h3',
        text: '1.2. Définition du Contextual Gap',
      },
      {
        type: 'callout',
        label: 'Définition',
        text: 'Le Contextual Gap désigne le décalage entre le contexte réel dans lequel se trouve une audience et le message envoyé par la marque. Ce décalage peut apparaître même lorsque le ciblage est correct.',
      },
      {
        type: 'p',
        text: 'Exemple simple : une enseigne retail prépare une campagne "sorties & loisirs" pour le printemps. Le calendrier est cohérent, les produits sont adaptés, le ciblage CRM est correct. Mais la campagne est poussée pendant une semaine froide, pluvieuse et peu favorable aux activités extérieures. Le message n\'est pas forcément mauvais. Il est simplement moins aligné avec le contexte réel du client.',
      },
      {
        type: 'p',
        text: 'À l\'inverse, un contexte pluvieux peut devenir une opportunité pour des univers liés au confort, à la maison, à la lecture, aux jeux, aux loisirs créatifs ou au bien-être.',
      },
      {
        type: 'h3',
        text: '1.3. Le Contextual Gap en matrice',
      },
      {
        type: 'matrix',
        cols: ['Contexte réel', 'Message envoyé', 'Décalage observé', 'Risque marketing'],
        rows: [
          ['Pluie, froid, saison hivernale', 'Message dynamique orienté sortie', 'Le message demande de l\'énergie alors que le contexte favorise le confort', 'CTR plus faible, faible résonance émotionnelle, conversion décevante'],
          ['Forte chaleur, week-end, intention de sortie', 'Message très long, institutionnel, peu visuel', 'Le format demande trop d\'attention alors que le contexte favorise une lecture rapide', 'Faible engagement, rebond élevé, perte d\'attention'],
          ['Segment déjà fortement sollicité', 'Relance commerciale agressive', 'Le message augmente la pression au lieu de réduire la friction', 'Désabonnement, fatigue CRM, dégradation de l\'image'],
          ['Recherche interne en hausse sur un univers précis', 'Home page générique', 'La demande émergente n\'est pas reflétée dans les contenus proposés', 'Opportunité non exploitée, baisse du taux de clic éditorial'],
        ],
      },
      {
        type: 'h3',
        text: '1.4. Pourquoi l\'agent IA devient utile ici',
      },
      {
        type: 'p',
        text: 'Un dashboard permet de constater une baisse de performance. Un analyste peut ensuite chercher les causes. Mais dans beaucoup d\'organisations, cette analyse arrive après la campagne.',
      },
      {
        type: 'list',
        items: [
          'détecter une météo ou un contexte atypique ;',
          'repérer une baisse de performance inhabituelle ;',
          'comparer les signaux CRM, navigation et contexte ;',
          'recommander une adaptation de message ;',
          'alerter l\'équipe marketing ;',
          'proposer une variante prête à tester ;',
          'documenter les hypothèses utilisées.',
        ],
      },
      {
        type: 'quote',
        text: 'L\'enjeu n\'est pas de supprimer l\'humain. L\'enjeu est de réduire le temps entre le signal et l\'action.',
      },
    ],
  },
  {
    id: 'partie2',
    num: '2',
    label: 'Études',
    title: 'Ce que les études nous disent',
    subtitle: 'Le contexte modifie les comportements',
    accent: 'blue',
    blocks: [
      {
        type: 'h3',
        text: '2.1. La musique comme preuve pédagogique de réceptivité contextuelle',
      },
      {
        type: 'p',
        text: 'La musique est un signal intéressant parce qu\'elle exprime rapidement une forme de réceptivité : recherche d\'énergie, besoin de calme, envie d\'euphorie, introspection, stimulation ou réconfort. Surtout, ce signal peut être mesuré à grande échelle.',
      },
      {
        type: 'callout',
        label: 'Étude Park et al. (2019)',
        text: 'Nature Human Behaviour — analyse de 765 millions d\'écoutes Spotify issues d\'environ un million d\'utilisateurs dans 51 pays. Les chercheurs ont identifié des variations journalières et saisonnières dans les préférences affectives musicales.',
      },
      {
        type: 'p',
        text: 'La leçon n\'est pas que les marques doivent utiliser les goûts musicaux comme outil de ciblage. La leçon est plus large : si un comportement aussi personnel que l\'écoute musicale varie avec le contexte, alors la réceptivité à un message commercial peut elle aussi varier selon les conditions dans lesquelles ce message est reçu.',
      },
      {
        type: 'h3',
        text: '2.2. Météo et caractéristiques musicales',
      },
      {
        type: 'callout',
        label: 'Étude Anglada-Tort et al. (2023)',
        text: 'Royal Society Open Science — "Here comes the sun: music features of popular songs reflect prevailing weather conditions". Les périodes chaudes et ensoleillées sont davantage associées à des chansons à forte intensité et à charge émotionnelle positive.',
      },
      {
        type: 'p',
        text: 'Ce point est utile pour le marketing, parce qu\'il montre que la météo ne modifie pas seulement nos activités extérieures. Elle peut aussi être associée à des variations dans les contenus émotionnels que les individus consomment.',
      },
      {
        type: 'h3',
        text: '2.3. Météo, humeur et dépenses',
      },
      {
        type: 'callout',
        label: 'Étude Murray et al. (2010)',
        text: 'Journal of Retailing and Consumer Services — montre que l\'exposition à la météo peut influencer les dépenses, notamment via son effet sur les émotions négatives. La météo peut modifier l\'état émotionnel d\'un consommateur, et cet état émotionnel peut ensuite influencer sa propension à acheter ou à payer.',
      },
      {
        type: 'h3',
        text: '2.4. Ce que ces études permettent vraiment de conclure',
      },
      {
        type: 'list',
        items: [
          'Les comportements émotionnels et culturels peuvent varier selon le contexte.',
          'La météo et la saison peuvent être associées à des variations de préférences, d\'humeur ou de comportements d\'achat.',
          'Les marques peuvent utiliser ces signaux comme hypothèses d\'activation, à condition de les tester sur leurs propres données.',
        ],
      },
      {
        type: 'p',
        text: 'Ces études ne permettent pas de conclure que la météo suffit à prédire un achat, que tous les individus réagissent de la même manière, ou qu\'une corrélation observée garantit un gain business immédiat.',
      },
      {
        type: 'quote',
        text: 'La bonne posture : utiliser les études comme point de départ, puis tester les hypothèses sur les données réelles de la marque.',
      },
    ],
  },
  {
    id: 'partie3',
    num: '3',
    label: 'Data → Agentique',
    title: 'De la donnée prédictive à l\'agentique',
    subtitle: 'Marketing prédictif',
    accent: 'mint',
    blocks: [
      {
        type: 'h3',
        text: '3.1. Ce que signifie vraiment "prédictif" en marketing',
      },
      {
        type: 'p',
        text: 'Parler de marketing prédictif ne signifie pas prédire avec certitude ce qu\'un client va faire. Cela signifie estimer une probabilité à partir de signaux observables.',
      },
      {
        type: 'list',
        items: [
          'un client qui visite trois fois une catégorie produit en sept jours peut avoir une intention plus forte qu\'un simple visiteur occasionnel ;',
          'un panier abandonné associé à une ouverture d\'e-mail récente peut signaler une intention latente ;',
          'une météo froide et pluvieuse peut rendre certains univers produits plus pertinents ;',
          'une navigation longue sur des contenus éditoriaux peut indiquer une disponibilité mentale plus élevée ;',
          'un rebond rapide peut signaler une faible attention ou une inadéquation entre le message et l\'intention.',
        ],
      },
      {
        type: 'h3',
        text: '3.2. Les familles de signaux exploitables',
      },
      {
        type: 'table',
        headers: ['Famille de signal', 'Exemples', 'Utilité marketing'],
        rows: [
          ['Signaux contextuels', 'météo, température, saison, jour, heure', 'Adapter le timing, le ton et l\'univers du message'],
          ['Signaux comportementaux', 'pages vues, temps passé, recherche interne, rebond, panier abandonné', 'Détecter l\'intention ou le niveau d\'attention'],
          ['Signaux CRM', 'récence d\'achat, fréquence, panier moyen, catégories achetées', 'Prioriser les segments et personnaliser les offres'],
          ['Signaux d\'engagement', 'ouvertures e-mail, clics, interactions social media', 'Estimer la réceptivité à une sollicitation'],
          ['Signaux business', 'stock, marge, saison commerciale, objectifs de vente', 'Aligner la personnalisation avec les enjeux économiques'],
        ],
      },
      {
        type: 'quote',
        text: 'Pris séparément, ces signaux peuvent être faibles. Croisés ensemble, ils deviennent beaucoup plus utiles.',
      },
      {
        type: 'h3',
        text: '3.3. La limite d\'un modèle prédictif sans activation',
      },
      {
        type: 'p',
        text: 'Un modèle prédictif peut produire un score : probabilité de clic, probabilité de conversion, risque de churn, appétence produit ou probabilité d\'ouverture. Mais un score ne crée pas de valeur tout seul.',
      },
      {
        type: 'callout',
        label: 'Rôle de l\'agent IA',
        text: 'C\'est précisément le rôle de l\'agent IA : faire le lien entre la prédiction et l\'action.',
      },
      {
        type: 'h3',
        text: '3.4. Le rôle de l\'agent IA : orchestrer la boucle complète',
      },
      {
        type: 'table',
        headers: ['Étape', 'Rôle de l\'agent IA', 'Exemple marketing'],
        rows: [
          ['Observer', 'Lire les signaux disponibles', 'Météo, CRM, navigation, engagement, stock'],
          ['Interpréter', 'Comprendre le contexte', 'Audience disponible, intention forte, météo défavorable'],
          ['Prédire', 'Estimer la meilleure opportunité', 'Probabilité de clic, d\'achat ou de désabonnement'],
          ['Recommander', 'Proposer une action', 'Envoyer, attendre, modifier le message, changer le canal'],
          ['Activer', 'Préparer ou déclencher l\'action', 'Générer une variante, alimenter un outil CRM'],
          ['Apprendre', 'Mesurer et ajuster', 'Comparer les performances et améliorer les règles'],
        ],
      },
    ],
  },
  {
    id: 'partie4',
    num: '4',
    label: 'Framework AMC',
    title: 'Le framework : l\'Agent Marketing Contextuel',
    subtitle: 'Définition, méthode et architecture',
    accent: 'neon',
    blocks: [
      {
        type: 'h3',
        text: '4.1. Définition',
      },
      {
        type: 'callout',
        label: 'Agent Marketing Contextuel',
        text: 'Un framework permettant de transformer des signaux contextuels et comportementaux en recommandations marketing activables. Son objectif est simple : réduire le délai entre l\'observation d\'un signal et l\'action marketing pertinente.',
      },
      {
        type: 'p',
        text: 'Il ne s\'agit pas nécessairement d\'un agent totalement autonome dès le départ. Dans une version réaliste, il peut commencer comme un copilote : il analyse, recommande et propose. L\'humain valide les décisions importantes.',
      },
      {
        type: 'h3',
        text: '4.2. La méthode en cinq étapes',
      },
      {
        type: 'table',
        headers: ['Étape', 'Question à poser', 'Livrable attendu'],
        rows: [
          ['Observer', 'Quels signaux sont disponibles ?', 'Liste des signaux contextuels, comportementaux, CRM et business'],
          ['Détecter', 'Existe-t-il un décalage entre contexte et message ?', 'Identification d\'un éventuel Contextual Gap'],
          ['Estimer', 'Quel est le niveau de réceptivité probable ?', 'Score indicatif ou niveau de priorité'],
          ['Recommander', 'Quelle action marketing semble la plus pertinente ?', 'Recommandation argumentée avec niveau de confiance'],
          ['Mesurer', 'La recommandation a-t-elle amélioré la performance ?', 'Résultat du test, apprentissage, ajustement des règles'],
        ],
      },
      {
        type: 'h3',
        text: '4.3. Architecture fonctionnelle de l\'agent',
      },
      {
        type: 'table',
        headers: ['Bloc', 'Fonction', 'Exemple'],
        rows: [
          ['Connecteurs de données', 'Récupérer les signaux', 'Météo, analytics, CRM, outil e-mailing, stock'],
          ['Moteur d\'analyse', 'Croiser les signaux', 'Détecter contexte froid + panier abandonné + forte intention'],
          ['Moteur de décision', 'Recommander une action', 'Relancer avec message réconfortant ou attendre'],
          ['Moteur de génération', 'Produire des variantes', 'Objet d\'e-mail, accroche, texte court, recommandation produit'],
          ['Moteur de mesure', 'Évaluer la performance', 'CTR, conversion, panier moyen, désabonnement'],
        ],
      },
      {
        type: 'h3',
        text: '4.4. Les niveaux d\'autonomie',
      },
      {
        type: 'table',
        headers: ['Niveau', 'Rôle de l\'agent', 'Rôle de l\'humain'],
        rows: [
          ['Niveau 1 — Agent analyste', 'Analyse les signaux et produit des recommandations', 'Lit, challenge et décide'],
          ['Niveau 2 — Agent copilote', 'Propose des variantes de messages ou de scénarios', 'Valide avant activation'],
          ['Niveau 3 — Agent semi-automatisé', 'Active des actions simples avec garde-fous', 'Supervise et contrôle les exceptions'],
          ['Niveau 4 — Agent autonome encadré', 'Optimise certains scénarios en continu', 'Définit la stratégie, les règles et les limites'],
        ],
      },
      {
        type: 'h3',
        text: '4.5. Exemple de décision agentique',
      },
      {
        type: 'p',
        text: 'Situation : une enseigne retail détecte une baisse de température, de la pluie, une hausse des recherches internes autour des activités d\'intérieur et un stock disponible sur certains produits loisirs.',
      },
      {
        type: 'numbered',
        items: [
          'identifier le contexte météo ;',
          'comparer ce contexte aux performances passées ;',
          'détecter les univers produits les plus cohérents ;',
          'proposer une variante de home page ;',
          'générer trois accroches e-mail ;',
          'recommander un segment à activer ;',
          'estimer les KPI à suivre ;',
          'produire un rapport après activation.',
        ],
      },
      {
        type: 'quote',
        text: 'L\'humain garde la décision finale, mais il gagne du temps sur l\'analyse, la génération et la priorisation.',
      },
    ],
  },
  {
    id: 'partie5',
    num: '5',
    label: 'Baromètre Data',
    title: 'Baromètre Data : du framework au prototype',
    subtitle: 'Architecture fonctionnelle des 10 modules',
    accent: 'lilac',
    blocks: [
      {
        type: 'h3',
        text: '5.1. Pourquoi intégrer un prototype ?',
      },
      {
        type: 'p',
        text: 'Le risque d\'un livre blanc consacré à l\'intelligence artificielle est de rester trop théorique. Pour éviter cet écueil, ce travail s\'accompagne d\'un prototype : Baromètre Data — une première version d\'un Agent Marketing Contextuel.',
      },
      {
        type: 'callout',
        label: 'Promesse du prototype',
        text: 'Observer le contexte. Détecter l\'écart. Recommander l\'action. Mesurer l\'impact.',
      },
      {
        type: 'h3',
        text: '5.2. Positionnement',
      },
      {
        type: 'p',
        text: 'Baromètre Data ne doit pas être compris comme une IA autonome complète. Il s\'agit d\'une V1 réaliste, pensée comme un copilote marketing.',
      },
      {
        type: 'list',
        items: [
          'analyser un brief de campagne ;',
          'lire des signaux contextuels simples ;',
          'estimer une réceptivité contextuelle ;',
          'détecter un éventuel Contextual Gap ;',
          'recommander une action ;',
          'générer des variantes de message ;',
          'proposer un plan d\'activation ;',
          'recommander un test A/B ;',
          'intégrer une boucle d\'apprentissage après campagne.',
        ],
      },
      {
        type: 'h3',
        text: '5.3. Architecture des 10 modules',
      },
      {
        type: 'table',
        headers: ['Module', 'Rôle', 'Exemple de sortie'],
        rows: [
          ['1. Context Input', 'Recueillir le brief de campagne', 'Localisation, secteur, canal, objectif, audience, produit, message, KPI, ton'],
          ['2. Context Engine', 'Analyser le contexte', 'Météo, température, pluie, saison, moment de la journée, contexte dominant'],
          ['3. Prediction Layer', 'Estimer la réceptivité', 'Score de Réceptivité Contextuelle sur 100'],
          ['4. Contextual Gap Detection', 'Identifier l\'écart entre contexte et message', '"Message dynamique alors que le contexte favorise le confort"'],
          ['5. Agent Recommendation', 'Proposer une action argumentée', 'Modifier le message, tester deux variantes, attendre, changer de canal'],
          ['6. Variantes de message', 'Générer plusieurs options', 'Variante standard, contextualisée, optimisée'],
          ['7. Activation Plan', 'Préparer l\'action marketing', 'Canal, segment, timing, pression, garde-fou'],
          ['8. Test A/B', 'Structurer l\'expérimentation', 'Hypothèse, groupe A/B, KPI, durée, critère de succès'],
          ['9. Learning Loop', 'Intégrer les résultats', 'CTR, conversion, désabonnement, variante gagnante, enseignement'],
          ['10. Garde-fous', 'Encadrer l\'usage', 'RGPD, validation humaine, journalisation, limites de confiance'],
        ],
      },
      {
        type: 'h3',
        text: '5.4. Le Score de Réceptivité Contextuelle',
      },
      {
        type: 'table',
        headers: ['Sous-score', 'Pondération', 'Ce qu\'il mesure'],
        rows: [
          ['Score météo', '25 %', 'Cohérence entre le contexte météo et l\'univers proposé'],
          ['Score message', '30 %', 'Alignement entre le ton, la promesse et le contexte réel'],
          ['Score audience', '25 %', 'Pertinence du message pour le segment ciblé'],
          ['Score timing', '20 %', 'Qualité du moment d\'activation'],
        ],
      },
      {
        type: 'table',
        headers: ['Score global', 'Lecture recommandée'],
        rows: [
          ['80 à 100', 'Forte cohérence contextuelle. Activation possible avec suivi des KPI.'],
          ['60 à 79', 'Cohérence correcte, mais certains ajustements peuvent améliorer la réceptivité.'],
          ['40 à 59', 'Risque de Contextual Gap. Recommandation d\'adapter le message ou le timing.'],
          ['0 à 39', 'Décalage fort. Activation à revoir avant diffusion.'],
        ],
      },
      {
        type: 'h3',
        text: '5.5. Exemple de sortie agent',
      },
      {
        type: 'callout',
        label: 'Brief campagne',
        text: 'Une marque souhaite envoyer une campagne e-mail pour promouvoir des activités extérieures pendant une semaine froide et pluvieuse.',
      },
      {
        type: 'p',
        text: 'Contexte détecté : température basse, pluie, saison hivernale, contexte dominant : cocooning.',
      },
      {
        type: 'quote',
        text: '"Un temps parfait pour créer, lire et se faire plaisir à la maison." — Variante proposée par l\'agent',
      },
    ],
  },
  {
    id: 'partie6',
    num: '6',
    label: 'Cas d\'usage B2B',
    title: 'Cas d\'usage B2B',
    subtitle: 'CRM météo-sensible, onsite, e-mailing, aide à la décision',
    accent: 'warm',
    blocks: [
      {
        type: 'h3',
        text: '6.1. Agent CRM météo-sensible',
      },
      {
        type: 'p',
        text: 'Objectif business : améliorer la pertinence des relances CRM en adaptant le ton, le timing et l\'univers produit au contexte météo et comportemental.',
      },
      {
        type: 'table',
        headers: ['Signal détecté', 'Interprétation', 'Action proposée', 'KPI à suivre', 'Garde-fou'],
        rows: [
          ['Pluie + froid', 'Contexte favorable aux univers maison/confort', 'Relance avec ton chaleureux et sélection cocooning', 'CTR, conversion, panier moyen', 'Ne pas sursolliciter les clients déjà exposés'],
          ['Panier abandonné récent', 'Intention d\'achat latente', 'Rappel personnalisé sans surpression commerciale', 'Conversion panier, désabonnement', 'Limiter le nombre de relances'],
          ['Ouverture e-mail sans clic', 'Attention faible ou proposition peu claire', 'Tester un objet plus direct ou une offre plus lisible', 'Taux de clic', 'Ne pas multiplier les tests sur un segment trop petit'],
          ['Forte chaleur', 'Contexte favorable aux sorties ou loisirs extérieurs', 'Message plus dynamique, visuels lumineux, CTA court', 'Engagement, clics, conversion', 'Vérifier la cohérence avec le stock et la saison commerciale'],
        ],
      },
      {
        type: 'h3',
        text: '6.2. Agent onsite pour home page',
      },
      {
        type: 'table',
        headers: ['Contexte', 'Variante recommandée', 'KPI principal', 'Garde-fou'],
        rows: [
          ['Pluie + hausse des recherches "puzzle"', 'Bloc "Activités à faire chez soi"', 'Taux de clic sur bloc', 'Vérifier disponibilité produit'],
          ['Soleil + hausse des recherches "sortie"', 'Bloc "Idées pour profiter du week-end"', 'Taux de clic + conversion', 'Ne pas masquer les priorités commerciales fortes'],
          ['Navigation longue', 'Guide éditorial ou sélection approfondie', 'Temps passé + clics profonds', 'Ne pas complexifier le parcours d\'achat'],
          ['Rebond élevé', 'Message court, CTA direct, moins de texte', 'Taux de rebond, clic CTA', 'Tester progressivement pour éviter une rupture UX'],
        ],
      },
      {
        type: 'h3',
        text: '6.3. Agent e-mailing et objets de campagne',
      },
      {
        type: 'p',
        text: 'L\'agent peut produire plusieurs variantes : version courte, émotionnelle, promotionnelle, inspirationnelle, urgente, sobre. Mais il ne doit pas choisir uniquement selon son intuition générative. Il doit s\'appuyer sur les performances passées.',
      },
      {
        type: 'callout',
        label: 'Exemple de recommandation',
        text: '"Pour ce segment, les objets courts performent mieux le lundi matin. Les objets trop promotionnels augmentent le taux de désabonnement. Recommandation : tester un objet inspirationnel court, lié au contexte météo, sans mention de réduction."',
      },
      {
        type: 'h3',
        text: '6.4. Agent d\'aide à la décision marketing',
      },
      {
        type: 'p',
        text: 'Chaque matin ou chaque début de semaine, l\'agent peut produire un brief : météo et contexte de la semaine, catégories en hausse, campagnes sous-performantes, segments à potentiel, anomalies de conversion, recommandations d\'activation, points de vigilance RGPD.',
      },
      {
        type: 'table',
        headers: ['Besoin métier', 'Apport de l\'agent', 'Valeur créée'],
        rows: [
          ['Comprendre rapidement les signaux faibles', 'Résumé automatique des variations importantes', 'Gain de temps d\'analyse'],
          ['Prioriser les actions marketing', 'Recommandations classées par impact potentiel', 'Meilleure allocation des efforts'],
          ['Préparer les tests', 'Hypothèses A/B structurées', 'Expérimentation plus rigoureuse'],
          ['Suivre les résultats', 'Synthèse post-campagne', 'Apprentissage continu'],
        ],
      },
    ],
  },
  {
    id: 'partie7',
    num: '7',
    label: 'Musique → Signaux',
    title: 'De la musique aux signaux business',
    subtitle: 'Exemple pédagogique et mini-modèle prédictif',
    accent: 'mint',
    blocks: [
      {
        type: 'h3',
        text: '7.1. Pourquoi garder la musique comme démonstrateur ?',
      },
      {
        type: 'p',
        text: 'La musique reste utile dans ce livre blanc, mais son rôle doit être clair : elle n\'est pas la finalité, elle est l\'exemple pédagogique.',
      },
      {
        type: 'p',
        text: 'Elle permet de montrer simplement comment passer d\'un ressenti subjectif ("cette musique fait été") à une donnée mesurable ("ce titre a une valence plus élevée, une énergie plus forte, une intensité plus marquée").',
      },
      {
        type: 'quote',
        text: 'La musique est donc un démonstrateur de méthode. Elle rend concret le passage d\'un ressenti à un signal, puis d\'un signal à une hypothèse.',
      },
      {
        type: 'h3',
        text: '7.2. Variables musicales et équivalents marketing',
      },
      {
        type: 'table',
        headers: ['Variable musicale', 'Définition simple', 'Équivalent marketing possible'],
        rows: [
          ['Valence', 'Positivité émotionnelle du morceau', 'Ton du message : joyeux, rassurant, introspectif'],
          ['Energy', 'Intensité perçue', 'Niveau de stimulation demandé au client'],
          ['Danceability', 'Rythme et facilité à bouger', 'Format plus dynamique ou plus engageant'],
          ['Acousticness', 'Dimension organique, chaleureuse', 'Contenu plus humain, naturel, réconfortant'],
          ['Tempo', 'Vitesse du morceau', 'Rythme apparent, mais insuffisant seul'],
        ],
      },
      {
        type: 'h3',
        text: '7.3. Mini-modèle prédictif : reconnaître une signature saisonnière',
      },
      {
        type: 'callout',
        label: 'Question de modélisation',
        text: '"À partir de ses caractéristiques audio, peut-on prédire si un titre appartient plutôt à un univers hiver ou été ?"',
      },
      {
        type: 'table',
        headers: ['Élément', 'Description'],
        rows: [
          ['Objectif', 'Prédire l\'univers saisonnier d\'un titre'],
          ['Variable cible', 'Univers : hiver ou été'],
          ['Variables explicatives', 'Valence, Energy, Danceability, Acousticness, Tempo'],
          ['Modèle possible', 'Régression logistique, arbre de décision ou Random Forest'],
          ['Métriques', 'Accuracy, précision, matrice de confusion'],
          ['Limite', 'Dataset illustratif, non représentatif, à considérer comme POC'],
        ],
      },
      {
        type: 'p',
        text: 'La leçon la plus importante est méthodologique : un indicateur isolé peut être trompeur. Le tempo seul ne permet pas de comprendre l\'humeur d\'un morceau. De la même manière, un taux de clic seul ne permet pas de comprendre toute la réceptivité client.',
      },
      {
        type: 'quote',
        text: 'Ce sont les croisements de signaux qui créent la valeur.',
      },
    ],
  },
  {
    id: 'partie8',
    num: '8',
    label: 'Tester en 30 jours',
    title: 'Tester un Agent Marketing Contextuel en 30 jours',
    subtitle: 'Plan de test progressif et mesurable',
    accent: 'blue',
    blocks: [
      {
        type: 'h3',
        text: '8.1. Pourquoi commencer petit',
      },
      {
        type: 'p',
        text: 'Un agent IA marketing ne doit pas être lancé directement sur un périmètre critique. Pour être crédible, le test doit commencer sur un cas d\'usage simple, mesurable et contrôlé.',
      },
      {
        type: 'callout',
        label: 'La bonne question à se poser',
        text: '"L\'agent aide-t-il l\'équipe à mieux décider, plus vite, avec plus de contexte ?" — et non "L\'agent peut-il remplacer une équipe marketing ?"',
      },
      {
        type: 'h3',
        text: '8.2. Cas d\'usage adaptés à un test de 30 jours',
      },
      {
        type: 'table',
        headers: ['Cas d\'usage', 'Pourquoi il est pertinent', 'KPI principal'],
        rows: [
          ['Relance panier abandonné', 'Cas fréquent, mesurable, directement lié à la conversion', 'Taux de conversion panier'],
          ['Adaptation d\'une campagne e-mail', 'Facile à tester avec un groupe A/B', 'Taux de clic'],
          ['Personnalisation d\'un bloc home page', 'Permet de mesurer l\'impact d\'un contexte sur l\'engagement onsite', 'Taux de clic bloc'],
          ['Brief marketing quotidien', 'Utile pour mesurer le gain de temps et la qualité d\'aide à la décision', 'Temps gagné / qualité perçue'],
          ['Analyse météo + performance catégorie', 'Bon cas pour relier contexte externe et signaux business', 'Variation de conversion ou de clic'],
        ],
      },
      {
        type: 'h3',
        text: '8.3. Plan de test en 30 jours',
      },
      {
        type: 'steps',
        items: [
          { num: 'S1', title: 'Cadrage du cas d\'usage', desc: 'Définir le cas d\'usage, l\'objectif marketing, les données disponibles, les signaux utilisables, les KPI, les limites et les règles de validation humaine.' },
          { num: 'S2', title: 'Agent analyste', desc: 'L\'agent observe les signaux disponibles et produit une recommandation argumentée. Il ne déclenche rien. L\'humain compare avec son propre jugement.' },
          { num: 'S3', title: 'Agent copilote', desc: 'L\'agent propose des variantes d\'objet d\'e-mail, des accroches, des segments à prioriser, un timing d\'envoi, une hypothèse de test A/B. L\'humain valide chaque proposition.' },
          { num: 'S4', title: 'Test contrôlé', desc: 'Une recommandation est testée sur un périmètre limité. Groupe A : campagne standard. Groupe B : campagne contextualisée. Durée : 7 jours. KPI principal : taux de clic.' },
        ],
      },
      {
        type: 'h3',
        text: '8.4. Résultat attendu après 30 jours',
      },
      {
        type: 'numbered',
        items: [
          'L\'agent a-t-il détecté des signaux utiles ?',
          'Ses recommandations étaient-elles compréhensibles et actionnables ?',
          'L\'équipe marketing a-t-elle gagné du temps ?',
          'Le test a-t-il produit un impact mesurable ?',
          'Les limites et risques ont-ils été correctement identifiés ?',
        ],
      },
      {
        type: 'quote',
        text: 'Si la réponse est positive sur plusieurs de ces points, l\'expérimentation peut être étendue progressivement.',
      },
    ],
  },
  {
    id: 'partie9',
    num: '9',
    label: 'Limites & RGPD',
    title: 'Limites, RGPD et garde-fous',
    subtitle: 'Encadrer l\'usage responsable de l\'agent',
    accent: 'neon',
    blocks: [
      {
        type: 'h3',
        text: '9.1. Ce que l\'agent ne doit pas faire',
      },
      {
        type: 'p',
        text: 'Un Agent Marketing Contextuel ne doit pas être présenté comme un système capable de connaître l\'état émotionnel exact d\'un individu. Il ne lit pas les pensées. Il estime un contexte probable à partir de signaux observables.',
      },
      {
        type: 'list',
        items: [
          'décider seul sur des campagnes sensibles ;',
          'inférer l\'état émotionnel exact d\'un individu ;',
          'utiliser des données personnelles sans cadre clair ;',
          'présenter ses recommandations comme des certitudes ;',
          'activer automatiquement des campagnes sans validation humaine.',
        ],
      },
      {
        type: 'quote',
        text: 'La maturité agentique ne se mesure pas au niveau d\'automatisation maximal. Elle se mesure à la capacité de l\'organisation à automatiser sans perdre le contrôle.',
      },
      {
        type: 'h3',
        text: '9.2. Les principaux risques',
      },
      {
        type: 'table',
        headers: ['Risque', 'Exemple', 'Garde-fou recommandé'],
        rows: [
          ['Surpersonnalisation', 'Message trop précis qui donne une impression de surveillance', 'Privilégier les segments agrégés et les adaptations discrètes'],
          ['Mauvaise interprétation', 'L\'agent confond corrélation et causalité', 'Afficher les données utilisées, les limites et le niveau de confiance'],
          ['Hallucination', 'L\'agent invente une justification ou une tendance', 'Connecter l\'agent à des sources fiables et journaliser ses sorties'],
          ['Pression commerciale excessive', 'Trop de relances sur un client déjà sollicité', 'Définir des règles de pression marketing'],
          ['Non-conformité RGPD', 'Usage abusif de données de navigation ou de localisation', 'Valider les cas d\'usage avec les équipes data, juridique ou privacy'],
          ['Perte de contrôle humain', 'Activation automatique non maîtrisée', 'Maintenir une validation humaine sur les décisions sensibles'],
          ['Biais de décision', 'L\'agent favorise toujours certains segments ou produits', 'Auditer régulièrement les recommandations'],
        ],
      },
      {
        type: 'h3',
        text: '9.3. Points de vigilance RGPD',
      },
      {
        type: 'table',
        headers: ['Type de donnée', 'Niveau de vigilance', 'Recommandation'],
        rows: [
          ['Données météo publiques', 'Faible', 'Utilisables sans donnée personnelle'],
          ['Données de saison ou calendrier', 'Faible', 'Peu sensibles si elles ne sont pas croisées avec des données individuelles précises'],
          ['Données de navigation', 'Élevé', 'Dépend du consentement cookies et du cadre de mesure'],
          ['Données CRM', 'Moyen à élevé', 'Utilisation à encadrer selon la finalité et l\'information utilisateur'],
          ['Géolocalisation précise', 'Très élevé', 'À éviter sauf opt-in explicite et finalité justifiée'],
          ['Segments agrégés', 'Plus sûr', 'À privilégier pour limiter l\'intrusion'],
        ],
      },
      {
        type: 'h3',
        text: '9.4. Human-in-the-loop',
      },
      {
        type: 'callout',
        label: 'Bonne approche',
        text: '"Quelles décisions peuvent être assistées par l\'IA sans fragiliser la confiance, la conformité et la qualité marketing ?" — et non "Que peut-on automatiser au maximum ?"',
      },
      {
        type: 'h3',
        text: '9.5. Garde-fous dans Baromètre Data',
      },
      {
        type: 'p',
        text: 'Chaque recommandation devrait idéalement afficher : les données utilisées, les données non disponibles, le niveau de confiance, les limites de l\'analyse, le risque principal, les KPI à surveiller, une mention de validation humaine.',
      },
      {
        type: 'callout',
        label: 'Exemple de formulation',
        text: '"Cette recommandation est basée sur des signaux météo agrégés, le canal sélectionné et le message actuel. Elle ne repose pas sur une inférence émotionnelle individuelle. Validation humaine recommandée avant activation."',
      },
    ],
  },
  {
    id: 'conclusion',
    num: null,
    label: 'Conclusion',
    title: 'Conclusion',
    subtitle: 'Le consommateur ne change pas toujours. Son contexte, lui, change en permanence.',
    accent: 'neon',
    blocks: [
      {
        type: 'p',
        text: 'Le marketing ne peut plus se contenter de répondre à la question : "À qui parle-t-on ?" Il doit aussi répondre à une question plus dynamique : "Dans quel contexte cette personne ou ce segment reçoit-il notre message ?"',
      },
      {
        type: 'p',
        text: 'La segmentation permet de comprendre une partie du client. La data comportementale permet d\'observer ce qu\'il fait. Mais le contexte permet de mieux comprendre les conditions dans lesquelles il reçoit une sollicitation.',
      },
      {
        type: 'callout',
        label: 'L\'enjeu du Contextual Gap',
        text: 'Une campagne peut être bien ciblée, bien conçue et pourtant moins performante parce qu\'elle n\'est pas alignée avec le moment réel de réception.',
      },
      {
        type: 'p',
        text: 'La data prédictive permet d\'estimer cette réceptivité. Elle aide à repérer les signaux, à prioriser les segments, à identifier les moments favorables et à formuler des hypothèses d\'activation. Mais la prédiction seule ne suffit pas.',
      },
      {
        type: 'p',
        text: 'Un Agent Marketing Contextuel peut jouer le rôle d\'orchestrateur entre la donnée, la décision et l\'action. Il peut observer, interpréter, recommander, générer une variante, préparer un test, mesurer les résultats et apprendre progressivement.',
      },
      {
        type: 'quote',
        text: 'L\'enjeu n\'est pas de remplacer l\'humain. L\'enjeu est de mieux l\'équiper.',
      },
      {
        type: 'p',
        text: 'Le Web Analyst de demain ne sera pas seulement celui qui lit les dashboards après coup. Il sera celui qui aide les marques à concevoir des systèmes capables d\'observer, d\'interpréter, de recommander et d\'agir avec méthode.',
      },
      {
        type: 'quote',
        text: 'Le consommateur ne change pas toujours. Son contexte, lui, change en permanence. Et ce contexte peut désormais être observé, interprété et activé de manière mesurable, responsable et contrôlée.',
      },
    ],
  },
];

export const READING_TIME_MIN = 14;
