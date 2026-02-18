import React, { useCallback, useRef } from 'react';
import { CompactStatSlider } from './controls/CompactStatSlider';
import { SuggestionPanel } from './SuggestionPanel';
import { QuickResetPanel } from './QuickResetPanel';
import type { SimpleSelections } from '../services/randomizer';

interface StatsSidebarPanelProps {
  sliders: SimpleSelections;
  onChange: (sliderId: keyof SimpleSelections, value: number) => void;
  warnings?: Record<string, string>;
  onNavigateToControl?: (tabId: string, controlId: string) => void;
  onResetPose?: () => void;
  onResetCamera?: () => void;
  onResetLighting?: () => void;
}

export function StatsSidebarPanel({ sliders, onChange, warnings = {}, onNavigateToControl, onResetPose, onResetCamera, onResetLighting }: StatsSidebarPanelProps) {
  const debounceTimers = useRef<Record<string, NodeJS.Timeout>>({});

  // Debounced onChange with 100ms delay
  const debouncedOnChange = useCallback((sliderId: keyof SimpleSelections, value: number) => {
    // Clear existing timer for this slider
    if (debounceTimers.current[sliderId]) {
      clearTimeout(debounceTimers.current[sliderId]);
    }

    // Set new timer
    debounceTimers.current[sliderId] = setTimeout(() => {
      onChange(sliderId, value);
      delete debounceTimers.current[sliderId];
    }, 100);
  }, [onChange]);

  return (
    <div className="stats-sidebar">
      {/* Character Stats */}
      <div className="stats-section">
        <div className="stats-section-header">Character Stats</div>
        <CompactStatSlider
          label="STR"
          value={sliders.strength}
          onChange={(val) => debouncedOnChange('strength', val)}
          warning={warnings.strength}
        />
        <CompactStatSlider
          label="DEX"
          value={sliders.dexterity}
          onChange={(val) => debouncedOnChange('dexterity', val)}
          warning={warnings.dexterity}
        />
        <CompactStatSlider
          label="CON"
          value={sliders.constitution}
          onChange={(val) => debouncedOnChange('constitution', val)}
          warning={warnings.constitution}
        />
        <CompactStatSlider
          label="AGE"
          value={sliders.age}
          onChange={(val) => debouncedOnChange('age', val)}
          warning={warnings.age}
        />
        <CompactStatSlider
          label="INT"
          value={sliders.intelligence}
          onChange={(val) => debouncedOnChange('intelligence', val)}
          warning={warnings.intelligence}
        />
        <CompactStatSlider
          label="CHA"
          value={sliders.charisma}
          onChange={(val) => debouncedOnChange('charisma', val)}
          warning={warnings.charisma}
        />
      </div>

      {/* Quick Reset Panel */}
      {onResetPose && onResetCamera && onResetLighting && (
        <QuickResetPanel
          onResetPose={onResetPose}
          onResetCamera={onResetCamera}
          onResetLighting={onResetLighting}
        />
      )}

      {/* Suggestions based on extreme stats */}
      {onNavigateToControl && (
        <SuggestionPanel
          sliders={sliders}
          onNavigateToControl={onNavigateToControl}
        />
      )}
    </div>
  );
}
