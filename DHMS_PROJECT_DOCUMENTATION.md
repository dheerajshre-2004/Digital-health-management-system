# Digital Health Management System (DHMS)
## Comprehensive Project Documentation, Architecture, Module Breakdown & Future Roadmap

---

### Executive Summary
The **Digital Health Management System (DHMS)** is an enterprise-grade, cloud-synchronized Hospital Information Management System (HIMS) and Telemedicine platform. It connects healthcare administrators, clinicians, front-desk staff, diagnostics, pharmacy, finance, surgery teams, insurance providers, and patients into a unified digital ecosystem.

DHMS replaces traditional paper-based hospital workflows with an end-to-end digital lifecycle:
$$\text{Patient Onboarding} \longrightarrow \text{Clinical Triage} \longrightarrow \text{Consultation / Telehealth} \longrightarrow \text{Laboratory \& Diagnostics} \longrightarrow \text{Pharmacy Fulfillment} \longrightarrow \text{Inpatient Ward / OT} \longrightarrow \text{Cashless Insurance \& Billing} \longrightarrow \text{Discharge \& Patient Self-Care}$$

---

## 1. System Architecture & Technology Stack

```
                               ┌──────────────────────────────────────────────┐
                               │               CLIENT APPLICATIONS            │
                               ├──────────────────────┬───────────────────────┤
                               │     Staff Portal     │    Patient Portal     │
                               │   (Hospital Staff)   │  (Citizen / Patient)  │
                               └───────────┬──────────┴───────────┬───────────┘
                                           │                      │
                                           ▼                      ▼
┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                          CORE APPLICATION LAYER                                         │
│                                           (React 19 + Vite)                                            │
├─────────────────┬─────────────────┬──────────────────┬──────────────────┬──────────────────────────────┤
│ Admin & Finance │ Doctor & Clinic │ Front-Desk / OPD │ Lab & Diagnostics│ Pharmacy & Inventory         │
│ Bed Management  │ Blood Bank      │ OT & Sterilize   │ TPA Insurance    │ WebRTC Telemedicine Engine   │
└─────────────────┴─────────────────┴──────────────────┴──────────────────┴──────────────────────────────┘
                                           │                      │
                                           ▼                      ▼
┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                       COMMUNICATION & DATA LAYER                                       │
├─────────────────────────────────────────────┬──────────────────────────────────────────────────────────┤
│             Supabase Cloud DB               │                   Native Browser APIs                    │
│   • PostgreSQL Real-time Database Engine    │   • WebRTC Peer-to-Peer Video & Audio Streams            │
│   • Key-Value Cloud Store (dhms_store)      │   • Web Audio API & Notification Subsystems              │
│   • Background Auto-Sync Service            │   • Local Storage Resilience Caching                     │
└─────────────────────────────────────────────┴──────────────────────────────────────────────────────────┘
```

### Technology Breakdown
- **Frontend Core**: React 19, JavaScript (ESNext), Vite build toolchain.
- **Styling Architecture**: Custom modular CSS design system, CSS Variables, glassmorphic card elements, high-contrast accessible typography.
- **Database & Real-time Layer**: Supabase (Cloud PostgreSQL) with real-time replication channels via `supabaseSync.js`.
- **Peer-to-Peer Telemedicine**: WebRTC (`RTCPeerConnection`, `getUserMedia`, ICE candidate negotiation) with custom Supabase signaling channel.
- **Microservices**:
  - `telemedicineService.js`: Session initiation, audio cues, signaling, peer connections.
  - `emailService.js`: HTML email templates for welcome credentials and invoices.
  - `i18nService.js`: Multi-language dictionary and localized UI rendering.
  - `payrollService.js`: Salary structure calculations, deductions, and pay slip formatting.
  - `bloodBankService.js`: Blood inventory auditing and donor eligibility validation.
  - `otCssdService.js`: Sterilization cycle monitoring and OT room scheduling.

---

## 2. Exhaustive Module Breakdown & Technical Capabilities

---

