# ORCC Data Flow Mapping
## Technical Documentation for Claude Team

**Project:** OR Command Center (ORCC)
**Version:** 1.0.0
**Status:** ✅ FULLY INTEGRATED WITH PLAUDAI BACKEND
**Date:** January 25, 2026

---

## Executive Summary

ORCC is a surgical intelligence and planning suite for vascular surgery. It is now **fully integrated** with the PlaudAI PostgreSQL backend at `http://100.75.237.36:8001`. All patient data, procedures, and planning information persist to the database.

---

## 1. Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        CURRENT ARCHITECTURE                              │
│                     ✅ FULLY INTEGRATED (Jan 2026)                       │
└─────────────────────────────────────────────────────────────────────────┘

    ┌───────────────────────────────────────────────────────────────┐
    │                      BROWSER LAYER                             │
    │  ┌─────────────────────────────────────────────────────────┐  │
    │  │              ORCC HTML Files + Vanilla JS               │  │
    │  │              js/api-client.js (ORCC_API)                │  │
    │  └─────────────────────────────────────────────────────────┘  │
    │                              │                                 │
    │                              ▼                                 │
    │  ┌─────────────────────────────────────────────────────────┐  │
    │  │                   localStorage                           │  │
    │  │  (selectedPatient - for page navigation context only)   │  │
    │  └─────────────────────────────────────────────────────────┘  │
    └───────────────────────────────────────────────────────────────┘
                                 │
                                 │ HTTP REST API
                                 ▼
    ┌───────────────────────────────────────────────────────────────┐
    │                      PLAUDAI API LAYER                         │
    │              http://100.75.237.36:8001                         │
    │              FastAPI + Pydantic + SQLAlchemy                   │
    │                                                                │
    │  ┌─────────────────────────────────────────────────────────┐  │
    │  │ /api/patients        - CRUD patient records             │  │
    │  │ /api/procedures      - CRUD with full planning data     │  │
    │  │ /api/planning/{mrn}  - Get planning data for workspace  │  │
    │  │ /api/tasks           - Task management                  │  │
    │  │ /api/orcc/status     - Health check                     │  │
    │  │ /ws                  - WebSocket for real-time updates  │  │
    │  └─────────────────────────────────────────────────────────┘  │
    └───────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
    ┌───────────────────────────────────────────────────────────────┐
    │                   DATABASE LAYER                               │
    │                   PostgreSQL @ Server1                         │
    │                                                                │
    │  Tables: patients, procedures (with JSONB columns)            │
    │  - vessel_data: JSONB for vessel status map                   │
    │  - interventions: JSONB array of planned interventions        │
    │  - indication, access, inflow, outflow: JSONB                 │
    └───────────────────────────────────────────────────────────────┘
