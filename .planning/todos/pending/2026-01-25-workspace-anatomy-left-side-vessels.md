---
created: 2026-01-26T03:35
title: Add left-side vessel SVG elements to workspace anatomy diagram
area: ui
files:
  - surgical-command-center-workspace.html:1314-1381
  - planning-endovascular.html:811-917
---

## Problem

The workspace anatomy SVG diagram only has RIGHT-side vessel elements drawn (r-sfa, r-cfa, r-pop, etc.). When users plan LEFT-side procedures:

1. The findings TABLE now correctly shows L SFA, L Popliteal, etc. (fixed 2026-01-26)
2. But the visual DIAGRAM cannot highlight left-side vessels because those SVG paths don't exist

User reported: "endovascular planning / the vascular anatomy model needs to save the changes when input" for left-side procedures.

Current state:
- `planning-endovascular.html` has BILATERAL vessels in its SVG (lines 811-917)
- `surgical-command-center-workspace.html` SVG only has right-side vessels (lines 1314-1381)
- vesselIdMap has left-side mappings but no SVG elements to map TO

## Solution

1. Add left-side vessel SVG paths mirroring the right side:
   - l-eia, l-cfa, l-profunda, l-sfa, l-pop, l-ata, l-pta, l-peroneal, l-dp
2. Position left vessels on right side of SVG (anatomic position)
3. Or: dynamically show/hide based on procedure.side to keep diagram clean
