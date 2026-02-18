/**
 * PromptEngine - Main Entry Point
 *
 * Stats-as-Skeleton prompt generation system.
 * Implements the 6-phase pipeline:
 *   Phase 1: Foundation Assembly (stats -> keywords)
 *   Phase 2: Detail Validation (equipment/features vs stats)
 *   Phase 3: Composition Optimization (camera/lighting suggestions)
 *   Phase 4: Model Formatting (model-specific syntax)
 *   Phase 5: Negative Prompt Generation (context-aware negatives)
 *   Phase 6: AI Enhancement (optional Ollama integration)
 */

import type { Model, Selections, ControlsConfig } from '../../types';
import type {
  StatLevels,
  FoundationKeywords,
  PromptSegment,
  PromptResult,
  ValidationWarning,
} from './types';
import { PriorityTier } from './types';
import { assembleFoundation } from './foundation';
import { validateDetails, injectGearQuality } from './detailValidation';
import { suggestComposition } from './compositionOptimizer';
import { formatForModel } from './modelFormatter';
import { generateNegativePrompt } from './negativePrompt';
import { enhancePrompt } from './aiEnhancer';
import { createSegment, estimateTokens, getTokenLimit } from './tokenBudget';
import { EQUIPMENT_SLOTS } from './constants';

