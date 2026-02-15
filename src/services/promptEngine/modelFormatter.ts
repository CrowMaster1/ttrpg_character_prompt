/**
 * Phase 4: Model-Specific Formatting
 * Converts universal prompt segments into model-optimized output.
 * Each model has its own syntax requirements and optimization strategies.
 */

import type { Model } from '../../types';
import type { PromptSegment } from './types';
import { PriorityTier } from './types';
import { cleanupPrompt, cleanTagPrompt } from '../promptCleaner';
import { enforceTokenBudget, createSegment, estimateTokens } from './tokenBudget';

/**
 * Get CHA enhancement text per model and level.
 * Fixes the double-dipping issue identified by ImageGenExpert:
 * CHA=4 now gets a lighter enhancement than CHA=5.
 */
function getChaEnhancement(level: number, model: Model): string {
  const enhancements: Record<string, Record<number, string>> = {
    'FLUX': {
      5: ', stunningly beautiful with radiant features and gorgeous appearance',
      4: ', with attractive well-proportioned features',
      3: '',
      2: ', with plain unremarkable features',
      1: ', with grotesque repulsive features',
    },
    'Pony': {
      5: ', beautiful, gorgeous, stunning',
      4: ', attractive, pretty',
      3: '',
      2: ', plain',
      1: ', ugly, grotesque',
    },
    'SDXL': {
      5: ', (beautiful:1.1), (gorgeous:1.08)',
      4: ', (attractive:1.08)',
      3: '',
      2: ', plain appearance',
      1: ', ugly, grotesque features',
    },
    'SD1.5': {
      5: ', beautiful, gorgeous, stunning',
      4: ', attractive',
      3: '',
      2: ', plain',
      1: ', ugly',
    },
    'Illustrious': {
      5: ', {beautiful}, gorgeous, stunning',
      4: ', {attractive}',
      3: '',
      2: ', plain',
      1: ', ugly',
    },
    'Juggernaut': {
      5: ', (beautiful:1.1), (gorgeous:1.08)',
      4: ', (attractive:1.08)',
      3: '',
      2: ', plain appearance',
      1: ', ugly, grotesque features',
    },
  };

  return enhancements[model]?.[level] || '';
}

/**
 * Detect character meta tags for Danbooru-based models (Pony, Illustrious)
 */
function getCharacterMeta(gender: string | null): string {
  if (!gender) return '1other, solo';
  const g = gender.toLowerCase();
  if (g.includes('female') || g.includes('woman') || g.includes('girl')) {
    return '1girl, solo';
  } else if (g.includes('male') || g.includes('man') || g.includes('boy')) {
    return '1boy, solo';
  }
  return '1other, solo';
}

/**
 * Convert text to Danbooru/booru-style tags.
 * Fixes Bug 3 from ImageGenExpert: strips orphaned prepositions.
 */
function convertToBooru(text: string): string {
  let result = text.toLowerCase();

  // Remove ALL articles, prepositions, AND verbs that waste tokens
  result = result.replace(
    /\b(a|an|the|is|are|and|with|has|in|on|from|wearing|clad|of|for|to|by)\b/g,
    ''
  );

  // Clean up doubled spaces, orphaned commas
  result = result.replace(/\s{2,}/g, ' ');
  result = result.replace(/,\s*,/g, ',');
  result = result.replace(/^\s*,\s*/, '');
  result = result.replace(/,\s*$/, '');

  return result.trim();
}

/**
 * Build a FLUX-style natural language prompt from segments.
 */
function buildFluxPrompt(
  segments: PromptSegment[],
  chaLevel: number,
  isPortrait: boolean
): string {
  const parts: string[] = [];

  for (const seg of segments) {
    if (seg.text.length === 0) continue;
    parts.push(seg.text);
  }

  let sentence = parts.join(', ');

  // CHA enhancement
  sentence += getChaEnhancement(chaLevel, 'FLUX');

  // Portrait enhancement
  if (isPortrait) {
    sentence += ', face focus, detailed facial features, portrait composition';
  }

  // Quality suffix
  sentence += ', highly detailed fantasy illustration';

  return cleanupPrompt(sentence);
}

/**
 * Build a Pony-style tag prompt from segments.
 */
function buildPonyPrompt(
  segments: PromptSegment[],
  gender: string | null,
  chaLevel: number,
  isPortrait: boolean
): string {
  const tags: string[] = [];

  // Quality tags FIRST (highest priority in Pony's order-based system)
  tags.push('score_9', 'score_8_up', 'score_7_up');

  // Character meta tags
  tags.push(getCharacterMeta(gender));

  // Character description converted to booru tags
  for (const seg of segments) {
    if (seg.text.length === 0) continue;
    tags.push(convertToBooru(seg.text));
  }

  // CHA enhancement
  const chaEnh = getChaEnhancement(chaLevel, 'Pony');
  if (chaEnh) tags.push(chaEnh.replace(/^,\s*/, ''));

  // Portrait enhancement
  if (isPortrait) {
    tags.push('face_focus', 'detailed_face', 'portrait');
  }

  return cleanTagPrompt(tags.join(', '));
}

