/**
 * Phase 1: Foundation Assembly
 * Converts stat levels into keyword phrases.
 * STATS are the SKELETON. This is the immutable character foundation.
 */

import type { Model } from '../../types';
import type { StatLevels, FoundationKeywords } from './types';
import { DEAD_WORDS, GENDER_CODED, REDUNDANCY_RULES } from './constants';

/**
 * Select a qualifier from the qualifier list, applying dead word filtering,
 * gender filtering, and model-optimized selection.
 */
export function selectQualifier(
  qualifiers: string[],
  gender: string | null,
  model: Model
): string {
  if (!qualifiers || qualifiers.length === 0) return '';

  let pool = [...qualifiers];

  // Step 1: Filter by gender if applicable
  if (gender) {
    const filtered = filterGenderAppropriate(pool, gender);
    if (filtered.length > 0) pool = filtered;
  }

  // Step 2: Remove dead words (Tier C/F keywords)
  const nonDead = pool.filter(q => !DEAD_WORDS.includes(q.toLowerCase()));
  if (nonDead.length > 0) pool = nonDead;

  // Step 3: For tag-based models, prefer single-word qualifiers for token efficiency
  if (model === 'Pony' || model === 'SD1.5') {
    const singleWords = pool.filter(q => !q.includes(' '));
    if (singleWords.length >= 2) pool = singleWords;
  }

  // Step 4: Random selection from filtered pool
  return pool[Math.floor(Math.random() * pool.length)];
}

/**
 * Filter qualifiers based on gender appropriateness
 */
function filterGenderAppropriate(qualifiers: string[], gender: string): string[] {
  const lowerGender = gender.toLowerCase();
  const isFemale = lowerGender.includes('female') || lowerGender.includes('woman');
  const isMale = lowerGender.includes('male') || lowerGender.includes('man');

  return qualifiers.filter(q => {
    const coding = GENDER_CODED[q.toLowerCase()] || 'neutral';
    if (coding === 'neutral') return true;
    if (isFemale && coding === 'feminine') return true;
    if (isMale && coding === 'masculine') return true;
    if (!isFemale && !isMale) return true; // non-binary: allow all
    return false;
  });
}

/**
 * Assemble foundation keywords from stat levels.
 * This is Phase 1 of the prompt generation pipeline.
 */
export function assembleFoundation(
  statLevels: StatLevels,
  dataCache: Record<string, any>,
  gender: string | null,
  model: Model
): FoundationKeywords {
  const result: FoundationKeywords = {
    strength: '',
    dexterity: '',
    constitution: '',
    age: '',
    intelligence: '',
    charisma: '',
    demeanor: '',
    skin: '',
    grooming: '',
    muscle_def: '',
  };

  // STR (from muscle.json)
  const muscleData = dataCache['muscle']?.[String(statLevels.muscle)];
  if (muscleData) {
    const qualifier = selectQualifier(muscleData.qualifiers, gender, model);
    result.strength = qualifier ? `${qualifier} ${muscleData.name}` : muscleData.name;
  }

  // DEX (from dexterity.json - NEW file)
  const dexData = dataCache['dexterity']?.[String(statLevels.dexterity)];
  if (dexData) {
    const qualifier = selectQualifier(dexData.qualifiers, gender, model);
    result.dexterity = qualifier ? `${qualifier} ${dexData.name}` : dexData.name;
  }

  // CON (from body_fat.json)
  const fatData = dataCache['body_fat']?.[String(statLevels.body_fat)];
  if (fatData) {
    const qualifier = selectQualifier(fatData.qualifiers, gender, model);
    result.constitution = qualifier ? `${qualifier} ${fatData.name}` : fatData.name;
  }

  // AGE (from age.json)
  const ageData = dataCache['age']?.[String(statLevels.age)];
  if (ageData) {
    const qualifier = selectQualifier(ageData.qualifiers, gender, model);
    result.age = qualifier ? `${qualifier} ${ageData.name}` : ageData.name;
  }

  // INT (from intelligence.json - NEW file)
  const intData = dataCache['intelligence']?.[String(statLevels.intelligence)];
  if (intData) {
    const qualifier = selectQualifier(intData.qualifiers, gender, model);
    result.intelligence = qualifier ? `${qualifier} ${intData.name}` : intData.name;
  }

  // CHA (from attractiveness.json)
  const chaData = dataCache['attractiveness']?.[String(statLevels.attractiveness)];
  if (chaData) {
    const qualifier = selectQualifier(chaData.qualifiers, gender, model);
    result.charisma = qualifier ? `${qualifier} ${chaData.name}` : chaData.name;
  }

  // Demeanor (from demeanor.json)
  const demData = dataCache['demeanor']?.[String(statLevels.demeanor)];
  if (demData) {
    const qualifier = selectQualifier(demData.qualifiers, gender, model);
    result.demeanor = qualifier ? `${qualifier} ${demData.name}` : demData.name;
  }

  // Skin (from skin.json)
  const skinData = dataCache['skin']?.[String(statLevels.skin)];
  if (skinData) {
    const qualifier = selectQualifier(skinData.qualifiers, gender, model);
    result.skin = qualifier ? `${qualifier} ${skinData.name}` : skinData.name;
  }

  // Grooming (from grooming.json)
  const groomData = dataCache['grooming']?.[String(statLevels.grooming)];
  if (groomData) {
    const qualifier = selectQualifier(groomData.qualifiers, gender, model);
    result.grooming = qualifier ? `${qualifier}` : '';
  }

  // Muscle Definition (from muscle_definition.json)
  const muscleDefData = dataCache['muscle_definition']?.[String(statLevels.muscle_definition)];
  if (muscleDefData) {
    const qualifier = selectQualifier(muscleDefData.qualifiers, gender, model);
    result.muscle_def = qualifier || '';
  }

  // Apply redundancy removal
  return removeRedundancy(result, statLevels);
}

/**
 * Remove redundant or conflicting keywords between stats
 */
function removeRedundancy(
  keywords: FoundationKeywords,
  levels: StatLevels
): FoundationKeywords {
  const result = { ...keywords };

  // Rule: STR=5 + muscle_def>=4 --> drop muscle_def (bodybuilder implies extreme definition)
  if (levels.muscle >= 5 && levels.muscle_definition >= 4) {
    result.muscle_def = '';
  }

  // Rule: body_fat=1 + muscle=1 --> merge (emaciated covers both)
  if (levels.body_fat <= 1 && levels.muscle <= 1) {
    result.strength = ''; // constitution "gaunt emaciated" covers physical weakness
  }

  // Rule: STR=1 + muscle_def=1 --> merge (thin soft frame)
  if (levels.muscle <= 1 && levels.muscle_definition <= 1) {
    result.muscle_def = ''; // minimal muscle already implies no definition
  }

  // Word-level deduplication removed - it was ineffective for semantic redundancy
  // The stat-level rules above handle true redundancy

  return result;
}
