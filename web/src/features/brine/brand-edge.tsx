import './brand-edge.css';

/** Rounded logo lobes meet in a sharp notch; the repeat closes at that same notch. */
export function BrandEdge({ id, className = '', fillBelow = false, animated = false }: {
  id: string;
  className?: string;
  fillBelow?: boolean;
  animated?: boolean;
}) {
  const contour = 'M0 26C14 12 25 5 40 5C55 5 66 12 80 26C94 12 105 5 120 5C135 5 146 12 160 26';
  return (
    <svg className={`b-brand-edge ${className}`} data-nutrition-wave={animated || undefined} aria-hidden="true" focusable="false">
      <defs>
        <pattern id={id} width="160" height="40" patternUnits="userSpaceOnUse">
          <path d={`${contour}${fillBelow ? 'V40H0' : 'V0H0'}Z`} fill="currentColor" />
        </pattern>
      </defs>
      <rect width="100%" height="40" fill={`url(#${id})`} />
    </svg>
  );
}
