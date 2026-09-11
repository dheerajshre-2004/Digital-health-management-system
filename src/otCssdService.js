// Operation Theatre (OT) & CSSD (Central Sterile Supply Dept) Service

export const OT_ROOMS = [
  { id: 'OT-1', name: 'Operation Theatre 1 (Cardiothoracic & Vascular)', type: 'Major OT', status: 'Available', equipment: ['Heart-Lung Machine', 'C-Arm Fluoroscopy', 'Advanced Anaesthesia Workstation', 'Defibrillator'] },
  { id: 'OT-2', name: 'Operation Theatre 2 (Neurosurgery & Spine)', type: 'Major OT', status: 'In Surgery', equipment: ['Neuro-Navigation System', 'Surgical Microscope', 'Intraoperative Neuromonitoring', 'CUSA'] },
  { id: 'OT-3', name: 'Operation Theatre 3 (Orthopedics & Joint Replacement)', type: 'Major OT (Laminar Air Flow)', status: 'Available', equipment: ['High-definition Arthroscopy Stack', 'Orthopedic Traction Table', 'C-Arm X-Ray', 'Power Drill/Saw Systems'] },
  { id: 'OT-4', name: 'Operation Theatre 4 (General, Laparoscopy & GI Surgery)', type: 'Major OT', status: 'Scheduled', equipment: ['4K Laparoscopy Tower', 'Harmonic Scalpel / Cautery', 'CO2 Insufflator', 'Endoscopy Unit'] },
  { id: 'OT-5', name: 'Emergency Trauma & Obstetrics OT', type: 'Emergency 24x7 OT', status: 'Available', equipment: ['Rapid Infuser', 'Neonatal Resuscitation Warmer', 'Obstetric Delivery Setup', 'Portable Ultrasound'] }
];

export const SURGICAL_SPECIALTIES = [
  'General Surgery',
  'Cardiovascular & Thoracic Surgery',
  'Neurosurgery & Spine',
  'Orthopedics & Joint Replacement',
  'Surgical Oncology',
  'Obstetrics & Gynecology',
  'Urology',
  'ENT & Head-Neck Surgery',
  'Pediatric Surgery',
  'Plastic & Reconstructive Surgery'
];

