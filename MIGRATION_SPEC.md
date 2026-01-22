# SCC → PlaudAI Migration Specification

**Version:** 1.2
**Date:** 2026-01-21
**Status:** ✅ PHASE 1 & 2 COMPLETE

---

## 🎉 FULL MIGRATION COMPLETE (2026-01-21 17:50)

### Phase 1 Results (Backend):
| Task | Status |
|------|--------|
| Fix POST /api/patients | ✅ Fixed (SQL cast syntax) |
| Tasks API | ✅ Working |
| Shadow Coder | ✅ Migrated to PlaudAI |
| WebSocket | ✅ Running |
| Larry Taylor patient | ✅ Created (MRN: 32016089) |

### Phase 2 Results (Procedures API):
| Task | Status |
|------|--------|
| POST /api/procedures | ✅ Working - Full planning data support |
| GET /api/planning/{mrn} | ✅ Working - Workspace data loading |
| Charles Daniels procedure | ✅ Saved (MRN: 18890211) |
| ORCC Planning Page wired | ✅ Saves to API |
| ORCC Workspace wired | ✅ Loads from API |
| Data persists on refresh | ✅ Working |

### Procedures API Features:
- **vessel_data**: JSONB storing vessel status (stenosis_severe, occluded, etc.)
- **interventions**: Array of planned interventions with vessel, type, length
- **indication**: ICD-10 codes and Rutherford classification
- **access**: Site, sheath size, anesthesia
- **inflow/outflow**: Vessel patency status
- **cpt_codes**: Auto-generated CPT codes

### Root Cause of 500 Error (Phase 1):
Invalid SQL parameter casting syntax `:param::type` was changed to `CAST(:param AS type)` in `orcc.py` and `tasks.py`.

---

---

## Executive Summary

This document specifies the migration of backend services from the SCC Node server (port 3001) to PlaudAI (port 8001). ORCC becomes the primary frontend interface.

**Key Decision:** Consolidate all surgical command center backend functionality into PlaudAI, eliminating the need for the separate SCC Node server.

---

## Current State

### SCC Node Server (PORT 3001) - 🚫 RETIRED
- **Location:** Server1 (100.75.237.36)
- **Technology:** Node.js + Express + Sequelize
- **Status:** Ready to stop - all functionality migrated to PlaudAI
- **Features:**
  - REST API for procedures
  - WebSocket server for real-time updates
  - Shadow Coder integration
  - VAI proxy endpoints

### PlaudAI (PORT 8001) - ACTIVE & WORKING
- **Location:** Server1 (100.75.237.36)
- **Technology:** Python + FastAPI
- **Status:** Healthy, Gemini 2.0 Flash configured
- **Features:**
  - `/api/patients` - CRUD operations
  - `/api/procedures` - CRUD operations with full planning data
  - `/api/planning/{mrn}` - Get planning data for workspace
  - `/api/tasks` - Task management
  - `/api/shadow-coder` - AI coding assistance
  - `/api/parse` - AI parsing
  - `/api/synopsis` - AI summaries
  - `/api/extract` - Data extraction
  - `/ws` - WebSocket server
  - PostgreSQL connection working

### ORCC Frontend
- **Location:** Workstation (/home/tripp/ORCommandCenter)
- **Technology:** Static HTML + Vanilla JS
- **API Client:** `js/api-client.js` → PlaudAI:8001

---

## Target State

### PlaudAI (PORT 8001) - UNIFIED BACKEND

```
PlaudAI FastAPI Application
├── /api/patients                    [EXISTING]
│   ├── GET /                        List patients
│   ├── GET /{mrn}                   Get by MRN
│   └── POST /                       Create patient
│
├── /api/procedures                  [EXISTING]
│   ├── GET /                        List procedures
│   ├── GET /{id}                    Get by ID
│   ├── POST /                       Create procedure
│   └── PATCH /{id}                  Update procedure
│
├── /api/tasks                       [NEW - MIGRATE]
│   ├── GET /                        List all tasks
│   ├── GET /{id}                    Get task by ID
│   ├── GET /patient/{patientId}     Tasks for patient
│   ├── POST /                       Create task
│   ├── PATCH /{id}                  Update task
│   └── DELETE /{id}                 Delete task
│
├── /api/planning                    [NEW - MIGRATE]
│   ├── GET /{caseId}                Get case plan
│   ├── PUT /{caseId}                Save case plan
│   └── DELETE /{caseId}             Delete case plan
│
├── /api/shadow-coder                [NEW - MIGRATE]
│   ├── POST /parse                  Parse transcript
│   ├── POST /analyze                Analyze procedure
│   └── GET /suggestions/{caseId}    Get coding suggestions
│
├── /ws                              [NEW - MIGRATE]
│   └── WebSocket server for real-time updates
│
├── /api/parse                       [EXISTING]
├── /api/synopsis                    [EXISTING]
├── /api/extract                     [EXISTING]
└── /health                          [EXISTING]
```

