/**
 * Digital Health MS (DHMS) - Hospital Payroll & Compensation Engine
 * Comprehensive real-world multi-specialty hospital payroll engine.
 * Computes base pay, clinical allowances, OPD revenue sharing, shift incentives,
 * attendance Loss of Pay (LOP), statutory taxes (EPF, PT, TDS), and net disbursals.
 */

export const ROLE_DEFAULT_PAYSCALES = {
  Doctor: {
    baseSalary: 110000,
    hraPercent: 0.20,
    medicalAllowance: 10000,
    specialAllowance: 15000,
    opdCommissionRate: 0.30, // 30% of completed consultation fees
    onCallAllowance: 8000,
    epfRate: 0.12,
    professionalTax: 200,
    tdsRate: 0.10, // 10% TDS
    bankName: "HDFC Medical Corporate Bank",
    ifsc: "HDFC0001892"
  },
  Receptionist: {
    baseSalary: 28000,
    hraPercent: 0.20,
    medicalAllowance: 2500,
    specialAllowance: 3000,
    opdCommissionRate: 0.00,
    onCallAllowance: 0,
    epfRate: 0.12,
    professionalTax: 200,
    tdsRate: 0.00,
    bankName: "State Bank Healthcare Direct",
    ifsc: "SBIN0004921"
  },
  Laboratory: {
    baseSalary: 42000,
    hraPercent: 0.20,
    medicalAllowance: 4000,
    specialAllowance: 5000,
    labIncentivePerTest: 25, // ₹25 per test verified
    opdCommissionRate: 0.00,
    onCallAllowance: 2000,
    epfRate: 0.12,
    professionalTax: 200,
    tdsRate: 0.05,
    bankName: "ICICI Healthcare Premier",
    ifsc: "ICIC0008412"
  },
  Pharmacist: {
    baseSalary: 36000,
    hraPercent: 0.20,
    medicalAllowance: 3500,
    specialAllowance: 4000,
    opdCommissionRate: 0.00,
    onCallAllowance: 1500,
    epfRate: 0.12,
    professionalTax: 200,
    tdsRate: 0.05,
    bankName: "Axis Clinical Banking",
    ifsc: "UTIB0002194"
  },
  Cashier: {
    baseSalary: 30000,
    hraPercent: 0.20,
    medicalAllowance: 2500,
    specialAllowance: 3500,
    opdCommissionRate: 0.00,
    onCallAllowance: 0,
    epfRate: 0.12,
    professionalTax: 200,
    tdsRate: 0.02,
    bankName: "State Bank Healthcare Direct",
    ifsc: "SBIN0004921"
  }
};

/**
 * Converts numbers into English words for Paystub print
 */
export function convertNumberToWords(amount) {
  const num = Math.floor(Math.abs(amount));
  if (num === 0) return "Zero Rupees Only";
  
  const a = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 
             'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const inWords = (n) => {
    if (n < 20) return a[n];
    if (n < 100) return b[Math.floor(n / 10)] + (n % 10 !== 0 ? " " + a[n % 10] : "");
    if (n < 1000) return inWords(Math.floor(n / 100)) + " Hundred" + (n % 100 !== 0 ? " and " + inWords(n % 100) : "");
    if (n < 100000) return inWords(Math.floor(n / 1000)) + " Thousand" + (n % 1000 !== 0 ? " " + inWords(n % 1000) : "");
    if (n < 10000000) return inWords(Math.floor(n / 100000)) + " Lakh" + (n % 100000 !== 0 ? " " + inWords(n % 100000) : "");
    return inWords(Math.floor(n / 10000000)) + " Crore" + (n % 10000000 !== 0 ? " " + inWords(n % 10000000) : "");
  };

  return inWords(num) + " Rupees Only";
}

/**
 * Calculates dynamic monthly paycheck for a single staff member
 */
