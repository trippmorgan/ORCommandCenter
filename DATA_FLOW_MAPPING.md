# ORCC Data Flow Mapping
## Technical Documentation for Claude Team

**Project:** OR Command Center (ORCC)
**Version:** 0.1.0
**Status:** UI Prototype - Ready for Backend Integration
**Date:** January 2026

---

## Executive Summary

ORCC is a surgical intelligence and planning suite for vascular surgery. Currently implemented as a **static HTML/CSS/JS prototype** (~13,000 lines across 11 HTML files), using `localStorage` for client-side state management. This document maps the complete data flow to prepare for backend integration.

---

## 1. Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        CURRENT ARCHITECTURE                              │
│                     (UI Prototype - No Backend)                          │
└─────────────────────────────────────────────────────────────────────────┘

    ┌───────────────────────────────────────────────────────────────┐
    │                      BROWSER LAYER                             │
    │  ┌─────────────────────────────────────────────────────────┐  │
    │  │              11 Self-Contained HTML Files               │  │
    │  │  (Embedded CSS + Vanilla JavaScript, No Framework)      │  │
    │  └─────────────────────────────────────────────────────────┘  │
    │                              │                                 │
    │                              ▼                                 │
    │  ┌─────────────────────────────────────────────────────────┐  │
    │  │                   localStorage                           │  │
    │  │  ┌─────────────────┐  ┌─────────────────┐              │  │
    │  │  │ selectedPatient │  │  planningData   │              │  │
    │  │  └─────────────────┘  └─────────────────┘              │  │
    │  │  ┌─────────────────┐                                   │  │
    │  │  │  orcc_patients  │                                   │  │
    │  │  └─────────────────┘                                   │  │
    │  └─────────────────────────────────────────────────────────┘  │
    └───────────────────────────────────────────────────────────────┘
                                 │
                                 │ (FUTURE)
                                 ▼
    ┌───────────────────────────────────────────────────────────────┐
    │                      API LAYER (Future)                        │
    │              RESTful Endpoints + Authentication                │
    └───────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
    ┌───────────────────────────────────────────────────────────────┐
    │                   DATABASE LAYER (Future)                      │
    │                        PostgreSQL                              │
    └───────────────────────────────────────────────────────────────┘
