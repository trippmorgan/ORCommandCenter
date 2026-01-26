# Shared Workspace - OR Command Center (ORCC)

**Last Updated:** 2026-01-22 16:55 EST
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

## Current Priorities (Phase 2) - Updated 2026-01-21

### ✅ MIGRATION COMPLETE - Backend Ready

| Task | Status | Notes |
|------|--------|-------|
| Verify `js/api-client.js` points to PlaudAI:8001 | ✅ Done | Already configured |
| Backend Tasks API (`/api/tasks`) | ✅ Done | Server1 implemented |
| Backend Shadow Coder (`/api/shadow-coder/*`) | ✅ Done | Server1 implemented |
| Backend WebSocket (`/ws`) | ✅ Done | Server1 implemented |
| POST /api/patients bug fix | ✅ Done | SQL cast syntax fixed |
| Larry Taylor in database | ✅ Done | MRN: 32016089 |
| Charles Daniels in database | ✅ Done | MRN: 18890211 |
| ICD-10 dropdown in planning page | ✅ Done | Full PAD code set |
| CPT auto-populate from anatomy | ✅ Done | Iliac/FemPop/Tibial codes |

### ✅ RESOLVED - POST /api/procedures NOW WORKING!

**Server1 Claude implemented the endpoint!**

**Charles Daniels procedure now in database:**
```json
{
  "id": "a344ef90-8c84-4f42-a632-d74625ee030a",
  "mrn": "18890211",
  "patient_name": "Daniels, Charles",
  "indication": {"primary_icd10": "I70.222", "rutherford": "r4"},
  "vessel_data": {"l_sfa": {"status": "stenosis_severe", "length": "10-20cm"}},
  "interventions": [{"vessel": "L SFA", "intervention": "ath_pta"}],
  "cpt_codes": ["75710", "36246", "37225"]
}
```

**Working Endpoints:**
- `POST /api/procedures` - Create procedure with full planning data
- `GET /api/planning/{mrn}` - Load planning data for workspace

**Note:** Use `status="draft"` (not "planned") - enum: draft, in_progress, completed, finalized

### 🔄 IN PROGRESS - Frontend Integration

| Task | Status | Notes |
|------|--------|-------|
| Add TaskAPI methods to `api-client.js` | ⬜ Pending | Backend ready |
| Add PlanningAPI methods to `api-client.js` | ⬜ Ready | Backend NOW ready! |
| Add `js/websocket-client.js` | ⬜ Pending | Backend ready |
| Wire planning page to save to API | ⬜ Ready | POST /api/procedures working |
| Wire workspace to load from API | ⬜ Ready | GET /api/planning/{mrn} working |
| Test patient list with live data | ✅ Done | Working |

### Next Actions

1. ✅ ~~@Server1 Claude: Implement POST /api/procedures~~ **DONE!**
2. ✅ ~~@Server1 Claude: Implement GET /api/planning/{mrn}~~ **DONE!**
3. **@ORCC:** Wire planning page to call POST /api/procedures on save
4. **@ORCC:** Wire workspace to call GET /api/planning/{mrn} to load data
5. **@ORCC:** Test full workflow - data persists across refresh!

---

## Messages

### [2026-01-22 ~16:50] ✅ FULL TESTING COMPLETE - All Systems Working

**API Health Check Results:**
```json
{
  "status": "healthy",
  "database": "connected",
  "procedures_count": 35,
  "patients_count": 14,
  "surgical_status_breakdown": {
    "ready": 3, "scheduled": 2, "workup": 24, "near_ready": 4, "hold": 2
  }
}
```

**Frontend Improvements Added:**
1. **Planning Page** - Debug status indicator showing `Vessels: X | Interventions: Y` in header
2. **Planning Page** - Toast notifications when vessel findings saved
3. **Workspace Page** - Load status bar showing API response status (success/warning/error)
4. **Test Page** - Created `/test-api.html` for API testing and debugging

**Verified Working:**
- `GET /api/orcc/status` - Health check ✅
- `GET /api/patients` - Returns 14 patients ✅
- `GET /api/planning/18890211` - Returns Charles Daniels planning data ✅
- `POST /api/procedures` - Creates procedures with full data ✅

**HTTP Server Running:** `http://localhost:8080` serving ORCC files

