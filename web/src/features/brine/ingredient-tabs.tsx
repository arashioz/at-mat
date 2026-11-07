'use client';

import { useId, useRef, useState, type KeyboardEvent } from 'react';
import type { Ingredient } from '../products/types';
import './ingredient-tabs.css';

export function IngredientTabs({ steps }: { steps: readonly Ingredient[] }) {
  const id = useId();
  const [selected, setSelected] = useState(0);
  const buttons = useRef<Array<HTMLButtonElement | null>>([]);
  const panelId = `${id}-ingredient-panel`;

  const navigate = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    // The first tab sits on the right: ArrowLeft advances through the RTL row.
    const next = event.key === 'ArrowLeft' ? (index + 1) % steps.length
      : event.key === 'ArrowRight' ? (index + steps.length - 1) % steps.length
      : event.key === 'Home' ? 0
      : event.key === 'End' ? steps.length - 1
      : null;
    if (next === null) return;
    event.preventDefault();
    setSelected(next);
    buttons.current[next]?.focus();
  };

  return (
    <div className="b-ingredients" dir="rtl">
      <div className="b-ingredients__interactive">
        <div className="b-ingredients__tabs" role="tablist" aria-label="محتویات محصول" aria-orientation="horizontal">
          {steps.map((step, index) => (
            <button
              key={step.id}
              ref={(node) => { buttons.current[index] = node; }}
              type="button"
              role="tab"
              id={`${id}-${step.id}`}
              aria-selected={selected === index}
              aria-controls={panelId}
              tabIndex={selected === index ? 0 : -1}
              onClick={() => setSelected(index)}
              onKeyDown={(event) => navigate(event, index)}
            >
              {step.title}
            </button>
          ))}
        </div>
        <div className="b-ingredients__panel" role="tabpanel" id={panelId} aria-labelledby={`${id}-${steps[selected].id}`} tabIndex={0}>
          <p key={steps[selected].id}>{steps[selected].fact}</p>
        </div>
      </div>
      <noscript>
        <style>{'.b-ingredients__interactive{display:none!important}'}</style>
        <dl className="b-ingredients__fallback">
          {steps.map((step) => (
            <div key={step.id}><dt>{step.title}</dt><dd>{step.fact}</dd></div>
          ))}
        </dl>
      </noscript>
    </div>
  );
}
