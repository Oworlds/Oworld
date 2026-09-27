import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Flag, Clock, ChevronLeft, ChevronRight, Upload, Copy, RotateCcw,
  Play, CheckCircle2, XCircle, AlertTriangle, ClipboardList, Activity,
  Check, ChevronDown, ChevronUp, FileJson, FlaskConical, PencilLine,
  Calculator as CalcIcon, Settings as SettingsIcon, Lock, Unlock,
  Search, Trash2, X, XOctagon, Lightbulb, Sun, Moon, Highlighter, BookOpen
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from "recharts";

// ---------------------------------------------------------------------------
// Design tokens — light chrome matches the NBME/USMLE interface; DARK is the
// exam screen's "dark mode" variant (toggled from the in-exam Settings menu).
// ---------------------------------------------------------------------------
const LIGHT = {
  navy: "#1B3A56",
  navyDeep: "#12283D",
  paper: "#F4F6F8",
  card: "#FFFFFF",
  border: "#C9D3DA",
  ink: "#16232E",
  muted: "#5B6B76",
  mutedBg: "#EBEEF0",
  blue: "#2D6CB4",
  blueDeep: "#1F5290",
  blueLight: "#DCEAF6",
  onBlue: "#FFFFFF",
  green: "#2E7D4F",
  greenLight: "#E1F0E5",
  red: "#B23B35",
  redLight: "#F5DEDC",
  amber: "#9C6510",
  amberLight: "#F5E7CE",
  flagRed: "#C0392B",
};

const DARK = {
  navy: "#0A0A0A",
  navyDeep: "#000000",
  paper: "#000000",
  card: "#0A0A0A",
  border: "#3FC6E6",
  ink: "#FFFFFF",
  muted: "#8FE0F2",
  mutedBg: "#12242A",
  blue: "#3FC6E6",
  blueDeep: "#1EA9CB",
  blueLight: "#123A44",
  onBlue: "#001217",
  green: "#5FD38A",
  greenLight: "#123A2A",
  red: "#FF7A70",
  redLight: "#3A1414",
  amber: "#F5B84D",
  amberLight: "#3A2B0E",
  flagRed: "#FF6B5B",
};

const FONT_DISPLAY = "'Source Serif 4', Georgia, 'Times New Roman', serif";
const FONT_UI = "'Inter', Arial, 'Segoe UI', sans-serif";
const FONT_MONO = "'IBM Plex Mono', 'SF Mono', Menlo, monospace";

const FONT_IMPORT_URL =
  "https://fonts.googleapis.com/css2?family=Source+Serif+4:opsz,wght@8..60,400;8..60,500;8..60,600;8..60,700&family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap";

// Full NBME "Laboratory Values" reference table, grouped by the tabs used in the
// real interface (Serum / Cerebrospinal / Blood / Urine and BMI). Each row has a
// conventional-unit value and an SI-unit value; `h` marks a section header, `sub`
// marks an indented sub-item (e.g. Albumin under Proteins, total).
const LAB_DATA = {
  Serum: [
    { h: "General Chemistry — Electrolytes" },
    { name: "Sodium (Na+)", value: "136–146 mEq/L", si: "136–146 mmol/L" },
    { name: "Potassium (K+)", value: "3.5–5.0 mEq/L", si: "3.5–5.0 mmol/L" },
    { name: "Chloride (Cl–)", value: "95–105 mEq/L", si: "95–105 mmol/L" },
    { name: "Bicarbonate (HCO3–)", value: "22–28 mEq/L", si: "22–28 mmol/L" },
    { name: "Urea nitrogen", value: "7–18 mg/dL", si: "2.5–6.4 mmol/L" },
    { name: "Creatinine", value: "0.6–1.2 mg/dL", si: "53–106 μmol/L" },
    { name: "Glucose, fasting", value: "70–100 mg/dL", si: "3.8–5.6 mmol/L" },
    { name: "Glucose, random non-fasting", value: "<140 mg/dL", si: "<7.77 mmol/L" },
    { name: "Calcium", value: "8.4–10.2 mg/dL", si: "2.1–2.6 mmol/L" },
    { name: "Magnesium (Mg2+)", value: "1.5–2.0 mg/dL", si: "0.75–1.0 mmol/L" },
    { name: "Phosphorus (inorganic)", value: "3.0–4.5 mg/dL", si: "1.0–1.5 mmol/L" },

    { h: "Hepatic" },
    { name: "ALT", value: "10–40 U/L", si: "10–40 U/L" },
    { name: "AST", value: "12–38 U/L", si: "12–38 U/L" },
    { name: "Alkaline phosphatase", value: "25–100 U/L", si: "25–100 U/L" },
    { name: "Bilirubin, total // direct", value: "0.1–1.0 // 0.0–0.3 mg/dL", si: "2–17 // 0–5 μmol/L" },
    { name: "Proteins, total", value: "6.0–7.8 g/dL", si: "60–78 g/L" },
    { name: "Albumin", value: "3.5–5.5 g/dL", si: "35–55 g/L", sub: true },
    { name: "Globulin", value: "2.3–3.5 g/dL", si: "23–35 g/L", sub: true },

    { h: "Other, serum" },
    { name: "Amylase", value: "25–125 U/L", si: "25–125 U/L" },
    { name: "Lipase", value: "13–60 U/L", si: "13–60 U/L" },
    { name: "Creatinine clearance, male", value: "97–137 mL/min", si: "97–137 mL/min" },
    { name: "Creatinine clearance, female", value: "88–128 mL/min", si: "88–128 mL/min" },
    { name: "Creatine kinase, male", value: "25–90 U/L", si: "25–90 U/L" },
    { name: "Creatine kinase, female", value: "10–70 U/L", si: "10–70 U/L" },
    { name: "Lactate dehydrogenase", value: "45–200 U/L", si: "45–200 U/L" },
    { name: "Osmolality", value: "275–295 mOsmol/kg H2O", si: "275–295 mOsmol/kg H2O" },
    { name: "Troponin I", value: "≤0.04 ng/mL", si: "≤0.04 μg/L" },
    { name: "Uric acid", value: "3.0–8.2 mg/dL", si: "0.18–0.48 mmol/L" },

    { h: "Lipids" },
    { name: "Cholesterol, total (normal)", value: "<200 mg/dL", si: "<5.2 mmol/L" },
    { name: "Cholesterol, total (high)", value: ">240 mg/dL", si: ">6.2 mmol/L" },
    { name: "HDL", value: "40–60 mg/dL", si: "1.0–1.6 mmol/L", sub: true },
    { name: "LDL", value: "<160 mg/dL", si: "<4.2 mmol/L", sub: true },
    { name: "Triglycerides (normal)", value: "<150 mg/dL", si: "<1.70 mmol/L" },
    { name: "Triglycerides (borderline)", value: "151–199 mg/dL", si: "1.71–2.25 mmol/L" },

    { h: "Iron Studies" },
    { name: "Ferritin, male", value: "20–250 ng/mL", si: "20–250 μg/L" },
    { name: "Ferritin, female", value: "10–120 ng/mL", si: "10–120 μg/L" },
    { name: "Iron, male", value: "65–175 µg/dL", si: "11.6–31.3 μmol/L" },
    { name: "Iron, female", value: "50–170 μg/dL", si: "9.0–30.4 μmol/L" },
    { name: "Total iron-binding capacity", value: "250–400 µg/dL", si: "44.8–71.6 μmol/L" },
    { name: "Transferrin", value: "200–360 mg/dL", si: "2.0–3.6 g/L" },

    { h: "Endocrine" },
    { name: "FSH, male", value: "4–25 mIU/mL", si: "4–25 IU/L" },
    { name: "FSH, female premenopause", value: "4–30 mIU/mL", si: "4–30 IU/L" },
    { name: "FSH, female midcycle peak", value: "10–90 mIU/mL", si: "10–90 IU/L" },
    { name: "FSH, female postmenopause", value: "40–250 mIU/mL", si: "40–250 IU/L" },
    { name: "LH, male", value: "6–23 mIU/mL", si: "6–23 IU/L" },
    { name: "LH, female follicular phase", value: "5–30 mIU/mL", si: "5–30 IU/L" },
    { name: "LH, female midcycle", value: "75–150 mIU/mL", si: "75–150 IU/L" },
    { name: "LH, female postmenopause", value: "30–200 mIU/mL", si: "30–200 IU/L" },
    { name: "Growth hormone, fasting", value: "<5 ng/mL", si: "<5 μg/L" },
    { name: "Growth hormone, provocative stimuli", value: ">7 ng/mL", si: ">7 μg/L" },
    { name: "Prolactin, male", value: "<17 ng/mL", si: "<17 μg/L" },
    { name: "Prolactin, female", value: "<25 ng/mL", si: "<25 μg/L" },
    { name: "Cortisol, 0800 h", value: "5–23 μg/dL", si: "138–635 nmol/L" },
    { name: "Cortisol, 1600 h", value: "3–15 μg/dL", si: "82–413 nmol/L" },
    { name: "Cortisol, 2000 h", value: "<50% of 0800 h", si: "fraction <0.50" },
    { name: "TSH", value: "0.4–4.0 μU/mL", si: "0.4–4.0 mIU/L" },
    { name: "Triiodothyronine (T3), RIA", value: "100–200 ng/dL", si: "1.5–3.1 nmol/L" },
    { name: "T3 resin uptake", value: "25%–35%", si: "0.25–0.35" },
    { name: "Thyroxine (T4)", value: "5–12 μg/dL", si: "64–155 nmol/L" },
    { name: "Free T4", value: "0.9–1.7 ng/dL", si: "12.0–21.9 pmol/L" },
    { name: "Thyroidal iodine (123I) uptake", value: "8%–30% of dose/24 h", si: "0.08–0.30/24 h" },
    { name: "Intact PTH", value: "10–60 pg/mL", si: "10–60 ng/L" },
    { name: "17-Hydroxycorticosteroids, male", value: "3.0–10.0 mg/24 h", si: "8.2–27.6 μmol/24 h" },
    { name: "17-Hydroxycorticosteroids, female", value: "2.0–8.0 mg/24 h", si: "5.5–22.0 μmol/24 h" },
    { name: "17-Ketosteroids, total, male", value: "8–20 mg/24 h", si: "28–70 μmol/24 h" },
    { name: "17-Ketosteroids, total, female", value: "6–15 mg/24 h", si: "21–52 μmol/24 h" },

    { h: "Immunoglobulins" },
    { name: "IgA", value: "76–390 mg/dL", si: "0.76–3.90 g/L" },
    { name: "IgE", value: "0–380 IU/mL", si: "0–380 kIU/L" },
    { name: "IgG", value: "650–1500 mg/dL", si: "6.5–15.0 g/L" },
    { name: "IgM", value: "50–300 mg/dL", si: "0.5–3.0 g/L" },
  ],

  Cerebrospinal: [
    { name: "Cell count", value: "0–5/mm3", si: "0–5 × 10⁶/L" },
    { name: "Chloride", value: "118–132 mEq/L", si: "118–132 mmol/L" },
    { name: "Gamma globulin", value: "3%–12% total proteins", si: "0.03–0.12" },
    { name: "Glucose", value: "40–70 mg/dL", si: "2.2–3.9 mmol/L" },
    { name: "Pressure", value: "70–180 mm H2O", si: "70–180 mm H2O" },
    { name: "Proteins, total", value: "<40 mg/dL", si: "<0.40 g/L" },
  ],

  Blood: [
    { h: "Gases, Arterial (Room Air)" },
    { name: "Po2", value: "75–105 mm Hg", si: "10.0–14.0 kPa" },
    { name: "Pco2", value: "33–45 mm Hg", si: "4.4–5.9 kPa" },
    { name: "pH", value: "7.35–7.45", si: "[H+] 36–44 nmol/L" },

    { h: "Complete Blood Count" },
    { name: "Hematocrit, male", value: "41%–53%", si: "0.41–0.53" },
    { name: "Hematocrit, female", value: "36%–46%", si: "0.36–0.46" },
    { name: "Hemoglobin, male", value: "13.5–17.5 g/dL", si: "135–175 g/L" },
    { name: "Hemoglobin, female", value: "12.0–16.0 g/dL", si: "120–160 g/L" },
    { name: "MCH", value: "25–35 pg/cell", si: "0.39–0.54 fmol/cell" },
    { name: "MCHC", value: "31%–36% Hb/cell", si: "4.8–5.6 mmol Hb/L" },
    { name: "MCV", value: "80–100 μm3", si: "80–100 fL" },
    { name: "Plasma volume, male", value: "25–43 mL/kg", si: "0.025–0.043 L/kg" },
    { name: "Plasma volume, female", value: "28–45 mL/kg", si: "0.028–0.045 L/kg" },
    { name: "Red cell volume, male", value: "20–36 mL/kg", si: "0.020–0.036 L/kg" },
    { name: "Red cell volume, female", value: "19–31 mL/kg", si: "0.019–0.031 L/kg" },
    { name: "Leukocyte count (WBC)", value: "4500–11,000/mm3", si: "4.5–11.0 × 10⁹/L" },
    { name: "Neutrophils, segmented", value: "54%–62%", si: "0.54–0.62" },
    { name: "Neutrophils, bands", value: "3%–5%", si: "0.03–0.05" },
    { name: "Lymphocytes", value: "25%–33%", si: "0.25–0.33" },
    { name: "Monocytes", value: "3%–7%", si: "0.03–0.07" },
    { name: "Eosinophils", value: "1%–3%", si: "0.01–0.03" },
    { name: "Basophils", value: "0%–0.75%", si: "0.00–0.0075" },
    { name: "Platelet count", value: "150,000–400,000/mm3", si: "150–400 × 10⁹/L" },

    { h: "Coagulation" },
    { name: "PTT (activated)", value: "25–40 seconds", si: "25–40 seconds" },
    { name: "PT", value: "11–15 seconds", si: "11–15 seconds" },
    { name: "D-dimer", value: "≤250 ng/mL", si: "≤1.4 nmol/L" },

    { h: "Other, Hematologic" },
    { name: "Reticulocyte count", value: "0.5%–1.5%", si: "0.005–0.015" },
    { name: "Erythrocyte count (RBC), male", value: "4.3–5.9 million/mm3", si: "4.3–5.9 × 10¹²/L" },
    { name: "Erythrocyte count (RBC), female", value: "3.5–5.5 million/mm3", si: "3.5–5.5 × 10¹²/L" },
    { name: "ESR (Westergren), male", value: "0–15 mm/h", si: "0–15 mm/h" },
    { name: "ESR (Westergren), female", value: "0–20 mm/h", si: "0–20 mm/h" },
    { name: "CD4+ T-lymphocyte count", value: "≥500/mm3", si: "≥0.5 × 10⁹/L" },
    { name: "Hemoglobin A1c", value: "≤6%", si: "≤42 mmol/mol" },
  ],

  "Urine and BMI": [
    { name: "Calcium", value: "100–300 mg/24 h", si: "2.5–7.5 mmol/24 h" },
    { name: "Osmolality", value: "50–1200 mOsmol/kg H2O", si: "50–1200 mOsmol/kg H2O" },
    { name: "Oxalate", value: "8–40 μg/mL", si: "90–445 μmol/L" },
    { name: "Proteins, total", value: "<150 mg/24 h", si: "<0.15 g/24 h" },
    { name: "Body mass index (BMI), adult", value: "19–25 kg/m2", si: "19–25 kg/m2" },
  ],
};
const LAB_TABS = ["Serum", "Cerebrospinal", "Blood", "Urine and BMI"];

