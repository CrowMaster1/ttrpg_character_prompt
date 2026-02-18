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
   *
   * CRITICAL ORDER for keyword weight:
   * 1. Art style FIRST (fantasy art, medieval, illustration style)
   * 2. Extreme stats EARLY (very weak/very strong have more impact than average)
   * 3. Identity (race + gender)
   * 4. Normal stats
   * 5. Equipment with fantasy context
   */
  private buildSegments(
    foundation: FoundationKeywords,
    selections: Selections,
    statLevels: StatLevels,
    model: Model
  ): PromptSegment[] {
    const segments: PromptSegment[] = [];

    // ========================================
    // TIER 0: ART STYLE - ABSOLUTE FIRST
    // ========================================
    // Art style defines the entire aesthetic and prevents photorealistic interpretation
    // Provides smart suggestions when user hasn't selected style options
    const styleSegments = this.buildStyleSegments(selections, statLevels);
    segments.push(...styleSegments);

    // Add fantasy genre context if detected (prevents modern interpretation)
    if (this.detectFantasyContext(selections)) {
      segments.push(createSegment(
        PriorityTier.MANDATORY,
        'genre_context',
        model === 'FLUX'
          ? 'fantasy setting, medieval fantasy world'
          : 'fantasy, medieval'
      ));
    }

    // ========================================
    // TIER 1: IDENTITY
    // ========================================
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

    // ========================================
    // TIER 2: EXTREME STATS (level 1 or 5)
    // ========================================
    // Extreme values define the character more than average values
    // STR=1 (very weak) or STR=5 (very strong) should appear EARLY for emphasis
    const extremeStats = this.extractExtremeStats(foundation, statLevels);
    segments.push(...extremeStats);

    // ========================================
    // TIER 2-3: NORMAL FOUNDATION & PRESENCE
    // ========================================
    // Only non-extreme stats (level 2, 3, 4)
    const normalStats = this.extractNormalStats(foundation, statLevels);
    segments.push(...normalStats);

    // ========================================
    // TIER 4: EQUIPMENT/OUTFITS (with fantasy context)
    // ========================================
    const equipmentSegments = this.buildEquipmentSegments(selections, statLevels, model);
    segments.push(...equipmentSegments);

    // ========================================
    // TIER 5: FACIAL FEATURES, EXPRESSION, SPECIAL TRAITS
    // ========================================
    const featureSegments = this.buildFeatureSegments(selections);
    segments.push(...featureSegments);

    // ========================================
    // TIER 6: POSE/ACTION, SCENE
    // ========================================
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

    // ========================================
    // TIER 7: CAMERA/LIGHTING/COMPOSITION
    // ========================================
    const compSegments = this.buildCompositionSegments(selections, statLevels);
    segments.push(...compSegments);

    // ========================================
    // TIER 8: MOOD/WEATHER/ATMOSPHERE
    // ========================================
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

    // ========================================
    // TIER 9: FREE TEXT (user additions)
    // ========================================
    if (selections.free_text && typeof selections.free_text === 'string') {
      segments.push(createSegment(PriorityTier.ENHANCE, 'free_text', selections.free_text));
    }

    return segments;
  }

  /**
   * Detect if this is a fantasy-themed character.
   * Returns true if fantasy elements are present to add genre context early.
   */
  private detectFantasyContext(selections: Selections): boolean {
    // Check for fantasy races
    const fantasyRaces = ['elf', 'dwarf', 'halfling', 'gnome', 'orc', 'goblin', 'dragonborn', 'tiefling'];
    const race = selections.race?.toLowerCase() || '';
    if (fantasyRaces.some(fr => race.includes(fr))) return true;

    // Check for medieval/fantasy genres
    const genre = selections.genre_style?.toLowerCase() || '';
    if (genre.includes('fantasy') || genre.includes('medieval')) return true;

    // Check for fantasy aesthetics
    const aesthetic = selections.aesthetic?.toLowerCase() || '';
    if (aesthetic.includes('fantasy') || aesthetic.includes('medieval')) return true;

    return false;
  }

  /**
   * Extract extreme stat segments (level 1 or 5).
   * These define the character more strongly than average stats.
   */
  private extractExtremeStats(foundation: FoundationKeywords, statLevels: StatLevels): PromptSegment[] {
    const extremeSegments: PromptSegment[] = [];

    // Check each stat for extreme values
    const statChecks = [
      { level: statLevels.muscle, keyword: foundation.strength, category: 'strength' },
      { level: statLevels.body_fat, keyword: foundation.constitution, category: 'constitution' },
      { level: statLevels.age, keyword: foundation.age, category: 'age' },
      { level: statLevels.attractiveness, keyword: foundation.charisma, category: 'charisma' },
      { level: statLevels.demeanor, keyword: foundation.demeanor, category: 'demeanor' },
      { level: statLevels.dexterity, keyword: foundation.dexterity, category: 'dexterity' },
      { level: statLevels.intelligence, keyword: foundation.intelligence, category: 'intelligence' },
    ];

    for (const { level, keyword, category } of statChecks) {
      if ((level === 1 || level === 5) && keyword) {
        // Extreme stats use FOUNDATION tier for high priority
        extremeSegments.push(createSegment(PriorityTier.FOUNDATION, category, keyword));
      }
    }

    // Muscle definition if extreme
    if ((statLevels.muscle_definition === 1 || statLevels.muscle_definition === 5) && foundation.muscle_def) {
      extremeSegments.push(createSegment(PriorityTier.FOUNDATION, 'muscle_def', foundation.muscle_def));
    }

    return extremeSegments;
  }

  /**
   * Extract normal stat segments (level 2, 3, 4).
   * These are placed after extreme stats for proper weighting.
   */
  private extractNormalStats(foundation: FoundationKeywords, statLevels: StatLevels): PromptSegment[] {
    const normalSegments: PromptSegment[] = [];

    // Foundation stats (only if not extreme)
    if (statLevels.muscle !== 1 && statLevels.muscle !== 5 && foundation.strength) {
      normalSegments.push(createSegment(PriorityTier.FOUNDATION, 'strength', foundation.strength));
    }
    if (statLevels.body_fat !== 1 && statLevels.body_fat !== 5 && foundation.constitution) {
      normalSegments.push(createSegment(PriorityTier.FOUNDATION, 'constitution', foundation.constitution));
    }
    if (statLevels.age !== 1 && statLevels.age !== 5 && foundation.age) {
      normalSegments.push(createSegment(PriorityTier.FOUNDATION, 'age', foundation.age));
    }
    if (statLevels.muscle_definition !== 1 && statLevels.muscle_definition !== 5 && foundation.muscle_def) {
      normalSegments.push(createSegment(PriorityTier.FOUNDATION, 'muscle_def', foundation.muscle_def));
    }

    // Presence stats (only if not extreme)
    if (statLevels.attractiveness !== 1 && statLevels.attractiveness !== 5 && foundation.charisma) {
      normalSegments.push(createSegment(PriorityTier.PRESENCE, 'charisma', foundation.charisma));
    }
    if (statLevels.demeanor !== 1 && statLevels.demeanor !== 5 && foundation.demeanor) {
      normalSegments.push(createSegment(PriorityTier.PRESENCE, 'demeanor', foundation.demeanor));
    }
    if (statLevels.dexterity !== 1 && statLevels.dexterity !== 5 && foundation.dexterity) {
      normalSegments.push(createSegment(PriorityTier.PRESENCE, 'dexterity', foundation.dexterity));
    }
    if (statLevels.intelligence !== 1 && statLevels.intelligence !== 5 && foundation.intelligence) {
      normalSegments.push(createSegment(PriorityTier.PRESENCE, 'intelligence', foundation.intelligence));
    }

    // Secondary presence stats
    if (foundation.skin) {
      normalSegments.push(createSegment(PriorityTier.PRESENCE, 'skin', foundation.skin));
    }
    if (foundation.grooming) {
      normalSegments.push(createSegment(PriorityTier.PRESENCE, 'grooming', foundation.grooming));
    }

    return normalSegments;
  }

  /**
   * Build style/aesthetic segments with smart suggestions.
   * Provides helpful nudges when user hasn't made selections, based on character stats.
   */
  private buildStyleSegments(selections: Selections, statLevels: StatLevels): PromptSegment[] {
    const segments: PromptSegment[] = [];

    // Get smart suggestions based on character stats
    const suggestions = suggestComposition(statLevels);

    // Aesthetic: User selection OR suggestion
    if (selections.aesthetic && typeof selections.aesthetic === 'string' && selections.aesthetic !== 'None') {
      const data = this.lookupData('aesthetic', selections.aesthetic);
      const fragment = data?.prompt_fragment || selections.aesthetic;
      segments.push(createSegment(PriorityTier.MANDATORY, 'style', fragment));
    } else if (suggestions.aesthetic) {
      // Smart suggestion as nudge
      const data = this.lookupData('aesthetic', suggestions.aesthetic);
      const fragment = data?.prompt_fragment || suggestions.aesthetic;
      segments.push(createSegment(PriorityTier.MANDATORY, 'style', fragment));
    }

    // Genre Style: User selection OR suggestion
    if (selections.genre_style && typeof selections.genre_style === 'string' && selections.genre_style !== 'None') {
      const data = this.lookupData('genre_style', selections.genre_style);
      const fragment = data?.prompt_fragment || selections.genre_style;
      segments.push(createSegment(PriorityTier.MANDATORY, 'genre', fragment));
    } else if (suggestions.genreStyle) {
      // Smart suggestion as nudge
      const data = this.lookupData('genre_style', suggestions.genreStyle);
      const fragment = data?.prompt_fragment || suggestions.genreStyle;
      segments.push(createSegment(PriorityTier.MANDATORY, 'genre', fragment));
    }

    // Rendering Style: User selection OR suggestion
    if (selections.rendering_style && typeof selections.rendering_style === 'string' && selections.rendering_style !== 'None') {
      const data = this.lookupData('rendering_style', selections.rendering_style);
      const qualifier = data?.qualifiers
        ? data.qualifiers[Math.floor(Math.random() * data.qualifiers.length)]
        : selections.rendering_style;
      segments.push(createSegment(PriorityTier.MANDATORY, 'rendering', qualifier));
    } else if (suggestions.renderingStyle) {
      // Smart suggestion as nudge
      const data = this.lookupData('rendering_style', suggestions.renderingStyle);
      const qualifier = data?.qualifiers
        ? data.qualifiers[Math.floor(Math.random() * data.qualifiers.length)]
        : suggestions.renderingStyle;
      segments.push(createSegment(PriorityTier.MANDATORY, 'rendering', qualifier));
    }

    return segments;
  }

  /**
   * Build equipment/outfit segments with gear quality injection and fantasy context.
   * Adds medieval/fantasy keywords to prevent modern clothing interpretation.
   */
  private buildEquipmentSegments(
    selections: Selections,
    statLevels: StatLevels,
    model: Model
  ): PromptSegment[] {
    const segments: PromptSegment[] = [];
    const isFantasy = this.detectFantasyContext(selections);

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
        // Add fantasy context for clothing to prevent modern interpretation
        const fantasyPrefix = isFantasy && model !== 'FLUX' ? 'medieval, ' : '';
        const fluxPrefix = model === 'FLUX' ? 'wearing ' : '';
        const contextualPrefix = isFantasy && model === 'FLUX' ? 'wearing medieval fantasy ' : fluxPrefix;

        segments.push(createSegment(
          PriorityTier.DETAILS,
          'outfit',
          fantasyPrefix + contextualPrefix + outfitParts.join(', '),
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
        // Add fantasy context for equipment to prevent modern interpretation
        const fantasyPrefix = isFantasy && model !== 'FLUX' ? 'medieval, ' : '';
        const fluxPrefix = model === 'FLUX' ? 'clad in ' : '';
        const contextualPrefix = isFantasy && model === 'FLUX' ? 'clad in medieval fantasy ' : fluxPrefix;

        segments.push(createSegment(
          PriorityTier.DETAILS,
          'equipment',
          fantasyPrefix + contextualPrefix + equipParts.join(', '),
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

    // Framing: user choice > auto-suggestion
    const framing = selections.framing || suggestions.framing || '';
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
