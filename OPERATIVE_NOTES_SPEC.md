# Operative Notes & ORCC Reports - Database Specification

**Version:** 1.0.0
**Date:** 2026-01-27
**Status:** PROPOSED - Awaiting PlaudAI Implementation
**Purpose:** Permanent storage for operative notes and compiled surgical reports

---

## Problem Statement

The current `procedures` table stores planning data (vessel_data, interventions, CPT codes) but:
- PATCH endpoint doesn't accept `findings` or `results` fields
- No structured storage for operative note components
- No report compilation capability
- Op notes currently save to localStorage only (lost across devices)

---

## Solution: Two New Tables

### Relationship to Existing Schema

```
EXISTING TABLES                    NEW TABLES
───────────────                    ──────────

patients ◄───────────────────────► operative_notes
  │                                     │
  │                                     │
  ▼                                     ▼
procedures ◄─────────────────────► orcc_reports
  │
  │ (existing JSONB columns)
  ├── vessel_data
  ├── interventions
  ├── indication
  ├── access
  ├── inflow
  ├── outflow
  └── cpt_codes
```

**Key Insight:** The `procedures` table handles PRE-operative planning. The new tables handle POST-operative documentation and reporting.

---

## Table 1: operative_notes

Stores the complete operative note with structured fields for each section.

```sql
-- ============================================================
-- TABLE: operative_notes
-- PURPOSE: Store structured operative note data linked to procedures
-- ============================================================

CREATE TABLE operative_notes (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Foreign Keys (link to existing tables)
    procedure_id UUID NOT NULL REFERENCES procedures(id) ON DELETE CASCADE,
    patient_id UUID REFERENCES patients(id) ON DELETE SET NULL,
    mrn VARCHAR(20) NOT NULL,

    -- Note Metadata
    note_type VARCHAR(50) NOT NULL DEFAULT 'PAD',  -- 'PAD', 'Carotid', 'AAA', 'Venous'
    note_status VARCHAR(30) DEFAULT 'draft',       -- 'draft', 'generated', 'finalized', 'signed'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    signed_by VARCHAR(255),
    signed_at TIMESTAMP WITH TIME ZONE,

    -- ============================================================
    -- SECTION 1: Procedure Information
    -- ============================================================
    procedure_date DATE,
    procedure_side VARCHAR(20),                    -- 'Left', 'Right', 'Bilateral'
    access_site VARCHAR(50),                       -- 'Right CFA', 'Left CFA', 'Brachial'
    sheath_size VARCHAR(10),                       -- '4Fr', '5Fr', '6Fr', '7Fr'
    anesthesia_type VARCHAR(50),                   -- 'MAC + Local', 'General', 'Local only'

    -- ============================================================
    -- SECTION 2: Preoperative Diagnosis (array of selected diagnoses)
    -- ============================================================
    preop_diagnosis TEXT[],                        -- ['PVD with claudication', 'CLTI', ...]
    abi_value DECIMAL(3,2),                        -- e.g., 0.45
    tissue_loss_location VARCHAR(100),             -- 'Left heel ulcer'
    prior_intervention VARCHAR(255),               -- 'Prior SFA stent 2024'
    ckd_stage INTEGER,                             -- 1-5
    has_osteomyelitis BOOLEAN DEFAULT FALSE,

    -- ============================================================
    -- SECTION 3: Procedures Performed (array + details)
    -- ============================================================
    procedures_performed TEXT[],                   -- ['LE arteriogram', 'SFA angioplasty', ...]

    -- Balloon Angioplasty details (JSONB for flexibility)
    balloon_angioplasty JSONB,
    -- Example: [
    --   {"vessel": "SFA", "size": "5x200mm", "atm": 12, "duration_sec": 180},
    --   {"vessel": "Popliteal", "size": "4x150mm", "atm": 10, "duration_sec": 120}
    -- ]

    -- Atherectomy details
    atherectomy JSONB,
    -- Example: [
    --   {"vessel": "SFA", "device": "Rotarex", "burr_size": "2.0mm", "passes": 3}
    -- ]

    -- Stent placement details
    stent_placement JSONB,
    -- Example: [
    --   {"vessel": "SFA", "stent_type": "Supera", "size": "6x150mm"}
    -- ]

    -- IVUS used
    ivus_used BOOLEAN DEFAULT FALSE,

    -- ============================================================
    -- SECTION 4: Aortoiliac Imaging (phrase selection)
    -- ============================================================
    aortoiliac_findings TEXT,                      -- Full phrase from builder
    -- Options:
    -- 'Aorta widely patent, iliacs widely patent bilateral'
    -- 'Iliacs with disease but not flow limiting'
    -- 'Iliac stenosis requiring intervention'

    -- ============================================================
    -- SECTION 5: Target Limb Findings (JSONB for each vessel)
    -- ============================================================
    target_limb_findings JSONB,
    -- Structure: {
    --   "cfa": "widely patent",
    --   "profunda": "patent",
    --   "sfa": "occluded",
    --   "popliteal": "70% stenosis",
    --   "at": "patent",
    --   "pt": "occluded mid-leg",
    --   "peroneal": "patent",
    --   "dp_pt": "DP patent"
    -- }

    -- ============================================================
    -- SECTION 6: Results & Closure
    -- ============================================================
    -- Radiographic result (phrase selection)
    radiographic_result TEXT,
    -- Options:
    -- 'Excellent result with 0% residual stenosis'
    -- 'Good result with <30% residual stenosis'
    -- 'Minimal residual stenosis with improved inline flow'

    residual_stenosis VARCHAR(20),                 -- '0%', '<30%', '30-50%'

    -- Clinical assessment
    final_pulse_grade VARCHAR(10),                 -- '2+', '1+', 'Doppler'
    final_pulse_location VARCHAR(20),              -- 'DP', 'PT', 'Popliteal'
    doppler_signal_improved BOOLEAN,
    palpable_femoral_popliteal BOOLEAN,

    -- Closure method
    closure_method TEXT,
    -- Options:
    -- 'Closure device was used successfully'
    -- 'Pressure held for hemostasis'

    -- Complications
    complications TEXT,                            -- Usually 'None' or description
    patient_condition VARCHAR(50) DEFAULT 'stable', -- 'stable', 'unchanged', etc.

    -- ============================================================
    -- SECTION 7: Full Generated Note Text
    -- ============================================================
    full_note_text TEXT,                           -- Complete formatted operative note
    full_note_html TEXT,                           -- HTML version for display

    -- ============================================================
    -- Billing & Compliance Flags
    -- ============================================================
    is_billable BOOLEAN DEFAULT FALSE,
    requires_review BOOLEAN DEFAULT FALSE,
    review_notes TEXT,

    -- Indexes
    CONSTRAINT fk_procedure FOREIGN KEY (procedure_id) REFERENCES procedures(id)
);

-- Indexes for fast lookups
CREATE INDEX idx_operative_notes_mrn ON operative_notes(mrn);
CREATE INDEX idx_operative_notes_procedure_id ON operative_notes(procedure_id);
CREATE INDEX idx_operative_notes_patient_id ON operative_notes(patient_id);
CREATE INDEX idx_operative_notes_created_at ON operative_notes(created_at DESC);
CREATE INDEX idx_operative_notes_status ON operative_notes(note_status);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_operative_notes_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_operative_notes_updated
    BEFORE UPDATE ON operative_notes
    FOR EACH ROW
    EXECUTE FUNCTION update_operative_notes_timestamp();
```

