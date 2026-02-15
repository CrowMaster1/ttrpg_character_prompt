# Collapsible UI Components - Phase 2

## Overview

This document describes the new accordion-style collapsible controls implemented in Phase 2. These components provide a more compact and user-friendly interface for the prompt generator.

## Components

### 1. SliderControl

A range slider (1-5) with visual indicators and warning badges.

**Props:**
```typescript
interface SliderControlProps {
  id: string;
  label: string;
  value: number; // 1-5
  levels: string[]; // ['Weak', 'Below Avg', 'Average', 'Strong', 'Very Strong']
  onChange: (value: number) => void;
  warning?: string; // Contradiction message
  emoji?: string; // Optional emoji icon
}
```

**Usage:**
```tsx
<SliderControl
  id="strength"
  label="Strength"
  emoji="💪"
  value={3}
  levels={['Weak', 'Below Average', 'Average', 'Strong', 'Very Strong']}
  onChange={(value) => console.log('New value:', value)}
  warning="Strength conflicts with body type selection"
/>
```

**Features:**
- Visual dots showing current level (●●●○○)
- Clickable level buttons below slider
- Warning badge with tooltip
- Smooth transitions
- Accessible keyboard navigation

---

### 2. SliderSection

Container for multiple sliders in a responsive grid layout.

**Props:**
```typescript
interface SliderSectionProps {
  sliders: Array<{
    id: string;
    label: string;
    value: number;
    levels: string[];
    warning?: string;
    emoji?: string;
  }>;
  onChange: (id: string, value: number) => void;
  title?: string;
}
```

**Usage:**
```tsx
<SliderSection
  title="Physical Attributes"
  sliders={[
    {
      id: 'strength',
      label: 'Strength',
      emoji: '💪',
      value: 3,
      levels: ['Weak', 'Below Avg', 'Average', 'Strong', 'Very Strong']
    },
    {
      id: 'agility',
      label: 'Agility',
      emoji: '🤸',
      value: 4,
      levels: ['Clumsy', 'Below Avg', 'Average', 'Agile', 'Very Agile']
    }
  ]}
  onChange={(id, value) => console.log(`${id} changed to ${value}`)}
/>
```

**Features:**
- 2-column grid on desktop, 1-column on mobile
- Optional section title
- Consistent spacing
- Responsive layout

---

### 3. CollapsibleCheckboxGroup

Accordion-style multi-select control with large checkboxes.

**Props:**
```typescript
interface CollapsibleCheckboxGroupProps {
  label: string;
  value: string[]; // Selected items
  options: Array<{ name: string; description?: string }>;
  onChange: (value: string[]) => void;
  defaultExpanded?: boolean;
  maxDisplay?: number; // Max items to show when collapsed
}
```

**Usage:**
```tsx
<CollapsibleCheckboxGroup
  label="Expressions"
  value={['Smiling', 'Confident']}
  options={[
    { name: 'Smiling', description: 'Friendly smile' },
    { name: 'Scowling', description: 'Angry expression' },
    { name: 'Laughing', description: 'Full laugh' },
    { name: 'Confident', description: 'Self-assured look' }
  ]}
  onChange={(value) => console.log('Selected:', value)}
  defaultExpanded={false}
  maxDisplay={3}
/>
```

**Features:**
- Collapsed: Shows "Smiling, Confident"
- Expanded: Shows all checkboxes (24px × 24px minimum)
- Arrow icon toggle (► → ▼)
- Click anywhere on header to expand/collapse
- Smooth animation

---

### 4. CollapsibleComboBox

Accordion-style single-select control with radio buttons.

**Props:**
```typescript
interface CollapsibleComboBoxProps {
  label: string;
  value: string;
  options: Array<{ name: string; description?: string }>;
  onChange: (value: string) => void;
  defaultExpanded?: boolean;
  showAutoBadge?: boolean; // For auto-calculated values
  autoBadgeText?: string; // e.g., "Auto (from STR+CON)"
}
```

**Usage:**
```tsx
<CollapsibleComboBox
  label="Body Shape"
  value="Athletic"
  options={[
    { name: 'Slim', description: 'Lean build' },
    { name: 'Athletic', description: 'Toned muscles' },
    { name: 'Bulky', description: 'Large build' }
  ]}
  onChange={(value) => console.log('Selected:', value)}
  showAutoBadge={true}
  autoBadgeText="Auto (from STR+AGI)"
/>
```