---

## Database Schema Changes

### New Table: `tasks`

```sql
CREATE TABLE tasks (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id      UUID REFERENCES patients(id) ON DELETE CASCADE,
    case_id         UUID,  -- References procedures.id
    title           VARCHAR(200) NOT NULL,
    description     TEXT,
    task_type       VARCHAR(20) CHECK (task_type IN (
        'call', 'schedule', 'order', 'review', 'clearance', 'imaging', 'labs', 'other'
    )),
    due_date        DATE,
    status          VARCHAR(20) DEFAULT 'pending' CHECK (status IN (
        'pending', 'in_progress', 'completed', 'cancelled'
    )),
    urgency         VARCHAR(20) DEFAULT 'normal' CHECK (urgency IN (
        'low', 'normal', 'high', 'urgent'
    )),
    assigned_to     VARCHAR(100),
    notes           TEXT,
    completed_at    TIMESTAMP,
    completed_by    VARCHAR(100),
    created_at      TIMESTAMP DEFAULT NOW(),
    updated_at      TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_tasks_patient_id ON tasks(patient_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
CREATE INDEX idx_tasks_urgency ON tasks(urgency);
```

### New Table: `case_planning`

```sql
CREATE TABLE case_planning (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    procedure_id    UUID UNIQUE REFERENCES procedures(id) ON DELETE CASCADE,

    -- Vessel Status Map (mirrors ORCC vesselData structure)
    vessel_data     JSONB DEFAULT '{}'::jsonb,
    -- Example: {
    --   "l_sfa": {"status": "patent", "notes": ""},
    --   "l_popliteal": {"status": "stenosis", "notes": ">70%"},
    --   "l_at": {"status": "patent", "notes": ""},
    --   "l_pt": {"status": "occluded", "notes": "mid leg"},
    --   "l_peroneal": {"status": "patent", "notes": ""}
    -- }

    -- Procedure Parameters
    procedure_params JSONB DEFAULT '{}'::jsonb,
    -- Example: {
    --   "side": "left",
    --   "rutherford": "r5",
    --   "accessSite": "r_cfa",
    --   "anesthesia": "mac_local"
    -- }

    -- Planned Interventions
    interventions   JSONB DEFAULT '[]'::jsonb,
    -- Example: [
    --   {"vessel": "Popliteal", "intervention": "atherectomy"},
    --   {"vessel": "Popliteal", "intervention": "pta"}
    -- ]

    -- Timestamps
    created_at      TIMESTAMP DEFAULT NOW(),
    updated_at      TIMESTAMP DEFAULT NOW()
);

-- Index
CREATE INDEX idx_case_planning_procedure_id ON case_planning(procedure_id);
```

---

## API Specifications

### Tasks API

#### GET /api/tasks
List all tasks with optional filters.

**Query Parameters:**
- `patient_id` (UUID): Filter by patient
- `status` (string): Filter by status
- `urgency` (string): Filter by urgency
- `due_before` (date): Tasks due before date
- `skip` (int): Pagination offset
- `limit` (int): Pagination limit

**Response:**
```json
{
    "tasks": [
        {
            "id": "uuid",
            "patient_id": "uuid",
            "patient_name": "Taylor, Larry",
            "title": "Cardiology clearance",
            "task_type": "clearance",
            "due_date": "2026-01-25",
            "status": "pending",
            "urgency": "high"
        }
    ],
    "total": 15,
    "skip": 0,
    "limit": 50
}
```

#### POST /api/tasks
Create a new task.

**Request Body:**
```json
{
    "patient_id": "uuid",
    "case_id": "uuid",
    "title": "Schedule stress test",
    "description": "Patient needs nuclear stress test before procedure",
    "task_type": "order",
    "due_date": "2026-01-28",
    "urgency": "high"
}
```

#### PATCH /api/tasks/{id}
Update a task.

**Request Body:**
```json
{
    "status": "completed",
    "notes": "Stress test scheduled for 1/28"
}
```

### Planning API

#### GET /api/planning/{caseId}
Get case planning data.

