# Collapsible Components - Quick Reference

## Import

```tsx
import {
  SliderControl,
  SliderSection,
  CollapsibleCheckboxGroup,
  CollapsibleComboBox
} from './components/controls';
import { ContradictionWarning } from './components/ContradictionWarning';
import './styles/collapsible-controls.css'; // Don't forget!
```

---

## SliderControl

**When to use:** Physical attributes, intensity levels, 1-5 scales

```tsx
<SliderControl
  id="strength"
  label="Strength"
  emoji="💪"                                    // Optional
  value={3}                                     // 1-5
  levels={['Weak', 'Avg', 'Strong', 'V.Strong']} // Must have 5 items
  onChange={(v) => setStrength(v)}
  warning="Conflicts with slim body"            // Optional
/>
```

---

## SliderSection

**When to use:** Group 2+ related sliders

```tsx
<SliderSection
  title="Physical Attributes"                   // Optional
  sliders={[
    { id: 'str', label: 'STR', emoji: '💪', value: 3, levels: [...] },
    { id: 'agi', label: 'AGI', emoji: '🤸', value: 4, levels: [...] }
  ]}
  onChange={(id, value) => handleChange(id, value)}
/>
```

---

## CollapsibleCheckboxGroup

**When to use:** Multi-select options (5+ items work best)

```tsx
<CollapsibleCheckboxGroup
  label="Expressions"
  value={['Smiling', 'Confident']}              // Array of strings
  options={[
    { name: 'Smiling', description: 'Friendly smile' },
    { name: 'Serious' }
  ]}
  onChange={(v) => setExpressions(v)}
  defaultExpanded={false}                        // Optional
  maxDisplay={3}                                 // Items shown when collapsed
/>
```

**Collapsed:** `Expressions: Smiling, Confident`
**Expanded:** Full list with 24px checkboxes

---

## CollapsibleComboBox

**When to use:** Single-select options, auto-calculated values

```tsx
<CollapsibleComboBox
  label="Body Type"
  value="Athletic"                               // Single string
  options={[
    { name: 'Slim', description: 'Lean build' },
    { name: 'Athletic' }
  ]}
  onChange={(v) => setBodyType(v)}
  showAutoBadge={true}                           // Shows 🔄 Auto badge
  autoBadgeText="Auto (from STR+AGI)"           // Tooltip text
  defaultExpanded={false}                        // Optional
/>
```

**Collapsed:** `Body Type: Athletic 🔄 Auto`
**Expanded:** Radio button list

---

## ContradictionWarning

**When to use:** Show validation warnings with suggestions

```tsx
<ContradictionWarning
  contradiction={{
    id: 'str-body-conflict',
    message: 'High STR needs more muscle mass',
    severity: 'warning',                         // 'error' | 'warning' | 'info'
    suggestion: 'Change body type to Bulky',     // Optional
    affectedControls: ['strength', 'body_type']  // Optional
  }}
  onResolve={() => autoFix()}                    // Optional
  onDismiss={() => dismiss()}                    // Optional
/>
```

**Colors:**
🔴 `error` - Red
🟡 `warning` - Yellow
🔵 `info` - Blue

---

## LevelGroup (Collapsible Mode)

**When to use:** Level + qualifier combinations

```tsx
<LevelGroup
  label="Muscle Definition"
  value={{ level: 3, qualifier: 'Defined' }}    // or null
  data={{
    '1': { name: 'Soft', qualifiers: ['Undefined', 'Smooth'] },
    '2': { name: 'Toned', qualifiers: [...] }
  }}
  onChange={(v) => setMuscle(v)}
  collapsible={true}                             // Enable collapse
  defaultExpanded={false}                        // Optional
/>
```

**Non-collapsible:** Set `collapsible={false}` for original card style

---

## Common Patterns

### Character Creation Tab

```tsx
function CharacterTab() {
  return (
    <>
      {/* Sliders at top */}
      <SliderSection sliders={physicalSliders} onChange={handleSlider} />

      {/* Collapsible controls below */}
      <CollapsibleComboBox {...bodyTypeProps} />
      <CollapsibleCheckboxGroup {...expressionsProps} />
      <LevelGroup {...muscleProps} collapsible={true} />
    </>
  );
}
```

### With Contradiction Detection

