import React, { useState, useEffect } from 'react';
import './index.css';
import Dashboard from './Dashboard';
import PatientDashboard from './PatientDashboard';
import ReceptionistDashboard from './ReceptionistDashboard';

function App() {
  const [activeTab, setActiveTab] = useState('signin');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState('patient');

  useEffect(() => {
    // Seed initial patients if not present
    if (!localStorage.getItem('dhms_patients')) {
      const initialPatients = [
        {id: "PT-80234", firstName: "Alice", lastName: "Johnson", dob: "1990-05-14", gender: "female", phone: "+1 (555) 321-4567", email: "alice@example.com"},
        {id: "PT-11922", firstName: "Bob", lastName: "Smith", dob: "1985-09-22", gender: "male", phone: "+1 (555) 789-0123", email: "bob@example.com"},
        {id: "PT-55310", firstName: "Carol", lastName: "Davis", dob: "1993-11-02", gender: "female", phone: "+1 (555) 456-7890", email: "carol@example.com"},
        {id: "PT-22345", firstName: "David", lastName: "Wilson", dob: "1978-04-30", gender: "male", phone: "+1 (555) 901-2345", email: "david@example.com"},
        {id: "PT-66789", firstName: "Eva", lastName: "Brown", dob: "1988-12-15", gender: "female", phone: "+1 (555) 234-5678", email: "eva@example.com"},
        {id: "PT-99887", firstName: "Frank", lastName: "Miller", dob: "1995-07-08", gender: "male", phone: "+1 (555) 678-9012", email: "frank@example.com"}
      ];
      localStorage.setItem('dhms_patients', JSON.stringify(initialPatients));
    }

    // Seed initial appointments if not present
    if (!localStorage.getItem('dhms_appointments')) {
      const initialAppointments = [
        {id: "APT-001", patientId: "PT-80234", patientName: "Alice Johnson", doctorId: "dr_watson", doctorName: "Dr. John Watson", department: "Primary Care", date: "2026-07-16", time: "09:00", reason: "Follow-up checkup", status: "Checked In", type: "Physical", source: "Walk-in"},
        {id: "APT-002", patientId: "PT-11922", patientName: "Bob Smith", doctorId: "dr_house", doctorName: "Dr. Gregory House", department: "Cardiology", date: "2026-07-16", time: "10:30", reason: "ECG review", status: "Upcoming", type: "Physical", source: "Walk-in"},
        {id: "APT-003", patientId: "PT-55310", patientName: "Carol Davis", doctorId: "dr_grey", doctorName: "Dr. Meredith Grey", department: "General Surgery", date: "2026-07-16", time: "01:15", reason: "Post-op check", status: "Upcoming", type: "Physical", source: "Walk-in"}
      ];
      localStorage.setItem('dhms_appointments', JSON.stringify(initialAppointments));
    }

    // Seed initial prescriptions if not present
    if (!localStorage.getItem('dhms_prescriptions')) {
      const initialPrescriptions = [
        { id: "RX-701", patientId: "PT-80234", patientName: "Alice Johnson", medication: "Amoxicillin 500mg", doctorName: "Dr. John Watson", date: "2026-07-16", cost: "$25.00", status: "Pending" },
        { id: "RX-702", patientId: "PT-11922", patientName: "Bob Smith", medication: "Atorvastatin 20mg", doctorName: "Dr. Gregory House", date: "2026-07-16", cost: "$45.00", status: "Pending" },
        { id: "RX-703", patientId: "PT-55310", patientName: "Carol Davis", medication: "Lisinopril 10mg", doctorName: "Dr. Meredith Grey", date: "2026-07-15", cost: "$15.00", status: "Dispensed & Billed" }
      ];
      localStorage.setItem('dhms_prescriptions', JSON.stringify(initialPrescriptions));
    }

    // Seed initial lab requests if not present
    if (!localStorage.getItem('dhms_lab_requests')) {
      const initialLabRequests = [
        { id: "LAB-101", patientId: "PT-80234", patientName: "Alice Johnson", testName: "Lipid Panel", doctorName: "Dr. John Watson", date: "2026-07-16", cost: "$120.00", status: "Pending" },
        { id: "LAB-102", patientId: "PT-11922", patientName: "Bob Smith", testName: "Thyroid Panel", doctorName: "Dr. Gregory House", date: "2026-07-16", cost: "$85.00", status: "Pending" },
        { id: "LAB-103", patientId: "PT-22345", patientName: "David Wilson", testName: "Complete Blood Count (CBC)", doctorName: "Dr. Meredith Grey", date: "2026-07-15", cost: "$45.00", status: "Completed & Billed" }
      ];
      localStorage.setItem('dhms_lab_requests', JSON.stringify(initialLabRequests));
    }
  }, []);

  const handleAuthSubmit = (e) => {
    e.preventDefault();
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
  };

  if (isAuthenticated) {
    if (userRole === 'patient') {
      return <PatientDashboard onLogout={handleLogout} />;
    }
    if (userRole === 'receptionist') {
      return <ReceptionistDashboard onLogout={handleLogout} />;
    }
    return <Dashboard onLogout={handleLogout} role={userRole} />;
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
                  <option value="admin">Administrator</option>
                </select>
                <svg className="select-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </div>
            </div>

            <button type="submit" className="btn-submit">Secure Sign In</button>
          </form>
        ) : (
          <form className="auth-form" onSubmit={handleAuthSubmit}>
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
                  <option value="admin">Admin Portal</option>
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
