/**
 * ORCC API Client
 * Connects OR Command Center frontend to PlaudAI PostgreSQL backend
 * API Base: http://100.75.237.36:8001
 */

const ORCC_API = {
  baseUrl: 'http://100.75.237.36:8001',

  // Helper for fetch requests
  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    };

    try {
      const response = await fetch(url, config);
      if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: response.statusText }));
        throw new Error(error.detail || `HTTP ${response.status}`);
      }
      return response.json();
    } catch (err) {
      console.error(`ORCC API Error [${endpoint}]:`, err.message);
      throw err;
    }
  },

  // ============ PATIENTS ============

  /**
   * Search patients with optional filters
   * @param {Object} params - { search, skip, limit }
   */
  async getPatients(params = {}) {
    const query = new URLSearchParams();
    if (params.search) query.set('search', params.search);
    if (params.skip) query.set('skip', params.skip);
    if (params.limit) query.set('limit', params.limit);
    const queryStr = query.toString();
    return this.request(`/api/patients${queryStr ? '?' + queryStr : ''}`);
  },

  /**
   * Get patient by MRN with their procedures
   * @param {string} mrn - Medical Record Number
   */
  async getPatientByMRN(mrn) {
    return this.request(`/api/patients/${encodeURIComponent(mrn)}`);
  },

  /**
   * Create a new patient
   * @param {Object} patient - Patient data
   */
  async createPatient(patient) {
    return this.request('/api/patients', {
      method: 'POST',
      body: JSON.stringify(patient)
    });
  },

  // ============ PROCEDURES ============

  /**
   * Get procedures with filters
   * @param {Object} params - { surgical_status, patient_id, skip, limit }
   */
  async getProcedures(params = {}) {
    const query = new URLSearchParams();
    if (params.surgical_status) query.set('surgical_status', params.surgical_status);
    if (params.patient_id) query.set('patient_id', params.patient_id);
    if (params.skip) query.set('skip', params.skip);
    if (params.limit) query.set('limit', params.limit);
    const queryStr = query.toString();
    return this.request(`/api/procedures${queryStr ? '?' + queryStr : ''}`);
  },

  /**
   * Get single procedure by ID
   * @param {number} id - Procedure ID
   */
  async getProcedure(id) {
    return this.request(`/api/procedures/${id}`);
  },

  /**
   * Create a new procedure with full planning data
   * @param {Object} procedure - Procedure data including vessel_data, interventions, etc.
   */
  async createProcedure(procedure) {
    return this.request('/api/procedures', {
      method: 'POST',
      body: JSON.stringify(procedure)
    });
  },

  /**
   * Update procedure (surgical status, barriers, clearance, etc.)
   * @param {number} id - Procedure ID
   * @param {Object} updates - Fields to update
   */
  async updateProcedure(id, updates) {
    return this.request(`/api/procedures/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates)
    });
  },

  // ============ PLANNING ============

  /**
   * Get planning data for a patient by MRN
   * Returns procedure with vessel_data, interventions, CPT codes
   * @param {string} mrn - Medical Record Number
   */
  async getPlanningData(mrn) {
    return this.request(`/api/planning/${encodeURIComponent(mrn)}`);
  },

  /**
   * Get the latest procedure for a patient by MRN
   * Returns null if no procedure exists
   * @param {string} mrn - Medical Record Number
   */
  async getLatestProcedureByMRN(mrn) {
    try {
      const planningData = await this.getPlanningData(mrn);
      if (planningData && planningData.procedure && planningData.procedure.id) {
        return planningData.procedure;
      }
      return null;
    } catch (err) {
      // No procedure found or API error
      console.log(`No existing procedure found for MRN ${mrn}`);
      return null;
    }
  },

  /**
   * Create or update a procedure for a patient
   * Checks if procedure exists for MRN, updates if yes, creates if no
   * @param {Object} procedureData - Full procedure data
   * @returns {Object} - Created or updated procedure
   */
  async saveOrUpdateProcedure(procedureData) {
    const mrn = procedureData.mrn;

    // Check for existing procedure
    const existing = await this.getLatestProcedureByMRN(mrn);

    if (existing && existing.id) {
      // Update existing procedure
      console.log(`Updating existing procedure ${existing.id} for MRN ${mrn}`);
      return this.updateProcedure(existing.id, {
        procedure_type: procedureData.procedure_type,
        procedure_name: procedureData.procedure_name,
        procedure_side: procedureData.procedure_side,
        procedure_date: procedureData.procedure_date,
        scheduled_location: procedureData.scheduled_location,
        status: procedureData.status,
        surgical_status: procedureData.surgical_status,
        indication: procedureData.indication,
        access: procedureData.access,
        inflow: procedureData.inflow,
        outflow: procedureData.outflow,
        vessel_data: procedureData.vessel_data,
        interventions: procedureData.interventions,
        cpt_codes: procedureData.cpt_codes
      });
    } else {
      // Create new procedure
      console.log(`Creating new procedure for MRN ${mrn}`);
      return this.createProcedure(procedureData);
    }
  },

  // ============ ORCC SPECIFIC ============

  /**
   * Get surgery-ready patients (surgical_status = 'ready')
   */
  async getReadyPatients() {
    return this.getProcedures({ surgical_status: 'ready' });
  },

  /**
   * Get patients needing workup
   */
  async getWorkupPatients() {
    return this.getProcedures({ surgical_status: 'workup' });
  },

  /**
   * Get patients on hold
   */
  async getHoldPatients() {
    return this.getProcedures({ surgical_status: 'hold' });
  },

  /**
   * Get near-ready patients (one step away)
   */
  async getNearReadyPatients() {
    return this.getProcedures({ surgical_status: 'near_ready' });
  },

  /**
   * Update surgical status
   * @param {number} procedureId
   * @param {string} status - 'ready'|'near_ready'|'workup'|'hold'|'scheduled'|'completed'
   */
  async updateSurgicalStatus(procedureId, status) {
    return this.updateProcedure(procedureId, { surgical_status: status });
  },

  /**
   * Update barriers (workup items)
   * @param {number} procedureId
   * @param {Array} barriers - Array of barrier strings
   */
  async updateBarriers(procedureId, barriers) {
    return this.updateProcedure(procedureId, { barriers });
  },

  /**
   * Set cardiology clearance
   * @param {number} procedureId
   * @param {boolean} cleared
   */
  async setCardiologyClearance(procedureId, cleared) {
    return this.updateProcedure(procedureId, { cardiology_clearance: cleared });
  },

  /**
   * Update stress test status
   * @param {number} procedureId
   * @param {string} status - 'pending'|'completed'|'abnormal'|'not_needed'
   */
  async updateStressTestStatus(procedureId, status) {
    return this.updateProcedure(procedureId, { stress_test_status: status });
  },

  /**
   * Schedule procedure
   * @param {number} procedureId
   * @param {string} date - ISO date string
   * @param {string} location - 'CRH', 'ASC', etc.
   */
  async scheduleProcedure(procedureId, date, location) {
    return this.updateProcedure(procedureId, {
      procedure_date: date,
      scheduled_location: location,
      surgical_status: 'scheduled'
    });
  },

  /**
   * Health check
   */
  async checkHealth() {
    return this.request('/api/orcc/status');
  },

  // ============ UTILITY ============

  /**
   * Map API patient data to ORCC frontend format
   */
  mapPatientToORCC(apiPatient) {
    return {
      id: apiPatient.id,
      mrn: apiPatient.mrn,
      name: `${apiPatient.last_name}, ${apiPatient.first_name}`,
      firstName: apiPatient.first_name,
      lastName: apiPatient.last_name,
      dob: apiPatient.date_of_birth,
      gender: apiPatient.gender,
      phone: apiPatient.phone_primary,
      email: apiPatient.email,
      procedures: apiPatient.procedures || []
    };
  },

  /**
   * Map API procedure data to ORCC frontend format
   * Note: API now returns patient_name directly in procedure response
   */
  mapProcedureToORCC(apiProcedure) {
    return {
      id: apiProcedure.id,
      patientId: apiProcedure.patient_id,
      mrn: apiProcedure.mrn,
      patientName: apiProcedure.patient_name, // Pre-joined from API
      procedureName: apiProcedure.procedure_type,
      procedureSide: apiProcedure.procedure_side,
      scheduledDate: apiProcedure.procedure_date,
      scheduledLocation: apiProcedure.scheduled_location,
      surgeon: apiProcedure.surgeon,
      status: apiProcedure.surgical_status,
      barriers: apiProcedure.barriers || [],
      cardiologyClearance: apiProcedure.cardiology_clearance,
      stressTestStatus: apiProcedure.stress_test_status,
      vqiCaseId: apiProcedure.vqi_case_id
    };
  }
};

// Export for module systems, also available globally
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ORCC_API;
}
