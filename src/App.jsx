import React, { useState } from 'react';
import './index.css';
import Dashboard from './Dashboard';
import PatientDashboard from './PatientDashboard';
import ReceptionistDashboard from './ReceptionistDashboard';

function App() {
  const [activeTab, setActiveTab] = useState('signin');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState('patient');

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
