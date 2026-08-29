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

  // Inpatient (IPD) Admissions State
  const [admissions, setAdmissions] = useState(() => {
    return JSON.parse(localStorage.getItem('dhms_admissions') || '[]');
  });
  const [selectedAdmForProcessing, setSelectedAdmForProcessing] = useState(null);
  const [ipdForm, setIpdForm] = useState({
    ward: 'General Ward A',
    bedNo: 'Bed A-01',
    attendantName: '',
    attendantRelation: 'Family Member',
    attendantPhone: '',
    advanceDeposit: '5000.00',
    depositPaymentMode: 'Physical Cash Payment'
  });
  const [printedAdmissionPass, setPrintedAdmissionPass] = useState(null);
  const [ipdSubTab, setIpdSubTab] = useState('pending'); // 'pending' | 'admitted' | 'discharged'

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
      setAdmissions(JSON.parse(localStorage.getItem('dhms_admissions') || '[]'));
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

    // Indian contact / phone number validation (starts with 6-9, 10 digits total, optional prefix +91/91/0)
    const cleanPhone = (patientData.phone || '').replace(/[\s\-\(\)]/g, '');
    const indianPhoneRegex = /^(?:\+91|91|0)?[6-9]\d{9}$/;
    if (!indianPhoneRegex.test(cleanPhone)) {
      alert("Invalid Contact Number: Please enter a valid 10-digit mobile number starting with 6, 7, 8, or 9 (e.g. 9876543210 or +91 98765 43210).");
      return;
    }

    // Check if phone number is already registered
    const digitsOnly = cleanPhone.replace(/^\+?91|^0/, '');
    const existingPatient = patients.find(p => {
      const pDigits = (p.phone || '').replace(/[\s\-\(\)\+]/g, '').replace(/^91|^0/, '');
      return pDigits && pDigits === digitsOnly;
    });

    if (existingPatient) {
      const proceed = window.confirm(`A patient (${existingPatient.firstName} ${existingPatient.lastName || ''} - ID: ${existingPatient.id}) is already registered with this phone number.\n\nDo you want to proceed with registering this profile?`);
      if (!proceed) return;
    }

    const newId = `PT-${Math.floor(10000 + Math.random() * 90000)}`;
    const randomPassword = `pass_${Math.floor(1000 + Math.random() * 9000)}`;
    const newPatient = {
      id: newId,
      firstName: patientData.firstName.trim(),
      lastName: (patientData.lastName || '').trim(),
      dob: patientData.dob,
      gender: patientData.gender,
      phone: patientData.phone.trim(),
      email: patientData.email ? patientData.email.trim() : 'N/A',
      password: randomPassword
    };

    const updatedPatients = [newPatient, ...patients];
    setPatients(updatedPatients);
    localStorage.setItem('dhms_patients', JSON.stringify(updatedPatients));
    setGeneratedId(newId);
    setGeneratedPassword(randomPassword);
  };

  // State for Appointment Booking & Upfront Consultation Billing
  const [appointmentData, setAppointmentData] = useState({
    patientId: '',
    doctorId: '',
    date: '',
    time: '',
    reason: ''
  });
  const [collectFeeNow, setCollectFeeNow] = useState(true);
  const [feePaymentMode, setFeePaymentMode] = useState('Physical Cash Payment');
  const [feeRemarks, setFeeRemarks] = useState('');
  const [printedBookingReceipt, setPrintedBookingReceipt] = useState(null);
  const [appointmentSuccess, setAppointmentSuccess] = useState(false);
  const [patientSearchFocus, setPatientSearchFocus] = useState(false);
  const [selectedBookPatient, setSelectedBookPatient] = useState(null);

  const handleSelectPatientForBooking = (patient) => {
    setSelectedBookPatient(patient);
    setAppointmentData({
      ...appointmentData,
      patientId: `${patient.id} - ${patient.firstName} ${patient.lastName || ''}`.trim()
    });
    setPatientSearchFocus(false);
  };

  const handleAppointmentSubmit = (e) => {
    e.preventDefault();
    
    // Find patient from ID, Name, Phone or explicit Selection
    const query = (appointmentData.patientId || '').toLowerCase().trim();
    let matchedPatient = selectedBookPatient;
    if (!matchedPatient) {
      matchedPatient = patients.find(p => {
        const fullName = `${p.firstName || ''} ${p.lastName || ''}`.toLowerCase();
        const pPhone = (p.phone || '').replace(/[\s\-\+]/g, '');
        const cleanQuery = query.replace(/[\s\-\+]/g, '');
        return p.id.toLowerCase() === query || 
               query.includes(p.id.toLowerCase()) || 
               fullName === query || 
               fullName.includes(query) ||
               (cleanQuery && pPhone.includes(cleanQuery));
      });
    }

    const patientName = matchedPatient ? `${matchedPatient.firstName} ${matchedPatient.lastName || ''}`.trim() : appointmentData.patientId;
    const patientId = matchedPatient ? matchedPatient.id : `PT-${Math.floor(10000 + Math.random() * 90000)}`;

    const matchedDoc = doctorsList.find(d => d.id === appointmentData.doctorId);
    const docInfo = matchedDoc 
      ? { name: matchedDoc.name, dept: matchedDoc.department || matchedDoc.specialty } 
      : { name: appointmentData.doctorId, dept: "General Clinic" };

    const docFee = matchedDoc?.consultationFee || (docInfo.dept === 'Cardiology' || docInfo.dept === 'Neurology' ? '500.00' : '300.00');
    const formattedFee = `₹${parseFloat(docFee).toFixed(2)}`;

    const apptId = `APT-${Math.floor(10000 + Math.random() * 90000)}`;
    const invoiceId = `INV-${Math.floor(1000 + Math.random() * 9000)}`;

    const newAppt = {
      id: apptId,
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
      source: "Walk-in",
      consultationFee: formattedFee,
      feeStatus: collectFeeNow ? "Paid" : "Unpaid",
      paymentMethod: collectFeeNow ? feePaymentMode : "Pay at Counter"
    };

    const updatedAppts = [newAppt, ...appointments];
    setAppointments(updatedAppts);
    localStorage.setItem('dhms_appointments', JSON.stringify(updatedAppts));

    // If collected upfront, generate paid invoice in central billing
    if (collectFeeNow) {
      const currentBilling = JSON.parse(localStorage.getItem('dhms_billing') || '[]');
      const newInvoice = {
        id: invoiceId,
        patientId: patientId,
        patientName: patientName,
        date: appointmentData.date || new Date().toISOString().split('T')[0],
        paymentDate: new Date().toISOString().split('T')[0],
        amount: formattedFee,
        status: 'Paid',
        type: `Doctor Consultation Fee (${docInfo.name})`,
        paymentMethod: feePaymentMode,
        paymentRemarks: feeRemarks || 'Collected Upfront at Reception'
      };
      const updatedBilling = [newInvoice, ...currentBilling];
      setBillingList(updatedBilling);
      localStorage.setItem('dhms_billing', JSON.stringify(updatedBilling));
    }

    if (window.dispatchEvent) {
      window.dispatchEvent(new Event('storage'));
    }

    // Prepare printable receipt/token slip
    setPrintedBookingReceipt({
      ...newAppt,
      invoiceId: collectFeeNow ? invoiceId : null,
      collectedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });

    setAppointmentSuccess(true);
    setTimeout(() => setAppointmentSuccess(false), 3000);
    setSelectedBookPatient(null);
    setAppointmentData({
      patientId: '',
      doctorId: '',
      date: '',
      time: '',
      reason: ''
    });
    setFeeRemarks('');
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
                <label>First Name <span style={{ color: 'red' }}>*</span></label>
                <input type="text" required value={patientData.firstName} onChange={e => setPatientData({...patientData, firstName: e.target.value})} placeholder="e.g. Jane" />
              </div>
              <div className="rd-form-group">
                <label>Last Name</label>
                <input type="text" value={patientData.lastName} onChange={e => setPatientData({...patientData, lastName: e.target.value})} placeholder="e.g. Smith" />
              </div>
            </div>

            <div className="rd-form-row">
              <div className="rd-form-group">
                <label>Date of Birth <span style={{ color: 'red' }}>*</span></label>
                <input type="date" required value={patientData.dob} onChange={e => setPatientData({...patientData, dob: e.target.value})} />
              </div>
              <div className="rd-form-group">
                <label>Gender <span style={{ color: 'red' }}>*</span></label>
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
                <label>Phone Number <span style={{ color: 'red' }}>*</span></label>
                <input 
                  type="tel" 
                  required 
                  maxLength={16}
                  value={patientData.phone} 
                  onChange={e => {
                    const val = e.target.value.replace(/[^0-9\+\s\-]/g, '');
                    setPatientData({...patientData, phone: val});
                  }} 
                  placeholder="e.g. 9876543210 or +91 98765 43210" 
                  style={{
                    borderColor: patientData.phone 
                      ? (/^(?:\+91|91|0)?[6-9]\d{9}$/.test(patientData.phone.replace(/[\s\-\(\)]/g, '')) ? '#10b981' : '#ef4444')
                      : undefined
                  }}
                />
                {patientData.phone && (
                  <div style={{ fontSize: '12px', marginTop: '4px' }}>
                    {/^(?:\+91|91|0)?[6-9]\d{9}$/.test(patientData.phone.replace(/[\s\-\(\)]/g, '')) ? (
                      <span style={{ color: '#10b981', fontWeight: '500' }}>✓ Valid 10-digit contact number</span>
                    ) : (
                      <span style={{ color: '#ef4444', fontWeight: '500' }}>⚠️ Must be a valid 10-digit mobile number (starts with 6-9)</span>
                    )}
                  </div>
                )}
              </div>
              <div className="rd-form-group">
                <label>Email Address <span style={{ color: 'red' }}>*</span></label>
                <input type="email" required value={patientData.email} onChange={e => setPatientData({...patientData, email: e.target.value})} placeholder="jane.smith@example.com" />
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
              <div className="rd-form-group" style={{ position: 'relative' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label>Patient ID / Name <span style={{ color: 'red' }}>*</span></label>
                  {selectedBookPatient && (
                    <button 
                      type="button" 
                      onClick={() => {
                        setSelectedBookPatient(null);
                        setAppointmentData({ ...appointmentData, patientId: '' });
                      }}
                      style={{ background: 'none', border: 'none', color: '#6366f1', fontSize: '12px', cursor: 'pointer', fontWeight: '600' }}
                    >
                      ✕ Clear / Change Patient
                    </button>
                  )}
                </div>

                <div style={{ position: 'relative' }}>
                  <input 
                    type="text" 
                    required 
                    value={appointmentData.patientId} 
                    onFocus={() => setPatientSearchFocus(true)}
                    onChange={e => {
                      setAppointmentData({...appointmentData, patientId: e.target.value});
                      setSelectedBookPatient(null);
                      setPatientSearchFocus(true);
                    }} 
                    placeholder="Search by Patient ID (e.g., PT-101), Name, or Phone..." 
                    style={{
                      paddingRight: '36px',
                      borderColor: selectedBookPatient ? '#10b981' : undefined,
                      background: selectedBookPatient ? '#f0fdf4' : 'white'
                    }}
                  />
                  <div style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }}>
                    🔍
                  </div>
                </div>

                {/* Selected Patient Confirmation Box */}
                {selectedBookPatient && (
                  <div style={{
                    marginTop: '6px',
                    padding: '8px 12px',
                    background: '#f0fdf4',
                    border: '1px solid #bbf7d0',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '13px',
                    color: '#166534'
                  }}>
                    <div>
                      <strong>✓ {selectedBookPatient.firstName} {selectedBookPatient.lastName}</strong>
                      <span style={{ marginLeft: '8px', padding: '2px 6px', background: '#dcfce7', borderRadius: '4px', fontWeight: '700', fontSize: '11px' }}>{selectedBookPatient.id}</span>
                      {selectedBookPatient.phone && <span style={{ marginLeft: '8px', color: '#15803d' }}>📞 {selectedBookPatient.phone}</span>}
                    </div>
                  </div>
                )}

                {/* Instant Suggestions Dropdown List */}
                {patientSearchFocus && !selectedBookPatient && (
                  <div 
                    style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      background: 'white',
                      border: '1px solid #cbd5e1',
                      borderRadius: '8px',
                      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.15)',
                      zIndex: 100,
                      maxHeight: '220px',
                      overflowY: 'auto',
                      marginTop: '4px'
                    }}
                  >
                    {(() => {
                      const query = (appointmentData.patientId || '').toLowerCase().trim();
                      const filtered = patients.filter(p => {
                        const fullName = `${p.firstName || ''} ${p.lastName || ''}`.toLowerCase();
                        const pPhone = (p.phone || '').replace(/[\s\-\+]/g, '');
                        const cleanQuery = query.replace(/[\s\-\+]/g, '');
                        return !query || 
                               p.id.toLowerCase().includes(query) || 
                               fullName.includes(query) ||
                               (cleanQuery && pPhone.includes(cleanQuery));
                      }).slice(0, 10);

                      if (filtered.length === 0) {
                        return (
                          <div style={{ padding: '12px', color: '#64748b', fontSize: '13px', textAlign: 'center' }}>
                            No registered patients found matching "{appointmentData.patientId}".
                          </div>
                        );
                      }

                      return (
                        <>
                          <div style={{ padding: '6px 12px', fontSize: '11px', fontWeight: '700', color: '#64748b', background: '#f8fafc', borderBottom: '1px solid #f1f5f9', textTransform: 'uppercase' }}>
                            {query ? "Matching Patients" : "Registered Patients (Click to Select)"}
                          </div>
                          {filtered.map(p => (
                            <div 
                              key={p.id}
                              onMouseDown={(e) => {
                                e.preventDefault(); // Prevent input onBlur before click registers
                                handleSelectPatientForBooking(p);
                              }}
                              style={{
                                padding: '10px 12px',
                                borderBottom: '1px solid #f1f5f9',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                transition: 'background-color 0.15s'
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div style={{
                                  width: '32px',
                                  height: '32px',
                                  borderRadius: '50%',
                                  background: '#6366f1',
                                  color: 'white',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: '13px',
                                  fontWeight: 'bold'
                                }}>
                                  {(p.firstName?.[0] || 'P').toUpperCase()}
                                </div>
                                <div>
                                  <div style={{ fontWeight: '600', fontSize: '14px', color: '#1e293b' }}>
                                    {p.firstName} {p.lastName}
                                  </div>
                                  <div style={{ fontSize: '12px', color: '#64748b' }}>
                                    {p.phone ? `📞 ${p.phone}` : (p.email || 'No contact')}
                                  </div>
                                </div>
                              </div>
                              <span style={{
                                background: '#e0e7ff',
                                color: '#4338ca',
                                padding: '2px 8px',
                                borderRadius: '4px',
                                fontSize: '12px',
                                fontWeight: '700'
                              }}>
                                {p.id}
                              </span>
                            </div>
                          ))}
                        </>
                      );
                    })()}
                  </div>
                )}
              </div>

              <div className="rd-form-group">
                <label>Assign to Doctor</label>
                <select required value={appointmentData.doctorId} onChange={e => setAppointmentData({...appointmentData, doctorId: e.target.value})}>
                  <option value="" disabled hidden>Select Doctor</option>
                  {doctorsList.map(doc => (
                    <option key={doc.id} value={doc.id}>
                      {doc.name} ({doc.specialty || doc.department || 'Primary Care'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="rd-form-row">
                <div className="rd-form-group">
                  <label>Date</label>
                  <input type="date" required value={appointmentData.date} onChange={e => setAppointmentData({...appointmentData, date: e.target.value})} />
                </div>
                <div className="rd-form-group">
                  <label>Time Slot</label>
                  <select 
                    required 
                    value={appointmentData.time} 
                    onChange={e => setAppointmentData({...appointmentData, time: e.target.value})}
                    style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', background: 'white', width: '100%', boxSizing: 'border-box' }}
                  >
                    <option value="" disabled>Select a Slot</option>
                    {(() => {
                      const getSlotAvailability = (docId, date) => {
                        if (!docId || !date) return { slot1: { capacity: 5, booked: 0, available: 5, isFull: false }, slot2: { capacity: 5, booked: 0, available: 5, isFull: false } };
                        const slotConfigs = JSON.parse(localStorage.getItem('dhms_doctor_slots') || '[]');
                        const config = slotConfigs.find(c => c.doctorId === docId && c.date === date) || {
                          slot1Capacity: 5,
                          slot2Capacity: 5
                        };
                        const allAppts = JSON.parse(localStorage.getItem('dhms_appointments') || '[]');
                        const slot1Bookings = allAppts.filter(a => a.doctorId === docId && a.date === date && a.time === 'Slot 1' && a.status !== 'Cancelled').length;
                        const slot2Bookings = allAppts.filter(a => a.doctorId === docId && a.date === date && a.time === 'Slot 2' && a.status !== 'Cancelled').length;
                        return {
                          slot1: {
                            capacity: config.slot1Capacity,
                            booked: slot1Bookings,
                            available: Math.max(0, config.slot1Capacity - slot1Bookings),
                            isFull: slot1Bookings >= config.slot1Capacity
                          },
                          slot2: {
                            capacity: config.slot2Capacity,
                            booked: slot2Bookings,
                            available: Math.max(0, config.slot2Capacity - slot2Bookings),
                            isFull: slot2Bookings >= config.slot2Capacity
                          }
                        };
                      };
                      const avail = getSlotAvailability(appointmentData.doctorId, appointmentData.date);
                      return (
                        <>
                          <option value="Slot 1" disabled={avail.slot1.isFull}>
                            Slot 1 (Morning) - {avail.slot1.isFull ? "FULL" : `${avail.slot1.available} / ${avail.slot1.capacity} slots left`}
                          </option>
                          <option value="Slot 2" disabled={avail.slot2.isFull}>
                            Slot 2 (Afternoon) - {avail.slot2.isFull ? "FULL" : `${avail.slot2.available} / ${avail.slot2.capacity} slots left`}
                          </option>
                        </>
                      );
                    })()}
                  </select>
                </div>
              </div>

              <div className="rd-form-group">
                <label>Reason for Visit</label>
                <textarea rows="3" required value={appointmentData.reason} onChange={e => setAppointmentData({...appointmentData, reason: e.target.value})} placeholder="Brief description of symptoms or visit purpose..."></textarea>
              </div>

              {/* Doctor Consultation Fee Card */}
              {(() => {
                const selectedDoc = doctorsList.find(d => d.id === appointmentData.doctorId);
                if (!selectedDoc) return null;
                const feeVal = selectedDoc.consultationFee || (selectedDoc.specialty === 'Cardiology' || selectedDoc.specialty === 'Neurology' ? '500.00' : '300.00');

                return (
                  <div style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '14px', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <div>
                        <span style={{ fontSize: '11.5px', color: '#64748b', textTransform: 'uppercase', fontWeight: '700' }}>Doctor Consultation Fee</span>
                        <div style={{ fontSize: '18px', fontWeight: '800', color: '#166534' }}>₹{parseFloat(feeVal).toFixed(2)}</div>
                      </div>
                      <span style={{ fontSize: '12px', background: collectFeeNow ? '#dcfce7' : '#fee2e2', color: collectFeeNow ? '#15803d' : '#b91c1c', padding: '4px 10px', borderRadius: '6px', fontWeight: '700' }}>
                        {collectFeeNow ? '✓ Pay Upfront at Reception' : 'Pay Later at Counter'}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                      <input 
                        type="checkbox" 
                        id="collect-fee-now" 
                        checked={collectFeeNow} 
                        onChange={(e) => setCollectFeeNow(e.target.checked)} 
                        style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                      />
                      <label htmlFor="collect-fee-now" style={{ fontSize: '13px', fontWeight: '600', color: '#1e293b', cursor: 'pointer' }}>
                        Collect Doctor Consultation Fee Now (No Re-queuing Needed)
                      </label>
                    </div>

                    {collectFeeNow && (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '8px', animation: 'fadeIn 0.2s' }}>
                        <div>
                          <label style={{ fontSize: '11px', color: '#64748b', display: 'block', marginBottom: '2px' }}>Payment Mode</label>
                          <select 
                            value={feePaymentMode} 
                            onChange={(e) => setFeePaymentMode(e.target.value)}
                            style={{ padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', width: '100%', fontSize: '13px', background: 'white' }}
                          >
                            <option value="Physical Cash Payment">Physical Cash Payment</option>
                            <option value="UPI / QR Code Transfer">UPI / QR Code Transfer</option>
                            <option value="Online Card Payment">Online Card Payment</option>
                            <option value="Insurance Cover / Claim">Insurance Cover / Claim</option>
                          </select>
                        </div>
                        <div>
                          <label style={{ fontSize: '11px', color: '#64748b', display: 'block', marginBottom: '2px' }}>Reference / Notes</label>
                          <input 
                            type="text" 
                            placeholder="e.g. Cash received / UPI Ref" 
                            value={feeRemarks} 
                            onChange={(e) => setFeeRemarks(e.target.value)} 
                            style={{ padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', width: '100%', fontSize: '13px', boxSizing: 'border-box' }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}

              <button type="submit" className="rd-btn-primary w-full">Confirm Appointment & Generate Token</button>
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

  const handleProcessAdmissionSubmit = (e) => {
    e.preventDefault();
    if (!selectedAdmForProcessing) return;

    const indianPhoneRegex = /^(?:\+91|91|0)?[6-9]\d{9}$/;
    if (ipdForm.attendantPhone && !indianPhoneRegex.test(ipdForm.attendantPhone.trim().replace(/[\s\-]/g, ''))) {
      alert("Please enter a valid 10-digit mobile number for the attendant.");
      return;
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const advanceInvoiceId = `INV-ADV-${Math.floor(1000 + Math.random() * 9000)}`;
    const advanceAmountNum = parseFloat(ipdForm.advanceDeposit) || 0;

    const updatedAdmission = {
      ...selectedAdmForProcessing,
      status: 'Admitted',
      ward: ipdForm.ward,
      bedNo: ipdForm.bedNo,
      attendant: {
        name: ipdForm.attendantName || 'Family Member',
        relation: ipdForm.attendantRelation,
        phone: ipdForm.attendantPhone || 'N/A'
      },
      advanceDeposit: advanceAmountNum,
      advanceDepositPaid: advanceAmountNum > 0,
      advanceInvoiceId: advanceAmountNum > 0 ? advanceInvoiceId : null,
      admissionDate: selectedAdmForProcessing.admissionDate || todayStr,
      processedBy: loggedInStaff?.name || 'Reception Staff'
    };

    // Update dhms_admissions
    const allAdms = JSON.parse(localStorage.getItem('dhms_admissions') || '[]');
    const admIndex = allAdms.findIndex(a => a.id === selectedAdmForProcessing.id);
    let newAdmsList;
    if (admIndex >= 0) {
      newAdmsList = [...allAdms];
      newAdmsList[admIndex] = updatedAdmission;
    } else {
      newAdmsList = [updatedAdmission, ...allAdms];
    }
    localStorage.setItem('dhms_admissions', JSON.stringify(newAdmsList));
    setAdmissions(newAdmsList);

    // If advance deposit collected, create paid invoice in central billing
    if (advanceAmountNum > 0) {
      const currentBilling = JSON.parse(localStorage.getItem('dhms_billing') || '[]');
      const advanceInvoice = {
        id: advanceInvoiceId,
        patientId: updatedAdmission.patientId,
        patientName: updatedAdmission.patientName,
        date: todayStr,
        paymentDate: todayStr,
        amount: `₹${advanceAmountNum.toFixed(2)}`,
        status: 'Paid',
        type: `Inpatient Admission Advance Deposit (${ipdForm.ward} - ${ipdForm.bedNo})`,
        paymentMethod: ipdForm.depositPaymentMode,
        paymentRemarks: `Advance security deposit for Admission ${updatedAdmission.id}`
      };
      const updatedBilling = [advanceInvoice, ...currentBilling];
      localStorage.setItem('dhms_billing', JSON.stringify(updatedBilling));
      setBillingList(updatedBilling);
    }

    if (window.dispatchEvent) {
      window.dispatchEvent(new Event('storage'));
    }

    // Prepare printable Admission Pass
    setPrintedAdmissionPass({
      ...updatedAdmission,
      admittedAtTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      advanceDepositAmount: `₹${advanceAmountNum.toFixed(2)}`,
      paymentMode: ipdForm.depositPaymentMode
    });

    setSelectedAdmForProcessing(null);
  };

  const renderInpatientAdmissions = () => {
    const pendingAdmissions = admissions.filter(a => a.status === 'Pending IPD Desk Admission' || a.status === 'Pending Reception Admission' || a.status === 'Advised');
    const activeInpatients = admissions.filter(a => a.status === 'Admitted' || a.status === 'Fit for Discharge / Settle Billing');
    const dischargedInpatients = admissions.filter(a => a.status === 'Discharged');

    const displayedList = ipdSubTab === 'pending' 
      ? pendingAdmissions 
      : ipdSubTab === 'admitted' 
      ? activeInpatients 
      : dischargedInpatients;

    return (
      <div className="rd-view-container">
        <div className="rd-header-banner">
          <div>
            <h2>Inpatient (IPD) Admission & Bed Desk</h2>
            <p>Process doctor clinical admission recommendations, allocate ward beds, collect advance deposits, and manage inpatient admissions.</p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <span style={{ background: '#eff6ff', color: '#1d4ed8', padding: '6px 14px', borderRadius: '8px', fontSize: '13px', fontWeight: '700' }}>
              Pending: {pendingAdmissions.length}
            </span>
            <span style={{ background: '#dcfce7', color: '#15803d', padding: '6px 14px', borderRadius: '8px', fontSize: '13px', fontWeight: '700' }}>
              Active Admitted: {activeInpatients.length}
            </span>
          </div>
        </div>

        <div className="rd-card">
          {/* Sub-tab switcher */}
          <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px', marginBottom: '16px' }}>
            <button
              onClick={() => setIpdSubTab('pending')}
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                border: 'none',
                background: ipdSubTab === 'pending' ? '#3b82f6' : '#f1f5f9',
                color: ipdSubTab === 'pending' ? 'white' : '#475569',
                fontWeight: '700',
                fontSize: '13px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              📥 Pending Admission Orders ({pendingAdmissions.length})
            </button>
            <button
              onClick={() => setIpdSubTab('admitted')}
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                border: 'none',
                background: ipdSubTab === 'admitted' ? '#10b981' : '#f1f5f9',
                color: ipdSubTab === 'admitted' ? 'white' : '#475569',
                fontWeight: '700',
                fontSize: '13px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              🛏️ Active Inpatient Registry ({activeInpatients.length})
            </button>
            <button
              onClick={() => setIpdSubTab('discharged')}
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                border: 'none',
                background: ipdSubTab === 'discharged' ? '#64748b' : '#f1f5f9',
                color: ipdSubTab === 'discharged' ? 'white' : '#475569',
                fontWeight: '700',
                fontSize: '13px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              🏁 Discharged History ({dischargedInpatients.length})
            </button>
          </div>

          <div className="rd-table-responsive">
            <table className="rd-table">
              <thead>
                <tr>
                  <th>Admission ID</th>
                  <th>Patient Details</th>
                  <th>Admitting Doctor</th>
                  <th>Ward & Bed Allocation</th>
                  <th>Clinical Notes / Reason</th>
                  <th>Advance Deposit</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {displayedList.length === 0 ? (
                  <tr>
                    <td colSpan="8" style={{ textAlign: 'center', color: '#64748b', padding: '32px 0', fontStyle: 'italic' }}>
                      {ipdSubTab === 'pending' 
                        ? 'No pending doctor admission orders to process.' 
                        : ipdSubTab === 'admitted' 
                        ? 'No patients currently admitted in the hospital wards.' 
                        : 'No discharged inpatient history.'}
                    </td>
                  </tr>
                ) : (
                  displayedList.map(adm => (
                    <tr key={adm.id}>
                      <td><strong style={{ color: '#4338ca' }}>{adm.id}</strong></td>
                      <td>
                        <strong>{adm.patientName}</strong>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>ID: {adm.patientId}</div>
                      </td>
                      <td>
                        <strong>{adm.doctorName}</strong>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>{adm.admissionDate || 'Today'}</div>
                      </td>
                      <td>
                        <span style={{ background: '#f1f5f9', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: '600', color: '#1e293b' }}>
                          {adm.ward || 'General Ward A'}
                        </span>
                        {adm.bedNo && (
                          <div style={{ fontSize: '11px', color: '#15803d', fontWeight: 'bold', marginTop: '2px' }}>
                            ✓ {adm.bedNo}
                          </div>
                        )}
                      </td>
                      <td style={{ maxWidth: '200px' }}>
                        <div style={{ fontSize: '12px', color: '#334155', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {adm.notes || 'Hospital care and inpatient monitoring.'}
                        </div>
                      </td>
                      <td>
                        {adm.advanceDeposit ? (
                          <strong style={{ color: '#166534', fontSize: '13px' }}>₹{parseFloat(adm.advanceDeposit).toFixed(2)}</strong>
                        ) : (
                          <span style={{ color: '#94a3b8', fontSize: '12px' }}>-</span>
                        )}
                      </td>
                      <td>
                        <span style={{
                          display: 'inline-block',
                          padding: '3px 8px',
                          borderRadius: '12px',
                          fontSize: '11px',
                          fontWeight: '700',
                          backgroundColor: adm.status === 'Admitted' ? '#dcfce7' : adm.status?.includes('Discharge') ? '#e0e7ff' : '#fef3c7',
                          color: adm.status === 'Admitted' ? '#15803d' : adm.status?.includes('Discharge') ? '#4338ca' : '#b45309'
                        }}>
                          {adm.status}
                        </span>
                      </td>
                      <td>
                        {adm.status === 'Pending IPD Desk Admission' || adm.status === 'Pending Reception Admission' || adm.status === 'Advised' ? (
                          <button
                            onClick={() => {
                              setSelectedAdmForProcessing(adm);
                              setIpdForm({
                                ward: adm.ward || 'General Ward A',
                                bedNo: 'Bed A-01',
                                attendantName: '',
                                attendantRelation: 'Family Member',
                                attendantPhone: '',
                                advanceDeposit: '5000.00',
                                depositPaymentMode: 'Physical Cash Payment'
                              });
                            }}
                            style={{
                              padding: '6px 12px',
                              background: '#3b82f6',
                              color: 'white',
                              border: 'none',
                              borderRadius: '6px',
                              fontSize: '12px',
                              fontWeight: '700',
                              cursor: 'pointer'
                            }}
                          >
                            🛏️ Admit Patient
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              setPrintedAdmissionPass({
                                ...adm,
                                admittedAtTime: '09:30 AM',
                                advanceDepositAmount: `₹${parseFloat(adm.advanceDeposit || 5000).toFixed(2)}`,
                                paymentMode: 'Physical Cash / UPI'
                              });
                            }}
                            style={{
                              padding: '6px 12px',
                              background: '#f8fafc',
                              border: '1px solid #cbd5e1',
                              color: '#334155',
                              borderRadius: '6px',
                              fontSize: '12px',
                              fontWeight: '600',
                              cursor: 'pointer'
                            }}
                          >
                            📄 Admission Pass
                          </button>
                        )}
                      </td>
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
            <li className={activeTab === 'inpatient_admissions' ? 'active' : ''} onClick={() => setActiveTab('inpatient_admissions')}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 4v16"></path><path d="M2 8h18a2 2 0 0 1 2 2v10"></path><path d="M2 17h20"></path><path d="M6 8v9"></path></svg>
              Inpatient (IPD) Desk
              {admissions.filter(a => a.status?.includes('Pending') || a.status === 'Advised').length > 0 && (
                <span style={{ marginLeft: 'auto', background: '#ef4444', color: 'white', padding: '1px 6px', borderRadius: '10px', fontSize: '11px', fontWeight: '800' }}>
                  {admissions.filter(a => a.status?.includes('Pending') || a.status === 'Advised').length}
                </span>
              )}
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
          {activeTab === 'inpatient_admissions' && renderInpatientAdmissions()}
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
      )}
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

      {/* Appointment Token & Consultation Fee Slip Modal */}
      {printedBookingReceipt && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 99999 }}>
          <div style={{ background: 'white', borderRadius: '12px', width: '560px', maxWidth: '92vw', maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', overflow: 'hidden' }}>
            
            {/* Modal Header */}
            <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
              <h3 style={{ margin: 0, fontSize: '16px', color: '#1e293b', fontWeight: '700' }}>🎫 Appointment Token & Fee Slip</h3>
              <button onClick={() => setPrintedBookingReceipt(null)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#64748b' }}>&times;</button>
            </div>

            {/* Printable Slip */}
            <div style={{ padding: '24px 28px', overflowY: 'auto', flex: 1, backgroundColor: 'white', color: '#0f172a', fontFamily: "'Inter', sans-serif" }}>
              <div style={{ textAlign: 'center', borderBottom: '2px solid #0f172a', paddingBottom: '12px', marginBottom: '16px' }}>
                <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '800', color: '#1e293b' }}>DHMS CENTRAL CLINICAL HEALTHCARE</h3>
                <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: '#64748b' }}>Outpatient Department • Token & Consultation Slip</p>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', background: '#f1f5f9', padding: '12px 16px', borderRadius: '8px', marginBottom: '16px' }}>
                <div>
                  <span style={{ fontSize: '10.5px', color: '#64748b', display: 'block' }}>TOKEN / APPOINTMENT ID</span>
                  <strong style={{ fontSize: '16px', color: '#4338ca' }}>{printedBookingReceipt.id}</strong>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '10.5px', color: '#64748b', display: 'block' }}>DATE & TIME SLOT</span>
                  <strong>{printedBookingReceipt.date} • {printedBookingReceipt.time}</strong>
                </div>
              </div>

              <table style={{ width: '100%', fontSize: '12.5px', borderCollapse: 'collapse', marginBottom: '16px' }}>
                <tbody>
                  <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '6px 0', color: '#64748b' }}>Patient Name:</td>
                    <td style={{ padding: '6px 0', fontWeight: '700', textAlign: 'right' }}>{printedBookingReceipt.patientName}</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '6px 0', color: '#64748b' }}>Patient ID:</td>
                    <td style={{ padding: '6px 0', fontWeight: '600', textAlign: 'right' }}>{printedBookingReceipt.patientId}</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '6px 0', color: '#64748b' }}>Doctor & Department:</td>
                    <td style={{ padding: '6px 0', fontWeight: '600', textAlign: 'right' }}>{printedBookingReceipt.doctorName} ({printedBookingReceipt.department})</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '6px 0', color: '#64748b' }}>Consultation Fee:</td>
                    <td style={{ padding: '6px 0', fontWeight: '700', textAlign: 'right', color: '#166534' }}>{printedBookingReceipt.consultationFee}</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '6px 0', color: '#64748b' }}>Fee Status:</td>
                    <td style={{ padding: '6px 0', fontWeight: '700', textAlign: 'right', color: printedBookingReceipt.feeStatus === 'Paid' ? '#15803d' : '#b91c1c' }}>
                      {printedBookingReceipt.feeStatus === 'Paid' ? `PAID (${printedBookingReceipt.paymentMethod})` : 'UNPAID (Pay at Counter)'}
                    </td>
                  </tr>
                  {printedBookingReceipt.invoiceId && (
                    <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '6px 0', color: '#64748b' }}>Invoice Receipt Ref:</td>
                      <td style={{ padding: '6px 0', fontWeight: '600', textAlign: 'right' }}>{printedBookingReceipt.invoiceId}</td>
                    </tr>
                  )}
                </tbody>
              </table>

              <div style={{ background: '#f8fafc', padding: '10px 12px', borderRadius: '6px', border: '1px dashed #cbd5e1', fontSize: '11px', color: '#475569' }}>
                <strong>📌 Instructions for Patient:</strong>
                <p style={{ margin: '4px 0 0 0' }}>1. Please proceed directly to Room 101 / OPD Clinic for your turn.</p>
                <p style={{ margin: '2px 0 0 0' }}>2. Show this token slip to the attending doctor.</p>
                {printedBookingReceipt.feeStatus === 'Paid' && (
                  <p style={{ margin: '2px 0 0 0', color: '#15803d', fontWeight: '600' }}>✓ Consultation fee is fully paid upfront. No cash counter visit needed before consultation.</p>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="no-print" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', padding: '14px 20px', borderTop: '1px solid #e2e8f0', background: '#f8fafc' }}>
              <button type="button" onClick={() => setPrintedBookingReceipt(null)} style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #cbd5e1', background: 'white', color: '#475569', cursor: 'pointer', fontWeight: '600', fontSize: '13px' }}>
                Close
              </button>
              <button 
                type="button" 
                onClick={() => window.print()}
                style={{ padding: '8px 20px', borderRadius: '6px', border: 'none', background: '#4338ca', color: 'white', cursor: 'pointer', fontWeight: '700', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                🖨️ Print Token Slip
              </button>
            </div>
          </div>
        </div>
      )}

      {/* IPD Admission Processing Modal */}
      {selectedAdmForProcessing && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999 }}>
          <div style={{ background: 'white', borderRadius: '12px', width: '560px', maxWidth: '92vw', maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '17px', color: '#1e293b', fontWeight: '700' }}>🛏️ Inpatient (IPD) Admission Desk</h3>
                <span style={{ fontSize: '12px', color: '#64748b' }}>Patient: <strong>{selectedAdmForProcessing.patientName}</strong> ({selectedAdmForProcessing.patientId})</span>
              </div>
              <button onClick={() => setSelectedAdmForProcessing(null)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#64748b' }}>&times;</button>
            </div>

            <form onSubmit={handleProcessAdmissionSubmit} style={{ padding: '20px 24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', padding: '12px', fontSize: '12.5px', color: '#1e40af' }}>
                <strong>👨‍⚕️ Admitting Doctor:</strong> {selectedAdmForProcessing.doctorName}
                <div style={{ marginTop: '2px' }}><strong>Recommended Ward:</strong> {selectedAdmForProcessing.ward || 'General Ward A'}</div>
                {selectedAdmForProcessing.notes && (
                  <div style={{ marginTop: '4px', fontStyle: 'italic', color: '#1e3a8a' }}>
                    "{selectedAdmForProcessing.notes}"
                  </div>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '4px' }}>Assign Ward / Unit <span style={{ color: 'red' }}>*</span></label>
                  <select 
                    required 
                    value={ipdForm.ward} 
                    onChange={e => setIpdForm({ ...ipdForm, ward: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', background: 'white' }}
                  >
                    <option value="General Ward A">General Ward A (₹800/day)</option>
                    <option value="General Ward B">General Ward B (₹800/day)</option>
                    <option value="ICU (Intensive Care)">ICU (Intensive Care) (₹3,500/day)</option>
                    <option value="Pediatrics Ward">Pediatrics Ward (₹1,200/day)</option>
                    <option value="Semi-Private Ward C">Semi-Private Ward C (₹1,800/day)</option>
                    <option value="Private Suite 101">Private Suite 101 (₹3,000/day)</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '4px' }}>Assign Bed Number <span style={{ color: 'red' }}>*</span></label>
                  <select 
                    required 
                    value={ipdForm.bedNo} 
                    onChange={e => setIpdForm({ ...ipdForm, bedNo: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', background: 'white' }}
                  >
                    <option value="Bed A-01">Bed A-01 (Available)</option>
                    <option value="Bed A-02">Bed A-02 (Available)</option>
                    <option value="Bed A-03">Bed A-03 (Available)</option>
                    <option value="Bed A-04">Bed A-04 (Available)</option>
                    <option value="Bed B-01">Bed B-01 (Available)</option>
                    <option value="ICU-01">ICU-01 (Available)</option>
                    <option value="ICU-02">ICU-02 (Available)</option>
                    <option value="Suite-101">Suite-101 (Available)</option>
                  </select>
                </div>
              </div>

              <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '10px' }}>
                <h4 style={{ margin: '0 0 10px 0', fontSize: '13px', color: '#334155' }}>Attendant / Next of Kin Details</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '11.5px', color: '#64748b', display: 'block', marginBottom: '2px' }}>Attendant Name</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Ramesh Kumar"
                      value={ipdForm.attendantName}
                      onChange={e => setIpdForm({ ...ipdForm, attendantName: e.target.value })}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '11.5px', color: '#64748b', display: 'block', marginBottom: '2px' }}>Relationship</label>
                    <select 
                      value={ipdForm.attendantRelation}
                      onChange={e => setIpdForm({ ...ipdForm, attendantRelation: e.target.value })}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', background: 'white' }}
                    >
                      <option value="Father">Father</option>
                      <option value="Mother">Mother</option>
                      <option value="Spouse">Spouse</option>
                      <option value="Sibling">Sibling</option>
                      <option value="Guardian">Guardian</option>
                      <option value="Family Member">Family Member</option>
                    </select>
                  </div>
                </div>
                <div style={{ marginTop: '8px' }}>
                  <label style={{ fontSize: '11.5px', color: '#64748b', display: 'block', marginBottom: '2px' }}>Attendant 10-Digit Mobile Number</label>
                  <input 
                    type="tel" 
                    placeholder="e.g. 9876543210"
                    value={ipdForm.attendantPhone}
                    onChange={e => setIpdForm({ ...ipdForm, attendantPhone: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              {/* Upfront Advance Deposit Section */}
              <div style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '12px', fontWeight: '700', color: '#166534', textTransform: 'uppercase' }}>Admission Advance / Security Deposit</span>
                  <span style={{ fontSize: '11px', background: '#dcfce7', color: '#15803d', padding: '2px 8px', borderRadius: '4px', fontWeight: '700' }}>Adjusted at Final Discharge</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '11px', color: '#64748b', display: 'block', marginBottom: '2px' }}>Advance Amount (₹)</label>
                    <input 
                      type="number" 
                      value={ipdForm.advanceDeposit} 
                      onChange={e => setIpdForm({ ...ipdForm, advanceDeposit: e.target.value })}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box', fontWeight: '700', color: '#0f172a' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', color: '#64748b', display: 'block', marginBottom: '2px' }}>Deposit Payment Mode</label>
                    <select 
                      value={ipdForm.depositPaymentMode}
                      onChange={e => setIpdForm({ ...ipdForm, depositPaymentMode: e.target.value })}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', background: 'white' }}
                    >
                      <option value="Physical Cash Payment">Physical Cash Payment</option>
                      <option value="UPI / QR Code Transfer">UPI / QR Code Transfer</option>
                      <option value="Online Card Payment">Online Card Payment</option>
                      <option value="Insurance Cover / Authorization">Insurance Cover / Authorization</option>
                    </select>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <button type="button" onClick={() => setSelectedAdmForProcessing(null)} style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #cbd5e1', background: 'white', color: '#64748b', cursor: 'pointer', fontWeight: '600' }}>
                  Cancel
                </button>
                <button type="submit" style={{ padding: '8px 20px', borderRadius: '6px', border: 'none', background: '#10b981', color: 'white', cursor: 'pointer', fontWeight: '700', fontSize: '13px' }}>
                  Confirm Admission & Issue Pass
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Printable Inpatient Admission Pass Modal */}
      {printedAdmissionPass && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 99999 }}>
          <div style={{ background: 'white', borderRadius: '12px', width: '580px', maxWidth: '92vw', maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', overflow: 'hidden' }}>
            <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
              <h3 style={{ margin: 0, fontSize: '16px', color: '#1e293b', fontWeight: '700' }}>🎫 Inpatient Admission Pass & Bed Slip</h3>
              <button onClick={() => setPrintedAdmissionPass(null)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#64748b' }}>&times;</button>
            </div>

            <div style={{ padding: '24px 30px', overflowY: 'auto', flex: 1, backgroundColor: 'white', color: '#0f172a', fontFamily: "'Inter', sans-serif" }}>
              <div style={{ textAlign: 'center', borderBottom: '2px solid #0f172a', paddingBottom: '12px', marginBottom: '16px' }}>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#1e293b' }}>DHMS CENTRAL CLINICAL HEALTHCARE</h3>
                <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#64748b' }}>Inpatient Department • Admission & Bed Allocation Pass</p>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', background: '#f1f5f9', padding: '12px 16px', borderRadius: '8px', marginBottom: '16px' }}>
                <div>
                  <span style={{ fontSize: '10.5px', color: '#64748b', display: 'block' }}>ADMISSION ID</span>
                  <strong style={{ fontSize: '16px', color: '#4338ca' }}>{printedAdmissionPass.id}</strong>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '10.5px', color: '#64748b', display: 'block' }}>ADMISSION DATE</span>
                  <strong>{printedAdmissionPass.admissionDate} • {printedAdmissionPass.admittedAtTime}</strong>
                </div>
              </div>

              <table style={{ width: '100%', fontSize: '12.5px', borderCollapse: 'collapse', marginBottom: '16px' }}>
                <tbody>
                  <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '6px 0', color: '#64748b' }}>Patient Name:</td>
                    <td style={{ padding: '6px 0', fontWeight: '700', textAlign: 'right' }}>{printedAdmissionPass.patientName} ({printedAdmissionPass.patientId})</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '6px 0', color: '#64748b' }}>Admitting Physician:</td>
                    <td style={{ padding: '6px 0', fontWeight: '600', textAlign: 'right' }}>{printedAdmissionPass.doctorName}</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '6px 0', color: '#64748b' }}>Assigned Ward & Unit:</td>
                    <td style={{ padding: '6px 0', fontWeight: '700', textAlign: 'right', color: '#0369a1' }}>{printedAdmissionPass.ward}</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '6px 0', color: '#64748b' }}>Allocated Bed Number:</td>
                    <td style={{ padding: '6px 0', fontWeight: '800', textAlign: 'right', color: '#15803d', fontSize: '14px' }}>{printedAdmissionPass.bedNo}</td>
                  </tr>
                  {printedAdmissionPass.attendant && (
                    <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '6px 0', color: '#64748b' }}>Registered Attendant:</td>
                      <td style={{ padding: '6px 0', fontWeight: '600', textAlign: 'right' }}>{printedAdmissionPass.attendant.name} ({printedAdmissionPass.attendant.relation}) • {printedAdmissionPass.attendant.phone}</td>
                    </tr>
                  )}
                  <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '6px 0', color: '#64748b' }}>Advance Deposit Collected:</td>
                    <td style={{ padding: '6px 0', fontWeight: '800', textAlign: 'right', color: '#166534' }}>
                      {printedAdmissionPass.advanceDepositAmount} <small>({printedAdmissionPass.paymentMode})</small>
                    </td>
                  </tr>
                  {printedAdmissionPass.advanceInvoiceId && (
                    <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '6px 0', color: '#64748b' }}>Advance Invoice Ref:</td>
                      <td style={{ padding: '6px 0', fontWeight: '600', textAlign: 'right' }}>{printedAdmissionPass.advanceInvoiceId}</td>
                    </tr>
                  )}
                </tbody>
              </table>

              <div style={{ background: '#f8fafc', padding: '10px 12px', borderRadius: '6px', border: '1px dashed #cbd5e1', fontSize: '11px', color: '#475569' }}>
                <strong>📌 Ward Entry Instructions:</strong>
                <p style={{ margin: '4px 0 0 0' }}>1. Hand over this pass to the Nursing Station at {printedAdmissionPass.ward}.</p>
                <p style={{ margin: '2px 0 0 0' }}>2. Only 1 attendant allowed per patient during non-visiting hours.</p>
                <p style={{ margin: '2px 0 0 0' }}>3. Advance deposit will be adjusted against the final consolidated hospital invoice at discharge.</p>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '24px', paddingTop: '12px', borderTop: '1px solid #e2e8f0', fontSize: '11.5px', color: '#64748b' }}>
                <div>Processed by: <strong>{printedAdmissionPass.processedBy || 'Reception Desk'}</strong></div>
                <div style={{ textAlign: 'right' }}>Authorized Admission Stamp</div>
              </div>
            </div>

            <div className="no-print" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', padding: '14px 20px', borderTop: '1px solid #e2e8f0', background: '#f8fafc' }}>
              <button type="button" onClick={() => setPrintedAdmissionPass(null)} style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #cbd5e1', background: 'white', color: '#475569', cursor: 'pointer', fontWeight: '600', fontSize: '13px' }}>
                Close
              </button>
              <button 
                type="button" 
                onClick={() => window.print()}
                style={{ padding: '8px 20px', borderRadius: '6px', border: 'none', background: '#4338ca', color: 'white', cursor: 'pointer', fontWeight: '700', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                🖨️ Print Admission Pass
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
