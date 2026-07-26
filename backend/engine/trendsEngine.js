/**
 * Signal d'intention collective fondé sur les pages vues Wikipédia.
 * Les articles sont des proxys éditables, jamais des données personnelles.
 */

import {
  DEFAULT_SECTOR,
  getSectorLabel,
  getSectorRationale,
  isSectorWeatherSensitive,
  SECTOR_MATCH_THRESHOLD,
  SECTORS,
  STRONG_KEYWORD_WEIGHT,
  WEAK_KEYWORD_WEIGHT,
} from './sectorMapping.js';
import { normalizeText } from './weatherConsistency.js';

// Conservé pour les intégrations qui utilisaient l'ancien mapping générique.
export const INTENT_ARTICLE_MAP = DEFAULT_SECTOR.articlesByDimension;

const WIKIMEDIA_ENDPOINT = 'https://wikimedia.org/api/rest_v1/metrics/pageviews/per-article/fr.wikipedia/all-access/user';
const USER_AGENT = 'BarometreData/1.0 (projet academique M2; contact@exemple.fr)';
const WINDOW_DAYS = 90;
const RECENT_DAYS = 7;
const REQUEST_TIMEOUT_MS = 10_000;
const MAX_CONCURRENT_REQUESTS = 5;
const MAX_CUSTOM_ARTICLES = 12;
const loggedMissingArticles = new Set();

