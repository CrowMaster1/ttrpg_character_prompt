import { useState, useEffect } from 'react';
import { ChevronRight, ChevronDown, Lock } from 'lucide-react';

interface CollapsibleCheckboxGroupProps {
  label: string;
  value: string[]; // Selected items
  options: Array<{ name: string; description?: string }>;
  onChange: (value: string[]) => void;
  defaultExpanded?: boolean;
  expanded?: boolean; // Controlled expansion from parent
  maxDisplay?: number; // Max selected items to show on collapsed bar
  showOverride?: boolean; // Show lock icon for manually overridden controls
  onHoverInfo?: (title: string, description: string) => void;
  onClearInfo?: () => void;
}

export function CollapsibleCheckboxGroup({
  label,
  value,
  options,
  onChange,
  defaultExpanded = false,
  expanded,
  maxDisplay = 3,
  showOverride = false,
  onHoverInfo,
  onClearInfo
}: CollapsibleCheckboxGroupProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  // Sync with controlled expansion prop
  useEffect(() => {
    if (expanded !== undefined) {
      setIsExpanded(expanded);
    }
  }, [expanded]);

  // Ensure value is always an array (handle edge cases)
  const arrayValue = Array.isArray(value) ? value : value ? [value] : [];

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

  const handleToggle = (optionName: string) => {
    const newValue = arrayValue.includes(optionName)
      ? arrayValue.filter(v => v !== optionName)
      : [...arrayValue, optionName];
    onChange(newValue);
  };

  const displayText = arrayValue.length === 0
    ? 'None'
    : arrayValue.length <= maxDisplay
    ? arrayValue.join(', ')
    : `${arrayValue.slice(0, maxDisplay).join(', ')}, +${arrayValue.length - maxDisplay} more`;

  const handleHeaderClick = () => {
    setIsExpanded(!isExpanded);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleHeaderClick();
    }
  };

  const contentId = `collapsible-${label.replace(/\s+/g, '-').toLowerCase()}`;

  return (
    <div className="collapsible-checkbox-group">
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
        <div className="checkbox-list">
          {options.map((option) => (
            <label
              key={option.name}
              className="checkbox-item"
            >
              <input
                type="checkbox"
                checked={arrayValue.includes(option.name)}
                onChange={() => handleToggle(option.name)}
                className="checkbox-input"
              />
              <span className="checkbox-label-with-desc">
                <span className="checkbox-label-text">{option.name}</span>
                {option.description && isUsefulDescription(option.name, option.description) && (
                  <span className="checkbox-description">{option.description}</span>
                )}
              </span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
