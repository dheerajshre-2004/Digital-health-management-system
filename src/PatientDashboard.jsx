import React, { useState } from 'react';
import './PatientDashboard.css';

export default function PatientDashboard({ onLogout }) {
  const [activeTab, setActiveTab] = useState('health_console');
  const [searchQuery, setSearchQuery] = useState('');
  const [deptFilter, setDeptFilter] = useState('All');
  const [selectedVisit, setSelectedVisit] = useState(null);

  // EHR States
  const [ehrRecords, setEhrRecords] = useState([
    { id: "EHR-882", name: "Immunization Record & Covid-19 Card", type: "Immunization", size: "1.2 MB", date: "2026-05-12", author: "Dr. Allison Cameron", hash: "sha256-8a7f92b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f", details: { vaccine: "COVID-19 mRNA (Pfizer-BioNTech)", dose1: "2025-10-15", dose2: "2025-11-05", booster: "2026-05-10", facility: "DHMS Health Hub" } },
    { id: "EHR-401", name: "Lipid Panel Test Report", type: "Lab Report", size: "850 KB", date: "2026-04-16", author: "Dr. Robert Chase", hash: "sha256-4c2d81a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0", details: { cholesterol: "215 mg/dL (High)", hdl: "45 mg/dL (Normal)", ldl: "142 mg/dL (High)", triglycerides: "160 mg/dL (Borderline High)" } },
    { id: "EHR-210", name: "Chest X-Ray Diagnostic Imaging", type: "Imaging", size: "14.5 MB", date: "2026-03-02", author: "Dr. Gregory House", hash: "sha256-9e1b23c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2", details: { region: "Chest (PA and Lateral View)", findings: "Lungs are clear bilaterally. No pleural effusion or pneumothorax. Cardiomediastinal silhouette is within normal limits. Bony structures are intact.", impression: "Normal Chest Radiograph" } }
  ]);
  const [ehrSearchQuery, setEhrSearchQuery] = useState('');
  const [ehrFilterType, setEhrFilterType] = useState('All');
  const [selectedEhrRecord, setSelectedEhrRecord] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Laboratory States
  const [labOrders, setLabOrders] = useState([
    { 
      id: "LAB-9801", 
      testName: "Complete Blood Count (CBC)", 
      status: "Completed", 
      date: "2026-07-11", 
      doctor: "Dr. Gregory House",
      timeline: [
        { title: "Order Created", date: "2026-07-10 09:00 AM", done: true },
        { title: "Sample Collected", date: "2026-07-11 08:30 AM", done: true },
        { title: "Received by Lab", date: "2026-07-11 11:45 AM", done: true },
        { title: "Results Published", date: "2026-07-11 04:30 PM", done: true }
      ],
      results: [
        { parameter: "White Blood Cell (WBC)", value: "6.5", range: "4.5 - 11.0", unit: "x10^3/uL", flag: "Normal" },
        { parameter: "Red Blood Cell (RBC)", value: "4.8", range: "4.3 - 5.9", unit: "x10^6/uL", flag: "Normal" },
        { parameter: "Hemoglobin", value: "15.2", range: "13.5 - 17.5", unit: "g/dL", flag: "Normal" },
        { parameter: "Hematocrit", value: "44.5", range: "41.0 - 50.0", unit: "%", flag: "Normal" },
        { parameter: "Platelets", value: "142", range: "150 - 450", unit: "x10^3/uL", flag: "Low" }
      ]
    },
    { 
      id: "LAB-7652", 
      testName: "Metabolic Panel & Kidney Function", 
      status: "Processing", 
      date: "2026-07-14", 
      doctor: "Dr. Gregory House",
      timeline: [
        { title: "Order Created", date: "2026-07-13 02:15 PM", done: true },
        { title: "Sample Collected", date: "2026-07-14 07:30 AM", done: true },
        { title: "Received by Lab", date: "2026-07-14 10:15 AM", done: true },
        { title: "Results Published", date: "Pending Verification", done: false }
      ],
      results: []
    }
  ]);
  const [selectedLabOrder, setSelectedLabOrder] = useState(null);
  const [showOrderLabModal, setShowOrderLabModal] = useState(false);
  const [newLabTestName, setNewLabTestName] = useState('Thyroid Panel (TSH, Free T4)');

  // Telemedicine States
  const [teleconsultations, setTeleconsultations] = useState([
    { id: "TELE-502", doctor: "Dr. Gregory House", department: "Cardiology", date: "Today", time: "01:50 PM", status: "Ready", reason: "Follow-up on sinus arrhythmia symptoms." }
  ]);
  const [isVideoCallActive, setIsVideoCallActive] = useState(false);
  const [callChatMessages, setCallChatMessages] = useState([
    { sender: "doctor", text: "Hello John, I've reviewed your ECG and recent lab values. How have you been feeling since our last visit?", time: "01:50 PM" }
  ]);
  const [newChatMessage, setNewChatMessage] = useState('');
  const [showScheduleTeleModal, setShowScheduleTeleModal] = useState(false);
  const [newTeleDoctor, setNewTeleDoctor] = useState('Dr. Gregory House');
  const [newTeleDept, setNewTeleDept] = useState('Cardiology');
  const [newTeleDate, setNewTeleDate] = useState('');
  const [newTeleTime, setNewTeleTime] = useState('');
  const [newTeleReason, setNewTeleReason] = useState('');

  // Physical Appointment Request States
  const [showRequestApptModal, setShowRequestApptModal] = useState(false);
  const [newApptDoctor, setNewApptDoctor] = useState('Dr. Gregory House');
  const [newApptDept, setNewApptDept] = useState('Cardiology');
  const [newApptDate, setNewApptDate] = useState('');
  const [newApptTime, setNewApptTime] = useState('');
  const [newApptReason, setNewApptReason] = useState('');

  const visitHistoryData = [
    {
      id: "V-9082",
      date: "2026-07-10",
      time: "10:00 AM",
      doctor: "Dr. Gregory House",
      department: "Cardiology",
      reason: "Shortness of breath and chest tightness",
      diagnosis: "Mild Sinus Arrhythmia",
      notes: "Patient reported episodes of heart palpitations during light exercise. ECG shows slight variations but nothing critical. Advised to reduce caffeine intake, adhere to daily medications, and return for a follow-up in two weeks.",
      vitals: { bp: "135/85 mmHg", hr: "78 BPM", temp: "98.6 °F", weight: "78 kg" },
      prescriptions: [
        { name: "Lisinopril", dosage: "10mg", frequency: "Once daily in the morning", duration: "30 days" },
        { name: "Metoprolol", dosage: "25mg", frequency: "Twice daily", duration: "15 days" }
      ],
      status: "Completed",
    },
    {
      id: "V-8421",
      date: "2026-06-01",
      time: "02:30 PM",
      doctor: "Dr. Allison Cameron",
      department: "Immunology",
      reason: "Persistent skin rash and joint fatigue",
      diagnosis: "Acute Contact Dermatitis",
      notes: "Presented with red, itchy scaling rash on forearms. Appears to be an allergic reaction to garden weeds. Prescribed topical steroid cream and daily antihistamines.",
      vitals: { bp: "120/80 mmHg", hr: "72 BPM", temp: "99.1 °F", weight: "78.2 kg" },
      prescriptions: [
        { name: "Cetirizine", dosage: "10mg", frequency: "Once daily at bedtime", duration: "10 days" },
        { name: "Hydrocortisone 1% Cream", dosage: "Apply to affected area", frequency: "Twice daily", duration: "7 days" }
      ],
      status: "Completed",
    },
    {
      id: "V-7130",
      date: "2026-04-15",
      time: "09:15 AM",
      doctor: "Dr. Robert Chase",
      department: "General Medicine",
      reason: "Annual physical check-up",
      diagnosis: "Healthy Patient Profile",
      notes: "Annual wellness check. Patient is in general good health. Blood panel indicates slightly elevated LDL cholesterol level. Suggested dietary modifications and 150 minutes of moderate aerobic activity weekly.",
      vitals: { bp: "118/76 mmHg", hr: "68 BPM", temp: "98.4 °F", weight: "79.5 kg" },
      prescriptions: [
        { name: "Fish Oil Supplement", dosage: "1000mg", frequency: "Daily with meal", duration: "Ongoing" },
        { name: "CoQ10", dosage: "100mg", frequency: "Once daily", duration: "Ongoing" }
      ],
      status: "Completed",
    }
  ];

  const renderHealthConsole = () => (
    <>
      <div className="pd-welcome-banner">
        <div>
          <h1>Welcome back, <span className="highlight">John Doe</span></h1>
          <p>Your comprehensive health profile is securely encrypted and maintained.</p>
        </div>
        <button className="pd-btn-primary" onClick={() => setShowRequestApptModal(true)}>
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
                      {visit.prescriptions.map((p, idx) => (
                        <span key={idx} className="pd-presc-tag">{p.name} ({p.dosage})</span>
                      ))}
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
            <div className="pd-modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="pd-modal-header">
                <h2>Visit Log Details: {selectedVisit.id}</h2>
                <button className="pd-modal-close" onClick={() => setSelectedVisit(null)}>&times;</button>
              </div>
              <div className="pd-modal-body">
                <div className="pd-modal-meta-grid">
                  <div><strong>Doctor:</strong> <p>{selectedVisit.doctor}</p></div>
                  <div><strong>Department:</strong> <p>{selectedVisit.department}</p></div>
                  <div><strong>Date / Time:</strong> <p>{selectedVisit.date} at {selectedVisit.time}</p></div>
                  <div><strong>Status:</strong> <span className="pd-badge completed">{selectedVisit.status}</span></div>
                </div>

                <div className="pd-modal-section">
                  <h3>Recorded Vitals</h3>
                  <div className="pd-modal-vitals-grid">
                    <div className="pd-modal-vital-item"><strong>BP:</strong> <span>{selectedVisit.vitals.bp}</span></div>
                    <div className="pd-modal-vital-item"><strong>Heart Rate:</strong> <span>{selectedVisit.vitals.hr}</span></div>
                    <div className="pd-modal-vital-item"><strong>Temperature:</strong> <span>{selectedVisit.vitals.temp}</span></div>
                    <div className="pd-modal-vital-item"><strong>Weight:</strong> <span>{selectedVisit.vitals.weight}</span></div>
                  </div>
                </div>

                <div className="pd-modal-section">
                  <h3>Reason for Visit</h3>
                  <p className="pd-modal-text">{selectedVisit.reason}</p>
                </div>

                <div className="pd-modal-section">
                  <h3>Diagnosis</h3>
                  <p className="pd-modal-text highlight-box">{selectedVisit.diagnosis}</p>
                </div>

                <div className="pd-modal-section">
                  <h3>Clinical Notes</h3>
                  <p className="pd-modal-text">{selectedVisit.notes}</p>
                </div>

                <div className="pd-modal-section">
                  <h3>Prescriptions</h3>
                  <table className="pd-modal-table">
                    <thead>
                      <tr>
                        <th>Medication</th>
                        <th>Dosage</th>
                        <th>Frequency</th>
                        <th>Duration</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedVisit.prescriptions.map((p, idx) => (
                        <tr key={idx}>
                          <td><strong>{p.name}</strong></td>
                          <td>{p.dosage}</td>
                          <td>{p.frequency}</td>
                          <td>{p.duration}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
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
      patientId: "PT-99999",
      patientName: "John Doe",
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
    localStorage.setItem('dhms_appointments', JSON.stringify([newAppt, ...currentAppts]));

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
      patientId: "PT-99999",
      patientName: "John Doe",
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
    localStorage.setItem('dhms_appointments', JSON.stringify([newAppt, ...currentAppts]));

    setShowScheduleTeleModal(false);
    setNewTeleReason('');
  };

  const handleOrderLabSubmit = (e) => {
    e.preventDefault();
    const newOrder = {
      id: `LAB-${Math.floor(1000 + Math.random() * 9000)}`,
      testName: newLabTestName,
      status: "Processing",
      date: new Date().toISOString().split('T')[0],
      doctor: "Dr. Gregory House",
      timeline: [
        { title: "Order Created", date: new Date().toLocaleString(), done: true },
        { title: "Sample Collection", date: "Pending", done: false },
        { title: "Received by Lab", date: "Pending", done: false },
        { title: "Results Published", date: "Pending", done: false }
      ],
      results: []
    };
    setLabOrders(prev => [newOrder, ...prev]);
    setShowOrderLabModal(false);
  };

  const handleSendChatMessage = (e) => {
    e.preventDefault();
    if (!newChatMessage.trim()) return;

    const patientMsg = { 
      sender: "patient", 
      text: newChatMessage, 
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
    };
    setCallChatMessages(prev => [...prev, patientMsg]);
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

      setCallChatMessages(prev => [...prev, {
        sender: "doctor",
        text: responseText,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
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

        {/* List of lab orders */}
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
                      <option value="Thyroid Panel (TSH, Free T4)">Thyroid Panel (TSH, Free T4)</option>
                      <option value="Lipid Profile (Cholesterol, HDL, LDL)">Lipid Profile (Cholesterol, HDL, LDL)</option>
                      <option value="Urinalysis & Urine Culture">Urinalysis & Urine Culture</option>
                      <option value="Vitamin D-25 Hydroxy Screen">Vitamin D-25 Hydroxy Screen</option>
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
              <button className="video-btn danger" onClick={() => setIsVideoCallActive(false)} title="End Call">
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
                      <button className="pd-btn-teal" onClick={() => setIsVideoCallActive(true)}>
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
            <li className={activeTab === 'visit_history' ? 'active' : ''} onClick={() => setActiveTab('visit_history')}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
              Visit History Logs
            </li>
            <li className={activeTab === 'ehr_records' ? 'active' : ''} onClick={() => setActiveTab('ehr_records')}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
              EHR Medical Records
            </li>
            <li className={activeTab === 'laboratory' ? 'active' : ''} onClick={() => setActiveTab('laboratory')}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 2v7.31"></path><path d="M14 9.3V1.99"></path><path d="M8.5 2h7"></path><path d="M14 9.3a6.5 6.5 0 1 1-4 0"></path><path d="M5.52 16h12.96"></path></svg>
              Laboratory Center
            </li>
            <li className={activeTab === 'telemedicine' ? 'active' : ''} onClick={() => setActiveTab('telemedicine')}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7"></polygon><rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect></svg>
              Telemedicine Clinic
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
        </main>
      </div>
    </div>
  );
}
