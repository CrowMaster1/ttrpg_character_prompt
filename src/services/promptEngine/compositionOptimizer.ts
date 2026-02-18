/**
 * Phase 3: Composition Optimization
 * Auto-suggests camera angles, lighting, framing, and style based on stat profiles.
 * User selections always override auto-suggestions.
 *
 * These are "nudges" to help users get better results without forcing choices.
 */

import type { StatLevels } from './types';

interface CompositionSuggestion {
  cameraAngle?: string;
  lighting?: string;
  framing?: string;
  aesthetic?: string;
  genreStyle?: string;
  renderingStyle?: string;
  reasoning?: string;  // Why these suggestions were made
}

/**
 * Suggest composition elements based on stat profile.
 * These are suggestions only -- user selections always take priority.
 *
 * Best practices incorporated:
 * - High CHA → portrait focus, flattering angles/lighting
 * - High STR → low angles, dramatic lighting to show muscle
 * - High DEX → dynamic angles, sharp focus
 * - High INT → volumetric lighting, detailed rendering
 * - Low CHA → avoid close-ups, use atmospheric lighting
 * - Extreme ages → appropriate lighting (soft for young, dramatic for old)
 */
export function suggestComposition(statLevels: StatLevels): CompositionSuggestion {
  const suggestion: CompositionSuggestion = {};
  const reasons: string[] = [];

  // ========================================
  // STYLE SUGGESTIONS (Most Important - appears first in prompt)
  // ========================================

  // Aesthetic suggestions based on character archetype
  if (statLevels.muscle >= 4 && statLevels.attractiveness >= 4) {
    suggestion.aesthetic = 'Epic Fantasy Art';
    reasons.push('heroic character');
  } else if (statLevels.attractiveness >= 4 && statLevels.age <= 2) {
    suggestion.aesthetic = 'Romantic Fantasy';
    reasons.push('young and beautiful');
  } else if (statLevels.intelligence >= 4) {
    suggestion.aesthetic = 'Dark Fantasy';
    reasons.push('scholarly character');
  } else if (statLevels.attractiveness <= 2 || statLevels.age >= 4) {
    suggestion.aesthetic = 'Gritty Realism';
    reasons.push('weathered character');
  } else {
    suggestion.aesthetic = 'Traditional Fantasy';
    reasons.push('balanced character');
  }

  // Genre style is always medieval fantasy for TTRPG
  suggestion.genreStyle = 'Medieval Fantasy';

  // Rendering style based on character type
  if (statLevels.attractiveness >= 4) {
    suggestion.renderingStyle = 'Oil Painting';  // Rich, flattering
    reasons.push('emphasize beauty');
  } else if (statLevels.muscle >= 4) {
    suggestion.renderingStyle = 'Ink and Watercolor';  // Dynamic, bold
    reasons.push('show strength');
  } else if (statLevels.intelligence >= 4 || statLevels.age >= 4) {
    suggestion.renderingStyle = 'Digital Painting';  // Detailed, refined
    reasons.push('show detail and wisdom');
  } else {
    suggestion.renderingStyle = 'Pencil Sketch';  // Versatile default
  }

  // ========================================
  // CAMERA ANGLE SUGGESTIONS
  // ========================================

  if (statLevels.muscle >= 4) {
    suggestion.cameraAngle = 'Low Angle';       // Heroic, imposing
    reasons.push('emphasize strength from below');
  } else if (statLevels.muscle <= 2) {
    suggestion.cameraAngle = 'High Angle';       // Vulnerable, small
    reasons.push('show vulnerability');
  } else if (statLevels.attractiveness >= 4) {
    suggestion.cameraAngle = 'Eye Level';        // Flattering, neutral
    reasons.push('flattering angle for beauty');
  } else if (statLevels.attractiveness <= 2) {
    suggestion.cameraAngle = 'Dutch Angle';      // Unsettling, off-kilter
    reasons.push('add dramatic tension');
  } else if (statLevels.dexterity >= 4) {
    suggestion.cameraAngle = 'Dynamic Angle';    // Action-oriented
    reasons.push('capture agility');
  } else if (statLevels.age >= 4) {
    suggestion.cameraAngle = 'Slightly Low';     // Respectful, dignified
    reasons.push('show wisdom and experience');
  }

  // ========================================
  // LIGHTING SUGGESTIONS (Critical for mood and detail)
  // ========================================

  // Young & beautiful → golden hour (warm, flattering)
  if (statLevels.attractiveness >= 4 && statLevels.age <= 2) {
    suggestion.lighting = 'Golden Hour';
    reasons.push('warm flattering light for youth');
  }
  // Attractive & experienced → Rembrandt (dignified, dimensional)
  else if (statLevels.attractiveness >= 4 && statLevels.age >= 4) {
    suggestion.lighting = 'Rembrandt Lighting';
    reasons.push('dignified light for experienced beauty');
  }
  // Low attractiveness → low key (hide flaws, add mystery)
  else if (statLevels.attractiveness <= 2) {
    suggestion.lighting = 'Low Key Lighting';
    reasons.push('shadows hide imperfections');
  }
  // Strong & attractive → dramatic (show muscles)
  else if (statLevels.muscle >= 4 && statLevels.attractiveness >= 3) {
    suggestion.lighting = 'Dramatic Lighting';
    reasons.push('highlight muscle definition');
  }
  // Intelligent → volumetric (mystical, scholarly)
  else if (statLevels.intelligence >= 4) {
    suggestion.lighting = 'Volumetric Lighting';
    reasons.push('mystical atmosphere for intellect');
  }
  // Old → candlelight (warm, appropriate for age)
  else if (statLevels.age >= 4) {
    suggestion.lighting = 'Candlelight';
    reasons.push('warm intimate light for elder');
  }
  // Very young → soft diffused (gentle, protective)
  else if (statLevels.age <= 1) {
    suggestion.lighting = 'Soft Diffused Light';
    reasons.push('gentle light for youth');
  }
  // Nimble/dextrous → edge lighting (show movement)
  else if (statLevels.dexterity >= 4) {
    suggestion.lighting = 'Edge Lighting';
    reasons.push('define agile form');
  }
  // Default fallback
  else {
    suggestion.lighting = 'Natural Daylight';
    reasons.push('neutral versatile light');
  }

  // ========================================
  // FRAMING SUGGESTIONS
  // ========================================

  // Very attractive → portrait (show face)
  if (statLevels.attractiveness >= 4) {
    suggestion.framing = 'Portrait Shot';
    reasons.push('showcase attractive features');
  }
  // Muscular → cowboy shot (show physique)
  else if (statLevels.muscle >= 4) {
    suggestion.framing = 'Cowboy Shot';
    reasons.push('show powerful build');
  }
  // Dextrous → full body (show stance)
  else if (statLevels.dexterity >= 4) {
    suggestion.framing = 'Full Body Shot';
    reasons.push('capture dynamic pose');
  }
  // Old or intelligent → medium close-up (show wisdom in face)
  else if (statLevels.age >= 4 || statLevels.intelligence >= 4) {
    suggestion.framing = 'Medium Close-up';
    reasons.push('emphasize experience and wisdom');
  }
  // Default → medium shot (versatile)
  else {
    suggestion.framing = 'Medium Shot';
    reasons.push('balanced versatile framing');
  }

  // Add reasoning summary
  if (reasons.length > 0) {
    suggestion.reasoning = reasons.join(', ');
  }

  return suggestion;
}
