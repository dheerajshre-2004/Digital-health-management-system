import React, { useState, useEffect } from 'react';
import './InsuranceDashboard.css';

function InsuranceDashboard({ onLogout }) {
  const [activeTab, setActiveTab] = useState('claims');
  const [claims, setClaims] = useState([]);
  const [policies, setPolicies] = useState([]);
  const [selectedClaim, setSelectedClaim] = useState(null);
  
  // Search & Filter states
  const [claimSearch, setClaimSearch] = useState('');
  const [claimStatusFilter, setClaimStatusFilter] = useState('All');
  const [policySearch, setPolicySearch] = useState('');

  // Form state for new policy registration
  const [showAddPolicyModal, setShowAddPolicyModal] = useState(false);
  const [newPolicyForm, setNewPolicyForm] = useState({
    patientId: '',
    patientName: '',
    provider: 'Max Life Insurance',
    policyNo: '',
    coPay: '10',
    maxCoverage: '500000'
  });

  // Pre-authorization requests
  const [preAuths, setPreAuths] = useState([]);

  useEffect(() => {
    const loadFromStorage = () => {
      // Load claims from localStorage
      const savedClaims = localStorage.getItem('dhms_insurance_claims');
      if (savedClaims) {
        setClaims(JSON.parse(savedClaims));
      }
      // Load policies from localStorage
      const savedPolicies = localStorage.getItem('dhms_insurance_policies');
      if (savedPolicies) {
        setPolicies(JSON.parse(savedPolicies));
      }
      // Load pre-auths from localStorage
      const savedPreAuths = localStorage.getItem('dhms_insurance_pre_auths');
      if (savedPreAuths) {
        setPreAuths(JSON.parse(savedPreAuths));
      }
    };
    loadFromStorage();
    window.addEventListener('storage', loadFromStorage);
    return () => window.removeEventListener('storage', loadFromStorage);
  }, []);

  const saveClaimsToStorage = (updatedClaims) => {
    localStorage.setItem('dhms_insurance_claims', JSON.stringify(updatedClaims));
    setClaims(updatedClaims);
  };

  const savePoliciesToStorage = (updatedPolicies) => {
    localStorage.setItem('dhms_insurance_policies', JSON.stringify(updatedPolicies));
    setPolicies(updatedPolicies);
  };

  // Helper to clean/convert currency strings to numbers
  const parseCurrency = (str) => {
    if (!str) return 0;
    return parseFloat(str.replace(/[^0-9.]/g, '')) || 0;
  };

  const handleApproveClaim = (claimId) => {
    const updatedClaims = claims.map(c => {
      if (c.id === claimId) {
        // Also update corresponding invoice status in dhms_billing if exists
        updateBillingStatus(c.invoiceId, 'Paid');
        // Update utilized coverage in policy
        updatePolicyUtilized(c.patientId, parseCurrency(c.claimedAmount));
        return { ...c, status: 'Approved', remarks: 'Claim verified and approved by TPA agent.' };
      }
      return c;
    });
    saveClaimsToStorage(updatedClaims);
    setSelectedClaim(null);
  };

  const handleRejectClaim = (claimId, reason) => {
    const updatedClaims = claims.map(c => {
      if (c.id === claimId) {
        updateBillingStatus(c.invoiceId, 'Unpaid');
        return { ...c, status: 'Rejected', remarks: reason || 'Rejected due to mismatch in claim documents.' };
      }
      return c;
    });
    saveClaimsToStorage(updatedClaims);
    setSelectedClaim(null);
  };

  const updateBillingStatus = (invoiceId, status) => {
    const savedBilling = localStorage.getItem('dhms_billing');
    if (savedBilling) {
      const billing = JSON.parse(savedBilling);
      const updated = billing.map(inv => {
        if (inv.id === invoiceId) {
          return { ...inv, status: status, paymentMethod: 'Insurance Claim' };
        }
        return inv;
      });
      localStorage.setItem('dhms_billing', JSON.stringify(updated));
      // Dispatch storage event to sync other dashboards if running
      window.dispatchEvent(new Event('storage'));
    }
  };

  const updatePolicyUtilized = (patientId, amount) => {
    const updatedPolicies = policies.map(p => {
      if (p.patientId === patientId) {
        return { ...p, utilized: (p.utilized || 0) + amount };
      }
      return p;
    });
    savePoliciesToStorage(updatedPolicies);
  };

  const handleAddPolicySubmit = (e) => {
    e.preventDefault();
    // Validate patient has details
    const patients = JSON.parse(localStorage.getItem('dhms_patients') || '[]');
    const matchedPatient = patients.find(p => p.id === newPolicyForm.patientId);
    const pName = matchedPatient ? `${matchedPatient.firstName} ${matchedPatient.lastName}` : newPolicyForm.patientName;

    const newPolicy = {
      patientId: newPolicyForm.patientId,
      patientName: pName || 'Unknown Patient',
      provider: newPolicyForm.provider,
      policyNo: newPolicyForm.policyNo || `POL-${Math.floor(100000 + Math.random() * 900000)}`,
      coPay: parseInt(newPolicyForm.coPay) || 0,
      maxCoverage: parseFloat(newPolicyForm.maxCoverage) || 500000,
      utilized: 0,
      status: 'Active'
    };

    const updated = [newPolicy, ...policies];
    savePoliciesToStorage(updated);
    setShowAddPolicyModal(false);
    setNewPolicyForm({
      patientId: '',
      patientName: '',
      provider: 'Max Life Insurance',
      policyNo: '',
      coPay: '10',
      maxCoverage: '500000'
    });
  };

  const savePreAuthsToStorage = (updated) => {
    localStorage.setItem('dhms_insurance_pre_auths', JSON.stringify(updated));
    setPreAuths(updated);
  };

  const handleApprovePreAuth = (id) => {
    const updated = preAuths.map(pa => {
      if (pa.id === id) {
        return { ...pa, status: 'Approved' };
      }
      return pa;
    });
    savePreAuthsToStorage(updated);
  };

  const handleRejectPreAuth = (id) => {
    const updated = preAuths.map(pa => {
      if (pa.id === id) {
        return { ...pa, status: 'Rejected' };
      }
      return pa;
    });
    savePreAuthsToStorage(updated);
  };

  // Analytics helper calculations
  const totalClaimsCount = claims.length;
  const approvedClaims = claims.filter(c => c.status === 'Approved');
  const pendingClaims = claims.filter(c => c.status === 'Pending' || c.status === 'Submitted');
  const rejectedClaims = claims.filter(c => c.status === 'Rejected');

  const totalClaimsAmountVal = claims.reduce((sum, c) => sum + parseCurrency(c.amount), 0);
  const approvedClaimsAmountVal = approvedClaims.reduce((sum, c) => sum + parseCurrency(c.claimedAmount), 0);
  const pendingClaimsAmountVal = pendingClaims.reduce((sum, c) => sum + parseCurrency(c.claimedAmount), 0);

  // Filtered lists
  const filteredClaims = claims.filter(c => {
    const matchesSearch = c.patientName.toLowerCase().includes(claimSearch.toLowerCase()) || 
                          c.id.toLowerCase().includes(claimSearch.toLowerCase()) ||
                          c.policyNo.toLowerCase().includes(claimSearch.toLowerCase());
    const matchesStatus = claimStatusFilter === 'All' || c.status === claimStatusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredPolicies = policies.filter(p => 
    p.patientName.toLowerCase().includes(policySearch.toLowerCase()) ||
    p.patientId.toLowerCase().includes(policySearch.toLowerCase()) ||
    p.policyNo.toLowerCase().includes(policySearch.toLowerCase())
  );

  return (
    <div className="ins-container">
      {/* Top Navigation Bar */}
      <header className="ins-topbar">
        <div className="ins-logo-area">
          <svg className="ins-logo-icon" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          <span className="ins-logo-text">DHMS</span>
          <span className="ins-logo-divider">/</span>
          <span className="ins-logo-sub">TPA Portal</span>
        </div>
        
        <div className="ins-topbar-right">
          <div className="ins-profile-info">
            <div className="ins-avatar">TPA</div>
            <div className="ins-profile-text">
              <span className="ins-profile-name">Insurance Agent</span>
              <span className="ins-profile-role">Claims Auditor</span>
            </div>
          </div>
          
          <button className="ins-btn-logout" onClick={onLogout}>
            <svg style={{ width: '18px', height: '18px' }} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Sign Out
          </button>
        </div>
      </header>

      {/* Main Layout */}
      <div className="ins-layout">
        {/* Sidebar */}
        <aside className="ins-sidebar">
          <button className={`ins-nav-item ${activeTab === 'claims' ? 'active' : ''}`} onClick={() => setActiveTab('claims')}>
            <svg className="ins-nav-icon" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Claims Inbox
          </button>
          
          <button className={`ins-nav-item ${activeTab === 'policies' ? 'active' : ''}`} onClick={() => setActiveTab('policies')}>
            <svg className="ins-nav-icon" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
            </svg>
            Policy Database
          </button>

          <button className={`ins-nav-item ${activeTab === 'preauth' ? 'active' : ''}`} onClick={() => setActiveTab('preauth')}>
            <svg className="ins-nav-icon" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
            Pre-Authorizations
          </button>

          <button className={`ins-nav-item ${activeTab === 'analytics' ? 'active' : ''}`} onClick={() => setActiveTab('analytics')}>
            <svg className="ins-nav-icon" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 3.055A9.003 9.003 0 1020.945 13H11V3.055z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
            </svg>
            Insights & Reports
          </button>
        </aside>

        {/* Content View */}
        <main className="ins-content">
          {/* Key Metrics row */}
          <div className="ins-stats-grid">
            <div className="ins-stat-card">
              <div className="ins-stat-icon-wrapper blue">
                <svg style={{ width: '24px', height: '24px' }} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div className="ins-stat-details">
                <span className="ins-stat-title">Claims Value</span>
                <span className="ins-stat-value">₹{totalClaimsAmountVal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            </div>

            <div className="ins-stat-card">
              <div className="ins-stat-icon-wrapper green">
                <svg style={{ width: '24px', height: '24px' }} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ins-stat-details">
                <span className="ins-stat-title">Total Settled</span>
                <span className="ins-stat-value">₹{approvedClaimsAmountVal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            </div>

            <div className="ins-stat-card">
              <div className="ins-stat-icon-wrapper orange">
                <svg style={{ width: '24px', height: '24px' }} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ins-stat-details">
                <span className="ins-stat-title">Pending Claims</span>
                <span className="ins-stat-value">{pendingClaims.length} (₹{pendingClaimsAmountVal.toLocaleString('en-IN')})</span>
              </div>
            </div>

            <div className="ins-stat-card">
              <div className="ins-stat-icon-wrapper red">
                <svg style={{ width: '24px', height: '24px' }} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ins-stat-details">
                <span className="ins-stat-title">Rejections</span>
                <span className="ins-stat-value">{rejectedClaims.length} Claims</span>
              </div>
            </div>
          </div>

          {/* Tab Views */}
          {activeTab === 'claims' && (
            <div className="ins-card">
              <div className="ins-card-header">
                <span className="ins-card-title">Claims Processing Desk</span>
                <div className="ins-badge active">Real-Time Sync Active</div>
              </div>

              {/* Filters */}
              <div className="ins-controls-row">
                <div className="ins-search-wrapper">
                  <svg className="ins-search-icon" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input 
                    type="text" 
                    placeholder="Search claims by Patient, Claim ID or Policy Number..." 
                    className="ins-search-input"
                    value={claimSearch}
                    onChange={(e) => setClaimSearch(e.target.value)}
                  />
                </div>
                
                <select 
                  className="ins-select" 
                  value={claimStatusFilter}
                  onChange={(e) => setClaimStatusFilter(e.target.value)}
                >
                  <option value="All">All Claims Status</option>
                  <option value="Pending">Pending Audit</option>
                  <option value="Approved">Settled / Approved</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>

              {/* Table */}
              <div className="ins-table-container">
                <table className="ins-table">
                  <thead>
                    <tr>
                      <th>Claim ID</th>
                      <th>Patient</th>
                      <th>Insurance Provider / Policy</th>
                      <th>Bill Amount</th>
                      <th>Claimed Portion</th>
                      <th>Date</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredClaims.length === 0 ? (
                      <tr>
                        <td colSpan="8" style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
                          No claims match the filter criteria.
                        </td>
                      </tr>
                    ) : (
                      filteredClaims.map((claim) => (
                        <tr key={claim.id}>
                          <td><strong>{claim.id}</strong></td>
                          <td>
                            <div>{claim.patientName}</div>
                            <span style={{ fontSize: '11px', color: '#64748b' }}>{claim.patientId}</span>
                          </td>
                          <td>
                            <div>{claim.provider}</div>
                            <span style={{ fontSize: '11px', color: '#94a3b8', fontFamily: 'monospace' }}>{claim.policyNo}</span>
                          </td>
                          <td>{claim.amount}</td>
                          <td><strong style={{ color: '#0ea5e9' }}>{claim.claimedAmount}</strong></td>
                          <td>{claim.date}</td>
                          <td>
                            <span className={`ins-badge ${claim.status?.toLowerCase() === 'pending' || claim.status?.toLowerCase() === 'submitted' ? 'pending' : claim.status?.toLowerCase() === 'approved' ? 'approved' : 'rejected'}`}>
                              {claim.status === 'Submitted' ? 'Pending' : claim.status}
                            </span>
                          </td>
                          <td>
                            <button className="ins-btn ins-btn-secondary" onClick={() => setSelectedClaim(claim)}>
                              Review & Audit
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'policies' && (
            <div className="ins-card">
              <div className="ins-card-header">
                <span className="ins-card-title">Patient Policy Database</span>
                <button className="ins-btn ins-btn-primary" onClick={() => setShowAddPolicyModal(true)}>
                  Register New Policy
                </button>
              </div>

              {/* Search */}
              <div className="ins-controls-row">
                <div className="ins-search-wrapper">
                  <svg className="ins-search-icon" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input 
                    type="text" 
                    placeholder="Search policies by Patient Name, ID or Policy No..." 
                    className="ins-search-input"
                    value={policySearch}
                    onChange={(e) => setPolicySearch(e.target.value)}
                  />
                </div>
              </div>

              {/* Policies List */}
              <div className="ins-table-container">
                <table className="ins-table">
                  <thead>
                    <tr>
                      <th>Policy No</th>
                      <th>Patient</th>
                      <th>Insurance Provider</th>
                      <th>Co-pay Rate</th>
                      <th>Total Coverage</th>
                      <th>Utilized Amt</th>
                      <th>Remaining Limit</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPolicies.length === 0 ? (
                      <tr>
                        <td colSpan="8" style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
                          No policies registered in the system.
                        </td>
                      </tr>
                    ) : (
                      filteredPolicies.map((policy) => {
                        const remaining = policy.maxCoverage - (policy.utilized || 0);
                        return (
                          <tr key={policy.policyNo}>
                            <td><strong style={{ fontFamily: 'monospace' }}>{policy.policyNo}</strong></td>
                            <td>
                              <div>{policy.patientName}</div>
                              <span style={{ fontSize: '11px', color: '#64748b' }}>{policy.patientId}</span>
                            </td>
                            <td>{policy.provider}</td>
                            <td>{policy.coPay}%</td>
                            <td>₹{policy.maxCoverage.toLocaleString('en-IN')}</td>
                            <td style={{ color: '#b91c1c' }}>₹{(policy.utilized || 0).toLocaleString('en-IN')}</td>
                            <td><strong style={{ color: '#16a34a' }}>₹{remaining.toLocaleString('en-IN')}</strong></td>
                            <td>
                              <span className={`ins-badge ${policy.status?.toLowerCase() === 'active' ? 'active' : 'expired'}`}>
                                {policy.status}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'preauth' && (
            <div className="ins-card">
              <div className="ins-card-header">
                <span className="ins-card-title">Treatment Pre-Authorization Desk</span>
              </div>
              
              <div className="ins-table-container">
                <table className="ins-table">
                  <thead>
                    <tr>
                      <th>Pre-Auth ID</th>
                      <th>Patient</th>
                      <th>Required Procedure</th>
                      <th>Estimated Billing</th>
                      <th>Provider / Policy</th>
                      <th>Date Requested</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preAuths.map((pa) => (
                      <tr key={pa.id}>
                        <td><strong>{pa.id}</strong></td>
                        <td>{pa.patientName} ({pa.patientId})</td>
                        <td>{pa.procedure}</td>
                        <td><strong style={{ color: '#0ea5e9' }}>{pa.estimatedCost}</strong></td>
                        <td>{pa.provider} ({pa.policyNo})</td>
                        <td>{pa.date}</td>
                        <td>
                          <span className={`ins-badge ${pa.status.toLowerCase() === 'pending' ? 'pending' : pa.status.toLowerCase() === 'approved' ? 'approved' : 'rejected'}`}>
                            {pa.status}
                          </span>
                        </td>
                        <td>
                          {pa.status === 'Pending' ? (
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button className="ins-btn ins-btn-success" style={{ padding: '6px 12px' }} onClick={() => handleApprovePreAuth(pa.id)}>
                                Approve
                              </button>
                              <button className="ins-btn ins-btn-danger" style={{ padding: '6px 12px' }} onClick={() => handleRejectPreAuth(pa.id)}>
                                Deny
                              </button>
                            </div>
                          ) : (
                            <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 'bold' }}>Decision Logged</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="ins-grid-2col">
              <div className="ins-card">
                <span className="ins-card-title" style={{ display: 'block', marginBottom: '16px' }}>Settlement Distribution</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                      <span>Max Life Insurance</span>
                      <strong>₹{claims.filter(c => c.provider === 'Max Life Insurance' && c.status === 'Approved').reduce((s, c) => s + parseCurrency(c.claimedAmount), 0).toLocaleString('en-IN')}</strong>
                    </div>
                    <div className="ins-progress-bar-bg"><div className="ins-progress-bar" style={{ width: '45%' }}></div></div>
                  </div>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                      <span>Star Health Insurance</span>
                      <strong>₹{claims.filter(c => c.provider === 'Star Health Insurance' && c.status === 'Approved').reduce((s, c) => s + parseCurrency(c.claimedAmount), 0).toLocaleString('en-IN')}</strong>
                    </div>
                    <div className="ins-progress-bar-bg"><div className="ins-progress-bar" style={{ width: '30%', background: '#22c55e' }}></div></div>
                  </div>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                      <span>Care Health Insurance</span>
                      <strong>₹{claims.filter(c => c.provider === 'Care Health Insurance' && c.status === 'Approved').reduce((s, c) => s + parseCurrency(c.claimedAmount), 0).toLocaleString('en-IN')}</strong>
                    </div>
                    <div className="ins-progress-bar-bg"><div className="ins-progress-bar" style={{ width: '15%', background: '#f59e0b' }}></div></div>
                  </div>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                      <span>HDFC Ergo</span>
                      <strong>₹{claims.filter(c => c.provider === 'HDFC Ergo' && c.status === 'Approved').reduce((s, c) => s + parseCurrency(c.claimedAmount), 0).toLocaleString('en-IN')}</strong>
                    </div>
                    <div className="ins-progress-bar-bg"><div className="ins-progress-bar" style={{ width: '10%', background: '#ec4899' }}></div></div>
                  </div>
                </div>
              </div>

              <div className="ins-card">
                <span className="ins-card-title" style={{ display: 'block', marginBottom: '16px' }}>Audit Performance & SLA</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '15px' }}>Auto-Approval Accuracy</h4>
                      <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#64748b' }}>Claims processed without human delay</p>
                    </div>
                    <span style={{ fontSize: '24px', fontWeight: '800', color: '#22c55e' }}>94.2%</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '15px' }}>Average Settlement Turnaround</h4>
                      <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#64748b' }}>SLA from billing checkout to agent audit</p>
                    </div>
                    <span style={{ fontSize: '24px', fontWeight: '800', color: '#0ea5e9' }}>1.4 Hours</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '15px' }}>Rejection Ratio</h4>
                      <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#64748b' }}>Claims denied due to coverage/co-pay limits</p>
                    </div>
                    <span style={{ fontSize: '24px', fontWeight: '800', color: '#ef4444' }}>8.3%</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Claim Detail Modal */}
      {selectedClaim && (
        <div className="ins-modal-overlay" onClick={() => setSelectedClaim(null)}>
          <div className="ins-modal" onClick={(e) => e.stopPropagation()}>
            <div className="ins-modal-header">
              <span className="ins-modal-title">Reviewing Insurance Claim: {selectedClaim.id}</span>
              <button className="ins-modal-close" onClick={() => setSelectedClaim(null)}>
                <svg style={{ width: '20px', height: '20px' }} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="ins-modal-body">
              <div className="ins-detail-grid">
                <div className="ins-detail-item">
                  <span className="ins-detail-label">Patient Name</span>
                  <span className="ins-detail-value">{selectedClaim.patientName}</span>
                </div>
                <div className="ins-detail-item">
                  <span className="ins-detail-label">Patient ID</span>
                  <span className="ins-detail-value">{selectedClaim.patientId}</span>
                </div>
                <div className="ins-detail-item">
                  <span className="ins-detail-label">Insurance Provider</span>
                  <span className="ins-detail-value">{selectedClaim.provider}</span>
                </div>
                <div className="ins-detail-item">
                  <span className="ins-detail-label">Policy Number</span>
                  <span className="ins-detail-value">{selectedClaim.policyNo}</span>
                </div>
                <div className="ins-detail-item">
                  <span className="ins-detail-label">Total Bill Amount</span>
                  <span className="ins-detail-value">{selectedClaim.amount}</span>
                </div>
                <div className="ins-detail-item">
                  <span className="ins-detail-label">Claimed Portion</span>
                  <span className="ins-detail-value" style={{ color: '#0ea5e9' }}>{selectedClaim.claimedAmount}</span>
                </div>
                <div className="ins-detail-item">
                  <span className="ins-detail-label">Patient Co-Pay Cost</span>
                  <span className="ins-detail-value" style={{ color: '#f59e0b' }}>{selectedClaim.coPayAmount}</span>
                </div>
                <div className="ins-detail-item">
                  <span className="ins-detail-label">Diagnosis / Treatment</span>
                  <span className="ins-detail-value">{selectedClaim.diagnosis || 'Clinical Diagnostics / Treatment'}</span>
                </div>
              </div>

              <div className="ins-divider"></div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <span className="ins-detail-label">Claim Status & Audit Remarks</span>
                <div style={{ fontSize: '13px', background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', color: '#475569' }}>
                  {selectedClaim.remarks || 'No prior review remarks logged.'}
                </div>
              </div>
            </div>

            <div className="ins-modal-footer">
              <button className="ins-btn ins-btn-secondary" onClick={() => setSelectedClaim(null)}>
                Close Window
              </button>
              {(selectedClaim.status === 'Pending' || selectedClaim.status === 'Submitted') && (
                <>
                  <button className="ins-btn ins-btn-danger" onClick={() => handleRejectClaim(selectedClaim.id, 'Claim rejected due to policy exclusions.')}>
                    Reject Claim
                  </button>
                  <button className="ins-btn ins-btn-success" onClick={() => handleApproveClaim(selectedClaim.id)}>
                    Approve & Settle
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Policy Modal */}
      {showAddPolicyModal && (
        <div className="ins-modal-overlay" onClick={() => setShowAddPolicyModal(false)}>
          <div className="ins-modal" onClick={(e) => e.stopPropagation()}>
            <div className="ins-modal-header">
              <span className="ins-modal-title">Register Patient Insurance Policy</span>
              <button className="ins-modal-close" onClick={() => setShowAddPolicyModal(false)}>
                <svg style={{ width: '20px', height: '20px' }} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleAddPolicySubmit}>
              <div className="ins-modal-body">
                <div className="ins-form-group">
                  <label>Patient ID</label>
                  <input 
                    type="text" 
                    placeholder="e.g. PT-80234" 
                    className="ins-input"
                    value={newPolicyForm.patientId}
                    onChange={(e) => setNewPolicyForm({ ...newPolicyForm, patientId: e.target.value })}
                    required
                  />
                </div>
                <div className="ins-form-group">
                  <label>Patient Name (Fallback if ID not synced)</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Alice Johnson" 
                    className="ins-input"
                    value={newPolicyForm.patientName}
                    onChange={(e) => setNewPolicyForm({ ...newPolicyForm, patientName: e.target.value })}
                  />
                </div>
                <div className="ins-form-group">
                  <label>Insurance Provider</label>
                  <select 
                    className="ins-input"
                    value={newPolicyForm.provider}
                    onChange={(e) => setNewPolicyForm({ ...newPolicyForm, provider: e.target.value })}
                  >
                    <option value="Max Life Insurance">Max Life Insurance</option>
                    <option value="Star Health Insurance">Star Health Insurance</option>
                    <option value="Care Health Insurance">Care Health Insurance</option>
                    <option value="HDFC Ergo">HDFC Ergo</option>
                  </select>
                </div>
                <div className="ins-form-group">
                  <label>Policy Number</label>
                  <input 
                    type="text" 
                    placeholder="e.g. POL-88123" 
                    className="ins-input"
                    value={newPolicyForm.policyNo}
                    onChange={(e) => setNewPolicyForm({ ...newPolicyForm, policyNo: e.target.value })}
                    required
                  />
                </div>
                <div className="ins-form-group" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label>Patient Co-pay (%)</label>
                    <input 
                      type="number" 
                      min="0" 
                      max="100" 
                      className="ins-input"
                      value={newPolicyForm.coPay}
                      onChange={(e) => setNewPolicyForm({ ...newPolicyForm, coPay: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label>Max Coverage Limit (₹)</label>
                    <input 
                      type="number" 
                      className="ins-input"
                      value={newPolicyForm.maxCoverage}
                      onChange={(e) => setNewPolicyForm({ ...newPolicyForm, maxCoverage: e.target.value })}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="ins-modal-footer">
                <button type="button" className="ins-btn ins-btn-secondary" onClick={() => setShowAddPolicyModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="ins-btn ins-btn-primary">
                  Save Policy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default InsuranceDashboard;