function includesNormalizedKeyword(text, keyword) {
  const normalizedKeyword = normalizeText(keyword).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(^|[^a-z0-9])${normalizedKeyword}(?=$|[^a-z0-9])`).test(text);
}

/**
 * Détection sectorielle pondérée par spécificité.
 *
 * Un mot générique ("logiciel", "service", "jeu") ne pèse que 1 et ne suffit
 * donc plus à retenir un secteur : il faut soit un mot-clé spécifique, soit au
 * moins deux mots génériques. Cela corrige le classement d'un « logiciel de
 * comptabilité » en High-tech sur le seul mot « logiciel ».
 */
export function detectSector(brief = {}) {
  const text = normalizeText(`${brief.product ?? ''} ${brief.message ?? ''}`);
  let bestMatch = null;
  let bestScore = 0;
  let matchedKeywords = [];

  for (const [sectorKey, sector] of Object.entries(SECTORS)) {
    const strong = (sector.strongKeywords ?? []).filter((keyword) => includesNormalizedKeyword(text, keyword));
    const weak = (sector.weakKeywords ?? []).filter((keyword) => includesNormalizedKeyword(text, keyword));
    const score = strong.length * STRONG_KEYWORD_WEIGHT + weak.length * WEAK_KEYWORD_WEIGHT;

    if (score > bestScore) {
      bestScore = score;
      bestMatch = sectorKey;
      matchedKeywords = [...strong, ...weak];
    }
  }

  // En dessous du seuil, on assume l'incertitude plutôt que de forcer un secteur.
  if (bestScore < SECTOR_MATCH_THRESHOLD) {
    return { sector: 'defaut', matchedKeywords: [], matchScore: bestScore, confidence: 'low' };
  }

  return {
    sector: bestMatch,
    matchedKeywords,
    matchScore: bestScore,
    confidence: bestScore >= 4 ? 'high' : 'medium',
  };
}

function normalizeCustomArticles(customArticles) {
  if (!Array.isArray(customArticles)) return [];
  return [...new Set(customArticles
    .filter((article) => typeof article === 'string')
    .map((article) => article.trim())
    .filter(Boolean))].slice(0, MAX_CUSTOM_ARTICLES);
}

function articleLabel(article) {
  return article.replaceAll('_', ' ');
}

export function getTrendsCacheKey(brief = {}) {
  const customArticles = normalizeCustomArticles(brief.customArticles);
  if (customArticles.length) {
    return `personnalise:${customArticles.map((article) => normalizeText(article)).sort().join('|')}`;
  }
  return detectSector(brief).sector;
}

function toApiDate(date) {
  return date.toISOString().slice(0, 10).replaceAll('-', '');
}

function toIsoDate(date) {
  return date.toISOString().slice(0, 10);
}

function getDateRange() {
  const dataThrough = new Date();
  dataThrough.setUTCHours(0, 0, 0, 0);
  dataThrough.setUTCDate(dataThrough.getUTCDate() - 2);

  const start = new Date(dataThrough);
  start.setUTCDate(start.getUTCDate() - (WINDOW_DAYS - 1));

  const dates = Array.from({ length: WINDOW_DAYS }, (_, index) => {
    const date = new Date(start);
    date.setUTCDate(start.getUTCDate() + index);
    return toIsoDate(date);
  });

  return {
    start: toApiDate(start),
    end: toApiDate(dataThrough),
    dataThrough: toIsoDate(dataThrough),
    dates,
  };
}

function average(values) {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function describeTrend(momentum) {
  if (momentum > 1.1) return 'up';
  if (momentum < 0.9) return 'down';
  return 'stable';
}

/**
 * Convertit un momentum (7 j / 90 j) en indice de PROGRESSION RELATIVE 0-100.
 * Attention : ce n'est pas un niveau d'attention absolu — un article stable
 * ressort à 40. C'est pour cela que le classement des axes s'appuie désormais
 * sur attentionIndex (volume + progression) et non sur cette seule valeur.
 */
function valueFromMomentum(momentum) {
  return clamp(Math.round((momentum - 0.6) * 100), 5, 95);
}

/**
 * Indice d'attention : 60 % de volume réel de pages vues, 40 % de progression.
 * Corrige le classement trompeur où un axe à 201 vues passait devant un axe à
 * 1 122 vues au seul motif qu'il progressait davantage contre sa propre moyenne.
 */
function withAttentionIndex(axes) {
  const totalViews = axes.reduce((sum, axis) => sum + (axis.recentViews ?? 0), 0);
  const maxShare = axes.reduce((max, axis) => Math.max(max, totalViews > 0 ? (axis.recentViews ?? 0) / totalViews : 0), 0);

  return axes.map((axis) => {
    const share = totalViews > 0 ? (axis.recentViews ?? 0) / totalViews : 0;
    const volumeNorm = maxShare > 0 ? share / maxShare : 0;
    const momentumNorm = clamp((axis.value ?? 0) / 95, 0, 1);
    return {
      ...axis,
      viewsShare: Math.round(share * 1000) / 10,
      attentionIndex: Math.round(100 * (0.6 * volumeNorm + 0.4 * momentumNorm)),
    };
  });
}

function keywordFromSeasonalValue(keyword, value, trend) {
  return {
    keyword,
    value,
    trend,
    momentum: Number((0.6 + value / 100).toFixed(2)),
  };
}

function seasonalKeywords() {
  const month = new Date().getMonth();
  const isWinter = month === 11 || month <= 1;
  const isSummer = month >= 4 && month <= 7;

  if (isWinter) {
    return [
      keywordFromSeasonalValue('cocooning', 80, 'up'),
      keywordFromSeasonalValue('bien-être', 72, 'up'),
      keywordFromSeasonalValue('sortie', 30, 'down'),
      keywordFromSeasonalValue('activité extérieure', 25, 'down'),
      keywordFromSeasonalValue('loisirs créatifs', 65, 'up'),
    ];
  }

  if (isSummer) {
    return [
      keywordFromSeasonalValue('sortie', 85, 'up'),
      keywordFromSeasonalValue('activité extérieure', 78, 'up'),
      keywordFromSeasonalValue('cocooning', 28, 'down'),
      keywordFromSeasonalValue('bien-être', 60, 'up'),
      keywordFromSeasonalValue('loisirs créatifs', 55, 'stable'),
    ];
  }

  return Object.keys(INTENT_ARTICLE_MAP).map((keyword) => keywordFromSeasonalValue(keyword, 50, 'stable'));
}

/** Axe dominant = plus fort indice d'attention (volume + progression). */
function dominantKeyword(keywords) {
  if (!keywords.length) return null;
  return keywords.reduce((max, keyword) => (
    (keyword.attentionIndex ?? keyword.value) > (max.attentionIndex ?? max.value) ? keyword : max
  )).keyword;
}

function seasonalEstimate(
  reason,
  sectorInfo = { sector: 'defaut', matchedKeywords: [], confidence: 'low' },
  { customMode = false, customArticleCount = 0 } = {},
) {
  // Valeurs issues du seul calendrier : aucune donnée de pages vues n'est
  // mesurée ici. Le libellé de source le dit explicitement, et le sous-score
  // d'intention est marqué non mesurable en aval.
  const keywords = seasonalKeywords().map((k) => ({ ...k, attentionIndex: k.value, estimated: true }));
  return {
    status: 'seasonal_estimate',
    source: 'Modèle saisonnier (calendrier uniquement — aucune page vue mesurée)',
    keywords,
    dominant: dominantKeyword(keywords),
    confidence: 'low',
    fetchedAt: new Date().toISOString(),
    dataThrough: null,
    reason,
    detectedSector: sectorInfo.sector,
    sectorLabel: getSectorLabel(sectorInfo.sector),
    sectorConfidence: sectorInfo.confidence,
    sectorRationale: getSectorRationale(sectorInfo.sector),
    weatherSensitive: customMode ? true : isSectorWeatherSensitive(sectorInfo.sector),
    matchedKeywords: sectorInfo.matchedKeywords,
    customMode,
    customArticleCount,
  };
}

export function unavailableTrends(reason) {
  return {
    status: 'unavailable',
    source: null,
    keywords: [],
    dominant: null,
    confidence: 'low',
    fetchedAt: new Date().toISOString(),
    dataThrough: null,
    reason,
    detectedSector: 'defaut',
    sectorLabel: DEFAULT_SECTOR.label,
    sectorConfidence: 'low',
    sectorRationale: DEFAULT_SECTOR.rationale,
    weatherSensitive: true,
    matchedKeywords: [],
    customMode: false,
    customArticleCount: 0,
  };
}

async function fetchArticlePageviews(article, range) {
  const encodedArticle = encodeURIComponent(article.replaceAll(' ', '_'));
  const url = `${WIKIMEDIA_ENDPOINT}/${encodedArticle}/daily/${range.start}/${range.end}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': USER_AGENT,
        Accept: 'application/json',
      },
      signal: controller.signal,
    });

    if (response.status === 404) {
      if (!loggedMissingArticles.has(article)) {
        loggedMissingArticles.add(article);
        console.warn(`[trendsEngine] Article Wikipédia introuvable : ${article}`);
      }
      return { article, url, missing: true, viewsByDay: new Map() };
    }

    if (!response.ok) {
      throw new Error(`Wikimedia HTTP ${response.status} pour ${article}`);
    }

    const payload = await response.json();
    const viewsByDay = new Map(
      (payload.items ?? []).map((item) => [
        `${item.timestamp}`.slice(0, 4) + '-' + `${item.timestamp}`.slice(4, 6) + '-' + `${item.timestamp}`.slice(6, 8),
        Number(item.views) || 0,
      ]),
    );

    return { article, url, missing: false, viewsByDay };
  } finally {
    clearTimeout(timeout);
  }
}