```

---

## 2. API Client (js/api-client.js)

The ORCC_API object provides all backend connectivity:

```javascript
const ORCC_API = {
  baseUrl: 'http://100.75.237.36:8001',

  // PATIENTS
  getPatients(params)           // GET /api/patients
  getPatientByMRN(mrn)          // GET /api/patients/{mrn}
  createPatient(patient)        // POST /api/patients

  // PROCEDURES
  getProcedures(params)         // GET /api/procedures
  getProcedure(id)              // GET /api/procedures/{id}
  createProcedure(procedure)    // POST /api/procedures
  updateProcedure(id, updates)  // PATCH /api/procedures/{id}

  // PLANNING (KEY INTEGRATION POINT)
  getPlanningData(mrn)          // GET /api/planning/{mrn}
  getLatestProcedureByMRN(mrn)  // Helper to get existing procedure
  saveOrUpdateProcedure(data)   // Create or update (prevents duplicates)

  // ORCC STATUS HELPERS
  getReadyPatients()            // GET /api/procedures?surgical_status=ready
  getWorkupPatients()           // GET /api/procedures?surgical_status=workup
  getHoldPatients()             // GET /api/procedures?surgical_status=hold
  updateSurgicalStatus(id, status)
  updateBarriers(id, barriers)
  scheduleProcedure(id, date, location)

  // UTILITY
  checkHealth()                 // GET /api/orcc/status
  mapPatientToORCC(apiPatient)  // Transform API → frontend format
  mapProcedureToORCC(apiProc)   // Transform API → frontend format
}
```

---

## 3. Complete Data Flow

### 3.1 Planning Page → Database → Workspace

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    PLANNING TO WORKSPACE DATA FLOW                       │
└─────────────────────────────────────────────────────────────────────────┘

STEP 1: Patient Selection (Patient List Page)
────────────────────────────────────────────────────────────────────────────
Page:     surgical-command-center-v2.html
Action:   User clicks patient row → "Edit Planning"
Data:     localStorage.setItem('selectedPatient', {mrn, name, ...})
────────────────────────────────────────────────────────────────────────────

STEP 2: Load Existing Data (Planning Page Opens)
────────────────────────────────────────────────────────────────────────────
Page:     planning-endovascular.html
On Load:  loadExistingPlanningData(mrn)
API Call: ORCC_API.getPlanningData(mrn)
Response: {
  patient: { id, mrn, name },
  procedure: { id, type, side, date, ... },
  indication: { primary_icd10, rutherford, ... },
  access: { site, sheath_size, anesthesia },
  inflow: { aortoiliac, cfa },
  outflow: { at, pt, peroneal },
  vessel_data: { l_sfa: { status, length, intervention, notes } },
  interventions: [ { vessel, vesselId, status, intervention, ... } ],
  cpt_codes: [ "75710", "37225" ]
}
Action:   Form fields pre-populated, SVG diagram updated
────────────────────────────────────────────────────────────────────────────

STEP 3: User Edits Planning Data
────────────────────────────────────────────────────────────────────────────
Page:     planning-endovascular.html
Actions:  - Click vessel on SVG → modal opens with existing data
          - Modify status, length, intervention, notes
          - vesselData object updated in memory
          - Add/modify interventions array
────────────────────────────────────────────────────────────────────────────

STEP 4: Save to Database
────────────────────────────────────────────────────────────────────────────
Page:     planning-endovascular.html
Action:   User clicks "Save & Open Workspace"
API Call: ORCC_API.saveOrUpdateProcedure(procedureData)
          - Checks if procedure exists for MRN
          - If exists: PATCH /api/procedures/{id}
          - If new: POST /api/procedures
Response: { id, mrn, vessel_data, interventions, ... }
────────────────────────────────────────────────────────────────────────────

STEP 5: Workspace Loads Planning Data
────────────────────────────────────────────────────────────────────────────
Page:     surgical-command-center-workspace.html
On Load:  loadPlanningData()
API Call: ORCC_API.getPlanningData(mrn)
Actions:  - Transform API response to planning format
          - Map vessel IDs: l_sfa → l-sfa (for SVG)
          - Update SVG diagram colors based on status
          - Populate findings table with vessel data
          - Populate interventions in Op Note Builder
────────────────────────────────────────────────────────────────────────────
```

### 3.2 Vessel ID Mapping

Planning page uses underscores, workspace SVG uses hyphens:

```javascript
const vesselIdMap = {
  'r_sfa': 'r-sfa',      'l_sfa': 'l-sfa',
  'r_cfa': 'r-cfa',      'l_cfa': 'l-cfa',
  'r_eia': 'r-eia',      'l_eia': 'l-eia',
  'r_cia': 'r-cia',      'l_cia': 'l-cia',
  'r_popliteal': 'r-pop','l_popliteal': 'l-pop',
  'r_at': 'r-ata',       'l_at': 'l-ata',
  'r_pt': 'r-pta',       'l_pt': 'l-pta',
  'r_peroneal': 'r-peroneal', 'l_peroneal': 'l-peroneal',
  'r_profunda': 'r-profunda', 'l_profunda': 'l-profunda',
  'aorta': 'aorta'
};
```

---

## 4. Database Schema (Procedures Table)