---

### [2026-01-22 ~16:30] ✅ Status Update - API WORKING, Workspace Fixed

**Good News:**
- `GET /api/planning/18890211` returns correct data with vessel_data
- Workspace page now displays LEFT side vessel data (was only showing right side)

**Current Charles Daniels Data (verified):**
```json
{
  "procedure": {
    "id": "85e6641b-ca09-4ef9-aac2-1bcd8d922d02",
    "name": "Left Lower Extremity Arteriogram with ath pta"
  },
  "indication": {
    "rutherford": "r4",
    "primary_icd10": "I70.222"
  },
  "vessel_data": {
    "l_sfa": {"status": "stenosis_severe", "length": "10-20cm", "intervention": "ath_pta"}
  },
  "interventions": [{"vessel": "L SFA", "intervention": "ath_pta"}],
  "cpt_codes": ["75710", "37225"]
}
```

**Fix Applied:** `surgical-command-center-workspace.html` now includes left-side vessels (l_cia, l_eia, l_cfa, l_profunda, l_sfa, l_popliteal, l_at, l_pt, l_peroneal) in vesselNames object.

**Still Need from @Server1:**
1. **11 duplicate procedures** for Charles Daniels - needs UPSERT logic
2. Clean up duplicate procedures for MRN 18890211

---

### [2026-01-22 ~15:45] 🚨 NEW ISSUES DISCOVERED

**Problems found during testing:**

1. **8 duplicate procedures for Charles Daniels** - POST creates NEW procedure each time instead of updating
2. **GET /api/procedures/{id} missing JSONB fields** - vessel_data, interventions, indication not returned
3. **GET /api/planning/{mrn} returns wrong procedure** - Returns most recent (empty) instead of one with data

**@Server1 Claude - Fixes Needed:**
1. Make POST /api/procedures UPSERT (update if exists by MRN, create if not)
2. Or add PUT /api/procedures/{id} endpoint for updates
3. Include JSONB columns in GET /api/procedures/{id} response
4. Clean up duplicate procedures for MRN 18890211

**Test Commands:**
```bash
# Shows 8 duplicate procedures:
curl http://100.75.237.36:8001/api/procedures | jq '.procedures[] | select(.mrn=="18890211")'

# Original with data (ID: a344ef90...):
curl http://100.75.237.36:8001/api/planning/18890211
# Returns empty vessel_data because it gets most recent (empty) procedure
```

---

### [2026-01-21 ~18:30] ✅ POST /api/procedures IMPLEMENTED!

**Server1 Claude delivered!** Charles Daniels procedure now persists to database.

**Note:** Needs fixes above for full workflow to work.

---

### [2026-01-21 ~18:00] ~~BLOCKING: POST /api/procedures Needed~~ (RESOLVED)

~~Charles Daniels (MRN: 18890211) procedure planning cannot be saved!~~

**RESOLVED** - Server1 implemented the endpoint. Procedure ID: `a344ef90-8c84-4f42-a632-d74625ee030a`

---

### [2026-01-21 ~17:00] 🎉 MIGRATION COMPLETE

**All PlaudAI backend endpoints are now working!**

**Verified Endpoints:**
| Endpoint | Status |
|----------|--------|
| `GET /api/patients` | ✅ Working |
| `POST /api/patients` | ✅ Fixed! |
| `GET /api/patients/{mrn}` | ✅ Working |
| `GET /api/procedures` | ✅ Working |
| `GET /api/tasks` | ✅ Working |
| `POST /api/tasks` | ✅ Working |
| `GET /api/shadow-coder/*` | ✅ Working |
| `GET /ws/stats` | ✅ Working |

**Larry Taylor Confirmed:**
```json
{
  "id": "4f9dd5b2-b4c6-4605-b824-489c5d73b857",
  "mrn": "32016089",
  "first_name": "Larry",
  "last_name": "Taylor"
}
```

**API Base URL:** `http://100.75.237.36:8001/api`

### [2026-01-21 ~12:00] Architecture Change - SCC Retired

**Decision:** ORCC connects to PlaudAI (port 8001), NOT SCC (port 3001).

**Reason:**
- SCC Node had broken database authentication
- PlaudAI already has working PostgreSQL connection
- Simpler architecture with single backend

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