export function calculateStaffPaycheck(staff, roleType, monthStr, options = {}) {
  const payConfig = ROLE_DEFAULT_PAYSCALES[roleType] || ROLE_DEFAULT_PAYSCALES.Doctor;
  
  // 1. Base Earnings
  const basic = options.customBase || payConfig.baseSalary;
  const hra = basic * payConfig.hraPercent;
  const medical = payConfig.medicalAllowance;
  const special = payConfig.specialAllowance;

  // 2. Dynamic OPD Consultation Commission (for Doctors)
  let opdConsultRevenue = 0;
  let opdCommission = 0;
  let completedApptsCount = 0;

  if (roleType === 'Doctor') {
    const allAppointments = JSON.parse(localStorage.getItem('dhms_appointments') || '[]');
    const doctorAppts = allAppointments.filter(a => {
      const matchDoc = a.doctorId === staff.id || a.doctorName === staff.name;
      const isCompleted = a.status === 'Completed';
      return matchDoc && isCompleted;
    });

    completedApptsCount = doctorAppts.length;
    opdConsultRevenue = doctorAppts.reduce((sum, a) => {
      const fee = parseFloat((a.consultationFee || '250').toString().replace(/[^0-9.]/g, '')) || 250;
      return sum + fee;
    }, 0);

    opdCommission = opdConsultRevenue * payConfig.opdCommissionRate;
  }

  // 3. Dynamic Lab Diagnostic Incentives (for Pathologists)
  let labIncentive = 0;
  let completedLabsCount = 0;
  if (roleType === 'Laboratory') {
    const allLabs = JSON.parse(localStorage.getItem('dhms_lab_requests') || '[]');
    completedLabsCount = allLabs.filter(l => l.status === 'Completed & Billed' || l.status === 'Completed').length;
    labIncentive = completedLabsCount * (payConfig.labIncentivePerTest || 25);
  }

  // 4. Night Shift / On-Call Allowance
  const onCallAllowance = payConfig.onCallAllowance || 0;

  // Total Gross Earnings
  const grossEarnings = basic + hra + medical + special + opdCommission + labIncentive + onCallAllowance;

  // 5. Attendance Calculation & Loss of Pay (LOP)
  const masterAttendance = JSON.parse(localStorage.getItem('dhms_master_attendance') || '[]');
  const staffAttendance = masterAttendance.filter(a => a.staffId === staff.id || a.staffName === staff.name);
  
  const totalDaysInMonth = 30;
  const absentDays = staffAttendance.filter(a => a.status === 'Absent').length;
  const leaveDays = staffAttendance.filter(a => a.status === 'On Leave').length;
  const presentDays = staffAttendance.filter(a => a.status === 'Present' || a.status === 'Late').length;
  
  // Unexcused absences deduct daily rate
  const perDaySalary = basic / totalDaysInMonth;
  const lossOfPay = Math.round(absentDays * perDaySalary);

  // 6. Statutory Deductions
  const epf = Math.round(basic * payConfig.epfRate);
  const professionalTax = payConfig.professionalTax;
  const taxableIncome = Math.max(0, grossEarnings - epf - professionalTax);
  const tds = Math.round(taxableIncome * payConfig.tdsRate);
  const healthInsurance = 1200; // Standard Hospital Group MediClaim Policy

  const totalDeductions = epf + professionalTax + tds + lossOfPay + healthInsurance;
  const netSalary = Math.max(0, Math.round(grossEarnings - totalDeductions));

  // Unique Paycheck Reference Numbers
  const cleanId = (staff.id || 'STF').replace(/[^a-zA-Z0-9]/g, '');
  const cleanMonth = (monthStr || '2026-09').replace(/[^a-zA-Z0-9]/g, '');
  const paycheckId = `PAY-${cleanMonth}-${cleanId}`;
  const transactionRef = `NEFT-DHMS-${Math.floor(10000000 + Math.random() * 90000000)}`;

  return {
    id: paycheckId,
    month: monthStr || 'September 2026',
    payDate: new Date().toISOString().split('T')[0],
    staffId: staff.id,
    staffName: staff.name,
    staffRole: staff.role || roleType,
    department: staff.department || `${roleType} Wing`,
    email: staff.email || `${cleanId.toLowerCase()}@dhms.org`,
    phone: staff.phone || '+91 98765 43210',
    panNumber: `AAAA${cleanId.slice(-3)}9Z`,
    bankName: payConfig.bankName,
    accountNumber: `4092-8821-${cleanId.slice(-4) || '9921'}`,
    ifscCode: payConfig.ifsc,
    
    // Attendance Ledger
    attendance: {
      totalDays: totalDaysInMonth,
      presentDays: Math.min(totalDaysInMonth, presentDays || (totalDaysInMonth - absentDays - leaveDays)),
      paidLeaves: leaveDays,
      unpaidAbsences: absentDays,
      lossOfPayDays: absentDays
    },

    // Earnings Itemized
    earnings: {
      basicPay: basic,
      hra: hra,
      medicalAllowance: medical,
      specialAllowance: special,
      opdCommission: opdCommission,
      completedApptsCount: completedApptsCount,
      opdConsultRevenue: opdConsultRevenue,
      labIncentive: labIncentive,
      completedLabsCount: completedLabsCount,
      onCallAllowance: onCallAllowance,
      totalGross: grossEarnings
    },

    // Deductions Itemized
    deductions: {
      epf: epf,
      professionalTax: professionalTax,
      tds: tds,
      lossOfPay: lossOfPay,
      healthInsurance: healthInsurance,
      totalDeductions: totalDeductions
    },

    // Net Result
    netSalary: netSalary,
    netSalaryInWords: convertNumberToWords(netSalary),
    status: options.status || 'Approved', // 'Draft', 'Approved', 'Disbursed'
    paymentMode: 'Direct Deposit / Electronic NEFT Bank Transfer',
    transactionRef: transactionRef,
    disbursedAt: options.status === 'Disbursed' ? new Date().toISOString() : null
  };
}

/**
 * Generates full hospital payroll ledger across all staff rosters
 */
export function generateFullHospitalPayroll(monthStr = 'September 2026') {
  const doctors = JSON.parse(localStorage.getItem('dhms_doctors') || '[]');
  const receptionists = JSON.parse(localStorage.getItem('dhms_receptionist_staff') || '[]');
  const labStaff = JSON.parse(localStorage.getItem('dhms_laboratory_staff') || '[]');
  const pharmacyStaff = JSON.parse(localStorage.getItem('dhms_pharmacy_staff') || '[]');
  const cashierStaff = JSON.parse(localStorage.getItem('dhms_cashier_staff') || '[]');

  const payrollLedger = [];

  doctors.forEach(doc => {
    payrollLedger.push(calculateStaffPaycheck(doc, 'Doctor', monthStr));
  });

  receptionists.forEach(rec => {
    payrollLedger.push(calculateStaffPaycheck(rec, 'Receptionist', monthStr));
  });

  labStaff.forEach(lab => {
    payrollLedger.push(calculateStaffPaycheck(lab, 'Laboratory', monthStr));
  });

  pharmacyStaff.forEach(phr => {
    payrollLedger.push(calculateStaffPaycheck(phr, 'Pharmacist', monthStr));
  });

  cashierStaff.forEach(csh => {
    payrollLedger.push(calculateStaffPaycheck(csh, 'Cashier', monthStr));
  });

  // Save to local storage
  localStorage.setItem('dhms_payroll_records', JSON.stringify(payrollLedger));
  if (typeof window !== 'undefined' && window.dispatchEvent) {
    window.dispatchEvent(new Event('storage'));
  }

  return payrollLedger;
}