// ---------------------------------------------------------------------------
// Sample schema + demo data + Gemini prompt template
// ---------------------------------------------------------------------------
const SCHEMA_TEXT = `{
  "examTitle": "Custom Practice Exam",
  "blocks": [
    {
      "blockName": "Block 1",
      "timeLimitMinutes": 60,
      "questions": [
        {
          "id": "b1q1",
          "subject": "Cardiovascular",
          "vignette": "A 58-year-old man comes to the physician because of substernal chest pressure that began 2 hours ago while shoveling snow. He has a history of hypertension and type 2 diabetes mellitus. His pulse is 98/min and blood pressure is 148/92 mm Hg. An ECG shows ST-segment elevation in leads II, III, and aVF.",
          "stem": "Which of the following is the most likely diagnosis?",
          "options": [
            { "key": "A", "text": "Acute pericarditis" },
            { "key": "B", "text": "Inferior wall myocardial infarction" },
            { "key": "C", "text": "Aortic dissection" },
            { "key": "D", "text": "Pulmonary embolism" },
            { "key": "E", "text": "Costochondritis" }
          ],
          "correctAnswer": "B",
          "explanation": "ST elevation in the inferior leads (II, III, aVF) with typical exertional chest pain and cardiac risk factors is classic for an inferior wall MI, usually from RCA occlusion.",
          "distractorAnalysis": {
            "A": "Acute pericarditis causes diffuse ST elevation with PR depression, not localized to the inferior leads.",
            "C": "Aortic dissection classically presents with tearing pain radiating to the back, not focal ST elevation.",
            "D": "Pulmonary embolism causes sinus tachycardia and possible right heart strain (S1Q3T3), not inferior ST elevation.",
            "E": "Costochondritis is reproducible on palpation and does not cause ECG changes."
          },
          "hint": "Think about which leads localize the inferior wall, and what vessel usually supplies it.",
          "educationalObjective": "Recognize inferior wall MI from ST elevation in leads II, III, and aVF, typically from RCA occlusion.",
          "sourceReferences": [
            {
              "sourceTitle": "First Aid for the USMLE Step 1 (2025)",
              "chapterSection": "Cardiovascular — Ischemic Heart Disease",
              "pageNumber": "302",
              "relevance": "ECG localization of infarct territory and culprit vessel"
            },
            {
              "sourceTitle": "BRS Pathology (6th Ed.)",
              "chapterSection": "Chapter 8: The Cardiovascular System",
              "pageNumber": "145-148",
              "relevance": "Pathophysiology of coronary occlusion and infarct evolution"
            }
          ]
        }
      ]
    }
  ]
}`;

const DEMO_EXAM = {
  examTitle: "Demo Practice Exam",
  blocks: [
    {
      blockName: "Block 1 (Demo)",
      timeLimitMinutes: 3,
      questions: [
        {
          id: "d1",
          subject: "Cardiovascular",
          vignette:
            "A 58-year-old man comes to the physician because of substernal chest pressure that began 2 hours ago while shoveling snow. He has a history of hypertension and type 2 diabetes mellitus. His pulse is 98/min and blood pressure is 148/92 mm Hg. An ECG shows ST-segment elevation in leads II, III, and aVF.",
          stem: "Which of the following is the most likely diagnosis?",
          options: [
            { key: "A", text: "Acute pericarditis" },
            { key: "B", text: "Inferior wall myocardial infarction" },
            { key: "C", text: "Aortic dissection" },
            { key: "D", text: "Pulmonary embolism" },
            { key: "E", text: "Costochondritis" },
          ],
          correctAnswer: "B",
          explanation:
            "ST elevation in II, III, and aVF with exertional chest pain and cardiac risk factors points to an inferior wall MI, typically from RCA occlusion.",
          distractorAnalysis: {
            A: "Pericarditis causes diffuse ST elevation with PR depression, not a focal territorial pattern.",
            C: "Aortic dissection classically causes tearing pain radiating to the back, not focal ST elevation.",
            D: "PE causes sinus tachycardia and possible right heart strain, not inferior lead ST elevation.",
            E: "Costochondritis is reproducible on palpation and produces no ECG changes.",
          },
          hint: "Which three leads localize the inferior wall of the heart?",
          educationalObjective: "Localize an inferior wall MI to leads II, III, and aVF, and link it to RCA occlusion.",
          sourceReferences: [
            { sourceTitle: "First Aid for the USMLE Step 1 (2025)", chapterSection: "Cardiovascular — Ischemic Heart Disease", pageNumber: "302", relevance: "ECG localization of infarct territory and culprit vessel" },
            { sourceTitle: "BRS Pathology (6th Ed.)", chapterSection: "Chapter 8: The Cardiovascular System", pageNumber: "145-148", relevance: "Pathophysiology of coronary occlusion" },
          ],
        },
        {
          id: "d2",
          subject: "Endocrine",
          vignette:
            "A 34-year-old woman comes to the physician because of a 3-month history of weight loss, heat intolerance, and palpitations. Examination shows a fine tremor, warm moist skin, and a diffusely enlarged, non-tender thyroid gland. Exophthalmos is present.",
          stem: "Which of the following is the most likely underlying mechanism?",
          options: [
            { key: "A", text: "Autoantibodies against thyroid-stimulating hormone receptor" },
            { key: "B", text: "Autonomous thyroid nodule" },
            { key: "C", text: "Viral-induced thyroid inflammation" },
            { key: "D", text: "Excess iodine ingestion" },
            { key: "E", text: "Pituitary adenoma secreting TSH" },
          ],
          correctAnswer: "A",
          explanation:
            "Diffuse goiter, exophthalmos, and hyperthyroid symptoms in a young woman are classic for Graves disease, caused by stimulating autoantibodies against the TSH receptor.",
          hint: "Exophthalmos narrows this down to one specific autoimmune cause of hyperthyroidism.",
          educationalObjective: "Recognize Graves disease as TSH-receptor autoantibody-mediated hyperthyroidism with exophthalmos.",
          sourceReferences: [
            { sourceTitle: "First Aid for the USMLE Step 1 (2025)", chapterSection: "Endocrine — Thyroid Pathology", pageNumber: "338", relevance: "Graves disease mechanism and exam findings" },
          ],
        },
        {
          id: "d3",
          subject: "Renal",
          vignette:
            "A 6-year-old boy is brought in with periorbital edema and cola-colored urine 10 days after a sore throat. Blood pressure is 128/84 mm Hg. Urinalysis shows red cell casts and mild proteinuria. Serum C3 is decreased.",
          stem: "Which of the following is the most likely diagnosis?",
          options: [
            { key: "A", text: "Minimal change disease" },
            { key: "B", text: "IgA nephropathy" },
            { key: "C", text: "Post-streptococcal glomerulonephritis" },
            { key: "D", text: "Membranous nephropathy" },
            { key: "E", text: "Alport syndrome" },
          ],
          correctAnswer: "C",
          explanation:
            "Red cell casts, low C3, and onset 1-3 weeks after pharyngitis in a child are characteristic of post-streptococcal glomerulonephritis.",
          hint: "The low complement level points toward one specific post-infectious diagnosis.",
          educationalObjective: "Distinguish post-streptococcal GN by its latency period, low C3, and red cell casts.",
          sourceReferences: [
            { sourceTitle: "First Aid for the USMLE Step 1 (2025)", chapterSection: "Renal — Nephritic Syndromes", pageNumber: "588", relevance: "Post-infectious GN timeline and complement findings" },
            { sourceTitle: "BRS Pathology (6th Ed.)", chapterSection: "Chapter 16: The Kidney and Urinary System", pageNumber: "310-312", relevance: "Immune complex mechanism of glomerular injury" },
          ],
        },
      ],
    },
  ],
};

const FOCUS_MODES = [
  { id: "standard", label: "Standard USMLE mix" },
  { id: "systems", label: "Single organ system" },
  { id: "discipline", label: "Single discipline" },
];
const BLOCK_SIZES = [5, 15, 25, 40];

// Compact schema used INSIDE the generated prompt (NotebookLM/Gemini has a
// tight input-length limit). The full, richly-annotated SCHEMA_TEXT above
// stays in the "JSON schema" reference panel for humans to read — this is a
// field-name/type skeleton only, no prose example values, to keep the copied
// prompt as short as possible while still fully specifying the shape.
const PROMPT_SCHEMA_TEXT = `{"examTitle":"string","blocks":[{"blockName":"string","timeLimitMinutes":number,"questions":[{"id":"unique string","subject":"organ system/discipline","vignette":"string","stem":"string","options":[{"key":"A","text":"string"}],"correctAnswer":"matching key","explanation":"string","distractorAnalysis":{"key":"string"},"hint":"string (optional)","educationalObjective":"string","sourceReferences":[{"sourceTitle":"string","chapterSection":"string","pageNumber":"string (optional)","relevance":"string"}]}]}]}`;

