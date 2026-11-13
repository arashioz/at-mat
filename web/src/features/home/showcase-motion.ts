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

const sideSize = .91;
const sideOpacity = .82;
const incomingTurn = -88;

export function reelPoses({ chapter, progress, exchange, leaving, entry, count, width, diameter }: {
  chapter: number; progress: number; exchange: number; leaving: number;
  entry: number; count: number; width: number; diameter: number;
}) {
  const poses = new Map<number, ReelPose>();
  const last = chapter === count - 1;
  const advance = last ? leaving : exchange;
  const gap = Math.max(12, diameter * .045);
  const peek = Math.max(width / 2 + diameter * .14, diameter * (1 + sideSize) / 2 + gap);
  const outside = Math.max(peek, (width + diameter) / 2) + 32;
  const next = (chapter + 1) % count;
  const previous = (chapter + count - 1) % count;
  const heroSize = mix(1, sideSize, advance);
  const heroX = outside * advance;
  poses.set(chapter, { x: heroX, turn: 360 * ease(clamp(advance / .79)), size: heroSize, opacity: 1 });

  if (count < 2) return poses;
  if (last) {
    poses.set(next, {
      x: -mix(peek, outside, leaving), turn: incomingTurn, size: sideSize, opacity: sideOpacity * (1 - leaving),
    });
  } else {
    // Let the next lid catch up on wide screens while keeping a clear gap between the rims.
    const arrival = ease(clamp(exchange / .9));
    const incomingSize = mix(sideSize, 1, arrival);
    const catchUp = Math.max(0, peek - diameter - gap) * .78 * Math.sin(Math.PI * arrival);
    const safeX = heroX - diameter * (heroSize + incomingSize) / 2 - gap;
    const incomingX = Math.min(0, safeX, -peek * (1 - arrival) + catchUp);
    poses.set(next, {
      x: mix(-outside, incomingX, entry), turn: incomingTurn * (1 - arrival),
      size: incomingSize, opacity: mix(sideOpacity, 1, arrival) * entry,
    });
  }

  if (previous !== next) {
    const arrive = chapter === 0 ? entry : ease(clamp(progress / .16));
    const retreat = ease(clamp(advance / .27));
    poses.set(previous, {
      x: mix(outside, peek, arrive * (1 - retreat)), turn: 10, size: sideSize,
      opacity: sideOpacity * arrive * (1 - retreat),
    });
  }

  return poses;
}
