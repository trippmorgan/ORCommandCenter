# Patient Data Specification
## Real Patient Integration - Larry Taylor Case Study

**Purpose:** Define database schema based on real patient data flow
**For:** Claude Team & SCC Backend (Larry)

---

## Sample Patient: Larry Taylor

### Demographics & Identifiers

```json
{
  "patient_id": "32016089",
  "mrn": "32016089",
  "first_name": "Larry",
  "last_name": "Taylor",
  "dob": "1954-10-28",
  "age": 71,
  "sex": "M",
  "allergies": "NKDA"
}
```

### Problem List (Active Diagnoses)

```json
{
  "problems": [
    { "icd10": "I70.25", "description": "atherosclerosis of native arteries of extremities with ulceration" },
    { "icd10": "I70.209", "description": "atherosclerosis of native arteries of extremities" },
    { "icd10": "I70.92", "description": "chronic limb-threatening ischemia" },
    { "icd10": "E11.621", "description": "type 2 diabetes mellitus with foot ulcer" },
    { "icd10": "E11.622", "description": "type 2 diabetes mellitus with other skin ulcer" },
    { "icd10": "I10", "description": "hypertensive disorder" },
    { "icd10": "E11.69", "description": "type 2 diabetes mellitus with other specified complication" },
    { "icd10": "I65.22", "description": "occlusion and stenosis of left carotid artery" },
    { "icd10": "I70.212", "description": "atherosclerosis of native arteries of left leg" },
    { "icd10": "R20.2", "description": "paresthesia of skin" },
    { "icd10": "I73.9", "description": "peripheral vascular disease, unspecified" },
    { "icd10": "E11.9", "description": "type 2 diabetes mellitus without complications" },
    { "icd10": "L97.429", "description": "non-pressure chronic ulcer of left heel and midfoot" },
    { "icd10": "L97.529", "description": "non-pressure chronic ulcer of other part of left foot" }
  ]
}
```

### Medical History Flags

```json
{
  "medical_history": {
    "chf": true,
    "diabetes_type2": true,
    "heart_disease": true,
    "hypertension": true,
    "tobacco_history": "former_smoker",
    "alcohol_use": "occasional"
  }
}
```

### Current Medications

```json
{
  "medications": [
    { "name": "aspirin", "dose": "81mg", "frequency": "daily", "category": "antiplatelet" },
    { "name": "clopidogrel", "dose": null, "frequency": "daily", "category": "antiplatelet" },
    { "name": "ergocalciferol", "dose": null, "frequency": null, "category": "vitamin" },
    { "name": "Janumet XR", "dose": null, "frequency": null, "category": "diabetes" },
    { "name": "Jardiance", "dose": null, "frequency": null, "category": "diabetes" },
    { "name": "losartan", "dose": null, "frequency": null, "category": "antihypertensive" },
    { "name": "rosuvastatin", "dose": null, "frequency": null, "category": "statin" },
    { "name": "Santyl", "dose": null, "frequency": null, "category": "wound_care" }
  ]
}
```

### Surgical History (Vascular Relevant)

```json
{
  "surgical_history": [
    {
      "date": "2025-10-27",
      "procedure": "Debridement, foot",
      "cpt": null,
      "surgeon": null,
      "laterality": null
    },
    {
      "date": "2025-09-24",
      "procedure": "Peripheral arteriogram",
      "cpt": "36247",
      "surgeon": null,
      "laterality": null
    },
    {
      "date": "2025-09-09",
      "procedure": "Debridement, skin and subcutaneous tissue",
      "cpt": null,
      "surgeon": null,
      "laterality": null
    },
    {
      "date": "2025-06-27",
      "procedure": "Femoral-tibial bypass with vein",
      "cpt": "35566",
      "surgeon": "Joe Morgan",
      "laterality": "right",
      "details": "Right femoral to tibial vein with vein"
    },
    {
      "date": "2025-05-02",
      "procedure": "TCAR (Transcarotid Artery Revascularization)",
      "cpt": "37215",
      "surgeon": "Joe Morgan",
      "laterality": "left",
      "details": "Left carotid artery stent with embolic protection"
    },
    {
      "date": "2025-01-28",
      "procedure": "Peripheral arteriogram",
      "cpt": "36247",
      "surgeon": "Joe Morgan",
      "laterality": "bilateral",
      "details": "HD to pull, f/u bilateral arterial/ABI"
    }
  ]
}
```