function buildQuestionRecipe({ size, focusMode, focusValue }) {
  const blockName =
    focusMode === "systems" && focusValue ? `${focusValue} System Block`
    : focusMode === "discipline" && focusValue ? `${focusValue} Block`
    : "Mixed Block";
  const timeLimit = Math.round(size * 1.5);

  let focusLine;
  if (focusMode === "systems") {
    focusLine = `All questions from one organ system — ${focusValue || "[SYSTEM]"}. Vary discipline tested (anatomy/physio/path/pharm/micro).`;
  } else if (focusMode === "discipline") {
    focusLine = `All questions from one discipline — ${focusValue || "[DISCIPLINE]"}. Vary organ system tested.`;
  } else {
    focusLine = `Mix systems/disciplines like a real USMLE block: broad coverage, no back-to-back repeats of the same system, proportional emphasis on high-yield systems (cardio, GI, renal, endocrine, neuro, repro, MSK, heme/onc, psych, resp).`;
  }

  return `Generate ${size} USMLE-style practice questions as ONLY valid JSON (no markdown, no commentary), matching this schema:
${PROMPT_SCHEMA_TEXT}

Block: "${blockName}", timeLimitMinutes ${timeLimit}.
Vignette 4-8 sentences (age/sex, complaint, history, exam, labs/imaging). 5 options (A-E), 1 correct.
explanation: 3-5 sentences on the key discriminator. distractorAnalysis: 1 sentence per wrong option, same keys.
hint: 1 short sentence, no answer giveaway. educationalObjective: 1-2 sentence takeaway.
sourceReferences: 1-3 real sources (First Aid, BRS, Pathoma, etc.) — sourceTitle, chapterSection, pageNumber (omit if unsure), relevance.
subject: specific system/discipline. Every id unique.
Focus: ${focusLine}`;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function validateExamData(raw) {
  let data;
  try {
    data = typeof raw === "string" ? JSON.parse(raw) : raw;
  } catch (e) {
    return { valid: false, error: "That isn't valid JSON. Check for trailing commas or missing quotes." };
  }
  if (!data || typeof data !== "object") return { valid: false, error: "Root must be a JSON object." };
  if (!Array.isArray(data.blocks) || data.blocks.length === 0) {
    return { valid: false, error: 'Missing a non-empty "blocks" array.' };
  }
  for (let bi = 0; bi < data.blocks.length; bi++) {
    const b = data.blocks[bi];
    if (!b.blockName) return { valid: false, error: `Block ${bi + 1} is missing "blockName".` };
    if (b.timeLimitMinutes != null && typeof b.timeLimitMinutes !== "number") {
      return { valid: false, error: `Block "${b.blockName || bi + 1}" has a "timeLimitMinutes" that isn't a number. Omit it entirely for an untimed block.` };
    }
    if (!Array.isArray(b.questions) || b.questions.length === 0) {
      return { valid: false, error: `Block "${b.blockName}" needs a non-empty "questions" array.` };
    }
    for (let qi = 0; qi < b.questions.length; qi++) {
      const q = b.questions[qi];
      if (!q.id) return { valid: false, error: `Question ${qi + 1} in "${b.blockName}" is missing "id".` };
      if (!q.vignette) return { valid: false, error: `Question "${q.id}" is missing "vignette".` };
      if (!q.stem) return { valid: false, error: `Question "${q.id}" is missing "stem".` };
      if (!Array.isArray(q.options) || q.options.length < 2) {
        return { valid: false, error: `Question "${q.id}" needs an "options" array with at least 2 choices.` };
      }
      if (!q.correctAnswer) return { valid: false, error: `Question "${q.id}" is missing "correctAnswer".` };
      const keys = q.options.map((o) => o.key);
      if (!keys.includes(q.correctAnswer)) {
        return { valid: false, error: `Question "${q.id}": correctAnswer "${q.correctAnswer}" doesn't match any option key.` };
      }
    }
  }
  return { valid: true, data };
}

function fmtTime(totalSeconds) {
  const s = Math.max(0, totalSeconds);
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

// Fisher-Yates shuffle of a question's answer options, then re-keys them (A, B, C…)
// in their original letter sequence so the UI stays clean while the underlying
// content order — and therefore the "right answer position" — is randomized.
// correctAnswer is remapped to whichever new key now holds that option's text.
function shuffleQuestionOptions(q) {
  const originalKeys = q.options.map((o) => o.key);
  const correctText = q.options.find((o) => o.key === q.correctAnswer)?.text;

  const shuffled = [...q.options];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  const rekeyed = shuffled.map((opt, i) => ({ ...opt, key: originalKeys[i] }));
  const newCorrectAnswer = rekeyed.find((opt) => opt.text === correctText)?.key || q.correctAnswer;

  // distractorAnalysis is keyed by option letter, but shuffling reassigns letters to
  // different option text — remap each reason by matching text, not old key, so a
  // reason never ends up attached to the wrong (shuffled) option.
  let distractorAnalysis = q.distractorAnalysis;
  if (distractorAnalysis) {
    const remapped = {};
    q.options.forEach((origOpt) => {
      const reason = distractorAnalysis[origOpt.key];
      if (reason == null) return;
      const movedTo = rekeyed.find((o) => o.text === origOpt.text);
      if (movedTo) remapped[movedTo.key] = reason;
    });
    distractorAnalysis = remapped;
  }

  return { ...q, options: rekeyed, correctAnswer: newCorrectAnswer, ...(q.distractorAnalysis ? { distractorAnalysis } : {}) };
}

// Strips any "— Retest Missed" / "— Retest All" suffix a block may already carry,
// so re-retesting a retest block doesn't chain suffixes indefinitely.
function baseBlockName(name) {
  return name.replace(/\s+—\s+Retest (Missed|All)$/i, "");
}

function makeInitialBlockState(block) {
  const hasLimit = typeof block.timeLimitMinutes === "number";
  return {
    status: "pending", // pending | in-progress | done
    answers: {}, // qId -> { selected: null, struck: [], flagged: false } — always fresh, never inherited
    notes: {}, // qId -> note text
    timed: hasLimit, // defaults from the JSON, but can be toggled in the lobby or in-exam Settings
    timeLeft: (hasLimit ? block.timeLimitMinutes : 60) * 60,
    score: null,
  };
}

// ---------------------------------------------------------------------------
// NBME-style text highlighting
//
// IMPORTANT DESIGN NOTE: the exam screen re-renders every second while the
// timer is ticking. Any approach that mutates the live DOM directly (e.g.
// Range.surroundContents to physically wrap selected nodes in a <mark>) gets
// silently wiped out on the next tick, because React reconciles the tree back
// to whatever the JSX declares. So highlights are stored as plain character
// OFFSETS into the raw question text (start/end), and the marked-up view is
// *derived* fresh on every render from {raw text + offsets}. That keeps
// highlighting correct and persistent under React's render model instead of
// fighting it. Colors are fixed (not theme-tokenized) since a yellow
// highlighter reads correctly in both light and dark mode, matching the
// real NBME/UWorld convention.
// ---------------------------------------------------------------------------
const HIGHLIGHT_BG = "#FEF08A"; // Tailwind yellow-200
const HIGHLIGHT_BG_HOVER = "#FDE047"; // Tailwind yellow-300
const HIGHLIGHT_TEXT = "#0F172A"; // Tailwind slate-900

// Walks a container's text nodes to convert a DOM (node, offset) pair from a
// Selection Range into a plain character offset relative to the container's
// full text content — this only works correctly if the container's rendered
// text content exactly equals the raw string being highlighted, which holds
// here since renderHighlightedText() never adds/removes characters, only
// wraps existing ones.
function textOffsetWithin(container, node, offset) {
  let total = 0;
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
  let current;
  while ((current = walker.nextNode())) {
    if (current === node) return total + offset;
    total += current.textContent.length;
  }
  return total;
}

function rangeToOffsets(container, range) {
  const a = textOffsetWithin(container, range.startContainer, range.startOffset);
  const b = textOffsetWithin(container, range.endContainer, range.endOffset);
  return a <= b ? { start: a, end: b } : { start: b, end: a };
}

// Sorts and merges overlapping/adjacent ranges so re-selecting over an
// existing highlight extends it rather than creating messy nested marks.
function mergeHighlightRanges(ranges) {
  const sorted = [...ranges].sort((a, b) => a.start - b.start);
  const out = [];
  for (const r of sorted) {
    const last = out[out.length - 1];
    if (last && r.start <= last.end) {
      last.end = Math.max(last.end, r.end);
    } else {
      out.push({ ...r });
    }
  }
  return out;
}

function useHighlighter() {
  // highlightsMap: { [questionId]: { [field]: [{ id, start, end }] } }
  const [highlightsMap, setHighlightsMap] = useState({});
  const [pending, setPending] = useState(null); // { qId, field, containerEl, x, y, range }

  function addHighlight(qId, field, start, end) {
    if (end <= start) return;
    setHighlightsMap((prev) => {
      const qMap = prev[qId] || {};
      const existing = qMap[field] || [];
      const id = `hl_${Date.now()}_${Math.round(Math.random() * 1e6)}`;
      const merged = mergeHighlightRanges([...existing, { id, start, end }]);
      return { ...prev, [qId]: { ...qMap, [field]: merged } };
    });
  }

  function removeHighlight(qId, field, highlightId) {
    setHighlightsMap((prev) => {
      const qMap = prev[qId] || {};
      const existing = qMap[field] || [];
      return { ...prev, [qId]: { ...qMap, [field]: existing.filter((h) => h.id !== highlightId) } };
    });
  }

  // Called on mouseUp/keyUp inside a highlightable container — shows the
  // floating "Highlight" button near the selection instead of auto-applying,
  // so reading/selecting text to review it doesn't accidentally highlight it.
  function handleSelectionInContainer(qId, field, containerEl) {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || sel.rangeCount === 0) { setPending(null); return; }
    const range = sel.getRangeAt(0);
    if (!containerEl.contains(range.commonAncestorContainer)) { setPending(null); return; }
    const text = sel.toString();
    if (!text || !text.trim()) { setPending(null); return; }
    const rect = range.getBoundingClientRect();
    setPending({ qId, field, containerEl, range: range.cloneRange(), x: rect.left + rect.width / 2, y: rect.top });
  }

  function commitPending() {
    if (!pending) return;
    const { qId, field, containerEl, range } = pending;
    const { start, end } = rangeToOffsets(containerEl, range);
    addHighlight(qId, field, start, end);
    window.getSelection()?.removeAllRanges();
    setPending(null);
  }

  // Alt+H (Option+H on macOS fires the same altKey flag) applies the current
  // selection immediately, wherever it is, without needing the floating button.
  function handleGlobalKeyDown(e, qId) {
    if (!(e.altKey && e.key.toLowerCase() === "h")) return;
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || sel.rangeCount === 0) return;
    const range = sel.getRangeAt(0);
    const anchor = range.commonAncestorContainer;
    const anchorEl = anchor.nodeType === 3 ? anchor.parentElement : anchor;
    const containerEl = anchorEl?.closest?.("[data-hl-field]");
    if (!containerEl) return;
    e.preventDefault();
    const field = containerEl.getAttribute("data-hl-field");
    const { start, end } = rangeToOffsets(containerEl, range);
    addHighlight(qId, field, start, end);
    sel.removeAllRanges();
    setPending(null);
  }

  function clearPending() { setPending(null); }

  return { highlightsMap, pending, handleSelectionInContainer, commitPending, handleGlobalKeyDown, removeHighlight, clearPending };
}

// Derives an array of plain-text strings interleaved with clickable <mark>
// elements from raw text + a set of {start,end} ranges. Pure/side-effect
// free — safe to call on every render.
function renderHighlightedText(text, ranges, onRemoveHighlight) {
  if (!ranges || ranges.length === 0) return text;
  const sorted = [...ranges].sort((a, b) => a.start - b.start);
  const nodes = [];
  let cursor = 0;
  sorted.forEach((r) => {
    const start = Math.max(cursor, Math.min(r.start, text.length));
    const end = Math.max(start, Math.min(r.end, text.length));
    if (start > cursor) nodes.push(text.slice(cursor, start));
    if (end > start) {
      nodes.push(
        <mark
          key={r.id}
          data-highlight-id={r.id}
          title="Click to remove highlight"
          onClick={(e) => { e.stopPropagation(); onRemoveHighlight(r.id); }}
          style={{
            background: HIGHLIGHT_BG, color: HIGHLIGHT_TEXT, borderRadius: 2, padding: "0 1px",
            cursor: "pointer", transition: "background 0.15s ease",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = HIGHLIGHT_BG_HOVER; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = HIGHLIGHT_BG; }}
        >
          {text.slice(start, end)}
        </mark>
      );
    }
    cursor = end;
  });
  if (cursor < text.length) nodes.push(text.slice(cursor));
  return nodes;
}


// ---------------------------------------------------------------------------
// Small shared UI atoms (light theme, used outside the exam screen)
// ---------------------------------------------------------------------------
function Pill({ children, tone = "muted", T = LIGHT }) {
  const tones = {
    muted: { bg: T.mutedBg, fg: T.muted },
    blue: { bg: T.blueLight, fg: T.blueDeep },
    green: { bg: T.greenLight, fg: T.green },
    red: { bg: T.redLight, fg: T.red },
    amber: { bg: T.amberLight, fg: T.amber },
  };
  const t = tones[tone];
  return (
    <span
      style={{
        background: t.bg, color: t.fg, fontFamily: FONT_UI, fontSize: 11, fontWeight: 600,
        letterSpacing: "0.04em", textTransform: "uppercase", padding: "3px 9px",
        borderRadius: 999, display: "inline-block",
      }}
    >
      {children}
    </span>
  );
}

