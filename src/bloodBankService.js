// Blood Bank and Transfusion Management Service

export const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export const COMPONENT_TYPES = [
  { id: 'PRBC', name: 'Packed Red Blood Cells (PRBC)', shelfLifeDays: 42, defaultTemp: '2°C to 6°C', cost: 1450 },
  { id: 'WB', name: 'Whole Blood', shelfLifeDays: 35, defaultTemp: '2°C to 6°C', cost: 1200 },
  { id: 'FFP', name: 'Fresh Frozen Plasma (FFP)', shelfLifeDays: 365, defaultTemp: '-18°C or colder', cost: 950 },
  { id: 'PLT', name: 'Platelet Concentrate (RDP)', shelfLifeDays: 5, defaultTemp: '20°C to 24°C (Agitated)', cost: 800 },
  { id: 'SDP', name: 'Single Donor Platelets (SDP / Apheresis)', shelfLifeDays: 5, defaultTemp: '20°C to 24°C (Agitated)', cost: 9500 },
  { id: 'CRYO', name: 'Cryoprecipitate Antihemophilic Factor', shelfLifeDays: 365, defaultTemp: '-18°C or colder', cost: 1100 }
];

// Compatibility matrix for Red Cells / Whole Blood
export const RBC_COMPATIBILITY = {
  'O-': ['O-'],
  'O+': ['O-', 'O+'],
  'A-': ['O-', 'A-'],
  'A+': ['O-', 'O+', 'A-', 'A+'],
  'B-': ['O-', 'B-'],
  'B+': ['O-', 'O+', 'B-', 'B+'],
  'AB-': ['O-', 'A-', 'B-', 'AB-'],
  'AB+': ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+']
};

// Compatibility matrix for Plasma (FFP / Cryo) - Inverted
export const PLASMA_COMPATIBILITY = {
  'O-': ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'],
  'O+': ['O+', 'A+', 'B+', 'AB+'],
  'A-': ['A-', 'A+', 'AB-', 'AB+'],
  'A+': ['A+', 'AB+'],
  'B-': ['B-', 'B+', 'AB-', 'AB+'],
  'B+': ['B+', 'AB+'],
  'AB-': ['AB-', 'AB+'],
  'AB+': ['AB+']
};

