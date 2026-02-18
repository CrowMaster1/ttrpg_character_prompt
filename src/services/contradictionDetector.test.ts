import { describe, it, expect } from 'vitest';
import {
  detectContradictions,
  resolveContradiction,
  autoResolveErrors,
  getSafeSuggestion
} from './contradictionDetector';
import type { Selections } from '../types';
import type { SimpleSelections } from './randomizer';

describe('ContradictionDetector', () => {
  // Helper to create test sliders
  const createSliders = (overrides: Partial<SimpleSelections> = {}): SimpleSelections => ({
    strength: 3,
    dexterity: 3,
    constitution: 3,
    age: 3,
    intelligence: 3,
    charisma: 3,
    // camera: 3,
    // style: 3,
    // expression: 3,
    ...overrides
  });

  describe('Physical Impossibilities (ERROR)', () => {
    it('should detect frail + acrobatic contradiction', () => {
      const selections: Selections = {
        pose: 'Leaping Through Air'
      };
      const sliders = createSliders({ constitution: 1, dexterity: 5 });

      const contradictions = detectContradictions(selections, sliders);
      const frailAcrobatic = contradictions.find(c => c.id === 'frail-acrobatic');

      expect(frailAcrobatic).toBeDefined();
      expect(frailAcrobatic?.severity).toBe('error');
      expect(frailAcrobatic?.message).toContain('Frail constitution');
    });

    it('should detect low strength + high muscle contradiction', () => {
      const selections: Selections = {
        muscle: { level: 5, qualifier: 'massive' }
      };
      const sliders = createSliders({ strength: 1 });

      const contradictions = detectContradictions(selections, sliders);
      const lowStrHighMuscle = contradictions.find(c => c.id === 'low-str-high-muscle');

      expect(lowStrHighMuscle).toBeDefined();
      expect(lowStrHighMuscle?.severity).toBe('error');
      expect(lowStrHighMuscle?.message).toContain('Low strength');
    });

    it('should detect lean body + high body fat contradiction', () => {
      const selections: Selections = {
        body_fat: { level: 5, qualifier: 'very heavy' }
      };
      const sliders = createSliders({ constitution: 5 }); // High CON should mean low fat

      const contradictions = detectContradictions(selections, sliders);
      const leanObese = contradictions.find(c => c.id === 'lean-obese');

      expect(leanObese).toBeDefined();
      expect(leanObese?.severity).toBe('error');
    });

    it('should detect no muscle + bodybuilder contradiction', () => {
      const selections: Selections = {
        muscle: { level: 5, qualifier: 'herculean' }
      };
      const sliders = createSliders({ strength: 1 });

      const contradictions = detectContradictions(selections, sliders);
      const noMuscleBodybuilder = contradictions.find(c => c.id === 'no-muscle-bodybuilder');

      expect(noMuscleBodybuilder).toBeDefined();
      expect(noMuscleBodybuilder?.severity).toBe('error');
    });
  });

  describe('Logical Conflicts (ERROR)', () => {
    it('should detect low intelligence + wise features contradiction', () => {
      const selections: Selections = {
        facial_features: 'Wise Eyes, Keen Features, Intellectual Bearing'
      };
      const sliders = createSliders({ intelligence: 1 });

      const contradictions = detectContradictions(selections, sliders);
      const lowIntWise = contradictions.find(c => c.id === 'low-int-wise-features');

      expect(lowIntWise).toBeDefined();
      expect(lowIntWise?.severity).toBe('error');
      expect(lowIntWise?.message).toContain('Low intelligence');
    });

    it('should detect high charisma + ugly features contradiction', () => {
      const selections: Selections = {
        attractiveness: { level: 1, qualifier: 'plain' }
      };
      const sliders = createSliders({ charisma: 5 });

      const contradictions = detectContradictions(selections, sliders);
      const highChaUgly = contradictions.find(c => c.id === 'high-cha-ugly-features');

      expect(highChaUgly).toBeDefined();
      expect(highChaUgly?.severity).toBe('error');
    });

    it('should detect young age + gray hair contradiction', () => {
      const selections: Selections = {
        age: { level: 1, qualifier: 'youthful' },
        hair_color: 'gray'
      };
      const sliders = createSliders({ age: 1 });

      const contradictions = detectContradictions(selections, sliders);
      const youngGrayHair = contradictions.find(c => c.id === 'young-gray-hair');

      expect(youngGrayHair).toBeDefined();
      expect(youngGrayHair?.severity).toBe('error');
      expect(youngGrayHair?.message).toContain('Young characters');
    });

    it('should detect elderly + youthful skin contradiction', () => {
      const selections: Selections = {
        age: { level: 5, qualifier: 'elderly' },
        skin: { level: 5, qualifier: 'smooth' }
      };
      const sliders = createSliders({ age: 5 });

      const contradictions = detectContradictions(selections, sliders);
      const elderlySmoothSkin = contradictions.find(c => c.id === 'elderly-youthful-skin');

      expect(elderlySmoothSkin).toBeDefined();
      expect(elderlySmoothSkin?.severity).toBe('error');
    });
  });

  describe('Biomechanical Issues (WARNING)', () => {
    it('should detect low constitution + acrobatic pose as warning', () => {
      const selections: Selections = {
        pose: 'Backflip'
      };
      const sliders = createSliders({ constitution: 2 });

      const contradictions = detectContradictions(selections, sliders);
      const lowConAcrobatic = contradictions.find(c => c.id === 'low-con-acrobatic-pose');

      expect(lowConAcrobatic).toBeDefined();
      expect(lowConAcrobatic?.severity).toBe('warning');
    });

    it('should detect high body fat + high muscle definition as warning', () => {
      const selections: Selections = {
        body_fat: { level: 5, qualifier: 'very heavy' },
        muscle_definition: { level: 5, qualifier: 'shredded' }
      };
      const sliders = createSliders();

      const contradictions = detectContradictions(selections, sliders);
      const highFatHighDef = contradictions.find(c => c.id === 'high-fat-high-muscle-def');

      expect(highFatHighDef).toBeDefined();
      expect(highFatHighDef?.severity).toBe('warning');
      expect(highFatHighDef?.message).toContain('obscures muscle definition');
    });

    it('should detect low strength + heavy gear as warning', () => {
      const selections: Selections = {
        gear_quality: { level: 5, qualifier: 'masterwork' }
      };
      const sliders = createSliders({ strength: 1 });

      const contradictions = detectContradictions(selections, sliders);
      const lowStrHeavyGear = contradictions.find(c => c.id === 'low-str-heavy-gear');

      expect(lowStrHeavyGear).toBeDefined();
      expect(lowStrHeavyGear?.severity).toBe('warning');
    });

    it('should detect frail + heavy equipment as warning', () => {
      const selections: Selections = {
        equipment_back: 'Heavy Backpack',
        equipment_chest: 'Plate Mail'
      };
      const sliders = createSliders({ strength: 1, constitution: 1 });

      const contradictions = detectContradictions(selections, sliders);
      const frailHeavyEquip = contradictions.find(c => c.id === 'frail-heavy-equipment');

      expect(frailHeavyEquip).toBeDefined();
      expect(frailHeavyEquip?.severity).toBe('warning');
    });
  });

  describe('Contextual Oddities (INFO)', () => {
    it('should recognize strongman build as valid (info)', () => {
      const selections: Selections = {
        muscle: { level: 5, qualifier: 'massive' },
        body_fat: { level: 5, qualifier: 'heavy' }
      };
      const sliders = createSliders({ strength: 5, constitution: 1 });

      const contradictions = detectContradictions(selections, sliders);
      const strongman = contradictions.find(c => c.id === 'strongman-build');

      expect(strongman).toBeDefined();
      expect(strongman?.severity).toBe('info');
      expect(strongman?.message).toContain('Strongman build');
      expect(strongman?.suggestion).toContain('valid');
    });

    it('should recognize elderly combat veteran as valid (info)', () => {
      const selections: Selections = {
        age: { level: 5, qualifier: 'elderly' },
        pose: 'Dynamic Combat Stance'
      };
      const sliders = createSliders({ age: 5 });

      const contradictions = detectContradictions(selections, sliders);
      const elderlyVeteran = contradictions.find(c => c.id === 'elderly-combat');

      expect(elderlyVeteran).toBeDefined();
      expect(elderlyVeteran?.severity).toBe('info');
      expect(elderlyVeteran?.suggestion).toContain('valid');
    });

    it('should recognize high dex + low strength acrobat as valid (info)', () => {
      const selections: Selections = {};
      const sliders = createSliders({ dexterity: 5, strength: 1 });

      const contradictions = detectContradictions(selections, sliders);
      const acrobat = contradictions.find(c => c.id === 'high-dex-low-str');

      expect(acrobat).toBeDefined();
      expect(acrobat?.severity).toBe('info');
      expect(acrobat?.message).toContain('Acrobat/rogue');
    });

    it('should recognize low charisma + high intelligence scholar as valid (info)', () => {
      const selections: Selections = {};
      const sliders = createSliders({ charisma: 1, intelligence: 5 });

      const contradictions = detectContradictions(selections, sliders);
      const scholar = contradictions.find(c => c.id === 'low-cha-high-int');

      expect(scholar).toBeDefined();
      expect(scholar?.severity).toBe('info');
      expect(scholar?.message).toContain('Scholar');
    });
  });

  describe('Auto-Resolution', () => {
    it('should auto-resolve frail + acrobatic by changing pose', () => {
      const selections: Selections = {
        pose: 'Leaping Through Air'
      };
      const sliders = createSliders({ constitution: 1, dexterity: 5 });

      const contradictions = detectContradictions(selections, sliders);
      const frailAcrobatic = contradictions.find(c => c.id === 'frail-acrobatic');

      expect(frailAcrobatic).toBeDefined();
      const resolved = resolveContradiction(frailAcrobatic!, selections, sliders);

      expect(resolved.pose as string).not.toBe('Leaping Through Air');
      expect(resolved.pose as string).toBe('Standing Resolutely');
    });

    it('should auto-resolve low strength + high muscle by reducing muscle', () => {
      const selections: Selections = {
        muscle: { level: 5, qualifier: 'massive' }
      };
      const sliders = createSliders({ strength: 2 });

      const contradictions = detectContradictions(selections, sliders);
      const lowStrHighMuscle = contradictions.find(c => c.id === 'low-str-high-muscle');

      const resolved = resolveContradiction(lowStrHighMuscle!, selections, sliders);

      expect((resolved.muscle as any).level).toBe(2); // Should match strength
    });

    it('should auto-resolve young + gray hair by changing hair color', () => {
      const selections: Selections = {
        age: { level: 1, qualifier: 'youthful' },
        hair_color: 'gray'
      };
      const sliders = createSliders({ age: 1 });

      const contradictions = detectContradictions(selections, sliders);
      const youngGrayHair = contradictions.find(c => c.id === 'young-gray-hair');

      const resolved = resolveContradiction(youngGrayHair!, selections, sliders);

      expect(resolved.hair_color as string).not.toBe('gray');
      expect(['black', 'brown', 'blonde', 'red', 'auburn']).toContain(resolved.hair_color as string);
    });

    it('should auto-resolve all errors at once', () => {
      const selections: Selections = {
        muscle: { level: 5, qualifier: 'massive' },
        pose: 'Leaping Through Air',
        facial_features: 'Wise Eyes',
        hair_color: 'white'
      };
      const sliders = createSliders({
        strength: 1,
        constitution: 1,
        dexterity: 5,
        intelligence: 1,
        age: 1
      });

      const { selections: resolved, resolved: resolvedIds } = autoResolveErrors(selections, sliders);

      // Should have resolved multiple errors
      expect(resolvedIds.length).toBeGreaterThan(0);

      // Muscle should be reduced
      expect((resolved.muscle as any).level).toBeLessThan(5);

      // Pose should be changed to something safer
      expect(resolved.pose as string).not.toBe('Leaping Through Air');

      // Hair color should be age-appropriate
      expect(resolved.hair_color as string).not.toBe('white');
    });
  });

  describe('Safe Suggestions', () => {
    it('should suggest muscle level matching strength', () => {
      const sliders = createSliders({ strength: 4 });
      const suggestion = getSafeSuggestion('strength', 4, sliders) as any;

      expect(suggestion).toBeDefined();
      expect(suggestion.level).toBe(4);
    });

    it('should suggest body fat inverse of constitution', () => {
      const sliders = createSliders({ constitution: 5 });
      const suggestion = getSafeSuggestion('constitution', 5, sliders) as any;

      expect(suggestion).toBeDefined();
      expect(suggestion.level).toBe(1); // Inverse: 6 - 5 = 1
    });

    it('should suggest appropriate pose for dexterity', () => {
      const sliders = createSliders({ dexterity: 1 });
      const suggestion = getSafeSuggestion('dexterity', 1, sliders) as any;

      expect(suggestion).toBeDefined();
      expect(suggestion).toBe('Sitting Comfortably');
    });

    it('should suggest facial features for intelligence', () => {
      const sliders = createSliders({ intelligence: 5 });
      const suggestion = getSafeSuggestion('intelligence', 5, sliders) as any;

      expect(suggestion).toBe('Wise Eyes, Keen Features, Intellectual Bearing');
    });

    it('should suggest attractiveness matching charisma', () => {
      const sliders = createSliders({ charisma: 5 });
      const suggestion = getSafeSuggestion('charisma', 5, sliders) as any;

      expect(suggestion).toBeDefined();
      expect(suggestion.level).toBe(5);
      expect(suggestion.qualifier).toBe('beautiful');
    });
  });

  describe('No False Positives', () => {
    it('should not flag balanced stats as contradictions', () => {
      const selections: Selections = {
        muscle: { level: 3, qualifier: 'balanced' },
        body_fat: { level: 3, qualifier: 'average' },
        age: { level: 3, qualifier: 'middle-aged' },
        pose: 'Standing Resolutely'
      };
      const sliders = createSliders(); // All 3s

      const contradictions = detectContradictions(selections, sliders);
      const errors = contradictions.filter(c => c.severity === 'error');

      expect(errors.length).toBe(0);
    });

    it('should not flag strongman build (high STR + high fat) as error', () => {
      const selections: Selections = {
        muscle: { level: 5, qualifier: 'massive' },
        body_fat: { level: 5, qualifier: 'heavy' }
      };
      const sliders = createSliders({ strength: 5, constitution: 1 });

      const contradictions = detectContradictions(selections, sliders);
      const errors = contradictions.filter(c => c.severity === 'error');

      // Should be INFO, not ERROR
      expect(errors.length).toBe(0);

      const info = contradictions.find(c => c.id === 'strongman-build');
      expect(info?.severity).toBe('info');
    });

    it('should not flag elderly veteran as error', () => {
      const selections: Selections = {
        age: { level: 5, qualifier: 'elderly' },
        pose: 'Drawing Weapon'
      };
      const sliders = createSliders({ age: 5 });

      const contradictions = detectContradictions(selections, sliders);
      const errors = contradictions.filter(c => c.severity === 'error');

      expect(errors.length).toBe(0);
    });
  });
});
