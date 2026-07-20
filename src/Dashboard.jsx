import React, { useState } from 'react';
import './Dashboard.css';

const DUMMY_DEPARTMENTS = [
  { id: 1, name: 'Cardiology', head: 'Dr. Smith' },
  { id: 2, name: 'Neurology', head: 'Dr. Adams' },
  { id: 3, name: 'Pediatrics', head: 'Dr. Johnson' },
  { id: 4, name: 'Orthopedics', head: 'Dr. Williams' },
];

const DUMMY_DOCTORS = [
  { id: 1, name: 'Dr. Sarah Smith', department: 'Cardiology', status: 'Available' },
  { id: 2, name: 'Dr. John Adams', department: 'Neurology', status: 'On Leave' },
  { id: 3, name: 'Dr. Emily Johnson', department: 'Pediatrics', status: 'Available' },
  { id: 4, name: 'Dr. Michael Williams', department: 'Orthopedics', status: 'In Surgery' },
];

const DUMMY_PATIENTS = [
  { id: 101, name: 'Michael Brown', age: 45, gender: 'Male', lastVisit: '2026-07-10' },
  { id: 102, name: 'Lisa Ray', age: 32, gender: 'Female', lastVisit: '2026-07-12' },
  { id: 103, name: 'David Kim', age: 28, gender: 'Male', lastVisit: '2026-07-14' },
];

const DOCTORS = [
  { id: 'dr_watson', name: 'Dr. John Watson', department: 'Primary Care' },
  { id: 'dr_house', name: 'Dr. Gregory House', department: 'Cardiology' },
  { id: 'dr_grey', name: 'Dr. Meredith Grey', department: 'General Surgery' }
];