---

## Current Case: Left Lower Extremity Intervention (01-20-2026)

### Case Header

```json
{
  "case_id": "CASE-2026-0120-001",
  "patient_id": "32016089",
  "dos": "2026-01-20",
  "location": "asc",
  "facility": "Albany Vascular Surgery Center",
  "surgeon": "Joe Harris Morgan III, MD",
  "case_type": "pad_endovascular",
  "laterality": "left",
  "status": "completed"
}
```

### Preoperative Diagnosis

```json
{
  "preop_diagnosis": [
    { "icd10": "I70.25", "description": "Peripheral arterial disease with wound" },
    { "icd10": "M86.672", "description": "Chronic osteomyelitis, left ankle and foot (2nd and 4th toes)" }
  ]
}
```

### Procedure Performed

```json
{
  "procedures": [
    {
      "cpt": "36247",
      "description": "Left lower extremity arteriogram",
      "laterality": "left"
    },
    {
      "cpt": "37224",
      "description": "Balloon angioplasty, popliteal artery",
      "laterality": "left",
      "vessel": "popliteal",
      "details": {
        "balloon_size": "6mm x 24cm",
        "segment": "second portion popliteal and proximal SFA"
      }
    },
    {
      "cpt": "37229",
      "description": "Atherectomy, popliteal artery",
      "laterality": "left",
      "vessel": "popliteal",
      "details": {
        "device": "2.0 atherectomy burr",
        "calcification_grade": "5+",
        "passes": "multiple",
        "power": "low and medium"
      }
    },
    {
      "cpt": "34713",
      "description": "Vascular closure device, right groin",
      "laterality": "right",
      "details": "Access site closure"
    }
  ]
}
```

### Intraoperative Findings (Anatomy)

```json
{
  "anatomy_findings": {
    "access": {
      "site": "right_cfa",
      "sheath": "6F, 45cm"
    },
    "aortoiliac": {
      "status": "not_documented"
    },
    "left_leg": {
      "sfa": {
        "status": "patent",
        "notes": "Proximal SFA included in balloon treatment"
      },
      "adductor_canal": {
        "status": "stenosis",
        "severity": ">80%",
        "calcification": "severe",
        "length": "<5cm"
      },
      "popliteal_p1": {
        "status": "stenosis",
        "severity": ">70%",
        "calcification": "heavy",
        "description": "rat-bite stenoses"
      },
      "popliteal_p2": {
        "status": "patent",
        "notes": "widely patent"
      },
      "popliteal_p3": {
        "status": "patent",
        "notes": "widely patent"
      },
      "anterior_tibial": {
        "status": "patent",
        "proximal": "open",
        "distal": "collateral reconstitution"
      },
      "posterior_tibial": {
        "status": "occluded",
        "location": "mid leg",
        "proximal": "open",
        "distal": "collateral reconstitution",
        "notes": "No dominant main branch"
      },
      "peroneal": {
        "status": "patent",
        "notes": "intertibial connection present"
      },
      "dorsalis_pedis": {
        "status": "reconstituted",
        "via": "collaterals near flexor retinaculum"
      }
    },
    "runoff": {
      "vessel_count": 2,
      "vessels": ["peroneal", "AT (via collaterals)"]
    }
  }
}
```

### Result

```json
{
  "result": {
    "residual_stenosis": "<30%",
    "outcome": "good",
    "outflow_improved": true,
    "perfusion_increased": true,
    "doppler_dp": "biphasic",
    "complications": "none"
  }
}
```

### Anesthesia

```json
{
  "anesthesia": {
    "type": "mac_local",
    "description": "Monitored anesthesia care (MAC) and local anesthesia"
  }
}
```

---

## Follow-Up Data

```json
{
  "follow_up": [
    {
      "date": "2026-01-27",
      "time": "14:30",
      "type": "established_patient",
      "provider": "Joe Harris Morgan III, MD",
      "location": "GA_AVSC_Albany Office",
      "reason": "1 week wound care"
    },
    {
      "date": "2026-02-26",
      "time": "08:00",
      "type": "ultrasound",
      "provider": "AVSC Ultrasound",
      "location": "GA_AVSC_Albany Office",
      "reason": "Bilateral ABI - S/P LLEA 1/20"
    },
    {
      "date": "2026-02-26",
      "time": "09:30",
      "type": "established_patient",
      "provider": "Joe Harris Morgan III, MD",
      "location": "GA_AVSC_Albany Office",
      "reason": "SDFU bilateral ABI - S/P 1 month LLEA 1/20"
    }
  ]
}
```

