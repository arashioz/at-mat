---
name: atmat-content-api
description: Plan or implement AtMat consumer content models, API mapping, media ingestion, and authenticated recipe interactions. Use for public products, recipes, articles, favorites, comments, or accounts; exclude unrelated ERP/CRM operations and visual-only changes.
---

# AtMat content and API contracts

`web/` is the consumer app. `admin-web/` stays the ERP admin. Do not expose stock, price, or CRM customers on the brine page.

This design pass may use a typed local content module when every factual string comes from the label and every image URL comes from `POST /api/storage/images`. Do not pretend a public flavors API exists. Do not hand-edit `assets/image-manifest.json` or copy images into `public/`.

There is no public flavor endpoint in the current ERP backend unless one is added on purpose, tested, and kept off the operational routes.