**Response:**
```json
{
    "id": "uuid",
    "procedure_id": "uuid",
    "vessel_data": {
        "l_sfa": {"status": "patent", "notes": ""},
        "l_popliteal": {"status": "stenosis", "notes": ">70%"}
    },
    "procedure_params": {
        "side": "left",
        "rutherford": "r5",
        "accessSite": "r_cfa",
        "anesthesia": "mac_local"
    },
    "interventions": [
        {"vessel": "Popliteal", "intervention": "atherectomy"},
        {"vessel": "Popliteal", "intervention": "pta"}
    ]
}
```

#### PUT /api/planning/{caseId}
Save/update case planning data.

**Request Body:** Same structure as GET response (without id/timestamps)

---

## WebSocket Specification

### Connection
```
ws://100.75.237.36:8001/ws
```

### Message Format
```json
{
    "type": "string",
    "payload": {},
    "timestamp": "ISO8601"
}
```

### Event Types

#### Client → Server
| Type | Description | Payload |
|------|-------------|---------|
| `register` | Register client | `{clientType: "orcc", caseId: "uuid"}` |
| `field_update` | UI field changed | `{procedureId, field, value}` |
| `plan_save` | Save planning data | `{caseId, vesselData, interventions}` |
| `task_update` | Task status change | `{taskId, status}` |

#### Server → Client
| Type | Description | Payload |
|------|-------------|---------|
| `connected` | Connection confirmed | `{clientId}` |
| `procedure_updated` | Procedure changed | `{procedureId, changes}` |
| `task_created` | New task | `{task}` |
| `task_completed` | Task completed | `{taskId}` |
| `broadcast` | General message | `{message, from}` |

---

## Migration Phases

### Phase 1: Database Setup (Server1)
**Owner:** Server1 Claude
**Duration:** 1-2 hours

1. Create `tasks` table
2. Create `case_planning` table
3. Run migrations
4. Verify table structure

### Phase 2: API Implementation (Server1)
**Owner:** Server1 Claude
**Duration:** 4-6 hours

1. Implement Tasks router
2. Implement Planning router
3. Add WebSocket support
4. Migrate Shadow Coder endpoints
5. Unit tests for new endpoints

### Phase 3: Frontend Integration (ORCC)
**Owner:** ORCC Claude (this workstation)
**Duration:** 2-3 hours

1. Update `api-client.js` with new endpoints
2. Add WebSocket client
3. Wire up Tasks page
4. Wire up Planning save/load
5. Integration tests

### Phase 4: SCC Node Retirement (Server1)
**Owner:** Server1 Claude
**Duration:** 30 minutes

1. Stop SCC service
2. Disable SCC service
3. Archive codebase
4. Update documentation

---

## Rollback Plan

If migration fails:

1. **Restore SCC Node:**
   ```bash
   sudo systemctl start scc
   ```

2. **Update ORCC api-client.js:**
   Change baseUrl back to port 3001

3. **Investigate failure:**
   Check PlaudAI logs, database state

---

## Success Criteria

- [ ] All PlaudAI endpoints return 200/201 for valid requests
- [ ] Tasks can be created, read, updated, deleted
- [ ] Planning data persists correctly
- [ ] WebSocket connections stable for 1+ hour
- [ ] Larry Taylor can be created as patient
- [ ] Larry Taylor procedure can be saved with full vessel data
- [ ] ORCC UI functions with all live data

---

## Post-Migration Verification

```bash
# Test patient creation
curl -X POST http://100.75.237.36:8001/api/patients \
  -H "Content-Type: application/json" \
  -d '{"mrn": "32016089", "first_name": "Larry", "last_name": "Taylor", "date_of_birth": "1954-10-28"}'

# Test task creation
curl -X POST http://100.75.237.36:8001/api/tasks \
  -H "Content-Type: application/json" \
  -d '{"patient_id": "<UUID>", "title": "Test task", "task_type": "review"}'

# Test planning save
curl -X PUT http://100.75.237.36:8001/api/planning/<CASE_UUID> \
  -H "Content-Type: application/json" \
  -d '{"vessel_data": {"l_popliteal": {"status": "stenosis"}}}'

# WebSocket test
websocat ws://100.75.237.36:8001/ws
# Send: {"type": "register", "payload": {"clientType": "test"}}
```

---

## Contact

- **ORCC Claude:** /home/tripp/ORCommandCenter
- **Server1 Claude:** PlaudAI at 100.75.237.36
- **Claude Team Hub:** localhost:4847
- **Shared Workspace:** /home/tripp/claude-team/.claude-team/SHARED_WORKSPACE.md
