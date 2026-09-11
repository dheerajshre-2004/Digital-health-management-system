import React, { useState, useEffect } from 'react';
import './BedManagement.css';
import { t } from './i18nService';

const INITIAL_BEDS = [
  // ICU & Critical Care
  { id: 'ICU-101', ward: 'icu', room: '101', type: 'Ventilator Bed', status: 'occupied', patientName: 'Rajesh Sharma', patientId: 'PT-9821', doctor: 'Dr. Sarah Connor', diagnosis: 'Acute Respiratory Distress (ARDS)', admitDate: '2026-09-08', oxygen: 'Ventilator 60% FiO2', vitals: 'BP 125/82, HR 88, SpO2 96%' },
  { id: 'ICU-102', ward: 'icu', room: '102', type: 'Ventilator Bed', status: 'occupied', patientName: 'Sunita Patel', patientId: 'PT-8812', doctor: 'Dr. Gregory House', diagnosis: 'Post-CABG Cardiac Monitoring', admitDate: '2026-09-09', oxygen: 'High-Flow Nasal Cannula', vitals: 'BP 118/75, HR 74, SpO2 99%' },
  { id: 'ICU-103', ward: 'icu', room: '103', type: 'Ventilator Bed', status: 'vacant', patientName: '', patientId: '', doctor: '', diagnosis: '', admitDate: '', oxygen: 'Ventilator Ready', vitals: '' },
  { id: 'ICU-104', ward: 'icu', room: '104', type: 'Cardiac Monitor Bed', status: 'cleaning', patientName: '', patientId: '', doctor: '', diagnosis: '', admitDate: '', oxygen: 'O2 Port Available', vitals: '' },
  { id: 'ICU-105', ward: 'icu', room: '105', type: 'Critical Care Bed', status: 'vacant', patientName: '', patientId: '', doctor: '', diagnosis: '', admitDate: '', oxygen: 'Ventilator Ready', vitals: '' },

  // Emergency & Trauma
  { id: 'ER-01', ward: 'emergency', room: 'Bay A', type: 'Trauma Crash Bed', status: 'occupied', patientName: 'Amit Verma', patientId: 'PT-4421', doctor: 'Dr. Meredith Grey', diagnosis: 'Multiple Trauma / Fracture', admitDate: '2026-09-10', oxygen: 'O2 Mask 4L', vitals: 'BP 132/88, HR 94, SpO2 97%' },
  { id: 'ER-02', ward: 'emergency', room: 'Bay A', type: 'Triage Bed', status: 'reserved', patientName: 'Inbound Ambulance (Cardiac)', patientId: 'EMERGENCY', doctor: 'Dr. Sarah Connor', diagnosis: 'Suspected STEMI In-Transit', admitDate: '2026-09-10', oxygen: 'Cardiac Monitor Prepped', vitals: '' },
  { id: 'ER-03', ward: 'emergency', room: 'Bay B', type: 'Observation Bed', status: 'vacant', patientName: '', patientId: '', doctor: '', diagnosis: '', admitDate: '', oxygen: 'O2 Ready', vitals: '' },
  { id: 'ER-04', ward: 'emergency', room: 'Bay B', type: 'Observation Bed', status: 'vacant', patientName: '', patientId: '', doctor: '', diagnosis: '', admitDate: '', oxygen: 'O2 Ready', vitals: '' },

  // General Medical Ward
  { id: 'GEN-201', ward: 'general', room: '201', type: 'Standard Ward Bed', status: 'occupied', patientName: 'Dheeraj Kumar', patientId: 'PT-1001', doctor: 'Dr. Hemavathi Rao', diagnosis: 'Type 2 Diabetes / Dengue Fever', admitDate: '2026-09-07', oxygen: 'Room Air', vitals: 'BP 120/80, HR 72, SpO2 98%' },
  { id: 'GEN-202', ward: 'general', room: '201', type: 'Standard Ward Bed', status: 'occupied', patientName: 'Pooja Reddy', patientId: 'PT-3094', doctor: 'Dr. Meredith Grey', diagnosis: 'Acute Gastroenteritis', admitDate: '2026-09-09', oxygen: 'Room Air', vitals: 'BP 110/70, HR 80, SpO2 99%' },
  { id: 'GEN-203', ward: 'general', room: '202', type: 'Standard Ward Bed', status: 'vacant', patientName: '', patientId: '', doctor: '', diagnosis: '', admitDate: '', oxygen: 'Room Air', vitals: '' },
  { id: 'GEN-204', ward: 'general', room: '202', type: 'Standard Ward Bed', status: 'vacant', patientName: '', patientId: '', doctor: '', diagnosis: '', admitDate: '', oxygen: 'Room Air', vitals: '' },
  { id: 'GEN-205', ward: 'general', room: '203', type: 'Standard Ward Bed', status: 'cleaning', patientName: '', patientId: '', doctor: '', diagnosis: '', admitDate: '', oxygen: 'Room Air', vitals: '' },

  // Maternity & Pediatric
  { id: 'MAT-301', ward: 'maternity', room: '301', type: 'Labor & Delivery Bed', status: 'occupied', patientName: 'Ananya Iyer', patientId: 'PT-5521', doctor: 'Dr. Sarah Connor', diagnosis: 'Post-Natal Care / Delivery', admitDate: '2026-09-09', oxygen: 'Room Air', vitals: 'BP 115/76, HR 78, SpO2 100%' },
  { id: 'MAT-302', ward: 'maternity', room: '302', type: 'Pediatric Bed', status: 'vacant', patientName: '', patientId: '', doctor: '', diagnosis: '', admitDate: '', oxygen: 'Nebulizer / O2 Ready', vitals: '' },
  { id: 'MAT-303', ward: 'maternity', room: '303', type: 'Neonatal Incubator Bed', status: 'occupied', patientName: 'Baby of Ananya', patientId: 'PT-5521-B', doctor: 'Dr. Sarah Connor', diagnosis: 'Neonatal Phototherapy', admitDate: '2026-09-09', oxygen: 'Warm Incubator FiO2 30%', vitals: 'HR 130, SpO2 98%' },

  // Deluxe Suites
  { id: 'DLX-401', ward: 'deluxe', room: 'Suite 401', type: 'Luxury Executive Suite', status: 'occupied', patientName: 'Vikram Malhotra', patientId: 'PT-7732', doctor: 'Dr. Gregory House', diagnosis: 'Post-Orthopedic Knee Replacement', admitDate: '2026-09-06', oxygen: 'Private Console', vitals: 'BP 128/84, HR 70, SpO2 99%' },
  { id: 'DLX-402', ward: 'deluxe', room: 'Suite 402', type: 'Luxury Executive Suite', status: 'vacant', patientName: '', patientId: '', doctor: '', diagnosis: '', admitDate: '', oxygen: 'Private Console', vitals: '' }
];

