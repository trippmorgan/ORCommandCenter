# Shared Workspace - OR Command Center (ORCC)

**Last Updated:** 2026-01-21
**Hub Status:** Connected to claude-team hub (port 4847)

---

## Project Overview

| Field | Value |
|-------|-------|
| **Name** | OR Command Center (ORCC) |
| **Path** | `/home/tripp/ORCommandCenter` |
| **Role** | Surgical intelligence and planning suite for vascular surgery |
| **Status** | Backend Integration Phase (v0.2.0) |

---

## 🚨 ARCHITECTURE UPDATE (2026-01-21)

### SCC Node Retired → PlaudAI is Primary Backend

**ORCC now connects DIRECTLY to PlaudAI (port 8001), NOT SCC (port 3001)**

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        ORCC INTEGRATION ARCHITECTURE                             │
└─────────────────────────────────────────────────────────────────────────────────┘

  ORCC Frontend                          Server1 (100.75.237.36)
  ─────────────                          ──────────────────────────
  /home/tripp/ORCommandCenter
                                         PlaudAI (Port 8001)
  ┌─────────────────────┐                ┌─────────────────────────────────┐
  │ Patient Lists       │───────────────▶│ GET  /api/patients              │
  │ Task Manager        │───────────────▶│ GET  /api/tasks                 │
  │ Workspaces          │───────────────▶│ GET  /api/procedures            │
  │ Planning Pages      │───────────────▶│ POST /api/planning/{caseId}     │
  │                     │                │                                  │
  │ js/api-client.js    │                │ AI Processing:                   │
  │ (fetch to :8001)    │───────────────▶│ POST /api/parse                 │
  │                     │                │ POST /api/synopsis              │
  │ js/websocket.js     │◀─────────────▶│ WebSocket /ws (NEW)             │
  └─────────────────────┘                └─────────────────────────────────┘
                                                        │
                                                        ▼
                                         ┌─────────────────────────────────┐
                                         │ PostgreSQL (Port 5432)          │
                                         │ ├── patients (28 records)       │
                                         │ ├── procedures (24 records)     │
                                         │ ├── tasks (NEW)                 │
                                         │ ├── case_planning (NEW)         │
                                         │ └── audit_logs (897 HIPAA)      │
                                         └─────────────────────────────────┘

  SCC Node (Port 3001) = RETIRED
```

### Why This Change?

| Old Architecture | Problem | New Architecture |
|------------------|---------|------------------|
| ORCC → SCC (3001) → PostgreSQL | SCC has broken DB auth | ORCC → PlaudAI (8001) → PostgreSQL |
| Two separate backends | Redundant, complex | Single unified backend |
| SCC React dashboard | User hates it | ORCC replaces it |

---

## File Structure

```
/ORCommandCenter/
├── ORCC-index.html                    # Navigation hub
├── ORCC-settings.html                 # Settings & Analytics
├── surgical-command-center-page1.html # Patient Lists
├── surgical-command-center-v2.html    # Patient Lists (v2 - live data)
├── surgical-command-center-tasks.html # Pre-Op Task Manager
├── planning-endovascular.html         # Case planning template
├── surgical-command-center-workspace.html # PAD Workspace
├── workspace-carotid.html             # Carotid Workspace
├── workspace-aortic-aneurysm.html     # AAA/EVAR Workspace
├── workspace-venous.html              # Venous Workspace
└── js/
    ├── api-client.js                  # API service layer (→ PlaudAI:8001)
    └── websocket-client.js            # Real-time sync (NEW)