function PrimaryButton({ children, onClick, disabled, icon: Icon, style, T = LIGHT }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        fontFamily: FONT_UI, fontWeight: 600, fontSize: 14, color: disabled ? "#FFFFFF" : T.onBlue,
        background: disabled ? "#9FB3C4" : T.blue, border: "none", borderRadius: 6,
        padding: "10px 18px", display: "inline-flex", alignItems: "center", gap: 8,
        cursor: disabled ? "not-allowed" : "pointer", ...style,
      }}
      onMouseEnter={(e) => { if (!disabled) e.currentTarget.style.background = T.blueDeep; }}
      onMouseLeave={(e) => { if (!disabled) e.currentTarget.style.background = T.blue; }}
    >
      {Icon && <Icon size={16} />}
      {children}
    </button>
  );
}

function GhostButton({ children, onClick, icon: Icon, style, disabled, T = LIGHT }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        fontFamily: FONT_UI, fontWeight: 600, fontSize: 13, color: disabled ? "#A7B3B6" : T.ink,
        background: "transparent", border: `1px solid ${T.border}`, borderRadius: 6,
        padding: "9px 14px", display: "inline-flex", alignItems: "center", gap: 7,
        cursor: disabled ? "not-allowed" : "pointer", ...style,
      }}
    >
      {Icon && <Icon size={15} />}
      {children}
    </button>
  );
}

function SettingsMenu({ darkMode, setDarkMode, T }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ position: "relative", flexShrink: 0 }}>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          display: "flex", alignItems: "center", gap: 6, background: "transparent",
          border: `1px solid ${T.border}`, borderRadius: 6, padding: "9px 14px", cursor: "pointer",
          fontFamily: FONT_UI, fontWeight: 600, fontSize: 13, color: T.ink,
        }}
      >
        <SettingsIcon size={15} /> Settings
      </button>
      {open && (
        <div style={{
          position: "absolute", top: 42, right: 0, background: T.card, border: `1px solid ${T.border}`,
          borderRadius: 8, padding: 14, width: 170, zIndex: 70, boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
        }}>
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: FONT_UI, fontSize: 13, cursor: "pointer", color: T.ink }}>
            <input type="checkbox" checked={darkMode} onChange={() => setDarkMode((v) => !v)} />
            Dark mode
          </label>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Import screen
