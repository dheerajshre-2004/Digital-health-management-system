import React, { useState, useEffect } from 'react';
import './index.css';
import Dashboard from './Dashboard';
import PatientDashboard from './PatientDashboard';
import ReceptionistDashboard from './ReceptionistDashboard';
import LaboratoryDashboard from './LaboratoryDashboard';
import PharmacistDashboard from './PharmacistDashboard';
import CashCounterDashboard from './CashCounterDashboard';
import InsuranceDashboard from './InsuranceDashboard';
import { sendPatientWelcomeEmail, openDefaultMailClient } from './emailService';

function App() {
  const isPatientPortal = 
    import.meta.env.VITE_APP_MODE === 'patient' ||
    new URLSearchParams(window.location.search).get('portal') === 'patient' ||
    window.location.pathname.startsWith('/patient') ||
    window.location.hostname.toLowerCase().includes('patient');

  const isMobileOrPWA = isPatientPortal || 
                        window.matchMedia('(display-mode: standalone)').matches || 
                        window.navigator.standalone || 
                        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  const [activeTab, setActiveTab] = useState('signin');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState('patient');
  const [loggedInPatient, setLoggedInPatient] = useState(null);
  const [loggedInDoctor, setLoggedInDoctor] = useState(null);
  const [loggedInStaff, setLoggedInStaff] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [registrationSuccessData, setRegistrationSuccessData] = useState(null);

  // Controlled Input States for Sign In and Registration
  const [signInIdentifier, setSignInIdentifier] = useState('');
  const [signInPassword, setSignInPassword] = useState('');
  const [regFullName, setRegFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');

  const clearAuthFields = () => {
    setSignInIdentifier('');
    setSignInPassword('');
    setRegFullName('');
    setRegEmail('');
    setRegPassword('');
  };

  const saveTabSession = (sessionData) => {
    sessionStorage.setItem('dhms_tab_session', JSON.stringify(sessionData));
    sessionStorage.setItem('dhms_active_session', JSON.stringify(sessionData));
    try {
      localStorage.setItem('dhms_active_session', JSON.stringify(sessionData));
    } catch (e) {}
  };

  const clearTabSession = () => {
    sessionStorage.removeItem('dhms_tab_session');
    sessionStorage.removeItem('dhms_active_session');
    try {
      localStorage.removeItem('dhms_active_session');
    } catch (e) {}
  };

  useEffect(() => {
    // Check URL parameters for explicit role testing (e.g. ?role=receptionist, ?role=doctor, etc.)
    const urlParams = new URLSearchParams(window.location.search);
    const roleParam = urlParams.get('role');
    const hashParam = window.location.hash.replace('#', '');

    // Prefer tab-isolated session from sessionStorage
    const savedSession = sessionStorage.getItem('dhms_tab_session') || sessionStorage.getItem('dhms_active_session');
    
    if (savedSession) {
      try {
        const session = JSON.parse(savedSession);
        if (isPatientPortal) {
          if (session.role === 'patient') {
            setUserRole('patient');
            setLoggedInPatient(session.user);
            setIsAuthenticated(true);
          } else {
            setUserRole('patient');
            setIsAuthenticated(false);
          }
        } else if (isMobileOrPWA) {
          if (session.role === 'patient') {
            setUserRole('patient');
            setLoggedInPatient(session.user);
            setIsAuthenticated(true);
          } else {
            setUserRole('patient');
            setIsAuthenticated(false);
          }
        } else {
          setUserRole(session.role);
          if (session.role === 'patient') {
            setLoggedInPatient(session.user);
          } else if (session.role === 'doctor') {
            setLoggedInDoctor(session.user);
          } else if (session.user) {
            setLoggedInStaff(session.user);
          }
          setIsAuthenticated(true);
        }
      } catch (err) {
        console.error("Failed to restore session:", err);
      }
    } else if (roleParam || hashParam) {
      const targetRole = roleParam || hashParam;
      setUserRole(targetRole);
    } else if (isPatientPortal || isMobileOrPWA) {
      setUserRole('patient');
    }

    // Clean up dummy staff accounts from user's existing localStorage session
    const dummyEmails = ['clara@dhms.org', 'amy@dhms.org', 'banner@dhms.org', 'barry@dhms.org', 'rory@dhms.org', 'river@dhms.org', 'donna@dhms.org', 'martha@dhms.org'];

    const recSaved = localStorage.getItem('dhms_receptionist_staff');
    if (recSaved) {
      const filtered = JSON.parse(recSaved).filter(s => !dummyEmails.includes(s.email?.toLowerCase()));
      localStorage.setItem('dhms_receptionist_staff', JSON.stringify(filtered));
    }

    const labSaved = localStorage.getItem('dhms_laboratory_staff');
    if (labSaved) {
      const filtered = JSON.parse(labSaved).filter(s => !dummyEmails.includes(s.email?.toLowerCase()));
      localStorage.setItem('dhms_laboratory_staff', JSON.stringify(filtered));
    }

    const phrSaved = localStorage.getItem('dhms_pharmacy_staff');
    if (phrSaved) {
      const filtered = JSON.parse(phrSaved).filter(s => !dummyEmails.includes(s.email?.toLowerCase()));
      localStorage.setItem('dhms_pharmacy_staff', JSON.stringify(filtered));
    }

    const cashSaved = localStorage.getItem('dhms_cashier_staff');
    if (cashSaved) {
      const filtered = JSON.parse(cashSaved).filter(s => !dummyEmails.includes(s.email?.toLowerCase()));
      localStorage.setItem('dhms_cashier_staff', JSON.stringify(filtered));
    }

    // Seed initial empty state if not present
    if (!localStorage.getItem('dhms_patients')) {
      localStorage.setItem('dhms_patients', JSON.stringify([]));
    }

    if (!localStorage.getItem('dhms_appointments')) {
      localStorage.setItem('dhms_appointments', JSON.stringify([]));
    }

    if (!localStorage.getItem('dhms_prescriptions')) {
      localStorage.setItem('dhms_prescriptions', JSON.stringify([]));
    }

    if (!localStorage.getItem('dhms_lab_requests')) {
      localStorage.setItem('dhms_lab_requests', JSON.stringify([]));
    }

    if (!localStorage.getItem('dhms_medications')) {
      const defaultMeds = [
        { id: "MED-101", name: "Amoxicillin 500mg", genericName: "Amoxicillin Trihydrate", category: "Antibiotics", stock: 150, price: 18.00, isEmergency: false, lowStockThreshold: 20 },
        { id: "MED-102", name: "Lisinopril 10mg", genericName: "Lisinopril", category: "Cardiovascular", stock: 120, price: 15.00, isEmergency: false, lowStockThreshold: 20 },
        { id: "MED-103", name: "Metoprolol 25mg", genericName: "Metoprolol Succinate", category: "Cardiovascular", stock: 95, price: 20.00, isEmergency: false, lowStockThreshold: 15 },
        { id: "MED-104", name: "Ibuprofen 400mg", genericName: "Ibuprofen", category: "NSAIDs", stock: 180, price: 6.50, isEmergency: false, lowStockThreshold: 25 },
        { id: "MED-105", name: "Paracetamol 500mg", genericName: "Acetaminophen", category: "Analgesics", stock: 300, price: 3.00, isEmergency: true, lowStockThreshold: 50 },
        { id: "MED-106", name: "Epinephrine 1mg/mL", genericName: "Epinephrine", category: "Anaphylaxis / Cardiac", stock: 60, price: 40.00, isEmergency: true, lowStockThreshold: 15 },
        { id: "MED-107", name: "Adenosine 6mg/2mL", genericName: "Adenosine", category: "Antiarrhythmic", stock: 40, price: 65.00, isEmergency: true, lowStockThreshold: 10 },
        { id: "MED-108", name: "Naloxone 0.4mg/mL", genericName: "Naloxone", category: "Opioid Antagonist", stock: 50, price: 35.00, isEmergency: true, lowStockThreshold: 15 }
      ];
      localStorage.setItem('dhms_medications', JSON.stringify(defaultMeds));
    }

    if (!localStorage.getItem('dhms_receptionist_staff')) {
      localStorage.setItem('dhms_receptionist_staff', JSON.stringify([]));
    }

    if (!localStorage.getItem('dhms_laboratory_staff')) {
      localStorage.setItem('dhms_laboratory_staff', JSON.stringify([]));
    }

    if (!localStorage.getItem('dhms_pharmacy_staff')) {
      localStorage.setItem('dhms_pharmacy_staff', JSON.stringify([]));
    }

    if (!localStorage.getItem('dhms_cashier_staff')) {
      localStorage.setItem('dhms_cashier_staff', JSON.stringify([]));
    }

    if (!localStorage.getItem('dhms_pharmacy_attendance')) {
      localStorage.setItem('dhms_pharmacy_attendance', JSON.stringify([]));
    }

    if (!localStorage.getItem('dhms_master_attendance')) {
      localStorage.setItem('dhms_master_attendance', JSON.stringify([]));
    }

    if (!localStorage.getItem('dhms_admissions')) {
      localStorage.setItem('dhms_admissions', JSON.stringify([]));
    }

    if (!localStorage.getItem('dhms_insurance_policies')) {
      localStorage.setItem('dhms_insurance_policies', JSON.stringify([]));
    }

    if (!localStorage.getItem('dhms_insurance_claims')) {
      localStorage.setItem('dhms_insurance_claims', JSON.stringify([]));
    }

    if (!localStorage.getItem('dhms_lab_facilities')) {
      const defaultFacilities = [
        { code: "PATH-CBC", name: "Complete Blood Count (CBC)", dept: "Hematology", cost: "₹45.00", time: "4-6 Hours", fast: "No fasting required", description: "Evaluates overall health and detects a wide range of disorders including anemia and infection." },
        { code: "PATH-LIP", name: "Lipid Profile / Panel", dept: "Clinical Biochemistry", cost: "₹120.00", time: "8-12 Hours", fast: "Fasting required (12 hours)", description: "Measures cholesterol levels and triglycerides to assess cardiovascular risk." },
        { code: "PATH-THY", name: "Thyroid Panel (TSH, Free T4)", dept: "Endocrinology", cost: "₹85.00", time: "24 Hours", fast: "No fasting required", description: "Assesses thyroid gland function and helps diagnose hyperthyroidism or hypothyroidism." },
        { code: "PATH-CMP", name: "Comprehensive Metabolic Panel (CMP)", dept: "Clinical Biochemistry", cost: "₹110.00", time: "12 Hours", fast: "Fasting required (8-10 hours)", description: "Provides information about kidneys, liver, electrolyte and acid/base balance." },
        { code: "PATH-VIT", name: "Vitamin D-25 Hydroxy Screen", dept: "Immunology", cost: "₹95.00", time: "24-48 Hours", fast: "No fasting required", description: "Checks for bone weaknesses, bone malformations, or abnormal metabolism." },
        { code: "PATH-URN", name: "Urinalysis & Urine Culture", dept: "Microbiology", cost: "₹45.00", time: "24 Hours", fast: "No fasting required", description: "Detects urinary tract infections (UTI), kidney disorders, and diabetes." }
      ];
      localStorage.setItem('dhms_lab_facilities', JSON.stringify(defaultFacilities));
    }
  }, []);

  const handleAuthSubmit = (e) => {
    e.preventDefault();
    const emailVal = signInIdentifier.trim();
    const passwordVal = signInPassword;
    
    if (userRole === 'patient') {
      const patientsList = JSON.parse(localStorage.getItem('dhms_patients') || '[]');
      const cleanInput = emailVal.trim().replace(/[\s\-\(\)\+]/g, '');
      const matched = patientsList.find(p => {
        const cleanPhone = p.phone ? p.phone.replace(/[\s\-\(\)\+]/g, '') : '';
        return p.id?.toLowerCase() === emailVal.trim().toLowerCase() || 
               p.email?.toLowerCase() === emailVal.trim().toLowerCase() ||
               (cleanPhone && cleanPhone === cleanInput);
      });
      if (matched) {
        if (matched.password && matched.password !== passwordVal) {
          alert('Incorrect password. Please try again.');
          setSignInPassword('');
          return;
        }
        clearAuthFields();
        setLoggedInPatient(matched);
        setIsAuthenticated(true);
        saveTabSession({ role: 'patient', user: matched });
      } else {
        alert('Patient account not found. Please verify your Patient ID.');
        setSignInPassword('');
      }
    } else if (userRole === 'doctor') {
      const doctorsList = JSON.parse(localStorage.getItem('dhms_doctors') || '[]');
      const matched = doctorsList.find(d => 
        (d.email && d.email.toLowerCase() === emailVal.toLowerCase()) ||
        (d.name && d.name.toLowerCase() === emailVal.toLowerCase()) ||
        (d.id && d.id.toLowerCase() === emailVal.toLowerCase())
      );
      if (matched) {
        if (matched.password && matched.password !== passwordVal) {
          alert('Incorrect password. Please try again.');
          setSignInPassword('');
          return;
        }
        clearAuthFields();
        setLoggedInDoctor(matched);
        setIsAuthenticated(true);
        saveTabSession({ role: 'doctor', user: matched });
      } else {
        alert('Doctor account not found. Please register first.');
        setSignInPassword('');
      }
    } else if (userRole === 'receptionist') {
      const staffList = JSON.parse(localStorage.getItem('dhms_receptionist_staff') || '[]');
      const matched = staffList.find(s => 
        (s.email && s.email.toLowerCase() === emailVal.toLowerCase()) ||
        (s.name && s.name.toLowerCase() === emailVal.toLowerCase()) ||
        (s.id && s.id.toLowerCase() === emailVal.toLowerCase())
      );
      if (matched) {
        if (matched.password && matched.password !== passwordVal) {
          alert('Incorrect password. Please try again.');
          setSignInPassword('');
          return;
        }
        clearAuthFields();
        setLoggedInStaff(matched);
        setIsAuthenticated(true);
        saveTabSession({ role: 'receptionist', user: matched });
      } else {
        alert('Receptionist account not found. Please register first.');
        setSignInPassword('');
      }
    } else if (userRole === 'laboratory') {
      const staffList = JSON.parse(localStorage.getItem('dhms_laboratory_staff') || '[]');
      const matched = staffList.find(s => 
        (s.email && s.email.toLowerCase() === emailVal.toLowerCase()) ||
        (s.name && s.name.toLowerCase() === emailVal.toLowerCase()) ||
        (s.id && s.id.toLowerCase() === emailVal.toLowerCase())
      );
      if (matched) {
        if (matched.password && matched.password !== passwordVal) {
          alert('Incorrect password. Please try again.');
          setSignInPassword('');
          return;
        }
        clearAuthFields();
        setLoggedInStaff(matched);
        setIsAuthenticated(true);
        saveTabSession({ role: 'laboratory', user: matched });
      } else {
        alert('Laboratory staff account not found. Please register first.');
        setSignInPassword('');
      }
    } else if (userRole === 'pharmacist') {
      const staffList = JSON.parse(localStorage.getItem('dhms_pharmacy_staff') || '[]');
      const matched = staffList.find(s => 
        (s.email && s.email.toLowerCase() === emailVal.toLowerCase()) ||
        (s.name && s.name.toLowerCase() === emailVal.toLowerCase()) ||
        (s.id && s.id.toLowerCase() === emailVal.toLowerCase())
      );
      if (matched) {
        if (matched.password && matched.password !== passwordVal) {
          alert('Incorrect password. Please try again.');
          setSignInPassword('');
          return;
        }
        clearAuthFields();
        setLoggedInStaff(matched);
        setIsAuthenticated(true);
        saveTabSession({ role: 'pharmacist', user: matched });
      } else {
        alert('Pharmacy staff account not found. Please register first.');
        setSignInPassword('');
      }
    } else if (userRole === 'cash_counter') {
      const staffList = JSON.parse(localStorage.getItem('dhms_cashier_staff') || '[]');
      const matched = staffList.find(s => 
        (s.email && s.email.toLowerCase() === emailVal.toLowerCase()) ||
        (s.name && s.name.toLowerCase() === emailVal.toLowerCase()) ||
        (s.id && s.id.toLowerCase() === emailVal.toLowerCase())
      );
      if (matched) {
        if (matched.password && matched.password !== passwordVal) {
          alert('Incorrect password. Please try again.');
          setSignInPassword('');
          return;
        }
        clearAuthFields();
        setLoggedInStaff(matched);
        setIsAuthenticated(true);
        saveTabSession({ role: 'cash_counter', user: matched });
      } else {
        alert('Cash counter staff account not found. Please register first.');
        setSignInPassword('');
      }
    } else if (userRole === 'admin') {
      const savedAdmin = localStorage.getItem('dhms_admin');
      if (savedAdmin) {
        const adminObj = JSON.parse(savedAdmin);
        if (adminObj.email.toLowerCase() === emailVal.toLowerCase() && adminObj.password === passwordVal) {
          clearAuthFields();
          setIsAuthenticated(true);
          saveTabSession({ role: 'admin', user: { name: 'System Administrator', email: emailVal } });
        } else {
          alert('Incorrect Administrator credentials. Access denied.');
          setSignInPassword('');
          return;
        }
      } else {
        // Dynamically save the admin credentials as the registered admin on first login
        const newAdmin = {
          name: 'System Administrator',
          email: emailVal,
          password: passwordVal
        };
        localStorage.setItem('dhms_admin', JSON.stringify(newAdmin));
        clearAuthFields();
        setIsAuthenticated(true);
        saveTabSession({ role: 'admin', user: newAdmin });
      }
    } else {
      // Allow other roles (like insurance_agent) to log in directly
      clearAuthFields();
      setIsAuthenticated(true);
      saveTabSession({ role: userRole, user: { email: emailVal } });
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    const nameVal = regFullName.trim();
    const emailVal = regEmail.trim();
    const passwordVal = regPassword;
    
    const nameParts = nameVal.split(/\s+/);
    const firstName = nameParts[0] || 'Unknown';
    const lastName = nameParts.slice(1).join(' ') || 'User';

    if (userRole === 'patient') {
      alert('Patient Registration Notice: Self-registration for patients is disabled. Patient accounts and Unique Health IDs can only be registered through the Hospital Reception Desk. Please visit Reception or call +91 1800-425-DHMS.');
      clearAuthFields();
      setActiveTab('signin');
      return;
    } else if (userRole === 'doctor') {
      const doctorsList = JSON.parse(localStorage.getItem('dhms_doctors') || '[]');
      if (doctorsList.some(d => d.email?.toLowerCase() === emailVal.toLowerCase())) {
        alert('An account already exists with this email.');
        return;
      }
      const newId = `dr_${firstName.toLowerCase()}_${Math.floor(100 + Math.random() * 900)}`;
      const newDoc = {
        id: newId,
        name: `Dr. ${firstName} ${lastName}`,
        department: 'Primary Care',
        status: 'Available',
        email: emailVal,
        password: passwordVal,
        phone: ''
      };
      const updated = [newDoc, ...doctorsList];
      localStorage.setItem('dhms_doctors', JSON.stringify(updated));

      await sendPatientWelcomeEmail({
        patientName: `Dr. ${firstName} ${lastName}`,
        email: emailVal,
        patientId: newId,
        password: passwordVal,
        phone: ''
      });

      setRegistrationSuccessData({
        role: 'doctor',
        name: `Dr. ${firstName} ${lastName}`,
        email: emailVal,
        id: newId,
        password: passwordVal
      });
      clearAuthFields();
    } else if (userRole === 'receptionist') {
      const staffList = JSON.parse(localStorage.getItem('dhms_receptionist_staff') || '[]');
      if (staffList.some(s => s.email?.toLowerCase() === emailVal.toLowerCase())) {
        alert('An account already exists with this email.');
        return;
      }
      const newId = `REC-${Math.floor(100 + Math.random() * 900)}`;
      const newStaff = {
        id: newId,
        name: nameVal,
        role: 'Senior Receptionist',
        email: emailVal,
        password: passwordVal,
        status: 'Available'
      };
      const updated = [newStaff, ...staffList];
      localStorage.setItem('dhms_receptionist_staff', JSON.stringify(updated));

      await sendPatientWelcomeEmail({
        patientName: nameVal,
        email: emailVal,
        patientId: newId,
        password: passwordVal,
        phone: ''
      });

      setRegistrationSuccessData({
        role: 'receptionist',
        name: nameVal,
        email: emailVal,
        id: newId,
        password: passwordVal
      });
      clearAuthFields();
    } else if (userRole === 'laboratory') {
      const staffList = JSON.parse(localStorage.getItem('dhms_laboratory_staff') || '[]');
      if (staffList.some(s => s.email?.toLowerCase() === emailVal.toLowerCase())) {
        alert('An account already exists with this email.');
        return;
      }
      const newId = `LAB-${Math.floor(100 + Math.random() * 900)}`;
      const newStaff = {
        id: newId,
        name: nameVal,
        role: 'Lab Technician',
        email: emailVal,
        password: passwordVal,
        status: 'Available'
      };
      const updated = [newStaff, ...staffList];
      localStorage.setItem('dhms_laboratory_staff', JSON.stringify(updated));

      await sendPatientWelcomeEmail({
        patientName: nameVal,
        email: emailVal,
        patientId: newId,
        password: passwordVal,
        phone: ''
      });

      setRegistrationSuccessData({
        role: 'laboratory',
        name: nameVal,
        email: emailVal,
        id: newId,
        password: passwordVal
      });
      clearAuthFields();
    } else if (userRole === 'pharmacist') {
      const staffList = JSON.parse(localStorage.getItem('dhms_pharmacy_staff') || '[]');
      if (staffList.some(s => s.email?.toLowerCase() === emailVal.toLowerCase())) {
        alert('An account already exists with this email.');
        return;
      }
      const newId = `PHR-${Math.floor(100 + Math.random() * 900)}`;
      const newStaff = {
        id: newId,
        name: nameVal,
        role: 'Dispensing Pharmacist',
        email: emailVal,
        password: passwordVal,
        status: 'Available'
      };
      const updated = [newStaff, ...staffList];
      localStorage.setItem('dhms_pharmacy_staff', JSON.stringify(updated));

      await sendPatientWelcomeEmail({
        patientName: nameVal,
        email: emailVal,
        patientId: newId,
        password: passwordVal,
        phone: ''
      });

      setRegistrationSuccessData({
        role: 'pharmacist',
        name: nameVal,
        email: emailVal,
        id: newId,
        password: passwordVal
      });
      clearAuthFields();
    } else if (userRole === 'cash_counter') {
      const staffList = JSON.parse(localStorage.getItem('dhms_cashier_staff') || '[]');
      if (staffList.some(s => s.email?.toLowerCase() === emailVal.toLowerCase())) {
        alert('An account already exists with this email.');
        return;
      }
      const newId = `CSH-${Math.floor(100 + Math.random() * 900)}`;
      const newStaff = {
        id: newId,
        name: nameVal,
        role: 'Billing Specialist',
        email: emailVal,
        password: passwordVal,
        status: 'Available'
      };
      const updated = [newStaff, ...staffList];
      localStorage.setItem('dhms_cashier_staff', JSON.stringify(updated));

      await sendPatientWelcomeEmail({
        patientName: nameVal,
        email: emailVal,
        patientId: newId,
        password: passwordVal,
        phone: ''
      });

      setRegistrationSuccessData({
        role: 'cash_counter',
        name: nameVal,
        email: emailVal,
        id: newId,
        password: passwordVal
      });
      clearAuthFields();
    } else {
      alert('Registration successful! Please sign in using your account credentials.');
      clearAuthFields();
      setActiveTab('signin');
    }
  };

  const handleLogout = () => {
    clearTabSession();
    clearAuthFields();
    setIsAuthenticated(false);
    setLoggedInPatient(null);
    setLoggedInDoctor(null);
    setLoggedInStaff(null);
  };

  if (isAuthenticated) {
    if (userRole === 'patient') {
      return <PatientDashboard onLogout={handleLogout} loggedInPatient={loggedInPatient} />;
    }
    if (userRole === 'receptionist') {
      return <ReceptionistDashboard onLogout={handleLogout} loggedInStaff={loggedInStaff} />;
    }
    if (userRole === 'laboratory') {
      return <LaboratoryDashboard onLogout={handleLogout} loggedInStaff={loggedInStaff} />;
    }
    if (userRole === 'pharmacist') {
      return <PharmacistDashboard onLogout={handleLogout} loggedInStaff={loggedInStaff} />;
    }
    if (userRole === 'cash_counter') {
      return <CashCounterDashboard onLogout={handleLogout} loggedInStaff={loggedInStaff} />;
    }
    if (userRole === 'insurance_agent') {
      return <InsuranceDashboard onLogout={handleLogout} />;
    }
    return <Dashboard onLogout={handleLogout} role={userRole} loggedInDoctor={loggedInDoctor} />;
  }

  return (
    <div className="auth-container">
      <div className="auth-header">
        <h1>Welcome to <span className="highlight">{isPatientPortal ? "DHMS Patient Portal" : "DHMS"}</span></h1>
        <p>{isPatientPortal ? "Secure Patient Health Portal for Appointments, Prescriptions & Medical Records" : (isMobileOrPWA ? "Secure Patient Portal Access" : "Secure access portal for patients, doctors, and healthcare administrators")}</p>
      </div>

      <div className="auth-card">
        {!isPatientPortal && !isMobileOrPWA && (
          <div className="tabs-container">
            <button 
              className={`tab ${activeTab === 'signin' ? 'active' : ''}`}
              onClick={() => {
                clearAuthFields();
                setActiveTab('signin');
              }}
            >
              Sign In
            </button>
            <button 
              className={`tab ${activeTab === 'register' ? 'active' : ''}`}
              onClick={() => {
                clearAuthFields();
                if (userRole === 'patient') setUserRole('doctor');
                setActiveTab('register');
              }}
            >
              Staff Registration
            </button>
          </div>
        )}

        {registrationSuccessData ? (
          <div style={{ textAlign: 'center', padding: '10px 0', animation: 'fadeIn 0.3s ease' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#dcfce7', color: '#15803d', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', margin: '0 auto 16px auto' }}>
              ✓
            </div>
            
            <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a', margin: '0 0 8px 0' }}>Registration Successful!</h2>
            
            {/* Heartfelt Hospital Message */}
            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '14px 18px', margin: '14px 0', textAlign: 'left' }}>
              <p style={{ margin: 0, fontSize: '13.5px', color: '#14532d', lineHeight: 1.5 }}>
                ❤️ <strong>Thank you for choosing our hospital.</strong> We are honored to serve you and our medical team will always take the utmost care of you and your family.
              </p>
            </div>

            {/* Email Dispatch Notice */}
            <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '10px', padding: '12px 16px', marginBottom: '16px', textAlign: 'left' }}>
              <p style={{ margin: 0, fontSize: '13px', color: '#1e40af' }}>
                📧 <strong>Credentials Dispatched:</strong> A welcome email containing your Digital Patient ID and portal access password has been sent to <strong>{registrationSuccessData.email}</strong>.
              </p>
            </div>

            {/* Credentials Card */}
            <div style={{ background: '#f8fafc', border: '2px dashed #93c5fd', borderRadius: '10px', padding: '16px 20px', textAlign: 'left', marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13.5px' }}>
                <span style={{ color: '#64748b' }}>Patient ID:</span>
                <strong style={{ color: '#1e3a8a', fontSize: '16px' }}>{registrationSuccessData.id}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13.5px' }}>
                <span style={{ color: '#64748b' }}>Access Password:</span>
                <strong style={{ color: '#15803d', fontSize: '16px', fontFamily: 'monospace' }}>{registrationSuccessData.password}</strong>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                type="button"
                className="btn-submit"
                onClick={() => {
                  setSignInIdentifier(registrationSuccessData.id);
                  setSignInPassword(registrationSuccessData.password);
                  setRegistrationSuccessData(null);
                  setActiveTab('signin');
                }}
              >
                🚀 Auto-Fill & Proceed to Sign In
              </button>

              <button
                type="button"
                onClick={() => {
                  openDefaultMailClient({
                    patientName: registrationSuccessData.name,
                    email: registrationSuccessData.email,
                    patientId: registrationSuccessData.id,
                    password: registrationSuccessData.password
                  });
                }}
                style={{
                  padding: '10px 16px',
                  background: 'white',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  color: '#334155',
                  fontWeight: '600',
                  fontSize: '13px',
                  cursor: 'pointer'
                }}
              >
                ✉️ Open in Mail Client
              </button>
            </div>
          </div>
        ) : (isPatientPortal || activeTab === 'signin') ? (
          <form className="auth-form" onSubmit={handleAuthSubmit}>
            <div className="form-group">
              <label>{(isPatientPortal || userRole === 'patient') ? 'Patient ID, Email or Phone' : 'Email Address'}</label>
              <div className="input-wrapper">
                {(isPatientPortal || userRole === 'patient') ? (
                  <svg className="input-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                ) : (
                  <svg className="input-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                    <polyline points="22,6 12,13 2,6"></polyline>
                  </svg>
                )}
                <input 
                  type={(isPatientPortal || userRole === 'patient') ? "text" : "email"} 
                  placeholder={(isPatientPortal || userRole === 'patient') ? "Enter Patient ID (e.g., PT-101) or Email" : "Enter email address"} 
                  required 
                  value={signInIdentifier}
                  onChange={(e) => {
                    let val = e.target.value;
                    if ((isPatientPortal || userRole === 'patient') && !val.includes('@')) {
                      val = val.toUpperCase();
                    }
                    setSignInIdentifier(val);
                  }}
                />
              </div>
            </div>
            
            <div className="form-group">
              <label>Password</label>
              <div className="input-wrapper">
                <svg className="input-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
                <input 
                  type={showPassword ? "text" : "password"} 
                  placeholder="Enter password" 
                  required 
                  value={signInPassword}
                  onChange={(e) => setSignInPassword(e.target.value)}
                  style={{ paddingRight: '40px' }} 
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)} 
                  style={{ position: 'absolute', right: '14px', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, zIndex: 3 }}
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                      <line x1="1" y1="1" x2="23" y2="23"></line>
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                      <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {(!isPatientPortal && !isMobileOrPWA) && (
              <div className="form-group">
                <label>Login As </label>
                <div className="select-wrapper">
                  <select required value={userRole} onChange={(e) => setUserRole(e.target.value)}>
                    <option value="" disabled hidden>Select a role</option>
                    <option value="patient">Patient</option>
                    <option value="doctor">Doctor</option>
                    <option value="laboratory">Laboratory</option>
                    <option value="pharmacist">Pharmacist</option>
                    <option value="receptionist">Receptionist</option>
                    <option value="cash_counter">Cash Counter</option>
                    <option value="admin">Administrator</option>
                    <option value="insurance_agent">Insurance Agent / TPA</option>
                  </select>
                  <svg className="select-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </div>
              </div>
            )}

            <button type="submit" className="btn-submit">
              {isPatientPortal ? "Sign In to Patient Portal" : "Secure Sign In"}
            </button>

            {(isPatientPortal || userRole === 'patient') && (
              <div style={{ marginTop: '16px', padding: '12px 14px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '12.5px', color: '#475569', textAlign: 'center', lineHeight: 1.5 }}>
                🏥 <strong>New Patient?</strong> Patient accounts & Unique Health IDs are issued exclusively through the <strong>Hospital Reception Desk</strong>. Upon registration, your access credentials and welcome email are automatically sent to your inbox.
              </div>
            )}
          </form>
        ) : (
          <form className="auth-form" onSubmit={handleRegisterSubmit}>
            <div className="form-group">
              <label>Full Name</label>
              <div className="input-wrapper">
                <svg className="input-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
                <input 
                  type="text" 
                  placeholder="Enter staff full name" 
                  required 
                  value={regFullName}
                  onChange={(e) => setRegFullName(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Email Address</label>
              <div className="input-wrapper">
                <svg className="input-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                  <polyline points="22,6 12,13 2,6"></polyline>
                </svg>
                <input 
                  type="email" 
                  placeholder="Enter official email address" 
                  required 
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                />
              </div>
            </div>
            
            <div className="form-group">
              <label>Password</label>
              <div className="input-wrapper">
                <svg className="input-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
                <input 
                  type={showPassword ? "text" : "password"} 
                  placeholder="Enter secure password" 
                  required 
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  style={{ paddingRight: '40px' }} 
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)} 
                  style={{ position: 'absolute', right: '14px', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, zIndex: 3 }}
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                      <line x1="1" y1="1" x2="23" y2="23"></line>
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                      <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {(!isPatientPortal && !isMobileOrPWA) && (
              <div className="form-group">
                <label>Staff Department / Role</label>
                <div className="select-wrapper">
                  <select required value={userRole} onChange={(e) => setUserRole(e.target.value)}>
                    <option value="" disabled hidden>Select staff role</option>
                    <option value="doctor">Doctor Portal</option>
                    <option value="laboratory">Laboratory Portal</option>
                    <option value="pharmacist">Pharmacist Portal</option>
                    <option value="receptionist">Receptionist Portal</option>
                    <option value="cash_counter">Cash Counter Portal</option>
                    <option value="admin">Admin Portal</option>
                    <option value="insurance_agent">Insurance / TPA Portal</option>
                  </select>
                  <svg className="select-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </div>
              </div>
            )}

            <button type="submit" className="btn-submit">
              Register Hospital Staff Account
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default App;
