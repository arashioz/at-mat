---
name: atmat-motion
description: Design, implement, or review AtMat scroll choreography, UI transitions, and product scenes. Use when motion or 3D changes are requested; exclude static content edits and animation work for other projects.
---

# AtMat motion

## Define the scene

One GSAP driver owns the brine can: position, scale, and quaternion together. Quaternion slerp, limited spin, Persian label toward the user. No endless rotation. Mouse parallax is a small pull on precise pointers only.

Strengthen the 3D can (readable label, metal chime, real wrap and lid textures). Lazy-load Three, cap DPR, pause offscreen or at rest, and keep an HTML poster if WebGL fails.

Persian motion is a mask, a block, or blur on a whole text block. Do not split Persian into per-letter transforms.

The ماهی / آب / نمک section is scroll-linked and not scroll-hijacked. On small or short viewports the can stays in the hero. `prefers-reduced-motion` and `?motion=off` keep the same content, with the poster and no text blur.

No sea photo on the brine page. Native scroll only. Clean up timelines, listeners, triggers, and Three resources on unmount and breakpoint change.

## Done checks

Desktop can journey, the three beats, a narrow viewport, and reduced motion all show the same facts.
