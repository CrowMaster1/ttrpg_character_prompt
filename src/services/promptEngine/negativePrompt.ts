/**
 * Phase 5: Negative Prompt Generation
 * Context-aware negative prompts that adapt to the character being generated.
 * Based on PromptArchitect Section 6 logic trees.
 */

import type { Model, Selections } from '../../types';
import type { StatLevels } from './types';
import { cleanupPrompt, cleanTagPrompt } from '../promptCleaner';

/** Base negative prompts per model (always included) */
const MODEL_BASE_NEGATIVES: Record<string, string> = {
  'FLUX': 'blurry, low quality, watermark, signature, text',
  'Pony': 'score_4, score_5, score_6, worst quality, low quality, blurry, watermark, signature, text',
  'SDXL': '(worst quality:1.2), (low quality:1.2), watermark, signature, username, text, error, cropped',
  'Juggernaut': '(worst quality:1.2), (low quality:1.2), watermark, signature, username, text, error, cropped',
  'SD1.5': 'worst quality, low quality, text, error, cropped, jpeg artifacts, signature, watermark, username, blurry',
  'Illustrious': 'worst quality, low quality, blurry, lowres, displeasing, very displeasing, jpeg artifacts, signature, watermark, username, text',
};

/** Anatomy negatives per model (only added when not using uncharming/monstrous traits) */
const MODEL_ANATOMY_NEGATIVES: Record<string, string> = {
  'FLUX': 'distorted, deformed, disfigured, bad anatomy, extra limbs, poorly drawn, gross proportions, malformed limbs',
  'Pony': 'bad anatomy, bad hands, missing fingers, extra fingers',
  'SDXL': 'bad anatomy, bad hands',
  'Juggernaut': 'bad anatomy, bad hands',
  'SD1.5': 'bad anatomy, bad hands, missing fingers, extra digit, fewer digits',
  'Illustrious': 'bad anatomy, bad hands, missing fingers, extra fingers',
};

/**
 * Generate a context-aware negative prompt.
 * Adapts to character traits, stat levels, and model requirements.
 */
export function generateNegativePrompt(
  selections: Selections,
  model: Model,
  statLevels: StatLevels,
  nsfwLevel: number
): string {
  const parts: string[] = [];

  // Step 1: Base negatives (always)
  parts.push(MODEL_BASE_NEGATIVES[model] || MODEL_BASE_NEGATIVES['FLUX']);

  // Step 2: Check for uncharming/monstrous traits
  const hasUncharming = Array.isArray(selections.uncharming_traits)
    && selections.uncharming_traits.length > 0;
  const hasMonstrous = Array.isArray(selections.monstrous_features)
    && selections.monstrous_features.length > 0;

  // Only add anatomy negatives if NOT using uncharming or monstrous traits
  // (these characters NEED anatomical freedom)
  if (!hasUncharming && !hasMonstrous) {
    parts.push(MODEL_ANATOMY_NEGATIVES[model] || '');
  }

  // Step 3: CHA-specific negatives
  const chaLevel = statLevels.attractiveness || 3;
  if (chaLevel >= 4) {
    // High CHA: want perfect face symmetry
    parts.push('asymmetrical face, crossed eyes, deformed iris, uneven eyes');
  }

  // Step 4: Model-specific hand negatives (only if anatomy negatives are active)
  if (!hasUncharming && !hasMonstrous) {
    if (model === 'SDXL' || model === 'Juggernaut') {
      parts.push('fused fingers, too many fingers');
    }
    if (model === 'SD1.5') {
      parts.push('mutated hands, poorly drawn hands, poorly drawn face');
    }
  }

  // Step 5: Assemble
  let result = parts.filter(p => p.length > 0).join(', ');

  // Step 6: Remove contradictory negatives

  // Don't negate "ugly" for low CHA characters (we WANT ugly)
  if (chaLevel <= 2) {
    result = result.replace(/\bugly\b,?\s*/g, '');
  }

  // Don't negate "deformed" for monstrous characters (they need anatomical freedom)
  if (hasMonstrous) {
    result = result.replace(/\bdeformed\b,?\s*/g, '');
  }

  // Don't negate wrinkles for elderly characters (we want wrinkles)
  if (statLevels.age >= 4) {
    result = result.replace(/\bwrinkles?\b,?\s*/g, '');
  }

  // Clean up
  if (model === 'Pony' || model === 'Illustrious') {
    return cleanTagPrompt(result);
  }
  return cleanupPrompt(result);
}
