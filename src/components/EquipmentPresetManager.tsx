import { useState, useEffect } from 'react';
import { Package, RefreshCw, Check } from 'lucide-react';
import {
  getAllPresets,
  getPresetById,
  getCurrentPreset,
  applyPreset,
  type EquipmentSlot,
  type EquipmentPreset
} from '../services/equipmentPresets';

interface EquipmentPresetManagerProps {
  currentSlots: EquipmentSlot;
  onApplyPreset: (slots: EquipmentSlot, presetId: string) => void;
  onSlotChange: (slot: keyof EquipmentSlot, value: string) => void;
}

export function EquipmentPresetManager({
  currentSlots,
  onApplyPreset,
  onSlotChange,
}: EquipmentPresetManagerProps) {
  const [selectedPresetId, setSelectedPresetId] = useState<string>('');
  const [lastAppliedPreset, setLastAppliedPreset] = useState<string | null>(null);
  const [previewPreset, setPreviewPreset] = useState<EquipmentPreset | null>(null);

  const presets = getAllPresets();
  const activePreset = getCurrentPreset(currentSlots);
  const isModified = lastAppliedPreset !== null && activePreset !== lastAppliedPreset;

  // Update preview when selection changes
  useEffect(() => {
    if (selectedPresetId) {
      const preset = getPresetById(selectedPresetId);
      setPreviewPreset(preset || null);
    } else {
      setPreviewPreset(null);
    }
  }, [selectedPresetId]);

  const handleApplyPreset = () => {
    if (!selectedPresetId) return;

    const slots = applyPreset(selectedPresetId);
    if (slots) {
      onApplyPreset(slots, selectedPresetId);
      setLastAppliedPreset(selectedPresetId);
    }
  };

  const handleReset = () => {
    if (lastAppliedPreset) {
      const slots = applyPreset(lastAppliedPreset);
      if (slots) {
        onApplyPreset(slots, lastAppliedPreset);
      }
    }
  };

  // Organize presets by category
  const presetsByCategory = presets.reduce((acc: Record<string, EquipmentPreset[]>, preset: EquipmentPreset) => {
    if (!acc[preset.category]) {
      acc[preset.category] = [];
    }
    acc[preset.category].push(preset);
    return acc;
  }, {} as Record<string, EquipmentPreset[]>);

  const categoryLabels: Record<string, string> = {
    combat: '⚔️ Combat',
    magic: '✨ Magic',
    stealth: '🗡️ Stealth',
    social: '👔 Social',
    labor: '🔨 Labor',
  };

  return (
    <div className="equipment-preset-manager">
      {/* Preset Selector */}
      <div className="preset-selector-section">
        <div className="preset-header">
          <Package size={16} />
          <label>Equipment Preset</label>
          {activePreset && (
            <span className="active-preset-badge">
              <Check size={12} />
              {getPresetById(activePreset)?.name}
            </span>
          )}
          {isModified && (
            <span className="modified-badge">Modified</span>
          )}
        </div>

        <div className="preset-controls">
          <select
            value={selectedPresetId}
            onChange={(e) => setSelectedPresetId(e.target.value)}
            className="preset-dropdown"
          >
            <option value="">-- Select Preset --</option>
            {Object.entries(presetsByCategory).map(([category, categoryPresets]) => (
              <optgroup key={category} label={categoryLabels[category]}>
                {(categoryPresets as EquipmentPreset[]).map((preset: EquipmentPreset) => (
                  <option key={preset.id} value={preset.id}>
                    {preset.name}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>

          <div className="preset-actions">
            <button
              onClick={handleApplyPreset}
              disabled={!selectedPresetId}
              className="btn-apply-preset"
              title="Apply selected preset"
            >
              Apply
            </button>
            {isModified && (
              <button
                onClick={handleReset}
                className="btn-reset-preset"
                title="Reset to last applied preset"
              >
                <RefreshCw size={14} />
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Preview */}
        {previewPreset && (
          <div className="preset-preview">
            <div className="preview-header">
              <strong>Preview: {previewPreset.name}</strong>
              <span className="preview-tags">
                {previewPreset.tags.map((tag: string) => (
                  <span key={tag} className="tag">{tag}</span>
                ))}
              </span>
            </div>
            <p className="preview-description">{previewPreset.description}</p>
            <div className="preview-slots">
              {Object.entries(previewPreset.slots).map(([slot, item]: [string, string | undefined]) => (
                item ? (
                  <div key={slot} className="preview-slot-item">
                    <span className="slot-name">{slot}:</span>
                    <span className="slot-value">{item}</span>
                  </div>
                ) : null
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Individual Slots */}
      <div className="equipment-slots-section">
        <h4 className="slots-title">Individual Equipment Slots</h4>
        <div className="slots-grid">
          {/* Main Equipment */}
          <div className="slot-group">
            <h5>Armor</h5>
            <div className="slot-item">
              <label>Head</label>
              <input
                type="text"
                value={currentSlots.head || ''}
                onChange={(e) => onSlotChange('head', e.target.value)}
                placeholder="None"
              />
            </div>
            <div className="slot-item">
              <label>Torso</label>
              <input
                type="text"
                value={currentSlots.torso || ''}
                onChange={(e) => onSlotChange('torso', e.target.value)}
                placeholder="None"
              />
            </div>
            <div className="slot-item">
              <label>Arms</label>
              <input
                type="text"
                value={currentSlots.arms || ''}
                onChange={(e) => onSlotChange('arms', e.target.value)}
                placeholder="None"
              />
            </div>
            <div className="slot-item">
              <label>Hands</label>
              <input
                type="text"
                value={currentSlots.hands || ''}
                onChange={(e) => onSlotChange('hands', e.target.value)}
                placeholder="None"
              />
            </div>
            <div className="slot-item">
              <label>Legs</label>
              <input
                type="text"
                value={currentSlots.legs || ''}
                onChange={(e) => onSlotChange('legs', e.target.value)}
                placeholder="None"
              />
            </div>
            <div className="slot-item">
              <label>Feet</label>
              <input
                type="text"
                value={currentSlots.feet || ''}
                onChange={(e) => onSlotChange('feet', e.target.value)}
                placeholder="None"
              />
            </div>
          </div>

          {/* Accessories */}
          <div className="slot-group">
            <h5>Accessories</h5>
            <div className="slot-item">
              <label>Back</label>
              <input
                type="text"
                value={currentSlots.back || ''}
                onChange={(e) => onSlotChange('back', e.target.value)}
                placeholder="None"
              />
            </div>
            <div className="slot-item">
              <label>Waist</label>
              <input
                type="text"
                value={currentSlots.waist || ''}
                onChange={(e) => onSlotChange('waist', e.target.value)}
                placeholder="None"
              />
            </div>
            <div className="slot-item">
              <label>Neck</label>
              <input
                type="text"
                value={currentSlots.neck || ''}
                onChange={(e) => onSlotChange('neck', e.target.value)}
                placeholder="None"
              />
            </div>
          </div>

          {/* Weapons */}
          <div className="slot-group">
            <h5>Weapons</h5>
            <div className="slot-item">
              <label>Main Hand</label>
              <input
                type="text"
                value={currentSlots.mainHand || ''}
                onChange={(e) => onSlotChange('mainHand', e.target.value)}
                placeholder="None"
              />
            </div>
            <div className="slot-item">
              <label>Off Hand</label>
              <input
                type="text"
                value={currentSlots.offHand || ''}
                onChange={(e) => onSlotChange('offHand', e.target.value)}
                placeholder="None"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
