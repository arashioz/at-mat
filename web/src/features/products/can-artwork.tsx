import type { CSSProperties } from 'react';
import './can-artwork.css';

export function CanArtwork({ wrap, lid, className = '' }: { wrap: string; lid: string; className?: string }) {
  const style = { '--can-wrap': `url("${wrap}")`, '--can-lid': `url("${lid}")` } as CSSProperties;
  return (
    <span className={`can-artwork ${className}`} style={style} aria-hidden="true">
      <span className="can-artwork__body" />
      <span className="can-artwork__lid" />
    </span>
  );
}
