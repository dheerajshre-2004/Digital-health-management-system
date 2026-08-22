import React, { useState, useEffect } from 'react';
import './index.css';
import Dashboard from './Dashboard';
import PatientDashboard from './PatientDashboard';
import ReceptionistDashboard from './ReceptionistDashboard';
import LaboratoryDashboard from './LaboratoryDashboard';
import PharmacistDashboard from './PharmacistDashboard';
import CashCounterDashboard from './CashCounterDashboard';
import InsuranceDashboard from './InsuranceDashboard';

function App() {
  const isPatientOnly = new URLSearchParams(window.location.search).get('portal') === 'patient';
  const isMobileOrPWA = isPatientOnly || 
                        window.matchMedia('(display-mode: standalone)').matches || 
                        window.navigator.standalone || 
                        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
                        window.innerWidth <= 768;

  const [activeTab, setActiveTab] = useState('signin');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState('patient');
  const [loggedInPatient, setLoggedInPatient] = useState(null);
  const [loggedInDoctor, setLoggedInDoctor] = useState(null);
  const [loggedInStaff, setLoggedInStaff] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    // Restore active session if it exists in localStorage
    const savedSession = localStorage.getItem('dhms_active_session');
    if (savedSession) {
      try {
        const session = JSON.parse(savedSession);
        if (isMobileOrPWA) {
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
    } else if (isMobileOrPWA) {
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

  useEffect(() => {
    const handleStorageChange = () => {
      const savedSession = localStorage.getItem('dhms_active_session');
      if (savedSession) {
        try {
          const session = JSON.parse(savedSession);
          if (isMobileOrPWA) {
            if (session.role === 'patient') {
              setUserRole('patient');
              setLoggedInPatient(session.user);
              setIsAuthenticated(true);
            } else {
              setUserRole('patient');
              setIsAuthenticated(false);
              setLoggedInPatient(null);
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
          console.error("Failed to restore session on storage change:", err);
        }
      } else {
        setIsAuthenticated(false);
        setLoggedInPatient(null);
        setLoggedInDoctor(null);
        setLoggedInStaff(null);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [isMobileOrPWA]);

  const handleAuthSubmit = (e) => {
    e.preventDefault();
    const inputs = e.target.querySelectorAll('input');
    const emailVal = inputs[0]?.value || '';
    const passwordVal = inputs[1]?.value || '';
    
    if (userRole === 'patient') {
      const patientsList = JSON.parse(localStorage.getItem('dhms_patients') || '[]');
      const matched = patientsList.find(p => p.id?.toLowerCase() === emailVal.trim().toLowerCase() || p.email?.toLowerCase() === emailVal.trim().toLowerCase());
      if (matched) {
        if (matched.password && matched.password !== passwordVal) {
          alert('Incorrect password. Please try again.');
          return;
        }
        setLoggedInPatient(matched);
        setIsAuthenticated(true);
        localStorage.setItem('dhms_active_session', JSON.stringify({ role: 'patient', user: matched }));
      } else {
        alert('Patient account not found. Please verify your Patient ID.');
      }
    } else if (userRole === 'doctor') {
      const doctorsList = JSON.parse(localStorage.getItem('dhms_doctors') || '[]');
      const matched = doctorsList.find(d => d.email?.toLowerCase() === emailVal.toLowerCase());
      if (matched) {
        if (matched.password && matched.password !== passwordVal) {
          alert('Incorrect password. Please try again.');
          return;
        }
        setLoggedInDoctor(matched);
        setIsAuthenticated(true);
        localStorage.setItem('dhms_active_session', JSON.stringify({ role: 'doctor', user: matched }));
      } else {
        alert('Doctor account not found. Please register first.');
      }
    } else if (userRole === 'receptionist') {
      const staffList = JSON.parse(localStorage.getItem('dhms_receptionist_staff') || '[]');
      const matched = staffList.find(s => s.email?.toLowerCase() === emailVal.toLowerCase());
      if (matched) {
        if (matched.password && matched.password !== passwordVal) {
          alert('Incorrect password. Please try again.');
          return;
        }
        setLoggedInStaff(matched);
        setIsAuthenticated(true);
        localStorage.setItem('dhms_active_session', JSON.stringify({ role: 'receptionist', user: matched }));
      } else {
        alert('Receptionist account not found. Please register first.');
      }
    } else if (userRole === 'laboratory') {
      const staffList = JSON.parse(localStorage.getItem('dhms_laboratory_staff') || '[]');
      const matched = staffList.find(s => s.email?.toLowerCase() === emailVal.toLowerCase());
      if (matched) {
        if (matched.password && matched.password !== passwordVal) {
          alert('Incorrect password. Please try again.');
          return;
        }
        setLoggedInStaff(matched);
        setIsAuthenticated(true);
        localStorage.setItem('dhms_active_session', JSON.stringify({ role: 'laboratory', user: matched }));
      } else {
        alert('Laboratory staff account not found. Please register first.');
      }
    } else if (userRole === 'pharmacist') {
      const staffList = JSON.parse(localStorage.getItem('dhms_pharmacy_staff') || '[]');
      const matched = staffList.find(s => s.email?.toLowerCase() === emailVal.toLowerCase());
      if (matched) {
        if (matched.password && matched.password !== passwordVal) {
          alert('Incorrect password. Please try again.');
          return;
        }
        setLoggedInStaff(matched);
        setIsAuthenticated(true);
        localStorage.setItem('dhms_active_session', JSON.stringify({ role: 'pharmacist', user: matched }));
      } else {
        alert('Pharmacy staff account not found. Please register first.');
      }
    } else if (userRole === 'cash_counter') {
      const staffList = JSON.parse(localStorage.getItem('dhms_cashier_staff') || '[]');
      const matched = staffList.find(s => s.email?.toLowerCase() === emailVal.toLowerCase());
      if (matched) {
        if (matched.password && matched.password !== passwordVal) {
          alert('Incorrect password. Please try again.');
          return;
        }
        setLoggedInStaff(matched);
        setIsAuthenticated(true);
        localStorage.setItem('dhms_active_session', JSON.stringify({ role: 'cash_counter', user: matched }));
      } else {
        alert('Cash counter staff account not found. Please register first.');
      }
    } else if (userRole === 'admin') {
      const savedAdmin = localStorage.getItem('dhms_admin');
      if (savedAdmin) {
        const adminObj = JSON.parse(savedAdmin);
        if (adminObj.email.toLowerCase() === emailVal.toLowerCase() && adminObj.password === passwordVal) {
          setIsAuthenticated(true);
          localStorage.setItem('dhms_active_session', JSON.stringify({ role: 'admin', user: { name: 'System Administrator', email: emailVal } }));
        } else {
          alert('Incorrect Administrator credentials. Access denied.');
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
        setIsAuthenticated(true);
        localStorage.setItem('dhms_active_session', JSON.stringify({ role: 'admin', user: newAdmin }));
      }
    } else {
      // Allow other roles (like insurance_agent) to log in directly
      setIsAuthenticated(true);
      localStorage.setItem('dhms_active_session', JSON.stringify({ role: userRole, user: { email: emailVal } }));
    }
  };

  const handleRegisterSubmit = (e) => {
    e.preventDefault();
    const nameVal = e.target.querySelector('input[placeholder="Enter your full name"]')?.value || '';
    const emailVal = e.target.querySelector('input[type="email"]')?.value || '';
    const passwordVal = e.target.querySelector('input[type="password"]')?.value || '';
    
    const nameParts = nameVal.trim().split(/\s+/);
    const firstName = nameParts[0] || 'Unknown';
    const lastName = nameParts.slice(1).join(' ') || 'User';

    if (userRole === 'patient') {
      const patientsList = JSON.parse(localStorage.getItem('dhms_patients') || '[]');
      if (patientsList.some(p => p.email?.toLowerCase() === emailVal.toLowerCase())) {
        alert('Account already exists with this email.');
        return;
      }
      const newId = `PT-${Math.floor(10000 + Math.random() * 90000)}`;
      const newPatient = {
        id: newId,
        firstName,
        lastName,
        email: emailVal,
        password: passwordVal,
        dob: '1990-01-01', // Default, can be updated in dashboard
        gender: 'other',
        phone: '',
        reports: []
      };
      const updated = [newPatient, ...patientsList];
      localStorage.setItem('dhms_patients', JSON.stringify(updated));
      alert(`Patient account created successfully! Your ID is ${newId}. Please sign in to access your portal.`);
      setActiveTab('signin');
    } else if (userRole === 'doctor') {
      const doctorsList = JSON.parse(localStorage.getItem('dhms_doctors') || '[]');
      if (doctorsList.some(d => d.email?.toLowerCase() === emailVal.toLowerCase())) {
        alert('Account already exists with this email.');
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
      alert(`Doctor account registered successfully! ID: ${newId}. Please sign in to access your portal.`);
      setActiveTab('signin');
    } else if (userRole === 'receptionist') {
      const staffList = JSON.parse(localStorage.getItem('dhms_receptionist_staff') || '[]');
      if (staffList.some(s => s.email?.toLowerCase() === emailVal.toLowerCase())) {
        alert('Account already exists with this email.');
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
      alert(`Receptionist account registered successfully! ID: ${newId}. Please sign in to access your portal.`);
      setActiveTab('signin');
    } else if (userRole === 'laboratory') {
      const staffList = JSON.parse(localStorage.getItem('dhms_laboratory_staff') || '[]');
      if (staffList.some(s => s.email?.toLowerCase() === emailVal.toLowerCase())) {
        alert('Account already exists with this email.');
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
      alert(`Laboratory staff account registered successfully! ID: ${newId}. Please sign in to access your portal.`);
      setActiveTab('signin');
    } else if (userRole === 'pharmacist') {
      const staffList = JSON.parse(localStorage.getItem('dhms_pharmacy_staff') || '[]');
      if (staffList.some(s => s.email?.toLowerCase() === emailVal.toLowerCase())) {
        alert('Account already exists with this email.');
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
      alert(`Pharmacy staff account registered successfully! ID: ${newId}. Please sign in to access your portal.`);
      setActiveTab('signin');
    } else if (userRole === 'cash_counter') {
      const staffList = JSON.parse(localStorage.getItem('dhms_cashier_staff') || '[]');
      if (staffList.some(s => s.email?.toLowerCase() === emailVal.toLowerCase())) {
        alert('Account already exists with this email.');
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
      alert(`Cash counter staff account registered successfully! ID: ${newId}. Please sign in to access your portal.`);
      setActiveTab('signin');
    } else {
      alert('Registration successful! Please sign in using your account credentials.');
      setActiveTab('signin');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('dhms_active_session');
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
        <h1>Welcome to <span className="highlight">DHMS</span></h1>
        <p>{isMobileOrPWA ? "Secure Patient Portal Access" : "Secure access portal for patients, doctors, and administrators"}</p>
      </div>

      <div className="auth-card">
        {(!isPatientOnly && !isMobileOrPWA) && (
          <div className="tabs-container">
            <button 
              className={`tab ${activeTab === 'signin' ? 'active' : ''}`}
              onClick={() => setActiveTab('signin')}
            >
              Sign In
            </button>
            <button 
              className={`tab ${activeTab === 'register' ? 'active' : ''}`}
              onClick={() => setActiveTab('register')}
            >
              Register Account
            </button>
          </div>
        )}

        {activeTab === 'signin' ? (
          <form className="auth-form" onSubmit={handleAuthSubmit}>
            <div className="form-group">
              <label>{userRole === 'patient' ? 'Patient ID' : 'Email Address'}</label>
              <div className="input-wrapper">
                {userRole === 'patient' ? (
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
                  type={userRole === 'patient' ? "text" : "email"} 
                  placeholder={userRole === 'patient' ? "Enter Patient ID (e.g., PT-101)" : "Enter email address"} 
                  required 
                  onInput={(e) => {
                    if (userRole === 'patient') {
                      e.target.value = e.target.value.toUpperCase();
                    }
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
                <input type={showPassword ? "text" : "password"} placeholder="Enter password" required style={{ paddingRight: '40px' }} />
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

            {(!isPatientOnly && !isMobileOrPWA) && (
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

            <button type="submit" className="btn-submit">Secure Sign In</button>
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
                <input type="text" placeholder="Enter your full name" required />
              </div>
            </div>

            <div className="form-group">
              <label>Email Address</label>
              <div className="input-wrapper">
                <svg className="input-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                  <polyline points="22,6 12,13 2,6"></polyline>
                </svg>
                <input type="email" placeholder="Enter email address" required />
              </div>
            </div>
            
            <div className="form-group">
              <label>Password</label>
              <div className="input-wrapper">
                <svg className="input-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
                <input type={showPassword ? "text" : "password"} placeholder="Enter password" required style={{ paddingRight: '40px' }} />
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

            {!isMobileOrPWA && (
              <div className="form-group">
                <label>System Role</label>
                <div className="select-wrapper">
                  <select required value={userRole} onChange={(e) => setUserRole(e.target.value)}>
                    <option value="" disabled hidden>Select a role</option>
                    <option value="patient">Patient Portal</option>
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

            <button type="submit" className="btn-submit">Create Encrypted Account</button>
          </form>
        )}
      </div>
    </div>
  );
}

export default App;
