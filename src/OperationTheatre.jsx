import React, { useState, useEffect } from 'react';
import './OperationTheatre.css';
import {
  OT_ROOMS,
  SURGICAL_SPECIALTIES,
  getOtSchedule,
  saveOtSchedule,
  getCssdTrays,
  saveCssdTrays,
  getCssdCycles,
  saveCssdCycles,
  checkOtConflict
} from './otCssdService';

export default function OperationTheatreManagement({ role = 'admin', loggedInUser = null }) {
  const [activeSubTab, setActiveSubTab] = useState('schedule'); // 'schedule', 'rooms', 'who_checklist', 'pacu', 'cssd_trays', 'cssd_cycles'
  
  // Data States
  const [schedule, setSchedule] = useState([]);
  const [cssdTrays, setCssdTrays] = useState([]);
  const [cssdCycles, setCssdCycles] = useState([]);
  
  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [roomFilter, setRoomFilter] = useState('All');
  const [specialtyFilter, setSpecialtyFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  // Modals
  const [showBookSurgeryModal, setShowBookSurgeryModal] = useState(false);
  const [selectedSurgeryForWho, setSelectedSurgeryForWho] = useState(null);
  const [selectedSurgeryForPacu, setSelectedSurgeryForPacu] = useState(null);
  const [showAddCssdTrayModal, setShowAddCssdTrayModal] = useState(false);
  const [showRunCycleModal, setShowRunCycleModal] = useState(false);

  // New Surgery Booking Form
  const [newSurgeryForm, setNewSurgeryForm] = useState({
    patientId: 'PT-80234',
    patientName: 'John Doe',
    patientAge: 45,
    patientGender: 'Male',
    patientBloodGroup: 'O+',
    otRoomId: 'OT-1',
    surgeryName: '',
    specialty: 'General Surgery',
    primarySurgeon: loggedInUser?.name || 'Dr. Sarah Connor',
    assistantSurgeon: 'Dr. Marcus Vance',
    anesthesiologist: 'Dr. Helen Cho',
    scrubNurse: 'Sister Clara Oswald',
    scheduledDate: new Date().toISOString().split('T')[0],
    startTime: '09:00',
    endTime: '12:00',
    urgency: 'Elective',
    anesthesiaType: 'General Anesthesia',
    requiredTrayIds: []
  });

  // New CSSD Tray Form
  const [newTrayForm, setNewTrayForm] = useState({
    trayId: `TRAY-${Math.floor(100 + Math.random() * 900)}`,
    trayName: '',
    department: 'General Surgery',
    instrumentCount: 35,
    sterilizationMethod: 'Steam Autoclave (Class B - 134°C / 30 psi)',
    machineId: 'AUTOCLAVE-01',
    biAndCiValidation: 'Passed (Class 5 Chemical Strip Verified)'
  });

  // New CSSD Cycle Form
  const [newCycleForm, setNewCycleForm] = useState({
    machineId: 'AUTOCLAVE-01 (Getinge Dual Door)',
    cycleType: 'Porous / Solid Goods 134°C (3.5 Bar)',
    startTime: new Date().toISOString().replace('T', ' ').substring(0, 16),
    peakTemperature: '134.5°C',
    holdingTimeMin: '7.5 mins',
    vacuumTestResult: 'Passed (Leak rate 0.3 mbar/min)',
    bowieDickTest: 'Passed (Uniform color transition)',
    biologicalIndicator: 'Geo. stearothermophilus Spore Negative at 24h',
    operatorName: loggedInUser?.name || 'CSSD Specialist Robert Lang'
  });

  // Load datasets
  const loadData = () => {
    setSchedule(getOtSchedule());
    setCssdTrays(getCssdTrays());
    setCssdCycles(getCssdCycles());
  };

  useEffect(() => {
    loadData();
    window.addEventListener('storage', loadData);
    return () => window.removeEventListener('storage', loadData);
  }, []);

  // Compute Metrics
  const inSurgeryCount = schedule.filter(s => s.status === 'In Surgery').length;
  const scheduledCount = schedule.filter(s => s.status === 'Scheduled' || s.status === 'In Pre-Op Holding').length;
  const inPacuCount = schedule.filter(s => s.status === 'In PACU / Recovery').length;
  const sterileTraysCount = cssdTrays.filter(t => t.status === 'Sterile & Ready').length;

  // Handle Booking Surgery with Strict Double-Booking Check
  const handleBookSurgery = (e) => {
    e.preventDefault();
    const room = OT_ROOMS.find(r => r.id === newSurgeryForm.otRoomId) || OT_ROOMS[0];
    const bookingId = `SURG-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const newBooking = {
      bookingId,
      ...newSurgeryForm,
      otRoomName: room.name,
      status: 'Scheduled',
      whoChecklist: {
        signIn: { completed: false, time: null, verifiedBy: null, patientIdentityAndConsentConfirmed: false, siteMarked: false, anesthesiaMachineAndMedicationCheckComplete: false, pulseOximeterOnAndFunctioning: false, knownAllergyCheckDone: false, difficultAirwayAspirationRiskAssessed: false, bloodLossRiskAssessedAndBloodArranged: false },
        timeOut: { completed: false, time: null, verifiedBy: null, teamMembersIntroducedByNameAndRole: false, patientNameProcedureSiteReconfirmed: false, anticipatedCriticalStepsSurgeon: false, anesthesiaSpecificConcernsReviewed: false, sterilityIndicatorsConfirmedByNursing: false, equipmentIssuesOrSafetyConcernsAddressed: false, antibioticProphylaxisGivenWithin60Min: false, essentialImagingDisplayed: false },
        signOut: { completed: false, time: null, verifiedBy: null, procedureRecordedAsPerformed: false, instrumentSpongeAndNeedleCountsCorrect: false, specimenLabelledWithPatientName: false, equipmentMalfunctionToAddress: false, surgeonAnesthesiaNurseKeyRecoveryPlanReviewed: false }
      },
      pacuRecord: {
        admissionTime: null,
        dischargeTime: null,
        pacuNurse: null,
        aldreteScore: { activity: 0, respiration: 0, circulation: 0, consciousness: 0, oxygenSaturation: 0 },
        totalScore: 0,
        painScoreNRS: 0,
        dischargeDestination: 'Post-Op Surgical Ward',
        pacuNotes: ''
      }
    };

    // Double Booking Conflict Validation
    const conflictCheck = checkOtConflict(newBooking, schedule);
    if (conflictCheck.conflict) {
      alert(`SCHEDULE CONFLICT DETECTED:\n\n${conflictCheck.message}\n\nPlease choose another time window, surgeon, or operation theatre room.`);
      return;
    }

    const updated = [newBooking, ...schedule];
    saveOtSchedule(updated);
    setSchedule(updated);
    setShowBookSurgeryModal(false);
    alert(`Surgery "${newBooking.surgeryName}" successfully booked in ${newBooking.otRoomName} for ${newBooking.scheduledDate} (${newBooking.startTime} - ${newBooking.endTime}).`);
  };

  // Status Change Workflow (Pre-Op -> In Surgery -> PACU -> Discharged)
  const handleUpdateSurgeryStatus = (bookingId, newStatus) => {
    const updated = schedule.map(s => {
      if (s.bookingId === bookingId) {
        return { ...s, status: newStatus };
      }
      return s;
    });
    saveOtSchedule(updated);
    setSchedule(updated);
  };

  // Save WHO Surgical Safety Checklist
  const handleSaveWhoChecklist = (e) => {
    e.preventDefault();
    if (!selectedSurgeryForWho) return;

    const updated = schedule.map(s => {
      if (s.bookingId === selectedSurgeryForWho.bookingId) {
        return selectedSurgeryForWho;
      }
      return s;
    });

    saveOtSchedule(updated);
    setSchedule(updated);
    setSelectedSurgeryForWho(null);
    alert('WHO Surgical Safety Checklist verified and committed to Electronic Surgical Record.');
  };

  // Save PACU Aldrete Record
  const handleSavePacuRecord = (e) => {
    e.preventDefault();
    if (!selectedSurgeryForPacu) return;

    const scores = selectedSurgeryForPacu.pacuRecord.aldreteScore;
    const total = Number(scores.activity) + Number(scores.respiration) + Number(scores.circulation) + Number(scores.consciousness) + Number(scores.oxygenSaturation);

    const updatedPacu = {
      ...selectedSurgeryForPacu.pacuRecord,
      totalScore: total
    };

    const updatedSurgery = {
      ...selectedSurgeryForPacu,
      pacuRecord: updatedPacu,
      status: total >= 9 ? 'Discharged to Ward' : 'In PACU / Recovery'
    };

    const updated = schedule.map(s => {
      if (s.bookingId === selectedSurgeryForPacu.bookingId) {
        return updatedSurgery;
      }
      return s;
    });

    saveOtSchedule(updated);
    setSchedule(updated);
    setSelectedSurgeryForPacu(null);
    alert(`PACU Assessment saved. Total Aldrete Score: ${total}/10. ${total >= 9 ? 'Patient meets discharge criteria (Score >= 9).' : 'Patient requires continued PACU monitoring.'}`);
  };

  // Add CSSD Tray
  const handleAddCssdTray = (e) => {
    e.preventDefault();
    const today = new Date();
    const exp = new Date(today);
    exp.setDate(exp.getDate() + 7); // 7-day sterility shelf life

    const newTray = {
      ...newTrayForm,
      sterilizedDate: today.toISOString().replace('T', ' ').substring(0, 16),
      expiryDate: exp.toISOString().replace('T', ' ').substring(0, 16),
      status: 'Sterile & Ready',
      sterilizedBy: loggedInUser?.name || 'CSSD Specialist Robert Lang',
      assignedOT: null
    };

    const updated = [newTray, ...cssdTrays];
    saveCssdTrays(updated);
    setCssdTrays(updated);
    setShowAddCssdTrayModal(false);
    alert(`Instrument Tray ${newTray.trayId} (${newTray.trayName}) registered as Sterile & Ready.`);
  };

  // Run CSSD Autoclave Cycle
  const handleRunCssdCycle = (e) => {
    e.preventDefault();
    const cycleId = `CYCLE-${new Date().getFullYear()}-${Math.floor(800 + Math.random() * 200)}`;
    const endTime = new Date().toISOString().replace('T', ' ').substring(0, 16);

    const newCycle = {
      cycleId,
      ...newCycleForm,
      endTime,
      status: 'Cycle Approved'
    };

    const updated = [newCycle, ...cssdCycles];
    saveCssdCycles(updated);
    setCssdCycles(updated);
    setShowRunCycleModal(false);
    alert(`Sterilization Cycle ${cycleId} validated. Physical parameters, Bowie-Dick, and Biological indicators approved.`);
  };

  // Filtered Schedule
  const filteredSchedule = schedule.filter(s => {
    const matchQ = s.surgeryName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                   s.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                   s.primarySurgeon.toLowerCase().includes(searchQuery.toLowerCase()) ||
                   s.bookingId.toLowerCase().includes(searchQuery.toLowerCase());
    const matchRoom = roomFilter === 'All' || s.otRoomId === roomFilter;
    const matchSpec = specialtyFilter === 'All' || s.specialty === specialtyFilter;
    const matchStatus = statusFilter === 'All' || s.status === statusFilter;
    return matchQ && matchRoom && matchSpec && matchStatus;
  });

  return (
    <div className="ot-container">
      {/* Top Banner */}
      <div className="ot-header">
        <div className="ot-header-title">
          <div className="ot-header-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>
            </svg>
          </div>
          <div>
            <h2>Operation Theatre (OT) & CSSD Sterilization Suite</h2>
            <p>Surgical scheduling, conflict-free room allocation, WHO checklist, Aldrete PACU recovery, and CSSD tray traceability.</p>
          </div>
        </div>

        <div className="ot-actions-group">
          <button className="ot-btn ot-btn-primary" onClick={() => setShowBookSurgeryModal(true)}>
            + Book Surgical Case
          </button>
          <button className="ot-btn ot-btn-secondary" onClick={() => setShowAddCssdTrayModal(true)}>
            + Register CSSD Tray
          </button>
          <button className="ot-btn ot-btn-success" onClick={() => setShowRunCycleModal(true)}>
            + Log Autoclave Cycle
          </button>
        </div>
      </div>

      {/* Summary Metrics */}
      <div className="ot-metrics-grid">
        <div className="ot-metric-card" style={{ borderLeft: '4px solid #ef4444' }}>
          <span className="ot-metric-label">Active Cases In Surgery</span>
          <div className="ot-metric-val" style={{ color: '#dc2626' }}>{inSurgeryCount} Active</div>
          <span className="ot-metric-sub">Live procedures underway</span>
        </div>
        <div className="ot-metric-card" style={{ borderLeft: '4px solid #3b82f6' }}>
          <span className="ot-metric-label">Scheduled Cases</span>
          <div className="ot-metric-val">{scheduledCount} Cases</div>
          <span className="ot-metric-sub">Conflict-checked & confirmed</span>
        </div>
        <div className="ot-metric-card" style={{ borderLeft: '4px solid #f59e0b' }}>
          <span className="ot-metric-label">PACU / Recovery</span>
          <div className="ot-metric-val">{inPacuCount} Patients</div>
          <span className="ot-metric-sub">Aldrete score monitoring</span>
        </div>
        <div className="ot-metric-card" style={{ borderLeft: '4px solid #10b981' }}>
          <span className="ot-metric-label">CSSD Sterile Trays</span>
          <div className="ot-metric-val">{sterileTraysCount} Trays</div>
          <span className="ot-metric-sub">Validated with Class 5 / Bio indicators</span>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="ot-subtabs">
        <button 
          className={`ot-tab-item ${activeSubTab === 'schedule' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('schedule')}
        >
          Surgical Schedule & OT Roster
          <span className="ot-tab-badge">{schedule.length}</span>
        </button>
        <button 
          className={`ot-tab-item ${activeSubTab === 'rooms' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('rooms')}
        >
          Live Operation Theatres Status
          <span className="ot-tab-badge">{OT_ROOMS.length}</span>
        </button>
        <button 
          className={`ot-tab-item ${activeSubTab === 'cssd_trays' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('cssd_trays')}
        >
          CSSD Sterile Instrument Trays
          <span className="ot-tab-badge">{cssdTrays.length}</span>
        </button>
        <button 
          className={`ot-tab-item ${activeSubTab === 'cssd_cycles' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('cssd_cycles')}
        >
          Sterilization & Autoclave Cycles
          <span className="ot-tab-badge">{cssdCycles.length}</span>
        </button>
      </div>

      {/* Tab 1: Surgical Schedule */}
      {activeSubTab === 'schedule' && (
        <div className="ot-table-card">
          <div className="ot-filter-row">
            <input 
              type="text" 
              placeholder="Search by Surgery, Patient, Surgeon, or Booking ID..." 
              className="ot-search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <select className="ot-select-filter" value={roomFilter} onChange={e => setRoomFilter(e.target.value)}>
                <option value="All">All Operation Theatres</option>
                {OT_ROOMS.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>

              <select className="ot-select-filter" value={specialtyFilter} onChange={e => setSpecialtyFilter(e.target.value)}>
                <option value="All">All Specialties</option>
                {SURGICAL_SPECIALTIES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>

              <select className="ot-select-filter" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                <option value="All">All Statuses</option>
                <option value="Scheduled">Scheduled</option>
                <option value="In Surgery">In Surgery</option>
                <option value="In PACU / Recovery">In PACU / Recovery</option>
                <option value="Discharged to Ward">Discharged to Ward</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="ot-table">
              <thead>
                <tr>
                  <th>Booking ID</th>
                  <th>Patient Details</th>
                  <th>Procedure / Surgery</th>
                  <th>OT Room & Time Window</th>
                  <th>Surgical Team</th>
                  <th>WHO Checklist</th>
                  <th>Aldrete PACU</th>
                  <th>Case Status</th>
                  <th>Clinical Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredSchedule.length === 0 ? (
                  <tr>
                    <td colSpan="9" style={{ textAlign: 'center', padding: '32px', color: '#94a3b8' }}>
                      No surgical cases match the selected filters.
                    </td>
                  </tr>
                ) : (
                  filteredSchedule.map(surg => {
                    const who = surg.whoChecklist || {};
                    const whoCount = (who.signIn?.completed ? 1 : 0) + (who.timeOut?.completed ? 1 : 0) + (who.signOut?.completed ? 1 : 0);
                    const pacuScore = surg.pacuRecord?.totalScore || 0;

                    return (
                      <tr key={surg.bookingId}>
                        <td><strong style={{ color: '#4338ca' }}>{surg.bookingId}</strong></td>
                        <td>
                          <strong>{surg.patientName}</strong>
                          <div style={{ fontSize: '11px', color: '#64748b' }}>
                            UHID: {surg.patientId} • {surg.patientAge}Y/{surg.patientGender} • Group: <strong>{surg.patientBloodGroup}</strong>
                          </div>
                        </td>
                        <td>
                          <strong>{surg.surgeryName}</strong>
                          <div style={{ fontSize: '11px', color: '#64748b' }}>{surg.specialty} ({surg.urgency})</div>
                        </td>
                        <td>
                          <strong>{surg.otRoomId}</strong>
                          <div style={{ fontSize: '11.5px', color: '#475569' }}>{surg.scheduledDate}</div>
                          <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#0f172a' }}>{surg.startTime} - {surg.endTime}</div>
                        </td>
                        <td>
                          <div><strong>Surgeon:</strong> {surg.primarySurgeon}</div>
                          <div style={{ fontSize: '11px', color: '#64748b' }}>Anaesth: {surg.anesthesiologist}</div>
                        </td>
                        <td>
                          <button 
                            className="ot-btn ot-btn-secondary" 
                            style={{ padding: '3px 8px', fontSize: '11.5px' }}
                            onClick={() => setSelectedSurgeryForWho(JSON.parse(JSON.stringify(surg)))}
                          >
                            WHO: {whoCount}/3 Phases
                          </button>
                        </td>
                        <td>
                          <button 
                            className="ot-btn ot-btn-secondary" 
                            style={{ padding: '3px 8px', fontSize: '11.5px' }}
                            onClick={() => setSelectedSurgeryForPacu(JSON.parse(JSON.stringify(surg)))}
                          >
                            Aldrete: {pacuScore}/10
                          </button>
                        </td>
                        <td>
                          <span className={`ot-badge ${
                            surg.status === 'In Surgery' ? 'ot-badge-insurgery' :
                            surg.status === 'In PACU / Recovery' ? 'ot-badge-pacu' :
                            surg.status === 'Discharged to Ward' ? 'ot-badge-completed' : 'ot-badge-scheduled'
                          }`}>
                            {surg.status}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                            {surg.status === 'Scheduled' && (
                              <button 
                                className="ot-btn ot-btn-primary" 
                                style={{ padding: '3px 6px', fontSize: '11px' }}
                                onClick={() => handleUpdateSurgeryStatus(surg.bookingId, 'In Surgery')}
                              >
                                Start Surgery
                              </button>
                            )}
                            {surg.status === 'In Surgery' && (
                              <button 
                                className="ot-btn ot-btn-warning" 
                                style={{ padding: '3px 6px', fontSize: '11px' }}
                                onClick={() => handleUpdateSurgeryStatus(surg.bookingId, 'In PACU / Recovery')}
                              >
                                Move to PACU
                              </button>
                            )}
                            {surg.status === 'In PACU / Recovery' && (
                              <button 
                                className="ot-btn ot-btn-success" 
                                style={{ padding: '3px 6px', fontSize: '11px' }}
                                onClick={() => handleUpdateSurgeryStatus(surg.bookingId, 'Discharged to Ward')}
                              >
                                Discharge Ward
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Live Operation Theatres Status */}
      {activeSubTab === 'rooms' && (
        <div>
          <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#1e293b', marginBottom: '14px' }}>
            Live Operation Theatre Suites & Equipment Roster
          </h3>
          <div className="ot-rooms-grid">
            {OT_ROOMS.map(room => {
              const activeSurgery = schedule.find(s => s.otRoomId === room.id && (s.status === 'In Surgery' || s.status === 'Scheduled'));
              const isOccupied = activeSurgery && activeSurgery.status === 'In Surgery';

              return (
                <div key={room.id} className={`ot-room-card ${isOccupied ? 'in-surgery' : 'available'}`}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '12px', fontWeight: '800', color: '#4338ca' }}>{room.id}</span>
                      <span className={`ot-badge ${isOccupied ? 'ot-badge-insurgery' : 'ot-badge-completed'}`}>
                        {isOccupied ? 'Procedure In Progress' : 'Available / Ready'}
                      </span>
                    </div>
                    <div className="ot-room-name" style={{ marginTop: '6px' }}>{room.name}</div>
                    <div className="ot-room-type">{room.type}</div>
                  </div>

                  {isOccupied && activeSurgery ? (
                    <div style={{ background: '#ffffff', padding: '10px', borderRadius: '6px', border: '1px solid #fecaca', fontSize: '12px' }}>
                      <div style={{ fontWeight: 'bold', color: '#b91c1c' }}>{activeSurgery.surgeryName}</div>
                      <div style={{ color: '#475569', marginTop: '2px' }}>Patient: <strong>{activeSurgery.patientName}</strong></div>
                      <div style={{ color: '#475569' }}>Surgeon: <strong>{activeSurgery.primarySurgeon}</strong></div>
                      <div style={{ color: '#0f172a', fontWeight: 'bold', marginTop: '4px' }}>{activeSurgery.startTime} - {activeSurgery.endTime}</div>
                    </div>
                  ) : (
                    <div style={{ fontSize: '12px', color: '#64748b' }}>
                      Cleaned and sterilized. Standard HVAC Laminar airflow active.
                    </div>
                  )}

                  <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '8px' }}>
                    <span style={{ fontSize: '10.5px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>Available Equipment</span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '4px' }}>
                      {room.equipment.map(eq => (
                        <span key={eq} style={{ fontSize: '10.5px', background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', color: '#334155' }}>
                          {eq}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 3: CSSD Trays */}
      {activeSubTab === 'cssd_trays' && (
        <div className="ot-table-card">
          <div className="ot-filter-row">
            <h3 style={{ margin: 0, fontSize: '15px', color: '#0f172a' }}>
              CSSD Surgical Instrument Trays & Sets
            </h3>
            <button className="ot-btn ot-btn-secondary" onClick={() => setShowAddCssdTrayModal(true)}>
              + New Sterile Tray
            </button>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="ot-table">
              <thead>
                <tr>
                  <th>Tray ID</th>
                  <th>Set / Tray Name</th>
                  <th>Department</th>
                  <th>Instrument Count</th>
                  <th>Sterilization Method</th>
                  <th>Sterilized / Expiry Date</th>
                  <th>Chemical & Bio Indicators</th>
                  <th>Sterilization Status</th>
                  <th>Assigned OT</th>
                </tr>
              </thead>
              <tbody>
                {cssdTrays.map(tray => (
                  <tr key={tray.trayId}>
                    <td><strong style={{ color: '#4338ca' }}>{tray.trayId}</strong></td>
                    <td><strong>{tray.trayName}</strong></td>
                    <td>{tray.department}</td>
                    <td><strong>{tray.instrumentCount}</strong> Instruments</td>
                    <td><span style={{ fontSize: '12px', color: '#475569' }}>{tray.sterilizationMethod}</span></td>
                    <td>
                      <div style={{ fontSize: '11.5px' }}>Sterile: {tray.sterilizedDate}</div>
                      <div style={{ fontSize: '11.5px', color: '#b91c1c', fontWeight: '600' }}>Exp: {tray.expiryDate}</div>
                    </td>
                    <td>
                      <span style={{ fontSize: '11px', color: '#15803d', background: '#dcfce7', padding: '3px 6px', borderRadius: '4px' }}>
                        {tray.biAndCiValidation}
                      </span>
                    </td>
                    <td>
                      <span className={`ot-badge ${
                        tray.status === 'Sterile & Ready' ? 'ot-badge-sterile' :
                        tray.status === 'Issued to OT' ? 'ot-badge-issued' : 'ot-badge-cleaning'
                      }`}>
                        {tray.status}
                      </span>
                    </td>
                    <td>{tray.assignedOT || 'CSSD Storage Shelf'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Autoclave & Sterilization Cycles */}
      {activeSubTab === 'cssd_cycles' && (
        <div className="ot-table-card">
          <div className="ot-filter-row">
            <div>
              <h3 style={{ margin: 0, fontSize: '15px', color: '#0f172a' }}>
                CSSD Autoclave & Plasma Sterilization Cycle Logs
              </h3>
              <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#64748b' }}>
                Physical, chemical, and biological validation logs for surgical infection prevention.
              </p>
            </div>
            <button className="ot-btn ot-btn-success" onClick={() => setShowRunCycleModal(true)}>
              + Log New Cycle
            </button>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="ot-table">
              <thead>
                <tr>
                  <th>Cycle ID</th>
                  <th>Machine & Autoclave Unit</th>
                  <th>Cycle Parameters</th>
                  <th>Time (Start - End)</th>
                  <th>Peak Temp / Hold Time</th>
                  <th>Vacuum Leak Rate</th>
                  <th>Bowie-Dick / Biological Test</th>
                  <th>Operator</th>
                  <th>Validation</th>
                </tr>
              </thead>
              <tbody>
                {cssdCycles.map(c => (
                  <tr key={c.cycleId}>
                    <td><strong style={{ color: '#15803d' }}>{c.cycleId}</strong></td>
                    <td><strong>{c.machineId}</strong></td>
                    <td>{c.cycleType}</td>
                    <td>
                      <div style={{ fontSize: '11.5px' }}>{c.startTime}</div>
                      <div style={{ fontSize: '11.5px' }}>to {c.endTime}</div>
                    </td>
                    <td>
                      <strong>{c.peakTemperature}</strong> / {c.holdingTimeMin}
                    </td>
                    <td>{c.vacuumTestResult}</td>
                    <td>
                      <div style={{ fontSize: '11px', color: '#15803d' }}>BD: {c.bowieDickTest}</div>
                      <div style={{ fontSize: '11px', color: '#15803d' }}>Bio: {c.biologicalIndicator}</div>
                    </td>
                    <td>{c.operatorName}</td>
                    <td>
                      <span className="ot-badge ot-badge-completed">
                        {c.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: Book Surgical Case */}
      {showBookSurgeryModal && (
        <div className="ot-modal-overlay">
          <div className="ot-modal">
            <div className="ot-modal-header">
              <h3>Book Operation Theatre (OT) Surgical Case</h3>
              <button className="ot-modal-close" onClick={() => setShowBookSurgeryModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleBookSurgery}>
              <div className="ot-modal-body">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div className="ot-form-group">
                    <label>Patient ID / UHID</label>
                    <input 
                      type="text" 
                      required 
                      value={newSurgeryForm.patientId} 
                      onChange={e => setNewSurgeryForm({ ...newSurgeryForm, patientId: e.target.value })}
                    />
                  </div>

                  <div className="ot-form-group">
                    <label>Patient Full Name</label>
                    <input 
                      type="text" 
                      required 
                      value={newSurgeryForm.patientName} 
                      onChange={e => setNewSurgeryForm({ ...newSurgeryForm, patientName: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px' }}>
                  <div className="ot-form-group">
                    <label>Age</label>
                    <input 
                      type="number" 
                      required 
                      value={newSurgeryForm.patientAge} 
                      onChange={e => setNewSurgeryForm({ ...newSurgeryForm, patientAge: Number(e.target.value) })}
                    />
                  </div>

                  <div className="ot-form-group">
                    <label>Gender</label>
                    <select 
                      value={newSurgeryForm.patientGender} 
                      onChange={e => setNewSurgeryForm({ ...newSurgeryForm, patientGender: e.target.value })}
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div className="ot-form-group">
                    <label>Blood Group</label>
                    <select 
                      value={newSurgeryForm.patientBloodGroup} 
                      onChange={e => setNewSurgeryForm({ ...newSurgeryForm, patientBloodGroup: e.target.value })}
                    >
                      <option value="A+">A+</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B-">B-</option>
                      <option value="AB+">AB+</option>
                      <option value="AB-">AB-</option>
                      <option value="O+">O+</option>
                      <option value="O-">O-</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div className="ot-form-group">
                    <label>Procedure / Surgery Name</label>
                    <input 
                      type="text" 
                      required 
                      placeholder="e.g. Laparoscopic Cholecystectomy"
                      value={newSurgeryForm.surgeryName} 
                      onChange={e => setNewSurgeryForm({ ...newSurgeryForm, surgeryName: e.target.value })}
                    />
                  </div>

                  <div className="ot-form-group">
                    <label>Surgical Specialty</label>
                    <select 
                      value={newSurgeryForm.specialty} 
                      onChange={e => setNewSurgeryForm({ ...newSurgeryForm, specialty: e.target.value })}
                    >
                      {SURGICAL_SPECIALTIES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div className="ot-form-group">
                    <label>Assigned Operation Theatre Suite</label>
                    <select 
                      value={newSurgeryForm.otRoomId} 
                      onChange={e => setNewSurgeryForm({ ...newSurgeryForm, otRoomId: e.target.value })}
                    >
                      {OT_ROOMS.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                    </select>
                  </div>

                  <div className="ot-form-group">
                    <label>Urgency Level</label>
                    <select 
                      value={newSurgeryForm.urgency} 
                      onChange={e => setNewSurgeryForm({ ...newSurgeryForm, urgency: e.target.value })}
                    >
                      <option value="Elective">Elective</option>
                      <option value="Elective (High Priority)">Elective (High Priority)</option>
                      <option value="Emergency (Stat)">Emergency (Stat)</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px' }}>
                  <div className="ot-form-group">
                    <label>Scheduled Date</label>
                    <input 
                      type="date" 
                      required 
                      value={newSurgeryForm.scheduledDate} 
                      onChange={e => setNewSurgeryForm({ ...newSurgeryForm, scheduledDate: e.target.value })}
                    />
                  </div>

                  <div className="ot-form-group">
                    <label>Start Time</label>
                    <input 
                      type="time" 
                      required 
                      value={newSurgeryForm.startTime} 
                      onChange={e => setNewSurgeryForm({ ...newSurgeryForm, startTime: e.target.value })}
                    />
                  </div>

                  <div className="ot-form-group">
                    <label>End Time</label>
                    <input 
                      type="time" 
                      required 
                      value={newSurgeryForm.endTime} 
                      onChange={e => setNewSurgeryForm({ ...newSurgeryForm, endTime: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div className="ot-form-group">
                    <label>Primary Surgeon</label>
                    <input 
                      type="text" 
                      required 
                      value={newSurgeryForm.primarySurgeon} 
                      onChange={e => setNewSurgeryForm({ ...newSurgeryForm, primarySurgeon: e.target.value })}
                    />
                  </div>

                  <div className="ot-form-group">
                    <label>Consultant Anesthesiologist</label>
                    <input 
                      type="text" 
                      required 
                      value={newSurgeryForm.anesthesiologist} 
                      onChange={e => setNewSurgeryForm({ ...newSurgeryForm, anesthesiologist: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="ot-modal-footer">
                <button type="button" className="ot-btn ot-btn-secondary" onClick={() => setShowBookSurgeryModal(false)}>Cancel</button>
                <button type="submit" className="ot-btn ot-btn-primary">Verify & Book OT Slot</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: WHO Surgical Safety Checklist (3-Phases) */}
      {selectedSurgeryForWho && (
        <div className="ot-modal-overlay">
          <div className="ot-modal" style={{ maxWidth: '820px' }}>
            <div className="ot-modal-header">
              <h3>WHO Surgical Safety Checklist — {selectedSurgeryForWho.surgeryName} ({selectedSurgeryForWho.bookingId})</h3>
              <button className="ot-modal-close" onClick={() => setSelectedSurgeryForWho(null)}>&times;</button>
            </div>
            <form onSubmit={handleSaveWhoChecklist}>
              <div className="ot-modal-body">
                {/* Phase 1: Sign In */}
                <div className="who-phase-card" style={{ background: '#f8fafc' }}>
                  <div className="who-phase-header">
                    <div className="who-phase-title" style={{ color: '#1e40af' }}>
                      1. SIGN IN (Before Induction of Anaesthesia)
                    </div>
                    <label style={{ fontSize: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <input 
                        type="checkbox" 
                        checked={selectedSurgeryForWho.whoChecklist.signIn.completed}
                        onChange={e => {
                          const updated = { ...selectedSurgeryForWho };
                          updated.whoChecklist.signIn.completed = e.target.checked;
                          updated.whoChecklist.signIn.time = e.target.checked ? new Date().toTimeString().substring(0, 5) : null;
                          setSelectedSurgeryForWho(updated);
                        }}
                      />
                      Phase Completed
                    </label>
                  </div>

                  <div className="who-item-row">
                    <input 
                      type="checkbox" 
                      checked={selectedSurgeryForWho.whoChecklist.signIn.patientIdentityAndConsentConfirmed}
                      onChange={e => {
                        const updated = { ...selectedSurgeryForWho };
                        updated.whoChecklist.signIn.patientIdentityAndConsentConfirmed = e.target.checked;
                        setSelectedSurgeryForWho(updated);
                      }}
                    />
                    <span>Has patient confirmed his/her identity, site, procedure and consent?</span>
                  </div>

                  <div className="who-item-row">
                    <input 
                      type="checkbox" 
                      checked={selectedSurgeryForWho.whoChecklist.signIn.siteMarked}
                      onChange={e => {
                        const updated = { ...selectedSurgeryForWho };
                        updated.whoChecklist.signIn.siteMarked = e.target.checked;
                        setSelectedSurgeryForWho(updated);
                      }}
                    />
                    <span>Is the surgical site marked (or not applicable)?</span>
                  </div>

                  <div className="who-item-row">
                    <input 
                      type="checkbox" 
                      checked={selectedSurgeryForWho.whoChecklist.signIn.anesthesiaMachineAndMedicationCheckComplete}
                      onChange={e => {
                        const updated = { ...selectedSurgeryForWho };
                        updated.whoChecklist.signIn.anesthesiaMachineAndMedicationCheckComplete = e.target.checked;
                        setSelectedSurgeryForWho(updated);
                      }}
                    />
                    <span>Is the anaesthesia machine and medication check complete?</span>
                  </div>

                  <div className="who-item-row">
                    <input 
                      type="checkbox" 
                      checked={selectedSurgeryForWho.whoChecklist.signIn.knownAllergyCheckDone}
                      onChange={e => {
                        const updated = { ...selectedSurgeryForWho };
                        updated.whoChecklist.signIn.knownAllergyCheckDone = e.target.checked;
                        setSelectedSurgeryForWho(updated);
                      }}
                    />
                    <span>Does the patient have a known allergy / difficult airway risk?</span>
                  </div>
                </div>

                {/* Phase 2: Time Out */}
                <div className="who-phase-card" style={{ background: '#fef2f2' }}>
                  <div className="who-phase-header">
                    <div className="who-phase-title" style={{ color: '#991b1b' }}>
                      2. TIME OUT (Before Skin Incision)
                    </div>
                    <label style={{ fontSize: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <input 
                        type="checkbox" 
                        checked={selectedSurgeryForWho.whoChecklist.timeOut.completed}
                        onChange={e => {
                          const updated = { ...selectedSurgeryForWho };
                          updated.whoChecklist.timeOut.completed = e.target.checked;
                          updated.whoChecklist.timeOut.time = e.target.checked ? new Date().toTimeString().substring(0, 5) : null;
                          setSelectedSurgeryForWho(updated);
                        }}
                      />
                      Phase Completed
                    </label>
                  </div>

                  <div className="who-item-row">
                    <input 
                      type="checkbox" 
                      checked={selectedSurgeryForWho.whoChecklist.timeOut.teamMembersIntroducedByNameAndRole}
                      onChange={e => {
                        const updated = { ...selectedSurgeryForWho };
                        updated.whoChecklist.timeOut.teamMembersIntroducedByNameAndRole = e.target.checked;
                        setSelectedSurgeryForWho(updated);
                      }}
                    />
                    <span>Confirm all team members have introduced themselves by name and role</span>
                  </div>

                  <div className="who-item-row">
                    <input 
                      type="checkbox" 
                      checked={selectedSurgeryForWho.whoChecklist.timeOut.patientNameProcedureSiteReconfirmed}
                      onChange={e => {
                        const updated = { ...selectedSurgeryForWho };
                        updated.whoChecklist.timeOut.patientNameProcedureSiteReconfirmed = e.target.checked;
                        setSelectedSurgeryForWho(updated);
                      }}
                    />
                    <span>Surgeon, Anaesthesia, Nursing verbally confirm Patient, Site, and Procedure</span>
                  </div>

                  <div className="who-item-row">
                    <input 
                      type="checkbox" 
                      checked={selectedSurgeryForWho.whoChecklist.timeOut.antibioticProphylaxisGivenWithin60Min}
                      onChange={e => {
                        const updated = { ...selectedSurgeryForWho };
                        updated.whoChecklist.timeOut.antibioticProphylaxisGivenWithin60Min = e.target.checked;
                        setSelectedSurgeryForWho(updated);
                      }}
                    />
                    <span>Has antibiotic prophylaxis been administered within the past 60 minutes?</span>
                  </div>

                  <div className="who-item-row">
                    <input 
                      type="checkbox" 
                      checked={selectedSurgeryForWho.whoChecklist.timeOut.sterilityIndicatorsConfirmedByNursing}
                      onChange={e => {
                        const updated = { ...selectedSurgeryForWho };
                        updated.whoChecklist.timeOut.sterilityIndicatorsConfirmedByNursing = e.target.checked;
                        setSelectedSurgeryForWho(updated);
                      }}
                    />
                    <span>Nursing team confirms sterility indicators & instrument/tray readiness</span>
                  </div>
                </div>

                {/* Phase 3: Sign Out */}
                <div className="who-phase-card" style={{ background: '#f0fdf4' }}>
                  <div className="who-phase-header">
                    <div className="who-phase-title" style={{ color: '#166534' }}>
                      3. SIGN OUT (Before Patient Leaves Operating Room)
                    </div>
                    <label style={{ fontSize: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <input 
                        type="checkbox" 
                        checked={selectedSurgeryForWho.whoChecklist.signOut.completed}
                        onChange={e => {
                          const updated = { ...selectedSurgeryForWho };
                          updated.whoChecklist.signOut.completed = e.target.checked;
                          updated.whoChecklist.signOut.time = e.target.checked ? new Date().toTimeString().substring(0, 5) : null;
                          setSelectedSurgeryForWho(updated);
                        }}
                      />
                      Phase Completed
                    </label>
                  </div>

                  <div className="who-item-row">
                    <input 
                      type="checkbox" 
                      checked={selectedSurgeryForWho.whoChecklist.signOut.procedureRecordedAsPerformed}
                      onChange={e => {
                        const updated = { ...selectedSurgeryForWho };
                        updated.whoChecklist.signOut.procedureRecordedAsPerformed = e.target.checked;
                        setSelectedSurgeryForWho(updated);
                      }}
                    />
                    <span>Name of procedure recorded as performed</span>
                  </div>

                  <div className="who-item-row">
                    <input 
                      type="checkbox" 
                      checked={selectedSurgeryForWho.whoChecklist.signOut.instrumentSpongeAndNeedleCountsCorrect}
                      onChange={e => {
                        const updated = { ...selectedSurgeryForWho };
                        updated.whoChecklist.signOut.instrumentSpongeAndNeedleCountsCorrect = e.target.checked;
                        setSelectedSurgeryForWho(updated);
                      }}
                    />
                    <span>Instrument, sponge, and needle counts are confirmed 100% correct</span>
                  </div>

                  <div className="who-item-row">
                    <input 
                      type="checkbox" 
                      checked={selectedSurgeryForWho.whoChecklist.signOut.surgeonAnesthesiaNurseKeyRecoveryPlanReviewed}
                      onChange={e => {
                        const updated = { ...selectedSurgeryForWho };
                        updated.whoChecklist.signOut.surgeonAnesthesiaNurseKeyRecoveryPlanReviewed = e.target.checked;
                        setSelectedSurgeryForWho(updated);
                      }}
                    />
                    <span>Surgeon, Anaesthetist and Nurse review key concerns for recovery and post-op care</span>
                  </div>
                </div>
              </div>

              <div className="ot-modal-footer">
                <button type="button" className="ot-btn ot-btn-secondary" onClick={() => setSelectedSurgeryForWho(null)}>Close</button>
                <button type="submit" className="ot-btn ot-btn-primary">Save WHO Checklist</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Aldrete Post-Anesthesia Recovery Scoring (PACU) */}
      {selectedSurgeryForPacu && (
        <div className="ot-modal-overlay">
          <div className="ot-modal" style={{ maxWidth: '700px' }}>
            <div className="ot-modal-header">
              <h3>PACU Post-Anesthesia Recovery Scoring (Modified Aldrete Score)</h3>
              <button className="ot-modal-close" onClick={() => setSelectedSurgeryForPacu(null)}>&times;</button>
            </div>
            <form onSubmit={handleSavePacuRecord}>
              <div className="ot-modal-body">
                <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13px' }}>
                  Patient: <strong>{selectedSurgeryForPacu.patientName}</strong> • Procedure: <strong>{selectedSurgeryForPacu.surgeryName}</strong> • Room: <strong>{selectedSurgeryForPacu.otRoomId}</strong>
                </div>

                <div className="aldrete-grid">
                  <div className="aldrete-row">
                    <label>1. Activity (Motor Function)</label>
                    <select 
                      value={selectedSurgeryForPacu.pacuRecord.aldreteScore.activity}
                      onChange={e => {
                        const updated = { ...selectedSurgeryForPacu };
                        updated.pacuRecord.aldreteScore.activity = Number(e.target.value);
                        setSelectedSurgeryForPacu(updated);
                      }}
                      style={{ width: '320px' }}
                    >
                      <option value="2">2 - Able to move 4 extremities voluntarily or on command</option>
                      <option value="1">1 - Able to move 2 extremities voluntarily</option>
                      <option value="0">0 - Unable to move extremities / flaccid</option>
                    </select>
                  </div>

                  <div className="aldrete-row">
                    <label>2. Respiration</label>
                    <select 
                      value={selectedSurgeryForPacu.pacuRecord.aldreteScore.respiration}
                      onChange={e => {
                        const updated = { ...selectedSurgeryForPacu };
                        updated.pacuRecord.aldreteScore.respiration = Number(e.target.value);
                        setSelectedSurgeryForPacu(updated);
                      }}
                      style={{ width: '320px' }}
                    >
                      <option value="2">2 - Able to breathe deeply and cough freely</option>
                      <option value="1">1 - Dyspneic, shallow, or limited breathing</option>
                      <option value="0">0 - Apneic or airway obstructed</option>
                    </select>
                  </div>

                  <div className="aldrete-row">
                    <label>3. Circulation (Blood Pressure)</label>
                    <select 
                      value={selectedSurgeryForPacu.pacuRecord.aldreteScore.circulation}
                      onChange={e => {
                        const updated = { ...selectedSurgeryForPacu };
                        updated.pacuRecord.aldreteScore.circulation = Number(e.target.value);
                        setSelectedSurgeryForPacu(updated);
                      }}
                      style={{ width: '320px' }}
                    >
                      <option value="2">2 - BP ± 20 mm Hg of pre-op baseline</option>
                      <option value="1">1 - BP ± 20–50 mm Hg of baseline</option>
                      <option value="0">0 - BP ± 50 mm Hg of baseline</option>
                    </select>
                  </div>

                  <div className="aldrete-row">
                    <label>4. Consciousness</label>
                    <select 
                      value={selectedSurgeryForPacu.pacuRecord.aldreteScore.consciousness}
                      onChange={e => {
                        const updated = { ...selectedSurgeryForPacu };
                        updated.pacuRecord.aldreteScore.consciousness = Number(e.target.value);
                        setSelectedSurgeryForPacu(updated);
                      }}
                      style={{ width: '320px' }}
                    >
                      <option value="2">2 - Fully awake and oriented</option>
                      <option value="1">1 - Arousable on calling</option>
                      <option value="0">0 - Not responding / unarousable</option>
                    </select>
                  </div>

                  <div className="aldrete-row">
                    <label>5. Oxygen Saturation (SpO2)</label>
                    <select 
                      value={selectedSurgeryForPacu.pacuRecord.aldreteScore.oxygenSaturation}
                      onChange={e => {
                        const updated = { ...selectedSurgeryForPacu };
                        updated.pacuRecord.aldreteScore.oxygenSaturation = Number(e.target.value);
                        setSelectedSurgeryForPacu(updated);
                      }}
                      style={{ width: '320px' }}
                    >
                      <option value="2">2 - SpO2 &gt; 92% on room air</option>
                      <option value="1">1 - Requires supplemental O2 to maintain SpO2 &gt; 90%</option>
                      <option value="0">0 - SpO2 &lt; 90% even with oxygen</option>
                    </select>
                  </div>
                </div>

                {/* Score Summary Box */}
                <div style={{ background: '#eff6ff', padding: '14px', borderRadius: '8px', border: '1px solid #bfdbfe', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontSize: '12px', color: '#1e40af', fontWeight: 'bold' }}>TOTAL ALDRETE RECOVERY SCORE</span>
                    <div style={{ fontSize: '22px', fontWeight: '900', color: '#1e3a8a' }}>
                      {Number(selectedSurgeryForPacu.pacuRecord.aldreteScore.activity) +
                       Number(selectedSurgeryForPacu.pacuRecord.aldreteScore.respiration) +
                       Number(selectedSurgeryForPacu.pacuRecord.aldreteScore.circulation) +
                       Number(selectedSurgeryForPacu.pacuRecord.aldreteScore.consciousness) +
                       Number(selectedSurgeryForPacu.pacuRecord.aldreteScore.oxygenSaturation)} / 10
                    </div>
                  </div>
                  <div>
                    {(Number(selectedSurgeryForPacu.pacuRecord.aldreteScore.activity) +
                      Number(selectedSurgeryForPacu.pacuRecord.aldreteScore.respiration) +
                      Number(selectedSurgeryForPacu.pacuRecord.aldreteScore.circulation) +
                      Number(selectedSurgeryForPacu.pacuRecord.aldreteScore.consciousness) +
                      Number(selectedSurgeryForPacu.pacuRecord.aldreteScore.oxygenSaturation)) >= 9 ? (
                      <span className="ot-badge ot-badge-completed" style={{ fontSize: '13px', padding: '6px 12px' }}>
                        Ready for Ward Discharge (&ge;9)
                      </span>
                    ) : (
                      <span className="ot-badge ot-badge-pacu" style={{ fontSize: '13px', padding: '6px 12px' }}>
                        Continued PACU Monitoring Needed
                      </span>
                    )}
                  </div>
                </div>

                <div className="ot-form-group">
                  <label>PACU Clinical Notes & Pain NRS Score (0-10)</label>
                  <textarea 
                    rows="2"
                    value={selectedSurgeryForPacu.pacuRecord.pacuNotes}
                    onChange={e => {
                      const updated = { ...selectedSurgeryForPacu };
                      updated.pacuRecord.pacuNotes = e.target.value;
                      setSelectedSurgeryForPacu(updated);
                    }}
                    placeholder="e.g. Hemodynamically stable, extubated, surgical dressing clean and dry."
                  ></textarea>
                </div>
              </div>

              <div className="ot-modal-footer">
                <button type="button" className="ot-btn ot-btn-secondary" onClick={() => setSelectedSurgeryForPacu(null)}>Cancel</button>
                <button type="submit" className="ot-btn ot-btn-primary">Save PACU Record</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Register CSSD Tray */}
      {showAddCssdTrayModal && (
        <div className="ot-modal-overlay">
          <div className="ot-modal">
            <div className="ot-modal-header">
              <h3>Register New CSSD Sterile Instrument Tray</h3>
              <button className="ot-modal-close" onClick={() => setShowAddCssdTrayModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleAddCssdTray}>
              <div className="ot-modal-body">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div className="ot-form-group">
                    <label>Tray ID / Barcode</label>
                    <input 
                      type="text" 
                      required 
                      value={newTrayForm.trayId} 
                      onChange={e => setNewTrayForm({ ...newTrayForm, trayId: e.target.value })}
                    />
                  </div>

                  <div className="ot-form-group">
                    <label>Tray / Set Name</label>
                    <input 
                      type="text" 
                      required 
                      placeholder="e.g. Major Laparotomy Set"
                      value={newTrayForm.trayName} 
                      onChange={e => setNewTrayForm({ ...newTrayForm, trayName: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div className="ot-form-group">
                    <label>Department / Specialty</label>
                    <select 
                      value={newTrayForm.department} 
                      onChange={e => setNewTrayForm({ ...newTrayForm, department: e.target.value })}
                    >
                      {SURGICAL_SPECIALTIES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>

                  <div className="ot-form-group">
                    <label>Total Instrument Count</label>
                    <input 
                      type="number" 
                      required 
                      value={newTrayForm.instrumentCount} 
                      onChange={e => setNewTrayForm({ ...newTrayForm, instrumentCount: Number(e.target.value) })}
                    />
                  </div>
                </div>

                <div className="ot-form-group">
                  <label>Sterilization Method</label>
                  <select 
                    value={newTrayForm.sterilizationMethod} 
                    onChange={e => setNewTrayForm({ ...newTrayForm, sterilizationMethod: e.target.value })}
                  >
                    <option value="Steam Autoclave (Class B - 134°C / 30 psi)">Steam Autoclave (Class B - 134°C / 30 psi)</option>
                    <option value="Low-Temp Hydrogen Peroxide Gas Plasma (Sterrad)">Low-Temp Hydrogen Peroxide Gas Plasma (Sterrad)</option>
                    <option value="Ethylene Oxide (EtO Gas Sterilization)">Ethylene Oxide (EtO Gas Sterilization)</option>
                  </select>
                </div>

                <div className="ot-form-group">
                  <label>Chemical & Biological Indicator Validation Status</label>
                  <input 
                    type="text" 
                    required 
                    value={newTrayForm.biAndCiValidation} 
                    onChange={e => setNewTrayForm({ ...newTrayForm, biAndCiValidation: e.target.value })}
                  />
                </div>
              </div>

              <div className="ot-modal-footer">
                <button type="button" className="ot-btn ot-btn-secondary" onClick={() => setShowAddCssdTrayModal(false)}>Cancel</button>
                <button type="submit" className="ot-btn ot-btn-primary">Register Sterile Tray</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Run Sterilization Cycle */}
      {showRunCycleModal && (
        <div className="ot-modal-overlay">
          <div className="ot-modal">
            <div className="ot-modal-header">
              <h3>Log CSSD Autoclave / Sterilization Cycle</h3>
              <button className="ot-modal-close" onClick={() => setShowRunCycleModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleRunCssdCycle}>
              <div className="ot-modal-body">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div className="ot-form-group">
                    <label>Machine / Chamber Unit</label>
                    <input 
                      type="text" 
                      required 
                      value={newCycleForm.machineId} 
                      onChange={e => setNewCycleForm({ ...newCycleForm, machineId: e.target.value })}
                    />
                  </div>

                  <div className="ot-form-group">
                    <label>Cycle Program Type</label>
                    <input 
                      type="text" 
                      required 
                      value={newCycleForm.cycleType} 
                      onChange={e => setNewCycleForm({ ...newCycleForm, cycleType: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div className="ot-form-group">
                    <label>Peak Chamber Temperature</label>
                    <input 
                      type="text" 
                      required 
                      value={newCycleForm.peakTemperature} 
                      onChange={e => setNewCycleForm({ ...newCycleForm, peakTemperature: e.target.value })}
                    />
                  </div>

                  <div className="ot-form-group">
                    <label>Holding / Plateau Time</label>
                    <input 
                      type="text" 
                      required 
                      value={newCycleForm.holdingTimeMin} 
                      onChange={e => setNewCycleForm({ ...newCycleForm, holdingTimeMin: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div className="ot-form-group">
                    <label>Bowie-Dick Air Removal Test</label>
                    <input 
                      type="text" 
                      required 
                      value={newCycleForm.bowieDickTest} 
                      onChange={e => setNewCycleForm({ ...newCycleForm, bowieDickTest: e.target.value })}
                    />
                  </div>

                  <div className="ot-form-group">
                    <label>Biological Indicator (BI) Spore Result</label>
                    <input 
                      type="text" 
                      required 
                      value={newCycleForm.biologicalIndicator} 
                      onChange={e => setNewCycleForm({ ...newCycleForm, biologicalIndicator: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="ot-modal-footer">
                <button type="button" className="ot-btn ot-btn-secondary" onClick={() => setShowRunCycleModal(false)}>Cancel</button>
                <button type="submit" className="ot-btn ot-btn-success">Validate & Log Cycle</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
