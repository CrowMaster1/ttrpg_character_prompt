import { Label } from '../ui/label';
import { Select } from '../ui/select';
import { Tooltip } from '../ui/tooltip';
import type { DataOption } from '../../types';

interface SimpleComboProps {
  label: string;
  value: string;
  options: DataOption[];
  onChange: (value: string) => void;
  addNone?: boolean;
}

export function SimpleCombo({ label, value, options, onChange, addNone }: SimpleComboProps) {
  const allOptions = addNone ? [{ name: 'None', description: 'None' }, ...options] : options;
  const selectedOption = allOptions.find(opt => opt.name === value);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Label>{label}</Label>
        {selectedOption?.description && selectedOption.description !== 'None' && (
          <Tooltip content={selectedOption.description} />
        )}
      </div>
      <Select value={value || (addNone ? 'None' : '')} onChange={(e) => onChange(e.target.value)}>
        {!value && !addNone && <option value="">Select...</option>}
        {allOptions.map((opt) => (
          <option key={opt.name} value={opt.name} title={opt.description}>
            {opt.name}
          </option>
        ))}
      </Select>
    </div>
  );
}
