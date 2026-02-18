/**
 * Phase 4: Model-Specific Formatting
 * Converts universal prompt segments into model-optimized output.
 * Each model has its own syntax requirements and optimization strategies.
 */

import type { Model } from '../../types';
import type { PromptSegment } from './types';
import { cleanupPrompt, cleanTagPrompt } from '../promptCleaner';
import { enforceTokenBudget } from './tokenBudget';

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
 * CRITICAL: Style segments must appear FIRST for proper AI weighting.
 */
function buildFluxPrompt(
  segments: PromptSegment[],
  chaLevel: number,
  isPortrait: boolean
): string {
  // Separate style/genre segments (Tier 0) from character segments
  const styleSegments: string[] = [];
  const characterSegments: string[] = [];

  for (const seg of segments) {
    if (seg.text.length === 0) continue;

    // Style, genre, rendering go FIRST
    if (seg.category === 'style' || seg.category === 'genre' ||
        seg.category === 'rendering' || seg.category === 'genre_context') {
      styleSegments.push(seg.text);
    } else {
      characterSegments.push(seg.text);
    }
  }

  // Build prompt: STYLE FIRST, then character
  const parts: string[] = [];

  // 1. Style segments at the very beginning
  if (styleSegments.length > 0) {
    parts.push(...styleSegments);
  } else {
    // Fallback if no style selected: add generic fantasy art style
    parts.push('fantasy illustration');
  }

  // 2. Character description
  parts.push(...characterSegments);

  let sentence = parts.join(', ');

  // CHA enhancement
  sentence += getChaEnhancement(chaLevel, 'FLUX');

  // Portrait enhancement
  if (isPortrait) {
    sentence += ', face focus, detailed facial features, portrait composition';
  }

  // Quality suffix (only if no style was provided)
  if (styleSegments.length === 0) {
    sentence += ', highly detailed';
  }

  return cleanupPrompt(sentence);
}

/**
 * Build a Pony-style tag prompt from segments.
 * CRITICAL: In Pony, order = weight. Earlier tags have more influence.
 * Optimal order: quality tags → style → meta → extreme stats → character
 */
function buildPonyPrompt(
  segments: PromptSegment[],
  gender: string | null,
  chaLevel: number,
  isPortrait: boolean
): string {
  const tags: string[] = [];

  // 1. Quality tags FIRST (required by Pony)
  tags.push('score_9', 'score_8_up', 'score_7_up');

  // 2. Style/genre tags SECOND (sets artistic frame)
  const styleSegments: string[] = [];
  const characterSegments: string[] = [];

  for (const seg of segments) {
    if (seg.text.length === 0) continue;

    // Style, genre, rendering, fantasy context go early
    if (seg.category === 'style' || seg.category === 'genre' ||
        seg.category === 'rendering' || seg.category === 'genre_context') {
      styleSegments.push(convertToBooru(seg.text));
    } else {
      characterSegments.push(convertToBooru(seg.text));
    }
  }

  // Add style tags right after quality tags
  if (styleSegments.length > 0) {
    tags.push(...styleSegments);
  } else {
    // Fallback: generic fantasy style
    tags.push('fantasy', 'illustration');
  }

  // 3. Character meta tags
  tags.push(getCharacterMeta(gender));

  // 4. Character description (extreme stats will be early in this list due to tier sorting)
  tags.push(...characterSegments);

  // 5. CHA enhancement
  const chaEnh = getChaEnhancement(chaLevel, 'Pony');
  if (chaEnh) tags.push(chaEnh.replace(/^,\s*/, ''));

  // 6. Portrait enhancement
  if (isPortrait) {
    tags.push('face_focus', 'detailed_face', 'portrait');
  }

  return cleanTagPrompt(tags.join(', '));
}

/**
 * Build an SDXL/Juggernaut-style weighted keyword prompt from segments.
 * Style segments should appear early for proper AI interpretation.
 */