### Module 1: Executive Governance & Admin Dashboard (`Dashboard.jsx`)
* **Target Audience**: Hospital Directors, Medical Superintendents, Operations Managers.
* **Core Responsibilities**: System-wide governance, workforce administration, bed allocation, and institution-level reporting.
* **Key Features**:
  1. **Real-time KPI Dashboard**: Active occupancy rate, daily OPD patient count, gross hospital revenue, pending accounts receivable, and on-duty staff counters.
  2. **Staff Lifecycle Management**: Provision, roster, and maintain credential access for Doctors, Receptionists, Pharmacists, Lab Pathologists, Cashiers, and TPA Agents.
  3. **Departmental Roster System**: Schedule physician shifts, department allocations (Cardiology, Orthopedics, Pediatrics, General Medicine), and consultation fee schedules.
  4. **Payroll & Attendance Engine**: Salary scale configurations, bonus/deduction allocations, and instant PDF-formatted pay slip dispatch.
  5. **Bed & Ward Master**: Hospital-wide layout manager with status triggers (Occupied, Cleaning, Sanitized, Ready).

---

### Module 2: Doctor Clinical Console & Electronic Health Records (`Dashboard.jsx`)
* **Target Audience**: Chief Physicians, Surgeons, Duty Doctors, Medical Officers.
* **Core Responsibilities**: Patient consultation, clinical examination, e-prescribing, lab requisitions, and inpatient admissions.
* **Key Features**:
  1. **Live OPD Queue**: Real-time queue showing scheduled and walk-in patients, triage vital flags, and waiting durations.
  2. **Electronic Health Records (EHR)**: Full patient medical history timeline, allergy warnings, chronic illness tracking, and past consultation notes.
  3. **Smart E-Prescription Builder**: Dynamic drug finder with auto-dosage selection (e.g., *1-0-1 After Meals*), duration, and pharmacist notes.
  4. **Diagnostic Test Requisition**: One-click order placement for Hematology, Biochemistry, Radiology, and Microbiology tests with urgency priority (*Routine / Stat / Urgent*).
  5. **IPD Admission / Discharge Workflow**: Direct patient admission to specialty wards or approval of clinical discharge orders (*Fit for Discharge*).
  6. **Integrated HD Teleconsultation**: Browser-based WebRTC video consultations with live clinical note-taking and digital prescription dispatch.

---

### Module 3: Front Desk, Registration & Reception (`ReceptionistDashboard.jsx`)
* **Target Audience**: Front-Desk Executives, Triage Nurses, Hospital Concierge.
* **Core Responsibilities**: Patient onboarding, appointment scheduling, triage recording, and visitor coordination.
* **Key Features**:
  1. **Instant Patient Registration**: Generates Unique Health Identification numbers (`PT-XXXXX`) and auto-generated secure passcodes.
  2. **Automated Notification Dispatch**: Automatic welcome email dispatch with portal login link and passcodes.
  3. **Appointment Scheduling**: Multi-doctor appointment booking matrix for both physical OPD visits and virtual telehealth calls.
  4. **Vitals Recording & Triage Station**: Captures Blood Pressure (systolic/diastolic), Heart Rate, Body Temperature, SpO2, Respiratory Rate, and BMI calculation.
  5. **Visitor Management & Bed Query**: Ward allocation lookup and active inpatient visitor pass tracking.

---

### Module 4: Central Cash Counter, Billing & Tally General Ledger (`CashCounterDashboard.jsx`)
* **Target Audience**: Cashiers, Hospital Accountants, Finance Officers.
* **Core Responsibilities**: Revenue collection, unified invoice generation, payment reconciliation, and accounting.
* **Key Features**:
  1. **Automated Master Invoice Generator**: Consolidates Doctor Consultation Fees, Lab Investigation Charges, Pharmacy Dispatches, Bed Days, and Nursing Fees into a single invoice.
  2. **Multi-Mode Payment Acceptance**: Supports Cash, UPI/QR Code, Credit/Debit Cards, NetBanking, and TPA Cashless Deductions.
  3. **Inpatient Final Settlement**: Complete discharge financial clearance with deposit deductions and itemized final bills.
  4. **Thermal & Standard Print System**: Printable tax invoices compliant with GST guidelines, featuring doctor details and hospital seal stamps.
  5. **Cashier Shift Closure Log**: Shift handover tracking with cash drawer reconciliation (*Physical Cash vs System Recorded Cash*).
  6. **Double-Entry Tally General Ledger**: Complete financial audit trail with ledger head filters, date-range summaries, and spreadsheet export.

---

