import type { Selections } from '../types';
import type { SimpleSelections } from './randomizer';

export interface ContradictionRule {
  id: string;
  severity: 'error' | 'warning' | 'info';
  condition: (selections: Selections, sliders: SimpleSelections) => boolean;
  message: string;
  suggestion?: string;
  autoResolve?: (selections: Selections, sliders: SimpleSelections) => Selections;
}

// Helper functions for checking selections
function getMuscleLevel(selections: Selections): number | null {
  const muscle = selections.muscle as { level?: number } | undefined;
  if (!muscle || typeof muscle !== 'object') return null;
  return muscle.level || null;
}

function getBodyFatLevel(selections: Selections): number | null {
  const bodyFat = selections.body_fat as { level?: number } | undefined;
  if (!bodyFat || typeof bodyFat !== 'object') return null;
  return bodyFat.level || null;
}

function getAgeLevel(selections: Selections): number | null {
  const age = selections.age as { level?: number } | undefined;
  if (!age || typeof age !== 'object') return null;
  return age.level || null;
}

function getAttractiveness(selections: Selections): number | null {
  const attr = selections.attractiveness as { level?: number } | undefined;
  if (!attr || typeof attr !== 'object') return null;
  return attr.level || null;
}

function hasPoseCategory(selections: Selections, categories: string[]): boolean {
  const poseName = selections.pose as string | undefined;
  if (!poseName || typeof poseName !== 'string') return false;

  const lowerPose = poseName.toLowerCase();

  // Map categories to keywords for detection
  const categoryKeywords: Record<string, string[]> = {
    'acrobatic': ['leap', 'flip', 'spin', 'acrobatic', 'backflip', 'somersault', 'vault'],
    'dynamic': ['leap', 'flip', 'spin', 'acrobatic', 'backflip', 'somersault', 'vault', 'running', 'jumping'],
    'combat': ['combat', 'attack', 'swing', 'strike', 'defend', 'weapon', 'fighting', 'battle'],
    'stealth': ['sneak', 'crouch', 'hide', 'prowl', 'lurking', 'shadowy'],
    'static': ['standing', 'sitting', 'kneeling', 'resting'],
    'social': ['conversing', 'gesturing', 'presenting', 'bowing']
  };

  return categories.some(cat => {
    const keywords = categoryKeywords[cat.toLowerCase()] || [];
    return keywords.some(keyword => lowerPose.includes(keyword));
  });
}

function hasFacialFeature(selections: Selections, features: string[]): boolean {
  const facialFeatures = selections.facial_features as string | undefined;
  if (!facialFeatures || typeof facialFeatures !== 'string') return false;

  const lowerFeatures = facialFeatures.toLowerCase();
  return features.some(feature => lowerFeatures.includes(feature.toLowerCase()));
}

function hasHairColor(selections: Selections, colors: string[]): boolean {
  const hairColor = selections.hair_color as string | undefined;
  if (!hairColor || typeof hairColor !== 'string') return false;

  const lowerColor = hairColor.toLowerCase();
  return colors.some(color => lowerColor.includes(color.toLowerCase()));
}

function hasSkinQuality(selections: Selections, qualities: string[]): boolean {
  const skin = selections.skin as { qualifier?: string } | undefined;
  if (!skin || typeof skin !== 'object') return false;

  const qualifier = skin.qualifier?.toLowerCase() || '';
  return qualities.some(quality => qualifier.includes(quality.toLowerCase()));
}