---

## Table 2: orcc_reports

Stores compiled surgical reports with billing/coding information.

```sql
-- ============================================================
-- TABLE: orcc_reports
-- PURPOSE: Store compiled ORCC surgical reports for billing/quality
-- ============================================================

CREATE TABLE orcc_reports (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Foreign Keys
    procedure_id UUID NOT NULL REFERENCES procedures(id) ON DELETE CASCADE,
    operative_note_id UUID REFERENCES operative_notes(id) ON DELETE SET NULL,
    patient_id UUID REFERENCES patients(id) ON DELETE SET NULL,

    -- Report Metadata
    report_type VARCHAR(50) NOT NULL DEFAULT 'surgical_summary',
    -- Types: 'surgical_summary', 'billing_compilation', 'quality_review'
    mrn VARCHAR(20) NOT NULL,
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    generated_by VARCHAR(255),

    -- ============================================================
    -- Patient & Procedure Info (denormalized for report generation)
    -- ============================================================
    patient_name VARCHAR(255),
    date_of_procedure DATE,
    facility_name VARCHAR(255),
    surgeon_name VARCHAR(255) DEFAULT 'Joe H. Morgan, M.D.',

    -- ============================================================
    -- Clinical Summary
    -- ============================================================
    preoperative_diagnosis TEXT,
    postoperative_diagnosis TEXT,
    procedures_performed TEXT[],
    findings_summary TEXT,
    results_summary TEXT,
    complications_summary TEXT,

    -- ============================================================
    -- Billing & Coding
    -- ============================================================
    primary_cpt_code VARCHAR(10),
    secondary_cpt_codes VARCHAR(10)[],
    primary_icd10_code VARCHAR(10),
    secondary_icd10_codes VARCHAR(10)[],

    -- LCD (Local Coverage Determination) tracking
    lcd_reference VARCHAR(50),                     -- 'L33803'
    lcd_criteria_met BOOLEAN,
    medical_necessity_documented BOOLEAN,
    medical_necessity_notes TEXT,

    -- ============================================================
    -- Quality Metrics (optional)
    -- ============================================================
    case_duration_minutes INTEGER,
    fluoroscopy_time_seconds INTEGER,
    contrast_volume_ml DECIMAL(5,1),
    radiation_dose_mgy DECIMAL(6,2),

    -- ============================================================
    -- Compiled Report Content
    -- ============================================================
    compiled_report_html TEXT,                     -- Full HTML report
    compiled_report_text TEXT,                     -- Plain text version
    compiled_report_pdf BYTEA,                     -- PDF binary (optional)

    -- ============================================================
    -- Status & Workflow
    -- ============================================================
    report_status VARCHAR(30) DEFAULT 'draft',
    -- Status: 'draft', 'ready_for_review', 'approved', 'submitted', 'archived'

    approved_by VARCHAR(255),
    approved_at TIMESTAMP WITH TIME ZONE,
    submitted_to VARCHAR(100),                     -- 'VQI', 'Billing', etc.
    submitted_at TIMESTAMP WITH TIME ZONE,

    -- Missing documentation flags
    missing_documentation TEXT[],
    requires_coding_review BOOLEAN DEFAULT FALSE,
    requires_quality_review BOOLEAN DEFAULT FALSE,

    -- Indexes
    CONSTRAINT fk_report_procedure FOREIGN KEY (procedure_id) REFERENCES procedures(id),
    CONSTRAINT fk_report_op_note FOREIGN KEY (operative_note_id) REFERENCES operative_notes(id)
);

-- Indexes
CREATE INDEX idx_orcc_reports_mrn ON orcc_reports(mrn);
CREATE INDEX idx_orcc_reports_procedure_id ON orcc_reports(procedure_id);
CREATE INDEX idx_orcc_reports_generated_at ON orcc_reports(generated_at DESC);
CREATE INDEX idx_orcc_reports_status ON orcc_reports(report_status);
```

