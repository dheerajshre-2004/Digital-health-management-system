import React, { useState, useEffect } from 'react';
import './TriageDashboard.css';

export default function TriageDashboard({ onLogout, loggedInStaff }) {
  const [activeTab, setActiveTab] = useState('queue');
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

  // Vitals Entry Modal
  const [selectedApptForVitals, setSelectedApptForVitals] = useState(null);
  const [vitalsForm, setVitalsForm] = useState({
    sysBP: '120',
    diaBP: '80',
    pulse: '72',
    temperature: '98.6',
    spo2: '98',
    weight: '68',
    height: '170',
    bloodGlucose: '',
    nurseNotes: ''
  });

  useEffect(() => {
    const handleStorage = () => {
      setAppointments(JSON.parse(localStorage.getItem('dhms_appointments') || '[]'));
      setPatients(JSON.parse(localStorage.getItem('dhms_patients') || '[]'));
      setDoctorsRoster(JSON.parse(localStorage.getItem('dhms_doctors') || '[]'));
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

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
      weight: existing.weight ? String(existing.weight).replace(/[^0-9.]/g, '') : '68',
      height: existing.height ? String(existing.height).replace(/[^0-9.]/g, '') : '170',
      bloodGlucose: existing.bloodGlucose || '',
      nurseNotes: existing.nurseNotes || ''
    });
    setSelectedApptForVitals(appt);
  };

  const handleSaveVitals = (e) => {
    e.preventDefault();
    if (!selectedApptForVitals) return;

    const bpStr = `${vitalsForm.sysBP}/${vitalsForm.diaBP}`;
    const recordedVitalsObj = {
      bp: bpStr,
      sysBP: vitalsForm.sysBP,
      diaBP: vitalsForm.diaBP,
      hr: vitalsForm.pulse,
      pulse: `${vitalsForm.pulse} bpm`,
      temp: vitalsForm.temperature,
      spo2: vitalsForm.spo2,
      weight: vitalsForm.weight ? `${vitalsForm.weight} kg` : '-',
      height: vitalsForm.height ? `${vitalsForm.height} cm` : '-',
      bloodGlucose: vitalsForm.bloodGlucose ? `${vitalsForm.bloodGlucose} mg/dL` : 'Normal',
      nurseNotes: vitalsForm.nurseNotes.trim() || 'Checked by OPD Triage Nurse',
      checkedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      checkedBy: loggedInStaff?.name || 'OPD Triage Nurse'
    };

    // Update dhms_appointments
    const allAppts = JSON.parse(localStorage.getItem('dhms_appointments') || '[]');
    const updatedAppts = allAppts.map(a => {
      if (a.id === selectedApptForVitals.id) {
        return {
          ...a,
          vitals: recordedVitalsObj,
          vitalsRecorded: true,
          triageStatus: 'Completed - Ready for Doctor'
        };
      }
      return a;
    });

    localStorage.setItem('dhms_appointments', JSON.stringify(updatedAppts));
    setAppointments(updatedAppts);

    // Sync to patient profile latest vitals in dhms_patients
    const allPatients = JSON.parse(localStorage.getItem('dhms_patients') || '[]');
    const updatedPatients = allPatients.map(p => {
      if (p.id === selectedApptForVitals.patientId || p.name?.toLowerCase() === selectedApptForVitals.patientName?.toLowerCase()) {
        return {
          ...p,
          latestVitals: recordedVitalsObj
        };
      }
      return p;
    });
    localStorage.setItem('dhms_patients', JSON.stringify(updatedPatients));
    setPatients(updatedPatients);

    if (window.dispatchEvent) {
      window.dispatchEvent(new Event('storage'));
    }

    alert(`✓ Vitals successfully recorded for ${selectedApptForVitals.patientName}!\nDr. ${selectedApptForVitals.doctorName}'s chamber has been updated.`);
    setSelectedApptForVitals(null);
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

  const getTempStatus = (t) => {
    const temp = parseFloat(t);
    if (isNaN(temp)) return null;
    if (temp >= 100.4) return { label: 'Fever (Pyrexia)', color: '#dc2626' };
    if (temp < 96.0) return { label: 'Hypothermia', color: '#2563eb' };
    return { label: 'Normal Temp', color: '#16a34a' };
  };

  const getSpO2Status = (o2) => {
    const val = parseInt(o2);
    if (isNaN(val)) return null;
    if (val < 95) return { label: 'Low SpO₂ (Hypoxia)', color: '#dc2626' };
    return { label: 'Optimal SpO₂', color: '#16a34a' };
  };

  // Filter queue
  const todayStr = new Date().toISOString().split('T')[0];
  const waitingQueue = appointments.filter(a => {
    if (a.status === 'Cancelled' || a.status === 'Discharged') return false;
    // Matching doctor
    if (selectedDoctorFilter !== 'all' && a.doctorName !== selectedDoctorFilter && a.doctorId !== selectedDoctorFilter) {
      return false;
    }
    // Matching status
    const hasVitals = !!a.vitalsRecorded || (a.vitals && a.vitals.checkedBy);
    if (selectedStatusFilter === 'pending' && (hasVitals || a.status === 'Completed')) return false;
    if (selectedStatusFilter === 'recorded' && !hasVitals) return false;

    // Search query
    const query = searchTerm.toLowerCase();
    const pName = (a.patientName || '').toLowerCase();
    const pId = (a.patientId || '').toLowerCase();
    const dName = (a.doctorName || '').toLowerCase();
    return pName.includes(query) || pId.includes(query) || dName.includes(query);
  });

  const pendingCount = appointments.filter(a => a.status !== 'Completed' && a.status !== 'Cancelled' && !a.vitalsRecorded).length;
  const completedVitalsCount = appointments.filter(a => a.vitalsRecorded || (a.vitals && a.vitals.checkedBy)).length;

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
            <span className="triage-profile-name">{loggedInStaff?.name || 'Staff Nurse (OPD Triage)'}</span>
            <span className="triage-profile-role">OPD Pre-Consultation Vitals Desk</span>
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
            className={`triage-nav-btn ${activeTab === 'protocols' ? 'active' : ''}`}
            onClick={() => setActiveTab('protocols')}
          >
            🩺 Vitals Reference Guide
          </button>
        </aside>

        {/* Main Content */}
        <main className="triage-main-content">
          {activeTab === 'queue' && (
            <div>
              {/* Stats Grid */}
              <div className="triage-stats-grid">
                <div className="triage-stat-card">
                  <div className="triage-stat-icon" style={{ background: '#fef3c7', color: '#b45309' }}>⏳</div>
                  <div>
                    <div className="triage-stat-val">{pendingCount}</div>
                    <div className="triage-stat-lbl">Pending Vitals Checkup</div>
                  </div>
                </div>

                <div className="triage-stat-card">
                  <div className="triage-stat-icon" style={{ background: '#ecfdf5', color: '#059669' }}>✅</div>
                  <div>
                    <div className="triage-stat-val">{completedVitalsCount}</div>
                    <div className="triage-stat-lbl">Vitals Checked & Forwarded</div>
                  </div>
                </div>

                <div className="triage-stat-card">
                  <div className="triage-stat-icon" style={{ background: '#eff6ff', color: '#2563eb' }}>👨‍⚕️</div>
                  <div>
                    <div className="triage-stat-val">{doctorsRoster.length}</div>
                    <div className="triage-stat-lbl">Active OPD Chambers</div>
                  </div>
                </div>
              </div>

              {/* Controls Bar */}
              <div className="triage-controls-bar">
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flex: 1 }}>
                  <input 
                    type="text" 
                    placeholder="Search by Patient Name, ID (UHID), or Doctor..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px', width: '320px', maxWidth: '100%' }}
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

                  <div style={{ display: 'flex', border: '1px solid #cbd5e1', borderRadius: '6px', overflow: 'hidden' }}>
                    <button 
                      onClick={() => setSelectedStatusFilter('pending')}
                      style={{ padding: '7px 12px', border: 'none', background: selectedStatusFilter === 'pending' ? '#059669' : 'white', color: selectedStatusFilter === 'pending' ? 'white' : '#64748b', fontWeight: '600', fontSize: '12px', cursor: 'pointer' }}
                    >
                      Pending Vitals ({pendingCount})
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
                      <th>Vitals Status</th>
                      <th>Latest Recorded Vitals</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {waitingQueue.map((appt) => {
                      const hasVitals = !!appt.vitalsRecorded || (appt.vitals && appt.vitals.checkedBy);
                      const bpInfo = appt.vitals ? getBPStatus(appt.vitals.sysBP || appt.vitals.bp?.split('/')[0], appt.vitals.diaBP || appt.vitals.bp?.split('/')[1]) : null;

                      return (
                        <tr key={appt.id}>
                          <td>
                            <strong>{appt.patientName}</strong>
                            <div style={{ fontSize: '11.5px', color: '#64748b' }}>ID: {appt.patientId}</div>
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
                                <span style={{ color: '#475569' }}><strong>HR:</strong> {appt.vitals.hr || appt.vitals.pulse || '72'} bpm • <strong>Temp:</strong> {appt.vitals.temp || '98.6'} °F • <strong>SpO₂:</strong> {appt.vitals.spo2 || '98'}%</span>
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
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Vitals Input Modal */}
      {selectedApptForVitals && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 99999 }}>
          <div style={{ background: 'white', borderRadius: '12px', width: '560px', maxWidth: '94vw', maxHeight: '92vh', overflowY: 'auto', padding: '24px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px', marginBottom: '16px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', color: '#1e293b', fontWeight: '800' }}>
                  🩺 Record Patient Vitals (OPD Triage)
                </h3>
                <span style={{ fontSize: '12.5px', color: '#64748b' }}>
                  Patient: <strong>{selectedApptForVitals.patientName}</strong> (ID: {selectedApptForVitals.patientId}) • Doctor: <strong>{selectedApptForVitals.doctorName}</strong>
                </span>
              </div>
              <button onClick={() => setSelectedApptForVitals(null)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#64748b' }}>&times;</button>
            </div>

            <form onSubmit={handleSaveVitals} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
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

              {/* Temperature & SpO2 */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12.5px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '4px' }}>
                    Body Temperature (°F) <span style={{ color: 'red' }}>*</span>
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <input 
                      type="number" 
                      step="0.1" 
                      min="90" 
                      max="110" 
                      required 
                      placeholder="98.6"
                      value={vitalsForm.temperature}
                      onChange={(e) => setVitalsForm({ ...vitalsForm, temperature: e.target.value })}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', fontWeight: '700' }}
                    />
                    <span style={{ fontSize: '11.5px', color: '#64748b' }}>°F</span>
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '12.5px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '4px' }}>
                    Oxygen Saturation (SpO₂) <span style={{ color: 'red' }}>*</span>
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <input 
                      type="number" 
                      min="50" 
                      max="100" 
                      required 
                      placeholder="98"
                      value={vitalsForm.spo2}
                      onChange={(e) => setVitalsForm({ ...vitalsForm, spo2: e.target.value })}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', fontWeight: '700' }}
                    />
                    <span style={{ fontSize: '11.5px', color: '#64748b' }}>%</span>
                  </div>
                </div>
              </div>

              {/* Weight, Height & Blood Glucose */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '4px' }}>Weight (kg)</label>
                  <input 
                    type="number" 
                    step="0.5" 
                    min="1" 
                    max="300" 
                    placeholder="68"
                    value={vitalsForm.weight}
                    onChange={(e) => setVitalsForm({ ...vitalsForm, weight: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '4px' }}>Height (cm)</label>
                  <input 
                    type="number" 
                    min="30" 
                    max="250" 
                    placeholder="170"
                    value={vitalsForm.height}
                    onChange={(e) => setVitalsForm({ ...vitalsForm, height: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '4px' }}>Random Glucose</label>
                  <input 
                    type="text" 
                    placeholder="e.g. 110 mg/dL"
                    value={vitalsForm.bloodGlucose}
                    onChange={(e) => setVitalsForm({ ...vitalsForm, bloodGlucose: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              {/* Nurse Observations / Triage Notes */}
              <div>
                <label style={{ fontSize: '12.5px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '4px' }}>
                  Pre-Consultation Nursing Observations / Remarks
                </label>
                <textarea 
                  rows="2"
                  placeholder="e.g. Patient conscious and alert; mild distress; ambulatory with escort..."
                  value={vitalsForm.nurseNotes}
                  onChange={(e) => setVitalsForm({ ...vitalsForm, nurseNotes: e.target.value })}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box', resize: 'vertical' }}
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
    </div>
  );
}
