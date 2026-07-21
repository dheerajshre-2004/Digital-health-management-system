import React, { useState } from 'react';
import './Dashboard.css';

const DUMMY_DEPARTMENTS = [
  { id: 1, name: 'Cardiology', head: 'Dr. Gregory House', code: 'CARD' },
  { id: 2, name: 'Neurology', head: 'Dr. John Adams', code: 'NEUR' },
  { id: 3, name: 'Pediatrics', head: 'Dr. Emily Johnson', code: 'PEDS' },
  { id: 4, name: 'Orthopedics', head: 'Dr. Michael Williams', code: 'ORTH' },
  { id: 5, name: 'Primary Care', head: 'Dr. John Watson', code: 'PRIM' },
  { id: 6, name: 'General Surgery', head: 'Dr. Meredith Grey', code: 'SURG' }
];

const DOCTORS = [
  { id: 'dr_watson', name: 'Dr. John Watson', department: 'Primary Care' },
  { id: 'dr_house', name: 'Dr. Gregory House', department: 'Cardiology' },
  { id: 'dr_grey', name: 'Dr. Meredith Grey', department: 'General Surgery' }
];

export default function Dashboard({ onLogout, role }) {
  const [activeView, setActiveView] = useState('overview');

  // Admin Module States & Controls
  const [adminSearch, setAdminSearch] = useState('');
  const [adminStatusFilter, setAdminStatusFilter] = useState('All');
  const [adminPharmacySubTab, setAdminPharmacySubTab] = useState('medications');

  // Attendance Tracker States
  const [adminAttendanceDate, setAdminAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [adminAttendanceModuleFilter, setAdminAttendanceModuleFilter] = useState('All');
  const [adminAttendanceStatusFilter, setAdminAttendanceStatusFilter] = useState('All');

  const [docAttendanceForm, setDocAttendanceForm] = useState({
    date: new Date().toISOString().split('T')[0],
    status: 'Present',
    checkIn: '08:30 AM',
    checkOut: '05:00 PM',
    remarks: 'Morning Clinical Rounds & OPD'
  });

  const handleDoctorLogAttendance = (e) => {
    e.preventDefault();
    const activeDocObj = DOCTORS.find(d => d.id === activeDoctorId) || DOCTORS[0];
    const allAtt = JSON.parse(localStorage.getItem('dhms_master_attendance') || '[]');
    const newRecord = {
      id: `ATT-${Math.floor(1000 + Math.random() * 9000)}`,
      date: docAttendanceForm.date,
      module: 'Doctor',
      staffId: activeDocObj.id,
      staffName: activeDocObj.name,
      role: activeDocObj.department + ' Physician',
      checkIn: docAttendanceForm.status === 'Absent' || docAttendanceForm.status === 'On Leave' ? '-' : docAttendanceForm.checkIn,
      checkOut: docAttendanceForm.status === 'Absent' || docAttendanceForm.status === 'On Leave' ? '-' : docAttendanceForm.checkOut,
      status: docAttendanceForm.status,
      remarks: docAttendanceForm.remarks || 'Clinical Duty'
    };

    const idx = allAtt.findIndex(a => a.date === newRecord.date && a.staffId === newRecord.staffId);
    let updated;
    if (idx >= 0) {
      updated = [...allAtt];
      updated[idx] = newRecord;
    } else {
      updated = [newRecord, ...allAtt];
    }

    localStorage.setItem('dhms_master_attendance', JSON.stringify(updated));
    alert(`Shift attendance logged successfully for ${activeDocObj.name} (${docAttendanceForm.status}).`);
  };

  const handleAdminUpdateMasterAttendance = (attId, newStatus) => {
    const allAtt = JSON.parse(localStorage.getItem('dhms_master_attendance') || '[]');
    const updated = allAtt.map(a => a.id === attId ? { ...a, status: newStatus } : a);
    localStorage.setItem('dhms_master_attendance', JSON.stringify(updated));
  };

  const [departmentsList, setDepartmentsList] = useState(() => {
    const saved = localStorage.getItem('dhms_departments');
    if (saved) return JSON.parse(saved);
    localStorage.setItem('dhms_departments', JSON.stringify(DUMMY_DEPARTMENTS));
    return DUMMY_DEPARTMENTS;
  });

  const [doctorsRoster, setDoctorsRoster] = useState(() => {
    const saved = localStorage.getItem('dhms_doctors');
    if (saved) return JSON.parse(saved);
    const defaults = [
      { id: 'dr_watson', name: 'Dr. John Watson', department: 'Primary Care', status: 'Available', email: 'watson@dhms.org', phone: '+1 (555) 019-2001' },
      { id: 'dr_house', name: 'Dr. Gregory House', department: 'Cardiology', status: 'Available', email: 'house@dhms.org', phone: '+1 (555) 019-2002' },
      { id: 'dr_grey', name: 'Dr. Meredith Grey', department: 'General Surgery', status: 'In Surgery', email: 'grey@dhms.org', phone: '+1 (555) 019-2003' },
      { id: 'dr_adams', name: 'Dr. John Adams', department: 'Neurology', status: 'On Leave', email: 'adams@dhms.org', phone: '+1 (555) 019-2004' },
      { id: 'dr_johnson', name: 'Dr. Emily Johnson', department: 'Pediatrics', status: 'Available', email: 'johnson@dhms.org', phone: '+1 (555) 019-2005' },
      { id: 'dr_williams', name: 'Dr. Michael Williams', department: 'Orthopedics', status: 'In Surgery', email: 'williams@dhms.org', phone: '+1 (555) 019-2006' }
    ];
    localStorage.setItem('dhms_doctors', JSON.stringify(defaults));
    return defaults;
  });

  // Modals state for Admin
  const [showAddDeptModal, setShowAddDeptModal] = useState(false);
  const [newDeptName, setNewDeptName] = useState('');
  const [newDeptHead, setNewDeptHead] = useState('');
  const [newDeptCode, setNewDeptCode] = useState('');

  const [showAddDoctorModal, setShowAddDoctorModal] = useState(false);
  const [newDocName, setNewDocName] = useState('');
  const [newDocDept, setNewDocDept] = useState('Primary Care');
  const [newDocStatus, setNewDocStatus] = useState('Available');
  const [newDocEmail, setNewDocEmail] = useState('');
  const [newDocPhone, setNewDocPhone] = useState('');

  const [showAdminBookingModal, setShowAdminBookingModal] = useState(false);
  const [adminBookPatient, setAdminBookPatient] = useState('');
  const [adminBookDoctor, setAdminBookDoctor] = useState('dr_watson');
  const [adminBookDept, setAdminBookDept] = useState('Primary Care');
  const [adminBookDate, setAdminBookDate] = useState(new Date().toISOString().split('T')[0]);
  const [adminBookTime, setAdminBookTime] = useState('10:00 AM');
  const [adminBookReason, setAdminBookReason] = useState('Routine Checkup');
  const [adminBookType, setAdminBookType] = useState('Physical');

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
          status: 'Advised',
          date: todayStr
        }] : [],
        pharmacyBillPaid: false
      };
      const finalAdms = [newAdm, ...adms];
      localStorage.setItem('dhms_admissions', JSON.stringify(finalAdms));
    }

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

  const handleCompleteLabWithResults = (e) => {
    e.preventDefault();
    if (!selectedLabForResults) return;

    const todayStr = new Date().toISOString().split('T')[0];

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

    setSelectedLabForResults(null);
    setLabResultsText('');
    setLabRemarks('');
    alert('Lab diagnostic report completed, saved to EHR, and billed successfully.');
  };

  // Admin Module Action Handlers
  const handleAddDepartment = (e) => {
    e.preventDefault();
    if (!newDeptName.trim()) return;
    const newDept = {
      id: departmentsList.length + 1,
      name: newDeptName.trim(),
      head: newDeptHead.trim() || 'TBD',
      code: newDeptCode.trim().toUpperCase() || 'DEPT'
    };
    const updated = [...departmentsList, newDept];
    setDepartmentsList(updated);
    localStorage.setItem('dhms_departments', JSON.stringify(updated));
    setNewDeptName('');
    setNewDeptHead('');
    setNewDeptCode('');
    setShowAddDeptModal(false);
    alert(`Department "${newDept.name}" created successfully.`);
  };

  const handleAddDoctor = (e) => {
    e.preventDefault();
    if (!newDocName.trim()) return;
    const idStr = `dr_${newDocName.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${Math.floor(100 + Math.random() * 900)}`;
    const newDoc = {
      id: idStr,
      name: newDocName.startsWith('Dr.') ? newDocName : `Dr. ${newDocName}`,
      department: newDocDept,
      status: newDocStatus,
      email: newDocEmail || `${newDocName.toLowerCase().replace(/\s+/g, '')}@dhms.org`,
      phone: newDocPhone || '+1 (555) 000-0000'
    };
    const updated = [...doctorsRoster, newDoc];
    setDoctorsRoster(updated);
    localStorage.setItem('dhms_doctors', JSON.stringify(updated));
    setNewDocName('');
    setNewDocEmail('');
    setNewDocPhone('');
    setShowAddDoctorModal(false);
    alert(`${newDoc.name} added to hospital doctors roster.`);
  };

  const handleToggleDoctorStatus = (docId, newStatus) => {
    const updated = doctorsRoster.map(d => d.id === docId ? { ...d, status: newStatus } : d);
    setDoctorsRoster(updated);
    localStorage.setItem('dhms_doctors', JSON.stringify(updated));
  };

  const handleAdminCreateAppointment = (e) => {
    e.preventDefault();
    if (!adminBookPatient.trim()) return;
    const selectedDocObj = doctorsRoster.find(d => d.id === adminBookDoctor) || doctorsRoster[0] || DOCTORS[0];
    const newAppt = {
      id: `APT-${Math.floor(1000 + Math.random() * 9000)}`,
      patientId: `PT-${Math.floor(10000 + Math.random() * 90000)}`,
      patientName: adminBookPatient.trim(),
      doctorId: selectedDocObj.id,
      doctorName: selectedDocObj.name,
      department: adminBookDept,
      date: adminBookDate,
      time: adminBookTime,
      reason: adminBookReason,
      status: 'Upcoming',
      type: adminBookType,
      source: 'Admin Office'
    };
    const updated = [newAppt, ...appointments];
    setAppointments(updated);
    localStorage.setItem('dhms_appointments', JSON.stringify(updated));
    setAdminBookPatient('');
    setShowAdminBookingModal(false);
    alert(`Appointment ${newAppt.id} booked successfully for ${newAppt.patientName}.`);
  };

  const handleAdminMarkPaid = (invoiceId) => {
    const updated = billingList.map(inv => {
      if (inv.id === invoiceId) {
        return { ...inv, status: 'Paid' };
      }
      return inv;
    });
    setBillingList(updated);
    localStorage.setItem('dhms_billing', JSON.stringify(updated));
    alert(`Invoice ${invoiceId} status marked as Paid.`);
  };

  const getNavItems = () => {
    switch (role) {
      case 'admin':
        return [
          { id: 'overview', label: 'Operations Overview' },
          { id: 'departments', label: 'Departments & Staff' },
          { id: 'doctors', label: 'Doctors Roster' },
          { id: 'receptionist', label: 'Receptionist Desk' },
          { id: 'laboratory', label: 'Laboratory Desk' },
          { id: 'pharmacy', label: 'Pharmacy & Stock' },
          { id: 'billing', label: 'Financials & Billing' },
          { id: 'attendance', label: 'Attendance & Absentees' }
        ];
      case 'doctor':
        return [
          { id: 'overview', label: 'My Dashboard' },
          { id: 'patients', label: 'Patient EHR Records' },
          { id: 'appointments', label: 'Appointments' },
          { id: 'prescriptions', label: 'Prescription History' },
          { id: 'labs', label: 'Lab Orders History' },
          { id: 'attendance', label: 'My Shift Attendance' }
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
      const cleanAmount = (amtStr) => parseFloat((amtStr || '').replace('$', '').trim()) || 0;
      const totalRev = billingList.filter(i => i.status === 'Paid').reduce((sum, i) => sum + cleanAmount(i.amount), 0);
      const meds = JSON.parse(localStorage.getItem('dhms_medications') || '[]');
      const lowStockCount = meds.filter(m => m.stock <= (m.lowStockThreshold || 15)).length;

      return (
        <>
          <p style={{ color: '#475569', fontSize: '15px' }}>
            Welcome <strong>Administrator</strong>. Executive Operations Console connecting hospital departments, doctors roster, receptionist desk, laboratory orders, pharmacy inventory, and billing ledger.
          </p>
          
          <div className="stats-grid" style={{ marginTop: '20px' }}>
            <div className="stat-card" style={{ borderLeft: '4px solid #3b82f6', cursor: 'pointer' }} onClick={() => setActiveView('departments')}>
              <h3>Departments</h3>
              <div className="stat-value">{departmentsList.length}</div>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>Active Hospital Wings</div>
            </div>

            <div className="stat-card" style={{ borderLeft: '4px solid #10b981', cursor: 'pointer' }} onClick={() => setActiveView('doctors')}>
              <h3>Available Doctors</h3>
              <div className="stat-value">{doctorsRoster.filter(d => d.status === 'Available').length} / {doctorsRoster.length}</div>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>On Active Duty</div>
            </div>

            <div className="stat-card" style={{ borderLeft: '4px solid #f59e0b', cursor: 'pointer' }} onClick={() => setActiveView('receptionist')}>
              <h3>Appointments Desk</h3>
              <div className="stat-value">{appointments.length}</div>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                <span style={{ color: '#10b981', fontWeight: '600' }}>{appointments.filter(a => a.status === 'Completed').length}</span> Completed
              </div>
            </div>

            <div className="stat-card" style={{ borderLeft: '4px solid #6366f1', cursor: 'pointer' }} onClick={() => setActiveView('laboratory')}>
              <h3>Diagnostic Lab Orders</h3>
              <div className="stat-value">{labRequests.length}</div>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                <span style={{ color: '#ef4444', fontWeight: '600' }}>{labRequests.filter(l => l.status === 'Pending').length}</span> Pending Tests
              </div>
            </div>

            <div className="stat-card" style={{ borderLeft: '4px solid #ec4899', cursor: 'pointer' }} onClick={() => setActiveView('pharmacy')}>
              <h3>Pharmacy & Stock</h3>
              <div className="stat-value">{meds.length} Meds</div>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                <span style={{ color: lowStockCount > 0 ? '#ef4444' : '#10b981', fontWeight: '600' }}>{lowStockCount} Low Stock Items</span>
              </div>
            </div>

            <div className="stat-card" style={{ borderLeft: '4px solid #8b5cf6', cursor: 'pointer' }} onClick={() => setActiveView('billing')}>
              <h3>Hospital Revenue</h3>
              <div className="stat-value">${totalRev.toFixed(2)}</div>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>Collected Billing Ledger</div>
            </div>

            <div className="stat-card" style={{ borderLeft: '4px solid #ef4444', cursor: 'pointer' }} onClick={() => setActiveView('attendance')}>
              <h3>Shift Attendance</h3>
              <div className="stat-value">
                {(JSON.parse(localStorage.getItem('dhms_master_attendance') || '[]')).filter(a => a.date === adminAttendanceDate && a.status === 'Present').length} Present
              </div>
              <div style={{ fontSize: '12px', color: '#ef4444', marginTop: '4px', fontWeight: 'bold' }}>
                {(JSON.parse(localStorage.getItem('dhms_master_attendance') || '[]')).filter(a => a.date === adminAttendanceDate && (a.status === 'Absent' || a.status === 'On Leave')).length} Absent / On Leave
              </div>
            </div>
          </div>

          {/* Connected Operations Desks Matrix */}
          <div style={{ marginTop: '30px' }}>
            <h3 style={{ fontSize: '18px', color: '#1e293b', marginBottom: '16px' }}>Connected Operational Desks</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              
              {/* Card 1: Reception Desk Quick Access */}
              <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <h4 style={{ margin: 0, fontSize: '16px', color: '#1e3a8a' }}>Reception & Appointments Desk</h4>
                  <button onClick={() => setActiveView('receptionist')} style={{ padding: '6px 12px', background: '#eff6ff', color: '#1d4ed8', border: 'none', borderRadius: '6px', fontWeight: '600', fontSize: '12px', cursor: 'pointer' }}>Manage Desk &rarr;</button>
                </div>
                <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 12px 0' }}>Overview of current patient bookings, walk-ins, and schedule statuses.</p>
                <div style={{ display: 'flex', gap: '16px', fontSize: '13px' }}>
                  <div>Upcoming: <strong>{appointments.filter(a => a.status === 'Upcoming' || a.status === 'Confirmed').length}</strong></div>
                  <div>Checked In: <strong>{appointments.filter(a => a.status === 'Checked In').length}</strong></div>
                  <div>Completed: <strong>{appointments.filter(a => a.status === 'Completed').length}</strong></div>
                </div>
              </div>

              {/* Card 2: Laboratory Desk Quick Access */}
              <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <h4 style={{ margin: 0, fontSize: '16px', color: '#4338ca' }}>Laboratory Diagnostics Desk</h4>
                  <button onClick={() => setActiveView('laboratory')} style={{ padding: '6px 12px', background: '#eef2ff', color: '#4338ca', border: 'none', borderRadius: '6px', fontWeight: '600', fontSize: '12px', cursor: 'pointer' }}>Manage Desk &rarr;</button>
                </div>
                <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 12px 0' }}>Track diagnostic lab orders, test turnaround times, and completed reports.</p>
                <div style={{ display: 'flex', gap: '16px', fontSize: '13px' }}>
                  <div>Pending Tests: <strong style={{ color: '#ef4444' }}>{labRequests.filter(l => l.status === 'Pending').length}</strong></div>
                  <div>Completed & Billed: <strong style={{ color: '#10b981' }}>{labRequests.filter(l => l.status === 'Completed & Billed').length}</strong></div>
                </div>
              </div>

              {/* Card 3: Pharmacy Desk Quick Access */}
              <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <h4 style={{ margin: 0, fontSize: '16px', color: '#047857' }}>Pharmacy & Stock Control</h4>
                  <button onClick={() => setActiveView('pharmacy')} style={{ padding: '6px 12px', background: '#ecfdf5', color: '#047857', border: 'none', borderRadius: '6px', fontWeight: '600', fontSize: '12px', cursor: 'pointer' }}>Manage Desk &rarr;</button>
                </div>
                <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 12px 0' }}>Monitor drug inventory levels, emergency medications, and prescription logs.</p>
                <div style={{ display: 'flex', gap: '16px', fontSize: '13px' }}>
                  <div>Pending RX: <strong style={{ color: '#ef4444' }}>{prescriptions.filter(r => r.status === 'Pending').length}</strong></div>
                  <div>Dispensed: <strong style={{ color: '#10b981' }}>{prescriptions.filter(r => r.status === 'Dispensed & Billed').length}</strong></div>
                </div>
              </div>

              {/* Card 4: Financials & Billing Quick Access */}
              <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <h4 style={{ margin: 0, fontSize: '16px', color: '#6b21a8' }}>Hospital Billing & Revenue</h4>
                  <button onClick={() => setActiveView('billing')} style={{ padding: '6px 12px', background: '#faf5ff', color: '#6b21a8', border: 'none', borderRadius: '6px', fontWeight: '600', fontSize: '12px', cursor: 'pointer' }}>Manage Desk &rarr;</button>
                </div>
                <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 12px 0' }}>Master ledger across consultations, laboratory tests, and pharmacy billing.</p>
                <div style={{ display: 'flex', gap: '16px', fontSize: '13px' }}>
                  <div>Paid Invoices: <strong style={{ color: '#10b981' }}>{billingList.filter(b => b.status === 'Paid').length}</strong></div>
                  <div>Unpaid Invoices: <strong style={{ color: '#ef4444' }}>{billingList.filter(b => b.status === 'Unpaid').length}</strong></div>
                </div>
              </div>

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
        </>
      );
    }
    return null;
  };

  const renderContent = () => {
    switch (activeView) {
      case 'departments':
        return (
          <div className="module-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h2>Hospital Departments & Roster</h2>
                <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>Configure departments and assign department heads across the hospital.</p>
              </div>
              {role === 'admin' && (
                <button 
                  onClick={() => setShowAddDeptModal(true)}
                  style={{ padding: '10px 16px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '14px' }}
                >
                  + Add New Department
                </button>
              )}
            </div>

            <table className="data-table">
              <thead>
                <tr>
                  <th>Dept Code</th>
                  <th>Department Name</th>
                  <th>Head of Department</th>
                  <th>Operational Status</th>
                </tr>
              </thead>
              <tbody>
                {departmentsList.map(d => (
                  <tr key={d.id}>
                    <td><span style={{ background: '#f1f5f9', padding: '4px 8px', borderRadius: '4px', fontWeight: 'bold', fontSize: '12px' }}>{d.code || `DEPT-0${d.id}`}</span></td>
                    <td><strong>{d.name}</strong></td>
                    <td>{d.head}</td>
                    <td><span className="status-badge available">Active Wing</span></td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Add Dept Modal */}
            {showAddDeptModal && (
              <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999 }}>
                <div style={{ background: 'white', padding: '24px', borderRadius: '12px', width: '400px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <h3 style={{ margin: 0, color: '#1e293b' }}>Add New Department</h3>
                  <form onSubmit={handleAddDepartment} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div>
                      <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569' }}>Department Name</label>
                      <input type="text" required value={newDeptName} onChange={(e) => setNewDeptName(e.target.value)} placeholder="e.g. Oncology" style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', marginTop: '4px', boxSizing: 'border-box' }} />
                    </div>
                    <div>
                      <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569' }}>Dept Code</label>
                      <input type="text" required value={newDeptCode} onChange={(e) => setNewDeptCode(e.target.value)} placeholder="e.g. ONCO" style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', marginTop: '4px', boxSizing: 'border-box' }} />
                    </div>
                    <div>
                      <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569' }}>Head of Department</label>
                      <input type="text" value={newDeptHead} onChange={(e) => setNewDeptHead(e.target.value)} placeholder="e.g. Dr. Robert House" style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', marginTop: '4px', boxSizing: 'border-box' }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px' }}>
                      <button type="button" onClick={() => setShowAddDeptModal(false)} style={{ padding: '8px 14px', background: '#e2e8f0', color: '#475569', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}>Cancel</button>
                      <button type="submit" style={{ padding: '8px 14px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}>Save Department</button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        );

      case 'doctors':
        return (
          <div className="module-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h2>Doctors & Medical Roster</h2>
                <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>Manage physicians, active statuses, and department assignments.</p>
              </div>
              {role === 'admin' && (
                <button 
                  onClick={() => setShowAddDoctorModal(true)}
                  style={{ padding: '10px 16px', background: '#10b981', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '14px' }}
                >
                  + Add New Doctor
                </button>
              )}
            </div>

            <table className="data-table">
              <thead>
                <tr>
                  <th>Doctor ID</th>
                  <th>Doctor Name</th>
                  <th>Department</th>
                  <th>Contact Email</th>
                  <th>Active Duty Status</th>
                  {role === 'admin' && <th>Quick Action</th>}
                </tr>
              </thead>
              <tbody>
                {doctorsRoster.map(d => (
                  <tr key={d.id}>
                    <td><strong>{d.id}</strong></td>
                    <td><strong>{d.name}</strong></td>
                    <td><span style={{ background: '#f1f5f9', padding: '4px 8px', borderRadius: '4px', fontSize: '12px' }}>{d.department}</span></td>
                    <td>{d.email}</td>
                    <td>
                      <span className={`status-badge ${d.status === 'Available' ? 'available' : d.status === 'On Leave' ? 'leave' : 'surgery'}`}>
                        {d.status}
                      </span>
                    </td>
                    {role === 'admin' && (
                      <td>
                        <select 
                          value={d.status} 
                          onChange={(e) => handleToggleDoctorStatus(d.id, e.target.value)}
                          style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                        >
                          <option value="Available">Available</option>
                          <option value="On Leave">On Leave</option>
                          <option value="In Surgery">In Surgery</option>
                        </select>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Add Doctor Modal */}
            {showAddDoctorModal && (
              <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999 }}>
                <div style={{ background: 'white', padding: '24px', borderRadius: '12px', width: '420px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <h3 style={{ margin: 0, color: '#1e293b' }}>Add New Doctor to Roster</h3>
                  <form onSubmit={handleAddDoctor} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div>
                      <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569' }}>Doctor Full Name</label>
                      <input type="text" required value={newDocName} onChange={(e) => setNewDocName(e.target.value)} placeholder="e.g. Dr. Alice Vance" style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', marginTop: '4px', boxSizing: 'border-box' }} />
                    </div>
                    <div>
                      <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569' }}>Department</label>
                      <select value={newDocDept} onChange={(e) => setNewDocDept(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', marginTop: '4px' }}>
                        {departmentsList.map(dept => (
                          <option key={dept.id} value={dept.name}>{dept.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569' }}>Initial Status</label>
                      <select value={newDocStatus} onChange={(e) => setNewDocStatus(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', marginTop: '4px' }}>
                        <option value="Available">Available</option>
                        <option value="On Leave">On Leave</option>
                        <option value="In Surgery">In Surgery</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569' }}>Email Address</label>
                      <input type="email" value={newDocEmail} onChange={(e) => setNewDocEmail(e.target.value)} placeholder="alice@dhms.org" style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', marginTop: '4px', boxSizing: 'border-box' }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px' }}>
                      <button type="button" onClick={() => setShowAddDoctorModal(false)} style={{ padding: '8px 14px', background: '#e2e8f0', color: '#475569', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}>Cancel</button>
                      <button type="submit" style={{ padding: '8px 14px', background: '#10b981', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}>Save Doctor</button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        );

      case 'receptionist':
        return (
          <div className="module-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h2>Receptionist & Appointment Desk</h2>
                <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>View and manage patient appointments, check-in statuses, and bookings.</p>
              </div>
              <button 
                onClick={() => setShowAdminBookingModal(true)}
                style={{ padding: '10px 16px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '14px' }}
              >
                + Schedule Appointment
              </button>
            </div>

            <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
              <input 
                type="text" 
                placeholder="Search appointments by ID, patient or doctor..."
                value={adminSearch}
                onChange={(e) => setAdminSearch(e.target.value)}
                style={{ padding: '8px 14px', borderRadius: '6px', border: '1px solid #cbd5e1', width: '320px', outline: 'none' }}
              />
              <select 
                value={adminStatusFilter}
                onChange={(e) => setAdminStatusFilter(e.target.value)}
                style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', background: 'white' }}
              >
                <option value="All">All Statuses</option>
                <option value="Upcoming">Upcoming</option>
                <option value="Checked In">Checked In</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
              </select>
            </div>

            <table className="data-table">
              <thead>
                <tr>
                  <th>Appt ID</th>
                  <th>Patient Name</th>
                  <th>Assigned Physician / Dept</th>
                  <th>Date & Time</th>
                  <th>Reason</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {appointments
                  .filter(a => {
                    const matchQ = a.patientName.toLowerCase().includes(adminSearch.toLowerCase()) ||
                                   a.doctorName.toLowerCase().includes(adminSearch.toLowerCase()) ||
                                   a.id.toLowerCase().includes(adminSearch.toLowerCase());
                    const matchS = adminStatusFilter === 'All' || a.status === adminStatusFilter;
                    return matchQ && matchS;
                  })
                  .map(appt => (
                    <tr key={appt.id}>
                      <td><strong>{appt.id}</strong></td>
                      <td>{appt.patientName}</td>
                      <td>
                        <div>{appt.doctorName}</div>
                        <span style={{ fontSize: '11px', color: '#64748b', background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>{appt.department}</span>
                      </td>
                      <td><strong>{appt.date}</strong> <span style={{ fontSize: '12px', color: '#64748b' }}>({appt.time})</span></td>
                      <td>{appt.reason}</td>
                      <td>
                        <span className="status-badge" style={{
                          backgroundColor: appt.status === 'Completed' ? '#dcfce7' : appt.status === 'Checked In' ? '#eff6ff' : appt.status === 'In Progress' ? '#fef3c7' : '#f1f5f9',
                          color: appt.status === 'Completed' ? '#15803d' : appt.status === 'Checked In' ? '#1d4ed8' : appt.status === 'In Progress' ? '#b45309' : '#475569'
                        }}>
                          {appt.status}
                        </span>
                      </td>
                      <td>
                        {appt.status !== 'Completed' && (
                          <select 
                            value={appt.status} 
                            onChange={(e) => handleUpdateApptStatus(appt.id, e.target.value)}
                            style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '11px' }}
                          >
                            <option value="Upcoming">Upcoming</option>
                            <option value="Checked In">Checked In</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Completed">Completed</option>
                          </select>
                        )}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>

            {/* Schedule Appointment Modal */}
            {showAdminBookingModal && (
              <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999 }}>
                <div style={{ background: 'white', padding: '24px', borderRadius: '12px', width: '440px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <h3 style={{ margin: 0, color: '#1e293b' }}>Schedule Patient Appointment</h3>
                  <form onSubmit={handleAdminCreateAppointment} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div>
                      <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569' }}>Patient Full Name</label>
                      <input type="text" required value={adminBookPatient} onChange={(e) => setAdminBookPatient(e.target.value)} placeholder="e.g. Sarah Connor" style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', marginTop: '4px', boxSizing: 'border-box' }} />
                    </div>
                    <div>
                      <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569' }}>Assign Physician</label>
                      <select value={adminBookDoctor} onChange={(e) => setAdminBookDoctor(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', marginTop: '4px' }}>
                        {doctorsRoster.map(doc => (
                          <option key={doc.id} value={doc.id}>{doc.name} ({doc.department})</option>
                        ))}
                      </select>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      <div>
                        <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569' }}>Date</label>
                        <input type="date" required value={adminBookDate} onChange={(e) => setAdminBookDate(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', marginTop: '4px', boxSizing: 'border-box' }} />
                      </div>
                      <div>
                        <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569' }}>Time</label>
                        <input type="text" required value={adminBookTime} onChange={(e) => setAdminBookTime(e.target.value)} placeholder="10:00 AM" style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', marginTop: '4px', boxSizing: 'border-box' }} />
                      </div>
                    </div>
                    <div>
                      <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569' }}>Reason for Visit</label>
                      <input type="text" required value={adminBookReason} onChange={(e) => setAdminBookReason(e.target.value)} placeholder="Consultation / Checkup" style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', marginTop: '4px', boxSizing: 'border-box' }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px' }}>
                      <button type="button" onClick={() => setShowAdminBookingModal(false)} style={{ padding: '8px 14px', background: '#e2e8f0', color: '#475569', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}>Cancel</button>
                      <button type="submit" style={{ padding: '8px 14px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}>Confirm Booking</button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        );

      case 'laboratory':
        return (
          <div className="module-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h2>Laboratory Diagnostic Orders</h2>
                <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>Master log of lab requests, test turnaround, and completion status.</p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
              <input 
                type="text" 
                placeholder="Search lab orders by test or patient..."
                value={adminSearch}
                onChange={(e) => setAdminSearch(e.target.value)}
                style={{ padding: '8px 14px', borderRadius: '6px', border: '1px solid #cbd5e1', width: '320px', outline: 'none' }}
              />
              <select 
                value={adminStatusFilter}
                onChange={(e) => setAdminStatusFilter(e.target.value)}
                style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', background: 'white' }}
              >
                <option value="All">All Statuses</option>
                <option value="Pending">Pending</option>
                <option value="Completed & Billed">Completed & Billed</option>
              </select>
            </div>

            <table className="data-table">
              <thead>
                <tr>
                  <th>Lab Order ID</th>
                  <th>Patient Name</th>
                  <th>Diagnostic Test Name</th>
                  <th>Prescribing Doctor</th>
                  <th>Date</th>
                  <th>Cost</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {labRequests
                  .filter(l => {
                    const matchQ = l.patientName.toLowerCase().includes(adminSearch.toLowerCase()) ||
                                   l.testName.toLowerCase().includes(adminSearch.toLowerCase()) ||
                                   l.id.toLowerCase().includes(adminSearch.toLowerCase());
                    const matchS = adminStatusFilter === 'All' || l.status === adminStatusFilter;
                    return matchQ && matchS;
                  })
                  .map(lab => (
                    <tr key={lab.id}>
                      <td><strong>{lab.id}</strong></td>
                      <td>{lab.patientName}</td>
                      <td><strong>{lab.testName}</strong></td>
                      <td>{lab.doctorName}</td>
                      <td>{lab.date}</td>
                      <td><strong>${lab.cost}</strong></td>
                      <td>
                        <span className="status-badge" style={{
                          backgroundColor: lab.status === 'Completed & Billed' ? '#dcfce7' : '#fee2e2',
                          color: lab.status === 'Completed & Billed' ? '#15803d' : '#b91c1c'
                        }}>
                          {lab.status}
                        </span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        );

      case 'pharmacy':
        const medsList = JSON.parse(localStorage.getItem('dhms_medications') || '[]');
        const pStaff = JSON.parse(localStorage.getItem('dhms_pharmacy_staff') || '[]');
        const pAttend = JSON.parse(localStorage.getItem('dhms_pharmacy_attendance') || '[]');

        return (
          <div className="module-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h2>Pharmacy & Stock Control Center</h2>
                <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>Monitor medication stock levels, prescription fulfillment, and pharmacy staff.</p>
              </div>
            </div>

            {/* Sub-tabs for Pharmacy Desk */}
            <div style={{ display: 'flex', borderBottom: '2px solid #e2e8f0', marginBottom: '20px', gap: '8px' }}>
              <button 
                onClick={() => setAdminPharmacySubTab('medications')}
                style={{ padding: '10px 16px', background: 'none', border: 'none', borderBottom: adminPharmacySubTab === 'medications' ? '3px solid #10b981' : '3px solid transparent', color: adminPharmacySubTab === 'medications' ? '#047857' : '#64748b', fontWeight: '600', cursor: 'pointer' }}
              >
                Medication Stock ({medsList.length})
              </button>
              <button 
                onClick={() => setAdminPharmacySubTab('prescriptions')}
                style={{ padding: '10px 16px', background: 'none', border: 'none', borderBottom: adminPharmacySubTab === 'prescriptions' ? '3px solid #10b981' : '3px solid transparent', color: adminPharmacySubTab === 'prescriptions' ? '#047857' : '#64748b', fontWeight: '600', cursor: 'pointer' }}
              >
                Prescription Log ({prescriptions.length})
              </button>
              <button 
                onClick={() => setAdminPharmacySubTab('staff')}
                style={{ padding: '10px 16px', background: 'none', border: 'none', borderBottom: adminPharmacySubTab === 'staff' ? '3px solid #10b981' : '3px solid transparent', color: adminPharmacySubTab === 'staff' ? '#047857' : '#64748b', fontWeight: '600', cursor: 'pointer' }}
              >
                Staff & Shift Roster ({pStaff.length})
              </button>
            </div>

            {adminPharmacySubTab === 'medications' && (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Med ID</th>
                    <th>Medication Name</th>
                    <th>Category</th>
                    <th>In Stock</th>
                    <th>Unit Price</th>
                    <th>Emergency Drug</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {medsList.map(m => (
                    <tr key={m.id}>
                      <td><strong>{m.id}</strong></td>
                      <td><strong>{m.name}</strong></td>
                      <td>{m.category}</td>
                      <td>
                        <span style={{ fontWeight: 'bold', color: m.stock <= m.lowStockThreshold ? '#ef4444' : '#10b981' }}>
                          {m.stock} units
                        </span>
                      </td>
                      <td>${parseFloat(m.price).toFixed(2)}</td>
                      <td>
                        {m.isEmergency ? (
                          <span style={{ background: '#fee2e2', color: '#b91c1c', padding: '2px 8px', borderRadius: '4px', fontWeight: 'bold', fontSize: '11px' }}>Emergency</span>
                        ) : (
                          <span style={{ color: '#94a3b8', fontSize: '12px' }}>Standard</span>
                        )}
                      </td>
                      <td>
                        <button 
                          onClick={() => handleRestockMedication(m.id)}
                          style={{ padding: '4px 8px', background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', fontWeight: '600' }}
                        >
                          + Restock (+50)
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {adminPharmacySubTab === 'prescriptions' && (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>RX ID</th>
                    <th>Patient Name</th>
                    <th>Medication Prescribed</th>
                    <th>Prescribing Doctor</th>
                    <th>Date</th>
                    <th>Co-pay Cost</th>
                    <th>Fulfillment Status</th>
                  </tr>
                </thead>
                <tbody>
                  {prescriptions.map(rx => (
                    <tr key={rx.id}>
                      <td><strong>{rx.id}</strong></td>
                      <td>{rx.patientName}</td>
                      <td><strong>{rx.medication}</strong></td>
                      <td>{rx.doctorName}</td>
                      <td>{rx.date}</td>
                      <td><strong>${rx.cost}</strong></td>
                      <td>
                        <span className="status-badge" style={{
                          backgroundColor: rx.status === 'Dispensed & Billed' ? '#dcfce7' : '#fee2e2',
                          color: rx.status === 'Dispensed & Billed' ? '#15803d' : '#b91c1c'
                        }}>
                          {rx.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {adminPharmacySubTab === 'staff' && (
              <div>
                <h4 style={{ margin: '0 0 12px 0', color: '#1e293b' }}>Pharmacy Shift & Attendance Log</h4>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Staff Name</th>
                      <th>Check In</th>
                      <th>Check Out</th>
                      <th>Attendance Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pAttend.map((att, i) => (
                      <tr key={i}>
                        <td>{att.date}</td>
                        <td><strong>{att.name}</strong></td>
                        <td>{att.checkIn}</td>
                        <td>{att.checkOut}</td>
                        <td>
                          <span className="status-badge" style={{
                            backgroundColor: att.status === 'Present' ? '#dcfce7' : '#fef3c7',
                            color: att.status === 'Present' ? '#15803d' : '#b45309'
                          }}>
                            {att.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );

      case 'billing':
        const cleanAmount = (amtStr) => parseFloat((amtStr || '').replace('$', '').trim()) || 0;
        const paidRev = billingList.filter(inv => inv.status === 'Paid').reduce((sum, inv) => sum + cleanAmount(inv.amount), 0);
        const unpaidRev = billingList.filter(inv => inv.status === 'Unpaid').reduce((sum, inv) => sum + cleanAmount(inv.amount), 0);

        return (
          <div className="module-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h2>Hospital Financials & Master Billing</h2>
                <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>Master billing ledger covering consultations, diagnostics, and pharmacy charges.</p>
              </div>
            </div>

            <div className="stats-grid" style={{ marginBottom: '20px' }}>
              <div className="stat-card" style={{ borderLeft: '4px solid #10b981' }}>
                <h3>Collected Revenue</h3>
                <div className="stat-value">${paidRev.toFixed(2)}</div>
              </div>
              <div className="stat-card" style={{ borderLeft: '4px solid #ef4444' }}>
                <h3>Outstanding Unpaid</h3>
                <div className="stat-value">${unpaidRev.toFixed(2)}</div>
              </div>
              <div className="stat-card" style={{ borderLeft: '4px solid #3b82f6' }}>
                <h3>Total Invoices</h3>
                <div className="stat-value">{billingList.length}</div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
              <input 
                type="text" 
                placeholder="Search invoice by ID, patient or type..."
                value={adminSearch}
                onChange={(e) => setAdminSearch(e.target.value)}
                style={{ padding: '8px 14px', borderRadius: '6px', border: '1px solid #cbd5e1', width: '320px', outline: 'none' }}
              />
              <select 
                value={adminStatusFilter}
                onChange={(e) => setAdminStatusFilter(e.target.value)}
                style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', background: 'white' }}
              >
                <option value="All">All Invoices</option>
                <option value="Paid">Paid</option>
                <option value="Unpaid">Unpaid</option>
              </select>
            </div>

            <table className="data-table">
              <thead>
                <tr>
                  <th>Invoice ID</th>
                  <th>Patient Details</th>
                  <th>Billing Description</th>
                  <th>Date</th>
                  <th>Charge Amount</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {billingList
                  .filter(inv => {
                    const matchQ = inv.patientName.toLowerCase().includes(adminSearch.toLowerCase()) ||
                                   inv.id.toLowerCase().includes(adminSearch.toLowerCase()) ||
                                   inv.type.toLowerCase().includes(adminSearch.toLowerCase());
                    const matchS = adminStatusFilter === 'All' || inv.status === adminStatusFilter;
                    return matchQ && matchS;
                  })
                  .map(inv => (
                    <tr key={inv.id}>
                      <td><strong>{inv.id}</strong></td>
                      <td>{inv.patientName}</td>
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
                              onClick={() => handleAdminMarkPaid(inv.id)}
                              style={{ padding: '4px 8px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', fontWeight: '600' }}
                            >
                              Collect Payment
                            </button>
                          )}
                          <button
                            onClick={() => alert(`Printing Invoice ${inv.id} Receipt...`)}
                            style={{ padding: '4px 8px', border: '1px solid #cbd5e1', background: 'white', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', color: '#475569' }}
                          >
                            Print
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        );

      case 'patients':
        if (role === 'doctor') {
          const filtered = patients.filter(p => 
            `${p.firstName} ${p.lastName}`.toLowerCase().includes(patientSearch.toLowerCase()) || 
            p.id.toLowerCase().includes(patientSearch.toLowerCase())
          );
          return (
            <div className="module-content">
              <h2>EHR Patient Directory</h2>
              <p>Explore, search, and manage complete clinical Electronic Health Records for assigned patients.</p>

              <div style={{ marginBottom: '20px', display: 'flex', gap: '12px' }}>
                <input 
                  type="text" 
                  placeholder="Search patient by ID or name..."
                  value={patientSearch}
                  onChange={(e) => setPatientSearch(e.target.value)}
                  style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #cbd5e1', width: '320px', fontSize: '14px', outline: 'none' }}
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

                    <form onSubmit={handleUpdateEhrMetadata} style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '8px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <label style={{ fontSize: '12px', fontWeight: '600', color: '#475569' }}>Blood Type</label>
                        <select value={newBloodType} onChange={(e) => setNewBloodType(e.target.value)} style={{ padding: '6px', borderRadius: '4px', border: '1px solid #cbd5e1' }}>
                          <option value="A+">A+</option>
                          <option value="A-">A-</option>
                          <option value="B+">B+</option>
                          <option value="B-">B-</option>
                          <option value="O+">O+</option>
                          <option value="O-">O-</option>
                          <option value="AB+">AB+</option>
                          <option value="AB-">AB-</option>
                        </select>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <label style={{ fontSize: '12px', fontWeight: '600', color: '#475569' }}>Allergies</label>
                        <input type="text" value={newAllergies} onChange={(e) => setNewAllergies(e.target.value)} style={{ padding: '6px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '12px' }} />
                      </div>
                      <div style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <label style={{ fontSize: '12px', fontWeight: '600', color: '#475569' }}>Chronic Conditions</label>
                        <input type="text" value={newConditions} onChange={(e) => setNewConditions(e.target.value)} style={{ padding: '6px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '12px' }} />
                      </div>
                      <button type="submit" style={{ gridColumn: 'span 2', padding: '8px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' }}>Update Clinical Profile</button>
                    </form>
                  </div>
                )}
              </div>
            </div>
          );
        }
        return null;

      case 'appointments':
        const docAppts = appointments.filter(a => a.doctorId === activeDoctorId);
        return (
          <div className="module-content">
            <h2>Appointments Management</h2>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Appt ID</th>
                  <th>Patient Name</th>
                  <th>Date & Time</th>
                  <th>Reason</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {docAppts.map(appt => (
                  <tr key={appt.id}>
                    <td><strong>{appt.id}</strong></td>
                    <td>{appt.patientName}</td>
                    <td>{appt.date} ({appt.time})</td>
                    <td>{appt.reason}</td>
                    <td><span style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', fontSize: '12px' }}>{appt.type}</span></td>
                    <td>
                      <span className="status-badge" style={{
                        backgroundColor: appt.status === 'Completed' ? '#dcfce7' : appt.status === 'Checked In' ? '#eff6ff' : appt.status === 'In Progress' ? '#fef3c7' : '#f1f5f9',
                        color: appt.status === 'Completed' ? '#15803d' : appt.status === 'Checked In' ? '#1d4ed8' : appt.status === 'In Progress' ? '#b45309' : '#475569'
                      }}>
                        {appt.status}
                      </span>
                    </td>
                    <td>
                      {appt.status !== 'Completed' && (
                        <button 
                          onClick={() => handleOpenCheckupModal(appt)}
                          style={{ padding: '4px 8px', background: '#10b981', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', fontWeight: '600' }}
                        >
                          Start Checkup
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );

      case 'prescriptions':
        const docRx = prescriptions.filter(r => r.doctorName === (DOCTORS.find(d => d.id === activeDoctorId)?.name || ''));
        return (
          <div className="module-content">
            <h2>Prescription History</h2>
            <table className="data-table">
              <thead>
                <tr>
                  <th>RX ID</th>
                  <th>Patient Name</th>
                  <th>Medication Details</th>
                  <th>Date</th>
                  <th>Cost</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {docRx.map(rx => (
                  <tr key={rx.id}>
                    <td><strong>{rx.id}</strong></td>
                    <td>{rx.patientName}</td>
                    <td><strong>{rx.medication}</strong></td>
                    <td>{rx.date}</td>
                    <td>${rx.cost}</td>
                    <td>
                      <span className="status-badge" style={{
                        backgroundColor: rx.status === 'Dispensed & Billed' ? '#dcfce7' : '#fee2e2',
                        color: rx.status === 'Dispensed & Billed' ? '#15803d' : '#b91c1c'
                      }}>
                        {rx.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );

      case 'labs':
        const docLabs = labRequests.filter(l => l.doctorName === (DOCTORS.find(d => d.id === activeDoctorId)?.name || ''));
        return (
          <div className="module-content">
            <h2>Lab Orders History</h2>
            <table className="data-table">
              <thead>
                <tr>
                  <th>LAB ID</th>
                  <th>Patient Name</th>
                  <th>Test Name</th>
                  <th>Date</th>
                  <th>Cost</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {docLabs.map(lab => (
                  <tr key={lab.id}>
                    <td><strong>{lab.id}</strong></td>
                    <td>{lab.patientName}</td>
                    <td><strong>{lab.testName}</strong></td>
                    <td>{lab.date}</td>
                    <td>${lab.cost}</td>
                    <td>
                      <span className="status-badge" style={{
                        backgroundColor: lab.status === 'Completed & Billed' ? '#dcfce7' : '#fee2e2',
                        color: lab.status === 'Completed & Billed' ? '#15803d' : '#b91c1c'
                      }}>
                        {lab.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );

      case 'attendance':
        if (role === 'admin') {
          const masterAtt = JSON.parse(localStorage.getItem('dhms_master_attendance') || '[]');
          
          // Filter by Date, Module & Status
          const filtered = masterAtt.filter(a => {
            const matchDate = a.date === adminAttendanceDate;
            const matchMod = adminAttendanceModuleFilter === 'All' || a.module === adminAttendanceModuleFilter;
            const matchStat = adminAttendanceStatusFilter === 'All' || a.status === adminAttendanceStatusFilter;
            return matchDate && matchMod && matchStat;
          });

          // Absentees for the selected date
          const dateAbsentees = masterAtt.filter(a => a.date === adminAttendanceDate && (a.status === 'Absent' || a.status === 'On Leave'));

          return (
            <div className="module-content">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div>
                  <h2>Master Hospital Attendance & Absence Tracker</h2>
                  <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>Monitor daily shift attendance, check-in times, and absentees across all hospital departments.</p>
                </div>
              </div>

              {/* Date & Filter Toolbar */}
              <div style={{ display: 'flex', gap: '16px', marginBottom: '20px', alignItems: 'center', background: 'white', padding: '16px', borderRadius: '10px', border: '1px solid #cbd5e1' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '4px' }}>Select Attendance Date:</label>
                  <input 
                    type="date" 
                    value={adminAttendanceDate}
                    onChange={(e) => setAdminAttendanceDate(e.target.value)}
                    style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontWeight: 'bold', color: '#1e293b' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '4px' }}>Filter Module / Dept:</label>
                  <select 
                    value={adminAttendanceModuleFilter}
                    onChange={(e) => setAdminAttendanceModuleFilter(e.target.value)}
                    style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', background: 'white' }}
                  >
                    <option value="All">All Modules</option>
                    <option value="Doctor">Doctor Roster</option>
                    <option value="Receptionist">Receptionist Desk</option>
                    <option value="Laboratory">Laboratory Desk</option>
                    <option value="Pharmacist">Pharmacist Desk</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '4px' }}>Filter Status:</label>
                  <select 
                    value={adminAttendanceStatusFilter}
                    onChange={(e) => setAdminAttendanceStatusFilter(e.target.value)}
                    style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', background: 'white' }}
                  >
                    <option value="All">All Statuses</option>
                    <option value="Present">Present</option>
                    <option value="Late">Late</option>
                    <option value="Absent">Absent</option>
                    <option value="On Leave">On Leave</option>
                  </select>
                </div>
              </div>

              {/* ABSENTEES PROMINENT ALERT SECTION */}
              <div style={{ backgroundColor: dateAbsentees.length > 0 ? '#fef2f2' : '#f0fdf4', border: dateAbsentees.length > 0 ? '2px solid #fca5a5' : '1px solid #bbf7d0', borderRadius: '12px', padding: '20px', marginBottom: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <h3 style={{ margin: 0, fontSize: '16px', color: dateAbsentees.length > 0 ? '#991b1b' : '#166534', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>{dateAbsentees.length > 0 ? '⚠️' : '✅'}</span>
                    Absentees & On-Leave Staff Log ({adminAttendanceDate})
                  </h3>
                  <span style={{ fontSize: '12px', background: dateAbsentees.length > 0 ? '#fee2e2' : '#dcfce7', color: dateAbsentees.length > 0 ? '#991b1b' : '#166534', padding: '4px 10px', borderRadius: '999px', fontWeight: 'bold' }}>
                    {dateAbsentees.length} Staff Member(s) Absent / On Leave
                  </span>
                </div>

                {dateAbsentees.length === 0 ? (
                  <p style={{ margin: 0, color: '#15803d', fontSize: '14px' }}>All scheduled staff members are present for {adminAttendanceDate}. No absences recorded.</p>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px', marginTop: '12px' }}>
                    {dateAbsentees.map(ab => (
                      <div key={ab.id} style={{ background: 'white', border: '1px solid #fecdd3', borderRadius: '8px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '4px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <strong style={{ color: '#1e293b', fontSize: '14px' }}>{ab.staffName}</strong>
                          <span style={{ fontSize: '11px', background: ab.status === 'Absent' ? '#fee2e2' : '#fef3c7', color: ab.status === 'Absent' ? '#b91c1c' : '#b45309', padding: '2px 8px', borderRadius: '4px', fontWeight: 'bold' }}>
                            {ab.status}
                          </span>
                        </div>
                        <div style={{ fontSize: '12px', color: '#64748b' }}>Module: <strong>{ab.module}</strong> ({ab.role})</div>
                        <div style={{ fontSize: '12px', color: '#991b1b', fontStyle: 'italic', marginTop: '4px' }}>Reason: "{ab.remarks}"</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Master Attendance Table */}
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Record ID</th>
                    <th>Module / Dept</th>
                    <th>Staff Name & Details</th>
                    <th>Check In</th>
                    <th>Check Out</th>
                    <th>Attendance Status</th>
                    <th>Remarks</th>
                    <th>Admin Override</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr><td colSpan="8" style={{ textAlign: 'center', padding: '24px', color: '#64748b' }}>No attendance records found matching filters for date {adminAttendanceDate}.</td></tr>
                  ) : (
                    filtered.map(att => (
                      <tr key={att.id}>
                        <td><strong>{att.id}</strong></td>
                        <td><span style={{ background: '#f1f5f9', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' }}>{att.module}</span></td>
                        <td>
                          <strong>{att.staffName}</strong>
                          <div style={{ fontSize: '11px', color: '#64748b' }}>ID: {att.staffId} | {att.role}</div>
                        </td>
                        <td>{att.checkIn}</td>
                        <td>{att.checkOut}</td>
                        <td>
                          <span className="status-badge" style={{
                            backgroundColor: att.status === 'Present' ? '#dcfce7' : att.status === 'Late' ? '#fef3c7' : '#fee2e2',
                            color: att.status === 'Present' ? '#15803d' : att.status === 'Late' ? '#b45309' : '#b91c1c'
                          }}>
                            {att.status}
                          </span>
                        </td>
                        <td>{att.remarks}</td>
                        <td>
                          <select 
                            value={att.status}
                            onChange={(e) => handleAdminUpdateMasterAttendance(att.id, e.target.value)}
                            style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                          >
                            <option value="Present">Present</option>
                            <option value="Late">Late</option>
                            <option value="Absent">Absent</option>
                            <option value="On Leave">On Leave</option>
                          </select>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          );
        } else if (role === 'doctor') {
          const activeDocObj = DOCTORS.find(d => d.id === activeDoctorId) || DOCTORS[0];
          const docRecords = (JSON.parse(localStorage.getItem('dhms_master_attendance') || '[]'))
            .filter(a => a.module === 'Doctor' && a.staffId === activeDocObj.id);

          return (
            <div className="module-content">
              <h2>Doctor Shift Attendance Log</h2>
              <p style={{ color: '#64748b', fontSize: '14px' }}>Log your daily shift check-in, check-out times, and clinical attendance for <strong>{activeDocObj.name}</strong>.</p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px', marginTop: '20px' }}>
                <div style={{ background: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                  <h3 style={{ margin: '0 0 16px 0', color: '#1e293b' }}>Log Shift Attendance</h3>
                  <form onSubmit={handleDoctorLogAttendance} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div>
                      <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569' }}>Shift Date</label>
                      <input type="date" required value={docAttendanceForm.date} onChange={(e) => setDocAttendanceForm({ ...docAttendanceForm, date: e.target.value })} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', marginTop: '4px', boxSizing: 'border-box' }} />
                    </div>

                    <div>
                      <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569' }}>Attendance Status</label>
                      <select value={docAttendanceForm.status} onChange={(e) => setDocAttendanceForm({ ...docAttendanceForm, status: e.target.value })} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', marginTop: '4px' }}>
                        <option value="Present">Present</option>
                        <option value="Late">Late</option>
                        <option value="Absent">Absent</option>
                        <option value="On Leave">On Leave</option>
                      </select>
                    </div>

                    {docAttendanceForm.status !== 'Absent' && docAttendanceForm.status !== 'On Leave' && (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                        <div>
                          <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569' }}>Check In</label>
                          <input type="text" value={docAttendanceForm.checkIn} onChange={(e) => setDocAttendanceForm({ ...docAttendanceForm, checkIn: e.target.value })} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', marginTop: '4px', boxSizing: 'border-box' }} />
                        </div>
                        <div>
                          <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569' }}>Check Out</label>
                          <input type="text" value={docAttendanceForm.checkOut} onChange={(e) => setDocAttendanceForm({ ...docAttendanceForm, checkOut: e.target.value })} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', marginTop: '4px', boxSizing: 'border-box' }} />
                        </div>
                      </div>
                    )}

                    <div>
                      <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569' }}>Shift Notes / Remarks</label>
                      <input type="text" placeholder="e.g. Clinical OPD & Rounds" value={docAttendanceForm.remarks} onChange={(e) => setDocAttendanceForm({ ...docAttendanceForm, remarks: e.target.value })} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', marginTop: '4px', boxSizing: 'border-box' }} />
                    </div>

                    <button type="submit" style={{ padding: '10px', background: '#10b981', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px' }}>
                      Submit Attendance Record
                    </button>
                  </form>
                </div>

                <div style={{ background: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                  <h3 style={{ margin: '0 0 16px 0', color: '#1e293b' }}>Attendance History Log</h3>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Check In / Out</th>
                        <th>Status</th>
                        <th>Remarks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {docRecords.length === 0 ? (
                        <tr><td colSpan="4" style={{ textAlign: 'center', padding: '24px', color: '#64748b' }}>No shift attendance logged yet.</td></tr>
                      ) : (
                        docRecords.map(att => (
                          <tr key={att.id}>
                            <td><strong>{att.date}</strong></td>
                            <td>{att.checkIn} - {att.checkOut}</td>
                            <td>
                              <span className="status-badge" style={{
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
        }
        return null;

      default:
        return null;
    }
  };

  return (
    <div className="dashboard-container">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <h2>DHMS</h2>
          <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 'bold', marginTop: '4px', letterSpacing: '0.05em' }}>{role.toUpperCase()} PORTAL</div>
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
          <button className="logout-btn" onClick={onLogout}>Logout</button>
        </div>
      </aside>

      {/* Dashboard Main Area */}
      <div className="dashboard-main">
        <header className="topbar">
          <div className="topbar-title">{role.toUpperCase()} Dashboard</div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            {role === 'doctor' && (
              <select 
                value={activeDoctorId} 
                onChange={(e) => setActiveDoctorId(e.target.value)}
                style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', background: 'white' }}
              >
                {DOCTORS.map(d => (
                  <option key={d.id} value={d.id}>{d.name} ({d.department})</option>
                ))}
              </select>
            )}
            <div className="user-profile">Role: {role.toUpperCase()}</div>
          </div>
        </header>

        <main className="content-area">
          {activeView === 'overview' ? (
            <div className="overview-container">
              <h2>Executive Dashboard</h2>
              {renderRoleOverview()}
            </div>
          ) : (
            renderContent()
          )}
        </main>
      </div>

      {/* Doctor Checkup Modal */}
      {selectedApptForCheckup && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999 }}>
          <div style={{ background: 'white', padding: '24px', borderRadius: '12px', width: '500px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ margin: '0 0 16px 0', color: '#1e293b' }}>Consultation & Checkup Log - {selectedApptForCheckup.patientName}</h3>
            <form onSubmit={handleCheckupSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <input type="text" value={vitalBP} onChange={(e) => setVitalBP(e.target.value)} placeholder="BP (e.g. 120/80)" style={{ padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
                <input type="text" value={vitalHR} onChange={(e) => setVitalHR(e.target.value)} placeholder="HR (bpm)" style={{ padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
                <input type="text" value={vitalTemp} onChange={(e) => setVitalTemp(e.target.value)} placeholder="Temp (°F)" style={{ padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
                <input type="text" value={vitalSpO2} onChange={(e) => setVitalSpO2(e.target.value)} placeholder="SpO2 (%)" style={{ padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
              </div>
              <textarea required value={diagnosisNote} onChange={(e) => setDiagnosisNote(e.target.value)} placeholder="Clinical findings & diagnosis..." style={{ padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1', minHeight: '80px', fontFamily: 'inherit' }} />
              
              <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '10px' }}>
                <strong style={{ fontSize: '13px' }}>Prescribe Medication</strong>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '6px', marginTop: '6px' }}>
                  <input type="text" placeholder="Drug Name" value={rxDrugName} onChange={(e) => setRxDrugName(e.target.value)} style={{ padding: '6px', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
                  <input type="text" placeholder="Dose" value={rxDose} onChange={(e) => setRxDose(e.target.value)} style={{ padding: '6px', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
                </div>
              </div>

              <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '10px' }}>
                <strong style={{ fontSize: '13px' }}>Order Lab Diagnostic</strong>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '6px', marginTop: '6px' }}>
                  <input type="text" placeholder="Test Name" value={labTestName} onChange={(e) => setLabTestName(e.target.value)} style={{ padding: '6px', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
                  <select value={labPriority} onChange={(e) => setLabPriority(e.target.value)} style={{ padding: '6px', borderRadius: '4px', border: '1px solid #cbd5e1' }}>
                    <option value="Routine">Routine</option>
                    <option value="STAT / Urgent">STAT / Urgent</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px' }}>
                <button type="button" onClick={() => setSelectedApptForCheckup(null)} style={{ padding: '8px 14px', background: '#e2e8f0', color: '#475569', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ padding: '8px 14px', background: '#10b981', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Complete Checkup</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
