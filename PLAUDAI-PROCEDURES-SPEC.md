# PlaudAI Procedures API Specification

**Date:** 2026-01-21
**Status:** ✅ IMPLEMENTED (2026-01-21 17:50)
**Requested By:** ORCC Frontend Team

---

## ✅ Implementation Complete

| Endpoint | Status | Notes |
|----------|--------|-------|
| `POST /api/procedures` | ✅ Working | Creates procedures with full planning data |
| `GET /api/planning/{mrn}` | ✅ Working | Returns planning data for workspace |
| ORCC Planning Page | ✅ Wired | Calls POST on save |
| ORCC Workspace | ✅ Wired | Loads from GET |
| Charles Daniels test | ✅ Verified | MRN: 18890211 |

### Test Command
```bash
curl -s http://100.75.237.36:8001/api/planning/18890211 | python3 -m json.tool
```

---

## Original Problem Statement (SOLVED)

ORCC's Endovascular Planning page collects detailed procedure data (vessel anatomy, interventions, ICD-10 codes, CPT codes) but ~~cannot persist it to the database~~ **NOW SAVES TO PLAUDAI**.

**Previous State (FIXED):**
- ~~Data saves to browser localStorage only~~ → Now saves to PlaudAI PostgreSQL
- ~~Refreshing the page loses all planning data~~ → Data persists across refreshes
- ~~Workspace doesn't receive data from planning page~~ → Workspace loads from API
- ~~Procedures cannot be attached to patients in the database~~ → Procedures saved with full data

**Charles Daniels (MRN: 18890211):**
- ✅ Procedure record created
- ✅ vessel_data: L SFA 70-99% stenosis
- ✅ interventions: Atherectomy + PTA
- ✅ ICD-10: I70.222 (Rest pain, left leg)
- ✅ CPT codes: 75710, 36246, 37225

---

## Required Endpoints

### 1. POST /api/procedures (CREATE)

Create a new procedure record linked to a patient.

**Request:**
```json
{
  "mrn": "18890211",
  "procedure_type": "LEA with Angioplasty",
  "procedure_name": "Left Lower Extremity Arteriogram with Atherectomy and Angioplasty",
  "procedure_side": "left",
  "procedure_date": "2026-01-21",
  "scheduled_location": "ASC",
  "status": "planned",
  "surgical_status": "workup",

  "indication": {
    "primary_icd10": "I70.222",
    "primary_icd10_text": "Atherosclerosis of native arteries with rest pain, left leg",
    "secondary_icd10": null,
    "rutherford": "r4"
  },

  "access": {
    "site": "r_cfa",
    "sheath_size": "6",
    "anesthesia": "mac_local"
  },

  "inflow": {
    "aortoiliac": "normal",
    "cfa": "normal"
  },

  "outflow": {
    "at": "patent",
    "pt": "patent",
    "peroneal": "patent"
  },

  "vessel_data": {
    "l_sfa": {
      "status": "stenosis_severe",
      "length": "10-20cm",
      "notes": ""
    }
  },

  "interventions": [
    {
      "vessel": "L SFA",
      "vessel_id": "l_sfa",
      "status": "stenosis_severe",
      "length": "10-20cm",
      "intervention": "ath_pta",
      "notes": ""
    }
  ],

  "cpt_codes": ["75710", "36246", "37225"],

  "findings": null,
  "results": null
}
```

**Response:**
```json
{
  "id": "uuid-here",
  "mrn": "18890211",
  "patient_id": "d6a2b359-cb0a-443a-8ba5-8bd47e475e03",
  "procedure_type": "LEA with Angioplasty",
  "procedure_name": "Left Lower Extremity Arteriogram with Atherectomy and Angioplasty",
  "procedure_side": "left",
  "procedure_date": "2026-01-21T00:00:00",
  "scheduled_location": "ASC",
  "status": "planned",
  "surgical_status": "workup",
  "indication": {...},
  "access": {...},
  "vessel_data": {...},
  "interventions": [...],
  "cpt_codes": [...],
  "created_at": "2026-01-21T17:30:00",
  "updated_at": "2026-01-21T17:30:00"
}
```