### Module 5: Pharmacy & Medicine Inventory Management (`PharmacistDashboard.jsx`)
* **Target Audience**: Chief Pharmacists, Dispensing Chemists, Store Keepers.
* **Core Responsibilities**: Prescription fulfillment, inventory management, batch expiry tracking, and stock procurement.
* **Key Features**:
  1. **Real-time Prescription Queue**: Instant sync when a doctor prescribes medication, eliminating handwritten prescription errors.
  2. **Dispensing & POS Billing**: Batch selection, quantity validation, discount application, and automatic forwarding to Central Billing.
  3. **Inventory & Near-Expiry Alerts**: Real-time stock counters with color-coded alerts for low stock (<20 units) and medicines approaching expiry within 60 days.
  4. **Medicine Master Database**: Comprehensive drug catalog featuring generic composition, brand names, unit costs, and storage guidelines (e.g., Cold Chain $2^\circ-8^\circ\text{C}$).

---

### Module 6: Laboratory Information Management System / LIMS (`LaboratoryDashboard.jsx`)
* **Target Audience**: Lab Technicians, Pathologists, Microbiologists, Radiologists.
* **Core Responsibilities**: Diagnostic order processing, sample tracking, test parameter measurement, and digital report publishing.
* **Key Features**:
  1. **Requisition Queue**: Tracks incoming doctor lab requests with priority markers (*Routine vs Stat*).
  2. **Sample Tracking**: Barcode reference generation, sample collection verification, and technician assignment.
  3. **Dynamic Parameter Form**: Flexible result entry for CBC, Lipid Profile, LFT, KFT, Urine Analysis, and Imaging with reference range comparisons.
  4. **Abnormal Value Flagging**: Highlights values outside standard biological reference ranges (High/Low) to assist clinicians.
  5. **Digital Verification & Instant Publishing**: Verified lab reports are immediately accessible in the Patient Portal and Doctor Console.

---

### Module 7: Inpatient Ward & Bed Capacity Management (`BedManagementModal.jsx`)
* **Target Audience**: Floor Supervisors, Nursing Staff, Ward In-Charges.
* **Core Responsibilities**: Real-time hospital occupancy monitoring, ward layout allocation, and patient bed transfers.
* **Key Features**:
  1. **Visual Ward Grid**: Interactive color-coded map for General Ward, Semi-Private, Deluxe, ICU, PICU, and Post-Op beds.
  2. **Bed Status Lifecycle**: Tracks bed states through *Vacant -> Occupied -> Under Sanitization -> Ready*.
  3. **Patient Transfer Matrix**: Intra-hospital transfers (e.g., ICU to General Ward) with automated per-day tariff recalculation.

---

### Module 8: Blood Bank & Transfusion Services (`BloodBank.jsx`)
* **Target Audience**: Blood Bank Officers, Transfusion Specialists, Emergency Teams.
* **Core Responsibilities**: Blood stock auditing, voluntary donor registration, screening, and transfusion compatibility.
* **Key Features**:
  1. **Blood Group Stock Monitoring**: Real-time bag counters for A+, A-, B+, B-, AB+, AB-, O+, O- and component fractions (Packed RBCs, Platelets, Fresh Frozen Plasma).
  2. **Donor Screening & Registry**: Records hemoglobin levels, donor health history, donation intervals, and deferred donor logs.
  3. **Cross-Match & Issue Verification**: Cross-matching validation prior to emergency blood bag release to OT or ICU.

---

### Module 9: Operation Theatre (OT) & CSSD Sterilization (`OperationTheatre.jsx`)
* **Target Audience**: OT Managers, Chief Surgeons, Anesthetists, Scrub Nurses.
* **Core Responsibilities**: Surgical suite scheduling, team assignments, and sterile instrument logistics.
* **Key Features**:
  1. **Surgical Suite Scheduler**: Manages OT room reservations, operation duration, and patient readiness.
  2. **Surgical Team Roster**: Assigns Lead Surgeon, Assistant Surgeon, Anesthetist, and Scrub Team.
  3. **Peri-Operative Patient Flow**: Multi-stage tracking: *Pre-Op Preparation -> Surgery in Progress -> PACU Recovery -> Ward Handover*.
  4. **CSSD Cycle Tracker**: Monitors autoclave cycles, chemical sterilization indicators, tray expiry dates, and instrument sets.

---

### Module 10: Third-Party Administrator (TPA) & Health Insurance (`InsuranceDashboard.jsx`)
* **Target Audience**: TPA Desk Officers, Insurance Claim Coordinators, Billing Analysts.
* **Core Responsibilities**: Cashless policy verification, pre-authorization requests, claim documentation, and claim settlement.
* **Key Features**:
  1. **Pre-Authorization Workflow**: Pre-auth request submission to insurance providers with diagnosis codes and estimated tariffs.
  2. **Claim Lifecycle Monitoring**: Real-time tracking through stages: *Submitted -> Queries Raised -> Approved -> Settled / Rejected*.
  3. **Co-Pay & Deductible Split**: Calculates approved claim amount vs patient liability to reflect directly on final cashier bills.

