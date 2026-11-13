export const clamp = (value: number) => Math.min(1, Math.max(0, value));
export const ease = (value: number) => value * value * (3 - 2 * value);
const mix = (from: number, to: number, progress: number) => from + (to - from) * progress;

export const coastClearPoint = .29;

export function coastPose(progress: number) {
  return {
    drop: ease(clamp(progress / coastClearPoint)),
    lift: ease(clamp((progress - coastClearPoint) / (1 - coastClearPoint))),
    paper: 1 - ease(clamp((progress - .17) / .35)),
    descent: ease(clamp((progress - .18) / .82)),
    turn: 360 * roll(clamp((progress - .23) / .60)),
    title: 1 - ease(clamp((progress - .09) / .21)),
    cue: 1 - ease(clamp((progress - .04) / .14)),
    stage: ease(clamp((progress - .76) / .24)),
  };
}

/** Ease into and out of a roll, with an even speed through the middle. */
export function roll(progress: number) {
  const ramp = .24;
  const leadIn = (p: number) => (p - ramp / Math.PI * Math.sin(Math.PI * p / ramp)) / (2 * (1 - ramp));
  if (progress < ramp) return leadIn(progress);
  if (progress > 1 - ramp) return 1 - leadIn(1 - progress);
  return (progress - ramp / 2) / (1 - ramp);
}

export type ReelPose = { x: number; turn: number; size: number; opacity: number };

const sideSize = .9;
const sideOpacity = .78;
const incomingTurn = -42;

export function reelPoses({ chapter, exchange, leaving, entry, count, width, diameter }: {
  chapter: number; exchange: number; leaving: number;
  entry: number; count: number; width: number; diameter: number;
}) {
  const poses = new Map<number, ReelPose>();
  const last = chapter === count - 1;
  const advance = last ? leaving : exchange;
  const gap = Math.max(12, diameter * .045);
  const spacing = Math.max(width * (width < 760 ? .58 : .52), diameter + gap);
  const outside = Math.max(spacing, (width + diameter) / 2) + 32;
  poses.set(chapter, {
    x: (last ? outside : spacing) * advance,
    turn: (last ? 225 : 360) * advance,
    size: mix(1, sideSize, advance),
    opacity: mix(1, sideOpacity, advance),
  });
  if (!last) {
    poses.set(chapter + 1, {
      x: mix(-outside, spacing * (exchange - 1), entry), turn: incomingTurn * (1 - exchange),
      size: mix(sideSize, 1, exchange), opacity: mix(sideOpacity, 1, exchange) * entry,
    });
  }
  if (chapter > 0) {
    poses.set(chapter - 1, {
      x: spacing * (1 + advance), turn: 0, size: sideSize,
      opacity: sideOpacity * (1 - advance),
    });
  }
  if (chapter + 2 < count) {
    poses.set(chapter + 2, {
      x: spacing * (exchange - 2), turn: incomingTurn, size: sideSize, opacity: sideOpacity * exchange * entry,
    });
  }

  return poses;
}