### 2. PATCH /api/procedures/{id} (UPDATE)

Update an existing procedure with post-op findings, results, etc.

**Request:**
```json
{
  "status": "completed",
  "findings": "70% stenosis of left SFA confirmed on angiography",
  "results": "Excellent result with <30% residual stenosis, 3-vessel runoff to foot",
  "vessel_data": {
    "l_sfa": {
      "status": "patent",
      "notes": "Post-atherectomy and angioplasty"
    }
  }
}
```

### 3. GET /api/procedures/{id} (Already exists - verify returns full data)

Should return the complete procedure including vessel_data, interventions, etc.

### 4. GET /api/planning/{mrn} (NEW - Planning Data)

Get planning data for a patient by MRN (for workspace to load).

**Response:**
```json
{
  "patient": {
    "id": "d6a2b359-cb0a-443a-8ba5-8bd47e475e03",
    "mrn": "18890211",
    "name": "Daniels, Charles"
  },
  "procedure": {
    "id": "uuid",
    "type": "LEA with Angioplasty",
    "side": "left",
    "date": "2026-01-21",
    "status": "planned"
  },
  "indication": {
    "primary_icd10": "I70.222",
    "rutherford": "r4"
  },
  "vessel_data": {...},
  "interventions": [...],
  "cpt_codes": [...]
}
```

---

## Database Schema Changes

### Option A: Add columns to existing `procedures` table

```sql
ALTER TABLE procedures ADD COLUMN IF NOT EXISTS indication JSONB DEFAULT '{}';
ALTER TABLE procedures ADD COLUMN IF NOT EXISTS access_details JSONB DEFAULT '{}';
ALTER TABLE procedures ADD COLUMN IF NOT EXISTS inflow_status JSONB DEFAULT '{}';
ALTER TABLE procedures ADD COLUMN IF NOT EXISTS outflow_status JSONB DEFAULT '{}';
ALTER TABLE procedures ADD COLUMN IF NOT EXISTS vessel_data JSONB DEFAULT '{}';
ALTER TABLE procedures ADD COLUMN IF NOT EXISTS interventions JSONB DEFAULT '[]';
ALTER TABLE procedures ADD COLUMN IF NOT EXISTS cpt_codes JSONB DEFAULT '[]';
ALTER TABLE procedures ADD COLUMN IF NOT EXISTS findings TEXT;
ALTER TABLE procedures ADD COLUMN IF NOT EXISTS results TEXT;
```

### Option B: Create separate `procedure_planning` table

```sql
CREATE TABLE procedure_planning (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    procedure_id UUID UNIQUE REFERENCES procedures(id) ON DELETE CASCADE,
    indication JSONB DEFAULT '{}',
    access_details JSONB DEFAULT '{}',
    inflow_status JSONB DEFAULT '{}',
    outflow_status JSONB DEFAULT '{}',
    vessel_data JSONB DEFAULT '{}',
    interventions JSONB DEFAULT '[]',
    cpt_codes JSONB DEFAULT '[]',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_procedure_planning_procedure_id ON procedure_planning(procedure_id);
```

**Recommendation:** Option A is simpler. The data belongs with the procedure.

---

## Pydantic Models (FastAPI)