---

### Module 11: Patient Empowerment & Self-Service Portal (`PatientDashboard.jsx`)
* **Target Audience**: Patients, Family Caregivers, Citizens.
* **Core Responsibilities**: Personal Health Record (PHR) access, appointment booking, telehealth access, and medication adherence.
* **Key Features**:
  1. **Digital Health Identity**: Patient Card displaying Unique Health ID (UHID), Emergency Contacts, and QR Code verification.
  2. **Doctor Appointments & Telemedicine**: Direct booking of physical appointments or joining live WebRTC teleconsultations directly in browser.
  3. **Electronic Medical Records**: Access past clinical notes, doctor prescriptions, and downloadable diagnostic lab reports.
  4. **Pill Tracker (`PillTracker.jsx`)**: Smart daily medication tracker with dosage time slots and adherence checkmarks.
  5. **Invoices & Receipts**: View and download official hospital tax invoices and payment receipts.
  6. **Multi-Language Accessibility (`LanguageSelector.jsx`)**: Instant translation between English, Hindi, Kannada, Tamil, and regional languages.

---

## 3. Data Flow & Inter-Module Synchronization

```
                                  [ Patient Registers at Reception ]
                                                  │
                                                  ▼
                                      [ Vitals Recorded at Triage ]
                                                  │
                                                  ▼
                                 [ Doctor Clinical Consultation ]
                                                  │
                    ┌─────────────────────────────┼─────────────────────────────┐
                    │                             │                             │
                    ▼                             ▼                             ▼
         [ E-Prescription ]              [ Diagnostic Order ]           [ IPD Admission Order ]
                    │                             │                             │
                    ▼                             ▼                             ▼
        { Pharmacy Dispense }           { Laboratory LIMS }            { Ward / Bed Management }
                    │                             │                             │
                    └─────────────────────────────┼─────────────────────────────┘
                                                  │
                                                  ▼
                                    [ Central Cash Counter ]
                                  (Aggregated Hospital Bill)
                                                  │
                                                  ▼
                                 [ Cash / UPI / TPA Insurance ]
                                                  │
                                                  ▼
                                [ Patient Portal & Discharge EHR ]
```

---

## 4. Key Strengths & Technical Differentiators

1. **Zero External Dependency Telemedicine**: WebRTC video/audio calls run natively inside modern browsers without requiring third-party tools (Zoom/Google Meet).
2. **Real-time Reactive Architecture**: State changes (prescriptions, lab results, payments) update across connected dashboards instantly through Supabase real-time channels.
3. **Local-First Reliability**: Built-in localStorage caching ensures dashboards remain responsive during network fluctuations and resynchronize automatically once reconnected.
4. **End-to-End Role Separation**: Granular role-based access control (RBAC) ensuring clinical data privacy, auditability, and staff accountability.

---

## 5. Future Roadmap & Strategic Enhancements

| Category | Proposed Feature | Technical Scope & Impact |
| :--- | :--- | :--- |
| **Artificial Intelligence** | **AI Clinical Decision Support (CDSS)** | Integrate LLM-assisted preliminary diagnosis, drug-drug interaction warning engines, and automated radiology image annotation (X-Ray/CT). |
| **Government Integration** | **ABDM & ABHA Integration** | Integration with Ayushman Bharat Digital Mission (ABHA ID generation, M1/M2/M3 FHIR compliance) for national health record exchange. |
| **IoT & Medical Devices** | **Continuous Vitals Streaming** | Bluetooth Low Energy (BLE) and MQTT gateway support for continuous ICU/bedside monitor data (SpO2, ECG, NIBP) feeding into doctor consoles. |
| **Smart Messaging** | **Automated WhatsApp API** | Automated report delivery, appointment reminder notifications, and interactive booking chatbots via WhatsApp Business API. |
| **Security & Identification** | **Biometric & RFID Tracking** | Biometric staff attendance verification and RFID patient wristbands for secure bedside drug administration and infant security. |
| **Mobile Ecosystem** | **Cross-Platform Mobile Apps** | Native Android/iOS builds using React Native or Capacitor with push notifications, offline EHR access, and wearable sync. |

---
*End of Documentation — Digital Health Management System (DHMS)*