export const INITIAL_OT_SCHEDULE = [
  {
    bookingId: 'SURG-2026-0901',
    patientId: 'PT-80234',
    patientName: 'John Doe',
    patientAge: 45,
    patientGender: 'Male',
    patientBloodGroup: 'O+',
    otRoomId: 'OT-1',
    otRoomName: 'Operation Theatre 1 (Cardiothoracic & Vascular)',
    surgeryName: 'Off-Pump Coronary Artery Bypass Grafting (CABG)',
    specialty: 'Cardiovascular & Thoracic Surgery',
    primarySurgeon: 'Dr. Sarah Connor',
    assistantSurgeon: 'Dr. Marcus Vance',
    anesthesiologist: 'Dr. Helen Cho',
    scrubNurse: 'Sister Clara Oswald',
    scheduledDate: '2026-09-11',
    startTime: '08:30',
    endTime: '13:00',
    urgency: 'Elective (High Priority)',
    status: 'In Surgery', // 'Scheduled', 'In Pre-Op Holding', 'In Surgery', 'In PACU / Recovery', 'Transferred to ICU', 'Discharged to Ward', 'Cancelled'
    requiredTrayIds: ['TRAY-CTS-01', 'TRAY-VASC-02'],
    anesthesiaType: 'General Anesthesia (Endotracheal)',
    
    // WHO Surgical Safety Checklist (3 Phases)
    whoChecklist: {
      signIn: {
        completed: true,
        time: '08:15',
        verifiedBy: 'Sister Clara Oswald (Scrub Nurse)',
        patientIdentityAndConsentConfirmed: true,
        siteMarked: true,
        anesthesiaMachineAndMedicationCheckComplete: true,
        pulseOximeterOnAndFunctioning: true,
        knownAllergyCheckDone: true,
        difficultAirwayAspirationRiskAssessed: true,
        bloodLossRiskAssessedAndBloodArranged: true
      },
      timeOut: {
        completed: true,
        time: '08:45',
        verifiedBy: 'Dr. Sarah Connor (Primary Surgeon)',
        teamMembersIntroducedByNameAndRole: true,
        patientNameProcedureSiteReconfirmed: true,
        anticipatedCriticalStepsSurgeon: true,
        anesthesiaSpecificConcernsReviewed: true,
        sterilityIndicatorsConfirmedByNursing: true,
        equipmentIssuesOrSafetyConcernsAddressed: true,
        antibioticProphylaxisGivenWithin60Min: true,
        essentialImagingDisplayed: true
      },
      signOut: {
        completed: false,
        time: null,
        verifiedBy: null,
        procedureRecordedAsPerformed: false,
        instrumentSpongeAndNeedleCountsCorrect: false,
        specimenLabelledWithPatientName: false,
        equipmentMalfunctionToAddress: false,
        surgeonAnesthesiaNurseKeyRecoveryPlanReviewed: false
      }
    },

    // Modified Aldrete Post-Anesthesia Recovery Scoring (0-10)
    pacuRecord: {
      admissionTime: null,
      dischargeTime: null,
      pacuNurse: 'Nurse Martha Jones',
      aldreteScore: {
        activity: 2, // 2: moves 4 limbs, 1: 2 limbs, 0: 0 limbs
        respiration: 2, // 2: deep/cough, 1: dyspnea/shallow, 0: apnea
        circulation: 2, // 2: BP ±20% pre-op, 1: ±20-50%, 0: >50%
        consciousness: 2, // 2: fully awake, 1: arousable, 0: unarousable
        oxygenSaturation: 2 // 2: SpO2 >92% on room air, 1: needs O2, 0: <90%
      },
      totalScore: 10, // >= 9 required for PACU discharge
      painScoreNRS: 3, // 0-10
      dischargeDestination: 'Cardiothoracic ICU Bed 02',
      pacuNotes: 'Extubated on table. Hemodynamically stable. Minimal mediastinal drain output.'
    }
  },
  {
    bookingId: 'SURG-2026-0902',
    patientId: 'PT-10022',
    patientName: 'Kiran Deshmukh',
    patientAge: 52,
    patientGender: 'Female',
    patientBloodGroup: 'B+',
    otRoomId: 'OT-3',
    otRoomName: 'Operation Theatre 3 (Orthopedics & Joint Replacement)',
    surgeryName: 'Total Knee Arthroplasty (TKR) - Left Knee',
    specialty: 'Orthopedics & Joint Replacement',
    primarySurgeon: 'Dr. John Watson',
    assistantSurgeon: 'Dr. Alex Vance',
    anesthesiologist: 'Dr. Sameer Joshi',
    scrubNurse: 'Sister Donna Noble',
    scheduledDate: '2026-09-11',
    startTime: '14:00',
    endTime: '16:30',
    urgency: 'Elective',
    status: 'Scheduled',
    requiredTrayIds: ['TRAY-ORTH-01', 'TRAY-IMP-03'],
    anesthesiaType: 'Combined Spinal Epidural (CSE)',
    
    whoChecklist: {
      signIn: { completed: false, time: null, verifiedBy: null, patientIdentityAndConsentConfirmed: false, siteMarked: false, anesthesiaMachineAndMedicationCheckComplete: false, pulseOximeterOnAndFunctioning: false, knownAllergyCheckDone: false, difficultAirwayAspirationRiskAssessed: false, bloodLossRiskAssessedAndBloodArranged: false },
      timeOut: { completed: false, time: null, verifiedBy: null, teamMembersIntroducedByNameAndRole: false, patientNameProcedureSiteReconfirmed: false, anticipatedCriticalStepsSurgeon: false, anesthesiaSpecificConcernsReviewed: false, sterilityIndicatorsConfirmedByNursing: false, equipmentIssuesOrSafetyConcernsAddressed: false, antibioticProphylaxisGivenWithin60Min: false, essentialImagingDisplayed: false },
      signOut: { completed: false, time: null, verifiedBy: null, procedureRecordedAsPerformed: false, instrumentSpongeAndNeedleCountsCorrect: false, specimenLabelledWithPatientName: false, equipmentMalfunctionToAddress: false, surgeonAnesthesiaNurseKeyRecoveryPlanReviewed: false }
    },
    pacuRecord: {
      admissionTime: null,
      dischargeTime: null,
      pacuNurse: null,
      aldreteScore: { activity: 0, respiration: 0, circulation: 0, consciousness: 0, oxygenSaturation: 0 },
      totalScore: 0,
      painScoreNRS: 0,
      dischargeDestination: 'Orthopedic Post-Op Ward Bed 12',
      pacuNotes: ''
    }
  }
];