```

---

## 2. File Structure & Responsibilities

| File | Lines | Purpose | Data Operations |
|------|-------|---------|-----------------|
| `ORCC-index.html` | 190 | Navigation Hub | None (links only) |
| `ORCC-settings.html` | 545 | Settings & Analytics | Read/Write user preferences |
| `surgical-command-center-page1.html` | 1,839 | Patient Lists Dashboard | Read hardcoded patients, Write selectedPatient |
| `surgical-command-center-v2.html` | 1,248 | Patient Lists (v2) | Same as page1 |
| `surgical-command-center-tasks.html` | 2,477 | Pre-Op Task Manager | Read patient tasks (hardcoded) |
| `surgical-command-center-workspace.html` | 2,653 | PAD/LE Workspace | Read selectedPatient + planningData |
| `surgical-command-center-workspace-vqi.html` | 1,216 | Workspace + VQI | Read patient data, VQI form entry |
| `planning-endovascular.html` | 1,280 | Endovascular Planning | Read/Write planningData |
| `workspace-carotid.html` | 592 | Carotid Workspace | Read selectedPatient |
| `workspace-aortic-aneurysm.html` | 438 | Aortic Workspace | Read selectedPatient |
| `workspace-venous.html` | 604 | Venous Workspace | Read selectedPatient |

---

## 3. Data Structures

### 3.1 `selectedPatient` (localStorage key)

Stores the currently active patient context when navigating between pages.

```javascript
selectedPatient = {
  // Identifiers
  id: "p1",                           // Internal ID (string)
  mrn: "MRN-001234",                  // Medical Record Number

  // Demographics
  name: "Smith, John",                // Last, First format

  // Case Information
  dos: "01/15/2026",                  // Date of Surgery (MM/DD/YYYY)
  procedure: "RIGHT SFA Angioplasty + Stent",  // Planned procedure text
  diagnosis: "I70.25 - CLI with Tissue Loss",   // Primary diagnosis + ICD code
  anatomy: "SFA Occlusion, 2-vessel runoff",    // Anatomy summary

  // Status Flags
  ready: true,                        // Boolean: ready for surgery
  location: "asc" | "hospital"        // Facility type
}
```

### 3.2 `planningData` (localStorage key)

Stores endovascular case planning details including vessel statuses and planned interventions.

```javascript
planningData = {
  // Procedure Metadata
  procDate: "2026-01-20",             // ISO date string

  // Vessel Status Map (bilateral lower extremity arterial tree)
  vesselData: {
    // Right side vessels
    "r_cia": { status: "patent" | "stenosis" | "occluded", notes: "" },
    "r_eia": { status: "patent", notes: "" },
    "r_cfa": { status: "patent", notes: "" },
    "r_profunda": { status: "patent", notes: "" },
    "r_sfa": { status: "occluded", notes: "Chronic total occlusion" },
    "r_popliteal": { status: "patent", notes: "" },
    "r_at": { status: "patent", notes: "" },      // Anterior Tibial
    "r_pt": { status: "occluded", notes: "" },    // Posterior Tibial
    "r_peroneal": { status: "patent", notes: "" },

    // Left side vessels (same structure)
    "l_cia": { status: "patent", notes: "" },
    "l_eia": { status: "patent", notes: "" },
    // ... etc
  },

  // Procedure Parameters
  procedure: {
    side: "right" | "left" | "bilateral",
    rutherford: "r1" | "r2" | "r3" | "r4" | "r5" | "r6",  // Classification
    accessSite: "l_cfa" | "r_cfa" | "radial" | "brachial",
    anesthesia: "mac_local" | "moderate" | "general",
    outflow: {
      at: "patent" | "stenosis" | "occluded",
      pt: "patent" | "stenosis" | "occluded",
      peroneal: "patent" | "stenosis" | "occluded"
    }
  },

  // Planned Interventions (array)
  interventions: [
    {
      vessel: "SFA",                // Target vessel name
      intervention: "pta_stent"     // pta | pta_stent | atherectomy | stent
    },
    {
      vessel: "Popliteal",
      intervention: "pta"
    }
  ]
}
```

### 3.3 `orcc_patients` (localStorage key)

Stores patients added via the "Add Patient" modal.

```javascript
orcc_patients = [
  {
    id: "new_001",
    mrn: "MRN-999999",
    name: "New, Patient",
    dos: "01/25/2026",
    procedure: "Procedure text",
    diagnosis: "ICD code - Description",
    anatomy: "",
    ready: false,
    location: "asc"
  },
  // ... more patients
]
```

---

## 4. Page-to-Page Navigation Flow

### 4.1 Complete Navigation Map

```
                              ORCC-index.html
                                   (Hub)
                                     │
         ┌───────────────┬───────────┼───────────┬───────────────┐
         │               │           │           │               │
         ▼               ▼           ▼           ▼               ▼
   Patient Lists      Tasks     Workspace    Settings         VQI
    (page1.html)   (tasks.html) (direct)  (settings.html) (workspace-vqi)
         │
         │ Click patient row
         ▼
   ┌─────────────────────────────────────────────────────────────────┐
   │              EXPANDED PATIENT CARD                               │
   │                                                                  │
   │   [View Details]    [Edit Planning]    [Open in Workspace]      │
   │         │                  │                    │                │
   │    (future)           (routes by            (routes by          │
   │                       procedure)            procedure)          │
   └─────────────────────────────────────────────────────────────────┘
                                │
          ┌─────────────────────┼─────────────────────┐
          │                     │                     │
    PAD/Endovascular       Carotid/TCAR          Aortic/AAA
          │                     │                     │
          ▼                     ▼                     ▼
  planning-endovascular   workspace-carotid   workspace-aortic
          │                     │                     │
          │ Save & Open         │                     │
          ▼                     ▼                     ▼
  surgical-command-        (self-contained      (self-contained
  center-workspace.html     workflow)            workflow)