async function mapWithConcurrency(items, worker, limit = MAX_CONCURRENT_REQUESTS) {
  const results = new Array(items.length);
  let nextIndex = 0;

  async function run() {
    while (nextIndex < items.length) {
      const index = nextIndex;
      nextIndex += 1;
      try {
        results[index] = await worker(items[index]);
      } catch (error) {
        results[index] = { keyword: items[index].keyword, article: items[index].article, error };
      }
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, run));
  return results;
}

function calculateAxis(keyword, articleResults, dates) {
  const usableArticles = articleResults.filter((result) => !result.error && !result.missing && result.viewsByDay.size > 0);
  if (!usableArticles.length) return null;

  const dailyViews = dates.map((date) => usableArticles.reduce(
    (sum, article) => sum + (article.viewsByDay.get(date) ?? 0),
    0,
  ));
  const baseline = average(dailyViews);
  if (baseline <= 0) return null;

  const recent = average(dailyViews.slice(-RECENT_DAYS));
  const momentum = recent / baseline;
  const rawSeries = dates.map((date, index) => ({ date, views: dailyViews[index] }));
  const recentViews = dailyViews.slice(-RECENT_DAYS).reduce((sum, views) => sum + views, 0);

  return {
    keyword,
    value: valueFromMomentum(momentum),
    trend: describeTrend(momentum),
    momentum: Number(momentum.toFixed(3)),
    recentViews,
    rawSeries,
    sourceUrls: usableArticles.map((article) => article.url),
  };
}