export const INITIAL_CSSD_TRAYS = [
  {
    trayId: 'TRAY-CTS-01',
    trayName: 'Major Open Heart & Sternotomy Set',
    department: 'Cardiovascular Surgery',
    instrumentCount: 68,
    sterilizationMethod: 'Steam Autoclave (Class B - 134°C / 30 psi)',
    machineId: 'AUTOCLAVE-01',
    sterilizedDate: '2026-09-10 16:00',
    expiryDate: '2026-09-17 16:00', // 7 days sterility shelf life
    status: 'Sterile & Ready', // 'Decontaminated', 'Packaging & Assembly', 'Undergoing Sterilization', 'Sterile & Ready', 'Issued to OT', 'Used - Pending Cleaning'
    biAndCiValidation: 'Passed (Class 5 Chemical Indicator Turned Black / Biological Spore Test Negative)',
    sterilizedBy: 'CSSD Specialist Robert Lang',
    assignedOT: 'OT-1'
  },
  {
    trayId: 'TRAY-VASC-02',
    trayName: 'Peripheral Vascular & Micro-Graft Clamps Set',
    department: 'Vascular Surgery',
    instrumentCount: 42,
    sterilizationMethod: 'Steam Autoclave (134°C)',
    machineId: 'AUTOCLAVE-01',
    sterilizedDate: '2026-09-10 18:30',
    expiryDate: '2026-09-17 18:30',
    status: 'Sterile & Ready',
    biAndCiValidation: 'Passed (Class 5 Chemical Indicator Validated)',
    sterilizedBy: 'CSSD Specialist Robert Lang',
    assignedOT: 'OT-1'
  },
  {
    trayId: 'TRAY-ORTH-01',
    trayName: 'Total Knee & Hip Arthroplasty Power Tools Set',
    department: 'Orthopedics',
    instrumentCount: 54,
    sterilizationMethod: 'Steam Autoclave (134°C)',
    machineId: 'AUTOCLAVE-02',
    sterilizedDate: '2026-09-10 20:00',
    expiryDate: '2026-09-17 20:00',
    status: 'Sterile & Ready',
    biAndCiValidation: 'Passed (Biological Spore Ampoule Negative at 24h)',
    sterilizedBy: 'CSSD Specialist Robert Lang',
    assignedOT: 'OT-3'
  },
  {
    trayId: 'TRAY-LAP-04',
    trayName: '4K Laparoscopy HD Camera, Trocars & Telescopes',
    department: 'Laparoscopic Surgery',
    instrumentCount: 28,
    sterilizationMethod: 'Low-Temp Hydrogen Peroxide Gas Plasma (Sterrad)',
    machineId: 'PLASMA-STERRAD-01',
    sterilizedDate: '2026-09-11 06:00',
    expiryDate: '2026-09-18 06:00',
    status: 'Sterile & Ready',
    biAndCiValidation: 'Passed (Chemical Strip Verified)',
    sterilizedBy: 'CSSD Tech Emily Blunt',
    assignedOT: 'OT-4'
  },
  {
    trayId: 'TRAY-NEURO-02',
    trayName: 'Microsurgical Cranio-Spine Dissectors & Bipolar Forceps',
    department: 'Neurosurgery',
    instrumentCount: 36,
    sterilizationMethod: 'Steam Autoclave (134°C)',
    machineId: 'AUTOCLAVE-02',
    sterilizedDate: '2026-09-02 10:00',
    expiryDate: '2026-09-09 10:00', // Expired tray example for CSSD re-sterilization audit
    status: 'Used - Pending Cleaning',
    biAndCiValidation: 'Re-sterilization required (Sterility wrapper integrity expired)',
    sterilizedBy: 'CSSD Specialist Robert Lang',
    assignedOT: null
  }
];

