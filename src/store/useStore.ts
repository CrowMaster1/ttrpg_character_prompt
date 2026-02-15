import { create } from 'zustand';
import type { Model, Selections, ControlsConfig } from '../types';
import type { ContradictionRule } from '../services/contradictionDetector';
import type { SimpleSelections } from '../services/randomizer';

interface AppState {
  // Selections
  selections: Selections;
  setSelection: (key: string, value: any) => void;
  resetSelections: () => void;

  // Sliders (D&D-style stats)
  sliders: SimpleSelections;
  setSlider: (key: keyof SimpleSelections, value: number) => void;

  // Model
  targetModel: Model;
  setTargetModel: (model: Model) => void;

  // Generated prompt
  generatedPrompt: string;
  setGeneratedPrompt: (prompt: string) => void;

  // Data cache
  dataCache: Record<string, any>;
  setDataCache: (cache: Record<string, any>) => void;

  // Controls config
  controlsConfig: ControlsConfig | null;
  setControlsConfig: (config: ControlsConfig) => void;

  // Contradiction tracking
  contradictions: ContradictionRule[];
  setContradictions: (rules: ContradictionRule[]) => void;

  // User overrides tracking (controls manually changed by user)
  overrides: Set<string>;
  addOverride: (controlId: string) => void;
  removeOverride: (controlId: string) => void;
  clearOverrides: () => void;
}

// Default base character: Male Human in neutral stance with cowboy shot framing
const DEFAULT_SELECTIONS: Selections = {
  gender: 'Male',
  race: 'Human',
  pose: 'Standing Resolutely',
  camera_position: 'Cowboy shot (mid-thigh up)',
  setting: 'High Fantasy',
};

// Default slider values (neutral middle values)
const DEFAULT_SLIDERS: SimpleSelections = {
  strength: 3,
  dexterity: 3,
  constitution: 3,
  age: 3,
  intelligence: 3,
  charisma: 3,
};

export const useStore = create<AppState>((set) => ({
  selections: { ...DEFAULT_SELECTIONS },
  setSelection: (key, value) =>
    set((state) => ({
      selections: { ...state.selections, [key]: value },
    })),
  resetSelections: () => set({
    selections: { ...DEFAULT_SELECTIONS },
    sliders: { ...DEFAULT_SLIDERS },
    overrides: new Set()
  }),

  sliders: { ...DEFAULT_SLIDERS },
  setSlider: (key, value) =>
    set((state) => ({
      sliders: { ...state.sliders, [key]: value },
    })),

  targetModel: 'FLUX',
  setTargetModel: (model) => set({ targetModel: model }),

  generatedPrompt: '',
  setGeneratedPrompt: (prompt) => set({ generatedPrompt: prompt }),

  dataCache: {},
  setDataCache: (cache) => set({ dataCache: cache }),

  controlsConfig: null,
  setControlsConfig: (config) => set({ controlsConfig: config }),

  contradictions: [],
  setContradictions: (rules) => set({ contradictions: rules }),

  overrides: new Set<string>(),
  addOverride: (controlId) =>
    set((state) => {
      const newOverrides = new Set(state.overrides);
      newOverrides.add(controlId);
      return { overrides: newOverrides };
    }),
  removeOverride: (controlId) =>
    set((state) => {
      const newOverrides = new Set(state.overrides);
      newOverrides.delete(controlId);
      return { overrides: newOverrides };
    }),
  clearOverrides: () => set({ overrides: new Set() }),
}));