```

### 4.2 Routing Logic (JavaScript)

```javascript
// Procedure-based routing from Patient Lists
function routeToWorkspace(patient) {
  const proc = patient.procedure.toLowerCase();

  if (proc.includes('carotid') || proc.includes('tcar') || proc.includes('cea')) {
    return 'workspace-carotid.html';
  }
  else if (proc.includes('aaa') || proc.includes('evar') || proc.includes('aneurysm')) {
    return 'workspace-aortic-aneurysm.html';
  }
  else if (proc.includes('vein') || proc.includes('venaseal') || proc.includes('ablation')) {
    return 'workspace-venous.html';
  }
  else {
    // Default: PAD/Lower Extremity
    return 'surgical-command-center-workspace.html';
  }
}

function routeToPlanning(patient) {
  const proc = patient.procedure.toLowerCase();

  if (proc.includes('carotid') || proc.includes('tcar')) {
    return 'workspace-carotid.html';  // Planning integrated
  }
  else if (proc.includes('aaa') || proc.includes('evar')) {
    return 'workspace-aortic-aneurysm.html';  // Planning integrated
  }
  else {
    return 'planning-endovascular.html';  // Separate planning page
  }
}
```

---

## 5. User Workflow Data Flow

### 5.1 Primary Workflow: Case Planning to Op Note

```
STEP 1: Select Patient
────────────────────────────────────────────────────────────────────────
Page:     surgical-command-center-page1.html
Action:   User clicks patient row
Data Op:  localStorage.setItem('selectedPatient', JSON.stringify({
            id, name, mrn, dos, procedure, diagnosis, anatomy, ready, location
          }))
────────────────────────────────────────────────────────────────────────

STEP 2: Plan Procedure (for PAD cases)
────────────────────────────────────────────────────────────────────────
Page:     planning-endovascular.html
Reads:    localStorage.getItem('selectedPatient')
Actions:  - User clicks vessels on SVG diagram → modal opens
          - User selects status (Patent/Stenosis/Occluded)
          - User adds interventions to plan
          - User sets procedure parameters (side, Rutherford, access, etc.)
Data Op:  localStorage.setItem('planningData', JSON.stringify({
            procDate, vesselData, procedure, interventions
          }))
────────────────────────────────────────────────────────────────────────

STEP 3: Workspace Documentation
────────────────────────────────────────────────────────────────────────
Page:     surgical-command-center-workspace.html
Reads:    - localStorage.getItem('selectedPatient')
          - localStorage.getItem('planningData')
Actions:  - Anatomy diagram auto-populates from planningData
          - User uses Op Note Builder (checkboxes, dropdowns)
          - User generates formatted operative note
