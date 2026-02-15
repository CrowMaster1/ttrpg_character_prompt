import { Info } from 'lucide-react';
// Styles consolidated in ../styles/components.css

interface InfoPanelProps {
  title: string;
  description: string;
}

export function InfoPanel({ title, description }: InfoPanelProps) {
  if (!description || description === 'None' || !title) {
    return null;
  }

  return (
    <div className="info-panel">
      <div className="info-panel-header">
        <Info size={14} />
        <span className="info-panel-title">{title}</span>
      </div>
      <div className="info-panel-content">
        {description}
      </div>
    </div>
  );
}