---

## API Endpoints Specification

### 1. Operative Notes Endpoints

#### POST /api/operative-notes
Create a new operative note for a procedure.

**Request Body:**
```json
{
  "procedureId": "302f7b06-f380-456e-83c0-aa0114048492",
  "mrn": "18890211",
  "noteType": "PAD",

  "procedureDate": "2026-01-27",
  "procedureSide": "Left",
  "accessSite": "Right CFA",
  "sheathSize": "6Fr",
  "anesthesiaType": "MAC + Local",

  "preopDiagnosis": ["PVD with claudication", "CLTI"],
  "abiValue": 0.45,
  "tissueLocation": "Left heel",

  "proceduresPerformed": ["LE arteriogram", "SFA angioplasty", "SFA atherectomy"],
  "balloonAngioplasty": [{"vessel": "SFA", "size": "5x200mm"}],
  "atherectomy": [{"vessel": "SFA", "device": "Rotarex", "burrSize": "2.0mm"}],

  "aortoiliacFindings": "Aorta widely patent, iliacs widely patent bilateral",
  "targetLimbFindings": {
    "cfa": "widely patent",
    "profunda": "patent",
    "sfa": "70% stenosis - treated",
    "popliteal": "patent",
    "at": "patent",
    "pt": "occluded",
    "peroneal": "patent",
    "dp_pt": "DP patent"
  },

  "radiographicResult": "Good result with <30% residual stenosis",
  "residualStenosis": "<30%",
  "finalPulseGrade": "2+",
  "finalPulseLocation": "DP",
  "closureMethod": "Closure device was used successfully",
  "complications": "None",

  "fullNoteText": "PREOPERATIVE DIAGNOSIS:..."
}
```

**Response:**
```json
{
  "id": "uuid-of-new-note",
  "procedureId": "302f7b06-f380-456e-83c0-aa0114048492",
  "noteStatus": "generated",
  "createdAt": "2026-01-27T12:00:00Z",
  "message": "Operative note saved successfully"
}
```

#### GET /api/operative-notes/{procedureId}
Get operative note for a procedure.

**Response:**
```json
{
  "id": "uuid",
  "procedureId": "302f7b06-...",
  "mrn": "18890211",
  "noteStatus": "generated",
  "procedureDate": "2026-01-27",
  "procedureSide": "Left",
  "fullNoteText": "...",
  "fullNoteHtml": "...",
  "createdAt": "2026-01-27T12:00:00Z",
  "updatedAt": "2026-01-27T12:00:00Z"
}
```

