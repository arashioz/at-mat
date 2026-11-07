import './weight-badge.css';

/** The accessible weight is announced with the product heading. */
export function WeightBadge({ weight, className = '' }: { weight: string; className?: string }) {
  return (
    <span className={`b-weight ${className}`} aria-hidden="true">
      <svg className="b-weight__seal" viewBox="0 0 100 100" fill="none" aria-hidden="true">
        <circle cx="50" cy="50" r="47" />
        <circle cx="50" cy="50" r="41.5" />
        <path d="M17 50h5m56 0h5M50 17v5m0 56v5" />
      </svg>
      <span className="b-weight__label">وزن خالص</span>
      <span className="b-weight__value"><b>{weight}</b><span>گرم</span></span>
    </span>
  );
}
