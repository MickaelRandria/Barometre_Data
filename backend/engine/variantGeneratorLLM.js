/**
 * Génération de variantes assistée par Ministral — couche strictement optionnelle.
 *
 * Le résultat déterministe de `generateVariants` est calculé EN PREMIER et sert
 * de référence : Ministral ne peut que remplacer la formulation d'une variante,
 * jamais décider du contexte, du ton, ni de la recommandation. Chaque variante
 * proposée est re-vérifiée contre la météo réelle avant d'être acceptée, et le
 * repli est granulaire — une variante fautive ne fait pas tomber l'autre.
 */

import { generateVariants, getMaxLength, truncate } from './variantGenerator.js';
import { detectMessageWeatherContradictions, detectSeasonalProductMismatch } from './weatherConsistency.js';
import { MISTRAL_MODEL, callMistralJSON } from './mistralClient.js';

/** Variantes dont la formulation peut être déléguée au modèle. */
const LLM_VARIANT_IDS = ['contextualized', 'agentic'];

/** Sévérités qui disqualifient une formulation : identiques au reste du moteur. */
const BLOCKING_SEVERITIES = ['critical', 'high'];

const SYSTEM_PROMPT = [
  'Tu es un rédacteur marketing francophone. Tu ne décides de rien : le contexte, le ton et la',
  'recommandation te sont fournis, déjà calculés. Ta seule tâche est de formuler des messages.',
  '',
  'Interdictions absolues :',
  '- Ne jamais évoquer une saison, une météo, une température ou une activité qui contredirait le contexte fourni.',
  '- Ne jamais inventer de chiffre, de pourcentage, de date limite, de durée, de stock ou de code promo.',
  '- Ne jamais dépasser la longueur maximale indiquée, ponctuation comprise.',
  '- Ne jamais reformuler, traduire, abréger ni corriger le nom du produit : le reprendre à l’identique.',
  '- Ne jamais ajouter de champ, de commentaire ou de texte hors du JSON demandé.',
  '',
  'Tu réponds uniquement par un objet JSON de la forme :',
  '{"variants":[{"id":"contextualized","message":"..."},{"id":"agentic","message":"..."}]}',
].join('\n');

function toneFor(context, brief, recommendation) {
  return recommendation?.toneSuggestions?.[0]
    ?? context?.contextType?.toneMatch?.[0]
    ?? brief?.tone
    ?? 'sobre';
}

/**
 * N'expose au modèle que des faits déjà établis par le pipeline déterministe.
 * Aucun signal brut, aucune décision à prendre.
 */
function buildUserPrompt({ context, product, channel, maxLength, tone, mismatch }) {
  const lines = [
    `Produit (à reprendre à l’identique) : « ${product} »`,
    `Contexte détecté : ${context?.contextType?.label ?? 'non déterminé'}`,
    `Indice contextuel : ${context?.effectiveIndex ?? 'non calculé'} (de -1 repli à +1 sortie)`,
    `Ton recommandé : ${tone}`,
    `Canal : ${channel} — longueur maximale : ${maxLength} caractères`,
  ];

  if (mismatch.hasCriticalMismatch) {
    lines.push(
      `Incohérence critique détectée : ${mismatch.summary}`,
      'Consigne : la variante « contextualized » retire toute affirmation incompatible avec le contexte réel ;',
      'la variante « agentic » recommande explicitement de reporter cette prise de parole.',
    );
  } else {
    lines.push(
      'Aucune incohérence critique détectée.',
      'Consigne : la variante « contextualized » adapte sobrement le message au contexte ;',
      'la variante « agentic » propose une formulation plus engageante, dans le même ton.',
    );
  }

  lines.push('', 'Rédige les deux variantes en français.');
  return lines.join('\n');
}

/** Reprend exactement la logique de seuil du générateur déterministe. */
function describeMismatch(context, brief, product) {
  const productMismatch = detectSeasonalProductMismatch(product, context, brief?.message);
  const messageContradictions = detectMessageWeatherContradictions(brief?.message, context?.weather);
  const blocking = [
    ...(productMismatch && BLOCKING_SEVERITIES.includes(productMismatch.severity) ? [productMismatch.type] : []),
    ...messageContradictions.filter((c) => BLOCKING_SEVERITIES.includes(c.severity)).map((c) => c.type),
  ];

  return {
    hasCriticalMismatch: blocking.length > 0,
    summary: blocking.length ? blocking.join(', ') : 'aucune',
  };
}

/**
 * Un chiffre absent du brief est un chiffre inventé. Le moteur refuse déjà
 * toute projection chiffrée ailleurs : on applique la même règle ici plutôt que
 * de faire confiance au seul prompt système.
 */
