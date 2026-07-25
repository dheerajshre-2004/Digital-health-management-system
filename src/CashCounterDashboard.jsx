import React, { useState, useEffect } from 'react';
import './CashCounterDashboard.css';

export default function CashCounterDashboard({ onLogout }) {
  const [activeTab, setActiveTab] = useState('overview');

  // Datasets from localStorage
  const [patients, setPatients] = useState(() => {
    return JSON.parse(localStorage.getItem('dhms_patients') || '[]');
  });

  const [billingList, setBillingList] = useState(() => {
    return JSON.parse(localStorage.getItem('dhms_billing') || '[]');
  });

  const [appointments, setAppointments] = useState(() => {
    return JSON.parse(localStorage.getItem('dhms_appointments') || '[]');
  });

  // Filter & Search States
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Payment Collection Modal State
  const [paymentModalData, setPaymentModalData] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('Physical Cash Payment');
  const [paymentRemarks, setPaymentRemarks] = useState('');
  const [printedInvoiceData, setPrintedInvoiceData] = useState(null);

  // Attendance Tracker States
  const [attendanceRecords, setAttendanceRecords] = useState(() => {
    return JSON.parse(localStorage.getItem('dhms_master_attendance') || '[]');
  });
  
  const [cashierAttendanceForm, setCashierAttendanceForm] = useState({
    staffId: 'CSH-201',
    staffName: 'Clara Oswald',
    role: 'Senior Billing Specialist',
    date: new Date().toISOString().split('T')[0],
    status: 'Present',
    checkIn: '08:00 AM',
    checkOut: '04:30 PM',
    remarks: 'Billing Desk Morning Shift'
  });

  // Sync state with local storage on updates
  useEffect(() => {
    const handleStorageChange = () => {
      setPatients(JSON.parse(localStorage.getItem('dhms_patients') || '[]'));
      setBillingList(JSON.parse(localStorage.getItem('dhms_billing') || '[]'));
      setAppointments(JSON.parse(localStorage.getItem('dhms_appointments') || '[]'));
      setAttendanceRecords(JSON.parse(localStorage.getItem('dhms_master_attendance') || '[]'));
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Mark cashier attendance
  const handleMarkAttendance = (e) => {
    e.preventDefault();
    const allAtt = JSON.parse(localStorage.getItem('dhms_master_attendance') || '[]');
    const newRecord = {
      id: `ATT-${Math.floor(1000 + Math.random() * 9000)}`,
      date: cashierAttendanceForm.date,
      module: 'Cashier',
      staffId: cashierAttendanceForm.staffId,
      staffName: cashierAttendanceForm.staffName,
      role: cashierAttendanceForm.role,
      checkIn: cashierAttendanceForm.status === 'Absent' || cashierAttendanceForm.status === 'On Leave' ? '-' : cashierAttendanceForm.checkIn,
      checkOut: cashierAttendanceForm.status === 'Absent' || cashierAttendanceForm.status === 'On Leave' ? '-' : cashierAttendanceForm.checkOut,
      status: cashierAttendanceForm.status,
      remarks: cashierAttendanceForm.remarks || 'Cash Counter Shift'
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
    setAttendanceRecords(updated);
    alert(`Shift attendance logged successfully for ${cashierAttendanceForm.staffName} (${cashierAttendanceForm.status}).`);
  };

  // Collect Payment Action
  const handleProcessPaymentSubmit = (e) => {
    e.preventDefault();
    if (!paymentModalData) return;

    const allBilling = JSON.parse(localStorage.getItem('dhms_billing') || '[]');
    const finalPaidInvoice = {
      ...paymentModalData,
      status: 'Paid',
      paymentMethod: paymentMethod,
      paymentRemarks: paymentRemarks || 'Processed at Central Cash Desk',
      paymentDate: new Date().toISOString().split('T')[0]
    };

    const updatedBilling = allBilling.map(inv => {
      if (inv.id === paymentModalData.id) {
        return finalPaidInvoice;
      }
      return inv;
    });

    localStorage.setItem('dhms_billing', JSON.stringify(updatedBilling));
    setBillingList(updatedBilling);
    
    // Save details to trigger printable receipt modal
    setPrintedInvoiceData(finalPaidInvoice);

    // Close collection modal
    setPaymentModalData(null);
    setPaymentMethod('Physical Cash Payment');
    setPaymentRemarks('');
  };

  // Financial Stats calculations
  const getFinancialStats = () => {
    const cleanVal = (val) => parseFloat((val || '').replace('$', '').trim()) || 0;
    
    const totalCount = billingList.length;
    const unpaidList = billingList.filter(b => b.status === 'Unpaid');
    const paidList = billingList.filter(b => b.status === 'Paid');

    const totalUnpaidAmount = unpaidList.reduce((sum, b) => sum + cleanVal(b.amount), 0);
    const totalPaidAmount = paidList.reduce((sum, b) => sum + cleanVal(b.amount), 0);

    return {
      totalCount,
      unpaidCount: unpaidList.length,
      paidCount: paidList.length,
      totalUnpaidAmount: `$${totalUnpaidAmount.toFixed(2)}`,
      totalPaidAmount: `$${totalPaidAmount.toFixed(2)}`
    };
  };

  const stats = getFinancialStats();

  // Filter and Search logic
  const filteredBilling = billingList.filter(inv => {
    const query = searchQuery.toLowerCase();
    const matchesSearch = inv.id.toLowerCase().includes(query) ||
                          inv.patientId.toLowerCase().includes(query) ||
                          inv.patientName.toLowerCase().includes(query) ||
                          inv.type.toLowerCase().includes(query);
                          
    const matchesStatus = statusFilter === 'All' || inv.status === statusFilter;
    const matchesType = typeFilter === 'All' || inv.type === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  const totalPages = Math.ceil(filteredBilling.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedBilling = filteredBilling.slice(startIndex, startIndex + itemsPerPage);

  const renderOverview = () => (
    <div className="cc-view-container">
      <div className="cc-header-banner">
        <div>
          <h2>Billing Overview</h2>
          <p>Real-time cash flow, pending patient collections, and payment history.</p>
        </div>
      </div>

      <div className="cc-stats-grid">
        <div className="cc-stat-card">
          <div className="cc-stat-header">
            <span>Total Invoiced</span>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2"><rect x="2" y="4" width="20" height="16" rx="2" ry="2"></rect><line x1="12" y1="4" x2="12" y2="20"></line><line x1="2" y1="12" x2="22" y2="12"></line></svg>
          </div>
          <h3>{stats.totalPaidAmount}</h3>
          <p>{stats.paidCount} Paid Transactions</p>
        </div>

        <div className="cc-stat-card warn">
          <div className="cc-stat-header">
            <span>Outstanding Payments</span>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
          </div>
          <h3>{stats.totalUnpaidAmount}</h3>
          <p>{stats.unpaidCount} Bills Pending Cash Desk</p>
        </div>

        <div className="cc-stat-card info">
          <div className="cc-stat-header">
            <span>Total System Invoices</span>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
          </div>
          <h3>{stats.totalCount}</h3>
          <p>Online & Offline Invoices</p>
        </div>
      </div>

      <div className="cc-grid-layout mt-6" style={{ marginTop: '24px' }}>
        {/* Quick Pending Payments list */}
        <div className="cc-card">
          <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', color: '#1e293b' }}>Active Pending Collections</h3>
          <div className="cc-table-wrapper">
            <table className="cc-table">
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Amount</th>
                  <th>Reason / Type</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {billingList.filter(b => b.status === 'Unpaid').slice(0, 5).length === 0 ? (
                  <tr><td colSpan="4" style={{ textAlign: 'center', padding: '24px', color: '#64748b' }}>No pending invoices. All bills are fully paid!</td></tr>
                ) : (
                  billingList.filter(b => b.status === 'Unpaid').slice(0, 5).map(inv => (
                    <tr key={inv.id}>
                      <td>
                        <strong>{inv.patientName}</strong>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>ID: {inv.patientId}</div>
                      </td>
                      <td style={{ fontWeight: '700', color: '#b91c1c' }}>{inv.amount}</td>
                      <td>
                        <span style={{ fontSize: '11.5px', background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>{inv.type}</span>
                      </td>
                      <td>
                        <button className="cc-btn-small" onClick={() => setPaymentModalData(inv)}>Collect</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Transactions List */}
        <div className="cc-card">
          <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', color: '#1e293b' }}>Recent Cash Desk Activities</h3>
          <div className="cc-table-wrapper">
            <table className="cc-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Patient</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Payment Mode</th>
                </tr>
              </thead>
              <tbody>
                {billingList.slice(0, 5).length === 0 ? (
                  <tr><td colSpan="5" style={{ textAlign: 'center', padding: '24px', color: '#64748b' }}>No invoices logged in the system yet.</td></tr>
                ) : (
                  billingList.slice(0, 5).map(inv => (
                    <tr key={inv.id}>
                      <td>{inv.date}</td>
                      <td><strong>{inv.patientName}</strong></td>
                      <td style={{ fontWeight: '600' }}>{inv.amount}</td>
                      <td>
                        <span className={`cc-status-badge ${inv.status.toLowerCase()}`}>{inv.status}</span>
                      </td>
                      <td>
                        {inv.status === 'Paid' ? (
                          <span style={{ fontSize: '11px', fontWeight: '600', color: '#475569', background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>
                            {inv.paymentMethod || 'Online'}
                          </span>
                        ) : (
                          <span style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: '11px' }}>-</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );

  const renderUnpaidInvoices = () => {
    const unpaidList = billingList.filter(b => b.status === 'Unpaid');
    return (
      <div className="cc-view-container">
        <div className="cc-header-banner">
          <div>
            <h2>Pending Collections Panel</h2>
            <p>Collect cash or online payments for patient consultations, lab reports, and doctor visits.</p>
          </div>
        </div>

        <div className="cc-card">
          <table className="cc-table">
            <thead>
              <tr>
                <th>Invoice ID</th>
                <th>Patient Details</th>
                <th>Invoiced Date</th>
                <th>Charge Type</th>
                <th>Amount Due</th>
                <th>Status</th>
                <th>Payment Desk</th>
              </tr>
            </thead>
            <tbody>
              {unpaidList.length === 0 ? (
                <tr><td colSpan="7" style={{ textAlign: 'center', padding: '48px', color: '#64748b' }}>No outstanding patient bills found!</td></tr>
              ) : (
                unpaidList.map(inv => (
                  <tr key={inv.id}>
                    <td><strong>{inv.id}</strong></td>
                    <td>
                      <strong>{inv.patientName}</strong>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>ID: {inv.patientId}</div>
                    </td>
                    <td>{inv.date}</td>
                    <td><span style={{ fontSize: '11.5px', background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>{inv.type}</span></td>
                    <td style={{ fontWeight: '700', color: '#b91c1c' }}>{inv.amount}</td>
                    <td><span className="cc-status-badge unpaid">Unpaid</span></td>
                    <td>
                      <button className="cc-btn-primary" onClick={() => setPaymentModalData(inv)}>Collect Payment</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderTransactions = () => {
    return (
      <div className="cc-view-container">
        <div className="cc-header-banner">
          <div>
            <h2>All Billing Transactions</h2>
            <p>Search, filter, and audit all invoice lists generated across the hospital.</p>
          </div>
        </div>

        <div className="cc-card">
          <div className="cc-filters-row">
            <input 
              type="text" 
              placeholder="Search by ID, name or type..." 
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              className="cc-filter-input"
            />
            
            <div style={{ display: 'flex', gap: '8px' }}>
              <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }} className="cc-filter-select">
                <option value="All">All Statuses</option>
                <option value="Paid">Paid</option>
                <option value="Unpaid">Unpaid</option>
              </select>

              <select value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setCurrentPage(1); }} className="cc-filter-select">
                <option value="All">All Invoice Types</option>
                <option value="Consultation Fee">Consultation Fee</option>
                <option value="Lab Diagnostics">Lab Diagnostics</option>
                <option value="Prescription Co-pay">Prescription Co-pay</option>
                <option value="Hospital Ward Charge">Hospital Ward Charge</option>
                <option value="Appointment Fee">Appointment Fee</option>
              </select>
            </div>
          </div>

          <table className="cc-table">
            <thead>
              <tr>
                <th>Invoice ID</th>
                <th>Patient ID</th>
                <th>Patient Name</th>
                <th>Billing Date</th>
                <th>Type</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Payment Mode</th>
              </tr>
            </thead>
            <tbody>
              {paginatedBilling.length === 0 ? (
                <tr><td colSpan="8" style={{ textAlign: 'center', padding: '32px 0', color: '#64748b' }}>No billing transactions found matching filters</td></tr>
              ) : (
                paginatedBilling.map(inv => (
                  <tr key={inv.id}>
                    <td><strong>{inv.id}</strong></td>
                    <td>{inv.patientId}</td>
                    <td><strong>{inv.patientName}</strong></td>
                    <td>{inv.date}</td>
                    <td>{inv.type}</td>
                    <td style={{ fontWeight: '600' }}>{inv.amount}</td>
                    <td>
                      <span className={`cc-status-badge ${inv.status.toLowerCase()}`}>{inv.status}</span>
                    </td>
                    <td>
                      {inv.status === 'Paid' ? (
                        <span style={{ fontSize: '11px', fontWeight: '600', color: '#475569', background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>
                          {inv.paymentMethod || 'Online'}
                        </span>
                      ) : (
                        <span style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: '11px' }}>-</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {filteredBilling.length > 0 && (
            <div className="cc-pagination">
              <span className="cc-page-info">
                Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredBilling.length)} of {filteredBilling.length} invoices
              </span>
              {totalPages > 1 && (
                <div className="cc-pagination-buttons">
                  <button 
                    disabled={currentPage === 1} 
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    className="cc-page-btn"
                  >
                    Prev
                  </button>
                  <button 
                    disabled={currentPage === totalPages} 
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    className="cc-page-btn"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderAttendance = () => {
    const cashierAttRecords = attendanceRecords.filter(att => att.module === 'Cashier');
    return (
      <div className="cc-view-container">
        <div className="cc-header-banner">
          <div>
            <h2>Billing Desk Shift Log</h2>
            <p>Log shift check-in/out times, breaks, and daily cash drawer validation remarks.</p>
          </div>
        </div>

        <div className="cc-grid-layout">
          {/* Marking Form */}
          <div className="cc-card">
            <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', color: '#1e293b' }}>Mark Shift Attendance</h3>
            <form className="cc-form" onSubmit={handleMarkAttendance}>
              <div className="cc-form-row">
                <div className="cc-form-group">
                  <label>Staff Member ID</label>
                  <input type="text" readOnly value={cashierAttendanceForm.staffId} />
                </div>
                <div className="cc-form-group">
                  <label>Shift Date</label>
                  <input type="date" required value={cashierAttendanceForm.date} onChange={e => setCashierAttendanceForm({...cashierAttendanceForm, date: e.target.value})} />
                </div>
              </div>

              <div className="cc-form-row">
                <div className="cc-form-group">
                  <label>Staff Name</label>
                  <input type="text" readOnly value={cashierAttendanceForm.staffName} />
                </div>
                <div className="cc-form-group">
                  <label>Shift Attendance Status</label>
                  <select value={cashierAttendanceForm.status} onChange={e => setCashierAttendanceForm({...cashierAttendanceForm, status: e.target.value})}>
                    <option value="Present">Present</option>
                    <option value="Late">Late Check-in</option>
                    <option value="Absent">Absent</option>
                    <option value="On Leave">Approved Leave</option>
                  </select>
                </div>
              </div>

              {cashierAttendanceForm.status !== 'Absent' && cashierAttendanceForm.status !== 'On Leave' && (
                <div className="cc-form-row">
                  <div className="cc-form-group">
                    <label>Shift Check In Time</label>
                    <input type="text" value={cashierAttendanceForm.checkIn} onChange={e => setCashierAttendanceForm({...cashierAttendanceForm, checkIn: e.target.value})} />
                  </div>
                  <div className="cc-form-group">
                    <label>Shift Check Out Time</label>
                    <input type="text" value={cashierAttendanceForm.checkOut} onChange={e => setCashierAttendanceForm({...cashierAttendanceForm, checkOut: e.target.value})} />
                  </div>
                </div>
              )}

              <div className="cc-form-group">
                <label>Register Comments / Cash Drawer Starting</label>
                <input 
                  type="text" 
                  placeholder="e.g. Cash drawer seeded with $200.00" 
                  value={cashierAttendanceForm.remarks} 
                  onChange={e => setCashierAttendanceForm({...cashierAttendanceForm, remarks: e.target.value})} 
                />
              </div>

              <button type="submit" className="cc-btn-primary mt-4">Log Counter Shift</button>
            </form>
          </div>

          {/* Log History */}
          <div className="cc-card">
            <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', color: '#1e293b' }}>Attendance History</h3>
            <table className="cc-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Staff Member</th>
                  <th>Check In/Out</th>
                  <th>Status</th>
                  <th>Remarks</th>
                </tr>
              </thead>
              <tbody>
                {cashierAttRecords.length === 0 ? (
                  <tr><td colSpan="5" style={{ textAlign: 'center', padding: '24px', color: '#64748b' }}>No desk attendance logs recorded yet.</td></tr>
                ) : (
                  cashierAttRecords.map(att => (
                    <tr key={att.id}>
                      <td><strong>{att.date}</strong></td>
                      <td>
                        <strong>{att.staffName}</strong>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>{att.role}</div>
                      </td>
                      <td>{att.checkIn} - {att.checkOut}</td>
                      <td>
                        <span className="cc-status-badge" style={{
                          backgroundColor: att.status === 'Present' ? '#dcfce7' : att.status === 'Late' ? '#fef3c7' : '#fee2e2',
                          color: att.status === 'Present' ? '#15803d' : att.status === 'Late' ? '#b45309' : '#b91c1c'
                        }}>
                          {att.status}
                        </span>
                      </td>
                      <td>{att.remarks}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="cc-container">
      {/* Topbar */}
      <header className="cc-topbar no-print">
        <div className="cc-logo-area">
          <svg className="cc-logo-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="4" width="20" height="16" rx="2" ry="2"></rect><line x1="12" y1="4" x2="12" y2="20"></line><line x1="2" y1="12" x2="22" y2="12"></line>
          </svg>
          <span className="cc-logo-text">DHMS</span>
          <span className="cc-logo-divider">|</span>
          <span className="cc-logo-sub">Central Cash Desk</span>
        </div>
        <div className="cc-topbar-right">
          <div className="cc-profile-info">
            <div className="cc-avatar">C</div>
            <div className="cc-user-details">
              <strong>Clara Oswald</strong>
              <span>Billing Counter</span>
            </div>
            <div className="cc-role-badge">CASH DESK SPECIALIST</div>
          </div>
          <button className="cc-signout-btn" onClick={onLogout} title="Sign Out">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
          </button>
        </div>
      </header>

      <div className="cc-body">
        {/* Sidebar */}
        <aside className="cc-sidebar no-print">
          <ul className="cc-nav">
            <li className={activeTab === 'overview' ? 'active' : ''} onClick={() => setActiveTab('overview')}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="9"></rect><rect x="14" y="3" width="7" height="5"></rect><rect x="14" y="12" width="7" height="9"></rect><rect x="3" y="16" width="7" height="5"></rect></svg>
              Desk Overview
            </li>
            <li className={activeTab === 'unpaid' ? 'active' : ''} onClick={() => setActiveTab('unpaid')}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
              Collect Payments
            </li>
            <li className={activeTab === 'transactions' ? 'active' : ''} onClick={() => { setActiveTab('transactions'); setCurrentPage(1); }}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2" ry="2"></rect><line x1="12" y1="4" x2="12" y2="20"></line><line x1="2" y1="12" x2="22" y2="12"></line></svg>
              All Transactions
            </li>
            <li className={activeTab === 'attendance' ? 'active' : ''} onClick={() => setActiveTab('attendance')}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
              Shift Attendance
            </li>
          </ul>
        </aside>

        {/* Main Content */}
        <main className="cc-main">
          {activeTab === 'overview' && renderOverview()}
          {activeTab === 'unpaid' && renderUnpaidInvoices()}
          {activeTab === 'transactions' && renderTransactions()}
          {activeTab === 'attendance' && renderAttendance()}
        </main>
      </div>

      {/* Collect Payment Modal overlay */}
      {paymentModalData && (
        <div className="cc-modal-overlay no-print">
          <div className="cc-modal-content">
            <div className="cc-modal-header">
              <h3>Collect Payment - Invoice {paymentModalData.id}</h3>
              <button className="cc-btn-close" onClick={() => setPaymentModalData(null)}>&times;</button>
            </div>
            <form onSubmit={handleProcessPaymentSubmit}>
              <div className="cc-modal-body">
                <div style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ color: '#475569', fontSize: '13px' }}>Patient Name:</span>
                    <strong style={{ color: '#1e293b' }}>{paymentModalData.patientName} ({paymentModalData.patientId})</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ color: '#475569', fontSize: '13px' }}>Billing Charge:</span>
                    <strong style={{ color: '#1e293b' }}>{paymentModalData.type}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed #cbd5e1', paddingTop: '8px', marginTop: '8px' }}>
                    <strong style={{ color: '#1e293b' }}>Amount Due:</strong>
                    <strong style={{ color: '#b91c1c', fontSize: '18px' }}>{paymentModalData.amount}</strong>
                  </div>
                </div>

                <div className="cc-form-group">
                  <label>Payment Mode</label>
                  <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', width: '100%' }}>
                    <option value="Online Payment (Card/UPI)">Online Payment (Card/UPI)</option>
                    <option value="Physical Cash Payment">Physical Cash Payment</option>
                  </select>
                </div>

                <div className="cc-form-group" style={{ marginTop: '12px' }}>
                  <label>Transaction Notes / Reference ID</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Transaction Ref or Cash received" 
                    value={paymentRemarks}
                    onChange={e => setPaymentRemarks(e.target.value)}
                  />
                </div>
              </div>
              <div className="cc-modal-footer">
                <button type="button" className="cc-btn-secondary" onClick={() => setPaymentModalData(null)}>Cancel</button>
                <button type="submit" className="cc-btn-primary">Confirm & Process Payment</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Print Receipt Modal overlay */}
      {printedInvoiceData && (
        <div className="cc-modal-overlay">
          <div className="cc-modal-content print-modal" style={{ maxWidth: '540px', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
            <div className="cc-modal-header no-print">
              <h3>Invoice Payment Receipt</h3>
              <button className="cc-btn-close" onClick={() => setPrintedInvoiceData(null)}>&times;</button>
            </div>
            <div className="cc-modal-body print-area" id="printable-receipt" style={{ padding: '32px', backgroundColor: 'white', color: '#1e293b', fontFamily: 'Courier New, Courier, monospace', overflowY: 'auto', flex: 1 }}>
              <div style={{ textAlign: 'center', borderBottom: '2px solid #1e293b', paddingBottom: '16px', marginBottom: '20px' }}>
                <h2 style={{ margin: '0 0 4px 0', fontSize: '20px', fontWeight: 'bold' }}>DHMS CENTRAL CLINICAL CENTER</h2>
                <p style={{ margin: 0, fontSize: '12px' }}>100 Hospital Road, Medical City</p>
                <p style={{ margin: 0, fontSize: '12px' }}>Phone: +1 (555) 019-2000 | Email: billing@dhms.org</p>
              </div>

              <div style={{ marginBottom: '20px', fontSize: '13px' }}>
                <h4 style={{ margin: '0 0 10px 0', borderBottom: '1px solid #e2e8f0', paddingBottom: '4px', textTransform: 'uppercase' }}>Invoice Information</h4>
                <div style={{ display: 'flex', justifyContent: 'space-between', margin: '4px 0' }}>
                  <span>Invoice ID:</span>
                  <strong>{printedInvoiceData.id}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', margin: '4px 0' }}>
                  <span>Billing Date:</span>
                  <span>{printedInvoiceData.date}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', margin: '4px 0' }}>
                  <span>Payment Date:</span>
                  <span>{printedInvoiceData.paymentDate || new Date().toISOString().split('T')[0]}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', margin: '4px 0' }}>
                  <span>Payment Status:</span>
                  <strong style={{ color: '#15803d' }}>PAID / RECEIVED</strong>
                </div>
              </div>

              <div style={{ marginBottom: '20px', fontSize: '13px' }}>
                <h4 style={{ margin: '0 0 10px 0', borderBottom: '1px solid #e2e8f0', paddingBottom: '4px', textTransform: 'uppercase' }}>Patient Information</h4>
                <div style={{ display: 'flex', justifyContent: 'space-between', margin: '4px 0' }}>
                  <span>Patient ID:</span>
                  <span>{printedInvoiceData.patientId}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', margin: '4px 0' }}>
                  <span>Patient Name:</span>
                  <strong>{printedInvoiceData.patientName}</strong>
                </div>
              </div>

              <div style={{ marginBottom: '24px', fontSize: '13px' }}>
                <h4 style={{ margin: '0 0 10px 0', borderBottom: '1px solid #e2e8f0', paddingBottom: '4px', textTransform: 'uppercase' }}>Billing Breakdown</h4>
                <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '8px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #1e293b' }}>
                      <th style={{ textAlign: 'left', padding: '6px 0' }}>Description</th>
                      <th style={{ textAlign: 'right', padding: '6px 0' }}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={{ padding: '10px 0' }}>{printedInvoiceData.type}</td>
                      <td style={{ textAlign: 'right', padding: '10px 0', fontWeight: 'bold' }}>{printedInvoiceData.amount}</td>
                    </tr>
                    <tr style={{ borderTop: '2px solid #1e293b', fontWeight: 'bold' }}>
                      <td style={{ padding: '10px 0', fontSize: '15px' }}>AMOUNT PAID:</td>
                      <td style={{ textAlign: 'right', padding: '10px 0', fontSize: '15px', color: '#15803d' }}>{printedInvoiceData.amount}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div style={{ fontSize: '12px', borderTop: '1px solid #cbd5e1', paddingTop: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', margin: '2px 0' }}>
                  <span>Method of Payment:</span>
                  <strong>{printedInvoiceData.paymentMethod}</strong>
                </div>
                {printedInvoiceData.paymentRemarks && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', margin: '2px 0' }}>
                    <span>Remarks:</span>
                    <span>{printedInvoiceData.paymentRemarks}</span>
                  </div>
                )}
              </div>

              <div style={{ marginTop: '32px', textAlign: 'center', fontSize: '11px', color: '#64748b', borderTop: '1px dashed #cbd5e1', paddingTop: '16px' }}>
                <p style={{ margin: '0 0 4px 0' }}>Thank you for your payment.</p>
                <p style={{ margin: 0 }}>This is a computer generated official billing receipt.</p>
              </div>
            </div>
            <div className="cc-modal-footer no-print">
              <button type="button" className="cc-btn-secondary" onClick={() => setPrintedInvoiceData(null)}>Close</button>
              <button 
                type="button" 
                className="cc-btn-primary" 
                onClick={() => {
                  window.print();
                }}
              >
                Print Receipt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