export const INITIAL_BLOOD_STOCK = [
  {
    bagNumber: 'BB-2026-00101',
    bloodGroup: 'O+',
    component: 'Packed Red Blood Cells (PRBC)',
    componentCode: 'PRBC',
    volumeMl: 350,
    donorId: 'DNR-501',
    donorName: 'Rahul Verma',
    collectedDate: '2026-08-20',
    expiryDate: '2026-10-01',
    storageLocation: 'Refrigerator Unit 1 - Shelf A',
    serologyScreening: 'Negative (HIV/HBsAg/HCV/VDRL/MP Clear)',
    status: 'Available', // 'Available', 'Reserved', 'Cross-Matched', 'Transfused', 'Discarded'
    discardReason: null,
    reservedForPatientId: null,
    reservedForPatientName: null
  },
  {
    bagNumber: 'BB-2026-00102',
    bloodGroup: 'O-',
    component: 'Packed Red Blood Cells (PRBC)',
    componentCode: 'PRBC',
    volumeMl: 350,
    donorId: 'DNR-502',
    donorName: 'Dr. Sameer Joshi',
    collectedDate: '2026-08-25',
    expiryDate: '2026-10-06',
    storageLocation: 'Refrigerator Unit 1 - Shelf A (Universal Emergency)',
    serologyScreening: 'Negative (HIV/HBsAg/HCV/VDRL/MP Clear)',
    status: 'Available',
    discardReason: null,
    reservedForPatientId: null,
    reservedForPatientName: null
  },
  {
    bagNumber: 'BB-2026-00103',
    bloodGroup: 'A+',
    component: 'Packed Red Blood Cells (PRBC)',
    componentCode: 'PRBC',
    volumeMl: 350,
    donorId: 'DNR-503',
    donorName: 'Ananya Sharma',
    collectedDate: '2026-08-18',
    expiryDate: '2026-09-29',
    storageLocation: 'Refrigerator Unit 1 - Shelf B',
    serologyScreening: 'Negative (HIV/HBsAg/HCV/VDRL/MP Clear)',
    status: 'Available',
    discardReason: null,
    reservedForPatientId: null,
    reservedForPatientName: null
  },
  {
    bagNumber: 'BB-2026-00104',
    bloodGroup: 'B+',
    component: 'Fresh Frozen Plasma (FFP)',
    componentCode: 'FFP',
    volumeMl: 220,
    donorId: 'DNR-504',
    donorName: 'Vikram Patel',
    collectedDate: '2026-06-10',
    expiryDate: '2027-06-10',
    storageLocation: 'Deep Freezer Unit 2 (-30°C)',
    serologyScreening: 'Negative (HIV/HBsAg/HCV/VDRL/MP Clear)',
    status: 'Available',
    discardReason: null,
    reservedForPatientId: null,
    reservedForPatientName: null
  },
  {
    bagNumber: 'BB-2026-00105',
    bloodGroup: 'AB+',
    component: 'Platelet Concentrate (RDP)',
    componentCode: 'PLT',
    volumeMl: 55,
    donorId: 'DNR-505',
    donorName: 'Kavita Sundaram',
    collectedDate: '2026-09-08',
    expiryDate: '2026-09-13', // Nearing expiry in 2 days
    storageLocation: 'Platelet Agitator Unit 1 (22°C)',
    serologyScreening: 'Negative (HIV/HBsAg/HCV/VDRL/MP Clear)',
    status: 'Available',
    discardReason: null,
    reservedForPatientId: null,
    reservedForPatientName: null
  },
  {
    bagNumber: 'BB-2026-00106',
    bloodGroup: 'O+',
    component: 'Cryoprecipitate Antihemophilic Factor',
    componentCode: 'CRYO',
    volumeMl: 20,
    donorId: 'DNR-506',
    donorName: 'Harish Nair',
    collectedDate: '2026-05-15',
    expiryDate: '2027-05-15',
    storageLocation: 'Deep Freezer Unit 2 (-30°C)',
    serologyScreening: 'Negative (HIV/HBsAg/HCV/VDRL/MP Clear)',
    status: 'Available',
    discardReason: null,
    reservedForPatientId: null,
    reservedForPatientName: null
  },
  {
    bagNumber: 'BB-2026-00107',
    bloodGroup: 'A-',
    component: 'Packed Red Blood Cells (PRBC)',
    componentCode: 'PRBC',
    volumeMl: 350,
    donorId: 'DNR-507',
    donorName: 'Pooja Hegde',
    collectedDate: '2026-08-01',
    expiryDate: '2026-09-12', // Critical: Expiring tomorrow
    storageLocation: 'Refrigerator Unit 1 - Shelf C',
    serologyScreening: 'Negative (HIV/HBsAg/HCV/VDRL/MP Clear)',
    status: 'Available',
    discardReason: null,
    reservedForPatientId: null,
    reservedForPatientName: null
  },
  {
    bagNumber: 'BB-2026-00108',
    bloodGroup: 'B-',
    component: 'Whole Blood',
    componentCode: 'WB',
    volumeMl: 450,
    donorId: 'DNR-508',
    donorName: 'Rohan Gupta',
    collectedDate: '2026-07-28',
    expiryDate: '2026-09-01', // Already expired example for wastage tracking
    storageLocation: 'Quarantine Chamber',
    serologyScreening: 'Negative',
    status: 'Discarded',
    discardReason: 'Shelf-life expired before issue (Expired on 2026-09-01)',
    reservedForPatientId: null,
    reservedForPatientName: null
  }
];

export const INITIAL_DONORS = [
  {
    donorId: 'DNR-501',
    name: 'Rahul Verma',
    age: 29,
    gender: 'Male',
    bloodGroup: 'O+',
    phone: '+91 98450 11223',
    email: 'rahul.verma@example.com',
    weightKg: 72,
    hemoglobinGdl: 14.5,
    lastDonatedDate: '2026-08-20',
    eligibilityStatus: 'Eligible (Next donation after 2026-11-20)',
    totalDonations: 4,
    address: 'Indiranagar, Bengaluru'
  },
  {
    donorId: 'DNR-502',
    name: 'Dr. Sameer Joshi',
    age: 38,
    gender: 'Male',
    bloodGroup: 'O-',
    phone: '+91 98765 43210',
    email: 'dr.sameer@dhms.org',
    weightKg: 68,
    hemoglobinGdl: 15.2,
    lastDonatedDate: '2026-08-25',
    eligibilityStatus: 'Eligible (Next donation after 2026-11-25)',
    totalDonations: 9,
    address: 'Koramangala, Bengaluru'
  },
  {
    donorId: 'DNR-503',
    name: 'Ananya Sharma',
    age: 26,
    gender: 'Female',
    bloodGroup: 'A+',
    phone: '+91 99123 44556',
    email: 'ananya.s@example.com',
    weightKg: 58,
    hemoglobinGdl: 13.0,
    lastDonatedDate: '2026-08-18',
    eligibilityStatus: 'Eligible (Next donation after 2026-12-18)',
    totalDonations: 2,
    address: 'Jayanagar, Bengaluru'
  },
  {
    donorId: 'DNR-504',
    name: 'Vikram Patel',
    age: 33,
    gender: 'Male',
    bloodGroup: 'B+',
    phone: '+91 98888 77665',
    email: 'vikram.patel@example.com',
    weightKg: 80,
    hemoglobinGdl: 14.8,
    lastDonatedDate: '2026-06-10',
    eligibilityStatus: 'Eligible for donation now',
    totalDonations: 6,
    address: 'Whitefield, Bengaluru'
  },
  {
    donorId: 'DNR-505',
    name: 'Kavita Sundaram',
    age: 31,
    gender: 'Female',
    bloodGroup: 'AB+',
    phone: '+91 97766 55443',
    email: 'kavita.sun@example.com',
    weightKg: 62,
    hemoglobinGdl: 13.4,
    lastDonatedDate: '2026-09-08',
    eligibilityStatus: 'Eligible (Apheresis donor)',
    totalDonations: 3,
    address: 'Malleshwaram, Bengaluru'
  }
];

