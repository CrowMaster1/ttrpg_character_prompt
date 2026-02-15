interface CheckboxSingleProps {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
}

export function CheckboxSingle({ label, value, onChange }: CheckboxSingleProps) {
  return (
    <label className="flex items-center gap-3 cursor-pointer hover:bg-accent/50 p-3 rounded-lg transition-colors border bg-card">
      <input
        type="checkbox"
        checked={value}
        onChange={(e) => onChange(e.target.checked)}
        className="h-5 w-5 rounded border-gray-300 cursor-pointer accent-primary"
      />
      <span className="text-sm font-medium flex-1">{label}</span>
    </label>
  );
}
