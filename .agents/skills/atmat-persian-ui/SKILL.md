---
name: atmat-persian-ui
description: Build or review AtMat Persian interfaces, typography, mixed-direction content, and responsive UI. Use for consumer-facing components and forms; exclude data-only backend work and translation unrelated to AtMat.
---

# AtMat Persian UI

The consumer page is `lang="fa"` and `dir="rtl"`. Use logical CSS properties. Mirror movement when it communicates direction.

Peyda is the intended face. Licensed WOFF2 is not in the repo: use the explicit fallback stack and say the files are missing. Do not download an unverified Peyda.

Do not split Persian into per-letter transforms. Animate a line, a mask, or a whole block. Latin display type stays subordinate. Keep a skip link, visible focus, and anchors that work after load.

On narrow screens, stack the ماهی / آب / نمک beats and keep the boil warning readable.
