import React from 'react';
import './OfficialLabReportModal.css';

export default function OfficialLabReportModal({ reportData, onClose }) {
  if (!reportData) return null;

  const testName = reportData.testName || reportData.name || "Complete Blood Count (CBC)";
  const patientName = reportData.patientName || reportData.patient || "Patient";
  const patientId = reportData.patientId || "PT-1001";
  const doctorName = reportData.doctorName || reportData.doctor || reportData.details?.orderedBy || "Self / Direct OPD";
  const dateStr = reportData.completedDate || reportData.date || new Date().toISOString().split('T')[0];
  const reportNo = reportData.id || `LAB-${Math.floor(1000 + Math.random() * 9000)}`;

  // Results structured table
  const results = Array.isArray(reportData.results) && reportData.results.length > 0 
    ? reportData.results 
    : (Array.isArray(reportData.details?.results) ? reportData.details.results : []);

  const department = reportData.department || reportData.template?.department || "HAEMATOLOGY";
  const reportTitle = reportData.template?.title || testName.toUpperCase();
  const clinicalNotes = reportData.template?.clinicalNotes || reportData.remarks || reportData.details?.remarks || 
    "This investigation is evaluated according to standardized clinical reference intervals. Correlate with clinical diagnosis.";
  const abnormalGuidance = reportData.template?.abnormalGuidance || [];
  const technicianNotes = reportData.remarks || reportData.details?.remarks || reportData.rawResultsText || "";

  return (
    <div className="official-lab-modal-overlay">
      <div className="official-lab-modal-container">
        {/* Modal Top Actions Toolbar */}
        <div className="official-lab-modal-toolbar no-print">
          <div className="toolbar-left">
            <span className="badge-verified">✓ Verified Diagnostic Laboratory Document</span>
            <span className="doc-reg-no">Report Ref: {reportNo}</span>
          </div>
          <div className="toolbar-right">
            <button type="button" onClick={() => window.print()} className="btn-print-lab">
              🖨️ Print Lab Report Slip
            </button>
            <button type="button" onClick={onClose} className="btn-close-lab">
              ✕ Close
            </button>
          </div>
        </div>

        {/* Printable Official Medical Lab Slip Sheet */}
        <div id="printable-official-lab-report" className="official-lab-sheet">
          {/* Header Banner */}
          <div className="lab-header-banner">
            <div className="lab-header-branding">
              <div className="lab-logo-mark">🔬</div>
              <div>
                <h1 className="lab-hospital-name">DHMS CENTRAL DIAGNOSTIC PATHOLOGY</h1>
                <p className="lab-sub-banner">Accredited Tertiary Clinical Diagnostic & Molecular Pathology Laboratory</p>
                <p className="lab-contact-line">100 Hospital Boulevard, Medical District • Tel: +91 12345 67890 • Email: lab@dhms-hospital.org</p>
              </div>
            </div>
            <div className="lab-header-reg-info">
              <span className="reg-title">Regd. NABL ISO-15189:</span>
              <strong className="reg-number">DHMS-LAB-98421-XX</strong>
            </div>
          </div>

          {/* Patient Demographic & Order Metadata Strip */}
          <div className="lab-patient-meta-grid">
            <div className="meta-col">
              <div className="meta-row"><span className="lbl">Patient Name:</span> <strong className="val">{patientName}</strong></div>
              <div className="meta-row"><span className="lbl">Patient ID / Reg No:</span> <strong className="val">{patientId}</strong></div>
              <div className="meta-row"><span className="lbl">Referred / Prescribed By:</span> <strong className="val">{doctorName}</strong></div>
            </div>
            <div className="meta-col">
              <div className="meta-row"><span className="lbl">Sample Collected On:</span> <span className="val">{dateStr} 08:30 AM</span></div>
              <div className="meta-row"><span className="lbl">Sample Received On:</span> <span className="val">{dateStr} 09:15 AM</span></div>
              <div className="meta-row"><span className="lbl">Report Published On:</span> <strong className="val">{dateStr} {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong></div>
            </div>
            <div className="meta-col qr-col">
              <div className="qr-box">
                <div className="qr-graphic">▦▣▤</div>
                <small>Scan for Digital EHR Verification</small>
              </div>
            </div>
          </div>

          {/* Department & Test Title Banner */}
          <div className="lab-test-title-strip">
            <h3 className="dept-name">{department}</h3>
            <h2 className="test-name">{reportTitle}</h2>
          </div>

          {/* Core Pathology Parameter Results Table */}
          <table className="lab-results-table">
            <thead>
              <tr>
                <th className="th-test">TEST PARAMETER</th>
                <th className="th-val">MEASURED VALUE</th>
                <th className="th-flag">FLAG</th>
                <th className="th-unit">UNIT</th>
                <th className="th-ref">BIOLOGICAL REFERENCE RANGE</th>
              </tr>
            </thead>
            <tbody>
              {results.length === 0 ? (
                <tr>
                  <td colSpan="5" className="empty-results">
                    {technicianNotes || "Diagnostic testing completed within expected normal physiological limits."}
                  </td>
                </tr>
              ) : (
                results.map((r, i) => {
                  const isHigh = r.flag === 'H' || r.flag === 'High';
                  const isLow = r.flag === 'L' || r.flag === 'Low';
                  const isAbnormal = isHigh || isLow;

                  return (
                    <tr key={i} className={isAbnormal ? "row-abnormal" : "row-normal"}>
                      <td className="td-test">
                        <strong>{r.parameter || r.name}</strong>
                        {r.category && <small className="cat-tag">{r.category}</small>}
                      </td>
                      <td className="td-val">
                        <strong className={isAbnormal ? "val-abnormal" : "val-normal"}>
                          {r.value}
                        </strong>
                      </td>
                      <td className="td-flag">
                        {isHigh && <span className="flag-high">H</span>}
                        {isLow && <span className="flag-low">L</span>}
                        {!isAbnormal && <span className="flag-norm">-</span>}
                      </td>
                      <td className="td-unit">{r.unit || "-"}</td>
                      <td className="td-ref">{r.range || (r.min !== undefined && r.max !== undefined ? `${r.min} - ${r.max}` : r.textRange || "Standard Normal")}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>

          {/* Clinical Interpretation & Notes Section */}
          <div className="lab-interpretation-card">
            <h4 className="card-title">Clinical Notes & Methodology:</h4>
            <p className="clinical-p">{clinicalNotes}</p>

            {/* Abnormal Reference Guidance Table */}
            {abnormalGuidance.length > 0 && (
              <div className="guidance-box">
                <div className="guidance-title">Possible Causes of Abnormal Parameters:</div>
                <table className="guidance-table">
                  <thead>
                    <tr>
                      <th>Biomarker</th>
                      <th>Elevated (High / H)</th>
                      <th>Decreased (Low / L)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {abnormalGuidance.map((g, gi) => (
                      <tr key={gi}>
                        <td><strong>{g.param}</strong></td>
                        <td className="g-high">{g.high}</td>
                        <td className="g-low">{g.low}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {technicianNotes && (
              <div className="tech-remarks">
                <strong>Technician Observations / Remarks:</strong> {technicianNotes}
              </div>
            )}
          </div>

          {/* Pathologist & Lab Incharge Digital Signature Stamp */}
          <div className="lab-signoff-row">
            <div className="sign-block">
              <div className="sig-handwrite">Sachin Sharma</div>
              <div className="sig-line"></div>
              <strong>Mr. Sachin Sharma</strong>
              <span>DMLT, Senior Lab Incharge</span>
            </div>

            <div className="sign-page-count">
              <span>Page 1 of 1</span>
              <strong className="end-report">*** END OF REPORT ***</strong>
            </div>

            <div className="sign-block">
              <div className="sig-handwrite doc-sig">Dr. A. K. Asthana</div>
              <div className="sig-line"></div>
              <strong>Dr. A. K. Asthana</strong>
              <span>MBBS, MD Pathologist (Reg: DMC-48920)</span>
            </div>
          </div>

          {/* Legal Footer */}
          <div className="lab-legal-footer">
            <div className="legal-title">NOT VALID FOR MEDICO LEGAL PURPOSE</div>
            <p>Work timings: Monday to Sunday, 07:00 AM to 09:00 PM (Emergency 24x7). Results are checked with automated internal controls. Please correlate clinically.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