// Contradiction rules
const contradictionRules: ContradictionRule[] = [
  // ===== PHYSICAL IMPOSSIBILITIES (ERROR) =====

  {
    id: 'frail-acrobatic',
    severity: 'error',
    condition: (selections, sliders) => {
      // Frail constitution (1-2) + Acrobatic dexterity (5) + dynamic poses
      return sliders.constitution <= 2 &&
             sliders.dexterity === 5 &&
             hasPoseCategory(selections, ['acrobatic', 'dynamic']);
    },
    message: 'Frail constitution cannot support acrobatic movements',
    suggestion: 'Increase Constitution to 3+ for acrobatic poses, or reduce Dexterity',
    autoResolve: (selections, _sliders) => {
      // Remove acrobatic pose, keep frail build
      return { ...selections, pose: 'Standing Resolutely' };
    }
  },

  {
    id: 'low-str-high-muscle',
    severity: 'error',
    condition: (selections, sliders) => {
      // Low strength (1-2) + high muscle level (4-5)
      const muscleLevel = getMuscleLevel(selections);
      return sliders.strength <= 2 && muscleLevel !== null && muscleLevel >= 4;
    },
    message: 'Low strength cannot produce bodybuilder muscle mass',
    suggestion: 'Increase Strength to 4+ for high muscle, or reduce muscle level',
    autoResolve: (selections, sliders) => {
      // Set muscle to match low strength
      return {
        ...selections,
        muscle: { level: sliders.strength, qualifier: sliders.strength === 1 ? 'slender' : 'lean' }
      };
    }
  },

  {
    id: 'lean-obese',
    severity: 'error',
    condition: (selections, sliders) => {
      // Very lean body fat (1) + high body fat level (4-5)
      const bodyFatLevel = getBodyFatLevel(selections);
      return bodyFatLevel !== null && bodyFatLevel >= 4 && sliders.constitution >= 4;
    },
    message: 'High constitution (lean) conflicts with high body fat',
    suggestion: 'Constitution determines body fat: High CON = Low fat, Low CON = High fat',
    autoResolve: (selections, sliders) => {
      // Set body fat to inverse of constitution
      const correctBodyFat = 6 - sliders.constitution;
      return {
        ...selections,
        body_fat: {
          level: correctBodyFat,
          qualifier: correctBodyFat <= 2 ? 'lean' : correctBodyFat >= 4 ? 'heavy' : 'average'
        }
      };
    }
  },

  {
    id: 'no-muscle-bodybuilder',
    severity: 'error',
    condition: (selections, sliders) => {
      // Minimal strength (1) + bodybuilder muscle definition
      const muscleLevel = getMuscleLevel(selections);
      return sliders.strength === 1 && muscleLevel !== null && muscleLevel === 5;
    },
    message: 'Minimal strength cannot have bodybuilder physique',
    suggestion: 'Strength 1 requires minimal muscle mass',
    autoResolve: (selections, _sliders) => {
      return {
        ...selections,
        muscle: { level: 1, qualifier: 'slender' }
      };
    }
  },

  // ===== LOGICAL CONFLICTS (ERROR) =====

  {
    id: 'low-int-wise-features',
    severity: 'error',
    condition: (selections, sliders) => {
      // Low intelligence (1-2) + wise/perceptive facial features
      return sliders.intelligence <= 2 &&
             hasFacialFeature(selections, ['wise', 'perceptive', 'keen', 'intellectual', 'sharp gaze']);
    },
    message: 'Low intelligence conflicts with wise/perceptive features',
    suggestion: 'Increase Intelligence to 4+ for wise features, or change facial features',
    autoResolve: (selections, sliders) => {
      // Set facial features to match low intelligence
      const feature = sliders.intelligence === 1 ? 'Vacant Stare' : 'Dull Eyes';
      return { ...selections, facial_features: feature };
    }
  },

  {
    id: 'high-cha-ugly-features',
    severity: 'error',
    condition: (selections, sliders) => {
      // High charisma (5) + ugly/disfigured features
      const attractiveness = getAttractiveness(selections);
      return sliders.charisma === 5 && attractiveness !== null && attractiveness <= 2;
    },
    message: 'High charisma conflicts with low attractiveness',
    suggestion: 'Charisma slider directly controls attractiveness',
    autoResolve: (selections, sliders) => {
      return {
        ...selections,
        attractiveness: { level: sliders.charisma, qualifier: 'beautiful' }
      };
    }
  },

  {
    id: 'young-gray-hair',
    severity: 'error',
    condition: (selections, sliders) => {
      // Young age (1-2) + gray/white hair
      const ageLevel = getAgeLevel(selections);
      return (sliders.age <= 2 || (ageLevel !== null && ageLevel <= 2)) &&
             hasHairColor(selections, ['gray', 'grey', 'white']);
    },
    message: 'Young characters cannot have gray or white hair',
    suggestion: 'Change age to 4+ for gray hair, or change hair color',
    autoResolve: (selections, _sliders) => {
      // Change hair color to age-appropriate
      const colors = ['black', 'brown', 'blonde', 'red', 'auburn'];
      return {
        ...selections,
        hair_color: colors[Math.floor(Math.random() * colors.length)]
      };
    }
  },

  {
    id: 'elderly-youthful-skin',
    severity: 'error',
    condition: (selections, sliders) => {
      // Elderly age (5) + youthful/smooth skin
      const ageLevel = getAgeLevel(selections);
      return (sliders.age === 5 || (ageLevel !== null && ageLevel === 5)) &&
             hasSkinQuality(selections, ['smooth', 'youthful', 'flawless', 'unblemished']);
    },
    message: 'Elderly characters cannot have smooth, youthful skin',
    suggestion: 'Elderly age requires weathered or aged skin quality',
    autoResolve: (selections, _sliders) => {
      return {
        ...selections,
        skin: { level: 1, qualifier: 'weathered' }
      };
    }
  },

  // ===== BIOMECHANICAL ISSUES (WARNING) =====

  {
    id: 'low-con-acrobatic-pose',
    severity: 'warning',
    condition: (selections, sliders) => {
      // Low constitution (1-2) + acrobatic poses
      return sliders.constitution <= 2 &&
             hasPoseCategory(selections, ['acrobatic', 'dynamic']);
    },
    message: 'Low constitution makes acrobatic poses difficult to maintain',
    suggestion: 'Consider increasing Constitution or choosing less demanding poses',
    autoResolve: (selections, _sliders) => {
      // Suggest a neutral pose
      return { ...selections, pose: 'Standing Resolutely' };
    }
  },

  {
    id: 'high-fat-high-muscle-def',
    severity: 'warning',
    condition: (selections, _sliders) => {
      // High body fat (4-5) + athletic muscle definition (4-5)
      const bodyFatLevel = getBodyFatLevel(selections);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const muscleDefLevel = (selections.muscle_definition as any)?.level;
      return bodyFatLevel !== null && bodyFatLevel >= 4 &&
             muscleDefLevel !== null && muscleDefLevel >= 4;
    },
    message: 'High body fat typically obscures muscle definition',
    suggestion: 'Strongman build (high fat + high muscle) should have lower definition (1-2)',
    autoResolve: (selections, _sliders) => {
      // Set muscle definition to match strongman build
      return {
        ...selections,
        muscle_definition: { level: 2, qualifier: 'softly defined' }
      };
    }
  },

  {
    id: 'low-str-heavy-gear',
    severity: 'warning',
    condition: (selections, sliders) => {
      // Low strength (1-2) + heavy weapons/armor
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const gearQuality = (selections.gear_quality as any)?.level;
      return sliders.strength <= 2 && gearQuality !== null && gearQuality >= 4;
    },
    message: 'Low strength may struggle with heavy, high-quality gear',
    suggestion: 'Consider lighter equipment or increasing Strength',
    autoResolve: (selections, _sliders) => {
      // Reduce gear quality
      return {
        ...selections,
        gear_quality: { level: 2, qualifier: 'basic' }
      };
    }
  },

  {
    id: 'frail-heavy-equipment',
    severity: 'warning',
    condition: (selections, sliders) => {
      // Frail (low STR + low CON) + any heavy equipment
      return !!(sliders.strength <= 2 && sliders.constitution <= 2 &&
             (selections.equipment_back || selections.equipment_chest));
    },
    message: 'Frail build may be burdened by heavy equipment',
    suggestion: 'Frail characters work best with minimal or light equipment',
    autoResolve: (selections, _sliders) => {
      // Remove heavy equipment
      const updated = { ...selections };
      delete updated.equipment_back;
      delete updated.equipment_chest;
      return updated;
    }
  },

  // ===== CONTEXTUAL ODDITIES (INFO) =====

  {
    id: 'strongman-build',
    severity: 'info',
    condition: (_selections, sliders) => {
      // High strength (5) + High body fat (4-5) = Valid strongman build
      const bodyFatLevel = getBodyFatLevel(_selections);
      return sliders.strength === 5 && bodyFatLevel !== null && bodyFatLevel >= 4;
    },
    message: 'Strongman build detected (high strength + high body fat)',
    suggestion: 'This is a valid physique! Powerlifters and strongmen often have this build.'
  },

  {
    id: 'elderly-combat',
    severity: 'info',
    condition: (selections, sliders) => {
      // Elderly (5) + combat pose = Valid veteran
      const ageLevel = getAgeLevel(selections);
      const pose = selections.pose as string | undefined;
      return !!((sliders.age === 5 || (ageLevel !== null && ageLevel === 5)) &&
             pose &&
             typeof pose === 'string' &&
             (pose.toLowerCase().includes('combat') ||
              pose.toLowerCase().includes('weapon')));
    },
    message: 'Veteran warrior detected (elderly + combat stance)',
    suggestion: 'This is valid! Experienced veterans can be elderly and still formidable.'
  },

  {
    id: 'high-dex-low-str',
    severity: 'info',
    condition: (_selections, sliders) => {
      // High dexterity (5) + Low strength (1-2) = Valid acrobat/rogue
      return sliders.dexterity === 5 && sliders.strength <= 2;
    },
    message: 'Acrobat/rogue build detected (high dex, low strength)',
    suggestion: 'This is valid! Rogues, acrobats, and dancers often prioritize agility over strength.'
  },

  {
    id: 'low-cha-high-int',
    severity: 'info',
    condition: (_selections, sliders) => {
      // Low charisma (1-2) + High intelligence (5) = Valid scholar/sage
      return sliders.charisma <= 2 && sliders.intelligence === 5;
    },
    message: 'Scholar archetype detected (high intelligence, low charisma)',
    suggestion: 'This is valid! Brilliant scholars may lack social graces.'
  }
];

