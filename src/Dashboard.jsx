import React, { useState, useEffect } from 'react';
import './Dashboard.css';
import CashCounterDashboard from './CashCounterDashboard';

const DUMMY_DEPARTMENTS = [];

const DOCTORS = [];

export default function Dashboard({ onLogout, role, loggedInDoctor }) {
  const [activeView, setActiveView] = useState('overview');

  // Admin Authority Transfer States
  const [transferEmail, setTransferEmail] = useState('');
  const [transferName, setTransferName] = useState('System Administrator');
  const [transferPassword, setTransferPassword] = useState('');
  const [transferConfirmPassword, setTransferConfirmPassword] = useState('');
  const [currentAdminVerifyPassword, setCurrentAdminVerifyPassword] = useState('');

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
    const activeDocObj = doctorsRoster.find(d => d.id === activeDoctorId) || doctorsRoster[0] || { id: '', name: 'Unknown Doctor', department: 'General' };
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

  const handleTransferAuthority = (e) => {
    e.preventDefault();
    const currentAdminStr = localStorage.getItem('dhms_admin');
    const currentAdmin = currentAdminStr ? JSON.parse(currentAdminStr) : {
      name: 'System Administrator',
      email: 'admin@dhms.org',
      password: 'admin'
    };

    if (currentAdminVerifyPassword !== currentAdmin.password) {
      alert('Security Verification Failed: The current administrator password you entered is incorrect.');
      return;
    }

    if (transferPassword !== transferConfirmPassword) {
      alert('Input Validation Failed: The new administrator password and confirmation password do not match.');
      return;
    }

    if (!transferEmail.trim() || !transferName.trim() || !transferPassword.trim()) {
      alert('Input Validation Failed: All fields are required.');
      return;
    }

    const confirmTransfer = window.confirm(
      `WARNING: You are about to transfer all administrator authority to:\n` +
      `Name: ${transferName}\n` +
      `Email: ${transferEmail}\n\n` +
      `This action is irreversible and you will be immediately logged out and lose admin status. Are you sure you want to proceed?`
    );

    if (!confirmTransfer) return;

    const newAdmin = {
      name: transferName.trim(),
      email: transferEmail.trim().toLowerCase(),
      password: transferPassword
    };

    localStorage.setItem('dhms_admin', JSON.stringify(newAdmin));
    alert('Authority transferred successfully! You will now be logged out.');
    onLogout();
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
    localStorage.setItem('dhms_doctors', JSON.stringify([]));
    return [];
  });

  const [receptionistStaff, setReceptionistStaff] = useState(() => {
    const saved = localStorage.getItem('dhms_receptionist_staff');
    const list = saved ? JSON.parse(saved) : [];
    const dummyEmails = ['clara@dhms.org', 'amy@dhms.org', 'banner@dhms.org', 'barry@dhms.org', 'rory@dhms.org', 'river@dhms.org', 'donna@dhms.org', 'martha@dhms.org'];
    const filtered = list.filter(s => !dummyEmails.includes(s.email?.toLowerCase()));
    if (filtered.length !== list.length) {
      localStorage.setItem('dhms_receptionist_staff', JSON.stringify(filtered));
    }
    return filtered;
  });

  const [laboratoryStaff, setLaboratoryStaff] = useState(() => {
    const saved = localStorage.getItem('dhms_laboratory_staff');
    const list = saved ? JSON.parse(saved) : [];
    const dummyEmails = ['clara@dhms.org', 'amy@dhms.org', 'banner@dhms.org', 'barry@dhms.org', 'rory@dhms.org', 'river@dhms.org', 'donna@dhms.org', 'martha@dhms.org'];
    const filtered = list.filter(s => !dummyEmails.includes(s.email?.toLowerCase()));
    if (filtered.length !== list.length) {
      localStorage.setItem('dhms_laboratory_staff', JSON.stringify(filtered));
    }
    return filtered;
  });

  const [pharmacyStaff, setPharmacyStaff] = useState(() => {
    const saved = localStorage.getItem('dhms_pharmacy_staff');
    const list = saved ? JSON.parse(saved) : [];
    const dummyEmails = ['clara@dhms.org', 'amy@dhms.org', 'banner@dhms.org', 'barry@dhms.org', 'rory@dhms.org', 'river@dhms.org', 'donna@dhms.org', 'martha@dhms.org'];
    const filtered = list.filter(s => !dummyEmails.includes(s.email?.toLowerCase()));
    if (filtered.length !== list.length) {
      localStorage.setItem('dhms_pharmacy_staff', JSON.stringify(filtered));
    }
    return filtered;
  });

  const [cashierStaff, setCashierStaff] = useState(() => {
    const saved = localStorage.getItem('dhms_cashier_staff');
    const list = saved ? JSON.parse(saved) : [];
    const dummyEmails = ['clara@dhms.org', 'amy@dhms.org', 'banner@dhms.org', 'barry@dhms.org', 'rory@dhms.org', 'river@dhms.org', 'donna@dhms.org', 'martha@dhms.org'];
    const filtered = list.filter(s => !dummyEmails.includes(s.email?.toLowerCase()));
    if (filtered.length !== list.length) {
      localStorage.setItem('dhms_cashier_staff', JSON.stringify(filtered));
    }
    return filtered;
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
  const [newDocPassword, setNewDocPassword] = useState('');

  const [showAdminBookingModal, setShowAdminBookingModal] = useState(false);
  const [adminBookPatient, setAdminBookPatient] = useState('');
  const [adminBookDoctor, setAdminBookDoctor] = useState(() => {
    const saved = JSON.parse(localStorage.getItem('dhms_doctors') || '[]');
    return saved.length > 0 ? saved[0].id : '';
  });
  const [adminBookDept, setAdminBookDept] = useState('Primary Care');
  const [adminBookDate, setAdminBookDate] = useState(new Date().toISOString().split('T')[0]);
  const [adminBookTime, setAdminBookTime] = useState('Slot 1');
  const [adminBookReason, setAdminBookReason] = useState('Routine Checkup');
  const [adminBookType, setAdminBookType] = useState('Physical');

  // Billing state
  const [billingList, setBillingList] = useState(() => {
    const saved = localStorage.getItem('dhms_billing');
    if (saved) return JSON.parse(saved);
    localStorage.setItem('dhms_billing', JSON.stringify([]));
    return [];
  });

  // Inpatient (IPD) Admissions State for Doctors & Hospital
  const [admissions, setAdmissions] = useState(() => {
    return JSON.parse(localStorage.getItem('dhms_admissions') || '[]');
  });
  const [selectedAdmForDischarge, setSelectedAdmForDischarge] = useState(null);
  const [dischargeForm, setDischargeForm] = useState({
    condition: 'Stable / Cured',
    notes: '',
    takeHomeMeds: '',
    followUpDate: 'In 7 Days (OPD Room 101)'
  });

  // Doctor state
  const [activeDoctorId, setActiveDoctorId] = useState(() => {
    if (role === 'doctor' && loggedInDoctor) {
      return loggedInDoctor.id;
    }
    const saved = JSON.parse(localStorage.getItem('dhms_doctors') || '[]');
    return saved.length > 0 ? saved[0].id : '';
  });

  // Doctor Slot Management state
  const [slotManageDate, setSlotManageDate] = useState(new Date().toISOString().split('T')[0]);
  const [slot1CapacityInput, setSlot1CapacityInput] = useState(5);
  const [slot2CapacityInput, setSlot2CapacityInput] = useState(5);

  useEffect(() => {
    if (role === 'doctor' && loggedInDoctor) {
      setActiveDoctorId(loggedInDoctor.id);
    }
  }, [loggedInDoctor, role]);

  useEffect(() => {
    if (role === 'doctor' && activeDoctorId) {
      const slotConfigs = JSON.parse(localStorage.getItem('dhms_doctor_slots') || '[]');
      const docId = activeDoctorId.toLowerCase().replace('.', '').replace(' ', '_');
      const config = slotConfigs.find(c => c.doctorId === docId && c.date === slotManageDate);
      if (config) {
        setSlot1CapacityInput(config.slot1Capacity);
        setSlot2CapacityInput(config.slot2Capacity);
      } else {
        setSlot1CapacityInput(5); // default
        setSlot2CapacityInput(5); // default
      }
    }
  }, [slotManageDate, activeDoctorId, role]);

  const handleSaveSlotCapacities = (e) => {
    e.preventDefault();
    if (!activeDoctorId) return;

    const docId = activeDoctorId.toLowerCase().replace('.', '').replace(' ', '_');
    const slotConfigs = JSON.parse(localStorage.getItem('dhms_doctor_slots') || '[]');
    
    const existingIndex = slotConfigs.findIndex(c => c.doctorId === docId && c.date === slotManageDate);
    const newConfig = {
      doctorId: docId,
      date: slotManageDate,
      slot1Capacity: parseInt(slot1CapacityInput) || 5,
      slot2Capacity: parseInt(slot2CapacityInput) || 5
    };

    if (existingIndex > -1) {
      slotConfigs[existingIndex] = newConfig;
    } else {
      slotConfigs.push(newConfig);
    }

    localStorage.setItem('dhms_doctor_slots', JSON.stringify(slotConfigs));
    alert("Slot capacities saved successfully for " + slotManageDate + "!");
  };

  useEffect(() => {
    const masterAtt = JSON.parse(localStorage.getItem('dhms_master_attendance') || '[]');
    
    // Extract unique receptionists
    const recsFromAtt = masterAtt
      .filter(a => a.module === 'Receptionist')
      .reduce((acc, curr) => {
        if (!acc.some(s => s.id === curr.staffId)) {
          acc.push({
            id: curr.staffId,
            name: curr.staffName,
            role: curr.role || 'Senior Receptionist',
            email: `${curr.staffName.toLowerCase().replace(/\s+/g, '')}@dhms.org`,
            status: 'Available'
          });
        }
        return acc;
      }, []);

    // Extract unique lab staff
    const labsFromAtt = masterAtt
      .filter(a => a.module === 'Laboratory')
      .reduce((acc, curr) => {
        if (!acc.some(s => s.id === curr.staffId)) {
          acc.push({
            id: curr.staffId,
            name: curr.staffName,
            role: curr.role || 'Lab Technician',
            email: `${curr.staffName.toLowerCase().replace(/\s+/g, '')}@dhms.org`,
            status: 'Available'
          });
        }
        return acc;
      }, []);

    // Extract unique pharmacy staff
    const phrsFromAtt = masterAtt
      .filter(a => a.module === 'Pharmacist')
      .reduce((acc, curr) => {
        if (!acc.some(s => s.id === curr.staffId)) {
          acc.push({
            id: curr.staffId,
            name: curr.staffName,
            role: curr.role || 'Dispensing Pharmacist',
            email: `${curr.staffName.toLowerCase().replace(/\s+/g, '')}@dhms.org`,
            status: 'Available'
          });
        }
        return acc;
      }, []);

    // Extract unique cashier staff
    const cashsFromAtt = masterAtt
      .filter(a => a.module === 'Cashier')
      .reduce((acc, curr) => {
        if (!acc.some(s => s.id === curr.staffId)) {
          acc.push({
            id: curr.staffId,
            name: curr.staffName,
            role: curr.role || 'Billing Specialist',
            email: `${curr.staffName.toLowerCase().replace(/\s+/g, '')}@dhms.org`,
            status: 'Available'
          });
        }
        return acc;
      }, []);

    let recsUpdated = false;
    let labsUpdated = false;
    let phrsUpdated = false;
    let cashsUpdated = false;

    const currentRecs = JSON.parse(localStorage.getItem('dhms_receptionist_staff') || '[]');
    const mergedRecs = [...currentRecs];
    recsFromAtt.forEach(r => {
      if (!mergedRecs.some(m => m.id === r.id)) {
        mergedRecs.push(r);
        recsUpdated = true;
      }
    });

    const currentLabs = JSON.parse(localStorage.getItem('dhms_laboratory_staff') || '[]');
    const mergedLabs = [...currentLabs];
    labsFromAtt.forEach(l => {
      if (!mergedLabs.some(m => m.id === l.id)) {
        mergedLabs.push(l);
        labsUpdated = true;
      }
    });

    const currentPhrs = JSON.parse(localStorage.getItem('dhms_pharmacy_staff') || '[]');
    const mergedPhrs = [...currentPhrs];
    phrsFromAtt.forEach(p => {
      if (!mergedPhrs.some(m => m.id === p.id)) {
        mergedPhrs.push(p);
        phrsUpdated = true;
      }
    });

    const currentCashs = JSON.parse(localStorage.getItem('dhms_cashier_staff') || '[]');
    const mergedCashs = [...currentCashs];
    cashsFromAtt.forEach(c => {
      if (!mergedCashs.some(m => m.id === c.id)) {
        mergedCashs.push(c);
        cashsUpdated = true;
      }
    });

    if (recsUpdated) {
      localStorage.setItem('dhms_receptionist_staff', JSON.stringify(mergedRecs));
      setReceptionistStaff(mergedRecs);
    }
    if (labsUpdated) {
      localStorage.setItem('dhms_laboratory_staff', JSON.stringify(mergedLabs));
      setLaboratoryStaff(mergedLabs);
    }
    if (phrsUpdated) {
      localStorage.setItem('dhms_pharmacy_staff', JSON.stringify(mergedPhrs));
      setPharmacyStaff(mergedPhrs);
    }
    if (cashsUpdated) {
      localStorage.setItem('dhms_cashier_staff', JSON.stringify(mergedCashs));
      setCashierStaff(mergedCashs);
    }
  }, []);

  const activeDocObj = doctorsRoster.find(d => d.id === activeDoctorId) || loggedInDoctor || (doctorsRoster.length > 0 ? doctorsRoster[0] : { id: '', name: 'Unknown Doctor', department: 'Primary Care' });
  const [selectedApptForCheckup, setSelectedApptForCheckup] = useState(null);
  const [selectedEhrPatient, setSelectedEhrPatient] = useState(null);
  const [patientSearch, setPatientSearch] = useState('');

  // Prescription Print & Inpatient Dispatch States
  const [printedPrescriptionData, setPrintedPrescriptionData] = useState(null);
  const [sendInpatientRxToPharmacy, setSendInpatientRxToPharmacy] = useState(true);

  const handlePrintPrescriptionPreview = (targetAppt = null) => {
    const appt = targetAppt || selectedApptForCheckup || activeCallAppt || {
      patientName: "Visiting Patient",
      patientId: "PT-WALK",
      reason: "Consultation"
    };

    let medsToPrint = [...prescribedMeds];
    if (rxDrugName && rxDrugName.trim()) {
      medsToPrint.push({
        id: `RXM-TEMP`,
        name: rxDrugName.trim(),
        dose: rxDose || '500mg',
        frequency: rxFrequency || 'Once Daily (QD)',
        duration: rxDuration || '7 Days',
        instructions: rxInstructions || 'Take with meals',
        cost: rxCost || '25.00'
      });
    }

    let labsToPrint = [...prescribedLabs];
    if (labTestName && labTestName.trim()) {
      labsToPrint.push({
        testName: labTestName.trim(),
        priority: labPriority || 'Routine',
        cost: labCost || '85.00'
      });
    }

    const currentDoc = doctorsRoster.find(d => d.id === activeDoctorId) || activeDocObj || {
      name: "Dr. Attending Physician",
      department: "General Medicine",
      id: "DOC-101"
    };

    setPrintedPrescriptionData({
      doctorName: currentDoc.name || "Dr. Attending Physician",
      doctorDept: currentDoc.department || currentDoc.specialty || "General Medicine",
      doctorReg: currentDoc.id ? `DMC-${currentDoc.id.replace(/[^0-9]/g, '') || '78492'}` : 'DMC-78492',
      patientName: appt.patientName,
      patientId: appt.patientId || "PT-WALK",
      date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
      diagnosis: diagnosisNote || "Clinical assessment completed.",
      symptoms: symptomsNote || "None reported",
      vitals: { bp: vitalBP || '120/80', hr: vitalHR || '72', temp: vitalTemp || '98.6', spo2: vitalSpO2 || '98' },
      medications: medsToPrint,
      labs: labsToPrint,
      isAdmitted: isAdmitted,
      ward: isAdmitted ? admissionWard : null,
      notes: planNote || "Take medicines on schedule and follow-up if symptoms persist."
    });
  };

  // Telemedicine calling states
  const [isVideoCallActive, setIsVideoCallActive] = useState(false);
  const [activeCallAppt, setActiveCallAppt] = useState(null);
  const [callChatMessages, setCallChatMessages] = useState([]);
  const [newCallMessage, setNewCallMessage] = useState('');
  const [teleActiveTab, setTeleActiveTab] = useState('chat');

  useEffect(() => {
    if (role !== 'doctor' || !isVideoCallActive || !activeCallAppt) return;
    const chatKey = `dhms_tele_chat_${activeCallAppt.id}`;
    if (!localStorage.getItem(chatKey)) {
      const initialMsgs = [
        { sender: "doctor", text: `Hello ${activeCallAppt.patientName}, how can I help you today?`, time: "01:50 PM" }
      ];
      localStorage.setItem(chatKey, JSON.stringify(initialMsgs));
    }
    
    const interval = setInterval(() => {
      const msgs = JSON.parse(localStorage.getItem(chatKey) || '[]');
      setCallChatMessages(msgs);
    }, 800);
    return () => clearInterval(interval);
  }, [role, isVideoCallActive, activeCallAppt]);

  const handleSendDoctorChatMessage = (e) => {
    e.preventDefault();
    if (!newCallMessage.trim() || !activeCallAppt) return;
    const chatKey = `dhms_tele_chat_${activeCallAppt.id}`;
    const currentMsgs = JSON.parse(localStorage.getItem(chatKey) || '[]');
    const docMsg = {
      sender: "doctor",
      text: newCallMessage,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    const updated = [...currentMsgs, docMsg];
    localStorage.setItem(chatKey, JSON.stringify(updated));
    setCallChatMessages(updated);
    setNewCallMessage('');
  };

  const renderClinicalForm = (isTele) => {
    // Standard lab test catalog
    const standardTests = [
      { name: 'Complete Blood Count (CBC)', cost: '45.00' },
      { name: 'Lipid Panel', cost: '120.00' },
      { name: 'Thyroid Panel', cost: '85.00' },
      { name: 'Liver Function Test (LFT)', cost: '110.00' },
      { name: 'Kidney Function Test (KFT)', cost: '95.00' },
      { name: 'HbA1c', cost: '60.00' },
      { name: 'Urine Routine & Microscopy', cost: '30.00' },
      { name: 'Electrocardiogram (ECG)', cost: '150.00' },
      { name: 'Chest X-Ray', cost: '200.00' }
    ];

    const pharmacyMeds = JSON.parse(localStorage.getItem('dhms_medications') || '[]');

    const addPrescribedMed = () => {
      if (!rxDrugName.trim()) return;
      const matched = pharmacyMeds.find(m => m.name.toLowerCase() === rxDrugName.toLowerCase());
      const medCost = matched ? matched.price : parseFloat(rxCost) || 25.00;
      
      const newMed = {
        id: `RXM-${Math.floor(100 + Math.random() * 900)}`,
        name: rxDrugName,
        dose: rxDose,
        frequency: rxFrequency,
        duration: rxDuration,
        instructions: rxInstructions,
        cost: medCost
      };
      setPrescribedMeds([...prescribedMeds, newMed]);
      setRxDrugName('');
      setRxCost('25.00');
    };

    const removePrescribedMed = (id) => {
      setPrescribedMeds(prescribedMeds.filter(m => m.id !== id));
    };

    const addPrescribedLab = () => {
      if (!labTestName.trim()) return;
      const matched = standardTests.find(t => t.name.toLowerCase() === labTestName.toLowerCase());
      const testCost = matched ? matched.cost : parseFloat(labCost) || 85.00;

      const newLab = {
        id: `LABT-${Math.floor(100 + Math.random() * 900)}`,
        testName: labTestName,
        priority: labPriority,
        cost: testCost
      };
      setPrescribedLabs([...prescribedLabs, newLab]);
      setLabTestName('');
      setLabCost('85.00');
    };

    const removePrescribedLab = (id) => {
      setPrescribedLabs(prescribedLabs.filter(l => l.id !== id));
    };

    // Vitals indicator helpers
    const getBPAlert = (bpVal) => {
      if (!bpVal) return null;
      const parts = bpVal.split('/');
      if (parts.length === 2) {
        const sys = parseInt(parts[0]);
        const dia = parseInt(parts[1]);
        if (sys >= 140 || dia >= 90) return { label: 'High BP (Hypertension)', color: '#ef4444' };
        if (sys < 90 || dia < 60) return { label: 'Low BP', color: '#3b82f6' };
      }
      return { label: 'Normal BP', color: '#10b981' };
    };

    const getHRAlert = (hrVal) => {
      const hr = parseInt(hrVal);
      if (isNaN(hr)) return null;
      if (hr > 100) return { label: 'Tachycardia', color: '#ef4444' };
      if (hr < 60) return { label: 'Bradycardia', color: '#3b82f6' };
      return { label: 'Normal HR', color: '#10b981' };
    };

    const getTempAlert = (tempVal) => {
      const temp = parseFloat(tempVal);
      if (isNaN(temp)) return null;
      if (temp > 100.4) return { label: 'Fever (Pyrexia)', color: '#ef4444' };
      if (temp < 96.0) return { label: 'Hypothermia', color: '#3b82f6' };
      return { label: 'Normal Temp', color: '#10b981' };
    };

    const getSpO2Alert = (spo2Val) => {
      const spo2 = parseInt(spo2Val);
      if (isNaN(spo2)) return null;
      if (spo2 < 95) return { label: 'Hypoxia (Low O₂)', color: '#ef4444' };
      return { label: 'Normal SpO₂', color: '#10b981' };
    };

    const bpAlert = getBPAlert(vitalBP);
    const hrAlert = getHRAlert(vitalHR);
    const tempAlert = getTempAlert(vitalTemp);
    return (
      <div className="clinical-workspace-form">

        {/* Structured Clinical Notes */}
        <div className="clinical-section">
          <h4 className="section-title"> Clinical Assessment Notes</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div>
              <label className="input-field-label">Chief Complaint & History of Present Illness (HPI)</label>
              <textarea value={symptomsNote} onChange={(e) => setSymptomsNote(e.target.value)} placeholder="Describe patient symptoms, duration, history..." className="clinical-textarea" />
            </div>
            <div>
              <label className="input-field-label">Physical Examination Findings</label>
              <textarea value={examNote} onChange={(e) => setExamNote(e.target.value)} placeholder="Log signs, cardiovascular/pulmonary sounds, abdominal exam..." className="clinical-textarea" />
            </div>
            <div>
              <label className="input-field-label">Clinical Assessment & Diagnosis (Required)</label>
              <textarea required value={diagnosisNote} onChange={(e) => setDiagnosisNote(e.target.value)} placeholder="Enter definitive or differential diagnosis..." className="clinical-textarea" style={{ borderColor: '#6366f1' }} />
            </div>
            <div>
              <label className="input-field-label">Treatment Plan & Recommendations</label>
              <textarea value={planNote} onChange={(e) => setPlanNote(e.target.value)} placeholder="Log dietary changes, resting instructions, lifestyle advice..." className="clinical-textarea" />
            </div>
          </div>
        </div>

        {/* Prescription Builder */}
        <div className="clinical-section">
          <h4 className="section-title"> Prescription Builder</h4>
          <div className="prescription-input-row">
            <div style={{ display: 'flex', flexDirection: 'column', flex: 2 }}>
              <label>Select Drug</label>
              <input 
                type="text" 
                className="clinical-input"
                list="pharmacy-meds-datalist" 
                placeholder="Search or enter drug name" 
                value={rxDrugName} 
                onChange={(e) => {
                  setRxDrugName(e.target.value);
                  const matched = pharmacyMeds.find(m => m.name.toLowerCase() === e.target.value.toLowerCase());
                  if (matched) {
                    setRxCost(matched.price.toString());
                  }
                }}
              />
              <datalist id="pharmacy-meds-datalist">
                {pharmacyMeds.map(m => (
                  <option key={m.id} value={m.name}>{m.genericName} - Stock: {m.stock}</option>
                ))}
              </datalist>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
              <label>Dose</label>
              <input type="text" className="clinical-input" placeholder="e.g. 500mg" value={rxDose} onChange={(e) => setRxDose(e.target.value)} />
            </div>
          </div>

          <div className="prescription-input-row" style={{ marginTop: '8px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
              <label>Frequency</label>
              <select className="clinical-select" value={rxFrequency} onChange={(e) => setRxFrequency(e.target.value)}>
                <option value="Once Daily (QD)">Once Daily (QD)</option>
                <option value="Twice Daily (BID)">Twice Daily (BID)</option>
                <option value="Three Times Daily (TID)">Three Times Daily (TID)</option>
                <option value="Four Times Daily (QID)">Four Times Daily (QID)</option>
                <option value="As Needed (PRN)">As Needed (PRN)</option>
                <option value="Bedtime (HS)">Bedtime (HS)</option>
              </select>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
              <label>Duration</label>
              <input type="text" className="clinical-input" placeholder="e.g. 7 Days" value={rxDuration} onChange={(e) => setRxDuration(e.target.value)} />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px', marginTop: '8px', alignItems: 'flex-end' }}>
            <div style={{ display: 'flex', flexDirection: 'column', flex: 2 }}>
              <label>Instructions</label>
              <input type="text" className="clinical-input" placeholder="Take with food, etc." value={rxInstructions} onChange={(e) => setRxInstructions(e.target.value)} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
              <label>Price (₹)</label>
              <input type="text" className="clinical-input" value={rxCost} onChange={(e) => setRxCost(e.target.value)} />
            </div>
            <button type="button" onClick={addPrescribedMed} className="btn-action-outline">Add Med</button>
            <button type="button" onClick={() => handlePrintPrescriptionPreview()} className="btn-action-outline" style={{ background: '#e0e7ff', color: '#4338ca', borderColor: '#c7d2fe', fontWeight: 'bold' }}>🖨️ Print Rx Slip</button>
          </div>

          {/* Prescribed Meds List */}
          {prescribedMeds.length > 0 && (
            <div className="item-basket">
              <h5>Current Prescription Basket ({prescribedMeds.length})</h5>
              <table className="basket-table">
                <thead>
                  <tr>
                    <th>Medication</th>
                    <th>Frequency</th>
                    <th>Duration</th>
                    <th>Cost</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {prescribedMeds.map(m => (
                    <tr key={m.id}>
                      <td><strong>{m.name}</strong> - {m.dose} <br/><small style={{ color: '#64748b' }}>{m.instructions}</small></td>
                      <td>{m.frequency}</td>
                      <td>{m.duration}</td>
                      <td>₹{parseFloat(m.cost).toFixed(2)}</td>
                      <td><button type="button" onClick={() => removePrescribedMed(m.id)} className="btn-remove-item">✕</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Labs Section */}
        <div className="clinical-section">
          <h4 className="section-title">Diagnostic Lab Orders</h4>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
            <div style={{ display: 'flex', flexDirection: 'column', flex: 2 }}>
              <label>Lab Test Name</label>
              <input 
                type="text" 
                className="clinical-input"
                list="standard-labs-datalist" 
                placeholder="Search or enter test name" 
                value={labTestName} 
                onChange={(e) => {
                  setLabTestName(e.target.value);
                  const matched = standardTests.find(t => t.name.toLowerCase() === e.target.value.toLowerCase());
                  if (matched) {
                    setLabCost(matched.cost);
                  }
                }}
              />
              <datalist id="standard-labs-datalist">
                {standardTests.map((t, idx) => (
                  <option key={idx} value={t.name}>₹{t.cost}</option>
                ))}
              </datalist>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
              <label>Priority</label>
              <select className="clinical-select" value={labPriority} onChange={(e) => setLabPriority(e.target.value)}>
                <option value="Routine">Routine</option>
                <option value="STAT / Urgent">STAT / Urgent</option>
              </select>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
              <label>Cost (₹)</label>
              <input type="text" className="clinical-input" value={labCost} onChange={(e) => setLabCost(e.target.value)} />
            </div>
            <button type="button" onClick={addPrescribedLab} className="btn-action-outline">Add Test</button>
            <button type="button" onClick={() => setPrescribedLabs([{ name: "No Test Recommended", priority: "Routine", cost: "0.00" }])} className="btn-action-outline" style={{ borderColor: '#e2e8f0', background: '#f8fafc', color: '#64748b' }}>No Test Recommended</button>
          </div>

          {/* Prescribed Labs List */}
          {prescribedLabs.length > 0 && (
            <div className="item-basket">
              <h5>Current Diagnostics ordered ({prescribedLabs.length})</h5>
              <table className="basket-table">
                <thead>
                  <tr>
                    <th>Test Name</th>
                    <th>Priority</th>
                    <th>Cost</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {prescribedLabs.map((l, idx) => (
                    <tr key={idx}>
                      <td><strong>{l.testName}</strong></td>
                      <td><span className={`lab-priority-pill ${l.priority.toLowerCase().replace(/\s/g, '')}`}>{l.priority}</span></td>
                      <td>₹{parseFloat(l.cost).toFixed(2)}</td>
                      <td><button type="button" onClick={() => removePrescribedLab(l.id || idx)} className="btn-remove-item">✕</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Admission & Referral Row */}
        <div style={{ display: 'grid', gridTemplateColumns: isTele ? '1fr' : '1fr 1fr', gap: '16px' }}>
          {/* Admission details */}
          <div className="clinical-section">
            <h4 className="section-title">Inpatient Admission Recommendations</h4>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <input type="checkbox" id="admit-patient-chk" checked={isAdmitted} onChange={(e) => setIsAdmitted(e.target.checked)} />
              <label htmlFor="admit-patient-chk" style={{ fontWeight: '600', fontSize: '13px', cursor: 'pointer' }}>Recommend Hospital Admission</label>
            </div>
            {isAdmitted && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', animation: 'fadeIn 0.2s' }}>
                <div>
                  <label style={{ fontSize: '11px', color: '#475569' }}>Select Ward / Unit</label>
                  <select className="clinical-select" value={admissionWard} onChange={(e) => setAdmissionWard(e.target.value)}>
                    <option value="General Ward A">General Ward A</option>
                    <option value="General Ward B">General Ward B</option>
                    <option value="ICU (Intensive Care)">ICU (Intensive Care)</option>
                    <option value="Pediatrics Ward">Pediatrics Ward</option>
                    <option value="Semi-Private Ward C">Semi-Private Ward C</option>
                    <option value="Private Suite 101">Private Suite 101</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '11px', color: '#475569' }}>Admission Clinical Indication Notes</label>
                  <textarea value={admissionNotes} onChange={(e) => setAdmissionNotes(e.target.value)} placeholder="E.g., Severe respiratory distress requiring oxygen therapy..." className="clinical-textarea" style={{ minHeight: '60px' }} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px', background: '#f0fdf4', padding: '8px 12px', borderRadius: '6px', border: '1px solid #bbf7d0' }}>
                  <input type="checkbox" id="send-pharmacy-inpatient" checked={sendInpatientRxToPharmacy} onChange={(e) => setSendInpatientRxToPharmacy(e.target.checked)} />
                  <label htmlFor="send-pharmacy-inpatient" style={{ fontWeight: '600', fontSize: '12px', color: '#166534', cursor: 'pointer' }}>
                    🚀 Send Inpatient Rx Order to Hospital Pharmacy (Ward Delivery)
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* Referral details */}
          <div className="clinical-section">
            <h4 className="section-title"> Specialist Referrals</h4>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <input type="checkbox" id="refer-patient-chk" checked={isReferred} onChange={(e) => setIsReferred(e.target.checked)} />
              <label htmlFor="refer-patient-chk" style={{ fontWeight: '600', fontSize: '13px', cursor: 'pointer' }}>Refer to Specialist</label>
            </div>
            {isReferred && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', animation: 'fadeIn 0.2s' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <div>
                    <label style={{ fontSize: '11px', color: '#475569' }}>Department</label>
                    <select 
                      className="clinical-select"
                      value={referralDept} 
                      onChange={(e) => {
                        setReferralDept(e.target.value);
                        // Auto select first doctor in that department
                        const matchingDoc = doctorsRoster.find(d => d.department === e.target.value);
                        if (matchingDoc) setReferralDoc(matchingDoc.name);
                      }} 
                    >
                      {departmentsList.map(d => (
                        <option key={d.id} value={d.name}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', color: '#475569' }}>Consultant</label>
                    <select className="clinical-select" value={referralDoc} onChange={(e) => setReferralDoc(e.target.value)}>
                      {doctorsRoster.filter(d => d.department === referralDept).map(d => (
                        <option key={d.id} value={d.name}>{d.name}</option>
                      ))}
                      {doctorsRoster.filter(d => d.department === referralDept).length === 0 && (
                        <option value="Duty Doctor">On-Duty Specialist</option>
                      )}
                    </select>
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: '11px', color: '#475569' }}>Referral Reason</label>
                  <textarea value={referralReason} onChange={(e) => setReferralReason(e.target.value)} placeholder="Clinical reason for specialist consultation..." className="clinical-textarea" style={{ minHeight: '60px' }} />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const handleTeleCheckupSubmit = (e) => {
    e.preventDefault();
    if (!activeCallAppt) return;
    
    const todayStr = new Date().toISOString().split('T')[0];
    const currentDoc = DOCTORS.find(d => d.id === activeDoctorId) || DOCTORS[0];

    // If doctor typed a drug/test details but forgot to hit "Add", auto-append it
    let finalMeds = [...prescribedMeds];
    if (rxDrugName.trim()) {
      finalMeds.push({
        id: `MED-${Math.floor(100 + Math.random() * 900)}`,
        name: rxDrugName,
        dose: rxDose,
        frequency: rxFrequency,
        duration: rxDuration,
        instructions: rxInstructions,
        cost: rxCost
      });
    }

    let finalLabs = [...prescribedLabs];
    if (labTestName.trim()) {
      finalLabs.push({
        testName: labTestName,
        priority: labPriority,
        cost: labCost
      });
    }

    // 1. Update appointment status
    const updatedAppts = appointments.map(appt => {
      if (appt.id === activeCallAppt.id) {
        return { 
          ...appt, 
          status: 'Completed',
          diagnosis: diagnosisNote || 'Telemedicine consultation completed.',
          vitals: { bp: vitalBP, hr: vitalHR, temp: vitalTemp, spo2: vitalSpO2 }
        };
      }
      return appt;
    });
    setAppointments(updatedAppts);
    localStorage.setItem('dhms_appointments', JSON.stringify(updatedAppts));

    // 2. Update patient medical file
    const updatedPatients = patients.map(p => {
      if (p.id === activeCallAppt.patientId) {
        const historyEntry = {
          date: todayStr,
          doctor: currentDoc.name,
          diagnosis: diagnosisNote || 'Telemedicine consultation completed.',
          reason: activeCallAppt.reason,
          vitals: { bp: vitalBP, hr: vitalHR, temp: vitalTemp, spo2: vitalSpO2 },
          symptoms: symptomsNote || 'None reported',
          physicalExam: examNote || 'Normal findings',
          plan: planNote || 'Follow up as needed',
          prescriptions: finalMeds.map(m => `${m.name} ${m.dose} - ${m.frequency} (${m.duration})`),
          labs: finalLabs.map(l => `${l.testName} [${l.priority}]`),
          isAdmitted: isAdmitted,
          admissionWard: isAdmitted ? admissionWard : null,
          isReferred: isReferred,
          referral: isReferred ? { department: referralDept, doctor: referralDoc, reason: referralReason } : null
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

    // 3. Create prescription if filled
    if (finalMeds.length > 0) {
      const rxList = JSON.parse(localStorage.getItem('dhms_prescriptions') || '[]');
      const newRxs = finalMeds.map(med => ({
        id: `RX-${Math.floor(1000 + Math.random() * 9000)}`,
        patientId: activeCallAppt.patientId,
        patientName: activeCallAppt.patientName,
        medication: `${med.name} ${med.dose} (${med.frequency}, ${med.duration})`,
        doctorName: currentDoc.name,
        date: todayStr,
        cost: `${parseFloat(med.cost || 25.00).toFixed(2)}`,
        status: isAdmitted ? 'Advised' : 'Pending',
        instructions: med.instructions,
        type: isAdmitted ? 'Inpatient' : 'Outpatient'
      }));
      const finalRx = [...newRxs, ...rxList];
      localStorage.setItem('dhms_prescriptions', JSON.stringify(finalRx));
      setPrescriptions(finalRx);
    }

    // 4. Create lab request if filled
    if (finalLabs.length > 0) {
      const labList = JSON.parse(localStorage.getItem('dhms_lab_requests') || '[]');
      const newLabs = finalLabs.map(lab => ({
        id: `LAB-${Math.floor(1000 + Math.random() * 9000)}`,
        patientId: activeCallAppt.patientId,
        patientName: activeCallAppt.patientName,
        testName: `${lab.testName} (${lab.priority} Priority)`,
        doctorName: currentDoc.name,
        date: todayStr,
        cost: `${parseFloat(lab.cost || 85.00).toFixed(2)}`,
        status: 'Pending'
      }));
      const finalLab = [...newLabs, ...labList];
      localStorage.setItem('dhms_lab_requests', JSON.stringify(finalLab));
      setLabRequests(finalLab);
    }

    // Save Admission details if admitted
    if (isAdmitted) {
      const adms = JSON.parse(localStorage.getItem('dhms_admissions') || '[]');
      const newAdm = {
        id: `ADM-${Math.floor(1000 + Math.random() * 9000)}`,
        patientId: activeCallAppt.patientId,
        patientName: activeCallAppt.patientName,
        doctorName: currentDoc.name,
        admissionDate: todayStr,
        dischargeDate: null,
        ward: admissionWard,
        notes: admissionNotes || 'Admitted from consultation.',
        status: 'Admitted',
        medications: finalMeds.map(med => ({
          name: `${med.name} ${med.dose}`,
          instructions: med.instructions,
          cost: parseFloat(med.cost) || 0.00,
          status: 'Advised',
          date: todayStr
        })),
        pharmacyBillPaid: false
      };
      const finalAdms = [newAdm, ...adms];
      localStorage.setItem('dhms_admissions', JSON.stringify(finalAdms));
    }

    // 5. Create billing invoice
    const billing = JSON.parse(localStorage.getItem('dhms_billing') || '[]');
    const newConsultationInvoice = {
      id: `INV-${Math.floor(1000 + Math.random() * 9000)}`,
      patientId: activeCallAppt.patientId,
      patientName: activeCallAppt.patientName,
      date: todayStr,
      amount: '₹150.00',
      status: 'Unpaid',
      type: 'Telemedicine consultation Fee'
    };
    const updatedBillingList = [newConsultationInvoice, ...billing];
    localStorage.setItem('dhms_billing', JSON.stringify(updatedBillingList));
    setBillingList(updatedBillingList);

    // Reset forms and close call
    setDiagnosisNote('');
    setVitalBP('120/80');
    setVitalHR('72');
    setVitalTemp('98.6');
    setVitalSpO2('98');
    setRxDrugName('');
    setLabTestName('');
    setSymptomsNote('');
    setExamNote('');
    setPlanNote('');
    setPrescribedMeds([]);
    setPrescribedLabs([]);
    setIsReferred(false);
    setIsVideoCallActive(false);
    setActiveCallAppt(null);
    if (window.Swal) {
      window.Swal.fire({
        title: 'Consultation Completed',
        text: 'Telemedicine consultation completed and billed successfully.',
        icon: 'success',
        confirmButtonColor: '#10b981'
      });
    } else {
      alert('Telemedicine consultation completed and billed successfully.');
    }
  };

  const handleEndCall = () => {
    if (!activeCallAppt) return;
    const updated = appointments.map(appt => {
      if (appt.id === activeCallAppt.id) {
        return { ...appt, status: 'Completed' };
      }
      return appt;
    });
    setAppointments(updated);
    localStorage.setItem('dhms_appointments', JSON.stringify(updated));
    setIsVideoCallActive(false);
    setActiveCallAppt(null);
    if (window.Swal) {
      window.Swal.fire({
        title: 'Session Ended',
        text: 'Telemedicine session ended. The patient must book a new appointment to reconnect.',
        icon: 'info',
        confirmButtonColor: '#3b82f6'
      });
    } else {
      alert('Telemedicine session ended. The patient must book a new appointment to reconnect.');
    }
  };

  // Checkup Consultation Forms
  const [diagnosisNote, setDiagnosisNote] = useState('');
  const [vitalBP, setVitalBP] = useState('120/80');
  const [vitalHR, setVitalHR] = useState('72');
  const [vitalTemp, setVitalTemp] = useState('98.6');
  const [vitalSpO2, setVitalSpO2] = useState('98');

  // Detailed clinical structured notes
  const [symptomsNote, setSymptomsNote] = useState('');
  const [examNote, setExamNote] = useState('');
  const [planNote, setPlanNote] = useState('');

  // Collections for multiple items
  const [prescribedMeds, setPrescribedMeds] = useState([]);
  const [prescribedLabs, setPrescribedLabs] = useState([]);

  // Detailed Rx builder temporary item states
  const [rxDrugName, setRxDrugName] = useState('');
  const [rxDose, setRxDose] = useState('500mg');
  const [rxFrequency, setRxFrequency] = useState('Once Daily (QD)');
  const [rxDuration, setRxDuration] = useState('7 Days');
  const [rxCost, setRxCost] = useState('25.00');
  const [rxInstructions, setRxInstructions] = useState('Take with meals');

  // Lab order builder temporary item states
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

  // Referral States
  const [isReferred, setIsReferred] = useState(false);
  const [referralDept, setReferralDept] = useState('Cardiology');
  const [referralDoc, setReferralDoc] = useState('Dr. Gregory House');
  const [referralReason, setReferralReason] = useState('');

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

  useEffect(() => {
    const handleStorageChange = () => {
      setAppointments(JSON.parse(localStorage.getItem('dhms_appointments') || '[]'));
      setPatients(JSON.parse(localStorage.getItem('dhms_patients') || '[]'));
      setPrescriptions(JSON.parse(localStorage.getItem('dhms_prescriptions') || '[]'));
      setLabRequests(JSON.parse(localStorage.getItem('dhms_lab_requests') || '[]'));
      setBillingList(JSON.parse(localStorage.getItem('dhms_billing') || '[]'));
      setAdmissions(JSON.parse(localStorage.getItem('dhms_admissions') || '[]'));
      setDoctorsRoster(JSON.parse(localStorage.getItem('dhms_doctors') || '[]'));
      setDepartmentsList(JSON.parse(localStorage.getItem('dhms_departments') || '[]'));
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

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

  const resetClinicalForm = () => {
    setSelectedApptForCheckup(null);
    setIsVideoCallActive(false);
    setActiveCallAppt(null);
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
    setSymptomsNote('');
    setExamNote('');
    setPlanNote('');
    setPrescribedMeds([]);
    setPrescribedLabs([]);
    setIsReferred(false);
    setReferralDept('Cardiology');
    setReferralDoc('Dr. Gregory House');
    setReferralReason('');
  };

  const handleOpenCheckupModal = (appt) => {
    resetClinicalForm();
    setSelectedApptForCheckup(appt);
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
    if (e) e.preventDefault();
    const apptToComplete = selectedApptForCheckup || activeCallAppt;
    if (!apptToComplete) {
      resetClinicalForm();
      return;
    }

    try {
      const currentDoc = DOCTORS.find(d => d.id === activeDoctorId) || DOCTORS[0];
      const todayStr = new Date().toISOString().split('T')[0];

      // If doctor typed a drug/test details but forgot to hit "Add", auto-append it
      let finalMeds = [...prescribedMeds];
      if (rxDrugName && rxDrugName.trim()) {
        finalMeds.push({
          id: `MED-${Math.floor(100 + Math.random() * 900)}`,
          name: rxDrugName.trim(),
          dose: rxDose || '500mg',
          frequency: rxFrequency || 'Once Daily (QD)',
          duration: rxDuration || '7 Days',
          instructions: rxInstructions || 'Take with meals',
          cost: parseFloat(rxCost) || 25.00
        });
      }

      let finalLabs = [...prescribedLabs];
      if (labTestName && labTestName.trim()) {
        finalLabs.push({
          testName: labTestName.trim(),
          priority: labPriority || 'Routine',
          cost: parseFloat(labCost) || 85.00
        });
      }

      const updatedAppts = appointments.map(appt => {
        if (appt.id === apptToComplete.id) {
          return { 
            ...appt, 
            status: 'Completed',
            diagnosis: diagnosisNote || 'Routine consultation completed.',
            vitals: { bp: vitalBP || '120/80', hr: vitalHR || '72', temp: vitalTemp || '98.6', spo2: vitalSpO2 || '98' }
          };
        }
        return appt;
      });
      setAppointments(updatedAppts);
      localStorage.setItem('dhms_appointments', JSON.stringify(updatedAppts));

      const updatedPatients = patients.map(p => {
        if (p.id === apptToComplete.patientId || p.name === apptToComplete.patientName) {
          const historyEntry = {
            date: todayStr,
            doctor: currentDoc.name,
            diagnosis: diagnosisNote || 'Routine checkup completed.',
            reason: apptToComplete.reason || 'Checkup',
            vitals: { bp: vitalBP || '120/80', hr: vitalHR || '72', temp: vitalTemp || '98.6', spo2: vitalSpO2 || '98' },
            symptoms: symptomsNote || 'None reported',
            physicalExam: examNote || 'Normal findings',
            plan: planNote || 'Follow up as needed',
            prescriptions: finalMeds.map(m => `${m.name} ${m.dose || ''} - ${m.frequency || ''} (${m.duration || ''})`),
            labs: finalLabs.map(l => `${l.testName} [${l.priority || 'Routine'}]`),
            isAdmitted: !!isAdmitted,
            admissionWard: isAdmitted ? admissionWard : null,
            isReferred: !!isReferred,
            referral: isReferred ? { department: referralDept, doctor: referralDoc, reason: referralReason } : null
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

      // Save prescriptions to dhms_prescriptions
      if (finalMeds.length > 0) {
        const rxList = JSON.parse(localStorage.getItem('dhms_prescriptions') || '[]');
        const isAdmittedPatient = !!isAdmitted;
        const newRxs = finalMeds.map(med => ({
          id: `RX-${Math.floor(1000 + Math.random() * 9000)}`,
          patientId: apptToComplete.patientId || 'PT-GEN',
          patientName: apptToComplete.patientName || 'Patient',
          medication: `${med.name} ${med.dose || ''} (${med.frequency || ''}, ${med.duration || ''})`,
          doctorName: currentDoc.name,
          date: todayStr,
          cost: `${parseFloat(med.cost || 25.00).toFixed(2)}`,
          status: isAdmittedPatient ? (sendInpatientRxToPharmacy ? 'Pending Ward Delivery' : 'Advised') : 'Given to Patient (OPD)',
          instructions: med.instructions || 'Take as advised',
          type: isAdmittedPatient ? 'Inpatient' : 'Outpatient',
          ward: isAdmittedPatient ? (admissionWard || 'General Ward A') : null,
          directPharmacyDispatch: isAdmittedPatient && sendInpatientRxToPharmacy
        }));
        const finalRx = [...newRxs, ...rxList];
        localStorage.setItem('dhms_prescriptions', JSON.stringify(finalRx));
        setPrescriptions(finalRx);
      }

      // Save Admission details if admitted
      if (isAdmitted) {
        const adms = JSON.parse(localStorage.getItem('dhms_admissions') || '[]');
        const newAdm = {
          id: `ADM-${Math.floor(1000 + Math.random() * 9000)}`,
          patientId: apptToComplete.patientId || 'PT-GEN',
          patientName: apptToComplete.patientName || 'Patient',
          doctorName: currentDoc.name,
          admissionDate: todayStr,
          dischargeDate: null,
          ward: admissionWard || 'General Ward A',
          notes: admissionNotes || 'Admitted from consultation.',
          status: 'Pending IPD Desk Admission',
          medications: finalMeds.map(med => ({
            name: `${med.name} ${med.dose || ''}`,
            instructions: med.instructions || '',
            cost: parseFloat(med.cost) || 0.00,
            status: sendInpatientRxToPharmacy ? 'Pending Ward Delivery' : 'Advised',
            date: todayStr
          })),
          pharmacyBillPaid: false
        };
        const finalAdms = [newAdm, ...adms];
        localStorage.setItem('dhms_admissions', JSON.stringify(finalAdms));
        setAdmissions(finalAdms);
      }

      // Save laboratory requests
      if (finalLabs.length > 0) {
        const labList = JSON.parse(localStorage.getItem('dhms_lab_requests') || '[]');
        const newLabs = finalLabs.map(lab => ({
          id: `LAB-${Math.floor(1000 + Math.random() * 9000)}`,
          patientId: apptToComplete.patientId || 'PT-GEN',
          patientName: apptToComplete.patientName || 'Patient',
          testName: `${lab.testName} (${lab.priority || 'Routine'} Priority)`,
          doctorName: currentDoc.name,
          date: todayStr,
          cost: `${parseFloat(lab.cost || 85.00).toFixed(2)}`,
          status: 'Pending'
        }));
        const finalLab = [...newLabs, ...labList];
        localStorage.setItem('dhms_lab_requests', JSON.stringify(finalLab));
        setLabRequests(finalLab);
      }

      // Create billing invoice for consultation ONLY if not already paid upfront at reception
      if (apptToComplete.feeStatus !== 'Paid') {
        const billing = JSON.parse(localStorage.getItem('dhms_billing') || '[]');
        const feeAmount = apptToComplete.consultationFee || '₹250.00';
        const newConsultationInvoice = {
          id: `INV-${Math.floor(1000 + Math.random() * 9000)}`,
          patientId: apptToComplete.patientId || 'PT-GEN',
          patientName: apptToComplete.patientName || 'Patient',
          date: todayStr,
          amount: feeAmount.startsWith('₹') ? feeAmount : `₹${feeAmount}`,
          status: 'Unpaid',
          type: 'Doctor Consultation Fee'
        };
        const updatedBillingList = [newConsultationInvoice, ...billing];
        localStorage.setItem('dhms_billing', JSON.stringify(updatedBillingList));
        setBillingList(updatedBillingList);
      }

      if (window.dispatchEvent) {
        window.dispatchEvent(new Event('storage'));
      }
    } catch (err) {
      console.error("Error saving checkup:", err);
    } finally {
      resetClinicalForm();
      if (window.Swal) {
        window.Swal.fire({
          title: 'Checkup Completed',
          text: 'Checkup clinical log completed and billed successfully.',
          icon: 'success',
          confirmButtonColor: '#10b981'
        });
      } else {
        alert('Checkup clinical log completed and billed successfully.');
      }
    }
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
    const indianPhoneRegex = /^(?:\+91|91|0)?[6-9]\d{9}$/;
    if (newDocPhone.trim() && !indianPhoneRegex.test(newDocPhone.trim().replace(/[\s\-]/g, ''))) {
      alert("Please enter a valid 10-digit Indian phone number.");
      return;
    }

    const idStr = `dr_${newDocName.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${Math.floor(100 + Math.random() * 900)}`;
    const newDoc = {
      id: idStr,
      name: newDocName.startsWith('Dr.') ? newDocName : `Dr. ${newDocName}`,
      department: newDocDept,
      status: newDocStatus,
      email: newDocEmail || `${newDocName.toLowerCase().replace(/\s+/g, '')}@dhms.org`,
      password: newDocPassword,
      phone: newDocPhone || '+1 (555) 000-0000'
    };
    const updated = [...doctorsRoster, newDoc];
    setDoctorsRoster(updated);
    localStorage.setItem('dhms_doctors', JSON.stringify(updated));
    setNewDocName('');
    setNewDocEmail('');
    setNewDocPhone('');
    setNewDocPassword('');
    setShowAddDoctorModal(false);
    alert(`${newDoc.name} added to hospital doctors roster.`);
  };

  const handleToggleDoctorStatus = (docId, newStatus) => {
    const updated = doctorsRoster.map(d => d.id === docId ? { ...d, status: newStatus } : d);
    setDoctorsRoster(updated);
    localStorage.setItem('dhms_doctors', JSON.stringify(updated));
  };

  const handleToggleRecStaffStatus = (staffId, newStatus) => {
    const updated = receptionistStaff.map(s => s.id === staffId ? { ...s, status: newStatus } : s);
    setReceptionistStaff(updated);
    localStorage.setItem('dhms_receptionist_staff', JSON.stringify(updated));
  };

  const handleToggleLabStaffStatus = (staffId, newStatus) => {
    const updated = laboratoryStaff.map(s => s.id === staffId ? { ...s, status: newStatus } : s);
    setLaboratoryStaff(updated);
    localStorage.setItem('dhms_laboratory_staff', JSON.stringify(updated));
  };

  const handleTogglePharmacyStaffStatus = (staffId, newStatus) => {
    const updated = pharmacyStaff.map(s => s.id === staffId ? { ...s, status: newStatus } : s);
    setPharmacyStaff(updated);
    localStorage.setItem('dhms_pharmacy_staff', JSON.stringify(updated));
  };

  const handleToggleCashierStaffStatus = (staffId, newStatus) => {
    const updated = cashierStaff.map(s => s.id === staffId ? { ...s, status: newStatus } : s);
    setCashierStaff(updated);
    localStorage.setItem('dhms_cashier_staff', JSON.stringify(updated));
  };

  const handleDeleteDoctor = (docId) => {
    if (window.confirm("Are you sure you want to delete this doctor?")) {
      const updated = doctorsRoster.filter(d => d.id !== docId);
      setDoctorsRoster(updated);
      localStorage.setItem('dhms_doctors', JSON.stringify(updated));
    }
  };

  const handleDeleteRecStaff = (staffId) => {
    if (window.confirm("Are you sure you want to delete this receptionist staff member?")) {
      const updated = receptionistStaff.filter(s => s.id !== staffId);
      setReceptionistStaff(updated);
      localStorage.setItem('dhms_receptionist_staff', JSON.stringify(updated));
    }
  };

  const handleDeleteLabStaff = (staffId) => {
    if (window.confirm("Are you sure you want to delete this laboratory staff member?")) {
      const updated = laboratoryStaff.filter(s => s.id !== staffId);
      setLaboratoryStaff(updated);
      localStorage.setItem('dhms_laboratory_staff', JSON.stringify(updated));
    }
  };

  const handleDeletePharmacyStaff = (staffId) => {
    if (window.confirm("Are you sure you want to delete this pharmacy staff member?")) {
      const updated = pharmacyStaff.filter(s => s.id !== staffId);
      setPharmacyStaff(updated);
      localStorage.setItem('dhms_pharmacy_staff', JSON.stringify(updated));
    }
  };

  const handleDeleteCashierStaff = (staffId) => {
    if (window.confirm("Are you sure you want to delete this cashier staff member?")) {
      const updated = cashierStaff.filter(s => s.id !== staffId);
      setCashierStaff(updated);
      localStorage.setItem('dhms_cashier_staff', JSON.stringify(updated));
    }
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
          { id: 'receptionist_staff', label: 'Receptionist Staff' },
          { id: 'laboratory_staff', label: 'Laboratory Staff' },
          { id: 'pharmacy_staff', label: 'Pharmacy Staff' },
          { id: 'cashier_staff', label: 'Cash Counter Staff' },
          { id: 'pharmacy', label: 'Pharmacy Stock' },
          { id: 'attendance', label: 'Attendance & Absentees' },
          { id: 'transfer_authority', label: 'Transfer Authority' }
        ];
      case 'doctor':
        return [
          { id: 'overview', label: 'My Dashboard' },
          { id: 'patients', label: 'Patient EHR Records' },
          { id: 'appointments', label: 'Appointments' },
          { id: 'inpatient_ward', label: ' Inpatient (IPD) Ward' },
          { id: 'slot_management', label: 'Manage Slot Capacity' },
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
      const cleanAmount = (amtStr) => parseFloat((amtStr || '').replace(/[^0-9.]/g, '').trim()) || 0;
      const totalRev = billingList.filter(i => i.status === 'Paid').reduce((sum, i) => sum + cleanAmount(i.amount), 0);
      const meds = JSON.parse(localStorage.getItem('dhms_medications') || '[]');
      const lowStockCount = meds.filter(m => m.stock <= (m.lowStockThreshold || 15)).length;

      const masterAtt = JSON.parse(localStorage.getItem('dhms_master_attendance') || '[]');
      const todayStr = new Date().toISOString().split('T')[0];
      const countPresent = (moduleName) => {
        return masterAtt.filter(a => a.date === todayStr && a.module === moduleName && (a.status === 'Present' || a.status === 'Late')).length;
      };
      
      const doctorsPresent = countPresent('Doctor');
      const receptionistsPresent = countPresent('Receptionist');
      const labStaffPresent = countPresent('Laboratory');
      const pharmacistsPresent = countPresent('Pharmacist');
      const cashiersPresent = countPresent('Cashier');

      return (
        <>
          <p style={{ color: '#475569', fontSize: '15px' }}>
            Welcome <strong>Administrator</strong>. Executive Operations Console connecting hospital departments, doctors roster, pharmacy inventory, and shift attendance tracker.
          </p>

          <div style={{ marginTop: '16px', marginBottom: '20px', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '12px', padding: '16px' }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '6px' }}>
              Staff Presence Summary (Today: {todayStr})
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px' }}>
              <div style={{ background: 'white', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 'bold', marginTop: '2px' }}>Doctors</div>
                <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#10b981' }}>{doctorsPresent} Present</div>
              </div>
              <div style={{ background: 'white', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 'bold', marginTop: '2px' }}>Receptionists</div>
                <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#3b82f6' }}>{receptionistsPresent} Present</div>
              </div>
              <div style={{ background: 'white', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 'bold', marginTop: '2px' }}>Lab Staff</div>
                <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#6366f1' }}>{labStaffPresent} Present</div>
              </div>
              <div style={{ background: 'white', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 'bold', marginTop: '2px' }}>Pharmacists</div>
                <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#10b981' }}>{pharmacistsPresent} Present</div>
              </div>
              <div style={{ background: 'white', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 'bold', marginTop: '2px' }}>Cashiers</div>
                <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#f59e0b' }}>{cashiersPresent} Present</div>
              </div>
            </div>
          </div>
          
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

            <div className="stat-card" style={{ borderLeft: '4px solid #ec4899', cursor: 'pointer' }} onClick={() => setActiveView('pharmacy')}>
              <h3>Pharmacy & Stock</h3>
              <div className="stat-value">{meds.length} Meds</div>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                <span style={{ color: lowStockCount > 0 ? '#ef4444' : '#10b981', fontWeight: '600' }}>{lowStockCount} Low Stock Items</span>
              </div>
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
        </>
      );
    } else if (role === 'doctor') {
      const activeDoctor = doctorsRoster.find(d => d.id === activeDoctorId) || doctorsRoster[0] || { name: 'Doctor' };
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
                      <td style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <select 
                          value={d.status} 
                          onChange={(e) => handleToggleDoctorStatus(d.id, e.target.value)}
                          style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                        >
                          <option value="Available">Available</option>
                          <option value="On Leave">On Leave</option>
                          <option value="In Surgery">In Surgery</option>
                        </select>
                        <button 
                          onClick={() => handleDeleteDoctor(d.id)}
                          style={{ padding: '4px 8px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}
                        >
                          Delete
                        </button>
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
                    <div>
                      <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569' }}>Password</label>
                      <input type="password" required value={newDocPassword} onChange={(e) => setNewDocPassword(e.target.value)} placeholder="••••••••" style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', marginTop: '4px', boxSizing: 'border-box' }} />
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

      case 'receptionist_staff':
        return (
          <div className="module-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h2>Receptionist Staff Roster</h2>
                <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>Manage front desk receptionist staff, active statuses, and assignments.</p>
              </div>
            </div>

            <table className="data-table">
              <thead>
                <tr>
                  <th>Staff ID</th>
                  <th>Staff Name</th>
                  <th>Designation / Role</th>
                  <th>Contact Email</th>
                  <th>Active Duty Status</th>
                  {role === 'admin' && <th>Quick Action</th>}
                </tr>
              </thead>
              <tbody>
                {receptionistStaff.map(s => (
                  <tr key={s.id}>
                    <td><strong>{s.id}</strong></td>
                    <td><strong>{s.name}</strong></td>
                    <td><span style={{ background: '#f1f5f9', padding: '4px 8px', borderRadius: '4px', fontSize: '12px' }}>{s.role}</span></td>
                    <td>{s.email}</td>
                    <td>
                      <span className={`status-badge ${s.status === 'Available' ? 'available' : 'leave'}`}>
                        {s.status}
                      </span>
                    </td>
                    {role === 'admin' && (
                      <td style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <select 
                          value={s.status} 
                          onChange={(e) => handleToggleRecStaffStatus(s.id, e.target.value)}
                          style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                        >
                          <option value="Available">Available</option>
                          <option value="On Leave">On Leave</option>
                        </select>
                        <button 
                          onClick={() => handleDeleteRecStaff(s.id)}
                          style={{ padding: '4px 8px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}
                        >
                          Delete
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );

      case 'laboratory_staff':
        return (
          <div className="module-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h2>Laboratory Staff Roster</h2>
                <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>Manage pathologists, lab technicians, active duty statuses, and assignments.</p>
              </div>
            </div>

            <table className="data-table">
              <thead>
                <tr>
                  <th>Staff ID</th>
                  <th>Staff Name</th>
                  <th>Designation / Role</th>
                  <th>Contact Email</th>
                  <th>Active Duty Status</th>
                  {role === 'admin' && <th>Quick Action</th>}
                </tr>
              </thead>
              <tbody>
                {laboratoryStaff.map(s => (
                  <tr key={s.id}>
                    <td><strong>{s.id}</strong></td>
                    <td><strong>{s.name}</strong></td>
                    <td><span style={{ background: '#f1f5f9', padding: '4px 8px', borderRadius: '4px', fontSize: '12px' }}>{s.role}</span></td>
                    <td>{s.email}</td>
                    <td>
                      <span className={`status-badge ${s.status === 'Available' ? 'available' : 'leave'}`}>
                        {s.status}
                      </span>
                    </td>
                    {role === 'admin' && (
                      <td style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <select 
                          value={s.status} 
                          onChange={(e) => handleToggleLabStaffStatus(s.id, e.target.value)}
                          style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                        >
                          <option value="Available">Available</option>
                          <option value="On Leave">On Leave</option>
                        </select>
                        <button 
                          onClick={() => handleDeleteLabStaff(s.id)}
                          style={{ padding: '4px 8px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}
                        >
                          Delete
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );

      case 'pharmacy_staff':
        return (
          <div className="module-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h2>Pharmacy Staff Roster</h2>
                <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>Manage pharmacists, stock handlers, active duty statuses, and assignments.</p>
              </div>
            </div>

            <table className="data-table">
              <thead>
                <tr>
                  <th>Staff ID</th>
                  <th>Staff Name</th>
                  <th>Designation / Role</th>
                  <th>Contact Email</th>
                  <th>Active Duty Status</th>
                  {role === 'admin' && <th>Quick Action</th>}
                </tr>
              </thead>
              <tbody>
                {pharmacyStaff.map(s => (
                  <tr key={s.id}>
                    <td><strong>{s.id}</strong></td>
                    <td><strong>{s.name}</strong></td>
                    <td><span style={{ background: '#f1f5f9', padding: '4px 8px', borderRadius: '4px', fontSize: '12px' }}>{s.role}</span></td>
                    <td>{s.email}</td>
                    <td>
                      <span className={`status-badge ${s.status === 'Available' ? 'available' : 'leave'}`}>
                        {s.status}
                      </span>
                    </td>
                    {role === 'admin' && (
                      <td style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <select 
                          value={s.status} 
                          onChange={(e) => handleTogglePharmacyStaffStatus(s.id, e.target.value)}
                          style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                        >
                          <option value="Available">Available</option>
                          <option value="On Leave">On Leave</option>
                        </select>
                        <button 
                          onClick={() => handleDeletePharmacyStaff(s.id)}
                          style={{ padding: '4px 8px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}
                        >
                          Delete
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );

      case 'cashier_staff':
        return (
          <div className="module-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h2>Cash Counter Staff Roster</h2>
                <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>Manage cashiers, billing specialists, active duty statuses, and assignments.</p>
              </div>
            </div>

            <table className="data-table">
              <thead>
                <tr>
                  <th>Staff ID</th>
                  <th>Staff Name</th>
                  <th>Designation / Role</th>
                  <th>Contact Email</th>
                  <th>Active Duty Status</th>
                  {role === 'admin' && <th>Quick Action</th>}
                </tr>
              </thead>
              <tbody>
                {cashierStaff.map(s => (
                  <tr key={s.id}>
                    <td><strong>{s.id}</strong></td>
                    <td><strong>{s.name}</strong></td>
                    <td><span style={{ background: '#f1f5f9', padding: '4px 8px', borderRadius: '4px', fontSize: '12px' }}>{s.role}</span></td>
                    <td>{s.email}</td>
                    <td>
                      <span className={`status-badge ${s.status === 'Available' ? 'available' : 'leave'}`}>
                        {s.status}
                      </span>
                    </td>
                    {role === 'admin' && (
                      <td style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <select 
                          value={s.status} 
                          onChange={(e) => handleToggleCashierStaffStatus(s.id, e.target.value)}
                          style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                        >
                          <option value="Available">Available</option>
                          <option value="On Leave">On Leave</option>
                        </select>
                        <button 
                          onClick={() => handleDeleteCashierStaff(s.id)}
                          style={{ padding: '4px 8px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}
                        >
                          Delete
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );

      case 'receptionist':
        return (
          <div className="module-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h2>Receptionist & Appointment Desk</h2>
                <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>Observe patient appointments, check-in statuses, and bookings.</p>
              </div>
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
                        <span style={{ fontSize: '11px', color: '#64748b', fontStyle: 'italic', background: '#f1f5f9', padding: '4px 8px', borderRadius: '4px' }}>Read-Only (Observed)</span>
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
                        <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569' }}>Time Slot</label>
                        <select value={adminBookTime} onChange={(e) => setAdminBookTime(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', marginTop: '4px', boxSizing: 'border-box', background: 'white' }}>
                          <option value="Slot 1">Slot 1 (Morning)</option>
                          <option value="Slot 2">Slot 2 (Afternoon)</option>
                        </select>
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
                      <td><strong>₹{lab.cost}</strong></td>
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
                      <td>₹{parseFloat(m.price).toFixed(2)}</td>
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
        const cleanAmount = (amtStr) => parseFloat((amtStr || '').replace(/[^0-9.]/g, '').trim()) || 0;
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
                <div className="stat-value">₹{paidRev.toFixed(2)}</div>
              </div>
              <div className="stat-card" style={{ borderLeft: '4px solid #ef4444' }}>
                <h3>Outstanding Unpaid</h3>
                <div className="stat-value">₹{unpaidRev.toFixed(2)}</div>
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

      case 'cashcounter':
        return <CashCounterDashboard embedMode={true} adminMode={true} />;

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
        const docAppts = appointments.filter(a => {
          return a.doctorId === activeDoctorId || 
                 (activeDoctorId === 'dr_house' && (a.doctorId === 'dr_gregory_house' || a.doctorName?.includes('House'))) ||
                 (activeDoctorId === 'dr_watson' && (a.doctorId === 'dr_john_watson' || a.doctorName?.includes('Watson'))) ||
                 (activeDoctorId === 'dr_grey' && (a.doctorId === 'dr_meredith_grey' || a.doctorName?.includes('Grey')));
        });
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
                        <div style={{ display: 'flex', gap: '8px' }}>
                          {appt.type === 'Telemedicine' ? (
                            <button 
                              onClick={() => {
                                setActiveCallAppt(appt);
                                setIsVideoCallActive(true);
                              }}
                              style={{ padding: '4px 10px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}
                            >
                              🎥 Connect Call
                            </button>
                          ) : (
                            <button 
                              onClick={() => handleOpenCheckupModal(appt)}
                              style={{ padding: '4px 8px', background: '#10b981', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', fontWeight: '600' }}
                            >
                              Start Checkup
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

      case 'slot_management': {
        const docId = activeDoctorId ? activeDoctorId.toLowerCase().replace('.', '').replace(' ', '_') : '';
        const docAppointmentsForDate = appointments.filter(a => 
          a.doctorId === activeDoctorId && a.date === slotManageDate && a.status !== 'Cancelled'
        );
        const slot1BookedPatients = docAppointmentsForDate.filter(a => a.time === 'Slot 1');
        const slot2BookedPatients = docAppointmentsForDate.filter(a => a.time === 'Slot 2');

        const getNextSevenDays = () => {
          const days = [];
          for (let i = 0; i < 7; i++) {
            const d = new Date();
            d.setDate(d.getDate() + i);
            const dateString = d.toISOString().split('T')[0];
            days.push(dateString);
          }
          return days;
        };

        return (
          <div className="module-content">
            <h2>Manage Slot Capacities & Bookings</h2>
            <p>Set custom capacities for Morning (Slot 1) and Afternoon (Slot 2) for any day. View booked patients and inspect their EHR records.</p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px', marginTop: '20px' }}>
              <div style={{ background: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                <h3 style={{ margin: '0 0 16px 0', color: '#1e293b' }}>Set Capacities</h3>
                <form onSubmit={handleSaveSlotCapacities} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#475569' }}>Select Date</label>
                    <input 
                      type="date" 
                      required 
                      value={slotManageDate} 
                      onChange={(e) => setSlotManageDate(e.target.value)} 
                      style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', marginTop: '4px', boxSizing: 'border-box' }} 
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#475569' }}>Slot 1 (Morning) Capacity</label>
                    <input 
                      type="number" 
                      min="1" 
                      required 
                      value={slot1CapacityInput} 
                      onChange={(e) => setSlot1CapacityInput(e.target.value)} 
                      style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', marginTop: '4px', boxSizing: 'border-box' }} 
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#475569' }}>Slot 2 (Afternoon) Capacity</label>
                    <input 
                      type="number" 
                      min="1" 
                      required 
                      value={slot2CapacityInput} 
                      onChange={(e) => setSlot2CapacityInput(e.target.value)} 
                      style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', marginTop: '4px', boxSizing: 'border-box' }} 
                    />
                  </div>

                  <button 
                    type="submit" 
                    style={{ padding: '10px 16px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '14px', marginTop: '8px' }}
                  >
                    Save Slot Capacities
                  </button>
                </form>

                <div style={{ marginTop: '24px', borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
                  <h4 style={{ margin: '0 0 12px 0', color: '#475569', fontSize: '13px', fontWeight: 'bold' }}>Upcoming Days Quick View</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {getNextSevenDays().map(dayStr => {
                      const allSlotsConfigs = JSON.parse(localStorage.getItem('dhms_doctor_slots') || '[]');
                      const dayConfig = allSlotsConfigs.find(c => c.doctorId === docId && c.date === dayStr) || { slot1Capacity: 5, slot2Capacity: 5 };
                      
                      const dayAppts = appointments.filter(a => a.doctorId === activeDoctorId && a.date === dayStr && a.status !== 'Cancelled');
                      const s1Booked = dayAppts.filter(a => a.time === 'Slot 1').length;
                      const s2Booked = dayAppts.filter(a => a.time === 'Slot 2').length;

                      const isSelected = slotManageDate === dayStr;

                      return (
                        <div 
                          key={dayStr}
                          onClick={() => setSlotManageDate(dayStr)}
                          style={{
                            padding: '10px',
                            borderRadius: '6px',
                            border: `1px solid ${isSelected ? '#3b82f6' : '#e2e8f0'}`,
                            background: isSelected ? '#eff6ff' : '#f8fafc',
                            cursor: 'pointer',
                            fontSize: '12px'
                          }}
                        >
                          <div style={{ fontWeight: 'bold', color: isSelected ? '#1e40af' : '#1e293b' }}>{dayStr}</div>
                          <div style={{ color: '#64748b', marginTop: '4px' }}>
                            Slot 1: {s1Booked}/{dayConfig.slot1Capacity} booked | Slot 2: {s2Booked}/{dayConfig.slot2Capacity} booked
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ background: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>
                    <h3 style={{ margin: 0, color: '#0f172a' }}> Slot 1 (Morning: 9 AM - 1 PM) Bookings</h3>
                    <span style={{ fontSize: '12px', fontWeight: 'bold', padding: '4px 8px', borderRadius: '12px', background: '#e0f2fe', color: '#0369a1' }}>
                      {slot1BookedPatients.length} Booked
                    </span>
                  </div>
                  {slot1BookedPatients.length === 0 ? (
                    <p style={{ color: '#64748b', fontSize: '13px', margin: 0, textAlign: 'center', padding: '16px 0' }}>No patients booked for this slot.</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {slot1BookedPatients.map(appt => (
                        <div key={appt.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', borderRadius: '8px', border: '1px solid #f1f5f9', background: '#fafafa' }}>
                          <div>
                            <div style={{ fontWeight: 'bold', color: '#1e293b' }}>{appt.patientName} <span style={{ fontSize: '11px', color: '#64748b' }}>({appt.patientId})</span></div>
                            <div style={{ fontSize: '12px', color: '#475569', marginTop: '4px' }}><strong>Reason:</strong> {appt.reason}</div>
                            <div style={{ fontSize: '11px', color: '#888', marginTop: '2px' }}>Type: {appt.type} | Status: {appt.status}</div>
                          </div>
                          <button
                            onClick={() => {
                              const patientObj = patients.find(p => p.id === appt.patientId);
                              if (patientObj) {
                                setSelectedEhrPatient(patientObj);
                                setActiveView('patients');
                              } else {
                                alert("Patient records not found.");
                              }
                            }}
                            style={{ padding: '6px 12px', background: '#10b981', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '12px' }}
                          >
                            Inspect EHR File
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div style={{ background: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>
                    <h3 style={{ margin: 0, color: '#0f172a' }}> Slot 2 (Afternoon: 2 PM - 6 PM) Bookings</h3>
                    <span style={{ fontSize: '12px', fontWeight: 'bold', padding: '4px 8px', borderRadius: '12px', background: '#e0f2fe', color: '#0369a1' }}>
                      {slot2BookedPatients.length} Booked
                    </span>
                  </div>
                  {slot2BookedPatients.length === 0 ? (
                    <p style={{ color: '#64748b', fontSize: '13px', margin: 0, textAlign: 'center', padding: '16px 0' }}>No patients booked for this slot.</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {slot2BookedPatients.map(appt => (
                        <div key={appt.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', borderRadius: '8px', border: '1px solid #f1f5f9', background: '#fafafa' }}>
                          <div>
                            <div style={{ fontWeight: 'bold', color: '#1e293b' }}>{appt.patientName} <span style={{ fontSize: '11px', color: '#64748b' }}>({appt.patientId})</span></div>
                            <div style={{ fontSize: '12px', color: '#475569', marginTop: '4px' }}><strong>Reason:</strong> {appt.reason}</div>
                            <div style={{ fontSize: '11px', color: '#888', marginTop: '2px' }}>Type: {appt.type} | Status: {appt.status}</div>
                          </div>
                          <button
                            onClick={() => {
                              const patientObj = patients.find(p => p.id === appt.patientId);
                              if (patientObj) {
                                setSelectedEhrPatient(patientObj);
                                setActiveView('patients');
                              } else {
                                alert("Patient records not found.");
                              }
                            }}
                            style={{ padding: '6px 12px', background: '#10b981', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '12px' }}
                          >
                            Inspect EHR File
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      }

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
                    <td>₹{rx.cost}</td>
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
                    <td>₹{lab.cost}</td>
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
                    <option value="Cashier">Cash Counter Desk</option>
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
          const activeDocObj = doctorsRoster.find(d => d.id === activeDoctorId) || doctorsRoster[0] || { id: '', name: 'Unknown Doctor', department: 'General' };
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
      case 'transfer_authority':
        if (role !== 'admin') return null;
        
        const currentAdminData = JSON.parse(localStorage.getItem('dhms_admin') || '{"name":"System Administrator","email":"admin@dhms.org","password":"admin"}');

        return (
          <div className="module-content" style={{ maxWidth: '600px', margin: '0 auto', background: '#ffffff', padding: '30px', borderRadius: '12px', border: '1px solid #cbd5e1', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
            <h2 style={{ color: '#1e293b', marginBottom: '8px', fontSize: '22px' }}>🔒 Transfer Administrator Authority</h2>
            <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '24px' }}>
              Hand over total control of the hospital administrative dashboard to a new owner. This action is **highly sensitive** and will immediately demote your access.
            </p>

            <div style={{ background: '#fef2f2', border: '1px solid #fee2e2', color: '#991b1b', padding: '16px', borderRadius: '8px', marginBottom: '24px', fontSize: '13px', lineHeight: '1.5' }}>
              <strong>⚠️ CRITICAL SECURITY WARNING:</strong>
              <ul style={{ margin: '8px 0 0 20px', padding: 0 }}>
                <li>There must be exactly **one** super-administrator in the system.</li>
                <li>Your current account session will be terminated instantly upon successful handover.</li>
                <li>Ensure the new administrator\'s email is correct; otherwise, the portal will be inaccessible.</li>
              </ul>
            </div>

            <form onSubmit={handleTransferAuthority} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ padding: '12px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', marginBottom: '8px' }}>
                <span style={{ fontSize: '12px', color: '#64748b', display: 'block', fontWeight: 'bold' }}>CURRENT ADMINISTRATOR</span>
                <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#334155' }}>{currentAdminData.name} ({currentAdminData.email})</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#475569' }}>New Admin Full Name</label>
                <input 
                  type="text" 
                  required 
                  value={transferName} 
                  onChange={(e) => setTransferName(e.target.value)} 
                  placeholder="e.g. Dr. Helen Cho" 
                  style={{ padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px' }} 
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#475569' }}>New Admin Email Address</label>
                <input 
                  type="email" 
                  required 
                  value={transferEmail} 
                  onChange={(e) => setTransferEmail(e.target.value)} 
                  placeholder="newadmin@dhms.org" 
                  style={{ padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px' }} 
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#475569' }}>New Admin Password</label>
                  <input 
                    type="password" 
                    required 
                    value={transferPassword} 
                    onChange={(e) => setTransferPassword(e.target.value)} 
                    placeholder="••••••••" 
                    style={{ padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px' }} 
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#475569' }}>Confirm New Password</label>
                  <input 
                    type="password" 
                    required 
                    value={transferConfirmPassword} 
                    onChange={(e) => setTransferConfirmPassword(e.target.value)} 
                    placeholder="••••••••" 
                    style={{ padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px' }} 
                  />
                </div>
              </div>

              <hr style={{ border: 0, borderTop: '1px solid #e2e8f0', margin: '16px 0' }} />

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#ef4444' }}>Current Administrator Password (Security Check)</label>
                <input 
                  type="password" 
                  required 
                  value={currentAdminVerifyPassword} 
                  onChange={(e) => setCurrentAdminVerifyPassword(e.target.value)} 
                  placeholder="Enter your current password to authorize" 
                  style={{ padding: '10px', borderRadius: '6px', border: '2px solid #fca5a5', fontSize: '14px' }} 
                />
              </div>

              <button 
                type="submit" 
                style={{ marginTop: '12px', padding: '12px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer', boxShadow: '0 4px 6px -1px rgba(239,68,68,0.2)', transition: 'background 0.2s' }}
                onMouseOver={(e) => e.target.style.background = '#dc2626'}
                onMouseOut={(e) => e.target.style.background = '#ef4444'}
              >
                Execute Handover & Log Out
              </button>
            </form>
          </div>
        );

      case 'inpatient_ward':
        return renderInpatientWard();

      default:
        return null;
    }
  };

  const handleDoctorDischargeSubmit = (e) => {
    e.preventDefault();
    if (!selectedAdmForDischarge) return;
    const allAdms = JSON.parse(localStorage.getItem('dhms_admissions') || '[]');
    const todayStr = new Date().toISOString().split('T')[0];

    const updated = allAdms.map(a => {
      if (a.id === selectedAdmForDischarge.id) {
        return {
          ...a,
          status: 'Fit for Discharge / Settle Billing',
          clinicalDischargeDate: todayStr,
          dischargeSummary: {
            condition: dischargeForm.condition,
            notes: dischargeForm.notes || 'Patient clinically evaluated and approved for discharge.',
            takeHomeMeds: dischargeForm.takeHomeMeds || 'Continue maintenance therapy as instructed.',
            followUpDate: dischargeForm.followUpDate || 'In 7 Days (OPD Room 101)',
            doctorSign: activeDocObj.name
          }
        };
      }
      return a;
    });

    localStorage.setItem('dhms_admissions', JSON.stringify(updated));
    setAdmissions(updated);
    if (window.dispatchEvent) {
      window.dispatchEvent(new Event('storage'));
    }
    alert(`✓ Clinical Discharge Authorized for ${selectedAdmForDischarge.patientName}!\n\nThe patient is marked "Fit for Discharge". The file is now transferred to the Cash Counter for consolidated room, pharmacy, and lab billing clearance.`);
    setSelectedAdmForDischarge(null);
  };

  const renderInpatientWard = () => {
    const admittedList = admissions.filter(a => a.status === 'Admitted' || a.status === 'Fit for Discharge / Settle Billing' || a.status?.includes('Pending'));

    return (
      <div className="module-content">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h2> Inpatient Ward & Patient Bedside Care</h2>
            <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>Monitor admitted inpatients under care, view bedside medication ledger, and perform clinical discharge sign-offs.</p>
          </div>
          <span style={{ background: '#dcfce7', color: '#15803d', padding: '6px 14px', borderRadius: '8px', fontSize: '13px', fontWeight: '700' }}>
            Active Inpatients: {admittedList.filter(a => a.status === 'Admitted').length}
          </span>
        </div>

        <table className="data-table">
          <thead>
            <tr>
              <th>Admission ID</th>
              <th>Patient Name & ID</th>
              <th>Ward & Bed Allocation</th>
              <th>Admitted On</th>
              <th>Clinical Indication / Diagnosis</th>
              <th>Medications Administered</th>
              <th>Status</th>
              <th>Clinical Action</th>
            </tr>
          </thead>
          <tbody>
            {admittedList.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '32px', color: '#64748b', fontStyle: 'italic' }}>
                  No patients currently in the Inpatient Ward.
                </td>
              </tr>
            ) : (
              admittedList.map(adm => {
                const daysStayed = Math.max(1, Math.ceil((new Date() - new Date(adm.admissionDate || new Date().toISOString().split('T')[0])) / (1000 * 60 * 60 * 24)));
                return (
                  <tr key={adm.id}>
                    <td><strong style={{ color: '#4338ca' }}>{adm.id}</strong></td>
                    <td>
                      <strong>{adm.patientName}</strong>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>{adm.patientId}</div>
                    </td>
                    <td>
                      <span style={{ background: '#f1f5f9', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' }}>
                        {adm.ward || 'General Ward A'}
                      </span>
                      {adm.bedNo && (
                        <div style={{ fontSize: '11px', color: '#15803d', fontWeight: 'bold', marginTop: '2px' }}>
                          ✓ {adm.bedNo}
                        </div>
                      )}
                    </td>
                    <td>
                      <div>{adm.admissionDate || 'Today'}</div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>Day {daysStayed} of stay</div>
                    </td>
                    <td style={{ maxWidth: '200px' }}>
                      <div style={{ fontSize: '12px', color: '#334155' }}>{adm.notes || 'Under clinical observation.'}</div>
                    </td>
                    <td>
                      {adm.medications && adm.medications.length > 0 ? (
                        <div style={{ fontSize: '12px', color: '#0f172a' }}>
                          {adm.medications.length} items ({adm.medications.map(m => m.name).join(', ')})
                        </div>
                      ) : (
                        <span style={{ color: '#94a3b8', fontSize: '12px', fontStyle: 'italic' }}>No meds administered</span>
                      )}
                    </td>
                    <td>
                      <span className="status-badge" style={{
                        backgroundColor: adm.status === 'Admitted' ? '#dcfce7' : adm.status?.includes('Discharge') ? '#e0e7ff' : '#fef3c7',
                        color: adm.status === 'Admitted' ? '#15803d' : adm.status?.includes('Discharge') ? '#4338ca' : '#b45309'
                      }}>
                        {adm.status}
                      </span>
                    </td>
                    <td>
                      {adm.status === 'Admitted' ? (
                        <button
                          onClick={() => {
                            setSelectedAdmForDischarge(adm);
                            setDischargeForm({
                              condition: 'Stable / Cured',
                              notes: `Patient hospitalized for ${adm.notes || 'clinical care'}. Vitals stable, symptom relief achieved. Safe for discharge.`,
                              takeHomeMeds: adm.medications ? adm.medications.map(m => `${m.name} - ${m.instructions || 'Twice Daily after meals'}`).join('\n') : 'Paracetamol 500mg - As needed for pain',
                              followUpDate: 'In 7 Days at OPD Room 101'
                            });
                          }}
                          style={{
                            padding: '6px 12px',
                            background: '#4338ca',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '12px',
                            fontWeight: '700',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          🏁 Discharge Sign-off
                        </button>
                      ) : adm.status?.includes('Discharge') ? (
                        <span style={{ fontSize: '12px', color: '#4338ca', fontWeight: 'bold' }}>✓ Signed & At Billing</span>
                      ) : (
                        <span style={{ fontSize: '12px', color: '#b45309', fontWeight: 'bold' }}>Awaiting IPD Desk</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    );
  };

  const renderTelemedicineWorkspace = () => {
    const currentPatientObj = patients.find(p => p.id === activeCallAppt.patientId) || {
      id: activeCallAppt.patientId || "PT-99999",
      firstName: activeCallAppt.patientName?.split(' ')[0] || "John",
      lastName: activeCallAppt.patientName?.split(' ')[1] || "Doe",
      gender: "Male",
      dob: "1990-01-01",
      bloodType: "O+",
      allergies: "None",
      chronicConditions: "None",
      clinicalHistory: []
    };

    const age = new Date().getFullYear() - new Date(currentPatientObj.dob).getFullYear();

    return (
      <div className="tele-workspace-container">
        {/* Workspace Header */}
        <div className="tele-workspace-header">
          <div className="tele-header-left">
            <span className="tele-live-badge">● LIVE SESSION</span>
            <h2>Tele-Consultation Suite — {activeCallAppt.patientName} ({activeCallAppt.id})</h2>
          </div>
          <button className="tele-end-btn-top" onClick={handleEndCall}>
            Leave Workspace
          </button>
        </div>

        {/* Main Columns */}
        <div className="tele-workspace-main">
          {/* Left Column: Video Feeds */}
          <div className="tele-video-column">
            <div className="tele-video-grid">
              {/* Remote Patient Video Feed */}
              <div className="tele-video-frame remote">
                <div className="tele-video-placeholder">
                  <div className="tele-video-avatar">
                    {currentPatientObj.firstName?.[0]}{currentPatientObj.lastName?.[0]}
                  </div>
                  <h3>{activeCallAppt.patientName}</h3>
                  <p>Patient Connection (Ready)</p>
                  <div className="pulse-circle"></div>
                </div>
                <div className="tele-video-label">Patient: {activeCallAppt.patientName}</div>
              </div>

              {/* Local Doctor Video Feed */}
              <div className="tele-video-frame local">
                <div className="tele-video-placeholder">
                  <div className="tele-video-avatar doctor">
                    {doctorsRoster.find(d => d.id === activeDoctorId)?.name?.replace('Dr. ', '')?.[0]}
                  </div>
                  <h3>You</h3>
                  <p>Camera Streaming</p>
                </div>
                <div className="tele-video-label">Doctor (You)</div>
              </div>
            </div>

            {/* Video Controls */}
            <div className="tele-video-controls">
              <button className="tele-ctrl-btn active" title="Mute Microphone">🎤 Mic</button>
              <button className="tele-ctrl-btn active" title="Stop Camera">📹 Cam</button>
              <button className="tele-ctrl-btn" title="Share Screen">🖥️ Share</button>
              <button className="tele-ctrl-btn end-call" title="Disconnect Session" onClick={handleEndCall}>
                📞 End Consultation
              </button>
            </div>
          </div>

          {/* Right Column: Information & Actions Console */}
          <div className="tele-console-column">
            {/* Tabs */}
            <div className="tele-console-tabs">
              <button 
                className={teleActiveTab === 'chat' ? 'active' : ''} 
                onClick={() => setTeleActiveTab('chat')}
              >
                💬 Chat Room
              </button>
              <button 
                className={teleActiveTab === 'note' ? 'active' : ''} 
                onClick={() => setTeleActiveTab('note')}
              >
                📋 Vitals & Checkup
              </button>
              <button 
                className={teleActiveTab === 'ehr' ? 'active' : ''} 
                onClick={() => setTeleActiveTab('ehr')}
              >
                🩺 Patient File (EHR)
              </button>
            </div>

            {/* Tab Contents */}
            <div className="tele-console-content">
              {teleActiveTab === 'chat' && (
                <div className="tele-chat-container">
                  <div className="tele-chat-scroller">
                    {callChatMessages.map((msg, idx) => (
                      <div key={idx} className={`tele-chat-bubble-row ${msg.sender}`}>
                        <div className="tele-chat-bubble">
                          <p>{msg.text}</p>
                          <span className="tele-chat-time">{msg.time}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <form onSubmit={handleSendDoctorChatMessage} className="tele-chat-input-row">
                    <input 
                      type="text" 
                      placeholder="Type a message to the patient..."
                      value={newCallMessage}
                      onChange={(e) => setNewCallMessage(e.target.value)}
                    />
                    <button type="submit">Send</button>
                  </form>
                </div>
              )}

              {teleActiveTab === 'note' && (
                <div className="tele-note-container" style={{ maxHeight: 'calc(100vh - 250px)', overflowY: 'auto', paddingRight: '8px' }}>
                  <h3 style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '8px', marginBottom: '12px' }}>Clinical Checkup & Log</h3>
                  <form onSubmit={handleTeleCheckupSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {renderClinicalForm(true)}
                    
                    <button type="submit" style={{ padding: '12px', background: '#10b981', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px', marginTop: '12px', boxShadow: '0 4px 6px -1px rgba(16,185,129,0.2)' }}>
                      Complete Consultation & Bill Patient
                    </button>
                  </form>
                </div>
              )}

              {teleActiveTab === 'ehr' && (
                <div className="tele-ehr-container">
                  <div style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '10px', marginBottom: '12px' }}>
                    <h3>Electronic Health Record (EHR)</h3>
                    <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#64748b' }}>Blood Group: <strong>{currentPatientObj.bloodType || 'O+'}</strong> • Age: <strong>{age}</strong> ({currentPatientObj.dob})</p>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div className="ehr-badge-card">
                      <strong>Allergies:</strong>
                      <span className="ehr-pill alert">{currentPatientObj.allergies || 'None'}</span>
                    </div>

                    <div className="ehr-badge-card">
                      <strong>Chronic Conditions:</strong>
                      <span className="ehr-pill warning">{currentPatientObj.chronicConditions || 'None'}</span>
                    </div>

                    <div style={{ marginTop: '10px' }}>
                      <strong>Clinical Consultation History</strong>
                      <div className="tele-ehr-history-list">
                        {currentPatientObj.clinicalHistory?.length === 0 ? (
                          <div style={{ fontSize: '12px', color: '#94a3b8', fontStyle: 'italic', padding: '8px 0' }}>No clinical history on file.</div>
                        ) : (
                          currentPatientObj.clinicalHistory?.map((hist, idx) => (
                            <div key={idx} className="tele-history-item">
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#64748b', fontWeight: 'bold' }}>
                                <span>Date: {hist.date}</span>
                                <span>Provider: {hist.doctor}</span>
                              </div>
                              <div style={{ fontSize: '12px', fontWeight: '600', color: '#1e293b', marginTop: '3px' }}>Reason: {hist.reason}</div>
                              <div style={{ fontSize: '12px', color: '#475569', marginTop: '2px' }}>Diagnosis: {hist.diagnosis}</div>
                              {hist.vitals && (
                                <div style={{ fontSize: '11px', color: '#64748b', marginTop: '3px', background: '#f8fafc', padding: '4px', borderRadius: '4px' }}>
                                  BP: {hist.vitals.bp} | HR: {hist.vitals.hr} | Temp: {hist.vitals.temp} | SpO2: {hist.vitals.spo2}
                                </div>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (role === 'doctor' && isVideoCallActive && activeCallAppt) {
    return renderTelemedicineWorkspace();
  }

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
              <span style={{ fontSize: '13px', fontWeight: '600', color: '#1e293b', background: '#f1f5f9', padding: '6px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                {activeDocObj.name} ({activeDocObj.department})
              </span>
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
          <div style={{ background: 'white', padding: '24px', borderRadius: '12px', width: '800px', maxWidth: '90vw', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
              <h3 style={{ margin: 0, color: '#1e293b', fontSize: '18px', fontWeight: 'bold' }}>🩺 Clinical Consultation & Checkup Log</h3>
              <span style={{ fontSize: '14px', background: '#eff6ff', color: '#1d4ed8', padding: '4px 8px', borderRadius: '6px', fontWeight: '600' }}>Patient: {selectedApptForCheckup.patientName}</span>
            </div>
            
            <form onSubmit={handleCheckupSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {renderClinicalForm(false)}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px', borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
                <button type="button" onClick={resetClinicalForm} className="btn-action-cancel" style={{ padding: '10px 16px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '13px' }}>Cancel Checkup</button>
                <button type="button" onClick={() => handlePrintPrescriptionPreview()} style={{ padding: '10px 16px', background: '#e0e7ff', color: '#4338ca', border: '1px solid #c7d2fe', borderRadius: '6px', cursor: 'pointer', fontWeight: '700', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>🖨️ Print Rx Slip</button>
                <button type="submit" className="btn-action-submit" style={{ padding: '10px 20px', background: '#10b981', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}>Complete Checkup & Bill</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Physical Prescription Slip Printable Modal */}
      {printedPrescriptionData && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 99999 }}>
          <div style={{ background: 'white', borderRadius: '12px', width: '680px', maxWidth: '95vw', maxHeight: '92vh', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', overflow: 'hidden' }}>
            
            {/* Modal Header */}
            <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
              <h3 style={{ margin: 0, fontSize: '17px', color: '#1e293b', fontWeight: '700' }}>📄 Physical Medical Prescription (Rx Slip)</h3>
              <button onClick={() => setPrintedPrescriptionData(null)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#64748b' }}>&times;</button>
            </div>

            {/* Printable Area */}
            <div id="printable-prescription" style={{ padding: '32px 36px', overflowY: 'auto', flex: 1, backgroundColor: 'white', color: '#0f172a', fontFamily: "'Inter', sans-serif" }}>
              
              {/* Hospital & Doctor Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #0f172a', paddingBottom: '16px', marginBottom: '20px' }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: '19px', fontWeight: '800', color: '#1e293b', letterSpacing: '-0.02em' }}>DHMS CENTRAL CLINICAL HEALTHCARE</h2>
                  <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#64748b' }}>100 Hospital Boulevard, Medical District • Ph: +91 (800) 123-4567</p>
                  <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: '#94a3b8' }}>Accredited Tertiary Care & Multispecialty Hospital</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <h4 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: '#4338ca' }}>{printedPrescriptionData.doctorName}</h4>
                  <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#475569', fontWeight: '600' }}>{printedPrescriptionData.doctorDept}</p>
                  <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: '#64748b' }}>Reg No: {printedPrescriptionData.doctorReg || 'DMC-2024-892'}</p>
                </div>
              </div>

              {/* Patient Details Bar */}
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px 16px', marginBottom: '20px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', fontSize: '12px' }}>
                <div>
                  <span style={{ color: '#64748b', display: 'block', fontSize: '10.5px' }}>PATIENT NAME</span>
                  <strong style={{ color: '#1e293b' }}>{printedPrescriptionData.patientName}</strong>
                </div>
                <div>
                  <span style={{ color: '#64748b', display: 'block', fontSize: '10.5px' }}>PATIENT ID</span>
                  <strong>{printedPrescriptionData.patientId}</strong>
                </div>
                <div>
                  <span style={{ color: '#64748b', display: 'block', fontSize: '10.5px' }}>DATE & TIME</span>
                  <span>{printedPrescriptionData.date}</span>
                </div>
                <div>
                  <span style={{ color: '#64748b', display: 'block', fontSize: '10.5px' }}>ENCOUNTER</span>
                  <span style={{ fontWeight: '600', color: printedPrescriptionData.isAdmitted ? '#b45309' : '#15803d' }}>
                    {printedPrescriptionData.isAdmitted ? `Inpatient (${printedPrescriptionData.ward})` : 'Outpatient (OPD)'}
                  </span>
                </div>
              </div>

              {/* Vitals Summary */}
              {printedPrescriptionData.vitals && (
                <div style={{ display: 'flex', gap: '16px', fontSize: '11.5px', color: '#475569', paddingBottom: '12px', borderBottom: '1px dashed #cbd5e1', marginBottom: '16px' }}>
                  <span><strong>BP:</strong> {printedPrescriptionData.vitals.bp || '120/80'} mmHg</span>
                  <span><strong>Pulse:</strong> {printedPrescriptionData.vitals.hr || '72'} bpm</span>
                  <span><strong>Temp:</strong> {printedPrescriptionData.vitals.temp || '98.6'} °F</span>
                  <span><strong>SpO₂:</strong> {printedPrescriptionData.vitals.spo2 || '98'}%</span>
                </div>
              )}

              {/* Clinical Diagnosis & Symptoms */}
              <div style={{ marginBottom: '20px' }}>
                <div style={{ fontSize: '13px', marginBottom: '6px' }}>
                  <span style={{ fontWeight: '700', color: '#334155' }}>Clinical Diagnosis: </span>
                  <span style={{ color: '#0f172a' }}>{printedPrescriptionData.diagnosis || 'Routine clinical evaluation.'}</span>
                </div>
                {printedPrescriptionData.symptoms && printedPrescriptionData.symptoms !== 'None reported' && (
                  <div style={{ fontSize: '12px', color: '#64748b' }}>
                    <strong>Chief Complaints / Symptoms:</strong> {printedPrescriptionData.symptoms}
                  </div>
                )}
              </div>

              {/* Prescription Rx Sign & Medication Table */}
              <div style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                  <span style={{ fontSize: '24px', fontWeight: '900', fontFamily: 'serif', color: '#4338ca' }}>℞</span>
                  <h4 style={{ margin: 0, fontSize: '13.5px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#1e293b' }}>Prescribed Medications</h4>
                </div>

                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px' }}>
                  <thead>
                    <tr style={{ background: '#f1f5f9', borderBottom: '2px solid #cbd5e1', textAlign: 'left' }}>
                      <th style={{ padding: '8px 10px', width: '38%' }}>Medicine & Strength</th>
                      <th style={{ padding: '8px 10px' }}>Frequency</th>
                      <th style={{ padding: '8px 10px' }}>Duration</th>
                      <th style={{ padding: '8px 10px' }}>Instructions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {printedPrescriptionData.medications.length === 0 ? (
                      <tr>
                        <td colSpan="4" style={{ padding: '16px', textAlign: 'center', color: '#64748b' }}>No medications prescribed for this consultation.</td>
                      </tr>
                    ) : (
                      printedPrescriptionData.medications.map((m, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                          <td style={{ padding: '9px 10px' }}>
                            <strong style={{ color: '#0f172a' }}>{m.name}</strong> {m.dose && <span style={{ color: '#475569', fontSize: '11.5px' }}>({m.dose})</span>}
                          </td>
                          <td style={{ padding: '9px 10px', color: '#334155' }}>{m.frequency}</td>
                          <td style={{ padding: '9px 10px', color: '#334155' }}>{m.duration}</td>
                          <td style={{ padding: '9px 10px', color: '#64748b', fontSize: '11.5px' }}>{m.instructions || 'As advised'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Ordered Diagnostic Tests (if any) */}
              {printedPrescriptionData.labs && printedPrescriptionData.labs.length > 0 && (
                <div style={{ marginBottom: '20px', background: '#fafaf9', padding: '10px 14px', borderRadius: '6px', border: '1px solid #e7e5e4' }}>
                  <h5 style={{ margin: '0 0 6px 0', fontSize: '12px', color: '#44403c', textTransform: 'uppercase' }}>Recommended Diagnostic Tests:</h5>
                  <div style={{ fontSize: '12px', color: '#57534e' }}>
                    {printedPrescriptionData.labs.map(l => l.testName || l.name).join(', ')}
                  </div>
                </div>
              )}

              {/* Doctor's Advice & Signoff */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '36px', paddingTop: '18px', borderTop: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '11px', color: '#94a3b8', maxWidth: '300px' }}>
                  <p style={{ margin: 0 }}>* Take medications as prescribed by the physician.</p>
                  <p style={{ margin: '2px 0 0 0' }}>* This is an official electronic medical prescription slip.</p>
                </div>
                <div style={{ textAlign: 'center', minWidth: '180px' }}>
                  <div style={{ borderBottom: '1px solid #0f172a', width: '160px', margin: '0 auto 6px auto' }}></div>
                  <strong style={{ fontSize: '13px', color: '#1e293b', display: 'block' }}>{printedPrescriptionData.doctorName}</strong>
                  <span style={{ fontSize: '11px', color: '#64748b' }}>Authorized Signature & Stamp</span>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="no-print" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', padding: '16px 24px', borderTop: '1px solid #e2e8f0', background: '#f8fafc' }}>
              <button type="button" onClick={() => setPrintedPrescriptionData(null)} style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #cbd5e1', background: 'white', color: '#475569', cursor: 'pointer', fontWeight: '600', fontSize: '13px' }}>
                Close
              </button>
              <button 
                type="button" 
                onClick={() => window.print()}
                style={{ padding: '8px 20px', borderRadius: '6px', border: 'none', background: '#4338ca', color: 'white', cursor: 'pointer', fontWeight: '700', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                🖨️ Print Prescription Slip
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Doctor Clinical Discharge Sign-Off Modal */}
      {selectedAdmForDischarge && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999 }}>
          <div style={{ background: 'white', borderRadius: '12px', width: '600px', maxWidth: '92vw', maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '17px', color: '#1e293b', fontWeight: '700' }}>🏁 Doctor Clinical Discharge Sign-Off</h3>
                <span style={{ fontSize: '12px', color: '#64748b' }}>Patient: <strong>{selectedAdmForDischarge.patientName}</strong> ({selectedAdmForDischarge.patientId}) • {selectedAdmForDischarge.ward}</span>
              </div>
              <button onClick={() => setSelectedAdmForDischarge(null)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#64748b' }}>&times;</button>
            </div>

            <form onSubmit={handleDoctorDischargeSubmit} style={{ padding: '20px 24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '12.5px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '4px' }}>Discharge Condition / Outcome</label>
                <select 
                  value={dischargeForm.condition} 
                  onChange={e => setDischargeForm({ ...dischargeForm, condition: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', background: 'white' }}
                >
                  <option value="Stable / Cured">Stable / Cured (Standard Discharge)</option>
                  <option value="Relieved / Improved">Relieved / Improved (Home Care)</option>
                  <option value="Discharge on Request (DOR)">Discharge on Request (DOR)</option>
                  <option value="Transferred to Higher Medical Center">Transferred to Higher Medical Center</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '12.5px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '4px' }}>Clinical Summary & Inpatient Course Notes</label>
                <textarea 
                  required
                  rows="3"
                  value={dischargeForm.notes} 
                  onChange={e => setDischargeForm({ ...dischargeForm, notes: e.target.value })}
                  placeholder="Document clinical evolution during hospital stay, recovery status, and discharge clearance rationale..."
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12.5px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '4px' }}>Take-Home Medications & Regimen</label>
                <textarea 
                  rows="3"
                  value={dischargeForm.takeHomeMeds} 
                  onChange={e => setDischargeForm({ ...dischargeForm, takeHomeMeds: e.target.value })}
                  placeholder="List medications patient should continue at home (Drug, Dosage, Frequency, Duration)..."
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12.5px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '4px' }}>Follow-Up Appointment Instructions</label>
                <input 
                  type="text" 
                  value={dischargeForm.followUpDate} 
                  onChange={e => setDischargeForm({ ...dischargeForm, followUpDate: e.target.value })}
                  placeholder="e.g. In 7 Days at OPD Room 101"
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ background: '#f8fafc', padding: '10px 12px', borderRadius: '6px', border: '1px dashed #cbd5e1', fontSize: '11.5px', color: '#475569' }}>
                ℹ️ <strong>Next Step:</strong> Signing off will transition the patient to <em>"Fit for Discharge"</em> and alert the Cash Counter to generate the consolidated room, medicine, and diagnostic clearance invoice.
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setSelectedAdmForDischarge(null)} style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #cbd5e1', background: 'white', color: '#64748b', cursor: 'pointer', fontWeight: '600' }}>
                  Cancel
                </button>
                <button type="submit" style={{ padding: '8px 20px', borderRadius: '6px', border: 'none', background: '#4338ca', color: 'white', cursor: 'pointer', fontWeight: '700', fontSize: '13px' }}>
                  ✓ Authorize Clinical Discharge
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