Output:   Complete operative note (copy to clipboard for EHR)
────────────────────────────────────────────────────────────────────────
```

### 5.2 Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      COMPLETE DATA FLOW                                  │
└─────────────────────────────────────────────────────────────────────────┘

                    ┌─────────────────────┐
                    │   HARDCODED DATA    │
                    │   (in HTML files)   │
                    │   ~10 test patients │
                    └──────────┬──────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                         Patient Lists Page                                │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │ Pre-Op Queue Tab │ Today's OR Tab │ Unsigned Notes Tab              │  │
│  └────────────────────────────────────────────────────────────────────┘  │
│                               │                                          │
│                   User clicks patient row                                │
│                               │                                          │
│                               ▼                                          │
│                    ┌─────────────────────┐                               │
│                    │  EXPANDED CARD      │                               │
│                    │  Shows: name, MRN,  │                               │
│                    │  DOS, procedure,    │                               │
│                    │  diagnosis, anatomy │                               │
│                    └─────────┬───────────┘                               │
│                              │                                           │
│              ┌───────────────┴───────────────┐                          │
│              │                               │                          │
│       [Edit Planning]              [Open in Workspace]                  │
│              │                               │                          │
└──────────────┼───────────────────────────────┼──────────────────────────┘
               │                               │
               │                               │
               ▼                               │
┌──────────────────────────────┐               │
│  localStorage.setItem(       │               │
│    'selectedPatient',        │◄──────────────┘
│    { patient data }          │
│  )                           │
└──────────────┬───────────────┘
               │
    ┌──────────┴──────────┐
    │                     │
    ▼                     ▼
┌────────────────┐  ┌────────────────────────┐
│  PLANNING      │  │      WORKSPACE          │
│  (endovascular)│  │  (PAD/Carotid/Aortic/  │
│                │  │   Venous)               │
│  Reads:        │  │                         │
│  selectedPat.  │  │  Reads:                 │
│                │  │  - selectedPatient      │
│  Writes:       │  │  - planningData         │
│  planningData  │  │                         │
│                │  │  Generates:             │
│  ┌──────────┐  │  │  - Operative Note       │
│  │ SVG      │  │  │  - Documentation        │
│  │ Anatomy  │  │  │                         │
│  │ Diagram  │  │  │  ┌───────────────────┐  │
│  └──────────┘  │  │  │  Op Note Builder  │  │
│                │  │  │  - Checkboxes     │  │
│  [Save & Open  │  │  │  - Dropdowns      │  │
│   Workspace]───┼──┼─►│  - Generate Note  │  │
│                │  │  └───────────────────┘  │
└────────────────┘  └────────────────────────┘
```

---

## 6. Future API Integration Points

### 6.1 Required REST Endpoints

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     API ENDPOINTS (Future)                               │
└─────────────────────────────────────────────────────────────────────────┘

PATIENTS
────────────────────────────────────────────────────────────────────────────
GET    /api/patients                    List all patients (paginated)
GET    /api/patients/:id                Get patient by ID
POST   /api/patients                    Create new patient
PUT    /api/patients/:id                Update patient
DELETE /api/patients/:id                Delete patient
GET    /api/patients/:id/cases          Get all cases for patient

SURGICAL CASES
────────────────────────────────────────────────────────────────────────────
GET    /api/cases                       List cases (filterable by status, date)
GET    /api/cases/:id                   Get case details
POST   /api/cases                       Create new case
PUT    /api/cases/:id                   Update case
PUT    /api/cases/:id/status            Update case status only
DELETE /api/cases/:id                   Delete case

TASKS
────────────────────────────────────────────────────────────────────────────
GET    /api/tasks                       List tasks (filterable)
GET    /api/tasks/patient/:patientId    Get tasks for patient
GET    /api/tasks/case/:caseId          Get tasks for case
POST   /api/tasks                       Create task
PUT    /api/tasks/:id                   Update task
PUT    /api/tasks/:id/complete          Mark task complete
DELETE /api/tasks/:id                   Delete task

PLANNING
────────────────────────────────────────────────────────────────────────────
GET    /api/planning/:caseId            Get planning data for case
POST   /api/planning/:caseId            Save planning data
PUT    /api/planning/:caseId            Update planning data

VQI REGISTRY
────────────────────────────────────────────────────────────────────────────
GET    /api/vqi/:caseId                 Get VQI form data
POST   /api/vqi/:caseId                 Create VQI submission
PUT    /api/vqi/:caseId                 Update VQI data
POST   /api/vqi/:caseId/submit          Submit to VQI registry