function introducesInventedFigures(message, brief) {
  const proposed = String(message).match(/\d+(?:[.,]\d+)?\s*%?/g) ?? [];
  if (!proposed.length) return false;

  const briefText = `${brief?.product ?? ''} ${brief?.message ?? ''}`;
  const allowed = new Set((briefText.match(/\d+(?:[.,]\d+)?/g) ?? []).map((n) => n.replace(',', '.')));
  return proposed.some((token) => {
    if (token.includes('%')) return true;
    return !allowed.has(token.trim().replace(',', '.'));
  });
}

/**
 * Valide une formulation proposée par le modèle contre la météo réelle.
 * La vérification porte sur le texte tel qu'il sera diffusé (après troncature),
 * puisque c'est lui, et pas le brouillon du modèle, qui part en campagne.
 */
function acceptCandidate(rawMessage, { context, brief, product, maxLength }) {
  if (typeof rawMessage !== 'string') return { ok: false, reason: 'message absent ou non textuel' };

  const cleaned = rawMessage.replace(/\s+/g, ' ').trim();
  if (cleaned.length < 15) return { ok: false, reason: 'message trop court pour être exploitable' };

  // Même traitement que les gabarits déterministes : la troncature est une
  // issue acceptée, pas un motif de rejet.
  const message = truncate(cleaned, maxLength);

  const contradictions = detectMessageWeatherContradictions(message, context?.weather);
  const blocking = contradictions.filter((c) => BLOCKING_SEVERITIES.includes(c.severity));
  if (blocking.length) {
    return { ok: false, reason: `contradiction météo (${blocking.map((c) => c.type).join(', ')})` };
  }

  const productMismatch = detectSeasonalProductMismatch(product, context, message);
  if (productMismatch && BLOCKING_SEVERITIES.includes(productMismatch.severity)) {
    return { ok: false, reason: `incohérence produit/saison (${productMismatch.type})` };
  }

  if (introducesInventedFigures(message, brief)) {
    return { ok: false, reason: 'chiffre ou pourcentage absent du brief' };
  }

  return { ok: true, message };
}

function indexCandidates(data) {
  const list = Array.isArray(data?.variants) ? data.variants : [];
  const byId = new Map();
  for (const entry of list) {
    const id = String(entry?.id ?? '').trim();
    if (LLM_VARIANT_IDS.includes(id) && !byId.has(id)) byId.set(id, entry?.message);
  }
  return byId;
}

/**
 * Même forme de retour que `generateVariants()`, enrichie de :
 *  - `source` sur chaque variante : 'mistral' ou 'template' ;
 *  - `mistral: { used, reason }` à la racine.
 *
 * Ne lève jamais, même sans clé API.
 */
export async function generateVariantsWithLLM(context, brief, scores, recommendation) {
  const deterministic = generateVariants(context, brief, scores, recommendation);
  const baseline = {
    ...deterministic,
    variants: deterministic.variants.map((variant) => ({ ...variant, source: 'template' })),
    mistral: { used: false, reason: null },
  };

  try {
    const product = String(brief?.product || 'notre sélection').replace(/\s+/g, ' ').trim();
    const channel = brief?.channel || 'email';
    const maxLength = getMaxLength(channel);
    const tone = toneFor(context, brief, recommendation);
    const mismatch = describeMismatch(context, brief, product);

    const result = await callMistralJSON({
      model: MISTRAL_MODEL,
      system: SYSTEM_PROMPT,
      user: buildUserPrompt({ context, product, channel, maxLength, tone, mismatch }),
      temperature: 0.4,
      maxTokens: 500,
    });

    if (!result.ok) {
      return { ...baseline, mistral: { used: false, reason: result.reason } };
    }

    const candidates = indexCandidates(result.data);
    const rejections = [];

    const variants = baseline.variants.map((variant) => {
      if (!LLM_VARIANT_IDS.includes(variant.id)) return variant;

      if (!candidates.has(variant.id)) {
        rejections.push(`${variant.id} : variante absente de la réponse`);
        return variant;
      }

      const verdict = acceptCandidate(candidates.get(variant.id), { context, brief, product, maxLength });
      if (!verdict.ok) {
        rejections.push(`${variant.id} : ${verdict.reason}`);
        return variant;
      }

      return { ...variant, message: verdict.message, source: 'mistral' };
    });

    const acceptedCount = variants.filter((variant) => variant.source === 'mistral').length;

    return {
      ...baseline,
      variants,
      mistral: {
        used: acceptedCount > 0,
        reason: rejections.length ? `Repli sur gabarit — ${rejections.join(' ; ')}` : null,
      },
    };
  } catch (error) {
    return {
      ...baseline,
      mistral: { used: false, reason: `Couche Ministral ignorée : ${error?.message ?? 'erreur inconnue'}` },
    };
  }
}
