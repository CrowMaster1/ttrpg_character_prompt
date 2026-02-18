export interface DataOption {
  name: string;
  description?: string;
  qualifiers?: string[];
  prompt_fragment?: string;
  tags?: string[];
  category?: string;
}

export interface LevelGroupData {
  [level: string]: {
    name: string;
    qualifiers: string[];
  };
}

export interface NSFWLevelData {
  name: string;
  options: Array<{
    name: string;
    description: string;
    qualifiers: string[];
  }>;
}

export interface ControlConfig {
  ui_type: 'simple_combo' | 'level_group' | 'checkbox_group' | 'checkbox' | 'button_group';
  label: string;
  data_source?: string;
  prompt_template?: string;
  add_none?: boolean;
  sub_options?: Record<string, string>;
}

export interface TabConfig {
  id: string;
  title: string;
  controls: string[];
}

export interface ControlsConfig {
  tabs: TabConfig[];
  controls: Record<string, ControlConfig>;
}

export type Model = 'FLUX' | 'Pony' | 'SDXL' | 'SD1.5' | 'Illustrious' | 'Juggernaut';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface Selections {
  [key: string]: any;
}

export interface OllamaModel {
  name: string;
  size: number;
  digest: string;
  modified_at: string;
}