PROCESSING (NLP Service)
────────────────────────────────────────────────────────────────────────────
POST   /api/process/imaging             Process CTA/imaging report text
POST   /api/process/extract-anatomy     Extract vessel findings from text
POST   /api/process/generate-note       Generate op note from structured data

AUTHENTICATION
────────────────────────────────────────────────────────────────────────────
POST   /api/auth/login                  User login
POST   /api/auth/logout                 User logout
GET    /api/auth/me                     Get current user
POST   /api/auth/refresh                Refresh token
```

### 6.2 Database Schema (Conceptual)

```sql
-- Core Tables
────────────────────────────────────────────────────────────────────────────

CREATE TABLE patients (
  id              UUID PRIMARY KEY,
  mrn             VARCHAR(50) UNIQUE NOT NULL,
  first_name      VARCHAR(100) NOT NULL,
  last_name       VARCHAR(100) NOT NULL,
  dob             DATE,
  diagnosis_codes TEXT[],           -- Array of ICD codes
  created_at      TIMESTAMP DEFAULT NOW(),
  updated_at      TIMESTAMP DEFAULT NOW()
);

CREATE TABLE surgical_cases (
  id              UUID PRIMARY KEY,
  patient_id      UUID REFERENCES patients(id),
  procedure_type  VARCHAR(50),      -- 'pad', 'carotid', 'aortic', 'venous'
  procedure_name  TEXT,             -- Full procedure description
  dos             DATE,             -- Date of surgery
  location        VARCHAR(20),      -- 'hospital' or 'asc'
  status          VARCHAR(20),      -- 'preop', 'scheduled', 'completed', 'unsigned'
  anatomy_summary TEXT,
  lcd_status      VARCHAR(20),      -- 'met', 'pending', 'not_met'
  created_at      TIMESTAMP DEFAULT NOW(),
  updated_at      TIMESTAMP DEFAULT NOW()
);

CREATE TABLE case_planning (
  id              UUID PRIMARY KEY,
  case_id         UUID REFERENCES surgical_cases(id) UNIQUE,
  vessel_data     JSONB,            -- Full vessel status map
  procedure_data  JSONB,            -- side, rutherford, access, anesthesia
  interventions   JSONB,            -- Array of planned interventions
  created_at      TIMESTAMP DEFAULT NOW(),
  updated_at      TIMESTAMP DEFAULT NOW()
);

CREATE TABLE tasks (
  id              UUID PRIMARY KEY,
  patient_id      UUID REFERENCES patients(id),
  case_id         UUID REFERENCES surgical_cases(id),
  title           VARCHAR(200) NOT NULL,
  description     TEXT,
  task_type       VARCHAR(20),      -- 'call', 'schedule', 'order', 'review'
  due_date        DATE,
  status          VARCHAR(20),      -- 'pending', 'completed'
  urgency         VARCHAR(20),      -- 'normal', 'urgent'
  completed_at    TIMESTAMP,
  created_at      TIMESTAMP DEFAULT NOW()
);

CREATE TABLE operative_notes (
  id              UUID PRIMARY KEY,
  case_id         UUID REFERENCES surgical_cases(id),
  note_data       JSONB,            -- Structured note data
  generated_text  TEXT,             -- Full formatted note
  signed_at       TIMESTAMP,
  signed_by       UUID,             -- User ID
  created_at      TIMESTAMP DEFAULT NOW()
);

CREATE TABLE vqi_submissions (
  id              UUID PRIMARY KEY,
  case_id         UUID REFERENCES surgical_cases(id),
  form_type       VARCHAR(50),      -- 'infrainguinal', 'carotid', 'aaa'
  form_data       JSONB,            -- VQI form fields
  status          VARCHAR(20),      -- 'draft', 'submitted'
  submitted_at    TIMESTAMP,
  created_at      TIMESTAMP DEFAULT NOW()
);