```tsx
const hasConflict = strength >= 4 && bodyType === 'Slim';

return (
  <>
    <SliderControl
      {...props}
      warning={hasConflict ? 'Conflicts with body type' : undefined}
    />
    {hasConflict && (
      <ContradictionWarning
        contradiction={conflictData}
        onResolve={() => setBodyType('Athletic')}
      />
    )}
  </>
);
```

### Memoized Callbacks

```tsx
const handleSliderChange = useCallback((id: string, value: number) => {
  setSliders(prev => ({ ...prev, [id]: value }));
}, []);
```

---

## Styling

### Use Provided Classes

```css
/* Slider */
.slider-control
.slider-input
.slider-label-button
.slider-dot

/* Collapsible */
.collapsible-header
.collapsible-content
.collapsible-icon

/* Checkbox/Radio */
.checkbox-input      /* 24px */
.radio-input         /* 20px */

/* Warning */
.contradiction-badge
.contradiction-tooltip
```

### Override Example

```css
/* Larger checkboxes */
.checkbox-input {
  width: 32px;
  height: 32px;
}

/* Green slider dots */
.slider-dot.active {
  background: #10b981;
}
```

---

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| Tab | Navigate controls |
| Space/Enter | Toggle checkbox/collapse |
| Arrow keys | Move slider |
| Escape | Close tooltip |

---

## Props Quick Lookup

### SliderControl
- `id` ⚠️ Required
- `label` ⚠️ Required
- `value` ⚠️ Required (1-5)
- `levels` ⚠️ Required (5 items)
- `onChange` ⚠️ Required
- `emoji` Optional
- `warning` Optional

### CollapsibleCheckboxGroup
- `label` ⚠️ Required
- `value` ⚠️ Required (string[])
- `options` ⚠️ Required
- `onChange` ⚠️ Required
- `defaultExpanded` Optional (false)
- `maxDisplay` Optional (3)

### CollapsibleComboBox
- `label` ⚠️ Required
- `value` ⚠️ Required (string)
- `options` ⚠️ Required
- `onChange` ⚠️ Required
- `defaultExpanded` Optional (false)
- `showAutoBadge` Optional (false)
- `autoBadgeText` Optional ('Auto')

---

## Common Mistakes

❌ **Forgetting to import CSS**
```tsx
// Don't forget this!
import './styles/collapsible-controls.css';
```

❌ **Wrong number of slider levels**
```tsx
// Must have exactly 5 levels
levels={['Weak', 'Strong']} // WRONG
levels={['Weak', 'Below Avg', 'Avg', 'Strong', 'V.Strong']} // CORRECT
```

❌ **Wrong value type**
```tsx
<CollapsibleCheckboxGroup value="Smiling" /> // WRONG (needs array)
<CollapsibleCheckboxGroup value={['Smiling']} /> // CORRECT

<CollapsibleComboBox value={['Athletic']} /> // WRONG (needs string)
<CollapsibleComboBox value="Athletic" /> // CORRECT
```

❌ **Not memoizing callbacks**
```tsx
// Causes unnecessary re-renders
onChange={(v) => setState(v)}

// Better
const handleChange = useCallback((v) => setState(v), []);
```

---

## Responsive Breakpoints

```css
/* Desktop: 2-column slider grid */
@media (min-width: 769px) {
  .slider-grid { grid-template-columns: repeat(2, 1fr); }
}

/* Mobile: 1-column */
@media (max-width: 768px) {
  .slider-grid { grid-template-columns: 1fr; }
}
```

---

## Testing Checklist

- [ ] Sliders respond to drag
- [ ] Level buttons update slider
- [ ] Expand/collapse works
- [ ] Checkboxes toggle
- [ ] Radio buttons are exclusive
- [ ] Tooltips show on hover
- [ ] Keyboard navigation works
- [ ] Focus indicators visible
- [ ] Works on mobile
- [ ] Works with screen reader

---

## Demo File

See complete examples in:
```
src/components/controls/CollapsibleDemo.tsx
```

Run demo:
```tsx
import { CollapsibleDemo } from './components/controls/CollapsibleDemo';

function App() {
  return <CollapsibleDemo />;
}
```

---

## Help

**Full Docs:** `src/components/controls/README_COLLAPSIBLE.md`
**Summary:** `PHASE2_IMPLEMENTATION_SUMMARY.md`
**Types:** Check component files for TypeScript interfaces
