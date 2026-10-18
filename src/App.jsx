import React, { useState, useEffect, useRef, useMemo, useCallback, createContext, useContext } from "react";
import {
  Flag, Clock, ChevronLeft, ChevronRight, Upload, Copy, RotateCcw,
  Play, CheckCircle2, XCircle, AlertTriangle, ClipboardList, Activity,
  Check, ChevronDown, ChevronUp, FileJson, FlaskConical, PencilLine,
  Calculator as CalcIcon, Settings as SettingsIcon, Lock, Unlock,
  Search, Trash2, X, XOctagon, Lightbulb, Sun, Moon, Highlighter, BookOpen, Stethoscope, Target, Save, Shuffle, Plus, Home as HomeIcon, Pencil, Share2, ExternalLink, Sparkles, Cloud, RefreshCw, LogIn, LogOut, Bell, Database, Bookmark, User as UserIcon, BarChart3, LayoutDashboard, Flame, TrendingUp, Download, CheckSquare, SlidersHorizontal, GraduationCap, CalendarDays, Globe, ShieldCheck, Star } from "lucide-react";
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
  purple: "#7B3FB8",
  purpleLight: "#EBDDF6",
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
  purple: "#C39BF0",
  purpleLight: "#2E1D45",
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
    tabDatabase: "Database", dbTitle: "Personal Database", dbHint: "Questions, excerpts and notes you've saved while studying.", dbAdd: "Add to database", dbSavedToast: "Saved to Database", dbAll: "All", dbQuestions: "Questions", dbExcerpts: "Excerpts", dbNotes: "Notes", dbSearch: "Search your database", dbEmpty: "Your database is empty.", dbEmptyHint: "While taking a block, select text and tap Add to database, save a question with the bookmark, or save a note from the Notes panel.", dbNoMatch: "Nothing matches.", dbSaveQ: "Save question", dbSavedQ: "Saved to Database", dbSaveNote: "Save to Database", dbUpdateNote: "Update in Database", dbShowAns: "Show answer", dbHideAns: "Hide answer", dbEdit: "Edit", dbSave: "Save", dbCancel: "Cancel", dbCopy: "Copy", dbCopied: "Copied", dbDelete: "Delete", dbConfirmDel: "Delete?", dbClearAll: "Clear all", dbClearConfirm: "Move everything in your database to Trash? You can restore it for 30 days.", dbKindQ: "Question", dbKindE: "Excerpt", dbKindN: "Note", dbCommentPh: "Add your own comment…", dbAddComment: "Add comment", dbNoteTitle: "Your note", dbCorrectTag: "Correct",
    dbSyncSignIn: "Sign in with Google from the account menu to sync it across your devices.", dbImport: "Import", dbImported: "Imported {a} item(s); {s} already in your database.", dbImportBad: "That file isn't a Personal Database export.",
    dbShared: "Shared {n} item(s) as one file.", dbDownloaded: "Downloaded {n} item(s) as one file.", dbExportFailed: "Export failed. Please try again.", dbShareText: "My OWORLD Personal Database ({n} items). In OWORLD, open Database and tap Import to add them.", dbDelSelQ: "Move {n} selected item(s) to Trash? You can restore them for 30 days.", dbManage: "Manage", dbExport: "Export",
    tabTrash: "Trash", trashTitle: "Trash", trashCount: "{n} item(s)", trashHint: "Deleted Qbanks, Analytics sessions and Database items stay here for {d} days. Restore them, or delete them forever.", trashEmpty: "Trash is empty.", trashEmptyHint: "Anything you delete from the Library, Analytics or Database lands here first, so you can get it back.", trashNoneHere: "Nothing of this kind in Trash.",
    trashAll: "All", trashQbanks: "Qbanks", trashSessions: "Analytics", trashDb: "Database", trashKindQbank: "Qbank", trashKindSession: "Session",
    trashRestore: "Restore", trashRestoreSel: "Restore Selected", trashDeleteForever: "Delete forever", trashEmptyBtn: "Empty Trash",
    trashPurgeQ: "Permanently delete {n} item(s)? This can't be undone.", trashEmptyQ: "Permanently delete all {n} item(s) in Trash? This can't be undone.",
    trashMoved: "Moved to Trash", trashRestored: "Restored {n} item(s).", trashRestoredDup: "{s} already existed again, so no copy was added.", trashDeletedAgo: "Deleted {d}", trashDaysLeft: "{n} days left", trashLastDay: "Less than a day left", trashTrimmed: "Trash was full, so the oldest items were removed to make room.",
    notifTitle: "Notifications", notifBtn: "Notifications", notifEmpty: "You're all caught up.", notifEmptyHint: "Finished blocks and sync alerts will show up here.", notifMarkAll: "Mark all read", notifClear: "Clear all", notifDismiss: "Dismiss", notifJustNow: "Just now", notifUnread: "{n} unread",
    "nf.blockDone.t": "Block completed", "nf.blockDone.b": "{name}: {correct} of {total} correct ({pct}%).",
    "nf.syncReauth.t": "Google Drive needs reconnecting", "nf.syncReauth.b": "Your Google session expired. Open the account menu and tap Reconnect. Local changes are kept.",
    "nf.syncError.t": "Drive sync problem", "nf.syncError.b": "Couldn't sync with Google Drive. Your data on this device is safe.",
    "nf.syncLinked.t": "Google Drive connected", "nf.syncLinked.b": "Your library and Analytics now sync across your devices.",
    saveToLibrary: "Save to Library", libSaved: "Saved {n} new block(s) to your library.", libDup: "{d} already in your library.", libNothing: "Already in your library — nothing new to save.",
    libTitle: "Qbank Library", libCount: "{n} saved", libEmpty: "Nothing saved yet. Paste or upload a question bank and choose \u201cSave to Library\u201d to keep it on this device. Sign in with Google to also sync it through your Drive.",
    libMeta: "{q} questions · imported {d}", libLastScore: "Last score {pct}% ({c}/{t})", libNoScore: "Not attempted yet", libCompleted: "Completed · {pct}% ({c}/{t})", tabLibrary: "Qbank", tabHistory: "Analysis", tabImport: "Import", importPageTitle: "Import Qbank", histTitle: "Analytics", histEmpty: "No finished sessions yet. Every block you complete is logged here, including custom and mixed sessions.", histNote: "Each finished session is saved as its own log. Custom and mixed sessions never change your Qbank cards; a card is marked Completed only when you run that whole Qbank on its own. The 25 most recent sessions also keep their full question-by-question review; older ones keep a summary.", histKindBank: "Qbank", histKindCustom: "Custom", histKindRetest: "Retest", histQ: "{n} questions", histAnswered: "{a}/{n} answered", histSources: "From: {s}", histBySubject: "By subject", histDelete: "Delete this log", histClear: "Clear history", histClearQ: "Delete all {n} logged sessions? They move to Trash for 30 days. Your Qbank cards are not affected.", histClearGo: "Delete all", histToggle: "Show details", histSelectAll: "Select all", histDeselect: "Deselect all", histDeleteSelQ: "Delete {n} selected session(s)? They move to Trash for 30 days. Your Qbank cards are not affected.", histReview: "Review Exam", histNoReview: "Review unavailable", histNoReviewFlash: "The full review for this session is no longer stored.", histMixed: "Mixed: {n} blocks · {q} Questions", histNamed: "{name} · {q} Questions", histDone: "Completed {d}", anOverall: "Overall you answered {n} questions:", anCorrect: "correctly", anHints: "correctly using hints", anIncorrect: "incorrectly", anCenter: "Correct + using hints", anQ: "({n} questions)", anQ1: "(1 question)", tabConsole: "Console", csGoodMorning: "Good morning", csGoodAfternoon: "Good afternoon", csGoodEvening: "Good evening", csStreakLine: "{n}-day study streak", csReadyLine: "Ready when you are.", csNoSession: "No session in progress", csNoSessionHint: "Start a Qbank from your library, or import a new one.", csOpenLibrary: "Open Library", csImportNew: "Import a Qbank", csViewAll: "View all", csStatSessions: "Sessions", csStatWeek: "{n} this week", csStatAnswered: "Questions answered", csStatAccuracy: "Accuracy", csStatStreak: "Day streak", csStatDays: "{n} days", csStatDay1: "1 day", csHighlights: "Analytics highlights", csTrend: "Recent scores", csTrendHint: "Last {n} sessions · dashed line = 70%", csTrendNeed: "Finish 2 sessions to see your trend.", csStrong: "Strongest subjects", csWeak: "Needs work", csSubjNeed: "Answer at least 5 questions in a subject to rank it.", csRecent: "Recent sessions", csYourLibrary: "Your library", csLibSub: "{n} Qbanks saved", csLibEmpty: "Your library is empty. Import a Qbank to get started.", csFirstTitle: "Let's get your first session going", csFirstBody: "Import a Qbank (the JSON your AI tool writes), save it to your library, then run it as a timed or tutor block. Your stats will show up right here.", csProgress: "{a} of {n} answered",
    libStart: "Start", rateTitle: "How well did you know this?", "rate.again": "Again", "rate.hard": "Hard", "rate.good": "Good", "rate.easy": "Easy",
    poolAgain: "Rated Again", poolHard: "Rated Hard", poolAgainHard: "Again + Hard",
    "rt.again": "Rated Again", "rt.hard": "Rated Hard", "rt.againhard": "Rated Again/Hard",
    sufAgain: "Retest Again", sufHard: "Retest Hard", sufAgainHard: "Retest Again/Hard",
    textSize: "Text size", textSmaller: "Smaller text", textLarger: "Larger text", textReset: "Reset", libMixMax: "Max ({n})", libMixCustom: "Custom", libMixCustomHint: "1–{n}", libCountTitle: "Choose question count", libCountHint: "Draws a random, subject-balanced set of questions from this bank. Scores from this block never change the bank's last score.", libLoad: "Load {n} questions", libLoadOne: "Load 1 question", libShareSel: "Share / Export Selected", libExporting: "Exporting your selection ({n}) as one file…", libExportShared: "Shared your selection ({n}) as one file.", libExportDownloaded: "Downloaded your selection ({n}) as one file.", libExportFailed: "Export failed. Please try again.", bundleFound: "Bundle detected: {n} blocks ({names}). Press Import to choose which ones to add to your library.", libEditSel: "Edit Selected", libDeleteSel: "Delete Selected", libEditing: "{i} of {n}", libSelectHint: "Tick blocks to load, share, rename or delete them. Tick two or more to mix them into one custom block.", libDeleteSelQ: "Delete {n} selected Qbank(s)? They move to Trash, where you can restore them for 30 days.", libMixTitle: "Mix selected banks", libMixHint: "Merges the ticked banks into one shuffled block, with systems and disciplines spread evenly.", libMixPool: "{q} questions · {s} subjects", libMixDupes: "{d} duplicate(s) removed", libMixSize: "Questions", libMixAll: "All ({n})", libMix: "Mix {n} questions", libMixOne: "Mix 1 question", mixedName: "Mixed Qbank ({n} banks)",
    libDeleteQ: "Delete this block?", libDelete: "Delete", libLocalNote: "Saved in this browser and, when you're signed in with Google, synced to your Drive. Clearing site data removes only the local copy.",
    resetData: "Reset All Local Data", resetDataWarn: "This permanently deletes your Qbank library, saved exam progress, Trash and preferences from this browser and signs you out of Drive sync. Copies already synced to your Google Drive are not deleted; signing back in restores them. It can't be undone.", resetDataConfirm: "Yes, delete everything",
    resumed: "Session restored — you're back where you left off.", storageFull: "Couldn't write to browser storage (it may be full or disabled). Your progress is not being backed up right now.",
    leaveConfirm: "You have a block in progress. Leaving now discards it. Continue?",
    settings: "Settings", dark: "Dark mode", lang: "Language",
    "tabProfile": "Study Profile", "menuProfile": "Profile", "tutorSrcTitle": "Tutor suggested sources", "tutorSrcHint": "This block draws on the references below. Have them open so you can study along as you answer.", "tutorSrcQ": "{n} question(s)", "tutorSrcCount": "{n} source(s)", "tutorSrcStart": "Continue", "tutorSrcBtn": "Sources", "syncShort": "Sync", "acctSave": "Save", "acctSaved": "Saved", "spTitle": "Study Profile", "spHint": "One standard file that tells Oworld where you are in your studies: your term and semester calendar, syllabus weeks, class schedule, exams and plan. Your tutor uses it on the Console, in the Library and in notifications.", "spSyncLocal": "Saved on this device. Sign in with Google (profile menu) to sync it through your Drive.", "spSyncDrive": "Syncs with your Google Drive", "spBuildTitle": "Build your profile with AI", "spBuildBody": "Copy the prompt, give it to your AI tool together with your syllabi, semester calendar, class timetable and exam schedule (PDF, screenshot or pasted text; send what you have), then paste the JSON it returns below.", "spUpdateTitle": "Update your profile", "spUpdateBody": "Give your AI tool the prompt again (with a new syllabus, schedule or semester calendar if you have one) to refresh your week, plan and strengths. Ids and ticked tasks are kept.", "spModeNew": "Start fresh", "spModeUpdate": "Update current profile", "spIncludeStats": "Include my study stats", "spIncludeStatsHint": "Adds a compact summary of your Analytics so the AI can write your strengths, gaps and pace from real results.", "spCopyPrompt": "Copy prompt", "spViewPrompt": "Preview prompt", "spHidePrompt": "Hide prompt", "spPasteLabel": "Paste the AI's JSON", "spPasteOpen": "Show box", "spPastePh": "Paste the profile JSON here…", "spLoad": "Load profile", "spUpload": "Upload .json", "spReplaceNote": "Loading replaces your current profile. Tasks you already ticked stay ticked.", "spLoaded": "Profile loaded. Your tutor is now on the Console.", "spErrParse": "That doesn't look like JSON. Paste only the AI's reply (or upload the file).", "spErrShape": "This JSON isn't a Study Profile. It needs at least a term, courses, assessments or a plan.", "spWarnTruncated": "The reply looked cut off, so only the complete part was loaded. Ask the AI to continue and update your profile.", "spWarnDates": "{n} assessment(s) had no usable date and were left out: {titles}.", "spWarnDropped": "{n} incomplete item(s) were left out.", "spWarnNoStart": "No term start date was found, so the current week can't be tracked automatically.", "spTermWeek": "Week {w} of {n}", "spTermWeekNoTotal": "Week {w}", "spTermBefore": "Starts in {n} days", "spTermBefore1": "Starts tomorrow", "spTermAfter": "Term ended", "spTermUnknown": "Week unknown", "spThisWeek": "This week", "spNoFocus": "No topics mapped for this week.", "spNext": "Next assessment", "spNoNext": "No upcoming assessments.", "spToday": "Today", "spTomorrow": "Tomorrow", "spInDays": "in {n} days", "spTodayNone": "Nothing due today.", "spWeekly": "{a} of {n} questions this week", "spAssessments": "Upcoming assessments", "spTasks": "Plan", "spNoTasks": "No tasks yet.", "spCourses": "Syllabus map", "spWeekN": "Wk {n}", "spSource": "Source", "spConf": "Confidence: {c}", "spConf.high": "high", "spConf.medium": "medium", "spConf.low": "low", "spAssump": "Assumptions the AI made", "spRisk": "Risk", "spRisk.low": "low", "spRisk.medium": "medium", "spRisk.high": "high", "spStrengths": "Strengths", "spGaps": "Gaps", "spExport": "Export JSON", "spDelete": "Delete profile", "spDeleteQ": "Delete your Study Profile? It is removed from this device and from Drive sync. Your Qbanks and Analytics are not touched.", "spDeleteGo": "Delete", "spSchemaView": "View JSON schema", "spSchemaHide": "Hide JSON schema", "spSchemaTitle": "Study Profile JSON schema", "spCardTitle": "Your tutor", "spCardOpen": "Open profile", "spCardInviteTitle": "Set up your Study Profile", "spCardInviteBody": "Give Oworld your syllabi, calendar, class timetable and exam schedule once and your tutor will keep track of your week, your classes, your exams and what to study next.", "spCardInviteBtn": "Set up profile", "spStartBlock": "Start a {s} block", "spLibStrip": "Tutor suggests for week {w}", "spLibStart": "{title} ({n} Q)", "sgBefore": "Your term starts {when}. Get your Qbanks ready.", "sgExam": "{title} is {when}.", "sgExamCover": "{title} is {when} and covers {coverage}.", "sgTasks": "{n} task(s) due today or overdue.", "sgPaceBehind": "You're behind this week's pace: {a} of {t} questions. A short block today closes the gap.", "sgPaceDone": "Weekly target reached ({a}/{t}). Nice work.", "sgPaceOn": "On pace: {a} of {t} questions this week.", "sgWeak": "{subject} is at {pct}% and it's on this week's list.", "sgNoFocus": "No topics are mapped for this week. Update your profile with the syllabus.", "sgStale": "Your profile is {n} days old. Update it so your tutor stays accurate.", "nf.examSoon.t": "Exam coming up", "nf.examSoon.b": "{title} is in {days} days.", "nf.examTomorrow.t": "Exam tomorrow", "nf.examTomorrow.b": "{title} is tomorrow. Do a light review and rest.", "nf.examToday.t": "Exam today", "nf.examToday.b": "{title} is today. Good luck!", "nf.weekStart.t": "Week {week} of {total}", "nf.weekStart.b": "This week: {topics}", "nf.termStart.t": "Term starts soon", "nf.termStart.b": "Your term starts in {days} day(s). Get your Qbanks ready.", "nf.paceBehind.t": "Behind this week's pace", "nf.paceBehind.b": "{a} of {t} questions so far. A short block today helps.", "nf.tasksDue.t": "Tasks due", "nf.tasksDue.b": "{n} task(s) due today or overdue. Open the Console.", "nf.profileStale.t": "Update your profile", "nf.profileStale.b": "Your Study Profile is {n} days old.", "nf.profileLoaded.t": "Study Profile ready", "nf.profileLoaded.b": "Your tutor now follows {term}.",
    "spPromptTitle": "Study Profile — AI prompt",
    "sgEve": "{title} is tomorrow. Keep it light: review your weakest topic, then rest.", "sgDeadline": "Deadline: {title} is {when}.", "sgBreakNow": "{title}: no classes today. Classes resume {when}. A good time to close gaps.", "sgBreakSoon": "{title} starts {when}. Fit a heavier study block in before it.", "sgStreak": "No practice yet today. A short block keeps your {n}-day streak alive.", "sgUntested": "{n} of {total} topics for {title} have no practice data yet.",
    "nf.breakSoon.t": "Break starts tomorrow", "nf.breakSoon.b": "{title} starts tomorrow. Plan your study before it.", "nf.deadlineSoon.t": "Deadline coming up", "nf.deadlineSoon.b": "{title} is due in {days} day(s).", "nf.deadlineToday.t": "Deadline today", "nf.deadlineToday.b": "{title} is due today.",
    "tuWindow": "Free {from} – {to}: about {qs} questions fit", "tuNoData": "no data", "tuReadyHint": "Tap a topic to start a block on it.", "tuExams": "Upcoming exams", "tuWeight": "{n}% of grade", "tuReadyPct": "{n}% ready", "tuWeakest": "Weakest: {topic} {pct}%", "tuUntestedN": "{n} topic(s) not practiced yet", "tuDeadline": "Deadline", "tuTodayQs": "{a} of {n} questions today", "tuGoalMet": "Daily goal met", "tuStreak": "{n}-day streak", "spEdit": "Edit", "spExamDate": "Exam date", "spExamTime": "Exam time", "spSave": "Save", "spMarkDone": "Already happened", "spMarkUpcoming": "Mark as upcoming", "spPastAssess": "Past and completed ({n})", "spDoneTag": "Done", "spFixDateHint": "Wrong date? Fix it here and your tutor will follow it, even after you update your profile.", "spWarnCalDates": "{n} calendar event(s) had no usable date and were left out.",
    "spEvt.holiday": "Holiday", "spEvt.break": "Break", "spEvt.exam-period": "Exam period", "spEvt.deadline": "Deadline", "spEvt.class": "Class", "spEvt.other": "Event",
    "csCalendar": "Semester calendar", "csCalPrev": "Previous month", "csCalNext": "Next month", "csCalToday": "Today", "csCalNothing": "Nothing scheduled.", "csCalStudied": "Studied: {n} session(s) · {q} questions", "csCalLegExam": "Exam", "csCalLegTask": "Task due", "csCalLegEvent": "Calendar", "csCalLegStudy": "Studied", "csCalNoProfile": "Set up your Study Profile to see your exams, tasks and breaks here.", "csCalSetup": "Set up profile", "csCalMore": "+{n} more",
    "tabCalendar": "Schedule", "calTitle": "Schedule", "calHint": "Your whole term on one calendar: classes, exams, tasks, breaks and the days you studied. Tap a day to see and edit it.", "calMonth": "Month", "calWeek": "Week", "calAgenda": "Agenda", "calPrev": "Previous", "calNext": "Next", "calLayerKey": "Key dates", "calTermStart": "Term starts", "calTermEnd": "Term ends", "calTargetExam": "Target exam", "calClassesN": "{n} classes", "calStatTerm": "Term", "calStatOpen": "Open tasks", "calStatWeekQ": "Questions this week", "calAgendaEmpty": "Nothing scheduled in this stretch.", "calOpenFull": "Full schedule", "spMapNote": "Showing the weeks around today. Expand to see the full syllabus map.",
    tbGapTitle: "Gap analysis", tbGapHint: "Your logged blocks grouped by subject tag and compared with the blueprint: exam weight, your share of practice, your accuracy and the gap to target (points).", tbColExam: "Exam", tbColPractice: "You", tbColAcc: "Acc.", tbColGap: "Gap", tbGapWorst: "Largest accuracy gap: {a} ({n} pts below target).", tbGapUnder: "Most under-practiced: {b}.", tbGapNone: "Finish a block to see your gaps.", tbUnmapped: "Not mapped to the blueprint", tbUnmappedHint: "These subject tags in your results match no blueprint item. Add them to a match list.", tbBpPrompt: "Blueprint — AI prompt", tbBpSchema: "Blueprint — JSON template", tbCourses: "Priority course", tbStarOn: "Make {c} your priority course", tbStarOff: "Remove priority course", tbStarHint: "The starred course is studied first: its topics lead this week's focus and its blueprint items rank higher.", "calNew.task": "New task", "calNew.event": "New event", "calNew.exam": "New exam", "calEdit.task": "Edit task", "calEdit.event": "Edit event", "calEdit.exam": "Edit exam", "calAdd.task": "Task", "calAdd.event": "Event", "calAdd.exam": "Exam", "calF.title": "Title", "calF.date": "Date", "calF.time": "Time", "calF.endDate": "Ends on", "calF.endTime": "Ends at", "calF.type": "Type", "calF.repeat": "Repeats", "calF.until": "Repeat until", "calF.subject": "Subject", "calF.weight": "Weight %", "calF.place": "Location", "calF.course": "Course", "calF.topics": "Topics (comma separated)", "calF.notes": "Notes", "calF.done": "Already happened", "calRep.none": "Does not repeat", "calRep.daily": "Daily", "calRep.weekly": "Weekly", "calRep.monthly": "Monthly", calRepeats: "repeats {r}", calSave: "Save", calCancel: "Cancel", calDelete: "Delete", calEdit: "Edit", calDeleted: "Deleted “{s}”.", calMoved: "Moved “{s}” to {d}.", calUndo: "Undo", calFind: "Find in calendar", calJump: "Go to date", calExport: "Export .ics", tbScale: "Scale weights to 100%", tbScaleHint: "Overlapping ranges (a question can count toward several disciplines) can add up to more than 100%. This rescales each group and keeps the original numbers as the official range. Comparisons already use the scaled shares.", tbConf: "Source confidence", "tbConfLvl.high": "High", "tbConfLvl.medium": "Medium", "tbConfLvl.low": "Low", "tbCg.official": "Cites official sources ({h}).", "tbCg.version": "Outline edition recorded: {v}.", "tbCg.fresh": "Retrieved {n} days ago.", "tbCg.weights": "Weights add up to about 100% in every group.", "tbCf.noSource": "No source cited.", "tbCf.unofficial": "The cited pages are not official USMLE, NBME or FSMB sites.", "tbCf.noVersion": "No outline edition recorded.", "tbCf.noDate": "No retrieval date recorded.", "tbCf.old": "Last checked {n} days ago, longer than a semester.", "tbCf.weights": "{g} weights add up to {n}%, not 100%.", "tbCf.noWeights": "No exam weights given.", "tbCf.template": "Template with placeholder weights, not the official outline.", tbCadence: "Update your blueprint at least once every semester: the outline can change and your tutor plans from it.", tbDueOn: "Next update due by {d}.", tbUpdate: "Update blueprint", tbDue: "Your blueprint was last checked {n} days ago. Update it at least once a semester.", tbDueTerm: "A new term started since your blueprint was last checked. Update it so your tutor follows the current outline.", tbSoon: "Your blueprint is {n} days old. Plan an update this semester.", "nf.bpDue.t": "Update your blueprint", "nf.bpDue.b": "It was last checked {n} days ago. Refresh it at least once a semester so your tutor follows the current USMLE outline.", "nf.bpDueTerm.t": "New semester: update your blueprint", "nf.bpDueTerm.b": "Your term started after your blueprint was last checked. Re-run the AI prompt to confirm the current USMLE outline.", tbSource: "Source: {v} {u}", tbNoSource: "No official source recorded: re-run the AI prompt so it can search the current USMLE outline.", tabTutor: "Tutor", tbTitle: "Tutor Dashboard", tbOpenTutor: "Open Study Hub", tabStudyHub: "Study Hub", shTitle: "Study Hub", shSub: "Your tutor, blueprint and Study Profile in one place: where you are in your term, what to study next and how ready you are.", shNavOverview: "Overview", shNavPriorities: "Priorities", shNavBlueprint: "Blueprint", shNavProfile: "Study Profile", shJumpTo: "Jump to section", shSetupCta: "Set up your Study Profile", "plAddAs": "Add as…", "plSrc.exam": "Exam", "plSrc.event": "Event", "plSrc.class": "Class", "plAct.study": "Study", "plAct.task": "Add task", "plAct.skip": "Skip class", "plAct.editClass": "Edit classes", "plPrepTitle": "Prepare: {s}", "plReviewTitle": "Review: {s}", "plTaskAdded": "Added task “{s}”.", "plSkipped": "Skipped “{s}” on {d}.", plAgendaHint: "Exams, classes and events in the next 7 days appear here with their own actions.", tbBpTitle: "Blueprint", tbBpBody: "A blueprint is one JSON file with your exam's test domains, system weights and target competencies. Give the prompt to an AI tool that can browse the web: it looks up the latest official USMLE outline (usmle.org, NBME, FSMB) and returns the JSON to paste here. The built-in template is only a placeholder. The tutor ranks what to study by weight, your accuracy and this week's syllabus.", tbTemplate: "Use USMLE template", tbCopyPrompt: "Copy AI prompt", tbCopySchema: "Copy template JSON", tbCopied: "Copied", tbPaste: "Paste the blueprint JSON here…", tbLoad: "Load blueprint", tbRemove: "Remove blueprint", tbErrParse: "That doesn't look like JSON. Paste only the blueprint (or upload the file).", tbErrShape: "This JSON has no domains, systems or competencies.", tbReady: "Blueprint readiness", tbCoverage: "Coverage", tbCoverageSub: "items with 5+ answers", tbCountdown: "Days to exam", tbTarget: "target {n}%", tbPriority: "Priority targets", tbPriorityHint: "Ranked by exam weight, the gap to your target and this week's topics. Tick items to build one block, or tap a name to start it.", tbBuild: "Build block from {n} selected", tbShareLine: "{n} answered · {share}% of your practice vs {w}% of the exam · target {target}%", tbMatches: "Qbanks that match", tbNoMatches: "No Qbank in your library matches these topics yet.", tbSystems: "Systems", tbDomains: "Test domains", tbComps: "Competencies", tbLegend: "Bar = your accuracy, black tick = target. Weights are a study guide: check them against the current official outline.", tbNoBpTitle: "No blueprint loaded", tbNoBpBody: "Load a blueprint to see priorities by exam weight.", "nf.blueprintLoaded.t": "Blueprint loaded", "nf.blueprintLoaded.b": "Your tutor now plans around {exam}.",
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
    anTrendTitle: "Score trend", anTrendHint: "Last {n} sessions · dashed line = 70%", anTrendNeed: "Finish 2 sessions to see your trend.", anSubjTitle: "Performance by subject", anActTitle: "Daily activity", anActHint: "Questions answered, last 14 days", anStatSessions: "Sessions", anStatAnswered: "Questions answered", anStatAccuracy: "Accuracy", anStatAvgTime: "Time / question", anStatCorrectPct: "Answered correctly", anStatTotalTime: "Total time", anStatBanks: "{n} Qbanks added", anStatBank1: "1 Qbank added", anStatBest: "Best session {n}%",
    csCalPlan: "Plan checklist", csCalPlanCount: "{d}/{n} done",
    csPlanAddPh: "Add to your plan…", csPlanAdd: "Add", csPlanShowAll: "Show all ({n})", csClassNoneHere: "No class times yet. Add them on the Calendar page.", spPlanDueOpt: "Due date (optional)", csPlanAddFor: "Added for {d}", csPlanRemove: "Remove from plan",
    "plTally": "{d} of {n} completed", "plTallyEmpty": "Add your first task to start the tally.", "plDoneToday": "{n} completed today",
    "plF.all": "All", "plF.open": "Open", "plF.overdue": "Overdue", "plF.today": "Due today", "plF.upcoming": "Upcoming", "plF.nodate": "No date", "plF.done": "Done",
    "plG.overdue": "Overdue", "plG.today": "Due today", "plG.upcoming": "Upcoming", "plG.nodate": "No date", "plG.done": "Completed",
    "plSearch": "Search tasks", "plKindAll": "All types", "plKind.qbank": "Qbank", "plKind.reading": "Reading", "plKind.review": "Review", "plKind.exam": "Exams", "plKind.class": "Classes", "plKind.other": "Other",
    "plPriority": "Priority", "plPri.high": "High", "plPri.normal": "Normal", "plPri.low": "Low", "plOptions": "Options", "plOverdueBy": "{n}d overdue", "plFromCal": "Calendar",
    "plOpenCal": "Show in calendar", "plOpenCalBtn": "Open schedule", "plSetDate": "Set a date", "plEditTask": "Edit task", "plClearDone": "Clear completed ({n})", "plClearedN": "Cleared {n} completed task(s).",
    "plMoveOverdue": "Move {n} overdue to today", "plMovedN": "Moved {n} overdue task(s) to today.", "plShowDone": "Show completed ({n})", "plHideDone": "Hide completed", "plNoMatch": "No tasks match these filters.",
    "calF.priority": "Priority", "calF.taskDone": "Completed", "calStatDone": "Completed", "calUnscheduled": "Unscheduled tasks ({n})", "calScheduleHere": "Schedule here", "calDayDone": "{d}/{n} done",
    qhubTitle: "Qhub", qhubSoon: "Coming soon", qhubBody: "A shared, validated Qbank repository. Browse and import vetted blocks.",
    csClasses: "Classes", csClassEdit: "Edit", csClassDone: "Done", csClassNone: "No class times yet. Use Edit to add them.", csClassName: "Class name", csClassLoc: "Room / location", csClassAddMeeting: "Add meeting time", csClassNew: "New class name…", csClassAdd: "Add class",
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
    load: "Load exam", importQbank: "Import New Qbank", importInLibrary: "Already in your library — start it from there.", lobbySaveN: "Save to Library ({n})", lobbyRemoveN: "Remove ({n})", triageHint: "Tick this Qbank to save it to your library or remove it.", lobbyTriageNote: "These Qbanks were just imported. Tick the ones you want, then use Save to Library to keep them or Remove to dismiss them.", aiLaunchTitle: "AI Quick Launch", aiLaunchHint: "Open your AI tool, paste the Question Recipe Prompt below along with your topic or notes, then bring the reply back here.", aiLaunchOpens: "Opens in a new tab", nbTitle: "NotebookLM Notebooks", nbHint: "Your study notebooks, by block. Each one opens in NotebookLM in a new tab.", nbAll: "USMLE (all-in-one notebook)", nbBlock1: "Block 1", nbBlock2: "Block 2", nbCore: "Core sciences",
    wasIncorrectBadge: "Missed before reset", missedBeforeN: "{n} missed before reset", explHide: "Hide explanation", explShow: "Show explanation",
    activeTitle: "Continue your test from another device?", activeTitleConflict: "A different version of this test is on another device",
    activeBody: "“{name}”: question {n} of {total}, {answered} answered. Last updated {time}.",
    activeReplaceWarn: "Continuing replaces the exam that is open on this device.", activeContinue: "Continue here", activeNotNow: "Not now", activeKeepMine: "Keep this device's",
    activeResumed: "Picked up “{name}” from another device.", activeEndedElsewhere: "This test was finished on another device.",
    activeMissing: "Couldn't load that test from Google Drive. Check your connection and try again.", activeMixed: "Mixed from {banks}.",
    themeLabel: "Theme", themeLight: "Light", themeDark: "Dark",
    accountBtn: "Account", viewAccount: "Manage account", signIn: "Sign in with Google", signOut: "Sign out", signedInAs: "Signed in with Google", signInHint: "Sign in to sync your library and Analytics across devices through your Google Drive.", signOutHint: "Signing out stops syncing on this device. Your data stays here and in your Drive.", signedOutNote: "Not signed in", "cpTitle": "Career & study profile", "cpHint": "Tell Oworld who you are and what you're preparing for. Your tutor uses it to set goals and to build your Study Profile.", "cpAbout": "About you", "cpStatus": "Current status", "cpStatus.pick": "Select…", "cpStatus.student": "Medical student", "cpStatus.graduate": "Medical graduate (IMG)", "cpStatus.resident": "Resident", "cpStatus.other": "Other", "cpGradYear": "Graduation year", "cpCountry": "Country", "cpCity": "City", "cpUniversity": "University", "cpSchool": "School or faculty", "cpPhCountry": "Dominican Republic", "cpPhCity": "Santo Domingo", "cpPhUniversity": "Universidad Iberoamericana (UNIBE)", "cpPhSchool": "School of Medicine", "cpObjective": "Study objective", "cpCoursework": "Medical school studies", "cpCourseworkHint": "Pick everything you're studying for right now.", "cpWork.generals": "Generals", "cpWork.preclinical": "Preclinical", "cpWork.clinical": "Clinical studies", "cpUsmle": "USMLE", "cpUsmleHint": "Pick the steps you're preparing for. Add a target date if you have one.", "cpStep.step1": "Step 1", "cpStep.step2ck": "Step 2 CK", "cpStep.step3": "Step 3", "cpTargetDate": "Target date", "cpClassOf": "Class of {y}", "cpNext": "Next target: {step}, {when} ({date})", "cpSavedLocal": "Saved on this device.", "acctSettings": "Account Settings", "acctName": "Name", "acctEmail": "Email", "acctLinked": "Linked via", "acctCreated": "Account created", "acctNone": "Not available", "acctLinkedGoogle": "Google", "acctSignedOutHint": "Sign in with Google to see your account details here.", "dzTitle": "Danger Zone", "dzDesc": "Deleting your account permanently removes your Qbanks, Analytics, Personal Database, Study Profile and settings from this device and signs you out.", "dzDelete": "Delete my account", "dzDownloadFirst": "Download all your files before you delete your account. This can't be undone.", "dzDownload": "Download all files", "dzDownloaded": "Downloaded. Your files are saved.", "dzDownloadFailed": "Download failed. Please try again.", "dzConfirmGo": "Delete permanently", "dzSkip": "Delete without downloading", "dzDriveNote": "A copy synced to your Google Drive stays there until you remove it from Drive.", "dzFileName": "oworld-account-backup-{d}.json", "spCareerEdit": "Edit in account", "spCareerAdd": "Add details", "spCareerEmpty": "Add your university, graduation year and USMLE targets in your account and they will show up here. Your tutor uses them too.", "spNoDate": "No target date",
    syncTitle: "Cloud Sync", syncHint: "Keeps your Qbank library and Analytics in step across your devices through a private app folder in your own Google Drive. Share / Export to a friend still works separately.", syncOff: "Cloud sync isn't set up in this version of the app.", syncConnect: "Connect Google Drive", syncNow: "Sync now", syncDisconnect: "Disconnect", syncReconnect: "Reconnect", syncStNone: "Not connected", syncStBusy: "Syncing…", syncStDone: "Synced {time}", syncStReauth: "Reconnect needed", syncStError: "Sync problem", syncBlocked: "Google sign-in couldn't load here (blocked or offline).", syncDenied: "Drive access wasn't granted. Allow the app-data permission to sync.", syncGenericErr: "Couldn't sync with Google Drive. Your data on this device is safe.", syncReauthHint: "Your Google session expired. Tap Reconnect; local changes are kept and will sync.", syncGuide: "Google Drive sync (profile menu, top right) keeps your library and Analytics in step across devices. Share / Export is still the way to send a block to someone else.", homeBtn: "Home", removeExam: "Remove exam", removeTitle: "Remove this exam?", removeBody: "This clears the loaded exam and any progress or results in it. Your saved Qbank Library is not affected.", removeBodyUnsaved: "This clears the loaded exam and any progress or results in it. Some of its blocks are not saved to your Library and would be gone for good. Cancel and tap Save to Library first if you want to keep them.", removeGo: "Remove", libRename: "Rename Qbank", libRenameSave: "Save name", howItWorks: "Help", guideStep: "Step {n} of {total}", guideBack: "Back", guideNext: "Next", guideDone: "Got it", guideClose: "Close guide", navCollapse: "Collapse question list", navExpand: "Expand question list", resumeSession: "Resume Session", sessionInProgress: "Session in progress", sessionPos: "Question {n} of {total}", examLoadedLabel: "Exam loaded", openLobby: "Open exam lobby", inProgressTag: "In progress", discardTitle: "Discard in-progress session?", discardBody: "Starting something new replaces your in-progress block, and its answers will be lost.", discardGo: "Discard and continue", hide: "Hide", recipe: "Question Recipe Prompt",
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
    recipeTutor: "Tutor suggests", recipeTutorHint: "Tap topics to build this recipe around them. Tap again to remove one.", phSystems: "e.g. Cardiovascular, Renal, Neuro…", phDisc: "e.g. Pharmacology, Biochemistry, Microbiology…",
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
    hlTip: "Select text, then pick a highlight color.", hlColor: "Highlight color", hlYellow: "Yellow", hlGreen: "Green", hlBlue: "Blue", hlPink: "Pink", hlOrange: "Orange",
    explShowAll: "Show all explanations", explHideAll: "Hide all explanations",
    impMidTitle: "Import Qbank", impMidHint: "Adds it to your library. Your current session keeps going, untouched.", impMidPlaceholder: "Paste Qbank JSON here, or choose a file", impMidFile: "Choose file", impMidAdd: "Add to library", impMidClose: "Close", sessionKept: "Your current session was not touched.",
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
    search: "Search…", noMatches: "No matches in {tab}.", searchTitle: "Search", searchPh: "Search Qbanks, questions, notes and sessions…", searchHint: "Type at least 2 letters. Searches your Library, Calendar (events, dates, times, classes, exams, tasks), Database (questions, excerpts, notes, comments) and Analytics. Try “Oct 20”, “Tuesday” or “9:00”.", searchGrpCal: "Schedule", searchGoDate: "Go to {d}", searchNone: "No results for “{q}”.", searchGrpLib: "Library", searchGrpDb: "Database", searchGrpHist: "Analytics", searchQsMatch: "{n} matching question(s)", searchClose: "Close search",
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
    tabDatabase: "Base de datos", dbTitle: "Base de datos personal", dbHint: "Preguntas, extractos y notas que guardaste mientras estudiabas.", dbAdd: "Añadir a la base de datos", dbSavedToast: "Guardado en la base de datos", dbAll: "Todo", dbQuestions: "Preguntas", dbExcerpts: "Extractos", dbNotes: "Notas", dbSearch: "Buscar en tu base de datos", dbEmpty: "Tu base de datos está vacía.", dbEmptyHint: "Mientras haces un bloque, selecciona texto y toca Añadir a la base de datos, guarda una pregunta con el marcador o guarda una nota desde el panel de Notas.", dbNoMatch: "No hay coincidencias.", dbSaveQ: "Guardar pregunta", dbSavedQ: "Guardada en la base de datos", dbSaveNote: "Guardar en la base de datos", dbUpdateNote: "Actualizar en la base de datos", dbShowAns: "Mostrar respuesta", dbHideAns: "Ocultar respuesta", dbEdit: "Editar", dbSave: "Guardar", dbCancel: "Cancelar", dbCopy: "Copiar", dbCopied: "Copiado", dbDelete: "Eliminar", dbConfirmDel: "¿Eliminar?", dbClearAll: "Borrar todo", dbClearConfirm: "¿Mover todo el contenido de tu base de datos a la papelera? Podrás restaurarlo durante 30 días.", dbKindQ: "Pregunta", dbKindE: "Extracto", dbKindN: "Nota", dbCommentPh: "Añade tu propio comentario…", dbAddComment: "Añadir comentario", dbNoteTitle: "Tu nota", dbCorrectTag: "Correcta",
    dbSyncSignIn: "Inicia sesión con Google desde el menú de la cuenta para sincronizarla entre tus dispositivos.", dbImport: "Importar", dbImported: "Se importaron {a} elemento(s); {s} ya estaban en tu base de datos.", dbImportBad: "Ese archivo no es una exportación de la base de datos personal.",
    dbShared: "Compartiste {n} elemento(s) en un solo archivo.", dbDownloaded: "Descargaste {n} elemento(s) en un solo archivo.", dbExportFailed: "Error al exportar. Inténtalo de nuevo.", dbShareText: "Mi base de datos personal de OWORLD ({n} elementos). En OWORLD, abre Base de datos y toca Importar para añadirlos.", dbDelSelQ: "¿Mover {n} elemento(s) seleccionado(s) a la papelera? Podrás restaurarlos durante 30 días.", dbManage: "Administrar", dbExport: "Exportar",
    tabTrash: "Papelera", trashTitle: "Papelera", trashCount: "{n} elemento(s)", trashHint: "Los Qbanks, sesiones de Analíticas y elementos de la base de datos eliminados permanecen aquí {d} días. Restáuralos o elimínalos para siempre.", trashEmpty: "La papelera está vacía.", trashEmptyHint: "Todo lo que elimines de la biblioteca, las Analíticas o la base de datos llega primero aquí, para que puedas recuperarlo.", trashNoneHere: "No hay nada de este tipo en la papelera.",
    trashAll: "Todo", trashQbanks: "Qbanks", trashSessions: "Analíticas", trashDb: "Base de datos", trashKindQbank: "Qbank", trashKindSession: "Sesión",
    trashRestore: "Restaurar", trashRestoreSel: "Restaurar selección", trashDeleteForever: "Eliminar para siempre", trashEmptyBtn: "Vaciar papelera",
    trashPurgeQ: "¿Eliminar definitivamente {n} elemento(s)? No se puede deshacer.", trashEmptyQ: "¿Eliminar definitivamente los {n} elemento(s) de la papelera? No se puede deshacer.",
    trashMoved: "Movido a la papelera", trashRestored: "Se restauraron {n} elemento(s).", trashRestoredDup: "{s} ya existía(n) de nuevo, así que no se añadió ninguna copia.", trashDeletedAgo: "Eliminado {d}", trashDaysLeft: "Quedan {n} días", trashLastDay: "Queda menos de un día", trashTrimmed: "La papelera estaba llena; se quitaron los elementos más antiguos para hacer espacio.",
    notifTitle: "Notificaciones", notifBtn: "Notificaciones", notifEmpty: "Estás al día.", notifEmptyHint: "Aquí aparecerán los bloques terminados y las alertas de sincronización.", notifMarkAll: "Marcar todo como leído", notifClear: "Borrar todo", notifDismiss: "Descartar", notifJustNow: "Ahora mismo", notifUnread: "{n} sin leer",
    "nf.blockDone.t": "Bloque completado", "nf.blockDone.b": "{name}: {correct} de {total} correctas ({pct}%).",
    "nf.syncReauth.t": "Hay que reconectar Google Drive", "nf.syncReauth.b": "Tu sesión de Google caducó. Abre el menú de la cuenta y toca Reconectar. Los cambios locales se conservan.",
    "nf.syncError.t": "Problema de sincronización con Drive", "nf.syncError.b": "No se pudo sincronizar con Google Drive. Tus datos en este dispositivo están a salvo.",
    "nf.syncLinked.t": "Google Drive conectado", "nf.syncLinked.b": "Tu biblioteca y tus Analíticas ahora se sincronizan entre tus dispositivos.",
    saveToLibrary: "Guardar en la biblioteca", libSaved: "Se guardaron {n} bloque(s) nuevo(s) en tu biblioteca.", libDup: "{d} ya estaba(n) en tu biblioteca.", libNothing: "Ya está en tu biblioteca; no hay nada nuevo que guardar.",
    libTitle: "Biblioteca de preguntas", libCount: "{n} guardados", libEmpty: "Aún no hay nada guardado. Pega o sube un banco de preguntas y elige \u201cGuardar en la biblioteca\u201d para conservarlo en este dispositivo. Inicia sesión con Google para sincronizarlo también con tu Drive.",
    libMeta: "{q} preguntas · importado {d}", libLastScore: "Último puntaje {pct}% ({c}/{t})", libNoScore: "Sin intentos aún", libCompleted: "Completado · {pct}% ({c}/{t})", tabLibrary: "Qbank", tabHistory: "Análisis", tabImport: "Importar", importPageTitle: "Importar Qbank", histTitle: "Analíticas", histEmpty: "Aún no hay sesiones terminadas. Cada bloque que completes queda registrado aquí, incluidas las sesiones personalizadas y mezcladas.", histNote: "Cada sesión terminada se guarda como un registro independiente. Las sesiones personalizadas y mezcladas nunca cambian tus tarjetas de Qbank; una tarjeta se marca como Completada solo cuando haces ese Qbank completo por sí solo. Las 25 sesiones más recientes también conservan su revisión completa pregunta por pregunta; las anteriores conservan un resumen.", histKindBank: "Qbank", histKindCustom: "Personalizada", histKindRetest: "Repetición", histQ: "{n} preguntas", histAnswered: "{a}/{n} respondidas", histSources: "De: {s}", histBySubject: "Por materia", histDelete: "Eliminar este registro", histClear: "Borrar historial", histClearQ: "¿Eliminar las {n} sesiones registradas? Pasan a la papelera durante 30 días. Tus tarjetas de Qbank no se ven afectadas.", histClearGo: "Eliminar todo", histToggle: "Ver detalles", histSelectAll: "Seleccionar todo", histDeselect: "Deseleccionar todo", histDeleteSelQ: "¿Eliminar {n} sesión(es) seleccionada(s)? Pasan a la papelera durante 30 días. Tus tarjetas de Qbank no se ven afectadas.", histReview: "Revisar examen", histNoReview: "Revisión no disponible", histNoReviewFlash: "La revisión completa de esta sesión ya no está guardada.", histMixed: "Mezcla: {n} bloques · {q} preguntas", histNamed: "{name} · {q} preguntas", histDone: "Completado {d}", anOverall: "En total respondiste {n} preguntas:", anCorrect: "correctas", anHints: "correctas con pistas", anIncorrect: "incorrectas", anCenter: "Correctas + con pistas", anQ: "({n} preguntas)", anQ1: "(1 pregunta)", tabConsole: "Consola", csGoodMorning: "Buenos días", csGoodAfternoon: "Buenas tardes", csGoodEvening: "Buenas noches", csStreakLine: "Racha de estudio de {n} días", csReadyLine: "Listo cuando tú lo estés.", csNoSession: "Ninguna sesión en curso", csNoSessionHint: "Inicia un Qbank de tu biblioteca o importa uno nuevo.", csOpenLibrary: "Abrir biblioteca", csImportNew: "Importar un Qbank", csViewAll: "Ver todo", csStatSessions: "Sesiones", csStatWeek: "{n} esta semana", csStatAnswered: "Preguntas respondidas", csStatAccuracy: "Precisión", csStatStreak: "Racha de días", csStatDays: "{n} días", csStatDay1: "1 día", csHighlights: "Resumen de analíticas", csTrend: "Puntajes recientes", csTrendHint: "Últimas {n} sesiones · línea punteada = 70%", csTrendNeed: "Termina 2 sesiones para ver tu tendencia.", csStrong: "Materias más fuertes", csWeak: "Por mejorar", csSubjNeed: "Responde al menos 5 preguntas de una materia para clasificarla.", csRecent: "Sesiones recientes", csYourLibrary: "Tu biblioteca", csLibSub: "{n} Qbanks guardados", csLibEmpty: "Tu biblioteca está vacía. Importa un Qbank para comenzar.", csFirstTitle: "Empecemos tu primera sesión", csFirstBody: "Importa un Qbank (el JSON que escribe tu herramienta de IA), guárdalo en tu biblioteca y ejecútalo como bloque cronometrado o con tutor. Tus estadísticas aparecerán aquí.", csProgress: "{a} de {n} respondidas",
    libStart: "Iniciar", rateTitle: "¿Qué tan bien lo sabías?", "rate.again": "Otra vez", "rate.hard": "Difícil", "rate.good": "Bien", "rate.easy": "Fácil",
    poolAgain: "Calificadas Otra vez", poolHard: "Calificadas Difícil", poolAgainHard: "Otra vez + Difícil",
    "rt.again": "Calificadas Otra vez", "rt.hard": "Calificadas Difícil", "rt.againhard": "Calificadas Otra vez/Difícil",
    sufAgain: "Repaso Otra vez", sufHard: "Repaso Difícil", sufAgainHard: "Repaso Otra vez/Difícil",
    textSize: "Tamaño del texto", textSmaller: "Texto más pequeño", textLarger: "Texto más grande", textReset: "Restablecer", libMixMax: "Máx ({n})", libMixCustom: "Personalizado", libMixCustomHint: "1–{n}", libCountTitle: "Elegir cantidad de preguntas", libCountHint: "Toma un conjunto aleatorio y equilibrado por materia de este banco. El puntaje de este bloque nunca cambia el último puntaje del banco.", libLoad: "Cargar {n} preguntas", libLoadOne: "Cargar 1 pregunta", libShareSel: "Compartir / Exportar selección", libExporting: "Exportando tu selección ({n}) en un solo archivo…", libExportShared: "Compartiste tu selección ({n}) en un solo archivo.", libExportDownloaded: "Descargaste tu selección ({n}) en un solo archivo.", libExportFailed: "Error al exportar. Inténtalo de nuevo.", bundleFound: "Paquete detectado: {n} bloques ({names}). Pulsa Importar para elegir cuáles añadir a tu biblioteca.", libEditSel: "Editar selección", libDeleteSel: "Eliminar selección", libEditing: "{i} de {n}", libSelectHint: "Marca bloques para cargarlos, compartirlos, renombrarlos o eliminarlos. Marca dos o más para mezclarlos en un solo bloque personalizado.", libDeleteSelQ: "¿Eliminar {n} Qbank(s) seleccionado(s)? Pasan a la papelera, donde puedes restaurarlos durante 30 días.", libMixTitle: "Mezclar bancos seleccionados", libMixHint: "Une los bancos marcados en un solo bloque mezclado, con sistemas y disciplinas repartidos de forma pareja.", libMixPool: "{q} preguntas · {s} materias", libMixDupes: "{d} duplicada(s) eliminada(s)", libMixSize: "Preguntas", libMixAll: "Todas ({n})", libMix: "Mezclar {n} preguntas", libMixOne: "Mezclar 1 pregunta", mixedName: "Qbank mezclado ({n} bancos)",
    libDeleteQ: "¿Eliminar este bloque?", libDelete: "Eliminar", libLocalNote: "Se guarda en este navegador y, si inicias sesión con Google, se sincroniza con tu Drive. Borrar los datos del sitio elimina solo la copia local.",
    resetData: "Restablecer todos los datos locales", resetDataWarn: "Esto elimina de forma permanente tu biblioteca, el progreso guardado, la papelera y tus preferencias en este navegador y cierra la sincronización con Drive. Las copias ya sincronizadas en tu Google Drive no se eliminan; al volver a iniciar sesión se restauran. No se puede deshacer.", resetDataConfirm: "Sí, eliminar todo",
    resumed: "Sesión restaurada: continúas donde la dejaste.", storageFull: "No se pudo escribir en el almacenamiento del navegador (puede estar lleno o desactivado). Tu progreso no se está respaldando.",
    leaveConfirm: "Tienes un bloque en curso. Si sales ahora se descartará. ¿Continuar?",
    settings: "Ajustes", dark: "Modo oscuro", lang: "Idioma",
    "tabProfile": "Perfil de estudio", "menuProfile": "Perfil", "tutorSrcTitle": "Fuentes sugeridas por el tutor", "tutorSrcHint": "Este bloque se apoya en las referencias de abajo. Tenlas abiertas para estudiar mientras respondes.", "tutorSrcQ": "{n} pregunta(s)", "tutorSrcCount": "{n} fuente(s)", "tutorSrcStart": "Continuar", "tutorSrcBtn": "Fuentes", "syncShort": "Sincronizar", "acctSave": "Guardar", "acctSaved": "Guardado", "spTitle": "Perfil de estudio", "spHint": "Un archivo estándar que le dice a Oworld en qué punto de tus estudios estás: tu periodo y el calendario del semestre, las semanas del programa, el horario de clases, los exámenes y tu plan. Tu tutor lo usa en la Consola, en la Biblioteca y en las notificaciones.", "spSyncLocal": "Guardado en este dispositivo. Inicia sesión con Google (menú de perfil) para sincronizarlo con tu Drive.", "spSyncDrive": "Se sincroniza con tu Google Drive", "spBuildTitle": "Crea tu perfil con IA", "spBuildBody": "Copia el prompt, dáselo a tu herramienta de IA junto con tus programas, el calendario del semestre, tu horario de clases y el calendario de exámenes (PDF, captura o texto pegado; envía lo que tengas) y pega abajo el JSON que te devuelva.", "spUpdateTitle": "Actualiza tu perfil", "spUpdateBody": "Vuelve a darle el prompt a tu herramienta de IA (con un programa, horario o calendario del semestre nuevo si lo tienes) para refrescar tu semana, tu plan y tus fortalezas. Se conservan los ids y las tareas marcadas.", "spModeNew": "Empezar de cero", "spModeUpdate": "Actualizar perfil actual", "spIncludeStats": "Incluir mis estadísticas de estudio", "spIncludeStatsHint": "Añade un resumen compacto de tus Analíticas para que la IA escriba tus fortalezas, puntos débiles y ritmo con resultados reales.", "spCopyPrompt": "Copiar prompt", "spViewPrompt": "Ver prompt", "spHidePrompt": "Ocultar prompt", "spPasteLabel": "Pega el JSON de la IA", "spPasteOpen": "Mostrar cuadro", "spPastePh": "Pega aquí el JSON del perfil…", "spLoad": "Cargar perfil", "spUpload": "Subir .json", "spReplaceNote": "Cargar reemplaza tu perfil actual. Las tareas que ya marcaste siguen marcadas.", "spLoaded": "Perfil cargado. Tu tutor ya está en la Consola.", "spErrParse": "Eso no parece JSON. Pega solo la respuesta de la IA (o sube el archivo).", "spErrShape": "Este JSON no es un Perfil de estudio. Necesita al menos un periodo, cursos, evaluaciones o un plan.", "spWarnTruncated": "La respuesta parecía cortada, así que solo se cargó la parte completa. Pide a la IA que continúe y actualiza tu perfil.", "spWarnDates": "{n} evaluación(es) no tenían una fecha válida y se omitieron: {titles}.", "spWarnDropped": "Se omitieron {n} elemento(s) incompleto(s).", "spWarnNoStart": "No se encontró la fecha de inicio del periodo, así que la semana actual no se puede seguir automáticamente.", "spTermWeek": "Semana {w} de {n}", "spTermWeekNoTotal": "Semana {w}", "spTermBefore": "Empieza en {n} días", "spTermBefore1": "Empieza mañana", "spTermAfter": "Periodo terminado", "spTermUnknown": "Semana desconocida", "spThisWeek": "Esta semana", "spNoFocus": "No hay temas asignados a esta semana.", "spNext": "Próxima evaluación", "spNoNext": "No hay evaluaciones próximas.", "spToday": "Hoy", "spTomorrow": "Mañana", "spInDays": "en {n} días", "spTodayNone": "Nada para hoy.", "spWeekly": "{a} de {n} preguntas esta semana", "spAssessments": "Próximas evaluaciones", "spTasks": "Plan", "spNoTasks": "Aún no hay tareas.", "spCourses": "Mapa del programa", "spWeekN": "Sem {n}", "spSource": "Fuente", "spConf": "Confianza: {c}", "spConf.high": "alta", "spConf.medium": "media", "spConf.low": "baja", "spAssump": "Suposiciones de la IA", "spRisk": "Riesgo", "spRisk.low": "bajo", "spRisk.medium": "medio", "spRisk.high": "alto", "spStrengths": "Fortalezas", "spGaps": "Puntos débiles", "spExport": "Exportar JSON", "spDelete": "Eliminar perfil", "spDeleteQ": "¿Eliminar tu Perfil de estudio? Se borra de este dispositivo y de la sincronización con Drive. Tus Qbanks y Analíticas no se tocan.", "spDeleteGo": "Eliminar", "spSchemaView": "Ver esquema JSON", "spSchemaHide": "Ocultar esquema JSON", "spSchemaTitle": "Esquema JSON del Perfil de estudio", "spCardTitle": "Tu tutor", "spCardOpen": "Abrir perfil", "spCardInviteTitle": "Configura tu Perfil de estudio", "spCardInviteBody": "Dale a Oworld tus programas, el calendario, tu horario de clases y el calendario de exámenes una sola vez y tu tutor llevará el control de tu semana, tus clases, tus exámenes y qué estudiar después.", "spCardInviteBtn": "Configurar perfil", "spStartBlock": "Iniciar un bloque de {s}", "spLibStrip": "El tutor sugiere para la semana {w}", "spLibStart": "{title} ({n} P)", "sgBefore": "Tu periodo empieza {when}. Prepara tus Qbanks.", "sgExam": "{title} es {when}.", "sgExamCover": "{title} es {when} e incluye {coverage}.", "sgTasks": "{n} tarea(s) para hoy o atrasada(s).", "sgPaceBehind": "Vas por debajo del ritmo de esta semana: {a} de {t} preguntas. Un bloque corto hoy cierra la brecha.", "sgPaceDone": "Meta semanal alcanzada ({a}/{t}). Buen trabajo.", "sgPaceOn": "Buen ritmo: {a} de {t} preguntas esta semana.", "sgWeak": "{subject} está en {pct}% y está en la lista de esta semana.", "sgNoFocus": "No hay temas asignados a esta semana. Actualiza tu perfil con el programa.", "sgStale": "Tu perfil tiene {n} días. Actualízalo para que tu tutor siga siendo preciso.", "nf.examSoon.t": "Se acerca un examen", "nf.examSoon.b": "{title} es en {days} días.", "nf.examTomorrow.t": "Examen mañana", "nf.examTomorrow.b": "{title} es mañana. Haz un repaso ligero y descansa.", "nf.examToday.t": "Examen hoy", "nf.examToday.b": "{title} es hoy. ¡Mucha suerte!", "nf.weekStart.t": "Semana {week} de {total}", "nf.weekStart.b": "Esta semana: {topics}", "nf.termStart.t": "El periodo empieza pronto", "nf.termStart.b": "Tu periodo empieza en {days} día(s). Prepara tus Qbanks.", "nf.paceBehind.t": "Por debajo del ritmo semanal", "nf.paceBehind.b": "{a} de {t} preguntas hasta ahora. Un bloque corto hoy ayuda.", "nf.tasksDue.t": "Tareas pendientes", "nf.tasksDue.b": "{n} tarea(s) para hoy o atrasada(s). Abre la Consola.", "nf.profileStale.t": "Actualiza tu perfil", "nf.profileStale.b": "Tu Perfil de estudio tiene {n} días.", "nf.profileLoaded.t": "Perfil de estudio listo", "nf.profileLoaded.b": "Tu tutor ahora sigue {term}.",
    "spPromptTitle": "Perfil de estudio — prompt para IA",
    "sgEve": "{title} es mañana. Hazlo ligero: repasa tu tema más débil y descansa.", "sgDeadline": "Fecha límite: {title} es {when}.", "sgBreakNow": "{title}: hoy no hay clases. Las clases se reanudan {when}. Buen momento para cerrar brechas.", "sgBreakSoon": "{title} empieza {when}. Mete un bloque de estudio más fuerte antes.", "sgStreak": "Aún no practicas hoy. Un bloque corto mantiene tu racha de {n} días.", "sgUntested": "{n} de {total} temas de {title} aún no tienen datos de práctica.",
    "nf.breakSoon.t": "El descanso empieza mañana", "nf.breakSoon.b": "{title} empieza mañana. Planea tu estudio antes.", "nf.deadlineSoon.t": "Se acerca una fecha límite", "nf.deadlineSoon.b": "{title} vence en {days} día(s).", "nf.deadlineToday.t": "Fecha límite hoy", "nf.deadlineToday.b": "{title} vence hoy.",
    "tuWindow": "Libre {from} – {to}: caben unas {qs} preguntas", "tuNoData": "sin datos", "tuReadyHint": "Toca un tema para iniciar un bloque.", "tuExams": "Próximos exámenes", "tuWeight": "{n}% de la nota", "tuReadyPct": "{n}% listo", "tuWeakest": "Más débil: {topic} {pct}%", "tuUntestedN": "{n} tema(s) sin practicar", "tuDeadline": "Fecha límite", "tuTodayQs": "{a} de {n} preguntas hoy", "tuGoalMet": "Meta diaria cumplida", "tuStreak": "Racha de {n} días", "spEdit": "Editar", "spExamDate": "Fecha del examen", "spExamTime": "Hora del examen", "spSave": "Guardar", "spMarkDone": "Ya ocurrió", "spMarkUpcoming": "Marcar como próximo", "spPastAssess": "Pasadas y completadas ({n})", "spDoneTag": "Hecha", "spFixDateHint": "¿Fecha incorrecta? Corrígela aquí y tu tutor la seguirá, incluso después de actualizar tu perfil.", "spWarnCalDates": "{n} evento(s) del calendario no tenían una fecha válida y se omitieron.",
    "spEvt.holiday": "Feriado", "spEvt.break": "Descanso", "spEvt.exam-period": "Periodo de exámenes", "spEvt.deadline": "Fecha límite", "spEvt.class": "Clase", "spEvt.other": "Evento",
    "csCalendar": "Calendario del semestre", "csCalPrev": "Mes anterior", "csCalNext": "Mes siguiente", "csCalToday": "Hoy", "csCalNothing": "Nada programado.", "csCalStudied": "Estudiaste: {n} sesión(es) · {q} preguntas", "csCalLegExam": "Examen", "csCalLegTask": "Tarea", "csCalLegEvent": "Calendario", "csCalLegStudy": "Estudio", "csCalNoProfile": "Configura tu Perfil de estudio para ver aquí tus exámenes, tareas y descansos.", "csCalSetup": "Configurar perfil", "csCalMore": "+{n} más",
    "tabCalendar": "Horario", "calTitle": "Horario", "calHint": "Todo tu periodo en un solo calendario: clases, exámenes, tareas, descansos y los días que estudiaste. Toca un día para verlo y editarlo.", "calMonth": "Mes", "calWeek": "Semana", "calAgenda": "Agenda", "calPrev": "Anterior", "calNext": "Siguiente", "calLayerKey": "Fechas clave", "calTermStart": "Inicio del periodo", "calTermEnd": "Fin del periodo", "calTargetExam": "Examen objetivo", "calClassesN": "{n} clases", "calStatTerm": "Periodo", "calStatOpen": "Tareas abiertas", "calStatWeekQ": "Preguntas esta semana", "calAgendaEmpty": "No hay nada programado en este lapso.", "calOpenFull": "Horario completo", "spMapNote": "Se muestran las semanas cercanas a hoy. Expande para ver el mapa completo del programa.",
    tbGapTitle: "Análisis de brechas", tbGapHint: "Tus bloques registrados agrupados por etiqueta de materia y comparados con el blueprint: peso en el examen, tu parte de la práctica, tu precisión y la brecha con la meta (puntos).", tbColExam: "Examen", tbColPractice: "Tú", tbColAcc: "Prec.", tbColGap: "Brecha", tbGapWorst: "Mayor brecha de precisión: {a} ({n} pts bajo la meta).", tbGapUnder: "Menos practicado: {b}.", tbGapNone: "Termina un bloque para ver tus brechas.", tbUnmapped: "Sin asignar al blueprint", tbUnmappedHint: "Estas etiquetas de materia de tus resultados no coinciden con ningún ítem del blueprint. Agrégalas a una lista de coincidencias.", tbBpPrompt: "Blueprint — prompt para IA", tbBpSchema: "Blueprint — plantilla JSON", tbCourses: "Curso prioritario", tbStarOn: "Hacer de {c} tu curso prioritario", tbStarOff: "Quitar curso prioritario", tbStarHint: "El curso con estrella se estudia primero: sus temas encabezan el enfoque de la semana y sus ítems del blueprint suben en el ranking.", "calNew.task": "Nueva tarea", "calNew.event": "Nuevo evento", "calNew.exam": "Nuevo examen", "calEdit.task": "Editar tarea", "calEdit.event": "Editar evento", "calEdit.exam": "Editar examen", "calAdd.task": "Tarea", "calAdd.event": "Evento", "calAdd.exam": "Examen", "calF.title": "Título", "calF.date": "Fecha", "calF.time": "Hora", "calF.endDate": "Termina el", "calF.endTime": "Termina a las", "calF.type": "Tipo", "calF.repeat": "Se repite", "calF.until": "Repetir hasta", "calF.subject": "Materia", "calF.weight": "Peso %", "calF.place": "Lugar", "calF.course": "Curso", "calF.topics": "Temas (separados por comas)", "calF.notes": "Notas", "calF.done": "Ya ocurrió", "calRep.none": "No se repite", "calRep.daily": "Cada día", "calRep.weekly": "Cada semana", "calRep.monthly": "Cada mes", calRepeats: "se repite: {r}", calSave: "Guardar", calCancel: "Cancelar", calDelete: "Eliminar", calEdit: "Editar", calDeleted: "Se eliminó «{s}».", calMoved: "«{s}» se movió al {d}.", calUndo: "Deshacer", calFind: "Buscar en el calendario", calJump: "Ir a la fecha", calExport: "Exportar .ics", tbScale: "Escalar pesos a 100%", tbScaleHint: "Los rangos que se superponen (una pregunta puede contar para varias disciplinas) pueden sumar más de 100%. Esto reescala cada grupo y conserva los números originales como rango oficial. Las comparaciones ya usan las proporciones escaladas.", tbConf: "Confianza en la fuente", "tbConfLvl.high": "Alta", "tbConfLvl.medium": "Media", "tbConfLvl.low": "Baja", "tbCg.official": "Cita fuentes oficiales ({h}).", "tbCg.version": "Edición del esquema registrada: {v}.", "tbCg.fresh": "Consultado hace {n} días.", "tbCg.weights": "Los pesos suman cerca de 100% en cada grupo.", "tbCf.noSource": "No cita ninguna fuente.", "tbCf.unofficial": "Las páginas citadas no son sitios oficiales de USMLE, NBME ni FSMB.", "tbCf.noVersion": "No se registró la edición del esquema.", "tbCf.noDate": "No se registró la fecha de consulta.", "tbCf.old": "Última revisión hace {n} días, más de un semestre.", "tbCf.weights": "Los pesos de {g} suman {n}%, no 100%.", "tbCf.noWeights": "No hay pesos del examen.", "tbCf.template": "Plantilla con pesos de ejemplo, no es el esquema oficial.", tbCadence: "Actualiza tu blueprint al menos una vez por semestre: el esquema puede cambiar y tu tutor planifica con él.", tbDueOn: "Próxima actualización antes del {d}.", tbUpdate: "Actualizar blueprint", tbDue: "Tu blueprint se revisó por última vez hace {n} días. Actualízalo al menos una vez por semestre.", tbDueTerm: "Empezó un nuevo periodo desde la última revisión de tu blueprint. Actualízalo para que tu tutor siga el esquema vigente.", tbSoon: "Tu blueprint tiene {n} días. Planea una actualización este semestre.", "nf.bpDue.t": "Actualiza tu blueprint", "nf.bpDue.b": "Se revisó por última vez hace {n} días. Renuévalo al menos una vez por semestre para que tu tutor siga el esquema USMLE vigente.", "nf.bpDueTerm.t": "Nuevo semestre: actualiza tu blueprint", "nf.bpDueTerm.b": "Tu periodo empezó después de la última revisión de tu blueprint. Vuelve a usar el prompt de IA para confirmar el esquema USMLE vigente.", tbSource: "Fuente: {v} {u}", tbNoSource: "Sin fuente oficial registrada: vuelve a usar el prompt de IA para que busque el esquema USMLE vigente.", tabTutor: "Tutor", tbTitle: "Panel del tutor", tbOpenTutor: "Abrir Centro de estudio", tabStudyHub: "Centro de estudio", shTitle: "Centro de estudio", shSub: "Tu tutor, el blueprint y tu Perfil de estudio en un solo lugar: en qué punto de tu periodo estás, qué estudiar después y qué tan listo estás.", shNavOverview: "Resumen", shNavPriorities: "Prioridades", shNavBlueprint: "Blueprint", shNavProfile: "Perfil de estudio", shJumpTo: "Ir a la sección", shSetupCta: "Configura tu Perfil de estudio", "plAddAs": "Añadir como…", "plSrc.exam": "Examen", "plSrc.event": "Evento", "plSrc.class": "Clase", "plAct.study": "Estudiar", "plAct.task": "Añadir tarea", "plAct.skip": "Omitir clase", "plAct.editClass": "Editar clases", "plPrepTitle": "Preparar: {s}", "plReviewTitle": "Repasar: {s}", "plTaskAdded": "Se añadió la tarea «{s}».", "plSkipped": "Se omitió «{s}» el {d}.", plAgendaHint: "Los exámenes, clases y eventos de los próximos 7 días aparecen aquí con sus propias acciones.", tbBpTitle: "Blueprint", tbBpBody: "Un blueprint es un archivo JSON con los dominios de la prueba, el peso de cada sistema y las competencias objetivo de tu examen. Dale el prompt a una herramienta de IA con acceso a internet: busca el esquema oficial más reciente de USMLE (usmle.org, NBME, FSMB) y te devuelve el JSON para pegar aquí. La plantilla incluida es solo un ejemplo. El tutor ordena qué estudiar según el peso, tu precisión y el programa de esta semana.", tbTemplate: "Usar plantilla USMLE", tbCopyPrompt: "Copiar prompt de IA", tbCopySchema: "Copiar JSON de plantilla", tbCopied: "Copiado", tbPaste: "Pega aquí el JSON del blueprint…", tbLoad: "Cargar blueprint", tbRemove: "Quitar blueprint", tbErrParse: "Eso no parece JSON. Pega solo el blueprint (o sube el archivo).", tbErrShape: "Este JSON no tiene dominios, sistemas ni competencias.", tbReady: "Preparación del blueprint", tbCoverage: "Cobertura", tbCoverageSub: "ítems con 5+ respuestas", tbCountdown: "Días al examen", tbTarget: "meta {n}%", tbPriority: "Objetivos prioritarios", tbPriorityHint: "Ordenados por peso en el examen, la brecha con tu meta y los temas de esta semana. Marca ítems para armar un bloque, o toca un nombre para iniciarlo.", tbBuild: "Armar bloque con {n} seleccionados", tbShareLine: "{n} respondidas · {share}% de tu práctica vs {w}% del examen · meta {target}%", tbMatches: "Qbanks que coinciden", tbNoMatches: "Ningún Qbank de tu biblioteca coincide con estos temas todavía.", tbSystems: "Sistemas", tbDomains: "Dominios de la prueba", tbComps: "Competencias", tbLegend: "Barra = tu precisión, marca negra = meta. Los pesos son una guía de estudio: verifícalos con el esquema oficial vigente.", tbNoBpTitle: "Sin blueprint cargado", tbNoBpBody: "Carga un blueprint para ver prioridades según el peso en el examen.", "nf.blueprintLoaded.t": "Blueprint cargado", "nf.blueprintLoaded.b": "Tu tutor ahora planifica con {exam}.",
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
    anTrendTitle: "Tendencia de puntaje", anTrendHint: "Últimas {n} sesiones · línea punteada = 70%", anTrendNeed: "Termina 2 sesiones para ver tu tendencia.", anSubjTitle: "Rendimiento por materia", anActTitle: "Actividad diaria", anActHint: "Preguntas respondidas, últimos 14 días", anStatSessions: "Sesiones", anStatAnswered: "Preguntas respondidas", anStatAccuracy: "Precisión", anStatAvgTime: "Tiempo / pregunta", anStatCorrectPct: "Respondidas correctamente", anStatTotalTime: "Tiempo total", anStatBanks: "{n} Qbanks añadidos", anStatBank1: "1 Qbank añadido", anStatBest: "Mejor sesión {n}%",
    csCalPlan: "Lista del plan", csCalPlanCount: "{d}/{n} hechas",
    csPlanAddPh: "Agregar a tu plan…", csPlanAdd: "Agregar", csPlanShowAll: "Ver todo ({n})", csClassNoneHere: "Aún no hay horarios de clase. Agrégalos en la página Calendario.", spPlanDueOpt: "Fecha límite (opcional)", csPlanAddFor: "Se agrega para {d}", csPlanRemove: "Quitar del plan",
    "plTally": "{d} de {n} completadas", "plTallyEmpty": "Agrega tu primera tarea para empezar el conteo.", "plDoneToday": "{n} completadas hoy",
    "plF.all": "Todas", "plF.open": "Abiertas", "plF.overdue": "Atrasadas", "plF.today": "Para hoy", "plF.upcoming": "Próximas", "plF.nodate": "Sin fecha", "plF.done": "Hechas",
    "plG.overdue": "Atrasadas", "plG.today": "Para hoy", "plG.upcoming": "Próximas", "plG.nodate": "Sin fecha", "plG.done": "Completadas",
    "plSearch": "Buscar tareas", "plKindAll": "Todos los tipos", "plKind.qbank": "Qbank", "plKind.reading": "Lectura", "plKind.review": "Repaso", "plKind.exam": "Exámenes", "plKind.class": "Clases", "plKind.other": "Otro",
    "plPriority": "Prioridad", "plPri.high": "Alta", "plPri.normal": "Normal", "plPri.low": "Baja", "plOptions": "Opciones", "plOverdueBy": "{n} d de atraso", "plFromCal": "Calendario",
    "plOpenCal": "Ver en el calendario", "plOpenCalBtn": "Abrir horario", "plSetDate": "Poner fecha", "plEditTask": "Editar tarea", "plClearDone": "Quitar completadas ({n})", "plClearedN": "Se quitaron {n} tarea(s) completada(s).",
    "plMoveOverdue": "Mover {n} atrasada(s) a hoy", "plMovedN": "Se movieron {n} tarea(s) atrasada(s) a hoy.", "plShowDone": "Ver completadas ({n})", "plHideDone": "Ocultar completadas", "plNoMatch": "Ninguna tarea coincide con estos filtros.",
    "calF.priority": "Prioridad", "calF.taskDone": "Completada", "calStatDone": "Completadas", "calUnscheduled": "Tareas sin fecha ({n})", "calScheduleHere": "Programar aquí", "calDayDone": "{d}/{n} hechas",
    qhubTitle: "Qhub", qhubSoon: "Próximamente", qhubBody: "Un repositorio compartido y validado de Qbanks. Explora e importa bloques verificados.",
    csClasses: "Clases", csClassEdit: "Editar", csClassDone: "Listo", csClassNone: "Aún no hay horarios de clase. Usa Editar para agregarlos.", csClassName: "Nombre de la clase", csClassLoc: "Salón / lugar", csClassAddMeeting: "Agregar horario", csClassNew: "Nombre de la nueva clase…", csClassAdd: "Agregar clase",
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
    load: "Cargar examen", importQbank: "Importar nuevo Qbank", importInLibrary: "Ya está en tu biblioteca — inícialo desde ahí.", lobbySaveN: "Guardar en la biblioteca ({n})", lobbyRemoveN: "Quitar ({n})", triageHint: "Márcalo para guardarlo en tu biblioteca o quitarlo.", lobbyTriageNote: "Estos Qbanks acaban de importarse. Marca los que quieras y usa Guardar en la biblioteca para conservarlos o Quitar para descartarlos.", aiLaunchTitle: "Acceso rápido a IA", aiLaunchHint: "Abre tu herramienta de IA, pega el Prompt de receta de preguntas de abajo junto con tu tema o apuntes y trae la respuesta aquí.", aiLaunchOpens: "Se abre en una pestaña nueva", nbTitle: "Cuadernos de NotebookLM", nbHint: "Tus cuadernos de estudio, por bloque. Cada uno se abre en NotebookLM en una pestaña nueva.", nbAll: "USMLE (cuaderno general)", nbBlock1: "Bloque 1", nbBlock2: "Bloque 2", nbCore: "Ciencias básicas",
    wasIncorrectBadge: "Fallada antes de reiniciar", missedBeforeN: "{n} falladas antes de reiniciar", explHide: "Ocultar explicación", explShow: "Mostrar explicación",
    activeTitle: "¿Continuar tu examen desde otro dispositivo?", activeTitleConflict: "Hay otra versión de este examen en otro dispositivo",
    activeBody: "«{name}»: pregunta {n} de {total}, {answered} respondidas. Última actualización {time}.",
    activeReplaceWarn: "Continuar reemplaza el examen abierto en este dispositivo.", activeContinue: "Continuar aquí", activeNotNow: "Ahora no", activeKeepMine: "Conservar el de este dispositivo",
    activeResumed: "Retomaste «{name}» desde otro dispositivo.", activeEndedElsewhere: "Este examen se terminó en otro dispositivo.",
    activeMissing: "No se pudo cargar ese examen desde Google Drive. Revisa tu conexión e inténtalo de nuevo.", activeMixed: "Mezcla de {banks}.",
    themeLabel: "Tema", themeLight: "Claro", themeDark: "Oscuro",
    accountBtn: "Cuenta", viewAccount: "Administrar cuenta", signIn: "Iniciar sesión con Google", signOut: "Cerrar sesión", signedInAs: "Sesión iniciada con Google", signInHint: "Inicia sesión para sincronizar tu biblioteca y tus Analíticas entre dispositivos mediante tu Google Drive.", signOutHint: "Al cerrar sesión se detiene la sincronización en este dispositivo. Tus datos se conservan aquí y en tu Drive.", signedOutNote: "Sin sesión iniciada", "cpTitle": "Perfil profesional y de estudio", "cpHint": "Cuéntale a Oworld quién eres y para qué te estás preparando. Tu tutor lo usa para fijar metas y crear tu Perfil de estudio.", "cpAbout": "Sobre ti", "cpStatus": "Situación actual", "cpStatus.pick": "Seleccionar…", "cpStatus.student": "Estudiante de medicina", "cpStatus.graduate": "Médico graduado (IMG)", "cpStatus.resident": "Residente", "cpStatus.other": "Otro", "cpGradYear": "Año de graduación", "cpCountry": "País", "cpCity": "Ciudad", "cpUniversity": "Universidad", "cpSchool": "Escuela o facultad", "cpPhCountry": "República Dominicana", "cpPhCity": "Santo Domingo", "cpPhUniversity": "Universidad Iberoamericana (UNIBE)", "cpPhSchool": "Escuela de Medicina", "cpObjective": "Objetivo de estudio", "cpCoursework": "Estudios de la carrera", "cpCourseworkHint": "Elige todo lo que estás estudiando ahora.", "cpWork.generals": "Generales", "cpWork.preclinical": "Preclínicas", "cpWork.clinical": "Estudios clínicos", "cpUsmle": "USMLE", "cpUsmleHint": "Elige los pasos para los que te preparas. Añade una fecha objetivo si la tienes.", "cpStep.step1": "Step 1", "cpStep.step2ck": "Step 2 CK", "cpStep.step3": "Step 3", "cpTargetDate": "Fecha objetivo", "cpClassOf": "Promoción {y}", "cpNext": "Próximo objetivo: {step}, {when} ({date})", "cpSavedLocal": "Guardado en este dispositivo.", "acctSettings": "Ajustes de la cuenta", "acctName": "Nombre", "acctEmail": "Correo", "acctLinked": "Vinculada con", "acctCreated": "Cuenta creada", "acctNone": "No disponible", "acctLinkedGoogle": "Google", "acctSignedOutHint": "Inicia sesión con Google para ver aquí los datos de tu cuenta.", "dzTitle": "Zona de peligro", "dzDesc": "Eliminar tu cuenta borra de forma permanente tus Qbanks, Analíticas, Base de datos personal, Perfil de estudio y ajustes de este dispositivo, y cierra tu sesión.", "dzDelete": "Eliminar mi cuenta", "dzDownloadFirst": "Descarga todos tus archivos antes de eliminar tu cuenta. Esto no se puede deshacer.", "dzDownload": "Descargar todos los archivos", "dzDownloaded": "Descargado. Tus archivos están guardados.", "dzDownloadFailed": "Error al descargar. Inténtalo de nuevo.", "dzConfirmGo": "Eliminar definitivamente", "dzSkip": "Eliminar sin descargar", "dzDriveNote": "La copia sincronizada en tu Google Drive permanece allí hasta que la elimines de Drive.", "dzFileName": "oworld-copia-cuenta-{d}.json", "spCareerEdit": "Editar en la cuenta", "spCareerAdd": "Añadir datos", "spCareerEmpty": "Añade tu universidad, año de graduación y objetivos de USMLE en tu cuenta y aparecerán aquí. Tu tutor también los usa.", "spNoDate": "Sin fecha objetivo",
    syncTitle: "Sincronización en la nube", syncHint: "Mantiene tu biblioteca de Qbank y tus Analíticas al día en todos tus dispositivos mediante una carpeta privada de la app en tu propio Google Drive. Compartir / Exportar a un amigo sigue funcionando por separado.", syncOff: "La sincronización en la nube no está configurada en esta versión de la app.", syncConnect: "Conectar Google Drive", syncNow: "Sincronizar ahora", syncDisconnect: "Desconectar", syncReconnect: "Reconectar", syncStNone: "Sin conexión", syncStBusy: "Sincronizando…", syncStDone: "Sincronizado {time}", syncStReauth: "Hay que reconectar", syncStError: "Problema de sincronización", syncBlocked: "No se pudo cargar el inicio de sesión de Google aquí (bloqueado o sin conexión).", syncDenied: "No se concedió acceso a Drive. Permite el permiso de datos de la app para sincronizar.", syncGenericErr: "No se pudo sincronizar con Google Drive. Tus datos en este dispositivo están a salvo.", syncReauthHint: "Tu sesión de Google caducó. Toca Reconectar; los cambios locales se conservan y se sincronizarán.", syncGuide: "La sincronización con Google Drive (menú de perfil, arriba a la derecha) mantiene tu biblioteca y tus Analíticas al día entre dispositivos. Compartir / Exportar sigue siendo la forma de enviar un bloque a otra persona.", homeBtn: "Inicio", removeExam: "Quitar examen", removeTitle: "¿Quitar este examen?", removeBody: "Esto borra el examen cargado y su progreso o resultados. Tu biblioteca de preguntas guardada no se ve afectada.", removeBodyUnsaved: "Esto borra el examen cargado y su progreso o resultados. Algunos de sus bloques no están guardados en tu biblioteca y se perderían para siempre. Cancela y toca Guardar en la biblioteca primero si quieres conservarlos.", removeGo: "Quitar", libRename: "Renombrar Qbank", libRenameSave: "Guardar nombre", howItWorks: "Ayuda", guideStep: "Paso {n} de {total}", guideBack: "Atrás", guideNext: "Siguiente", guideDone: "Entendido", guideClose: "Cerrar guía", navCollapse: "Contraer lista de preguntas", navExpand: "Expandir lista de preguntas", resumeSession: "Reanudar sesión", sessionInProgress: "Sesión en curso", sessionPos: "Pregunta {n} de {total}", examLoadedLabel: "Examen cargado", openLobby: "Abrir sala del examen", inProgressTag: "En curso", discardTitle: "¿Descartar la sesión en curso?", discardBody: "Iniciar algo nuevo reemplaza tu bloque en curso y se perderán sus respuestas.", discardGo: "Descartar y continuar", hide: "Ocultar", recipe: "Prompt de receta de preguntas",
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
    recipeTutor: "El tutor sugiere", recipeTutorHint: "Toca los temas para basar esta receta en ellos. Toca de nuevo para quitar uno.", phSystems: "p. ej. Cardiovascular, Renal, Neuro…", phDisc: "p. ej. Farmacología, Bioquímica, Microbiología…",
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
    hlTip: "Selecciona texto y elige un color de resaltado.", hlColor: "Color de resaltado", hlYellow: "Amarillo", hlGreen: "Verde", hlBlue: "Azul", hlPink: "Rosa", hlOrange: "Naranja",
    explShowAll: "Mostrar todas las explicaciones", explHideAll: "Ocultar todas las explicaciones",
    impMidTitle: "Importar Qbank", impMidHint: "Se agrega a tu biblioteca. Tu sesión actual sigue sin cambios.", impMidPlaceholder: "Pega aquí el JSON del Qbank o elige un archivo", impMidFile: "Elegir archivo", impMidAdd: "Agregar a la biblioteca", impMidClose: "Cerrar", sessionKept: "Tu sesión actual no se modificó.",
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
    search: "Buscar…", noMatches: "Sin coincidencias en {tab}.", searchTitle: "Buscar", searchPh: "Busca Qbanks, preguntas, notas y sesiones…", searchHint: "Escribe al menos 2 letras. Busca en tu Biblioteca, Calendario (eventos, fechas, horas, clases, exámenes, tareas), Base de datos y Analíticas. Prueba “20 oct”, “martes” o “9:00”.", searchGrpCal: "Horario", searchGoDate: "Ir a {d}", searchNone: "Sin resultados para “{q}”.", searchGrpLib: "Biblioteca", searchGrpDb: "Base de datos", searchGrpHist: "Analíticas", searchQsMatch: "{n} pregunta(s) coinciden", searchClose: "Cerrar búsqueda",
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
      <div style={{ fontFamily: FONT_UI, fontWeight: 700, fontSize: 11, color: T.muted, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 6, textAlign: "center" }}>
        {t("textSize")}
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, flexWrap: "wrap" }}>
        {mk("A−", -1, atMin, t("textSmaller"), 12)}
        <span style={{ fontFamily: FONT_MONO, fontSize: 12.5, color: T.ink, minWidth: 44, textAlign: "center" }}>{pct}%</span>
        {mk("A+", 1, atMax, t("textLarger"), 15)}
        {textScale !== 1 && (
          <button onClick={() => setTextScale(1)} style={{ flexBasis: "100%", fontFamily: FONT_UI, fontSize: 12, fontWeight: 600, background: "transparent", border: "none", color: T.blue, cursor: "pointer", padding: 4 }}>
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

const pad2 = (n) => String(n).padStart(2, "0");
const fmtMinSec = (sec) => { const s = Math.max(0, Math.round(sec)); return `${pad2(Math.floor(s / 60))}m ${pad2(s % 60)}s`; }; // 00m 00s
const fmtHourMin = (sec) => { const m = Math.floor(Math.max(0, sec) / 60); return `${pad2(Math.floor(m / 60))}h ${pad2(m % 60)}m`; }; // 00h 00m
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
// NotebookLM study notebooks shown in the Import card on the Library page. Links omit "?authuser=N" so they open under whichever Google account the
// visitor is signed in to (each notebook must be shared with them in NotebookLM). Add it back to a url if you want to force an account.
const NB = (id) => `https://notebook.google.com/notebook/${id}`;
const NOTEBOOKS = {
  all: { name: "USMLE", url: NB("8759c9b0-c3fa-45f7-827b-8d20eab34b0a") },
  groups: [
    { key: "nbBlock1", items: [
      { name: "Neuro", url: NB("bd8079f6-89af-4b8f-817a-229793c81e55") },
      { name: "Cardio", url: NB("9d153d49-6b69-46e6-9717-3fa48bf5b0a4") },
      { name: "Respiratory", url: NB("6bdd370e-359d-4643-a073-57bd0fdd93a7") },
      { name: "GI", url: NB("62a9ebdf-861e-475f-a4ea-e965836c2850") },
      { name: "Immunopatho", url: NB("b58814db-98cb-43d5-9cad-1281dbc23036") },
      { name: "Psych", url: NB("25c07f7a-0220-419a-9c01-27f94e69d97a") },
    ] },
    { key: "nbBlock2", items: [
      { name: "Integumentary", url: NB("f04f75ef-5091-4bff-9884-9cb756dacadf") },
      { name: "Hemo & Onco", url: NB("cc915019-d5cd-463f-85f1-3bcd5f279950") },
      { name: "MSK", url: NB("6846683e-57bc-4870-a038-6f762b20b2b0") },
      { name: "Renal", url: NB("3695e6ed-b3bf-48c1-9d64-463e44119437") },
    ] },
    { key: "nbCore", items: [
      { name: "Pathology", url: NB("fdbff5bc-d5e2-429d-8ce0-80d95b72da16") },
      { name: "Pharmacology", url: NB("31e72588-144c-427e-a404-64bf2bffcd91") },
      { name: "Microbiology", url: NB("f2c2f013-8d70-42e3-8424-a629db203aa5") },
      { name: "Biochemistry", url: NB("5fd25697-6240-47b2-8f06-bc7ba290ecad") },
    ] },
  ],
};

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

// ---------------------------------------------------------------------------
// Google Drive sync (personal, cross-device). Uses Google Identity Services (token model) with the drive.appdata scope, so the app
// can only see its own hidden app-data folder, never the user's other Drive files. Peer sharing (Share / Export, AirDrop) is separate.
// SETUP: create an OAuth "Web application" client ID in Google Cloud, enable the Drive API, add this site's origin under
// "Authorized JavaScript origins", then paste the client ID below (or set window.OWORLD_GOOGLE_CLIENT_ID before the app loads).
// ---------------------------------------------------------------------------
const GOOGLE_CLIENT_ID = (typeof window !== "undefined" && window.OWORLD_GOOGLE_CLIENT_ID) || "";
const DRIVE_SCOPE = "https://www.googleapis.com/auth/drive.appdata";
const SIGNIN_SCOPES = `openid email profile ${DRIVE_SCOPE}`; // identity (name, email, photo) + the app-data folder
const USERINFO_URL = "https://openidconnect.googleapis.com/v1/userinfo";
const SYNC_FILE_NAME = "oword_sync_state.json";
const LS_SYNC = "owordDriveSync";   // { linked, fileId, lastSync }
const LS_TOMBS = "owordTombstones"; // { qbanks: {id: deletedAt}, sessions: {id: deletedAt} }
const TOMB_TTL = 180 * 24 * 3600 * 1000;
// A tombstone kills an item unless that item was restored from the Trash AFTER the deletion (its restoredAt is later than the
// tombstone). Without this, another device's copy of the tombstone would delete a restored item again on the next sync.
const isBuried = (ts, e) => !!ts && ts >= ((e && e.restoredAt) || 0);

// Trash: one bin for everything deleted from the Library, Analytics and Database (kept on this device, newest first).
//   { tid, kind: "qbank" | "session" | "dbitem", deletedAt, data: <the deleted entry>, review?: <saved Review Exam snapshot> }
const LS_TRASH = "owordTrash";
const TRASH_TTL = 30 * 24 * 3600 * 1000;
const TRASH_KINDS = ["qbank", "session", "dbitem"];
function loadTrash() {
  const v = lsGet(LS_TRASH); const cutoff = Date.now() - TRASH_TTL;
  if (!Array.isArray(v)) return [];
  return v.filter((e) => e && typeof e.tid === "string" && TRASH_KINDS.includes(e.kind) && e.data && typeof e.data.id === "string" && e.deletedAt > cutoff);
}

function emptyTombs() { return { qbanks: {}, sessions: {} }; }
function loadTombs() {
  const t = lsGet(LS_TOMBS);
  return t && typeof t === "object" ? { qbanks: { ...(t.qbanks || {}) }, sessions: { ...(t.sessions || {}) } } : emptyTombs();
}
function unionTombs(a, b) {
  const out = emptyTombs(); const cutoff = Date.now() - TOMB_TTL;
  for (const k of ["qbanks", "sessions"]) {
    for (const src of [a && a[k], b && b[k]]) for (const [id, ts] of Object.entries(src || {})) if (ts > cutoff) out[k][id] = Math.max(out[k][id] || 0, ts);
  }
  return out;
}
const validLibEntry = (e) => e && typeof e.id === "string" && typeof e.title === "string" && Array.isArray(e.questions) && e.questions.length > 0;
const validSession = (e) => e && typeof e.id === "string" && Number.isFinite(e.total) && Number.isFinite(e.finishedAt);

// Same Qbank on two devices: the newer edit (rename / rating / score) wins; the latest score and the newest per-question rating are kept.
function mergeQbankEntry(a, b) {
  if (a === b) return a;
  const win = (b.updatedAt || 0) > (a.updatedAt || 0) ? b : a;
  const lose = win === a ? b : a;
  let out = win;
  const scores = [a.lastScore, b.lastScore].filter(Boolean).sort((x, y) => (y.date || 0) - (x.date || 0));
  const best = scores[0] || null;
  if (((win.lastScore && win.lastScore.date) || 0) !== ((best && best.date) || 0)) out = { ...out, lastScore: best };
  const loseMeta = new Map(lose.questions.map((q) => [q.id, q.meta]));
  let changed = false;
  const qs = out.questions.map((q) => {
    const m = loseMeta.get(q.id);
    if (m && m.ratedAt && m.ratedAt > ((q.meta && q.meta.ratedAt) || 0)) { changed = true; return { ...q, meta: { ...(q.meta || {}), rating: m.rating, ratedAt: m.ratedAt } }; }
    return q;
  });
  return changed ? { ...out, questions: qs } : out;
}
// Non-destructive union by id. Only an explicit delete (tombstone) removes anything.
function mergeQbanks(local, remote, deleted) {
  const dead = (deleted && deleted.qbanks) || {};
  const map = new Map();
  for (const e of local || []) if (!isBuried(dead[e.id], e)) map.set(e.id, e);
  for (const r of remote || []) {
    if (!validLibEntry(r) || isBuried(dead[r.id], r)) continue;
    map.set(r.id, map.has(r.id) ? mergeQbankEntry(map.get(r.id), r) : r);
  }
  return [...map.values()].sort((x, y) => (x.importDate || 0) - (y.importDate || 0) || (x.id < y.id ? -1 : 1));
}
function mergeSessions(local, remote, deleted) {
  const dead = (deleted && deleted.sessions) || {};
  const map = new Map();
  for (const e of local || []) if (!isBuried(dead[e.id], e)) map.set(e.id, e);
  for (const r of remote || []) if (validSession(r) && !isBuried(dead[r.id], r) && !map.has(r.id)) map.set(r.id, r);
  return [...map.values()].sort((x, y) => y.finishedAt - x.finishedAt || (x.id < y.id ? -1 : 1)).slice(0, HISTORY_MAX);
}
function sameList(a, b) { return a.length === b.length && a.every((x, i) => x === b[i]); }
function collectReviews(sessions) {
  const out = {};
  sessions.slice(0, REVIEW_MAX).forEach((e) => { const r = lsGet(LS_REVIEW + e.id); if (r) out[e.id] = r; });
  return out;
}
function mergeSyncState(local, remote) {
  const r = remote && typeof remote === "object" ? remote : {};
  const deleted = unionTombs(local.deleted, r.deleted);
  const qbanks = mergeQbanks(local.qbanks, r.qbanks, deleted);
  const examSessions = mergeSessions(local.examSessions, r.examSessions, deleted);
  const keep = new Set(examSessions.slice(0, REVIEW_MAX).map((e) => e.id));
  const reviews = {};
  for (const src of [r.reviews || {}, local.reviews || {}]) for (const [id, snap] of Object.entries(src)) if (keep.has(id) && snap) reviews[id] = snap; // local wins
  return { qbanks, examSessions, reviews, deleted };
}
function hashStr(str) { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return `${str.length}:${h >>> 0}`; }

// ---------------------------------------------------------------------------
// Active-session sync: a test that is in progress follows the student to another device. It has its OWN Drive files, so the
// (potentially large) library file is never re-uploaded per answer and a library merge can never clobber a live test:
//   oword_active_session.json   small and hot: the state below, rewritten after every change
//   oword_block_<sessionId>.json   the exact question set of that test, written ONCE (a mixed block is shuffled at creation, so it
//                                  can only be reproduced exactly by storing it), deleted when the test ends
// State schema (`oword_active_session.json`):
//   { sessionId, qbankId, currentIndex, answers: {qId: selectedKey}, flagged: [qId], highlights: {qId: {field: [{id,start,end,color}]}},
//     timeElapsed (s), updatedAt (ms of the last LOCAL mutation),
//     + what a faithful restore needs: blockFileId, blockName, mode, timeLeft, timerOff, notes, states, questionCount, answeredCount,
//       isMixed, sourceBanks, sourceIds }
// A finished / removed test is written as a tombstone { sessionId, ended: true, updatedAt } so the other device lets go of it.
// Only a one-block exam with a block in progress is synced (a library launch, a Mixed Qbank, a pasted single block); multi-block bundles are not.
// ---------------------------------------------------------------------------
const LS_ACTIVE_SYNC = "owordActiveSync"; // this device's marker for the synced session: { sessionId, updatedAt, baseAt, ended, sig, blockFileId }
const LS_SESSION_FILE = "owordSessionFile"; // { fileId } of oword_active_session.json
const SESSION_FILE_NAME = "oword_active_session.json";
const blockFileName = (sessionId) => `oword_block_${sessionId}.json`;
const validActive = (a) => !!a && typeof a === "object" && typeof a.sessionId === "string" && Number.isFinite(a.updatedAt);

function syncableLive(examData, blockStates) {
  if (!examData || !Array.isArray(examData.blocks) || examData.blocks.length !== 1 || !Array.isArray(blockStates) || blockStates.length !== 1) return null;
  const bs = blockStates[0];
  return bs && bs.status === "in-progress" ? { block: examData.blocks[0], bs } : null;
}

// Fingerprint of what the student has DONE (answer, strike-out, flag, check, highlight, note, position). Timer ticks and tutor-panel
// toggles are not part of it, so only a real mutation bumps `updatedAt`.
function stableJson(v) { // key-order independent, so a state rebuilt on another device fingerprints the same
  if (Array.isArray(v)) return `[${v.map(stableJson).join(",")}]`;
  if (v && typeof v === "object") return `{${Object.keys(v).sort().map((k) => `${JSON.stringify(k)}:${stableJson(v[k])}`).join(",")}}`;
  return JSON.stringify(v === undefined ? null : v);
}
function activeSig(bs) {
  const a = {};
  for (const [qid, x] of Object.entries(bs.answers || {})) a[qid] = [x.selected || null, x.struck && x.struck.length ? x.struck : 0, !!x.flagged, !!x.checked, !!x.answerRevealed, !!x.hintUsed];
  return hashStr(stableJson([bs.currentQuestionIndex || 0, a, bs.highlights || {}, bs.notes || {}]));
}

// Local state → the session-state payload (no questions: those live in the block file).
function buildActiveSession(block, bs, rec) {
  const answers = {}, flagged = [], states = {};
  let answered = 0;
  for (const [qid, a] of Object.entries(bs.answers || {})) {
    if (a.selected != null) { answers[qid] = a.selected; answered++; }
    if (a.flagged) flagged.push(qid);
    const st = {};
    if (a.struck && a.struck.length) st.struck = a.struck;
    for (const k of ["checked", "answerRevealed", "hintUsed", "keyInfoOn", "tipOpen"]) if (a[k]) st[k] = a[k];
    if (Object.keys(st).length) states[qid] = st;
  }
  const sourceIds = Array.isArray(block.sourceIds) ? block.sourceIds.slice(0, 50) : [];
  const firstId = String((block.questions[0] && block.questions[0].id) || "");
  const qbankId = block.libraryId || (sourceIds.length === 1 ? sourceIds[0] : null) || (firstId.includes("::") ? firstId.split("::")[0] : null);
  const timeElapsed = bs.startedAt ? Math.max(0, Math.round(((bs.pausedAt || Date.now()) - bs.startedAt) / 1000)) : 0;
  return {
    sessionId: rec.sessionId, ended: false, qbankId, currentIndex: bs.currentQuestionIndex || 0,
    answers, flagged, highlights: bs.highlights || {}, timeElapsed, updatedAt: rec.updatedAt,
    blockFileId: rec.blockFileId || null, blockName: block.blockName || "", mode: bs.tutor ? "tutor" : "timed", timeLeft: bs.timeLeft, timerOff: !!bs.timerOff,
    notes: bs.notes || {}, states, questionCount: block.questions.length, answeredCount: answered,
    isMixed: !!block.isMixed, sourceBanks: Array.isArray(block.sourceBanks) ? block.sourceBanks.slice(0, 12).map(String) : [], sourceIds,
    deviceId: lsGet("owordDeviceId") || null,
  };
}

// A block read back from its block file is untrusted input: check the shape before the exam screen sees it.
function validBlock(b) {
  return !!b && typeof b === "object" && Array.isArray(b.questions) && b.questions.length > 0
    && b.questions.every((q) => q && typeof q.id === "string" && Array.isArray(q.options));
}
async function fetchSessionBlock(token, r) {
  const id = r.blockFileId || await driveFindSyncFile(token, blockFileName(r.sessionId));
  if (!id) return null;
  const j = await driveDownload(token, id);
  return j && validBlock(j.block) ? j.block : null;
}

// Remote payload → a block state the exam screen can open exactly where the student left off.
function hydrateActiveState(block, r, parked) {
  const base = makeInitialBlockState(block);
  const ids = new Set(block.questions.map((q) => q.id));
  const flagged = new Set(Array.isArray(r.flagged) ? r.flagged : []);
  const answers = {};
  for (const qid of new Set([...Object.keys(r.answers || {}), ...Object.keys(r.states || {}), ...flagged])) {
    if (!ids.has(qid)) continue;
    answers[qid] = { selected: null, struck: [], flagged: false, checked: false, ...((r.states || {})[qid] || {}), selected: (r.answers || {})[qid] ?? null, flagged: flagged.has(qid) };
  }
  const tutor = r.mode === "tutor";
  const elapsed = Math.max(0, Number(r.timeElapsed) || 0);
  const idx = Math.min(Math.max(0, Math.floor(Number(r.currentIndex) || 0)), block.questions.length - 1);
  return {
    ...base, status: "in-progress", timed: !tutor, tutor, timerOff: !!r.timerOff,
    timeLeft: Number.isFinite(r.timeLeft) ? r.timeLeft : base.timeLeft,
    startedAt: Date.now() - elapsed * 1000, pausedAt: parked && tutor ? Date.now() : null,
    answers, notes: r.notes && typeof r.notes === "object" ? r.notes : {}, highlights: r.highlights && typeof r.highlights === "object" ? r.highlights : {},
    currentQuestionIndex: idx, syncId: r.sessionId,
  };
}

// Pull-side reconciliation. `local` / `remote` are activeSession payloads (or tombstones / null); `baseAt` is the updatedAt both sides last agreed on.
//   push     this device's version wins → upload it
//   none     nothing to do
//   adopt    same session, the other device moved on and this one has no unsynced changes → fast-forward silently
//   offer    another device has a live test and this one has none → ask before restoring
//   conflict both sides changed (or two different tests are open) and the remote is newer → ask which to keep
//   end      the same session was finished / removed elsewhere → close it here
function reconcileActiveSession(local, remote, baseAt = 0) {
  const L = validActive(local) ? local : null;
  const R = validActive(remote) ? remote : null;
  if (!R) return L && !L.ended ? { winner: L, action: "push" } : { winner: null, action: "none" };
  if (!L || L.ended) {
    if (L && R.sessionId === L.sessionId) {
      if (R.ended) return { winner: L.updatedAt >= R.updatedAt ? L : R, action: "none" };
      return { winner: L, action: "push" };                      // finished here: tell the other device
    }
    if (R.ended) return { winner: L && L.updatedAt > R.updatedAt ? L : R, action: "none" };
    if (L && L.updatedAt > R.updatedAt) return { winner: L, action: "push" }; // the remote test is older than what was finished here
    return { winner: R, action: "offer" };
  }
  if (R.sessionId === L.sessionId) {
    if (R.ended) return { winner: R, action: "end" };
    if (R.updatedAt === L.updatedAt) return (L.timeElapsed || 0) > (R.timeElapsed || 0) ? { winner: L, action: "push" } : { winner: R, action: "none" };
    if (L.updatedAt > R.updatedAt) return { winner: L, action: "push" };
    return L.updatedAt > baseAt ? { winner: R, action: "conflict" } : { winner: R, action: "adopt" };
  }
  if (R.ended) return { winner: L, action: "push" };
  return R.updatedAt > L.updatedAt ? { winner: R, action: "conflict" } : { winner: L, action: "push" };
}

let gisPromise = null;
function loadGis() {
  if (typeof window === "undefined") return Promise.reject(new Error("no-window"));
  if (window.google && window.google.accounts && window.google.accounts.oauth2) return Promise.resolve();
  if (!gisPromise) gisPromise = new Promise((res, rej) => {
    const sc = document.createElement("script");
    sc.src = "https://accounts.google.com/gsi/client"; sc.async = true;
    sc.onload = () => res();
    sc.onerror = () => { gisPromise = null; rej(new Error("gis-blocked")); };
    document.head.appendChild(sc);
  });
  return gisPromise;
}
async function driveReq(token, url, opts = {}) {
  const res = await fetch(url, { ...opts, headers: { Authorization: `Bearer ${token}`, ...(opts.headers || {}) } });
  if (!res.ok) { const e = new Error(`drive-${res.status}`); e.status = res.status; throw e; }
  return res;
}
// Drive's per-file `version` rises on every write. The session sync reads it before a pull and re-checks it right before a push,
// so a write from another device in between is noticed (and re-reconciled) instead of overwritten.
async function driveVersion(token, id) {
  const res = await driveReq(token, `https://www.googleapis.com/drive/v3/files/${id}?fields=version`);
  const j = await res.json();
  return (j && j.version) || null;
}
async function driveDelete(token, id) { await driveReq(token, `https://www.googleapis.com/drive/v3/files/${id}`, { method: "DELETE" }); }
async function driveListByPrefix(token, prefix) {
  const q = encodeURIComponent(`name contains '${prefix}' and trashed=false`);
  const res = await driveReq(token, `https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&q=${q}&fields=files(id,name,createdTime)&pageSize=100`);
  const j = await res.json();
  return j.files || [];
}
async function driveModified(token, id) {
  const res = await driveReq(token, `https://www.googleapis.com/drive/v3/files/${id}?fields=modifiedTime`);
  const j = await res.json();
  return (j && j.modifiedTime) || null;
}
async function driveFindSyncFile(token, name = SYNC_FILE_NAME) {
  const q = encodeURIComponent(`name='${name}' and trashed=false`);
  const res = await driveReq(token, `https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&q=${q}&fields=files(id,modifiedTime)&orderBy=createdTime&pageSize=10`);
  const j = await res.json();
  return j.files && j.files.length ? j.files[0].id : null;
}
async function driveDownload(token, id) {
  const res = await driveReq(token, `https://www.googleapis.com/drive/v3/files/${id}?alt=media`);
  return res.json();
}
// Small payloads go up in one multipart request; big ones (a large library) use a resumable upload.
async function driveUpload(token, id, jsonText, name = SYNC_FILE_NAME) {
  const meta = id ? {} : { name, parents: ["appDataFolder"], mimeType: "application/json" };
  const method = id ? "PATCH" : "POST";
  const base = "https://www.googleapis.com/upload/drive/v3/files" + (id ? `/${id}` : "");
  if (jsonText.length < 4 * 1024 * 1024) {
    const boundary = "oworld" + Math.random().toString(36).slice(2);
    const body = `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(meta)}\r\n--${boundary}\r\nContent-Type: application/json\r\n\r\n${jsonText}\r\n--${boundary}--`;
    const res = await driveReq(token, `${base}?uploadType=multipart&fields=id`, { method, headers: { "Content-Type": `multipart/related; boundary=${boundary}` }, body });
    return (await res.json()).id;
  }
  const start = await driveReq(token, `${base}?uploadType=resumable&fields=id`, { method, headers: { "Content-Type": "application/json; charset=UTF-8", "X-Upload-Content-Type": "application/json" }, body: JSON.stringify(meta) });
  const loc = start.headers.get("Location");
  if (!loc) throw new Error("no-upload-url");
  const res = await driveReq(token, loc, { method: "PUT", headers: { "Content-Type": "application/json" }, body: jsonText });
  return (await res.json()).id;
}

// useDriveSync: owns sign-in, the pull → merge → push cycle, and the debounced background sync.
// onMerged(merged) lets the app fold the cloud's data into its own state (merges are idempotent and never delete without a tombstone).
function useDriveSync({ library, sessionLog, tombs, onMerged }) {
  const configured = !!GOOGLE_CLIENT_ID;
  const saved = useRef(lsGet(LS_SYNC) || {});
  const [linked, setLinked] = useState(!!saved.current.linked && configured);
  const [status, setStatus] = useState(configured ? (saved.current.linked ? "reauth" : "none") : "off"); // off | none | busy | done | reauth | error
  const [errKey, setErrKey] = useState("");
  const [lastSync, setLastSync] = useState(saved.current.lastSync || 0);
  const [profile, setProfile] = useState((configured && saved.current.profile) || null); // { name, email, picture }
  const chooseAccount = useRef(false);   // an explicit "Sign in" click shows the account chooser
  const latest = useRef({}); latest.current = { library, sessionLog, tombs, onMerged };
  const tokenRef = useRef(null);          // { value, exp }
  const clientRef = useRef(null);
  const pending = useRef(null);
  const fileIdRef = useRef(saved.current.fileId || null);
  const running = useRef(false);
  const rerun = useRef(false);
  const needsAuth = useRef(!!saved.current.linked);
  const modRef = useRef(null);            // the sync file's last-seen modifiedTime, so polling can skip a full download when nothing changed
  const linkedRef = useRef(linked); linkedRef.current = linked;
  const deviceId = useRef((lsGet("owordDeviceId") || null) || (() => { const id = `dev_${Math.random().toString(36).slice(2, 10)}`; lsSet("owordDeviceId", JSON.stringify(id)); return id; })());

  const remember = (patch) => { saved.current = { ...saved.current, ...patch }; lsSet(LS_SYNC, JSON.stringify(saved.current)); };

  const getToken = useCallback(async () => {
    const tk = tokenRef.current;
    if (tk && tk.exp - 60000 > Date.now()) return tk.value;
    await loadGis();
    if (!clientRef.current) {
      clientRef.current = window.google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID, scope: SIGNIN_SCOPES,
        callback: (resp) => { const p = pending.current; pending.current = null; if (p) p.resolve(resp); },
        error_callback: (err) => { const p = pending.current; pending.current = null; if (p) p.reject(Object.assign(new Error((err && err.type) || "auth-failed"), { auth: true })); },
      });
    }
    const resp = await new Promise((resolve, reject) => { pending.current = { resolve, reject }; const hint = saved.current.profile && saved.current.profile.email;
      const prompt = chooseAccount.current ? "select_account" : "";
      chooseAccount.current = false;
      // Explicit "Sign in" → always the account chooser. Background token refreshes stay silent (hinted to the linked account),
      // otherwise the chooser would pop up every hour.
      clientRef.current.requestAccessToken(prompt ? { prompt } : hint ? { prompt: "", hint } : { prompt: "" });
    });
    if (resp.error) throw Object.assign(new Error(resp.error), { auth: true });
    if (!window.google.accounts.oauth2.hasGrantedAllScopes(resp, DRIVE_SCOPE)) throw Object.assign(new Error("scope-denied"), { auth: true, denied: true });
    tokenRef.current = { value: resp.access_token, exp: Date.now() + (Number(resp.expires_in) || 3600) * 1000 };
    return resp.access_token;
  }, []);

  const sync = useCallback(async ({ interactive = false } = {}) => {
    if (!configured) return;
    if (!interactive && needsAuth.current && !(tokenRef.current && tokenRef.current.exp > Date.now())) return; // no popups behind the user's back after a failed silent attempt
    if (running.current) { rerun.current = true; return; }
    running.current = true; setStatus("busy"); setErrKey("");
    try {
      const token = await getToken();
      needsAuth.current = false;
      if (interactive || !saved.current.profile) { // name / email / photo for the account button; a failure here never blocks syncing
        try {
          const r = await fetch(USERINFO_URL, { headers: { Authorization: `Bearer ${token}` } });
          if (r.ok) {
            const u = await r.json();
            const prof = { name: u.name || "", email: u.email || "", picture: u.picture || "" };
            remember({ profile: prof }); setProfile(prof);
          }
        } catch (e) { /* ignore */ }
      }
      let fileId = fileIdRef.current; let remote = null;
      if (fileId) { try { remote = await driveDownload(token, fileId); } catch (e) { if (e.status === 404) fileId = null; else throw e; } }
      if (!fileId) { fileId = await driveFindSyncFile(token); if (fileId) remote = await driveDownload(token, fileId); }

      const cur = latest.current;
      const local = { qbanks: cur.library, examSessions: cur.sessionLog, deleted: cur.tombs, reviews: collectReviews(cur.sessionLog) };
      const merged = mergeSyncState(local, remote);
      cur.onMerged(merged);

      const coreText = JSON.stringify({ qbanks: merged.qbanks, examSessions: merged.examSessions, reviews: merged.reviews, deleted: merged.deleted });
      const remoteCore = remote ? mergeSyncState({ qbanks: [], examSessions: [], deleted: emptyTombs(), reviews: {} }, remote) : null;
      const remoteText = remoteCore ? JSON.stringify({ qbanks: remoteCore.qbanks, examSessions: remoteCore.examSessions, reviews: remoteCore.reviews, deleted: remoteCore.deleted }) : null;
      if (!fileId || !remoteText || hashStr(coreText) !== hashStr(remoteText)) {
        const payload = JSON.stringify({ v: 1, app: "oworld", updatedAt: Date.now(), deviceId: deviceId.current, ...merged });
        fileId = await driveUpload(token, fileId, payload);
      }
      fileIdRef.current = fileId;
      try { modRef.current = await driveModified(token, fileId); } catch (e) { /* polling just does a full sync next time */ }
      const now = Date.now();
      remember({ linked: true, fileId, lastSync: now });
      setLinked(true); setLastSync(now); setStatus("done");
    } catch (e) {
      if (e && e.auth) { needsAuth.current = true; tokenRef.current = null; setStatus("reauth"); setErrKey(e.denied ? "syncDenied" : interactive ? "syncGenericErr" : ""); }
      else if (e && e.message === "gis-blocked") { setStatus("error"); setErrKey("syncBlocked"); }
      else if (e && e.status === 401) { tokenRef.current = null; needsAuth.current = true; setStatus("reauth"); }
      else { setStatus("error"); setErrKey("syncGenericErr"); }
    } finally {
      running.current = false;
      if (rerun.current) { rerun.current = false; setTimeout(() => sync(), 0); }
    }
  }, [configured, getToken]);

  // Preload Google's script so the sign-in popup opens directly from the click (browsers block popups after an await).
  useEffect(() => { if (configured) loadGis().catch(() => {}); }, []); // eslint-disable-line

  // First sync after the app starts (silent if Google still has a session; otherwise the panel shows Reconnect).
  useEffect(() => { if (configured && saved.current.linked) sync(); }, []); // eslint-disable-line

  // Pick up another device's library changes: a cheap metadata check every 45 s and whenever the tab comes back to the foreground.
  // A full pull/merge only runs if the Drive file actually changed. (A test in progress syncs separately, see useSessionSync.)
  const pollRemote = useCallback(async () => {
    const tk = tokenRef.current;
    if (!configured || !linkedRef.current || running.current || !fileIdRef.current || !tk || tk.exp - 60000 <= Date.now()) return;
    try { const mod = await driveModified(tk.value, fileIdRef.current); if (mod && modRef.current && mod !== modRef.current) sync(); } catch (e) { /* ignore */ }
  }, [configured, sync]);
  useEffect(() => {
    if (!configured) return undefined;
    const onVis = () => {
      if (!linkedRef.current || document.visibilityState === "hidden") return;
      const tk = tokenRef.current;
      if (tk && tk.exp - 60000 > Date.now()) pollRemote(); else sync();
    };
    const id = setInterval(() => { if (document.visibilityState === "visible") pollRemote(); }, 45000);
    document.addEventListener("visibilitychange", onVis);
    return () => { clearInterval(id); document.removeEventListener("visibilitychange", onVis); };
  }, [configured, sync, pollRemote]);

  // Background sync after any change to the library, Analytics or deletions (debounced so a burst becomes one sync).
  const first = useRef(true);
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    if (!linked) return;
    const id = setTimeout(() => sync(), 4000);
    return () => clearTimeout(id);
  }, [library, sessionLog, tombs, linked, sync]);

  // Shared with useSessionSync. A valid token, or (only when `interactive`, i.e. from a click) a fresh one. Never pops a window by itself
  // after a failed silent attempt, same rule as the library sync.
  const acquireToken = useCallback(async ({ interactive = false } = {}) => {
    const tk = tokenRef.current;
    if (tk && tk.exp - 60000 > Date.now()) return tk.value;
    if (!interactive && needsAuth.current) return null;
    try { const v = await getToken(); needsAuth.current = false; return v; }
    catch (e) { needsAuth.current = true; tokenRef.current = null; setStatus("reauth"); return null; }
  }, [getToken]);
  const peekToken = useCallback(() => { const tk = tokenRef.current; return tk && tk.exp - 60000 > Date.now() ? tk.value : null; }, []);

  const connect = useCallback(() => { chooseAccount.current = true; setLinked(true); remember({ linked: true }); needsAuth.current = false; sync({ interactive: true }); }, [sync]);
  const disconnect = useCallback(() => {
    const tk = tokenRef.current;
    // Revoke the access token with Google first, then clear everything stored locally.
    try { if (tk && tk.value && window.google && window.google.accounts) window.google.accounts.oauth2.revoke(tk.value, () => {}); } catch (e) { /* ignore */ }
    try { if (window.google && window.google.accounts && window.google.accounts.id) window.google.accounts.id.disableAutoSelect(); } catch (e) { /* ignore */ }
    tokenRef.current = null; fileIdRef.current = null; needsAuth.current = false; clientRef.current = null;
    lsRemove(LS_SYNC); saved.current = {};
    setProfile(null); setLinked(false); setLastSync(0); setErrKey(""); setStatus(configured ? "none" : "off");
  }, [configured]);

  return { configured, linked, profile, acquireToken, peekToken, status, errKey, lastSync, connect, disconnect, signIn: connect, signOut: disconnect, syncNow: () => sync({ interactive: true }), reconnect: () => sync({ interactive: true }) };
}

// useSessionSync: keeps the test in progress in step through its own two small Drive files (see the schema note above).
//  - state file: pull → reconcile → (maybe) push, with a version check right before the write so another device's write in between is
//    re-reconciled instead of overwritten (up to 3 rounds);
//  - block file: uploaded once per test, before the state file that points at it;
//  - polling the state file's version every 15 s (tiny request) and when the tab returns to the foreground; a push when it is hidden.
function useSessionSync({ drive, stamp, getLocal, onDecision, onSynced, onBlockSaved }) {
  const { configured, linked, acquireToken, peekToken, lastSync } = drive;
  const latest = useRef({}); latest.current = { getLocal, onDecision, onSynced, onBlockSaved };
  const fileRef = useRef((lsGet(LS_SESSION_FILE) || {}).fileId || null);
  const verRef = useRef(null);
  const running = useRef(false);
  const rerun = useRef(false);
  const linkedRef = useRef(linked); linkedRef.current = linked;

  const remember = (id) => { fileRef.current = id; if (id) lsSet(LS_SESSION_FILE, JSON.stringify({ fileId: id })); else lsRemove(LS_SESSION_FILE); };

  const run = useCallback(async ({ interactive = false } = {}) => {
    if (!configured || !linkedRef.current) return;
    if (running.current) { rerun.current = true; return; }
    running.current = true;
    try {
      const token = await acquireToken({ interactive });
      if (!token) return;
      for (let round = 0; round < 3; round++) {
        // 1. pull (version first, then content: if the file changes in between, the pre-push check below catches it)
        let fileId = fileRef.current; let remote = null; let ver = null;
        if (fileId) { try { ver = await driveVersion(token, fileId); remote = await driveDownload(token, fileId); } catch (e) { if (e.status === 404) fileId = null; else throw e; } }
        if (!fileId) { fileId = await driveFindSyncFile(token, SESSION_FILE_NAME); if (fileId) { ver = await driveVersion(token, fileId); remote = await driveDownload(token, fileId); } }

        // 2. reconcile remote vs local
        const cur = latest.current;
        const local = cur.getLocal();
        const { winner, action } = reconcileActiveSession(local.active, remote, local.baseAt);

        // 3. act on what the other device did
        if (action === "offer" || action === "conflict") {
          let block = null; try { block = await fetchSessionBlock(token, remote); } catch (e) { /* the prompt retries the download on accept */ }
          cur.onDecision({ action, remote, block });
        } else if (action === "adopt" || action === "end") cur.onDecision({ action, remote });

        // 4. push this device's version when it wins
        if (action === "push" && winner) {
          let payload = winner;
          if (winner.ended) {
            payload = { sessionId: winner.sessionId, ended: true, updatedAt: winner.updatedAt };
            if (local.blockFileId) { driveDelete(token, local.blockFileId).catch(() => {}); cur.onBlockSaved(winner.sessionId, null); } // the test is over: its question copy can go
          } else {
            let bf = winner.blockFileId;
            if (!bf && local.block) { // first push of this test: the exact question set goes up once, BEFORE the state that points at it
              bf = await driveUpload(token, null, JSON.stringify({ v: 1, sessionId: winner.sessionId, block: local.block }), blockFileName(winner.sessionId));
              cur.onBlockSaved(winner.sessionId, bf);
              driveListByPrefix(token, "oword_block_").then((files) => { // housekeeping: copies left behind by crashed devices, older than 3 days
                const old = Date.now() - 3 * 24 * 3600 * 1000;
                files.filter((f) => f.name !== blockFileName(winner.sessionId) && Date.parse(f.createdTime) < old).forEach((f) => driveDelete(token, f.id).catch(() => {}));
              }).catch(() => {});
            }
            payload = { ...winner, blockFileId: bf || null };
          }
          if (fileId && ver !== null && (await driveVersion(token, fileId)) !== ver) continue; // someone wrote since we pulled: re-pull and re-reconcile
          fileId = await driveUpload(token, fileId, JSON.stringify({ v: 1, app: "oworld", ...payload }), SESSION_FILE_NAME);
          remember(fileId);
          try { verRef.current = await driveVersion(token, fileId); } catch (e) { verRef.current = null; }
          cur.onSynced(payload);
        } else {
          remember(fileId); verRef.current = ver;
          cur.onSynced(winner);
        }
        break;
      }
    } catch (e) { /* offline / blocked: local state is untouched, the next change or poll retries */ }
    finally {
      running.current = false;
      if (rerun.current) { rerun.current = false; setTimeout(() => run(), 0); }
    }
  }, [configured, acquireToken]);

  // After any real mutation of the test (answer, navigate, flag, highlight, note): push soon. The files are tiny, so this stays short.
  const first = useRef(true);
  useEffect(() => {
    if (first.current) { first.current = false; return undefined; }
    if (!linked) return undefined;
    const id = setTimeout(() => run(), 2000);
    return () => clearTimeout(id);
  }, [stamp, linked, run]);

  // On connect / reconnect / after each library sync: make sure the test is current.
  useEffect(() => { if (linked) run(); else { remember(null); verRef.current = null; } }, [linked, lastSync, run]); // eslint-disable-line

  // Notice the other device: version poll while visible, immediate check on return, push on hide (fresh elapsed time).
  const poll = useCallback(async () => {
    const tk = peekToken();
    if (!configured || !linkedRef.current || running.current || !tk) return;
    if (!fileRef.current) { run(); return; }                         // nothing known yet: look for the file
    try { const v = await driveVersion(tk, fileRef.current); if (v !== verRef.current) run(); } catch (e) { /* ignore */ }
  }, [configured, peekToken, run]);
  useEffect(() => {
    if (!configured) return undefined;
    const onVis = () => { if (!linkedRef.current) return; if (document.visibilityState === "hidden") run(); else poll(); };
    const id = setInterval(() => { if (document.visibilityState === "visible") poll(); }, 15000);
    document.addEventListener("visibilitychange", onVis);
    return () => { clearInterval(id); document.removeEventListener("visibilitychange", onVis); };
  }, [configured, run, poll]);

  // Prompt "Continue here": the block normally arrives with the prompt, otherwise fetch it now (this is a click, so a sign-in popup is allowed).
  const fetchBlock = useCallback(async (remote) => {
    const token = await acquireToken({ interactive: true });
    if (!token) return null;
    try { return await fetchSessionBlock(token, remote); } catch (e) { return null; }
  }, [acquireToken]);

  return { syncNow: () => run({ interactive: true }), fetchBlock };
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
// The Trash lives in the app state; the Settings menu (profile picture, upper right) reads it from here.
const TrashContext = createContext({ trash: [], restore: () => {}, purge: () => {} });
// Lets the account menu (on every screen) open a Home page such as the Study Profile. locked = a timed block can't be left.
const NavContext = createContext({ open: null, locked: false });
const DriveContext = createContext(null); // the Google account + Drive sync, read by the profile menu on every screen

// ---------------------------------------------------------------------------
// Career & Study profile (Account window): who the student is (status, graduation year, school) and what they are
// preparing for (medical school phases + USMLE steps with optional target dates). One small JSON document, local first,
// synced through its own file in the Drive app-data folder (same sign-in, same newest-edit-wins merge as the Study Profile).
// The AI prompt on the Study Profile page reads it, so the tutor never has to ask these things again.
// ---------------------------------------------------------------------------
const LS_CAREER = "owordCareerProfile";           // { career, updatedAt, clearedAt }
const LS_CAREER_FILE = "owordCareerProfileFile";   // { fileId, lastSync } of the Drive file below
const CAREER_FILE_NAME = "oword_career_profile.json";
const CAREER_TYPE = "oworld-career-profile";
const CAREER_STATUSES = ["student", "graduate", "resident", "other"];
const CAREER_COURSEWORK = ["generals", "preclinical", "clinical"];
const CAREER_STEPS = ["step1", "step2ck", "step3"];
const CAREER_EMPTY = { status: "", gradYear: null, country: "", university: "", school: "", city: "", coursework: [], usmle: [], stepDates: {} };

// Tolerant: keeps only values the form could have produced, so a hand-edited or older file can never break the window.
function normalizeCareer(raw) {
  const r = raw && typeof raw === "object" ? raw : {};
  const str = (v) => (typeof v === "string" ? v.slice(0, 120) : "");
  const yr = Number(r.gradYear);
  const stepDates = {};
  CAREER_STEPS.forEach((k) => { const d = r.stepDates && r.stepDates[k]; if (typeof d === "string" && parseISODate(d)) stepDates[k] = d; });
  return {
    status: CAREER_STATUSES.includes(r.status) ? r.status : "",
    gradYear: Number.isInteger(yr) && yr >= 1990 && yr <= 2100 ? yr : null,
    country: str(r.country), university: str(r.university), school: str(r.school), city: str(r.city),
    coursework: CAREER_COURSEWORK.filter((k) => Array.isArray(r.coursework) && r.coursework.includes(k)),
    usmle: CAREER_STEPS.filter((k) => Array.isArray(r.usmle) && r.usmle.includes(k)),
    stepDates,
  };
}
const careerIsEmpty = (c) => !c || (!c.status && !c.gradYear && !c.country && !c.university && !c.city && !c.coursework.length && !c.usmle.length);
const careerCore = (m) => hashStr(JSON.stringify({ c: m.career, u: m.updatedAt, k: m.clearedAt }));

// One-line identity for headers: "Medical student · UNIBE · Class of 2028". An acronym in parentheses wins over the long university name.
function careerLine(c, t) {
  if (careerIsEmpty(c)) return "";
  const acr = /\(([^)]{2,14})\)\s*$/.exec(c.university || "");
  const uni = acr ? acr[1] : c.university;
  return [c.status ? t(`cpStatus.${c.status}`) : "", uni, c.gradYear ? t("cpClassOf", { y: c.gradYear }) : ""].filter(Boolean).join(" · ");
}

// The soonest USMLE step that has a target date today or later.
function careerNextStep(c, now) {
  const today = startOfDay(now); let best = null;
  (c.usmle || []).forEach((k) => {
    const d = parseISODate(c.stepDates && c.stepDates[k]); if (!d) return;
    const days = Math.round((d - today) / 864e5);
    if (days >= 0 && (!best || days < best.days)) best = { key: k, days, date: d };
  });
  return best;
}

// Plain English block for the AI prompt (the prompt is English even when the app is Spanish).
function careerForPrompt(c) {
  if (careerIsEmpty(c)) return null;
  const STATUS = { student: "medical student", graduate: "medical graduate (IMG)", resident: "resident", other: "other" };
  const WORK = { generals: "Generals", preclinical: "Preclinical", clinical: "Clinical studies" };
  const STEP = { step1: "USMLE Step 1", step2ck: "USMLE Step 2 CK", step3: "USMLE Step 3" };
  const L = [];
  if (c.status) L.push(`Status: ${STATUS[c.status]}`);
  if (c.gradYear) L.push(`Graduation year: ${c.gradYear}`);
  const where = [c.city, c.country].filter(Boolean).join(", "); if (where) L.push(`Location: ${where}`);
  if (c.university) L.push(`School: ${c.university}`);
  if (c.coursework.length) L.push(`Medical school studies in progress: ${c.coursework.map((k) => WORK[k]).join(", ")}`);
  if (c.usmle.length) L.push(`USMLE exams I am preparing for: ${c.usmle.map((k) => STEP[k] + (c.stepDates[k] ? ` (target date ${c.stepDates[k]})` : "")).join(", ")}`);
  return L.join("\n");
}

// Newest edit wins as a whole; a clear beats any older edit.
function mergeCareerState(local, remote) {
  const r = remote && typeof remote === "object" ? remote : {};
  const L = { career: local.career ? normalizeCareer(local.career) : null, updatedAt: Number(local.updatedAt) || 0, clearedAt: Number(local.clearedAt) || 0 };
  const R = { career: r.career ? normalizeCareer(r.career) : null, updatedAt: Number(r.updatedAt) || 0, clearedAt: Number(r.clearedAt) || 0 };
  const clearedAt = Math.max(L.clearedAt, R.clearedAt);
  const newer = R.updatedAt > L.updatedAt ? R : L;
  let career = newer.career;
  if (career && newer.updatedAt <= clearedAt) career = null;
  return { career, updatedAt: Math.max(L.updatedAt, R.updatedAt), clearedAt };
}

function useCareerProfile() {
  const [state, setState] = useState(() => {
    const v = lsGet(LS_CAREER);
    return v && typeof v === "object" ? { career: v.career ? normalizeCareer(v.career) : null, updatedAt: Number(v.updatedAt) || 0, clearedAt: Number(v.clearedAt) || 0 } : { career: null, updatedAt: 0, clearedAt: 0 };
  });
  const ref = useRef(state);
  useEffect(() => { lsSet(LS_CAREER, JSON.stringify(state)); }, [state]);
  const commit = (n) => { ref.current = n; setState(n); };
  const set = useCallback((patch) => {
    const cur = ref.current;
    commit({ career: normalizeCareer({ ...(cur.career || CAREER_EMPTY), ...patch }), updatedAt: Date.now(), clearedAt: cur.clearedAt });
  }, []);
  const clear = useCallback(() => { const now = Date.now(); commit({ career: null, updatedAt: now, clearedAt: now }); }, []);
  // "Reset all data": local only, no tombstone, so Drive keeps its copy and reconnecting restores it.
  const wipe = useCallback(() => { ref.current = { career: null, updatedAt: 0, clearedAt: 0 }; setState(ref.current); lsRemove(LS_CAREER); lsRemove(LS_CAREER_FILE); }, []);
  const applyMerged = useCallback((m) => { if (careerCore(m) !== careerCore(ref.current)) commit(m); }, []);
  const getState = useCallback(() => ref.current, []);
  const career = state.career || CAREER_EMPTY;
  return { career, hasData: !careerIsEmpty(career), updatedAt: state.updatedAt, clearedAt: state.clearedAt, set, clear, wipe, applyMerged, getState };
}

// Google Drive sync for the career profile: own file, same sign-in and token as the other syncs, same pull -> merge -> push cycle.
function useCareerSync({ drive, store }) {
  const { configured, linked, acquireToken, peekToken } = drive;
  const latest = useRef({}); latest.current = { getState: store.getState, applyMerged: store.applyMerged };
  const fileRef = useRef((lsGet(LS_CAREER_FILE) || {}).fileId || null);
  const modRef = useRef(null); const running = useRef(false); const rerun = useRef(false);
  const linkedRef = useRef(linked); linkedRef.current = linked;
  const [status, setStatus] = useState("idle"); // idle | busy | done | error
  const [lastSync, setLastSync] = useState((lsGet(LS_CAREER_FILE) || {}).lastSync || 0);

  const run = useCallback(async ({ interactive = false } = {}) => {
    if (!configured || !linkedRef.current) return;
    if (running.current) { rerun.current = true; return; }
    running.current = true; setStatus("busy");
    try {
      const token = await acquireToken({ interactive });
      if (!token) { setStatus("idle"); return; }
      let fileId = fileRef.current; let remote = null;
      if (fileId) { try { remote = await driveDownload(token, fileId); } catch (e) { if (e.status === 404) fileId = null; else throw e; } }
      if (!fileId) { fileId = await driveFindSyncFile(token, CAREER_FILE_NAME); if (fileId) remote = await driveDownload(token, fileId); }
      const cur = latest.current.getState();
      const merged = mergeCareerState(cur, remote);
      latest.current.applyMerged(merged);
      const remoteMerged = remote ? mergeCareerState({ career: null, updatedAt: 0, clearedAt: 0 }, remote) : null;
      if (!fileId || !remoteMerged || careerCore(merged) !== careerCore(remoteMerged)) {
        const payload = JSON.stringify({ v: 1, app: "oworld", type: CAREER_TYPE, updatedAt: merged.updatedAt, clearedAt: merged.clearedAt, career: merged.career });
        fileId = await driveUpload(token, fileId, payload, CAREER_FILE_NAME);
      }
      fileRef.current = fileId;
      try { modRef.current = await driveModified(token, fileId); } catch (e) { /* the next poll just does a full sync */ }
      const now = Date.now();
      lsSet(LS_CAREER_FILE, JSON.stringify({ fileId, lastSync: now }));
      setLastSync(now); setStatus("done");
    } catch (e) { setStatus("error"); }
    finally { running.current = false; if (rerun.current) { rerun.current = false; setTimeout(() => run(), 0); } }
  }, [configured, acquireToken]);

  useEffect(() => { if (configured && linked && drive.status === "done") run(); }, [configured, linked, drive.status]); // eslint-disable-line
  useEffect(() => { if (!linked) { fileRef.current = null; modRef.current = null; lsRemove(LS_CAREER_FILE); setStatus("idle"); setLastSync(0); } }, [linked]);
  const first = useRef(true);
  useEffect(() => {
    if (first.current) { first.current = false; return undefined; }
    if (!linked) return undefined;
    const id = setTimeout(() => run(), 3000);
    return () => clearTimeout(id);
  }, [store.updatedAt, store.clearedAt, linked, run]);
  const poll = useCallback(async () => {
    const tk = peekToken();
    if (!configured || !linkedRef.current || running.current || !fileRef.current || !tk) return;
    try { const mod = await driveModified(tk, fileRef.current); if (mod && modRef.current && mod !== modRef.current) run(); } catch (e) { /* ignore */ }
  }, [configured, peekToken, run]);
  useEffect(() => {
    if (!configured) return undefined;
    const onVis = () => { if (document.visibilityState === "visible") poll(); };
    const id = setInterval(() => { if (document.visibilityState === "visible") poll(); }, 45000);
    document.addEventListener("visibilitychange", onVis);
    return () => { clearInterval(id); document.removeEventListener("visibilitychange", onVis); };
  }, [configured, poll]);
  return { available: !!(configured && linked), status, lastSync, syncNow: () => run({ interactive: true }) };
}

const CareerContext = createContext({
  career: CAREER_EMPTY, hasData: false, updatedAt: 0, clearedAt: 0, set: () => {}, clear: () => {}, wipe: () => {}, applyMerged: () => {}, getState: () => ({}),
  sync: { available: false, status: "idle", lastSync: 0, syncNow: () => {} },
});

// ---------------------------------------------------------------------------
// Notifications: a small persisted in-app inbox. Entries store only a `kind` + vars, so the text is localized when shown.
// ---------------------------------------------------------------------------
const LS_NOTIFS = "owordNotifications";
const NOTIF_MAX = 50;
const NotifContext = createContext({ items: [], unread: 0, notify: () => {}, markRead: () => {}, markAllRead: () => {}, dismiss: () => {}, clearAll: () => {} });

function useNotifications() {
  const [items, setItems] = useState(() => {
    const v = lsGet(LS_NOTIFS);
    return Array.isArray(v) ? v.filter((n) => n && typeof n.id === "string" && typeof n.kind === "string").slice(0, NOTIF_MAX) : [];
  });
  useEffect(() => { lsSet(LS_NOTIFS, JSON.stringify(items)); }, [items]);
  // `dedupe`: a newer notification with the same key replaces the older one instead of piling up.
  const notify = useCallback(({ kind, vars, tone = "blue", dedupe }) => {
    setItems((cur) => {
      const rest = dedupe ? cur.filter((n) => n.dedupe !== dedupe) : cur;
      const n = { id: `n_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`, kind, vars: vars || {}, tone, ts: Date.now(), read: false, dedupe: dedupe || null };
      return [n, ...rest].slice(0, NOTIF_MAX);
    });
  }, []);
  const markRead = useCallback((id) => setItems((cur) => cur.map((n) => (n.id === id && !n.read ? { ...n, read: true } : n))), []);
  const markAllRead = useCallback(() => setItems((cur) => (cur.some((n) => !n.read) ? cur.map((n) => ({ ...n, read: true })) : cur)), []);
  const dismiss = useCallback((id) => setItems((cur) => cur.filter((n) => n.id !== id)), []);
  const clearAll = useCallback(() => setItems([]), []);
  const unread = items.filter((n) => !n.read).length;
  return { items, unread, notify, markRead, markAllRead, dismiss, clearAll };
}

function timeAgo(ts, lang, t) {
  const sec = Math.round((Date.now() - ts) / 1000);
  if (sec < 45) return t("notifJustNow");
  try {
    const rtf = new Intl.RelativeTimeFormat(lang === "es" ? "es" : "en", { numeric: "auto" });
    if (sec < 3600) return rtf.format(-Math.round(sec / 60), "minute");
    if (sec < 86400) return rtf.format(-Math.round(sec / 3600), "hour");
    return rtf.format(-Math.round(sec / 86400), "day");
  } catch (e) { return new Date(ts).toLocaleDateString(); }
}

function NotificationBell({ T }) {
  const { t, lang } = useI18n();
  const { items, unread, markRead, markAllRead, dismiss, clearAll } = useContext(NotifContext);
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);
  const [place, setPlace] = useState({ right: 0 });
  useEffect(() => {
    if (!open) return undefined;
    const away = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false); };
    const esc = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", away); document.addEventListener("touchstart", away); document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("mousedown", away); document.removeEventListener("touchstart", away); document.removeEventListener("keydown", esc); };
  }, [open]);

  // Same placement rule as the profile menu: never let the panel run off-screen.
  function toggle() {
    if (!open && wrapRef.current) {
      const r = wrapRef.current.getBoundingClientRect();
      const vw = window.innerWidth;
      const W = Math.min(340, vw - 16);
      if (r.right - W >= 8) setPlace({ right: 0 });
      else if (r.left + W <= vw - 8) setPlace({ left: 0 });
      else setPlace({ left: 8 - r.left });
    }
    setOpen((v) => !v);
  }
  const toneOf = (tn) => ({
    green: { fg: T.green, bg: T.greenLight, Icon: CheckCircle2 },
    amber: { fg: T.amber, bg: T.amberLight, Icon: AlertTriangle },
    red: { fg: T.red, bg: T.redLight, Icon: XCircle },
  }[tn] || { fg: T.blue, bg: T.blueLight, Icon: Bell });
  const textLink = { background: "none", border: "none", padding: 0, cursor: "pointer", fontFamily: FONT_UI, fontWeight: 600, fontSize: fs(12.5), color: T.blue };

  return (
    <div ref={wrapRef} style={{ position: "relative", flexShrink: 0 }}>
      <button
        onClick={toggle} aria-haspopup="true" aria-expanded={open}
        aria-label={unread ? `${t("notifBtn")} (${t("notifUnread", { n: unread })})` : t("notifBtn")} title={t("notifBtn")}
        style={{
          position: "relative", display: "inline-flex", alignItems: "center", justifyContent: "center", width: 40, height: 40, padding: 0, borderRadius: "50%", cursor: "pointer",
          background: open ? T.blueLight : "transparent", border: `1px solid ${open ? T.blue : T.border}`, color: T.ink,
        }}
      >
        <Bell size={17} />
        {unread > 0 && (
          <span aria-hidden="true" style={{
            position: "absolute", top: -4, right: -4, minWidth: 18, height: 18, padding: "0 5px", boxSizing: "border-box", borderRadius: 999,
            background: T.red, color: "#fff", border: `2px solid ${T.paper}`, display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: FONT_UI, fontWeight: 700, fontSize: 10, lineHeight: 1,
          }}>{unread > 9 ? "9+" : unread}</span>
        )}
      </button>
      {open && (
        <div role="dialog" aria-label={t("notifTitle")} style={{
          position: "absolute", top: "calc(100% + 8px)", ...place, background: T.card, border: `1px solid ${T.border}`, borderRadius: 10,
          width: "min(340px, calc(100vw - 16px))", maxHeight: "min(480px, calc(100vh - 80px))", display: "flex", flexDirection: "column", zIndex: 70, boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, padding: "12px 14px", borderBottom: `1px solid ${T.border}` }}>
            <span style={{ fontFamily: FONT_UI, fontWeight: 700, fontSize: fs(14.5), color: T.ink }}>{t("notifTitle")}</span>
            {items.length > 0 && (
              <span style={{ display: "flex", gap: 12 }}>
                {unread > 0 && <button onClick={markAllRead} style={textLink}>{t("notifMarkAll")}</button>}
                <button onClick={clearAll} style={{ ...textLink, color: T.muted }}>{t("notifClear")}</button>
              </span>
            )}
          </div>
          <div style={{ overflowY: "auto" }}>
            {items.length === 0 ? (
              <div style={{ padding: "28px 18px", textAlign: "center" }}>
                <Bell size={24} color={T.muted} />
                <div style={{ fontFamily: FONT_UI, fontWeight: 600, fontSize: fs(13.5), color: T.ink, marginTop: 8 }}>{t("notifEmpty")}</div>
                <div style={{ fontFamily: FONT_UI, fontSize: fs(12.5), color: T.muted, marginTop: 4, lineHeight: 1.45 }}>{t("notifEmptyHint")}</div>
              </div>
            ) : items.map((n) => {
              const tn = toneOf(n.tone);
              const body = n.kind === "syncError" && n.vars && n.vars.errKey ? t(n.vars.errKey) : t(`nf.${n.kind}.b`, n.vars);
              return (
                <div key={n.id} onClick={() => markRead(n.id)} style={{
                  display: "flex", gap: 10, padding: "12px 14px", borderBottom: `1px solid ${T.border}`, cursor: "pointer",
                  background: n.read ? "transparent" : T.blueLight,
                }}>
                  <span style={{ width: 30, height: 30, borderRadius: "50%", background: n.read ? T.mutedBg : tn.bg, display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <tn.Icon size={16} color={tn.fg} />
                  </span>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 8 }}>
                      <span style={{ fontFamily: FONT_UI, fontWeight: n.read ? 600 : 700, fontSize: fs(13.5), color: T.ink }}>{t(`nf.${n.kind}.t`)}</span>
                      <span style={{ fontFamily: FONT_UI, fontSize: fs(11.5), color: T.muted, whiteSpace: "nowrap", flexShrink: 0 }}>{timeAgo(n.ts, lang, t)}</span>
                    </div>
                    <div style={{ fontFamily: FONT_UI, fontSize: fs(12.5), color: T.muted, lineHeight: 1.45, marginTop: 2, overflowWrap: "anywhere" }}>{body}</div>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); dismiss(n.id); }} aria-label={t("notifDismiss")} title={t("notifDismiss")} style={{
                    alignSelf: "flex-start", background: "none", border: "none", padding: 2, cursor: "pointer", color: T.muted, display: "flex", flexShrink: 0,
                  }}><X size={15} /></button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Study Profile: ONE standardized JSON document that says where the student is in their studies (term, syllabus weeks,
// assessments, current state, plan). Same philosophy as the Qbank JSON: an AI tool writes it from the student's own documents
// (the syllabus), Oworld validates it tolerantly, and from then on the TUTOR is everywhere, not just a test mode:
//   Console  → "Your tutor" card (this week, next exam, today's tasks, guidance)
//   Library  → Qbanks that match this week's topics are suggested
//   Import   → "Start a <subject> block" pre-fills the Question Recipe
//   Bell     → exam countdowns, week starts, pace and task nudges (each fires once)
// The AI writes FACTS from the syllabus (dates, weeks, exams) plus an "as of" snapshot. Anything time-dependent (current week,
// days to the exam, pace) is recomputed by the app from the dates every day, so the profile never silently goes stale.
// Sync: its own file in the Drive app-data folder (oword_student_profile.json), same sign-in as the Qbank library sync.
// ---------------------------------------------------------------------------
const LS_SP = "owordStudentProfile";           // { profile, updatedAt, clearedAt }
const LS_SP_FILE = "owordStudentProfileFile";  // { fileId, lastSync } of the Drive file below
const LS_SP_LEDGER = "owordNudgeLedger";       // { nudgeKey: firedAt } so each tutor notification fires once
const SP_FILE_NAME = "oword_student_profile.json";
const SP_TYPE = "oworld-student-profile";
const SP_STALE_DAYS = 14;
const SP_ASSESS_TYPES = ["exam", "quiz", "practical", "shelf", "assignment", "other"];
const SP_TASK_KINDS = ["qbank", "reading", "review", "exam", "other"];
const SP_STYLES = ["coach", "socratic", "direct"];
const SP_EVENT_TYPES = ["holiday", "break", "exam-period", "deadline", "class", "other"];
const SP_MEETING_TYPES = ["lecture", "lab", "small-group", "clinical", "review", "other"];
const SP_EVENT_TONE = { holiday: "blue", break: "blue", "exam-period": "red", deadline: "amber", class: "muted", other: "muted" };

// Readable reference (shown in the "JSON schema" panel). // comments are for humans only; the AI prompt uses the compact form below.
const PROFILE_SCHEMA_TEXT = `{
  "schema": "oworld-student-profile",          // always this exact string
  "v": 1,
  "student": {
    "name": "string | null",
    "program": "string | null",                // e.g. "MD, Year 1"
    "phase": "string | null",                  // e.g. "Preclinical", "Dedicated Step 1 prep"
    "targetExam": { "name": "USMLE Step 1", "date": "YYYY-MM-DD | null" }
  },
  "term": {
    "name": "Fall 2026",
    "startDate": "2026-08-24",                 // week 1 starts here; weeks are 7 days
    "endDate": "2026-12-11",
    "totalWeeks": 16,
    "asOf": "2026-10-15"                       // the day this profile was written
  },
  "courses": [                                 // one per syllabus: the curriculum map
    {
      "id": "short-slug",                      // unique, lowercase, used by assessments[].courseId
      "name": "Cardiovascular, Pulmonary & Renal",
      "code": "MED 5120 | null",
      "instructor": "Dr. Rivera | null",
      "syllabus": "CPR syllabus.pdf | null",   // the file this course was read from
      "meetings": [                            // the class schedule: one entry per distinct weekly pattern, else []
        {
          "type": "lecture | lab | small-group | clinical | review | other",
          "days": ["mon", "wed"],              // mon|tue|wed|thu|fri|sat|sun
          "start": "09:00", "end": "10:15",    // 24h
          "location": "Room 204 | null",
          "startDate": "2026-08-24 | null",    // only when the pattern applies to part of the term
          "endDate": "2026-10-09 | null",
          "except": ["2026-09-07"]             // dates this pattern does not meet (holiday, exam day, cancelled)
        }
      ],
      "weeks": [                               // from the syllabus: weeks that have teaching, short topics (leave breaks out)
        {
          "week": 7,
          "startDate": "2026-10-05 | null",
          "topics": ["Heart failure", "Antihypertensives"],     // one per lecture / session, as the syllabus words them
          "readings": ["Robbins Ch. 12"],
          "qbankFocus": ["Cardiovascular", "Pharmacology"]      // 1-3 organ systems / disciplines (matches Qbank subjects)
        }
      ]
    }
  ],
  "assessments": [                             // the exam schedule
    {
      "id": "cpr-midterm",
      "title": "CPR Midterm",
      "courseId": "short-slug | null",         // must match a courses[].id
      "type": "exam | quiz | practical | shelf | assignment | other",
      "date": "2026-10-22",
      "time": "09:00 | null",                  // 24h
      "durationMin": 120,
      "location": "Auditorium B | null",
      "weightPct": 25,
      "format": "80 MCQ | null",
      "coverage": ["Weeks 1-7"],               // scope in the document's own words
      "coverageWeeks": [1, 2, 3, 4, 5, 6, 7],  // the same scope as week numbers; the tutor maps it back to the syllabus weeks
      "qbankFocus": ["Cardiovascular", "Respiratory"],   // 1-4 subjects the exam tests
      "status": "upcoming | done"
    }
  ],
  "calendar": {                                // from the semester (academic) calendar; { "events": [] } if none was given
    "events": [
      {
        "id": "fall-break",
        "title": "Fall break",
        "type": "holiday | break | exam-period | deadline | class | other",
        "startDate": "2026-10-12",
        "endDate": "2026-10-13 | null",          // null for a one-day event
        "notes": "No classes | null"
      }
    ]
  },
  "currentState": {                            // the AI's read of "today"; the app recomputes week and countdowns itself
    "summary": "2-3 honest sentences",
    "currentWeek": 7,
    "thisWeek": { "focusTopics": ["Heart failure"], "goals": ["Finish 40 cardio questions"] },
    "nextAssessmentId": "cpr-midterm | null",
    "strengths": ["Renal physiology"],
    "gaps": ["Cardiac pharmacology"],
    "risk": "low | medium | high",
    "paceNote": "1 sentence"
  },
  "plan": {
    "weeklyQuestionTarget": 80,
    "dailyMinutes": 120,
    "tasks": [
      { "id": "t1", "title": "Cardio block, 20 Qs", "due": "2026-10-16 | null", "subject": "Cardiovascular | null", "kind": "qbank | reading | review | exam | other", "done": false }
    ]
  },
  "tutor": { "style": "coach | socratic | direct", "examCountdownDays": [7, 3, 1] },
  "source": { "documents": ["CPR syllabus.pdf (syllabus)", "Semester calendar.pdf (calendar)"], "confidence": "high | medium | low", "assumptions": ["Week 1 assumed to start Aug 24"] }
}`;

// Field-name/type skeleton used INSIDE the generated prompt (kept short on purpose, like PROMPT_SCHEMA_TEXT for Qbanks).
const PROFILE_PROMPT_SCHEMA = `{"schema":"oworld-student-profile","v":1,"student":{"name":"string|null","program":"string|null","phase":"string|null","targetExam":{"name":"string","date":"YYYY-MM-DD|null"}},"term":{"name":"string","startDate":"YYYY-MM-DD","endDate":"YYYY-MM-DD","totalWeeks":number,"asOf":"YYYY-MM-DD"},"calendar":{"events":[{"id":"short-slug","title":"string","type":"holiday|break|exam-period|deadline|class|other","startDate":"YYYY-MM-DD","endDate":"YYYY-MM-DD|null","notes":"string|null"}]},"assessments":[{"id":"short-slug","title":"string","courseId":"course id|null","type":"exam|quiz|practical|shelf|assignment|other","date":"YYYY-MM-DD","time":"HH:MM|null","durationMin":number|null,"location":"string|null","weightPct":number|null,"format":"string|null","coverage":["string"],"coverageWeeks":[number],"qbankFocus":["organ system or discipline"],"status":"upcoming|done"}],"currentState":{"summary":"string","currentWeek":number,"thisWeek":{"focusTopics":["string"],"goals":["string"]},"nextAssessmentId":"assessment id|null","strengths":["string"],"gaps":["string"],"risk":"low|medium|high","paceNote":"string"},"plan":{"weeklyQuestionTarget":number,"dailyMinutes":number,"tasks":[{"id":"short-slug","title":"string","due":"YYYY-MM-DD|null","subject":"string|null","kind":"qbank|reading|review|exam|other","priority":"high|normal|low","done":boolean}]},"tutor":{"style":"coach|socratic|direct","examCountdownDays":[7,3,1]},"source":{"documents":["string"],"confidence":"high|medium|low","assumptions":["string"]},"courses":[{"id":"short-slug","name":"string","code":"string|null","instructor":"string|null","syllabus":"file name|null","meetings":[{"type":"lecture|lab|small-group|clinical|review|other","days":["mon|tue|wed|thu|fri|sat|sun"],"start":"HH:MM|null","end":"HH:MM|null","location":"string|null","startDate":"YYYY-MM-DD|null","endDate":"YYYY-MM-DD|null","except":["YYYY-MM-DD"]}],"weeks":[{"week":number,"topics":["string"],"qbankFocus":["subject"]}]}]}`;

// ---- date helpers (all local-time, date-only) ----
const startOfDay = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
const dayDiff = (a, b) => Math.round((startOfDay(b) - startOfDay(a)) / 864e5);
const toISODate = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
function parseISODate(s) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(s || ""));
  if (!m) return null;
  const d = new Date(+m[1], +m[2] - 1, +m[3]);
  return d.getFullYear() === +m[1] && d.getMonth() === +m[2] - 1 && d.getDate() === +m[3] ? d : null;
}

// ---- tolerant normaliser (same spirit as the Qbank loader: accept what is clearly meant, never guess a date) ----
const spStr = (v, max = 300) => (typeof v === "string" || typeof v === "number" ? String(v).replace(/\s+/g, " ").trim().slice(0, max) : "");
const spList = (v, max = 40, len = 200) => (Array.isArray(v) ? v : typeof v === "string" && v.trim() ? [v] : []).map((x) => spStr(x, len)).filter(Boolean).slice(0, max);
const spInt = (v, lo, hi) => { if (v === null || v === undefined || v === "") return null; const n = Math.round(Number(v)); return Number.isFinite(n) && n >= lo && n <= hi ? n : null; };
function spDate(v) {
  const m = /^\s*(\d{4})-(\d{1,2})-(\d{1,2})/.exec(typeof v === "string" ? v : "");
  if (!m) return null;
  const iso = `${m[1]}-${m[2].padStart(2, "0")}-${m[3].padStart(2, "0")}`;
  return parseISODate(iso) ? iso : null;
}
// Dates the AI sometimes writes instead of ISO: 10/22/2026, Oct 22, 2026, 22 Oct 2026, Tue Oct 22 (year taken from the term when it is missing).
const SP_MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
function spDateLoose(v, termStart) {
  const iso = spDate(v); if (iso) return iso;
  if (typeof v !== "string") return null;
  const s = v.trim().replace(/^(mon|tue|wed|thu|fri|sat|sun)[a-z]*\.?,?\s+/i, "").replace(/(\d)(st|nd|rd|th)\b/gi, "$1").replace(/\s+/g, " ");
  const mon = (w) => SP_MONTHS.indexOf(String(w).slice(0, 3).toLowerCase()) + 1;
  let y = null; let mo = 0; let da = 0; let m;
  if ((m = /^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{2,4})$/.exec(s))) { mo = +m[1]; da = +m[2]; if (mo > 12) { const x = mo; mo = da; da = x; } y = +m[3] < 100 ? 2000 + +m[3] : +m[3]; }
  else if ((m = /^([A-Za-z]{3,9})\.?,? (\d{1,2}),? (\d{4})$/.exec(s))) { mo = mon(m[1]); da = +m[2]; y = +m[3]; }
  else if ((m = /^(\d{1,2}) ([A-Za-z]{3,9})\.?,? (\d{4})$/.exec(s))) { mo = mon(m[2]); da = +m[1]; y = +m[3]; }
  else if ((m = /^([A-Za-z]{3,9})\.?,? (\d{1,2})$/.exec(s))) { mo = mon(m[1]); da = +m[2]; }
  else if ((m = /^(\d{1,2})\/(\d{1,2})$/.exec(s))) { mo = +m[1]; da = +m[2]; }
  else return null;
  if (!mo || !da) return null;
  if (y === null) { // no year: the term's year, rolled to the next year when the date would fall long before the term starts
    if (!termStart) return null;
    y = termStart.getFullYear();
    const cand = new Date(y, mo - 1, da);
    if (dayDiff(termStart, cand) < -60) y += 1;
  }
  const iso2 = `${y}-${String(mo).padStart(2, "0")}-${String(da).padStart(2, "0")}`;
  return parseISODate(iso2) ? iso2 : null;
}
function spTime(v) {
  const m = /^\s*(\d{1,2}):(\d{2})/.exec(typeof v === "string" ? v : "");
  return m && +m[1] <= 23 && +m[2] <= 59 ? `${m[1].padStart(2, "0")}:${m[2]}` : null;
}
function spSlug(v, prefix, i, used) {
  const base = spStr(v, 60).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || `${prefix}${i + 1}`;
  let id = base; let n = 2;
  while (used.has(id)) id = `${base}-${n++}`;
  used.add(id);
  return id;
}
const spObj = (v) => (v && typeof v === "object" && !Array.isArray(v) ? v : {});

// -> { valid: true, data, warnings: [{ k, v }] } | { valid: false, error: i18nKey }. Warning / error texts are i18n keys.
const SP_DAYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"]; // index = Date.getDay()
function spMeetings(raw) {
  return (Array.isArray(raw) ? raw : []).slice(0, 14).map((m, i) => {
    const o = spObj(m);
    const dRaw = Array.isArray(o.days) ? o.days : (o.day != null ? [o.day] : []);
    const days = [...new Set(dRaw.map((d) => (typeof d === "number" ? (d >= 0 && d <= 6 ? Math.floor(d) : -1) : SP_DAYS.indexOf(String(d).trim().slice(0, 3).toLowerCase()))).filter((d) => d >= 0))].sort();
    if (!days.length) return null;
    const ty = String(o.type || o.kind || "").toLowerCase().replace(/[\s_]+/g, "-");
    return {
      id: spStr(o.id, 40) || `m${i + 1}`, days, start: spTime(o.start || o.startTime), end: spTime(o.end || o.endTime), location: spStr(o.location || o.room, 80) || null,
      type: SP_MEETING_TYPES.includes(ty) ? ty : null, startDate: spDate(o.startDate || o.from), endDate: spDate(o.endDate || o.to),
      except: (Array.isArray(o.except) ? o.except : []).map((x) => spDate(x)).filter(Boolean).slice(0, 80),
    };
  }).filter(Boolean);
}
// A weekly class pattern runs on a day when the weekday matches, the day is inside the pattern's own date range (if it has one) and isn't a listed exception.
function meetingRunsOn(m, d) {
  if (!m || !Array.isArray(m.days) || !m.days.includes(d.getDay())) return false;
  const iso = toISODate(d);
  if (m.startDate && iso < m.startDate) return false;
  if (m.endDate && iso > m.endDate) return false;
  return !(m.except && m.except.includes(iso));
}
function normalizeProfile(raw) {
  const parsed = tolerantParseJson(raw);
  if (!parsed.ok) return { valid: false, error: "spErrParse" };
  let v = parsed.value;
  if (Array.isArray(v)) v = v.find((x) => x && typeof x === "object" && !Array.isArray(x));
  const looksLike = (o) => !!o && typeof o === "object" && ["term", "courses", "assessments", "plan", "currentState", "student"].some((k) => o[k] != null);
  if (v && typeof v === "object" && !looksLike(v)) {
    const inner = v.profile || v.studentProfile || v.student_profile;
    if (looksLike(inner)) v = inner;
  }
  if (!looksLike(v)) return { valid: false, error: "spErrShape" };

  const warnings = [];
  if (parsed.truncated) warnings.push({ k: "spWarnTruncated", v: {} });
  const st = spObj(v.student); const te = spObj(st.targetExam); const tm = spObj(v.term); const cs = spObj(v.currentState);
  const th = spObj(cs.thisWeek); const pl = spObj(v.plan); const tu = spObj(v.tutor); const so = spObj(v.source);
  let dropped = 0; let noDate = 0; let calNoDate = 0; const noDateTitles = [];
  const tStart = parseISODate(spDateLoose(tm.startDate)) || null;
  const dt = (x) => spDateLoose(x, tStart);

  const usedC = new Set();
  const courses = (Array.isArray(v.courses) ? v.courses : []).slice(0, 30).map((c, i) => {
    const o = spObj(c); const name = spStr(o.name || o.title, 120);
    if (!name) { dropped++; return null; }
    const seen = new Set();
    const weeks = (Array.isArray(o.weeks) ? o.weeks : []).slice(0, 80).map((w, j) => {
      const x = spObj(w); const num = spInt(x.week != null ? x.week : x.number, 1, 80) || j + 1;
      if (seen.has(num)) return null;
      seen.add(num);
      return { week: num, startDate: spDate(x.startDate), topics: spList(x.topics, 20), readings: spList(x.readings, 20), qbankFocus: spList(x.qbankFocus || x.qbank_focus, 6, 60) };
    }).filter(Boolean).sort((a, b) => a.week - b.week);
    return { id: spSlug(o.id || name, "c", i, usedC), name, code: spStr(o.code, 30) || null, instructor: spStr(o.instructor || o.professor, 100) || null, syllabus: spStr(o.syllabus || o.source, 160) || null, priority: o.priority === true, meetings: spMeetings(o.meetings || o.schedule || o.classTimes), weeks };
  }).filter(Boolean);

  // An assessment's courseId may arrive as the AI wrote it ("CPR", "MED 5120", the course name): resolve it to a real courses[].id, else null.
  const courseIdOf = (raw) => {
    const s = spStr(raw, 80); if (!s) return null;
    const low = s.toLowerCase(); const slug = low.replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    const hit = courses.find((c) => c.id === slug) || courses.find((c) => c.code && c.code.toLowerCase() === low) || courses.find((c) => c.name.toLowerCase() === low);
    return hit ? hit.id : null;
  };
  const usedA = new Set();
  const assessments = (Array.isArray(v.assessments) ? v.assessments : []).slice(0, 120).map((a, i) => {
    const o = spObj(a); const title = spStr(o.title || o.name, 160);
    if (!title) { dropped++; return null; }
    const date = dt(o.date);
    if (!date) { noDate++; noDateTitles.push(title); return null; }
    const ty = String(o.type || "").toLowerCase(); const w = o.weightPct != null ? o.weightPct : o.weight;
    const wn = w === null || w === undefined || w === "" ? NaN : Number(w);
    return {
      id: spSlug(o.id || title, "a", i, usedA), title, courseId: courseIdOf(o.courseId || o.course), type: SP_ASSESS_TYPES.includes(ty) ? ty : "other",
      date, time: spTime(o.time), durationMin: spInt(o.durationMin != null ? o.durationMin : o.duration, 1, 1440), location: spStr(o.location || o.room, 80) || null,
      weightPct: Number.isFinite(wn) && wn >= 0 && wn <= 100 ? wn : null, coverage: spList(o.coverage, 30), format: spStr(o.format, 120) || null,
      coverageWeeks: [...new Set((Array.isArray(o.coverageWeeks) ? o.coverageWeeks : []).map((n) => spInt(n, 1, 80)).filter((n) => n !== null))].sort((x, y) => x - y),
      qbankFocus: spList(o.qbankFocus || o.qbank_focus, 6, 60),
      status: String(o.status || "").toLowerCase() === "done" ? "done" : "upcoming",
    };
  }).filter(Boolean).sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));

  const usedT = new Set();
  const tasks = (Array.isArray(pl.tasks) ? pl.tasks : []).slice(0, 80).map((k, i) => {
    const o = spObj(k); const title = spStr(o.title || o.name, 200);
    if (!title) { dropped++; return null; }
    const kind = String(o.kind || "").toLowerCase();
    return { id: spSlug(o.id || title, "t", i, usedT), title, due: spDate(o.due), subject: spStr(o.subject, 80) || null, kind: SP_TASK_KINDS.includes(kind) ? kind : "other", priority: ["high", "low"].includes(String(o.priority || "").toLowerCase()) ? String(o.priority).toLowerCase() : "normal", done: o.done === true, doneAt: o.done === true && Number(o.doneAt) > 0 ? Number(o.doneAt) : null, time: spTime(o.time), notes: spStr(o.notes, 200) || null };
  }).filter(Boolean);

  const usedE = new Set();
  const rawEvents = Array.isArray(v.calendar) ? v.calendar : spObj(v.calendar).events;
  const events = (Array.isArray(rawEvents) ? rawEvents : []).slice(0, 200).map((e, i) => {
    const o = spObj(e); const title = spStr(o.title || o.name, 160);
    if (!title) { dropped++; return null; }
    const startDate = dt(o.startDate || o.start || o.date);
    if (!startDate) { calNoDate++; return null; }
    let endDate = dt(o.endDate || o.end);
    if (endDate && endDate <= startDate) endDate = null; // a one-day event, or an end before the start
    const ty = String(o.type || "").toLowerCase().replace(/[\s_]+/g, "-");
    return { id: spSlug(o.id || title, "e", i, usedE), title, type: SP_EVENT_TYPES.includes(ty) ? ty : "other", startDate, endDate, notes: spStr(o.notes, 200) || null, time: spTime(o.time || o.startTime), endTime: spTime(o.endTime), repeat: ["daily", "weekly", "monthly"].includes(String(o.repeat || "").toLowerCase()) ? String(o.repeat).toLowerCase() : null, until: spDate(o.until) };
  }).filter(Boolean).sort((a, b) => (a.startDate < b.startDate ? -1 : a.startDate > b.startDate ? 1 : 0));

  const risk = String(cs.risk || "").toLowerCase(); const style = String(tu.style || "").toLowerCase();
  const cd = (Array.isArray(tu.examCountdownDays) ? tu.examCountdownDays : []).map((n) => spInt(n, 1, 60)).filter((n) => n !== null);
  const conf = String(so.confidence || "").toLowerCase();
  const data = {
    schema: SP_TYPE, v: 1,
    student: { name: spStr(st.name, 80) || null, program: spStr(st.program, 120) || null, phase: spStr(st.phase, 120) || null, targetExam: { name: spStr(te.name, 80) || null, date: spDate(te.date) } },
    term: { name: spStr(tm.name, 120), startDate: spDateLoose(tm.startDate), endDate: spDateLoose(tm.endDate), totalWeeks: spInt(tm.totalWeeks, 1, 80), asOf: spDateLoose(tm.asOf) },
    courses, assessments, calendar: { events },
    currentState: {
      summary: spStr(cs.summary, 800), currentWeek: spInt(cs.currentWeek, 1, 80), thisWeek: { focusTopics: spList(th.focusTopics, 12), goals: spList(th.goals, 12) },
      nextAssessmentId: spStr(cs.nextAssessmentId, 60) || null, strengths: spList(cs.strengths, 12), gaps: spList(cs.gaps, 12),
      risk: ["low", "medium", "high"].includes(risk) ? risk : null, paceNote: spStr(cs.paceNote, 300),
    },
    plan: { weeklyQuestionTarget: spInt(pl.weeklyQuestionTarget, 0, 2000), dailyMinutes: spInt(pl.dailyMinutes, 0, 1440), tasks },
    tutor: { style: SP_STYLES.includes(style) ? style : "coach", examCountdownDays: cd.length ? [...new Set(cd)].sort((a, b) => b - a) : [7, 3, 1] },
    source: { documents: spList(so.documents, 20, 160), confidence: ["high", "medium", "low"].includes(conf) ? conf : null, assumptions: spList(so.assumptions, 20, 300) },
  };
  if (!data.term.startDate) { // the AI left it out: week 1 = any dated week minus (week - 1) * 7 days (most common answer wins), else today's week from currentState + asOf
    const votes = new Map();
    courses.forEach((c) => c.weeks.forEach((w) => { const d = parseISODate(w.startDate); if (!d) return; d.setDate(d.getDate() - (w.week - 1) * 7); const k = toISODate(d); votes.set(k, (votes.get(k) || 0) + 1); }));
    const best = [...votes.entries()].sort((x, y) => y[1] - x[1])[0];
    if (best) data.term.startDate = best[0];
    else { const s = termStartOf(data); if (s) data.term.startDate = toISODate(s); }
  }
  if (noDate) warnings.push({ k: "spWarnDates", v: { n: noDate, titles: noDateTitles.slice(0, 5).join(", ") } });
  if (calNoDate) warnings.push({ k: "spWarnCalDates", v: { n: calNoDate } });
  if (dropped) warnings.push({ k: "spWarnDropped", v: { n: dropped } });
  if (!termStartOf(data)) warnings.push({ k: "spWarnNoStart", v: {} });
  return { valid: true, data, warnings };
}

// ---- derived "state of studies": recomputed from the dates every time, never trusted from the AI's snapshot ----
function termStartOf(p) {
  const tm = spObj(p && p.term);
  const s = parseISODate(tm.startDate);
  if (s) return s;
  const cw = p && p.currentState && p.currentState.currentWeek; const asOf = parseISODate(tm.asOf);
  if (cw > 0 && asOf) { const d = new Date(asOf); d.setDate(d.getDate() - (cw - 1) * 7); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return d; } // weeks run Monday to Sunday
  return null;
}
// Short names students and Qbanks use ("GI", "Heme/Onc", "MSK") are spelled out so they match the syllabus's full names.
const TOPIC_ALIASES = [[/\bgi\b/g, "gastrointestinal"], [/\bmsk\b/g, "musculoskeletal"], [/\b(hemo|heme)\b/g, "hematology"], [/\bonco\b/g, "oncology"], [/\bcardio\b/g, "cardiovascular"],
  [/\bneuro\b/g, "neurology"], [/\bpsych\b/g, "psychiatry"], [/\bderm\b/g, "dermatology"], [/\bpharm\b/g, "pharmacology"], [/\bmicro\b/g, "microbiology"], [/\bbiochem\b/g, "biochemistry"], [/\bpath\b/g, "pathology"]];
const normTopic = (s) => TOPIC_ALIASES.reduce((t, [re, to]) => t.replace(re, to), String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim());
function topicMatch(a, b) {
  const x = normTopic(a); const y = normTopic(b);
  if (!x || !y) return false;
  if (x === y) return true;
  if (Math.min(x.length, y.length) >= 4 && (x.includes(y) || y.includes(x))) return true;
  const ty = new Set(y.split(" ").filter((w) => w.length > 3));
  return x.split(" ").filter((w) => w.length > 3).some((w) => ty.has(w));
}
function weekContent(p, week) {
  const out = { topics: [], readings: [], qbankFocus: [], courses: [] };
  [...(p.courses || [])].sort((a, b) => (b.priority ? 1 : 0) - (a.priority ? 1 : 0)).forEach((c) => {
    const w = (c.weeks || []).find((x) => x.week === week);
    if (!w) return;
    out.courses.push(c.name);
    [["topics", w.topics], ["readings", w.readings], ["qbankFocus", w.qbankFocus]].forEach(([k, list]) => (list || []).forEach((s) => { if (!out[k].includes(s)) out[k].push(s); }));
  });
  return out;
}
// What an assessment covers, in the app's own terms: its qbankFocus, plus the topics and Qbank subjects of the weeks it lists (coverageWeeks).
function examScope(p, a) {
  const weeks = new Set(a.coverageWeeks || []); const out = { topics: [], qbankFocus: [] };
  const add = (list, v) => { if (v && !list.some((x) => normTopic(x) === normTopic(v))) list.push(v); };
  (a.qbankFocus || []).forEach((s) => add(out.qbankFocus, s));
  (p.courses || []).filter((c) => !a.courseId || c.id === a.courseId).forEach((c) => (c.weeks || []).forEach((w) => {
    if (!weeks.has(w.week)) return;
    (w.topics || []).forEach((s) => add(out.topics, s)); (w.qbankFocus || []).forEach((s) => add(out.qbankFocus, s));
  }));
  return out;
}
function studyStreak(log, now = new Date()) {
  const days = new Set((log || []).map((e) => new Date(e.finishedAt).toDateString()));
  let streak = 0; const d = new Date(now);
  if (!days.has(d.toDateString())) d.setDate(d.getDate() - 1);
  while (days.has(d.toDateString())) { streak += 1; d.setDate(d.getDate() - 1); }
  return streak;
}
// Compact Analytics summary: goes into the AI prompt (so strengths / gaps are grounded in real results) and feeds the tutor brief.
function buildStatsSnapshot(log, now = new Date()) {
  const list = Array.isArray(log) ? log : [];
  const ordered = [...list].sort((a, b) => b.finishedAt - a.finishedAt);
  const sum = (arr, f) => arr.reduce((n, e) => n + (Number(f(e)) || 0), 0);
  const ans = (e) => (e.answered != null ? e.answered : e.total);
  const answered = sum(list, ans); const correct = sum(list, (e) => e.correct);
  const wk = list.filter((e) => e.finishedAt >= now.getTime() - 7 * 864e5);
  const wkAns = sum(wk, ans);
  const subj = new Map();
  list.forEach((e) => (Array.isArray(e.bySubject) ? e.bySubject : []).forEach((x) => {
    const c = subj.get(x.subject) || { subject: x.subject, correct: 0, total: 0 };
    c.correct += Number(x.correct) || 0; c.total += Number(x.total) || 0; subj.set(x.subject, c);
  }));
  return {
    sessions: list.length, questionsAnswered: answered, accuracyPct: answered ? Math.round((correct / answered) * 100) : null, studyStreakDays: studyStreak(list, now),
    last7Days: { sessions: wk.length, questionsAnswered: wkAns, accuracyPct: wkAns ? Math.round((sum(wk, (e) => e.correct) / wkAns) * 100) : null },
    recentScores: ordered.slice(0, 10).reverse().map((e) => Number(e.pct) || 0),
    bySubject: [...subj.values()].filter((x) => x.total >= 3).sort((a, b) => b.total - a.total).slice(0, 15).map((x) => ({ subject: x.subject, correct: x.correct, total: x.total, pct: Math.round((x.correct / x.total) * 100) })),
  };
}

// Everything the Console card, the Library strip and the notifications need, in one place.
function tutorBrief(p, log, now = new Date()) {
  const today = startOfDay(now); const list = Array.isArray(log) ? log : [];
  const start = termStartOf(p); const tm = spObj(p.term);
  const maxWeek = Math.max(0, ...(p.courses || []).flatMap((c) => (c.weeks || []).map((w) => w.week)));
  const endD = parseISODate(tm.endDate);
  const total = tm.totalWeeks || (start && endD ? Math.max(1, Math.ceil((dayDiff(start, endD) + 1) / 7)) : 0) || maxWeek || 0;
  let phase = "unknown"; let week = null; let daysToStart = 0;
  if (start) {
    const d = dayDiff(start, today);
    if (d < 0) { phase = "before"; daysToStart = -d; }
    else { week = Math.floor(d / 7) + 1; phase = (total && week > total) || (endD && dayDiff(today, endD) < 0) ? "after" : "in"; }
  }
  const wk = phase === "in" ? weekContent(p, week) : { topics: [], readings: [], qbankFocus: [], courses: [] };
  let focus = wk.qbankFocus.length ? wk.qbankFocus : wk.topics.slice(0, 4);
  const cs = spObj(p.currentState);
  if (!focus.length && phase === "in" && cs.currentWeek === week) focus = (cs.thisWeek && cs.thisWeek.focusTopics) || [];

  const upcoming = (p.assessments || []).map((a) => ({ a, d: parseISODate(a.date) }))
    .filter((x) => x.d && x.a.status !== "done" && dayDiff(today, x.d) >= 0)
    .map((x) => ({ ...x.a, days: dayDiff(today, x.d) })).sort((x, y) => x.days - y.days);
  const next = upcoming[0] || null;
  const tasks = (spObj(p.plan).tasks || []);
  const tasksDue = tasks.filter((k) => !k.done && k.due && dayDiff(today, parseISODate(k.due) || today) <= 0 && parseISODate(k.due));

  let ws = new Date(today);
  if (phase === "in" && start) { ws = new Date(start); ws.setDate(ws.getDate() + (week - 1) * 7); } else ws.setDate(ws.getDate() - ((ws.getDay() + 6) % 7));
  const wsMs = startOfDay(ws).getTime();
  const answeredWeek = list.filter((e) => e.finishedAt >= wsMs).reduce((n, e) => n + (Number(e.answered != null ? e.answered : e.total) || 0), 0);
  const target = Number(spObj(p.plan).weeklyQuestionTarget) || 0;
  const dayIdx = Math.max(0, Math.min(6, dayDiff(ws, today)));
  const expected = (target * (dayIdx + 1)) / 7;
  let pace = "none";
  if (target && phase !== "before" && phase !== "after") pace = answeredWeek >= target ? "done" : answeredWeek >= expected ? "on" : dayIdx >= 2 && answeredWeek < expected * 0.6 ? "behind" : dayIdx >= 2 ? "slight" : "early";

  const subj = new Map();
  list.forEach((e) => (Array.isArray(e.bySubject) ? e.bySubject : []).forEach((x) => {
    const c = subj.get(x.subject) || { subject: x.subject, correct: 0, total: 0 };
    c.correct += Number(x.correct) || 0; c.total += Number(x.total) || 0; subj.set(x.subject, c);
  }));
  const weakInFocus = [...subj.values()].filter((x) => x.total >= 5).map((x) => ({ ...x, pct: Math.round((x.correct / x.total) * 100) }))
    .filter((x) => x.pct < 70 && focus.some((f) => topicMatch(f, x.subject))).sort((a, b) => a.pct - b.pct)[0] || null;

  const asOf = parseISODate(tm.asOf);
  const ageDays = asOf ? dayDiff(asOf, today) : null;
  const stale = ageDays !== null && ageDays >= SP_STALE_DAYS;
  // Study suggestions: when an assessment is within 14 days, the subjects it tests come first (weakest first, from the student's own results), then this week's focus.
  const examScopeNow = next && next.days <= 14 ? examScope(p, next) : null;
  const accOf = (f) => { const m = [...subj.values()].filter((x) => x.total >= 5 && topicMatch(f, x.subject)); const tot = m.reduce((n, x) => n + x.total, 0); return tot ? (m.reduce((n, x) => n + x.correct, 0) / tot) * 100 : 65; };
  const studyFocus = [];
  [...(examScopeNow ? [...examScopeNow.qbankFocus].sort((x, y) => accOf(x) - accOf(y)) : []), ...focus].forEach((f) => { if (f && !studyFocus.some((x) => topicMatch(x, f))) studyFocus.push(f); });
  // ---- richer context: today's classes and free windows, breaks and deadlines from the semester calendar, momentum, exam readiness ----
  const calEvents = Array.isArray(spObj(p.calendar).events) ? spObj(p.calendar).events : [];
  const evOn = (e, d) => { const s0 = parseISODate(e.startDate); if (!s0) return false; const en = parseISODate(e.endDate) || s0; return dayDiff(s0, d) >= 0 && dayDiff(d, en) >= 0; };
  const isOffEv = (e) => e.type === "holiday" || e.type === "break";
  const dayAt = (n) => new Date(today.getFullYear(), today.getMonth(), today.getDate() + n);
  const offOn = (d) => calEvents.find((e) => isOffEv(e) && evOn(e, d)) || null;
  const inTerm = (d) => !((start && dayDiff(start, d) < 0) || (endD && dayDiff(d, endD) < 0));
  const hmMin = (x) => { const m = /^(\d{2}):(\d{2})$/.exec(x || ""); return m ? +m[1] * 60 + +m[2] : null; };
  const classesOnDay = (d) => (!inTerm(d) || offOn(d) ? [] : (p.courses || []).flatMap((c) => (c.meetings || []).filter((m) => meetingRunsOn(m, d)).map((m) => ({
    id: `${c.id}-${m.id}`, name: c.name, start: m.start || null, end: m.end || null, location: m.location || null, s: hmMin(m.start), e: hmMin(m.end),
  }))).sort((x, y) => (x.s == null ? 1e9 : x.s) - (y.s == null ? 1e9 : y.s)));
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const hasMeetings = (p.courses || []).some((c) => (c.meetings || []).length > 0);
  const classesToday = classesOnDay(today);
  const classNow = classesToday.find((c) => c.s != null && c.e != null && c.s <= nowMin && nowMin < c.e) || null;
  const classNext = classesToday.find((c) => c.s != null && c.s > nowMin) || null;
  let classLater = null;
  if (!classNow && !classNext) for (let i = 1; i <= 7 && !classLater; i++) { const cl = classesOnDay(dayAt(i)); if (cl.length) classLater = { days: i, cls: cl[0] }; }
  // free study windows between today's timed classes (08:00 to 21:00, at least 45 min); about 1.5 min per question
  const busy = classesToday.filter((c) => c.s != null).map((c) => [c.s, c.e != null ? c.e : c.s + 60]).sort((x, y) => x[0] - y[0]);
  const windows = [];
  if (busy.length && phase === "in") {
    let cur = Math.max(Math.ceil(nowMin / 5) * 5, 480); const dayEnd = 1260;
    busy.forEach(([bs, be]) => { if (bs - cur >= 45) windows.push({ from: cur, to: Math.min(bs, dayEnd) }); cur = Math.max(cur, be); });
    if (dayEnd - cur >= 45) windows.push({ from: cur, to: dayEnd });
  }
  const freeNext = windows.map((w) => ({ ...w, qs: Math.min(80, Math.floor((w.to - w.from) / 1.5 / 10) * 10) })).find((w) => w.qs >= 10) || null;
  const offToday = offOn(today);
  let resumeDays = null;
  if (offToday) { let i = 1; while (i < 60 && offOn(dayAt(i))) i++; resumeDays = i; }
  const breakSoon = offToday ? null : calEvents.filter(isOffEv).map((e) => ({ ...e, days: dayDiff(today, parseISODate(e.startDate) || today) })).filter((e) => e.days >= 1 && e.days <= 10).sort((x, y) => x.days - y.days)[0] || null;
  const deadlines = calEvents.filter((e) => e.type === "deadline").map((e) => ({ ...e, days: dayDiff(today, parseISODate(e.startDate) || today) })).filter((e) => e.days >= 0 && e.days <= 14).sort((x, y) => x.days - y.days);
  const ansOf = (e) => Number(e.answered != null ? e.answered : e.total) || 0;
  const answeredToday = list.filter((e) => e.finishedAt >= today.getTime()).reduce((n, e) => n + ansOf(e), 0);
  const studiedToday = list.some((e) => e.finishedAt >= today.getTime());
  const streak = studyStreak(list, now);
  let todayGoal = 0;
  if (target && phase === "in") { const left = Math.max(0, target - (answeredWeek - answeredToday)); todayGoal = left ? Math.max(5, Math.ceil(left / Math.max(1, 7 - dayIdx) / 5) * 5) : 0; }
  const accData = (f) => { const m = [...subj.values()].filter((x) => x.total >= 5 && topicMatch(f, x.subject)); const tot = m.reduce((n, x) => n + x.total, 0); return tot ? { pct: Math.round((m.reduce((n, x) => n + x.correct, 0) / tot) * 100), total: tot } : null; };
  const readinessFor = (a) => {
    const sc = examScope(p, a);
    const topics = (sc.qbankFocus.length ? sc.qbankFocus : sc.topics.length ? sc.topics : (a.coverage || [])).slice(0, 8);
    if (!topics.length) return null;
    const rows = topics.map((tp) => { const d = accData(tp); return { topic: tp, pct: d ? d.pct : null, total: d ? d.total : 0 }; });
    const known = rows.filter((r) => r.pct != null); const tot = known.reduce((n, r) => n + r.total, 0);
    return { exam: a, rows, known: known.length, overall: tot ? Math.round(known.reduce((n, r) => n + r.pct * r.total, 0) / tot) : null };
  };
  const readiness = next && next.days <= 21 ? readinessFor(next) : null;
  const exams = upcoming.slice(0, 4).map((a) => ({ ...a, ready: a.days <= 60 ? readinessFor(a) : null }));
  const b = {
    phase, week, total, daysToStart, focus: focus.slice(0, 6), studyFocus: studyFocus.slice(0, 6), examScope: examScopeNow, wk, upcoming, next, tasksDue, answeredWeek, target, pace, dayIdx, weakInFocus, ageDays, stale,
    nowMin, hasMeetings, classesToday, classNow, classNext, classLater, freeNext, offToday, resumeDays, breakSoon, deadlines, answeredToday, studiedToday, streak, todayGoal, readiness, exams,
  };
  b.guidance = tutorGuidance(p, b);
  return b;
}
// Ordered, structured guidance lines (i18n key + vars + optional action). The Console card shows the first four.
function tutorGuidance(p, b) {
  const g = [];
  const block = b.studyFocus[0] ? { type: "focusBlock", value: b.studyFocus[0] } : { type: "library" };
  const rd = b.readiness; const weakest = rd ? rd.rows.filter((r) => r.pct != null).sort((x, y) => x.pct - y.pct)[0] : null;
  if (b.phase === "before") g.push({ key: "sgBefore", tone: "blue", vars: { n: b.daysToStart }, action: { type: "library" } });
  if (b.next && b.next.days <= 7) {
    if (b.next.days === 1) g.push({ key: "sgEve", tone: "red", vars: { title: b.next.title, n: 1 }, action: weakest ? { type: "focusBlock", value: weakest.topic } : block });
    else {
      const cover = ((b.next.coverage || []).length ? b.next.coverage : (b.examScope ? b.examScope.topics : [])).slice(0, 3).join(", ");
      g.push({ key: cover ? "sgExamCover" : "sgExam", tone: b.next.days <= 1 ? "red" : b.next.days <= 3 ? "amber" : "blue", vars: { title: b.next.title, n: b.next.days, coverage: cover }, action: block });
    }
  }
  (b.deadlines || []).filter((d) => d.days <= 3).slice(0, 1).forEach((d) => g.push({ key: "sgDeadline", tone: d.days <= 1 ? "red" : "amber", vars: { title: d.title, n: d.days } }));
  if (b.tasksDue.length) g.push({ key: "sgTasks", tone: "amber", vars: { n: b.tasksDue.length }, action: { type: "calendar" } });
  if (b.offToday && b.resumeDays) g.push({ key: "sgBreakNow", tone: "blue", vars: { title: b.offToday.title, n: b.resumeDays }, action: block });
  else if (b.breakSoon && b.breakSoon.days <= 7) g.push({ key: "sgBreakSoon", tone: "blue", vars: { title: b.breakSoon.title, n: b.breakSoon.days }, action: block });
  if (b.pace === "behind") g.push({ key: "sgPaceBehind", tone: "amber", vars: { a: b.answeredWeek, t: b.target }, action: block });
  else if (b.pace === "done") g.push({ key: "sgPaceDone", tone: "green", vars: { a: b.answeredWeek, t: b.target } });
  else if (b.pace === "on" && b.dayIdx >= 2) g.push({ key: "sgPaceOn", tone: "green", vars: { a: b.answeredWeek, t: b.target } });
  if (b.weakInFocus) g.push({ key: "sgWeak", tone: "amber", vars: { subject: b.weakInFocus.subject, pct: b.weakInFocus.pct }, action: { type: "focusBlock", value: b.weakInFocus.subject } });
  const untested = rd ? rd.rows.filter((r) => r.pct == null) : [];
  if (rd && rd.rows.length >= 2 && untested.length && rd.exam.days <= 14) g.push({ key: "sgUntested", tone: "blue", vars: { n: untested.length, total: rd.rows.length, title: rd.exam.title }, action: { type: "focusBlock", value: untested[0].topic } });
  if (b.streak > 0 && !b.studiedToday && b.nowMin >= 16 * 60) g.push({ key: "sgStreak", tone: "amber", vars: { n: b.streak }, action: block });
  if (b.phase === "in" && !b.focus.length) g.push({ key: "sgNoFocus", tone: "muted", vars: {}, action: { type: "profile" } });
  if (b.stale) g.push({ key: "sgStale", tone: "muted", vars: { n: b.ageDays }, action: { type: "profile" } });
  return g;
}
// Notifications the tutor wants to send right now. `key` is the once-only ledger key (see useTutorNudges).
function tutorNudges(p, b, now = new Date()) {
  const out = []; const tm = spObj(p.term);
  const termKey = hashStr(`${tm.name || ""}|${tm.startDate || ""}|${spObj(p.currentState).currentWeek || ""}`);
  const bands = [...new Set([0, 1, ...(spObj(p.tutor).examCountdownDays || [7, 3, 1])])].sort((x, y) => x - y);
  b.upcoming.forEach((a) => {
    const band = bands.find((n) => a.days <= n);
    if (band === undefined) return;
    const kind = a.days === 0 ? "examToday" : a.days === 1 ? "examTomorrow" : "examSoon";
    out.push({ key: `exam:${a.id}:${a.date}:${band}`, kind, tone: a.days <= 1 ? "red" : a.days <= 3 ? "amber" : "blue", vars: { title: a.title, days: a.days } });
  });
  if (b.breakSoon && b.breakSoon.days === 1) out.push({ key: `break:${b.breakSoon.id}:${b.breakSoon.startDate}`, kind: "breakSoon", tone: "blue", vars: { title: b.breakSoon.title } });
  (b.deadlines || []).filter((d) => d.days <= 3).forEach((d) => out.push({ key: `deadline:${d.id}:${d.startDate}:${d.days === 0 ? 0 : d.days <= 1 ? 1 : 3}`, kind: d.days === 0 ? "deadlineToday" : "deadlineSoon", tone: d.days <= 1 ? "red" : "amber", vars: { title: d.title, days: d.days } }));
  if (b.phase === "in" && b.week) out.push({ key: `week:${termKey}:${b.week}`, kind: "weekStart", tone: "blue", vars: { week: b.week, total: b.total || b.week, topics: (b.focus.length ? b.focus : b.wk.topics).slice(0, 3).join(", ") || "—" } });
  if (b.phase === "before" && b.daysToStart <= 3) out.push({ key: `termstart:${termKey}`, kind: "termStart", tone: "blue", vars: { days: b.daysToStart } });
  if (b.pace === "behind" && b.dayIdx >= 3) out.push({ key: `pace:${termKey}:${b.week || "x"}`, kind: "paceBehind", tone: "amber", vars: { a: b.answeredWeek, t: b.target } });
  if (b.tasksDue.length) out.push({ key: `tasks:${toISODate(now)}`, kind: "tasksDue", tone: "amber", vars: { n: b.tasksDue.length } });
  if (b.stale) out.push({ key: `stale:${toISODate(startOfDay(new Date(now.getTime() - ((now.getDay() + 6) % 7) * 864e5)))}`, kind: "profileStale", tone: "muted", vars: { n: b.ageDays } });
  return out;
}

// ---- the AI prompt: same idea as buildQuestionRecipe, but it outputs the student's profile ----
function buildProfileRecipe({ lang, today, stats, existing, career }) {
  const parts = [];
  parts.push(`You are building a Study Profile for OWORLD, a USMLE study app. I will attach some or all of these: course syllabi, my semester (academic) calendar, my class timetable and my exam schedule (PDF, screenshot or pasted text). Read every one of them, plus anything I paste below, and reply with ONLY valid JSON (no markdown, no commentary) matching this schema:\n${PROFILE_PROMPT_SCHEMA}`);
  parts.push(`Today is ${today}. Week 1 starts on term.startDate and weeks are 7 days; compute currentState.currentWeek from that. Dates are ISO YYYY-MM-DD, times are 24h HH:MM (convert AM/PM).`);
  parts.push([
    "GROUND RULES",
    "- Use ONLY what my documents say. Never invent dates, exams, weights, rooms, times or topics. Unknown value: null (or [] for lists). Every guess or inference: add one short sentence to source.assumptions.",
    "- DATES: copy every date exactly as the document gives it, written YYYY-MM-DD (take the year from the term when the document leaves it out). If a document gives only a week number (with or without a weekday), compute the date: term.startDate + (week - 1) * 7 days, plus the weekday offset, and add that to source.assumptions. Whenever a document names a weekday together with a date, check that your ISO date really falls on that weekday; if it does not, re-read the document before answering.",
    "- Never leave an exam out because its date is unclear. Use date null only when the documents give neither a date nor a week, and say which exam in source.assumptions.",
    "- Every id is a short unique lowercase slug. assessments[].courseId must equal a courses[].id (null for an exam that spans courses).",
    "- If something is unreadable, cut off or ambiguous in a document, say so in source.assumptions instead of filling the gap.",
    "- LENGTH: my app can only load a COMPLETE reply, so keep it compact. Output the keys in exactly the order of the schema (courses last), as minified JSON with no indentation. Per syllabus week write at most 4 short topics and no readings. Keep every note and assumption short. If you are running out of room, stop at the end of a complete week inside courses[].weeks; never cut an item in half, and never drop term, calendar, assessments, currentState or plan to make room.",
    "- term.startDate is required: the first day of week 1 (the first day of classes) from the calendar or syllabi. Only if no document states it, derive it from a dated lecture or exam and say so in source.assumptions.",
    "- SUBJECTS: wherever the schema asks for qbankFocus or a subject, use these names exactly so the app can match my Qbanks: Cardiovascular, Respiratory, Renal, Gastrointestinal, Endocrine, Reproductive, Neurology, Psychiatry, Musculoskeletal, Dermatology, Hematology/Oncology, Immunology, Anatomy, Physiology, Biochemistry, Pathology, Pharmacology, Microbiology, Genetics, Behavioral Science, Biostatistics, Ethics.",
  ].join("\n"));
  parts.push([
    "STEP 1 - INVENTORY THE DOCUMENTS",
    "Decide what each attachment is: a syllabus (one course each), the semester calendar, a class timetable, an exam schedule, or other. List every one in source.documents as 'file name (role)'. Build one courses[] entry per syllabus and put its file name in courses[].syllabus and its instructor in courses[].instructor.",
  ].join("\n"));
  parts.push([
    "STEP 2 - WHICH DOCUMENT WINS WHEN THEY DISAGREE",
    "- Term dates, breaks, holidays, add/drop and other deadlines: the semester calendar.",
    "- Class days, times, rooms and session types: the class timetable, then the syllabus.",
    "- Exam and quiz dates, times, rooms, durations, formats and scope: the exam schedule if I attached one, otherwise the syllabus, then the calendar. Weights: the syllabus grading section.",
    "- Weekly topics: the syllabus. I am NOT sending my school's overall curriculum, so do not add anything beyond my syllabi.",
    "Add every disagreement you resolved (what each document said and which you used) to source.assumptions.",
  ].join("\n"));
  parts.push([
    "STEP 3 - TERM AND SEMESTER CALENDAR (term, calendar.events)",
    "- term.name, startDate, endDate and totalWeeks come from the semester calendar when it states them, otherwise from the syllabi.",
    "- calendar.events: every dated item that changes my study time: holidays, breaks, reading and exam periods, add/drop, withdrawal and registration deadlines, orientation, classes resuming, finals week. type is holiday, break, exam-period, deadline, class or other. A one-day event has endDate null.",
    "- Do NOT list ordinary lectures. List exam PERIODS here but each individual exam in assessments, not both. If I attached no semester calendar use [] and say so in source.assumptions.",
  ].join("\n"));
  parts.push([
    "STEP 4 - SYLLABI (courses[].weeks)",
    "- One entry per syllabus week that has teaching, in order; leave out weeks with no teaching (breaks, exam weeks). If a syllabus is organized by date instead of week, convert each date to its week number from term.startDate.",
    "- topics: at most 4 short items per week, in the syllabus's own words (group lectures by theme; do not list every lecture). qbankFocus: 1-3 subjects from the SUBJECTS list that the week's topics belong to.",
    "- Do not copy readings, objectives or policies.",
  ].join("\n"));
  parts.push([
    "STEP 5 - CLASS SCHEDULE (courses[].meetings)",
    "- One entry per distinct weekly pattern: type (lecture, lab, small-group for PBL/TBL/case sessions, clinical, review or other), days, start, end, location. Use [] when neither the timetable nor the syllabus gives times; never guess a missing end time (null).",
    "- If a pattern applies to only part of the term, or changes mid-term, use separate entries and set startDate and endDate on each. Dates a normal class does NOT meet (holiday, exam day, cancelled session) go in that entry's except list.",
    "- Never put an exam in meetings; it belongs in assessments.",
  ].join("\n"));
  parts.push([
    "STEP 6 - EXAM SCHEDULE (assessments)",
    "- One entry for every exam, quiz, practical, shelf, assignment and other graded date. A makeup or retake is its own entry and its title says so. Exams or graded dates that appear only on the calendar still go here.",
    "- Fill date, time, durationMin, location, format (e.g. 80 MCQ), weightPct and courseId. If a document gives only a window, use the due or last date.",
    "- coverage: the scope in the document's own words, short. coverageWeeks: the same scope as syllabus week numbers, e.g. [1,2,3,4,5,6,7]; a cumulative exam lists every week taught up to it; [] if you cannot tell. qbankFocus: 1-4 subjects that the exam tests, from the SUBJECTS list. This is what my tutor uses to suggest what to study, so always fill it.",
    `- status is 'done' only if the date is before ${today}.`,
  ].join("\n"));
  parts.push([
    "STEP 7 - WHERE I AM TODAY (currentState, plan)",
    "- currentState: summary (2-3 honest sentences), thisWeek.focusTopics = what THIS week of the syllabi covers, as 2-5 short items using SUBJECTS names where they fit (this week only), thisWeek.goals, nextAssessmentId (the soonest upcoming assessment by date), strengths and gaps (grounded in my stats if given), risk (low/medium/high), paceNote (1 sentence).",
    "- plan: weeklyQuestionTarget (integer) and dailyMinutes sized to what is realistic around my class hours and the next assessment; lighter in break weeks. tasks = concrete actions for the next 7 days, each with a due date.",
    "- If an assessment is within 14 days, the tasks work through its qbankFocus, weakest subject first (use my stats if given), and end with a light review the day before. Do not schedule tasks on holidays or break days, and none on an exam day other than the exam itself.",
    "- tutor.style is 'coach' unless I say otherwise; examCountdownDays [7,3,1]. source.confidence: how complete and legible the documents were.",
  ].join("\n"));
  parts.push([
    "STEP 8 - CHECK BEFORE YOU REPLY",
    "- Every assessments[].courseId exists in courses[]. nextAssessmentId points to a real assessment. Ids are unique. No week number is above term.totalWeeks, and totalWeeks matches term.startDate to term.endDate.",
    "- No class meeting, exam or task falls on a holiday or break unless a document says so. If one does, re-read the document and note it in source.assumptions.",
  ].join("\n"));
  if (career) parts.push(`ABOUT ME (I entered this in the app, so treat it as true and do not list it as an assumption). Use it for student.program, student.phase and student.targetExam: phase is the stage that matches my current studies; targetExam is my soonest USMLE exam that has a date, otherwise the earliest exam listed.\n${career}`);
  if (stats) parts.push(`My current OWORLD study stats (use them for strengths, gaps, pace and the order of study tasks):\n${JSON.stringify(stats)}`);
  if (existing) parts.push(`UPDATE MODE. This is my current profile. Keep every id and every task's done flag. Treat the attached documents as newer: change a course, week, class meeting, assessment or calendar event only where a document says something different about it (match by id, then by title or code), keep everything else, and add anything new. Mark assessments 'done' once their date has passed. Refresh term.asOf, currentState and plan for today. If I attach nothing new, only refresh currentState and plan.\n${JSON.stringify(existing)}`);
  if (lang === "es") parts.push("Write every free-text value in Spanish. Keep all keys and enum values (low/medium/high, exam/quiz, lecture/lab, etc.) and the qbankFocus subject names in English.");
  parts.push("If something is missing, still return valid JSON with null or [] for that field. Reply with the JSON only.");
  return parts.join("\n\n");
}

// ---- state: one profile per student. `updatedAt` / `clearedAt` let two devices agree on the newest edit and on a deletion. ----
const ProfileContext = createContext({
  profile: null, updatedAt: 0, setProfile: () => {}, toggleTask: () => {}, addTask: () => {}, removeTask: () => {}, updateCourses: () => {}, updateAssessment: () => {}, removeAssessment: () => {}, clear: () => {}, wipe: () => {}, applyMerged: () => {}, getState: () => ({}),
  sync: { available: false, status: "idle", lastSync: 0, syncNow: () => {} }, pendingFocus: null, seedFocus: () => {}, consumeFocus: () => {},
  bpStore: { bp: null, save: () => {}, sync: { available: false, status: "idle", lastSync: 0, syncNow: () => {} } },
});
// An exam is tethered to its course by id, so renaming the class (calendar editor) renames it everywhere: tutor, calendar, planner.
const spCourseOf = (p, id) => (id && p && Array.isArray(p.courses) ? p.courses.find((c) => c.id === id) || null : null);
const spCore = (m) => hashStr(JSON.stringify({ p: m.profile, u: m.updatedAt, c: m.clearedAt }));
const validStoredProfile = (p) => !!p && typeof p === "object" && p.schema === SP_TYPE && Array.isArray(p.courses) && Array.isArray(p.assessments) && p.plan && Array.isArray(p.plan.tasks);

// Newest edit wins as a whole; a task ticked on either device stays ticked; a deletion beats any older edit.
function mergeProfileState(local, remote) {
  const r = remote && typeof remote === "object" ? remote : {};
  const L = { profile: validStoredProfile(local.profile) ? local.profile : null, updatedAt: Number(local.updatedAt) || 0, clearedAt: Number(local.clearedAt) || 0 };
  const R = { profile: validStoredProfile(r.profile) ? r.profile : null, updatedAt: Number(r.updatedAt) || 0, clearedAt: Number(r.clearedAt) || 0 };
  const clearedAt = Math.max(L.clearedAt, R.clearedAt);
  const newer = R.updatedAt > L.updatedAt ? R : L; const older = newer === R ? L : R;
  let profile = newer.profile;
  if (profile && newer.updatedAt <= clearedAt) profile = null;
  if (profile && older.profile) {
    const doneIds = new Set(older.profile.plan.tasks.filter((k) => k.done).map((k) => k.id));
    if (profile.plan.tasks.some((k) => !k.done && doneIds.has(k.id))) {
      profile = { ...profile, plan: { ...profile.plan, tasks: profile.plan.tasks.map((k) => (doneIds.has(k.id) ? { ...k, done: true } : k)) } };
    }
  }
  return { profile, updatedAt: Math.max(L.updatedAt, R.updatedAt), clearedAt };
}

function useStudentProfile() {
  const [state, setState] = useState(() => {
    const v = lsGet(LS_SP);
    return v && typeof v === "object" ? { profile: validStoredProfile(v.profile) ? v.profile : null, updatedAt: Number(v.updatedAt) || 0, clearedAt: Number(v.clearedAt) || 0 } : { profile: null, updatedAt: 0, clearedAt: 0 };
  });
  const ref = useRef(state);
  useEffect(() => { lsSet(LS_SP, JSON.stringify(state)); }, [state]);
  const commit = (next) => { ref.current = next; setState(next); };
  // A freshly loaded profile replaces the old one, but tasks the student already ticked (same id) stay ticked.
  const setProfile = useCallback((p) => {
    const cur = ref.current; const now = Date.now();
    const done = new Set(((cur.profile && cur.profile.plan.tasks) || []).filter((k) => k.done).map((k) => k.id));
    let profile = done.size ? { ...p, plan: { ...p.plan, tasks: p.plan.tasks.map((k) => (done.has(k.id) ? { ...k, done: true } : k)) } } : p;
    // exams/events ticked from the Console calendar ("cal-") and items the student added ("usr-") live in the plan; keep them across a reload
    const have = new Set(profile.plan.tasks.map((k) => k.id));
    const carry = ((cur.profile && cur.profile.plan.tasks) || []).filter((k) => /^(cal|usr)-/.test(String(k.id)) && !have.has(k.id));
    if (carry.length) profile = { ...profile, plan: { ...profile.plan, tasks: [...profile.plan.tasks, ...carry] } };
    // class times the student edited survive a re-import: keep them when the new profile has none for that course, and keep classes they added
    const oldC = (cur.profile && cur.profile.courses) || [];
    if (oldC.length) {
      const ids = new Set(profile.courses.map((c) => c.id));
      profile = { ...profile, courses: [
        ...profile.courses.map((c) => {
          const o = oldC.find((x) => x.id === c.id)
            || oldC.find((x) => !String(x.id).startsWith("usr-") && ((x.code && c.code && normTopic(x.code) === normTopic(c.code)) || normTopic(x.name) === normTopic(c.name))); // same class under a new id
          let base = o && o.priority ? { ...c, priority: true } : c;
          if (o && o.nameEdited && o.name) base = { ...base, name: o.name, nameEdited: true }; // the student's own class name wins over the AI's
          return o && (!c.meetings || !c.meetings.length) && o.meetings && o.meetings.length ? { ...base, meetings: o.meetings } : base;
        }),
        ...oldC.filter((c) => String(c.id).startsWith("usr-") && !ids.has(c.id)),
      ] };
    }
    // exam dates the student corrected survive a re-import (matched by id)
    const fixed = ((cur.profile && cur.profile.assessments) || []).filter((x) => x.edited);
    if (fixed.length) profile = { ...profile, assessments: profile.assessments.map((x) => { const o = fixed.find((e) => e.id === x.id && (e.titleEdited || normTopic(e.title) === normTopic(x.title))); return o ? { ...x, date: o.date, time: o.time, status: o.status, edited: true, ...(o.titleEdited ? { title: o.title, titleEdited: true } : {}), ...(o.courseEdited ? { courseId: o.courseId || null, courseEdited: true } : {}) } : x; }).sort((p, q) => (p.date < q.date ? -1 : p.date > q.date ? 1 : 0)) };
    // what the student added by hand in the calendar (ids start with usr-) survives a re-import
    if (cur.profile) {
      const oc = cur.profile; const keep = (old, fresh) => [...fresh, ...(old || []).filter((x) => String(x.id).startsWith("usr-") && !fresh.some((y) => y.id === x.id))];
      profile = { ...profile, calendar: { ...profile.calendar, events: keep((oc.calendar || {}).events, (profile.calendar || {}).events || []).sort((x, y) => (x.startDate < y.startDate ? -1 : x.startDate > y.startDate ? 1 : 0)) },
        plan: { ...profile.plan, tasks: keep((oc.plan || {}).tasks, (profile.plan || {}).tasks || []) }, assessments: keep(oc.assessments, profile.assessments || []).sort((x, y) => (x.date < y.date ? -1 : x.date > y.date ? 1 : 0)) };
    }
    commit({ profile, updatedAt: now, clearedAt: cur.clearedAt });
  }, []);
  const toggleTask = useCallback((id) => {
    const cur = ref.current; if (!cur.profile) return;
    commit({ ...cur, updatedAt: Date.now(), profile: { ...cur.profile, plan: { ...cur.profile.plan, tasks: cur.profile.plan.tasks.map((k) => (k.id === id ? { ...k, done: !k.done, doneAt: !k.done ? Date.now() : null } : k)) } } });
  }, []);
  // A scheduled exam/event ticked from the calendar becomes a real plan task (same id = never duplicated).
  const addTask = useCallback((task) => {
    const cur = ref.current; if (!cur.profile || cur.profile.plan.tasks.some((k) => k.id === task.id)) return;
    commit({ ...cur, updatedAt: Date.now(), profile: { ...cur.profile, plan: { ...cur.profile.plan, tasks: [...cur.profile.plan.tasks, task] } } });
  }, []);
  // The student corrects an exam the AI got wrong (date, time, already happened). `edited` keeps the fix when the profile is re-imported.
  const updateAssessment = useCallback((id, patch) => {
    const cur = ref.current; if (!cur.profile) return;
    const assessments = cur.profile.assessments.map((a) => (a.id === id ? { ...a, ...patch, edited: true } : a)).sort((x, y) => (x.date < y.date ? -1 : x.date > y.date ? 1 : 0));
    commit({ ...cur, updatedAt: Date.now(), profile: { ...cur.profile, assessments } });
  }, []);
  const removeAssessment = useCallback((id) => {
    const cur = ref.current; if (!cur.profile) return;
    commit({ ...cur, updatedAt: Date.now(), profile: { ...cur.profile, assessments: cur.profile.assessments.filter((a) => a.id !== id) } });
  }, []);
  const updateCourses = useCallback((courses) => {
    const cur = ref.current; if (!cur.profile) return;
    const live = new Set(courses.map((c) => c.id));
    const assessments = (cur.profile.assessments || []).map((a) => (a.courseId && !live.has(a.courseId) ? { ...a, courseId: null } : a));
    commit({ ...cur, updatedAt: Date.now(), profile: { ...cur.profile, courses, assessments } });
  }, []);
  const removeTask = useCallback((id) => {
    const cur = ref.current; if (!cur.profile) return;
    commit({ ...cur, updatedAt: Date.now(), profile: { ...cur.profile, plan: { ...cur.profile.plan, tasks: cur.profile.plan.tasks.filter((k) => k.id !== id) } } });
  }, []);
  // The calendar's editor: replaces the lists it changed (events, tasks, exams) in one step, so an undo restores all of them together.
  const setCal = useCallback((patch) => {
    const cur = ref.current; if (!cur.profile) return; const pr = cur.profile;
    commit({ ...cur, updatedAt: Date.now(), profile: { ...pr, calendar: { ...pr.calendar, events: patch.events || (pr.calendar && pr.calendar.events) || [] }, plan: { ...pr.plan, tasks: patch.tasks || pr.plan.tasks }, assessments: patch.assessments || pr.assessments } });
  }, []);
  const clear = useCallback(() => { const now = Date.now(); commit({ profile: null, updatedAt: now, clearedAt: now }); }, []);
  // "Reset all data": local only, no tombstone, so Drive keeps its copy and reconnecting restores it.
  const wipe = useCallback(() => { ref.current = { profile: null, updatedAt: 0, clearedAt: 0 }; setState(ref.current); lsRemove(LS_SP); lsRemove(LS_SP_FILE); lsRemove(LS_SP_LEDGER); }, []);
  const applyMerged = useCallback((m) => { if (spCore(m) !== spCore(ref.current)) commit(m); }, []);
  const getState = useCallback(() => ref.current, []);
  return { profile: state.profile, updatedAt: state.updatedAt, clearedAt: state.clearedAt, setProfile, toggleTask, addTask, removeTask, updateCourses, setCal, updateAssessment, removeAssessment, clear, wipe, applyMerged, getState };
}

// Google Drive sync for the profile: own file, same sign-in and token as the library sync, same pull → merge → push cycle as the Database.
function useProfileSync({ drive, store }) {
  const { configured, linked, acquireToken, peekToken } = drive;
  const latest = useRef({}); latest.current = { getState: store.getState, applyMerged: store.applyMerged };
  const fileRef = useRef((lsGet(LS_SP_FILE) || {}).fileId || null);
  const modRef = useRef(null); const running = useRef(false); const rerun = useRef(false);
  const linkedRef = useRef(linked); linkedRef.current = linked;
  const [status, setStatus] = useState("idle"); // idle | busy | done | error
  const [lastSync, setLastSync] = useState((lsGet(LS_SP_FILE) || {}).lastSync || 0);

  const run = useCallback(async ({ interactive = false } = {}) => {
    if (!configured || !linkedRef.current) return;
    if (running.current) { rerun.current = true; return; }
    running.current = true; setStatus("busy");
    try {
      const token = await acquireToken({ interactive });
      if (!token) { setStatus("idle"); return; }
      let fileId = fileRef.current; let remote = null;
      if (fileId) { try { remote = await driveDownload(token, fileId); } catch (e) { if (e.status === 404) fileId = null; else throw e; } }
      if (!fileId) { fileId = await driveFindSyncFile(token, SP_FILE_NAME); if (fileId) remote = await driveDownload(token, fileId); }
      const cur = latest.current.getState();
      const merged = mergeProfileState(cur, remote);
      latest.current.applyMerged(merged);
      const remoteMerged = remote ? mergeProfileState({ profile: null, updatedAt: 0, clearedAt: 0 }, remote) : null;
      if (!fileId || !remoteMerged || spCore(merged) !== spCore(remoteMerged)) {
        const payload = JSON.stringify({ v: 1, app: "oworld", type: SP_TYPE, updatedAt: merged.updatedAt, clearedAt: merged.clearedAt, profile: merged.profile });
        fileId = await driveUpload(token, fileId, payload, SP_FILE_NAME);
      }
      fileRef.current = fileId;
      try { modRef.current = await driveModified(token, fileId); } catch (e) { /* the next poll just does a full sync */ }
      const now = Date.now();
      lsSet(LS_SP_FILE, JSON.stringify({ fileId, lastSync: now }));
      setLastSync(now); setStatus("done");
    } catch (e) { setStatus("error"); }
    finally { running.current = false; if (rerun.current) { rerun.current = false; setTimeout(() => run(), 0); } }
  }, [configured, acquireToken]);

  useEffect(() => { if (configured && linked && drive.status === "done") run(); }, [configured, linked, drive.status]); // eslint-disable-line
  useEffect(() => { if (!linked) { fileRef.current = null; modRef.current = null; lsRemove(LS_SP_FILE); setStatus("idle"); setLastSync(0); } }, [linked]);
  const first = useRef(true);
  useEffect(() => {
    if (first.current) { first.current = false; return undefined; }
    if (!linked) return undefined;
    const id = setTimeout(() => run(), 3000);
    return () => clearTimeout(id);
  }, [store.updatedAt, store.clearedAt, linked, run]);
  const poll = useCallback(async () => {
    const tk = peekToken();
    if (!configured || !linkedRef.current || running.current || !fileRef.current || !tk) return;
    try { const mod = await driveModified(tk, fileRef.current); if (mod && modRef.current && mod !== modRef.current) run(); } catch (e) { /* ignore */ }
  }, [configured, peekToken, run]);
  useEffect(() => {
    if (!configured) return undefined;
    const onVis = () => { if (document.visibilityState === "visible") poll(); };
    const id = setInterval(() => { if (document.visibilityState === "visible") poll(); }, 45000);
    document.addEventListener("visibilitychange", onVis);
    return () => { clearInterval(id); document.removeEventListener("visibilitychange", onVis); };
  }, [configured, poll]);
  return { available: !!(configured && linked), status, lastSync, syncNow: () => run({ interactive: true }) };
}

// The tutor's notifications. Checked when the profile or the Analytics change, when the tab comes back, and hourly (so a new day is noticed).
// Each nudge fires ONCE (ledger in localStorage); the bell only shows what is new.
// iOS Safari zooms the whole page when a text field under 16px gets focus. On touch screens, lift form fields to 16px (pinch-zoom stays
// available for accessibility) and add a few native-app touch behaviours: no double-tap zoom delay, no grey tap flash, no text auto-inflation.
function useNativeFeel() {
  useEffect(() => {
    const id = "oworld-native-feel";
    if (document.getElementById(id)) return undefined;
    // The page must be laid out at the device width and never be locked to a zoom level. A viewport tag with maximum-scale / user-scalable=no
    // (or a missing one) is what makes a phone render the app wider than the screen with no way to pinch it back. Input zoom is prevented by
    // the 16px field rule below instead, so pinch-zoom stays available.
    let meta = document.querySelector('meta[name="viewport"]');
    if (!meta) { meta = document.createElement("meta"); meta.name = "viewport"; document.head.appendChild(meta); }
    meta.setAttribute("content", "width=device-width, initial-scale=1, viewport-fit=cover");
    const el = document.createElement("style");
    el.id = id;
    el.textContent = `
      html { -webkit-text-size-adjust: 100%; text-size-adjust: 100%; }
      html, body { max-width: 100%; overflow-x: hidden; overflow-x: clip; }
      /* A single-column grid with no column template sizes its column to its widest child's minimum width, so one long unbroken label can
         stretch the whole page past the screen. Give those grids a column that is allowed to shrink. */
      [style*="display: grid"]:not([style*="grid-template-columns"]):not([style*="grid-auto-flow"]):not([style*="grid-template-areas"]) { grid-template-columns: minmax(0, 1fr); }
      @media (hover: none) and (pointer: coarse) {
        input:not([type="checkbox"]):not([type="radio"]):not([type="range"]):not([type="color"]):not([type="file"]),
        textarea, select, [contenteditable=""], [contenteditable="true"] { font-size: 16px !important; }
        button, [role="button"], [role="checkbox"], a, summary, label, input, select, textarea { touch-action: manipulation; }
        button, [role="button"], a { -webkit-tap-highlight-color: transparent; }
      }`;
    document.head.appendChild(el);
    return () => { el.remove(); };
  }, []);
}

function useTutorNudges({ profile, sessionLog, notify }) {
  const ledgerRef = useRef(null);
  if (ledgerRef.current === null) { const v = lsGet(LS_SP_LEDGER); ledgerRef.current = v && typeof v === "object" ? v : {}; }
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const bump = () => setTick((n) => n + 1);
    const id = setInterval(bump, 3600000);
    const onVis = () => { if (document.visibilityState === "visible") bump(); };
    document.addEventListener("visibilitychange", onVis);
    return () => { clearInterval(id); document.removeEventListener("visibilitychange", onVis); };
  }, []);
  useEffect(() => {
    if (!profile) return;
    const now = new Date();
    const due = tutorNudges(profile, tutorBrief(profile, sessionLog, now), now);
    const ledger = ledgerRef.current; const cutoff = Date.now() - 120 * 864e5; let changed = false;
    Object.keys(ledger).forEach((k) => { if (ledger[k] < cutoff) { delete ledger[k]; changed = true; } });
    due.forEach((n) => { if (ledger[n.key]) return; ledger[n.key] = Date.now(); changed = true; notify({ kind: n.kind, tone: n.tone, vars: n.vars }); });
    if (changed) lsSet(LS_SP_LEDGER, JSON.stringify(ledger));
  }, [profile, sessionLog.length, tick]); // eslint-disable-line
}

// ---- small shared bits ----
function spWhen(days, t) { return days <= 0 ? t("spToday") : days === 1 ? t("spTomorrow") : t("spInDays", { n: days }); }
function spWeekLabel(b, t) {
  if (b.phase === "in") return b.total ? t("spTermWeek", { w: b.week, n: b.total }) : t("spTermWeekNoTotal", { w: b.week });
  if (b.phase === "before") return b.daysToStart === 1 ? t("spTermBefore1") : t("spTermBefore", { n: b.daysToStart });
  if (b.phase === "after") return t("spTermAfter");
  return t("spTermUnknown");
}
const spTone = (T, tone) => ({ red: T.red, amber: T.amber, green: T.green, blue: T.blue }[tone] || T.muted);
function TaskRow({ task, onToggle, onRemove, onEdit, T, t, lang }) {
  const d = parseISODate(task.due);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0" }}>
      <button onClick={onToggle} role="checkbox" aria-checked={task.done} aria-label={task.title} style={{
        width: 22, height: 22, flexShrink: 0, borderRadius: 5, cursor: "pointer", padding: 0, display: "inline-flex", alignItems: "center", justifyContent: "center",
        background: task.done ? T.green : "transparent", border: `2px solid ${task.done ? T.green : T.border}`, color: T.onBlue,
      }}>{task.done && <Check size={14} />}</button>
      <span style={{ flex: 1, minWidth: 0, fontFamily: FONT_UI, fontSize: fs(13.5), color: task.done ? T.muted : T.ink, textDecoration: task.done ? "line-through" : "none", overflowWrap: "anywhere" }}>{task.title}</span>
      {task.time && <span style={{ fontFamily: FONT_MONO, fontSize: fs(11.5), color: T.muted, whiteSpace: "nowrap" }}>{fmtClock(task.time, lang === "es" ? "es" : "en-US")}</span>}
      {d && <span style={{ fontFamily: FONT_MONO, fontSize: fs(11.5), color: T.muted, whiteSpace: "nowrap" }}>{d.toLocaleDateString(lang === "es" ? "es" : "en-US", { month: "short", day: "numeric" })}</span>}
      {onEdit && <button onClick={onEdit} title={t("calEdit")} aria-label={t("calEdit")} style={{ background: "transparent", border: "none", cursor: "pointer", color: T.muted, padding: 4, display: "flex" }}><Pencil size={14} /></button>}
      {onRemove && <button onClick={onRemove} title={t("csPlanRemove")} aria-label={t("csPlanRemove")} style={{ background: "transparent", border: "none", cursor: "pointer", color: T.muted, padding: 4, display: "flex" }}><X size={15} /></button>}
    </div>
  );
}

// One exam in the profile: shows it, and lets the student fix a wrong date or time, say it already happened, or remove it.
function AssessmentRow({ a, right, onSave, onRemove, T, t, children }) {
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(a.date); const [time, setTime] = useState(a.time || "");
  useEffect(() => { setDate(a.date); setTime(a.time || ""); }, [a.date, a.time]);
  const inp = { fontFamily: FONT_UI, fontSize: fs(13), color: T.ink, background: T.paper, border: `1px solid ${T.border}`, borderRadius: 6, padding: "6px 8px", outline: "none", minWidth: 0 };
  const btn = (primary) => ({ fontFamily: FONT_UI, fontWeight: 600, fontSize: fs(12.5), cursor: "pointer", borderRadius: 6, padding: "6px 10px", background: primary ? T.blue : "transparent", color: primary ? T.onBlue : T.blue, border: `1px solid ${primary ? T.blue : T.border}` });
  const valid = !!parseISODate(date);
  return (
    <div style={{ padding: "9px 0", borderBottom: `1px solid ${T.border}` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <div style={{ flex: "1 1 160px", minWidth: 0 }}>{children}</div>
        {right}
        <button onClick={() => setOpen((o) => !o)} aria-expanded={open} title={t("spEdit")} aria-label={`${t("spEdit")}: ${a.title}`} style={{ background: "transparent", border: "none", cursor: "pointer", color: T.muted, padding: 4, display: "flex" }}><Pencil size={15} /></button>
      </div>
      {open && (
        <div style={{ marginTop: 10, display: "grid", gap: 8 }}>
          <p style={{ fontFamily: FONT_UI, fontSize: fs(12.5), color: T.muted, margin: 0 }}>{t("spFixDateHint")}</p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} aria-label={t("spExamDate")} style={inp} />
            <input type="time" value={time} onChange={(e) => setTime(e.target.value)} aria-label={t("spExamTime")} style={inp} />
            <button disabled={!valid} onClick={() => { onSave({ date, time: time || null }); setOpen(false); }} style={{ ...btn(true), opacity: valid ? 1 : 0.5 }}>{t("spSave")}</button>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {a.status === "done"
              ? <button onClick={() => { onSave({ status: "upcoming" }); setOpen(false); }} style={btn(false)}>{t("spMarkUpcoming")}</button>
              : <button onClick={() => { onSave({ status: "done" }); setOpen(false); }} style={btn(false)}>{t("spMarkDone")}</button>}
            <button onClick={onRemove} style={btn(false)}>{t("csPlanRemove")}</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ---- Console: "Your tutor" ----
function TutorCard({ sessionLog, onNavigate, T, compact = false, fill = false, hideLinks = false }) {
  const { t, lang } = useI18n();
  const sp = useContext(ProfileContext);
  const phone = useViewport().w < 640;
  const locale = lang === "es" ? "es" : "en-US";
  const [tick, setTick] = useState(0);
  useEffect(() => { const id = setInterval(() => setTick((n) => n + 1), 60000); return () => clearInterval(id); }, []); // keeps "next class in 25 min" honest
  const dayKey = new Date().toDateString();
  const brief = useMemo(() => (sp.profile ? tutorBrief(sp.profile, sessionLog, new Date()) : null), [sp.profile, sessionLog, dayKey, tick]); // eslint-disable-line
  const card = { background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: compact ? "14px 18px" : phone ? 18 : 24 };
  const label = { fontFamily: FONT_UI, fontWeight: 700, fontSize: fs(11.5), color: T.muted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: compact ? 4 : 6 };
  const linkBtn = { marginLeft: "auto", fontFamily: FONT_UI, fontWeight: 600, fontSize: fs(12.5), color: T.blue, background: "transparent", border: "none", cursor: "pointer", padding: 4 };

  if (!sp.profile || !brief) {
    return (
      <div style={{ ...card, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <div style={{ flex: "1 1 260px", minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: FONT_UI, fontWeight: 700, fontSize: fs(16), color: T.ink }}><GraduationCap size={18} color={T.blue} />{t("spCardInviteTitle")}</div>
          <div style={{ fontFamily: FONT_UI, fontSize: fs(13.5), color: T.muted, marginTop: 4, lineHeight: 1.5 }}>{t("spCardInviteBody")}</div>
        </div>
        <PrimaryButton T={T} icon={Sparkles} onClick={() => onNavigate("profile")}>{t("spCardInviteBtn")}</PrimaryButton>
      </div>
    );
  }
  const run = (a) => {
    if (!a) return;
    if (a.type === "focusBlock") { sp.seedFocus(a.value); onNavigate("import"); } else if (a.type === "library") onNavigate("library"); else if (a.type === "calendar") onNavigate("calendar"); else onNavigate("profile");
  };
  const actionLabel = (a) => (a.type === "focusBlock" ? t("spStartBlock", { s: a.value }) : a.type === "library" ? t("csOpenLibrary") : t("spCardOpen"));
  const pct = brief.target ? Math.min(100, Math.round((brief.answeredWeek / brief.target) * 100)) : 0;
  const courseList = (sp.profile.courses || []).slice(0, compact ? 4 : 8);
  const setPriority = (id) => sp.updateCourses((sp.profile.courses || []).map((c) => ({ ...c, priority: c.id === id ? !c.priority : false })));
  const first = brief.guidance.filter((g) => g.key !== "sgTasks" && g.key !== "sgPaceDone").slice(0, compact ? 3 : 5);
  const leadIdx = first.findIndex((g) => g.action && g.action.type === "focusBlock");
  const block = brief.studyFocus[0] ? { type: "focusBlock", value: brief.studyFocus[0] } : { type: "library" };
  const hm = (m) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
  const clk = (m) => fmtClock(hm(m), locale);
  const sectionTop = { borderTop: `1px solid ${T.border}`, paddingTop: compact ? 10 : 14 };
  const rowHead = { fontFamily: FONT_UI, fontWeight: 700, fontSize: fs(13.5), color: T.ink };
  const noteRow = { display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", fontFamily: FONT_UI, fontSize: fs(13), color: T.ink, lineHeight: 1.45, marginTop: 4 };
  const rdTone = (v) => (v == null ? T.muted : v >= 75 ? T.green : v >= 60 ? T.amber : T.red);
  const rdPill = (v) => (v == null ? "muted" : v >= 75 ? "green" : v >= 60 ? "amber" : "red");
  const exams = brief.exams.slice(0, compact ? 3 : 4);

  return (
    <div style={{ ...card, display: "grid", gridTemplateColumns: "minmax(0, 1fr)", gap: compact ? 12 : 18, ...(fill ? { height: "100%", boxSizing: "border-box", alignContent: "space-between" } : {}) }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <GraduationCap size={18} color={T.blue} />
        <span style={{ fontFamily: FONT_UI, fontWeight: 600, fontSize: fs(14), color: T.ink }}>{t("spCardTitle")}</span>
        <Pill T={T} tone={brief.phase === "in" ? "blue" : "muted"}>{spWeekLabel(brief, t)}</Pill>
        {!hideLinks && <button onClick={() => onNavigate("studyhub")} style={linkBtn}>{t("tbOpenTutor")}</button>}
      </div>

      <div>
        <div style={label}>{t("tuExams")}</div>
        {exams.length === 0 && <div style={{ fontFamily: FONT_UI, fontSize: fs(13), color: T.muted }}>{t("spNoNext")}</div>}
        {exams.map((a, i) => {
          const r = a.ready; const known = r ? r.rows.filter((x) => x.pct != null) : [];
          const weakest = known.slice().sort((x, y) => x.pct - y.pct)[0];
          const untested = r ? r.rows.filter((x) => x.pct == null).length : 0;
          const crs = spCourseOf(sp.profile, a.courseId);
          const d = parseISODate(a.date);
          const meta = [d ? d.toLocaleDateString(locale, { weekday: "short", month: "short", day: "numeric" }) : a.date, a.time ? fmtClock(a.time, locale) : null, a.weightPct != null ? t("tuWeight", { n: a.weightPct }) : null].filter(Boolean).join(" · ");
          const sub = [weakest ? t("tuWeakest", { topic: weakest.topic, pct: weakest.pct }) : null, untested ? t("tuUntestedN", { n: untested }) : null].filter(Boolean).join(" · ");
          return (
            <div key={a.id} style={{ padding: compact ? "8px 0" : "10px 0", borderTop: i ? `1px solid ${T.border}` : "none" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <span style={{ ...rowHead, fontSize: fs(i === 0 ? 15 : 13.5), flex: "1 1 140px", minWidth: 0, overflowWrap: "anywhere" }}>{crs && crs.priority && <Star size={13} color={T.amber} fill={T.amber} aria-label={t("tbCourses")} style={{ marginRight: 5, verticalAlign: "-2px" }} />}{a.title}</span>
                {crs && <Pill T={T} tone="purple">{crs.name}</Pill>}
                <Pill T={T} tone={a.days <= 3 ? "red" : a.days <= 7 ? "amber" : "muted"}>{spWhen(a.days, t)}</Pill>
                {r && <Pill T={T} tone={rdPill(r.overall)}>{r.overall == null ? t("tuNoData") : t("tuReadyPct", { n: r.overall })}</Pill>}
              </div>
              <div style={{ fontFamily: FONT_MONO, fontSize: fs(11.5), color: T.muted, marginTop: 2 }}>{meta}</div>
              {i === 0 && r ? (
                <div style={{ marginTop: 8 }}>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {r.rows.slice(0, compact ? 6 : 8).map((x) => (
                      <button key={x.topic} onClick={() => run({ type: "focusBlock", value: x.topic })} title={t("spStartBlock", { s: x.topic })}
                        style={{ fontFamily: FONT_UI, fontSize: fs(12), fontWeight: 600, color: T.ink, background: "transparent", border: `1px solid ${rdTone(x.pct)}`, borderRadius: 999, padding: "4px 10px", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6, maxWidth: "100%" }}>
                        <span aria-hidden="true" style={{ width: 8, height: 8, borderRadius: "50%", background: rdTone(x.pct), flexShrink: 0 }} />
                        <span style={{ overflowWrap: "anywhere", textAlign: "left" }}>{x.topic}</span>
                        <span style={{ fontFamily: FONT_MONO, color: T.muted }}>{x.pct == null ? "—" : `${x.pct}%`}</span>
                      </button>
                    ))}
                  </div>
                  <div style={{ fontFamily: FONT_UI, fontSize: fs(11.5), color: T.muted, marginTop: 6 }}>{t("tuReadyHint")}</div>
                </div>
              ) : (sub || (!r && (a.coverage || []).length > 0)) ? (
                <div style={{ fontFamily: FONT_UI, fontSize: fs(12), color: T.muted, marginTop: 4, overflowWrap: "anywhere" }}>{sub || a.coverage.slice(0, 4).join(" · ")}</div>
              ) : null}
            </div>
          );
        })}
        {brief.deadlines.filter((x) => x.days > 3 && x.days <= 14)[0] && (
          <div style={{ fontFamily: FONT_UI, fontSize: fs(12.5), color: T.muted, marginTop: 6, overflowWrap: "anywhere" }}>
            {t("tuDeadline")}: {brief.deadlines.filter((x) => x.days > 3 && x.days <= 14)[0].title} · {spWhen(brief.deadlines.filter((x) => x.days > 3 && x.days <= 14)[0].days, t).toLowerCase()}
          </div>
        )}
      </div>

      {courseList.length > 0 && (
        <div style={sectionTop}>
          <div style={label}>{t("tbCourses")}</div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {courseList.map((c) => (
              <span key={c.id} style={{ display: "inline-flex", alignItems: "center", gap: 6, fontFamily: FONT_UI, fontSize: fs(12.5), fontWeight: 600, color: T.ink, border: `1px solid ${c.priority ? T.amber : T.border}`, borderRadius: 999, padding: "3px 10px 3px 6px", maxWidth: "100%" }}>
                <button onClick={() => setPriority(c.id)} aria-pressed={!!c.priority} title={c.priority ? t("tbStarOff") : t("tbStarOn", { c: c.name })} aria-label={c.priority ? t("tbStarOff") : t("tbStarOn", { c: c.name })} style={{ background: "transparent", border: "none", padding: 2, cursor: "pointer", display: "flex" }}><Star size={14} color={c.priority ? T.amber : T.muted} fill={c.priority ? T.amber : "none"} /></button>
                <span style={{ overflowWrap: "anywhere" }}>{c.name}</span>
              </span>
            ))}
          </div>
          <div style={{ fontFamily: FONT_UI, fontSize: fs(11.5), color: T.muted, marginTop: 6 }}>{t("tbStarHint")}</div>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: compact ? "repeat(auto-fit, minmax(min(100%, 140px), 1fr))" : "repeat(auto-fit, minmax(min(100%, 230px), 1fr))", gap: compact ? 12 : 18 }}>
        <div>
          <div style={label}>{t("spThisWeek")}</div>
          {brief.focus.length ? (
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>{brief.focus.map((f) => <Pill key={f} T={T} tone="blue">{f}</Pill>)}</div>
          ) : <div style={{ fontFamily: FONT_UI, fontSize: fs(13), color: T.muted }}>{t("spNoFocus")}</div>}
          {brief.target > 0 && (
            <div style={{ marginTop: compact ? 8 : 12 }}>
              <div style={{ height: 6, borderRadius: 999, background: T.mutedBg, overflow: "hidden" }}><div style={{ width: `${pct}%`, height: "100%", background: brief.pace === "behind" ? T.amber : T.blue }} /></div>
              <div style={{ fontFamily: FONT_MONO, fontSize: fs(11.5), color: T.muted, marginTop: 4 }}>{t("spWeekly", { a: brief.answeredWeek, n: brief.target })}</div>
              {brief.phase === "in" && (brief.todayGoal > 0 ? (
                <>
                  <div style={{ height: 6, borderRadius: 999, background: T.mutedBg, overflow: "hidden", marginTop: 10 }}><div style={{ width: `${Math.min(100, Math.round((brief.answeredToday / brief.todayGoal) * 100))}%`, height: "100%", background: T.green }} /></div>
                  <div style={{ fontFamily: FONT_MONO, fontSize: fs(11.5), color: T.muted, marginTop: 4 }}>{t("tuTodayQs", { a: brief.answeredToday, n: brief.todayGoal })}</div>
                </>
              ) : <div style={{ fontFamily: FONT_UI, fontSize: fs(12.5), color: T.green, fontWeight: 600, marginTop: 10 }}>{t("tuGoalMet")}</div>)}
            </div>
          )}
        </div>
      </div>

      {brief.freeNext && !brief.offToday && (
        <div style={{ ...noteRow, marginTop: 0 }}>
          <span aria-hidden="true" style={{ width: 8, height: 8, borderRadius: "50%", background: T.green, flexShrink: 0 }} />
          <span style={{ flex: "1 1 160px", minWidth: 0 }}>{t("tuWindow", { from: clk(brief.freeNext.from), to: clk(brief.freeNext.to), qs: brief.freeNext.qs })}</span>
          <GhostButton T={T} icon={Play} onClick={() => run(block)}>{actionLabel(block)}</GhostButton>
        </div>
      )}

      {first.length > 0 && (
        <div style={{ display: "grid", gap: compact ? 6 : 8, ...sectionTop }}>
          {first.map((g, i) => (
            <div key={`${g.key}${i}`} style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <span aria-hidden="true" style={{ width: 8, height: 8, borderRadius: "50%", background: spTone(T, g.tone), flexShrink: 0 }} />
              <span style={{ flex: "1 1 220px", minWidth: 0, fontFamily: FONT_UI, fontSize: fs(13.5), color: T.ink, lineHeight: 1.45, overflowWrap: "anywhere" }}>{t(g.key, { ...g.vars, when: spWhen(g.vars.n == null ? 0 : g.vars.n, t).toLowerCase() })}</span>
              {g.action && g.action.type !== "profile" && (i === leadIdx
                ? <PrimaryButton T={T} icon={Play} onClick={() => run(g.action)}>{actionLabel(g.action)}</PrimaryButton>
                : <GhostButton T={T} onClick={() => run(g.action)}>{actionLabel(g.action)}</GhostButton>)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Qbanks that match the tutor's study topics for this week (top 3). Used by the Library strip and the subtle badge on the cards.
function tutorLibraryPicks(library, brief) {
  if (!brief || brief.phase !== "in" || !brief.studyFocus.length) return [];
  return library.map((e) => {
    const n = e.questions.filter((q) => brief.studyFocus.some((f) => topicMatch(f, q.subject))).length;
    return { e, n: n || (brief.studyFocus.some((f) => topicMatch(f, e.title)) ? e.questions.length : 0) };
  }).filter((x) => x.n > 0).sort((a, b) => b.n - a.n).slice(0, 3);
}

// ---- Library: Qbanks that match this week's topics ----
function TutorLibraryStrip({ library, sessionLog, onLaunch, T }) {
  const { t } = useI18n();
  const sp = useContext(ProfileContext);
  const dayKey = new Date().toDateString();
  const brief = useMemo(() => (sp.profile ? tutorBrief(sp.profile, sessionLog, new Date()) : null), [sp.profile, sessionLog, dayKey]); // eslint-disable-line
  const picks = useMemo(() => tutorLibraryPicks(library, brief), [brief, library]);
  if (!picks.length) return null;
  return (
    <div style={{ background: T.card, border: `1px solid ${T.blue}`, borderRadius: 10, padding: "16px 20px", marginBottom: 20 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, fontFamily: FONT_UI, fontWeight: 600, fontSize: fs(14), color: T.ink }}>
        <GraduationCap size={17} color={T.blue} />{t("spLibStrip", { w: brief.week })}
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {picks.map(({ e, n }) => <GhostButton key={e.id} T={T} icon={Play} onClick={() => onLaunch([e.id])}>{t("spLibStart", { title: e.title, n })}</GhostButton>)}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tutor Dashboard + JSON Blueprint (USMLE content outline recipe)
// ---------------------------------------------------------------------------
// The blueprint is one JSON file: test domains, system weights and target competencies. Each item has a weight (% of the exam), a target accuracy and
// `match` names that are matched to your Qbank subjects. The dashboard fuses it with your Analytics and your Study Profile (this week, exams) to rank what to study.
const LS_BP = "owordBlueprint";
const BP_TEMPLATE = {
  schema: "oworld-usmle-blueprint", v: 1, exam: "USMLE Step 1", version: "template", targetDate: null, targetPct: 70,
  note: "Placeholder weights. Replace them with the current USMLE content outline (ask your AI tool with the prompt).",
  domains: [
    { id: "path", name: "Pathology", weightPct: 25, targetPct: 70, match: ["Pathology"] }, { id: "phys", name: "Physiology", weightPct: 20, match: ["Physiology"] },
    { id: "pharm", name: "Pharmacology", weightPct: 15, match: ["Pharmacology"] }, { id: "micro", name: "Microbiology", weightPct: 10, match: ["Microbiology"] },
    { id: "bio", name: "Biochemistry & Nutrition", weightPct: 10, match: ["Biochemistry", "Nutrition"] }, { id: "anat", name: "Anatomy & Embryology", weightPct: 8, match: ["Anatomy", "Embryology"] },
    { id: "beh", name: "Behavioral Science & Biostatistics", weightPct: 8, match: ["Behavioral Science", "Biostatistics", "Ethics"] }, { id: "imm", name: "Immunology", weightPct: 4, match: ["Immunology"] },
  ],
  systems: [
    { id: "gp", name: "General Principles", weightPct: 7, match: ["General Principles", "Genetics"] }, { id: "cv", name: "Cardiovascular", weightPct: 9, match: ["Cardiovascular"] },
    { id: "resp", name: "Respiratory", weightPct: 8, match: ["Respiratory"] }, { id: "ren", name: "Renal & Urinary", weightPct: 7, match: ["Renal", "Urinary"] },
    { id: "gi", name: "Gastrointestinal", weightPct: 8, match: ["Gastrointestinal"] }, { id: "heme", name: "Hematology & Oncology", weightPct: 8, match: ["Hematology", "Oncology"] },
    { id: "imm", name: "Immune System", weightPct: 5, match: ["Immune", "Immunology"] }, { id: "msk", name: "Musculoskeletal & Skin", weightPct: 8, match: ["Musculoskeletal", "Dermatology", "Integumentary"] },
    { id: "neuro", name: "Nervous System & Special Senses", weightPct: 12, match: ["Neurology", "Neuroscience"] }, { id: "endo", name: "Endocrine", weightPct: 6, match: ["Endocrine"] },
    { id: "repro", name: "Reproductive", weightPct: 7, match: ["Reproductive", "Obstetrics"] }, { id: "psych", name: "Behavioral Health", weightPct: 8, match: ["Psychiatry", "Behavioral Health"] },
    { id: "multi", name: "Multisystem", weightPct: 7, match: ["Multisystem", "Biostatistics", "Epidemiology"] },
  ],
  competencies: [
    { id: "dx", name: "Pathophysiology & diagnosis", weightPct: 40, targetPct: 75, match: ["Pathology", "Physiology"] },
    { id: "rx", name: "Pharmacotherapy & mechanisms", weightPct: 20, targetPct: 70, match: ["Pharmacology"] },
    { id: "sci", name: "Foundational science mechanisms", weightPct: 25, targetPct: 70, match: ["Biochemistry", "Microbiology", "Immunology", "Genetics", "Anatomy"] },
    { id: "ebm", name: "Evidence, biostatistics & ethics", weightPct: 15, targetPct: 70, match: ["Biostatistics", "Epidemiology", "Ethics", "Behavioral Science"] },
  ],
};
const BP_SCHEMA = `{"schema":"oworld-usmle-blueprint","v":1,"exam":"string","version":"outline edition or effective date","targetDate":"YYYY-MM-DD|null","targetPct":70,"note":"string","source":{"urls":["official page URLs you used"],"outlineVersion":"string","retrievedOn":"YYYY-MM-DD"},"domains":[{"id":"slug","name":"string","weightPct":number,"officialRange":"string|null","targetPct":number|null,"match":["Qbank subject names"]}],"systems":[same shape],"competencies":[same shape]}`;
const BP_PROMPT = `You are building a study blueprint for my USMLE tutor. Return ONE JSON object and nothing else, matching this schema:\n${BP_SCHEMA}\n\nSTEP 1, find the current standard. Search the internet now. Use only official channels: usmle.org (the USMLE Content Description and Specifications, "Content Outline" PDFs for Step 1, Step 2 CK and Step 3), NBME (nbme.org) and the FSMB. Ask which Step I am preparing for if I did not say; default to Step 1. Find the edition in force today, check its effective date and any announced changes, and prefer it over older copies, blogs, prep-company summaries and forum posts. If you cannot browse, say so plainly and ask me to paste the outline. Never fill weights from memory.\nSTEP 2, build the blueprint from that document.\n- domains: the disciplines tested (Pathology, Pharmacology...). systems: the organ systems / content areas. competencies: the physician tasks or competencies.\n- weightPct: each item's share of its group, so the numbers in every group add up to 100 (between 98 and 102). Official outlines publish percentage ranges, and disciplines and competencies overlap (one question counts toward several), so the raw midpoints can add up to far more than 100. When they do, scale every midpoint by 100 divided by the sum of the midpoints, round to one decimal and make the group total exactly 100. Put the official published range in each item's officialRange (e.g. "44-52%") and say in "note" that you scaled. Before you reply, add up each group and fix it if it is not 100.\n- targetPct: the accuracy I should reach (default 70; higher for heavily weighted items).\n- match: 1-5 short names a Qbank would use as the "subject" of a question (e.g. "Cardiovascular", "Heme/Onc", "Pharmacology").\n- source: the official URLs you used, the outline edition/effective date, and today's date as retrievedOn.\n- targetDate: my exam date if I give one, else null.`;
const bpNum = (v) => { if (v == null || v === "") return null; const n = Number(String(v).replace("%", "")); return Number.isFinite(n) && n >= 0 ? n : null; };
function bpGroup(raw, prefix) {
  const arr = Array.isArray(raw) ? raw : raw && typeof raw === "object" ? Object.entries(raw).map(([name, v]) => (v && typeof v === "object" ? { name, ...v } : { name, weightPct: v })) : [];
  const list = (v) => (Array.isArray(v) ? v : typeof v === "string" ? v.split(",") : []).map((s) => String(s).trim()).filter(Boolean);
  return arr.map((x, i) => {
    const name = String((x && (x.name || x.title || x.label)) || "").trim(); if (!name) return null;
    return { id: String(x.id || `${prefix}-${i + 1}`), name, weightPct: bpNum(x.weightPct ?? x.weight ?? x.pct), officialRange: x.officialRange ? String(x.officialRange).slice(0, 30) : null, targetPct: bpNum(x.targetPct ?? x.target ?? x.targetAccuracy), match: [...new Set([name, ...list(x.match ?? x.aliases ?? x.keywords ?? x.qbankFocus)])] };
  }).filter(Boolean);
}
// Tolerant: accepts code fences, extra prose around the JSON, arrays or {name: weight} maps, and a few alternative key names.
function parseBlueprint(text) {
  const s = String(text || "").trim(); const a = s.indexOf("{"); const b = s.lastIndexOf("}");
  if (a < 0 || b <= a) return { error: "tbErrParse" };
  let o; try { o = JSON.parse(s.slice(a, b + 1)); } catch (e) { return { error: "tbErrParse" }; }
  const bp = {
    schema: "oworld-usmle-blueprint", v: 1, exam: String(o.exam || o.name || "USMLE").slice(0, 80), version: String(o.version || "").slice(0, 40),
    targetDate: /^\d{4}-\d{2}-\d{2}$/.test(o.targetDate || "") ? o.targetDate : null, targetPct: bpNum(o.targetPct ?? o.targetScorePct) ?? 70, note: String(o.note || "").slice(0, 400),
    source: o.source && typeof o.source === "object" ? { urls: (Array.isArray(o.source.urls) ? o.source.urls : []).map((u) => String(u).slice(0, 200)).slice(0, 5), outlineVersion: String(o.source.outlineVersion || "").slice(0, 80), retrievedOn: /^\d{4}-\d{2}-\d{2}$/.test(o.source.retrievedOn || "") ? o.source.retrievedOn : "" } : null,
    domains: bpGroup(o.domains ?? o.testDomains, "d"), systems: bpGroup(o.systems ?? o.systemWeights, "s"), competencies: bpGroup(o.competencies ?? o.targetCompetencies, "c"),
  };
  return bp.domains.length || bp.systems.length || bp.competencies.length ? { bp } : { error: "tbErrShape" };
}
const LS_BP_FILE = "owordBlueprintFile";   // { fileId, lastSync } of the Drive file below
const LS_BP_LEDGER = "owordBpNudgeLedger"; // { nudgeKey: firedAt }
const BP_FILE_NAME = "oword_blueprint.json";
const BP_TYPE = "oworld-usmle-blueprint";
const BP_REFRESH_DAYS = 120; // about one semester: past this (or once a new term starts) the tutor asks for an update
const BP_SOON_DAYS = 90;
const validBp = (b) => !!b && typeof b === "object" && b.schema === BP_TYPE && ["domains", "systems", "competencies"].every((k) => Array.isArray(b[k]));
const bpCore = (m) => hashStr(JSON.stringify({ b: m.bp, u: m.updatedAt, c: m.clearedAt }));
// Newest edit wins as a whole; a deletion beats any older edit (same rules as the Study Profile).
function mergeBpState(local, remote) {
  const r = remote && typeof remote === "object" ? remote : {};
  const L = { bp: validBp(local.bp) ? local.bp : null, updatedAt: Number(local.updatedAt) || 0, clearedAt: Number(local.clearedAt) || 0 };
  const R = { bp: validBp(r.bp) ? r.bp : null, updatedAt: Number(r.updatedAt) || 0, clearedAt: Number(r.clearedAt) || 0 };
  const clearedAt = Math.max(L.clearedAt, R.clearedAt); const newer = R.updatedAt > L.updatedAt ? R : L;
  return { bp: newer.bp && newer.updatedAt > clearedAt ? newer.bp : null, updatedAt: Math.max(L.updatedAt, R.updatedAt), clearedAt };
}
function useBlueprintStore() {
  const [state, setState] = useState(() => {
    const v = lsGet(LS_BP);
    if (validBp(v)) return { bp: v, updatedAt: Number(v.loadedAt) || 1, clearedAt: 0 }; // first version stored the bare blueprint
    return v && typeof v === "object" ? { bp: validBp(v.bp) ? v.bp : null, updatedAt: Number(v.updatedAt) || 0, clearedAt: Number(v.clearedAt) || 0 } : { bp: null, updatedAt: 0, clearedAt: 0 };
  });
  const ref = useRef(state);
  useEffect(() => { lsSet(LS_BP, JSON.stringify(state)); }, [state]);
  const commit = (n) => { ref.current = n; setState(n); };
  const save = useCallback((bp, keepLoaded) => { const now = Date.now(); const cur = ref.current; commit(bp ? { bp: { ...bp, loadedAt: keepLoaded && bp.loadedAt ? bp.loadedAt : now }, updatedAt: now, clearedAt: cur.clearedAt } : { bp: null, updatedAt: now, clearedAt: now }); }, []);
  const wipe = useCallback(() => { ref.current = { bp: null, updatedAt: 0, clearedAt: 0 }; setState(ref.current); lsRemove(LS_BP); lsRemove(LS_BP_FILE); lsRemove(LS_BP_LEDGER); }, []);
  const applyMerged = useCallback((m) => { if (bpCore(m) !== bpCore(ref.current)) commit(m); }, []);
  const getState = useCallback(() => ref.current, []);
  return { bp: state.bp, updatedAt: state.updatedAt, clearedAt: state.clearedAt, save, wipe, applyMerged, getState };
}
// Google Drive sync for the blueprint: own file (oword_blueprint.json), same sign-in and token, same pull -> merge -> push cycle as the profile.
function useBlueprintSync({ drive, store }) {
  const { configured, linked, acquireToken, peekToken } = drive;
  const latest = useRef({}); latest.current = { getState: store.getState, applyMerged: store.applyMerged };
  const fileRef = useRef((lsGet(LS_BP_FILE) || {}).fileId || null);
  const modRef = useRef(null); const running = useRef(false); const rerun = useRef(false);
  const linkedRef = useRef(linked); linkedRef.current = linked;
  const [status, setStatus] = useState("idle"); const [lastSync, setLastSync] = useState((lsGet(LS_BP_FILE) || {}).lastSync || 0);
  const run = useCallback(async ({ interactive = false } = {}) => {
    if (!configured || !linkedRef.current) return;
    if (running.current) { rerun.current = true; return; }
    running.current = true; setStatus("busy");
    try {
      const token = await acquireToken({ interactive });
      if (!token) { setStatus("idle"); return; }
      let fileId = fileRef.current; let remote = null;
      if (fileId) { try { remote = await driveDownload(token, fileId); } catch (e) { if (e.status === 404) fileId = null; else throw e; } }
      if (!fileId) { fileId = await driveFindSyncFile(token, BP_FILE_NAME); if (fileId) remote = await driveDownload(token, fileId); }
      const merged = mergeBpState(latest.current.getState(), remote);
      latest.current.applyMerged(merged);
      const remoteMerged = remote ? mergeBpState({ bp: null, updatedAt: 0, clearedAt: 0 }, remote) : null;
      if (!fileId || !remoteMerged || bpCore(merged) !== bpCore(remoteMerged)) {
        fileId = await driveUpload(token, fileId, JSON.stringify({ v: 1, app: "oworld", type: BP_TYPE, updatedAt: merged.updatedAt, clearedAt: merged.clearedAt, bp: merged.bp }), BP_FILE_NAME);
      }
      fileRef.current = fileId;
      try { modRef.current = await driveModified(token, fileId); } catch (e) { /* the next poll just does a full sync */ }
      const now = Date.now(); lsSet(LS_BP_FILE, JSON.stringify({ fileId, lastSync: now })); setLastSync(now); setStatus("done");
    } catch (e) { setStatus("error"); }
    finally { running.current = false; if (rerun.current) { rerun.current = false; setTimeout(() => run(), 0); } }
  }, [configured, acquireToken]);
  useEffect(() => { if (configured && linked && drive.status === "done") run(); }, [configured, linked, drive.status]); // eslint-disable-line
  useEffect(() => { if (!linked) { fileRef.current = null; modRef.current = null; lsRemove(LS_BP_FILE); setStatus("idle"); setLastSync(0); } }, [linked]);
  const first = useRef(true);
  useEffect(() => {
    if (first.current) { first.current = false; return undefined; }
    if (!linked) return undefined;
    const id = setTimeout(() => run(), 3000); return () => clearTimeout(id);
  }, [store.updatedAt, store.clearedAt, linked, run]);
  const poll = useCallback(async () => {
    const tk = peekToken();
    if (!configured || !linkedRef.current || running.current || !fileRef.current || !tk) return;
    try { const mod = await driveModified(tk, fileRef.current); if (mod && modRef.current && mod !== modRef.current) run(); } catch (e) { /* ignore */ }
  }, [configured, peekToken, run]);
  useEffect(() => {
    if (!configured) return undefined;
    const onVis = () => { if (document.visibilityState === "visible") poll(); };
    const id = setInterval(() => { if (document.visibilityState === "visible") poll(); }, 45000);
    document.addEventListener("visibilitychange", onVis);
    return () => { clearInterval(id); document.removeEventListener("visibilitychange", onVis); };
  }, [configured, poll]);
  return { available: !!(configured && linked), status, lastSync, syncNow: () => run({ interactive: true }) };
}
// One-tap fix for groups whose weights don't add up to 100: scales them, keeps what the file said as officialRange, and the load date stays (a rescale is not a refresh).
function scaleBp(bp) {
  const fix = (items) => {
    const sum = items.reduce((n, i) => n + (i.weightPct || 0), 0); if (!sum || (sum >= 97 && sum <= 103)) return items;
    const out = items.map((i) => ({ ...i, officialRange: i.officialRange || (i.weightPct != null ? `${i.weightPct}%` : null), weightPct: i.weightPct != null ? Math.round(((i.weightPct * 100) / sum) * 10) / 10 : null }));
    const drift = Math.round((100 - out.reduce((n, i) => n + (i.weightPct || 0), 0)) * 10) / 10; const big = out.reduce((b, i, k) => ((i.weightPct || 0) > (out[b].weightPct || 0) ? k : b), 0);
    out[big] = { ...out[big], weightPct: Math.round((out[big].weightPct + drift) * 10) / 10 }; return out;
  };
  return { ...bp, domains: fix(bp.domains), systems: fix(bp.systems), competencies: fix(bp.competencies), note: [bp.note, "Weights scaled to 100% in Oworld."].filter(Boolean).join(" ").slice(0, 400) };
}
// How fresh is the blueprint? Its content date is the AI's retrievedOn, else the day it was loaded. Due after a semester, or once a new term has started since.
function bpFreshness(bp, profile, now = new Date()) {
  const base = parseISODate(bp.source && bp.source.retrievedOn) || (bp.loadedAt ? startOfDay(new Date(bp.loadedAt)) : null);
  if (!base) return { ageDays: null, due: false, soon: false, newTerm: false, dueOn: null };
  const today = startOfDay(now); const ageDays = Math.max(0, dayDiff(base, today)); const ts = profile ? termStartOf(profile) : null;
  const newTerm = !!(ts && dayDiff(base, ts) > 0 && dayDiff(ts, today) >= 0);
  return { ageDays, newTerm, due: ageDays >= BP_REFRESH_DAYS || newTerm, soon: ageDays >= BP_SOON_DAYS, dueOn: new Date(base.getFullYear(), base.getMonth(), base.getDate() + BP_REFRESH_DAYS) };
}
// The tutor's gauge of how far to trust the blueprint, scored locally from what the file itself proves (the AI's own claims are not taken at face value).
const BP_OFFICIAL = /(^|\.)(usmle\.org|nbme\.org|fsmb\.org)$/i;
const bpHost = (u) => { try { return new URL(/^https?:/i.test(u) ? u : `https://${u}`).hostname.replace(/^www\./, ""); } catch (e) { return ""; } };
function bpConfidence(bp, now = new Date()) {
  const good = []; const flags = []; let score = 0; const src = bp.source;
  const hosts = [...new Set(((src && src.urls) || []).map(bpHost).filter(Boolean))]; const off = hosts.filter((h) => BP_OFFICIAL.test(h));
  if (off.length) { score += 35; good.push({ k: "official", v: { h: off.join(", ") } }); } else if (hosts.length) { score += 8; flags.push({ k: "unofficial" }); } else flags.push({ k: "noSource" });
  if (src && src.outlineVersion) { score += 15; good.push({ k: "version", v: { v: src.outlineVersion } }); } else flags.push({ k: "noVersion" });
  const rd = parseISODate(src && src.retrievedOn);
  if (rd) {
    score += 10; const age = Math.max(0, dayDiff(rd, startOfDay(now)));
    if (age <= BP_SOON_DAYS) { score += 15; good.push({ k: "fresh", v: { n: age } }); } else if (age <= BP_REFRESH_DAYS) score += 8; else flags.push({ k: "old", v: { n: age } });
  } else flags.push({ k: "noDate" });
  const groups = [["systems", "tbSystems"], ["domains", "tbDomains"], ["competencies", "tbComps"]].map(([k, g]) => ({ g, items: bp[k] })).filter((x) => x.items.some((i) => i.weightPct != null));
  if (groups.length) {
    let ok = 0; groups.forEach((x) => { const sum = Math.round(x.items.reduce((n, i) => n + (i.weightPct || 0), 0)); if (sum >= 97 && sum <= 103) ok++; else flags.push({ k: "weights", v: { g: x.g, n: sum } }); });
    score += Math.round((25 * ok) / groups.length); if (ok === groups.length) good.push({ k: "weights" });
  } else flags.push({ k: "noWeights" });
  if (bp.version === "template") { score = Math.min(score, 25); flags.unshift({ k: "template" }); }
  return { score, level: score >= 75 ? "high" : score >= 45 ? "medium" : "low", good, flags };
}
// Once per blueprint and reason: the tutor asks for an update after a semester, or when a new term starts.
function useBlueprintNudges({ bp, profile, notify }) {
  const [tick, setTick] = useState(0);
  useEffect(() => { const id = setInterval(() => setTick((n) => n + 1), 3600000); return () => clearInterval(id); }, []);
  useEffect(() => {
    if (!bp) return;
    const fr = bpFreshness(bp, profile, new Date()); if (!fr.due) return;
    const key = `bpDue:${bp.loadedAt || 0}:${fr.newTerm ? "term" : "age"}`; const ledger = lsGet(LS_BP_LEDGER) || {}; if (ledger[key]) return;
    ledger[key] = Date.now(); lsSet(LS_BP_LEDGER, JSON.stringify(ledger));
    notify({ kind: fr.newTerm ? "bpDueTerm" : "bpDue", tone: "amber", vars: { n: fr.ageDays } });
  }, [bp, profile, tick]); // eslint-disable-line
}
// Blueprint x Analytics x tutor: per item, accuracy from your logged answers (>= 5 questions), share of your practice vs its exam weight, and a priority score.
function bpStats(bp, log, focus = [], prioFocus = []) {
  const m = new Map();
  (Array.isArray(log) ? log : []).forEach((e) => (Array.isArray(e.bySubject) ? e.bySubject : []).forEach((x) => {
    const c = m.get(x.subject) || { subject: x.subject, correct: 0, total: 0 }; c.correct += Number(x.correct) || 0; c.total += Number(x.total) || 0; m.set(x.subject, c);
  }));
  const subs = [...m.values()]; const all = subs.reduce((n, x) => n + x.total, 0);
  const grp = (items, kind) => { const sum = items.reduce((n, i) => n + (i.weightPct || 0), 0); return items.map((it) => {
    const raw = it.weightPct != null ? it.weightPct : sum ? 0 : 100 / items.length; const w = sum > 0 ? (raw * 100) / sum : raw;
    const hit = subs.filter((x) => it.match.some((k) => topicMatch(k, x.subject)));
    const total = hit.reduce((n, x) => n + x.total, 0); const correct = hit.reduce((n, x) => n + x.correct, 0);
    const pct = total >= 5 ? Math.round((correct / total) * 100) : null; const target = it.targetPct != null ? it.targetPct : bp.targetPct;
    const share = all ? (total / all) * 100 : 0; const thisWeek = focus.some((f) => it.match.some((k) => topicMatch(k, f))); const prio = prioFocus.some((f) => it.match.some((k) => topicMatch(k, f)));
    const urg = pct == null ? 0.5 : Math.max(0, Math.min(1, (target - pct) / target)); const under = w > 0 ? Math.max(0, Math.min(1, (w - share) / w)) : 0;
    return { ...it, kind, w, total, pct, target, share, thisWeek, prio, score: w * (0.7 * urg + 0.3 * under) * (thisWeek ? 1.25 : 1) * (prio ? 1.4 : 1) };
  }); };
  const systems = grp(bp.systems, "systems"); const domains = grp(bp.domains, "domains"); const comps = grp(bp.competencies, "competencies");
  const base = systems.length ? systems : domains.length ? domains : comps; const kw = base.filter((x) => x.pct != null); const ww = kw.reduce((n, x) => n + x.w, 0);
  const priorities = []; [...systems, ...domains, ...comps].filter((x) => x.score > 0).sort((a, b) => b.score - a.score).forEach((x) => { if (!priorities.some((p) => topicMatch(p.match[0], x.match[0]))) priorities.push(x); });
  const unmapped = subs.filter((x) => ![...systems, ...domains, ...comps].some((it) => it.match.some((k) => topicMatch(k, x.subject)))).sort((a, b) => b.total - a.total);
  return { systems, domains, comps, all, unmapped, ready: ww ? Math.round(kw.reduce((n, x) => n + x.pct * x.w, 0) / ww) : null, covered: base.length ? Math.round((kw.length / base.length) * 100) : 0, priorities };
}
function BpRows({ rows, T, t, picked, onPick, onStudy }) {
  return (
    <div style={{ display: "grid", gap: 12 }}>
      {rows.map((r) => {
        const col = r.pct == null ? T.muted : r.pct >= r.target ? T.green : r.pct >= r.target - 10 ? T.amber : T.red; const top = r.match[0];
        return (
          <div key={r.id}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <input type="checkbox" checked={picked.includes(top)} onChange={() => onPick(top)} aria-label={r.name} style={{ margin: 0 }} />
              <button onClick={() => onStudy(top)} title={t("spStartBlock", { s: top })} style={{ flex: "1 1 140px", minWidth: 0, textAlign: "left", background: "transparent", border: "none", padding: 0, cursor: "pointer", fontFamily: FONT_UI, fontWeight: 600, fontSize: fs(13.5), color: T.ink, overflowWrap: "anywhere" }}>{r.name}</button>
              {r.prio && <Star size={14} color={T.amber} fill={T.amber} aria-label={t("tbCourses")} />}
              {r.thisWeek && <Pill T={T} tone="blue">{t("spThisWeek")}</Pill>}
              <Pill T={T} tone={r.pct == null ? "muted" : r.pct >= r.target ? "green" : r.pct >= r.target - 10 ? "amber" : "red"}>{r.pct == null ? t("tuNoData") : `${r.pct}%`}</Pill>
            </div>
            <div style={{ position: "relative", height: 8, borderRadius: 999, background: T.mutedBg, marginTop: 6 }}>
              <div style={{ width: `${Math.min(100, r.pct || 0)}%`, height: "100%", borderRadius: 999, background: col }} />
              <div title={t("tbTarget", { n: r.target })} style={{ position: "absolute", top: -3, bottom: -3, left: `${Math.min(99, r.target)}%`, width: 2, background: T.ink }} />
            </div>
            <div style={{ fontFamily: FONT_MONO, fontSize: fs(11.5), color: T.muted, marginTop: 3 }}>{t("tbShareLine", { n: r.total, share: Math.round(r.share), w: Math.round(r.w), target: r.target })}</div>
          </div>
        );
      })}
    </div>
  );
}
function GapTable({ st, kind, setKind, T, t, onStudy, open, setOpen }) {
  const kinds = [["systems", "tbSystems"], ["domains", "tbDomains"], ["comps", "tbComps"]].filter(([k]) => st[k].length);
  const k = st[kind] && st[kind].length ? kind : kinds[0] && kinds[0][0]; if (!k) return null;
  const gapOf = (r) => (r.pct == null ? null : r.target - r.pct);
  const rows = [...st[k]].sort((a, b) => (gapOf(b) == null ? -999 : gapOf(b)) - (gapOf(a) == null ? -999 : gapOf(a)));
  const worst = rows.find((r) => gapOf(r) > 0); const under = st.all ? [...st[k]].filter((r) => r.w > 0).sort((a, b) => (b.w - b.share) - (a.w - a.share))[0] : null;
  const cols = "minmax(130px, 2.2fr) repeat(4, minmax(58px, 1fr))"; const cell = { fontFamily: FONT_MONO, fontSize: fs(12), color: T.ink, textAlign: "right" };
  const headC = { ...cell, fontFamily: FONT_UI, fontWeight: 700, fontSize: fs(11), color: T.muted, textTransform: "uppercase", letterSpacing: "0.04em" };
  return (
    <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20, minWidth: 0 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: open ? 6 : 0, flexWrap: "wrap", fontFamily: FONT_UI, fontWeight: 700, fontSize: fs(15), color: T.ink }}>
        <button onClick={() => setOpen(!open)} aria-expanded={open} style={{ flex: "1 1 auto", display: "flex", alignItems: "center", gap: 8, background: "transparent", border: "none", padding: 0, cursor: "pointer", textAlign: "left", fontFamily: FONT_UI, fontWeight: 700, fontSize: fs(15), color: T.ink }}><TrendingUp size={17} color={T.blue} />{t("tbGapTitle")}<span style={{ marginLeft: "auto", display: "flex" }}>{open ? <ChevronUp size={16} color={T.muted} /> : <ChevronDown size={16} color={T.muted} />}</span></button>
        {open && <span style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {kinds.map(([id, lab]) => <button key={id} onClick={() => setKind(id)} aria-pressed={k === id} style={{ fontFamily: FONT_UI, fontWeight: 600, fontSize: fs(12), color: k === id ? T.onBlue : T.ink, background: k === id ? T.blue : "transparent", border: `1px solid ${k === id ? T.blue : T.border}`, borderRadius: 999, padding: "4px 12px", cursor: "pointer" }}>{t(lab)}</button>)}
        </span>}
      </div>
      {open && (<>
      <div style={{ fontFamily: FONT_UI, fontSize: fs(12.5), color: T.muted, lineHeight: 1.5, marginBottom: 12 }}>{t("tbGapHint")}</div>
      {st.all === 0 ? <div style={{ fontFamily: FONT_UI, fontSize: fs(13), color: T.muted }}>{t("tbGapNone")}</div> : (
        <>
          {(worst || under) && <div style={{ fontFamily: FONT_UI, fontSize: fs(13), color: T.ink, lineHeight: 1.5, marginBottom: 12 }}>{[worst ? t("tbGapWorst", { a: worst.name, n: gapOf(worst) }) : "", under && under.w - under.share > 1 ? t("tbGapUnder", { b: under.name }) : ""].filter(Boolean).join(" ")}</div>}
          <div style={{ overflowX: "auto" }}>
            <div style={{ minWidth: 460, display: "grid", gap: 0 }}>
              <div style={{ display: "grid", gridTemplateColumns: cols, gap: 8, padding: "0 0 6px", borderBottom: `1px solid ${T.border}` }}>
                <span style={{ ...headC, textAlign: "left" }}>{t(kinds.find(([id]) => id === k)[1])}</span><span style={headC}>{t("tbColExam")}</span><span style={headC}>{t("tbColPractice")}</span><span style={headC}>{t("tbColAcc")}</span><span style={headC}>{t("tbColGap")}</span>
              </div>
              {rows.map((r) => { const g = gapOf(r); const dp = Math.round(r.share - r.w); return (
                <div key={r.id} style={{ display: "grid", gridTemplateColumns: cols, gap: 8, alignItems: "center", padding: "8px 0", borderBottom: `1px solid ${T.border}` }}>
                  <button onClick={() => onStudy(r.match[0])} title={t("spStartBlock", { s: r.match[0] })} style={{ textAlign: "left", background: "transparent", border: "none", padding: 0, cursor: "pointer", fontFamily: FONT_UI, fontWeight: 600, fontSize: fs(13), color: T.ink, overflowWrap: "anywhere" }}>{r.name}</button>
                  <span style={cell}>{Math.round(r.w)}%</span>
                  <span style={{ ...cell, color: st.all && dp <= -3 ? T.amber : T.ink }}>{Math.round(r.share)}%</span>
                  <span style={cell}>{r.pct == null ? "—" : `${r.pct}%`}</span>
                  <span style={{ ...cell, fontWeight: 700, color: g == null ? T.muted : g > 10 ? T.red : g > 0 ? T.amber : T.green }}>{g == null ? "—" : g > 0 ? `−${g}` : `+${-g}`}</span>
                </div>
              ); })}
            </div>
          </div>
        </>
      )}
      {st.unmapped.length > 0 && (
        <div style={{ marginTop: 14 }}>
          <div style={{ fontFamily: FONT_UI, fontWeight: 700, fontSize: fs(11.5), color: T.muted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>{t("tbUnmapped")}</div>
          <div style={{ fontFamily: FONT_UI, fontSize: fs(12), color: T.muted, marginBottom: 6 }}>{t("tbUnmappedHint")}</div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>{st.unmapped.slice(0, 12).map((x) => <Pill key={x.subject} T={T} tone="muted">{`${x.subject} · ${x.total}`}</Pill>)}</div>
        </div>
      )}
      </>)}
    </div>
  );
}
// Tutor page = the tutor dashboard (blueprint, readiness, priorities) with the Study Profile (term, plan inputs, syllabus, AI profile) as its second section.
// Study Hub: the tutor dashboard (readiness, priorities, blueprint) and the Study Profile (term, exams, syllabus, plan, setup)
// on ONE page, with one header and a sticky section bar. Anything that used to open "Tutor" or "Profile" lands here.
function StudyHub({ library, sessionLog, onLaunch, onNavigate, T }) {
  const { t, lang } = useI18n(); const sp = useContext(ProfileContext); const careerCtx = useContext(CareerContext);
  const phone = useViewport().w < 640;
  const dayKey = new Date().toDateString();
  const brief = useMemo(() => (sp.profile ? tutorBrief(sp.profile, sessionLog, new Date()) : null), [sp.profile, sessionLog, dayKey]); // eslint-disable-line
  const bp = sp.bpStore && sp.bpStore.bp;
  const sections = [["sh-profile", t("shNavProfile"), UserIcon], ["sh-priorities", t("shNavPriorities"), Flame], ["sh-blueprint", t("shNavBlueprint"), Target]];
  const [active, setActive] = useState("sh-profile");
  const jump = useCallback((id) => {
    let el = document.getElementById(id);
    if (!el && id !== "sh-profile") el = document.getElementById("sh-priorities") || document.getElementById("sh-profile"); // no blueprint yet: the anchors below still exist
    if (el) { setActive(id); el.scrollIntoView({ behavior: "smooth", block: "start" }); }
  }, []);
  useEffect(() => { // "profile" navigation from anywhere (tutor card, calendar, notifications) lands on the Study Profile section
    const go = () => jump("sh-profile");
    window.addEventListener("oworld-profile-jump", go);
    return () => window.removeEventListener("oworld-profile-jump", go);
  }, [jump]);
  useEffect(() => { // highlight the section being read
    if (typeof IntersectionObserver === "undefined") return undefined;
    const seen = new Map();
    const io = new IntersectionObserver((es) => {
      es.forEach((e) => seen.set(e.target.id, e.isIntersecting ? e.boundingClientRect.top : null));
      const vis = [...seen.entries()].filter(([, top]) => top != null).sort((x, y) => Math.abs(x[1]) - Math.abs(y[1]));
      if (vis.length) setActive(vis[0][0]);
    }, { rootMargin: `-${56 + (parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--oworld-sticky-h")) || 0)}px 0px -55% 0px`, threshold: 0 });
    sections.forEach(([id]) => { const el = document.getElementById(id); if (el) io.observe(el); });
    return () => io.disconnect();
  }, [!!bp, !!sp.profile]); // eslint-disable-line
  const line = careerCtx.hasData ? careerLine(careerCtx.career, t) : "";
  return (
    <div style={{ display: "grid", gap: 20 }}>
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <GraduationCap size={phone ? 24 : 28} color={T.blue} />
          <h1 style={{ margin: 0, fontFamily: FONT_DISPLAY, fontSize: fs(phone ? 26 : 32), fontWeight: 600, color: T.ink }}>{t("shTitle")}</h1>
          {brief && <Pill T={T} tone={brief.phase === "in" ? "blue" : "muted"}>{spWeekLabel(brief, t)}</Pill>}
          {bp && <Pill T={T} tone="muted">{bp.exam}</Pill>}
        </div>
        <p style={{ margin: "6px 0 0", maxWidth: 680, fontFamily: FONT_UI, fontSize: fs(13.5), color: T.muted, lineHeight: 1.55 }}>{t("shSub")}{line ? ` ${line}` : ""}</p>
      </div>

      <nav aria-label={t("shJumpTo")} style={{ position: "sticky", top: "var(--oworld-sticky-h, 0px)", zIndex: 5, background: T.paper, borderBottom: `1px solid ${T.border}`, margin: "0 -4px", padding: "8px 4px", overflowX: "auto", overflowY: "hidden", touchAction: "pan-x" }}>
        <div style={{ display: "flex", gap: 6, width: "max-content" }}>
          {sections.map(([id, label, Ic]) => {
            const on = active === id;
            return (
              <button key={id} onClick={() => jump(id)} aria-current={on ? "true" : undefined} style={{
                display: "flex", alignItems: "center", gap: 6, padding: "7px 13px", borderRadius: 999, cursor: "pointer", whiteSpace: "nowrap",
                background: on ? T.blue : "transparent", color: on ? "#fff" : T.ink, border: `1px solid ${on ? T.blue : T.border}`,
                fontFamily: FONT_UI, fontWeight: 600, fontSize: fs(13),
              }}><Ic size={14} />{label}</button>
            );
          })}
        </div>
      </nav>

      <div id="sh-profile" style={{ borderBottom: `1px solid ${T.border}`, paddingBottom: 28, scrollMarginTop: "calc(var(--oworld-sticky-h, 0px) + 64px)", display: "grid", gap: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: FONT_UI, fontWeight: 700, fontSize: fs(20), color: T.ink }}><UserIcon size={20} color={T.blue} />{t("shNavProfile")}</div>
        <StudentProfilePanel embedded T={T} sessionLog={sessionLog} onNavigate={onNavigate} />
      </div>
      <TutorDashboard embedded library={library} sessionLog={sessionLog} onLaunch={onLaunch} onNavigate={onNavigate} T={T} />
    </div>
  );
}
function TutorDashboard({ library, sessionLog, onLaunch, onNavigate, T, embedded = false }) {
  const { t, lang } = useI18n(); const sp = useContext(ProfileContext); const { notify } = useContext(NotifContext);
  const bpStore = sp.bpStore; const bp = bpStore.bp; const saveBp = bpStore.save; const locale = lang === "es" ? "es" : "en-US"; const [text, setText] = useState(""); const [err, setErr] = useState(""); const [open, setOpen] = useState(false); const [showP, setShowP] = useState(false); const [showS, setShowS] = useState(false); const [gapKind, setGapKind] = useState("systems"); const [gapOpen, setGapOpen] = useState(false); const [confOpen, setConfOpen] = useState(false); const [mapsOpen, setMapsOpen] = useState({}); const panelRef = useRef(null);
  const [picked, setPicked] = useState([]); const [copied, setCopied] = useState(""); const fileRef = useRef(null);
  const dayKey = new Date().toDateString();
  const brief = useMemo(() => (sp.profile ? tutorBrief(sp.profile, sessionLog, new Date()) : null), [sp.profile, sessionLog, dayKey]); // eslint-disable-line
  const fr = useMemo(() => (bp ? bpFreshness(bp, sp.profile, new Date()) : null), [bp, sp.profile, dayKey]); // eslint-disable-line
  const conf = useMemo(() => (bp ? bpConfidence(bp, new Date()) : null), [bp, dayKey]); // eslint-disable-line
  const confTone = conf ? (conf.level === "high" ? "green" : conf.level === "medium" ? "amber" : "red") : "muted";
  const cv = (v) => (v && v.g ? { ...v, g: t(v.g) } : v);
  const prioCourse = sp.profile ? (sp.profile.courses || []).find((c) => c.priority) : null;
  const prioFocus = useMemo(() => { const w = prioCourse && brief ? (prioCourse.weeks || []).find((x) => x.week === brief.week) : null; return w ? [...(w.qbankFocus || []), ...(w.topics || [])] : []; }, [prioCourse, brief]);
  const st = useMemo(() => (bp ? bpStats(bp, sessionLog, brief ? brief.studyFocus : [], prioFocus) : null), [bp, sessionLog, brief, prioFocus]);
  const card = { background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20, minWidth: 0 };
  const head = (Ic, label, extra) => <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, fontFamily: FONT_UI, fontWeight: 700, fontSize: fs(15), color: T.ink }}><Ic size={17} color={T.blue} />{label}{extra}</div>;
  const hint = { fontFamily: FONT_UI, fontSize: fs(12.5), color: T.muted, lineHeight: 1.5 };
  const grid = (min) => ({ display: "grid", gridTemplateColumns: `repeat(auto-fit, minmax(min(100%, ${min}px), 1fr))`, gap: 16, alignItems: "start" });
  const openPanel = () => { setOpen(true); setTimeout(() => panelRef.current && panelRef.current.scrollIntoView({ behavior: "smooth", block: "start" }), 50); };
  const load = (raw) => {
    const r = parseBlueprint(raw); if (r.error) { setErr(t(r.error)); return; }
    saveBp(r.bp); setErr(""); setText(""); setOpen(false); setPicked([]);
    notify({ kind: "blueprintLoaded", tone: "green", dedupe: "blueprintLoaded", vars: { exam: r.bp.exam } });
  };
  const copy = (k, s) => { try { navigator.clipboard.writeText(s); setCopied(k); setTimeout(() => setCopied(""), 1500); } catch (e) { /* ignore */ } };
  const study = (topics) => { sp.seedFocus(Array.isArray(topics) ? topics.join(", ") : topics); onNavigate("import"); };
  const pick = (n) => setPicked((p) => (p.includes(n) ? p.filter((x) => x !== n) : [...p, n]));
  const exp = () => { const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([JSON.stringify(bp, null, 2)], { type: "application/json" })); a.download = "oword_blueprint.json"; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000); };
  const daysTo = bp && bp.targetDate ? dayDiff(startOfDay(new Date()), parseISODate(bp.targetDate) || new Date()) : brief && brief.next ? brief.next.days : null;
  const topics = picked.length ? picked : st ? st.priorities.slice(0, 4).map((x) => x.match[0]) : brief ? brief.studyFocus : [];
  const matches = useMemo(() => library.map((e) => ({ e, n: e.questions.filter((q) => topics.some((f) => topicMatch(f, q.subject))).length })).filter((x) => x.n > 0).sort((a, b) => b.n - a.n).slice(0, 6), [library, topics.join("|")]); // eslint-disable-line
  const ell = { whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" };
  const tile = (label, value, sub) => <div style={{ ...card, padding: "14px 16px", height: 112, boxSizing: "border-box", display: "flex", flexDirection: "column", justifyContent: "space-between", overflow: "hidden" }}><div style={{ ...ell, fontFamily: FONT_UI, fontWeight: 700, fontSize: fs(11.5), color: T.muted, textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</div><div style={{ ...ell, fontFamily: FONT_UI, fontWeight: 700, fontSize: fs(24), color: T.ink }}>{value}</div><div style={{ ...ell, ...hint, fontSize: fs(11.5), minHeight: 17 }}>{sub || ""}</div></div>;

  return (
    <div style={{ display: "grid", gap: 16 }}>
      {!embedded && <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <GraduationCap size={22} color={T.blue} />
        <h2 style={{ margin: 0, fontFamily: FONT_UI, fontWeight: 700, fontSize: fs(22), color: T.ink }}>{t("tbTitle")}</h2>
        {brief && <Pill T={T} tone={brief.phase === "in" ? "blue" : "muted"}>{spWeekLabel(brief, t)}</Pill>}
        {bp && <Pill T={T} tone="muted">{bp.exam}</Pill>}
        <span style={{ marginLeft: "auto", display: "flex", gap: 8, flexWrap: "wrap" }}>
          <GhostButton T={T} icon={Target} onClick={openPanel}>{t("tbBpTitle")}</GhostButton>
          <GhostButton T={T} icon={UserIcon} onClick={() => { const el = document.getElementById("study-profile"); if (el) el.scrollIntoView({ behavior: "smooth", block: "start" }); }}>{t("tabProfile")}</GhostButton>
        </span>
      </div>}

      {bp && fr && (fr.due || fr.soon) && (
        <div role="status" style={{ ...card, padding: "14px 18px", borderColor: fr.due ? T.amber : T.blue, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <AlertTriangle size={18} color={fr.due ? T.amber : T.blue} />
          <span style={{ flex: "1 1 240px", minWidth: 0, fontFamily: FONT_UI, fontSize: fs(13.5), color: T.ink, lineHeight: 1.45 }}>{fr.newTerm ? t("tbDueTerm") : fr.due ? t("tbDue", { n: fr.ageDays }) : t("tbSoon", { n: fr.ageDays })}</span>
          <GhostButton T={T} icon={RefreshCw} onClick={openPanel}>{t("tbUpdate")}</GhostButton>
        </div>
      )}


      <div id="sh-priorities" style={{ ...grid(360), scrollMarginTop: "calc(var(--oworld-sticky-h, 0px) + 64px)" }}>
        <TutorCard sessionLog={sessionLog} onNavigate={onNavigate} T={T} hideLinks={embedded} />
        {st ? (
          <div style={card}>
            {head(Flame, t("tbPriority"))}
            <div style={{ ...hint, marginBottom: 12 }}>{t("tbPriorityHint")}</div>
            <BpRows rows={st.priorities.slice(0, 6)} T={T} t={t} picked={picked} onPick={pick} onStudy={study} />
            <div style={{ marginTop: 14 }}><PrimaryButton T={T} icon={Play} disabled={!picked.length} onClick={() => study(picked)}>{t("tbBuild", { n: picked.length })}</PrimaryButton></div>
          </div>
        ) : (
          <div style={card}>{head(Target, t("tbNoBpTitle"))}<div style={hint}>{t("tbNoBpBody")}</div><div style={{ marginTop: 12 }}><PrimaryButton T={T} icon={Target} onClick={openPanel}>{t("tbBpTitle")}</PrimaryButton></div></div>
        )}
      </div>

      {(matches.length > 0 || library.length > 0) && (
        <div style={card}>
          {head(BookOpen, t("tbMatches"))}
          {matches.length ? (
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>{matches.map(({ e, n }) => <GhostButton key={e.id} T={T} icon={Play} onClick={() => onLaunch([e.id])}>{t("spLibStart", { title: e.title, n })}</GhostButton>)}</div>
          ) : <div style={hint}>{t("tbNoMatches")}</div>}
          <div style={{ ...hint, marginTop: 8 }}>{(topics || []).join(" · ")}</div>
        </div>
      )}

      {st && <GapTable st={st} kind={gapKind} setKind={setGapKind} T={T} t={t} onStudy={study} open={gapOpen} setOpen={setGapOpen} />}

      {st && (
        <div style={grid(340)}>
          {[["systems", "tbSystems"], ["domains", "tbDomains"], ["comps", "tbComps"]].filter(([k]) => st[k].length).map(([k, label]) => (
            <div key={k} style={card}>
              <button onClick={() => setMapsOpen({ ...mapsOpen, [k]: !mapsOpen[k] })} aria-expanded={!!mapsOpen[k]} style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", background: "transparent", border: "none", padding: 0, marginBottom: mapsOpen[k] ? 12 : 0, cursor: "pointer", textAlign: "left", fontFamily: FONT_UI, fontWeight: 700, fontSize: fs(15), color: T.ink }}><BarChart3 size={17} color={T.blue} />{t(label)}<Pill T={T} tone="muted">{st[k].length}</Pill><span style={{ marginLeft: "auto", display: "flex" }}>{mapsOpen[k] ? <ChevronUp size={16} color={T.muted} /> : <ChevronDown size={16} color={T.muted} />}</span></button>
              {mapsOpen[k] && <BpRows rows={st[k]} T={T} t={t} picked={picked} onPick={pick} onStudy={study} />}
            </div>
          ))}
        </div>
      )}
      {st && <div style={hint}>{t("tbLegend")}{bp.note ? ` ${bp.note}` : ""}{bp.source && (bp.source.urls.length || bp.source.outlineVersion) ? ` ${t("tbSource", { v: [bp.source.outlineVersion, bp.source.retrievedOn].filter(Boolean).join(", "), u: bp.source.urls.join(" ") })}` : ` ${t("tbNoSource")}`}</div>}

      {bp && conf && (
        <div style={card}>
          <button onClick={() => setConfOpen(!confOpen)} aria-expanded={confOpen} style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", background: "transparent", border: "none", padding: 0, marginBottom: confOpen ? 12 : 0, cursor: "pointer", textAlign: "left", fontFamily: FONT_UI, fontWeight: 700, fontSize: fs(15), color: T.ink }}><ShieldCheck size={17} color={T.blue} />{t("tbConf")}<Pill T={T} tone={confTone}>{`${t(`tbConfLvl.${conf.level}`)} · ${conf.score}/100`}</Pill><span style={{ marginLeft: "auto", display: "flex" }}>{confOpen ? <ChevronUp size={16} color={T.muted} /> : <ChevronDown size={16} color={T.muted} />}</span></button>
          {confOpen && (<>
          <div style={{ display: "grid", gap: 6 }}>
            {conf.good.map((g) => <div key={g.k} style={{ display: "flex", gap: 8, alignItems: "flex-start", fontFamily: FONT_UI, fontSize: fs(13), color: T.ink, lineHeight: 1.45 }}><Check size={14} color={T.green} style={{ flexShrink: 0, marginTop: 2 }} /><span>{t(`tbCg.${g.k}`, cv(g.v))}</span></div>)}
            {conf.flags.map((g, i) => <div key={`${g.k}${i}`} style={{ display: "flex", gap: 8, alignItems: "flex-start", fontFamily: FONT_UI, fontSize: fs(13), color: T.ink, lineHeight: 1.45 }}><AlertTriangle size={14} color={T.amber} style={{ flexShrink: 0, marginTop: 2 }} /><span>{t(`tbCf.${g.k}`, cv(g.v))}</span></div>)}
          </div>
          {conf.flags.some((g) => g.k === "weights") && <div style={{ marginTop: 10 }}><GhostButton T={T} icon={SlidersHorizontal} onClick={() => saveBp(scaleBp(bp), true)}>{t("tbScale")}</GhostButton><div style={{ ...hint, marginTop: 4 }}>{t("tbScaleHint")}</div></div>}
          <div style={{ ...hint, marginTop: 10 }}>{t("tbCadence")}{fr && fr.dueOn ? ` ${t("tbDueOn", { d: fr.dueOn.toLocaleDateString(locale, { month: "short", day: "numeric", year: "numeric" }) })}` : ""}</div>
          <div style={{ marginTop: 10 }}><GhostButton T={T} icon={RefreshCw} onClick={openPanel}>{t("tbUpdate")}</GhostButton></div>
          </>)}
        </div>
      )}

      <div ref={panelRef} id="sh-blueprint" style={{ ...card, scrollMarginTop: "calc(var(--oworld-sticky-h, 0px) + 64px)" }}>
        <button onClick={() => setOpen(!open)} aria-expanded={open} style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", background: "transparent", border: "none", padding: 0, cursor: "pointer", textAlign: "left" }}>
          <Target size={17} color={T.blue} /><span style={{ fontFamily: FONT_UI, fontWeight: 700, fontSize: fs(15), color: T.ink }}>{t("tbBpTitle")}</span>
          {bp && <Pill T={T} tone="muted">{bp.exam}{bp.version ? ` · ${bp.version}` : ""}</Pill>}
          {conf && <Pill T={T} tone={confTone}>{t(`tbConfLvl.${conf.level}`)}</Pill>}
          <span style={{ marginLeft: "auto", display: "flex" }}>{open ? <ChevronUp size={16} color={T.muted} /> : <ChevronDown size={16} color={T.muted} />}</span>
        </button>
        {open && (
          <div style={{ marginTop: 12, display: "grid", gap: 14 }}>
            <div style={hint}>{t("tbBpBody")} {t("tbCadence")}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              {bpStore.sync.available ? <Pill T={T} tone="green">{t("spSyncDrive")}</Pill> : <span style={hint}>{t("spSyncLocal")}</span>}
              {bpStore.sync.available && <button onClick={bpStore.sync.syncNow} disabled={bpStore.sync.status === "busy"} style={{ fontFamily: FONT_UI, fontWeight: 600, fontSize: fs(12.5), color: T.blue, background: "transparent", border: "none", cursor: "pointer", padding: 4 }}>{t("syncNow")}</button>}
            </div>
            {[["p", t("tbBpPrompt"), BP_PROMPT, showP, setShowP], ["s", t("tbBpSchema"), JSON.stringify(BP_TEMPLATE, null, 2), showS, setShowS]].map(([key, label, body, shown, setShown]) => (
              <div key={key}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, gap: 8 }}>
                  <button onClick={() => setShown(!shown)} aria-expanded={shown} style={{ display: "flex", alignItems: "center", gap: 6, background: "transparent", border: "none", padding: 0, cursor: "pointer", fontFamily: FONT_UI, fontWeight: 600, fontSize: fs(12.5), color: T.ink, textTransform: "uppercase", letterSpacing: "0.05em", textAlign: "left" }}>{label}{shown ? <ChevronUp size={15} color={T.muted} /> : <ChevronDown size={15} color={T.muted} />}</button>
                  <button onClick={() => copy(key, body)} style={{ fontFamily: FONT_UI, fontSize: fs(12.5), fontWeight: 600, color: copied === key ? T.green : T.blue, background: "transparent", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}>
                    {copied === key ? <Check size={14} /> : <Copy size={14} />} {copied === key ? t("copied") : t("copy")}
                  </button>
                </div>
                {shown && <pre style={{ fontFamily: FONT_MONO, fontSize: fs(11.5), color: T.ink, background: T.paper, border: `1px solid ${T.border}`, borderRadius: 8, padding: 14, whiteSpace: "pre-wrap", wordBreak: "break-word", lineHeight: 1.6, margin: 0, maxHeight: 220, overflow: "auto" }}>{body}</pre>}
              </div>
            ))}
            <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder={t("tbPaste")} rows={5} style={{ width: "100%", boxSizing: "border-box", fontFamily: FONT_MONO, fontSize: fs(12), color: T.ink, background: T.mutedBg, border: `1px solid ${T.border}`, borderRadius: 8, padding: 10 }} />
            {err && <div role="alert" style={{ fontFamily: FONT_UI, fontSize: fs(13), color: T.red }}>{err}</div>}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <PrimaryButton T={T} onClick={() => load(text)} disabled={!text.trim()}>{t("tbLoad")}</PrimaryButton>
              <GhostButton T={T} icon={Sparkles} onClick={() => load(JSON.stringify(BP_TEMPLATE))}>{t("tbTemplate")}</GhostButton>
              <GhostButton T={T} icon={Upload} onClick={() => fileRef.current && fileRef.current.click()}>{t("spUpload")}</GhostButton>
              <input ref={fileRef} type="file" accept=".json,application/json" style={{ display: "none" }} onChange={async (e) => { const f = e.target.files && e.target.files[0]; e.target.value = ""; if (f) load(await f.text()); }} />
              {bp && <GhostButton T={T} icon={Download} onClick={exp}>{t("spExport")}</GhostButton>}
              {bp && <GhostButton T={T} icon={Trash2} onClick={() => { saveBp(null); setPicked([]); setOpen(true); }}>{t("tbRemove")}</GhostButton>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ---- Plan manager (Study Profile): the whole task list with a completed tally, filters, grouping, inline editing and live calendar links ----
const PLAN_PRIORITIES = ["high", "normal", "low"];
const PLAN_BLANK = { title: "", due: "", time: "", kind: "other", subject: "", priority: "normal", notes: "" };
const PLAN_PRI_RANK = { high: 0, normal: 1, low: 2 };
const PLAN_GROUPS = ["overdue", "today", "upcoming", "nodate", "done"];
const planNewId = () => `usr-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

function PlanManager({ profile, sp, brief, T, t, lang, phone, onNavigate, inline = false, agenda = [], api = null, query = null, children = null, headExtra = null }) {
  const locale = lang === "es" ? "es" : "en-US";
  const tasks = (profile && profile.plan && profile.plan.tasks) || [];
  const today = startOfDay(new Date()); const todayKey = toISODate(today);
  const [draft, setDraft] = useState(PLAN_BLANK);
  const [moreOpts, setMoreOpts] = useState(false);
  const [typeOpen, setTypeOpen] = useState(false); // the Task / Event / Exam picker only shows after Add is pressed
  const [filter, setFilter] = useState("all");
  const [kindF, setKindF] = useState("all");
  const [qLocal, setQLocal] = useState("");
  const q = query != null ? query : qLocal; // the Schedule page passes its own search box down, so one search drives the calendar and the plan
  const [doneOpen, setDoneOpen] = useState(false);
  const [upOpen, setUpOpen] = useState(false); // Upcoming starts collapsed; the chevron opens it
  const [editId, setEditId] = useState(null);
  const [edit, setEdit] = useState(PLAN_BLANK);
  const [toast, setToast] = useState(null);
  useEffect(() => { if (!toast) return undefined; const id = setTimeout(() => setToast(null), 7000); return () => clearTimeout(id); }, [toast]);

  const isCal = (k) => String(k.id).startsWith("cal-"); // an exam / event ticked from the calendar: it lives in the plan so it counts, but its details belong to the calendar
  const bucketOf = (k) => {
    if (k.done) return "done";
    const d = parseISODate(k.due); if (!d) return "nodate";
    const n = dayDiff(today, d); return n < 0 ? "overdue" : n === 0 ? "today" : "upcoming";
  };
  const counts = { overdue: 0, today: 0, upcoming: 0, nodate: 0, done: 0 };
  tasks.forEach((k) => { counts[bucketOf(k)] += 1; });
  const total = tasks.length; const done = counts.done; const open = total - done;
  const pct = total ? Math.round((done / total) * 100) : 0;
  const doneToday = tasks.filter((k) => k.done && k.doneAt && toISODate(new Date(k.doneAt)) === todayKey).length;
  const clearable = tasks.filter((k) => k.done && !isCal(k));
  const lateOnes = tasks.filter((k) => bucketOf(k) === "overdue" && !isCal(k));
  // Exams, classes and events of the next days sit in the same list; they have their own actions and don't change the task tally.
  const agendaRows = (agenda || []).map((a) => ({ ...a, due: a.date, kind: a.src === "exam" ? "exam" : a.src === "class" ? "class" : "other" }));
  const allRows = [...tasks, ...agendaRows];

  // Every change goes through here: one atomic update and (with a message) an Undo that restores the previous list.
  const commit = (next, msg) => { const before = tasks; sp.setCal({ tasks: next }); if (msg) setToast({ msg, undo: () => sp.setCal({ tasks: before }) }); };

  function addItem() {
    const title = draft.title.trim().slice(0, 200); if (!title) return;
    sp.addTask({ id: planNewId(), title, due: parseISODate(draft.due) ? draft.due : null, time: draft.time || null, subject: draft.subject.trim().slice(0, 80) || null, kind: draft.kind, priority: draft.priority, notes: null, done: false });
    setDraft(PLAN_BLANK);
  }
  function startEdit(k) {
    setEditId(k.id);
    setEdit({ title: k.title, due: k.due || "", time: k.time || "", kind: k.kind || "other", subject: k.subject || "", priority: k.priority || "normal", notes: k.notes || "" });
  }
  function saveEdit() {
    const title = edit.title.trim().slice(0, 200); if (!title) return;
    commit(tasks.map((k) => (k.id === editId ? { ...k, title, due: parseISODate(edit.due) ? edit.due : null, time: edit.time || null, subject: edit.subject.trim().slice(0, 80) || null, kind: edit.kind, priority: edit.priority, notes: edit.notes.trim().slice(0, 200) || null } : k)));
    setEditId(null);
  }
  const removeOne = (k) => { commit(tasks.filter((x) => x.id !== k.id), t("calDeleted", { s: k.title })); if (editId === k.id) setEditId(null); };
  const clearDone = () => { const ids = new Set(clearable.map((k) => k.id)); commit(tasks.filter((k) => !ids.has(k.id)), t("plClearedN", { n: ids.size })); };
  const moveLate = () => { const ids = new Set(lateOnes.map((k) => k.id)); commit(tasks.map((k) => (ids.has(k.id) ? { ...k, due: todayKey } : k)), t("plMovedN", { n: ids.size })); };

  // ---- filtering and ordering ----
  const ql = q.trim().toLowerCase();
  const shown = allRows.filter((k) => (filter === "all" || (filter === "open" ? !k.done : bucketOf(k) === filter))
    && (kindF === "all" || (k.kind || "other") === kindF)
    && (!ql || [k.title, k.subject, k.notes].filter(Boolean).join(" ").toLowerCase().includes(ql)));
  const byDue = (a, b) => ((a.due || "9999") < (b.due || "9999") ? -1 : (a.due || "9999") > (b.due || "9999") ? 1 : 0)
    || ((a.time || "99") < (b.time || "99") ? -1 : (a.time || "99") > (b.time || "99") ? 1 : 0)
    || (PLAN_PRI_RANK[a.priority || "normal"] - PLAN_PRI_RANK[b.priority || "normal"]);
  const groupItems = (g) => shown.filter((k) => bucketOf(k) === g).sort(g === "done" ? (a, b) => (Number(b.doneAt) || 0) - (Number(a.doneAt) || 0) : byDue);

  // ---- styles ----
  const headTxt = { fontFamily: FONT_UI, fontWeight: 600, fontSize: fs(14), color: T.ink };
  const sect = { fontFamily: FONT_UI, fontWeight: 700, fontSize: fs(11.5), color: T.muted, textTransform: "uppercase", letterSpacing: "0.06em" };
  const inp = { fontFamily: FONT_UI, fontSize: fs(13), color: T.ink, background: T.paper, border: `1px solid ${T.border}`, borderRadius: 8, padding: "7px 9px", outline: "none", minWidth: 0, boxSizing: "border-box" };
  const iconBtn = { background: "transparent", border: "none", cursor: "pointer", color: T.muted, padding: 4, display: "flex" };
  const FILTERS = [["all", T.ink, T.mutedBg, total], ["open", T.blue, T.blueLight, open], ["overdue", T.red, T.redLight, counts.overdue], ["today", T.amber, T.amberLight, counts.today], ["upcoming", T.amber, T.amberLight, counts.upcoming], ["nodate", T.muted, T.mutedBg, counts.nodate], ["done", T.green, T.greenLight, done]];
  const kinds = [...new Set([...tasks.map((k) => k.kind || "other"), "exam", "class"])];
  const field = (label, node, full) => <label style={{ display: "grid", gap: 3, minWidth: 0, ...(full ? { gridColumn: "1 / -1" } : {}) }}><span style={{ ...sect, fontSize: fs(11) }}>{label}</span>{node}</label>;
  const kindSel = (value, onChange) => <select value={value} onChange={(e) => onChange(e.target.value)} style={inp}>{SP_TASK_KINDS.map((x) => <option key={x} value={x}>{t(`plKind.${x}`)}</option>)}</select>;
  const priSel = (value, onChange) => <select value={value} onChange={(e) => onChange(e.target.value)} style={inp}>{PLAN_PRIORITIES.map((x) => <option key={x} value={x}>{t(`plPri.${x}`)}</option>)}</select>;
  const fmtDue = (d) => d.toLocaleDateString(locale, { weekday: "short", month: "short", day: "numeric" });

  // ---- one scheduled item (exam / class / event) ----
  const renderAgendaRow = (k) => {
    const tone = k.src === "exam" ? T.red : k.src === "class" ? T.purple : T.blue; const d = parseISODate(k.due);
    const meta = [d ? fmtDue(d) : null, k.time, k.sub].filter(Boolean).join(" · ");
    return (
      <div key={k.id} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "9px 0", borderBottom: `1px solid ${T.border}` }}>
        <span aria-hidden="true" style={{ width: 3, alignSelf: "stretch", borderRadius: 2, background: tone, flexShrink: 0 }} />
        <button onClick={() => api && api.tick(k)} role="checkbox" aria-checked={!!k.done} aria-label={k.title} style={{
          width: 22, height: 22, flexShrink: 0, marginTop: 1, borderRadius: 5, cursor: "pointer", padding: 0, display: "inline-flex", alignItems: "center", justifyContent: "center",
          background: k.done ? T.green : "transparent", border: `2px solid ${k.done ? T.green : tone}`, color: T.onBlue,
        }}>{k.done && <Check size={14} />}</button>
        <div style={{ flex: 1, minWidth: 0, opacity: k.done ? 0.6 : 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
            <span style={{ fontFamily: FONT_UI, fontSize: fs(13.5), color: T.ink, textDecoration: k.done ? "line-through" : "none", overflowWrap: "anywhere", lineHeight: 1.4 }}>{k.title}</span>
            <Pill T={T} tone={k.src === "exam" ? "red" : k.src === "class" ? "purple" : "blue"}>{t(`plSrc.${k.src}`)}</Pill>
          </div>
          {meta && <div style={{ fontFamily: FONT_UI, fontSize: fs(11.5), color: T.muted, marginTop: 3 }}>{d && <span style={{ fontWeight: 700, color: T.ink }}>{fmtDue(d)}</span>}{[k.time ? fmtClock(k.time, locale) : null, k.sub].filter(Boolean).map((x) => ` · ${x}`).join("")}</div>}
          {k.topics && k.topics.length > 0 && <div style={{ fontFamily: FONT_UI, fontSize: fs(12), color: T.muted, marginTop: 2 }}>{k.topics.join(" · ")}</div>}
        </div>
      </div>
    );
  };

  // ---- one task ----
  const renderRow = (k) => {
    if (k.src) return renderAgendaRow(k);
    if (editId === k.id) {
      const valid = edit.title.trim().length > 0; const set = (key, v) => setEdit((e) => ({ ...e, [key]: v }));
      return (
        <div key={k.id} role="group" aria-label={t("plEditTask")} onKeyDown={(e) => { if (e.key === "Escape") setEditId(null); }} style={{ border: `1px solid ${T.border}`, borderLeft: `4px solid ${T.amber}`, borderRadius: 8, padding: 12, margin: "8px 0", background: T.mutedBg, display: "grid", gap: 10 }}>
          <div style={{ fontFamily: FONT_UI, fontWeight: 700, fontSize: fs(13.5), color: T.ink }}>{t("plEditTask")}</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 10 }}>
            {field(t("calF.title"), <input autoFocus value={edit.title} maxLength={200} onChange={(e) => set("title", e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && valid) saveEdit(); }} style={{ ...inp, width: "100%" }} />, true)}
            {field(t("calF.date"), <input type="date" value={edit.due} onChange={(e) => set("due", e.target.value)} style={{ ...inp, width: "100%" }} />)}
            {field(t("calF.time"), <input type="time" value={edit.time} onChange={(e) => set("time", e.target.value)} style={{ ...inp, width: "100%" }} />)}
            {field(t("calF.type"), kindSel(edit.kind, (v) => set("kind", v)))}
            {field(t("plPriority"), priSel(edit.priority, (v) => set("priority", v)))}
            {field(t("calF.subject"), <input value={edit.subject} maxLength={80} onChange={(e) => set("subject", e.target.value)} style={{ ...inp, width: "100%" }} />, true)}
            {field(t("calF.notes"), <input value={edit.notes} maxLength={200} onChange={(e) => set("notes", e.target.value)} style={{ ...inp, width: "100%" }} />, true)}
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <PrimaryButton T={T} icon={Check} onClick={saveEdit} disabled={!valid}>{t("calSave")}</PrimaryButton>
            <GhostButton T={T} icon={X} onClick={() => setEditId(null)}>{t("calCancel")}</GhostButton>
            <GhostButton T={T} icon={Trash2} onClick={() => removeOne(k)} style={{ marginLeft: "auto" }}>{t("calDelete")}</GhostButton>
          </div>
        </div>
      );
    }
    const b = bucketOf(k); const d = parseISODate(k.due); const cal = isCal(k);
    const late = b === "overdue" ? Math.max(1, -dayDiff(today, d)) : 0;
    const accent = k.done ? T.green : late ? T.red : T.amber; // calendar: task = amber, overdue = red, done = green
    const dueColor = accent;
    return (
      <div key={k.id} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "9px 0", borderBottom: `1px solid ${T.border}` }}>
        <span aria-hidden="true" style={{ width: 3, alignSelf: "stretch", borderRadius: 2, background: accent, flexShrink: 0 }} />
        <button onClick={() => sp.toggleTask(k.id)} role="checkbox" aria-checked={!!k.done} aria-label={k.title} style={{
          width: 22, height: 22, flexShrink: 0, marginTop: 1, borderRadius: 5, cursor: "pointer", padding: 0, display: "inline-flex", alignItems: "center", justifyContent: "center",
          background: k.done ? T.green : "transparent", border: `2px solid ${accent}`, color: T.onBlue,
        }}>{k.done && <Check size={14} />}</button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 6 }}>
            {k.priority === "high" && !k.done && <span title={t("plPri.high")} aria-label={t("plPri.high")} style={{ display: "inline-flex", marginTop: 2 }}><Flag size={14} color={T.red} /></span>}
            <span style={{ fontFamily: FONT_UI, fontSize: fs(13.5), color: k.done ? T.muted : T.ink, textDecoration: k.done ? "line-through" : "none", overflowWrap: "anywhere", lineHeight: 1.4 }}>{k.title}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginTop: 3 }}>
            {d
              ? <button onClick={() => onNavigate("calendar", k.due)} title={t("plOpenCal")} aria-label={`${t("plOpenCal")}: ${fmtDue(d)}`} style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "transparent", border: "none", padding: 0, cursor: "pointer", fontFamily: FONT_MONO, fontSize: fs(11.5), color: k.done ? T.muted : dueColor, fontWeight: 700 }}><CalendarDays size={12} />{fmtDue(d)}{k.time ? ` · ${fmtClock(k.time, locale)}` : ""}{late > 0 ? ` · ${t("plOverdueBy", { n: late })}` : ""}</button>
              : !k.done && !cal && <button onClick={() => startEdit(k)} style={{ background: "transparent", border: "none", padding: 0, cursor: "pointer", fontFamily: FONT_UI, fontSize: fs(11.5), fontWeight: 600, color: T.blue }}>{t("plSetDate")}</button>}
            {k.kind && k.kind !== "other" && !cal && <Pill T={T} tone="muted">{t(`plKind.${k.kind}`)}</Pill>}
            {cal && <Pill T={T} tone="blue">{t("plFromCal")}</Pill>}
            {k.priority === "low" && !k.done && <Pill T={T} tone="muted">{t("plPri.low")}</Pill>}
            {k.subject && <span style={{ fontFamily: FONT_UI, fontSize: fs(11.5), color: T.muted }}>{k.subject}</span>}
          </div>
          {k.notes && <div style={{ fontFamily: FONT_UI, fontSize: fs(12), color: T.muted, marginTop: 3, overflowWrap: "anywhere" }}>{k.notes}</div>}
        </div>
        {!cal && <button onClick={() => startEdit(k)} title={t("plEditTask")} aria-label={`${t("plEditTask")}: ${k.title}`} style={iconBtn}><Pencil size={14} /></button>}
        <button onClick={() => removeOne(k)} title={t("csPlanRemove")} aria-label={`${t("csPlanRemove")}: ${k.title}`} style={iconBtn}><X size={15} /></button>
      </div>
    );
  };

  if (!profile) return <div>{children}</div>; // no Study Profile yet: only the day view

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
        <ClipboardList size={17} color={T.ink} />
        <span style={{ fontFamily: FONT_UI, fontWeight: 700, fontSize: fs(13), color: T.ink }}>{today.toLocaleDateString(locale, { weekday: "long", month: "long", day: "numeric" })}</span>
        {brief && brief.phase === "in" && <Pill T={T} tone="blue">{spWeekLabel(brief, t)}</Pill>}
        {profile.plan.weeklyQuestionTarget > 0 && brief && <Pill T={T} tone="muted">{t("spWeekly", { a: brief.answeredWeek, n: profile.plan.weeklyQuestionTarget })}</Pill>}
        {headExtra}
        {!inline && <GhostButton T={T} icon={CalendarDays} onClick={() => onNavigate("calendar", todayKey)} style={{ marginLeft: "auto", padding: "4px 10px" }}>{t("plOpenCalBtn")}</GhostButton>}
      </div>

      {children && <div style={{ borderBottom: `1px solid ${T.border}`, paddingBottom: 16, marginBottom: 16 }}>{children}</div>}

      {/* The list, grouped by when it is due */}
      {allRows.length > 0 && shown.length === 0 && <p style={{ fontFamily: FONT_UI, fontSize: fs(13.5), color: T.muted, margin: "14px 0 0" }}>{t("plNoMatch")}</p>}
      {PLAN_GROUPS.map((g) => {
        const items = groupItems(g); if (!items.length) return null;
        const isDone = g === "done"; const isUp = g === "upcoming";
        const forced = (isDone && filter === "done") || (isUp && (filter === "upcoming" || !!ql)); // an explicit filter or search always shows the rows
        const open2 = isDone ? (forced || doneOpen) : isUp ? (forced || upOpen) : true;
        const collapsible = (isDone || isUp) && !forced;
        const isOpenNow = isDone ? doneOpen : upOpen;
        const headColor = g === "overdue" ? T.red : g === "today" || isUp ? T.amber : isDone ? T.green : T.muted;
        return (
          <div key={g} style={{ marginTop: 14 }}>
            {collapsible
              ? <button onClick={() => (isDone ? setDoneOpen((o) => !o) : setUpOpen((o) => !o))} aria-expanded={isOpenNow} style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "transparent", border: "none", padding: 0, cursor: "pointer", ...sect, color: headColor }}>
                {isDone ? (doneOpen ? t("plHideDone") : t("plShowDone", { n: items.length })) : <>{t(`plG.${g}`)}<span style={{ fontFamily: FONT_MONO, fontSize: fs(11), color: T.muted }}>{items.length}</span></>}
                {isOpenNow ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
              : <div style={{ display: "flex", alignItems: "center", gap: 8 }}><span style={{ ...sect, color: headColor }}>{t(`plG.${g}`)}</span><span style={{ fontFamily: FONT_MONO, fontSize: fs(11), color: T.muted }}>{items.length}</span></div>}
            {open2 && <div style={{ borderTop: `1px solid ${T.border}`, marginTop: 6 }}>{items.map(renderRow)}</div>}
          </div>
        );
      })}

      {/* Type scroller with the Add button inline on its right; the add form opens right below */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginTop: 14 }}>
        <select value={kindF} onChange={(e) => setKindF(e.target.value)} aria-label={t("calF.type")} style={inp}>
          <option value="all">{t("plKindAll")}</option>
          {kinds.map((x) => <option key={x} value={x}>{t(`plKind.${x}`)}</option>)}
        </select>
          <GhostButton T={T} icon={typeOpen ? X : Plus} onClick={() => setTypeOpen((o) => !o)} style={{ padding: "7px 12px", marginLeft: "auto" }}>{t("csPlanAdd")}</GhostButton>
      </div>
      {typeOpen && (
        <div style={{ marginTop: 10, display: "grid", gap: 8 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <input value={draft.title} maxLength={200} onChange={(e) => setDraft({ ...draft, title: e.target.value })} onKeyDown={(e) => { if (e.key === "Enter") addItem(); }}
          placeholder={t("csPlanAddPh")} aria-label={t("csPlanAddPh")} style={{ ...inp, flex: "1 1 180px", fontSize: fs(13.5), padding: "8px 10px" }} />
        <input type="date" value={draft.due} onChange={(e) => setDraft({ ...draft, due: e.target.value })} aria-label={t("spPlanDueOpt")} title={t("spPlanDueOpt")} style={{ ...inp, padding: "7px 8px" }} />
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
        {[[t("spToday"), todayKey], [t("spTomorrow"), toISODate(new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1))]].map(([label, key]) => (
          <button key={key} onClick={() => setDraft({ ...draft, due: key })} aria-pressed={draft.due === key} style={{ fontFamily: FONT_UI, fontWeight: 600, fontSize: fs(12), cursor: "pointer", padding: "3px 10px", borderRadius: 999, border: `1px solid ${draft.due === key ? T.blue : T.border}`, background: draft.due === key ? T.blueLight : "transparent", color: draft.due === key ? T.blueDeep : T.muted }}>{label}</button>
        ))}
        <button onClick={() => setMoreOpts((o) => !o)} aria-expanded={moreOpts} style={{ display: "inline-flex", alignItems: "center", gap: 4, fontFamily: FONT_UI, fontWeight: 600, fontSize: fs(12.5), color: T.blue, background: "transparent", border: "none", cursor: "pointer", padding: 4 }}>{t("plOptions")}{moreOpts ? <ChevronUp size={14} /> : <ChevronDown size={14} />}</button>
      </div>
      {moreOpts && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 10, marginTop: 8 }}>
          {field(t("calF.time"), <input type="time" value={draft.time} onChange={(e) => setDraft({ ...draft, time: e.target.value })} style={{ ...inp, width: "100%" }} />)}
          {field(t("calF.type"), kindSel(draft.kind, (v) => setDraft({ ...draft, kind: v })))}
          {field(t("plPriority"), priSel(draft.priority, (v) => setDraft({ ...draft, priority: v })))}
          {field(t("calF.subject"), <input value={draft.subject} maxLength={80} onChange={(e) => setDraft({ ...draft, subject: e.target.value })} style={{ ...inp, width: "100%" }} />)}
        </div>
      )}
          <div>
          <select value="" aria-label={t("plAddAs")} onChange={(e) => {
            const kind = e.target.value; if (!kind) return;
            if (kind === "task" && draft.title.trim()) addItem(); else if (api && api.create) { api.create(kind, draft.title.trim().slice(0, 160), draft.due); setDraft(PLAN_BLANK); }
            setTypeOpen(false);
          }} style={{ ...inp, width: "100%", padding: "8px 10px", fontSize: fs(13.5) }}>
            <option value="" disabled>{t("plAddAs")}</option>
            {["task", "event", "exam"].map((k) => <option key={k} value={k}>{t(`calAdd.${k}`)}</option>)}
          </select>
          </div>
        </div>
      )}


      {/* Bulk actions */}
      {lateOnes.length > 0 && (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 14 }}>
          {lateOnes.length > 0 && <GhostButton T={T} icon={CalendarDays} onClick={moveLate} style={{ padding: "6px 12px" }}>{t("plMoveOverdue", { n: lateOnes.length })}</GhostButton>}
        </div>
      )}

      {toast && (
        <div role="status" style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 12, padding: "9px 12px", borderRadius: 8, background: T.ink, color: T.paper, fontFamily: FONT_UI, fontSize: fs(13) }}>
          <span style={{ flex: 1, minWidth: 0, overflowWrap: "anywhere" }}>{toast.msg}</span>
          <button onClick={() => { toast.undo(); setToast(null); }} style={{ background: "transparent", border: "none", color: T.paper, fontWeight: 700, textDecoration: "underline", cursor: "pointer", fontFamily: FONT_UI, fontSize: fs(13) }}>{t("calUndo")}</button>
        </div>
      )}
    </div>
  );
}

// ---- Profile tab ----
function StudentProfilePanel({ T, sessionLog, onNavigate, embedded = false }) {
  const { t, lang } = useI18n();
  const sp = useContext(ProfileContext);
  const { notify } = useContext(NotifContext);
  const drive = useContext(DriveContext);
  const careerCtx = useContext(CareerContext);
  const phone = useViewport().w < 640;
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [warns, setWarns] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [mode, setMode] = useState("new"); // new | update
  const [withStats, setWithStats] = useState(true);
  const [showSchema, setShowSchema] = useState(false);
  const [copied, setCopied] = useState(""); // "" | "prompt" | "schema"
  const [confirmDel, setConfirmDel] = useState(false);
  const [pasteOpen, setPasteOpen] = useState(true);
  const [promptOpen, setPromptOpen] = useState(true);
  const [mapOpen, setMapOpen] = useState(false);   // Syllabus map: collapsed = only the weeks around today
  const [srcOpen, setSrcOpen] = useState(false);   // Source: collapsed by default
  const [pastOpen, setPastOpen] = useState(false);  // Past and completed exams: collapsed by default
  const [updOpen, setUpdOpen] = useState(null);    // Update your profile: collapsed once a profile exists (null = automatic); open while building the first one
  const fileRef = useRef(null);
  const locale = lang === "es" ? "es" : "en-US";
  const profile = sp.profile;
  const updShown = updOpen === null ? !profile : updOpen;
  const brief = useMemo(() => (profile ? tutorBrief(profile, sessionLog, new Date()) : null), [profile, sessionLog]);
  const canUpdate = !!profile;
  const effMode = canUpdate ? mode : "new";
  const prompt = useMemo(() => buildProfileRecipe({
    lang, today: toISODate(new Date()), stats: withStats ? buildStatsSnapshot(sessionLog) : null, existing: effMode === "update" ? profile : null,
    career: careerForPrompt(careerCtx.career),
  }), [lang, withStats, sessionLog, effMode, profile, careerCtx.career]);

  const card = { background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: phone ? 18 : 24 };
  const cardHead = { display: "flex", alignItems: "center", gap: 8, marginBottom: 14, flexWrap: "wrap" };
  const headTxt = { fontFamily: FONT_UI, fontWeight: 600, fontSize: fs(14), color: T.ink };
  const label = { fontFamily: FONT_UI, fontWeight: 700, fontSize: fs(11.5), color: T.muted, textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 6px" };
  const body = { fontFamily: FONT_UI, fontSize: fs(13.5), color: T.muted, lineHeight: 1.55, margin: 0 };
  const fmtDay = (iso) => { const d = parseISODate(iso); return d ? d.toLocaleDateString(locale, { month: "short", day: "numeric", year: "numeric" }) : "—"; };

  function copy(which, str) { navigator.clipboard.writeText(str).then(() => { setCopied(which); setTimeout(() => setCopied(""), 1800); }).catch(() => {}); }
  function load(content) {
    const r = normalizeProfile(content);
    if (!r.valid) { setError(t(r.error)); setWarns([]); setLoaded(false); setPasteOpen(true); return; }
    setError(""); setWarns(r.warnings); setLoaded(true);
    sp.setProfile(r.data);
    setText(""); setPasteOpen(false); setUpdOpen(true); // stay open so the result and any warnings are visible
    notify({ kind: "profileLoaded", tone: "green", dedupe: "profileLoaded", vars: { term: r.data.term.name || t("spTitle") } });
  }
  function handleFile(e) {
    const f = e.target.files && e.target.files[0]; if (!f) return;
    const rd = new FileReader(); rd.onload = (ev) => { setText(String(ev.target.result || "")); load(String(ev.target.result || "")); }; rd.readAsText(f); e.target.value = "";
  }
  function exportJson() {
    const json = JSON.stringify(profile, null, 2);
    downloadBlob(new Blob([json], { type: "application/json" }), `Study Profile${profile.term.name ? ` (${profile.term.name})` : ""}.json`);
  }
  const syncTone = !sp.sync.available ? "muted" : sp.sync.status === "error" ? "red" : sp.sync.status === "busy" ? "blue" : "green";
  const syncText = !sp.sync.available ? t("spSyncLocal") : sp.sync.status === "busy" ? t("syncStBusy") : sp.sync.status === "error" ? t("syncStError")
    : sp.sync.lastSync ? t("syncStDone", { time: new Date(sp.sync.lastSync).toLocaleTimeString(locale, { hour: "numeric", minute: "2-digit" }) }) : t("spSyncDrive");
  const ghostSm = { fontFamily: FONT_UI, fontWeight: 600, fontSize: fs(12.5), color: T.blue, background: "transparent", border: "none", cursor: "pointer", padding: 4 };
  // Card header that doubles as the expand / collapse button.
  const collHead = (Icon, title, open, toggle, extra) => (
    <button type="button" onClick={toggle} aria-expanded={open} style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", background: "transparent", border: "none", padding: 0, margin: open ? "0 0 14px" : 0, cursor: "pointer", textAlign: "left", flexWrap: "wrap" }}>
      <Icon size={17} color={T.ink} /><span style={headTxt}>{title}</span>{extra}
      <span style={{ marginLeft: "auto", display: "inline-flex" }}>{open ? <ChevronUp size={16} color={T.muted} /> : <ChevronDown size={16} color={T.muted} />}</span>
    </button>
  );
  // Medical school studies + USMLE steps (with target dates). Shared by the combined profile card and the no-profile fallback.
  const careerStudiesBlock = () => {
    const c = careerCtx.career; const today0 = startOfDay(new Date());
    if (!(c.coursework.length > 0 || c.usmle.length > 0)) return null;
    return (
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 220px), 1fr))", gap: 16, marginTop: 16 }}>
        {c.coursework.length > 0 && (
          <div>
            <div style={label}>{t("cpCoursework")}</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>{c.coursework.map((k) => <Pill key={k} T={T} tone="blue">{t(`cpWork.${k}`)}</Pill>)}</div>
          </div>
        )}
        {c.usmle.length > 0 && (
          <div>
            <div style={label}>{t("cpUsmle")}</div>
            <div style={{ display: "grid", gap: 8 }}>
              {c.usmle.map((k) => {
                const d = parseISODate(c.stepDates[k]); const days = d ? Math.round((d - today0) / 864e5) : null;
                return (
                  <div key={k} style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <span style={{ fontFamily: FONT_UI, fontWeight: 700, fontSize: fs(14), color: T.ink }}>{t(`cpStep.${k}`)}</span>
                    {d ? (
                      <>
                        <span style={{ fontFamily: FONT_MONO, fontSize: fs(11.5), color: T.muted }}>{fmtDay(c.stepDates[k])}</span>
                        {days >= 0 && <Pill T={T} tone={days <= 14 ? "amber" : "muted"}>{spWhen(days, t)}</Pill>}
                      </>
                    ) : <span style={{ fontFamily: FONT_UI, fontSize: fs(12), color: T.muted }}>{t("spNoDate")}</span>}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };
  // Collapsed syllabus map: only the weeks that matter right now.
  const relevantWeeks = (c) => {
    if (!brief) return [];
    if (brief.phase === "in") return c.weeks.filter((w) => w.week === brief.week || w.week === brief.week + 1);
    if (brief.phase === "after") return c.weeks.slice(-1);
    return c.weeks.slice(0, 2);
  };

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <div>
        {!embedded && <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          {embedded
            ? <><UserIcon size={22} color={T.blue} /><h2 style={{ margin: "0 0 4px", fontFamily: FONT_UI, fontWeight: 700, fontSize: fs(22), color: T.ink }}>{t("spTitle")}</h2></>
            : <h1 style={{ fontFamily: FONT_DISPLAY, fontSize: fs(phone ? 26 : 32), fontWeight: 600, color: T.ink, margin: "0 0 4px" }}>{t("spTitle")}</h1>}
          {onNavigate && !embedded && <span style={{ marginLeft: "auto", display: "flex", gap: 8, flexWrap: "wrap" }}><GhostButton T={T} icon={Target} onClick={() => onNavigate("studyhub")}>{t("tabStudyHub")}</GhostButton></span>}
        </div>}
        <p style={{ ...body, maxWidth: 680 }}>{t("spHint")}</p>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginTop: 10 }}>
          <Pill T={T} tone={syncTone}>{syncText}</Pill>
          {sp.sync.available && <button onClick={sp.sync.syncNow} disabled={sp.sync.status === "busy"} style={ghostSm}>{t("syncNow")}</button>}
        </div>
      </div>

      {!(profile && brief) && (() => {
        const c = careerCtx.career; const empty = !careerCtx.hasData;
        const line = careerLine(c, t);
        const sub = [c.university, [c.city, c.country].filter(Boolean).join(", ")].filter(Boolean).join(" · ");
        return (
          <div style={card}>
            <div style={cardHead}>
              <GraduationCap size={17} color={T.ink} />
              <span style={headTxt}>{t("cpTitle")}</span>
              <span style={{ marginLeft: "auto" }}><GhostButton T={T} icon={Pencil} onClick={openAccountWindow}>{empty ? t("spCareerAdd") : t("spCareerEdit")}</GhostButton></span>
            </div>
            {empty ? <p style={body}>{t("spCareerEmpty")}</p> : (
              <>
                {line && <div style={{ fontFamily: FONT_UI, fontWeight: 700, fontSize: fs(20), color: T.ink, overflowWrap: "anywhere" }}>{line}</div>}
                {sub && <div style={{ ...body, marginTop: 4, overflowWrap: "anywhere" }}>{sub}</div>}
                {careerStudiesBlock()}
              </>
            )}
          </div>
        );
      })()}

      {profile && brief && (
        <>
          <div style={card}>
            <div style={cardHead}>
              <GraduationCap size={17} color={T.ink} />
              <span style={headTxt}>{[profile.student.name, careerLine(careerCtx.career, t) || profile.student.program].filter(Boolean).join(" · ") || t("spTitle")}</span>
              <span style={{ marginLeft: "auto" }}><GhostButton T={T} icon={Pencil} onClick={openAccountWindow}>{careerCtx.hasData ? t("spCareerEdit") : t("spCareerAdd")}</GhostButton></span>
            </div>
            {[careerCtx.career.city, careerCtx.career.country].filter(Boolean).length > 0 && <div style={{ ...body, marginBottom: 8, overflowWrap: "anywhere" }}>{[careerCtx.career.city, careerCtx.career.country].filter(Boolean).join(", ")}</div>}
            <div style={{ fontFamily: FONT_UI, fontWeight: 700, fontSize: fs(20), color: T.ink }}>{profile.term.name || "—"} · {spWeekLabel(brief, t)}</div>
            <div style={{ fontFamily: FONT_MONO, fontSize: fs(12), color: T.muted, margin: "4px 0 10px" }}>{fmtDay(profile.term.startDate)} → {fmtDay(profile.term.endDate)}</div>
            {brief.phase === "in" && brief.total > 0 && (
              <div style={{ height: 6, borderRadius: 999, background: T.mutedBg, overflow: "hidden", maxWidth: 460 }}><div style={{ width: `${Math.min(100, Math.round((brief.week / brief.total) * 100))}%`, height: "100%", background: T.blue }} /></div>
            )}
            {profile.currentState.summary && <p style={{ ...body, color: T.ink, marginTop: 14 }}>{profile.currentState.summary}</p>}
            {profile.currentState.paceNote && <p style={{ ...body, marginTop: 6 }}>{profile.currentState.paceNote}</p>}
            {careerStudiesBlock()}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 340px), 1fr))", gap: 20, alignItems: "start" }}>
            <div style={{ display: "grid", gap: 20, minWidth: 0, alignContent: "start" }}>
            <div style={card}>
              <div style={cardHead}><CalendarDays size={17} color={T.ink} /><span style={headTxt}>{t("spAssessments")}</span></div>
              {brief.upcoming.length === 0 ? <p style={body}>{t("spNoNext")}</p> : brief.upcoming.slice(0, 6).map((a) => (
                <AssessmentRow key={a.id} a={a} T={T} t={t} onSave={(patch) => sp.updateAssessment(a.id, patch)} onRemove={() => sp.removeAssessment(a.id)}
                  right={<Pill T={T} tone={a.days <= 3 ? "red" : a.days <= 7 ? "amber" : "muted"}>{spWhen(a.days, t)}</Pill>}>
                  <div style={{ fontFamily: FONT_UI, fontWeight: 700, fontSize: fs(14), color: T.ink, overflowWrap: "anywhere" }}>{a.title}</div>
                  <div style={{ fontFamily: FONT_MONO, fontSize: fs(11.5), color: T.muted }}>{fmtDay(a.date)}{a.time ? ` · ${a.time}` : ""}{a.weightPct != null ? ` · ${a.weightPct}%` : ""}</div>
                  {a.coverage.length > 0 && <div style={{ fontFamily: FONT_UI, fontSize: fs(12), color: T.muted, marginTop: 2 }}>{a.coverage.slice(0, 4).join(" · ")}</div>}
                </AssessmentRow>
              ))}
              {(() => {
                const upIds = new Set(brief.upcoming.map((u) => u.id));
                const past = profile.assessments.filter((x) => !upIds.has(x.id));
                if (!past.length) return null;
                return (
                  <div style={{ marginTop: 10 }}>
                    <button onClick={() => setPastOpen((o) => !o)} aria-expanded={pastOpen} style={{ ...ghostSm, padding: "4px 0", display: "inline-flex", alignItems: "center", gap: 4 }}>{t("spPastAssess", { n: past.length })}{pastOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}</button>
                    {pastOpen && past.map((a) => (
                      <AssessmentRow key={a.id} a={a} T={T} t={t} onSave={(patch) => sp.updateAssessment(a.id, patch)} onRemove={() => sp.removeAssessment(a.id)}
                        right={a.status === "done" ? <Pill T={T} tone="muted">{t("spDoneTag")}</Pill> : null}>
                        <div style={{ fontFamily: FONT_UI, fontWeight: 700, fontSize: fs(14), color: T.muted, overflowWrap: "anywhere" }}>{a.title}</div>
                        <div style={{ fontFamily: FONT_MONO, fontSize: fs(11.5), color: T.muted }}>{fmtDay(a.date)}{a.time ? ` · ${a.time}` : ""}</div>
                      </AssessmentRow>
                    ))}
                  </div>
                );
              })()}
            </div>
            </div>
            <div style={{ display: "grid", gap: 20, minWidth: 0, alignContent: "start" }}>
              {profile.courses.length > 0 && (
                <div style={card}>
                  {collHead(BookOpen, t("spCourses"), mapOpen, () => setMapOpen((o) => !o))}
                  <div style={{ display: "grid", gap: 14, marginTop: mapOpen ? 0 : 12 }}>
                    {profile.courses.map((c) => {
                      const shown = mapOpen ? c.weeks : relevantWeeks(c);
                      return (
                        <div key={c.id}>
                          <div style={{ fontFamily: FONT_UI, fontWeight: 700, fontSize: fs(14), color: T.ink }}>{c.name}{c.code ? <span style={{ fontFamily: FONT_MONO, fontWeight: 400, fontSize: fs(12), color: T.muted }}> · {c.code}</span> : null}</div>
                          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
                            {shown.map((w) => {
                              const cur = brief.phase === "in" && w.week === brief.week;
                              const topics = mapOpen ? (w.topics[0] ? ` · ${w.topics[0].slice(0, 28)}` : "") : (w.topics.length ? ` · ${w.topics.slice(0, 3).join(", ").slice(0, 90)}` : "");
                              return <span key={w.week} title={w.topics.join(", ")} style={{ fontFamily: FONT_MONO, fontSize: fs(11.5), padding: "4px 8px", borderRadius: 6, border: `1px solid ${cur ? T.blue : T.border}`, background: cur ? T.blueLight : "transparent", color: cur ? T.blue : T.muted, fontWeight: cur ? 700 : 400 }}>{t("spWeekN", { n: w.week })}{topics}</span>;
                            })}
                            {shown.length === 0 && <span style={{ ...body, fontSize: fs(12.5) }}>{t("spNoFocus")}</span>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {!mapOpen && <p style={{ ...body, fontSize: fs(12.5), marginTop: 12 }}>{t("spMapNote")}</p>}
                </div>
              )}
            </div>
          </div>

          {profile.calendar && profile.calendar.events.length > 0 && (
            <div style={card}>
              <div style={cardHead}><CalendarDays size={17} color={T.ink} /><span style={headTxt}>{t("csCalendar")}</span></div>
              {profile.calendar.events.slice(0, 12).map((e) => (
                <div key={e.id} style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", padding: "9px 0", borderBottom: `1px solid ${T.border}` }}>
                  <div style={{ flex: "1 1 160px", minWidth: 0 }}>
                    <div style={{ fontFamily: FONT_UI, fontWeight: 700, fontSize: fs(14), color: T.ink, overflowWrap: "anywhere" }}>{e.title}</div>
                    <div style={{ fontFamily: FONT_MONO, fontSize: fs(11.5), color: T.muted }}>{fmtDay(e.startDate)}{e.endDate ? ` → ${fmtDay(e.endDate)}` : ""}</div>
                  </div>
                  <Pill T={T} tone={SP_EVENT_TONE[e.type] || "muted"}>{t(`spEvt.${e.type}`)}</Pill>
                </div>
              ))}
              {profile.calendar.events.length > 12 && <p style={{ ...body, fontSize: fs(12.5), marginTop: 10 }}>{t("csCalMore", { n: profile.calendar.events.length - 12 })}</p>}
            </div>
          )}

          {(profile.source.documents.length > 0 || profile.source.assumptions.length > 0 || profile.source.confidence) && (
            <div style={card}>
              {collHead(FileJson, t("spSource"), srcOpen, () => setSrcOpen((o) => !o), profile.source.confidence ? <Pill T={T} tone={profile.source.confidence === "high" ? "green" : profile.source.confidence === "low" ? "red" : "amber"}>{t("spConf", { c: t(`spConf.${profile.source.confidence}`) })}</Pill> : null)}
              {srcOpen && (
                <>
                  {profile.source.documents.length > 0 && <p style={body}>{profile.source.documents.join(" · ")}</p>}
                  {profile.source.assumptions.length > 0 && (
                    <>
                      <div style={{ ...label, marginTop: 12 }}>{t("spAssump")}</div>
                      <ul style={{ ...body, paddingLeft: 18 }}>{profile.source.assumptions.map((a, i) => <li key={i}>{a}</li>)}</ul>
                    </>
                  )}
                </>
              )}
            </div>
          )}
        </>
      )}

      <div style={card}>
        {collHead(Sparkles, profile ? t("spUpdateTitle") : t("spBuildTitle"), updShown, () => setUpdOpen(!updShown))}
        {updShown && (<div>
        <p style={body}>{profile ? t("spUpdateBody") : t("spBuildBody")}</p>
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap", alignItems: "center", margin: "14px 0" }}>
          {canUpdate && (
            <div role="radiogroup" style={{ display: "flex", gap: 6 }}>
              {[["new", t("spModeNew")], ["update", t("spModeUpdate")]].map(([id, lbl]) => (
                <button key={id} role="radio" aria-checked={effMode === id} onClick={() => setMode(id)} style={{ fontFamily: FONT_UI, fontWeight: 600, fontSize: fs(12.5), padding: "6px 12px", borderRadius: 999, cursor: "pointer", border: `1px solid ${effMode === id ? T.blue : T.border}`, background: effMode === id ? T.blueLight : "transparent", color: effMode === id ? T.blue : T.ink }}>{lbl}</button>
              ))}
            </div>
          )}
          <label style={{ display: "inline-flex", alignItems: "center", gap: 8, fontFamily: FONT_UI, fontSize: fs(13), color: T.ink, cursor: "pointer" }}>
            <input type="checkbox" checked={withStats} onChange={(e) => setWithStats(e.target.checked)} /> {t("spIncludeStats")}
          </label>
        </div>
        <div style={{ ...body, fontSize: fs(12.5), marginBottom: 14 }}>{t("spIncludeStatsHint")}</div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <button type="button" onClick={() => setPromptOpen((o) => !o)} aria-expanded={promptOpen}
            style={{ display: "flex", alignItems: "center", gap: 8, background: "transparent", border: "none", padding: 0, cursor: "pointer", textAlign: "left" }}>
            <span style={{ fontFamily: FONT_UI, fontWeight: 600, fontSize: fs(12.5), color: T.ink, textTransform: "uppercase", letterSpacing: "0.05em" }}>{t("spPromptTitle")}</span>
            {promptOpen ? <ChevronUp size={16} color={T.muted} /> : <ChevronDown size={16} color={T.muted} />}
          </button>
          <button
            onClick={() => copy("prompt", prompt)}
            style={{
              fontFamily: FONT_UI, fontSize: fs(12.5), fontWeight: 600, color: copied === "prompt" ? T.green : T.blue,
              background: "transparent", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 5,
            }}
          >
            {copied === "prompt" ? <Check size={14} /> : <Copy size={14} />} {copied === "prompt" ? t("copied") : t("copy")}
          </button>
        </div>
        {promptOpen && (
        <pre style={{
          fontFamily: FONT_MONO, fontSize: fs(11.5), color: T.ink, background: T.paper,
          border: `1px solid ${T.border}`, borderRadius: 8, padding: 14, whiteSpace: "pre-wrap",
          wordBreak: "break-word", lineHeight: 1.6, margin: 0, maxHeight: 360, overflowY: "auto",
        }}>
          {prompt}
        </pre>
        )}

        <div style={{ borderTop: `1px solid ${T.border}`, marginTop: 18, paddingTop: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 8 }}>
            <button type="button" onClick={() => setPasteOpen((o) => !o)} aria-expanded={pasteOpen}
              style={{ display: "flex", alignItems: "center", gap: 8, background: "transparent", border: "none", padding: 0, cursor: "pointer", textAlign: "left" }}>
              <FileJson size={17} color={T.ink} />
              <span style={{ fontFamily: FONT_UI, fontWeight: 600, fontSize: fs(13.5), color: T.ink }}>{t("spPasteLabel")}</span>
              {pasteOpen ? <ChevronUp size={16} color={T.muted} /> : <ChevronDown size={16} color={T.muted} />}
            </button>
          </div>
          {pasteOpen && (
            <textarea value={text} onChange={(e) => { setText(e.target.value); setError(""); setLoaded(false); }} placeholder={t("spPastePh")} spellCheck={false}
              style={{ width: "100%", boxSizing: "border-box", minHeight: 140, resize: "vertical", padding: 12, borderRadius: 8, border: `1px solid ${error ? T.red : T.border}`, background: T.paper, color: T.ink, fontFamily: FONT_MONO, fontSize: fs(12) }} />
          )}
          {(text.trim() || !pasteOpen) && (
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: pasteOpen ? 6 : 0, fontFamily: FONT_UI, fontSize: fs(12), color: T.muted }}>
              <span>{text.trim() ? t("pasteChars", { n: text.length.toLocaleString() }) : t("pasteEmpty")}</span>
              {text.trim() && <button type="button" onClick={() => { setText(""); setError(""); setLoaded(false); }} style={{ fontFamily: FONT_UI, fontSize: fs(12), fontWeight: 600, color: T.blue, background: "transparent", border: "none", padding: 0, cursor: "pointer" }}>{t("pasteClear")}</button>}
            </div>
          )}
          {error && <p role="alert" style={{ ...body, color: T.red, marginTop: 8 }}>{error}</p>}
          {loaded && !error && <p role="status" style={{ ...body, color: T.green, marginTop: 8 }}>{t("spLoaded")}</p>}
          {warns.map((w, i) => <p key={i} style={{ ...body, color: T.amber, marginTop: 6 }}>{t(w.k, w.v)}</p>)}
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 12 }}>
            <PrimaryButton T={T} icon={Check} disabled={!text.trim()} onClick={() => load(text)}>{t("spLoad")}</PrimaryButton>
            <GhostButton T={T} icon={Upload} onClick={() => fileRef.current && fileRef.current.click()}>{t("spUpload")}</GhostButton>
            <input ref={fileRef} type="file" accept=".json,application/json,text/plain" onChange={handleFile} style={{ display: "none" }} />
          </div>
          {profile && <p style={{ ...body, fontSize: fs(12.5), marginTop: 10 }}>{t("spReplaceNote")}</p>}
        </div>
        </div>)}
      </div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        <GhostButton T={T} icon={FileJson} onClick={() => setShowSchema((v) => !v)}>{showSchema ? t("spSchemaHide") : t("spSchemaView")}</GhostButton>
        {profile && <GhostButton T={T} icon={Download} onClick={exportJson}>{t("spExport")}</GhostButton>}
        {profile && !confirmDel && <GhostButton T={T} icon={Trash2} onClick={() => setConfirmDel(true)}>{t("spDelete")}</GhostButton>}
      </div>
      {confirmDel && (
        <div role="alertdialog" style={{ ...card, borderColor: T.red }}>
          <p style={{ ...body, color: T.ink }}>{t("spDeleteQ")}</p>
          <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
            <button onClick={() => { sp.clear(); setConfirmDel(false); }} style={{ fontFamily: FONT_UI, fontWeight: 700, fontSize: fs(13), padding: "9px 16px", borderRadius: 8, cursor: "pointer", background: T.red, color: T.onBlue, border: `1px solid ${T.red}` }}>{t("spDeleteGo")}</button>
            <GhostButton T={T} onClick={() => setConfirmDel(false)}>{t("dbCancel")}</GhostButton>
          </div>
        </div>
      )}
      {showSchema && (
        <div style={card}>
          <div style={cardHead}><FileJson size={17} color={T.ink} /><span style={headTxt}>{t("spSchemaTitle")}</span><button onClick={() => copy("schema", PROFILE_SCHEMA_TEXT)} style={{ ...ghostSm, marginLeft: "auto" }}>{copied === "schema" ? t("copied") : t("copy")}</button></div>
          <pre style={{ margin: 0, fontFamily: FONT_MONO, fontSize: fs(11.5), lineHeight: 1.5, color: T.ink, overflowX: "auto" }}>{PROFILE_SCHEMA_TEXT}</pre>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Database: questions, excerpts and notes the user saves while studying (kept on this device).
//   item = { id, key, kind: "question" | "excerpt" | "note", ts, text, comment, source: { block, num, subject, field }, question: {...snapshot} }
// `key` de-duplicates: saving the same question / excerpt / note again replaces the earlier copy instead of piling up.
// ---------------------------------------------------------------------------
const LS_DB = "owordDatabase";
const LS_DB_TOMBS = "owordDbTombs";   // { itemId: deletedAt } so a deletion on one device isn't undone by another device's copy
const LS_DB_FILE = "owordDbFile";     // { fileId, lastSync } of the Drive file below
const DB_FILE_NAME = "oword_personal_database.json"; // its own file in the Drive app-data folder, separate from the Qbank/Analytics sync file
const DB_SHARE_TYPE = "oworld-personal-database";
const DB_MAX = 2000;
const DB_KINDS_LIST = ["question", "excerpt", "note"];
const DbContext = createContext({
  items: [], tombs: {}, add: () => {}, update: () => {}, remove: () => {}, removeMany: () => {}, removeByKey: () => {}, clearAll: () => {},
  wipe: () => {}, importItems: () => ({ added: 0, skipped: 0 }), restoreItems: () => ({ restored: 0, skipped: 0 }), applyMerged: () => {}, sync: { available: false, status: "idle", lastSync: 0, syncNow: () => {} },
});

const dbStamp = (n) => n.updatedAt || n.ts || 0;
const validDbItem = (n) => !!n && typeof n.id === "string" && DB_KINDS_LIST.includes(n.kind);
function unionDbTombs(a, b) {
  const out = {}; const cutoff = Date.now() - TOMB_TTL;
  for (const src of [a, b]) for (const [id, ts] of Object.entries(src || {})) if (ts > cutoff) out[id] = Math.max(out[id] || 0, ts);
  return out;
}
// Non-destructive union by id (the newer edit wins). Only an explicit delete (tombstone) removes anything. Two devices that saved the
// same question / excerpt / note separately end up with one copy (the newer), and the other id is tombstoned on both sides.
function mergeDatabase(local, remote) {
  const r = remote && typeof remote === "object" ? remote : {};
  const dead = unionDbTombs(local.deleted, r.deleted);
  const map = new Map();
  for (const n of [...(local.items || []), ...(Array.isArray(r.items) ? r.items : [])]) {
    if (!validDbItem(n) || isBuried(dead[n.id], n)) continue;
    const prev = map.get(n.id);
    if (!prev || dbStamp(n) > dbStamp(prev)) map.set(n.id, n);
  }
  const byKey = new Map();
  for (const n of [...map.values()]) {
    if (!n.key) continue;
    const k = byKey.get(n.key);
    if (!k) { byKey.set(n.key, n); continue; }
    const win = dbStamp(n) > dbStamp(k) || (dbStamp(n) === dbStamp(k) && n.id > k.id) ? n : k;
    const lose = win === n ? k : n;
    byKey.set(n.key, win); map.delete(lose.id); dead[lose.id] = Date.now();
  }
  const items = [...map.values()].sort((a, b) => (b.ts || 0) - (a.ts || 0) || (a.id < b.id ? -1 : 1)).slice(0, DB_MAX);
  return { items, deleted: dead };
}
const dbCore = (m) => hashStr(JSON.stringify({ i: m.items, d: Object.keys(m.deleted).sort().map((k) => [k, m.deleted[k]]) }));

function useDatabase(onRemoved) {
  const cbRef = useRef(onRemoved); cbRef.current = onRemoved; // the app moves removed items into the Trash
  const [items, setItems] = useState(() => {
    const v = lsGet(LS_DB);
    return Array.isArray(v) ? v.filter(validDbItem).slice(0, DB_MAX) : [];
  });
  const [tombs, setTombs] = useState(() => { const v = lsGet(LS_DB_TOMBS); return v && typeof v === "object" ? unionDbTombs(v, {}) : {}; });
  const itemsRef = useRef(items); const tombsRef = useRef(tombs);
  useEffect(() => { lsSet(LS_DB, JSON.stringify(items)); }, [items]);
  useEffect(() => { lsSet(LS_DB_TOMBS, JSON.stringify(tombs)); }, [tombs]);
  const commit = (next) => { itemsRef.current = next; setItems(next); };
  const bury = (ids) => {
    if (!ids.length) return;
    const now = Date.now(); const next = { ...tombsRef.current };
    ids.forEach((id) => { next[id] = now; });
    tombsRef.current = next; setTombs(next);
  };
  const newId = () => `db_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

  const add = useCallback((item) => {
    const cur = itemsRef.current; const now = Date.now();
    const prior = item.key ? cur.filter((n) => n.key === item.key) : [];
    const n = { comment: (prior[0] && prior[0].comment) || "", ...item, id: newId(), ts: now, updatedAt: now };
    bury(prior.map((x) => x.id));
    commit([n, ...cur.filter((x) => !item.key || x.key !== item.key)].slice(0, DB_MAX));
  }, []);
  const update = useCallback((id, patch) => commit(itemsRef.current.map((n) => (n.id === id ? { ...n, ...patch, updatedAt: Date.now() } : n))), []);
  // Deleting moves the items to the Trash. `{ silent: true }` is for un-saving with the bookmark toggle, which isn't a deletion.
  const removeMany = useCallback((ids, opts) => {
    const set = new Set(ids);
    const goneItems = itemsRef.current.filter((n) => set.has(n.id));
    bury(goneItems.map((n) => n.id));
    commit(itemsRef.current.filter((n) => !set.has(n.id)));
    if (goneItems.length && !(opts && opts.silent) && cbRef.current) cbRef.current(goneItems);
  }, []);
  const remove = useCallback((id) => removeMany([id]), [removeMany]);
  const removeByKey = useCallback((key) => removeMany(itemsRef.current.filter((n) => n.key === key).map((n) => n.id), { silent: true }), [removeMany]);
  const clearAll = useCallback(() => removeMany(itemsRef.current.map((n) => n.id)), [removeMany]);
  // Local wipe ("Reset all data"): no tombstones, so Drive keeps its copy and reconnecting restores it.
  const wipe = useCallback(() => { itemsRef.current = []; tombsRef.current = {}; setItems([]); setTombs({}); lsRemove(LS_DB); lsRemove(LS_DB_TOMBS); lsRemove(LS_DB_FILE); }, []);
  // Items from a shared file: new ids; skipped when the same content is already here.
  const importItems = useCallback((list) => {
    const cur = itemsRef.current; const have = new Map(cur.filter((n) => n.key).map((n) => [n.key, n]));
    const now = Date.now(); const fresh = []; let skipped = 0;
    list.forEach((raw, i) => {
      let key = raw.key || "";
      const sig = hashStr(`${raw.kind}|${raw.text}|${raw.comment}`);
      if (key && have.has(key)) {
        const ex = have.get(key);
        if (hashStr(`${ex.kind}|${ex.text}|${ex.comment}`) === sig) { skipped++; return; }
        key = `${key}:i${sig}`; // same item, different content (e.g. a friend's note on the same question): keep both
        if (have.has(key)) { skipped++; return; }
      }
      const n = { ...raw, key, id: newId(), ts: raw.ts || now - i, updatedAt: now };
      if (key) have.set(key, n);
      fresh.push(n);
    });
    if (fresh.length) commit([...fresh, ...cur].slice(0, DB_MAX));
    return { added: fresh.length, skipped };
  }, []);
  // Items coming back from the Trash keep their id and saved date. restoredAt is later than their tombstone, so no device buries
  // them again. If the same question / excerpt / note was saved again meanwhile: identical content is skipped, different content
  // (e.g. a newer note) is kept alongside under its own key.
  const restoreItems = useCallback((list) => {
    const cur = itemsRef.current;
    const ids = new Set(cur.map((n) => n.id));
    const byKey = new Map(cur.filter((n) => n.key).map((n) => [n.key, n]));
    const now = Date.now(); const fresh = []; let skipped = 0;
    list.forEach((raw, i) => {
      if (!validDbItem(raw) || ids.has(raw.id)) { skipped++; return; }
      let key = raw.key || "";
      const sig = hashStr(`${raw.kind}|${raw.text}|${raw.comment}`);
      if (key && byKey.has(key)) {
        const ex = byKey.get(key);
        if (hashStr(`${ex.kind}|${ex.text}|${ex.comment}`) === sig) { skipped++; return; }
        key = `${key}:r${sig}`;
        if (byKey.has(key)) { skipped++; return; }
      }
      const at = Math.max(now + i, (tombsRef.current[raw.id] || 0) + 1);
      const n = { ...raw, key, updatedAt: at, restoredAt: at };
      if (key) byKey.set(key, n);
      fresh.push(n);
    });
    if (fresh.length) commit([...fresh, ...cur].sort((a, b) => (b.ts || 0) - (a.ts || 0) || (a.id < b.id ? -1 : 1)).slice(0, DB_MAX));
    return { restored: fresh.length, skipped };
  }, []);
  // Result of a Drive merge. Only touches state when something actually changed (avoids a sync loop).
  const applyMerged = useCallback((m) => {
    if (dbCore(m) === dbCore({ items: itemsRef.current, deleted: tombsRef.current })) return;
    itemsRef.current = m.items; tombsRef.current = m.deleted; setItems(m.items); setTombs(m.deleted);
  }, []);
  return { items, tombs, add, update, remove, removeMany, removeByKey, clearAll, wipe, importItems, restoreItems, applyMerged };
}

// Google Drive sync for the database. Own file (DB_FILE_NAME), same sign-in as the library sync (it borrows its token).
function useDatabaseSync({ drive, database }) {
  const { configured, linked, acquireToken, peekToken } = drive;
  const latest = useRef({}); latest.current = { items: database.items, tombs: database.tombs, applyMerged: database.applyMerged };
  const fileRef = useRef((lsGet(LS_DB_FILE) || {}).fileId || null);
  const modRef = useRef(null);
  const running = useRef(false);
  const rerun = useRef(false);
  const linkedRef = useRef(linked); linkedRef.current = linked;
  const [status, setStatus] = useState("idle"); // idle | busy | done | error
  const [lastSync, setLastSync] = useState((lsGet(LS_DB_FILE) || {}).lastSync || 0);

  const run = useCallback(async ({ interactive = false } = {}) => {
    if (!configured || !linkedRef.current) return;
    if (running.current) { rerun.current = true; return; }
    running.current = true; setStatus("busy");
    try {
      const token = await acquireToken({ interactive });
      if (!token) { setStatus("idle"); return; } // not signed in right now: the library sync shows Reconnect; this retries after it succeeds
      let fileId = fileRef.current; let remote = null;
      if (fileId) { try { remote = await driveDownload(token, fileId); } catch (e) { if (e.status === 404) fileId = null; else throw e; } }
      if (!fileId) { fileId = await driveFindSyncFile(token, DB_FILE_NAME); if (fileId) remote = await driveDownload(token, fileId); }
      const cur = latest.current;
      const merged = mergeDatabase({ items: cur.items, deleted: cur.tombs }, remote);
      cur.applyMerged(merged);
      const remoteMerged = remote ? mergeDatabase({ items: [], deleted: {} }, remote) : null;
      if (!fileId || !remoteMerged || dbCore(merged) !== dbCore(remoteMerged)) {
        const payload = JSON.stringify({ v: 1, app: "oworld", type: DB_SHARE_TYPE, updatedAt: Date.now(), items: merged.items, deleted: merged.deleted });
        fileId = await driveUpload(token, fileId, payload, DB_FILE_NAME);
      }
      fileRef.current = fileId;
      try { modRef.current = await driveModified(token, fileId); } catch (e) { /* polling just does a full sync next time */ }
      const now = Date.now();
      lsSet(LS_DB_FILE, JSON.stringify({ fileId, lastSync: now }));
      setLastSync(now); setStatus("done");
    } catch (e) { setStatus("error"); }
    finally { running.current = false; if (rerun.current) { rerun.current = false; setTimeout(() => run(), 0); } }
  }, [configured, acquireToken]);

  // After the library sync succeeds (first sign-in, reconnect, app start) the token is ready: sync the database too.
  useEffect(() => { if (configured && linked && drive.status === "done") run(); }, [configured, linked, drive.status]); // eslint-disable-line
  // Signing out forgets this account's file.
  useEffect(() => { if (!linked) { fileRef.current = null; modRef.current = null; lsRemove(LS_DB_FILE); setStatus("idle"); setLastSync(0); } }, [linked]);
  // Local changes (debounced so a burst becomes one sync).
  const first = useRef(true);
  useEffect(() => {
    if (first.current) { first.current = false; return undefined; }
    if (!linked) return undefined;
    const id = setTimeout(() => run(), 3000);
    return () => clearTimeout(id);
  }, [database.items, database.tombs, linked, run]);
  // Another device's changes: a cheap metadata check every 45 s and when the tab returns to the foreground.
  const poll = useCallback(async () => {
    const tk = peekToken();
    if (!configured || !linkedRef.current || running.current || !fileRef.current || !tk) return;
    try { const mod = await driveModified(tk, fileRef.current); if (mod && modRef.current && mod !== modRef.current) run(); } catch (e) { /* ignore */ }
  }, [configured, peekToken, run]);
  useEffect(() => {
    if (!configured) return undefined;
    const onVis = () => { if (document.visibilityState === "visible") poll(); };
    const id = setInterval(() => { if (document.visibilityState === "visible") poll(); }, 45000);
    document.addEventListener("visibilitychange", onVis);
    return () => { clearInterval(id); document.removeEventListener("visibilitychange", onVis); };
  }, [configured, poll]);

  return { available: !!(configured && linked), status, lastSync, syncNow: () => run({ interactive: true }) };
}

// ---- Sharing: a selection goes out as one .json file (share sheet where available, download otherwise) and can be imported from a file.
function serializeDatabase(list) {
  const items = list.map((n) => ({
    kind: n.kind, ...(n.key ? { key: n.key } : {}), text: n.text || "", comment: n.comment || "", ts: n.ts, source: n.source || {}, ...(n.question ? { question: n.question } : {}),
  }));
  return { json: JSON.stringify({ app: "oworld", type: DB_SHARE_TYPE, v: 1, exportedAt: Date.now(), items }, null, 2), fileName: `Personal Database (${items.length}).json` };
}
const dbStr = (v) => (typeof v === "string" ? v : "");
function cleanSharedQuestion(q) {
  if (!q || typeof q !== "object" || !Array.isArray(q.options)) return null;
  return {
    vignette: dbStr(q.vignette), stem: dbStr(q.stem), explanation: dbStr(q.explanation), keyLearningPoint: dbStr(q.keyLearningPoint), subject: dbStr(q.subject), correctAnswer: dbStr(q.correctAnswer),
    options: q.options.filter((o) => o && typeof o === "object").map((o) => ({ key: dbStr(o.key), text: dbStr(o.text) })),
  };
}
// -> array of items, or null when the file isn't a Personal Database export
function parseDatabaseFile(text) {
  let j; try { j = JSON.parse(text); } catch (e) { return null; }
  if (!j || j.type !== DB_SHARE_TYPE || !Array.isArray(j.items)) return null;
  return j.items.filter((n) => n && DB_KINDS_LIST.includes(n.kind)).map((n) => ({
    kind: n.kind, key: dbStr(n.key), text: dbStr(n.text), comment: dbStr(n.comment), ts: Number(n.ts) || 0,
    source: n.source && typeof n.source === "object" ? { block: dbStr(n.source.block), num: n.source.num || "", subject: dbStr(n.source.subject), field: dbStr(n.source.field) } : {},
    ...(cleanSharedQuestion(n.question) ? { question: cleanSharedQuestion(n.question) } : {}),
  })).filter((n) => n.text || n.question);
}
// Resolves "shared" | "downloaded" | "cancelled" | "error" and never rejects. No await before navigator.share (it needs the tap's user activation).
async function shareJsonFile({ json, fileName, title, text }) {
  try {
    if (typeof navigator !== "undefined" && typeof navigator.share === "function" && typeof navigator.canShare === "function" && typeof File === "function") {
      for (const type of ["application/json", "text/plain"]) {
        const file = new File([json], fileName, { type });
        if (!navigator.canShare({ files: [file] })) continue;
        await navigator.share({ files: [file], title: title || fileName, text: text || "" });
        return "shared";
      }
    }
  } catch (err) {
    if (err && err.name === "AbortError") return "cancelled";
  }
  try { downloadBlob(new Blob([json], { type: "application/json" }), fileName); return "downloaded"; } catch (e) { return "error"; }
}

// A compact copy of a question, enough to review it later without the original block.
function snapshotQuestion(q) {
  return {
    vignette: q.vignette || "", stem: q.stem || "", options: (q.options || []).map((o) => ({ key: o.key, text: o.text })), correctAnswer: q.correctAnswer,
    explanation: q.explanation || "", keyLearningPoint: q.keyLearningPoint || "", subject: q.subject || "",
  };
}

const DB_KINDS = {
  question: { tone: "blue", label: "dbKindQ", Icon: BookOpen },
  excerpt: { tone: "green", label: "dbKindE", Icon: Highlighter },
  note: { tone: "amber", label: "dbKindN", Icon: PencilLine },
};

// Every searchable text field of a Database item (used by the Database page filter and by the global search).
function dbItemFields(n) {
  const qq = n.question || {}; const src = n.source || {};
  const right = (qq.options || []).find((o) => o.key === qq.correctAnswer);
  const when = n.ts ? new Date(n.ts).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : "";
  return [n.text, n.comment, src.block, src.subject, src.num ? `#${src.num}` : "", qq.vignette, qq.stem, ...(qq.options || []).map((o) => o.text), right ? right.text : qq.correctAnswer, qq.explanation, qq.keyLearningPoint, qq.subject, when].filter(Boolean);
}

function DatabaseCard({ item, T, onUpdate, onRemove, selected = false, onToggle }) {
  const { t, lang } = useI18n();
  const kind = DB_KINDS[item.kind] || DB_KINDS.note;
  const [showAns, setShowAns] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [confirmDel, setConfirmDel] = useState(false);
  const [copied, setCopied] = useState(false);
  const isNote = item.kind === "note";
  const qq = item.question || null;
  const src = item.source || {};
  const srcLine = [src.block, src.num ? `#${src.num}` : "", src.subject].filter(Boolean).join(" · ");
  const when = new Date(item.ts).toLocaleDateString(lang === "es" ? "es" : "en-US", { month: "short", day: "numeric", year: "numeric" });
  const small = { fontFamily: FONT_UI, fontWeight: 600, fontSize: fs(12.5), background: "none", border: "none", padding: 0, cursor: "pointer", color: T.blue };

  function startEdit() { setDraft(isNote ? item.text || "" : item.comment || ""); setEditing(true); }
  function saveEdit() { onUpdate(item.id, isNote ? { text: draft } : { comment: draft }); setEditing(false); }
  function copy() {
    const parts = item.kind === "question" && qq
      ? [qq.vignette, qq.stem, ...(qq.options || []).map((o) => `${o.key}. ${o.text}`), `${t("correct")}: ${qq.correctAnswer}`, qq.explanation].filter(Boolean)
      : [item.text];
    if (item.comment) parts.push(item.comment);
    try { navigator.clipboard.writeText(parts.join("\n\n")).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1400); }).catch(() => {}); } catch (e) { /* ignore */ }
  }

  return (
    <div style={{ background: T.card, border: `1px solid ${selected ? T.blue : T.border}`, borderRadius: 10, padding: "14px 16px", display: "grid", gap: 10 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        {onToggle && <input type="checkbox" checked={selected} onChange={() => onToggle(item.id)} aria-label={t(kind.label)} style={{ width: 16, height: 16, margin: 0, cursor: "pointer", accentColor: T.blue }} />}
        <Pill T={T} tone={kind.tone}>{t(kind.label)}</Pill>
        {srcLine && <span style={{ fontFamily: FONT_UI, fontSize: fs(12), color: T.muted, minWidth: 0, overflowWrap: "anywhere" }}>{srcLine}</span>}
        <span style={{ marginLeft: "auto", fontFamily: FONT_UI, fontSize: fs(11.5), color: T.muted, whiteSpace: "nowrap" }}>{when}</span>
      </div>

      {item.kind === "excerpt" && (
        <blockquote style={{ margin: 0, padding: "2px 0 2px 12px", borderLeft: `3px solid ${T.green}`, fontFamily: FONT_UI, fontSize: fs(14), lineHeight: 1.55, color: T.ink, whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>{item.text}</blockquote>
      )}
      {isNote && !editing && (
        <p style={{ margin: 0, fontFamily: FONT_UI, fontSize: fs(14), lineHeight: 1.55, color: T.ink, whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>{item.text}</p>
      )}
      {item.kind === "question" && qq && (
        <div style={{ display: "grid", gap: 8 }}>
          {qq.vignette && <p style={{ margin: 0, fontFamily: FONT_UI, fontSize: fs(13.5), lineHeight: 1.55, color: T.ink, whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>{qq.vignette}</p>}
          {qq.stem && <p style={{ margin: 0, fontFamily: FONT_UI, fontWeight: 600, fontSize: fs(14), lineHeight: 1.5, color: T.ink, overflowWrap: "anywhere" }}>{qq.stem}</p>}
          <div style={{ display: "grid", gap: 4 }}>
            {(qq.options || []).map((o) => {
              const right = showAns && o.key === qq.correctAnswer;
              return (
                <div key={o.key} style={{
                  display: "flex", gap: 8, alignItems: "flex-start", padding: "6px 10px", borderRadius: 6, fontFamily: FONT_UI, fontSize: fs(13), lineHeight: 1.45, color: T.ink,
                  background: right ? T.greenLight : "transparent", border: `1px solid ${right ? T.green : T.border}`,
                }}>
                  <span style={{ fontWeight: 700, flexShrink: 0 }}>{o.key}.</span>
                  <span style={{ flex: 1, overflowWrap: "anywhere" }}>{o.text}</span>
                  {right && <span style={{ display: "inline-flex", alignItems: "center", gap: 4, color: T.green, fontWeight: 700, fontSize: fs(11.5), flexShrink: 0 }}><CheckCircle2 size={13} /> {t("dbCorrectTag")}</span>}
                </div>
              );
            })}
          </div>
          {showAns && (qq.explanation || qq.keyLearningPoint) && (
            <div style={{ background: T.mutedBg, borderRadius: 6, padding: "10px 12px", fontFamily: FONT_UI, fontSize: fs(13), lineHeight: 1.55, color: T.ink, whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>
              {qq.explanation}{qq.explanation && qq.keyLearningPoint ? "\n\n" : ""}{qq.keyLearningPoint}
            </div>
          )}
          <div><button onClick={() => setShowAns((v) => !v)} style={small}>{showAns ? t("dbHideAns") : t("dbShowAns")}</button></div>
        </div>
      )}

      {editing ? (
        <div style={{ display: "grid", gap: 8 }}>
          <textarea
            autoFocus value={draft} onChange={(e) => setDraft(e.target.value)} placeholder={isNote ? "" : t("dbCommentPh")}
            style={{ width: "100%", minHeight: 90, fontFamily: FONT_UI, fontSize: fs(13), border: `1px solid ${T.border}`, borderRadius: 6, padding: 8, resize: "vertical", boxSizing: "border-box", background: T.paper, color: T.ink }}
          />
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <GhostButton T={T} onClick={() => setEditing(false)}>{t("dbCancel")}</GhostButton>
            <PrimaryButton T={T} onClick={saveEdit}>{t("dbSave")}</PrimaryButton>
          </div>
        </div>
      ) : (
        !isNote && item.comment && (
          <div style={{ background: T.blueLight, borderRadius: 6, padding: "8px 12px", fontFamily: FONT_UI, fontSize: fs(13), lineHeight: 1.5, color: T.ink, whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>{item.comment}</div>
        )
      )}

      {!editing && (
        <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
          <button onClick={startEdit} style={small}>{isNote ? t("dbEdit") : item.comment ? t("dbEdit") : t("dbAddComment")}</button>
          <button onClick={copy} style={small}>{copied ? t("dbCopied") : t("dbCopy")}</button>
          <span style={{ marginLeft: "auto" }}>
            {confirmDel ? (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontFamily: FONT_UI, fontSize: fs(12.5), fontWeight: 600, color: T.red }}>{t("dbConfirmDel")}</span>
                <button onClick={() => onRemove(item.id)} style={{ ...small, color: T.red }}>{t("dbDelete")}</button>
                <button onClick={() => setConfirmDel(false)} style={{ ...small, color: T.muted }}>{t("dbCancel")}</button>
              </span>
            ) : (
              <button onClick={() => setConfirmDel(true)} style={{ ...small, color: T.muted, display: "inline-flex", alignItems: "center", gap: 5 }}><Trash2 size={13} /> {t("dbDelete")}</button>
            )}
          </span>
        </div>
      )}
    </div>
  );
}

function DatabasePanel({ T, initialQuery = "" }) {
  const { t, lang } = useI18n();
  const db = useContext(DbContext);
  const { items, update, remove, removeMany, clearAll, importItems, sync } = db;
  const drive = useContext(DriveContext);
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState(initialQuery);
  const [sel, setSel] = useState([]);
  const [confirm, setConfirm] = useState(null); // null | "clear" | "delSel"
  const [msg, setMsg] = useState(null);         // { tone, text } one-line result of an import / export
  const [managing, setManaging] = useState(false); // Manage: reveals Select all / Export / Delete Selected / Clear all (and the tick boxes)
  const fileRef = useRef(null);
  const msgTimer = useRef(null);
  useEffect(() => () => clearTimeout(msgTimer.current), []);
  const say = (tone, text) => { setMsg({ tone, text }); clearTimeout(msgTimer.current); msgTimer.current = setTimeout(() => setMsg(null), 6000); };

  const q = query.trim().toLowerCase();
  const shown = items.filter((n) => {
    if (filter !== "all" && n.kind !== filter) return false;
    if (!q) return true;
    return dbItemFields(n).join(" ").toLowerCase().includes(q);
  });
  const ids = new Set(items.map((n) => n.id));
  const liveSel = sel.filter((id) => ids.has(id));
  const allShownSelected = shown.length > 0 && shown.every((n) => liveSel.includes(n.id));
  const toggle = (id) => setSel((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));
  const managingOn = managing; // Manage also holds Import, so it opens even when the database is empty
  const toggleManage = () => { if (managing) { setSel([]); setConfirm(null); } setManaging(!managing); }; // closing Manage drops the selection
  const danger = { color: T.red, border: `1px solid ${T.red}` }; // the border shorthand, so toggling it on a button never mixes shorthand and longhand
  const chips = [["all", "dbAll"], ["question", "dbQuestions"], ["excerpt", "dbExcerpts"], ["note", "dbNotes"]];

  async function exportSelected() {
    const list = items.filter((n) => liveSel.includes(n.id));
    if (!list.length) return;
    const { json, fileName } = serializeDatabase(list); // synchronous, then straight into the share sheet
    const r = await shareJsonFile({ json, fileName, title: t("dbTitle"), text: t("dbShareText", { n: list.length }) });
    if (r === "cancelled") return;
    say(r === "error" ? "red" : "green", t(r === "shared" ? "dbShared" : r === "downloaded" ? "dbDownloaded" : "dbExportFailed", { n: list.length }));
  }
  async function onFile(e) {
    const file = e.target.files && e.target.files[0];
    e.target.value = "";
    if (!file) return;
    let text = "";
    try { text = await file.text(); } catch (err) { say("red", t("dbImportBad")); return; }
    const list = parseDatabaseFile(text);
    if (!list || list.length === 0) { say("red", t("dbImportBad")); return; }
    const r = importItems(list);
    say("green", t("dbImported", { a: r.added, s: r.skipped }));
  }

  const signedIn = !!(drive && drive.configured && drive.linked);
  const syncTone = { busy: "blue", done: "green", error: "red" }[sync.status] || "muted";
  const syncText = sync.status === "busy" ? t("syncStBusy") : sync.status === "error" ? t("syncStError")
    : sync.status === "done" ? t("syncStDone", { time: sync.lastSync ? new Date(sync.lastSync).toLocaleTimeString(lang === "es" ? "es" : "en-US", { hour: "numeric", minute: "2-digit" }) : "" }) : t("syncStNone");
  const toneColor = { green: T.green, red: T.red, muted: T.muted }[msg && msg.tone] || T.muted;

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <Database size={18} color={T.blue} />
        <span style={{ fontFamily: FONT_UI, fontWeight: 700, fontSize: fs(17), color: T.ink }}>{t("dbTitle")}</span>
        <span style={{ marginLeft: "auto", display: "inline-flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <GhostButton T={T} icon={managingOn ? ChevronUp : SlidersHorizontal} onClick={toggleManage} title={t("dbManage")}
            style={{ padding: "6px 10px", ...(managingOn ? { color: T.blue, border: `1px solid ${T.blue}`, background: T.blueLight } : {}) }}>{t("dbManage")}</GhostButton>
          {signedIn && (
            <>
              <Cloud size={15} color={T.blue} />
              <Pill T={T} tone={syncTone}>{syncText}</Pill>
              <GhostButton T={T} icon={RefreshCw} onClick={sync.syncNow} disabled={sync.status === "busy"} style={{ padding: "6px 10px" }}>{t("syncNow")}</GhostButton>
            </>
          )}
        </span>
      </div>
      <p style={{ margin: "-6px 0 0", fontFamily: FONT_UI, fontSize: fs(13), color: T.muted, lineHeight: 1.5 }}>
        {t("dbHint")}{drive && drive.configured && !signedIn ? ` ${t("dbSyncSignIn")}` : ""}
      </p>

      {managingOn && (
        <div role="toolbar" aria-label={t("dbManage")} style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", padding: "10px 12px", borderRadius: 8, border: `1px solid ${T.border}`, background: T.card }}>
          <input ref={fileRef} type="file" accept=".json,application/json,text/plain" onChange={onFile} style={{ display: "none" }} />
          <GhostButton T={T} icon={Upload} onClick={() => fileRef.current && fileRef.current.click()}>{t("dbImport")}</GhostButton>
          {items.length > 0 && (<>
          <GhostButton T={T} icon={CheckSquare} onClick={() => { setConfirm(null); setSel(allShownSelected ? [] : shown.map((n) => n.id)); }}>
            {allShownSelected ? t("histDeselect") : t("histSelectAll")}
          </GhostButton>
          <GhostButton T={T} icon={Download} onClick={exportSelected} disabled={liveSel.length === 0} title={t("dbExport")}>
            {t("dbExport")}{liveSel.length > 0 ? ` (${liveSel.length})` : ""}
          </GhostButton>
          <GhostButton T={T} icon={Trash2} onClick={() => setConfirm("delSel")} disabled={liveSel.length === 0} title={t("libDeleteSel")} style={liveSel.length > 0 ? danger : undefined}>
            {t("libDeleteSel")}{liveSel.length > 0 ? ` (${liveSel.length})` : ""}
          </GhostButton>
          <GhostButton T={T} icon={Trash2} onClick={() => setConfirm("clear")} title={t("dbClearAll")} style={danger}>{t("dbClearAll")}</GhostButton>
          </>)}
        </div>
      )}

      {confirm === "delSel" && liveSel.length > 0 && (
        <div role="alertdialog" style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", background: T.redLight, border: `1px solid ${T.red}`, borderRadius: 8, padding: "10px 14px" }}>
          <span style={{ fontFamily: FONT_UI, fontSize: fs(13), fontWeight: 600, color: T.red, flex: "1 1 200px" }}>{t("dbDelSelQ", { n: liveSel.length })}</span>
          <GhostButton T={T} onClick={() => setConfirm(null)}>{t("dbCancel")}</GhostButton>
          <GhostButton T={T} icon={Trash2} onClick={() => { removeMany(liveSel); setSel([]); setConfirm(null); }} style={{ color: T.red, borderColor: T.red }}>{t("dbDelete")}</GhostButton>
        </div>
      )}
      {confirm === "clear" && (
        <div role="alertdialog" style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", background: T.redLight, border: `1px solid ${T.red}`, borderRadius: 8, padding: "10px 14px" }}>
          <span style={{ fontFamily: FONT_UI, fontSize: fs(13), fontWeight: 600, color: T.red, flex: "1 1 200px" }}>{t("dbClearConfirm")}</span>
          <GhostButton T={T} onClick={() => setConfirm(null)}>{t("dbCancel")}</GhostButton>
          <GhostButton T={T} icon={Trash2} onClick={() => { clearAll(); setSel([]); setConfirm(null); }} style={{ color: T.red, borderColor: T.red }}>{t("dbClearAll")}</GhostButton>
        </div>
      )}
      {msg && <div role="status" style={{ fontFamily: FONT_UI, fontSize: fs(13), fontWeight: 600, color: toneColor }}>{msg.text}</div>}

      {items.length > 0 && (
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <div role="tablist" style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {chips.map(([id, label]) => {
              const on = filter === id;
              return (
                <button key={id} role="tab" aria-selected={on} onClick={() => setFilter(id)} style={{
                  fontFamily: FONT_UI, fontWeight: 600, fontSize: fs(13), padding: "7px 14px", borderRadius: 999, cursor: "pointer",
                  border: `1px solid ${on ? T.blue : T.border}`, background: on ? T.blueLight : "transparent", color: on ? T.blue : T.ink,
                }}>{t(label)}</button>
              );
            })}
          </div>
          <div style={{ position: "relative", flex: "1 1 200px", minWidth: 180 }}>
            <Search size={15} color={T.muted} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)" }} />
            <input
              value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t("dbSearch")} aria-label={t("dbSearch")}
              style={{ width: "100%", boxSizing: "border-box", fontFamily: FONT_UI, fontSize: fs(13), padding: "8px 10px 8px 32px", borderRadius: 6, border: `1px solid ${T.border}`, background: T.card, color: T.ink }}
            />
          </div>
        </div>
      )}

      {items.length === 0 ? (
        <div style={{ background: T.card, border: `1px dashed ${T.border}`, borderRadius: 10, padding: "36px 20px", textAlign: "center" }}>
          <Database size={28} color={T.muted} />
          <div style={{ fontFamily: FONT_UI, fontWeight: 700, fontSize: fs(15), color: T.ink, marginTop: 10 }}>{t("dbEmpty")}</div>
          <div style={{ fontFamily: FONT_UI, fontSize: fs(13), color: T.muted, marginTop: 6, lineHeight: 1.5, maxWidth: 460, marginInline: "auto" }}>{t("dbEmptyHint")}</div>
        </div>
      ) : shown.length === 0 ? (
        <div style={{ textAlign: "center", padding: "26px 10px", fontFamily: FONT_UI, fontSize: fs(13.5), color: T.muted }}>{t("dbNoMatch")}</div>
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          {shown.map((n) => <DatabaseCard key={n.id} item={n} T={T} onUpdate={update} onRemove={(id) => { remove(id); setSel((c) => c.filter((x) => x !== id)); }} selected={liveSel.includes(n.id)} onToggle={managingOn ? toggle : undefined} />)}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Trash: everything deleted from the Library, Analytics or Database waits here for TRASH_TTL, then is removed for good.
// Restore puts an entry back where it came from; Delete forever removes it right away.
// ---------------------------------------------------------------------------
const trashSnippet = (str, n = 140) => { const x = String(str || "").replace(/\s+/g, " ").trim(); return x.length > n ? `${x.slice(0, n - 1)}\u2026` : x; };

function TrashPanel({ trash, onRestore, onPurge, T, onClose }) {
  const { t, lang } = useI18n();
  const phone = useViewport().w < 640;
  const [filter, setFilter] = useState("all");
  const [sel, setSel] = useState([]);           // ticked tids
  const [confirm, setConfirm] = useState(null); // null | { ids } (delete forever) | "empty"
  const live = useMemo(() => trash.filter((e) => e.deletedAt + TRASH_TTL > Date.now()), [trash]);
  const counts = { all: live.length, qbank: 0, session: 0, dbitem: 0 };
  live.forEach((e) => { counts[e.kind] += 1; });
  const shown = filter === "all" ? live : live.filter((e) => e.kind === filter);
  const liveIds = new Set(live.map((e) => e.tid));
  const liveSel = sel.filter((id) => liveIds.has(id));
  const allShownSelected = shown.length > 0 && shown.every((e) => liveSel.includes(e.tid));
  const toggle = (id) => setSel((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));
  const loc = lang === "es" ? "es" : "en-US";
  const fmtDate = (ms) => new Date(ms).toLocaleDateString(loc, { month: "short", day: "numeric", year: "numeric" });
  const daysLeft = (e) => Math.max(0, Math.ceil((e.deletedAt + TRASH_TTL - Date.now()) / 86400000));
  const chips = [["all", "trashAll"], ["qbank", "trashQbanks"], ["session", "trashSessions"], ["dbitem", "trashDb"]];
  const danger = { color: T.red, border: `1px solid ${T.red}` }; // the border shorthand, so toggling it on a button never mixes shorthand and longhand
  const drop = (ids) => setSel((cur) => cur.filter((x) => !ids.includes(x)));
  const restore = (ids) => { onRestore(ids); drop(ids); setConfirm(null); };
  const purge = (ids) => { onPurge(ids); drop(ids); setConfirm(null); };
  const confirmIds = confirm === "empty" ? live.map((e) => e.tid) : confirm && confirm.ids ? confirm.ids.filter((id) => liveIds.has(id)) : [];

  return (
    <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 24, marginBottom: onClose ? 0 : 20 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
        <Trash2 size={17} color={T.ink} />
        <span style={{ fontFamily: FONT_UI, fontWeight: 600, fontSize: fs(14), color: T.ink }}>{t("trashTitle")}</span>
        <Pill T={T} tone="muted">{t("trashCount", { n: live.length })}</Pill>
        {onClose && (
          <button onClick={onClose} aria-label={t("cancel")} title={t("cancel")} style={{ marginLeft: "auto", display: "inline-flex", alignItems: "center", justifyContent: "center", width: 34, height: 34, borderRadius: 6, background: "transparent", border: `1px solid ${T.border}`, color: T.ink, cursor: "pointer" }}><X size={16} /></button>
        )}
      </div>
      <p style={{ margin: "0 0 14px", fontFamily: FONT_UI, fontSize: fs(13), color: T.muted, lineHeight: 1.5 }}>{t("trashHint", { d: Math.round(TRASH_TTL / 86400000) })}</p>

      {live.length > 0 && (
        <div role="toolbar" aria-label={t("trashTitle")} style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginBottom: 12 }}>
          <GhostButton T={T} icon={CheckSquare} onClick={() => { setConfirm(null); setSel(allShownSelected ? [] : shown.map((e) => e.tid)); }}>
            {allShownSelected ? t("histDeselect") : t("histSelectAll")}
          </GhostButton>
          <GhostButton T={T} icon={RotateCcw} onClick={() => restore(liveSel)} disabled={liveSel.length === 0} title={t("trashRestoreSel")}>
            {t("trashRestoreSel")}{liveSel.length > 0 ? ` (${liveSel.length})` : ""}
          </GhostButton>
          <GhostButton T={T} icon={Trash2} onClick={() => setConfirm({ ids: liveSel })} disabled={liveSel.length === 0} title={t("trashDeleteForever")} style={liveSel.length > 0 ? danger : undefined}>
            {t("trashDeleteForever")}{liveSel.length > 0 ? ` (${liveSel.length})` : ""}
          </GhostButton>
          <span style={{ marginLeft: "auto" }}>
            <GhostButton T={T} icon={Trash2} onClick={() => setConfirm("empty")} style={danger}>{t("trashEmptyBtn")}</GhostButton>
          </span>
        </div>
      )}

      {confirmIds.length > 0 && (
        <div role="alertdialog" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap", padding: "10px 14px", marginBottom: 12, borderRadius: 8, border: `1px solid ${T.red}`, background: T.redLight }}>
          <span style={{ fontFamily: FONT_UI, fontSize: fs(13), fontWeight: 600, color: T.red }}>{t(confirm === "empty" ? "trashEmptyQ" : "trashPurgeQ", { n: confirmIds.length })}</span>
          <span style={{ display: "inline-flex", gap: 8 }}>
            <button onClick={() => purge(confirmIds)} style={{ fontFamily: FONT_UI, fontWeight: 700, fontSize: fs(12.5), padding: "7px 12px", borderRadius: 6, border: `1px solid ${T.red}`, background: T.red, color: "#fff", cursor: "pointer" }}>{t("trashDeleteForever")}</button>
            <GhostButton T={T} onClick={() => setConfirm(null)}>{t("cancel")}</GhostButton>
          </span>
        </div>
      )}

      {live.length > 0 && (
        <div role="tablist" style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
          {chips.map(([id, label]) => {
            const on = filter === id;
            return (
              <button key={id} role="tab" aria-selected={on} onClick={() => setFilter(id)} style={{
                fontFamily: FONT_UI, fontWeight: 600, fontSize: fs(13), padding: "7px 14px", borderRadius: 999, cursor: "pointer",
                border: `1px solid ${on ? T.blue : T.border}`, background: on ? T.blueLight : "transparent", color: on ? T.blue : T.ink,
              }}>{t(label)} ({counts[id]})</button>
            );
          })}
        </div>
      )}

      {live.length === 0 ? (
        <div style={{ border: `1px dashed ${T.border}`, borderRadius: 10, padding: "36px 20px", textAlign: "center" }}>
          <Trash2 size={28} color={T.muted} />
          <div style={{ fontFamily: FONT_UI, fontWeight: 700, fontSize: fs(15), color: T.ink, marginTop: 10 }}>{t("trashEmpty")}</div>
          <div style={{ fontFamily: FONT_UI, fontSize: fs(13), color: T.muted, marginTop: 6, lineHeight: 1.5, maxWidth: 460, marginInline: "auto" }}>{t("trashEmptyHint")}</div>
        </div>
      ) : shown.length === 0 ? (
        <div style={{ textAlign: "center", padding: "26px 10px", fontFamily: FONT_UI, fontSize: fs(13.5), color: T.muted }}>{t("trashNoneHere")}</div>
      ) : (
        <div style={{ display: "grid", gap: 8 }}>
          {shown.map((e) => {
            const d = e.data; const picked = liveSel.includes(e.tid);
            let title, kindLabel, tone, meta, score = null;
            if (e.kind === "qbank") {
              title = d.title; kindLabel = t("trashKindQbank"); tone = "blue"; meta = t("histQ", { n: (d.questions || []).length });
            } else if (e.kind === "session") {
              title = sessionTitle(d, t); kindLabel = t("trashKindSession"); tone = "amber"; meta = t("histDone", { d: fmtDate(d.finishedAt) });
              score = <Pill T={T} tone={d.pct >= 70 ? "green" : "red"}>{d.pct}% ({d.correct}/{d.total})</Pill>;
            } else {
              const k = DB_KINDS[d.kind] || DB_KINDS.note; const src = d.source || {};
              title = trashSnippet(d.kind === "question" && d.question ? d.question.stem || d.text : d.text) || t(k.label);
              kindLabel = t(k.label); tone = k.tone; meta = [src.block, src.subject].filter(Boolean).join(" \u00b7 ");
            }
            const left = daysLeft(e);
            const leftText = left <= 1 ? t("trashLastDay") : t("trashDaysLeft", { n: left });
            return (
              <div key={e.tid} onClick={() => toggle(e.tid)} style={{
                display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", padding: "12px 14px", borderRadius: 8, cursor: "pointer",
                border: `1px solid ${picked ? T.blue : T.border}`, background: picked ? T.blueLight : "transparent",
              }}>
                <input type="checkbox" checked={picked} onChange={() => toggle(e.tid)} onClick={(ev) => ev.stopPropagation()} aria-label={title} style={{ cursor: "pointer", width: 18, height: 18 }} />
                <div style={{ flex: 1, minWidth: 180 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <Pill T={T} tone={tone}>{kindLabel}</Pill>
                    <span style={{ fontFamily: FONT_UI, fontWeight: 700, fontSize: fs(14), color: T.ink, overflowWrap: "anywhere", minWidth: 0 }}>{title}</span>
                    {score}
                  </div>
                  <span style={{ fontFamily: FONT_MONO, fontSize: fs(12), color: T.muted }}>
                    {[meta, t("trashDeletedAgo", { d: fmtDate(e.deletedAt) }), leftText].filter(Boolean).join(" \u00b7 ")}
                  </span>
                </div>
                <span style={{ display: "inline-flex", gap: 6 }}>
                  <GhostButton T={T} icon={RotateCcw} onClick={(ev) => { ev.stopPropagation(); restore([e.tid]); }} title={t("trashRestore")} style={phone ? { padding: "11px 12px" } : undefined}>{!phone && t("trashRestore")}</GhostButton>
                  <GhostButton T={T} icon={Trash2} onClick={(ev) => { ev.stopPropagation(); setConfirm({ ids: [e.tid] }); }} title={t("trashDeleteForever")} style={{ ...danger, ...(phone ? { padding: "11px 12px" } : {}) }}>{!phone && t("trashDeleteForever")}</GhostButton>
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

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
const HINT_YELLOW_STRONG = "rgba(234,179,8,0.38)"; // correct option when a hint was used (reads on light and dark)
const HINT_YELLOW_SOFT = "rgba(234,179,8,0.16)";   // its explanation panel
const HIGHLIGHT_TEXT = "#0F172A"; // Tailwind slate-900
// Highlighter palette (pastel fill + a slightly deeper hover tone). Dark text stays readable on all of them in both themes.
const HL_COLORS = {
  yellow: { bg: "#FEF08A", hover: "#FDE047", label: "hlYellow" },
  green:  { bg: "#BBF7D0", hover: "#86EFAC", label: "hlGreen" },
  blue:   { bg: "#BFDBFE", hover: "#93C5FD", label: "hlBlue" },
  pink:   { bg: "#FBCFE8", hover: "#F9A8D4", label: "hlPink" },
};
const HL_COLOR_KEYS = Object.keys(HL_COLORS);
const DEFAULT_HL = "yellow"; // highlights saved before colors existed have no `color` and render as yellow

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

// Adds one highlight to a field's list. Same-colored neighbours merge into one range; a different color painted over
// existing highlights replaces just the overlapped part (the old range is trimmed or split around it).
function insertHighlight(existing, incoming) {
  const norm = (c) => (HL_COLORS[c] ? c : DEFAULT_HL); // a color that no longer exists (orange) falls back to yellow
  const color = norm(incoming.color);
  const kept = [];
  existing.forEach((r) => {
    const rc = norm(r.color);
    if (rc === color || r.end <= incoming.start || r.start >= incoming.end) { kept.push(r); return; }
    if (r.start < incoming.start) kept.push({ ...r, end: incoming.start });
    if (r.end > incoming.end) kept.push({ ...r, id: `${r.id}_r${incoming.end}`, start: incoming.end });
  });
  const all = [...kept, { ...incoming, color }];
  const out = [];
  HL_COLOR_KEYS.forEach((c) => {
    out.push(...mergeHighlightRanges(all.filter((r) => norm(r.color) === c)).map((r) => ({ ...r, color: c })));
  });
  return out.sort((a, b) => a.start - b.start);
}

function useHighlighter(initialMap) {
  // highlightsMap: { [questionId]: { [field]: [{ id, start, end, color }] } }
  const [highlightsMap, setHighlightsMap] = useState(initialMap || {});
  const [hlColor, setHlColorState] = useState(() => { const c = lsGet("hlColor"); return HL_COLORS[c] ? c : DEFAULT_HL; });
  function setHlColor(c) { if (!HL_COLORS[c]) return; setHlColorState(c); lsSet("hlColor", JSON.stringify(c)); }
  const [pending, setPending] = useState(null); // { qId, field, containerEl, x, y, range }

  function addHighlight(qId, field, start, end, color) {
    if (end <= start) return;
    const col = HL_COLORS[color] ? color : DEFAULT_HL;
    setHighlightsMap((prev) => {
      const qMap = prev[qId] || {};
      const existing = qMap[field] || [];
      const id = `hl_${Date.now()}_${Math.round(Math.random() * 1e6)}`;
      const merged = insertHighlight(existing, { id, start, end, color: col });
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

  function commitPending(color) {
    if (!pending) return;
    const col = HL_COLORS[color] ? color : hlColor;
    if (col !== hlColor) setHlColor(col); // the last color used becomes the default (also for Alt+H)
    const { qId, field, containerEl, range } = pending;
    const { start, end } = rangeToOffsets(containerEl, range);
    addHighlight(qId, field, start, end, col);
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
    addHighlight(qId, field, start, end, hlColor);
    sel.removeAllRanges();
    setPending(null);
  }

  function clearPending() { setPending(null); }

  return { highlightsMap, pending, handleSelectionInContainer, commitPending, handleGlobalKeyDown, removeHighlight, clearPending, hlColor, setHlColor };
}

// Row of round color swatches. `onPick(colorKey)` fires on click; the active color gets a ring.
function HighlightSwatches({ value, onPick, T, t, size = 18, ring }) {
  return (
    <span role="group" aria-label={t("hlColor")} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
      {HL_COLOR_KEYS.map((k) => (
        <button
          key={k}
          type="button"
          onMouseDown={(e) => e.preventDefault()} // keep the text selection alive while picking
          onClick={() => onPick(k)}
          title={t(HL_COLORS[k].label)}
          aria-label={t(HL_COLORS[k].label)}
          aria-pressed={k === value}
          style={{
            width: size, height: size, borderRadius: "50%", padding: 0, cursor: "pointer", background: HL_COLORS[k].bg,
            border: k === value ? `2px solid ${ring || T.ink}` : "1px solid rgba(0,0,0,0.35)",
            boxSizing: "border-box", flexShrink: 0,
          }}
        />
      ))}
    </span>
  );
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

// Renders text with user highlights (colored, click to remove) and, optionally, key-clue
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
      const hc = HL_COLORS[u.color] || HL_COLORS[DEFAULT_HL];
      nodes.push(
        <mark
          key={`${u.id}-${s0}`}
          data-highlight-id={u.id}
          title="Click to remove highlight"
          onClick={(e) => { e.stopPropagation(); onRemoveHighlight(u.id); }}
          style={{
            background: hc.bg, color: HIGHLIGHT_TEXT, borderRadius: 2, padding: "0 1px",
            cursor: "pointer", transition: "background 0.15s ease",
            ...(isClue && clueStyle ? { borderBottom: clueStyle.borderBottom } : {}),
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = hc.hover; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = hc.bg; }}
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
    purple: { bg: T.purpleLight, fg: T.purple },
  };
  const t = tones[tone] || tones.muted;
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

// Bare question mark (no circle) used by the Help button and the guide's title.
function QuestionMarkIcon({ size = 15, color = "currentColor", style }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" style={style} aria-hidden="true">
      <path d="M8.5 9a3.5 3.5 0 1 1 5.3 3c-1 .6-1.8 1.4-1.8 2.8" />
      <line x1="12" y1="19.5" x2="12.01" y2="19.5" />
    </svg>
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

// Round profile photo with a letter fallback (Google photo URLs can fail offline or when blocked).
function Avatar({ profile, size = 36, T }) {
  const [bad, setBad] = useState(false);
  useEffect(() => { setBad(false); }, [profile && profile.picture]);
  const letter = ((profile && (profile.name || profile.email)) || "").trim().charAt(0).toUpperCase();
  if (profile && profile.picture && !bad) {
    return <img src={profile.picture} alt="" referrerPolicy="no-referrer" onError={() => setBad(true)} style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", display: "block", flexShrink: 0 }} />;
  }
  return (
    <span style={{ width: size, height: size, borderRadius: "50%", background: T.blue, color: T.onBlue, display: "inline-flex", alignItems: "center", justifyContent: "center", fontFamily: FONT_UI, fontWeight: 700, fontSize: Math.round(size * 0.42), flexShrink: 0 }}>
      {letter || <UserIcon size={Math.round(size * 0.5)} />}
    </span>
  );
}

// Any screen can ask for the Account window; the menu that is on screen answers.
const OPEN_ACCOUNT_EVENT = "oworld:open-account";
const openAccountWindow = () => { try { window.dispatchEvent(new Event(OPEN_ACCOUNT_EVENT)); } catch (e) { /* ignore */ } };

// Account settings + deletion. The creation date is the day this device first saw the signed-in account.
const LS_ACCOUNT_CREATED = "owordAccountCreated";
const ACCOUNT_DATA_KEYS = [LS_SESSION, LS_LIBRARY, LS_PREFS, LS_HISTORY, LS_TOMBS, LS_TRASH, LS_CAREER, LS_NOTIFS, LS_SP, LS_BP, LS_DB, LS_DB_TOMBS];
const ACCOUNT_SYNC_KEYS = [LS_SYNC, LS_CAREER_FILE, LS_SP_FILE, LS_SP_LEDGER, LS_BP_FILE, LS_BP_LEDGER, LS_DB_FILE, LS_ACTIVE_SYNC, LS_SESSION_FILE, LS_ACCOUNT_CREATED];
function accountStoredKeys() {
  const keys = [...ACCOUNT_DATA_KEYS];
  try { for (let i = 0; i < window.localStorage.length; i++) { const k = window.localStorage.key(i); if (k && k.indexOf(LS_REVIEW) === 0) keys.push(k); } } catch (e) { /* ignore */ }
  return keys;
}
// One JSON file with everything stored for this account on this device. Resolves true when the download started.
function downloadAccountFiles(fileName, account) {
  try {
    const data = {};
    accountStoredKeys().forEach((k) => { const v = lsGet(k); if (v != null) data[k] = v; });
    const bundle = { app: "OWORLD", kind: "account-backup", exportedAt: new Date().toISOString(), account, data };
    downloadBlob(new Blob([JSON.stringify(bundle, null, 2)], { type: "application/json" }), fileName);
    return true;
  } catch (e) { return false; }
}
function wipeAccountData() {
  accountStoredKeys().forEach(lsRemove);
  ACCOUNT_SYNC_KEYS.forEach(lsRemove);
}

// Career & study form inside the Account window. Every change saves at once (no Save button) and syncs through Drive when signed in.
function CareerStudyForm({ T }) {
  const { t, lang } = useI18n();
  const cp = useContext(CareerContext);
  const drive = useContext(DriveContext);
  const vp = useViewport();
  const narrow = vp.w < 560;
  const c = cp.career;
  const locale = lang === "es" ? "es" : "en-US";
  const [deleting, setDeleting] = useState(false);
  const [saved, setSaved] = useState(true); // changes already save as you type; this just tells the student so
  const firstRun = useRef(true);
  useEffect(() => { if (firstRun.current) { firstRun.current = false; return; } setSaved(false); }, [cp.career]);
  const [objOpen, setObjOpen] = useState(false);   // Study objective: collapsed until opened
  const [acctOpen, setAcctOpen] = useState(false); // Account Settings: collapsed until opened
  const [dl, setDl] = useState("idle"); // idle | done | error
  const linked = !!(drive && drive.configured && drive.linked);
  const acct = linked && drive.profile ? drive.profile : null;
  const [created, setCreated] = useState(() => { const v = lsGet(LS_ACCOUNT_CREATED); return typeof v === "number" ? v : 0; });
  useEffect(() => {
    if (!acct || created) return;
    const now = Date.now(); lsSet(LS_ACCOUNT_CREATED, JSON.stringify(now)); setCreated(now);
  }, [acct, created]);
  const thisYear = new Date().getFullYear();
  const years = []; for (let y = thisYear - 3; y <= thisYear + 10; y++) years.push(y);
  if (c.gradYear && !years.includes(c.gradYear)) { years.push(c.gradYear); years.sort((a, b) => a - b); }
  const next = careerNextStep(c, new Date());
  const when = next ? (next.days === 0 ? t("spToday").toLowerCase() : next.days === 1 ? t("spTomorrow").toLowerCase() : t("spInDays", { n: next.days })) : "";
  const toggle = (field, key) => cp.set({ [field]: c[field].includes(key) ? c[field].filter((k) => k !== key) : [...c[field], key] });
  const setStepDate = (key, v) => { const d = { ...c.stepDates }; if (v) d[key] = v; else delete d[key]; cp.set({ stepDates: d }); };

  const head = { fontFamily: FONT_UI, fontWeight: 600, fontSize: fs(14), color: T.ink, margin: 0 };
  const sub = { fontFamily: FONT_UI, fontSize: fs(12.5), color: T.muted, lineHeight: 1.5, margin: "3px 0 0" };
  const lab = { display: "block", fontFamily: FONT_UI, fontWeight: 600, fontSize: fs(12.5), color: T.ink, marginBottom: 5 };
  const field = { width: "100%", boxSizing: "border-box", fontFamily: FONT_UI, fontSize: fs(13.5), padding: "8px 10px", borderRadius: 6, border: `1px solid ${T.border}`, background: T.paper, color: T.ink };
  const grid2 = { display: "grid", gridTemplateColumns: narrow ? "1fr" : "1fr 1fr", gap: 12 };
  const chip = (on) => ({
    display: "flex", alignItems: "center", gap: 8, width: "100%", boxSizing: "border-box", textAlign: "left", cursor: "pointer", minHeight: 40,
    padding: "8px 12px", borderRadius: 6, fontFamily: FONT_UI, fontWeight: 600, fontSize: fs(13.5),
    border: `1px solid ${on ? T.blue : T.border}`, background: on ? T.blueLight : T.card, color: on ? T.blue : T.ink,
  });
  const tick = (on) => (
    <span aria-hidden="true" style={{ width: 16, height: 16, borderRadius: 4, flexShrink: 0, display: "inline-flex", alignItems: "center", justifyContent: "center", border: `1.5px solid ${on ? T.blue : T.muted}`, background: on ? T.blue : "transparent" }}>
      {on && <Check size={11} color={T.onBlue} strokeWidth={3} />}
    </span>
  );
  const foldHead = (Icon, title, open, toggle) => (
    <button type="button" onClick={toggle} aria-expanded={open} style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", background: "transparent", border: "none", padding: 0, cursor: "pointer", textAlign: "left" }}>
      {Icon && <Icon size={16} color={T.ink} />}
      <h3 style={{ ...head, flex: 1 }}>{title}</h3>
      {open ? <ChevronUp size={16} color={T.muted} /> : <ChevronDown size={16} color={T.muted} />}
    </button>
  );
  const text = (id, key, ph, list) => (
    <div>
      <label htmlFor={id} style={lab}>{t(`cp${key[0].toUpperCase()}${key.slice(1)}`)}</label>
      <input id={id} type="text" value={c[key]} placeholder={ph} list={list} maxLength={120} autoComplete="off" onChange={(e) => cp.set({ [key]: e.target.value })} style={field} />
    </div>
  );

  return (
    <div style={{ display: "grid", gap: 22 }}>
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <GraduationCap size={17} color={T.ink} />
          <h3 style={head}>{t("cpTitle")}</h3>
        </div>
        <p style={sub}>{t("cpHint")}</p>
      </div>

      <section aria-label={t("cpAbout")} style={{ display: "grid", gap: 12 }}>
        <div style={grid2}>
          <div>
            <label htmlFor="cp-status" style={lab}>{t("cpStatus")}</label>
            <select id="cp-status" value={c.status} onChange={(e) => cp.set({ status: e.target.value })} style={field}>
              <option value="">{t("cpStatus.pick")}</option>
              {CAREER_STATUSES.map((k) => <option key={k} value={k}>{t(`cpStatus.${k}`)}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="cp-year" style={lab}>{t("cpGradYear")}</label>
            <select id="cp-year" value={c.gradYear || ""} onChange={(e) => cp.set({ gradYear: e.target.value ? Number(e.target.value) : null })} style={field}>
              <option value="">{t("cpStatus.pick")}</option>
              {years.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>
        <div style={grid2}>
          {text("cp-country", "country", t("cpPhCountry"), "cp-countries")}
          {text("cp-city", "city", t("cpPhCity"))}
        </div>
        {text("cp-university", "university", t("cpPhUniversity"))}
        <datalist id="cp-countries">
          {["Dominican Republic", "United States", "Puerto Rico", "Mexico", "Colombia", "Venezuela", "Haiti", "Canada", "Spain"].map((n) => <option key={n} value={n} />)}
        </datalist>
      </section>

      <section aria-label={t("cpObjective")} style={{ display: "grid", gap: 16 }}>
        {foldHead(null, t("cpObjective"), objOpen, () => setObjOpen((v) => !v))}
        {objOpen && (
          <>

        <div role="group" aria-labelledby="cp-work-h">
          <div id="cp-work-h" style={lab}>{t("cpCoursework")}</div>
          <p style={{ ...sub, margin: "0 0 8px" }}>{t("cpCourseworkHint")}</p>
          <div style={{ display: "grid", gridTemplateColumns: narrow ? "1fr" : "repeat(3, minmax(0, 1fr))", gap: 8 }}>
            {CAREER_COURSEWORK.map((k) => {
              const on = c.coursework.includes(k);
              return <button key={k} type="button" aria-pressed={on} onClick={() => toggle("coursework", k)} style={chip(on)}>{tick(on)}<span>{t(`cpWork.${k}`)}</span></button>;
            })}
          </div>
        </div>

        <div role="group" aria-labelledby="cp-usmle-h">
          <div id="cp-usmle-h" style={lab}>{t("cpUsmle")}</div>
          <p style={{ ...sub, margin: "0 0 8px" }}>{t("cpUsmleHint")}</p>
          <div style={{ display: "grid", gridTemplateColumns: narrow ? "1fr" : "repeat(3, minmax(0, 1fr))", gap: 8, alignItems: "start" }}>
            {CAREER_STEPS.map((k) => {
              const on = c.usmle.includes(k);
              return (
                <div key={k} style={{ display: "grid", gap: 6 }}>
                  <button type="button" aria-pressed={on} onClick={() => toggle("usmle", k)} style={chip(on)}>{tick(on)}<span>{t(`cpStep.${k}`)}</span></button>
                  {on && (
                    <input type="date" aria-label={`${t(`cpStep.${k}`)}: ${t("cpTargetDate")}`} value={c.stepDates[k] || ""} onChange={(e) => setStepDate(k, e.target.value)} style={field} />
                  )}
                </div>
              );
            })}
          </div>
          {next && (
            <p style={{ ...sub, margin: "10px 0 0", color: T.ink }}>
              {t("cpNext", { step: t(`cpStep.${next.key}`), when, date: next.date.toLocaleDateString(locale, { month: "short", day: "numeric", year: "numeric" }) })}
            </p>
          )}
        </div>
          </>
        )}
      </section>

      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        {saved
          ? <GhostButton T={T} icon={Check} disabled style={{ color: T.green, border: `1px solid ${T.green}`, cursor: "default" }}>{t("acctSaved")}</GhostButton>
          : <PrimaryButton T={T} icon={Save} onClick={() => { try { if (cp.sync && cp.sync.available) cp.sync.syncNow(); } catch (e) { /* ignore */ } setSaved(true); }}>{t("acctSave")}</PrimaryButton>}
        <span role="status" aria-live="polite" style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }}>{saved ? t("acctSaved") : ""}</span>
      </div>

      <section aria-label={t("acctSettings")} style={{ display: "grid", gap: 10, borderTop: `1px solid ${T.border}`, paddingTop: 16 }}>
        {foldHead(UserIcon, t("acctSettings"), acctOpen, () => setAcctOpen((v) => !v))}
        {acctOpen && (
          <>
        {!acct && <p style={sub}>{t("acctSignedOutHint")}</p>}
        <dl style={{ margin: 0, display: "grid", gridTemplateColumns: narrow ? "1fr" : "150px 1fr", gap: narrow ? "2px 0" : "8px 12px", fontFamily: FONT_UI, fontSize: fs(13.5) }}>
          {[
            [t("acctName"), acct && acct.name],
            [t("acctEmail"), acct && acct.email],
            [t("acctLinked"), acct && t("acctLinkedGoogle")],
            [t("acctCreated"), acct && created ? new Date(created).toLocaleDateString(locale, { year: "numeric", month: "long", day: "numeric" }) : ""],
          ].map(([k, v]) => (
            <React.Fragment key={k}>
              <dt style={{ color: T.muted, fontWeight: 600, marginTop: narrow ? 8 : 0 }}>{k}</dt>
              <dd style={{ margin: 0, color: v ? T.ink : T.muted, overflowWrap: "anywhere" }}>{v || t("acctNone")}</dd>
            </React.Fragment>
          ))}
        </dl>
          <section aria-label={t("dzTitle")} style={{ border: `1px solid ${T.red}`, borderRadius: 8, padding: 14, display: "grid", gap: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <AlertTriangle size={16} color={T.red} />
              <h3 style={{ ...head, color: T.red }}>{t("dzTitle")}</h3>
            </div>
            <p style={sub}>{t("dzDesc")}</p>
            {!deleting && (
              <button type="button" onClick={() => { setDl("idle"); setDeleting(true); }}
                style={{ justifySelf: "start", display: "inline-flex", alignItems: "center", gap: 6, fontFamily: FONT_UI, fontWeight: 600, fontSize: fs(13), padding: "9px 14px", borderRadius: 6, cursor: "pointer", background: T.red, color: T.onBlue, border: `1px solid ${T.red}` }}>
                <Trash2 size={14} />{t("dzDelete")}
              </button>
            )}
            {deleting && (
              <div role="alert" style={{ background: T.redLight, border: `1px solid ${T.red}`, borderRadius: 6, padding: 12, display: "grid", gap: 10 }}>
                <p style={{ fontFamily: FONT_UI, fontSize: fs(12.5), color: T.ink, lineHeight: 1.5, margin: 0 }}>{t("dzDownloadFirst")}{linked ? ` ${t("dzDriveNote")}` : ""}</p>
                <button type="button" onClick={() => setDl(downloadAccountFiles(t("dzFileName", { d: new Date().toISOString().slice(0, 10) }), acct ? { name: acct.name, email: acct.email, linkedVia: "Google", created: created || null } : null) ? "done" : "error")}
                  style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6, fontFamily: FONT_UI, fontWeight: 600, fontSize: fs(13), padding: "9px 12px", borderRadius: 6, cursor: "pointer", background: T.blue, color: T.onBlue, border: `1px solid ${T.blue}` }}>
                  <Download size={14} />{t("dzDownload")}
                </button>
                {dl !== "idle" && <span role="status" style={{ fontFamily: FONT_UI, fontSize: fs(12), color: dl === "done" ? T.ink : T.red }}>{dl === "done" ? t("dzDownloaded") : t("dzDownloadFailed")}</span>}
                <div style={{ display: "flex", gap: 8 }}>
                  <button type="button" onClick={() => setDeleting(false)} style={{ flex: 1, fontFamily: FONT_UI, fontWeight: 600, fontSize: fs(13), padding: "8px 10px", borderRadius: 6, cursor: "pointer", background: "transparent", color: T.ink, border: `1px solid ${T.border}` }}>{t("cancel")}</button>
                  <button type="button" disabled={dl !== "done"} onClick={() => { try { if (linked) drive.signOut(); } catch (e) { /* ignore */ } wipeAccountData(); setTimeout(() => { wipeAccountData(); window.location.reload(); }, 60); }}
                    style={{ flex: 1, fontFamily: FONT_UI, fontWeight: 600, fontSize: fs(13), padding: "8px 10px", borderRadius: 6, cursor: dl === "done" ? "pointer" : "not-allowed", opacity: dl === "done" ? 1 : 0.5, background: T.red, color: T.onBlue, border: `1px solid ${T.red}` }}>{t("dzConfirmGo")}</button>
                </div>
                {dl !== "done" && (
                  <button type="button" onClick={() => { try { if (linked) drive.signOut(); } catch (e) { /* ignore */ } wipeAccountData(); setTimeout(() => { wipeAccountData(); window.location.reload(); }, 60); }}
                    style={{ justifySelf: "center", background: "none", border: "none", padding: 4, cursor: "pointer", fontFamily: FONT_UI, fontSize: fs(12), color: T.muted, textDecoration: "underline" }}>{t("dzSkip")}</button>
                )}
              </div>
            )}
          </section>
          </>
        )}
      </section>
    </div>
  );
}

// One menu behind the profile picture (upper right of every screen): Google account + Drive sync status, then the app settings.
// Signed in: round photo, plus the user's name on larger displays. Signed out: a generic account icon.
function SettingsMenu({ darkMode, setDarkMode, T, iconOnly = false, onHelp }) {
  const { t, lang } = useI18n();
  const drive = useContext(DriveContext);
  const trashCtx = useContext(TrashContext);
  const nav = useContext(NavContext);
  const cp = useContext(CareerContext);
  const vp = useViewport();
  const [open, setOpen] = useState(false);
  const [popup, setPopup] = useState(null); // null | "trash" | "account" | "settings"
  const wrapRef = useRef(null);
  const trashLive = trashCtx.trash.filter((e) => e.deletedAt + TRASH_TTL > Date.now()).length;
  useEffect(() => {
    if (!popup) return undefined;
    const esc = (e) => { if (e.key === "Escape") setPopup(null); };
    document.addEventListener("keydown", esc);
    return () => document.removeEventListener("keydown", esc);
  }, [popup]);
  const [place, setPlace] = useState({ right: 0 });
  useEffect(() => {
    const onOpen = () => { if (wrapRef.current && wrapRef.current.getClientRects().length) { setOpen(false); setPopup("account"); } };
    window.addEventListener(OPEN_ACCOUNT_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_ACCOUNT_EVENT, onOpen);
  }, []);
  useEffect(() => {
    if (!open) return undefined;
    const away = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false); };
    const esc = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", away); document.addEventListener("touchstart", away); document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("mousedown", away); document.removeEventListener("touchstart", away); document.removeEventListener("keydown", esc); };
  }, [open]);

  const signedIn = !!(drive && drive.configured && drive.linked);
  const profile = signedIn ? drive.profile : null;
  const displayName = profile ? (profile.name || (profile.email || "").split("@")[0]) : "";
  const careerText = careerLine(cp.career, t);
  const objectiveItems = [
    ...(cp.career.coursework || []).map((k) => ({ k: `w-${k}`, label: t(`cpWork.${k}`) })),
    ...(cp.career.usmle || []).map((k) => ({ k: `s-${k}`, label: t(`cpStep.${k}`) })),
  ];
  const reauth = signedIn && drive.status === "reauth";
  const stText = drive ? {
    busy: t("syncStBusy"), reauth: t("syncStReauth"), error: t("syncStError"), none: t("syncStNone"), off: t("syncOff"),
    done: t("syncStDone", { time: drive.lastSync ? new Date(drive.lastSync).toLocaleTimeString(lang === "es" ? "es" : "en-US", { hour: "numeric", minute: "2-digit" }) : "" }),
  }[drive.status] : "";
  const tone = drive ? ({ done: "green", busy: "blue", reauth: "amber", error: "red" }[drive.status] || "muted") : "muted";

  // When the header wraps (phones) the button can sit near the left edge. Right-align the dropdown when it fits,
  // else open it to the right, else pin it inside the viewport, so it is never clipped off-screen.
  function toggle() {
    if (!open && wrapRef.current) {
      const r = wrapRef.current.getBoundingClientRect();
      const vw = window.innerWidth;
      const W = Math.min(320, vw - 16);
      if (r.right - W >= 8) setPlace({ right: 0 });
      else if (r.left + W <= vw - 8) setPlace({ left: 0 });
      else setPlace({ left: 8 - r.left });
    }
    setOpen((v) => !v);
  }
  const seg = (active) => ({
    flex: 1, fontFamily: FONT_UI, fontWeight: 600, fontSize: fs(13), padding: "8px 6px", cursor: "pointer", border: "none",
    background: active ? T.blueLight : "transparent", color: active ? T.blue : T.ink,
  });
  const label = { fontFamily: FONT_UI, fontWeight: 700, fontSize: fs(11), color: T.muted, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 6 };
  const popupClose = (
    <button onClick={() => setPopup(null)} aria-label={t("cancel")} title={t("cancel")} style={{ marginLeft: "auto", display: "inline-flex", alignItems: "center", justifyContent: "center", width: 34, height: 34, borderRadius: 6, background: "transparent", border: `1px solid ${T.border}`, color: T.ink, cursor: "pointer" }}><X size={16} /></button>
  );

  return (
    <div ref={wrapRef} style={{ position: "relative", flexShrink: 0 }}>
      <button
        onClick={toggle} aria-haspopup="true" aria-expanded={open} aria-label={t("settings")}
        title={(profile && profile.email) || t("settings")}
        style={{
          position: "relative", display: "flex", alignItems: "center", gap: 8, background: open ? T.blueLight : "transparent", whiteSpace: "nowrap", cursor: "pointer",
          border: `1px solid ${open ? T.blue : T.border}`, borderRadius: 999, padding: 3,
          fontFamily: FONT_UI, fontWeight: 600, fontSize: fs(13), color: T.ink,
        }}
      >
        {signedIn ? <Avatar profile={profile} size={iconOnly ? 34 : 32} T={T} />
          : <span style={{ width: iconOnly ? 34 : 32, height: iconOnly ? 34 : 32, borderRadius: "50%", background: T.mutedBg, display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><UserIcon size={17} color={T.muted} /></span>}
        {reauth && <span title={t("syncStReauth")} style={{ position: "absolute", top: -2, right: -2, width: 11, height: 11, borderRadius: "50%", background: T.amber, border: `2px solid ${T.paper}` }} />}
      </button>
      {open && (
        <div role="menu" style={{
          position: "absolute", top: 46, ...place, background: T.card, border: `1px solid ${T.border}`, borderRadius: 10,
          width: "min(320px, calc(100vw - 16px))", maxHeight: "calc(100vh - 64px)", overflowY: "auto", boxSizing: "border-box", zIndex: 70, boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
        }}>
          {/* Account + sync */}
          <div style={{ padding: 16, background: T.blueLight, borderRadius: "10px 10px 0 0", display: "grid", gap: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
              {signedIn ? <Avatar profile={profile} size={46} T={T} />
                : <span style={{ width: 46, height: 46, borderRadius: "50%", background: T.card, display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><UserIcon size={22} color={T.muted} /></span>}
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontFamily: FONT_UI, fontWeight: 700, fontSize: fs(15), color: T.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {signedIn ? (displayName || "Google") : t("signedOutNote")}
                </div>
                {careerText && <div title={careerText} style={{ fontFamily: FONT_UI, fontSize: fs(12.5), color: T.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginTop: 2 }}>{careerText}</div>}
              </div>
            </div>
            {objectiveItems.length > 0 && (
              <div style={{ display: "grid", gap: 4 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: FONT_UI, fontWeight: 700, fontSize: fs(11), color: T.muted, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                  <Target size={12} color={T.muted} />{t("cpObjective")}
                </div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {objectiveItems.map((x) => <span key={x.k} style={{ fontFamily: FONT_UI, fontWeight: 600, fontSize: fs(12), color: T.blueDeep, background: T.card, border: `1px solid ${T.border}`, borderRadius: 999, padding: "2px 9px" }}>{x.label}</span>)}
                </div>
              </div>
            )}
            <button onClick={() => { setOpen(false); setPopup("account"); }} style={{
              width: "100%", background: T.card, border: `1px solid ${T.border}`, borderRadius: 6, cursor: "pointer", whiteSpace: "nowrap",
              padding: "8px 12px", fontFamily: FONT_UI, fontWeight: 600, fontSize: fs(13), color: T.blue,
            }}>{t("viewAccount")}</button>
            {drive && drive.configured && !signedIn && (
              <>
                <p style={{ fontFamily: FONT_UI, fontSize: fs(12.5), color: T.muted, lineHeight: 1.5, margin: 0 }}>{t("signInHint")}</p>
                <PrimaryButton T={T} icon={LogIn} onClick={() => { setOpen(false); drive.signIn(); }} style={{ width: "100%", justifyContent: "center" }}>{t("signIn")}</PrimaryButton>
              </>
            )}
            {drive && !drive.configured && <p style={{ fontFamily: FONT_UI, fontSize: fs(12.5), color: T.muted, lineHeight: 1.5, margin: 0 }}>{t("syncOff")}</p>}
            {signedIn && (
              <>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <Cloud size={15} color={T.blue} />
                  <span style={{ fontFamily: FONT_UI, fontWeight: 600, fontSize: fs(12.5), color: T.ink }}>{t("syncTitle")}</span>
                  <Pill T={T} tone={tone}>{stText}</Pill>
                  {drive.status !== "reauth" && (
                    <button onClick={drive.syncNow} disabled={drive.status === "busy"} style={{ fontFamily: FONT_UI, fontWeight: 600, fontSize: fs(12.5), color: T.blue, background: "transparent", border: "none", cursor: drive.status === "busy" ? "default" : "pointer", opacity: drive.status === "busy" ? 0.5 : 1, padding: 4 }}>{t("syncShort")}</button>
                  )}
                </div>
                {drive.status === "reauth" && <p style={{ fontFamily: FONT_UI, fontSize: fs(12), color: T.amber, lineHeight: 1.45, margin: 0 }}>{t("syncReauthHint")}</p>}
                {drive.errKey && <p role="alert" style={{ fontFamily: FONT_UI, fontSize: fs(12), color: T.red, lineHeight: 1.45, margin: 0 }}>{t(drive.errKey)}</p>}
                {drive.status === "reauth" && <PrimaryButton T={T} icon={Cloud} onClick={drive.reconnect} style={{ width: "100%", justifyContent: "center" }}>{t("syncReconnect")}</PrimaryButton>}
              </>
            )}
          </div>

          {/* Settings, Study Profile, Help, Trash Bin */}
          <div style={{ borderTop: `1px solid ${T.border}`, padding: "10px 16px", display: "grid", gap: 8 }}>
            <button onClick={() => { setOpen(false); setPopup("settings"); }} style={{
              width: "100%", display: "flex", alignItems: "center", gap: 10, background: "transparent", border: `1px solid ${T.border}`, borderRadius: 6, cursor: "pointer",
              padding: "9px 12px", fontFamily: FONT_UI, fontWeight: 600, fontSize: fs(13), color: T.ink, textAlign: "left",
            }}>
              <SettingsIcon size={15} color={T.muted} />
              <span style={{ flex: 1 }}>{t("settings")}</span>
              <ChevronRight size={15} color={T.muted} />
            </button>
            {nav.open && (
              <button onClick={() => { setOpen(false); nav.open("studyhub"); }} disabled={nav.locked} style={{
                width: "100%", display: "flex", alignItems: "center", gap: 10, background: "transparent", border: `1px solid ${T.border}`, borderRadius: 6, cursor: nav.locked ? "not-allowed" : "pointer",
                padding: "9px 12px", fontFamily: FONT_UI, fontWeight: 600, fontSize: fs(13), color: T.ink, textAlign: "left", opacity: nav.locked ? 0.5 : 1,
              }}>
                <GraduationCap size={15} color={T.muted} />
                <span style={{ flex: 1 }}>{t("tabStudyHub")}</span>
                <ChevronRight size={15} color={T.muted} />
              </button>
            )}
            {onHelp && (
              <button onClick={() => { setOpen(false); onHelp(); }} style={{
                width: "100%", display: "flex", alignItems: "center", gap: 10, background: "transparent", border: `1px solid ${T.border}`, borderRadius: 6, cursor: "pointer",
                padding: "9px 12px", fontFamily: FONT_UI, fontWeight: 600, fontSize: fs(13), color: T.ink, textAlign: "left",
              }}>
                <QuestionMarkIcon size={15} color={T.muted} />
                <span style={{ flex: 1 }}>{t("howItWorks")}</span>
                <ChevronRight size={15} color={T.muted} />
              </button>
            )}
            <button onClick={() => { setOpen(false); setPopup("trash"); }} style={{
              width: "100%", display: "flex", alignItems: "center", gap: 10, background: "transparent", border: `1px solid ${T.border}`, borderRadius: 6, cursor: "pointer",
              padding: "9px 12px", fontFamily: FONT_UI, fontWeight: 600, fontSize: fs(13), color: T.ink, textAlign: "left",
            }}>
              <Trash2 size={15} color={T.muted} />
              <span style={{ flex: 1 }}>{t("trashTitle")}</span>
              {trashLive > 0 && <span style={{ fontFamily: FONT_MONO, fontSize: fs(11), fontWeight: 700, padding: "1px 7px", borderRadius: 999, background: T.mutedBg, color: T.muted }}>{trashLive}</span>}
              <ChevronRight size={15} color={T.muted} />
            </button>
          </div>

        </div>
      )}
      {popup && (
        <div role="dialog" aria-modal="true" aria-label={popup === "trash" ? t("trashTitle") : popup === "account" ? t("accountBtn") : t("settings")} onClick={() => setPopup(null)}
          style={{ position: "fixed", inset: 0, zIndex: 120, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "center", justifyContent: "center", padding: vp.w < 640 ? 10 : 20, textAlign: "left" }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: popup === "trash" ? 780 : popup === "account" ? 600 : 420, maxHeight: "92vh", overflowY: "auto", borderRadius: 10, boxShadow: "0 12px 40px rgba(0,0,0,0.45)" }}>
            {popup === "trash" && <TrashPanel trash={trashCtx.trash} onRestore={trashCtx.restore} onPurge={trashCtx.purge} T={T} onClose={() => setPopup(null)} />}
            {popup === "account" && (
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 24 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                  <UserIcon size={17} color={T.ink} />
                  <span style={{ fontFamily: FONT_UI, fontWeight: 600, fontSize: fs(14), color: T.ink }}>{t("accountBtn")}</span>
                  {popupClose}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 14, minWidth: 0 }}>
                  {signedIn ? <Avatar profile={profile} size={64} T={T} />
                    : <span style={{ width: 64, height: 64, borderRadius: "50%", background: T.mutedBg, display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><UserIcon size={28} color={T.muted} /></span>}
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontFamily: FONT_UI, fontWeight: 700, fontSize: fs(17), color: T.ink, overflowWrap: "anywhere" }}>{signedIn ? (displayName || "Google") : t("signedOutNote")}</div>
                    {signedIn && profile && profile.email && <div style={{ fontFamily: FONT_UI, fontSize: fs(13), color: T.muted, overflowWrap: "anywhere", marginTop: 2 }}>{profile.email}</div>}
                    {careerText && <div style={{ fontFamily: FONT_UI, fontWeight: 600, fontSize: fs(13.5), color: T.ink, overflowWrap: "anywhere", marginTop: 6 }}>{careerText}</div>}
                    {signedIn && <div style={{ marginTop: 8 }}><Pill T={T} tone="green">{t("signedInAs")}</Pill></div>}
                  </div>
                </div>
                <div style={{ borderTop: `1px solid ${T.border}`, marginTop: 20, paddingTop: 20 }}>
                  <CareerStudyForm T={T} />
                </div>
                {signedIn && (
                  <div style={{ borderTop: `1px solid ${T.border}`, marginTop: 22, paddingTop: 16 }}>
                    <GhostButton T={T} icon={LogOut} onClick={() => { setPopup(null); drive.signOut(); }} style={{ width: "100%", justifyContent: "center" }}>{t("signOut")}</GhostButton>
                    <p style={{ fontFamily: FONT_UI, fontSize: fs(11.5), color: T.muted, lineHeight: 1.45, margin: "8px 0 0", textAlign: "center" }}>{t("signOutHint")}</p>
                  </div>
                )}
                {!signedIn && drive && drive.configured && (
                  <div style={{ borderTop: `1px solid ${T.border}`, marginTop: 22, paddingTop: 16, display: "grid", gap: 10 }}>
                    <p style={{ fontFamily: FONT_UI, fontSize: fs(12.5), color: T.muted, lineHeight: 1.5, margin: 0 }}>{t("signInHint")}</p>
                    <PrimaryButton T={T} icon={LogIn} onClick={() => { setPopup(null); drive.signIn(); }} style={{ width: "100%", justifyContent: "center" }}>{t("signIn")}</PrimaryButton>
                  </div>
                )}
              </div>
            )}
            {popup === "settings" && (
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 24 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <SettingsIcon size={17} color={T.ink} />
                  <span style={{ fontFamily: FONT_UI, fontWeight: 600, fontSize: fs(14), color: T.ink }}>{t("settings")}</span>
                  {popupClose}
                </div>
                <LangSelect T={T} />
                <div style={{ margin: "10px 0 4px" }}>
                  <div style={label}>{t("themeLabel")}</div>
                  <div role="group" aria-label={t("themeLabel")} style={{ display: "flex", border: `1px solid ${T.border}`, borderRadius: 6, overflow: "hidden" }}>
                    <button onClick={() => setDarkMode(false)} aria-pressed={!darkMode} style={seg(!darkMode)}>{t("themeLight")}</button>
                    <button onClick={() => setDarkMode(true)} aria-pressed={darkMode} style={{ ...seg(darkMode), borderLeft: `1px solid ${T.border}` }}>{t("themeDark")}</button>
                  </div>
                </div>
              </div>
            )}
          </div>
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

// Library page, top row: the active-session widget (compact) with the Qhub placeholder inline on its right.
function LibraryTopRow({ session, resumeId, library, onResume, onOpenLobby, T }) {
  const { t } = useI18n();
  const wide = useViewport().w >= 760;
  const inLib = resumeId ? library.find((e) => e.id === resumeId) : null;
  const active = !!(session || inLib);
  const canResume = !!((session && session.block) || inLib);
  const title = inLib ? inLib.title : session ? (session.block ? blockLabel(session.block, t) : (session.examTitle || t("practiceExam"))) : "";
  const pos = session && session.block && session.bs ? t("sessionPos", { n: (Number(session.bs.currentQuestionIndex) || 0) + 1, total: session.block.questions.length }) : "";
  const box = { borderRadius: 10, padding: "10px 14px", display: "flex", alignItems: "center", gap: 12, minWidth: 0 };
  const tiny = { fontFamily: FONT_UI, fontWeight: 700, fontSize: fs(10.5), textTransform: "uppercase", letterSpacing: "0.06em" };
  return (
    <div style={{ display: "grid", gridTemplateColumns: wide && active ? "minmax(0, 1fr) minmax(0, 1fr)" : "minmax(0, 1fr)", gap: 14, marginBottom: 20 }}>
      {active && (
        <div style={{ ...box, background: T.card, border: `1px solid ${canResume ? T.blue : T.border}` }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ ...tiny, color: T.blue }}>{canResume ? t("sessionInProgress") : t("examLoadedLabel")}</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8, minWidth: 0 }}>
              <span style={{ fontFamily: FONT_UI, fontWeight: 700, fontSize: fs(14), color: T.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{title}</span>
              {pos && <span style={{ fontFamily: FONT_MONO, fontSize: fs(11.5), color: T.muted, whiteSpace: "nowrap" }}>{pos}</span>}
            </div>
          </div>
          {canResume
            ? <PrimaryButton T={T} onClick={onResume} icon={Play} style={{ padding: "7px 12px", fontSize: fs(13) }}>{t("resumeSession")}</PrimaryButton>
            : <GhostButton T={T} onClick={onOpenLobby} style={{ padding: "7px 12px" }}>{t("openLobby")}</GhostButton>}
        </div>
      )}
      <div style={{ ...box, border: `1px dashed ${T.border}`, background: "transparent" }} aria-label={t("qhubTitle")}>
        <Globe size={20} color={T.muted} style={{ flexShrink: 0 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{ fontFamily: FONT_UI, fontWeight: 700, fontSize: fs(14), color: T.ink }}>{t("qhubTitle")}</span>
            <Pill T={T} tone="muted">{t("qhubSoon")}</Pill>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: FONT_UI, fontSize: fs(12), color: T.muted, lineHeight: 1.4 }}>
            <ShieldCheck size={13} style={{ flexShrink: 0 }} /><span>{t("qhubBody")}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Qbank library panel — saved blocks; start one, or tick several to run them as a queue
// ---------------------------------------------------------------------------
function QbankLibraryPanel({ library, onLaunch, onMix, onDelete, onRename, resumeId, onResume, sessionLog = [], T }) {
  const { t, lang } = useI18n();
  const spCtx = useContext(ProfileContext);
  const tutorBrief_ = useMemo(() => (spCtx.profile ? tutorBrief(spCtx.profile, sessionLog, new Date()) : null), [spCtx.profile, sessionLog, new Date().toDateString()]); // eslint-disable-line
  const tutorIds = useMemo(() => new Set(tutorLibraryPicks(library, tutorBrief_).map((x) => x.e.id)), [library, tutorBrief_]);
  const [queue, setQueue] = useState([]); // entry ids in the order they were ticked
  const phone = useViewport().w < 640;
  const twoCol = useViewport().w >= 900; // large displays: Qbank cards share two columns
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
  const [mode, setMode] = useState("tutor"); // how the next Load starts: "timed" | "tutor" (Tutor is preselected)
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
          <div style={{ display: "grid", gap: 8, gridTemplateColumns: twoCol ? "repeat(2, minmax(0, 1fr))" : "minmax(0, 1fr)" }}>
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
                      {tutorIds.has(e.id) && <span title={t("spLibStrip", { w: tutorBrief_.week })} aria-label={t("spLibStrip", { w: tutorBrief_.week })} style={{ display: "inline-flex", opacity: 0.7 }}><GraduationCap size={15} color={T.blue} /></span>}
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
// Analytics: one row per finished block, newest first. Rows are snapshots, so they stay valid after a Qbank is renamed or deleted.
// ---------------------------------------------------------------------------
function sessionTitle(h, t) {
  if (h.isRetest) return `${blockLabel(h, t)} · ${t("histQ", { n: h.total })}`;
  const diff = h.mixDifficulty && h.mixDifficulty !== "all" ? ` · ${t(h.mixDifficulty === "balanced" ? "mixBalancedShort" : "dl." + h.mixDifficulty)}` : "";
  if (h.isMixed && h.mixCount > 1) return t("histMixed", { n: h.mixCount, q: h.total }) + diff;
  return t("histNamed", { name: h.blockName, q: h.total }) + diff;
}

// Shared analytics maths for the donut (Analytics page + Console). Correct = green, correct after using a hint = yellow,
// incorrect = red. Only answered questions count (skipped ones are left out). Sessions logged before hints were tracked per
// entry get their hint count from the saved review snapshot when one still exists; otherwise all their correct answers
// count as plain correct.
// Shared by the Analysis page and the Console stat boxes.
// Time per question counts timed sessions only; total time counts every session (timed and tutor).
function sessionTimeStats(history) {
  let tSec = 0, tQ = 0, allSec = 0;
  history.forEach((e) => {
    const q = Number(e.answered != null ? e.answered : e.total) || 0;
    if (e.elapsedSec > 0) allSec += e.elapsedSec;
    if (e.mode !== "tutor" && e.elapsedSec > 0 && q > 0) { tSec += e.elapsedSec; tQ += q; }
  });
  return { avgSec: tQ ? Math.round(tSec / tQ) : 0, totalSec: allSec };
}
const libraryQuestionCount = (library) => (library || []).reduce((n, e) => n + ((e && e.questions && e.questions.length) || 0), 0);
// "answered/total": questions answered so far over every question in the added Qbanks
const fmtAnsweredOf = (answered, total) => `${Number(answered).toLocaleString()}/${Number(total).toLocaleString()}`;

function overviewTotals(history) {
  let answered = 0, correct = 0, hinted = 0;
  history.forEach((h) => {
    const a = Number.isFinite(h.answered) ? h.answered : (Number(h.total) || 0);
    const c = Math.min(Number(h.correct) || 0, a);
    let hc = Number.isFinite(h.hintCorrect) ? h.hintCorrect : null;
    if (hc === null) {
      hc = 0;
      const snap = lsGet(LS_REVIEW + h.id);
      if (snap && snap.block && snap.blockState && snap.blockState.answers) {
        hc = snap.block.questions.filter((q) => { const x = snap.blockState.answers[q.id]; return x && x.hintUsed && x.selected === q.correctAnswer; }).length;
      }
    }
    answered += a; correct += c; hinted += Math.min(hc, c);
  });
  return { answered, plain: correct - hinted, hinted, incorrect: answered - correct, correct };
}

function DonutRing({ totals, T, maxW = 240 }) {
  const { t } = useI18n();
  const pct = Math.round((totals.correct / totals.answered) * 100);
  const R = 90, C = 2 * Math.PI * R;
  let offset = 0;
  const arcs = [
    { key: "plain", n: totals.plain, color: T.green },
    { key: "hint", n: totals.hinted, color: HINT_YELLOW },
    { key: "wrong", n: totals.incorrect, color: T.red },
  ].filter((x) => x.n > 0).map((x) => { const len = (x.n / totals.answered) * C; const arc = { ...x, len, start: offset }; offset += len; return arc; });
  return (
    <div style={{ position: "relative", width: `min(100%, ${maxW}px)`, aspectRatio: "1 / 1", flexShrink: 0, margin: "0 auto" }}>
      <svg viewBox="0 0 200 200" width="100%" height="100%" role="img" aria-label={`${pct}% ${t("anCenter")}`}>
        <circle cx="100" cy="100" r={R} fill="none" stroke={T.border} strokeWidth="10" />
        {arcs.map((a) => (
          <circle key={a.key} cx="100" cy="100" r={R} fill="none" stroke={a.color} strokeWidth="10"
            strokeDasharray={`${a.len} ${C - a.len}`} strokeDashoffset={-a.start} transform="rotate(-90 100 100)" />
        ))}
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: 24 }}>
        <span style={{ fontFamily: FONT_UI, fontWeight: 800, fontSize: fs(maxW < 200 ? 32 : 40), color: T.ink, lineHeight: 1.05 }}>{pct}%</span>
        <span style={{ fontFamily: FONT_UI, fontWeight: 700, fontSize: fs(maxW < 200 ? 10.5 : 11.5), color: T.muted, textTransform: "uppercase", letterSpacing: "0.03em", marginTop: 4 }}>{t("anCenter")}</span>
      </div>
    </div>
  );
}

function DonutLegend({ totals, T, stacked = false }) {
  const { t } = useI18n();
  const pctOf = (n) => Math.round((n / totals.answered) * 100);
  const rows = [
    { key: "plain", n: totals.plain, color: T.green, label: t("anCorrect") },
    { key: "hint", n: totals.hinted, color: HINT_YELLOW, label: t("anHints") },
    { key: "wrong", n: totals.incorrect, color: T.red, label: t("anIncorrect") },
  ];
  return (
    <div style={stacked ? { flex: "0 0 auto", maxWidth: "100%", minWidth: 0 } : { flex: "1 1 220px", minWidth: 0 }}>
      <p style={{ fontFamily: FONT_UI, fontSize: fs(15), color: T.ink, margin: "0 0 14px" }}>{t("anOverall", { n: totals.answered })}</p>
      <div style={{ display: "grid", gap: 12 }}>
        {rows.map((x) => (
          <div key={x.key} style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span aria-hidden="true" style={{ width: 40, height: 20, borderRadius: 999, background: x.color, flexShrink: 0 }} />
            <span style={{ fontFamily: FONT_UI, fontSize: fs(14.5), color: T.ink }}>
              <strong>{pctOf(x.n)}% {x.label}</strong> {x.n === 1 ? t("anQ1") : t("anQ", { n: x.n })}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Analytics page: a compact dashboard above the session list: headline stats, the donut, score trend, subject bars and daily activity.
function TrendChart({ vals, labels, T }) {
  const W = 420, H = 170, PL = 34, PR = 10, PT = 12, PB = 24;
  const x = (i) => PL + (vals.length === 1 ? 0 : (i * (W - PL - PR)) / (vals.length - 1));
  const y = (v) => PT + (1 - Math.max(0, Math.min(100, v)) / 100) * (H - PT - PB);
  const pts = vals.map((v, i) => `${x(i)},${y(v)}`).join(" ");
  const area = `${x(0)},${y(0)} ${pts} ${x(vals.length - 1)},${y(0)}`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: "block", height: "auto" }} role="img" aria-label={vals.map((v) => `${v}%`).join(", ")}>
      {[0, 50, 100].map((g) => (
        <g key={g}>
          <line x1={PL} x2={W - PR} y1={y(g)} y2={y(g)} stroke={T.border} strokeWidth="1" />
          <text x={PL - 6} y={y(g) + 4} textAnchor="end" fontSize="10" fill={T.muted} fontFamily={FONT_MONO}>{g}</text>
        </g>
      ))}
      <line x1={PL} x2={W - PR} y1={y(70)} y2={y(70)} stroke={T.muted} strokeWidth="1.2" strokeDasharray="4 4" />
      <text x={PL - 6} y={y(70) + 4} textAnchor="end" fontSize="10" fill={T.muted} fontFamily={FONT_MONO}>70</text>
      <polygon points={area} fill={T.blue} fillOpacity="0.08" />
      <polyline points={pts} fill="none" stroke={T.blue} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
      {vals.map((v, i) => <circle key={i} cx={x(i)} cy={y(v)} r={i === vals.length - 1 ? 4.5 : 3} fill={v >= 70 ? T.green : T.red} stroke={T.card} strokeWidth="1.5" />)}
      <text x={PL} y={H - 6} fontSize="10" fill={T.muted} fontFamily={FONT_MONO}>{labels[0]}</text>
      {vals.length > 1 && <text x={W - PR} y={H - 6} textAnchor="end" fontSize="10" fill={T.muted} fontFamily={FONT_MONO}>{labels[labels.length - 1]}</text>}
    </svg>
  );
}

function ActivityBars({ days, T }) {
  const W = 420, H = 150, PL = 26, PR = 6, PT = 10, PB = 22;
  const max = Math.max(5, ...days.map((d) => d.n));
  const slot = (W - PL - PR) / days.length, bw = slot * 0.62;
  const y = (n) => PT + (1 - n / max) * (H - PT - PB);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: "block", height: "auto" }} role="img" aria-label={days.map((d) => d.n).join(", ")}>
      <line x1={PL} x2={W - PR} y1={y(0)} y2={y(0)} stroke={T.border} strokeWidth="1" />
      <text x={PL - 5} y={y(max) + 4} textAnchor="end" fontSize="10" fill={T.muted} fontFamily={FONT_MONO}>{max}</text>
      <text x={PL - 5} y={y(0) + 4} textAnchor="end" fontSize="10" fill={T.muted} fontFamily={FONT_MONO}>0</text>
      {days.map((d, i) => (
        <g key={i}>
          <rect x={PL + i * slot + (slot - bw) / 2} y={d.n ? y(d.n) : y(0) - 2} width={bw} height={d.n ? y(0) - y(d.n) : 2} rx="2" fill={d.n ? (d.today ? T.blue : T.green) : T.border} />
          {(i === 0 || i === Math.floor(days.length / 2) || i === days.length - 1) && <text x={PL + i * slot + slot / 2} y={H - 6} textAnchor="middle" fontSize="10" fill={T.muted} fontFamily={FONT_MONO}>{d.label}</text>}
        </g>
      ))}
    </svg>
  );
}

function AnalyticsOverview({ history, qbankCount = 0, qbankQuestions = 0, T }) {
  const { t, lang } = useI18n();
  const totals = useMemo(() => overviewTotals(history), [history]);
  const locale = lang === "es" ? "es" : "en-US";
  const data = useMemo(() => {
    const ordered = [...history].sort((a, b) => a.finishedAt - b.finishedAt);
    const recent = ordered.slice(-15);
    const fmt = (ms) => new Date(ms).toLocaleDateString(locale, { month: "short", day: "numeric" });
    const subj = new Map();
    history.forEach((e) => (Array.isArray(e.bySubject) ? e.bySubject : []).forEach((x) => {
      const cur = subj.get(x.subject) || { subject: x.subject, correct: 0, total: 0 };
      cur.correct += Number(x.correct) || 0; cur.total += Number(x.total) || 0; subj.set(x.subject, cur);
    }));
    const subjects = [...subj.values()].filter((x) => x.total >= 3).map((x) => ({ ...x, pct: Math.round((x.correct / x.total) * 100) })).sort((a, b) => b.total - a.total).slice(0, 8);
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const days = Array.from({ length: 14 }, (_, i) => { const d = new Date(today); d.setDate(d.getDate() - (13 - i)); return { key: d.toDateString(), label: fmt(d.getTime()), n: 0, today: i === 13 }; });
    history.forEach((e) => { const k = new Date(e.finishedAt).toDateString(); const d = days.find((x) => x.key === k); if (d) d.n += Number(e.answered != null ? e.answered : e.total) || 0; });
    const ts = sessionTimeStats(history);
    const pcts = ordered.map((e) => Number(e.pct) || 0);
    return { trend: recent.map((e) => Number(e.pct) || 0), trendLabels: recent.map((e) => fmt(e.finishedAt)), subjects, days, avgSec: ts.avgSec, totalSec: ts.totalSec, best: pcts.length ? Math.max(...pcts) : 0 };
  }, [history, locale]);
  const noAnswers = totals.answered <= 0;
  if (noAnswers && !qbankQuestions) return null; // nothing answered and no Qbank added yet

  const card = { background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16, minWidth: 0 };
  const head = { fontFamily: FONT_UI, fontWeight: 600, fontSize: fs(13.5), color: T.ink };
  const hint = { fontFamily: FONT_UI, fontSize: fs(11.5), color: T.muted, marginTop: 6 };
  const grid2 = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 340px), 1fr))", gap: 14, alignItems: "stretch" };
  const accuracy = noAnswers ? 0 : Math.round((totals.correct / totals.answered) * 100);
  const tiles = [
    [t("anStatAnswered"), fmtAnsweredOf(totals.answered, qbankQuestions), t(qbankCount === 1 ? "anStatBank1" : "anStatBanks", { n: qbankCount })],
    [t("anStatCorrectPct"), `${accuracy}%`, t("anStatBest", { n: data.best })],
    [t("anStatAvgTime"), fmtMinSec(data.avgSec), null],
    [t("anStatTotalTime"), fmtHourMin(data.totalSec), null],
  ];
  return (
    <div style={{ display: "grid", gap: 14, padding: "4px 0 22px", marginBottom: 20, borderBottom: `1px solid ${T.border}` }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 150px), 1fr))", gap: 14 }}>
        {tiles.map(([label, value, sub]) => (
          <div key={label} style={{ ...card, padding: "12px 16px", minHeight: 96, boxSizing: "border-box", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <div style={{ fontFamily: FONT_UI, fontWeight: 600, fontSize: fs(11.5), color: T.muted, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</div>
            <div style={{ fontFamily: FONT_UI, fontWeight: 800, fontSize: String(value).length > 9 ? fs(21) : fs(26), color: T.ink, lineHeight: 1.15, marginTop: 4, whiteSpace: "nowrap" }}>{value}</div>
            <div style={{ fontFamily: FONT_UI, fontSize: fs(11.5), color: T.muted, minHeight: "1.3em" }}>{sub || " "}</div>
          </div>
        ))}
      </div>

      {!noAnswers && (<>
      <div style={grid2}>
        <div style={{ ...card, display: "flex", alignItems: "center", gap: 18, flexWrap: "wrap", justifyContent: "center" }}>
          <DonutRing totals={totals} T={T} maxW={150} />
          <DonutLegend totals={totals} T={T} />
        </div>
        <div style={card}>
          <div style={{ ...head, marginBottom: 8 }}>{t("anTrendTitle")}</div>
          {data.trend.length >= 2 ? (
            <>
              <TrendChart vals={data.trend} labels={data.trendLabels} T={T} />
              <div style={hint}>{t("anTrendHint", { n: data.trend.length })}</div>
            </>
          ) : <p style={{ fontFamily: FONT_UI, fontSize: fs(13.5), color: T.muted, margin: 0 }}>{t("anTrendNeed")}</p>}
        </div>
      </div>

      <div style={grid2}>
        <div style={card}>
          <div style={{ ...head, marginBottom: 10 }}>{t("anSubjTitle")}</div>
          {data.subjects.length > 0 ? (
            <div style={{ display: "grid", gap: 9 }}>
              {data.subjects.map((r) => (
                <div key={r.subject}>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 3 }}>
                    <span style={{ flex: 1, minWidth: 0, fontFamily: FONT_UI, fontSize: fs(12.5), color: T.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.subject}</span>
                    <span style={{ fontFamily: FONT_MONO, fontSize: fs(11), color: T.muted }}>{r.correct}/{r.total}</span>
                    <span style={{ fontFamily: FONT_MONO, fontSize: fs(11.5), fontWeight: 700, color: r.pct >= 70 ? T.green : T.red, minWidth: 34, textAlign: "right" }}>{r.pct}%</span>
                  </div>
                  <div style={{ position: "relative", height: 7, borderRadius: 999, background: T.mutedBg }}>
                    <div style={{ width: `${r.pct}%`, height: "100%", borderRadius: 999, background: r.pct >= 70 ? T.green : T.red }} />
                    <span aria-hidden="true" style={{ position: "absolute", left: "70%", top: -2, bottom: -2, width: 1.5, background: T.muted, opacity: 0.6 }} />
                  </div>
                </div>
              ))}
            </div>
          ) : <p style={{ fontFamily: FONT_UI, fontSize: fs(13.5), color: T.muted, margin: 0 }}>{t("csSubjNeed")}</p>}
        </div>
        <div style={{ ...card, display: "flex", flexDirection: "column" }}>
          <div style={{ ...head, marginBottom: 8 }}>{t("anActTitle")}</div>
          <div style={{ marginTop: "auto" }}>{/* the chart and its caption stay on the bottom edge however tall the box gets */}
            <ActivityBars days={data.days} T={T} />
            <div style={hint}>{t("anActHint")}</div>
          </div>
        </div>
      </div>
      </>)}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Console: the default Home page. A dashboard over everything else: greeting, one-tap resume, headline stats,
// the analytics donut, score trend and the semester calendar.
// ---------------------------------------------------------------------------
function TrendSpark({ vals, T }) {
  const W = 300, H = 96, PX = 10, PY = 10;
  const x = (i) => PX + (vals.length === 1 ? 0 : (i * (W - 2 * PX)) / (vals.length - 1));
  const y = (v) => PY + (1 - Math.max(0, Math.min(100, v)) / 100) * (H - 2 * PY);
  const pts = vals.map((v, i) => `${x(i)},${y(v)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="auto" style={{ display: "block", maxHeight: 130 }} role="img" aria-label={vals.map((v) => `${v}%`).join(", ")}>
      <line x1={PX} x2={W - PX} y1={y(70)} y2={y(70)} stroke={T.border} strokeWidth="1.5" strokeDasharray="4 4" />
      <polyline points={pts} fill="none" stroke={T.blue} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
      {vals.map((v, i) => <circle key={i} cx={x(i)} cy={y(v)} r={i === vals.length - 1 ? 4.5 : 3} fill={v >= 70 ? T.green : T.red} stroke={T.card} strokeWidth="1.5" />)}
    </svg>
  );
}

// True while the element is at least minH px tall. Used by the analytics card: when the cards beside it grow and stretch it,
// it switches to a vertical layout (donut above its legend) instead of floating in empty space.
function useTallCard(minH) {
  const [el, setEl] = useState(null); // callback ref: the card can mount later or move between layouts
  const [tall, setTall] = useState(false);
  useEffect(() => {
    if (!el || typeof ResizeObserver === "undefined") { setTall(false); return undefined; }
    const check = () => setTall(el.offsetHeight >= minH);
    check();
    const ro = new ResizeObserver(check); ro.observe(el);
    return () => ro.disconnect();
  }, [el, minH]);
  return [setEl, tall];
}

const fmtClock = (hhmm, locale) => { const m = /^(\d{2}):(\d{2})$/.exec(hhmm || ""); return m ? new Date(2023, 0, 1, +m[1], +m[2]).toLocaleTimeString(locale, { hour: "numeric", minute: "2-digit" }) : ""; };
const newLocalId = (p) => `${p}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

// Edit class names, meeting days/times and locations after import. Every change is saved straight into the profile.
// One class meeting line. The text sits in its own wrapping column so a long class name can never be squeezed to a sliver on a phone.
function ClassRow({ name, m, locale, head, T, tag = null }) {
  const time = m.start ? `${fmtClock(m.start, locale)}${m.end ? ` – ${fmtClock(m.end, locale)}` : ""}` : "—";
  return (
    <div style={{ display: "flex", alignItems: "stretch", gap: 10, padding: "6px 0" }}>
      <span aria-hidden="true" style={{ width: 3, borderRadius: 2, background: T.purple, flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "baseline", columnGap: 12, rowGap: 2 }}>
          <span style={{ fontFamily: FONT_MONO, fontSize: fs(11.5), color: T.muted, whiteSpace: "nowrap" }}>{time}</span>
          <span style={{ ...head, flex: "1 1 150px", minWidth: 0, overflowWrap: "anywhere" }}>{name}</span>
          {tag}
        </div>
        {m.location && <div style={{ marginTop: 2, fontFamily: FONT_UI, fontSize: fs(12), color: T.muted, overflowWrap: "anywhere" }}>{m.location}</div>}
      </div>
    </div>
  );
}

function ClassEditor({ courses, onChange, mondayFirst, locale, defaultDay, T, t }) {
  const [newName, setNewName] = useState("");
  const order = mondayFirst ? [1, 2, 3, 4, 5, 6, 0] : [0, 1, 2, 3, 4, 5, 6];
  const dayLbl = (d) => new Date(2023, 0, 1 + d).toLocaleDateString(locale, { weekday: "short" }).slice(0, 3);
  const inp = { fontFamily: FONT_UI, fontSize: fs(13), color: T.ink, background: T.paper, border: `1px solid ${T.border}`, borderRadius: 6, padding: "6px 8px", outline: "none", minWidth: 0 };
  const setCourse = (id, fn) => onChange(courses.map((c) => (c.id === id ? fn(c) : c)));
  const setMeet = (cid, mid, patch) => setCourse(cid, (c) => ({ ...c, meetings: (c.meetings || []).map((m) => (m.id === mid ? { ...m, ...patch } : m)) }));
  const addClass = () => { const name = newName.trim().slice(0, 120); if (!name) return; onChange([...courses, { id: newLocalId("usr"), name, code: null, meetings: [{ id: newLocalId("m"), days: [defaultDay], start: "09:00", end: "10:00", location: null }], weeks: [] }]); setNewName(""); };
  return (
    <div style={{ display: "grid", gap: 10, margin: "6px 0 4px" }}>
      {courses.length === 0 && <p style={{ fontFamily: FONT_UI, fontSize: fs(13), color: T.muted, margin: 0 }}>{t("csClassNone")}</p>}
      {courses.map((c) => (
        <div key={c.id} style={{ border: `1px solid ${T.border}`, borderRadius: 8, padding: 10, display: "grid", gap: 8 }}>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input value={c.name} maxLength={120} aria-label={t("csClassName")} onChange={(e) => setCourse(c.id, (x) => ({ ...x, name: e.target.value, nameEdited: true }))} style={{ ...inp, flex: 1, fontWeight: 700 }} />
            {String(c.id).startsWith("usr-") && <button onClick={() => onChange(courses.filter((x) => x.id !== c.id))} title={t("csPlanRemove")} aria-label={t("csPlanRemove")} style={{ background: "transparent", border: "none", cursor: "pointer", color: T.muted, padding: 4, display: "flex" }}><Trash2 size={15} /></button>}
          </div>
          {(c.meetings || []).map((m) => (
            <div key={m.id} style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
              <span role="group" style={{ display: "inline-flex", gap: 3 }}>
                {order.map((d) => { const on = m.days.includes(d); return (
                  <button key={d} onClick={() => setMeet(c.id, m.id, { days: on ? m.days.filter((x) => x !== d) : [...m.days, d].sort() })} aria-pressed={on}
                    style={{ fontFamily: FONT_UI, fontSize: fs(11), fontWeight: 600, padding: "5px 6px", borderRadius: 5, cursor: "pointer", border: `1px solid ${on ? T.blue : T.border}`, background: on ? T.blue : "transparent", color: on ? T.onBlue : T.muted }}>{dayLbl(d)}</button>
                ); })}
              </span>
              <input type="time" value={m.start || ""} aria-label="start" onChange={(e) => setMeet(c.id, m.id, { start: e.target.value || null })} style={{ ...inp, width: 104 }} />
              <span style={{ color: T.muted }}>–</span>
              <input type="time" value={m.end || ""} aria-label="end" onChange={(e) => setMeet(c.id, m.id, { end: e.target.value || null })} style={{ ...inp, width: 104 }} />
              <input value={m.location || ""} maxLength={80} placeholder={t("csClassLoc")} aria-label={t("csClassLoc")} onChange={(e) => setMeet(c.id, m.id, { location: e.target.value || null })} style={{ ...inp, flex: "1 1 90px" }} />
              <button onClick={() => setCourse(c.id, (x) => ({ ...x, meetings: x.meetings.filter((q) => q.id !== m.id) }))} title={t("csPlanRemove")} aria-label={t("csPlanRemove")} style={{ background: "transparent", border: "none", cursor: "pointer", color: T.muted, padding: 4, display: "flex" }}><X size={15} /></button>
            </div>
          ))}
          <div><GhostButton T={T} icon={Plus} onClick={() => setCourse(c.id, (x) => ({ ...x, meetings: [...(x.meetings || []), { id: newLocalId("m"), days: [defaultDay], start: "09:00", end: "10:00", location: null }] }))} style={{ padding: "5px 10px" }}>{t("csClassAddMeeting")}</GhostButton></div>
        </div>
      ))}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <input value={newName} maxLength={120} placeholder={t("csClassNew")} aria-label={t("csClassNew")} onChange={(e) => setNewName(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") addClass(); }} style={{ ...inp, flex: "1 1 160px" }} />
        <GhostButton T={T} icon={Plus} onClick={addClass} disabled={!newName.trim()} style={{ padding: "6px 12px" }}>{t("csClassAdd")}</GhostButton>
      </div>
    </div>
  );
}

// ---- Console: semester calendar. One month grid: exams, tasks, calendar events (breaks, holidays, deadlines) and study days. ----
function ConsoleCalendar({ sessionLog, onNavigate, T, fill = false }) {
  const { t, lang } = useI18n();
  const sp = useContext(ProfileContext);
  const phone = useViewport().w < 640;
  const locale = lang === "es" ? "es" : "en-US";
  const mondayFirst = lang === "es";
  const profile = sp.profile;
  const [view, setView] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); });
  const [selKey, setSelKey] = useState(() => toISODate(new Date()));
  const todayKey = toISODate(new Date());
  const cap = (x) => x.charAt(0).toUpperCase() + x.slice(1);
  const brief = useMemo(() => (profile ? tutorBrief(profile, sessionLog, new Date()) : null), [profile, sessionLog, todayKey]); // eslint-disable-line

  const byDay = useMemo(() => {
    const m = new Map();
    const slot = (k) => { let x = m.get(k); if (!x) { x = { exams: [], tasks: [], events: [], sessions: [] }; m.set(k, x); } return x; };
    if (profile) {
      (profile.assessments || []).forEach((a) => slot(a.date).exams.push(a));
      ((profile.plan && profile.plan.tasks) || []).forEach((k) => { if (k.due) slot(k.due).tasks.push(k); });
      ((profile.calendar && profile.calendar.events) || []).forEach((e) => eventDayKeys(e, profile.term && profile.term.endDate).forEach((k) => slot(k).events.push(e)));
    }
    (sessionLog || []).forEach((e) => slot(toISODate(new Date(e.finishedAt))).sessions.push(e));
    return m;
  }, [profile, sessionLog]);

  const lead = (view.getDay() - (mondayFirst ? 1 : 0) + 7) % 7;
  const daysInMonth = new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate();
  const cells = Array.from({ length: Math.ceil((lead + daysInMonth) / 7) * 7 }, (_, i) => new Date(view.getFullYear(), view.getMonth(), 1 - lead + i));
  const weekdays = Array.from({ length: 7 }, (_, i) => new Date(2023, 0, 1 + (mondayFirst ? 1 : 0) + i).toLocaleDateString(locale, { weekday: phone ? "narrow" : "short" }));
  const shift = (n) => setView((v) => new Date(v.getFullYear(), v.getMonth() + n, 1));
  const goToday = () => { const d = new Date(); setView(new Date(d.getFullYear(), d.getMonth(), 1)); setSelKey(toISODate(d)); };

  const selDate = parseISODate(selKey) || new Date();
  const sel = byDay.get(selKey) || { exams: [], tasks: [], events: [], sessions: [] };
  const selWeek = (() => {
    if (!profile || !brief) return null;
    const st = termStartOf(profile); if (!st) return null;
    const diff = dayDiff(st, selDate); if (diff < 0) return null;
    const w = Math.floor(diff / 7) + 1;
    const end = parseISODate(profile.term.endDate);
    if ((end && dayDiff(selDate, end) < 0) || (brief.total && w > brief.total)) return null;
    return brief.total ? t("spTermWeek", { w, n: brief.total }) : t("spTermWeekNoTotal", { w });
  })();
  // Class meetings for the selected day: inside the term and not on a holiday/break.
  const selClasses = (() => {
    if (!profile) return [];
    const st = termStartOf(profile); const en = parseISODate(profile.term && profile.term.endDate);
    if ((st && dayDiff(st, selDate) < 0) || (en && dayDiff(selDate, en) < 0)) return [];
    if (sel.events.some((e) => e.type === "holiday" || e.type === "break")) return [];
    return (profile.courses || []).flatMap((c) => (c.meetings || []).filter((m) => meetingRunsOn(m, selDate)).map((m) => ({ c, m })))
      .sort((p, q) => ((p.m.start || "99") < (q.m.start || "99") ? -1 : (p.m.start || "99") > (q.m.start || "99") ? 1 : 0));
  })();
  const hasMeetings = !!(profile && (profile.courses || []).some((c) => (c.meetings || []).length));
  // Does any class meet on this day? (inside the term, not on a holiday / break) — drives the purple dot in the month grid.
  const termSt = profile ? termStartOf(profile) : null; const termEn = profile ? parseISODate(profile.term && profile.term.endDate) : null;
  const hasClassOn = (d, info) => {
    if (!profile || !hasMeetings) return false;
    if ((termSt && dayDiff(termSt, d) < 0) || (termEn && dayDiff(d, termEn) < 0)) return false;
    if (info && info.events.some((e) => e.type === "holiday" || e.type === "break")) return false;
    return (profile.courses || []).some((c) => (c.meetings || []).some((m) => meetingRunsOn(m, d)));
  };
  // Scheduled exams/events for the selected day are tickable plan items; ticking one saves it as a plan task.
  const planTasks = (profile && profile.plan && profile.plan.tasks) || [];
  const sched = [
    ...sel.exams.map((a) => ({ id: `cal-exam-${a.id}`, src: "exam", item: a, title: a.title, kind: "exam" })),
    ...sel.events.map((e) => ({ id: `cal-event-${e.id}-${selKey}`, src: "event", item: e, title: e.title, kind: "other" })),
  ].map((x) => ({ ...x, done: !!(planTasks.find((k) => k.id === x.id) || {}).done }));
  const schedIds = new Set(sched.map((x) => x.id));
  const tickSched = (x) => {
    if (planTasks.some((k) => k.id === x.id)) sp.toggleTask(x.id);
    else sp.addTask({ id: x.id, title: x.title, due: selKey, subject: null, kind: x.kind, done: true });
  };
  const planList = [...planTasks.filter((k) => !k.done).sort((p, q) => (p.due || "9999") < (q.due || "9999") ? -1 : (p.due || "9999") > (q.due || "9999") ? 1 : 0), ...planTasks.filter((k) => k.done)].slice(0, 4); // the Console surfaces 4 plan items; Show all opens the Study Profile for the rest
  const planDone = planTasks.filter((k) => k.done).length;
  const shownPlanIds = new Set(planList.map((k) => k.id));
  const selTasks = sel.tasks.filter((k) => !schedIds.has(k.id) && !String(k.id).startsWith("cal-") && !shownPlanIds.has(k.id));
  const isMine = (k) => String(k.id).startsWith("usr-");
  const qDone = sel.sessions.reduce((n, e) => n + (Number(e.answered != null ? e.answered : e.total) || 0), 0);
  const fmtRange = (e) => {
    const f = (iso) => parseISODate(iso).toLocaleDateString(locale, { month: "short", day: "numeric" });
    return e.endDate ? `${f(e.startDate)} → ${f(e.endDate)}` : f(e.startDate);
  };

  const dot = (color, k) => <span key={k} style={{ width: 6, height: 6, borderRadius: 999, background: color, display: "inline-block" }} />;
  const iconBtn = { width: 30, height: 30, borderRadius: 8, border: `1px solid ${T.border}`, background: "transparent", color: T.ink, cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", padding: 0 };
  const rowHead = { fontFamily: FONT_UI, fontWeight: 700, fontSize: fs(13.5), color: T.ink, overflowWrap: "anywhere" };
  const rowSub = { fontFamily: FONT_MONO, fontSize: fs(11.5), color: T.muted };
  const itemRow = { display: "flex", alignItems: "flex-start", gap: 10, padding: "7px 0" };
  const legend = [[T.red, "csCalLegExam"], [T.purple, "csClasses"], [T.amber, "csCalLegTask"], [T.blue, "csCalLegEvent"], [T.green, "csCalLegStudy"]];

  return (
    <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: phone ? 18 : 24, ...(fill ? { height: "100%", boxSizing: "border-box", display: "flex", flexDirection: "column" } : {}) }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
        <CalendarDays size={17} color={T.ink} />
        <span style={{ fontFamily: FONT_UI, fontWeight: 600, fontSize: fs(14), color: T.ink }}>{t("csCalendar")}</span>
        <div style={{ marginLeft: "auto", display: "flex", gap: 6, alignItems: "center" }}>
          <button onClick={() => onNavigate("calendar")} style={{ fontFamily: FONT_UI, fontWeight: 600, fontSize: fs(12.5), color: T.blue, background: "transparent", border: "none", cursor: "pointer", padding: 4 }}>{t("calOpenFull")}</button>
          <button onClick={goToday} style={{ fontFamily: FONT_UI, fontWeight: 600, fontSize: fs(12.5), color: T.blue, background: "transparent", border: "none", cursor: "pointer", padding: 4 }}>{t("csCalToday")}</button>
          <button onClick={() => shift(-1)} aria-label={t("csCalPrev")} style={iconBtn}><ChevronLeft size={16} /></button>
          <button onClick={() => shift(1)} aria-label={t("csCalNext")} style={iconBtn}><ChevronRight size={16} /></button>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap", marginBottom: 10 }}>
        <span style={{ fontFamily: FONT_DISPLAY, fontWeight: 600, fontSize: fs(20), color: T.ink }}>{cap(view.toLocaleDateString(locale, { month: "long", year: "numeric" }))}</span>
        {profile && brief && <span style={{ fontFamily: FONT_UI, fontSize: fs(12.5), color: T.muted }}>{[profile.term.name, spWeekLabel(brief, t)].filter(Boolean).join(" · ")}</span>}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(0, 1fr))", gap: 2 }}>
        {weekdays.map((w, i) => <div key={i} style={{ textAlign: "center", fontFamily: FONT_UI, fontWeight: 600, fontSize: fs(11.5), color: T.muted, padding: "4px 0" }}>{w}</div>)}
        {cells.map((d) => {
          const key = toISODate(d); const info = byDay.get(key);
          const inMonth = d.getMonth() === view.getMonth(); const isSel = key === selKey; const isToday = key === todayKey;
          const off = !!(info && info.events.some((e) => e.type === "holiday" || e.type === "break"));
          const dots = [
            info && info.exams.some((a) => a.status !== "done") && T.red,
            hasClassOn(d, info) && T.purple,
            info && info.events.length > 0 && T.blue,
            info && info.tasks.some((k) => !k.done && !String(k.id).startsWith("cal-")) && T.amber,
            info && info.sessions.length > 0 && T.green,
          ].filter(Boolean);
          const label = d.toLocaleDateString(locale, { weekday: "long", month: "long", day: "numeric" });
          return (
            <button key={key} onClick={() => { setSelKey(key); if (!inMonth) setView(new Date(d.getFullYear(), d.getMonth(), 1)); }}
              aria-label={label} aria-pressed={isSel} aria-current={isToday ? "date" : undefined}
              style={{
                minHeight: phone ? 52 : 60, padding: "5px 2px 6px", borderRadius: 8, cursor: "pointer", fontFamily: FONT_UI,
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "space-between", gap: 3,
                background: off ? T.blueLight : "transparent", border: "1px solid transparent",
                opacity: inMonth ? 1 : 0.4,
              }}>
              <span style={{
                minWidth: 30, height: 30, lineHeight: "30px", borderRadius: 999, fontSize: fs(16), fontWeight: isToday || isSel ? 700 : 500,
                background: isToday ? T.blue : "transparent", color: isToday ? T.onBlue : T.ink,
              }}>{d.getDate()}</span>
              <span style={{ display: "flex", gap: 3, height: 6 }}>{dots.map((c, i) => dot(c, i))}</span>
            </button>
          );
        })}
      </div>

      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", margin: "10px 0 0" }}>
        {legend.map(([c, k]) => <span key={k} style={{ display: "inline-flex", alignItems: "center", gap: 6, fontFamily: FONT_UI, fontSize: fs(11.5), color: T.muted }}>{dot(c, k)}{t(k)}</span>)}
      </div>

      <div style={{ borderTop: `1px solid ${T.border}`, marginTop: 14, paddingTop: 12, ...(fill ? { flex: 1 } : {}) }} aria-live="polite">
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
          <span style={{ fontFamily: FONT_UI, fontWeight: 700, fontSize: fs(14), color: T.ink }}>{cap(selDate.toLocaleDateString(locale, { weekday: "long", month: "long", day: "numeric" }))}</span>
          {selWeek && <Pill T={T} tone="muted">{selWeek}</Pill>}
        </div>
        {profile && (
          <div style={{ marginBottom: 6 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontFamily: FONT_UI, fontWeight: 700, fontSize: fs(11.5), color: T.purple, textTransform: "uppercase", letterSpacing: "0.06em" }}>{t("csClasses")}</span>
            </div>
            {selClasses.length > 0
              ? selClasses.map(({ c, m }) => <ClassRow key={`${c.id}-${m.id}`} name={c.name} m={m} locale={locale} head={rowHead} T={T} />)
              : !hasMeetings && <p style={{ fontFamily: FONT_UI, fontSize: fs(12.5), color: T.muted, margin: "2px 0 0" }}>{t("csClassNoneHere")}</p>}
          </div>
        )}
        {profile && planTasks.length > 0 && (
          <div style={{ marginBottom: 6 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
              <span style={{ fontFamily: FONT_UI, fontWeight: 700, fontSize: fs(11.5), color: T.muted, textTransform: "uppercase", letterSpacing: "0.06em" }}>{t("csCalPlan")}</span>
              <Pill T={T} tone="muted">{t("csCalPlanCount", { d: planDone, n: planTasks.length })}</Pill>
              {planTasks.length > planList.length && (
                <button onClick={() => onNavigate("calendar")} style={{ marginLeft: "auto", fontFamily: FONT_UI, fontWeight: 600, fontSize: fs(12.5), color: T.blue, background: "transparent", border: "none", cursor: "pointer", padding: 4 }}>{t("csPlanShowAll", { n: planTasks.length })}</button>
              )}
            </div>
            {planList.map((k) => <TaskRow key={k.id} task={k} onToggle={() => sp.toggleTask(k.id)} onRemove={isMine(k) ? () => sp.removeTask(k.id) : undefined} T={T} t={t} lang={lang} />)}
          </div>
        )}
        {sched.map((x) => {
          const a = x.item; const isExam = x.src === "exam"; const tone = isExam ? T.red : T.blue;
          return (
            <div key={x.id} style={{ ...itemRow, alignItems: "flex-start" }}>
              <button onClick={() => tickSched(x)} role="checkbox" aria-checked={x.done} aria-label={x.title} style={{
                width: 22, height: 22, flexShrink: 0, borderRadius: 5, cursor: "pointer", padding: 0, marginTop: 1, display: "inline-flex", alignItems: "center", justifyContent: "center",
                background: x.done ? T.green : "transparent", border: `2px solid ${x.done ? T.green : tone}`, color: T.onBlue,
              }}>{x.done && <Check size={14} />}</button>
              <div style={{ flex: 1, minWidth: 0, opacity: x.done ? 0.6 : 1 }}>
                <div style={{ ...rowHead, textDecoration: x.done ? "line-through" : "none" }}>{x.title}</div>
                <div style={rowSub}>{isExam ? [spCourseOf(profile, a.courseId) ? spCourseOf(profile, a.courseId).name : null, a.time, a.weightPct != null ? `${a.weightPct}%` : null, a.format].filter(Boolean).join(" · ") : fmtRange(a)}</div>
                {isExam && a.coverage.length > 0 && <div style={{ fontFamily: FONT_UI, fontSize: fs(12), color: T.muted, marginTop: 2 }}>{a.coverage.slice(0, 4).join(" · ")}</div>}
                {!isExam && a.notes && <div style={{ fontFamily: FONT_UI, fontSize: fs(12), color: T.muted, marginTop: 2 }}>{a.notes}</div>}
              </div>
              <Pill T={T} tone={isExam ? "red" : (SP_EVENT_TONE[a.type] || "muted")}>{isExam ? a.type : t(`spEvt.${a.type}`)}</Pill>
            </div>
          );
        })}
        {selTasks.map((k) => <TaskRow key={k.id} task={k} onToggle={() => sp.toggleTask(k.id)} onRemove={isMine(k) ? () => sp.removeTask(k.id) : undefined} T={T} t={t} lang={lang} />)}
        {sel.sessions.length > 0 && (
          <div style={itemRow}>
            <span style={{ marginTop: 6 }}>{dot(T.green)}</span>
            <span style={{ fontFamily: FONT_UI, fontSize: fs(13.5), color: T.ink }}>{t("csCalStudied", { n: sel.sessions.length, q: qDone })}</span>
          </div>
        )}
        {!sched.length && !selTasks.length && !sel.sessions.length && !selClasses.length && !planList.length && (
          <p style={{ fontFamily: FONT_UI, fontSize: fs(13.5), color: T.muted, margin: "4px 0 0" }}>{t("csCalNothing")}</p>
        )}
      </div>

      {!profile && (
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginTop: 12, padding: "10px 12px", borderRadius: 8, background: T.mutedBg }}>
          <span style={{ flex: "1 1 200px", fontFamily: FONT_UI, fontSize: fs(12.5), color: T.muted, lineHeight: 1.5 }}>{t("csCalNoProfile")}</span>
          <GhostButton T={T} icon={Sparkles} onClick={() => onNavigate("profile")}>{t("csCalSetup")}</GhostButton>
        </div>
      )}
    </div>
  );
}

// ---- Calendar page: the whole term on one big calendar. Month | Week | Agenda, with every layer (key dates, classes, exams,
// breaks and holidays, tasks, study days) switchable, and a day panel to tick, add and edit things. ----
// Days an event shows on: its own span, repeated daily / weekly / monthly until its end date (else the term's end, else a year).
function eventDayKeys(e, limit) {
  const s = parseISODate(e.startDate); if (!s) return [];
  const span = Math.min(60, Math.max(0, e.endDate && parseISODate(e.endDate) ? dayDiff(s, parseISODate(e.endDate)) : 0));
  const starts = [s];
  if (e.repeat) {
    const stop = parseISODate(e.until) || parseISODate(limit) || new Date(s.getFullYear() + 1, s.getMonth(), s.getDate());
    for (let n = 1; n < 400; n++) {
      const d = e.repeat === "daily" ? new Date(s.getFullYear(), s.getMonth(), s.getDate() + n) : e.repeat === "weekly" ? new Date(s.getFullYear(), s.getMonth(), s.getDate() + 7 * n) : new Date(s.getFullYear(), s.getMonth() + n, s.getDate());
      if (e.repeat === "monthly" && d.getDate() !== s.getDate()) continue;
      if (d > stop) break; starts.push(d);
    }
  }
  const out = []; starts.forEach((st) => { for (let i = 0; i <= span; i++) out.push(toISODate(new Date(st.getFullYear(), st.getMonth(), st.getDate() + i))); });
  return out;
}
const CAL_BLANK = { priority: "normal", taskDone: false, title: "", date: "", endDate: "", time: "", endTime: "", type: "other", notes: "", repeat: "none", until: "", kindT: "other", subject: "", weight: "", place: "", topics: "", courseId: "", done: false };
// Add / edit form for a task, an event or an exam (same form, the fields follow the kind).
function CalItemEditor({ ed, setEd, onSave, onDelete, onCancel, courses, T, t }) {
  const d = ed.draft; const set = (k, v) => setEd({ ...ed, draft: { ...d, [k]: v } });
  const inp = { fontFamily: FONT_UI, fontSize: fs(13), color: T.ink, background: T.paper, border: `1px solid ${T.border}`, borderRadius: 6, padding: "7px 9px", outline: "none", minWidth: 0, width: "100%", boxSizing: "border-box" };
  const lab = { fontFamily: FONT_UI, fontWeight: 600, fontSize: fs(11.5), color: T.muted, textTransform: "uppercase", letterSpacing: "0.05em" };
  const cap = (x) => x.charAt(0).toUpperCase() + x.slice(1);
  const field = (label, node, full) => <label style={{ display: "grid", gap: 3, minWidth: 0, ...(full ? { gridColumn: "1 / -1" } : {}) }}><span style={lab}>{label}</span>{node}</label>;
  const sel = (k, opts) => <select value={d[k]} onChange={(e) => set(k, e.target.value)} style={inp}>{opts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>;
  const valid = d.title.trim() && parseISODate(d.date);
  const accent = ed.kind === "exam" ? T.red : ed.kind === "event" ? T.blue : T.amber;
  return (
    <div role="group" aria-label={t(ed.id ? `calEdit.${ed.kind}` : `calNew.${ed.kind}`)} onKeyDown={(e) => { if (e.key === "Escape") onCancel(); }} style={{ border: `1px solid ${T.border}`, borderLeft: `4px solid ${accent}`, borderRadius: 8, padding: 12, margin: "8px 0 12px", background: T.mutedBg, display: "grid", gap: 10 }}>
      <div style={{ fontFamily: FONT_UI, fontWeight: 700, fontSize: fs(13.5), color: T.ink }}>{t(ed.id ? `calEdit.${ed.kind}` : `calNew.${ed.kind}`)}</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 10 }}>
        {field(t("calF.title"), <input autoFocus value={d.title} maxLength={160} onChange={(e) => set("title", e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && valid) onSave(); }} style={inp} />, true)}
        {field(t("calF.date"), <input type="date" value={d.date} onChange={(e) => set("date", e.target.value)} style={inp} />)}
        {field(t("calF.time"), <input type="time" value={d.time} onChange={(e) => set("time", e.target.value)} style={inp} />)}
        {ed.kind === "event" && field(t("calF.endDate"), <input type="date" value={d.endDate} min={d.date} onChange={(e) => set("endDate", e.target.value)} style={inp} />)}
        {ed.kind === "event" && field(t("calF.endTime"), <input type="time" value={d.endTime} onChange={(e) => set("endTime", e.target.value)} style={inp} />)}
        {ed.kind === "event" && field(t("calF.type"), sel("type", SP_EVENT_TYPES.map((x) => [x, t(`spEvt.${x}`)])))}
        {ed.kind === "event" && field(t("calF.repeat"), sel("repeat", [["none", t("calRep.none")], ["daily", t("calRep.daily")], ["weekly", t("calRep.weekly")], ["monthly", t("calRep.monthly")]]))}
        {ed.kind === "event" && d.repeat !== "none" && field(t("calF.until"), <input type="date" value={d.until} min={d.date} onChange={(e) => set("until", e.target.value)} style={inp} />)}
        {ed.kind === "task" && field(t("calF.type"), sel("kindT", SP_TASK_KINDS.map((x) => [x, cap(x)])))}
        {ed.kind === "task" && field(t("calF.subject"), <input value={d.subject} maxLength={80} onChange={(e) => set("subject", e.target.value)} style={inp} />)}
        {ed.kind === "task" && field(t("calF.priority"), sel("priority", PLAN_PRIORITIES.map((x) => [x, t(`plPri.${x}`)])))}
        {ed.kind === "exam" && field(t("calF.type"), sel("type", SP_ASSESS_TYPES.map((x) => [x, cap(x)])))}
        {ed.kind === "exam" && field(t("calF.weight"), <input type="number" min={0} max={100} value={d.weight} onChange={(e) => set("weight", e.target.value)} style={inp} />)}
        {ed.kind === "exam" && field(t("calF.place"), <input value={d.place} maxLength={80} onChange={(e) => set("place", e.target.value)} style={inp} />)}
        {ed.kind === "exam" && courses.length > 0 && field(t("calF.course"), sel("courseId", [["", "—"], ...courses.map((c) => [c.id, c.name])]))}
        {ed.kind === "exam" && field(t("calF.topics"), <input value={d.topics} onChange={(e) => set("topics", e.target.value)} style={inp} />, true)}
        {field(t("calF.notes"), <input value={d.notes} maxLength={200} onChange={(e) => set("notes", e.target.value)} style={inp} />, true)}
      </div>
      {ed.kind === "exam" && <label style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: FONT_UI, fontSize: fs(13), color: T.ink }}><input type="checkbox" checked={d.done} onChange={(e) => set("done", e.target.checked)} />{t("calF.done")}</label>}
      {ed.kind === "task" && <label style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: FONT_UI, fontSize: fs(13), color: T.ink }}><input type="checkbox" checked={d.taskDone} onChange={(e) => set("taskDone", e.target.checked)} />{t("calF.taskDone")}</label>}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <PrimaryButton T={T} icon={Check} onClick={onSave} disabled={!valid}>{t("calSave")}</PrimaryButton>
        <GhostButton T={T} icon={X} onClick={onCancel}>{t("calCancel")}</GhostButton>
        {ed.id && <GhostButton T={T} icon={Trash2} onClick={onDelete} style={{ marginLeft: "auto" }}>{t("calDelete")}</GhostButton>}
      </div>
    </div>
  );
}
function CalendarPage({ sessionLog, onNavigate, T, focusDate }) {
  const { t, lang } = useI18n();
  const sp = useContext(ProfileContext);
  const vw = useViewport().w;
  const phone = vw < 640;
  const wide = vw >= 1180;
  const locale = lang === "es" ? "es" : "en-US";
  const mondayFirst = lang === "es";
  const profile = sp.profile;
  const todayKey = toISODate(new Date());
  const [mode, setMode] = useState("month"); // month | week | agenda
  const [anchor, setAnchor] = useState(() => startOfDay(new Date())); // the day the visible month / week / agenda is built around
  const [selKey, setSelKey] = useState(todayKey);
  const [layers, setLayers] = useState({ key: true, class: true, exam: true, event: true, task: true, study: true });
  const [newTitle, setNewTitle] = useState("");
  const [editClasses, setEditClasses] = useState(false);
  const [ed, setEd] = useState(null); const [toast, setToast] = useState(null); const [q, setQ] = useState(""); const dragRef = useRef(null);
  useEffect(() => { if (!toast) return undefined; const id = setTimeout(() => setToast(null), 7000); return () => clearTimeout(id); }, [toast]);
  useEffect(() => { // a day chosen in Search: open the calendar on it
    const d = focusDate && parseISODate(focusDate.key); if (!d) return;
    setSelKey(focusDate.key); setAnchor(startOfDay(d));
  }, [focusDate && focusDate.n]); // eslint-disable-line
  const cap = (x) => x.charAt(0).toUpperCase() + x.slice(1);
  const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
  const brief = useMemo(() => (profile ? tutorBrief(profile, sessionLog, new Date()) : null), [profile, sessionLog, todayKey]); // eslint-disable-line
  const termStart = profile ? termStartOf(profile) : null;
  const termEnd = profile ? parseISODate(profile.term && profile.term.endDate) : null;

  // [accent, tint] per kind of item
  const KIND = { key: [T.ink, T.mutedBg], exam: [T.red, T.redLight], class: [T.purple, T.purpleLight], event: [T.blue, T.blueLight], task: [T.amber, T.amberLight], study: [T.green, T.greenLight] };
  const EMPTY = { exams: [], tasks: [], events: [], sessions: [], keys: [] };

  const byDay = useMemo(() => {
    const m = new Map();
    const slot = (k) => { let x = m.get(k); if (!x) { x = { exams: [], tasks: [], events: [], sessions: [], keys: [] }; m.set(k, x); } return x; };
    if (profile) {
      (profile.assessments || []).forEach((a) => slot(a.date).exams.push(a));
      ((profile.plan && profile.plan.tasks) || []).forEach((k) => { if (k.due) slot(k.due).tasks.push(k); });
      ((profile.calendar && profile.calendar.events) || []).forEach((e) => eventDayKeys(e, profile.term && profile.term.endDate).forEach((k) => slot(k).events.push(e)));
      const tm = profile.term || {};
      if (parseISODate(tm.startDate)) slot(tm.startDate).keys.push({ id: "start", title: t("calTermStart") });
      if (parseISODate(tm.endDate)) slot(tm.endDate).keys.push({ id: "end", title: t("calTermEnd") });
      const te = profile.student && profile.student.targetExam;
      if (te && parseISODate(te.date)) slot(te.date).keys.push({ id: "target", title: te.name || t("calTargetExam") });
    }
    (sessionLog || []).forEach((e) => slot(toISODate(new Date(e.finishedAt))).sessions.push(e));
    return m;
  }, [profile, sessionLog, lang]); // eslint-disable-line
  const infoOf = (key) => byDay.get(key) || EMPTY;
  const isOff = (info) => info.events.some((e) => e.type === "holiday" || e.type === "break");

  const termWeekOf = (d) => {
    if (!termStart || !brief) return null;
    const diff = dayDiff(termStart, d); if (diff < 0) return null;
    const w = Math.floor(diff / 7) + 1;
    if ((termEnd && dayDiff(d, termEnd) < 0) || (brief.total && w > brief.total)) return null;
    return { w, first: diff % 7 === 0 };
  };
  // Class meetings on a day: inside the term and not on a holiday / break.
  const classesOn = (d, info) => {
    if (!profile) return [];
    if ((termStart && dayDiff(termStart, d) < 0) || (termEnd && dayDiff(d, termEnd) < 0)) return [];
    if (isOff(info)) return [];
    return (profile.courses || []).flatMap((c) => (c.meetings || []).filter((m) => meetingRunsOn(m, d)).map((m) => ({ c, m })))
      .sort((p, q) => ((p.m.start || "99") < (q.m.start || "99") ? -1 : (p.m.start || "99") > (q.m.start || "99") ? 1 : 0));
  };
  const shortClock = (x) => String(x || "").replace(/:00\s?([AP])M/i, (m, c) => c.toLowerCase()).replace(/\s?([AP])M/i, (m, c) => c.toLowerCase()); // "9:00 AM" -> "9a", "1:30 PM" -> "1:30p"
  const qOf = (sessions) => sessions.reduce((n, e) => n + (Number(e.answered != null ? e.answered : e.total) || 0), 0);
  // Everything on a day that the visible layers allow. group = true folds several classes into one line (month cells).
  const itemsOf = (d, group = false) => {
    const dk = toISODate(d); const info = infoOf(dk); const out = [];
    if (layers.key) info.keys.forEach((k) => out.push({ id: `k-${k.id}`, kind: "key", title: k.title }));
    if (layers.exam) info.exams.forEach((a) => out.push({ id: `x-${a.id}`, kind: "exam", title: a.title, t24: a.time || "", time: a.time ? shortClock(fmtClock(a.time, locale)) : null, done: a.status === "done", drag: { kind: "exam", id: a.id, src: dk }, edit: { kind: "exam", id: a.id } }));
    if (layers.class) {
      const cl = classesOn(d, info);
      if (group && cl.length > 1) out.push({ id: "c-all", kind: "class", title: t("calClassesN", { n: cl.length }) });
      else cl.forEach(({ c, m }) => out.push({ id: `c-${c.id}-${m.id}`, kind: "class", title: c.name, t24: m.start || "", time: m.start ? shortClock(fmtClock(m.start, locale)) : null }));
    }
    if (layers.event) info.events.forEach((e) => out.push({ id: `e-${e.id}`, kind: "event", title: e.title, t24: e.time || "", time: e.time ? shortClock(fmtClock(e.time, locale)) : null, drag: { kind: "event", id: e.id, src: dk }, edit: { kind: "event", id: e.id } }));
    if (layers.task) info.tasks.filter((k) => !String(k.id).startsWith("cal-")).forEach((k) => out.push({ id: `t-${k.id}`, kind: "task", title: k.title, done: k.done, high: k.priority === "high" && !k.done, late: !k.done && dk < todayKey, t24: k.time || "", time: k.time ? shortClock(fmtClock(k.time, locale)) : null, drag: { kind: "task", id: k.id, src: dk }, edit: { kind: "task", id: k.id } }));
    if (layers.study && info.sessions.length) out.push({ id: "s", kind: "study", title: t("csCalStudied", { n: info.sessions.length, q: qOf(info.sessions) }) });
    const ql = q.trim().toLowerCase(); const hit = ql ? out.filter((i) => i.title.toLowerCase().includes(ql)) : out;
    return hit.map((i, n) => ({ i, n })).sort((x, y) => ((x.i.kind === "key" ? 0 : 1) - (y.i.kind === "key" ? 0 : 1)) || ((x.i.t24 || "99") < (y.i.t24 || "99") ? -1 : (x.i.t24 || "99") > (y.i.t24 || "99") ? 1 : 0) || x.n - y.n).map((x) => x.i);
  };

  // ---- navigation ----
  const monthStart = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
  const weekStart = (() => { const d = startOfDay(anchor); return addDays(d, -((d.getDay() - (mondayFirst ? 1 : 0) + 7) % 7)); })();
  const agendaDays = Array.from({ length: 30 }, (_, i) => addDays(startOfDay(anchor), i));
  const shift = (n) => setAnchor((a) => (mode === "month" ? new Date(a.getFullYear(), a.getMonth() + n, 1) : addDays(a, n * (mode === "week" ? 7 : 30))));
  const goToday = () => { const d = startOfDay(new Date()); setAnchor(d); setSelKey(toISODate(d)); };
  const inView = (d) => (mode === "month" ? d.getMonth() === monthStart.getMonth() && d.getFullYear() === monthStart.getFullYear()
    : mode === "week" ? dayDiff(weekStart, d) >= 0 && dayDiff(weekStart, d) <= 6 : dayDiff(anchor, d) >= 0 && dayDiff(anchor, d) < 30);
  const changeMode = (m) => { if (m === mode) return; const s = parseISODate(selKey); if (s && inView(s)) setAnchor(s); setMode(m); };
  const selectDay = (d) => { setSelKey(toISODate(d)); if (mode === "month" && d.getMonth() !== monthStart.getMonth()) setAnchor(new Date(d.getFullYear(), d.getMonth(), 1)); };
  const fmtShort = (d) => d.toLocaleDateString(locale, { month: "short", day: "numeric" });
  const fmtLong = (d) => d.toLocaleDateString(locale, { month: "short", day: "numeric", year: "numeric" });
  const rangeLabel = mode === "month" ? cap(monthStart.toLocaleDateString(locale, { month: "long", year: "numeric" }))
    : mode === "week" ? `${fmtShort(weekStart)} – ${fmtLong(addDays(weekStart, 6))}`
      : `${fmtShort(anchor)} – ${fmtLong(addDays(anchor, 29))}`;
  const lead = (monthStart.getDay() - (mondayFirst ? 1 : 0) + 7) % 7;
  const dim = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0).getDate();
  const monthCells = Array.from({ length: Math.ceil((lead + dim) / 7) * 7 }, (_, i) => addDays(monthStart, i - lead));
  const weekdayName = (style) => Array.from({ length: 7 }, (_, i) => new Date(2023, 0, 1 + (mondayFirst ? 1 : 0) + i).toLocaleDateString(locale, { weekday: style }));
  const longDay = (d) => d.toLocaleDateString(locale, { weekday: "long", month: "long", day: "numeric" });

  // ---- selected day ----
  const selDate = parseISODate(selKey) || new Date();
  const sel = infoOf(selKey);
  const selWk = termWeekOf(selDate);
  const selClasses = classesOn(selDate, sel);
  const hasMeetings = !!(profile && (profile.courses || []).some((c) => (c.meetings || []).length));
  const planTasks = (profile && profile.plan && profile.plan.tasks) || [];
  const events = (profile && profile.calendar && profile.calendar.events) || [];
  const assessments = (profile && profile.assessments) || [];
  const newId = () => `usr-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  const byDate = (k) => (x, y) => (x[k] < y[k] ? -1 : x[k] > y[k] ? 1 : 0);
  const calNow = () => ({ events, tasks: planTasks, assessments });
  // Every change goes through here: one atomic update, and (when there is a message) an Undo that puts all three lists back.
  const commitCal = (patch, msg) => { const before = calNow(); sp.setCal(patch); if (msg) setToast({ msg, undo: () => sp.setCal(before) }); };
  const openNew = (kind, key) => setEd({ kind, id: null, draft: { ...CAL_BLANK, date: key || selKey, type: kind === "exam" ? "exam" : "other" } });
  const openEdit = (kind, id) => {
    if (kind === "event") { const e = events.find((x) => x.id === id); if (e) setEd({ kind, id, draft: { ...CAL_BLANK, title: e.title, date: e.startDate, endDate: e.endDate || "", time: e.time || "", endTime: e.endTime || "", type: e.type, notes: e.notes || "", repeat: e.repeat || "none", until: e.until || "" } }); }
    else if (kind === "task") { const k = planTasks.find((x) => x.id === id); if (k) setEd({ kind, id, draft: { ...CAL_BLANK, title: k.title, date: k.due || selKey, time: k.time || "", kindT: k.kind || "other", subject: k.subject || "", notes: k.notes || "", priority: k.priority || "normal", taskDone: !!k.done } }); }
    else { const a = assessments.find((x) => x.id === id); if (a) setEd({ kind: "exam", id, draft: { ...CAL_BLANK, title: a.title, date: a.date, time: a.time || "", type: a.type, weight: a.weightPct == null ? "" : String(a.weightPct), place: a.location || "", topics: (a.coverage || []).join(", "), courseId: a.courseId || "", done: a.status === "done", notes: a.notes || "" } }); }
  };
  const saveEd = () => {
    if (!ed || !profile) return; const d = ed.draft; const title = d.title.trim().slice(0, 160); if (!title || !parseISODate(d.date)) return;
    const notes = d.notes.trim().slice(0, 200) || null; const id = ed.id || newId();
    if (ed.kind === "event") {
      const ev = { id, title, type: d.type, startDate: d.date, endDate: d.endDate && d.endDate > d.date ? d.endDate : null, time: d.time || null, endTime: d.time && d.endTime ? d.endTime : null, notes, repeat: d.repeat !== "none" ? d.repeat : null, until: d.repeat !== "none" && d.until ? d.until : null };
      commitCal({ events: (ed.id ? events.map((x) => (x.id === id ? { ...x, ...ev } : x)) : [...events, ev]).sort(byDate("startDate")) });
    } else if (ed.kind === "task") {
      const old = planTasks.find((x) => x.id === id);
      const tk = { ...(old || {}), id, title, due: d.date, time: d.time || null, subject: d.subject.trim().slice(0, 80) || null, kind: d.kindT, notes, priority: d.priority, done: !!d.taskDone, doneAt: d.taskDone ? ((old && old.done && old.doneAt) || Date.now()) : null };
      commitCal({ tasks: ed.id ? planTasks.map((x) => (x.id === id ? tk : x)) : [...planTasks, tk] });
    } else {
      const old = assessments.find((x) => x.id === id) || {}; const w = d.weight === "" ? null : Number(d.weight);
      const ex = { coverageWeeks: [], qbankFocus: [], durationMin: null, format: null, ...old, id, title, type: d.type, date: d.date, time: d.time || null, location: d.place.trim().slice(0, 80) || null, weightPct: w != null && Number.isFinite(w) && w >= 0 && w <= 100 ? w : null, coverage: d.topics.split(",").map((x) => x.trim()).filter(Boolean).slice(0, 30), courseId: d.courseId || null, status: d.done ? "done" : "upcoming", notes, edited: true,
        ...(old.title && old.title !== title ? { titleEdited: true } : {}), ...((old.courseId || null) !== (d.courseId || null) ? { courseEdited: true } : {}) };
      commitCal({ assessments: (ed.id ? assessments.map((x) => (x.id === id ? ex : x)) : [...assessments, ex]).sort(byDate("date")) });
    }
    setEd(null); selectDay(parseISODate(d.date));
  };
  const delEd = () => {
    if (!ed || !ed.id) return; const id = ed.id; const title = ed.draft.title || "";
    if (ed.kind === "event") commitCal({ events: events.filter((x) => x.id !== id), tasks: planTasks.filter((k) => !String(k.id).startsWith(`cal-event-${id}-`)) }, t("calDeleted", { s: title }));
    else if (ed.kind === "task") commitCal({ tasks: planTasks.filter((x) => x.id !== id) }, t("calDeleted", { s: title }));
    else commitCal({ assessments: assessments.filter((x) => x.id !== id), tasks: planTasks.filter((k) => k.id !== `cal-exam-${id}`) }, t("calDeleted", { s: title }));
    setEd(null);
  };
  // Drag an exam, event or task onto another day. A repeating event moves its whole series.
  const dropOn = (key) => {
    const dr = dragRef.current; dragRef.current = null; if (!dr || !profile || dr.src === key) return;
    const delta = dayDiff(parseISODate(dr.src), parseISODate(key)); const shiftKey = (k) => { const x = parseISODate(k); x.setDate(x.getDate() + delta); return toISODate(x); };
    let title = "";
    if (dr.kind === "task") { const k = planTasks.find((x) => x.id === dr.id); if (!k) return; title = k.title; commitCal({ tasks: planTasks.map((x) => (x.id === dr.id ? { ...x, due: key } : x)) }, t("calMoved", { s: title, d: fmtShort(parseISODate(key)) })); }
    else if (dr.kind === "event") { const e = events.find((x) => x.id === dr.id); if (!e) return; title = e.title; commitCal({ events: events.map((x) => (x.id === dr.id ? { ...x, startDate: shiftKey(x.startDate), endDate: x.endDate ? shiftKey(x.endDate) : null } : x)).sort(byDate("startDate")) }, t("calMoved", { s: title, d: fmtShort(parseISODate(key)) })); }
    else { const a = assessments.find((x) => x.id === dr.id); if (!a) return; title = a.title; commitCal({ assessments: assessments.map((x) => (x.id === dr.id ? { ...x, date: key, edited: true } : x)).sort(byDate("date")) }, t("calMoved", { s: title, d: fmtShort(parseISODate(key)) })); }
    setSelKey(key);
  };
  // .ics for Google / Apple / Outlook calendars: exams, events (with their repeat), tasks and every class meeting of the term.
  const exportIcs = () => {
    if (!profile) return;
    const esc = (x) => String(x || "").replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
    const dS = (k) => k.replace(/-/g, ""); const tS = (h) => `${h.replace(":", "")}00`;
    const plus = (k, n) => { const x = parseISODate(k); x.setDate(x.getDate() + n); return toISODate(x); };
    const hourLater = (h) => { const [a, b] = h.split(":").map(Number); const m = Math.min(1439, a * 60 + b + 60); return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`; };
    const stamp = `${new Date().toISOString().replace(/[-:]/g, "").split(".")[0]}Z`; const L = []; let n = 0;
    const vevent = (title, k, time, endK, endTime, extra = [], notes) => {
      L.push("BEGIN:VEVENT", `UID:oworld-${Date.now().toString(36)}-${n++}@oworld`, `DTSTAMP:${stamp}`, `SUMMARY:${esc(title)}`);
      if (time) { L.push(`DTSTART:${dS(k)}T${tS(time)}`, `DTEND:${dS(endK || k)}T${tS(endTime || hourLater(time))}`); } else { L.push(`DTSTART;VALUE=DATE:${dS(k)}`, `DTEND;VALUE=DATE:${dS(plus(endK || k, 1))}`); }
      if (notes) L.push(`DESCRIPTION:${esc(notes)}`); extra.forEach((x) => L.push(x)); L.push("END:VEVENT");
    };
    L.push("BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Oworld//USMLE Tutor//EN", "CALSCALE:GREGORIAN", `X-WR-CALNAME:${esc((profile.term && profile.term.name) || "Oworld")}`);
    assessments.forEach((a) => vevent(`${a.title} (${a.type})`, a.date, a.time, null, null, [], [a.location, (a.coverage || []).join(", ")].filter(Boolean).join(" · ")));
    events.forEach((e) => { const freq = { daily: "DAILY", weekly: "WEEKLY", monthly: "MONTHLY" }[e.repeat]; const stop = e.until || (profile.term && profile.term.endDate) || plus(e.startDate, 365);
      vevent(e.title, e.startDate, e.time, e.endDate || null, e.endTime, freq ? [`RRULE:FREQ=${freq};UNTIL=${dS(stop)}`] : [], e.notes); });
    planTasks.filter((k) => k.due && !String(k.id).startsWith("cal-")).forEach((k) => vevent(`${t("csCalLegTask")}: ${k.title}`, k.due, k.time, null, null, [], k.notes));
    if (termStart && termEnd) for (let i = 0; i < 400; i++) { const d = addDays(termStart, i); if (d > termEnd) break; classesOn(d, infoOf(toISODate(d))).forEach(({ c, m }) => vevent(c.name, toISODate(d), m.start, null, m.end, [], m.location)); }
    L.push("END:VCALENDAR");
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([L.join("\r\n")], { type: "text/calendar" })); a.download = "oworld-calendar.ics"; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };
  const sched = [
    ...sel.exams.map((a) => ({ id: `cal-exam-${a.id}`, src: "exam", item: a, title: a.title, kind: "exam" })),
    ...sel.events.map((e) => ({ id: `cal-event-${e.id}-${selKey}`, src: "event", item: e, title: e.title, kind: "other" })),
  ].map((x) => ({ ...x, done: !!(planTasks.find((k) => k.id === x.id) || {}).done }));
  const schedIds = new Set(sched.map((x) => x.id));
  const selTasks = sel.tasks.filter((k) => !schedIds.has(k.id) && !String(k.id).startsWith("cal-"));
  const tickSched = (x) => {
    if (planTasks.some((k) => k.id === x.id)) sp.toggleTask(x.id);
    else sp.addTask({ id: x.id, title: x.title, due: selKey, subject: null, kind: x.kind, done: true, doneAt: Date.now() });
  };
  const isMine = (k) => !String(k.id).startsWith("cal-");
  const dupToday = selKey === todayKey; // today's tasks, exams, events and classes are already listed in the plan right below, so the day view skips them
  // Exams, events and classes of the next 7 days, handed to the task manager with actions of their own.
  const agenda = profile ? Array.from({ length: 8 }, (_, i) => addDays(startOfDay(new Date()), i)).flatMap((d) => {
    const dk = toISODate(d); const info = infoOf(dk); const wk = termWeekOf(d);
    return [
      ...info.exams.map((a) => ({ id: `cal-exam-${a.id}`, src: "exam", title: a.title, date: dk, time: a.time || "", sub: [spCourseOf(profile, a.courseId) ? spCourseOf(profile, a.courseId).name : null, a.weightPct != null ? `${a.weightPct}%` : null, a.location].filter(Boolean).join(" · "), ref: a, topics: ((a.qbankFocus && a.qbankFocus.length ? a.qbankFocus : a.coverage) || []).slice(0, 4), examDone: a.status === "done" })),
      ...info.events.filter((e) => e.type !== "holiday" && e.type !== "break").map((e) => ({ id: `cal-event-${e.id}-${dk}`, src: "event", title: e.title, date: dk, time: e.time || "", sub: "", ref: e, topics: [] })),
      ...(dk === todayKey ? classesOn(d, info) : []).map(({ c, m }) => { const cw = wk ? (c.weeks || []).find((w) => w.week === wk.w) : null; return { id: `cal-class-${c.id}-${m.id}-${dk}`, src: "class", title: c.name, date: dk, time: m.start || "", sub: [m.location].filter(Boolean).join(" · "), ref: { c, m }, topics: cw ? [...(cw.qbankFocus || []), ...(cw.topics || [])].slice(0, 3) : [] }; }),
    ];
  }).map((x) => ({ ...x, done: !!x.examDone || !!(planTasks.find((k) => k.id === x.id) || {}).done })) : [];
  const agendaApi = {
    create: (kind, title, date) => {
      setEd({ kind, id: null, draft: { ...CAL_BLANK, title: title || "", date: parseISODate(date) ? date : selKey, type: kind === "exam" ? "exam" : "other" } });
      setTimeout(() => { const el = document.getElementById("schedule-day"); if (el) el.scrollIntoView({ behavior: "smooth", block: "start" }); }, 60);
    },
    tick: (x) => { if (planTasks.some((k) => k.id === x.id)) sp.toggleTask(x.id); else sp.addTask({ id: x.id, title: x.title, due: x.date, subject: null, kind: x.src === "exam" ? "exam" : "other", done: true, doneAt: Date.now() }); },
  };
  const dayTasks = [...sched, ...selTasks]; const dayDone = dayTasks.filter((k) => k.done).length;
  const unscheduled = planTasks.filter((k) => !k.due && !k.done && !String(k.id).startsWith("cal-"));
  const submitNew = () => {
    const title = newTitle.trim().slice(0, 200); if (!title || !profile) return;
    sp.addTask({ id: `usr-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`, title, due: selKey, subject: null, kind: "other", done: false });
    setNewTitle("");
  };
  const fmtRange = (e) => (e.endDate ? `${fmtShort(parseISODate(e.startDate))} → ${fmtShort(parseISODate(e.endDate))}` : fmtShort(parseISODate(e.startDate)));

  // ---- shared styles ----
  const card = { background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: phone ? 14 : 22, minWidth: 0 };
  const iconBtn = { width: 32, height: 32, borderRadius: 8, border: `1px solid ${T.border}`, background: "transparent", color: T.ink, cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", padding: 0 };
  const rowHead = { fontFamily: FONT_UI, fontWeight: 700, fontSize: fs(13.5), color: T.ink, overflowWrap: "anywhere" };
  const rowSub = { fontFamily: FONT_MONO, fontSize: fs(11.5), color: T.muted };
  const itemRow = { display: "flex", alignItems: "flex-start", gap: 10, padding: "7px 0" };
  const sect = { fontFamily: FONT_UI, fontWeight: 700, fontSize: fs(11.5), color: T.muted, textTransform: "uppercase", letterSpacing: "0.06em" };
  const dot = (color, k) => <span key={k} style={{ width: 6, height: 6, borderRadius: 999, background: color, display: "inline-block" }} />;

  const chipEl = (it, wrap) => {
    const [c, bg] = it.late ? [T.red, T.redLight] : KIND[it.kind];
    return (
      <span key={it.id} title={[it.time, it.title].filter(Boolean).join(" ")} draggable={!!it.drag} onDragStart={it.drag ? (e) => { dragRef.current = it.drag; e.dataTransfer.effectAllowed = "move"; try { e.dataTransfer.setData("text/plain", it.title); } catch (x) { /* ignore */ } } : undefined} onDragEnd={() => { dragRef.current = null; }} onDoubleClick={it.edit ? (e) => { e.stopPropagation(); openEdit(it.edit.kind, it.edit.id); } : undefined} style={{
        display: "block", boxSizing: "border-box", maxWidth: "100%", textAlign: "left", borderLeft: `3px solid ${c}`, background: bg, color: T.ink, borderRadius: 4,
        padding: "2px 6px", fontFamily: FONT_UI, fontSize: fs(11.5), lineHeight: 1.35, fontWeight: it.kind === "exam" || it.kind === "key" ? 700 : 500,
        textDecoration: it.done ? "line-through" : "none", opacity: it.done ? 0.65 : 1,
        ...(wrap ? { overflowWrap: "break-word", wordBreak: "normal" } : { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }),
      }}>
        {it.time && <span style={{ fontFamily: FONT_MONO, fontSize: fs(10.5), color: T.muted }}>{it.time} </span>}{it.high ? "! " : ""}{it.title}
      </span>
    );
  };
  const dayNum = (d, isToday, isSel) => (
    <span style={{
      minWidth: 30, height: 30, lineHeight: "30px", textAlign: "center", borderRadius: 999, fontSize: fs(16), fontWeight: isToday || isSel ? 700 : 500,
      background: isToday ? T.blue : "transparent", color: isToday ? T.onBlue : T.ink, display: "inline-block",
    }}>{d.getDate()}</span>
  );
  const keyActivate = (fn) => (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); fn(); } };

  // ---- views ----
  const monthView = (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(0, 1fr))", gap: phone ? 2 : 4 }}>
      {weekdayName(phone ? "narrow" : "short").map((w, i) => <div key={i} style={{ textAlign: "center", fontFamily: FONT_UI, fontWeight: 600, fontSize: fs(12), color: T.muted, padding: "4px 0" }}>{w}</div>)}
      {monthCells.map((d) => {
        const key = toISODate(d); const inMonth = d.getMonth() === monthStart.getMonth();
        const isSel = key === selKey; const isToday = key === todayKey;
        const items = itemsOf(d, true); const max = wide ? 3 : 2; const wk = termWeekOf(d);
        const kinds = [...new Set(items.map((i) => i.kind))];
        return (
          <div key={key} role="button" tabIndex={0} onClick={() => selectDay(d)} onKeyDown={keyActivate(() => selectDay(d))} onDragOver={(e) => { if (dragRef.current) e.preventDefault(); }} onDrop={(e) => { e.preventDefault(); dropOn(key); }} onDoubleClick={() => { if (profile) { selectDay(d); openNew("task", key); } }} aria-label={longDay(d)} aria-pressed={isSel} aria-current={isToday ? "date" : undefined} style={{
            minHeight: phone ? 54 : 122, minWidth: 0, boxSizing: "border-box", padding: phone ? "5px 2px" : "6px 6px 7px", borderRadius: 8, cursor: "pointer", fontFamily: FONT_UI,
            display: "flex", flexDirection: "column", alignItems: phone ? "center" : "stretch", justifyContent: "flex-start", gap: 4, textAlign: "left",
            background: isOff(infoOf(key)) ? T.blueLight : "transparent", border: `1px solid ${isSel ? T.blue : T.border}`, boxShadow: isSel ? `0 0 0 1px ${T.blue}` : "none",
            opacity: inMonth ? 1 : 0.42,
          }}>
            <span style={{ display: "flex", alignItems: "center", gap: 6, justifyContent: phone ? "center" : "flex-start" }}>
              {dayNum(d, isToday, isSel)}
              {!phone && wk && wk.first && <span style={{ fontFamily: FONT_MONO, fontSize: fs(10.5), color: T.muted }}>{t("spWeekN", { n: wk.w })}</span>}
            </span>
            {phone
              ? <span style={{ display: "flex", gap: 3, height: 6 }}>{kinds.slice(0, 4).map((k, i) => dot(KIND[k][0], i))}</span>
              : <span style={{ display: "grid", gap: 3, minWidth: 0 }}>
                {items.slice(0, max).map((it) => chipEl(it, false))}
                {items.length > max && <span style={{ fontFamily: FONT_UI, fontSize: fs(11), color: T.muted, paddingLeft: 3 }}>{t("csCalMore", { n: items.length - max })}</span>}
              </span>}
          </div>
        );
      })}
    </div>
  );

  const weekView = (
    <div style={{ display: "grid", gridTemplateColumns: vw >= 900 ? "repeat(7, minmax(0, 1fr))" : "minmax(0, 1fr)", gap: 8, alignItems: "stretch" }}>
      {Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)).map((d) => {
        const key = toISODate(d); const isSel = key === selKey; const isToday = key === todayKey;
        const items = itemsOf(d); const wk = termWeekOf(d);
        return (
          <div key={key} role="button" tabIndex={0} aria-pressed={isSel} aria-label={longDay(d)} onClick={() => selectDay(d)} onKeyDown={keyActivate(() => selectDay(d))} onDragOver={(e) => { if (dragRef.current) e.preventDefault(); }} onDrop={(e) => { e.preventDefault(); dropOn(key); }} onDoubleClick={() => { if (profile) { selectDay(d); openNew("task", key); } }} style={{
            minHeight: vw >= 900 ? 220 : 0, minWidth: 0, boxSizing: "border-box", padding: 8, borderRadius: 8, cursor: "pointer", display: "flex", flexDirection: "column", gap: 6,
            background: isOff(infoOf(key)) ? T.blueLight : "transparent", border: `1px solid ${isSel ? T.blue : T.border}`, boxShadow: isSel ? `0 0 0 1px ${T.blue}` : "none",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
              {dayNum(d, isToday, isSel)}
              <span style={{ fontFamily: FONT_UI, fontWeight: 600, fontSize: fs(12), color: T.muted, textTransform: "uppercase", letterSpacing: "0.05em" }}>{d.toLocaleDateString(locale, { weekday: "short" })}</span>
              {wk && wk.first && <span style={{ fontFamily: FONT_MONO, fontSize: fs(10.5), color: T.muted }}>{t("spWeekN", { n: wk.w })}</span>}
            </div>
            <div style={{ display: "grid", gap: 4, minWidth: 0 }}>{items.map((it) => chipEl(it, true))}</div>
          </div>
        );
      })}
    </div>
  );

  const agendaRows = agendaDays.map((d) => ({ d, items: itemsOf(d) })).filter((x) => x.items.length > 0);
  const agendaView = agendaRows.length === 0
    ? <p style={{ fontFamily: FONT_UI, fontSize: fs(13.5), color: T.muted, margin: "8px 0" }}>{t("calAgendaEmpty")}</p>
    : (
      <div style={{ display: "grid" }}>
        {agendaRows.map(({ d, items }) => {
          const key = toISODate(d); const isSel = key === selKey; const isToday = key === todayKey; const wk = termWeekOf(d);
          return (
            <div key={key} role="button" tabIndex={0} aria-pressed={isSel} aria-label={longDay(d)} onClick={() => selectDay(d)} onKeyDown={keyActivate(() => selectDay(d))} style={{
              display: "grid", gridTemplateColumns: phone ? "56px minmax(0, 1fr)" : "92px minmax(0, 1fr)", gap: 12, padding: "10px 8px", borderBottom: `1px solid ${T.border}`, cursor: "pointer",
              background: isSel ? T.blueLight : "transparent", borderRadius: isSel ? 8 : 0,
            }}>
              <div>
                <div style={{ fontFamily: FONT_UI, fontWeight: 600, fontSize: fs(11.5), color: isToday ? T.blue : T.muted, textTransform: "uppercase", letterSpacing: "0.05em" }}>{d.toLocaleDateString(locale, { weekday: "short" })}</div>
                {dayNum(d, isToday, false)}
                <div style={{ fontFamily: FONT_MONO, fontSize: fs(10.5), color: T.muted }}>{fmtShort(d)}{wk && !phone ? ` · ${t("spWeekN", { n: wk.w })}` : ""}</div>
              </div>
              <div style={{ display: "grid", gap: 4, alignContent: "start", minWidth: 0 }}>{items.map((it) => chipEl(it, true))}</div>
            </div>
          );
        })}
      </div>
    );


  return (
    <div style={{ display: "grid", gap: 18 }}>
      <div style={wide ? undefined : { display: "none" }}>
        <h1 style={{ fontFamily: FONT_DISPLAY, fontSize: fs(phone ? 26 : 32), fontWeight: 600, color: T.ink, margin: "0 0 4px" }}>{t("calTitle")}</h1>
        <p style={{ fontFamily: FONT_UI, fontSize: fs(13.5), color: T.muted, lineHeight: 1.55, margin: 0, maxWidth: 680 }}>{t("calHint")}</p>
      </div>

      <div style={wide ? { display: "grid", gridTemplateColumns: "minmax(0, 1fr)", gap: 18, alignItems: "start" } : { display: "contents" }}>
        <div style={{ ...card, ...(wide ? {} : { order: 1 }) }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
            <CalendarDays size={18} color={T.ink} />
            <span style={{ fontFamily: FONT_DISPLAY, fontWeight: 600, fontSize: fs(phone ? 18 : 22), color: T.ink }}>{rangeLabel}</span>
            <div style={{ marginLeft: "auto", display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
              <button onClick={goToday} style={{ fontFamily: FONT_UI, fontWeight: 600, fontSize: fs(12.5), color: T.blue, background: "transparent", border: "none", cursor: "pointer", padding: 4 }}>{t("csCalToday")}</button>
              <button onClick={() => shift(-1)} aria-label={t("calPrev")} style={iconBtn}><ChevronLeft size={16} /></button>
              <button onClick={() => shift(1)} aria-label={t("calNext")} style={iconBtn}><ChevronRight size={16} /></button>
              <div role="group" aria-label={t("calTitle")} style={{ display: "flex", border: `1px solid ${T.border}`, borderRadius: 8, overflow: "hidden" }}>
                {[["month", "calMonth"], ["week", "calWeek"], ["agenda", "calAgenda"]].map(([id, k], i) => (
                  <button key={id} onClick={() => changeMode(id)} aria-pressed={mode === id} style={{
                    fontFamily: FONT_UI, fontWeight: 600, fontSize: fs(13), padding: "7px 13px", cursor: "pointer", border: "none", borderLeft: i ? `1px solid ${T.border}` : "none",
                    background: mode === id ? T.blueLight : "transparent", color: mode === id ? T.blue : T.ink,
                  }}>{t(k)}</button>
                ))}
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
            {CAL_LAYERS.map(([id, k]) => {
              const on = layers[id];
              return (
                <button key={id} onClick={(e) => setLayers((l) => {
                  // Solo select: the clicked layer is the only one shown. Clicking the layer that is already alone brings everything back.
                  // Shift / Ctrl / Cmd-click toggles a layer on its own instead, to combine several.
                  if (e.shiftKey || e.ctrlKey || e.metaKey) return { ...l, [id]: !l[id] };
                  const onlyThis = l[id] && CAL_LAYERS.every(([o]) => o === id || !l[o]);
                  return Object.fromEntries(CAL_LAYERS.map(([o]) => [o, onlyThis ? true : o === id]));
                })} aria-pressed={on} style={{
                  display: "inline-flex", alignItems: "center", gap: 6, fontFamily: FONT_UI, fontWeight: 600, fontSize: fs(12), cursor: "pointer", padding: "4px 11px", borderRadius: 999,
                  border: `1px solid ${on ? KIND[id][0] : T.border}`, background: on ? KIND[id][1] : "transparent", color: on ? T.ink : T.muted, opacity: on ? 1 : 0.7,
                }}>{dot(KIND[id][0])}{t(k)}</button>
              );
            })}
          </div>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginBottom: 14 }}>
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("calFind")} aria-label={t("calFind")} style={{ flex: "1 1 160px", ...{ fontFamily: FONT_UI, fontSize: fs(13), color: T.ink, background: T.paper, border: `1px solid ${T.border}`, borderRadius: 8, padding: "7px 10px", outline: "none", minWidth: 0 } }} />
            <input type="date" value={selKey} onChange={(e) => { const d = parseISODate(e.target.value); if (d) { setAnchor(startOfDay(d)); setSelKey(e.target.value); } }} aria-label={t("calJump")} title={t("calJump")} style={{ fontFamily: FONT_UI, fontSize: fs(13), color: T.ink, background: T.paper, border: `1px solid ${T.border}`, borderRadius: 8, padding: "7px 10px", outline: "none", minWidth: 0 }} />
            {profile && <GhostButton T={T} icon={Download} onClick={exportIcs}>{t("calExport")}</GhostButton>}
          </div>

          {mode === "month" && monthView}
          {mode === "week" && weekView}
          {mode === "agenda" && agendaView}

          {!profile && (
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginTop: 14, padding: "10px 12px", borderRadius: 8, background: T.mutedBg }}>
              <span style={{ flex: "1 1 220px", fontFamily: FONT_UI, fontSize: fs(12.5), color: T.muted, lineHeight: 1.5 }}>{t("csCalNoProfile")}</span>
              <GhostButton T={T} icon={Sparkles} onClick={() => onNavigate("profile")}>{t("csCalSetup")}</GhostButton>
            </div>
          )}
        </div>

        <div id="schedule-day" style={{ ...card, ...(wide ? { scrollMarginTop: "calc(var(--oworld-sticky-h, 0px) + 12px)" } : { order: 2 }) }}>
          <PlanManager inline profile={profile} sp={sp} brief={brief} T={T} t={t} lang={lang} phone={phone} agenda={agenda} api={agendaApi} query={q}
            headExtra={dayTasks.length > 0 ? <Pill T={T} tone={dayDone === dayTasks.length ? "green" : "amber"}>{t("calDayDone", { d: dayDone, n: dayTasks.length })}</Pill> : null}
            onNavigate={(tab, key) => { const d = parseISODate(key); if (d) { setSelKey(key); setAnchor(startOfDay(d)); window.scrollTo({ top: 0, behavior: "smooth" }); } }}>
          {!dupToday && <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 6 }}>
            {!dupToday && <span style={{ fontFamily: FONT_UI, fontWeight: 700, fontSize: fs(15), color: T.ink }}>{cap(longDay(selDate))}</span>}
            {selWk && selKey !== todayKey && <Pill T={T} tone="muted">{brief && brief.total ? t("spTermWeek", { w: selWk.w, n: brief.total }) : t("spTermWeekNoTotal", { w: selWk.w })}</Pill>}
          </div>}

          {ed && profile && <CalItemEditor ed={ed} setEd={setEd} onSave={saveEd} onDelete={delEd} onCancel={() => setEd(null)} courses={profile.courses || []} T={T} t={t} />}
          {sel.keys.length > 0 && (
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", margin: "4px 0 8px" }}>{sel.keys.map((k) => <Pill key={k.id} T={T} tone="blue">{k.title}</Pill>)}</div>
          )}

          {profile && (
            <div style={{ marginBottom: 6 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ ...sect, color: T.purple }}>{t("csClasses")}</span>
                <GhostButton T={T} icon={editClasses ? Check : Pencil} onClick={() => setEditClasses((v) => !v)} style={{ marginLeft: "auto", padding: "4px 10px" }}>{editClasses ? t("csClassDone") : t("csClassEdit")}</GhostButton>
              </div>
              {editClasses
                ? <ClassEditor courses={profile.courses || []} onChange={sp.updateCourses} mondayFirst={mondayFirst} locale={locale} defaultDay={selDate.getDay()} T={T} t={t} />
                : dupToday ? null : selClasses.length > 0
                  ? selClasses.map(({ c, m }) => <ClassRow key={`${c.id}-${m.id}`} name={c.name} m={m} locale={locale} head={rowHead} T={T} />)
                  : !hasMeetings && <p style={{ fontFamily: FONT_UI, fontSize: fs(12.5), color: T.muted, margin: "2px 0 0" }}>{t("csClassNone")}</p>}
            </div>
          )}

          {(dupToday ? [] : sched).map((x) => {
            const a = x.item; const isExam = x.src === "exam"; const tone = isExam ? T.red : T.blue;
            return (
              <div key={x.id} style={itemRow}>
                <button onClick={() => tickSched(x)} role="checkbox" aria-checked={x.done} aria-label={x.title} style={{
                  width: 22, height: 22, flexShrink: 0, borderRadius: 5, cursor: "pointer", padding: 0, marginTop: 1, display: "inline-flex", alignItems: "center", justifyContent: "center",
                  background: x.done ? T.green : "transparent", border: `2px solid ${x.done ? T.green : tone}`, color: T.onBlue,
                }}>{x.done && <Check size={14} />}</button>
                <div style={{ flex: 1, minWidth: 0, opacity: x.done ? 0.6 : 1 }}>
                  <div style={{ ...rowHead, textDecoration: x.done ? "line-through" : "none" }}>{x.title}</div>
                  <div style={rowSub}>{isExam ? [spCourseOf(profile, a.courseId) ? spCourseOf(profile, a.courseId).name : null, a.time, a.weightPct != null ? `${a.weightPct}%` : null, a.format].filter(Boolean).join(" · ") : [fmtRange(a), a.time ? fmtClock(a.time, locale) : null, a.repeat ? t("calRepeats", { r: t(`calRep.${a.repeat}`).toLowerCase() }) : null].filter(Boolean).join(" · ")}</div>
                  {isExam && a.coverage.length > 0 && <div style={{ fontFamily: FONT_UI, fontSize: fs(12), color: T.muted, marginTop: 2 }}>{a.coverage.slice(0, 4).join(" · ")}</div>}
                  {!isExam && a.notes && <div style={{ fontFamily: FONT_UI, fontSize: fs(12), color: T.muted, marginTop: 2 }}>{a.notes}</div>}
                </div>
                <button onClick={() => openEdit(isExam ? "exam" : "event", a.id)} title={t("calEdit")} aria-label={t("calEdit")} style={{ background: "transparent", border: "none", cursor: "pointer", color: T.muted, padding: 4, display: "flex" }}><Pencil size={14} /></button>
                <Pill T={T} tone={isExam ? "red" : (SP_EVENT_TONE[a.type] || "muted")}>{isExam ? a.type : t(`spEvt.${a.type}`)}</Pill>
              </div>
            );
          })}
          {(dupToday ? [] : selTasks).map((k) => <TaskRow key={k.id} task={k} onToggle={() => sp.toggleTask(k.id)} onRemove={isMine(k) ? () => sp.removeTask(k.id) : undefined} onEdit={() => openEdit("task", k.id)} T={T} t={t} lang={lang} />)}
          {profile && unscheduled.length > 0 && (
            <div style={{ marginTop: 10 }}>
              <div style={sect}>{t("calUnscheduled", { n: unscheduled.length })}</div>
              {unscheduled.map((k) => (
                <div key={k.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0" }}>
                  <span style={{ flex: 1, minWidth: 0, fontFamily: FONT_UI, fontSize: fs(13.5), color: T.ink, overflowWrap: "anywhere" }}>{k.title}</span>
                  <GhostButton T={T} icon={CalendarDays} onClick={() => commitCal({ tasks: planTasks.map((x) => (x.id === k.id ? { ...x, due: selKey } : x)) }, t("calMoved", { s: k.title, d: fmtShort(selDate) }))} style={{ padding: "4px 10px" }}>{t("calScheduleHere")}</GhostButton>
                </div>
              ))}
            </div>
          )}
          {sel.sessions.map((e) => (
            <div key={e.id} style={itemRow}>
              <span style={{ marginTop: 6 }}>{dot(T.green)}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={rowHead}>{sessionTitle(e, t)}</div>
                <div style={rowSub}>{new Date(e.finishedAt).toLocaleTimeString(locale, { hour: "numeric", minute: "2-digit" })} · {t("histAnswered", { a: e.answered != null ? e.answered : e.total, n: e.total })}</div>
              </div>
            </div>
          ))}
          {!dupToday && !sched.length && !selTasks.length && !sel.sessions.length && !sel.keys.length && !selClasses.length && (
            <p style={{ fontFamily: FONT_UI, fontSize: fs(13.5), color: T.muted, margin: "4px 0 0" }}>{t("csCalNothing")}</p>
          )}

          {toast && (
            <div role="status" style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 12, padding: "9px 12px", borderRadius: 8, background: T.ink, color: T.paper, fontFamily: FONT_UI, fontSize: fs(13) }}>
              <span style={{ flex: 1, minWidth: 0, overflowWrap: "anywhere" }}>{toast.msg}</span>
              <button onClick={() => { toast.undo(); setToast(null); }} style={{ background: "transparent", border: "none", color: T.paper, fontWeight: 700, textDecoration: "underline", cursor: "pointer", fontFamily: FONT_UI, fontSize: fs(13) }}>{t("calUndo")}</button>
            </div>
          )}

          </PlanManager>
        </div>
      </div>

    </div>
  );
}
const CAL_LAYERS = [["key", "calLayerKey"], ["class", "csClasses"], ["exam", "csCalLegExam"], ["event", "csCalLegEvent"], ["task", "csCalLegTask"], ["study", "csCalLegStudy"]];

function ConsolePanel({ library, sessionLog, session, onResume, onOpenLobby, onReview, onNavigate, T }) {
  const { t, lang } = useI18n();
  const drive = useContext(DriveContext);
  const vw = useViewport().w;
  const phone = vw < 640;
  const wide = vw >= 900; // larger displays: legend on the left, donut on the right (same as the Analytics page)
  const signedIn = !!(drive && drive.configured && drive.linked && drive.profile);
  const spCtx = useContext(ProfileContext);
  const firstName = (() => {
    // Google name first; with no Google account (or no name on it) fall back to the student profile's name, then the email prefix
    const pr = signedIn ? drive.profile : null;
    const sName = spCtx && spCtx.profile && spCtx.profile.student && spCtx.profile.student.name;
    const full = (pr && pr.name) || sName || "";
    const raw = String(full).trim().split(/\s+/)[0] || (pr ? String((pr.email || "").split("@")[0] || "").trim().split(/[._-]+/)[0] : "");
    // Requirement: the first letter is always capitalized, whatever the source (skips leading quotes/punctuation, leaves the rest as written)
    return raw.replace(/\p{L}/u, (ch) => ch.toLocaleUpperCase());
  })();
  const hr = new Date().getHours();
  const greet = t(hr < 12 ? "csGoodMorning" : hr < 18 ? "csGoodAfternoon" : "csGoodEvening");
  const locale = lang === "es" ? "es" : "en-US";
  const card = { background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: phone ? 18 : 24 };
  const cardHead = { display: "flex", alignItems: "center", gap: 8, marginBottom: 14, flexWrap: "wrap" };
  const headTxt = { fontFamily: FONT_UI, fontWeight: 600, fontSize: fs(14), color: T.ink };
  const linkBtn = { marginLeft: "auto", fontFamily: FONT_UI, fontWeight: 600, fontSize: fs(12.5), color: T.blue, background: "transparent", border: "none", cursor: "pointer", padding: 4 };

  const data = useMemo(() => {
    const ordered = [...sessionLog].sort((a, b) => b.finishedAt - a.finishedAt);
    const totals = overviewTotals(sessionLog);
    const week = sessionLog.filter((e) => e.finishedAt >= Date.now() - 7 * 864e5).length;
    const days = new Set(sessionLog.map((e) => new Date(e.finishedAt).toDateString()));
    let streak = 0;
    const d = new Date();
    if (!days.has(d.toDateString())) d.setDate(d.getDate() - 1); // today not done yet: yesterday keeps the streak alive
    while (days.has(d.toDateString())) { streak += 1; d.setDate(d.getDate() - 1); }
    const trend = ordered.slice(0, 10).reverse().map((e) => Number(e.pct) || 0);
    const subj = new Map();
    sessionLog.forEach((e) => (Array.isArray(e.bySubject) ? e.bySubject : []).forEach((x) => {
      const cur = subj.get(x.subject) || { subject: x.subject, correct: 0, total: 0 };
      cur.correct += Number(x.correct) || 0; cur.total += Number(x.total) || 0; subj.set(x.subject, cur);
    }));
    const ranked = [...subj.values()].filter((x) => x.total >= 5).map((x) => ({ ...x, pct: Math.round((x.correct / x.total) * 100) })).sort((a, b) => b.pct - a.pct || b.total - a.total);
    const strong = ranked.slice(0, 3);
    const weak = ranked.slice(strong.length).slice(-3).reverse(); // lowest first, never repeats a strong subject
    return { ordered, totals, week, streak, trend, strong, weak };
  }, [sessionLog]);

  const inProg = !!(session && session.block);
  const qTotal = inProg ? session.block.questions.length : 0;
  const qPos = inProg ? (Number(session.bs.currentQuestionIndex) || 0) + 1 : 0;
  const qDone = inProg ? Object.values(session.bs.answers || {}).filter((a) => a && a.selected).length : 0;
  const recentLib = useMemo(() => [...library].sort((a, b) => (b.updatedAt || b.importDate || 0) - (a.updatedAt || a.importDate || 0)).slice(0, 3), [library]);
  const hasSessions = sessionLog.length > 0;
  const accuracy = data.totals.answered > 0 ? `${Math.round((data.totals.correct / data.totals.answered) * 100)}%` : "0%";
  const qbankQs = useMemo(() => libraryQuestionCount(library), [library]);
  const bestPct = sessionLog.reduce((m, e) => Math.max(m, Number(e.pct) || 0), 0);
  const fmtDay = (ms) => new Date(ms).toLocaleDateString(locale, { month: "short", day: "numeric" });

  const tile = (icon, label, value, sub) => (
    <div style={{ ...card, padding: "16px 18px", minHeight: 112, boxSizing: "border-box", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 7, fontFamily: FONT_UI, fontWeight: 600, fontSize: fs(12), color: T.muted, textTransform: "uppercase", letterSpacing: "0.05em" }}>{icon}{label}</div>
      <div style={{ fontFamily: FONT_UI, fontWeight: 800, fontSize: String(value).length > 9 ? fs(24) : fs(30), color: T.ink, lineHeight: 1.15, marginTop: 6, whiteSpace: "nowrap" }}>{value}</div>
      <div style={{ fontFamily: FONT_UI, fontSize: fs(12), color: T.muted, minHeight: "1.3em" }}>{sub || " "}</div>
    </div>
  );
  // Analytics highlights are three cards. On large displays they stack vertically under the stat tiles, next to the calendar,
  // so the page uses its height instead of leaving a wide, half-empty row; on narrow screens they keep the compact grid below the top row.
  const [donutRef, donutTall] = useTallCard(420);
  const donutCard = (
    <div ref={donutRef} style={{ ...card, display: "flex", flexDirection: "column" }}>
      <div style={cardHead}>
        <BarChart3 size={17} color={T.ink} />
        <span style={headTxt}>{t("csHighlights")}</span>
        <button onClick={() => onNavigate("analytics")} style={linkBtn}>{t("csViewAll")}</button>
      </div>
      {data.totals.answered > 0 && (
        <div style={{ flex: 1, display: "flex", flexDirection: donutTall ? "column" : "row", justifyContent: donutTall ? "center" : wide ? "space-around" : "flex-start", alignItems: "center", gap: donutTall ? 20 : 22, flexWrap: "wrap" }}>
          <DonutRing totals={data.totals} T={T} maxW={donutTall ? 230 : wide ? 160 : 190} />
          <DonutLegend totals={data.totals} T={T} stacked={donutTall} />
        </div>
      )}
    </div>
  );
  const trendCard = (
    <div style={card}>
      <div style={cardHead}>
        <TrendingUp size={17} color={T.ink} />
        <span style={headTxt}>{t("csTrend")}</span>
      </div>
      {data.trend.length >= 2 ? (
        <>
          <TrendSpark vals={data.trend} T={T} />
          <div style={{ fontFamily: FONT_UI, fontSize: fs(11.5), color: T.muted, marginTop: 6 }}>{t("csTrendHint", { n: data.trend.length })}</div>
        </>
      ) : <p style={{ fontFamily: FONT_UI, fontSize: fs(13.5), color: T.muted, margin: 0 }}>{t("csTrendNeed")}</p>}
    </div>
  );
  return (
    <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr)", gap: 20 }}>
      {/* Greeting */}
      <div>
        <h1 style={{ fontFamily: FONT_DISPLAY, fontSize: fs(phone ? 28 : 34), fontWeight: 600, color: T.ink, margin: "0 0 4px" }}>{firstName ? `${greet}, ${firstName}` : greet}</h1>
        <p style={{ fontFamily: FONT_UI, fontSize: fs(14), color: T.muted, margin: 0 }}>
          {new Date().toLocaleDateString(locale, { weekday: "long", month: "long", day: "numeric" })} · {data.streak > 0 ? t("csStreakLine", { n: data.streak }) : t("csReadyLine")}
        </p>
      </div>

      {/* Top of the Console: session + tutor (compact on large displays) with the semester calendar to their right */}
      <div style={{ display: "grid", gridTemplateColumns: wide ? "repeat(2, minmax(0, 1fr))" : "minmax(0, 1fr)", gap: 20, alignItems: "stretch" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: wide ? 14 : 20, minWidth: 0 }}>
      <div style={{ ...card, borderColor: session ? T.blue : T.border, display: "flex", alignItems: "center", justifyContent: "space-between", gap: wide ? 12 : 16, flexWrap: "wrap", ...(wide ? { padding: "14px 18px" } : {}) }}>
        {session ? (
          <>
            <div style={{ flex: "1 1 260px", minWidth: 0 }}>
              <div style={{ fontFamily: FONT_UI, fontWeight: 700, fontSize: fs(11.5), color: T.blue, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 3 }}>
                {inProg ? t("sessionInProgress") : t("examLoadedLabel")}
              </div>
              <div style={{ fontFamily: FONT_UI, fontWeight: 700, fontSize: fs(17), color: T.ink, overflowWrap: "anywhere" }}>
                {inProg ? blockLabel(session.block, t) : (session.examTitle || t("practiceExam"))}
              </div>
              {inProg && (
                <>
                  <div style={{ fontFamily: FONT_MONO, fontSize: fs(12), color: T.muted, margin: "4px 0 8px" }}>
                    {t("sessionPos", { n: qPos, total: qTotal })} · {t("csProgress", { a: qDone, n: qTotal })}
                  </div>
                  <div style={{ height: 6, borderRadius: 999, background: T.mutedBg, overflow: "hidden", maxWidth: 420 }}>
                    <div style={{ width: `${qTotal ? Math.round((qDone / qTotal) * 100) : 0}%`, height: "100%", background: T.blue }} />
                  </div>
                </>
              )}
            </div>
            {inProg
              ? <PrimaryButton T={T} onClick={onResume} icon={Play}>{t("resumeSession")}</PrimaryButton>
              : <GhostButton T={T} onClick={onOpenLobby}>{t("openLobby")}</GhostButton>}
          </>
        ) : (
          <>
            <div style={{ flex: "1 1 260px", minWidth: 0 }}>
              <div style={{ fontFamily: FONT_UI, fontWeight: 700, fontSize: fs(16), color: T.ink }}>{t("csNoSession")}</div>
              <div style={{ fontFamily: FONT_UI, fontSize: fs(13.5), color: T.muted, marginTop: 3 }}>{t("csNoSessionHint")}</div>
            </div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <PrimaryButton T={T} onClick={() => onNavigate("library")} icon={BookOpen}>{t("csOpenLibrary")}</PrimaryButton>
              <GhostButton T={T} onClick={() => onNavigate("import")} icon={Plus}>{t("csImportNew")}</GhostButton>
            </div>
          </>
        )}
      </div>

        <div style={{ flex: wide ? "1 1 auto" : "0 0 auto", minWidth: 0 }}>
          <TutorCard sessionLog={sessionLog} onNavigate={onNavigate} T={T} compact={wide} fill={wide} />
        </div>
        {(hasSessions || qbankQs > 0) && (
          <div style={{ display: "grid", gridTemplateColumns: wide ? "repeat(2, minmax(0, 1fr))" : "repeat(auto-fit, minmax(min(100%, 160px), 1fr))", gridAutoRows: "1fr", gap: 14 }}>
            {tile(<Target size={14} />, t("anStatAnswered"), fmtAnsweredOf(data.totals.answered, qbankQs), t(library.length === 1 ? "anStatBank1" : "anStatBanks", { n: library.length }))}
            {tile(<CheckCircle2 size={14} />, t("anStatCorrectPct"), accuracy, hasSessions ? t("anStatBest", { n: bestPct }) : null)}
            {tile(<ClipboardList size={14} />, t("csStatSessions"), sessionLog.length, t("csStatWeek", { n: data.week }))}
            {tile(<Flame size={14} />, t("csStatStreak"), data.streak, data.streak === 1 ? t("csStatDay1") : t("csStatDays", { n: data.streak }))}
          </div>
        )}
        {hasSessions && wide && <div style={{ display: "grid", gap: 14 }}>{trendCard}</div>}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: wide ? 14 : 0, minWidth: 0 }}>
          <ConsoleCalendar sessionLog={sessionLog} onNavigate={onNavigate} T={T} fill={false} />
          {hasSessions && wide && <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>{React.cloneElement(donutCard, { style: { ...donutCard.props.style, flex: 1 } })}</div>}
        </div>
      </div>

      {hasSessions && !wide && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 340px), 1fr))", gap: 20 }}>
          {donutCard}
          {trendCard}
        </div>
      )}
    </div>
  );
}

function SessionHistoryPanel({ history, qbankCount = 0, qbankQuestions = 0, onDelete, onClear, onReview, T }) {
  const { t, lang } = useI18n();
  const vpw = useViewport().w;
  const phone = vpw < 640;
  const twoCols = vpw >= 760; // two columns of sessions on tablets and larger
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
        <BarChart3 size={17} color={T.ink} />
        <span style={{ fontFamily: FONT_UI, fontWeight: 600, fontSize: fs(14), color: T.ink }}>{t("histTitle")}</span>
      </div>

      <AnalyticsOverview history={history} qbankCount={qbankCount} qbankQuestions={qbankQuestions} T={T} />

        {history.length > 0 && (
          <div role="toolbar" aria-label={t("histTitle")} style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "flex-end", marginBottom: 12 }}>
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
        <div style={{ display: "grid", gridTemplateColumns: twoCols ? "repeat(2, minmax(0, 1fr))" : "minmax(0, 1fr)", gap: 8, alignItems: "stretch" }}>
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

// Menu bar under the logo / account row: the Home pages. Console | Qbank | Analysis | Schedule | Database.
function PageNav({ tab, setTab, T }) {
  const { t } = useI18n();
  const items = [["console", t("tabConsole"), LayoutDashboard], ["library", t("tabLibrary"), BookOpen], ["analytics", t("tabHistory"), BarChart3], ["calendar", t("tabCalendar"), CalendarDays], ["database", t("tabDatabase"), Database]];
  return (
    <nav style={{ borderBottom: `1px solid ${T.border}`, marginBottom: 0, overflowX: "auto", overflowY: "hidden", touchAction: "pan-x", overscrollBehaviorY: "none" }}>
      <div role="tablist" style={{ display: "flex", gap: 4, width: "max-content", margin: "0 auto" }}>{/* auto margins center the tabs; when they are wider than the screen the margins collapse and the row scrolls from its start */}
        {items.map(([id, label, Ic]) => {
          const on = tab === id;
          return (
            <button key={id} role="tab" aria-selected={on} onClick={() => setTab(id)} style={{
              display: "flex", alignItems: "center", gap: 7, padding: "12px 16px", background: "transparent", border: "none", cursor: "pointer",
              borderBottom: `3px solid ${on ? T.blue : "transparent"}`, marginBottom: -1, whiteSpace: "nowrap",
              fontFamily: FONT_UI, fontWeight: on ? 700 : 600, fontSize: fs(14), color: on ? T.blue : T.ink,
            }}>
              <Ic size={16} /> {label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

// ---------------------------------------------------------------------------
// Import screen
// ---------------------------------------------------------------------------
// Global search (the magnifier in the top bar): Qbank titles + their questions, Database items and finished sessions.
// Choosing a result opens the page that holds it.
function GlobalSearch({ library, sessionLog, onGo, onClose, T }) {
  const { t, lang } = useI18n();
  const db = useContext(DbContext);
  const sp = useContext(ProfileContext);
  const profile = sp.profile;
  const phone = useViewport().w < 640;
  const [q, setQ] = useState("");
  const inputRef = useRef(null);
  useEffect(() => {
    if (inputRef.current) inputRef.current.focus();
    const esc = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", esc);
    return () => document.removeEventListener("keydown", esc);
  }, []); // eslint-disable-line
  const needle = q.trim().toLowerCase();
  const on = needle.length >= 2;
  const snip = (text) => {
    const str = String(text || "").replace(/\s+/g, " ").trim();
    const i = str.toLowerCase().indexOf(needle);
    if (i < 0) return str.slice(0, 90);
    const a = Math.max(0, i - 36);
    return (a > 0 ? "…" : "") + str.slice(a, i + needle.length + 56) + (i + needle.length + 56 < str.length ? "…" : "");
  };
  // ---- calendar: dates, times, events, exams, tasks, classes and syllabus weeks of the Study Profile ----
  const LOCS = ["en-US", "es"];
  const norm = (x) => String(x || "").toLowerCase().replace(/[,.]/g, "").replace(/\s+/g, " ").trim();
  const dateHay = (d) => (d ? [toISODate(d), ...LOCS.flatMap((l) => [
    d.toLocaleDateString(l, { weekday: "long", month: "long", day: "numeric", year: "numeric" }),
    d.toLocaleDateString(l, { month: "short", day: "numeric" }), d.toLocaleDateString(l, { month: "long", day: "numeric" }),
  ])].join(" ") : "");
  const timeHay = (tm) => {
    const m = /^(\d{1,2}):(\d{2})/.exec(tm || ""); if (!m) return tm || "";
    const h = +m[1]; const h12 = ((h + 11) % 12) + 1; const ap = h < 12 ? "am" : "pm";
    return `${tm} ${h12}:${m[2]} ${ap} ${h12}${ap} ${h12} ${ap}`;
  };
  const dayName = (n, l, w = "long") => new Date(2024, 0, 7 + n).toLocaleDateString(l, { weekday: w });
  const uiLoc = lang === "es" ? "es" : "en-US";
  const longDate = (d) => d.toLocaleDateString(uiLoc, { weekday: "long", month: "long", day: "numeric", year: "numeric" });
  const shortDate = (d) => d.toLocaleDateString(uiLoc, { month: "short", day: "numeric" });
  const jumpDate = useMemo(() => { // "2026-10-20", "Oct 20", "October 20 2026", "20 de octubre"
    const x = norm(q); let m;
    const monthOf = (w) => { if (!w || w.length < 3) return -1; for (let i = 0; i < 12; i++) if (LOCS.some((l) => new Date(2024, i, 1).toLocaleDateString(l, { month: "long" }).toLowerCase().startsWith(w))) return i; return -1; };
    const mk = (y, mo, d) => { const dt = new Date(y, mo, d); return dt.getMonth() === mo && dt.getDate() === d ? dt : null; };
    const yr = new Date().getFullYear();
    if ((m = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(x))) return mk(+m[1], +m[2] - 1, +m[3]);
    if ((m = /^([a-záéíóú]+) (\d{1,2})(?: (\d{4}))?$/.exec(x)) && monthOf(m[1]) >= 0) return mk(m[3] ? +m[3] : yr, monthOf(m[1]), +m[2]);
    if ((m = /^(\d{1,2}) (?:de )?([a-záéíóú]+)(?: (?:de )?(\d{4}))?$/.exec(x)) && monthOf(m[2]) >= 0) return mk(m[3] ? +m[3] : yr, monthOf(m[2]), +m[1]);
    return null;
  }, [q]); // eslint-disable-line
  const calIndex = useMemo(() => {
    if (!profile) return [];
    const out = []; const courseName = (id) => { const c = (profile.courses || []).find((k) => k.id === id); return c ? c.name : ""; };
    const today = startOfDay(new Date());
    (profile.assessments || []).forEach((a) => { const d = parseISODate(a.date); if (!d) return;
      out.push({ key: "a" + a.id + a.date, title: a.title, sub: [longDate(d), a.time, a.type, courseName(a.courseId)].filter(Boolean).join(" · "), date: toISODate(d), hay: [a.title, a.type, a.format, courseName(a.courseId), (a.coverage || []).join(" "), dateHay(d), timeHay(a.time)].join(" ") }); });
    ((profile.plan && profile.plan.tasks) || []).forEach((k) => { const d = parseISODate(k.due); if (!d) return;
      out.push({ key: "k" + k.id, title: k.title, sub: [longDate(d), k.subject, k.kind].filter(Boolean).join(" · "), date: toISODate(d), hay: [k.title, k.subject, k.kind, dateHay(d)].join(" ") }); });
    ((profile.calendar && profile.calendar.events) || []).forEach((e) => { const d = parseISODate(e.startDate); if (!d) return; const d2 = parseISODate(e.endDate);
      out.push({ key: "e" + e.id + e.startDate, title: e.title, sub: [d2 ? `${shortDate(d)} → ${shortDate(d2)}` : longDate(d), e.type, e.notes].filter(Boolean).join(" · "), date: toISODate(d), hay: [e.title, e.type, e.notes, dateHay(d), dateHay(d2)].join(" ") }); });
    const tm = profile.term || {};
    const te = profile.student && profile.student.targetExam;
    [[tm.startDate, t("calTermStart")], [tm.endDate, t("calTermEnd")], [te && te.date, (te && te.name) || t("calTargetExam")]].forEach(([iso, title], i) => {
      const d = parseISODate(iso); if (!d) return;
      out.push({ key: "t" + i, title: `${title}${i < 2 && tm.name ? ` · ${tm.name}` : ""}`, sub: longDate(d), date: toISODate(d), hay: [title, tm.name, dateHay(d)].join(" ") });
    });
    (profile.courses || []).forEach((c) => {
      (c.meetings || []).forEach((m, mi) => {
        const days = (m.days || []).filter((n) => typeof n === "number");
        let next = null; for (let i = 0; i < 14 && !next; i++) { const d = new Date(today); d.setDate(d.getDate() + i); if (days.includes(d.getDay())) next = d; }
        out.push({ key: "c" + c.id + mi, title: [c.code, c.name].filter(Boolean).join(" · "), sub: [days.map((n) => dayName(n, uiLoc, "short")).join(", "), [m.start, m.end].filter(Boolean).join("–"), m.location].filter(Boolean).join(" · "), date: next ? toISODate(next) : null,
          hay: [c.name, c.code, m.location, days.map((n) => LOCS.map((l) => dayName(n, l) + " " + dayName(n, l, "short")).join(" ")).join(" "), timeHay(m.start), timeHay(m.end)].join(" ") });
      });
      (c.weeks || []).forEach((w) => { const d = parseISODate(w.startDate); const topics = (w.topics || []).join(", ");
        if (!topics && !(w.readings || []).length) return;
        out.push({ key: "w" + c.id + w.week, title: `${c.name} · ${t("spWeekN", { n: w.week })}`, sub: [d ? shortDate(d) : "", topics].filter(Boolean).join(" · "), date: d ? toISODate(d) : null, hay: [c.name, c.code, `week ${w.week} semana ${w.week} wk ${w.week}`, topics, (w.readings || []).join(" "), (w.qbankFocus || []).join(" "), dateHay(d)].join(" ") }); });
    });
    return out.map((r) => ({ ...r, hay: norm(r.hay) }));
  }, [profile, lang]); // eslint-disable-line
  const res = useMemo(() => {
    if (!on) return { lib: [], db: [], hist: [], cal: [] };
    const lib = [];
    (library || []).forEach((e) => {
      const titleHit = String(e.title || "").toLowerCase().includes(needle);
      const hits = (e.questions || []).filter((x) => [x.vignette, x.stem, x.subject, x.explanation, ...(x.options || []).map((o) => o.text)].filter(Boolean).join(" ").toLowerCase().includes(needle));
      if (titleHit || hits.length) lib.push({ id: e.id, title: e.title, n: hits.length, sample: hits[0] ? snip(hits[0].stem || hits[0].vignette) : "" });
    });
    const dbHits = [];
    ((db && db.items) || []).forEach((n) => {
      const fields = dbItemFields(n);
      const hit = fields.find((f) => String(f).toLowerCase().includes(needle));
      if (!hit) return;
      const qq = n.question || {}; const src = n.source || {};
      dbHits.push({ id: n.id, kind: n.kind, title: snip(n.text || qq.stem || qq.vignette || n.comment || hit), match: hit === n.text || hit === qq.stem || hit === qq.vignette ? "" : snip(hit), src: [src.block, src.num ? `#${src.num}` : "", src.subject].filter(Boolean).join(" · ") });
    });
    const hist = (sessionLog || []).filter((h) => String(h.title || h.blockName || "").toLowerCase().includes(needle)).map((h) => ({ id: h.id, title: h.title || h.blockName }));
    const nn = norm(q);
    const cal = calIndex.filter((r) => r.hay.includes(nn)).sort((a, b) => String(a.date || "9999").localeCompare(String(b.date || "9999"))).slice(0, 10);
    return { lib: lib.slice(0, 8), db: dbHits.slice(0, 10), hist: hist.slice(0, 6), cal };
  }, [needle, library, sessionLog, db && db.items, calIndex]); // eslint-disable-line
  const total = res.lib.length + res.db.length + res.hist.length + res.cal.length + (jumpDate ? 1 : 0);
  const grp = { fontFamily: FONT_UI, fontWeight: 700, fontSize: fs(11), color: T.muted, textTransform: "uppercase", letterSpacing: "0.05em", margin: "14px 0 4px" };
  const row = { width: "100%", textAlign: "left", display: "block", background: "transparent", border: "none", borderBottom: `1px solid ${T.border}`, padding: "10px 4px", cursor: "pointer", fontFamily: FONT_UI, color: T.ink };
  const go = (tab, dateKey, query) => { onGo(tab, dateKey, query); onClose(); };
  return (
    <div role="dialog" aria-modal="true" aria-label={t("searchTitle")} onClick={onClose}
      style={{ position: "fixed", inset: 0, zIndex: 120, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: phone ? "flex-start" : "flex-start", justifyContent: "center", padding: phone ? 10 : "8vh 20px 20px" }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 640, maxHeight: phone ? "92vh" : "80vh", overflowY: "auto", background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 16, boxShadow: "0 12px 40px rgba(0,0,0,0.45)", boxSizing: "border-box" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ position: "relative", flex: 1, minWidth: 0 }}>
            <Search size={16} color={T.muted} style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)" }} />
            <input ref={inputRef} value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("searchPh")} aria-label={t("searchTitle")}
              style={{ width: "100%", boxSizing: "border-box", fontFamily: FONT_UI, fontSize: Math.max(16, fs(14)), color: T.ink, background: T.paper, border: `1px solid ${T.border}`, borderRadius: 8, padding: "10px 12px 10px 34px", outline: "none" }} />
          </div>
          <button onClick={onClose} aria-label={t("searchClose")} title={t("searchClose")} style={{ width: 40, height: 40, borderRadius: 8, border: `1px solid ${T.border}`, background: "transparent", color: T.ink, cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><X size={16} /></button>
        </div>
        {on && total === 0 && <p style={{ fontFamily: FONT_UI, fontSize: fs(13.5), color: T.muted, margin: "14px 2px 2px" }}>{t("searchNone", { q: q.trim() })}</p>}
        {(res.cal.length > 0 || jumpDate) && <div style={grp}>{t("searchGrpCal")}</div>}
        {jumpDate && (
          <button onClick={() => go("calendar", toISODate(jumpDate))} style={row}>
            <div style={{ fontWeight: 700, fontSize: fs(13.5), color: T.blue }}>{t("searchGoDate", { d: longDate(jumpDate) })}</div>
          </button>
        )}
        {res.cal.map((r) => (
          <button key={r.key} onClick={() => go("calendar", r.date)} style={row}>
            <div style={{ fontWeight: 700, fontSize: fs(13.5), overflowWrap: "anywhere" }}>{r.title}</div>
            {r.sub && <div style={{ fontSize: fs(12), color: T.muted, marginTop: 2, overflowWrap: "anywhere" }}>{r.sub}</div>}
          </button>
        ))}
        {res.lib.length > 0 && <div style={grp}>{t("searchGrpLib")}</div>}
        {res.lib.map((r) => (
          <button key={r.id} onClick={() => go("library")} style={row}>
            <div style={{ fontWeight: 700, fontSize: fs(13.5), overflowWrap: "anywhere" }}>{r.title}</div>
            {r.n > 0 && <div style={{ fontSize: fs(12), color: T.muted, marginTop: 2, overflowWrap: "anywhere" }}>{t("searchQsMatch", { n: r.n })}{r.sample ? ` · ${r.sample}` : ""}</div>}
          </button>
        ))}
        {res.db.length > 0 && <div style={grp}>{t("searchGrpDb")}</div>}
        {res.db.map((r) => (
          <button key={r.id} onClick={() => go("database", null, q.trim())} style={row}>
            <div style={{ fontFamily: FONT_UI, fontWeight: 700, fontSize: fs(10.5), color: (DB_KINDS[r.kind] ? T[DB_KINDS[r.kind].tone] : T.muted) || T.muted, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 2 }}>{DB_KINDS[r.kind] ? t(DB_KINDS[r.kind].label) : ""}</div>
            <div style={{ fontSize: fs(13), overflowWrap: "anywhere" }}>{r.title}</div>
            {(r.match || r.src) && <div style={{ fontSize: fs(12), color: T.muted, marginTop: 2, overflowWrap: "anywhere" }}>{[r.match, r.src].filter(Boolean).join(" · ")}</div>}
          </button>
        ))}
        {res.hist.length > 0 && <div style={grp}>{t("searchGrpHist")}</div>}
        {res.hist.map((r) => (
          <button key={r.id} onClick={() => go("analytics")} style={row}><div style={{ fontWeight: 600, fontSize: fs(13.5), overflowWrap: "anywhere" }}>{r.title}</div></button>
        ))}
      </div>
    </div>
  );
}

// Quick-start guide shown from the Home screen's "Help" button. Plain language, one idea per step, and the button /
// feature names match the on-screen labels in each language.
const GUIDE = {
  en: [
    { title: "Welcome to OWORLD", body: "OWORLD is a practice-exam simulator. You bring the questions, and it turns them into a realistic exam with answer tools, instant feedback and score tracking.",
      points: ["You don't need any technical skills.", "Your saved question blocks, ratings and progress are saved in this browser, and sync to your Google Drive when you sign in with Google."] },
    { title: "1. Get your questions", body: "A question bank (\"Qbank\") is simply a set of practice questions. You can ask an AI tool to write one for you.",
      points: ["On Home, open Qbank and expand Import Qbank below your Qbanks. NotebookLM Notebooks there opens your study notebooks by block.", "Open Question Recipe Prompt, choose a difficulty (Mixed is recommended) and copy the prompt.", "Paste it into your AI tool along with your topic or notes.", "Paste the AI's reply back into OWORLD (or upload the file) and tap Save to Library.", "Open it from your Library whenever you want to practice."] },
    { title: "2. Your Qbank Library", body: "The Library page holds your saved blocks, so you can jump straight back in.",
      points: ["Each card shows its status: Not attempted yet, In progress, or Completed with your score. Running a Qbank in full on its own marks its card Completed.", "Tick a block, choose how many of its questions to practice (5 to 40, Max, or any number you type), then tap Load. Tick two or more to merge them into one custom block, pick a difficulty and size, then tap Mix.", "Custom and mixed runs are saved under Analytics and never change your cards.", "Ticking a block shows a toolbar at the top right: Share / Export Selected, Edit Selected (rename) and Delete Selected. Anything you delete lands in the Trash for 30 days. Open it from the Settings menu (your profile picture, upper right), where you can restore it or delete it forever.", "A block you left half-finished shows Resume Session."] },
    { title: "3. Pick a mode", body: "Before you press Start block, choose how you want to practice. Tutor Mode is selected by default.",
      points: ["Tutor Mode: no timer, and you get feedback right after each answer.", "Timed Mode: a countdown like the real exam, with no feedback until the block ends. There is no Home button during a timed block, so plan to finish it.", "In Timed Mode you can switch the timer off during the block, but not back on."] },
    { title: "4. Answering questions", body: "Tap an answer choice. In Tutor Mode you see the result straight away.",
      points: ["Key Info highlights the important clues in the story. Tutor's Tip gives you a hint. If you open either before answering, the question is tagged Hint used.", "Got it wrong? Tap Show Correct Answer when you're ready, then tap any answer choice to open or close its explanation. Source References are tucked into a dropdown.", "After answering, rate how well you knew it: Again, Hard, Good or Easy. You can retest by rating later.", "Tools: Mark Question (flag it), the ab button to strike out a choice, Highlight for selected text, Notes, Lab Values and Calculator.", "On a computer, the question list on the left lets you jump anywhere. Use its arrow to collapse it."] },
    { title: "5. Results and retesting", body: "When you tap End Block you get your score, breakdowns by subject and difficulty, and a review of every question.",
      points: ["Retest Incorrects (Tutor Mode) practices only what you missed. Retest Full Block goes again. You can also retest only flagged questions, or ones you rated Again or Hard.", "Your first-attempt score is always kept as your baseline. Retests never overwrite it."] },
    { title: "6. Analytics", body: "Every block you finish is logged, so you can look back at your progress and reopen any run.",
      points: ["On Home, use the menu bar under the logo to go between Console, Library, Import, Analytics, Database and Calendar.", "Each entry shows its title (for example Mixed: 3 blocks · 50 Questions), the date completed and your score.", "Tap Review Exam to reopen the full question-by-question breakdown with lab values and explanations.", "Tick entries to reveal Delete Selected, or use Select all. Deleted logs go to the Trash for 30 days, and deleting a log never touches your Qbank cards.", "The 25 most recent sessions keep their full review. Older ones keep a score summary only."] },
    { title: "7. Pause, come back, and tidy up", body: "In Tutor Mode you can leave and pick up where you stopped.",
      points: ["Tap Home. Your answers and place in the block are saved automatically. Back on Home, tap Resume Session.", "In the exam lobby, Remove exam clears the loaded exam without touching your saved library.", "The profile menu (top right) holds your Google account, sync, language, theme, text size and the Trash.", "Optional: sign in with Google from the profile menu to keep your library, Analytics, Study Profile and any test in progress in step across your devices. Start a test on one device and Continue here on another; if the two versions differ, you choose which to keep.", "The Trash (profile menu) now holds deleted Qbanks, Analytics sessions and Database items for 30 days. Restore them, or delete them forever."] },
    { title: "8. Using your phone", body: "On a phone the screen is simplified so the question gets the room.",
      points: ["The question list is hidden. Use Previous and Next at the top right, and Home at the top left (Tutor Mode).", "Lab Values, Notes, Calculator and Settings are in one row under them.", "At the bottom, Lock is on the left and End Block is on the right. A timed block also shows its countdown in the middle."] },
    { title: "9. Your Study Profile and tutor", body: "Give OWORLD your syllabus once and your tutor follows along: it knows your week, your exams and what to study next.",
      points: ["Open the profile menu (your picture, upper right), tap Study Profile, tap Copy prompt, and give it to your AI tool together with your syllabus. Paste the JSON it returns and tap Load profile.", "The Console then shows Your tutor: this week's topics, your next exam, today's tasks and a few lines of guidance. Tap Start a block to pre-fill the Question Recipe for a topic.", "In the Library, Qbanks that match this week's topics are suggested at the top.", "Exam countdowns, new weeks and pace alerts arrive in the bell. Each one appears once.", "Your profile syncs through Google Drive like your Qbanks. Tap Update current profile any time to refresh it.", "The bell (top right) collects exam countdowns, new weeks, pace and deadline alerts, finished blocks and sync notices. Mark all read or Clear all from there."] },
    { title: "10. Console, your dashboard", body: "The Console is the first page you see. It shows where you are at a glance.",
      points: ["A greeting and study streak, with a one-tap Resume for the block you left half-finished.", "Stat tiles for sessions, questions answered, accuracy and day streak.", "Analytics highlights: a donut of correct, correct using hints and incorrect answers. Tap View all to open Analytics.", "Recent scores charts your last 10 sessions against the 70% line.", "Your tutor sits beside the semester calendar. Use the Analytics and Library tabs for past sessions and your saved Qbanks."] },
    { title: "11. Personal Database", body: "The Database page keeps the questions, excerpts and notes you save while studying, so you can revise them later.",
      points: ["During a block, select text and tap Add to database to save an excerpt. Use the bookmark to save a whole question, or Save to Database in the Notes panel to keep a note.", "Filter by All, Questions, Excerpts or Notes, or search your database. Show answer reveals a saved question's answer, and Add comment lets you write your own remarks on any item.", "Edit, Copy or Delete any item. Manage lets you select several to delete, and Clear all empties the database. Everything deleted goes to the Trash for 30 days.", "Export (or Share) saves your items as one file. Import adds them to another device or from a friend, and skips items you already have.", "Signed in with Google, your database syncs across devices like your library."] },
    { title: "12. Search everything", body: "The magnifier at the top of every page opens one search box for the whole app.",
      points: ["Type at least 2 letters. It looks through your Library, Calendar, Database and Analytics at once, with results grouped by section.", "Tap a result to jump straight to it. In the calendar it opens that day or item, and in the database it opens the matching entry.", "It also understands dates and times, so you can try Oct 20, Tuesday or 9:00."] },
    { title: "13. The Calendar", body: "The Calendar page puts your whole term on one screen: classes, exams, tasks, breaks and the days you studied.",
      points: ["Switch between Month, Week and Agenda. Tap a day to see its details, tick things off, or add a task.", "The chips above the calendar are Key dates, Classes, Exam, Calendar, Task due and Studied. Tap one to show only that layer and hide the others. Tap it again to bring everything back.", "To combine layers, hold Shift (or Ctrl / Cmd) and tap the chips you want to turn on or off.", "Classes, exam dates and times can be edited, and a wrong exam date can be fixed in place. Your tutor follows the correction even after you update your profile.", "Without a Study Profile the calendar has little to show. Tap Set up profile on it to build one (see step 9)."] },
  ],
  es: [
    { title: "Bienvenido a OWORLD", body: "OWORLD es un simulador de exámenes de práctica. Tú aportas las preguntas y él las convierte en un examen realista con herramientas, retroalimentación inmediata y seguimiento de puntaje.",
      points: ["No necesitas conocimientos técnicos.", "Tus bloques guardados, calificaciones y progreso se guardan en este navegador y se sincronizan con tu Google Drive cuando inicias sesión con Google."] },
    { title: "1. Consigue tus preguntas", body: "Un banco de preguntas (\"Qbank\") es simplemente un conjunto de preguntas de práctica. Puedes pedirle a una herramienta de IA que te escriba uno.",
      points: ["En Inicio, abre Qbank y despliega Importar Qbank debajo de tus Qbanks. Cuadernos de NotebookLM, ahí, abre tus cuadernos de estudio por bloque.", "Abre Prompt de receta de preguntas, elige una dificultad (se recomienda Mixta) y copia el prompt.", "Pégalo en tu herramienta de IA junto con tu tema o tus apuntes.", "Pega la respuesta de la IA en OWORLD (o sube el archivo) y toca Guardar en la biblioteca.", "Ábrelo desde tu biblioteca cuando quieras practicar."] },
    { title: "2. Tu biblioteca de preguntas", body: "La página Biblioteca guarda tus bloques, para que retomes de inmediato.",
      points: ["Cada tarjeta muestra su estado: Sin intentos aún, En curso o Completado con tu puntaje. Hacer un Qbank completo por sí solo marca su tarjeta como Completada.", "Marca un bloque, elige cuántas de sus preguntas practicar (de 5 a 40, Máx, o el número que escribas) y toca Cargar. Marca dos o más para combinarlos en un bloque personalizado, elige dificultad y tamaño, y toca Mezclar.", "Las sesiones personalizadas y mezcladas se guardan en Analíticas y nunca cambian tus tarjetas.", "Al marcar un bloque aparece una barra arriba a la derecha: Compartir / Exportar selección, Editar selección (renombrar) y Eliminar selección. Todo lo que elimines pasa a la Papelera durante 30 días. Ábrela desde el menú de Ajustes (tu foto de perfil, arriba a la derecha), donde puedes restaurarlo o eliminarlo para siempre.", "Un bloque que dejaste a medias muestra Reanudar sesión."] },
    { title: "3. Elige un modo", body: "Antes de pulsar Iniciar bloque, elige cómo quieres practicar. El modo tutor viene seleccionado por defecto.",
      points: ["Modo tutor: sin cronómetro y con retroalimentación justo después de cada respuesta.", "Modo cronometrado: cuenta regresiva como en el examen real, sin retroalimentación hasta terminar el bloque. No hay botón de Inicio durante un bloque cronometrado, así que planea terminarlo.", "En modo cronometrado puedes apagar el cronómetro durante el bloque, pero no volver a encenderlo."] },
    { title: "4. Responder preguntas", body: "Toca una opción de respuesta. En modo tutor ves el resultado al instante.",
      points: ["Datos clave resalta las pistas importantes del caso. Consejo del tutor te da una pista. Si abres cualquiera antes de responder, la pregunta queda marcada como Pista usada.", "¿Fallaste? Toca Mostrar respuesta correcta cuando quieras y luego toca cualquier opción para abrir o cerrar su explicación. Las fuentes están en un menú desplegable.", "Después de responder, califica qué tan bien lo sabías: Otra vez, Difícil, Bien o Fácil. Luego puedes repetir según tu calificación.", "Herramientas: Marcar pregunta, el botón ab para tachar una opción, Resaltar para el texto seleccionado, Notas, Valores de laboratorio y Calculadora.", "En computadora, la lista de preguntas a la izquierda te deja saltar a cualquiera. Usa su flecha para contraerla."] },
    { title: "5. Resultados y repetición", body: "Al tocar Terminar bloque ves tu puntaje, desgloses por materia y dificultad, y una revisión de cada pregunta.",
      points: ["Repetir falladas (modo tutor) practica solo lo que fallaste. Repetir bloque completo lo hace de nuevo. También puedes repetir solo las marcadas o las que calificaste Otra vez o Difícil.", "El puntaje de tu primer intento siempre se conserva como referencia. Las repeticiones nunca lo sobrescriben."] },
    { title: "6. Analíticas", body: "Cada bloque que terminas queda registrado, para que veas tu progreso y reabras cualquier intento.",
      points: ["En Inicio, usa la barra de menú bajo el logotipo para moverte entre Consola, Biblioteca, Importar, Analíticas, Base de datos y Calendario.", "Cada entrada muestra su título (por ejemplo Mezcla: 3 bloques · 50 preguntas), la fecha y tu puntaje.", "Toca Revisar examen para reabrir el desglose completo pregunta por pregunta, con valores de laboratorio y explicaciones.", "Marca entradas para mostrar Eliminar selección, o usa Seleccionar todo. Los registros eliminados pasan a la Papelera durante 30 días, y eliminar un registro nunca toca tus tarjetas de Qbank.", "Las 25 sesiones más recientes conservan su revisión completa. Las anteriores conservan solo un resumen del puntaje."] },
    { title: "7. Pausa, vuelve y ordena", body: "En modo tutor puedes salir y retomar donde lo dejaste.",
      points: ["Toca Inicio. Tus respuestas y tu posición en el bloque se guardan automáticamente. De vuelta en Inicio, toca Reanudar sesión.", "En la sala del examen, Quitar examen borra el examen cargado sin tocar tu biblioteca guardada.", "El menú de perfil (arriba a la derecha) reúne tu cuenta de Google, la sincronización, el idioma, el tema, el tamaño de texto y la Papelera.", "Opcional: inicia sesión con Google desde el menú de perfil para mantener tu biblioteca, tus Analíticas, tu Perfil de estudio y cualquier examen en curso al día entre dispositivos. Empieza un examen en un dispositivo y toca Continuar aquí en otro; si las dos versiones difieren, tú eliges cuál conservar.", "La Papelera (menú de perfil) guarda durante 30 días los Qbanks, sesiones de Analíticas y elementos de la Base de datos eliminados. Puedes restaurarlos o eliminarlos para siempre."] },
    { title: "8. Usar el teléfono", body: "En el teléfono la pantalla se simplifica para que la pregunta tenga espacio.",
      points: ["La lista de preguntas se oculta. Usa Anterior y Siguiente arriba a la derecha, e Inicio arriba a la izquierda (modo tutor).", "Valores de laboratorio, Notas, Calculadora y Ajustes están en una fila debajo.", "Abajo, Bloquear está a la izquierda y Terminar bloque a la derecha. Un bloque cronometrado también muestra su cuenta regresiva en el centro."] },
    { title: "9. Tu Perfil de estudio y tu tutor", body: "Dale tu programa a OWORLD una sola vez y tu tutor te acompaña: conoce tu semana, tus exámenes y qué estudiar después.",
      points: ["Abre el menú de perfil (tu foto, arriba a la derecha), toca Perfil de estudio, toca Copiar prompt y dáselo a tu herramienta de IA junto con tu programa. Pega el JSON que te devuelva y toca Cargar perfil.", "La Consola muestra entonces Tu tutor: los temas de la semana, tu próximo examen, las tareas de hoy y algunas líneas de guía. Toca Iniciar un bloque para rellenar la receta de preguntas de un tema.", "En la Biblioteca, los Qbanks que coinciden con los temas de esta semana se sugieren arriba.", "Las cuentas regresivas de exámenes, las semanas nuevas y las alertas de ritmo llegan a la campana. Cada una aparece una sola vez.", "Tu perfil se sincroniza con Google Drive como tus Qbanks. Toca Actualizar perfil actual cuando quieras refrescarlo.", "La campana (arriba a la derecha) reúne las cuentas regresivas de exámenes, las semanas nuevas, las alertas de ritmo y de fechas límite, los bloques terminados y los avisos de sincronización. Usa Marcar todo como leído o Borrar todo desde ahí."] },
    { title: "10. Consola, tu panel", body: "La Consola es la primera página que ves. Te muestra de un vistazo cómo vas.",
      points: ["Un saludo y tu racha de estudio, con Reanudar con un toque para el bloque que dejaste a medias.", "Tarjetas con Sesiones, Preguntas respondidas, Precisión y Racha de días.", "Resumen de analíticas: una dona con las respuestas correctas, correctas con pistas e incorrectas. Toca Ver todo para abrir Analíticas.", "Puntajes recientes grafica tus últimas 10 sesiones frente a la línea del 70%. Materias más fuertes y Por mejorar ordenan tus materias cuando has respondido al menos 5 preguntas en cada una.", "Debajo están Tu tutor, Sesiones recientes y un vistazo a tu biblioteca. Con un Perfil de estudio cargado, aparece a un lado un calendario pequeño."] },
    { title: "11. Base de datos personal", body: "La página Base de datos guarda las preguntas, extractos y notas que guardas mientras estudias, para repasarlos después.",
      points: ["Durante un bloque, selecciona texto y toca Añadir a la base de datos para guardar un extracto. Usa el marcador para guardar una pregunta completa, o Guardar en la base de datos en el panel de Notas para conservar una nota.", "Filtra por Todo, Preguntas, Extractos o Notas, o busca en tu base de datos. Mostrar respuesta revela la respuesta de una pregunta guardada, y Añadir comentario te deja escribir tus propias observaciones en cualquier elemento.", "Edita, copia o elimina cualquier elemento. Administrar te deja seleccionar varios para eliminarlos, y Borrar todo vacía la base de datos. Todo lo eliminado pasa a la Papelera durante 30 días.", "Exportar (o Compartir) guarda tus elementos en un solo archivo. Importar los añade en otro dispositivo o desde un amigo, y omite los que ya tienes.", "Con sesión de Google iniciada, tu base de datos se sincroniza entre dispositivos como tu biblioteca."] },
    { title: "12. Busca en todo", body: "La lupa en la parte superior de cada página abre un único cuadro de búsqueda para toda la app.",
      points: ["Escribe al menos 2 letras. Busca a la vez en tu Biblioteca, Calendario, Base de datos y Analíticas, con los resultados agrupados por sección.", "Toca un resultado para ir directo a él. En el calendario abre ese día o elemento, y en la base de datos abre la entrada correspondiente.", "También entiende fechas y horas, así que prueba Oct 20, martes o 9:00."] },
    { title: "13. El Calendario", body: "La página Calendario reúne todo tu periodo en una sola pantalla: clases, exámenes, tareas, descansos y los días que estudiaste.",
      points: ["Cambia entre Mes, Semana y Agenda. Toca un día para ver sus detalles, marcar cosas o agregar una tarea.", "Los botones sobre el calendario son Fechas clave, Clases, Examen, Calendario, Tarea y Estudio. Toca uno para mostrar solo esa capa y ocultar las demás. Tócalo otra vez para recuperar todo.", "Para combinar capas, mantén Shift (o Ctrl / Cmd) y toca los botones que quieras activar o desactivar.", "Las clases, y las fechas y horas de los exámenes, se pueden editar, y una fecha de examen equivocada se corrige ahí mismo. Tu tutor respeta la corrección aunque actualices tu perfil.", "Sin un Perfil de estudio el calendario tiene poco que mostrar. Toca Configurar perfil para crear uno (ver el paso 9)."] },
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
            <QuestionMarkIcon size={17} color={T.blue} /> {t("howItWorks")}
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

function ImportScreen({ onImport, onSaveToLibrary, library, sessionLog = [], drive, onDeleteSession, onClearSessions, onReviewSession, libTab, setLibTab, session, onResume, onOpenLobby, onLaunchLibrary, onMixLibrary, onDeleteLibraryEntry, onRenameLibraryEntry, T, darkMode, setDarkMode }) {
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
  const [importOpen, setImportOpen] = useState(false); // the Import card under the Library is collapsed by default
  const importRef = useRef(null);
  const [nbOpen, setNbOpen] = useState(false); // NotebookLM Notebooks: second chevron beside it, also collapsed by default
  const [pasteOpen, setPasteOpen] = useState(true); // the paste box can be collapsed; Load / Save stay available
  const [saveMsg, setSaveMsg] = useState(null); // { tone: "green" | "red" | "muted", text }
  const [review, setReview] = useState(null); // { result, action: "load" | "save" } — confirm when the tolerant loader left something out
  const [guideOpen, setGuideOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const stickyRef = useRef(null);
  useEffect(() => { // publish the sticky header's height so nested sticky bars (Study Hub sections) sit right below it
    const el = stickyRef.current; if (!el) return undefined;
    const root = document.documentElement;
    const set = () => root.style.setProperty("--oworld-sticky-h", `${Math.round(el.getBoundingClientRect().height)}px`);
    set();
    if (typeof ResizeObserver === "undefined") { window.addEventListener("resize", set); return () => { window.removeEventListener("resize", set); root.style.removeProperty("--oworld-sticky-h"); }; }
    const ro = new ResizeObserver(set); ro.observe(el);
    return () => { ro.disconnect(); root.style.removeProperty("--oworld-sticky-h"); };
  }, []);
  const [dbFocus, setDbFocus] = useState(null); // { q, n }: the Database page opens filtered by a Search result
  const [calFocus, setCalFocus] = useState(null); // { key, n }: a day picked in Search, shown on the Calendar page
  const vp = useViewport();
  const wideBar = vp.w >= 960; // large displays: the search button grows into a centered search bar
  const phone = vp.w < 640; // phones: the header buttons drop their labels so they all fit inline in one row
  useEffect(() => { // anything that used to open the Import tab now lands on the Library with the Import card expanded
    if (libTab !== "import") return;
    setLibTab("library"); setImportOpen(true);
    setTimeout(() => { if (importRef.current) importRef.current.scrollIntoView({ behavior: "smooth", block: "start" }); }, 80);
  }, [libTab]); // eslint-disable-line
  useEffect(() => { if (libTab !== "calendar") setCalFocus(null); if (libTab !== "database") setDbFocus(null); }, [libTab]);
  const goHomePage = () => { setLibTab("console"); window.scrollTo({ top: 0, behavior: "smooth" }); }; // the logo is the Home button
  const fileRef = useRef(null);
  const spCtx = useContext(ProfileContext);
  const tutorTopics = useMemo(() => { // the tutor's study suggestions, with readiness where the next exam has it
    if (!spCtx.profile) return [];
    const b = tutorBrief(spCtx.profile, sessionLog, new Date());
    const rows = (b.exams && b.exams[0] && b.exams[0].ready && b.exams[0].ready.rows) || [];
    return (b.studyFocus || []).map((topic) => { const r = rows.find((x) => topicMatch(x.topic, topic)); return { topic, pct: r && r.pct != null ? r.pct : null }; });
  }, [spCtx.profile, sessionLog, new Date().toDateString()]); // eslint-disable-line
  const focusList = recipeFocusValue.split(",").map((x) => x.trim()).filter(Boolean);
  const toggleTutorTopic = (topic) => {
    const has = focusList.some((x) => topicMatch(x, topic));
    const next = has ? focusList.filter((x) => !topicMatch(x, topic)) : [...focusList, topic];
    setRecipeFocusMode(next.length ? "systems" : recipeFocusMode); setRecipeFocusValue(next.join(", "));
  };
  useEffect(() => { // the tutor's "Start a <subject> block": pre-fill the Question Recipe
    if (!spCtx.pendingFocus) return;
    setRecipeFocusMode("systems"); setRecipeFocusValue(spCtx.pendingFocus); spCtx.consumeFocus();
  }, [spCtx.pendingFocus]); // eslint-disable-line
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
    <div style={{ maxWidth: Math.round(1120 * Math.max(1, TEXT_SCALE)), width: "100%", boxSizing: "border-box", margin: "0 auto", padding: "22px 20px 80px", position: "relative" }}>
      <style>{`@import url('${FONT_IMPORT_URL}');`}</style>

      {searchOpen && <GlobalSearch library={library} sessionLog={sessionLog} onGo={(tab, key, query) => { if (key) setCalFocus({ key, n: Date.now() }); if (query) setDbFocus({ q: query, n: Date.now() }); setLibTab(tab); window.scrollTo({ top: 0, behavior: "smooth" }); }} onClose={() => setSearchOpen(false)} T={T} />}
      {guideOpen && <HowItWorksGuide onClose={() => setGuideOpen(false)} T={T} />}
      {/* Sticky header: the top bar and the page tabs stay pinned while the page scrolls. */}
      <div ref={stickyRef} style={{ position: "sticky", top: 0, zIndex: 20, background: T.paper, margin: "-22px -20px 22px", padding: "14px 20px 0" }}>
      {/* Top bar: the OWORLD logo (the Home button) at the left, Search + notifications + the profile menu (which holds Help) at the right. */}
      <div style={wideBar
        ? { display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center", gap: 12, marginBottom: 12 } // 1fr | search | 1fr keeps the search bar exactly centered
        : { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 12 }}>
        <button onClick={goHomePage} aria-label={t("homeBtn")} title={t("homeBtn")} style={{
          display: "flex", alignItems: "center", gap: 10, background: "transparent", border: "none", padding: "4px 2px", cursor: "pointer", flexShrink: 0, ...(wideBar ? { justifySelf: "start" } : {}),
        }}>
          <Activity size={phone ? 24 : 30} color={T.blue} strokeWidth={2.5} />
          <span style={{ fontFamily: FONT_MONO, fontSize: fs(phone ? 22 : 30), letterSpacing: "0.1em", color: T.blue, fontWeight: 700 }}>OWORLD</span>
        </button>
        {wideBar && (
          <button onClick={() => setSearchOpen(true)} aria-label={t("searchTitle")} title={t("searchTitle")} style={{
            display: "flex", alignItems: "center", gap: 10, width: "clamp(300px, 34vw, 460px)", height: 40, padding: "0 16px", borderRadius: 999, cursor: "pointer",
            background: T.card, border: `1px solid ${T.border}`, color: T.muted, fontFamily: FONT_UI, fontSize: fs(14), textAlign: "left",
          }}>
            <Search size={17} color={T.muted} style={{ flexShrink: 0 }} />
            <span>{t("searchTitle")}</span>
          </button>
        )}
        <div style={{ display: "flex", alignItems: "center", gap: phone ? 8 : 10, ...(wideBar ? { justifySelf: "end" } : {}) }}>
          {!wideBar && <GhostButton T={T} icon={Search} onClick={() => setSearchOpen(true)} title={t("searchTitle")} style={{ padding: 0, width: 40, height: 40, borderRadius: "50%", flexShrink: 0 }} />}
          <NotificationBell T={T} />
          <SettingsMenu darkMode={darkMode} setDarkMode={setDarkMode} T={T} iconOnly={phone} onHelp={() => setGuideOpen(true)} />
        </div>
      </div>
      <PageNav tab={libTab} setTab={setLibTab} T={T} />
      </div>

      {/* Library top row: compact active-session widget (Resume lives here) with the Qhub placeholder to its right. */}
      {libTab === "library" && <LibraryTopRow session={session} resumeId={resumeId} library={library} onResume={onResume} onOpenLobby={onOpenLobby} T={T} />}

      {libTab === "database" && <DatabasePanel key={dbFocus ? dbFocus.n : "db"} initialQuery={dbFocus ? dbFocus.q : ""} T={T} />}
      {libTab === "calendar" && <CalendarPage focusDate={calFocus} sessionLog={sessionLog} onNavigate={(tab) => { setLibTab(tab); window.scrollTo({ top: 0, behavior: "smooth" }); }} T={T} />}
      {libTab === "analytics" && <SessionHistoryPanel history={sessionLog} qbankCount={library.length} qbankQuestions={libraryQuestionCount(library)} onDelete={onDeleteSession} onClear={onClearSessions} onReview={onReviewSession} T={T} />}
      {libTab === "console" && <ConsolePanel library={library} sessionLog={sessionLog} session={session} onResume={onResume} onOpenLobby={onOpenLobby} onReview={onReviewSession} onNavigate={(tab) => { setLibTab(tab); window.scrollTo({ top: 0, behavior: "smooth" }); }} T={T} />}
      {libTab === "studyhub" && <StudyHub library={library} sessionLog={sessionLog} onLaunch={onLaunchLibrary} onNavigate={(tab, key) => { if (key) setCalFocus({ key, n: Date.now() }); setLibTab(tab); if (tab !== "profile") window.scrollTo({ top: 0, behavior: "smooth" }); }} T={T} />}
      {libTab === "library" && <TutorLibraryStrip library={library} sessionLog={sessionLog} onLaunch={onLaunchLibrary} T={T} />}
      {libTab === "library" && <QbankLibraryPanel library={library} onLaunch={onLaunchLibrary} onMix={onMixLibrary} onDelete={onDeleteLibraryEntry} onRename={onRenameLibraryEntry} resumeId={resumeId} onResume={onResume} sessionLog={sessionLog} T={T} />}

      {/* Import Qbank page: its own page, no longer an accordion under the library. */}
      <div ref={importRef} style={{ marginBottom: 20 }}>
        {libTab === "library" && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, overflow: "hidden" }}>
            <button
              onClick={() => setImportOpen((v) => !v)}
              aria-expanded={importOpen}
              style={{
                width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, padding: "16px 24px",
                background: "transparent", border: "none", cursor: "pointer", fontFamily: FONT_UI, fontWeight: 600, fontSize: fs(14), color: T.ink, textAlign: "left",
              }}
            >
              <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}><Plus size={17} color={T.ink} /> {t("importPageTitle")}</span>
              {importOpen ? <ChevronUp size={17} color={T.muted} /> : <ChevronDown size={17} color={T.muted} />}
            </button>
            {importOpen && (
          <div style={{ padding: "0 24px 24px" }}>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, overflow: "hidden" }}>
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

            {tutorTopics.length > 0 && (
              <div style={{ marginBottom: 18 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: FONT_UI, fontWeight: 600, fontSize: fs(12), color: T.ink, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>
                  <GraduationCap size={15} color={T.blue} />{t("recipeTutor")}
                </div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {tutorTopics.map(({ topic, pct }) => {
                    const on = focusList.some((x) => topicMatch(x, topic));
                    const tone = pct == null ? T.muted : pct >= 75 ? T.green : pct >= 60 ? T.amber : T.red;
                    return (
                      <button key={topic} onClick={() => toggleTutorTopic(topic)} aria-pressed={on}
                        style={{ fontFamily: FONT_UI, fontSize: fs(12.5), fontWeight: 600, color: on ? T.blueDeep : T.ink, background: on ? T.blueLight : "transparent", border: `1.5px solid ${on ? T.blue : tone}`, borderRadius: 999, padding: "5px 12px", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6 }}>
                        <span aria-hidden="true" style={{ width: 8, height: 8, borderRadius: "50%", background: tone, flexShrink: 0 }} />
                        <span style={{ overflowWrap: "anywhere", textAlign: "left" }}>{topic}</span>
                        {pct != null && <span style={{ fontFamily: FONT_MONO, color: T.muted }}>{pct}%</span>}
                      </button>
                    );
                  })}
                </div>
                <div style={{ fontFamily: FONT_UI, fontSize: fs(11.5), color: T.muted, marginTop: 6 }}>{t("recipeTutorHint")}</div>
              </div>
            )}

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

        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "flex-start", marginTop: 12 }}>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, overflow: "hidden", flex: "1 1 300px", minWidth: 0 }}>
          <button
            onClick={() => setNbOpen((v) => !v)}
            aria-expanded={nbOpen}
            style={{
              width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, padding: "16px 24px",
              background: "transparent", border: "none", cursor: "pointer", fontFamily: FONT_UI, fontWeight: 600, fontSize: fs(14), color: T.ink, textAlign: "left",
            }}
          >
            <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}><BookOpen size={17} color={T.blue} /> {t("nbTitle")}</span>
            {nbOpen ? <ChevronUp size={17} color={T.muted} /> : <ChevronDown size={17} color={T.muted} />}
          </button>
          {nbOpen && (
            <div style={{ padding: "0 24px 24px" }}>
              <p style={{ fontFamily: FONT_UI, fontSize: fs(13), color: T.muted, lineHeight: 1.55, margin: "0 0 14px" }}>{t("nbHint")}</p>
              {(() => {
                const linkStyle = {
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "11px 12px", borderRadius: 8, textAlign: "center",
                  border: `1px solid ${T.border}`, color: T.ink, textDecoration: "none", fontFamily: FONT_UI, fontWeight: 600, fontSize: fs(13.5),
                };
                return (
                  <div style={{ display: "grid", gap: 14 }}>
                    <a href={NOTEBOOKS.all.url} target="_blank" rel="noopener noreferrer" title={`${NOTEBOOKS.all.name} - ${t("aiLaunchOpens")}`}
                      style={{ ...linkStyle, borderColor: T.blue, background: T.blueLight, color: T.blue }}>
                      {t("nbAll")} <ExternalLink size={14} color={T.blue} />
                    </a>
                    {NOTEBOOKS.groups.map((g) => (
                      <div key={g.key}>
                        <div style={{ fontFamily: FONT_UI, fontSize: fs(11.5), fontWeight: 700, letterSpacing: 0.6, textTransform: "uppercase", color: T.muted, marginBottom: 8 }}>{t(g.key)}</div>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 8 }}>
                          {g.items.map((nbk) => (
                            <a key={nbk.name} href={nbk.url} target="_blank" rel="noopener noreferrer" title={`${t(g.key)} ${nbk.name} - ${t("aiLaunchOpens")}`} style={linkStyle}>
                              {nbk.name} <ExternalLink size={14} color={T.blue} style={{ flexShrink: 0 }} />
                            </a>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          )}
        </div>
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
            {isBundle
              ? <PrimaryButton T={T} onClick={handleSubmit} icon={Plus} disabled={!text.trim()}>{t("importBundle")}</PrimaryButton>
              : <PrimaryButton T={T} onClick={handleSaveToLibrary} icon={Save} disabled={!text.trim()}>{t("saveToLibrary")}</PrimaryButton>}
          </div>
        </div>

          </div>
            )}
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
          <button onClick={onCancel} aria-label={t("homeBtn")} title={t("homeBtn")} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6, background: "transparent", border: "none", padding: 0, cursor: "pointer" }}>
            <Activity size={20} color={T.blue} strokeWidth={2.5} />
            <span style={{ fontFamily: FONT_MONO, fontSize: fs(12), letterSpacing: "0.12em", color: T.blue, fontWeight: 600 }}>OWORLD</span>
          </button>
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

// Tutor suggested sources: every reference the loaded questions cite, merged so a source that appears many times is listed once.
// Sources are matched by title (case / punctuation insensitive); their chapters and pages are merged the same way.
function collectTutorSources(questions) {
  const norm = (x) => String(x || "").toLowerCase().replace(/[^a-z0-9\u00c0-\u024f]+/g, " ").trim();
  const map = new Map();
  (questions || []).forEach((q, qi) => {
    (Array.isArray(q.sourceReferences) ? q.sourceReferences : []).forEach((r) => {
      const title = r && r.sourceTitle ? String(r.sourceTitle).trim() : "";
      const k = norm(title); if (!k) return;
      let src = map.get(k); if (!src) { src = { title, qs: new Set(), chapters: new Map() }; map.set(k, src); }
      src.qs.add(q.id != null ? q.id : qi);
      const ch = r.chapterSection ? String(r.chapterSection).trim() : "";
      const ck = norm(ch);
      let c = src.chapters.get(ck); if (!c) { c = { label: ch, pages: new Set() }; src.chapters.set(ck, c); }
      if (r.pageNumber) String(r.pageNumber).split(/\s*,\s*/).filter(Boolean).forEach((pg) => c.pages.add(pg));
    });
  });
  return [...map.values()]
    .map((src) => ({ title: src.title, count: src.qs.size, chapters: [...src.chapters.values()].filter((c) => c.label || c.pages.size).map((c) => ({ label: c.label, pages: [...c.pages] })) }))
    .sort((a, b) => b.count - a.count || a.title.localeCompare(b.title));
}

function TutorSourcesWindow({ sources, T, onClose }) {
  const { t } = useI18n();
  useEffect(() => {
    const esc = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", esc);
    return () => document.removeEventListener("keydown", esc);
  }, [onClose]);
  return (
    <div role="dialog" aria-modal="true" aria-label={t("tutorSrcTitle")} onClick={onClose}
      style={{ position: "fixed", inset: 0, zIndex: 320, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16, textAlign: "left" }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, width: "100%", maxWidth: 560, maxHeight: "86vh", display: "flex", flexDirection: "column", boxShadow: "0 12px 40px rgba(0,0,0,0.45)" }}>
        <div style={{ padding: "18px 20px 12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <BookOpen size={18} color={T.blue} />
            <h3 style={{ fontFamily: FONT_UI, fontWeight: 700, fontSize: fs(16), color: T.ink, margin: 0, flex: 1 }}>{t("tutorSrcTitle")}</h3>
            <span style={{ fontFamily: FONT_MONO, fontSize: fs(11.5), color: T.muted }}>{t("tutorSrcCount", { n: sources.length })}</span>
            <button onClick={onClose} aria-label={t("cancel")} title={t("cancel")} style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 32, height: 32, borderRadius: 6, background: "transparent", border: `1px solid ${T.border}`, color: T.ink, cursor: "pointer" }}><X size={15} /></button>
          </div>
          <p style={{ fontFamily: FONT_UI, fontSize: fs(12.5), color: T.muted, lineHeight: 1.5, margin: "8px 0 0" }}>{t("tutorSrcHint")}</p>
        </div>
        <div style={{ overflowY: "auto", padding: "4px 20px 12px", display: "grid", gap: 10 }}>
          {sources.map((src) => (
            <div key={src.title} style={{ border: `1px solid ${T.border}`, borderRadius: 8, padding: "10px 12px" }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
                <span style={{ fontFamily: FONT_UI, fontWeight: 600, fontSize: fs(13.5), color: T.ink, flex: 1, minWidth: 0, overflowWrap: "anywhere" }}>{src.title}</span>
                <span style={{ fontFamily: FONT_MONO, fontSize: fs(11.5), color: T.muted }}>{t("tutorSrcQ", { n: src.count })}</span>
              </div>
              {src.chapters.length > 0 && (
                <ul style={{ margin: "6px 0 0", paddingLeft: 18, display: "grid", gap: 3 }}>
                  {src.chapters.map((c, i) => (
                    <li key={i} style={{ fontFamily: FONT_UI, fontSize: fs(12.5), color: T.muted, lineHeight: 1.45, overflowWrap: "anywhere" }}>
                      {c.label}{c.pages.length > 0 && <span style={{ fontFamily: FONT_MONO, fontSize: fs(11.5) }}>{c.label ? " · " : ""}{t("page")} {c.pages.join(", ")}</span>}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
        <div style={{ padding: "12px 20px 18px", display: "flex", justifyContent: "flex-end", borderTop: `1px solid ${T.border}` }}>
          <PrimaryButton T={T} onClick={onClose}>{t("tutorSrcStart")}</PrimaryButton>
        </div>
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
        <button onClick={onHome} aria-label={t("homeBtn")} title={t("homeBtn")} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, margin: "0 auto", background: "transparent", border: "none", padding: 0, cursor: "pointer" }}>
          <Activity size={narrow ? 28 : 34} color={T.blue} strokeWidth={2.5} />
          <span style={{ fontFamily: FONT_MONO, fontSize: fs(narrow ? 34 : 44), letterSpacing: "0.1em", color: T.blue, fontWeight: 700 }}>
            OWORLD
          </span>
        </button>
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
    <div style={{ position: "fixed", inset: 0, overflowY: "auto", overflowX: "hidden", background: T.paper, textAlign: "left" }}>
      {children}
    </div>
  );
}

// In-exam Qbank import. Parses the pasted/uploaded JSON with the same tolerant loader as Home and saves it to the library only —
// the loaded exam, the active block, its timer and answers are never touched, so nothing has to be quit or restarted.
function QbankImportModal({ onSave, onClose, T }) {
  const { t } = useI18n();
  const [text, setText] = useState("");
  const [msg, setMsg] = useState(null); // { tone: "green" | "red" | "muted", text }
  const fileRef = useRef(null);
  const tone = (k) => (k === "green" ? T.green : k === "red" ? T.red : T.muted);

  function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => { setText(String(ev.target.result || "")); setMsg(null); };
    reader.readAsText(file);
    e.target.value = ""; // allow picking the same file again
  }

  function add() {
    const result = validateExamData(text, t);
    if (!result.valid) { setMsg({ tone: "red", text: result.error }); return; }
    const r = onSave(result.data);
    if (r.failed) { setMsg({ tone: "red", text: t("storageFull") }); return; }
    const skipped = result.warnings.filter((w) => w.level === "content").map((w) => w.text).join(" ");
    if (r.added === 0) { setMsg({ tone: "muted", text: t("libNothing") }); return; }
    setMsg({ tone: "green", text: [t("libSaved", { n: r.added }), r.dup ? t("libDup", { d: r.dup }) : "", skipped].filter(Boolean).join(" ") });
    setText("");
  }

  return (
    <div role="dialog" aria-modal="true" style={{ position: "fixed", inset: 0, zIndex: 96, background: "rgba(10,15,20,0.6)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ background: T.card, color: T.ink, border: `1px solid ${T.border}`, borderRadius: 10, padding: 22, width: "100%", maxWidth: 560, maxHeight: "90vh", overflowY: "auto", boxSizing: "border-box" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
          <h3 style={{ fontFamily: FONT_UI, fontSize: fs(17), fontWeight: 700, margin: 0 }}>{t("impMidTitle")}</h3>
          <button onClick={onClose} aria-label={t("impMidClose")} style={{ background: "transparent", border: "none", cursor: "pointer", color: T.muted, padding: 6 }}><X size={18} /></button>
        </div>
        <p style={{ fontFamily: FONT_UI, fontSize: fs(13), color: T.muted, lineHeight: 1.5, margin: "0 0 12px" }}>{t("impMidHint")}</p>
        <textarea
          value={text}
          onChange={(e) => { setText(e.target.value); setMsg(null); }}
          placeholder={t("impMidPlaceholder")}
          spellCheck={false}
          style={{ width: "100%", minHeight: 160, boxSizing: "border-box", resize: "vertical", fontFamily: FONT_MONO, fontSize: fs(12), border: `1px solid ${T.border}`, borderRadius: 6, padding: 10, background: T.paper, color: T.ink }}
        />
        {msg && <div role="status" style={{ fontFamily: FONT_UI, fontSize: fs(13), color: tone(msg.tone), margin: "10px 0 0", lineHeight: 1.5 }}>{msg.text}</div>}
        <input ref={fileRef} type="file" accept=".json,application/json,text/plain" onChange={handleFile} style={{ display: "none" }} />
        <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap", marginTop: 14 }}>
          <GhostButton T={T} icon={FileJson} onClick={() => fileRef.current?.click()}>{t("impMidFile")}</GhostButton>
          <div style={{ display: "flex", gap: 10 }}>
            <GhostButton T={T} onClick={onClose}>{t("impMidClose")}</GhostButton>
            <PrimaryButton T={T} icon={Upload} disabled={!text.trim()} onClick={add}>{t("impMidAdd")}</PrimaryButton>
          </div>
        </div>
      </div>
    </div>
  );
}

function ExamScreen({ block, blockState, setBlockState, onSubmitBlock, onRate, onHome, onImportQbank, darkMode, setDarkMode }) {
  // Resume on the question the student was last viewing (clamped in case the stored value is stale).
  const [qIdx, setQIdx] = useState(() => {
    const n = Math.floor(Number(blockState.currentQuestionIndex) || 0);
    return Math.min(Math.max(0, n), block.questions.length - 1);
  });
  const [confirmSubmit, setConfirmSubmit] = useState(false);
  const [confirmTimerOff, setConfirmTimerOff] = useState(false);
  const [timeUp, setTimeUp] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [srcOpen, setSrcOpen] = useState(false); // Tutor suggested sources window (Tutor sessions)
  const tutorSources = useMemo(() => (blockState.tutor ? collectTutorSources(block.questions) : []), [block, blockState.tutor]);
  const [importOpen, setImportOpen] = useState(false); // in-exam "Import Qbank" dialog (saves to the library, session untouched)
  // The question list can fold into a slim rail to give the question more room; the choice is remembered.
  const [navCollapsed, setNavCollapsed] = useState(() => lsGet("navCollapsed") === true);
  const toggleNav = () => setNavCollapsed((v) => { lsSet("navCollapsed", JSON.stringify(!v)); return !v; });
  const [labOpen, setLabOpen] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);
  const [calcOpen, setCalcOpen] = useState(false);
  const [locked, setLocked] = useState(false);
  const [hintsEnabled, setHintsEnabled] = useState(true);
  const [showHint, setShowHint] = useState(false);
  const [explHidden, setExplHidden] = useState({}); // qId -> true when the correct-answer explanation is collapsed
  const [toggledDistractors, setToggledDistractors] = useState([]); // option keys flipped from their default (own wrong pick: open, others: closed)
  const [labSearch, setLabSearch] = useState("");
  const [labTab, setLabTab] = useState("Serum");
  const [siUnits, setSiUnits] = useState(false);

  const { highlightsMap, pending, handleSelectionInContainer, commitPending, handleGlobalKeyDown, removeHighlight, clearPending, hlColor, setHlColor } = useHighlighter(blockState.highlights);
  const db = useContext(DbContext);
  const [dbFlash, setDbFlash] = useState(false); // the highlight popup briefly confirms "Saved to Database"

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
  // "Show / hide all explanations": enabled once the correct answer is showing. It drives the correct answer's explanation and
  // every wrong choice's analysis together (an own wrong pick opens by default, the others closed — see analysisOpen below).
  const distractorKeys = q.options.filter((o) => o.key !== q.correctAnswer && q.distractorAnalysis?.[o.key]).map((o) => o.key);
  const allExplShown = showAnswer && !explHidden[q.id] && distractorKeys.every((k) => (qState.selected === k) !== toggledDistractors.includes(k));
  function toggleAllExplanations() {
    if (!showAnswer) return;
    const open = !allExplShown;
    setExplHidden((cur) => ({ ...cur, [q.id]: !open }));
    setToggledDistractors(distractorKeys.filter((k) => (qState.selected === k) !== open));
  }
  const retestPill = block.isRetest ? (
    <div style={{
      display: "flex", alignItems: "center", gap: 6, background: T.amberLight, color: T.amber,
      border: `1px solid ${T.amber}`, borderRadius: 999, padding: "5px 12px",
      fontFamily: FONT_UI, fontSize: fs(12), fontWeight: 700,
    }}>
      <RotateCcw size={13} />
      {t("retestMode", { type: t(RETEST_TITLE[block.retestType] || "rt.full"), n: block.retestCount, items: t(block.retestCount === 1 ? "item1" : "itemN") })}
    </div>
  ) : null;
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
      if (locked || confirmSubmit || confirmTimerOff || timeUp || importOpen) return;

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
  }, [q, qState, locked, confirmSubmit, confirmTimerOff, timeUp, tutorMode, importOpen]);

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
      // wasIncorrect is sticky like hintUsed: a wrong pick stays on record even after Reset Question and a later correct answer.
      updateQState({ selected: key, checked: true, ...(key !== q.correctAnswer ? { wasIncorrect: true } : {}) });
      return;
    }
    updateQState({ selected: qState.selected === key ? null : key, checked: false });
  }
  // Tutor mode: wipe this question's answer, strikeouts and feedback so it can be retried. The flag is kept.
  // hintUsed and wasIncorrect are deliberately sticky: a hint seen, or a wrong pick made, before a reset still counts afterwards.
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

  // --- Database: excerpts (from the highlight popup), the whole question (bookmark) and this question's note ---
  const dbSource = (field) => ({ block: blockLabel(block, t), num: qIdx + 1, subject: q.subject || "", field: field || "" });
  const qDbKey = `q:${q.id}`;
  const noteDbKey = `n:${q.id}`;
  const questionSaved = db.items.some((n) => n.key === qDbKey);
  const noteSaved = db.items.some((n) => n.key === noteDbKey);
  function toggleSaveQuestion() {
    if (questionSaved) { db.removeByKey(qDbKey); return; }
    db.add({ key: qDbKey, kind: "question", text: q.stem || "", source: dbSource(""), question: snapshotQuestion(q) });
  }
  function saveNoteToDb() {
    const text = (noteText || "").trim();
    if (!text) return;
    db.add({ key: noteDbKey, kind: "note", text, source: dbSource(""), question: snapshotQuestion(q) });
  }
  function addPendingToDb() {
    if (!pending || dbFlash) return;
    const text = pending.range.toString().replace(/\s+/g, " ").trim();
    if (!text) { clearPending(); return; }
    db.add({ key: `e:${q.id}:${pending.field}:${text.slice(0, 80)}`, kind: "excerpt", text, source: dbSource(pending.field), question: snapshotQuestion(q) });
    window.getSelection()?.removeAllRanges();
    setDbFlash(true);
    setTimeout(() => { setDbFlash(false); clearPending(); }, 900);
  }
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
          {blockState.tutor && tutorSources.length > 0 && (
            <button onClick={() => setSrcOpen(true)} style={toolBtnStyle(srcOpen)} title={t("tutorSrcTitle")} aria-label={t("tutorSrcTitle")}>
              <Lightbulb size={22} />
              {!narrow && t("tutorSrcBtn")}
            </button>
          )}
          {srcOpen && <TutorSourcesWindow sources={tutorSources} T={T} onClose={() => setSrcOpen(false)} />}
        </div>

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
                {onImportQbank && (
                  <div style={{ marginBottom: 12 }}>
                    <GhostButton T={T} icon={Upload} onClick={() => { setSettingsOpen(false); setImportOpen(true); }} style={{ width: "100%", minHeight: narrow ? 44 : undefined }}>
                      {t("importQbank")}
                    </GhostButton>
                  </div>
                )}
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
                  {tutorMode && st?.wasIncorrect && (
                    <span title={t("wasIncorrectBadge")} aria-label={t("wasIncorrectBadge")} style={{ width: 9, height: 9, borderRadius: 999, background: T.red, flexShrink: 0 }} />
                  )}
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
            <button
              onClick={toggleSaveQuestion} aria-pressed={questionSaved} title={questionSaved ? t("dbSavedQ") : t("dbSaveQ")}
              style={{
                display: "inline-flex", alignItems: "center", gap: 6, background: "transparent", border: "none", padding: 0, cursor: "pointer",
                fontFamily: FONT_UI, fontWeight: 600, fontSize: fs(14), color: questionSaved ? T.blue : T.ink,
              }}
            >
              <Bookmark size={16} color={T.blue} fill={questionSaved ? T.blue : "none"} />
              {questionSaved ? t("dbSavedQ") : t("dbSaveQ")}
            </button>

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

          <p style={{ fontFamily: FONT_UI, fontSize: fs(11.5), color: T.muted, margin: "0 0 14px", display: "flex", alignItems: "center", flexWrap: "wrap", gap: "4px 8px" }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><Highlighter size={12} /> {t("hlTip")}</span>
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

          {tutorMode && (qState.hintUsed || qState.wasIncorrect) && (
            <div style={{ marginBottom: 10, display: "flex", gap: 6, flexWrap: "wrap" }}>
              {qState.hintUsed && <Pill T={T} tone="amber">{t("hintUsedBadge")}</Pill>}
              {qState.wasIncorrect && <Pill T={T} tone="red">{t("wasIncorrectBadge")}</Pill>}
            </div>
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
              const hinted = tutorMode && !!qState.hintUsed; // a hint was used: the correct answer is shown in yellow instead of green
              const showWrong = revealed && isSelected && !isCorrectOpt;
              // Once the correct answer is showing, the remaining wrong choices get a subtle red X (no red fill, unlike a wrong pick).
              const showOtherWrong = showAnswer && !isCorrectOpt && !showWrong;
              // Distractor dropdown: on the student's own wrong pick right away, on every wrong choice once the answer is shown
              // (offering it only on wrong choices before that would reveal the correct one by omission).
              const hasAnalysis = revealed && !isCorrectOpt && !!q.distractorAnalysis?.[opt.key] && (showAnswer || isSelected);
              const analysisOpen = hasAnalysis && (isSelected !== toggledDistractors.includes(opt.key)); // own wrong pick auto-opens
              // Once revealed, the choice itself is the toggle: tap it to show / hide its explanation (no separate buttons).
              const canToggle = hasAnalysis || showCorrect;
              const expanded = showCorrect ? !explHidden[q.id] : analysisOpen;
              const toggleExpl = () => { if (showCorrect) setExplHidden((cur) => ({ ...cur, [q.id]: !cur[q.id] })); else toggleDistractor(opt.key); };
              return (
                <div
                  key={opt.key}
                  style={{ borderBottom: i < q.options.length - 1 ? `1px solid ${T.border}` : "none" }}
                >
                  <div
                    onClick={() => {
                      const sel = window.getSelection();
                      if (sel && sel.toString().trim().length > 0) return; // user was selecting text, not choosing an answer
                      if (revealed) { if (canToggle) toggleExpl(); return; }
                      selectOption(opt.key);
                    }}
                    {...(canToggle ? {
                      role: "button", tabIndex: 0, "aria-expanded": expanded,
                      title: showCorrect ? t(expanded ? "explHide" : "explShow") : t("distractorBtn"),
                      onKeyDown: (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggleExpl(); } },
                    } : {})}
                    style={{
                      display: "flex", alignItems: "center", gap: 10, cursor: revealed && !canToggle ? "default" : "pointer",
                      background: showCorrect ? (hinted ? HINT_YELLOW_STRONG : T.greenStrong) : showWrong ? T.redStrong : isSelected ? T.blueLight : "transparent",
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
                    {showCorrect && <CheckCircle2 size={18} color={hinted ? T.amber : T.green} style={{ flexShrink: 0 }} />}
                    {showWrong && <XCircle size={18} color={T.red} style={{ flexShrink: 0 }} />}
                    {showOtherWrong && <XCircle size={18} color={T.red} style={{ flexShrink: 0, opacity: 0.45 }} aria-hidden="true" />}
                    {canToggle && (expanded ? <ChevronUp size={16} color={T.muted} style={{ flexShrink: 0 }} aria-hidden="true" /> : <ChevronDown size={16} color={T.muted} style={{ flexShrink: 0 }} aria-hidden="true" />)}
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
                  {analysisOpen && (
                    <div style={{ padding: showWrong ? "10px 14px 12px 42px" : "2px 14px 12px 42px", background: showWrong ? T.redSoft : "transparent" }}>
                      <div style={{ fontFamily: FONT_UI, fontSize: fs(13), color: showWrong ? T.ink : T.muted, lineHeight: 1.55 }}>
                        {q.distractorAnalysis[opt.key]}
                      </div>
                    </div>
                  )}
                  {showCorrect && !explHidden[q.id] && (
                    <div style={{ background: hinted ? HINT_YELLOW_SOFT : T.greenSoft, padding: "12px 14px 14px 42px" }}>
                      <ExplanationPanels q={q} T={T} showTip={false} showClues={false} flat rating={q.meta?.rating ?? null} onRate={tutorMode && onRate ? (k) => onRate(q, k) : null} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Tutor mode: a wrong pick does not disclose the answer until asked for */}
          {tutorMode && (showAnswer || (revealed && !isCorrectPick) || qState.selected || qState.struck.length > 0 || retestPill) && (
            <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", maxWidth: 640 }}>
              {revealed && !isCorrectPick && !showAnswer && (
                <GhostButton T={T} onClick={() => updateQState({ answerRevealed: true })}>{t("showCorrectBtn")}</GhostButton>
              )}
              {showAnswer && (qState.selected || qState.struck.length > 0) && (
                <GhostButton T={T} icon={allExplShown ? ChevronUp : ChevronDown} onClick={toggleAllExplanations}>
                  {allExplShown ? t("explHideAll") : t("explShowAll")}
                </GhostButton>
              )}
              {(qState.selected || qState.struck.length > 0) && (
                <GhostButton T={T} icon={RotateCcw} onClick={resetQuestion} style={{ marginLeft: "auto" }}>{t("resetQ")}</GhostButton>
              )}
              {retestPill && <div style={{ marginLeft: (qState.selected || qState.struck.length > 0) ? 0 : "auto" }}>{retestPill}</div>}
            </div>
          )}

          <div style={{ marginTop: 22, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", maxWidth: 640 }}>
            <PrimaryButton T={T} onClick={goNext} style={{ background: T.blue }}>
              {qIdx < questions.length - 1 ? t("proceedNext") : t("proceedSummary")}
            </PrimaryButton>
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
          <GhostButton T={T} icon={Database} disabled={!noteText.trim()} onClick={saveNoteToDb} style={{ width: "100%", marginTop: 10 }}>
            {noteSaved ? t("dbUpdateNote") : t("dbSaveNote")}
          </GhostButton>
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
        <div
          ref={highlightBtnRef}
          role="toolbar"
          aria-label={t("highlight")}
          style={{
            position: "fixed", left: Math.min(Math.max(pending.x, 100), Math.max(100, vp.w - 100)), top: Math.max(8, pending.y - 46), transform: "translateX(-50%)",
            zIndex: 80, display: "flex", alignItems: "center", gap: 10, background: T.ink, color: T.paper,
            borderRadius: 999, padding: "7px 14px", boxShadow: "0 4px 14px rgba(0,0,0,0.35)",
          }}
        >
          {dbFlash ? (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontFamily: FONT_UI, fontWeight: 600, fontSize: fs(13), padding: "2px 4px" }}>
              <Check size={15} /> {t("dbSavedToast")}
            </span>
          ) : (
            <>
              <HighlightSwatches value={hlColor} onPick={commitPending} T={T} t={t} size={narrow ? 26 : 20} ring={T.paper} />
              <span aria-hidden="true" style={{ width: 1, alignSelf: "stretch", background: "currentColor", opacity: 0.3 }} />
              <button
                type="button" onMouseDown={(e) => e.preventDefault()} onClick={addPendingToDb} title={t("dbAdd")} aria-label={t("dbAdd")}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 6, background: "transparent", border: "none", padding: narrow ? "4px 2px" : 0, cursor: "pointer",
                  color: "inherit", fontFamily: FONT_UI, fontWeight: 600, fontSize: fs(12.5), whiteSpace: "nowrap",
                }}
              >
                <span style={{ position: "relative", display: "inline-flex" }}>
                  <Database size={narrow ? 18 : 15} />
                  <Check size={narrow ? 11 : 9} strokeWidth={4} color={T.green} style={{ position: "absolute", right: narrow ? -5 : -4, bottom: narrow ? -4 : -3 }} />
                </span>
              </button>
            </>
          )}
        </div>
      )}

      {importOpen && <QbankImportModal onSave={onImportQbank} onClose={() => setImportOpen(false)} T={T} />}

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
  const missedBeforeCount = block.questions.filter((q) => blockState.answers[q.id]?.wasIncorrect).length;

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
        {missedBeforeCount > 0 && <Pill T={T} tone="red">{t("missedBeforeN", { n: missedBeforeCount })}</Pill>}
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
                {a?.wasIncorrect && <Pill T={T} tone="red">{t("wasIncorrectBadge")}</Pill>}
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
                          background: isCorrectOpt ? (a?.hintUsed ? HINT_YELLOW_SOFT : T.greenLight) : isYourPick ? T.redLight : "transparent",
                          fontFamily: FONT_UI, fontSize: fs(13.5), color: T.ink,
                        }}>
                          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                            <span style={{ fontFamily: FONT_MONO, fontWeight: 700, fontSize: fs(12), width: 18 }}>{opt.key}</span>
                            <span style={{ flex: 1 }}>{opt.text}</span>
                            {isCorrectOpt && <Pill T={T} tone={a?.hintUsed ? "amber" : "green"}>{t("correct")}</Pill>}
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
  const [libTab, setLibTabRaw] = useState("console");
  // Tutor dashboard + Study Profile are one page, the Study Hub: "tutor" opens it, "profile" opens it and scrolls to the profile section.
  const setLibTab = (tab) => { if (tab === "profile") { setLibTabRaw("studyhub"); setTimeout(() => window.dispatchEvent(new Event("oworld-profile-jump")), 220); } else setLibTabRaw(tab === "tutor" ? "studyhub" : tab); }; // Home page: console | library | import | analytics (lives here so Review Exam → Home lands back on Analytics)
  const [srcWin, setSrcWin] = useState(null); // Tutor suggested sources window: { sources } | null
  const [tombs, setTombs] = useState(loadTombs); // deletions, so a delete on one device isn't undone by another device's copy
  const [sessionLog, setSessionLog] = useState(boot.sessionLog); // independent log of every finished session, newest first
  const [trash, setTrash] = useState(loadTrash); // recently deleted Qbanks, Analytics sessions and Database items (restorable for TRASH_TTL)
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
  useEffect(() => { persist(LS_TOMBS, (Object.keys(tombs.qbanks).length || Object.keys(tombs.sessions).length) ? JSON.stringify(tombs) : null); }, [tombs]);
  useEffect(() => { persist(LS_HISTORY, sessionLog.length ? JSON.stringify(sessionLog) : null); }, [sessionLog]);
  // Declared after the library / history effects on purpose: a delete frees that space first, then the Trash copy is written.
  // If storage is still full, the oldest Trash entries make room (the newest deletion is the one most likely to be restored).
  useEffect(() => {
    if (!trash.length) { persist(LS_TRASH, null); return; }
    let list = trash;
    let ok = lsSet(LS_TRASH, JSON.stringify(list));
    while (!ok && list.length > 1) {
      list = list.slice(0, Math.max(1, list.length - Math.ceil(list.length * 0.1)));
      ok = lsSet(LS_TRASH, JSON.stringify(list));
    }
    failedKeys.current[LS_TRASH] = !ok;
    setStorageError(Object.values(failedKeys.current).some(Boolean));
    if (list.length < trash.length) { setTrash(list); setFlash(tr("trashTrimmed")); }
  }, [trash]); // eslint-disable-line
  // Entries older than TRASH_TTL are removed for good (on load, and on page changes; the Trash window also hides expired ones).
  useEffect(() => {
    const cut = Date.now() - TRASH_TTL;
    setTrash((cur) => { const keep = cur.filter((e) => e.deletedAt > cut); return keep.length === cur.length ? cur : keep; });
  }, [libTab]);
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
    // only logged under Analytics and the source cards are left exactly as they were.
    if (entries.length === 1 && size == null && difficulty === "all") block.libraryId = entries[0].id;
    setExamData({ blocks: [block] });
    setBlockStates([{ ...makeInitialBlockState(block), timed: mode !== "tutor", tutor: mode === "tutor", status: "in-progress", startedAt: Date.now() }]);
    setHistory([]);
    setActiveBlockIdx(0);
    setView("exam");
    if (mode === "tutor") { const list = collectTutorSources(block.questions); setSrcWin(list.length ? { sources: list } : null); } else setSrcWin(null);
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
      updatedAt: ratedAt,
      questions: e.questions.map((qq) => (qq.id === origId ? { ...qq, meta: { ...(qq.meta || {}), rating: key, ratedAt } } : qq)),
    })));
  }

  const addTombs = (kind, ids) => setTombs((t0) => ({ ...t0, [kind]: { ...t0[kind], ...Object.fromEntries(ids.map((i) => [i, Date.now()])) } }));
  // --- Trash ------------------------------------------------------------------
  // Deleting anything from the Library, Analytics or Database moves it here first. The tombstone is still written at once, so
  // Drive sync behaves exactly as before; restoring stamps the entry with restoredAt so that tombstone no longer applies to it.
  // items: [{ kind: "qbank" | "session" | "dbitem", data, review? }]
  function trashPush(items) {
    if (!items.length) return;
    const now = Date.now();
    const fresh = items.map((it, i) => ({ tid: `tr_${now.toString(36)}${i}${Math.random().toString(36).slice(2, 6)}`, kind: it.kind, deletedAt: now, data: it.data, ...(it.review ? { review: it.review } : {}) }));
    setTrash((cur) => [...fresh, ...cur.filter((e) => !fresh.some((f) => f.kind === e.kind && f.data.id === e.data.id))]);
    setFlash(tr("trashMoved"));
  }
  const trashDbItems = (list) => trashPush(list.map((n) => ({ kind: "dbitem", data: n })));
  const sessionTrashItem = (e) => ({ kind: "session", data: e, review: lsGet(LS_REVIEW + e.id) || undefined });

  function restoreTrash(tids) {
    const picked = trash.filter((e) => tids.includes(e.tid));
    if (!picked.length) return;
    let restored = 0, skipped = 0;
    const done = new Set();

    const qb = picked.filter((e) => e.kind === "qbank");
    if (qb.length) {
      const haveId = new Set(library.map((e) => e.id));
      const haveSig = new Set(library.map((e) => blockSignature(e.title, e.questions)));
      const add = [];
      qb.forEach((e) => {
        done.add(e.tid);
        const sig = blockSignature(e.data.title, e.data.questions);
        if (haveId.has(e.data.id) || haveSig.has(sig)) { skipped++; return; } // the same Qbank is already back in the library: never store it twice
        const at = Math.max(Date.now(), (((tombs.qbanks || {})[e.data.id]) || 0) + 1);
        add.push({ ...e.data, updatedAt: at, restoredAt: at });
        haveSig.add(sig); restored++;
      });
      if (add.length) setLibrary((lib) => [...lib, ...add].sort((x, y) => (x.importDate || 0) - (y.importDate || 0) || (x.id < y.id ? -1 : 1)));
    }

    const se = picked.filter((e) => e.kind === "session");
    if (se.length) {
      const have = new Set(sessionLog.map((e) => e.id));
      const add = [];
      se.forEach((e) => {
        done.add(e.tid);
        if (have.has(e.data.id)) { skipped++; return; }
        const at = Math.max(Date.now(), (((tombs.sessions || {})[e.data.id]) || 0) + 1);
        add.push({ ...e.data, restoredAt: at });
        if (e.review) lsSet(LS_REVIEW + e.data.id, JSON.stringify(e.review)); // brings "Review Exam" back too
        restored++;
      });
      if (add.length) setSessionLog((log) => [...log, ...add].sort((a, b) => b.finishedAt - a.finishedAt || (a.id < b.id ? -1 : 1)).slice(0, HISTORY_MAX));
    }

    const dbi = picked.filter((e) => e.kind === "dbitem");
    if (dbi.length) {
      const r = database.restoreItems(dbi.map((e) => e.data));
      dbi.forEach((e) => done.add(e.tid));
      restored += r.restored; skipped += r.skipped;
    }

    setTrash((cur) => cur.filter((e) => !done.has(e.tid)));
    setFlash([restored ? tr("trashRestored").replace("{n}", restored) : "", skipped ? tr("trashRestoredDup").replace("{s}", skipped) : ""].filter(Boolean).join(" "));
  }
  function purgeTrash(tids) { const gone = new Set(tids); setTrash((cur) => cur.filter((e) => !gone.has(e.tid))); }

  function deleteSessionLog(id) {
    const e = sessionLog.find((x) => x.id === id);
    if (e) trashPush([sessionTrashItem(e)]);
    lsRemove(LS_REVIEW + id); addTombs("sessions", [id]); setSessionLog((log) => log.filter((x) => x.id !== id));
  }
  function clearSessionLog() { trashPush(sessionLog.map(sessionTrashItem)); addTombs("sessions", sessionLog.map((e) => e.id)); removeAllReviewSnapshots(); setSessionLog([]); }

  // Fold what Google Drive had into local state. Pure unions + explicit deletes only, so nothing local is ever lost.
  function applyCloudMerge(m) {
    setTombs((cur) => { const u = unionTombs(cur, m.deleted); return JSON.stringify(u) === JSON.stringify(cur) ? cur : u; });
    setLibrary((cur) => { const next = mergeQbanks(cur, m.qbanks, m.deleted); return sameList(cur, next) ? cur : next; });
    setSessionLog((cur) => { const next = mergeSessions(cur, m.examSessions, m.deleted); return sameList(cur, next) ? cur : next; });
    const top = new Set(m.examSessions.slice(0, REVIEW_MAX).map((e) => e.id));
    Object.entries(m.reviews || {}).forEach(([id, snap]) => { if (top.has(id) && !hasReviewSnapshot(id)) lsSet(LS_REVIEW + id, JSON.stringify(snap)); });
    Object.keys(m.deleted.sessions || {}).forEach((id) => { if (hasReviewSnapshot(id)) lsRemove(LS_REVIEW + id); });
  }
  // --- Cross-device active-session sync -------------------------------------------
  // recRef is this device's marker for the synced session ({ sessionId, updatedAt, baseAt, ended, sig }), persisted so a reload keeps it.
  // The effect below is the snapshot hook: any answer / navigation / flag / highlight / note changes the fingerprint and bumps updatedAt.
  const [bootRec] = useState(() => { const r = lsGet(LS_ACTIVE_SYNC); return r && typeof r.sessionId === "string" ? r : null; });
  const recRef = useRef(bootRec);
  const [activeStamp, setActiveStamp] = useState(bootRec ? bootRec.updatedAt : 0);
  const [restoreNonce, setRestoreNonce] = useState(0);   // remounts the exam screen when a remote session is loaded under it
  const [activePrompt, setActivePrompt] = useState(null); // { action: "offer" | "conflict", remote, qbanks }
  const declinedActive = useRef("");
  const holdRef = useRef(false);                         // a prompt is open: don't mark the remote version as agreed yet
  const liveRef = useRef({}); liveRef.current = { examData, blockStates, library, view };
  function setRec(next) {
    recRef.current = next;
    if (next) lsSet(LS_ACTIVE_SYNC, JSON.stringify(next)); else lsRemove(LS_ACTIVE_SYNC);
    setActiveStamp(next ? next.updatedAt : 0);
  }
  const liveSession = syncableLive(examData, blockStates);
  const liveSig = liveSession ? activeSig(liveSession.bs) : "";
  const liveId = liveSession ? liveSession.bs.syncId || "" : "";
  useEffect(() => {
    const rec = recRef.current; const now = Date.now();
    if (liveSession) {
      let id = liveSession.bs.syncId;
      if (!id) {
        id = `as_${now.toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
        setBlockStates((prev) => (prev.length === 1 && !prev[0].syncId ? [{ ...prev[0], syncId: id }] : prev));
      }
      if (!rec || rec.sessionId !== id || rec.ended) setRec({ sessionId: id, updatedAt: now, baseAt: 0, ended: false, sig: liveSig });
      else if (rec.sig !== liveSig) setRec({ ...rec, updatedAt: now, sig: liveSig });
    } else if (rec && !rec.ended) {
      setRec({ ...rec, ended: true, updatedAt: now }); // finished, submitted or removed: leave a tombstone so other devices let go of it
    }
  }, [liveSig, liveId, !!liveSession]); // eslint-disable-line

  // What this device would upload right now (the hook reads this, reconciles it with the Drive copy, and pushes if it wins).
  function getLocalActive() {
    const { examData: ex, blockStates: bss } = liveRef.current;
    const rec = recRef.current; const lv = syncableLive(ex, bss);
    const owns = !!(lv && rec && !rec.ended && rec.sessionId === lv.bs.syncId);
    let active = null;
    if (owns) active = buildActiveSession(lv.block, lv.bs, rec);
    else if (rec && rec.ended) active = { sessionId: rec.sessionId, ended: true, updatedAt: rec.updatedAt };
    return { active, baseAt: rec ? rec.baseAt || 0 : 0, block: owns ? lv.block : null, blockFileId: rec ? rec.blockFileId || null : null };
  }
  // The hook found something to act on after comparing remote vs local activeSession.updatedAt.
  function handleActiveDecision({ action, remote, block }) {
    holdRef.current = action === "offer" || action === "conflict";
    if (action === "adopt") applyRemoteActive(remote, null, { silent: true });
    else if (action === "end") {
      setRec({ sessionId: remote.sessionId, updatedAt: remote.updatedAt, baseAt: remote.updatedAt, ended: true, sig: "" });
      setExamData(null); setBlockStates([]); setHistory([]); setActiveBlockIdx(null); setView("import");
      setFlash(tr("activeEndedElsewhere"));
    } else if (holdRef.current) {
      const key = `${remote.sessionId}:${remote.updatedAt}`;
      if (declinedActive.current !== key) setActivePrompt((p) => (p && p.remote.sessionId === remote.sessionId && p.remote.updatedAt === remote.updatedAt ? p : { action, remote, block }));
    }
  }
  // Push succeeded (or nothing needed pushing): both sides now hold `winner`, so it becomes the agreed baseline.
  function activeSynced(winner) {
    const rec = recRef.current;
    if (!winner || !rec || holdRef.current || rec.sessionId !== winner.sessionId || (rec.baseAt || 0) === winner.updatedAt) return;
    setRec({ ...rec, baseAt: winner.updatedAt });
  }
  function activeBlockSaved(sessionId, blockFileId) {
    const rec = recRef.current;
    if (rec && rec.sessionId === sessionId) setRec({ ...rec, blockFileId });
  }
  // Load a remote session. Same session already open here (silent fast-forward): keep its block and only replace the state.
  // Otherwise the block comes from the session's block file (the exact question set, mixed blocks included).
  function applyRemoteActive(r, block, { silent }) {
    const lv = syncableLive(liveRef.current.examData, liveRef.current.blockStates);
    const blk = block || (silent && lv && lv.bs.syncId === r.sessionId ? lv.block : null);
    if (!blk) { if (!silent) setFlash(tr("activeMissing")); return false; }
    const bs = hydrateActiveState(blk, r, silent && liveRef.current.view !== "exam");
    setRec({ sessionId: r.sessionId, updatedAt: r.updatedAt, baseAt: r.updatedAt, ended: false, sig: activeSig(bs), blockFileId: r.blockFileId || null });
    setExamData({ blocks: [blk] }); setBlockStates([bs]); setHistory([]); setActiveBlockIdx(0);
    if (!silent) setView("exam");
    setRestoreNonce((n) => n + 1); setRestoredNotice(false);
    if (!silent) setFlash(tr("activeResumed").replace("{name}", blk.blockName || ""));
    holdRef.current = false;
    return true;
  }
  async function acceptActivePrompt() {
    const p = activePrompt; setActivePrompt(null);
    if (!p) return;
    const blk = p.block || await sessionSync.fetchBlock(p.remote);
    applyRemoteActive(p.remote, blk, { silent: false });
  }
  function declineActivePrompt() {
    const p = activePrompt; setActivePrompt(null);
    if (!p) return;
    declinedActive.current = `${p.remote.sessionId}:${p.remote.updatedAt}`;
    const rec = recRef.current;
    if (p.action === "conflict" && rec && !rec.ended) { holdRef.current = false; setRec({ ...rec, updatedAt: Date.now() }); } // "keep this device's": the newest edit wins on the next sync
  }

  const drive = useDriveSync({ library, sessionLog, tombs, onMerged: applyCloudMerge });
  const notifs = useNotifications();
  const database = useDatabase(trashDbItems);
  const dbSync = useDatabaseSync({ drive, database });
  const dbCtx = { ...database, sync: dbSync };
  const studentProfile = useStudentProfile();
  const profileSync = useProfileSync({ drive, store: studentProfile });
  const blueprintStore = useBlueprintStore();
  const blueprintSync = useBlueprintSync({ drive, store: blueprintStore });
  const careerStore = useCareerProfile();
  const careerSync = useCareerSync({ drive, store: careerStore });
  const careerCtx = { ...careerStore, sync: careerSync };
  useBlueprintNudges({ bp: blueprintStore.bp, profile: studentProfile.profile, notify: notifs.notify });
  const [pendingFocus, setPendingFocus] = useState(null); // set by the tutor's "Start a <subject> block", consumed by the Import screen
  const navLockBs = view === "exam" && activeBlockIdx !== null ? blockStates[activeBlockIdx] : null;
  const navCtx = {
    locked: !!(navLockBs && navLockBs.status === "in-progress" && !navLockBs.tutor),
    open: (tab) => { setLibTab(tab); if (view !== "import") goHome(); window.scrollTo({ top: 0, behavior: "smooth" }); },
  };
  const profileCtx = { ...studentProfile, bpStore: { ...blueprintStore, sync: blueprintSync }, sync: profileSync, pendingFocus, seedFocus: setPendingFocus, consumeFocus: () => setPendingFocus(null) };
  useNativeFeel();
  useTutorNudges({ profile: studentProfile.profile, sessionLog, notify: notifs.notify });
  // Drive sync alerts: only on a real change of state (reconnect needed / error / first successful link), never on every poll.
  const prevSync = useRef(drive.status);
  useEffect(() => {
    const prev = prevSync.current; prevSync.current = drive.status;
    if (prev === drive.status) return;
    if (drive.status === "reauth") notifs.notify({ kind: "syncReauth", tone: "amber", dedupe: "sync" });
    else if (drive.status === "error") notifs.notify({ kind: "syncError", tone: "red", dedupe: "sync", vars: { errKey: drive.errKey || "" } });
    else if (drive.status === "done" && (prev === "reauth" || prev === "error" || prev === "none" || prev === "busy") && notifs.items.some((n) => n.dedupe === "sync")) notifs.markRead(notifs.items.find((n) => n.dedupe === "sync").id);
  }, [drive.status]); // eslint-disable-line
  const wasLinked = useRef(drive.linked);
  const awaitingLink = useRef(false); // set when the user links Drive; the "connected" notice fires once that first sync succeeds
  useEffect(() => {
    if (drive.linked && !wasLinked.current) awaitingLink.current = true;
    if (!drive.linked) awaitingLink.current = false;
    wasLinked.current = drive.linked;
    if (awaitingLink.current && drive.status === "done") { awaitingLink.current = false; notifs.notify({ kind: "syncLinked", tone: "green", dedupe: "linked" }); }
  }, [drive.linked, drive.status]); // eslint-disable-line
  const sessionSync = useSessionSync({ drive, stamp: activeStamp, getLocal: getLocalActive, onDecision: handleActiveDecision, onSynced: activeSynced, onBlockSaved: activeBlockSaved });

  // Analytics → Review Exam: reopen the saved run in the normal results screen (every question, labs, explanations, notes,
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
    setLibTab("analytics");
    setView("results");
  }

  function deleteLibraryEntry(id) {
    const e = library.find((x) => x.id === id);
    if (e) trashPush([{ kind: "qbank", data: e }]);
    addTombs("qbanks", [id]); setLibrary((lib) => lib.filter((x) => x.id !== id));
  }

  // Rename a saved Qbank. A loaded exam keeps showing the old name unless its blocks are updated too, so do both.
  function renameLibraryEntry(id, title) {
    const name = String(title || "").trim().slice(0, 120);
    if (!name) return;
    setLibrary((lib) => lib.map((e) => (e.id === id ? { ...e, title: name, updatedAt: Date.now() } : e)));
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
      ? { ...e, updatedAt: finishedAt, lastScore: { correct: score.correct, total: score.total, pct: score.pct, date: finishedAt } }
      : e)));
  }

  // Settings → "Reset All Local Data": wipes the library, the active session and preferences, then returns
  // to a clean import screen. (The save effects above then see empty/default state and keep the keys absent.)
  function resetAllData() {
    [LS_SESSION, LS_LIBRARY, LS_PREFS, LS_HISTORY, LS_TOMBS, LS_ACTIVE_SYNC, LS_TRASH].forEach(lsRemove);
    recRef.current = null; setActiveStamp(0); setActivePrompt(null); lsRemove(LS_SESSION_FILE);
    drive.disconnect(); setTombs(emptyTombs()); // Drive is left as it was; reconnect to restore from it
    failedKeys.current = {};
    setStorageError(false);
    setRestoredNotice(false);
    setExamData(null); setBlockStates([]); setHistory([]); setActiveBlockIdx(null);
    removeAllReviewSnapshots(); notifs.clearAll(); database.wipe(); studentProfile.wipe(); blueprintStore.wipe(); careerStore.wipe(); setLibrary([]); setSessionLog([]); setTrash([]); setDarkMode(true); setLang("en"); setTextScale(1);
    setView("import");
  }

  // Importing from Home while a block is in progress must not end it: the Qbank goes into the library and the session is left alone.
  function importKeepingSession(data) {
    const r = saveImportToLibrary(data);
    if (r.failed) { setStorageError(true); return; }
    const msg = r.added === 0
      ? tr("libNothing")
      : [tr("libSaved").replace("{n}", r.added), r.dup ? tr("libDup").replace("{d}", r.dup) : ""].filter(Boolean).join(" ");
    setFlash(`${msg} ${tr("sessionKept")}`);
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
      hintCorrect: block.questions.filter((q) => bs.answers[q.id]?.hintUsed && bs.answers[q.id]?.selected === q.correctAnswer).length,
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
    notifs.notify({ kind: "blockDone", tone: pct >= 60 ? "green" : "amber", vars: { name: blockLabel(block, (k, v) => { let x = STR[lang]?.[k] ?? STR.en[k] ?? k; if (v) for (const q in v) x = x.split(`{${q}}`).join(String(v[q])); return x; }), correct, total, pct } });
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
    <TrashContext.Provider value={{ trash, restore: restoreTrash, purge: purgeTrash }}>
    <NavContext.Provider value={navCtx}>
    <DriveContext.Provider value={drive}>
    <NotifContext.Provider value={notifs}>
    <DbContext.Provider value={dbCtx}>
    <ProfileContext.Provider value={profileCtx}>
    <CareerContext.Provider value={careerCtx}>
    <div style={{ minHeight: "100vh", background: T.paper, fontFamily: FONT_UI, textAlign: "left" }}>
      {srcWin && <TutorSourcesWindow sources={srcWin.sources} T={T} onClose={() => setSrcWin(null)} />}
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

      {activePrompt && (() => {
        const r = activePrompt.remote;
        const when = new Date(r.updatedAt).toLocaleTimeString(lang === "es" ? "es" : "en-US", { hour: "numeric", minute: "2-digit" });
        const body = tr("activeBody").replace("{name}", r.blockName || "").replace("{n}", String((Number(r.currentIndex) || 0) + 1)).replace("{total}", String(r.questionCount || "?")).replace("{answered}", String(r.answeredCount || 0)).replace("{time}", when);
        const mixLine = r.isMixed && r.sourceBanks && r.sourceBanks.length ? ` ${tr("activeMixed").replace("{banks}", r.sourceBanks.join(", "))}` : "";
        const replaces = activePrompt.action === "conflict" || !!examData;
        return (
          // A bottom-center notification, not a modal: the screen stays usable underneath. Continue acts on it; the X / Not now dismisses it.
          <div role="status" aria-live="polite" style={{
            position: "fixed", left: "50%", transform: "translateX(-50%)", bottom: "calc(90px + env(safe-area-inset-bottom, 0px))", zIndex: 310, width: "min(400px, calc(100vw - 28px))", boxSizing: "border-box",
            background: T.card, border: `1px solid ${T.blue}`, borderRadius: 12, padding: "14px 14px 12px", boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
          }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
              <Cloud size={18} color={T.blue} style={{ flexShrink: 0, marginTop: 2 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: FONT_UI, fontSize: fs(14), fontWeight: 700, color: T.ink, lineHeight: 1.35 }}>{tr(activePrompt.action === "conflict" ? "activeTitleConflict" : "activeTitle")}</div>
                <p style={{ fontFamily: FONT_UI, fontSize: fs(12.5), color: T.muted, lineHeight: 1.5, margin: "4px 0 0", overflowWrap: "anywhere" }}>{body}{mixLine}</p>
                {replaces && <p style={{ fontFamily: FONT_UI, fontSize: fs(12), color: T.amber, lineHeight: 1.45, margin: "6px 0 0" }}>{tr("activeReplaceWarn")}</p>}
              </div>
              <button onClick={declineActivePrompt} aria-label={tr("activeNotNow")} title={tr("activeNotNow")} style={{ background: "transparent", border: "none", cursor: "pointer", color: T.muted, padding: 4, margin: "-4px -4px 0 0", flexShrink: 0, display: "inline-flex" }}><X size={16} /></button>
            </div>
            <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
              <GhostButton T={T} onClick={declineActivePrompt}>{tr(activePrompt.action === "conflict" ? "activeKeepMine" : "activeNotNow")}</GhostButton>
              <PrimaryButton T={T} onClick={acceptActivePrompt}>{tr("activeContinue")}</PrimaryButton>
            </div>
          </div>
        );
      })()}

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
          onImport={(d) => (hasInProgress ? importKeepingSession(d) : handleImport(d))}
          onSaveToLibrary={saveImportToLibrary}
          library={library}
          sessionLog={sessionLog}
          drive={drive}
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
          key={`${activeBlockIdx}:${restoreNonce}`}
          block={examData.blocks[activeBlockIdx]}
          blockState={blockStates[activeBlockIdx]}
          setBlockState={setActiveBlockState}
          onSubmitBlock={submitActiveBlock}
          onRate={(q, k) => rateQuestion(activeBlockIdx, q, k)}
          onHome={goHome}
          onImportQbank={saveImportToLibrary}
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
    </CareerContext.Provider>
    </ProfileContext.Provider>
    </DbContext.Provider>
    </NotifContext.Provider>
    </DriveContext.Provider>
    </NavContext.Provider>
    </TrashContext.Provider>
    </DataContext.Provider>
    </TextScaleContext.Provider>
    </LangContext.Provider>
  );
}