export default function BedManagementModal({ onClose }) {
  const [beds, setBeds] = useState(() => {
    try {
      const saved = localStorage.getItem('dhms_beds_inventory');
      return saved ? JSON.parse(saved) : INITIAL_BEDS;
    } catch (e) {
      return INITIAL_BEDS;
    }
  });

  const [selectedWard, setSelectedWard] = useState('all');
  const [selectedBed, setSelectedBed] = useState(null);
  const [showAdmitForm, setShowAdmitForm] = useState(false);
  const [showTransferForm, setShowTransferForm] = useState(false);

  // Form states for admission
  const [admitPatName, setAdmitPatName] = useState('');
  const [admitPatId, setAdmitPatId] = useState('');
  const [admitDoctor, setAdmitDoctor] = useState('Dr. Sarah Connor');
  const [admitDiagnosis, setAdmitDiagnosis] = useState('');
  const [admitOxygen, setAdmitOxygen] = useState('Room Air');

  // Form state for transfer
  const [targetBedId, setTargetBedId] = useState('');

  // Persist bed changes
  useEffect(() => {
    try {
      localStorage.setItem('dhms_beds_inventory', JSON.stringify(beds));
    } catch (e) {}
  }, [beds]);

  // Metrics
  const totalCount = beds.length;
  const occupiedCount = beds.filter(b => b.status === 'occupied').length;
  const vacantCount = beds.filter(b => b.status === 'vacant').length;
  const icuBeds = beds.filter(b => b.ward === 'icu');
  const icuOccupied = icuBeds.filter(b => b.status === 'occupied').length;
  const icuUtilPercent = icuBeds.length ? Math.round((icuOccupied / icuBeds.length) * 100) : 0;
  const readyVentilators = beds.filter(b => b.type.includes('Ventilator') && b.status === 'vacant').length;

  const filteredBeds = selectedWard === 'all' 
    ? beds 
    : beds.filter(b => b.ward === selectedWard);

  const handleBedClick = (bed) => {
    setSelectedBed(bed);
    setShowAdmitForm(false);
    setShowTransferForm(false);
  };

  const handleOpenAdmit = (bed) => {
    setSelectedBed(bed);
    setAdmitPatName('');
    setAdmitPatId(`PT-${Math.floor(1000 + Math.random() * 9000)}`);
    setAdmitDiagnosis('');
    setShowAdmitForm(true);
    setShowTransferForm(false);
  };

  const submitAdmit = (e) => {
    e.preventDefault();
    if (!admitPatName.trim() || !selectedBed) return;

    setBeds(prev => prev.map(b => {
      if (b.id === selectedBed.id) {
        return {
          ...b,
          status: 'occupied',
          patientName: admitPatName.trim(),
          patientId: admitPatId || `PT-${Math.floor(1000 + Math.random() * 9000)}`,
          doctor: admitDoctor,
          diagnosis: admitDiagnosis.trim() || 'General Admission / Clinical Care',
          admitDate: new Date().toISOString().split('T')[0],
          oxygen: admitOxygen,
          vitals: 'BP 120/80, HR 76, SpO2 98%'
        };
      }
      return b;
    }));

    setShowAdmitForm(false);
    setSelectedBed(null);
  };

  const handleOpenTransfer = (bed) => {
    setSelectedBed(bed);
    const availableTargets = beds.filter(b => b.status === 'vacant' && b.id !== bed.id);
    if (availableTargets.length > 0) {
      setTargetBedId(availableTargets[0].id);
    }
    setShowTransferForm(true);
    setShowAdmitForm(false);
  };

  const submitTransfer = (e) => {
    e.preventDefault();
    if (!selectedBed || !targetBedId) return;

    const currentPatient = { ...selectedBed };

    setBeds(prev => prev.map(b => {
      if (b.id === targetBedId) {
        // Target bed becomes occupied with this patient
        return {
          ...b,
          status: 'occupied',
          patientName: currentPatient.patientName,
          patientId: currentPatient.patientId,
          doctor: currentPatient.doctor,
          diagnosis: currentPatient.diagnosis,
          admitDate: currentPatient.admitDate,
          oxygen: b.ward === 'icu' ? 'Ventilator / O2 Monitored' : currentPatient.oxygen,
          vitals: currentPatient.vitals
        };
      }
      if (b.id === selectedBed.id) {
        // Source bed goes into sanitization
        return {
          ...b,
          status: 'cleaning',
          patientName: '',
          patientId: '',
          doctor: '',
          diagnosis: '',
          admitDate: '',
          vitals: ''
        };
      }
      return b;
    }));

    setShowTransferForm(false);
    setSelectedBed(null);
  };

  const handleDischarge = (bedId) => {
    setBeds(prev => prev.map(b => {
      if (b.id === bedId) {
        return {
          ...b,
          status: 'cleaning',
          patientName: '',
          patientId: '',
          doctor: '',
          diagnosis: '',
          admitDate: '',
          vitals: ''
        };
      }
      return b;
    }));
    setSelectedBed(null);
  };

  const handleCompleteSanitize = (bedId) => {
    setBeds(prev => prev.map(b => {
      if (b.id === bedId) {
        return {
          ...b,
          status: 'vacant'
        };
      }
      return b;
    }));
    setSelectedBed(null);
  };

  return (
    <div className="bed-matrix-overlay" onClick={onClose}>
      <div className="bed-matrix-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="bed-matrix-header">
          <div className="bed-matrix-header-title">
            <h2>🛏️ {t('bedManagementTitle')}</h2>
            <span className="bed-live-chip">
              <span className="bed-live-dot"></span>
              LIVE HOSPITAL CENSUS
            </span>
          </div>
          <button className="bed-close-btn" onClick={onClose}>×</button>
        </div>

        {/* Live Metrics HUD */}
        <div className="bed-metrics-grid">
          <div className="bed-metric-card">
            <div className="bed-metric-icon">🏥</div>
            <div className="bed-metric-info">
              <span className="bed-metric-val">{totalCount}</span>
              <span className="bed-metric-label">{t('totalBeds')}</span>
            </div>
          </div>
          <div className="bed-metric-card" style={{ borderLeft: '4px solid #ef4444' }}>
            <div className="bed-metric-icon" style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#f87171' }}>🔴</div>
            <div className="bed-metric-info">
              <span className="bed-metric-val">{occupiedCount}</span>
              <span className="bed-metric-label">{t('occupiedBeds')} ({Math.round((occupiedCount / totalCount) * 100)}%)</span>
            </div>
          </div>
          <div className="bed-metric-card" style={{ borderLeft: '4px solid #10b981' }}>
            <div className="bed-metric-icon" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399' }}>🟢</div>
            <div className="bed-metric-info">
              <span className="bed-metric-val">{vacantCount}</span>
              <span className="bed-metric-label">{t('availableBeds')}</span>
            </div>
          </div>
          <div className="bed-metric-card" style={{ borderLeft: '4px solid #38bdf8' }}>
            <div className="bed-metric-icon" style={{ background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8' }}>🫁</div>
            <div className="bed-metric-info">
              <span className="bed-metric-val">{icuUtilPercent}%</span>
              <span className="bed-metric-label">{t('icuOccupancy')} ({icuOccupied}/{icuBeds.length})</span>
            </div>
          </div>
          <div className="bed-metric-card" style={{ borderLeft: '4px solid #a855f7' }}>
            <div className="bed-metric-icon" style={{ background: 'rgba(168, 85, 247, 0.15)', color: '#c084fc' }}>⚡</div>
            <div className="bed-metric-info">
              <span className="bed-metric-val">{readyVentilators}</span>
              <span className="bed-metric-label">{t('ventilatorsAvailable')}</span>
            </div>
          </div>
        </div>

        {/* Main Body */}
        <div className="bed-matrix-body">
          {/* Left Ward Filter Sidebar */}
          <div className="bed-wards-sidebar">
            <button 
              className={`bed-ward-btn ${selectedWard === 'all' ? 'active' : ''}`}
              onClick={() => setSelectedWard('all')}
            >
              <span>🏢 {t('allWards')}</span>
              <span className="bed-ward-count">{beds.length}</span>
            </button>
            <button 
              className={`bed-ward-btn ${selectedWard === 'icu' ? 'active' : ''}`}
              onClick={() => setSelectedWard('icu')}
            >
              <span>🔴 {t('icuWard')}</span>
              <span className="bed-ward-count">{beds.filter(b => b.ward === 'icu').length}</span>
            </button>
            <button 
              className={`bed-ward-btn ${selectedWard === 'emergency' ? 'active' : ''}`}
              onClick={() => setSelectedWard('emergency')}
            >
              <span>🚨 {t('emergencyWard')}</span>
              <span className="bed-ward-count">{beds.filter(b => b.ward === 'emergency').length}</span>
            </button>
            <button 
              className={`bed-ward-btn ${selectedWard === 'general' ? 'active' : ''}`}
              onClick={() => setSelectedWard('general')}
            >
              <span>🔵 {t('generalWard')}</span>
              <span className="bed-ward-count">{beds.filter(b => b.ward === 'general').length}</span>
            </button>
            <button 
              className={`bed-ward-btn ${selectedWard === 'maternity' ? 'active' : ''}`}
              onClick={() => setSelectedWard('maternity')}
            >
              <span>🟣 {t('maternityWard')}</span>
              <span className="bed-ward-count">{beds.filter(b => b.ward === 'maternity').length}</span>
            </button>
            <button 
              className={`bed-ward-btn ${selectedWard === 'deluxe' ? 'active' : ''}`}
              onClick={() => setSelectedWard('deluxe')}
            >
              <span>👑 {t('deluxeWard')}</span>
              <span className="bed-ward-count">{beds.filter(b => b.ward === 'deluxe').length}</span>
            </button>
          </div>

          {/* Floor Plan Grid */}
          <div className="bed-floor-plan">
            <div className="bed-legend-bar">
              <div className="bed-legend-item">
                <span className="bed-legend-box" style={{ background: '#10b981' }}></span>
                <span>{t('vacant')} (Click to Admit)</span>
              </div>
              <div className="bed-legend-item">
                <span className="bed-legend-box" style={{ background: '#ef4444' }}></span>
                <span>{t('occupied')} (Click for Details)</span>
              </div>
              <div className="bed-legend-item">
                <span className="bed-legend-box" style={{ background: '#f59e0b' }}></span>
                <span>{t('reserved')}</span>
              </div>
              <div className="bed-legend-item">
                <span className="bed-legend-box" style={{ background: '#a855f7' }}></span>
                <span>{t('cleaning')}</span>
              </div>
            </div>

            <div className="bed-grid-layout">
              {filteredBeds.map(bed => (
                <div 
                  key={bed.id} 
                  className={`bed-card ${bed.status}`}
                  onClick={() => handleBedClick(bed)}
                >
                  <div className="bed-card-header">
                    <span className="bed-id-badge">{bed.id}</span>
                    <span className="bed-status-tag">{t(bed.status)}</span>
                  </div>

                  <div className="bed-card-meta">
                    <span style={{ color: '#38bdf8', fontWeight: '600' }}>{bed.type}</span>
                    <span>Room: {bed.room}</span>
                  </div>

                  {bed.status === 'occupied' && (
                    <div style={{ marginTop: '4px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '6px' }}>
                      <div className="bed-card-patient">👤 {bed.patientName}</div>
                      <div className="bed-card-meta">
                        <span>🩺 {bed.doctor}</span>
                        <span>📋 {bed.diagnosis}</span>
                        {bed.vitals && <span style={{ color: '#4ade80' }}>📊 {bed.vitals}</span>}
                      </div>
                    </div>
                  )}

                  {bed.status === 'reserved' && (
                    <div style={{ marginTop: '4px', color: '#fcd34d', fontSize: '0.8rem' }}>
                      ⏳ {bed.patientName}
                    </div>
                  )}

                  {bed.status === 'cleaning' && (
                    <div style={{ marginTop: '4px', color: '#d8b4fe', fontSize: '0.8rem' }}>
                      🧼 Sanitization In Progress
                    </div>
                  )}

                  <div className="bed-equipment-row">
                    <span className="bed-equip-tag">{bed.oxygen}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Selected Bed Details / Actions Modal */}
        {selectedBed && !showAdmitForm && !showTransferForm && (
          <div className="bed-action-panel" onClick={(e) => e.stopPropagation()}>
            <h3>Bed Details — {selectedBed.id} ({selectedBed.type})</h3>
            <p style={{ margin: '0', color: '#94a3b8', fontSize: '0.85rem' }}>
              Ward: <strong style={{ color: '#f8fafc' }}>{selectedBed.ward.toUpperCase()}</strong> • Room: <strong style={{ color: '#f8fafc' }}>{selectedBed.room}</strong> • Status: <strong style={{ color: selectedBed.status === 'vacant' ? '#10b981' : '#ef4444' }}>{t(selectedBed.status)}</strong>
            </p>

            {selectedBed.status === 'occupied' && (
              <div style={{ background: '#0f172a', padding: '12px', borderRadius: '8px', fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div><strong>Patient:</strong> {selectedBed.patientName} ({selectedBed.patientId})</div>
                <div><strong>Attending Doctor:</strong> {selectedBed.doctor}</div>
                <div><strong>Diagnosis:</strong> {selectedBed.diagnosis}</div>
                <div><strong>Admitted On:</strong> {selectedBed.admitDate}</div>
                <div><strong>Support:</strong> {selectedBed.oxygen}</div>
                {selectedBed.vitals && <div style={{ color: '#4ade80' }}><strong>Live Vitals:</strong> {selectedBed.vitals}</div>}
              </div>
            )}

            {selectedBed.status === 'cleaning' && (
              <div style={{ background: '#0f172a', padding: '12px', borderRadius: '8px', fontSize: '0.85rem', color: '#d8b4fe' }}>
                🧹 Housekeeping has sanitized this bed. Mark ready when inspection is complete.
              </div>
            )}

            <div className="bed-action-buttons">
              {selectedBed.status === 'vacant' && (
                <button className="bed-btn-primary" onClick={() => handleOpenAdmit(selectedBed)}>
                  ➕ {t('admitPatient')}
                </button>
              )}

              {selectedBed.status === 'occupied' && (
                <>
                  <button className="bed-btn-primary" onClick={() => handleOpenTransfer(selectedBed)}>
                    🔄 {t('transferBed')}
                  </button>
                  <button className="bed-btn-danger" onClick={() => handleDischarge(selectedBed.id)}>
                    🚪 {t('dischargeClean')}
                  </button>
                </>
              )}

              {selectedBed.status === 'cleaning' && (
                <button className="bed-btn-primary" style={{ background: '#10b981' }} onClick={() => handleCompleteSanitize(selectedBed.id)}>
                  ✓ Mark Sanitized & Available
                </button>
              )}

              <button className="bed-btn-secondary" onClick={() => setSelectedBed(null)}>
                {t('close')}
              </button>
            </div>
          </div>
        )}

        {/* Admit Patient Form Modal */}
        {showAdmitForm && selectedBed && (
          <form className="bed-action-panel" onSubmit={submitAdmit} onClick={(e) => e.stopPropagation()}>
            <h3>➕ {t('admitPatient')} to {selectedBed.id}</h3>
            
            <div className="bed-form-group">
              <label>{t('patientName')} *</label>
              <input 
                type="text" 
                required 
                placeholder="e.g. Ramesh Kumar"
                value={admitPatName}
                onChange={(e) => setAdmitPatName(e.target.value)}
              />
            </div>

            <div className="bed-form-group">
              <label>Patient Medical Record Number (MRN / ID)</label>
              <input 
                type="text" 
                value={admitPatId}
                onChange={(e) => setAdmitPatId(e.target.value)}
              />
            </div>

            <div className="bed-form-group">
              <label>{t('attendingDoctor')}</label>
              <select value={admitDoctor} onChange={(e) => setAdmitDoctor(e.target.value)}>
                <option value="Dr. Sarah Connor">Dr. Sarah Connor (Cardiology & Critical Care)</option>
                <option value="Dr. Gregory House">Dr. Gregory House (Diagnostic Medicine)</option>
                <option value="Dr. Meredith Grey">Dr. Meredith Grey (General Surgery / Trauma)</option>
                <option value="Dr. Hemavathi Rao">Dr. Hemavathi Rao (Internal Medicine)</option>
              </select>
            </div>

            <div className="bed-form-group">
              <label>{t('diagnosis')}</label>
              <input 
                type="text" 
                placeholder="e.g. Acute Myocardial Infarction / Post-Op Recovery"
                value={admitDiagnosis}
                onChange={(e) => setAdmitDiagnosis(e.target.value)}
              />
            </div>

            <div className="bed-form-group">
              <label>{t('oxygenRequired')}</label>
              <select value={admitOxygen} onChange={(e) => setAdmitOxygen(e.target.value)}>
                <option value="Room Air">Room Air (No support)</option>
                <option value="Nasal Cannula (2-4L O2)">Nasal Cannula (2-4L O2)</option>
                <option value="High-Flow Mask (6-10L O2)">High-Flow Mask (6-10L O2)</option>
                <option value="BiPAP / CPAP Machine">BiPAP / CPAP Machine</option>
                <option value="Mechanical Ventilator (Intubated)">Mechanical Ventilator (Intubated)</option>
              </select>
            </div>

            <div className="bed-action-buttons">
              <button type="submit" className="bed-btn-primary">
                ✓ Confirm Admission
              </button>
              <button type="button" className="bed-btn-secondary" onClick={() => setShowAdmitForm(false)}>
                {t('cancel')}
              </button>
            </div>
          </form>
        )}

        {/* Transfer Bed Modal */}
        {showTransferForm && selectedBed && (
          <form className="bed-action-panel" onSubmit={submitTransfer} onClick={(e) => e.stopPropagation()}>
            <h3>🔄 {t('transferBed')} for {selectedBed.patientName}</h3>
            <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.85rem' }}>
              Current: <strong>{selectedBed.id}</strong> ({selectedBed.ward.toUpperCase()})
            </p>

            <div className="bed-form-group">
              <label>Select Target Vacant Bed *</label>
              <select 
                value={targetBedId} 
                onChange={(e) => setTargetBedId(e.target.value)}
                required
              >
                {beds.filter(b => b.status === 'vacant' && b.id !== selectedBed.id).map(b => (
                  <option key={b.id} value={b.id}>
                    {b.id} — {b.ward.toUpperCase()} ({b.type}, Room {b.room})
                  </option>
                ))}
              </select>
            </div>

            <div className="bed-action-buttons">
              <button type="submit" className="bed-btn-primary">
                ✓ Confirm Transfer
              </button>
              <button type="button" className="bed-btn-secondary" onClick={() => setShowTransferForm(false)}>
                {t('cancel')}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
