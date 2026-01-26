---
created: 2026-01-26T03:35
updated: 2026-01-26T03:45
title: Fix vascular anatomy model persistence and left-side vessel display
area: ui
priority: high
files:
  - planning-endovascular.html:811-917,1017-1145
  - surgical-command-center-workspace.html:1314-1381,1956-2088
  - js/api-client.js
---

## Problem

**RECURRING ISSUE** - Vessel data keeps resetting / not persisting properly:

1. User fills out vessel status in planning page (L SFA with atherectomy, in-stent restenosis)
2. Data should save to API and persist to workspace
3. But changes appear to reset or not carry through properly

Additional display issues:
- Workspace SVG only has RIGHT-side vessel elements
- LEFT-side procedures can't highlight on the diagram (no l-sfa, l-pop SVG paths)

## Root Causes to Investigate

1. **API persistence** - Is `createProcedure()` actually saving vessel_data?
2. **Data transform** - Is workspace's `loadPlanningData()` correctly mapping API response?
3. **localStorage fallback** - Is it loading stale localStorage instead of fresh API data?
4. **Vessel ID mapping** - Planning uses `l_sfa`, workspace expects `l-sfa` (underscore vs hyphen)

## Solution

1. Add console logging to trace data flow: planning → API → workspace
2. Verify API returns vessel_data in `/api/planning/{mrn}` response
3. Add left-side SVG elements to workspace diagram
4. Ensure workspace loads from API first, not localStorage cache