/**
 * Detect all contradictions in current selections
 */
export function detectContradictions(
  selections: Selections,
  sliders: SimpleSelections
): ContradictionRule[] {
  const detected: ContradictionRule[] = [];

  for (const rule of contradictionRules) {
    if (rule.condition(selections, sliders)) {
      detected.push(rule);
    }
  }

  return detected;
}

/**
 * Resolve a single contradiction by applying its auto-resolve function
 */
export function resolveContradiction(
  rule: ContradictionRule,
  selections: Selections,
  sliders: SimpleSelections
): Selections {
  if (!rule.autoResolve) {
    return selections;
  }

  return rule.autoResolve(selections, sliders);
}

/**
 * Auto-resolve all ERROR-level contradictions
 */
export function autoResolveErrors(
  selections: Selections,
  sliders: SimpleSelections
): { selections: Selections; resolved: string[] } {
  let currentSelections = { ...selections };
  const resolved: string[] = [];

  const contradictions = detectContradictions(currentSelections, sliders);
  const errors = contradictions.filter(c => c.severity === 'error');

  for (const error of errors) {
    if (error.autoResolve) {
      currentSelections = error.autoResolve(currentSelections, sliders);
      resolved.push(error.id);
    }
  }

  return { selections: currentSelections, resolved };
}

