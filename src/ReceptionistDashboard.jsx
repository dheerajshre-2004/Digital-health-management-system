import React, { useState } from 'react';
import './ReceptionistDashboard.css';

export default function ReceptionistDashboard({ onLogout, loggedInStaff }) {
  const [activeTab, setActiveTab] = useState('register_patient');

  // Load initial datasets from localStorage
  const [patients, setPatients] = useState(() => {
    return JSON.parse(localStorage.getItem('dhms_patients') || '[]');
  });

  const [appointments, setAppointments] = useState(() => {
    return JSON.parse(localStorage.getItem('dhms_appointments') || '[]');
  });

  const [doctorsList, setDoctorsList] = useState(() => {
    const saved = localStorage.getItem('dhms_doctors');
    if (saved) {
      const parsed = JSON.parse(saved);
      return parsed.map(d => ({
        ...d,
        specialty: d.specialty || d.department || 'Primary Care',
        room: d.room || 'Room 101',
        shift: d.shift || '09:00 AM - 05:00 PM',
        status: d.status || 'On Duty'
      }));
    }
    return [];
  });

  const [billingList, setBillingList] = useState(() => {
    const saved = localStorage.getItem('dhms_billing');
    if (saved) return JSON.parse(saved);
    localStorage.setItem('dhms_billing', JSON.stringify([]));
    return [];
  });

  // State for Patient Registration
  const [patientData, setPatientData] = useState({
    firstName: '',
    lastName: '',
    dob: '',
    gender: '',
    phone: '',
    email: '',
  });
  const [generatedId, setGeneratedId] = useState(null);
  const [generatedPassword, setGeneratedPassword] = useState(null);

  // Search & Pagination States for Patient Records
  const [patientSearch, setPatientSearch] = useState('');
  const [patientPage, setPatientPage] = useState(1);
  const itemsPerPage = 5;

  // Patient File Modal and History States
  const [selectedPatientFile, setSelectedPatientFile] = useState(null);
  const [selectedReportView, setSelectedReportView] = useState(null);
  const [activeModalTab, setActiveModalTab] = useState('appointments');
  const [billingModalAppt, setBillingModalAppt] = useState(null);
  const [billingModalFee, setBillingModalFee] = useState('120.00');
  const [billingModalType, setBillingModalType] = useState('Appointment Fee');
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [prescriptions, setPrescriptions] = useState(() => {
    return JSON.parse(localStorage.getItem('dhms_prescriptions') || '[]');
  });
  const [labRequests, setLabRequests] = useState(() => {
    return JSON.parse(localStorage.getItem('dhms_lab_requests') || '[]');
  });

  // Pagination States for Appointments
  const [apptPage, setApptPage] = useState(1);
  const [apptSubTab, setApptSubTab] = useState('on-place'); // 'on-place' or 'online'
  const apptsPerPage = 5;

  // Pagination States for Billing & Queue
  const [billingPage, setBillingPage] = useState(1);
  const [queuePage, setQueuePage] = useState(1);

  // Attendance State for Receptionist Staff
  const [masterAttendance, setMasterAttendance] = useState(() => {
    return JSON.parse(localStorage.getItem('dhms_master_attendance') || '[]');
  });

  const [recAttendanceForm, setRecAttendanceForm] = useState({
    staffId: '',
    staffName: '',
    role: 'Receptionist',
    date: new Date().toISOString().split('T')[0],
    status: 'Present',
    checkIn: '08:00 AM',
    checkOut: '04:30 PM',
    remarks: ''
  });

  React.useEffect(() => {
    const handleStorageChange = () => {
      setPatients(JSON.parse(localStorage.getItem('dhms_patients') || '[]'));
      setAppointments(JSON.parse(localStorage.getItem('dhms_appointments') || '[]'));
      const savedDocs = localStorage.getItem('dhms_doctors');
      if (savedDocs) {
        setDoctorsList(JSON.parse(savedDocs).map(d => ({
          ...d,
          specialty: d.specialty || d.department || 'Primary Care',
          room: d.room || 'Room 101',
          shift: d.shift || '09:00 AM - 05:00 PM',
          status: d.status || 'On Duty'
        })));
      }
      setBillingList(JSON.parse(localStorage.getItem('dhms_billing') || '[]'));
      setPrescriptions(JSON.parse(localStorage.getItem('dhms_prescriptions') || '[]'));
      setLabRequests(JSON.parse(localStorage.getItem('dhms_lab_requests') || '[]'));
      setMasterAttendance(JSON.parse(localStorage.getItem('dhms_master_attendance') || '[]'));
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const handleMarkRecAttendance = (e) => {
    e.preventDefault();
    const allAtt = JSON.parse(localStorage.getItem('dhms_master_attendance') || '[]');
    const newRecord = {
      id: `ATT-${Math.floor(1000 + Math.random() * 9000)}`,
      date: recAttendanceForm.date,
      module: 'Receptionist',
      staffId: recAttendanceForm.staffId,
      staffName: recAttendanceForm.staffName,
      role: recAttendanceForm.role,
      checkIn: recAttendanceForm.status === 'Absent' || recAttendanceForm.status === 'On Leave' ? '-' : recAttendanceForm.checkIn,
      checkOut: recAttendanceForm.status === 'Absent' || recAttendanceForm.status === 'On Leave' ? '-' : recAttendanceForm.checkOut,
      status: recAttendanceForm.status,
      remarks: recAttendanceForm.remarks || 'Reception Duty'
    };

    // Replace if record for same date & staffId exists
    const idx = allAtt.findIndex(a => a.date === newRecord.date && a.staffId === newRecord.staffId);
    let updated;
    if (idx >= 0) {
      updated = [...allAtt];
      updated[idx] = newRecord;
    } else {
      updated = [newRecord, ...allAtt];
    }

    localStorage.setItem('dhms_master_attendance', JSON.stringify(updated));
    setMasterAttendance(updated);
    alert(`Attendance logged successfully for ${recAttendanceForm.staffName} (${recAttendanceForm.status}).`);
  };

  const handleRegisterSubmit = (e) => {
    e.preventDefault();
    const newId = `PT-${Math.floor(10000 + Math.random() * 90000)}`;
    const randomPassword = `pass_${Math.floor(1000 + Math.random() * 9000)}`;
    const newPatient = {
      id: newId,
      firstName: patientData.firstName,
      lastName: patientData.lastName,
      dob: patientData.dob,
      gender: patientData.gender,
      phone: patientData.phone,
      email: patientData.email || 'N/A',
      password: randomPassword
    };

    const updatedPatients = [newPatient, ...patients];
    setPatients(updatedPatients);
    localStorage.setItem('dhms_patients', JSON.stringify(updatedPatients));
    setGeneratedId(newId);
    setGeneratedPassword(randomPassword);
  };

  // State for Appointment Booking
  const [appointmentData, setAppointmentData] = useState({
    patientId: '',
    doctorId: '',
    date: '',
    time: '',
    reason: ''
  });
  const [appointmentSuccess, setAppointmentSuccess] = useState(false);

  const handleAppointmentSubmit = (e) => {
    e.preventDefault();
    
    // Find patient name from ID/Name search
    const matchedPatient = patients.find(p => p.id === appointmentData.patientId || `${p.firstName} ${p.lastName}`.toLowerCase().includes(appointmentData.patientId.toLowerCase()));
    const patientName = matchedPatient ? `${matchedPatient.firstName} ${matchedPatient.lastName}` : appointmentData.patientId;
    const patientId = matchedPatient ? matchedPatient.id : `PT-${Math.floor(10000 + Math.random() * 90000)}`;

    const doctorMap = {
      dr_house: { name: "Dr. Gregory House", dept: "Cardiology" },
      dr_grey: { name: "Dr. Meredith Grey", dept: "General Surgery" },
      dr_watson: { name: "Dr. John Watson", dept: "Primary Care" }
    };
    const docInfo = doctorMap[appointmentData.doctorId] || { name: appointmentData.doctorId, dept: "General Clinic" };

    const newAppt = {
      id: `APT-${Math.floor(10000 + Math.random() * 90000)}`,
      patientId: patientId,
      patientName: patientName,
      doctorId: appointmentData.doctorId,
      doctorName: docInfo.name,
      department: docInfo.dept,
      date: appointmentData.date,
      time: appointmentData.time,
      reason: appointmentData.reason,
      status: "Upcoming",
      type: "Physical",
      source: "Walk-in"
    };

    const updatedAppts = [newAppt, ...appointments];
    setAppointments(updatedAppts);
    localStorage.setItem('dhms_appointments', JSON.stringify(updatedAppts));

    setAppointmentSuccess(true);
    setTimeout(() => setAppointmentSuccess(false), 3000);
    setAppointmentData({
      patientId: '',
      doctorId: '',
      date: '',
      time: '',
      reason: ''
    });
  };

  const handleConfirmAppointment = (apptId) => {
    const updated = appointments.map(appt => {
      if (appt.id === apptId) {
        let newStatus = appt.status;
        if (appt.status === 'Pending Confirmation') {
          newStatus = 'Confirmed';
        } else if (appt.status === 'Confirmed' || appt.status === 'Upcoming') {
          newStatus = 'Checked In';
        }
        return { ...appt, status: newStatus };
      }
      return appt;
    });
    setAppointments(updated);
    localStorage.setItem('dhms_appointments', JSON.stringify(updated));
  };

  const handleGenerateReport = (patientId) => {
    // Reload all data to get latest
    const allPatients = JSON.parse(localStorage.getItem('dhms_patients') || '[]');
    const allAppts = JSON.parse(localStorage.getItem('dhms_appointments') || '[]');
    const allPrescriptions = JSON.parse(localStorage.getItem('dhms_prescriptions') || '[]');
    const allLabs = JSON.parse(localStorage.getItem('dhms_lab_requests') || '[]');
    const allBilling = JSON.parse(localStorage.getItem('dhms_billing') || '[]');

    const patient = allPatients.find(p => p.id === patientId);
    if (!patient) return;

    const patientAppts = allAppts.filter(a => a.patientId === patientId);
    const patientPrescriptions = allPrescriptions.filter(p => p.patientId === patientId);
    const patientLabs = allLabs.filter(l => l.patientId === patientId);
    const patientBilling = allBilling.filter(b => b.patientId === patientId);

    const todayStr = new Date().toISOString().split('T')[0];
    
    // Construct rich text content summarizing the patient's records
    const reportSummary = `Patient Health Summary Report for ${patient.firstName} ${patient.lastName} (ID: ${patient.id})
Generated Date: ${todayStr}
Author: Front Desk System / Receptionist

==================================================
1. CLINICAL PROFILE
==================================================
Date of Birth: ${patient.dob}
Gender: ${patient.gender}
Phone: ${patient.phone}
Email: ${patient.email}
Blood Type: ${patient.bloodType || 'N/A'}
Allergies: ${patient.allergies || 'None Recorded'}
Chronic Conditions: ${patient.chronicConditions || 'None Recorded'}

==================================================
2. APPOINTMENT HISTORY (${patientAppts.length} Records)
==================================================
${patientAppts.length === 0 ? 'No appointments recorded.' : patientAppts.map((a, idx) => `${idx + 1}. [${a.date} ${a.time}] Appt: ${a.id} | Doctor: ${a.doctorName} | Status: ${a.status} | Reason: ${a.reason}`).join('\n')}

==================================================
3. PRESCRIPTIONS (${patientPrescriptions.length} Records)
==================================================
${patientPrescriptions.length === 0 ? 'No prescriptions recorded.' : patientPrescriptions.map((pr, idx) => `${idx + 1}. [${pr.date || todayStr}] Rx ID: ${pr.id} | Meds: ${pr.medications || pr.medicationName} | Doctor: ${pr.doctorName || pr.physicianName || 'N/A'}`).join('\n')}

==================================================
4. LAB DIAGNOSTICS (${patientLabs.length} Records)
==================================================
${patientLabs.length === 0 ? 'No laboratory tests ordered.' : patientLabs.map((l, idx) => `${idx + 1}. [${l.date || todayStr}] Lab ID: ${l.id} | Test: ${l.testName} | Status: ${l.status} | Results: ${l.results || 'Pending'}`).join('\n')}

==================================================
5. FINANCIAL BILLING (${patientBilling.length} Records)
==================================================
${patientBilling.length === 0 ? 'No invoices recorded.' : patientBilling.map((b, idx) => `${idx + 1}. [${b.date}] Invoice: ${b.id} | Type: ${b.type} | Amount: ${b.amount} | Status: ${b.status}`).join('\n')}

==================================================
End of Generated Health Summary Report
==================================================`;

    const newReport = {
      id: `EHR-${Math.floor(100 + Math.random() * 900)}`,
      name: `FrontDesk Health Summary`,
      type: 'Summary Report',
      size: `${(reportSummary.length / 1024).toFixed(1)} KB`,
      date: todayStr,
      author: 'Front Desk Administrator',
      details: {
        summary: `Comprehensive summary report detailing appointment logs, active prescriptions, lab requests, and billing invoices for patient ${patient.firstName} ${patient.lastName}.`,
        fullContent: reportSummary
      }
    };

    // Update reports in patients list
    const updatedPatients = allPatients.map(p => {
      if (p.id === patientId) {
        return {
          ...p,
          reports: [newReport, ...(p.reports || [])]
        };
      }
      return p;
    });

    localStorage.setItem('dhms_patients', JSON.stringify(updatedPatients));
    setPatients(updatedPatients);
    
    // Also update selected patient file modal data
    const updatedPatient = updatedPatients.find(p => p.id === patientId);
    setSelectedPatientFile(updatedPatient);
    alert(`Health Summary Report (${newReport.id}) generated successfully!`);
  };

  const renderRegisterPatient = () => (
    <div className="rd-view-container">
      <div className="rd-header-banner">
        <div>
          <h2>Register New Patient</h2>
          <p>Enter patient details to create a profile and generate a Unique Health ID.</p>
        </div>
      </div>

      <div className="rd-card">
        {generatedId ? (
          <div className="rd-success-message">
            <div className="rd-success-icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
            </div>
            <h3>Registration Successful!</h3>
            <p>The patient has been added to the DHMS network.</p>
            <div className="rd-id-display" style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0', width: 'fit-content', margin: '16px auto' }}>
              <div>Patient ID: <strong style={{ color: '#1e293b', fontSize: '18px' }}>{generatedId}</strong></div>
              <div>Portal Password: <strong style={{ color: '#4f46e5', fontSize: '18px' }}>{generatedPassword}</strong></div>
            </div>
            <button className="rd-btn-primary mt-4" onClick={() => {
              setGeneratedId(null);
              setGeneratedPassword(null);
              setPatientData({firstName: '', lastName: '', dob: '', gender: '', phone: '', email: ''});
            }}>Register Another Patient</button>
          </div>
        ) : (
          <form className="rd-form" onSubmit={handleRegisterSubmit}>
            <div className="rd-form-row">
              <div className="rd-form-group">
                <label>First Name</label>
                <input type="text" required value={patientData.firstName} onChange={e => setPatientData({...patientData, firstName: e.target.value})} placeholder="e.g. Jane" />
              </div>
              <div className="rd-form-group">
                <label>Last Name</label>
                <input type="text" required value={patientData.lastName} onChange={e => setPatientData({...patientData, lastName: e.target.value})} placeholder="e.g. Smith" />
              </div>
            </div>

            <div className="rd-form-row">
              <div className="rd-form-group">
                <label>Date of Birth</label>
                <input type="date" required value={patientData.dob} onChange={e => setPatientData({...patientData, dob: e.target.value})} />
              </div>
              <div className="rd-form-group">
                <label>Gender</label>
                <select required value={patientData.gender} onChange={e => setPatientData({...patientData, gender: e.target.value})}>
                  <option value="" disabled hidden>Select Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            <div className="rd-form-row">
              <div className="rd-form-group">
                <label>Phone Number</label>
                <input type="tel" required value={patientData.phone} onChange={e => setPatientData({...patientData, phone: e.target.value})} placeholder="+1 (555) 000-0000" />
              </div>
              <div className="rd-form-group">
                <label>Email Address</label>
                <input type="email" value={patientData.email} onChange={e => setPatientData({...patientData, email: e.target.value})} placeholder="jane.smith@example.com" />
              </div>
            </div>

            <div className="rd-form-actions">
              <button type="submit" className="rd-btn-primary">Generate ID & Register</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );

  const renderPatientRecords = () => {
    const filteredPatients = patients.filter(p => {
      const query = patientSearch.toLowerCase();
      const fullName = `${p.firstName || ''} ${p.lastName || ''}`.toLowerCase();
      return p.id.toLowerCase().includes(query) ||
             fullName.includes(query) ||
             p.phone.includes(query) ||
             (p.email && p.email.toLowerCase().includes(query));
    });

    const totalPages = Math.ceil(filteredPatients.length / itemsPerPage) || 1;
    const startIndex = (patientPage - 1) * itemsPerPage;
    const paginatedPatients = filteredPatients.slice(startIndex, startIndex + itemsPerPage);

    return (
      <div className="rd-view-container">
        <div className="rd-header-banner">
          <div>
            <h2>Registered Patients Database</h2>
            <p>Search registered patient profiles, contact details, and unique IDs.</p>
          </div>
        </div>

        <div className="rd-card">
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
            <div style={{ position: 'relative', width: '320px' }}>
              <input 
                type="text" 
                placeholder="Search patients..." 
                value={patientSearch}
                onChange={(e) => {
                  setPatientSearch(e.target.value);
                  setPatientPage(1);
                }}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px' }}
              />
            </div>
          </div>

          <table className="rd-table">
            <thead>
              <tr>
                <th>Patient ID</th>
                <th>Full Name</th>
                <th>Date of Birth</th>
                <th>Gender</th>
                <th>Phone</th>
                <th>Email</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {paginatedPatients.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', color: '#64748b', padding: '32px 0' }}>No patient records found</td>
                </tr>
              ) : (
                paginatedPatients.map(p => (
                  <tr key={p.id}>
                    <td><strong style={{ color: '#1e293b' }}>{p.id}</strong></td>
                    <td><strong>{p.firstName} {p.lastName}</strong></td>
                    <td>{p.dob}</td>
                    <td style={{ textTransform: 'capitalize' }}>{p.gender}</td>
                    <td>{p.phone}</td>
                    <td>{p.email}</td>
                    <td>
                      <button 
                        onClick={() => {
                          setSelectedPatientFile(p);
                          // Refresh lists when opening
                          setPrescriptions(JSON.parse(localStorage.getItem('dhms_prescriptions') || '[]'));
                          setLabRequests(JSON.parse(localStorage.getItem('dhms_lab_requests') || '[]'));
                          setAppointments(JSON.parse(localStorage.getItem('dhms_appointments') || '[]'));
                          const savedBilling = localStorage.getItem('dhms_billing');
                          if (savedBilling) setBillingList(JSON.parse(savedBilling));
                        }} 
                        style={{ 
                          backgroundColor: '#eff6ff', 
                          color: '#1d4ed8', 
                          border: '1px solid #bfdbfe', 
                          borderRadius: '6px', 
                          padding: '6px 12px', 
                          cursor: 'pointer', 
                          fontSize: '12px',
                          fontWeight: '600',
                          transition: 'all 0.15s'
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.backgroundColor = '#dbeafe';
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.backgroundColor = '#eff6ff';
                        }}
                        title="View Patient File & Reports"
                      >
                        View File
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {filteredPatients.length > 0 && (
            <div className="rd-pagination">
              <span className="rd-page-info">
                Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredPatients.length)} of {filteredPatients.length} records
              </span>
              {totalPages > 1 && (
                <div className="rd-pagination-buttons">
                  <button 
                    disabled={patientPage === 1} 
                    onClick={() => setPatientPage(prev => Math.max(prev - 1, 1))}
                    className="rd-page-btn"
                  >
                    Prev
                  </button>
                  <button 
                    disabled={patientPage === totalPages} 
                    onClick={() => setPatientPage(prev => Math.min(prev + 1, totalPages))}
                    className="rd-page-btn"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderAppointments = () => {
    const filteredAppts = appointments.filter(appt => {
      if (apptSubTab === 'online') {
        return appt.source.toLowerCase() === 'online';
      } else {
        return appt.source.toLowerCase() === 'walk-in';
      }
    });

    const totalPages = Math.ceil(filteredAppts.length / apptsPerPage) || 1;
    const startIndex = (apptPage - 1) * apptsPerPage;
    const paginatedAppts = filteredAppts.slice(startIndex, startIndex + apptsPerPage);

    return (
      <div className="rd-view-container">
        <div className="rd-header-banner">
          <div>
            <h2>Manage Appointments</h2>
            <p>Schedule physical appointments and connect patients with available doctors.</p>
          </div>
        </div>

        <div className="rd-grid-layout">
          {/* Booking Form */}
          <div className="rd-card">
            <h3>Book New Appointment</h3>
            {appointmentSuccess && (
              <div className="rd-alert-success">
                Appointment successfully booked and added to the Doctor's schedule!
              </div>
            )}
            <form className="rd-form mt-4" onSubmit={handleAppointmentSubmit}>
              <div className="rd-form-group">
                <label>Patient ID / Name</label>
                <input type="text" required value={appointmentData.patientId} onChange={e => setAppointmentData({...appointmentData, patientId: e.target.value})} placeholder="e.g. PT-12345 or John Doe" />
              </div>

              <div className="rd-form-group">
                <label>Assign to Doctor</label>
                <select required value={appointmentData.doctorId} onChange={e => setAppointmentData({...appointmentData, doctorId: e.target.value})}>
                  <option value="" disabled hidden>Select Doctor</option>
                  <option value="dr_house">Dr. Gregory House (Cardiology)</option>
                  <option value="dr_grey">Dr. Meredith Grey (General Surgery)</option>
                  <option value="dr_watson">Dr. John Watson (Primary Care)</option>
                </select>
              </div>

              <div className="rd-form-row">
                <div className="rd-form-group">
                  <label>Date</label>
                  <input type="date" required value={appointmentData.date} onChange={e => setAppointmentData({...appointmentData, date: e.target.value})} />
                </div>
                <div className="rd-form-group">
                  <label>Time Slot</label>
                  <input type="time" required value={appointmentData.time} onChange={e => setAppointmentData({...appointmentData, time: e.target.value})} />
                </div>
              </div>

              <div className="rd-form-group">
                <label>Reason for Visit</label>
                <textarea rows="3" required value={appointmentData.reason} onChange={e => setAppointmentData({...appointmentData, reason: e.target.value})} placeholder="Brief description of symptoms or visit purpose..."></textarea>
              </div>

              <button type="submit" className="rd-btn-primary w-full">Confirm Appointment</button>
            </form>
          </div>

          {/* Today's Schedule */}
          <div className="rd-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px' }}>
              <h3 style={{ margin: 0 }}>Visits & Requests</h3>
              <div style={{ display: 'flex', gap: '4px' }}>
                <button 
                  onClick={() => { setApptSubTab('on-place'); setApptPage(1); }}
                  style={{
                    padding: '6px 10px',
                    border: 'none',
                    borderRadius: '6px',
                    background: apptSubTab === 'on-place' ? '#eff6ff' : 'transparent',
                    color: apptSubTab === 'on-place' ? '#2563eb' : '#64748b',
                    fontWeight: '600',
                    fontSize: '11px',
                    cursor: 'pointer'
                  }}
                >
                  On-Place
                </button>
                <button 
                  onClick={() => { setApptSubTab('online'); setApptPage(1); }}
                  style={{
                    padding: '6px 10px',
                    border: 'none',
                    borderRadius: '6px',
                    background: apptSubTab === 'online' ? '#eff6ff' : 'transparent',
                    color: apptSubTab === 'online' ? '#2563eb' : '#64748b',
                    fontWeight: '600',
                    fontSize: '11px',
                    cursor: 'pointer'
                  }}
                >
                  Online ({appointments.filter(a => a.source.toLowerCase() === 'online').length})
                </button>
              </div>
            </div>

            <div className="rd-appointment-list mt-4">
              {paginatedAppts.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#64748b', padding: '24px 0' }}>No {apptSubTab === 'online' ? 'online' : 'on-place'} appointments scheduled</div>
              ) : (
                paginatedAppts.map((appt) => (
                  <div key={appt.id} className="rd-appt-item" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div className="rd-appt-details">
                        <strong>{appt.patientName} ({appt.patientId})</strong>
                        <span style={{ fontSize: '13px', color: '#64748b' }}>with {appt.doctorName} ({appt.department})</span>
                        <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                          <span className={`rd-badge-source ${appt.source.toLowerCase()}`}>{appt.source}</span>
                          <span className={`rd-badge-type ${appt.type.toLowerCase()}`}>{appt.type}</span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                        <span className={`rd-status-badge ${appt.status.toLowerCase().replace(' ', '-')}`}>
                          {appt.status}
                        </span>
                        <div style={{ fontSize: '13px', fontWeight: '700', color: '#3b82f6' }}>{appt.time}</div>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>{appt.date}</div>
                      </div>
                    </div>
                    {appt.reason && (
                      <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#475569', background: '#f8fafc', padding: '8px', borderRadius: '6px', border: '1px solid #f1f5f9' }}>
                        <strong>Reason:</strong> {appt.reason}
                      </p>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '4px', alignItems: 'center' }}>
                      {billingList.some(b => b.appointmentId === appt.id) ? (
                        <span style={{ fontSize: '11.5px', color: '#16a34a', background: '#dcfce7', padding: '4px 8px', borderRadius: '4px', fontWeight: '600' }}>
                          Sent to Counter
                        </span>
                      ) : (
                        <button 
                          className="rd-btn-small" 
                          onClick={() => {
                            setBillingModalAppt(appt);
                            setBillingModalFee('120.00');
                            setBillingModalType('Appointment Fee');
                          }}
                          style={{
                            padding: '4px 10px',
                            background: '#f8fafc',
                            color: '#475569',
                            border: '1px solid #cbd5e1',
                            borderRadius: '4px',
                            fontSize: '12px',
                            fontWeight: '600',
                            cursor: 'pointer'
                          }}
                        >
                          Pay in Counter
                        </button>
                      )}
                      
                      {(appt.status === 'Pending Confirmation' || appt.status === 'Confirmed' || appt.status === 'Upcoming') && (
                        <button 
                          className="rd-btn-small" 
                          onClick={() => handleConfirmAppointment(appt.id)}
                          style={{
                            padding: '4px 10px',
                            background: appt.status === 'Pending Confirmation' ? '#10b981' : '#3b82f6',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            fontSize: '12px',
                            fontWeight: '600',
                            cursor: 'pointer'
                          }}
                        >
                          {appt.status === 'Pending Confirmation' ? 'Confirm Request' : 'Check In'}
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {totalPages > 1 && (
              <div className="rd-pagination" style={{ marginTop: '20px' }}>
                <span className="rd-page-info">Page {apptPage} of {totalPages}</span>
                <div className="rd-pagination-buttons">
                  <button 
                    disabled={apptPage === 1} 
                    onClick={() => setApptPage(prev => Math.max(prev - 1, 1))}
                    className="rd-page-btn"
                  >
                    Prev
                  </button>
                  <button 
                    disabled={apptPage === totalPages} 
                    onClick={() => setApptPage(prev => Math.min(prev + 1, totalPages))}
                    className="rd-page-btn"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderCheckInQueue = () => {
    const queueAppts = appointments.filter(a => a.status === 'Checked In' || a.status === 'In Consultation' || a.status === 'Completed');
    
    const totalPages = Math.ceil(queueAppts.length / itemsPerPage) || 1;
    const startIndex = (queuePage - 1) * itemsPerPage;
    const paginatedQueue = queueAppts.slice(startIndex, startIndex + itemsPerPage);

    const handleQueueStatusChange = (apptId, nextStatus) => {
      const updated = appointments.map(appt => {
        if (appt.id === apptId) {
          return { ...appt, status: nextStatus };
        }
        return appt;
      });
      setAppointments(updated);
      localStorage.setItem('dhms_appointments', JSON.stringify(updated));
    };

    return (
      <div className="rd-view-container">
        <div className="rd-header-banner">
          <div>
            <h2>Daily Patient Flow Queue</h2>
            <p>Manage the queue status of patients checked in today.</p>
          </div>
        </div>

        <div className="rd-card">
          <table className="rd-table">
            <thead>
              <tr>
                <th>Patient Details</th>
                <th>Doctor / Dept</th>
                <th>Appt Time</th>
                <th>Queue Status</th>
                <th>Flow Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedQueue.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', color: '#64748b', padding: '32px 0' }}>No patients in the active queue currently</td>
                </tr>
              ) : (
                paginatedQueue.map(item => (
                  <tr key={item.id}>
                    <td>
                      <strong>{item.patientName}</strong>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>ID: {item.patientId}</div>
                    </td>
                    <td>
                      <div>{item.doctorName}</div>
                      <span style={{ fontSize: '11px', color: '#64748b', background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>{item.department}</span>
                    </td>
                    <td><strong>{item.time}</strong></td>
                    <td>
                      <span className={`rd-status-badge ${item.status.toLowerCase().replace(' ', '-')}`}>
                        {item.status}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        {item.status === 'Checked In' && (
                          <button 
                            className="rd-btn-small" 
                            onClick={() => handleQueueStatusChange(item.id, 'In Consultation')}
                            style={{ background: '#7c3aed', color: 'white', border: 'none', borderRadius: '4px', padding: '4px 8px', fontSize: '11px', cursor: 'pointer' }}
                          >
                            Call Patient
                          </button>
                        )}
                        {item.status === 'In Consultation' && (
                          <button 
                            className="rd-btn-small" 
                            onClick={() => handleQueueStatusChange(item.id, 'Completed')}
                            style={{ background: '#10b981', color: 'white', border: 'none', borderRadius: '4px', padding: '4px 8px', fontSize: '11px', cursor: 'pointer' }}
                          >
                            Complete Visit
                          </button>
                        )}
                        {item.status === 'Completed' && (
                          <span style={{ fontSize: '12px', color: '#16a34a', fontWeight: '600' }}>Checked Out</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {totalPages > 1 && (
            <div className="rd-pagination">
              <span className="rd-page-info">Page {queuePage} of {totalPages}</span>
              <div className="rd-pagination-buttons">
                <button 
                  disabled={queuePage === 1} 
                  onClick={() => setQueuePage(prev => Math.max(prev - 1, 1))}
                  className="rd-page-btn"
                >
                  Prev
                </button>
                <button 
                  disabled={queuePage === totalPages} 
                  onClick={() => setQueuePage(prev => Math.min(prev + 1, totalPages))}
                  className="rd-page-btn"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderBilling = () => {
    const totalPages = Math.ceil(billingList.length / itemsPerPage) || 1;
    const startIndex = (billingPage - 1) * itemsPerPage;
    const paginatedBilling = billingList.slice(startIndex, startIndex + itemsPerPage);

    const handleMarkAsPaid = (invoiceId) => {
      const updated = billingList.map(inv => {
        if (inv.id === invoiceId) {
          return { ...inv, status: 'Paid' };
        }
        return inv;
      });
      setBillingList(updated);
      localStorage.setItem('dhms_billing', JSON.stringify(updated));
    };

    return (
      <div className="rd-view-container">
        <div className="rd-header-banner">
          <div>
            <h2>Billing & Patient Invoices</h2>
            <p>Track payments, generate receipts, and manage co-pays for consultations and lab tests.</p>
          </div>
        </div>

        <div className="rd-card">
          <table className="rd-table">
            <thead>
              <tr>
                <th>Invoice ID</th>
                <th>Patient Details</th>
                <th>Charge Type</th>
                <th>Date</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedBilling.map(inv => (
                <tr key={inv.id}>
                  <td><strong style={{ color: '#475569' }}>{inv.id}</strong></td>
                  <td>
                    <strong>{inv.patientName}</strong>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>ID: {inv.patientId}</div>
                  </td>
                  <td>{inv.type}</td>
                  <td>{inv.date}</td>
                  <td><strong>{inv.amount}</strong></td>
                  <td>
                    <span className={`rd-status-badge ${inv.status.toLowerCase()}`}>
                      {inv.status}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {inv.status === 'Unpaid' && (
                        <button 
                          className="rd-btn-small" 
                          onClick={() => handleMarkAsPaid(inv.id)}
                          style={{ background: '#10b981', color: 'white', border: 'none', borderRadius: '4px', padding: '4px 8px', fontSize: '12px', cursor: 'pointer' }}
                        >
                          Collect Payment
                        </button>
                      )}
                      <button 
                        className="rd-btn-outline" 
                        onClick={() => alert(`Printing invoice receipt for ${inv.id}...`)}
                        style={{ padding: '4px 8px', border: '1px solid #cbd5e1', borderRadius: '4px', background: 'white', fontSize: '12px', cursor: 'pointer' }}
                      >
                        Print Invoice
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {totalPages > 1 && (
            <div className="rd-pagination">
              <span className="rd-page-info">Page {billingPage} of {totalPages}</span>
              <div className="rd-pagination-buttons">
                <button 
                  disabled={billingPage === 1} 
                  onClick={() => setBillingPage(prev => Math.max(prev - 1, 1))}
                  className="rd-page-btn"
                >
                  Prev
                </button>
                <button 
                  disabled={billingPage === totalPages} 
                  onClick={() => setBillingPage(prev => Math.min(prev + 1, totalPages))}
                  className="rd-page-btn"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderAttendance = () => {
    const todayStr = new Date().toISOString().split('T')[0];
    const recAttRecords = (JSON.parse(localStorage.getItem('dhms_master_attendance') || '[]'))
      .filter(a => a.module === 'Receptionist');

    return (
      <div className="rd-view-container">
        <div className="rd-header-banner">
          <div>
            <h2>Receptionist Shift Attendance Log</h2>
            <p>Record daily check-in / check-out times and shift attendance status for front desk staff.</p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px' }}>
          {/* Form Card */}
          <div className="rd-card">
            <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', color: '#1e293b' }}>Mark Daily Attendance</h3>
            <form className="rd-form" onSubmit={handleMarkRecAttendance}>
              <div className="rd-form-group">
                <label>Select Reception Staff Member</label>
                <select 
                  value={recAttendanceForm.staffId} 
                  onChange={(e) => {
                    const id = e.target.value;
                    const name = id === 'REC-101' ? 'Sarah Connor' : 'Mark Taylor';
                    const role = id === 'REC-101' ? 'Senior Receptionist' : 'Front Desk Associate';
                    setRecAttendanceForm({ ...recAttendanceForm, staffId: id, staffName: name, role: role });
                  }}
                >
                  <option value="REC-101">Sarah Connor (Senior Receptionist)</option>
                  <option value="REC-102">Mark Taylor (Front Desk Associate)</option>
                </select>
              </div>

              <div className="rd-form-group">
                <label>Shift Date</label>
                <input 
                  type="date" 
                  required 
                  value={recAttendanceForm.date} 
                  onChange={(e) => setRecAttendanceForm({ ...recAttendanceForm, date: e.target.value })} 
                />
              </div>

              <div className="rd-form-group">
                <label>Attendance Status</label>
                <select 
                  value={recAttendanceForm.status} 
                  onChange={(e) => setRecAttendanceForm({ ...recAttendanceForm, status: e.target.value })}
                >
                  <option value="Present">Present</option>
                  <option value="Late">Late</option>
                  <option value="Absent">Absent</option>
                  <option value="On Leave">On Leave</option>
                </select>
              </div>

              {recAttendanceForm.status !== 'Absent' && recAttendanceForm.status !== 'On Leave' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="rd-form-group">
                    <label>Check In Time</label>
                    <input 
                      type="text" 
                      value={recAttendanceForm.checkIn} 
                      onChange={(e) => setRecAttendanceForm({ ...recAttendanceForm, checkIn: e.target.value })} 
                    />
                  </div>
                  <div className="rd-form-group">
                    <label>Check Out Time</label>
                    <input 
                      type="text" 
                      value={recAttendanceForm.checkOut} 
                      onChange={(e) => setRecAttendanceForm({ ...recAttendanceForm, checkOut: e.target.value })} 
                    />
                  </div>
                </div>
              )}

              <div className="rd-form-group">
                <label>Shift Remarks / Absence Reason</label>
                <input 
                  type="text" 
                  placeholder="e.g. Front desk morning shift / Sick leave" 
                  value={recAttendanceForm.remarks} 
                  onChange={(e) => setRecAttendanceForm({ ...recAttendanceForm, remarks: e.target.value })} 
                />
              </div>

              <button type="submit" className="rd-btn-primary mt-4">Save Attendance Record</button>
            </form>
          </div>

          {/* History Log Table */}
          <div className="rd-card">
            <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', color: '#1e293b' }}>Receptionist Attendance Log History</h3>
            <table className="rd-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Staff Member</th>
                  <th>Check In / Out</th>
                  <th>Status</th>
                  <th>Remarks</th>
                </tr>
              </thead>
              <tbody>
                {recAttRecords.length === 0 ? (
                  <tr><td colSpan="5" style={{ textAlign: 'center', padding: '24px', color: '#64748b' }}>No receptionist attendance logged yet.</td></tr>
                ) : (
                  recAttRecords.map(att => (
                    <tr key={att.id}>
                      <td><strong>{att.date}</strong></td>
                      <td>
                        <strong>{att.staffName}</strong>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>{att.role}</div>
                      </td>
                      <td>{att.checkIn} - {att.checkOut}</td>
                      <td>
                        <span className="rd-status-badge" style={{
                          backgroundColor: att.status === 'Present' ? '#dcfce7' : att.status === 'Late' ? '#fef3c7' : '#fee2e2',
                          color: att.status === 'Present' ? '#15803d' : att.status === 'Late' ? '#b45309' : '#b91c1c'
                        }}>
                          {att.status}
                        </span>
                      </td>
                      <td>{att.remarks}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderDoctors = () => {
    return (
      <div className="rd-view-container">
        <div className="rd-header-banner">
          <div>
            <h2>Physician Schedules & Room Assignments</h2>
            <p>Real-time shift tracking, room numbers, and clinical availability.</p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
          {doctorsList.map(doc => (
            <div key={doc.id} className="rd-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '16px' }}>{doc.name}</h3>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>{doc.specialty}</span>
                </div>
                <span className={`rd-status-badge ${doc.status.toLowerCase().replace(' ', '-')}`}>
                  {doc.status}
                </span>
              </div>
              <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '10px', fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div><strong>Room Assignment:</strong> {doc.room}</div>
                <div><strong>Shift Details:</strong> {doc.shift}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="rd-container">
      {/* Topbar */}
      <header className="rd-topbar">
        <div className="rd-logo-area">
          <svg className="rd-logo-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
          </svg>
          <span className="rd-logo-text">DHMS</span>
          <span className="rd-logo-divider">|</span>
          <span className="rd-logo-sub">Front Desk Operations</span>
        </div>
        <div className="rd-topbar-right">
          <div className="rd-profile-info">
            <div className="rd-avatar">{loggedInStaff?.name ? loggedInStaff.name.charAt(0) : 'R'}</div>
            <div className="rd-user-details">
              <strong>{loggedInStaff?.name || 'Sarah Jenkins'}</strong>
              <span>{loggedInStaff?.role || 'Front Desk'}</span>
            </div>
            <div className="rd-role-badge">RECEPTIONIST</div>
          </div>
          <button className="rd-signout-btn" onClick={onLogout} title="Sign Out">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
          </button>
        </div>
      </header>

      <div className="rd-body">
        {/* Sidebar */}
        <aside className="rd-sidebar">
          <ul className="rd-nav">
            <li className={activeTab === 'register_patient' ? 'active' : ''} onClick={() => setActiveTab('register_patient')}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><line x1="20" y1="8" x2="20" y2="14"></line><line x1="23" y1="11" x2="17" y2="11"></line></svg>
              Register Patient
            </li>
            <li className={activeTab === 'patient_records' ? 'active' : ''} onClick={() => { setActiveTab('patient_records'); setPatientPage(1); }}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
              Patient Records
            </li>
            <li className={activeTab === 'appointments' ? 'active' : ''} onClick={() => { setActiveTab('appointments'); setApptPage(1); }}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
              Appointments
            </li>
            <li className={activeTab === 'checkin_queue' ? 'active' : ''} onClick={() => { setActiveTab('checkin_queue'); setQueuePage(1); }}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
              Check-In Queue
            </li>
            <li className={activeTab === 'billing' ? 'active' : ''} onClick={() => { 
              setActiveTab('billing'); 
              setBillingPage(1); 
              const saved = localStorage.getItem('dhms_billing');
              if (saved) {
                setBillingList(JSON.parse(saved));
              }
            }}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2" ry="2"></rect><line x1="12" y1="4" x2="12" y2="20"></line><line x1="2" y1="12" x2="22" y2="12"></line></svg>
              Billing & Payments
            </li>
            <li className={activeTab === 'doctors' ? 'active' : ''} onClick={() => setActiveTab('doctors')}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"></path></svg>
              Doctor Availability
            </li>
            <li className={activeTab === 'attendance' ? 'active' : ''} onClick={() => setActiveTab('attendance')}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
              Shift Attendance Log
            </li>
          </ul>
        </aside>

        {/* Main Content */}
        <main className="rd-main">
          {activeTab === 'register_patient' && renderRegisterPatient()}
          {activeTab === 'patient_records' && renderPatientRecords()}
          {activeTab === 'appointments' && renderAppointments()}
          {activeTab === 'checkin_queue' && renderCheckInQueue()}
          {activeTab === 'billing' && renderBilling()}
          {activeTab === 'doctors' && renderDoctors()}
          {activeTab === 'attendance' && renderAttendance()}
        </main>
      </div>

      {/* Patient File & Reports Modal */}
      {selectedPatientFile && (
        <div className="rd-modal-overlay">
          <div className="rd-modal-content large">
            <div className="rd-modal-header">
              <div>
                <h2 style={{ margin: 0, fontSize: '20px', color: '#1e293b' }}>
                  Patient File: {selectedPatientFile.firstName} {selectedPatientFile.lastName}
                </h2>
                <span style={{ fontSize: '12px', color: '#64748b' }}>Unique ID: {selectedPatientFile.id}</span>
              </div>
              <button 
                className="rd-btn-close" 
                onClick={() => {
                  setSelectedPatientFile(null);
                  setSelectedReportView(null);
                }}
              >
                &times;
              </button>
            </div>

            <div className="rd-modal-body">
              <div className="rd-modal-grid">
                {/* Left: General Patient Details */}
                <div className="rd-modal-left">
                  <h3 className="section-title">Personal Information</h3>
                  <div className="info-card">
                    <div className="info-row"><strong>First Name:</strong> <span>{selectedPatientFile.firstName}</span></div>
                    <div className="info-row"><strong>Last Name:</strong> <span>{selectedPatientFile.lastName}</span></div>
                    <div className="info-row"><strong>Date of Birth:</strong> <span>{selectedPatientFile.dob}</span></div>
                    <div className="info-row"><strong>Gender:</strong> <span style={{ textTransform: 'capitalize' }}>{selectedPatientFile.gender}</span></div>
                    <div className="info-row"><strong>Phone:</strong> <span>{selectedPatientFile.phone}</span></div>
                    <div className="info-row"><strong>Email:</strong> <span>{selectedPatientFile.email}</span></div>
                    <div className="info-row"><strong>Blood Type:</strong> <span>{selectedPatientFile.bloodType || 'N/A'}</span></div>
                    <div className="info-row"><strong>Allergies:</strong> <span>{selectedPatientFile.allergies || 'None Recorded'}</span></div>
                    <div className="info-row"><strong>Chronic Conditions:</strong> <span>{selectedPatientFile.chronicConditions || 'None Recorded'}</span></div>
                  </div>

                  <button 
                    className="rd-btn-primary w-full mt-4" 
                    onClick={() => handleGenerateReport(selectedPatientFile.id)}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px' }}>
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                      <polyline points="14 2 14 8 20 8"></polyline>
                      <line x1="12" y1="18" x2="12" y2="12"></line>
                      <line x1="9" y1="15" x2="15" y2="15"></line>
                    </svg>
                    Generate Health Summary Report
                  </button>
                </div>

                {/* Right: Reports & Diagnostic Documents */}
                <div className="rd-modal-right">
                  <h3 className="section-title">Clinical Files & Reports</h3>
                  <div className="reports-list">
                    {(!selectedPatientFile.reports || selectedPatientFile.reports.length === 0) ? (
                      <div className="no-reports-alert">
                        No clinical reports generated yet. Click "Generate Health Summary Report" to compile history.
                      </div>
                    ) : (
                      selectedPatientFile.reports.map((report) => (
                        <div 
                          key={report.id} 
                          className="report-item" 
                          onClick={() => setSelectedReportView(report)}
                        >
                          <div className="report-item-icon">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2">
                              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                              <polyline points="14 2 14 8 20 8"></polyline>
                            </svg>
                          </div>
                          <div className="report-item-info">
                            <strong>{report.name}</strong>
                            <span>{report.type} • {report.date}</span>
                          </div>
                          <div className="report-item-size">{report.size}</div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Bottom Tabs/Sections for History */}
              <div className="rd-modal-tabs-section mt-6" style={{ marginTop: '24px' }}>
                <div className="rd-modal-tabs">
                  <button 
                    className={`rd-modal-tab-btn ${activeModalTab === 'appointments' ? 'active' : ''}`}
                    onClick={() => setActiveModalTab('appointments')}
                  >
                    Appointments ({appointments.filter(a => a.patientId === selectedPatientFile.id).length})
                  </button>
                  <button 
                    className={`rd-modal-tab-btn ${activeModalTab === 'prescriptions' ? 'active' : ''}`}
                    onClick={() => setActiveModalTab('prescriptions')}
                  >
                    Prescriptions ({prescriptions.filter(p => p.patientId === selectedPatientFile.id).length})
                  </button>
                  <button 
                    className={`rd-modal-tab-btn ${activeModalTab === 'labs' ? 'active' : ''}`}
                    onClick={() => setActiveModalTab('labs')}
                  >
                    Lab Diagnostics ({labRequests.filter(l => l.patientId === selectedPatientFile.id).length})
                  </button>
                  <button 
                    className={`rd-modal-tab-btn ${activeModalTab === 'billing' ? 'active' : ''}`}
                    onClick={() => setActiveModalTab('billing')}
                  >
                    Invoices & Billing ({billingList.filter(b => b.patientId === selectedPatientFile.id).length})
                  </button>
                </div>

                <div className="rd-modal-tab-panel mt-4" style={{ marginTop: '16px' }}>
                  {activeModalTab === 'appointments' && (
                    <table className="rd-mini-table">
                      <thead>
                        <tr>
                          <th>Appt ID</th>
                          <th>Physician</th>
                          <th>Date / Time</th>
                          <th>Reason</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {appointments.filter(a => a.patientId === selectedPatientFile.id).length === 0 ? (
                          <tr><td colSpan="5" className="empty-row">No appointment history</td></tr>
                        ) : (
                          appointments.filter(a => a.patientId === selectedPatientFile.id).map(a => (
                            <tr key={a.id}>
                              <td><strong>{a.id}</strong></td>
                              <td>{a.doctorName}</td>
                              <td>{a.date} ({a.time})</td>
                              <td>{a.reason}</td>
                              <td>
                                <span className={`rd-status-badge ${a.status.toLowerCase().replace(' ', '-')}`}>{a.status}</span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  )}

                  {activeModalTab === 'prescriptions' && (
                    <table className="rd-mini-table">
                      <thead>
                        <tr>
                          <th>Prescription ID</th>
                          <th>Medication Details</th>
                          <th>Physician</th>
                          <th>Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {prescriptions.filter(p => p.patientId === selectedPatientFile.id).length === 0 ? (
                          <tr><td colSpan="4" className="empty-row">No prescription history</td></tr>
                        ) : (
                          prescriptions.filter(p => p.patientId === selectedPatientFile.id).map(p => (
                            <tr key={p.id}>
                              <td><strong>{p.id}</strong></td>
                              <td>{p.medications || p.medicationName || 'N/A'}</td>
                              <td>{p.doctorName || p.physicianName || 'N/A'}</td>
                              <td>{p.date || 'N/A'}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  )}

                  {activeModalTab === 'labs' && (
                    <table className="rd-mini-table">
                      <thead>
                        <tr>
                          <th>Lab Request ID</th>
                          <th>Test Name</th>
                          <th>Physician</th>
                          <th>Status</th>
                          <th>Results</th>
                        </tr>
                      </thead>
                      <tbody>
                        {labRequests.filter(l => l.patientId === selectedPatientFile.id).length === 0 ? (
                          <tr><td colSpan="5" className="empty-row">No laboratory records</td></tr>
                        ) : (
                          labRequests.filter(l => l.patientId === selectedPatientFile.id).map(l => (
                            <tr key={l.id}>
                              <td><strong>{l.id}</strong></td>
                              <td>{l.testName}</td>
                              <td>{l.doctorName}</td>
                              <td>
                                <span className={`rd-status-badge ${l.status.toLowerCase().replace(' ', '-')}`}>{l.status}</span>
                              </td>
                              <td>{l.results || 'Pending'}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  )}

                  {activeModalTab === 'billing' && (
                    <table className="rd-mini-table">
                      <thead>
                        <tr>
                          <th>Invoice ID</th>
                          <th>Billing Type</th>
                          <th>Date</th>
                          <th>Amount</th>
                          <th>Status</th>
                          <th style={{ textAlign: 'right' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {billingList.filter(b => b.patientId === selectedPatientFile.id).length === 0 ? (
                          <tr><td colSpan="6" className="empty-row">No invoice history</td></tr>
                        ) : (
                          billingList.filter(b => b.patientId === selectedPatientFile.id).map(b => (
                            <tr key={b.id}>
                              <td><strong>{b.id}</strong></td>
                              <td>{b.type}</td>
                              <td>{b.date}</td>
                              <td style={{ fontWeight: 'bold' }}>{b.amount}</td>
                              <td>
                                <span className={`rd-status-badge ${b.status.toLowerCase().replace(' ', '-')}`}>{b.status}</span>
                              </td>
                              <td style={{ textAlign: 'right' }}>
                                <button 
                                  onClick={() => setSelectedInvoice(b)}
                                  className="rd-btn-small"
                                  style={{
                                    padding: '2px 8px',
                                    background: '#f1f5f9',
                                    border: '1px solid #cbd5e1',
                                    borderRadius: '4px',
                                    fontSize: '11px',
                                    fontWeight: '600',
                                    color: '#475569',
                                    cursor: 'pointer'
                                  }}
                                >
                                  View
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Report Viewer Overlay Sub-Modal */}
      {selectedReportView && (
        <div className="rd-report-view-overlay">
          <div className="rd-report-view-content">
            <div className="rd-report-view-header">
              <div>
                <h3 style={{ margin: 0 }}>{selectedReportView.name} ({selectedReportView.id})</h3>
                <span style={{ fontSize: '12px', color: '#64748b' }}>Author: {selectedReportView.author} • Date: {selectedReportView.date}</span>
              </div>
              <button className="rd-btn-close" onClick={() => setSelectedReportView(null)}>&times;</button>
            </div>
            <div className="rd-report-view-body">
              <p style={{ fontStyle: 'italic', color: '#475569', fontSize: '13px', marginBottom: '16px' }}>{selectedReportView.details?.summary}</p>
              {selectedReportView.details?.fullContent ? (
                <pre style={{ backgroundColor: '#0f172a', color: '#f8fafc', padding: '16px', borderRadius: '6px', fontSize: '13px', overflowX: 'auto', whiteSpace: 'pre-wrap', fontFamily: 'Courier New, Courier, monospace', lineHeight: '1.5' }}>
                  {selectedReportView.details.fullContent}
                </pre>
              ) : (
                <div style={{ backgroundColor: '#f1f5f9', padding: '16px', borderRadius: '6px', fontSize: '13px' }}>
                  <strong>Summary/Remarks:</strong> {selectedReportView.details?.summary || 'No detailed content available.'}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Pay at Counter / Invoice Generation Modal */}
      {billingModalAppt && (
        <div className="rd-modal-overlay">
          <div className="rd-modal-content" style={{ maxWidth: '420px' }}>
            <div className="rd-modal-header">
              <h3 style={{ margin: 0, fontSize: '18px', color: '#1e293b' }}>Collect Payment at Desk</h3>
              <button className="rd-btn-close" onClick={() => setBillingModalAppt(null)}>&times;</button>
            </div>
            <div className="rd-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="rd-form-group">
                <label style={{ fontSize: '13px', fontWeight: '600', color: '#475569' }}>Patient Name</label>
                <input type="text" readOnly value={billingModalAppt.patientName} style={{ backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', padding: '8px 12px', borderRadius: '6px' }} />
              </div>
              <div className="cc-form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '13px', fontWeight: '600', color: '#475569' }}>Patient ID</label>
                <input type="text" readOnly value={billingModalAppt.patientId} style={{ backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', padding: '8px 12px', borderRadius: '6px' }} />
              </div>
              <div className="cc-form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '13px', fontWeight: '600', color: '#475569' }}>Appointment Date</label>
                <input type="text" readOnly value={billingModalAppt.date} style={{ backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', padding: '8px 12px', borderRadius: '6px' }} />
              </div>
              <div className="cc-form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '13px', fontWeight: '600', color: '#475569' }}>Billing / Service Type</label>
                <select 
                  value={billingModalType} 
                  onChange={e => setBillingModalType(e.target.value)} 
                  style={{ border: '1px solid #cbd5e1', padding: '8px 12px', borderRadius: '6px', fontSize: '14px', outline: 'none', backgroundColor: 'white' }}
                >
                  <option value="Appointment Fee">Appointment Fee</option>
                  <option value="Consultation Fee">Consultation Fee</option>
                  <option value="Lab Diagnostics">Lab Diagnostics</option>
                  <option value="Prescription Co-pay">Prescription Co-pay</option>
                  <option value="Hospital Ward Charge">Hospital Ward Charge</option>
                </select>
              </div>
              <div className="cc-form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '13px', fontWeight: '600', color: '#475569' }}>Appointment Fee / Amount ($)</label>
                <input 
                  type="number" 
                  step="0.01" 
                  value={billingModalFee} 
                  onChange={e => setBillingModalFee(e.target.value)} 
                  placeholder="120.00" 
                  style={{ border: '1px solid #cbd5e1', padding: '8px 12px', borderRadius: '6px', fontSize: '14px', outline: 'none' }}
                />
              </div>
              
              <button 
                className="rd-btn-primary w-full"
                onClick={() => {
                  const cleanAmount = `₹${parseFloat(billingModalFee || 0).toFixed(2)}`;
                  const newInvoice = {
                    id: `INV-${Math.floor(1000 + Math.random() * 9000)}`,
                    patientId: billingModalAppt.patientId,
                    patientName: billingModalAppt.patientName,
                    date: billingModalAppt.date,
                    amount: cleanAmount,
                    status: 'Unpaid',
                    type: billingModalType,
                    appointmentId: billingModalAppt.id
                  };
                  const allBilling = JSON.parse(localStorage.getItem('dhms_billing') || '[]');
                  const updated = [newInvoice, ...allBilling];
                  localStorage.setItem('dhms_billing', JSON.stringify(updated));
                  setBillingList(updated);
                  setBillingModalAppt(null);
                  alert(`Invoice generated and sent to Central Cash Desk successfully!`);
                }}
                style={{ marginTop: '12px' }}
              >
                Send Invoice to Cash Counter
              </button>
            </div>
          </div>
        </div>
      {/* View Invoice Receipt Modal */}
      {selectedInvoice && (
        <div className="rd-modal-overlay" onClick={() => setSelectedInvoice(null)}>
          <div className="rd-modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px', display: 'flex', flexDirection: 'column' }}>
            <div className="rd-modal-header">
              <h2>Invoice Details & Receipt</h2>
              <button className="rd-btn-close" onClick={() => setSelectedInvoice(null)}>&times;</button>
            </div>
            <div className="rd-modal-body" style={{ padding: '24px', backgroundColor: 'white', color: '#1e293b', fontFamily: 'Courier New, Courier, monospace', overflowY: 'auto' }}>
              <div style={{ textAlign: 'center', borderBottom: '2px solid #1e293b', paddingBottom: '16px', marginBottom: '20px' }}>
                <h3 style={{ margin: '0 0 4px 0', fontSize: '18px', fontWeight: 'bold' }}>DHMS CENTRAL CLINICAL CENTER</h3>
                <p style={{ margin: 0, fontSize: '11px' }}>100 Hospital Road, Medical City</p>
                <p style={{ margin: 0, fontSize: '11px' }}>Email: billing@dhms.org</p>
              </div>

              <div style={{ marginBottom: '16px', fontSize: '12px' }}>
                <h4 style={{ margin: '0 0 8px 0', borderBottom: '1px solid #e2e8f0', paddingBottom: '2px', textTransform: 'uppercase', fontWeight: 'bold' }}>Invoice Info</h4>
                <div style={{ display: 'flex', justifyContent: 'space-between', margin: '2px 0' }}>
                  <span>Invoice ID:</span>
                  <strong>{selectedInvoice.id}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', margin: '2px 0' }}>
                  <span>Billing Date:</span>
                  <span>{selectedInvoice.date}</span>
                </div>
                {selectedInvoice.paymentDate && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', margin: '2px 0' }}>
                    <span>Payment Date:</span>
                    <span>{selectedInvoice.paymentDate}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', margin: '2px 0' }}>
                  <span>Status:</span>
                  <strong style={{ color: selectedInvoice.status === 'Paid' ? '#15803d' : '#b91c1c' }}>
                    {selectedInvoice.status.toUpperCase()}
                  </strong>
                </div>
              </div>

              <div style={{ marginBottom: '16px', fontSize: '12px' }}>
                <h4 style={{ margin: '0 0 8px 0', borderBottom: '1px solid #e2e8f0', paddingBottom: '2px', textTransform: 'uppercase', fontWeight: 'bold' }}>Patient Info</h4>
                <div style={{ display: 'flex', justifyContent: 'space-between', margin: '2px 0' }}>
                  <span>Patient ID:</span>
                  <span>{selectedInvoice.patientId}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', margin: '2px 0' }}>
                  <span>Name:</span>
                  <strong>{selectedInvoice.patientName}</strong>
                </div>
              </div>

              <div style={{ marginBottom: '20px', fontSize: '12px' }}>
                <h4 style={{ margin: '0 0 8px 0', borderBottom: '1px solid #e2e8f0', paddingBottom: '2px', textTransform: 'uppercase', fontWeight: 'bold' }}>Billing Details</h4>
                <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '6px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #1e293b' }}>
                      <th style={{ textAlign: 'left', padding: '4px 0' }}>Description</th>
                      <th style={{ textAlign: 'right', padding: '4px 0' }}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={{ padding: '8px 0' }}>{selectedInvoice.type}</td>
                      <td style={{ textAlign: 'right', padding: '8px 0', fontWeight: 'bold' }}>{selectedInvoice.amount}</td>
                    </tr>
                    <tr style={{ borderTop: '2px solid #1e293b', fontWeight: 'bold' }}>
                      <td style={{ padding: '8px 0', fontSize: '14px' }}>GRAND TOTAL:</td>
                      <td style={{ textAlign: 'right', padding: '8px 0', fontSize: '14px' }}>{selectedInvoice.amount}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {selectedInvoice.paymentMethod && (
                <div style={{ fontSize: '11px', borderTop: '1px solid #cbd5e1', paddingTop: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', margin: '2px 0' }}>
                    <span>Payment Method:</span>
                    <strong>{selectedInvoice.paymentMethod}</strong>
                  </div>
                  {selectedInvoice.paymentRemarks && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', margin: '2px 0' }}>
                      <span>Reference Notes:</span>
                      <span>{selectedInvoice.paymentRemarks}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="rd-modal-footer" style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', padding: '16px 24px', borderTop: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }}>
              <button className="rd-btn-close" style={{ border: '1px solid #cbd5e1', background: 'white', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', color: '#64748b' }} onClick={() => setSelectedInvoice(null)}>Close</button>
              <button className="rd-btn-primary" style={{ background: '#3b82f6', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer' }} onClick={() => window.print()}>Print Invoice</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
