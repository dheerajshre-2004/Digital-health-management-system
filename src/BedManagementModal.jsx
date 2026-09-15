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

export default function BedManagementModal({ onClose, inline = false }) {
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
    const updated = beds.map(b => {
      if (b.id === bedId) {
        return {
          ...b,
          status: 'vacant',
          patientName: '',
          patientId: '',
          doctor: '',
          diagnosis: '',
          admitDate: '',
          vitals: ''
        };
      }
      return b;
    });
    setBeds(updated);
    try {
      localStorage.setItem('dhms_beds_inventory', JSON.stringify(updated));
      if (window.dispatchEvent) {
        window.dispatchEvent(new Event('storage'));
      }
    } catch (e) {}
    setSelectedBed(null);
  };

  const handleCompleteSanitize = (bedId) => {
    const updated = beds.map(b => {
      if (b.id === bedId) {
        return {
          ...b,
          status: 'vacant',
          patientName: '',
          patientId: '',
          doctor: '',
          diagnosis: '',
          admitDate: '',
          vitals: ''
        };
      }
      return b;
    });
    setBeds(updated);
    try {
      localStorage.setItem('dhms_beds_inventory', JSON.stringify(updated));
      if (window.dispatchEvent) {
        window.dispatchEvent(new Event('storage'));
      }
    } catch (e) {}
    setSelectedBed(null);
  };

  const content = (
    <div className={`bed-matrix-modal ${inline ? 'bed-matrix-inline' : ''}`} onClick={(e) => e.stopPropagation()}>
      {/* Header */}
      <div className="bed-matrix-header">
        <div className="bed-matrix-header-title">
          <h2>Inpatient & ICU Bed Matrix</h2>
          <span className="bed-live-chip">
            <span className="bed-live-dot"></span>
            LIVE CENSUS
          </span>
        </div>
        {!inline && onClose && (
          <button className="bed-close-btn" onClick={onClose}>×</button>
        )}
      </div>

      {/* Live Metrics HUD */}
      <div className="bed-metrics-grid">
        <div className="bed-metric-card">
          <div className="bed-metric-info">
            <span className="bed-metric-val">{totalCount}</span>
            <span className="bed-metric-label">Total Beds</span>
          </div>
        </div>
        <div className="bed-metric-card" style={{ borderLeft: '4px solid #dc2626' }}>
          <div className="bed-metric-info">
            <span className="bed-metric-val" style={{ color: '#dc2626' }}>{occupiedCount}</span>
            <span className="bed-metric-label">Occupied ({Math.round((occupiedCount / totalCount) * 100)}%)</span>
          </div>
        </div>
        <div className="bed-metric-card" style={{ borderLeft: '4px solid #16a34a' }}>
          <div className="bed-metric-info">
            <span className="bed-metric-val" style={{ color: '#16a34a' }}>{vacantCount}</span>
            <span className="bed-metric-label">Available / Vacant</span>
          </div>
        </div>
        <div className="bed-metric-card" style={{ borderLeft: '4px solid #2563eb' }}>
          <div className="bed-metric-info">
            <span className="bed-metric-val" style={{ color: '#2563eb' }}>{icuUtilPercent}%</span>
            <span className="bed-metric-label">ICU Occupancy ({icuOccupied}/{icuBeds.length})</span>
          </div>
        </div>
        <div className="bed-metric-card" style={{ borderLeft: '4px solid #475569' }}>
          <div className="bed-metric-info">
            <span className="bed-metric-val">{readyVentilators}</span>
            <span className="bed-metric-label">Ventilators Ready</span>
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
            <span>All Wards & Wings</span>
            <span className="bed-ward-count">{beds.length}</span>
          </button>
          <button 
            className={`bed-ward-btn ${selectedWard === 'icu' ? 'active' : ''}`}
            onClick={() => setSelectedWard('icu')}
          >
            <span>ICU & Critical Care</span>
            <span className="bed-ward-count">{beds.filter(b => b.ward === 'icu').length}</span>
          </button>
          <button 
            className={`bed-ward-btn ${selectedWard === 'emergency' ? 'active' : ''}`}
            onClick={() => setSelectedWard('emergency')}
          >
            <span>Emergency & Trauma</span>
            <span className="bed-ward-count">{beds.filter(b => b.ward === 'emergency').length}</span>
          </button>
          <button 
            className={`bed-ward-btn ${selectedWard === 'general' ? 'active' : ''}`}
            onClick={() => setSelectedWard('general')}
          >
            <span>General Medical Ward</span>
            <span className="bed-ward-count">{beds.filter(b => b.ward === 'general').length}</span>
          </button>
          <button 
            className={`bed-ward-btn ${selectedWard === 'maternity' ? 'active' : ''}`}
            onClick={() => setSelectedWard('maternity')}
          >
            <span>Maternity & Pediatric</span>
            <span className="bed-ward-count">{beds.filter(b => b.ward === 'maternity').length}</span>
          </button>
          <button 
            className={`bed-ward-btn ${selectedWard === 'deluxe' ? 'active' : ''}`}
            onClick={() => setSelectedWard('deluxe')}
          >
            <span>Deluxe Private Suites</span>
            <span className="bed-ward-count">{beds.filter(b => b.ward === 'deluxe').length}</span>
          </button>
        </div>

        {/* Floor Plan Grid */}
        <div className="bed-floor-plan">
          <div className="bed-legend-bar">
            <div className="bed-legend-item">
              <span className="bed-legend-box" style={{ background: '#16a34a' }}></span>
              <span>Vacant (Click to Admit)</span>
            </div>
            <div className="bed-legend-item">
              <span className="bed-legend-box" style={{ background: '#dc2626' }}></span>
              <span>Occupied (Click for Details)</span>
            </div>
            <div className="bed-legend-item">
              <span className="bed-legend-box" style={{ background: '#d97706' }}></span>
              <span>Reserved</span>
            </div>
            <div className="bed-legend-item">
              <span className="bed-legend-box" style={{ background: '#7c3aed' }}></span>
              <span>Sanitizing</span>
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
                  <span className="bed-status-tag">{bed.status.toUpperCase()}</span>
                </div>

                <div className="bed-card-meta">
                  <span style={{ color: '#0284c7', fontWeight: '600' }}>{bed.type}</span>
                  <span>Room: {bed.room}</span>
                </div>

                {bed.status === 'occupied' && (
                  <div style={{ marginTop: '6px', borderTop: '1px solid #e2e8f0', paddingTop: '6px' }}>
                    <div className="bed-card-patient">{bed.patientName}</div>
                    <div className="bed-card-meta">
                      <span>Doctor: {bed.doctor}</span>
                      <span>Diagnosis: {bed.diagnosis}</span>
                      {bed.vitals && <span style={{ color: '#0f766e', fontWeight: '600' }}>Vitals: {bed.vitals}</span>}
                    </div>
                  </div>
                )}

                {bed.status === 'reserved' && (
                  <div style={{ marginTop: '6px', color: '#b45309', fontSize: '0.8rem', fontWeight: '600' }}>
                    Reserved: {bed.patientName}
                  </div>
                )}

                {bed.status === 'cleaning' && (
                  <div style={{ marginTop: '6px', color: '#7c3aed', fontSize: '0.8rem', fontWeight: '600' }}>
                    Sanitization In Progress
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
          <h3>Bed Details: {selectedBed.id} ({selectedBed.type})</h3>
          <p style={{ margin: '0', color: '#64748b', fontSize: '0.85rem' }}>
            Ward: <strong style={{ color: '#1e293b' }}>{selectedBed.ward.toUpperCase()}</strong> • Room: <strong style={{ color: '#1e293b' }}>{selectedBed.room}</strong> • Status: <strong style={{ color: selectedBed.status === 'vacant' ? '#16a34a' : '#dc2626' }}>{selectedBed.status.toUpperCase()}</strong>
          </p>

          {selectedBed.status === 'occupied' && (
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '12px', borderRadius: '6px', fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div><strong>Patient:</strong> {selectedBed.patientName} ({selectedBed.patientId})</div>
              <div><strong>Attending Doctor:</strong> {selectedBed.doctor}</div>
              <div><strong>Diagnosis:</strong> {selectedBed.diagnosis}</div>
              <div><strong>Admitted On:</strong> {selectedBed.admitDate}</div>
              <div><strong>Support:</strong> {selectedBed.oxygen}</div>
              {selectedBed.vitals && <div style={{ color: '#0f766e', fontWeight: '600' }}><strong>Live Vitals:</strong> {selectedBed.vitals}</div>}
            </div>
          )}

          {selectedBed.status === 'cleaning' && (
            <div style={{ background: '#f5f3ff', border: '1px solid #ddd6fe', padding: '12px', borderRadius: '6px', fontSize: '0.85rem', color: '#6d28d9' }}>
              Housekeeping sanitization cycle underway. Inspect and mark ready when complete.
            </div>
          )}

          <div className="bed-action-buttons">
            {selectedBed.status === 'vacant' && (
              <button className="bed-btn-primary" onClick={() => handleOpenAdmit(selectedBed)}>
                Admit Patient
              </button>
            )}

            {selectedBed.status === 'occupied' && (
              <>
                <button className="bed-btn-primary" onClick={() => handleOpenTransfer(selectedBed)}>
                  Transfer Bed
                </button>
                <button className="bed-btn-danger" onClick={() => handleDischarge(selectedBed.id)}>
                  Discharge & Sanitize
                </button>
              </>
            )}

            {selectedBed.status === 'cleaning' && (
              <button className="bed-btn-primary" style={{ background: '#16a34a' }} onClick={() => handleCompleteSanitize(selectedBed.id)}>
                Mark Sanitized & Ready
              </button>
            )}

            <button className="bed-btn-secondary" onClick={() => setSelectedBed(null)}>
              Close
            </button>
          </div>
        </div>
      )}

      {/* Admit Patient Form Modal */}
      {showAdmitForm && selectedBed && (
        <form className="bed-action-panel" onSubmit={submitAdmit} onClick={(e) => e.stopPropagation()}>
          <h3>Admit Patient to Bed {selectedBed.id}</h3>
          
          <div className="bed-form-group">
            <label>Patient Name *</label>
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
            <label>Attending Doctor</label>
            <select value={admitDoctor} onChange={(e) => setAdmitDoctor(e.target.value)}>
              {(() => {
                const docList = JSON.parse(localStorage.getItem('dhms_doctors') || '[]');
                if (docList && docList.length > 0) {
                  return docList.map(d => (
                    <option key={d.id} value={d.name}>
                      {d.name} ({d.department || d.specialty || 'General'})
                    </option>
                  ));
                }
                return (
                  <>
                    <option value="Dr. Sarah Connor">Dr. Sarah Connor (Cardiology & Critical Care)</option>
                    <option value="Dr. Gregory House">Dr. Gregory House (Diagnostic Medicine)</option>
                    <option value="Dr. Meredith Grey">Dr. Meredith Grey (General Surgery / Trauma)</option>
                    <option value="Dr. Hemavathi Rao">Dr. Hemavathi Rao (Internal Medicine)</option>
                  </>
                );
              })()}
            </select>
          </div>

          <div className="bed-form-group">
            <label>Diagnosis</label>
            <input 
              type="text" 
              placeholder="e.g. Acute Myocardial Infarction / Post-Op Recovery"
              value={admitDiagnosis}
              onChange={(e) => setAdmitDiagnosis(e.target.value)}
            />
          </div>

          <div className="bed-form-group">
            <label>Oxygen Support Required</label>
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
              Confirm Admission
            </button>
            <button type="button" className="bed-btn-secondary" onClick={() => setShowAdmitForm(false)}>
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Transfer Bed Modal */}
      {showTransferForm && selectedBed && (
        <form className="bed-action-panel" onSubmit={submitTransfer} onClick={(e) => e.stopPropagation()}>
          <h3>Transfer Bed for {selectedBed.patientName}</h3>
          <p style={{ margin: 0, color: '#64748b', fontSize: '0.85rem' }}>
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
              Confirm Transfer
            </button>
            <button type="button" className="bed-btn-secondary" onClick={() => setShowTransferForm(false)}>
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );

  if (inline) {
    return <div className="bed-matrix-inline-container">{content}</div>;
  }

  return (
    <div className="bed-matrix-overlay" onClick={onClose}>
      {content}
    </div>
  );
}
