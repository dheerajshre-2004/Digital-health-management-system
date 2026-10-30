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
  const [registeredPatients, setRegisteredPatients] = useState([]);

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
  const [outsiderCart, setOutsiderCart] = useState([]); // [{ medId, name, genericName, shelfLocation, unitPrice, qty, total, hsnCode, batchNo, expDate }]
  const [outsiderBuyerName, setOutsiderBuyerName] = useState('');
  const [outsiderBuyerPhone, setOutsiderBuyerPhone] = useState('');
  const [outsiderBuyerAge, setOutsiderBuyerAge] = useState('42 Years');
  const [outsiderBuyerGender, setOutsiderBuyerGender] = useState('Female');
  const [outsiderBuyerUHID, setOutsiderBuyerUHID] = useState('');
  const [outsiderBuyerAddress, setOutsiderBuyerAddress] = useState('KUNJAL POST AND AROOR VILLAGE, Karnataka');
  const [outsiderDoctorName, setOutsiderDoctorName] = useState('Dr. Umesh S N');
  const [doctorsList, setDoctorsList] = useState([]);
  const [patientLookupQuery, setPatientLookupQuery] = useState('');
  const [showPatientSuggestions, setShowPatientSuggestions] = useState(false);
  const [selectedRegisteredPatient, setSelectedRegisteredPatient] = useState(null);
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

  // Inpatient Medication Dispensing / Adding State
  const [selectedAdmForMedication, setSelectedAdmForProcessingMed] = useState(null);
  const [medToAddForm, setMedToAddForm] = useState({
    medId: '',
    dosage: '1 dose',
    frequency: 'TDS (3 times a day)',
    instructions: 'Post-meal oral administration',
    quantity: 1
  });
  const [selectedAdmDetails, setSelectedAdmDetails] = useState(null);

  // Load from LocalStorage on mount and listen for storage updates
  useEffect(() => {
    const loadFromStorage = () => {
      setMedications(JSON.parse(localStorage.getItem('dhms_medications') || '[]'));
      setStaff(JSON.parse(localStorage.getItem('dhms_pharmacy_staff') || '[]'));
      setAttendance(JSON.parse(localStorage.getItem('dhms_pharmacy_attendance') || '[]'));
      setPrescriptions(JSON.parse(localStorage.getItem('dhms_prescriptions') || '[]'));
      setAdmissions(JSON.parse(localStorage.getItem('dhms_admissions') || '[]'));
      setDoctorsList(JSON.parse(localStorage.getItem('dhms_doctors') || '[]'));
      setRegisteredPatients(JSON.parse(localStorage.getItem('dhms_patients') || '[]'));
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
      // Deterministic batch / HSN generator matching standard pharmaceutical invoicing
      const idNum = parseInt(String(med.id || '').replace(/\D/g, '')) || 101;
      const hsnCodes = ['30049099', '30049039', '21069099', '30042099', '30045020'];
      const batches = ['SANT2504', 'SPNT2601', 'VFO60401', '260782C', 'MED9011B', 'PHX3329A'];
      const expDates = ['02/28', '03/28', '06/28', '09/27', '12/28', '05/29'];

      const hsn = med.hsnCode || hsnCodes[(idNum % hsnCodes.length)];
      const batch = med.batchNo || batches[(idNum % batches.length)];
      const exp = med.expDate || expDates[(idNum % expDates.length)];
      const unitPrice = parseFloat(med.price) || 0;

      setOutsiderCart([...outsiderCart, {
        medId: med.id,
        name: med.name,
        genericName: med.genericName,
        shelfLocation: med.shelfLocation || 'Main Pharmacy Rack',
        hsnCode: hsn,
        batchNo: batch,
        expDate: exp,
        unitPrice: unitPrice,
        qty: 1,
        total: unitPrice
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

  // Auto-populate patient details if registered in hospital
  const handleSelectRegisteredPatient = (patient) => {
    if (!patient) return;
    const fullName = `${patient.firstName || ''} ${patient.lastName || ''}`.trim() || patient.name || 'Registered Patient';
    
    // Calculate age if dob available
    let calculatedAge = '42 Years';
    if (patient.dob) {
      const birthYear = new Date(patient.dob).getFullYear();
      if (!isNaN(birthYear)) {
        const diff = new Date().getFullYear() - birthYear;
        if (diff > 0) calculatedAge = `${diff} Years`;
      }
    } else if (patient.age) {
      calculatedAge = String(patient.age).includes('Year') ? patient.age : `${patient.age} Years`;
    }

    setOutsiderBuyerName(fullName);
    setOutsiderBuyerPhone(patient.phone || '');
    setOutsiderBuyerAge(calculatedAge);
    setOutsiderBuyerGender(patient.gender ? (patient.gender.charAt(0).toUpperCase() + patient.gender.slice(1).toLowerCase()) : 'Female');
    setOutsiderBuyerUHID(patient.id || `P${Math.floor(20000000 + Math.random() * 90000000)}`);
    if (patient.address) {
      setOutsiderBuyerAddress(patient.address);
    } else if (patient.city || patient.state) {
      setOutsiderBuyerAddress(`${patient.city || ''}, ${patient.state || 'Karnataka'}`.trim());
    }

    setSelectedRegisteredPatient(patient);
    setPatientLookupQuery(fullName);
    setShowPatientSuggestions(false);
  };

  const handleClearSelectedPatient = () => {
    setSelectedRegisteredPatient(null);
    setPatientLookupQuery('');
    setOutsiderBuyerName('');
    setOutsiderBuyerPhone('');
    setOutsiderBuyerUHID('');
    setOutsiderBuyerAge('42 Years');
    setOutsiderBuyerGender('Female');
    setOutsiderBuyerAddress('KUNJAL POST AND AROOR VILLAGE, Karnataka');
  };

  // Outsider Checkout & Bill Sync
  const handleOutsiderCheckout = (e) => {
    e.preventDefault();
    if (outsiderCart.length === 0) {
      alert("Cart is empty! Please select at least one medication.");
      return;
    }

    const buyerName = outsiderBuyerName.trim() || 'Walk-in Visitor';
    const rawBuyerPhone = outsiderBuyerPhone.trim();
    
    // Strict 10-digit mobile number validation (required for SMS/WhatsApp receipt)
    const cleanPhone = rawBuyerPhone.replace(/\D/g, '');
    const indianPhoneRegex = /^[6-9]\d{9}$/;

    if (!rawBuyerPhone) {
      alert("Mobile Number Required: Please enter the customer's 10-digit mobile number for SMS / WhatsApp receipt delivery.");
      return;
    }

    // Accept 10 digits directly (starts with 6-9) or with +91/91 prefix
    let normalizedPhone = cleanPhone;
    if (normalizedPhone.length === 12 && normalizedPhone.startsWith('91')) {
      normalizedPhone = normalizedPhone.slice(2);
    } else if (normalizedPhone.length === 11 && normalizedPhone.startsWith('0')) {
      normalizedPhone = normalizedPhone.slice(1);
    }

    if (!indianPhoneRegex.test(normalizedPhone)) {
      if (normalizedPhone.length < 10) {
        alert(`Invalid Mobile Number: Please enter a full 10-digit mobile number (currently entered ${normalizedPhone.length} digits).`);
      } else if (!/^[6-9]/.test(normalizedPhone)) {
        alert("Invalid Mobile Number: Mobile number must begin with 6, 7, 8, or 9.");
      } else {
        alert("Invalid Mobile Number: Please enter a valid 10-digit Indian mobile number (e.g., 9876543210).");
      }
      return;
    }

    const buyerPhone = normalizedPhone;
    const grandTotal = calculateCartTotal();
    const billId = `PBN${Math.floor(20000000 + Math.random() * 90000000)}`;
    const invoiceId = `INV-OUT-${Math.floor(1000 + Math.random() * 9000)}`;
    const today = new Date().toISOString().split('T')[0];
    const billDt = new Date().toLocaleDateString('en-GB') + ' ' + new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
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
      billId: billId,
      patientId: outsiderBuyerUHID.trim() || `P${Math.floor(20000000 + Math.random() * 90000000)}`,
      patientName: `${buyerName} (OP Pharmacy)`,
      phone: buyerPhone,
      date: today,
      paymentDate: today,
      amount: `₹${grandTotal.toFixed(2)}`,
      status: 'Paid',
      paymentMethod: outsiderPaymentMode,
      paymentRemarks: outsiderPaymentRemarks.trim() || `OP Pharmacy - Bill Cum Receipt. Dispensed by ${loggedInStaff?.name || 'Mrs. Savitha'}.`,
      type: `Pharmacy OP Sale: ${medNamesSummary}`,
      doctorName: outsiderDoctorName || 'Dr. Umesh S N',
      items: outsiderCart.map(i => ({
        id: i.medId,
        name: i.name,
        hsnCode: i.hsnCode,
        batchNo: i.batchNo,
        expDate: i.expDate,
        qty: i.qty,
        unitPrice: i.unitPrice,
        shelfLocation: i.shelfLocation,
        total: i.total
      })),
      soldBy: loggedInStaff?.name || 'Mrs. Savitha'
    };

    localStorage.setItem('dhms_billing', JSON.stringify([newInvoice, ...billing]));

    if (window.dispatchEvent) {
      window.dispatchEvent(new Event('storage'));
    }

    // Number to words helper (Indian Rupees)
    const numberToWords = (num) => {
      const a = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
      const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
      const inWords = (n) => {
        if (n < 20) return a[n];
        const digit = n % 10;
        return b[Math.floor(n / 10)] + (digit ? ' ' + a[digit] : '');
      };
      const intNum = Math.floor(num);
      if (intNum === 0) return 'Rupees Zero Only';
      let str = '';
      if (Math.floor(intNum / 10000000) > 0) {
        str += inWords(Math.floor(intNum / 10000000)) + ' Crore ';
      }
      const lakh = Math.floor((intNum % 10000000) / 100000);
      if (lakh > 0) {
        str += inWords(lakh) + ' Lakh ';
      }
      const thousand = Math.floor((intNum % 100000) / 1000);
      if (thousand > 0) {
        str += inWords(thousand) + ' Thousand ';
      }
      const hundred = Math.floor((intNum % 1000) / 100);
      if (hundred > 0) {
        str += inWords(hundred) + ' Hundred ';
      }
      const rem = intNum % 100;
      if (rem > 0) {
        str += (str ? 'and ' : '') + inWords(rem) + ' ';
      }
      return 'Rupees ' + str.trim() + ' Only.';
    };

    // 3. Set Receipt for Instant Print/Preview Modal
    setOutsiderReceipt({
      billId,
      invoiceId,
      billDt,
      date: today,
      time: timestamp,
      buyerName,
      buyerPhone,
      buyerAge: outsiderBuyerAge || '42 Years',
      buyerGender: outsiderBuyerGender || 'Female',
      buyerUHID: outsiderBuyerUHID.trim() || `P${Math.floor(20000000 + Math.random() * 90000000)}`,
      buyerAddress: outsiderBuyerAddress || 'KUNJAL POST AND AROOR VILLAGE, Karnataka',
      doctorName: outsiderDoctorName || 'Dr. Umesh S N',
      items: [...outsiderCart],
      grandTotal,
      amountInWords: numberToWords(grandTotal),
      paymentMode: outsiderPaymentMode,
      soldBy: loggedInStaff?.name || 'Mrs. Savitha'
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

  const handleAddInpatientMedication = (e) => {
    e.preventDefault();
    if (!selectedAdmForMedication) return;

    const chosenMed = medications.find(m => m.id === medToAddForm.medId);
    if (!chosenMed) {
      alert("Please select a valid medication from the hospital pharmacy inventory.");
      return;
    }

    const qty = parseInt(medToAddForm.quantity) || 1;
    if (chosenMed.stock < qty) {
      alert(`Insufficient inventory stock! Only ${chosenMed.stock} units available for ${chosenMed.name}.`);
      return;
    }

    // Deduct inventory stock
    const updatedMeds = medications.map(m => {
      if (m.id === chosenMed.id) {
        return { ...m, stock: Math.max(0, m.stock - qty) };
      }
      return m;
    });
    saveMedications(updatedMeds);

    const unitPrice = parseFloat(chosenMed.price) || 0;
    const totalCost = unitPrice * qty;
    const today = new Date().toISOString().split('T')[0];

    const newMedItem = {
      name: `${chosenMed.name} (${qty > 1 ? `${qty} units` : medToAddForm.dosage})`,
      medId: chosenMed.id,
      quantity: qty,
      instructions: `${medToAddForm.frequency} - ${medToAddForm.instructions}`,
      cost: totalCost,
      status: 'Dispensed',
      date: today,
      dispensedBy: loggedInStaff?.name || 'Inpatient Pharmacist'
    };

    const updatedAdmissions = admissions.map(adm => {
      if (adm.id === selectedAdmForMedication.id) {
        const curMeds = adm.medications || [];
        return {
          ...adm,
          medications: [...curMeds, newMedItem]
        };
      }
      return adm;
    });

    saveAdmissions(updatedAdmissions);
    if (window.dispatchEvent) {
      window.dispatchEvent(new Event('storage'));
    }

    alert(`✅ Medication "${chosenMed.name}" (${qty} units - ₹${totalCost.toFixed(2)}) added to ${selectedAdmForMedication.patientName}'s running bill successfully!`);
    setSelectedAdmForProcessingMed(null);
    setMedToAddForm({
      medId: '',
      dosage: '1 dose',
      frequency: 'TDS (3 times a day)',
      instructions: 'Post-meal oral administration',
      quantity: 1
    });
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

                  {/* Visitor / Patient Information & Payment Options Form */}
                  <form onSubmit={handleOutsiderCheckout} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {selectedRegisteredPatient && (
                      <div style={{ background: '#f0fdf4', padding: '6px 12px', borderRadius: '6px', border: '1px solid #bbf7d0', fontSize: '11px', color: '#15803d', fontWeight: '600', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>✓ Hospital Registered Profile Linked: <strong>{selectedRegisteredPatient.firstName} {selectedRegisteredPatient.lastName || ''} ({selectedRegisteredPatient.id})</strong></span>
                        <button
                          type="button"
                          onClick={handleClearSelectedPatient}
                          style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '11px', fontWeight: '700', cursor: 'pointer', padding: 0 }}
                        >
                          ✕ Clear & Edit Manually
                        </button>
                      </div>
                    )}

                    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '8px' }}>
                      <div className="form-group" style={{ margin: 0, position: 'relative' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <label style={{ fontSize: '12px', fontWeight: '600', color: '#475569' }}>
                            Patient / Customer Name
                          </label>
                          {selectedRegisteredPatient && (
                            <span style={{ fontSize: '10.5px', color: '#15803d', fontWeight: 'bold' }}>
                              ✓ Registered Patient
                            </span>
                          )}
                        </div>
                        <input 
                          type="text" 
                          placeholder="Type registered name (e.g. Mrs. Shobha)..." 
                          value={outsiderBuyerName}
                          onChange={(e) => {
                            const val = e.target.value;
                            setOutsiderBuyerName(val);
                            setPatientLookupQuery(val);
                            setShowPatientSuggestions(true);
                            if (selectedRegisteredPatient && val !== `${selectedRegisteredPatient.firstName || ''} ${selectedRegisteredPatient.lastName || ''}`.trim()) {
                              setSelectedRegisteredPatient(null);
                            }
                          }}
                          onFocus={() => {
                            if (outsiderBuyerName.trim().length > 0) {
                              setShowPatientSuggestions(true);
                            }
                          }}
                          style={{ 
                            padding: '7px 10px', 
                            borderRadius: '6px', 
                            border: selectedRegisteredPatient ? '1.5px solid #10b981' : '1px solid #cbd5e1', 
                            fontSize: '12.5px', 
                            width: '100%', 
                            boxSizing: 'border-box',
                            background: selectedRegisteredPatient ? '#f0fdf4' : 'white'
                          }}
                        />

                        {/* Live dropdown matching patient name directly */}
                        {showPatientSuggestions && outsiderBuyerName.trim().length > 0 && (
                          <div style={{
                            position: 'absolute',
                            top: '100%',
                            left: 0,
                            right: 0,
                            background: 'white',
                            borderRadius: '6px',
                            boxShadow: '0 12px 20px -3px rgba(0,0,0,0.18)',
                            border: '1.5px solid #3b82f6',
                            maxHeight: '190px',
                            overflowY: 'auto',
                            zIndex: 100,
                            marginTop: '2px'
                          }}>
                            {(() => {
                              const q = outsiderBuyerName.toLowerCase().trim();
                              const matches = registeredPatients.filter(p => {
                                const fullName = `${p.firstName || ''} ${p.lastName || ''}`.toLowerCase();
                                const phone = (p.phone || '').toLowerCase();
                                const id = (p.id || '').toLowerCase();
                                return fullName.includes(q) || phone.includes(q) || id.includes(q);
                              });

                              if (matches.length === 0) {
                                return (
                                  <div style={{ padding: '8px 10px', fontSize: '11px', color: '#64748b' }}>
                                    Not registered in hospital. You can enter details manually.
                                  </div>
                                );
                              }

                              return (
                                <div>
                                  <div style={{ padding: '5px 8px', fontSize: '10.5px', background: '#eff6ff', color: '#1d4ed8', fontWeight: 'bold', borderBottom: '1px solid #bfdbfe' }}>
                                    🏥 Hospital Registered Patients Found (Click to Auto-fill):
                                  </div>
                                  {matches.slice(0, 5).map(patient => (
                                    <div
                                      key={patient.id}
                                      onClick={() => handleSelectRegisteredPatient(patient)}
                                      style={{
                                        padding: '7px 10px',
                                        borderBottom: '1px solid #f1f5f9',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        background: 'white'
                                      }}
                                      onMouseEnter={(e) => e.currentTarget.style.background = '#f0fdf4'}
                                      onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                                    >
                                      <div>
                                        <strong style={{ fontSize: '12px', color: '#0f172a' }}>
                                          {patient.firstName} {patient.lastName || ''}
                                        </strong>
                                        <div style={{ fontSize: '10.5px', color: '#0369a1' }}>
                                          📞 {patient.phone} • {patient.gender || 'Patient'} • ID: {patient.id}
                                        </div>
                                      </div>
                                      <span style={{
                                        fontSize: '10.5px',
                                        background: '#10b981',
                                        color: 'white',
                                        padding: '2px 7px',
                                        borderRadius: '4px',
                                        fontWeight: 'bold'
                                      }}>
                                        Auto-Fill
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              );
                            })()}
                          </div>
                        )}
                      </div>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label style={{ fontSize: '12px', fontWeight: '600', color: '#475569' }}>UHID / Patient ID</label>
                        <input 
                          type="text" 
                          placeholder="e.g. P260129704" 
                          value={outsiderBuyerUHID}
                          onChange={(e) => setOutsiderBuyerUHID(e.target.value)}
                          style={{ padding: '7px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12.5px', width: '100%', boxSizing: 'border-box' }}
                        />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.2fr', gap: '8px' }}>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label style={{ fontSize: '12px', fontWeight: '600', color: '#475569' }}>Age / Demographics</label>
                        <input 
                          type="text" 
                          placeholder="e.g. 42 Years" 
                          value={outsiderBuyerAge}
                          onChange={(e) => setOutsiderBuyerAge(e.target.value)}
                          style={{ padding: '7px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12.5px', width: '100%', boxSizing: 'border-box' }}
                        />
                      </div>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label style={{ fontSize: '12px', fontWeight: '600', color: '#475569' }}>Gender</label>
                        <select
                          value={outsiderBuyerGender}
                          onChange={(e) => setOutsiderBuyerGender(e.target.value)}
                          style={{ padding: '7px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12.5px', width: '100%', boxSizing: 'border-box', background: 'white' }}
                        >
                          <option value="Female">Female</option>
                          <option value="Male">Male</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label style={{ fontSize: '12px', fontWeight: '600', color: '#475569' }}>Consulting Doctor</label>
                        <input 
                          type="text" 
                          placeholder="e.g. Dr. Umesh S N" 
                          value={outsiderDoctorName}
                          onChange={(e) => setOutsiderDoctorName(e.target.value)}
                          style={{ padding: '7px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12.5px', width: '100%', boxSizing: 'border-box' }}
                        />
                      </div>
                    </div>

                    <div className="form-group" style={{ margin: 0 }}>
                      <label style={{ fontSize: '12px', fontWeight: '600', color: '#475569' }}>Address</label>
                      <input 
                        type="text" 
                        placeholder="e.g. KUNJAL POST AND AROOR VILLAGE, Karnataka" 
                        value={outsiderBuyerAddress}
                        onChange={(e) => setOutsiderBuyerAddress(e.target.value)}
                        style={{ padding: '7px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12.5px', width: '100%', boxSizing: 'border-box' }}
                      />
                    </div>

                    <div className="form-group" style={{ margin: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <label style={{ fontSize: '12px', fontWeight: '600', color: '#475569' }}>
                          Mobile Number (for SMS / WhatsApp Bill) <span style={{ color: '#ef4444' }}>*</span>
                        </label>
                        {outsiderBuyerPhone && (
                          <span style={{ fontSize: '11px', fontWeight: '600' }}>
                            {(() => {
                              const digits = outsiderBuyerPhone.replace(/\D/g, '');
                              const norm = (digits.length === 12 && digits.startsWith('91')) ? digits.slice(2) : ((digits.length === 11 && digits.startsWith('0')) ? digits.slice(1) : digits);
                              if (/^[6-9]\d{9}$/.test(norm)) {
                                return <span style={{ color: '#10b981' }}>✓ Valid 10-digit</span>;
                              }
                              if (norm.length < 10) {
                                return <span style={{ color: '#f59e0b' }}>⚠️ {norm.length}/10 digits</span>;
                              }
                              return <span style={{ color: '#ef4444' }}>⚠️ Must start with 6-9</span>;
                            })()}
                          </span>
                        )}
                      </div>
                      <input 
                        type="tel" 
                        required
                        maxLength={13}
                        placeholder="e.g. 9876543210 or +91 98765 43210" 
                        value={outsiderBuyerPhone}
                        onChange={(e) => {
                          // Allow numbers, spaces, plus and dashes
                          const clean = e.target.value.replace(/[^0-9+\s-]/g, '');
                          setOutsiderBuyerPhone(clean);
                        }}
                        style={{ 
                          padding: '8px 12px', 
                          borderRadius: '6px', 
                          border: outsiderBuyerPhone ? (
                            (() => {
                              const digits = outsiderBuyerPhone.replace(/\D/g, '');
                              const norm = (digits.length === 12 && digits.startsWith('91')) ? digits.slice(2) : ((digits.length === 11 && digits.startsWith('0')) ? digits.slice(1) : digits);
                              return /^[6-9]\d{9}$/.test(norm) ? '1.5px solid #10b981' : '1.5px solid #ef4444';
                            })()
                          ) : '1px solid #cbd5e1', 
                          fontSize: '13px', 
                          width: '100%', 
                          boxSizing: 'border-box',
                          outline: 'none',
                          backgroundColor: outsiderBuyerPhone ? (
                            (() => {
                              const digits = outsiderBuyerPhone.replace(/\D/g, '');
                              const norm = (digits.length === 12 && digits.startsWith('91')) ? digits.slice(2) : ((digits.length === 11 && digits.startsWith('0')) ? digits.slice(1) : digits);
                              return /^[6-9]\d{9}$/.test(norm) ? '#f0fdf4' : '#fff1f2';
                            })()
                          ) : 'white'
                        }}
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div>
                  <h1 className="pane-title" style={{ margin: 0 }}>Inpatient Medication Dispensing & Running Bills</h1>
                  <p className="section-desc" style={{ marginTop: '4px' }}>
                    Track all medications given to patients during admission, add doses to running bills, and monitor discharge clearance settled at Reception.
                  </p>
                </div>
              </div>
              
              <div className="section-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
                  <div>
                    <h2 style={{ margin: 0 }}>Admitted Inpatients & Medication Summary</h2>
                    <span style={{ fontSize: '12px', color: '#64748b' }}>
                      Discharge billing & settlement is processed at the Reception Desk. Running medication bills auto-sync with Reception.
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <span style={{ background: '#ecfdf5', color: '#065f46', border: '1px solid #a7f3d0', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold' }}>
                      🟢 Total Admissions: {admissions.length}
                    </span>
                    <span style={{ background: '#eff6ff', color: '#1e40af', border: '1px solid #bfdbfe', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold' }}>
                      🏥 Active Inpatients: {admissions.filter(a => a.status === 'Admitted' || a.status?.includes('Pending') || a.status?.includes('Advised')).length}
                    </span>
                  </div>
                </div>

                <div className="table-wrapper">
                  <table className="dashboard-table">
                    <thead>
                      <tr>
                        <th>Adm ID</th>
                        <th>Patient</th>
                        <th>Ward</th>
                        <th>Admission Date</th>
                        <th>Medications Dispensed</th>
                        <th>Running Pharmacy Bill</th>
                        <th>Admission Status</th>
                        <th>Discharge Bill Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {admissions.map(adm => {
                        const totalMedsBill = calculatePharmacyBill(adm);
                        const isCleared = adm.status === 'Discharged' || adm.pharmacyBillPaid;
                        const isAdmitted = adm.status === 'Admitted';

                        return (
                          <tr key={adm.id} style={{ background: isCleared ? '#f8fafc' : 'white' }}>
                            <td><strong>{adm.id}</strong></td>
                            <td>
                              <strong>{adm.patientName}</strong>
                              <div className="subtitle">ID: {adm.patientId}</div>
                            </td>
                            <td>{adm.ward}</td>
                            <td>{adm.admissionDate}</td>
                            <td>
                              {adm.medications && adm.medications.length > 0 ? (
                                <div>
                                  <div className="meds-list-cell">
                                    {adm.medications.map((m, i) => (
                                      <span key={i} className={`med-item-pill ${m.status.toLowerCase()}`}>
                                        {m.name} ({m.status})
                                      </span>
                                    ))}
                                  </div>
                                  <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
                                    Total Items: <strong>{adm.medications.length}</strong>
                                  </div>
                                </div>
                              ) : (
                                <span className="subtitle italic">No medications given yet</span>
                              )}
                            </td>
                            <td>
                              <strong style={{ fontSize: '15px', color: isCleared ? '#15803d' : '#1e3a8a' }}>
                                ₹{totalMedsBill.toFixed(2)}
                              </strong>
                              {adm.medications && adm.medications.length > 0 && (
                                <div style={{ fontSize: '11px', color: '#64748b' }}>
                                  {(adm.medications || []).filter(m => m.status === 'Dispensed').length} dispensed
                                </div>
                              )}
                            </td>
                            <td>
                              <span className={`status-badge ${adm.status === 'Admitted' ? 'surgery' : adm.status === 'Discharged' ? 'available' : 'emergency'}`}>
                                {adm.status}
                              </span>
                            </td>
                            <td>
                              {isCleared ? (
                                <span style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  padding: '4px 8px',
                                  borderRadius: '6px',
                                  fontSize: '11.5px',
                                  fontWeight: '700',
                                  background: '#dcfce7',
                                  color: '#15803d',
                                  border: '1px solid #86efac'
                                }}>
                                  ✓ Cleared & Settled (Reception)
                                </span>
                              ) : (
                                <span style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  padding: '4px 8px',
                                  borderRadius: '6px',
                                  fontSize: '11.5px',
                                  fontWeight: '700',
                                  background: '#fef3c7',
                                  color: '#b45309',
                                  border: '1px solid #fde68a'
                                }}>
                                  ⏳ Pending Reception Clearance
                                </span>
                              )}
                            </td>
                            <td>
                              <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                                {isAdmitted && (
                                  <button 
                                    onClick={() => {
                                      setSelectedAdmForProcessingMed(adm);
                                      setMedToAddForm({
                                        medId: medications.length > 0 ? medications[0].id : '',
                                        dosage: '1 dose',
                                        frequency: 'TDS (3 times a day)',
                                        instructions: 'Post-meal oral administration',
                                        quantity: 1
                                      });
                                    }} 
                                    style={{
                                      padding: '6px 12px',
                                      fontSize: '12px',
                                      fontWeight: '700',
                                      background: '#10b981',
                                      color: 'white',
                                      border: 'none',
                                      borderRadius: '6px',
                                      cursor: 'pointer',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '4px'
                                    }}
                                  >
                                    + Add Medication
                                  </button>
                                )}
                                <button 
                                  onClick={() => handleDownloadInvoice(adm)} 
                                  className="btn-action-restock"
                                  style={{ padding: '6px 10px', fontSize: '12px' }}
                                >
                                  Invoice
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                      {admissions.length === 0 && (
                        <tr>
                          <td colSpan="9" style={{ textAlign: 'center', color: '#64748b', fontStyle: 'italic', padding: '20px' }}>
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
      {/* Printable OP Pharmacy - Bill Cum Receipt Modal (Matches Official Reference) */}
      {outsiderReceipt && (
        <div className="custom-modal-overlay" style={{ zIndex: 9999, overflowY: 'auto', padding: '20px 10px' }}>
          <div className="custom-modal" style={{ maxWidth: '820px', width: '100%', background: 'white', borderRadius: '8px', padding: '24px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', border: '1px solid #cbd5e1' }}>
            
            {/* The Printable Bill Document */}
            <div id="dhms-walkin-receipt-print" style={{ 
              background: '#ffffff', 
              color: '#000000', 
              fontFamily: '"Courier New", Courier, monospace, -apple-system, sans-serif',
              fontSize: '11px',
              lineHeight: '1.35',
              padding: '10px'
            }}>
              
              {/* TOP HEADER 3-COLUMN LAYOUT */}
              <div style={{ display: 'grid', gridTemplateColumns: '2.5fr 3.2fr 2.3fr', gap: '12px', borderBottom: '1.5px solid #000000', paddingBottom: '8px', marginBottom: '6px' }}>
                
                {/* Col 1: Hospital & Pharmacy Header */}
                <div style={{ display: 'flex', gap: '8px' }}>
                  <div style={{
                    border: '1.5px solid #000',
                    borderRadius: '50px',
                    padding: '4px 8px',
                    height: 'fit-content',
                    fontWeight: '900',
                    fontSize: '13px',
                    letterSpacing: '-0.5px',
                    textAlign: 'center',
                    lineHeight: '1'
                  }}>
                    MAHESH<br/><span style={{ fontSize: '9px', fontWeight: 'bold' }}>Hospital</span>
                  </div>
                  <div>
                    <div style={{ fontWeight: '800', fontSize: '13px' }}>Mahesh Medicals</div>
                    <div style={{ fontSize: '10.5px' }}>NH 66 , Brahmavara</div>
                    <div style={{ fontSize: '10.5px' }}>Brahmavara, Udupi, Karnataka - 576213, INDIA.</div>
                    <div style={{ fontSize: '10px', marginTop: '2px' }}>Contact No : 9449835256, 7259862056</div>
                    <div style={{ fontSize: '10px', fontWeight: 'bold' }}>GST No: 29ACQPB4327B1ZU</div>
                    <div style={{ fontSize: '9.5px' }}>D.L.No : KA-UDP/20/179, KA-UDP/21/179</div>
                  </div>
                </div>

                {/* Col 2: Bill To (Patient Info) */}
                <div style={{ borderLeft: '1px solid #ccc', paddingLeft: '10px' }}>
                  <div style={{ fontWeight: 'bold', fontSize: '11px', textDecoration: 'underline' }}>Bill To :</div>
                  <div style={{ fontWeight: '800', fontSize: '11.5px' }}>
                    {outsiderReceipt.buyerName || 'Mrs. Shobha'} | {outsiderReceipt.buyerAge || '42 Years'} | {outsiderReceipt.buyerGender || 'Female'}
                  </div>
                  <div style={{ marginTop: '2px' }}>
                    <strong>UHID : </strong>{outsiderReceipt.buyerUHID || 'P260129704'}
                  </div>
                  <div>
                    <strong>Mobile No : </strong>{outsiderReceipt.buyerPhone || '7676871067'}
                  </div>
                  <div style={{ fontSize: '10px', color: '#1e293b', marginTop: '1px' }}>
                    <strong>Address : </strong>{outsiderReceipt.buyerAddress || 'KUNJAL POST AND AROOR VILLAGE, Karnataka'}
                  </div>
                </div>

                {/* Col 3: Barcode, Bill ID, Bill Dt & Doctor */}
                <div style={{ textAlign: 'right', borderLeft: '1px solid #ccc', paddingLeft: '10px' }}>
                  {/* Simulated barcode */}
                  <div style={{ display: 'inline-block', textAlign: 'center' }}>
                    <div style={{ 
                      letterSpacing: '3px', 
                      fontFamily: '"Libre Barcode 39", "Courier New", monospace', 
                      fontSize: '22px', 
                      fontWeight: 'bold',
                      lineHeight: '0.9'
                    }}>
                      ||||||||||||||||||||||||||||
                    </div>
                    <div style={{ fontSize: '9px', fontWeight: 'bold' }}>{outsiderReceipt.billId || 'PBN290926124'}</div>
                  </div>

                  <div style={{ marginTop: '4px', fontSize: '10.5px' }}>
                    <strong>Bill ID : </strong>{outsiderReceipt.billId || 'PBN290926124'}
                  </div>
                  <div style={{ fontSize: '10.5px' }}>
                    <strong>Bill Dt : </strong>{outsiderReceipt.billDt || `${outsiderReceipt.date} 05:36 PM`}
                  </div>
                  <div style={{ marginTop: '6px', fontSize: '11px', fontWeight: 'bold' }}>
                    Doctor Name : {outsiderReceipt.doctorName || 'Dr. Umesh S N'}
                  </div>
                </div>

              </div>

              {/* TITLE BANNER */}
              <div style={{ textAlign: 'center', fontWeight: '800', fontSize: '12px', margin: '4px 0 8px 0', letterSpacing: '0.5px' }}>
                OP Pharmacy - Bill Cum Receipt
              </div>

              {/* MEDICATION ITEMS TABLE */}
              <table style={{ 
                width: '100%', 
                borderCollapse: 'collapse', 
                fontSize: '10.5px',
                border: '1.5px solid #000000',
                marginBottom: '4px'
              }}>
                <thead>
                  <tr style={{ borderBottom: '1.5px solid #000000', background: '#f8fafc', fontWeight: 'bold' }}>
                    <th style={{ border: '1px solid #000', padding: '3px 4px', width: '22px', textAlign: 'center' }}>#</th>
                    <th style={{ border: '1px solid #000', padding: '3px 6px', textAlign: 'left' }}>Brand Name</th>
                    <th style={{ border: '1px solid #000', padding: '3px 4px', textAlign: 'center', width: '75px' }}>HSN Code</th>
                    <th style={{ border: '1px solid #000', padding: '3px 4px', textAlign: 'center', width: '70px' }}>Batch No</th>
                    <th style={{ border: '1px solid #000', padding: '3px 4px', textAlign: 'center', width: '55px' }}>Exp. Date</th>
                    <th style={{ border: '1px solid #000', padding: '3px 4px', textAlign: 'right', width: '70px' }}>MRP per unit(Rs)</th>
                    <th style={{ border: '1px solid #000', padding: '3px 4px', textAlign: 'center', width: '35px' }}>Qty</th>
                    <th style={{ border: '1px solid #000', padding: '3px 6px', textAlign: 'right', width: '80px' }}>Net Amount Payable(Rs)</th>
                    <th style={{ border: '1px solid #000', padding: '3px 4px', textAlign: 'right', width: '65px' }}>CGST(Rs)</th>
                    <th style={{ border: '1px solid #000', padding: '3px 4px', textAlign: 'right', width: '65px' }}>SGST(Rs)</th>
                  </tr>
                </thead>
                <tbody>
                  {outsiderReceipt.items.map((item, idx) => {
                    const lineTotal = item.total || (item.qty * item.unitPrice);
                    // Standard retail GST breakdown (5% total: 2.5% CGST + 2.5% SGST included)
                    const taxPerSide = (lineTotal * 0.025) / 1.05;
                    return (
                      <tr key={idx} style={{ borderBottom: '1px solid #ccc' }}>
                        <td style={{ border: '1px solid #000', padding: '4px', textAlign: 'center' }}>{idx + 1}</td>
                        <td style={{ border: '1px solid #000', padding: '4px 6px', fontWeight: 'bold' }}>
                          {item.name.toUpperCase()}
                        </td>
                        <td style={{ border: '1px solid #000', padding: '4px', textAlign: 'center' }}>
                          {item.hsnCode || '30049099'}
                        </td>
                        <td style={{ border: '1px solid #000', padding: '4px', textAlign: 'center' }}>
                          {item.batchNo || 'SANT2504'}
                        </td>
                        <td style={{ border: '1px solid #000', padding: '4px', textAlign: 'center' }}>
                          {item.expDate || '02/28'}
                        </td>
                        <td style={{ border: '1px solid #000', padding: '4px', textAlign: 'right' }}>
                          {item.unitPrice.toFixed(2)}
                        </td>
                        <td style={{ border: '1px solid #000', padding: '4px', textAlign: 'center', fontWeight: 'bold' }}>
                          {item.qty}
                        </td>
                        <td style={{ border: '1px solid #000', padding: '4px 6px', textAlign: 'right', fontWeight: 'bold' }}>
                          {lineTotal.toFixed(2)}
                        </td>
                        <td style={{ border: '1px solid #000', padding: '4px', textAlign: 'right' }}>
                          {taxPerSide.toFixed(2)}<br/><span style={{ fontSize: '9px', color: '#555' }}>(2.50%)</span>
                        </td>
                        <td style={{ border: '1px solid #000', padding: '4px', textAlign: 'right' }}>
                          {taxPerSide.toFixed(2)}<br/><span style={{ fontSize: '9px', color: '#555' }}>(2.50%)</span>
                        </td>
                      </tr>
                    );
                  })}

                  {/* Totals Row */}
                  {(() => {
                    const totalPayable = outsiderReceipt.grandTotal;
                    const totalTaxPerSide = (totalPayable * 0.025) / 1.05;
                    return (
                      <tr style={{ borderTop: '1.5px solid #000', fontWeight: 'bold', background: '#f8fafc' }}>
                        <td colSpan="7" style={{ border: '1px solid #000', padding: '4px 8px', textAlign: 'right' }}>Totals :</td>
                        <td style={{ border: '1px solid #000', padding: '4px 6px', textAlign: 'right' }}>{totalPayable.toFixed(2)}</td>
                        <td style={{ border: '1px solid #000', padding: '4px', textAlign: 'right' }}>{totalTaxPerSide.toFixed(2)}</td>
                        <td style={{ border: '1px solid #000', padding: '4px', textAlign: 'right' }}>{totalTaxPerSide.toFixed(2)}</td>
                      </tr>
                    );
                  })()}
                </tbody>
              </table>

              {/* PAYMENT SUMMARY & TOTAL AMOUNT WORDS SECTION */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '12px', marginTop: '6px' }}>
                <div>
                  <div style={{ fontSize: '11px', lineHeight: '1.6' }}>
                    <strong>Payment Mode &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;: </strong>
                    Cash Rs {outsiderReceipt.grandTotal.toFixed(2)}
                    {outsiderReceipt.paymentMode.includes('UPI') ? ' (UPI Transfer)' : ''}
                  </div>
                  <div style={{ fontSize: '11px', lineHeight: '1.6' }}>
                    <strong>Bill Amount In Words : </strong>
                    {outsiderReceipt.amountInWords || `Rupees ${outsiderReceipt.grandTotal.toFixed(2)} Only.`}
                  </div>

                  {/* GST SUMMARY BOX */}
                  <table style={{ width: '85%', borderCollapse: 'collapse', marginTop: '10px', fontSize: '10px', border: '1px solid #000', textAlign: 'center' }}>
                    <thead>
                      <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #000' }}>
                        <th style={{ border: '1px solid #000', padding: '2px 4px' }}>Tax Amt</th>
                        <th style={{ border: '1px solid #000', padding: '2px 4px' }}>GST%</th>
                        <th style={{ border: '1px solid #000', padding: '2px 4px' }}>CGST(Rs)</th>
                        <th style={{ border: '1px solid #000', padding: '2px 4px' }}>SGST(Rs)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        const grandTotal = outsiderReceipt.grandTotal;
                        const totalTax = (grandTotal * 0.05) / 1.05;
                        const halfTax = totalTax / 2;
                        return (
                          <tr>
                            <td style={{ border: '1px solid #000', padding: '3px' }}>{totalTax.toFixed(2)}</td>
                            <td style={{ border: '1px solid #000', padding: '3px' }}>5.00</td>
                            <td style={{ border: '1px solid #000', padding: '3px' }}>{halfTax.toFixed(2)}</td>
                            <td style={{ border: '1px solid #000', padding: '3px' }}>{halfTax.toFixed(2)}</td>
                          </tr>
                        );
                      })()}
                    </tbody>
                  </table>
                </div>

                {/* Right side totals list */}
                <div style={{ fontSize: '11px', lineHeight: '1.7', textAlign: 'right', paddingRight: '6px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <strong>Actual Bill Amount :</strong>
                    <strong>Rs {outsiderReceipt.grandTotal.toFixed(2)}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <strong>Total Bill Amount :</strong>
                    <strong>Rs {outsiderReceipt.grandTotal.toFixed(2)}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <strong>Paid Amount :</strong>
                    <strong>Rs {outsiderReceipt.grandTotal.toFixed(2)}</strong>
                  </div>
                </div>
              </div>

              {/* ACKNOWLEDGEMENT & PHARMACIST SIGNATURE */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '16px', padding: '0 6px' }}>
                <div style={{ fontSize: '10px', fontStyle: 'italic', fontWeight: 'bold' }}>
                  #Received Rs {outsiderReceipt.grandTotal.toFixed(2)}/- from {outsiderReceipt.buyerName || 'Mrs. Shobha'} with thanks.
                </div>
                <div style={{ textAlign: 'center' }}>
                  {/* Handwritten-styled signature element */}
                  <div style={{ 
                    fontFamily: '"Brush Script MT", cursive, sans-serif', 
                    fontSize: '22px', 
                    color: '#1d4ed8', 
                    lineHeight: '1',
                    marginBottom: '2px',
                    transform: 'rotate(-5deg)'
                  }}>
                    Savitha
                  </div>
                  <div style={{ fontWeight: 'bold', fontSize: '10.5px' }}>Pharmacist Signature</div>
                  <div style={{ fontSize: '10px' }}>{outsiderReceipt.soldBy || 'Mrs. Savitha'}</div>
                </div>
              </div>

              {/* OFFICIAL RUBBER STAMP & RETURN POLICY BOX */}
              <div style={{ margin: '14px auto 8px auto', textAlign: 'center' }}>
                <div style={{
                  display: 'inline-block',
                  border: '2.5px solid #3730a3',
                  borderRadius: '16px',
                  padding: '4px 16px',
                  color: '#3730a3',
                  fontWeight: '900',
                  letterSpacing: '1px',
                  textTransform: 'uppercase',
                  transform: 'rotate(-1.5deg)',
                  boxShadow: 'inset 0 0 0 1px #3730a3'
                }}>
                  <div style={{ fontSize: '13px' }}>MAHESH MEDICALS</div>
                  <div style={{ fontSize: '11px', fontWeight: 'bold' }}>BRAHMAVARA - 576 213</div>
                  <div style={{ fontSize: '14px', marginTop: '2px', borderTop: '1px solid #3730a3', paddingTop: '2px', letterSpacing: '2px' }}>
                    CASH PAID
                  </div>
                </div>
              </div>

              {/* FOOTER POLICIES */}
              <div style={{ borderTop: '1px solid #000', borderBottom: '1px solid #000', padding: '3px 0', fontSize: '9.5px', textAlign: 'center', fontWeight: 'bold' }}>
                Return Policy : Within 2 Months with bill & Surgical items no return
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', marginTop: '4px', color: '#333' }}>
                <span>Created by : {outsiderReceipt.soldBy || 'Mrs. Savitha'}</span>
                <span>Printed by : {outsiderReceipt.soldBy || 'Mrs. Savitha'} ( {outsiderReceipt.billDt || `${outsiderReceipt.date} | 05:36 PM`} )</span>
              </div>

            </div>

            {/* Action buttons (hidden when printed) */}
            <div className="no-print" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px', borderTop: '1px solid #e2e8f0', paddingTop: '12px' }}>
              <button 
                type="button" 
                onClick={() => setOutsiderReceipt(null)}
                style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#f8fafc', color: '#475569', cursor: 'pointer', fontWeight: '600', fontSize: '13px' }}
              >
                Close Window
              </button>
              <button 
                type="button" 
                onClick={() => {
                  try {
                    const slipElem = document.getElementById('dhms-walkin-receipt-print');
                    if (!slipElem) {
                      window.print();
                      return;
                    }
                    const iframe = document.createElement('iframe');
                    iframe.style.position = 'fixed';
                    iframe.style.right = '0';
                    iframe.style.bottom = '0';
                    iframe.style.width = '0';
                    iframe.style.height = '0';
                    iframe.style.border = '0';
                    document.body.appendChild(iframe);

                    const doc = iframe.contentWindow.document;
                    doc.open();
                    doc.write(`
                      <!DOCTYPE html>
                      <html>
                        <head>
                          <title>OP Pharmacy Bill - ${outsiderReceipt.billId || outsiderReceipt.invoiceId}</title>
                          <style>
                            @page { size: auto; margin: 8mm; }
                            body { font-family: "Courier New", Courier, monospace, sans-serif; margin: 0; padding: 5px; color: #000; background: #fff; }
                            table { width: 100%; border-collapse: collapse; }
                            th, td { border: 1px solid #000; }
                          </style>
                        </head>
                        <body>
                          ${slipElem.innerHTML}
                        </body>
                      </html>
                    `);
                    doc.close();

                    setTimeout(() => {
                      iframe.contentWindow.focus();
                      iframe.contentWindow.print();
                      setTimeout(() => document.body.removeChild(iframe), 1500);
                    }, 350);
                  } catch (e) {
                    window.print();
                  }
                }}
                style={{ padding: '8px 22px', borderRadius: '6px', border: 'none', background: '#047857', color: 'white', cursor: 'pointer', fontWeight: '700', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 2px 4px rgba(4,120,87,0.3)' }}
              >
                🖨️ Print OP Pharmacy Bill
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Inpatient Add Medication Modal */}
      {selectedAdmForMedication && (
        <div className="custom-modal-overlay" style={{ zIndex: 9999 }}>
          <div className="custom-modal" style={{ maxWidth: '520px', background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px', marginBottom: '16px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', color: '#0f172a' }}>💊 Dispense Medication to Inpatient</h3>
                <span style={{ fontSize: '12px', color: '#64748b' }}>
                  Patient: <strong>{selectedAdmForMedication.patientName}</strong> ({selectedAdmForMedication.patientId}) - {selectedAdmForMedication.ward}
                </span>
              </div>
              <button 
                onClick={() => setSelectedAdmForProcessingMed(null)}
                style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#94a3b8' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddInpatientMedication} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label style={{ fontSize: '13px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '6px' }}>
                  Select Medicine from Pharmacy Stock
                </label>
                <select
                  value={medToAddForm.medId}
                  onChange={e => setMedToAddForm({ ...medToAddForm, medId: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                  required
                >
                  <option value="" disabled>-- Select Drug --</option>
                  {medications.map(m => (
                    <option key={m.id} value={m.id} disabled={m.stock <= 0}>
                      {m.name} ({m.genericName}) - ₹{parseFloat(m.price).toFixed(2)}/unit [{m.stock > 0 ? `${m.stock} in stock` : 'OUT OF STOCK'}]
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label style={{ fontSize: '13px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '6px' }}>
                    Units / Quantity Dispensed
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={medications.find(m => m.id === medToAddForm.medId)?.stock || 100}
                    value={medToAddForm.quantity}
                    onChange={e => setMedToAddForm({ ...medToAddForm, quantity: Math.max(1, parseInt(e.target.value) || 1) })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                    required
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label style={{ fontSize: '13px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '6px' }}>
                    Dosage Strength
                  </label>
                  <input
                    type="text"
                    value={medToAddForm.dosage}
                    onChange={e => setMedToAddForm({ ...medToAddForm, dosage: e.target.value })}
                    placeholder="e.g. 500mg, 1 tablet, 10ml"
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label style={{ fontSize: '13px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '6px' }}>
                    Administration Frequency
                  </label>
                  <select
                    value={medToAddForm.frequency}
                    onChange={e => setMedToAddForm({ ...medToAddForm, frequency: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                  >
                    <option value="OD (Once a day)">OD (Once a day)</option>
                    <option value="BD (Twice a day)">BD (Twice a day)</option>
                    <option value="TDS (3 times a day)">TDS (3 times a day)</option>
                    <option value="QID (4 times a day)">QID (4 times a day)</option>
                    <option value="SOS (As needed)">SOS (As needed / PRN)</option>
                    <option value="Stat (Immediate single dose)">Stat (Immediate single dose)</option>
                  </select>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label style={{ fontSize: '13px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '6px' }}>
                    Clinical Instructions
                  </label>
                  <input
                    type="text"
                    value={medToAddForm.instructions}
                    onChange={e => setMedToAddForm({ ...medToAddForm, instructions: e.target.value })}
                    placeholder="e.g. Post-meal, IV drip infusion"
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              {/* Cost Preview */}
              {medToAddForm.medId && (
                <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '12px 14px', marginTop: '4px' }}>
                  {(() => {
                    const selMed = medications.find(m => m.id === medToAddForm.medId);
                    const cost = (parseFloat(selMed?.price) || 0) * (parseInt(medToAddForm.quantity) || 1);
                    return (
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <strong style={{ color: '#166534', fontSize: '13px' }}>Dispense Cost Addition:</strong>
                          <div style={{ fontSize: '11px', color: '#15803d' }}>
                            {selMed?.name} × {medToAddForm.quantity} @ ₹{parseFloat(selMed?.price || 0).toFixed(2)}/unit
                          </div>
                        </div>
                        <div style={{ fontSize: '18px', fontWeight: '800', color: '#15803d' }}>
                          ₹{cost.toFixed(2)}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px', borderTop: '1px solid #e2e8f0', paddingTop: '14px' }}>
                <button
                  type="button"
                  onClick={() => setSelectedAdmForProcessingMed(null)}
                  style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#f8fafc', color: '#475569', cursor: 'pointer', fontWeight: '600', fontSize: '13px' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '8px 20px', borderRadius: '6px', border: 'none', background: '#10b981', color: 'white', cursor: 'pointer', fontWeight: '700', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  Confirm & Add to Bill
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
