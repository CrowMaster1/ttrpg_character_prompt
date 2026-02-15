import * as React from 'react';
import { useState, useEffect, useImperativeHandle, useRef } from 'react';
import { RotateCcw, Shuffle } from 'lucide-react';
import { CollapsibleCheckboxGroup } from './controls/CollapsibleCheckboxGroup';
import { CollapsibleComboBox } from './controls/CollapsibleComboBox';
import { LevelGroup } from './controls/LevelGroup';
import { ContextualControl } from './controls/ContextualControl';
import { EquipmentPresetManager } from './EquipmentPresetManager';
import { ContradictionWarning } from './ContradictionWarning';
import { useStore } from '../store/useStore';
import { detectContradictions, resolveContradiction, type ContradictionRule } from '../services/contradictionDetector';
import { syncSlidersToControls } from '../services/sliderSync';
import { generateRandomCharacter, type SimpleSelections } from '../services/randomizer';
import type { ControlsConfig, ControlConfig, Selections } from '../types';
import type { EquipmentSlot } from '../services/equipmentPresets';

interface TweakPanelProps {
  controlsConfig: ControlsConfig;
  dataCache: Record<string, any>;
  selections: Selections;
  onSelectionChange: (controlId: string, value: any) => void;
  onResetAll?: () => void;
  sliders: SimpleSelections;
  onSliderChange: (sliderId: keyof SimpleSelections, value: number) => void;
  sliderWarnings: Record<string, string>;
}

export interface TweakPanelHandle {
  navigateTo: (tabId: string, controlId: string) => void;
}

