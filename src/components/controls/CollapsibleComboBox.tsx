import { useState } from 'react';
import { ChevronRight, ChevronDown, RefreshCw, Lock } from 'lucide-react';

interface CollapsibleComboBoxProps {
  label: string;
  value: string;
  options: Array<{ name: string; description?: string }>;
  onChange: (value: string) => void;
  defaultExpanded?: boolean;
  expanded?: boolean; // Controlled expansion from parent
  showAutoBadge?: boolean; // For auto-calculated values
  autoBadgeText?: string; // e.g., "Auto (from STR+CON)"
  showOverride?: boolean; // Show lock icon for manually overridden controls
  onHoverInfo?: (title: string, description: string) => void;
  onClearInfo?: () => void;
}

export function CollapsibleComboBox({
  label,
  value,
  options,
  onChange,
  defaultExpanded = false,
  expanded,
  showAutoBadge = false,
  autoBadgeText = 'Auto',
  showOverride = false,
}: CollapsibleComboBoxProps) {
  const [localIsExpanded, setLocalIsExpanded] = useState(defaultExpanded);

  // Use controlled expanded prop if provided, otherwise use local state
  const isExpanded = expanded !== undefined ? expanded : localIsExpanded;

  // Check if description adds value (not just repeating the name)
  const isUsefulDescription = (name: string, description: string): boolean => {
    if (!description || description === 'None') return false;

    // Normalize both strings
    const normalizeName = name.toLowerCase().replace(/[^a-z0-9]/g, ' ').trim();
    const normalizeDesc = description.toLowerCase().replace(/[^a-z0-9]/g, ' ').trim();

    // If description is just the name, hide it
    if (normalizeName === normalizeDesc) return false;

    // If description only adds common filler words, hide it
    const nameWords = new Set(normalizeName.split(/\s+/));
    const descWords = normalizeDesc.split(/\s+/);
    const uniqueDescWords = descWords.filter(w => !nameWords.has(w) && w.length > 2);

    // Show if description adds at least 2 meaningful words
    return uniqueDescWords.length >= 2;
  };

  const handleHeaderClick = () => {
    setLocalIsExpanded(!isExpanded);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleHeaderClick();
    }
  };

  const displayText = value || 'None';

  const contentId = `collapsible-${label.replace(/\s+/g, '-').toLowerCase()}`;

  return (
    <div className="collapsible-combo-box">
      <button
        type="button"
        className="collapsible-header"
        onClick={handleHeaderClick}
        onKeyDown={handleKeyDown}
        aria-expanded={isExpanded}
        aria-controls={contentId}
      >
        <span className="collapsible-icon">
          {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
        </span>
        <span className="collapsible-title">{label}:</span>
        <span className="collapsible-value">{displayText}</span>
        {showAutoBadge && (
          <span className="auto-badge" title={autoBadgeText}>
            <RefreshCw size={12} />
            Auto
          </span>
        )}
        {showOverride && (
          <span className="override-badge" title="Manually set (won't auto-update)">
            <Lock size={12} />
          </span>
        )}
      </button>

      <div
        id={contentId}
        className={`collapsible-content ${isExpanded ? 'expanded' : ''}`}
        role="group"
        aria-label={`${label} options`}
      >
        <div className="radio-list">
          {options.map((option) => (
            <label
              key={option.name}
              className="radio-item"
            >
              <input
                type="radio"
                name={`${label}-radio`}
                checked={value === option.name}
                onChange={() => onChange(option.name)}
                className="radio-input"
              />
              <span className="radio-label-with-desc">
                <span className="radio-label-text">{option.name}</span>
                {option.description && isUsefulDescription(option.name, option.description) && (
                  <span className="radio-description">{option.description}</span>
                )}
              </span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
