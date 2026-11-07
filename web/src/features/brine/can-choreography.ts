/**
 * Can poses in viewport pixels: x/y is the can centre, d its diameter.
 * Angles are radians. yaw spins the can around its own axis (0 shows the
 * Persian front panel); pitch π/2 looks straight down at the lid.
 */
export interface CanPose {
  x: number;
  y: number;
  d: number;
  yaw: number;
  pitch: number;
  roll: number;
  alpha: number;
  shadow: number;
}

export interface TiltBlend {
  from: CanPose;
  to: CanPose;
  progress: number;
}

interface JourneySample {
  pose: CanPose;
  tilt?: TiltBlend;
}

/** A layout slot the can should occupy, measured from an anchor element. */
export interface CanSlot {
  x: number;
  y: number;
  d: number;
}

export interface JourneyLayout {
  hero: CanSlot;
  /** Slot centre relative to the top of the normal-flow detail section. */
  stage: CanSlot;
  detailTop: number;
}

export const INTRO_EVENT = 'brine:intro';

const TURN = Math.PI * 2;
export const TOP_PITCH = Math.PI / 2;
/** Outer rim diameter of the lid seen from above, relative to the body diameter. */
export const TOP_VIEW_SCALE = 1.075;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const lerp = (from: number, to: number, t: number) => from + (to - from) * t;
// Quintic ease-in-out: zero speed and acceleration at either landing.
const ease = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);

export function mixPose(a: CanPose, b: CanPose, t: number): CanPose {
  return {
    x: lerp(a.x, b.x, t),
    y: lerp(a.y, b.y, t),
    d: lerp(a.d, b.d, t),
    yaw: lerp(a.yaw, b.yaw, t),
    pitch: lerp(a.pitch, b.pitch, t),
    roll: lerp(a.roll, b.roll, t),
    alpha: lerp(a.alpha, b.alpha, t),
    shadow: lerp(a.shadow, b.shadow, t),
  };
}

/** Loader pose: straight down on the lid, sized so the rim matches the CSS lid. */
export function topPose(slot: CanSlot): CanPose {
  return { x: slot.x, y: slot.y, d: slot.d / TOP_VIEW_SCALE, yaw: 0, pitch: TOP_PITCH, roll: 0, alpha: 1, shadow: 0 };
}

export function buildJourney(layout: JourneyLayout) {
  const { hero, stage, detailTop } = layout;
  const top = Math.max(1, detailTop);
  const heroPose: CanPose = { x: hero.x, y: hero.y, d: hero.d, yaw: 0, pitch: 0.4, roll: -0.07, alpha: 1, shadow: 1 };
  // Complete one revolution on approach and retain the Persian front panel.
  const landed: CanPose = { x: stage.x, y: stage.y, d: stage.d, yaw: TURN, pitch: 0.28, roll: 0.05, alpha: 1, shadow: 1 };
  // Include the projected rim and shadow so culling happens entirely offscreen.
  const end = top + stage.y + stage.d * 0.75;
  return {
    end,
    hero: heroPose,
    sample(scroll: number): JourneySample {
      const y = Number.isFinite(scroll) ? Math.max(0, scroll) : 0;
      if (y >= top) {
        // The can belongs to this section after landing, with no sticky hold or
        // extra exit animation that could carry it over the nutrition section.
        return { pose: { ...landed, y: stage.y - (y - top), alpha: y < end ? 1 : 0 } };
      }
      const progress = ease(clamp(y / top, 0, 1));
      return {
        pose: mixPose(heroPose, landed, progress),
        tilt: { from: heroPose, to: landed, progress },
      };
    },
  };
}
