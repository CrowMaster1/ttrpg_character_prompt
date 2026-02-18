import { useState } from 'react';
import { ChevronRight, ChevronDown, Lock } from 'lucide-react';
import { Label } from '../ui/label';
import { Select } from '../ui/select';
import type { LevelGroupData, NSFWLevelData } from '../../types';

interface LevelGroupProps {
  label: string;
  value: { level: number; qualifier: string } | null;
  data: LevelGroupData | Record<string, NSFWLevelData>;
  onChange: (value: { level: number; qualifier: string } | null) => void;
  defaultExpanded?: boolean;
  expanded?: boolean; // Controlled expansion from parent
  collapsible?: boolean;
  showOverride?: boolean; // Show lock icon for manually overridden controls
  onHoverInfo?: (title: string, description: string) => void;
  onClearInfo?: () => void;
}

export function LevelGroup({
  label,
  value,
  data,
  onChange,
  defaultExpanded = false,
  expanded,
  collapsible = false,
  showOverride = false,
  onHoverInfo,
  onClearInfo
}: LevelGroupProps) {
  const [localIsExpanded, setLocalIsExpanded] = useState(defaultExpanded);

  // Use controlled expanded prop if provided, otherwise use local state
  const isExpanded = expanded !== undefined ? expanded : localIsExpanded;

  const selectedLevel = value?.level || 0;
  const selectedQualifier = value?.qualifier || '';

  const levels = Object.keys(data).filter(k => k !== '0');
  const currentLevelData = selectedLevel > 0 ? data[selectedLevel.toString()] : null;

  // Handle both LevelGroupData and NSFWLevelData formats
  const qualifiers: string[] = currentLevelData
    ? 'qualifiers' in currentLevelData
      ? (currentLevelData as { qualifiers: string[] }).qualifiers
      : 'options' in currentLevelData
      ? (currentLevelData as { options: Array<{ name: string }> }).options.map((opt: { name: string }) => opt.name)
      : []
    : [];

  // Get description for current level
  const levelDescription = currentLevelData && 'description' in currentLevelData
    ? String((currentLevelData as { description?: string }).description || '')
    : '';

  const handleLevelChange = (level: number) => {
    if (level === 0) {
      onChange(null);
    } else {
      // Find default qualifier for this level
      const newLevelData = data[level.toString()];
      const newQualifiers: string[] = newLevelData
        ? 'qualifiers' in newLevelData
          ? (newLevelData as { qualifiers: string[] }).qualifiers
          : 'options' in newLevelData
          ? (newLevelData as { options: Array<{ name: string }> }).options.map((opt: { name: string }) => opt.name)
          : []
        : [];
      const defaultQual = newQualifiers.length > 0 ? newQualifiers[0] : '';
      onChange({ level, qualifier: defaultQual });
    }
  };

  const handleQualifierChange = (qualifier: string) => {
    onChange({ level: selectedLevel, qualifier });
  };

  // Get display text for collapsed state
  const getDisplayText = () => {
    if (selectedLevel === 0) return 'None';
    const levelData = data[selectedLevel.toString()];
    const levelName = 'name' in levelData ? levelData.name : `Level ${selectedLevel}`;
    return selectedQualifier ? `${levelName} - ${selectedQualifier}` : levelName;
  };

  // Non-collapsible version (original behavior)
  if (!collapsible) {
    return (
      <div className="space-y-3 p-4 border rounded-md bg-card">
        <div
          className="flex items-center gap-2"
          onMouseEnter={() => {
            if (levelDescription && levelDescription !== '' && onHoverInfo) {
              onHoverInfo(label, levelDescription);
            }
          }}
          onMouseLeave={() => {
            if (onClearInfo) {
              onClearInfo();
            }
          }}
        >
          <Label className="text-base font-semibold">{label}</Label>
        </div>

        {/* Level selector - Radio buttons */}
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => handleLevelChange(0)}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
              selectedLevel === 0
                ? 'bg-primary text-primary-foreground shadow-md scale-105'
                : 'bg-secondary hover:bg-secondary/80 hover:scale-105'
            }`}
          >
            None
          </button>
          {levels.map((level) => {
            const levelData = data[level];
            const levelName = 'name' in levelData ? levelData.name : `Level ${level}`;

            return (
              <button
                key={level}
                type="button"
                onClick={() => handleLevelChange(parseInt(level))}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all capitalize ${
                  selectedLevel === parseInt(level)
                    ? 'bg-primary text-primary-foreground shadow-md scale-105'
                    : 'bg-secondary hover:bg-secondary/80 hover:scale-105'
                }`}
                title={levelName}
              >
                {level}: {levelName}
              </button>
            );
          })}
        </div>

        {/* Qualifier dropdown - Only shown when level > 0 */}
        {selectedLevel > 0 && qualifiers.length > 0 && (
          <div className="space-y-2 pt-2 border-t">
            <Label className="text-sm text-muted-foreground">Variation:</Label>
            <Select
              value={selectedQualifier}
              onChange={(e) => handleQualifierChange(e.target.value)}
              className="bg-background"
            >
              {qualifiers.map((qualifier) => (
                <option key={qualifier} value={qualifier}>
                  {qualifier}
                </option>
              ))}
            </Select>
          </div>
        )}
      </div>
    );
  }

  const handleHeaderClick = () => {
    setLocalIsExpanded(!localIsExpanded);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleHeaderClick();
    }
  };

  const contentId = `collapsible-${label.replace(/\s+/g, '-').toLowerCase()}`;

  // Collapsible version
  return (
    <div className="collapsible-combo-box">
      <button
        type="button"
        className="collapsible-header"
        onClick={handleHeaderClick}
        onKeyDown={handleKeyDown}
        aria-expanded={isExpanded}
        aria-controls={contentId}
        onMouseEnter={() => {
          if (levelDescription && levelDescription !== '' && onHoverInfo) {
            onHoverInfo(label, levelDescription);
          }
        }}
        onMouseLeave={() => {
          if (onClearInfo) {
            onClearInfo();
          }
        }}
      >
        <span className="collapsible-icon">
          {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
        </span>
        <span className="collapsible-title">
          {label}:
        </span>
        <span className="collapsible-value">{getDisplayText()}</span>
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
        {/* Level selector - Radio buttons */}
        <div className="flex flex-wrap gap-2 mb-3">
          <button
            type="button"
            onClick={() => handleLevelChange(0)}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
              selectedLevel === 0
                ? 'bg-primary text-primary-foreground shadow-md scale-105'
                : 'bg-secondary hover:bg-secondary/80 hover:scale-105'
            }`}
          >
            None
          </button>
          {levels.map((level) => {
            const levelData = data[level];
            const levelName = 'name' in levelData ? levelData.name : `Level ${level}`;

            return (
              <button
                key={level}
                type="button"
                onClick={() => handleLevelChange(parseInt(level))}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all capitalize ${
                  selectedLevel === parseInt(level)
                    ? 'bg-primary text-primary-foreground shadow-md scale-105'
                    : 'bg-secondary hover:bg-secondary/80 hover:scale-105'
                }`}
                title={levelName}
              >
                {level}: {levelName}
              </button>
            );
          })}
        </div>

        {/* Qualifier dropdown - Only shown when level > 0 */}
        {selectedLevel > 0 && qualifiers.length > 0 && (
          <div className="space-y-2 pt-2 border-t">
            <Label className="text-sm text-muted-foreground">Variation:</Label>
            <Select
              value={selectedQualifier}
              onChange={(e) => handleQualifierChange(e.target.value)}
              className="bg-background"
            >
              {qualifiers.map((qualifier) => (
                <option key={qualifier} value={qualifier}>
                  {qualifier}
                </option>
              ))}
            </Select>
          </div>
        )}
      </div>
    </div>
  );
}
