---
created: 2026-01-25T22:30
updated: 2026-01-25T22:30
title: Verify planning data flows to workspace for Charles Daniels
area: data-flow
priority: high
files:
  - surgical-command-center-workspace.html
  - planning-endovascular.html
  - js/api-client.js
---

## Problem

Planning page data for Charles Daniels (MRN: 18890211) needs to properly flow to the workspace page.

Current saved data for Charles Daniels:
- L SFA: stenosis_severe
- Intervention: ath_pta (Atherectomy + PTA)
- Side: left
- ICD-10: I70.222

## Expected Behavior

When opening workspace for Charles Daniels:
1. Workspace loads data from `/api/planning/18890211`
2. Findings table shows L SFA with stenosis_severe status
3. Interventions panel shows Atherectomy + PTA planned for L SFA
4. CPT codes display correctly

## Verification Steps

1. Open planning page for Charles Daniels
2. Confirm data is pre-populated from API
3. Navigate to workspace
4. Verify vessel data displays in findings table
5. Verify interventions list populates
6. Check browser console for any errors

## Related Fixes Already Applied

- Added LEFT-side vessels to workspace's `vesselNames` map
- Made `vesselOrder` dynamic based on procedure.side
- Added `loadExistingPlanningData()` to planning page
- Implemented `saveOrUpdateProcedure()` to prevent duplicates

## Remaining Concern

Workspace SVG only has RIGHT-side vessel path elements. LEFT-side procedures won't highlight on the visual diagram until left-side SVG paths are added.
