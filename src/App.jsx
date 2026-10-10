import React, { useState, useEffect, useRef, useMemo, useCallback, createContext, useContext } from "react";
import {
  Flag, Clock, ChevronLeft, ChevronRight, Upload, Copy, RotateCcw,
  Play, CheckCircle2, XCircle, AlertTriangle, ClipboardList, Activity,
  Check, ChevronDown, ChevronUp, FileJson, FlaskConical, PencilLine,
  Calculator as CalcIcon, Settings as SettingsIcon, Lock, Unlock,
  Search, Trash2, X, XOctagon, Lightbulb, Sun, Moon, Highlighter, BookOpen, Stethoscope, Target, Save, Shuffle, Plus, Home as HomeIcon, HelpCircle, Pencil, Share2, ExternalLink, Sparkles
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
  greenStrong: "#C2E2CD",
  greenSoft: "#E8F4EC",
  red: "#B23B35",
  redLight: "#F5DEDC",
  redStrong: "#EBBDB9",
  redSoft: "#F8E8E6",
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
  greenStrong: "#1D5B3E",
  greenSoft: "#143D2C",
  red: "#FF7A70",
  redLight: "#3A1414",
  redStrong: "#5C2222",
  redSoft: "#431A1A",
  amber: "#F5B84D",
  amberLight: "#3A2B0E",
  flagRed: "#FF6B5B",
};

const FONT_DISPLAY = "'Source Serif 4', Georgia, 'Times New Roman', serif";
const FONT_UI = "'Inter', Arial, 'Segoe UI', sans-serif";
const FONT_MONO = "'IBM Plex Mono', 'SF Mono', Menlo, monospace";

// Text size: App writes TEXT_SCALE on every render and every fontSize goes through fs(), so one
// setting rescales all text. Layout widths that hold text grow with it (see ExamScreen).
let TEXT_SCALE = 1;
const TEXT_STEPS = [0.85, 1, 1.15, 1.3, 1.5, 1.75];
const fs = (n) => Math.round(n * TEXT_SCALE * 100) / 100;
const TextScaleContext = createContext({ textScale: 1, setTextScale: () => {} });

// Live window size, so the exam layout adapts to phones, tablets, landscape, ultrawide…
function useViewport() {
  const read = () => ({ w: window.innerWidth, h: window.innerHeight });
  const [vp, setVp] = useState(read);
  useEffect(() => {
    const on = () => setVp(read());
    window.addEventListener("resize", on);
    window.addEventListener("orientationchange", on);
    return () => { window.removeEventListener("resize", on); window.removeEventListener("orientationchange", on); };
  }, []);
  return vp;
}

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
// Internationalization (English default / Spanish)
// ---------------------------------------------------------------------------
const STR = {
  en: {
    saveToLibrary: "Save to Library", libSaved: "Saved {n} new block(s) to your library.", libDup: "{d} already in your library.", libNothing: "Already in your library — nothing new to save.",
    libTitle: "Qbank Library", libCount: "{n} saved", libEmpty: "Nothing saved yet. Paste or upload a question bank and choose \u201cSave to Library\u201d to keep it on this device.",
    libMeta: "{q} questions · imported {d}", libLastScore: "Last score {pct}% ({c}/{t})", libNoScore: "Not attempted yet", libCompleted: "Completed · {pct}% ({c}/{t})", tabLibrary: "Qbank Library", tabHistory: "Past Sessions", histTitle: "Past Sessions", histEmpty: "No finished sessions yet. Every block you complete is logged here, including custom and mixed sessions.", histNote: "Each finished session is saved as its own log. Custom and mixed sessions never change your Qbank cards; a card is marked Completed only when you run that whole Qbank on its own. The 25 most recent sessions also keep their full question-by-question review; older ones keep a summary.", histKindBank: "Qbank", histKindCustom: "Custom", histKindRetest: "Retest", histQ: "{n} questions", histAnswered: "{a}/{n} answered", histSources: "From: {s}", histBySubject: "By subject", histDelete: "Delete this log", histClear: "Clear history", histClearQ: "Delete all {n} logged sessions? Your Qbank cards are not affected.", histClearGo: "Delete all", histToggle: "Show details", histSelectAll: "Select all", histDeselect: "Deselect all", histDeleteSelQ: "Delete {n} selected session(s)? Your Qbank cards are not affected.", histReview: "Review Exam", histNoReview: "Review unavailable", histNoReviewFlash: "The full review for this session is no longer stored.", histMixed: "Mixed: {n} blocks · {q} Questions", histNamed: "{name} · {q} Questions", histDone: "Completed {d}",
    libStart: "Start", rateTitle: "How well did you know this?", "rate.again": "Again", "rate.hard": "Hard", "rate.good": "Good", "rate.easy": "Easy",
    poolAgain: "Rated Again", poolHard: "Rated Hard", poolAgainHard: "Again + Hard",
    "rt.again": "Rated Again", "rt.hard": "Rated Hard", "rt.againhard": "Rated Again/Hard",
    sufAgain: "Retest Again", sufHard: "Retest Hard", sufAgainHard: "Retest Again/Hard",
    textSize: "Text size", textSmaller: "Smaller text", textLarger: "Larger text", textReset: "Reset", libMixMax: "Max ({n})", libMixCustom: "Custom", libMixCustomHint: "1–{n}", libCountTitle: "Choose question count", libCountHint: "Draws a random, subject-balanced set of questions from this bank. Scores from this block never change the bank's last score.", libLoad: "Load {n} questions", libLoadOne: "Load 1 question", libShareSel: "Share / Export Selected", libExporting: "Exporting your selection ({n}) as one file…", libExportShared: "Shared your selection ({n}) as one file.", libExportDownloaded: "Downloaded your selection ({n}) as one file.", libExportFailed: "Export failed. Please try again.", bundleFound: "Bundle detected: {n} blocks ({names}). Press Import to choose which ones to add to your library.", libEditSel: "Edit Selected", libDeleteSel: "Delete Selected", libEditing: "{i} of {n}", libSelectHint: "Tick blocks to load, share, rename or delete them. Tick two or more to mix them into one custom block.", libDeleteSelQ: "Delete {n} selected Qbank(s)? This can't be undone.", libMixTitle: "Mix selected banks", libMixHint: "Merges the ticked banks into one shuffled block, with systems and disciplines spread evenly.", libMixPool: "{q} questions · {s} subjects", libMixDupes: "{d} duplicate(s) removed", libMixSize: "Questions", libMixAll: "All ({n})", libMix: "Mix {n} questions", libMixOne: "Mix 1 question", mixedName: "Mixed Qbank ({n} banks)",
    libDeleteQ: "Delete this block?", libDelete: "Delete", libLocalNote: "Stored only in this browser. Clearing site data removes it.",
    resetData: "Reset All Local Data", resetDataWarn: "This permanently deletes your Qbank library, saved exam progress and preferences from this browser. It can't be undone.", resetDataConfirm: "Yes, delete everything",
    resumed: "Session restored — you're back where you left off.", storageFull: "Couldn't write to browser storage (it may be full or disabled). Your progress is not being backed up right now.",
    leaveConfirm: "You have a block in progress. Leaving now discards it. Continue?",
    settings: "Settings", dark: "Dark mode", lang: "Language",
    tutorShort: "Tutor", modeLabel: "Test mode", modeLocked: "Locked once the block starts", modeTimedHint: "Countdown timer. You can turn it off during the exam, but not back on.", timerLabel: "Timer", timerOnHint: "You can turn the timer off, but you can't turn it back on.", timerOffNote: "Timer is off for this block and can't be turned back on.", timerOffTitle: "Turn off the timer?", timerOffBody: "The countdown will stop and this block will become untimed. This can't be undone: you won't be able to turn the timer back on for this block. Your answers and progress are kept.", keepTimer: "Keep timer on", turnOffTimer: "Turn off timer", timerOffSuffix: "timer off", modeTutorHint: "No timer. Instant feedback after each answer.", tutor: "Tutor mode", tutorHint: "Instant right/wrong feedback and explanations after each answer, plus question reset.",
    tutorCorrect: "Correct", tutorIncorrect: "Incorrect — the correct answer is {a}", tutorIncorrectHidden: "Incorrect", showCorrectBtn: "Show Correct Answer",
    resetQ: "Reset question", "sc.reset": "Reset question (Tutor mode)",
    attendingTip: "Tutor's Tip", keyClues: "Key Clues", keyLearningPoint: "Key Learning Point",
    keyInfoBtn: "Key Info", tipBtn: "Tutor's Tip", distractorBtn: "Why this is incorrect", noKeyInfo: "No key info available for this question.", noTipAvail: "No tip available for this question.", hintUsedBadge: "Hint used", hintsUsedN: "Hints used: {n}",
    difficulty: "Difficulty", diffTitle: "Difficulty: {n} of 5",
    timerLocked: "The timer can't be turned on once a block has started.",
    title: "Turn questions from any AI model into a realistic practice exam",
    intro: "Paste or upload custom question banks created with your favorite AI tools like ChatGPT, Claude, Gemini, or NotebookLM. Experience an exam-like environment complete with lab reference panels, answer strikethroughs, a built-in calculator, and detailed score analytics.",
    pasteJson: "Paste or upload question bank", upload: "Upload file",
    pastePh: "Paste your generated question bank here…",
    importBundle: "Import", "warn.importN": "Import {n} question(s)",
    irTitle: "Import Qbanks", irSub: "{n} Qbanks found. Choose which ones to add to your library — anything you leave unticked is discarded.",
    irAddAll: "Add all to library ({n})", irAddSel: "Add selected to library ({n})", irDone: "Done", irCancel: "Cancel import",
    irNew: "New", irNoneNew: "Every Qbank in this file is already in your library, so there is nothing new to add.",
    lobbySelectAll: "Select all", lobbyClear: "Clear", lobbySelected: "{n} selected", lobbySaveSel: "Save selected ({n})", lobbyRemoveSel: "Remove selected ({n})",
    lobbySaved: "In library", lobbyNotSaved: "Not saved",
    lobbyMerged: "{n} duplicate block(s) in this file were merged into one.", lobbyLinked: "{n} block(s) were already in your library and were linked instead of duplicated.",
    removeSelTitle: "Remove selected blocks?", removeSelGo: "Remove",
    removeSelBody: "{n} block(s) will be removed from this session. Copies saved in your Qbank Library aren't affected.",
    removeSelBodyUnsaved: "{n} block(s) will be removed from this session. {u} of them aren't saved to your library and will be gone for good — save them first if you want to keep them.",
    pasteChars: "{n} characters pasted", pasteClear: "Clear", pasteEmpty: "Nothing pasted yet — expand to paste, or use Upload.",
    load: "Load exam", importQbank: "Import New Qbank", importInLibrary: "Already in your library — start it from there.", lobbySaveN: "Save to Library ({n})", lobbyRemoveN: "Remove ({n})", triageHint: "Tick this Qbank to save it to your library or remove it.", lobbyTriageNote: "These Qbanks were just imported. Tick the ones you want, then use Save to Library to keep them or Remove to dismiss them.", aiLaunchTitle: "AI Quick Launch", aiLaunchHint: "Open your AI tool, paste the Question Recipe Prompt below along with your topic or notes, then bring the reply back here.", aiLaunchOpens: "Opens in a new tab", homeBtn: "Home", removeExam: "Remove exam", removeTitle: "Remove this exam?", removeBody: "This clears the loaded exam and any progress or results in it. Your saved Qbank Library is not affected.", removeBodyUnsaved: "This clears the loaded exam and any progress or results in it. Some of its blocks are not saved to your Library and would be gone for good. Cancel and tap Save to Library first if you want to keep them.", removeGo: "Remove", libRename: "Rename Qbank", libRenameSave: "Save name", howItWorks: "How it works", guideStep: "Step {n} of {total}", guideBack: "Back", guideNext: "Next", guideDone: "Got it", guideClose: "Close guide", navCollapse: "Collapse question list", navExpand: "Expand question list", resumeSession: "Resume Session", sessionInProgress: "Session in progress", sessionPos: "Question {n} of {total}", examLoadedLabel: "Exam loaded", openLobby: "Open exam lobby", inProgressTag: "In progress", discardTitle: "Discard in-progress session?", discardBody: "Starting something new replaces your in-progress block, and its answers will be lost.", discardGo: "Discard and continue", hide: "Hide", recipe: "Question Recipe Prompt",
    recipeIntro: "Configure a block below, then copy the generated recipe into the AI tool of your choice (add your source material if it supports it). It returns questions in the exact shape this app expects.",
    blockSize: "Block size", focus: "Focus",
    diffMode: "Difficulty", "diffMode.mixed": "Mixed (recommended)", "diffMode.easy": "Easy", "diffMode.medium": "Medium", "diffMode.hard": "Hard (USMLE standard)",
    diffHintMixed: "{e} Easy · {m} Medium · {h} Hard (about 20% / 60% / 20%), interleaved to mirror real exam variance. Every question is labeled by its difficulty rating for tracking.",
    diffHintEasy: "Recall and core triads: 1–3 sentence vignettes, 1–2 step recognition, 3–4 options with distinct distractors.",
    diffHintMedium: "Standard practice: 3–5 sentence vignettes, 2-step reasoning (diagnosis, then best initial test), 5 realistic options.",
    diffHintHard: "USMLE standard: 5–8 sentence vignettes with subtle nuances and red herrings, 3-step reasoning, closely related options.",
    exportShare: "Export / Share", exportShared: "Shared", exportDownloaded: "Downloaded", exportFailed: "Export failed",
    exportTitle: "Send this block to another student as a .json file (AirDrop / share sheet where supported, otherwise a download)", exportShareText: "Oworld question block: {name}",
    mixDiffAll: "All", mixBalanced: "Balanced", mixBalancedShort: "Balanced", mixBalancedHint: "20% Easy / 60% Medium / 20% Hard, e.g. {e} · {m} · {h} at this size.", mixUnrated: "{n} question(s) without a difficulty label are left out.",
    customSize: "Custom", customSizePh: "1–{n}", "dl.easy": "Easy", "dl.medium": "Medium", "dl.hard": "Hard", perfDifficulty: "Performance by difficulty",
    "focus.standard": "Standard USMLE mix", "focus.systems": "Single organ system", "focus.discipline": "Single discipline",
    phSystems: "e.g. Cardiovascular, Renal, Neuro…", phDisc: "e.g. Pharmacology, Biochemistry, Microbiology…",
    recipeTitle: "Question Recipe — AI prompt", copied: "Copied", copy: "Copy", schema: "JSON schema", viewSchema: "View Developer JSON Schema", hideSchema: "Hide Developer JSON Schema",
    createdBy: "OWORLD is created by", role: "Medical student | Founder of Verde+",
    notAffil: "Not affiliated with NBME or USMLE®", tmTitle: "Trademark disclaimer",
    tm1: "OWORLD is an independent, unofficial study tool for running practice question blocks you generate yourself with third-party AI tools. It is not produced, endorsed, licensed, or affiliated with the National Board of Medical Examiners (NBME) or the Federation of State Medical Boards (FSMB).",
    tm2: "USMLE® is a registered trademark of the NBME and FSMB. Any resemblance to their exam interface or terminology is used for descriptive and educational purposes only.",
    close: "Close",
    practiceExam: "Practice Exam", fullSummary: "Full exam summary", importNew: "Import new exam",
    notStarted: "Not started", inProgress: "In progress · {a}/{n} answered", qCount: "{n} questions",
    minLimit: "{m} min limit", untimed: "Untimed", timed: "Timed", review: "Review",
    retestMissed: "Retest missed ({n})", retestAll: "Retest entire block ({n})",
    resume: "Resume block", start: "Start block",
    timingNote: "Timing starts the moment you click \"Start block\" — the countdown runs even if you navigate away.",
    item: "Item: {n} of {total}", blockOf: "Block: 1 of 1",
    retestMode: "Retest Mode: {type} ({n} {items})", "rt.missed": "Missed Questions", "rt.full": "Full Block",
    item1: "Item", itemN: "Items", prev: "Previous", next: "Next",
    labValues: "Lab Values", notes: "Notes", calc: "Calculator",
    timedBlock: "Timed block", hints: "Hints", shortcuts: "Keyboard shortcuts",
    "sc.next": "Next question", "sc.prev": "Previous question", "sc.mark": "Mark question",
    "sc.select": "Select answer", "sc.hl": "Highlight selection",
    qStatus: "Question Status", mark: "Mark Question", hideHint: "Hide Hint", showHint: "Show Hint",
    hlTip: "Select text, then click Highlight.",
    noHint: "No hint was provided for this question.", strike: "Strike out this option",
    proceedNext: "Proceed to Next Item", proceedSummary: "Proceed to Block Summary",
    timeLeft: "Block Time Remaining", untimedLower: "untimed",
    answered: "Answered: {a}/{n}", flagged: " · Flagged: {f}", lock: "Lock", endBlock: "End Block",
    notesItem: "Notes — Item {n}", delNote: "Delete note", saveClose: "Save and close", highlight: "Highlight",
    paused: "Exam paused — timer is stopped.", endQ: "End this block?",
    endConfirm: "You've answered {a} of {n} questions. Once you end the block you can't change your answers, but you can review explanations right away.",
    keepWorking: "Keep working", endBlockBtn: "End block", timesUp: "Time's up",
    timesUpBody: "The allotted time for this block has lapsed. You answered {a} of {n} questions. The block will now be submitted automatically and you can review your results.",
    viewResults: "View results",
    siIntervals: "SI Reference Intervals", siHdr: "SI Reference Interval", refRange: "Reference Range",
    search: "Search…", noMatches: "No matches in {tab}.",
    "tab.Serum": "Serum", "tab.Cerebrospinal": "Cerebrospinal", "tab.Blood": "Blood", "tab.Urine and BMI": "Urine and BMI",
    back: "Back to blocks", results: "{name} — results",
    scoreLine: "{c} correct out of {t} · {u} unanswered",
    retestIncBtn: "Retest Incorrects (Tutor Mode)", retestFullBtn: "Retest Full Block", retestTitle: "Configure retest",
    poolLabel: "Question pool", poolIncorrect: "Incorrect only", poolFlagged: "Flagged only", poolAll: "All questions",
    modeSel: "Test mode", modeTutorOpt: "Tutor Mode", modeTimedOpt: "Timed Mode", poolEmpty: "No questions in this pool.",
    retestSaveNote: "Your first-attempt score and timing are saved and will not be changed by this retest.",
    startRetest: "Start retest", cancel: "Cancel", attemptHistory: "Attempt history", firstAttempt: "First attempt (baseline)",
    retestN: "Retest {n}", timerOffTag: "timer turned off", elapsed: "Time", retestsExcluded: "{n} retest attempt(s) are not counted in these totals; first-attempt scores are kept as the baseline.",
    "rt.flagged": "Flagged Questions", sufFlagged: "Retest Flagged",
    rtMissed: "Retest Missed Questions ({n})", perfect: "Retest Missed Questions — perfect score!",
    rtAll: "Retest Entire Block ({n})", loadNew: "Load New Exam",
    perfSubject: "Performance by subject", qReview: "Question review",
    correct: "Correct", yours: "Your answer", explanation: "Explanation", eduObj: "Educational Objective",
    sources: "Source References", page: "p.", general: "General", score: "Score",
    fullSummaryTitle: "{name} — full summary",
    across: "{c} correct across {q} questions in {b} {blocks}", block1: "block", blockN: "blocks",
    perfAll: "Performance by subject (all blocks)", focusAreas: "Focus areas",
    lowest: "Lowest scoring: {list}. Consider generating a fresh block with your AI tool focused on these systems.",
    sufMissed: "Retest Missed", sufAll: "Retest All",
    "err.json": "Couldn't read this as JSON, even after automatic repairs ({detail}). Make sure you copied the complete response, including the closing brackets at the end.",
    "err.noneValid": "No valid questions could be loaded.",
    "err.qObj": "Question {n} in \"{name}\" isn't a JSON object.",
    "err.correctMulti": "Question \"{id}\" lists more than one correct answer; exactly one is required.",
    "err.correctConflict": "Question \"{id}\": the correct answer's letter and text point to different options.",
    "warn.fixed": "Formatting problems in the pasted text (code fences, extra commentary, smart quotes, trailing or missing commas, unescaped quotes) were repaired automatically.",
    "warn.truncated": "This text is cut off or has a syntax error partway through, so only the {n} complete question(s) before that point were recovered. Ask ChatGPT to continue, or generate a smaller block.",
    "warn.skipped": "{n} question(s) were incomplete or ambiguous and will be left out:",
    "warn.blockDropped": "Block \"{name}\" had no usable questions and will be left out.",
    "warn.timeDropped": "Block \"{name}\" has a time limit that isn't a number, so it will be untimed.",
    "warn.normalized": "{n} question(s) used different field names or option formats and were converted to the standard format.",
    "warn.defaults": "Missing or duplicate ids and missing block names were filled in automatically.",
    "warn.reviewTitle": "Review before loading", "warn.loadN": "Load {n} question(s)", "warn.saveN": "Save {n} question(s)", "warn.back": "Back to editing", "warn.more": "…and {n} more",
    "err.root": "Root must be a JSON object.",
    "err.blocks": "Missing a non-empty \"blocks\" array.",
    "err.blockName": "Block {n} is missing \"blockName\".",
    "err.timeLimit": "Block \"{name}\" has a \"timeLimitMinutes\" that isn't a number. Omit it entirely for an untimed block.",
    "err.questions": "Block \"{name}\" needs a non-empty \"questions\" array.",
    "err.qId": "Question {n} in \"{name}\" is missing \"id\".",
    "err.vignette": "Question \"{id}\" is missing \"vignette\".",
    "err.stem": "Question \"{id}\" is missing \"stem\".",
    "err.options": "Question \"{id}\" needs an \"options\" array with at least 2 choices.",
    "err.correct": "Question \"{id}\" is missing \"correctAnswer\".",
    "err.match": "Question \"{id}\": correctAnswer \"{ans}\" doesn't match any option key.",
  },
  es: {
    saveToLibrary: "Guardar en la biblioteca", libSaved: "Se guardaron {n} bloque(s) nuevo(s) en tu biblioteca.", libDup: "{d} ya estaba(n) en tu biblioteca.", libNothing: "Ya está en tu biblioteca; no hay nada nuevo que guardar.",
    libTitle: "Biblioteca de preguntas", libCount: "{n} guardados", libEmpty: "Aún no hay nada guardado. Pega o sube un banco de preguntas y elige \u201cGuardar en la biblioteca\u201d para conservarlo en este dispositivo.",
    libMeta: "{q} preguntas · importado {d}", libLastScore: "Último puntaje {pct}% ({c}/{t})", libNoScore: "Sin intentos aún", libCompleted: "Completado · {pct}% ({c}/{t})", tabLibrary: "Biblioteca de preguntas", tabHistory: "Sesiones anteriores", histTitle: "Sesiones anteriores", histEmpty: "Aún no hay sesiones terminadas. Cada bloque que completes queda registrado aquí, incluidas las sesiones personalizadas y mezcladas.", histNote: "Cada sesión terminada se guarda como un registro independiente. Las sesiones personalizadas y mezcladas nunca cambian tus tarjetas de Qbank; una tarjeta se marca como Completada solo cuando haces ese Qbank completo por sí solo. Las 25 sesiones más recientes también conservan su revisión completa pregunta por pregunta; las anteriores conservan un resumen.", histKindBank: "Qbank", histKindCustom: "Personalizada", histKindRetest: "Repetición", histQ: "{n} preguntas", histAnswered: "{a}/{n} respondidas", histSources: "De: {s}", histBySubject: "Por materia", histDelete: "Eliminar este registro", histClear: "Borrar historial", histClearQ: "¿Eliminar las {n} sesiones registradas? Tus tarjetas de Qbank no se ven afectadas.", histClearGo: "Eliminar todo", histToggle: "Ver detalles", histSelectAll: "Seleccionar todo", histDeselect: "Deseleccionar todo", histDeleteSelQ: "¿Eliminar {n} sesión(es) seleccionada(s)? Tus tarjetas de Qbank no se ven afectadas.", histReview: "Revisar examen", histNoReview: "Revisión no disponible", histNoReviewFlash: "La revisión completa de esta sesión ya no está guardada.", histMixed: "Mezcla: {n} bloques · {q} preguntas", histNamed: "{name} · {q} preguntas", histDone: "Completado {d}",
    libStart: "Iniciar", rateTitle: "¿Qué tan bien lo sabías?", "rate.again": "Otra vez", "rate.hard": "Difícil", "rate.good": "Bien", "rate.easy": "Fácil",
    poolAgain: "Calificadas Otra vez", poolHard: "Calificadas Difícil", poolAgainHard: "Otra vez + Difícil",
    "rt.again": "Calificadas Otra vez", "rt.hard": "Calificadas Difícil", "rt.againhard": "Calificadas Otra vez/Difícil",
    sufAgain: "Repaso Otra vez", sufHard: "Repaso Difícil", sufAgainHard: "Repaso Otra vez/Difícil",
    textSize: "Tamaño del texto", textSmaller: "Texto más pequeño", textLarger: "Texto más grande", textReset: "Restablecer", libMixMax: "Máx ({n})", libMixCustom: "Personalizado", libMixCustomHint: "1–{n}", libCountTitle: "Elegir cantidad de preguntas", libCountHint: "Toma un conjunto aleatorio y equilibrado por materia de este banco. El puntaje de este bloque nunca cambia el último puntaje del banco.", libLoad: "Cargar {n} preguntas", libLoadOne: "Cargar 1 pregunta", libShareSel: "Compartir / Exportar selección", libExporting: "Exportando tu selección ({n}) en un solo archivo…", libExportShared: "Compartiste tu selección ({n}) en un solo archivo.", libExportDownloaded: "Descargaste tu selección ({n}) en un solo archivo.", libExportFailed: "Error al exportar. Inténtalo de nuevo.", bundleFound: "Paquete detectado: {n} bloques ({names}). Pulsa Importar para elegir cuáles añadir a tu biblioteca.", libEditSel: "Editar selección", libDeleteSel: "Eliminar selección", libEditing: "{i} de {n}", libSelectHint: "Marca bloques para cargarlos, compartirlos, renombrarlos o eliminarlos. Marca dos o más para mezclarlos en un solo bloque personalizado.", libDeleteSelQ: "¿Eliminar {n} Qbank(s) seleccionado(s)? No se puede deshacer.", libMixTitle: "Mezclar bancos seleccionados", libMixHint: "Une los bancos marcados en un solo bloque mezclado, con sistemas y disciplinas repartidos de forma pareja.", libMixPool: "{q} preguntas · {s} materias", libMixDupes: "{d} duplicada(s) eliminada(s)", libMixSize: "Preguntas", libMixAll: "Todas ({n})", libMix: "Mezclar {n} preguntas", libMixOne: "Mezclar 1 pregunta", mixedName: "Qbank mezclado ({n} bancos)",
    libDeleteQ: "¿Eliminar este bloque?", libDelete: "Eliminar", libLocalNote: "Se guarda solo en este navegador. Borrar los datos del sitio lo elimina.",
    resetData: "Restablecer todos los datos locales", resetDataWarn: "Esto elimina de forma permanente tu biblioteca, el progreso guardado y tus preferencias en este navegador. No se puede deshacer.", resetDataConfirm: "Sí, eliminar todo",
    resumed: "Sesión restaurada: continúas donde la dejaste.", storageFull: "No se pudo escribir en el almacenamiento del navegador (puede estar lleno o desactivado). Tu progreso no se está respaldando.",
    leaveConfirm: "Tienes un bloque en curso. Si sales ahora se descartará. ¿Continuar?",
    settings: "Ajustes", dark: "Modo oscuro", lang: "Idioma",
    tutorShort: "Tutor", modeLabel: "Modo del examen", modeLocked: "Se bloquea al iniciar el bloque", modeTimedHint: "Cuenta regresiva. Puedes desactivarla durante el examen, pero no volver a activarla.", timerLabel: "Cronómetro", timerOnHint: "Puedes desactivar el cronómetro, pero no volver a activarlo.", timerOffNote: "El cronómetro está desactivado en este bloque y no se puede volver a activar.", timerOffTitle: "¿Desactivar el cronómetro?", timerOffBody: "La cuenta regresiva se detendrá y este bloque quedará sin límite de tiempo. No se puede deshacer: no podrás volver a activar el cronómetro en este bloque. Tus respuestas y tu progreso se conservan.", keepTimer: "Mantener cronómetro", turnOffTimer: "Desactivar cronómetro", timerOffSuffix: "cronómetro desactivado", modeTutorHint: "Sin cronómetro. Retroalimentación instantánea tras cada respuesta.", tutor: "Modo tutor", tutorHint: "Retroalimentación instantánea de correcto/incorrecto y explicaciones tras cada respuesta, más reinicio de pregunta.",
    tutorCorrect: "Correcto", tutorIncorrect: "Incorrecto — la respuesta correcta es {a}", tutorIncorrectHidden: "Incorrecto", showCorrectBtn: "Mostrar respuesta correcta",
    resetQ: "Reiniciar pregunta", "sc.reset": "Reiniciar pregunta (modo tutor)",
    attendingTip: "Consejo del tutor", keyClues: "Pistas clave", keyLearningPoint: "Punto clave de aprendizaje",
    keyInfoBtn: "Datos clave", tipBtn: "Consejo del tutor", distractorBtn: "Por qué es incorrecta", noKeyInfo: "No hay datos clave para esta pregunta.", noTipAvail: "No hay consejo para esta pregunta.", hintUsedBadge: "Pista usada", hintsUsedN: "Pistas usadas: {n}",
    difficulty: "Dificultad", diffTitle: "Dificultad: {n} de 5",
    timerLocked: "El temporizador no se puede activar una vez iniciado el bloque.",
    title: "Convierte preguntas de cualquier modelo de IA en un examen de práctica realista",
    intro: "Pega o sube bancos de preguntas personalizados creados con tus herramientas de IA favoritas, como ChatGPT, Claude, Gemini o NotebookLM. Vive un entorno similar al examen real, con paneles de referencia de laboratorio, tachado de respuestas, calculadora integrada y analíticas detalladas de tu puntaje.",
    pasteJson: "Pega o sube un banco de preguntas", upload: "Subir archivo",
    pastePh: "Pega aquí tu banco de preguntas generado…",
    importBundle: "Importar", "warn.importN": "Importar {n} pregunta(s)",
    irTitle: "Importar Qbanks", irSub: "Se encontraron {n} Qbanks. Elige cuáles añadir a tu biblioteca; lo que dejes sin marcar se descarta.",
    irAddAll: "Añadir todos a la biblioteca ({n})", irAddSel: "Añadir seleccionados a la biblioteca ({n})", irDone: "Listo", irCancel: "Cancelar importación",
    irNew: "Nuevo", irNoneNew: "Todos los Qbanks de este archivo ya están en tu biblioteca, así que no hay nada nuevo que añadir.",
    lobbySelectAll: "Seleccionar todo", lobbyClear: "Limpiar", lobbySelected: "{n} seleccionados", lobbySaveSel: "Guardar seleccionados ({n})", lobbyRemoveSel: "Quitar seleccionados ({n})",
    lobbySaved: "En la biblioteca", lobbyNotSaved: "Sin guardar",
    lobbyMerged: "{n} bloque(s) duplicado(s) de este archivo se fusionaron en uno.", lobbyLinked: "{n} bloque(s) ya estaban en tu biblioteca y se vincularon en lugar de duplicarse.",
    removeSelTitle: "¿Quitar los bloques seleccionados?", removeSelGo: "Quitar",
    removeSelBody: "{n} bloque(s) se quitarán de esta sesión. Las copias guardadas en tu biblioteca Qbank no se ven afectadas.",
    removeSelBodyUnsaved: "{n} bloque(s) se quitarán de esta sesión. {u} de ellos no están guardados en tu biblioteca y se perderán definitivamente; guárdalos primero si quieres conservarlos.",
    pasteChars: "{n} caracteres pegados", pasteClear: "Borrar", pasteEmpty: "Aún no has pegado nada — expande para pegar o usa Subir archivo.",
    load: "Cargar examen", importQbank: "Importar nuevo Qbank", importInLibrary: "Ya está en tu biblioteca — inícialo desde ahí.", lobbySaveN: "Guardar en la biblioteca ({n})", lobbyRemoveN: "Quitar ({n})", triageHint: "Márcalo para guardarlo en tu biblioteca o quitarlo.", lobbyTriageNote: "Estos Qbanks acaban de importarse. Marca los que quieras y usa Guardar en la biblioteca para conservarlos o Quitar para descartarlos.", aiLaunchTitle: "Acceso rápido a IA", aiLaunchHint: "Abre tu herramienta de IA, pega el Prompt de receta de preguntas de abajo junto con tu tema o apuntes y trae la respuesta aquí.", aiLaunchOpens: "Se abre en una pestaña nueva", homeBtn: "Inicio", removeExam: "Quitar examen", removeTitle: "¿Quitar este examen?", removeBody: "Esto borra el examen cargado y su progreso o resultados. Tu biblioteca de preguntas guardada no se ve afectada.", removeBodyUnsaved: "Esto borra el examen cargado y su progreso o resultados. Algunos de sus bloques no están guardados en tu biblioteca y se perderían para siempre. Cancela y toca Guardar en la biblioteca primero si quieres conservarlos.", removeGo: "Quitar", libRename: "Renombrar Qbank", libRenameSave: "Guardar nombre", howItWorks: "Cómo funciona", guideStep: "Paso {n} de {total}", guideBack: "Atrás", guideNext: "Siguiente", guideDone: "Entendido", guideClose: "Cerrar guía", navCollapse: "Contraer lista de preguntas", navExpand: "Expandir lista de preguntas", resumeSession: "Reanudar sesión", sessionInProgress: "Sesión en curso", sessionPos: "Pregunta {n} de {total}", examLoadedLabel: "Examen cargado", openLobby: "Abrir sala del examen", inProgressTag: "En curso", discardTitle: "¿Descartar la sesión en curso?", discardBody: "Iniciar algo nuevo reemplaza tu bloque en curso y se perderán sus respuestas.", discardGo: "Descartar y continuar", hide: "Ocultar", recipe: "Prompt de receta de preguntas",
    recipeIntro: "Configura un bloque abajo y luego copia la receta generada en la herramienta de IA que prefieras (agrega tu material de estudio si lo permite). Devuelve las preguntas en el formato exacto que esta app espera.",
    blockSize: "Tamaño del bloque", focus: "Enfoque",
    diffMode: "Dificultad", "diffMode.mixed": "Mixta (recomendada)", "diffMode.easy": "Fácil", "diffMode.medium": "Media", "diffMode.hard": "Difícil (estándar USMLE)",
    diffHintMixed: "{e} fáciles · {m} medias · {h} difíciles (aprox. 20% / 60% / 20%), intercaladas para reflejar la variación de un examen real. Cada pregunta se etiqueta según su nivel de dificultad para el seguimiento.",
    diffHintEasy: "Recuerdo y tríadas básicas: viñetas de 1–3 oraciones, reconocimiento en 1–2 pasos, 3–4 opciones con distractores distintos.",
    diffHintMedium: "Práctica estándar: viñetas de 3–5 oraciones, razonamiento en 2 pasos (diagnóstico y luego mejor prueba inicial), 5 opciones realistas.",
    diffHintHard: "Estándar USMLE: viñetas de 5–8 oraciones con matices sutiles y señuelos, razonamiento en 3 pasos, opciones muy cercanas.",
    exportShare: "Exportar / Compartir", exportShared: "Compartido", exportDownloaded: "Descargado", exportFailed: "Error al exportar",
    exportTitle: "Envía este bloque a otro estudiante como archivo .json (AirDrop / menú de compartir cuando esté disponible; si no, se descarga)", exportShareText: "Bloque de preguntas de Oworld: {name}",
    mixDiffAll: "Todas", mixBalanced: "Equilibrada", mixBalancedShort: "Equilibrada", mixBalancedHint: "20% fáciles / 60% medias / 20% difíciles, p. ej. {e} · {m} · {h} con este tamaño.", mixUnrated: "Se omiten {n} pregunta(s) sin etiqueta de dificultad.",
    customSize: "Personalizado", customSizePh: "1–{n}", "dl.easy": "Fácil", "dl.medium": "Media", "dl.hard": "Difícil", perfDifficulty: "Desempeño por dificultad",
    "focus.standard": "Mezcla USMLE estándar", "focus.systems": "Un solo sistema", "focus.discipline": "Una sola disciplina",
    phSystems: "p. ej. Cardiovascular, Renal, Neuro…", phDisc: "p. ej. Farmacología, Bioquímica, Microbiología…",
    recipeTitle: "Receta de preguntas — prompt para IA", copied: "Copiado", copy: "Copiar", schema: "Esquema JSON", viewSchema: "Ver esquema JSON para desarrolladores", hideSchema: "Ocultar esquema JSON para desarrolladores",
    createdBy: "OWORLD fue creado por", role: "Estudiante de medicina | Fundador de Verde+",
    notAffil: "Sin afiliación con NBME ni USMLE®", tmTitle: "Aviso de marcas registradas",
    tm1: "OWORLD es una herramienta de estudio independiente y no oficial para resolver bloques de preguntas de práctica que tú mismo generas con herramientas de IA de terceros. No es producida, respaldada, licenciada ni afiliada al National Board of Medical Examiners (NBME) ni a la Federation of State Medical Boards (FSMB).",
    tm2: "USMLE® es una marca registrada de la NBME y la FSMB. Cualquier parecido con su interfaz o terminología de examen se usa únicamente con fines descriptivos y educativos.",
    close: "Cerrar",
    practiceExam: "Examen de práctica", fullSummary: "Resumen completo del examen", importNew: "Importar nuevo examen",
    notStarted: "Sin iniciar", inProgress: "En curso · {a}/{n} respondidas", qCount: "{n} preguntas",
    minLimit: "límite de {m} min", untimed: "Sin límite de tiempo", timed: "Cronometrado", review: "Revisar",
    retestMissed: "Repetir falladas ({n})", retestAll: "Repetir bloque completo ({n})",
    resume: "Reanudar bloque", start: "Iniciar bloque",
    timingNote: "El tiempo empieza en cuanto haces clic en \"Iniciar bloque\"; la cuenta regresiva continúa aunque cambies de pantalla.",
    item: "Ítem: {n} de {total}", blockOf: "Bloque: 1 de 1",
    retestMode: "Modo repaso: {type} ({n} {items})", "rt.missed": "Preguntas falladas", "rt.full": "Bloque completo",
    item1: "ítem", itemN: "ítems", prev: "Anterior", next: "Siguiente",
    labValues: "Valores de laboratorio", notes: "Notas", calc: "Calculadora",
    timedBlock: "Bloque cronometrado", hints: "Pistas", shortcuts: "Atajos de teclado",
    "sc.next": "Siguiente pregunta", "sc.prev": "Pregunta anterior", "sc.mark": "Marcar pregunta",
    "sc.select": "Seleccionar respuesta", "sc.hl": "Resaltar selección",
    qStatus: "Estado de preguntas", mark: "Marcar pregunta", hideHint: "Ocultar pista", showHint: "Mostrar pista",
    hlTip: "Selecciona texto y haz clic en Resaltar.",
    noHint: "No se proporcionó una pista para esta pregunta.", strike: "Tachar esta opción",
    proceedNext: "Pasar al siguiente ítem", proceedSummary: "Pasar al resumen del bloque",
    timeLeft: "Tiempo restante del bloque", untimedLower: "sin límite",
    answered: "Respondidas: {a}/{n}", flagged: " · Marcadas: {f}", lock: "Bloquear", endBlock: "Terminar bloque",
    notesItem: "Notas — Ítem {n}", delNote: "Borrar nota", saveClose: "Guardar y cerrar", highlight: "Resaltar",
    paused: "Examen en pausa: el cronómetro está detenido.", endQ: "¿Terminar este bloque?",
    endConfirm: "Has respondido {a} de {n} preguntas. Una vez que termines el bloque no podrás cambiar tus respuestas, pero podrás revisar las explicaciones de inmediato.",
    keepWorking: "Seguir trabajando", endBlockBtn: "Terminar bloque", timesUp: "Se acabó el tiempo",
    timesUpBody: "El tiempo asignado para este bloque ha terminado. Respondiste {a} de {n} preguntas. El bloque se enviará automáticamente y podrás revisar tus resultados.",
    viewResults: "Ver resultados",
    siIntervals: "Intervalos de referencia SI", siHdr: "Intervalo de referencia SI", refRange: "Rango de referencia",
    search: "Buscar…", noMatches: "Sin coincidencias en {tab}.",
    "tab.Serum": "Suero", "tab.Cerebrospinal": "Líquido cefalorraquídeo", "tab.Blood": "Sangre", "tab.Urine and BMI": "Orina e IMC",
    back: "Volver a los bloques", results: "{name} — resultados",
    scoreLine: "{c} correctas de {t} · {u} sin responder",
    retestIncBtn: "Repetir falladas (modo tutor)", retestFullBtn: "Repetir bloque completo", retestTitle: "Configurar repaso",
    poolLabel: "Grupo de preguntas", poolIncorrect: "Solo falladas", poolFlagged: "Solo marcadas", poolAll: "Todas las preguntas",
    modeSel: "Modo del examen", modeTutorOpt: "Modo tutor", modeTimedOpt: "Modo cronometrado", poolEmpty: "No hay preguntas en este grupo.",
    retestSaveNote: "Tu puntaje y tiempo del primer intento se guardan y este repaso no los modificará.",
    startRetest: "Iniciar repaso", cancel: "Cancelar", attemptHistory: "Historial de intentos", firstAttempt: "Primer intento (línea base)",
    retestN: "Repaso {n}", timerOffTag: "cronómetro desactivado", elapsed: "Tiempo", retestsExcluded: "{n} intento(s) de repaso no se cuentan en estos totales; los puntajes del primer intento se conservan como línea base.",
    "rt.flagged": "Preguntas marcadas", sufFlagged: "Repaso de marcadas",
    rtMissed: "Repetir preguntas falladas ({n})", perfect: "Repetir preguntas falladas — ¡puntaje perfecto!",
    rtAll: "Repetir bloque completo ({n})", loadNew: "Cargar nuevo examen",
    perfSubject: "Desempeño por materia", qReview: "Revisión de preguntas",
    correct: "Correcta", yours: "Tu respuesta", explanation: "Explicación", eduObj: "Objetivo educativo",
    sources: "Referencias", page: "p.", general: "General", score: "Puntaje",
    fullSummaryTitle: "{name} — resumen completo",
    across: "{c} correctas de {q} preguntas en {b} {blocks}", block1: "bloque", blockN: "bloques",
    perfAll: "Desempeño por materia (todos los bloques)", focusAreas: "Áreas de enfoque",
    lowest: "Menor puntaje: {list}. Considera generar un nuevo bloque con tu herramienta de IA enfocado en estos sistemas.",
    sufMissed: "Repetir falladas", sufAll: "Repetir todo",
    "err.json": "No se pudo leer como JSON, ni siquiera tras repararlo automáticamente ({detail}). Asegúrate de haber copiado la respuesta completa, incluidos los corchetes de cierre del final.",
    "err.noneValid": "No se pudo cargar ninguna pregunta válida.",
    "err.qObj": "La pregunta {n} de \"{name}\" no es un objeto JSON.",
    "err.correctMulti": "La pregunta \"{id}\" indica más de una respuesta correcta; se requiere exactamente una.",
    "err.correctConflict": "Pregunta \"{id}\": la letra y el texto de la respuesta correcta apuntan a opciones distintas.",
    "warn.fixed": "Se repararon automáticamente problemas de formato en el texto pegado (bloques de código, comentarios extra, comillas tipográficas, comas finales o faltantes, comillas sin escapar).",
    "warn.truncated": "Este texto está cortado o tiene un error de sintaxis a mitad de camino, así que solo se recuperaron las {n} pregunta(s) completas anteriores a ese punto. Pide a ChatGPT que continúe o genera un bloque más pequeño.",
    "warn.skipped": "{n} pregunta(s) estaban incompletas o eran ambiguas y se omitirán:",
    "warn.blockDropped": "El bloque \"{name}\" no tenía preguntas utilizables y se omitirá.",
    "warn.timeDropped": "El bloque \"{name}\" tiene un límite de tiempo que no es un número, así que no tendrá cronómetro.",
    "warn.normalized": "{n} pregunta(s) usaban otros nombres de campos u otros formatos de opciones y se convirtieron al formato estándar.",
    "warn.defaults": "Se completaron automáticamente los ids faltantes o duplicados y los nombres de bloque faltantes.",
    "warn.reviewTitle": "Revisa antes de cargar", "warn.loadN": "Cargar {n} pregunta(s)", "warn.saveN": "Guardar {n} pregunta(s)", "warn.back": "Volver a editar", "warn.more": "…y {n} más",
    "err.root": "La raíz debe ser un objeto JSON.",
    "err.blocks": "Falta un arreglo \"blocks\" que no esté vacío.",
    "err.blockName": "Al bloque {n} le falta \"blockName\".",
    "err.timeLimit": "El bloque \"{name}\" tiene un \"timeLimitMinutes\" que no es un número. Omítelo por completo para un bloque sin límite de tiempo.",
    "err.questions": "El bloque \"{name}\" necesita un arreglo \"questions\" que no esté vacío.",
    "err.qId": "A la pregunta {n} de \"{name}\" le falta \"id\".",
    "err.vignette": "A la pregunta \"{id}\" le falta \"vignette\".",
    "err.stem": "A la pregunta \"{id}\" le falta \"stem\".",
    "err.options": "La pregunta \"{id}\" necesita un arreglo \"options\" con al menos 2 opciones.",
    "err.correct": "A la pregunta \"{id}\" le falta \"correctAnswer\".",
    "err.match": "Pregunta \"{id}\": correctAnswer \"{ans}\" no coincide con ninguna clave de opción.",
  },
};

const LangContext = createContext({ lang: "en", setLang: () => {} });

// Tutor mode (AMBOSS-style): instant correct/incorrect feedback after each answer,
// plus per-question reset. Global setting, off by default, toggled from any Settings menu.

function useI18n() {
  const { lang, setLang } = useContext(LangContext);
  const t = (key, vars) => {
    let s = STR[lang]?.[key] ?? STR.en[key] ?? key;
    if (vars) for (const k in vars) s = s.split(`{${k}}`).join(String(vars[k]));
    return s;
  };
  return { t, lang, setLang };
}

// retestType → i18n keys. "missed" = incorrect, "full" = all questions; the rest mirror the retest pools.
const RETEST_SUFFIX = { missed: "sufMissed", flagged: "sufFlagged", again: "sufAgain", hard: "sufHard", againhard: "sufAgainHard", full: "sufAll" };
const RETEST_TITLE = { missed: "rt.missed", flagged: "rt.flagged", again: "rt.again", hard: "rt.hard", againhard: "rt.againhard", full: "rt.full" };
const RETEST_POOL_LABEL = { missed: "poolIncorrect", flagged: "poolFlagged", again: "poolAgain", hard: "poolHard", againhard: "poolAgainHard", full: "poolAll" };

// Retest blocks store only the base name; the suffix is localized at display time.
function blockLabel(block, t) {
  if (!block.isRetest) {
    const base = block.isMixed && block.mixCount > 1 ? t("mixedName", { n: block.mixCount }) : block.blockName;
    const d = block.mixDifficulty;
    return d && d !== "all" ? `${base} · ${t(d === "balanced" ? "mixBalancedShort" : "dl." + d)}` : base;
  }
  return `${baseBlockName(block.blockName)} — ${t(RETEST_SUFFIX[block.retestType] || "sufAll")}`;
}

// Lab-table section headers and unit words (test names keep their standard English/abbreviated form).
const LAB_HDR_ES = {
  "General Chemistry — Electrolytes": "Química general — Electrolitos", "Hepatic": "Hepático",
  "Other, serum": "Otros, suero", "Lipids": "Lípidos", "Iron Studies": "Estudios de hierro",
  "Endocrine": "Endocrino", "Immunoglobulins": "Inmunoglobulinas",
  "Gases, Arterial (Room Air)": "Gases arteriales (aire ambiente)", "Complete Blood Count": "Hemograma completo",
  "Coagulation": "Coagulación", "Other, Hematologic": "Otros, hematológicos",
};
function labVal(s, lang) {
  if (lang !== "es" || typeof s !== "string") return s;
  return s.replace(/seconds/g, "segundos").replace(/million\//g, "millones/").replace("total proteins", "proteínas totales")
    .replace("of dose", "de la dosis").replace("fraction", "fracción").replace(" of 0800 h", " de 0800 h");
}

// Front-page language switch (always visible on the import screen)
function LangToggle({ T }) {
  const { lang, setLang } = useI18n();
  return (
    <div role="group" aria-label="Language" style={{ display: "inline-flex", border: `1px solid ${T.border}`, borderRadius: 6, overflow: "hidden", flexShrink: 0 }}>
      {["en", "es"].map((l) => (
        <button key={l} onClick={() => setLang(l)} aria-pressed={lang === l} style={{
          fontFamily: FONT_UI, fontWeight: 700, fontSize: fs(12.5), padding: "9px 12px", border: "none", cursor: "pointer",
          background: lang === l ? T.blue : "transparent", color: lang === l ? T.onBlue : T.ink,
        }}>{l.toUpperCase()}</button>
      ))}
    </div>
  );
}

// Text size control. bar=true → compact A− / A+ pair for the exam toolbar; otherwise a labelled row for Settings menus.
function TextSizeControl({ T, bar = false }) {
  const { t } = useI18n();
  const { textScale, setTextScale } = useContext(TextScaleContext);
  const i = TEXT_STEPS.reduce((best, v, k) => (Math.abs(v - textScale) < Math.abs(TEXT_STEPS[best] - textScale) ? k : best), 0);
  const go = (d) => setTextScale(TEXT_STEPS[Math.max(0, Math.min(TEXT_STEPS.length - 1, i + d))]);
  const atMin = i === 0, atMax = i === TEXT_STEPS.length - 1;
  const pct = Math.round(textScale * 100);
  const mk = (label, d, off, title, size) => (
    <button onClick={() => go(d)} disabled={off} title={title} aria-label={title} style={{
      fontFamily: FONT_UI, fontWeight: 700, fontSize: size, lineHeight: 1, minWidth: 34, height: 30, padding: "0 8px",
      borderRadius: 6, cursor: off ? "not-allowed" : "pointer", opacity: off ? 0.35 : 1,
      border: `1px solid ${bar ? "rgba(255,255,255,0.45)" : T.border}`, background: "transparent", color: bar ? "#fff" : T.ink,
    }}>{label}</button>
  );
  if (bar) {
    return (
      <div role="group" aria-label={t("textSize")} style={{ display: "flex", alignItems: "center", gap: 4 }}>
        {mk("A−", -1, atMin, t("textSmaller"), 12)}
        {mk("A+", 1, atMax, t("textLarger"), 15)}
      </div>
    );
  }
  return (
    <div style={{ margin: "10px 0 12px" }}>
      <div style={{ fontFamily: FONT_UI, fontWeight: 700, fontSize: 11, color: T.muted, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 6 }}>
        {t("textSize")}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        {mk("A−", -1, atMin, t("textSmaller"), 12)}
        <span style={{ fontFamily: FONT_MONO, fontSize: 12.5, color: T.ink, minWidth: 44, textAlign: "center" }}>{pct}%</span>
        {mk("A+", 1, atMax, t("textLarger"), 15)}
        {textScale !== 1 && (
          <button onClick={() => setTextScale(1)} style={{ marginLeft: "auto", fontFamily: FONT_UI, fontSize: 12, fontWeight: 600, background: "transparent", border: "none", color: T.blue, cursor: "pointer", padding: 4 }}>
            {t("textReset")}
          </button>
        )}
      </div>
    </div>
  );
}

// Language picker used inside the Settings menus
function LangSelect({ T }) {
  const { t, lang, setLang } = useI18n();
  return (
    <div style={{ margin: "10px 0 12px" }}>
      <div style={{ fontFamily: FONT_UI, fontWeight: 700, fontSize: fs(11), color: T.muted, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 6 }}>
        {t("lang")}
      </div>
      <select value={lang} onChange={(e) => setLang(e.target.value)} style={{
        width: "100%", fontFamily: FONT_UI, fontSize: fs(13), padding: "6px 8px", borderRadius: 6,
        border: `1px solid ${T.border}`, background: T.paper, color: T.ink,
      }}>
        <option value="en">English</option>
        <option value="es">Español</option>
      </select>
    </div>
  );
}


// ---------------------------------------------------------------------------
// Sample schema + demo data + AI prompt template
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
          "difficultyRating": 2,
          "difficultyLabel": "Easy",
          "vignette": "A 58-year-old man comes to the physician because of substernal chest pressure that began 2 hours ago while shoveling snow. He has a history of hypertension and type 2 diabetes mellitus. His pulse is 98/min and blood pressure is 148/92 mm Hg. An ECG shows ST-segment elevation in leads II, III, and aVF.",
          "keyInfoPhrases": [
            "substernal chest pressure",
            "while shoveling snow",
            "hypertension and type 2 diabetes mellitus",
            "ST-segment elevation in leads II, III, and aVF"
          ],
          "stem": "Which of the following is the most likely diagnosis?",
          "options": [
            {
              "key": "A",
              "text": "Acute pericarditis"
            },
            {
              "key": "B",
              "text": "Inferior wall myocardial infarction"
            },
            {
              "key": "C",
              "text": "Aortic dissection"
            },
            {
              "key": "D",
              "text": "Pulmonary embolism"
            },
            {
              "key": "E",
              "text": "Costochondritis"
            }
          ],
          "correctAnswer": "B",
          "attendingTip": "Start with the ECG: ST elevation in a contiguous group of leads means transmural ischemia, so ask which wall those leads look at. Then match the territory to its artery; II, III, and aVF all face the inferior wall, which the RCA usually supplies.",
          "explanation": "ST elevation in the inferior leads (II, III, aVF) with typical exertional chest pain and cardiac risk factors is classic for an inferior wall MI, usually from RCA occlusion.",
          "keyLearningPoint": "ST elevation in II, III, and aVF localizes to the inferior wall, most often from RCA occlusion; check for right ventricular involvement before giving nitrates.",
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
  "examTitle": "Demo Practice Exam",
  "blocks": [
    {
      "blockName": "Block 1 (Demo)",
      "timeLimitMinutes": 3,
      "questions": [
        {
          "id": "d1",
          "subject": "Cardiovascular",
          "difficultyRating": 2,
          "difficultyLabel": "Easy",
          "vignette": "A 58-year-old man comes to the physician because of substernal chest pressure that began 2 hours ago while shoveling snow. He has a history of hypertension and type 2 diabetes mellitus. His pulse is 98/min and blood pressure is 148/92 mm Hg. An ECG shows ST-segment elevation in leads II, III, and aVF.",
          "keyInfoPhrases": [
            "substernal chest pressure",
            "while shoveling snow",
            "hypertension and type 2 diabetes mellitus",
            "ST-segment elevation in leads II, III, and aVF"
          ],
          "stem": "Which of the following is the most likely diagnosis?",
          "options": [
            {
              "key": "A",
              "text": "Acute pericarditis"
            },
            {
              "key": "B",
              "text": "Inferior wall myocardial infarction"
            },
            {
              "key": "C",
              "text": "Aortic dissection"
            },
            {
              "key": "D",
              "text": "Pulmonary embolism"
            },
            {
              "key": "E",
              "text": "Costochondritis"
            }
          ],
          "correctAnswer": "B",
          "attendingTip": "Start with the ECG: ST elevation in a contiguous group of leads means transmural ischemia, so ask which wall those leads look at. Then match the territory to its artery; II, III, and aVF all face the inferior wall, which the RCA usually supplies.",
          "explanation": "ST elevation in the inferior leads (II, III, aVF) with typical exertional chest pain and cardiac risk factors is classic for an inferior wall MI, usually from RCA occlusion.",
          "keyLearningPoint": "ST elevation in II, III, and aVF localizes to the inferior wall, most often from RCA occlusion; check for right ventricular involvement before giving nitrates.",
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
        },
        {
          "id": "d2",
          "subject": "Endocrine",
          "difficultyRating": 2,
          "difficultyLabel": "Easy",
          "vignette": "A 34-year-old woman comes to the physician because of a 3-month history of weight loss, heat intolerance, and palpitations. Examination shows a fine tremor, warm moist skin, and a diffusely enlarged, non-tender thyroid gland. Exophthalmos is present.",
          "keyInfoPhrases": [
            "weight loss, heat intolerance, and palpitations",
            "diffusely enlarged, non-tender thyroid gland",
            "Exophthalmos is present"
          ],
          "stem": "Which of the following is the most likely underlying mechanism?",
          "options": [
            {
              "key": "A",
              "text": "Autoantibodies against thyroid-stimulating hormone receptor"
            },
            {
              "key": "B",
              "text": "Autonomous thyroid nodule"
            },
            {
              "key": "C",
              "text": "Viral-induced thyroid inflammation"
            },
            {
              "key": "D",
              "text": "Excess iodine ingestion"
            },
            {
              "key": "E",
              "text": "Pituitary adenoma secreting TSH"
            }
          ],
          "correctAnswer": "A",
          "attendingTip": "Hyperthyroid symptoms plus a diffuse, non-tender goiter narrow the field to Graves disease versus thyroiditis. Exophthalmos is the tiebreaker: it occurs in Graves disease, where the autoantibodies also act on orbital fibroblasts.",
          "explanation": "Diffuse goiter, exophthalmos, and hyperthyroid symptoms in a young woman are classic for Graves disease, caused by stimulating autoantibodies against the TSH receptor.",
          "keyLearningPoint": "Graves disease is caused by TSH-receptor-stimulating IgG antibodies and is the hyperthyroid state that uniquely produces exophthalmos and pretibial myxedema.",
          "distractorAnalysis": {
            "B": "An autonomous nodule causes hyperthyroidism from a focal toxic adenoma, giving a nodular rather than diffusely enlarged gland and no exophthalmos.",
            "C": "Viral (subacute) thyroiditis produces a painful, tender thyroid with an elevated ESR, not exophthalmos.",
            "D": "Excess iodine can trigger hyperthyroidism in a patient with underlying nodular goiter (Jod-Basedow) but does not cause exophthalmos.",
            "E": "A TSH-secreting pituitary adenoma is rare and presents with inappropriately normal or elevated TSH, without exophthalmos."
          },
          "hint": "Exophthalmos narrows this down to one specific autoimmune cause of hyperthyroidism.",
          "educationalObjective": "Recognize Graves disease as TSH-receptor autoantibody-mediated hyperthyroidism with exophthalmos.",
          "sourceReferences": [
            {
              "sourceTitle": "First Aid for the USMLE Step 1 (2025)",
              "chapterSection": "Endocrine — Thyroid Pathology",
              "pageNumber": "338",
              "relevance": "Graves disease mechanism and exam findings"
            }
          ]
        },
        {
          "id": "d3",
          "subject": "Renal",
          "difficultyRating": 3,
          "difficultyLabel": "Medium",
          "vignette": "A 6-year-old boy is brought in with periorbital edema and cola-colored urine 10 days after a sore throat. Blood pressure is 128/84 mm Hg. Urinalysis shows red cell casts and mild proteinuria. Serum C3 is decreased.",
          "keyInfoPhrases": [
            "periorbital edema and cola-colored urine",
            "10 days after a sore throat",
            "red cell casts",
            "Serum C3 is decreased"
          ],
          "stem": "Which of the following is the most likely diagnosis?",
          "options": [
            {
              "key": "A",
              "text": "Minimal change disease"
            },
            {
              "key": "B",
              "text": "IgA nephropathy"
            },
            {
              "key": "C",
              "text": "Post-streptococcal glomerulonephritis"
            },
            {
              "key": "D",
              "text": "Membranous nephropathy"
            },
            {
              "key": "E",
              "text": "Alport syndrome"
            }
          ],
          "correctAnswer": "C",
          "attendingTip": "Cola-colored urine, hypertension, and red cell casts make this a nephritic picture. The latency after a sore throat and the low C3 then point to an immune-complex, post-infectious cause.",
          "explanation": "Red cell casts, low C3, and onset 1-3 weeks after pharyngitis in a child are characteristic of post-streptococcal glomerulonephritis.",
          "keyLearningPoint": "Post-streptococcal GN appears 1-3 weeks after pharyngitis or skin infection with low C3 and subepithelial humps, and is usually self-limited in children.",
          "distractorAnalysis": {
            "A": "Minimal change disease causes nephrotic-range proteinuria with normal complement and no red cell casts.",
            "B": "IgA nephropathy typically presents 1-2 days after an upper respiratory infection and has normal C3.",
            "D": "Membranous nephropathy is a nephrotic syndrome of adults with heavy proteinuria, not a nephritic picture.",
            "E": "Alport syndrome causes hematuria with hearing loss and ocular findings, a family history, and normal complement."
          },
          "hint": "The low complement level points toward one specific post-infectious diagnosis.",
          "educationalObjective": "Distinguish post-streptococcal GN by its latency period, low C3, and red cell casts.",
          "sourceReferences": [
            {
              "sourceTitle": "First Aid for the USMLE Step 1 (2025)",
              "chapterSection": "Renal — Nephritic Syndromes",
              "pageNumber": "588",
              "relevance": "Post-infectious GN timeline and complement findings"
            },
            {
              "sourceTitle": "BRS Pathology (6th Ed.)",
              "chapterSection": "Chapter 16: The Kidney and Urinary System",
              "pageNumber": "310-312",
              "relevance": "Immune complex mechanism of glomerular injury"
            }
          ]
        }
      ]
    }
  ]
};

const FOCUS_MODES = [
  { id: "standard", label: "Standard USMLE mix" },
  { id: "systems", label: "Single organ system" },
  { id: "discipline", label: "Single discipline" },
];
const BLOCK_SIZES = [5, 15, 25, 40];
const MAX_RECIPE_SIZE = 60; // upper bound for the custom question count (most AI tools truncate far beyond this)

// Difficulty modes for the recipe. "mixed" is the recommended default.
const DIFFICULTY_MODES = ["mixed", "easy", "medium", "hard"];

// Difficulty tiers. A question carries an explicit difficultyLabel ("Easy" | "Medium" | "Hard") plus a 1-5
// difficultyRating (the dots). The label is authoritative; the rating is kept inside its tier's band
// (Easy 1-2, Medium 3, Hard 4-5). Either one alone still works, so banks made before the label existed
// keep their tracking.
const TIER_LABEL = { easy: "Easy", medium: "Medium", hard: "Hard" };
const TIER_BAND = { easy: [1, 2], medium: [3, 3], hard: [4, 5] };
const TIER_DEFAULT_RATING = { easy: 2, medium: 3, hard: 4 }; // dots shown when only a label is present

function difficultyTier(rating) {
  if (typeof rating !== "number" || !Number.isFinite(rating)) return null;
  return rating <= 2 ? "easy" : rating === 3 ? "medium" : "hard";
}

// "Easy" / "hard" / "Fácil" / "Difícil" / "Intermediate" / "Moderate" … -> "easy" | "medium" | "hard" | null
function tierFromLabel(v) {
  if (typeof v !== "string") return null;
  const x = v.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  if (!x) return null;
  if (/^(easy|facil|basic|simple|low|beginner)/.test(x)) return "easy";
  if (/^(med|moder|interm|average|standard)/.test(x)) return "medium";
  if (/^(hard|dificil|difficult|advanced|challeng|high)/.test(x)) return "hard";
  return null;
}

// -> { tier, rating } | null. Label wins; the rating is clamped into the tier's band (or defaulted).
function resolveDifficulty(rating, label) {
  const hasRating = typeof rating === "number" && Number.isFinite(rating);
  const tier = tierFromLabel(label) || (hasRating ? difficultyTier(Math.round(rating)) : null);
  if (!tier) return null;
  const [lo, hi] = TIER_BAND[tier];
  const r = hasRating ? Math.max(lo, Math.min(hi, Math.max(1, Math.min(5, Math.round(rating))))) : TIER_DEFAULT_RATING[tier];
  return { tier, rating: r };
}

const questionTier = (q) => resolveDifficulty(q && q.difficultyRating, q && q.difficultyLabel)?.tier || null;

// Mixed split: 20% Easy / 60% Medium / 20% Hard, rounded so the three always sum to the block size.
function mixedCounts(size) {
  const easy = Math.round(size * 0.2);
  const hard = Math.round(size * 0.2);
  return { easy, medium: size - easy - hard, hard };
}

// What each difficulty asks the AI for (vignette length, reasoning steps, options, clue counts).
const RECIPE_PROFILES = {
  en: {
    names: { easy: "Easy", medium: "Medium", hard: "Hard" },
    ratings: { easy: "1-2", medium: "3", hard: "4-5" },
    easy: {
      vignette: "1-3 short sentences focused on classic buzzwords and pathognomonic findings",
      step: "direct 1-step or 2-step recognition (e.g. identifying a condition straight from its primary presentation)",
      options: "3-4 options (A-D at most) with distinct, non-overlapping distractors",
      clues: "2-3", phrases: "2-3",
    },
    medium: {
      vignette: "3-5 sentences with standard clinical context (age/sex, chief complaint, history, exam, key labs/imaging)",
      step: "2-step clinical reasoning (e.g. Vignette → Diagnosis → Best Initial Test)",
      options: "5 options (A-E) with realistic clinical distractors",
      clues: "3-4", phrases: "3-4",
    },
    hard: {
      vignette: "5-8 sentences containing subtle clinical nuances, extra lab data, and potential red herrings",
      step: "3-step high-yield reasoning (e.g. Vignette → Diagnosis → Pathophysiology of the treatment mechanism)",
      options: "5 options (A-E) with closely related differential options requiring subtle discriminators",
      clues: "4-5", phrases: "4-5",
    },
  },
  es: {
    names: { easy: "Fácil", medium: "Media", hard: "Difícil" },
    ratings: { easy: "1-2", medium: "3", hard: "4-5" },
    easy: {
      vignette: "1 a 3 oraciones cortas centradas en palabras clave clásicas y hallazgos patognomónicos",
      step: "reconocimiento directo de 1 o 2 pasos (p. ej., identificar la condición directamente a partir de su presentación principal)",
      options: "3 a 4 opciones (como máximo A-D) con distractores distintos que no se solapen",
      clues: "2-3", phrases: "2-3",
    },
    medium: {
      vignette: "3 a 5 oraciones con contexto clínico estándar (edad/sexo, motivo de consulta, antecedentes, examen, laboratorios/imágenes clave)",
      step: "razonamiento clínico de 2 pasos (p. ej., viñeta → diagnóstico → mejor prueba inicial)",
      options: "5 opciones (A-E) con distractores clínicos realistas",
      clues: "3-4", phrases: "3-4",
    },
    hard: {
      vignette: "5 a 8 oraciones con matices clínicos sutiles, datos de laboratorio adicionales y posibles señuelos (red herrings)",
      step: "razonamiento de alto rendimiento de 3 pasos (p. ej., viñeta → diagnóstico → fisiopatología del mecanismo del tratamiento)",
      options: "5 opciones (A-E) con diferenciales muy cercanos que exigen discriminadores sutiles",
      clues: "4-5", phrases: "4-5",
    },
  },
};

// Difficulty section of the recipe. Returns { text, tiers, phrases } so the callers can reuse the
// tier list for the keyInfoPhrases count. Mixed lists each tier's profile and its exact question count.
function buildDifficultySection(size, difficulty, lang) {
  const P = RECIPE_PROFILES[lang === "es" ? "es" : "en"];
  const es = lang === "es";
  const tierLine = (id) => es
    ? `Viñeta: ${P[id].vignette}. Incluye ${P[id].clues} pistas clínicas distintas y de alto rendimiento. Paso cognitivo: ${P[id].step}. Opciones: ${P[id].options}, exactamente 1 correcta.`
    : `Vignette: ${P[id].vignette}. Include ${P[id].clues} distinct high-yield clinical clues. Cognitive step: ${P[id].step}. Options: ${P[id].options}, exactly 1 correct.`;
  // difficultyLabel values stay in English in both languages so the app can read them reliably.
  const pair = (id) => `difficultyLabel "${TIER_LABEL[id]}" ${es ? "con" : "with"} difficultyRating ${P.ratings[id]}`;

  if (difficulty === "easy" || difficulty === "medium" || difficulty === "hard") {
    const id = difficulty;
    const text = es
      ? `Dificultad: ${P.names[id]}. En todas las preguntas usa ${pair(id)}.\n${tierLine(id).replace(" Paso cognitivo:", "\nPaso cognitivo:").replace(" Opciones:", "\nOpciones:")}`
      : `Difficulty: ${P.names[id]}. On every question use ${pair(id)}.\n${tierLine(id).replace(" Cognitive step:", "\nCognitive step:").replace(" Options:", "\nOptions:")}`;
    return { text, tiers: [id], phrases: P[id].phrases };
  }

  const counts = mixedCounts(size);
  const tiers = ["easy", "medium", "hard"].filter((id) => counts[id] > 0);
  const countList = tiers.map((id) => `${counts[id]} ${P.names[id]}`).join(", ");
  const head = es
    ? `Dificultad: Mixta — exactamente ${countList}, intercaladas en orden aleatorio (nunca agrupadas por dificultad). Construye cada pregunta según su nivel y etiquétala: ${tiers.map(pair).join("; ")}.`
    : `Difficulty: Mixed — exactly ${countList}, interleaved in random order (never grouped by difficulty). Build each question to its tier and label it: ${tiers.map(pair).join("; ")}.`;
  const body = tiers.map((id) => `- ${P.names[id]}: ${tierLine(id)}`).join("\n");
  const phrases = tiers.length === 1 ? P[tiers[0]].phrases : tiers.map((id) => `${P[id].phrases} (${P.names[id]})`).join(", ");
  return { text: `${head}\n${body}`, tiers, phrases };
}

// Easy blocks use shorter vignettes, so they get a tighter default clock (1 min/question vs 1.5).
function recipeTimeLimit(size, difficulty) {
  return Math.max(1, Math.round(size * (difficulty === "easy" ? 1 : 1.5)));
}

// Overall score split by difficulty tier. entries: [{ rating, label, correct }]. Tiers with no questions are omitted.
function difficultyBreakdown(entries) {
  const map = { easy: { correct: 0, total: 0 }, medium: { correct: 0, total: 0 }, hard: { correct: 0, total: 0 } };
  entries.forEach((e) => {
    const tier = resolveDifficulty(e.rating, e.label)?.tier;
    if (!tier) return;
    map[tier].total += 1;
    if (e.correct) map[tier].correct += 1;
  });
  return ["easy", "medium", "hard"]
    .filter((id) => map[id].total > 0)
    .map((id) => ({ id, ...map[id], pct: Math.round((map[id].correct / map[id].total) * 100) }));
}

// Compact schema used INSIDE the generated prompt (some AI tools have a
// tight input-length limit). The full, richly-annotated SCHEMA_TEXT above
// stays in the "JSON schema" reference panel for humans to read — this is a
// field-name/type skeleton only, no prose example values, to keep the copied
// prompt as short as possible while still fully specifying the shape.
const PROMPT_SCHEMA_TEXT = `{"examTitle":"string","blocks":[{"blockName":"string","timeLimitMinutes":number,"questions":[{"id":"unique string","subject":"organ system/discipline","difficultyRating":number,"difficultyLabel":"Easy|Medium|Hard","vignette":"string","keyInfoPhrases":["string"],"stem":"string","options":[{"key":"A","text":"string"}],"correctAnswer":"matching key","attendingTip":"string","explanation":"string","keyLearningPoint":"string","distractorAnalysis":{"key":"string"},"hint":"string","educationalObjective":"string","sourceReferences":[{"sourceTitle":"string","chapterSection":"string","pageNumber":"string (optional)","relevance":"string"}]}]}]}`;

function buildQuestionRecipe({ size, focusMode, focusValue, lang, difficulty = "mixed" }) {
  if (lang === "es") return buildQuestionRecipeEs({ size, focusMode, focusValue, difficulty });
  const baseName =
    focusMode === "systems" && focusValue ? `${focusValue} System Block`
    : focusMode === "discipline" && focusValue ? `${focusValue} Block`
    : "Mixed Block";
  const blockName = difficulty === "mixed" ? baseName : `${baseName} (${RECIPE_PROFILES.en.names[difficulty]})`;
  const timeLimit = recipeTimeLimit(size, difficulty);
  const diff = buildDifficultySection(size, difficulty, "en");

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
${diff.text}
keyInfoPhrases: Extract ${diff.phrases} exact key diagnostic substring phrases directly from vignette text for smart-highlighting.
attendingTip: 1-2 sentence clinical reasoning breakdown written from the perspective of an attending physician guiding a student to the diagnosis.
explanation: 3-5 sentences analyzing why the correct option is right.
keyLearningPoint: 1-2 sentence high-yield takeaway summarizing the pathology/management.
distractorAnalysis: 1 concise sentence per wrong option explaining why it is incorrect and what condition it would typically point to.
hint: 1 short sentence guiding attention to the core abnormality without revealing the answer.
educationalObjective: 1-2 sentence core concept summary.
sourceReferences: 1-3 real sources (First Aid, BRS, Pathoma, etc.) — sourceTitle, chapterSection, pageNumber (omit if unsure), relevance.
subject: specific system/discipline. Every id unique. difficultyRating: integer 1 to 5, matching the difficulty tier above. difficultyLabel: exactly "Easy", "Medium" or "Hard", consistent with difficultyRating. Spread correctAnswer evenly across the option letters used (never the same letter more than twice in a row).
Focus: ${focusLine}`;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
// Tolerant exam loading
//
// AI tools (ChatGPT especially) rarely produce byte-perfect JSON. This pipeline accepts what a person
// can clearly "see" is the intended exam, while never loading a question that is incomplete or ambiguous:
//
//   1. Find the JSON inside whatever was pasted (code fences, chatty intro/outro text, BOM, zero-width chars).
//   2. Parse it. If that fails, repair the usual slips (smart quotes, trailing/missing commas, comments,
//      raw newlines or unescaped quotes inside strings, bad \\ escapes, unquoted keys, 'single quotes',
//      Python True/None). If it is still broken (e.g. the reply was cut off), recover everything complete
//      before the break.
//   3. Normalise the structure: root array / single block / wrapped object, snake_case & synonym field names,
//      options as strings / objects / maps, the correct answer as "b", "B)", "Option B" or the answer text.
//   4. Validate each question with the SAME rules as before (vignette, stem, >=2 options, exactly one
//      correct answer that matches an option). A question that fails is left out and reported — it is never
//      guessed at. Numeric answers like 2 are NOT guessed either (0- or 1-based is ambiguous).
// ---------------------------------------------------------------------------
const INVISIBLE_RE = /[\uFEFF\u200B\u200C\u200D\u2060]/g;
const normKey = (k) => String(k).toLowerCase().replace(/[^a-z0-9]/g, "");
const normText = (s) => String(s).toLowerCase().replace(/\s+/g, " ").replace(/[\s.]+$/, "").trim();

// Case/underscore-insensitive property lookup: indexKeys(obj).questionid -> "question_id"
function indexKeys(obj) {
  const m = {};
  for (const k of Object.keys(obj)) { const nk = normKey(k); if (!(nk in m)) m[nk] = k; }
  return m;
}
function pickAlias(obj, aliases) {
  if (!obj || typeof obj !== "object" || Array.isArray(obj)) return undefined;
  const nk = indexKeys(obj);
  for (const a of aliases) {
    if (nk[a] !== undefined) {
      const v = obj[nk[a]];
      if (v != null && !(typeof v === "string" && !v.trim())) return v;
    }
  }
  return undefined;
}
// Plain text from a string / number / array of strings; undefined for anything else (objects would crash React).
function toText(v) {
  if (typeof v === "string") { const s = v.trim(); return s || undefined; }
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  if (Array.isArray(v) && v.length && v.every((x) => typeof x === "string" || typeof x === "number")) {
    const s = v.map(String).join(" ").trim();
    return s || undefined;
  }
  return undefined;
}

// ---- 1. find the JSON ------------------------------------------------------
function extractJsonText(raw) {
  let text = String(raw).replace(INVISIBLE_RE, "").replace(/\u00A0/g, " ");
  // Prefer the longest fenced block that contains JSON; an unclosed fence (cut-off reply) runs to the end.
  const fences = [...text.matchAll(/```[A-Za-z0-9_-]*[ \t]*\r?\n?([\s\S]*?)(?:```|$)/g)]
    .map((m) => m[1]).filter((b) => /[{\[]/.test(b)).sort((a, b) => b.length - a.length);
  if (fences.length) text = fences[0];
  const s = text.search(/[{\[]/);
  if (s === -1) return text.trim();
  const closer = text[s] === "{" ? "}" : "]";
  const e = text.lastIndexOf(closer);
  return (e > s ? text.slice(s, e + 1) : text.slice(s)).trim();
}

// ---- 2a. repair ---------------------------------------------------------------
// Only ever run AFTER a plain JSON.parse has failed, so valid JSON is never touched.
function repairJsonText(src) {
  const n = src.length;
  let out = "";
  let i = 0;
  let prev = ""; // last significant character emitted outside a string
  const isWs = (c) => c === " " || c === "\n" || c === "\r" || c === "\t";
  const nextSig = (j) => { // next significant character: skips whitespace AND comments
    for (;;) {
      while (j < n && isWs(src[j])) j++;
      if (src[j] === "/" && src[j + 1] === "/") { while (j < n && src[j] !== "\n") j++; continue; }
      if (src[j] === "/" && src[j + 1] === "*") { const e = src.indexOf("*/", j + 2); j = e === -1 ? n : e + 2; continue; }
      return j;
    }
  };
  const startsValue = (j) => {
    const c = src[j];
    if (c === undefined) return false;
    if (c === '"' || c === "'" || c === "{" || c === "[" || c === "]" || c === "}" || c === "-" || (c >= "0" && c <= "9")) return true;
    const ahead = src.slice(j, j + 60);
    return /^(true|false|null|True|False|None|undefined|NaN)\b/.test(ahead) || /^[A-Za-z_$][\w$]*\s*:/.test(ahead); // literal, or an unquoted key
  };
  const needsComma = () => prev === "}" || prev === "]" || prev === '"' || /[0-9el]/.test(prev); // a value just ended
  const wordRe = /[A-Za-z_$][\w$]*|-?\d[\d.eE+\-]*/y;

  while (i < n) {
    const c = src[i];
    if (c === "/" && src[i + 1] === "/") { while (i < n && src[i] !== "\n") i++; continue; }
    if (c === "/" && src[i + 1] === "*") { const e = src.indexOf("*/", i + 2); i = e === -1 ? n : e + 2; continue; }
    if (isWs(c)) { out += c; i++; continue; }

    if (c === '"' || c === "'") {
      if (needsComma()) out += ","; // missing comma between two values
      const quote = c;
      out += '"';
      i++;
      while (i < n) {
        const d = src[i];
        if (d === "\\") {
          const e = src[i + 1];
          if (e !== undefined && ('"\\/bfnrt'.includes(e) || (e === "u" && /^[0-9a-fA-F]{4}$/.test(src.slice(i + 2, i + 6))))) { out += d + e; i += 2; continue; }
          if (quote === "'" && e === "'") { out += "'"; i += 2; continue; }
          out += "\\\\"; i++; continue; // stray backslash (e.g. LaTeX "\(") -> keep it literally
        }
        if (d === quote) {
          // A quote only CLOSES the string if what follows is plausible JSON; otherwise it is an unescaped quote in the text.
          const j = nextSig(i + 1);
          const nx = src[j];
          let closing = j >= n || nx === "}" || nx === "]";
          if (!closing && nx === ",") { const k = nextSig(j + 1); closing = k >= n || startsValue(k); }
          if (!closing && nx === ":") closing = startsValue(nextSig(j + 1));
          if (closing) { out += '"'; i++; break; }
          out += quote === '"' ? '\\"' : "'";
          i++;
          continue;
        }
        if (d === '"') { out += '\\"'; i++; continue; } // " inside a 'single-quoted' string
        if (d === "\n") { out += "\\n"; i++; continue; }
        if (d === "\r") { i++; continue; }
        if (d === "\t") { out += "\\t"; i++; continue; }
        if (d.charCodeAt(0) < 0x20) { out += " "; i++; continue; }
        out += d;
        i++;
      }
      prev = '"';
      continue;
    }

    if (c === ",") {
      const j = nextSig(i + 1);
      if (prev === "," || src[j] === "}" || src[j] === "]") { i++; continue; } // doubled / trailing comma
      out += ","; prev = ","; i++;
      continue;
    }
    if (c === "{" || c === "[") { if (needsComma()) out += ","; out += c; prev = c; i++; continue; }
    if (c === "}" || c === "]" || c === ":") { out += c; prev = c; i++; continue; }

    wordRe.lastIndex = i;
    const m = wordRe.exec(src);
    if (m) {
      const tok = m[0];
      i += tok.length;
      if (/^[A-Za-z_$]/.test(tok)) {
        const j = nextSig(i);
        if (src[j] === ":") { if (needsComma()) out += ","; out += `"${tok}"`; prev = '"'; continue; } // unquoted key
        const lit = { True: "true", False: "false", None: "null", undefined: "null", NaN: "null", Infinity: "null" }[tok];
        const val = lit || tok;
        if (needsComma()) out += ",";
        out += val; prev = val[val.length - 1];
        continue;
      }
      if (needsComma()) out += ",";
      out += tok; prev = tok[tok.length - 1];
      continue;
    }
    out += c; i++; // anything else: leave it and let JSON.parse decide
  }
  return out;
}

// ---- 2b. recover a cut-off / broken-partway document ------------------------------------
// Cuts the text after each closing bracket (latest first), appends the brackets still open, and keeps the
// first cut that parses. Whatever sat after the break is dropped; every question before it survives.
function salvageTruncatedJson(text) {
  const stack = [];
  const cuts = [];
  let inStr = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inStr) { if (c === "\\") i++; else if (c === '"') inStr = false; continue; }
    if (c === '"') { inStr = true; continue; }
    if (c === "{" || c === "[") stack.push(c);
    else if (c === "}" || c === "]") {
      stack.pop();
      if (stack.length > 0) cuts.push({ end: i + 1, closers: stack.map((s) => (s === "{" ? "}" : "]")).reverse().join("") });
    }
  }
  for (let k = cuts.length - 1, tries = 0; k >= 0 && tries < 300; k--, tries++) {
    try { return JSON.parse(text.slice(0, cuts[k].end) + cuts[k].closers); } catch (e) { /* try an earlier cut */ }
  }
  return undefined;
}

// Splits text that holds several top-level JSON values back to back ({…} {…} or {…},{…}, even with prose between them).
// Brace matching respects strings and escapes. Returns the list of value texts.
function splitTopLevelJson(text) {
  const out = [];
  let depth = 0, inStr = false, esc = false, start = -1;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inStr) { if (esc) esc = false; else if (c === "\\") esc = true; else if (c === '"') inStr = false; continue; }
    if (c === '"') { if (depth > 0) inStr = true; continue; }
    if (c === "{" || c === "[") { if (depth === 0) start = i; depth++; }
    else if ((c === "}" || c === "]") && depth > 0) { depth--; if (depth === 0) out.push(text.slice(start, i + 1)); }
  }
  return out;
}

// Several ```json fences in one reply, each a complete dataset: gather them all instead of keeping only the longest.
// Strict on purpose (every JSON fence must parse and contain blocks), so an unrelated code sample never gets mixed in.
function parseMultiFence(raw) {
  const text = String(raw).replace(INVISIBLE_RE, "");
  const fences = [...text.matchAll(/```[A-Za-z0-9_-]*[ \t]*\r?\n?([\s\S]*?)```/g)].map((m) => m[1]).filter((b) => /[{\[]/.test(b));
  if (fences.length < 2) return undefined;
  const values = [];
  for (const f of fences) {
    try { const v = JSON.parse(f.trim()); if (!locateBlocks(v)) return undefined; values.push(v); } catch (e) { return undefined; }
  }
  return values;
}

function tolerantParseJson(raw, depth = 0) {
  const trimmed = String(raw).replace(INVISIBLE_RE, "").trim();
  if (depth < 1 && /^"[\s\S]*"$/.test(trimmed)) { // the whole thing is one JSON string: "{\"blocks\": …}"
    try {
      const inner = JSON.parse(trimmed);
      if (typeof inner === "string") { const r = tolerantParseJson(inner, depth + 1); if (r.ok) return { ...r, repaired: true }; }
    } catch (e) { /* not a plain string; carry on */ }
  }
  const fenced = parseMultiFence(raw);
  if (fenced) return { ok: true, value: fenced, repaired: false, truncated: false };
  const base = extractJsonText(raw);
  const variants = [base];
  // Rich-text editors turn " into “ ”. Tried only as a fallback because those characters are also legitimate text.
  if (/[\u201C\u201D]/.test(base)) variants.push(base.replace(/[\u201C\u201D]/g, '"').replace(/[\u2018\u2019]/g, "'"));
  let detail = "";
  const done = (value, repaired, truncated) => {
    // A JSON document that was pasted as one big string ("{\"blocks\": …}") is unwrapped once.
    if (typeof value === "string" && depth < 1 && /[{\[]/.test(value)) {
      const inner = tolerantParseJson(value, depth + 1);
      if (inner.ok) return { ok: true, value: inner.value, repaired: true, truncated: inner.truncated };
    }
    return { ok: true, value, repaired, truncated };
  };
  for (let vi = 0; vi < variants.length; vi++) {
    const v = variants[vi];
    try { return done(JSON.parse(v), vi > 0, false); } catch (e) { if (vi === 0) detail = String(e.message || e); }
    const parts = splitTopLevelJson(v); // two exports pasted back to back
    if (parts.length >= 2) {
      try { return done(parts.map((x) => JSON.parse(x)), vi > 0, false); } catch (e) { /* not all complete: try repair */ }
    }
    const fixed = repairJsonText(v);
    try { return done(JSON.parse(fixed), true, false); } catch (e) { /* fall through to recovery */ }
    const salvaged = salvageTruncatedJson(fixed);
    if (salvaged !== undefined) return done(salvaged, true, true);
  }
  return { ok: false, detail: detail.replace(/\s+/g, " ").slice(0, 140) };
}

// ---- 3. normalise the structure -----------------------------------------------------------
const Q_ALIASES = {
  id: ["id", "qid", "questionid", "questionnumber", "qnumber", "number", "no"],
  subject: ["subject", "system", "discipline", "organsystem", "topic", "category"],
  difficultyRating: ["difficultyrating", "difficulty", "difficultylevel", "rating"],
  difficultyLabel: ["difficultylabel", "difficultytier", "difficultycategory", "tier"],
  vignette: ["vignette", "clinicalvignette", "scenario", "clinicalscenario", "case", "casepresentation", "patientpresentation"],
  stem: ["stem", "questionstem", "question", "questiontext", "prompt", "leadin"],
  options: ["options", "choices", "answerchoices", "answeroptions", "answers"],
  correctAnswer: ["correctanswer", "answer", "correct", "correctoption", "correctchoice", "correctletter", "correctkey", "answerkey", "rightanswer"],
  keyInfoPhrases: ["keyinfophrases", "keyphrases", "keyclues", "cluephrases", "keyinformation"],
  attendingTip: ["attendingtip", "tutortip", "tutorstip", "attendingstip", "tip"],
  explanation: ["explanation", "rationale", "answerexplanation"],
  keyLearningPoint: ["keylearningpoint", "learningpoint", "keytakeaway", "takeaway", "highyieldpearl"],
  distractorAnalysis: ["distractoranalysis", "distractors", "incorrectexplanations", "wronganswerexplanations", "optionanalysis"],
  hint: ["hint"],
  educationalObjective: ["educationalobjective", "learningobjective", "objective"],
  sourceReferences: ["sourcereferences", "sources", "references"],
};
const QUESTION_LIST = ["questions", "items", "qs", "questionlist"];

const LABEL_RE = /^\s*(?:\(([A-Za-z])\)|([A-Za-z])(?:[.):]|\s[-\u2013\u2014:]))\s*(\S[\s\S]*)$/;
const LEAD_LETTER_RE = /^(?:option|choice|answer)?\s*[:\-]?\s*\(?([A-Za-z])\)?(?:[.):\s\-\u2013\u2014]+([\s\S]*))?$/i;
const labelToLetter = (label) => {
  const m = /^\s*(?:option|choice)?\s*\(?([A-Za-z])\)?[.):]?\s*$/i.exec(String(label));
  return m ? m[1].toUpperCase() : null;
};
const isLabelLike = (s) => /^\s*(?:option|choice)?\s*\(?[A-Za-z0-9]\)?[.):]?\s*$/i.test(String(s));

// -> { options: [{key,text}], origKeys, touched } | null
function normalizeOptions(raw) {
  let items;
  if (Array.isArray(raw)) {
    items = raw.map((o) => {
      if (o && typeof o === "object" && !Array.isArray(o)) {
        let label = pickAlias(o, ["key", "label", "letter", "optionletter", "optionkey", "id", "choice", "option", "name"]);
        let text = toText(pickAlias(o, ["text", "content", "value", "optiontext", "choicetext", "description", "answer", "body", "statement"]));
        label = label == null ? undefined : String(label);
        if (text === undefined && label !== undefined && !isLabelLike(label)) { text = label.trim(); label = undefined; } // {"option": "Aspirin"}
        return { label, text };
      }
      return { label: undefined, text: toText(o), plain: true };
    });
    // ["A) Aspirin", "B) Heparin", …] — accept the embedded labels only if they run A, B, C… for every option.
    const plain = items.filter((it) => it.plain);
    if (plain.length === items.length && items.every((it) => it.text)) {
      const ms = items.map((it) => LABEL_RE.exec(it.text));
      if (ms.every((m, i) => m && (m[1] || m[2]).toUpperCase() === String.fromCharCode(65 + i))) {
        items = items.map((it, i) => ({ label: ms[i][1] || ms[i][2], text: ms[i][3].trim() }));
      }
    }
  } else if (raw && typeof raw === "object") {
    items = Object.entries(raw).map(([k, v]) => ({
      label: k,
      text: v && typeof v === "object" && !Array.isArray(v) ? toText(pickAlias(v, ["text", "content", "value", "option"])) : toText(v),
    }));
  } else return null;

  if (items.length < 2 || items.some((it) => !it.text)) return null;
  const letters = items.map((it) => (it.label === undefined ? null : labelToLetter(it.label)));
  const useLabels = letters.every(Boolean) && new Set(letters).size === letters.length;
  const keys = useLabels ? letters : items.map((_, i) => String.fromCharCode(65 + i));
  let stripped = false;
  const options = items.map((it, i) => {
    let text = it.text;
    const m = LABEL_RE.exec(text);
    if (m && (m[1] || m[2]).toUpperCase() === keys[i]) { text = m[3].trim(); stripped = true; } // "A) Aspirin" in the text field
    return { key: keys[i], text };
  });
  const canonical = Array.isArray(raw) && raw.every((o) => o && typeof o.key === "string" && typeof o.text === "string" && /^[A-Z]$/.test(o.key)) && !stripped
    && raw.every((o, i) => o.key === keys[i]);
  return { options, origKeys: items.map((it) => it.label), touched: !canonical };
}

// Maps something like "B", "(b)", "Option B", "2" to an option index (numbers only when the options were numbered).
function makeKeyResolver(options, origKeys) {
  return (s) => {
    const str = String(s).trim();
    const L = labelToLetter(str);
    if (L) { const i = options.findIndex((o) => o.key === L); if (i >= 0) return i; }
    const j = origKeys.findIndex((k) => k !== undefined && String(k).trim().toLowerCase() === str.toLowerCase());
    if (j >= 0) return j;
    const dm = /^\s*(?:option|choice)?\s*\(?(\d)\)?[.):]?\s*$/i.exec(str);
    if (dm) { const j2 = origKeys.findIndex((k) => k !== undefined && String(k).trim() === dm[1]); if (j2 >= 0) return j2; }
    return -1;
  };
}

// -> { idx, exact } | { err }
function resolveCorrectIndex(rawCorrect, options, resolve) {
  let c = rawCorrect;
  if (Array.isArray(c)) { if (c.length !== 1) return { err: "err.correctMulti" }; c = c[0]; }
  if (c && typeof c === "object") c = pickAlias(c, ["key", "letter", "label", "option", "text", "answer"]);
  if (c == null || String(c).trim() === "") return { err: "err.correct" };
  const s = String(c).trim();
  const exact = options.findIndex((o) => o.key === s);
  if (exact >= 0) return { idx: exact, exact: true };
  const ns = normText(s);
  const byText = options.map((o, i) => (normText(o.text) === ns ? i : -1)).filter((i) => i >= 0);
  if (byText.length === 1) return { idx: byText[0] };
  if (byText.length > 1) return { err: "err.match" }; // identical option texts: can't tell which is meant
  const lm = LEAD_LETTER_RE.exec(s); // "B", "B)", "Option B", "B. Aspirin"
  if (lm) {
    const idx = resolve(lm[1]);
    if (idx >= 0) {
      const rest = (lm[2] || "").trim();
      if (rest && normText(options[idx].text) !== normText(rest)) {
        // "C. Aspirin" where Aspirin is actually option A: the letter and the text disagree — don't guess.
        if (options.some((o, i) => i !== idx && normText(o.text) === normText(rest))) return { err: "err.correctConflict" };
      }
      return { idx };
    }
  }
  const idx = resolve(s);
  return idx >= 0 ? { idx } : { err: "err.match" };
}

function normalizeDistractors(raw, options, resolve) {
  if (!raw || typeof raw !== "object") return undefined;
  const out = {};
  const put = (kRaw, v) => {
    if (kRaw == null) return;
    const val = toText(v) ?? (v && typeof v === "object" && !Array.isArray(v) ? toText(pickAlias(v, ["reason", "explanation", "analysis", "text", "why"])) : undefined);
    const idx = resolve(kRaw);
    if (val && idx >= 0) out[options[idx].key] = val;
  };
  if (Array.isArray(raw)) {
    raw.forEach((it, i) => {
      if (typeof it === "string") { const m = LABEL_RE.exec(it); if (m) put(m[1] || m[2], m[3]); else put(options[i] && options[i].key, it); }
      else if (it && typeof it === "object") put(pickAlias(it, ["key", "option", "letter", "label"]) ?? (options[i] && options[i].key), it);
    });
  } else Object.entries(raw).forEach(([k, v]) => put(k, v));
  return Object.keys(out).length ? out : undefined;
}

function normalizeSources(raw) {
  const list = Array.isArray(raw) ? raw : raw != null ? [raw] : [];
  const out = list.map((r) => {
    if (typeof r === "string" && r.trim()) return { sourceTitle: r.trim() };
    if (!r || typeof r !== "object") return null;
    const title = toText(pickAlias(r, ["sourcetitle", "title", "source", "name", "book"]));
    if (!title) return null;
    const ref = { sourceTitle: title };
    const ch = toText(pickAlias(r, ["chaptersection", "chapter", "section"]));
    const pg = toText(pickAlias(r, ["pagenumber", "page", "pages"]));
    const rel = toText(pickAlias(r, ["relevance", "note", "notes", "description", "why"]));
    if (ch) ref.chapterSection = ch;
    if (pg) ref.pageNumber = pg;
    if (rel) ref.relevance = rel;
    return ref;
  }).filter(Boolean);
  return out.length ? out : undefined;
}

// -> { q, touched } | { err, vars }
function normalizeQuestion(q, n, usedIds, ctx) {
  if (!q || typeof q !== "object" || Array.isArray(q)) return { err: "err.qObj", vars: { n, name: ctx.blockName } };
  const nk = indexKeys(q);
  let touched = false;
  const get = (name) => {
    const aliases = Q_ALIASES[name];
    for (let k = 0; k < aliases.length; k++) {
      const key = nk[aliases[k]];
      if (key === undefined) continue;
      const v = q[key];
      if (v != null && !(typeof v === "string" && !v.trim())) { if (k > 0 && !(name in q)) touched = true; return v; }
    }
    return undefined;
  };

  let id = toText(get("id"));
  if (!id) { id = `q${n}`; ctx.defaults = true; }
  if (usedIds.has(id)) { // duplicate ids would make two questions share one answer slot
    let k = 2;
    while (usedIds.has(`${id}-${k}`)) k++;
    id = `${id}-${k}`;
    ctx.defaults = true;
  }
  usedIds.add(id);

  const vignette = toText(get("vignette"));
  if (!vignette) return { err: "err.vignette", vars: { id } };
  const stem = toText(get("stem"));
  if (!stem) return { err: "err.stem", vars: { id } };
  const normOpts = normalizeOptions(get("options"));
  if (!normOpts) return { err: "err.options", vars: { id } };
  if (normOpts.touched) touched = true;
  const { options, origKeys } = normOpts;
  const resolve = makeKeyResolver(options, origKeys);
  const res = resolveCorrectIndex(get("correctAnswer"), options, resolve);
  if (res.err) return { err: res.err, vars: { id, ans: String(get("correctAnswer") ?? "") } };
  if (!res.exact) touched = true;

  const out = { ...q, id, vignette, stem, options, correctAnswer: options[res.idx].key };
  const setText = (field) => { const v = toText(get(field)); if (v !== undefined) out[field] = v; else delete out[field]; };
  ["subject", "attendingTip", "explanation", "keyLearningPoint", "hint", "educationalObjective"].forEach(setText);

  // Difficulty: an explicit label (Easy/Medium/Hard) and a 1-5 rating. Either may be missing, or an AI may put the
  // label in the "difficulty" field; resolveDifficulty reconciles them so the label always wins and the rating stays inside its band.
  const dr = get("difficultyRating");
  const dn = typeof dr === "number" ? dr : parseFloat(String(dr));
  const dl = get("difficultyLabel");
  const resolved = resolveDifficulty(Number.isFinite(dn) ? dn : undefined, typeof dl === "string" ? dl : typeof dr === "string" ? dr : undefined);
  if (resolved) { out.difficultyRating = resolved.rating; out.difficultyLabel = TIER_LABEL[resolved.tier]; }
  else { delete out.difficultyRating; delete out.difficultyLabel; }

  const kp = get("keyInfoPhrases");
  const phrases = (Array.isArray(kp) ? kp : kp != null ? [kp] : []).filter((x) => typeof x === "string" && x.trim());
  if (kp !== undefined) out.keyInfoPhrases = phrases; else delete out.keyInfoPhrases;

  const da = normalizeDistractors(get("distractorAnalysis"), options, resolve);
  if (da) out.distractorAnalysis = da; else delete out.distractorAnalysis;
  const sr = normalizeSources(get("sourceReferences"));
  if (sr) out.sourceReferences = sr; else delete out.sourceReferences;
  return { q: out, touched };
}

const isQuestionLike = (x) => !!x && typeof x === "object" && !Array.isArray(x) && pickAlias(x, Q_ALIASES.options) !== undefined;
const hasQuestionList = (x) => !!x && typeof x === "object" && !Array.isArray(x) && Array.isArray(pickAlias(x, QUESTION_LIST));

// Finds the list of blocks in the many shapes people paste: {blocks:[…]}, [block,…], [question,…],
// {questions:[…]} (one block), or any of those wrapped in {"exam": …} / {"data": …}.
function locateBlocks(v, depth = 0) {
  if (depth > 3 || v == null || typeof v !== "object") return null;
  if (Array.isArray(v)) {
    if (!v.length) return null;
    if (v.every(hasQuestionList)) return { blocks: v, root: {} };
    if (v.some(isQuestionLike)) return { blocks: [{ questions: v }], root: {} };
    // Several datasets in one array ([{ examTitle, blocks }, { blocks }, …]): keep every block, in order.
    const parts = v.map((x) => locateBlocks(x, depth + 1));
    if (parts.every(Boolean)) return { blocks: parts.flatMap((x) => x.blocks), root: parts.length === 1 ? parts[0].root : {} };
    return null;
  }
  const bl = pickAlias(v, ["blocks", "blocklist", "sections"]);
  if (Array.isArray(bl) && bl.length) {
    if (bl.every(hasQuestionList)) return { blocks: bl, root: v };
    if (bl.some(isQuestionLike)) return { blocks: [{ questions: bl }], root: v };
  }
  if (Array.isArray(pickAlias(v, QUESTION_LIST))) return { blocks: [v], root: v };
  const hits = [];
  for (const val of Object.values(v)) {
    if (val && typeof val === "object") {
      const r = locateBlocks(val, depth + 1);
      if (r) hits.push(r);
    }
  }
  if (hits.length === 1) return { ...hits[0], root: Object.keys(hits[0].root).length ? hits[0].root : v };
  if (hits.length > 1) return { blocks: hits.flatMap((h) => h.blocks), root: {} }; // {"setA": {…}, "setB": {…}}: all of them
  return null;
}

function parseMinutes(v) {
  if (typeof v === "number") return Number.isFinite(v) && v > 0 ? v : null;
  if (typeof v === "string") {
    const m = /^\s*(\d+(?:\.\d+)?)\s*(?:min(?:ute)?s?)?\s*$/i.exec(v);
    if (m && parseFloat(m[1]) > 0) return parseFloat(m[1]);
  }
  return null;
}

// Returns { valid:false, error } or { valid:true, data:{examTitle?, blocks}, warnings:[{level,text,details?}], stats }.
// level "content" = something was left out / changed in a way the student should confirm; "info" = purely cosmetic.
function validateExamData(raw, t) {
  const fail = (k, v, extra) => ({ valid: false, error: t(k, v) + (extra ? " " + extra : "") });
  let value;
  const flags = { repaired: false, truncated: false };
  if (typeof raw === "string") {
    const p = tolerantParseJson(raw);
    if (!p.ok) return fail("err.json", { detail: p.detail || "?" });
    value = p.value;
    flags.repaired = p.repaired;
    flags.truncated = p.truncated;
  } else value = raw;
  if (!value || typeof value !== "object") return fail("err.root");
  const found = locateBlocks(value);
  if (!found) return fail("err.blocks");

  const ctx = { defaults: false, blockName: "" };
  const skipped = [];
  const droppedBlocks = [];
  const timeDropped = [];
  let normalized = 0;
  const outBlocks = [];

  found.blocks.forEach((b, bi) => {
    if (!b || typeof b !== "object" || Array.isArray(b)) return;
    let name = toText(pickAlias(b, ["blockname", "name", "title", "block"]));
    if (!name) { name = `Block ${outBlocks.length + 1}`; ctx.defaults = true; }
    ctx.blockName = name;
    const rawQs = pickAlias(b, QUESTION_LIST);
    if (!Array.isArray(rawQs) || rawQs.length === 0) { droppedBlocks.push(name); return; }

    const tlRaw = pickAlias(b, ["timelimitminutes", "timelimit", "timeminutes", "minutes", "durationminutes", "duration"]);
    const tl = tlRaw === undefined ? undefined : parseMinutes(tlRaw);
    if (tlRaw !== undefined && tl === null) timeDropped.push(name);

    const usedIds = new Set();
    const qs = [];
    rawQs.forEach((rq, qi) => {
      const r = normalizeQuestion(rq, qi + 1, usedIds, ctx);
      if (r.err) skipped.push(r); else { qs.push(r.q); if (r.touched) normalized++; }
    });
    if (qs.length === 0) { droppedBlocks.push(name); return; }
    const nb = { ...b, blockName: name, questions: qs };
    if (tl === undefined || tl === null) delete nb.timeLimitMinutes; else nb.timeLimitMinutes = tl;
    outBlocks.push(nb);
  });

  const total = outBlocks.reduce((a, b) => a + b.questions.length, 0);
  const skipLines = skipped.map((s) => t(s.err, s.vars));
  if (total === 0) return fail("err.noneValid", undefined, skipLines.slice(0, 3).join(" "));

  const warnings = [];
  if (flags.truncated) warnings.push({ level: "content", text: t("warn.truncated", { n: total }) });
  else if (flags.repaired) warnings.push({ level: "info", text: t("warn.fixed") });
  if (skipped.length) {
    const shown = skipLines.slice(0, 8);
    if (skipLines.length > 8) shown.push(t("warn.more", { n: skipLines.length - 8 }));
    warnings.push({ level: "content", text: t("warn.skipped", { n: skipped.length }), details: shown });
  }
  droppedBlocks.forEach((name) => warnings.push({ level: "content", text: t("warn.blockDropped", { name }) }));
  timeDropped.forEach((name) => warnings.push({ level: "content", text: t("warn.timeDropped", { name }) }));
  if (normalized) warnings.push({ level: "info", text: t("warn.normalized", { n: normalized }) });
  if (ctx.defaults) warnings.push({ level: "info", text: t("warn.defaults") });

  const data = { blocks: outBlocks };
  const title = toText(pickAlias(found.root, ["examtitle", "title", "name"]));
  if (title) data.examTitle = title;
  return { valid: true, data, warnings, stats: { questions: total, skipped: skipped.length } };
}

function buildQuestionRecipeEs({ size, focusMode, focusValue, difficulty = "mixed" }) {
  const baseName =
    focusMode === "systems" && focusValue ? `Bloque de sistema ${focusValue}`
    : focusMode === "discipline" && focusValue ? `Bloque de ${focusValue}`
    : "Bloque mixto";
  const blockName = difficulty === "mixed" ? baseName : `${baseName} (${RECIPE_PROFILES.es.names[difficulty]})`;
  const diff = buildDifficultySection(size, difficulty, "es");
  const focusLine =
    focusMode === "systems" ? `Todas las preguntas de un solo sistema — ${focusValue || "[SISTEMA]"}. Varía la disciplina evaluada (anatomía/fisiología/patología/farmacología/microbiología).`
    : focusMode === "discipline" ? `Todas las preguntas de una sola disciplina — ${focusValue || "[DISCIPLINA]"}. Varía el sistema evaluado.`
    : "Mezcla sistemas/disciplinas como un bloque real de USMLE: cobertura amplia, sin repetir el mismo sistema en preguntas consecutivas, con énfasis proporcional en los sistemas de alto rendimiento.";
  return `Genera ${size} preguntas de práctica estilo USMLE como ÚNICAMENTE JSON válido (sin markdown ni comentarios), con este esquema (los nombres de los campos van en inglés, exactamente como se muestran):
${PROMPT_SCHEMA_TEXT}

Escribe TODO el contenido (viñetas, opciones, explicaciones, pistas, etc.) en español.
Bloque: "${blockName}", timeLimitMinutes ${recipeTimeLimit(size, difficulty)}.
${diff.text}
keyInfoPhrases: extrae ${diff.phrases} frases diagnósticas clave, copiadas EXACTAMENTE como subcadenas del texto de la viñeta, para el resaltado inteligente.
attendingTip: desglose del razonamiento clínico en 1-2 oraciones, escrito desde la perspectiva de un médico adjunto que guía al estudiante hacia el diagnóstico.
explanation: 3-5 oraciones que analicen por qué la opción correcta es la correcta.
keyLearningPoint: conclusión de alto rendimiento en 1-2 oraciones que resuma la patología/el manejo.
distractorAnalysis: 1 oración concisa por opción incorrecta que explique por qué es incorrecta y a qué condición apuntaría normalmente.
hint: 1 oración corta que dirija la atención a la anomalía central sin revelar la respuesta.
educationalObjective: resumen del concepto central en 1-2 oraciones.
sourceReferences: 1-3 fuentes reales (First Aid, BRS, Pathoma, etc.) — sourceTitle, chapterSection, pageNumber (omítelo si no estás seguro), relevance.
subject: sistema/disciplina específica. Cada id único. difficultyRating: entero de 1 a 5, acorde con el nivel de dificultad indicado. difficultyLabel: exactamente "Easy", "Medium" o "Hard" (en inglés), coherente con difficultyRating. Distribuye correctAnswer de forma uniforme entre las letras de opción usadas (nunca la misma letra más de dos veces seguidas).
Enfoque: ${focusLine}`;
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

// Fisher-Yates shuffle of a plain array (returns a new array).
function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Strips any "— Retest Missed" / "— Retest All" suffix a block may already carry,
// so re-retesting a retest block doesn't chain suffixes indefinitely.
function baseBlockName(name) {
  return name.replace(/\s+—\s+Retest (Missed|All|Flagged)$/i, "");
}

function makeInitialBlockState(block) {
  const hasLimit = typeof block.timeLimitMinutes === "number";
  return {
    status: "pending", // pending | in-progress | done
    answers: {}, // qId -> { selected, struck, flagged, checked, keyInfoOn, tipOpen, hintUsed } — always fresh, never inherited
    notes: {}, // qId -> note text
    // Exactly one of timed / tutor is true. Chosen in the lobby; locked once the block starts.
    timed: false,
    startedAt: null, // wall-clock ms when the block was first started (for elapsed-time analytics)
    timerOff: false, // Timed mode only: the student may switch the countdown off mid-block, never back on
    tutor: true,
    timeLeft: (hasLimit ? block.timeLimitMinutes : 60) * 60,
    score: null,
    currentQuestionIndex: 0, // persisted so a refresh resumes on the same question
    highlights: {}, // qId -> { field -> [{ id, start, end }] } — persisted with the block
  };
}

// Answer-position bias guard (moved out of handleImport so "Save to Library" applies it too):
// if any single letter is the correct answer for >50% of a block's questions (5+ questions),
// shuffle that block's options so students can't pattern-match.
function debiasBlock(b) {
  const counts = {};
  b.questions.forEach((q) => { counts[q.correctAnswer] = (counts[q.correctAnswer] || 0) + 1; });
  const maxShare = Math.max(...Object.values(counts)) / b.questions.length;
  if (b.questions.length >= 5 && maxShare > 0.5) return { ...b, questions: b.questions.map(shuffleQuestionOptions) };
  return b;
}

// ---------------------------------------------------------------------------
// Qbank mixing engine
//   buildMixPool(entries)      merge banks → de-duplicated, id-namespaced question pool
//   mixQbanks(entries, {size}) pool → ONE shuffled block with subjects balanced
// A question's `subject` (system or discipline, e.g. "Cardiovascular", "Pharmacology") is the balancing key.
// ---------------------------------------------------------------------------
const subjectKey = (q) => (q.subject || "").trim().toLowerCase() || "general";

function buildMixPool(entries) {
  const multi = true; // always namespace: even a single-bank subset must map ids back to its library entry (ratings)
  // AI tools reuse ids like "q1" in every bank, so namespace them per bank or answers/notes would collide.
  const tagged = entries.flatMap((e) =>
    e.questions.map((q) => ({ ...q, id: multi ? `${e.id}::${q.id}` : q.id, sourceBank: e.title })));
  const seen = new Set();
  const pool = tagged.filter((q) => {
    const k = hashString(`${q.vignette}\u0001${q.stem}`);
    if (seen.has(k)) return false; // same question present in two banks
    seen.add(k);
    return true;
  });
  const subjects = new Set(pool.map(subjectKey)).size;
  return { pool, subjects, dupes: tagged.length - pool.length };
}

// Interleaves subject buckets so no subject repeats back-to-back (when avoidable) and big subjects
// can't pile up at the end: always draw from one of the fullest remaining buckets, chosen at random.
function spreadBySubject(buckets) {
  const live = buckets.map((b) => ({ key: b.key, items: [...b.items] }));
  const out = [];
  let last = null;
  for (;;) {
    const open = live.filter((b) => b.items.length > 0);
    if (open.length === 0) break;
    const candidates = open.filter((b) => b.key !== last);
    const from = candidates.length ? candidates : open;
    const max = Math.max(...from.map((b) => b.items.length));
    const top = from.filter((b) => b.items.length >= max * 0.75);
    const pick = top[Math.floor(Math.random() * top.length)];
    out.push(pick.items.pop());
    last = pick.key;
  }
  return out;
}

// size = null → use every question (just spread evenly).
// size < pool → equal share per subject (round-robin), so a huge subject can't crowd out the small ones.
// Equal share per subject (round-robin) so a huge subject can't crowd out the small ones.
function pickBySubject(items, n) {
  if (n >= items.length) return [...items];
  const map = new Map();
  items.forEach((q) => { const k = subjectKey(q); if (!map.has(k)) map.set(k, []); map.get(k).push(q); });
  const buckets = shuffleArray([...map.entries()]).map(([key, its]) => ({ key, items: shuffleArray(its) }));
  const out = [];
  while (out.length < n) {
    let moved = false;
    for (const b of buckets) {
      if (out.length >= n) break;
      if (b.items.length) { out.push(b.items.pop()); moved = true; }
    }
    if (!moved) break;
  }
  return out;
}

// Mixer difficulty filters: "all" (as saved), a single tier, or "balanced" (20% Easy / 60% Medium / 20% Hard).
const MIX_DIFFICULTIES = ["all", "easy", "medium", "hard", "balanced"];

function tierCounts(pool) {
  const c = { easy: 0, medium: 0, hard: 0, unrated: 0 };
  pool.forEach((q) => { const tier = questionTier(q); if (tier) c[tier] += 1; else c.unrated += 1; });
  return c;
}

// Largest block that holds the exact 20/60/20 split with the questions on hand.
function maxBalancedSize(c) {
  for (let n = c.easy + c.medium + c.hard; n >= 1; n--) {
    const w = mixedCounts(n);
    if (w.easy <= c.easy && w.medium <= c.medium && w.hard <= c.hard) return n;
  }
  return 0;
}

// How many questions a difficulty filter can offer from this pool (the quantity picker's ceiling).
function mixCapacity(pool, difficulty) {
  const c = tierCounts(pool);
  if (difficulty === "easy" || difficulty === "medium" || difficulty === "hard") return c[difficulty];
  if (difficulty === "balanced") return maxBalancedSize(c);
  return pool.length;
}

// Picks the questions for a mix: filter by difficulty, then take a subject-balanced share of the requested size.
function selectByDifficulty(pool, difficulty, size) {
  if (difficulty === "easy" || difficulty === "medium" || difficulty === "hard") {
    const items = pool.filter((q) => questionTier(q) === difficulty);
    return pickBySubject(items, size && size < items.length ? size : items.length);
  }
  if (difficulty === "balanced") {
    const by = { easy: [], medium: [], hard: [] };
    pool.forEach((q) => { const tier = questionTier(q); if (tier) by[tier].push(q); });
    const rated = by.easy.length + by.medium.length + by.hard.length;
    const n = Math.min(size || maxBalancedSize({ easy: by.easy.length, medium: by.medium.length, hard: by.hard.length }), rated);
    const want = mixedCounts(n);
    const take = { easy: Math.min(want.easy, by.easy.length), medium: Math.min(want.medium, by.medium.length), hard: Math.min(want.hard, by.hard.length) };
    let short = n - take.easy - take.medium - take.hard; // a tier ran dry: backfill from the others, Medium first
    for (const id of ["medium", "easy", "hard"]) {
      const spare = Math.min(short, by[id].length - take[id]);
      take[id] += spare; short -= spare;
    }
    return ["easy", "medium", "hard"].flatMap((id) => pickBySubject(by[id], take[id]));
  }
  return pickBySubject(pool, size && size < pool.length ? size : pool.length);
}

// size = null → use every question the difficulty filter allows (just spread evenly).
function mixQbanks(entries, { size = null, difficulty = "all" } = {}) {
  const { pool } = buildMixPool(entries);
  const chosen = selectByDifficulty(pool, difficulty, size);
  const map = new Map();
  chosen.forEach((q) => { const k = subjectKey(q); if (!map.has(k)) map.set(k, []); map.get(k).push(q); });
  const buckets = shuffleArray([...map.entries()]).map(([key, items]) => ({ key, items: shuffleArray(items) }));
  const n = chosen.length;

  // debiasBlock re-shuffles option order if the merged pool's correct answers cluster on one letter.
  return debiasBlock({
    blockName: entries.length === 1 ? entries[0].title : "Mixed Qbank",
    isMixed: true,
    mixCount: entries.length,
    mixDifficulty: difficulty,
    sourceBanks: entries.map((e) => e.title),
    sourceIds: entries.map((e) => e.id),
    timeLimitMinutes: Math.max(5, Math.round(n * 1.5)),
    questions: spreadBySubject(buckets),
  });
}

// ---------------------------------------------------------------------------
// Local persistence (localStorage)
//   activeSession — the exam in progress (content + answers + timers + position). Removed when
//                   nothing is left to resume, i.e. every block has been completed.
//   qbankLibrary  — [{ id, title, importDate, questions, lastScore, timeLimitMinutes }]
//   oworldPrefs   — { darkMode, lang } (only stored when different from the defaults)
// Every access is wrapped: storage can be disabled (private mode), full, or hold corrupt JSON.
// ---------------------------------------------------------------------------
const LS_SESSION = "activeSession";
const LS_LIBRARY = "qbankLibrary";
const LS_PREFS = "oworldPrefs";
const LS_HISTORY = "sessionHistory";
const LS_REVIEW = "sessionReview:"; // + log id: the full block + answers behind a log, so "Review Exam" can reopen it
const REVIEW_MAX = 25; // full snapshots are large (explanations, labs), so only the newest runs keep one
const HISTORY_MAX = 300; // oldest logs fall off first so the log can never fill localStorage on its own
const SESSION_VERSION = 1;

function lsGet(key) {
  try {
    const raw = window.localStorage.getItem(key);
    return raw == null ? null : JSON.parse(raw);
  } catch (e) { return null; }
}
function lsSet(key, raw) {
  try { window.localStorage.setItem(key, raw); return true; } catch (e) { return false; }
}
function lsRemove(key) {
  try { window.localStorage.removeItem(key); } catch (e) { /* ignore */ }
}

function loadLibrary() {
  const lib = lsGet(LS_LIBRARY);
  if (!Array.isArray(lib)) return [];
  return lib.filter((e) => e && typeof e.id === "string" && typeof e.title === "string" && Array.isArray(e.questions) && e.questions.length > 0);
}

function hasReviewSnapshot(id) { try { return window.localStorage.getItem(LS_REVIEW + id) !== null; } catch (e) { return false; } }
function removeAllReviewSnapshots() {
  try {
    const keys = [];
    for (let i = 0; i < window.localStorage.length; i++) { const k = window.localStorage.key(i); if (k && k.startsWith(LS_REVIEW)) keys.push(k); }
    keys.forEach((k) => window.localStorage.removeItem(k));
  } catch (e) { /* ignore */ }
}
// Past-session logs: independent of the Qbank cards and of the active session, so deleting a card or finishing/removing an exam never touches them.
function loadHistory() {
  const h = lsGet(LS_HISTORY);
  if (!Array.isArray(h)) return [];
  return h.filter((e) => e && typeof e.id === "string" && Number.isFinite(e.total) && Number.isFinite(e.finishedAt)).slice(0, HISTORY_MAX);
}

function loadPrefs() {
  const p = lsGet(LS_PREFS) || {};
  return { darkMode: typeof p.darkMode === "boolean" ? p.darkMode : true, lang: p.lang === "es" ? "es" : "en", textScale: TEXT_STEPS.includes(p.textScale) ? p.textScale : 1 };
}

// Returns a validated session, or null if there is none / it is corrupt / from an incompatible version.
function loadSession() {
  const s = lsGet(LS_SESSION);
  if (!s || s.v !== SESSION_VERSION) return null;
  const ex = s.examData;
  if (!ex || !Array.isArray(ex.blocks) || ex.blocks.length === 0) return null;
  if (!ex.blocks.every((b) => b && Array.isArray(b.questions) && b.questions.length > 0)) return null;
  if (!Array.isArray(s.blockStates) || s.blockStates.length !== ex.blocks.length) return null;
  if (!s.blockStates.every((bs) => bs && typeof bs === "object" && bs.answers && typeof bs.answers === "object")) return null;
  if (s.view !== "lobby" && s.view !== "exam" && s.view !== "import") return null;
  if (!s.blockStates.some((bs) => bs.status !== "done")) return null;

  const idx = Number.isInteger(s.activeBlockIdx) ? s.activeBlockIdx : null;
  const inProg = idx !== null && !!ex.blocks[idx] && s.blockStates[idx].status === "in-progress";
  // A timed block can never be parked on Home (real exam software has no mid-block navigation), so it always reopens in the exam.
  const view = inProg && (s.view === "exam" || !s.blockStates[idx].tutor) ? "exam" : s.view === "import" ? "import" : "lobby";
  // The countdown only runs while the page is open, so time spent away must not count as elapsed time either.
  const away = Math.max(0, Date.now() - (Number(s.savedAt) || Date.now()));
  const blockStates = s.blockStates.map((bs) =>
    bs.status === "in-progress" && bs.startedAt && !bs.pausedAt ? { ...bs, startedAt: bs.startedAt + away } : bs); // pausedAt blocks are re-based on resume
  return { examData: ex, blockStates, history: Array.isArray(s.history) ? s.history : [], activeBlockIdx: idx, view };
}

// Library de-duplication: same title + same question content (not just ids — AI tools reuse "q1, q2…").
function hashString(str) {
  let h = 5381;
  for (let i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
}
function blockSignature(title, questions) {
  // Content only: the correct option's TEXT (not its letter, which changes when answer-bias shuffling re-orders options) and
  // no ids (AI tools reuse "q1, q2…"), so the same block re-imported from the same source is recognised as already stored.
  return hashString(title + "\u0001" + questions.map((q) => {
    const right = (q.options || []).find((o) => o.key === q.correctAnswer);
    return `${q.vignette}\u0002${q.stem}\u0002${right ? right.text : q.correctAnswer}`;
  }).join("\u0003"));
}
function makeLibraryEntry(block) {
  return {
    id: `qb_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    title: block.blockName,
    importDate: Date.now(),
    questions: block.questions,
    lastScore: null, // { correct, total, pct, date } — set when a first-pass attempt of this block is submitted
    timeLimitMinutes: typeof block.timeLimitMinutes === "number" ? block.timeLimitMinutes : null,
  };
}

// Lets any Settings menu reach the app-level "wipe local data" action without prop-drilling.
const DataContext = createContext({ resetAllData: () => {} });

function ResetDataControl({ T }) {
  const { t } = useI18n();
  const { resetAllData } = useContext(DataContext);
  const [confirming, setConfirming] = useState(false);
  const small = { fontFamily: FONT_UI, fontWeight: 600, fontSize: fs(12.5), borderRadius: 6, padding: "7px 10px", cursor: "pointer" };
  return (
    <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 10, marginTop: 10 }}>
      {!confirming ? (
        <button onClick={() => setConfirming(true)} style={{ ...small, width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, background: "transparent", color: T.red, border: `1px solid ${T.red}` }}>
          <Trash2 size={14} /> {t("resetData")}
        </button>
      ) : (
        <div>
          <p style={{ fontFamily: FONT_UI, fontSize: fs(12), color: T.muted, lineHeight: 1.45, margin: "0 0 8px" }}>{t("resetDataWarn")}</p>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => { setConfirming(false); resetAllData(); }} style={{ ...small, flex: 1, background: T.red, color: T.onBlue, border: `1px solid ${T.red}` }}>{t("resetDataConfirm")}</button>
            <button onClick={() => setConfirming(false)} style={{ ...small, background: "transparent", color: T.ink, border: `1px solid ${T.border}` }}>{t("cancel")}</button>
          </div>
        </div>
      )}
    </div>
  );
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
const HINT_YELLOW = "#EAB308"; // hollow marker for "hint used" (reads on light and dark)
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

function useHighlighter(initialMap) {
  // highlightsMap: { [questionId]: { [field]: [{ id, start, end }] } }
  const [highlightsMap, setHighlightsMap] = useState(initialMap || {});
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
// Key-clue support (keyInfoPhrases): finds each phrase as an exact substring of the
// vignette (falling back to a case-insensitive match). Phrases that don't occur are
// dropped, so a model that paraphrased instead of copying never produces a bad highlight.
function getClues(text, phrases) {
  const out = { ranges: [], phrases: [] };
  if (!text || !Array.isArray(phrases)) return out;
  const lower = text.toLowerCase();
  const seen = new Set();
  phrases.forEach((p) => {
    if (typeof p !== "string" || !p.trim()) return;
    let i = text.indexOf(p);
    if (i === -1) i = lower.indexOf(p.toLowerCase());
    if (i === -1 || seen.has(i)) return;
    seen.add(i);
    out.ranges.push({ start: i, end: i + p.length });
    out.phrases.push(text.slice(i, i + p.length));
  });
  return out;
}

// Renders text with user highlights (yellow, click to remove) and, optionally, key-clue
// ranges (clueStyle). Text content is never altered, only wrapped, so highlight offsets stay valid.
function renderHighlightedText(text, ranges, onRemoveHighlight, clues, clueStyle) {
  const hasUser = ranges && ranges.length > 0;
  const hasClues = clues && clues.length > 0;
  if (!hasUser && !hasClues) return text;

  const clamp = (n) => Math.max(0, Math.min(n, text.length));
  const user = (ranges || []).map((r) => ({ ...r, start: clamp(r.start), end: clamp(r.end) })).filter((r) => r.end > r.start);
  const clue = (clues || []).map((r) => ({ start: clamp(r.start), end: clamp(r.end) })).filter((r) => r.end > r.start);

  const bounds = new Set([0, text.length]);
  user.forEach((r) => { bounds.add(r.start); bounds.add(r.end); });
  clue.forEach((r) => { bounds.add(r.start); bounds.add(r.end); });
  const pts = [...bounds].sort((a, b) => a - b);

  const nodes = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const s0 = pts[i];
    const e0 = pts[i + 1];
    if (e0 <= s0) continue;
    const seg = text.slice(s0, e0);
    const u = user.find((r) => r.start <= s0 && r.end >= e0);
    const isClue = clue.some((r) => r.start <= s0 && r.end >= e0);
    if (u) {
      nodes.push(
        <mark
          key={`${u.id}-${s0}`}
          data-highlight-id={u.id}
          title="Click to remove highlight"
          onClick={(e) => { e.stopPropagation(); onRemoveHighlight(u.id); }}
          style={{
            background: HIGHLIGHT_BG, color: HIGHLIGHT_TEXT, borderRadius: 2, padding: "0 1px",
            cursor: "pointer", transition: "background 0.15s ease",
            ...(isClue && clueStyle ? { borderBottom: clueStyle.borderBottom } : {}),
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = HIGHLIGHT_BG_HOVER; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = HIGHLIGHT_BG; }}
        >
          {seg}
        </mark>
      );
    } else if (isClue) {
      nodes.push(<span key={`c-${s0}`} style={{ borderRadius: 2, padding: "0 1px", ...clueStyle }}>{seg}</span>);
    } else {
      nodes.push(seg);
    }
  }
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
        background: t.bg, color: t.fg, fontFamily: FONT_UI, fontSize: fs(11), fontWeight: 600,
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
        fontFamily: FONT_UI, fontWeight: 600, fontSize: fs(14), color: disabled ? "#FFFFFF" : T.onBlue,
        background: disabled ? "#9FB3C4" : T.blue, border: "none", borderRadius: 6,
        padding: "10px 18px", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
        whiteSpace: "nowrap", cursor: disabled ? "not-allowed" : "pointer", ...style,
      }}
      onMouseEnter={(e) => { if (!disabled) e.currentTarget.style.background = T.blueDeep; }}
      onMouseLeave={(e) => { if (!disabled) e.currentTarget.style.background = T.blue; }}
    >
      {Icon && <Icon size={16} style={{ flexShrink: 0 }} />}
      {children}
    </button>
  );
}

function GhostButton({ children, onClick, icon: Icon, style, disabled, title, T = LIGHT }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={title}
      style={{
        fontFamily: FONT_UI, fontWeight: 600, fontSize: fs(13), color: disabled ? "#A7B3B6" : T.ink,
        background: "transparent", border: `1px solid ${T.border}`, borderRadius: 6,
        padding: "9px 14px", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 7,
        whiteSpace: "nowrap", cursor: disabled ? "not-allowed" : "pointer", ...style,
      }}
    >
      {Icon && <Icon size={15} style={{ flexShrink: 0 }} />}
      {children}
    </button>
  );
}

function SettingsMenu({ darkMode, setDarkMode, T, iconOnly = false }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);
  const [place, setPlace] = useState({ right: 0 });
  // When the header wraps (phones), the button can sit near the left edge. Right-align the dropdown when it fits,
  // else open it to the right, else pin it inside the viewport, so it is never clipped off-screen.
  function toggle() {
    if (!open && wrapRef.current) {
      const r = wrapRef.current.getBoundingClientRect();
      const vw = window.innerWidth;
      const W = Math.min(240, vw - 16);
      if (r.right - W >= 8) setPlace({ right: 0 });
      else if (r.left + W <= vw - 8) setPlace({ left: 0 });
      else setPlace({ left: 8 - r.left });
    }
    setOpen((v) => !v);
  }
  return (
    <div ref={wrapRef} style={{ position: "relative", flexShrink: 0 }}>
      <button
        onClick={toggle}
        style={{
          display: "flex", alignItems: "center", gap: 6, background: "transparent", whiteSpace: "nowrap",
          border: `1px solid ${T.border}`, borderRadius: 6, padding: iconOnly ? "12px 13px" : "9px 14px", cursor: "pointer",
          fontFamily: FONT_UI, fontWeight: 600, fontSize: fs(13), color: T.ink,
        }}
        title={iconOnly ? t("settings") : undefined}
        aria-label={t("settings")}
      >
        <SettingsIcon size={15} style={{ flexShrink: 0 }} /> {!iconOnly && t("settings")}
      </button>
      {open && (
        <div style={{
          position: "absolute", top: 42, ...place, background: T.card, border: `1px solid ${T.border}`,
          borderRadius: 8, padding: 14, width: "min(240px, calc(100vw - 16px))", boxSizing: "border-box", zIndex: 70, boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
        }}>
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: FONT_UI, fontSize: fs(13), cursor: "pointer", color: T.ink }}>
            <input type="checkbox" checked={darkMode} onChange={() => setDarkMode((v) => !v)} />
            {t("dark")}
          </label>
          <LangSelect T={T} />
          <TextSizeControl T={T} />
          <ResetDataControl T={T} />
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Export / share a block
//   serializeExamBlocks(blocks, title)  one block or an array (a bundle) -> { json, fileName }   pretty-printed, re-importable
//   exportExamBlock(blockOrBlocks, opts) Web Share (AirDrop on Apple devices) -> .json download fallback
//   ExportShareButton                 the "Export / Share" button used on library and lobby block cards
// The file is the same shape the importer reads ({ examTitle, blocks: [...] }), so a classmate can load it as-is.
// ---------------------------------------------------------------------------
function exportFileName(title) {
  const base = String(title || "")
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // drop accents
    .replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60);
  return `${base || "oworld-block"}.json`;
}

// Question content only. The student's own self-ratings (meta) and the mixer's bookkeeping (sourceBank) stay private.
function exportableQuestion(q) {
  const { meta, sourceBank, ...rest } = q || {};
  return rest;
}

const BUNDLE_TITLE = "Oworld Shared Bundle";

// One or many blocks -> pretty-printed { examTitle, blocks: [...] }. Several blocks become one bundle file; every block
// keeps its own name, time limit and questions, so the importer can turn each back into its own library card.
function serializeExamBlocks(blocks, examTitle) {
  const list = (Array.isArray(blocks) ? blocks : [blocks]).filter(Boolean);
  if (list.length === 0) throw new Error("nothing to export");
  const bundle = list.length > 1;
  const title = examTitle || (bundle ? BUNDLE_TITLE : list[0].blockName) || "Oworld block";
  const payload = {
    examTitle: title,
    blocks: list.map((b, i) => ({
      blockName: b.blockName || `Block ${i + 1}`,
      ...(typeof b.timeLimitMinutes === "number" ? { timeLimitMinutes: b.timeLimitMinutes } : {}),
      questions: (b.questions || []).map(exportableQuestion),
    })),
  };
  return { json: JSON.stringify(payload, null, 2), fileName: exportFileName(bundle ? title : (list[0].blockName || title)) };
}
const serializeExamBlock = (block, examTitle) => serializeExamBlocks([block], examTitle);

// Plain file download: works on every desktop browser, and on mobile browsers without file sharing.
function downloadBlob(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = fileName; a.rel = "noopener"; a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 4000); // give the browser time to start the download
}

// Resolves to "shared" | "downloaded" | "cancelled" | "error" — it never rejects, so callers need no try/catch.
// Everything before navigator.share() is synchronous on purpose: browsers only allow the share sheet while the
// click's user activation is still live, so no await may sit between the tap and the share call.
async function exportExamBlock(blockOrBlocks, { examTitle, shareTitle, shareText } = {}) {
  let json, fileName;
  try { ({ json, fileName } = serializeExamBlocks(blockOrBlocks, examTitle)); } catch (e) { return "error"; }

  // 1. Native share sheet (AirDrop, Messages, Mail, Drive…), file sharing only. Some browsers reject
  //    application/json files, so a text/plain copy with the same .json name is tried second.
  try {
    if (typeof navigator !== "undefined" && typeof navigator.share === "function" && typeof navigator.canShare === "function" && typeof File === "function") {
      for (const type of ["application/json", "text/plain"]) {
        const file = new File([json], fileName, { type });
        if (!navigator.canShare({ files: [file] })) continue;
        await navigator.share({ files: [file], title: shareTitle || fileName, text: shareText || "" });
        return "shared";
      }
    }
  } catch (err) {
    // Closing the share sheet rejects with AbortError. That's a choice, not a failure: stay quiet.
    if (err && err.name === "AbortError") return "cancelled";
    // Anything else (NotAllowedError, DataError, an unsupported file type…): fall through to the download.
  }

  // 2. Fallback: save the .json locally.
  try {
    downloadBlob(new Blob([json], { type: "application/json" }), fileName);
    return "downloaded";
  } catch (e) {
    return "error";
  }
}

// getBlock() -> { block, examTitle }; called at click time so it always exports the current content.
function ExportShareButton({ getBlock, T, style, fullWidth = false, wrapStyle }) {
  const { t } = useI18n();
  const [state, setState] = useState("idle"); // idle | busy | shared | downloaded | error
  const timer = useRef(null);
  const mounted = useRef(true);
  useEffect(() => () => { mounted.current = false; clearTimeout(timer.current); }, []);

  async function onClick(e) {
    e.stopPropagation();
    if (state === "busy") return;
    setState("busy");
    let result = "error";
    try {
      const { block, examTitle } = getBlock();
      result = await exportExamBlock(block, { examTitle, shareTitle: block.blockName, shareText: t("exportShareText", { name: block.blockName || examTitle || "" }) });
    } catch (err) { result = "error"; }
    if (!mounted.current) return;
    if (result === "cancelled") { setState("idle"); return; }
    setState(result);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => { if (mounted.current) setState("idle"); }, 2800);
  }

  const label = state === "shared" ? t("exportShared") : state === "downloaded" ? t("exportDownloaded") : state === "error" ? t("exportFailed") : t("exportShare");
  const Icon = state === "shared" || state === "downloaded" ? Check : state === "error" ? AlertTriangle : Share2;
  const color = state === "error" ? T.red : state === "shared" || state === "downloaded" ? T.green : undefined;
  return (
    <span aria-live="polite" style={{ display: fullWidth ? "flex" : "inline-flex", ...wrapStyle }}>
      <GhostButton T={T} icon={Icon} onClick={onClick} disabled={state === "busy"} style={{ ...(fullWidth ? { width: "100%" } : {}), ...(color ? { color, borderColor: color } : {}), ...style }}>
        <span title={t("exportTitle")}>{label}</span>
      </GhostButton>
    </span>
  );
}

// ---------------------------------------------------------------------------
// Qbank library panel — saved blocks; start one, or tick several to run them as a queue
// ---------------------------------------------------------------------------
function QbankLibraryPanel({ library, onLaunch, onMix, onDelete, onRename, resumeId, onResume, T }) {
  const { t, lang } = useI18n();
  const [queue, setQueue] = useState([]); // entry ids in the order they were ticked
  const phone = useViewport().w < 640;
  const liveQueue = queue.filter((id) => library.some((e) => e.id === id));
  const titleOf = (id) => library.find((e) => e.id === id)?.title || "";

  // Edit Selected: walks through the ticked Qbanks one at a time (Enter / check saves and moves on, Esc / X skips).
  const [renameQueue, setRenameQueue] = useState([]);
  const [renameTotal, setRenameTotal] = useState(0);
  const [renameVal, setRenameVal] = useState("");
  const renameId = renameQueue[0] || null;
  const advanceRename = (rest) => { setRenameQueue(rest); if (rest.length) setRenameVal(titleOf(rest[0])); };
  const startEdit = () => {
    if (!liveQueue.length) return;
    setConfirmDel(false);
    setRenameQueue([...liveQueue]); setRenameTotal(liveQueue.length); setRenameVal(titleOf(liveQueue[0]));
  };
  const commitRename = () => {
    const name = renameVal.trim();
    if (!name || !renameId) return;
    onRename(renameId, name);
    advanceRename(renameQueue.slice(1));
  };
  const skipRename = () => advanceRename(renameQueue.slice(1));

  // Delete Selected: one confirmation for the whole selection.
  const [confirmDel, setConfirmDel] = useState(false);
  const deleteSelected = () => { liveQueue.forEach((id) => onDelete(id)); setQueue([]); setConfirmDel(false); };

  // Share / Export Selected: every ticked Qbank goes into ONE bundle file ({ examTitle, blocks: [...] }), so a single share
  // sheet / download carries them all. The block boundaries stay intact: whoever imports the file gets each block back
  // as its own library card. One ticked Qbank exports as before (titled after that Qbank).
  const [exp, setExp] = useState(null); // { phase: "running" | "done", n, result? }
  const alive = useRef(true);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
  async function startExport() {
    if (!liveQueue.length || (exp && exp.phase === "running")) return;
    const entries = liveQueue.map((id) => library.find((e) => e.id === id)).filter(Boolean);
    if (!entries.length) return;
    const blocks = entries.map((e) => ({ blockName: e.title, timeLimitMinutes: e.timeLimitMinutes, questions: e.questions }));
    const title = entries.length === 1 ? entries[0].title : BUNDLE_TITLE;
    setExp({ phase: "running", n: entries.length });
    // No await before this call: the share sheet needs the tap's user activation.
    const r = await exportExamBlock(blocks.length === 1 ? blocks[0] : blocks, {
      examTitle: title, shareTitle: title, shareText: t("exportShareText", { name: title }) });
    if (!alive.current) return;
    setExp(r === "cancelled" ? null : { phase: "done", n: entries.length, result: r }); // closing the share sheet is not an error
  }
  const [mixSize, setMixSize] = useState("all");
  const [mode, setMode] = useState("timed"); // how the next Load starts: "timed" | "tutor"
  const [mixDiff, setMixDiff] = useState("all"); // all | easy | medium | hard | balanced
  const mixInfo = useMemo(
    () => (liveQueue.length >= 1 ? buildMixPool(liveQueue.map((id) => library.find((e) => e.id === id))) : null),
    [liveQueue.join("|"), library]);
  const tiers = useMemo(() => (mixInfo ? tierCounts(mixInfo.pool) : { easy: 0, medium: 0, hard: 0, unrated: 0 }), [mixInfo]);
  const diffAvailable = (id) => (id === "all" ? true : id === "balanced" ? maxBalancedSize(tiers) > 0 : tiers[id] > 0);
  const effDiff = mixInfo && diffAvailable(mixDiff) ? mixDiff : "all"; // a tier that vanished from the queue falls back to All
  const poolSize = mixInfo ? mixCapacity(mixInfo.pool, effDiff) : 0;
  const mixSizes = [5, 10, 15, 20, 25, 30, 35, 40].filter((n) => n < poolSize); // presets in steps of 5, up to 40
  const [customMix, setCustomMix] = useState("");
  const effSize = mixInfo && mixSize !== "all" && Number(mixSize) >= 1 && Number(mixSize) < poolSize ? Number(mixSize) : null;
  const blockCount = effSize || poolSize;
  const toggle = (id) => setQueue((q) => (q.includes(id) ? q.filter((x) => x !== id) : [...q, id]));
  const fmtDate = (ms) => new Date(ms).toLocaleDateString(lang === "es" ? "es" : "en-US", { year: "numeric", month: "short", day: "numeric" });

  return (
    <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 24, marginBottom: 20 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
        <BookOpen size={17} color={T.ink} />
        <span style={{ fontFamily: FONT_UI, fontWeight: 600, fontSize: fs(14), color: T.ink }}>{t("libTitle")}</span>
        <Pill T={T} tone="muted">{t("libCount", { n: library.length })}</Pill>
        {/* Contextual actions: only present while at least one Qbank is ticked */}
        {liveQueue.length > 0 && (
          <div role="toolbar" aria-label={t("libTitle")} style={{ marginLeft: "auto", display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "flex-end" }}>
            {[
              { id: "share", icon: Share2, label: t("libShareSel"), onClick: startExport, disabled: !!exp && exp.phase !== "done" },
              { id: "edit", icon: Pencil, label: t("libEditSel"), onClick: startEdit, disabled: false },
              { id: "delete", icon: Trash2, label: t("libDeleteSel"), onClick: () => { setRenameQueue([]); setConfirmDel(true); }, disabled: false, danger: true },
            ].map((a) => (
              <GhostButton key={a.id} T={T} icon={a.icon} onClick={a.onClick} disabled={a.disabled} title={`${a.label} (${liveQueue.length})`}
                style={{ ...(a.danger ? { color: T.red, borderColor: T.red } : {}), ...(phone ? { padding: "11px 12px" } : {}) }}>
                {!phone && a.label}
              </GhostButton>
            ))}
          </div>
        )}
      </div>

      {resumeId && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap", padding: "10px 14px", marginBottom: 12, borderRadius: 8, border: `1px solid ${T.amber}`, background: T.amberLight }}>
          <span style={{ fontFamily: FONT_UI, fontSize: fs(13), color: T.ink }}>
            <strong style={{ color: T.amber }}>{t("sessionInProgress")}:</strong> {titleOf(resumeId)}
          </span>
          <PrimaryButton T={T} onClick={onResume} icon={Play}>{t("resumeSession")}</PrimaryButton>
        </div>
      )}

      {confirmDel && (
        <div role="alertdialog" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap", padding: "10px 14px", marginBottom: 12, borderRadius: 8, border: `1px solid ${T.red}`, background: T.redLight }}>
          <span style={{ fontFamily: FONT_UI, fontSize: fs(13), fontWeight: 600, color: T.red }}>{t("libDeleteSelQ", { n: liveQueue.length })}</span>
          <span style={{ display: "inline-flex", gap: 8 }}>
            <button onClick={deleteSelected} style={{ fontFamily: FONT_UI, fontWeight: 700, fontSize: fs(12.5), padding: "7px 12px", borderRadius: 6, border: `1px solid ${T.red}`, background: T.red, color: "#fff", cursor: "pointer" }}>{t("libDelete")}</button>
            <GhostButton T={T} onClick={() => setConfirmDel(false)}>{t("cancel")}</GhostButton>
          </span>
        </div>
      )}

      {exp && (
        <div role="status" aria-live="polite" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap", padding: "10px 14px", marginBottom: 12, borderRadius: 8, border: `1px solid ${exp.result === "error" ? T.red : T.blue}`, background: exp.result === "error" ? T.redLight : T.blueLight }}>
          <span style={{ fontFamily: FONT_UI, fontSize: fs(13), color: T.ink }}>
            {exp.phase === "running" && t("libExporting", { n: exp.n })}
            {exp.phase === "done" && (exp.result === "shared" ? t("libExportShared", { n: exp.n }) : exp.result === "downloaded" ? t("libExportDownloaded", { n: exp.n }) : t("libExportFailed"))}
          </span>
          {exp.phase === "done" && <GhostButton T={T} onClick={() => setExp(null)}>{t("close")}</GhostButton>}
        </div>
      )}

      {library.length === 0 ? (
        <p style={{ fontFamily: FONT_UI, fontSize: fs(13.5), color: T.muted, lineHeight: 1.6, margin: 0 }}>{t("libEmpty")}</p>
      ) : (
        <>
          <div style={{ display: "grid", gap: 8 }}>
            {library.map((e) => {
              const pos = liveQueue.indexOf(e.id);
              const ls = e.lastScore;
              return (
                <div key={e.id} onClick={() => { if (renameId !== e.id) toggle(e.id); }} style={{
                  display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", padding: "12px 14px", borderRadius: 8, cursor: "pointer",
                  border: `1px solid ${pos >= 0 ? T.blue : T.border}`, background: pos >= 0 ? T.blueLight : "transparent",
                }}>
                  <input type="checkbox" checked={pos >= 0} onChange={() => toggle(e.id)} onClick={(ev) => ev.stopPropagation()} aria-label={e.title} style={{ cursor: "pointer", width: 18, height: 18 }} />
                  <div style={{ flex: 1, minWidth: 180 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      {renameId === e.id ? (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 6, flex: 1, minWidth: 200 }}>
                          <input
                            autoFocus
                            value={renameVal}
                            maxLength={120}
                            aria-label={t("libRename")}
                            onChange={(ev) => setRenameVal(ev.target.value)}
                            onFocus={(ev) => ev.target.select()}
                            onKeyDown={(ev) => { if (ev.key === "Enter") commitRename(); else if (ev.key === "Escape") skipRename(); }}
                            style={{ flex: 1, minWidth: 0, fontFamily: FONT_UI, fontWeight: 700, fontSize: fs(14.5), color: T.ink, background: T.paper, border: `1px solid ${T.blue}`, borderRadius: 6, padding: "5px 8px", outline: "none" }}
                          />
                          <button onClick={commitRename} disabled={!renameVal.trim()} title={t("libRenameSave")} aria-label={t("libRenameSave")}
                            style={{ background: "transparent", border: `1px solid ${T.blue}`, borderRadius: 6, cursor: renameVal.trim() ? "pointer" : "not-allowed", color: T.blue, padding: 5, display: "flex", opacity: renameVal.trim() ? 1 : 0.4 }}>
                            <Check size={15} />
                          </button>
                          <button onClick={skipRename} title={t("cancel")} aria-label={t("cancel")}
                            style={{ background: "transparent", border: `1px solid ${T.border}`, borderRadius: 6, cursor: "pointer", color: T.muted, padding: 5, display: "flex" }}>
                            <X size={15} />
                          </button>
                          {renameTotal > 1 && <Pill T={T} tone="muted">{t("libEditing", { i: renameTotal - renameQueue.length + 1, n: renameTotal })}</Pill>}
                        </span>
                      ) : (
                        <span style={{ fontFamily: FONT_UI, fontWeight: 700, fontSize: fs(14.5), color: T.ink }}>{e.title}</span>
                      )}
                      {pos >= 0 && <Pill T={T} tone="blue">#{pos + 1}</Pill>}
                      {resumeId === e.id && <Pill T={T} tone="amber">{t("inProgressTag")}</Pill>}
                      {ls
                        ? <Pill T={T} tone={ls.pct >= 70 ? "green" : "red"}>{t("libCompleted", { pct: ls.pct, c: ls.correct, t: ls.total })}</Pill>
                        : resumeId !== e.id && <Pill T={T} tone="muted">{t("libNoScore")}</Pill>}
                    </div>
                    <span style={{ fontFamily: FONT_MONO, fontSize: fs(12), color: T.muted }}>
                      {t("libMeta", { q: e.questions.length, d: fmtDate(e.importDate) })}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginTop: 14 }}>
            <span style={{ fontFamily: FONT_UI, fontSize: fs(12.5), color: T.muted, maxWidth: 440, lineHeight: 1.5 }}>{t("libSelectHint")}</span>
          </div>
          {mixInfo && (
            <div style={{ marginTop: 14, padding: "14px 16px", borderRadius: 8, border: `1px dashed ${T.blue}`, display: "flex", flexWrap: "wrap", alignItems: "center", gap: 14 }}>
              <div style={{ flex: 1, minWidth: 220 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
                  <Shuffle size={15} color={T.blue} />
                  <span style={{ fontFamily: FONT_UI, fontWeight: 700, fontSize: fs(13.5), color: T.ink }}>{liveQueue.length >= 2 ? t("libMixTitle") : t("libCountTitle")}</span>
                  <Pill T={T} tone="blue">{t("libMixPool", { q: mixInfo.pool.length, s: mixInfo.subjects })}</Pill>
                  {mixInfo.dupes > 0 && <Pill T={T} tone="muted">{t("libMixDupes", { d: mixInfo.dupes })}</Pill>}
                </div>
                <span style={{ fontFamily: FONT_UI, fontSize: fs(12.5), color: T.muted, lineHeight: 1.5 }}>{liveQueue.length >= 2 ? t("libMixHint") : t("libCountHint")}</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, minWidth: 220 }}>
                <span style={{ fontFamily: FONT_UI, fontSize: fs(12.5), color: T.muted }}>{t("diffMode")}</span>
                <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 6 }} role="group" aria-label={t("diffMode")}>
                  {MIX_DIFFICULTIES.map((id) => {
                    const on = effDiff === id;
                    const ok = diffAvailable(id);
                    const count = id === "all" ? mixInfo.pool.length : id === "balanced" ? null : tiers[id];
                    return (
                      <button key={id} aria-pressed={on} disabled={!ok} onClick={() => { setMixDiff(id); setMixSize("all"); setCustomMix(""); }}
                        style={{ fontFamily: FONT_UI, fontSize: fs(12.5), fontWeight: 600, padding: "5px 10px", borderRadius: 6, cursor: ok ? "pointer" : "not-allowed", opacity: ok ? 1 : 0.4,
                          background: on ? T.blue : "transparent", color: on ? T.onBlue : T.ink, border: `1px solid ${on ? T.blue : T.border}` }}>
                        {id === "all" ? t("mixDiffAll") : id === "balanced" ? t("mixBalanced") : t("dl." + id)}{count !== null ? ` (${count})` : ""}
                      </button>
                    );
                  })}
                </div>
                {effDiff === "balanced" && (() => { const w = mixedCounts(blockCount); return (
                  <span style={{ fontFamily: FONT_UI, fontSize: fs(12), color: T.muted, lineHeight: 1.45 }}>{t("mixBalancedHint", { e: w.easy, m: w.medium, h: w.hard })}</span>
                ); })()}
                {effDiff !== "all" && tiers.unrated > 0 && (
                  <span style={{ fontFamily: FONT_UI, fontSize: fs(12), color: T.muted, lineHeight: 1.45 }}>{t("mixUnrated", { n: tiers.unrated })}</span>
                )}
                <span style={{ fontFamily: FONT_UI, fontSize: fs(12.5), color: T.muted, marginTop: 4 }}>{t("libMixSize")}</span>
                <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 6 }} role="group" aria-label={t("libMixSize")}>
                  {mixSizes.map((n) => (
                    <button key={n} aria-pressed={effSize === n} onClick={() => { setMixSize(n); setCustomMix(""); }}
                      style={{ fontFamily: FONT_MONO, fontSize: fs(12.5), fontWeight: 600, padding: "5px 10px", borderRadius: 6, cursor: "pointer",
                        background: effSize === n ? T.blue : "transparent", color: effSize === n ? T.onBlue : T.ink, border: `1px solid ${effSize === n ? T.blue : T.border}` }}>
                      {n}
                    </button>
                  ))}
                  <button aria-pressed={effSize === null} onClick={() => { setMixSize("all"); setCustomMix(""); }}
                    style={{ fontFamily: FONT_MONO, fontSize: fs(12.5), fontWeight: 600, padding: "5px 10px", borderRadius: 6, cursor: "pointer",
                      background: effSize === null ? T.blue : "transparent", color: effSize === null ? T.onBlue : T.ink, border: `1px solid ${effSize === null ? T.blue : T.border}` }}>
                    {t("libMixMax", { n: poolSize })}
                  </button>
                </div>
                <label style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: FONT_UI, fontSize: fs(12.5), color: T.muted }}>
                  {t("libMixCustom")}
                  <input
                    type="text"
                    inputMode="numeric"
                    value={customMix}
                    placeholder={t("libMixCustomHint", { n: poolSize })}
                    aria-label={t("libMixCustom")}
                    onChange={(ev) => {
                      const v = ev.target.value.replace(/\D/g, "").slice(0, 4);
                      setCustomMix(v);
                      if (v === "") return;
                      const n = Math.min(Math.max(parseInt(v, 10), 1), poolSize);
                      setMixSize(n >= poolSize ? "all" : n);
                    }}
                    onBlur={() => { if (customMix !== "") setCustomMix(String(Math.min(Math.max(parseInt(customMix, 10) || 1, 1), poolSize))); }}
                    style={{ width: 84, fontFamily: FONT_MONO, fontSize: fs(13), padding: "6px 8px", borderRadius: 6, border: `1px solid ${T.border}`, background: T.paper, color: T.ink }}
                  />
                </label>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-start" }}>
                <div role="group" aria-label={t("modeLabel")} style={{ display: "inline-flex", border: `1px solid ${T.border}`, borderRadius: 6, overflow: "hidden" }}>
                  {[["timed", t("timed"), Clock], ["tutor", t("tutorShort"), Lightbulb]].map(([m, label, Ic]) => (
                    <button key={m} aria-pressed={mode === m} onClick={() => setMode(m)} style={{
                      display: "flex", alignItems: "center", gap: 6, fontFamily: FONT_UI, fontWeight: 700, fontSize: fs(12.5), padding: "8px 14px", border: "none",
                      cursor: "pointer", background: mode === m ? T.blue : "transparent", color: mode === m ? T.onBlue : T.ink,
                    }}><Ic size={14} /> {label}</button>
                  ))}
                </div>
                <span style={{ fontFamily: FONT_UI, fontSize: fs(11.5), color: T.muted, lineHeight: 1.4, maxWidth: 300 }}>{mode === "tutor" ? t("modeTutorHint") : t("modeTimedHint")}</span>
                <PrimaryButton T={T} onClick={() => onMix(liveQueue, effSize, effDiff, mode)} icon={Shuffle} disabled={blockCount < 1}>
                  {liveQueue.length >= 2
                    ? (blockCount === 1 ? t("libMixOne") : t("libMix", { n: blockCount }))
                    : (blockCount === 1 ? t("libLoadOne") : t("libLoad", { n: blockCount }))}
                </PrimaryButton>
              </div>
            </div>
          )}
        </>
      )}
      <p style={{ fontFamily: FONT_UI, fontSize: fs(11.5), color: T.muted, margin: "14px 0 0" }}>{t("libLocalNote")}</p>
    </div>
  );
}


// ---------------------------------------------------------------------------
// Past Sessions: one row per finished block, newest first. Rows are snapshots, so they stay valid after a Qbank is renamed or deleted.
// ---------------------------------------------------------------------------
function sessionTitle(h, t) {
  if (h.isRetest) return `${blockLabel(h, t)} · ${t("histQ", { n: h.total })}`;
  const diff = h.mixDifficulty && h.mixDifficulty !== "all" ? ` · ${t(h.mixDifficulty === "balanced" ? "mixBalancedShort" : "dl." + h.mixDifficulty)}` : "";
  if (h.isMixed && h.mixCount > 1) return t("histMixed", { n: h.mixCount, q: h.total }) + diff;
  return t("histNamed", { name: h.blockName, q: h.total }) + diff;
}

function SessionHistoryPanel({ history, onDelete, onClear, onReview, T }) {
  const { t, lang } = useI18n();
  const phone = useViewport().w < 640;
  const [sel, setSel] = useState([]); // ticked log ids
  const [confirmDel, setConfirmDel] = useState(false);
  const liveSel = sel.filter((id) => history.some((e) => e.id === id));
  const toggleSel = (id) => setSel((q) => (q.includes(id) ? q.filter((x) => x !== id) : [...q, id]));
  const deleteSelected = () => { liveSel.forEach((id) => onDelete(id)); setSel([]); setConfirmDel(false); };
  const ordered = useMemo(() => [...history].sort((a, b) => b.finishedAt - a.finishedAt), [history]); // newest first
  const fmt = (ms) => new Date(ms).toLocaleString(lang === "es" ? "es" : "en-US", { year: "numeric", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
  const kindTone = { bank: "blue", custom: "amber", retest: "muted" };
  const kindKey = { bank: "histKindBank", custom: "histKindCustom", retest: "histKindRetest" };
  return (
    <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 24, marginBottom: 20 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
        <ClipboardList size={17} color={T.ink} />
        <span style={{ fontFamily: FONT_UI, fontWeight: 600, fontSize: fs(14), color: T.ink }}>{t("histTitle")}</span>
        <Pill T={T} tone="muted">{history.length}</Pill>
        {history.length > 0 && (
          <div role="toolbar" aria-label={t("histTitle")} style={{ marginLeft: "auto", display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "flex-end" }}>
            <GhostButton T={T} onClick={() => { setConfirmDel(false); setSel(liveSel.length === history.length ? [] : history.map((e) => e.id)); }}>
              {liveSel.length === history.length ? t("histDeselect") : t("histSelectAll")}
            </GhostButton>
            {liveSel.length > 0 && (
              <GhostButton T={T} icon={Trash2} onClick={() => setConfirmDel(true)} title={`${t("libDeleteSel")} (${liveSel.length})`}
                style={{ color: T.red, borderColor: T.red, ...(phone ? { padding: "11px 12px" } : {}) }}>
                {!phone && t("libDeleteSel")}
              </GhostButton>
            )}
          </div>
        )}
      </div>

      {confirmDel && liveSel.length > 0 && (
        <div role="alertdialog" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap", padding: "10px 14px", marginBottom: 12, borderRadius: 8, border: `1px solid ${T.red}`, background: T.redLight }}>
          <span style={{ fontFamily: FONT_UI, fontSize: fs(13), fontWeight: 600, color: T.red }}>{t("histDeleteSelQ", { n: liveSel.length })}</span>
          <span style={{ display: "inline-flex", gap: 8 }}>
            <button onClick={deleteSelected} style={{ fontFamily: FONT_UI, fontWeight: 700, fontSize: fs(12.5), padding: "7px 12px", borderRadius: 6, border: `1px solid ${T.red}`, background: T.red, color: "#fff", cursor: "pointer" }}>{t("libDelete")}</button>
            <GhostButton T={T} onClick={() => setConfirmDel(false)}>{t("cancel")}</GhostButton>
          </span>
        </div>
      )}

      {history.length === 0 ? (
        <p style={{ fontFamily: FONT_UI, fontSize: fs(13.5), color: T.muted, lineHeight: 1.6, margin: 0 }}>{t("histEmpty")}</p>
      ) : (
        <div style={{ display: "grid", gap: 8 }}>
          {ordered.map((h) => {
            const label = sessionTitle(h, t);
            const canReview = hasReviewSnapshot(h.id);
            const picked = liveSel.includes(h.id);
            return (
              <div key={h.id} onClick={() => toggleSel(h.id)} style={{
                display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", padding: "12px 14px", borderRadius: 8, cursor: "pointer",
                border: `1px solid ${picked ? T.blue : T.border}`, background: picked ? T.blueLight : "transparent",
              }}>
                <input type="checkbox" checked={picked} onChange={() => toggleSel(h.id)} onClick={(ev) => ev.stopPropagation()} aria-label={label} style={{ cursor: "pointer", width: 18, height: 18 }} />
                <div style={{ flex: 1, minWidth: 180 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <span style={{ fontFamily: FONT_UI, fontWeight: 700, fontSize: fs(14.5), color: T.ink }}>{label}</span>
                    <Pill T={T} tone={kindTone[h.kind] || "muted"}>{t(kindKey[h.kind] || "histKindCustom")}</Pill>
                    <Pill T={T} tone="muted">{h.mode === "tutor" ? t("tutorShort") : t("timed")}</Pill>
                    <Pill T={T} tone={h.pct >= 70 ? "green" : "red"}>{h.pct}% ({h.correct}/{h.total})</Pill>
                  </div>
                  <span style={{ fontFamily: FONT_MONO, fontSize: fs(12), color: T.muted }}>
                    {t("histDone", { d: fmt(h.finishedAt) })}{h.elapsedSec ? ` · ${fmtTime(h.elapsedSec)}` : ""}
                  </span>
                  {Array.isArray(h.sourceBanks) && h.sourceBanks.length > 0 && h.kind !== "bank" && (
                    <div style={{ fontFamily: FONT_UI, fontSize: fs(12), color: T.muted, marginTop: 2 }}>{t("histSources", { s: h.sourceBanks.join(", ") })}</div>
                  )}
                </div>
                {canReview
                  ? <PrimaryButton T={T} icon={ClipboardList} onClick={(ev) => { ev.stopPropagation(); onReview(h.id); }}>{t("histReview")}</PrimaryButton>
                  : <span style={{ fontFamily: FONT_UI, fontSize: fs(12), color: T.muted }}>{t("histNoReview")}</span>}
              </div>
            );
          })}
        </div>
      )}
      <p style={{ fontFamily: FONT_UI, fontSize: fs(11.5), color: T.muted, margin: "14px 0 0", lineHeight: 1.5 }}>{t("histNote")}</p>
    </div>
  );
}

// Segmented switch above the Qbank Library: Library | Past Sessions (N).
function LibraryTabs({ tab, setTab, count, T }) {
  const { t } = useI18n();
  return (
    <div style={{ display: "flex", justifyContent: "center", marginBottom: 14 }}>
    <div role="tablist" style={{ display: "inline-flex", border: `1px solid ${T.border}`, borderRadius: 8, overflow: "hidden" }}>
      {[["library", t("tabLibrary"), BookOpen], ["history", t("tabHistory"), ClipboardList]].map(([id, label, Ic]) => (
        <button key={id} role="tab" aria-selected={tab === id} onClick={() => setTab(id)} style={{
          display: "flex", alignItems: "center", gap: 6, fontFamily: FONT_UI, fontWeight: 700, fontSize: fs(12.5), padding: "9px 16px", border: "none",
          cursor: "pointer", background: tab === id ? T.blue : "transparent", color: tab === id ? T.onBlue : T.ink,
        }}><Ic size={14} /> {label}</button>
      ))}
    </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Import screen
// ---------------------------------------------------------------------------
// Quick-start guide shown from the Home screen's "How it works" button. Plain language, one idea per step, and the button /
// feature names match the on-screen labels in each language.
const GUIDE = {
  en: [
    { title: "Welcome to OWORLD", body: "OWORLD is a practice-exam simulator. You bring the questions, and it turns them into a realistic exam with answer tools, instant feedback and score tracking.",
      points: ["You don't need any technical skills.", "Your saved question blocks, ratings and progress are stored only in this browser."] },
    { title: "1. Get your questions", body: "A question bank (\"Qbank\") is simply a set of practice questions. You can ask an AI tool to write one for you.",
      points: ["On Home, open Import New Qbank. AI Quick Launch at the top has one-tap links to ChatGPT, Claude, Gemini and NotebookLM.", "Open Question Recipe Prompt, choose a difficulty (Mixed is recommended) and copy the prompt.", "Paste it into your AI tool along with your topic or notes.", "Paste the AI's reply back into OWORLD (or upload the file) and tap Load exam.", "Tap Save to Library to keep the questions for next time."] },
    { title: "2. Your Qbank Library", body: "Home shows your saved blocks first, so you can jump straight back in.",
      points: ["Each card shows its status: Not attempted yet, In progress, or Completed with your score. Running a Qbank in full on its own marks its card Completed.", "Tick a block, choose how many of its questions to practice (5 to 40, Max, or any number you type), then tap Load. Tick two or more to merge them into one custom block, pick a difficulty and size, then tap Mix.", "Custom and mixed runs are saved under Past Sessions and never change your cards.", "Ticking a block shows a toolbar at the top right: Share / Export Selected, Edit Selected (rename) and Delete Selected.", "A block you left half-finished shows Resume Session."] },
    { title: "3. Pick a mode", body: "Before you press Start block, choose how you want to practice. Tutor Mode is selected by default.",
      points: ["Tutor Mode: no timer, and you get feedback right after each answer.", "Timed Mode: a countdown like the real exam, with no feedback until the block ends. There is no Home button during a timed block, so plan to finish it.", "In Timed Mode you can switch the timer off during the block, but not back on."] },
    { title: "4. Answering questions", body: "Tap an answer choice. In Tutor Mode you see the result straight away.",
      points: ["Key Info highlights the important clues in the story. Tutor's Tip gives you a hint. If you open either before answering, the question is tagged Hint used.", "Got it wrong? Tap Show Correct Answer when you're ready, and Why this is incorrect to see why each choice is wrong. Source References are tucked into a dropdown.", "After answering, rate how well you knew it: Again, Hard, Good or Easy. You can retest by rating later.", "Tools: Mark Question (flag it), the ab button to strike out a choice, Highlight for selected text, Notes, Lab Values and Calculator.", "On a computer, the question list on the left lets you jump anywhere. Use its arrow to collapse it."] },
    { title: "5. Results and retesting", body: "When you tap End Block you get your score, breakdowns by subject and difficulty, and a review of every question.",
      points: ["Retest Incorrects (Tutor Mode) practices only what you missed. Retest Full Block goes again. You can also retest only flagged questions, or ones you rated Again or Hard.", "Your first-attempt score is always kept as your baseline. Retests never overwrite it."] },
    { title: "6. Past Sessions", body: "Every block you finish is logged, so you can look back at your progress and reopen any run.",
      points: ["On Home, use the switch above the library to go from Qbank Library to Past Sessions.", "Each entry shows its title (for example Mixed: 3 blocks · 50 Questions), the date completed and your score.", "Tap Review Exam to reopen the full question-by-question breakdown with lab values and explanations.", "Tick entries to reveal Delete Selected, or use Select all. Deleting a log never touches your Qbank cards.", "The 25 most recent sessions keep their full review. Older ones keep a score summary only."] },
    { title: "7. Pause, come back, and tidy up", body: "In Tutor Mode you can leave and pick up where you stopped.",
      points: ["Tap Home. Your answers and place in the block are saved automatically. Back on Home, tap Resume Session.", "In the exam lobby, Remove exam clears the loaded exam without touching your saved library.", "Settings has text size, dark mode, language, and Reset All Local Data (this deletes everything saved in this browser)."] },
    { title: "8. Using your phone", body: "On a phone the screen is simplified so the question gets the room.",
      points: ["The question list is hidden. Use Previous and Next at the top right, and Home at the top left (Tutor Mode).", "Lab Values, Notes, Calculator and Settings are in one row under them.", "At the bottom, Lock is on the left and End Block is on the right. A timed block also shows its countdown in the middle."] },
  ],
  es: [
    { title: "Bienvenido a OWORLD", body: "OWORLD es un simulador de exámenes de práctica. Tú aportas las preguntas y él las convierte en un examen realista con herramientas, retroalimentación inmediata y seguimiento de puntaje.",
      points: ["No necesitas conocimientos técnicos.", "Tus bloques guardados, calificaciones y progreso se almacenan solo en este navegador."] },
    { title: "1. Consigue tus preguntas", body: "Un banco de preguntas (\"Qbank\") es simplemente un conjunto de preguntas de práctica. Puedes pedirle a una herramienta de IA que te escriba uno.",
      points: ["En Inicio, abre Importar nuevo Qbank. Acceso rápido a IA, arriba, tiene enlaces directos a ChatGPT, Claude, Gemini y NotebookLM.", "Abre Prompt de receta de preguntas, elige una dificultad (se recomienda Mixta) y copia el prompt.", "Pégalo en tu herramienta de IA junto con tu tema o tus apuntes.", "Pega la respuesta de la IA en OWORLD (o sube el archivo) y toca Cargar examen.", "Toca Guardar en la biblioteca para conservar las preguntas para la próxima vez."] },
    { title: "2. Tu biblioteca de preguntas", body: "Inicio muestra primero tus bloques guardados, para que retomes de inmediato.",
      points: ["Cada tarjeta muestra su estado: Sin intentos aún, En curso o Completado con tu puntaje. Hacer un Qbank completo por sí solo marca su tarjeta como Completada.", "Marca un bloque, elige cuántas de sus preguntas practicar (de 5 a 40, Máx, o el número que escribas) y toca Cargar. Marca dos o más para combinarlos en un bloque personalizado, elige dificultad y tamaño, y toca Mezclar.", "Las sesiones personalizadas y mezcladas se guardan en Sesiones anteriores y nunca cambian tus tarjetas.", "Al marcar un bloque aparece una barra arriba a la derecha: Compartir / Exportar selección, Editar selección (renombrar) y Eliminar selección.", "Un bloque que dejaste a medias muestra Reanudar sesión."] },
    { title: "3. Elige un modo", body: "Antes de pulsar Iniciar bloque, elige cómo quieres practicar. El modo tutor viene seleccionado por defecto.",
      points: ["Modo tutor: sin cronómetro y con retroalimentación justo después de cada respuesta.", "Modo cronometrado: cuenta regresiva como en el examen real, sin retroalimentación hasta terminar el bloque. No hay botón de Inicio durante un bloque cronometrado, así que planea terminarlo.", "En modo cronometrado puedes apagar el cronómetro durante el bloque, pero no volver a encenderlo."] },
    { title: "4. Responder preguntas", body: "Toca una opción de respuesta. En modo tutor ves el resultado al instante.",
      points: ["Datos clave resalta las pistas importantes del caso. Consejo del tutor te da una pista. Si abres cualquiera antes de responder, la pregunta queda marcada como Pista usada.", "¿Fallaste? Toca Mostrar respuesta correcta cuando quieras y Por qué es incorrecta para ver por qué falla cada opción. Las fuentes están en un menú desplegable.", "Después de responder, califica qué tan bien lo sabías: Otra vez, Difícil, Bien o Fácil. Luego puedes repetir según tu calificación.", "Herramientas: Marcar pregunta, el botón ab para tachar una opción, Resaltar para el texto seleccionado, Notas, Valores de laboratorio y Calculadora.", "En computadora, la lista de preguntas a la izquierda te deja saltar a cualquiera. Usa su flecha para contraerla."] },
    { title: "5. Resultados y repetición", body: "Al tocar Terminar bloque ves tu puntaje, desgloses por materia y dificultad, y una revisión de cada pregunta.",
      points: ["Repetir falladas (modo tutor) practica solo lo que fallaste. Repetir bloque completo lo hace de nuevo. También puedes repetir solo las marcadas o las que calificaste Otra vez o Difícil.", "El puntaje de tu primer intento siempre se conserva como referencia. Las repeticiones nunca lo sobrescriben."] },
    { title: "6. Sesiones anteriores", body: "Cada bloque que terminas queda registrado, para que veas tu progreso y reabras cualquier intento.",
      points: ["En Inicio, usa el interruptor sobre la biblioteca para pasar de Biblioteca de preguntas a Sesiones anteriores.", "Cada entrada muestra su título (por ejemplo Mezcla: 3 bloques · 50 preguntas), la fecha y tu puntaje.", "Toca Revisar examen para reabrir el desglose completo pregunta por pregunta, con valores de laboratorio y explicaciones.", "Marca entradas para mostrar Eliminar selección, o usa Seleccionar todo. Eliminar un registro nunca toca tus tarjetas de Qbank.", "Las 25 sesiones más recientes conservan su revisión completa. Las anteriores conservan solo un resumen del puntaje."] },
    { title: "7. Pausa, vuelve y ordena", body: "En modo tutor puedes salir y retomar donde lo dejaste.",
      points: ["Toca Inicio. Tus respuestas y tu posición en el bloque se guardan automáticamente. De vuelta en Inicio, toca Reanudar sesión.", "En la sala del examen, Quitar examen borra el examen cargado sin tocar tu biblioteca guardada.", "Ajustes tiene el tamaño de texto, el modo oscuro, el idioma y Restablecer todos los datos locales (borra todo lo guardado en este navegador)."] },
    { title: "8. Usar el teléfono", body: "En el teléfono la pantalla se simplifica para que la pregunta tenga espacio.",
      points: ["La lista de preguntas se oculta. Usa Anterior y Siguiente arriba a la derecha, e Inicio arriba a la izquierda (modo tutor).", "Valores de laboratorio, Notas, Calculadora y Ajustes están en una fila debajo.", "Abajo, Bloquear está a la izquierda y Terminar bloque a la derecha. Un bloque cronometrado también muestra su cuenta regresiva en el centro."] },
  ],
};

function HowItWorksGuide({ onClose, T }) {
  const { t, lang } = useI18n();
  const vp = useViewport();
  const phone = vp.w < 640;
  const steps = GUIDE[lang] || GUIDE.en;
  const [i, setI] = useState(0);
  const last = i === steps.length - 1;
  const step = steps[i];
  const bodyRef = useRef(null);
  const touch = useRef(null);
  const go = (n) => setI(Math.max(0, Math.min(steps.length - 1, n)));

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight") setI((v) => Math.min(v + 1, steps.length - 1));
      else if (e.key === "ArrowLeft") setI((v) => Math.max(v - 1, 0));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, steps.length]);

  useEffect(() => { if (bodyRef.current) bodyRef.current.scrollTop = 0; }, [i]); // every step opens at its top

  // Phones: swipe left / right between steps (mostly-horizontal swipes only, so vertical scrolling is unaffected).
  const onTouchStart = (e) => { const p = e.touches[0]; touch.current = { x: p.clientX, y: p.clientY }; };
  const onTouchEnd = (e) => {
    const st = touch.current; touch.current = null;
    if (!st) return;
    const p = e.changedTouches[0]; const dx = p.clientX - st.x; const dy = p.clientY - st.y;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) go(i + (dx < 0 ? 1 : -1));
  };

  const pad = phone ? 16 : 26;
  return (
    <div role="dialog" aria-modal="true" aria-label={t("howItWorks")} onClick={onClose}
      style={{ position: "fixed", inset: 0, zIndex: 320, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: phone ? "flex-end" : "center", justifyContent: "center", padding: phone ? 0 : 20 }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        background: T.card, border: `1px solid ${T.border}`, borderRadius: phone ? "14px 14px 0 0" : 12, width: "100%", maxWidth: phone ? "100%" : Math.round(620 * Math.max(1, TEXT_SCALE)),
        maxHeight: Math.round(vp.h * (phone ? 0.92 : 0.88)), display: "flex", flexDirection: "column", overflow: "hidden",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: phone ? "10px 8px 10px 16px" : "16px 22px", borderBottom: `1px solid ${T.border}` }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 8, fontFamily: FONT_UI, fontWeight: 700, fontSize: fs(14), color: T.ink }}>
            <HelpCircle size={17} color={T.blue} /> {t("howItWorks")}
          </span>
          <button onClick={onClose} aria-label={t("guideClose")} title={t("guideClose")}
            style={{ background: "transparent", border: "none", cursor: "pointer", color: T.muted, display: "flex", padding: phone ? 10 : 0 }}>
            <X size={18} />
          </button>
        </div>

        <div ref={bodyRef} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}
          style={{ padding: phone ? "16px 16px 12px" : "22px 26px", overflowY: "auto", flex: 1, minHeight: 0, overscrollBehavior: "contain", WebkitOverflowScrolling: "touch" }}>
          <div style={{ fontFamily: FONT_MONO, fontSize: fs(11.5), color: T.muted, marginBottom: 8 }}>
            {t("guideStep", { n: i + 1, total: steps.length })}
          </div>
          <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: fs(phone ? 20 : 24), fontWeight: 600, color: T.ink, margin: "0 0 10px", lineHeight: 1.25 }}>{step.title}</h2>
          <p style={{ fontFamily: FONT_UI, fontSize: fs(phone ? 14 : 14.5), color: T.ink, lineHeight: 1.6, margin: "0 0 14px" }}>{step.body}</p>
          <ul style={{ margin: 0, paddingLeft: phone ? 18 : 20, display: "grid", gap: phone ? 10 : 8 }}>
            {step.points.map((p, pi) => (
              <li key={pi} style={{ fontFamily: FONT_UI, fontSize: fs(phone ? 13.5 : 14), color: T.muted, lineHeight: 1.55 }}>{p}</li>
            ))}
          </ul>
        </div>

        <div style={{ borderTop: `1px solid ${T.border}`, padding: phone ? "10px 16px calc(12px + env(safe-area-inset-bottom, 0px))" : "14px 22px" }}>
          {phone ? (
            <>
              <div role="progressbar" aria-valuemin={1} aria-valuemax={steps.length} aria-valuenow={i + 1} style={{ height: 4, borderRadius: 999, background: T.mutedBg, overflow: "hidden", marginBottom: 10 }}>
                <div style={{ height: "100%", width: `${((i + 1) / steps.length) * 100}%`, background: T.blue, transition: "width 0.2s" }} />
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                {i > 0 && <GhostButton T={T} icon={ChevronLeft} onClick={() => go(i - 1)} style={{ padding: "12px 14px" }}>{t("guideBack")}</GhostButton>}
                <PrimaryButton T={T} onClick={() => (last ? onClose() : go(i + 1))} style={{ flex: 1, justifyContent: "center", padding: "12px 14px" }}>{last ? t("guideDone") : t("guideNext")}</PrimaryButton>
              </div>
            </>
          ) : (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {steps.map((_, di) => (
                  <button key={di} onClick={() => setI(di)} aria-label={t("guideStep", { n: di + 1, total: steps.length })}
                    style={{ width: 9, height: 9, borderRadius: 999, padding: 0, cursor: "pointer", border: `1px solid ${T.blue}`, background: di === i ? T.blue : "transparent" }} />
                ))}
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                {i > 0 && <GhostButton T={T} icon={ChevronLeft} onClick={() => setI(i - 1)}>{t("guideBack")}</GhostButton>}
                <PrimaryButton T={T} onClick={() => (last ? onClose() : setI(i + 1))}>{last ? t("guideDone") : t("guideNext")}</PrimaryButton>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ImportScreen({ onImport, onSaveToLibrary, library, sessionLog = [], onDeleteSession, onClearSessions, onReviewSession, libTab, setLibTab, session, onResume, onOpenLobby, onLaunchLibrary, onMixLibrary, onDeleteLibraryEntry, onRenameLibraryEntry, T, darkMode, setDarkMode }) {
  const { t, lang } = useI18n();
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [showSchema, setShowSchema] = useState(false);
  const [showDevSchema, setShowDevSchema] = useState(false);
  const [copied, setCopied] = useState(false);
  const [recipeSize, setRecipeSize] = useState(25);
  const [recipeCustom, setRecipeCustom] = useState(""); // typed custom question count; "" = a preset is active
  const [recipeDifficulty, setRecipeDifficulty] = useState("mixed"); // mixed (recommended) | easy | medium | hard
  const [recipeFocusMode, setRecipeFocusMode] = useState("standard");
  const [recipeFocusValue, setRecipeFocusValue] = useState("");
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [bundleCount, setBundleCount] = useState(0); // blocks detected in the pasted text (>= 2 → a bundle)
  const [aiOpen, setAiOpen] = useState(false); // AI Quick Launch is an expandable chevron, collapsed by default
  const [pasteOpen, setPasteOpen] = useState(true); // the paste box can be collapsed; Load / Save stay available
  const [saveMsg, setSaveMsg] = useState(null); // { tone: "green" | "red" | "muted", text }
  const [review, setReview] = useState(null); // { result, action: "load" | "save" } — confirm when the tolerant loader left something out
  const [guideOpen, setGuideOpen] = useState(false);
  const vp = useViewport();
  const phone = vp.w < 640; // phones: the header buttons drop their labels so they all fit inline in one row
  const stacked = vp.w < 820; // on narrow screens the buttons sit in their own row above the logo instead of floating over it
  const [importOpen, setImportOpen] = useState(false); // import area is an accordion, collapsed by default
  const fileRef = useRef(null);
  // Library entry (if any) that owns the in-progress block — it gets the Resume Session button.
  const resumeId = session?.block?.libraryId && library.some((e) => e.id === session.block.libraryId) ? session.block.libraryId : null;

  const recipeText = buildQuestionRecipe({ size: recipeSize, focusMode: recipeFocusMode, focusValue: recipeFocusValue.trim(), lang, difficulty: recipeDifficulty });

  // Shared by "Load exam" and "Save to Library". The loader is tolerant, but if anything was left out or changed in a way
  // that matters, show it and let the student confirm rather than silently loading less than they pasted.
  function attempt(action) {
    const result = validateExamData(text, t);
    if (!result.valid) { setError(result.error); setSaveMsg(null); setReview(null); setPasteOpen(true); return; }
    setError("");
    if (result.warnings.some((w) => w.level === "content")) { setSaveMsg(null); setReview({ result, action }); return; }
    proceed(result, action);
  }

  function proceed(result, action) {
    setReview(null);
    if (action === "load") { setSaveMsg(null); onImport(result.data); return; }
    const r = onSaveToLibrary(result.data);
    if (r.failed) setSaveMsg({ tone: "red", text: t("storageFull") });
    else if (r.added === 0) setSaveMsg({ tone: "muted", text: t("libNothing") });
    else { setSaveMsg({ tone: "green", text: [t("libSaved", { n: r.added }), r.dup ? t("libDup", { d: r.dup }) : ""].filter(Boolean).join(" ") }); setPasteOpen(false); }
  }

  // Live bundle detection (debounced so typing / pasting a large file stays smooth).
  useEffect(() => {
    if (!text.trim()) { setBundleCount(0); return undefined; }
    const id = setTimeout(() => {
      const r = validateExamData(text, t);
      setBundleCount(r.valid ? r.data.blocks.length : 0);
    }, 300);
    return () => clearTimeout(id);
  }, [text]);
  const isBundle = bundleCount >= 2;

  function handleSubmit() { attempt("load"); }
  function handleSaveToLibrary() { attempt("save"); }

  function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const content = ev.target.result;
      setText(content);
      setSaveMsg(null);
      const result = validateExamData(content, t);
      if (!result.valid) { setError(result.error); setReview(null); setPasteOpen(true); return; }
      setError("");
      setPasteOpen(false); // a loaded file is rarely edited — collapse the box, the char count still shows
      const nb = result.data.blocks.length;
      if (nb >= 2) { // a bundle: tell the student each block will stay its own block / library card
        const names = result.data.blocks.slice(0, 4).map((b) => b.blockName).join(", ") + (nb > 4 ? ` +${nb - 4}` : "");
        setSaveMsg({ tone: "muted", text: t("bundleFound", { n: nb, names }) });
      }
      setReview(result.warnings.some((w) => w.level === "content") ? { result, action: "load" } : null);
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
    <div style={{ maxWidth: Math.round(1120 * Math.max(1, TEXT_SCALE)), margin: "0 auto", padding: "48px 20px 80px", position: "relative" }}>
      <style>{`@import url('${FONT_IMPORT_URL}');`}</style>

      <div style={stacked
        ? { display: "flex", flexWrap: phone ? "nowrap" : "wrap", justifyContent: phone ? "center" : "flex-end", gap: 8, alignItems: "center", marginBottom: 22 }
        : { position: "absolute", top: 48, right: 20, display: "flex", gap: 10, alignItems: "flex-start" }}>
        <GhostButton T={T} icon={HelpCircle} onClick={() => setGuideOpen(true)} title={t("howItWorks")} style={phone ? { padding: "12px 13px" } : undefined}>{!phone && t("howItWorks")}</GhostButton>
        <LangToggle T={T} />
        <SettingsMenu darkMode={darkMode} setDarkMode={setDarkMode} T={T} iconOnly={phone} />
      </div>
      {guideOpen && <HowItWorksGuide onClose={() => setGuideOpen(false)} T={T} />}

      <div style={{ textAlign: "center", marginBottom: 36 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12 }}>
          <Activity size={stacked ? 28 : 34} color={T.blue} strokeWidth={2.5} />
          <span style={{ fontFamily: FONT_MONO, fontSize: fs(stacked ? 34 : 44), letterSpacing: "0.1em", color: T.blue, fontWeight: 700 }}>
            OWORLD
          </span>
        </div>
      </div>

      {/* An exam is loaded: show the way back into it. When its in-progress block belongs to a saved library entry, the
          Resume Session button lives on that entry's row instead. */}
      {session && !resumeId && (
        <div style={{
          background: T.card, border: `1px solid ${session.block ? T.blue : T.border}`, borderRadius: 10, padding: "16px 20px", marginBottom: 20,
          display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, flexWrap: "wrap",
        }}>
          <div>
            <div style={{ fontFamily: FONT_UI, fontWeight: 700, fontSize: fs(11.5), color: T.blue, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 3 }}>
              {session.block ? t("sessionInProgress") : t("examLoadedLabel")}
            </div>
            <div style={{ fontFamily: FONT_UI, fontWeight: 700, fontSize: fs(15), color: T.ink }}>
              {session.block ? blockLabel(session.block, t) : (session.examTitle || t("practiceExam"))}
            </div>
            {session.block && (
              <span style={{ fontFamily: FONT_MONO, fontSize: fs(12), color: T.muted }}>
                {t("sessionPos", { n: (Number(session.bs.currentQuestionIndex) || 0) + 1, total: session.block.questions.length })}
              </span>
            )}
          </div>
          {session.block
            ? <PrimaryButton T={T} onClick={onResume} icon={Play}>{t("resumeSession")}</PrimaryButton>
            : <GhostButton T={T} onClick={onOpenLobby}>{t("openLobby")}</GhostButton>}
        </div>
      )}

      <LibraryTabs tab={libTab} setTab={setLibTab} count={sessionLog.length} T={T} />
      {libTab === "history"
        ? <SessionHistoryPanel history={sessionLog} onDelete={onDeleteSession} onClear={onClearSessions} onReview={onReviewSession} T={T} />
        : <QbankLibraryPanel library={library} onLaunch={onLaunchLibrary} onMix={onMixLibrary} onDelete={onDeleteLibraryEntry} onRename={onRenameLibraryEntry} resumeId={resumeId} onResume={onResume} T={T} />}

      <div style={{ marginBottom: 20 }}>
        <button
          aria-expanded={importOpen}
          onClick={() => setImportOpen((v) => !v)}
          style={{
            width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10,
            background: T.card, border: `1px solid ${T.border}`, borderRadius: importOpen ? "10px 10px 0 0" : 10,
            padding: "14px 24px", cursor: "pointer", fontFamily: FONT_UI, fontWeight: 600, fontSize: fs(14), color: T.ink,
          }}
        >
          <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
            <Plus size={17} color={T.blue} /> {t("importQbank")}
          </span>
          {importOpen ? <ChevronUp size={17} color={T.muted} /> : <ChevronDown size={17} color={T.muted} />}
        </button>
        {importOpen && (
          <div style={{ marginTop: -1 }}>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: "0 0 10px 10px", overflow: "hidden" }}>
          <button
            onClick={() => setShowSchema((v) => !v)}
            aria-expanded={showSchema}
            style={{
              width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, padding: "16px 24px",
              background: "transparent", border: "none", cursor: "pointer", fontFamily: FONT_UI, fontWeight: 600, fontSize: fs(14), color: T.ink,
            }}
          >
            <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}><ClipboardList size={17} /> {t("recipe")}</span>
            {showSchema ? <ChevronUp size={17} color={T.muted} /> : <ChevronDown size={17} color={T.muted} />}
          </button>
          {showSchema && (
          <div style={{ padding: "0 24px 24px" }}>
            <p style={{ fontFamily: FONT_UI, fontSize: fs(13.5), color: T.muted, lineHeight: 1.6, marginTop: 0 }}>
              {t("recipeIntro")}
            </p>

            <div style={{ display: "flex", flexWrap: "wrap", gap: 24, marginBottom: 18 }}>
              <div>
                <div style={{ fontFamily: FONT_UI, fontWeight: 600, fontSize: fs(12), color: T.ink, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>
                  {t("blockSize")}
                </div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
                  {BLOCK_SIZES.map((n) => {
                    const active = recipeCustom === "" && recipeSize === n;
                    return (
                      <button
                        key={n}
                        onClick={() => { setRecipeSize(n); setRecipeCustom(""); }}
                        style={{
                          fontFamily: FONT_UI, fontWeight: 600, fontSize: fs(13), padding: "7px 14px", borderRadius: 6,
                          border: `1.5px solid ${active ? T.blue : T.border}`,
                          background: active ? T.blueLight : "transparent",
                          color: active ? T.blueDeep : T.ink, cursor: "pointer",
                        }}
                      >
                        {n}
                      </button>
                    );
                  })}
                  <input
                    type="text"
                    inputMode="numeric"
                    value={recipeCustom}
                    aria-label={t("customSize")}
                    placeholder={`${t("customSize")} (${t("customSizePh", { n: MAX_RECIPE_SIZE })})`}
                    onChange={(e) => {
                      const digits = e.target.value.replace(/\D/g, "").slice(0, 3);
                      if (digits === "") { setRecipeCustom(""); return; }
                      const n = Math.max(1, Math.min(MAX_RECIPE_SIZE, parseInt(digits, 10)));
                      setRecipeCustom(String(n));
                      setRecipeSize(n);
                    }}
                    style={{
                      width: Math.round(150 * Math.max(1, TEXT_SCALE)), boxSizing: "border-box", fontFamily: FONT_UI, fontWeight: 600, fontSize: fs(13), color: T.ink,
                      background: recipeCustom !== "" ? T.blueLight : "transparent",
                      border: `1.5px solid ${recipeCustom !== "" ? T.blue : T.border}`, borderRadius: 6, padding: "7px 10px",
                    }}
                  />
                </div>
              </div>

              <div>
                <div style={{ fontFamily: FONT_UI, fontWeight: 600, fontSize: fs(12), color: T.ink, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>
                  {t("focus")}
                </div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {FOCUS_MODES.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => setRecipeFocusMode(m.id)}
                      style={{
                        fontFamily: FONT_UI, fontWeight: 600, fontSize: fs(13), padding: "7px 14px", borderRadius: 6,
                        border: `1.5px solid ${recipeFocusMode === m.id ? T.blue : T.border}`,
                        background: recipeFocusMode === m.id ? T.blueLight : "transparent",
                        color: recipeFocusMode === m.id ? T.blueDeep : T.ink, cursor: "pointer",
                      }}
                    >
                      {t("focus." + m.id)}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div style={{ fontFamily: FONT_UI, fontWeight: 600, fontSize: fs(12), color: T.ink, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>
                  {t("diffMode")}
                </div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {DIFFICULTY_MODES.map((id) => (
                    <button
                      key={id}
                      onClick={() => setRecipeDifficulty(id)}
                      aria-pressed={recipeDifficulty === id}
                      style={{
                        fontFamily: FONT_UI, fontWeight: 600, fontSize: fs(13), padding: "7px 14px", borderRadius: 6,
                        border: `1.5px solid ${recipeDifficulty === id ? T.blue : T.border}`,
                        background: recipeDifficulty === id ? T.blueLight : "transparent",
                        color: recipeDifficulty === id ? T.blueDeep : T.ink, cursor: "pointer",
                      }}
                    >
                      {t("diffMode." + id)}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <p style={{ fontFamily: FONT_UI, fontSize: fs(12.5), color: T.muted, lineHeight: 1.55, margin: "-6px 0 18px" }}>
              {recipeDifficulty === "mixed"
                ? t("diffHintMixed", (() => { const c = mixedCounts(recipeSize); return { e: c.easy, m: c.medium, h: c.hard }; })())
                : t("diffHint" + recipeDifficulty.charAt(0).toUpperCase() + recipeDifficulty.slice(1))}
            </p>

            {recipeFocusMode !== "standard" && (
              <input
                value={recipeFocusValue}
                onChange={(e) => setRecipeFocusValue(e.target.value)}
                placeholder={recipeFocusMode === "systems" ? t("phSystems") : t("phDisc")}
                style={{
                  width: "100%", boxSizing: "border-box", fontFamily: FONT_UI, fontSize: fs(13.5), color: T.ink,
                  border: `1px solid ${T.border}`, borderRadius: 6, padding: "9px 12px", marginBottom: 18,
                }}
              />
            )}

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <span style={{ fontFamily: FONT_UI, fontWeight: 600, fontSize: fs(12.5), color: T.ink, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                {t("recipeTitle")}
              </span>
              <button
                onClick={copyPrompt}
                style={{
                  fontFamily: FONT_UI, fontSize: fs(12.5), fontWeight: 600, color: copied ? T.green : T.blue,
                  background: "transparent", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 5,
                }}
              >
                {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? t("copied") : t("copy")}
              </button>
            </div>
            <pre style={{
              fontFamily: FONT_MONO, fontSize: fs(11.5), color: T.ink, background: T.paper,
              border: `1px solid ${T.border}`, borderRadius: 8, padding: 14, whiteSpace: "pre-wrap",
              wordBreak: "break-word", lineHeight: 1.6, margin: 0,
            }}>
              {recipeText}
            </pre>
            <button
              onClick={() => setShowDevSchema((v) => !v)}
              aria-expanded={showDevSchema}
              style={{
                marginTop: 18, width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                fontFamily: FONT_UI, fontWeight: 600, fontSize: fs(13), color: T.ink, background: T.mutedBg,
                border: `1px solid ${T.border}`, borderRadius: 6, padding: "10px 14px", cursor: "pointer",
              }}
            >
              {showDevSchema ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
              {showDevSchema ? t("hideSchema") : t("viewSchema")}
            </button>
            {showDevSchema && (
              <pre style={{
                fontFamily: FONT_MONO, fontSize: fs(11.5), color: T.ink, background: T.paper,
                border: `1px solid ${T.border}`, borderRadius: 8, padding: 14, marginTop: 10, marginBottom: 0,
                whiteSpace: "pre-wrap", wordBreak: "break-word", lineHeight: 1.6,
              }}>
                {SCHEMA_TEXT}
              </pre>
            )}
          </div>
          )}
        </div>

        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, marginTop: 12, overflow: "hidden" }}>
          <button
            onClick={() => setAiOpen((v) => !v)}
            aria-expanded={aiOpen}
            style={{
              width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, padding: "16px 24px",
              background: "transparent", border: "none", cursor: "pointer", fontFamily: FONT_UI, fontWeight: 600, fontSize: fs(14), color: T.ink,
            }}
          >
            <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}><Sparkles size={17} color={T.blue} /> {t("aiLaunchTitle")}</span>
            {aiOpen ? <ChevronUp size={17} color={T.muted} /> : <ChevronDown size={17} color={T.muted} />}
          </button>
          {aiOpen && (
            <div style={{ padding: "0 24px 24px" }}>
              <p style={{ fontFamily: FONT_UI, fontSize: fs(13), color: T.muted, lineHeight: 1.55, margin: "0 0 14px" }}>{t("aiLaunchHint")}</p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 8 }}>
                {[
                  { name: "ChatGPT", url: "https://chatgpt.com/" },
                  { name: "Claude", url: "https://claude.ai/new" },
                  { name: "Gemini", url: "https://gemini.google.com/app" },
                  { name: "NotebookLM", url: "https://notebooklm.google.com/" },
                ].map((ai) => (
                  <a
                    key={ai.name}
                    href={ai.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={`${ai.name} - ${t("aiLaunchOpens")}`}
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "11px 12px", borderRadius: 8,
                      border: `1px solid ${T.border}`, color: T.ink, textDecoration: "none", fontFamily: FONT_UI, fontWeight: 600, fontSize: fs(13.5),
                    }}
                  >
                    {ai.name} <ExternalLink size={14} color={T.blue} />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 24, marginTop: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <button
              type="button"
              onClick={() => setPasteOpen((o) => !o)}
              aria-expanded={pasteOpen}
              style={{ display: "flex", alignItems: "center", gap: 8, background: "transparent", border: "none", padding: 0, cursor: "pointer", textAlign: "left" }}
            >
              <FileJson size={17} color={T.ink} />
              <span style={{ fontFamily: FONT_UI, fontWeight: 600, fontSize: fs(14), color: T.ink }}>
                {t("pasteJson")}
              </span>
              {pasteOpen ? <ChevronUp size={16} color={T.muted} /> : <ChevronDown size={16} color={T.muted} />}
            </button>
            <button
              onClick={() => fileRef.current?.click()}
              style={{
                fontFamily: FONT_UI, fontSize: fs(13), fontWeight: 600, color: T.blue, background: "transparent",
                border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
              }}
            >
              <Upload size={14} /> {t("upload")}
            </button>
            <input ref={fileRef} type="file" accept=".json,application/json" onChange={handleFile} style={{ display: "none" }} />
          </div>

          {pasteOpen && (
            <textarea
              value={text}
              rows={4}
              spellCheck={false}
              onChange={(e) => { setText(e.target.value); setReview(null); }}
              placeholder={t("pastePh")}
              style={{
                width: "100%", minHeight: 88, fontFamily: FONT_MONO, fontSize: fs(12.5), color: T.ink,
                background: T.paper, border: `1px solid ${T.border}`, borderRadius: 8, padding: 12,
                resize: "vertical", boxSizing: "border-box", lineHeight: 1.5,
              }}
            />
          )}
          {(text.trim() || !pasteOpen) && (
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: pasteOpen ? 6 : 0, fontFamily: FONT_UI, fontSize: fs(12), color: T.muted }}>
              <span>{text.trim() ? t("pasteChars", { n: text.length.toLocaleString() }) : t("pasteEmpty")}</span>
              {text.trim() && (
                <button
                  type="button"
                  onClick={() => { setText(""); setError(""); setReview(null); setSaveMsg(null); }}
                  style={{ fontFamily: FONT_UI, fontSize: fs(12), fontWeight: 600, color: T.blue, background: "transparent", border: "none", padding: 0, cursor: "pointer" }}
                >
                  {t("pasteClear")}
                </button>
              )}
            </div>
          )}

          {error && (
            <div style={{
              marginTop: 12, display: "flex", gap: 8, alignItems: "flex-start", background: T.redLight,
              color: T.red, padding: "10px 12px", borderRadius: 6, fontFamily: FONT_UI, fontSize: fs(13),
            }}>
              <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
              <span>{error}</span>
            </div>
          )}

          {review && (
            <div role="alert" style={{
              marginTop: 12, background: T.amberLight, color: T.ink, border: `1px solid ${T.amber}`, borderRadius: 8,
              padding: "14px 16px", fontFamily: FONT_UI, fontSize: fs(13),
            }}>
              <div style={{ display: "flex", gap: 8, alignItems: "center", fontWeight: 700, color: T.amber, marginBottom: 8 }}>
                <AlertTriangle size={16} /> {t("warn.reviewTitle")}
              </div>
              <div style={{ display: "grid", gap: 8 }}>
                {review.result.warnings.map((w, i) => (
                  <div key={i}>
                    <div style={{ lineHeight: 1.5 }}>{w.text}</div>
                    {w.details && (
                      <ul style={{ margin: "4px 0 0", paddingLeft: 18, color: T.muted, lineHeight: 1.5 }}>
                        {w.details.map((d, j) => <li key={j}>{d}</li>)}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", gap: 10, marginTop: 14, flexWrap: "wrap" }}>
                <PrimaryButton T={T} icon={review.action === "save" ? Save : Play} onClick={() => proceed(review.result, review.action)}>
                  {t(review.action === "save" ? "warn.saveN" : review.result.data.blocks.length >= 2 ? "warn.importN" : "warn.loadN", { n: review.result.stats.questions })}
                </PrimaryButton>
                <GhostButton T={T} onClick={() => setReview(null)}>{t("warn.back")}</GhostButton>
              </div>
            </div>
          )}

          {saveMsg && (
            <div role="status" style={{
              marginTop: 12, display: "flex", gap: 8, alignItems: "center", fontFamily: FONT_UI, fontSize: fs(13),
              color: saveMsg.tone === "green" ? T.green : saveMsg.tone === "red" ? T.red : T.muted,
            }}>
              {saveMsg.tone === "green" ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
              <span>{saveMsg.text}</span>
            </div>
          )}

          <div style={{ display: "flex", gap: 10, marginTop: 16, flexWrap: "wrap" }}>
            <PrimaryButton T={T} onClick={handleSubmit} icon={isBundle ? Plus : Play} disabled={!text.trim()}>{isBundle ? t("importBundle") : t("load")}</PrimaryButton>
            {!isBundle && <GhostButton T={T} onClick={handleSaveToLibrary} icon={Save} disabled={!text.trim()}>{t("saveToLibrary")}</GhostButton>}
          </div>
        </div>

          </div>
        )}
      </div>

      <div style={{ marginTop: 48, paddingTop: 20, borderTop: `1px solid ${T.border}`, textAlign: "center" }}>
        <p style={{ fontFamily: FONT_UI, fontSize: fs(12), color: T.muted, margin: "0 0 6px" }}>
          {t("createdBy")} <strong style={{ color: T.ink }}>Oscar Perez</strong> — {t("role")}
        </p>
        <button
          onClick={() => setShowDisclaimer(true)}
          style={{
            fontFamily: FONT_UI, fontSize: fs(11.5), color: T.muted, background: "transparent", border: "none",
            cursor: "pointer", textDecoration: "underline", padding: 0,
          }}
        >
          {t("notAffil")}
        </button>
      </div>

      {showDisclaimer && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(10,15,20,0.6)", display: "flex", alignItems: "center",
          justifyContent: "center", zIndex: 95, padding: 20,
        }}>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 26, maxWidth: 440 }}>
            <h3 style={{ fontFamily: FONT_UI, fontSize: fs(16), fontWeight: 700, color: T.ink, margin: "0 0 10px" }}>
              {t("tmTitle")}
            </h3>
            <p style={{ fontFamily: FONT_UI, fontSize: fs(13.5), color: T.muted, lineHeight: 1.6, margin: "0 0 12px" }}>
              {t("tm1")}
            </p>
            <p style={{ fontFamily: FONT_UI, fontSize: fs(13.5), color: T.muted, lineHeight: 1.6, margin: "0 0 20px" }}>
              {t("tm2")}
            </p>
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <PrimaryButton T={T} onClick={() => setShowDisclaimer(false)}>{t("close")}</PrimaryButton>
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
// Bundle import step: a file with 2+ Qbanks lands here instead of the lobby. No start / export / mode controls — the only
// decision is which Qbanks go into the library (everything new is ticked by default; unticked ones are discarded).
function ImportReview({ examData, library, onAdd, onCancel, T, darkMode, setDarkMode }) {
  const { t } = useI18n();
  const narrow = useViewport().w < 640;
  const isSaved = (b) => !!b.libraryId && library.some((e) => e.id === b.libraryId);
  const newIdx = examData.blocks.map((_, i) => i).filter((i) => !isSaved(examData.blocks[i]));
  const [sel, setSel] = useState(newIdx);
  const [msg, setMsg] = useState(null);
  const picked = sel.filter((i) => newIdx.includes(i));
  const allPicked = newIdx.length > 0 && picked.length === newIdx.length;
  const toggle = (i) => setSel((cur) => (cur.includes(i) ? cur.filter((x) => x !== i) : [...cur, i]));
  const subjectsOf = (b) => {
    const m = {};
    b.questions.forEach((q) => { if (q.subject) m[q.subject] = (m[q.subject] || 0) + 1; });
    return Object.entries(m).sort((a, c) => c[1] - a[1]).slice(0, 3).map(([k]) => k).join(" · ");
  };
  const submit = () => {
    const r = onAdd(newIdx.length === 0 ? [] : picked);
    if (r && r.failed) setMsg({ tone: "red", text: t("storageFull") });
  };
  const primaryLabel = newIdx.length === 0 ? t("irDone") : allPicked ? t("irAddAll", { n: picked.length }) : t("irAddSel", { n: picked.length });
  const note = [
    examData.mergedDuplicates > 0 ? t("lobbyMerged", { n: examData.mergedDuplicates }) : "",
    examData.linkedExisting > 0 ? t("lobbyLinked", { n: examData.linkedExisting }) : "",
  ].filter(Boolean).join(" ");

  return (
    <div style={{ maxWidth: Math.round(900 * Math.max(1, TEXT_SCALE)), margin: "0 auto", padding: "48px 20px 80px" }}>
      <style>{`@import url('${FONT_IMPORT_URL}');`}</style>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 22, gap: 16, flexWrap: "wrap" }}>
        <div style={{ flex: "1 1 320px", minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
            <Activity size={20} color={T.blue} strokeWidth={2.5} />
            <span style={{ fontFamily: FONT_MONO, fontSize: fs(12), letterSpacing: "0.12em", color: T.blue, fontWeight: 600 }}>OWORLD</span>
          </div>
          <h1 style={{ fontFamily: FONT_DISPLAY, fontSize: fs(30), fontWeight: 600, color: T.ink, margin: "0 0 6px" }}>{t("irTitle")}</h1>
          <p style={{ fontFamily: FONT_UI, fontSize: fs(14), color: T.muted, lineHeight: 1.55, margin: 0 }}>{t("irSub", { n: examData.blocks.length })}</p>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <GhostButton T={T} onClick={onCancel} icon={X}>{t("irCancel")}</GhostButton>
          <SettingsMenu darkMode={darkMode} setDarkMode={setDarkMode} T={T} />
        </div>
      </div>

      {note && <p style={{ fontFamily: FONT_UI, fontSize: fs(12.5), color: T.muted, margin: "0 0 14px", lineHeight: 1.5 }}>{note}</p>}
      {newIdx.length === 0 && <p style={{ fontFamily: FONT_UI, fontSize: fs(13.5), color: T.muted, margin: "0 0 14px" }}>{t("irNoneNew")}</p>}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10, marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          {newIdx.length > 0 && <GhostButton T={T} onClick={() => setSel(newIdx)} disabled={allPicked}>{t("lobbySelectAll")}</GhostButton>}
          {picked.length > 0 && <GhostButton T={T} onClick={() => setSel([])}>{t("lobbyClear")}</GhostButton>}
          {newIdx.length > 0 && <span style={{ fontFamily: FONT_MONO, fontSize: fs(12.5), color: T.muted }}>{t("lobbySelected", { n: picked.length })}</span>}
        </div>
        <PrimaryButton T={T} icon={newIdx.length === 0 ? CheckCircle2 : Save} disabled={newIdx.length > 0 && picked.length === 0} onClick={submit} style={narrow ? { width: "100%" } : undefined}>
          {primaryLabel}
        </PrimaryButton>
      </div>
      {msg && (
        <div role="status" style={{ marginBottom: 12, display: "flex", gap: 8, alignItems: "center", fontFamily: FONT_UI, fontSize: fs(13), color: T.red }}>
          <AlertTriangle size={16} /> <span>{msg.text}</span>
        </div>
      )}

      <div style={{ display: "grid", gap: 12 }}>
        {examData.blocks.map((b, i) => {
          const saved = isSaved(b);
          const on = !saved && sel.includes(i);
          const subj = subjectsOf(b);
          return (
            <div
              key={i}
              onClick={saved ? undefined : () => toggle(i)}
              style={{
                display: "flex", alignItems: "center", gap: 14, padding: "16px 20px", borderRadius: 10, cursor: saved ? "default" : "pointer",
                background: on ? T.blueLight : T.card, border: `1px solid ${on ? T.blue : T.border}`, opacity: saved ? 0.7 : 1,
              }}
            >
              <input
                type="checkbox" checked={on} disabled={saved} onChange={() => toggle(i)} onClick={(e) => e.stopPropagation()}
                aria-label={b.blockName} style={{ cursor: saved ? "not-allowed" : "pointer", width: 18, height: 18, flexShrink: 0 }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 10, marginBottom: 4 }}>
                  <span style={{ fontFamily: FONT_UI, fontWeight: 700, fontSize: fs(16), color: T.ink, overflowWrap: "anywhere" }}>{b.blockName}</span>
                  {saved ? <Pill T={T} tone="green">{t("lobbySaved")}</Pill> : <Pill T={T} tone="blue">{t("irNew")}</Pill>}
                </div>
                <span style={{ fontFamily: FONT_MONO, fontSize: fs(12.5), color: T.muted }}>
                  {t("qCount", { n: b.questions.length })}{typeof b.timeLimitMinutes === "number" ? ` · ${t("minLimit", { m: b.timeLimitMinutes })}` : ""}
                </span>
                {subj && <div style={{ fontFamily: FONT_UI, fontSize: fs(12), color: T.muted, marginTop: 3, overflowWrap: "anywhere" }}>{subj}</div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Lobby({ examData, blockStates, library = [], onStart, onReview, onHome, onRemove, onRemoveBlocks, onFinalSummary, onSetMode, onRetestMissed, onRetestAll, onSaveBlocks, T, darkMode, setDarkMode }) {
  const { t } = useI18n();
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [sel, setSel] = useState([]); // ticked block indices — same select-then-act logic as the Qbank Library
  const [confirmRemoveSel, setConfirmRemoveSel] = useState(false);
  const [selMsg, setSelMsg] = useState(null); // { tone, text }
  // "Saved" means the block's library entry still exists (a deleted entry leaves a stale libraryId behind).
  const isSaved = (b) => !!b.libraryId && library.some((e) => e.id === b.libraryId);
  const canSave = (i) => { const b = examData.blocks[i]; return !b.isRetest && !b.isMixed && !isSaved(b); };
  const canRemove = (i) => !!blockStates[i] && blockStates[i].status === "pending"; // never discard answers or results
  // Sorting state: an imported block that is neither saved nor started. It can only be saved or dismissed, not practiced,
  // so a Qbank always lives in the library before it is taken. (Mixed / retest blocks and anything already underway keep full controls.)
  const isTriage = (i) => canSave(i) && blockStates[i]?.status === "pending";
  const hasTriage = examData.blocks.some((_, i) => isTriage(i));
  // Nothing left to sort: close the lobby (a block that is mid-exam keeps its session and just returns Home).
  useEffect(() => {
    if (hasTriage) return;
    if (blockStates.some((b) => b.status === "in-progress")) onHome(); else onRemove();
  }, [hasTriage]);
  const selectableIdx = examData.blocks.map((_, i) => i).filter((i) => canSave(i) || canRemove(i));
  const selIdx = sel.filter((i) => selectableIdx.includes(i));
  const selSavable = selIdx.filter(canSave);
  const selRemovable = selIdx.filter(canRemove);
  const hasUnsaved = examData.blocks.some((_, i) => canSave(i));
  // Header actions: act on the ticked blocks, or on everything when nothing is ticked.
  const hasSel = selIdx.length > 0;
  const saveLabel = hasSel ? t("lobbySaveN", { n: selSavable.length }) : t("saveToLibrary");
  const removeLabel = hasSel ? t("lobbyRemoveN", { n: selRemovable.length }) : t("removeExam");
  const doSave = (only) => {
    const r = onSaveBlocks(only);
    if (r.failed) setSelMsg({ tone: "red", text: t("storageFull") });
    else if (r.added === 0 && !r.dup) setSelMsg(null);
    else if (r.added === 0) setSelMsg({ tone: "muted", text: t("libNothing") });
    else setSelMsg({ tone: "green", text: [t("libSaved", { n: r.added }), r.dup ? t("libDup", { d: r.dup }) : ""].filter(Boolean).join(" ") });
    setSel([]);
    // Sorting: a Qbank that is now in the library leaves this list (the library copy stays), so only unsorted ones remain.
    // Blocks already underway are never dropped (removeLoadedBlocks only removes not-yet-started ones).
    if (!r.failed && (r.added > 0 || r.dup > 0)) {
      const sorted = (Array.isArray(only) ? only : examData.blocks.map((_, i) => i)).filter((i) => isTriage(i));
      if (sorted.length) onRemoveBlocks(sorted);
    }
  };
  const baseStates = blockStates.filter((_, i) => !examData.blocks[i].isRetest);
  const allDone = baseStates.every((b) => b.status === "done");
  const anyDone = baseStates.some((b) => b.status === "done");
  const { w: vpW } = useViewport();
  const narrow = vpW < 640; // phones: block actions stack full-width instead of squeezing side by side

  return (
    <div style={{ maxWidth: Math.round(1120 * Math.max(1, TEXT_SCALE)), margin: "0 auto", padding: "48px 20px 80px" }}>
      <style>{`@import url('${FONT_IMPORT_URL}');`}</style>
      {/* Logo (same size as Home) → bundle title → the action row, all centered */}
      <div style={{ textAlign: "center", marginBottom: 28 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12 }}>
          <Activity size={narrow ? 28 : 34} color={T.blue} strokeWidth={2.5} />
          <span style={{ fontFamily: FONT_MONO, fontSize: fs(narrow ? 34 : 44), letterSpacing: "0.1em", color: T.blue, fontWeight: 700 }}>
            OWORLD
          </span>
        </div>
        <h1 style={{ fontFamily: FONT_DISPLAY, fontSize: fs(30), fontWeight: 600, color: T.ink, margin: "14px 0 18px", overflowWrap: "anywhere" }}>
          {examData.examTitle || t("practiceExam")}
        </h1>
        <div style={{ display: "flex", justifyContent: "center", alignItems: "flex-start", gap: 10, flexWrap: "wrap", maxWidth: "100%" }}>
          <GhostButton T={T} onClick={onHome} icon={HomeIcon}>{t("homeBtn")}</GhostButton>
          {allDone && <PrimaryButton T={T} onClick={onFinalSummary} icon={ClipboardList}>{t("fullSummary")}</PrimaryButton>}
          {hasUnsaved && (
            <PrimaryButton T={T} icon={Save} disabled={hasSel && selSavable.length === 0} onClick={() => doSave(hasSel ? selSavable : undefined)}>
              {saveLabel}
            </PrimaryButton>
          )}
          <GhostButton T={T} icon={Trash2} disabled={hasSel && selRemovable.length === 0} onClick={() => (hasSel ? setConfirmRemoveSel(true) : setConfirmRemove(true))}>
            {removeLabel}
          </GhostButton>
          <SettingsMenu darkMode={darkMode} setDarkMode={setDarkMode} T={T} />
        </div>
      </div>

      {confirmRemove && (
        <div role="dialog" aria-modal="true" onClick={() => setConfirmRemove(false)}
          style={{ position: "fixed", inset: 0, zIndex: 300, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 24, maxWidth: 440, width: "100%" }}>
            <h3 style={{ fontFamily: FONT_UI, fontSize: fs(17), fontWeight: 700, color: T.ink, margin: "0 0 10px" }}>{t("removeTitle")}</h3>
            <p style={{ fontFamily: FONT_UI, fontSize: fs(14), color: T.muted, lineHeight: 1.55, margin: "0 0 20px" }}>{hasUnsaved ? t("removeBodyUnsaved") : t("removeBody")}</p>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <GhostButton T={T} onClick={() => setConfirmRemove(false)}>{t("cancel")}</GhostButton>
              <PrimaryButton T={T} onClick={() => { setConfirmRemove(false); onRemove(); }}>{t("removeGo")}</PrimaryButton>
            </div>
          </div>
        </div>
      )}


      {confirmRemoveSel && (
        <div role="dialog" aria-modal="true" onClick={() => setConfirmRemoveSel(false)}
          style={{ position: "fixed", inset: 0, zIndex: 300, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 24, maxWidth: 440, width: "100%" }}>
            <h3 style={{ fontFamily: FONT_UI, fontSize: fs(17), fontWeight: 700, color: T.ink, margin: "0 0 10px" }}>{t("removeSelTitle")}</h3>
            <p style={{ fontFamily: FONT_UI, fontSize: fs(14), color: T.muted, lineHeight: 1.55, margin: "0 0 20px" }}>
              {selRemovable.filter(canSave).length > 0
                ? t("removeSelBodyUnsaved", { n: selRemovable.length, u: selRemovable.filter(canSave).length })
                : t("removeSelBody", { n: selRemovable.length })}
            </p>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <GhostButton T={T} onClick={() => setConfirmRemoveSel(false)}>{t("cancel")}</GhostButton>
              <PrimaryButton T={T} onClick={() => { setConfirmRemoveSel(false); onRemoveBlocks(selRemovable); setSel([]); setSelMsg(null); }}>{t("removeSelGo")}</PrimaryButton>
            </div>
          </div>
        </div>
      )}

      {(examData.mergedDuplicates > 0 || examData.linkedExisting > 0) && (
        <p style={{ fontFamily: FONT_UI, fontSize: fs(12.5), color: T.muted, margin: "0 0 14px", lineHeight: 1.5 }}>
          {[examData.mergedDuplicates > 0 ? t("lobbyMerged", { n: examData.mergedDuplicates }) : "", examData.linkedExisting > 0 ? t("lobbyLinked", { n: examData.linkedExisting }) : ""].filter(Boolean).join(" ")}
        </p>
      )}

      {hasTriage && (
        <p style={{ fontFamily: FONT_UI, fontSize: fs(13.5), color: T.ink, margin: "0 0 14px", lineHeight: 1.5 }}>{t("lobbyTriageNote")}</p>
      )}

      {selectableIdx.length > 0 && (
        <label style={{ display: "inline-flex", alignItems: "center", gap: 10, marginBottom: 12, cursor: "pointer", fontFamily: FONT_UI, fontSize: fs(13), color: T.ink }}>
          <input type="checkbox" checked={selIdx.length === selectableIdx.length}
            onChange={(e) => setSel(e.target.checked ? selectableIdx : [])} style={{ cursor: "pointer", width: 18, height: 18 }} />
          {t("lobbySelectAll")}
          <span style={{ fontFamily: FONT_MONO, fontSize: fs(12.5), color: T.muted }}>{t("lobbySelected", { n: selIdx.length })}</span>
        </label>
      )}
      {selMsg && (
        <div role="status" style={{
          marginBottom: 12, display: "flex", gap: 8, alignItems: "center", fontFamily: FONT_UI, fontSize: fs(13),
          color: selMsg.tone === "green" ? T.green : selMsg.tone === "red" ? T.red : T.muted,
        }}>
          {selMsg.tone === "green" ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
          <span>{selMsg.text}</span>
        </div>
      )}

      <div style={{ display: "grid", gap: 14 }}>
        {examData.blocks.map((block, idx) => {
          const bs = blockStates[idx];
          const total = block.questions.length;
          const answered = Object.values(bs.answers).filter((a) => a.selected).length;
          const selectable = selectableIdx.includes(idx);
          const picked = selectable && sel.includes(idx);
          const triage = isTriage(idx);
          if (!triage) return null; // saved / started Qbanks live in the library, not here
          const toggleSel = () => setSel((cur) => (cur.includes(idx) ? cur.filter((x) => x !== idx) : [...cur, idx]));
          return (
            <div key={idx} onClick={triage ? toggleSel : undefined} style={{
              background: picked ? T.blueLight : T.card, border: `1px solid ${picked ? T.blue : T.border}`, borderRadius: 10,
              padding: "20px 22px", display: "flex", justifyContent: "space-between",
              alignItems: "center", flexWrap: "wrap", gap: 14, cursor: triage ? "pointer" : undefined,
            }}>
              <div style={{ flex: "1 1 260px", minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 10, marginBottom: 6 }}>
                  {selectable && (
                    <input type="checkbox" checked={picked} onChange={toggleSel} onClick={(e) => e.stopPropagation()} aria-label={blockLabel(block, t)} style={{ cursor: "pointer", width: 18, height: 18 }} />
                  )}
                  <span style={{ fontFamily: FONT_UI, fontWeight: 700, fontSize: fs(16), color: T.ink }}>
                    {blockLabel(block, t)}
                  </span>
                  {!block.isRetest && !block.isMixed && (isSaved(block)
                    ? <Pill T={T} tone="green">{t("lobbySaved")}</Pill>
                    : <Pill T={T} tone="amber">{t("lobbyNotSaved")}</Pill>)}
                  {bs.status === "pending" && <Pill T={T} tone="muted">{t("notStarted")}</Pill>}
                  {bs.status === "in-progress" && <Pill T={T} tone="blue">{t("inProgress", { a: answered, n: total })}</Pill>}
                  {bs.status === "done" && (
                    <Pill T={T} tone={bs.score.pct >= 70 ? "green" : "red"}>
                      {bs.score.correct}/{bs.score.total} · {bs.score.pct}%
                    </Pill>
                  )}
                </div>
                <span style={{ fontFamily: FONT_MONO, fontSize: fs(12.5), color: T.muted }}>
                  {t("qCount", { n: total })}{triage ? null : <> &nbsp;·&nbsp; {bs.timed && !bs.timerOff ? t("minLimit", { m: Math.round(bs.timeLeft / 60) }) : bs.timerOff ? t("untimed") + " (" + t("timerOffSuffix") + ")" : t("untimed")}</>}
                </span>
                {triage && (
                  <div style={{ fontFamily: FONT_UI, fontSize: fs(12.5), color: T.muted, lineHeight: 1.45, marginTop: 6 }}>{t("triageHint")}</div>
                )}
              </div>
              {!triage && (
              <div style={narrow
                ? { display: "flex", flexDirection: "column", alignItems: "stretch", gap: 12, width: "100%" }
                : { display: "flex", alignItems: "center", gap: 16, marginLeft: "auto", flexWrap: "wrap" }}>
                <ExportShareButton T={T} fullWidth={narrow} wrapStyle={narrow ? { order: 3 } : undefined} getBlock={() => ({ block: examData.blocks[idx], examTitle: examData.examTitle })} />
                {bs.status !== "done" && (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 4, width: narrow ? "100%" : 270, maxWidth: "100%" }}>
                    <div role="group" aria-label={t("modeLabel")} style={{ display: narrow ? "flex" : "inline-flex", width: narrow ? "100%" : undefined, border: `1px solid ${T.border}`, borderRadius: 6, overflow: "hidden", opacity: bs.status === "pending" ? 1 : 0.6 }}>
                      {[["timed", t("timed"), Clock], ["tutor", t("tutorShort"), Lightbulb]].map(([m, label, Ic]) => {
                        const on = m === "tutor" ? bs.tutor : bs.timed;
                        return (
                          <button key={m} aria-pressed={on} disabled={bs.status !== "pending"} onClick={() => onSetMode(idx, m)}
                            style={{
                              display: "flex", alignItems: "center", justifyContent: "center", gap: 6, flex: narrow ? 1 : "none", whiteSpace: "nowrap", fontFamily: FONT_UI, fontWeight: 700, fontSize: fs(12.5), padding: narrow ? "11px 14px" : "8px 14px", border: "none",
                              cursor: bs.status === "pending" ? "pointer" : "not-allowed", background: on ? T.blue : "transparent", color: on ? T.onBlue : T.ink,
                            }}>
                            <Ic size={14} /> {label}
                          </button>
                        );
                      })}
                    </div>
                    <span style={{ fontFamily: FONT_UI, fontSize: fs(11.5), color: T.muted, lineHeight: 1.4, minHeight: narrow ? undefined : "2.8em" }}>
                      {bs.status !== "pending" ? t("modeLocked") : bs.tutor ? t("modeTutorHint") : t("modeTimedHint")}
                    </span>
                  </div>
                )}
                {bs.status === "done" ? (
                  <>
                    <GhostButton T={T} onClick={() => onReview(idx)} icon={ChevronRight} style={narrow ? { width: "100%" } : undefined}>{t("review")}</GhostButton>
                    {bs.score.correct < bs.score.total && (
                      <GhostButton T={T} onClick={() => onRetestMissed(idx)} icon={RotateCcw} style={narrow ? { width: "100%" } : undefined}>
                        {t("retestMissed", { n: bs.score.total - bs.score.correct })}
                      </GhostButton>
                    )}
                    <GhostButton T={T} onClick={() => onRetestAll(idx)} icon={RotateCcw} style={narrow ? { width: "100%" } : undefined}>
                      {t("retestAll", { n: total })}
                    </GhostButton>
                  </>
                ) : (
                  <PrimaryButton T={T} onClick={() => onStart(idx)} icon={Play} style={narrow ? { width: "100%" } : undefined}>
                    {bs.status === "in-progress" ? t("resume") : t("start")}
                  </PrimaryButton>
                )}
              </div>
              )}
            </div>
          );
        })}
      </div>
      {!anyDone && blockStates.some((b, i) => !examData.blocks[i].isRetest && !isTriage(i) && b.status !== "done" && b.timed) && (
        <p style={{ fontFamily: FONT_UI, fontSize: fs(12.5), color: T.muted, marginTop: 20 }}>
          {t("timingNote")}
        </p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Calculator (floating tool)
// ---------------------------------------------------------------------------
function CalculatorPanel({ T, onClose }) {
  const touch = useViewport().w < 640;
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
    fontFamily: FONT_MONO, fontWeight: 600, fontSize: fs(touch ? 18 : 15), padding: touch ? "15px 0" : "10px 0", borderRadius: touch ? 8 : 6,
    border: `1px solid ${T.border}`, background: "transparent", color: T.ink, cursor: "pointer",
  };
  const opStyle = { ...btnStyle, background: T.blueLight, color: T.blue };

  return (
    <div style={{
      position: "fixed", right: 8, bottom: 90, width: `min(${Math.round(260 * Math.max(1, TEXT_SCALE))}px, calc(100vw - 16px))`, background: T.card, border: `1px solid ${T.border}`,
      borderRadius: 10, padding: 14, zIndex: 60, boxShadow: "0 8px 28px rgba(0,0,0,0.35)",
    }}>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 8 }}>
        <button onClick={onClose} aria-label="Close" style={{ background: "transparent", border: "none", cursor: "pointer", color: T.muted, ...(touch ? { minWidth: 44, minHeight: 44, margin: "-10px -10px 0 0" } : {}) }}>
          <X size={touch ? 22 : 16} />
        </button>
      </div>
      <div style={{
        fontFamily: FONT_MONO, fontSize: fs(22), textAlign: "right", color: T.ink, background: T.paper,
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
// One-line, whitespace-collapsed start of a question's vignette (for the Tutor-mode navigator).
function vignettePreview(q) {
  return String(q?.vignette || "").replace(/\s+/g, " ").trim().slice(0, 160);
}

// Home / lobby / results / summary render in their own full-viewport scroll layer, exactly like the exam screen does, so
// they are not boxed in by whatever container the app is mounted in.
function FullPage({ T, children }) {
  return (
    <div style={{ position: "fixed", inset: 0, overflowY: "auto", background: T.paper, textAlign: "left" }}>
      {children}
    </div>
  );
}

function ExamScreen({ block, blockState, setBlockState, onSubmitBlock, onRate, onHome, darkMode, setDarkMode }) {
  // Resume on the question the student was last viewing (clamped in case the stored value is stale).
  const [qIdx, setQIdx] = useState(() => {
    const n = Math.floor(Number(blockState.currentQuestionIndex) || 0);
    return Math.min(Math.max(0, n), block.questions.length - 1);
  });
  const [confirmSubmit, setConfirmSubmit] = useState(false);
  const [confirmTimerOff, setConfirmTimerOff] = useState(false);
  const [timeUp, setTimeUp] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  // The question list can fold into a slim rail to give the question more room; the choice is remembered.
  const [navCollapsed, setNavCollapsed] = useState(() => lsGet("navCollapsed") === true);
  const toggleNav = () => setNavCollapsed((v) => { lsSet("navCollapsed", JSON.stringify(!v)); return !v; });
  const [labOpen, setLabOpen] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);
  const [calcOpen, setCalcOpen] = useState(false);
  const [locked, setLocked] = useState(false);
  const [hintsEnabled, setHintsEnabled] = useState(true);
  const [showHint, setShowHint] = useState(false);
  const [toggledDistractors, setToggledDistractors] = useState([]); // option keys flipped from their default (own wrong pick: open, others: closed)
  const [labSearch, setLabSearch] = useState("");
  const [labTab, setLabTab] = useState("Serum");
  const [siUnits, setSiUnits] = useState(false);

  const { highlightsMap, pending, handleSelectionInContainer, commitPending, handleGlobalKeyDown, removeHighlight, clearPending } = useHighlighter(blockState.highlights);

  // Mirror question position and highlights into blockState so App's auto-save captures them.
  useEffect(() => {
    setBlockState((prev) => (prev.currentQuestionIndex === qIdx ? prev : { ...prev, currentQuestionIndex: qIdx }));
  }, [qIdx]);
  useEffect(() => {
    setBlockState((prev) => (prev.highlights === highlightsMap ? prev : { ...prev, highlights: highlightsMap }));
  }, [highlightsMap]);

  const T = darkMode ? DARK : LIGHT;
  const { t, lang } = useI18n();
  const tutorMode = !!blockState.tutor;
  const vp = useViewport();
  const compact = vp.w < 980;           // tablets / small windows: lab panel overlays, navigator slims down
  const narrow = vp.w < 640;            // phones: icon-only toolbar, tighter padding
  const short = vp.h < 480;             // landscape phones
  const labW = Math.round(400 * Math.min(Math.max(1, TEXT_SCALE), 1.4));
  const lh = (h) => (lang === "es" ? LAB_HDR_ES[h] || h : h);
  const lv = (v) => labVal(v, lang);
  const questions = block.questions;
  const q = questions[qIdx];
  const qState = blockState.answers[q.id] || { selected: null, struck: [], flagged: false, checked: false };
  // Tutor mode: once an answer is checked, show right/wrong + explanations and lock the question until reset.
  const revealed = tutorMode && !!qState.checked && !!qState.selected;
  // A wrong pick does NOT disclose the correct answer: the student asks for it with a button (qState.answerRevealed).
  const isCorrectPick = revealed && qState.selected === q.correctAnswer;
  const showAnswer = revealed && (isCorrectPick || !!qState.answerRevealed);
  // Hint button (the question's `hint` field) is only for timed blocks once the timer has been turned off.
  const hintAvailable = hintsEnabled && !tutorMode && !!blockState.timerOff;
  const noteText = blockState.notes?.[q.id] || "";
  // Tutor aids are on-demand: Key Info highlights the vignette's key phrases, Tutor's Tip opens a drawer.
  const clueInfo = getClues(q.vignette, q.keyInfoPhrases);

  useEffect(() => { setShowHint(false); setToggledDistractors([]); clearPending(); }, [qIdx]);

  // Alt+H (Option+H on macOS) applies a highlight to the current text
  // selection, wherever the cursor is within the question content.
  useEffect(() => {
    const handler = (e) => handleGlobalKeyDown(e, q.id);
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [q.id, handleGlobalKeyDown]);

  // NBME-style navigation/answer shortcuts. Alt+N / Alt+P / Alt+J work from
  // anywhere; bare 1-5 / A-E only fire when the user isn't typing into an
  // input, textarea, or the Notes/Lab-search/Focus fields — otherwise typing
  // "a" in a note would select answer A.
  useEffect(() => {
    function handler(e) {
      const tag = document.activeElement?.tagName;
      const isTyping = tag === "INPUT" || tag === "TEXTAREA";
      if (locked || confirmSubmit || confirmTimerOff || timeUp) return;

      if (e.altKey) {
        const k = e.key.toLowerCase();
        if (k === "n") { e.preventDefault(); goNext(); return; }
        if (k === "p") { e.preventDefault(); goPrev(); return; }
        if (k === "j") { e.preventDefault(); toggleFlag(); return; }
        if (k === "r" && tutorMode) { e.preventDefault(); resetQuestion(); return; }
        return;
      }

      if (isTyping || e.ctrlKey || e.metaKey || e.shiftKey) return;

      const digitIdx = ["1", "2", "3", "4", "5"].indexOf(e.key);
      if (digitIdx !== -1 && digitIdx < q.options.length) {
        e.preventDefault();
        selectOption(q.options[digitIdx].key);
        return;
      }
      const letterOpt = q.options.find((o) => o.key.toLowerCase() === e.key.toLowerCase());
      if (letterOpt && /^[a-eA-E]$/.test(e.key)) {
        e.preventDefault();
        selectOption(letterOpt.key);
      }
    }
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [q, qState, locked, confirmSubmit, confirmTimerOff, timeUp, tutorMode]);

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

  const timed = blockState.timed && !blockState.timerOff; // false once the student turns the timer off

  // Timer — only runs when this block is set to timed
  useEffect(() => {
    if (blockState.status !== "in-progress" || !timed) return;
    const interval = setInterval(() => {
      setBlockState((prev) => {
        if (locked) return prev;
        if (prev.timeLeft <= 1) { clearInterval(interval); return prev.timeLeft === 0 ? prev : { ...prev, timeLeft: 0 }; }
        return { ...prev, timeLeft: prev.timeLeft - 1 };
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [blockState.status, setBlockState, locked, timed]);

  useEffect(() => {
    if (blockState.status === "in-progress" && timed && blockState.timeLeft === 0) setTimeUp(true);
  }, [blockState.timeLeft, blockState.status, timed]);

  function updateQState(patch) {
    setBlockState((prev) => ({ ...prev, answers: { ...prev.answers, [q.id]: { ...qState, ...patch } } }));
  }
  function setNote(text) {
    setBlockState((prev) => ({ ...prev, notes: { ...prev.notes, [q.id]: text } }));
  }
  function selectOption(key) {
    if (revealed || qState.struck.includes(key)) return;
    if (tutorMode) {
      // Tutor mode: picking an option checks it immediately and locks the question.
      updateQState({ selected: key, checked: true });
      return;
    }
    updateQState({ selected: qState.selected === key ? null : key, checked: false });
  }
  // Tutor mode: wipe this question's answer, strikeouts and feedback so it can be retried. The flag is kept.
  // hintUsed is deliberately sticky: a hint seen before answering still counts after a reset.
  function resetQuestion() {
    updateQState({ selected: null, struck: [], checked: false, answerRevealed: false, keyInfoOn: false, tipOpen: false });
    setShowHint(false);
    setToggledDistractors([]);
  }
  function toggleDistractor(key) {
    setToggledDistractors((cur) => (cur.includes(key) ? cur.filter((k) => k !== key) : [...cur, key]));
  }
  // Toggle Key Info / Tutor's Tip. Opening either one before the answer is checked flags the question as hintUsed.
  function toggleTutorAid(field) {
    const next = !qState[field];
    const patch = { [field]: next };
    if (next && !revealed) patch.hintUsed = true;
    updateQState(patch);
  }
  function toggleStrike(e, key) {
    e.stopPropagation();
    if (revealed) return;
    const struck = qState.struck.includes(key) ? qState.struck.filter((k) => k !== key) : [...qState.struck, key];
    const selected = qState.selected === key && !qState.struck.includes(key) ? null : qState.selected;
    updateQState({ struck, selected });
  }
  function toggleFlag() { updateQState({ flagged: !qState.flagged }); }
  function goNext() {
    if (qIdx < questions.length - 1) setQIdx((i) => i + 1);
    else setConfirmSubmit(true);
  }
  function goPrev() {
    setQIdx((i) => Math.max(0, i - 1));
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

  const showPreview = tutorMode && !compact && !navCollapsed;
  const navAnswered = Object.values(blockState.answers).filter((a) => a.selected).length;

  const toolBtnStyle = (active) => ({
    display: "flex", flexDirection: "column", alignItems: "center", gap: 3, background: "transparent",
    border: "none", cursor: "pointer", color: active ? T.blue : "#fff", fontFamily: FONT_UI, fontSize: fs(11), fontWeight: 600,
    // Phones: every toolbar button gets at least a 48x48 hit area (the old 20px icons were far below touch guidelines).
    ...(narrow ? { justifyContent: "center", minWidth: 48, minHeight: 48, padding: "4px 6px", borderRadius: 8, background: active ? "rgba(255,255,255,0.12)" : "transparent" } : {}),
  });
  // The four tool buttons (Lab Values / Notes / Calculator / Settings) share one full-width row of equal, labelled cells on phones.
  const toolStyle = (active) => ({ ...toolBtnStyle(active), ...(narrow ? { width: "100%" } : {}) });
  const toolLabel = (text) => (narrow
    ? <span style={{ maxWidth: "100%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{text}</span>
    : text);
  const toolIcon = narrow ? 24 : 20;

  // Previous / counter / Next. On phones it is pushed to the far right, away from Home, to avoid accidental Home taps.
  const prevNextEl = (
        <div style={{ display: "flex", alignItems: "center", gap: narrow ? 2 : 18, ...(narrow ? { order: 2, marginLeft: "auto" } : {}) }}>
          <button onClick={goPrev} disabled={qIdx === 0} style={toolBtnStyle(false)} title={t("prev")} aria-label={t("prev")}>
            <ChevronLeft size={26} style={{ opacity: qIdx === 0 ? 0.35 : 1 }} />
            {!narrow && t("prev")}
          </button>
          <span style={{ fontFamily: FONT_UI, fontSize: fs(13) }}>{qIdx + 1} / {questions.length}</span>
          <button onClick={goNext} style={toolBtnStyle(false)} title={t("next")} aria-label={t("next")}>
            <ChevronRight size={26} />
            {!narrow && t("next")}
          </button>
        </div>
  );

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 20, textAlign: "left", display: "flex", flexDirection: "column", background: T.paper, overflow: "hidden" }}>
      <style>{`@import url('${FONT_IMPORT_URL}');`}</style>

      {/* Top toolbar */}
      <div style={{
        background: T.navy, color: "#fff", padding: narrow || short ? "6px 10px" : "10px 20px", display: "flex", alignItems: "center",
        justifyContent: "space-between", flexWrap: "wrap", gap: narrow ? 8 : 14, borderBottom: `1px solid ${T.border}`, flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: narrow ? 10 : 18, ...(narrow ? { order: 1 } : {}) }}>
          {/* Home is a Tutor-mode convenience only: timed blocks (like the real exam) have no mid-block navigation. */}
          {blockState.tutor && onHome && (
            <button onClick={onHome} style={toolBtnStyle(false)} title={t("homeBtn")} aria-label={t("homeBtn")}>
              <HomeIcon size={22} />
              {!narrow && t("homeBtn")}
            </button>
          )}
          {!narrow && (
            <div style={{
              border: `1.5px solid #fff`, borderRadius: 4, padding: "6px 14px", fontFamily: FONT_UI, fontSize: fs(13), lineHeight: 1.5,
            }}>
              {t("item", { n: qIdx + 1, total: questions.length })}<br />{t("blockOf")}
            </div>
          )}
        </div>

        {block.isRetest && (
          <div style={{
            display: "flex", alignItems: "center", gap: 6, background: T.amberLight, color: T.amber,
            border: `1px solid ${T.amber}`, borderRadius: 999, padding: "5px 12px", ...(narrow ? { order: 3, flexBasis: "100%", justifyContent: "center" } : {}),
            fontFamily: FONT_UI, fontSize: fs(12), fontWeight: 700,
          }}>
            <RotateCcw size={13} />
            {t("retestMode", { type: t(RETEST_TITLE[block.retestType] || "rt.full"), n: block.retestCount, items: t(block.retestCount === 1 ? "item1" : "itemN") })}
          </div>
        )}

        {prevNextEl}

        <div style={narrow ? { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 4, width: "100%", order: 4 } : { display: "flex", alignItems: "center", gap: 22 }}>
          <button onClick={() => setLabOpen((v) => !v)} style={toolStyle(labOpen)} title={t("labValues")} aria-label={t("labValues")}>
            <FlaskConical size={toolIcon} /> {toolLabel(t("labValues"))}
          </button>
          <button onClick={() => setNotesOpen((v) => !v)} style={toolStyle(notesOpen)} title={t("notes")} aria-label={t("notes")}>
            <PencilLine size={toolIcon} /> {toolLabel(t("notes"))}
          </button>
          <button onClick={() => setCalcOpen((v) => !v)} style={toolStyle(calcOpen)} title={t("calc")} aria-label={t("calc")}>
            <CalcIcon size={toolIcon} /> {toolLabel(t("calc"))}
          </button>
          <div style={{ position: "relative" }}>
            <button onClick={() => setSettingsOpen((v) => !v)} style={toolStyle(settingsOpen)} title={t("settings")} aria-label={t("settings")}>
              <SettingsIcon size={toolIcon} /> {toolLabel(t("settings"))}
            </button>
            {settingsOpen && (
              <div style={{
                position: "absolute", top: narrow ? 58 : 44, right: 0, background: T.card, color: T.ink, border: `1px solid ${T.border}`,
                borderRadius: 8, padding: 14, width: narrow ? "min(280px, calc(100vw - 16px))" : 230, zIndex: 70, boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
                ...(narrow ? { maxHeight: "70vh", overflowY: "auto" } : {}),
              }}>
                <label style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: FONT_UI, fontSize: fs(13), cursor: "pointer", marginBottom: 10, minHeight: narrow ? 40 : undefined }}>
                  <input type="checkbox" style={narrow ? { width: 22, height: 22 } : undefined} checked={darkMode} onChange={() => setDarkMode((v) => !v)} />
                  {t("dark")}
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: FONT_UI, fontSize: fs(13), cursor: "pointer", marginBottom: 12, minHeight: narrow ? 40 : undefined }}>
                  <input type="checkbox" style={narrow ? { width: 22, height: 22 } : undefined} checked={hintsEnabled} onChange={() => setHintsEnabled((v) => !v)} />
                  {t("hints")}
                </label>
                <div style={{ fontFamily: FONT_UI, fontSize: fs(13), marginBottom: 12 }}>
                  <span style={{ color: T.muted }}>{t("modeLabel")}: </span><strong>{tutorMode ? t("tutorShort") : t("timed")}</strong>
                  <div style={{ fontSize: fs(11.5), color: T.muted, lineHeight: 1.45, marginTop: 2 }}>{t("modeLocked")}</div>
                </div>
                {!tutorMode && (
                  <div style={{ fontFamily: FONT_UI, fontSize: fs(13), marginBottom: 12, paddingTop: 10, borderTop: `1px solid ${T.border}` }}>
                    <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: timed ? "pointer" : "not-allowed", opacity: timed ? 1 : 0.7 }}>
                      <input type="checkbox" style={narrow ? { width: 22, height: 22 } : undefined} checked={timed} disabled={!timed} onChange={() => { setSettingsOpen(false); setConfirmTimerOff(true); }} />
                      {t("timerLabel")}
                    </label>
                    <div style={{ fontSize: fs(11.5), color: T.muted, lineHeight: 1.45, margin: "4px 0 0 24px" }}>
                      {timed ? t("timerOnHint") : t("timerOffNote")}
                    </div>
                  </div>
                )}
                <LangSelect T={T} />
                <TextSizeControl T={T} />
                <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 10 }}>
                  <div style={{ fontFamily: FONT_UI, fontWeight: 700, fontSize: fs(11), color: T.muted, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 6 }}>
                    {t("shortcuts")}
                  </div>
                  <div style={{ display: "grid", gap: 4, fontFamily: FONT_UI, fontSize: fs(12), color: T.muted }}>
                    <div><strong style={{ color: T.ink }}>1–5 / A–E</strong> — {t("sc.select")}</div>
                  </div>
                </div>
                <ResetDataControl T={T} />
              </div>
            )}
          </div>
        </div>
      </div>

      <div style={{ flex: 1, display: "flex", minHeight: 0, overflow: "hidden", position: "relative" }}>
        {/* Left navigator. Tutor mode (on screens wide enough) adds a progress header and a one-line vignette preview per row. */}
        {/* Phones: the question list is hidden entirely so the question gets the full width. */}
        {!narrow && (
        <div style={{
          width: Math.round((navCollapsed ? (compact ? 56 : 72) : compact ? 76 : tutorMode ? 280 : 130) * Math.min(TEXT_SCALE, 1.3)), transition: "width 0.18s ease", flexShrink: 0, background: T.card, borderRight: `1px solid ${T.border}`, padding: "16px 0",
          display: "flex", flexDirection: "column", overflow: "hidden",
        }}>
          <div style={{ display: "flex", justifyContent: navCollapsed ? "center" : "flex-end", padding: navCollapsed ? "0 0 8px" : "0 10px 6px" }}>
            <button
              onClick={toggleNav}
              title={navCollapsed ? t("navExpand") : t("navCollapse")}
              aria-label={navCollapsed ? t("navExpand") : t("navCollapse")}
              aria-expanded={!navCollapsed}
              style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 28, height: 26, borderRadius: 6, cursor: "pointer", background: "transparent", color: T.muted, border: `1px solid ${T.border}` }}
            >
              {navCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            </button>
          </div>
          {navCollapsed ? null : tutorMode && !compact ? (
            <div style={{ padding: "0 16px 12px", borderBottom: `1px solid ${T.border}`, marginBottom: 6 }}>
              <div style={{ fontFamily: FONT_UI, fontWeight: 700, fontSize: fs(13), color: T.ink, marginBottom: 8, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {blockLabel(block, t)}
              </div>
              <div style={{ fontFamily: FONT_MONO, fontSize: fs(12), color: darkMode ? T.ink : T.muted, marginBottom: 6 }}>
                {navAnswered}/{questions.length}
              </div>
              <div style={{ height: 3, borderRadius: 2, background: T.border, overflow: "hidden" }}>
                <div style={{ width: `${questions.length ? (navAnswered / questions.length) * 100 : 0}%`, height: "100%", background: T.blue }} />
              </div>
            </div>
          ) : (
            <div style={{
              fontFamily: FONT_UI, fontWeight: 700, fontSize: fs(13), color: T.ink, textAlign: "center", marginBottom: 10,
            }}>
              {compact ? "" : t("qStatus")}
            </div>
          )}
          <div style={{ flex: 1, overflowY: "auto" }}>
            {questions.map((qq, i) => {
              const st = blockState.answers[qq.id];
              const isCurrent = i === qIdx;
              const navChecked = tutorMode && !!st?.checked && !!st?.selected;
              const navCorrect = navChecked && st.selected === qq.correctAnswer;
              return (
                <div
                  key={qq.id}
                  onClick={() => setQIdx(i)}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: showPreview ? "flex-start" : "center", gap: showPreview ? 10 : 6, padding: showPreview ? "7px 16px" : "6px 0",
                    flexWrap: navCollapsed ? "wrap" : "nowrap", rowGap: 2,
                    cursor: "pointer", background: isCurrent ? T.blue : "transparent",
                    color: isCurrent ? T.onBlue : T.ink, fontFamily: FONT_UI, fontSize: fs(14),
                  }}
                >
                  <span style={{
                    fontSize: fs(navChecked ? 12 : 9), fontWeight: navChecked ? 700 : 400, opacity: st?.selected ? 1 : 0.35,
                    color: navChecked && !isCurrent ? (navCorrect ? T.green : T.red) : "inherit",
                  }}>{navChecked ? (navCorrect ? "✓" : "✕") : "●"}</span>
                  <span style={showPreview ? { minWidth: 20, fontWeight: 700 } : undefined}>{i + 1}</span>
                  {st?.flagged && <Flag size={11} color={isCurrent ? T.onBlue : T.flagRed} fill={isCurrent ? T.onBlue : T.flagRed} />}
                  {tutorMode && st?.hintUsed && (
                    <span title={t("hintUsedBadge")} aria-label={t("hintUsedBadge")} style={{ width: 9, height: 9, borderRadius: 999, boxSizing: "border-box", border: `2px solid ${HINT_YELLOW}`, background: "transparent", flexShrink: 0 }} />
                  )}
                  {showPreview && (
                    <span title={vignettePreview(qq)} style={{
                      flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                      fontSize: fs(12.5), color: isCurrent ? T.onBlue : darkMode ? T.ink : T.muted, // white in dark mode for contrast
                    }}>
                      {vignettePreview(qq)}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
        )}

        {/* Question body */}
        <div style={{ flex: 1, minWidth: 0, padding: narrow ? "18px 16px 28px" : compact ? "24px 24px 32px" : "30px 40px 40px", maxWidth: Math.round(900 * Math.max(1, TEXT_SCALE)), margin: "0 auto", overflowY: "auto", minHeight: 0 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
              <input type="checkbox" checked={qState.flagged} onChange={toggleFlag} />
              <Flag size={16} color={T.flagRed} fill={T.flagRed} />
              <span style={{ fontFamily: FONT_UI, fontWeight: 600, fontSize: fs(14), color: T.ink }}>{t("mark")}</span>
            </label>

            {hintAvailable && (
              <button
                onClick={() => setShowHint((v) => !v)}
                style={{
                  display: "flex", alignItems: "center", gap: 6, background: "transparent",
                  border: `1px solid ${T.border}`, borderRadius: 6, padding: "6px 12px", cursor: "pointer",
                  fontFamily: FONT_UI, fontWeight: 600, fontSize: fs(13), color: T.blue,
                }}
              >
                <Lightbulb size={15} />
                {showHint ? t("hideHint") : t("showHint")}
              </button>
            )}
          </div>

          <p style={{ fontFamily: FONT_UI, fontSize: fs(11.5), color: T.muted, margin: "0 0 14px", display: "flex", alignItems: "center", gap: 5 }}>
            <Highlighter size={12} /> {t("hlTip")}
          </p>

          {hintAvailable && showHint && (
            <div style={{
              display: "flex", gap: 8, alignItems: "flex-start", background: T.blueLight, color: T.ink,
              border: `1px solid ${T.blue}`, borderRadius: 6, padding: "10px 14px", marginBottom: 18,
              fontFamily: FONT_UI, fontSize: fs(13.5), lineHeight: 1.5,
            }}>
              <Lightbulb size={16} color={T.blue} style={{ flexShrink: 0, marginTop: 1 }} />
              <span>{q.hint || t("noHint")}</span>
            </div>
          )}

          {tutorMode && qState.hintUsed && (
            <div style={{ marginBottom: 10 }}><Pill T={T} tone="amber">{t("hintUsedBadge")}</Pill></div>
          )}
          <p
            data-hl-field="vignette"
            onMouseUp={(e) => handleSelectionInContainer(q.id, "vignette", e.currentTarget)}
            onKeyUp={(e) => handleSelectionInContainer(q.id, "vignette", e.currentTarget)}
            style={{ fontFamily: FONT_DISPLAY, fontSize: fs(17), lineHeight: 1.75, color: T.ink, margin: "0 0 20px", cursor: "text" }}
          >
            {renderHighlightedText(q.vignette, highlightsMap[q.id]?.vignette, (hlId) => removeHighlight(q.id, "vignette", hlId), tutorMode && qState.keyInfoOn ? clueInfo.ranges : null, clueStyleFor(T))}
          </p>
          {tutorMode && (
            <div style={{ margin: "-8px 0 18px" }}>
              <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8 }}>
                {[
                  { id: "keyInfoOn", label: "keyInfoBtn", available: clueInfo.phrases.length > 0, missing: "noKeyInfo", on: !!qState.keyInfoOn, click: () => toggleTutorAid("keyInfoOn") },
                  { id: "tipOpen", label: "tipBtn", available: !!q.attendingTip, missing: "noTipAvail", on: !!qState.tipOpen, expandable: true, click: () => toggleTutorAid("tipOpen") },
                ].map((b) => {
                  const on = b.on && b.available;
                  return (
                    <button
                      key={b.id}
                      aria-pressed={on}
                      aria-expanded={b.expandable ? on : undefined}
                      disabled={!b.available}
                      title={b.available ? undefined : t(b.missing)}
                      onClick={b.click}
                      style={{
                        display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 999,
                        fontFamily: FONT_UI, fontWeight: 600, fontSize: fs(13),
                        cursor: b.available ? "pointer" : "not-allowed", opacity: b.available ? 1 : 0.45,
                        background: on ? T.blueLight : "transparent", color: on ? T.blueDeep : T.blue,
                        border: `1px solid ${on ? T.blue : T.border}`,
                      }}
                    >
                      {t(b.label)}
                      {b.expandable && (on ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
                    </button>
                  );
                })}
                <span style={{ marginLeft: "auto" }}><DifficultyMeter value={q.difficultyRating} label={q.difficultyLabel} T={T} /></span>
              </div>
              {qState.tipOpen && q.attendingTip && (
                <div style={{ background: T.paper, borderLeft: `3px solid ${T.blue}`, borderRadius: 8, padding: "12px 14px", marginTop: 10, maxWidth: 720 }}>
                  <div style={{ fontFamily: FONT_UI, fontWeight: 700, fontSize: fs(12), color: T.blue, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em", display: "flex", alignItems: "center", gap: 6 }}>
                    <Stethoscope size={14} /> {t("attendingTip")}
                  </div>
                  <p style={{ fontFamily: FONT_UI, fontSize: fs(13.5), color: T.ink, lineHeight: 1.6, margin: 0 }}>{q.attendingTip}</p>
                </div>
              )}
            </div>
          )}
          <p
            data-hl-field="stem"
            onMouseUp={(e) => handleSelectionInContainer(q.id, "stem", e.currentTarget)}
            onKeyUp={(e) => handleSelectionInContainer(q.id, "stem", e.currentTarget)}
            style={{ fontFamily: FONT_DISPLAY, fontSize: fs(17), lineHeight: 1.6, color: T.ink, marginBottom: 18, cursor: "text" }}
          >
            {renderHighlightedText(q.stem, highlightsMap[q.id]?.stem, (hlId) => removeHighlight(q.id, "stem", hlId))}
          </p>

          <div style={{ border: `1.5px solid ${T.border}`, borderRadius: 4, maxWidth: 640 }}>
            {q.options.map((opt, i) => {
              const isSelected = qState.selected === opt.key;
              const isStruck = qState.struck.includes(opt.key);
              const isCorrectOpt = opt.key === q.correctAnswer;
              const showCorrect = showAnswer && isCorrectOpt;
              const showWrong = revealed && isSelected && !isCorrectOpt;
              // Distractor dropdown: on the student's own wrong pick right away, on every wrong choice once the answer is shown
              // (offering it only on wrong choices before that would reveal the correct one by omission).
              const hasAnalysis = revealed && !isCorrectOpt && !!q.distractorAnalysis?.[opt.key] && (showAnswer || isSelected);
              const analysisOpen = hasAnalysis && (isSelected !== toggledDistractors.includes(opt.key)); // own wrong pick auto-opens
              return (
                <div
                  key={opt.key}
                  style={{ borderBottom: i < q.options.length - 1 ? `1px solid ${T.border}` : "none" }}
                >
                  <div
                    onClick={() => {
                      const sel = window.getSelection();
                      if (sel && sel.toString().trim().length > 0) return; // user was selecting text, not choosing an answer
                      selectOption(opt.key);
                    }}
                    style={{
                      display: "flex", alignItems: "center", gap: 10, cursor: revealed ? "default" : "pointer",
                      background: showCorrect ? T.greenStrong : showWrong ? T.redStrong : isSelected ? T.blueLight : "transparent",
                      padding: "10px 14px",
                    }}
                  >
                    <input type="radio" checked={isSelected} onChange={() => selectOption(opt.key)} disabled={isStruck || revealed} />
                    <span
                      data-hl-field={`option-${opt.key}`}
                      onMouseUp={(e) => { e.stopPropagation(); handleSelectionInContainer(q.id, `option-${opt.key}`, e.currentTarget); }}
                      onKeyUp={(e) => { e.stopPropagation(); handleSelectionInContainer(q.id, `option-${opt.key}`, e.currentTarget); }}
                      style={{
                        fontFamily: FONT_DISPLAY, fontSize: fs(15.5), color: T.ink, flex: 1,
                        textDecoration: isStruck ? "line-through" : "none", opacity: isStruck ? 0.5 : 1,
                      }}
                    >
                      {opt.key}. {renderHighlightedText(opt.text, highlightsMap[q.id]?.[`option-${opt.key}`], (hlId) => removeHighlight(q.id, `option-${opt.key}`, hlId))}
                    </span>
                    {showCorrect && <CheckCircle2 size={18} color={T.green} style={{ flexShrink: 0 }} />}
                    {showWrong && <XCircle size={18} color={T.red} style={{ flexShrink: 0 }} />}
                    {!revealed && (
                      <button
                        onClick={(e) => toggleStrike(e, opt.key)}
                        title={t("strike")}
                        style={{
                          background: "transparent", border: "none", cursor: "pointer", fontFamily: FONT_DISPLAY,
                          fontSize: fs(13), color: T.muted, textDecoration: "line-through", padding: "0 4px",
                        }}
                      >
                        ab
                      </button>
                    )}
                  </div>
                  {hasAnalysis && (
                    <div style={{ padding: showWrong ? "10px 14px 12px 42px" : "0 14px 10px 42px", background: showWrong ? T.redSoft : "transparent" }}>
                      <button
                        aria-expanded={analysisOpen}
                        onClick={() => toggleDistractor(opt.key)}
                        style={{
                          display: "inline-flex", alignItems: "center", gap: 4, padding: 0, background: "transparent", border: "none", cursor: "pointer",
                          fontFamily: FONT_UI, fontWeight: 600, fontSize: fs(12.5), color: T.blue,
                        }}
                      >
                        {t("distractorBtn")}
                        {analysisOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                      </button>
                      {analysisOpen && (
                        <div style={{ fontFamily: FONT_UI, fontSize: fs(13), color: showWrong ? T.ink : T.muted, lineHeight: 1.55, marginTop: 6 }}>
                          {q.distractorAnalysis[opt.key]}
                        </div>
                      )}
                    </div>
                  )}
                  {showCorrect && (
                    <div style={{ background: T.greenSoft, padding: "14px 14px 14px 42px" }}>
                      <ExplanationPanels q={q} T={T} showTip={false} showClues={false} flat rating={q.meta?.rating ?? null} onRate={tutorMode && onRate ? (k) => onRate(q, k) : null} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Tutor mode: a wrong pick does not disclose the answer until asked for */}
          {revealed && !isCorrectPick && !showAnswer && (
            <div style={{ marginTop: 12 }}>
              <GhostButton T={T} onClick={() => updateQState({ answerRevealed: true })}>{t("showCorrectBtn")}</GhostButton>
            </div>
          )}

          <div style={{ marginTop: 22, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", maxWidth: 640 }}>
            <PrimaryButton T={T} onClick={goNext} style={{ background: T.blue }}>
              {qIdx < questions.length - 1 ? t("proceedNext") : t("proceedSummary")}
            </PrimaryButton>
            {tutorMode && (qState.selected || qState.struck.length > 0) && (
              <GhostButton T={T} icon={RotateCcw} onClick={resetQuestion} style={{ marginLeft: "auto" }}>{t("resetQ")}</GhostButton>
            )}
          </div>
        </div>

        {/* Lab values panel — in-flow split view, not an overlay, so the question stays visible */}
        {labOpen && (
          <div style={{
            ...(compact
              ? { position: "absolute", top: 0, right: 0, bottom: 0, zIndex: 40, width: `min(${labW}px, 100%)`, boxShadow: "-8px 0 24px rgba(0,0,0,0.35)" }
              : { width: labW, flexShrink: 0 }),
            background: T.card, borderLeft: `1px solid ${T.border}`,
            display: "flex", flexDirection: "column", minHeight: 0, overflow: "hidden",
          }}>
            {/* Fixed header: title/close, search, and tabs all stay put no matter how far the list below is scrolled */}
            <div style={{ flexShrink: 0, padding: "18px 18px 12px", borderBottom: `1px solid ${T.border}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <span style={{ fontFamily: FONT_UI, fontWeight: 700, fontSize: fs(14), color: T.ink }}>{t("labValues")}</span>
                <button onClick={() => setLabOpen(false)} aria-label={t("guideClose")} style={{ background: "transparent", border: "none", cursor: "pointer", color: T.muted, ...(narrow ? { minWidth: 44, minHeight: 44 } : {}) }}>
                  <X size={16} />
                </button>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 6, border: `1px solid ${T.border}`, borderRadius: 6, padding: "6px 10px", marginBottom: 12 }}>
                <Search size={14} color={T.muted} />
                <input
                  value={labSearch}
                  onChange={(e) => setLabSearch(e.target.value)}
                  placeholder={t("search")}
                  style={{ border: "none", outline: "none", fontFamily: FONT_UI, fontSize: fs(13), flex: 1, background: "transparent", color: T.ink }}
                />
              </div>

              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {LAB_TABS.map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setLabTab(tab)}
                    style={{
                      fontFamily: FONT_UI, fontSize: fs(12), fontWeight: 600, padding: "6px 10px", borderRadius: 999,
                      border: `1px solid ${labTab === tab ? T.blue : T.border}`,
                      background: labTab === tab ? T.blueLight : "transparent",
                      color: labTab === tab ? T.blue : T.muted, cursor: "pointer",
                    }}
                  >
                    {t("tab." + tab)}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ flex: 1, overflowY: "auto", padding: 18 }}>
              <label style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: FONT_UI, fontSize: fs(12.5), color: T.ink, marginBottom: 14, cursor: "pointer" }}>
                <input type="checkbox" checked={siUnits} onChange={() => setSiUnits((v) => !v)} />
                {t("siIntervals")}
              </label>

              <div style={{
                display: "flex", justifyContent: "space-between", padding: "4px 4px 8px", borderBottom: `1.5px solid ${T.border}`,
                fontFamily: FONT_UI, fontSize: fs(11.5), fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: "0.04em",
              }}>
                <span>{t("tab." + labTab)}</span>
                <span>{siUnits ? t("siHdr") : t("refRange")}</span>
              </div>

              <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: FONT_UI, fontSize: fs(12.5) }}>
                <tbody>
                  {filteredLabRows.map((row, i) =>
                    row.h ? (
                      <tr key={`h-${i}`}>
                        <td colSpan={2} style={{ padding: "12px 4px 4px", fontWeight: 700, color: T.blue, fontSize: fs(12.5) }}>
                          {lh(row.h)}
                        </td>
                      </tr>
                    ) : (
                      <tr key={row.name} style={{ borderBottom: `1px solid ${T.border}` }}>
                        <td style={{ padding: "6px 4px 6px", paddingLeft: row.sub ? 16 : 4, color: T.ink }}>{row.name}</td>
                        <td style={{ padding: "6px 4px", color: T.muted, textAlign: "right", whiteSpace: "nowrap" }}>
                          {lv(siUnits ? row.si : row.value)}
                        </td>
                      </tr>
                    )
                  )}
                  {filteredLabRows.length === 0 && (
                    <tr><td colSpan={2} style={{ padding: "16px 4px", color: T.muted, fontStyle: "italic" }}>{t("noMatches", { tab: t("tab." + labTab) })}</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Bottom bar */}
      <div style={{
        background: T.navy, color: "#fff", padding: narrow || short ? "6px 10px" : "10px 20px", display: "flex", alignItems: "center",
        justifyContent: "space-between", flexWrap: "wrap", gap: 8, borderTop: `1px solid ${T.border}`, flexShrink: 0,
      }}>
        {/* Phones: Lock far left, End Block far right, both icon-only. The status text is dropped, except that a running
            countdown stays visible (a timed block must always show its clock). */}
        {!narrow ? (
          <div style={{ fontFamily: FONT_UI, fontSize: fs(13), lineHeight: 1.5, order: 2 }}>
            <div>{t("timeLeft")}: <span style={{ fontFamily: FONT_MONO }}>{timed ? fmtTime(blockState.timeLeft) : t("untimedLower")}</span></div>
            <div style={{ opacity: 0.75 }}>{t("answered", { a: answeredCount, n: questions.length })}{flaggedCount > 0 ? t("flagged", { f: flaggedCount }) : ""}</div>
          </div>
        ) : timed ? (
          <div style={{ fontFamily: FONT_MONO, fontSize: fs(15), fontWeight: 600, order: 2 }}>{fmtTime(blockState.timeLeft)}</div>
        ) : null}
        <button onClick={() => setLocked(true)} title={t("lock")} aria-label={t("lock")} style={{ ...toolBtnStyle(false), flexDirection: "row", gap: 6, order: narrow ? 1 : 3 }}>
          <Lock size={narrow ? 24 : 18} /> {!narrow && t("lock")}
        </button>
        <button onClick={() => setConfirmSubmit(true)} title={t("endBlock")} aria-label={t("endBlock")} style={{ ...toolBtnStyle(false), flexDirection: "row", gap: 6, order: narrow ? 3 : 4 }}>
          <XOctagon size={narrow ? 24 : 18} /> {!narrow && t("endBlock")}
        </button>
      </div>

      {/* Notes panel */}
      {notesOpen && (
        <div style={{
          position: "fixed", right: !compact && labOpen ? labW + 20 : narrow ? 8 : 24, bottom: 90, width: `min(${Math.round(320 * Math.max(1, TEXT_SCALE))}px, calc(100vw - 16px))`, background: T.card,
          border: `1px solid ${T.border}`, borderRadius: 10, padding: 14, zIndex: 55, boxShadow: "0 8px 28px rgba(0,0,0,0.3)",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ fontFamily: FONT_UI, fontWeight: 700, fontSize: fs(13), color: T.ink }}>{t("notesItem", { n: qIdx + 1 })}</span>
            <button onClick={() => setNotesOpen(false)} aria-label={t("guideClose")} style={{ background: "transparent", border: "none", cursor: "pointer", color: T.muted, ...(narrow ? { minWidth: 44, minHeight: 44, margin: "-10px -10px 0 0" } : {}) }}>
              <X size={narrow ? 22 : 16} />
            </button>
          </div>
          <textarea
            value={noteText}
            onChange={(e) => setNote(e.target.value)}
            style={{
              width: "100%", minHeight: 130, fontFamily: FONT_UI, fontSize: fs(13), border: `1px solid ${T.border}`,
              borderRadius: 6, padding: 8, resize: "vertical", boxSizing: "border-box", background: T.paper, color: T.ink,
            }}
          />
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10 }}>
            <GhostButton T={T} icon={Trash2} onClick={() => setNote("")}>{t("delNote")}</GhostButton>
            <PrimaryButton T={T} onClick={() => setNotesOpen(false)}>{t("saveClose")}</PrimaryButton>
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
            fontSize: fs(12.5), cursor: "pointer", boxShadow: "0 4px 14px rgba(0,0,0,0.35)",
          }}
        >
          <Highlighter size={13} />
          {t("highlight")}
        </button>
      )}

      {/* Lock overlay */}
      {locked && (
        <div style={{
          position: "fixed", inset: 0, background: T.navyDeep, display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", zIndex: 90, gap: 18,
        }}>
          <Lock size={36} color="#fff" />
          <p style={{ fontFamily: FONT_UI, fontSize: fs(15), color: "#fff" }}>{t("paused")}</p>
          <PrimaryButton T={T} icon={Unlock} onClick={() => setLocked(false)}>{t("resume")}</PrimaryButton>
        </div>
      )}

      {/* Turn-off-timer confirmation (one-way: the timer can't be re-enabled) */}
      {confirmTimerOff && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(10,15,20,0.6)", display: "flex", alignItems: "center",
          justifyContent: "center", zIndex: 95, padding: 20,
        }}>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 28, maxWidth: 420 }}>
            <h3 style={{ fontFamily: FONT_UI, fontSize: fs(17), fontWeight: 700, color: T.ink, margin: "0 0 10px" }}>{t("timerOffTitle")}</h3>
            <p style={{ fontFamily: FONT_UI, fontSize: fs(14), color: T.muted, lineHeight: 1.55, margin: "0 0 20px" }}>{t("timerOffBody")}</p>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <GhostButton T={T} onClick={() => setConfirmTimerOff(false)}>{t("keepTimer")}</GhostButton>
              <PrimaryButton T={T} onClick={() => { setBlockState((prev) => ({ ...prev, timerOff: true })); setConfirmTimerOff(false); }}>{t("turnOffTimer")}</PrimaryButton>
            </div>
          </div>
        </div>
      )}

      {/* End block confirmation */}
      {confirmSubmit && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(10,15,20,0.6)", display: "flex", alignItems: "center",
          justifyContent: "center", zIndex: 95, padding: 20,
        }}>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 28, maxWidth: 400 }}>
            <h3 style={{ fontFamily: FONT_UI, fontSize: fs(17), fontWeight: 700, color: T.ink, margin: "0 0 10px" }}>
              {t("endQ")}
            </h3>
            <p style={{ fontFamily: FONT_UI, fontSize: fs(14), color: T.muted, lineHeight: 1.55, margin: "0 0 20px" }}>
              {t("endConfirm", { a: answeredCount, n: questions.length })}
            </p>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <GhostButton T={T} onClick={() => setConfirmSubmit(false)}>{t("keepWorking")}</GhostButton>
              <PrimaryButton T={T} onClick={() => { setConfirmSubmit(false); onSubmitBlock(); }}>{t("endBlockBtn")}</PrimaryButton>
            </div>
          </div>
        </div>
      )}

      {/* Time's up notice — shown instead of silently auto-submitting when the countdown hits zero */}
      {timeUp && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(10,15,20,0.6)", display: "flex", alignItems: "center",
          justifyContent: "center", zIndex: 95, padding: 20,
        }}>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 28, maxWidth: 400 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <Clock size={20} color={T.red} />
              <h3 style={{ fontFamily: FONT_UI, fontSize: fs(17), fontWeight: 700, color: T.ink, margin: 0 }}>
                {t("timesUp")}
              </h3>
            </div>
            <p style={{ fontFamily: FONT_UI, fontSize: fs(14), color: T.muted, lineHeight: 1.55, margin: "0 0 20px" }}>
              {t("timesUpBody", { a: answeredCount, n: questions.length })}
            </p>
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <PrimaryButton T={T} onClick={() => { setTimeUp(false); onSubmitBlock(); }}>{t("viewResults")}</PrimaryButton>
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
// Clue highlight style, shared by the vignette and the key-clue chips.
const clueStyleFor = (T) => ({ background: T.greenLight, borderBottom: `2px solid ${T.green}` });

// Five-pip difficulty rating (1-5), shown after an answer is revealed and in block review.
function DifficultyMeter({ value, label, T }) {
  const { t } = useI18n();
  const d = resolveDifficulty(value, label);
  if (!d) return null;
  const n = d.rating;
  return (
    <span title={t("diffTitle", { n })} style={{ display: "inline-flex", alignItems: "center", gap: 6, fontFamily: FONT_UI, fontSize: fs(11.5), fontWeight: 600, color: T.muted }}>
      {t("difficulty")}
      <span style={{ display: "inline-flex", gap: 3 }}>
        {[1, 2, 3, 4, 5].map((i) => (
          <span key={i} style={{ width: 8, height: 8, borderRadius: 999, background: i <= n ? T.amber : "transparent", border: `1.5px solid ${T.amber}`, boxSizing: "border-box" }} />
        ))}
      </span>
      <span style={{ color: T.ink }}>{t("dl." + d.tier)}</span>
    </span>
  );
}

// Attending's tip, key clues, explanation, key learning point, educational objective and
// source references for one question. Shared by Tutor mode feedback and the block review.
// Every section is optional, so question banks in the older schema still render.
function SourcesDropdown({ refs, T }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  if (!Array.isArray(refs) || refs.length === 0) return null;
  return (
    <div>
      <button
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        style={{
          display: "flex", alignItems: "center", gap: 6, padding: 0, background: "transparent", border: "none", cursor: "pointer",
          fontFamily: FONT_UI, fontWeight: 700, fontSize: fs(12), color: T.muted, textTransform: "uppercase", letterSpacing: "0.05em",
        }}
      >
        <BookOpen size={13} /> {t("sources")} ({refs.length}) {open ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
      </button>
      {open && (
        <div style={{ display: "grid", gap: 8, marginTop: 8 }}>
          {refs.map((ref, ri) => (
            <div key={ri} style={{ border: `1px solid ${T.border}`, borderRadius: 8, padding: "10px 12px" }}>
              <div style={{ fontFamily: FONT_UI, fontWeight: 600, fontSize: fs(13), color: T.ink }}>
                {ref.sourceTitle}
                {ref.pageNumber && (
                  <span style={{ fontFamily: FONT_MONO, fontWeight: 400, fontSize: fs(11.5), color: T.muted }}> · {t("page")} {ref.pageNumber}</span>
                )}
              </div>
              {ref.chapterSection && (
                <div style={{ fontFamily: FONT_UI, fontSize: fs(12.5), color: T.muted, marginTop: 2 }}>{ref.chapterSection}</div>
              )}
              {ref.relevance && (
                <div style={{ fontFamily: FONT_UI, fontSize: fs(12), color: T.blueDeep, marginTop: 4, fontStyle: "italic" }}>{ref.relevance}</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Anki-style self-rating. Only rendered where an onRate handler is supplied (Tutor Mode reveal + post-exam Review),
// never in Timed testing.
const RATINGS = ["again", "hard", "good", "easy"];
function RatingBar({ value, onRate, T }) {
  const { t } = useI18n();
  const colors = { again: T.red, hard: T.amber, good: T.green, easy: T.blue };
  return (
    <div>
      <div style={{ fontFamily: FONT_UI, fontWeight: 700, fontSize: fs(12), color: T.muted, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>
        {t("rateTitle")}
      </div>
      <div role="radiogroup" aria-label={t("rateTitle")} style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 6 }}>
        {RATINGS.map((k) => {
          const on = value === k;
          return (
            <button key={k} role="radio" aria-checked={on} onClick={(e) => { e.stopPropagation(); onRate(k); }} style={{
              fontFamily: FONT_UI, fontWeight: 700, fontSize: fs(13), padding: "9px 6px", borderRadius: 6, cursor: "pointer",
              border: `1.5px solid ${colors[k]}`, background: on ? colors[k] : "transparent", color: on ? "#fff" : colors[k],
            }}>
              {t(`rate.${k}`)}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ExplanationPanels({ q, T, showTip = true, showClues = true, flat = false, rating = null, onRate = null }) {
  const { t } = useI18n();
  const clues = getClues(q.vignette, q.keyInfoPhrases);
  const label = (color) => ({ fontFamily: FONT_UI, fontWeight: 700, fontSize: fs(12), color, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em", display: "flex", alignItems: "center", gap: 6 });
  const body = { fontFamily: FONT_UI, fontSize: fs(13.5), color: T.ink, lineHeight: 1.6, margin: 0 };
  // flat: no card backgrounds, so the whole block takes the colour of the container it sits in
  const box = (bg, extra) => (flat ? {} : { background: bg, borderRadius: 8, padding: "12px 14px", ...extra });
  return (
    <div style={{ display: "grid", gap: flat ? 14 : 10 }}>
      {showTip && q.attendingTip && (
        <div style={{ background: T.paper, borderRadius: 8, padding: "12px 14px", borderLeft: `3px solid ${T.blue}` }}>
          <div style={label(T.blue)}><Stethoscope size={14} /> {t("attendingTip")}</div>
          <p style={body}>{q.attendingTip}</p>
        </div>
      )}

      {showClues && clues.phrases.length > 0 && (
        <div>
          <div style={label(T.green)}><Search size={13} /> {t("keyClues")}</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {clues.phrases.map((ph, i) => (
              <span key={i} style={{ ...clueStyleFor(T), fontFamily: FONT_UI, fontSize: fs(12.5), color: T.ink, padding: "3px 8px", borderRadius: 4 }}>{ph}</span>
            ))}
          </div>
        </div>
      )}

      {q.explanation && (
        <div style={box(T.paper)}>
          <div style={label(T.blue)}>{t("explanation")}</div>
          <p style={body}>{q.explanation}</p>
        </div>
      )}

      {q.keyLearningPoint && (
        <div style={box(T.amberLight, { border: `1px solid ${T.amber}` })}>
          <div style={label(T.amber)}><Target size={14} /> {t("keyLearningPoint")}</div>
          <p style={body}>{q.keyLearningPoint}</p>
        </div>
      )}

      {q.educationalObjective && (
        <div style={box(T.blueLight)}>
          <div style={label(T.blueDeep)}>{t("eduObj")}</div>
          <p style={body}>{q.educationalObjective}</p>
        </div>
      )}

      <SourcesDropdown refs={q.sourceReferences} T={T} />

      {onRate && <RatingBar value={rating} onRate={onRate} T={T} />}
    </div>
  );
}

// Easy / Medium / Hard score tiles (tracking for the difficulty labels). Hidden unless 2+ tiers are present.
function DifficultyBreakdown({ rows, T }) {
  const { t } = useI18n();
  if (!rows || rows.length < 2) return null;
  return (
    <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: "18px 22px", marginBottom: 22 }}>
      <div style={{ fontFamily: FONT_UI, fontWeight: 700, fontSize: fs(13), color: T.ink, marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.04em" }}>
        {t("perfDifficulty")}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
        {rows.map((r) => (
          <div key={r.id} style={{ flex: "1 1 140px", background: T.paper, borderRadius: 8, padding: "12px 14px" }}>
            <div style={{ fontFamily: FONT_UI, fontWeight: 600, fontSize: fs(12), color: T.muted, textTransform: "uppercase", letterSpacing: "0.04em" }}>{t("dl." + r.id)}</div>
            <div style={{ fontFamily: FONT_MONO, fontWeight: 600, fontSize: fs(24), color: r.pct >= 70 ? T.green : r.pct >= 50 ? T.amber : T.red }}>{r.pct}%</div>
            <div style={{ fontFamily: FONT_MONO, fontSize: fs(12), color: T.muted }}>{r.correct}/{r.total}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function BlockResults({ block, blockState, blockIdx, history, onBackToLobby, onRetest, onRate, onHome, T, darkMode, setDarkMode }) {
  const { t, lang } = useI18n();
  const [expanded, setExpanded] = useState(null);
  const [retestCfg, setRetestCfg] = useState(null); // { pool, mode } while the modal is open
  const { score } = blockState;

  const incorrectQs = block.questions.filter((q) => blockState.answers[q.id]?.selected !== q.correctAnswer);
  const flaggedQs = block.questions.filter((q) => blockState.answers[q.id]?.flagged);
  const ratedCount = (keys) => block.questions.filter((q) => keys.includes(q.meta?.rating)).length;
  const poolCounts = {
    incorrect: incorrectQs.length, flagged: flaggedQs.length, all: block.questions.length,
    again: ratedCount(["again"]), hard: ratedCount(["hard"]), againhard: ratedCount(["again", "hard"]),
  };
  const originIdx = block.isRetest ? block.retestOf : blockIdx;
  const attempts = history.filter((h) => h.originIdx === originIdx);
  const hintCount = block.questions.filter((q) => blockState.answers[q.id]?.hintUsed).length;

  const subjectRows = useMemo(() => {
    const map = {};
    block.questions.forEach((q) => {
      const subj = q.subject || t("general");
      const a = blockState.answers[q.id];
      const correct = a?.selected === q.correctAnswer;
      if (!map[subj]) map[subj] = { subject: subj, correct: 0, total: 0 };
      map[subj].total += 1;
      if (correct) map[subj].correct += 1;
    });
    return Object.values(map).map((r) => ({ ...r, pct: Math.round((r.correct / r.total) * 100) }));
  }, [block, blockState, lang]);

  const difficultyRows = useMemo(
    () => difficultyBreakdown(block.questions.map((q) => ({ rating: q.difficultyRating, label: q.difficultyLabel, correct: blockState.answers[q.id]?.selected === q.correctAnswer }))),
    [block, blockState]
  );

  return (
    <div style={{ maxWidth: Math.round(1120 * Math.max(1, TEXT_SCALE)), margin: "0 auto", padding: "44px 20px 80px" }}>
      <style>{`@import url('${FONT_IMPORT_URL}');`}</style>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
        <span />
        <SettingsMenu darkMode={darkMode} setDarkMode={setDarkMode} T={T} />
      </div>

      <h1 style={{ fontFamily: FONT_DISPLAY, fontSize: fs(28), fontWeight: 600, color: T.ink, margin: "0 0 4px" }}>
        {t("results", { name: blockLabel(block, t) })}
      </h1>
      <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 20 }}>
        <span style={{ fontFamily: FONT_MONO, fontSize: fs(32), fontWeight: 600, color: score.pct >= 70 ? T.green : T.red }}>
          {score.pct}%
        </span>
        <span style={{ fontFamily: FONT_UI, fontSize: fs(14), color: T.muted }}>
          {t("scoreLine", { c: score.correct, t: score.total, u: score.total - score.answered })}
        </span>
        {hintCount > 0 && <Pill T={T} tone="amber">{t("hintsUsedN", { n: hintCount })}</Pill>}
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 28 }}>
        <GhostButton T={T} onClick={onHome} icon={HomeIcon}>{t("homeBtn")}</GhostButton>
      </div>

      {attempts.length > 1 && (
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: "18px 22px", marginBottom: 22 }}>
          <div style={{ fontFamily: FONT_UI, fontWeight: 700, fontSize: fs(13), color: T.ink, marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.04em" }}>
            {t("attemptHistory")}
          </div>
          <div style={{ display: "grid", gap: 8 }}>
            {attempts.map((h, i) => (
              <div key={h.id} style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 10, fontFamily: FONT_UI, fontSize: fs(13), color: T.ink }}>
                <span style={{ fontWeight: 600, flex: "1 1 220px" }}>
                  {i === 0 ? t("firstAttempt") : t("retestN", { n: i })}
                  <span style={{ fontWeight: 400, color: T.muted }}>
                    {i === 0 ? "" : ` — ${t(RETEST_POOL_LABEL[h.pool] || "poolAll")}`}
                    {` · ${t(h.mode === "tutor" ? "modeTutorOpt" : "modeTimedOpt")}${h.timerOff ? ` (${t("timerOffTag")})` : ""}`}
                  </span>
                </span>
                <span style={{ fontFamily: FONT_MONO, color: T.muted }}>{t("elapsed")} {fmtTime(h.elapsedSec)}</span>
                {h.hintsUsed > 0 && <Pill T={T} tone="amber">{t("hintsUsedN", { n: h.hintsUsed })}</Pill>}
                <Pill T={T} tone={h.pct >= 70 ? "green" : "red"}>{h.correct}/{h.total} · {h.pct}%</Pill>
              </div>
            ))}
          </div>
        </div>
      )}

      {subjectRows.length > 1 && (
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: "20px 22px 8px", marginBottom: 22 }}>
          <div style={{ fontFamily: FONT_UI, fontWeight: 700, fontSize: fs(13), color: T.ink, marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.04em" }}>
            {t("perfSubject")}
          </div>
          <ResponsiveContainer width="100%" height={Math.max(140, subjectRows.length * 42)}>
            <BarChart data={subjectRows} layout="vertical" margin={{ left: 8, right: 24, top: 4, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} horizontal={false} />
              <XAxis type="number" domain={[0, 100]} tick={{ fontFamily: FONT_MONO, fontSize: fs(11), fill: T.muted }} unit="%" />
              <YAxis type="category" dataKey="subject" width={Math.round(200 * Math.max(1, TEXT_SCALE))} interval={0} tick={<SubjectTick T={T} />} />
              <Tooltip
                formatter={(v, n, p) => [`${p.payload.correct}/${p.payload.total} (${v}%)`, t("score")]}
                contentStyle={{ fontFamily: FONT_UI, fontSize: fs(12.5), borderRadius: 8, border: `1px solid ${T.border}`, background: T.card, color: T.ink }}
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

      <DifficultyBreakdown rows={difficultyRows} T={T} />

      <div style={{ fontFamily: FONT_UI, fontWeight: 700, fontSize: fs(13), color: T.ink, marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.04em" }}>
        {t("qReview")}
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
                <span style={{ fontFamily: FONT_MONO, fontSize: fs(12.5), color: T.muted, width: 24 }}>{i + 1}</span>
                <span style={{ fontFamily: FONT_UI, fontSize: fs(14), color: T.ink, flex: 1 }}>{q.stem}</span>
                {a?.hintUsed && <Pill T={T} tone="amber">{t("hintUsedBadge")}</Pill>}
                <Pill T={T} tone="muted">{q.subject || t("general")}</Pill>
                {isOpen ? <ChevronUp size={16} color={T.muted} /> : <ChevronDown size={16} color={T.muted} />}
              </div>
              {isOpen && (
                <div style={{ padding: "0 16px 18px", borderTop: `1px solid ${T.border}` }}>
                  <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12 }}>
                    <DifficultyMeter value={q.difficultyRating} label={q.difficultyLabel} T={T} />
                  </div>
                  <p style={{ fontFamily: FONT_DISPLAY, fontSize: fs(14.5), color: T.ink, lineHeight: 1.65, marginTop: 8 }}>
                    {renderHighlightedText(q.vignette, null, () => {}, getClues(q.vignette, q.keyInfoPhrases).ranges, clueStyleFor(T))}
                  </p>
                  <div style={{ display: "grid", gap: 6, marginBottom: 12 }}>
                    {q.options.map((opt) => {
                      const isCorrectOpt = opt.key === q.correctAnswer;
                      const isYourPick = opt.key === a?.selected;
                      const reason = !isCorrectOpt ? q.distractorAnalysis?.[opt.key] : null;
                      return (
                        <div key={opt.key} style={{
                          padding: "8px 10px", borderRadius: 6,
                          background: isCorrectOpt ? T.greenLight : isYourPick ? T.redLight : "transparent",
                          fontFamily: FONT_UI, fontSize: fs(13.5), color: T.ink,
                        }}>
                          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                            <span style={{ fontFamily: FONT_MONO, fontWeight: 700, fontSize: fs(12), width: 18 }}>{opt.key}</span>
                            <span style={{ flex: 1 }}>{opt.text}</span>
                            {isCorrectOpt && <Pill T={T} tone="green">{t("correct")}</Pill>}
                            {isYourPick && !isCorrectOpt && <Pill T={T} tone="red">{t("yours")}</Pill>}
                          </div>
                          {reason && (
                            <div style={{ fontFamily: FONT_UI, fontSize: fs(12.5), color: T.muted, marginTop: 4, paddingLeft: 28, lineHeight: 1.5 }}>
                              {reason}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <ExplanationPanels q={q} T={T} rating={q.meta?.rating ?? null} onRate={onRate ? (k) => onRate(q, k) : null} />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Retest options bar */}
      <div style={{
        position: "sticky", bottom: 0, zIndex: 30, margin: "28px -20px -80px", padding: "14px 20px",
        background: T.paper, borderTop: `1px solid ${T.border}`, display: "flex", flexWrap: "wrap", gap: 10,
      }}>
        <PrimaryButton T={T} onClick={() => setRetestCfg({ pool: poolCounts.incorrect > 0 ? "incorrect" : "all", mode: "tutor" })}>
          {t("retestIncBtn")}
        </PrimaryButton>
        <GhostButton T={T} onClick={() => setRetestCfg({ pool: "all", mode: "tutor" })}>
          {t("retestFullBtn")}
        </GhostButton>
      </div>

      {/* Retest configuration modal */}
      {retestCfg && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(10,15,20,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 95, padding: 20 }}>
          <div role="dialog" aria-modal="true" style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 26, width: "100%", maxWidth: 520, maxHeight: "90vh", overflowY: "auto" }}>
            <h3 style={{ fontFamily: FONT_UI, fontSize: fs(17), fontWeight: 700, color: T.ink, margin: "0 0 16px" }}>{t("retestTitle")}</h3>
            {[
              ["poolLabel", "pool", [["incorrect", "poolIncorrect"], ["flagged", "poolFlagged"], ["again", "poolAgain"], ["hard", "poolHard"], ["againhard", "poolAgainHard"], ["all", "poolAll"]]],
              ["modeSel", "mode", [["tutor", "modeTutorOpt"], ["timed", "modeTimedOpt"]]],
            ].map(([labelKey, field, opts]) => (
              <div key={field} style={{ marginBottom: 16 }}>
                <div style={{ fontFamily: FONT_UI, fontWeight: 700, fontSize: fs(11), color: T.muted, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 6 }}>{t(labelKey)}</div>
                <div role="radiogroup" style={{ display: "flex", flexWrap: "wrap", border: `1px solid ${T.border}`, borderRadius: 6, overflow: "hidden" }}>
                  {opts.map(([val, key]) => {
                    const on = retestCfg[field] === val;
                    const count = field === "pool" ? poolCounts[val] : null;
                    const disabled = field === "pool" && count === 0;
                    return (
                      <button key={val} role="radio" aria-checked={on} disabled={disabled}
                        onClick={() => setRetestCfg((c) => ({ ...c, [field]: val }))}
                        style={{
                          flex: "1 1 auto", fontFamily: FONT_UI, fontWeight: 700, fontSize: fs(12.5), padding: "9px 10px", border: "none",
                          cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.45 : 1,
                          background: on ? T.blue : "transparent", color: on ? T.onBlue : T.ink,
                        }}>
                        {t(key)}{count !== null ? ` (${count})` : ""}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
            <p style={{ fontFamily: FONT_UI, fontSize: fs(12.5), color: T.muted, lineHeight: 1.5, margin: "0 0 18px" }}>
              {retestCfg.mode === "tutor" ? t("modeTutorHint") : t("modeTimedHint")}<br />{t("retestSaveNote")}
            </p>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <GhostButton T={T} onClick={() => setRetestCfg(null)}>{t("cancel")}</GhostButton>
              <PrimaryButton T={T} disabled={poolCounts[retestCfg.pool] === 0} onClick={() => { const c = retestCfg; setRetestCfg(null); onRetest(blockIdx, c); }}>
                {t("startRetest")}
              </PrimaryButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Final exam summary (across all blocks)
// ---------------------------------------------------------------------------
// Y-axis tick for the subject charts. Long "Parent / Child" subject names used to wrap and collide, so show the last
// segment on one line (ellipsised if still long) and keep the full name as a hover title.
function SubjectTick({ x, y, payload, T }) {
  const full = String(payload?.value ?? "");
  const leaf = full.includes(" / ") ? full.split(" / ").pop() : full;
  const label = leaf.length > 28 ? leaf.slice(0, 27) + "…" : leaf;
  return (
    <g transform={`translate(${x},${y})`}>
      <title>{full}</title>
      <text x={-8} y={0} dy={4} textAnchor="end" fontFamily={FONT_UI} fontSize={fs(12.5)} fill={T.ink}>{label}</text>
    </g>
  );
}

function FinalSummary({ examData, blockStates, onBackToLobby, T, darkMode, setDarkMode }) {
  const { t, lang } = useI18n();
  const subjectRows = useMemo(() => {
    const map = {};
    examData.blocks.forEach((block, bi) => {
      if (block.isRetest || blockStates[bi].status !== "done") return; // retests never alter baseline stats
      block.questions.forEach((q) => {
        const subj = q.subject || t("general");
        const a = blockStates[bi].answers[q.id];
        const correct = a?.selected === q.correctAnswer;
        if (!map[subj]) map[subj] = { subject: subj, correct: 0, total: 0 };
        map[subj].total += 1;
        if (correct) map[subj].correct += 1;
      });
    });
    return Object.values(map).map((r) => ({ ...r, pct: Math.round((r.correct / r.total) * 100) })).sort((a, b) => a.pct - b.pct);
  }, [examData, blockStates, lang]);

  const difficultyRows = useMemo(() => {
    const entries = [];
    examData.blocks.forEach((block, bi) => {
      if (block.isRetest || blockStates[bi].status !== "done") return; // retests never alter baseline stats
      block.questions.forEach((q) => entries.push({ rating: q.difficultyRating, label: q.difficultyLabel, correct: blockStates[bi].answers[q.id]?.selected === q.correctAnswer }));
    });
    return difficultyBreakdown(entries);
  }, [examData, blockStates]);

  const baseIdx = examData.blocks.map((b, i) => (b.isRetest ? -1 : i)).filter((i) => i >= 0);
  const retestCount = examData.blocks.length - baseIdx.length;
  const totalCorrect = baseIdx.reduce((s, i) => s + (blockStates[i].score?.correct || 0), 0);
  const totalQ = baseIdx.reduce((s, i) => s + (blockStates[i].score?.total || 0), 0);
  const overallPct = totalQ ? Math.round((totalCorrect / totalQ) * 100) : 0;
  const weakest = subjectRows.slice(0, 3);

  return (
    <div style={{ maxWidth: Math.round(1120 * Math.max(1, TEXT_SCALE)), margin: "0 auto", padding: "44px 20px 80px" }}>
      <style>{`@import url('${FONT_IMPORT_URL}');`}</style>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
        <GhostButton T={T} icon={ChevronLeft} onClick={onBackToLobby}>{t("back")}</GhostButton>
        <SettingsMenu darkMode={darkMode} setDarkMode={setDarkMode} T={T} />
      </div>

      <h1 style={{ fontFamily: FONT_DISPLAY, fontSize: fs(28), fontWeight: 600, color: T.ink, margin: "0 0 4px" }}>
        {t("fullSummaryTitle", { name: examData.examTitle || t("practiceExam") })}
      </h1>
      <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 28 }}>
        <span style={{ fontFamily: FONT_MONO, fontSize: fs(32), fontWeight: 600, color: overallPct >= 70 ? T.green : T.red }}>
          {overallPct}%
        </span>
        <span style={{ fontFamily: FONT_UI, fontSize: fs(14), color: T.muted }}>
          {t("across", { c: totalCorrect, q: totalQ, b: baseIdx.length, blocks: t(baseIdx.length > 1 ? "blockN" : "block1") })}
        </span>
      </div>
      {retestCount > 0 && (
        <p style={{ fontFamily: FONT_UI, fontSize: fs(12.5), color: T.muted, margin: "-14px 0 22px" }}>{t("retestsExcluded", { n: retestCount })}</p>
      )}

      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: "20px 22px 8px", marginBottom: 22 }}>
        <div style={{ fontFamily: FONT_UI, fontWeight: 700, fontSize: fs(13), color: T.ink, marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.04em" }}>
          {t("perfAll")}
        </div>
        <ResponsiveContainer width="100%" height={Math.max(160, subjectRows.length * 40)}>
          <BarChart data={subjectRows} layout="vertical" margin={{ left: 8, right: 24, top: 4, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} horizontal={false} />
            <XAxis type="number" domain={[0, 100]} tick={{ fontFamily: FONT_MONO, fontSize: fs(11), fill: T.muted }} unit="%" />
            <YAxis type="category" dataKey="subject" width={Math.round(200 * Math.max(1, TEXT_SCALE))} interval={0} tick={<SubjectTick T={T} />} />
            <Tooltip
              formatter={(v, n, p) => [`${p.payload.correct}/${p.payload.total} (${v}%)`, t("score")]}
              contentStyle={{ fontFamily: FONT_UI, fontSize: fs(12.5), borderRadius: 8, border: `1px solid ${T.border}`, background: T.card, color: T.ink }}
            />
            <Bar dataKey="pct" radius={[0, 6, 6, 0]} barSize={18}>
              {subjectRows.map((r, i) => (
                <Cell key={i} fill={r.pct >= 70 ? T.green : r.pct >= 50 ? T.amber : T.red} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <DifficultyBreakdown rows={difficultyRows} T={T} />

      {weakest.length > 0 && (
        <div style={{ background: T.blueLight, borderRadius: 10, padding: "16px 20px", marginBottom: 22 }}>
          <div style={{ fontFamily: FONT_UI, fontWeight: 700, fontSize: fs(13), color: T.blueDeep, marginBottom: 6 }}>{t("focusAreas")}</div>
          <p style={{ fontFamily: FONT_UI, fontSize: fs(13.5), color: T.blueDeep, margin: 0, lineHeight: 1.6 }}>
            {t("lowest", { list: weakest.map((w) => `${w.subject} (${w.pct}%)`).join(", ") })}
          </p>
        </div>
      )}

      <div style={{ display: "grid", gap: 10 }}>
        {examData.blocks.map((block, i) => blockStates[i].score && (
          <div key={i} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontFamily: FONT_UI, fontWeight: 600, fontSize: fs(14), color: T.ink }}>{blockLabel(block, t)}</span>
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
  // Everything persisted is read ONCE, synchronously, before the first render — so a refresh drops the
  // student straight back into the exam (no flash of the import screen) and the save effects below can
  // never overwrite a stored session with empty initial state.
  const [boot] = useState(() => ({ session: loadSession(), library: loadLibrary(), prefs: loadPrefs(), sessionLog: loadHistory() }));
  const [examData, setExamData] = useState(boot.session ? boot.session.examData : null);
  const [blockStates, setBlockStates] = useState(boot.session ? boot.session.blockStates : []);
  const [view, setView] = useState(boot.session ? boot.session.view : "import"); // import | lobby | exam | results | final
  const [activeBlockIdx, setActiveBlockIdx] = useState(boot.session ? boot.session.activeBlockIdx : null);
  const [history, setHistory] = useState(boot.session ? boot.session.history : []); // immutable snapshot of every finished attempt (baseline + retests)
  const [darkMode, setDarkMode] = useState(boot.prefs.darkMode);
  const [lang, setLang] = useState(boot.prefs.lang); // English is the default
  const [textScale, setTextScale] = useState(boot.prefs.textScale);
  TEXT_SCALE = textScale; // read by fs() while this render builds the tree
  const [library, setLibrary] = useState(boot.library); // [{ id, title, importDate, questions, lastScore }]
  const [libTab, setLibTab] = useState("library"); // Home tab: library | history (lives here so Review Exam → Home lands back on Past Sessions)
  const [sessionLog, setSessionLog] = useState(boot.sessionLog); // independent log of every finished session, newest first
  const [restoredNotice, setRestoredNotice] = useState(!!boot.session);
  const [storageError, setStorageError] = useState(false);
  const [flash, setFlash] = useState(null); // one-line confirmation toast (e.g. after a bundle import)
  useEffect(() => {
    if (!flash) return undefined;
    const id = setTimeout(() => setFlash(null), 5000);
    return () => clearTimeout(id);
  }, [flash]);
  const T = darkMode ? DARK : LIGHT;
  const tr = (k) => STR[lang]?.[k] ?? STR.en[k] ?? k; // App sits above useI18n's provider, so look strings up directly

  // --- Local persistence ------------------------------------------------------
  const failedKeys = useRef({});
  function persist(key, raw) { // raw === null removes the key
    let ok = true;
    if (raw === null) lsRemove(key); else ok = lsSet(key, raw);
    failedKeys.current[key] = !ok;
    setStorageError(Object.values(failedKeys.current).some(Boolean));
  }

  // The (large, rarely-changing) exam content is serialised once per change, not once per timer tick.
  const examJson = useMemo(() => (examData ? JSON.stringify(examData) : null), [examData]);

  // Active-session auto-save: runs on every state change (answers, flags, question index, countdown…).
  // The session exists only while something is left to resume; finishing the last block clears it.
  // (The results / summary screens are saved as "lobby" so a queued block still waiting is not lost.)
  useEffect(() => {
    const hasOpenWork = !!examData && blockStates.some((b) => b.status !== "done");
    if (!hasOpenWork) { persist(LS_SESSION, null); return; }
    persist(LS_SESSION,
      `{"v":${SESSION_VERSION},"savedAt":${Date.now()},"view":${JSON.stringify(view === "exam" ? "exam" : view === "import" ? "import" : "lobby")},` +
      `"activeBlockIdx":${JSON.stringify(activeBlockIdx)},"history":${JSON.stringify(history)},` +
      `"blockStates":${JSON.stringify(blockStates)},"examData":${examJson}}`);
  }, [examJson, blockStates, history, view, activeBlockIdx]);

  useEffect(() => { persist(LS_LIBRARY, library.length ? JSON.stringify(library) : null); }, [library]);
  useEffect(() => { persist(LS_HISTORY, sessionLog.length ? JSON.stringify(sessionLog) : null); }, [sessionLog]);
  useEffect(() => {
    const isDefault = darkMode === true && lang === "en" && textScale === 1;
    persist(LS_PREFS, isDefault ? null : JSON.stringify({ darkMode, lang, textScale }));
  }, [darkMode, lang, textScale]);
  useEffect(() => {
    if (!restoredNotice) return;
    const id = setTimeout(() => setRestoredNotice(false), 5000);
    return () => clearTimeout(id);
  }, [restoredNotice]);

  // --- Qbank library ------------------------------------------------------------
  // Adds blocks that aren't already stored. Returns the library ids for every input block (new or existing).
  function addBlocksToLibrary(blocks) {
    const existing = new Map(library.map((e) => [blockSignature(e.title, e.questions), e.id]));
    const fresh = [];
    const ids = blocks.map((b) => {
      const sig = blockSignature(b.blockName, b.questions);
      if (existing.has(sig)) return { id: existing.get(sig), isNew: false };
      const entry = makeLibraryEntry(b);
      existing.set(sig, entry.id);
      fresh.push(entry);
      return { id: entry.id, isNew: true };
    });
    return { fresh, ids };
  }

  // "Save to Library" on the import screen: store the pasted/uploaded blocks without starting an exam.
  function saveImportToLibrary(data) {
    const { fresh, ids } = addBlocksToLibrary(data.blocks.map(debiasBlock));
    if (fresh.length === 0) return { added: 0, dup: ids.length };
    const next = [...library, ...fresh];
    if (!lsSet(LS_LIBRARY, JSON.stringify(next))) return { failed: true }; // quota / disabled storage: tell the user now
    setLibrary(next);
    return { added: fresh.length, dup: ids.length - fresh.length };
  }

  // Lobby → "Save to Library" / "Save selected": store the loaded exam's not-yet-saved blocks (all of them, or only `only`)
  // and link them to their entries so finishing them updates lastScore. Identical content is never stored twice.
  function saveLoadedBlocksToLibrary(only) {
    if (!examData) return { added: 0, dup: 0 };
    const isSaved = (b) => !!b.libraryId && library.some((e) => e.id === b.libraryId);
    const idxs = examData.blocks.map((_, i) => i).filter((i) => {
      const b = examData.blocks[i];
      return !b.isRetest && !b.isMixed && !isSaved(b) && (!Array.isArray(only) || only.includes(i));
    });
    if (idxs.length === 0) return { added: 0, dup: 0 };
    const { fresh, ids } = addBlocksToLibrary(idxs.map((i) => examData.blocks[i]));
    const next = [...library, ...fresh];
    if (fresh.length && !lsSet(LS_LIBRARY, JSON.stringify(next))) { setStorageError(true); return { failed: true }; }
    if (fresh.length) setLibrary(next);
    setExamData((prev) => ({ ...prev, blocks: prev.blocks.map((b, i) => (idxs.includes(i) ? { ...b, libraryId: ids[idxs.indexOf(i)].id } : b)) }));
    return { added: fresh.length, dup: ids.length - fresh.length };
  }

  // Lobby → "Remove selected": drop not-yet-started blocks from the loaded exam (library copies are untouched). Block indices
  // shift, so everything that points at one — retest links, history entries, the active block — is re-mapped.
  function removeLoadedBlocks(idxs) {
    if (!examData) return;
    const drop = new Set(idxs.filter((i) => blockStates[i] && blockStates[i].status === "pending"));
    if (drop.size === 0) return;
    const keep = examData.blocks.map((_, i) => i).filter((i) => !drop.has(i));
    if (keep.length === 0) { removeLoadedExam(); return; }
    const remap = new Map(keep.map((oldI, newI) => [oldI, newI]));
    const fix = (i) => (remap.has(i) ? remap.get(i) : i);
    setExamData((prev) => ({ ...prev, blocks: keep.map((i) => (prev.blocks[i].isRetest ? { ...prev.blocks[i], retestOf: fix(prev.blocks[i].retestOf) } : prev.blocks[i])) }));
    setBlockStates((prev) => keep.map((i) => prev[i]));
    setHistory((h) => h.map((e) => ({ ...e, blockIdx: fix(e.blockIdx), originIdx: fix(e.originIdx) })));
    setActiveBlockIdx((cur) => (cur == null ? cur : remap.has(cur) ? remap.get(cur) : null));
  }

  // Start one saved block, or several as a continuous session (the lobby already runs multiple blocks in order).
  function launchFromLibrary(ids) {
    const entries = ids.map((id) => library.find((e) => e.id === id)).filter(Boolean);
    if (entries.length === 0) return;
    const blocks = entries.map((e) => ({
      blockName: e.title,
      ...(typeof e.timeLimitMinutes === "number" ? { timeLimitMinutes: e.timeLimitMinutes } : {}),
      questions: e.questions,
      libraryId: e.id,
    }));
    setExamData({ blocks });
    setBlockStates(blocks.map(makeInitialBlockState));
    setHistory([]);
    setActiveBlockIdx(null);
    setView("lobby");
  }

  // Merge several saved banks into ONE shuffled, subject-balanced block and open it in the lobby.
  // The result isn't tied to a single library entry, so it never overwrites a bank's "last score".
  // The lobby is only for sorting freshly imported Qbanks, so a saved Qbank never passes through it: Load starts the exam
  // right away in the mode chosen next to the Load button.
  function mixFromLibrary(ids, size, difficulty = "all", mode = "timed") {
    const entries = ids.map((id) => library.find((e) => e.id === id)).filter(Boolean);
    if (entries.length < 1) return;
    const block = mixQbanks(entries, { size, difficulty });
    if (block.questions.length === 0) return;
    // Running ONE Qbank in full (no size cap, no difficulty filter) is that card's own attempt, so it is linked to the card and
    // its badge flips to Completed. Anything else (a subset, a difficulty filter, several banks) is a custom session: it is
    // only logged under Past Sessions and the source cards are left exactly as they were.
    if (entries.length === 1 && size == null && difficulty === "all") block.libraryId = entries[0].id;
    setExamData({ blocks: [block] });
    setBlockStates([{ ...makeInitialBlockState(block), timed: mode !== "tutor", tutor: mode === "tutor", status: "in-progress", startedAt: Date.now() }]);
    setHistory([]);
    setActiveBlockIdx(0);
    setView("exam");
  }

  // Saves a self-rating on the question's `meta` ({ rating, ratedAt }) — in the loaded exam (every copy, incl. retest
  // blocks) and in the persisted qbankLibrary entry it came from, so ratings survive reloads and drive retest filters.
  function rateQuestion(blockIdx, q, key) {
    const ratedAt = Date.now();
    const stamp = (qq) => (qq.id === q.id ? { ...qq, meta: { ...(qq.meta || {}), rating: key, ratedAt } } : qq);
    setExamData((prev) => ({ ...prev, blocks: prev.blocks.map((b) => ({ ...b, questions: b.questions.map(stamp) })) }));

    // Which library entry owns this question? Mixed blocks namespace ids as "<entryId>::<questionId>";
    // retest blocks point back at their first-pass block via retestOf.
    const block = examData.blocks[blockIdx];
    const sep = String(q.id).indexOf("::");
    let entryId = null, origId = q.id;
    if (sep > 0) { entryId = q.id.slice(0, sep); origId = q.id.slice(sep + 2); }
    else if (block) { entryId = (block.isRetest ? examData.blocks[block.retestOf] : block)?.libraryId || null; }
    if (!entryId) return; // not saved to the library yet: the rating lives with the session and is saved if the block is added later
    setLibrary((lib) => lib.map((e) => (e.id !== entryId ? e : {
      ...e,
      questions: e.questions.map((qq) => (qq.id === origId ? { ...qq, meta: { ...(qq.meta || {}), rating: key, ratedAt } } : qq)),
    })));
  }

  function deleteSessionLog(id) { lsRemove(LS_REVIEW + id); setSessionLog((log) => log.filter((e) => e.id !== id)); }
  function clearSessionLog() { removeAllReviewSnapshots(); setSessionLog([]); }

  // Past Sessions → Review Exam: reopen the saved run in the normal results screen (every question, labs, explanations, notes,
  // highlights). The run is loaded as a one-block exam that is already "done", so nothing is re-scored and no new log is written.
  function reviewSession(id) {
    const snap = lsGet(LS_REVIEW + id);
    if (!snap || !snap.block || !snap.blockState || !snap.blockState.score) { setFlash(tr("histNoReviewFlash")); return; }
    const block = snap.block.isRetest ? { ...snap.block, retestOf: 0 } : snap.block; // the first-pass block isn't loaded with it
    const bs = snap.blockState;
    setExamData({ blocks: [block] });
    setBlockStates([bs]);
    setHistory([{
      id: 1, blockIdx: 0, originIdx: 0, pool: block.isRetest ? block.retestType : "first", mode: bs.tutor ? "tutor" : "timed", timerOff: !!bs.timerOff,
      correct: bs.score.correct, total: bs.score.total, answered: bs.score.answered, pct: bs.score.pct, elapsedSec: bs.elapsedSec || 0, finishedAt: bs.finishedAt || Date.now(),
      hintsUsed: block.questions.filter((q) => bs.answers[q.id]?.hintUsed).length,
    }]);
    setActiveBlockIdx(0);
    setLibTab("history");
    setView("results");
  }

  function deleteLibraryEntry(id) { setLibrary((lib) => lib.filter((e) => e.id !== id)); }

  // Rename a saved Qbank. A loaded exam keeps showing the old name unless its blocks are updated too, so do both.
  function renameLibraryEntry(id, title) {
    const name = String(title || "").trim().slice(0, 120);
    if (!name) return;
    setLibrary((lib) => lib.map((e) => (e.id === id ? { ...e, title: name } : e)));
    setExamData((prev) => (prev ? { ...prev, blocks: prev.blocks.map((b) => (b.libraryId === id ? { ...b, blockName: name } : b)) } : prev));
  }

  // Remove the exam that is currently loaded in the lobby (the saved library is untouched).
  // Import step → "Add … to library": store the chosen Qbanks, discard the rest, and go back to the library.
  function finishBundleImport(idxs) {
    const r = idxs.length ? saveLoadedBlocksToLibrary(idxs) : { added: 0, dup: 0 };
    if (r.failed) return r; // storage refused the write: stay here, the banner explains
    removeLoadedExam();
    if (r.added) setFlash([tr("libSaved").replace("{n}", r.added), r.dup ? tr("libDup").replace("{d}", r.dup) : ""].filter(Boolean).join(" "));
    return r;
  }

  function removeLoadedExam() {
    lsRemove(LS_SESSION);
    setRestoredNotice(false);
    setExamData(null); setBlockStates([]); setHistory([]); setActiveBlockIdx(null);
    setView("import");
  }

  function recordLibraryScore(libraryId, score, finishedAt) {
    setLibrary((lib) => lib.map((e) => (e.id === libraryId
      ? { ...e, lastScore: { correct: score.correct, total: score.total, pct: score.pct, date: finishedAt } }
      : e)));
  }

  // Settings → "Reset All Local Data": wipes the library, the active session and preferences, then returns
  // to a clean import screen. (The save effects above then see empty/default state and keep the keys absent.)
  function resetAllData() {
    [LS_SESSION, LS_LIBRARY, LS_PREFS, LS_HISTORY].forEach(lsRemove);
    failedKeys.current = {};
    setStorageError(false);
    setRestoredNotice(false);
    setExamData(null); setBlockStates([]); setHistory([]); setActiveBlockIdx(null);
    removeAllReviewSnapshots(); setLibrary([]); setSessionLog([]); setDarkMode(true); setLang("en"); setTextScale(1);
    setView("import");
  }

  function handleImport(data) {
    // Guard against answer-position bias (e.g. LLM output where every key is "A") — see debiasBlock().
    // Remove redundancy: identical blocks inside the file collapse into one, and a block that is already in the library is
    // linked to that entry (shown as "In library") instead of being offered for saving again.
    const stored = new Map(library.map((e) => [blockSignature(e.title, e.questions), e.id]));
    const seen = new Set();
    let merged = 0;
    let linked = 0;
    const blocks = [];
    data.blocks.map(debiasBlock).forEach((b) => {
      const sig = blockSignature(b.blockName, b.questions);
      if (seen.has(sig)) { merged++; return; }
      seen.add(sig);
      if (stored.has(sig)) { linked++; blocks.push({ ...b, libraryId: stored.get(sig) }); } else blocks.push(b);
    });
    // A single Qbank that is already in the library never opens the lobby (that would just be a second, confusing copy of
    // something already sorted). Leave whatever is loaded alone, stay on Home, and point to the library entry.
    if (data.blocks.length === 1 && linked === 1) {
      setFlash(tr("importInLibrary"));
      setView("import");
      return;
    }
    const next = {
      ...data,
      blocks,
      ...(data.blocks.length >= 2 ? { importReview: true } : {}), // a bundle goes to the import step (choose what to keep), not the lobby
      ...(merged ? { mergedDuplicates: merged } : {}),
      ...(linked ? { linkedExisting: linked } : {}),
    };
    setExamData(next);
    setBlockStates(next.blocks.map(makeInitialBlockState));
    setView("lobby");
  }

  // Time spent parked on Home must not count toward a block's elapsed time: re-base startedAt when the block is reopened.
  function unpause(bs) {
    if (!bs.pausedAt) return bs;
    return { ...bs, startedAt: bs.startedAt ? bs.startedAt + (Date.now() - bs.pausedAt) : bs.startedAt, pausedAt: null };
  }

  function startBlock(idx) {
    setBlockStates((prev) => {
      const copy = [...prev];
      if (copy[idx].status === "pending") copy[idx] = { ...copy[idx], status: "in-progress", startedAt: Date.now() };
      else copy[idx] = unpause(copy[idx]);
      return copy;
    });
    setActiveBlockIdx(idx);
    setView("exam");
  }

  // Home: go back to the dashboard WITHOUT resetting anything. Answers, question index and timing live in blockStates and are
  // written to localStorage by the auto-save effect above on every change, so the session is already saved when we leave.
  // A timed block can't leave the exam screen at all (no mid-block navigation); the button isn't rendered there either.
  function goHome() {
    const bs = view === "exam" ? blockStates[activeBlockIdx] : null;
    if (bs && bs.status === "in-progress") {
      if (!bs.tutor) return;
      setBlockStates((prev) => {
        const copy = [...prev];
        copy[activeBlockIdx] = { ...copy[activeBlockIdx], pausedAt: Date.now() };
        return copy;
      });
    }
    setView("import");
  }

  function resumeSession(idx) { startBlock(idx); }

  // Starting something new from Home would replace the loaded exam, so an in-progress block needs an explicit OK first.
  const hasInProgress = !!examData && blockStates.some((b) => b.status === "in-progress");
  const [discardPrompt, setDiscardPrompt] = useState(null);
  function guardNew(fn) { if (hasInProgress) setDiscardPrompt(() => fn); else fn(); }
  const ipIdx = examData ? blockStates.findIndex((b) => b.status === "in-progress") : -1;
  const homeSession = examData ? { examTitle: examData.examTitle, idx: ipIdx, block: ipIdx >= 0 ? examData.blocks[ipIdx] : null, bs: ipIdx >= 0 ? blockStates[ipIdx] : null } : null;

  // useCallback: ExamScreen's countdown effect lists this in its deps. A fresh function on every render
  // tore down and recreated the 1s interval on every re-render, so rapid input (typing a note, clicking
  // through questions) could keep postponing the next tick and the clock would lose time.
  const setActiveBlockState = useCallback((updater) => {
    setBlockStates((prev) => {
      const cur = prev[activeBlockIdx];
      const next = typeof updater === "function" ? updater(cur) : updater;
      if (next === cur) return prev; // no-op updates (e.g. the mirror effects on mount) don't re-render or re-save
      const copy = [...prev];
      copy[activeBlockIdx] = next;
      return copy;
    });
  }, [activeBlockIdx]);

  function submitActiveBlock() {
    const idx = activeBlockIdx;
    const bs = blockStates[idx];
    const block = examData.blocks[idx];
    if (!bs || bs.status === "done") return; // never re-score a finished block
    const correct = block.questions.filter((q) => bs.answers[q.id]?.selected === q.correctAnswer).length;
    const answered = block.questions.filter((q) => bs.answers[q.id]?.selected).length;
    const total = block.questions.length;
    const pct = Math.round((correct / total) * 100);
    const finishedAt = Date.now();
    const elapsedSec = bs.startedAt ? Math.round((finishedAt - bs.startedAt) / 1000) : 0;
    setBlockStates((prev) => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], status: "done", finishedAt, elapsedSec, score: { correct, total, answered, pct } };
      return copy;
    });
    setHistory((h) => [...h, {
      id: h.length + 1, blockIdx: idx, originIdx: block.isRetest ? block.retestOf : idx,
      pool: block.isRetest ? block.retestType : "first", mode: bs.tutor ? "tutor" : "timed", timerOff: !!bs.timerOff,
      correct, total, answered, pct, elapsedSec, finishedAt,
      hintsUsed: block.questions.filter((q) => bs.answers[q.id]?.hintUsed).length,
    }]);
    // Independent session log: a self-contained snapshot, written for EVERY finished block (card run, custom/mixed, retest).
    const subj = new Map();
    block.questions.forEach((q) => {
      const k = (q.subject || "").trim() || "General";
      const cur = subj.get(k) || { subject: k, correct: 0, total: 0 };
      cur.total += 1;
      if (bs.answers[q.id]?.selected === q.correctAnswer) cur.correct += 1;
      subj.set(k, cur);
    });
    const parent = block.isRetest ? examData.blocks[block.retestOf] : null;
    const logEntry = {
      id: `ses_${finishedAt.toString(36)}_${Math.random().toString(36).slice(2, 7)}`,
      finishedAt, elapsedSec, correct, total, answered, pct,
      kind: block.isRetest ? "retest" : block.libraryId ? "bank" : "custom",
      mode: bs.tutor ? "tutor" : "timed",
      blockName: block.blockName, isMixed: !!block.isMixed, mixCount: block.mixCount || 0, mixDifficulty: block.mixDifficulty || null,
      isRetest: !!block.isRetest, retestType: block.retestType || null,
      sourceBanks: block.sourceBanks || (parent && parent.sourceBanks) || [],
      libraryId: block.isRetest ? (parent && parent.libraryId) || null : block.libraryId || null,
      bySubject: [...subj.values()].sort((a, b) => b.total - a.total),
    };
    // Full snapshot for "Review Exam" (kept in its own key; only the newest REVIEW_MAX runs keep one, and a full disk just drops the oldest).
    const snapshot = JSON.stringify({ v: 1, block, blockState: { ...bs, status: "done", finishedAt, elapsedSec, score: { correct, total, answered, pct } } });
    const olderIds = sessionLog.map((e) => e.id);
    let saved = lsSet(LS_REVIEW + logEntry.id, snapshot);
    for (let i = 0; !saved && i < olderIds.length; i++) { // quota: free the oldest snapshots one at a time and retry
      const victim = olderIds[olderIds.length - 1 - i];
      if (hasReviewSnapshot(victim)) { lsRemove(LS_REVIEW + victim); saved = lsSet(LS_REVIEW + logEntry.id, snapshot); }
    }
    olderIds.slice(REVIEW_MAX - 1).forEach((id) => lsRemove(LS_REVIEW + id)); // older than the newest REVIEW_MAX: summary only
    setSessionLog((log) => {
      const next = [logEntry, ...log];
      next.slice(HISTORY_MAX).forEach((e) => lsRemove(LS_REVIEW + e.id));
      return next.slice(0, HISTORY_MAX);
    });
    // Finishing a first-pass block updates its library entry; retests are subsets and never overwrite it.
    if (block.libraryId && !block.isRetest) recordLibraryScore(block.libraryId, { correct, total, pct }, finishedAt);
    setView("results");
  }

  function reviewBlock(idx) { setActiveBlockIdx(idx); setView("results"); }
  function resetAll() {
    // Auto-save protects against refreshes, so don't let a single stray click on "Import new exam" discard a started block.
    if (blockStates.some((b) => b.status === "in-progress") && !window.confirm(tr("leaveConfirm"))) return;
    setExamData(null); setBlockStates([]); setHistory([]); setActiveBlockIdx(null); setView("import");
  }
  // Timed and Tutor are mutually exclusive; the choice is locked once a block has started.
  function setBlockMode(idx, mode) {
    setBlockStates((prev) => {
      const cur = prev[idx];
      if (cur.status !== "pending") return prev;
      const copy = [...prev];
      copy[idx] = { ...cur, timed: mode === "timed", tutor: mode === "tutor" };
      return copy;
    });
  }

  // --- Instant retest system --------------------------------------------
  // Both paths build a brand-new block object (fresh id-scoped state via
  // makeInitialBlockState, so no stale selectedAnswer/markedForReview/struck
  // state can leak in), append it to examData.blocks, and jump straight into
  // the exam view at question 1.

  // pool: "incorrect" | "flagged" | "all"   mode: "tutor" | "timed"
  // Always builds a brand-new block + block state, so the original block's score, answers and timing are never touched.
  function launchRetest(idx, { pool, mode }) {
    const block = examData.blocks[idx];
    const bs = blockStates[idx];
    const src = block.questions.filter((q) =>
      pool === "all" ? true
      : pool === "flagged" ? !!bs.answers[q.id]?.flagged
      : pool === "again" ? q.meta?.rating === "again"
      : pool === "hard" ? q.meta?.rating === "hard"
      : pool === "againhard" ? (q.meta?.rating === "again" || q.meta?.rating === "hard")
      : bs.answers[q.id]?.selected !== q.correctAnswer);
    if (src.length === 0) return;
    const shuffled = shuffleArray(src).map(shuffleQuestionOptions); // new question AND answer order
    const newBlock = {
      blockName: baseBlockName(block.blockName), // suffix is localized in blockLabel()
      questions: shuffled,
      timeLimitMinutes: pool === "all" && typeof block.timeLimitMinutes === "number" ? block.timeLimitMinutes : Math.max(5, Math.round(shuffled.length * 1.5)),
      isRetest: true,
      retestOf: block.isRetest ? block.retestOf : idx, // always points at the first-pass block
      retestType: { incorrect: "missed", flagged: "flagged", all: "full" }[pool] || pool, // again / hard / againhard keep their own name
      retestCount: shuffled.length,
    };
    launchBlock(newBlock, mode);
  }
  const retestMissedBlock = (idx) => launchRetest(idx, { pool: "incorrect", mode: "tutor" });
  const retestEntireBlock = (idx) => launchRetest(idx, { pool: "all", mode: "tutor" });

  function launchBlock(newBlock, mode) {
    const newIndex = examData.blocks.length;
    setExamData((prev) => ({ ...prev, blocks: [...prev.blocks, newBlock] }));
    setBlockStates((prev) => [...prev, { ...makeInitialBlockState(newBlock), timed: mode !== "tutor", tutor: mode === "tutor", status: "in-progress", startedAt: Date.now() }]);
    setActiveBlockIdx(newIndex); // fresh block → question index always starts at 1 in ExamScreen's own state
    setView("exam");
  }

  return (
    <LangContext.Provider value={{ lang, setLang }}>
    <TextScaleContext.Provider value={{ textScale, setTextScale }}>
    <DataContext.Provider value={{ resetAllData }}>
    <div style={{ minHeight: "100vh", background: T.paper, fontFamily: FONT_UI, textAlign: "left" }}>
      {restoredNotice && (
        <div role="status" onClick={() => setRestoredNotice(false)} style={{
          position: "fixed", top: 14, left: "50%", transform: "translateX(-50%)", zIndex: 200, cursor: "pointer",
          display: "flex", alignItems: "center", gap: 8, background: T.greenLight, color: T.green, border: `1px solid ${T.green}`,
          borderRadius: 999, padding: "8px 16px", fontFamily: FONT_UI, fontSize: fs(13), fontWeight: 600, boxShadow: "0 6px 20px rgba(0,0,0,0.25)",
        }}>
          <CheckCircle2 size={15} /> {tr("resumed")}
        </div>
      )}
      {flash && (
        <div role="status" onClick={() => setFlash(null)} style={{
          position: "fixed", top: 14, left: "50%", transform: "translateX(-50%)", zIndex: 200, cursor: "pointer", maxWidth: "92vw",
          display: "flex", alignItems: "center", gap: 8, background: T.greenLight, color: T.green, border: `1px solid ${T.green}`,
          borderRadius: 999, padding: "8px 16px", fontFamily: FONT_UI, fontSize: fs(13), fontWeight: 600, boxShadow: "0 6px 20px rgba(0,0,0,0.25)",
        }}>
          <CheckCircle2 size={15} style={{ flexShrink: 0 }} /> {flash}
        </div>
      )}
      {storageError && (
        <div role="alert" style={{
          position: "fixed", bottom: 14, left: "50%", transform: "translateX(-50%)", zIndex: 200, maxWidth: "92vw",
          display: "flex", alignItems: "center", gap: 8, background: T.amberLight, color: T.amber, border: `1px solid ${T.amber}`,
          borderRadius: 8, padding: "10px 16px", fontFamily: FONT_UI, fontSize: fs(13), fontWeight: 600, boxShadow: "0 6px 20px rgba(0,0,0,0.25)",
        }}>
          <AlertTriangle size={16} style={{ flexShrink: 0 }} /> {tr("storageFull")}
        </div>
      )}

      {discardPrompt && (
        <div role="dialog" aria-modal="true" style={{ position: "fixed", inset: 0, zIndex: 300, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 24, maxWidth: 420, width: "100%" }}>
            <h3 style={{ fontFamily: FONT_UI, fontSize: fs(17), fontWeight: 700, color: T.ink, margin: "0 0 10px" }}>{tr("discardTitle")}</h3>
            <p style={{ fontFamily: FONT_UI, fontSize: fs(14), color: T.muted, lineHeight: 1.55, margin: "0 0 20px" }}>{tr("discardBody")}</p>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <GhostButton T={T} onClick={() => setDiscardPrompt(null)}>{tr("cancel")}</GhostButton>
              <PrimaryButton T={T} onClick={() => { const fn = discardPrompt; setDiscardPrompt(null); fn(); }}>{tr("discardGo")}</PrimaryButton>
            </div>
          </div>
        </div>
      )}

      {view === "import" && (
        <FullPage T={T}>
        <ImportScreen
          onImport={(d) => guardNew(() => handleImport(d))}
          onSaveToLibrary={saveImportToLibrary}
          library={library}
          sessionLog={sessionLog}
          onDeleteSession={deleteSessionLog}
          onClearSessions={clearSessionLog}
          onReviewSession={(id) => guardNew(() => reviewSession(id))}
          libTab={libTab} setLibTab={setLibTab}
          session={homeSession}
          onResume={() => resumeSession(ipIdx)}
          onOpenLobby={() => setView("lobby")}
          onLaunchLibrary={(ids) => guardNew(() => launchFromLibrary(ids))}
          onMixLibrary={(ids, size, difficulty, mode) => guardNew(() => mixFromLibrary(ids, size, difficulty, mode))}
          onDeleteLibraryEntry={deleteLibraryEntry}
          onRenameLibraryEntry={renameLibraryEntry}
          T={T} darkMode={darkMode} setDarkMode={setDarkMode}
        />
        </FullPage>
      )}

      {view === "lobby" && examData && (
        <FullPage T={T}>
        {examData.importReview
          ? <ImportReview examData={examData} library={library} onAdd={finishBundleImport} onCancel={removeLoadedExam} T={T} darkMode={darkMode} setDarkMode={setDarkMode} />
          : (
          <Lobby examData={examData} blockStates={blockStates} onStart={startBlock} onReview={reviewBlock} onHome={goHome} library={library} onRemove={removeLoadedExam} onRemoveBlocks={removeLoadedBlocks} onFinalSummary={() => setView("final")} onSetMode={setBlockMode} onRetestMissed={retestMissedBlock} onRetestAll={retestEntireBlock} onSaveBlocks={saveLoadedBlocksToLibrary} T={T} darkMode={darkMode} setDarkMode={setDarkMode} />
          )}
        </FullPage>
      )}

      {view === "exam" && examData && activeBlockIdx !== null && (
        <ExamScreen
          key={activeBlockIdx}
          block={examData.blocks[activeBlockIdx]}
          blockState={blockStates[activeBlockIdx]}
          setBlockState={setActiveBlockState}
          onSubmitBlock={submitActiveBlock}
          onRate={(q, k) => rateQuestion(activeBlockIdx, q, k)}
          onHome={goHome}
          darkMode={darkMode}
          setDarkMode={setDarkMode}
        />
      )}

      {view === "results" && examData && activeBlockIdx !== null && (
        <FullPage T={T}>
        <BlockResults
          block={examData.blocks[activeBlockIdx]}
          blockState={blockStates[activeBlockIdx]}
          onBackToLobby={removeLoadedExam}
          blockIdx={activeBlockIdx}
          history={history}
          onRetest={launchRetest}
          onRate={(q, k) => rateQuestion(activeBlockIdx, q, k)}
          onHome={removeLoadedExam}
          T={T}
          darkMode={darkMode}
          setDarkMode={setDarkMode}
        />
        </FullPage>
      )}

      {view === "final" && examData && (
        <FullPage T={T}>
        <FinalSummary examData={examData} blockStates={blockStates} onBackToLobby={() => setView("lobby")} T={T} darkMode={darkMode} setDarkMode={setDarkMode} />
        </FullPage>
      )}
    </div>
    </DataContext.Provider>
    </TextScaleContext.Provider>
    </LangContext.Provider>
  );
}
