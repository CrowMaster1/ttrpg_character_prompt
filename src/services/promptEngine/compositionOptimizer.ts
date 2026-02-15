/**
 * Phase 3: Composition Optimization
 * Auto-suggests camera angles, lighting, and framing based on stat profiles.
 * User selections always override auto-suggestions.
 */

import type { StatLevels } from './types';

interface CompositionSuggestion {
  cameraAngle?: string;
  lighting?: string;
  framing?: string;
}

/**
 * Suggest composition elements based on stat profile.
 * These are suggestions only -- user selections always take priority.
 */
export function suggestComposition(statLevels: StatLevels): CompositionSuggestion {
  const suggestion: CompositionSuggestion = {};

  // Camera angle suggestions based on stat profile
  if (statLevels.muscle >= 4) {
    suggestion.cameraAngle = 'Low Angle';       // Heroic, imposing
  } else if (statLevels.muscle <= 2) {
    suggestion.cameraAngle = 'High Angle';       // Vulnerable, small
  } else if (statLevels.attractiveness >= 4) {
    suggestion.cameraAngle = 'Eye Level';        // Flattering
  } else if (statLevels.attractiveness <= 2) {
    suggestion.cameraAngle = 'Dutch Angle';      // Unsettling
  } else if (statLevels.age >= 4) {
    suggestion.cameraAngle = 'Close-up';         // Show age detail
  }

  // Lighting suggestions based on stat combinations
  if (statLevels.attractiveness >= 4 && statLevels.age <= 2) {
    suggestion.lighting = 'Golden Hour';
  } else if (statLevels.attractiveness >= 4 && statLevels.age >= 4) {
    suggestion.lighting = 'Rembrandt Lighting';
  } else if (statLevels.attractiveness <= 2) {
    suggestion.lighting = 'Low Key Lighting';
  } else if (statLevels.muscle >= 4 && statLevels.attractiveness >= 3) {
    suggestion.lighting = 'Dramatic Lighting';
  } else if (statLevels.intelligence >= 4) {
    suggestion.lighting = 'Volumetric Lighting';
  } else if (statLevels.age >= 4) {
    suggestion.lighting = 'Candlelight';
  } else if (statLevels.age <= 1) {
    suggestion.lighting = 'Soft Diffused Light';
  }

  // Framing suggestions
  if (statLevels.muscle >= 4) {
    suggestion.framing = 'Cowboy Shot';           // Show upper mass
  } else if (statLevels.attractiveness >= 4) {
    suggestion.framing = 'Portrait Shot';         // Flattering close-up
  }

  return suggestion;
}
