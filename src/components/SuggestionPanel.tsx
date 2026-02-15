import { useState } from 'react';
import { Lightbulb, ExternalLink, ChevronDown, ChevronRight } from 'lucide-react';
import type { SimpleSelections } from '../services/randomizer';
// Styles consolidated in ../styles/components.css

interface Suggestion {
  category: string;
  reason: string;
  controls: Array<{ id: string; label: string; tabId: string }>;
}

interface SuggestionPanelProps {
  sliders: SimpleSelections;
  onNavigateToControl: (tabId: string, controlId: string) => void;
}

export function SuggestionPanel({ sliders, onNavigateToControl }: SuggestionPanelProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);
  const suggestions: Suggestion[] = [];

  const handleToggle = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  // Helper to check if stat is low (1-2)
  const isLow = (value: number) => value <= 2;
  // Helper to check if stat is high (4-5)
  const isHigh = (value: number) => value >= 4;

  // === CHARISMA SUGGESTIONS ===
  if (isHigh(sliders.charisma)) {
    suggestions.push({
      category: 'High Charisma',
      reason: 'Enhance attractiveness with alluring traits and flattering presentation',
      controls: [
        { id: 'allure_feminine', label: 'Alluring Traits (Feminine)', tabId: 'features' },
        { id: 'allure_masculine', label: 'Alluring Traits (Masculine)', tabId: 'features' },
        { id: 'lighting', label: 'Lighting', tabId: 'camera_composition' },
        { id: 'camera_angle', label: 'Camera Angle', tabId: 'camera_composition' },
        { id: 'grooming', label: 'Grooming', tabId: 'hair' },
      ]
    });
  }

  if (isLow(sliders.charisma)) {
    suggestions.push({
      category: 'Low Charisma',
      reason: 'Emphasize unflattering traits and harsh presentation',
      controls: [
        { id: 'uncharming_traits', label: 'Uncharming Traits', tabId: 'features' },
        { id: 'lighting', label: 'Lighting', tabId: 'camera_composition' },
        { id: 'camera_angle', label: 'Camera Angle', tabId: 'camera_composition' },
        { id: 'grooming', label: 'Grooming', tabId: 'hair' },
      ]
    });
  }

  // === CONSTITUTION SUGGESTIONS ===
  if (isHigh(sliders.constitution)) {
    suggestions.push({
      category: 'High Constitution',
      reason: 'Show healthy, vibrant appearance',
      controls: [
        { id: 'skin', label: 'Skin & Complexion', tabId: 'character_basics' },
        { id: 'grooming', label: 'Grooming', tabId: 'hair' },
        { id: 'color_grading', label: 'Color Grading', tabId: 'camera_composition' },
      ]
    });
  }

  if (isLow(sliders.constitution)) {
    suggestions.push({
      category: 'Low Constitution',
      reason: 'Show sickly, weak appearance',
      controls: [
        { id: 'afflictions', label: 'Afflictions', tabId: 'features' },
        { id: 'uncharming_traits', label: 'Uncharming Traits', tabId: 'features' },
        { id: 'skin', label: 'Skin & Complexion', tabId: 'character_basics' },
        { id: 'color_grading', label: 'Color Grading', tabId: 'camera_composition' },
      ]
    });
  }

  // === STRENGTH SUGGESTIONS ===
  if (isHigh(sliders.strength)) {
    suggestions.push({
      category: 'High Strength',
      reason: 'Display powerful, muscular physique',
      controls: [
        { id: 'muscle', label: 'Muscle / Strength', tabId: 'character_basics' },
        { id: 'muscle_definition', label: 'Muscle Definition', tabId: 'character_basics' },
        { id: 'pose', label: 'Action/Pose', tabId: 'expression_demeanor' },
      ]
    });
  }

  if (isLow(sliders.strength)) {
    suggestions.push({
      category: 'Low Strength',
      reason: 'Show weak, frail physique',
      controls: [
        { id: 'muscle', label: 'Muscle / Strength', tabId: 'character_basics' },
        { id: 'uncharming_traits', label: 'Uncharming Traits', tabId: 'features' },
        { id: 'demeanor', label: 'Demeanor', tabId: 'expression_demeanor' },
      ]
    });
  }

  // === DEXTERITY SUGGESTIONS ===
  if (isHigh(sliders.dexterity)) {
    suggestions.push({
      category: 'High Dexterity',
      reason: 'Show agile, dynamic poses',
      controls: [
        { id: 'pose', label: 'Action/Pose', tabId: 'expression_demeanor' },
        { id: 'demeanor', label: 'Demeanor', tabId: 'expression_demeanor' },
      ]
    });
  }

  if (isLow(sliders.dexterity)) {
    suggestions.push({
      category: 'Low Dexterity',
      reason: 'Show clumsy, awkward posture',
      controls: [
        { id: 'uncharming_traits', label: 'Uncharming Traits', tabId: 'features' },
        { id: 'demeanor', label: 'Demeanor', tabId: 'expression_demeanor' },
      ]
    });
  }

  // === AGE SUGGESTIONS ===
  if (isHigh(sliders.age)) {
    suggestions.push({
      category: 'High Age',
      reason: 'Show elderly features and aging',
      controls: [
        { id: 'uncharming_traits', label: 'Age Features', tabId: 'features' },
        { id: 'hair_color', label: 'Hair Color', tabId: 'hair' },
      ]
    });
  }

  // Don't show suggestions if none were generated
  if (suggestions.length === 0) {
    return null;
  }

  return (
    <div className="suggestion-panel">
      <div className="suggestion-header">
        <Lightbulb size={16} />
        <h3>Suggestions Based on Stats</h3>
      </div>
      <div className="suggestion-list">
        {suggestions.map((suggestion, idx) => {
          const isExpanded = expandedIndex === idx;
          return (
            <div key={idx} className="suggestion-item">
              <button
                className="suggestion-category-btn"
                onClick={() => handleToggle(idx)}
              >
                {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                <span className="suggestion-category">{suggestion.category}</span>
              </button>
              {isExpanded && (
                <div className="suggestion-content">
                  <div className="suggestion-reason">{suggestion.reason}</div>
                  <div className="suggestion-controls">
                    {suggestion.controls.map((control) => (
                      <button
                        key={control.id}
                        className="suggestion-btn"
                        onClick={() => onNavigateToControl(control.tabId, control.id)}
                        title={`Go to ${control.label}`}
                      >
                        <ExternalLink size={10} />
                        {control.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
