# 🩺 AcuityMed
### Intelligence Behind Every Clinical Decision.

**An intelligent, multimodal AI-powered clinical decision-support platform that transforms medical imaging and clinical data into actionable insights, supporting smarter patient prioritization and more efficient healthcare workflows.**

---

## 🌟 Overview

AcuityMed is an AI-powered medical image analysis and clinical decision-support application designed to assist healthcare professionals in reviewing medical cases and prioritizing patients for further assessment.

The platform combines medical image input, patient clinical history, symptoms, and laboratory biomarkers to generate structured AI-assisted findings.

Powered by Google's Gemini multimodal AI, AcuityMed analyzes available clinical information and produces potential abnormality indicators, differential possibilities, suggested next steps, and regions of interest.

Beyond image analysis, AcuityMed incorporates a clinical triage workflow to help organize cases according to their calculated acuity and priority.

**Our vision:** To make healthcare workflows more intelligent, organized, and efficient while keeping healthcare professionals at the center of every clinical decision.

## 🎯 Problem Statement

Healthcare professionals often need to review multiple medical images, laboratory reports, and patient records while identifying cases that may require more urgent attention.

Traditional workflows can involve:
- Time-consuming manual review of medical information.
- Fragmented imaging and laboratory information.
- Difficulty organizing and prioritizing large case queues.
- Challenges in maintaining consistent clinical review workflows.

## 💡 Our Solution

AcuityMed brings these elements together through a unified AI-assisted clinical decision-support platform.

It aims to:
- Analyze medical images using multimodal AI.
- Incorporate patient information and laboratory biomarkers.
- Generate structured clinical insights.
- Calculate case acuity and assign triage priorities.
- Help clinicians organize cases for further assessment.
- Support clinician review, escalation, and accountability workflows.

## ✨ Key Features

### 1. AI-Powered Medical Image Analysis
- Accepts medical image input for AI-assisted analysis.
- Uses Google's Gemini multimodal AI API.
- Generates potential abnormality indicators.
- Identifies potential regions of interest.
- Provides structured clinical summaries.

### 2. Clinical Data Integration
Combines medical image information with:
- Patient age and sex.
- Imaging modality and anatomical region.
- Chief complaints and symptoms.
- Clinical history.
- Laboratory biomarkers and reference ranges.

### 3. Intelligent Clinical Decision Support
Generates structured outputs such as:
- Imaging abnormality score.
- Primary clinical summary.
- Differential indicators.
- Supporting evidence.
- ICD-10 references.
- Recommended next steps.

### 4. Smart Patient Triage
Uses a prototype-defined clinical acuity scoring system to help organize cases according to priority.

| Priority | Acuity Score | Target Review Time |
|---|---:|---:|
| STAT | 82+ | 15 minutes |
| URGENT | 65–81 | 45 minutes |
| PRIORITY | 42–64 | 120 minutes |
| ROUTINE | Below 42 | 360 minutes |

These are configurable prototype workflow targets, not clinically validated medical response-time recommendations.

### 5. Clinician-Centered Workflow
Designed to support healthcare professionals in reviewing AI-generated findings and making informed decisions.

The intended workflow includes case review, priority confirmation, escalation, and second-opinion requests.

### 6. Structured AI Responses
Uses schema-constrained JSON responses to make AI-generated information easier to process and display consistently in the application.

---

## 🧠 AI Architecture

AcuityMed uses Google's Gemini multimodal AI through the Google GenAI SDK.

**AI Model:** `gemini-4-hydrogen` (model identifier configured in the current backend implementation).

### Analysis Pipeline

1. **Input Collection:** Medical image and patient clinical information are submitted.
2. **Backend Processing:** Express.js receives and prepares the clinical information.
3. **Multimodal AI Analysis:** Gemini processes the supplied image and clinical context.
4. **Structured Output:** The model generates JSON containing findings and recommendations.
5. **Clinical Prioritization:** The application uses clinical indicators in its triage workflow.
6. **Clinician Review:** Healthcare professionals can review the generated insights.

### AI Output Structure

| Output | Description |
|---|---|
| Abnormality Score | Potential imaging abnormality severity indicator |
| Primary Summary | Concise clinical synthesis |
| Differential Indicators | Potential conditions with probabilities and evidence |
| ICD-10 Codes | Associated classification references |
| Recommended Next Steps | Suggested follow-up actions |
| Detected Regions | Potential regions of interest with coordinates |

---

## 🛠️ Technology Stack

### Frontend
- React 19
- TypeScript
- Vite
- Tailwind CSS 4
- Lucide React
- Motion

### Backend
- Node.js
- Express.js
- TypeScript
- Google GenAI SDK