**Features:**
- Collapsed: Shows "Body Shape: Athletic 🔄 Auto"
- Expanded: Shows radio button list
- Auto badge for calculated values
- Large clickable areas (44px minimum)

---

### 5. ContradictionWarning

Floating badge/tooltip for displaying validation warnings.

**Props:**
```typescript
interface ContradictionWarningProps {
  contradiction: {
    id: string;
    message: string;
    severity: 'error' | 'warning' | 'info';
    suggestion?: string;
    affectedControls?: string[];
  };
  onResolve?: () => void; // Auto-fix callback
  onDismiss?: () => void; // Dismiss warning
}
```

**Usage:**
```tsx
<ContradictionWarning
  contradiction={{
    id: 'strength-body-conflict',
    message: 'High strength typically correlates with bulkier body types',
    severity: 'warning',
    suggestion: 'Consider changing body type to Athletic or Bulky',
    affectedControls: ['strength', 'body_type']
  }}
  onResolve={() => console.log('Auto-fixing...')}
  onDismiss={() => console.log('Dismissed')}
/>
```

**Features:**
- Color-coded by severity (red/yellow/blue)
- Tooltip on hover with full details
- Optional "Auto-Fix" button
- Dismissable
- Shows affected controls

---

### 6. LevelGroup (Updated)

The existing LevelGroup component now supports collapsible mode.

**New Props:**
```typescript
interface LevelGroupProps {
  // ... existing props ...
  defaultExpanded?: boolean;
  collapsible?: boolean; // Enable collapsible mode
}
```

**Usage:**
```tsx
// Original behavior (expanded card)
<LevelGroup
  label="Muscle Definition"
  value={{ level: 3, qualifier: 'Defined' }}
  data={muscleData}
  onChange={(value) => console.log('Changed:', value)}
/>

// New collapsible behavior
<LevelGroup
  label="Muscle Definition"
  value={{ level: 3, qualifier: 'Defined' }}
  data={muscleData}
  onChange={(value) => console.log('Changed:', value)}
  collapsible={true}
  defaultExpanded={false}
/>
```

---

## Styling

All components use the new `collapsible-controls.css` stylesheet. Import it in your main app:

```tsx
import '../styles/collapsible-controls.css';
```

### CSS Classes

The stylesheet provides these main classes:
- `.slider-control` - Slider component wrapper
- `.collapsible-checkbox-group` - Checkbox group wrapper
- `.collapsible-combo-box` - Combo box wrapper
- `.collapsible-header` - Clickable header bar
- `.collapsible-content` - Expandable content area
- `.contradiction-badge` - Warning badge

### Customization

You can override styles by targeting specific classes:

```css
/* Make checkboxes even larger */
.checkbox-input {
  width: 32px;
  height: 32px;
}

/* Change slider color */
.slider-dot.active {
  background: #10b981; /* Green instead of blue */
}
```

---

## Accessibility

All components follow accessibility best practices:

### Keyboard Navigation
- **Tab**: Navigate between controls
- **Space/Enter**: Toggle checkboxes, expand/collapse
- **Arrow keys**: Navigate slider (when focused)

### Screen Readers
- Proper ARIA labels on all inputs
- Semantic HTML elements
- Focus management

### Visual
- High contrast mode support
- Focus indicators (2px blue outline)
- Min 44px touch targets
- Reduced motion support

---

## Examples

### Complete Character Creation Tab

```tsx
import {
  SliderSection,
  CollapsibleCheckboxGroup,
  CollapsibleComboBox,
  LevelGroup
} from './components/controls';

function CharacterTab() {
  return (
    <div>
      {/* Physical attributes at top */}
      <SliderSection
        title="Physical Attributes"
        sliders={[
          {
            id: 'strength',
            label: 'Strength',
            emoji: '💪',
            value: 3,
            levels: ['Weak', 'Below Avg', 'Average', 'Strong', 'Very Strong']
          },
          {
            id: 'agility',
            label: 'Agility',
            emoji: '🤸',
            value: 4,
            levels: ['Clumsy', 'Below Avg', 'Average', 'Agile', 'Very Agile']
          }
        ]}
        onChange={(id, value) => handleSliderChange(id, value)}
      />

      {/* Collapsible controls below */}
      <CollapsibleComboBox
        label="Body Type"
        value="Athletic"
        options={bodyTypes}
        onChange={handleBodyTypeChange}
        showAutoBadge={true}
        autoBadgeText="Auto (from STR+AGI)"
      />

      <CollapsibleCheckboxGroup
        label="Facial Features"
        value={selectedFeatures}
        options={facialFeatures}
        onChange={handleFeaturesChange}
      />

      <LevelGroup
        label="Muscle Definition"
        value={muscleLevel}
        data={muscleData}
        onChange={handleMuscleChange}
        collapsible={true}
      />
    </div>
  );
}
```

