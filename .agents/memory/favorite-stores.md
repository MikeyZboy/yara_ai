---
name: Favorite stores privacy boundary
description: Product boundary for the Favorite Stores feature and possible future merchant promotion work.
---

Favorite Stores currently stores only the user's manually selected store names on the device. It does not collect browsing, purchase, return, or trend analytics and does not expose data to merchants.

**Why:** The original feature request mentioned possible future advertising and consumer-trend insights, but that is materially different from a personal favorites utility and would require explicit consent, account-level data design, privacy controls, and a clear business decision.

**How to apply:** Keep new Favorite Stores work local-first unless the user explicitly asks for syncing, accounts, analytics, recommendations, or merchant advertising. Treat any future behavioral data collection as a separate product scope with transparent opt-in and deletion controls.