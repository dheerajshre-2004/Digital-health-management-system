import React, { useState, useEffect } from 'react';
import './BloodBank.css';
import {
  BLOOD_GROUPS,
  COMPONENT_TYPES,
  getBloodStock,
  saveBloodStock,
  getBloodDonors,
  saveBloodDonors,
  getTransfusionRequests,
  saveTransfusionRequests,
  getDaysToExpiry,
  validateBloodCompatibility
} from './bloodBankService';

export default function BloodBankManagement({ role = 'admin', loggedInUser = null }) {
  const isPatient = role === 'patient';
  const [activeSubTab, setActiveSubTab] = useState(isPatient ? 'patient_pledge' : 'inventory'); // 'inventory', 'crossmatch', 'donors', 'wastage', 'patient_pledge'
  
  // Resolve current patient's full medical record if patient role
  const resolvedPatient = React.useMemo(() => {
    if (!loggedInUser) return null;
    const patients = JSON.parse(localStorage.getItem('dhms_patients') || '[]');
    const match = patients.find(p => p.id === loggedInUser.id || p.email === loggedInUser.email || p.phone === loggedInUser.phone);
    return match || loggedInUser;
  }, [loggedInUser]);

  // Data states
  const [stock, setStock] = useState([]);
  const [donors, setDonors] = useState([]);
  const [transfusions, setTransfusions] = useState([]);
  
  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [groupFilter, setGroupFilter] = useState('All');
  const [componentFilter, setComponentFilter] = useState('All');
  const [stockStatusFilter, setStockStatusFilter] = useState('All');

  // Modals
  const [showAddBagModal, setShowAddBagModal] = useState(false);
  const [showAddDonorModal, setShowAddDonorModal] = useState(false);
  const [showTransfusionReqModal, setShowTransfusionReqModal] = useState(false);
  const [showPatientDonateModal, setShowPatientDonateModal] = useState(false);
  const [selectedTransfusionForIssue, setSelectedTransfusionForIssue] = useState(null);
  const [selectedBagForDiscard, setSelectedBagForDiscard] = useState(null);
  const [discardReasonInput, setDiscardReasonInput] = useState('Shelf-life expired');

  // Patient Voluntary Donation Pledge state
  const [patientPledgeForm, setPatientPledgeForm] = useState({
    weightKg: 65,
    hemoglobinGdl: 13.5,
    preferredDate: new Date().toISOString().split('T')[0],
    preferredSlot: 'Morning (09:00 AM - 12:00 PM)',
    componentChoice: 'Whole Blood / PRBC',
    notes: 'Voluntary patient donation'
  });

  // Calculate age from dob
  const patientAge = React.useMemo(() => {
    if (!resolvedPatient?.dob) return 28;
    const birthYear = new Date(resolvedPatient.dob).getFullYear();
    const currentYear = new Date().getFullYear();
    return Math.max(18, currentYear - birthYear) || 28;
  }, [resolvedPatient]);

  const patientFullName = resolvedPatient ? `${resolvedPatient.firstName || ''} ${resolvedPatient.lastName || ''}`.trim() || resolvedPatient.name || 'Registered Patient' : 'Registered Patient';
  const patientBloodGroup = resolvedPatient?.bloodType || resolvedPatient?.bloodGroup || 'O+';
  const patientUHID = resolvedPatient?.id || 'PT-80234';

  // New Blood Bag Form
  const [newBagForm, setNewBagForm] = useState({
    bloodGroup: 'O+',
    componentCode: 'PRBC',
    volumeMl: 350,
    donorId: '',
    donorName: '',
    collectedDate: new Date().toISOString().split('T')[0],
    storageLocation: 'Refrigerator Unit 1 - Shelf A',
    serologyScreening: 'Negative (HIV/HBsAg/HCV/VDRL/MP Clear)'
  });

  // New Donor Form
  const [newDonorForm, setNewDonorForm] = useState({
    name: '',
    age: 28,
    gender: 'Male',
    bloodGroup: 'O+',
    phone: '',
    email: '',
    weightKg: 65,
    hemoglobinGdl: 14.0,
    address: ''
  });

  // New Transfusion Request Form (Doctors / ICU)
  const [newTransfusionForm, setNewTransfusionForm] = useState({
    patientId: 'PT-80234',
    patientName: 'John Doe',
    patientBloodGroup: 'O+',
    recipientWard: 'General Ward A',
    attendingDoctor: loggedInUser?.name || 'Dr. Marcus Vance',
    componentCode: 'PRBC',
    unitsRequested: 1,
    urgencyLevel: 'Routine (Within 4-6 hours)',
    clinicalIndication: 'Symptomatic Chronic Anemia'
  });

  // Cross-match Checklist verification state
  const [crossMatchChecks, setCrossMatchChecks] = useState({
    patientIdentityConfirmed: true,
    bloodBagBarcodeScanned: true,
    expiryVerified: true,
    doctorCrossMatchConsent: true,
    dualNurseBedsideVerification: true
  });

  // Load all data
  const loadData = () => {
    setStock(getBloodStock());
    setDonors(getBloodDonors());
    setTransfusions(getTransfusionRequests());
  };

  useEffect(() => {
    loadData();
    window.addEventListener('storage', loadData);
    return () => window.removeEventListener('storage', loadData);
  }, []);

  // Compute Metrics
  const totalUnitsAvailable = stock.filter(b => b.status === 'Available').length;
  const criticalExpiringUnits = stock.filter(b => b.status === 'Available' && getDaysToExpiry(b.expiryDate) <= 3);
  const discardedUnits = stock.filter(b => b.status === 'Discarded');
  const pendingCrossmatchCount = transfusions.filter(t => t.transfusionStatus === 'Requested').length;

  // Handle Adding Blood Bag to Stock
  const handleAddBloodBag = (e) => {
    e.preventDefault();
    const comp = COMPONENT_TYPES.find(c => c.id === newBagForm.componentCode) || COMPONENT_TYPES[0];
    
    // Calculate expiry date automatically based on component shelf-life
    const colDate = new Date(newBagForm.collectedDate);
    const expDate = new Date(colDate);
    expDate.setDate(expDate.getDate() + comp.shelfLifeDays);
    const expiryStr = expDate.toISOString().split('T')[0];

    const newBag = {
      bagNumber: `BB-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`,
      bloodGroup: newBagForm.bloodGroup,
      component: comp.name,
      componentCode: comp.id,
      volumeMl: Number(newBagForm.volumeMl),
      donorId: newBagForm.donorId || 'VOLUNTEER',
      donorName: newBagForm.donorName || 'Hospital Blood Drive Donor',
      collectedDate: newBagForm.collectedDate,
      expiryDate: expiryStr,
      storageLocation: newBagForm.storageLocation,
      serologyScreening: newBagForm.serologyScreening,
      status: 'Available',
      discardReason: null,
      reservedForPatientId: null,
      reservedForPatientName: null
    };

    const updated = [newBag, ...stock];
    saveBloodStock(updated);
    setStock(updated);
    setShowAddBagModal(false);
    alert(`Blood Unit ${newBag.bagNumber} (${newBag.bloodGroup} ${newBag.component}) added to storage registry.`);
  };

  // Handle Registering Donor
  const handleAddDonor = (e) => {
    e.preventDefault();
    if (Number(newDonorForm.weightKg) < 50) {
      alert('Donor Safety Alert: Minimum weight for voluntary whole blood donation is 50 kg.');
      return;
    }
    if (Number(newDonorForm.hemoglobinGdl) < 12.5) {
      alert('Donor Safety Alert: Hemoglobin level must be at least 12.5 g/dL to donate blood.');
      return;
    }

    const donorId = `DNR-${Math.floor(500 + Math.random() * 500)}`;
    const todayStr = new Date().toISOString().split('T')[0];
    const newDonor = {
      donorId,
      ...newDonorForm,
      lastDonatedDate: todayStr,
      eligibilityStatus: 'Donated Today (Next eligible after 90 days)',
      totalDonations: 1
    };

    const updatedDonors = [newDonor, ...donors];
    saveBloodDonors(updatedDonors);
    setDonors(updatedDonors);

    // Automatically prompt to log collected blood bag
    const comp = COMPONENT_TYPES[0]; // PRBC
    const expDate = new Date();
    expDate.setDate(expDate.getDate() + comp.shelfLifeDays);

    const autoBag = {
      bagNumber: `BB-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`,
      bloodGroup: newDonor.bloodGroup,
      component: comp.name,
      componentCode: comp.id,
      volumeMl: 350,
      donorId: donorId,
      donorName: newDonor.name,
      collectedDate: todayStr,
      expiryDate: expDate.toISOString().split('T')[0],
      storageLocation: 'Refrigerator Unit 1 - Shelf A',
      serologyScreening: 'Negative (HIV/HBsAg/HCV/VDRL/MP Clear)',
      status: 'Available',
      discardReason: null,
      reservedForPatientId: null,
      reservedForPatientName: null
    };

    const updatedStock = [autoBag, ...stock];
    saveBloodStock(updatedStock);
    setStock(updatedStock);

    setShowAddDonorModal(false);
    alert(`Donor ${newDonor.name} registered and Unit ${autoBag.bagNumber} logged into inventory!`);
  };

  // Handle Transfusion Requisition (by Doctor/Surgeon)
  const handleCreateTransfusionRequest = (e) => {
    e.preventDefault();
    const comp = COMPONENT_TYPES.find(c => c.id === newTransfusionForm.componentCode) || COMPONENT_TYPES[0];
    const reqId = `TXR-${Math.floor(8000 + Math.random() * 1000)}`;

    const newReq = {
      requestId: reqId,
      patientId: newTransfusionForm.patientId,
      patientName: newTransfusionForm.patientName,
      patientBloodGroup: newTransfusionForm.patientBloodGroup,
      recipientWard: newTransfusionForm.recipientWard,
      attendingDoctor: newTransfusionForm.attendingDoctor,
      requiredComponent: comp.name,
      componentCode: comp.id,
      unitsRequested: Number(newTransfusionForm.unitsRequested),
      urgencyLevel: newTransfusionForm.urgencyLevel,
      clinicalIndication: newTransfusionForm.clinicalIndication,
      requestDate: new Date().toISOString().replace('T', ' ').substring(0, 16),
      crossMatchStatus: 'Pending Cross-Match',
      crossMatchedBy: null,
      crossMatchDate: null,
      assignedBagNumber: null,
      verificationChecks: {
        patientIdentityConfirmed: false,
        bloodBagBarcodeScanned: false,
        expiryVerified: false,
        doctorCrossMatchConsent: false,
        dualNurseBedsideVerification: false
      },
      transfusionStatus: 'Requested',
      vitalSignsPreTransfusion: { bp: '120/80', pulse: '78', temp: '98.6°F', spo2: '99%' },
      adverseReactions: 'None'
    };

    const updated = [newReq, ...transfusions];
    saveTransfusionRequests(updated);
    setTransfusions(updated);
    setShowTransfusionReqModal(false);
    alert(`Transfusion requisition ${reqId} generated for patient ${newReq.patientName}. Transfusion lab alerted for cross-match.`);
  };

  // Cross-Match Validation & Issue Blood Bag
  const handleExecuteCrossMatchAndIssue = (transfusionReq, assignedBagNumber) => {
    if (!assignedBagNumber) {
      alert('Error: Please select an available blood bag from the inventory for cross-matching.');
      return;
    }

    const bag = stock.find(b => b.bagNumber === assignedBagNumber);
    if (!bag) {
      alert('Selected blood bag is not available.');
      return;
    }

    // Strict Compatibility Check
    const isCompatible = validateBloodCompatibility(transfusionReq.patientBloodGroup, bag.bloodGroup, transfusionReq.componentCode);
    if (!isCompatible) {
      alert(`CRITICAL SAFETY ALERT - INCOMPATIBLE BLOOD MISMATCH:
Patient Blood Group: ${transfusionReq.patientBloodGroup}
Donor Bag Blood Group: ${bag.bloodGroup}
Component: ${transfusionReq.requiredComponent}

Transfusion is BLOCKED by safety protocol to prevent acute hemolytic reaction.`);
      return;
    }

    // Verify all 5 safety checkboxes are marked
    const allPassed = Object.values(crossMatchChecks).every(Boolean);
    if (!allPassed) {
      alert('Validation Error: All 5 bedside and lab verification checkpoints must be confirmed before issuing.');
      return;
    }

    // 1. Update Transfusion Request
    const updatedTransfusions = transfusions.map(t => {
      if (t.requestId === transfusionReq.requestId) {
        return {
          ...t,
          assignedBagNumber: bag.bagNumber,
          crossMatchStatus: `Compatible (Major & Minor Cross-Match Passed with Bag ${bag.bagNumber})`,
          crossMatchedBy: loggedInUser?.name || 'Pathology Transfusion Lab Specialist',
          crossMatchDate: new Date().toISOString().replace('T', ' ').substring(0, 16),
          verificationChecks: crossMatchChecks,
          transfusionStatus: 'Issued & In Progress'
        };
      }
      return t;
    });

    // 2. Mark Blood Bag as Cross-Matched & Issued
    const updatedStock = stock.map(b => {
      if (b.bagNumber === bag.bagNumber) {
        return {
          ...b,
          status: 'Cross-Matched',
          reservedForPatientId: transfusionReq.patientId,
          reservedForPatientName: transfusionReq.patientName
        };
      }
      return b;
    });

    saveTransfusionRequests(updatedTransfusions);
    saveBloodStock(updatedStock);
    setTransfusions(updatedTransfusions);
    setStock(updatedStock);
    setSelectedTransfusionForIssue(null);

    alert(`Cross-Match validation successful! Blood Bag ${bag.bagNumber} issued to ${transfusionReq.recipientWard} for ${transfusionReq.patientName}.`);
  };

  // Complete Transfusion (Post-observation)
  const handleCompleteTransfusion = (reqId) => {
    const targetReq = transfusions.find(t => t.requestId === reqId);
    if (!targetReq) return;

    const updatedTransfusions = transfusions.map(t => {
      if (t.requestId === reqId) {
        return {
          ...t,
          transfusionStatus: 'Transfusion Completed'
        };
      }
      return t;
    });

    const updatedStock = stock.map(b => {
      if (b.bagNumber === targetReq.assignedBagNumber) {
        return {
          ...b,
          status: 'Transfused'
        };
      }
      return b;
    });

    saveTransfusionRequests(updatedTransfusions);
    saveBloodStock(updatedStock);
    setTransfusions(updatedTransfusions);
    setStock(updatedStock);
    alert(`Transfusion ${reqId} marked as successfully completed. Blood unit archived.`);
  };

  // Discard Expired or Contaminated Unit (Wastage Tracking)
  const handleDiscardBag = (e) => {
    e.preventDefault();
    if (!selectedBagForDiscard) return;

    const updatedStock = stock.map(b => {
      if (b.bagNumber === selectedBagForDiscard.bagNumber) {
        return {
          ...b,
          status: 'Discarded',
          discardReason: discardReasonInput
        };
      }
      return b;
    });

    saveBloodStock(updatedStock);
    setStock(updatedStock);
    setSelectedBagForDiscard(null);
    alert(`Blood bag ${selectedBagForDiscard.bagNumber} marked as Discarded in hospital wastage audit logs.`);
  };

  // Handle Patient Voluntary Donation Pledge / Donation directly (No manual re-registration needed)
  const handlePatientVoluntaryDonation = (e) => {
    e.preventDefault();
    if (Number(patientPledgeForm.weightKg) < 50) {
      alert('Donor Safety Check: Minimum body weight required for voluntary donation is 50 kg.');
      return;
    }
    if (Number(patientPledgeForm.hemoglobinGdl) < 12.5) {
      alert('Donor Safety Check: Hemoglobin level must be at least 12.5 g/dL.');
      return;
    }

    const donorId = `DNR-${resolvedPatient?.id ? resolvedPatient.id.replace(/[^0-9]/g, '') || Math.floor(100 + Math.random() * 900) : Math.floor(500 + Math.random() * 500)}`;
    const todayStr = new Date().toISOString().split('T')[0];

    // Check if donor already exists in donor registry
    const existingDonor = donors.find(d => d.donorId === donorId || d.email === resolvedPatient?.email || d.phone === resolvedPatient?.phone);
    let updatedDonors;
    if (existingDonor) {
      updatedDonors = donors.map(d => {
        if (d.donorId === existingDonor.donorId) {
          return {
            ...d,
            lastDonatedDate: todayStr,
            weightKg: Number(patientPledgeForm.weightKg),
            hemoglobinGdl: Number(patientPledgeForm.hemoglobinGdl),
            totalDonations: (d.totalDonations || 1) + 1,
            eligibilityStatus: 'Donated Today (Next eligible in 90 days)'
          };
        }
        return d;
      });
    } else {
      const newDonorEntry = {
        donorId: donorId,
        name: patientFullName,
        age: patientAge,
        gender: resolvedPatient?.gender ? resolvedPatient.gender.charAt(0).toUpperCase() + resolvedPatient.gender.slice(1) : 'Other',
        bloodGroup: patientBloodGroup,
        phone: resolvedPatient?.phone || 'On Record',
        email: resolvedPatient?.email || 'patient@hospital.org',
        weightKg: Number(patientPledgeForm.weightKg),
        hemoglobinGdl: Number(patientPledgeForm.hemoglobinGdl),
        address: resolvedPatient?.address || 'Registered Hospital Patient',
        lastDonatedDate: todayStr,
        eligibilityStatus: 'Donated Today (Next eligible in 90 days)',
        totalDonations: 1,
        isRegisteredPatient: true,
        patientUHID: patientUHID
      };
      updatedDonors = [newDonorEntry, ...donors];
    }

    saveBloodDonors(updatedDonors);
    setDonors(updatedDonors);

    // Add collected blood bag to hospital stock automatically
    const comp = COMPONENT_TYPES[0]; // PRBC
    const expDate = new Date();
    expDate.setDate(expDate.getDate() + comp.shelfLifeDays);

    const autoBag = {
      bagNumber: `BB-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`,
      bloodGroup: patientBloodGroup,
      component: comp.name,
      componentCode: comp.id,
      volumeMl: 350,
      donorId: donorId,
      donorName: `${patientFullName} (UHID: ${patientUHID})`,
      collectedDate: todayStr,
      expiryDate: expDate.toISOString().split('T')[0],
      storageLocation: 'Voluntary Blood Center - Refrigerator Unit 1',
      serologyScreening: 'Negative (HIV/HBsAg/HCV/VDRL/MP Clear)',
      status: 'Available',
      discardReason: null,
      reservedForPatientId: null,
      reservedForPatientName: null
    };

    const updatedStock = [autoBag, ...stock];
    saveBloodStock(updatedStock);
    setStock(updatedStock);

    setShowPatientDonateModal(false);
    alert(`Thank you, ${patientFullName}! Your voluntary blood donation has been recorded. Blood Bag ${autoBag.bagNumber} (${patientBloodGroup} PRBC) has been registered in the hospital blood bank.`);
  };

  // Filtered Stock List
  const filteredStock = stock.filter(b => {
    const matchQ = b.bagNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                   b.donorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                   b.component.toLowerCase().includes(searchQuery.toLowerCase());
    const matchGroup = groupFilter === 'All' || b.bloodGroup === groupFilter;
    const matchComp = componentFilter === 'All' || b.componentCode === componentFilter;
    const matchStatus = stockStatusFilter === 'All' || b.status === stockStatusFilter;
    return matchQ && matchGroup && matchComp && matchStatus;
  });

  // Patient's own donation history
  const patientDonations = donors.filter(d => 
    d.donorId?.includes(patientUHID.replace(/[^0-9]/g, '')) || 
    d.patientUHID === patientUHID ||
    (d.name && patientFullName && d.name.toLowerCase().includes(patientFullName.toLowerCase()))
  );

  return (
    <div className="bb-container">
      {/* Top Banner */}
      <div className="bb-header">
        <div className="bb-header-title">
          <div className="bb-header-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"></path>
            </svg>
          </div>
          <div>
            <h2>{isPatient ? 'Voluntary Blood Donation & Health File' : 'Blood Bank & Transfusion Safety Management'}</h2>
            <p>
              {isPatient 
                ? 'Donate blood voluntarily to save lives. Your registered health profile is automatically verified without re-registering.' 
                : 'Component inventory, cross-match validation, donor registry, and shelf-life wastage prevention.'}
            </p>
          </div>
        </div>

        <div className="bb-actions-group">
          {isPatient ? (
            <button className="bb-btn bb-btn-primary" onClick={() => setShowPatientDonateModal(true)}>
              + Donate Blood Voluntarily
            </button>
          ) : (
            <>
              <button className="bb-btn bb-btn-primary" onClick={() => setShowAddBagModal(true)}>
                + Register Blood Bag
              </button>
              <button className="bb-btn bb-btn-secondary" onClick={() => setShowAddDonorModal(true)}>
                + Add Voluntary Donor
              </button>
              <button className="bb-btn bb-btn-danger" onClick={() => setShowTransfusionReqModal(true)}>
                + Request Transfusion
              </button>
            </>
          )}
        </div>
      </div>

      {/* Patient Health File & Verified Medical Profile Summary Card (Shown in Patient Role) */}
      {isPatient && resolvedPatient && (
        <div className="bb-health-file-card" style={{
          background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          padding: '20px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ 
                background: '#dc2626', 
                color: '#ffffff', 
                fontWeight: 'bold', 
                fontSize: '11px', 
                padding: '4px 8px', 
                borderRadius: '6px',
                letterSpacing: '0.5px'
              }}>
                HEALTH FILE & EHR SUMMARY
              </span>
              <h3 style={{ margin: 0, fontSize: '17px', color: '#0f172a', fontWeight: '700' }}>
                {patientFullName}
              </h3>
              <span style={{ fontSize: '13px', color: '#64748b' }}>UHID: <strong>{patientUHID}</strong></span>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <span style={{ background: '#dcfce7', color: '#15803d', fontSize: '12px', fontWeight: '600', padding: '4px 10px', borderRadius: '20px' }}>
                Auto-Verified Patient
              </span>
              <span style={{ background: '#fee2e2', color: '#dc2626', fontSize: '12px', fontWeight: '800', padding: '4px 12px', borderRadius: '20px' }}>
                Blood Group: {patientBloodGroup}
              </span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px' }}>
            <div style={{ background: '#ffffff', padding: '12px', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
              <div style={{ fontSize: '11.5px', color: '#64748b', textTransform: 'uppercase', fontWeight: '600' }}>Age / Gender</div>
              <div style={{ fontSize: '14px', fontWeight: '700', color: '#1e293b', marginTop: '2px' }}>
                {patientAge} Yrs / {resolvedPatient?.gender || 'Not specified'}
              </div>
            </div>

            <div style={{ background: '#ffffff', padding: '12px', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
              <div style={{ fontSize: '11.5px', color: '#64748b', textTransform: 'uppercase', fontWeight: '600' }}>Contact Phone</div>
              <div style={{ fontSize: '14px', fontWeight: '700', color: '#1e293b', marginTop: '2px' }}>
                {resolvedPatient?.phone || 'On Record'}
              </div>
            </div>

            <div style={{ background: '#ffffff', padding: '12px', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
              <div style={{ fontSize: '11.5px', color: '#64748b', textTransform: 'uppercase', fontWeight: '600' }}>Known Allergies</div>
              <div style={{ fontSize: '13px', fontWeight: '600', color: resolvedPatient?.allergies ? '#dc2626' : '#15803d', marginTop: '2px' }}>
                {resolvedPatient?.allergies || 'No known drug allergies'}
              </div>
            </div>

            <div style={{ background: '#ffffff', padding: '12px', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
              <div style={{ fontSize: '11.5px', color: '#64748b', textTransform: 'uppercase', fontWeight: '600' }}>Chronic Conditions</div>
              <div style={{ fontSize: '13px', fontWeight: '600', color: '#1e293b', marginTop: '2px' }}>
                {resolvedPatient?.chronicConditions || 'None reported'}
              </div>
            </div>

            <div style={{ background: '#ffffff', padding: '12px', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
              <div style={{ fontSize: '11.5px', color: '#64748b', textTransform: 'uppercase', fontWeight: '600' }}>Donation Eligibility</div>
              <div style={{ fontSize: '13px', fontWeight: '700', color: '#15803d', marginTop: '2px' }}>
                Eligible to Donate
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Critical Expiry Alert Banner (Hidden from patient) */}
      {!isPatient && criticalExpiringUnits.length > 0 && (
        <div className="bb-alert-banner">
          <div style={{ flexShrink: 0 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
          </div>
          <div>
            <div className="bb-alert-title">CRITICAL SHELF-LIFE EXPIRY ALERT ({criticalExpiringUnits.length} Units)</div>
            <p className="bb-alert-desc">
              {criticalExpiringUnits.map(b => `${b.bagNumber} (${b.bloodGroup} ${b.componentCode} - ${getDaysToExpiry(b.expiryDate)} day(s) left)`).join(', ')}. Please prioritize issue for cross-match or clinical transfer to avoid wastage.
            </p>
          </div>
        </div>
      )}

      {/* Executive Overview Cards */}
      <div className="bb-metrics-grid">
        <div className="bb-metric-card" style={{ borderLeft: '4px solid #16a34a' }}>
          <span className="bb-metric-label">{isPatient ? 'Hospital Blood Units Available' : 'Available Blood Stock'}</span>
          <div className="bb-metric-val">{totalUnitsAvailable} Units</div>
          <span className="bb-metric-sub">Tested and ready for patients</span>
        </div>
        <div className="bb-metric-card" style={{ borderLeft: '4px solid #dc2626' }}>
          <span className="bb-metric-label">{isPatient ? 'My Blood Type' : 'Expiring Soon (<= 3 Days)'}</span>
          <div className="bb-metric-val" style={{ color: '#dc2626' }}>
            {isPatient ? patientBloodGroup : `${criticalExpiringUnits.length} Units`}
          </div>
          <span className="bb-metric-sub">{isPatient ? 'Verified in Clinical Health File' : 'Requires urgent clinical allocation'}</span>
        </div>
        <div className="bb-metric-card" style={{ borderLeft: '4px solid #3b82f6' }}>
          <span className="bb-metric-label">{isPatient ? 'My Voluntary Donations' : 'Transfusion Requests'}</span>
          <div className="bb-metric-val">{isPatient ? patientDonations.length : `${transfusions.length} Requests`}</div>
          <span className="bb-metric-sub">{isPatient ? 'Recorded in hospital network' : `${pendingCrossmatchCount} Pending Cross-Match`}</span>
        </div>
        <div className="bb-metric-card" style={{ borderLeft: '4px solid #64748b' }}>
          <span className="bb-metric-label">{isPatient ? 'Total Voluntary Donors' : 'Registered Donors'}</span>
          <div className="bb-metric-val">{donors.length} Donors</div>
          <span className="bb-metric-sub">Voluntary & Replacement community</span>
        </div>
      </div>

      {/* Blood Group Availability Matrix */}
      <div>
        <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#1e293b', marginBottom: '12px' }}>
          {isPatient ? 'Live Hospital Blood Stock Reserve' : 'Live Stock Availability by Blood Group (All Components)'}
        </h3>
        <div className="bb-matrix-grid">
          {BLOOD_GROUPS.map(grp => {
            const count = stock.filter(b => b.bloodGroup === grp && b.status === 'Available').length;
            const isLow = count === 0;
            const isNormal = count >= 2;
            const isPatientGroup = isPatient && grp === patientBloodGroup;
            return (
              <div key={grp} className={`bb-group-card ${isLow ? 'critical' : ''}`} style={isPatientGroup ? { border: '2px solid #dc2626', background: '#fff5f5' } : {}}>
                <div className="bb-group-badge">{grp} {isPatientGroup && <span style={{ fontSize: '10px', display: 'block' }}>(Yours)</span>}</div>
                <div className="bb-group-units">{count} <span style={{ fontSize: '11px', fontWeight: 'normal', color: '#64748b' }}>Units</span></div>
                <span className={`bb-group-status ${isLow ? 'bb-status-critical' : isNormal ? 'bb-status-normal' : 'bb-status-low'}`}>
                  {isLow ? 'Critical / Zero' : isNormal ? 'Normal Stock' : 'Low Reserve'}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="bb-subtabs">
        {isPatient ? (
          <>
            <button 
              className={`bb-tab-item ${activeSubTab === 'patient_pledge' ? 'active' : ''}`}
              onClick={() => setActiveSubTab('patient_pledge')}
            >
              Voluntary Donation & Health File
            </button>
            <button 
              className={`bb-tab-item ${activeSubTab === 'inventory' ? 'active' : ''}`}
              onClick={() => setActiveSubTab('inventory')}
            >
              Hospital Blood Inventory Status
              <span className="bb-tab-badge">{stock.filter(b => b.status === 'Available').length}</span>
            </button>
            <button 
              className={`bb-tab-item ${activeSubTab === 'donors' ? 'active' : ''}`}
              onClick={() => setActiveSubTab('donors')}
            >
              Donor Honor Roll & History
              <span className="bb-tab-badge">{donors.length}</span>
            </button>
          </>
        ) : (
          <>
            <button 
              className={`bb-tab-item ${activeSubTab === 'inventory' ? 'active' : ''}`}
              onClick={() => setActiveSubTab('inventory')}
            >
              Blood Stock & Component Registry
              <span className="bb-tab-badge">{stock.filter(b => b.status === 'Available').length}</span>
            </button>
            <button 
              className={`bb-tab-item ${activeSubTab === 'crossmatch' ? 'active' : ''}`}
              onClick={() => setActiveSubTab('crossmatch')}
            >
              Cross-Match & Transfusion Orders
              <span className="bb-tab-badge">{transfusions.length}</span>
            </button>
            <button 
              className={`bb-tab-item ${activeSubTab === 'donors' ? 'active' : ''}`}
              onClick={() => setActiveSubTab('donors')}
            >
              Donor Registry & History
              <span className="bb-tab-badge">{donors.length}</span>
            </button>
            <button 
              className={`bb-tab-item ${activeSubTab === 'wastage' ? 'active' : ''}`}
              onClick={() => setActiveSubTab('wastage')}
            >
              Shelf-Life Expiry & Wastage Audit
              <span className="bb-tab-badge">{discardedUnits.length}</span>
            </button>
          </>
        )}
      </div>

      {/* Tab: Patient Voluntary Donation Hub */}
      {isPatient && activeSubTab === 'patient_pledge' && (
        <div className="bb-table-card" style={{ padding: '24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
            {/* Left Card: 1-Click Voluntary Donation Action */}
            <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                <div style={{ width: '36px', height: '36px', background: '#fee2e2', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#dc2626', fontWeight: 'bold' }}>
                  +
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '16px', color: '#0f172a' }}>Voluntary Blood Donation</h3>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>No manual registration needed — your profile is linked</span>
                </div>
              </div>

              <div style={{ background: '#ffffff', padding: '14px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '16px', fontSize: '13px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '6px', borderBottom: '1px solid #f1f5f9' }}>
                  <span style={{ color: '#64748b' }}>Registered Donor Name:</span>
                  <strong>{patientFullName}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f1f5f9' }}>
                  <span style={{ color: '#64748b' }}>Patient UHID:</span>
                  <strong>{patientUHID}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f1f5f9' }}>
                  <span style={{ color: '#64748b' }}>Blood Group:</span>
                  <strong style={{ color: '#dc2626' }}>{patientBloodGroup}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '6px' }}>
                  <span style={{ color: '#64748b' }}>Contact Phone:</span>
                  <strong>{resolvedPatient?.phone || 'On Record'}</strong>
                </div>
              </div>

              <p style={{ fontSize: '13px', color: '#475569', lineHeight: '1.5', margin: '0 0 16px 0' }}>
                As an active registered patient, you can give blood voluntarily directly to the hospital blood bank. Each donation can save up to three lives.
              </p>

              <button 
                className="bb-btn bb-btn-primary" 
                style={{ width: '100%', justifyContent: 'center', padding: '12px' }}
                onClick={() => setShowPatientDonateModal(true)}
              >
                + Pledge & Donate Blood Now
              </button>
            </div>

            {/* Right Card: Donation History & Badges */}
            <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', color: '#0f172a' }}>
                My Voluntary Donation History
              </h3>

              {patientDonations.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px 16px', background: '#ffffff', borderRadius: '8px', border: '1px dashed #cbd5e1' }}>
                  <div style={{ color: '#94a3b8', fontSize: '14px', fontWeight: '500' }}>No previous donations recorded under this profile</div>
                  <p style={{ fontSize: '12.5px', color: '#64748b', margin: '6px 0 0 0' }}>Click "Pledge & Donate Blood Now" to make your first voluntary donation.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {patientDonations.map((d, i) => (
                    <div key={i} style={{ background: '#ffffff', padding: '14px', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: '13.5px', fontWeight: '700', color: '#0f172a' }}>Donation Record #{d.donorId}</div>
                        <div style={{ fontSize: '12px', color: '#64748b' }}>Date: {d.lastDonatedDate || 'Today'} • Group: {d.bloodGroup}</div>
                        <div style={{ fontSize: '11.5px', color: '#15803d', fontWeight: '600', marginTop: '2px' }}>{d.eligibilityStatus}</div>
                      </div>
                      <span style={{ background: '#dcfce7', color: '#15803d', fontSize: '12px', fontWeight: 'bold', padding: '4px 10px', borderRadius: '12px' }}>
                        Unit Archived
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Guidelines Box */}
              <div style={{ marginTop: '16px', background: '#eff6ff', padding: '12px', borderRadius: '8px', border: '1px solid #bfdbfe' }}>
                <div style={{ fontSize: '12.5px', fontWeight: '700', color: '#1e40af', marginBottom: '4px' }}>
                  Voluntary Donor Guidelines:
                </div>
                <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '12px', color: '#1e3a8a', lineHeight: '1.5' }}>
                  <li>Age between 18 and 65 years.</li>
                  <li>Minimum body weight of 50 kg and Hb &ge; 12.5 g/dL.</li>
                  <li>Gap of at least 90 days between donations.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 1: Blood Inventory */}
      {activeSubTab === 'inventory' && (
        <div className="bb-table-card">
          <div className="bb-filter-row">
            <input 
              type="text" 
              placeholder="Search by Bag ID, Donor, or Component..." 
              className="bb-search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <select className="bb-select-filter" value={groupFilter} onChange={e => setGroupFilter(e.target.value)}>
                <option value="All">All Blood Groups</option>
                {BLOOD_GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
              </select>

              <select className="bb-select-filter" value={componentFilter} onChange={e => setComponentFilter(e.target.value)}>
                <option value="All">All Components</option>
                {COMPONENT_TYPES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>

              <select className="bb-select-filter" value={stockStatusFilter} onChange={e => setStockStatusFilter(e.target.value)}>
                <option value="All">All Statuses</option>
                <option value="Available">Available</option>
                <option value="Cross-Matched">Cross-Matched / Reserved</option>
                <option value="Transfused">Transfused</option>
                <option value="Discarded">Discarded</option>
              </select>
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="bb-table">
              <thead>
                <tr>
                  <th>Bag Number</th>
                  <th>Blood Group</th>
                  <th>Component</th>
                  <th>Volume</th>
                  <th>Storage Location</th>
                  <th>Collected / Expiry</th>
                  <th>Days Left</th>
                  <th>Screening Status</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredStock.length === 0 ? (
                  <tr>
                    <td colSpan="10" style={{ textAlign: 'center', padding: '32px', color: '#94a3b8' }}>
                      No blood bags match the current inventory filters.
                    </td>
                  </tr>
                ) : (
                  filteredStock.map(b => {
                    const daysLeft = getDaysToExpiry(b.expiryDate);
                    const isExp = daysLeft <= 0;
                    const isNearExp = daysLeft <= 3 && daysLeft > 0;

                    return (
                      <tr key={b.bagNumber}>
                        <td><strong style={{ color: '#dc2626' }}>{b.bagNumber}</strong></td>
                        <td>
                          <span style={{ fontSize: '14px', fontWeight: '800', background: '#fee2e2', color: '#dc2626', padding: '3px 8px', borderRadius: '4px' }}>
                            {b.bloodGroup}
                          </span>
                        </td>
                        <td>
                          <strong>{b.component}</strong>
                          <div style={{ fontSize: '11px', color: '#64748b' }}>Code: {b.componentCode}</div>
                        </td>
                        <td>{b.volumeMl} mL</td>
                        <td><span style={{ fontSize: '11.5px', color: '#475569' }}>{b.storageLocation}</span></td>
                        <td>
                          <div style={{ fontSize: '12px' }}>Col: {b.collectedDate}</div>
                          <div style={{ fontSize: '12px', fontWeight: '600', color: isExp ? '#dc2626' : '#1e293b' }}>Exp: {b.expiryDate}</div>
                        </td>
                        <td>
                          {b.status === 'Discarded' ? (
                            <span style={{ color: '#94a3b8' }}>Discarded</span>
                          ) : b.status === 'Transfused' ? (
                            <span style={{ color: '#15803d' }}>Transfused</span>
                          ) : isExp ? (
                            <span className="bb-expiry-badge bb-expiry-danger">Expired</span>
                          ) : isNearExp ? (
                            <span className="bb-expiry-badge bb-expiry-danger">{daysLeft} Days (Critical)</span>
                          ) : daysLeft <= 7 ? (
                            <span className="bb-expiry-badge bb-expiry-warning">{daysLeft} Days</span>
                          ) : (
                            <span className="bb-expiry-badge bb-expiry-good">{daysLeft} Days</span>
                          )}
                        </td>
                        <td>
                          <span style={{ fontSize: '11px', color: '#15803d', background: '#dcfce7', padding: '2px 6px', borderRadius: '4px' }}>
                            Verified Negative
                          </span>
                        </td>
                        <td>
                          <span className={`bb-badge ${
                            b.status === 'Available' ? 'bb-badge-available' :
                            b.status === 'Cross-Matched' ? 'bb-badge-crossmatched' :
                            b.status === 'Transfused' ? 'bb-badge-transfused' : 'bb-badge-discarded'
                          }`}>
                            {b.status}
                          </span>
                        </td>
                        <td>
                          {isPatient ? (
                            <span style={{ fontSize: '11px', color: '#15803d', fontWeight: '600' }}>
                              Safe & Verified
                            </span>
                          ) : (
                            <>
                              {b.status === 'Available' && (
                                <button 
                                  className="bb-btn bb-btn-danger" 
                                  style={{ padding: '4px 8px', fontSize: '11px' }}
                                  onClick={() => {
                                    setSelectedBagForDiscard(b);
                                    setDiscardReasonInput(isExp ? 'Shelf-life expired' : 'Temperature deviation or damaged port');
                                  }}
                                >
                                  Discard
                                </button>
                              )}
                              {b.status === 'Cross-Matched' && (
                                <span style={{ fontSize: '11px', color: '#6d28d9', fontWeight: 'bold' }}>
                                  Reserved: {b.reservedForPatientName}
                                </span>
                              )}
                            </>
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
      )}

      {/* Tab 2: Cross-Match & Transfusions */}
      {activeSubTab === 'crossmatch' && (
        <div className="bb-table-card">
          <div className="bb-filter-row">
            <h3 style={{ margin: 0, fontSize: '15px', color: '#0f172a' }}>
              Bedside & Surgical Transfusion Requests
            </h3>
            <button className="bb-btn bb-btn-danger" onClick={() => setShowTransfusionReqModal(true)}>
              + New Transfusion Order
            </button>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="bb-table">
              <thead>
                <tr>
                  <th>Request ID</th>
                  <th>Patient Name & ID</th>
                  <th>Patient Blood Group</th>
                  <th>Ward / Location</th>
                  <th>Required Component</th>
                  <th>Urgency</th>
                  <th>Assigned Bag</th>
                  <th>Cross-Match Status</th>
                  <th>Transfusion Status</th>
                  <th>Clinical Action</th>
                </tr>
              </thead>
              <tbody>
                {transfusions.map(req => (
                  <tr key={req.requestId}>
                    <td><strong style={{ color: '#4338ca' }}>{req.requestId}</strong></td>
                    <td>
                      <strong>{req.patientName}</strong>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>UHID: {req.patientId}</div>
                    </td>
                    <td>
                      <span style={{ fontSize: '13px', fontWeight: '800', background: '#fee2e2', color: '#dc2626', padding: '3px 8px', borderRadius: '4px' }}>
                        {req.patientBloodGroup}
                      </span>
                    </td>
                    <td>{req.recipientWard}</td>
                    <td>
                      <strong>{req.requiredComponent}</strong>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>Indication: {req.clinicalIndication}</div>
                    </td>
                    <td>
                      <span style={{
                        fontSize: '11px',
                        fontWeight: '700',
                        color: req.urgencyLevel.includes('Emergency') ? '#dc2626' : '#3b82f6',
                        background: req.urgencyLevel.includes('Emergency') ? '#fee2e2' : '#eff6ff',
                        padding: '2px 6px',
                        borderRadius: '4px'
                      }}>
                        {req.urgencyLevel}
                      </span>
                    </td>
                    <td>
                      {req.assignedBagNumber ? (
                        <strong style={{ color: '#0f172a' }}>{req.assignedBagNumber}</strong>
                      ) : (
                        <span style={{ color: '#94a3b8' }}>Unassigned</span>
                      )}
                    </td>
                    <td>
                      <span style={{
                        fontSize: '11.5px',
                        color: req.crossMatchStatus.includes('Compatible') ? '#15803d' : '#b45309',
                        fontWeight: '600'
                      }}>
                        {req.crossMatchStatus}
                      </span>
                    </td>
                    <td>
                      <span className={`bb-badge ${
                        req.transfusionStatus === 'Transfusion Completed' ? 'bb-badge-available' :
                        req.transfusionStatus === 'Issued & In Progress' ? 'bb-badge-crossmatched' : 'bb-badge-discarded'
                      }`}>
                        {req.transfusionStatus}
                      </span>
                    </td>
                    <td>
                      {req.transfusionStatus === 'Requested' && (
                        <button 
                          className="bb-btn bb-btn-primary" 
                          style={{ padding: '5px 10px', fontSize: '11.5px' }}
                          onClick={() => setSelectedTransfusionForIssue(req)}
                        >
                          Execute Cross-Match
                        </button>
                      )}
                      {req.transfusionStatus === 'Issued & In Progress' && (
                        <button 
                          className="bb-btn bb-btn-success" 
                          style={{ padding: '5px 10px', fontSize: '11.5px' }}
                          onClick={() => handleCompleteTransfusion(req.requestId)}
                        >
                          Mark Completed
                        </button>
                      )}
                      {req.transfusionStatus === 'Transfusion Completed' && (
                        <span style={{ fontSize: '12px', color: '#15803d', fontWeight: 'bold' }}>
                          Verified & Closed
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Donor Registry */}
      {activeSubTab === 'donors' && (
        <div className="bb-table-card">
          <div className="bb-filter-row">
            <h3 style={{ margin: 0, fontSize: '15px', color: '#0f172a' }}>
              Voluntary Blood Donors Roster
            </h3>
            <button className="bb-btn bb-btn-secondary" onClick={() => setShowAddDonorModal(true)}>
              + Register New Donor
            </button>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="bb-table">
              <thead>
                <tr>
                  <th>Donor ID</th>
                  <th>Donor Full Name</th>
                  <th>Blood Group</th>
                  <th>Age / Gender</th>
                  <th>Contact Phone & Email</th>
                  <th>Weight / Hb</th>
                  <th>Last Donated</th>
                  <th>Eligibility Status</th>
                  <th>Total Donations</th>
                </tr>
              </thead>
              <tbody>
                {donors.map(d => (
                  <tr key={d.donorId}>
                    <td><strong>{d.donorId}</strong></td>
                    <td><strong>{d.name}</strong><div style={{ fontSize: '11px', color: '#64748b' }}>{d.address}</div></td>
                    <td>
                      <span style={{ fontSize: '13px', fontWeight: '800', background: '#fee2e2', color: '#dc2626', padding: '3px 8px', borderRadius: '4px' }}>
                        {d.bloodGroup}
                      </span>
                    </td>
                    <td>{d.age} Yrs / {d.gender}</td>
                    <td>
                      <div>{d.phone}</div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>{d.email}</div>
                    </td>
                    <td>{d.weightKg} kg / <strong>{d.hemoglobinGdl} g/dL</strong></td>
                    <td>{d.lastDonatedDate || 'N/A'}</td>
                    <td>
                      <span style={{ fontSize: '11.5px', color: '#15803d', fontWeight: '600' }}>
                        {d.eligibilityStatus}
                      </span>
                    </td>
                    <td><strong>{d.totalDonations || 1}</strong></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Shelf-Life Expiry & Wastage Audit */}
      {activeSubTab === 'wastage' && (
        <div className="bb-table-card">
          <div className="bb-filter-row">
            <div>
              <h3 style={{ margin: 0, fontSize: '15px', color: '#0f172a' }}>
                Shelf-Life Expiry & Biological Wastage Audit Trail
              </h3>
              <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#64748b' }}>
                Regulatory compliance log of discarded units, root causes, and quality audits.
              </p>
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="bb-table">
              <thead>
                <tr>
                  <th>Bag Number</th>
                  <th>Blood Group</th>
                  <th>Component</th>
                  <th>Collected Date</th>
                  <th>Expiry Date</th>
                  <th>Reason for Disposal</th>
                  <th>Audit Status</th>
                </tr>
              </thead>
              <tbody>
                {discardedUnits.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '32px', color: '#94a3b8' }}>
                      Zero biological wastage reported. All blood components utilized within shelf-life parameters.
                    </td>
                  </tr>
                ) : (
                  discardedUnits.map(d => (
                    <tr key={d.bagNumber}>
                      <td><strong style={{ color: '#b91c1c' }}>{d.bagNumber}</strong></td>
                      <td>
                        <span style={{ fontSize: '13px', fontWeight: '800', background: '#fee2e2', color: '#dc2626', padding: '3px 8px', borderRadius: '4px' }}>
                          {d.bloodGroup}
                        </span>
                      </td>
                      <td>{d.component}</td>
                      <td>{d.collectedDate}</td>
                      <td><span style={{ color: '#b91c1c', fontWeight: '600' }}>{d.expiryDate}</span></td>
                      <td><strong>{d.discardReason || 'Expired beyond permissible shelf-life'}</strong></td>
                      <td>
                        <span style={{ fontSize: '11px', background: '#fee2e2', color: '#991b1b', padding: '3px 8px', borderRadius: '4px', fontWeight: 'bold' }}>
                          Disposed per Bio-Medical Waste Standards
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: Register Blood Bag */}
      {showAddBagModal && (
        <div className="bb-modal-overlay">
          <div className="bb-modal">
            <div className="bb-modal-header">
              <h3>Register New Blood Bag to Storage Registry</h3>
              <button className="bb-modal-close" onClick={() => setShowAddBagModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleAddBloodBag}>
              <div className="bb-modal-body">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div className="bb-form-group">
                    <label>Blood Group</label>
                    <select 
                      value={newBagForm.bloodGroup} 
                      onChange={e => setNewBagForm({ ...newBagForm, bloodGroup: e.target.value })}
                    >
                      {BLOOD_GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                  </div>

                  <div className="bb-form-group">
                    <label>Component Type</label>
                    <select 
                      value={newBagForm.componentCode} 
                      onChange={e => setNewBagForm({ ...newBagForm, componentCode: e.target.value })}
                    >
                      {COMPONENT_TYPES.map(c => <option key={c.id} value={c.id}>{c.name} ({c.shelfLifeDays} days shelf-life)</option>)}
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div className="bb-form-group">
                    <label>Volume (mL)</label>
                    <input 
                      type="number" 
                      required 
                      value={newBagForm.volumeMl} 
                      onChange={e => setNewBagForm({ ...newBagForm, volumeMl: e.target.value })}
                    />
                  </div>

                  <div className="bb-form-group">
                    <label>Collection Date</label>
                    <input 
                      type="date" 
                      required 
                      value={newBagForm.collectedDate} 
                      onChange={e => setNewBagForm({ ...newBagForm, collectedDate: e.target.value })}
                    />
                  </div>
                </div>

                <div className="bb-form-group">
                  <label>Storage Unit & Shelf</label>
                  <input 
                    type="text" 
                    required 
                    value={newBagForm.storageLocation} 
                    onChange={e => setNewBagForm({ ...newBagForm, storageLocation: e.target.value })}
                  />
                </div>

                <div className="bb-form-group">
                  <label>Infectious Disease / Serology Screening Result</label>
                  <input 
                    type="text" 
                    required 
                    value={newBagForm.serologyScreening} 
                    onChange={e => setNewBagForm({ ...newBagForm, serologyScreening: e.target.value })}
                  />
                </div>
              </div>

              <div className="bb-modal-footer">
                <button type="button" className="bb-btn bb-btn-secondary" onClick={() => setShowAddBagModal(false)}>Cancel</button>
                <button type="submit" className="bb-btn bb-btn-primary">Confirm & Add Unit</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Register Donor */}
      {showAddDonorModal && (
        <div className="bb-modal-overlay">
          <div className="bb-modal">
            <div className="bb-modal-header">
              <h3>Register Voluntary Blood Donor</h3>
              <button className="bb-modal-close" onClick={() => setShowAddDonorModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleAddDonor}>
              <div className="bb-modal-body">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div className="bb-form-group">
                    <label>Donor Full Name</label>
                    <input 
                      type="text" 
                      required 
                      placeholder="e.g. Suresh Kumar"
                      value={newDonorForm.name} 
                      onChange={e => setNewDonorForm({ ...newDonorForm, name: e.target.value })}
                    />
                  </div>

                  <div className="bb-form-group">
                    <label>Blood Group</label>
                    <select 
                      value={newDonorForm.bloodGroup} 
                      onChange={e => setNewDonorForm({ ...newDonorForm, bloodGroup: e.target.value })}
                    >
                      {BLOOD_GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px' }}>
                  <div className="bb-form-group">
                    <label>Age (18-65 Yrs)</label>
                    <input 
                      type="number" 
                      min="18" 
                      max="65" 
                      required 
                      value={newDonorForm.age} 
                      onChange={e => setNewDonorForm({ ...newDonorForm, age: e.target.value })}
                    />
                  </div>

                  <div className="bb-form-group">
                    <label>Weight (&ge;50 kg)</label>
                    <input 
                      type="number" 
                      min="45" 
                      required 
                      value={newDonorForm.weightKg} 
                      onChange={e => setNewDonorForm({ ...newDonorForm, weightKg: e.target.value })}
                    />
                  </div>

                  <div className="bb-form-group">
                    <label>Hemoglobin (&ge;12.5 g/dL)</label>
                    <input 
                      type="number" 
                      step="0.1" 
                      required 
                      value={newDonorForm.hemoglobinGdl} 
                      onChange={e => setNewDonorForm({ ...newDonorForm, hemoglobinGdl: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div className="bb-form-group">
                    <label>Contact Phone</label>
                    <input 
                      type="text" 
                      required 
                      placeholder="+91 98765 43210"
                      value={newDonorForm.phone} 
                      onChange={e => setNewDonorForm({ ...newDonorForm, phone: e.target.value })}
                    />
                  </div>

                  <div className="bb-form-group">
                    <label>Email Address</label>
                    <input 
                      type="email" 
                      placeholder="donor@example.com"
                      value={newDonorForm.email} 
                      onChange={e => setNewDonorForm({ ...newDonorForm, email: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="bb-modal-footer">
                <button type="button" className="bb-btn bb-btn-secondary" onClick={() => setShowAddDonorModal(false)}>Cancel</button>
                <button type="submit" className="bb-btn bb-btn-primary">Register & Collect Unit</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Request Transfusion Requisition */}
      {showTransfusionReqModal && (
        <div className="bb-modal-overlay">
          <div className="bb-modal">
            <div className="bb-modal-header">
              <h3>Create Transfusion Requisition Order</h3>
              <button className="bb-modal-close" onClick={() => setShowTransfusionReqModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleCreateTransfusionRequest}>
              <div className="bb-modal-body">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div className="bb-form-group">
                    <label>Patient ID / UHID</label>
                    <input 
                      type="text" 
                      required 
                      value={newTransfusionForm.patientId} 
                      onChange={e => setNewTransfusionForm({ ...newTransfusionForm, patientId: e.target.value })}
                    />
                  </div>

                  <div className="bb-form-group">
                    <label>Patient Full Name</label>
                    <input 
                      type="text" 
                      required 
                      value={newTransfusionForm.patientName} 
                      onChange={e => setNewTransfusionForm({ ...newTransfusionForm, patientName: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px' }}>
                  <div className="bb-form-group">
                    <label>Patient Blood Group</label>
                    <select 
                      value={newTransfusionForm.patientBloodGroup} 
                      onChange={e => setNewTransfusionForm({ ...newTransfusionForm, patientBloodGroup: e.target.value })}
                    >
                      {BLOOD_GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                  </div>

                  <div className="bb-form-group">
                    <label>Component Required</label>
                    <select 
                      value={newTransfusionForm.componentCode} 
                      onChange={e => setNewTransfusionForm({ ...newTransfusionForm, componentCode: e.target.value })}
                    >
                      {COMPONENT_TYPES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>

                  <div className="bb-form-group">
                    <label>Urgency Level</label>
                    <select 
                      value={newTransfusionForm.urgencyLevel} 
                      onChange={e => setNewTransfusionForm({ ...newTransfusionForm, urgencyLevel: e.target.value })}
                    >
                      <option value="Routine (Within 4-6 hours)">Routine (Within 4-6 hours)</option>
                      <option value="Urgent (Within 1-2 hours)">Urgent (Within 1-2 hours)</option>
                      <option value="Emergency (Stat / Immediate)">Emergency (Stat / Immediate)</option>
                    </select>
                  </div>
                </div>

                <div className="bb-form-group">
                  <label>Recipient Ward / Bed Location</label>
                  <input 
                    type="text" 
                    required 
                    value={newTransfusionForm.recipientWard} 
                    onChange={e => setNewTransfusionForm({ ...newTransfusionForm, recipientWard: e.target.value })}
                  />
                </div>

                <div className="bb-form-group">
                  <label>Clinical Indication & Diagnosis</label>
                  <textarea 
                    rows="2" 
                    required 
                    value={newTransfusionForm.clinicalIndication} 
                    onChange={e => setNewTransfusionForm({ ...newTransfusionForm, clinicalIndication: e.target.value })}
                  ></textarea>
                </div>
              </div>

              <div className="bb-modal-footer">
                <button type="button" className="bb-btn bb-btn-secondary" onClick={() => setShowTransfusionReqModal(false)}>Cancel</button>
                <button type="submit" className="bb-btn bb-btn-danger">Generate Transfusion Order</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Execute Cross-Match & Validation */}
      {selectedTransfusionForIssue && (
        <div className="bb-modal-overlay">
          <div className="bb-modal" style={{ maxWidth: '720px' }}>
            <div className="bb-modal-header">
              <h3>Execute Cross-Match & Safety Validation — {selectedTransfusionForIssue.requestId}</h3>
              <button className="bb-modal-close" onClick={() => setSelectedTransfusionForIssue(null)}>&times;</button>
            </div>
            <div className="bb-modal-body">
              {/* Recipient Summary */}
              <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', fontSize: '13px' }}>
                  <div><span style={{ color: '#64748b' }}>Patient:</span> <strong>{selectedTransfusionForIssue.patientName}</strong></div>
                  <div><span style={{ color: '#64748b' }}>Blood Group:</span> <strong style={{ color: '#dc2626' }}>{selectedTransfusionForIssue.patientBloodGroup}</strong></div>
                  <div><span style={{ color: '#64748b' }}>Location:</span> <strong>{selectedTransfusionForIssue.recipientWard}</strong></div>
                  <div><span style={{ color: '#64748b' }}>Component:</span> <strong>{selectedTransfusionForIssue.componentCode}</strong></div>
                </div>
              </div>

              {/* Select Available Bag */}
              <div className="bb-form-group">
                <label>Select In-Stock Blood Bag to Cross-Match</label>
                <select 
                  id="selectedBagInput"
                  defaultValue={stock.find(b => b.status === 'Available' && validateBloodCompatibility(selectedTransfusionForIssue.patientBloodGroup, b.bloodGroup, selectedTransfusionForIssue.componentCode))?.bagNumber || ''}
                >
                  <option value="" disabled>-- Select Available Blood Unit --</option>
                  {stock.filter(b => b.status === 'Available').map(b => {
                    const isCompat = validateBloodCompatibility(selectedTransfusionForIssue.patientBloodGroup, b.bloodGroup, selectedTransfusionForIssue.componentCode);
                    return (
                      <option key={b.bagNumber} value={b.bagNumber}>
                        {b.bagNumber} • Group: {b.bloodGroup} • {b.component} • Exp: {b.expiryDate} {isCompat ? '(COMPATIBLE)' : '(INCOMPATIBLE - DO NOT USE)'}
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Mandatory 5-Point Safety Checklist */}
              <div className="bb-validation-box">
                <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#1e3a8a' }}>
                  Mandatory Transfusion Safety Protocol (NABH / JCI Standards)
                </h4>
                
                <div className="bb-checklist-item">
                  <input 
                    type="checkbox" 
                    id="chk1" 
                    checked={crossMatchChecks.patientIdentityConfirmed} 
                    onChange={e => setCrossMatchChecks({ ...crossMatchChecks, patientIdentityConfirmed: e.target.checked })}
                  />
                  <label htmlFor="chk1">Positive Patient Identification: 2 Identifiers confirmed (UHID + Full Name + Wristband)</label>
                </div>

                <div className="bb-checklist-item">
                  <input 
                    type="checkbox" 
                    id="chk2" 
                    checked={crossMatchChecks.bloodBagBarcodeScanned} 
                    onChange={e => setCrossMatchChecks({ ...crossMatchChecks, bloodBagBarcodeScanned: e.target.checked })}
                  />
                  <label htmlFor="chk2">Major & Minor Cross-Match Serological Compatibility passed with zero agglutination</label>
                </div>

                <div className="bb-checklist-item">
                  <input 
                    type="checkbox" 
                    id="chk3" 
                    checked={crossMatchChecks.expiryVerified} 
                    onChange={e => setCrossMatchChecks({ ...crossMatchChecks, expiryVerified: e.target.checked })}
                  />
                  <label htmlFor="chk3">Unit Expiry Date & Physical Integrity inspected (no hemolysis, clots, or discoloration)</label>
                </div>

                <div className="bb-checklist-item">
                  <input 
                    type="checkbox" 
                    id="chk4" 
                    checked={crossMatchChecks.doctorCrossMatchConsent} 
                    onChange={e => setCrossMatchChecks({ ...crossMatchChecks, doctorCrossMatchConsent: e.target.checked })}
                  />
                  <label htmlFor="chk4">Informed Clinical Transfusion Consent signed by Patient / Guardian</label>
                </div>

                <div className="bb-checklist-item">
                  <input 
                    type="checkbox" 
                    id="chk5" 
                    checked={crossMatchChecks.dualNurseBedsideVerification} 
                    onChange={e => setCrossMatchChecks({ ...crossMatchChecks, dualNurseBedsideVerification: e.target.checked })}
                  />
                  <label htmlFor="chk5">Dual Verification Protocol: 2 Registered Staff independent cross-check</label>
                </div>
              </div>
            </div>

            <div className="bb-modal-footer">
              <button type="button" className="bb-btn bb-btn-secondary" onClick={() => setSelectedTransfusionForIssue(null)}>Cancel</button>
              <button 
                type="button" 
                className="bb-btn bb-btn-primary"
                onClick={() => {
                  const bagVal = document.getElementById('selectedBagInput').value;
                  handleExecuteCrossMatchAndIssue(selectedTransfusionForIssue, bagVal);
                }}
              >
                Authorize & Issue Blood Bag
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Patient Voluntary Blood Donation (Pre-filled from Health File) */}
      {showPatientDonateModal && (
        <div className="bb-modal-overlay">
          <div className="bb-modal" style={{ maxWidth: '640px' }}>
            <div className="bb-modal-header">
              <h3>Voluntary Blood Donation — Verified Patient</h3>
              <button className="bb-modal-close" onClick={() => setShowPatientDonateModal(false)}>&times;</button>
            </div>
            <form onSubmit={handlePatientVoluntaryDonation}>
              <div className="bb-modal-body">
                {/* Auto-Verified Alert */}
                <div style={{ background: '#f0fdf4', padding: '12px 16px', borderRadius: '8px', border: '1px solid #bbf7d0', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '18px' }}>✓</span>
                  <div style={{ fontSize: '13px', color: '#166534' }}>
                    <strong>Profile Auto-Linked:</strong> You are donating as an authenticated hospital patient. Your demographics, clinical history, and verified blood type are automatically retrieved.
                  </div>
                </div>

                {/* Patient Summary Card */}
                <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '16px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', fontSize: '13px' }}>
                    <div><span style={{ color: '#64748b' }}>Full Name:</span> <strong>{patientFullName}</strong></div>
                    <div><span style={{ color: '#64748b' }}>Patient UHID:</span> <strong>{patientUHID}</strong></div>
                    <div><span style={{ color: '#64748b' }}>Verified Blood Group:</span> <strong style={{ color: '#dc2626', fontSize: '14px' }}>{patientBloodGroup}</strong></div>
                    <div><span style={{ color: '#64748b' }}>Contact:</span> <strong>{resolvedPatient?.phone || 'On Record'}</strong></div>
                  </div>
                </div>

                {/* Clinical Check Fields */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div className="bb-form-group">
                    <label>Current Weight (kg) [Min 50 kg]</label>
                    <input 
                      type="number" 
                      min="45" 
                      max="200" 
                      required 
                      value={patientPledgeForm.weightKg} 
                      onChange={e => setPatientPledgeForm({ ...patientPledgeForm, weightKg: e.target.value })}
                    />
                  </div>

                  <div className="bb-form-group">
                    <label>Latest Hemoglobin (g/dL) [Min 12.5]</label>
                    <input 
                      type="number" 
                      step="0.1" 
                      min="10" 
                      max="20" 
                      required 
                      value={patientPledgeForm.hemoglobinGdl} 
                      onChange={e => setPatientPledgeForm({ ...patientPledgeForm, hemoglobinGdl: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div className="bb-form-group">
                    <label>Preferred Donation Date</label>
                    <input 
                      type="date" 
                      required 
                      value={patientPledgeForm.preferredDate} 
                      onChange={e => setPatientPledgeForm({ ...patientPledgeForm, preferredDate: e.target.value })}
                    />
                  </div>

                  <div className="bb-form-group">
                    <label>Time Slot</label>
                    <select 
                      value={patientPledgeForm.preferredSlot} 
                      onChange={e => setPatientPledgeForm({ ...patientPledgeForm, preferredSlot: e.target.value })}
                    >
                      <option value="Morning (09:00 AM - 12:00 PM)">Morning (09:00 AM - 12:00 PM)</option>
                      <option value="Afternoon (12:00 PM - 03:00 PM)">Afternoon (12:00 PM - 03:00 PM)</option>
                      <option value="Evening (03:00 PM - 06:00 PM)">Evening (03:00 PM - 06:00 PM)</option>
                    </select>
                  </div>
                </div>

                <div className="bb-form-group">
                  <label>Self-Declaration & Consent</label>
                  <div style={{ fontSize: '12px', color: '#475569', background: '#f1f5f9', padding: '10px', borderRadius: '6px', lineHeight: '1.4' }}>
                    I confirm that I am voluntarily donating blood to the hospital blood bank. I declare that I am feeling healthy today, am not under medication that contraindicates blood donation, and have not had a tattoo or major surgery in the last 6 months.
                  </div>
                </div>
              </div>

              <div className="bb-modal-footer">
                <button type="button" className="bb-btn bb-btn-secondary" onClick={() => setShowPatientDonateModal(false)}>Cancel</button>
                <button type="submit" className="bb-btn bb-btn-primary">Confirm & Donate Blood Unit</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Discard Bag */}
      {selectedBagForDiscard && (
        <div className="bb-modal-overlay">
          <div className="bb-modal" style={{ maxWidth: '480px' }}>
            <div className="bb-modal-header">
              <h3>Discard Blood Unit — {selectedBagForDiscard.bagNumber}</h3>
              <button className="bb-modal-close" onClick={() => setSelectedBagForDiscard(null)}>&times;</button>
            </div>
            <form onSubmit={handleDiscardBag}>
              <div className="bb-modal-body">
                <p style={{ margin: 0, fontSize: '13.5px', color: '#475569' }}>
                  Are you sure you want to discard <strong>{selectedBagForDiscard.bagNumber}</strong> ({selectedBagForDiscard.bloodGroup} {selectedBagForDiscard.component})?
                </p>

                <div className="bb-form-group" style={{ marginTop: '12px' }}>
                  <label>Reason for Biological Disposal</label>
                  <select 
                    value={discardReasonInput} 
                    onChange={e => setDiscardReasonInput(e.target.value)}
                  >
                    <option value="Shelf-life expired">Shelf-life expired</option>
                    <option value="Storage temperature excursion">Storage temperature excursion</option>
                    <option value="Hemolysis observed">Hemolysis observed</option>
                    <option value="Port damage or seal compromised">Port damage or seal compromised</option>
                    <option value="Serology test re-verification">Serology test re-verification</option>
                  </select>
                </div>
              </div>

              <div className="bb-modal-footer">
                <button type="button" className="bb-btn bb-btn-secondary" onClick={() => setSelectedBagForDiscard(null)}>Cancel</button>
                <button type="submit" className="bb-btn bb-btn-danger">Confirm Disposal</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