export const INITIAL_CSSD_AUTOCLAVE_CYCLES = [
  {
    cycleId: 'CYCLE-2026-881',
    machineId: 'AUTOCLAVE-01 (Getinge Dual Door)',
    cycleType: 'Porous / Solid Goods 134°C (3.5 Bar)',
    startTime: '2026-09-10 15:15',
    endTime: '2026-09-10 16:00',
    peakTemperature: '134.8°C',
    holdingTimeMin: '7.5 mins',
    vacuumTestResult: 'Passed (Leak rate 0.4 mbar/min < 1.3 max)',
    bowieDickTest: 'Passed (Uniform color transition)',
    biologicalIndicator: 'Geo. stearothermophilus Spore Negative at 24h',
    operatorName: 'Robert Lang',
    status: 'Cycle Approved'
  },
  {
    cycleId: 'CYCLE-2026-882',
    machineId: 'PLASMA-STERRAD-01 (H2O2 Gas Plasma)',
    cycleType: 'Low Temperature Lumen Cycle (50°C)',
    startTime: '2026-09-11 05:10',
    endTime: '2026-09-11 06:00',
    peakTemperature: '52.1°C',
    holdingTimeMin: '45 mins',
    vacuumTestResult: 'Passed',
    bowieDickTest: 'N/A (Plasma)',
    biologicalIndicator: 'B. atrophaeus Spore Negative',
    operatorName: 'Emily Blunt',
    status: 'Cycle Approved'
  }
];

// Helper Functions
export function getOtSchedule() {
  const data = localStorage.getItem('dhms_ot_schedule');
  if (data) {
    try {
      return JSON.parse(data);
    } catch (e) {
      console.error(e);
    }
  }
  localStorage.setItem('dhms_ot_schedule', JSON.stringify(INITIAL_OT_SCHEDULE));
  return INITIAL_OT_SCHEDULE;
}

export function saveOtSchedule(schedule) {
  localStorage.setItem('dhms_ot_schedule', JSON.stringify(schedule));
}

export function getCssdTrays() {
  const data = localStorage.getItem('dhms_cssd_trays');
  if (data) {
    try {
      return JSON.parse(data);
    } catch (e) {
      console.error(e);
    }
  }
  localStorage.setItem('dhms_cssd_trays', JSON.stringify(INITIAL_CSSD_TRAYS));
  return INITIAL_CSSD_TRAYS;
}

export function saveCssdTrays(trays) {
  localStorage.setItem('dhms_cssd_trays', JSON.stringify(trays));
}

export function getCssdCycles() {
  const data = localStorage.getItem('dhms_cssd_cycles');
  if (data) {
    try {
      return JSON.parse(data);
    } catch (e) {
      console.error(e);
    }
  }
  localStorage.setItem('dhms_cssd_cycles', JSON.stringify(INITIAL_CSSD_AUTOCLAVE_CYCLES));
  return INITIAL_CSSD_AUTOCLAVE_CYCLES;
}

export function saveCssdCycles(cycles) {
  localStorage.setItem('dhms_cssd_cycles', JSON.stringify(cycles));
}

// Conflict detector: Checks if OT room or surgeon is already booked in an overlapping time window
export function checkOtConflict(newBooking, existingSchedule) {
  const parseMinutes = (timeStr) => {
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
  };

  const newStart = parseMinutes(newBooking.startTime);
  const newEnd = parseMinutes(newBooking.endTime);

  for (const item of existingSchedule) {
    // Skip cancelled or completed surgeries or checking against itself
    if (item.bookingId === newBooking.bookingId || item.status === 'Cancelled' || item.status === 'Discharged to Ward') {
      continue;
    }

    if (item.scheduledDate === newBooking.scheduledDate) {
      const itemStart = parseMinutes(item.startTime);
      const itemEnd = parseMinutes(item.endTime);

      // Check time overlap
      const hasTimeOverlap = (newStart < itemEnd && newEnd > itemStart);

      if (hasTimeOverlap) {
        if (item.otRoomId === newBooking.otRoomId) {
          return {
            conflict: true,
            type: 'ROOM_OCCUPIED',
            message: `Conflict Detected: ${item.otRoomName} is already booked for "${item.surgeryName}" from ${item.startTime} to ${item.endTime}.`
          };
        }

        if (item.primarySurgeon.toLowerCase() === newBooking.primarySurgeon.toLowerCase()) {
          return {
            conflict: true,
            type: 'SURGEON_BUSY',
            message: `Surgeon Conflict: ${item.primarySurgeon} is already scheduled in ${item.otRoomName} from ${item.startTime} to ${item.endTime}.`
          };
        }
      }
    }
  }

  return { conflict: false };
}