function latestObservedDate(articleResults, fallbackDate) {
  const dates = articleResults.flatMap((result) => (
    result.viewsByDay instanceof Map ? [...result.viewsByDay.keys()] : []
  ));
  return dates.sort().at(-1) ?? fallbackDate;
}

/**
 * Retourne le contrat unique du signal collectif, quel que soit son état.
 * Le paramètre geo est gardé pour compatibilité d'appel avec l'ancien moteur.
 */
export async function getTrends(_geo = 'FR', _weather = null, brief = null) {
  const sectorInfo = brief ? detectSector(brief) : { sector: 'defaut', matchedKeywords: [], confidence: 'low' };
  const customArticles = normalizeCustomArticles(brief?.customArticles);
  const customMode = customArticles.length > 0;
  const articleSet = customMode
    ? Object.fromEntries(customArticles.map((article) => [articleLabel(article), [article]]))
    : SECTORS[sectorInfo.sector]?.articlesByDimension ?? DEFAULT_SECTOR.articlesByDimension;
  const expectedAxes = Object.keys(articleSet).length;
  const range = getDateRange();
  const requests = Object.entries(articleSet).flatMap(([keyword, articles]) => (
    articles.map((article) => ({ keyword, article }))
  ));

  try {
    const articleResults = await mapWithConcurrency(
      requests,
      async ({ keyword, article }) => ({
        keyword,
        ...(await fetchArticlePageviews(article, range)),
      }),
    );

    const dataThrough = latestObservedDate(articleResults, range.dataThrough);
    const observedDates = range.dates.filter((date) => date <= dataThrough);
    const rawAxes = Object.keys(articleSet).map((keyword) => {
      const results = articleResults.filter((result) => result.keyword === keyword);
      return calculateAxis(keyword, results, observedDates);
    }).filter(Boolean);
    const axes = withAttentionIndex(rawAxes);

    const requestErrors = articleResults.filter((result) => result.error);
    requestErrors.forEach((result) => {
      console.warn(`[trendsEngine] Pageviews indisponible pour ${result.article} : ${result.error.message}`);
    });

    // Certains secteurs déclarent moins de 5 axes (les dimensions sans proxy
    // défendable ont été retirées) : le seuil s'adapte au secteur.
    const minimumLiveAxes = customMode ? 1 : Math.min(3, expectedAxes);
    if (axes.length < minimumLiveAxes) {
      return seasonalEstimate(
        `Données Wikimedia insuffisantes (${axes.length}/${expectedAxes} ${customMode ? 'articles' : 'axes'} disponibles). Estimation saisonnière utilisée.`,
        sectorInfo,
        { customMode, customArticleCount: customArticles.length },
      );
    }

    return {
      status: 'live',
      source: 'Wikipédia (Wikimedia Pageviews)',
      keywords: axes,
      dominant: dominantKeyword(axes),
      momentumLeader: [...axes].sort((a, b) => (b.value ?? 0) - (a.value ?? 0))[0]?.keyword ?? null,
      expectedAxes,
      confidence: axes.length === expectedAxes ? 'high' : 'medium',
      fetchedAt: new Date().toISOString(),
      dataThrough,
      reason: axes.length === expectedAxes
        ? null
        : `Données Wikipédia disponibles pour ${axes.length} ${customMode ? 'articles' : 'axes'} sur ${expectedAxes}.`,
      detectedSector: sectorInfo.sector,
      sectorLabel: getSectorLabel(sectorInfo.sector),
      sectorConfidence: sectorInfo.confidence,
      sectorRationale: getSectorRationale(sectorInfo.sector),
      weatherSensitive: customMode ? true : isSectorWeatherSensitive(sectorInfo.sector),
      matchedKeywords: sectorInfo.matchedKeywords,
      customMode,
      customArticleCount: customArticles.length,
    };
  } catch (error) {
    console.error('[trendsEngine] Échec Wikimedia Pageviews :', error.message);
    return seasonalEstimate(
      'Wikimedia Pageviews est temporairement indisponible. Estimation saisonnière utilisée.',
      sectorInfo,
      { customMode, customArticleCount: customArticles.length },
    );
  }
}

// Alias conservé pour les appels existants du backend et les intégrations locales.
export const getTrendsWithStatus = getTrends;
