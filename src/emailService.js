/**
 * DHMS Hospital Email & Notification Dispatch Service
 * Handles welcome emails, credentials dispatching, and patient notifications.
 */

export const generateWelcomeEmailContent = ({ patientName, email, patientId, password, phone }) => {
  const subject = `🏥 Welcome to DHMS Hospital - Your Patient ID & Login Credentials`;
  
  const textBody = `Dear ${patientName},

Thank you for choosing DHMS Hospital! We are honored to be your trusted healthcare provider, and our dedicated medical specialists and clinical care team will always take the utmost care of you and your family.

Your Digital Health Account has been successfully activated with the following credentials:
--------------------------------------------------
• Patient ID / User ID: ${patientId}
• Portal Password / PIN: ${password}
• Registered Email: ${email || 'N/A'}
• Contact Phone: ${phone || 'N/A'}
--------------------------------------------------

Access Your Patient Portal:
You can log in to your patient dashboard anytime to:
- Book & manage doctor clinic appointments
- Start video telemedicine consultations
- Track active prescriptions & view take-home regimens
- Download RSA-signed EHR records and lab diagnostic reports
- View hospital admission status and itemized billing receipts

If you did not request this account or need medical assistance, please contact DHMS Patient Care at care@dhms.org or call our 24/7 Helpline: +91 1800-425-DHMS.

Warm regards & good health,
DHMS Central Medical City Hospital
100 Hospital Road, Medical City
Web: https://dhms.org | Support: support@dhms.org`;

  const htmlBody = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.06);">
      <div style="background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); color: #ffffff; padding: 24px 30px; text-align: center;">
        <h1 style="margin: 0; font-size: 22px; font-weight: 800; letter-spacing: 0.5px;">🏥 DHMS CENTRAL HOSPITAL</h1>
        <p style="margin: 6px 0 0 0; font-size: 13px; opacity: 0.9;">Excellence in Digital Healthcare & Clinical Care</p>
      </div>

      <div style="padding: 28px 30px; color: #1e293b; line-height: 1.6;">
        <h2 style="margin: 0 0 14px 0; font-size: 18px; color: #0f172a;">Dear ${patientName},</h2>
        
        <p style="margin: 0 0 16px 0; font-size: 14.5px; color: #334155;">
          <strong>Thank you for choosing our hospital.</strong> We are deeply privileged to serve you, and our dedicated team of specialist doctors, nurses, and clinical staff <em>will always take the utmost care of you and your family.</em>
        </p>

        <div style="background: #f8fafc; border: 2px dashed #93c5fd; border-radius: 10px; padding: 18px 20px; margin: 20px 0;">
          <h3 style="margin: 0 0 12px 0; font-size: 14px; text-transform: uppercase; color: #1e40af; letter-spacing: 0.5px;">🔐 Your Patient Portal Login Credentials</h3>
          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <tr>
              <td style="padding: 6px 0; color: #64748b; width: 40%;">Patient ID:</td>
              <td style="padding: 6px 0; font-weight: 800; color: #1e3a8a; font-size: 16px;">${patientId}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b;">Password / PIN:</td>
              <td style="padding: 6px 0; font-weight: 800; color: #166534; font-size: 16px; font-family: monospace;">${password}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b;">Registered Email:</td>
              <td style="padding: 6px 0; font-weight: 600; color: #334155;">${email || 'N/A'}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b;">Phone Number:</td>
              <td style="padding: 6px 0; font-weight: 600; color: #334155;">${phone || 'N/A'}</td>
            </tr>
          </table>
        </div>

        <p style="font-size: 13.5px; color: #475569; margin: 16px 0;">
          You can now log in to the <strong>DHMS Patient Portal</strong> anytime to book doctor consultations, attend video telemedicine clinics, review active prescriptions, access laboratory diagnostics, and manage your billing clearance receipts.
        </p>

        <div style="margin: 24px 0 16px 0; text-align: center;">
          <a href="https://dhms.org/patient" style="display: inline-block; background: #2563eb; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: 700; font-size: 14px; box-shadow: 0 4px 6px -1px rgba(37,99,235,0.3);">
            🚀 Access DHMS Patient Portal
          </a>
        </div>
      </div>

      <div style="background: #f1f5f9; padding: 16px 30px; border-top: 1px solid #e2e8f0; font-size: 11.5px; color: #64748b; text-align: center;">
        <p style="margin: 0 0 4px 0;">DHMS Central Hospital • 100 Hospital Road, Medical City</p>
        <p style="margin: 0;">24/7 Medical Emergency Helpline: <strong>+91 1800-425-DHMS</strong> | Email: <strong>support@dhms.org</strong></p>
      </div>
    </div>
  `;

  return { subject, textBody, htmlBody };
};

/**
 * Dispatches the welcome email and logs it to local storage & notifications
 */
export const sendPatientWelcomeEmail = async ({ patientName, email, patientId, password, phone }) => {
  const { subject, textBody, htmlBody } = generateWelcomeEmailContent({
    patientName,
    email,
    patientId,
    password,
    phone
  });

  const emailRecord = {
    id: `EML-${Date.now()}`,
    type: 'PATIENT_WELCOME_CREDENTIALS',
    recipientEmail: email,
    recipientName: patientName,
    patientId,
    password,
    subject,
    textBody,
    htmlBody,
    sentAt: new Date().toISOString(),
    status: 'Sent / Dispatched'
  };

  // 1. Save to dhms_sent_emails
  try {
    const existingEmails = JSON.parse(localStorage.getItem('dhms_sent_emails') || '[]');
    localStorage.setItem('dhms_sent_emails', JSON.stringify([emailRecord, ...existingEmails]));
  } catch (err) {
    console.warn("Could not save to dhms_sent_emails:", err);
  }

  // 2. Add in-app notification for patient
  try {
    const notifs = JSON.parse(localStorage.getItem('dhms_notifications') || '[]');
    const newNotif = {
      id: `NOTIF-${Date.now()}`,
      patientId,
      title: "💌 Welcome to DHMS Hospital & Login Passcode",
      message: `Welcome ${patientName}! Thank you for choosing DHMS. Your Patient ID is ${patientId} and your access pass is ${password}.`,
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      read: false
    };
    localStorage.setItem('dhms_notifications', JSON.stringify([newNotif, ...notifs]));
  } catch (err) {
    console.warn("Could not save notification:", err);
  }

  // 3. EmailJS integration if configured
  const emailJsConfig = JSON.parse(localStorage.getItem('dhms_emailjs_config') || 'null');
  if (emailJsConfig?.serviceId && emailJsConfig?.templateId && emailJsConfig?.publicKey && email && email.includes('@')) {
    try {
      await fetch('https://api.emailjs.com/api/v1.0/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service_id: emailJsConfig.serviceId.trim(),
          template_id: emailJsConfig.templateId.trim(),
          user_id: emailJsConfig.publicKey.trim(),
          template_params: {
            to_name: patientName,
            name: patientName,
            patient_name: patientName,
            to_email: email,
            email: email,
            patient_id: patientId,
            password: password,
            phone: phone || 'N/A',
            message: "Thank you for choosing our hospital and we will always take care of you."
          }
        })
      });
      if (res.ok) {
        emailRecord.deliveryMode = 'EmailJS Live SMTP (Delivered)';
      } else {
        const err = await res.text();
        console.warn("EmailJS response error:", err);
      }
    } catch (err) {
      console.warn("EmailJS delivery failed, falling back to simulated dispatch:", err);
    }
  }

  // Trigger storage event so open tabs receive new email records & notifications
  if (typeof window !== 'undefined' && window.dispatchEvent) {
    window.dispatchEvent(new Event('storage'));
  }

  return emailRecord;
};

/**
 * Opens default OS / Web Email Client with pre-composed message
 */
export const openDefaultMailClient = ({ patientName, email, patientId, password, phone }) => {
  const { subject, textBody } = generateWelcomeEmailContent({
    patientName,
    email,
    patientId,
    password,
    phone
  });

  const mailtoUrl = `mailto:${encodeURIComponent(email || '')}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(textBody)}`;
  window.open(mailtoUrl, '_blank');
};
