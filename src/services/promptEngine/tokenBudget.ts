/**
 * Token Budget Management
 * Handles token estimation, priority-based trimming, and budget enforcement.
 */

import type { Model } from '../../types';
import type { PromptSegment } from './types';
import { TOKEN_LIMITS, PriorityTier } from './types';

/**
 * Estimate token count using the ~0.75 tokens per word heuristic.
 * This is a rough approximation for CLIP/T5 tokenizers.
 * Handles weighted syntax (word:1.2) and emphasis (word).
 */
export function estimateTokens(text: string): number {
  if (!text || text.trim().length === 0) return 0;

  let workingText = text;

  // Handle emphasis syntax more accurately
  // (word:1.2) counts as approximately 3-4 tokens
  const emphasisMatches = workingText.match(/\([^)]+:[\d.]+\)/g) || [];
  const emphasisTokens = emphasisMatches.length * 3; // Penalty for emphasis syntax

  // Remove emphasis syntax for word counting: (word:1.2) → word
  workingText = workingText.replace(/\([^)]+:[\d.]+\)/g, (match) => {
    // Extract just the word part
    const word = match.slice(1).split(':')[0];
    return word;
  });

  // Remove simple emphasis: (word) → word
  workingText = workingText.replace(/\(([^)]+)\)/g, '$1');

  // Remove curly braces (free in Illustrious)
  workingText = workingText.replace(/\{([^}]+)\}/g, '$1');

  // Split on whitespace and commas
  const words = workingText.split(/[\s,]+/).filter(w => w.length > 0);

  // Base estimation: ~0.75 tokens per word for CLIP
  const baseTokens = Math.ceil(words.length * 0.75);

  return baseTokens + emphasisTokens;
}

/**
 * Get the token limit for a given model
 */
export function getTokenLimit(model: Model): number {
  return TOKEN_LIMITS[model] || 77;
}

/**
 * Adjective list used for summarization (stripping adjectives from equipment)
 */
const ADJECTIVE_LIST = [
  'rusty', 'tattered', 'broken', 'damaged', 'crumbling',
  'worn', 'patched', 'faded', 'dented', 'fraying',
  'serviceable', 'standard', 'plain', 'functional', 'well-used',
  'well-crafted', 'decorated', 'polished', 'fine', 'ornate',
  'gleaming', 'masterwork', 'immaculate', 'exquisite', 'flawless',
  'simple', 'elegant', 'heavy', 'light', 'thick', 'thin',
  'embroidered', 'quilted', 'padded', 'fitted', 'gathered',
  'romantic', 'ruffled', 'laced', 'studded', 'riveted',
];

/**
 * Try to shorten a segment by removing adjectives, keeping nouns
 */
function summarizeSegment(segment: PromptSegment): PromptSegment {
  const words = segment.text.split(/\s+/);
  const nouns = words.filter(w =>
    !ADJECTIVE_LIST.includes(w.toLowerCase().replace(/[,.:]/g, ''))
  );
  const shortened = nouns.join(' ');
  return {
    ...segment,
    text: shortened,
    tokens: estimateTokens(shortened),
  };
}

/**
 * Enforce token budget on a set of prompt segments.
 * Removes/summarizes lowest-priority segments first, never touching T0-T2.
 *
 * Returns the final assembled prompt text.
 */
export function enforceTokenBudget(
  segments: PromptSegment[],
  model: Model
): PromptSegment[] {
  const tokenLimit = getTokenLimit(model);
  const workingSegments = segments.map(s => ({ ...s }));

  let totalTokens = workingSegments.reduce((sum, s) => sum + s.tokens, 0);

  if (totalTokens <= tokenLimit) {
    return workingSegments;
  }

  // Sort by tier descending (highest tier = lowest priority = remove first)
  const sortedByPriority = workingSegments
    .map((seg, idx) => ({ seg, idx }))
    .sort((a, b) => b.seg.tier - a.seg.tier);

  for (const { seg } of sortedByPriority) {
    if (totalTokens <= tokenLimit) break;

    // NEVER remove T0-T2 (mandatory, identity, foundation)
    if (seg.tier <= PriorityTier.FOUNDATION) continue;

    if (seg.canSummarize && seg.text.length > 0) {
      // Try to shorten first
      const original = seg.tokens;
      const shortened = summarizeSegment(seg);
      if (shortened.tokens < original) {
        seg.text = shortened.text;
        seg.tokens = shortened.tokens;
        totalTokens -= (original - shortened.tokens);
        continue;
      }
    }

    // Remove entirely
    if (seg.text.length > 0) {
      totalTokens -= seg.tokens;
      seg.text = '';
      seg.tokens = 0;
    }
  }

  // Filter out empty segments and sort by tier (lower = higher priority)
  return workingSegments
    .filter(s => s.text.trim().length > 0)
    .sort((a, b) => a.tier - b.tier);
}

/**
 * Assemble segments back into a prompt string, preserving tier order.
 */
export function assembleFromSegments(segments: PromptSegment[]): string {
  return segments
    .filter(s => s.text.length > 0)
    .sort((a, b) => a.tier - b.tier)
    .map(s => s.text)
    .join(', ');
}

/**
 * Create a prompt segment helper
 */
export function createSegment(
  tier: number,
  category: string,
  text: string,
  canSummarize: boolean = false,
  modelVariants?: Partial<Record<Model, string>>
): PromptSegment {
  return {
    tier,
    category,
    text: text.trim(),
    tokens: estimateTokens(text),
    canSummarize,
    model_variants: modelVariants,
  };
}