export default function Dashboard({ onLogout, role }) {
  const [activeView, setActiveView] = useState('overview');

  // Phase 3 States
  const [adminSubTab, setAdminSubTab] = useState('appointments');
  const [adminSearch, setAdminSearch] = useState('');
  const [adminStatusFilter, setAdminStatusFilter] = useState('All');
  const [selectedAdminPatientEhr, setSelectedAdminPatientEhr] = useState(null);

  // Billing state
  const [billingList, setBillingList] = useState(() => {
    const saved = localStorage.getItem('dhms_billing');
    if (saved) return JSON.parse(saved);
    const defaults = [
      { id: "INV-5091", patientId: "PT-80234", patientName: "Alice Johnson", date: "2026-07-16", amount: "$150.00", status: "Paid", type: "Consultation Fee" },
      { id: "INV-1102", patientId: "PT-11922", patientName: "Bob Smith", date: "2026-07-16", amount: "$350.00", status: "Unpaid", type: "Lab Diagnostics" },
      { id: "INV-6540", patientId: "PT-55310", patientName: "Carol Davis", date: "2026-07-16", amount: "$75.00", status: "Paid", type: "Prescription Co-pay" },
      { id: "INV-2908", patientId: "PT-22345", patientName: "David Wilson", date: "2026-07-15", amount: "$120.00", status: "Unpaid", type: "Consultation Fee" }
    ];
    localStorage.setItem('dhms_billing', JSON.stringify(defaults));
    return defaults;
  });


  // Doctor state
  const [activeDoctorId, setActiveDoctorId] = useState('dr_watson');
  const [selectedApptForCheckup, setSelectedApptForCheckup] = useState(null);
  const [selectedEhrPatient, setSelectedEhrPatient] = useState(null);
  const [patientSearch, setPatientSearch] = useState('');

  // Telemedicine calling states
  const [isVideoCallActive, setIsVideoCallActive] = useState(false);
  const [activeCallAppt, setActiveCallAppt] = useState(null);
  const [callChatMessages, setCallChatMessages] = useState([]);
  const [newCallMessage, setNewCallMessage] = useState('');

  // Checkup Consultation Forms
  const [diagnosisNote, setDiagnosisNote] = useState('');
  const [vitalBP, setVitalBP] = useState('120/80');
  const [vitalHR, setVitalHR] = useState('72');
  const [vitalTemp, setVitalTemp] = useState('98.6');
  const [vitalSpO2, setVitalSpO2] = useState('98');

  // Detailed Rx builder
  const [rxDrugName, setRxDrugName] = useState('');
  const [rxDose, setRxDose] = useState('500mg');
  const [rxFrequency, setRxFrequency] = useState('Once Daily (QD)');
  const [rxDuration, setRxDuration] = useState('7 Days');
  const [rxCost, setRxCost] = useState('25.00');
  const [rxInstructions, setRxInstructions] = useState('Take with meals');

  // Lab order builder
  const [labTestName, setLabTestName] = useState('');
  const [labPriority, setLabPriority] = useState('Routine');
  const [labCost, setLabCost] = useState('85.00');

  // EHR editing state
  const [newAllergies, setNewAllergies] = useState('');
  const [newConditions, setNewConditions] = useState('');
  const [newBloodType, setNewBloodType] = useState('O+');

  // Admission States
  const [isAdmitted, setIsAdmitted] = useState(false);
  const [admissionNotes, setAdmissionNotes] = useState('');
  const [admissionWard, setAdmissionWard] = useState('General Ward A');

  // Add custom report to EHR
  const [reportTitle, setReportTitle] = useState('');
  const [reportContent, setReportContent] = useState('');

  // Laboratory Module Completion States
  const [selectedLabForResults, setSelectedLabForResults] = useState(null);
  const [labResultsText, setLabResultsText] = useState('');
  const [labRemarks, setLabRemarks] = useState('');
  const [viewedLabRequestResults, setViewedLabRequestResults] = useState(null);

  // Core records from localStorage
  const [appointments, setAppointments] = useState(() => {
    return JSON.parse(localStorage.getItem('dhms_appointments') || '[]');
  });

  const [prescriptions, setPrescriptions] = useState(() => {
    return JSON.parse(localStorage.getItem('dhms_prescriptions') || '[]');
  });

  const [labRequests, setLabRequests] = useState(() => {
    return JSON.parse(localStorage.getItem('dhms_lab_requests') || '[]');
  });

  const [patients, setPatients] = useState(() => {
    const list = JSON.parse(localStorage.getItem('dhms_patients') || '[]');
    // Inject default clinical profiles if missing
    let modified = false;
    const updated = list.map(p => {
      let isChanged = false;
      if (!p.allergies) { p.allergies = 'Penicillin'; isChanged = true; }
      if (!p.chronicConditions) { p.chronicConditions = 'Hypertension'; isChanged = true; }
      if (!p.bloodType) { p.bloodType = 'A+'; isChanged = true; }
      if (!p.clinicalHistory) { p.clinicalHistory = []; isChanged = true; }
      if (!p.reports) { p.reports = []; isChanged = true; }
      if (isChanged) modified = true;
      return p;
    });
    if (modified) {
      localStorage.setItem('dhms_patients', JSON.stringify(updated));
    }
    return updated;
  });

  const handleUpdateApptStatus = (apptId, newStatus) => {
    const updated = appointments.map(appt => {
      if (appt.id === apptId) {
        return { ...appt, status: newStatus };
      }
      return appt;
    });
    setAppointments(updated);
    localStorage.setItem('dhms_appointments', JSON.stringify(updated));
  };

  const handleOpenCheckupModal = (appt) => {
    setSelectedApptForCheckup(appt);
    setDiagnosisNote('');
    setVitalBP('120/80');
    setVitalHR('72');
    setVitalTemp('98.6');
    setVitalSpO2('98');
    setRxDrugName('');
    setRxDose('500mg');
    setRxFrequency('Once Daily (QD)');
    setRxDuration('7 Days');
    setRxCost('25.00');
    setRxInstructions('Take with meals');
    setLabTestName('');
    setLabPriority('Routine');
    setLabCost('85.00');
    setIsAdmitted(false);
    setAdmissionNotes('');
    setAdmissionWard('General Ward A');
  };

  const handleSendCallMessage = (e) => {
    e.preventDefault();
    if (!newCallMessage.trim()) return;
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setCallChatMessages(prev => [...prev, {
      sender: "doctor",
      text: newCallMessage,
      time: now
    }]);
    setNewCallMessage('');
  };

  const handleCheckupSubmit = (e) => {
    e.preventDefault();
    const apptToComplete = selectedApptForCheckup || activeCallAppt;
    if (!apptToComplete) return;

    const currentDoc = DOCTORS.find(d => d.id === activeDoctorId) || DOCTORS[0];
    const todayStr = new Date().toISOString().split('T')[0];

    // 1. Update appointment to Completed
    const updatedAppts = appointments.map(appt => {
      if (appt.id === apptToComplete.id) {
        return { 
          ...appt, 
          status: 'Completed',
          diagnosis: diagnosisNote || 'Routine consultation completed.',
          vitals: { bp: vitalBP, hr: vitalHR, temp: vitalTemp, spo2: vitalSpO2 }
        };
      }
      return appt;
    });
    setAppointments(updatedAppts);
    localStorage.setItem('dhms_appointments', JSON.stringify(updatedAppts));

    // 2. Append consultation clinical history and vitals directly to the patient's EHR profile
    const updatedPatients = patients.map(p => {
      if (p.id === apptToComplete.patientId) {
        const historyEntry = {
          date: todayStr,
          doctor: currentDoc.name,
          diagnosis: diagnosisNote || 'Routine checkup completed.',
          reason: apptToComplete.reason,
          vitals: { bp: vitalBP, hr: vitalHR, temp: vitalTemp, spo2: vitalSpO2 },
          prescriptions: rxDrugName.trim() ? [`${rxDrugName} ${rxDose} - ${rxFrequency} (${rxDuration})`] : [],
          labs: labTestName.trim() ? [`${labTestName} [${labPriority}]`] : []
        };
        return {
          ...p,
          clinicalHistory: [historyEntry, ...(p.clinicalHistory || [])]
        };
      }
      return p;
    });
    setPatients(updatedPatients);
    localStorage.setItem('dhms_patients', JSON.stringify(updatedPatients));

    // 3. Dispatch prescription to pharmacy if drug name entered
    if (rxDrugName.trim()) {
      const rxList = JSON.parse(localStorage.getItem('dhms_prescriptions') || '[]');
      const newRx = {
        id: `RX-${Math.floor(1000 + Math.random() * 9000)}`,
        patientId: apptToComplete.patientId,
        patientName: apptToComplete.patientName,
        medication: `${rxDrugName} ${rxDose} (${rxFrequency}, ${rxDuration})`,
        doctorName: currentDoc.name,
        date: todayStr,
        cost: `${parseFloat(rxCost).toFixed(2)}`,
        status: isAdmitted ? 'Advised' : 'Pending',
        instructions: rxInstructions,
        type: isAdmitted ? 'Inpatient' : 'Outpatient'
      };
      const finalRx = [newRx, ...rxList];
      localStorage.setItem('dhms_prescriptions', JSON.stringify(finalRx));
      setPrescriptions(finalRx);
    }

    // 3.5 Check Admission
    if (isAdmitted) {
      const adms = JSON.parse(localStorage.getItem('dhms_admissions') || '[]');
      const newAdm = {
        id: `ADM-${Math.floor(1000 + Math.random() * 9000)}`,
        patientId: apptToComplete.patientId,
        patientName: apptToComplete.patientName,
        doctorName: currentDoc.name,
        admissionDate: todayStr,
        dischargeDate: null,
        ward: admissionWard,
        notes: admissionNotes || 'Admitted from consultation.',
        status: 'Admitted',
        medications: rxDrugName.trim() ? [{
          name: `${rxDrugName} ${rxDose}`,
          instructions: rxInstructions,
          cost: parseFloat(rxCost) || 0.00,
          status: 'Advised', // Status: Advised -> Dispensed
          date: todayStr
        }] : [],
        pharmacyBillPaid: false
      };
      const finalAdms = [newAdm, ...adms];
      localStorage.setItem('dhms_admissions', JSON.stringify(finalAdms));
    }

    // 4. Dispatch lab request to laboratory if test name entered
    if (labTestName.trim()) {
      const labList = JSON.parse(localStorage.getItem('dhms_lab_requests') || '[]');
      const newLab = {
        id: `LAB-${Math.floor(1000 + Math.random() * 9000)}`,
        patientId: apptToComplete.patientId,
        patientName: apptToComplete.patientName,
        testName: `${labTestName} (${labPriority} Priority)`,
        doctorName: currentDoc.name,
        date: todayStr,
        cost: `${parseFloat(labCost).toFixed(2)}`,
        status: 'Pending'
      };
      const finalLab = [newLab, ...labList];
      localStorage.setItem('dhms_lab_requests', JSON.stringify(finalLab));
      setLabRequests(finalLab);
    }

    // 5. Instantly generate a consultation invoice for the receptionist billing system
    const billing = JSON.parse(localStorage.getItem('dhms_billing') || '[]');
    const newConsultationInvoice = {
      id: `INV-${Math.floor(1000 + Math.random() * 9000)}`,
      patientId: apptToComplete.patientId,
      patientName: apptToComplete.patientName,
      date: todayStr,
      amount: '$150.00',
      status: 'Unpaid',
      type: 'Consultation Fee'
    };
    const updatedBillingList = [newConsultationInvoice, ...billing];
    localStorage.setItem('dhms_billing', JSON.stringify(updatedBillingList));
    setBillingList(updatedBillingList);

    // Clean up calling and modal states
    setSelectedApptForCheckup(null);
    setIsVideoCallActive(false);
    setActiveCallAppt(null);
    alert('Checkup clinical log completed and billed successfully.');
  };

  const handleUpdateEhrMetadata = (e) => {
    e.preventDefault();
    if (!selectedEhrPatient) return;
    const updated = patients.map(p => {
      if (p.id === selectedEhrPatient.id) {
        return {
          ...p,
          allergies: newAllergies,
          chronicConditions: newConditions,
          bloodType: newBloodType
        };
      }
      return p;
    });
    setPatients(updated);
    localStorage.setItem('dhms_patients', JSON.stringify(updated));
    setSelectedEhrPatient(prev => ({
      ...prev,
      allergies: newAllergies,
      chronicConditions: newConditions,
      bloodType: newBloodType
    }));
    alert('EHR Medical profile updated successfully.');
  };

  const handleAddEhrReport = (e) => {
    e.preventDefault();
    if (!selectedEhrPatient || !reportTitle.trim()) return;

    const currentDoc = DOCTORS.find(d => d.id === activeDoctorId) || DOCTORS[0];
    const todayStr = new Date().toISOString().split('T')[0];

    const newReport = {
      id: `EHR-${Math.floor(100 + Math.random() * 900)}`,
      name: reportTitle,
      type: 'Clinical Report',
      size: '2.4 KB',
      date: todayStr,
      author: currentDoc.name,
      details: { summary: reportContent }
    };

    const updated = patients.map(p => {
      if (p.id === selectedEhrPatient.id) {
        return {
          ...p,
          reports: [newReport, ...(p.reports || [])]
        };
      }
      return p;
    });
    setPatients(updated);
    localStorage.setItem('dhms_patients', JSON.stringify(updated));
    setSelectedEhrPatient(prev => ({
      ...prev,
      reports: [newReport, ...(prev.reports || [])]
    }));
    setReportTitle('');
    setReportContent('');
    alert('New clinical report saved to patient record.');
  };

  const handleDispenseRx = (rxId) => {
    const updatedRx = prescriptions.map(rx => {
      if (rx.id === rxId) {
        return { ...rx, status: 'Dispensed & Billed' };
      }
      return rx;
    });
    setPrescriptions(updatedRx);
    localStorage.setItem('dhms_prescriptions', JSON.stringify(updatedRx));

    const rxItem = prescriptions.find(rx => rx.id === rxId);
    if (rxItem) {
      const billing = JSON.parse(localStorage.getItem('dhms_billing') || '[]');
      const newInvoice = {
        id: `INV-${Math.floor(1000 + Math.random() * 9000)}`,
        patientId: rxItem.patientId,
        patientName: rxItem.patientName,
        date: new Date().toISOString().split('T')[0],
        amount: rxItem.cost,
        status: "Unpaid",
        type: "Prescription Co-pay"
      };
      const updatedBilling = [newInvoice, ...billing];
      localStorage.setItem('dhms_billing', JSON.stringify(updatedBilling));
      setBillingList(updatedBilling);
    }
  };

  const handleCompleteLab = (labId) => {
    const updatedLab = labRequests.map(lab => {
      if (lab.id === labId) {
        return { ...lab, status: 'Completed & Billed' };
      }
      return lab;
    });
    setLabRequests(updatedLab);
    localStorage.setItem('dhms_lab_requests', JSON.stringify(updatedLab));

    const labItem = labRequests.find(lab => lab.id === labId);
    if (labItem) {
      const billing = JSON.parse(localStorage.getItem('dhms_billing') || '[]');
      const newInvoice = {
        id: `INV-${Math.floor(1000 + Math.random() * 9000)}`,
        patientId: labItem.patientId,
        patientName: labItem.patientName,
        date: new Date().toISOString().split('T')[0],
        amount: labItem.cost,
        status: "Unpaid",
        type: "Lab Diagnostics"
      };
      const updatedBilling = [newInvoice, ...billing];
      localStorage.setItem('dhms_billing', JSON.stringify(updatedBilling));
      setBillingList(updatedBilling);
    }
  };

  const handleCompleteLabWithResults = (e) => {
    e.preventDefault();
    if (!selectedLabForResults) return;

    const todayStr = new Date().toISOString().split('T')[0];

    // 1. Update the lab request with status and results
    const updatedLab = labRequests.map(lab => {
      if (lab.id === selectedLabForResults.id) {
        return { 
          ...lab, 
          status: 'Completed & Billed',
          results: labResultsText,
          remarks: labRemarks,
          completedDate: todayStr
        };
      }
      return lab;
    });
    setLabRequests(updatedLab);
    localStorage.setItem('dhms_lab_requests', JSON.stringify(updatedLab));

    // 2. Append a new Lab Report to the patient's EHR profile in localStorage
    const patientList = JSON.parse(localStorage.getItem('dhms_patients') || '[]');
    const newReport = {
      id: `EHR-${Math.floor(100 + Math.random() * 900)}`,
      name: `${selectedLabForResults.testName} Report`,
      type: 'Lab Report',
      size: '1.8 KB',
      date: todayStr,
      author: 'Laboratory Specialist',
      details: { 
        summary: labResultsText,
        remarks: labRemarks,
        labRequestId: selectedLabForResults.id,
        orderedBy: selectedLabForResults.doctorName
      }
    };

    const updatedPatients = patientList.map(p => {
      if (p.id === selectedLabForResults.patientId) {
        return {
          ...p,
          reports: [newReport, ...(p.reports || [])]
        };
      }
      return p;
    });
    localStorage.setItem('dhms_patients', JSON.stringify(updatedPatients));
    setPatients(updatedPatients);

    // 3. Dispatch billing invoice
    const billing = JSON.parse(localStorage.getItem('dhms_billing') || '[]');
    const newInvoice = {
      id: `INV-${Math.floor(1000 + Math.random() * 9000)}`,
      patientId: selectedLabForResults.patientId,
      patientName: selectedLabForResults.patientName,
      date: todayStr,
      amount: selectedLabForResults.cost,
      status: "Unpaid",
      type: "Lab Diagnostics"
    };
    const updatedBilling = [newInvoice, ...billing];
    localStorage.setItem('dhms_billing', JSON.stringify(updatedBilling));
    setBillingList(updatedBilling);

    // Clean up
    setSelectedLabForResults(null);
    setLabResultsText('');
    setLabRemarks('');
    alert('Lab diagnostic report completed, saved to EHR, and billed successfully.');
  };

  const getNavItems = () => {
    switch (role) {
      case 'admin':
        return [
          { id: 'overview', label: 'Overview' },
          { id: 'departments', label: 'Departments' },
          { id: 'doctors', label: 'Doctors' },
          { id: 'patients', label: 'Patients' }
        ];
      case 'doctor':
        return [
          { id: 'overview', label: 'My Dashboard' },
          { id: 'patients', label: 'Patient EHR Records' },
          { id: 'appointments', label: 'Appointments' },
          { id: 'prescriptions', label: 'Prescription History' },
          { id: 'labs', label: 'Lab Orders History' }
        ];
      case 'patient':
        return [
          { id: 'overview', label: 'Patient Portal' },
          { id: 'doctors', label: 'Find a Doctor' },
          { id: 'records', label: 'My Records' }
        ];
      case 'laboratory':
        return [
          { id: 'overview', label: 'Lab Dashboard' },
          { id: 'requests', label: 'Lab Requests' }
        ];
      case 'pharmacist':
        return [
          { id: 'overview', label: 'Pharmacy Dashboard' },
          { id: 'prescriptions', label: 'Prescriptions' }
        ];
      default:
        return [{ id: 'overview', label: 'Overview' }];
    }
  };

  const navItems = getNavItems();

  const renderRoleOverview = () => {
    if (role === 'admin') {
      return (
        <>
          <p>Welcome Admin. You can manage foundational entities (Departments, Doctors, Patients) across the hospital.</p>
          <div className="stats-grid">
            <div className="stat-card" onClick={() => setActiveView('departments')}>
              <h3>Departments</h3>
              <div className="stat-value">{DUMMY_DEPARTMENTS.length}</div>
            </div>
            <div className="stat-card" onClick={() => setActiveView('doctors')}>
              <h3>Doctors</h3>
              <div className="stat-value">{DUMMY_DOCTORS.length}</div>
            </div>
            <div className="stat-card" onClick={() => setActiveView('patients')}>
              <h3>Patients</h3>
              <div className="stat-value">{DUMMY_PATIENTS.length}</div>
            </div>
          </div>
        </>
      );
    } else if (role === 'doctor') {
      const activeDoctor = DOCTORS.find(d => d.id === activeDoctorId) || DOCTORS[0];
      const docAppts = appointments.filter(appt => appt.doctorId === activeDoctorId);
      const uniquePatientsCount = new Set(docAppts.map(a => a.patientId)).size;

      return (
        <>
          <p>Welcome {activeDoctor.name}. Manage your appointments and view patient records.</p>
          <div className="stats-grid">
            <div className="stat-card" onClick={() => setActiveView('patients')}>
              <h3>Assigned Patients</h3>
              <div className="stat-value">{uniquePatientsCount}</div>
            </div>
            <div className="stat-card" onClick={() => setActiveView('appointments')}>
              <h3>Active Appointments</h3>
              <div className="stat-value">{docAppts.filter(a => a.status !== 'Completed').length}</div>
            </div>
          </div>

          <div className="rd-card" style={{ marginTop: '24px', backgroundColor: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', color: '#1e293b' }}>Assigned Schedule Overview</h3>
            {docAppts.length === 0 ? (
              <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>No appointments scheduled for today.</p>
            ) : (
              <table className="data-table" style={{ boxShadow: 'none', border: 'none' }}>
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Patient Name</th>
                    <th>Reason</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {docAppts.slice(0, 5).map(appt => (
                    <tr key={appt.id}>
                      <td><strong>{appt.time}</strong></td>
                      <td>{appt.patientName}</td>
                      <td>{appt.reason}</td>
                      <td>
                        <span className={`status-badge`} style={{
                          backgroundColor: appt.status === 'Completed' ? '#dcfce7' : appt.status === 'Checked In' ? '#eff6ff' : appt.status === 'In Progress' ? '#fef3c7' : '#f1f5f9',
                          color: appt.status === 'Completed' ? '#15803d' : appt.status === 'Checked In' ? '#1d4ed8' : appt.status === 'In Progress' ? '#b45309' : '#475569'
                        }}>
                          {appt.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      );
    } else if (role === 'patient') {
      return (
        <>
          <p>Welcome to your personal health portal. Find doctors and view your medical records.</p>
          <div className="stats-grid">
            <div className="stat-card" onClick={() => setActiveView('doctors')}>
              <h3>Available Doctors</h3>
              <div className="stat-value">{DUMMY_DOCTORS.filter(d => d.status === 'Available').length}</div>
            </div>
            <div className="stat-card">
              <h3>Upcoming Visits</h3>
              <div className="stat-value">1</div>
            </div>
          </div>
        </>
      );
    } else if (role === 'laboratory') {
      const pendingLabCount = labRequests.filter(req => req.status === 'Pending').length;
      return (
        <>
          <p>Welcome to the Laboratory portal. Manage test requests and results.</p>
          <div className="stats-grid">
            <div className="stat-card" onClick={() => setActiveView('requests')}>
              <h3>Pending Requests</h3>
              <div className="stat-value">{pendingLabCount}</div>
            </div>
          </div>
        </>
      );
    } else if (role === 'pharmacist') {
      const pendingRxCount = prescriptions.filter(rx => rx.status === 'Pending').length;
      return (
        <>
          <p>Welcome to the Pharmacy portal. Manage prescriptions and inventory.</p>
          <div className="stats-grid">
            <div className="stat-card" onClick={() => setActiveView('prescriptions')}>
              <h3>New Prescriptions</h3>
              <div className="stat-value">{pendingRxCount}</div>
            </div>
          </div>
        </>
      );
    }
  };

  const renderPhase3Console = () => {
    const totalAppointmentsCount = appointments.length;
    const completedApptsCount = appointments.filter(a => a.status === 'Completed').length;
    const upcomingApptsCount = appointments.filter(a => a.status === 'Upcoming' || a.status === 'Confirmed' || a.status === 'Checked In').length;

    const totalEhrsCount = patients.length;

    const totalPrescriptionsCount = prescriptions.length;
    const pendingRxCount = prescriptions.filter(r => r.status === 'Pending').length;
    const dispensedRxCount = prescriptions.filter(r => r.status === 'Dispensed & Billed').length;

    const cleanAmount = (amtStr) => parseFloat((amtStr || '').replace('$', '').trim()) || 0;
    const totalRevenue = billingList
      .filter(inv => inv.status === 'Paid')
      .reduce((sum, inv) => sum + cleanAmount(inv.amount), 0);
    const unpaidRevenue = billingList
      .filter(inv => inv.status === 'Unpaid')
      .reduce((sum, inv) => sum + cleanAmount(inv.amount), 0);
    const totalBilled = totalRevenue + unpaidRevenue;

    if (role === 'admin') {
      const filteredAppointments = appointments.filter(appt => {
        const matchesSearch = appt.patientName.toLowerCase().includes(adminSearch.toLowerCase()) ||
                              appt.doctorName.toLowerCase().includes(adminSearch.toLowerCase()) ||
                              appt.id.toLowerCase().includes(adminSearch.toLowerCase());
        const matchesStatus = adminStatusFilter === 'All' || appt.status === adminStatusFilter;
        return matchesSearch && matchesStatus;
      });

      const filteredPatients = patients.filter(p => {
        const query = adminSearch.toLowerCase();
        return p.id.toLowerCase().includes(query) ||
               `${p.firstName} ${p.lastName}`.toLowerCase().includes(query) ||
               (p.phone && p.phone.includes(query));
      });

      const filteredPrescriptions = prescriptions.filter(rx => {
        const matchesSearch = rx.patientName.toLowerCase().includes(adminSearch.toLowerCase()) ||
                              rx.medication.toLowerCase().includes(adminSearch.toLowerCase()) ||
                              rx.id.toLowerCase().includes(adminSearch.toLowerCase());
        const matchesStatus = adminStatusFilter === 'All' || rx.status === adminStatusFilter;
        return matchesSearch && matchesStatus;
      });

      const filteredBilling = billingList.filter(inv => {
        const matchesSearch = inv.patientName.toLowerCase().includes(adminSearch.toLowerCase()) ||
                              inv.id.toLowerCase().includes(adminSearch.toLowerCase()) ||
                              inv.type.toLowerCase().includes(adminSearch.toLowerCase());
        const matchesStatus = adminStatusFilter === 'All' || inv.status === adminStatusFilter;
        return matchesSearch && matchesStatus;
      });

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
        <div className="phase3-console" style={{ marginTop: '30px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ margin: 0, fontSize: '20px', color: '#1e293b' }}>Phase 3 Hospital Operations & Financials</h3>
            <span style={{ fontSize: '12px', background: '#dbeafe', color: '#1e40af', padding: '4px 10px', borderRadius: '999px', fontWeight: '600' }}>Active Operations Console</span>
          </div>

          <div className="stats-grid" style={{ marginBottom: '24px' }}>
            <div className="stat-card" style={{ borderLeft: '4px solid #3b82f6' }} onClick={() => { setAdminSubTab('appointments'); setAdminSearch(''); setAdminStatusFilter('All'); }}>
              <h3>Appointments</h3>
              <div className="stat-value">{totalAppointmentsCount}</div>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '6px' }}>
                <span style={{ color: '#10b981', fontWeight: '600' }}>{completedApptsCount}</span> Completed | <span style={{ color: '#f59e0b', fontWeight: '600' }}>{upcomingApptsCount}</span> Active
              </div>
            </div>

            <div className="stat-card" style={{ borderLeft: '4px solid #10b981' }} onClick={() => { setAdminSubTab('ehr'); setAdminSearch(''); setAdminStatusFilter('All'); }}>
              <h3>Active Patient EHRs</h3>
              <div className="stat-value">{totalEhrsCount}</div>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '6px' }}>
                Clinical Records & Summaries
              </div>
            </div>

            <div className="stat-card" style={{ borderLeft: '4px solid #8b5cf6' }} onClick={() => { setAdminSubTab('prescriptions'); setAdminSearch(''); setAdminStatusFilter('All'); }}>
              <h3>Medications Issued</h3>
              <div className="stat-value">{totalPrescriptionsCount}</div>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '6px' }}>
                <span style={{ color: '#10b981', fontWeight: '600' }}>{dispensedRxCount}</span> Dispensed | <span style={{ color: '#ef4444', fontWeight: '600' }}>{pendingRxCount}</span> Pending
              </div>
            </div>

            <div className="stat-card" style={{ borderLeft: '4px solid #ef4444' }} onClick={() => { setAdminSubTab('billing'); setAdminSearch(''); setAdminStatusFilter('All'); }}>
              <h3>Hospital Billing</h3>
              <div className="stat-value">${totalRevenue.toFixed(2)}</div>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '6px' }}>
                Total: <span style={{ fontWeight: '600' }}>${totalBilled.toFixed(2)}</span> | Unpaid: <span style={{ color: '#ef4444', fontWeight: '600' }}>${unpaidRevenue.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', borderBottom: '2px solid #e2e8f0', marginBottom: '20px', gap: '8px' }}>
            {['appointments', 'ehr', 'prescriptions', 'billing'].map(tab => (
              <button
                key={tab}
                type="button"
                onClick={() => { setAdminSubTab(tab); setAdminSearch(''); setAdminStatusFilter('All'); }}
                style={{
                  padding: '10px 16px',
                  background: 'none',
                  border: 'none',
                  borderBottom: adminSubTab === tab ? '3px solid #3b82f6' : '3px solid transparent',
                  color: adminSubTab === tab ? '#1e3a8a' : '#64748b',
                  fontWeight: '600',
                  fontSize: '14px',
                  cursor: 'pointer',
                  textTransform: 'capitalize',
                  marginBottom: '-2px'
                }}
              >
                {tab === 'ehr' ? 'EHR Explorer' : tab}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', marginBottom: '16px', alignItems: 'center' }}>
            <input
              type="text"
              placeholder={`Search ${adminSubTab}...`}
              value={adminSearch}
              onChange={(e) => setAdminSearch(e.target.value)}
              style={{
                padding: '8px 14px',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                width: '320px',
                fontSize: '14px',
                outline: 'none'
              }}
            />

            {adminSubTab !== 'ehr' && (
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', color: '#64748b' }}>Filter Status:</span>
                <select
                  value={adminStatusFilter}
                  onChange={(e) => setAdminStatusFilter(e.target.value)}
                  style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', background: 'white', fontSize: '13px' }}
                >
                  <option value="All">All Statuses</option>
                  {adminSubTab === 'appointments' && (
                    <>
                      <option value="Upcoming">Upcoming</option>
                      <option value="Confirmed">Confirmed</option>
                      <option value="Checked In">Checked In</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Completed">Completed</option>
                    </>
                  )}
                  {adminSubTab === 'prescriptions' && (
                    <>
                      <option value="Pending">Pending</option>
                      <option value="Dispensed & Billed">Dispensed & Billed</option>
                    </>
                  )}
                  {adminSubTab === 'billing' && (
                    <>
                      <option value="Paid">Paid</option>
                      <option value="Unpaid">Unpaid</option>
                    </>
                  )}
                </select>
              </div>
            )}
          </div>

          <div className="admin-console-tab-content">
            {adminSubTab === 'appointments' && (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Appointment ID</th>
                    <th>Patient Details</th>
                    <th>Physician / Dept</th>
                    <th>Date / Time</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAppointments.length === 0 ? (
                    <tr><td colSpan="5" style={{ textAlign: 'center', color: '#64748b', padding: '20px' }}>No appointments match filter</td></tr>
                  ) : (
                    filteredAppointments.map(appt => (
                      <tr key={appt.id}>
                        <td><strong>{appt.id}</strong></td>
                        <td>
                          <strong>{appt.patientName}</strong>
                          <div style={{ fontSize: '11px', color: '#64748b' }}>ID: {appt.patientId}</div>
                        </td>
                        <td>
                          <div>{appt.doctorName}</div>
                          <span style={{ fontSize: '11px', color: '#64748b', background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>{appt.department}</span>
                        </td>
                        <td>
                          <strong>{appt.date}</strong>
                          <div style={{ fontSize: '12px', color: '#64748b' }}>{appt.time}</div>
                        </td>
                        <td>
                          <span className={`status-badge`} style={{
                            backgroundColor: appt.status === 'Completed' ? '#dcfce7' : appt.status === 'Checked In' ? '#eff6ff' : appt.status === 'In Progress' ? '#fef3c7' : '#f1f5f9',
                            color: appt.status === 'Completed' ? '#15803d' : appt.status === 'Checked In' ? '#1d4ed8' : appt.status === 'In Progress' ? '#b45309' : '#475569'
                          }}>
                            {appt.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}

            {adminSubTab === 'ehr' && (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Patient ID</th>
                    <th>Name</th>
                    <th>Blood Group</th>
                    <th>Known Allergies</th>
                    <th>Chronic Conditions</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPatients.length === 0 ? (
                    <tr><td colSpan="6" style={{ textAlign: 'center', color: '#64748b', padding: '20px' }}>No patients found</td></tr>
                  ) : (
                    filteredPatients.map(p => (
                      <tr key={p.id}>
                        <td><strong>{p.id}</strong></td>
                        <td><strong>{p.firstName} {p.lastName}</strong><div style={{ fontSize: '11px', color: '#64748b' }}>DOB: {p.dob}</div></td>
                        <td><span style={{ background: '#fef2f2', color: '#b91c1c', padding: '4px 8px', borderRadius: '4px', fontWeight: 'bold', fontSize: '12px' }}>{p.bloodType || 'O+'}</span></td>
                        <td>{p.allergies || 'None'}</td>
                        <td>{p.chronicConditions || 'None'}</td>
                        <td>
                          <button
                            type="button"
                            onClick={() => setSelectedAdminPatientEhr(p)}
                            style={{
                              padding: '5px 10px',
                              backgroundColor: '#eff6ff',
                              color: '#1d4ed8',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontWeight: '600',
                              fontSize: '12px'
                            }}
                          >
                            Inspect EHR
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}

            {adminSubTab === 'prescriptions' && (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>RX ID</th>
                    <th>Patient Name</th>
                    <th>Medication Details</th>
                    <th>Prescribing Doctor</th>
                    <th>Date</th>
                    <th>Co-pay Cost</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPrescriptions.length === 0 ? (
                    <tr><td colSpan="7" style={{ textAlign: 'center', color: '#64748b', padding: '20px' }}>No prescriptions match filter</td></tr>
                  ) : (
                    filteredPrescriptions.map(rx => (
                      <tr key={rx.id}>
                        <td><strong>{rx.id}</strong></td>
                        <td>{rx.patientName}</td>
                        <td><strong>{rx.medication}</strong></td>
                        <td>{rx.doctorName}</td>
                        <td>{rx.date}</td>
                        <td><strong>{rx.cost}</strong></td>
                        <td>
                          <span className={`status-badge`} style={{
                            backgroundColor: rx.status === 'Dispensed & Billed' ? '#dcfce7' : '#fee2e2',
                            color: rx.status === 'Dispensed & Billed' ? '#15803d' : '#b91c1c'
                          }}>
                            {rx.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}

            {adminSubTab === 'billing' && (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Invoice ID</th>
                    <th>Patient Details</th>
                    <th>Billing Description</th>
                    <th>Date</th>
                    <th>Charge Amount</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBilling.length === 0 ? (
                    <tr><td colSpan="7" style={{ textAlign: 'center', color: '#64748b', padding: '20px' }}>No invoices match filter</td></tr>
                  ) : (
                    filteredBilling.map(inv => (
                      <tr key={inv.id}>
                        <td><strong>{inv.id}</strong></td>
                        <td>
                          <strong>{inv.patientName}</strong>
                          <div style={{ fontSize: '11px', color: '#64748b' }}>ID: {inv.patientId}</div>
                        </td>
                        <td>{inv.type}</td>
                        <td>{inv.date}</td>
                        <td><strong>{inv.amount}</strong></td>
                        <td>
                          <span className={`status-badge ${inv.status.toLowerCase()}`}>
                            {inv.status}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            {inv.status === 'Unpaid' && (
                              <button
                                type="button"
                                onClick={() => handleMarkAsPaid(inv.id)}
                                style={{
                                  padding: '4px 8px',
                                  backgroundColor: '#10b981',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                  fontSize: '11px',
                                  fontWeight: '600'
                                }}
                              >
                                Collect Payment
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => alert(`Printing Invoice ${inv.id} Receipt...`)}
                              style={{
                                padding: '4px 8px',
                                border: '1px solid #cbd5e1',
                                background: 'white',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '11px',
                                color: '#475569'
                              }}
                            >
                              Print
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      );
    } else if (role === 'doctor') {
      const activeDoctor = DOCTORS.find(d => d.id === activeDoctorId) || DOCTORS[0];
      const docAppts = appointments.filter(appt => appt.doctorId === activeDoctorId);
      const docRx = prescriptions.filter(rx => rx.doctorName === activeDoctor.name);
      
      return (
        <div className="phase3-console" style={{ marginTop: '30px' }}>
          <h3 style={{ fontSize: '18px', color: '#1e293b' }}>Doctor's Prescriptions & Clinic Revenue Summary</h3>
          <div className="stats-grid" style={{ marginTop: '16px' }}>
            <div className="stat-card" style={{ borderLeft: '4px solid #8b5cf6' }}>
              <h3>Prescriptions Written</h3>
              <div className="stat-value">{docRx.length}</div>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '6px' }}>
                <span style={{ color: '#10b981', fontWeight: '600' }}>{docRx.filter(r => r.status === 'Dispensed & Billed').length}</span> Dispensed | <span style={{ color: '#ef4444', fontWeight: '600' }}>{docRx.filter(r => r.status === 'Pending').length}</span> Pending
              </div>
            </div>
            <div className="stat-card" style={{ borderLeft: '4px solid #ef4444' }}>
              <h3>Clinic Revenue Contribution</h3>
              <div className="stat-value">
                ${(docAppts.filter(a => a.status === 'Completed').length * 150).toFixed(2)}
              </div>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '6px' }}>
                From completed checkup consultation fees
              </div>
            </div>
          </div>
        </div>
      );
    } else if (role === 'laboratory') {
      const deptLabs = labRequests;
      const cleanCost = (c) => parseFloat(c.replace('$', '').trim()) || 0;
      const labRevenue = deptLabs.filter(l => l.status === 'Completed & Billed').reduce((sum, l) => sum + cleanCost(l.cost), 0);
      return (
        <div className="phase3-console" style={{ marginTop: '30px' }}>
          <h3 style={{ fontSize: '18px', color: '#1e293b' }}>Lab Turnaround & Financial Highlights</h3>
          <div className="stats-grid" style={{ marginTop: '16px' }}>
            <div className="stat-card" style={{ borderLeft: '4px solid #10b981' }}>
              <h3>Completed Lab Orders</h3>
              <div className="stat-value">{deptLabs.filter(l => l.status === 'Completed & Billed').length}</div>
            </div>
            <div className="stat-card" style={{ borderLeft: '4px solid #ef4444' }}>
              <h3>Lab Service Billings</h3>
              <div className="stat-value">${labRevenue.toFixed(2)}</div>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '6px' }}>
                Outstanding orders: <span style={{ color: '#ef4444', fontWeight: '600' }}>${deptLabs.filter(l => l.status === 'Pending').reduce((sum, l) => sum + cleanCost(l.cost), 0).toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      );
    } else if (role === 'pharmacist') {
      const deptRx = prescriptions;
      const cleanCost = (c) => parseFloat(c.replace('$', '').trim()) || 0;
      const rxRevenue = deptRx.filter(r => r.status === 'Dispensed & Billed').reduce((sum, r) => sum + cleanCost(r.cost), 0);
      return (
        <div className="phase3-console" style={{ marginTop: '30px' }}>
          <h3 style={{ fontSize: '18px', color: '#1e293b' }}>Pharmacy Inventory & Billing Highlights</h3>
          <div className="stats-grid" style={{ marginTop: '16px' }}>
            <div className="stat-card" style={{ borderLeft: '4px solid #8b5cf6' }}>
              <h3>Dispensed Medications</h3>
              <div className="stat-value">{deptRx.filter(r => r.status === 'Dispensed & Billed').length}</div>
            </div>
            <div className="stat-card" style={{ borderLeft: '4px solid #ef4444' }}>
              <h3>Pharmacy Revenue Collected</h3>
              <div className="stat-value">${rxRevenue.toFixed(2)}</div>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '6px' }}>
                Pending orders value: <span style={{ color: '#ef4444', fontWeight: '600' }}>${deptRx.filter(r => r.status === 'Pending').reduce((sum, r) => sum + cleanCost(r.cost), 0).toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  const renderContent = () => {
    switch (activeView) {
      case 'departments':
        return (
          <div className="module-content">
            <h2>Departments (Module 2)</h2>
            <table className="data-table">
              <thead><tr><th>ID</th><th>Department Name</th><th>Head of Department</th></tr></thead>
              <tbody>
                {DUMMY_DEPARTMENTS.map(d => (
                  <tr key={d.id}><td>{d.id}</td><td>{d.name}</td><td>{d.head}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      case 'doctors':
        return (
          <div className="module-content">
            <h2>Doctors (Module 2)</h2>
            <table className="data-table">
              <thead><tr><th>ID</th><th>Doctor Name</th><th>Department</th><th>Status</th></tr></thead>
              <tbody>
                {DUMMY_DOCTORS.map(d => (
                  <tr key={d.id}><td>{d.id}</td><td>{d.name}</td><td>{d.department}</td>
                    <td><span className={`status-badge ${d.status === 'Available' ? 'available' : d.status === 'On Leave' ? 'leave' : 'surgery'}`}>{d.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      case 'patients':
        if (role === 'doctor') {
          // EHR directory explorer
          const filtered = patients.filter(p => 
            `${p.firstName} ${p.lastName}`.toLowerCase().includes(patientSearch.toLowerCase()) || 
            p.id.toLowerCase().includes(patientSearch.toLowerCase())
          );
          return (
            <div className="module-content">
              <h2>EHR Patient Directory</h2>
              <p>Explore, search, and manage complete clinical Electronic Health Records for all registered patients.</p>

              <div style={{ marginBottom: '20px', display: 'flex', gap: '12px' }}>
                <input 
                  type="text" 
                  placeholder="Search patient by ID or name..."
                  value={patientSearch}
                  onChange={(e) => setPatientSearch(e.target.value)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    width: '320px',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: selectedEhrPatient ? '1fr 1fr' : '1fr', gap: '24px' }}>
                <div>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Patient ID</th>
                        <th>Name</th>
                        <th>Age / DOB</th>
                        <th>Gender</th>
                        <th>Inspect</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map(p => {
                        const age = new Date().getFullYear() - new Date(p.dob).getFullYear();
                        return (
                          <tr key={p.id} style={{ cursor: 'pointer', background: selectedEhrPatient?.id === p.id ? '#f1f5f9' : 'white' }} onClick={() => {
                            setSelectedEhrPatient(p);
                            setNewAllergies(p.allergies || 'None');
                            setNewConditions(p.chronicConditions || 'None');
                            setNewBloodType(p.bloodType || 'O+');
                          }}>
                            <td><strong>{p.id}</strong></td>
                            <td>{p.firstName} {p.lastName}</td>
                            <td>{age} yrs ({p.dob})</td>
                            <td style={{ textTransform: 'capitalize' }}>{p.gender}</td>
                            <td>
                              <button 
                                className="rd-btn-small"
                                style={{ backgroundColor: '#eff6ff', color: '#1d4ed8', border: 'none', borderRadius: '4px', padding: '4px 8px', cursor: 'pointer', fontSize: '12px' }}
                              >
                                View File
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {selectedEhrPatient && (
                  <div className="rd-card" style={{ padding: '24px', backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h3 style={{ margin: 0, fontSize: '18px' }}>EHR - {selectedEhrPatient.firstName} {selectedEhrPatient.lastName}</h3>
                      <button onClick={() => setSelectedEhrPatient(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', color: '#64748b' }}>Close File</button>
                    </div>

                    {/* Metadata editor */}
                    <form onSubmit={handleUpdateEhrMetadata} style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '8px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <label style={{ fontSize: '12px', fontWeight: '600', color: '#475569' }}>Blood Type</label>
                        <select value={newBloodType} onChange={(e) => setNewBloodType(e.target.value)} style={{ padding: '6px', borderRadius: '4px', border: '1px solid #cbd5e1' }}>
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
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <label style={{ fontSize: '12px', fontWeight: '600', color: '#475569' }}>Known Allergies</label>
                        <input type="text" value={newAllergies} onChange={(e) => setNewAllergies(e.target.value)} style={{ padding: '6px', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', gridColumn: 'span 2' }}>
                        <label style={{ fontSize: '12px', fontWeight: '600', color: '#475569' }}>Chronic Conditions</label>
                        <input type="text" value={newConditions} onChange={(e) => setNewConditions(e.target.value)} style={{ padding: '6px', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
                      </div>
                      <button type="submit" style={{ gridColumn: 'span 2', padding: '6px', backgroundColor: '#5c6bc0', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: '600' }}>Update Profile Summary</button>
                    </form>

                    {/* Report adding */}
                    <form onSubmit={handleAddEhrReport} style={{ borderTop: '1px solid #f1f5f9', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <label style={{ fontSize: '13px', fontWeight: '600', color: '#475569' }}>Add Clinical Document / Report</label>
                      <input type="text" placeholder="Report Title (e.g. ECG Analysis, Chest CT)" value={reportTitle} onChange={(e) => setReportTitle(e.target.value)} style={{ padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '13px' }} required />
                      <textarea placeholder="Clinical summary details..." value={reportContent} onChange={(e) => setReportContent(e.target.value)} style={{ padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1', minHeight: '60px', fontFamily: 'inherit', fontSize: '13px' }} />
                      <button type="submit" style={{ padding: '6px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: '600' }}>Save Report</button>
                    </form>

                    {/* History timelines */}
                    <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '16px', flex: 1, overflowY: 'auto', maxHeight: '250px' }}>
                      <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#1e293b' }}>Clinical History Records</h4>
                      {(!selectedEhrPatient.clinicalHistory || selectedEhrPatient.clinicalHistory.length === 0) && (!selectedEhrPatient.reports || selectedEhrPatient.reports.length === 0) ? (
                        <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>No past clinical visit history recorded.</p>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                          {selectedEhrPatient.reports && selectedEhrPatient.reports.map(r => (
                            <div key={r.id} style={{ backgroundColor: '#eff6ff', borderLeft: '3px solid #3b82f6', padding: '8px', borderRadius: '0 4px 4px 0', fontSize: '12px' }}>
                              <div style={{ fontWeight: '700' }}>{r.name} ({r.type})</div>
                              <div style={{ fontSize: '10px', color: '#64748b' }}>Date: {r.date} | Author: {r.author}</div>
                              {r.details?.summary && <div style={{ marginTop: '4px', color: '#1e3a8a' }}>{r.details.summary}</div>}
                            </div>
                          ))}
                          {selectedEhrPatient.clinicalHistory && selectedEhrPatient.clinicalHistory.map((h, i) => (
                            <div key={i} style={{ backgroundColor: '#f8fafc', borderLeft: '3px solid #64748b', padding: '8px', borderRadius: '0 4px 4px 0', fontSize: '12px' }}>
                              <div style={{ fontWeight: '700' }}>Consultation Visit: {h.reason}</div>
                              <div style={{ fontSize: '10px', color: '#64748b' }}>Date: {h.date} | Provider: {h.doctor}</div>
                              <div style={{ marginTop: '4px' }}><strong>Diagnosis:</strong> {h.diagnosis}</div>
                              {h.vitals && (
                                <div style={{ fontSize: '11px', color: '#475569', marginTop: '2px' }}>
                                  Vitals: BP: {h.vitals.bp} | HR: {h.vitals.hr} bpm | Temp: {h.vitals.temp} °F | SpO2: {h.vitals.spo2}%
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        }
        return (
          <div className="module-content">
            <h2>{role === 'doctor' ? 'My Patients' : 'All Patients'} (Module 2)</h2>
            <table className="data-table">
              <thead><tr><th>ID</th><th>Patient Name</th><th>Age</th><th>Gender</th><th>Last Visit</th></tr></thead>
              <tbody>
                {DUMMY_PATIENTS.map(p => (
                  <tr key={p.id}><td>{p.id}</td><td>{p.name}</td><td>{p.age}</td><td>{p.gender}</td><td>{p.lastVisit}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      case 'requests':
        return (
          <div className="module-content">
            <h2>Lab Requests</h2>
            <p>Process pending lab requests and submit diagnostic charges directly to patient billing.</p>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Request ID</th>
                  <th>Patient Details</th>
                  <th>Test Name</th>
                  <th>Requested By</th>
                  <th>Date</th>
                  <th>Cost</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {labRequests.map(req => (
                  <tr key={req.id}>
                    <td><strong>{req.id}</strong></td>
                    <td>
                      <strong>{req.patientName}</strong>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>ID: {req.patientId}</div>
                    </td>
                    <td>{req.testName}</td>
                    <td>{req.doctorName}</td>
                    <td>{req.date}</td>
                    <td><strong>{req.cost}</strong></td>
                    <td>
                      <span className={`status-badge ${req.status === 'Pending' ? 'surgery' : 'available'}`}>
                        {req.status}
                      </span>
                    </td>
                    <td>
                      {req.status === 'Pending' ? (
                        <button 
                          onClick={() => {
                            setSelectedLabForResults(req);
                            setLabResultsText('');
                            setLabRemarks('');
                          }}
                          style={{
                            backgroundColor: '#5c6bc0',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            padding: '6px 12px',
                            cursor: 'pointer',
                            fontWeight: '600',
                            fontSize: '12px'
                          }}
                        >
                          Enter Results & Complete
                        </button>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span className="status-badge available" style={{ fontSize: '11px' }}>Billed</span>
                          {req.results && (
                            <button
                              onClick={() => setViewedLabRequestResults(req)}
                              style={{
                                padding: '4px 8px',
                                border: '1px solid #5c6bc0',
                                color: '#5c6bc0',
                                background: 'white',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '11px',
                                fontWeight: '600'
                              }}
                            >
                              View Report
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      case 'prescriptions':
        if (role === 'doctor') {
          // Prescription tracker for the current doctor
          const currentDoc = DOCTORS.find(d => d.id === activeDoctorId) || DOCTORS[0];
          const doctorRx = prescriptions.filter(rx => rx.doctorName === currentDoc.name);
          return (
            <div className="module-content">
              <h2>Sent Prescriptions</h2>
              <p>Chronological tracker of all prescribed medications dispatched to the pharmacy portal.</p>
              {doctorRx.length === 0 ? (
                <p>No prescriptions ordered yet.</p>
              ) : (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Prescription ID</th>
                      <th>Patient Details</th>
                      <th>Medication</th>
                      <th>Instructions</th>
                      <th>Cost</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {doctorRx.map(rx => (
                      <tr key={rx.id}>
                        <td><strong>{rx.id}</strong></td>
                        <td>{rx.patientName} (ID: {rx.patientId})</td>
                        <td>{rx.medication}</td>
                        <td>{rx.instructions || 'N/A'}</td>
                        <td><strong>{rx.cost}</strong></td>
                        <td>
                          <span className={`status-badge ${rx.status === 'Pending' ? 'surgery' : 'available'}`}>
                            {rx.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          );
        }
        return (
          <div className="module-content">
            <h2>Pharmacy Prescriptions</h2>
            <p>Dispense prescribed medications and submit prescription co-pay charges directly to patient billing.</p>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Prescription ID</th>
                  <th>Patient Details</th>
                  <th>Medication</th>
                  <th>Prescribed By</th>
                  <th>Date</th>
                  <th>Cost</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {prescriptions.map(rx => (
                  <tr key={rx.id}>
                    <td><strong>{rx.id}</strong></td>
                    <td>
                      <strong>{rx.patientName}</strong>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>ID: {rx.patientId}</div>
                    </td>
                    <td>{rx.medication}</td>
                    <td>{rx.doctorName}</td>
                    <td>{rx.date}</td>
                    <td><strong>{rx.cost}</strong></td>
                    <td>
                      <span className={`status-badge ${rx.status === 'Pending' ? 'surgery' : 'available'}`}>
                        {rx.status}
                      </span>
                    </td>
                    <td>
                      {rx.status === 'Pending' ? (
                        <button 
                          onClick={() => handleDispenseRx(rx.id)}
                          style={{
                            backgroundColor: '#10b981',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            padding: '6px 12px',
                            cursor: 'pointer',
                            fontWeight: '600'
                          }}
                        >
                          Dispense & Bill
                        </button>
                      ) : (
                        <span style={{ color: '#64748b', fontSize: '13px' }}>Billed</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      case 'labs':
        if (role === 'doctor') {
          // Lab tracker for current doctor
          const currentDoc = DOCTORS.find(d => d.id === activeDoctorId) || DOCTORS[0];
          const doctorLabs = labRequests.filter(lab => lab.doctorName === currentDoc.name);
          return (
            <div className="module-content">
              <h2>Sent Laboratory Diagnostic Orders</h2>
              <p>Log of diagnostic lab requests dispatched to the laboratory portal.</p>
              {doctorLabs.length === 0 ? (
                <p>No lab orders sent yet.</p>
              ) : (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Order ID</th>
                      <th>Patient Details</th>
                      <th>Test Details</th>
                      <th>Cost</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {doctorLabs.map(lab => (
                      <tr key={lab.id}>
                        <td><strong>{lab.id}</strong></td>
                        <td>{lab.patientName} (ID: {lab.patientId})</td>
                        <td>{lab.testName}</td>
                        <td><strong>{lab.cost}</strong></td>
                        <td>
                          <span className={`status-badge ${lab.status === 'Pending' ? 'surgery' : 'available'}`}>
                            {lab.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          );
        }
        return null;
      case 'appointments':
        if (role === 'doctor') {
          const docAppts = appointments.filter(appt => appt.doctorId === activeDoctorId);
          return (
            <div className="module-content">
              <h2>Consultation Schedule</h2>
              <p>Manage appointments, update consultation status, and prescribe treatment/diagnostics.</p>
              {docAppts.length === 0 ? (
                <div className="upcoming-module-notice">
                  <h4>No Appointments Scheduled</h4>
                  <p>There are no appointments assigned to your profile currently.</p>
                </div>
              ) : (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Time</th>
                      <th>Patient Details</th>
                      <th>Type</th>
                      <th>Reason</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {docAppts.map(appt => (
                      <tr key={appt.id}>
                        <td><strong>{appt.time}</strong></td>
                        <td>
                          <strong>{appt.patientName}</strong>
                          <div style={{ fontSize: '11px', color: '#64748b' }}>ID: {appt.patientId}</div>
                        </td>
                        <td>
                          <span className={`status-badge`} style={{
                            backgroundColor: appt.type === 'Telemedicine' ? '#f5f3ff' : '#f1f5f9',
                            color: appt.type === 'Telemedicine' ? '#7c3aed' : '#475569'
                          }}>
                            {appt.type || 'Physical'}
                          </span>
                        </td>
                        <td>{appt.reason}</td>
                        <td>
                          <span className={`status-badge`} style={{
                            backgroundColor: appt.status === 'Completed' ? '#dcfce7' : appt.status === 'Checked In' ? '#eff6ff' : appt.status === 'In Progress' ? '#fef3c7' : '#f1f5f9',
                            color: appt.status === 'Completed' ? '#15803d' : appt.status === 'Checked In' ? '#1d4ed8' : appt.status === 'In Progress' ? '#b45309' : '#475569'
                          }}>
                            {appt.status}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            {appt.type === 'Telemedicine' && appt.status !== 'Completed' && (
                              <button 
                                onClick={() => {
                                  setActiveCallAppt(appt);
                                  setIsVideoCallActive(true);
                                  setCallChatMessages([
                                    { sender: "patient", text: `Hello Doctor, I'm online for our video consult regarding: "${appt.reason}"`, time: appt.time }
                                  ]);
                                  handleOpenCheckupModal(appt);
                                }}
                                className="rd-btn-small"
                                style={{ backgroundColor: '#7c3aed', color: 'white', border: 'none', borderRadius: '4px', padding: '6px 12px', cursor: 'pointer', fontWeight: '600' }}
                              >
                                Join Telecall
                              </button>
                            )}

                            {appt.type !== 'Telemedicine' && appt.status === 'Checked In' && (
                              <button 
                                onClick={() => handleUpdateApptStatus(appt.id, 'In Progress')}
                                className="rd-btn-small"
                                style={{ backgroundColor: '#e0f2fe', color: '#0369a1', border: 'none', borderRadius: '4px', padding: '6px 12px', cursor: 'pointer', fontWeight: '600' }}
                              >
                                Start Consultation
                              </button>
                            )}
                            {appt.type !== 'Telemedicine' && appt.status === 'In Progress' && (
                              <button 
                                onClick={() => handleOpenCheckupModal(appt)}
                                className="rd-btn-small"
                                style={{ backgroundColor: '#dcfce7', color: '#15803d', border: 'none', borderRadius: '4px', padding: '6px 12px', cursor: 'pointer', fontWeight: '600' }}
                              >
                                Complete Checkup
                              </button>
                            )}
                            {appt.status === 'Completed' && appt.diagnosis && (
                              <div style={{ fontSize: '12px', color: '#166534' }}>
                                <strong>Diagnosis:</strong> {appt.diagnosis}
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          );
        }
        return null;
      case 'records':
        return (
          <div className="module-content">
            <h2>{navItems.find(n => n.id === activeView)?.label}</h2>
            <p>Accessing complete Electronic Health Records explorer for all registered hospital entities.</p>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Patient ID</th>
                  <th>Name</th>
                  <th>Blood Group</th>
                  <th>Known Allergies</th>
                  <th>Chronic Conditions</th>
                </tr>
              </thead>
              <tbody>
                {patients.map(p => (
                  <tr key={p.id}>
                    <td><strong>{p.id}</strong></td>
                    <td><strong>{p.firstName} {p.lastName}</strong></td>
                    <td><span style={{ background: '#fef2f2', color: '#b91c1c', padding: '4px 8px', borderRadius: '4px', fontWeight: 'bold', fontSize: '12px' }}>{p.bloodType || 'O+'}</span></td>
                    <td>{p.allergies || 'None'}</td>
                    <td>{p.chronicConditions || 'None'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      default:
        return (
          <div className="module-content overview">
            <h2>{navItems[0].label}</h2>
            {renderRoleOverview()}
            {renderPhase3Console()}
          </div>
        );
    }
  };

  return (
    <div className="dashboard-container">
      <aside className="sidebar">
        <div className="sidebar-header">
          <h2>DHMS</h2>
        </div>
        <ul className="sidebar-nav">
          {navItems.map(item => (
            <li 
              key={item.id}
              className={activeView === item.id ? 'active' : ''} 
              onClick={() => setActiveView(item.id)}
            >
              {item.label}
            </li>
          ))}
        </ul>
        <div className="sidebar-footer">
          <button className="logout-btn" onClick={onLogout}>Sign Out</button>
        </div>
      </aside>
      <main className="dashboard-main">
        <header className="topbar">
          <div className="topbar-title">Role: <span style={{ textTransform: 'capitalize' }}>{role}</span></div>
          {role === 'doctor' ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '14px', color: '#64748b', fontWeight: '500' }}>Active Profile:</span>
              <select 
                value={activeDoctorId} 
                onChange={(e) => setActiveDoctorId(e.target.value)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  backgroundColor: 'white',
                  fontWeight: '600',
                  color: '#334155',
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                {DOCTORS.map(d => (
                  <option key={d.id} value={d.id}>{d.name} ({d.department})</option>
                ))}
              </select>
            </div>
          ) : (
            <div className="user-profile">Current User</div>
          )}
        </header>
        <div className="content-area">
          {renderContent()}
        </div>
      </main>
      
      {/* Checkup Modal (For Physical/Routine Visits) */}
      {!isVideoCallActive && selectedApptForCheckup && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 9999
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            width: '100%',
            maxWidth: '500px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            overflow: 'hidden',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div style={{
              padding: '20px 24px',
              borderBottom: '1px solid #f1f5f9',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: '#5c6bc0',
              color: 'white'
            }}>
              <h3 style={{ margin: 0, fontSize: '18px' }}>Complete Consultation Checkup</h3>
              <button 
                onClick={() => setSelectedApptForCheckup(null)}
                style={{ background: 'none', border: 'none', color: 'white', fontSize: '20px', cursor: 'pointer' }}
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleCheckupSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px', overflowY: 'auto', flex: 1 }}>
              <div>
                <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>PATIENT</span>
                <div style={{ fontWeight: '700', color: '#1e293b' }}>{selectedApptForCheckup.patientName}</div>
              </div>

              {/* Vitals inputs */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', borderTop: '1px solid #f1f5f9', paddingTop: '10px' }}>
                <span style={{ gridColumn: 'span 2', fontSize: '12px', color: '#64748b', fontWeight: '600' }}>PATIENT VITALS</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '11px', fontWeight: '600', color: '#475569' }}>Blood Pressure (BP)</label>
                  <input type="text" value={vitalBP} onChange={(e) => setVitalBP(e.target.value)} placeholder="120/80 mmHg" style={{ padding: '6px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '12px' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '11px', fontWeight: '600', color: '#475569' }}>Heart Rate (HR)</label>
                  <input type="text" value={vitalHR} onChange={(e) => setVitalHR(e.target.value)} placeholder="72 bpm" style={{ padding: '6px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '12px' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '11px', fontWeight: '600', color: '#475569' }}>Temp (°F)</label>
                  <input type="text" value={vitalTemp} onChange={(e) => setVitalTemp(e.target.value)} placeholder="98.6 °F" style={{ padding: '6px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '12px' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '11px', fontWeight: '600', color: '#475569' }}>Pulse SpO2 (%)</label>
                  <input type="text" value={vitalSpO2} onChange={(e) => setVitalSpO2(e.target.value)} placeholder="98%" style={{ padding: '6px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '12px' }} />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', borderTop: '1px solid #f1f5f9', paddingTop: '10px' }}>
                <label style={{ fontSize: '13px', fontWeight: '600', color: '#475569' }}>Diagnosis Note / Checkup Summary</label>
                <textarea 
                  required
                  placeholder="Enter diagnosis or checkup notes..."
                  value={diagnosisNote}
                  onChange={(e) => setDiagnosisNote(e.target.value)}
                  style={{
                    padding: '8px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    minHeight: '60px',
                    fontFamily: 'inherit',
                    fontSize: '13px',
                    outline: 'none'
                  }}
                />
              </div>

              {/* Detailed medication scheduler */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px solid #f1f5f9', paddingTop: '10px' }}>
                <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>PRESCRIBE MEDICATION (OPTIONAL)</span>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '8px' }}>
                  <input type="text" placeholder="Drug Name (e.g. Lipitor)" value={rxDrugName} onChange={(e) => setRxDrugName(e.target.value)} style={{ padding: '6px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '12px' }} />
                  <input type="text" placeholder="Dose (500mg)" value={rxDose} onChange={(e) => setRxDose(e.target.value)} style={{ padding: '6px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '12px' }} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                  <select value={rxFrequency} onChange={(e) => setRxFrequency(e.target.value)} style={{ padding: '6px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '12px' }}>
                    <option value="Once Daily (QD)">Once Daily (QD)</option>
                    <option value="Twice Daily (BID)">Twice Daily (BID)</option>
                    <option value="Three Times Daily (TID)">Three Times Daily (TID)</option>
                    <option value="Four Times Daily (QID)">Four Times Daily (QID)</option>
                    <option value="As Needed (PRN)">As Needed (PRN)</option>
                  </select>
                  <input type="text" placeholder="Duration (e.g. 7 Days)" value={rxDuration} onChange={(e) => setRxDuration(e.target.value)} style={{ padding: '6px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '12px' }} />
                  <input type="number" step="0.01" placeholder="Cost ($)" value={rxCost} onChange={(e) => setRxCost(e.target.value)} style={{ padding: '6px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '12px' }} />
                </div>
                <input type="text" placeholder="Instructions (e.g. Take with food)" value={rxInstructions} onChange={(e) => setRxInstructions(e.target.value)} style={{ padding: '6px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '12px' }} />
              </div>

              {/* Lab priorities */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px solid #f1f5f9', paddingTop: '10px' }}>
                <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>ORDER DIAGNOSTIC LAB TEST (OPTIONAL)</span>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '8px' }}>
                  <input type="text" placeholder="Test Name (e.g. Lipid Panel)" value={labTestName} onChange={(e) => setLabTestName(e.target.value)} style={{ padding: '6px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '12px' }} />
                  <select value={labPriority} onChange={(e) => setLabPriority(e.target.value)} style={{ padding: '6px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '12px' }}>
                    <option value="Routine">Routine</option>
                    <option value="STAT / Urgent">STAT / Urgent</option>
                  </select>
                  <input type="number" step="0.01" placeholder="Cost ($)" value={labCost} onChange={(e) => setLabCost(e.target.value)} style={{ padding: '6px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '12px' }} />
                </div>
              </div>

              {/* Inpatient Admission Options */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px solid #f1f5f9', paddingTop: '10px' }}>
                <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>INPATIENT ADMISSION (OPTIONAL)</span>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer' }}>
                  <input type="checkbox" checked={isAdmitted} onChange={(e) => setIsAdmitted(e.target.checked)} />
                  Admit Patient to Hospital
                </label>
                {isAdmitted && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      <select value={admissionWard} onChange={(e) => setAdmissionWard(e.target.value)} style={{ padding: '6px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '12px' }}>
                        <option value="General Ward A">General Ward A</option>
                        <option value="General Ward B">General Ward B</option>
                        <option value="ICU">Intensive Care Unit (ICU)</option>
                        <option value="Cardiac Wing">Cardiac Wing</option>
                        <option value="Pediatric Care">Pediatric Care</option>
                      </select>
                      <input type="text" placeholder="Admission Notes / Reason" value={admissionNotes} onChange={(e) => setAdmissionNotes(e.target.value)} style={{ padding: '6px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '12px' }} />
                    </div>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px', borderTop: '1px solid #f1f5f9', paddingTop: '12px' }}>
                <button 
                  type="button"
                  onClick={() => setSelectedApptForCheckup(null)}
                  style={{ padding: '8px 16px', border: '1px solid #cbd5e1', borderRadius: '6px', background: 'white', cursor: 'pointer', fontWeight: '600' }}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  style={{ padding: '8px 16px', border: 'none', borderRadius: '6px', background: '#5c6bc0', color: 'white', cursor: 'pointer', fontWeight: '600' }}
                >
                  Save & Complete
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* High-Fidelity Telemedicine consultation room */}
      {isVideoCallActive && activeCallAppt && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: '#0f172a',
          zIndex: 10000,
          display: 'flex'
        }}>
          {/* 1. Left Column: Mock Video Stream Viewport */}
          <div style={{
            flex: 1.5,
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            background: '#1e293b',
            borderRight: '1px solid #334155'
          }}>
            {/* Remote Patient Video Feed */}
            <div style={{ textAlign: 'center', color: 'white' }}>
              <div style={{
                width: '120px',
                height: '120px',
                borderRadius: '50%',
                background: '#475569',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
                boxShadow: '0 0 20px rgba(92, 107, 192, 0.4)'
              }}>
                <svg style={{ width: '60px', height: '60px', color: '#cbd5e1' }} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h2 style={{ margin: '0 0 4px' }}>{activeCallAppt.patientName}</h2>
              <p style={{ margin: 0, color: '#94a3b8', fontSize: '14px' }}>Patient Connection Status: <span style={{ color: '#10b981', fontWeight: 'bold' }}>Live Stream</span></p>
            </div>

            {/* Doctor's Local Feed (Floating PIP) */}
            <div style={{
              position: 'absolute',
              bottom: '80px',
              right: '24px',
              width: '120px',
              height: '90px',
              borderRadius: '8px',
              border: '2px solid #5c6bc0',
              overflow: 'hidden',
              background: '#334155',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              boxShadow: '0 4px 6px rgba(0,0,0,0.3)'
            }}>
              <span style={{ fontSize: '10px', color: '#cbd5e1', fontWeight: 'bold' }}>Your Feed</span>
              <span style={{ fontSize: '11px', color: '#a5b4fc', textAlign: 'center', padding: '0 4px' }}>
                {DOCTORS.find(d => d.id === activeDoctorId)?.name || 'Doctor'}
              </span>
            </div>

            {/* Call Toolbar Controls */}
            <div style={{
              position: 'absolute',
              bottom: '20px',
              display: 'flex',
              gap: '16px'
            }}>
              <button style={{ width: '44px', height: '44px', borderRadius: '50%', background: '#334155', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg style={{ width: '20px', height: '20px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
              </button>
              <button style={{ width: '44px', height: '44px', borderRadius: '50%', background: '#334155', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg style={{ width: '20px', height: '20px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
              </button>
              <button 
                onClick={() => {
                  setIsVideoCallActive(false);
                  setActiveCallAppt(null);
                }} 
                style={{ width: '44px', height: '44px', borderRadius: '50%', background: '#ef4444', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                title="End Consultation Call"
              >
                <svg style={{ width: '20px', height: '20px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 8l2 2m0 0l2 2m-2-2l-2-2m2 2l2-2M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5z" /></svg>
              </button>
            </div>
          </div>

          {/* 2. Middle Column: Live Clinical documentation EMR form */}
          <div style={{
            flex: 1.2,
            background: 'white',
            padding: '24px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            <h3 style={{ margin: 0, borderBottom: '2px solid #5c6bc0', paddingBottom: '8px', color: '#1e293b' }}>Clinical EMR Documentation</h3>
            <form onSubmit={handleCheckupSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              
              {/* Vitals Form */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <span style={{ gridColumn: 'span 2', fontSize: '12px', fontWeight: 'bold', color: '#64748b' }}>Log Consultation Vitals</span>
                <input type="text" value={vitalBP} onChange={(e) => setVitalBP(e.target.value)} placeholder="BP (e.g. 120/80)" style={{ padding: '6px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '12px' }} />
                <input type="text" value={vitalHR} onChange={(e) => setVitalHR(e.target.value)} placeholder="HR (bpm)" style={{ padding: '6px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '12px' }} />
                <input type="text" value={vitalTemp} onChange={(e) => setVitalTemp(e.target.value)} placeholder="Temp (°F)" style={{ padding: '6px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '12px' }} />
                <input type="text" value={vitalSpO2} onChange={(e) => setVitalSpO2(e.target.value)} placeholder="SpO2 (%)" style={{ padding: '6px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '12px' }} />
              </div>

              {/* Diagnosis note */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569' }}>Diagnosis Note</label>
                <textarea 
                  required 
                  value={diagnosisNote} 
                  onChange={(e) => setDiagnosisNote(e.target.value)} 
                  placeholder="Enter checkup findings during the video consult..." 
                  style={{ padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1', minHeight: '60px', fontFamily: 'inherit', fontSize: '13px' }} 
                />
              </div>

              {/* Prescribe meds */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px solid #f1f5f9', paddingTop: '10px' }}>
                <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b' }}>Medication Prescriber</span>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '6px' }}>
                  <input type="text" placeholder="Drug Name" value={rxDrugName} onChange={(e) => setRxDrugName(e.target.value)} style={{ padding: '6px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '12px' }} />
                  <input type="text" placeholder="Dose (e.g. 10mg)" value={rxDose} onChange={(e) => setRxDose(e.target.value)} style={{ padding: '6px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '12px' }} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px' }}>
                  <select value={rxFrequency} onChange={(e) => setRxFrequency(e.target.value)} style={{ padding: '6px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '11px' }}>
                    <option value="Once Daily (QD)">Once Daily (QD)</option>
                    <option value="Twice Daily (BID)">Twice Daily (BID)</option>
                    <option value="Three Times Daily (TID)">Three Times Daily (TID)</option>
                    <option value="As Needed (PRN)">As Needed (PRN)</option>
                  </select>
                  <input type="text" placeholder="7 Days" value={rxDuration} onChange={(e) => setRxDuration(e.target.value)} style={{ padding: '6px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '12px' }} />
                  <input type="number" step="0.01" placeholder="Cost ($)" value={rxCost} onChange={(e) => setRxCost(e.target.value)} style={{ padding: '6px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '12px' }} />
                </div>
              </div>

              {/* Lab test */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', borderTop: '1px solid #f1f5f9', paddingTop: '10px' }}>
                <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b' }}>Laboratory Diagnostic Request</span>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '6px' }}>
                  <input type="text" placeholder="Test Name" value={labTestName} onChange={(e) => setLabTestName(e.target.value)} style={{ padding: '6px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '12px' }} />
                  <select value={labPriority} onChange={(e) => setLabPriority(e.target.value)} style={{ padding: '6px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '11px' }}>
                    <option value="Routine">Routine</option>
                    <option value="STAT / Urgent">STAT / Urgent</option>
                  </select>
                  <input type="number" step="0.01" placeholder="Cost" value={labCost} onChange={(e) => setLabCost(e.target.value)} style={{ padding: '6px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '12px' }} />
                </div>
              </div>

              <button type="submit" style={{ padding: '10px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px', marginTop: '10px' }}>
                Complete consultation & Bill
              </button>
            </form>
          </div>

          {/* 3. Right Column: Call Chat panel */}
          <div style={{
            width: '300px',
            background: '#f8fafc',
            borderLeft: '1px solid #cbd5e1',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div style={{ padding: '16px', borderBottom: '1px solid #e2e8f0', background: 'white' }}>
              <h4 style={{ margin: 0, color: '#334155' }}>Consultation Chat</h4>
            </div>
            
            {/* Scrollable messages container */}
            <div style={{ flex: 1, padding: '16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {callChatMessages.map((msg, idx) => (
                <div key={idx} style={{ alignSelf: msg.sender === 'doctor' ? 'flex-end' : 'flex-start', maxWidth: '85%' }}>
                  <div style={{
                    padding: '8px 12px',
                    borderRadius: '8px',
                    background: msg.sender === 'doctor' ? '#5c6bc0' : '#e2e8f0',
                    color: msg.sender === 'doctor' ? 'white' : '#1e293b',
                    fontSize: '12px'
                  }}>
                    {msg.text}
                  </div>
                  <div style={{ fontSize: '9px', color: '#64748b', textAlign: msg.sender === 'doctor' ? 'right' : 'left', marginTop: '2px' }}>{msg.time}</div>
                </div>
              ))}
            </div>

            {/* Chat message input form */}
            <form onSubmit={handleSendCallMessage} style={{ padding: '12px', borderTop: '1px solid #e2e8f0', background: 'white', display: 'flex', gap: '6px' }}>
              <input 
                type="text" 
                placeholder="Type a message..." 
                value={newCallMessage}
                onChange={(e) => setNewCallMessage(e.target.value)}
                style={{ flex: 1, padding: '6px 12px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '12px', outline: 'none' }}
              />
              <button type="submit" style={{ padding: '6px 12px', background: '#5c6bc0', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}>Send</button>
            </form>
          </div>
        </div>
      )}

      {/* Admin Patient EHR Inspection Modal */}
      {selectedAdminPatientEhr && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 9999
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            width: '100%',
            maxWidth: '600px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            overflow: 'hidden',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div style={{
              padding: '20px 24px',
              borderBottom: '1px solid #f1f5f9',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: '#1e3a8a',
              color: 'white'
            }}>
              <h3 style={{ margin: 0, fontSize: '18px' }}>EHR Clinical Folder - {selectedAdminPatientEhr.firstName} {selectedAdminPatientEhr.lastName}</h3>
              <button 
                onClick={() => setSelectedAdminPatientEhr(null)}
                style={{ background: 'none', border: 'none', color: 'white', fontSize: '20px', cursor: 'pointer' }}
              >
                &times;
              </button>
            </div>
            
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto', flex: 1 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', backgroundColor: '#f8fafc', padding: '16px', borderRadius: '8px' }}>
                <div><strong>Patient ID:</strong> <p style={{ margin: '4px 0 0 0', color: '#1e3a8a', fontWeight: 'bold' }}>{selectedAdminPatientEhr.id}</p></div>
                <div><strong>Date of Birth / DOB:</strong> <p style={{ margin: '4px 0 0 0', color: '#475569' }}>{selectedAdminPatientEhr.dob}</p></div>
                <div><strong>Gender:</strong> <p style={{ margin: '4px 0 0 0', color: '#475569', textTransform: 'capitalize' }}>{selectedAdminPatientEhr.gender}</p></div>
                <div><strong>Blood Type:</strong> <p style={{ margin: '4px 0 0 0', color: '#b91c1c', fontWeight: 'bold' }}>{selectedAdminPatientEhr.bloodType || 'O+'}</p></div>
                <div style={{ gridColumn: 'span 2' }}><strong>Known Allergies:</strong> <p style={{ margin: '4px 0 0 0', color: '#b45309', fontWeight: '600' }}>{selectedAdminPatientEhr.allergies || 'None'}</p></div>
                <div style={{ gridColumn: 'span 2' }}><strong>Chronic Conditions:</strong> <p style={{ margin: '4px 0 0 0', color: '#1e40af', fontWeight: '600' }}>{selectedAdminPatientEhr.chronicConditions || 'None'}</p></div>
              </div>

              <div>
                <h4 style={{ margin: '0 0 10px 0', borderBottom: '1px solid #e2e8f0', paddingBottom: '6px', fontSize: '14px', color: '#334155' }}>Clinical Consultation & Visit History</h4>
                {(!selectedAdminPatientEhr.clinicalHistory || selectedAdminPatientEhr.clinicalHistory.length === 0) ? (
                  <p style={{ fontSize: '13px', color: '#64748b', margin: 0, fontStyle: 'italic' }}>No clinical history records found for this patient.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {selectedAdminPatientEhr.clinicalHistory.map((h, i) => (
                      <div key={i} style={{ backgroundColor: '#f1f5f9', borderLeft: '4px solid #475569', padding: '10px', borderRadius: '0 6px 6px 0', fontSize: '13px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '700', color: '#1e293b' }}>
                          <span>Visit Reason: {h.reason}</span>
                          <span style={{ fontSize: '11px', color: '#64748b' }}>{h.date}</span>
                        </div>
                        <div style={{ fontSize: '11px', color: '#475569', margin: '4px 0' }}>Consulted by: <strong>{h.doctor}</strong></div>
                        <div style={{ background: 'white', padding: '6px 8px', borderRadius: '4px', border: '1px solid #e2e8f0', marginTop: '6px' }}>
                          <strong>Diagnosis:</strong> {h.diagnosis}
                        </div>
                        {h.vitals && (
                          <div style={{ display: 'flex', gap: '12px', fontSize: '11px', color: '#475569', marginTop: '6px' }}>
                            <span>BP: <strong>{h.vitals.bp}</strong></span>
                            <span>HR: <strong>{h.vitals.hr} bpm</strong></span>
                            <span>Temp: <strong>{h.vitals.temp} °F</strong></span>
                            <span>SpO2: <strong>{h.vitals.spo2}%</strong></span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div style={{ padding: '16px 24px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'flex-end', backgroundColor: '#f8fafc' }}>
              <button 
                type="button"
                onClick={() => setSelectedAdminPatientEhr(null)}
                style={{ padding: '8px 16px', background: '#334155', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '13px' }}
              >
                Close Folder
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lab Results Submission Modal */}
      {selectedLabForResults && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 9999
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            width: '100%',
            maxWidth: '500px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            overflow: 'hidden',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div style={{
              padding: '20px 24px',
              borderBottom: '1px solid #f1f5f9',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: '#3f51b5',
              color: 'white'
            }}>
              <h3 style={{ margin: 0, fontSize: '18px' }}>Lab Report Entry - {selectedLabForResults.testName}</h3>
              <button 
                onClick={() => setSelectedLabForResults(null)}
                style={{ background: 'none', border: 'none', color: 'white', fontSize: '20px', cursor: 'pointer' }}
              >
                &times;
              </button>
            </div>
            
            <form onSubmit={handleCompleteLabWithResults} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
              <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto', flex: 1 }}>
                <div style={{ backgroundColor: '#f8fafc', padding: '12px', borderRadius: '6px', fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div><strong>Patient:</strong> {selectedLabForResults.patientName} (ID: {selectedLabForResults.patientId})</div>
                  <div><strong>Ordered By:</strong> {selectedLabForResults.doctorName}</div>
                  <div><strong>Cost:</strong> {selectedLabForResults.cost}</div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '13px', fontWeight: '600', color: '#475569' }}>Diagnostic Results / Key Findings</label>
                  <textarea 
                    placeholder="Enter test results details (e.g. Cholesterol: 215 mg/dL, HDL: 45 mg/dL, LDL: 142 mg/dL...)"
                    value={labResultsText}
                    onChange={(e) => setLabResultsText(e.target.value)}
                    style={{ padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1', minHeight: '100px', fontSize: '13px', fontFamily: 'inherit' }}
                    required
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '13px', fontWeight: '600', color: '#475569' }}>Technician Remarks / Recommendations</label>
                  <textarea 
                    placeholder="Any specific observations or general remarks..."
                    value={labRemarks}
                    onChange={(e) => setLabRemarks(e.target.value)}
                    style={{ padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1', minHeight: '60px', fontSize: '13px', fontFamily: 'inherit' }}
                  />
                </div>
              </div>

              <div style={{ padding: '16px 24px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'end', gap: '12px', backgroundColor: '#f8fafc' }}>
                <button 
                  type="button"
                  onClick={() => setSelectedLabForResults(null)}
                  style={{ padding: '8px 16px', background: '#e2e8f0', color: '#475569', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '13px' }}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  style={{ padding: '8px 16px', background: '#3f51b5', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '13px' }}
                >
                  Complete & Save to EHR
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lab Results View Modal */}
      {viewedLabRequestResults && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 9999
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            width: '100%',
            maxWidth: '500px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            overflow: 'hidden',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div style={{
              padding: '20px 24px',
              borderBottom: '1px solid #f1f5f9',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: '#5c6bc0',
              color: 'white'
            }}>
              <h3 style={{ margin: 0, fontSize: '18px' }}>Lab Report Summary - {viewedLabRequestResults.testName}</h3>
              <button 
                onClick={() => setViewedLabRequestResults(null)}
                style={{ background: 'none', border: 'none', color: 'white', fontSize: '20px', cursor: 'pointer' }}
              >
                &times;
              </button>
            </div>
            
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto', flex: 1 }}>
              <div style={{ backgroundColor: '#f8fafc', padding: '12px', borderRadius: '6px', fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div><strong>Patient:</strong> {viewedLabRequestResults.patientName} (ID: {viewedLabRequestResults.patientId})</div>
                <div><strong>Ordered By:</strong> {viewedLabRequestResults.doctorName}</div>
                <div><strong>Date Completed:</strong> {viewedLabRequestResults.completedDate || viewedLabRequestResults.date}</div>
              </div>

              <div>
                <h4 style={{ margin: '0 0 6px 0', fontSize: '13px', color: '#475569' }}>Diagnostic Findings:</h4>
                <div style={{ background: '#f1f5f9', padding: '12px', borderRadius: '6px', fontSize: '13px', whiteSpace: 'pre-wrap', color: '#1e293b', borderLeft: '4px solid #5c6bc0' }}>
                  {viewedLabRequestResults.results}
                </div>
              </div>

              {viewedLabRequestResults.remarks && (
                <div>
                  <h4 style={{ margin: '0 0 6px 0', fontSize: '13px', color: '#475569' }}>Technician Remarks:</h4>
                  <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '6px', fontSize: '13px', whiteSpace: 'pre-wrap', color: '#475569', fontStyle: 'italic' }}>
                    {viewedLabRequestResults.remarks}
                  </div>
                </div>
              )}
            </div>

            <div style={{ padding: '16px 24px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'end', backgroundColor: '#f8fafc' }}>
              <button 
                onClick={() => setViewedLabRequestResults(null)}
                style={{ padding: '8px 16px', background: '#334155', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '13px' }}
              >
                Close Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
