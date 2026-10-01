import React, { useState, useEffect } from 'react';
import './TriageDashboard.css';

export default function TriageDashboard({ onLogout, loggedInStaff }) {
  const [activeTab, setActiveTab] = useState('queue'); // 'queue' | 'attendance' | 'procedures' | 'inventory' | 'protocols'

  const [appointments, setAppointments] = useState(() => {
    return JSON.parse(localStorage.getItem('dhms_appointments') || '[]');
  });
  const [patients, setPatients] = useState(() => {
    return JSON.parse(localStorage.getItem('dhms_patients') || '[]');
  });
  const [doctorsRoster, setDoctorsRoster] = useState(() => {
    return JSON.parse(localStorage.getItem('dhms_doctors') || '[]');
  });

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDoctorFilter, setSelectedDoctorFilter] = useState('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('pending'); // 'all' | 'pending' | 'recorded'
  const [selectedUrgencyFilter, setSelectedUrgencyFilter] = useState('all'); // 'all' | 'Routine' | 'Urgent' | 'Emergency'

  // Vitals Entry Modal & Form
  const [selectedApptForVitals, setSelectedApptForVitals] = useState(null);
  const [vitalsForm, setVitalsForm] = useState({
    sysBP: '120',
    diaBP: '80',
    pulse: '72',
    temperature: '98.6',
    spo2: '98',
    respRate: '16',
    weight: '68',
    height: '170',
    bloodGlucose: '',
    painScore: '0',
    allergies: 'None',
    chiefComplaint: '',
    triageLevel: 'Routine (Green)',
    nurseNotes: ''
  });

  // Nurse Shift Attendance State
  const nurseName = loggedInStaff?.name || 'Staff Nurse (OPD)';
  const nurseId = loggedInStaff?.id || 'NUR-101';
  const todayDateStr = new Date().toISOString().split('T')[0];

  const [attendanceRecords, setAttendanceRecords] = useState(() => {
    const all = JSON.parse(localStorage.getItem('dhms_master_attendance') || '[]');
    return all.filter(a => a.module === 'OPD Triage' || a.role?.includes('Nurse') || a.role?.includes('Triage'));
  });

  const [nurseAttendanceForm, setNurseAttendanceForm] = useState({
    date: todayDateStr,
    shift: 'Morning OPD (08:00 AM - 02:00 PM)',
    bay: 'OPD Nursing Desk 1',
    status: 'Present (On Duty)',
    checkIn: '08:00 AM',
    checkOut: '02:00 PM',
    handoverNotes: ''
  });

  // OPD Minor Procedures & Injections State
  const [proceduresList, setProceduresList] = useState(() => {
    const saved = localStorage.getItem('dhms_nurse_procedures');
    if (saved) return JSON.parse(saved);
    return [
      {
        id: 'PROC-101',
        patientName: 'John Doe',
        patientId: 'PT-1001',
        procedureType: 'IM Injection (Tetanus Toxoid 0.5ml)',
        prescribedBy: 'Dr. Sarah Smith',
        bay: 'OPD Injection Room',
        administeredAt: '09:30 AM',
        date: todayDateStr,
        consumables: '1x TT Ampoule, 1x 2ml Syringe, Alcohol Swab',
        status: 'Completed',
        nurseNotes: 'Administered in right deltoid. No adverse reaction observed.'
      },
      {
        id: 'PROC-102',
        patientName: 'Mary Johnson',
        patientId: 'PT-1002',
        procedureType: 'Wound Dressing & Antiseptic Bandaging',
        prescribedBy: 'Dr. David Miller',
        bay: 'Minor Dressing Station',
        administeredAt: '10:15 AM',
        date: todayDateStr,
        consumables: 'Sterile Gauze, Betadine, Microfoam Tape',
        status: 'Completed',
        nurseNotes: 'Cleaned superficial laceration on left forearm, sterile dressing applied.'
      }
    ];
  });

  const [showAddProcModal, setShowAddProcModal] = useState(false);
  const [procForm, setProcForm] = useState({
    patientName: '',
    patientId: '',
    procedureType: 'IM Injection (Tetanus Toxoid 0.5ml)',
    prescribedBy: 'Dr. Sarah Smith',
    bay: 'OPD Injection Room',
    consumables: '1x Disposable Syringe, Alcohol Swab',
    nurseNotes: ''
  });

  // Nursing Station Consumables Inventory
  const [nurseSupplies, setNurseSupplies] = useState(() => {
    const saved = localStorage.getItem('dhms_nurse_supplies');
    if (saved) return JSON.parse(saved);
    return [
      { item: 'Disposable Syringes (2ml / 5ml)', stock: 85, unit: 'pcs', minThreshold: 20, status: 'Adequate' },
      { item: 'Alcohol & Betadine Prep Swabs', stock: 120, unit: 'pcs', minThreshold: 30, status: 'Adequate' },
      { item: 'IV Cannula (20G / 22G)', stock: 40, unit: 'pcs', minThreshold: 15, status: 'Adequate' },
      { item: 'Sterile Gauze & Roller Bandages', stock: 65, unit: 'rolls', minThreshold: 20, status: 'Adequate' },
      { item: 'Normal Saline (0.9% NS 500ml)', stock: 18, unit: 'bottles', minThreshold: 10, status: 'Adequate' },
      { item: 'Nebulizer Masks & Tubing', stock: 12, unit: 'sets', minThreshold: 5, status: 'Adequate' },
      { item: 'Blood Glucose Test Strips (Accu-Chek)', stock: 90, unit: 'strips', minThreshold: 25, status: 'Adequate' },
      { item: 'Latex Examination Gloves (M/L)', stock: 140, unit: 'pairs', minThreshold: 50, status: 'Adequate' },
      { item: 'Disposable Pulse Oximeter Probes', stock: 25, unit: 'pcs', minThreshold: 8, status: 'Adequate' }
    ];
  });

  // Emergency Crash Cart Broadcast Modal
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [emergencyAlertText, setEmergencyAlertText] = useState('');

  useEffect(() => {
    const handleStorage = () => {
      setAppointments(JSON.parse(localStorage.getItem('dhms_appointments') || '[]'));
      setPatients(JSON.parse(localStorage.getItem('dhms_patients') || '[]'));
      setDoctorsRoster(JSON.parse(localStorage.getItem('dhms_doctors') || '[]'));
      const allAtt = JSON.parse(localStorage.getItem('dhms_master_attendance') || '[]');
      setAttendanceRecords(allAtt.filter(a => a.module === 'OPD Triage' || a.role?.includes('Nurse') || a.role?.includes('Triage')));
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  // Attendance submission
  const handleMarkNurseAttendance = (e) => {
    e.preventDefault();
    const allAtt = JSON.parse(localStorage.getItem('dhms_master_attendance') || '[]');
    const newRecord = {
      id: `ATT-NUR-${Math.floor(1000 + Math.random() * 9000)}`,
      date: nurseAttendanceForm.date,
      module: 'OPD Triage',
      staffId: nurseId,
      staffName: nurseName,
      role: 'Staff Nurse (OPD Triage)',
      shift: nurseAttendanceForm.shift,
      bay: nurseAttendanceForm.bay,
      checkIn: nurseAttendanceForm.status === 'Absent' || nurseAttendanceForm.status === 'On Leave' ? '-' : nurseAttendanceForm.checkIn,
      checkOut: nurseAttendanceForm.status === 'Absent' || nurseAttendanceForm.status === 'On Leave' ? '-' : nurseAttendanceForm.checkOut,
      status: nurseAttendanceForm.status,
      remarks: nurseAttendanceForm.handoverNotes ? `[${nurseAttendanceForm.bay}] ${nurseAttendanceForm.handoverNotes}` : `Shift Duty at ${nurseAttendanceForm.bay}`
    };

    const idx = allAtt.findIndex(a => a.date === newRecord.date && a.staffId === newRecord.staffId && a.module === 'OPD Triage');
    let updated;
    if (idx >= 0) {
      updated = [...allAtt];
      updated[idx] = newRecord;
    } else {
      updated = [newRecord, ...allAtt];
    }

    localStorage.setItem('dhms_master_attendance', JSON.stringify(updated));
    setAttendanceRecords(updated.filter(a => a.module === 'OPD Triage' || a.role?.includes('Nurse') || a.role?.includes('Triage')));
    alert(`✓ Duty shift attendance successfully recorded for ${nurseName} (${nurseAttendanceForm.status} - ${nurseAttendanceForm.shift})!`);
  };

  // Open vitals entry modal
  const openVitalsModal = (appt) => {
    const existing = appt.vitals || {};
    let sys = '120';
    let dia = '80';
    if (existing.bp && existing.bp.includes('/')) {
      const parts = existing.bp.split('/');
      sys = parts[0] || '120';
      dia = parts[1] || '80';
    }

    setVitalsForm({
      sysBP: existing.sysBP || sys,
      diaBP: existing.diaBP || dia,
      pulse: existing.hr ? String(existing.hr).replace(/\D/g, '') : (existing.pulse ? String(existing.pulse).replace(/\D/g, '') : '72'),
      temperature: existing.temp ? String(existing.temp).replace(/[^0-9.]/g, '') : '98.6',
      spo2: existing.spo2 ? String(existing.spo2).replace(/\D/g, '') : '98',
      respRate: existing.respRate || '16',
      weight: existing.weight ? String(existing.weight).replace(/[^0-9.]/g, '') : '68',
      height: existing.height ? String(existing.height).replace(/[^0-9.]/g, '') : '170',
      bloodGlucose: existing.bloodGlucose || '',
      painScore: existing.painScore || '0',
      allergies: existing.allergies || 'None',
      chiefComplaint: existing.chiefComplaint || appt.reason || '',
      triageLevel: existing.triageLevel || 'Routine (Green)',
      nurseNotes: existing.nurseNotes || ''
    });
    setSelectedApptForVitals(appt);
  };

  // BMI Calculation Helper
  const calculateBMI = (wtKg, htCm) => {
    const w = parseFloat(wtKg);
    const h = parseFloat(htCm) / 100;
    if (w > 0 && h > 0) {
      const bmi = (w / (h * h)).toFixed(1);
      let cat = 'Normal Weight';
      if (bmi < 18.5) cat = 'Underweight';
      else if (bmi >= 25 && bmi < 30) cat = 'Overweight';
      else if (bmi >= 30) cat = 'Obese';
      return { val: bmi, cat };
    }
    return null;
  };

  const handleSaveVitals = (e) => {
    e.preventDefault();
    if (!selectedApptForVitals) return;

    const bpStr = `${vitalsForm.sysBP}/${vitalsForm.diaBP}`;
    const bmiData = calculateBMI(vitalsForm.weight, vitalsForm.height);

    const recordedVitalsObj = {
      bp: bpStr,
      sysBP: vitalsForm.sysBP,
      diaBP: vitalsForm.diaBP,
      hr: vitalsForm.pulse,
      pulse: `${vitalsForm.pulse} bpm`,
      temp: vitalsForm.temperature,
      spo2: vitalsForm.spo2,
      respRate: `${vitalsForm.respRate} /min`,
      weight: vitalsForm.weight ? `${vitalsForm.weight} kg` : '-',
      height: vitalsForm.height ? `${vitalsForm.height} cm` : '-',
      bmi: bmiData ? `${bmiData.val} (${bmiData.cat})` : '-',
      bloodGlucose: vitalsForm.bloodGlucose ? `${vitalsForm.bloodGlucose} mg/dL` : 'Normal',
      painScore: vitalsForm.painScore ? `${vitalsForm.painScore} / 10` : '0',
      allergies: vitalsForm.allergies || 'None',
      chiefComplaint: vitalsForm.chiefComplaint.trim() || selectedApptForVitals.reason || 'General OPD Review',
      triageLevel: vitalsForm.triageLevel,
      nurseNotes: vitalsForm.nurseNotes.trim() || 'Checked by OPD Triage Nurse',
      checkedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      checkedBy: nurseName
    };

    // Update dhms_appointments
    const allAppts = JSON.parse(localStorage.getItem('dhms_appointments') || '[]');
    const updatedAppts = allAppts.map(a => {
      if (a.id === selectedApptForVitals.id) {
        return {
          ...a,
          vitals: recordedVitalsObj,
          vitalsRecorded: true,
          triageLevel: vitalsForm.triageLevel,
          triageStatus: 'Completed - Forwarded to Doctor Chamber'
        };
      }
      return a;
    });

    localStorage.setItem('dhms_appointments', JSON.stringify(updatedAppts));
    setAppointments(updatedAppts);

    // Sync to patient profile in dhms_patients
    const allPatients = JSON.parse(localStorage.getItem('dhms_patients') || '[]');
    const updatedPatients = allPatients.map(p => {
      if (p.id === selectedApptForVitals.patientId || p.name?.toLowerCase() === selectedApptForVitals.patientName?.toLowerCase()) {
        const history = p.vitalsHistory || [];
        const newHistoryEntry = {
          id: `VIT-${Date.now()}`,
          date: new Date().toISOString().split('T')[0],
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          doctorName: selectedApptForVitals.doctorName || 'Attending Physician',
          appointmentId: selectedApptForVitals.id,
          ...recordedVitalsObj
        };
        return {
          ...p,
          latestVitals: recordedVitalsObj,
          vitalsHistory: [newHistoryEntry, ...history.filter(h => h.appointmentId !== selectedApptForVitals.id)]
        };
      }
      return p;
    });
    localStorage.setItem('dhms_patients', JSON.stringify(updatedPatients));
    setPatients(updatedPatients);

    if (window.dispatchEvent) {
      window.dispatchEvent(new Event('storage'));
    }

    alert(`✓ Pre-consultation vitals recorded for ${selectedApptForVitals.patientName}!\nDr. ${selectedApptForVitals.doctorName}'s consult chamber has been updated.`);
    setSelectedApptForVitals(null);
  };

  // Add Minor Procedure
  const handleAddProcedure = (e) => {
    e.preventDefault();
    const newP = {
      id: `PROC-${Math.floor(100 + Math.random() * 900)}`,
      patientName: procForm.patientName,
      patientId: procForm.patientId || 'PT-Walkin',
      procedureType: procForm.procedureType,
      prescribedBy: procForm.prescribedBy,
      bay: procForm.bay,
      administeredAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      date: todayDateStr,
      consumables: procForm.consumables,
      status: 'Completed',
      nurseNotes: procForm.nurseNotes || 'Administered under aseptic precautions.'
    };

    const updated = [newP, ...proceduresList];
    setProceduresList(updated);
    localStorage.setItem('dhms_nurse_procedures', JSON.stringify(updated));
    setShowAddProcModal(false);
    setProcForm({
      patientName: '',
      patientId: '',
      procedureType: 'IM Injection (Tetanus Toxoid 0.5ml)',
      prescribedBy: doctorsRoster[0]?.name || 'Dr. Sarah Smith',
      bay: 'OPD Injection Room',
      consumables: '1x Disposable Syringe, Alcohol Swab',
      nurseNotes: ''
    });
    alert(`✓ Procedure logged successfully for ${newP.patientName}!`);
  };

  // Emergency Crash Cart Broadcast
  const handleTriggerEmergency = () => {
    if (!emergencyAlertText.trim()) {
      alert('Please describe the urgent patient location/condition.');
      return;
    }
    const alertMsg = `🚨 CRITICAL OPD NURSE RED-ALERT:\n"${emergencyAlertText.trim()}"\nLocation: OPD Waiting Hall / Bay 1\nBroadcasted by: ${nurseName} at ${new Date().toLocaleTimeString()}`;
    alert(alertMsg + '\n\n✓ Crash Cart Team, ER Medical Officer, and Doctors have been alerted!');
    setShowEmergencyModal(false);
    setEmergencyAlertText('');
  };

  // Helper Alerts
  const getBPStatus = (sys, dia) => {
    const s = parseInt(sys);
    const d = parseInt(dia);
    if (isNaN(s) || isNaN(d)) return null;
    if (s >= 140 || d >= 90) return { label: 'High BP (Stage 1/2)', color: '#dc2626' };
    if (s < 90 || d < 60) return { label: 'Low BP (Hypotension)', color: '#2563eb' };
    return { label: 'Normal BP', color: '#16a34a' };
  };

  // Queue filtering
  const waitingQueue = appointments.filter(a => {
    if (a.status === 'Cancelled' || a.status === 'Discharged') return false;
    if (selectedDoctorFilter !== 'all' && a.doctorName !== selectedDoctorFilter && a.doctorId !== selectedDoctorFilter) {
      return false;
    }
    const hasVitals = !!a.vitalsRecorded || (a.vitals && a.vitals.checkedBy);
    if (selectedStatusFilter === 'pending' && (hasVitals || a.status === 'Completed')) return false;
    if (selectedStatusFilter === 'recorded' && !hasVitals) return false;

    if (selectedUrgencyFilter !== 'all' && a.triageLevel && !a.triageLevel.includes(selectedUrgencyFilter)) {
      return false;
    }

    const query = searchTerm.toLowerCase();
    const pName = (a.patientName || '').toLowerCase();
    const pId = (a.patientId || '').toLowerCase();
    const dName = (a.doctorName || '').toLowerCase();
    return pName.includes(query) || pId.includes(query) || dName.includes(query);
  });

  const pendingCount = appointments.filter(a => a.status !== 'Completed' && a.status !== 'Cancelled' && !a.vitalsRecorded).length;
  const completedVitalsCount = appointments.filter(a => a.vitalsRecorded || (a.vitals && a.vitals.checkedBy)).length;
  const urgentCount = appointments.filter(a => a.triageLevel && (a.triageLevel.includes('Urgent') || a.triageLevel.includes('Emergency'))).length;

  return (
    <div className="triage-container">
      {/* Topbar */}
      <header className="triage-topbar">
        <div className="triage-logo-area">
          <svg className="triage-logo-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
          </svg>
          <span className="triage-logo-text">DHMS</span>
          <span className="triage-logo-divider">/</span>
          <span className="triage-logo-sub">🩺 OPD Nursing & Triage Station</span>
        </div>

        <div className="triage-topbar-right">
          <div className="triage-profile-info">
            <span className="triage-profile-name">{nurseName}</span>
            <span className="triage-profile-role">Staff Nurse (ID: {nurseId})</span>
          </div>
          <button onClick={onLogout} className="triage-logout-btn">Sign Out</button>
        </div>
      </header>

      <div className="triage-body">
        {/* Sidebar */}
        <aside className="triage-sidebar">
          <button 
            className={`triage-nav-btn ${activeTab === 'queue' ? 'active' : ''}`}
            onClick={() => setActiveTab('queue')}
          >
            📋 OPD Patient Queue
          </button>
          <button 
            className={`triage-nav-btn ${activeTab === 'attendance' ? 'active' : ''}`}
            onClick={() => setActiveTab('attendance')}
          >
            ⏱️ Nurse Shift Attendance
          </button>
          <button 
            className={`triage-nav-btn ${activeTab === 'procedures' ? 'active' : ''}`}
            onClick={() => setActiveTab('procedures')}
          >
            💉 Injections & Procedures
          </button>
          <button 
            className={`triage-nav-btn ${activeTab === 'inventory' ? 'active' : ''}`}
            onClick={() => setActiveTab('inventory')}
          >
            📦 Station Consumables
          </button>
          <button 
            className={`triage-nav-btn ${activeTab === 'protocols' ? 'active' : ''}`}
            onClick={() => setActiveTab('protocols')}
          >
            🩺 Clinical Reference Guide
          </button>
        </aside>

        {/* Main Content */}
        <main className="triage-main-content">
          {/* TAB 1: OPD PATIENT QUEUE */}
          {activeTab === 'queue' && (
            <div>
              {/* Stats Grid */}
              <div className="triage-stats-grid">
                <div className="triage-stat-card">
                  <div className="triage-stat-icon" style={{ background: '#fef3c7', color: '#b45309' }}>⏳</div>
                  <div>
                    <div className="triage-stat-val">{pendingCount}</div>
                    <div className="triage-stat-lbl">Pending Vitals Intake</div>
                  </div>
                </div>

                <div className="triage-stat-card">
                  <div className="triage-stat-icon" style={{ background: '#ecfdf5', color: '#059669' }}>✅</div>
                  <div>
                    <div className="triage-stat-val">{completedVitalsCount}</div>
                    <div className="triage-stat-lbl">Vitals Forwarded to Doctor</div>
                  </div>
                </div>

                <div className="triage-stat-card">
                  <div className="triage-stat-icon" style={{ background: '#fee2e2', color: '#dc2626' }}>🚨</div>
                  <div>
                    <div className="triage-stat-val">{urgentCount}</div>
                    <div className="triage-stat-lbl">Urgent / Priority Cases</div>
                  </div>
                </div>

                <div className="triage-stat-card">
                  <div className="triage-stat-icon" style={{ background: '#eff6ff', color: '#2563eb' }}>👨‍⚕️</div>
                  <div>
                    <div className="triage-stat-val">{doctorsRoster.length}</div>
                    <div className="triage-stat-lbl">Active Doctor Chambers</div>
                  </div>
                </div>
              </div>

              {/* Controls Bar */}
              <div className="triage-controls-bar">
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap', flex: 1 }}>
                  <input 
                    type="text" 
                    placeholder="Search Patient Name, UHID, Doctor..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px', width: '280px', maxWidth: '100%' }}
                  />

                  <select 
                    value={selectedDoctorFilter} 
                    onChange={(e) => setSelectedDoctorFilter(e.target.value)}
                    style={{ padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px', background: 'white' }}
                  >
                    <option value="all">All Doctor Chambers</option>
                    {doctorsRoster.map(d => (
                      <option key={d.id} value={d.name}>{d.name} ({d.department})</option>
                    ))}
                  </select>

                  <select 
                    value={selectedUrgencyFilter} 
                    onChange={(e) => setSelectedUrgencyFilter(e.target.value)}
                    style={{ padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px', background: 'white' }}
                  >
                    <option value="all">All Triage Categories</option>
                    <option value="Routine">🟢 Routine Green</option>
                    <option value="Urgent">🟡 Urgent Yellow</option>
                    <option value="Emergency">🔴 Emergency Red</option>
                  </select>

                  <div style={{ display: 'flex', border: '1px solid #cbd5e1', borderRadius: '6px', overflow: 'hidden' }}>
                    <button 
                      onClick={() => setSelectedStatusFilter('pending')}
                      style={{ padding: '7px 12px', border: 'none', background: selectedStatusFilter === 'pending' ? '#059669' : 'white', color: selectedStatusFilter === 'pending' ? 'white' : '#64748b', fontWeight: '600', fontSize: '12px', cursor: 'pointer' }}
                    >
                      Pending ({pendingCount})
                    </button>
                    <button 
                      onClick={() => setSelectedStatusFilter('recorded')}
                      style={{ padding: '7px 12px', border: 'none', background: selectedStatusFilter === 'recorded' ? '#059669' : 'white', color: selectedStatusFilter === 'recorded' ? 'white' : '#64748b', fontWeight: '600', fontSize: '12px', cursor: 'pointer' }}
                    >
                      Recorded ({completedVitalsCount})
                    </button>
                    <button 
                      onClick={() => setSelectedStatusFilter('all')}
                      style={{ padding: '7px 12px', border: 'none', background: selectedStatusFilter === 'all' ? '#059669' : 'white', color: selectedStatusFilter === 'all' ? 'white' : '#64748b', fontWeight: '600', fontSize: '12px', cursor: 'pointer' }}
                    >
                      All Patients
                    </button>
                  </div>
                </div>
              </div>

              {/* Table */}
              {waitingQueue.length === 0 ? (
                <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '40px', textAlign: 'center', color: '#64748b' }}>
                  <div style={{ fontSize: '36px', marginBottom: '8px' }}>🩺</div>
                  <h3 style={{ margin: '0 0 6px 0', color: '#1e293b' }}>No Patients in this Queue</h3>
                  <p style={{ margin: 0, fontSize: '13.5px' }}>All waiting patients have had their vitals checked, or no matching patient found.</p>
                </div>
              ) : (
                <table className="triage-table">
                  <thead>
                    <tr>
                      <th>Patient (UHID)</th>
                      <th>Assigned Doctor & Room</th>
                      <th>Time Slot</th>
                      <th>Triage Urgency</th>
                      <th>Vitals Status</th>
                      <th>Latest Recorded Vitals</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {waitingQueue.map((appt) => {
                      const hasVitals = !!appt.vitalsRecorded || (appt.vitals && appt.vitals.checkedBy);
                      const bpInfo = appt.vitals ? getBPStatus(appt.vitals.sysBP || appt.vitals.bp?.split('/')[0], appt.vitals.diaBP || appt.vitals.bp?.split('/')[1]) : null;
                      const triageColor = appt.triageLevel?.includes('Emergency') || appt.vitals?.triageLevel?.includes('Emergency') 
                        ? '#dc2626' 
                        : (appt.triageLevel?.includes('Urgent') || appt.vitals?.triageLevel?.includes('Urgent') ? '#d97706' : '#16a34a');

                      return (
                        <tr key={appt.id}>
                          <td>
                            <strong>{appt.patientName}</strong>
                            <div style={{ fontSize: '11.5px', color: '#64748b' }}>UHID: {appt.patientId}</div>
                            {appt.vitals?.allergies && appt.vitals.allergies !== 'None' && (
                              <span style={{ fontSize: '10.5px', background: '#fee2e2', color: '#b91c1c', padding: '1px 6px', borderRadius: '4px', fontWeight: '700' }}>
                                ⚠️ Allergy: {appt.vitals.allergies}
                              </span>
                            )}
                          </td>
                          <td>
                            <strong>{appt.doctorName}</strong>
                            <div style={{ fontSize: '11.5px', color: '#64748b' }}>{appt.department}</div>
                          </td>
                          <td>
                            <strong style={{ color: '#0369a1' }}>{appt.time}</strong>
                            <div style={{ fontSize: '11px', color: '#64748b' }}>{appt.date}</div>
                          </td>
                          <td>
                            <span style={{
                              padding: '3px 8px',
                              borderRadius: '4px',
                              fontSize: '11.5px',
                              fontWeight: '700',
                              background: triageColor === '#dc2626' ? '#fee2e2' : (triageColor === '#d97706' ? '#fef3c7' : '#dcfce7'),
                              color: triageColor
                            }}>
                              {appt.triageLevel || appt.vitals?.triageLevel || 'Routine (Green)'}
                            </span>
                          </td>
                          <td>
                            {hasVitals ? (
                              <span className="triage-badge recorded">
                                ✓ Vitals Recorded
                              </span>
                            ) : (
                              <span className="triage-badge pending">
                                ⏳ Pending Vitals Check
                              </span>
                            )}
                          </td>
                          <td>
                            {hasVitals ? (
                              <div style={{ fontSize: '12px', lineHeight: 1.4 }}>
                                <span><strong>BP:</strong> {appt.vitals.bp || '120/80'} mmHg {bpInfo && <small style={{ color: bpInfo.color, fontWeight: 'bold' }}>({bpInfo.label})</small>}</span><br/>
                                <span style={{ color: '#475569' }}>
                                  <strong>HR:</strong> {appt.vitals.hr || appt.vitals.pulse || '72'} bpm • <strong>Temp:</strong> {appt.vitals.temp || '98.6'}°F • <strong>SpO₂:</strong> {appt.vitals.spo2 || '98'}%
                                </span><br/>
                                {appt.vitals.bmi && appt.vitals.bmi !== '-' && (
                                  <span style={{ color: '#64748b', fontSize: '11px' }}><strong>BMI:</strong> {appt.vitals.bmi}</span>
                                )}
                              </div>
                            ) : (
                              <span style={{ color: '#94a3b8', fontSize: '12.5px', fontStyle: 'italic' }}>
                                Not recorded yet
                              </span>
                            )}
                          </td>
                          <td>
                            <button
                              onClick={() => openVitalsModal(appt)}
                              style={{
                                padding: '6px 14px',
                                background: hasVitals ? '#f0fdf4' : '#059669',
                                color: hasVitals ? '#166534' : 'white',
                                border: hasVitals ? '1px solid #bbf7d0' : 'none',
                                borderRadius: '6px',
                                fontSize: '12.5px',
                                fontWeight: '700',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                            >
                              {hasVitals ? '✏️ Edit Vitals' : '🩺 Record Vitals'}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* TAB 2: NURSE SHIFT ATTENDANCE */}
          {activeTab === 'attendance' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: '20px' }}>
              {/* Punch Form */}
              <div style={{ background: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                <h3 style={{ margin: '0 0 16px 0', color: '#1e293b', fontSize: '17px', fontWeight: '800' }}>
                  ⏱️ Log Staff Nurse Duty Attendance
                </h3>

                <form onSubmit={handleMarkNurseAttendance} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div>
                    <label style={{ fontSize: '12.5px', fontWeight: '700', color: '#334155' }}>Staff Nurse Profile</label>
                    <input 
                      type="text" 
                      readOnly 
                      value={`${nurseName} (${nurseId})`}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#f8fafc', fontWeight: '600', boxSizing: 'border-box', marginTop: '4px' }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                      <label style={{ fontSize: '12.5px', fontWeight: '700', color: '#334155' }}>Duty Date</label>
                      <input 
                        type="date" 
                        required
                        value={nurseAttendanceForm.date}
                        onChange={(e) => setNurseAttendanceForm({ ...nurseAttendanceForm, date: e.target.value })}
                        style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box', marginTop: '4px' }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '12.5px', fontWeight: '700', color: '#334155' }}>Duty Shift</label>
                      <select 
                        value={nurseAttendanceForm.shift}
                        onChange={(e) => setNurseAttendanceForm({ ...nurseAttendanceForm, shift: e.target.value })}
                        style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', background: 'white', marginTop: '4px' }}
                      >
                        <option value="Morning OPD (08:00 AM - 02:00 PM)">Morning OPD (08:00 AM - 02:00 PM)</option>
                        <option value="Afternoon OPD (02:00 PM - 08:00 PM)">Afternoon OPD (02:00 PM - 08:00 PM)</option>
                        <option value="General OPD (09:00 AM - 05:00 PM)">General OPD (09:00 AM - 05:00 PM)</option>
                        <option value="Night Duty (08:00 PM - 08:00 AM)">Night Duty (08:00 PM - 08:00 AM)</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                      <label style={{ fontSize: '12.5px', fontWeight: '700', color: '#334155' }}>Assigned Station / Bay</label>
                      <select 
                        value={nurseAttendanceForm.bay}
                        onChange={(e) => setNurseAttendanceForm({ ...nurseAttendanceForm, bay: e.target.value })}
                        style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', background: 'white', marginTop: '4px' }}
                      >
                        <option value="OPD Nursing Desk 1">OPD Nursing Desk 1</option>
                        <option value="OPD Nursing Desk 2">OPD Nursing Desk 2</option>
                        <option value="Triage & Vitals Bay">Triage & Vitals Bay</option>
                        <option value="OPD Minor Procedure Room">OPD Minor Procedure Room</option>
                        <option value="Immunization & Injection Room">Immunization & Injection Room</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ fontSize: '12.5px', fontWeight: '700', color: '#334155' }}>Attendance Status</label>
                      <select 
                        value={nurseAttendanceForm.status}
                        onChange={(e) => setNurseAttendanceForm({ ...nurseAttendanceForm, status: e.target.value })}
                        style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', background: 'white', marginTop: '4px', fontWeight: '700' }}
                      >
                        <option value="Present (On Duty)">🟢 Present (On Duty)</option>
                        <option value="Break / Relieved">🟡 Break / Relieved</option>
                        <option value="Half Day">🔵 Half Day</option>
                        <option value="On Leave">🔴 On Leave</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                      <label style={{ fontSize: '12.5px', fontWeight: '700', color: '#334155' }}>Shift Punch In</label>
                      <input 
                        type="text" 
                        value={nurseAttendanceForm.checkIn}
                        onChange={(e) => setNurseAttendanceForm({ ...nurseAttendanceForm, checkIn: e.target.value })}
                        style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box', marginTop: '4px' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '12.5px', fontWeight: '700', color: '#334155' }}>Shift Punch Out</label>
                      <input 
                        type="text" 
                        value={nurseAttendanceForm.checkOut}
                        onChange={(e) => setNurseAttendanceForm({ ...nurseAttendanceForm, checkOut: e.target.value })}
                        style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box', marginTop: '4px' }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: '12.5px', fontWeight: '700', color: '#334155' }}>Shift Handover Notes / Handover Signoff</label>
                    <textarea 
                      rows="2"
                      placeholder="e.g. Handover taken from Nurse Clara. All 3 BP monitors calibrated. Fasting blood sugar kit stocked."
                      value={nurseAttendanceForm.handoverNotes}
                      onChange={(e) => setNurseAttendanceForm({ ...nurseAttendanceForm, handoverNotes: e.target.value })}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box', marginTop: '4px', resize: 'vertical' }}
                    />
                  </div>

                  <button 
                    type="submit" 
                    style={{ padding: '10px 16px', background: '#059669', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', marginTop: '6px' }}
                  >
                    ✓ Submit Shift Attendance
                  </button>
                </form>
              </div>

              {/* Attendance Log Table */}
              <div style={{ background: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                <h3 style={{ margin: '0 0 16px 0', color: '#1e293b', fontSize: '17px', fontWeight: '800' }}>
                  📋 Nurse Attendance & Shift Records ({attendanceRecords.length})
                </h3>

                {attendanceRecords.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
                    No nurse attendance logs recorded yet for this roster.
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table className="triage-table">
                      <thead>
                        <tr>
                          <th>Date & Staff</th>
                          <th>Shift & Station</th>
                          <th>Timing</th>
                          <th>Status</th>
                          <th>Handover Remarks</th>
                        </tr>
                      </thead>
                      <tbody>
                        {attendanceRecords.map((att, idx) => (
                          <tr key={att.id || idx}>
                            <td>
                              <strong>{att.staffName}</strong>
                              <div style={{ fontSize: '11px', color: '#64748b' }}>{att.date} • ID: {att.staffId}</div>
                            </td>
                            <td>
                              <div style={{ fontSize: '12px', fontWeight: '600' }}>{att.shift || 'General OPD'}</div>
                              <div style={{ fontSize: '11px', color: '#059669' }}>{att.bay || 'OPD Desk'}</div>
                            </td>
                            <td>
                              <span style={{ fontSize: '12px' }}>{att.checkIn} - {att.checkOut}</span>
                            </td>
                            <td>
                              <span style={{
                                padding: '3px 8px',
                                borderRadius: '4px',
                                fontSize: '11px',
                                fontWeight: '700',
                                background: att.status?.includes('Present') ? '#dcfce7' : '#fee2e2',
                                color: att.status?.includes('Present') ? '#15803d' : '#b91c1c'
                              }}>
                                {att.status}
                              </span>
                            </td>
                            <td style={{ fontSize: '12px', color: '#475569' }}>
                              {att.remarks || '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: MINOR PROCEDURES & INJECTIONS */}
          {activeTab === 'procedures' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div>
                  <h3 style={{ margin: '0 0 4px 0', fontSize: '18px', color: '#1e293b', fontWeight: '800' }}>
                    💉 OPD Minor Procedures & Injection Station
                  </h3>
                  <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
                    Record outpatient injections, wound dressings, nebulizations, and ECGs administered by the nurse.
                  </p>
                </div>
                <button
                  onClick={() => setShowAddProcModal(true)}
                  style={{
                    padding: '9px 16px',
                    background: '#059669',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: '700',
                    fontSize: '13px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  ➕ Log New Procedure / Injection
                </button>
              </div>

              <table className="triage-table">
                <thead>
                  <tr>
                    <th>Procedure Type</th>
                    <th>Patient Name (UHID)</th>
                    <th>Prescribing Doctor</th>
                    <th>Bay / Location</th>
                    <th>Administered Time</th>
                    <th>Consumables Used</th>
                    <th>Nurse Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {proceduresList.map((proc) => (
                    <tr key={proc.id}>
                      <td>
                        <strong style={{ color: '#0f172a' }}>{proc.procedureType}</strong>
                        <div style={{ fontSize: '11px', color: '#059669', fontWeight: '600' }}>✓ {proc.status}</div>
                      </td>
                      <td>
                        <strong>{proc.patientName}</strong>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>ID: {proc.patientId}</div>
                      </td>
                      <td>
                        <span style={{ fontSize: '12.5px' }}>{proc.prescribedBy}</span>
                      </td>
                      <td>
                        <span style={{ fontSize: '12px', color: '#475569' }}>{proc.bay}</span>
                      </td>
                      <td>
                        <strong style={{ color: '#0369a1' }}>{proc.administeredAt}</strong>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>{proc.date}</div>
                      </td>
                      <td style={{ fontSize: '12px', color: '#64748b' }}>
                        {proc.consumables}
                      </td>
                      <td style={{ fontSize: '12px', color: '#334155' }}>
                        {proc.nurseNotes}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 4: STATION CONSUMABLES & INVENTORY */}
          {activeTab === 'inventory' && (
            <div style={{ background: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div>
                  <h3 style={{ margin: '0 0 4px 0', fontSize: '18px', color: '#1e293b', fontWeight: '800' }}>
                    📦 OPD Nursing Station Consumables & Emergency Kit
                  </h3>
                  <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
                    Live daily stock count of triage equipment, disposables, and sterile materials.
                  </p>
                </div>
                <button
                  onClick={() => alert('✓ Restock Requisition Form dispatched to Central Pharmacy & Stores Desk!')}
                  style={{
                    padding: '8px 16px',
                    background: '#2563eb',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: '700',
                    fontSize: '13px',
                    cursor: 'pointer'
                  }}
                >
                  📨 Request Restock from Pharmacy
                </button>
              </div>

              <table className="triage-table">
                <thead>
                  <tr>
                    <th>Item Description</th>
                    <th>Current Quantity</th>
                    <th>Unit</th>
                    <th>Minimum Threshold</th>
                    <th>Stock Health Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {nurseSupplies.map((sup, idx) => (
                    <tr key={idx}>
                      <td><strong>{sup.item}</strong></td>
                      <td><strong style={{ color: '#0f172a', fontSize: '15px' }}>{sup.stock}</strong></td>
                      <td>{sup.unit}</td>
                      <td>{sup.minThreshold} {sup.unit}</td>
                      <td>
                        <span style={{
                          padding: '3px 8px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: '700',
                          background: sup.stock > sup.minThreshold ? '#dcfce7' : '#fee2e2',
                          color: sup.stock > sup.minThreshold ? '#15803d' : '#b91c1c'
                        }}>
                          {sup.stock > sup.minThreshold ? 'Adequate' : 'Low Stock'}
                        </span>
                      </td>
                      <td>
                        <button
                          onClick={() => {
                            const newCount = prompt(`Update stock count for ${sup.item}:`, sup.stock);
                            if (newCount !== null) {
                              const parsed = parseInt(newCount) || 0;
                              const updated = [...nurseSupplies];
                              updated[idx].stock = parsed;
                              setNurseSupplies(updated);
                              localStorage.setItem('dhms_nurse_supplies', JSON.stringify(updated));
                            }
                          }}
                          style={{ padding: '4px 10px', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}
                        >
                          ✏️ Update Count
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 5: CLINICAL PROTOCOLS */}
          {activeTab === 'protocols' && (
            <div style={{ background: 'white', padding: '28px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <h2 style={{ margin: '0 0 16px 0', color: '#1e293b' }}>OPD Triage Vitals Standard Clinical Guide</h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <h4 style={{ margin: '0 0 8px 0', color: '#0f172a' }}>🩸 Blood Pressure (mmHg)</h4>
                  <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: '#334155', lineHeight: '1.6' }}>
                    <li><strong>Normal:</strong> Systolic &lt; 120 and Diastolic &lt; 80</li>
                    <li><strong>Elevated:</strong> Systolic 120-129 and Diastolic &lt; 80</li>
                    <li><strong>Stage 1 Hypertension:</strong> Systolic 130-139 or Diastolic 80-89</li>
                    <li><strong>Stage 2 Hypertension:</strong> Systolic ≥ 140 or Diastolic ≥ 90 (Notify Doctor immediately)</li>
                  </ul>
                </div>

                <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <h4 style={{ margin: '0 0 8px 0', color: '#0f172a' }}>🫁 Pulse Oximetry (SpO₂) & Heart Rate</h4>
                  <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: '#334155', lineHeight: '1.6' }}>
                    <li><strong>SpO₂ Normal:</strong> 95% - 100% on Room Air</li>
                    <li><strong>SpO₂ Critical Hypoxia:</strong> &lt; 92% (Alert attending doctor & prepare O2 support)</li>
                    <li><strong>Resting Heart Rate:</strong> 60 - 100 BPM (Normal)</li>
                    <li><strong>Tachycardia:</strong> &gt; 100 BPM • <strong>Bradycardia:</strong> &lt; 60 BPM</li>
                  </ul>
                </div>

                <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <h4 style={{ margin: '0 0 8px 0', color: '#0f172a' }}>🌡️ Temperature & Respiratory Rate</h4>
                  <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: '#334155', lineHeight: '1.6' }}>
                    <li><strong>Normal Temp:</strong> 97.8°F - 99.1°F (Average: 98.6°F)</li>
                    <li><strong>Pyrexia / Fever:</strong> ≥ 100.4°F (Offer Paracetamol if prescribed)</li>
                    <li><strong>Respiratory Rate:</strong> 12 - 20 breaths/min (Adult)</li>
                  </ul>
                </div>

                <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <h4 style={{ margin: '0 0 8px 0', color: '#0f172a' }}>🔴 Triage Urgency Categorization</h4>
                  <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: '#334155', lineHeight: '1.6' }}>
                    <li><strong>🟢 Green (Routine):</strong> Stable vitals, routine consultations.</li>
                    <li><strong>🟡 Yellow (Urgent):</strong> High fever, severe pain, BP &gt; 160/100.</li>
                    <li><strong>🔴 Red (Emergency):</strong> Chest pain, SpO2 &lt; 90%, altered sensorium.</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Vitals Input Modal */}
      {selectedApptForVitals && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 99999 }}>
          <div style={{ background: 'white', borderRadius: '12px', width: '620px', maxWidth: '94vw', maxHeight: '92vh', overflowY: 'auto', padding: '24px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px', marginBottom: '16px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', color: '#1e293b', fontWeight: '800' }}>
                  🩺 Pre-Consultation Vitals Intake (OPD Triage)
                </h3>
                <span style={{ fontSize: '12.5px', color: '#64748b' }}>
                  Patient: <strong>{selectedApptForVitals.patientName}</strong> (UHID: {selectedApptForVitals.patientId}) • Doctor: <strong>{selectedApptForVitals.doctorName}</strong>
                </span>
              </div>
              <button onClick={() => setSelectedApptForVitals(null)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#64748b' }}>&times;</button>
            </div>

            <form onSubmit={handleSaveVitals} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Triage Urgency Level */}
              <div>
                <label style={{ fontSize: '12.5px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '4px' }}>
                  Triage Priority Classification
                </label>
                <select 
                  value={vitalsForm.triageLevel}
                  onChange={(e) => setVitalsForm({ ...vitalsForm, triageLevel: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontWeight: '700', background: 'white' }}
                >
                  <option value="Routine (Green)">🟢 Routine (Green) - Standard OPD Queue</option>
                  <option value="Urgent (Yellow)">🟡 Urgent (Yellow) - Needs Priority Attention</option>
                  <option value="Emergency (Red)">🔴 Emergency (Red) - Critical / Immediate Chamber Call</option>
                </select>
              </div>

              {/* BP & Pulse */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12.5px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '4px' }}>
                    Blood Pressure (Systolic / Diastolic) <span style={{ color: 'red' }}>*</span>
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <input 
                      type="number" 
                      min="50" 
                      max="260" 
                      required 
                      placeholder="120"
                      value={vitalsForm.sysBP}
                      onChange={(e) => setVitalsForm({ ...vitalsForm, sysBP: e.target.value })}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', fontWeight: '700', textAlign: 'center' }}
                    />
                    <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#64748b' }}>/</span>
                    <input 
                      type="number" 
                      min="30" 
                      max="160" 
                      required 
                      placeholder="80"
                      value={vitalsForm.diaBP}
                      onChange={(e) => setVitalsForm({ ...vitalsForm, diaBP: e.target.value })}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', fontWeight: '700', textAlign: 'center' }}
                    />
                    <span style={{ fontSize: '11.5px', color: '#64748b' }}>mmHg</span>
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '12.5px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '4px' }}>
                    Pulse / Heart Rate <span style={{ color: 'red' }}>*</span>
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <input 
                      type="number" 
                      min="30" 
                      max="220" 
                      required 
                      placeholder="72"
                      value={vitalsForm.pulse}
                      onChange={(e) => setVitalsForm({ ...vitalsForm, pulse: e.target.value })}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', fontWeight: '700' }}
                    />
                    <span style={{ fontSize: '11.5px', color: '#64748b' }}>BPM</span>
                  </div>
                </div>
              </div>

              {/* Temperature, SpO2 & Respiratory Rate */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '4px' }}>
                    Body Temp (°F) *
                  </label>
                  <input 
                    type="number" 
                    step="0.1" 
                    min="90" 
                    max="110" 
                    required 
                    placeholder="98.6"
                    value={vitalsForm.temperature}
                    onChange={(e) => setVitalsForm({ ...vitalsForm, temperature: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', fontWeight: '700', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '4px' }}>
                    SpO₂ Saturation (%) *
                  </label>
                  <input 
                    type="number" 
                    min="50" 
                    max="100" 
                    required 
                    placeholder="98"
                    value={vitalsForm.spo2}
                    onChange={(e) => setVitalsForm({ ...vitalsForm, spo2: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', fontWeight: '700', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '4px' }}>
                    Resp. Rate (/min)
                  </label>
                  <input 
                    type="number" 
                    min="8" 
                    max="60" 
                    placeholder="16"
                    value={vitalsForm.respRate}
                    onChange={(e) => setVitalsForm({ ...vitalsForm, respRate: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              {/* Weight, Height, Random Glucose, Pain Scale */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.2fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '11.5px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '4px' }}>Weight (kg)</label>
                  <input 
                    type="number" 
                    step="0.5" 
                    min="1" 
                    max="300" 
                    placeholder="68"
                    value={vitalsForm.weight}
                    onChange={(e) => setVitalsForm({ ...vitalsForm, weight: e.target.value })}
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12.5px', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '11.5px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '4px' }}>Height (cm)</label>
                  <input 
                    type="number" 
                    min="30" 
                    max="250" 
                    placeholder="170"
                    value={vitalsForm.height}
                    onChange={(e) => setVitalsForm({ ...vitalsForm, height: e.target.value })}
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12.5px', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '11.5px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '4px' }}>Blood Sugar (RBS)</label>
                  <input 
                    type="text" 
                    placeholder="e.g. 110 mg/dL"
                    value={vitalsForm.bloodGlucose}
                    onChange={(e) => setVitalsForm({ ...vitalsForm, bloodGlucose: e.target.value })}
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12.5px', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '11.5px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '4px' }}>Pain Score (0-10)</label>
                  <select
                    value={vitalsForm.painScore}
                    onChange={(e) => setVitalsForm({ ...vitalsForm, painScore: e.target.value })}
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12.5px', background: 'white' }}
                  >
                    <option value="0">0 - No Pain</option>
                    <option value="2">2 - Mild</option>
                    <option value="4">4 - Moderate</option>
                    <option value="6">6 - Severe</option>
                    <option value="8">8 - Very Severe</option>
                    <option value="10">10 - Worst Pain</option>
                  </select>
                </div>
              </div>

              {/* Allergies & Chief Complaint */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '4px' }}>
                    Known Drug Allergies
                  </label>
                  <input 
                    type="text"
                    placeholder="e.g. Penicillin / Sulfa / None"
                    value={vitalsForm.allergies}
                    onChange={(e) => setVitalsForm({ ...vitalsForm, allergies: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12.5px', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '4px' }}>
                    Chief Presenting Complaints / Symptoms
                  </label>
                  <input 
                    type="text"
                    placeholder="e.g. Headache since 2 days, mild dry cough..."
                    value={vitalsForm.chiefComplaint}
                    onChange={(e) => setVitalsForm({ ...vitalsForm, chiefComplaint: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12.5px', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              {/* Nurse Observations / Triage Notes */}
              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '4px' }}>
                  Pre-Consultation Nursing Observations
                </label>
                <textarea 
                  rows="2"
                  placeholder="e.g. Patient conscious, oriented to time and place; walking unassisted; normal pupil reflex."
                  value={vitalsForm.nurseNotes}
                  onChange={(e) => setVitalsForm({ ...vitalsForm, nurseNotes: e.target.value })}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12.5px', boxSizing: 'border-box', resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px', borderTop: '1px solid #e2e8f0', paddingTop: '14px' }}>
                <button type="button" onClick={() => setSelectedApptForVitals(null)} style={{ padding: '8px 16px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '6px', color: '#475569', fontWeight: '600', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ padding: '8px 20px', background: '#059669', color: 'white', border: 'none', borderRadius: '6px', fontWeight: '700', cursor: 'pointer' }}>
                  💾 Save Vitals & Forward to Doctor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Minor Procedure Modal */}
      {showAddProcModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 99999 }}>
          <div style={{ background: 'white', borderRadius: '12px', width: '520px', maxWidth: '94vw', maxHeight: '92vh', overflowY: 'auto', padding: '24px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', color: '#1e293b', fontWeight: '800' }}>
                💉 Log Outpatient Minor Procedure / Injection
              </h3>
              <button onClick={() => setShowAddProcModal(false)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#64748b' }}>&times;</button>
            </div>

            <form onSubmit={handleAddProcedure} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '12.5px', fontWeight: '700', color: '#334155' }}>Patient Full Name *</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="e.g. Robert Brown"
                    value={procForm.patientName}
                    onChange={(e) => setProcForm({ ...procForm, patientName: e.target.value.replace(/[^a-zA-Z\s.-]/g, '') })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box', marginTop: '4px' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12.5px', fontWeight: '700', color: '#334155' }}>UHID / Patient ID</label>
                  <input 
                    type="text" 
                    placeholder="e.g. PT-1002"
                    value={procForm.patientId}
                    onChange={(e) => setProcForm({ ...procForm, patientId: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box', marginTop: '4px' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '12.5px', fontWeight: '700', color: '#334155' }}>Procedure / Injection Type *</label>
                <select 
                  value={procForm.procedureType}
                  onChange={(e) => setProcForm({ ...procForm, procedureType: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', background: 'white', marginTop: '4px', fontWeight: '600' }}
                >
                  <option value="IM Injection (Tetanus Toxoid 0.5ml)">IM Injection (Tetanus Toxoid 0.5ml)</option>
                  <option value="IM Injection (Diclofenac / Voveran 75mg)">IM Injection (Diclofenac / Voveran 75mg)</option>
                  <option value="IV Injection (Ondansetron 4mg / Emeset)">IV Injection (Ondansetron 4mg / Emeset)</option>
                  <option value="IV Cannulation & Normal Saline 500ml Drip">IV Cannulation & Normal Saline 500ml Drip</option>
                  <option value="Subcutaneous Insulin Administration">Subcutaneous Insulin Administration</option>
                  <option value="Nebulization Therapy (Duolin + Budecort)">Nebulization Therapy (Duolin + Budecort)</option>
                  <option value="Wound Dressing & Antiseptic Bandaging">Wound Dressing & Antiseptic Bandaging</option>
                  <option value="Surgical Suture / Clip Removal">Surgical Suture / Clip Removal</option>
                  <option value="Point-of-Care Blood Sugar (Accu-Chek)">Point-of-Care Blood Sugar (Accu-Chek)</option>
                  <option value="12-Lead Diagnostic ECG Recording">12-Lead Diagnostic ECG Recording</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '12.5px', fontWeight: '700', color: '#334155' }}>Prescribing Physician</label>
                  <select 
                    value={procForm.prescribedBy}
                    onChange={(e) => setProcForm({ ...procForm, prescribedBy: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', background: 'white', marginTop: '4px' }}
                  >
                    {doctorsRoster.map(d => (
                      <option key={d.id} value={d.name}>{d.name}</option>
                    ))}
                    <option value="OPD Duty Medical Officer">OPD Duty Medical Officer</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '12.5px', fontWeight: '700', color: '#334155' }}>Procedure Station Bay</label>
                  <select 
                    value={procForm.bay}
                    onChange={(e) => setProcForm({ ...procForm, bay: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', background: 'white', marginTop: '4px' }}
                  >
                    <option value="OPD Injection Room">OPD Injection Room</option>
                    <option value="Minor Dressing Station">Minor Dressing Station</option>
                    <option value="Nebulization Bay">Nebulization Bay</option>
                    <option value="ECG Room">ECG Room</option>
                    <option value="OPD Triage Station 1">OPD Triage Station 1</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '12.5px', fontWeight: '700', color: '#334155' }}>Consumables / Medications Used</label>
                <input 
                  type="text" 
                  value={procForm.consumables}
                  onChange={(e) => setProcForm({ ...procForm, consumables: e.target.value })}
                  placeholder="e.g. 1x Syringe 2ml, Alcohol Swab, TT Vial Batch #4092"
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box', marginTop: '4px' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12.5px', fontWeight: '700', color: '#334155' }}>Nurse Clinical Observations / Site Notes</label>
                <textarea 
                  rows="2"
                  value={procForm.nurseNotes}
                  onChange={(e) => setProcForm({ ...procForm, nurseNotes: e.target.value })}
                  placeholder="e.g. Given in left gluteal region. Patient rested for 10 minutes post-dose with stable vitals."
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box', marginTop: '4px', resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
                <button type="button" onClick={() => setShowAddProcModal(false)} style={{ padding: '8px 16px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '6px', color: '#475569', fontWeight: '600', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ padding: '8px 18px', background: '#059669', color: 'white', border: 'none', borderRadius: '6px', fontWeight: '700', cursor: 'pointer' }}>✓ Log Procedure</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Emergency Crash Cart Alert Modal */}
      {showEmergencyModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(5px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 999999 }}>
          <div style={{ background: 'white', borderRadius: '12px', width: '480px', maxWidth: '94vw', padding: '24px', borderTop: '6px solid #ef4444', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.3)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <span style={{ fontSize: '28px' }}>🚨</span>
              <h3 style={{ margin: 0, fontSize: '18px', color: '#991b1b', fontWeight: '900' }}>
                OPD Nurse Emergency / Crash Cart Alert
              </h3>
            </div>
            <p style={{ margin: '0 0 14px 0', fontSize: '13px', color: '#475569' }}>
              This will broadcast an urgent emergency alert to the Emergency Medical Officer, on-duty Crash Team, and Reception Desk.
            </p>

            <label style={{ fontSize: '12.5px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '4px' }}>
              Describe Urgent Patient Condition & Location
            </label>
            <textarea 
              rows="3"
              required
              placeholder="e.g. Elderly patient collapsed in OPD Waiting Area Bay 1, unresponsive with severe bradycardia and cyanosis. Send Crash Cart immediately!"
              value={emergencyAlertText}
              onChange={(e) => setEmergencyAlertText(e.target.value)}
              style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '2px solid #f87171', fontSize: '13px', boxSizing: 'border-box' }}
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
              <button 
                type="button" 
                onClick={() => setShowEmergencyModal(false)}
                style={{ padding: '8px 16px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '6px', color: '#475569', fontWeight: '600', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button 
                type="button" 
                onClick={handleTriggerEmergency}
                style={{ padding: '9px 20px', background: '#dc2626', color: 'white', border: 'none', borderRadius: '6px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                🚨 Broadcast Code Alert
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
