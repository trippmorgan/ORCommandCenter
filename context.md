# OR Command Center (ORCC) - Project Context

## Overview

ORCC is a surgical intelligence and planning suite for vascular surgery. The current implementation is a **UI prototype** consisting of static HTML files with hardcoded patient data. The goal is to perfect the UI/UX first, then connect it to the existing SCC/VAI backend infrastructure.

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

## Current State (v0.1.0)

### Technology Stack
- Pure HTML5 with embedded CSS and JavaScript
- No framework (vanilla JavaScript)
- No build system or package managers
- No external API calls (all data is static/hardcoded)
- No database connection (data is in-memory JavaScript objects)
- Patient context passed between pages via localStorage

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

## Future Direction

### Phase 1: Perfect the UI (CURRENT)
- Refine visual design and UX across all pages
- Ensure consistent navigation and branding
- Test button functionality and page flows
- Gather feedback on workspace layouts

### Phase 2: Connect to Existing Backend
The existing SCC/VAI system has backend infrastructure that ORCC will connect to:

**Required Integrations:**
1. **Backend API** - RESTful endpoints for CRUD operations
2. **Database** - Patient records, tasks, VQI data, surgical planning
3. **Authentication** - User login, role-based access control
4. **EHR Integration** - Pull patient demographics, labs, imaging

### Phase 3: Add Intelligence Features

**NLP Processing:**
- Parse pasted CTA/imaging reports
- Extract vessel findings automatically
- Auto-populate anatomy diagrams
- Generate structured output from free text

**Clinical Decision Support:**
- LCD criteria validation
- Medical necessity checking
- CPT code suggestions based on anatomy/procedure

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
1. No data persistence (localStorage only)
2. No authentication/authorization
3. Hardcoded patient data
4. No real NLP processing (Process button is fake)
5. Filter buttons on tasks page are non-functional
6. PDF export buttons are non-functional
7. VQI form submissions are non-functional

### Priority Features for Backend Integration
1. Patient CRUD operations
2. Task management with real persistence
3. Surgical case creation and status tracking
4. User authentication
5. NLP processing for CTA reports (can be separate microservice)

---

## Contact & Resources

- **Project:** OR Command Center (ORCC)
- **Replaces:** SCC/VAI UI (backend remains)
- **Status:** UI Prototype Phase
- **Version:** 0.1.0

---

*Last Updated: January 2026*
