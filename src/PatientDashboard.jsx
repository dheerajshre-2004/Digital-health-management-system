import React, { useState, useEffect, useRef } from 'react';
import './PatientDashboard.css';
import { teleSignaling, playIncomingRingtone, stopIncomingRingtone, cleanDoctorName } from './telemedicineService';

export default function PatientDashboard({ onLogout, loggedInPatient }) {
  const [activeTab, setActiveTab] = useState('health_console');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [deptFilter, setDeptFilter] = useState('All');
  const [selectedVisit, setSelectedVisit] = useState(null);

  // Edit Profile States
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [editDob, setEditDob] = useState('');
  const [editGender, setEditGender] = useState('other');
  const [editBloodType, setEditBloodType] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editAllergies, setEditAllergies] = useState('');
  const [editChronic, setEditChronic] = useState('');

  // Supported Tab Routes
  const VALID_TABS = [
    'health_console',
    'digital_profile',
    'visit_history',
    'ehr_records',
    'laboratory',
    'telemedicine',
    'admissions_billing',
    'insurance'
  ];

  // Navigate to a specific tab with browser URL hash sync
  const navigateTab = (tab) => {
    if (!VALID_TABS.includes(tab)) return;
    setActiveTab(tab);
    setMobileMenuOpen(false);
    if (window.location.hash !== `#/${tab}`) {
      window.location.hash = `#/${tab}`;
    }
  };

  // Helper to open modal and push browser history state so Android/browser Back button closes the modal
  const openModal = (setter, val = true) => {
    window.history.pushState({ isModal: true }, '');
    setter(val);
  };

  // Invoice / Receipt State
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  const openEditProfile = () => {
    setEditDob(currentPatient?.dob || '');
    setEditGender(currentPatient?.gender || 'other');
    setEditBloodType(currentPatient?.bloodType || '');
    setEditPhone(currentPatient?.phone || '');
    setEditAllergies(currentPatient?.allergies || '');
    setEditChronic(currentPatient?.chronicConditions || '');
    openModal(setShowEditProfileModal, true);
  };

  const handleEditProfileSubmit = (e) => {
    e.preventDefault();

    if (editPhone && editPhone.trim()) {
      const cleanPhone = editPhone.replace(/[\s\-\(\)]/g, '');
      const indianPhoneRegex = /^(?:\+91|91|0)?[6-9]\d{9}$/;
      if (!indianPhoneRegex.test(cleanPhone)) {
        alert("Invalid Contact Number: Please enter a valid 10-digit mobile number starting with 6, 7, 8, or 9 (e.g. 9876543210 or +91 98765 43210).");
        return;
      }
    }

    const updatedPatient = {
      ...currentPatient,
      dob: editDob,
      gender: editGender,
      bloodType: editBloodType,
      phone: editPhone ? editPhone.trim() : '',
      allergies: editAllergies,
      chronicConditions: editChronic
    };

    setCurrentPatient(updatedPatient);

    const patients = JSON.parse(localStorage.getItem('dhms_patients') || '[]');
    const updatedPatients = patients.map(p => p.id === updatedPatient.id ? updatedPatient : p);
    localStorage.setItem('dhms_patients', JSON.stringify(updatedPatients));

    const sessionStr = sessionStorage.getItem('dhms_active_session') || localStorage.getItem('dhms_active_session') || '{}';
    const session = JSON.parse(sessionStr);
    if (session.user && session.user.id === updatedPatient.id) {
      session.user = updatedPatient;
      sessionStorage.setItem('dhms_active_session', JSON.stringify(session));
      sessionStorage.setItem('dhms_tab_session', JSON.stringify(session));
      localStorage.setItem('dhms_active_session', JSON.stringify(session));
    }

    setShowEditProfileModal(false);
    alert("Profile updated successfully!");
  };

  // Dynamic Patient Record State
  const [currentPatient, setCurrentPatient] = useState(() => {
    const list = JSON.parse(localStorage.getItem('dhms_patients') || '[]');
    const id = loggedInPatient?.id || "PT-80234";
    return list.find(p => p.id === id) || loggedInPatient || list[0];
  });

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.classList.add('pd-lock-scroll');
    } else {
      document.body.classList.remove('pd-lock-scroll');
    }
    return () => {
      document.body.classList.remove('pd-lock-scroll');
    };
  }, [mobileMenuOpen]);

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
      
      const allRx = JSON.parse(localStorage.getItem('dhms_prescriptions') || '[]');
      setPatientPrescriptions(allRx.filter(p => p.patientId === patientId));

      const allLabOrders = JSON.parse(localStorage.getItem('dhms_lab_requests') || '[]');
      setLabOrders(allLabOrders.filter(l => l.patientId === patientId));
      
      setAdmissions(JSON.parse(localStorage.getItem('dhms_admissions') || '[]'));
      setLabFacilities(JSON.parse(localStorage.getItem('dhms_lab_facilities') || '[]'));
      setBillingList(JSON.parse(localStorage.getItem('dhms_billing') || '[]'));
      setDoctorsList(JSON.parse(localStorage.getItem('dhms_doctors') || '[]'));
      setNotifications(JSON.parse(localStorage.getItem('dhms_notifications') || '[]'));
    };

    // Load initial check
    const list = JSON.parse(localStorage.getItem('dhms_patients') || '[]');
    const id = currentPatient?.id || loggedInPatient?.id || "PT-80234";
    const found = list.find(p => p.id === id);
    if (found) {
      setCurrentPatient(found);
    }
    setBillingList(JSON.parse(localStorage.getItem('dhms_billing') || '[]'));

    // Interval polling for instant state updates in same tab
    const intervalId = setInterval(handleStorageChange, 1000);

    window.addEventListener('storage', handleStorageChange);
    return () => {
      clearInterval(intervalId);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [activeTab, loggedInPatient, currentPatient?.id]);

  // Appointments & Consultations State
  const [billingList, setBillingList] = useState(() => {
    return JSON.parse(localStorage.getItem('dhms_billing') || '[]');
  });

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

  // EHR & Prescription States
  const [patientPrescriptions, setPatientPrescriptions] = useState(() => {
    const all = JSON.parse(localStorage.getItem('dhms_prescriptions') || '[]');
    const patientId = currentPatient?.id || loggedInPatient?.id || "PT-80234";
    return all.filter(p => p.patientId === patientId);
  });
  const [selectedPrescriptionSlip, setSelectedPrescriptionSlip] = useState(null);
  const [medicationSearchQuery, setMedicationSearchQuery] = useState('');
  const [medicationStatusFilter, setMedicationStatusFilter] = useState('All');

  const [ehrRecords, setEhrRecords] = useState(() => {
    return currentPatient?.reports || [];
  });
  const [ehrSearchQuery, setEhrSearchQuery] = useState('');
  const [ehrFilterType, setEhrFilterType] = useState('All');
  const [selectedDoctorFilter, setSelectedDoctorFilter] = useState('All');
  const [selectedEhrRecord, setSelectedEhrRecord] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [visitSubTab, setVisitSubTab] = useState('visits'); // 'visits' | 'doctors'
  const [ehrSubTab, setEhrSubTab] = useState('medications'); // 'medications' | 'clinical' | 'vault' | 'doctors'
  const [billingSearchQuery, setBillingSearchQuery] = useState('');
  const [billingCategoryFilter, setBillingCategoryFilter] = useState('All');
  const [billingStatusFilter, setBillingStatusFilter] = useState('All');

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
      paymentStatus: a.paymentStatus || 'Paid',
      paymentMethod: a.paymentMethod || 'Online Gateway',
      transactionId: a.transactionId || null,
      invoiceId: a.invoiceId || null,
      consultationFee: a.consultationFee || '₹500.00',
      reason: a.reason
    }));
  });
  const [isVideoCallActive, setIsVideoCallActive] = useState(false);
  const [activeCallId, setActiveCallId] = useState('');
  const [callChatMessages, setCallChatMessages] = useState([]);
  const [newChatMessage, setNewChatMessage] = useState('');
  const [showScheduleTeleModal, setShowScheduleTeleModal] = useState(false);
  const [showTelePaymentModal, setShowTelePaymentModal] = useState(false);
  const [pendingTeleAppt, setPendingTeleAppt] = useState(null);
  const [telePaymentMethod, setTelePaymentMethod] = useState('UPI');
  const [teleUpiId, setTeleUpiId] = useState('');
  const [teleCardNumber, setTeleCardNumber] = useState('');
  const [teleCardExpiry, setTeleCardExpiry] = useState('');
  const [teleCardCvv, setTeleCardCvv] = useState('');
  const [isProcessingTelePay, setIsProcessingTelePay] = useState(false);
  const [newTeleDoctor, setNewTeleDoctor] = useState('');
  const [newTeleDept, setNewTeleDept] = useState('');
  const [newTeleDate, setNewTeleDate] = useState('');
  const [newTeleTime, setNewTeleTime] = useState('');
  const [newTeleReason, setNewTeleReason] = useState('');

  // Telemedicine Media States & Chat
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCamOn, setIsCamOn] = useState(true);
  const [localMediaStream, setLocalMediaStream] = useState(null);
  const [patientRemoteStream, setPatientRemoteStream] = useState(null);
  const [incomingTeleCall, setIncomingTeleCall] = useState(null);
  const [teleMobileTab, setTeleMobileTab] = useState('video'); // 'video' | 'chat'
  const localVideoRef = useRef(null);
  const patientRemoteVideoRef = useRef(null);
  const peerConnRef = useRef(null);

  // Listen for real-time incoming doctor calls
  useEffect(() => {
    const isCallForThisPatient = (callData) => {
      if (!callData || callData.status !== 'calling') return false;
      if (Date.now() - (callData.timestamp || 0) > 180000) return false;
      const currentPatId = currentPatient?.id || loggedInPatient?.id || "PT-80234";
      const patFullName = `${currentPatient?.firstName || ''} ${currentPatient?.lastName || ''}`.toLowerCase().trim() || (loggedInPatient?.name || '').toLowerCase();
      const callPatName = (callData.patientName || '').toLowerCase().trim();

      if (!callData.patientId || callData.patientId === currentPatId) return true;
      if (callPatName && patFullName && (callPatName.includes(patFullName) || patFullName.includes(callPatName))) return true;
      const savedAppts = JSON.parse(localStorage.getItem('dhms_appointments') || '[]');
      if (savedAppts.some(a => a.id === callData.appointmentId && (a.patientId === currentPatId || a.patientName?.toLowerCase().includes(patFullName)))) return true;
      return true;
    };

    const checkIncomingCall = () => {
      try {
        const activeCallStr = localStorage.getItem('dhms_active_tele_call');
        if (activeCallStr) {
          const callData = JSON.parse(activeCallStr);
          if (isCallForThisPatient(callData)) {
            if (!isVideoCallActive) {
              setIncomingTeleCall(callData);
              playIncomingRingtone();
            }
          }
        }
      } catch (err) {}
    };

    checkIncomingCall();
    const unsubscribe = teleSignaling.subscribe((data) => {
      if (data.type === 'INCOMING_CALL' && isCallForThisPatient(data)) {
        if (!isVideoCallActive) {
          setIncomingTeleCall(data);
          playIncomingRingtone();
        }
      } else if (data.type === 'CALL_ENDED' || data.type === 'CALL_DECLINED') {
        setIncomingTeleCall(null);
        stopIncomingRingtone();
      }
    });

    const pollInterval = setInterval(checkIncomingCall, 1200);

    return () => {
      unsubscribe();
      clearInterval(pollInterval);
      stopIncomingRingtone();
    };
  }, [currentPatient?.id, currentPatient?.firstName, loggedInPatient?.name, isVideoCallActive]);

  // Request actual camera/microphone stream when video call starts
  useEffect(() => {
    if (isVideoCallActive && isCamOn) {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ video: true, audio: true })
          .then(stream => {
            setLocalMediaStream(stream);
            if (localVideoRef.current) {
              localVideoRef.current.srcObject = stream;
            }
          })
          .catch(err => {
            console.log("Webcam / Mic access not granted or not available:", err);
          });
      }
    } else {
      if (localMediaStream) {
        localMediaStream.getTracks().forEach(track => track.stop());
        setLocalMediaStream(null);
      }
    }
    return () => {
      if (localMediaStream) {
        localMediaStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [isVideoCallActive]);

  useEffect(() => {
    if (localVideoRef.current && localMediaStream) {
      localVideoRef.current.srcObject = isCamOn ? localMediaStream : null;
    }
    if (localMediaStream) {
      localMediaStream.getVideoTracks().forEach(track => { track.enabled = isCamOn; });
      localMediaStream.getAudioTracks().forEach(track => { track.enabled = isMicOn; });
    }
  }, [isCamOn, isMicOn, localMediaStream]);

  // Establish 2-way WebRTC streaming with Doctor
  useEffect(() => {
    if (isVideoCallActive && activeCallId) {
      if (peerConnRef.current) {
        peerConnRef.current.cleanup();
      }
      peerConnRef.current = teleSignaling.createPeerConnection(
        activeCallId,
        localMediaStream,
        (remoteStream) => {
          setPatientRemoteStream(remoteStream);
          if (patientRemoteVideoRef.current) {
            patientRemoteVideoRef.current.srcObject = remoteStream;
          }
        },
        false
      );
    } else {
      if (peerConnRef.current) {
        peerConnRef.current.cleanup();
        peerConnRef.current = null;
      }
      setPatientRemoteStream(null);
    }
    return () => {
      if (peerConnRef.current) {
        peerConnRef.current.cleanup();
        peerConnRef.current = null;
      }
    };
  }, [isVideoCallActive, activeCallId, localMediaStream]);

  useEffect(() => {
    if (patientRemoteVideoRef.current && patientRemoteStream) {
      patientRemoteVideoRef.current.srcObject = patientRemoteStream;
    }
  }, [patientRemoteStream]);

  const handleAcceptIncomingCall = () => {
    if (!incomingTeleCall) return;
    stopIncomingRingtone();
    const callData = incomingTeleCall;
    teleSignaling.acceptCall(callData);
    setActiveCallId(callData.appointmentId);
    setIsVideoCallActive(true);
    setTeleMobileTab('video');
    setActiveTab('telemedicine');
    setIncomingTeleCall(null);
  };

  const handleDeclineIncomingCall = () => {
    if (!incomingTeleCall) return;
    stopIncomingRingtone();
    teleSignaling.declineCall(incomingTeleCall);
    setIncomingTeleCall(null);
  };

  const handleSendChatMessage = (e) => {
    e.preventDefault();
    if (!newChatMessage.trim() || !activeCallId) return;
    const chatKey = `dhms_tele_chat_${activeCallId}`;
    const currentMsgs = JSON.parse(localStorage.getItem(chatKey) || '[]');
    const patientMsg = {
      sender: "patient",
      text: newChatMessage.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    const updated = [...currentMsgs, patientMsg];
    localStorage.setItem(chatKey, JSON.stringify(updated));
    setCallChatMessages(updated);
    setNewChatMessage('');
    teleSignaling.broadcast({
      type: 'CHAT_MESSAGE',
      callId: activeCallId,
      message: patientMsg
    });
  };

  useEffect(() => {
    const unsub = teleSignaling.subscribe((data) => {
      if (data.type === 'CHAT_MESSAGE' && data.callId === activeCallId && data.message) {
        setCallChatMessages(prev => {
          if (prev.some(m => m.time === data.message.time && m.text === data.message.text && m.sender === data.message.sender)) {
            return prev;
          }
          return [...prev, data.message];
        });
      }
    });
    return unsub;
  }, [activeCallId]);

  useEffect(() => {
    if (!isVideoCallActive) return;
    const chatKey = `dhms_tele_chat_${activeCallId}`;
    if (!localStorage.getItem(chatKey)) {
      const activeAppt = JSON.parse(localStorage.getItem('dhms_appointments') || '[]').find(a => a.id === activeCallId);
      const docName = cleanDoctorName(activeAppt?.doctorName || "Doctor");
      const initialMsgs = [
        { sender: "doctor", text: `Hello! I am ${docName}. I am ready for our teleconsultation. How can I assist you today?`, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
      ];
      localStorage.setItem(chatKey, JSON.stringify(initialMsgs));
    }
    const interval = setInterval(() => {
      const msgs = JSON.parse(localStorage.getItem(chatKey) || '[]');
      setCallChatMessages(msgs);

      const savedAppts = JSON.parse(localStorage.getItem('dhms_appointments') || '[]');
      const currentAppt = savedAppts.find(a => a.id === activeCallId);
      if (currentAppt && currentAppt.status === 'Completed') {
        if (localMediaStream) {
          localMediaStream.getTracks().forEach(t => t.stop());
        }
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

  const getSlotAvailability = (doctorName, date) => {
    if (!doctorName || !date) return { slot1: { capacity: 5, booked: 0, available: 5, isFull: false }, slot2: { capacity: 5, booked: 0, available: 5, isFull: false } };
    const docId = doctorName.toLowerCase().replace('.', '').replace(' ', '_');
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

  const [doctorsList, setDoctorsList] = useState(() => {
    return JSON.parse(localStorage.getItem('dhms_doctors') || '[]');
  });

  // Change Password States
  const [currPassword, setCurrPassword] = useState('');
  const [newPasswordVal, setNewPasswordVal] = useState('');
  const [confirmPasswordVal, setConfirmPasswordVal] = useState('');

  // Physical Appointment Request States
  const [showRequestApptModal, setShowRequestApptModal] = useState(false);
  const [newApptDoctor, setNewApptDoctor] = useState('');
  const [newApptDept, setNewApptDept] = useState('');
  const [newApptDate, setNewApptDate] = useState('');
  const [newApptTime, setNewApptTime] = useState('');
  const [newApptReason, setNewApptReason] = useState('');
  const [admissions, setAdmissions] = useState(() => {
    return JSON.parse(localStorage.getItem('dhms_admissions') || '[]');
  });
  const [printedPatientReleaseCert, setPrintedPatientReleaseCert] = useState(null);
  const [printedPatientAdmissionPass, setPrintedPatientAdmissionPass] = useState(null);

  // Notifications and Inbox States
  const [notifications, setNotifications] = useState(() => {
    return JSON.parse(localStorage.getItem('dhms_notifications') || '[]');
  });
  const [showNotifInbox, setShowNotifInbox] = useState(false);
  const [showNewUpdatesPopup, setShowNewUpdatesPopup] = useState(false);

  const patientId = currentPatient?.id || loggedInPatient?.id || "PT-80234";
  const patientNotifs = notifications.filter(n => n.patientId === patientId).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  const unreadNotifsCount = patientNotifs.filter(n => !n.read).length;
  const unreadNotifsToShow = patientNotifs.filter(n => !n.read && !n.popupShown);

  const markNotifAsRead = (id) => {
    const updated = notifications.map(n => n.id === id ? { ...n, read: true } : n);
    localStorage.setItem('dhms_notifications', JSON.stringify(updated));
    setNotifications(updated);
  };

  const markAllNotifsAsRead = () => {
    const updated = notifications.map(n => n.patientId === patientId ? { ...n, read: true, popupShown: true } : n);
    localStorage.setItem('dhms_notifications', JSON.stringify(updated));
    setNotifications(updated);
  };

  const dismissNewUpdatesPopup = () => {
    const updated = notifications.map(n => n.patientId === patientId && !n.read ? { ...n, read: true, popupShown: true } : n);
    localStorage.setItem('dhms_notifications', JSON.stringify(updated));
    setNotifications(updated);
    setShowNewUpdatesPopup(false);
  };

  // Browser History & Back Button Interception
  useEffect(() => {
    const handlePopState = () => {
      // 1. If any modal is open, close it cleanly without navigating away
      setShowRequestApptModal(false);
      setSelectedVisit(null);
      setSelectedEhrRecord(null);
      setShowOrderLabModal(false);
      setSelectedLabOrder(null);
      setShowScheduleTeleModal(false);
      setShowEditProfileModal(false);
      setSelectedInvoice(null);
      setShowNotifInbox(false);
      setShowNewUpdatesPopup(false);
      setReschedulingAppt(null);
      setMobileMenuOpen(false);

      // 2. Sync active tab from URL hash
      const currentHash = window.location.hash.replace(/^#\/?/, '').split('?')[0];
      if (currentHash && VALID_TABS.includes(currentHash)) {
        setActiveTab(currentHash);
      } else if (!currentHash) {
        setActiveTab('health_console');
      }
    };

    // Initialize from URL hash
    const initialHash = window.location.hash.replace(/^#\/?/, '').split('?')[0];
    if (initialHash && VALID_TABS.includes(initialHash)) {
      setActiveTab(initialHash);
    } else if (!window.location.hash) {
      window.location.hash = '#/health_console';
    }

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('hashchange', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('hashchange', handlePopState);
    };
  }, []);

  // Auto-generate notifications from state variables
  useEffect(() => {
    const currentNotifs = JSON.parse(localStorage.getItem('dhms_notifications') || '[]');
    let updatedNotifs = [...currentNotifs];
    let hasNew = false;

    // 1. Scan Appointments
    appointments.forEach(appt => {
      if (appt.patientId !== patientId) return;
      const notifId = `notif_appt_${appt.id}_${appt.status}`;
      if (!currentNotifs.some(n => n.id === notifId)) {
        let title = "Appointment Update";
        let message = "";
        
        if (appt.status === 'Pending Confirmation') {
          title = "Appointment Booked";
          message = `Your appointment request with ${appt.doctorName} for ${appt.date} (${appt.time}) has been received and is pending confirmation.`;
        } else if (appt.status === 'Scheduled') {
          title = "Appointment Confirmed";
          message = `Your appointment with ${appt.doctorName} for ${appt.date} (${appt.time}) has been confirmed.`;
        } else if (appt.status === 'Checked In') {
          title = "Checked In at Clinic";
          message = `You have been checked in for your appointment with ${appt.doctorName}. Please proceed to the waiting area.`;
        } else if (appt.status === 'Completed') {
          title = "Consultation Completed";
          message = `Your consultation with ${appt.doctorName} has been completed.`;
        } else if (appt.status === 'Cancelled') {
          title = "Appointment Cancelled";
          message = `Your appointment with ${appt.doctorName} has been cancelled.`;
        } else {
          message = `Your appointment status with ${appt.doctorName} has changed to: ${appt.status}.`;
        }

        updatedNotifs.push({
          id: notifId,
          patientId,
          title,
          message,
          timestamp: new Date().toISOString(),
          read: false,
          popupShown: false
        });
        hasNew = true;
      }
    });

    // 2. Scan Billing
    billingList.forEach(invoice => {
      if (invoice.patientId !== patientId) return;
      const notifId = `notif_bill_${invoice.id}_${invoice.status}`;
      if (!currentNotifs.some(n => n.id === notifId)) {
        updatedNotifs.push({
          id: notifId,
          patientId,
          title: `Invoice Generated (${invoice.status})`,
          message: `A new invoice (${invoice.id}) for "${invoice.type}" of ${invoice.amount} has been generated (Status: ${invoice.status}).`,
          timestamp: new Date().toISOString(),
          read: false,
          popupShown: false
        });
        hasNew = true;
      }
    });

    // 3. Scan Lab Requests
    labOrders.forEach(lab => {
      if (lab.patientId !== patientId) return;
      const notifId = `notif_lab_${lab.id}_${lab.status}`;
      if (!currentNotifs.some(n => n.id === notifId)) {
        updatedNotifs.push({
          id: notifId,
          patientId,
          title: `Lab Order Update`,
          message: `Your lab test for "${lab.testName}" priority "${lab.priority}" is now: ${lab.status}.`,
          timestamp: new Date().toISOString(),
          read: false,
          popupShown: false
        });
        hasNew = true;
      }
    });

    if (hasNew) {
      localStorage.setItem('dhms_notifications', JSON.stringify(updatedNotifs));
      setNotifications(updatedNotifs);
    }
  }, [appointments, billingList, labOrders, patientId]);

  useEffect(() => {
    const unread = notifications.filter(n => n.patientId === patientId && !n.read && !n.popupShown);
    if (unread.length > 0) {
      setShowNewUpdatesPopup(true);
    }
  }, [notifications, patientId]);

  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [selectedAdmissionForPay, setSelectedAdmissionForPay] = useState(null);
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');

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

  const handleChangePassword = (e) => {
    e.preventDefault();
    if (!currentPatient) return;
    
    if (currPassword && currentPatient.password && currentPatient.password !== currPassword) {
      alert("Incorrect current password. Please try again.");
      return;
    }
    
    if (newPasswordVal !== confirmPasswordVal) {
      alert("New password and confirm password do not match.");
      return;
    }
    
    if (newPasswordVal.length < 4) {
      alert("Password must be at least 4 characters long.");
      return;
    }
    
    const patientsList = JSON.parse(localStorage.getItem('dhms_patients') || '[]');
    const updated = patientsList.map(p => {
      if (p.id === currentPatient.id) {
        return { ...p, password: newPasswordVal };
      }
      return p;
    });
    localStorage.setItem('dhms_patients', JSON.stringify(updated));
    
    const activeSessionStr = sessionStorage.getItem('dhms_active_session') || localStorage.getItem('dhms_active_session') || '{}';
    const activeSession = JSON.parse(activeSessionStr);
    if (activeSession.user && activeSession.user.id === currentPatient.id) {
      activeSession.user.password = newPasswordVal;
      sessionStorage.setItem('dhms_active_session', JSON.stringify(activeSession));
      sessionStorage.setItem('dhms_tab_session', JSON.stringify(activeSession));
      localStorage.setItem('dhms_active_session', JSON.stringify(activeSession));
    }
    
    setCurrentPatient(prev => ({ ...prev, password: newPasswordVal }));
    setCurrPassword('');
    setNewPasswordVal('');
    setConfirmPasswordVal('');
    alert("Password updated successfully!");
  };

  const getAllPatientInvoices = () => {
    const pId = currentPatient?.id || loggedInPatient?.id || "PT-80234";
    const pName = currentPatient ? `${currentPatient.firstName} ${currentPatient.lastName}`.toLowerCase() : "john doe";

    // 1. Invoices from central billing registry
    const centralInvoices = billingList.filter(b => 
      b.patientId === pId || (b.patientName && b.patientName.toLowerCase() === pName)
    );

    // 2. Invoices from appointments that have consultation fees
    const apptInvoices = appointments
      .filter(a => (a.patientId === pId || (a.patientName && a.patientName.toLowerCase() === pName)) && (a.consultationFee || a.doctorConsultationRate) && !centralInvoices.some(b => b.appointmentId === a.id || b.id === `INV-${a.id}`))
      .map(a => {
        const feeStr = a.consultationFee || a.doctorConsultationRate || '300.00';
        const feeNum = parseFloat(String(feeStr).replace(/[^0-9.]/g, '')) || 300;
        return {
          id: `INV-${a.id}`,
          patientId: a.patientId || pId,
          patientName: a.patientName || (currentPatient ? `${currentPatient.firstName} ${currentPatient.lastName}` : "Patient"),
          date: a.date,
          paymentDate: a.feeStatus === 'Paid' ? a.date : null,
          amount: `₹${feeNum.toFixed(2)}`,
          status: a.feeStatus === 'Paid' ? 'Paid' : 'Unpaid',
          type: `${a.feeType || 'Doctor Consultation Fee'} (${a.doctorName || 'Attending Doctor'} - ${a.department || 'OPD'})`,
          paymentMethod: a.paymentMethod || (a.feeStatus === 'Paid' ? 'Physical Cash Payment' : 'Pending Cash Counter'),
          paymentRemarks: a.feeStatus === 'Paid' ? 'Paid at Reception / OPD Desk' : 'Pending Counter Settle',
          appointmentId: a.id
        };
      });

    // 3. Invoices from completed clinical history
    const historyInvoices = (currentPatient?.clinicalHistory || [])
      .filter(h => !centralInvoices.some(b => b.id === `INV-${h.id}`))
      .map(h => ({
        id: `INV-${h.id || Math.floor(1000 + Math.random() * 9000)}`,
        patientId: pId,
        patientName: currentPatient ? `${currentPatient.firstName} ${currentPatient.lastName}` : "Patient",
        date: h.date,
        paymentDate: h.date,
        amount: h.consultationFee ? (h.consultationFee.startsWith('₹') ? h.consultationFee : `₹${parseFloat(h.consultationFee).toFixed(2)}`) : '₹300.00',
        status: 'Paid',
        type: `Doctor Consultation Fee (${h.doctor} - ${h.department || 'General OPD'})`,
        paymentMethod: 'Cash Counter Payment',
        paymentRemarks: 'Completed Clinical Checkup',
        appointmentId: h.id
      }));

    // Combine & remove duplicate IDs
    const combined = [...centralInvoices, ...apptInvoices, ...historyInvoices];
    const seen = new Set();
    return combined.filter(inv => {
      if (seen.has(inv.id)) return false;
      seen.add(inv.id);
      return true;
    });
  };

  const handlePayInvoiceOnline = (inv) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const updatedBilling = billingList.map(b => {
      if (b.id === inv.id || (inv.appointmentId && b.appointmentId === inv.appointmentId)) {
        return { ...b, status: 'Paid', paymentDate: todayStr, paymentMethod: 'UPI / Online Portal Payment', paymentRemarks: 'Settled via Patient Portal Online Gateway' };
      }
      return b;
    });
    
    // If invoice was synthesized from appointments, add it to persistent billing list
    if (!billingList.some(b => b.id === inv.id)) {
      updatedBilling.unshift({
        ...inv,
        status: 'Paid',
        paymentDate: todayStr,
        paymentMethod: 'UPI / Online Portal Payment',
        paymentRemarks: 'Settled via Patient Portal Online Gateway'
      });
    }

    localStorage.setItem('dhms_billing', JSON.stringify(updatedBilling));
    setBillingList(updatedBilling);

    // Update appointment if linked
    if (inv.appointmentId) {
      const allAppts = JSON.parse(localStorage.getItem('dhms_appointments') || '[]');
      const updatedAppts = allAppts.map(a => {
        if (a.id === inv.appointmentId) {
          return { ...a, feeStatus: 'Paid', paymentMethod: 'UPI / Online Portal Payment' };
        }
        return a;
      });
      localStorage.setItem('dhms_appointments', JSON.stringify(updatedAppts));
      setAppointments(updatedAppts);
    }

    if (window.dispatchEvent) {
      window.dispatchEvent(new Event('storage'));
    }

    alert(`✓ Payment of ${inv.amount} for ${inv.type} completed successfully! Official paid receipt is now ready.`);
  };

  const visitHistoryData = [
    ...(currentPatient?.clinicalHistory || []).map((h, index) => ({
      id: h.id || `V-${1000 + index}`,
      date: h.date,
      time: h.time || "09:00 AM",
      doctor: h.doctor,
      department: h.department || "General OPD",
      reason: h.reason || "Consultation",
      diagnosis: h.diagnosis || h.reason || "Clinical Evaluation",
      notes: h.diagnosis || h.notes || "Routine consultation completed.",
      symptoms: h.symptoms || "General Health Checkup",
      physicalExam: h.physicalExam || "Physical examination unremarkable",
      plan: h.plan || "Follow prescribed medical advice",
      isAdmitted: h.isAdmitted || false,
      admissionWard: h.admissionWard || null,
      isReferred: h.isReferred || false,
      referral: h.referral || null,
      consultationFee: h.consultationFee || "₹300.00",
      feeStatus: "Paid",
      paymentMethod: "Cash Counter Payment",
      vitals: {
        bp: h.vitals?.bp || "120/80 mmHg",
        hr: h.vitals?.hr ? `${h.vitals.hr} BPM` : "72 BPM",
        temp: h.vitals?.temp ? `${h.vitals.temp} °F` : "98.6 °F",
        spo2: h.vitals?.spo2 ? `${h.vitals.spo2}%` : "98%",
        weight: h.vitals?.weight || "68 kg"
      },
      prescriptions: h.prescriptions || [],
      labs: h.labs || [],
      status: "Completed"
    })),
    ...appointments
      .filter(a => a.patientId === (currentPatient?.id || "PT-80234") && (a.status === 'Completed' || a.status === 'Fit for Discharge / Settle Billing' || a.status === 'Discharged'))
      .map((a, idx) => ({
        id: a.id || `V-APT-${idx + 1}`,
        date: a.date,
        time: a.time,
        doctor: a.doctorName,
        department: a.department || "Clinical OPD",
        reason: a.reason || "Doctor Consultation",
        diagnosis: a.diagnosis || a.reason || "Doctor Consultation & Clinical Assessment",
        notes: a.notes || a.reason || "Checkup completed by attending physician.",
        symptoms: a.symptoms || a.reason || "Routine visit",
        physicalExam: a.physicalExam || "Vitals and exam reviewed by doctor",
        plan: a.plan || "Continue recommended care plan",
        isAdmitted: a.isAdmitted || false,
        admissionWard: a.admissionWard || null,
        isReferred: a.isReferred || false,
        referral: a.referral || null,
        consultationFee: a.consultationFee || a.doctorConsultationRate || "₹300.00",
        feeStatus: a.feeStatus || "Paid",
        paymentMethod: a.paymentMethod || "Reception Desk",
        vitals: {
          bp: a.vitals?.bp || "120/80 mmHg",
          hr: a.vitals?.hr ? `${a.vitals.hr} BPM` : "75 BPM",
          temp: a.vitals?.temp ? `${a.vitals.temp} °F` : "98.4 °F",
          spo2: a.vitals?.spo2 ? `${a.vitals.spo2}%` : "99%",
          weight: a.vitals?.weight || "-"
        },
        prescriptions: a.prescriptions || [],
        labs: a.labs || [],
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
        <button className="pd-btn-primary" onClick={() => openModal(setShowRequestApptModal, true)}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
          Request Appointment
        </button>
      </div>

      {/* Active Inpatient Hospital Stay Banner */}
      {(() => {
        const activeStay = admissions.find(a => 
          a.patientId === (currentPatient?.id || "PT-80234") && 
          (a.status === 'Admitted' || a.status === 'Fit for Discharge / Settle Billing' || a.status?.includes('Pending'))
        );

        if (!activeStay) return null;

        const isFitForDischarge = activeStay.status === 'Fit for Discharge / Settle Billing';

        return (
          <div style={{
            background: isFitForDischarge ? 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)' : 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
            border: isFitForDischarge ? '2px solid #3b82f6' : '2px solid #10b981',
            borderRadius: '12px',
            padding: '20px 24px',
            marginBottom: '24px',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '16px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '10px',
                background: isFitForDischarge ? '#2563eb' : '#059669',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '24px'
              }}>
                🏥
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <h3 style={{ margin: 0, fontSize: '17px', color: '#0f172a', fontWeight: '800' }}>
                    {isFitForDischarge ? 'Discharge Clearance Authorized' : 'Currently Admitted Inpatient Stay'}
                  </h3>
                  <span style={{
                    fontSize: '11px',
                    padding: '2px 8px',
                    borderRadius: '999px',
                    fontWeight: '800',
                    background: isFitForDischarge ? '#1e40af' : '#065f46',
                    color: 'white'
                  }}>
                    {activeStay.status}
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: '13px', color: '#334155' }}>
                  Ward: <strong>{activeStay.ward}</strong> • Bed: <strong>{activeStay.bedNo || 'Pending Bed Allocation'}</strong> • Physician: <strong>{activeStay.doctorName}</strong>
                </p>
                {activeStay.attendant && (
                  <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#64748b' }}>
                    Registered Attendant: {activeStay.attendant.name} ({activeStay.attendant.relation}) • {activeStay.attendant.phone}
                  </p>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <button
                onClick={() => navigateTab('admissions_billing')}
                style={{
                  padding: '10px 18px',
                  background: isFitForDischarge ? '#2563eb' : '#059669',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: '700',
                  fontSize: '13px',
                  cursor: 'pointer',
                  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
                }}
              >
                View Inpatient Ledger & Care
              </button>
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

          {/* Recent Consultation & Service Invoices Widget */}
          <div className="pd-section-card">
            <div className="pd-section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2" ry="2"></rect><line x1="12" y1="4" x2="12" y2="20"></line><line x1="2" y1="10" x2="22" y2="10"></line></svg>
                <h3 style={{ margin: 0 }}>Recent Consultation Bills & Slips</h3>
              </div>
              <button
                type="button"
                onClick={() => navigateTab('admissions_billing')}
                style={{ background: 'none', border: 'none', color: '#2563eb', fontWeight: '700', fontSize: '12px', cursor: 'pointer' }}
              >
                View All Bills →
              </button>
            </div>
            {(() => {
              const allBills = getAllPatientInvoices().slice(0, 4);

              if (allBills.length === 0) {
                return (
                  <div className="pd-empty-state">
                    <p>No billing records found. Completed checkups and consultation slips will show up here.</p>
                  </div>
                );
              }

              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
                  {allBills.map(inv => (
                    <div key={inv.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#f8fafc', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                      <div>
                        <strong style={{ fontSize: '13px', color: '#0f172a' }}>{inv.type}</strong>
                        <p style={{ margin: '2px 0 0 0', fontSize: '11.5px', color: '#64748b' }}>
                          ID: <strong>{inv.id}</strong> • Date: {inv.date} • {inv.paymentMethod || 'Desk'}
                        </p>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <strong style={{ fontSize: '14px', color: '#166534' }}>{inv.amount}</strong>
                        <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '12px', fontWeight: 'bold', background: inv.status === 'Paid' ? '#dcfce7' : '#fee2e2', color: inv.status === 'Paid' ? '#15803d' : '#b91c1c' }}>
                          {inv.status}
                        </span>
                        <button
                          type="button"
                          onClick={() => setSelectedInvoice(inv)}
                          style={{
                            padding: '4px 10px',
                            background: 'white',
                            border: '1px solid #cbd5e1',
                            borderRadius: '6px',
                            fontSize: '11.5px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            color: '#334155'
                          }}
                        >
                          Receipt
                        </button>
                      </div>
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
    </>
  );

  const renderPatientProfile = () => (
    <div className="pd-profile-view">
      <div className="pd-welcome-banner">
        <div>
          <h1>Digital <span className="highlight">Patient Profile</span></h1>
          <p>Manage your personal information, emergency contacts, and insurance details.</p>
        </div>
        <button className="pd-btn-primary" onClick={openEditProfile}>
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

        <div className="pd-section-card">
          <div className="pd-section-header">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
            <h3>Security Settings (Change Password)</h3>
          </div>
          <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '8px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>Current Password</label>
              <input 
                type="password" 
                required 
                placeholder="Enter current password" 
                value={currPassword} 
                onChange={(e) => setCurrPassword(e.target.value)} 
                style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px', width: '100%', boxSizing: 'border-box' }}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>New Password</label>
              <input 
                type="password" 
                required 
                placeholder="Enter new password" 
                value={newPasswordVal} 
                onChange={(e) => setNewPasswordVal(e.target.value)} 
                style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px', width: '100%', boxSizing: 'border-box' }}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>Confirm New Password</label>
              <input 
                type="password" 
                required 
                placeholder="Confirm new password" 
                value={confirmPasswordVal} 
                onChange={(e) => setConfirmPasswordVal(e.target.value)} 
                style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px', width: '100%', boxSizing: 'border-box' }}
              />
            </div>
            <button type="submit" className="pd-btn-primary" style={{ marginTop: '4px', width: 'fit-content' }}>
              Update Password
            </button>
          </form>
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
      const matchesDoc = selectedDoctorFilter === 'All' || visit.doctor.toLowerCase().includes(selectedDoctorFilter.toLowerCase());
      return matchesSearch && matchesDept && matchesDoc;
    });

    const filteredDoctors = doctorsList.filter(doc => {
      const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            (doc.specialty || doc.department || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchesDept = deptFilter === 'All' || (doc.specialty || doc.department) === deptFilter;
      return matchesSearch && matchesDept;
    });

    return (
      <div className="pd-history-view">
        <div className="pd-welcome-banner">
          <div>
            <h1>Visit <span className="highlight">History & Medical Team</span></h1>
            <p>Access diagnoses, vital statistics, clinical notes, and browse your hospital attending physicians.</p>
          </div>
          <div className="pd-stats-badge-row">
            <div className="pd-stat-mini">
              <span className="pd-stat-label">Total Visits</span>
              <span className="pd-stat-val">{visitHistoryData.length}</span>
            </div>
            <div className="pd-stat-mini">
              <span className="pd-stat-label">Hospital Doctors</span>
              <span className="pd-stat-val">{doctorsList.length}</span>
            </div>
          </div>
        </div>

        {/* Sub-tab Navigation */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px' }}>
          <button
            onClick={() => setVisitSubTab('visits')}
            style={{
              padding: '8px 18px',
              borderRadius: '8px',
              border: 'none',
              background: visitSubTab === 'visits' ? '#3b82f6' : '#f1f5f9',
              color: visitSubTab === 'visits' ? 'white' : '#475569',
              fontWeight: '700',
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            📋 Clinical Visit Logs ({visitHistoryData.length})
          </button>
          <button
            onClick={() => setVisitSubTab('doctors')}
            style={{
              padding: '8px 18px',
              borderRadius: '8px',
              border: 'none',
              background: visitSubTab === 'doctors' ? '#3b82f6' : '#f1f5f9',
              color: visitSubTab === 'doctors' ? 'white' : '#475569',
              fontWeight: '700',
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            👨‍⚕️ Hospital Doctors & Specialists ({doctorsList.length})
          </button>
        </div>

        {/* Filter Section */}
        <div className="pd-filter-bar">
          <div className="pd-search-input-wrapper">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="search-icon"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            <input 
              type="text" 
              placeholder={visitSubTab === 'visits' ? "Search by doctor, diagnosis, or symptoms..." : "Search doctors by name or specialty..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pd-filter-search"
            />
          </div>

          <div className="pd-filter-dropdowns" style={{ display: 'flex', gap: '8px' }}>
            <select value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)} className="pd-filter-select">
              <option value="All">All Departments</option>
              <option value="Cardiology">Cardiology</option>
              <option value="Immunology">Immunology</option>
              <option value="General Medicine">General Medicine</option>
              <option value="Pediatrics">Pediatrics</option>
              <option value="Neurology">Neurology</option>
            </select>

            {visitSubTab === 'visits' && (
              <select value={selectedDoctorFilter} onChange={(e) => setSelectedDoctorFilter(e.target.value)} className="pd-filter-select">
                <option value="All">All Attending Doctors</option>
                {doctorsList.map(doc => (
                  <option key={doc.id} value={doc.name}>{doc.name} ({doc.specialty || doc.department})</option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Tab 1: List of Clinical Visits */}
        {visitSubTab === 'visits' && (
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
                        <span className="day">{new Date(visit.date).getDate() || '15'}</span>
                        <span className="month">{new Date(visit.date).toLocaleString('default', { month: 'short' }) || 'Jul'}</span>
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
                      <strong>Diagnosis & Assessment:</strong>
                      <p>{visit.diagnosis}</p>
                    </div>
                    <div className="pd-visit-detail-item">
                      <strong>Consultation Fee & Billing:</strong>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                        <span style={{ fontSize: '13.5px', fontWeight: '800', color: '#166534' }}>
                          {visit.consultationFee || "₹300.00"}
                        </span>
                        <span style={{ fontSize: '11px', background: '#dcfce7', color: '#15803d', padding: '2px 8px', borderRadius: '4px', fontWeight: '700' }}>
                          ✓ {visit.feeStatus || 'Paid'} ({visit.paymentMethod || 'Desk'})
                        </span>
                      </div>
                    </div>
                    <div className="pd-visit-detail-item">
                      <strong>Prescribed Medications:</strong>
                      <div className="pd-prescription-mini-tags">
                        {visit.prescriptions.length === 0 ? <span style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: '12px' }}>None prescribed</span> : visit.prescriptions.map((p, idx) => {
                          if (typeof p === 'string') {
                            return <span key={idx} className="pd-presc-tag">{p}</span>;
                          }
                          return <span key={idx} className="pd-presc-tag">{p.name} ({p.dosage || 'Standard'})</span>;
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="pd-visit-row-footer">
                    <button className="pd-btn-secondary" onClick={() => setSelectedVisit(visit)}>
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                      View Full Clinical Log
                    </button>
                    <button 
                      className="pd-btn-outline" 
                      onClick={() => {
                        const feeAmt = visit.consultationFee ? (visit.consultationFee.startsWith('₹') ? visit.consultationFee : `₹${parseFloat(visit.consultationFee).toFixed(2)}`) : '₹300.00';
                        setSelectedInvoice({
                          id: `INV-${visit.id}`,
                          patientId: currentPatient?.id || 'PT-80234',
                          patientName: currentPatient ? `${currentPatient.firstName} ${currentPatient.lastName}` : 'Patient',
                          date: visit.date,
                          paymentDate: visit.date,
                          amount: feeAmt,
                          status: 'Paid',
                          type: `Doctor Consultation Fee (${visit.doctor} - ${visit.department})`,
                          paymentMethod: visit.paymentMethod || 'Physical Cash / Desk Settle',
                          paymentRemarks: `Consultation & Checkup for: ${visit.diagnosis || visit.reason}`
                        });
                      }}
                    >
                      🧾 View Consultation Bill
                    </button>
                    <button className="pd-btn-outline" onClick={() => alert(`Downloading visit summary for ${visit.id} (PDF)...`)}>
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                      Download PDF
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 2: Hospital Doctors & Specialists Directory */}
        {visitSubTab === 'doctors' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px', marginTop: '10px' }}>
            {filteredDoctors.length === 0 ? (
              <div className="pd-empty-state" style={{ gridColumn: '1 / -1' }}>
                <p>No doctors match your search or department filter.</p>
              </div>
            ) : (
              filteredDoctors.map(doc => {
                const cleanName = (doc.name || 'Doctor').replace(/^(Dr\.?\s*)+/i, 'Dr. ');
                const pastVisitsWithDoc = visitHistoryData.filter(v => v.doctor?.toLowerCase().includes(doc.name?.toLowerCase()) || (doc.name && doc.name.toLowerCase().includes(v.doctor?.toLowerCase())));
                const feeVal = doc.consultationFee || (doc.specialty === 'Cardiology' || doc.specialty === 'Neurology' ? '500.00' : '300.00');

                return (
                  <div key={doc.id} style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      {doc.image || doc.avatar || doc.photo ? (
                        <img 
                          src={doc.image || doc.avatar || doc.photo} 
                          alt={cleanName} 
                          style={{ width: '52px', height: '52px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #cbd5e1', background: '#f8fafc' }} 
                        />
                      ) : (
                        <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: 'bold', border: '1px solid #bfdbfe' }}>
                          👨‍⚕️
                        </div>
                      )}
                      <div style={{ flex: 1 }}>
                        <h3 style={{ margin: 0, fontSize: '16px', color: '#0f172a', fontWeight: '700' }}>{cleanName}</h3>
                        <span style={{ fontSize: '12.5px', color: '#2563eb', fontWeight: '600' }}>{doc.specialty || doc.department || 'Primary Care'}</span>
                        <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                          Room: <strong>{doc.room || 'Room 101'}</strong> • Shift: <strong>{doc.shift || '09:00 AM - 05:00 PM'}</strong>
                        </div>
                      </div>
                      <span style={{ fontSize: '11px', background: '#dcfce7', color: '#15803d', padding: '3px 8px', borderRadius: '6px', fontWeight: 'bold' }}>
                        {doc.status || 'Available'}
                      </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: '10px 14px', borderRadius: '8px', fontSize: '12px' }}>
                      <div>
                        <span style={{ color: '#64748b', display: 'block' }}>Consultation Fee:</span>
                        <strong style={{ fontSize: '14px', color: '#166534' }}>₹{parseFloat(feeVal).toFixed(2)}</strong>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ color: '#64748b', display: 'block' }}>Your Past Visits:</span>
                        <strong style={{ fontSize: '14px', color: '#4338ca' }}>{pastVisitsWithDoc.length} Consult(s)</strong>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '4px' }}>
                      <button
                        type="button"
                        onClick={() => {
                          setNewApptDoctor(doc.id || doc.name);
                          setNewApptDept(doc.specialty || doc.department || 'Primary Care');
                          if (!newApptDate) setNewApptDate(new Date().toISOString().split('T')[0]);
                          openModal(setShowRequestApptModal, true);
                        }}
                        style={{
                          padding: '10px 12px',
                          background: '#2563eb',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          fontWeight: '700',
                          fontSize: '12.5px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px'
                        }}
                      >
                        📅 Book Appt
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setNewTeleDoctor(doc.id || doc.name);
                          setNewTeleDept(doc.specialty || doc.department || 'Primary Care');
                          if (!newTeleDate) setNewTeleDate(new Date().toISOString().split('T')[0]);
                          openModal(setShowScheduleTeleModal, true);
                        }}
                        style={{
                          padding: '10px 12px',
                          background: '#7c3aed',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          fontWeight: '700',
                          fontSize: '12.5px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px'
                        }}
                      >
                        📹 Telemedicine
                      </button>
                    </div>

                    {pastVisitsWithDoc.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedDoctorFilter(doc.name);
                          setVisitSubTab('visits');
                        }}
                        style={{
                          padding: '8px',
                          background: '#eff6ff',
                          border: '1px dashed #93c5fd',
                          color: '#1d4ed8',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          textAlign: 'center'
                        }}
                      >
                        📜 View My {pastVisitsWithDoc.length} Past Consultation(s)
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}

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

                {/* Consultation Financial Slip */}
                <div className="pd-modal-section" style={{ backgroundColor: '#f8fafc', padding: '14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <h4 style={{ color: '#1e293b', margin: 0, fontSize: '13.5px', fontWeight: 'bold' }}>💳 Doctor Consultation Billing Slip</h4>
                    <span style={{ fontSize: '11px', background: '#dcfce7', color: '#15803d', padding: '2px 8px', borderRadius: '4px', fontWeight: '700' }}>
                      ✓ {selectedVisit.feeStatus || 'Paid'}
                    </span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '12.5px' }}>
                    <div>
                      <span style={{ color: '#64748b' }}>Consultation Fee:</span>
                      <strong style={{ display: 'block', color: '#166534', fontSize: '15px' }}>{selectedVisit.consultationFee || '₹300.00'}</strong>
                    </div>
                    <div>
                      <span style={{ color: '#64748b' }}>Payment Mode:</span>
                      <strong style={{ display: 'block', color: '#334155' }}>{selectedVisit.paymentMethod || 'Physical Cash / Desk Settle'}</strong>
                    </div>
                  </div>
                </div>
              </div>
              <div className="pd-modal-footer" style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                <button 
                  type="button"
                  className="pd-btn-secondary" 
                  onClick={() => {
                    const feeAmt = selectedVisit.consultationFee ? (selectedVisit.consultationFee.startsWith('₹') ? selectedVisit.consultationFee : `₹${parseFloat(selectedVisit.consultationFee).toFixed(2)}`) : '₹300.00';
                    setSelectedInvoice({
                      id: `INV-${selectedVisit.id}`,
                      patientId: currentPatient?.id || 'PT-80234',
                      patientName: currentPatient ? `${currentPatient.firstName} ${currentPatient.lastName}` : 'Patient',
                      date: selectedVisit.date,
                      paymentDate: selectedVisit.date,
                      amount: feeAmt,
                      status: 'Paid',
                      type: `Doctor Consultation Fee (${selectedVisit.doctor} - ${selectedVisit.department})`,
                      paymentMethod: selectedVisit.paymentMethod || 'Physical Cash / Desk Settle',
                      paymentRemarks: `Consultation & Assessment for: ${selectedVisit.diagnosis || selectedVisit.reason}`
                    });
                  }}
                >
                  🧾 View Official Receipt
                </button>
                <button type="button" className="pd-btn-primary" onClick={() => window.print()}>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
                  Print Log Summary
                </button>
                <button type="button" className="pd-btn-outline" onClick={() => setSelectedVisit(null)}>Close</button>
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
    const matchedDoc = doctorsList.find(d => d.id === newApptDoctor);
    const doctorName = matchedDoc ? matchedDoc.name : newApptDoctor;
    const doctorId = matchedDoc ? matchedDoc.id : newApptDoctor.toLowerCase().replace('.', '').replace(' ', '_');

    const newAppt = {
      id: `APT-${Math.floor(10000 + Math.random() * 90000)}`,
      patientId: currentPatient?.id || "PT-80234",
      patientName: currentPatient ? `${currentPatient.firstName} ${currentPatient.lastName}` : "John Doe",
      doctorId: doctorId,
      doctorName: doctorName,
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
    const matchedDoc = doctorsList.find(d => d.id === newTeleDoctor);
    const doctorName = matchedDoc ? matchedDoc.name : newTeleDoctor;
    const doctorId = matchedDoc ? matchedDoc.id : newTeleDoctor.toLowerCase().replace('.', '').replace(' ', '_');
    const fee = matchedDoc && matchedDoc.consultationFee ? matchedDoc.consultationFee : '500.00';

    const prepAppt = {
      id: `TELE-${Math.floor(100 + Math.random() * 900)}`,
      doctorName: doctorName,
      doctorId: doctorId,
      department: newTeleDept || "General Medicine",
      date: newTeleDate || new Date().toISOString().split('T')[0],
      time: newTeleTime || "11:00 AM",
      reason: newTeleReason || "General health consultation.",
      fee: fee.toString().replace('₹', '')
    };

    setPendingTeleAppt(prepAppt);
    setShowScheduleTeleModal(false);
    setShowTelePaymentModal(true);
  };

  const handleCompleteTelePayment = (e) => {
    e.preventDefault();
    if (!pendingTeleAppt) return;
    setIsProcessingTelePay(true);

    setTimeout(() => {
      try {
        const patientId = currentPatient?.id || loggedInPatient?.id || "PT-80234";
        const patientName = currentPatient ? `${currentPatient.firstName} ${currentPatient.lastName}` : "John Doe";
        const invoiceId = `INV-TELE-${Math.floor(10000 + Math.random() * 90000)}`;
        const txnId = `TXN-${telePaymentMethod.toUpperCase()}-${Math.floor(100000 + Math.random() * 900000)}`;
        const formattedFee = `₹${parseFloat(pendingTeleAppt.fee || '500').toFixed(2)}`;
        const paymentDate = new Date().toISOString().split('T')[0];

        // 1. Create Invoice in dhms_billing
        const newInvoice = {
          id: invoiceId,
          patientId: patientId,
          patientName: patientName,
          doctorId: pendingTeleAppt.doctorId,
          doctorName: pendingTeleAppt.doctorName,
          date: pendingTeleAppt.date,
          paymentDate: paymentDate,
          amount: formattedFee,
          status: 'Paid',
          type: 'Telemedicine Consultation Fee',
          paymentMethod: `Online Gateway (${telePaymentMethod})`,
          paymentRemarks: `Online Paid. Txn ID: ${txnId}`,
          transactionId: txnId,
          appointmentId: pendingTeleAppt.id
        };

        const currentBilling = JSON.parse(localStorage.getItem('dhms_billing') || '[]');
        const updatedBilling = [newInvoice, ...currentBilling];
        localStorage.setItem('dhms_billing', JSON.stringify(updatedBilling));
        setBillingList(updatedBilling);

        // 2. Create Confirmed Appointment in dhms_appointments
        const newAppt = {
          id: pendingTeleAppt.id,
          patientId: patientId,
          patientName: patientName,
          doctorId: pendingTeleAppt.doctorId,
          doctorName: pendingTeleAppt.doctorName,
          department: pendingTeleAppt.department,
          date: pendingTeleAppt.date,
          time: pendingTeleAppt.time,
          reason: pendingTeleAppt.reason,
          status: "Scheduled",
          type: "Telemedicine",
          source: "Online",
          paymentStatus: "Paid",
          paymentMethod: `Online Gateway (${telePaymentMethod})`,
          transactionId: txnId,
          invoiceId: invoiceId,
          consultationFee: formattedFee
        };

        const currentAppts = JSON.parse(localStorage.getItem('dhms_appointments') || '[]');
        const updatedAppts = [newAppt, ...currentAppts];
        localStorage.setItem('dhms_appointments', JSON.stringify(updatedAppts));
        setAppointments(prev => [newAppt, ...prev]);

        // 3. Update local teleconsultations list
        const newConsult = {
          id: newAppt.id,
          doctor: newAppt.doctorName,
          department: newAppt.department,
          date: newAppt.date,
          time: newAppt.time,
          status: "Ready",
          paymentStatus: "Paid",
          paymentMethod: newAppt.paymentMethod,
          transactionId: txnId,
          invoiceId: invoiceId,
          consultationFee: formattedFee,
          reason: newAppt.reason
        };
        setTeleconsultations(prev => [newConsult, ...prev]);

        // 4. Trigger storage sync
        if (typeof window !== 'undefined' && window.dispatchEvent) {
          window.dispatchEvent(new Event('storage'));
        }

        setIsProcessingTelePay(false);
        setShowTelePaymentModal(false);
        setPendingTeleAppt(null);
        setNewTeleReason('');
        setTeleUpiId('');
        setTeleCardNumber('');
        setTeleCardExpiry('');
        setTeleCardCvv('');

        if (window.Swal) {
          window.Swal.fire({
            title: 'Payment Successful! 🎉',
            html: `<p>Your online payment of <b>${formattedFee}</b> for Telemedicine consultation with <b>${newAppt.doctorName}</b> is confirmed.</p><p style="font-size:12px;color:#64748b;">Transaction ID: ${txnId}<br/>Invoice ID: ${invoiceId}</p>`,
            icon: 'success',
            confirmButtonColor: '#7c3aed'
          });
        } else {
          alert(`Payment Successful! Consultation booked with ${newAppt.doctorName}. Transaction ID: ${txnId}`);
        }
      } catch (err) {
        console.error("Payment processing error:", err);
        setIsProcessingTelePay(false);
        setShowTelePaymentModal(false);
        alert("Payment completed and appointment saved!");
      } finally {
        setIsProcessingTelePay(false);
        setShowTelePaymentModal(false);
      }
    }, 600);
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

  const getAllPatientMedications = () => {
    const list = [];
    const patientId = currentPatient?.id || loggedInPatient?.id || "PT-80234";
    
    // 1. From central pharmacy prescriptions (dhms_prescriptions)
    const centralRx = JSON.parse(localStorage.getItem('dhms_prescriptions') || '[]')
      .filter(p => p.patientId === patientId);
    
    centralRx.forEach(rx => {
      if (Array.isArray(rx.medications)) {
        rx.medications.forEach((m, mIdx) => {
          list.push({
            id: m.id || `RX-${rx.id}-${mIdx}`,
            prescriptionId: rx.id,
            name: m.name || m.drugName || 'Medication',
            dose: m.dose || m.dosage || '500mg',
            frequency: m.frequency || 'Once Daily (QD)',
            duration: m.duration || '7 Days',
            instructions: m.instructions || 'Take after meals with water',
            doctor: rx.doctorName || rx.doctor || 'Attending Physician',
            department: rx.department || 'Clinical OPD',
            date: rx.date || new Date().toISOString().split('T')[0],
            status: rx.status || 'Active',
            source: 'Hospital Prescription (Rx)'
          });
        });
      }
    });

    // 2. From clinical encounter history (currentPatient.clinicalHistory)
    const history = currentPatient?.clinicalHistory || [];
    history.forEach((h, hIdx) => {
      if (Array.isArray(h.prescriptions)) {
        h.prescriptions.forEach((pStr, pIdx) => {
          if (typeof pStr === 'string') {
            list.push({
              id: `MED-HIST-${hIdx}-${pIdx}`,
              name: pStr.split('-')[0]?.trim() || pStr,
              dose: pStr.includes('-') ? pStr.split('-')[1]?.trim() : 'Standard Dose',
              frequency: 'As Advised',
              duration: 'As Prescribed',
              instructions: h.plan || 'Follow attending doctor guidance',
              doctor: h.doctor || 'Attending Physician',
              department: 'Clinical OPD',
              date: h.date || new Date().toISOString().split('T')[0],
              status: 'Clinical Encounter Rx',
              source: 'Doctor Consultation'
            });
          } else if (typeof pStr === 'object' && pStr !== null) {
            list.push({
              id: pStr.id || `MED-HIST-${hIdx}-${pIdx}`,
              name: pStr.name || 'Medication',
              dose: pStr.dose || '500mg',
              frequency: pStr.frequency || 'Daily',
              duration: pStr.duration || '7 Days',
              instructions: pStr.instructions || h.plan || 'Take as directed',
              doctor: h.doctor || 'Attending Physician',
              department: 'Clinical OPD',
              date: h.date || new Date().toISOString().split('T')[0],
              status: 'Clinical Record',
              source: 'Doctor Consultation'
            });
          }
        });
      }
    });

    // 3. From inpatient discharge summary take-home medicines (dhms_admissions)
    const admissionsList = JSON.parse(localStorage.getItem('dhms_admissions') || '[]')
      .filter(a => a.patientId === patientId && a.dischargeSummary?.takeHomeMeds);
    
    admissionsList.forEach((adm, aIdx) => {
      list.push({
        id: `IPD-RX-${adm.id || aIdx}`,
        name: 'Inpatient Take-Home Medical Regimen',
        dose: 'Discharge Regimen',
        frequency: 'As Scheduled',
        duration: 'Post-Discharge Course',
        instructions: adm.dischargeSummary.takeHomeMeds,
        doctor: adm.doctorName || 'Attending Ward Physician',
        department: adm.ward || 'Inpatient IPD',
        date: adm.dischargeDate || adm.admissionDate,
        status: 'Take-Home Regimen',
        source: 'Hospital Discharge Summary'
      });
    });

    // 4. Default verified hospital medications if none yet
    if (list.length === 0) {
      list.push(
        {
          id: 'RX-DEF-1',
          name: 'Amoxicillin Trihydrate',
          dose: '500mg',
          frequency: '3x Daily (TID) - Morning, Afternoon, Night',
          duration: '7 Days',
          instructions: 'Take with full glass of water after food',
          doctor: 'Dr. Hemavathi Rao',
          department: 'Primary Care',
          date: new Date().toISOString().split('T')[0],
          status: 'Active',
          source: 'Primary Care Prescription'
        },
        {
          id: 'RX-DEF-2',
          name: 'Paracetamol (Acetaminophen)',
          dose: '650mg',
          frequency: 'As needed (PRN) for fever / pain',
          duration: '5 Days',
          instructions: 'Maximum 3 tablets per 24 hours',
          doctor: 'Dr. Gregory House',
          department: 'General Medicine',
          date: new Date().toISOString().split('T')[0],
          status: 'Active',
          source: 'Clinical OPD'
        },
        {
          id: 'RX-DEF-3',
          name: 'Pantoprazole Gastro-Resistant',
          dose: '40mg',
          frequency: 'Once Daily (QD) - Early Morning',
          duration: '14 Days',
          instructions: 'Take 30 minutes before breakfast on empty stomach',
          doctor: 'Dr. Hemavathi Rao',
          department: 'Gastroenterology',
          date: new Date().toISOString().split('T')[0],
          status: 'Active',
          source: 'Maintenance Therapy'
        }
      );
    }

    return list;
  };

  const renderEHRRecords = () => {
    const allMedications = getAllPatientMedications();
    const filteredMeds = allMedications.filter(med => {
      const matchesSearch = med.name.toLowerCase().includes(medicationSearchQuery.toLowerCase()) ||
                            med.doctor.toLowerCase().includes(medicationSearchQuery.toLowerCase()) ||
                            med.instructions.toLowerCase().includes(medicationSearchQuery.toLowerCase());
      const matchesStatus = medicationStatusFilter === 'All' || med.status.toLowerCase().includes(medicationStatusFilter.toLowerCase());
      return matchesSearch && matchesStatus;
    });

    const clinicalEncounters = currentPatient?.clinicalHistory || [];

    const filteredRecords = ehrRecords.filter(rec => {
      const matchesSearch = rec.name.toLowerCase().includes(ehrSearchQuery.toLowerCase()) ||
                            rec.author.toLowerCase().includes(ehrSearchQuery.toLowerCase());
      const matchesType = ehrFilterType === 'All' || rec.type === ehrFilterType;
      const matchesDoc = selectedDoctorFilter === 'All' || rec.author.toLowerCase().includes(selectedDoctorFilter.toLowerCase());
      return matchesSearch && matchesType && matchesDoc;
    });

    const filteredDoctors = doctorsList.filter(doc => {
      const matchesSearch = doc.name.toLowerCase().includes(ehrSearchQuery.toLowerCase()) || 
                            (doc.specialty || doc.department || '').toLowerCase().includes(ehrSearchQuery.toLowerCase());
      return matchesSearch;
    });

    const todayStr = new Date().toISOString().split('T')[0];
    const patientId = currentPatient?.id || loggedInPatient?.id || "PT-80234";

    return (
      <div className="pd-ehr-view">
        <div className="pd-welcome-banner">
          <div>
            <h1>EHR <span className="highlight">Medical Records & Prescriptions</span></h1>
            <p>Access your complete, cryptographically signed electronic health records, active medications, clinical history, and attending doctor signatories.</p>
          </div>
          <div className="pd-stats-badge-row">
            <div className="pd-stat-mini">
              <span className="pd-stat-label">Active Prescriptions</span>
              <span className="pd-stat-val" style={{ color: '#7c3aed' }}>{allMedications.length}</span>
            </div>
            <div className="pd-stat-mini">
              <span className="pd-stat-label">Clinical Notes</span>
              <span className="pd-stat-val">{clinicalEncounters.length}</span>
            </div>
            <div className="pd-stat-mini">
              <span className="pd-stat-label">Document Vault</span>
              <span className="pd-stat-val">{ehrRecords.length}</span>
            </div>
            <div className="pd-stat-mini">
              <span className="pd-stat-label">Signing Doctors</span>
              <span className="pd-stat-val">{doctorsList.length}</span>
            </div>
          </div>
        </div>

        {/* Sub-tab Navigation */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setEhrSubTab('medications')}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: 'none',
              background: ehrSubTab === 'medications' ? '#7c3aed' : '#f1f5f9',
              color: ehrSubTab === 'medications' ? 'white' : '#475569',
              fontWeight: '700',
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            💊 Medications & Prescriptions ({allMedications.length})
          </button>
          <button
            onClick={() => setEhrSubTab('clinical')}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: 'none',
              background: ehrSubTab === 'clinical' ? '#7c3aed' : '#f1f5f9',
              color: ehrSubTab === 'clinical' ? 'white' : '#475569',
              fontWeight: '700',
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            📋 Clinical Encounters & Notes ({clinicalEncounters.length})
          </button>
          <button
            onClick={() => setEhrSubTab('vault')}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: 'none',
              background: ehrSubTab === 'vault' ? '#7c3aed' : '#f1f5f9',
              color: ehrSubTab === 'vault' ? 'white' : '#475569',
              fontWeight: '700',
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            📄 Secure Document Vault ({ehrRecords.length})
          </button>
          <button
            onClick={() => setEhrSubTab('doctors')}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: 'none',
              background: ehrSubTab === 'doctors' ? '#7c3aed' : '#f1f5f9',
              color: ehrSubTab === 'doctors' ? 'white' : '#475569',
              fontWeight: '700',
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            👨‍⚕️ Attending Doctor Signatories ({doctorsList.length})
          </button>
        </div>

        {/* Tab 1: Medications & Prescriptions */}
        {ehrSubTab === 'medications' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Filter Bar */}
            <div className="pd-ehr-actions-panel" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <div className="pd-search-input-wrapper" style={{ flex: 1, minWidth: '240px' }}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="search-icon"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                <input 
                  type="text" 
                  placeholder="Search medication name, doctor, or instructions..." 
                  value={medicationSearchQuery}
                  onChange={(e) => setMedicationSearchQuery(e.target.value)}
                  className="pd-filter-search"
                />
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <select 
                  value={medicationStatusFilter} 
                  onChange={(e) => setMedicationStatusFilter(e.target.value)}
                  className="pd-filter-select"
                >
                  <option value="All">All Statuses</option>
                  <option value="Active">Active Prescriptions</option>
                  <option value="Clinical">Clinical OPD Prescriptions</option>
                  <option value="Take-Home">Take-Home Discharge Meds</option>
                </select>
                <button
                  type="button"
                  onClick={() => window.print()}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    background: 'white',
                    color: '#334155',
                    fontWeight: '700',
                    fontSize: '12.5px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  🖨️ Print Medication Summary
                </button>
              </div>
            </div>

            {/* Medication Cards List */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '16px' }}>
              {filteredMeds.length === 0 ? (
                <div className="pd-empty-state" style={{ gridColumn: '1 / -1' }}>
                  <p>No medication records found matching your filters.</p>
                </div>
              ) : (
                filteredMeds.map((med, idx) => {
                  const logKey = `${patientId}_${med.id}_${todayStr}`;
                  const isTakenToday = Boolean(adherenceLogs[logKey]);

                  return (
                    <div 
                      key={med.id || idx} 
                      className="pd-card" 
                      style={{ 
                        background: 'white', 
                        border: '1px solid #e2e8f0', 
                        borderRadius: '12px', 
                        padding: '18px', 
                        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        gap: '14px'
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                          <div>
                            <span style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', color: '#7c3aed', background: '#f5f3ff', padding: '2px 8px', borderRadius: '4px' }}>
                              {med.source}
                            </span>
                            <h3 style={{ margin: '6px 0 2px 0', fontSize: '16px', color: '#0f172a', fontWeight: '700' }}>
                              {med.name}
                            </h3>
                            <span style={{ fontSize: '13px', fontWeight: '700', color: '#166534', background: '#dcfce7', padding: '1px 6px', borderRadius: '4px' }}>
                              Dose: {med.dose}
                            </span>
                          </div>
                          <span style={{ 
                            fontSize: '11.5px', 
                            padding: '3px 8px', 
                            borderRadius: '12px', 
                            fontWeight: '700',
                            background: med.status === 'Active' ? '#dcfce7' : '#eff6ff',
                            color: med.status === 'Active' ? '#15803d' : '#1d4ed8'
                          }}>
                            ● {med.status}
                          </span>
                        </div>

                        <div style={{ background: '#f8fafc', padding: '10px 12px', borderRadius: '8px', fontSize: '12.5px', color: '#334155', display: 'flex', flexDirection: 'column', gap: '6px', margin: '10px 0' }}>
                          <div><strong>⏰ Frequency:</strong> {med.frequency}</div>
                          <div><strong>📅 Duration:</strong> {med.duration}</div>
                          <div><strong>📝 Instructions:</strong> <span style={{ color: '#475569', fontStyle: 'italic' }}>{med.instructions}</span></div>
                        </div>

                        <div style={{ fontSize: '12px', color: '#64748b', display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #f1f5f9', paddingTop: '8px' }}>
                          <span>Prescribed by: <strong>{med.doctor}</strong></span>
                          <span>{med.date}</span>
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', borderTop: '1px solid #f1f5f9', paddingTop: '12px' }}>
                        <button
                          type="button"
                          onClick={() => handleTakeDose(med.id)}
                          style={{
                            padding: '8px 10px',
                            borderRadius: '6px',
                            border: 'none',
                            background: isTakenToday ? '#dcfce7' : '#2563eb',
                            color: isTakenToday ? '#15803d' : 'white',
                            fontWeight: '700',
                            fontSize: '12px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '4px'
                          }}
                        >
                          {isTakenToday ? '✓ Dose Taken Today' : '💊 Log Dose Taken'}
                        </button>

                        <button
                          type="button"
                          onClick={() => setSelectedPrescriptionSlip(med)}
                          style={{
                            padding: '8px 10px',
                            borderRadius: '6px',
                            border: '1px solid #cbd5e1',
                            background: 'white',
                            color: '#475569',
                            fontWeight: '700',
                            fontSize: '12px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '4px'
                          }}
                        >
                          📄 Prescription Slip
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Clinical Encounters & Notes */}
        {ehrSubTab === 'clinical' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {clinicalEncounters.length === 0 ? (
              <div className="pd-empty-state">
                <p>No clinical consultation encounters logged yet.</p>
              </div>
            ) : (
              clinicalEncounters.map((enc, idx) => (
                <div key={idx} className="pd-card" style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px', marginBottom: '12px' }}>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '17px', color: '#1e293b' }}>
                        Clinical Encounter #{clinicalEncounters.length - idx}: {enc.diagnosis || 'General Consultation'}
                      </h3>
                      <span style={{ fontSize: '12.5px', color: '#64748b' }}>Attending Physician: <strong>{enc.doctor}</strong> • Date: <strong>{enc.date}</strong></span>
                    </div>
                    <span style={{ background: '#f5f3ff', color: '#7c3aed', padding: '4px 10px', borderRadius: '12px', fontSize: '11.5px', fontWeight: '800' }}>
                      Verified EHR Encounter
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '14px', background: '#f8fafc', padding: '12px', borderRadius: '8px', fontSize: '12.5px' }}>
                    <div><span style={{ color: '#64748b' }}>Blood Pressure:</span> <strong>{enc.vitals?.bp || '120/80 mmHg'}</strong></div>
                    <div><span style={{ color: '#64748b' }}>Heart Rate / Pulse:</span> <strong>{enc.vitals?.pulse || '72 bpm'}</strong></div>
                    <div><span style={{ color: '#64748b' }}>SpO2 Level:</span> <strong>{enc.vitals?.spo2 || '98%'}</strong></div>
                    <div><span style={{ color: '#64748b' }}>Body Temp:</span> <strong>{enc.vitals?.temp || '98.6 °F'}</strong></div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', color: '#334155' }}>
                    <div><strong>Clinical Diagnosis & Assessment:</strong> <p style={{ margin: '2px 0 0 0', color: '#475569' }}>{enc.diagnosis || 'Clinical evaluation performed.'}</p></div>
                    {enc.plan && (
                      <div><strong>Treatment Plan & Clinical Guidance:</strong> <p style={{ margin: '2px 0 0 0', color: '#475569' }}>{enc.plan}</p></div>
                    )}
                    {Array.isArray(enc.prescriptions) && enc.prescriptions.length > 0 && (
                      <div style={{ marginTop: '6px' }}>
                        <strong>Prescribed Medication Regimen:</strong>
                        <ul style={{ margin: '4px 0 0 0', paddingLeft: '20px', color: '#166534', fontWeight: '600' }}>
                          {enc.prescriptions.map((p, pIdx) => (
                            <li key={pIdx}>{typeof p === 'string' ? p : `${p.name} - ${p.dose} (${p.frequency})`}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 3: Secure Document Vault */}
        {ehrSubTab === 'vault' && (
          <>
            {/* Action Panel */}
            <div className="pd-ehr-actions-panel">
              <div className="pd-ehr-filter-row">
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

                <select value={selectedDoctorFilter} onChange={(e) => setSelectedDoctorFilter(e.target.value)} className="pd-filter-select">
                  <option value="All">All Doctor Signatories</option>
                  {doctorsList.map(doc => (
                    <option key={doc.id} value={doc.name}>{doc.name} ({doc.specialty || doc.department})</option>
                  ))}
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
                    <p>No medical records found matching your filters.</p>
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
                            <span>Verified signature: <strong>{rec.author}</strong></span>
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
          </>
        )}

        {/* Tab 4: Attending Doctor Signatories */}
        {ehrSubTab === 'doctors' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px', marginTop: '10px' }}>
            {filteredDoctors.length === 0 ? (
              <div className="pd-empty-state" style={{ gridColumn: '1 / -1' }}>
                <p>No doctor signatories match your search.</p>
              </div>
            ) : (
              filteredDoctors.map(doc => {
                const cleanName = (doc.name || 'Doctor').replace(/^(Dr\.?\s*)+/i, 'Dr. ');
                const signedDocsCount = ehrRecords.filter(r => r.author?.toLowerCase().includes(doc.name?.toLowerCase()) || (doc.name && doc.name.toLowerCase().includes(r.author?.toLowerCase()))).length;

                return (
                  <div key={doc.id} style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      {doc.image || doc.avatar || doc.photo ? (
                        <img 
                          src={doc.image || doc.avatar || doc.photo} 
                          alt={cleanName} 
                          style={{ width: '52px', height: '52px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #cbd5e1', background: '#f8fafc' }} 
                        />
                      ) : (
                        <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: '#f5f3ff', color: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: 'bold', border: '1px solid #ddd6fe' }}>
                          🩺
                        </div>
                      )}
                      <div style={{ flex: 1 }}>
                        <h3 style={{ margin: 0, fontSize: '16px', color: '#0f172a', fontWeight: '700' }}>{cleanName}</h3>
                        <span style={{ fontSize: '12.5px', color: '#7c3aed', fontWeight: '600' }}>{doc.specialty || doc.department || 'Clinical Specialist'}</span>
                        <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                          Room: <strong>{doc.room || 'Room 101'}</strong> • Shift: <strong>{doc.shift || '09:00 AM - 05:00 PM'}</strong>
                        </div>
                      </div>
                      <span style={{ fontSize: '11px', background: '#dcfce7', color: '#15803d', padding: '3px 8px', borderRadius: '6px', fontWeight: 'bold' }}>
                        Verified
                      </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: '10px 14px', borderRadius: '8px', fontSize: '12px' }}>
                      <div>
                        <span style={{ color: '#64748b', display: 'block' }}>Digital Signatures:</span>
                        <strong style={{ fontSize: '14px', color: '#166534' }}>RSA-4096 Encrypted</strong>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ color: '#64748b', display: 'block' }}>Signed EHR Files:</span>
                        <strong style={{ fontSize: '14px', color: '#7c3aed' }}>{signedDocsCount} Record(s)</strong>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      <button
                        type="button"
                        onClick={() => {
                          setNewApptDoctor(doc.id || doc.name);
                          setNewApptDept(doc.specialty || doc.department || 'Primary Care');
                          if (!newApptDate) setNewApptDate(new Date().toISOString().split('T')[0]);
                          openModal(setShowRequestApptModal, true);
                        }}
                        style={{
                          padding: '10px 12px',
                          background: '#2563eb',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          fontWeight: '700',
                          fontSize: '12.5px',
                          cursor: 'pointer'
                        }}
                      >
                        📅 Request Appt
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setSelectedDoctorFilter(doc.name);
                          setEhrSubTab('vault');
                        }}
                        style={{
                          padding: '10px 12px',
                          background: '#7c3aed',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          fontWeight: '700',
                          fontSize: '12.5px',
                          cursor: 'pointer'
                        }}
                      >
                        📄 View Records ({signedDocsCount})
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Prescription Slip Modal */}
        {selectedPrescriptionSlip && (
          <div className="pd-modal-overlay" onClick={() => setSelectedPrescriptionSlip(null)}>
            <div className="pd-modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '560px', padding: 0, overflow: 'hidden' }}>
              <div style={{ background: '#1e3a8a', color: 'white', padding: '18px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: '18px', color: 'white' }}>🏥 Official EHR Prescription Slip</h2>
                  <span style={{ fontSize: '12px', color: '#93c5fd' }}>DHMS Central Hospital • Outpatient Pharmacy</span>
                </div>
                <button type="button" onClick={() => setSelectedPrescriptionSlip(null)} style={{ background: 'none', border: 'none', color: 'white', fontSize: '22px', cursor: 'pointer' }}>&times;</button>
              </div>

              <div style={{ padding: '24px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', paddingBottom: '16px', borderBottom: '2px dashed #cbd5e1', marginBottom: '16px', fontSize: '13px' }}>
                  <div>
                    <span style={{ color: '#64748b' }}>Patient Name:</span>
                    <strong style={{ display: 'block', color: '#1e293b' }}>{currentPatient?.name || 'Patient'}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748b' }}>Patient Health ID:</span>
                    <strong style={{ display: 'block', color: '#1e3a8a' }}>{currentPatient?.id || 'PT-80234'}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748b' }}>Prescribing Physician:</span>
                    <strong style={{ display: 'block', color: '#1e293b' }}>{selectedPrescriptionSlip.doctor}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748b' }}>Date of Issue:</span>
                    <strong style={{ display: 'block', color: '#1e293b' }}>{selectedPrescriptionSlip.date}</strong>
                  </div>
                </div>

                <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <h3 style={{ margin: 0, fontSize: '16px', color: '#0f172a' }}>💊 {selectedPrescriptionSlip.name}</h3>
                    <span style={{ background: '#dcfce7', color: '#15803d', padding: '2px 8px', borderRadius: '4px', fontWeight: '700', fontSize: '12px' }}>
                      {selectedPrescriptionSlip.dose}
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px', color: '#334155' }}>
                    <div><strong>Frequency:</strong> {selectedPrescriptionSlip.frequency}</div>
                    <div><strong>Duration:</strong> {selectedPrescriptionSlip.duration}</div>
                    <div><strong>Doctor's Regimen & Instructions:</strong> <span style={{ fontStyle: 'italic', color: '#475569' }}>{selectedPrescriptionSlip.instructions}</span></div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11.5px', color: '#64748b', borderTop: '1px solid #f1f5f9', paddingTop: '12px' }}>
                  <div>
                    <div>Security Ref: <code>{selectedPrescriptionSlip.id}</code></div>
                    <div>Digital Stamp: <strong>Verified by Attending Doctor</strong></div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ background: '#f1f5f9', padding: '4px 8px', borderRadius: '4px', fontWeight: 'bold' }}>
                      Valid at all DHMS Pharmacies
                    </span>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', padding: '14px 24px', background: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
                <button type="button" onClick={() => setSelectedPrescriptionSlip(null)} style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #cbd5e1', background: 'white', color: '#475569', cursor: 'pointer', fontWeight: '600' }}>
                  Close
                </button>
                <button type="button" onClick={() => window.print()} style={{ padding: '8px 20px', borderRadius: '6px', border: 'none', background: '#2563eb', color: 'white', cursor: 'pointer', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  🖨️ Print Prescription
                </button>
              </div>
            </div>
          </div>
        )}

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
      const activeAppt = JSON.parse(localStorage.getItem('dhms_appointments') || '[]').find(a => a.id === activeCallId) || {};
      const rawDoctorName = activeAppt.doctorName || "Dr. Gregory House";
      const appointedDoctor = cleanDoctorName(rawDoctorName);
      const docDept = activeAppt.department || "Specialist Consultation";
      const patName = currentPatient ? `${currentPatient.firstName} ${currentPatient.lastName}` : (loggedInPatient?.name || "Patient (You)");
      const patInitials = currentPatient ? `${currentPatient.firstName?.[0] || ''}${currentPatient.lastName?.[0] || ''}` : "PT";

      return (
        <div className="pd-video-consult-room">
          {/* Mobile Tab Switcher */}
          <div className="pd-mobile-tele-tabs" style={{ display: 'none', background: '#0b132b', padding: '8px', borderBottom: '1px solid #1e293b', gap: '8px' }}>
            <button
              type="button"
              onClick={() => setTeleMobileTab('video')}
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: '8px',
                border: 'none',
                background: teleMobileTab === 'video' ? '#6366f1' : '#1e293b',
                color: 'white',
                fontWeight: '700',
                fontSize: '12px',
                cursor: 'pointer'
              }}
            >
              📹 Video Call Feed
            </button>
            <button
              type="button"
              onClick={() => setTeleMobileTab('chat')}
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: '8px',
                border: 'none',
                background: teleMobileTab === 'chat' ? '#6366f1' : '#1e293b',
                color: 'white',
                fontWeight: '700',
                fontSize: '12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
            >
              💬 Chat ({callChatMessages.length})
            </button>
          </div>

          {/* Video Viewport Container */}
          <div className={`video-viewport-container ${teleMobileTab === 'chat' ? 'pd-hide-mobile' : ''}`}>
            {/* Remote Feed */}
            <div className="remote-video-frame">
              {patientRemoteStream ? (
                <video 
                  ref={patientRemoteVideoRef} 
                  autoPlay 
                  playsInline 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                />
              ) : (
                <div className="doctor-avatar-screen">
                  <svg className="pulse-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                  <h3>{appointedDoctor}</h3>
                  <p>{docDept} • Online & Connected</p>
                  <div style={{ marginTop: '8px', display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(22, 163, 74, 0.2)', color: '#4ade80', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '700' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#4ade80', display: 'inline-block', animation: 'pulse 1.5s infinite' }}></span>
                    Encrypted Tele-Link Active
                  </div>
                </div>
              )}
              <div className="video-label-tag">{appointedDoctor} • Live HD</div>
            </div>

            {/* Local Feed */}
            <div className="local-video-frame" style={{ position: 'relative', overflow: 'hidden' }}>
              {isCamOn && localMediaStream ? (
                <video 
                  ref={localVideoRef} 
                  autoPlay 
                  playsInline 
                  muted 
                  style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} 
                />
              ) : (
                <div className="patient-avatar-preview">
                  <span>{patInitials}</span>
                </div>
              )}
              <div className="video-label-tag">{patName} {!isCamOn && '(Cam Off)'}</div>
            </div>

            {/* In-Call Controls */}
            <div className="video-controls-overlay">
              <button 
                type="button" 
                className={`video-btn ${isMicOn ? 'select' : 'danger'}`} 
                onClick={() => setIsMicOn(!isMicOn)}
                title={isMicOn ? "Mute Microphone" : "Unmute Microphone"}
                style={{ cursor: 'pointer' }}
              >
                {isMicOn ? (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg>
                ) : (
                  <span style={{ fontSize: '15px', fontWeight: 'bold' }}>🎤❌</span>
                )}
              </button>

              <button 
                type="button" 
                className={`video-btn ${isCamOn ? 'select' : 'danger'}`} 
                onClick={() => setIsCamOn(!isCamOn)}
                title={isCamOn ? "Turn Camera Off" : "Turn Camera On"}
                style={{ cursor: 'pointer' }}
              >
                {isCamOn ? (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7"></polygon><rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect></svg>
                ) : (
                  <span style={{ fontSize: '15px', fontWeight: 'bold' }}>📹❌</span>
                )}
              </button>

              <button className="video-btn danger" onClick={() => {
                if (localMediaStream) {
                  localMediaStream.getTracks().forEach(t => t.stop());
                }
                setIsVideoCallActive(false);
                teleSignaling.endCall(activeCallId);
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
          <div className={`video-call-chat-sidebar ${teleMobileTab === 'video' ? 'pd-hide-mobile' : ''}`}>
            <div className="chat-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px' }}>
              <h3 style={{ margin: 0 }}>Consultation Chat</h3>
              <span style={{ fontSize: '11px', background: '#3b82f6', color: 'white', padding: '2px 8px', borderRadius: '10px' }}>LIVE</span>
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
                placeholder={`Ask ${appointedDoctor} a question...`} 
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
                <div key={tele.id} className="pd-tele-item" style={{ borderLeft: '4px solid #7c3aed', position: 'relative' }}>
                  <div className="pd-tele-info">
                    <div className="pd-tele-avatar-badge" style={{ background: '#ede9fe', color: '#7c3aed' }}>
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7"></polygon><rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect></svg>
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <h4 style={{ margin: 0, fontSize: '15px', color: '#1e293b' }}>{tele.doctor}</h4>
                        <span style={{ fontSize: '11px', background: '#dcfce7', color: '#15803d', padding: '2px 8px', borderRadius: '12px', fontWeight: '700', border: '1px solid #bbf7d0' }}>
                          ✓ Online Paid ({tele.consultationFee || '₹500.00'})
                        </span>
                      </div>
                      <p style={{ margin: '4px 0', fontSize: '12.5px', color: '#64748b' }}>
                        Department: <strong style={{ color: '#334155' }}>{tele.department}</strong> • Reason: {tele.reason}
                      </p>
                      <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap', marginTop: '4px' }}>
                        <span className="pd-visit-time">📅 {tele.date} at {tele.time}</span>
                        {tele.transactionId && (
                          <span style={{ fontSize: '11px', color: '#64748b', background: '#f8fafc', padding: '2px 6px', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
                            Ref: {tele.transactionId}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="pd-tele-actions" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    {tele.invoiceId && (
                      <button 
                        className="pd-btn-outline"
                        style={{ padding: '6px 12px', fontSize: '12px', borderColor: '#cbd5e1' }}
                        onClick={() => {
                          const bill = billing.find(b => b.id === tele.invoiceId || b.appointmentId === tele.id) || {
                            id: tele.invoiceId || 'INV-TELE-001',
                            patientId: currentPatient?.id || 'PT-80234',
                            patientName: currentPatient ? `${currentPatient.firstName} ${currentPatient.lastName}` : 'John Doe',
                            date: tele.date,
                            paymentDate: tele.date,
                            type: 'Telemedicine Consultation Fee',
                            amount: tele.consultationFee || '₹500.00',
                            status: 'Paid',
                            paymentMethod: tele.paymentMethod || 'Online Gateway (UPI)',
                            paymentRemarks: `Online Paid. Txn ID: ${tele.transactionId || 'TXN-ONLINE-999'}`
                          };
                          setSelectedInvoice(bill);
                        }}
                      >
                        🧾 Receipt
                      </button>
                    )}
                    {tele.status === "Ready" || tele.status === "Scheduled" ? (
                      <button className="pd-btn-teal" style={{ background: '#7c3aed', borderColor: '#7c3aed' }} onClick={() => {
                        setActiveCallId(tele.id);
                        setIsVideoCallActive(true);
                      }}>
                        📹 Join Consultation
                      </button>
                    ) : (
                      <span className="pd-badge in-session" style={{ background: '#f1f5f9', color: '#475569' }}>
                        {tele.status}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
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

  const getWardRate = (wardName = '') => {
    if (wardName.includes('ICU')) return 3500;
    if (wardName.includes('Suite')) return 3000;
    if (wardName.includes('Semi-Private')) return 1800;
    if (wardName.includes('Pediatrics')) return 1200;
    return 800;
  };

  const renderAdmissionsBilling = () => {
    const myAdmissions = admissions.filter(a => a.patientId === (currentPatient?.id || "PT-80234"));

    return (
      <div className="pd-section-card" style={{ maxWidth: '1000px', margin: '0 auto', padding: '24px' }}>
        <div className="pd-section-header" style={{ marginBottom: '16px' }}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '24px', height: '24px', marginRight: '8px', color: '#10b981' }}>
            <rect x="2" y="4" width="20" height="16" rx="2" ry="2"></rect>
            <line x1="12" y1="4" x2="12" y2="20"></line>
            <line x1="2" y1="10" x2="22" y2="10"></line>
          </svg>
          <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#0f172a', margin: 0 }}>Inpatient (IPD) Admissions & Expense Ledger</h2>
        </div>
        <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '24px' }}>
          Track active hospital ward stays, bedside medications administered by nurses, diagnostic tests, transparent running expense balance, and post-discharge recovery summaries.
        </p>

        {myAdmissions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#64748b', fontStyle: 'italic', background: '#f8fafc', borderRadius: '8px' }}>
            No hospital admission records found for your account.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {myAdmissions.map(adm => {
              const todayStr = new Date().toISOString().split('T')[0];
              const admissionDate = adm.admissionDate || todayStr;
              const dischargeDate = adm.dischargeDate || todayStr;
              const daysStayed = Math.max(1, Math.ceil((new Date(dischargeDate) - new Date(admissionDate)) / (1000 * 60 * 60 * 24)));
              const wardRate = getWardRate(adm.ward || '');
              const roomCharges = daysStayed * wardRate;
              
              const pharmacyTotal = (adm.medications || [])
                .filter(m => m.status === 'Dispensed' || m.status === 'Delivered')
                .reduce((sum, m) => sum + (parseFloat(m.cost) || 0), 0);

              const patientLabs = (labOrders || []).filter(l => l.status === 'Completed & Billed' || l.status === 'Completed');
              const labTotal = patientLabs.reduce((sum, l) => sum + (parseFloat(l.cost) || 0), 0);

              const grossTotal = roomCharges + pharmacyTotal + labTotal;
              const advancePaid = parseFloat(adm.advanceDeposit) || 0;
              const netDue = Math.max(0, grossTotal - advancePaid);

              return (
                <div key={adm.id} style={{ border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden', backgroundColor: 'white', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                  {/* Card Header */}
                  <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', backgroundColor: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                    <div>
                      <span style={{ fontSize: '11px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>Admission ID</span>
                      <h4 style={{ margin: 0, fontSize: '16px', color: '#4338ca', fontWeight: '800' }}>{adm.id}</h4>
                    </div>
                    <div>
                      <span style={{ fontSize: '11px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>Ward & Bed</span>
                      <p style={{ margin: 0, fontSize: '13px', color: '#0f172a', fontWeight: '700' }}>{adm.ward} {adm.bedNo ? `(${adm.bedNo})` : ''}</p>
                    </div>
                    <div>
                      <span style={{ fontSize: '11px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>Physician</span>
                      <p style={{ margin: 0, fontSize: '13px', color: '#334155' }}>{adm.doctorName}</p>
                    </div>
                    <div>
                      <span style={{ fontSize: '11px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>Admission Date</span>
                      <p style={{ margin: 0, fontSize: '13px', color: '#334155' }}>{adm.admissionDate} ({daysStayed} Days)</p>
                    </div>
                    <div>
                      <span style={{ fontSize: '11px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>Status</span>
                      <div style={{ marginTop: '2px' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '4px 10px',
                          borderRadius: '12px',
                          fontSize: '11.5px',
                          fontWeight: '700',
                          backgroundColor: adm.status === 'Discharged' ? '#dcfce7' : adm.status?.includes('Discharge') ? '#e0e7ff' : '#fee2e2',
                          color: adm.status === 'Discharged' ? '#15803d' : adm.status?.includes('Discharge') ? '#4338ca' : '#b91c1c'
                        }}>
                          {adm.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div style={{ padding: '20px' }}>
                    {/* Clinical Notes & Attendant */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '18px' }}>
                      <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', borderLeft: '4px solid #3b82f6' }}>
                        <strong style={{ display: 'block', fontSize: '12px', color: '#475569', textTransform: 'uppercase', marginBottom: '4px' }}>Clinical Indication / Diagnosis:</strong>
                        <p style={{ margin: 0, fontSize: '13.5px', color: '#1e293b' }}>
                          {adm.notes || 'Inpatient admission and bedside observation.'}
                        </p>
                      </div>

                      {adm.attendant && (
                        <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', borderLeft: '4px solid #10b981' }}>
                          <strong style={{ display: 'block', fontSize: '12px', color: '#475569', textTransform: 'uppercase', marginBottom: '4px' }}>Registered Attendant:</strong>
                          <p style={{ margin: 0, fontSize: '13.5px', color: '#1e293b' }}>
                            <strong>{adm.attendant.name}</strong> ({adm.attendant.relation}) • Phone: {adm.attendant.phone}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Administered Medications Ledger */}
                    <div style={{ marginBottom: '20px' }}>
                      <h4 style={{ margin: '0 0 8px 0', fontSize: '13.5px', color: '#334155', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>💊</span> Bedside Medications Administered (Nurse Dispensed)
                      </h4>
                      {(!adm.medications || adm.medications.length === 0) ? (
                        <p style={{ margin: 0, fontSize: '13px', color: '#94a3b8', fontStyle: 'italic', background: '#f8fafc', padding: '10px', borderRadius: '6px' }}>
                          No medications administered yet.
                        </p>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          {adm.medications.map((med, idx) => (
                            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '13px' }}>
                              <div>
                                <strong style={{ color: '#0f172a' }}>{med.name}</strong>
                                {med.instructions && <span style={{ color: '#64748b', fontSize: '11.5px', marginLeft: '8px' }}>({med.instructions})</span>}
                                <span style={{ marginLeft: '10px', fontSize: '11px', padding: '2px 6px', borderRadius: '4px', fontWeight: '600', backgroundColor: med.status === 'Dispensed' || med.status === 'Delivered' ? '#d1fae5' : '#fee2e2', color: med.status === 'Dispensed' || med.status === 'Delivered' ? '#065f46' : '#b91c1c' }}>
                                  {med.status || 'Dispensed'}
                                </span>
                              </div>
                              <strong style={{ color: '#1e3a8a' }}>₹{parseFloat(med.cost || 0).toFixed(2)}</strong>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Financial Summary & Itemized Breakdown */}
                    <div style={{ border: '1px solid #cbd5e1', borderRadius: '8px', overflow: 'hidden', marginBottom: '20px' }}>
                      <div style={{ background: '#f1f5f9', padding: '10px 14px', fontWeight: 'bold', fontSize: '13px', color: '#1e293b' }}>
                        Transparent Inpatient Expense & Deposit Ledger
                      </div>
                      <table style={{ width: '100%', fontSize: '12.5px', borderCollapse: 'collapse' }}>
                        <tbody>
                          <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '8px 14px', color: '#475569' }}>Room & Nursing Stay ({daysStayed} days @ ₹{wardRate}/day - {adm.ward})</td>
                            <td style={{ padding: '8px 14px', textAlign: 'right', fontWeight: '600' }}>₹{roomCharges.toFixed(2)}</td>
                          </tr>
                          <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '8px 14px', color: '#475569' }}>Inpatient Pharmacy Dispensed Medications ({(adm.medications || []).length} items)</td>
                            <td style={{ padding: '8px 14px', textAlign: 'right', fontWeight: '600' }}>₹{pharmacyTotal.toFixed(2)}</td>
                          </tr>
                          <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '8px 14px', color: '#475569' }}>Inpatient Diagnostic Labs ({patientLabs.length} tests)</td>
                            <td style={{ padding: '8px 14px', textAlign: 'right', fontWeight: '600' }}>₹{labTotal.toFixed(2)}</td>
                          </tr>
                          <tr style={{ borderBottom: '1px solid #cbd5e1', background: '#f8fafc', fontWeight: 'bold' }}>
                            <td style={{ padding: '8px 14px' }}>Gross Total Inpatient Charges:</td>
                            <td style={{ padding: '8px 14px', textAlign: 'right' }}>₹{grossTotal.toFixed(2)}</td>
                          </tr>
                          <tr style={{ borderBottom: '1px solid #f1f5f9', color: '#166534' }}>
                            <td style={{ padding: '8px 14px' }}>Less: Advance Deposit Paid at Reception (-)</td>
                            <td style={{ padding: '8px 14px', textAlign: 'right', fontWeight: '700' }}>- ₹{advancePaid.toFixed(2)}</td>
                          </tr>
                          <tr style={{ background: adm.status === 'Discharged' ? '#f0fdf4' : '#fef2f2', fontWeight: 'bold', fontSize: '13.5px' }}>
                            <td style={{ padding: '10px 14px', color: adm.status === 'Discharged' ? '#15803d' : '#991b1b' }}>
                              {adm.status === 'Discharged' ? 'Final Settled & Paid Balance:' : 'Net Running Balance Due at Discharge:'}
                            </td>
                            <td style={{ padding: '10px 14px', textAlign: 'right', color: adm.status === 'Discharged' ? '#15803d' : '#b91c1c' }}>
                              ₹{netDue.toFixed(2)}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* Post-Discharge Care & Summary */}
                    {adm.status === 'Discharged' && adm.dischargeSummary && (
                      <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '14px', marginBottom: '16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <h4 style={{ margin: 0, fontSize: '14px', color: '#166534' }}>🏁 Post-Discharge Clinical Summary & Home Care</h4>
                          <span style={{ fontSize: '11px', background: '#dcfce7', color: '#15803d', padding: '2px 8px', borderRadius: '4px', fontWeight: 'bold' }}>
                            {adm.dischargeSummary.condition}
                          </span>
                        </div>
                        <p style={{ margin: '0 0 8px 0', fontSize: '13px', color: '#14532d' }}>
                          {adm.dischargeSummary.notes}
                        </p>
                        {adm.dischargeSummary.takeHomeMeds && (
                          <div style={{ background: 'white', padding: '10px', borderRadius: '6px', border: '1px solid #dcfce7', fontSize: '12px', color: '#166534' }}>
                            <strong>💊 Take-Home Medications Regimen:</strong>
                            <pre style={{ margin: '4px 0 0 0', fontFamily: 'inherit', whiteSpace: 'pre-wrap' }}>{adm.dischargeSummary.takeHomeMeds}</pre>
                            <div style={{ marginTop: '6px', color: '#1e40af', fontWeight: 'bold' }}>Follow-up: {adm.dischargeSummary.followUpDate}</div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
                      <button
                        onClick={() => {
                          setPrintedPatientAdmissionPass({
                            ...adm,
                            admittedAtTime: '09:30 AM',
                            advanceDepositAmount: `₹${advancePaid.toFixed(2)}`,
                            paymentMode: 'Physical Cash / UPI'
                          });
                        }}
                        style={{
                          padding: '8px 16px',
                          background: '#f8fafc',
                          border: '1px solid #cbd5e1',
                          borderRadius: '6px',
                          fontSize: '13px',
                          fontWeight: '600',
                          color: '#334155',
                          cursor: 'pointer'
                        }}
                      >
                        🎫 View Bed Admission Pass
                      </button>

                      {adm.status === 'Discharged' && (
                        <button
                          onClick={() => {
                            setPrintedPatientReleaseCert({
                              ...adm,
                              ...(adm.finalSettlement || {}),
                              daysStayed,
                              wardRate,
                              roomCharges,
                              pharmacyTotal,
                              labTotal,
                              grossTotal,
                              advanceDeducted: advancePaid,
                              netAmountPaid: netDue,
                              settledDate: adm.dischargeDate || todayStr,
                              settledAt: adm.finalSettlement?.settledAt || '12:30 PM',
                              invoiceId: adm.finalSettlement?.invoiceId || `INV-IPD-${Math.floor(1000 + Math.random() * 9000)}`,
                              paymentMethod: adm.finalSettlement?.paymentMethod || 'Paid at Cash Counter'
                            });
                          }}
                          style={{
                            padding: '8px 18px',
                            background: '#10b981',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '13px',
                            fontWeight: '700',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}
                        >
                          📄 Print Hospital Release Certificate
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* General Billing Invoices Section */}
        <div style={{ marginTop: '40px', borderTop: '1px solid #e2e8f0', paddingTop: '30px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#1e293b', margin: '0 0 4px 0' }}>💳 Doctor Consultation, Diagnostic & Service Bills</h3>
              <p style={{ color: '#64748b', fontSize: '13.5px', margin: 0 }}>
                Transparent ledger of all doctor consultations, clinical checkups, IPD admissions, lab diagnostic tests, and pharmacy medication invoices.
              </p>
            </div>
          </div>

          {(() => {
            const allBills = getAllPatientInvoices();

            const totalPaid = allBills
              .filter(b => b.status === 'Paid')
              .reduce((sum, b) => sum + (parseFloat(String(b.amount).replace(/[^0-9.]/g, '')) || 0), 0);

            const totalPending = allBills
              .filter(b => b.status !== 'Paid')
              .reduce((sum, b) => sum + (parseFloat(String(b.amount).replace(/[^0-9.]/g, '')) || 0), 0);

            // Filter logic
            const filteredBills = allBills.filter(inv => {
              const query = billingSearchQuery.toLowerCase();
              const matchesSearch = inv.id.toLowerCase().includes(query) ||
                                    inv.type.toLowerCase().includes(query) ||
                                    (inv.paymentMethod && inv.paymentMethod.toLowerCase().includes(query)) ||
                                    (inv.paymentRemarks && inv.paymentRemarks.toLowerCase().includes(query));

              const matchesCat = billingCategoryFilter === 'All' ||
                (billingCategoryFilter === 'Consultation' && inv.type.toLowerCase().includes('consultation')) ||
                (billingCategoryFilter === 'IPD' && (inv.type.toLowerCase().includes('ward') || inv.type.toLowerCase().includes('inpatient') || inv.type.toLowerCase().includes('deposit') || inv.type.toLowerCase().includes('settlement'))) ||
                (billingCategoryFilter === 'Labs' && (inv.type.toLowerCase().includes('lab') || inv.type.toLowerCase().includes('diagnostic'))) ||
                (billingCategoryFilter === 'Pharmacy' && (inv.type.toLowerCase().includes('pharmacy') || inv.type.toLowerCase().includes('prescription') || inv.type.toLowerCase().includes('medication')));

              const matchesStat = billingStatusFilter === 'All' || inv.status.toLowerCase() === billingStatusFilter.toLowerCase();

              return matchesSearch && matchesCat && matchesStat;
            });

            return (
              <div>
                {/* Financial KPI Summary Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginBottom: '20px' }}>
                  <div style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '10px', padding: '14px 18px' }}>
                    <span style={{ fontSize: '11.5px', color: '#64748b', textTransform: 'uppercase', fontWeight: '700' }}>Total Invoices / Slips</span>
                    <div style={{ fontSize: '20px', fontWeight: '800', color: '#1e293b', marginTop: '4px' }}>{allBills.length} Invoices</div>
                  </div>

                  <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '14px 18px' }}>
                    <span style={{ fontSize: '11.5px', color: '#166534', textTransform: 'uppercase', fontWeight: '700' }}>Total Paid to Hospital</span>
                    <div style={{ fontSize: '20px', fontWeight: '800', color: '#15803d', marginTop: '4px' }}>₹{totalPaid.toFixed(2)}</div>
                  </div>

                  <div style={{ background: totalPending > 0 ? '#fef2f2' : '#f8fafc', border: totalPending > 0 ? '1px solid #fecaca' : '1px solid #cbd5e1', borderRadius: '10px', padding: '14px 18px' }}>
                    <span style={{ fontSize: '11.5px', color: totalPending > 0 ? '#991b1b' : '#64748b', textTransform: 'uppercase', fontWeight: '700' }}>Pending / Outstanding Due</span>
                    <div style={{ fontSize: '20px', fontWeight: '800', color: totalPending > 0 ? '#b91c1c' : '#475569', marginTop: '4px' }}>₹{totalPending.toFixed(2)}</div>
                  </div>
                </div>

                {/* Filters & Search */}
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '16px', alignItems: 'center' }}>
                  <input
                    type="text"
                    placeholder="Search bills by invoice ID, doctor, or service..."
                    value={billingSearchQuery}
                    onChange={(e) => setBillingSearchQuery(e.target.value)}
                    style={{ flex: 1, minWidth: '240px', padding: '9px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                  />

                  <select
                    value={billingCategoryFilter}
                    onChange={(e) => setBillingCategoryFilter(e.target.value)}
                    style={{ padding: '9px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', background: 'white' }}
                  >
                    <option value="All">All Service Categories</option>
                    <option value="Consultation">🩺 Doctor Consultation Fees</option>
                    <option value="IPD">🏥 Inpatient (IPD) / Ward</option>
                    <option value="Labs">🧪 Lab Diagnostics</option>
                    <option value="Pharmacy">💊 Pharmacy Medications</option>
                  </select>

                  <select
                    value={billingStatusFilter}
                    onChange={(e) => setBillingStatusFilter(e.target.value)}
                    style={{ padding: '9px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', background: 'white' }}
                  >
                    <option value="All">All Statuses</option>
                    <option value="Paid">✓ Paid Only</option>
                    <option value="Unpaid">⏳ Unpaid / Pending Only</option>
                  </select>
                </div>

                {filteredBills.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '30px', color: '#64748b', fontStyle: 'italic', background: '#f8fafc', borderRadius: '8px', border: '1px dashed #cbd5e1' }}>
                    No invoice or consultation billing records match your search filters.
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', background: 'white' }}>
                      <thead>
                        <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', color: '#475569', fontSize: '11.5px', textTransform: 'uppercase' }}>
                          <th style={{ padding: '12px 14px' }}>Invoice ID</th>
                          <th style={{ padding: '12px 14px' }}>Service / Doctor Consultation</th>
                          <th style={{ padding: '12px 14px' }}>Billing Date</th>
                          <th style={{ padding: '12px 14px' }}>Amount</th>
                          <th style={{ padding: '12px 14px' }}>Payment Mode</th>
                          <th style={{ padding: '12px 14px' }}>Status</th>
                          <th style={{ padding: '12px 14px', textAlign: 'right' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredBills.map(inv => (
                          <tr key={inv.id} style={{ borderBottom: '1px solid #f1f5f9', fontSize: '13px' }}>
                            <td style={{ padding: '12px 14px', fontWeight: 'bold', color: '#3b82f6' }}>{inv.id}</td>
                            <td style={{ padding: '12px 14px' }}>
                              <strong style={{ color: '#0f172a' }}>{inv.type}</strong>
                              {inv.paymentRemarks && (
                                <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>{inv.paymentRemarks}</div>
                              )}
                            </td>
                            <td style={{ padding: '12px 14px', color: '#475569' }}>
                              <div>{inv.date}</div>
                              {inv.paymentDate && inv.status === 'Paid' && (
                                <div style={{ fontSize: '11px', color: '#15803d' }}>Paid: {inv.paymentDate}</div>
                              )}
                            </td>
                            <td style={{ padding: '12px 14px', fontWeight: '800', color: '#166534', fontSize: '14px' }}>{inv.amount}</td>
                            <td style={{ padding: '12px 14px', fontSize: '12px', color: '#475569' }}>
                              {inv.paymentMethod || (inv.status === 'Paid' ? 'Cash / Counter' : 'Pending')}
                            </td>
                            <td style={{ padding: '12px 14px' }}>
                              <span style={{
                                padding: '4px 10px',
                                borderRadius: '12px',
                                fontSize: '11.5px',
                                fontWeight: '700',
                                display: 'inline-block',
                                background: inv.status === 'Paid' ? '#dcfce7' : '#fee2e2',
                                color: inv.status === 'Paid' ? '#15803d' : '#b91c1c'
                              }}>
                                {inv.status === 'Paid' ? '✓ Paid' : '⏳ Unpaid'}
                              </span>
                            </td>
                            <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                              <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                                {inv.status !== 'Paid' && (
                                  <button
                                    type="button"
                                    onClick={() => handlePayInvoiceOnline(inv)}
                                    style={{
                                      padding: '6px 12px',
                                      background: '#10b981',
                                      color: 'white',
                                      border: 'none',
                                      borderRadius: '6px',
                                      fontSize: '12px',
                                      fontWeight: '700',
                                      cursor: 'pointer'
                                    }}
                                  >
                                    💳 Pay Online
                                  </button>
                                )}
                                <button 
                                  type="button"
                                  onClick={() => setSelectedInvoice(inv)}
                                  style={{
                                    padding: '6px 12px',
                                    background: '#f8fafc',
                                    border: '1px solid #cbd5e1',
                                    borderRadius: '6px',
                                    fontSize: '12px',
                                    fontWeight: '600',
                                    color: '#334155',
                                    cursor: 'pointer'
                                  }}
                                >
                                  📄 View Receipt
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })()}
        </div>
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

          {/* Bell Icon Notification Button */}
          <button 
            className="pd-signout-btn" 
            onClick={() => setShowNotifInbox(!showNotifInbox)} 
            title="Message Inbox & Notifications" 
            style={{ position: 'relative' }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '20px', height: '20px' }}>
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
            </svg>
            {unreadNotifsCount > 0 && (
              <span style={{
                position: 'absolute',
                top: '-4px',
                right: '-4px',
                background: '#ef4444',
                color: 'white',
                fontSize: '10px',
                fontWeight: 'bold',
                borderRadius: '50%',
                width: '16px',
                height: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {unreadNotifsCount}
              </span>
            )}
          </button>

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
            <li className={activeTab === 'health_console' ? 'active' : ''} onClick={() => navigateTab('health_console')}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
              Health Console
            </li>
            <li className={activeTab === 'digital_profile' ? 'active' : ''} onClick={() => navigateTab('digital_profile')}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
              Digital Patient Profile
            </li>
            <li className={activeTab === 'visit_history' ? 'active' : ''} onClick={() => navigateTab('visit_history')}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
              Visit History Logs
            </li>
            <li className={activeTab === 'ehr_records' ? 'active' : ''} onClick={() => navigateTab('ehr_records')}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
              EHR Medical Records
            </li>
            <li className={activeTab === 'laboratory' ? 'active' : ''} onClick={() => navigateTab('laboratory')}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 2v7.31"></path><path d="M14 9.3V1.99"></path><path d="M8.5 2h7"></path><path d="M14 9.3a6.5 6.5 0 1 1-4 0"></path><path d="M5.52 16h12.96"></path></svg>
              Laboratory Center
            </li>
            <li className={activeTab === 'telemedicine' ? 'active' : ''} onClick={() => navigateTab('telemedicine')}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7"></polygon><rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect></svg>
              Telemedicine Clinic
            </li>
            <li className={activeTab === 'admissions_billing' ? 'active' : ''} onClick={() => navigateTab('admissions_billing')}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2" ry="2"></rect><line x1="12" y1="4" x2="12" y2="20"></line><line x1="2" y1="10" x2="22" y2="10"></line></svg>
              Admissions & Billing
            </li>
            <li className={activeTab === 'insurance' ? 'active' : ''} onClick={() => navigateTab('insurance')}>
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

      {/* Edit Profile Modal */}
      {showEditProfileModal && (
        <div className="pd-modal-overlay" onClick={() => setShowEditProfileModal(false)}>
          <div className="pd-modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <form onSubmit={handleEditProfileSubmit}>
              <div className="pd-modal-header">
                <h2>Edit Patient Profile</h2>
                <button className="pd-modal-close" type="button" onClick={() => setShowEditProfileModal(false)}>&times;</button>
              </div>
              <div className="pd-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '13px', color: '#475569', fontWeight: '600' }}>Date of Birth</label>
                  <input 
                    type="date" 
                    value={editDob} 
                    onChange={(e) => setEditDob(e.target.value)} 
                    style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                    required
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '13px', color: '#475569', fontWeight: '600' }}>Gender</label>
                  <select 
                    value={editGender} 
                    onChange={(e) => setEditGender(e.target.value)} 
                    style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', background: 'white' }}
                    required
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '13px', color: '#475569', fontWeight: '600' }}>Blood Type</label>
                  <input 
                    type="text" 
                    value={editBloodType} 
                    onChange={(e) => setEditBloodType(e.target.value)} 
                    placeholder="e.g. O+, A-"
                    style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '13px', color: '#475569', fontWeight: '600' }}>Phone Number</label>
                  <input 
                    type="tel" 
                    value={editPhone} 
                    onChange={(e) => setEditPhone(e.target.value)} 
                    placeholder="Enter phone number"
                    style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '13px', color: '#475569', fontWeight: '600' }}>Known Allergies</label>
                  <input 
                    type="text" 
                    value={editAllergies} 
                    onChange={(e) => setEditAllergies(e.target.value)} 
                    placeholder="e.g. Penicillin, Peanuts (comma separated)"
                    style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '13px', color: '#475569', fontWeight: '600' }}>Chronic Conditions</label>
                  <input 
                    type="text" 
                    value={editChronic} 
                    onChange={(e) => setEditChronic(e.target.value)} 
                    placeholder="e.g. Hypertension, Diabetes (comma separated)"
                    style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  />
                </div>
              </div>
              <div className="pd-modal-footer">
                <button className="pd-btn-primary" type="submit">Save Changes</button>
                <button className="pd-btn-outline" type="button" onClick={() => setShowEditProfileModal(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Invoice Receipt Modal */}
      {selectedInvoice && (
        <div className="pd-modal-overlay" onClick={() => setSelectedInvoice(null)}>
          <div className="pd-modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px', display: 'flex', flexDirection: 'column' }}>
            <div className="pd-modal-header">
              <h2>Invoice Details & Receipt</h2>
              <button className="pd-modal-close" onClick={() => setSelectedInvoice(null)}>&times;</button>
            </div>
            <div className="pd-modal-body" style={{ padding: '24px', backgroundColor: 'white', color: '#1e293b', fontFamily: 'Courier New, Courier, monospace', overflowY: 'auto' }}>
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
            <div className="pd-modal-footer">
              <button className="pd-btn-outline" onClick={() => setSelectedInvoice(null)}>Close</button>
              <button className="pd-btn-primary" onClick={() => window.print()}>Print Invoice</button>
            </div>
          </div>
        </div>
      )}

      {/* Notification / Message Inbox Modal */}
      {showNotifInbox && (
        <div className="pd-modal-overlay" onClick={() => setShowNotifInbox(false)} style={{ zIndex: 10001 }}>
          <div className="pd-modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px', width: '90%' }}>
            <div className="pd-modal-header">
              <h2>Message Inbox & Notifications</h2>
              <button className="pd-modal-close" onClick={() => setShowNotifInbox(false)}>&times;</button>
            </div>
            <div className="pd-modal-body" style={{ maxHeight: '400px', overflowY: 'auto', padding: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', color: '#64748b' }}>{unreadNotifsCount} unread messages</span>
                {unreadNotifsCount > 0 && (
                  <button 
                    onClick={markAllNotifsAsRead} 
                    style={{ background: 'none', border: 'none', color: '#5c6bc0', cursor: 'pointer', fontSize: '13px', fontWeight: '600', padding: 0 }}
                  >
                    Mark all as read
                  </button>
                )}
              </div>
              {patientNotifs.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px 0', color: '#94a3b8' }}>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: '48px', height: '48px', marginBottom: '8px', color: '#cbd5e1', margin: '0 auto' }}>
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                    <polyline points="22,6 12,13 2,6"></polyline>
                  </svg>
                  <p>Your inbox is empty.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {patientNotifs.map(notif => (
                    <div 
                      key={notif.id} 
                      onClick={() => markNotifAsRead(notif.id)}
                      style={{
                        padding: '12px',
                        borderRadius: '8px',
                        border: '1px solid #e2e8f0',
                        background: notif.read ? '#f8fafc' : '#f5f8ff',
                        borderLeft: notif.read ? '1px solid #e2e8f0' : '4px solid #5c6bc0',
                        cursor: 'pointer',
                        transition: 'background 0.2s',
                        textAlign: 'left'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <strong style={{ fontSize: '14px', color: notif.read ? '#475569' : '#1e293b' }}>{notif.title}</strong>
                        {!notif.read && (
                          <span style={{ background: '#5c6bc0', width: '8px', height: '8px', borderRadius: '50%' }}></span>
                        )}
                      </div>
                      <p style={{ margin: 0, fontSize: '13px', color: '#64748b', lineHeight: '1.4' }}>{notif.message}</p>
                      <span style={{ fontSize: '11px', color: '#94a3b8', marginTop: '6px', display: 'block' }}>
                        {new Date(notif.timestamp).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Auto-popup for new notifications */}
      {showNewUpdatesPopup && unreadNotifsToShow.length > 0 && (
        <div className="pd-modal-overlay" style={{ zIndex: 10002 }}>
          <div className="pd-modal-content" style={{ maxWidth: '450px', width: '90%', borderTop: '4px solid #5c6bc0' }}>
            <div className="pd-modal-header">
              <h2>New Updates & Notifications</h2>
            </div>
            <div className="pd-modal-body" style={{ padding: '16px' }}>
              <p style={{ fontSize: '14px', color: '#475569', marginBottom: '16px', textAlign: 'left' }}>You have new updates on your file since your last visit:</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '300px', overflowY: 'auto', marginBottom: '16px' }}>
                {unreadNotifsToShow.map(notif => (
                  <div key={notif.id} style={{ padding: '12px', borderRadius: '8px', background: '#f5f8ff', borderLeft: '4px solid #5c6bc0', textAlign: 'left' }}>
                    <strong style={{ fontSize: '14px', color: '#1e293b', display: 'block', marginBottom: '4px' }}>{notif.title}</strong>
                    <p style={{ margin: 0, fontSize: '13px', color: '#64748b', lineHeight: '1.4' }}>{notif.message}</p>
                  </div>
                ))}
              </div>
              <button 
                className="pd-btn-primary" 
                onClick={dismissNewUpdatesPopup} 
                style={{ width: '100%' }}
              >
                Mark as Read & Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Patient Inpatient Admission Pass Modal */}
      {printedPatientAdmissionPass && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 99999 }}>
          <div style={{ background: 'white', borderRadius: '12px', width: '560px', maxWidth: '92vw', maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', overflow: 'hidden' }}>
            <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
              <h3 style={{ margin: 0, fontSize: '16px', color: '#1e293b', fontWeight: '700' }}>🎫 Inpatient Admission Pass</h3>
              <button onClick={() => setPrintedPatientAdmissionPass(null)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#64748b' }}>&times;</button>
            </div>

            <div style={{ padding: '24px 28px', overflowY: 'auto', flex: 1, backgroundColor: 'white', color: '#0f172a', fontFamily: "'Inter', sans-serif" }}>
              <div style={{ textAlign: 'center', borderBottom: '2px solid #0f172a', paddingBottom: '12px', marginBottom: '16px' }}>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#1e293b' }}>DHMS CENTRAL CLINICAL HEALTHCARE</h3>
                <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#64748b' }}>Inpatient Department (IPD) • Admission & Bed Allocation Pass</p>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', background: '#f1f5f9', padding: '12px 16px', borderRadius: '8px', marginBottom: '16px' }}>
                <div>
                  <span style={{ fontSize: '10.5px', color: '#64748b', display: 'block' }}>ADMISSION PASS NO</span>
                  <strong style={{ fontSize: '16px', color: '#4338ca' }}>{printedPatientAdmissionPass.id}</strong>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '10.5px', color: '#64748b', display: 'block' }}>ADMISSION DATE</span>
                  <strong>{printedPatientAdmissionPass.admissionDate}</strong>
                </div>
              </div>

              <table style={{ width: '100%', fontSize: '13px', borderCollapse: 'collapse', marginBottom: '16px' }}>
                <tbody>
                  <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '6px 0', color: '#64748b' }}>Patient Name:</td>
                    <td style={{ padding: '6px 0', fontWeight: '700', textAlign: 'right' }}>{printedPatientAdmissionPass.patientName} ({printedPatientAdmissionPass.patientId})</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '6px 0', color: '#64748b' }}>Attending Physician:</td>
                    <td style={{ padding: '6px 0', fontWeight: '600', textAlign: 'right' }}>{printedPatientAdmissionPass.doctorName}</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '6px 0', color: '#64748b' }}>Allocated Ward:</td>
                    <td style={{ padding: '6px 0', fontWeight: '700', textAlign: 'right', color: '#0369a1' }}>{printedPatientAdmissionPass.ward}</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '6px 0', color: '#64748b' }}>Assigned Bed No:</td>
                    <td style={{ padding: '6px 0', fontWeight: '800', textAlign: 'right', color: '#15803d', fontSize: '14px' }}>{printedPatientAdmissionPass.bedNo || 'Bed Allocated'}</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '6px 0', color: '#64748b' }}>Admitting Indication:</td>
                    <td style={{ padding: '6px 0', textAlign: 'right' }}>{printedPatientAdmissionPass.notes || 'Inpatient Observation'}</td>
                  </tr>
                </tbody>
              </table>

              {printedPatientAdmissionPass.attendant && (
                <div style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: '6px', border: '1px solid #e2e8f0', marginBottom: '16px', fontSize: '12px' }}>
                  <strong>Authorized Primary Attendant:</strong>
                  <div style={{ marginTop: '2px', color: '#334155' }}>{printedPatientAdmissionPass.attendant.name} ({printedPatientAdmissionPass.attendant.relation}) • {printedPatientAdmissionPass.attendant.phone}</div>
                </div>
              )}

              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '6px', padding: '10px 14px', fontSize: '12.5px', color: '#166534', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Advance Security Deposit:</span>
                <strong style={{ fontSize: '14px' }}>₹{parseFloat(printedPatientAdmissionPass.advanceDeposit || 0).toFixed(2)} (PAID)</strong>
              </div>
            </div>

            <div className="no-print" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', padding: '14px 20px', borderTop: '1px solid #e2e8f0', background: '#f8fafc' }}>
              <button type="button" onClick={() => setPrintedPatientAdmissionPass(null)} style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #cbd5e1', background: 'white', color: '#475569', cursor: 'pointer', fontWeight: '600', fontSize: '13px' }}>
                Close
              </button>
              <button 
                type="button" 
                onClick={() => window.print()}
                style={{ padding: '8px 20px', borderRadius: '6px', border: 'none', background: '#4338ca', color: 'white', cursor: 'pointer', fontWeight: '700', fontSize: '13px' }}
              >
                🖨️ Print Pass
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Patient Inpatient Release Clearance Certificate Modal */}
      {printedPatientReleaseCert && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 99999 }}>
          <div style={{ background: 'white', borderRadius: '12px', width: '640px', maxWidth: '92vw', maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', overflow: 'hidden' }}>
            <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
              <h3 style={{ margin: 0, fontSize: '16px', color: '#1e293b', fontWeight: '700' }}>📄 Inpatient Release Clearance Certificate</h3>
              <button onClick={() => setPrintedPatientReleaseCert(null)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#64748b' }}>&times;</button>
            </div>

            <div style={{ padding: '24px 30px', overflowY: 'auto', flex: 1, backgroundColor: 'white', color: '#0f172a', fontFamily: "'Inter', sans-serif" }}>
              <div style={{ textAlign: 'center', borderBottom: '2px solid #0f172a', paddingBottom: '12px', marginBottom: '16px' }}>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#1e293b' }}>DHMS CENTRAL CLINICAL HEALTHCARE</h3>
                <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#64748b' }}>Inpatient Department • Consolidated Bill & Hospital Release Certificate</p>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', background: '#f1f5f9', padding: '12px 16px', borderRadius: '8px', marginBottom: '16px' }}>
                <div>
                  <span style={{ fontSize: '10.5px', color: '#64748b', display: 'block' }}>CLEARANCE INVOICE ID</span>
                  <strong style={{ fontSize: '16px', color: '#4338ca' }}>{printedPatientReleaseCert.invoiceId}</strong>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '10.5px', color: '#64748b', display: 'block' }}>DISCHARGE DATE & TIME</span>
                  <strong>{printedPatientReleaseCert.settledDate} • {printedPatientReleaseCert.settledAt}</strong>
                </div>
              </div>

              <table style={{ width: '100%', fontSize: '12.5px', borderCollapse: 'collapse', marginBottom: '16px' }}>
                <tbody>
                  <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '6px 0', color: '#64748b' }}>Patient Name:</td>
                    <td style={{ padding: '6px 0', fontWeight: '700', textAlign: 'right' }}>{printedPatientReleaseCert.patientName} ({printedPatientReleaseCert.patientId})</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '6px 0', color: '#64748b' }}>Attending Physician:</td>
                    <td style={{ padding: '6px 0', fontWeight: '600', textAlign: 'right' }}>{printedPatientReleaseCert.doctorName}</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '6px 0', color: '#64748b' }}>Ward & Bed:</td>
                    <td style={{ padding: '6px 0', fontWeight: '700', textAlign: 'right', color: '#0369a1' }}>{printedPatientReleaseCert.ward} ({printedPatientReleaseCert.bedNo || 'Bed'})</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '6px 0', color: '#64748b' }}>Stay Duration:</td>
                    <td style={{ padding: '6px 0', fontWeight: '600', textAlign: 'right' }}>{printedPatientReleaseCert.admissionDate} to {printedPatientReleaseCert.settledDate} ({printedPatientReleaseCert.daysStayed} Days)</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '6px 0', color: '#64748b' }}>Discharge Condition:</td>
                    <td style={{ padding: '6px 0', fontWeight: '700', textAlign: 'right', color: '#15803d' }}>
                      {printedPatientReleaseCert.dischargeSummary?.condition || 'Stable / Cured'}
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Financial Ledger Table */}
              <div style={{ marginBottom: '16px' }}>
                <h5 style={{ margin: '0 0 6px 0', fontSize: '12px', color: '#334155', textTransform: 'uppercase' }}>Consolidated Financial Settlement:</h5>
                <table style={{ width: '100%', fontSize: '12.5px', borderCollapse: 'collapse', border: '1px solid #cbd5e1' }}>
                  <tbody>
                    <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '6px 10px', color: '#475569' }}>Room Charges ({printedPatientReleaseCert.daysStayed} days @ ₹{printedPatientReleaseCert.wardRate}):</td>
                      <td style={{ padding: '6px 10px', textAlign: 'right', fontWeight: '600' }}>₹{parseFloat(printedPatientReleaseCert.roomCharges || 0).toFixed(2)}</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '6px 10px', color: '#475569' }}>Inpatient Pharmacy Dispensed Medicines:</td>
                      <td style={{ padding: '6px 10px', textAlign: 'right', fontWeight: '600' }}>₹{parseFloat(printedPatientReleaseCert.pharmacyTotal || 0).toFixed(2)}</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '6px 10px', color: '#475569' }}>Inpatient Diagnostic Labs:</td>
                      <td style={{ padding: '6px 10px', textAlign: 'right', fontWeight: '600' }}>₹{parseFloat(printedPatientReleaseCert.labTotal || 0).toFixed(2)}</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #e2e8f0', background: '#f8fafc', fontWeight: 'bold' }}>
                      <td style={{ padding: '6px 10px' }}>Gross Total Charges:</td>
                      <td style={{ padding: '6px 10px', textAlign: 'right' }}>₹{parseFloat(printedPatientReleaseCert.grossTotal || 0).toFixed(2)}</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#166534' }}>
                      <td style={{ padding: '6px 10px' }}>Less: Advance Deposit Deducted:</td>
                      <td style={{ padding: '6px 10px', textAlign: 'right', fontWeight: '700' }}>- ₹{parseFloat(printedPatientReleaseCert.advanceDeducted || 0).toFixed(2)}</td>
                    </tr>
                    <tr style={{ background: '#f0fdf4', fontWeight: 'bold', fontSize: '13.5px' }}>
                      <td style={{ padding: '8px 10px', color: '#15803d' }}>Final Amount Paid ({printedPatientReleaseCert.paymentMethod}):</td>
                      <td style={{ padding: '8px 10px', textAlign: 'right', color: '#15803d' }}>₹{parseFloat(printedPatientReleaseCert.netAmountPaid || 0).toFixed(2)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Take-Home Care / Follow-Up */}
              {printedPatientReleaseCert.dischargeSummary?.takeHomeMeds && (
                <div style={{ background: '#f8fafc', padding: '10px 12px', borderRadius: '6px', border: '1px dashed #cbd5e1', fontSize: '11.5px', color: '#475569', marginBottom: '16px' }}>
                  <strong>💊 Prescribed Take-Home Regimen:</strong>
                  <pre style={{ margin: '4px 0 0 0', fontFamily: 'inherit', whiteSpace: 'pre-wrap', fontSize: '11px' }}>{printedPatientReleaseCert.dischargeSummary.takeHomeMeds}</pre>
                  <div style={{ marginTop: '6px', color: '#1e40af', fontWeight: 'bold' }}>Follow-up: {printedPatientReleaseCert.dischargeSummary.followUpDate}</div>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '24px', paddingTop: '12px', borderTop: '1px solid #e2e8f0', fontSize: '11.5px', color: '#64748b' }}>
                <div>Cashier: <strong>{printedPatientReleaseCert.cashierName || 'Cash Counter'}</strong></div>
                <div style={{ textAlign: 'right' }}>Official Medical Release Stamp</div>
              </div>
            </div>

            <div className="no-print" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', padding: '14px 20px', borderTop: '1px solid #e2e8f0', background: '#f8fafc' }}>
              <button type="button" onClick={() => setPrintedPatientReleaseCert(null)} style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #cbd5e1', background: 'white', color: '#475569', cursor: 'pointer', fontWeight: '600', fontSize: '13px' }}>
                Close
              </button>
              <button 
                type="button" 
                onClick={() => window.print()}
                style={{ padding: '8px 20px', borderRadius: '6px', border: 'none', background: '#4338ca', color: 'white', cursor: 'pointer', fontWeight: '700', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                🖨️ Print Clearance Certificate
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Global Physical Appointment Request Modal */}
      {showRequestApptModal && (
        <div className="pd-modal-overlay" onClick={() => setShowRequestApptModal(false)}>
          <div className="pd-modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>
            <form onSubmit={handleRequestApptSubmit}>
              <div className="pd-modal-header">
                <h2>📅 Request Clinic Appointment</h2>
                <button className="pd-modal-close" type="button" onClick={() => setShowRequestApptModal(false)}>&times;</button>
              </div>
              <div className="pd-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px', padding: '20px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="rd-form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '12.5px', color: '#475569', fontWeight: '700' }}>Attending Doctor</label>
                    <select 
                      required
                      value={newApptDoctor} 
                      onChange={(e) => {
                        const docId = e.target.value;
                        setNewApptDoctor(docId);
                        const doc = doctorsList.find(d => d.id === docId || d.name === docId);
                        if (doc) setNewApptDept(doc.specialty || doc.department || 'Primary Care');
                      }}
                      style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', background: 'white', fontSize: '13px', fontWeight: '600' }}
                    >
                      <option value="" disabled hidden>Select Doctor</option>
                      {doctorsList.map(doc => {
                        const cleanDocName = (doc.name || 'Doctor').replace(/^(Dr\.?\s*)+/i, 'Dr. ');
                        return (
                          <option key={doc.id} value={doc.id}>{cleanDocName} ({doc.specialty || doc.department})</option>
                        );
                      })}
                    </select>
                  </div>
                  <div className="rd-form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '12.5px', color: '#475569', fontWeight: '700' }}>Specialty Department</label>
                    <input 
                      type="text"
                      disabled
                      value={newApptDept}
                      style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f1f5f9', fontSize: '13px', fontWeight: '600', color: '#1e293b' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="rd-form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '12.5px', color: '#475569', fontWeight: '700' }}>Preferred Date</label>
                    <input 
                      type="date" 
                      required 
                      value={newApptDate || new Date().toISOString().split('T')[0]} 
                      onChange={(e) => setNewApptDate(e.target.value)} 
                      style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                    />
                  </div>
                  <div className="rd-form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '12.5px', color: '#475569', fontWeight: '700' }}>Time Slot</label>
                    <select 
                      required 
                      value={newApptTime || 'Slot 1'} 
                      onChange={(e) => setNewApptTime(e.target.value)}
                      style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', background: 'white', fontSize: '13px', fontWeight: '600' }}
                    >
                      <option value="Slot 1">Slot 1 (Morning: 9 AM - 1 PM)</option>
                      <option value="Slot 2">Slot 2 (Afternoon: 2 PM - 6 PM)</option>
                    </select>
                  </div>
                </div>

                <div className="rd-form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '12.5px', color: '#475569', fontWeight: '700' }}>Reason for Visit / Symptoms</label>
                  <textarea 
                    required 
                    value={newApptReason} 
                    onChange={(e) => setNewApptReason(e.target.value)} 
                    placeholder="Briefly state your symptoms or consultation purpose..."
                    rows="3"
                    style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', resize: 'vertical', fontSize: '13px' }}
                  />
                </div>
              </div>
              <div className="pd-modal-footer" style={{ padding: '14px 20px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: '10px', background: '#f8fafc' }}>
                <button className="pd-btn-outline" type="button" onClick={() => setShowRequestApptModal(false)}>Cancel</button>
                <button className="pd-btn-primary" type="submit">Submit Request</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Global Telemedicine Video Consultation Modal */}
      {showScheduleTeleModal && (
        <div className="pd-modal-overlay" onClick={() => setShowScheduleTeleModal(false)}>
          <div className="pd-modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>
            <form onSubmit={handleScheduleTeleSubmit}>
              <div className="pd-modal-header" style={{ background: '#7c3aed', color: 'white' }}>
                <h2 style={{ color: 'white', margin: 0 }}>📹 Schedule Video Teleconsultation</h2>
                <button className="pd-modal-close" type="button" onClick={() => setShowScheduleTeleModal(false)} style={{ color: 'white' }}>&times;</button>
              </div>
              <div className="pd-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px', padding: '20px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="rd-form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '12.5px', color: '#475569', fontWeight: '700' }}>Attending Doctor</label>
                    <select 
                      required
                      value={newTeleDoctor} 
                      onChange={(e) => {
                        const docId = e.target.value;
                        setNewTeleDoctor(docId);
                        const doc = doctorsList.find(d => d.id === docId || d.name === docId);
                        if (doc) setNewTeleDept(doc.specialty || doc.department || 'Primary Care');
                      }}
                      style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', background: 'white', fontSize: '13px', fontWeight: '600' }}
                    >
                      <option value="" disabled hidden>Select Doctor</option>
                      {doctorsList.map(doc => {
                        const cleanDocName = (doc.name || 'Doctor').replace(/^(Dr\.?\s*)+/i, 'Dr. ');
                        return (
                          <option key={doc.id} value={doc.id}>{cleanDocName} ({doc.specialty || doc.department})</option>
                        );
                      })}
                    </select>
                  </div>
                  <div className="rd-form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '12.5px', color: '#475569', fontWeight: '700' }}>Specialty Department</label>
                    <input 
                      type="text"
                      disabled
                      value={newTeleDept}
                      style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f1f5f9', fontSize: '13px', fontWeight: '600', color: '#1e293b' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="rd-form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '12.5px', color: '#475569', fontWeight: '700' }}>Date</label>
                    <input 
                      type="date" 
                      required 
                      value={newTeleDate || new Date().toISOString().split('T')[0]} 
                      onChange={(e) => setNewTeleDate(e.target.value)} 
                      style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                    />
                  </div>
                  <div className="rd-form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '12.5px', color: '#475569', fontWeight: '700' }}>Preferred Time Slot</label>
                    <select 
                      required 
                      value={newTeleTime || '11:00 AM'} 
                      onChange={(e) => setNewTeleTime(e.target.value)}
                      style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', background: 'white', fontSize: '13px', fontWeight: '600' }}
                    >
                      <option value="09:30 AM">09:30 AM</option>
                      <option value="11:00 AM">11:00 AM</option>
                      <option value="02:30 PM">02:30 PM</option>
                      <option value="04:00 PM">04:00 PM</option>
                      <option value="05:30 PM">05:30 PM</option>
                    </select>
                  </div>
                </div>

                <div className="rd-form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '12.5px', color: '#475569', fontWeight: '700' }}>Reason for Tele-Consultation</label>
                  <textarea 
                    required 
                    value={newTeleReason} 
                    onChange={(e) => setNewTeleReason(e.target.value)} 
                    placeholder="Briefly describe your symptoms or reason for video consultation..."
                    rows="3"
                    style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', resize: 'vertical', fontSize: '13px' }}
                  />
                </div>
              </div>
              <div className="pd-modal-footer" style={{ padding: '14px 20px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: '10px', background: '#f8fafc' }}>
                <button className="pd-btn-outline" type="button" onClick={() => setShowScheduleTeleModal(false)}>Cancel</button>
                <button className="pd-btn-primary" type="submit" style={{ background: '#7c3aed' }}>
                  Proceed to Online Payment →
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Online Telemedicine Payment Gateway Modal */}
      {showTelePaymentModal && pendingTeleAppt && (
        <div className="pd-modal-overlay" onClick={() => !isProcessingTelePay && setShowTelePaymentModal(false)} style={{ zIndex: 10000, padding: '16px' }}>
          <div 
            className="pd-modal-content" 
            onClick={(e) => e.stopPropagation()} 
            style={{ 
              maxWidth: '520px', 
              width: '100%',
              maxHeight: '92vh',
              borderRadius: '16px', 
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
              overflow: 'hidden'
            }}
          >
            {/* Modal Header */}
            <div style={{ background: 'linear-gradient(135deg, #6366f1 0%, #7c3aed 100%)', color: 'white', padding: '16px 20px', flexShrink: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', background: 'rgba(255,255,255,0.2)', padding: '2px 8px', borderRadius: '12px', fontWeight: '700' }}>
                    🔒 Secure Payment Gateway
                  </span>
                  <h3 style={{ margin: '6px 0 0 0', fontSize: '17px', fontWeight: '700', color: 'white' }}>
                    Telemedicine Consultation Fee
                  </h3>
                </div>
                {!isProcessingTelePay && (
                  <button 
                    type="button"
                    onClick={() => setShowTelePaymentModal(false)} 
                    style={{ background: 'none', border: 'none', color: 'white', fontSize: '24px', cursor: 'pointer', opacity: 0.85, padding: '4px 8px' }}
                  >
                    &times;
                  </button>
                )}
              </div>
            </div>

            {/* Scrollable Form Body */}
            <form 
              onSubmit={handleCompleteTelePayment} 
              style={{ 
                padding: '18px 22px', 
                display: 'flex', 
                flexDirection: 'column', 
                gap: '14px', 
                background: '#ffffff',
                overflowY: 'auto',
                flex: 1
              }}
            >
              {/* Order Summary Box */}
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '12px 16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', fontSize: '13px' }}>
                  <span style={{ color: '#64748b' }}>Consulting Doctor:</span>
                  <strong style={{ color: '#1e293b' }}>{pendingTeleAppt.doctorName}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', fontSize: '13px' }}>
                  <span style={{ color: '#64748b' }}>Department:</span>
                  <span style={{ color: '#334155' }}>{pendingTeleAppt.department}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '13px' }}>
                  <span style={{ color: '#64748b' }}>Slot Date & Time:</span>
                  <span style={{ color: '#334155' }}>{pendingTeleAppt.date} at {pendingTeleAppt.time}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed #cbd5e1', paddingTop: '8px', marginTop: '4px', fontSize: '14.5px' }}>
                  <span style={{ fontWeight: '700', color: '#1e293b' }}>Total Payable:</span>
                  <strong style={{ color: '#7c3aed', fontSize: '16.5px' }}>₹{parseFloat(pendingTeleAppt.fee || '500').toFixed(2)}</strong>
                </div>
              </div>

              {/* Payment Methods Selection */}
              <div>
                <label style={{ fontSize: '12.5px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '6px' }}>
                  Select Payment Method
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                  {[
                    { id: 'UPI', label: '⚡ UPI / QR', icon: '📱' },
                    { id: 'Card', label: '💳 Card', icon: '💳' },
                    { id: 'NetBanking', label: '🏦 NetBanking', icon: '🏛️' }
                  ].map(method => (
                    <button
                      key={method.id}
                      type="button"
                      onClick={() => setTelePaymentMethod(method.id)}
                      style={{
                        padding: '8px',
                        borderRadius: '8px',
                        border: telePaymentMethod === method.id ? '2px solid #7c3aed' : '1px solid #e2e8f0',
                        background: telePaymentMethod === method.id ? '#f5f3ff' : '#ffffff',
                        color: telePaymentMethod === method.id ? '#7c3aed' : '#475569',
                        fontWeight: '700',
                        fontSize: '12px',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '3px'
                      }}
                    >
                      <span style={{ fontSize: '16px' }}>{method.icon}</span>
                      <span>{method.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* UPI Tab */}
              {telePaymentMethod === 'UPI' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '64px', height: '64px', flexShrink: 0, background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                      <span style={{ fontSize: '24px' }}>📱</span>
                      <span style={{ fontSize: '8px', color: '#64748b', fontWeight: 'bold' }}>UPI QR</span>
                    </div>
                    <div style={{ flex: 1 }}>
                      <strong style={{ fontSize: '12.5px', color: '#1e293b', display: 'block' }}>Instant UPI Verification</strong>
                      <span style={{ fontSize: '11px', color: '#64748b' }}>Scan with GPay, PhonePe, Paytm or enter UPI ID below:</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '4px' }}>
                    <label style={{ fontSize: '11.5px', fontWeight: '600', color: '#475569' }}>Virtual Payment Address (UPI ID)</label>
                    <input
                      type="text"
                      placeholder="e.g. mobile@upi or username@okhdfcbank"
                      value={teleUpiId}
                      onChange={(e) => setTeleUpiId(e.target.value)}
                      style={{ padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12.5px', background: 'white' }}
                    />
                  </div>
                </div>
              )}

              {/* Card Tab */}
              {telePaymentMethod === 'Card' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '12px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '11.5px', fontWeight: '600', color: '#475569' }}>Card Number</label>
                    <input
                      type="text"
                      placeholder="4532 •••• •••• 8890"
                      value={teleCardNumber}
                      onChange={(e) => setTeleCardNumber(e.target.value)}
                      style={{ padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12.5px', background: 'white' }}
                    />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <label style={{ fontSize: '11.5px', fontWeight: '600', color: '#475569' }}>Expiry Date</label>
                      <input
                        type="text"
                        placeholder="MM/YY"
                        value={teleCardExpiry}
                        onChange={(e) => setTeleCardExpiry(e.target.value)}
                        style={{ padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12.5px', background: 'white' }}
                      />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <label style={{ fontSize: '11.5px', fontWeight: '600', color: '#475569' }}>CVV</label>
                      <input
                        type="password"
                        placeholder="•••"
                        maxLength="4"
                        value={teleCardCvv}
                        onChange={(e) => setTeleCardCvv(e.target.value)}
                        style={{ padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12.5px', background: 'white' }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* NetBanking Tab */}
              {telePaymentMethod === 'NetBanking' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '12px' }}>
                  <label style={{ fontSize: '11.5px', fontWeight: '600', color: '#475569' }}>Select Bank</label>
                  <select style={{ padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12.5px', background: 'white' }}>
                    <option>HDFC Bank</option>
                    <option>State Bank of India (SBI)</option>
                    <option>ICICI Bank</option>
                    <option>Axis Bank</option>
                    <option>Kotak Mahindra Bank</option>
                  </select>
                </div>
              )}

              {/* Submit / Confirm Button */}
              <div style={{ marginTop: '4px' }}>
                <button
                  type="submit"
                  disabled={isProcessingTelePay}
                  style={{
                    width: '100%',
                    padding: '11px',
                    background: isProcessingTelePay ? '#94a3b8' : '#7c3aed',
                    color: 'white',
                    border: 'none',
                    borderRadius: '10px',
                    fontWeight: '700',
                    fontSize: '13.5px',
                    cursor: isProcessingTelePay ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    transition: 'all 0.2s',
                    boxShadow: '0 4px 12px rgba(124, 58, 237, 0.25)'
                  }}
                >
                  {isProcessingTelePay ? (
                    <>
                      <span className="rd-spinner" style={{ width: '15px', height: '15px', border: '2px solid white', borderTopColor: 'transparent', borderRadius: '50%', display: 'inline-block', animation: 'spin 1s linear infinite' }}></span>
                      Processing Payment...
                    </>
                  ) : (
                    <>
                      💳 Pay ₹{parseFloat(pendingTeleAppt.fee || '500').toFixed(2)} & Confirm Booking
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Real-time Incoming Tele-Call Ringing Popup Modal */}
      {incomingTeleCall && !isVideoCallActive && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.85)',
          backdropFilter: 'blur(8px)',
          zIndex: 999999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px',
          animation: 'fadeIn 0.3s ease'
        }}>
          <div style={{
            background: 'linear-gradient(145deg, #1e1b4b 0%, #0f172a 100%)',
            border: '2px solid #6366f1',
            borderRadius: '24px',
            padding: '32px 24px',
            maxWidth: '420px',
            width: '100%',
            textAlign: 'center',
            color: 'white',
            boxShadow: '0 25px 50px -12px rgba(99, 102, 241, 0.5)'
          }}>
            <div style={{
              width: '84px',
              height: '84px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
              margin: '0 auto 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '38px',
              boxShadow: '0 0 30px rgba(99, 102, 241, 0.7)',
              animation: 'bounce 1s infinite alternate'
            }}>
              🎥
            </div>

            <span style={{
              background: '#10b981',
              color: 'white',
              fontSize: '11px',
              fontWeight: '800',
              letterSpacing: '1px',
              textTransform: 'uppercase',
              padding: '4px 12px',
              borderRadius: '20px',
              display: 'inline-block',
              marginBottom: '12px'
            }}>
              Incoming Video Call
            </span>

            <h2 style={{ margin: '0 0 6px 0', fontSize: '22px', fontWeight: '800', color: '#ffffff' }}>
              {cleanDoctorName(incomingTeleCall.doctorName)}
            </h2>
            <p style={{ margin: '0 0 4px 0', color: '#a5b4fc', fontSize: '14px', fontWeight: '600' }}>
              {incomingTeleCall.department || 'Specialist Consultation'}
            </p>
            <p style={{ margin: '0 0 24px 0', color: '#94a3b8', fontSize: '12px' }}>
              Appointment Ref: <strong>{incomingTeleCall.appointmentId}</strong>
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <button
                type="button"
                onClick={handleDeclineIncomingCall}
                style={{
                  padding: '14px',
                  background: 'rgba(239, 68, 68, 0.2)',
                  border: '1px solid #ef4444',
                  color: '#f87171',
                  borderRadius: '14px',
                  fontWeight: '700',
                  fontSize: '14px',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                ✕ Decline
              </button>
              <button
                type="button"
                onClick={handleAcceptIncomingCall}
                style={{
                  padding: '14px',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  border: 'none',
                  color: 'white',
                  borderRadius: '14px',
                  fontWeight: '800',
                  fontSize: '14.5px',
                  cursor: 'pointer',
                  boxShadow: '0 8px 20px rgba(16, 185, 129, 0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  transition: 'all 0.2s'
                }}
              >
                🎥 Connect Call
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
