import React, { useState } from 'react';
import './ReceptionistDashboard.css';

export default function ReceptionistDashboard({ onLogout }) {
  const [activeTab, setActiveTab] = useState('register_patient');

  // State for Patient Registration
  const [patientData, setPatientData] = useState({
    firstName: '',
    lastName: '',
    dob: '',
    gender: '',
    phone: '',
    email: '',
  });
  const [generatedId, setGeneratedId] = useState(null);

  const handleRegisterSubmit = (e) => {
    e.preventDefault();
    // Mock ID generation
    const newId = `PT-${Math.floor(10000 + Math.random() * 90000)}`;
    setGeneratedId(newId);
  };

  // State for Appointment Booking
  const [appointmentData, setAppointmentData] = useState({
    patientId: '',
    doctorId: '',
    date: '',
    time: '',
    reason: ''
  });
  const [appointmentSuccess, setAppointmentSuccess] = useState(false);

  const handleAppointmentSubmit = (e) => {
    e.preventDefault();
    setAppointmentSuccess(true);
    setTimeout(() => setAppointmentSuccess(false), 3000);
    setAppointmentData({
      patientId: '',
      doctorId: '',
      date: '',
      time: '',
      reason: ''
    });
  };

  const renderRegisterPatient = () => (
    <div className="rd-view-container">
      <div className="rd-header-banner">
        <div>
          <h2>Register New Patient</h2>
          <p>Enter patient details to create a profile and generate a Unique Health ID.</p>
        </div>
      </div>

      <div className="rd-card">
        {generatedId ? (
          <div className="rd-success-message">
            <div className="rd-success-icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
            </div>
            <h3>Registration Successful!</h3>
            <p>The patient has been added to the DHMS network.</p>
            <div className="rd-id-display">
              Patient ID: <strong>{generatedId}</strong>
            </div>
            <button className="rd-btn-primary mt-4" onClick={() => {
              setGeneratedId(null);
              setPatientData({firstName: '', lastName: '', dob: '', gender: '', phone: '', email: ''});
            }}>Register Another Patient</button>
          </div>
        ) : (
          <form className="rd-form" onSubmit={handleRegisterSubmit}>
            <div className="rd-form-row">
              <div className="rd-form-group">
                <label>First Name</label>
                <input type="text" required value={patientData.firstName} onChange={e => setPatientData({...patientData, firstName: e.target.value})} placeholder="e.g. Jane" />
              </div>
              <div className="rd-form-group">
                <label>Last Name</label>
                <input type="text" required value={patientData.lastName} onChange={e => setPatientData({...patientData, lastName: e.target.value})} placeholder="e.g. Smith" />
              </div>
            </div>

            <div className="rd-form-row">
              <div className="rd-form-group">
                <label>Date of Birth</label>
                <input type="date" required value={patientData.dob} onChange={e => setPatientData({...patientData, dob: e.target.value})} />
              </div>
              <div className="rd-form-group">
                <label>Gender</label>
                <select required value={patientData.gender} onChange={e => setPatientData({...patientData, gender: e.target.value})}>
                  <option value="" disabled hidden>Select Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            <div className="rd-form-row">
              <div className="rd-form-group">
                <label>Phone Number</label>
                <input type="tel" required value={patientData.phone} onChange={e => setPatientData({...patientData, phone: e.target.value})} placeholder="+1 (555) 000-0000" />
              </div>
              <div className="rd-form-group">
                <label>Email Address</label>
                <input type="email" value={patientData.email} onChange={e => setPatientData({...patientData, email: e.target.value})} placeholder="jane.smith@example.com" />
              </div>
            </div>

            <div className="rd-form-actions">
              <button type="submit" className="rd-btn-primary">Generate ID & Register</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );

  const renderAppointments = () => (
    <div className="rd-view-container">
      <div className="rd-header-banner">
        <div>
          <h2>Manage Appointments</h2>
          <p>Schedule physical appointments and connect patients with available doctors.</p>
        </div>
      </div>

      <div className="rd-grid-layout">
        {/* Booking Form */}
        <div className="rd-card">
          <h3>Book New Appointment</h3>
          {appointmentSuccess && (
            <div className="rd-alert-success">
              Appointment successfully booked and added to the Doctor's schedule!
            </div>
          )}
          <form className="rd-form mt-4" onSubmit={handleAppointmentSubmit}>
            <div className="rd-form-group">
              <label>Patient ID / Name</label>
              <input type="text" required value={appointmentData.patientId} onChange={e => setAppointmentData({...appointmentData, patientId: e.target.value})} placeholder="e.g. PT-12345 or John Doe" />
            </div>

            <div className="rd-form-group">
              <label>Assign to Doctor</label>
              <select required value={appointmentData.doctorId} onChange={e => setAppointmentData({...appointmentData, doctorId: e.target.value})}>
                <option value="" disabled hidden>Select Doctor</option>
                <option value="dr_house">Dr. Gregory House (Cardiology)</option>
                <option value="dr_grey">Dr. Meredith Grey (General Surgery)</option>
                <option value="dr_watson">Dr. John Watson (Primary Care)</option>
              </select>
            </div>

            <div className="rd-form-row">
              <div className="rd-form-group">
                <label>Date</label>
                <input type="date" required value={appointmentData.date} onChange={e => setAppointmentData({...appointmentData, date: e.target.value})} />
              </div>
              <div className="rd-form-group">
                <label>Time Slot</label>
                <input type="time" required value={appointmentData.time} onChange={e => setAppointmentData({...appointmentData, time: e.target.value})} />
              </div>
            </div>

            <div className="rd-form-group">
              <label>Reason for Visit</label>
              <textarea rows="3" required value={appointmentData.reason} onChange={e => setAppointmentData({...appointmentData, reason: e.target.value})} placeholder="Brief description of symptoms or visit purpose..."></textarea>
            </div>

            <button type="submit" className="rd-btn-primary w-full">Confirm Appointment</button>
          </form>
        </div>

        {/* Today's Schedule */}
        <div className="rd-card">
          <h3>Today's Scheduled Visits</h3>
          <div className="rd-appointment-list mt-4">
            <div className="rd-appt-item">
              <div className="rd-appt-time">09:00 AM</div>
              <div className="rd-appt-details">
                <strong>PT-80234 (Alice Johnson)</strong>
                <span>with Dr. Watson</span>
              </div>
              <span className="rd-status-badge pending">Checked In</span>
            </div>
            <div className="rd-appt-item">
              <div className="rd-appt-time">10:30 AM</div>
              <div className="rd-appt-details">
                <strong>PT-11922 (Bob Smith)</strong>
                <span>with Dr. House</span>
              </div>
              <span className="rd-status-badge upcoming">Upcoming</span>
            </div>
            <div className="rd-appt-item">
              <div className="rd-appt-time">01:15 PM</div>
              <div className="rd-appt-details">
                <strong>PT-55310 (Carol Davis)</strong>
                <span>with Dr. Grey</span>
              </div>
              <span className="rd-status-badge upcoming">Upcoming</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="rd-container">
      {/* Topbar */}
      <header className="rd-topbar">
        <div className="rd-logo-area">
          <svg className="rd-logo-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
          </svg>
          <span className="rd-logo-text">DHMS</span>
          <span className="rd-logo-divider">|</span>
          <span className="rd-logo-sub">Front Desk Operations</span>
        </div>
        <div className="rd-topbar-right">
          <div className="rd-profile-info">
            <div className="rd-avatar">R</div>
            <div className="rd-user-details">
              <strong>Sarah Jenkins</strong>
              <span>Front Desk</span>
            </div>
            <div className="rd-role-badge">RECEPTIONIST</div>
          </div>
          <button className="rd-signout-btn" onClick={onLogout} title="Sign Out">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
          </button>
        </div>
      </header>

      <div className="rd-body">
        {/* Sidebar */}
        <aside className="rd-sidebar">
          <ul className="rd-nav">
            <li className={activeTab === 'register_patient' ? 'active' : ''} onClick={() => setActiveTab('register_patient')}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><line x1="20" y1="8" x2="20" y2="14"></line><line x1="23" y1="11" x2="17" y2="11"></line></svg>
              Register Patient
            </li>
            <li className={activeTab === 'appointments' ? 'active' : ''} onClick={() => setActiveTab('appointments')}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
              Appointments
            </li>
          </ul>
        </aside>

        {/* Main Content */}
        <main className="rd-main">
          {activeTab === 'register_patient' ? renderRegisterPatient() : renderAppointments()}
        </main>
      </div>
    </div>
  );
}