---

## Proposed Database Schema

Based on this real patient data, here's the refined schema:

### Core Tables

```sql
-- Patient demographics
CREATE TABLE patients (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mrn                 VARCHAR(20) UNIQUE NOT NULL,
    first_name          VARCHAR(100) NOT NULL,
    last_name           VARCHAR(100) NOT NULL,
    dob                 DATE NOT NULL,
    sex                 VARCHAR(1) CHECK (sex IN ('M', 'F', 'O')),
    allergies           TEXT,
    created_at          TIMESTAMP DEFAULT NOW(),
    updated_at          TIMESTAMP DEFAULT NOW()
);

-- Problem list / active diagnoses
CREATE TABLE patient_problems (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id          UUID REFERENCES patients(id) ON DELETE CASCADE,
    icd10_code          VARCHAR(10) NOT NULL,
    description         TEXT NOT NULL,
    laterality          VARCHAR(10), -- 'left', 'right', 'bilateral', NULL
    is_active           BOOLEAN DEFAULT TRUE,
    onset_date          DATE,
    resolved_date       DATE,
    created_at          TIMESTAMP DEFAULT NOW()
);

-- Medical history flags
CREATE TABLE patient_medical_history (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id          UUID REFERENCES patients(id) ON DELETE CASCADE UNIQUE,
    chf                 BOOLEAN DEFAULT FALSE,
    diabetes_type1      BOOLEAN DEFAULT FALSE,
    diabetes_type2      BOOLEAN DEFAULT FALSE,
    heart_disease       BOOLEAN DEFAULT FALSE,
    hypertension        BOOLEAN DEFAULT FALSE,
    cad                 BOOLEAN DEFAULT FALSE,
    ckd                 BOOLEAN DEFAULT FALSE,
    ckd_stage           INTEGER CHECK (ckd_stage BETWEEN 1 AND 5),
    copd                BOOLEAN DEFAULT FALSE,
    tobacco_status      VARCHAR(20), -- 'never', 'former', 'current'
    alcohol_use         VARCHAR(20), -- 'none', 'occasional', 'moderate', 'heavy'
    created_at          TIMESTAMP DEFAULT NOW(),
    updated_at          TIMESTAMP DEFAULT NOW()
);

-- Current medications
CREATE TABLE patient_medications (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id          UUID REFERENCES patients(id) ON DELETE CASCADE,
    medication_name     VARCHAR(200) NOT NULL,
    dose                VARCHAR(50),
    frequency           VARCHAR(50),
    category            VARCHAR(50), -- 'antiplatelet', 'statin', 'diabetes', etc.
    is_active           BOOLEAN DEFAULT TRUE,
    start_date          DATE,
    end_date            DATE,
    created_at          TIMESTAMP DEFAULT NOW()
);

-- Surgical history
CREATE TABLE surgical_history (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id          UUID REFERENCES patients(id) ON DELETE CASCADE,
    procedure_date      DATE NOT NULL,
    procedure_name      TEXT NOT NULL,
    cpt_code            VARCHAR(10),
    surgeon             VARCHAR(200),
    laterality          VARCHAR(10), -- 'left', 'right', 'bilateral'
    details             TEXT,
    created_at          TIMESTAMP DEFAULT NOW()
);
```

### Surgical Case Tables

