import React from 'react';

/**
 * OutpatientBillModal
 * Replicates the authentic physical outpatient doctor appointment receipt/bill 
 * as shown in Indian hospital reception setups (e.g., Mahesh Hospital format).
 * 
 * Props:
 * - billData: object containing appointment / invoice details
 * - onClose: function to close modal
 */
export default function OutpatientBillModal({ billData, onClose }) {
  if (!billData) return null;

  // Retrieve configurable hospital letterhead or standard clinical center info
  let hospitalInfo = {
    name: 'DHMS CENTRAL CLINICAL HOSPITAL',
    address: 'NH 66, MAIN CAMPUS ROAD, MEDICAL ENCLAVE, KARNATAKA - 576213',
    phone: 'PH : 9449835256, 7259862056, 7259323056, 7411734056'
  };

  try {
    const saved = localStorage.getItem('dhms_hospital_settings');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.name) hospitalInfo.name = parsed.name.toUpperCase();
      if (parsed.address) hospitalInfo.address = parsed.address.toUpperCase();
      if (parsed.contact) hospitalInfo.phone = parsed.contact;
    }
  } catch (e) {
    // ignore
  }

  // Format current timestamp e.g., "11/04/2026, 17:00"
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const printTimestamp = `${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${now.getFullYear()}, ${pad(now.getHours())}:${pad(now.getMinutes())}`;

  // Parse Bill Date formatted like "11 APR 2026"
  const monthNames = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
  let billDateFormatted = '';
  if (billData.date) {
    const dParts = billData.date.split('-');
    if (dParts.length === 3) {
      const yr = dParts[0];
      const mIdx = parseInt(dParts[1], 10) - 1;
      const day = dParts[2];
      billDateFormatted = `${day} ${monthNames[mIdx] || ''} ${yr}`;
    } else {
      billDateFormatted = billData.date;
    }
  } else {
    billDateFormatted = `${pad(now.getDate())} ${monthNames[now.getMonth()]} ${now.getFullYear()}`;
  }

  // Doctor Details
  const doctorName = (billData.doctorName || billData.doctor || 'DR. SHARATH MADHYASTHA P').toUpperCase();
  const doctorDept = (billData.department || 'CONSULTANT PHYSICIAN').toUpperCase();

  // Patient Info
  const patientName = (billData.patientName || 'PATIENT').toUpperCase();
  const uhid = billData.uhid || billData.patientId || 'MH2005407';
  const hospId = billData.hospId || (billData.id ? String(billData.id).replace(/[^0-9]/g, '').slice(-5) || 'P51831' : 'P51831');
  
  // Age & Gender
  let ageGender = '35 YEARS/MALE';
  if (billData.age || billData.gender) {
    ageGender = `${billData.age ? billData.age + ' YEARS' : 'ADULT'} / ${(billData.gender || 'MALE').toUpperCase()}`;
  } else if (billData.patientAgeGender) {
    ageGender = billData.patientAgeGender.toUpperCase();
  }

  const mobileNumber = billData.patientPhone || billData.phone || billData.mobile || '9876543210';
  const address = (billData.patientAddress || billData.address || 'CENTRAL RESIDENCY, MEDICAL TOWNSHIP').toUpperCase();

  // Clean numerical fee amount
  const cleanFee = (val) => {
    if (typeof val === 'number') return val;
    const num = parseFloat(String(val || '').replace(/[^0-9.]/g, ''));
    return isNaN(num) ? 150.00 : num;
  };

  const parsedTotal = cleanFee(billData.consultationFee || billData.amount || 150.00);
  const totalAmountStr = parsedTotal.toFixed(2);

  // Bill Number
  const billNo = billData.billNo || (billData.invoiceId ? `OP${billData.invoiceId.replace(/[^0-9]/g, '')}/24` : (billData.id ? `OP0000${String(billData.id).replace(/[^0-9]/g, '').slice(-4)}/24` : 'OP00001823/24'));

  const isPaid = billData.feeStatus === 'Paid' || billData.paymentStatus === 'Paid' || billData.status === 'Paid';
  const paymentMethodLabel = billData.paymentMethod ? (billData.paymentMethod.toLowerCase().includes('cash') ? 'CASH PAID' : 'ONLINE PAID') : (isPaid ? 'PAID' : 'DUE / UNPAID');

  const handlePrintBill = () => {
    try {
      const printContent = document.getElementById('opd-bill-printable-content');
      if (!printContent) {
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
            <title>DHMS - Outpatient Bill</title>
            <style>
              @page {
                size: A4 portrait;
                margin: 12mm 15mm;
              }
              body {
                font-family: Arial, Helvetica, sans-serif;
                margin: 0;
                padding: 0;
                color: #111827;
                background: #ffffff;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
              * {
                box-sizing: border-box;
              }
            </style>
          </head>
          <body>
            ${printContent.innerHTML}
          </body>
        </html>
      `);
      doc.close();

      setTimeout(() => {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
        setTimeout(() => {
          document.body.removeChild(iframe);
        }, 1500);
      }, 350);
    } catch (err) {
      console.warn("Iframe print error, falling back to window.print():", err);
      window.print();
    }
  };

  return (
    <div 
      className="no-print-overlay"
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.72)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 999999,
        padding: '16px'
      }}
    >
      <div 
        onClick={e => e.stopPropagation()}
        style={{
          background: '#ffffff',
          borderRadius: '10px',
          width: '740px',
          maxWidth: '96vw',
          maxHeight: '94vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
          overflow: 'hidden'
        }}
      >
        {/* Top Control Bar (Hidden on physical print) */}
        <div 
          className="no-print" 
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '12px 20px',
            background: '#f8fafc',
            borderBottom: '1px solid #e2e8f0'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '18px' }}>🧾</span>
            <strong style={{ fontSize: '15px', color: '#1e293b' }}>Outpatient Medical Bill (OPD)</strong>
            <span style={{ fontSize: '11px', background: isPaid ? '#dcfce7' : '#fee2e2', color: isPaid ? '#15803d' : '#b91c1c', padding: '2px 8px', borderRadius: '4px', fontWeight: '700' }}>
              {isPaid ? 'PAID RECEIPT' : 'PAYMENT PENDING'}
            </span>
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button
              type="button"
              onClick={handlePrintBill}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                background: '#0f172a',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                fontWeight: '600',
                fontSize: '12.5px',
                cursor: 'pointer'
              }}
            >
              🖨️ Print Outpatient Bill
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '22px',
                cursor: 'pointer',
                color: '#64748b',
                lineHeight: 1
              }}
            >
              &times;
            </button>
          </div>
        </div>

        {/* Printable Outpatient Receipt Body */}
        <div 
          id="opd-bill-printable-content"
          style={{
            padding: '30px 36px',
            overflowY: 'auto',
            flex: 1,
            backgroundColor: '#ffffff',
            color: '#111827',
            fontFamily: "Arial, Helvetica, sans-serif",
            fontSize: '11.5px',
            lineHeight: 1.45,
            position: 'relative'
          }}
        >
          {/* Top Timestamp & Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#4b5563', marginBottom: '8px' }}>
            <span>{printTimestamp}</span>
            <span>Print Day sheet</span>
          </div>

          {/* Hospital Header */}
          <div style={{ marginBottom: '14px' }}>
            <h1 style={{ margin: '0 0 2px 0', fontSize: '19px', fontWeight: '800', color: '#111827', letterSpacing: '-0.01em' }}>
              {hospitalInfo.name}
            </h1>
            <div style={{ fontSize: '10.5px', color: '#374151', textTransform: 'uppercase', lineHeight: 1.35 }}>
              <div>{hospitalInfo.address}</div>
              <div>{hospitalInfo.phone}</div>
            </div>
          </div>

          {/* Title */}
          <div style={{ textAlign: 'center', borderTop: '1px solid #d1d5db', borderBottom: '1px solid #d1d5db', padding: '5px 0', margin: '10px 0 14px 0' }}>
            <h2 style={{ margin: 0, fontSize: '14.5px', fontWeight: '700', letterSpacing: '0.06em', color: '#111827' }}>
              OUTPATIENT BILL
            </h2>
          </div>

          {/* Patient & Doctor Matrix Box */}
          <div style={{ border: '1px solid #9ca3af', padding: '12px 14px', marginBottom: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.9fr 1.3fr', gap: '12px 16px' }}>
              
              {/* Row 1 */}
              <div>
                <div style={{ fontSize: '9.5px', color: '#4b5563', textTransform: 'uppercase' }}>NAME</div>
                <div style={{ fontWeight: '700', fontSize: '12.5px', color: '#111827' }}>{patientName}</div>
              </div>
              <div>
                <div style={{ fontSize: '9.5px', color: '#4b5563', textTransform: 'uppercase' }}>UHID</div>
                <div style={{ fontWeight: '700', fontSize: '12px', color: '#111827' }}>{uhid}</div>
              </div>
              <div>
                <div style={{ fontSize: '9.5px', color: '#4b5563', textTransform: 'uppercase' }}>ADDRESS</div>
                <div style={{ fontWeight: '600', fontSize: '10.5px', color: '#111827' }}>{address}</div>
              </div>

              {/* Row 2 */}
              <div>
                <div style={{ fontSize: '9.5px', color: '#4b5563', textTransform: 'uppercase' }}>AGE/GENDER</div>
                <div style={{ fontWeight: '600', fontSize: '11.5px', color: '#111827' }}>{ageGender}</div>
              </div>
              <div>
                <div style={{ fontSize: '9.5px', color: '#4b5563', textTransform: 'uppercase' }}>HOSP ID</div>
                <div style={{ fontWeight: '600', fontSize: '11.5px', color: '#111827' }}>{hospId}</div>
              </div>
              <div>
                <div style={{ fontSize: '9.5px', color: '#4b5563', textTransform: 'uppercase' }}>DOCTOR</div>
                <div style={{ fontWeight: '700', fontSize: '11.5px', color: '#111827' }}>{doctorName}</div>
                <div style={{ fontSize: '10px', color: '#4b5563' }}>{doctorDept}</div>
              </div>

              {/* Row 3 */}
              <div>
                <div style={{ fontSize: '9.5px', color: '#4b5563', textTransform: 'uppercase' }}>MOBILE NUMBER</div>
                <div style={{ fontWeight: '600', fontSize: '11.5px', color: '#111827' }}>{mobileNumber}</div>
              </div>
              <div>
                <div style={{ fontSize: '9.5px', color: '#4b5563', textTransform: 'uppercase' }}>TOKEN / APPT ID</div>
                <div style={{ fontWeight: '700', fontSize: '11.5px', color: '#1d4ed8' }}>{billData.id || billData.appointmentId || 'APT-OPD'}</div>
              </div>
              <div>
                <div style={{ fontSize: '9.5px', color: '#4b5563', textTransform: 'uppercase' }}>TIME / APPT SLOT</div>
                <div style={{ fontWeight: '600', fontSize: '11px', color: '#111827' }}>{billData.time || 'SLOT 1 (09:00 AM)'}</div>
              </div>
            </div>
          </div>

          {/* Bill No & Bill Date Row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0 10px 0', borderBottom: '1px solid #111827', marginBottom: '10px', fontWeight: '700', fontSize: '12px' }}>
            <div>BILL NO : {billNo}</div>
            <div>BILL DATE : {billDateFormatted}</div>
          </div>

          {/* Line Items Table */}
          <div style={{ position: 'relative', minHeight: '190px' }}>
            {/* Table Header */}
            <div style={{ display: 'grid', gridTemplateColumns: '2.5fr 1fr 0.6fr 0.8fr 1.3fr', borderBottom: '1px solid #9ca3af', paddingBottom: '6px', fontWeight: '800', fontSize: '11px', textTransform: 'uppercase' }}>
              <div>PARTICULARS</div>
              <div style={{ textAlign: 'right' }}>CHARGE</div>
              <div style={{ textAlign: 'right' }}>UNIT</div>
              <div style={{ textAlign: 'right' }}>DISC</div>
              <div style={{ textAlign: 'right' }}>AMOUNT(IN RS.)</div>
            </div>

            {/* Line Item */}
            <div style={{ display: 'grid', gridTemplateColumns: '2.5fr 1fr 0.6fr 0.8fr 1.3fr', paddingTop: '10px', paddingBottom: '6px', fontSize: '11px' }}>
              <div>
                <div style={{ fontWeight: '700' }}>CONSULTATION CHARGE - {doctorName}</div>
                <div style={{ fontSize: '10px', color: '#4b5563' }}>{doctorDept}</div>
              </div>
              <div style={{ textAlign: 'right' }}>{totalAmountStr}</div>
              <div style={{ textAlign: 'right' }}>1.00</div>
              <div style={{ textAlign: 'right' }}>0.00 (%)</div>
              <div style={{ textAlign: 'right', fontWeight: '700' }}>{totalAmountStr}</div>
            </div>

            {/* Authentic Stamp (Rendered as in the actual hospital bill) */}
            <div 
              style={{
                position: 'absolute',
                top: '50px',
                left: '42%',
                transform: 'rotate(-8deg)',
                pointerEvents: 'none',
                opacity: 0.9,
                userSelect: 'none'
              }}
            >
              <div 
                style={{
                  border: '2.5px solid #1e40af',
                  borderRadius: '50%',
                  padding: '8px 18px',
                  color: '#1e40af',
                  textAlign: 'center',
                  fontWeight: '800',
                  boxShadow: 'inset 0 0 0 1px #1e40af',
                  display: 'inline-block'
                }}
              >
                <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {hospitalInfo.name.split(' ')[0]} HOSPITAL
                </div>
              </div>
              <div 
                style={{
                  color: isPaid ? '#1e3a8a' : '#b91c1c',
                  fontWeight: '900',
                  fontSize: '16px',
                  letterSpacing: '0.08em',
                  textAlign: 'center',
                  marginTop: '4px',
                  textTransform: 'uppercase',
                  borderTop: isPaid ? '2px solid #1e3a8a' : '2px solid #b91c1c',
                  borderBottom: isPaid ? '2px solid #1e3a8a' : '2px solid #b91c1c',
                  padding: '2px 0'
                }}
              >
                {paymentMethodLabel}
              </div>
            </div>

            {/* Total Summary Breakdown */}
            <div style={{ marginTop: '30px', borderTop: '1px solid #d1d5db', paddingTop: '6px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '3.5fr 1.3fr', padding: '3px 0', fontSize: '11.5px' }}>
                <div style={{ fontWeight: '700' }}>BILL AMOUNT</div>
                <div style={{ textAlign: 'right', fontWeight: '700' }}>{totalAmountStr}</div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '3.5fr 1.3fr', padding: '3px 0', fontSize: '11.5px' }}>
                <div style={{ fontWeight: '700' }}>BALANCE</div>
                <div style={{ textAlign: 'right', fontWeight: '700' }}>{totalAmountStr}</div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '3.5fr 1.3fr', padding: '3px 0', fontSize: '11.5px' }}>
                <div style={{ fontWeight: '700' }}>RECEIVABLE AMOUNT</div>
                <div style={{ textAlign: 'right', fontWeight: '700' }}>{totalAmountStr}</div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '3.5fr 1.3fr', padding: '4px 0', fontSize: '12px', borderTop: '1px dashed #9ca3af', marginTop: '4px' }}>
                <div style={{ fontWeight: '800' }}>NET AMOUNT (R)</div>
                <div style={{ textAlign: 'right', fontWeight: '800' }}>{totalAmountStr}</div>
              </div>
            </div>
          </div>

          {/* Footer note */}
          <div style={{ marginTop: '24px', paddingTop: '10px', borderTop: '1px solid #e5e7eb', fontSize: '9.5px', color: '#6b7280', display: 'flex', justifyContent: 'space-between' }}>
            <span>* Valid for 7 days for subsequent follow-up consultation.</span>
            <span>Authorized Signature / Computer Generated Bill</span>
          </div>
        </div>

        {/* Modal Bottom Actions */}
        <div 
          className="no-print" 
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '12px',
            padding: '12px 20px',
            background: '#f8fafc',
            borderTop: '1px solid #e2e8f0'
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '7px 18px',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
              background: '#ffffff',
              color: '#475569',
              fontWeight: '600',
              fontSize: '12.5px',
              cursor: 'pointer'
            }}
          >
            Close
          </button>
          <button
            type="button"
            onClick={handlePrintBill}
            style={{
              padding: '7px 20px',
              borderRadius: '6px',
              border: 'none',
              background: '#2563eb',
              color: '#ffffff',
              fontWeight: '700',
              fontSize: '12.5px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            🖨️ Print Slip / Receipt
          </button>
        </div>
      </div>
    </div>
  );
}