export const TweakPanel = React.forwardRef<TweakPanelHandle, TweakPanelProps>(({
  controlsConfig,
  dataCache,
  selections,
  onSelectionChange,
  onResetAll,
  sliders,
  onSliderChange,
  sliderWarnings,
}, ref) => {
  const [activeTab, setActiveTab] = useState('character_basics');
  const [equipmentSlots, setEquipmentSlots] = useState<EquipmentSlot>({});
  const [highlightedControl, setHighlightedControl] = useState<string | null>(null);
  const [expandedControl, setExpandedControl] = useState<string | null>(null);
  const [autoHighlightedControl, setAutoHighlightedControl] = useState<string | null>(null);

  // Refs for timer cleanup
  const scrollTimerRef = useRef<NodeJS.Timeout | null>(null);
  const highlightTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Get contradictions and overrides from store
  const { contradictions, setContradictions, overrides, addOverride, clearOverrides } = useStore();

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (scrollTimerRef.current) clearTimeout(scrollTimerRef.current);
      if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current);
    };
  }, []);

  // Expose navigation method via ref
  useImperativeHandle(ref, () => ({
    navigateTo: (tabId: string, controlId: string) => {
      // Clear any existing timers
      if (scrollTimerRef.current) clearTimeout(scrollTimerRef.current);
      if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current);

      setActiveTab(tabId);
      setHighlightedControl(controlId);
      setExpandedControl(controlId);

      // Scroll to control after tab switch and expansion
      scrollTimerRef.current = setTimeout(() => {
        const element = document.getElementById(`control-${controlId}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        scrollTimerRef.current = null;
      }, 150);

      // Remove highlight after 3 seconds
      highlightTimerRef.current = setTimeout(() => {
        setHighlightedControl(null);
        highlightTimerRef.current = null;
      }, 3000);
    }
  }), []);

  // Detect contradictions whenever selections or sliders change
  useEffect(() => {
    const detected = detectContradictions(selections, sliders);
    setContradictions(detected);
  }, [selections, sliders]);

  // Handle slider changes (forwarded from parent via sidebar)
  useEffect(() => {
    // Get suggestions from slider sync
    const suggestions = syncSlidersToControls(sliders, dataCache, overrides);

    // Track stat-dependent controls that should auto-highlight when they appear
    const statDependentControls = ['muscle', 'body_fat', 'attractiveness', 'body_shape', 'height'];

    // Apply suggestions (only for non-overridden controls)
    Object.entries(suggestions).forEach(([key, val]) => {
      if (!overrides.has(key)) {
        const hadNoValue = !selections[key] || selections[key] === '';
        onSelectionChange(key, val);

        // Auto-highlight stat-dependent controls when they first get a value
        if (hadNoValue && val && statDependentControls.includes(key)) {
          setAutoHighlightedControl(key);
          // Clear after animation completes (2s pulse × 3 = 6s)
          setTimeout(() => {
            setAutoHighlightedControl(null);
          }, 6000);
        }
      }
    });
  }, [sliders, dataCache, overrides]);

  // Handle manual control changes (mark as override)
  const handleManualChange = (controlId: string, value: any) => {
    addOverride(controlId);
    onSelectionChange(controlId, value);
  };

  // Handle randomize
  const handleRandomize = () => {
    if (Object.keys(dataCache).length === 0) return;
    const randomSelections = generateRandomCharacter(dataCache);

    // Reset overrides
    clearOverrides();

    // Reset sliders to default (via parent)
    const keys: (keyof SimpleSelections)[] = ['strength', 'dexterity', 'constitution', 'age', 'intelligence', 'charisma'];
    keys.forEach(key => onSliderChange(key, 3));

    // Apply random selections
    for (const [key, value] of Object.entries(randomSelections)) {
      onSelectionChange(key, value);
    }
  };

  // Handle reset
  const handleReset = () => {
    clearOverrides();

    // Reset sliders to default (via parent)
    const keys: (keyof SimpleSelections)[] = ['strength', 'dexterity', 'constitution', 'age', 'intelligence', 'charisma'];
    keys.forEach(key => onSliderChange(key, 3));

    if (onResetAll) {
      onResetAll();
    }
  };

  // Handle auto-resolve contradiction
  const handleAutoResolve = (contradiction: ContradictionRule) => {
    const resolved = resolveContradiction(contradiction, selections, sliders);
    // Apply all resolved selections
    Object.entries(resolved).forEach(([key, val]) => {
      onSelectionChange(key, val);
    });
  };

  // Handle navigate to control from contradiction
  const handleNavigateToControl = (controlId: string) => {
    // Find which tab contains this control
    const tab = tabs.find(t => t.controls && (t.controls as string[]).includes(controlId));
    if (tab) {
      setActiveTab(tab.id);
      setExpandedControl(controlId);
      setHighlightedControl(controlId);

      // Scroll to control after tab switch and expansion
      setTimeout(() => {
        const element = document.getElementById(`control-${controlId}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 150);

      // Remove highlight after 3 seconds
      setTimeout(() => {
        setHighlightedControl(null);
      }, 3000);
    }
  };

  // Controls that should use checkboxes (multi-select)
  const multiSelectControls = new Set([
    'facial_features',
    'monstrous_features',
    'afflictions',
    'uncharming_traits',
    'teeth_display',
    'allure_feminine',
    'allure_masculine',
    'alluring_poses',
    'clothing_modifiers',
    'allure_clothing',
    'adult_clothing',
  ]);

  // Controls that should stay as level groups
  const levelGroupControls = new Set([
    'attractiveness',
    'muscle',
    'body_fat',
    'muscle_definition',
    'age_level',
    'demeanor',
    'nsfw_clothing_states',
    'nsfw_poses',
    'nsfw_camera_angles',
  ]);

  const renderControl = (controlId: string) => {
    const config: ControlConfig = controlsConfig.controls[controlId];
    if (!config) return null;

    const data = dataCache[controlId];
    const isOverridden = overrides.has(controlId);
    const isExpanded = expandedControl === controlId;

    // Use level group for specific controls
    if (levelGroupControls.has(controlId) || config.ui_type === 'level_group') {
      return (
        <LevelGroup
          key={controlId}
          label={config.label}
          value={selections[controlId] || null}
          data={data || {}}
          onChange={(value) => handleManualChange(controlId, value)}
          collapsible={true}
          defaultExpanded={isExpanded}
          expanded={isExpanded ? true : undefined}
          showOverride={isOverridden}
        />
      );
    }

    // Use checkbox group for multi-select
    if (multiSelectControls.has(controlId) || config.ui_type === 'checkbox_group') {
      return (
        <CollapsibleCheckboxGroup
          key={controlId}
          label={config.label}
          value={selections[controlId] || []}
          options={data || []}
          onChange={(value) => handleManualChange(controlId, value)}
          defaultExpanded={isExpanded}
          expanded={isExpanded ? true : undefined}
          showOverride={isOverridden}
        />
      );
    }

    // Use combo box for single-select
    if (Array.isArray(data)) {
      return (
        <CollapsibleComboBox
          key={controlId}
          label={config.label}
          value={selections[controlId] || ''}
          options={data}
          onChange={(value) => handleManualChange(controlId, value)}
          defaultExpanded={isExpanded}
          expanded={isExpanded ? true : undefined}
          showAutoBadge={!isOverridden && ['body_shape', 'height'].includes(controlId)}
          autoBadgeText={controlId === 'body_shape' ? 'Auto (from STR+CON)' : 'Auto'}
          showOverride={isOverridden}
        />
      );
    }

    // Fallback to contextual control
    return (
      <ContextualControl
        key={controlId}
        label={config.label}
        value={selections[controlId] || ''}
        options={data || []}
        onChange={(value) => handleManualChange(controlId, value)}
        multiSelect={false}
        useButtonGroup={config.ui_type === 'button_group'}
        addNone={config.add_none}
        defaultExpanded={isExpanded}
        expanded={isExpanded ? true : undefined}
      />
    );
  };

  // Handler for equipment preset application
  const handleApplyPreset = (slots: EquipmentSlot, presetId: string) => {
    setEquipmentSlots(slots);
    onSelectionChange('equipment_preset', presetId);
    onSelectionChange('equipment_slots', slots);
  };

  const handleSlotChange = (slot: keyof EquipmentSlot, value: string) => {
    const newSlots = { ...equipmentSlots, [slot]: value };
    setEquipmentSlots(newSlots);
    onSelectionChange('equipment_slots', newSlots);
  };

  // Tab configuration (sliders moved to sidebar)
  const tabs = [
    {
      id: 'character_basics',
      label: 'Character',
      controls: ['gender', 'race', 'muscle', 'body_fat', 'attractiveness', 'height', 'body_shape', 'skin']
    },
    {
      id: 'camera_composition',
      label: 'Camera',
      controls: ['camera_angle', 'camera_position', 'framing', 'lighting', 'depth_of_field', 'aesthetic', 'genre_style', 'rendering_style', 'mood', 'color_grading']
    },
    {
      id: 'expression_demeanor',
      label: 'Expression',
      controls: ['expressions', 'demeanor', 'facial_features', 'pose', 'looking_direction']
    },
    {
      id: 'hair',
      label: 'Hair',
      controls: ['hair_color', 'hair_style', 'hair_length', 'beard_type', 'grooming']
    },
    {
      id: 'gear',
      label: 'Gear',
      controls: [],
      isPresetManager: true
    },
    {
      id: 'features',
      label: 'Features',
      controls: [
        'monstrous_features',
        'afflictions',
        'uncharming_traits',
        'teeth_display',
        'allure_feminine',
        'allure_masculine',
        'alluring_poses',
        'clothing_modifiers',
        'allure_clothing',
        'nsfw_clothing_states',
        'nsfw_poses',
        'nsfw_camera_angles'
      ]
    },
    {
      id: 'backdrop',
      label: 'Backdrop',
      controls: ['scene', 'weather', 'shadows']
    }
  ];

  const currentTab = tabs.find(t => t.id === activeTab);

  // Count selections per tab
  const getTabSelectionCount = (tabId: string): number => {
    const tab = tabs.find(t => t.id === tabId);
    if (!tab || !tab.controls) return 0;

    return tab.controls.filter(controlId => {
      const value = selections[controlId];
      // Count if value exists and is not empty
      if (Array.isArray(value)) {
        return value.length > 0;
      }
      if (typeof value === 'object' && value !== null) {
        return true; // Level group objects count as selections
      }
      return value !== undefined && value !== null && value !== '';
    }).length;
  };

  return (
    <div className="tweak-panel-tabbed">
      {/* Tab Navigation */}
      <div className="tab-nav">
        {tabs.map(tab => {
          const selectionCount = getTabSelectionCount(tab.id);
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            >
              {tab.label}
              {selectionCount > 0 && (
                <span className="tab-badge">{selectionCount}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Contradictions Panel */}
      {contradictions.length > 0 && (
        <div className="contradictions-panel" style={{
          padding: '12px',
          background: '#fff3cd',
          border: '1px solid #ffc107',
          borderRadius: '6px',
          marginBottom: '16px'
        }}>
          <h4 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>
            ⚠️ Warnings ({contradictions.length})
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {contradictions.map(c => (
              <ContradictionWarning
                key={c.id}
                contradiction={c}
                onResolve={() => handleAutoResolve(c)}
                onNavigate={handleNavigateToControl}
              />
            ))}
          </div>
        </div>
      )}

      {/* Tab Content */}
      <div className="tab-content">
        {/* Equipment Preset Manager */}
        {currentTab?.isPresetManager && (
          <div className="tab-section">
            <EquipmentPresetManager
              currentSlots={equipmentSlots}
              onApplyPreset={handleApplyPreset}
              onSlotChange={handleSlotChange}
            />
          </div>
        )}

        {/* Controls */}
        {currentTab?.controls && currentTab.controls.length > 0 && (
          <div className="tab-section">
            <div className="controls-grid">
              {currentTab.controls.map(controlId => {
                if (!controlsConfig.controls[controlId]) return null;
                return (
                  <div
                    key={controlId}
                    id={`control-${controlId}`}
                    className={`control-item ${highlightedControl === controlId ? 'highlighted' : ''} ${autoHighlightedControl === controlId ? 'auto-highlight' : ''}`}
                  >
                    {renderControl(controlId)}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Panel Actions */}
      <div className="panel-actions">
        <button onClick={handleRandomize} className="btn btn-secondary">
          <Shuffle size={16} />
          Randomize All
        </button>
        <button onClick={handleReset} className="btn btn-secondary">
          <RotateCcw size={16} />
          Reset to Defaults
        </button>
      </div>
    </div>
  );
});
