# OR Command Center (ORCC) - Project Context

## Overview

ORCC is a surgical intelligence and planning suite for vascular surgery. **As of January 25, 2026, ORCC is fully integrated with the PlaudAI PostgreSQL backend** at `http://100.75.237.36:8001`. All patient data, procedures, and planning information persist to the database.

**Integration Status:** ✅ COMPLETE

---

## Two Distinct Workflows

Cases are performed at **two different locations** with different workflows, pre-op requirements, and scheduling systems:

### 1. Hospital OR (Piedmont Athens Regional / CRH)
Major surgical cases requiring hospital-level resources:

| Procedure Type | Examples |
|---------------|----------|
| **Carotid** | TCAR, Carotid Endarterectomy (CEA) |
| **Aortic** | EVAR, Open AAA Repair |
| **Open PAD** | Fem-Pop Bypass, Fem-Distal Bypass, Femoral Endarterectomy |

**Workflow Characteristics:**
- More extensive pre-op workup (cardiac clearance, stress tests)
- Hospital scheduling system
- Longer cases, potential ICU stays
- Full VQI data capture required
- Coordination with anesthesia, OR staff

### 2. Albany Vascular Surgery Center (ASC)
Office-based / ambulatory surgery center cases:

| Procedure Type | Examples |
|---------------|----------|
| **Endovascular PAD** | Angioplasty/Stent for Claudication, Angioplasty/Stent for CLI |
| **Venous** | Varicose Vein Ablation (VenaSeal, RFA, Laser) |

**Workflow Characteristics:**
- Streamlined pre-op (often less cardiac workup needed)
- ASC scheduling system
- Same-day discharge
- Different documentation requirements
- May have different insurance/prior auth workflows

### Implications for ORCC Design

1. **Location-aware scheduling** - Cases route to appropriate facility
2. **Different task templates** - Hospital OR needs more pre-op tasks
3. **Separate queues** - "Hospital OR Queue" vs "ASC Queue" views
4. **Workflow branching** - Pre-op requirements differ by location
5. **VQI handling** - May differ between locations

---

## Current State (v0.2.0 - Integrated)

### Technology Stack
- Pure HTML5 with embedded CSS and JavaScript
- No framework (vanilla JavaScript)
- `js/api-client.js` - ORCC_API for PlaudAI backend connectivity
- **Backend:** PlaudAI FastAPI at http://100.75.237.36:8001
- **Database:** PostgreSQL with JSONB columns for planning data
- Patient context passed between pages via localStorage (MRN used to fetch from API)

### File Structure

```
/ORCommandCenter/
├── ORCC-index.html                         # Navigation hub/launchpad
├── ORCC-settings.html                      # Settings & Analytics
├── surgical-command-center-page1.html      # Patient Lists (original)
├── surgical-command-center-v2.html         # Patient Lists (v2 design)
├── surgical-command-center-tasks.html      # Pre-Op Task Manager
├── surgical-command-center-workspace.html  # PAD/LE Workspace
├── surgical-command-center-workspace-vqi.html # Workspace + VQI Panel
├── workspace-carotid.html                  # Carotid/TCAR Workspace
├── workspace-aortic-aneurysm.html          # AAA/EVAR Workspace
├── workspace-venous.html                   # Venous Disease Workspace
├── planning-endovascular.html              # Endovascular Planning Page
├── test-api.html                           # API connectivity test page
├── js/api-client.js                        # PlaudAI API client
└── context.md                              # This file
```

### Pages & Purpose

| Page | Purpose | Key Features |
|------|---------|--------------|
| **ORCC-index.html** | Navigation hub | Card-based links to all modules |
| **Patient Lists** | Dashboard | Pre-op queue, Today's OR, Unsigned tabs |
| **Tasks** | Pre-op tracking | Task cards by patient, filter buttons, urgency indicators |
| **Workspace (PAD)** | LE planning | 3-panel: Input → Anatomy Diagram → Structured Output |
| **Workspace (Carotid)** | TCAR/CEA planning | Stenosis mapping, high-risk criteria |
| **Workspace (Aortic)** | AAA/EVAR planning | Neck measurements, EVAR feasibility |
| **Workspace (Venous)** | Ablation planning | CEAP classification, reflux mapping |
| **Settings** | Admin/Analytics | User profile, LCD config, VQI settings, volume metrics |

### Current Data Flow

```
┌─────────────────────────────────────────────────────────┐
│  Hardcoded Patient Data (in each HTML file)             │
│  └─ 10 patient records with static procedures/anatomy   │
├─────────────────────────────────────────────────────────┤
│  User Interaction Flow:                                  │
│  1. Patient List → Click row → Expanded card appears    │
│  2. Click "Open in Workspace" → localStorage stores pt  │
│  3. Workspace loads → Reads pt from localStorage        │
│  4. All changes lost on page refresh                    │
└─────────────────────────────────────────────────────────┘
```