function buildSDXLPrompt(
  segments: PromptSegment[],
  chaLevel: number,
  isPortrait: boolean,
  model: Model
): string {
  const parts: string[] = [];

  // 1. Quality with subtle emphasis
  parts.push('(masterpiece:1.08), (best quality:1.08)');

  // 2. Separate style from character segments
  const styleSegments: string[] = [];
  const characterSegments: string[] = [];

  for (const seg of segments) {
    if (seg.text.length === 0) continue;

    // Style, genre, rendering, fantasy context go early
    if (seg.category === 'style' || seg.category === 'genre' ||
        seg.category === 'rendering' || seg.category === 'genre_context') {
      // Apply emphasis to style for SDXL
      styleSegments.push(`(${seg.text}:1.1)`);
    } else {
      // Apply emphasis to facial traits only
      if (seg.category === 'features' || seg.category === 'expression') {
        const hasFacial = /eyes|face|nose|lips|jaw|cheek|expression/i.test(seg.text);
        if (hasFacial) {
          characterSegments.push(`(${seg.text}:1.08)`);
        } else {
          characterSegments.push(seg.text);
        }
      } else {
        characterSegments.push(seg.text);
      }
    }
  }

  // 3. Add style segments right after quality
  if (styleSegments.length > 0) {
    parts.push(...styleSegments);
  } else {
    parts.push('(fantasy illustration:1.1)');
  }

  // 4. Character description
  parts.push(...characterSegments);

  // 5. CHA enhancement
  const chaEnh = getChaEnhancement(chaLevel, model);
  if (chaEnh) parts.push(chaEnh.replace(/^,\s*/, ''));

  // 6. Portrait enhancement
  if (isPortrait) {
    parts.push('(face focus:1.1), (detailed facial features:1.08), portrait composition');
  }

  // 7. Quality suffix (only if no style provided)
  if (styleSegments.length === 0) {
    parts.push('highly detailed');
  }

  return cleanupPrompt(parts.join(', '));
}

/**
 * Build an SD1.5-style simple keyword prompt from segments.
 * Style keywords should appear early for proper weighting.
 */
function buildSD15Prompt(
  segments: PromptSegment[],
  chaLevel: number,
  isPortrait: boolean
): string {
  const tags = ['masterpiece', 'best quality'];

  // Separate style from character segments
  const styleSegments: string[] = [];
  const characterSegments: string[] = [];

  for (const seg of segments) {
    if (seg.text.length === 0) continue;

    if (seg.category === 'style' || seg.category === 'genre' ||
        seg.category === 'rendering' || seg.category === 'genre_context') {
      styleSegments.push(seg.text);
    } else {
      characterSegments.push(seg.text);
    }
  }

  // Add style right after quality tags
  if (styleSegments.length > 0) {
    tags.push(...styleSegments);
  } else {
    tags.push('fantasy illustration');
  }

  // Add character description
  tags.push(...characterSegments);

  // CHA enhancement
  const chaEnh = getChaEnhancement(chaLevel, 'SD1.5');
  if (chaEnh) tags.push(chaEnh.replace(/^,\s*/, ''));

  // Portrait enhancement
  if (isPortrait) {
    tags.push('face focus', 'detailed facial features', 'portrait');
  }

  // Quality suffix (only if no style provided)
  if (styleSegments.length === 0) {
    tags.push('highly detailed');
  }

  return cleanTagPrompt(tags.join(', '));
}

/**
 * Build an Illustrious-style curly-brace emphasis prompt from segments.
 * Style should appear early for proper booru-style tagging.
 */
function buildIllustriousPrompt(
  segments: PromptSegment[],
  gender: string | null,
  chaLevel: number,
  isPortrait: boolean
): string {
  const tags: string[] = [];

  // 1. Core quality with selective emphasis
  tags.push('{masterpiece}', 'best quality', 'very aesthetic');

  // 2. Separate style from character segments
  const styleSegments: string[] = [];
  const characterSegments: string[] = [];

  for (const seg of segments) {
    if (seg.text.length === 0) continue;

    if (seg.category === 'style' || seg.category === 'genre' ||
        seg.category === 'rendering' || seg.category === 'genre_context') {
      // Emphasize style with curly braces
      styleSegments.push(`{${convertToBooru(seg.text)}}`);
    } else if (seg.category === 'features' || seg.category === 'expression') {
      const isFacial = /eyes|face|hair|expression|nose|lips|jaw/i.test(seg.text);
      if (isFacial) {
        characterSegments.push(`{${seg.text}}`);
      } else {
        characterSegments.push(seg.text);
      }
    } else {
      characterSegments.push(convertToBooru(seg.text));
    }
  }

  // 3. Add style right after quality
  if (styleSegments.length > 0) {
    tags.push(...styleSegments);
  } else {
    tags.push('{fantasy}', 'illustration');
  }

  // 4. Character meta tags
  tags.push(getCharacterMeta(gender));

  // 5. Character description
  tags.push(...characterSegments);

  // 6. CHA enhancement
  const chaEnh = getChaEnhancement(chaLevel, 'Illustrious');
  if (chaEnh) tags.push(chaEnh.replace(/^,\s*/, ''));

  // 7. Portrait enhancement
  if (isPortrait) {
    tags.push('{face_focus}', '{detailed_face}', 'portrait');
  }

  // 8. Metadata suffix
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
