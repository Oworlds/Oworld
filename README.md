# 🩺 Oworld (Open World Qbank Simulator)

**Oworld** is an open-source, client-side exam simulator designed to recreate the official NBME / USMLE testing environment. It provides medical students and healthcare trainees with a free, high-fidelity platform for practicing clinical vignettes, custom course blocks, and AI-generated question banks.

![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)
![Build Status](https://img.shields.io/badge/Status-Active%20Development-green)

---

## 🚀 Key Features

* **Authentic NBME Testing Layout**: Designed with test-day UI muscle memory in mind.
  * Native text highlighting for vignettes and stems.
  * Answer choice strike-through option.
  * Item flagging (`Alt + J`) and progress grid.
  * Countdown timer with hide toggle.
* **Zero-Server Client Architecture**:
  * Runs entirely in the browser using `localStorage`—no user tracking or server overhead.
  * Works offline once loaded.
* **Medical Reference Tools**:
  * Searchable NBME lab reference modal across Blood, Urine, and CSF ranges.
  * On-screen calculator.
* **Modular Question Importing**:
  * Import custom JSON question banks from lecture notes, peer sets, or AI tools (NotebookLM, Gemini, Claude).
  * Flexible configuration for non-USMLE medical courses (Anatomy, Microbiology, Pharmacology).

---

## 📦 How It Works

Oworld operates on a decoupled architecture:

1. **Generate or Load**: Obtain a question block JSON file from your course resources or AI prompt generator.
2. **Paste & Test**: Load the JSON directly into Oworld to launch an interactive, timed block.
3. **Review & Retain**: Review correct answers, option breakdowns, and explanations upon completion.

---

## 🛠️ Tech Stack

* **Framework**: React 18+ / Next.js (Client Components)
* **Styling**: Tailwind CSS
* **Icons**: Lucide React
* **State Management**: Zustand / LocalStorage
* **Deployment**: GitHub Pages / Vercel

---

## 📄 Question Block Schema

To create or export custom question blocks compatible with Oworld, structure your JSON according to the following schema:

```json
{
  "title": "Cardiovascular Pathology Block 1",
  "config": {
    "showLabValues": true,
    "timeLimitMinutes": 60
  },
  "questions": [
    {
      "id": "cardio-01",
      "subject": "Cardiovascular",
      "discipline": "Pathology",
      "vignette": "A 65-year-old man presents to the emergency department with severe retrosternal chest pain...",
      "stem": "Which of the following histopathological findings is most likely present?",
      "options": [
        { "key": "A", "text": "Coagulative necrosis with neutrophil infiltration" },
        { "key": "B", "text": "Contraction band necrosis" }
      ],
      "correctAnswer": "A",
      "explanation": {
        "overview": "Transmural myocardial infarction at 24-48 hours characteristically shows coagulative necrosis...",
        "options": {
          "A": "Correct. Neutrophilic infiltration begins around 12-24 hours and peaks at 1-3 days.",
          "B": "Incorrect. Contraction band necrosis occurs secondary to reperfusion injury."
        }
      }
    }
  ]
}
