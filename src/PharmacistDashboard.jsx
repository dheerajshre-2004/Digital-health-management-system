import React, { useState, useEffect } from 'react';
import './PharmacistDashboard.css';

export default function PharmacistDashboard({ onLogout }) {
  const [activeTab, setActiveTab] = useState('overview');
  
  // Local storage states
  const [medications, setMedications] = useState([]);
  const [staff, setStaff] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [admissions, setAdmissions] = useState([]);

  // Form states
  const [newMed, setNewMed] = useState({
    name: '',
    genericName: '',
    category: 'Antibiotics',
    stock: 50,
    price: 10.00,
    isEmergency: false,
    lowStockThreshold: 15
  });

  const [attendanceForm, setAttendanceForm] = useState({
    staffId: '',
    status: 'Present',
    checkIn: '09:00 AM',
    checkOut: '05:00 PM',
    date: new Date().toISOString().split('T')[0]
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [showEmergencyOnly, setShowEmergencyOnly] = useState(false);
  const [selectedMedForStock, setSelectedMedForStock] = useState(null);
  const [stockToUpdate, setStockToUpdate] = useState(0);

  // Load from LocalStorage on mount
  useEffect(() => {
    setMedications(JSON.parse(localStorage.getItem('dhms_medications') || '[]'));
    setStaff(JSON.parse(localStorage.getItem('dhms_pharmacy_staff') || '[]'));
    setAttendance(JSON.parse(localStorage.getItem('dhms_pharmacy_attendance') || '[]'));
    setPrescriptions(JSON.parse(localStorage.getItem('dhms_prescriptions') || '[]'));
    setAdmissions(JSON.parse(localStorage.getItem('dhms_admissions') || '[]'));
  }, []);

  // Sync helpers
  const saveMedications = (updated) => {
    setMedications(updated);
    localStorage.setItem('dhms_medications', JSON.stringify(updated));
  };

  const saveAttendance = (updated) => {
    setAttendance(updated);
    localStorage.setItem('dhms_pharmacy_attendance', JSON.stringify(updated));

    // Also sync to dhms_master_attendance
    const allAtt = JSON.parse(localStorage.getItem('dhms_master_attendance') || '[]');
    let currentMaster = [...allAtt];

    updated.forEach(log => {
      const newRecord = {
        id: `ATT-${Math.floor(1000 + Math.random() * 9000)}`,
        date: log.date,
        module: 'Pharmacist',
        staffId: log.staffId,
        staffName: log.name,
        role: 'Pharmacist Specialist',
        checkIn: log.status === 'Absent' || log.status === 'On Leave' ? '-' : log.checkIn,
        checkOut: log.status === 'Absent' || log.status === 'On Leave' ? '-' : log.checkOut,
        status: log.status,
        remarks: 'Pharmacy Counter Shift'
      };
      const idx = currentMaster.findIndex(a => a.date === newRecord.date && a.staffId === newRecord.staffId);
      if (idx >= 0) {
        currentMaster[idx] = { ...currentMaster[idx], ...newRecord };
      } else {
        currentMaster.unshift(newRecord);
      }
    });

    localStorage.setItem('dhms_master_attendance', JSON.stringify(currentMaster));
  };

  const savePrescriptions = (updated) => {
    setPrescriptions(updated);
    localStorage.setItem('dhms_prescriptions', JSON.stringify(updated));
  };

  const saveAdmissions = (updated) => {
    setAdmissions(updated);
    localStorage.setItem('dhms_admissions', JSON.stringify(updated));
  };

  // 1. Attendance actions
  const handleMarkAttendance = (e) => {
    e.preventDefault();
    if (!attendanceForm.staffId) return;

    const staffMember = staff.find(s => s.id === attendanceForm.staffId);
    if (!staffMember) return;

    const chosenDate = attendanceForm.date || new Date().toISOString().split('T')[0];

    // Check if already checked in on this date
    const alreadyLoggedIndex = attendance.findIndex(a => a.date === chosenDate && a.staffId === staffMember.id);
    const log = {
      date: chosenDate,
      staffId: staffMember.id,
      name: staffMember.name,
      checkIn: attendanceForm.checkIn,
      checkOut: attendanceForm.checkOut,
      status: attendanceForm.status
    };

    let updatedAttendance;
    if (alreadyLoggedIndex >= 0) {
      updatedAttendance = [...attendance];
      updatedAttendance[alreadyLoggedIndex] = log;
    } else {
      updatedAttendance = [log, ...attendance];
    }

    saveAttendance(updatedAttendance);
    alert(`Attendance logged successfully for ${staffMember.name}!`);
  };

  // 2. Medication / Stock actions
  const handleAddMedication = (e) => {
    e.preventDefault();
    if (!newMed.name || !newMed.genericName) return;

    const newEntry = {
      ...newMed,
      id: `MED-${Math.floor(100 + Math.random() * 900)}`,
      stock: parseInt(newMed.stock) || 0,
      price: parseFloat(newMed.price) || 0.00,
      lowStockThreshold: parseInt(newMed.lowStockThreshold) || 10
    };

    const updated = [...medications, newEntry];
    saveMedications(updated);
    setNewMed({
      name: '',
      genericName: '',
      category: 'Antibiotics',
      stock: 50,
      price: 10.00,
      isEmergency: false,
      lowStockThreshold: 15
    });
    alert(`${newEntry.name} added to inventory!`);
  };

  const handleUpdateStock = (e) => {
    e.preventDefault();
    if (!selectedMedForStock) return;

    const updated = medications.map(med => {
      if (med.id === selectedMedForStock.id) {
        return { ...med, stock: med.stock + parseInt(stockToUpdate) };
      }
      return med;
    });

    saveMedications(updated);
    setSelectedMedForStock(null);
    setStockToUpdate(0);
  };

  const toggleEmergency = (medId) => {
    const updated = medications.map(med => {
      if (med.id === medId) {
        return { ...med, isEmergency: !med.isEmergency };
      }
      return med;
    });
    saveMedications(updated);
  };

  // 3. Dispense actions
  const handleDispense = (rx) => {
    // Check if medication name exists in inventory to deduct stock
    // Since rx.medication contains name and dosage e.g. "Amoxicillin 500mg (Once Daily (QD), 7 Days)"
    // We will do a fuzzy match with medication list names
    let matchedMed = medications.find(m => rx.medication.toLowerCase().includes(m.name.toLowerCase()) || rx.medication.toLowerCase().includes(m.genericName.toLowerCase()));

    if (matchedMed) {
      if (matchedMed.stock <= 0) {
        alert(`Error: Stock depleted for ${matchedMed.name}. Please restock before dispensing.`);
        return;
      }

      // Deduct 1 pack/vial/dose from stock
      const updatedMeds = medications.map(m => {
        if (m.id === matchedMed.id) {
          return { ...m, stock: m.stock - 1 };
        }
        return m;
      });
      saveMedications(updatedMeds);
    }

    // Update prescription status
    const updatedRx = prescriptions.map(r => {
      if (r.id === rx.id) {
        return { ...r, status: 'Dispensed & Billed' };
      }
      return r;
    });
    savePrescriptions(updatedRx);

    // If it's inpatient, we add it to the patient's admission medications billing
    if (rx.type === 'Inpatient') {
      const updatedAdmissions = admissions.map(adm => {
        if (adm.patientId === rx.patientId && adm.status === 'Admitted') {
          const medList = adm.medications || [];
          const exists = medList.findIndex(m => m.name === rx.medication || rx.medication.includes(m.name));
          let newMedList;
          if (exists >= 0) {
            newMedList = [...medList];
            newMedList[exists] = { ...newMedList[exists], status: 'Dispensed' };
          } else {
            newMedList = [...medList, {
              name: rx.medication,
              instructions: rx.instructions,
              cost: parseFloat(rx.cost) || 0.00,
              status: 'Dispensed',
              date: new Date().toISOString().split('T')[0]
            }];
          }
          return { ...adm, medications: newMedList };
        }
        return adm;
      });
      saveAdmissions(updatedAdmissions);
    } else {
      // Outpatient: Add directly to Receptionist's central billing list
      const billing = JSON.parse(localStorage.getItem('dhms_billing') || '[]');
      const newInvoice = {
        id: `INV-${Math.floor(1000 + Math.random() * 9000)}`,
        patientId: rx.patientId,
        patientName: rx.patientName,
        date: new Date().toISOString().split('T')[0],
        amount: `$${parseFloat(rx.cost).toFixed(2)}`,
        status: 'Unpaid',
        type: 'Pharmacy Prescription'
      };
      localStorage.setItem('dhms_billing', JSON.stringify([newInvoice, ...billing]));
    }

    alert(`Successfully dispensed ${rx.medication} for ${rx.patientName}!`);
  };

  // 4. Inpatient Billing / Discharge
  const calculatePharmacyBill = (adm) => {
    if (!adm.medications) return 0;
    return adm.medications
      .filter(m => m.status === 'Dispensed')
      .reduce((sum, m) => sum + (parseFloat(m.cost) || 0), 0);
  };

  const handleDownloadInvoice = (adm) => {
    const totalBill = calculatePharmacyBill(adm);
    const invoiceText = `
=========================================
      DHMS HOSPITAL PHARMACY INVOICE
=========================================
Invoice ID: INV-${adm.id.replace('ADM-', '')}
Admission ID: ${adm.id}
Patient Name: ${adm.patientName} (ID: ${adm.patientId})
Admitting Doctor: ${adm.doctorName}
Ward/Room: ${adm.ward}
Admission Date: ${adm.admissionDate}
Discharge Date: ${adm.dischargeDate || 'N/A'}
Status: ${adm.status}
Pharmacy Bill Paid: ${adm.pharmacyBillPaid ? 'YES' : 'NO'}
-----------------------------------------
MEDICATIONS DISPENSED:
${(adm.medications || []).map((m, i) => `${i + 1}. ${m.name}
   - Instructions: ${m.instructions || 'N/A'}
   - Date: ${m.date}
   - Cost: $${parseFloat(m.cost).toFixed(2)} (${m.status})`).join('\n')}
-----------------------------------------
TOTAL PHARMACY BILL: $${totalBill.toFixed(2)}
=========================================
Generated on: ${new Date().toLocaleString()}
Thank you for using DHMS Hospital.
`;

    const element = document.createElement("a");
    const file = new Blob([invoiceText], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = `DHMS_Invoice_${adm.id}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleDischargeAndPay = (adm) => {
    const totalBill = calculatePharmacyBill(adm);
    const confirmPay = window.confirm(`Patient ${adm.patientName} total pharmacy bill is $${totalBill.toFixed(2)}. Proceed with payment and discharge?`);
    if (!confirmPay) return;

    // Update admission record
    const today = new Date().toISOString().split('T')[0];
    const updatedAdmissions = admissions.map(a => {
      if (a.id === adm.id) {
        return {
          ...a,
          status: 'Discharged',
          dischargeDate: today,
          pharmacyBillPaid: true
        };
      }
      return a;
    });
    saveAdmissions(updatedAdmissions);

    // Record billing transaction
    const billing = JSON.parse(localStorage.getItem('dhms_billing') || '[]');
    const newInvoice = {
      id: `INV-${Math.floor(1000 + Math.random() * 9000)}`,
      patientId: adm.patientId,
      patientName: adm.patientName,
      date: today,
      amount: `$${totalBill.toFixed(2)}`,
      status: 'Paid',
      type: 'Admitted Pharmacy Bill'
    };
    localStorage.setItem('dhms_billing', JSON.stringify([newInvoice, ...billing]));

    alert(`Patient ${adm.patientName} discharged successfully and bill marked as Paid.`);
  };

  // Filters
  const filteredMedications = medications.filter(med => {
    const matchesSearch = med.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          med.genericName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'All' || med.category === categoryFilter;
    const matchesEmergency = !showEmergencyOnly || med.isEmergency;
    return matchesSearch && matchesCategory && matchesEmergency;
  });

  const lowStockCount = medications.filter(m => m.stock <= m.lowStockThreshold).length;
  const emergencyCount = medications.filter(m => m.isEmergency).length;

  return (
    <div className="pharmacy-container">
      {/* Topbar */}
      <div className="pharmacy-topbar">
        <div className="pharmacy-logo-area">
          <svg className="pharmacy-logo-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" style={{ width: '28px', height: '28px', color: '#10b981' }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="pharmacy-logo-text">DHMS</span>
          <span className="pharmacy-logo-divider">|</span>
          <span className="pharmacy-logo-sub">Pharmacy Portal</span>
        </div>
        <div className="pharmacy-topbar-right">
          <div className="pharmacy-profile-info">
            <div className="pharmacy-avatar">PH</div>
            <div className="pharmacy-user-details">
              <strong>Pharmacist Specialist</strong>
              <span>Clinical Operations</span>
            </div>
          </div>
          <button onClick={onLogout} className="pharmacy-btn-logout">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '16px', height: '16px' }}>
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
            Sign Out
          </button>
        </div>
      </div>

      {/* Main Workspace */}
      <div className="pharmacy-workspace">
        {/* Sidebar Nav */}
        <div className="pharmacy-sidebar">
          <ul className="pharmacy-nav-links">
            <li className={activeTab === 'overview' ? 'active' : ''} onClick={() => setActiveTab('overview')}>
              Overview
            </li>
            <li className={activeTab === 'attendance' ? 'active' : ''} onClick={() => setActiveTab('attendance')}>
              Staff Attendance
            </li>
            <li className={activeTab === 'inventory' ? 'active' : ''} onClick={() => setActiveTab('inventory')}>
              Inventory / Stock
            </li>
            <li className={activeTab === 'dispensing' ? 'active' : ''} onClick={() => setActiveTab('dispensing')}>
              Dispensing
            </li>
            <li className={activeTab === 'billing' ? 'active' : ''} onClick={() => setActiveTab('billing')}>
              Admissions & Billing
            </li>
          </ul>
        </div>

        {/* Content Area */}
        <div className="pharmacy-content-area">
          {activeTab === 'overview' && (
            <div className="view-pane animate-fade-in">
              <h1 className="pane-title">Pharmacy Operations Center</h1>
              
              <div className="stats-grid">
                <div className="stat-card urgent">
                  <h3>Low Stock Warning</h3>
                  <p className="value">{lowStockCount}</p>
                  <span>Medications below safety threshold</span>
                </div>
                <div className="stat-card emergency">
                  <h3>Emergency Drugs</h3>
                  <p className="value">{emergencyCount}</p>
                  <span>Critical care medications in inventory</span>
                </div>
                <div className="stat-card info">
                  <h3>Pending Prescriptions</h3>
                  <p className="value">{prescriptions.filter(r => r.status === 'Pending' || r.status === 'Advised').length}</p>
                  <span>Outpatient Rx & Inpatient Advise</span>
                </div>
                <div className="stat-card success">
                  <h3>Active Inpatient Admissions</h3>
                  <p className="value">{admissions.filter(a => a.status === 'Admitted').length}</p>
                  <span>Admitted patients receiving pharmacy billing</span>
                </div>
              </div>

              {/* Quick Emergency Drugs Monitor */}
              <div className="section-card" style={{ marginTop: '24px' }}>
                <h2>Critical Emergency Drug Watchlist</h2>
                <p className="section-desc">Quick monitor for life-saving drugs. Immediate restocking required for items in red.</p>
                <div className="quick-emergency-grid">
                  {medications.filter(m => m.isEmergency).map(med => (
                    <div key={med.id} className={`emergency-pill ${med.stock <= med.lowStockThreshold ? 'danger' : 'safe'}`}>
                      <div className="pill-header">
                        <strong>{med.name}</strong>
                        <span className="stock-badge">{med.stock} Units Left</span>
                      </div>
                      <div className="pill-body">
                        <span>Generic: {med.genericName}</span>
                        <span>Min Threshold: {med.lowStockThreshold}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'attendance' && (
            <div className="view-pane animate-fade-in">
              <h1 className="pane-title">Staff Attendance System</h1>
              
              <div className="grid-split">
                <div className="section-card">
                  <h2>Mark Shift Attendance</h2>
                  <form onSubmit={handleMarkAttendance} className="custom-form">
                    <div className="form-group">
                      <label>Select Pharmacy Staff Member</label>
                      <select 
                        value={attendanceForm.staffId} 
                        onChange={(e) => setAttendanceForm({...attendanceForm, staffId: e.target.value})}
                        required
                      >
                        <option value="">-- Choose Member --</option>
                        {staff.map(s => (
                          <option key={s.id} value={s.id}>{s.name} ({s.role})</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Shift Date</label>
                      <input 
                        type="date" 
                        value={attendanceForm.date} 
                        onChange={(e) => setAttendanceForm({...attendanceForm, date: e.target.value})}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>Shift Status</label>
                      <select 
                        value={attendanceForm.status} 
                        onChange={(e) => setAttendanceForm({...attendanceForm, status: e.target.value})}
                      >
                        <option value="Present">Present</option>
                        <option value="Late">Late</option>
                        <option value="On Leave">On Leave</option>
                        <option value="Absent">Absent</option>
                      </select>
                    </div>

                    <div className="grid-2col">
                      <div className="form-group">
                        <label>Check In Time</label>
                        <input 
                          type="text" 
                          value={attendanceForm.checkIn} 
                          onChange={(e) => setAttendanceForm({...attendanceForm, checkIn: e.target.value})}
                        />
                      </div>
                      <div className="form-group">
                        <label>Check Out Time</label>
                        <input 
                          type="text" 
                          value={attendanceForm.checkOut} 
                          onChange={(e) => setAttendanceForm({...attendanceForm, checkOut: e.target.value})}
                        />
                      </div>
                    </div>

                    <button type="submit" className="btn-primary">Log Shift Details</button>
                  </form>
                </div>

                <div className="section-card">
                  <h2>Attendance Logs</h2>
                  <div className="table-wrapper">
                    <table className="dashboard-table">
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Name</th>
                          <th>Status</th>
                          <th>Check In</th>
                          <th>Check Out</th>
                        </tr>
                      </thead>
                      <tbody>
                        {attendance.map((log, idx) => (
                          <tr key={idx}>
                            <td>{log.date}</td>
                            <td><strong>{log.name}</strong></td>
                            <td>
                              <span className={`status-badge ${
                                log.status === 'Present' ? 'available' :
                                log.status === 'Late' ? 'surgery' : 'leave'
                              }`}>
                                {log.status}
                              </span>
                            </td>
                            <td>{log.checkIn}</td>
                            <td>{log.checkOut}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'inventory' && (
            <div className="view-pane animate-fade-in">
              <h1 className="pane-title">Medication Stock & Inventory Control</h1>

              <div className="inventory-controls">
                <input 
                  type="text" 
                  placeholder="Search medication or generic name..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="search-input"
                />
                
                <select 
                  value={categoryFilter} 
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="filter-select"
                >
                  <option value="All">All Categories</option>
                  <option value="Antibiotics">Antibiotics</option>
                  <option value="Cardiovascular">Cardiovascular</option>
                  <option value="NSAIDs">NSAIDs</option>
                  <option value="Analgesics">Analgesics</option>
                  <option value="Anaphylaxis / Cardiac">Anaphylaxis / Cardiac</option>
                  <option value="Antiarrhythmic">Antiarrhythmic</option>
                  <option value="Opioid Antagonist">Opioid Antagonist</option>
                </select>

                <label className="toggle-label">
                  <input 
                    type="checkbox" 
                    checked={showEmergencyOnly} 
                    onChange={(e) => setShowEmergencyOnly(e.target.checked)} 
                  />
                  Emergency Drugs Only
                </label>
              </div>

              <div className="grid-split-3-1" style={{ marginTop: '20px' }}>
                <div className="section-card">
                  <h2>Medication List</h2>
                  <div className="table-wrapper">
                    <table className="dashboard-table">
                      <thead>
                        <tr>
                          <th>Code</th>
                          <th>Name</th>
                          <th>Generic Name</th>
                          <th>Stock Left</th>
                          <th>Price</th>
                          <th>Emergency</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredMedications.map(med => (
                          <tr key={med.id}>
                            <td><strong>{med.id}</strong></td>
                            <td>
                              <strong>{med.name}</strong>
                              <div className="subtitle">{med.category}</div>
                            </td>
                            <td>{med.genericName}</td>
                            <td>
                              <span className={`stock-text ${med.stock <= med.lowStockThreshold ? 'alert' : ''}`}>
                                {med.stock} Units
                              </span>
                              {med.stock <= med.lowStockThreshold && <span className="warning-indicator">Low Stock</span>}
                            </td>
                            <td><strong>${med.price.toFixed(2)}</strong></td>
                            <td>
                              <button onClick={() => toggleEmergency(med.id)} className={`emergency-toggle ${med.isEmergency ? 'active' : ''}`}>
                                {med.isEmergency ? 'Emergency' : 'Standard'}
                              </button>
                            </td>
                            <td>
                              <button 
                                onClick={() => { setSelectedMedForStock(med); setStockToUpdate(10); }}
                                className="btn-action-restock"
                              >
                                Add Stock
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="section-card">
                  <h2>Add Medication</h2>
                  <form onSubmit={handleAddMedication} className="custom-form">
                    <div className="form-group">
                      <label>Drug Name & Strength</label>
                      <input 
                        type="text" 
                        placeholder="e.g. Amoxicillin 500mg" 
                        value={newMed.name}
                        onChange={(e) => setNewMed({...newMed, name: e.target.value})}
                        required 
                      />
                    </div>
                    <div className="form-group">
                      <label>Generic Chemical Name</label>
                      <input 
                        type="text" 
                        placeholder="e.g. Amoxicillin" 
                        value={newMed.genericName}
                        onChange={(e) => setNewMed({...newMed, genericName: e.target.value})}
                        required 
                      />
                    </div>
                    <div className="form-group">
                      <label>Category</label>
                      <select 
                        value={newMed.category} 
                        onChange={(e) => setNewMed({...newMed, category: e.target.value})}
                      >
                        <option value="Antibiotics">Antibiotics</option>
                        <option value="Cardiovascular">Cardiovascular</option>
                        <option value="NSAIDs">NSAIDs</option>
                        <option value="Analgesics">Analgesics</option>
                        <option value="Anaphylaxis / Cardiac">Anaphylaxis / Cardiac</option>
                        <option value="Antiarrhythmic">Antiarrhythmic</option>
                        <option value="Opioid Antagonist">Opioid Antagonist</option>
                      </select>
                    </div>
                    <div className="grid-2col">
                      <div className="form-group">
                        <label>Stock Count</label>
                        <input 
                          type="number" 
                          value={newMed.stock}
                          onChange={(e) => setNewMed({...newMed, stock: e.target.value})}
                        />
                      </div>
                      <div className="form-group">
                        <label>Unit Price ($)</label>
                        <input 
                          type="number" 
                          step="0.01" 
                          value={newMed.price}
                          onChange={(e) => setNewMed({...newMed, price: e.target.value})}
                        />
                      </div>
                    </div>
                    <div className="form-group">
                      <label>Low Stock Threshold</label>
                      <input 
                        type="number" 
                        value={newMed.lowStockThreshold}
                        onChange={(e) => setNewMed({...newMed, lowStockThreshold: e.target.value})}
                      />
                    </div>
                    <div className="form-group inline">
                      <label>
                        <input 
                          type="checkbox" 
                          checked={newMed.isEmergency}
                          onChange={(e) => setNewMed({...newMed, isEmergency: e.target.checked})}
                        />
                        Is Emergency Drug
                      </label>
                    </div>

                    <button type="submit" className="btn-primary">Add to Inventory</button>
                  </form>
                </div>
              </div>

              {/* Restock dialog modal */}
              {selectedMedForStock && (
                <div className="custom-modal-overlay">
                  <div className="custom-modal">
                    <h3>Restock Medication: {selectedMedForStock.name}</h3>
                    <form onSubmit={handleUpdateStock}>
                      <div className="form-group">
                        <label>Enter Units to Add</label>
                        <input 
                          type="number" 
                          value={stockToUpdate} 
                          onChange={(e) => setStockToUpdate(e.target.value)} 
                          min="1"
                          required
                        />
                      </div>
                      <div className="modal-actions">
                        <button type="button" className="btn-secondary" onClick={() => setSelectedMedForStock(null)}>Cancel</button>
                        <button type="submit" className="btn-primary">Add Units</button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'dispensing' && (
            <div className="view-pane animate-fade-in">
              <h1 className="pane-title">Prescription Dispensing Hub</h1>
              
              <div className="section-card">
                <h2>Pending Outpatient & Inpatient Medication Advise</h2>
                <p className="section-desc">Dispense doctor-prescribed medications. Outpatient orders generate central invoices, inpatient orders bill to active admission profiles.</p>
                
                <div className="table-wrapper">
                  <table className="dashboard-table">
                    <thead>
                      <tr>
                        <th>Rx Code</th>
                        <th>Patient Details</th>
                        <th>Prescribed Medication</th>
                        <th>Type</th>
                        <th>Prescribed By</th>
                        <th>Cost</th>
                        <th>Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {prescriptions.filter(rx => rx.status === 'Pending' || rx.status === 'Advised').map(rx => (
                        <tr key={rx.id}>
                          <td><strong>{rx.id}</strong></td>
                          <td>
                            <strong>{rx.patientName}</strong>
                            <div className="subtitle">ID: {rx.patientId}</div>
                          </td>
                          <td>
                            <strong>{rx.medication}</strong>
                            <div className="subtitle" style={{ fontStyle: 'italic' }}>{rx.instructions || 'No specific instructions'}</div>
                          </td>
                          <td>
                            <span className={`type-badge ${rx.type === 'Inpatient' ? 'inpatient' : 'outpatient'}`}>
                              {rx.type || 'Outpatient'}
                            </span>
                          </td>
                          <td>{rx.doctorName}</td>
                          <td><strong>${parseFloat(rx.cost).toFixed(2)}</strong></td>
                          <td>
                            <span className="status-badge surgery">
                              {rx.status}
                            </span>
                          </td>
                          <td>
                            <button 
                              onClick={() => handleDispense(rx)} 
                              className="btn-action-dispense"
                            >
                              Dispense Medicine
                            </button>
                          </td>
                        </tr>
                      ))}
                      {prescriptions.filter(rx => rx.status === 'Pending' || rx.status === 'Advised').length === 0 && (
                        <tr>
                          <td colSpan="8" style={{ textAlign: 'center', color: '#64748b', fontStyle: 'italic', padding: '20px' }}>
                            No pending prescriptions to dispense at this moment.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'billing' && (
            <div className="view-pane animate-fade-in">
              <h1 className="pane-title">Inpatient Admission Billing & Discharge</h1>
              
              <div className="section-card">
                <h2>Admitted Patients Pharmacy Bills</h2>
                <p className="section-desc">Track running pharmacy medication bills for admitted patients. Accept payment and process pharmacy discharge.</p>

                <div className="table-wrapper">
                  <table className="dashboard-table">
                    <thead>
                      <tr>
                        <th>Adm ID</th>
                        <th>Patient</th>
                        <th>Ward</th>
                        <th>Admission Date</th>
                        <th>Medications Given</th>
                        <th>Running Bill Total</th>
                        <th>Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {admissions.map(adm => (
                        <tr key={adm.id}>
                          <td><strong>{adm.id}</strong></td>
                          <td>
                            <strong>{adm.patientName}</strong>
                            <div className="subtitle">ID: {adm.patientId}</div>
                          </td>
                          <td>{adm.ward}</td>
                          <td>{adm.admissionDate}</td>
                          <td>
                            {adm.medications && adm.medications.length > 0 ? (
                              <div className="meds-list-cell">
                                {adm.medications.map((m, i) => (
                                  <span key={i} className={`med-item-pill ${m.status.toLowerCase()}`}>
                                    {m.name} ({m.status})
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="subtitle italic">No medications given yet</span>
                            )}
                          </td>
                          <td>
                            <strong style={{ fontSize: '15px', color: '#1e3a8a' }}>
                              ${calculatePharmacyBill(adm).toFixed(2)}
                            </strong>
                          </td>
                          <td>
                            <span className={`status-badge ${adm.status === 'Admitted' ? 'surgery' : 'available'}`}>
                              {adm.status}
                            </span>
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                              {adm.status === 'Admitted' ? (
                                <button 
                                  onClick={() => handleDischargeAndPay(adm)} 
                                  className="btn-action-discharge"
                                >
                                  Pay & Discharge
                                </button>
                              ) : (
                                <span className="completed-badge">Discharged & Paid</span>
                              )}
                              <button 
                                onClick={() => handleDownloadInvoice(adm)} 
                                className="btn-action-restock"
                                style={{ padding: '8px 12px', fontSize: '12px' }}
                              >
                                Download Invoice
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {admissions.length === 0 && (
                        <tr>
                          <td colSpan="8" style={{ textAlign: 'center', color: '#64748b', fontStyle: 'italic', padding: '20px' }}>
                            No admission records found in system.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