/**
 * Build an SDXL/Juggernaut-style weighted keyword prompt from segments.
 */
function buildSDXLPrompt(
  segments: PromptSegment[],
  chaLevel: number,
  isPortrait: boolean,
  model: Model
): string {
  const parts: string[] = [];

  // Quality with subtle emphasis
  parts.push('(masterpiece:1.08), (best quality:1.08)');

  // Content segments
  for (const seg of segments) {
    if (seg.text.length === 0) continue;
    // Apply emphasis to facial traits only
    if (seg.category === 'features' || seg.category === 'expression') {
      const hasFacial = /eyes|face|nose|lips|jaw|cheek|expression/i.test(seg.text);
      if (hasFacial) {
        parts.push(`(${seg.text}:1.08)`);
      } else {
        parts.push(seg.text);
      }
    } else {
      parts.push(seg.text);
    }
  }

  // CHA enhancement
  const chaEnh = getChaEnhancement(chaLevel, model);
  if (chaEnh) parts.push(chaEnh.replace(/^,\s*/, ''));

  // Portrait enhancement
  if (isPortrait) {
    parts.push('(face focus:1.1), (detailed facial features:1.08), portrait composition');
  }

  // Quality suffix
  parts.push('highly detailed');

  return cleanupPrompt(parts.join(', '));
}

/**
 * Build an SD1.5-style simple keyword prompt from segments.
 */
function buildSD15Prompt(
  segments: PromptSegment[],
  chaLevel: number,
  isPortrait: boolean
): string {
  const tags = ['masterpiece', 'best quality'];

  for (const seg of segments) {
    if (seg.text.length === 0) continue;
    tags.push(seg.text);
  }

  // CHA enhancement
  const chaEnh = getChaEnhancement(chaLevel, 'SD1.5');
  if (chaEnh) tags.push(chaEnh.replace(/^,\s*/, ''));

  // Portrait enhancement
  if (isPortrait) {
    tags.push('face focus', 'detailed facial features', 'portrait');
  }

  tags.push('highly detailed');

  return cleanTagPrompt(tags.join(', '));
}

/**
 * Build an Illustrious-style curly-brace emphasis prompt from segments.
 */
function buildIllustriousPrompt(
  segments: PromptSegment[],
  gender: string | null,
  chaLevel: number,
  isPortrait: boolean
): string {
  const tags: string[] = [];

  // Core quality with selective emphasis
  tags.push('{masterpiece}', 'best quality', 'very aesthetic');

  // Character meta tags
  tags.push(getCharacterMeta(gender));

  // Content segments with selective emphasis on facial features
  for (const seg of segments) {
    if (seg.text.length === 0) continue;
    if (seg.category === 'features' || seg.category === 'expression') {
      const isFacial = /eyes|face|hair|expression|nose|lips|jaw/i.test(seg.text);
      if (isFacial) {
        tags.push(`{${seg.text}}`);
      } else {
        tags.push(seg.text);
      }
    } else {
      tags.push(convertToBooru(seg.text));
    }
  }

  // CHA enhancement
  const chaEnh = getChaEnhancement(chaLevel, 'Illustrious');
  if (chaEnh) tags.push(chaEnh.replace(/^,\s*/, ''));

  // Portrait enhancement
  if (isPortrait) {
    tags.push('{face_focus}', '{detailed_face}', 'portrait');
  }

  // Metadata suffix
  tags.push('newest', 'ai-generated');

  return cleanTagPrompt(tags.join(', '));
}

/**
 * Format prompt segments for a specific model.
 * This is the main entry point for Phase 4.
 */
export function formatForModel(
  segments: PromptSegment[],
  model: Model,
  gender: string | null,
  chaLevel: number,
  isPortrait: boolean
): string {
  // Enforce token budget first
  const budgetedSegments = enforceTokenBudget(segments, model);

  switch (model) {
    case 'FLUX':
      return buildFluxPrompt(budgetedSegments, chaLevel, isPortrait);

    case 'Pony':
      return buildPonyPrompt(budgetedSegments, gender, chaLevel, isPortrait);

    case 'SDXL':
    case 'Juggernaut':
      return buildSDXLPrompt(budgetedSegments, chaLevel, isPortrait, model);

    case 'SD1.5':
      return buildSD15Prompt(budgetedSegments, chaLevel, isPortrait);

    case 'Illustrious':
      return buildIllustriousPrompt(budgetedSegments, gender, chaLevel, isPortrait);

    default:
      // Fallback: simple comma join
      return cleanupPrompt(
        budgetedSegments
          .filter(s => s.text.length > 0)
          .map(s => s.text)
          .join(', ')
      );
  }
}
