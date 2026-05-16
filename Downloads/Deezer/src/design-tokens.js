// ============================================================
// DEEZER — Design Tokens
// Source : screenshots app iOS + brand guidelines
// Usage  : importer dans le projet React, utiliser via CSS vars
// ============================================================

export const tokens = {

  // ----------------------------------------------------------
  // COULEURS
  // ----------------------------------------------------------
  colors: {

    // Backgrounds
    bg: {
      base:     '#000000', // fond principal app — TOUJOURS pur noir
      card:     '#111111', // cards, sections internes
      elevated: '#1A1A1A', // mini player, modals, overlays légers
      pressed:  '#2A2A2A', // états actifs / hover
      player:   '#0D0D0D', // fond player plein écran
    },

    // Texte
    text: {
      primary:   '#FFFFFF', // titres, labels actifs
      secondary: '#B3B3B3', // sous-titres, noms d'artistes
      tertiary:  '#666666', // hints, timestamps, labels inactifs
      accent:    '#A238FF', // nav active, CTA, badges
    },

    // Accents
    accent: {
      purple:      '#A238FF', // couleur primaire Deezer
      purpleDark:  '#7B1FD4', // hover/pressed sur accent
      purpleAlpha: 'rgba(162, 56, 255, 0.15)', // fond badge/pill accent
    },

    // Gradients
    gradients: {
      flow: 'linear-gradient(135deg, #A238FF 0%, #FF5C8A 100%)', // bouton Flow
      flowRadial: 'radial-gradient(circle, #A238FF 0%, #FF5C8A 100%)',
    },

    // Bordures
    border: {
      subtle:  'rgba(255, 255, 255, 0.08)', // séparateurs, bordures légères
      default: 'rgba(255, 255, 255, 0.12)', // bordures visibles
      strong:  'rgba(255, 255, 255, 0.20)', // bordures emphase
      accent:  '#A238FF',                   // bordure Behind the Song
    },

    // UI fonctionnels
    ui: {
      progressBg:    '#333333', // fond barre de progression
      progressFill:  '#FFFFFF', // remplissage barre de progression
      progressThumb: '#FFFFFF', // thumb scrubber
      separator:     'rgba(255, 255, 255, 0.08)',
    },

    // Behind the Song — tokens spécifiques
    bts: {
      cardBg:        '#111111',
      cardBorder:    '#A238FF',
      iconColor:     '#A238FF',
      overlayBg:     'rgba(0, 0, 0, 0.92)',
      badgeBg:       '#A238FF',
      badgeText:     '#FFFFFF',
      storyBarBg:    'rgba(255, 255, 255, 0.3)',
      storyBarFill:  '#FFFFFF',
      focusModeBg:   '#2A2A2A',
    },
  },

  // ----------------------------------------------------------
  // TYPOGRAPHIE
  // ----------------------------------------------------------
  typography: {

    // Famille
    fontFamily: {
      primary: '"Deezer Sans", "Inter", -apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
      mono:    '"SF Mono", "Fira Code", monospace',
    },

    // Styles nommés
    styles: {
      sectionTitle: { fontSize: '20px', fontWeight: '700', lineHeight: '1.2', color: '#FFFFFF' },
      screenTitle:  { fontSize: '17px', fontWeight: '600', lineHeight: '1.3', color: '#FFFFFF' },
      trackTitle:   { fontSize: '16px', fontWeight: '600', lineHeight: '1.3', color: '#FFFFFF' },
      artistName:   { fontSize: '14px', fontWeight: '400', lineHeight: '1.4', color: '#B3B3B3' },
      cardLabel:    { fontSize: '13px', fontWeight: '500', lineHeight: '1.3', color: '#FFFFFF' },
      cardSublabel: { fontSize: '11px', fontWeight: '400', lineHeight: '1.4', color: '#B3B3B3' },
      navLabel:     { fontSize: '10px', fontWeight: '400', lineHeight: '1.0', color: '#666666' },
      navLabelActive:{ fontSize: '10px', fontWeight: '400', lineHeight: '1.0', color: '#A238FF' },
      supertitle:   { fontSize: '11px', fontWeight: '500', letterSpacing: '0.06em', textTransform: 'uppercase', color: '#B3B3B3' },
      timer:        { fontSize: '12px', fontWeight: '400', color: '#B3B3B3', fontVariantNumeric: 'tabular-nums' },
      rowTitle:     { fontSize: '15px', fontWeight: '600', color: '#FFFFFF' },
      rowSubtitle:  { fontSize: '13px', fontWeight: '400', color: '#B3B3B3' },
      bioText:      { fontSize: '14px', fontWeight: '400', lineHeight: '1.6', color: '#B3B3B3' },
      badge:        { fontSize: '9px',  fontWeight: '500', letterSpacing: '0.04em' },
    },
  },

  // ----------------------------------------------------------
  // ESPACEMENTS
  // ----------------------------------------------------------
  spacing: {
    pagePaddingH:  '16px', // padding horizontal global — TOUTES les pages
    sectionGap:    '24px', // espace entre sections
    itemGap:       '12px', // espace entre items d'une même section
    cardPadding:   '12px', // padding interne des cards
    rowGap:        '2px',  // espace entre rows de liste
    iconGap:       '8px',  // espace icône <> texte
  },

  // ----------------------------------------------------------
  // DIMENSIONS FIXES
  // ----------------------------------------------------------
  sizes: {
    // Barres système
    navBarHeight:      '83px',
    miniPlayerHeight:  '64px',
    statusBarSafe:     '44px', // iOS safe area top
    bottomSafe:        '34px', // iOS safe area bottom

    // Composants
    coverCard:         '160px', // pochette grille home (approx — s'adapte à la grille)
    coverRow:          '72px',  // pochette row mix
    miniPlayerCover:   '44px',  // pochette mini player
    navIconSize:       '24px',  // icônes navbar
    actionIconSize:    '24px',  // icônes player actions (partage, +, coeur)
    controlIconSize:   '28px',  // icônes player controls (précédent, suivant)
    controlPlaySize:   '56px',  // bouton play/pause
    progressHeight:    '3px',   // barre de progression player
    progressThumb:     '12px',  // thumb scrubber
    storyBarHeight:    '2px',   // barre progression stories BTS
    avatarSize:        '40px',  // cercle avatar artiste similaire
  },

  // ----------------------------------------------------------
  // BORDER RADIUS
  // ----------------------------------------------------------
  radius: {
    card:        '8px',  // pochettes, cards carrées
    cardLarge:   '12px', // cards larges/featured
    pill:        '24px', // boutons pill (Lancer un mix, etc.)
    circle:      '50%',  // avatars, flow button
    badge:       '4px',  // badges, tags
    progressBar: '2px',  // barres de progression
    storyBar:    '1px',  // barres stories
    miniPlayer:  '0px',  // pleine largeur, pas de radius
    input:       '8px',  // champs de saisie
  },

  // ----------------------------------------------------------
  // OMBRES
  // ----------------------------------------------------------
  shadows: {
    none:   'none', // Deezer n'utilise PAS d'ombres — profondeur par fond
    subtle: '0 1px 0 rgba(255,255,255,0.04)', // séparateur très subtil si besoin
  },

  // ----------------------------------------------------------
  // Z-INDEX
  // ----------------------------------------------------------
  zIndex: {
    base:        0,
    card:        1,
    miniPlayer:  100,
    navBar:      100,
    overlay:     200,
    modal:       300,
    toast:       400,
  },

  // ----------------------------------------------------------
  // TRANSITIONS
  // ----------------------------------------------------------
  transitions: {
    fast:    '150ms ease',
    default: '250ms ease',
    slow:    '400ms ease',
    spring:  '300ms cubic-bezier(0.34, 1.56, 0.64, 1)',
  },

  // ----------------------------------------------------------
  // BREAKPOINTS (mobile-first)
  // ----------------------------------------------------------
  breakpoints: {
    mobile: '390px',  // iPhone standard
    max:    '430px',  // iPhone Pro Max
  },
};

