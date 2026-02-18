import type { Selections } from '../types';
import type { SimpleSelections } from './randomizer';

/**
 * Synchronize slider values to control values
 * Non-forcing: respects user overrides
 *
 * @param sliders - Current slider values
 * @param dataCache - Loaded data for controls
 * @param overrides - Set of control IDs that user has manually changed
 * @returns Partial selections to update (only non-overridden controls)
 */
export function syncSlidersToControls(
  sliders: SimpleSelections,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dataCache: Record<string, any>,
  overrides: Set<string>
): Partial<Selections> {
  const updates: Partial<Selections> = {};

  // === PHYSICAL STATS ===

  // Strength → muscle
  if (!overrides.has('muscle')) {
    const muscleData = dataCache.muscle;
    if (muscleData && sliders.strength) {
      const levelData = muscleData[sliders.strength.toString()];
      if (levelData) {
        updates.muscle = {
          level: sliders.strength,
          qualifier: pickRandomQualifier(levelData.qualifiers)
        };
      }
    }
  }

  // Constitution → body_fat (INVERSE)
  if (!overrides.has('body_fat')) {
    const bodyFatData = dataCache.body_fat;
    if (bodyFatData && sliders.constitution) {
      const bodyFatLevel = 6 - sliders.constitution; // Invert: CON 1 → Fat 5
      const levelData = bodyFatData[bodyFatLevel.toString()];
      if (levelData) {
        updates.body_fat = {
          level: bodyFatLevel,
          qualifier: pickRandomQualifier(levelData.qualifiers)
        };
      }
    }
  }

  // Dexterity → pose (filter by category)
  if (!overrides.has('pose')) {
    const poses = dataCache.pose;
    if (Array.isArray(poses) && poses.length > 0 && sliders.dexterity) {
      const filteredPoses = filterPosesByDexterity(poses, sliders.dexterity);
      if (filteredPoses.length > 0) {
        updates.pose = (pickRandom(filteredPoses) as any).name;
      }
    }
  }

  // Age → age
  if (!overrides.has('age')) {
    const ageData = dataCache.age;
    if (ageData && sliders.age) {
      const levelData = ageData[sliders.age.toString()];
      if (levelData) {
        updates.age = {
          level: sliders.age,
          qualifier: pickRandomQualifier(levelData.qualifiers)
        };
      }
    }
  }

  // === MENTAL/SOCIAL STATS ===

  // Intelligence → facial_features + demeanor
  if (!overrides.has('facial_features')) {
    if (sliders.intelligence) {
      const feature = getFacialFeatureForInt(sliders.intelligence);
      if (feature) {
        updates.facial_features = feature;
      }
    }
  }

  if (!overrides.has('demeanor')) {
    const demeanorData = dataCache.demeanor;
    if (demeanorData && sliders.intelligence && sliders.charisma) {
      // Demeanor based on INT + CHA average
      const avgMental = Math.floor((sliders.intelligence + sliders.charisma) / 2);
      const demeanorLevel = Math.max(1, Math.min(5, avgMental));
      const levelData = demeanorData[demeanorLevel.toString()];
      if (levelData) {
        updates.demeanor = {
          level: demeanorLevel,
          qualifier: pickRandomQualifier(levelData.qualifiers)
        };
      }
    }
  }

  // Charisma → attractiveness
  if (!overrides.has('attractiveness')) {
    const attractivenessData = dataCache.attractiveness;
    if (attractivenessData && sliders.charisma) {
      const levelData = attractivenessData[sliders.charisma.toString()];
      if (levelData) {
        updates.attractiveness = {
          level: sliders.charisma,
          qualifier: pickRandomQualifier(levelData.qualifiers)
        };
      }
    }
  }

  // === COMPOSITIONAL CONTROLS ===

  // TODO: Camera → framing (camera slider not yet implemented)
  // TODO: Style → aesthetic (style slider not yet implemented)
  // TODO: Expression → expressions (expression slider not yet implemented)

  return updates;
}

/**
 * Filter poses by dexterity level
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function filterPosesByDexterity(poses: any[], dexterity: number): any[] {
  if (dexterity <= 1) {
    // Clumsy - static, seated poses
    return poses.filter(p =>
      ['neutral', 'seated', 'relaxed', 'social'].includes(p.category)
    );
  } else if (dexterity === 2) {
    // Stiff - basic combat stances, no acrobatics
    return poses.filter(p =>
      ['neutral', 'combat', 'social'].includes(p.category) &&
      !['Spinning Attack', 'Leaping Through Air', 'Backflip'].some(term =>
        p.name?.includes(term)
      )
    );
  } else if (dexterity === 3) {
    // Average - general poses (avoid extremes)
    return poses.filter(p =>
      ['neutral', 'action', 'social', 'stealth'].includes(p.category) &&
      !['Leaping', 'Backflip', 'Acrobatic'].some(term =>
        p.name?.includes(term)
      )
    );
  } else if (dexterity === 4) {
    // Agile - action poses
    return poses.filter(p =>
      ['action', 'stealth', 'combat'].includes(p.category)
    );
  } else {
    // Acrobatic - dynamic, athletic poses
    return poses.filter(p =>
      p.name?.toLowerCase().includes('leap') ||
      p.name?.toLowerCase().includes('flip') ||
      p.name?.toLowerCase().includes('spin') ||
      p.name?.toLowerCase().includes('acrobatic') ||
      ['action', 'combat'].includes(p.category)
    );
  }
}

/**
 * Get facial feature based on intelligence
 */
function getFacialFeatureForInt(intelligence: number): string {
  const features: Record<number, string> = {
    1: 'Vacant Stare',
    2: 'Dull Eyes',
    3: '', // Average - no special feature
    4: 'Perceptive Eyes, Sharp Gaze',
    5: 'Wise Eyes, Keen Features, Intellectual Bearing'
  };
  return features[intelligence] || '';
}

/**
 * Pick random item from array
 */
function pickRandom<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * Pick random qualifier from array
 */
function pickRandomQualifier(qualifiers: string[]): string {
  if (!qualifiers || qualifiers.length === 0) return '';
  return pickRandom(qualifiers);
}

/**
 * Check if a control should be synced based on slider changes
 * Returns list of control IDs that need updating
 */
export function getAffectedControls(
  changedSlider: keyof SimpleSelections,
  overrides: Set<string>
): string[] {
  const affectedMap: Record<keyof SimpleSelections, string[]> = {
    strength: ['muscle'],
    dexterity: ['pose'],
    constitution: ['body_fat'],
    age: ['age'],
    intelligence: ['facial_features', 'demeanor'],
    charisma: ['attractiveness', 'demeanor'],
    // TODO: Not yet implemented
    // camera: ['framing'],
    // style: ['aesthetic'],
    // expression: ['expressions']
  };

  const affected = affectedMap[changedSlider] || [];
  // Only return controls that aren't overridden
  return affected.filter(controlId => !overrides.has(controlId));
}
