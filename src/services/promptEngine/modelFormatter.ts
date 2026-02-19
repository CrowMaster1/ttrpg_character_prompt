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
 * Helper to apply weight to a segment if the model supports it.
 */
function withWeight(text: string, weight: number = 1.2): string {
  if (!text) return '';
  return `(${text}:${weight})`;
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

  // Convert spaces to underscores for booru compatibility
  // (Optional, many UIs handle spaces fine, but underscores are more "standard")
  // result = result.replace(/\s+/g, '_');

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
  if (!sentence.toLowerCase().includes('highly detailed')) {
    sentence += ', highly detailed';
  }
  if (!sentence.toLowerCase().includes('fantasy illustration')) {
    sentence += ' fantasy illustration';
  }

  return cleanupPrompt(sentence);
}

/**
 * Build a Pony-style tag prompt from segments.
 * Follows rules from instructions_image.md: mandatory score chain, tags, rating_safe.
 */
function buildPonyPrompt(
  segments: PromptSegment[],
  gender: string | null,
  chaLevel: number,
  isPortrait: boolean
): string {
  const tags: string[] = [];

  // 1. Mandatory Quality Chain (training mistake fix)
  tags.push('score_9, score_8_up, score_7_up, score_6_up, score_5_up, score_4_up');

  // 3. Character description converted to booru tags
  for (const seg of segments) {
    if (seg.text.length === 0) continue;
    const booruTag = convertToBooru(seg.text);

    // Apply weight to Identity, Physical Foundation, and Charisma only
    if (seg.category === 'identity' || seg.category === 'strength' ||
        seg.category === 'constitution' || seg.category === 'age' ||
        seg.category === 'charisma') {
      tags.push(withWeight(booruTag, 1.2));
    } else {
      tags.push(booruTag);
    }
  }

  // 4. CHA enhancement
  const chaEnh = getChaEnhancement(chaLevel, 'Pony');
  if (chaEnh) tags.push(chaEnh.replace(/^,\s*/, ''));

  // 5. Source tags (Rating removed per 'no guard rails' request)
  tags.push('source_anime');

  // 6. Portrait enhancement
  if (isPortrait) {
    tags.push('face_focus', 'detailed_face', 'portrait');
  }

  return cleanTagPrompt(tags.join(', '));
}

/**
 * Build a Juggernaut-style prompt.
 * Photorealistic triggers, natural language foundation sentence.
 */
function buildJuggernautPrompt(
  segments: PromptSegment[],
  chaLevel: number,
  isPortrait: boolean
): string {
  const parts: string[] = [];
  const fullText = segments.map(s => s.text.toLowerCase()).join(' ');

  // Quality triggers - only add if not already present
  const triggers = ['High Resolution', 'Cinematic', 'Skin Textures', 'photorealistic', 'photo'];
  const filteredTriggers = triggers.filter(t => !fullText.includes(t.toLowerCase()));
  if (filteredTriggers.length > 0) {
    parts.push(filteredTriggers.join(', '));
  }

  // Content segments
  for (const seg of segments) {
    if (seg.text.length === 0) continue;

    // Apply weight to core physical segments and charisma
    if (seg.category === 'identity' || seg.category === 'strength' ||
        seg.category === 'constitution' || seg.category === 'age' ||
        seg.category === 'charisma') {
      parts.push(withWeight(seg.text, 1.2));
    } else {
      parts.push(seg.text);
    }
  }

  let sentence = parts.join(', ');

  // CHA enhancement
  const chaEnh = getChaEnhancement(chaLevel, 'Juggernaut');
  if (chaEnh) {
    sentence += `, ${chaEnh.replace(/^,\s*/, '')}`;
  }

  // Portrait enhancement
  if (isPortrait) {
    parts.push('(face focus:1.1), (detailed facial features:1.08), portrait composition');
  }

  return cleanupPrompt(sentence);
}

/**
 * Build an SDXL-style weighted keyword prompt.
 */
function buildSDXLPrompt(
  segments: PromptSegment[],
  chaLevel: number,
  isPortrait: boolean
): string {
  const parts: string[] = [];
  const fullText = segments.map(s => s.text.toLowerCase()).join(' ');

  // Quality boosters - only add if not already present
  const boosters = ['8k', 'highly detailed', 'sharp focus', 'professional photography'];
  const filteredBoosters = boosters.filter(b => !fullText.includes(b.toLowerCase()));
  if (filteredBoosters.length > 0) {
    parts.push(filteredBoosters.join(', '));
  }

  // Content segments
  for (const seg of segments) {
    if (seg.text.length === 0) continue;

    // Apply weight to core physical segments and charisma
    if (seg.category === 'identity' || seg.category === 'strength' ||
        seg.category === 'constitution' || seg.category === 'age' ||
        seg.category === 'charisma') {
      parts.push(withWeight(seg.text, 1.2));
    } else {
      parts.push(seg.text);
    }
  }

  let sentence = parts.join(', ');

  // CHA enhancement
  const chaEnh = getChaEnhancement(chaLevel, 'SDXL');
  if (chaEnh) {
    sentence += `, ${chaEnh.replace(/^,\s*/, '')}`;
  }

  // Portrait enhancement
  if (isPortrait) {
    sentence += ', face focus, detailed facial features, portrait composition';
  }

  return cleanupPrompt(sentence);
}

/**
 * Build an Illustrious-style curly-brace emphasis prompt from segments.
 * Hybrid style: tags + hybrid phrases.
 */
function buildIllustriousPrompt(
  segments: PromptSegment[],
  gender: string | null,
  chaLevel: number,
  isPortrait: boolean
): string {
  const tags: string[] = [];
  const fullText = segments.map(s => s.text.toLowerCase()).join(' ');

  // 1. Mandatory Quality prefix - only add if not already present
  const prefixes = ['masterpiece', 'best quality', 'amazing quality', 'very aesthetic', 'newest'];
  const filteredPrefixes = prefixes.filter(p => !fullText.includes(p.toLowerCase()));
  if (filteredPrefixes.length > 0) {
    tags.push(filteredPrefixes.join(', '));
  }

  // 3. Content segments
  for (const seg of segments) {
    if (seg.text.length === 0) continue;
    const content = convertToBooru(seg.text);

    // Apply weight to core physical segments and charisma
    if (seg.category === 'identity' || seg.category === 'strength' ||
        seg.category === 'constitution' || seg.category === 'age' ||
        seg.category === 'charisma') {
      tags.push(withWeight(content, 1.2));
    } else {
      tags.push(content);
    }
  }

  // 4. Rating tag removed per 'no guard rails' request

  // 5. CHA enhancement
  const chaEnh = getChaEnhancement(chaLevel, 'Illustrious');
  if (chaEnh) tags.push(chaEnh.replace(/^,\s*/, ''));

  // 6. Portrait enhancement
  if (isPortrait) {
    tags.push('{face_focus}', '{detailed_face}', 'portrait');
  }

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
      return buildSDXLPrompt(budgetedSegments, chaLevel, isPortrait);

    case 'Juggernaut':
      return buildJuggernautPrompt(budgetedSegments, chaLevel, isPortrait);

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
