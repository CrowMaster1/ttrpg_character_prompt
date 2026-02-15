/**
 * Constants for the Prompt Engine
 * Dead words, weight classes, gender coding, and other static data
 */

/**
 * Words that are NEVER used in prompts.
 * From ImageGenExpert Tier C/F analysis - these produce poor or counterproductive results.
 */
export const DEAD_WORDS: string[] = [
  'unremarkable', 'common', 'ordinary', 'capable',
  'infectious', 'knowing', 'reeking', 'perfumed',
  'beer-soaked', 'vomit-stained',
];

/**
 * Gender-coded qualifier mapping.
 * Allows the system to select gender-appropriate qualifiers.
 */
export const GENDER_CODED: Record<string, 'feminine' | 'masculine' | 'neutral'> = {
  'willowy': 'feminine',
  'delicate': 'feminine',
  'fine-boned': 'feminine',
  'bombshell': 'feminine',
  'dapper': 'masculine',
  'handsome': 'masculine',
  'herculean': 'masculine',
  'burly': 'masculine',
};

/**
 * Equipment weight classes for STR compatibility checks
 */
export const EQUIPMENT_WEIGHT_CLASSES: Record<string, 'heavy' | 'medium' | 'light' | 'none'> = {
  'Steel Breastplate': 'heavy',
  'Steel Gauntlets': 'heavy',
  'Steel Sabatons': 'heavy',
  'Steel Helmet': 'heavy',
  'Chainmail Shirt': 'medium',
  'Chainmail Chausses': 'medium',
  'Chainmail Coif': 'medium',
  'Greatsword': 'heavy',
  'Warhammer': 'heavy',
  'Battleaxe': 'heavy',
  'Longbow': 'medium',
  'Leather Jerkin': 'light',
  'Leather Boots': 'light',
  'Leather Gloves': 'light',
  'Leather Cap': 'light',
  'Dagger': 'light',
  'Rapier': 'light',
  'Staff': 'light',
  'Shortsword': 'light',
  'Buckler': 'light',
  'Simple Tunic': 'none',
  'Ornate Robes': 'none',
  'Fine Clothes': 'none',
  'Bare Chest': 'none',
  'Hooded Cloak': 'none',
  'Traveler\'s Clothes': 'none',
};

/**
 * Equipment slot IDs in controls.json
 */
export const EQUIPMENT_SLOTS = [
  'head', 'chest', 'legs', 'hands', 'feet',
  'main_hand', 'off_hand', 'back',
];

/**
 * Quality adjectives to strip from equipment descriptions
 * before injecting gear_quality adjectives
 */
export const QUALITY_ADJECTIVES_TO_STRIP = [
  'polished', 'fine', 'ornate', 'gleaming', 'well-loved',
  'gnarled', 'elegant', 'exquisite', 'beautiful', 'magnificent',
  'sturdy', 'powerful', 'well-stocked', 'well-crafted',
  'masterly', 'pristine', 'luxurious',
];

/**
 * Quality prefixes to inject based on gear quality level
 */
export const GEAR_QUALITY_PREFIXES: Record<number, string[]> = {
  1: ['rusty', 'tattered', 'broken', 'damaged', 'crumbling'],
  2: ['worn', 'patched', 'faded', 'dented', 'fraying'],
  3: ['serviceable', 'standard', 'plain', 'functional', 'well-used'],
  4: ['well-crafted', 'decorated', 'polished', 'fine', 'ornate'],
  5: ['gleaming', 'masterwork', 'immaculate', 'exquisite', 'flawless'],
};

/**
 * Redundancy rules: when two stats at certain levels make one redundant
 */
export interface RedundancyRule {
  stat1: string;
  stat1Level: number;
  stat2: string;
  stat2Level: number;
  action: 'drop_stat2' | 'merge' | 'keep_both';
  reason: string;
}

export const REDUNDANCY_RULES: RedundancyRule[] = [
  {
    stat1: 'muscle', stat1Level: 5,
    stat2: 'muscle_definition', stat2Level: 4,
    action: 'drop_stat2',
    reason: 'Bodybuilder already implies extreme definition',
  },
  {
    stat1: 'muscle', stat1Level: 1,
    stat2: 'muscle_definition', stat2Level: 1,
    action: 'merge',
    reason: 'Combine to single phrase: "thin, soft frame"',
  },
  {
    stat1: 'body_fat', stat1Level: 1,
    stat2: 'muscle', stat2Level: 1,
    action: 'merge',
    reason: 'Combine: "gaunt, emaciated frame" covers both',
  },
];