```sql
-- Main surgical case record
CREATE TABLE surgical_cases (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id          UUID REFERENCES patients(id) ON DELETE CASCADE,
    case_number         VARCHAR(50) UNIQUE,
    dos                 DATE NOT NULL,
    location            VARCHAR(20) NOT NULL, -- 'hospital', 'asc'
    facility_name       VARCHAR(200),
    surgeon_id          UUID, -- REFERENCES users(id)
    surgeon_name        VARCHAR(200),
    case_type           VARCHAR(50) NOT NULL, -- 'pad_endovascular', 'pad_open', 'carotid', 'aortic', 'venous'
    laterality          VARCHAR(10), -- 'left', 'right', 'bilateral'
    status              VARCHAR(20) DEFAULT 'preop', -- 'preop', 'scheduled', 'in_progress', 'completed', 'cancelled'
    anesthesia_type     VARCHAR(50), -- 'mac_local', 'moderate', 'general', 'regional'
    created_at          TIMESTAMP DEFAULT NOW(),
    updated_at          TIMESTAMP DEFAULT NOW()
);

-- Preoperative diagnoses for a case
CREATE TABLE case_preop_diagnoses (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id             UUID REFERENCES surgical_cases(id) ON DELETE CASCADE,
    icd10_code          VARCHAR(10) NOT NULL,
    description         TEXT NOT NULL,
    is_primary          BOOLEAN DEFAULT FALSE,
    sequence            INTEGER DEFAULT 1
);

-- Postoperative diagnoses (usually same as preop, but can differ)
CREATE TABLE case_postop_diagnoses (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id             UUID REFERENCES surgical_cases(id) ON DELETE CASCADE,
    icd10_code          VARCHAR(10) NOT NULL,
    description         TEXT NOT NULL,
    is_primary          BOOLEAN DEFAULT FALSE,
    sequence            INTEGER DEFAULT 1
);

-- Procedures performed
CREATE TABLE case_procedures (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id             UUID REFERENCES surgical_cases(id) ON DELETE CASCADE,
    cpt_code            VARCHAR(10),
    description         TEXT NOT NULL,
    laterality          VARCHAR(10),
    vessel              VARCHAR(50), -- 'sfa', 'popliteal', 'at', 'pt', etc.
    technique           VARCHAR(50), -- 'pta', 'stent', 'atherectomy', 'bypass'
    details             JSONB, -- Flexible for balloon size, device type, etc.
    sequence            INTEGER DEFAULT 1
);

-- Access site information
CREATE TABLE case_access (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id             UUID REFERENCES surgical_cases(id) ON DELETE CASCADE,
    access_site         VARCHAR(50) NOT NULL, -- 'right_cfa', 'left_cfa', 'radial', 'brachial'
    sheath_size         VARCHAR(10), -- '6F', '7F', etc.
    sheath_length       VARCHAR(10), -- '45cm', '25cm', etc.
    closure_method      VARCHAR(50), -- 'closure_device', 'manual_pressure', 'suture'
    closure_device      VARCHAR(100) -- Specific device name if used
);
```

### Anatomy/Findings Tables

```sql
-- Vessel findings (one row per vessel per case)
CREATE TABLE case_vessel_findings (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id             UUID REFERENCES surgical_cases(id) ON DELETE CASCADE,
    vessel_code         VARCHAR(20) NOT NULL, -- 'l_sfa', 'r_popliteal_p1', etc.
    vessel_name         VARCHAR(100) NOT NULL, -- 'Left SFA', 'Right Popliteal P1'
    status              VARCHAR(20) NOT NULL, -- 'patent', 'stenosis', 'occluded'
    stenosis_severity   VARCHAR(20), -- '<50%', '50-70%', '70-80%', '>80%', 'CTO'
    calcification       VARCHAR(20), -- 'none', 'mild', 'moderate', 'severe', '5+'
    segment_length      VARCHAR(20), -- '<5cm', '5-10cm', '>10cm'
    notes               TEXT,
    UNIQUE(case_id, vessel_code)
);

-- Runoff summary
CREATE TABLE case_runoff (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id             UUID REFERENCES surgical_cases(id) ON DELETE CASCADE,
    laterality          VARCHAR(10) NOT NULL,
    vessel_count        INTEGER, -- 0, 1, 2, 3
    at_status           VARCHAR(20), -- 'patent', 'occluded', 'reconstitutes'
    pt_status           VARCHAR(20),
    peroneal_status     VARCHAR(20),
    dp_status           VARCHAR(20), -- dorsalis pedis
    notes               TEXT
);

-- Intervention details
CREATE TABLE case_interventions (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id             UUID REFERENCES surgical_cases(id) ON DELETE CASCADE,
    vessel_code         VARCHAR(20) NOT NULL,
    intervention_type   VARCHAR(50) NOT NULL, -- 'pta', 'stent', 'atherectomy', 'thrombectomy'
    device_name         VARCHAR(200),
    device_size         VARCHAR(50), -- '6mm x 24cm', '2.0 burr'
    inflation_pressure  VARCHAR(20), -- For balloons
    passes              INTEGER, -- For atherectomy
    power_setting       VARCHAR(20), -- 'low', 'medium', 'high'
    pre_stenosis        VARCHAR(20), -- Stenosis before intervention
    post_stenosis       VARCHAR(20), -- Residual stenosis
    success             BOOLEAN DEFAULT TRUE,
    notes               TEXT,
    sequence            INTEGER DEFAULT 1
);
```