export const INITIAL_TRANSFUSIONS = [
  {
    requestId: 'TXR-8001',
    patientId: 'PT-80234',
    patientName: 'John Doe',
    patientBloodGroup: 'O+',
    recipientWard: 'ICU Bed 04',
    attendingDoctor: 'Dr. Marcus Vance',
    requiredComponent: 'Packed Red Blood Cells (PRBC)',
    componentCode: 'PRBC',
    unitsRequested: 1,
    urgencyLevel: 'Emergency (Urgent within 1 hour)',
    clinicalIndication: 'Acute gastrointestinal bleeding and severe anemia (Hb 6.8 g/dL)',
    requestDate: '2026-09-10 18:30',
    crossMatchStatus: 'Compatible (Major & Minor Cross-Match Passed)',
    crossMatchedBy: 'Dr. Alex Vance (Pathology)',
    crossMatchDate: '2026-09-10 19:15',
    assignedBagNumber: 'BB-2026-00101',
    verificationChecks: {
      patientIdentityConfirmed: true,
      bloodBagBarcodeScanned: true,
      expiryVerified: true,
      doctorCrossMatchConsent: true,
      dualNurseBedsideVerification: true
    },
    transfusionStatus: 'Issued & In Progress', // 'Requested', 'Cross-Matched & Approved', 'Issued & In Progress', 'Transfusion Completed', 'Adverse Reaction Reported'
    vitalSignsPreTransfusion: { bp: '110/70', pulse: '92', temp: '98.4°F', spo2: '97%' },
    adverseReactions: 'None reported during 15-min bedside observation'
  }
];

export function getBloodStock() {
  const data = localStorage.getItem('dhms_blood_stock');
  if (data) {
    try {
      return JSON.parse(data);
    } catch (e) {
      console.error(e);
    }
  }
  localStorage.setItem('dhms_blood_stock', JSON.stringify(INITIAL_BLOOD_STOCK));
  return INITIAL_BLOOD_STOCK;
}

export function saveBloodStock(stock) {
  localStorage.setItem('dhms_blood_stock', JSON.stringify(stock));
}

export function getBloodDonors() {
  const data = localStorage.getItem('dhms_blood_donors');
  if (data) {
    try {
      return JSON.parse(data);
    } catch (e) {
      console.error(e);
    }
  }
  localStorage.setItem('dhms_blood_donors', JSON.stringify(INITIAL_DONORS));
  return INITIAL_DONORS;
}

export function saveBloodDonors(donors) {
  localStorage.setItem('dhms_blood_donors', JSON.stringify(donors));
}

export function getTransfusionRequests() {
  const data = localStorage.getItem('dhms_transfusion_requests');
  if (data) {
    try {
      return JSON.parse(data);
    } catch (e) {
      console.error(e);
    }
  }
  localStorage.setItem('dhms_transfusion_requests', JSON.stringify(INITIAL_TRANSFUSIONS));
  return INITIAL_TRANSFUSIONS;
}

export function saveTransfusionRequests(requests) {
  localStorage.setItem('dhms_transfusion_requests', JSON.stringify(requests));
}

// Function to calculate expiry days left
export function getDaysToExpiry(expiryDateStr) {
  if (!expiryDateStr) return 0;
  const exp = new Date(expiryDateStr);
  const today = new Date('2026-09-11'); // using system baseline or new Date()
  const diffTime = exp.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

// Function to validate compatibility
export function validateBloodCompatibility(patientGroup, donorBagGroup, componentCode) {
  if (!patientGroup || !donorBagGroup) return false;
  const isPlasma = componentCode === 'FFP' || componentCode === 'CRYO';
  const table = isPlasma ? PLASMA_COMPATIBILITY : RBC_COMPATIBILITY;
  const compatibleDonors = table[patientGroup] || [];
  return compatibleDonors.includes(donorBagGroup);
}
