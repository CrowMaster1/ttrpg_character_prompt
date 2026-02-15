import { RotateCcw } from 'lucide-react';
// Styles consolidated in ../styles/components.css

interface QuickResetPanelProps {
  onResetPose: () => void;
  onResetCamera: () => void;
  onResetLighting: () => void;
}

export function QuickResetPanel({ onResetPose, onResetCamera, onResetLighting }: QuickResetPanelProps) {
  return (
    <div className="quick-reset-panel">
      <div className="quick-reset-header">
        <RotateCcw size={14} />
        <h3>Quick Reset</h3>
      </div>
      <div className="quick-reset-buttons">
        <button
          className="quick-reset-btn"
          onClick={onResetPose}
          title="Reset pose to None"
        >
          <RotateCcw size={12} />
          Reset Pose
        </button>
        <button
          className="quick-reset-btn"
          onClick={onResetCamera}
          title="Reset camera angle, position, and framing"
        >
          <RotateCcw size={12} />
          Reset Camera
        </button>
        <button
          className="quick-reset-btn"
          onClick={onResetLighting}
          title="Reset lighting and shadows"
        >
          <RotateCcw size={12} />
          Reset Lighting
        </button>
      </div>
    </div>
  );
}
