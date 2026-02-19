import type { Selections } from '../types';
import { detectContradictions, autoResolveErrors, type ContradictionRule } from './contradictionDetector';

// D&D-style stat system slider values (1-5 scale)
export interface SimpleSelections {
  // === PHYSICAL STATS (interact to create body types) ===
  strength: number;      // 1=weak, 5=very strong → muscle
  dexterity: number;     // 1=clumsy, 5=acrobatic → pose dynamism
  constitution: number;  // 1=frail, 5=athletic → body_fat (inverse)
  age: number;          // 1=young, 5=elderly → age_level

  // === MENTAL/SOCIAL STATS ===
  intelligence: number;  // 1=dim, 5=brilliant → facial features, demeanor
  charisma: number;     // 1=ugly, 5=beautiful → attractiveness, allure traits vs uncharming traits
}

// Result type for generation with contradiction detection
export interface GenerationResult {
  selections: Selections;
  contradictions: ContradictionRule[];
  resolvedErrors: string[];
}

// Helper to pick random item from array
function randomPick<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

// Helper to pick random number in range
function randomInRange(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Helper to pick random qualifier from level data
function pickQualifier(data: unknown, level: number): string {
  const levelDataMap = data as Record<string, { qualifiers?: string[]; name?: string }> | undefined;
  if (!levelDataMap) return '';

  const levelData = levelDataMap[level.toString()];
  if (!levelData) return '';

  const qualifiers = levelData.qualifiers || [];
  return qualifiers.length > 0 ? randomPick(qualifiers) : levelData.name || '';
}

/**
 * Convert simple slider selections to detailed character selections
 * Randomizes all detailed options while respecting slider constraints
 * Now includes contradiction detection and auto-resolution
 */
export function generateFromSliders(
  simple: SimpleSelections,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dataCache: Record<string, any>
): GenerationResult {
  let selections: Selections = {};

  // === BASIC INFO ===

  // Race - fully random
  const races = ['Human', 'Elf', 'Dwarf', 'Halfling', 'Half-Orc', 'Gnome', 'Tiefling', 'Dragonborn'];
  selections.race = randomPick(races);

  // Gender - random
  const genders = ['Male', 'Female'];
  selections.gender = randomPick(genders);

  // === AGE ===
  // Maps 1-5 slider to age levels
  const ageLevel = simple.age; // Direct mapping
  if (dataCache.age) {
    const ageQualifier = pickQualifier(dataCache.age, ageLevel);
    selections.age = { level: ageLevel, qualifier: ageQualifier };
  }

  // === APPEARANCE (Charisma) ===

  // Attractiveness - direct mapping from charisma slider
  const attractivenessLevel = simple.charisma;
  if (dataCache.attractiveness) {
    const qualifier = pickQualifier(dataCache.attractiveness, attractivenessLevel);
    selections.attractiveness = { level: attractivenessLevel, qualifier };
  }

  // Skin - follows charisma (±1 variance)
  const skinLevel = Math.max(1, Math.min(5, attractivenessLevel + randomInRange(-1, 1)));
  if (dataCache.skin) {
    const qualifier = pickQualifier(dataCache.skin, skinLevel);
    selections.skin = { level: skinLevel, qualifier };
  }

  // Grooming - random (wealth slider removed)
  const groomingLevel = randomInRange(2, 4);
  if (dataCache.grooming) {
    const qualifier = pickQualifier(dataCache.grooming, groomingLevel);
    selections.grooming = { level: groomingLevel, qualifier };
  }

  // === PHYSICAL BUILD (STR, DEX, CON interaction) ===

  // Muscle - directly from strength slider
  const muscleLevel = simple.strength;
  if (dataCache.muscle) {
    const qualifier = pickQualifier(dataCache.muscle, muscleLevel);
    selections.muscle = { level: muscleLevel, qualifier };
  }

  // Body Fat - INVERSE of constitution (low CON = high body fat)
  // This allows: High STR + Low CON = Fat Muscular, High STR + High CON = Lean Muscular
  const bodyFatLevel = 6 - simple.constitution; // Invert: 1→5, 2→4, 3→3, 4→2, 5→1
  if (dataCache.body_fat) {
    const qualifier = pickQualifier(dataCache.body_fat, bodyFatLevel);
    selections.body_fat = { level: bodyFatLevel, qualifier };
  }

  // Muscle Definition - combination of STR and CON
  // High STR + High CON = Very defined, High STR + Low CON = Soft/undefined
  let muscleDefLevel: number;
  if (simple.strength >= 4 && simple.constitution >= 4) {
    muscleDefLevel = 4; // Heavily defined (gymnast/bodybuilder)
  } else if (simple.strength >= 4 && simple.constitution <= 2) {
    muscleDefLevel = 2; // Lightly defined (strongman/powerlifter)
  } else if (simple.strength >= 3 && simple.constitution >= 3) {
    muscleDefLevel = 3; // Clearly defined (athletic)
  } else if (simple.strength <= 2 && simple.constitution >= 4) {
    muscleDefLevel = 2; // Lean but not muscular (runner/dancer)
  } else {
    muscleDefLevel = randomInRange(1, 3); // Average range
  }

  if (dataCache.muscle_definition) {
    const qualifier = pickQualifier(dataCache.muscle_definition, muscleDefLevel);
    selections.muscle_definition = { level: muscleDefLevel, qualifier };
  }

  // Height - random with slight bias toward average for weak, taller for strong
  const heightOptions = dataCache.height || [];
  if (heightOptions.length > 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let heightChoice: any;
    if (simple.strength >= 4) {
      // Strong characters tend to be average or taller
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const tallOptions = heightOptions.filter((h: any) =>
        h.name && !h.name.toLowerCase().includes('short')
      );
      heightChoice = tallOptions.length > 0 ? randomPick(tallOptions) : randomPick(heightOptions);
    } else {
      heightChoice = randomPick(heightOptions);
    }
    selections.height = heightChoice.name;
  }

  // Body Shape - based on STR + CON interaction
  const bodyShapes = dataCache.body_shape || [];
  if (bodyShapes.length > 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let shapeOptions: any[];

    // High STR + High CON = Athletic/Lean Muscular (gymnast, athlete)
    if (simple.strength >= 4 && simple.constitution >= 4) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      shapeOptions = (bodyShapes as any[]).filter((s: any) =>
        ['Athletic', 'Inverted Triangle', 'Lean'].includes(s.name)
      );
    }
    // High STR + Low CON = Strongman/Heavyset (powerlifter, fat + muscle)
    else if (simple.strength >= 4 && simple.constitution <= 2) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      shapeOptions = (bodyShapes as any[]).filter((s: any) =>
        ['Strongman', 'Heavyset', 'Stocky'].includes(s.name)
      );
    }
    // Low STR + High CON = Lean/Nimble (runner, dancer, contortionist)
    else if (simple.strength <= 2 && simple.constitution >= 4) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      shapeOptions = (bodyShapes as any[]).filter((s: any) =>
        ['Lean', 'Rectangle', 'Petite'].includes(s.name)
      );
    }
    // Low STR + Low CON = Soft/Frail (thin or chubby but weak)
    else if (simple.strength <= 2 && simple.constitution <= 2) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      shapeOptions = (bodyShapes as any[]).filter((s: any) =>
        ['Pear-Shaped', 'Apple-Shaped', 'Soft'].includes(s.name)
      );
    }
    // Average = broader range
    else {
      shapeOptions = bodyShapes as any[];
    }

    const shape = shapeOptions.length > 0 ? randomPick(shapeOptions) : randomPick(bodyShapes as any[]);
    selections.body_shape = shape.name;
  }

  // === FACIAL FEATURES ===

  // Hair style - follows charisma/grooming
  const hairStyleLevel = Math.max(1, Math.min(5, Math.floor((simple.charisma + groomingLevel) / 2)));
  if (dataCache.hair_style) {
    const qualifier = pickQualifier(dataCache.hair_style, hairStyleLevel);
    selections.hair_style = { level: hairStyleLevel, qualifier };
  }

  // Hair color - fully random
  const hairColors = ['black', 'brown', 'blonde', 'red', 'white', 'gray', 'auburn'];
  selections.hair_color = randomPick(hairColors);

  // Facial features - based on Intelligence slider
  // Higher INT = More perceptive/wise features
  if (simple.intelligence !== 3) {
    const intFeatures = {
      1: 'Vacant Stare',
      2: 'Dull Eyes',
      3: '', // No special feature
      4: 'Perceptive Eyes, Sharp Gaze',
      5: 'Wise Eyes, Keen Features, Intellectual Bearing'
    };
    const feature = intFeatures[simple.intelligence as keyof typeof intFeatures];
    if (feature) selections.facial_features = feature;
  } else if (Math.random() < 0.2) {
    // 20% chance of random feature at average INT
    const facialFeatures = dataCache.facial_features || [];
    if (Array.isArray(facialFeatures) && facialFeatures.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      selections.facial_features = (randomPick(facialFeatures) as any).name;
    }
  }

  // TODO: Expression - from expression slider (not yet implemented)
  /*
  const expressions = dataCache.expressions || [];
  if (expressions.length > 0 && simple.expression) {
    // Map expression slider to emotion categories
    let emotionOptions: any[];
    if (simple.expression <= 1) {
      // Angry/Hostile
      emotionOptions = expressions.filter((e: any) =>
        ['angry', 'scowling', 'glaring', 'furious', 'hostile'].some(term =>
          e.name.toLowerCase().includes(term)
        )
      );
    } else if (simple.expression <= 2) {
      // Sad/Serious
      emotionOptions = expressions.filter((e: any) =>
        ['sad', 'crying', 'serious', 'stern', 'contemplative', 'melancholic'].some(term =>
          e.name.toLowerCase().includes(term)
        )
      );
    } else if (simple.expression === 3) {
      // Neutral
      emotionOptions = expressions.filter((e: any) =>
        ['neutral', 'calm', 'serious', 'contemplative', 'focused'].some(term =>
          e.name.toLowerCase().includes(term)
        )
      );
    } else if (simple.expression === 4) {
      // Friendly/Pleasant
      emotionOptions = expressions.filter((e: any) =>
        ['smiling', 'smirking', 'pleasant', 'content', 'amused'].some(term =>
          e.name.toLowerCase().includes(term)
        )
      );
    } else {
      // Happy/Joyful
      emotionOptions = expressions.filter((e: any) =>
        ['laughing', 'smiling', 'joyful', 'ecstatic', 'beaming', 'grinning'].some(term =>
          e.name.toLowerCase().includes(term)
        )
      );
    }

    // Fallback to any expression if filter returned nothing
    const expression = emotionOptions.length > 0 ? randomPick(emotionOptions) : randomPick(expressions);
    selections.expressions = expression.name;
  }
  */

  // Demeanor - based on Intelligence and Charisma
  // High INT = Thoughtful, perceptive demeanor
  // High CHA = Confident demeanor
  let demeanorLevel: number;
  const avgMental = Math.floor((simple.intelligence + simple.charisma) / 2);

  if (avgMental >= 4) {
    // High INT+CHA = Confident, perceptive
    demeanorLevel = randomInRange(4, 5);
  } else if (avgMental >= 3) {
    // Average = Neutral, calm
    demeanorLevel = randomInRange(3, 4);
  } else if (avgMental >= 2) {
    // Below average = Cautious, uncertain
    demeanorLevel = randomInRange(2, 3);
  } else {
    // Low = Timid, dull
    demeanorLevel = randomInRange(1, 2);
  }

  if (dataCache.demeanor) {
    const qualifier = pickQualifier(dataCache.demeanor, demeanorLevel);
    selections.demeanor = { level: demeanorLevel, qualifier };
  }

  // === SPECIAL TRAITS (based on expression slider - includes evil/good cues) ===

  // TODO: Expression slider now includes alignment: 1=evil/scowling, 5=good/joyful (not yet implemented)
  /*
  if (simple.expression) {
    if (simple.expression <= 2) {
      // Evil/Menacing expression - 30% chance of monstrous or affliction traits
      if (Math.random() < 0.3) {
        const monstrousFeatures = dataCache.monstrous_features || [];
        const afflictions = dataCache.afflictions || [];
        const darkTraits = [...monstrousFeatures, ...afflictions];

        if (darkTraits.length > 0) {
          const trait = randomPick(darkTraits);
          if (monstrousFeatures.includes(trait)) {
            selections.monstrous_features = selections.monstrous_features || [];
            if (!selections.monstrous_features.includes(trait.name)) {
              selections.monstrous_features.push(trait.name);
            }
          } else {
            selections.afflictions = selections.afflictions || [];
            if (!selections.afflictions.includes(trait.name)) {
              selections.afflictions.push(trait.name);
            }
          }
        }
      }
    } else if (simple.expression >= 4) {
      // Good/Joyful expression - 30% chance of allure traits (noble bearing)
      if (Math.random() < 0.3) {
        const allureFeminine = dataCache.allure_feminine || [];
        const allureMasculine = dataCache.allure_masculine || [];
        const allureClothing = dataCache.allure_clothing || [];
        const nobleTraits = [...allureFeminine, ...allureMasculine, ...allureClothing];

        if (nobleTraits.length > 0) {
          const trait = randomPick(nobleTraits);
          if (allureFeminine.includes(trait)) {
            selections.allure_feminine = selections.allure_feminine || [];
            if (!selections.allure_feminine.includes(trait.name)) {
              selections.allure_feminine.push(trait.name);
            }
          } else if (allureMasculine.includes(trait)) {
            selections.allure_masculine = selections.allure_masculine || [];
            if (!selections.allure_masculine.includes(trait.name)) {
              selections.allure_masculine.push(trait.name);
            }
          } else {
            selections.allure_clothing = selections.allure_clothing || [];
            if (!selections.allure_clothing.includes(trait.name)) {
              selections.allure_clothing.push(trait.name);
            }
          }
        }
      }
    }
  }
  */

  // === EQUIPMENT & CLOTHING ===

  // Gear quality - random (wealth slider removed - now in Tweaks)
  const gearQualityLevel = randomInRange(2, 4); // Mostly average gear
  if (dataCache.gear_quality) {
    const qualifier = pickQualifier(dataCache.gear_quality, gearQualityLevel);
    selections.gear_quality = { level: gearQualityLevel, qualifier };
  }

  // Random outfit based on character class (weighted by common types)
  const outfitTypes = [
    'outfit_common', 'outfit_common', 'outfit_common', // More common
    'outfit_adventurer', 'outfit_adventurer',
    'outfit_bard', 'outfit_merchant',
    'outfit_fighter', 'outfit_rogue',
    'outfit_burgher', 'outfit_cleric',
  ];

  const outfitType = randomPick(outfitTypes);
  const outfitData = dataCache[outfitType] || [];
  if (Array.isArray(outfitData) && outfitData.length > 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    selections[outfitType] = (randomPick(outfitData) as any).name;
  }

  // === CAMERA & FRAMING ===

  // TODO: Camera angle/framing - from camera slider (not yet implemented)
  /*
  if (simple.camera) {
    const cameraAngles = dataCache.camera_angle || [];
    const framingOptions = dataCache.framing || [];

    if (simple.camera <= 2) {
      // Close-up shots
      const closeOptions = framingOptions.filter((f: any) =>
        ['extreme close-up', 'close-up', 'medium close-up', 'portrait'].some(term =>
          f.name?.toLowerCase().includes(term)
        )
      );
      if (closeOptions.length > 0) {
        selections.framing = (randomPick(closeOptions) as any).name;
      }
    } else if (simple.camera === 3) {
      // Medium shots
      const medOptions = framingOptions.filter((f: any) =>
        ['medium shot', 'waist-up', 'thigh-up shot'].some(term =>
          f.name?.toLowerCase().includes(term)
        )
      );
      if (medOptions.length > 0) {
        selections.framing = (randomPick(medOptions) as any).name;
      }
    } else {
      // Full body and wide shots
      const wideOptions = framingOptions.filter((f: any) =>
        ['full body', 'full-length', 'wide shot', 'establishing'].some(term =>
          f.name?.toLowerCase().includes(term)
        )
      );
      if (wideOptions.length > 0) {
        selections.framing = (randomPick(wideOptions) as any).name;
      }
    }

    // Random camera angle
    if (cameraAngles.length > 0) {
      selections.camera_angle = randomPick(cameraAngles);
    }
  }
  */

  // === LIGHTING ===

  // Lighting - randomized (no longer controlled by slider)
  const lightingOptions = dataCache.lighting;
  if (Array.isArray(lightingOptions) && lightingOptions.length > 0) {
    const lighting = randomPick(lightingOptions);
    if (lighting && typeof lighting === 'object' && 'name' in lighting) {
      selections.lighting = (lighting as { name: string }).name;
    }
  }

  // === VISUAL STYLE ===

  // TODO: Style - from style slider (not yet implemented)
  /*
  if (simple.style) {
    const aesthetics = dataCache.aesthetic || [];
    const genreStyles = dataCache.genre_style || [];

    if (aesthetics.length > 0) {
      let styleOptions: any[];

      if (simple.style <= 2) {
        // Gritty/Realistic
        styleOptions = aesthetics.filter((a: any) =>
          ['realistic', 'photorealistic', 'gritty', 'dark', 'noir', 'cinematic'].some(term =>
            a.name?.toLowerCase().includes(term)
          )
        );
      } else if (simple.style === 3) {
        // Balanced
        styleOptions = aesthetics.filter((a: any) =>
          ['digital art', 'illustration', 'painted'].some(term =>
            a.name?.toLowerCase().includes(term)
          )
        );
      } else {
        // Stylized/Fantasy
        styleOptions = aesthetics.filter((a: any) =>
          ['fantasy', 'anime', 'cel-shaded', 'stylized', 'vibrant', 'surreal'].some(term =>
            a.name?.toLowerCase().includes(term)
          )
        );
      }

      const aesthetic = styleOptions.length > 0 ? randomPick(styleOptions) : randomPick(aesthetics);
      selections.aesthetic = aesthetic.name;
    }

    // Genre style based on expression slider for thematic consistency
    if (genreStyles.length > 0 && simple.expression) {
      let genreOptions: any[];

      if (simple.expression <= 2) {
        // Dark expression = dark fantasy
        genreOptions = genreStyles.filter((g: any) =>
          ['dark fantasy', 'horror', 'gothic'].some(term =>
            g.name?.toLowerCase().includes(term)
          )
        );
      } else {
        // Positive/Neutral = heroic fantasy
        genreOptions = genreStyles.filter((g: any) =>
          ['high fantasy', 'heroic', 'epic'].some(term =>
            g.name?.toLowerCase().includes(term)
          )
        );
      }

      if (genreOptions.length > 0) {
        selections.genre_style = randomPick(genreOptions).name;
      }
    }
  }
  */

  // TODO: Mood - influenced by expression slider (not yet implemented)
  /*
  const moods = dataCache.mood || [];
  if (moods.length > 0 && simple.expression) {
    let moodOptions: any[];

    if (simple.expression <= 2) {
      // Dark/Ominous moods
      moodOptions = moods.filter((m: any) =>
        ['ominous', 'tense', 'foreboding', 'melancholic', 'dark'].some(term =>
          m.name?.toLowerCase().includes(term)
        )
      );
    } else if (simple.expression >= 4) {
      // Uplifting moods
      moodOptions = moods.filter((m: any) =>
        ['hopeful', 'serene', 'peaceful', 'uplifting', 'joyful'].some(term =>
          m.name?.toLowerCase().includes(term)
        )
      );
    } else {
      // Neutral moods
      moodOptions = moods.filter((m: any) =>
        ['mysterious', 'contemplative', 'dramatic', 'neutral'].some(term =>
          m.name?.toLowerCase().includes(term)
        )
      );
    }

    const mood = moodOptions.length > 0 ? randomPick(moodOptions) : randomPick(moods);
    selections.mood = mood.name;
  }
  */

  // Pose - based on Dexterity slider (agility level)
  const poses = (dataCache.pose as Array<{ name: string; category: string }>) || [];
  if (poses.length > 0) {
    let poseOptions: Array<{ name: string; category: string }>;

    if (simple.dexterity <= 1) {
      // Clumsy - static, seated poses
      poseOptions = poses.filter((p) =>
        ['neutral', 'seated', 'relaxed', 'social'].includes(p.category)
      );
    } else if (simple.dexterity === 2) {
      // Stiff - basic combat stances
      poseOptions = poses.filter((p) =>
        ['neutral', 'combat', 'social'].includes(p.category) &&
        !['Spinning Attack', 'Leaping Through Air', 'Backflip'].some(term =>
          p.name.includes(term)
        )
      );
    } else if (simple.dexterity === 3) {
      // Average - general poses (avoid extremes)
      poseOptions = poses.filter((p) =>
        ['neutral', 'action', 'social', 'stealth'].includes(p.category) &&
        !['Leaping', 'Backflip', 'Acrobatic'].some(term => p.name.includes(term))
      );
    } else if (simple.dexterity === 4) {
      // Agile - action poses (running, climbing, stealth)
      poseOptions = poses.filter((p) =>
        ['action', 'stealth', 'combat'].includes(p.category)
      );
    } else {
      // Acrobatic - dynamic, athletic poses
      poseOptions = poses.filter((p) =>
        p.name.toLowerCase().includes('leap') ||
        p.name.toLowerCase().includes('flip') ||
        p.name.toLowerCase().includes('spin') ||
        p.name.toLowerCase().includes('acrobatic') ||
        ['action', 'combat'].includes(p.category)
      );
    }

    // Fallback to all poses if filter returned nothing
    const pose = poseOptions.length > 0 ? randomPick(poseOptions) : randomPick(poses);
    selections.pose = pose.name;
  }

  // === CONTRADICTION DETECTION & AUTO-RESOLUTION ===

  // Auto-resolve ERROR-level contradictions
  const { selections: resolvedSelections, resolved } = autoResolveErrors(selections, simple);
  selections = resolvedSelections;

  // Detect contradictions after auto-resolution (should only have warnings/info left)
  const remainingContradictions = detectContradictions(selections, simple);

  return {
    selections,
    contradictions: remainingContradictions,
    resolvedErrors: resolved
  };
}

/**
 * Randomize everything completely (for "Surprise Me" button)
 */
export function generateRandomCharacter(dataCache: Record<string, unknown>): GenerationResult {
  // Generate random D&D-style stat values
  const randomSliders: SimpleSelections = {
    // Physical stats
    strength: randomInRange(1, 5),
    dexterity: randomInRange(1, 5),
    constitution: randomInRange(1, 5),
    age: randomInRange(1, 5),

    // Mental/Social stats
    intelligence: randomInRange(1, 5),
    charisma: randomInRange(1, 5),

    // TODO: Compositional sliders not yet implemented
    // camera: randomInRange(1, 5),
    // style: randomInRange(1, 5),
    // expression: randomInRange(1, 5),
  };

  // Use the slider-based generator with random values
  return generateFromSliders(randomSliders, dataCache);
}