### Results & Follow-up

```sql
-- Case result/outcome
CREATE TABLE case_results (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id             UUID REFERENCES surgical_cases(id) ON DELETE CASCADE UNIQUE,
    technical_success   BOOLEAN,
    residual_stenosis   VARCHAR(20), -- '<30%', '30-50%', etc.
    outcome_grade       VARCHAR(20), -- 'excellent', 'good', 'fair', 'poor'
    outflow_improved    BOOLEAN,
    perfusion_increased BOOLEAN,
    doppler_signal      VARCHAR(50), -- 'biphasic', 'triphasic', 'monophasic', 'absent'
    doppler_vessel      VARCHAR(20), -- Which vessel was assessed
    complications       TEXT,
    ebl                 INTEGER, -- Estimated blood loss in mL
    contrast_volume     INTEGER, -- mL
    fluoro_time         INTEGER, -- minutes
    notes               TEXT
);

-- Follow-up appointments
CREATE TABLE follow_up_appointments (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id          UUID REFERENCES patients(id) ON DELETE CASCADE,
    case_id             UUID REFERENCES surgical_cases(id) ON DELETE SET NULL,
    appointment_date    DATE NOT NULL,
    appointment_time    TIME,
    appointment_type    VARCHAR(50), -- 'established_patient', 'ultrasound', 'wound_care'
    provider_name       VARCHAR(200),
    location            VARCHAR(200),
    reason              TEXT,
    status              VARCHAR(20) DEFAULT 'scheduled', -- 'scheduled', 'completed', 'cancelled', 'no_show'
    notes               TEXT,
    created_at          TIMESTAMP DEFAULT NOW()
);
```

### Operative Note Generation

```sql
-- Operative note template data
CREATE TABLE operative_notes (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id             UUID REFERENCES surgical_cases(id) ON DELETE CASCADE UNIQUE,

    -- Structured sections (JSONB for flexibility)
    preop_diagnosis     JSONB,
    postop_diagnosis    JSONB,
    procedures          JSONB,
    findings            JSONB,
    technique           TEXT, -- Free text surgical technique narrative

    -- Generated content
    generated_text      TEXT, -- Full formatted note

    -- Metadata
    status              VARCHAR(20) DEFAULT 'draft', -- 'draft', 'final', 'signed', 'amended'
    signed_at           TIMESTAMP,
    signed_by           VARCHAR(200),
    created_at          TIMESTAMP DEFAULT NOW(),
    updated_at          TIMESTAMP DEFAULT NOW()
);
```

---

## Vessel Code Reference

Standard vessel codes for `case_vessel_findings.vessel_code`:

```
AORTOILIAC
----------
aorta, l_cia, r_cia, l_eia, r_eia, l_iia, r_iia

FEMORAL
-------
l_cfa, r_cfa, l_profunda, r_profunda, l_sfa, r_sfa

POPLITEAL (3 segments)
----------------------
l_popliteal_p1, r_popliteal_p1  (above knee)
l_popliteal_p2, r_popliteal_p2  (at knee)
l_popliteal_p3, r_popliteal_p3  (below knee)
l_adductor, r_adductor          (adductor canal = distal SFA)

TIBIAL
------
l_at, r_at          (anterior tibial)
l_pt, r_pt          (posterior tibial)
l_peroneal, r_peroneal
l_tpt, r_tpt        (tibioperoneal trunk)

FOOT
----
l_dp, r_dp          (dorsalis pedis)
l_plantar, r_plantar
```

---

## Next Steps

1. **SCC Team (Larry):** Review this schema and confirm compatibility with existing backend
2. **Create API endpoints** for patient retrieval and case creation
3. **Wire up ORCC Patient Lists** to pull from database instead of hardcoded data
4. **Test with Larry Taylor** as first real patient through the system

---

*Document created: January 2026*
*Patient: Larry Taylor (MRN: 32016089) - Used as schema validation case*
