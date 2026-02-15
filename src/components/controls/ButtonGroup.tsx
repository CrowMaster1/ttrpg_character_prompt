import { Check } from 'lucide-react';

interface ButtonGroupProps {
  label: string;
  value: string;
  options: Array<{ name: string; description?: string }>;
  onChange: (value: string) => void;
  allowNone?: boolean;
}

export function ButtonGroup({ label, value, options, onChange, allowNone = true }: ButtonGroupProps) {
  const handleClick = (optionName: string) => {
    // If clicking the already selected value and allowNone is true, deselect it
    if (value === optionName && allowNone) {
      onChange('');
    } else {
      onChange(optionName);
    }
  };

  return (
    <div className="button-group-control">
      <label className="control-label">{label}</label>
      <div className="button-group-grid">
        {options.map((option) => (
          <button
            key={option.name}
            onClick={() => handleClick(option.name)}
            className={`button-group-item ${value === option.name ? 'selected' : ''}`}
            type="button"
            title={option.description}
          >
            {value === option.name && (
              <Check size={14} className="check-icon" />
            )}
            <span className="button-text">{option.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
