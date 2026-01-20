# OR Command Center (ORCC)

A surgical intelligence and planning suite for vascular surgery. Currently a **UI prototype** with static HTML files demonstrating the complete workflow from patient intake through operative documentation.

**Version:** 0.1.0
**Status:** UI Prototype Phase
**Last Updated:** January 2026

---

## Table of Contents

- [Overview](#overview)
- [File Structure](#file-structure)
- [Data Flow](#data-flow)
- [Clickmap / User Workflows](#clickmap--user-workflows)
- [Page Descriptions](#page-descriptions)
- [Design System](#design-system)
- [Future Development](#future-development)

---

## Overview

ORCC is designed to streamline vascular surgery case planning and documentation. The system supports two distinct workflows based on case location:

### Hospital OR (Piedmont Athens Regional / CRH)
- Carotid procedures (TCAR, CEA)
- Aortic procedures (EVAR, Open AAA)
- Open PAD (Fem-Pop Bypass, Femoral Endarterectomy)

### Albany Vascular Surgery Center (ASC)
- Endovascular PAD (Angioplasty/Stent)
- Venous procedures (VenaSeal, RFA, Laser Ablation)

---

## File Structure

```
/ORCommandCenter/
│
├── ORCC-index.html                        # Navigation hub / launchpad
├── ORCC-settings.html                     # Settings & analytics dashboard
│
├── surgical-command-center-page1.html     # Patient Lists (Pre-Op, Today, Unsigned)
├── surgical-command-center-v2.html        # Patient Lists v2 design
├── surgical-command-center-tasks.html     # Pre-Op Task Manager
│
├── planning-endovascular.html             # Endovascular case planning template
│
├── surgical-command-center-workspace.html # PAD/LE Workspace + Op Note Builder
├── surgical-command-center-workspace-vqi.html # Workspace + VQI Panel
├── workspace-carotid.html                 # Carotid/TCAR Workspace
├── workspace-aortic-aneurysm.html         # AAA/EVAR Workspace
├── workspace-venous.html                  # Venous Disease Workspace
│
├── LEA_PVI_Operative_Note_Template.pdf    # Op note template reference
├── context.md                             # Project context documentation
└── README.md                              # This file
```

---

## Data Flow

### localStorage Keys

| Key | Purpose | Structure |
|-----|---------|-----------|
| `selectedPatient` | Currently selected patient context | Patient object with demographics, procedure, diagnosis |
| `planningData` | Endovascular planning data | Vessel data, interventions, procedure details |
| `orcc_patients` | Array of added patients | Patient objects from Add Patient modal |

### Page-to-Page Data Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              DATA FLOW DIAGRAM                               │
└─────────────────────────────────────────────────────────────────────────────┘

                            ┌──────────────────┐
                            │   ORCC-index     │
                            │   (Hub Page)     │
                            └────────┬─────────┘
                                     │
              ┌──────────────────────┼──────────────────────┐
              │                      │                      │
              ▼                      ▼                      ▼
    ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
    │  Patient Lists  │    │     Tasks       │    │    Settings     │
    │    (page1)      │    │                 │    │                 │
    └────────┬────────┘    └─────────────────┘    └─────────────────┘
             │
             │ Click row → localStorage.setItem('selectedPatient', {...})
             │
    ┌────────┴────────────────────────────────────┐
    │                                             │
    │ "Edit Planning" button                      │ "Open in Workspace" button
    │ (routes by procedure type)                  │ (routes by procedure type)
    │                                             │
    ▼                                             ▼
┌─────────────────┐                    ┌─────────────────────────────────────┐
│   planning-     │                    │           WORKSPACE                  │
│  endovascular   │                    │  (PAD/Carotid/Aortic/Venous)        │
│                 │                    │                                      │
│  - Click vessels│                    │  - Reads selectedPatient            │
│  - Set statuses │                    │  - Reads planningData               │
│  - Plan interv. │                    │  - Updates anatomy diagram          │
│                 │                    │  - Generates Op Note                │
└────────┬────────┘                    └─────────────────────────────────────┘
         │
         │ "Save & Open Workspace" button
         │ localStorage.setItem('planningData', {...})
         │
         └─────────────────────────────────►  Workspace loads planning data


┌─────────────────────────────────────────────────────────────────────────────┐
│                        localStorage DATA STRUCTURES                          │
└─────────────────────────────────────────────────────────────────────────────┘

selectedPatient = {
  id: "p1",
  name: "Smith, John",
  mrn: "MRN-001234",
  dos: "01/15/2026",
  procedure: "RIGHT SFA Angioplasty + Stent",
  diagnosis: "I70.25 - CLI with Tissue Loss",
  anatomy: "SFA Occlusion, 2-vessel runoff",
  ready: true,
  location: "asc" | "hospital"
}

planningData = {
  procDate: "2026-01-20",
  vesselData: {
    "r_sfa": { status: "occluded", notes: "" },
    "r_popliteal": { status: "patent", notes: "" },
    "r_at": { status: "patent", notes: "" },
    "r_pt": { status: "occluded", notes: "" },
    "r_peroneal": { status: "patent", notes: "" },
    ...
  },
  procedure: {
    side: "right",
    rutherford: "r4",
    accessSite: "l_cfa",
    anesthesia: "mac_local",
    outflow: { at: "patent", pt: "occluded", peroneal: "patent" }
  },
  interventions: [
    { vessel: "SFA", intervention: "pta_stent" },
    { vessel: "Popliteal", intervention: "pta" }
  ]
}
```

---

## Clickmap / User Workflows

### Primary Workflow: Case Planning to Op Note

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           PRIMARY USER WORKFLOW                              │
└─────────────────────────────────────────────────────────────────────────────┘

     USER ACTION                    SYSTEM RESPONSE                  NEXT STEP
     ───────────                    ───────────────                  ─────────

1. ┌─────────────┐
   │ Open ORCC   │────────────────► Hub page loads ─────────────────► Click
   │  Index      │                   with nav cards                   "Patient Lists"
   └─────────────┘

2. ┌─────────────┐
   │ Patient     │────────────────► Patient rows display ───────────► Click
   │  Lists      │                   Pre-Op/Today/Unsigned tabs       patient row
   └─────────────┘

3. ┌─────────────┐
   │ Patient     │────────────────► Expanded card shows ────────────► Click
   │  Selected   │                   details, buttons appear          "Edit Planning"
   └─────────────┘

4. ┌─────────────┐                  Routes to planning template
   │ Planning    │────────────────► based on procedure type: ───────► Click vessels
   │  Template   │                   - PAD → planning-endovascular    to set status
   └─────────────┘                   - Carotid → workspace-carotid

5. ┌─────────────┐
   │ Click       │────────────────► Modal opens with ───────────────► Select status
   │  Vessel     │                   status options                   (Patent/Stenosis/
   └─────────────┘                                                    Occluded)

6. ┌─────────────┐
   │ Plan        │────────────────► Add interventions ──────────────► Click "Save &
   │  Interv.    │                   (PTA, Stent, Atherectomy)        Open Workspace"
   └─────────────┘

7. ┌─────────────┐                  - Loads patient context
   │ Workspace   │────────────────► - Updates anatomy diagram ──────► Use Op Note
   │  Opens      │                   - Populates findings table        Builder
   └─────────────┘

8. ┌─────────────┐
   │ Op Note     │────────────────► Interactive checkboxes ─────────► Click
   │  Builder    │                   for all note sections            "Generate Note"
   └─────────────┘

9. ┌─────────────┐
   │ Generated   │────────────────► Full operative note ────────────► Copy to EHR
   │  Note       │                   with all boilerplate
   └─────────────┘
```

### Clickable Elements by Page

#### ORCC-index.html (Hub)
```
┌────────────────────────────────────────────────────────────────┐
│                         ORCC HUB                                │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│   [Logo] ──────────────────────────────────────► Refresh page  │
│                                                                │
│   ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │
│   │ Patient      │  │    Tasks     │  │  Workspace   │        │
│   │   Lists      │  │              │  │              │        │
│   │   ──────►    │  │   ──────►    │  │   ──────►    │        │
│   │ page1.html   │  │ tasks.html   │  │ workspace    │        │
│   └──────────────┘  └──────────────┘  └──────────────┘        │
│                                                                │
│   ┌──────────────┐  ┌──────────────┐                          │
│   │  Settings    │  │   VQI        │                          │
│   │   ──────►    │  │   ──────►    │                          │
│   │ settings     │  │ workspace-vqi│                          │
│   └──────────────┘  └──────────────┘                          │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

#### surgical-command-center-page1.html (Patient Lists)
```
┌────────────────────────────────────────────────────────────────┐
│                      PATIENT LISTS                              │
├────────────────────────────────────────────────────────────────┤
│  [Logo] ► Hub    [PATIENT LISTS] [TASKS] [WORKSPACE] [SETTINGS]│
│                                                                │
│  Tabs: [Pre-Op Queue] [Today's OR] [Unsigned Notes]            │
│         ▼              ▼            ▼                          │
│        Filter        Filter       Filter                       │
│        patients      patients     patients                     │
│                                                                │
│  ┌─────────────────────────────────────────────────────┐      │
│  │ ► Patient Row (click to expand)                      │      │
│  │   ┌─────────────────────────────────────────────┐   │      │
│  │   │ Expanded Card                                │   │      │
│  │   │  [View Details] [Edit Planning] [Workspace►]│   │      │
│  │   │       ▼              ▼              ▼       │   │      │
│  │   │    Alert         Route to        Route to   │   │      │
│  │   │   (coming)      planning        workspace   │   │      │
│  │   └─────────────────────────────────────────────┘   │      │
│  └─────────────────────────────────────────────────────┘      │
│                                                                │
│  [+ Add Patient] ──────────────────────► Opens Add Modal       │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

#### planning-endovascular.html (Planning Template)
```
┌────────────────────────────────────────────────────────────────┐
│                   ENDOVASCULAR PLANNING                         │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐  │
│  │ LEFT PANEL      │ │ CENTER PANEL    │ │ RIGHT PANEL     │  │
│  │                 │ │                 │ │                 │  │
│  │ Procedure Info  │ │ SVG Anatomy     │ │ Interventions   │  │
│  │ ─────────────── │ │ ─────────────── │ │ ─────────────── │  │
│  │ [DOS]           │ │                 │ │ [Add Interv.]   │  │
│  │ [Side ▼]        │ │  Click vessels  │ │      ▼          │  │
│  │ [Rutherford ▼]  │ │  to open modal  │ │  Add to list    │  │
│  │ [Access ▼]      │ │       ▼         │ │                 │  │
│  │                 │ │  ┌──────────┐   │ │ Summary Panel   │  │
│  │ Outflow Status  │ │  │ Vessel   │   │ │ ─────────────── │  │
│  │ [AT ▼]          │ │  │ Modal    │   │ │ Displays        │  │
│  │ [PT ▼]          │ │  │          │   │ │ planning        │  │
│  │ [Peroneal ▼]    │ │  │ [Patent] │   │ │ summary         │  │
│  │                 │ │  │ [Stenosis]│   │ │                 │  │
│  │                 │ │  │ [Occluded]│   │ │                 │  │
│  │                 │ │  └──────────┘   │ │                 │  │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘  │
│                                                                │
│              [Save & Open Workspace] ──────► workspace.html    │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

#### surgical-command-center-workspace.html (Workspace)
```
┌────────────────────────────────────────────────────────────────┐
│                      PAD WORKSPACE                              │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐  │
│  │ PASTE INPUT     │ │ ANATOMY         │ │ STRUCTURED OUT  │  │
│  │                 │ │                 │ │                 │  │
│  │ [Notes]         │ │ [L] [R] [Bilat] │ │ Diagnosis (ICD) │  │
│  │ [Imaging]       │ │      ▼          │ │ ─────────────── │  │
│  │ [Labs]          │ │  Toggle side    │ │ Code tags       │  │
│  │ [Op Notes]      │ │                 │ │                 │  │
│  │      ▼          │ │ SVG Diagram     │ │ Anatomy Defined │  │
│  │  Tab content    │ │ ─────────────── │ │ ─────────────── │  │
│  │                 │ │ Click segments  │ │ Findings table  │  │
│  │ ┌────────────┐  │ │ to cycle:       │ │                 │  │
│  │ │ Paste area │  │ │ Patent →        │ │ Planned Proc.   │  │
│  │ │            │  │ │ Stenosis →      │ │ ─────────────── │  │
│  │ │            │  │ │ Occluded →      │ │ CPT codes       │  │
│  │ └────────────┘  │ │ (repeat)        │ │ LCD status      │  │
│  │                 │ │                 │ │                 │  │
│  │ [⚡ Process]    │ │ Legend:         │ │ OP NOTE BUILDER │  │
│  │      ▼          │ │ ● Patent        │ │ ═══════════════ │  │
│  │ Simulates NLP   │ │ ● Stenosis      │ │ [Builder][Prev] │  │
│  │ processing      │ │ ● Occluded      │ │                 │  │
│  └─────────────────┘ └─────────────────┘ │ Collapsible     │  │
│                                          │ sections with   │  │
│                                          │ checkboxes      │  │
│                                          │                 │  │
│                                          │ [Generate Note] │  │
│                                          │      ▼          │  │
│                                          │ Creates full    │  │
│                                          │ operative note  │  │
│                                          └─────────────────┘  │
│                                                                │
│  [📋 Copy to Athena]  [📄 Generate PDF]                       │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### Op Note Builder Clickmap
```
┌────────────────────────────────────────────────────────────────┐
│                    OP NOTE BUILDER                              │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  [Builder Tab] [Preview Tab]                                   │
│       ▼             ▼                                          │
│   Show form     Show generated note                            │
│                                                                │
│  ┌─ PROCEDURE INFO (collapsible) ─────────────────────────┐   │
│  │  [Date picker]  [Side ▼]  [Access ▼]  [Sheath ▼]       │   │
│  └────────────────────────────────────────────────────────┘   │
│                                                                │
│  ┌─ PREOPERATIVE DIAGNOSIS (collapsible) ─────────────────┐   │
│  │  [☑] PVD with claudication                              │   │
│  │  [☐] PVD with rest pain                                 │   │
│  │  [☐] PVD with tissue loss [________]                    │   │
│  │  [☐] ABI of [____]                                      │   │
│  │  [☐] CLTI                                               │   │
│  │  [☐] Prior intervention [________]                      │   │
│  │  [☐] CKD Stage [__]                                     │   │
│  │  [☐] Osteomyelitis                                      │   │
│  │       ▼                                                 │   │
│  │  Click checkbox to toggle selection                     │   │
│  │  Input fields for variable data                         │   │
│  └────────────────────────────────────────────────────────┘   │
│                                                                │
│  ┌─ PROCEDURE PERFORMED (collapsible) ────────────────────┐   │
│  │  [☑] Lower extremity arteriogram                        │   │
│  │  [☐] Balloon angioplasty SFA [____]                     │   │
│  │  [☐] Balloon angioplasty popliteal [____]               │   │
│  │  [☐] Balloon angioplasty tibial [▼][____]               │   │
│  │  [☐] Atherectomy [▼][____]                              │   │
│  │  [☐] Stent SFA [____]                                   │   │
│  │  [☐] Stent iliac [____]                                 │   │
│  │  [☐] IVUS                                               │   │
│  └────────────────────────────────────────────────────────┘   │
│                                                                │
│  ┌─ AORTOILIAC IMAGING (collapsible) ─────────────────────┐   │
│  │  (●) Aorta widely patent, iliacs widely patent          │   │
│  │  ( ) Iliacs diseased but not flow limiting              │   │
│  │  ( ) Iliac stenosis requiring intervention              │   │
│  │       ▼                                                 │   │
│  │  Radio buttons - single selection                       │   │
│  └────────────────────────────────────────────────────────┘   │
│                                                                │
│  ┌─ TARGET LIMB FINDINGS (collapsible) ───────────────────┐   │
│  │  CFA [▼ widely patent]     Profunda [▼ patent]         │   │
│  │  SFA [▼ occluded]          Popliteal [▼ patent]        │   │
│  │  AT [▼ patent]             PT [▼ occluded]             │   │
│  │  Peroneal [▼ patent]       DP/PT [▼ DP patent]         │   │
│  │       ▼                                                 │   │
│  │  Dropdowns for each vessel status                       │   │
│  └────────────────────────────────────────────────────────┘   │
│                                                                │
│  ┌─ RESULT & CLOSURE (collapsible) ───────────────────────┐   │
│  │  RADIOGRAPHIC RESULT:                                   │   │
│  │  (●) Excellent result, 0% residual                      │   │
│  │  ( ) Good result, <30% residual                         │   │
│  │  ( ) Minimal residual, improved runoff                  │   │
│  │  ( ) Inline flow to foot                                │   │
│  │                                                         │   │
│  │  CLINICAL ASSESSMENT:                                   │   │
│  │  [☑] Patient had [▼2+] [▼DP] pulse at end              │   │
│  │  [☐] Increased doppler signal in foot                   │   │
│  │  [☐] Good palpable popliteal/femoral pulse              │   │
│  │                                                         │   │
│  │  CLOSURE:                                               │   │
│  │  (●) Closure device used                                │   │
│  │  ( ) Pressure held for hemostasis                       │   │
│  └────────────────────────────────────────────────────────┘   │
│                                                                │
│  [📄 Generate Operative Note] ──────────────► Preview tab      │
│                                              shows complete    │
│                                              formatted note    │
└────────────────────────────────────────────────────────────────┘
```

---

## Page Descriptions

| Page | Purpose | Key Features |
|------|---------|--------------|
| **ORCC-index** | Navigation hub | Card-based links to all modules |
| **Patient Lists** | Dashboard | Pre-op queue, Today's OR, Unsigned tabs; Add Patient modal |
| **Tasks** | Pre-op tracking | Task cards by patient, filter buttons, urgency indicators |
| **Workspace (PAD)** | LE planning | 3-panel: Paste Input → Anatomy Diagram → Structured Output + Op Note Builder |
| **Workspace (Carotid)** | TCAR/CEA | Stenosis mapping, high-risk criteria |
| **Workspace (Aortic)** | AAA/EVAR | Neck measurements, EVAR feasibility |
| **Workspace (Venous)** | Ablation | CEAP classification, reflux mapping |
| **Planning Endovascular** | Case planning | Vessel selection, intervention planning, pre-op summary |
| **Settings** | Admin | User profile, LCD config, VQI settings, volume metrics |

---

## Design System

### Colors

| Usage | Name | Hex |
|-------|------|-----|
| Primary | UGA Red | `#BA0C2F` |
| Background | Near-black | `#0A0A0A` |
| Ready/Success | Green | `#22C55E` |
| Warning/Pending | Orange | `#F59E0B` |
| Urgent/Error | Red | `#EF4444` |
| Info | Blue | `#3B82F6` |
| VQI/Registry | Purple | `#8B5CF6` |

### Workspace Accent Colors

| Workspace | Color | Hex |
|-----------|-------|-----|
| PAD/LE | Blue | `#3B82F6` |
| Carotid | Cyan | `#06B6D4` |
| Aortic | Orange | `#F97316` |
| Venous | Indigo | `#6366F1` |

### Typography

- **UI Font:** Inter
- **Code/Data Font:** JetBrains Mono

---

## Future Development

### Phase 1: Perfect the UI (CURRENT)
- [x] Navigation hub
- [x] Patient lists with tabs
- [x] Task manager
- [x] PAD workspace with anatomy diagram
- [x] Endovascular planning template
- [x] Interactive Op Note Builder
- [ ] Carotid/Aortic/Venous workspaces refinement
- [ ] VQI panel integration

### Phase 2: Connect to Backend
- [ ] RESTful API integration
- [ ] Database persistence
- [ ] User authentication
- [ ] EHR integration

### Phase 3: Intelligence Features
- [ ] NLP processing for imaging reports
- [ ] Auto-populate anatomy diagrams
- [ ] Clinical decision support
- [ ] CPT code suggestions

---

## Contact

**Project:** OR Command Center (ORCC)
**Attending:** Joe H. Morgan, M.D.

---

*Generated January 2026*
