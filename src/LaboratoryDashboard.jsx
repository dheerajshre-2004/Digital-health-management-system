import React, { useState, useEffect } from 'react';
import './LaboratoryDashboard.css';

export default function LaboratoryDashboard({ onLogout }) {
  const [activeTab, setActiveTab] = useState('overview');

  // Core states from localStorage
  const [labRequests, setLabRequests] = useState(() => {
    return JSON.parse(localStorage.getItem('dhms_lab_requests') || '[]');
  });

  const [appointments, setAppointments] = useState(() => {
    return JSON.parse(localStorage.getItem('dhms_appointments') || '[]');
  });

  // Modal and entry states
  const [selectedLabForResults, setSelectedLabForResults] = useState(null);
  const [labResultsText, setLabResultsText] = useState('');
  const [labRemarks, setLabRemarks] = useState('');
  const [viewedLabRequestResults, setViewedLabRequestResults] = useState(null);

  // Search & Filter & Pagination States
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Direct lab appointments (Patient booked)
  const labAppointments = appointments.filter(appt => 
    (appt.department && appt.department.toLowerCase() === 'laboratory') || 
    (appt.doctorName && appt.doctorName.toLowerCase().includes('lab')) ||
    (appt.reason && appt.reason.toLowerCase().includes('lab test'))
  );

  // Pagination for Direct Appointments
  const [apptPage, setApptPage] = useState(1);
  const apptsPerPage = 5;
  const totalApptPages = Math.ceil(labAppointments.length / apptsPerPage) || 1;
  const currentAppts = labAppointments.slice((apptPage - 1) * apptsPerPage, apptPage * apptsPerPage);

  // Laboratory Attendance State
  const [labAttendanceForm, setLabAttendanceForm] = useState({
    staffId: 'LAB-201',
    staffName: 'Dr. Alex Vance',
    role: 'Chief Lab Specialist',
    date: new Date().toISOString().split('T')[0],
    status: 'Present',
    checkIn: '08:45 AM',
    checkOut: '05:15 PM',
    remarks: 'Biochemistry Unit'
  });

  const handleMarkLabAttendance = (e) => {
    e.preventDefault();
    const allAtt = JSON.parse(localStorage.getItem('dhms_master_attendance') || '[]');
    const newRecord = {
      id: `ATT-${Math.floor(1000 + Math.random() * 9000)}`,
      date: labAttendanceForm.date,
      module: 'Laboratory',
      staffId: labAttendanceForm.staffId,
      staffName: labAttendanceForm.staffName,
      role: labAttendanceForm.role,
      checkIn: labAttendanceForm.status === 'Absent' || labAttendanceForm.status === 'On Leave' ? '-' : labAttendanceForm.checkIn,
      checkOut: labAttendanceForm.status === 'Absent' || labAttendanceForm.status === 'On Leave' ? '-' : labAttendanceForm.checkOut,
      status: labAttendanceForm.status,
      remarks: labAttendanceForm.remarks || 'Laboratory Duty'
    };

    const idx = allAtt.findIndex(a => a.date === newRecord.date && a.staffId === newRecord.staffId);
    let updated;
    if (idx >= 0) {
      updated = [...allAtt];
      updated[idx] = newRecord;
    } else {
      updated = [newRecord, ...allAtt];
    }

    localStorage.setItem('dhms_master_attendance', JSON.stringify(updated));
    alert(`Attendance logged successfully for ${labAttendanceForm.staffName} (${labAttendanceForm.status}).`);
  };

  // Laboratory Services / Packages Available
  const labFacilities = [
    { code: "PATH-CBC", name: "Complete Blood Count (CBC)", dept: "Hematology", cost: "$45.00", time: "4-6 Hours", fast: "No fasting required", description: "Evaluates overall health and detects a wide range of disorders including anemia and infection." },
    { code: "PATH-LIP", name: "Lipid Profile / Panel", dept: "Clinical Biochemistry", cost: "$120.00", time: "8-12 Hours", fast: "Fasting required (12 hours)", description: "Measures cholesterol levels and triglycerides to assess cardiovascular risk." },
    { code: "PATH-THY", name: "Thyroid Panel (TSH, Free T4)", dept: "Endocrinology", cost: "$85.00", time: "24 Hours", fast: "No fasting required", description: "Assesses thyroid gland function and helps diagnose hyperthyroidism or hypothyroidism." },
    { code: "PATH-CMP", name: "Comprehensive Metabolic Panel (CMP)", dept: "Clinical Biochemistry", cost: "$110.00", time: "12 Hours", fast: "Fasting required (8-10 hours)", description: "Provides information about kidneys, liver, electrolyte and acid/base balance." },
    { code: "PATH-VIT", name: "Vitamin D-25 Hydroxy Screen", dept: "Immunology", cost: "$95.00", time: "24-48 Hours", fast: "No fasting required", description: "Checks for bone weaknesses, bone malformations, or abnormal metabolism." },
    { code: "PATH-URN", name: "Urinalysis & Urine Culture", dept: "Microbiology", cost: "$45.00", time: "24 Hours", fast: "No fasting required", description: "Detects urinary tract infections (UTI), kidney disorders, and diabetes." }
  ];

  const handleCompleteLabWithResults = (e) => {
    e.preventDefault();
    if (!selectedLabForResults) return;

    const todayStr = new Date().toISOString().split('T')[0];

    // 1. Update the lab request with status and results
    const updatedLab = labRequests.map(lab => {
      if (lab.id === selectedLabForResults.id) {
        return { 
          ...lab, 
          status: 'Completed & Billed',
          results: labResultsText,
          remarks: labRemarks,
          completedDate: todayStr
        };
      }
      return lab;
    });
    setLabRequests(updatedLab);
    localStorage.setItem('dhms_lab_requests', JSON.stringify(updatedLab));

    // 2. Append a new Lab Report to the patient's EHR profile in localStorage
    const patientList = JSON.parse(localStorage.getItem('dhms_patients') || '[]');
    const newReport = {
      id: `EHR-${Math.floor(100 + Math.random() * 900)}`,
      name: `${selectedLabForResults.testName} Report`,
      type: 'Lab Report',
      size: '1.8 KB',
      date: todayStr,
      author: 'Laboratory Specialist',
      details: { 
        summary: labResultsText,
        remarks: labRemarks,
        labRequestId: selectedLabForResults.id,
        orderedBy: selectedLabForResults.doctorName
      }
    };

    const updatedPatients = patientList.map(p => {
      if (p.id === selectedLabForResults.patientId) {
        return {
          ...p,
          reports: [newReport, ...(p.reports || [])]
        };
      }
      return p;
    });
    localStorage.setItem('dhms_patients', JSON.stringify(updatedPatients));

    // 3. Dispatch billing invoice
    const billing = JSON.parse(localStorage.getItem('dhms_billing') || '[]');
    const newInvoice = {
      id: `INV-${Math.floor(1000 + Math.random() * 9000)}`,
      patientId: selectedLabForResults.patientId,
      patientName: selectedLabForResults.patientName,
      date: todayStr,
      amount: selectedLabForResults.cost,
      status: "Unpaid",
      type: "Lab Diagnostics"
    };
    const updatedBilling = [newInvoice, ...billing];
    localStorage.setItem('dhms_billing', JSON.stringify(updatedBilling));

    // Clean up
    setSelectedLabForResults(null);
    setLabResultsText('');
    setLabRemarks('');
    alert(`Lab diagnostic report completed and submitted to recommended physician (${selectedLabForResults.doctorName}). Invoice created successfully.`);
  };

  // Calculations for financial stats
  const cleanCost = (c) => parseFloat((c || '').replace('$', '').trim()) || 0;
  const completedCount = labRequests.filter(l => l.status === 'Completed & Billed').length;
  const pendingCount = labRequests.filter(l => l.status === 'Pending').length;
  const labRevenue = labRequests
    .filter(l => l.status === 'Completed & Billed')
    .reduce((sum, l) => sum + cleanCost(l.cost), 0);
  const outstandingRevenue = labRequests
    .filter(l => l.status === 'Pending')
    .reduce((sum, l) => sum + cleanCost(l.cost), 0);

  // Filter requests
  const filteredRequests = labRequests.filter(req => {
    const matchesSearch = req.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          req.testName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          req.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'All' || 
                          (statusFilter === 'Pending' && req.status === 'Pending') ||
                          (statusFilter === 'Completed' && req.status === 'Completed & Billed');
    return matchesSearch && matchesStatus;
  });

  // Pagination
  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage) || 1;
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentRequests = filteredRequests.slice(indexOfFirstItem, indexOfLastItem);

  return (
    <div className="lab-container">
      {/* Topbar */}
      <div className="lab-topbar">
        <div className="lab-logo-area">
          <svg className="lab-logo-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4.5 16.5c-1.5 1.25-2.5 3-2.5 5h20c0-2-1-3.75-2.5-5"></path>
            <path d="M12 2v16"></path>
            <path d="M8 6h8"></path>
            <path d="M6 10h12"></path>
            <path d="M7 14h10"></path>
          </svg>
          <span className="lab-logo-text">DHMS</span>
          <span className="lab-logo-divider">|</span>
          <span className="lab-logo-sub">Laboratory Portal</span>
        </div>
        <div className="lab-topbar-right">
          <div className="lab-profile-info">
            <div className="lab-avatar">LS</div>
            <div className="lab-user-details">
              <strong>Lab Specialist</strong>
              <span>Pathology Department</span>
            </div>
          </div>
          <button onClick={onLogout} className="lab-btn-logout">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '16px', height: '16px' }}>
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
            Sign Out
          </button>
        </div>
      </div>

      {/* Main Workspace */}
      <div className="lab-workspace">
        {/* Sidebar Nav */}
        <div className="lab-sidebar">
          <ul className="lab-nav-links">
            <li className={activeTab === 'overview' ? 'active' : ''} onClick={() => { setActiveTab('overview'); setCurrentPage(1); }}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="9"></rect><rect x="14" y="3" width="7" height="5"></rect><rect x="14" y="12" width="7" height="9"></rect><rect x="3" y="16" width="7" height="5"></rect></svg>
              Lab Dashboard
            </li>
            <li className={activeTab === 'requests' ? 'active' : ''} onClick={() => { setActiveTab('requests'); setCurrentPage(1); }}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
              Doctor Referrals & Orders
            </li>
            <li className={activeTab === 'appointments' ? 'active' : ''} onClick={() => { setActiveTab('appointments'); setApptPage(1); }}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
              Direct Lab Appointments
            </li>
            <li className={activeTab === 'facilities' ? 'active' : ''} onClick={() => setActiveTab('facilities')}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>
              Lab Facilities & Services
            </li>
            <li className={activeTab === 'attendance' ? 'active' : ''} onClick={() => setActiveTab('attendance')}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
              Staff Attendance Log
            </li>
          </ul>
        </div>

        {/* Content Area */}
        <div className="lab-content-area">
          {activeTab === 'overview' && (
            <div className="lab-view-container animate-fade-in">
              <div className="lab-welcome-banner">
                <h1>Welcome Back, Specialist</h1>
                <p>Track pending requests, enter diagnostic findings, and publish cryptographically integrated EHR reports instantly back to recommending physicians.</p>
              </div>

              {/* Stats Grid */}
              <div className="lab-stats-grid">
                <div className="lab-stat-card border-purple" onClick={() => setActiveTab('requests')}>
                  <div className="lab-stat-icon-wrapper purple">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
                  </div>
                  <div className="lab-stat-details">
                    <h3>Doctor Referrals Pending</h3>
                    <div className="lab-stat-value">{pendingCount}</div>
                    <span>Communicated from clinics</span>
                  </div>
                </div>

                <div className="lab-stat-card border-green" onClick={() => setActiveTab('appointments')}>
                  <div className="lab-stat-icon-wrapper green">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle></svg>
                  </div>
                  <div className="lab-stat-details">
                    <h3>Direct Lab Appointments</h3>
                    <div className="lab-stat-value">{labAppointments.length}</div>
                    <span>Patient bookings</span>
                  </div>
                </div>

                <div className="lab-stat-card border-blue">
                  <div className="lab-stat-icon-wrapper blue">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
                  </div>
                  <div className="lab-stat-details">
                    <h3>Total Billings Generated</h3>
                    <div className="lab-stat-value">${labRevenue.toFixed(2)}</div>
                    <span>Outstanding: ${outstandingRevenue.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Recent Pending Table Summary */}
              <div className="lab-card" style={{ marginTop: '24px' }}>
                <div className="lab-card-header">
                  <h2>Recent Doctor Referrals & Suggestions</h2>
                  <button onClick={() => setActiveTab('requests')} className="lab-btn-link">View All &rarr;</button>
                </div>
                <div className="table-responsive">
                  <table className="lab-data-table">
                    <thead>
                      <tr>
                        <th>Request ID</th>
                        <th>Patient Name</th>
                        <th>Recommended Test</th>
                        <th>Ordering Physician</th>
                        <th>Date Suggested</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {labRequests.slice(0, 4).map(req => (
                        <tr key={req.id}>
                          <td><strong>{req.id}</strong></td>
                          <td>{req.patientName}</td>
                          <td>{req.testName}</td>
                          <td>{req.doctorName}</td>
                          <td>{req.date}</td>
                          <td>
                            <span className={`status-pill ${req.status === 'Pending' ? 'pending' : 'completed'}`}>
                              {req.status === 'Pending' ? 'Pending Analysis' : 'Report Sent'}
                            </span>
                          </td>
                        </tr>
                      ))}
                      {labRequests.length === 0 && (
                        <tr><td colSpan="6" style={{ textAlign: 'center', color: '#94a3b8', padding: '24px' }}>No laboratory requests communicated from clinics.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'requests' && (
            <div className="lab-view-container animate-fade-in">
              <div className="lab-view-header">
                <div>
                  <h1>Doctor Referrals & Diagnostic Orders</h1>
                  <p>Process pending physician diagnostic orders, enter structured reports, and push direct payment claims to the desk.</p>
                </div>
              </div>

              <div className="lab-card">
                {/* Filters / Search Bar */}
                <div className="lab-filters-row">
                  <div className="search-box">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                    <input 
                      type="text" 
                      placeholder="Search by ID, Patient, or Test..." 
                      value={searchQuery}
                      onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                    />
                  </div>

                  <div className="status-selector">
                    <span>Filter:</span>
                    <button className={statusFilter === 'All' ? 'active' : ''} onClick={() => { setStatusFilter('All'); setCurrentPage(1); }}>All</button>
                    <button className={statusFilter === 'Pending' ? 'active' : ''} onClick={() => { setStatusFilter('Pending'); setCurrentPage(1); }}>Pending</button>
                    <button className={statusFilter === 'Completed' ? 'active' : ''} onClick={() => { setStatusFilter('Completed'); setCurrentPage(1); }}>Completed</button>
                  </div>
                </div>

                {/* Main Table */}
                <div className="table-responsive">
                  <table className="lab-data-table">
                    <thead>
                      <tr>
                        <th>Request ID</th>
                        <th>Patient Details</th>
                        <th>Diagnostic Test Name</th>
                        <th>Recommending Doctor</th>
                        <th>Date Ordered</th>
                        <th>Service Fee</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentRequests.map(req => (
                        <tr key={req.id}>
                          <td><strong>{req.id}</strong></td>
                          <td>
                            <div className="patient-cell">
                              <strong>{req.patientName}</strong>
                              <span>ID: {req.patientId}</span>
                            </div>
                          </td>
                          <td><strong>{req.testName}</strong></td>
                          <td>{req.doctorName}</td>
                          <td>{req.date}</td>
                          <td><span className="price-tag">{req.cost}</span></td>
                          <td>
                            <span className={`status-pill ${req.status === 'Pending' ? 'pending' : 'completed'}`}>
                              {req.status === 'Pending' ? 'Pending' : 'Completed'}
                            </span>
                          </td>
                          <td>
                            {req.status === 'Pending' ? (
                              <button 
                                onClick={() => {
                                  setSelectedLabForResults(req);
                                  setLabResultsText('');
                                  setLabRemarks('');
                                }}
                                className="lab-btn-action"
                              >
                                Enter Results
                              </button>
                            ) : (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span className="billed-indicator">Billed & Sent</span>
                                {req.results && (
                                  <button
                                    onClick={() => setViewedLabRequestResults(req)}
                                    className="lab-btn-secondary"
                                  >
                                    View Report
                                  </button>
                                )}
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                      {currentRequests.length === 0 && (
                        <tr><td colSpan="8" style={{ textAlign: 'center', color: '#94a3b8', padding: '32px' }}>No referrals or orders matching filters found.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="lab-pagination-row">
                    <span className="pagination-info">Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredRequests.length)} of {filteredRequests.length} records</span>
                    <div className="pagination-buttons">
                      <button 
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(prev => prev - 1)}
                        className="pagination-btn"
                      >
                        Previous
                      </button>
                      {[...Array(totalPages)].map((_, i) => (
                        <button
                          key={i}
                          onClick={() => setCurrentPage(i + 1)}
                          className={`pagination-btn num ${currentPage === i + 1 ? 'active' : ''}`}
                        >
                          {i + 1}
                        </button>
                      ))}
                      <button 
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage(prev => prev + 1)}
                        className="pagination-btn"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'appointments' && (
            <div className="lab-view-container animate-fade-in">
              <div className="lab-view-header">
                <div>
                  <h1>Direct Lab Appointments</h1>
                  <p>Manage appointments scheduled by patients directly for diagnostic sample collections.</p>
                </div>
              </div>

              <div className="lab-card">
                <div className="table-responsive">
                  <table className="lab-data-table">
                    <thead>
                      <tr>
                        <th>Appointment ID</th>
                        <th>Patient Name</th>
                        <th>Date Scheduled</th>
                        <th>Time Window</th>
                        <th>Requested Lab Service</th>
                        <th>Appointment Type</th>
                        <th>Roster Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentAppts.map(appt => (
                        <tr key={appt.id}>
                          <td><strong>{appt.id}</strong></td>
                          <td><strong>{appt.patientName}</strong><div style={{ fontSize: '11px', color: '#64748b' }}>ID: {appt.patientId}</div></td>
                          <td>{appt.date}</td>
                          <td>{appt.time}</td>
                          <td>{appt.reason || 'General Diagnostic Checkup'}</td>
                          <td><span className={`priority-pill ${appt.type === 'Telemedicine' ? 'normal' : 'high'}`}>{appt.type}</span></td>
                          <td>
                            <span className={`status-pill ${appt.status.toLowerCase().includes('pending') ? 'pending' : 'completed'}`}>
                              {appt.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                      {labAppointments.length === 0 && (
                        <tr><td colSpan="7" style={{ textAlign: 'center', color: '#94a3b8', padding: '32px' }}>No direct laboratory appointments booked.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Controls */}
                {totalApptPages > 1 && (
                  <div className="lab-pagination-row">
                    <span className="pagination-info">Showing {((apptPage - 1) * apptsPerPage) + 1} to {Math.min(apptPage * apptsPerPage, labAppointments.length)} of {labAppointments.length} records</span>
                    <div className="pagination-buttons">
                      <button 
                        disabled={apptPage === 1}
                        onClick={() => setApptPage(prev => prev - 1)}
                        className="pagination-btn"
                      >
                        Previous
                      </button>
                      {[...Array(totalApptPages)].map((_, i) => (
                        <button
                          key={i}
                          onClick={() => setApptPage(i + 1)}
                          className={`pagination-btn num ${apptPage === i + 1 ? 'active' : ''}`}
                        >
                          {i + 1}
                        </button>
                      ))}
                      <button 
                        disabled={apptPage === totalApptPages}
                        onClick={() => setApptPage(prev => prev + 1)}
                        className="pagination-btn"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'attendance' && (
            <div className="lab-view-container animate-fade-in">
              <div className="lab-welcome-banner">
                <h1>Laboratory Staff Shift Attendance</h1>
                <p>Record daily check-in / check-out times and log shift attendance for lab technicians and specialists.</p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: '24px', marginTop: '20px' }}>
                {/* Form Card */}
                <div className="lab-card">
                  <h2 style={{ fontSize: '18px', color: '#1e293b', marginBottom: '16px' }}>Mark Daily Attendance</h2>
                  <form onSubmit={handleMarkLabAttendance} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div className="form-group">
                      <label>Select Lab Specialist / Technician</label>
                      <select 
                        value={labAttendanceForm.staffId} 
                        onChange={(e) => {
                          const id = e.target.value;
                          const name = id === 'LAB-201' ? 'Dr. Alex Vance' : 'Linda Martinez';
                          const role = id === 'LAB-201' ? 'Chief Lab Specialist' : 'Pathology Technician';
                          setLabAttendanceForm({ ...labAttendanceForm, staffId: id, staffName: name, role: role });
                        }}
                        style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                      >
                        <option value="LAB-201">Dr. Alex Vance (Chief Lab Specialist)</option>
                        <option value="LAB-202">Linda Martinez (Pathology Technician)</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Shift Date</label>
                      <input 
                        type="date" 
                        required 
                        value={labAttendanceForm.date} 
                        onChange={(e) => setLabAttendanceForm({ ...labAttendanceForm, date: e.target.value })} 
                        style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                      />
                    </div>

                    <div className="form-group">
                      <label>Attendance Status</label>
                      <select 
                        value={labAttendanceForm.status} 
                        onChange={(e) => setLabAttendanceForm({ ...labAttendanceForm, status: e.target.value })}
                        style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                      >
                        <option value="Present">Present</option>
                        <option value="Late">Late</option>
                        <option value="Absent">Absent</option>
                        <option value="On Leave">On Leave</option>
                      </select>
                    </div>

                    {labAttendanceForm.status !== 'Absent' && labAttendanceForm.status !== 'On Leave' && (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                        <div className="form-group">
                          <label>Check In Time</label>
                          <input type="text" value={labAttendanceForm.checkIn} onChange={(e) => setLabAttendanceForm({ ...labAttendanceForm, checkIn: e.target.value })} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                        </div>
                        <div className="form-group">
                          <label>Check Out Time</label>
                          <input type="text" value={labAttendanceForm.checkOut} onChange={(e) => setLabAttendanceForm({ ...labAttendanceForm, checkOut: e.target.value })} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                        </div>
                      </div>
                    )}

                    <div className="form-group">
                      <label>Shift Remarks / Absence Reason</label>
                      <input type="text" placeholder="e.g. Biochemistry Duty / Approved leave" value={labAttendanceForm.remarks} onChange={(e) => setLabAttendanceForm({ ...labAttendanceForm, remarks: e.target.value })} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                    </div>

                    <button type="submit" style={{ padding: '10px', background: '#3f51b5', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px' }}>
                      Save Attendance Record
                    </button>
                  </form>
                </div>

                {/* History Log Table */}
                <div className="lab-card">
                  <h2 style={{ fontSize: '18px', color: '#1e293b', marginBottom: '16px' }}>Laboratory Attendance History</h2>
                  <table className="lab-data-table compact-table">
                    <thead>
                      <tr>
                        <th className="nowrap">Date</th>
                        <th>Staff Member</th>
                        <th className="nowrap">Check In / Out</th>
                        <th className="nowrap">Status</th>
                        <th>Remarks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(JSON.parse(localStorage.getItem('dhms_master_attendance') || '[]'))
                        .filter(a => a.module === 'Laboratory')
                        .map(att => (
                          <tr key={att.id}>
                            <td className="nowrap"><strong>{att.date}</strong></td>
                            <td>
                              <strong>{att.staffName}</strong>
                              <div style={{ fontSize: '11px', color: '#64748b' }}>{att.role}</div>
                            </td>
                            <td className="nowrap">{att.checkIn} - {att.checkOut}</td>
                            <td className="nowrap">
                              <span className="badge" style={{
                                padding: '4px 10px',
                                borderRadius: '999px',
                                fontSize: '12px',
                                fontWeight: 'bold',
                                backgroundColor: att.status === 'Present' ? '#dcfce7' : att.status === 'Late' ? '#fef3c7' : '#fee2e2',
                                color: att.status === 'Present' ? '#15803d' : att.status === 'Late' ? '#b45309' : '#b91c1c'
                              }}>
                                {att.status}
                              </span>
                            </td>
                            <td>{att.remarks}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'facilities' && (
            <div className="lab-view-container animate-fade-in">
              <div className="lab-view-header">
                <div>
                  <h1>Lab Facilities & Available Services</h1>
                  <p>Reference catalog of pathology, biochemistry, and microbiology packages available at the DHMS Facility.</p>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                {labFacilities.map((fac, idx) => (
                  <div key={idx} className="lab-card" style={{ padding: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px', marginBottom: '12px' }}>
                      <div>
                        <span style={{ fontSize: '11px', color: '#6366f1', fontWeight: 'bold' }}>{fac.code}</span>
                        <h3 style={{ margin: '4px 0 0 0', fontSize: '15px', color: '#1e293b' }}>{fac.name}</h3>
                      </div>
                      <span className="price-tag" style={{ fontSize: '16px', color: '#4f46e5' }}>{fac.cost}</span>
                    </div>
                    <p style={{ margin: '0 0 12px 0', fontSize: '12px', color: '#64748b', lineHeight: '1.4' }}>{fac.description}</p>
                    <div style={{ display: 'flex', gap: '12px', fontSize: '11px', color: '#475569', backgroundColor: '#f8fafc', padding: '8px', borderRadius: '6px' }}>
                      <span>Department: <strong>{fac.dept}</strong></span>
                      <span>•</span>
                      <span>Turnaround: <strong>{fac.time}</strong></span>
                      <span>•</span>
                      <span>{fac.fast}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Lab Results Submission Modal */}
      {selectedLabForResults && (
        <div className="lab-modal-overlay">
          <div className="lab-modal">
            <div className="lab-modal-header bg-purple">
              <h3>Lab Report Entry - {selectedLabForResults.testName}</h3>
              <button onClick={() => setSelectedLabForResults(null)} className="lab-modal-close">&times;</button>
            </div>
            
            <form onSubmit={handleCompleteLabWithResults}>
              <div className="lab-modal-body">
                <div className="lab-patient-summary">
                  <div><strong>Patient:</strong> {selectedLabForResults.patientName} (ID: {selectedLabForResults.patientId})</div>
                  <div><strong>Recommending Doctor:</strong> {selectedLabForResults.doctorName}</div>
                  <div><strong>Service Cost:</strong> {selectedLabForResults.cost}</div>
                </div>

                <div className="form-group">
                  <label>Diagnostic Results / Key Findings</label>
                  <textarea 
                    placeholder="Enter diagnostic details (e.g. Cholesterol: 215 mg/dL, HDL: 45 mg/dL, LDL: 142 mg/dL...)"
                    value={labResultsText}
                    onChange={(e) => setLabResultsText(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Technician Remarks / Recommendations</label>
                  <textarea 
                    placeholder="Any specific observations or general remarks..."
                    value={labRemarks}
                    onChange={(e) => setLabRemarks(e.target.value)}
                  />
                </div>
              </div>

              <div className="lab-modal-footer">
                <button type="button" onClick={() => setSelectedLabForResults(null)} className="lab-btn-cancel">Cancel</button>
                <button type="submit" className="lab-btn-submit bg-purple">Complete & Dispatched to Recommended Doctor</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lab Results View Modal */}
      {viewedLabRequestResults && (
        <div className="lab-modal-overlay">
          <div className="lab-modal">
            <div className="lab-modal-header bg-dark">
              <h3>Lab Report Summary - {viewedLabRequestResults.testName}</h3>
              <button onClick={() => setViewedLabRequestResults(null)} className="lab-modal-close">&times;</button>
            </div>
            
            <div className="lab-modal-body">
              <div className="lab-patient-summary">
                <div><strong>Patient:</strong> {viewedLabRequestResults.patientName} (ID: {viewedLabRequestResults.patientId})</div>
                <div><strong>Recommending Doctor:</strong> {viewedLabRequestResults.doctorName}</div>
                <div><strong>Date Completed:</strong> {viewedLabRequestResults.completedDate || viewedLabRequestResults.date}</div>
              </div>

              <div className="lab-results-block">
                <h4>Diagnostic Findings:</h4>
                <div className="findings-box">
                  {viewedLabRequestResults.results}
                </div>
              </div>

              {viewedLabRequestResults.remarks && (
                <div className="lab-results-block" style={{ marginTop: '16px' }}>
                  <h4>Technician Remarks:</h4>
                  <div className="remarks-box">
                    {viewedLabRequestResults.remarks}
                  </div>
                </div>
              )}
            </div>

            <div className="lab-modal-footer">
              <button onClick={() => setViewedLabRequestResults(null)} className="lab-btn-submit bg-dark">Close Report</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
