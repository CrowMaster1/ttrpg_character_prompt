/**
 * Comprehensive test suite for the Stats-as-Skeleton PromptEngine
 * Based on PromptArchitect Design Document Section 8 test scenarios.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { PromptEngine } from './index';
import { assembleFoundation } from './foundation';
import { estimateTokens, enforceTokenBudget, createSegment } from './tokenBudget';
import { generateNegativePrompt } from './negativePrompt';
import { stripQualityAdjectives, injectGearQuality } from './detailValidation';
import { DEAD_WORDS } from './constants';
import { PriorityTier } from './types';
import type { Selections, ControlsConfig } from '../../types';
import type { StatLevels } from './types';
import * as fs from 'fs';
import * as path from 'path';

// Define local Model type to match refactored version
type Model = 'FLUX' | 'Pony' | 'SDXL' | 'Illustrious' | 'Juggernaut';

const TOKEN_LIMITS: Record<Model, number> = {
  'FLUX': 256,
  'Pony': 77,
  'SDXL': 77,
  'Illustrious': 248,
  'Juggernaut': 77,
};

// Load real data files for testing
function loadJsonFile(filePath: string): unknown {
  try {
    const absPath = path.resolve(__dirname, '../../../public/data', filePath);
    const content = fs.readFileSync(absPath, 'utf-8');
    return JSON.parse(content);
  } catch {
    return null;
  }
}

function loadControlsConfig(): ControlsConfig {
  try {
    const absPath = path.resolve(__dirname, '../../../public/controls.json');
    const content = fs.readFileSync(absPath, 'utf-8');
    return JSON.parse(content);
  } catch {
    return { tabs: [], controls: {} };
  }
}

// Build a real data cache from the public/data files
function buildDataCache(): Record<string, unknown> {
  const cache: Record<string, unknown> = {};
  const dataFiles: Record<string, string> = {
    'muscle': 'muscle.json',
    'body_fat': 'body_fat.json',
    'age': 'age.json',
    'attractiveness': 'attractiveness.json',
    'demeanor': 'demeanor.json',
    'skin': 'skin.json',
    'grooming': 'grooming.json',
    'muscle_definition': 'muscle_definition.json',
    'gear_quality': 'gear_quality.json',
    'dexterity': 'dexterity.json',
    'intelligence': 'intelligence.json',
    'pose': 'pose.json',
    'expressions': 'expressions.json',
    'facial_features': 'facial_features.json',
    'mood': 'mood.json',
    'lighting': 'lighting.json',
    'framing': 'framing.json',
    'aesthetic': 'aesthetic.json',
    'genre_style': 'genre_styles.json',
    'rendering_style': 'rendering_style.json',
    'shadows': 'shadows.json',
    'depth_of_field': 'depth_of_field.json',
    'height': 'height.json',
    'body_shape': 'body_shape.json',
    'chest': 'equipment_chest.json',
    'head': 'equipment_head.json',
    'legs': 'equipment_legs.json',
    'hands': 'equipment_hands.json',
    'feet': 'equipment_feet.json',
    'main_hand': 'equipment_main_hand.json',
    'off_hand': 'equipment_off_hand.json',
    'back': 'equipment_back.json',
  };

  for (const [key, file] of Object.entries(dataFiles)) {
    const data = loadJsonFile(file);
    if (data) cache[key] = data;
  }

  return cache;
}

let dataCache: Record<string, unknown>;
let controlsConfig: ControlsConfig;
let engine: PromptEngine;

beforeAll(() => {
  dataCache = buildDataCache();
  controlsConfig = loadControlsConfig();
  engine = new PromptEngine(controlsConfig, dataCache);
});

// Helper to create selections with stat levels
function makeSelections(statOverrides: Partial<Record<string, unknown>> = {}): Selections {
  const base: Selections = {
    race: 'Human',
    gender: 'Male',
    muscle: { level: 3, qualifier: 'sturdy' },
    body_fat: { level: 3, qualifier: 'healthy weight' },
    age: { level: 3, qualifier: 'late 30s to early 50s' },
    attractiveness: { level: 3, qualifier: 'plain-faced' },
    demeanor: { level: 3, qualifier: 'composed' },
    skin: { level: 3, qualifier: 'natural' },
    grooming: { level: 3, qualifier: 'presentable' },
    muscle_definition: { level: 3, qualifier: 'well-defined' },
    gear_quality: { level: 3, qualifier: 'serviceable' },
    dexterity: { level: 3, qualifier: 'balanced stance' },
    intelligence: { level: 3, qualifier: 'attentive gaze' },
  };
  return { ...base, ...statOverrides };
}

// ============================================================
// Category 1: Stat Extreme Tests
// ============================================================

describe('Category 1: Stat Extreme Tests', () => {

  it('TEST 1.1: The Glass Cannon (STR=1, DEX=5, CON=1, AGE=1, INT=5, CHA=1)', () => {
    const selections = makeSelections({
      muscle: { level: 1, qualifier: 'slender' },
      body_fat: { level: 1, qualifier: 'gaunt' },
      age: { level: 1, qualifier: 'fresh-faced' },
      attractiveness: { level: 1, qualifier: 'grotesque features' },
      demeanor: { level: 1, qualifier: 'unsettling' },
      dexterity: { level: 5, qualifier: "dancer's poise" },
      intelligence: { level: 5, qualifier: 'penetrating gaze' },
    });

    const result = engine.generate(selections, 'FLUX');
    const lower = result.prompt.toLowerCase();

    // Should contain graceful/dexterity keywords
    expect(lower).toMatch(/poise|grace|fluid|cat-?like|agil|dancer/);
    // Should contain intelligence keywords
    expect(lower).toMatch(/gaze|intellect|penetrat|brilliant|knowing/);
    // Should contain low CHA keywords
    expect(lower).toMatch(/grotesque|repulsive|hideous|ugly/);
    // Token limit respected
    expect(result.tokenCount).toBeLessThanOrEqual(result.tokenLimit);
  });

  it('TEST 1.2: The Beautiful Brute (STR=5, DEX=1, CON=5, AGE=3, INT=1, CHA=5)', () => {
    const selections = makeSelections({
      muscle: { level: 5, qualifier: 'massive' },
      body_fat: { level: 5, qualifier: 'portly' },
      age: { level: 3, qualifier: 'late 30s to early 50s' },
      attractiveness: { level: 5, qualifier: 'breathtaking beauty' },
      demeanor: { level: 5, qualifier: 'commanding' },
      dexterity: { level: 1, qualifier: 'stiff posture' },
      intelligence: { level: 1, qualifier: 'vacant stare' },
    });

    const result = engine.generate(selections, 'FLUX');
    const lower = result.prompt.toLowerCase();

    // Should contain massive/bodybuilder keywords
    expect(lower).toMatch(/massive|bodybuilder|hulking|herculean/);
    // Should contain beauty keywords
    expect(lower).toMatch(/beautiful|stunning|gorgeous|breathtaking/);
    // Token limit respected
    expect(result.tokenCount).toBeLessThanOrEqual(result.tokenLimit);
  });

  it('TEST 1.3: The Venerable Scholar (STR=1, DEX=1, CON=3, AGE=5, INT=5, CHA=3)', () => {
    const selections = makeSelections({
      muscle: { level: 1, qualifier: 'slender' },
      body_fat: { level: 3, qualifier: 'proportionate' },
      age: { level: 5, qualifier: '80s or older' },
      attractiveness: { level: 3, qualifier: 'typical features' },
      dexterity: { level: 1, qualifier: 'stiff posture' },
      intelligence: { level: 5, qualifier: 'penetrating gaze' },
    });

    const result = engine.generate(selections, 'FLUX');
    const lower = result.prompt.toLowerCase();

    // Should contain venerable/old
    expect(lower).toMatch(/venerable|80s|older|ancient|elderly/);
    // Should NOT contain "frail build" (removed from age.json)
    expect(lower).not.toContain('frail build');
    // Should NOT contain "stooped shoulders" (removed from age.json)
    expect(lower).not.toContain('stooped shoulders');
    // Token limit
    expect(result.tokenCount).toBeLessThanOrEqual(result.tokenLimit);
  });

  it('TEST 1.5: All Stats at 3 (Average) - NO dead words', () => {
    const selections = makeSelections(); // all defaults at 3

    const result = engine.generate(selections, 'FLUX');
    const lower = result.prompt.toLowerCase();

    // NO dead words in output
    for (const deadWord of DEAD_WORDS) {
      expect(lower).not.toContain(deadWord.toLowerCase());
    }

    // Should contain positive neutral terms, not "boring" ones
    expect(lower).not.toContain('unremarkable');
    expect(lower).not.toContain('common');
    expect(lower).not.toContain('ordinary');

    // Token limit
    expect(result.tokenCount).toBeLessThanOrEqual(result.tokenLimit);
  });
});

// ============================================================
// Category 2: Token Limit Stress Tests
// ============================================================

describe('Category 2: Token Limit Stress Tests', () => {

  it('TEST 2.1: Maximum Equipment Load (Pony, 77 tokens)', () => {
    const selections = makeSelections({
      chest: 'Steel Breastplate',
      head: 'Steel Helmet',
      hands: 'Steel Gauntlets',
      feet: 'Steel Sabatons',
      legs: 'Chainmail Chausses',
      main_hand: 'Greatsword',
      off_hand: 'Buckler',
      back: 'Hooded Cloak',
      aesthetic: 'Dark Fantasy',
      scene: 'Castle Courtyard',
    });

    const result = engine.generate(selections, 'Pony');

    // Must stay under 77 tokens
    expect(result.tokenCount).toBeLessThanOrEqual(77);
    // Prompt must not be empty
    expect(result.prompt.length).toBeGreaterThan(20);
  });

  it('TEST 2.2: Maximum Trait Load (SDXL, 77 tokens)', () => {
    const selections = makeSelections({
      monstrous_features: ['Horns', 'Fangs', 'Tail'],
      uncharming_traits: ['Crooked Nose', 'Thin Lips'],
      afflictions: ['Burn Scars'],
    });

    const result = engine.generate(selections, 'SDXL');

    // Must stay under 77 tokens
    expect(result.tokenCount).toBeLessThanOrEqual(77);
    // Stat keywords should still be present
    expect(result.prompt.length).toBeGreaterThan(20);
  });

  it('TEST 2.3: Full Feature Set (FLUX, 256 tokens)', () => {
    const selections = makeSelections({
      chest: 'Steel Breastplate',
      main_hand: 'Greatsword',
      aesthetic: 'Dark Fantasy',
      scene: 'Castle Courtyard',
      pose: 'Standing Resolutely',
      lighting: 'Dramatic Lighting',
      mood: 'Epic',
      facial_features: 'Strong Jawline',
      expressions: 'Determined',
      free_text: 'epic hero shot, volumetric rays',
    });

    const result = engine.generate(selections, 'FLUX');

    // Must stay under 256 tokens
    expect(result.tokenCount).toBeLessThanOrEqual(256);
    // Should be a rich prompt
    expect(result.prompt.length).toBeGreaterThan(100);
  });

  it('All 5 models respect their token limits with full selections', () => {
    const selections = makeSelections({
      chest: 'Steel Breastplate',
      main_hand: 'Greatsword',
      aesthetic: 'Dark Fantasy',
      scene: 'Castle Courtyard',
      pose: 'Standing Resolutely',
      lighting: 'Dramatic Lighting',
    });

    const models: Model[] = ['FLUX', 'Pony', 'SDXL', 'Illustrious', 'Juggernaut'];
    for (const model of models) {
      const result = engine.generate(selections, model);
      expect(result.tokenCount).toBeLessThanOrEqual(TOKEN_LIMITS[model]);
    }
  });
});

// ============================================================
// Category 3: Detail Layer Conflict Tests
// ============================================================

describe('Category 3: Detail Layer Conflict Tests', () => {

  it('TEST 3.1: Heavy Armor on Weakling (STR=1 + Steel Breastplate)', () => {
    const selections = makeSelections({
      muscle: { level: 1, qualifier: 'slender' },
      chest: 'Steel Breastplate',
      main_hand: 'Greatsword',
    });

    const result = engine.generate(selections, 'FLUX');

    // Should have warnings about heavy equipment on weak character
    expect(result.warnings.length).toBeGreaterThan(0);
    expect(result.warnings.some(w => w.message.includes('heavy'))).toBe(true);
    // But prompt should still include both (user override respected)
    expect(result.prompt.length).toBeGreaterThan(20);
  });

  it('TEST 3.4: Fine Equipment at Low Gear Quality', () => {
    const description = 'a polished steel breastplate with engraved pauldrons';
    const stripped = stripQualityAdjectives(description);

    // "polished" should be removed
    expect(stripped).not.toContain('polished');
    // Core description should remain
    expect(stripped).toContain('steel breastplate');

    // Inject low gear quality
    const injected = injectGearQuality(description, 1, 'FLUX');
    // Should have a low-quality adjective
    expect(injected).toMatch(/rusty|tattered|broken|damaged|crumbling/);
    expect(injected).not.toContain('polished');
  });
});

// ============================================================
// Category 4: Model Parity Tests
// ============================================================

describe('Category 4: Model Parity Tests', () => {

  it('TEST 4.1: Standard Fantasy Warrior - same concept across all models', () => {
    const selections = makeSelections({
      muscle: { level: 4, qualifier: 'powerful' },
      attractiveness: { level: 4, qualifier: 'handsome' },
      age: { level: 2, qualifier: 'late 20s to early 30s' },
      chest: 'Steel Breastplate',
      main_hand: 'Greatsword',
    });

    const models: Model[] = ['FLUX', 'Pony', 'SDXL', 'SD1.5', 'Illustrious', 'Juggernaut'];
    const outputs: Record<string, string> = {};

    for (const model of models) {
      const result = engine.generate(selections, model);
      outputs[model] = result.prompt.toLowerCase();
    }

    // All outputs should contain muscular/athletic concept
    for (const model of models) {
      expect(outputs[model]).toMatch(/muscul|athletic|powerful|broad|strong/);
    }

    // All outputs should contain armor/breastplate concept
    for (const model of models) {
      expect(outputs[model]).toMatch(/armor|breastplate|steel/);
    }

    // All outputs should contain attractiveness concept
    for (const model of models) {
      expect(outputs[model]).toMatch(/handsome|attractive|beautiful|pretty/);
    }
  });

  it('TEST 4.2: Ugly Elderly Wizard - consistent concept across models', () => {
    const selections = makeSelections({
      race: 'Elf',
      gender: 'Female',
      muscle: { level: 1, qualifier: 'slender' },
      attractiveness: { level: 1, qualifier: 'grotesque features' },
      age: { level: 5, qualifier: '80s or older' },
      intelligence: { level: 5, qualifier: 'penetrating gaze' },
    });

    const models: Model[] = ['FLUX', 'Pony', 'SDXL', 'SD1.5', 'Illustrious', 'Juggernaut'];

    for (const model of models) {
      const result = engine.generate(selections, model);
      const lower = result.prompt.toLowerCase();
      const negLower = result.negativePrompt.toLowerCase();

      // Should have ugly/grotesque concept
      expect(lower).toMatch(/grotesque|ugly|hideous|repulsive/);
      // Should have old/venerable concept
      expect(lower).toMatch(/venerable|old|80|elder|aged/);
      // Negative prompt should NOT include "ugly" (we want ugly for CHA=1)
      // Note: The negative prompt might not explicitly contain "ugly" but
      // we check it's not blocking what we want
      expect(negLower).not.toMatch(/\bugly\b/);
    }
  });
});

// ============================================================
// Category 5: Negative Prompt Logic Tests
// ============================================================

describe('Category 5: Negative Prompt Logic Tests', () => {

  it('TEST 5.1: Charming Character (CHA=5, no uncharming traits)', () => {
    const selections = makeSelections({
      attractiveness: { level: 5, qualifier: 'breathtaking beauty' },
    });

    const statLevels: StatLevels = {
      muscle: 3, dexterity: 3, body_fat: 3, age: 3,
      intelligence: 3, attractiveness: 5, demeanor: 3,
      skin: 3, grooming: 3, muscle_definition: 3, gear_quality: 3,
    };

    const neg = generateNegativePrompt(selections, 'FLUX', statLevels, 0);

    // Should include face symmetry negatives for CHA >= 4
    expect(neg.toLowerCase()).toContain('asymmetrical face');
    // Should include standard anatomy negatives
    expect(neg.toLowerCase()).toContain('bad anatomy');
  });

  it('TEST 5.2: Ugly Character with Uncharming Traits', () => {
    const selections = makeSelections({
      attractiveness: { level: 1, qualifier: 'grotesque features' },
      uncharming_traits: ['Crooked Nose', 'Thin Lips'],
    });

    const statLevels: StatLevels = {
      muscle: 3, dexterity: 3, body_fat: 3, age: 3,
      intelligence: 3, attractiveness: 1, demeanor: 3,
      skin: 3, grooming: 3, muscle_definition: 3, gear_quality: 3,
    };

    const neg = generateNegativePrompt(selections, 'FLUX', statLevels, 0);

    // Should NOT include anatomy negatives (uncharming traits need anatomical freedom)
    expect(neg.toLowerCase()).not.toContain('bad anatomy');
    // Should NOT include "ugly" (we WANT ugly for CHA=1)
    expect(neg.toLowerCase()).not.toMatch(/\bugly\b/);
    // Should still have quality negatives
    expect(neg.toLowerCase()).toContain('low quality');
  });

  it('TEST 5.3: Monstrous Character', () => {
    const selections = makeSelections({
      monstrous_features: ['Horns', 'Fangs'],
    });

    const statLevels: StatLevels = {
      muscle: 3, dexterity: 3, body_fat: 3, age: 3,
      intelligence: 3, attractiveness: 3, demeanor: 3,
      skin: 3, grooming: 3, muscle_definition: 3, gear_quality: 3,
    };

    const neg = generateNegativePrompt(selections, 'FLUX', statLevels, 0);

    // Should NOT include "deformed" (monstrous features need freedom)
    expect(neg.toLowerCase()).not.toMatch(/\bdeformed\b/);
    // Should still have quality negatives
    expect(neg.toLowerCase()).toContain('low quality');
  });

  it('TEST 5.4: Elderly Character - no wrinkle negatives', () => {
    const selections = makeSelections({
      age: { level: 5, qualifier: '80s or older' },
    });

    const statLevels: StatLevels = {
      muscle: 3, dexterity: 3, body_fat: 3, age: 5,
      intelligence: 3, attractiveness: 3, demeanor: 3,
      skin: 3, grooming: 3, muscle_definition: 3, gear_quality: 3,
    };

    const neg = generateNegativePrompt(selections, 'SDXL', statLevels, 0);

    // Should NOT negate wrinkles (we want them for elderly)
    expect(neg.toLowerCase()).not.toMatch(/\bwrinkles?\b/);
  });
});

// ============================================================
// Foundation Assembly Tests
// ============================================================

describe('Foundation Assembly', () => {

  it('never includes dead words', () => {
    // Run multiple times to catch random qualifier selection
    for (let i = 0; i < 20; i++) {
      const statLevels: StatLevels = {
        muscle: 3, dexterity: 3, body_fat: 3, age: 3,
        intelligence: 3, attractiveness: 3, demeanor: 3,
        skin: 3, grooming: 3, muscle_definition: 3, gear_quality: 3,
      };

      const foundation = assembleFoundation(statLevels, dataCache, 'Male', 'FLUX');
      const allText = Object.values(foundation).join(' ').toLowerCase();

      for (const deadWord of DEAD_WORDS) {
        expect(allText).not.toContain(deadWord.toLowerCase());
      }
    }
  });

  it('produces distinct output for different stat levels', () => {
    const lowStats: StatLevels = {
      muscle: 1, dexterity: 1, body_fat: 1, age: 1,
      intelligence: 1, attractiveness: 1, demeanor: 1,
      skin: 1, grooming: 1, muscle_definition: 1, gear_quality: 1,
    };
    const highStats: StatLevels = {
      muscle: 5, dexterity: 5, body_fat: 5, age: 5,
      intelligence: 5, attractiveness: 5, demeanor: 5,
      skin: 5, grooming: 5, muscle_definition: 5, gear_quality: 5,
    };

    const lowFoundation = assembleFoundation(lowStats, dataCache, 'Male', 'FLUX');
    const highFoundation = assembleFoundation(highStats, dataCache, 'Male', 'FLUX');

    // They should be distinctly different
    expect(lowFoundation.strength).not.toEqual(highFoundation.strength);
    expect(lowFoundation.charisma).not.toEqual(highFoundation.charisma);
  });
});

// ============================================================
// Token Budget Tests
// ============================================================

describe('Token Budget', () => {

  it('estimateTokens returns reasonable values', () => {
    expect(estimateTokens('')).toBe(0);
    expect(estimateTokens('hello world')).toBeGreaterThan(0);
    expect(estimateTokens('a b c d e f g h')).toBeLessThanOrEqual(8);
  });

  it('enforceTokenBudget preserves T0-T2 segments', () => {
    const segments = [
      createSegment(PriorityTier.MANDATORY, 'quality', 'score_9 score_8_up'),
      createSegment(PriorityTier.IDENTITY, 'identity', 'human male'),
      createSegment(PriorityTier.FOUNDATION, 'strength', 'massive bodybuilder'),
      createSegment(PriorityTier.ENHANCE, 'extra', 'very long extra description that takes many tokens and should be cut first when budget is tight'),
    ];

    const result = enforceTokenBudget(segments, 'Pony');

    // T0-T2 should survive
    expect(result[0].text).toBe('score_9 score_8_up');
    expect(result[1].text).toBe('human male');
    expect(result[2].text).toBe('massive bodybuilder');
  });

  it('removes T7-T9 segments first when trimming', () => {
    const segments = [
      createSegment(PriorityTier.MANDATORY, 'quality', 'score_9'),
      createSegment(PriorityTier.FOUNDATION, 'strength', 'muscular'),
      createSegment(PriorityTier.COMPOSITION, 'camera', 'low angle shot with dramatic perspective'),
      createSegment(PriorityTier.ATMOSPHERE, 'mood', 'ominous dark atmosphere with fog'),
      createSegment(PriorityTier.ENHANCE, 'extra', 'professional high quality 8k uhd dslr photograph'),
    ];

    const result = enforceTokenBudget(segments, 'SD1.5');

    // T0 and T2 should survive
    const survivingTexts = result.filter(s => s.text.length > 0).map(s => s.category);
    expect(survivingTexts).toContain('quality');
    expect(survivingTexts).toContain('strength');
  });
});

// ============================================================
// Model Formatting Tests
// ============================================================

describe('Model Formatting', () => {

  it('FLUX produces natural language output', () => {
    const selections = makeSelections();
    const result = engine.generate(selections, 'FLUX');

    // FLUX should have natural language flow
    expect(result.prompt).toContain('A ');
    // Should end with quality suffix
    expect(result.prompt.toLowerCase()).toContain('highly detailed');
  });

  it('Pony produces score tags first', () => {
    const selections = makeSelections();
    const result = engine.generate(selections, 'Pony');

    // Pony should start with score tags
    expect(result.prompt).toMatch(/^score_9/);
    // Should have character meta
    expect(result.prompt).toMatch(/1boy|1girl/);
  });

  it('Pony does not use weight syntax', () => {
    const selections = makeSelections({
      attractiveness: { level: 5, qualifier: 'breathtaking beauty' },
    });
    const result = engine.generate(selections, 'Pony');

    // Pony should NEVER have (word:number) syntax
    expect(result.prompt).not.toMatch(/\(\w+:[\d.]+\)/);
  });

  it('SDXL uses weighted keywords', () => {
    const selections = makeSelections();
    const result = engine.generate(selections, 'SDXL');

    // SDXL should have quality boosters
    expect(result.prompt).toContain('8k, highly detailed');
  });

  it('Illustrious uses mandatory quality prefix', () => {
    const selections = makeSelections();
    const result = engine.generate(selections, 'Illustrious');

    // Illustrious should have quality prefix
    expect(result.prompt).toContain('masterpiece, best quality');
    // Should have metadata suffix
    expect(result.prompt.toLowerCase()).toContain('newest');
  });
});

// ============================================================
// Data File Fix Verification
// ============================================================

describe('Data File Fixes Verified', () => {

  it('muscle.json Level 3 has no dead words', () => {
    const data = (dataCache['muscle'] as any)?.['3'];
    expect(data).toBeDefined();
    expect(data.name).toBe('medium build');
    for (const q of data.qualifiers) {
      expect(DEAD_WORDS).not.toContain(q.toLowerCase());
    }
  });

  it('body_fat.json Level 3 fixed - no "soft" qualifier, Level 4 renamed', () => {
    const l3 = (dataCache['body_fat'] as any)?.['3'];
    const l4 = (dataCache['body_fat'] as any)?.['4'];
    expect(l3).toBeDefined();
    expect(l4).toBeDefined();

    // L3 should not have "soft"
    expect(l3.qualifiers).not.toContain('soft');
    // L3 name should be "average weight"
    expect(l3.name).toBe('average weight');
    // L4 should be renamed from "soft" to "full"
    expect(l4.name).toBe('full');
  });

  it('attractiveness.json Level 1 prevents monster generation', () => {
    const l1 = (dataCache['attractiveness'] as any)?.['1'];
    expect(l1).toBeDefined();
    // Should not have bare "monstrous" (should be "malformed face" or similar)
    expect(l1.qualifiers).not.toContain('monstrous');
    // Should have face/features qualifiers
    expect(l1.qualifiers.some((q: string) => q.includes('face') || q.includes('features') || q.includes('visage') || q.includes('ugly'))).toBe(true);
  });

  it('attractiveness.json Level 2 - no duplicate "ugly"', () => {
    const l2 = (dataCache['attractiveness'] as any)?.['2'];
    expect(l2).toBeDefined();
    expect(l2.qualifiers).not.toContain('ugly');
  });

  it('attractiveness.json Level 5 - no gendered "bombshell"', () => {
    const l5 = (dataCache['attractiveness'] as any)?.['5'];
    expect(l5).toBeDefined();
    expect(l5.qualifiers).not.toContain('bombshell');
  });

  it('demeanor.json is redesigned as social magnetism scale', () => {
    const l1 = (dataCache['demeanor'] as any)?.['1'];
    const l5 = (dataCache['demeanor'] as any)?.['5'];
    expect(l1).toBeDefined();
    expect(l5).toBeDefined();

    // L1 should be repulsive/unsettling, not "feral/unhinged"
    expect(l1.name).toContain('repulsive');
    // L5 should be captivating, not "intense" with contradictory qualifiers
    expect(l5.name).toContain('captivating');
    // L5 should NOT have contradictory "serene" + "smoldering"
    expect(l5.qualifiers).not.toContain('serene');
    expect(l5.qualifiers).not.toContain('smoldering');
  });

  it('skin.json Level 5 - "sultry" replaced with "dewy"', () => {
    const l5 = (dataCache['skin'] as any)?.['5'];
    expect(l5).toBeDefined();
    expect(l5.qualifiers).not.toContain('sultry');
    expect(l5.qualifiers).toContain('dewy');
  });

  it('age.json - cross-stat contamination removed', () => {
    const l4 = (dataCache['age'] as any)?.['4'];
    const l5 = (dataCache['age'] as any)?.['5'];
    expect(l4).toBeDefined();
    expect(l5).toBeDefined();

    // L4 should NOT have "stooped shoulders" (STR domain)
    expect(l4.qualifiers).not.toContain('stooped shoulders');
    // L5 should NOT have "frail build" (STR domain)
    expect(l5.qualifiers).not.toContain('frail build');
  });

  it('muscle_definition.json has 5 levels', () => {
    expect((dataCache['muscle_definition'] as any)?.['5']).toBeDefined();
    expect((dataCache['muscle_definition'] as any)?.['5']?.name).toBe('extreme vascularity');
  });

  it('muscle_definition.json L2 - "athletic but soft" oxymoron fixed', () => {
    const l2 = (dataCache['muscle_definition'] as any)?.['2'];
    expect(l2).toBeDefined();
    expect(l2.qualifiers).not.toContain('athletic but soft');
    expect(l2.qualifiers).toContain('naturally toned');
  });

  it('equipment_chest.json - Bare Chest has no hardcoded "muscular"', () => {
    const chestItems = dataCache['chest'] as Array<{ name: string; description: string }> | undefined;
    const bareChest = chestItems?.find((item) => item.name === 'Bare Chest');
    expect(bareChest).toBeDefined();
    expect(bareChest?.description).not.toContain('muscular');
  });

  it('dexterity.json exists with 5 levels', () => {
    for (let i = 1; i <= 5; i++) {
      expect((dataCache['dexterity'] as any)?.[String(i)]).toBeDefined();
      expect((dataCache['dexterity'] as any)?.[String(i)]?.qualifiers?.length).toBeGreaterThan(0);
    }
  });

  it('intelligence.json exists with 5 levels', () => {
    for (let i = 1; i <= 5; i++) {
      expect((dataCache['intelligence'] as any)?.[String(i)]).toBeDefined();
      expect((dataCache['intelligence'] as any)?.[String(i)]?.qualifiers?.length).toBeGreaterThan(0);
    }
  });
});

// ============================================================
// Performance Tests
// ============================================================

describe('Performance', () => {

  it('hard-coded generation completes in under 100ms', () => {
    const selections = makeSelections({
      chest: 'Steel Breastplate',
      main_hand: 'Greatsword',
      aesthetic: 'Dark Fantasy',
    });

    const start = performance.now();
    for (let i = 0; i < 100; i++) {
      engine.generate(selections, 'FLUX');
    }
    const elapsed = (performance.now() - start) / 100;

    expect(elapsed).toBeLessThan(100); // < 100ms per generation
  });
});
