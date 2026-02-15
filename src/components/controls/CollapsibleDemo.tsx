/**
 * CollapsibleDemo.tsx
 *
 * Demonstrates all Phase 2 collapsible components
 * Use this as a reference for implementing the new UI
 */

import { useState } from 'react';
import { SliderControl } from './SliderControl';
import { SliderSection } from './SliderSection';
import { CollapsibleCheckboxGroup } from './CollapsibleCheckboxGroup';
import { CollapsibleComboBox } from './CollapsibleComboBox';
import { LevelGroup } from './LevelGroup';
import { ContradictionWarning } from '../ContradictionWarning';

export function CollapsibleDemo() {
  // Slider states
  const [strength, setStrength] = useState(3);
  const [agility, setAgility] = useState(4);
  const [charisma, setCharisma] = useState(2);

  // Checkbox group state
  const [expressions, setExpressions] = useState<string[]>(['Smiling']);

  // Combo box state
  const [bodyType, setBodyType] = useState('Athletic');

  // Level group state
  const [muscleLevel, setMuscleLevel] = useState<{ level: number; qualifier: string } | null>({
    level: 3,
    qualifier: 'Defined'
  });

  // Mock data
  const strengthLevels = ['Weak', 'Below Avg', 'Average', 'Strong', 'Very Strong'];
  const agilityLevels = ['Clumsy', 'Below Avg', 'Average', 'Agile', 'Very Agile'];
  const charismaLevels = ['Awkward', 'Reserved', 'Average', 'Charming', 'Captivating'];

  const expressionOptions = [
    { name: 'Smiling', description: 'Friendly, warm smile' },
    { name: 'Scowling', description: 'Angry or disapproving look' },
    { name: 'Laughing', description: 'Full, joyful laugh' },
    { name: 'Confident', description: 'Self-assured expression' },
    { name: 'Serious', description: 'Stern, no-nonsense look' },
    { name: 'Mysterious', description: 'Enigmatic, secretive' }
  ];

  const bodyTypeOptions = [
    { name: 'Slim', description: 'Lean, minimal muscle' },
    { name: 'Athletic', description: 'Toned, balanced build' },
    { name: 'Bulky', description: 'Large, muscular build' },
    { name: 'Stocky', description: 'Short, solid build' }
  ];

  const muscleData = {
    '1': { name: 'Soft', qualifiers: ['Undefined', 'Smooth'] },
    '2': { name: 'Toned', qualifiers: ['Lightly Toned', 'Subtle Definition'] },
    '3': { name: 'Defined', qualifiers: ['Clearly Defined', 'Athletic'] },
    '4': { name: 'Sculpted', qualifiers: ['Highly Defined', 'Chiseled'] },
    '5': { name: 'Extreme', qualifiers: ['Bodybuilder', 'Hyper-Muscular'] }
  };

  // Contradiction detection (example)
  const hasContradiction = strength >= 4 && bodyType === 'Slim';

  const contradiction = {
    id: 'strength-body-mismatch',
    message: 'High strength typically requires more muscle mass',
    severity: 'warning' as const,
    suggestion: 'Consider changing body type to Athletic or Bulky',
    affectedControls: ['strength', 'body_type']
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '24px' }}>Collapsible Components Demo</h1>

      {/* Global contradiction warning */}
      {hasContradiction && (
        <div style={{ marginBottom: '20px', padding: '12px', background: '#fef3c7', borderRadius: '8px', display: 'flex', gap: '12px', alignItems: 'center' }}>
          <ContradictionWarning
            contradiction={contradiction}
            onResolve={() => {
              console.log('Auto-fixing: Setting body type to Athletic');
              setBodyType('Athletic');
            }}
            onDismiss={() => console.log('Dismissed warning')}
          />
          <span style={{ fontSize: '14px', color: '#78350f' }}>
            Potential conflict detected. Review your selections.
          </span>
        </div>
      )}

      {/* ========== SLIDER SECTION ========== */}
      <section style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '18px', marginBottom: '16px' }}>Individual Sliders</h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginBottom: '24px' }}>
          <SliderControl
            id="strength"
            label="Strength"
            emoji="💪"
            value={strength}
            levels={strengthLevels}
            onChange={setStrength}
            warning={strength >= 4 && bodyType === 'Slim' ? 'Conflicts with slim body type' : undefined}
          />

          <SliderControl
            id="agility"
            label="Agility"
            emoji="🤸"
            value={agility}
            levels={agilityLevels}
            onChange={setAgility}
          />
        </div>

        <SliderControl
          id="charisma"
          label="Charisma"
          emoji="❤️"
          value={charisma}
          levels={charismaLevels}
          onChange={setCharisma}
        />
      </section>

      {/* ========== SLIDER SECTION (GROUPED) ========== */}
      <section style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '18px', marginBottom: '16px' }}>Grouped Sliders</h2>

        <SliderSection
          title="Physical Attributes"
          sliders={[
            {
              id: 'strength',
              label: 'Strength',
              emoji: '💪',
              value: strength,
              levels: strengthLevels,
              warning: strength >= 4 && bodyType === 'Slim' ? 'May conflict with body type' : undefined
            },
            {
              id: 'agility',
              label: 'Agility',
              emoji: '🤸',
              value: agility,
              levels: agilityLevels
            },
            {
              id: 'charisma',
              label: 'Charisma',
              emoji: '❤️',
              value: charisma,
              levels: charismaLevels
            }
          ]}
          onChange={(id, value) => {
            console.log(`${id} changed to ${value}`);
            if (id === 'strength') setStrength(value);
            if (id === 'agility') setAgility(value);
            if (id === 'charisma') setCharisma(value);
          }}
        />
      </section>

      {/* ========== COLLAPSIBLE COMBO BOX ========== */}
      <section style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '18px', marginBottom: '16px' }}>Collapsible Combo Box</h2>

        <CollapsibleComboBox
          label="Body Type"
          value={bodyType}
          options={bodyTypeOptions}
          onChange={setBodyType}
          showAutoBadge={true}
          autoBadgeText="Auto (from STR+AGI)"
        />
      </section>

      {/* ========== COLLAPSIBLE CHECKBOX GROUP ========== */}
      <section style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '18px', marginBottom: '16px' }}>Collapsible Checkbox Group</h2>

        <CollapsibleCheckboxGroup
          label="Expressions"
          value={expressions}
          options={expressionOptions}
          onChange={setExpressions}
          defaultExpanded={false}
          maxDisplay={3}
        />
      </section>

      {/* ========== LEVEL GROUP (COLLAPSIBLE) ========== */}
      <section style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '18px', marginBottom: '16px' }}>Level Group (Collapsible)</h2>

        <LevelGroup
          label="Muscle Definition"
          value={muscleLevel}
          data={muscleData}
          onChange={setMuscleLevel}
          collapsible={true}
          defaultExpanded={false}
        />
      </section>

      {/* ========== LEVEL GROUP (ORIGINAL) ========== */}
      <section style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '18px', marginBottom: '16px' }}>Level Group (Original)</h2>

        <LevelGroup
          label="Muscle Definition"
          value={muscleLevel}
          data={muscleData}
          onChange={setMuscleLevel}
          collapsible={false}
        />
      </section>

      {/* ========== OUTPUT ========== */}
      <section style={{ marginTop: '40px', padding: '16px', background: '#f5f5f5', borderRadius: '8px' }}>
        <h2 style={{ fontSize: '18px', marginBottom: '12px' }}>Current State</h2>
        <pre style={{ fontSize: '13px', overflow: 'auto' }}>
          {JSON.stringify(
            {
              strength,
              agility,
              charisma,
              bodyType,
              expressions,
              muscleLevel,
              hasContradiction
            },
            null,
            2
          )}
        </pre>
      </section>
    </div>
  );
}
