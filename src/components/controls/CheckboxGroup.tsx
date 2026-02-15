import { Label } from '../ui/label';
import { Tooltip } from '../ui/tooltip';
import type { DataOption } from '../../types';

interface CheckboxGroupProps {
  label: string;
  value: string[];
  options: DataOption[];
  onChange: (value: string[]) => void;
}

export function CheckboxGroup({ label, value, options, onChange }: CheckboxGroupProps) {
  const handleToggle = (optionName: string) => {
    const newValue = value.includes(optionName)
      ? value.filter(v => v !== optionName)
      : [...value, optionName];
    onChange(newValue);
  };

  return (
    <div className="space-y-3 p-4 border rounded-md bg-card">
      <Label className="text-base font-semibold">{label}</Label>
      <div className="grid grid-cols-2 gap-2">
        {options.map((option) => (
          <label
            key={option.name}
            className="flex items-center gap-2 cursor-pointer hover:bg-accent/50 p-2 rounded transition-colors group"
          >
            <input
              type="checkbox"
              checked={value.includes(option.name)}
              onChange={() => handleToggle(option.name)}
              className="h-4 w-4 rounded border-gray-300 cursor-pointer accent-primary"
            />
            <span className="text-sm flex-1">{option.name}</span>
            {option.description && (
              <Tooltip content={option.description} />
            )}
          </label>
        ))}
      </div>
    </div>
  );
}
