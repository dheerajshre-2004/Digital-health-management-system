import React, { useState, useEffect } from 'react';
import './index.css';
import Dashboard from './Dashboard';
import PatientDashboard from './PatientDashboard';
import ReceptionistDashboard from './ReceptionistDashboard';
import LaboratoryDashboard from './LaboratoryDashboard';
import PharmacistDashboard from './PharmacistDashboard';
import CashCounterDashboard from './CashCounterDashboard';
import InsuranceDashboard from './InsuranceDashboard';
import TriageDashboard from './TriageDashboard';
import { sendPatientWelcomeEmail, openDefaultMailClient } from './emailService';
import { t } from './i18nService';
import { supabase } from './supabaseClient';
import { pushToSupabase } from './supabaseSync';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '40px', textAlign: 'center', fontFamily: 'sans-serif' }}>
          <h2 style={{ color: '#b91c1c' }}>Something went wrong loading this portal module.</h2>
          <pre style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #cbd5e1', display: 'inline-block', textAlign: 'left', maxWidth: '800px', overflowX: 'auto' }}>
            {this.state.error?.toString()}
          </pre>
          <div style={{ marginTop: '20px' }}>
            <button 
              onClick={() => {
                sessionStorage.clear();
                localStorage.removeItem('dhms_user_session');
                window.location.reload();
              }}
              style={{ padding: '10px 20px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
            >
              Reset Session & Reload
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function App() {
  // Detection for Patient Portal vs Staff Portal (Strictly isolated by Vercel deployment URL / Env)
  const isPWA = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
  const urlParams = new URLSearchParams(window.location.search);
  const portalParam = urlParams.get('portal');
  const roleParam = urlParams.get('role');
  const hostname = window.location.hostname.toLowerCase();
  
  // Patient Portal is strictly determined by Vercel deployment mode (VITE_APP_MODE=patient), patient domain, or PWA
  const isPatientPortal = 
    import.meta.env.VITE_APP_MODE === 'patient' ||
    hostname.includes('patient') ||
    hostname.includes('myhealth') ||
    portalParam === 'patient' ||
    window.location.pathname.startsWith('/patient') ||
    (isPWA && portalParam !== 'staff');

  // Clean up any legacy cross-tab localStorage sessions so new tabs don't accidentally load old logins
  useEffect(() => {
    localStorage.removeItem('dhms_user_session');
    localStorage.removeItem('dhms_staff_session');
    localStorage.removeItem('dhms_patient_session');
  }, []);

  // Strict Tab & Module Isolation: sessions are strictly isolated per tab in sessionStorage
  const getInitialTabSession = () => {
    try {
      const tabSessionStr = sessionStorage.getItem('dhms_tab_session');
      if (tabSessionStr) {
        const parsed = JSON.parse(tabSessionStr);
        if (parsed && parsed.role) {
          if (isPatientPortal && parsed.role === 'patient') {
            return parsed;
          }
          if (!isPatientPortal && parsed.role !== 'patient') {
            return parsed;
          }
        }
      }
    } catch (e) {}
    return null;
  };

  const initialSession = getInitialTabSession();

  const [activeTab, setActiveTab] = useState('signin');
  const [isAuthenticated, setIsAuthenticated] = useState(() => !!initialSession?.role);
  const [userRole, setUserRole] = useState(() => initialSession?.role || (isPatientPortal ? 'patient' : (roleParam || 'doctor')));
  const [loggedInDoctor, setLoggedInDoctor] = useState(() => initialSession?.role === 'doctor' ? initialSession.user : null);
  const [loggedInStaff, setLoggedInStaff] = useState(() => (initialSession && initialSession.role !== 'patient' && initialSession.role !== 'doctor') ? initialSession.user : null);
  const [loggedInPatient, setLoggedInPatient] = useState(() => initialSession?.role === 'patient' ? initialSession.user : null);
  const [showPassword, setShowPassword] = useState(false);
  const [registrationSuccessData, setRegistrationSuccessData] = useState(null);

  // Controlled Input States for Sign In and Registration
  const [signInIdentifier, setSignInIdentifier] = useState('');
  const [signInPassword, setSignInPassword] = useState('');
  const [regFullName, setRegFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regDob, setRegDob] = useState('');
  const [regGender, setRegGender] = useState('male');
  const [regBloodGroup, setRegBloodGroup] = useState('O+');
  const [regDoctorDept, setRegDoctorDept] = useState('Cardiology & Intensive Cardiac Care');
  const [regDoctorFee, setRegDoctorFee] = useState('500');

  const clearAuthFields = () => {
    setSignInIdentifier('');
    setSignInPassword('');
    setRegFullName('');
    setRegEmail('');
    setRegPassword('');
    setRegPhone('');
    setRegDob('');
  };

  const saveTabSession = (sessionData) => {
    // Strictly save session in sessionStorage for THIS tab only
    sessionStorage.setItem('dhms_tab_session', JSON.stringify(sessionData));
  };

  const clearTabSession = () => {
    sessionStorage.removeItem('dhms_tab_session');
    sessionStorage.removeItem('dhms_active_session');
  };

  const handleRoleChange = (newRole) => {
    setUserRole(newRole);
  };

  useEffect(() => {
    const session = getInitialTabSession();
    if (session && session.role) {
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
  }, []);

  // Helper to get fresh data from localStorage or fallback to Supabase table
  const getFreshList = async (key) => {
    let list = [];
    try {
      list = JSON.parse(localStorage.getItem(key) || '[]');
    } catch (e) {
      list = [];
    }

    if ((!list || list.length === 0) && supabase && supabase.from) {
      try {
        const { data } = await supabase.from('dhms_store').select('value').eq('key', key).maybeSingle();
        if (data && data.value) {
          const remoteList = typeof data.value === 'string' ? JSON.parse(data.value) : data.value;
          if (Array.isArray(remoteList) && remoteList.length > 0) {
            list = remoteList;
            localStorage.setItem(key, JSON.stringify(remoteList));
          }
        }
      } catch (err) {
        console.warn(`[App] Error fetching fresh list for ${key}:`, err);
      }
    }
    return list;
  };

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    const emailVal = signInIdentifier.trim();
    const passwordVal = signInPassword;
    
    if (userRole === 'patient' || isPatientPortal) {
      const inputClean = emailVal.trim();
      const inputLower = inputClean.toLowerCase();
      const inputDigits = inputClean.replace(/\D/g, '').replace(/^91|^0/, ''); // Normalize Indian mobile digits
      
      let patientsList = await getFreshList('dhms_patients');
      
      const findMatch = (list) => list.find(p => {
        // 1. Match by Patient ID (case-insensitive: PT-12345 or PAT-1001)
        if (p.id && p.id.toLowerCase() === inputLower) return true;
        
        // 2. Match by Email (case-insensitive)
        if (p.email && p.email !== 'N/A' && p.email.toLowerCase() === inputLower) return true;
        
        // 3. Match by Mobile / Phone Number (normalized digits comparison)
        if (inputDigits.length >= 10 && p.phone) {
          const pDigits = (p.phone || '').replace(/\D/g, '').replace(/^91|^0/, '');
          if (pDigits && pDigits === inputDigits) return true;
        }
        
        // 4. Match by Full Name (case-insensitive fallback)
        const fullName = `${p.firstName || ''} ${p.lastName || ''}`.trim().toLowerCase() || (p.name || '').toLowerCase();
        if (fullName && fullName === inputLower) return true;
        
        return false;
      });

      let matched = findMatch(patientsList);

      // If still not matched, force query latest Supabase record directly
      if (!matched && supabase && supabase.from) {
        try {
          const { data } = await supabase.from('dhms_store').select('value').eq('key', 'dhms_patients').maybeSingle();
          if (data && data.value) {
            const remoteList = typeof data.value === 'string' ? JSON.parse(data.value) : data.value;
            if (Array.isArray(remoteList)) {
              localStorage.setItem('dhms_patients', JSON.stringify(remoteList));
              matched = findMatch(remoteList);
            }
          }
        } catch (err) {}
      }

      if (matched) {
        if (matched.password && matched.password !== passwordVal) {
          alert('Incorrect password. Please try again.');
          setSignInPassword('');
          return;
        }
        clearAuthFields();
        setLoggedInPatient(matched);
        setUserRole('patient');
        setIsAuthenticated(true);
        saveTabSession({ role: 'patient', user: matched });
      } else {
        alert('Patient record not found. Please verify your Patient ID (e.g. PT-10001), Registered Email, or 10-digit Mobile Number.');
        setSignInPassword('');
      }
    } else if (userRole === 'doctor') {
      let doctorsList = await getFreshList('dhms_doctors');
      const findDoc = (list) => list.find(d => 
        (d.email && d.email.toLowerCase() === emailVal.toLowerCase()) ||
        (d.name && d.name.toLowerCase() === emailVal.toLowerCase()) ||
        (d.id && d.id.toLowerCase() === emailVal.toLowerCase())
      );
      let matched = findDoc(doctorsList);

      if (!matched && supabase && supabase.from) {
        try {
          const { data } = await supabase.from('dhms_store').select('value').eq('key', 'dhms_doctors').maybeSingle();
          if (data && data.value) {
            const remoteList = typeof data.value === 'string' ? JSON.parse(data.value) : data.value;
            if (Array.isArray(remoteList)) {
              localStorage.setItem('dhms_doctors', JSON.stringify(remoteList));
              matched = findDoc(remoteList);
            }
          }
        } catch (err) {}
      }

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
    } else if (['receptionist', 'laboratory', 'pharmacist', 'cash_counter', 'triage'].includes(userRole)) {
      const storeKeyMap = {
        receptionist: 'dhms_receptionist_staff',
        laboratory: 'dhms_laboratory_staff',
        pharmacist: 'dhms_pharmacy_staff',
        cash_counter: 'dhms_cashier_staff',
        triage: 'dhms_triage_staff'
      };
      const storeKey = storeKeyMap[userRole];
      let staffList = await getFreshList(storeKey);
      const findStaff = (list) => list.find(s => 
        (s.email && s.email.toLowerCase() === emailVal.toLowerCase()) ||
        (s.name && s.name.toLowerCase() === emailVal.toLowerCase()) ||
        (s.id && s.id.toLowerCase() === emailVal.toLowerCase())
      );
      let matched = findStaff(staffList);

      if (!matched && supabase && supabase.from) {
        try {
          const { data } = await supabase.from('dhms_store').select('value').eq('key', storeKey).maybeSingle();
          if (data && data.value) {
            const remoteList = typeof data.value === 'string' ? JSON.parse(data.value) : data.value;
            if (Array.isArray(remoteList)) {
              localStorage.setItem(storeKey, JSON.stringify(remoteList));
              matched = findStaff(remoteList);
            }
          }
        } catch (err) {}
      }

      if (matched) {
        if (matched.password && matched.password !== passwordVal) {
          alert('Incorrect password. Please try again.');
          setSignInPassword('');
          return;
        }
        clearAuthFields();
        setLoggedInStaff(matched);
        setIsAuthenticated(true);
        saveTabSession({ role: userRole, user: matched });
      } else {
        alert(`${userRole.charAt(0).toUpperCase() + userRole.slice(1).replace('_', ' ')} account not found. Please register first.`);
        setSignInPassword('');
      }
    } else if (userRole === 'admin') {
      let savedAdmin = localStorage.getItem('dhms_admin');
      if (!savedAdmin && supabase && supabase.from) {
        try {
          const { data } = await supabase.from('dhms_store').select('value').eq('key', 'dhms_admin').maybeSingle();
          if (data && data.value) {
            savedAdmin = typeof data.value === 'string' ? data.value : JSON.stringify(data.value);
            localStorage.setItem('dhms_admin', savedAdmin);
          }
        } catch (err) {}
      }

      if (savedAdmin) {
        const adminObj = JSON.parse(savedAdmin);
        if (adminObj.email?.toLowerCase() === emailVal.toLowerCase() && adminObj.password === passwordVal) {
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
        await pushToSupabase('dhms_admin', newAdmin);
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
    
    if (!/^[a-zA-Z\s.-]+$/.test(nameVal)) {
      alert('Full Name must contain only letters and spaces (no numbers).');
      return;
    }

    if (regPhone && regPhone.replace(/\D/g, '').length < 10) {
      alert('Contact Number must contain 10 numeric digits (no letters).');
      return;
    }

    const nameParts = nameVal.split(/\s+/);
    const firstName = nameParts[0] || 'Unknown';
    const lastName = nameParts.slice(1).join(' ') || 'User';

    if (userRole === 'patient' || isPatientPortal) {
      const patientsList = await getFreshList('dhms_patients');
      if (patientsList.some(p => p.email && p.email.toLowerCase() === emailVal.toLowerCase())) {
        alert('A patient account already exists with this email address.');
        return;
      }
      const newId = `PAT-${Math.floor(1000 + Math.random() * 9000)}`;
      const newPatient = {
        id: newId,
        name: nameVal,
        firstName: firstName,
        lastName: lastName,
        email: emailVal,
        phone: regPhone || '9876543210',
        dob: regDob || '1995-01-01',
        gender: regGender || 'Male',
        bloodType: regBloodGroup || 'O+',
        bloodGroup: regBloodGroup || 'O+',
        allergies: 'None reported',
        chronicConditions: 'None',
        password: passwordVal,
        clinicalHistory: [],
        reports: [],
        createdAt: new Date().toISOString()
      };
      const updated = [newPatient, ...patientsList];
      localStorage.setItem('dhms_patients', JSON.stringify(updated));
      await pushToSupabase('dhms_patients', updated);

      await sendPatientWelcomeEmail({
        patientName: nameVal,
        email: emailVal,
        patientId: newId,
        password: passwordVal,
        phone: regPhone
      });

      setRegistrationSuccessData({
        role: 'patient',
        name: nameVal,
        email: emailVal,
        id: newId,
        password: passwordVal
      });
      clearAuthFields();
    } else if (userRole === 'doctor') {
      const doctorsList = await getFreshList('dhms_doctors');
      if (doctorsList.some(d => d.email?.toLowerCase() === emailVal.toLowerCase())) {
        alert('An account already exists with this email.');
        return;
      }
      const newId = `dr_${firstName.toLowerCase()}_${Math.floor(100 + Math.random() * 900)}`;
      const newDoc = {
        id: newId,
        name: `Dr. ${firstName} ${lastName}`,
        department: regDoctorDept || 'Cardiology & Intensive Cardiac Care',
        specialty: regDoctorDept || 'Cardiology & Intensive Cardiac Care',
        status: 'Available',
        email: emailVal,
        password: passwordVal,
        phone: regPhone || '+91 98765 43210',
        consultationFee: parseFloat(regDoctorFee) || 500
      };
      const updated = [newDoc, ...doctorsList];
      localStorage.setItem('dhms_doctors', JSON.stringify(updated));
      await pushToSupabase('dhms_doctors', updated);

      // Also ensure this department exists in dhms_departments so admin/portals recognize it
      const savedDepts = JSON.parse(localStorage.getItem('dhms_departments') || '[]');
      if (regDoctorDept && !savedDepts.some(d => d.name?.toLowerCase() === regDoctorDept.toLowerCase())) {
        const newDeptObj = {
          id: savedDepts.length + 1,
          name: regDoctorDept,
          code: regDoctorDept.substring(0, 4).toUpperCase(),
          head: newDoc.name
        };
        const updatedDepts = [...savedDepts, newDeptObj];
        localStorage.setItem('dhms_departments', JSON.stringify(updatedDepts));
        await pushToSupabase('dhms_departments', updatedDepts);
      }

      await sendPatientWelcomeEmail({
        patientName: `Dr. ${firstName} ${lastName}`,
        email: emailVal,
        patientId: newId,
        password: passwordVal,
        phone: regPhone || ''
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
      const staffList = await getFreshList('dhms_receptionist_staff');
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
      await pushToSupabase('dhms_receptionist_staff', updated);

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
      const staffList = await getFreshList('dhms_laboratory_staff');
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
      await pushToSupabase('dhms_laboratory_staff', updated);

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
      const staffList = await getFreshList('dhms_pharmacy_staff');
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
      await pushToSupabase('dhms_pharmacy_staff', updated);

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
      const staffList = await getFreshList('dhms_cashier_staff');
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
      await pushToSupabase('dhms_cashier_staff', updated);

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
    } else if (userRole === 'triage') {
      const staffList = await getFreshList('dhms_triage_staff');
      if (staffList.some(s => s.email?.toLowerCase() === emailVal.toLowerCase())) {
        alert('An account already exists with this email.');
        return;
      }
      const newId = `NUR-${Math.floor(100 + Math.random() * 900)}`;
      const newStaff = {
        id: newId,
        name: nameVal,
        role: 'Triage / OPD Staff Nurse',
        email: emailVal,
        password: passwordVal,
        status: 'Available'
      };
      const updated = [newStaff, ...staffList];
      localStorage.setItem('dhms_triage_staff', JSON.stringify(updated));
      await pushToSupabase('dhms_triage_staff', updated);

      await sendPatientWelcomeEmail({
        patientName: nameVal,
        email: emailVal,
        patientId: newId,
        password: passwordVal,
        phone: ''
      });

      setRegistrationSuccessData({
        role: 'triage',
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
    setLoggedInDoctor(null);
    setLoggedInStaff(null);
    setLoggedInPatient(null);
  };

  if (isAuthenticated) {
    return (
      <ErrorBoundary>
        {userRole === 'cash_counter' && (
          <CashCounterDashboard onLogout={handleLogout} loggedInStaff={loggedInStaff} />
        )}
        {userRole === 'receptionist' && (
          <ReceptionistDashboard onLogout={handleLogout} loggedInStaff={loggedInStaff} />
        )}
        {userRole === 'laboratory' && (
          <LaboratoryDashboard onLogout={handleLogout} loggedInStaff={loggedInStaff} />
        )}
        {userRole === 'pharmacist' && (
          <PharmacistDashboard onLogout={handleLogout} loggedInStaff={loggedInStaff} />
        )}
        {userRole === 'triage' && (
          <TriageDashboard onLogout={handleLogout} loggedInStaff={loggedInStaff} />
        )}
        {userRole === 'insurance_agent' && (
          <InsuranceDashboard onLogout={handleLogout} />
        )}
        {(userRole === 'patient' || (isPatientPortal && userRole !== 'doctor' && userRole !== 'admin' && userRole !== 'cash_counter' && userRole !== 'receptionist' && userRole !== 'laboratory' && userRole !== 'pharmacist' && userRole !== 'triage' && userRole !== 'insurance_agent')) && (
          <PatientDashboard onLogout={handleLogout} loggedInPatient={loggedInPatient} />
        )}
        {(userRole === 'doctor' || userRole === 'admin') && (
          <Dashboard onLogout={handleLogout} role={userRole} loggedInDoctor={loggedInDoctor} />
        )}
      </ErrorBoundary>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-header">
        <h1>{t('welcome')} <span className="highlight">DHMS</span></h1>
        <p>
          {isPatientPortal 
            ? t('patientPortal') + " — " + t('appName') 
            : t('staffPortal') + " — " + t('hospitalName')}
        </p>
      </div>

      <div className="auth-card">
        <div className="tabs-container">
          <button 
            className={`tab ${activeTab === 'signin' ? 'active' : ''}`}
            onClick={() => {
              clearAuthFields();
              setActiveTab('signin');
            }}
            style={isPatientPortal ? { flex: 1 } : {}}
          >
            {isPatientPortal ? 'Patient Sign In' : 'Sign In'}
          </button>
          {!isPatientPortal && (
            <button 
              className={`tab ${activeTab === 'register' ? 'active' : ''}`}
              onClick={() => {
                clearAuthFields();
                setActiveTab('register');
              }}
            >
              Staff Registration
            </button>
          )}
        </div>

        {registrationSuccessData ? (
          <div style={{ textAlign: 'center', padding: '10px 0', animation: 'fadeIn 0.3s ease' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#dcfce7', color: '#15803d', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', margin: '0 auto 16px auto' }}>
              ✓
            </div>
            
            <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a', margin: '0 0 8px 0' }}>Registration Successful!</h2>
            
            <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '10px', padding: '12px 16px', marginBottom: '16px', textAlign: 'left' }}>
              <p style={{ margin: 0, fontSize: '13px', color: '#1e40af' }}>
                📧 <strong>{registrationSuccessData.role === 'patient' ? 'Patient' : 'Staff'} Credentials Dispatched:</strong> A welcome email containing your {registrationSuccessData.role === 'patient' ? 'Patient ID' : 'Staff ID'} and portal access credentials has been sent to <strong>{registrationSuccessData.email}</strong>.
              </p>
            </div>

            <div style={{ background: '#f8fafc', border: '2px dashed #93c5fd', borderRadius: '10px', padding: '16px 20px', textAlign: 'left', marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13.5px' }}>
                <span style={{ color: '#64748b' }}>{registrationSuccessData.role === 'patient' ? 'Patient ID / UHID:' : 'Staff ID / Identifier:'}</span>
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
                  setSignInIdentifier(registrationSuccessData.email || registrationSuccessData.id);
                  setSignInPassword(registrationSuccessData.password);
                  handleRoleChange(registrationSuccessData.role || (isPatientPortal ? 'patient' : 'doctor'));
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
                  padding: '8px 16px',
                  background: 'white',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  color: '#334155',
                  fontWeight: '600',
                  fontSize: '12.5px',
                  cursor: 'pointer'
                }}
              >
                ✉️ Open Credentials in Mail Client
              </button>
            </div>
          </div>
        ) : activeTab === 'signin' ? (
          <form className="auth-form" onSubmit={handleAuthSubmit}>
            <div className="form-group">
              <label>{isPatientPortal ? 'Patient ID (UHID) / Email / Mobile Number' : 'Email Address / Staff ID'}</label>
              <div className="input-wrapper">
                <svg className="input-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                  <polyline points="22,6 12,13 2,6"></polyline>
                </svg>
                <input 
                  type="text" 
                  placeholder={isPatientPortal ? "e.g. PT-10001, email@example.com or 9876543210" : "Enter registered email address or ID"} 
                  required 
                  value={signInIdentifier}
                  onChange={(e) => setSignInIdentifier(e.target.value)}
                />
              </div>
              {isPatientPortal && (
                <p style={{ margin: '6px 0 0 0', fontSize: '11.5px', color: '#64748b' }}>
                  ℹ️ <em>You can log in using your <strong>Patient ID (UHID)</strong>, <strong>Registered Email</strong>, or <strong>10-digit Mobile Number</strong> generated by the Reception Desk.</em>
                </p>
              )}
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
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8z"></path>
                      <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {!isPatientPortal && (
              <div className="form-group">
                <label>Login As</label>
                <div className="select-wrapper">
                  <select required value={userRole} onChange={(e) => handleRoleChange(e.target.value)}>
                    <option value="" disabled hidden>Select a role</option>
                    <option value="doctor">Doctor</option>
                    <option value="triage">OPD Triage / Nursing Station</option>
                    <option value="receptionist">Receptionist</option>
                    <option value="laboratory">Laboratory</option>
                    <option value="pharmacist">Pharmacist</option>
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
              {isPatientPortal ? 'Sign In to Patient Portal' : 'Secure Sign In'}
            </button>
          </form>
        ) : isPatientPortal ? (
          <form className="auth-form" onSubmit={handleRegisterSubmit} autoComplete="off">
            <div className="form-group">
              <label>Full Legal Name</label>
              <div className="input-wrapper">
                <svg className="input-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
                <input 
                  type="text" 
                  autoComplete="off"
                  placeholder="Enter patient full name (letters only)" 
                  required 
                  value={regFullName}
                  onChange={(e) => setRegFullName(e.target.value.replace(/[^a-zA-Z\s.-]/g, ''))}
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
                  autoComplete="new-password"
                  name="dhms_new_reg_email"
                  placeholder="Enter email address" 
                  required 
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Mobile / Phone Number</label>
              <div className="input-wrapper">
                <svg className="input-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                </svg>
                <input 
                  type="tel" 
                  maxLength="10"
                  placeholder="Enter 10-digit mobile number" 
                  required 
                  value={regPhone}
                  onChange={(e) => setRegPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group">
                <label>Date of Birth</label>
                <input 
                  type="date" 
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px' }}
                  required 
                  value={regDob}
                  onChange={(e) => setRegDob(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Blood Group</label>
                <select 
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px' }}
                  value={regBloodGroup}
                  onChange={(e) => setRegBloodGroup(e.target.value)}
                >
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
                  autoComplete="new-password"
                  name="dhms_new_reg_pwd"
                  placeholder="Create password" 
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
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8z"></path>
                      <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <button type="submit" className="btn-submit">
              Register Patient Account
            </button>
          </form>
        ) : (
          <form className="auth-form" onSubmit={handleRegisterSubmit} autoComplete="off">
            <div className="form-group">
              <label>Full Name</label>
              <div className="input-wrapper">
                <svg className="input-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
                <input 
                  type="text" 
                  autoComplete="off"
                  placeholder="Enter staff full name (letters only)" 
                  required 
                  value={regFullName}
                  onChange={(e) => setRegFullName(e.target.value.replace(/[^a-zA-Z\s.-]/g, ''))}
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
                  autoComplete="new-password"
                  name="dhms_new_reg_email"
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
                  autoComplete="new-password"
                  name="dhms_new_reg_pwd"
                  placeholder="Create password" 
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
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8z"></path>
                      <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label>Staff Role</label>
              <div className="select-wrapper">
                <select required value={userRole} onChange={(e) => handleRoleChange(e.target.value)}>
                  <option value="" disabled hidden>Select staff role</option>
                  <option value="doctor">Doctor</option>
                  <option value="triage">OPD Triage / Nursing Station</option>
                  <option value="receptionist">Receptionist</option>
                  <option value="laboratory">Laboratory</option>
                  <option value="pharmacist">Pharmacist</option>
                  <option value="cash_counter">Cash Counter</option>
                  <option value="admin">Administrator</option>
                  <option value="insurance_agent">Insurance Agent / TPA</option>
                </select>
                <svg className="select-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </div>
            </div>

            {userRole === 'doctor' && (
              <>
                <div className="form-group">
                  <label>Medical Department / Specialty</label>
                  <div className="select-wrapper">
                    <select 
                      required 
                      value={regDoctorDept} 
                      onChange={(e) => setRegDoctorDept(e.target.value)}
                    >
                      <option value="Cardiology & Intensive Cardiac Care">Cardiology & Intensive Cardiac Care</option>
                      <option value="Neurology & Neurosurgery">Neurology & Neurosurgery</option>
                      <option value="Orthopedics & Joint Care">Orthopedics & Joint Care</option>
                      <option value="General & Internal Medicine">General & Internal Medicine</option>
                      <option value="Pediatrics & Neonatology">Pediatrics & Neonatology</option>
                      <option value="Oncology & Chemotherapy Wing">Oncology & Chemotherapy Wing</option>
                      <option value="Emergency & Trauma Care (24x7)">Emergency & Trauma Care (24x7)</option>
                      <option value="Dermatology & Cosmetology">Dermatology & Cosmetology</option>
                      <option value="Gastroenterology & Hepatology">Gastroenterology & Hepatology</option>
                      <option value="Nephrology & Urology">Nephrology & Urology</option>
                      <option value="Pulmonology & Critical Care">Pulmonology & Critical Care</option>
                      <option value="Obstetrics & Gynecology">Obstetrics & Gynecology</option>
                      <option value="Ophthalmology & Eye Surgery">Ophthalmology & Eye Surgery</option>
                      <option value="ENT & Head/Neck Surgery">ENT & Head/Neck Surgery</option>
                    </select>
                    <svg className="select-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label>Mobile Contact</label>
                    <input 
                      type="tel" 
                      maxLength="10"
                      placeholder="Enter 10-digit mobile number" 
                      value={regPhone} 
                      onChange={(e) => setRegPhone(e.target.value.replace(/\D/g, '').slice(0, 10))} 
                    />
                  </div>
                  <div className="form-group">
                    <label>Consultation Fee (₹)</label>
                    <input 
                      type="number" 
                      min="0"
                      step="50"
                      placeholder="500" 
                      value={regDoctorFee} 
                      onChange={(e) => setRegDoctorFee(e.target.value)} 
                    />
                  </div>
                </div>
              </>
            )}

            <button type="submit" className="btn-submit">
              Register Staff Account
            </button>
          </form>
        )}

      </div>
    </div>
  );
}

export default App;