/**
 * Get a safe default value for a control based on slider values
 */
export function getSafeSuggestion(
  sliderKey: keyof SimpleSelections,
  sliderValue: number,
  _allSliders: SimpleSelections
): unknown {
  switch (sliderKey) {
    case 'strength':
      // Muscle level should match strength
      return { level: sliderValue, qualifier: getMuscleQualifier(sliderValue) };

    case 'constitution': {
      // Body fat is inverse of constitution
      const bodyFat = 6 - sliderValue;
      return { level: bodyFat, qualifier: getBodyFatQualifier(bodyFat) };
    }

    case 'dexterity':
      // Pose based on dexterity
      return getPoseSuggestion(sliderValue);

    case 'age':
      return { level: sliderValue, qualifier: getAgeQualifier(sliderValue) };

    case 'intelligence':
      return getFacialFeatureSuggestion(sliderValue);

    case 'charisma':
      return { level: sliderValue, qualifier: getAttractivenessQualifier(sliderValue) };

    default:
      return null;
  }
}

// Helper functions for safe suggestions
function getMuscleQualifier(level: number): string {
  const qualifiers = ['slender', 'lean', 'balanced', 'well-defined', 'massive'];
  return qualifiers[level - 1] || 'balanced';
}

function getBodyFatQualifier(level: number): string {
  const qualifiers = ['very lean', 'lean', 'average', 'heavy', 'very heavy'];
  return qualifiers[level - 1] || 'average';
}

function getAgeQualifier(level: number): string {
  const qualifiers = ['youthful', 'young', 'middle-aged', 'mature', 'elderly'];
  return qualifiers[level - 1] || 'middle-aged';
}

function getAttractivenessQualifier(level: number): string {
  const qualifiers = ['plain', 'unremarkable', 'average', 'attractive', 'beautiful'];
  return qualifiers[level - 1] || 'average';
}

function getPoseSuggestion(dexterity: number): string {
  const poses = [
    'Sitting Comfortably',    // DEX 1
    'Standing Resolutely',    // DEX 2
    'Walking Confidently',    // DEX 3
    'Running Swiftly',        // DEX 4
    'Leaping Through Air'     // DEX 5
  ];
  return poses[dexterity - 1] || 'Standing Resolutely';
}

function getFacialFeatureSuggestion(intelligence: number): string {
  const features = [
    'Vacant Stare',                               // INT 1
    'Dull Eyes',                                  // INT 2
    '',                                           // INT 3 (average)
    'Perceptive Eyes, Sharp Gaze',                // INT 4
    'Wise Eyes, Keen Features, Intellectual Bearing' // INT 5
  ];
  return features[intelligence - 1] || '';
}
