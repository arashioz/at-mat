const outline = { width: 22, height: 22, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.5, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true } as const;

export function RecipeClockIcon() {
  return <svg {...outline}><circle cx="12" cy="13" r="8" /><path d="M12 9v4l2.5 1.5M9 2h6M12 2v3M18 5l1.5-1.5" /></svg>;
}

export function RecipeServingsIcon() {
  return <svg {...outline}><circle cx="9" cy="7.5" r="3" /><path d="M3 20v-2a6 6 0 0 1 12 0v2M16 4.7a3 3 0 0 1 0 5.6M18 13a5 5 0 0 1 3 4.6V20" /></svg>;
}

export function RecipeDifficultyIcon() {
  return <svg {...outline}><path d="M7 14a4 4 0 0 1-1-7.87 6 6 0 0 1 12 0A4 4 0 0 1 17 14v6H7ZM7 17h10" /></svg>;
}

export function RecipeDownIcon() {
  return <svg {...outline} width="18" height="18"><path d="M12 4v15m-5-5 5 5 5-5" /></svg>;
}