```sql
procedures (
  id                  UUID PRIMARY KEY,
  patient_id          UUID REFERENCES patients(id),
  mrn                 VARCHAR,
  procedure_type      VARCHAR,    -- 'lea_atherectomy', 'lea_pta', etc.
  procedure_name      VARCHAR,    -- Full descriptive name
  procedure_side      VARCHAR,    -- 'left', 'right', 'bilateral'
  procedure_date      DATE,
  scheduled_location  VARCHAR,    -- 'ASC', 'CRH', 'AUMC'
  status              VARCHAR,    -- 'draft', 'planned', 'completed'
  surgical_status     VARCHAR,    -- 'ready', 'near_ready', 'workup', 'hold'

  -- JSONB Columns for Planning Data
  indication          JSONB,      -- { primary_icd10, rutherford, ... }
  access              JSONB,      -- { site, sheath_size, anesthesia }
  inflow              JSONB,      -- { aortoiliac, cfa }
  outflow             JSONB,      -- { at, pt, peroneal }
  vessel_data         JSONB,      -- { l_sfa: { status, length, notes, intervention } }
  interventions       JSONB,      -- [ { vessel, vesselId, intervention, ... } ]
  cpt_codes           JSONB,      -- [ "75710", "37225", ... ]

  findings            TEXT,
  results             TEXT,
  created_at          TIMESTAMP,
  updated_at          TIMESTAMP
)
```

---

## 5. API Endpoints Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/patients` | List patients (search, skip, limit) |
| GET | `/api/patients/{mrn}` | Get patient by MRN with procedures |
| POST | `/api/patients` | Create new patient |
| GET | `/api/procedures` | List procedures (surgical_status, patient_id) |
| GET | `/api/procedures/{id}` | Get single procedure |
| POST | `/api/procedures` | Create procedure with full planning data |
| PATCH | `/api/procedures/{id}` | Update procedure |
| DELETE | `/api/procedures/{id}` | Delete procedure |
| GET | `/api/planning/{mrn}` | **KEY** - Get planning data for workspace |
| GET | `/api/orcc/status` | Health check |

---

## 6. Test Data (Verified Working)

### Charles Daniels (MRN: 18890211)
```json
{
  "patient": { "name": "Daniels, Charles" },
  "procedure": {
    "type": "lea_atherectomy",
    "side": "left",
    "surgical_status": "workup"
  },
  "indication": {
    "primary_icd10": "I70.222",
    "rutherford": "r4"
  },
  "vessel_data": {
    "l_sfa": {
      "status": "stenosis_severe",
      "length": "10-20cm",
      "intervention": "ath_pta",
      "notes": "in stent restenosis with rotarex instent"
    }
  },
  "interventions": [{
    "vessel": "L SFA",
    "vesselId": "l_sfa",
    "status": "stenosis_severe",
    "intervention": "ath_pta"
  }],
  "cpt_codes": ["75710", "37225"]
}
```

---

## 7. File Responsibilities

| File | Purpose | Data Source |
|------|---------|-------------|
| `surgical-command-center-v2.html` | Patient Lists Dashboard | API: /api/procedures |
| `planning-endovascular.html` | Vessel Planning | API: /api/planning, /api/procedures |
| `surgical-command-center-workspace.html` | Procedure Workspace | API: /api/planning |
| `js/api-client.js` | API Client | All API calls |

---

## 8. Recent Fixes (Jan 25, 2026)

1. **Duplicate Procedure Prevention**
   - Added `saveOrUpdateProcedure()` - checks for existing procedure before creating
   - Uses `getLatestProcedureByMRN()` helper

2. **Planning Page Data Loading**
   - Added `loadExistingPlanningData()` on page load
   - Pre-populates all form fields from API
   - Pre-populates vessel modal with existing data

3. **Left-Side Vessel Support**
   - Added LEFT-side vessels to workspace `vesselNames` map
   - Made `vesselOrder` dynamic based on procedure.side
   - Added LEFT-side SVG path elements (l-sfa, l-cfa, l-eia, etc.)

4. **Deleted 26 Duplicate Procedures**
   - PlaudAI added DELETE /api/procedures/{id} endpoint
   - Cleaned up all duplicate procedure records

---

## Contact

- **ORCC Claude:** /home/tripp/SynologyDrive/ORCommandCenter
- **PlaudAI Backend:** http://100.75.237.36:8001
- **Claude Team Hub:** localhost:4847

---

*Document updated January 25, 2026 - Backend fully integrated*