export class PromptEngine {
  private controlsConfig: ControlsConfig;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private dataCache: Record<string, any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private dataLookups: Map<string, Map<string, any>>;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(controlsConfig: ControlsConfig, dataCache: Record<string, any>) {
    this.controlsConfig = controlsConfig;
    this.dataCache = dataCache;

    // Build O(1) lookup maps for performance optimization
    this.dataLookups = new Map();
    for (const [key, data] of Object.entries(dataCache)) {
      if (Array.isArray(data)) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const lookupMap = new Map<string, any>();
        for (const item of data) {
          if (item && typeof item === 'object' && 'name' in item && typeof item.name === 'string') {
            lookupMap.set(item.name, item);
          }
        }
        this.dataLookups.set(key, lookupMap);
      }
    }
  }

  /**
   * Fast O(1) data lookup helper
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private lookupData(category: string, name: string): any | undefined {
    return this.dataLookups.get(category)?.get(name);
  }

  /**
   * Extract stat levels from selections.
   * Maps the various selection objects to a flat StatLevels structure.
   */
  private extractStatLevels(selections: Selections): StatLevels {
    return {
      muscle: selections.muscle?.level ?? 3,
      dexterity: selections.dexterity?.level ?? 3,
      body_fat: selections.body_fat?.level ?? 3,
      age: selections.age?.level ?? 3,
      intelligence: selections.intelligence?.level ?? 3,
      attractiveness: selections.attractiveness?.level ?? 3,
      demeanor: selections.demeanor?.level ?? 3,
      skin: selections.skin?.level ?? 3,
      grooming: selections.grooming?.level ?? 3,
      muscle_definition: selections.muscle_definition?.level ?? 3,
      gear_quality: selections.gear_quality?.level ?? 3,
    };
  }

  /**
   * Build prompt segments from selections.
   * Each segment has a priority tier for token budget management.
   */
  private buildSegments(
    foundation: FoundationKeywords,
    selections: Selections,
    statLevels: StatLevels,
    model: Model
  ): PromptSegment[] {
    const segments: PromptSegment[] = [];

    // Tier 1: Identity (race + gender)
    const race = selections.race || '';
    const gender = selections.gender || '';
    if (race || gender) {
      const identityParts = [race, gender].filter(Boolean);
      segments.push(createSegment(
        PriorityTier.IDENTITY,
        'identity',
        model === 'FLUX'
          ? `A ${identityParts.join(' ')}`
          : identityParts.join(', ')
      ));
    }

    // Tier 2: Foundation stats (STR, CON, AGE - physical foundation)
    if (foundation.strength) {
      segments.push(createSegment(PriorityTier.FOUNDATION, 'strength', foundation.strength));
    }
    if (foundation.constitution) {
      segments.push(createSegment(PriorityTier.FOUNDATION, 'constitution', foundation.constitution));
    }
    if (foundation.age) {
      segments.push(createSegment(PriorityTier.FOUNDATION, 'age', foundation.age));
    }
    if (foundation.muscle_def) {
      segments.push(createSegment(PriorityTier.FOUNDATION, 'muscle_def', foundation.muscle_def));
    }

    // Tier 3: Presence stats (CHA, INT, DEX - mental/social)
    if (foundation.charisma) {
      segments.push(createSegment(PriorityTier.PRESENCE, 'charisma', foundation.charisma));
    }
    if (foundation.demeanor) {
      segments.push(createSegment(PriorityTier.PRESENCE, 'demeanor', foundation.demeanor));
    }
    if (foundation.dexterity) {
      segments.push(createSegment(PriorityTier.PRESENCE, 'dexterity', foundation.dexterity));
    }
    if (foundation.intelligence) {
      segments.push(createSegment(PriorityTier.PRESENCE, 'intelligence', foundation.intelligence));
    }
    if (foundation.skin) {
      segments.push(createSegment(PriorityTier.PRESENCE, 'skin', foundation.skin));
    }
    if (foundation.grooming) {
      segments.push(createSegment(PriorityTier.PRESENCE, 'grooming', foundation.grooming));
    }

    // Tier 0: Style (sets the artistic frame - placed early in Pony priority)
    const styleSegments = this.buildStyleSegments(selections);
    segments.push(...styleSegments);

    // Tier 4: Equipment/Outfits
    const equipmentSegments = this.buildEquipmentSegments(selections, statLevels, model);
    segments.push(...equipmentSegments);

    // Tier 5: Facial features, expression, special traits
    const featureSegments = this.buildFeatureSegments(selections);
    segments.push(...featureSegments);

    // Tier 6: Pose/Action, Scene
    if (selections.pose && typeof selections.pose === 'string' && selections.pose !== 'None') {
      const poseData = this.lookupData('pose', selections.pose);
      const poseDesc = poseData?.description || selections.pose;
      segments.push(createSegment(PriorityTier.ACTION, 'pose', poseDesc));
    }
    if (selections.scene && typeof selections.scene === 'string') {
      segments.push(createSegment(
        PriorityTier.ACTION,
        'scene',
        model === 'FLUX' ? `in ${selections.scene}` : selections.scene
      ));
    }

    // Tier 7: Camera/Lighting/Composition
    const compSegments = this.buildCompositionSegments(selections, statLevels);
    segments.push(...compSegments);

    // Tier 8: Mood/Weather/Atmosphere
    if (selections.mood && typeof selections.mood === 'string') {
      const moodData = this.lookupData('mood', selections.mood);
      const moodQualifier = moodData?.qualifiers
        ? moodData.qualifiers[Math.floor(Math.random() * moodData.qualifiers.length)]
        : selections.mood;
      segments.push(createSegment(PriorityTier.ATMOSPHERE, 'mood', moodQualifier));
    }
    if (selections.weather && typeof selections.weather === 'string') {
      segments.push(createSegment(PriorityTier.ATMOSPHERE, 'weather', selections.weather));
    }

    // Free text at the end
    if (selections.free_text && typeof selections.free_text === 'string') {
      segments.push(createSegment(PriorityTier.ENHANCE, 'free_text', selections.free_text));
    }

    return segments;
  }

  /**
   * Build style/aesthetic segments
   */
  private buildStyleSegments(selections: Selections): PromptSegment[] {
    const segments: PromptSegment[] = [];

    if (selections.aesthetic && typeof selections.aesthetic === 'string' && selections.aesthetic !== 'None') {
      const data = this.lookupData('aesthetic', selections.aesthetic);
      const fragment = data?.prompt_fragment || selections.aesthetic;
      segments.push(createSegment(PriorityTier.MANDATORY, 'style', fragment));
    }

    if (selections.genre_style && typeof selections.genre_style === 'string' && selections.genre_style !== 'None') {
      const data = this.lookupData('genre_style', selections.genre_style);
      const fragment = data?.prompt_fragment || selections.genre_style;
      segments.push(createSegment(PriorityTier.MANDATORY, 'genre', fragment));
    }

    if (selections.rendering_style && typeof selections.rendering_style === 'string' && selections.rendering_style !== 'None') {
      const data = this.lookupData('rendering_style', selections.rendering_style);
      const qualifier = data?.qualifiers
        ? data.qualifiers[Math.floor(Math.random() * data.qualifiers.length)]
        : selections.rendering_style;
      segments.push(createSegment(PriorityTier.MANDATORY, 'rendering', qualifier));
    }

    return segments;
  }

  /**
   * Build equipment/outfit segments with gear quality injection
   */
  private buildEquipmentSegments(
    selections: Selections,
    statLevels: StatLevels,
    model: Model
  ): PromptSegment[] {
    const segments: PromptSegment[] = [];

    // Check if any outfit is selected
    const outfitKeys = Object.keys(selections).filter(
      k => k.startsWith('outfit_') && selections[k] && selections[k] !== 'None'
    );

    if (outfitKeys.length > 0) {
      // Use outfits
      const outfitParts: string[] = [];
      for (const key of outfitKeys) {
        const selected = this.lookupData(key, selections[key]);
        if (selected?.qualifiers) {
          outfitParts.push(...selected.qualifiers);
        }
      }
      if (outfitParts.length > 0) {
        const prefix = model === 'FLUX' ? 'wearing ' : '';
        segments.push(createSegment(
          PriorityTier.DETAILS,
          'outfit',
          prefix + outfitParts.join(', '),
          true // can be summarized
        ));
      }
    } else {
      // Use individual equipment slots
      const equipParts: string[] = [];
      for (const slot of EQUIPMENT_SLOTS) {
        const equipped = selections[slot];
        if (!equipped || equipped === 'None') continue;

        // Find the equipment data
        const itemData = this.lookupData(slot, equipped);

        if (itemData?.description) {
          // Strip quality adjectives and inject gear_quality
          const cleanedDesc = injectGearQuality(
            itemData.description,
            statLevels.gear_quality,
            model
          );
          equipParts.push(cleanedDesc);
        } else {
          equipParts.push(equipped);
        }
      }

      if (equipParts.length > 0) {
        const prefix = model === 'FLUX' ? 'clad in ' : '';
        segments.push(createSegment(
          PriorityTier.DETAILS,
          'equipment',
          prefix + equipParts.join(', '),
          true // can be summarized
        ));
      }
    }

    return segments;
  }

  /**
   * Build feature segments (facial, expression, special traits)
   */
  private buildFeatureSegments(selections: Selections): PromptSegment[] {
    const segments: PromptSegment[] = [];

    // Facial features
    if (selections.facial_features && typeof selections.facial_features === 'string') {
      const data = this.lookupData('facial_features', selections.facial_features);
      const qualifier = data?.qualifiers
        ? data.qualifiers[Math.floor(Math.random() * data.qualifiers.length)]
        : selections.facial_features;
      segments.push(createSegment(PriorityTier.FEATURES, 'features', qualifier));
    }

    // Expression
    if (selections.expressions) {
      const expr = typeof selections.expressions === 'string'
        ? selections.expressions
        : Array.isArray(selections.expressions) && selections.expressions.length > 0
          ? selections.expressions[0]
          : null;
      if (expr) {
        const data = this.lookupData('expressions', expr);
        const qualifier = data?.qualifiers
          ? data.qualifiers[Math.floor(Math.random() * data.qualifiers.length)]
          : expr;
        segments.push(createSegment(PriorityTier.FEATURES, 'expression', qualifier));
      }
    }

    // Hair
    if (selections.hair_color && typeof selections.hair_color === 'string') {
      segments.push(createSegment(PriorityTier.FEATURES, 'hair_color', `${selections.hair_color} hair`));
    }

    // Height
    if (selections.height && typeof selections.height === 'string' && selections.height !== 'None') {
      segments.push(createSegment(PriorityTier.FEATURES, 'height', selections.height));
    }

    // Body shape
    if (selections.body_shape && typeof selections.body_shape === 'string' && selections.body_shape !== 'None') {
      const data = this.lookupData('body_shape', selections.body_shape);
      const qualifier = data?.qualifiers
        ? data.qualifiers[Math.floor(Math.random() * data.qualifiers.length)]
        : selections.body_shape;
      segments.push(createSegment(PriorityTier.FEATURES, 'body_shape', qualifier));
    }

    // Special traits (uncharming, monstrous, afflictions, allure)
    const traitCategories = [
      'uncharming_traits', 'monstrous_features', 'afflictions',
      'allure_feminine', 'allure_masculine', 'allure_clothing',
    ];
    for (const cat of traitCategories) {
      if (Array.isArray(selections[cat]) && selections[cat].length > 0) {
        const traitTexts: string[] = [];
        for (const traitName of selections[cat]) {
          const data = this.lookupData(cat, traitName);
          if (data?.qualifiers) {
            const q = data.qualifiers[Math.floor(Math.random() * data.qualifiers.length)];
            traitTexts.push(q);
          } else {
            traitTexts.push(traitName);
          }
        }
        if (traitTexts.length > 0) {
          segments.push(createSegment(PriorityTier.FEATURES, cat, traitTexts.join(', ')));
        }
      }
    }

    return segments;
  }

  /**
   * Build composition segments (camera, lighting, framing)
   * Uses user selections first, then auto-suggestions if no user choice.
   */
  private buildCompositionSegments(
    selections: Selections,
    statLevels: StatLevels
  ): PromptSegment[] {
    const segments: PromptSegment[] = [];
    const suggestions = suggestComposition(statLevels);

    // Camera angle: user choice > auto-suggestion
    const cameraAngle = selections.camera_angle || suggestions.cameraAngle || '';
    if (cameraAngle) {
      segments.push(createSegment(PriorityTier.COMPOSITION, 'camera_angle', cameraAngle));
    }

    // Camera position
    if (selections.camera_position && typeof selections.camera_position === 'string') {
      segments.push(createSegment(PriorityTier.COMPOSITION, 'camera_position', selections.camera_position));
    }

    // Framing
    const framing = selections.framing || '';
    if (framing) {
      const data = this.lookupData('framing', framing);
      const qualifier = data?.qualifiers
        ? data.qualifiers[Math.floor(Math.random() * data.qualifiers.length)]
        : framing;
      segments.push(createSegment(PriorityTier.COMPOSITION, 'framing', qualifier));
    }

    // Lighting: user choice > auto-suggestion
    const lighting = selections.lighting || suggestions.lighting || '';
    if (lighting) {
      const data = this.lookupData('lighting', lighting);
      const qualifier = data?.qualifiers
        ? data.qualifiers[Math.floor(Math.random() * data.qualifiers.length)]
        : lighting;
      segments.push(createSegment(PriorityTier.COMPOSITION, 'lighting', qualifier));
    }

    // Shadows
    if (selections.shadows && typeof selections.shadows === 'string') {
      const data = this.lookupData('shadows', selections.shadows);
      const qualifier = data?.qualifiers
        ? data.qualifiers[Math.floor(Math.random() * data.qualifiers.length)]
        : selections.shadows;
      segments.push(createSegment(PriorityTier.COMPOSITION, 'shadows', qualifier));
    }

    // Depth of field
    if (selections.depth_of_field && typeof selections.depth_of_field === 'string' && selections.depth_of_field !== 'None') {
      const data = this.lookupData('depth_of_field', selections.depth_of_field);
      const qualifier = data?.qualifiers
        ? data.qualifiers[Math.floor(Math.random() * data.qualifiers.length)]
        : selections.depth_of_field;
      segments.push(createSegment(PriorityTier.COMPOSITION, 'depth_of_field', qualifier));
    }

    return segments;
  }

  /**
   * Detect portrait intent from selections
   */
  private detectPortraitIntent(selections: Selections): boolean {
    if (selections.framing && typeof selections.framing === 'string' &&
        selections.framing.toLowerCase().includes('portrait')) {
      return true;
    }
    if (selections.facial_features) return true;
    if (selections.camera_position) {
      const closeUps = ['Close-up shot', 'Portrait shot', 'Extreme close-up'];
      if (closeUps.includes(selections.camera_position)) return true;
    }
    return false;
  }

  /**
   * Generate a prompt (synchronous, hard-coded path).
   * This is the primary generation method - always fast, always available.
   */
  generate(
    selections: Selections,
    model: Model,
    nsfwLevel: number = 0
  ): PromptResult {
    const _startTime = performance.now();

    // Extract stat levels
    const statLevels = this.extractStatLevels(selections);

    // Phase 1: Foundation Assembly
    const gender = selections.gender || null;
    const foundation = assembleFoundation(statLevels, this.dataCache, gender, model);

    // Phase 2: Detail Validation
    const { validatedSelections, warnings } = validateDetails(
      selections, statLevels, this.dataCache
    );

    // Phase 3 + 4: Build segments and format
    const segments = this.buildSegments(foundation, validatedSelections, statLevels, model);
    const isPortrait = this.detectPortraitIntent(validatedSelections);

    const prompt = formatForModel(
      segments,
      model,
      gender,
      statLevels.attractiveness,
      isPortrait
    );

    // Phase 5: Negative Prompt
    const negativePrompt = generateNegativePrompt(
      validatedSelections, model, statLevels, nsfwLevel
    );

    return {
      prompt,
      negativePrompt,
      tokenCount: estimateTokens(prompt),
      tokenLimit: getTokenLimit(model),
      warnings,
      segments,
      usedAI: false,
    };
  }

  /**
   * Generate a prompt with optional AI enhancement (async path).
   * Falls back to hard-coded version if AI fails.
   */
  async generateEnhanced(
    selections: Selections,
    model: Model,
    nsfwLevel: number = 0,
    ollamaModel?: string
  ): Promise<PromptResult> {
    // Always generate the hard-coded version first
    const baseResult = this.generate(selections, model, nsfwLevel);

    // Try AI enhancement
    try {
      const statKeywords = this.getStatKeywords(selections);
      const aiPrompt = await enhancePrompt(
        baseResult.prompt,
        model,
        statKeywords,
        ollamaModel
      );

      if (aiPrompt) {
        return {
          ...baseResult,
          aiEnhanced: aiPrompt,
          usedAI: true,
        };
      }
    } catch (error) {
      console.warn('AI enhancement failed, using hard-coded version:', error);
    }

    return baseResult;
  }

  /**
   * Extract key stat-derived words for AI validation
   */
  private getStatKeywords(selections: Selections): string[] {
    const keywords: string[] = [];

    // Get the name from each stat level
    const statFields = ['muscle', 'body_fat', 'age', 'attractiveness', 'demeanor', 'skin', 'grooming'];
    for (const field of statFields) {
      const selection = selections[field] as { level?: number } | undefined;
      if (selection?.level) {
        const fieldCache = this.dataCache[field] as Record<string, { name?: string }> | undefined;
        const data = fieldCache?.[String(selection.level)];
        if (data?.name) {
          keywords.push(data.name);
        }
      }
    }

    // Add race and gender
    if (selections.race) keywords.push(selections.race);
    if (selections.gender) keywords.push(selections.gender);

    return keywords;
  }

  /**
   * Get just the positive and negative prompts as a formatted string.
   * Backwards compatible with the old PromptGenerator output format.
   */
  generateFormatted(
    selections: Selections,
    model: Model,
    nsfwLevel: number = 0
  ): string {
    const result = this.generate(selections, model, nsfwLevel);
    return `${result.prompt}\n\nNegative Prompt: ${result.negativePrompt}`;
  }
}

// Re-export types for external use
export type { PromptResult, ValidationWarning, PromptSegment, StatLevels, FoundationKeywords };
export { PriorityTier } from './types';
