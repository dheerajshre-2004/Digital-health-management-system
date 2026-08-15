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
  const [activeTab, setActiveTab] = useState('signin');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState('patient');
  const [loggedInPatient, setLoggedInPatient] = useState(null);
  const [loggedInDoctor, setLoggedInDoctor] = useState(null);

  useEffect(() => {
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
      localStorage.setItem('dhms_medications', JSON.stringify([]));
    }

    if (!localStorage.getItem('dhms_pharmacy_staff')) {
      localStorage.setItem('dhms_pharmacy_staff', JSON.stringify([]));
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
  }, []);

  const handleAuthSubmit = (e) => {
    e.preventDefault();
    const emailVal = e.target.querySelector('input[type="email"]')?.value || '';
    
    if (userRole === 'patient') {
      const patientsList = JSON.parse(localStorage.getItem('dhms_patients') || '[]');
      const matched = patientsList.find(p => p.email?.toLowerCase() === emailVal.toLowerCase());
      if (matched) {
        setLoggedInPatient(matched);
        setIsAuthenticated(true);
      } else {
        alert('Patient account not found. Please register first.');
      }
    } else if (userRole === 'doctor') {
      const doctorsList = JSON.parse(localStorage.getItem('dhms_doctors') || '[]');
      const matched = doctorsList.find(d => d.email?.toLowerCase() === emailVal.toLowerCase());
      if (matched) {
        setLoggedInDoctor(matched);
        setIsAuthenticated(true);
      } else {
        alert('Doctor account not found. Please register first.');
      }
    } else {
      // Allow other staff roles to log in directly
      setIsAuthenticated(true);
    }
  };

  const handleRegisterSubmit = (e) => {
    e.preventDefault();
    const nameVal = e.target.querySelector('input[placeholder="Enter your full name"]')?.value || '';
    const emailVal = e.target.querySelector('input[type="email"]')?.value || '';
    
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
        phone: ''
      };
      const updated = [newDoc, ...doctorsList];
      localStorage.setItem('dhms_doctors', JSON.stringify(updated));
      alert(`Doctor account registered successfully! ID: ${newId}. Please sign in to access your portal.`);
      setActiveTab('signin');
    } else {
      alert('Registration successful! Please sign in using your account credentials.');
      setActiveTab('signin');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setLoggedInPatient(null);
    setLoggedInDoctor(null);
  };

  if (isAuthenticated) {
    if (userRole === 'patient') {
      return <PatientDashboard onLogout={handleLogout} loggedInPatient={loggedInPatient} />;
    }
    if (userRole === 'receptionist') {
      return <ReceptionistDashboard onLogout={handleLogout} />;
    }
    if (userRole === 'laboratory') {
      return <LaboratoryDashboard onLogout={handleLogout} />;
    }
    if (userRole === 'pharmacist') {
      return <PharmacistDashboard onLogout={handleLogout} />;
    }
    if (userRole === 'cash_counter') {
      return <CashCounterDashboard onLogout={handleLogout} />;
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
        <p>Secure access portal for patients, doctors, and administrators</p>
      </div>

      <div className="auth-card">
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

        {activeTab === 'signin' ? (
          <form className="auth-form" onSubmit={handleAuthSubmit}>
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
                <input type="password" placeholder="Enter password" required />
              </div>
            </div>

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
                <input type="password" placeholder="Enter password" required />
              </div>
            </div>

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

            <button type="submit" className="btn-submit">Create Encrypted Account</button>
          </form>
        )}
      </div>
    </div>
  );
}

export default App;
