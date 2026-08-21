import React, { useState, useEffect } from 'react';
import './PatientDashboard.css';

export default function PatientDashboard({ onLogout, loggedInPatient }) {
  const [activeTab, setActiveTab] = useState('health_console');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [deptFilter, setDeptFilter] = useState('All');
  const [selectedVisit, setSelectedVisit] = useState(null);

  // Dynamic Patient Record State
  const [currentPatient, setCurrentPatient] = useState(() => {
    const list = JSON.parse(localStorage.getItem('dhms_patients') || '[]');
    const id = loggedInPatient?.id || "PT-80234";
    return list.find(p => p.id === id) || loggedInPatient || list[0];
  });

  useEffect(() => {
    const handleStorageChange = () => {
      const list = JSON.parse(localStorage.getItem('dhms_patients') || '[]');
      const id = currentPatient?.id || loggedInPatient?.id || "PT-80234";
      const found = list.find(p => p.id === id);
      if (found) {
        setCurrentPatient(found);
        setEhrRecords(found.reports || []);
      }
      
      const allAppts = JSON.parse(localStorage.getItem('dhms_appointments') || '[]');
      const patientId = id;
      setAppointments(allAppts.filter(a => a.patientId === patientId));
      
      const teleAppts = allAppts.filter(a => a.patientId === patientId && a.type === 'Telemedicine');
      setTeleconsultations(teleAppts.map(a => ({
        id: a.id,
        doctor: a.doctorName,
        department: a.department,
        date: a.date,
        time: a.time,
        status: a.status === 'Scheduled' ? 'Ready' : a.status,
        reason: a.reason
      })));

      setAdherenceLogs(JSON.parse(localStorage.getItem('dhms_adherence_logs') || '{}'));
      
      const allLabOrders = JSON.parse(localStorage.getItem('dhms_lab_requests') || '[]');
      setLabOrders(allLabOrders.filter(l => l.patientId === patientId));
      
      setAdmissions(JSON.parse(localStorage.getItem('dhms_admissions') || '[]'));
      setLabFacilities(JSON.parse(localStorage.getItem('dhms_lab_facilities') || '[]'));
    };

    // Load initial check
    const list = JSON.parse(localStorage.getItem('dhms_patients') || '[]');
    const id = currentPatient?.id || loggedInPatient?.id || "PT-80234";
    const found = list.find(p => p.id === id);
    if (found) {
      setCurrentPatient(found);
    }

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [activeTab, loggedInPatient, currentPatient?.id]);

  // Appointments & Consultations State
  const [appointments, setAppointments] = useState(() => {
    const list = JSON.parse(localStorage.getItem('dhms_appointments') || '[]');
    const patientId = currentPatient?.id || "PT-80234";
    return list.filter(a => a.patientId === patientId);
  });

  const [reschedulingAppt, setReschedulingAppt] = useState(null);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('');

  const handleCancelConsultation = (apptId) => {
    if (window.confirm("Are you sure you want to cancel this consultation?")) {
      const allAppts = JSON.parse(localStorage.getItem('dhms_appointments') || '[]');
      const updated = allAppts.map(a => {
        if (a.id === apptId) {
          return { ...a, status: 'Cancelled' };
        }
        return a;
      });
      localStorage.setItem('dhms_appointments', JSON.stringify(updated));
      const patientId = currentPatient?.id || "PT-80234";
      setAppointments(updated.filter(a => a.patientId === patientId));
      alert("Consultation cancelled successfully.");
    }
  };

  const handleRescheduleSubmit = (e) => {
    e.preventDefault();
    if (!rescheduleDate || !rescheduleTime) return;

    const allAppts = JSON.parse(localStorage.getItem('dhms_appointments') || '[]');
    const updated = allAppts.map(a => {
      if (a.id === reschedulingAppt.id) {
        return { ...a, date: rescheduleDate, time: rescheduleTime, status: 'Rescheduled' };
      }
      return a;
    });

    localStorage.setItem('dhms_appointments', JSON.stringify(updated));
    const patientId = currentPatient?.id || "PT-80234";
    setAppointments(updated.filter(a => a.patientId === patientId));
    setReschedulingAppt(null);
    setRescheduleDate('');
    setRescheduleTime('');
    alert("Appointment rescheduled successfully!");
  };

  // Medication Adherence tracking
  const [adherenceLogs, setAdherenceLogs] = useState(() => {
    return JSON.parse(localStorage.getItem('dhms_adherence_logs') || '{}');
  });

  const handleTakeDose = (rxId) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const patientId = currentPatient?.id || "PT-80234";
    const logKey = `${patientId}_${rxId}_${todayStr}`;
    
    const updated = {
      ...adherenceLogs,
      [logKey]: true
    };
    localStorage.setItem('dhms_adherence_logs', JSON.stringify(updated));
    setAdherenceLogs(updated);
  };

  // EHR States
  const [ehrRecords, setEhrRecords] = useState(() => {
    return currentPatient?.reports || [];
  });
  const [ehrSearchQuery, setEhrSearchQuery] = useState('');
  const [ehrFilterType, setEhrFilterType] = useState('All');
  const [selectedEhrRecord, setSelectedEhrRecord] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Laboratory States
  const [labOrders, setLabOrders] = useState(() => {
    const list = JSON.parse(localStorage.getItem('dhms_lab_requests') || '[]');
    const patientId = currentPatient?.id || "PT-80234";
    return list.filter(l => l.patientId === patientId);
  });
  const [selectedLabOrder, setSelectedLabOrder] = useState(null);
  const [showOrderLabModal, setShowOrderLabModal] = useState(false);
  const [labFacilities, setLabFacilities] = useState(() => {
    return JSON.parse(localStorage.getItem('dhms_lab_facilities') || '[]');
  });
  const [newLabTestName, setNewLabTestName] = useState(() => {
    const list = JSON.parse(localStorage.getItem('dhms_lab_facilities') || '[]');
    return list[0]?.name || '';
  });
  const [labSubTab, setLabSubTab] = useState('orders');

  // Telemedicine States
  const [teleconsultations, setTeleconsultations] = useState(() => {
    const saved = JSON.parse(localStorage.getItem('dhms_appointments') || '[]');
    const patientId = currentPatient?.id || "PT-80234";
    const teleAppts = saved.filter(a => a.patientId === patientId && a.type === 'Telemedicine');
    return teleAppts.map(a => ({
      id: a.id,
      doctor: a.doctorName,
      department: a.department,
      date: a.date,
      time: a.time,
      status: a.status === 'Scheduled' ? 'Ready' : a.status,
      reason: a.reason
    }));
  });
  const [isVideoCallActive, setIsVideoCallActive] = useState(false);
  const [activeCallId, setActiveCallId] = useState('');
  const [callChatMessages, setCallChatMessages] = useState([]);
  const [newChatMessage, setNewChatMessage] = useState('');
  const [showScheduleTeleModal, setShowScheduleTeleModal] = useState(false);
  const [newTeleDoctor, setNewTeleDoctor] = useState('');
  const [newTeleDept, setNewTeleDept] = useState('Primary Care');
  const [newTeleDate, setNewTeleDate] = useState('');
  const [newTeleTime, setNewTeleTime] = useState('');
  const [newTeleReason, setNewTeleReason] = useState('');

  useEffect(() => {
    if (!isVideoCallActive) return;
    const chatKey = `dhms_tele_chat_${activeCallId}`;
    if (!localStorage.getItem(chatKey)) {
      const initialMsgs = [
        { sender: "doctor", text: "Hello John, I've reviewed your ECG and recent lab values. How have you been feeling since our last visit?", time: "01:50 PM" }
      ];
      localStorage.setItem(chatKey, JSON.stringify(initialMsgs));
    }
    const interval = setInterval(() => {
      const msgs = JSON.parse(localStorage.getItem(chatKey) || '[]');
      setCallChatMessages(msgs);

      const savedAppts = JSON.parse(localStorage.getItem('dhms_appointments') || '[]');
      const currentAppt = savedAppts.find(a => a.id === activeCallId);
      if (currentAppt && currentAppt.status === 'Completed') {
        setIsVideoCallActive(false);
        setTeleconsultations(prev => prev.map(t => t.id === activeCallId ? { ...t, status: 'Completed' } : t));
        if (window.Swal) {
          window.Swal.fire({
            title: 'Consultation Ended',
            text: 'The telemedicine consultation has been ended by the doctor. Please schedule a new appointment to reconnect.',
            icon: 'info',
            confirmButtonColor: '#3b82f6'
          });
        } else {
          alert("The telemedicine consultation has been ended by the doctor. Please schedule a new appointment to reconnect.");
        }
      }
    }, 800);
    return () => clearInterval(interval);
  }, [isVideoCallActive, activeCallId]);

  // Physical Appointment Request States
  const [showRequestApptModal, setShowRequestApptModal] = useState(false);
  const [newApptDoctor, setNewApptDoctor] = useState('Dr. Gregory House');
  const [newApptDept, setNewApptDept] = useState('Cardiology');
  const [newApptDate, setNewApptDate] = useState('');
  const [newApptTime, setNewApptTime] = useState('');
  const [newApptReason, setNewApptReason] = useState('');

  // Admissions and Billing states
  const [admissions, setAdmissions] = useState(() => {
    return JSON.parse(localStorage.getItem('dhms_admissions') || '[]');
  });
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [selectedAdmissionForPay, setSelectedAdmissionForPay] = useState(null);
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');

  const handlePayAndDischarge = (e) => {
    e.preventDefault();
    if (!selectedAdmissionForPay) return;

    const today = new Date().toISOString().split('T')[0];
    const totalBill = (selectedAdmissionForPay.medications || [])
      .filter(m => m.status === 'Dispensed')
      .reduce((sum, m) => sum + (parseFloat(m.cost) || 0), 0);

    const updatedAdmissions = admissions.map(a => {
      if (a.id === selectedAdmissionForPay.id) {
        return {
          ...a,
          status: 'Discharged',
          dischargeDate: today,
          pharmacyBillPaid: true
        };
      }
      return a;
    });

    setAdmissions(updatedAdmissions);
    localStorage.setItem('dhms_admissions', JSON.stringify(updatedAdmissions));

    // Update billing central registry
    const billing = JSON.parse(localStorage.getItem('dhms_billing') || '[]');
    const newInvoice = {
      id: `INV-${Math.floor(1000 + Math.random() * 9000)}`,
      patientId: selectedAdmissionForPay.patientId,
      patientName: selectedAdmissionForPay.patientName,
      date: today,
      amount: `₹${totalBill.toFixed(2)}`,
      status: 'Paid',
      type: 'Admitted Pharmacy Bill'
    };
    localStorage.setItem('dhms_billing', JSON.stringify([newInvoice, ...billing]));

    alert(`Payment of ₹${totalBill.toFixed(2)} successful! You have been discharged.`);
    setShowCheckoutModal(false);
    setSelectedAdmissionForPay(null);
    setCardNumber('');
    setCardExpiry('');
    setCardCvv('');
  };

  const visitHistoryData = [
    ...(currentPatient?.clinicalHistory || []).map((h, index) => ({
      id: h.id || `V-${1000 + index}`,
      date: h.date,
      time: h.time || "09:00 AM",
      doctor: h.doctor,
      department: h.department || "General OPD",
      reason: h.reason || "Consultation",
      diagnosis: h.diagnosis,
      notes: h.diagnosis, // Map diagnosis to notes fallback
      symptoms: h.symptoms,
      physicalExam: h.physicalExam,
      plan: h.plan,
      isAdmitted: h.isAdmitted,
      admissionWard: h.admissionWard,
      isReferred: h.isReferred,
      referral: h.referral,
      vitals: {
        bp: h.vitals?.bp || "N/A",
        hr: h.vitals?.hr ? `${h.vitals.hr} BPM` : "N/A",
        temp: h.vitals?.temp ? `${h.vitals.temp} °F` : "N/A",
        spo2: h.vitals?.spo2 ? `${h.vitals.spo2}%` : "N/A",
        weight: h.vitals?.weight || "-"
      },
      prescriptions: h.prescriptions || [],
      labs: h.labs || [],
      status: "Completed"
    }))
  ];

  const renderHealthConsole = () => (
    <>
      <div className="pd-welcome-banner">
        <div>
          <h1>Welcome back, <span className="highlight">{currentPatient ? `${currentPatient.firstName} ${currentPatient.lastName}` : "John Doe"}</span></h1>
          <p>Your comprehensive health profile is securely encrypted and maintained.</p>
        </div>
        <button className="pd-btn-primary" onClick={() => setShowRequestApptModal(true)}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
          Request Appointment
        </button>
      </div>

      {/* Vitals Grid */}
      {(() => {
        const latestVitals = currentPatient?.clinicalHistory?.[0]?.vitals || { bp: "--", hr: "--", temp: "--", spo2: "--" };
        
        // Vitals helper indicators
        const getBPStatus = (bpVal) => {
          if (!bpVal || bpVal === "--") return { label: 'No Data', class: 'warning' };
          const parts = bpVal.split('/');
          if (parts.length === 2) {
            const sys = parseInt(parts[0]);
            const dia = parseInt(parts[1]);
            if (sys >= 140 || dia >= 90) return { label: 'Hypertension', class: 'danger' };
            if (sys < 90 || dia < 60) return { label: 'Low BP', class: 'warning' };
          }
          return { label: 'Optimal', class: 'success' };
        };

        const getHRStatus = (hrVal) => {
          if (!hrVal || hrVal === "--") return { label: 'No Data', class: 'warning' };
          const hr = parseInt(hrVal);
          if (isNaN(hr)) return { label: 'Normal', class: 'success' };
          if (hr > 100) return { label: 'Tachycardia', class: 'danger' };
          if (hr < 60) return { label: 'Bradycardia', class: 'warning' };
          return { label: 'Normal Resting', class: 'success' };
        };

        const getTempStatus = (tempVal) => {
          if (!tempVal || tempVal === "--") return { label: 'No Data', class: 'warning' };
          const temp = parseFloat(tempVal);
          if (isNaN(temp)) return { label: 'Normal', class: 'success' };
          if (temp > 100.4) return { label: 'Fever (Pyrexia)', class: 'danger' };
          if (temp < 96.0) return { label: 'Hypothermia', class: 'warning' };
          return { label: 'Normal Temp', class: 'success' };
        };

        const getSpO2Status = (spo2Val) => {
          if (!spo2Val || spo2Val === "--") return { label: 'No Data', class: 'warning' };
          const spo2 = parseInt(spo2Val);
          if (isNaN(spo2)) return { label: 'Optimal', class: 'success' };
          if (spo2 < 95) return { label: 'Hypoxia (Low O₂)', class: 'danger' };
          return { label: 'Optimal', class: 'success' };
        };

        const bpSt = getBPStatus(latestVitals.bp);
        const hrSt = getHRStatus(latestVitals.hr);
        const tempSt = getTempStatus(latestVitals.temp);
        const spo2St = getSpO2Status(latestVitals.spo2);

        return (
          <div className="pd-vitals-grid">
            <div className="pd-vital-card">
              <div className="pd-vital-header">
                <span>Heart Rate</span>
                <div className="pd-vital-icon red">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                </div>
              </div>
              <div className="pd-vital-value">{latestVitals.hr?.replace(/[a-zA-Z\s]/g, '') || "72"} <span>BPM</span></div>
              <div className={`pd-vital-status ${hrSt.class}`}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                {hrSt.label}
              </div>
              <div className="pd-progress-bar"><div className={`pd-progress ${hrSt.class === 'danger' ? 'red' : hrSt.class === 'warning' ? 'orange' : 'green'}`} style={{width: '60%'}}></div></div>
            </div>

            <div className="pd-vital-card">
              <div className="pd-vital-header">
                <span>Blood Pressure</span>
                <div className="pd-vital-icon green">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
                </div>
              </div>
              <div className="pd-vital-value">{latestVitals.bp?.replace(/\smmHg/g, '') || "120/80"} <span>mmHg</span></div>
              <div className={`pd-vital-status ${bpSt.class}`}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                {bpSt.label}
              </div>
              <div className="pd-progress-bar"><div className={`pd-progress ${bpSt.class === 'danger' ? 'red' : bpSt.class === 'warning' ? 'orange' : 'green'}`} style={{width: '40%'}}></div></div>
            </div>

            <div className="pd-vital-card">
              <div className="pd-vital-header">
                <span>Temperature</span>
                <div className="pd-vital-icon purple">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"/></svg>
                </div>
              </div>
              <div className="pd-vital-value">{latestVitals.temp?.replace(/[a-zA-Z\s°]/g, '') || "98.6"} <span>°F</span></div>
              <div className={`pd-vital-status ${tempSt.class}`}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                {tempSt.label}
              </div>
              <div className="pd-progress-bar"><div className={`pd-progress ${tempSt.class === 'danger' ? 'red' : tempSt.class === 'warning' ? 'orange' : 'purple'}`} style={{width: '50%'}}></div></div>
            </div>

            <div className="pd-vital-card">
              <div className="pd-vital-header">
                <span>Blood Oxygen (SpO₂)</span>
                <div className="pd-vital-icon orange">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M12 6v6l4 2"></path></svg>
                </div>
              </div>
              <div className="pd-vital-value">{latestVitals.spo2?.replace(/[%]/g, '') || "98"} <span>%</span></div>
              <div className={`pd-vital-status ${spo2St.class}`}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                {spo2St.label}
              </div>
              <div className="pd-progress-bar"><div className={`pd-progress ${spo2St.class === 'danger' ? 'red' : 'orange'}`} style={{width: '80%'}}></div></div>
            </div>
          </div>
        );
      })()}

      <div className="pd-content-grid">
        <div className="pd-left-column">
          {/* Upcoming Consultations */}
          <div className="pd-section-card">
            <div className="pd-section-header">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
              <h3>Upcoming Consultations</h3>
            </div>
            
            {(() => {
              const myAppts = appointments.filter(a => 
                a.patientId === (currentPatient?.id || "PT-80234") && 
                a.status !== 'Completed' && 
                a.status !== 'Cancelled'
              );

              if (myAppts.length === 0) {
                return (
                  <div style={{ textAlign: 'center', padding: '24px', color: '#64748b', fontStyle: 'italic' }}>
                    No upcoming consultations scheduled.
                  </div>
                );
              }

              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {myAppts.map(appt => (
                    <div key={appt.id} className="pd-consultation-item" style={{ margin: 0 }}>
                      <div className="pd-consult-info">
                        <h4>{appt.doctorName}</h4>
                        <p>{appt.reason || `${appt.department} Consultation`}</p>
                      </div>
                      <div className="pd-consult-meta">
                        <div className="pd-date">{appt.date} at {appt.time}</div>
                        <div className="pd-badge in-session" style={{ backgroundColor: appt.status === 'Pending Confirmation' ? '#fef3c7' : '#dcfce7', color: appt.status === 'Pending Confirmation' ? '#d97706' : '#15803d' }}>
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
                          {appt.status}
                        </div>
                      </div>
                      <div className="pd-consult-actions">
                        <button 
                          className="pd-btn-outline" 
                          onClick={() => {
                            setReschedulingAppt(appt);
                            setRescheduleDate(appt.date);
                            setRescheduleTime(appt.time);
                          }}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg> 
                          Reschedule
                        </button>
                        <button 
                          className="pd-btn-outline danger"
                          onClick={() => handleCancelConsultation(appt.id)}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg> 
                          Cancel Consultation
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>

          {/* Active Prescriptions */}
          <div className="pd-section-card">
            <div className="pd-section-header">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
              <h3>Active Prescriptions Tracker</h3>
            </div>
            {(() => {
              const myPrescriptions = JSON.parse(localStorage.getItem('dhms_prescriptions') || '[]')
                .filter(r => r.patientId === (currentPatient?.id || "PT-80234"));
              
              if (myPrescriptions.length === 0) {
                return (
                  <div className="pd-empty-state">
                    <p>No active prescriptions on file. Outpatient prescriptions advised by your provider will show up here.</p>
                  </div>
                );
              }

              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
                  {myPrescriptions.map(rx => (
                    <div key={rx.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#f8fafc', alignItems: 'center' }}>
                      <div>
                        <h5 style={{ margin: '0 0 2px 0', fontSize: '13px', color: '#1e293b' }}>{rx.medication}</h5>
                        <p style={{ margin: 0, fontSize: '11px', color: '#64748b' }}>Provider: <strong>{rx.doctorName}</strong> • Prescribed: {rx.date}</p>
                        {rx.instructions && <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: '#4f46e5', fontWeight: '500' }}>Instructions: {rx.instructions}</p>}
                      </div>
                      <span className={`status-badge ${rx.status.toLowerCase().replace(/\s/g, '')}`} style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '12px', fontWeight: 'bold', backgroundColor: rx.status === 'Dispensed & Billed' ? '#dcfce7' : '#fee2e2', color: rx.status === 'Dispensed & Billed' ? '#15803d' : '#b91c1c' }}>
                        {rx.status}
                      </span>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        </div>

        <div className="pd-right-column">
          {/* Daily Medication Prompts */}
          <div className="pd-section-card pd-medication-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="pd-section-header" style={{ marginBottom: '8px' }}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
              <h3>Daily Medication Adherence Prompts</h3>
            </div>

            {(() => {
              const myPrescriptions = JSON.parse(localStorage.getItem('dhms_prescriptions') || '[]')
                .filter(r => r.patientId === (currentPatient?.id || "PT-80234"));

              const activePrompts = myPrescriptions;

              if (activePrompts.length === 0) {
                return (
                  <div style={{ textAlign: 'center', padding: '24px', color: '#64748b', fontStyle: 'italic' }}>
                    No daily medication adherence prompts.
                  </div>
                );
              }

              const todayStr = new Date().toISOString().split('T')[0];
              const patientId = currentPatient?.id || "PT-80234";

              const getCompliance = (rxId) => {
                let takenCount = 0;
                const today = new Date();
                for (let i = 0; i < 7; i++) {
                  const d = new Date(today);
                  d.setDate(today.getDate() - i);
                  const dStr = d.toISOString().split('T')[0];
                  const logKey = `${patientId}_${rxId}_${dStr}`;
                  if (adherenceLogs[logKey]) {
                    takenCount++;
                  }
                }
                const todayTaken = adherenceLogs[`${patientId}_${rxId}_${todayStr}`];
                const baseline = todayTaken ? 4 : 3;
                const total = Math.max(takenCount, baseline);
                return Math.min(Math.round((total / 7) * 100), 100);
              };

              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {activePrompts.map(rx => {
                    const rxKey = rx.id || rx.medication;
                    const takenToday = adherenceLogs[`${patientId}_${rxKey}_${todayStr}`] === true;
                    const compliance = getCompliance(rxKey);
                    const circleColor = compliance >= 80 ? 'green' : compliance >= 50 ? 'purple' : 'red';

                    return (
                      <div key={rxKey} className="pd-med-prompt" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#f8fafc', margin: 0, gap: '16px' }}>
                        <div className="pd-med-chart" style={{ flexShrink: 0 }}>
                          <svg viewBox="0 0 36 36" className={`circular-chart ${circleColor}`} style={{ width: '42px', height: '42px' }}>
                            <path className="circle-bg"
                              d="M18 2.0845
                                a 15.9155 15.9155 0 0 1 0 31.831
                                a 15.9155 15.9155 0 0 1 0 -31.831"
                            />
                            <path className="circle"
                              strokeDasharray={`${compliance}, 100`}
                              d="M18 2.0845
                                a 15.9155 15.9155 0 0 1 0 31.831
                                a 15.9155 15.9155 0 0 1 0 -31.831"
                            />
                            <text x="18" y="20.35" className="percentage" style={{ fontSize: '9px', fontWeight: 'bold' }}>{compliance}%</text>
                          </svg>
                        </div>
                        <div className="pd-med-details" style={{ flex: 1 }}>
                          <h4 style={{ margin: '0 0 2px 0', fontSize: '14px', color: '#1e293b' }}>{rx.medication.split(' (')[0]}</h4>
                          <p style={{ margin: 0, fontSize: '11px', color: '#64748b' }}>{rx.instructions || rx.medication || "Take as directed"}</p>
                        </div>
                        <button 
                          className={takenToday ? "pd-btn-outline success" : "pd-btn-teal"} 
                          onClick={() => !takenToday && handleTakeDose(rxKey)}
                          disabled={takenToday}
                          style={{ 
                            padding: '8px 12px', 
                            fontSize: '12px', 
                            fontWeight: '600', 
                            borderRadius: '6px', 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '4px',
                            cursor: takenToday ? 'default' : 'pointer',
                            opacity: takenToday ? 0.8 : 1,
                            backgroundColor: takenToday ? '#dcfce7' : '',
                            color: takenToday ? '#15803d' : '',
                            borderColor: takenToday ? '#bbf7d0' : '',
                            flexDirection: 'column'
                          }}
                        >
                          {takenToday ? (
                            <>
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" style={{ width: '14px', height: '14px' }}>
                                <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
                              </svg>
                              Taken
                            </>
                          ) : (
                            <>
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: '14px', height: '14px' }}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                              Take Dose
                            </>
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        </div>
      </div>

      {/* Physical Appointment Request Modal */}
      {showRequestApptModal && (
        <div className="pd-modal-overlay" onClick={() => setShowRequestApptModal(false)}>
          <div className="pd-modal-content" onClick={(e) => e.stopPropagation()}>
            <form onSubmit={handleRequestApptSubmit}>
              <div className="pd-modal-header">
                <h2>Request Clinic Appointment</h2>
                <button className="pd-modal-close" type="button" onClick={() => setShowRequestApptModal(false)}>&times;</button>
              </div>
              <div className="pd-modal-body">
                <div className="rd-form-row" style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
                  <div className="rd-form-group" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ fontSize: '13px', color: '#475569', fontWeight: '600' }}>Select Doctor</label>
                    <select 
                      value={newApptDoctor} 
                      onChange={(e) => setNewApptDoctor(e.target.value)}
                      style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', background: 'white' }}
                    >
                      <option value="Dr. Gregory House">Dr. Gregory House (Cardiology)</option>
                      <option value="Dr. Meredith Grey">Dr. Meredith Grey (General Surgery)</option>
                      <option value="Dr. John Watson">Dr. John Watson (Primary Care)</option>
                    </select>
                  </div>
                  <div className="rd-form-group" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ fontSize: '13px', color: '#475569', fontWeight: '600' }}>Department</label>
                    <select 
                      value={newApptDept} 
                      onChange={(e) => setNewApptDept(e.target.value)}
                      style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', background: 'white' }}
                    >
                      <option value="Cardiology">Cardiology</option>
                      <option value="General Surgery">General Surgery</option>
                      <option value="Primary Care">Primary Care</option>
                    </select>
                  </div>
                </div>

                <div className="rd-form-row" style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
                  <div className="rd-form-group" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ fontSize: '13px', color: '#475569', fontWeight: '600' }}>Preferred Date</label>
                    <input 
                      type="date" 
                      required 
                      value={newApptDate} 
                      onChange={(e) => setNewApptDate(e.target.value)} 
                      style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                    />
                  </div>
                  <div className="rd-form-group" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ fontSize: '13px', color: '#475569', fontWeight: '600' }}>Preferred Time Slot</label>
                    <input 
                      type="time" 
                      required 
                      value={newApptTime} 
                      onChange={(e) => setNewApptTime(e.target.value)}
                      style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                    />
                  </div>
                </div>

                <div className="rd-form-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '13px', color: '#475569', fontWeight: '600' }}>Reason for Visit</label>
                  <textarea 
                    required 
                    value={newApptReason} 
                    onChange={(e) => setNewApptReason(e.target.value)} 
                    placeholder="Describe symptoms or reasons for visit..."
                    rows="3"
                    style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', resize: 'vertical' }}
                  />
                </div>
              </div>
              <div className="pd-modal-footer">
                <button className="pd-btn-primary" type="submit">Submit Request</button>
                <button className="pd-btn-outline" type="button" onClick={() => setShowRequestApptModal(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );

  const renderPatientProfile = () => (
    <div className="pd-profile-view">
      <div className="pd-welcome-banner">
        <div>
          <h1>Digital <span className="highlight">Patient Profile</span></h1>
          <p>Manage your personal information, emergency contacts, and insurance details.</p>
        </div>
        <button className="pd-btn-primary">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
          Edit Profile
        </button>
      </div>

      <div className="pd-profile-grid-layout">
        <div className="pd-section-card">
          <div className="pd-section-header">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
            <h3>Personal Information</h3>
          </div>
          <div className="pd-info-grid">
            <div className="pd-info-item">
              <label>Full Name</label>
              <p>{currentPatient ? `${currentPatient.firstName} ${currentPatient.lastName}` : "John Doe"}</p>
            </div>
            <div className="pd-info-item">
              <label>Date of Birth</label>
              <p>{currentPatient?.dob || "--"}</p>
            </div>
            <div className="pd-info-item">
              <label>Gender</label>
              <p style={{ textTransform: 'capitalize' }}>{currentPatient?.gender || "--"}</p>
            </div>
            <div className="pd-info-item">
              <label>Blood Type</label>
              <p>{currentPatient?.bloodType || "--"}</p>
            </div>
            <div className="pd-info-item">
              <label>Phone Number</label>
              <p>{currentPatient?.phone || "--"}</p>
            </div>
            <div className="pd-info-item">
              <label>Email Address</label>
              <p>{currentPatient?.email || "--"}</p>
            </div>
          </div>
        </div>

        <div className="pd-section-card">
          <div className="pd-section-header">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
            <h3>Medical History Synopsis</h3>
          </div>
          <div className="pd-info-grid">
            <div className="pd-info-item full-width">
              <label>Known Allergies</label>
              <div className="pd-tags">
                {(currentPatient?.allergies || "None").split(',').map((alg, idx) => (
                  <span key={idx} className="pd-tag red">{alg.trim()}</span>
                ))}
              </div>
            </div>
            <div className="pd-info-item full-width">
              <label>Chronic Conditions</label>
              <div className="pd-tags">
                {(currentPatient?.chronicConditions || "None").split(',').map((cond, idx) => (
                  <span key={idx} className="pd-tag blue">{cond.trim()}</span>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="pd-section-card">
          <div className="pd-section-header">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
            <h3>Insurance Details</h3>
          </div>
          {(() => {
            const policies = JSON.parse(localStorage.getItem('dhms_insurance_policies') || '[]');
            const myPolicy = policies.find(p => p.patientId === (currentPatient?.id || "PT-80234"));
            return (
              <div className="pd-info-grid">
                <div className="pd-info-item">
                  <label>Provider</label>
                  <p>{myPolicy ? myPolicy.provider : "--"}</p>
                </div>
                <div className="pd-info-item">
                  <label>Policy Number</label>
                  <p>{myPolicy ? myPolicy.policyNo : "--"}</p>
                </div>
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );

  const renderVisitHistory = () => {
    const filteredVisits = visitHistoryData.filter(visit => {
      const matchesSearch = visit.doctor.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            visit.diagnosis.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            visit.reason.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesDept = deptFilter === 'All' || visit.department === deptFilter;
      return matchesSearch && matchesDept;
    });

    return (
      <div className="pd-history-view">
        <div className="pd-welcome-banner">
          <div>
            <h1>Visit <span className="highlight">History Logs</span></h1>
            <p>Access diagnoses, vital statistics, and clinical notes from your previous appointments.</p>
          </div>
          <div className="pd-stats-badge-row">
            <div className="pd-stat-mini">
              <span className="pd-stat-label">Total Visits</span>
              <span className="pd-stat-val">{visitHistoryData.length}</span>
            </div>
            <div className="pd-stat-mini">
              <span className="pd-stat-label">Last Consult</span>
              <span className="pd-stat-val">10 Jul 2026</span>
            </div>
          </div>
        </div>

        {/* Filter Section */}
        <div className="pd-filter-bar">
          <div className="pd-search-input-wrapper">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="search-icon"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            <input 
              type="text" 
              placeholder="Search by doctor, diagnosis, or symptoms..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pd-filter-search"
            />
          </div>

          <div className="pd-filter-dropdowns">
            <select value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)} className="pd-filter-select">
              <option value="All">All Departments</option>
              <option value="Cardiology">Cardiology</option>
              <option value="Immunology">Immunology</option>
              <option value="General Medicine">General Medicine</option>
            </select>
          </div>
        </div>

        {/* List of Visits */}
        <div className="pd-visits-list">
          {filteredVisits.length === 0 ? (
            <div className="pd-empty-state">
              <p>No visit logs match your filters</p>
            </div>
          ) : (
            filteredVisits.map((visit) => (
              <div key={visit.id} className="pd-visit-row-card">
                <div className="pd-visit-row-header">
                  <div className="pd-visit-meta-primary">
                    <div className="pd-visit-date-badge">
                      <span className="day">{new Date(visit.date).getDate()}</span>
                      <span className="month">{new Date(visit.date).toLocaleString('default', { month: 'short' })}</span>
                    </div>
                    <div className="pd-visit-title-group">
                      <h3>{visit.doctor}</h3>
                      <span className="pd-dept-tag">{visit.department}</span>
                    </div>
                  </div>
                  <div className="pd-visit-meta-secondary">
                    <span className="pd-visit-time">{visit.time}</span>
                    <span className="pd-badge completed">{visit.status}</span>
                  </div>
                </div>

                <div className="pd-visit-row-body">
                  <div className="pd-visit-detail-item">
                    <strong>Reason for Visit:</strong>
                    <p>{visit.reason}</p>
                  </div>
                  <div className="pd-visit-detail-item">
                    <strong>Diagnosis:</strong>
                    <p>{visit.diagnosis}</p>
                  </div>
                  <div className="pd-visit-detail-item">
                    <strong>Prescribed Medications:</strong>
                    <div className="pd-prescription-mini-tags">
                      {visit.prescriptions.length === 0 ? <span style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: '12px' }}>None prescribed</span> : visit.prescriptions.map((p, idx) => {
                        if (typeof p === 'string') {
                          return <span key={idx} className="pd-presc-tag">{p}</span>;
                        }
                        return <span key={idx} className="pd-presc-tag">{p.name} ({p.dosage})</span>;
                      })}
                    </div>
                  </div>
                </div>

                <div className="pd-visit-row-footer">
                  <button className="pd-btn-secondary" onClick={() => setSelectedVisit(visit)}>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                    View Full Clinical Log
                  </button>
                  <button className="pd-btn-outline" onClick={() => alert(`Downloading visit summary for ${visit.id} (PDF)...`)}>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                    Download Summary PDF
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Modal for Visit Details */}
        {selectedVisit && (
          <div className="pd-modal-overlay" onClick={() => setSelectedVisit(null)}>
            <div className="pd-modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '650px' }}>
              <div className="pd-modal-header">
                <h2>Visit Log Details: {selectedVisit.id}</h2>
                <button className="pd-modal-close" onClick={() => setSelectedVisit(null)}>&times;</button>
              </div>
              <div className="pd-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="pd-modal-meta-grid">
                  <div><strong>Doctor:</strong> <p>{selectedVisit.doctor}</p></div>
                  <div><strong>Department:</strong> <p>{selectedVisit.department}</p></div>
                  <div><strong>Date / Time:</strong> <p>{selectedVisit.date} at {selectedVisit.time}</p></div>
                  <div><strong>Status:</strong> <span className="pd-badge completed">{selectedVisit.status}</span></div>
                </div>

                <div className="pd-modal-section">
                  <h3>Recorded Vitals</h3>
                  <div className="pd-modal-vitals-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '10px' }}>
                    <div className="pd-modal-vital-item"><strong>BP:</strong> <span>{selectedVisit.vitals.bp}</span></div>
                    <div className="pd-modal-vital-item"><strong>Heart Rate:</strong> <span>{selectedVisit.vitals.hr}</span></div>
                    <div className="pd-modal-vital-item"><strong>Temperature:</strong> <span>{selectedVisit.vitals.temp}</span></div>
                    {selectedVisit.vitals.spo2 && (
                      <div className="pd-modal-vital-item"><strong>SpO₂:</strong> <span>{selectedVisit.vitals.spo2}</span></div>
                    )}
                    <div className="pd-modal-vital-item"><strong>Weight:</strong> <span>{selectedVisit.vitals.weight}</span></div>
                  </div>
                </div>

                <div className="pd-modal-section">
                  <h3>Reason for Visit</h3>
                  <p className="pd-modal-text">{selectedVisit.reason}</p>
                </div>

                <div className="pd-modal-section">
                  <h3>Clinical Assessment & Diagnosis</h3>
                  <p className="pd-modal-text highlight-box" style={{ background: '#f5f3ff', borderLeft: '4px solid #7c3aed', padding: '10px', borderRadius: '4px', margin: 0, fontWeight: '600' }}>{selectedVisit.diagnosis}</p>
                </div>

                {selectedVisit.symptoms && (
                  <div className="pd-modal-section">
                    <h3>Chief Complaint & Symptoms (HPI)</h3>
                    <p className="pd-modal-text">{selectedVisit.symptoms}</p>
                  </div>
                )}

                {selectedVisit.physicalExam && (
                  <div className="pd-modal-section">
                    <h3>Physical Examination Findings</h3>
                    <p className="pd-modal-text">{selectedVisit.physicalExam}</p>
                  </div>
                )}

                {selectedVisit.plan && (
                  <div className="pd-modal-section">
                    <h3>Treatment Plan & Recommendations</h3>
                    <p className="pd-modal-text">{selectedVisit.plan}</p>
                  </div>
                )}

                {selectedVisit.notes && !selectedVisit.symptoms && (
                  <div className="pd-modal-section">
                    <h3>Clinical Notes</h3>
                    <p className="pd-modal-text">{selectedVisit.notes}</p>
                  </div>
                )}

                <div className="pd-modal-section">
                  <h3>Prescriptions</h3>
                  {selectedVisit.prescriptions.length === 0 ? (
                    <p style={{ color: '#64748b', fontStyle: 'italic', margin: 0 }}>No medications prescribed during this visit.</p>
                  ) : (
                    <table className="pd-modal-table" style={{ width: '100%', borderCollapse: 'collapse', marginTop: '6px' }}>
                      <thead>
                        <tr>
                          <th>Medication Details</th>
                          <th>Frequency</th>
                          <th>Duration</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedVisit.prescriptions.map((p, idx) => {
                          if (typeof p === 'string') {
                            const parts = p.split(' - ');
                            const nameDose = parts[0] || '';
                            const rest = parts[1] || '';
                            return (
                              <tr key={idx}>
                                <td><strong>{nameDose}</strong></td>
                                <td colSpan="2">{rest}</td>
                              </tr>
                            );
                          }
                          return (
                            <tr key={idx}>
                              <td><strong>{p.name}</strong> - {p.dosage}</td>
                              <td>{p.frequency}</td>
                              <td>{p.duration}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>

                {selectedVisit.labs && selectedVisit.labs.length > 0 && (
                  <div className="pd-modal-section">
                    <h3>Laboratory Diagnostics Ordered</h3>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '6px' }}>
                      {selectedVisit.labs.map((l, idx) => (
                        <span key={idx} style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', padding: '4px 10px', borderRadius: '999px', fontSize: '12px', fontWeight: '500', color: '#475569' }}>
                          🔬 {typeof l === 'string' ? l : l.testName}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {selectedVisit.isAdmitted && (
                  <div className="pd-modal-section" style={{ backgroundColor: '#fff1f2', padding: '12px', borderRadius: '8px', border: '1px solid #fecdd3' }}>
                    <h4 style={{ color: '#9f1239', margin: '0 0 4px 0', fontSize: '13px', fontWeight: 'bold' }}>🏥 Inpatient Admission Advised</h4>
                    <p style={{ margin: 0, fontSize: '12px', color: '#4c0519' }}>Patient recommended for inpatient care in <strong>{selectedVisit.admissionWard}</strong>.</p>
                  </div>
                )}

                {selectedVisit.isReferred && selectedVisit.referral && (
                  <div className="pd-modal-section" style={{ backgroundColor: '#eff6ff', padding: '12px', borderRadius: '8px', border: '1px solid #bfdbfe' }}>
                    <h4 style={{ color: '#1e40af', margin: '0 0 4px 0', fontSize: '13px', fontWeight: 'bold' }}>🔄 Specialist Referral Issued</h4>
                    <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#1e3a8a' }}><strong>Referral Department:</strong> {selectedVisit.referral.department} • <strong>Consultant:</strong> {selectedVisit.referral.doctor}</p>
                    <p style={{ margin: 0, fontSize: '12px', color: '#1e3a8a' }}><strong>Reason:</strong> {selectedVisit.referral.reason}</p>
                  </div>
                )}
              </div>
              <div className="pd-modal-footer">
                <button className="pd-btn-primary" onClick={() => alert(`Printing invoice and record for ${selectedVisit.id}...`)}>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
                  Print Log Summary
                </button>
                <button className="pd-btn-outline" onClick={() => setSelectedVisit(null)}>Close</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const handleSimulatedUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(0);

    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setIsUploading(false);
            const newRecord = {
              id: `EHR-${Math.floor(100 + Math.random() * 900)}`,
              name: file.name,
              type: file.type.includes('image') ? 'Imaging' : 'Lab Report',
              size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
              date: new Date().toISOString().split('T')[0],
              author: "Self Uploaded",
              hash: "sha256-" + Array.from({length: 64}, () => Math.floor(Math.random()*16).toString(16)).join(''),
              details: { description: "Self uploaded patient health report." }
            };
            setEhrRecords(prevRecs => [newRecord, ...prevRecs]);
          }, 500);
          return 100;
        }
        return prev + 20;
      });
    }, 150);
  };

  const handleRequestApptSubmit = (e) => {
    e.preventDefault();
    const newAppt = {
      id: `APT-${Math.floor(10000 + Math.random() * 90000)}`,
      patientId: currentPatient?.id || "PT-80234",
      patientName: currentPatient ? `${currentPatient.firstName} ${currentPatient.lastName}` : "John Doe",
      doctorId: newApptDoctor.toLowerCase().replace('.', '').replace(' ', '_'),
      doctorName: newApptDoctor,
      department: newApptDept,
      date: newApptDate,
      time: newApptTime,
      reason: newApptReason,
      status: "Pending Confirmation",
      type: "Physical",
      source: "Online"
    };

    const currentAppts = JSON.parse(localStorage.getItem('dhms_appointments') || '[]');
    const updated = [newAppt, ...currentAppts];
    localStorage.setItem('dhms_appointments', JSON.stringify(updated));
    setAppointments(updated);

    setShowRequestApptModal(false);
    setNewApptReason('');
    alert("Appointment request submitted successfully!");
  };

  const handleScheduleTeleSubmit = (e) => {
    e.preventDefault();
    const newConsult = {
      id: `TELE-${Math.floor(100 + Math.random() * 900)}`,
      doctor: newTeleDoctor,
      department: newTeleDept,
      date: newTeleDate || "2026-07-20",
      time: newTeleTime || "11:00 AM",
      status: "Scheduled",
      reason: newTeleReason || "General health consultation."
    };
    setTeleconsultations(prev => [...prev, newConsult]);

    const newAppt = {
      id: newConsult.id,
      patientId: currentPatient?.id || "PT-80234",
      patientName: currentPatient ? `${currentPatient.firstName} ${currentPatient.lastName}` : "John Doe",
      doctorId: newTeleDoctor.toLowerCase().replace('.', '').replace(' ', '_'),
      doctorName: newTeleDoctor,
      department: newTeleDept,
      date: newConsult.date,
      time: newConsult.time,
      reason: newConsult.reason,
      status: "Scheduled",
      type: "Telemedicine",
      source: "Online"
    };
    const currentAppts = JSON.parse(localStorage.getItem('dhms_appointments') || '[]');
    const updated = [newAppt, ...currentAppts];
    localStorage.setItem('dhms_appointments', JSON.stringify(updated));
    setAppointments(updated);

    setShowScheduleTeleModal(false);
    setNewTeleReason('');
  };
  const handleOrderLabSubmit = (e) => {
    e.preventDefault();
    const facilities = JSON.parse(localStorage.getItem('dhms_lab_facilities') || '[]');
    const matchedFac = facilities.find(f => f.name === newLabTestName);
    const orderCost = matchedFac ? (matchedFac.cost.replace('₹', '')) : "85.00";
    const patientId = currentPatient?.id || loggedInPatient?.id || "PT-80234";
    const patientName = currentPatient ? `${currentPatient.firstName} ${currentPatient.lastName}` : "John Doe";
    const newOrder = {
      id: `LAB-${Math.floor(1000 + Math.random() * 9000)}`,
      patientId: patientId,
      patientName: patientName,
      testName: newLabTestName,
      status: "Pending",
      date: new Date().toISOString().split('T')[0],
      doctorName: "Self Requested",
      cost: `₹${orderCost}`,
      timeline: [
        { title: "Order Created", date: new Date().toLocaleString(), done: true },
        { title: "Sample Collection", date: "Pending", done: false },
        { title: "Received by Lab", date: "Pending", done: false },
        { title: "Results Published", date: "Pending", done: false }
      ],
      results: []
    };
    setLabOrders(prev => [newOrder, ...prev]);

    const centralLabs = JSON.parse(localStorage.getItem('dhms_lab_requests') || '[]');
    localStorage.setItem('dhms_lab_requests', JSON.stringify([newOrder, ...centralLabs]));

    setShowOrderLabModal(false);
  };

  const handleSendChatMessage = (e) => {
    e.preventDefault();
    if (!newChatMessage.trim()) return;

    const chatKey = `dhms_tele_chat_${activeCallId}`;
    const currentMsgs = JSON.parse(localStorage.getItem(chatKey) || '[]');

    const patientMsg = { 
      sender: "patient", 
      text: newChatMessage, 
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
    };
    
    const updatedMsgs = [...currentMsgs, patientMsg];
    localStorage.setItem(chatKey, JSON.stringify(updatedMsgs));
    setCallChatMessages(updatedMsgs);
    
    const inputMsg = newChatMessage;
    setNewChatMessage('');

    setTimeout(() => {
      let responseText = "Let me make sure we schedule a follow-up test for that.";
      const query = inputMsg.toLowerCase();
      if (query.includes("heart") || query.includes("chest") || query.includes("pain")) {
        responseText = "Any chest discomfort is important. Keep taking the Lisinopril as scheduled, limit physical exertion today, and I'll schedule a cardiac clinic review.";
      } else if (query.includes("cough") || query.includes("fever") || query.includes("cold")) {
        responseText = "It sounds like it could be a mild virus. Make sure you hydrate well and monitor your temp. Let me write a prescription for standard symptomatic relief.";
      } else if (query.includes("side effect") || query.includes("dizzy") || query.includes("medication")) {
        responseText = "Dizziness can sometimes be a side effect of blood pressure regulation. Please monitor your daily BP readings closely and log them in your Health Console.";
      } else if (query.includes("hello") || query.includes("hi")) {
        responseText = "Good day, John. How can I assist you with your health logs today?";
      }

      const latestMsgs = JSON.parse(localStorage.getItem(chatKey) || '[]');
      const updatedWithReply = [...latestMsgs, {
        sender: "doctor",
        text: responseText,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }];
      localStorage.setItem(chatKey, JSON.stringify(updatedWithReply));
      setCallChatMessages(updatedWithReply);
    }, 1200);
  };

  const renderEHRRecords = () => {
    const filteredRecords = ehrRecords.filter(rec => {
      const matchesSearch = rec.name.toLowerCase().includes(ehrSearchQuery.toLowerCase()) ||
                            rec.author.toLowerCase().includes(ehrSearchQuery.toLowerCase());
      const matchesType = ehrFilterType === 'All' || rec.type === ehrFilterType;
      return matchesSearch && matchesType;
    });

    return (
      <div className="pd-ehr-view">
        <div className="pd-welcome-banner">
          <div>
            <h1>EHR <span className="highlight">Medical Records</span></h1>
            <p>Access your complete, cryptographically signed electronic health records and lab reports.</p>
          </div>
          <div className="pd-stats-badge-row">
            <div className="pd-stat-mini">
              <span className="pd-stat-label">Verified Records</span>
              <span className="pd-stat-val">{ehrRecords.length}</span>
            </div>
          </div>
        </div>

        {/* Action Panel */}
        <div className="pd-ehr-actions-panel">
          <div className="pd-filter-bar" style={{ marginBottom: 0, flex: 1 }}>
            <div className="pd-search-input-wrapper">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="search-icon"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
              <input 
                type="text" 
                placeholder="Search documents by name or author..." 
                value={ehrSearchQuery}
                onChange={(e) => setEhrSearchQuery(e.target.value)}
                className="pd-filter-search"
              />
            </div>
            <select value={ehrFilterType} onChange={(e) => setEhrFilterType(e.target.value)} className="pd-filter-select">
              <option value="All">All Categories</option>
              <option value="Immunization">Immunizations</option>
              <option value="Lab Report">Lab Reports</option>
              <option value="Imaging">Radiology & Imaging</option>
            </select>
          </div>

          <div className="pd-upload-area-card">
            <label className="pd-upload-btn-label">
              <input type="file" onChange={handleSimulatedUpload} style={{ display: 'none' }} disabled={isUploading} />
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
              Upload New Record
            </label>
          </div>
        </div>

        {isUploading && (
          <div className="pd-upload-progress-container">
            <div className="progress-details">
              <span>Uploading document...</span>
              <span>{uploadProgress}%</span>
            </div>
            <div className="pd-progress-bar"><div className="pd-progress purple" style={{ width: `${uploadProgress}%` }}></div></div>
          </div>
        )}

        {/* List of Documents */}
        <div className="pd-section-card" style={{ marginTop: '20px' }}>
          <div className="pd-section-header">
            <h3>Secure Document Vault</h3>
          </div>
          <div className="pd-ehr-list">
            {filteredRecords.length === 0 ? (
              <div className="pd-empty-state">
                <p>No medical records found in this category.</p>
              </div>
            ) : (
              filteredRecords.map(rec => (
                <div key={rec.id} className="pd-ehr-item">
                  <div className="pd-ehr-info">
                    <div className="ehr-doc-badge">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ehr-doc-icon"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                    </div>
                    <div>
                      <h4 style={{ margin: '0 0 4px 0', fontSize: '15px', color: '#1e293b' }}>{rec.name}</h4>
                      <span style={{ fontSize: '12px', color: '#64748b' }}>
                        Type: <strong>{rec.type}</strong> • Size: {rec.size} • Uploaded: {rec.date}
                      </span>
                      <div className="pd-crypt-signature">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lock-icon"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                        <span>Verified signature: {rec.author}</span>
                      </div>
                    </div>
                  </div>
                  <div className="pd-ehr-row-actions">
                    <button className="pd-btn-secondary" onClick={() => setSelectedEhrRecord(rec)}>
                      Preview Report
                    </button>
                    <button className="pd-btn-outline" onClick={() => alert(`Downloading signed original file ${rec.id}...`)}>
                      Download Signed PDF
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* EHR Preview Modal */}
        {selectedEhrRecord && (
          <div className="pd-modal-overlay" onClick={() => setSelectedEhrRecord(null)}>
            <div className="pd-modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="pd-modal-header">
                <h2>Health Document Preview: {selectedEhrRecord.id}</h2>
                <button className="pd-modal-close" onClick={() => setSelectedEhrRecord(null)}>&times;</button>
              </div>
              <div className="pd-modal-body">
                <div className="pd-modal-meta-grid">
                  <div><strong>Document Name:</strong> <p>{selectedEhrRecord.name}</p></div>
                  <div><strong>Category:</strong> <p>{selectedEhrRecord.type}</p></div>
                  <div><strong>Signature Source:</strong> <p>{selectedEhrRecord.author}</p></div>
                  <div><strong>Upload Date:</strong> <p>{selectedEhrRecord.date}</p></div>
                </div>

                <div className="pd-modal-section">
                  <h3>Cryptographic Integrity Hash</h3>
                  <code style={{ fontSize: '11px', display: 'block', background: '#f8fafc', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0', wordBreak: 'break-all', fontFamily: 'monospace' }}>
                    {selectedEhrRecord.hash}
                  </code>
                </div>

                {selectedEhrRecord.type === "Immunization" && selectedEhrRecord.details && (
                  <div className="pd-modal-section">
                    <h3>Vaccination Log</h3>
                    <table className="pd-modal-table">
                      <tbody>
                        <tr><td><strong>Vaccine Name</strong></td><td>{selectedEhrRecord.details.vaccine}</td></tr>
                        <tr><td><strong>Dose 1 Date</strong></td><td>{selectedEhrRecord.details.dose1}</td></tr>
                        <tr><td><strong>Dose 2 Date</strong></td><td>{selectedEhrRecord.details.dose2}</td></tr>
                        <tr><td><strong>Booster Dose Date</strong></td><td>{selectedEhrRecord.details.booster}</td></tr>
                        <tr><td><strong>Administering Center</strong></td><td>{selectedEhrRecord.details.facility}</td></tr>
                      </tbody>
                    </table>
                  </div>
                )}

                {selectedEhrRecord.type === "Lab Report" && selectedEhrRecord.details && (
                  <div className="pd-modal-section">
                    <h3>Cholesterol Panel Findings</h3>
                    <table className="pd-modal-table">
                      <thead>
                        <tr>
                          <th>Biomarker</th>
                          <th>Measured Concentration</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr><td>Total Cholesterol</td><td><strong>{selectedEhrRecord.details.cholesterol}</strong></td></tr>
                        <tr><td>HDL (Good Cholesterol)</td><td><strong>{selectedEhrRecord.details.hdl}</strong></td></tr>
                        <tr><td>LDL (Bad Cholesterol)</td><td><strong>{selectedEhrRecord.details.ldl}</strong></td></tr>
                        <tr><td>Triglycerides</td><td><strong>{selectedEhrRecord.details.triglycerides}</strong></td></tr>
                      </tbody>
                    </table>
                  </div>
                )}

                {selectedEhrRecord.type === "Imaging" && selectedEhrRecord.details && (
                  <div className="pd-modal-section">
                    <h3>Radiology Report Details</h3>
                    <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                      <p style={{ margin: '0 0 8px 0', fontSize: '13px' }}><strong>Exam Region:</strong> {selectedEhrRecord.details.region}</p>
                      <p style={{ margin: '0 0 8px 0', fontSize: '13px' }}><strong>Key Clinical Findings:</strong></p>
                      <p className="pd-modal-text" style={{ fontStyle: 'italic', marginBottom: '12px' }}>"{selectedEhrRecord.details.findings}"</p>
                      <p style={{ margin: '0', fontSize: '13px' }}><strong>Clinical Impression:</strong> <span style={{ color: '#16a34a', fontWeight: '600' }}>{selectedEhrRecord.details.impression}</span></p>
                    </div>
                  </div>
                )}

                {!selectedEhrRecord.details && (
                  <div className="pd-modal-section">
                    <h3>Document Information</h3>
                    <p className="pd-modal-text">This document was manually uploaded by the patient. Ensure validity of original copy before clinical decisions.</p>
                  </div>
                )}
              </div>
              <div className="pd-modal-footer">
                <button className="pd-btn-outline" onClick={() => setSelectedEhrRecord(null)}>Close</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderLaboratoryCenter = () => {

    return (
      <div className="pd-lab-view">
        <div className="pd-welcome-banner">
          <div>
            <h1>Laboratory <span className="highlight">Center</span></h1>
            <p>Track diagnostic orders, blood work progress, and pathology results.</p>
          </div>
          <div className="pd-stats-badge-row">
            <button className="pd-btn-mini-primary" onClick={() => setShowOrderLabModal(true)}>
              Order New Test
            </button>
          </div>
        </div>

        {/* Tab Selection */}
        <div style={{ display: 'flex', borderBottom: '2px solid #e2e8f0', marginBottom: '20px', gap: '8px' }}>
          <button
            type="button"
            onClick={() => setLabSubTab('orders')}
            style={{
              padding: '10px 16px',
              background: 'none',
              border: 'none',
              borderBottom: labSubTab === 'orders' ? '3px solid #6366f1' : '3px solid transparent',
              color: labSubTab === 'orders' ? '#6366f1' : '#64748b',
              fontWeight: '600',
              fontSize: '14px',
              cursor: 'pointer'
            }}
          >
            My Lab Orders
          </button>
          <button
            type="button"
            onClick={() => setLabSubTab('facilities')}
            style={{
              padding: '10px 16px',
              background: 'none',
              border: 'none',
              borderBottom: labSubTab === 'facilities' ? '3px solid #6366f1' : '3px solid transparent',
              color: labSubTab === 'facilities' ? '#6366f1' : '#64748b',
              fontWeight: '600',
              fontSize: '14px',
              cursor: 'pointer'
            }}
          >
            Lab Facilities & Services Catalog
          </button>
        </div>

        {labSubTab === 'facilities' ? (
          <div className="pd-facilities-grid" style={{ display: 'grid', gap: '20px', marginTop: '20px' }}>
            {labFacilities.map((fac, idx) => (
              <div key={idx} className="pd-section-card" style={{ padding: '20px', margin: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px', marginBottom: '12px' }}>
                  <div>
                    <span style={{ fontSize: '11px', color: '#6366f1', fontWeight: 'bold' }}>{fac.code}</span>
                    <h3 style={{ margin: '4px 0 0 0', fontSize: '15px', color: '#1e293b' }}>{fac.name}</h3>
                  </div>
                  <span className="price-tag" style={{ fontSize: '16px', color: '#4f46e5', fontWeight: 'bold' }}>{fac.cost}</span>
                </div>
                <p style={{ margin: '0 0 12px 0', fontSize: '12px', color: '#64748b', lineHeight: '1.4' }}>{fac.description}</p>
                <div style={{ display: 'flex', gap: '12px', fontSize: '11px', color: '#475569', backgroundColor: '#f8fafc', padding: '8px', borderRadius: '6px' }}>
                  <span>Department: <strong>{fac.dept}</strong></span>
                  <span>•</span>
                  <span>Turnaround: <strong>{fac.time}</strong></span>
                  <span>•</span>
                  <span><strong>{fac.fast}</strong></span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* List of lab orders */
          <div className="pd-section-card">
            <div className="pd-section-header">
              <h3>Recent Pathology & Lab Orders</h3>
            </div>
            <div className="pd-lab-list">
              {labOrders.map(order => (
                <div key={order.id} className="pd-lab-item" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div className="pd-lab-info">
                      <h4 style={{ margin: '0 0 4px 0', fontSize: '15px', color: '#1e293b' }}>{order.testName}</h4>
                      <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>Ordered by {order.doctor} on {order.date}</p>
                    </div>
                    <div className="pd-lab-status-actions">
                      <span className={`pd-badge ${order.status === 'Completed' ? 'completed' : 'in-session'}`}>{order.status}</span>
                      {order.status === 'Completed' && (
                        <button className="pd-btn-secondary" onClick={() => setSelectedLabOrder(order)}>
                          View Results Table
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Tracker stepper */}
                  <div className="pd-lab-stepper">
                    {order.timeline.map((step, idx) => (
                      <div key={idx} className={`pd-step-node ${step.done ? 'done' : 'pending'}`}>
                        <div className="circle">
                          {step.done ? (
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                          ) : (
                            <span>{idx+1}</span>
                          )}
                        </div>
                        <div className="step-label-group">
                          <span className="step-title">{step.title}</span>
                          <span className="step-date">{step.date}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Order Lab Modal */}
        {showOrderLabModal && (
          <div className="pd-modal-overlay" onClick={() => setShowOrderLabModal(false)}>
            <div className="pd-modal-content" onClick={(e) => e.stopPropagation()}>
              <form onSubmit={handleOrderLabSubmit}>
                <div className="pd-modal-header">
                  <h2>Order Diagnostic Lab Test</h2>
                  <button className="pd-modal-close" type="button" onClick={() => setShowOrderLabModal(false)}>&times;</button>
                </div>
                <div className="pd-modal-body">
                  <div className="rd-form-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ fontSize: '13px', color: '#475569', fontWeight: '600' }}>Select Diagnostic Panel</label>
                    <select 
                      value={newLabTestName} 
                      onChange={(e) => setNewLabTestName(e.target.value)} 
                      style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', background: 'white' }}
                    >
                      {labFacilities.map((fac, idx) => (
                        <option key={idx} value={fac.name}>{fac.name}</option>
                      ))}
                    </select>
                  </div>
                  <p style={{ fontSize: '12px', color: '#64748b', marginTop: '12px', lineHeight: '1.4' }}>
                    Orders will be automatically submitted to our central diagnostic laboratory facility. You can visit the lab anytime to submit sample collection.
                  </p>
                </div>
                <div className="pd-modal-footer">
                  <button className="pd-btn-primary" type="submit">Submit Laboratory Order</button>
                  <button className="pd-btn-outline" type="button" onClick={() => setShowOrderLabModal(false)}>Cancel</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Lab Results Modal */}
        {selectedLabOrder && (
          <div className="pd-modal-overlay" onClick={() => setSelectedLabOrder(null)}>
            <div className="pd-modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="pd-modal-header">
                <h2>Lab Diagnostic Report: {selectedLabOrder.id}</h2>
                <button className="pd-modal-close" onClick={() => setSelectedLabOrder(null)}>&times;</button>
              </div>
              <div className="pd-modal-body">
                <div className="pd-modal-meta-grid">
                  <div><strong>Test Name:</strong> <p>{selectedLabOrder.testName}</p></div>
                  <div><strong>Physician:</strong> <p>{selectedLabOrder.doctor}</p></div>
                  <div><strong>Release Date:</strong> <p>{selectedLabOrder.date}</p></div>
                  <div><strong>Verify Status:</strong> <span className="pd-badge completed">Verified</span></div>
                </div>

                <div className="pd-modal-section">
                  <h3>Laboratory Findings</h3>
                  <table className="pd-modal-table">
                    <thead>
                      <tr>
                        <th>Pathology Parameter</th>
                        <th>Measured Value</th>
                        <th>Reference Range</th>
                        <th>Units</th>
                        <th>Flag Indicator</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedLabOrder.results.map((res, idx) => (
                        <tr key={idx}>
                          <td><strong>{res.parameter}</strong></td>
                          <td><strong>{res.value}</strong></td>
                          <td>{res.range}</td>
                          <td>{res.unit}</td>
                          <td>
                            <span className={`pd-badge ${res.flag === 'Normal' ? 'completed' : 'in-session'}`} style={{ fontSize: '10px', padding: '2px 6px' }}>
                              {res.flag}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="pd-modal-footer">
                <button className="pd-btn-outline" onClick={() => setSelectedLabOrder(null)}>Close</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderTelemedicineClinic = () => {
    if (isVideoCallActive) {
      return (
        <div className="pd-video-consult-room">
          <div className="video-viewport-container">
            {/* Remote Feed */}
            <div className="remote-video-frame">
              <div className="doctor-avatar-screen">
                <svg className="pulse-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
                <h3>Dr. Gregory House</h3>
                <p>Cardiology Specialist (Consulting)</p>
              </div>
              <div className="video-label-tag">Dr. Gregory House • HD Stream</div>
            </div>

            {/* Local Feed */}
            <div className="local-video-frame">
              <div className="patient-avatar-preview">
                <span>JD</span>
              </div>
              <div className="video-label-tag">John Doe (You)</div>
            </div>

            {/* In-Call Controls */}
            <div className="video-controls-overlay">
              <button className="video-btn select"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg></button>
              <button className="video-btn select"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7"></polygon><rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect></svg></button>
              <button className="video-btn danger" onClick={() => {
                setIsVideoCallActive(false);
                const saved = JSON.parse(localStorage.getItem('dhms_appointments') || '[]');
                const updated = saved.map(a => a.id === activeCallId ? { ...a, status: 'Completed' } : a);
                localStorage.setItem('dhms_appointments', JSON.stringify(updated));
                setTeleconsultations(prev => prev.map(t => t.id === activeCallId ? { ...t, status: 'Completed' } : t));
                if (window.Swal) {
                  window.Swal.fire({
                    title: 'Consultation Ended',
                    text: 'Consultation ended. You must schedule a new appointment to reconnect.',
                    icon: 'info',
                    confirmButtonColor: '#3b82f6'
                  });
                } else {
                  alert("Consultation ended. You must schedule a new appointment to reconnect.");
                }
              }} title="End Call">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7 2 2 0 0 1 1.72 2v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.42 19.42 0 0 1-3.33-2.67m-2.67-3.34a19.79 19.79 0 0 1-3.07-8.63A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91"></path><line x1="23" y1="1" x2="1" y2="23"></line></svg>
              </button>
            </div>
          </div>

          {/* Call Chat sidebar */}
          <div className="video-call-chat-sidebar">
            <div className="chat-header">
              <h3>Consultation Chat</h3>
            </div>
            <div className="chat-body-scroller">
              {callChatMessages.map((msg, idx) => (
                <div key={idx} className={`chat-bubble-row ${msg.sender}`}>
                  <div className="chat-bubble">
                    <p>{msg.text}</p>
                    <span className="time">{msg.time}</span>
                  </div>
                </div>
              ))}
            </div>
            <form className="chat-input-row" onSubmit={handleSendChatMessage}>
              <input 
                type="text" 
                placeholder="Ask Dr. House a question..." 
                value={newChatMessage} 
                onChange={(e) => setNewChatMessage(e.target.value)} 
              />
              <button type="submit">Send</button>
            </form>
          </div>
        </div>
      );
    }

    return (
      <div className="pd-telemedicine-view">
        <div className="pd-welcome-banner">
          <div>
            <h1>Telemedicine <span className="highlight">Clinic</span></h1>
            <p>Connect with board-certified healthcare professionals via secure encrypted video consultations.</p>
          </div>
          <div className="pd-stats-badge-row">
            <button className="pd-btn-mini-primary" onClick={() => setShowScheduleTeleModal(true)}>
              Schedule Consultation
            </button>
          </div>
        </div>

        {/* Consultation details */}
        <div className="pd-section-card">
          <div className="pd-section-header">
            <h3>Scheduled Tele-Consultations</h3>
          </div>
          <div className="pd-tele-list">
            {teleconsultations.length === 0 ? (
              <div className="pd-empty-state">
                <p>No telemedicine appointments booked.</p>
              </div>
            ) : (
              teleconsultations.map(tele => (
                <div key={tele.id} className="pd-tele-item">
                  <div className="pd-tele-info">
                    <div className="pd-tele-avatar-badge">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7"></polygon><rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect></svg>
                    </div>
                    <div>
                      <h4 style={{ margin: '0 0 4px 0', fontSize: '15px', color: '#1e293b' }}>{tele.doctor}</h4>
                      <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#64748b' }}>Department: <strong>{tele.department}</strong> • Reason: {tele.reason}</p>
                      <span className="pd-visit-time">{tele.date} at {tele.time}</span>
                    </div>
                  </div>
                  <div className="pd-tele-actions">
                    {tele.status === "Ready" ? (
                      <button className="pd-btn-teal" onClick={() => {
                        setActiveCallId(tele.id);
                        setIsVideoCallActive(true);
                      }}>
                        Join Consultation
                      </button>
                    ) : (
                      <span className="pd-badge in-session" style={{ background: '#f1f5f9', color: '#475569' }}>
                        Confirmed
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Schedule Telemedicine Modal */}
        {showScheduleTeleModal && (
          <div className="pd-modal-overlay" onClick={() => setShowScheduleTeleModal(false)}>
            <div className="pd-modal-content" onClick={(e) => e.stopPropagation()}>
              <form onSubmit={handleScheduleTeleSubmit}>
                <div className="pd-modal-header">
                  <h2>Schedule Video Consultation</h2>
                  <button className="pd-modal-close" type="button" onClick={() => setShowScheduleTeleModal(false)}>&times;</button>
                </div>
                <div className="pd-modal-body">
                  <div className="rd-form-row" style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
                    <div className="rd-form-group" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <label style={{ fontSize: '13px', color: '#475569', fontWeight: '600' }}>Select Doctor</label>
                      <select 
                        value={newTeleDoctor} 
                        onChange={(e) => setNewTeleDoctor(e.target.value)}
                        style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', background: 'white' }}
                      >
                        <option value="Dr. Gregory House">Dr. Gregory House</option>
                        <option value="Dr. Allison Cameron">Dr. Allison Cameron</option>
                        <option value="Dr. Robert Chase">Dr. Robert Chase</option>
                      </select>
                    </div>
                    <div className="rd-form-group" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <label style={{ fontSize: '13px', color: '#475569', fontWeight: '600' }}>Department</label>
                      <select 
                        value={newTeleDept} 
                        onChange={(e) => setNewTeleDept(e.target.value)}
                        style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', background: 'white' }}
                      >
                        <option value="Cardiology">Cardiology</option>
                        <option value="Immunology">Immunology</option>
                        <option value="General Medicine">General Medicine</option>
                      </select>
                    </div>
                  </div>

                  <div className="rd-form-row" style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
                    <div className="rd-form-group" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <label style={{ fontSize: '13px', color: '#475569', fontWeight: '600' }}>Date</label>
                      <input 
                        type="date" 
                        required 
                        value={newTeleDate} 
                        onChange={(e) => setNewTeleDate(e.target.value)} 
                        style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                      />
                    </div>
                    <div className="rd-form-group" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <label style={{ fontSize: '13px', color: '#475569', fontWeight: '600' }}>Time</label>
                      <input 
                        type="time" 
                        required 
                        value={newTeleTime} 
                        onChange={(e) => setNewTeleTime(e.target.value)}
                        style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                      />
                    </div>
                  </div>

                  <div className="rd-form-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ fontSize: '13px', color: '#475569', fontWeight: '600' }}>Reason for Consultation</label>
                    <textarea 
                      required 
                      value={newTeleReason} 
                      onChange={(e) => setNewTeleReason(e.target.value)} 
                      placeholder="Briefly state symptoms or clinical concerns..."
                      rows="3"
                      style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', resize: 'vertical' }}
                    />
                  </div>
                </div>
                <div className="pd-modal-footer">
                  <button className="pd-btn-primary" type="submit">Schedule Appointment</button>
                  <button className="pd-btn-outline" type="button" onClick={() => setShowScheduleTeleModal(false)}>Cancel</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderInsuranceTab = () => {
    const policies = JSON.parse(localStorage.getItem('dhms_insurance_policies') || '[]');
    const myPolicy = policies.find(p => p.patientId === (currentPatient?.id || "PT-80234"));
    const claims = JSON.parse(localStorage.getItem('dhms_insurance_claims') || '[]');
    const myClaims = claims.filter(c => c.patientId === (currentPatient?.id || "PT-80234"));

    return (
      <div className="pd-section-card" style={{ maxWidth: '1000px', margin: '0 auto', padding: '24px' }}>
        <div className="pd-section-header" style={{ marginBottom: '16px', display: 'flex', alignItems: 'center' }}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '24px', height: '24px', marginRight: '8px', color: '#0ea5e9' }}>
            <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#0f172a', margin: 0 }}>Insurance Policies & Third-Party Claims</h2>
        </div>
        <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '24px' }}>
          Track active insurance policies registered with your profile, view coverage details, co-pay ratios, and monitor processed or pending claims.
        </p>

        {/* Policy Card */}
        {myPolicy ? (
          <div style={{
            background: 'linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%)',
            color: 'white',
            borderRadius: '16px',
            padding: '24px',
            boxShadow: '0 10px 15px -3px rgba(37, 99, 235, 0.25)',
            marginBottom: '32px',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* Decal Background Ring */}
            <div style={{ position: 'absolute', right: '-20px', bottom: '-20px', width: '150px', height: '150px', borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }}></div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
              <div>
                <span style={{ fontSize: '12px', opacity: 0.8, textTransform: 'uppercase', fontWeight: 'bold', letterSpacing: '0.05em' }}>Health Insurance Provider</span>
                <h3 style={{ margin: '4px 0 0 0', fontSize: '20px', fontWeight: '800' }}>{myPolicy.provider}</h3>
              </div>
              <span style={{
                background: myPolicy.status === 'Active' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                color: myPolicy.status === 'Active' ? '#4ade80' : '#fca5a5',
                padding: '4px 12px',
                borderRadius: '20px',
                fontSize: '12px',
                fontWeight: 'bold',
                border: '1px solid currentColor'
              }}>
                {myPolicy.status}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', borderTop: '1px solid rgba(255,255,255,0.15)', paddingTop: '16px' }}>
              <div>
                <span style={{ fontSize: '11px', opacity: 0.7 }}>Policy Number</span>
                <div style={{ fontFamily: 'monospace', fontWeight: 'bold', fontSize: '14px', marginTop: '2px' }}>{myPolicy.policyNo}</div>
              </div>
              <div>
                <span style={{ fontSize: '11px', opacity: 0.7 }}>Patient Co-pay %</span>
                <div style={{ fontWeight: 'bold', fontSize: '14px', marginTop: '2px' }}>{myPolicy.coPay}% Portion</div>
              </div>
              <div>
                <span style={{ fontSize: '11px', opacity: 0.7 }}>Coverage Status</span>
                <div style={{ fontWeight: 'bold', fontSize: '14px', marginTop: '2px' }}>
                  ₹{(myPolicy.maxCoverage - (myPolicy.utilized || 0)).toLocaleString('en-IN')} / ₹{myPolicy.maxCoverage.toLocaleString('en-IN')} Left
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '30px', color: '#64748b', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1', marginBottom: '32px' }}>
            No registered health insurance policy found. Register a policy at the Cash Counter or contact billing support.
          </div>
        )}

        {/* Claims Table */}
        <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#1e293b', marginBottom: '12px' }}>Recent Insurance Claims</h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e2e8f0', color: '#64748b', fontSize: '12px', textTransform: 'uppercase' }}>
                <th style={{ padding: '12px 8px' }}>Claim ID</th>
                <th style={{ padding: '12px 8px' }}>Invoice Ref</th>
                <th style={{ padding: '12px 8px' }}>Treatment Description</th>
                <th style={{ padding: '12px 8px' }}>Total Bill</th>
                <th style={{ padding: '12px 8px' }}>Ins. Claimed</th>
                <th style={{ padding: '12px 8px' }}>My Co-pay</th>
                <th style={{ padding: '12px 8px' }}>Filing Date</th>
                <th style={{ padding: '12px 8px' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {myClaims.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '24px', color: '#94a3b8', fontStyle: 'italic' }}>
                    No insurance claims generated yet.
                  </td>
                </tr>
              ) : (
                myClaims.map(claim => (
                  <tr key={claim.id} style={{ borderBottom: '1px solid #f1f5f9', fontSize: '13px' }}>
                    <td style={{ padding: '12px 8px', fontWeight: 'bold' }}>{claim.id}</td>
                    <td style={{ padding: '12px 8px', color: '#64748b' }}>{claim.invoiceId}</td>
                    <td style={{ padding: '12px 8px' }}>{claim.diagnosis}</td>
                    <td style={{ padding: '12px 8px' }}>{claim.amount}</td>
                    <td style={{ padding: '12px 8px', color: '#0ea5e9', fontWeight: 'bold' }}>{claim.claimedAmount}</td>
                    <td style={{ padding: '12px 8px', color: '#f59e0b' }}>{claim.coPayAmount}</td>
                    <td style={{ padding: '12px 8px' }}>{claim.date}</td>
                    <td style={{ padding: '12px 8px' }}>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '12px',
                        fontSize: '11px',
                        fontWeight: 'bold',
                        background: claim.status?.toLowerCase() === 'approved' ? '#dcfce7' : claim.status?.toLowerCase() === 'pending' || claim.status?.toLowerCase() === 'submitted' ? '#fef3c7' : '#fee2e2',
                        color: claim.status?.toLowerCase() === 'approved' ? '#15803d' : claim.status?.toLowerCase() === 'pending' || claim.status?.toLowerCase() === 'submitted' ? '#b45309' : '#b91c1c'
                      }}>
                        {claim.status === 'Submitted' ? 'Pending' : claim.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderAdmissionsBilling = () => {
    // Calculate Running Pharmacy Bill for an admission
    const calculatePharmacyBill = (adm) => {
      if (!adm.medications) return 0;
      return adm.medications
        .filter(m => m.status === 'Dispensed')
        .reduce((sum, m) => sum + (parseFloat(m.cost) || 0), 0);
    };

    const myAdmissions = admissions.filter(a => a.patientId === (currentPatient?.id || "PT-80234"));

    return (
      <div className="pd-section-card" style={{ maxWidth: '1000px', margin: '0 auto', padding: '24px' }}>
        <div className="pd-section-header" style={{ marginBottom: '16px' }}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '24px', height: '24px', marginRight: '8px', color: '#10b981' }}>
            <rect x="2" y="4" width="20" height="16" rx="2" ry="2"></rect>
            <line x1="12" y1="4" x2="12" y2="20"></line>
            <line x1="2" y1="10" x2="22" y2="10"></line>
          </svg>
          <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#0f172a', margin: 0 }}>Hospital Admissions & Pharmacy Billing</h2>
        </div>
        <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '24px' }}>
          Monitor your active hospital admissions, view medications administered by doctors, track your running pharmacy bill, and process payment.
        </p>

        {myAdmissions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#64748b', fontStyle: 'italic', background: '#f8fafc', borderRadius: '8px' }}>
            No hospital admission records found for your account.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {myAdmissions.map(adm => {
              const billTotal = calculatePharmacyBill(adm);
              return (
                <div key={adm.id} style={{ border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden', backgroundColor: 'white', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                  <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', backgroundColor: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                    <div>
                      <span style={{ fontSize: '11px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>Admission ID</span>
                      <h4 style={{ margin: 0, fontSize: '15px', color: '#0f172a' }}>{adm.id}</h4>
                    </div>
                    <div>
                      <span style={{ fontSize: '11px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>Ward / Room</span>
                      <p style={{ margin: 0, fontSize: '13px', color: '#334155' }}>{adm.ward}</p>
                    </div>
                    <div>
                      <span style={{ fontSize: '11px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>Admission Date</span>
                      <p style={{ margin: 0, fontSize: '13px', color: '#334155' }}>{adm.admissionDate}</p>
                    </div>
                    <div>
                      <span style={{ fontSize: '11px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>Status</span>
                      <div style={{ marginTop: '2px' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '4px 10px',
                          borderRadius: '12px',
                          fontSize: '11px',
                          fontWeight: '700',
                          backgroundColor: adm.status === 'Admitted' ? '#fee2e2' : '#d1fae5',
                          color: adm.status === 'Admitted' ? '#ef4444' : '#065f46'
                        }}>
                          {adm.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div style={{ padding: '20px' }}>
                    <div style={{ marginBottom: '16px' }}>
                      <strong style={{ display: 'block', fontSize: '13px', color: '#475569', marginBottom: '8px' }}>Admitting Doctor Note:</strong>
                      <p style={{ margin: 0, fontSize: '14px', color: '#334155', background: '#f8fafc', padding: '12px', borderRadius: '6px', fontStyle: 'italic', borderLeft: '4px solid #cbd5e1' }}>
                        {adm.notes}
                      </p>
                    </div>

                    <div style={{ marginBottom: '20px' }}>
                      <strong style={{ display: 'block', fontSize: '13px', color: '#475569', marginBottom: '8px' }}>Administered Medications:</strong>
                      {(!adm.medications || adm.medications.length === 0) ? (
                        <p style={{ margin: 0, fontSize: '13px', color: '#94a3b8', fontStyle: 'italic' }}>No medications dispensed yet.</p>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {adm.medications.map((med, idx) => (
                            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                              <div>
                                <strong style={{ fontSize: '14px', color: '#0f172a' }}>{med.name}</strong>
                                <span style={{ marginLeft: '12px', fontSize: '11px', padding: '2px 6px', borderRadius: '4px', fontWeight: '600', backgroundColor: med.status === 'Dispensed' ? '#d1fae5' : '#fee2e2', color: med.status === 'Dispensed' ? '#065f46' : '#b91c1c' }}>
                                  {med.status}
                                </span>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                <span style={{ fontSize: '12px', color: '#64748b' }}>{med.date}</span>
                                <strong style={{ fontSize: '14px', color: '#1e3a8a' }}>₹{parseFloat(med.cost).toFixed(2)}</strong>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
                      <div>
                        <span style={{ fontSize: '13px', color: '#64748b' }}>Total Pharmacy Cost:</span>
                        <h3 style={{ margin: 0, fontSize: '24px', fontWeight: '800', color: '#1e3a8a' }}>
                          ₹{billTotal.toFixed(2)}
                        </h3>
                      </div>
                      
                      {adm.status === 'Admitted' ? (
                        <button
                          onClick={() => {
                            if (billTotal <= 0) {
                              alert("No outstanding bill to pay yet. Pharmacy has not dispensed any medication.");
                              return;
                            }
                            setSelectedAdmissionForPay(adm);
                            setShowCheckoutModal(true);
                          }}
                          style={{
                            padding: '12px 24px',
                            background: '#10b981',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            fontWeight: '700',
                            fontSize: '14px',
                            cursor: 'pointer',
                            transition: 'background-color 0.2s',
                            boxShadow: '0 4px 6px -1px rgba(16,185,129,0.2)'
                          }}
                        >
                          Pay Pharmacy Bill & Discharge
                        </button>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#10b981', fontWeight: '700', fontSize: '14px' }}>
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" style={{ width: '20px', height: '20px' }}>
                            <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
                          </svg>
                          Discharged & Paid
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="pd-container">
      {/* Topbar */}
      <header className="pd-topbar">
        <div className="pd-logo-area">
          <button className="pd-hamburger" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} title="Toggle Navigation">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: '24px', height: '24px' }}>
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </button>
          <svg className="pd-logo-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
          </svg>
          <span className="pd-logo-text">DHMS</span>
          <span className="pd-logo-divider">|</span>
          <span className="pd-logo-sub">Health Console</span>
        </div>
        <div className="pd-topbar-right">
          <div className="pd-profile-info">
            <div className="pd-avatar">{(currentPatient?.firstName?.[0] || "J").toUpperCase()}</div>
            <div className="pd-user-details">
              <strong>{currentPatient ? `${currentPatient.firstName} ${currentPatient.lastName}` : "John Doe"}</strong>
              <span>{currentPatient?.email || "patient@dhms.com"}</span>
            </div>
            <div className="pd-role-badge">PATIENT</div>
          </div>
          <button className="pd-signout-btn" onClick={onLogout} title="Sign Out">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
          </button>
        </div>
      </header>

      <div className="pd-body">
        {/* Sidebar */}
        {mobileMenuOpen && (
          <div className="pd-sidebar-overlay" onClick={() => setMobileMenuOpen(false)} />
        )}
        <aside className={`pd-sidebar ${mobileMenuOpen ? 'open' : ''}`}>
          <ul className="pd-nav">
            <li className={activeTab === 'health_console' ? 'active' : ''} onClick={() => { setActiveTab('health_console'); setMobileMenuOpen(false); }}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
              Health Console
            </li>
            <li className={activeTab === 'digital_profile' ? 'active' : ''} onClick={() => { setActiveTab('digital_profile'); setMobileMenuOpen(false); }}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
              Digital Patient Profile
            </li>
            <li className={activeTab === 'visit_history' ? 'active' : ''} onClick={() => { setActiveTab('visit_history'); setMobileMenuOpen(false); }}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
              Visit History Logs
            </li>
            <li className={activeTab === 'ehr_records' ? 'active' : ''} onClick={() => { setActiveTab('ehr_records'); setMobileMenuOpen(false); }}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
              EHR Medical Records
            </li>
            <li className={activeTab === 'laboratory' ? 'active' : ''} onClick={() => { setActiveTab('laboratory'); setMobileMenuOpen(false); }}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 2v7.31"></path><path d="M14 9.3V1.99"></path><path d="M8.5 2h7"></path><path d="M14 9.3a6.5 6.5 0 1 1-4 0"></path><path d="M5.52 16h12.96"></path></svg>
              Laboratory Center
            </li>
            <li className={activeTab === 'telemedicine' ? 'active' : ''} onClick={() => { setActiveTab('telemedicine'); setMobileMenuOpen(false); }}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7"></polygon><rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect></svg>
              Telemedicine Clinic
            </li>
            <li className={activeTab === 'admissions_billing' ? 'active' : ''} onClick={() => { setActiveTab('admissions_billing'); setMobileMenuOpen(false); }}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2" ry="2"></rect><line x1="12" y1="4" x2="12" y2="20"></line><line x1="2" y1="10" x2="22" y2="10"></line></svg>
              Admissions & Billing
            </li>
            <li className={activeTab === 'insurance' ? 'active' : ''} onClick={() => { setActiveTab('insurance'); setMobileMenuOpen(false); }}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
              Insurance & Claims
            </li>
          </ul>
        </aside>

        {/* Main Content */}
        <main className="pd-main">
          {activeTab === 'health_console' && renderHealthConsole()}
          {activeTab === 'digital_profile' && renderPatientProfile()}
          {activeTab === 'visit_history' && renderVisitHistory()}
          {activeTab === 'ehr_records' && renderEHRRecords()}
          {activeTab === 'laboratory' && renderLaboratoryCenter()}
          {activeTab === 'telemedicine' && renderTelemedicineClinic()}
          {activeTab === 'admissions_billing' && renderAdmissionsBilling()}
          {activeTab === 'insurance' && renderInsuranceTab()}
        </main>
      </div>

      {showCheckoutModal && selectedAdmissionForPay && (
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
            maxWidth: '450px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            overflow: 'hidden'
          }}>
            <div style={{
              padding: '20px 24px',
              borderBottom: '1px solid #f1f5f9',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: '#10b981',
              color: 'white'
            }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700' }}>Pharmacy Payment Portal</h3>
              <button 
                onClick={() => { setShowCheckoutModal(false); setSelectedAdmissionForPay(null); }}
                style={{ background: 'none', border: 'none', color: 'white', fontSize: '20px', cursor: 'pointer' }}
              >
                &times;
              </button>
            </div>
            
            <form onSubmit={handlePayAndDischarge} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px' }}>
                  <span>Patient Name:</span>
                  <strong>{selectedAdmissionForPay.patientName}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px' }}>
                  <span>Admission ID:</span>
                  <strong>{selectedAdmissionForPay.id}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', borderTop: '1px solid #e2e8f0', paddingTop: '8px' }}>
                  <span style={{ fontWeight: '600' }}>Total Pharmacy Bill:</span>
                  <strong style={{ color: '#10b981', fontSize: '16px' }}>
                    ₹{(selectedAdmissionForPay.medications || []).filter(m => m.status === 'Dispensed').reduce((sum, m) => sum + (parseFloat(m.cost) || 0), 0).toFixed(2)}
                  </strong>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '13px', fontWeight: '600', color: '#475569' }}>Credit / Debit Card Number</label>
                <input 
                  type="text" 
                  placeholder="xxxx xxxx xxxx xxxx" 
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  style={{ padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none' }}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '13px', fontWeight: '600', color: '#475569' }}>Expiry Date</label>
                  <input 
                    type="text" 
                    placeholder="MM/YY" 
                    value={cardExpiry}
                    onChange={(e) => setCardExpiry(e.target.value)}
                    style={{ padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none' }}
                    required
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '13px', fontWeight: '600', color: '#475569' }}>CVV</label>
                  <input 
                    type="password" 
                    placeholder="***" 
                    value={cardCvv}
                    onChange={(e) => setCardCvv(e.target.value)}
                    style={{ padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none' }}
                    required
                  />
                </div>
              </div>

              <button 
                type="submit"
                style={{
                  padding: '12px',
                  background: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: '700',
                  fontSize: '14px',
                  cursor: 'pointer',
                  marginTop: '10px',
                  transition: 'background-color 0.2s'
                }}
              >
                Pay & Complete Discharge
              </button>
            </form>
          </div>
        </div>
      )}
      {reschedulingAppt && (
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
            maxWidth: '450px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            overflow: 'hidden'
          }}>
            <div style={{
              padding: '20px 24px',
              borderBottom: '1px solid #f1f5f9',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: '#6366f1',
              color: 'white'
            }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700' }}>Reschedule Consultation</h3>
              <button 
                onClick={() => setReschedulingAppt(null)}
                style={{ background: 'none', border: 'none', color: 'white', fontSize: '20px', cursor: 'pointer' }}
              >
                &times;
              </button>
            </div>
            
            <form onSubmit={handleRescheduleSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '13px', fontWeight: '600', color: '#475569' }}>Preferred Date</label>
                <input 
                  type="date" 
                  value={rescheduleDate}
                  onChange={(e) => setRescheduleDate(e.target.value)}
                  style={{ padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none' }}
                  required
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '13px', fontWeight: '600', color: '#475569' }}>Preferred Time Slot</label>
                <input 
                  type="time" 
                  value={rescheduleTime}
                  onChange={(e) => setRescheduleTime(e.target.value)}
                  style={{ padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none' }}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                <button 
                  type="submit"
                  style={{
                    flex: 1,
                    padding: '12px',
                    background: '#6366f1',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: '700',
                    fontSize: '14px',
                    cursor: 'pointer'
                  }}
                >
                  Save Changes
                </button>
                <button 
                  type="button"
                  onClick={() => setReschedulingAppt(null)}
                  style={{
                    flex: 1,
                    padding: '12px',
                    background: 'white',
                    color: '#64748b',
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    fontWeight: '700',
                    fontSize: '14px',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
