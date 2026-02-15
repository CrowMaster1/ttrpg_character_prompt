import { useState } from 'react';
import { Label } from '../ui/label';
import { AlertTriangle } from 'lucide-react';

interface SliderControlProps {
  id: string;
  label: string;
  value: number; // 1-5
  levels: string[]; // ['Weak', 'Below Avg', 'Average', 'Strong', 'Very Strong']
  onChange: (value: number) => void;
  warning?: string; // Contradiction message
  emoji?: string; // Optional emoji icon
}

export function SliderControl({
  id,
  label,
  value,
  levels,
  onChange,
  warning,
  emoji
}: SliderControlProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  const currentLevel = value >= 1 && value <= levels.length ? levels[value - 1] : 'None';

  return (
    <div className="slider-control">
      <div className="slider-header">
        <Label className="slider-label">
          {emoji && <span className="slider-emoji">{emoji}</span>}
          {label}
        </Label>
        {warning && (
          <div
            className="slider-warning"
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
          >
            <AlertTriangle className="warning-icon" />
            {showTooltip && (
              <div className="warning-tooltip">
                {warning}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="slider-value-display">
        <div className="slider-dots">
          {levels.map((_, index) => (
            <span
              key={index}
              className={`slider-dot ${index < value ? 'active' : ''}`}
            />
          ))}
        </div>
        <span className="slider-current-level">{currentLevel}</span>
      </div>

      <div className="slider-track">
        <input
          type="range"
          id={id}
          min="1"
          max={levels.length}
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value))}
          className="slider-input"
        />
      </div>

      <div className="slider-labels">
        {levels.map((level, index) => (
          <button
            key={index}
            type="button"
            onClick={() => onChange(index + 1)}
            className={`slider-label-button ${value === index + 1 ? 'active' : ''}`}
            title={level}
          >
            {level}
          </button>
        ))}
      </div>
    </div>
  );
}