---

## Best Practices

### When to Use Each Component

**SliderControl**
- For continuous ranges (1-5 scale)
- Physical attributes (strength, agility)
- Intensity levels

**CollapsibleCheckboxGroup**
- Multi-select options
- Features that can combine
- Lists with 5+ items

**CollapsibleComboBox**
- Single-select options
- Mutually exclusive choices
- Auto-calculated values

**LevelGroup**
- Complex hierarchical data
- Level + qualifier combinations
- NSFW content levels

### Performance Tips

1. **Memoize callbacks** to prevent unnecessary re-renders:
```tsx
const handleChange = useCallback((id, value) => {
  // Update state
}, []);
```

2. **Start collapsed** for long lists:
```tsx
<CollapsibleCheckboxGroup
  defaultExpanded={false} // Start collapsed
  maxDisplay={3} // Show only 3 items when collapsed
/>
```

3. **Use SliderSection** for related sliders:
```tsx
// Good: Single section
<SliderSection sliders={allSliders} />

// Bad: Individual sliders
{sliders.map(s => <SliderControl {...s} />)}
```

---

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

All components work on mobile devices (iOS Safari, Chrome Android).

---

## Migration Guide

### From CheckboxGroup to CollapsibleCheckboxGroup

```tsx
// Before
<CheckboxGroup
  label="Expressions"
  value={selected}
  options={options}
  onChange={handleChange}
/>

// After
<CollapsibleCheckboxGroup
  label="Expressions"
  value={selected}
  options={options}
  onChange={handleChange}
  defaultExpanded={false} // Add collapse behavior
/>
```

### From SimpleCombo to CollapsibleComboBox

```tsx
// Before
<SimpleCombo
  label="Body Type"
  value={value}
  options={options}
  onChange={handleChange}
/>

// After
<CollapsibleComboBox
  label="Body Type"
  value={value}
  options={options}
  onChange={handleChange}
  defaultExpanded={false}
/>
```

---

## Troubleshooting

### Issue: Checkboxes too small on mobile
**Solution**: Increase `.checkbox-input` size in CSS:
```css
.checkbox-input {
  width: 28px;
  height: 28px;
}
```

### Issue: Slider doesn't update immediately
**Solution**: Ensure `onChange` is not throttled and uses current state:
```tsx
const handleSliderChange = (id: string, value: number) => {
  setSliders(prev => ({ ...prev, [id]: value }));
};
```

### Issue: Animations jerky on low-end devices
**Solution**: User has reduced motion enabled. The CSS automatically disables animations when `prefers-reduced-motion: reduce` is detected.

### Issue: Tooltip gets cut off at screen edge
**Solution**: Adjust tooltip positioning in CSS:
```css
.contradiction-tooltip {
  left: auto;
  right: 0; /* Align to right edge instead */
}
```

---

## Future Enhancements

Planned improvements for Phase 3:
- [ ] Drag-to-reorder checkboxes
- [ ] Search/filter for long lists
- [ ] Keyboard shortcuts (Ctrl+E to expand all)
- [ ] Export selected items as JSON
- [ ] Bulk select/deselect buttons
- [ ] Dark mode support
- [ ] Animation speed controls

---

## Contributing

When adding new collapsible components:

1. Follow the naming pattern: `Collapsible[ComponentType]`
2. Include `defaultExpanded` prop
3. Use `collapsible-header` and `collapsible-content` CSS classes
4. Add proper TypeScript types
5. Include accessibility attributes
6. Test keyboard navigation
7. Update this README

---

## License

Part of the Promt-AI-Image-generator project.