CREATE TABLE users (
  id              UUID PRIMARY KEY,
  email           VARCHAR(255) UNIQUE NOT NULL,
  password_hash   VARCHAR(255) NOT NULL,
  name            VARCHAR(200),
  role            VARCHAR(50),      -- 'surgeon', 'nurse', 'admin'
  created_at      TIMESTAMP DEFAULT NOW()
);
```

---

## 7. State Transition Diagrams

### 7.1 Patient Case Status

```
                    ┌─────────────┐
                    │   CREATED   │
                    └──────┬──────┘
                           │
                           ▼
                    ┌─────────────┐
                    │   PRE-OP    │◄────── Tasks assigned
                    └──────┬──────┘        LCD validation
                           │
                           │ All tasks complete
                           │ LCD criteria met
                           ▼
                    ┌─────────────┐
                    │  SCHEDULED  │◄────── Date assigned
                    └──────┬──────┘        OR confirmed
                           │
                           │ Surgery performed
                           ▼
                    ┌─────────────┐
                    │  COMPLETED  │◄────── Op complete
                    └──────┬──────┘        Awaiting note
                           │
                           │ Note signed
                           ▼
                    ┌─────────────┐
                    │   SIGNED    │◄────── Documentation complete
                    └─────────────┘        VQI submitted
```

### 7.2 Task Lifecycle

```
     ┌──────────────┐
     │   CREATED    │
     └──────┬───────┘
            │
            ▼
     ┌──────────────┐      Assigned to case/patient
     │   PENDING    │◄───── Due date set
     └──────┬───────┘       Urgency assigned
            │
            │ User marks complete
            ▼
     ┌──────────────┐
     │  COMPLETED   │
     └──────────────┘
```

---

## 8. Integration Checklist

### Phase 2 Backend Integration Tasks

- [ ] **API Development**
  - [ ] Set up Express/Fastify/Next.js API routes
  - [ ] Implement patient CRUD endpoints
  - [ ] Implement case management endpoints
  - [ ] Implement task management endpoints
  - [ ] Implement planning data endpoints
  - [ ] Add authentication middleware (JWT)

- [ ] **Database Setup**
  - [ ] Create PostgreSQL schema
  - [ ] Set up migrations (Prisma/Knex/TypeORM)
  - [ ] Seed initial test data
  - [ ] Configure connection pooling

- [ ] **Frontend Modifications**
  - [ ] Replace localStorage with API calls
  - [ ] Add authentication flow (login/logout)
  - [ ] Add loading states and error handling
  - [ ] Implement real-time updates (WebSocket/polling)

- [ ] **Data Migration**
  - [ ] Export hardcoded patient data to database
  - [ ] Validate data integrity

### Phase 3 Intelligence Features

- [ ] **NLP Service**
  - [ ] CTA report parsing endpoint
  - [ ] Vessel finding extraction
  - [ ] Anatomy auto-population

- [ ] **Clinical Decision Support**
  - [ ] LCD criteria validation
  - [ ] CPT code suggestions
  - [ ] Medical necessity checking

---

## 9. Technology Stack Recommendation

### Recommended: Next.js + PostgreSQL

```
Frontend:        Next.js 14+ (React Server Components)
API:             Next.js API Routes
Database:        PostgreSQL 14+
ORM:             Prisma
Auth:            NextAuth.js / Auth.js
State:           React Context + TanStack Query
Styling:         Tailwind CSS (matches current design)
Deployment:      Vercel / AWS / Self-hosted
```

### Alternative: Separate Frontend/Backend

```
Frontend:        React + Vite
API:             Express.js / Fastify
Database:        PostgreSQL 14+
ORM:             Prisma / Drizzle
Auth:            Passport.js + JWT
State:           Redux Toolkit / Zustand
Deployment:      Docker containers
```

---

## Contact

**Project:** OR Command Center (ORCC)
**Repository:** `/home/tripp/ORCommandCenter`
**Attending:** Joe H. Morgan, M.D.

---

*Document prepared January 2026 for backend integration planning.*