```python
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import date, datetime
from uuid import UUID

class IndicationData(BaseModel):
    primary_icd10: str
    primary_icd10_text: Optional[str] = None
    secondary_icd10: Optional[str] = None
    secondary_icd10_text: Optional[str] = None
    rutherford: Optional[str] = None  # r3, r4, r5, r6

class AccessData(BaseModel):
    site: Optional[str] = None  # r_cfa, l_cfa, brachial, pedal
    sheath_size: Optional[str] = None  # 4, 5, 6, 7, 8
    anesthesia: Optional[str] = None  # mac_local, local, general

class VesselStatus(BaseModel):
    status: str  # patent, stenosis_mild, stenosis_mod, stenosis_severe, occluded
    length: Optional[str] = None  # <5cm, 5-10cm, 10-20cm, >20cm
    intervention: Optional[str] = None
    notes: Optional[str] = None

class InterventionData(BaseModel):
    vessel: str  # "L SFA", "R Popliteal", etc.
    vessel_id: str  # "l_sfa", "r_popliteal", etc.
    status: str
    length: Optional[str] = None
    intervention: str  # pta, stent, atherectomy, pta_stent, ath_pta, ath_pta_stent
    notes: Optional[str] = None

class ProcedureCreate(BaseModel):
    mrn: str
    procedure_type: Optional[str] = None
    procedure_name: Optional[str] = None
    procedure_side: Optional[str] = None  # left, right, bilateral
    procedure_date: Optional[date] = None
    scheduled_location: Optional[str] = "ASC"  # ASC, CRH, AUMC
    status: Optional[str] = "planned"  # planned, in_progress, completed, finalized
    surgical_status: Optional[str] = "workup"  # ready, near_ready, workup, hold

    indication: Optional[IndicationData] = None
    access: Optional[AccessData] = None
    inflow: Optional[Dict[str, str]] = None  # {aortoiliac: "normal", cfa: "normal"}
    outflow: Optional[Dict[str, str]] = None  # {at: "patent", pt: "patent", peroneal: "patent"}
    vessel_data: Optional[Dict[str, VesselStatus]] = None
    interventions: Optional[List[InterventionData]] = None
    cpt_codes: Optional[List[str]] = None

    findings: Optional[str] = None
    results: Optional[str] = None

class ProcedureUpdate(BaseModel):
    procedure_type: Optional[str] = None
    procedure_name: Optional[str] = None
    procedure_side: Optional[str] = None
    procedure_date: Optional[date] = None
    scheduled_location: Optional[str] = None
    status: Optional[str] = None
    surgical_status: Optional[str] = None

    indication: Optional[IndicationData] = None
    access: Optional[AccessData] = None
    inflow: Optional[Dict[str, str]] = None
    outflow: Optional[Dict[str, str]] = None
    vessel_data: Optional[Dict[str, Any]] = None
    interventions: Optional[List[InterventionData]] = None
    cpt_codes: Optional[List[str]] = None

    findings: Optional[str] = None
    results: Optional[str] = None
```

---

## API Implementation Example

```python
from fastapi import APIRouter, HTTPException
from sqlalchemy import text
import json
from uuid import uuid4
from datetime import datetime

router = APIRouter()

@router.post("/api/procedures")
async def create_procedure(procedure: ProcedureCreate, db = Depends(get_db)):
    """Create a new procedure for a patient."""

    # Find patient by MRN
    patient_result = await db.execute(
        text("SELECT id FROM patients WHERE mrn = :mrn"),
        {"mrn": procedure.mrn}
    )
    patient = patient_result.fetchone()

    if not patient:
        raise HTTPException(status_code=404, detail=f"Patient with MRN {procedure.mrn} not found")

    patient_id = patient[0]
    procedure_id = str(uuid4())
    now = datetime.now()

    # Insert procedure
    await db.execute(
        text("""
            INSERT INTO procedures (
                id, patient_id, mrn, procedure_type, procedure_name, procedure_side,
                procedure_date, scheduled_location, status, surgical_status,
                indication, access_details, inflow_status, outflow_status,
                vessel_data, interventions, cpt_codes, findings, results,
                created_at, updated_at
            ) VALUES (
                CAST(:id AS UUID), CAST(:patient_id AS UUID), :mrn, :procedure_type,
                :procedure_name, :procedure_side, :procedure_date, :scheduled_location,
                :status, :surgical_status, CAST(:indication AS JSONB),
                CAST(:access_details AS JSONB), CAST(:inflow_status AS JSONB),
                CAST(:outflow_status AS JSONB), CAST(:vessel_data AS JSONB),
                CAST(:interventions AS JSONB), CAST(:cpt_codes AS JSONB),
                :findings, :results, :created_at, :updated_at
            )
        """),
        {
            "id": procedure_id,
            "patient_id": str(patient_id),
            "mrn": procedure.mrn,
            "procedure_type": procedure.procedure_type,
            "procedure_name": procedure.procedure_name,
            "procedure_side": procedure.procedure_side,
            "procedure_date": procedure.procedure_date,
            "scheduled_location": procedure.scheduled_location,
            "status": procedure.status,
            "surgical_status": procedure.surgical_status,
            "indication": json.dumps(procedure.indication.dict() if procedure.indication else {}),
            "access_details": json.dumps(procedure.access.dict() if procedure.access else {}),
            "inflow_status": json.dumps(procedure.inflow or {}),
            "outflow_status": json.dumps(procedure.outflow or {}),
            "vessel_data": json.dumps({k: v.dict() for k, v in (procedure.vessel_data or {}).items()}),
            "interventions": json.dumps([i.dict() for i in (procedure.interventions or [])]),
            "cpt_codes": json.dumps(procedure.cpt_codes or []),
            "findings": procedure.findings,
            "results": procedure.results,
            "created_at": now,
            "updated_at": now
        }
    )
    await db.commit()

    # Return created procedure
    return {
        "id": procedure_id,
        "patient_id": str(patient_id),
        "mrn": procedure.mrn,
        "procedure_type": procedure.procedure_type,
        "procedure_name": procedure.procedure_name,
        "procedure_side": procedure.procedure_side,
        "procedure_date": str(procedure.procedure_date) if procedure.procedure_date else None,
        "scheduled_location": procedure.scheduled_location,
        "status": procedure.status,
        "surgical_status": procedure.surgical_status,
        "indication": procedure.indication.dict() if procedure.indication else {},
        "vessel_data": {k: v.dict() for k, v in (procedure.vessel_data or {}).items()},
        "interventions": [i.dict() for i in (procedure.interventions or [])],
        "cpt_codes": procedure.cpt_codes or [],
        "created_at": now.isoformat(),
        "updated_at": now.isoformat()
    }
```

