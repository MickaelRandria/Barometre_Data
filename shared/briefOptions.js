/**
 * Valeurs autorisées des champs structurés du brief — source unique.
 *
 * Le formulaire (App.jsx) et l'extraction Ministral (briefParser.js) lisent
 * cette liste. Sans elle, un identifiant inventé par le modèle
 * (« social-media » au lieu de « paid-social », « fidelisation » qui n'existe
 * pas) laisserait le <select> sans option correspondante et enverrait au
 * moteur de scoring une valeur qu'il ne sait pas interpréter.
 */

export const TONES = Object.freeze([
  'chaleureux', 'dynamique', 'urgent', 'inspirationnel', 'rassurant', 'promotionnel', 'sobre',
]);

export const AUDIENCES = Object.freeze([
  { id: 'clients-actifs', label: 'Clients actifs' },
  { id: 'clients-inactifs', label: 'Clients inactifs' },
  { id: 'paniers-abandonnes', label: 'Paniers abandonnés' },
  { id: 'top-clients', label: 'Top clients (VIP)' },
  { id: 'prospects', label: 'Prospects' },
  { id: 'clients-chauds', label: 'Clients chauds' },
]);

export const CHANNELS = Object.freeze([
  { id: 'email', label: 'Email' },
  { id: 'sms', label: 'SMS' },
  { id: 'push', label: 'Push notification' },
  { id: 'paid-social', label: 'Social Ads' },
  { id: 'homepage', label: 'Homepage' },
]);

export const OBJECTIVES = Object.freeze([
  { id: 'conversion', label: 'Conversion' },
  { id: 'engagement', label: 'Engagement' },
  { id: 'trafic', label: 'Trafic' },
  { id: 'notoriete', label: 'Notoriété' },
]);

export const PRESSURES = Object.freeze([
  { id: 'faible', label: 'Faible' },
  { id: 'moyen', label: 'Modérée' },
  { id: 'fort', label: 'Forte' },
]);

const ids = (options) => Object.freeze(options.map((option) => option.id));

/** Identifiants seuls, pour valider une valeur proposée par le modèle. */
export const BRIEF_ENUMS = Object.freeze({
  tone: TONES,
  audience: ids(AUDIENCES),
  channel: ids(CHANNELS),
  objective: ids(OBJECTIVES),
  pressure: ids(PRESSURES),
});

/**
 * Valeurs de repli, alignées sur DEFAULT_BRIEF. Utilisées quand le modèle
 * propose un identifiant hors liste : on retombe sur un défaut défendable
 * plutôt que de laisser un champ vide.
 */
export const BRIEF_FALLBACKS = Object.freeze({
  tone: 'chaleureux',
  audience: 'clients-actifs',
  channel: 'email',
  objective: 'engagement',
  pressure: 'moyen',
});
