// Comprehensive WhatsApp & SMS Dispatch Engine for DHMS
// Formats patient notifications for Appointments, Prescriptions, Lab Reports, Tele-links, and Medication Reminders

export function cleanPhoneNumber(phone) {
  if (!phone) return '';
  let cleaned = phone.replace(/[^0-9+]/g, '');
  if (cleaned.startsWith('+')) {
    cleaned = cleaned.substring(1);
  } else if (cleaned.length === 10) {
    // Default country code for 10-digit numbers (India +91)
    cleaned = `91${cleaned}`;
  }
  return cleaned;
}

export function generateWhatsAppUrl(phoneNumber, message) {
  const cleanPhone = cleanPhoneNumber(phoneNumber);
  const encodedText = encodeURIComponent(message);
  if (cleanPhone) {
    return `https://wa.me/${cleanPhone}?text=${encodedText}`;
  }
  return `https://wa.me/?text=${encodedText}`;
}

export function openWhatsAppMessage(phoneNumber, message) {
  const url = generateWhatsAppUrl(phoneNumber, message);
  if (typeof window !== 'undefined') {
    window.open(url, '_blank', 'noopener,noreferrer');
  }
  return url;
}

// 1. Appointment Confirmation WhatsApp Message
export function sendAppointmentWhatsApp(appt, patientPhone) {
  const apptDate = appt.date || new Date().toISOString().split('T')[0];
  const apptTime = appt.time || '10:00 AM';
  const docName = appt.doctorName || 'Specialist Physician';
  const dept = appt.department || 'Clinical Care';
  const patName = appt.patientName || 'Patient';
  const apptId = appt.id || 'APT-1001';

  const message = `🏥 *APOLLO SUPER SPECIALTY MEDICAL CENTER*
*Official Appointment Confirmation*

Hello *${patName}*,
Your clinical consultation has been confirmed.

📋 *Appointment Details:*
• *Appt Ref:* ${apptId}
• *Doctor:* ${docName}
• *Specialty:* ${dept}
• *Date & Time:* 📅 ${apptDate} at ⏰ ${apptTime}
• *Consultation Type:* ${appt.isTelemedicine ? '📹 Tele-Consultation (Online)' : '🏥 In-Hospital Visit (OPD)'}
• *Status:* Confirmed / Fee Cleared

📌 *Patient Instructions:*
Please arrive 10 minutes prior to your scheduled slot or join your online tele-suite via your patient portal.

For any assistance or rescheduling, reply to this message.
_DHMS Healthcare Operations Desk_`;

  return openWhatsAppMessage(patientPhone || appt.patientPhone, message);
}

// 2. e-Prescription WhatsApp Dispatch
export function sendPrescriptionWhatsApp(prescription, patientPhone) {
  const patName = prescription.patientName || 'Patient';
  const docName = prescription.doctorName || 'Attending Doctor';
  const date = prescription.date || new Date().toISOString().split('T')[0];
  const rxId = prescription.id || 'RX-1001';
  const medsList = Array.isArray(prescription.medications) 
    ? prescription.medications.map((m, i) => `  ${i+1}. *${m.name || m.drugName}* — ${m.dosage || m.dose || '1 tab'} (${m.frequency || 'Daily'}) for ${m.duration || '5 days'}`).join('\n')
    : `  1. *${prescription.drugName || 'Prescribed Medication'}* — ${prescription.dose || '500mg'} (${prescription.frequency || 'Daily'})`;

  const message = `💊 *DHMS DIGITAL E-PRESCRIPTION*
*Apollo Medical Center — Pharmacy Dispatch*

Dear *${patName}*,
Dr. *${docName}* has generated your digital prescription.

📋 *Prescription Summary:*
• *Rx Number:* ${rxId}
• *Date:* 📅 ${date}
• *Diagnosis:* ${prescription.diagnosis || 'Clinical Consultation'}

💊 *Prescribed Medications & Dosages:*
${medsList}

📝 *Instructions:* ${prescription.instructions || 'Take medications with meals as directed.'}

You can present this message at any DHMS hospital pharmacy counter to collect your medicines.
_Stay Healthy, DHMS Pharmacy Care_`;

  return openWhatsAppMessage(patientPhone || prescription.patientPhone, message);
}

// 3. Laboratory Report Ready Notification
export function sendLabReportWhatsApp(labOrder, patientPhone) {
  const patName = labOrder.patientName || 'Patient';
  const testName = labOrder.testName || 'Diagnostic Panel';
  const date = labOrder.date || new Date().toISOString().split('T')[0];
  const orderId = labOrder.id || 'LAB-1001';

  const message = `🧪 *DHMS CENTRAL DIAGNOSTIC LABORATORY*
*Lab Test Report Released*

Dear *${patName}*,
Your diagnostic pathology test report is now *Verified & Ready for Download*.

🔬 *Investigation Details:*
• *Lab Order Ref:* ${orderId}
• *Test Name:* ${testName}
• *Release Date:* 📅 ${date}
• *Status:* ✅ Verified by Chief Pathologist

View and download your digital report with reference ranges directly from your DHMS Patient Console.
_Apollo Diagnostic Services_`;

  return openWhatsAppMessage(patientPhone || labOrder.patientPhone, message);
}

// 4. Live Telemedicine Video Call Invitation
export function sendTeleconsultationInviteWhatsApp(teleData, patientPhone) {
  const patName = teleData.patientName || 'Patient';
  const docName = teleData.doctorName || 'Doctor';
  const dept = teleData.department || 'Specialist Consultation';

  const message = `🚨 *URGENT: LIVE TELE-CONSULTATION INCOMING*
*Apollo Healthcare Telemedicine Suite*

Hello *${patName}*,
Dr. *${docName}* (${dept}) is currently in your virtual consultation room and calling you now.

📹 *Join Video Room:*
1. Open your DHMS Patient Portal
2. Tap *"Accept Call"* or visit the Telemedicine tab.

_DHMS Encrypted Video Link_`;

  return openWhatsAppMessage(patientPhone || teleData.patientPhone, message);
}

// 5. Daily Medication Pill Schedule Digest
export function sendDailyPillReminderWhatsApp(pillSchedule, patientName, patientPhone) {
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
  const morningList = pillSchedule.filter(p => p.slot === 'morning').map(p => `  🌅 ${p.name} (${p.dose})`).join('\n') || '  None scheduled';
  const afternoonList = pillSchedule.filter(p => p.slot === 'afternoon').map(p => `  ☀️ ${p.name} (${p.dose})`).join('\n') || '  None scheduled';
  const nightList = pillSchedule.filter(p => p.slot === 'night').map(p => `  🌙 ${p.name} (${p.dose})`).join('\n') || '  None scheduled';

  const message = `⏰ *DAILY MEDICATION REMINDER & SCHEDULE*
*DHMS Smart Pill Tracker — ${today}*

Good morning *${patientName || 'Patient'}*,
Here is your personalized medication schedule for today:

🌅 *Morning Doses (8:00 AM):*
${morningList}

☀️ *Afternoon Doses (1:00 PM):*
${afternoonList}

🌙 *Night Doses (8:00 PM):*
${nightList}

✅ Remember to mark your doses as taken in your DHMS Health Console to keep your *Adherence Streak* alive!
_Your DHMS Wellness Companion_`;

  return openWhatsAppMessage(patientPhone, message);
}
