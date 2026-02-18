/**
 * Phase 2: Detail Layer Validation
 * Validates equipment, poses, and features against stat foundation.
 * Issues warnings for contradictions but respects user choices.
 */

import type { Selections } from '../../types';
import type { StatLevels, ValidationWarning } from './types';
import {
  EQUIPMENT_WEIGHT_CLASSES,
  EQUIPMENT_SLOTS,
  QUALITY_ADJECTIVES_TO_STRIP,
  GEAR_QUALITY_PREFIXES,
} from './constants';
import type { Model } from '../../types';

/**
 * Strip hardcoded quality adjectives from an equipment description.
 * Returns a quality-neutral version.
 */
export function stripQualityAdjectives(description: string): string {
  let result = description;
  for (const adj of QUALITY_ADJECTIVES_TO_STRIP) {
    // Remove the adjective and any following comma/space
    result = result.replace(
      new RegExp(`\\b${adj},?\\s*`, 'gi'),
      ''
    );
  }
  // Clean up doubled spaces and leading commas
  result = result.replace(/\s{2,}/g, ' ').trim();
  result = result.replace(/^,\s*/, '');
  return result;
}

/**
 * Inject gear quality adjective into an equipment description.
 */
export function injectGearQuality(
  description: string,
  gearQualityLevel: number,
  model: Model
): string {
  const stripped = stripQualityAdjectives(description);
  const prefixes = GEAR_QUALITY_PREFIXES[gearQualityLevel];
  if (!prefixes || prefixes.length === 0) return stripped;

  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];

  if (model === 'FLUX') {
    // Natural language: "a rusty steel breastplate"
    return stripped.replace(/^(an?\s+)/i, `$1${prefix} `);
  } else {
    // Tag-based: prepend quality tag
    return `${prefix} ${stripped}`;
  }
}

/**
 * Validate all detail layers against the stat foundation.
 * Returns warnings and cleaned selections.
 */
export function validateDetails(
  selections: Selections,
  statLevels: StatLevels,
  dataCache: Record<string, unknown>
): {
  validatedSelections: Selections;
  warnings: ValidationWarning[];
} {
  const warnings: ValidationWarning[] = [];
  const validated = { ...selections };

  // Equipment weight check
  for (const slotKey of EQUIPMENT_SLOTS) {
    const equipped = selections[slotKey] as string | undefined;
    if (!equipped || equipped === 'None') continue;

    const weightClass = EQUIPMENT_WEIGHT_CLASSES[equipped] || 'none';
    if (weightClass === 'heavy' && statLevels.muscle < 3) {
      warnings.push({
        severity: 'warn',
        message: `${equipped} is heavy equipment on a character with STR ${statLevels.muscle}. This may look unrealistic.`,
        conflictingItems: [equipped, `STR=${statLevels.muscle}`],
        suggestion: 'Consider lighter alternatives like Leather Jerkin or remove the heavy gear.',
      });
    }
    if (weightClass === 'medium' && statLevels.muscle < 2) {
      warnings.push({
        severity: 'info',
        message: `${equipped} is medium-weight equipment on a very weak character (STR ${statLevels.muscle}).`,
        conflictingItems: [equipped, `STR=${statLevels.muscle}`],
      });
    }
  }

  // Pose agility check
  if (selections.pose && typeof selections.pose === 'string') {
    const poses = dataCache['pose'] as Array<{ name: string; category: string }> | undefined;
    const poseData = poses?.find((p) => p.name === selections.pose);
    if (poseData) {
      const isAcrobatic = poseData.category === 'action' || poseData.category === 'stealth';
      const poseName = selections.pose.toLowerCase();
      const isExtremelyAcrobatic = poseName.includes('backflip') ||
        poseName.includes('leap') || poseName.includes('acrobatic');

      if (isExtremelyAcrobatic && statLevels.dexterity < 4) {
        warnings.push({
          severity: 'warn',
          message: `"${selections.pose}" requires high agility, but DEX is ${statLevels.dexterity}.`,
          conflictingItems: [selections.pose, `DEX=${statLevels.dexterity}`],
          suggestion: 'Consider a less acrobatic pose like Standing Resolutely.',
        });
      } else if (isAcrobatic && statLevels.dexterity < 3) {
        warnings.push({
          severity: 'info',
          message: `"${selections.pose}" involves agility, but DEX is only ${statLevels.dexterity}.`,
          conflictingItems: [selections.pose, `DEX=${statLevels.dexterity}`],
        });
      }
    }
  }

  // Facial feature vs age check
  if (selections.facial_features && typeof selections.facial_features === 'string') {
    const youthFeatures = ['Full Cheeks', 'Freckles'];
    const elderFeatures = ["Crow's Feet", 'Deep Wrinkles'];

    if (youthFeatures.includes(selections.facial_features) && statLevels.age >= 4) {
      warnings.push({
        severity: 'info',
        message: `"${selections.facial_features}" is unusual for age level ${statLevels.age} (elderly).`,
        conflictingItems: [selections.facial_features, `AGE=${statLevels.age}`],
      });
    }
    if (elderFeatures.includes(selections.facial_features) && statLevels.age <= 1) {
      warnings.push({
        severity: 'info',
        message: `"${selections.facial_features}" is unusual for a young character (AGE ${statLevels.age}).`,
        conflictingItems: [selections.facial_features, `AGE=${statLevels.age}`],
      });
    }
  }

  return { validatedSelections: validated, warnings };
}
