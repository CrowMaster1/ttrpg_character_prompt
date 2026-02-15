import { SliderControl } from './SliderControl';

interface SliderData {
  id: string;
  label: string;
  value: number;
  levels: string[];
  warning?: string;
  emoji?: string;
}

interface SliderSectionProps {
  sliders: SliderData[];
  onChange: (id: string, value: number) => void;
  title?: string;
}

export function SliderSection({ sliders, onChange, title }: SliderSectionProps) {
  return (
    <div className="slider-section">
      {title && <h3 className="slider-section-title">{title}</h3>}
      <div className="slider-grid">
        {sliders.map((slider) => (
          <SliderControl
            key={slider.id}
            id={slider.id}
            label={slider.label}
            value={slider.value}
            levels={slider.levels}
            onChange={(value) => onChange(slider.id, value)}
            warning={slider.warning}
            emoji={slider.emoji}
          />
        ))}
      </div>
    </div>
  );
}
