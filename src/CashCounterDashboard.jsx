import React, { useState, useEffect } from 'react';
import './CashCounterDashboard.css';

export default function CashCounterDashboard({ onLogout, embedMode = false, adminMode = false, loggedInStaff }) {
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

  // Inpatient (IPD) Admissions & Lab Records for Final Settlement
  const [admissions, setAdmissions] = useState(() => {
    return JSON.parse(localStorage.getItem('dhms_admissions') || '[]');
  });

  const [labRequests, setLabRequests] = useState(() => {
    return JSON.parse(localStorage.getItem('dhms_lab_requests') || '[]');
  });

  const [selectedAdmForSettlement, setSelectedAdmForSettlement] = useState(null);
  const [settlementPaymentMethod, setSettlementPaymentMethod] = useState('Physical Cash Payment');
  const [settlementRemarks, setSettlementRemarks] = useState('');
  const [printedDischargeClearance, setPrintedDischargeClearance] = useState(null);

  // Filter & Search States
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 4;
  const [unpaidCurrentPage, setUnpaidCurrentPage] = useState(1);
  const unpaidItemsPerPage = 4;

  // Payment Collection Modal State
  const [paymentModalData, setPaymentModalData] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('Physical Cash Payment');
  const [paymentRemarks, setPaymentRemarks] = useState('');
  const [printedInvoiceData, setPrintedInvoiceData] = useState(null);

  // Edit Receipt Tab States
  const [selectedReceiptForEdit, setSelectedReceiptForEdit] = useState(null);
  const [editHospitalName, setEditHospitalName] = useState('DHMS CENTRAL CLINICAL CENTER');
  const [editHospitalAddress, setEditHospitalAddress] = useState('100 Hospital Road, Medical City');
  const [editHospitalContact, setEditHospitalContact] = useState('Phone: +1 (555) 019-2000 | Email: billing@dhms.org');
  const [editRefId, setEditRefId] = useState('');
  const [editBillingDate, setEditBillingDate] = useState('');
  const [editPaymentDate, setEditPaymentDate] = useState('');
  const [editPatientId, setEditPatientId] = useState('');
  const [editPatientName, setEditPatientName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editAmount, setEditAmount] = useState('');
  const [editPaymentMethod, setEditPaymentMethod] = useState('Physical Cash Payment');
  const [editPaymentRemarks, setEditPaymentRemarks] = useState('');

  const loadInvoiceForEdit = (inv) => {
    setSelectedReceiptForEdit(inv);
    setEditHospitalName(inv.hospitalName || 'DHMS CENTRAL CLINICAL CENTER');
    setEditHospitalAddress(inv.hospitalAddress || '100 Hospital Road, Medical City');
    setEditHospitalContact(inv.hospitalContact || 'Phone: +1 (555) 019-2000 | Email: billing@dhms.org');
    setEditRefId(inv.id || '');
    setEditBillingDate(inv.date || '');
    setEditPaymentDate(inv.paymentDate || new Date().toISOString().split('T')[0]);
    setEditPatientId(inv.patientId || '');
    setEditPatientName(inv.patientName || '');
    setEditDescription(inv.type || '');
    setEditAmount(inv.amount ? String(inv.amount).replace(/[^0-9.]/g, '') : '');
    setEditPaymentMethod(inv.paymentMethod || 'Physical Cash Payment');
    setEditPaymentRemarks(inv.paymentRemarks || '');
    setActiveTab('receipts');
  };

  useEffect(() => {
    const paidList = billingList.filter(b => b.status === 'Paid');
    if (!selectedReceiptForEdit && paidList.length > 0) {
      loadInvoiceForEdit(paidList[0]);
    }
  }, [billingList]);

  const handleSaveInvoiceEdits = (e) => {
    if (e) e.preventDefault();
    const currentBilling = JSON.parse(localStorage.getItem('dhms_billing') || '[]');
    const targetId = selectedReceiptForEdit ? selectedReceiptForEdit.id : editRefId;
    const formattedAmount = editAmount.startsWith('₹') ? editAmount : `₹${parseFloat(editAmount || 0).toFixed(2)}`;
    
    const updatedBilling = currentBilling.map(inv => {
      if (inv.id === targetId || inv.id === editRefId) {
        return {
          ...inv,
          id: editRefId,
          date: editBillingDate,
          paymentDate: editPaymentDate,
          patientId: editPatientId,
          patientName: editPatientName,
          type: editDescription,
          amount: formattedAmount,
          paymentMethod: editPaymentMethod,
          paymentRemarks: editPaymentRemarks,
          hospitalName: editHospitalName,
          hospitalAddress: editHospitalAddress,
          hospitalContact: editHospitalContact
        };
      }
      return inv;
    });
    localStorage.setItem('dhms_billing', JSON.stringify(updatedBilling));
    setBillingList(updatedBilling);
    
    // Also trigger update to billing central list
    if (window.dispatchEvent) {
      window.dispatchEvent(new Event('storage'));
    }

    const updatedObj = {
      id: editRefId,
      date: editBillingDate,
      paymentDate: editPaymentDate,
      patientId: editPatientId,
      patientName: editPatientName,
      type: editDescription,
      amount: formattedAmount,
      paymentMethod: editPaymentMethod,
      paymentRemarks: editPaymentRemarks,
      hospitalName: editHospitalName,
      hospitalAddress: editHospitalAddress,
      hospitalContact: editHospitalContact,
      status: 'Paid'
    };

    setSelectedReceiptForEdit(updatedObj);
    alert("Receipt details updated and saved successfully!");
  };

  const handlePrintFromEditor = () => {
    const formattedAmount = editAmount.startsWith('₹') ? editAmount : `₹${parseFloat(editAmount || 0).toFixed(2)}`;
    setPrintedInvoiceData({
      id: editRefId,
      date: editBillingDate,
      paymentDate: editPaymentDate,
      patientId: editPatientId,
      patientName: editPatientName,
      type: editDescription,
      amount: formattedAmount,
      paymentMethod: editPaymentMethod,
      paymentRemarks: editPaymentRemarks,
      hospitalName: editHospitalName,
      hospitalAddress: editHospitalAddress,
      hospitalContact: editHospitalContact,
      status: 'Paid'
    });
  };

  // Attendance Tracker States
  const [attendanceRecords, setAttendanceRecords] = useState(() => {
    return JSON.parse(localStorage.getItem('dhms_master_attendance') || '[]');
  });
  
  const [cashierAttendanceForm, setCashierAttendanceForm] = useState({
    staffId: loggedInStaff?.id || 'CSH-201',
    staffName: loggedInStaff?.name || 'Clara Oswald',
    role: loggedInStaff?.role || 'Senior Billing Specialist',
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
      setAdmissions(JSON.parse(localStorage.getItem('dhms_admissions') || '[]'));
      setLabRequests(JSON.parse(localStorage.getItem('dhms_lab_requests') || '[]'));
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
    
    if (paymentMethod === 'Insurance / TPA Claim') {
      const policies = JSON.parse(localStorage.getItem('dhms_insurance_policies') || '[]');
      const patientPolicy = policies.find(p => p.patientId === paymentModalData.patientId && p.status === 'Active');
      
      if (!patientPolicy) {
        alert(`No active insurance policy found for Patient ${paymentModalData.patientName} (${paymentModalData.patientId})! Please register their policy first.`);
        return;
      }
      
      const cleanVal = (val) => parseFloat((val || '').replace(/[^0-9.]/g, '').trim()) || 0;
      const totalAmount = cleanVal(paymentModalData.amount);
      const coPayPercent = patientPolicy.coPay || 0;
      const coPayAmount = totalAmount * (coPayPercent / 100);
      const claimedAmount = totalAmount - coPayAmount;
      
      const newClaim = {
        id: `CLM-${Math.floor(1000 + Math.random() * 9000)}`,
        patientId: paymentModalData.patientId,
        patientName: paymentModalData.patientName,
        invoiceId: paymentModalData.id,
        provider: patientPolicy.provider,
        policyNo: patientPolicy.policyNo,
        amount: paymentModalData.amount,
        coPayAmount: `₹${coPayAmount.toFixed(2)}`,
        claimedAmount: `₹${claimedAmount.toFixed(2)}`,
        diagnosis: paymentRemarks || `Billing Charge for ${paymentModalData.type}`,
        date: new Date().toISOString().split('T')[0],
        status: 'Pending',
        remarks: 'Claim submitted from cash counter. Pending agent review.'
      };
      
      // Save claim
      const claims = JSON.parse(localStorage.getItem('dhms_insurance_claims') || '[]');
      localStorage.setItem('dhms_insurance_claims', JSON.stringify([newClaim, ...claims]));
      
      // Update invoice status to 'Claim Submitted'
      const finalClaimInvoice = {
        ...paymentModalData,
        status: 'Claim Submitted',
        paymentMethod: 'Insurance / TPA Claim',
        paymentRemarks: paymentRemarks || `Submitted to ${patientPolicy.provider}`,
        paymentDate: new Date().toISOString().split('T')[0]
      };
      
      const updatedBilling = allBilling.map(inv => {
        if (inv.id === paymentModalData.id) {
          return finalClaimInvoice;
        }
        return inv;
      });
      
      localStorage.setItem('dhms_billing', JSON.stringify(updatedBilling));
      setBillingList(updatedBilling);
      
      alert(`Claim successfully generated & submitted to ${patientPolicy.provider}. Audit ID: ${newClaim.id}`);
      
      setPaymentModalData(null);
      setPaymentMethod('Physical Cash Payment');
      setPaymentRemarks('');
      return;
    }

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
    const cleanVal = (val) => parseFloat((val || '').replace(/[^0-9.]/g, '').replace(/[^0-9.]/g, '').trim()) || 0;
    
    const totalCount = billingList.length;
    const unpaidList = billingList.filter(b => b.status === 'Unpaid');
    const paidList = billingList.filter(b => b.status === 'Paid');

    const totalUnpaidAmount = unpaidList.reduce((sum, b) => sum + cleanVal(b.amount), 0);
    const totalPaidAmount = paidList.reduce((sum, b) => sum + cleanVal(b.amount), 0);

    return {
      totalCount,
      unpaidCount: unpaidList.length,
      paidCount: paidList.length,
      totalUnpaidAmount: `₹${totalUnpaidAmount.toFixed(2)}`,
      totalPaidAmount: `₹${totalPaidAmount.toFixed(2)}`
    };
  };

  const stats = getFinancialStats();

  // Filter and Search logic
  const filteredBilling = billingList.filter(inv => {
    const query = searchQuery.toLowerCase();
    const matchesSearch = inv.id.toLowerCase().includes(query) ||
                          (!adminMode && inv.patientId.toLowerCase().includes(query)) ||
                          (!adminMode && inv.patientName.toLowerCase().includes(query)) ||
                          inv.type.toLowerCase().includes(query);
                          
    const matchesStatus = adminMode ? inv.status === 'Paid' : (statusFilter === 'All' || inv.status === statusFilter);
    const matchesType = typeFilter === 'All' || inv.type === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  const totalPages = Math.ceil(filteredBilling.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedBilling = filteredBilling.slice(startIndex, startIndex + itemsPerPage);

  const renderOverview = () => {
    const paidList = billingList.filter(b => b.status === 'Paid');
    const cleanVal = (val) => parseFloat((val || '').replace(/[^0-9.]/g, '').replace(/[^0-9.]/g, '').trim()) || 0;
    const cashPaid = paidList.filter(b => b.paymentMethod === 'Physical Cash Payment').reduce((sum, b) => sum + cleanVal(b.amount), 0);
    const cardUpiPaid = paidList.filter(b => b.paymentMethod !== 'Physical Cash Payment').reduce((sum, b) => sum + cleanVal(b.amount), 0);

    return (
      <div className="cc-view-container">
        <div className="cc-header-banner">
          <div>
            <h2>Billing Overview</h2>
            <p>{adminMode ? 'Hospital financial performance, cashier logs and collection breakdown.' : 'Real-time cash flow, pending patient collections, and payment history.'}</p>
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
          {adminMode ? (
            <div className="cc-card">
              <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', color: '#1e293b' }}>Payment Channels Distribution</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '10px 0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid #f1f5f9' }}>
                  <span style={{ color: '#64748b', fontWeight: '500' }}>Physical Cash Collections</span>
                  <strong style={{ color: '#1e293b', fontSize: '16px' }}>₹{cashPaid.toFixed(2)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid #f1f5f9' }}>
                  <span style={{ color: '#64748b', fontWeight: '500' }}>Digital Payments (Card/UPI)</span>
                  <strong style={{ color: '#1e293b', fontSize: '16px' }}>₹{cardUpiPaid.toFixed(2)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', paddingTop: '4px' }}>
                  <span style={{ color: '#1e293b' }}>Total Collected Revenue</span>
                  <strong style={{ color: '#10b981', fontSize: '18px' }}>₹{(cashPaid + cardUpiPaid).toFixed(2)}</strong>
                </div>
              </div>
            </div>
          ) : (
            /* Quick Pending Payments list */
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
          )}

          {/* Recent Transactions List */}
          <div className="cc-card">
            <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', color: '#1e293b' }}>{adminMode ? 'Recent Finalized Transactions' : 'Recent Cash Desk Activities'}</h3>
            <div className="cc-table-wrapper" style={{ maxHeight: '280px', overflowY: 'auto' }}>
              <table className="cc-table">
                <thead>
                  {adminMode ? (
                    <tr>
                      <th>Invoice ID</th>
                      <th>Date</th>
                      <th>Amount</th>
                      <th>Payment Mode</th>
                    </tr>
                  ) : (
                    <tr>
                      <th>Date</th>
                      <th>Patient</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th>Payment Mode</th>
                    </tr>
                  )}
                </thead>
                <tbody>
                  {billingList.slice(0, 15).length === 0 ? (
                    <tr><td colSpan={adminMode ? "4" : "5"} style={{ textAlign: 'center', padding: '24px', color: '#64748b' }}>No invoices logged in the system yet.</td></tr>
                  ) : (
                    billingList.slice(0, 15).map(inv => (
                      <tr key={inv.id}>
                        {adminMode ? (
                          <>
                            <td><strong>{inv.id}</strong></td>
                            <td>{inv.date}</td>
                            <td style={{ fontWeight: '600' }}>{inv.amount}</td>
                            <td>
                              <span style={{ fontSize: '11px', fontWeight: '600', color: '#475569', background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>
                                {inv.paymentMethod || 'Online'}
                              </span>
                            </td>
                          </>
                        ) : (
                          <>
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
                          </>
                        )}
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
  };

  const renderUnpaidInvoices = () => {
    const unpaidList = billingList.filter(b => b.status === 'Unpaid');
    const unpaidTotalPages = Math.ceil(unpaidList.length / unpaidItemsPerPage) || 1;
    const unpaidStartIndex = (unpaidCurrentPage - 1) * unpaidItemsPerPage;
    const paginatedUnpaid = unpaidList.slice(unpaidStartIndex, unpaidStartIndex + unpaidItemsPerPage);

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
              {paginatedUnpaid.length === 0 ? (
                <tr><td colSpan="7" style={{ textAlign: 'center', padding: '48px', color: '#64748b' }}>No outstanding patient bills found!</td></tr>
              ) : (
                paginatedUnpaid.map(inv => (
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

          {unpaidList.length > 0 && (
            <div className="cc-pagination">
              <span className="cc-page-info">
                Showing {unpaidStartIndex + 1} to {Math.min(unpaidStartIndex + unpaidItemsPerPage, unpaidList.length)} of {unpaidList.length} invoices
              </span>
              {unpaidTotalPages > 1 && (
                <div className="cc-pagination-buttons">
                  <button 
                    disabled={unpaidCurrentPage === 1} 
                    onClick={() => setUnpaidCurrentPage(prev => Math.max(prev - 1, 1))}
                    className="cc-page-btn"
                  >
                    Prev
                  </button>
                  {Array.from({ length: unpaidTotalPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => setUnpaidCurrentPage(page)}
                      className={`cc-page-btn ${unpaidCurrentPage === page ? 'active' : ''}`}
                    >
                      {page}
                    </button>
                  ))}
                  <button 
                    disabled={unpaidCurrentPage === unpaidTotalPages} 
                    onClick={() => setUnpaidCurrentPage(prev => Math.min(prev + 1, unpaidTotalPages))}
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

  const renderTransactions = () => {
    return (
      <div className="cc-view-container">
        <div className="cc-header-banner">
          <div>
            <h2>{adminMode ? 'Completed Transactions Ledger' : 'All Billing Transactions'}</h2>
            <p>{adminMode ? 'Audit trail of all finalized payments collected by the cashier.' : 'Search, filter, and audit all invoice lists generated across the hospital.'}</p>
          </div>
        </div>

        <div className="cc-card">
          <div className="cc-filters-row">
            <input 
              type="text" 
              placeholder={adminMode ? 'Search by Invoice ID or type...' : 'Search by ID, name or type...'} 
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              className="cc-filter-input"
            />
            
            <div style={{ display: 'flex', gap: '12px' }}>
              {!adminMode && (
                <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }} className="cc-filter-select">
                  <option value="All">All Statuses</option>
                  <option value="Paid">Paid</option>
                  <option value="Unpaid">Unpaid</option>
                </select>
              )}

              <select value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setCurrentPage(1); }} className="cc-filter-select">
                <option value="All">All Types</option>
                <option value="Consultation Fee">Consultation Fee</option>
                <option value="Diagnostic Lab Report">Diagnostic Lab Report</option>
                <option value="Pharmacy Medicines Dispensed">Pharmacy Medicines Dispensed</option>
              </select>
            </div>
          </div>

          <div className="cc-table-wrapper">
            <table className="cc-table">
              <thead>
                {adminMode ? (
                  <tr>
                    <th>Invoice ID</th>
                    <th>Billing Date</th>
                    <th>Charge Type</th>
                    <th>Total Amount</th>
                    <th>Payment Method</th>
                    <th>Transaction Notes</th>
                  </tr>
                ) : (
                  <tr>
                    <th>Invoice ID</th>
                    <th>Billing Date</th>
                    <th>Patient Details</th>
                    <th>Charge Type</th>
                    <th>Total Amount</th>
                    <th>Status</th>
                    <th>Payment details</th>
                  </tr>
                )}
              </thead>
              <tbody>
                {paginatedBilling.length === 0 ? (
                  <tr><td colSpan={adminMode ? "6" : "7"} style={{ textAlign: 'center', padding: '48px', color: '#64748b' }}>No matching invoices found.</td></tr>
                ) : (
                  paginatedBilling.map(inv => (
                    <tr key={inv.id}>
                      <td><strong>{inv.id}</strong></td>
                      <td>{inv.date}</td>
                      {!adminMode && (
                        <td>
                          <strong>{inv.patientName}</strong>
                          <div style={{ fontSize: '11px', color: '#64748b' }}>ID: {inv.patientId}</div>
                        </td>
                      )}
                      <td><span style={{ fontSize: '11.5px', background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>{inv.type}</span></td>
                      <td style={{ fontWeight: '700' }}>{inv.amount}</td>
                      {adminMode ? (
                        <>
                          <td>
                            <span style={{ fontSize: '11px', fontWeight: '600', color: '#475569', background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>
                              {inv.paymentMethod}
                            </span>
                          </td>
                          <td style={{ fontSize: '12px', color: '#64748b' }}>{inv.paymentRemarks || '-'}</td>
                        </>
                      ) : (
                        <>
                          <td>
                            <span className={`cc-status-badge ${inv.status.toLowerCase()}`}>{inv.status}</span>
                          </td>
                          <td>
                            {inv.status === 'Paid' ? (
                              <div style={{ fontSize: '11px', color: '#475569', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <div>Mode: <strong>{inv.paymentMethod}</strong></div>
                                <div style={{ color: '#64748b', fontSize: '10px' }}>Ref: {inv.paymentRemarks || 'None'}</div>
                                <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
                                  <button 
                                    className="cc-btn-small" 
                                    style={{ padding: '4px 8px', fontSize: '11px' }}
                                    onClick={() => setPrintedInvoiceData(inv)}
                                  >
                                    Print Receipt
                                  </button>
                                  <button 
                                    className="cc-btn-small outline" 
                                    style={{ padding: '4px 8px', fontSize: '11px' }}
                                    onClick={() => loadInvoiceForEdit(inv)}
                                  >
                                    Edit Details
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <button className="cc-btn-small outline" onClick={() => setPaymentModalData(inv)}>Collect Now</button>
                            )}
                          </td>
                        </>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

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
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`cc-page-btn ${currentPage === page ? 'active' : ''}`}
                    >
                      {page}
                    </button>
                  ))}
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
    const todayStr = new Date().toISOString().split('T')[0];
    const loggedToday = attendanceRecords.some(a => a.date === todayStr && a.module === 'Cashier');
    const cashierAttRecords = attendanceRecords.filter(att => att.module === 'Cashier');

    return (
      <div className="cc-view-container">
        <div className="cc-header-banner">
          <div>
            <h2>{adminMode ? 'Cashier Duty Logs' : 'Cashier Shift Attendance Logging'}</h2>
            <p>{adminMode ? 'Audit and track shift attendance logs of cash desk specialists.' : 'Log shift check-ins and check-outs for duty verification.'}</p>
          </div>
        </div>

        <div className="cc-grid-layout" style={adminMode ? { display: 'block', width: '100%' } : {}}>
          {!adminMode && (
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
                    placeholder="e.g. Cash drawer seeded with ₹200.00" 
                    value={cashierAttendanceForm.remarks} 
                    onChange={e => setCashierAttendanceForm({...cashierAttendanceForm, remarks: e.target.value})} 
                  />
                </div>

                <button type="submit" className="cc-btn-primary mt-4">Log Counter Shift</button>
              </form>
            </div>
          )}

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

  const getWardRate = (wardName = '') => {
    if (wardName.includes('ICU')) return 3500;
    if (wardName.includes('Suite')) return 3000;
    if (wardName.includes('Semi-Private')) return 1800;
    if (wardName.includes('Pediatrics')) return 1200;
    return 800;
  };

  const calculateAdmissionFinances = (adm) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const admissionDate = adm.admissionDate || todayStr;
    const dischargeDate = adm.dischargeDate || todayStr;
    const daysStayed = Math.max(1, Math.ceil((new Date(dischargeDate) - new Date(admissionDate)) / (1000 * 60 * 60 * 24)));
    const wardRate = getWardRate(adm.ward || '');
    const roomCharges = daysStayed * wardRate;
    
    const pharmacyTotal = (adm.medications || [])
      .filter(m => m.status === 'Dispensed' || m.status === 'Delivered')
      .reduce((sum, m) => sum + (parseFloat(m.cost) || 0), 0);

    const patientLabs = (labRequests || []).filter(l => l.patientId === adm.patientId && (l.status === 'Completed & Billed' || l.status === 'Completed'));
    const labTotal = patientLabs.reduce((sum, l) => sum + (parseFloat(l.cost) || 0), 0);

    const grossTotal = roomCharges + pharmacyTotal + labTotal;
    const advancePaid = parseFloat(adm.advanceDeposit) || 0;
    const netDue = Math.max(0, grossTotal - advancePaid);
    const refund = grossTotal < advancePaid ? (advancePaid - grossTotal) : 0;

    return {
      daysStayed,
      wardRate,
      roomCharges,
      pharmacyTotal,
      labTotal,
      patientLabs,
      grossTotal,
      advancePaid,
      netDue,
      refund
    };
  };

  const handleFinalizeDischargeSettlementSubmit = (e) => {
    e.preventDefault();
    if (!selectedAdmForSettlement) return;

    const fin = calculateAdmissionFinances(selectedAdmForSettlement);
    const todayStr = new Date().toISOString().split('T')[0];
    const finalInvoiceId = `INV-IPD-${Math.floor(1000 + Math.random() * 9000)}`;

    const finalSettlementData = {
      roomCharges: fin.roomCharges,
      daysStayed: fin.daysStayed,
      wardRate: fin.wardRate,
      pharmacyTotal: fin.pharmacyTotal,
      labTotal: fin.labTotal,
      grossTotal: fin.grossTotal,
      advanceDeducted: fin.advancePaid,
      netAmountPaid: fin.netDue,
      refundAmount: fin.refund,
      invoiceId: finalInvoiceId,
      settledAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      settledDate: todayStr,
      paymentMethod: settlementPaymentMethod,
      cashierName: loggedInStaff?.name || 'Cash Desk Specialist'
    };

    // Update dhms_admissions
    const allAdms = JSON.parse(localStorage.getItem('dhms_admissions') || '[]');
    const updatedAdms = allAdms.map(a => {
      if (a.id === selectedAdmForSettlement.id) {
        return {
          ...a,
          status: 'Discharged',
          dischargeDate: todayStr,
          pharmacyBillPaid: true,
          finalSettlement: finalSettlementData
        };
      }
      return a;
    });
    localStorage.setItem('dhms_admissions', JSON.stringify(updatedAdms));
    setAdmissions(updatedAdms);

    // Create Paid Invoice in dhms_billing
    const currentBilling = JSON.parse(localStorage.getItem('dhms_billing') || '[]');
    const finalInvoice = {
      id: finalInvoiceId,
      patientId: selectedAdmForSettlement.patientId,
      patientName: selectedAdmForSettlement.patientName,
      date: todayStr,
      paymentDate: todayStr,
      amount: `₹${fin.netDue.toFixed(2)}`,
      status: 'Paid',
      type: `IPD Final Discharge Bill & Clearance (${selectedAdmForSettlement.ward || 'Ward'})`,
      paymentMethod: settlementPaymentMethod,
      paymentRemarks: `Final settlement after ₹${fin.advancePaid.toFixed(2)} advance adjustment. ${settlementRemarks || ''}`
    };
    const updatedBilling = [finalInvoice, ...currentBilling];
    localStorage.setItem('dhms_billing', JSON.stringify(updatedBilling));
    setBillingList(updatedBilling);

    if (window.dispatchEvent) {
      window.dispatchEvent(new Event('storage'));
    }

    // Set printable discharge clearance certificate
    setPrintedDischargeClearance({
      ...selectedAdmForSettlement,
      ...finalSettlementData,
      patientLabs: fin.patientLabs
    });

    setSelectedAdmForSettlement(null);
  };

  const renderIpdSettlement = () => {
    const readyForDischarge = admissions.filter(a => a.status === 'Fit for Discharge / Settle Billing');
    const activeAdmitted = admissions.filter(a => a.status === 'Admitted');
    const dischargedHistory = admissions.filter(a => a.status === 'Discharged');

    return (
      <div className="cc-view-container">
        <div className="cc-header-banner">
          <div>
            <h2>Inpatient (IPD) Final Billing & Discharge Clearance</h2>
            <p>Generate consolidated itemized inpatient bills, reconcile advance deposits with room & pharmacy costs, and issue official release clearance.</p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <span style={{ background: '#eff6ff', color: '#1e40af', padding: '6px 14px', borderRadius: '8px', fontSize: '13px', fontWeight: '700' }}>
              Fit for Discharge: {readyForDischarge.length}
            </span>
            <span style={{ background: '#dcfce7', color: '#15803d', padding: '6px 14px', borderRadius: '8px', fontSize: '13px', fontWeight: '700' }}>
              Active Inpatients: {activeAdmitted.length}
            </span>
          </div>
        </div>

        {readyForDischarge.length > 0 && (
          <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '12px', padding: '18px 20px', marginBottom: '24px' }}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '16px', color: '#1e3a8a', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>🔔</span> Clinical Discharge Clearance Queue (Doctor Signed Off)
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
              {readyForDischarge.map(adm => {
                const fin = calculateAdmissionFinances(adm);
                return (
                  <div key={adm.id} style={{ background: 'white', border: '1px solid #93c5fd', borderRadius: '10px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.04)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong style={{ fontSize: '15px', color: '#1e293b' }}>{adm.patientName}</strong>
                      <span style={{ fontSize: '11px', background: '#dbeafe', color: '#1e40af', padding: '2px 8px', borderRadius: '4px', fontWeight: 'bold' }}>{adm.id}</span>
                    </div>
                    <div style={{ fontSize: '12.5px', color: '#475569' }}>
                      Ward: <strong>{adm.ward}</strong> • Bed: <strong>{adm.bedNo || 'N/A'}</strong>
                    </div>
                    <div style={{ fontSize: '12.5px', color: '#475569' }}>
                      Admitted: <strong>{adm.admissionDate}</strong> ({fin.daysStayed} Days)
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #f1f5f9', paddingTop: '8px', marginTop: '4px' }}>
                      <span style={{ fontSize: '12px', color: '#64748b' }}>Advance Paid: ₹{fin.advancePaid.toFixed(2)}</span>
                      <strong style={{ fontSize: '14px', color: '#b91c1c' }}>Net Due: ₹{fin.netDue.toFixed(2)}</strong>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedAdmForSettlement(adm);
                        setSettlementPaymentMethod('Physical Cash Payment');
                        setSettlementRemarks('');
                      }}
                      style={{
                        marginTop: '8px',
                        padding: '8px 16px',
                        background: '#3b82f6',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        fontWeight: '700',
                        fontSize: '13px',
                        cursor: 'pointer'
                      }}
                    >
                      💳 Settle Bill & Issue Clearance
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="cc-card">
          <h3 style={{ margin: '0 0 16px 0', fontSize: '17px', color: '#1e293b' }}>All Hospital Inpatient Admissions & Settlement Registry</h3>
          <table className="cc-table">
            <thead>
              <tr>
                <th>Admission ID</th>
                <th>Patient Details</th>
                <th>Ward & Bed</th>
                <th>Stay Duration</th>
                <th>Gross Charges</th>
                <th>Advance Paid</th>
                <th>Net Balance</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {admissions.length === 0 ? (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', padding: '32px', color: '#64748b', fontStyle: 'italic' }}>
                    No inpatient admission records found in the system.
                  </td>
                </tr>
              ) : (
                admissions.map(adm => {
                  const fin = calculateAdmissionFinances(adm);
                  return (
                    <tr key={adm.id}>
                      <td><strong style={{ color: '#4338ca' }}>{adm.id}</strong></td>
                      <td>
                        <strong>{adm.patientName}</strong>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>{adm.patientId}</div>
                      </td>
                      <td>
                        <span style={{ background: '#f1f5f9', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: '600' }}>
                          {adm.ward || 'General Ward A'}
                        </span>
                        {adm.bedNo && <div style={{ fontSize: '11px', color: '#15803d', fontWeight: 'bold', marginTop: '2px' }}>✓ {adm.bedNo}</div>}
                      </td>
                      <td>
                        <div>{fin.daysStayed} Day(s)</div>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>{adm.admissionDate}</div>
                      </td>
                      <td><strong>₹{fin.grossTotal.toFixed(2)}</strong></td>
                      <td><span style={{ color: '#166534', fontWeight: '600' }}>₹{fin.advancePaid.toFixed(2)}</span></td>
                      <td>
                        <strong style={{ color: fin.netDue > 0 ? '#b91c1c' : '#15803d' }}>
                          ₹{fin.netDue.toFixed(2)}
                        </strong>
                      </td>
                      <td>
                        <span className="cc-status-badge" style={{
                          backgroundColor: adm.status === 'Discharged' ? '#dcfce7' : adm.status?.includes('Discharge') ? '#e0e7ff' : '#fef3c7',
                          color: adm.status === 'Discharged' ? '#15803d' : adm.status?.includes('Discharge') ? '#4338ca' : '#b45309'
                        }}>
                          {adm.status}
                        </span>
                      </td>
                      <td>
                        {adm.status !== 'Discharged' ? (
                          <button
                            onClick={() => {
                              setSelectedAdmForSettlement(adm);
                              setSettlementPaymentMethod('Physical Cash Payment');
                              setSettlementRemarks('');
                            }}
                            style={{
                              padding: '6px 12px',
                              background: adm.status?.includes('Discharge') ? '#3b82f6' : '#f1f5f9',
                              color: adm.status?.includes('Discharge') ? 'white' : '#334155',
                              border: adm.status?.includes('Discharge') ? 'none' : '1px solid #cbd5e1',
                              borderRadius: '6px',
                              fontSize: '12px',
                              fontWeight: '700',
                              cursor: 'pointer'
                            }}
                          >
                            💳 Settle Bill
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              setPrintedDischargeClearance({
                                ...adm,
                                ...(adm.finalSettlement || {}),
                                patientLabs: fin.patientLabs
                              });
                            }}
                            style={{
                              padding: '6px 12px',
                              background: '#f8fafc',
                              border: '1px solid #cbd5e1',
                              color: '#334155',
                              borderRadius: '6px',
                              fontSize: '12px',
                              fontWeight: '600',
                              cursor: 'pointer'
                            }}
                          >
                            📄 Release Cert
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderReceiptEditor = () => {
    const paidInvoices = billingList.filter(b => b.status === 'Paid');

    return (
      <div className="cc-view-container">
        <div className="cc-header-banner">
          <div>
            <h2>Receipt & Invoice Customizer</h2>
            <p>Customize hospital letterhead, modify invoice details, and preview or reprint official receipts.</p>
          </div>
        </div>

        <div className="cc-grid-layout" style={{ gridTemplateColumns: '1fr 2fr', gap: '20px', alignItems: 'start' }}>
          {/* Left Column: Select a Receipt */}
          <div className="cc-card">
            <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', color: '#1e293b' }}>Select Paid Receipt</h3>
            <p style={{ color: '#64748b', fontSize: '12.5px', marginBottom: '12px' }}>
              Choose a paid invoice below to customize its receipt details:
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '520px', overflowY: 'auto' }}>
              {paidInvoices.length === 0 ? (
                <div style={{ padding: '16px', textAlign: 'center', color: '#64748b', fontSize: '13px' }}>
                  No paid invoices available to edit.
                </div>
              ) : (
                paidInvoices.map(inv => {
                  const isSelected = selectedReceiptForEdit?.id === inv.id || editRefId === inv.id;
                  return (
                    <div 
                      key={inv.id}
                      onClick={() => loadInvoiceForEdit(inv)}
                      style={{
                        padding: '12px',
                        borderRadius: '8px',
                        border: isSelected ? '2px solid #6366f1' : '1px solid #e2e8f0',
                        background: isSelected ? '#f5f3ff' : 'white',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <strong style={{ fontSize: '13.5px', color: '#1e293b' }}>{inv.id}</strong>
                        <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#166534' }}>{inv.amount}</span>
                      </div>
                      <div style={{ fontSize: '13px', color: '#475569', fontWeight: '500' }}>{inv.patientName}</div>
                      <div style={{ fontSize: '11px', color: '#64748b', display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                        <span>{inv.type}</span>
                        <span>{inv.date}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Column: Edit Receipt Form */}
          <div className="cc-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', color: '#1e293b' }}>
                Editing Receipt: <span style={{ color: '#6366f1' }}>{editRefId || 'New/Custom'}</span>
              </h3>
              <button 
                type="button" 
                className="cc-btn-primary" 
                onClick={handlePrintFromEditor}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px' }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
                Preview & Print Receipt
              </button>
            </div>

            <form className="cc-form" onSubmit={handleSaveInvoiceEdits}>
              <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '8px', marginBottom: '16px', border: '1px solid #e2e8f0' }}>
                <h4 style={{ margin: '0 0 10px 0', fontSize: '13px', fontWeight: 'bold', color: '#475569', textTransform: 'uppercase' }}>Hospital Letterhead Info</h4>
                <div className="cc-form-group" style={{ marginBottom: '10px' }}>
                  <label style={{ fontSize: '12px' }}>Hospital / Clinic Name</label>
                  <input type="text" value={editHospitalName} onChange={e => setEditHospitalName(e.target.value)} required />
                </div>
                <div className="cc-form-row">
                  <div className="cc-form-group">
                    <label style={{ fontSize: '12px' }}>Hospital Address</label>
                    <input type="text" value={editHospitalAddress} onChange={e => setEditHospitalAddress(e.target.value)} required />
                  </div>
                  <div className="cc-form-group">
                    <label style={{ fontSize: '12px' }}>Contact Details & Email</label>
                    <input type="text" value={editHospitalContact} onChange={e => setEditHospitalContact(e.target.value)} required />
                  </div>
                </div>
              </div>

              <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '8px', marginBottom: '16px', border: '1px solid #e2e8f0' }}>
                <h4 style={{ margin: '0 0 10px 0', fontSize: '13px', fontWeight: 'bold', color: '#475569', textTransform: 'uppercase' }}>Invoice & Patient Details</h4>
                <div className="cc-form-row">
                  <div className="cc-form-group">
                    <label style={{ fontSize: '12px' }}>Invoice ID / Reference</label>
                    <input type="text" value={editRefId} onChange={e => setEditRefId(e.target.value)} required />
                  </div>
                  <div className="cc-form-group">
                    <label style={{ fontSize: '12px' }}>Patient ID</label>
                    <input type="text" value={editPatientId} onChange={e => setEditPatientId(e.target.value)} required />
                  </div>
                </div>
                <div className="cc-form-row">
                  <div className="cc-form-group">
                    <label style={{ fontSize: '12px' }}>Patient Full Name</label>
                    <input type="text" value={editPatientName} onChange={e => setEditPatientName(e.target.value)} required />
                  </div>
                  <div className="cc-form-group">
                    <label style={{ fontSize: '12px' }}>Billing Date</label>
                    <input type="date" value={editBillingDate} onChange={e => setEditBillingDate(e.target.value)} required />
                  </div>
                </div>
              </div>

              <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '8px', marginBottom: '16px', border: '1px solid #e2e8f0' }}>
                <h4 style={{ margin: '0 0 10px 0', fontSize: '13px', fontWeight: 'bold', color: '#475569', textTransform: 'uppercase' }}>Billing Breakdown & Payment Mode</h4>
                <div className="cc-form-row">
                  <div className="cc-form-group" style={{ flex: 2 }}>
                    <label style={{ fontSize: '12px' }}>Service / Billing Description</label>
                    <input type="text" value={editDescription} onChange={e => setEditDescription(e.target.value)} required />
                  </div>
                  <div className="cc-form-group" style={{ flex: 1 }}>
                    <label style={{ fontSize: '12px' }}>Total Amount (₹)</label>
                    <input type="number" step="0.01" value={editAmount} onChange={e => setEditAmount(e.target.value)} required />
                  </div>
                </div>
                <div className="cc-form-row">
                  <div className="cc-form-group">
                    <label style={{ fontSize: '12px' }}>Payment Method</label>
                    <select value={editPaymentMethod} onChange={e => setEditPaymentMethod(e.target.value)} style={{ padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', width: '100%', background: 'white' }}>
                      <option value="Physical Cash Payment">Physical Cash Payment</option>
                      <option value="Online Card Payment">Online Card Payment</option>
                      <option value="Insurance Cover / Claim">Insurance Cover / Claim</option>
                      <option value="UPI / QR Code Transfer">UPI / QR Code Transfer</option>
                    </select>
                  </div>
                  <div className="cc-form-group">
                    <label style={{ fontSize: '12px' }}>Payment Date</label>
                    <input type="date" value={editPaymentDate} onChange={e => setEditPaymentDate(e.target.value)} required />
                  </div>
                </div>
                <div className="cc-form-group" style={{ marginTop: '8px' }}>
                  <label style={{ fontSize: '12px' }}>Reference Remarks</label>
                  <input type="text" value={editPaymentRemarks} onChange={e => setEditPaymentRemarks(e.target.value)} placeholder="e.g. Transaction ID, Cash Desk Note" />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
                <button type="submit" className="cc-btn-primary" style={{ backgroundColor: '#10b981', padding: '10px 24px', fontSize: '14px' }}>
                  💾 Save Receipt Updates
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`cc-container ${embedMode ? 'embedded' : ''}`}>
      {/* Topbar */}
      {!embedMode && (
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
              <div className="cc-avatar">{(loggedInStaff?.name || 'Clara Oswald')[0]}</div>
              <div className="cc-user-details">
                <strong>{loggedInStaff?.name || 'Clara Oswald'}</strong>
                <span>{loggedInStaff?.role || 'Billing Counter'}</span>
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
      )}

      <div className="cc-body">
        {/* Sidebar */}
        <aside className="cc-sidebar no-print">
          <ul className="cc-nav">
            <li className={activeTab === 'overview' ? 'active' : ''} onClick={() => setActiveTab('overview')}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="9"></rect><rect x="14" y="3" width="7" height="5"></rect><rect x="14" y="12" width="7" height="9"></rect><rect x="3" y="16" width="7" height="5"></rect></svg>
              Desk Overview
            </li>
            {!adminMode && (
              <li className={activeTab === 'unpaid' ? 'active' : ''} onClick={() => { setActiveTab('unpaid'); setUnpaidCurrentPage(1); }}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                Collect Payments
              </li>
            )}
            <li className={activeTab === 'ipd_settlement' ? 'active' : ''} onClick={() => setActiveTab('ipd_settlement')}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 4v16"></path><path d="M2 8h18a2 2 0 0 1 2 2v10"></path><path d="M2 17h20"></path><path d="M6 8v9"></path></svg>
              IPD Final Settlement
              {admissions.filter(a => a.status === 'Fit for Discharge / Settle Billing').length > 0 && (
                <span style={{ marginLeft: 'auto', background: '#4338ca', color: 'white', padding: '1px 6px', borderRadius: '10px', fontSize: '11px', fontWeight: '800' }}>
                  {admissions.filter(a => a.status === 'Fit for Discharge / Settle Billing').length}
                </span>
              )}
            </li>
            <li className={activeTab === 'transactions' ? 'active' : ''} onClick={() => { setActiveTab('transactions'); setCurrentPage(1); }}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2" ry="2"></rect><line x1="12" y1="4" x2="12" y2="20"></line><line x1="2" y1="12" x2="22" y2="12"></line></svg>
              {adminMode ? 'Completed Transactions' : 'All Transactions'}
            </li>
            <li className={activeTab === 'receipts' ? 'active' : ''} onClick={() => setActiveTab('receipts')}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
              Receipt Editor
            </li>
            <li className={activeTab === 'attendance' ? 'active' : ''} onClick={() => setActiveTab('attendance')}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
              {adminMode ? 'Cashier Shift Log' : 'Shift Attendance'}
            </li>
          </ul>
        </aside>

        {/* Main Content */}
        <main className="cc-main">
          {activeTab === 'overview' && renderOverview()}
          {activeTab === 'unpaid' && renderUnpaidInvoices()}
          {activeTab === 'ipd_settlement' && renderIpdSettlement()}
          {activeTab === 'transactions' && renderTransactions()}
          {activeTab === 'receipts' && renderReceiptEditor()}
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
                    <option value="Insurance / TPA Claim">Insurance / TPA Claim</option>
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

      {/* Print Receipt Modal overlay - Clean without edit interruptions */}
      {printedInvoiceData && (
        <div className="cc-modal-overlay">
          <div className="cc-modal-content print-modal" style={{ maxWidth: '540px', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
            <div className="cc-modal-header no-print">
              <h3>Invoice Payment Receipt</h3>
              <button className="cc-btn-close" onClick={() => setPrintedInvoiceData(null)}>&times;</button>
            </div>
            <div className="cc-modal-body print-area" id="printable-receipt" style={{ padding: '32px', backgroundColor: 'white', color: '#1e293b', fontFamily: 'Courier New, Courier, monospace', overflowY: 'auto', flex: 1 }}>
              <div style={{ textAlign: 'center', borderBottom: '2px solid #1e293b', paddingBottom: '16px', marginBottom: '20px' }}>
                <h2 style={{ margin: '0 0 4px 0', fontSize: '20px', fontWeight: 'bold' }}>{printedInvoiceData.hospitalName || "DHMS CENTRAL CLINICAL CENTER"}</h2>
                <p style={{ margin: 0, fontSize: '12px' }}>{printedInvoiceData.hospitalAddress || "100 Hospital Road, Medical City"}</p>
                <p style={{ margin: 0, fontSize: '12px' }}>{printedInvoiceData.hospitalContact || "Phone: +1 (555) 019-2000 | Email: billing@dhms.org"}</p>
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
                onClick={() => window.print()}
              >
                Print Receipt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Inpatient (IPD) Final Settlement Modal */}
      {selectedAdmForSettlement && (() => {
        const fin = calculateAdmissionFinances(selectedAdmForSettlement);
        return (
          <div className="cc-modal-overlay no-print" style={{ zIndex: 9999 }}>
            <div className="cc-modal-content" style={{ maxWidth: '640px', width: '92vw', maxHeight: '90vh', overflowY: 'auto' }}>
              <div className="cc-modal-header">
                <div>
                  <h3 style={{ margin: 0, fontSize: '17px', color: '#1e293b' }}>💳 Settle Inpatient Final Bill</h3>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>Patient: <strong>{selectedAdmForSettlement.patientName}</strong> ({selectedAdmForSettlement.patientId}) • {selectedAdmForSettlement.ward}</span>
                </div>
                <button className="cc-btn-close" onClick={() => setSelectedAdmForSettlement(null)}>&times;</button>
              </div>

              <form onSubmit={handleFinalizeDischargeSettlementSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="cc-modal-body" style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {/* Doctor Discharge Note */}
                  {selectedAdmForSettlement.dischargeSummary && (
                    <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '10px 14px', fontSize: '12.5px', color: '#166534' }}>
                      <strong>✓ Doctor Discharge Sign-Off:</strong> {selectedAdmForSettlement.dischargeSummary.condition}
                      <div style={{ marginTop: '2px', color: '#14532d' }}>{selectedAdmForSettlement.dischargeSummary.notes}</div>
                    </div>
                  )}

                  {/* Consolidated Itemized Breakdown */}
                  <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
                    <div style={{ background: '#f8fafc', padding: '10px 14px', borderBottom: '1px solid #e2e8f0', fontWeight: 'bold', fontSize: '13px', color: '#334155' }}>
                      Itemized Expense Breakdown
                    </div>
                    <table style={{ width: '100%', fontSize: '12.5px', borderCollapse: 'collapse' }}>
                      <tbody>
                        <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '8px 14px', color: '#475569' }}>
                            Room & Nursing Stay ({fin.daysStayed} days @ ₹{fin.wardRate}/day)
                          </td>
                          <td style={{ padding: '8px 14px', textAlign: 'right', fontWeight: '600' }}>₹{fin.roomCharges.toFixed(2)}</td>
                        </tr>
                        <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '8px 14px', color: '#475569' }}>
                            Inpatient Pharmacy Medications ({(selectedAdmForSettlement.medications || []).length} items)
                          </td>
                          <td style={{ padding: '8px 14px', textAlign: 'right', fontWeight: '600' }}>₹{fin.pharmacyTotal.toFixed(2)}</td>
                        </tr>
                        <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '8px 14px', color: '#475569' }}>
                            Inpatient Diagnostic Labs ({fin.patientLabs.length} tests)
                          </td>
                          <td style={{ padding: '8px 14px', textAlign: 'right', fontWeight: '600' }}>₹{fin.labTotal.toFixed(2)}</td>
                        </tr>
                        <tr style={{ borderBottom: '2px solid #cbd5e1', background: '#f8fafc', fontWeight: 'bold' }}>
                          <td style={{ padding: '8px 14px' }}>Gross Inpatient Charges:</td>
                          <td style={{ padding: '8px 14px', textAlign: 'right' }}>₹{fin.grossTotal.toFixed(2)}</td>
                        </tr>
                        <tr style={{ borderBottom: '1px solid #f1f5f9', color: '#166534' }}>
                          <td style={{ padding: '8px 14px' }}>Less: Advance Deposit Paid at Admission (-)</td>
                          <td style={{ padding: '8px 14px', textAlign: 'right', fontWeight: '700' }}>- ₹{fin.advancePaid.toFixed(2)}</td>
                        </tr>
                        <tr style={{ background: '#fef2f2', fontWeight: 'bold', fontSize: '14px' }}>
                          <td style={{ padding: '10px 14px', color: '#991b1b' }}>Net Amount Due for Clearance:</td>
                          <td style={{ padding: '10px 14px', textAlign: 'right', color: '#b91c1c' }}>₹{fin.netDue.toFixed(2)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Payment Collection Details */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div className="cc-form-group">
                      <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155' }}>Payment Method</label>
                      <select 
                        value={settlementPaymentMethod} 
                        onChange={e => setSettlementPaymentMethod(e.target.value)}
                        style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', background: 'white' }}
                      >
                        <option value="Physical Cash Payment">Physical Cash Payment</option>
                        <option value="UPI / QR Code Transfer">UPI / QR Code Transfer</option>
                        <option value="Online Card Payment">Online Card Payment</option>
                        <option value="Insurance Cover / Claim">Insurance Cover / Claim</option>
                      </select>
                    </div>

                    <div className="cc-form-group">
                      <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155' }}>Settlement Notes / Remarks</label>
                      <input 
                        type="text" 
                        placeholder="e.g. Cleared full balance at counter" 
                        value={settlementRemarks} 
                        onChange={e => setSettlementRemarks(e.target.value)}
                        style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                      />
                    </div>
                  </div>
                </div>

                <div className="cc-modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', padding: '14px 20px', borderTop: '1px solid #e2e8f0', background: '#f8fafc' }}>
                  <button type="button" className="cc-btn-secondary" onClick={() => setSelectedAdmForSettlement(null)}>
                    Cancel
                  </button>
                  <button type="submit" className="cc-btn-primary" style={{ background: '#10b981', padding: '10px 20px' }}>
                    ✓ Settle Bill & Issue Discharge Certificate
                  </button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}

      {/* Official Inpatient Release Clearance Certificate & Consolidated Bill Modal */}
      {printedDischargeClearance && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 99999 }}>
          <div style={{ background: 'white', borderRadius: '12px', width: '640px', maxWidth: '92vw', maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', overflow: 'hidden' }}>
            <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
              <h3 style={{ margin: 0, fontSize: '16px', color: '#1e293b', fontWeight: '700' }}>📄 Inpatient Release Clearance Certificate</h3>
              <button onClick={() => setPrintedDischargeClearance(null)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#64748b' }}>&times;</button>
            </div>

            <div style={{ padding: '24px 30px', overflowY: 'auto', flex: 1, backgroundColor: 'white', color: '#0f172a', fontFamily: "'Inter', sans-serif" }}>
              <div style={{ textAlign: 'center', borderBottom: '2px solid #0f172a', paddingBottom: '12px', marginBottom: '16px' }}>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#1e293b' }}>DHMS CENTRAL CLINICAL HEALTHCARE</h3>
                <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#64748b' }}>Inpatient Department • Consolidated Bill & Hospital Release Certificate</p>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', background: '#f1f5f9', padding: '12px 16px', borderRadius: '8px', marginBottom: '16px' }}>
                <div>
                  <span style={{ fontSize: '10.5px', color: '#64748b', display: 'block' }}>CLEARANCE INVOICE ID</span>
                  <strong style={{ fontSize: '16px', color: '#4338ca' }}>{printedDischargeClearance.invoiceId}</strong>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '10.5px', color: '#64748b', display: 'block' }}>DISCHARGE DATE & TIME</span>
                  <strong>{printedDischargeClearance.settledDate} • {printedDischargeClearance.settledAt}</strong>
                </div>
              </div>

              <table style={{ width: '100%', fontSize: '12.5px', borderCollapse: 'collapse', marginBottom: '16px' }}>
                <tbody>
                  <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '6px 0', color: '#64748b' }}>Patient Name:</td>
                    <td style={{ padding: '6px 0', fontWeight: '700', textAlign: 'right' }}>{printedDischargeClearance.patientName} ({printedDischargeClearance.patientId})</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '6px 0', color: '#64748b' }}>Attending Physician:</td>
                    <td style={{ padding: '6px 0', fontWeight: '600', textAlign: 'right' }}>{printedDischargeClearance.doctorName}</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '6px 0', color: '#64748b' }}>Ward & Bed:</td>
                    <td style={{ padding: '6px 0', fontWeight: '700', textAlign: 'right', color: '#0369a1' }}>{printedDischargeClearance.ward} ({printedDischargeClearance.bedNo || 'Bed'})</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '6px 0', color: '#64748b' }}>Stay Duration:</td>
                    <td style={{ padding: '6px 0', fontWeight: '600', textAlign: 'right' }}>{printedDischargeClearance.admissionDate} to {printedDischargeClearance.settledDate} ({printedDischargeClearance.daysStayed} Days)</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '6px 0', color: '#64748b' }}>Discharge Condition:</td>
                    <td style={{ padding: '6px 0', fontWeight: '700', textAlign: 'right', color: '#15803d' }}>
                      {printedDischargeClearance.dischargeSummary?.condition || 'Stable / Cured'}
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Financial Ledger Table */}
              <div style={{ marginBottom: '16px' }}>
                <h5 style={{ margin: '0 0 6px 0', fontSize: '12px', color: '#334155', textTransform: 'uppercase' }}>Consolidated Financial Settlement:</h5>
                <table style={{ width: '100%', fontSize: '12.5px', borderCollapse: 'collapse', border: '1px solid #cbd5e1' }}>
                  <tbody>
                    <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '6px 10px', color: '#475569' }}>Room Charges ({printedDischargeClearance.daysStayed} days @ ₹{printedDischargeClearance.wardRate}):</td>
                      <td style={{ padding: '6px 10px', textAlign: 'right', fontWeight: '600' }}>₹{parseFloat(printedDischargeClearance.roomCharges || 0).toFixed(2)}</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '6px 10px', color: '#475569' }}>Inpatient Pharmacy Dispensed Medicines:</td>
                      <td style={{ padding: '6px 10px', textAlign: 'right', fontWeight: '600' }}>₹{parseFloat(printedDischargeClearance.pharmacyTotal || 0).toFixed(2)}</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '6px 10px', color: '#475569' }}>Inpatient Diagnostic Labs:</td>
                      <td style={{ padding: '6px 10px', textAlign: 'right', fontWeight: '600' }}>₹{parseFloat(printedDischargeClearance.labTotal || 0).toFixed(2)}</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #e2e8f0', background: '#f8fafc', fontWeight: 'bold' }}>
                      <td style={{ padding: '6px 10px' }}>Gross Total Charges:</td>
                      <td style={{ padding: '6px 10px', textAlign: 'right' }}>₹{parseFloat(printedDischargeClearance.grossTotal || 0).toFixed(2)}</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#166534' }}>
                      <td style={{ padding: '6px 10px' }}>Less: Advance Deposit Deducted:</td>
                      <td style={{ padding: '6px 10px', textAlign: 'right', fontWeight: '700' }}>- ₹{parseFloat(printedDischargeClearance.advanceDeducted || 0).toFixed(2)}</td>
                    </tr>
                    <tr style={{ background: '#f0fdf4', fontWeight: 'bold', fontSize: '13.5px' }}>
                      <td style={{ padding: '8px 10px', color: '#15803d' }}>Final Amount Paid ({printedDischargeClearance.paymentMethod}):</td>
                      <td style={{ padding: '8px 10px', textAlign: 'right', color: '#15803d' }}>₹{parseFloat(printedDischargeClearance.netAmountPaid || 0).toFixed(2)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Take-Home Care / Follow-Up */}
              {printedDischargeClearance.dischargeSummary?.takeHomeMeds && (
                <div style={{ background: '#f8fafc', padding: '10px 12px', borderRadius: '6px', border: '1px dashed #cbd5e1', fontSize: '11.5px', color: '#475569', marginBottom: '16px' }}>
                  <strong>💊 Prescribed Take-Home Regimen:</strong>
                  <pre style={{ margin: '4px 0 0 0', fontFamily: 'inherit', whiteSpace: 'pre-wrap', fontSize: '11px' }}>{printedDischargeClearance.dischargeSummary.takeHomeMeds}</pre>
                  <div style={{ marginTop: '6px', color: '#1e40af', fontWeight: 'bold' }}>Follow-up: {printedDischargeClearance.dischargeSummary.followUpDate}</div>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '24px', paddingTop: '12px', borderTop: '1px solid #e2e8f0', fontSize: '11.5px', color: '#64748b' }}>
                <div>Cashier: <strong>{printedDischargeClearance.cashierName || 'Cash Counter'}</strong></div>
                <div style={{ textAlign: 'right' }}>Official Medical Release Stamp</div>
              </div>
            </div>

            <div className="no-print" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', padding: '14px 20px', borderTop: '1px solid #e2e8f0', background: '#f8fafc' }}>
              <button type="button" onClick={() => setPrintedDischargeClearance(null)} style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #cbd5e1', background: 'white', color: '#475569', cursor: 'pointer', fontWeight: '600', fontSize: '13px' }}>
                Close
              </button>
              <button 
                type="button" 
                onClick={() => window.print()}
                style={{ padding: '8px 20px', borderRadius: '6px', border: 'none', background: '#4338ca', color: 'white', cursor: 'pointer', fontWeight: '700', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                🖨️ Print Clearance Certificate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
