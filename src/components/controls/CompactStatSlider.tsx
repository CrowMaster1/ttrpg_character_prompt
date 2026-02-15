import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface CompactStatSliderProps {
  id: string;
  label: string; // 3-letter abbreviation (STR, DEX, etc.)
  value: number; // 1-5
  onChange: (value: number) => void;
  warning?: string;
}

export function CompactStatSlider({ id, label, value, onChange, warning }: CompactStatSliderProps) {
  const dots = [1, 2, 3, 4, 5];

  const handleDecrement = () => {
    if (value > 1) {
      onChange(value - 1);
    }
  };

  const handleIncrement = () => {
    if (value < 5) {
      onChange(value + 1);
    }
  };

  const fullStatName = {
    'STR': 'Strength',
    'DEX': 'Dexterity',
    'CON': 'Constitution',
    'AGE': 'Age',
    'INT': 'Intelligence',
    'CHA': 'Charisma'
  }[label] || label;

  return (
    <div className="compact-stat-slider" role="group" aria-label={`${fullStatName} slider`}>
      <span className="stat-label">{label}</span>
      <button
        className="stat-arrow stat-arrow-left"
        onClick={handleDecrement}
        disabled={value <= 1}
        title={`Decrease ${label}`}
        aria-label={`Decrease ${label}`}
      >
        <ChevronLeft size={16} />
      </button>
      <div className="stat-dots">
        {dots.map((level) => (
          <button
            key={level}
            className={`stat-dot ${level <= value ? 'active' : ''}`}
            onClick={() => onChange(level)}
            title={`Set ${label} to ${level}`}
            aria-label={`Set ${label} to ${level}`}
          />
        ))}
      </div>
      <button
        className="stat-arrow stat-arrow-right"
        onClick={handleIncrement}
        disabled={value >= 5}
        title={`Increase ${label}`}
        aria-label={`Increase ${label}`}
      >
        <ChevronRight size={16} />
      </button>
      <span className="stat-value">{value}</span>
      {warning && (
        <span className="stat-warning" title={warning}>⚠</span>
      )}
    </div>
  );
}
