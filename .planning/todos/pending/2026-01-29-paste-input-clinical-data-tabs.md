---
created: 2026-01-29T22:04
title: Add clinical data tabs to Paste Input section
area: ui
files:
  - surgical-command-center-workspace.html
---

## Problem

The Paste Input section in the ORCC workspace currently only has a single text area for pasting clinical notes. Surgeons need quick access to historical patient data while building operative notes:

- **Notes** - All available clinical notes (progress notes, H&P, consults, etc.)
- **Imaging** - Old imaging reports and images (CTA, MRA, duplex, angiograms)
- **Labs** - Laboratory results (CBC, BMP, coags, HbA1c, creatinine)
- **Op Notes** - Previous operative notes for this patient

This data should be fetched from the PlaudAI backend and displayed in a tabbed interface, allowing the surgeon to pull up and reference any prior documentation while completing the current op note.

## Solution

TBD - Consider:
- Tab interface within Paste Input section
- API endpoints to fetch patient history (may need PlaudAI backend work)
- Clickable items that auto-populate or copy to paste area
- Date filtering / search within each category
