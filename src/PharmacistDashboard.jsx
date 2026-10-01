import React, { useState, useEffect } from 'react';
import './PharmacistDashboard.css';

export default function PharmacistDashboard({ onLogout, loggedInStaff }) {
  const [activeTab, setActiveTab] = useState('overview');
  
  // Local storage states
  const [medications, setMedications] = useState(() => {
    const list = JSON.parse(localStorage.getItem('dhms_medications') || '[]');
    if (list.length > 0) {
      // Ensure existing meds have a shelf location assigned if missing
      let modified = false;
      const shelfMap = {
        'MED-101': 'Shelf A-1 (Antibiotics Bay)',
        'MED-102': 'Shelf B-2 (Cardio Rack)',
        'MED-103': 'Shelf B-3 (Cardio Rack)',
        'MED-104': 'Shelf C-1 (Pain & Anti-Inflammatory)',
        'MED-105': 'Shelf C-2 (Analgesics Bay)',
        'MED-106': 'Emergency Tray #1 (Cold / Quick Access)',
        'MED-107': 'Emergency Tray #2 (Cardiac Tray)',
        'MED-108': 'Emergency Tray #3 (Tox / Antidote Cabinet)'
      };
      const enriched = list.map((m, idx) => {
        if (!m.shelfLocation) {
          modified = true;
          return {
            ...m,
            shelfLocation: shelfMap[m.id] || `Shelf ${String.fromCharCode(65 + (idx % 6))}-${(idx % 4) + 1}`
          };
        }
        return m;
      });
      if (modified) {
        localStorage.setItem('dhms_medications', JSON.stringify(enriched));
      }
      return enriched;
    }
    const defaultMeds = [
      { id: "MED-101", name: "Amoxicillin 500mg", genericName: "Amoxicillin Trihydrate", category: "Antibiotics", stock: 150, price: 18.00, shelfLocation: "Shelf A-1 (Antibiotics Bay)", isEmergency: false, lowStockThreshold: 20 },
      { id: "MED-102", name: "Lisinopril 10mg", genericName: "Lisinopril", category: "Cardiovascular", stock: 120, price: 15.00, shelfLocation: "Shelf B-2 (Cardio Rack)", isEmergency: false, lowStockThreshold: 20 },
      { id: "MED-103", name: "Metoprolol 25mg", genericName: "Metoprolol Succinate", category: "Cardiovascular", stock: 95, price: 20.00, shelfLocation: "Shelf B-3 (Cardio Rack)", isEmergency: false, lowStockThreshold: 15 },
      { id: "MED-104", name: "Ibuprofen 400mg", genericName: "Ibuprofen", category: "NSAIDs", stock: 180, price: 6.50, shelfLocation: "Shelf C-1 (Pain & Anti-Inflammatory)", isEmergency: false, lowStockThreshold: 25 },
      { id: "MED-105", name: "Paracetamol 500mg", genericName: "Acetaminophen", category: "Analgesics", stock: 300, price: 3.00, shelfLocation: "Shelf C-2 (Analgesics Bay)", isEmergency: true, lowStockThreshold: 50 },
      { id: "MED-106", name: "Epinephrine 1mg/mL", genericName: "Epinephrine", category: "Anaphylaxis / Cardiac", stock: 60, price: 40.00, shelfLocation: "Emergency Tray #1 (Cold / Quick Access)", isEmergency: true, lowStockThreshold: 15 },
      { id: "MED-107", name: "Adenosine 6mg/2mL", genericName: "Adenosine", category: "Antiarrhythmic", stock: 40, price: 65.00, shelfLocation: "Emergency Tray #2 (Cardiac Tray)", isEmergency: true, lowStockThreshold: 10 },
      { id: "MED-108", name: "Naloxone 0.4mg/mL", genericName: "Naloxone", category: "Opioid Antagonist", stock: 50, price: 35.00, shelfLocation: "Emergency Tray #3 (Tox / Antidote Cabinet)", isEmergency: true, lowStockThreshold: 15 }
    ];
    localStorage.setItem('dhms_medications', JSON.stringify(defaultMeds));
    return defaultMeds;
  });
  const [staff, setStaff] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [admissions, setAdmissions] = useState([]);

  // Form states
  const [newMed, setNewMed] = useState({
    name: '',
    genericName: '',
    category: 'Antibiotics',
    stock: 50,
    price: 10.00,
    shelfLocation: 'Shelf A-1',
    isEmergency: false,
    lowStockThreshold: 15
  });

  // Outsider / Walk-in Sale States
  const [outsiderSearch, setOutsiderSearch] = useState('');
  const [outsiderCategory, setOutsiderCategory] = useState('All');
  const [outsiderCart, setOutsiderCart] = useState([]); // [{ medId, name, genericName, shelfLocation, unitPrice, qty, total }]
  const [outsiderBuyerName, setOutsiderBuyerName] = useState('');
  const [outsiderBuyerPhone, setOutsiderBuyerPhone] = useState('');
  const [outsiderPaymentMode, setOutsiderPaymentMode] = useState('Physical Cash Payment'); // 'Physical Cash Payment' | 'Online UPI / QR Payment' | 'Card / POS Payment'
  const [outsiderPaymentRemarks, setOutsiderPaymentRemarks] = useState('');
  const [outsiderReceipt, setOutsiderReceipt] = useState(null); // Receipt modal data

  const [attendanceForm, setAttendanceForm] = useState({
    staffId: '',
    status: 'Present',
    checkIn: '09:00 AM',
    checkOut: '05:00 PM',
    date: new Date().toISOString().split('T')[0]
  });

  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffRole, setNewStaffRole] = useState('Assistant Pharmacist');
  const [newStaffEmail, setNewStaffEmail] = useState('');
  const [newStaffPhone, setNewStaffPhone] = useState('');

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [showEmergencyOnly, setShowEmergencyOnly] = useState(false);
  const [selectedMedForStock, setSelectedMedForStock] = useState(null);
  const [stockToUpdate, setStockToUpdate] = useState(0);

  // Dispensing sub-filter & search
  const [dispenseFilter, setDispenseFilter] = useState('All');
  const [dispenseSearch, setDispenseSearch] = useState('');

  // Load from LocalStorage on mount and listen for storage updates
  useEffect(() => {
    const loadFromStorage = () => {
      setMedications(JSON.parse(localStorage.getItem('dhms_medications') || '[]'));
      setStaff(JSON.parse(localStorage.getItem('dhms_pharmacy_staff') || '[]'));
      setAttendance(JSON.parse(localStorage.getItem('dhms_pharmacy_attendance') || '[]'));
      setPrescriptions(JSON.parse(localStorage.getItem('dhms_prescriptions') || '[]'));
      setAdmissions(JSON.parse(localStorage.getItem('dhms_admissions') || '[]'));
    };
    loadFromStorage();
    window.addEventListener('storage', loadFromStorage);
    return () => window.removeEventListener('storage', loadFromStorage);
  }, []);

  // Sync helpers
  const saveMedications = (updated) => {
    setMedications(updated);
    localStorage.setItem('dhms_medications', JSON.stringify(updated));
    if (window.dispatchEvent) {
      window.dispatchEvent(new Event('storage'));
    }
  };

  const saveAttendance = (updated) => {
    setAttendance(updated);
    localStorage.setItem('dhms_pharmacy_attendance', JSON.stringify(updated));

    // Also sync to dhms_master_attendance
    const allAtt = JSON.parse(localStorage.getItem('dhms_master_attendance') || '[]');
    let currentMaster = [...allAtt];

    updated.forEach(log => {
      const newRecord = {
        id: `ATT-${Math.floor(1000 + Math.random() * 9000)}`,
        date: log.date,
        module: 'Pharmacist',
        staffId: log.staffId,
        staffName: log.name,
        role: 'Pharmacist Specialist',
        checkIn: log.status === 'Absent' || log.status === 'On Leave' ? '-' : log.checkIn,
        checkOut: log.status === 'Absent' || log.status === 'On Leave' ? '-' : log.checkOut,
        status: log.status,
        remarks: 'Pharmacy Counter Shift'
      };
      const idx = currentMaster.findIndex(a => a.date === newRecord.date && a.staffId === newRecord.staffId);
      if (idx >= 0) {
        currentMaster[idx] = { ...currentMaster[idx], ...newRecord };
      } else {
        currentMaster.unshift(newRecord);
      }
    });

    localStorage.setItem('dhms_master_attendance', JSON.stringify(currentMaster));
  };

  const savePrescriptions = (updated) => {
    setPrescriptions(updated);
    localStorage.setItem('dhms_prescriptions', JSON.stringify(updated));
  };

  const saveAdmissions = (updated) => {
    setAdmissions(updated);
    localStorage.setItem('dhms_admissions', JSON.stringify(updated));
  };

  // Outsider Cart Helpers
  const handleAddToCart = (med) => {
    if (med.stock <= 0) {
      alert(`Cannot add ${med.name} - Stock is depleted (0 left).`);
      return;
    }
    const existing = outsiderCart.find(item => item.medId === med.id);
    if (existing) {
      if (existing.qty >= med.stock) {
        alert(`Cannot add more. Only ${med.stock} units available in inventory for ${med.name}.`);
        return;
      }
      setOutsiderCart(outsiderCart.map(item => 
        item.medId === med.id 
          ? { ...item, qty: item.qty + 1, total: (item.qty + 1) * item.unitPrice }
          : item
      ));
    } else {
      setOutsiderCart([...outsiderCart, {
        medId: med.id,
        name: med.name,
        genericName: med.genericName,
        shelfLocation: med.shelfLocation || 'Main Pharmacy Rack',
        unitPrice: parseFloat(med.price) || 0,
        qty: 1,
        total: parseFloat(med.price) || 0
      }]);
    }
  };

  const handleUpdateCartQty = (medId, newQty) => {
    const med = medications.find(m => m.id === medId);
    const parsedQty = parseInt(newQty) || 0;
    if (parsedQty <= 0) {
      setOutsiderCart(outsiderCart.filter(item => item.medId !== medId));
      return;
    }
    if (med && parsedQty > med.stock) {
      alert(`Max available stock for ${med.name} is ${med.stock} units.`);
      setOutsiderCart(outsiderCart.map(item => 
        item.medId === medId 
          ? { ...item, qty: med.stock, total: med.stock * item.unitPrice }
          : item
      ));
      return;
    }
    setOutsiderCart(outsiderCart.map(item => 
      item.medId === medId 
        ? { ...item, qty: parsedQty, total: parsedQty * item.unitPrice }
        : item
    ));
  };

  const handleRemoveFromCart = (medId) => {
    setOutsiderCart(outsiderCart.filter(item => item.medId !== medId));
  };

  const calculateCartTotal = () => {
    return outsiderCart.reduce((sum, item) => sum + item.total, 0);
  };

  // Outsider Checkout & Bill Sync
  const handleOutsiderCheckout = (e) => {
    e.preventDefault();
    if (outsiderCart.length === 0) {
      alert("Cart is empty! Please select at least one medication.");
      return;
    }

    const buyerName = outsiderBuyerName.trim() || 'Walk-in Visitor';
    const buyerPhone = outsiderBuyerPhone.trim() || 'N/A';
    const grandTotal = calculateCartTotal();
    const invoiceId = `INV-OUT-${Math.floor(1000 + Math.random() * 9000)}`;
    const today = new Date().toISOString().split('T')[0];
    const timestamp = new Date().toLocaleString();

    // 1. Deduct Medication Stocks
    let stockError = null;
    const updatedMeds = medications.map(m => {
      const cartItem = outsiderCart.find(ci => ci.medId === m.id);
      if (cartItem) {
        if (m.stock < cartItem.qty) {
          stockError = `Insufficient stock for ${m.name}. Available: ${m.stock}, Requested: ${cartItem.qty}`;
        }
        return { ...m, stock: Math.max(0, m.stock - cartItem.qty) };
      }
      return m;
    });

    if (stockError) {
      alert(stockError);
      return;
    }

    saveMedications(updatedMeds);

    // 2. Add Invoice to Central Billing (dhms_billing) for Cash Counter overview & Admin analytics
    const billing = JSON.parse(localStorage.getItem('dhms_billing') || '[]');
    const medNamesSummary = outsiderCart.map(i => `${i.name} (x${i.qty})`).join(', ');

    const newInvoice = {
      id: invoiceId,
      patientId: `WALK-${Math.floor(100 + Math.random() * 900)}`,
      patientName: `${buyerName} (Outsider/Visitor)`,
      phone: buyerPhone,
      date: today,
      paymentDate: today,
      amount: `₹${grandTotal.toFixed(2)}`,
      status: 'Paid',
      paymentMethod: outsiderPaymentMode,
      paymentRemarks: outsiderPaymentRemarks.trim() || `Walk-in Pharmacy Counter Sale. Dispensed by ${loggedInStaff?.name || 'Pharmacist'}.`,
      type: `Pharmacy Walk-In Sale: ${medNamesSummary}`,
      items: outsiderCart.map(i => ({
        id: i.medId,
        name: i.name,
        qty: i.qty,
        unitPrice: i.unitPrice,
        shelfLocation: i.shelfLocation,
        total: i.total
      })),
      soldBy: loggedInStaff?.name || 'Pharmacist Specialist'
    };

    localStorage.setItem('dhms_billing', JSON.stringify([newInvoice, ...billing]));

    if (window.dispatchEvent) {
      window.dispatchEvent(new Event('storage'));
    }

    // 3. Set Receipt for Instant Print/Preview Modal
    setOutsiderReceipt({
      invoiceId,
      date: today,
      time: timestamp,
      buyerName,
      buyerPhone,
      items: [...outsiderCart],
      grandTotal,
      paymentMode: outsiderPaymentMode,
      soldBy: loggedInStaff?.name || 'Pharmacist Specialist'
    });

    // Reset Form
    setOutsiderCart([]);
    setOutsiderBuyerName('');
    setOutsiderBuyerPhone('');
    setOutsiderPaymentRemarks('');
    setOutsiderPaymentMode('Physical Cash Payment');
  };

  // 1. Attendance actions
  const handleMarkAttendance = (e) => {
    e.preventDefault();
    if (!attendanceForm.staffId) return;

    const staffMember = staff.find(s => s.id === attendanceForm.staffId);
    if (!staffMember) return;

    const chosenDate = attendanceForm.date || new Date().toISOString().split('T')[0];

    // Check if already checked in on this date
    const alreadyLoggedIndex = attendance.findIndex(a => a.date === chosenDate && a.staffId === staffMember.id);
    const log = {
      date: chosenDate,
      staffId: staffMember.id,
      name: staffMember.name,
      checkIn: attendanceForm.checkIn,
      checkOut: attendanceForm.checkOut,
      status: attendanceForm.status
    };

    let updatedAttendance;
    if (alreadyLoggedIndex >= 0) {
      updatedAttendance = [...attendance];
      updatedAttendance[alreadyLoggedIndex] = log;
    } else {
      updatedAttendance = [log, ...attendance];
    }

    saveAttendance(updatedAttendance);
    alert(`Attendance logged successfully for ${staffMember.name}!`);
  };

  const handleRegisterStaff = (e) => {
    e.preventDefault();
    if (!newStaffName.trim()) return;

    // Indian Mobile Number validation (optionally starting with +91, 91, or 0, followed by 10 digits)
    const indianPhoneRegex = /^(?:\+91|91|0)?[6-9]\d{9}$/;
    if (!newStaffPhone.trim() || !indianPhoneRegex.test(newStaffPhone.trim().replace(/[\s\-]/g, ''))) {
      alert("Please enter a valid 10-digit Indian phone number.");
      return;
    }

    const newMember = {
      id: `PHR-${Math.floor(1000 + Math.random() * 9000)}`,
      name: newStaffName.trim(),
      role: newStaffRole,
      email: newStaffEmail.trim() || `${newStaffName.toLowerCase().replace(/\s+/g, '')}@dhms.org`,
      phone: newStaffPhone.trim(),
      status: 'Active',
      joinedDate: new Date().toISOString().split('T')[0]
    };

    const currentStaff = JSON.parse(localStorage.getItem('dhms_pharmacy_staff') || '[]');
    const updated = [newMember, ...currentStaff];
    localStorage.setItem('dhms_pharmacy_staff', JSON.stringify(updated));
    setStaff(updated);

    setNewStaffName('');
    setNewStaffRole('Assistant Pharmacist');
    setNewStaffEmail('');
    setNewStaffPhone('');

    alert(`${newMember.name} has been registered as Pharmacy Staff successfully!`);
  };

  // 2. Medication / Stock actions
  const handleAddMedication = (e) => {
    e.preventDefault();
    if (!newMed.name || !newMed.genericName) return;

    const newEntry = {
      ...newMed,
      id: `MED-${Math.floor(100 + Math.random() * 900)}`,
      shelfLocation: newMed.shelfLocation?.trim() || 'Shelf A-1 (Main Bay)',
      stock: parseInt(newMed.stock) || 0,
      price: parseFloat(newMed.price) || 0.00,
      lowStockThreshold: parseInt(newMed.lowStockThreshold) || 10
    };

    const updated = [...medications, newEntry];
    saveMedications(updated);
    setNewMed({
      name: '',
      genericName: '',
      category: 'Antibiotics',
      stock: 50,
      price: 10.00,
      shelfLocation: 'Shelf A-1',
      isEmergency: false,
      lowStockThreshold: 15
    });
    alert(`${newEntry.name} added to inventory at [${newEntry.shelfLocation}]!`);
  };

  const handleUpdateStock = (e) => {
    e.preventDefault();
    if (!selectedMedForStock) return;

    const updated = medications.map(med => {
      if (med.id === selectedMedForStock.id) {
        return { ...med, stock: med.stock + parseInt(stockToUpdate) };
      }
      return med;
    });

    saveMedications(updated);
    setSelectedMedForStock(null);
    setStockToUpdate(0);
  };

  const toggleEmergency = (medId) => {
    const updated = medications.map(med => {
      if (med.id === medId) {
        return { ...med, isEmergency: !med.isEmergency };
      }
      return med;
    });
    saveMedications(updated);
  };

  // 3. Dispense actions
  const handleDispense = (rx) => {
    // Check if medication name exists in inventory to deduct stock
    // Since rx.medication contains name and dosage e.g. "Amoxicillin 500mg (Once Daily (QD), 7 Days)"
    // We will do a fuzzy match with medication list names
    let matchedMed = medications.find(m => rx.medication.toLowerCase().includes(m.name.toLowerCase()) || rx.medication.toLowerCase().includes(m.genericName.toLowerCase()));

    if (matchedMed) {
      if (matchedMed.stock <= 0) {
        alert(`Error: Stock depleted for ${matchedMed.name}. Please restock before dispensing.`);
        return;
      }

      // Deduct 1 pack/vial/dose from stock
      const updatedMeds = medications.map(m => {
        if (m.id === matchedMed.id) {
          return { ...m, stock: m.stock - 1 };
        }
        return m;
      });
      saveMedications(updatedMeds);
    }

    // Update prescription status
    const updatedRx = prescriptions.map(r => {
      if (r.id === rx.id) {
        return { ...r, status: 'Dispensed & Billed' };
      }
      return r;
    });
    savePrescriptions(updatedRx);

    // If it's inpatient, we add it to the patient's admission medications billing
    if (rx.type === 'Inpatient') {
      const updatedAdmissions = admissions.map(adm => {
        if (adm.patientId === rx.patientId && adm.status === 'Admitted') {
          const medList = adm.medications || [];
          const exists = medList.findIndex(m => m.name === rx.medication || rx.medication.includes(m.name));
          let newMedList;
          if (exists >= 0) {
            newMedList = [...medList];
            newMedList[exists] = { ...newMedList[exists], status: 'Dispensed' };
          } else {
            newMedList = [...medList, {
              name: rx.medication,
              instructions: rx.instructions,
              cost: parseFloat(rx.cost) || 0.00,
              status: 'Dispensed',
              date: new Date().toISOString().split('T')[0]
            }];
          }
          return { ...adm, medications: newMedList };
        }
        return adm;
      });
      saveAdmissions(updatedAdmissions);
    } else {
      // Outpatient: Check for Patient Insurance Coverage
      const policies = JSON.parse(localStorage.getItem('dhms_insurance_policies') || '[]');
      const patientPolicy = policies.find(p => p.patientId === rx.patientId && p.status === 'Active');
      const billing = JSON.parse(localStorage.getItem('dhms_billing') || '[]');
      const totalMedCost = parseFloat(rx.cost) || 0.00;
      const newInvoiceId = `INV-${Math.floor(1000 + Math.random() * 9000)}`;

      if (patientPolicy) {
        // Calculate Co-Pay and TPA Claim portion
        const coPayPercent = patientPolicy.coPay || 0;
        const coPayAmount = (totalMedCost * (coPayPercent / 100));
        const claimedAmount = totalMedCost - coPayAmount;

        // 1. Submit Claim to TPA Inbox
        const claims = JSON.parse(localStorage.getItem('dhms_insurance_claims') || '[]');
        const newClaim = {
          id: `CLM-${Math.floor(1000 + Math.random() * 9000)}`,
          patientId: rx.patientId,
          patientName: rx.patientName,
          invoiceId: newInvoiceId,
          provider: patientPolicy.provider,
          policyNo: patientPolicy.policyNo,
          amount: `₹${totalMedCost.toFixed(2)}`,
          coPayAmount: `₹${coPayAmount.toFixed(2)}`,
          claimedAmount: `₹${claimedAmount.toFixed(2)}`,
          diagnosis: `Outpatient Pharmacy: ${rx.medication}`,
          date: new Date().toISOString().split('T')[0],
          status: 'Pending',
          remarks: `Prescription dispensed by Pharmacy. Co-pay ${coPayPercent}% (₹${coPayAmount.toFixed(2)}) routed to Cash Counter.`
        };
        localStorage.setItem('dhms_insurance_claims', JSON.stringify([newClaim, ...claims]));

        // 2. Add Invoice to Central Billing for Co-Pay collection
        const newInvoice = {
          id: newInvoiceId,
          patientId: rx.patientId,
          patientName: rx.patientName,
          date: new Date().toISOString().split('T')[0],
          amount: `₹${totalMedCost.toFixed(2)}`,
          coPayAmount: `₹${coPayAmount.toFixed(2)}`,
          claimedAmount: `₹${claimedAmount.toFixed(2)}`,
          status: coPayAmount > 0 ? 'Unpaid' : 'Covered by Insurance',
          paymentMethod: 'Insurance / TPA Claim',
          type: `Pharmacy Prescription (Insured: ${patientPolicy.provider} - CoPay ${coPayPercent}%)`
        };
        localStorage.setItem('dhms_billing', JSON.stringify([newInvoice, ...billing]));
      } else {
        // Standard uninsured patient bill
        const newInvoice = {
          id: newInvoiceId,
          patientId: rx.patientId,
          patientName: rx.patientName,
          date: new Date().toISOString().split('T')[0],
          amount: `₹${totalMedCost.toFixed(2)}`,
          status: 'Unpaid',
          type: 'Pharmacy Prescription'
        };
        localStorage.setItem('dhms_billing', JSON.stringify([newInvoice, ...billing]));
      }

      if (window.dispatchEvent) {
        window.dispatchEvent(new Event('storage'));
      }
    }

    alert(`Successfully dispensed ${rx.medication} for ${rx.patientName}! Billing and claim details synchronized.`);
  };

  // 4. Inpatient Billing / Discharge
  const calculatePharmacyBill = (adm) => {
    if (!adm.medications) return 0;
    return adm.medications
      .filter(m => m.status === 'Dispensed')
      .reduce((sum, m) => sum + (parseFloat(m.cost) || 0), 0);
  };

  const handleDownloadInvoice = (adm) => {
    const totalBill = calculatePharmacyBill(adm);
    const invoiceText = `
=========================================
      DHMS HOSPITAL PHARMACY INVOICE
=========================================
Invoice ID: INV-${adm.id.replace('ADM-', '')}
Admission ID: ${adm.id}
Patient Name: ${adm.patientName} (ID: ${adm.patientId})
Admitting Doctor: ${adm.doctorName}
Ward/Room: ${adm.ward}
Admission Date: ${adm.admissionDate}
Discharge Date: ${adm.dischargeDate || 'N/A'}
Status: ${adm.status}
Pharmacy Bill Paid: ${adm.pharmacyBillPaid ? 'YES' : 'NO'}
-----------------------------------------
MEDICATIONS DISPENSED:
${(adm.medications || []).map((m, i) => `${i + 1}. ${m.name}
   - Instructions: ${m.instructions || 'N/A'}
   - Date: ${m.date}
   - Cost: ₹${parseFloat(m.cost).toFixed(2)} (${m.status})`).join('\n')}
-----------------------------------------
TOTAL PHARMACY BILL: ₹${totalBill.toFixed(2)}
=========================================
Generated on: ${new Date().toLocaleString()}
Thank you for using DHMS Hospital.
`;

    const element = document.createElement("a");
    const file = new Blob([invoiceText], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = `DHMS_Invoice_${adm.id}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleDischargeAndPay = (adm) => {
    const totalBill = calculatePharmacyBill(adm);
    const confirmPay = window.confirm(`Patient ${adm.patientName} total pharmacy bill is ₹${totalBill.toFixed(2)}. Proceed with payment and discharge?`);
    if (!confirmPay) return;

    // Update admission record
    const today = new Date().toISOString().split('T')[0];
    const updatedAdmissions = admissions.map(a => {
      if (a.id === adm.id) {
        return {
          ...a,
          status: 'Discharged',
          dischargeDate: today,
          pharmacyBillPaid: true
        };
      }
      return a;
    });
    saveAdmissions(updatedAdmissions);

    // Record billing transaction
    const billing = JSON.parse(localStorage.getItem('dhms_billing') || '[]');
    const newInvoice = {
      id: `INV-${Math.floor(1000 + Math.random() * 9000)}`,
      patientId: adm.patientId,
      patientName: adm.patientName,
      date: today,
      amount: `₹${totalBill.toFixed(2)}`,
      status: 'Paid',
      type: 'Admitted Pharmacy Bill'
    };
    localStorage.setItem('dhms_billing', JSON.stringify([newInvoice, ...billing]));

    alert(`Patient ${adm.patientName} discharged successfully and bill marked as Paid.`);
  };

  // Filters
  const filteredMedications = medications.filter(med => {
    const matchesSearch = med.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          med.genericName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'All' || med.category === categoryFilter;
    const matchesEmergency = !showEmergencyOnly || med.isEmergency;
    return matchesSearch && matchesCategory && matchesEmergency;
  });

  const lowStockCount = medications.filter(m => m.stock <= m.lowStockThreshold).length;
  const emergencyCount = medications.filter(m => m.isEmergency).length;

  return (
    <div className="pharmacy-container">
      {/* Topbar */}
      <div className="pharmacy-topbar">
        <div className="pharmacy-logo-area">
          <svg className="pharmacy-logo-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" style={{ width: '28px', height: '28px', color: '#10b981' }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="pharmacy-logo-text">DHMS</span>
          <span className="pharmacy-logo-divider">|</span>
          <span className="pharmacy-logo-sub">Pharmacy Portal</span>
        </div>
        <div className="pharmacy-topbar-right">
          <div className="pharmacy-profile-info">
            <div className="pharmacy-avatar">{(loggedInStaff?.name || 'Pharmacist')[0]}</div>
            <div className="pharmacy-user-details">
              <strong>{loggedInStaff?.name || 'Pharmacist Specialist'}</strong>
              <span>{loggedInStaff?.role || 'Clinical Operations'}</span>
            </div>
          </div>
          <button onClick={onLogout} className="pharmacy-btn-logout">
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
      <div className="pharmacy-workspace">
        {/* Sidebar Nav */}
        <div className="pharmacy-sidebar">
          <ul className="pharmacy-nav-links">
            <li className={activeTab === 'overview' ? 'active' : ''} onClick={() => setActiveTab('overview')}>
              Overview
            </li>
            <li className={activeTab === 'outsider_sales' ? 'active' : ''} onClick={() => setActiveTab('outsider_sales')}>
              Walk-in / Outsider Sale
            </li>
            <li className={activeTab === 'inventory' ? 'active' : ''} onClick={() => setActiveTab('inventory')}>
              Inventory / Stock & Shelf
            </li>
            <li className={activeTab === 'dispensing' ? 'active' : ''} onClick={() => setActiveTab('dispensing')}>
              Dispensing (OPD/IPD)
            </li>
            <li className={activeTab === 'billing' ? 'active' : ''} onClick={() => setActiveTab('billing')}>
              Admissions & Billing
            </li>
          </ul>
        </div>

        {/* Content Area */}
        <div className="pharmacy-content-area">
          {activeTab === 'overview' && (
            <div className="view-pane animate-fade-in">
              <h1 className="pane-title">Pharmacy Operations Center</h1>
              
              <div className="stats-grid">
                <div className="stat-card urgent">
                  <h3>Low Stock Warning</h3>
                  <p className="value">{lowStockCount}</p>
                  <span>Medications below safety threshold</span>
                </div>
                <div className="stat-card emergency">
                  <h3>Emergency Drugs</h3>
                  <p className="value">{emergencyCount}</p>
                  <span>Critical care medications in inventory</span>
                </div>
                <div className="stat-card info">
                  <h3>Pending Prescriptions</h3>
                  <p className="value">{prescriptions.filter(r => r.status === 'Pending' || r.status === 'Advised').length}</p>
                  <span>Outpatient Rx & Inpatient Advise</span>
                </div>
                <div className="stat-card success">
                  <h3>Active Inpatient Admissions</h3>
                  <p className="value">{admissions.filter(a => a.status === 'Admitted').length}</p>
                  <span>Admitted patients receiving pharmacy billing</span>
                </div>
              </div>

              {/* Quick Emergency Drugs Monitor */}
              <div className="section-card" style={{ marginTop: '24px' }}>
                <h2>Critical Emergency Drug Watchlist</h2>
                <p className="section-desc">Quick monitor for life-saving drugs. Immediate restocking required for items in red.</p>
                <div className="quick-emergency-grid">
                  {medications.filter(m => m.isEmergency).map(med => (
                    <div key={med.id} className={`emergency-pill ${med.stock <= med.lowStockThreshold ? 'danger' : 'safe'}`}>
                      <div className="pill-header">
                        <strong>{med.name}</strong>
                        <span className="stock-badge">{med.stock} Units Left</span>
                      </div>
                      <div className="pill-body">
                        <span>Generic: {med.genericName}</span>
                        <span>Min Threshold: {med.lowStockThreshold}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'attendance' && (
            <div className="view-pane animate-fade-in">
              <h1 className="pane-title">Staff Attendance System</h1>
              
              <div className="grid-split">
                <div className="section-card">
                  <h2>Mark Shift Attendance</h2>
                  <form onSubmit={handleMarkAttendance} className="custom-form">
                    <div className="form-group">
                      <label>Select Pharmacy Staff Member</label>
                      <select 
                        value={attendanceForm.staffId} 
                        onChange={(e) => setAttendanceForm({...attendanceForm, staffId: e.target.value})}
                        required
                      >
                        <option value="">-- Choose Member --</option>
                        {staff.map(s => (
                          <option key={s.id} value={s.id}>{s.name} ({s.role})</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Shift Date</label>
                      <input 
                        type="date" 
                        value={attendanceForm.date} 
                        onChange={(e) => setAttendanceForm({...attendanceForm, date: e.target.value})}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>Shift Status</label>
                      <select 
                        value={attendanceForm.status} 
                        onChange={(e) => setAttendanceForm({...attendanceForm, status: e.target.value})}
                      >
                        <option value="Present">Present</option>
                        <option value="Late">Late</option>
                        <option value="On Leave">On Leave</option>
                        <option value="Absent">Absent</option>
                      </select>
                    </div>

                    <div className="grid-2col">
                      <div className="form-group">
                        <label>Check In Time</label>
                        <input 
                          type="text" 
                          value={attendanceForm.checkIn} 
                          onChange={(e) => setAttendanceForm({...attendanceForm, checkIn: e.target.value})}
                        />
                      </div>
                      <div className="form-group">
                        <label>Check Out Time</label>
                        <input 
                          type="text" 
                          value={attendanceForm.checkOut} 
                          onChange={(e) => setAttendanceForm({...attendanceForm, checkOut: e.target.value})}
                        />
                      </div>
                    </div>

                    <button type="submit" className="btn-primary">Log Shift Details</button>
                  </form>
                </div>

                <div className="section-card" style={{ marginTop: '20px' }}>
                  <h2>Register Left-Out Pharmacy Staff</h2>
                  <form onSubmit={handleRegisterStaff} className="custom-form">
                    <div className="form-group">
                      <label>Staff Name *</label>
                      <input 
                        type="text" 
                        required 
                        placeholder="Enter full name" 
                        value={newStaffName} 
                        onChange={(e) => setNewStaffName(e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label>Designation / Role</label>
                      <select 
                        value={newStaffRole} 
                        onChange={(e) => setNewStaffRole(e.target.value)}
                      >
                        <option value="Assistant Pharmacist">Assistant Pharmacist</option>
                        <option value="Senior Pharmacist">Senior Pharmacist</option>
                        <option value="Pharmacy Trainee">Pharmacy Trainee</option>
                        <option value="Inventory Helper">Inventory Helper</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Email Address</label>
                      <input 
                        type="email" 
                        placeholder="Enter email address (optional)" 
                        value={newStaffEmail} 
                        onChange={(e) => setNewStaffEmail(e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label>Phone Number *</label>
                      <input 
                        type="text" 
                        required
                        placeholder="Enter 10-digit phone number" 
                        value={newStaffPhone} 
                        onChange={(e) => setNewStaffPhone(e.target.value)}
                      />
                    </div>
                    <button type="submit" className="btn-primary" style={{ backgroundColor: '#10b981' }}>Register Staff Member</button>
                  </form>
                </div>

                <div className="section-card">
                  <h2>Attendance Logs</h2>
                  <div className="table-wrapper">
                    <table className="dashboard-table">
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Name</th>
                          <th>Status</th>
                          <th>Check In</th>
                          <th>Check Out</th>
                        </tr>
                      </thead>
                      <tbody>
                        {attendance.map((log, idx) => (
                          <tr key={idx}>
                            <td>{log.date}</td>
                            <td><strong>{log.name}</strong></td>
                            <td>
                              <span className={`status-badge ${
                                log.status === 'Present' ? 'available' :
                                log.status === 'Late' ? 'surgery' : 'leave'
                              }`}>
                                {log.status}
                              </span>
                            </td>
                            <td>{log.checkIn}</td>
                            <td>{log.checkOut}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Outsider / Walk-in Medicine Sale Tab */}
          {activeTab === 'outsider_sales' && (
            <div className="view-pane animate-fade-in">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div>
                  <h1 className="pane-title" style={{ margin: 0 }}>Walk-In / Outsider Medicine Sale Counter</h1>
                  <p style={{ color: '#64748b', fontSize: '14px', margin: '4px 0 0 0' }}>
                    Quick counter POS for visitors and outsiders purchasing medicines. Instantly locate shelf rack, accept Online/Offline payment, and auto-sync with Central Cash Counter & Finance.
                  </p>
                </div>
                <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', padding: '8px 16px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '18px' }}>⚡</span>
                  <span style={{ fontSize: '13px', fontWeight: '600', color: '#065f46' }}>Real-Time Shelf Locator & Cash Counter Sync Active</span>
                </div>
              </div>

              <div className="grid-split-3-1" style={{ gap: '24px' }}>
                {/* Left: Medication Catalogue & Shelf Search */}
                <div className="section-card" style={{ flex: 1.8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
                    <h2 style={{ margin: 0, fontSize: '17px' }}>1. Find Medication & Storage Shelf</h2>
                    <span style={{ fontSize: '13px', color: '#64748b' }}>
                      Showing {medications.filter(m => {
                        const q = outsiderSearch.toLowerCase();
                        const matchQ = m.name.toLowerCase().includes(q) || m.genericName.toLowerCase().includes(q) || (m.shelfLocation || '').toLowerCase().includes(q) || m.category.toLowerCase().includes(q);
                        const matchC = outsiderCategory === 'All' || m.category === outsiderCategory;
                        return matchQ && matchC;
                      }).length} of {medications.length} items
                    </span>
                  </div>

                  {/* Search and Filters */}
                  <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: '240px', position: 'relative' }}>
                      <input 
                        type="text" 
                        placeholder="🔍 Search medicine, generic chemical, or shelf number (e.g. Shelf A-1, Paracetamol, Cardio)..." 
                        value={outsiderSearch}
                        onChange={(e) => setOutsiderSearch(e.target.value)}
                        style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '14px', boxSizing: 'border-box' }}
                      />
                    </div>
                    <select 
                      value={outsiderCategory} 
                      onChange={(e) => setOutsiderCategory(e.target.value)}
                      style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', background: 'white', fontSize: '14px', outline: 'none' }}
                    >
                      <option value="All">All Categories</option>
                      <option value="Antibiotics">Antibiotics</option>
                      <option value="Cardiovascular">Cardiovascular</option>
                      <option value="NSAIDs">NSAIDs</option>
                      <option value="Analgesics">Analgesics</option>
                      <option value="Anaphylaxis / Cardiac">Anaphylaxis / Cardiac</option>
                      <option value="Antiarrhythmic">Antiarrhythmic</option>
                      <option value="Opioid Antagonist">Opioid Antagonist</option>
                    </select>
                  </div>

                  {/* Medication Table with Shelf Highlight */}
                  <div className="table-wrapper" style={{ maxHeight: '520px', overflowY: 'auto' }}>
                    <table className="dashboard-table">
                      <thead>
                        <tr>
                          <th>Medication & Formula</th>
                          <th>Category</th>
                          <th>Exact Shelf / Storage Location</th>
                          <th>Price / Unit</th>
                          <th>Stock Available</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {medications
                          .filter(med => {
                            const q = outsiderSearch.toLowerCase();
                            const matchQ = med.name.toLowerCase().includes(q) || 
                                           med.genericName.toLowerCase().includes(q) || 
                                           (med.shelfLocation || '').toLowerCase().includes(q) || 
                                           med.category.toLowerCase().includes(q);
                            const matchC = outsiderCategory === 'All' || med.category === outsiderCategory;
                            return matchQ && matchC;
                          })
                          .map(med => {
                            const inCartItem = outsiderCart.find(ci => ci.medId === med.id);
                            return (
                              <tr key={med.id} style={{ background: inCartItem ? '#f0fdf4' : 'transparent' }}>
                                <td>
                                  <div style={{ fontWeight: '700', color: '#0f172a', fontSize: '14px' }}>{med.name}</div>
                                  <div style={{ fontSize: '12px', color: '#64748b' }}>Generic: {med.genericName}</div>
                                  <span style={{ fontSize: '11px', color: '#94a3b8' }}>Code: {med.id}</span>
                                </td>
                                <td>
                                  <span style={{ fontSize: '12px', background: '#f1f5f9', padding: '3px 8px', borderRadius: '6px', color: '#475569' }}>
                                    {med.category}
                                  </span>
                                </td>
                                <td>
                                  <div style={{ 
                                    display: 'inline-flex', 
                                    alignItems: 'center', 
                                    gap: '6px', 
                                    background: '#eff6ff', 
                                    border: '1px solid #bfdbfe', 
                                    color: '#1d4ed8', 
                                    padding: '4px 10px', 
                                    borderRadius: '6px', 
                                    fontWeight: '700', 
                                    fontSize: '12px' 
                                  }}>
                                    <span>📍</span>
                                    <span>{med.shelfLocation || 'Shelf A-1 (General Bay)'}</span>
                                  </div>
                                </td>
                                <td>
                                  <strong style={{ fontSize: '14px', color: '#047857' }}>₹{parseFloat(med.price).toFixed(2)}</strong>
                                </td>
                                <td>
                                  <span style={{ 
                                    fontWeight: '700', 
                                    color: med.stock <= 0 ? '#ef4444' : med.stock <= med.lowStockThreshold ? '#f59e0b' : '#10b981',
                                    fontSize: '13px'
                                  }}>
                                    {med.stock} Units
                                  </span>
                                  {med.stock <= 0 && <span style={{ display: 'block', fontSize: '11px', color: '#ef4444', fontWeight: 'bold' }}>Out of Stock</span>}
                                </td>
                                <td>
                                  <button 
                                    type="button"
                                    onClick={() => handleAddToCart(med)}
                                    disabled={med.stock <= 0}
                                    style={{
                                      padding: '6px 12px',
                                      background: med.stock <= 0 ? '#cbd5e1' : inCartItem ? '#10b981' : '#2563eb',
                                      color: 'white',
                                      border: 'none',
                                      borderRadius: '6px',
                                      cursor: med.stock <= 0 ? 'not-allowed' : 'pointer',
                                      fontSize: '12px',
                                      fontWeight: '600',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '4px'
                                    }}
                                  >
                                    {inCartItem ? `✓ Added (x${inCartItem.qty})` : '+ Add to Sale'}
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        {medications.filter(med => {
                          const q = outsiderSearch.toLowerCase();
                          const matchQ = med.name.toLowerCase().includes(q) || med.genericName.toLowerCase().includes(q) || (med.shelfLocation || '').toLowerCase().includes(q) || med.category.toLowerCase().includes(q);
                          const matchC = outsiderCategory === 'All' || med.category === outsiderCategory;
                          return matchQ && matchC;
                        }).length === 0 && (
                          <tr>
                            <td colSpan="6" style={{ textAlign: 'center', padding: '32px', color: '#64748b' }}>
                              No matching medications or shelf locations found for "{outsiderSearch}".
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Right: Visitor Billing & Instant POS Checkout */}
                <div className="section-card" style={{ flex: 1.2, display: 'flex', flexDirection: 'column' }}>
                  <h2 style={{ margin: '0 0 16px 0', fontSize: '17px', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px' }}>
                    2. Visitor Bill & Checkout
                  </h2>

                  {/* Selected Cart Items */}
                  <div style={{ flex: 1, maxHeight: '240px', overflowY: 'auto', marginBottom: '16px', border: '1px solid #f1f5f9', borderRadius: '8px', padding: '8px', background: '#fafafa' }}>
                    {outsiderCart.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '32px 16px', color: '#94a3b8' }}>
                        <div style={{ fontSize: '32px', marginBottom: '8px' }}>🛒</div>
                        <p style={{ margin: 0, fontSize: '13px' }}>Cart is empty. Search and add medications from the left table.</p>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {outsiderCart.map((item) => (
                          <div key={item.medId} style={{ background: 'white', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ flex: 1 }}>
                              <strong style={{ fontSize: '13px', color: '#0f172a', display: 'block' }}>{item.name}</strong>
                              <span style={{ fontSize: '11px', color: '#2563eb' }}>📍 {item.shelfLocation}</span>
                              <div style={{ fontSize: '12px', color: '#64748b' }}>₹{item.unitPrice.toFixed(2)} each</div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <input 
                                type="number" 
                                min="1" 
                                value={item.qty} 
                                onChange={(e) => handleUpdateCartQty(item.medId, e.target.value)}
                                style={{ width: '50px', padding: '4px 6px', textAlign: 'center', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                              />
                              <strong style={{ fontSize: '13px', color: '#047857', minWidth: '60px', textAlign: 'right' }}>
                                ₹{item.total.toFixed(2)}
                              </strong>
                              <button 
                                type="button" 
                                onClick={() => handleRemoveFromCart(item.medId)}
                                style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '14px', padding: '2px' }}
                                title="Remove item"
                              >
                                ✕
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Grand Total Bar */}
                  <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '14px', fontWeight: '600', color: '#475569' }}>Grand Total ({outsiderCart.reduce((sum, i) => sum + i.qty, 0)} items):</span>
                    <span style={{ fontSize: '20px', fontWeight: '800', color: '#047857' }}>₹{calculateCartTotal().toFixed(2)}</span>
                  </div>

                  {/* Visitor Information & Payment Options Form */}
                  <form onSubmit={handleOutsiderCheckout} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label style={{ fontSize: '12px', fontWeight: '600', color: '#475569' }}>Visitor / Outsider Name (Optional)</label>
                      <input 
                        type="text" 
                        placeholder="e.g. Walk-in Customer / John Doe" 
                        value={outsiderBuyerName}
                        onChange={(e) => setOutsiderBuyerName(e.target.value)}
                        style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', width: '100%', boxSizing: 'border-box' }}
                      />
                    </div>

                    <div className="form-group" style={{ margin: 0 }}>
                      <label style={{ fontSize: '12px', fontWeight: '600', color: '#475569' }}>Mobile Number (for SMS / WhatsApp Receipt)</label>
                      <input 
                        type="text" 
                        placeholder="e.g. +91 98765 43210" 
                        value={outsiderBuyerPhone}
                        onChange={(e) => setOutsiderBuyerPhone(e.target.value)}
                        style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', width: '100%', boxSizing: 'border-box' }}
                      />
                    </div>

                    <div className="form-group" style={{ margin: 0 }}>
                      <label style={{ fontSize: '12px', fontWeight: '600', color: '#475569' }}>Payment Mode</label>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px', marginTop: '4px' }}>
                        <button 
                          type="button" 
                          onClick={() => setOutsiderPaymentMode('Physical Cash Payment')}
                          style={{
                            padding: '8px 4px',
                            borderRadius: '6px',
                            border: outsiderPaymentMode === 'Physical Cash Payment' ? '2px solid #10b981' : '1px solid #cbd5e1',
                            background: outsiderPaymentMode === 'Physical Cash Payment' ? '#ecfdf5' : 'white',
                            color: outsiderPaymentMode === 'Physical Cash Payment' ? '#065f46' : '#64748b',
                            fontWeight: '600',
                            fontSize: '11px',
                            cursor: 'pointer'
                          }}
                        >
                          💵 Cash (Offline)
                        </button>
                        <button 
                          type="button" 
                          onClick={() => setOutsiderPaymentMode('Online UPI / QR Payment')}
                          style={{
                            padding: '8px 4px',
                            borderRadius: '6px',
                            border: outsiderPaymentMode === 'Online UPI / QR Payment' ? '2px solid #3b82f6' : '1px solid #cbd5e1',
                            background: outsiderPaymentMode === 'Online UPI / QR Payment' ? '#eff6ff' : 'white',
                            color: outsiderPaymentMode === 'Online UPI / QR Payment' ? '#1d4ed8' : '#64748b',
                            fontWeight: '600',
                            fontSize: '11px',
                            cursor: 'pointer'
                          }}
                        >
                          📲 UPI / QR (Online)
                        </button>
                        <button 
                          type="button" 
                          onClick={() => setOutsiderPaymentMode('Card / POS Payment')}
                          style={{
                            padding: '8px 4px',
                            borderRadius: '6px',
                            border: outsiderPaymentMode === 'Card / POS Payment' ? '2px solid #8b5cf6' : '1px solid #cbd5e1',
                            background: outsiderPaymentMode === 'Card / POS Payment' ? '#f5f3ff' : 'white',
                            color: outsiderPaymentMode === 'Card / POS Payment' ? '#6d28d9' : '#64748b',
                            fontWeight: '600',
                            fontSize: '11px',
                            cursor: 'pointer'
                          }}
                        >
                          💳 Card / POS
                        </button>
                      </div>
                    </div>

                    <div className="form-group" style={{ margin: 0 }}>
                      <label style={{ fontSize: '12px', fontWeight: '600', color: '#475569' }}>Transaction Notes / Ref ID (Optional)</label>
                      <input 
                        type="text" 
                        placeholder={outsiderPaymentMode.includes('UPI') ? "e.g. UPI Ref: 8291039120" : "e.g. Counter dispense notes"} 
                        value={outsiderPaymentRemarks}
                        onChange={(e) => setOutsiderPaymentRemarks(e.target.value)}
                        style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', width: '100%', boxSizing: 'border-box' }}
                      />
                    </div>

                    <button 
                      type="submit" 
                      disabled={outsiderCart.length === 0}
                      style={{
                        marginTop: '8px',
                        padding: '12px',
                        background: outsiderCart.length === 0 ? '#94a3b8' : '#10b981',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontWeight: '700',
                        fontSize: '15px',
                        cursor: outsiderCart.length === 0 ? 'not-allowed' : 'pointer',
                        boxShadow: '0 2px 4px rgba(16, 185, 129, 0.2)'
                      }}
                    >
                      ✓ Complete Sale & Print Receipt (₹{calculateCartTotal().toFixed(2)})
                    </button>
                  </form>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'inventory' && (
            <div className="view-pane animate-fade-in">
              <h1 className="pane-title">Medication Stock & Shelf Inventory Control</h1>

              <div className="inventory-controls">
                <input 
                  type="text" 
                  placeholder="Search medication, generic chemical, or shelf..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="search-input"
                />
                
                <select 
                  value={categoryFilter} 
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="filter-select"
                >
                  <option value="All">All Categories</option>
                  <option value="Antibiotics">Antibiotics</option>
                  <option value="Cardiovascular">Cardiovascular</option>
                  <option value="NSAIDs">NSAIDs</option>
                  <option value="Analgesics">Analgesics</option>
                  <option value="Anaphylaxis / Cardiac">Anaphylaxis / Cardiac</option>
                  <option value="Antiarrhythmic">Antiarrhythmic</option>
                  <option value="Opioid Antagonist">Opioid Antagonist</option>
                </select>

                <label className="toggle-label">
                  <input 
                    type="checkbox" 
                    checked={showEmergencyOnly} 
                    onChange={(e) => setShowEmergencyOnly(e.target.checked)} 
                  />
                  Emergency Drugs Only
                </label>
              </div>

              <div className="grid-split-3-1" style={{ marginTop: '20px' }}>
                <div className="section-card">
                  <h2>Medication Inventory & Shelf Locations</h2>
                  <div className="table-wrapper">
                    <table className="dashboard-table">
                      <thead>
                        <tr>
                          <th>Code</th>
                          <th>Name</th>
                          <th>Generic Name</th>
                          <th>Shelf / Rack Location</th>
                          <th>Stock Left</th>
                          <th>Price</th>
                          <th>Emergency</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredMedications.map(med => (
                          <tr key={med.id}>
                            <td><strong>{med.id}</strong></td>
                            <td>
                              <strong>{med.name}</strong>
                              <div className="subtitle">{med.category}</div>
                            </td>
                            <td>{med.genericName}</td>
                            <td>
                              <span style={{ 
                                display: 'inline-flex', 
                                alignItems: 'center', 
                                gap: '4px', 
                                background: '#eff6ff', 
                                color: '#1d4ed8', 
                                padding: '3px 8px', 
                                borderRadius: '4px', 
                                fontSize: '11px', 
                                fontWeight: '700',
                                border: '1px solid #bfdbfe' 
                              }}>
                                📍 {med.shelfLocation || 'Shelf A-1'}
                              </span>
                            </td>
                            <td>
                              <span className={`stock-text ${med.stock <= med.lowStockThreshold ? 'alert' : ''}`}>
                                {med.stock} Units
                              </span>
                              {med.stock <= med.lowStockThreshold && <span className="warning-indicator">Low Stock</span>}
                            </td>
                            <td><strong>₹{med.price.toFixed(2)}</strong></td>
                            <td>
                              <button onClick={() => toggleEmergency(med.id)} className={`emergency-toggle ${med.isEmergency ? 'active' : ''}`}>
                                {med.isEmergency ? 'Emergency' : 'Standard'}
                              </button>
                            </td>
                            <td>
                              <button 
                                onClick={() => { setSelectedMedForStock(med); setStockToUpdate(10); }}
                                className="btn-action-restock"
                              >
                                Add Stock
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="section-card">
                  <h2>Add Medication to Shelf</h2>
                  <form onSubmit={handleAddMedication} className="custom-form">
                    <div className="form-group">
                      <label>Drug Name & Strength</label>
                      <input 
                        type="text" 
                        placeholder="e.g. Amoxicillin 500mg" 
                        value={newMed.name}
                        onChange={(e) => setNewMed({...newMed, name: e.target.value})}
                        required 
                      />
                    </div>
                    <div className="form-group">
                      <label>Generic Chemical Name</label>
                      <input 
                        type="text" 
                        placeholder="e.g. Amoxicillin" 
                        value={newMed.genericName}
                        onChange={(e) => setNewMed({...newMed, genericName: e.target.value})}
                        required 
                      />
                    </div>
                    <div className="form-group">
                      <label>Shelf / Rack Location</label>
                      <input 
                        type="text" 
                        placeholder="e.g. Shelf B-2 (Cardio Rack) or Cold Storage #1" 
                        value={newMed.shelfLocation}
                        onChange={(e) => setNewMed({...newMed, shelfLocation: e.target.value})}
                        required 
                      />
                    </div>
                    <div className="form-group">
                      <label>Category</label>
                      <select 
                        value={newMed.category} 
                        onChange={(e) => setNewMed({...newMed, category: e.target.value})}
                      >
                        <option value="Antibiotics">Antibiotics</option>
                        <option value="Cardiovascular">Cardiovascular</option>
                        <option value="NSAIDs">NSAIDs</option>
                        <option value="Analgesics">Analgesics</option>
                        <option value="Anaphylaxis / Cardiac">Anaphylaxis / Cardiac</option>
                        <option value="Antiarrhythmic">Antiarrhythmic</option>
                        <option value="Opioid Antagonist">Opioid Antagonist</option>
                      </select>
                    </div>
                    <div className="grid-2col">
                      <div className="form-group">
                        <label>Stock Count</label>
                        <input 
                          type="number" 
                          value={newMed.stock}
                          onChange={(e) => setNewMed({...newMed, stock: e.target.value})}
                        />
                      </div>
                      <div className="form-group">
                        <label>Unit Price (₹)</label>
                        <input 
                          type="number" 
                          step="0.01" 
                          value={newMed.price}
                          onChange={(e) => setNewMed({...newMed, price: e.target.value})}
                        />
                      </div>
                    </div>
                    <div className="form-group">
                      <label>Low Stock Threshold</label>
                      <input 
                        type="number" 
                        value={newMed.lowStockThreshold}
                        onChange={(e) => setNewMed({...newMed, lowStockThreshold: e.target.value})}
                      />
                    </div>
                    <div className="form-group inline">
                      <label>
                        <input 
                          type="checkbox" 
                          checked={newMed.isEmergency}
                          onChange={(e) => setNewMed({...newMed, isEmergency: e.target.checked})}
                        />
                        Is Emergency Drug
                      </label>
                    </div>

                    <button type="submit" className="btn-primary">Add to Inventory</button>
                  </form>
                </div>
              </div>

              {/* Restock dialog modal */}
              {selectedMedForStock && (
                <div className="custom-modal-overlay">
                  <div className="custom-modal">
                    <h3>Restock Medication: {selectedMedForStock.name}</h3>
                    <p style={{ fontSize: '13px', color: '#2563eb', margin: '0 0 12px 0' }}>
                      📍 Stored at: {selectedMedForStock.shelfLocation || 'Shelf A-1'}
                    </p>
                    <form onSubmit={handleUpdateStock}>
                      <div className="form-group">
                        <label>Enter Units to Add</label>
                        <input 
                          type="number" 
                          value={stockToUpdate} 
                          onChange={(e) => setStockToUpdate(e.target.value)} 
                          min="1"
                          required
                        />
                      </div>
                      <div className="modal-actions">
                        <button type="button" className="btn-secondary" onClick={() => setSelectedMedForStock(null)}>Cancel</button>
                        <button type="submit" className="btn-primary">Add Units</button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'dispensing' && (
            <div className="view-pane animate-fade-in">
              <h1 className="pane-title">Prescription Dispensing Hub</h1>
              
              <div className="section-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
                  <div>
                    <h2 style={{ margin: 0 }}>Medication Dispense Queue</h2>
                    <p className="section-desc" style={{ margin: '4px 0 0 0' }}>
                      Deliver inpatient medicines directly to wards or dispense walk-in outpatient prescriptions.
                    </p>
                  </div>

                  {/* Filter Pills */}
                  <div style={{ display: 'flex', gap: '6px', background: '#f1f5f9', padding: '4px', borderRadius: '8px' }}>
                    <button 
                      type="button" 
                      onClick={() => setDispenseFilter('All')} 
                      style={{ padding: '6px 12px', borderRadius: '6px', border: 'none', background: dispenseFilter === 'All' ? '#6366f1' : 'transparent', color: dispenseFilter === 'All' ? 'white' : '#64748b', fontWeight: '600', fontSize: '12px', cursor: 'pointer' }}
                    >
                      All Prescriptions
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setDispenseFilter('Inpatient')} 
                      style={{ padding: '6px 12px', borderRadius: '6px', border: 'none', background: dispenseFilter === 'Inpatient' ? '#0284c7' : 'transparent', color: dispenseFilter === 'Inpatient' ? 'white' : '#64748b', fontWeight: '600', fontSize: '12px', cursor: 'pointer' }}
                    >
                      🏥 Inpatient Ward Queue
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setDispenseFilter('Outpatient')} 
                      style={{ padding: '6px 12px', borderRadius: '6px', border: 'none', background: dispenseFilter === 'Outpatient' ? '#10b981' : 'transparent', color: dispenseFilter === 'Outpatient' ? 'white' : '#64748b', fontWeight: '600', fontSize: '12px', cursor: 'pointer' }}
                    >
                      🛍️ Outpatient Prescriptions
                    </button>
                  </div>
                </div>

                {/* Search Bar */}
                <div style={{ marginBottom: '16px' }}>
                  <input 
                    type="text" 
                    placeholder="🔍 Search by Patient Name, ID (e.g. PT-101), or Medication Name..." 
                    value={dispenseSearch} 
                    onChange={(e) => setDispenseSearch(e.target.value)}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                  />
                </div>
                
                <div className="table-wrapper">
                  <table className="dashboard-table">
                    <thead>
                      <tr>
                        <th>Rx Code</th>
                        <th>Patient Details</th>
                        <th>Prescribed Medication</th>
                        <th>Encounter / Ward</th>
                        <th>Prescribed By</th>
                        <th>Cost</th>
                        <th>Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {prescriptions.filter(rx => {
                        const isPending = rx.status === 'Pending' || rx.status === 'Advised' || rx.status === 'Pending Ward Delivery' || rx.status === 'Given to Patient (OPD)';
                        if (!isPending) return false;

                        if (dispenseFilter === 'Inpatient' && rx.type !== 'Inpatient') return false;
                        if (dispenseFilter === 'Outpatient' && rx.type === 'Inpatient') return false;

                        if (dispenseSearch.trim()) {
                          const q = dispenseSearch.toLowerCase();
                          const pName = (rx.patientName || '').toLowerCase();
                          const pId = (rx.patientId || '').toLowerCase();
                          const med = (rx.medication || '').toLowerCase();
                          return pName.includes(q) || pId.includes(q) || med.includes(q);
                        }

                        return true;
                      }).map(rx => (
                        <tr key={rx.id}>
                          <td><strong>{rx.id}</strong></td>
                          <td>
                            <strong>{rx.patientName}</strong>
                            <div className="subtitle">ID: {rx.patientId}</div>
                            {(() => {
                              const policies = JSON.parse(localStorage.getItem('dhms_insurance_policies') || '[]');
                              const patPol = policies.find(p => p.patientId === rx.patientId && p.status === 'Active');
                              if (patPol) {
                                return (
                                  <span style={{ display: 'inline-block', marginTop: '3px', background: '#dbeafe', color: '#1e40af', fontSize: '10.5px', fontWeight: '700', padding: '1px 6px', borderRadius: '4px' }}>
                                    🛡️ {patPol.provider} (CoPay: {patPol.coPay}%)
                                  </span>
                                );
                              }
                              return null;
                            })()}
                          </td>
                          <td>
                            <strong>{rx.medication}</strong>
                            <div className="subtitle" style={{ fontStyle: 'italic' }}>{rx.instructions || 'No specific instructions'}</div>
                          </td>
                          <td>
                            <span className={`type-badge ${rx.type === 'Inpatient' ? 'inpatient' : 'outpatient'}`}>
                              {rx.type === 'Inpatient' ? `🏥 Ward: ${rx.ward || 'General Ward A'}` : '🛍️ Outpatient'}
                            </span>
                          </td>
                          <td>{rx.doctorName}</td>
                          <td><strong>₹{parseFloat(rx.cost).toFixed(2)}</strong></td>
                          <td>
                            <span className="status-badge surgery" style={{ background: rx.type === 'Inpatient' ? '#e0f2fe' : '#fef3c7', color: rx.type === 'Inpatient' ? '#0369a1' : '#b45309' }}>
                              {rx.status}
                            </span>
                          </td>
                          <td>
                            <button 
                              onClick={() => handleDispense(rx)} 
                              className="btn-action-dispense"
                              style={{ background: rx.type === 'Inpatient' ? '#0284c7' : '#10b981' }}
                            >
                              {rx.type === 'Inpatient' ? '🚀 Send to Ward Bed' : 'Dispense OTC'}
                            </button>
                          </td>
                        </tr>
                      ))}
                      {prescriptions.filter(rx => {
                        const isPending = rx.status === 'Pending' || rx.status === 'Advised' || rx.status === 'Pending Ward Delivery' || rx.status === 'Given to Patient (OPD)';
                        if (!isPending) return false;
                        if (dispenseFilter === 'Inpatient' && rx.type !== 'Inpatient') return false;
                        if (dispenseFilter === 'Outpatient' && rx.type === 'Inpatient') return false;
                        if (dispenseSearch.trim()) {
                          const q = dispenseSearch.toLowerCase();
                          const pName = (rx.patientName || '').toLowerCase();
                          const pId = (rx.patientId || '').toLowerCase();
                          const med = (rx.medication || '').toLowerCase();
                          return pName.includes(q) || pId.includes(q) || med.includes(q);
                        }
                        return true;
                      }).length === 0 && (
                        <tr>
                          <td colSpan="8" style={{ textAlign: 'center', color: '#64748b', fontStyle: 'italic', padding: '24px' }}>
                            No pending prescriptions in this queue matching your criteria.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'billing' && (
            <div className="view-pane animate-fade-in">
              <h1 className="pane-title">Inpatient Admission Billing & Discharge</h1>
              
              <div className="section-card">
                <h2>Admitted Patients Pharmacy Bills</h2>
                <p className="section-desc">Track running pharmacy medication bills for admitted patients. Accept payment and process pharmacy discharge.</p>

                <div className="table-wrapper">
                  <table className="dashboard-table">
                    <thead>
                      <tr>
                        <th>Adm ID</th>
                        <th>Patient</th>
                        <th>Ward</th>
                        <th>Admission Date</th>
                        <th>Medications Given</th>
                        <th>Running Bill Total</th>
                        <th>Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {admissions.map(adm => (
                        <tr key={adm.id}>
                          <td><strong>{adm.id}</strong></td>
                          <td>
                            <strong>{adm.patientName}</strong>
                            <div className="subtitle">ID: {adm.patientId}</div>
                          </td>
                          <td>{adm.ward}</td>
                          <td>{adm.admissionDate}</td>
                          <td>
                            {adm.medications && adm.medications.length > 0 ? (
                              <div className="meds-list-cell">
                                {adm.medications.map((m, i) => (
                                  <span key={i} className={`med-item-pill ${m.status.toLowerCase()}`}>
                                    {m.name} ({m.status})
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="subtitle italic">No medications given yet</span>
                            )}
                          </td>
                          <td>
                            <strong style={{ fontSize: '15px', color: '#1e3a8a' }}>
                              ₹{calculatePharmacyBill(adm).toFixed(2)}
                            </strong>
                          </td>
                          <td>
                            <span className={`status-badge ${adm.status === 'Admitted' ? 'surgery' : 'available'}`}>
                              {adm.status}
                            </span>
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                              {adm.status === 'Admitted' ? (
                                <button 
                                  onClick={() => handleDischargeAndPay(adm)} 
                                  className="btn-action-discharge"
                                >
                                  Pay & Discharge
                                </button>
                              ) : (
                                <span className="completed-badge">Discharged & Paid</span>
                              )}
                              <button 
                                onClick={() => handleDownloadInvoice(adm)} 
                                className="btn-action-restock"
                                style={{ padding: '8px 12px', fontSize: '12px' }}
                              >
                                Download Invoice
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {admissions.length === 0 && (
                        <tr>
                          <td colSpan="8" style={{ textAlign: 'center', color: '#64748b', fontStyle: 'italic', padding: '20px' }}>
                            No admission records found in system.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      {/* Printable Walk-in Outsider Pharmacy Cash Receipt Modal */}
      {outsiderReceipt && (
        <div className="custom-modal-overlay" style={{ zIndex: 9999 }}>
          <div className="custom-modal" style={{ maxWidth: '540px', background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
            <div id="dhms-walkin-receipt-print" style={{ background: '#ffffff', color: '#1e293b', fontFamily: 'monospace, sans-serif' }}>
              {/* Receipt Header */}
              <div style={{ textAlign: 'center', borderBottom: '2px dashed #94a3b8', paddingBottom: '12px', marginBottom: '14px' }}>
                <div style={{ fontSize: '18px', fontWeight: '800', letterSpacing: '0.5px' }}>DHMS CENTRAL PHARMACY</div>
                <div style={{ fontSize: '12px', color: '#64748b' }}>Hospital Road, Medical City | 24x7 Dispensing Counter</div>
                <div style={{ fontSize: '11px', color: '#64748b' }}>Tax Reg / Drug Lic: DL-PHR-2026-9921</div>
                <div style={{ marginTop: '6px', display: 'inline-block', background: '#ecfdf5', color: '#065f46', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold' }}>
                  ✓ OFFICIAL SALE RECEIPT (PAID)
                </div>
              </div>

              {/* Meta details */}
              <div style={{ fontSize: '12px', lineHeight: '1.6', marginBottom: '12px', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span><strong>Receipt No:</strong> {outsiderReceipt.invoiceId}</span>
                  <span><strong>Date:</strong> {outsiderReceipt.date}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span><strong>Customer:</strong> {outsiderReceipt.buyerName}</span>
                  <span><strong>Phone:</strong> {outsiderReceipt.buyerPhone}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span><strong>Payment Mode:</strong> {outsiderReceipt.paymentMode}</span>
                  <span><strong>Dispensed By:</strong> {outsiderReceipt.soldBy}</span>
                </div>
              </div>

              {/* Items Purchased Table */}
              <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse', marginBottom: '14px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #94a3b8', textAlign: 'left', color: '#475569' }}>
                    <th style={{ padding: '6px 0' }}>Item / Strength</th>
                    <th style={{ padding: '6px 4px', textAlign: 'center' }}>Shelf</th>
                    <th style={{ padding: '6px 4px', textAlign: 'center' }}>Qty</th>
                    <th style={{ padding: '6px 4px', textAlign: 'right' }}>Price</th>
                    <th style={{ padding: '6px 0', textAlign: 'right' }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {outsiderReceipt.items.map((item, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px dashed #e2e8f0' }}>
                      <td style={{ padding: '6px 0' }}>
                        <strong>{item.name}</strong>
                      </td>
                      <td style={{ padding: '6px 4px', textAlign: 'center', fontSize: '11px', color: '#2563eb' }}>
                        {item.shelfLocation}
                      </td>
                      <td style={{ padding: '6px 4px', textAlign: 'center' }}>
                        x{item.qty}
                      </td>
                      <td style={{ padding: '6px 4px', textAlign: 'right' }}>
                        ₹{item.unitPrice.toFixed(2)}
                      </td>
                      <td style={{ padding: '6px 0', textAlign: 'right', fontWeight: 'bold' }}>
                        ₹{item.total.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Total & Footer */}
              <div style={{ borderTop: '2px dashed #94a3b8', paddingTop: '10px', marginBottom: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px', fontWeight: '800' }}>
                  <span>TOTAL AMOUNT PAID:</span>
                  <span style={{ color: '#047857' }}>₹{outsiderReceipt.grandTotal.toFixed(2)}</span>
                </div>
                <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px', textAlign: 'center' }}>
                  Amount synced with Central Cash Counter & Financial Accounts.
                </div>
              </div>

              <div style={{ textAlign: 'center', fontSize: '10px', color: '#94a3b8', borderTop: '1px solid #f1f5f9', paddingTop: '8px' }}>
                Thank you for visiting DHMS Hospital Pharmacy. Store medicines below 25°C.
              </div>
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px', borderTop: '1px solid #e2e8f0', paddingTop: '14px' }}>
              <button 
                type="button" 
                onClick={() => setOutsiderReceipt(null)}
                style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#f8fafc', color: '#475569', cursor: 'pointer', fontWeight: '600' }}
              >
                Close Window
              </button>
              <button 
                type="button" 
                onClick={() => {
                  window.print();
                }}
                style={{ padding: '8px 20px', borderRadius: '6px', border: 'none', background: '#10b981', color: 'white', cursor: 'pointer', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                🖨️ Print Receipt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
