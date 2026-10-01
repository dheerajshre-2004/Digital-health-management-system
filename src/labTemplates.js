// Standard Clinical Reference Database & Templates for Medical Laboratory Reports
// Follows international pathology reporting standards (Hematology, Biochemistry, Lipid, Thyroid, Urinalysis, etc.)

export const LAB_TEMPLATES = {
  // 1. Complete Blood Count (CBC) / Hemogram
  "Complete Blood Count (CBC)": {
    department: "HAEMATOLOGY",
    title: "COMPLETE BLOOD COUNT (CBC) & HAEMOGRAM",
    clinicalNotes: "A complete blood count (CBC) is used to evaluate overall health and detect a wide range of disorders, including anemia, infection, and leukemia.",
    disclaimer: "NOT VALID FOR MEDICO LEGAL PURPOSE. Please correlate clinically.",
    parameters: [
      { name: "Hemoglobin (Hb)", defaultVal: "15.0", unit: "g/dL", min: 13.0, max: 17.0, category: "RBC Indices" },
      { name: "Total Leukocyte Count (WBC)", defaultVal: "5100", unit: "/cumm", min: 4000, max: 11000, category: "WBC Count" },
      { name: "Neutrophils", defaultVal: "62", unit: "%", min: 40, max: 75, category: "Differential Leucocyte Count" },
      { name: "Lymphocytes", defaultVal: "28", unit: "%", min: 20, max: 45, category: "Differential Leucocyte Count" },
      { name: "Eosinophils", defaultVal: "3", unit: "%", min: 1, max: 6, category: "Differential Leucocyte Count" },
      { name: "Monocytes", defaultVal: "5", unit: "%", min: 2, max: 10, category: "Differential Leucocyte Count" },
      { name: "Basophils", defaultVal: "1", unit: "%", min: 0, max: 2, category: "Differential Leucocyte Count" },
      { name: "Platelet Count", defaultVal: "2.8", unit: "lakhs/cumm", min: 1.5, max: 4.5, category: "Platelet Indices" },
      { name: "Total RBC Count", defaultVal: "5.1", unit: "million/cumm", min: 4.5, max: 5.9, category: "RBC Indices" },
      { name: "Packed Cell Volume (PCV / Hematocrit)", defaultVal: "45.0", unit: "%", min: 40.0, max: 50.0, category: "RBC Indices" },
      { name: "Mean Corpuscular Volume (MCV)", defaultVal: "88.0", unit: "fL", min: 83.0, max: 101.0, category: "RBC Indices" },
      { name: "Mean Corpuscular Hemoglobin (MCH)", defaultVal: "29.5", unit: "pg", min: 27.0, max: 32.0, category: "RBC Indices" },
      { name: "Mean Corpuscular Hb Conc. (MCHC)", defaultVal: "33.5", unit: "g/dL", min: 31.5, max: 34.5, category: "RBC Indices" },
      { name: "Red Cell Distribution Width (RDW-CV)", defaultVal: "13.2", unit: "%", min: 11.6, max: 14.0, category: "RBC Indices" }
    ],
    abnormalGuidance: [
      { param: "Hemoglobin / RBC", high: "Polycythemia, chronic hypoxia, dehydration", low: "Anemia, acute blood loss, nutritional deficiency" },
      { param: "Total Leukocyte (WBC)", high: "Bacterial infection, inflammation, leukemia", low: "Viral infection, bone marrow suppression, sepsis" },
      { param: "Platelet Count", high: "Thrombocytosis, reactive inflammation", low: "Thrombocytopenia, bleeding tendency, dengue" }
    ]
  },

  // 2. Lipid Profile / Panel
  "Lipid Profile / Panel": {
    department: "CLINICAL BIOCHEMISTRY",
    title: "LIPID PROFILE / CARDIOVASCULAR RISK PANEL",
    clinicalNotes: "Evaluates serum lipid fractions and cardiovascular risk indices. Patient was overnight fasting (10-12 hours).",
    disclaimer: "NOT VALID FOR MEDICO LEGAL PURPOSE. Fasting sample verified.",
    parameters: [
      { name: "Total Cholesterol", defaultVal: "185", unit: "mg/dL", min: 125, max: 200, category: "Lipid Fractions" },
      { name: "Triglycerides", defaultVal: "135", unit: "mg/dL", min: 35, max: 150, category: "Lipid Fractions" },
      { name: "HDL Cholesterol (Good)", defaultVal: "48", unit: "mg/dL", min: 40, max: 60, category: "Lipid Fractions" },
      { name: "LDL Cholesterol (Bad)", defaultVal: "98", unit: "mg/dL", min: 0, max: 100, category: "Calculated Fractions" },
      { name: "VLDL Cholesterol", defaultVal: "27", unit: "mg/dL", min: 5, max: 30, category: "Calculated Fractions" },
      { name: "Cholesterol / HDL Ratio", defaultVal: "3.8", unit: "Ratio", min: 3.0, max: 5.0, category: "Risk Indices" },
      { name: "LDL / HDL Ratio", defaultVal: "2.0", unit: "Ratio", min: 1.0, max: 3.2, category: "Risk Indices" }
    ],
    abnormalGuidance: [
      { param: "Total Cholesterol / LDL", high: "Atherosclerosis risk, coronary artery disease, familial hypercholesterolemia", low: "Severe malnutrition, malabsorption" },
      { param: "Triglycerides", high: "Metabolic syndrome, pancreatitis risk, uncontrolled diabetes", low: "Low fat diet, hyperthyroidism" }
    ]
  },

  // 3. Thyroid Panel (TSH, Free T3, Free T4)
  "Thyroid Panel (TSH, Free T4)": {
    department: "ENDOCRINOLOGY & IMMUNOCHEMISTRY",
    title: "THYROID FUNCTION PROFILE (CLIA)",
    clinicalNotes: "Chemiluminescent immunoassay used for precision hormonal estimation. Helps detect hypo/hyperthyroidism.",
    disclaimer: "Values vary with diurnal rhythm and pregnancy. Correlate with clinical symptoms.",
    parameters: [
      { name: "Thyroid Stimulating Hormone (TSH)", defaultVal: "2.45", unit: "µIU/mL", min: 0.35, max: 4.94, category: "Pituitary-Thyroid Axis" },
      { name: "Free Triiodothyronine (FT3)", defaultVal: "3.10", unit: "pg/mL", min: 1.71, max: 3.71, category: "Thyroid Hormones" },
      { name: "Free Thyroxine (FT4)", defaultVal: "1.15", unit: "ng/dL", min: 0.70, max: 1.48, category: "Thyroid Hormones" }
    ],
    abnormalGuidance: [
      { param: "TSH", high: "Primary Hypothyroidism, Hashimoto thyroiditis", low: "Hyperthyroidism, Graves disease, pituitary insufficiency" }
    ]
  },

  // 4. Liver Function Test (LFT)
  "Liver Function Test (LFT)": {
    department: "CLINICAL BIOCHEMISTRY",
    title: "LIVER FUNCTION & HEPATOBILIARY PANEL",
    clinicalNotes: "Evaluates hepatic synthetic function, cellular integrity, and biliary excretory capacity.",
    disclaimer: "Serum enzymes should be interpreted in conjunction with ultrasound & clinical history.",
    parameters: [
      { name: "Total Bilirubin", defaultVal: "0.8", unit: "mg/dL", min: 0.2, max: 1.2, category: "Bilirubin Fractions" },
      { name: "Direct Bilirubin (Conjugated)", defaultVal: "0.2", unit: "mg/dL", min: 0.0, max: 0.3, category: "Bilirubin Fractions" },
      { name: "Indirect Bilirubin (Unconjugated)", defaultVal: "0.6", unit: "mg/dL", min: 0.2, max: 0.9, category: "Bilirubin Fractions" },
      { name: "SGOT / AST", defaultVal: "24", unit: "U/L", min: 10, max: 40, category: "Hepatic Enzymes" },
      { name: "SGPT / ALT", defaultVal: "28", unit: "U/L", min: 7, max: 56, category: "Hepatic Enzymes" },
      { name: "Alkaline Phosphatase (ALP)", defaultVal: "78", unit: "U/L", min: 44, max: 147, category: "Biliary Enzymes" },
      { name: "Total Protein", defaultVal: "7.2", unit: "g/dL", min: 6.3, max: 8.3, category: "Synthetic Function" },
      { name: "Serum Albumin", defaultVal: "4.4", unit: "g/dL", min: 3.5, max: 5.2, category: "Synthetic Function" },
      { name: "Serum Globulin", defaultVal: "2.8", unit: "g/dL", min: 2.3, max: 3.5, category: "Synthetic Function" },
      { name: "Albumin / Globulin (A/G) Ratio", defaultVal: "1.57", unit: "Ratio", min: 1.2, max: 2.2, category: "Synthetic Function" }
    ],
    abnormalGuidance: [
      { param: "SGOT / SGPT (Transaminases)", high: "Hepatocellular injury, viral hepatitis, fatty liver, toxic injury", low: "Normal finding" },
      { param: "Total Bilirubin", high: "Jaundice, hemolysis, biliary obstruction, Gilbert syndrome", low: "Normal finding" }
    ]
  },

  // 5. Kidney Function Test (KFT) / Renal Panel
  "Kidney Function Test (KFT)": {
    department: "CLINICAL BIOCHEMISTRY",
    title: "RENAL FUNCTION & ELECTROLYTE PANEL",
    clinicalNotes: "Measures glomerular filtration products and electrolyte homeostasis.",
    disclaimer: "eGFR calculated using CKD-EPI formula where applicable.",
    parameters: [
      { name: "Serum Creatinine", defaultVal: "0.95", unit: "mg/dL", min: 0.70, max: 1.30, category: "Renal Markers" },
      { name: "Blood Urea Nitrogen (BUN)", defaultVal: "14.2", unit: "mg/dL", min: 7.0, max: 20.0, category: "Renal Markers" },
      { name: "Serum Urea", defaultVal: "28.0", unit: "mg/dL", min: 15.0, max: 45.0, category: "Renal Markers" },
      { name: "Serum Uric Acid", defaultVal: "5.4", unit: "mg/dL", min: 3.5, max: 7.2, category: "Renal Markers" },
      { name: "Serum Sodium (Na+)", defaultVal: "140", unit: "mEq/L", min: 135, max: 145, category: "Electrolytes" },
      { name: "Serum Potassium (K+)", defaultVal: "4.2", unit: "mEq/L", min: 3.5, max: 5.1, category: "Electrolytes" },
      { name: "Serum Chloride (Cl-)", defaultVal: "101", unit: "mEq/L", min: 96, max: 106, category: "Electrolytes" },
      { name: "Estimated GFR (eGFR)", defaultVal: "105", unit: "mL/min/1.73m²", min: 90, max: 140, category: "Glomerular Filtration" }
    ],
    abnormalGuidance: [
      { param: "Serum Creatinine / Urea", high: "Acute kidney injury, chronic renal impairment, dehydration", low: "Reduced muscle mass, severe liver disease" }
    ]
  },

  // 6. Diabetes Screen (HbA1c & Blood Glucose)
  "HbA1c": {
    department: "CLINICAL BIOCHEMISTRY",
    title: "GLYCATED HEMOGLOBIN (HbA1c) & ESTIMATED GLUCOSE",
    clinicalNotes: "Reflects mean blood glucose control over previous 90-120 days. Standardized against NGSP/DCCT guidelines.",
    disclaimer: "Target < 7.0% for established adult diabetics; < 5.7% for non-diabetic reference.",
    parameters: [
      { name: "HbA1c (Glycated Hb)", defaultVal: "5.4", unit: "%", min: 4.0, max: 5.6, category: "Glycemic Control" },
      { name: "Estimated Average Glucose (eAG)", defaultVal: "108", unit: "mg/dL", min: 70, max: 114, category: "Glycemic Control" },
      { name: "Fasting Blood Glucose", defaultVal: "92", unit: "mg/dL", min: 70, max: 99, category: "Plasma Glucose" }
    ],
    abnormalGuidance: [
      { param: "HbA1c", high: "≥ 6.5% Diagnostic for Diabetes; 5.7-6.4% Prediabetes", low: "Chronic hypoglycemia, hemolytic anemia" }
    ]
  },

  // 7. Comprehensive Metabolic Panel (CMP)
  "Comprehensive Metabolic Panel (CMP)": {
    department: "CLINICAL BIOCHEMISTRY",
    title: "COMPREHENSIVE METABOLIC PANEL (CMP-14)",
    clinicalNotes: "Evaluates organ function including kidneys, liver, blood sugar, and acid/base balance.",
    disclaimer: "Fasting sample verified. Correlate with clinical diagnosis.",
    parameters: [
      { name: "Fasting Glucose", defaultVal: "94", unit: "mg/dL", min: 70, max: 99, category: "Metabolic" },
      { name: "Serum Calcium", defaultVal: "9.4", unit: "mg/dL", min: 8.5, max: 10.2, category: "Minerals" },
      { name: "Total Protein", defaultVal: "7.1", unit: "g/dL", min: 6.0, max: 8.3, category: "Proteins" },
      { name: "Serum Albumin", defaultVal: "4.3", unit: "g/dL", min: 3.5, max: 5.0, category: "Proteins" },
      { name: "Serum Bilirubin", defaultVal: "0.7", unit: "mg/dL", min: 0.2, max: 1.2, category: "Hepatic" },
      { name: "Alkaline Phosphatase (ALP)", defaultVal: "82", unit: "U/L", min: 44, max: 147, category: "Hepatic" },
      { name: "AST / SGOT", defaultVal: "22", unit: "U/L", min: 10, max: 40, category: "Hepatic" },
      { name: "ALT / SGPT", defaultVal: "25", unit: "U/L", min: 7, max: 56, category: "Hepatic" },
      { name: "Blood Urea Nitrogen (BUN)", defaultVal: "13", unit: "mg/dL", min: 7, max: 20, category: "Renal" },
      { name: "Serum Creatinine", defaultVal: "0.90", unit: "mg/dL", min: 0.7, max: 1.3, category: "Renal" },
      { name: "Sodium (Na+)", defaultVal: "141", unit: "mEq/L", min: 135, max: 145, category: "Electrolytes" },
      { name: "Potassium (K+)", defaultVal: "4.3", unit: "mEq/L", min: 3.5, max: 5.1, category: "Electrolytes" },
      { name: "Chloride (Cl-)", defaultVal: "102", unit: "mEq/L", min: 96, max: 106, category: "Electrolytes" },
      { name: "Carbon Dioxide (CO2 / Bicarb)", defaultVal: "24", unit: "mEq/L", min: 22, max: 29, category: "Electrolytes" }
    ],
    abnormalGuidance: [
      { param: "CMP Indices", high: "Organ dysfunction or electrolyte shift", low: "Depletion or excessive dilution" }
    ]
  },

  // 8. Urinalysis & Routine Microscopy
  "Urinalysis & Urine Culture": {
    department: "CLINICAL PATHOLOGY & MICROBIOLOGY",
    title: "URINE ROUTINE, BIOCHEMICAL & MICROSCOPIC EXAMINATION",
    clinicalNotes: "Clean catch midstream sample examined for physical, chemical, and microscopic constituents.",
    disclaimer: "NOT VALID FOR MEDICO LEGAL PURPOSE.",
    parameters: [
      { name: "Physical Color", defaultVal: "Pale Yellow", unit: "Visual", min: null, max: null, textRange: "Pale Yellow to Amber", category: "Physical Exam" },
      { name: "Appearance / Clarity", defaultVal: "Clear", unit: "Visual", min: null, max: null, textRange: "Clear", category: "Physical Exam" },
      { name: "Specific Gravity", defaultVal: "1.018", unit: "SG", min: 1.005, max: 1.030, category: "Physical Exam" },
      { name: "Urine pH", defaultVal: "6.0", unit: "pH", min: 4.5, max: 8.0, category: "Chemical Exam" },
      { name: "Urine Glucose", defaultVal: "Nil", unit: "Qualitative", min: null, max: null, textRange: "Nil / Negative", category: "Chemical Exam" },
      { name: "Urine Protein (Albumin)", defaultVal: "Nil", unit: "Qualitative", min: null, max: null, textRange: "Nil / Negative", category: "Chemical Exam" },
      { name: "Ketones", defaultVal: "Negative", unit: "Qualitative", min: null, max: null, textRange: "Negative", category: "Chemical Exam" },
      { name: "Bilirubin / Urobilinogen", defaultVal: "Normal", unit: "Qualitative", min: null, max: null, textRange: "Normal (0.2-1.0 EU/dL)", category: "Chemical Exam" },
      { name: "Pus Cells (WBCs)", defaultVal: "1-2", unit: "/HPF", min: 0, max: 5, category: "Microscopic Exam" },
      { name: "Red Blood Cells (RBCs)", defaultVal: "0-1", unit: "/HPF", min: 0, max: 3, category: "Microscopic Exam" },
      { name: "Epithelial Cells", defaultVal: "2-3", unit: "/HPF", min: 0, max: 5, category: "Microscopic Exam" },
      { name: "Casts / Crystals", defaultVal: "Nil", unit: "/HPF", min: null, max: null, textRange: "Nil / Occasional", category: "Microscopic Exam" }
    ],
    abnormalGuidance: [
      { param: "Pus Cells / Leukocytes", high: "Urinary Tract Infection (UTI), pyuria, cystitis", low: "Normal finding" },
      { param: "Protein / Albumin", high: "Glomerular nephropathy, proteinuria, preeclampsia", low: "Normal finding" }
    ]
  },

  // 9. Vitamin D-25 Hydroxy Screen
  "Vitamin D-25 Hydroxy Screen": {
    department: "IMMUNOLOGY & BIOCHEMISTRY",
    title: "VITAMIN D (25-HYDROXYCHOLECALCIFEROL) ASSAY",
    clinicalNotes: "Evaluates total Vitamin D status (D2 + D3). Essential for calcium homeostasis and bone mineralization.",
    disclaimer: "Deficiency < 20 ng/mL; Insufficiency 20-29 ng/mL; Sufficiency 30-100 ng/mL.",
    parameters: [
      { name: "Total 25-OH Vitamin D", defaultVal: "38.5", unit: "ng/mL", min: 30.0, max: 100.0, category: "Fat Soluble Vitamins" }
    ],
    abnormalGuidance: [
      { param: "Vitamin D", high: "Vitamin D toxicity (Hypervitaminosis D > 100 ng/mL)", low: "Deficiency (< 20 ng/mL) causing osteomalacia, rickets, fatigue" }
    ]
  }
};