```

---

## Supported Workflows

### Hospital OR (Piedmont Athens Regional / CRH)
| Procedure Type | Examples |
|---------------|----------|
| Carotid | TCAR, CEA |
| Aortic | EVAR, Open AAA |
| Open PAD | Fem-Pop Bypass, Femoral Endarterectomy |

### Albany Vascular Surgery Center (ASC)
| Procedure Type | Examples |
|---------------|----------|
| Endovascular PAD | Angioplasty/Stent |
| Venous | VenaSeal, RFA, Laser Ablation |

---

## Key Features

1. **Patient Lists** - Pre-op queue, Today's OR, Unsigned notes
2. **Anatomy Diagrams** - Interactive SVG vessel mapping
3. **Op Note Builder** - Checkbox-based operative note generation
4. **Task Manager** - Pre-op task tracking with urgency indicators
5. **VQI Integration** - Registry data capture (Phase 3)

---

## Design System

| Element | Value |
|---------|-------|
| Primary Color | UGA Red (#BA0C2F) |
| Background | Near-black (#0A0A0A) |
| UI Font | Inter |
| Code Font | JetBrains Mono |

### Workspace Colors
- PAD: Blue (#3B82F6)
- Carotid: Cyan (#06B6D4)
- Aortic: Orange (#F97316)
- Venous: Indigo (#6366F1)

---

## Backend Integration (PlaudAI)

### API Endpoints (Server1:8001)

| Endpoint | Method | Status | Description |
|----------|--------|--------|-------------|
| `/api/patients` | GET | ✅ Working | List all patients |
| `/api/patients/{mrn}` | GET | ✅ Working | Get patient by MRN |
| `/api/procedures` | GET | ✅ Working | List all procedures |
| `/api/procedures/{id}` | GET/PUT | ✅ Working | Get/Update procedure |
| `/api/tasks` | GET/POST | ⬜ Pending | Task management |
| `/api/tasks/patient/{id}` | GET | ⬜ Pending | Tasks for patient |
| `/api/planning/{caseId}` | GET/POST/PUT | ⬜ Pending | Case planning data |
| `/api/parse` | POST | ✅ Working | AI transcript parsing |
| `/api/synopsis` | POST | ✅ Working | AI summary generation |
| `/api/orcc/status` | GET | ✅ Working | ORCC-specific status |
| `/ws` | WebSocket | ⬜ Pending | Real-time sync |

### Data Transformations

```javascript
// Transform PlaudAI patient → ORCC format
function plaudaiToOrcc(patient, procedure) {
  return {
    id: patient.id,
    mrn: patient.mrn,
    name: `${patient.last_name}, ${patient.first_name}`,
    dob: patient.date_of_birth,
    age: patient.age,
    dos: procedure?.procedure_date,
    procedure: procedure?.procedure_type || '',
    diagnosis: patient.medical_history || '',
    ready: procedure?.status === 'scheduled',
    location: determineLocation(procedure?.procedure_type)
  };
}

// Transform ORCC vesselData → PlaudAI format
function orccToPlaudaiVessel(orccVessel) {
  return {
    status: orccVessel.status,  // 'patent', 'stenosis', 'occluded'
    notes: orccVessel.notes,
    stenosis_percent: orccVessel.stenosis_percent,
    treatment: orccVessel.treatment
  };
}
```

---

## Development Phases

| Phase | Status | Description |
|-------|--------|-------------|
| Phase 1 | ✅ COMPLETE | UI prototype with localStorage |
| Phase 2 | 🔄 IN PROGRESS | Connect to PlaudAI backend |
| Phase 3 | ⬜ PLANNED | VQI integration, NLP features |

---

## Current Priorities (Phase 2)

- [ ] Verify `js/api-client.js` points to PlaudAI:8001
- [ ] Add `js/websocket-client.js` for real-time sync
- [ ] Update patient list to fetch from `/api/patients`
- [ ] Update workspace to save via `/api/procedures`
- [ ] Test with Larry Taylor patient data
- [ ] Add task management UI once `/api/tasks` is ready

---

## Messages

### [2026-01-21] Architecture Change - SCC Retired

**Major Update:** ORCC no longer connects to SCC (port 3001).

**New Backend:** PlaudAI (port 8001) on Server1

**Reason:**
- SCC Node had broken database authentication
- PlaudAI already has working PostgreSQL connection
- Simpler architecture with single backend

**API Base URL:** `http://100.75.237.36:8001/api`

**Action Items for ORCC:**
1. [x] `api-client.js` already points to 8001 - VERIFIED
2. [ ] Add WebSocket client when PlaudAI adds `/ws` endpoint
3. [ ] Test patient list with live data
4. [ ] Test workspace save functionality

**Waiting On PlaudAI (Server1):**
- [ ] `/api/tasks` endpoints
- [ ] `/api/planning/{caseId}` endpoints
- [ ] WebSocket server (`/ws`)

### [2026-01-20] ORCC-SCC Integration Spec (OUTDATED)

~~Full integration spec at `/home/tripp/claude-team/ORCC-SCC-INTEGRATION-SPEC.md`~~

**Note:** This spec referenced SCC (port 3001) which is now retired. Key concepts still apply but endpoint URLs should use PlaudAI (port 8001).

### [2026-01-20] Initial Setup
Connected to claude-team hub. UI prototype ready for review and feedback.

---

## Test Data: Larry Taylor

**MRN:** 32016089
**DOB:** 1954-10-28 (71yo M)
**Procedure:** Left Lower Extremity Arteriogram + Popliteal Atherectomy/Angioplasty

**Status:** NOT IN DATABASE YET

**To Create via PlaudAI:**
```bash
curl -X POST http://100.75.237.36:8001/api/patients \
  -H "Content-Type: application/json" \
  -d '{
    "mrn": "32016089",
    "first_name": "Larry",
    "last_name": "Taylor",
    "date_of_birth": "1954-10-28",
    "age": 71,
    "gender": "male",
    "allergies": "NKDA",
    "current_medications": "aspirin, clopidogrel, Janumet XR, Jardiance, losartan, rosuvastatin, Santyl",
    "medical_history": "CHF, DM2, HTN, heart disease, former smoker"
  }'
```

---

*Edit this file to communicate with the team.*