// ---------------------------------------------------------------------------
function ImportScreen({ onImport, T, darkMode, setDarkMode }) {
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [showSchema, setShowSchema] = useState(false);
  const [copied, setCopied] = useState(false);
  const [recipeSize, setRecipeSize] = useState(25);
  const [recipeFocusMode, setRecipeFocusMode] = useState("standard");
  const [recipeFocusValue, setRecipeFocusValue] = useState("");
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const fileRef = useRef(null);

  const recipeText = buildQuestionRecipe({ size: recipeSize, focusMode: recipeFocusMode, focusValue: recipeFocusValue.trim() });

  function handleSubmit() {
    const result = validateExamData(text);
    if (!result.valid) { setError(result.error); return; }
    setError("");
    onImport(result.data);
  }

  function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setText(ev.target.result);
      const result = validateExamData(ev.target.result);
      setError(result.valid ? "" : result.error);
    };
    reader.readAsText(file);
  }

  function copyPrompt() {
    navigator.clipboard.writeText(recipeText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    }).catch(() => {});
  }

  return (
    <div style={{ maxWidth: 880, margin: "0 auto", padding: "48px 20px 80px", position: "relative" }}>
      <style>{`@import url('${FONT_IMPORT_URL}');`}</style>

      <div style={{ position: "absolute", top: 48, right: 20 }}>
        <SettingsMenu darkMode={darkMode} setDarkMode={setDarkMode} T={T} />
      </div>

      <div style={{ textAlign: "center", marginBottom: 36 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12 }}>
          <Activity size={34} color={T.blue} strokeWidth={2.5} />
          <span style={{ fontFamily: FONT_MONO, fontSize: 44, letterSpacing: "0.1em", color: T.blue, fontWeight: 700 }}>
            OWORLD
          </span>
        </div>
      </div>

      <h1 style={{ fontFamily: FONT_DISPLAY, fontSize: 38, fontWeight: 600, color: T.ink, margin: "0 0 10px" }}>
        Timed exam, built from your own vignettes.
      </h1>
      <p style={{ fontFamily: FONT_UI, fontSize: 15, color: T.muted, lineHeight: 1.6, maxWidth: 620, marginBottom: 32 }}>
        Import a block of questions generated in NotebookLM or Gemini as JSON, then take it in an interface
        modeled on the real NBME/USMLE testing software — item navigator, lab values, notes, calculator,
        and a full performance breakdown when you're done.
      </p>

      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 24, marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <FileJson size={17} color={T.ink} />
            <span style={{ fontFamily: FONT_UI, fontWeight: 600, fontSize: 14, color: T.ink }}>
              Paste or upload exam JSON
            </span>
          </div>
          <button
            onClick={() => fileRef.current?.click()}
            style={{
              fontFamily: FONT_UI, fontSize: 13, fontWeight: 600, color: T.blue, background: "transparent",
              border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
            }}
          >
            <Upload size={14} /> Upload file
          </button>
          <input ref={fileRef} type="file" accept=".json,application/json" onChange={handleFile} style={{ display: "none" }} />
        </div>

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste the JSON block Gemini generated here…"
          style={{
            width: "100%", minHeight: 220, fontFamily: FONT_MONO, fontSize: 12.5, color: T.ink,
            background: T.paper, border: `1px solid ${T.border}`, borderRadius: 8, padding: 14,
            resize: "vertical", boxSizing: "border-box", lineHeight: 1.6,
          }}
        />

        {error && (
          <div style={{
            marginTop: 12, display: "flex", gap: 8, alignItems: "flex-start", background: T.redLight,
            color: T.red, padding: "10px 12px", borderRadius: 6, fontFamily: FONT_UI, fontSize: 13,
          }}>
            <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
            <span>{error}</span>
          </div>
        )}

        <div style={{ display: "flex", gap: 10, marginTop: 16, flexWrap: "wrap" }}>
          <PrimaryButton T={T} onClick={handleSubmit} icon={Play} disabled={!text.trim()}>Load exam</PrimaryButton>
          <GhostButton T={T} onClick={() => onImport(DEMO_EXAM)} icon={ClipboardList}>Try a 3-question demo</GhostButton>
          <GhostButton T={T} onClick={() => setShowSchema((s) => !s)} icon={showSchema ? ChevronUp : ChevronDown}>
            {showSchema ? "Hide" : ""} Question Recipe
          </GhostButton>
        </div>
      </div>

      {showSchema && (
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 24 }}>
          <p style={{ fontFamily: FONT_UI, fontSize: 13.5, color: T.muted, lineHeight: 1.6, marginTop: 0 }}>
            Configure a block below, then copy the generated recipe into Gemini (or drop it into NotebookLM
            alongside your source material). It returns questions in the exact shape this app expects.
          </p>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 24, marginBottom: 18 }}>
            <div>
              <div style={{ fontFamily: FONT_UI, fontWeight: 600, fontSize: 12, color: T.ink, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>
                Block size
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                {BLOCK_SIZES.map((n) => (
                  <button
                    key={n}
                    onClick={() => setRecipeSize(n)}
                    style={{
                      fontFamily: FONT_UI, fontWeight: 600, fontSize: 13, padding: "7px 14px", borderRadius: 6,
                      border: `1.5px solid ${recipeSize === n ? T.blue : T.border}`,
                      background: recipeSize === n ? T.blueLight : "transparent",
                      color: recipeSize === n ? T.blueDeep : T.ink, cursor: "pointer",
                    }}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div style={{ fontFamily: FONT_UI, fontWeight: 600, fontSize: 12, color: T.ink, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>
                Focus
              </div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {FOCUS_MODES.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setRecipeFocusMode(m.id)}
                    style={{
                      fontFamily: FONT_UI, fontWeight: 600, fontSize: 13, padding: "7px 14px", borderRadius: 6,
                      border: `1.5px solid ${recipeFocusMode === m.id ? T.blue : T.border}`,
                      background: recipeFocusMode === m.id ? T.blueLight : "transparent",
                      color: recipeFocusMode === m.id ? T.blueDeep : T.ink, cursor: "pointer",
                    }}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {recipeFocusMode !== "standard" && (
            <input
              value={recipeFocusValue}
              onChange={(e) => setRecipeFocusValue(e.target.value)}
              placeholder={recipeFocusMode === "systems" ? "e.g. Cardiovascular, Renal, Neuro…" : "e.g. Pharmacology, Biochemistry, Microbiology…"}
              style={{
                width: "100%", boxSizing: "border-box", fontFamily: FONT_UI, fontSize: 13.5, color: T.ink,
                border: `1px solid ${T.border}`, borderRadius: 6, padding: "9px 12px", marginBottom: 18,
              }}
            />
          )}

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <span style={{ fontFamily: FONT_UI, fontWeight: 600, fontSize: 12.5, color: T.ink, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Question Recipe — Gemini / NotebookLM prompt
            </span>
            <button
              onClick={copyPrompt}
              style={{
                fontFamily: FONT_UI, fontSize: 12.5, fontWeight: 600, color: copied ? T.green : T.blue,
                background: "transparent", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 5,
              }}
            >
              {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? "Copied" : "Copy"}
            </button>
          </div>
          <pre style={{
            fontFamily: FONT_MONO, fontSize: 11.5, color: T.ink, background: T.paper,
            border: `1px solid ${T.border}`, borderRadius: 8, padding: 14, whiteSpace: "pre-wrap",
            wordBreak: "break-word", lineHeight: 1.6, margin: 0,
          }}>
            {recipeText}
          </pre>
          <div style={{ marginTop: 18, fontFamily: FONT_UI, fontWeight: 600, fontSize: 12.5, color: T.ink, textTransform: "uppercase", letterSpacing: "0.05em" }}>
            JSON schema
          </div>
          <pre style={{
            fontFamily: FONT_MONO, fontSize: 11.5, color: T.ink, background: T.paper,
            border: `1px solid ${T.border}`, borderRadius: 8, padding: 14, marginTop: 8,
            whiteSpace: "pre-wrap", wordBreak: "break-word", lineHeight: 1.6,
          }}>
            {SCHEMA_TEXT}
          </pre>
        </div>
      )}

      <div style={{ marginTop: 48, paddingTop: 20, borderTop: `1px solid ${T.border}`, textAlign: "center" }}>
        <p style={{ fontFamily: FONT_UI, fontSize: 12, color: T.muted, margin: "0 0 6px" }}>
          OWORLD is created by <strong style={{ color: T.ink }}>Oscar Perez</strong> — Medical student | Founder of Verde+
        </p>
        <button
          onClick={() => setShowDisclaimer(true)}
          style={{
            fontFamily: FONT_UI, fontSize: 11.5, color: T.muted, background: "transparent", border: "none",
            cursor: "pointer", textDecoration: "underline", padding: 0,
          }}
        >
          Not affiliated with NBME or USMLE®
        </button>
      </div>

      {showDisclaimer && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(10,15,20,0.6)", display: "flex", alignItems: "center",
          justifyContent: "center", zIndex: 95, padding: 20,
        }}>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 26, maxWidth: 440 }}>
            <h3 style={{ fontFamily: FONT_UI, fontSize: 16, fontWeight: 700, color: T.ink, margin: "0 0 10px" }}>
              Trademark disclaimer
            </h3>
            <p style={{ fontFamily: FONT_UI, fontSize: 13.5, color: T.muted, lineHeight: 1.6, margin: "0 0 12px" }}>
              OWORLD is an independent, unofficial study tool for running practice question blocks you
              generate yourself with third-party AI tools. It is not produced, endorsed, licensed, or
              affiliated with the National Board of Medical Examiners (NBME) or the Federation of State
              Medical Boards (FSMB).
            </p>
            <p style={{ fontFamily: FONT_UI, fontSize: 13.5, color: T.muted, lineHeight: 1.6, margin: "0 0 20px" }}>
              USMLE® is a registered trademark of the NBME and FSMB. Any resemblance to their exam
              interface or terminology is used for descriptive and educational purposes only.
            </p>
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <PrimaryButton T={T} onClick={() => setShowDisclaimer(false)}>Close</PrimaryButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Lobby / block select
// ---------------------------------------------------------------------------
function Lobby({ examData, blockStates, onStart, onReview, onReset, onFinalSummary, onToggleTimed, onRetestMissed, onRetestAll, T, darkMode, setDarkMode }) {
  const allDone = blockStates.every((b) => b.status === "done");
  const anyDone = blockStates.some((b) => b.status === "done");

  return (
    <div style={{ maxWidth: 880, margin: "0 auto", padding: "48px 20px 80px" }}>
      <style>{`@import url('${FONT_IMPORT_URL}');`}</style>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28, gap: 16, flexWrap: "wrap" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
            <Activity size={20} color={T.blue} strokeWidth={2.5} />
            <span style={{ fontFamily: FONT_MONO, fontSize: 12, letterSpacing: "0.12em", color: T.blue, fontWeight: 600 }}>
              OWORLD
            </span>
          </div>
          <h1 style={{ fontFamily: FONT_DISPLAY, fontSize: 30, fontWeight: 600, color: T.ink, margin: 0 }}>
            {examData.examTitle || "Practice Exam"}
          </h1>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          {allDone && <PrimaryButton T={T} onClick={onFinalSummary} icon={ClipboardList}>Full exam summary</PrimaryButton>}
          <GhostButton T={T} onClick={onReset} icon={RotateCcw}>Import new exam</GhostButton>
          <SettingsMenu darkMode={darkMode} setDarkMode={setDarkMode} T={T} />
        </div>
      </div>

      <div style={{ display: "grid", gap: 14 }}>
        {examData.blocks.map((block, idx) => {
          const bs = blockStates[idx];
          const total = block.questions.length;
          const answered = Object.values(bs.answers).filter((a) => a.selected).length;
          return (
            <div key={idx} style={{
              background: T.card, border: `1px solid ${T.border}`, borderRadius: 10,
              padding: "20px 22px", display: "flex", justifyContent: "space-between",
              alignItems: "center", flexWrap: "wrap", gap: 14,
            }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                  <span style={{ fontFamily: FONT_UI, fontWeight: 700, fontSize: 16, color: T.ink }}>
                    {block.blockName}
                  </span>
                  {bs.status === "pending" && <Pill T={T} tone="muted">Not started</Pill>}
                  {bs.status === "in-progress" && <Pill T={T} tone="blue">In progress · {answered}/{total} answered</Pill>}
                  {bs.status === "done" && (
                    <Pill T={T} tone={bs.score.pct >= 70 ? "green" : "red"}>
                      {bs.score.correct}/{bs.score.total} · {bs.score.pct}%
                    </Pill>
                  )}
                </div>
                <span style={{ fontFamily: FONT_MONO, fontSize: 12.5, color: T.muted }}>
                  {total} questions &nbsp;·&nbsp; {bs.timed ? `${Math.round(bs.timeLeft / 60)} min limit` : "Untimed"}
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                {bs.status !== "done" && (
                  <label style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: FONT_UI, fontSize: 12.5, color: T.muted, cursor: "pointer" }}>
                    <input type="checkbox" checked={bs.timed} onChange={() => onToggleTimed(idx)} />
                    Timed
                  </label>
                )}
                {bs.status === "done" ? (
                  <>
                    <GhostButton T={T} onClick={() => onReview(idx)} icon={ChevronRight}>Review</GhostButton>
                    {bs.score.correct < bs.score.total && (
                      <GhostButton T={T} onClick={() => onRetestMissed(idx)} icon={RotateCcw}>
                        Retest missed ({bs.score.total - bs.score.correct})
                      </GhostButton>
                    )}
                    <GhostButton T={T} onClick={() => onRetestAll(idx)} icon={RotateCcw}>
                      Retest entire block ({total})
                    </GhostButton>
                  </>
                ) : (
                  <PrimaryButton T={T} onClick={() => onStart(idx)} icon={Play}>
                    {bs.status === "in-progress" ? "Resume block" : "Start block"}
                  </PrimaryButton>
                )}
              </div>
            </div>
          );
        })}
      </div>
      {!anyDone && (
        <p style={{ fontFamily: FONT_UI, fontSize: 12.5, color: T.muted, marginTop: 20 }}>
          Timing starts the moment you click "Start block" — the countdown runs even if you navigate away.
        </p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Calculator (floating tool)
// ---------------------------------------------------------------------------
function CalculatorPanel({ T, onClose }) {
  const [display, setDisplay] = useState("0");
  const [stored, setStored] = useState(null);
  const [pendingOp, setPendingOp] = useState(null);
  const [memory, setMemory] = useState(0);
  const [fresh, setFresh] = useState(true);

  function inputDigit(d) {
    setDisplay((prev) => (fresh || prev === "0" ? String(d) : prev + d));
    setFresh(false);
  }
  function inputDot() {
    setDisplay((prev) => (fresh ? "0." : prev.includes(".") ? prev : prev + "."));
    setFresh(false);
  }
  function clearAll() {
    setDisplay("0"); setStored(null); setPendingOp(null); setFresh(true);
  }
  function applyOp(op) {
    const cur = parseFloat(display);
    if (stored === null) {
      setStored(cur);
    } else if (pendingOp) {
      setStored(compute(stored, cur, pendingOp));
    }
    setPendingOp(op);
    setFresh(true);
  }
  function compute(a, b, op) {
    switch (op) {
      case "+": return a + b;
      case "-": return a - b;
      case "×": return a * b;
      case "÷": return b === 0 ? 0 : a / b;
      default: return b;
    }
  }
  function equals() {
    const cur = parseFloat(display);
    if (pendingOp && stored !== null) {
      const result = compute(stored, cur, pendingOp);
      setDisplay(String(result));
      setStored(null);
      setPendingOp(null);
      setFresh(true);
    }
  }
  function toggleSign() { setDisplay((prev) => String(parseFloat(prev) * -1)); }
  function sqrt() { setDisplay((prev) => String(Math.sqrt(Math.abs(parseFloat(prev))))); setFresh(true); }
  function reciprocal() { setDisplay((prev) => { const v = parseFloat(prev); return String(v === 0 ? 0 : 1 / v); }); setFresh(true); }

  const btnStyle = {
    fontFamily: FONT_MONO, fontWeight: 600, fontSize: 15, padding: "10px 0", borderRadius: 6,
    border: `1px solid ${T.border}`, background: "transparent", color: T.ink, cursor: "pointer",
  };
  const opStyle = { ...btnStyle, background: T.blueLight, color: T.blue };

  return (
    <div style={{
      position: "fixed", right: 24, bottom: 90, width: 260, background: T.card, border: `1px solid ${T.border}`,
      borderRadius: 10, padding: 14, zIndex: 60, boxShadow: "0 8px 28px rgba(0,0,0,0.35)",
    }}>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 8 }}>
        <button onClick={onClose} style={{ background: "transparent", border: "none", cursor: "pointer", color: T.muted }}>
          <X size={16} />
        </button>
      </div>
      <div style={{
        fontFamily: FONT_MONO, fontSize: 22, textAlign: "right", color: T.ink, background: T.paper,
        border: `1px solid ${T.border}`, borderRadius: 6, padding: "10px 12px", marginBottom: 10, overflow: "hidden",
      }}>
        {display}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6 }}>
        <button style={btnStyle} onClick={() => setMemory(memory + parseFloat(display))}>M+</button>
        <button style={btnStyle} onClick={() => { setDisplay(String(memory)); setFresh(true); }}>MR</button>
        <button style={btnStyle} onClick={() => setMemory(0)}>MC</button>
        <button style={{ ...btnStyle, color: T.red }} onClick={clearAll}>C</button>

        <button style={btnStyle} onClick={toggleSign}>±</button>
        <button style={btnStyle} onClick={sqrt}>√</button>
        <button style={btnStyle} onClick={reciprocal}>1/x</button>
        <button style={opStyle} onClick={() => applyOp("÷")}>÷</button>

        <button style={btnStyle} onClick={() => inputDigit(7)}>7</button>
        <button style={btnStyle} onClick={() => inputDigit(8)}>8</button>
        <button style={btnStyle} onClick={() => inputDigit(9)}>9</button>
        <button style={opStyle} onClick={() => applyOp("×")}>×</button>

        <button style={btnStyle} onClick={() => inputDigit(4)}>4</button>
        <button style={btnStyle} onClick={() => inputDigit(5)}>5</button>
        <button style={btnStyle} onClick={() => inputDigit(6)}>6</button>
        <button style={opStyle} onClick={() => applyOp("-")}>-</button>

        <button style={btnStyle} onClick={() => inputDigit(1)}>1</button>
        <button style={btnStyle} onClick={() => inputDigit(2)}>2</button>
        <button style={btnStyle} onClick={() => inputDigit(3)}>3</button>
        <button style={opStyle} onClick={() => applyOp("+")}>+</button>

        <button style={{ ...btnStyle, gridColumn: "span 2" }} onClick={() => inputDigit(0)}>0</button>
        <button style={btnStyle} onClick={inputDot}>.</button>
        <button style={{ ...opStyle, fontWeight: 700 }} onClick={equals}>=</button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Exam taking screen
// ---------------------------------------------------------------------------
function ExamScreen({ block, blockState, setBlockState, onSubmitBlock, darkMode, setDarkMode }) {
  const [qIdx, setQIdx] = useState(0);
  const [confirmSubmit, setConfirmSubmit] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [labOpen, setLabOpen] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);
  const [calcOpen, setCalcOpen] = useState(false);
  const [locked, setLocked] = useState(false);
  const [hintsEnabled, setHintsEnabled] = useState(true);
  const [showHint, setShowHint] = useState(false);
  const [labSearch, setLabSearch] = useState("");
  const [labTab, setLabTab] = useState("Serum");
  const [siUnits, setSiUnits] = useState(false);

  const { highlightsMap, pending, handleSelectionInContainer, commitPending, handleGlobalKeyDown, removeHighlight, clearPending } = useHighlighter();

  const T = darkMode ? DARK : LIGHT;
  const questions = block.questions;
  const q = questions[qIdx];
  const qState = blockState.answers[q.id] || { selected: null, struck: [], flagged: false };
  const noteText = blockState.notes?.[q.id] || "";

  useEffect(() => { setShowHint(false); clearPending(); }, [qIdx]);

  // Alt+H (Option+H on macOS) applies a highlight to the current text
  // selection, wherever the cursor is within the question content.
  useEffect(() => {
    const handler = (e) => handleGlobalKeyDown(e, q.id);
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [q.id, handleGlobalKeyDown]);

  const highlightBtnRef = useRef(null);
  useEffect(() => {
    if (!pending) return;
    function onDocMouseDown(e) {
      if (highlightBtnRef.current && highlightBtnRef.current.contains(e.target)) return;
      clearPending();
    }
    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, [pending, clearPending]);

  const timed = blockState.timed;

  // Timer — only runs when this block is set to timed
  useEffect(() => {
    if (blockState.status !== "in-progress" || !timed) return;
    const interval = setInterval(() => {
      setBlockState((prev) => {
        if (locked) return prev;
        if (prev.timeLeft <= 1) { clearInterval(interval); return { ...prev, timeLeft: 0 }; }
        return { ...prev, timeLeft: prev.timeLeft - 1 };
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [blockState.status, setBlockState, locked, timed]);

  useEffect(() => {
    if (blockState.status === "in-progress" && timed && blockState.timeLeft === 0) onSubmitBlock();
  }, [blockState.timeLeft, blockState.status, timed, onSubmitBlock]);

  function updateQState(patch) {
    setBlockState((prev) => ({ ...prev, answers: { ...prev.answers, [q.id]: { ...qState, ...patch } } }));
  }
  function setNote(text) {
    setBlockState((prev) => ({ ...prev, notes: { ...prev.notes, [q.id]: text } }));
  }
  function selectOption(key) {
    if (qState.struck.includes(key)) return;
    updateQState({ selected: qState.selected === key ? null : key });
  }
  function toggleStrike(e, key) {
    e.stopPropagation();
    const struck = qState.struck.includes(key) ? qState.struck.filter((k) => k !== key) : [...qState.struck, key];
    const selected = qState.selected === key && !qState.struck.includes(key) ? null : qState.selected;
    updateQState({ struck, selected });
  }
  function toggleFlag() { updateQState({ flagged: !qState.flagged }); }
  function goNext() {
    if (qIdx < questions.length - 1) setQIdx((i) => i + 1);
    else setConfirmSubmit(true);
  }

  const flaggedCount = Object.values(blockState.answers).filter((a) => a.flagged).length;
  const answeredCount = Object.values(blockState.answers).filter((a) => a.selected).length;
  const activeLabRows = LAB_DATA[labTab] || [];
  const filteredLabRows = (() => {
    if (!labSearch.trim()) return activeLabRows;
    const q = labSearch.toLowerCase();
    const out = [];
    let pendingHeader = null;
    activeLabRows.forEach((row) => {
      if (row.h) { pendingHeader = row; return; }
      if (row.name.toLowerCase().includes(q)) {
        if (pendingHeader) { out.push(pendingHeader); pendingHeader = null; }
        out.push(row);
      }
    });
    return out;
  })();

  const toolBtnStyle = (active) => ({
    display: "flex", flexDirection: "column", alignItems: "center", gap: 3, background: "transparent",
    border: "none", cursor: "pointer", color: active ? T.blue : "#fff", fontFamily: FONT_UI, fontSize: 11, fontWeight: 600,
  });

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", background: T.paper, overflow: "hidden" }}>
      <style>{`@import url('${FONT_IMPORT_URL}');`}</style>

      {/* Top toolbar */}
      <div style={{
        background: T.navy, color: "#fff", padding: "10px 20px", display: "flex", alignItems: "center",
        justifyContent: "space-between", flexWrap: "wrap", gap: 14, borderBottom: `1px solid ${T.border}`, flexShrink: 0,
      }}>
        <div style={{
          border: `1.5px solid #fff`, borderRadius: 4, padding: "6px 14px", fontFamily: FONT_UI, fontSize: 13, lineHeight: 1.5,
        }}>
          Item: {qIdx + 1} of {questions.length}<br />Block: 1 of 1
        </div>

        {block.isRetest && (
          <div style={{
            display: "flex", alignItems: "center", gap: 6, background: T.amberLight, color: T.amber,
            border: `1px solid ${T.amber}`, borderRadius: 999, padding: "5px 12px",
            fontFamily: FONT_UI, fontSize: 12, fontWeight: 700,
          }}>
            <RotateCcw size={13} />
            Retest Mode: {block.retestType === "missed" ? "Missed Questions" : "Full Block"} ({block.retestCount} Item{block.retestCount === 1 ? "" : "s"})
          </div>
        )}

        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <button onClick={() => setQIdx((i) => Math.max(0, i - 1))} disabled={qIdx === 0} style={toolBtnStyle(false)}>
            <ChevronLeft size={26} style={{ opacity: qIdx === 0 ? 0.35 : 1 }} />
            Previous
          </button>
          <span style={{ fontFamily: FONT_UI, fontSize: 13 }}>{qIdx + 1} / {questions.length}</span>
          <button onClick={goNext} style={toolBtnStyle(false)}>
            <ChevronRight size={26} />
            Next
          </button>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
          <button onClick={() => setLabOpen((v) => !v)} style={toolBtnStyle(labOpen)}>
            <FlaskConical size={20} /> Lab Values
          </button>
          <button onClick={() => setNotesOpen((v) => !v)} style={toolBtnStyle(notesOpen)}>
            <PencilLine size={20} /> Notes
          </button>
          <button onClick={() => setCalcOpen((v) => !v)} style={toolBtnStyle(calcOpen)}>
            <CalcIcon size={20} /> Calculator
          </button>
          <div style={{ position: "relative" }}>
            <button onClick={() => setSettingsOpen((v) => !v)} style={toolBtnStyle(settingsOpen)}>
              <SettingsIcon size={20} /> Settings
            </button>
            {settingsOpen && (
              <div style={{
                position: "absolute", top: 44, right: 0, background: T.card, color: T.ink, border: `1px solid ${T.border}`,
                borderRadius: 8, padding: 14, width: 190, zIndex: 70, boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
              }}>
                <label style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: FONT_UI, fontSize: 13, cursor: "pointer", marginBottom: 10 }}>
                  <input type="checkbox" checked={darkMode} onChange={() => setDarkMode((v) => !v)} />
                  Dark mode
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: FONT_UI, fontSize: 13, cursor: "pointer", marginBottom: 10 }}>
                  <input type="checkbox" checked={timed} onChange={() => setBlockState((prev) => ({ ...prev, timed: !prev.timed }))} />
                  Timed block
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: FONT_UI, fontSize: 13, cursor: "pointer" }}>
                  <input type="checkbox" checked={hintsEnabled} onChange={() => setHintsEnabled((v) => !v)} />
                  Hints
                </label>
              </div>
            )}
          </div>
        </div>
      </div>

      <div style={{ flex: 1, display: "flex", minHeight: 0, overflow: "hidden" }}>
        {/* Left navigator */}
        <div style={{
          width: 130, flexShrink: 0, background: T.card, borderRight: `1px solid ${T.border}`, padding: "16px 0",
          display: "flex", flexDirection: "column", overflow: "hidden",
        }}>
          <div style={{
            fontFamily: FONT_UI, fontWeight: 700, fontSize: 13, color: T.ink, textAlign: "center", marginBottom: 10,
          }}>
            Question Status
          </div>
          <div style={{ flex: 1, overflowY: "auto" }}>
            {questions.map((qq, i) => {
              const st = blockState.answers[qq.id];
              const isCurrent = i === qIdx;
              return (
                <div
                  key={qq.id}
                  onClick={() => setQIdx(i)}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "6px 0",
                    cursor: "pointer", background: isCurrent ? T.blue : "transparent",
                    color: isCurrent ? T.onBlue : T.ink, fontFamily: FONT_UI, fontSize: 14,
                  }}
                >
                  <span style={{ fontSize: 9, opacity: st?.selected ? 1 : 0.35 }}>●</span>
                  <span>{i + 1}</span>
                  {st?.flagged && <Flag size={11} color={isCurrent ? T.onBlue : T.flagRed} fill={isCurrent ? T.onBlue : T.flagRed} />}
                </div>
              );
            })}
          </div>
        </div>

        {/* Question body */}
        <div style={{ flex: 1, padding: "30px 40px 40px", maxWidth: 900, overflowY: "auto", minHeight: 0 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
              <input type="checkbox" checked={qState.flagged} onChange={toggleFlag} />
              <Flag size={16} color={T.flagRed} fill={T.flagRed} />
              <span style={{ fontFamily: FONT_UI, fontWeight: 600, fontSize: 14, color: T.ink }}>Mark Question</span>
            </label>

            {hintsEnabled && (
              <button
                onClick={() => setShowHint((v) => !v)}
                style={{
                  display: "flex", alignItems: "center", gap: 6, background: "transparent",
                  border: `1px solid ${T.border}`, borderRadius: 6, padding: "6px 12px", cursor: "pointer",
                  fontFamily: FONT_UI, fontWeight: 600, fontSize: 13, color: T.blue,
                }}
              >
                <Lightbulb size={15} />
                {showHint ? "Hide Hint" : "Show Hint"}
              </button>
            )}
          </div>

          <p style={{ fontFamily: FONT_UI, fontSize: 11.5, color: T.muted, margin: "0 0 14px", display: "flex", alignItems: "center", gap: 5 }}>
            <Highlighter size={12} /> Select text, then click Highlight — or press Alt+H (Option+H on Mac).
          </p>

          {hintsEnabled && showHint && (
            <div style={{
              display: "flex", gap: 8, alignItems: "flex-start", background: T.blueLight, color: T.ink,
              border: `1px solid ${T.blue}`, borderRadius: 6, padding: "10px 14px", marginBottom: 18,
              fontFamily: FONT_UI, fontSize: 13.5, lineHeight: 1.5,
            }}>
              <Lightbulb size={16} color={T.blue} style={{ flexShrink: 0, marginTop: 1 }} />
              <span>{q.hint || "No hint was provided for this question."}</span>
            </div>
          )}

          <p
            data-hl-field="vignette"
            onMouseUp={(e) => handleSelectionInContainer(q.id, "vignette", e.currentTarget)}
            onKeyUp={(e) => handleSelectionInContainer(q.id, "vignette", e.currentTarget)}
            style={{ fontFamily: FONT_DISPLAY, fontSize: 17, lineHeight: 1.75, color: T.ink, margin: "0 0 20px", cursor: "text" }}
          >
            {renderHighlightedText(q.vignette, highlightsMap[q.id]?.vignette, (hlId) => removeHighlight(q.id, "vignette", hlId))}
          </p>
          <p
            data-hl-field="stem"
            onMouseUp={(e) => handleSelectionInContainer(q.id, "stem", e.currentTarget)}
            onKeyUp={(e) => handleSelectionInContainer(q.id, "stem", e.currentTarget)}
            style={{ fontFamily: FONT_DISPLAY, fontSize: 17, lineHeight: 1.6, color: T.ink, marginBottom: 18, cursor: "text" }}
          >
            {renderHighlightedText(q.stem, highlightsMap[q.id]?.stem, (hlId) => removeHighlight(q.id, "stem", hlId))}
          </p>

          <div style={{ border: `1.5px solid ${T.border}`, borderRadius: 4, maxWidth: 640 }}>
            {q.options.map((opt, i) => {
              const isSelected = qState.selected === opt.key;
              const isStruck = qState.struck.includes(opt.key);
              return (
                <div
                  key={opt.key}
                  onClick={() => {
                    const sel = window.getSelection();
                    if (sel && sel.toString().trim().length > 0) return; // user was selecting text, not choosing an answer
                    selectOption(opt.key);
                  }}
                  style={{
                    display: "flex", alignItems: "center", gap: 10, cursor: "pointer",
                    background: isSelected ? T.blueLight : "transparent",
                    borderBottom: i < q.options.length - 1 ? `1px solid ${T.border}` : "none",
                    padding: "10px 14px",
                  }}
                >
                  <input type="radio" checked={isSelected} onChange={() => selectOption(opt.key)} disabled={isStruck} />
                  <span
                    data-hl-field={`option-${opt.key}`}
                    onMouseUp={(e) => { e.stopPropagation(); handleSelectionInContainer(q.id, `option-${opt.key}`, e.currentTarget); }}
                    onKeyUp={(e) => { e.stopPropagation(); handleSelectionInContainer(q.id, `option-${opt.key}`, e.currentTarget); }}
                    style={{
                      fontFamily: FONT_DISPLAY, fontSize: 15.5, color: T.ink, flex: 1,
                      textDecoration: isStruck ? "line-through" : "none", opacity: isStruck ? 0.5 : 1,
                    }}
                  >
                    {opt.key}. {renderHighlightedText(opt.text, highlightsMap[q.id]?.[`option-${opt.key}`], (hlId) => removeHighlight(q.id, `option-${opt.key}`, hlId))}
                  </span>
                  <button
                    onClick={(e) => toggleStrike(e, opt.key)}
                    title="Strike out this option"
                    style={{
                      background: "transparent", border: "none", cursor: "pointer", fontFamily: FONT_DISPLAY,
                      fontSize: 13, color: T.muted, textDecoration: "line-through", padding: "0 4px",
                    }}
                  >
                    ab
                  </button>
                </div>
              );
            })}
          </div>

          <div style={{ marginTop: 22 }}>
            <PrimaryButton T={T} onClick={goNext} style={{ background: T.blue }}>
              {qIdx < questions.length - 1 ? "Proceed to Next Item" : "Proceed to Block Summary"}
            </PrimaryButton>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div style={{
        background: T.navy, color: "#fff", padding: "10px 20px", display: "flex", alignItems: "center",
        justifyContent: "space-between", borderTop: `1px solid ${T.border}`, flexShrink: 0,
      }}>
        <div style={{ fontFamily: FONT_UI, fontSize: 13, lineHeight: 1.5 }}>
          <div>Block Time Remaining: <span style={{ fontFamily: FONT_MONO }}>{timed ? fmtTime(blockState.timeLeft) : "untimed"}</span></div>
          <div style={{ opacity: 0.75 }}>Answered: {answeredCount}/{questions.length}{flaggedCount > 0 ? ` · Flagged: ${flaggedCount}` : ""}</div>
        </div>
        <button onClick={() => setLocked(true)} style={{ ...toolBtnStyle(false), flexDirection: "row", gap: 6 }}>
          <Lock size={18} /> Lock
        </button>
        <button onClick={() => setConfirmSubmit(true)} style={{ ...toolBtnStyle(false), flexDirection: "row", gap: 6 }}>
          <XOctagon size={18} /> End Block
        </button>
      </div>

        {/* Lab values panel — in-flow split view, not an overlay, so the question stays visible */}
        {labOpen && (
          <div style={{
            width: 400, flexShrink: 0, background: T.card, borderLeft: `1px solid ${T.border}`,
            padding: 18, overflowY: "auto",
          }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <span style={{ fontFamily: FONT_UI, fontWeight: 700, fontSize: 14, color: T.ink }}>Lab Values</span>
            <button onClick={() => setLabOpen(false)} style={{ background: "transparent", border: "none", cursor: "pointer", color: T.muted }}>
              <X size={16} />
            </button>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 6, border: `1px solid ${T.border}`, borderRadius: 6, padding: "6px 10px", marginBottom: 12 }}>
            <Search size={14} color={T.muted} />
            <input
              value={labSearch}
              onChange={(e) => setLabSearch(e.target.value)}
              placeholder="Search…"
              style={{ border: "none", outline: "none", fontFamily: FONT_UI, fontSize: 13, flex: 1, background: "transparent", color: T.ink }}
            />
          </div>

          <label style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: FONT_UI, fontSize: 12.5, color: T.ink, marginBottom: 12, cursor: "pointer" }}>
            <input type="checkbox" checked={siUnits} onChange={() => setSiUnits((v) => !v)} />
            SI Reference Intervals
          </label>

          <div style={{ display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap" }}>
            {LAB_TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setLabTab(tab)}
                style={{
                  fontFamily: FONT_UI, fontSize: 12, fontWeight: 600, padding: "6px 10px", borderRadius: 999,
                  border: `1px solid ${labTab === tab ? T.blue : T.border}`,
                  background: labTab === tab ? T.blueLight : "transparent",
                  color: labTab === tab ? T.blue : T.muted, cursor: "pointer",
                }}
              >
                {tab}
              </button>
            ))}
          </div>

          <div style={{
            display: "flex", justifyContent: "space-between", padding: "4px 4px 8px", borderBottom: `1.5px solid ${T.border}`,
            fontFamily: FONT_UI, fontSize: 11.5, fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: "0.04em",
          }}>
            <span>{labTab}</span>
            <span>{siUnits ? "SI Reference Interval" : "Reference Range"}</span>
          </div>

          <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: FONT_UI, fontSize: 12.5 }}>
            <tbody>
              {filteredLabRows.map((row, i) =>
                row.h ? (
                  <tr key={`h-${i}`}>
                    <td colSpan={2} style={{ padding: "12px 4px 4px", fontWeight: 700, color: T.blue, fontSize: 12.5 }}>
                      {row.h}
                    </td>
                  </tr>
                ) : (
                  <tr key={row.name} style={{ borderBottom: `1px solid ${T.border}` }}>
                    <td style={{ padding: "6px 4px 6px", paddingLeft: row.sub ? 16 : 4, color: T.ink }}>{row.name}</td>
                    <td style={{ padding: "6px 4px", color: T.muted, textAlign: "right", whiteSpace: "nowrap" }}>
                      {siUnits ? row.si : row.value}
                    </td>
                  </tr>
                )
              )}
              {filteredLabRows.length === 0 && (
                <tr><td colSpan={2} style={{ padding: "16px 4px", color: T.muted, fontStyle: "italic" }}>No matches in {labTab}.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Notes panel */}
      {notesOpen && (
        <div style={{
          position: "fixed", right: labOpen ? 420 : 24, bottom: 90, width: 320, background: T.card,
          border: `1px solid ${T.border}`, borderRadius: 10, padding: 14, zIndex: 55, boxShadow: "0 8px 28px rgba(0,0,0,0.3)",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ fontFamily: FONT_UI, fontWeight: 700, fontSize: 13, color: T.ink }}>Notes — Item {qIdx + 1}</span>
            <button onClick={() => setNotesOpen(false)} style={{ background: "transparent", border: "none", cursor: "pointer", color: T.muted }}>
              <X size={16} />
            </button>
          </div>
          <textarea
            value={noteText}
            onChange={(e) => setNote(e.target.value)}
            style={{
              width: "100%", minHeight: 130, fontFamily: FONT_UI, fontSize: 13, border: `1px solid ${T.border}`,
              borderRadius: 6, padding: 8, resize: "vertical", boxSizing: "border-box", background: T.paper, color: T.ink,
            }}
          />
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10 }}>
            <GhostButton T={T} icon={Trash2} onClick={() => setNote("")}>Delete note</GhostButton>
            <PrimaryButton T={T} onClick={() => setNotesOpen(false)}>Save and close</PrimaryButton>
          </div>
        </div>
      )}

      {/* Calculator */}
      {calcOpen && <CalculatorPanel T={T} onClose={() => setCalcOpen(false)} />}

      {/* Floating "Highlight" button — appears near a text selection instead of
          auto-highlighting, so selecting text to read it doesn't mark it up. */}
      {pending && (
        <button
          ref={highlightBtnRef}
          onClick={commitPending}
          style={{
            position: "fixed", left: pending.x, top: pending.y - 42, transform: "translateX(-50%)",
            zIndex: 80, display: "flex", alignItems: "center", gap: 6, background: T.ink, color: T.paper,
            border: "none", borderRadius: 6, padding: "7px 12px", fontFamily: FONT_UI, fontWeight: 600,
            fontSize: 12.5, cursor: "pointer", boxShadow: "0 4px 14px rgba(0,0,0,0.35)",
          }}
        >
          <Highlighter size={13} />
          Highlight
        </button>
      )}

      {/* Lock overlay */}
      {locked && (
        <div style={{
          position: "fixed", inset: 0, background: T.navyDeep, display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", zIndex: 90, gap: 18,
        }}>
          <Lock size={36} color="#fff" />
          <p style={{ fontFamily: FONT_UI, fontSize: 15, color: "#fff" }}>Exam paused — timer is stopped.</p>
          <PrimaryButton T={T} icon={Unlock} onClick={() => setLocked(false)}>Resume block</PrimaryButton>
        </div>
      )}

      {/* End block confirmation */}
      {confirmSubmit && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(10,15,20,0.6)", display: "flex", alignItems: "center",
          justifyContent: "center", zIndex: 95, padding: 20,
        }}>
          <div style={{ background: "#fff", borderRadius: 10, padding: 28, maxWidth: 400 }}>
            <h3 style={{ fontFamily: FONT_UI, fontSize: 17, fontWeight: 700, color: LIGHT.ink, margin: "0 0 10px" }}>
              End this block?
            </h3>
            <p style={{ fontFamily: FONT_UI, fontSize: 14, color: LIGHT.muted, lineHeight: 1.55, margin: "0 0 20px" }}>
              You've answered {answeredCount} of {questions.length} questions. Once you end the block you
              can't change your answers, but you can review explanations right away.
            </p>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <GhostButton onClick={() => setConfirmSubmit(false)}>Keep working</GhostButton>
              <PrimaryButton onClick={() => { setConfirmSubmit(false); onSubmitBlock(); }}>End block</PrimaryButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Results / review screen (single block)