// ----------------------------------------------------------
// CSS VARIABLES — injecter dans :root ou dans le composant App
// Copier-coller ce bloc dans globals.css
// ----------------------------------------------------------
export const cssVarsString = `
:root {
  /* Backgrounds */
  --bg-base:     ${tokens.colors.bg.base};
  --bg-card:     ${tokens.colors.bg.card};
  --bg-elevated: ${tokens.colors.bg.elevated};
  --bg-pressed:  ${tokens.colors.bg.pressed};
  --bg-player:   ${tokens.colors.bg.player};

  /* Text */
  --text-primary:   ${tokens.colors.text.primary};
  --text-secondary: ${tokens.colors.text.secondary};
  --text-tertiary:  ${tokens.colors.text.tertiary};
  --text-accent:    ${tokens.colors.text.accent};

  /* Accent */
  --accent:       ${tokens.colors.accent.purple};
  --accent-dark:  ${tokens.colors.accent.purpleDark};
  --accent-alpha: ${tokens.colors.accent.purpleAlpha};

  /* Gradients */
  --gradient-flow: ${tokens.colors.gradients.flow};

  /* Borders */
  --border-subtle:  ${tokens.colors.border.subtle};
  --border-default: ${tokens.colors.border.default};
  --border-strong:  ${tokens.colors.border.strong};
  --border-accent:  ${tokens.colors.border.accent};

  /* UI */
  --progress-bg:   ${tokens.colors.ui.progressBg};
  --progress-fill: ${tokens.colors.ui.progressFill};
  --separator:     ${tokens.colors.ui.separator};

  /* BTS */
  --bts-card-bg:      ${tokens.colors.bts.cardBg};
  --bts-card-border:  ${tokens.colors.bts.cardBorder};
  --bts-icon:         ${tokens.colors.bts.iconColor};
  --bts-overlay:      ${tokens.colors.bts.overlayBg};
  --bts-badge-bg:     ${tokens.colors.bts.badgeBg};
  --bts-story-bar:    ${tokens.colors.bts.storyBarBg};
  --bts-story-fill:   ${tokens.colors.bts.storyBarFill};
  --bts-focus-bg:     ${tokens.colors.bts.focusModeBg};

  /* Typography */
  --font-primary: ${tokens.typography.fontFamily.primary};

  /* Spacing */
  --page-h:       ${tokens.spacing.pagePaddingH};
  --section-gap:  ${tokens.spacing.sectionGap};
  --item-gap:     ${tokens.spacing.itemGap};
  --card-padding: ${tokens.spacing.cardPadding};

  /* Sizes */
  --navbar-h:       ${tokens.sizes.navBarHeight};
  --miniplayer-h:   ${tokens.sizes.miniPlayerHeight};
  --safe-top:       ${tokens.sizes.statusBarSafe};
  --safe-bottom:    ${tokens.sizes.bottomSafe};

  /* Radius */
  --r-card:      ${tokens.radius.card};
  --r-card-lg:   ${tokens.radius.cardLarge};
  --r-pill:      ${tokens.radius.pill};
  --r-badge:     ${tokens.radius.badge};
  --r-progress:  ${tokens.radius.progressBar};

  /* Transitions */
  --t-fast:    ${tokens.transitions.fast};
  --t-default: ${tokens.transitions.default};
  --t-slow:    ${tokens.transitions.slow};
  --t-spring:  ${tokens.transitions.spring};

  /* Z-index */
  --z-miniplayer: ${tokens.zIndex.miniPlayer};
  --z-overlay:    ${tokens.zIndex.overlay};
  --z-modal:      ${tokens.zIndex.modal};
}

/* Reset de base Deezer */
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
  -webkit-tap-highlight-color: transparent;
}

html, body {
  background: var(--bg-base);
  color: var(--text-primary);
  font-family: var(--font-primary);
  font-size: 16px;
  line-height: 1.5;
  overscroll-behavior: none;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* Scrollbar invisible */
::-webkit-scrollbar { display: none; }
* { scrollbar-width: none; }

/* Safe areas iOS */
.app-wrapper {
  max-width: 430px;
  margin: 0 auto;
  min-height: 100dvh;
  padding-top: env(safe-area-inset-top, var(--safe-top));
  padding-bottom: calc(env(safe-area-inset-bottom, var(--safe-bottom)) + var(--navbar-h) + var(--miniplayer-h));
  position: relative;
  overflow-x: hidden;
}

/* Page padding horizontal */
.page-content {
  padding: 0 var(--page-h);
}
`;

export default tokens;