### Artificial Intelligence
- Google Gemini Multimodal AI
- Structured JSON generation
- Schema-constrained AI responses

### Development Tools
- Git and GitHub
- npm
- Visual Studio Code

---

## 🏗️ System Architecture

```text
             ACUITYMED
                 |
                 v
       React + TypeScript UI
                 |
                 v
          Express.js API
                 |
                 v
       Clinical Data Processing
                 |
                 v
       Google Gemini Multimodal
                 |
                 v
       Structured JSON Response
                 |
                 v
       Clinical Decision Support
                 |
                 v
        Acuity & Triage Workflow
                 |
                 v
          Clinician Review
```

---

## ⚙️ Installation and Setup

Follow these steps to run AcuityMed locally.

### Prerequisites

- Node.js (20.19+ or compatible newer version)
- npm
- Google Gemini API key

### 1. Clone the Repository

```bash
(https://github.com/shri340/AcuityMed16)
```

### 2. Navigate to the Project Directory

```bash
cd AcuityMed16
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Configure Environment Variables

Create a `.env` file in the root directory.

```env
GEMINI_API_KEY=your_gemini_api_key
```

Obtain your API key from:

https://aistudio.google.com/apikey

**Important:** Never expose your API key in frontend code or commit your `.env` file to GitHub.

### 5. Start the Development Server

```bash
npm run dev
```

Open the local application at:

```text
http://localhost:3000
```

### 6. Build for Production

```bash
npm run build
```

### 7. Run in Production Mode

After building:

```bash
npm run start
```

Set `NODE_ENV=production` in your deployment environment so the Express server serves the production frontend build.

---

## 🔑 Environment Variables

| Variable | Description |
|---|---|
| `GEMINI_API_KEY` | Required Google Gemini API key |
| `PORT` | Server port; defaults to 3000 |
| `NODE_ENV` | Controls development or production mode |

---

## 🔌 API Endpoint

### Analyze Clinical Case

**Endpoint:**

```http
POST /api/analyze-case
```

**Purpose:**

Accepts patient information, clinical history, biomarkers, and optional medical image input for AI-assisted analysis.

**Example Request:**

```json
{
  "patientId": "DEMO-001",
  "age": 45,
  "sex": "Male",
  "modality": "X-Ray",
  "anatomicalRegion": "Chest",
  "chiefComplaint": "Persistent cough",
  "clinicalHistory": "Patient reports persistent cough.",
  "biomarkers": [
    {
      "name": "Hemoglobin",
      "value": 12.5,
      "unit": "g/dL",
      "referenceRange": "13-17"
    }
  ],
  "imageBase64": "BASE64_ENCODED_IMAGE",
  "imageMimeType": "image/jpeg"
}
```

The image fields are optional. Laboratory biomarker information can also be supplied as structured clinical data.

**Response:**

Returns structured JSON containing:
- Imaging abnormality score.
- Primary clinical summary.
- Differential indicators.
- Recommended next steps.
- Detected regions.

---

## 🔐 Privacy and Responsible AI

AcuityMed is designed as a clinical decision-support prototype.

Important considerations:
- Use de-identified medical images and test data.
- Keep API credentials securely stored on the backend.
- Treat AI-generated findings as preliminary indicators.
- Require qualified healthcare professionals to interpret and validate results.
- Do not use prototype triage scores as independent clinical decisions.
- Production deployment requires appropriate authentication, authorization, encryption, secure data storage, clinical validation, and applicable regulatory compliance.

**AcuityMed does not replace professional medical judgment or provide definitive medical diagnoses.**

---

## 🚀 Future Enhancements

Potential future development directions include:

- Integration of validated, disease-specific medical imaging models.
- Secure database-backed patient case management.
- Persistent audit logging and reporting.
- Advanced laboratory report extraction.
- DICOM image support.
- Clinician authentication and role-based access control.
- Explainable AI with clinically validated localization.
- Clinical dataset validation and performance evaluation.
- Integration with hospital information systems.

---

## 👥 Project Information

**Project:** AcuityMed16

**Category:** Artificial Intelligence / Healthcare Technology / Clinical Decision Support

**Primary Objective:** AI-assisted medical image analysis and intelligent clinical case prioritization.

**Repository:** https://github.com/shri340/AcuityMed16

---

## ⚠️ Disclaimer

AcuityMed is an experimental project developed for educational, research, and demonstration purposes.

AI-generated results may be inaccurate or incomplete. The platform has not been established as a clinically validated diagnostic system. It must not be used as a substitute for professional medical evaluation, diagnosis, or treatment.

---

## 💙 Our Vision

**Making healthcare workflows smarter, one clinical insight at a time.**

*Built with innovation, artificial intelligence, and a vision for better healthcare.*