// ---------------------------------------------------------------------------
function BlockResults({ block, blockState, onBackToLobby, onRetestMissed, onRetestAll, onLoadNewExam, T, darkMode, setDarkMode }) {
  const [expanded, setExpanded] = useState(null);
  const { score } = blockState;

  const subjectRows = useMemo(() => {
    const map = {};
    block.questions.forEach((q) => {
      const subj = q.subject || "General";
      const a = blockState.answers[q.id];
      const correct = a?.selected === q.correctAnswer;
      if (!map[subj]) map[subj] = { subject: subj, correct: 0, total: 0 };
      map[subj].total += 1;
      if (correct) map[subj].correct += 1;
    });
    return Object.values(map).map((r) => ({ ...r, pct: Math.round((r.correct / r.total) * 100) }));
  }, [block, blockState]);

  return (
    <div style={{ maxWidth: 880, margin: "0 auto", padding: "44px 20px 80px" }}>
      <style>{`@import url('${FONT_IMPORT_URL}');`}</style>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
        <GhostButton T={T} icon={ChevronLeft} onClick={onBackToLobby}>Back to blocks</GhostButton>
        <SettingsMenu darkMode={darkMode} setDarkMode={setDarkMode} T={T} />
      </div>

      <h1 style={{ fontFamily: FONT_DISPLAY, fontSize: 28, fontWeight: 600, color: T.ink, margin: "0 0 4px" }}>
        {block.blockName} — results
      </h1>
      <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 20 }}>
        <span style={{ fontFamily: FONT_MONO, fontSize: 32, fontWeight: 600, color: score.pct >= 70 ? T.green : T.red }}>
          {score.pct}%
        </span>
        <span style={{ fontFamily: FONT_UI, fontSize: 14, color: T.muted }}>
          {score.correct} correct out of {score.total} · {score.total - score.answered} unanswered
        </span>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 28 }}>
        {score.correct < score.total ? (
          <PrimaryButton T={T} onClick={onRetestMissed} icon={RotateCcw}>
            Retest Missed Questions ({score.total - score.correct})
          </PrimaryButton>
        ) : (
          <PrimaryButton T={T} disabled icon={CheckCircle2}>
            Retest Missed Questions — perfect score!
          </PrimaryButton>
        )}
        <GhostButton T={T} onClick={onRetestAll} icon={RotateCcw}>
          Retest Entire Block ({score.total})
        </GhostButton>
        <GhostButton T={T} onClick={onLoadNewExam} icon={Upload}>
          Load New Exam
        </GhostButton>
      </div>

      {subjectRows.length > 1 && (
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: "20px 22px 8px", marginBottom: 22 }}>
          <div style={{ fontFamily: FONT_UI, fontWeight: 700, fontSize: 13, color: T.ink, marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.04em" }}>
            Performance by subject
          </div>
          <ResponsiveContainer width="100%" height={Math.max(140, subjectRows.length * 42)}>
            <BarChart data={subjectRows} layout="vertical" margin={{ left: 8, right: 24, top: 4, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} horizontal={false} />
              <XAxis type="number" domain={[0, 100]} tick={{ fontFamily: FONT_MONO, fontSize: 11, fill: T.muted }} unit="%" />
              <YAxis type="category" dataKey="subject" width={130} tick={{ fontFamily: FONT_UI, fontSize: 12.5, fill: T.ink }} />
              <Tooltip
                formatter={(v, n, p) => [`${p.payload.correct}/${p.payload.total} (${v}%)`, "Score"]}
                contentStyle={{ fontFamily: FONT_UI, fontSize: 12.5, borderRadius: 8, border: `1px solid ${T.border}`, background: T.card, color: T.ink }}
              />
              <Bar dataKey="pct" radius={[0, 6, 6, 0]} barSize={18}>
                {subjectRows.map((r, i) => (
                  <Cell key={i} fill={r.pct >= 70 ? T.green : r.pct >= 50 ? T.amber : T.red} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div style={{ fontFamily: FONT_UI, fontWeight: 700, fontSize: 13, color: T.ink, marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.04em" }}>
        Question review
      </div>
      <div style={{ display: "grid", gap: 10 }}>
        {block.questions.map((q, i) => {
          const a = blockState.answers[q.id];
          const correct = a?.selected === q.correctAnswer;
          const answered = !!a?.selected;
          const isOpen = expanded === q.id;
          return (
            <div key={q.id} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, overflow: "hidden" }}>
              <div onClick={() => setExpanded(isOpen ? null : q.id)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 16px", cursor: "pointer" }}>
                {!answered ? <AlertTriangle size={17} color={T.amber} /> : correct ? <CheckCircle2 size={17} color={T.green} /> : <XCircle size={17} color={T.red} />}
                <span style={{ fontFamily: FONT_MONO, fontSize: 12.5, color: T.muted, width: 24 }}>{i + 1}</span>
                <span style={{ fontFamily: FONT_UI, fontSize: 14, color: T.ink, flex: 1 }}>{q.stem}</span>
                <Pill T={T} tone="muted">{q.subject || "General"}</Pill>
                {isOpen ? <ChevronUp size={16} color={T.muted} /> : <ChevronDown size={16} color={T.muted} />}
              </div>
              {isOpen && (
                <div style={{ padding: "0 16px 18px", borderTop: `1px solid ${T.border}` }}>
                  <p style={{ fontFamily: FONT_DISPLAY, fontSize: 14.5, color: T.ink, lineHeight: 1.65, marginTop: 14 }}>{q.vignette}</p>
                  <div style={{ display: "grid", gap: 6, marginBottom: 12 }}>
                    {q.options.map((opt) => {
                      const isCorrectOpt = opt.key === q.correctAnswer;
                      const isYourPick = opt.key === a?.selected;
                      const reason = !isCorrectOpt ? q.distractorAnalysis?.[opt.key] : null;
                      return (
                        <div key={opt.key} style={{
                          padding: "8px 10px", borderRadius: 6,
                          background: isCorrectOpt ? T.greenLight : isYourPick ? T.redLight : "transparent",
                          fontFamily: FONT_UI, fontSize: 13.5, color: T.ink,
                        }}>
                          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                            <span style={{ fontFamily: FONT_MONO, fontWeight: 700, fontSize: 12, width: 18 }}>{opt.key}</span>
                            <span style={{ flex: 1 }}>{opt.text}</span>
                            {isCorrectOpt && <Pill T={T} tone="green">Correct</Pill>}
                            {isYourPick && !isCorrectOpt && <Pill T={T} tone="red">Your answer</Pill>}
                          </div>
                          {reason && (
                            <div style={{ fontFamily: FONT_UI, fontSize: 12.5, color: T.muted, marginTop: 4, paddingLeft: 28, lineHeight: 1.5 }}>
                              {reason}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <div style={{ background: T.paper, borderRadius: 8, padding: "12px 14px" }}>
                    <div style={{ fontFamily: FONT_UI, fontWeight: 700, fontSize: 12, color: T.blue, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      Explanation
                    </div>
                    <p style={{ fontFamily: FONT_UI, fontSize: 13.5, color: T.ink, lineHeight: 1.6, margin: 0 }}>{q.explanation}</p>
                  </div>

                  {q.educationalObjective && (
                    <div style={{ background: T.blueLight, borderRadius: 8, padding: "12px 14px", marginTop: 10 }}>
                      <div style={{ fontFamily: FONT_UI, fontWeight: 700, fontSize: 12, color: T.blueDeep, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                        Educational Objective
                      </div>
                      <p style={{ fontFamily: FONT_UI, fontSize: 13.5, color: T.ink, lineHeight: 1.6, margin: 0 }}>{q.educationalObjective}</p>
                    </div>
                  )}

                  {Array.isArray(q.sourceReferences) && q.sourceReferences.length > 0 && (
                    <div style={{ marginTop: 10 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: FONT_UI, fontWeight: 700, fontSize: 12, color: T.muted, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                        <BookOpen size={13} /> Source References
                      </div>
                      <div style={{ display: "grid", gap: 8 }}>
                        {q.sourceReferences.map((ref, ri) => (
                          <div key={ri} style={{ border: `1px solid ${T.border}`, borderRadius: 8, padding: "10px 12px" }}>
                            <div style={{ fontFamily: FONT_UI, fontWeight: 600, fontSize: 13, color: T.ink }}>
                              {ref.sourceTitle}
                              {ref.pageNumber && (
                                <span style={{ fontFamily: FONT_MONO, fontWeight: 400, fontSize: 11.5, color: T.muted }}> · p. {ref.pageNumber}</span>
                              )}
                            </div>
                            {ref.chapterSection && (
                              <div style={{ fontFamily: FONT_UI, fontSize: 12.5, color: T.muted, marginTop: 2 }}>{ref.chapterSection}</div>
                            )}
                            {ref.relevance && (
                              <div style={{ fontFamily: FONT_UI, fontSize: 12, color: T.blueDeep, marginTop: 4, fontStyle: "italic" }}>{ref.relevance}</div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Final exam summary (across all blocks)
// ---------------------------------------------------------------------------
function FinalSummary({ examData, blockStates, onBackToLobby, T, darkMode, setDarkMode }) {
  const subjectRows = useMemo(() => {
    const map = {};
    examData.blocks.forEach((block, bi) => {
      block.questions.forEach((q) => {
        const subj = q.subject || "General";
        const a = blockStates[bi].answers[q.id];
        const correct = a?.selected === q.correctAnswer;
        if (!map[subj]) map[subj] = { subject: subj, correct: 0, total: 0 };
        map[subj].total += 1;
        if (correct) map[subj].correct += 1;
      });
    });
    return Object.values(map).map((r) => ({ ...r, pct: Math.round((r.correct / r.total) * 100) })).sort((a, b) => a.pct - b.pct);
  }, [examData, blockStates]);

  const totalCorrect = blockStates.reduce((s, b) => s + (b.score?.correct || 0), 0);
  const totalQ = blockStates.reduce((s, b) => s + (b.score?.total || 0), 0);
  const overallPct = totalQ ? Math.round((totalCorrect / totalQ) * 100) : 0;
  const weakest = subjectRows.slice(0, 3);

  return (
    <div style={{ maxWidth: 880, margin: "0 auto", padding: "44px 20px 80px" }}>
      <style>{`@import url('${FONT_IMPORT_URL}');`}</style>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
        <GhostButton T={T} icon={ChevronLeft} onClick={onBackToLobby}>Back to blocks</GhostButton>
        <SettingsMenu darkMode={darkMode} setDarkMode={setDarkMode} T={T} />
      </div>

      <h1 style={{ fontFamily: FONT_DISPLAY, fontSize: 28, fontWeight: 600, color: T.ink, margin: "0 0 4px" }}>
        {examData.examTitle} — full summary
      </h1>
      <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 28 }}>
        <span style={{ fontFamily: FONT_MONO, fontSize: 32, fontWeight: 600, color: overallPct >= 70 ? T.green : T.red }}>
          {overallPct}%
        </span>
        <span style={{ fontFamily: FONT_UI, fontSize: 14, color: T.muted }}>
          {totalCorrect} correct across {totalQ} questions in {examData.blocks.length} block{examData.blocks.length > 1 ? "s" : ""}
        </span>
      </div>

      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: "20px 22px 8px", marginBottom: 22 }}>
        <div style={{ fontFamily: FONT_UI, fontWeight: 700, fontSize: 13, color: T.ink, marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.04em" }}>
          Performance by subject (all blocks)
        </div>
        <ResponsiveContainer width="100%" height={Math.max(160, subjectRows.length * 40)}>
          <BarChart data={subjectRows} layout="vertical" margin={{ left: 8, right: 24, top: 4, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} horizontal={false} />
            <XAxis type="number" domain={[0, 100]} tick={{ fontFamily: FONT_MONO, fontSize: 11, fill: T.muted }} unit="%" />
            <YAxis type="category" dataKey="subject" width={130} tick={{ fontFamily: FONT_UI, fontSize: 12.5, fill: T.ink }} />
            <Tooltip
              formatter={(v, n, p) => [`${p.payload.correct}/${p.payload.total} (${v}%)`, "Score"]}
              contentStyle={{ fontFamily: FONT_UI, fontSize: 12.5, borderRadius: 8, border: `1px solid ${T.border}`, background: T.card, color: T.ink }}
            />
            <Bar dataKey="pct" radius={[0, 6, 6, 0]} barSize={18}>
              {subjectRows.map((r, i) => (
                <Cell key={i} fill={r.pct >= 70 ? T.green : r.pct >= 50 ? T.amber : T.red} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {weakest.length > 0 && (
        <div style={{ background: T.blueLight, borderRadius: 10, padding: "16px 20px", marginBottom: 22 }}>
          <div style={{ fontFamily: FONT_UI, fontWeight: 700, fontSize: 13, color: T.blueDeep, marginBottom: 6 }}>Focus areas</div>
          <p style={{ fontFamily: FONT_UI, fontSize: 13.5, color: T.blueDeep, margin: 0, lineHeight: 1.6 }}>
            Lowest scoring: {weakest.map((w) => `${w.subject} (${w.pct}%)`).join(", ")}. Consider generating
            a fresh Gemini block focused on these systems.
          </p>
        </div>
      )}

      <div style={{ display: "grid", gap: 10 }}>
        {examData.blocks.map((block, i) => (
          <div key={i} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontFamily: FONT_UI, fontWeight: 600, fontSize: 14, color: T.ink }}>{block.blockName}</span>
            <Pill T={T} tone={blockStates[i].score.pct >= 70 ? "green" : "red"}>
              {blockStates[i].score.correct}/{blockStates[i].score.total} · {blockStates[i].score.pct}%
            </Pill>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Root app
// ---------------------------------------------------------------------------
export default function App() {
  const [examData, setExamData] = useState(null);
  const [blockStates, setBlockStates] = useState([]);
  const [view, setView] = useState("import"); // import | lobby | exam | results | final
  const [activeBlockIdx, setActiveBlockIdx] = useState(null);
  const [darkMode, setDarkMode] = useState(true);
  const T = darkMode ? DARK : LIGHT;

  function handleImport(data) {
    setExamData(data);
    setBlockStates(data.blocks.map(makeInitialBlockState));
    setView("lobby");
  }

  function startBlock(idx) {
    setBlockStates((prev) => {
      const copy = [...prev];
      if (copy[idx].status === "pending") copy[idx] = { ...copy[idx], status: "in-progress" };
      return copy;
    });
    setActiveBlockIdx(idx);
    setView("exam");
  }

  function setActiveBlockState(updater) {
    setBlockStates((prev) => {
      const copy = [...prev];
      copy[activeBlockIdx] = typeof updater === "function" ? updater(copy[activeBlockIdx]) : updater;
      return copy;
    });
  }

  function submitActiveBlock() {
    setBlockStates((prev) => {
      const copy = [...prev];
      const bs = copy[activeBlockIdx];
      const block = examData.blocks[activeBlockIdx];
      const correct = block.questions.filter((q) => bs.answers[q.id]?.selected === q.correctAnswer).length;
      const answered = block.questions.filter((q) => bs.answers[q.id]?.selected).length;
      const total = block.questions.length;
      copy[activeBlockIdx] = { ...bs, status: "done", score: { correct, total, answered, pct: Math.round((correct / total) * 100) } };
      return copy;
    });
    setView("results");
  }

  function reviewBlock(idx) { setActiveBlockIdx(idx); setView("results"); }
  function resetAll() { setExamData(null); setBlockStates([]); setActiveBlockIdx(null); setView("import"); }
  function toggleTimed(idx) {
    setBlockStates((prev) => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], timed: !copy[idx].timed };
      return copy;
    });
  }

  // --- Instant retest system --------------------------------------------
  // Both paths build a brand-new block object (fresh id-scoped state via
  // makeInitialBlockState, so no stale selectedAnswer/markedForReview/struck
  // state can leak in), append it to examData.blocks, and jump straight into
  // the exam view at question 1.

  function retestMissedBlock(idx) {
    const block = examData.blocks[idx];
    const bs = blockStates[idx];
    const missed = block.questions.filter((q) => bs.answers[q.id]?.selected !== q.correctAnswer);
    if (missed.length === 0) return; // 100% — nothing to retest

    const shuffled = missed.map(shuffleQuestionOptions);
    const newBlock = {
      blockName: `${baseBlockName(block.blockName)} — Retest Missed`,
      questions: shuffled,
      timeLimitMinutes: Math.max(5, Math.round(shuffled.length * 1.5)), // N * 1.5 min, always timed
      isRetest: true,
      retestType: "missed",
      retestCount: shuffled.length,
    };
    launchBlock(newBlock);
  }

  function retestEntireBlock(idx) {
    const block = examData.blocks[idx];
    const shuffled = block.questions.map(shuffleQuestionOptions);
    const newBlock = {
      blockName: `${baseBlockName(block.blockName)} — Retest All`,
      questions: shuffled,
      // Original block timer carries over as-is (including "untimed" if it had none)
      ...(typeof block.timeLimitMinutes === "number" ? { timeLimitMinutes: block.timeLimitMinutes } : {}),
      isRetest: true,
      retestType: "full",
      retestCount: shuffled.length,
    };
    launchBlock(newBlock);
  }

  function launchBlock(newBlock) {
    const newIndex = examData.blocks.length;
    setExamData((prev) => ({ ...prev, blocks: [...prev.blocks, newBlock] }));
    setBlockStates((prev) => [...prev, { ...makeInitialBlockState(newBlock), status: "in-progress" }]);
    setActiveBlockIdx(newIndex); // fresh block → question index always starts at 1 in ExamScreen's own state
    setView("exam");
  }

  return (
    <div style={{ minHeight: "100vh", background: T.paper, fontFamily: FONT_UI }}>
      {view === "import" && <ImportScreen onImport={handleImport} T={T} darkMode={darkMode} setDarkMode={setDarkMode} />}

      {view === "lobby" && examData && (
        <Lobby examData={examData} blockStates={blockStates} onStart={startBlock} onReview={reviewBlock} onReset={resetAll} onFinalSummary={() => setView("final")} onToggleTimed={toggleTimed} onRetestMissed={retestMissedBlock} onRetestAll={retestEntireBlock} T={T} darkMode={darkMode} setDarkMode={setDarkMode} />
      )}

      {view === "exam" && examData && activeBlockIdx !== null && (
        <ExamScreen
          key={activeBlockIdx}
          block={examData.blocks[activeBlockIdx]}
          blockState={blockStates[activeBlockIdx]}
          setBlockState={setActiveBlockState}
          onSubmitBlock={submitActiveBlock}
          darkMode={darkMode}
          setDarkMode={setDarkMode}
        />
      )}

      {view === "results" && examData && activeBlockIdx !== null && (
        <BlockResults
          block={examData.blocks[activeBlockIdx]}
          blockState={blockStates[activeBlockIdx]}
          onBackToLobby={() => setView("lobby")}
          onRetestMissed={() => retestMissedBlock(activeBlockIdx)}
          onRetestAll={() => retestEntireBlock(activeBlockIdx)}
          onLoadNewExam={resetAll}
          T={T}
          darkMode={darkMode}
          setDarkMode={setDarkMode}
        />
      )}

      {view === "final" && examData && (
        <FinalSummary examData={examData} blockStates={blockStates} onBackToLobby={() => setView("lobby")} T={T} darkMode={darkMode} setDarkMode={setDarkMode} />
      )}
    </div>
  );
}