// Helper: Match test name to closest clinical template
export function getTemplateForTest(testName = '') {
  if (!testName) return LAB_TEMPLATES["Complete Blood Count (CBC)"];
  
  const clean = testName.toLowerCase();
  if (clean.includes('cbc') || clean.includes('blood count') || clean.includes('hemogram') || clean.includes('haematology')) {
    return LAB_TEMPLATES["Complete Blood Count (CBC)"];
  }
  if (clean.includes('lipid') || clean.includes('cholesterol') || clean.includes('triglyceride')) {
    return LAB_TEMPLATES["Lipid Profile / Panel"];
  }
  if (clean.includes('thyroid') || clean.includes('tsh') || clean.includes('t3') || clean.includes('t4')) {
    return LAB_TEMPLATES["Thyroid Panel (TSH, Free T4)"];
  }
  if (clean.includes('liver') || clean.includes('lft') || clean.includes('bilirubin') || clean.includes('sgot') || clean.includes('sgpt')) {
    return LAB_TEMPLATES["Liver Function Test (LFT)"];
  }
  if (clean.includes('kidney') || clean.includes('kft') || clean.includes('creatinine') || clean.includes('renal') || clean.includes('urea')) {
    return LAB_TEMPLATES["Kidney Function Test (KFT)"];
  }
  if (clean.includes('hba1c') || clean.includes('glucose') || clean.includes('diabetes') || clean.includes('sugar')) {
    return LAB_TEMPLATES["HbA1c"];
  }
  if (clean.includes('cmp') || clean.includes('metabolic panel') || clean.includes('comprehensive metabolic')) {
    return LAB_TEMPLATES["Comprehensive Metabolic Panel (CMP)"];
  }
  if (clean.includes('urine') || clean.includes('urinalysis') || clean.includes('uti')) {
    return LAB_TEMPLATES["Urinalysis & Urine Culture"];
  }
  if (clean.includes('vitamin d') || clean.includes('vit d')) {
    return LAB_TEMPLATES["Vitamin D-25 Hydroxy Screen"];
  }

  // Fallback: Create a custom structured panel for unknown test
  return {
    department: "SPECIALIZED DIAGNOSTICS",
    title: testName.toUpperCase(),
    clinicalNotes: `Diagnostic investigation performed according to standardized hospital laboratory protocols for ${testName}.`,
    disclaimer: "NOT VALID FOR MEDICO LEGAL PURPOSE. Please correlate findings clinically.",
    parameters: [
      { name: `${testName} Primary Assay`, defaultVal: "Normal / Reactive Negative", unit: "Assay Result", min: null, max: null, textRange: "Normal Reference", category: "Diagnostic Assay" },
      { name: "Secondary Diagnostic Marker", defaultVal: "Verified", unit: "Index", min: null, max: null, textRange: "Non-Reactive", category: "Diagnostic Assay" }
    ],
    abnormalGuidance: [
      { param: testName, high: "Abnormal elevation requiring clinical review", low: "Sub-therapeutic or reduced level" }
    ]
  };
}

// Calculate flag: "L" (Low), "H" (High), or "Normal"
export function calculateParamFlag(val, min, max) {
  if (val === undefined || val === null || val === '') return 'Normal';
  const num = parseFloat(String(val).replace(/[^0-9.-]/g, ''));
  if (isNaN(num)) return 'Normal';
  if (min !== null && min !== undefined && num < min) return 'L';
  if (max !== null && max !== undefined && num > max) return 'H';
  return 'Normal';
}