### Button Routing Logic (Current)

```javascript
// From Patient Lists → Workspace routing based on procedure type
if (procedure.includes('carotid') || procedure.includes('tcar') || procedure.includes('cea')) {
  → workspace-carotid.html
} else if (procedure.includes('aaa') || procedure.includes('evar') || procedure.includes('aneurysm')) {
  → workspace-aortic-aneurysm.html
} else if (procedure.includes('vein') || procedure.includes('venaseal') || procedure.includes('ablation')) {
  → workspace-venous.html
} else {
  → surgical-command-center-workspace.html (PAD default)
}
```

---

## Current Architecture (2026-01-21)

### Backend: PlaudAI (100.75.237.36:8001)

ORCC connects to **PlaudAI** on Server1 as the unified backend. The separate SCC Node server (port 3001) is being retired.

```
ORCC Frontend                PlaudAI Backend              PostgreSQL
─────────────                ───────────────              ──────────
js/api-client.js   ──────►   100.75.237.36:8001  ──────►  :5432
                             Python/FastAPI               surgical_command_center
                             Gemini 2.0 Flash
```

**Available API Endpoints:**
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/patients` | GET | List patients |
| `/api/patients/{mrn}` | GET | Get patient by MRN |
| `/api/patients` | POST | Create patient |
| `/api/procedures` | GET | List procedures |
| `/api/procedures/{id}` | GET | Get procedure |
| `/api/procedures` | POST | Create procedure with full planning data |
| `/api/procedures/{id}` | PATCH | Update procedure |
| `/api/planning/{mrn}` | GET | Get planning data for workspace |
| `/api/parse` | POST | AI parsing |
| `/api/synopsis` | POST | AI summaries |
| `/api/orcc/status` | GET | Health check |

**Now Available (Migration Complete 2026-01-21):**
| Endpoint | Status |
|----------|--------|
| `/api/tasks/*` | ✅ Working |
| `/api/shadow-coder/*` | ✅ Working |
| `/ws` WebSocket | ✅ Working |
| `/api/procedures` POST | ✅ Working (vessel_data, interventions, CPT codes) |
| `/api/planning/{mrn}` | ✅ Working |

See [MIGRATION_SPEC.md](MIGRATION_SPEC.md) for full details.

---

## Future Direction

### Phase 1: Backend Integration ✅ COMPLETE
- ✅ Connect ORCC to PlaudAI backend
- ✅ Tasks API implemented and working
- ✅ Shadow Coder migrated to PlaudAI
- ✅ WebSocket server running
- ✅ Larry Taylor created as first real patient (MRN: 32016089)
- ✅ POST /api/procedures with full planning data (vessel_data, interventions, ICD-10, CPT)
- ✅ GET /api/planning/{mrn} for workspace data loading
- ✅ Charles Daniels procedure saved and retrievable (MRN: 18890211)

### Phase 2: Intelligence Features
**NLP Processing:**
- Parse pasted CTA/imaging reports
- Extract vessel findings automatically
- Auto-populate anatomy diagrams
- Generate structured output from free text

**Clinical Decision Support:**
- LCD criteria validation
- Medical necessity checking
- CPT code suggestions based on anatomy/procedure

### Phase 3: UI Refinement
- Refine visual design and UX across all pages
- Ensure consistent navigation and branding
- Test button functionality and page flows
- Gather feedback on workspace layouts

---

## Architecture Requirements (For Backend Integration)

### API Endpoints Needed

```
# Patients
GET    /api/patients              # List all patients
GET    /api/patients/:id          # Get patient details
POST   /api/patients              # Create patient
PUT    /api/patients/:id          # Update patient
DELETE /api/patients/:id          # Delete patient

# Tasks
GET    /api/tasks                 # List tasks (filterable)
GET    /api/tasks/patient/:id     # Tasks for specific patient
POST   /api/tasks                 # Create task
PUT    /api/tasks/:id             # Update task status
DELETE /api/tasks/:id             # Delete task

# Surgical Planning
GET    /api/planning/:patientId   # Get planning data
POST   /api/planning/:patientId   # Save planning data
PUT    /api/planning/:patientId   # Update planning

# VQI
GET    /api/vqi/:patientId        # Get VQI form data
POST   /api/vqi/:patientId        # Submit VQI data
PUT    /api/vqi/:patientId        # Update VQI data

# Processing
POST   /api/process/cta           # Process CTA report text
POST   /api/process/anatomy       # Extract anatomy from text
```

### Database Schema (Conceptual)

```
patients
├── id (PK)
├── mrn
├── name
├── dob
├── diagnosis_codes[]
├── created_at
└── updated_at

surgical_cases
├── id (PK)
├── patient_id (FK)
├── procedure_type
├── planned_procedure
├── dos (date of surgery)
├── status (preop/scheduled/completed/unsigned)
├── anatomy_data (JSON)
├── lcd_status
└── created_at

tasks
├── id (PK)
├── patient_id (FK)
├── case_id (FK)
├── title
├── description
├── task_type (call/schedule/order/review)
├── due_date
├── status (pending/completed)
├── urgency (normal/urgent)
└── created_at

vqi_submissions
├── id (PK)
├── case_id (FK)
├── form_type (infrainguinal/carotid/aaa)
├── form_data (JSON)
├── status (draft/submitted)
└── submitted_at
```

### Frontend State Management

When converting to a proper web app, consider:

**Option A: React + Context/Redux**
```
- React for component-based UI
- Context API or Redux for global state
- React Router for navigation
- Axios/fetch for API calls
```

**Option B: Vue + Pinia**
```
- Vue 3 for reactive components
- Pinia for state management
- Vue Router for navigation
- Axios for API calls
```

**Option C: Next.js (Recommended)**
```
- Server-side rendering for performance
- Built-in API routes
- File-based routing
- React ecosystem
```

---

## Design Principles

### Visual Identity
- **Primary Color:** UGA Red (#BA0C2F)
- **Background:** Near-black (#0A0A0A)
- **Font:** Inter (UI) + JetBrains Mono (code/data)
- **Style:** Dark theme, minimal, clinical-focused

### Status Color System
| Status | Color | Hex | Usage |
|--------|-------|-----|-------|
| Ready/Success | Green | #22C55E | LCD met, scheduled, complete |
| Warning/Pending | Orange | #F59E0B | Needs attention, partial |
| Urgent/Error | Red | #EF4444 | Overdue, blocked, missing |
| Info | Blue | #3B82F6 | Informational tags |
| Purple | Purple | #8B5CF6 | VQI/Registry items |

### Workspace Color Coding
| Workspace | Accent Color | Badge |
|-----------|--------------|-------|
| PAD/LE | Blue | #3B82F6 |
| Carotid | Cyan | #06B6D4 |
| Aortic | Orange | #F97316 |
| Venous | Indigo | #6366F1 |

---

## Key User Workflows

### 1. Pre-Op Planning Flow
```
Patient List → Select Patient → View Details → Open in Workspace
→ Paste CTA Report → Process → Review Anatomy → Confirm Findings
→ Generate Documentation → Copy to EHR
```

### 2. Task Management Flow
```
Task List → Filter by Type → Select Patient Card
→ Complete Tasks (check boxes) → Update Status
→ Mark Patient Ready for Surgery
```

### 3. VQI Data Entry Flow
```
Workspace → Complete Case Planning → Open VQI Panel
→ Auto-fill from Planning Data → Review/Edit
→ Submit to VQI Registry
```

---

## Notes for Development Team

### Current Limitations to Address
1. ~~No data persistence (localStorage only)~~ ✅ FIXED - Procedures save to PlaudAI database
2. No authentication/authorization
3. ~~Hardcoded patient data~~ ✅ FIXED - Patients load from API
4. No real NLP processing (Process button is fake)
5. Filter buttons on tasks page are non-functional
6. PDF export buttons are non-functional
7. VQI form submissions are non-functional

### Completed Features
1. ✅ Patient CRUD operations (PlaudAI API)
2. ✅ Task management with real persistence (PlaudAI API)
3. ✅ Surgical case creation and status tracking (POST /api/procedures)
4. ✅ Procedure planning data persistence (vessel_data, interventions, ICD-10, CPT)
5. ✅ Workspace loads planning data from API (GET /api/planning/{mrn})

### Priority Features Remaining
1. User authentication
4. User authentication
5. NLP processing for CTA reports (can be separate microservice)

---

## Contact & Resources

- **Project:** OR Command Center (ORCC)
- **Replaces:** SCC/VAI UI (backend migrated to PlaudAI)
- **Status:** Backend Integration COMPLETE ✅
- **Version:** 0.2.0
- **Backend:** PlaudAI @ `100.75.237.36:8001`
- **Database:** PostgreSQL (17 patients, 12 procedures)

---

## Migration Status (2026-01-26)

### ✅ Completed
- SCC → PlaudAI migration complete
- All APIs working (patients, procedures, tasks, shadow-coder)
- Larry Taylor test patient in database (MRN: 32016089)
- Charles Daniels procedure saved with full planning data (MRN: 18890211)
- WebSocket server running
- POST /api/procedures - Creates procedures with vessel_data, interventions, ICD-10, CPT codes
- GET /api/planning/{mrn} - Returns planning data for workspace loading
- ORCC Endovascular Planning page wired to API
- ORCC Workspace loads planning data from API (persists across refreshes)

### 🚫 Retired
- SCC Node server (port 3001) - can be stopped

### ✅ All Core Features Working
- Patient list loads from PlaudAI
- Add Patient creates in PlaudAI database
- Endovascular Planning saves to PlaudAI
- Workspace loads planning data from PlaudAI
- Data persists across page refreshes

---

*Last Updated: 2026-01-26*