#### PATCH /api/operative-notes/{noteId}
Update note status or review notes.

**Request Body:**
```json
{
  "noteStatus": "finalized",
  "signedBy": "Joe H. Morgan, M.D.",
  "isBillable": true,
  "reviewNotes": "Reviewed and approved"
}
```

---

### 2. ORCC Reports Endpoints

#### POST /api/orcc-reports/compile
Generate a compiled ORCC report from procedure + operative note data.

**Request Body:**
```json
{
  "procedureId": "302f7b06-f380-456e-83c0-aa0114048492",
  "reportType": "surgical_summary"
}
```

**Response:**
```json
{
  "reportId": "uuid-of-report",
  "reportStatus": "ready_for_review",
  "compiledReportHtml": "<div class='orcc-report'>...</div>",
  "cptCodes": ["37225", "37226"],
  "icd10Codes": ["I70.25"],
  "lcdCriteriaMet": true,
  "generatedAt": "2026-01-27T12:00:00Z"
}
```

#### GET /api/orcc-reports/{reportId}
Get a compiled report.

---

## Migration Steps for PlaudAI

### Step 1: Create Tables
Run the SQL CREATE TABLE statements above.

### Step 2: Create API Router
```python
# /api/routers/operative_notes.py

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from uuid import UUID
import json

router = APIRouter(prefix="/api/operative-notes", tags=["operative-notes"])

class OperativeNoteCreate(BaseModel):
    procedureId: UUID
    mrn: str
    noteType: str = "PAD"
    procedureDate: Optional[str]
    procedureSide: Optional[str]
    accessSite: Optional[str]
    sheathSize: Optional[str]
    preopDiagnosis: Optional[List[str]]
    proceduresPerformed: Optional[List[str]]
    balloonAngioplasty: Optional[List[dict]]
    atherectomy: Optional[List[dict]]
    aortoiliacFindings: Optional[str]
    targetLimbFindings: Optional[dict]
    radiographicResult: Optional[str]
    closureMethod: Optional[str]
    complications: Optional[str]
    fullNoteText: Optional[str]

@router.post("")
async def create_operative_note(note: OperativeNoteCreate, db = Depends(get_db)):
    # Implementation here
    pass

@router.get("/{procedure_id}")
async def get_operative_note(procedure_id: UUID, db = Depends(get_db)):
    # Implementation here
    pass
```

### Step 3: Register Router
```python
# main.py
from routers import operative_notes, orcc_reports

app.include_router(operative_notes.router)
app.include_router(orcc_reports.router)
```

---

## Frontend Integration (ORCC Side)

### New API Client Methods
```javascript
// js/api-client.js additions

// OPERATIVE NOTES
async saveOperativeNote(noteData) {
  return this.request('/api/operative-notes', {
    method: 'POST',
    body: JSON.stringify(noteData)
  });
},

async getOperativeNote(procedureId) {
  return this.request(`/api/operative-notes/${procedureId}`);
},

async updateOperativeNoteStatus(noteId, updates) {
  return this.request(`/api/operative-notes/${noteId}`, {
    method: 'PATCH',
    body: JSON.stringify(updates)
  });
},

// ORCC REPORTS
async compileORCCReport(procedureId, reportType = 'surgical_summary') {
  return this.request('/api/orcc-reports/compile', {
    method: 'POST',
    body: JSON.stringify({ procedureId, reportType })
  });
},

async getORCCReport(reportId) {
  return this.request(`/api/orcc-reports/${reportId}`);
}
```

---

## Data Flow After Implementation

```
1. User fills Op Note Builder form
        ↓
2. Clicks "Generate Operative Note"
        ↓
3. Note text generated in preview
        ↓
4. Clicks "Save Note to Database"
        ↓
5. POST /api/operative-notes
        ↓
6. Stored in operative_notes table ✅
        ↓
7. User clicks "Generate ORCC Report"
        ↓
8. POST /api/orcc-reports/compile
        ↓
9. Backend pulls procedure + op note data
        ↓
10. Compiles report with CPT/ICD codes
        ↓
11. Stored in orcc_reports table ✅
        ↓
12. User can view/download/submit report
```

---

## Contact

- **ORCC Frontend:** /Users/trippmorgan/SynologyDrive/ORCommandCenter
- **PlaudAI Backend:** http://100.75.237.36:8001
- **Claude Team Hub:** localhost:4847

---

*Document created: 2026-01-27*
*Author: ORCC Claude (Code) + Browser Claude*
