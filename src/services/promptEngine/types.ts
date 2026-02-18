/**
 * Types for the Stats-as-Skeleton Prompt Engine
 * Based on PromptArchitect Design Document Section 9.2
 */

import type { Model } from '../../types';

/** Stat levels from sliders (1-5 scale) */
export interface StatLevels {
  muscle: number;           // 1-5 (STR)
  dexterity: number;        // 1-5 (DEX)
  body_fat: number;         // 1-5 (CON)
  age: number;              // 1-5 (AGE)
  intelligence: number;     // 1-5 (INT)
  attractiveness: number;   // 1-5 (CHA)
  // Secondary CHA stats
  demeanor: number;         // 1-5
  skin: number;             // 1-5
  grooming: number;         // 1-5
  // Supplementary
  muscle_definition: number; // 1-5
  gear_quality: number;      // 1-5
}

/** Keywords resolved from stat levels */
export interface FoundationKeywords {
  strength: string;         // "powerful athletic build"
  dexterity: string;        // "graceful poised bearing"
  constitution: string;     // "healthy weight frame"
  age: string;              // "adult, settled features"
  intelligence: string;     // "attentive clear-eyed gaze"
  charisma: string;         // "handsome attractive"
  demeanor: string;         // "warm charming demeanor"
  skin: string;             // "healthy natural skin"
  grooming: string;         // "well-groomed appearance"
  muscle_def: string;       // "visible muscle groups"
}

/** A prompt segment with priority and token info */
export interface PromptSegment {
  tier: number;             // 0-9 priority (0 = mandatory, 9 = expendable)
  category: string;         // human-readable category name
  text: string;             // the actual prompt text
  tokens: number;           // estimated token count
  canSummarize: boolean;    // can be shortened vs removed entirely
  model_variants?: Partial<Record<Model, string>>;
}

/** A warning from detail layer validation */
export interface ValidationWarning {
  severity: 'block' | 'warn' | 'info';
  message: string;
  conflictingItems: string[];
  suggestion?: string;
}

/** Final result from the prompt engine */
export interface PromptResult {
  prompt: string;
  negativePrompt: string;
  tokenCount: number;
  tokenLimit: number;
  warnings: ValidationWarning[];
  segments: PromptSegment[];
  aiEnhanced?: string;
  usedAI: boolean;
}

/** Token limit configuration per model */
export const TOKEN_LIMITS: Record<Model, number> = {
  'FLUX': 256,
  'Pony': 77,
  'SDXL': 77,
  'Illustrious': 248,
  'Juggernaut': 77,
};

/** Priority tier definitions */
export enum PriorityTier {
  STYLE = 0,         // Overall aesthetic, setting, genre (User wants STYLE FIRST)
  MANDATORY = 1,     // Quality tags, meta tags (Prepend logic in formatter will handle these)
  IDENTITY = 2,      // Race, gender
  FOUNDATION = 3,    // STR, CON, AGE keywords
  PRESENCE = 4,      // CHA, INT, DEX keywords
  DETAILS = 5,       // Equipment, outfits
  FEATURES = 6,      // Facial features, expression
  ACTION = 7,        // Pose, scene
  COMPOSITION = 8,   // Camera, lighting
  ATMOSPHERE = 9,    // Mood, weather
  ENHANCE = 10,      // Extra quality tags
}