---

## Test Case: Charles Daniels

After implementing, test with:

```bash
curl -X POST http://100.75.237.36:8001/api/procedures \
  -H "Content-Type: application/json" \
  -d '{
    "mrn": "18890211",
    "procedure_type": "LEA with Angioplasty",
    "procedure_name": "Left Lower Extremity Arteriogram with Atherectomy and Angioplasty",
    "procedure_side": "left",
    "procedure_date": "2026-01-21",
    "scheduled_location": "ASC",
    "status": "planned",
    "surgical_status": "workup",
    "indication": {
      "primary_icd10": "I70.222",
      "primary_icd10_text": "Atherosclerosis of native arteries with rest pain, left leg",
      "rutherford": "r4"
    },
    "access": {
      "site": "r_cfa",
      "sheath_size": "6",
      "anesthesia": "mac_local"
    },
    "inflow": {"aortoiliac": "normal", "cfa": "normal"},
    "outflow": {"at": "patent", "pt": "patent", "peroneal": "patent"},
    "vessel_data": {
      "l_sfa": {"status": "stenosis_severe", "length": "10-20cm"}
    },
    "interventions": [
      {
        "vessel": "L SFA",
        "vessel_id": "l_sfa",
        "status": "stenosis_severe",
        "length": "10-20cm",
        "intervention": "ath_pta"
      }
    ],
    "cpt_codes": ["75710", "36246", "37225"]
  }'
```

**Expected:** 201 Created with full procedure object

---

## ORCC Frontend Integration

Once the API is ready, ORCC will:

1. **Endovascular Planning page** (`planning-endovascular.html`):
   - Call `POST /api/procedures` on "Save & Open Workspace"
   - Store procedure ID for subsequent updates

2. **Workspace** (`surgical-command-center-workspace.html`):
   - Call `GET /api/planning/{mrn}` to load saved data
   - Pre-populate vessel diagram, interventions, etc.

3. **Patient List** (`surgical-command-center-page1.html`):
   - Display procedure type, date, and status from API
   - Show "Anatomy Defined" when vessel_data exists

---

## Priority

**CRITICAL** - This is blocking the core ORCC workflow:
1. User cannot plan procedures that persist
2. Workspace loses data on refresh
3. Patient list cannot show procedure details

Please implement `POST /api/procedures` first, then `GET /api/planning/{mrn}`.

---

*Document created by ORCC Claude for Server1/PlaudAI Claude*
