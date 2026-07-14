import React, { useState } from 'react';
import './PatientDashboard.css';

export default function PatientDashboard({ onLogout }) {
  const [activeTab, setActiveTab] = useState('health_console');

  const renderHealthConsole = () => (
    <>
      <div className="pd-welcome-banner">
        <div>
          <h1>Welcome back, <span className="highlight">John Doe</span></h1>
          <p>Your comprehensive health profile is securely encrypted and maintained.</p>
        </div>
        <button className="pd-btn-primary">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
          Request Appointment
        </button>
      </div>

      {/* Vitals Grid */}
      <div className="pd-vitals-grid">
        <div className="pd-vital-card">
          <div className="pd-vital-header">
            <span>Heart Rate</span>
            <div className="pd-vital-icon red">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
            </div>
          </div>
          <div className="pd-vital-value">72 <span>BPM</span></div>
          <div className="pd-vital-status success">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
            Normal Resting
          </div>
          <div className="pd-progress-bar"><div className="pd-progress red" style={{width: '60%'}}></div></div>
        </div>

        <div className="pd-vital-card">
          <div className="pd-vital-header">
            <span>Blood Pressure</span>
            <div className="pd-vital-icon green">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
            </div>
          </div>
          <div className="pd-vital-value">120/80 <span>mmHg</span></div>
          <div className="pd-vital-status success">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
            Optimal
          </div>
          <div className="pd-progress-bar"><div className="pd-progress green" style={{width: '40%'}}></div></div>
        </div>

        <div className="pd-vital-card">
          <div className="pd-vital-header">
            <span>Sleep duration</span>
            <div className="pd-vital-icon purple">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
            </div>
          </div>
          <div className="pd-vital-value">7.5 <span>hrs</span></div>
          <div className="pd-vital-status success">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
            Healthy REM
          </div>
          <div className="pd-progress-bar"><div className="pd-progress purple" style={{width: '80%'}}></div></div>
        </div>

        <div className="pd-vital-card">
          <div className="pd-vital-header">
            <span>Daily Steps</span>
            <div className="pd-vital-icon orange">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"></path></svg>
            </div>
          </div>
          <div className="pd-vital-value">8,500 <span>/ 12k</span></div>
          <div className="pd-vital-status warning">
            Active Target Reach
          </div>
          <div className="pd-progress-bar"><div className="pd-progress orange" style={{width: '70%'}}></div></div>
        </div>
      </div>

      <div className="pd-content-grid">
        <div className="pd-left-column">
          {/* Upcoming Consultations */}
          <div className="pd-section-card">
            <div className="pd-section-header">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
              <h3>Upcoming Consultations</h3>
            </div>
            
            <div className="pd-consultation-item">
              <div className="pd-consult-info">
                <h4>Dr. Gregory House</h4>
                <p>Routine cardiology health checkup</p>
              </div>
              <div className="pd-consult-meta">
                <div className="pd-date">6/20/2026 at 01:50 PM</div>
                <div className="pd-badge in-session">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
                  In Session
                </div>
              </div>
              <div className="pd-consult-actions">
                <button className="pd-btn-outline"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg> Reschedule</button>
                <button className="pd-btn-outline danger"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg> Cancel Consultation</button>
              </div>
            </div>
          </div>

          {/* Active Prescriptions */}
          <div className="pd-section-card">
            <div className="pd-section-header">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
              <h3>Active Prescriptions Tracker</h3>
            </div>
            <div className="pd-empty-state">
              <p>Tracker will populate upon new prescriptions</p>
            </div>
          </div>
        </div>

        <div className="pd-right-column">
          {/* Daily Medication Prompts */}
          <div className="pd-section-card pd-medication-card">
            <div className="pd-section-header">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
              <h3>Daily Medication Adherence Prompts</h3>
            </div>

            <div className="pd-med-prompt">
              <div className="pd-med-chart">
                <svg viewBox="0 0 36 36" className="circular-chart red">
                  <path className="circle-bg"
                    d="M18 2.0845
                      a 15.9155 15.9155 0 0 1 0 31.831
                      a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path className="circle"
                    strokeDasharray="24, 100"
                    d="M18 2.0845
                      a 15.9155 15.9155 0 0 1 0 31.831
                      a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <text x="18" y="20.35" className="percentage">24%</text>
                </svg>
              </div>
              <div className="pd-med-details">
                <h4>Lisinopril</h4>
                <p>10mg once daily in the morning</p>
              </div>
              <button className="pd-btn-teal">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                Take Daily Dose
              </button>
            </div>
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
              <p>John Doe</p>
            </div>
            <div className="pd-info-item">
              <label>Date of Birth</label>
              <p>12/04/1985</p>
            </div>
            <div className="pd-info-item">
              <label>Gender</label>
              <p>Male</p>
            </div>
            <div className="pd-info-item">
              <label>Blood Type</label>
              <p>O+</p>
            </div>
            <div className="pd-info-item">
              <label>Phone Number</label>
              <p>+1 (555) 123-4567</p>
            </div>
            <div className="pd-info-item">
              <label>Email Address</label>
              <p>patient@dhms.com</p>
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
                <span className="pd-tag red">Penicillin</span>
                <span className="pd-tag orange">Peanuts</span>
              </div>
            </div>
            <div className="pd-info-item full-width">
              <label>Chronic Conditions</label>
              <div className="pd-tags">
                <span className="pd-tag blue">Hypertension</span>
              </div>
            </div>
          </div>
        </div>

        <div className="pd-section-card">
          <div className="pd-section-header">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
            <h3>Insurance Details</h3>
          </div>
          <div className="pd-info-grid">
            <div className="pd-info-item">
              <label>Provider</label>
              <p>BlueCross BlueShield</p>
            </div>
            <div className="pd-info-item">
              <label>Policy Number</label>
              <p>BCBS-987654321</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="pd-container">
      {/* Topbar */}
      <header className="pd-topbar">
        <div className="pd-logo-area">
          <svg className="pd-logo-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
          </svg>
          <span className="pd-logo-text">DHMS</span>
          <span className="pd-logo-divider">|</span>
          <span className="pd-logo-sub">Health Console</span>
        </div>
        <div className="pd-topbar-right">
          <div className="pd-profile-info">
            <div className="pd-avatar">J</div>
            <div className="pd-user-details">
              <strong>John Doe</strong>
              <span>patient@dhms.com</span>
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
        <aside className="pd-sidebar">
          <ul className="pd-nav">
            <li className={activeTab === 'health_console' ? 'active' : ''} onClick={() => setActiveTab('health_console')}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
              Health Console
            </li>
            <li className={activeTab === 'digital_profile' ? 'active' : ''} onClick={() => setActiveTab('digital_profile')}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
              Digital Patient Profile
            </li>
            <li>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
              Visit History Logs
            </li>
            <li>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
              EHR Medical Records
            </li>
            <li>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 2v7.31"></path><path d="M14 9.3V1.99"></path><path d="M8.5 2h7"></path><path d="M14 9.3a6.5 6.5 0 1 1-4 0"></path><path d="M5.52 16h12.96"></path></svg>
              Laboratory Center
            </li>
            <li>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7"></polygon><rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect></svg>
              Telemedicine Clinic
            </li>
          </ul>
        </aside>

        {/* Main Content */}
        <main className="pd-main">
          {activeTab === 'health_console' ? renderHealthConsole() : renderPatientProfile()}
        </main>
      </div>
    </div>
  );
}
