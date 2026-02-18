import { CheckboxGroup } from './CheckboxGroup';
import { CollapsibleComboBox } from './CollapsibleComboBox';
import { ButtonGroup } from './ButtonGroup';
import type { DataOption } from '../../types';

interface Context {
  gender?: string;
  race?: string;
  age?: number;
  appearance?: number;
  wealth?: number;
  strength?: number;
}

interface ContextualControlProps {
  label: string;
  value: string | string[];
  options: DataOption[];
  onChange: (value: string | string[]) => void;
  multiSelect?: boolean;
  addNone?: boolean;
  useButtonGroup?: boolean;
  defaultExpanded?: boolean;
  expanded?: boolean; // Controlled expansion from parent
  context?: Context;
}

export function ContextualControl({
  label,
  value,
  options,
  onChange,
  multiSelect = false,
  addNone = false,
  useButtonGroup = false,
  defaultExpanded = false,
  expanded,
  context = {},
}: ContextualControlProps) {
  // Filter options based on context
  const filteredOptions = filterOptionsByContext(options, context, label);

  if (multiSelect) {
    return (
      <CheckboxGroup
        label={label}
        value={Array.isArray(value) ? value : []}
        options={filteredOptions}
        onChange={onChange}
      />
    );
  }

  if (useButtonGroup) {
    return (
      <ButtonGroup
        label={label}
        value={typeof value === 'string' ? value : ''}
        options={filteredOptions}
        onChange={onChange}
        allowNone={addNone}
      />
    );
  }

  // Add "None" option if needed
  const optionsWithNone = addNone && !filteredOptions.some(opt => opt.name === 'None')
    ? [{ name: 'None', description: 'No selection' }, ...filteredOptions]
    : filteredOptions;

  return (
    <CollapsibleComboBox
      label={label}
      value={typeof value === 'string' ? value : ''}
      options={optionsWithNone}
      onChange={onChange}
      defaultExpanded={defaultExpanded}
      expanded={expanded}
    />
  );
}

function filterOptionsByContext(
  options: DataOption[],
  context: Context,
  controlLabel: string
): DataOption[] {
  if (!options || options.length === 0) return [];

  let filtered = [...options];

  // Gender-based filtering
  if (context.gender) {
    const gender = context.gender.toLowerCase();

    // Filter out gender-specific items
    filtered = filtered.filter(opt => {
      const name = opt.name.toLowerCase();

      if (gender === 'male') {
        // Exclude explicitly feminine items
        if (name.includes('dress') || name.includes('feminine')) return false;
      } else if (gender === 'female') {
        // Exclude explicitly masculine items
        if (name.includes('masculine')) return false;
      }

      return true;
    });
  }

  // Age-based filtering
  if (context.age && controlLabel.toLowerCase().includes('outfit')) {
    const age = context.age;

    filtered = filtered.filter(opt => {
      const name = opt.name.toLowerCase();

      // Young characters (1-2)
      if (age <= 2) {
        if (name.includes('elderly') || name.includes('aged')) return false;
      }

      // Elderly characters (5)
      if (age >= 5) {
        if (name.includes('youthful') || name.includes('young')) return false;
      }

      return true;
    });
  }

  // Wealth-based filtering for equipment/outfits
  if (context.wealth && (controlLabel.toLowerCase().includes('outfit') || controlLabel.toLowerCase().includes('gear'))) {
    const wealth = context.wealth;

    filtered = filtered.filter(opt => {
      const name = opt.name.toLowerCase();
      const desc = (opt.description || '').toLowerCase();

      // Poor characters (1-2)
      if (wealth <= 2) {
        if (name.includes('noble') || name.includes('luxurious') ||
            name.includes('ornate') || desc.includes('expensive')) {
          return false;
        }
      }

      // Rich/Noble characters (4-5)
      if (wealth >= 4) {
        if (name.includes('tattered') || name.includes('ragged') ||
            name.includes('poor') || desc.includes('cheap')) {
          return false;
        }
      }

      return true;
    });
  }

  // Race-based filtering
  if (context.race) {
    const race = context.race.toLowerCase();

    // Filter options that don't make sense for certain races
    filtered = filtered.filter(opt => {
      const name = opt.name.toLowerCase();
      const desc = (opt.description || '').toLowerCase();

      // Dwarves - filter out very tall options
      if (race === 'dwarf') {
        if (name.includes('tall') || desc.includes('towering')) return false;
      }

      // Halfling/Gnome - similar to dwarf
      if (race === 'halfling' || race === 'gnome') {
        if (name.includes('tall') || name.includes('giant')) return false;
      }

      return true;
    });
  }

  // Strength-based filtering for equipment
  if (context.strength && controlLabel.toLowerCase().includes('armor')) {
    const strength = context.strength;

    filtered = filtered.filter(opt => {
      const name = opt.name.toLowerCase();
      const desc = (opt.description || '').toLowerCase();

      // Weak characters (1-2) can't wear heavy armor
      if (strength <= 2) {
        if (name.includes('heavy') || name.includes('plate') ||
            desc.includes('heavy armor')) {
          return false;
        }
      }

      return true;
    });
  }

  return filtered;
}
