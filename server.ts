import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json({ limit: '15mb' }));

function getGenAIClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured. Please check the Settings > Secrets panel.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

app.post('/api/analyze-case', async (req, res) => {
  try {
    const {
      patientId,
      age,
      sex,
      modality,
      anatomicalRegion,
      chiefComplaint,
      clinicalHistory,
      biomarkers,
      imageUrl,
      imageBase64,
      imageMimeType,
    } = req.body;

    if (!patientId || !modality || !chiefComplaint) {
      res.status(400).json({
        error: 'Missing required clinical parameters (patientId, modality, chiefComplaint).',
      });
      return;
    }

    const ai = getGenAIClient();

    const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [];

    // Attach image if base64 provided or if local approved asset path exists
    if (imageBase64 && typeof imageBase64 === 'string') {
      const cleanBase64 = imageBase64.replace(/^data:image\/[a-zA-Z+]+;base64,/, '');
      parts.push({
        inlineData: {
          mimeType: imageMimeType || 'image/jpeg',
          data: cleanBase64,
        },
      });
    } else if (imageUrl && typeof imageUrl === 'string' && imageUrl.startsWith('/src/assets/')) {
      const localImagePath = path.join(__dirname, imageUrl);
      if (fs.existsSync(localImagePath)) {
        const fileBuffer = fs.readFileSync(localImagePath);
        parts.push({
          inlineData: {
            mimeType: 'image/jpeg',
            data: fileBuffer.toString('base64'),
          },
        });
      }
    }

    const biomarkerSummary = Array.isArray(biomarkers)
      ? biomarkers
          .map((b: { name: string; value: number; unit: string; referenceRange: string }) =>
            `${b.name}: ${b.value} ${b.unit} (Ref: ${b.referenceRange})`
          )
          .join('; ')
      : 'No laboratory biomarkers attached';

    const promptText = `Analyze this clinical case and medical image (if attached) for clinical decision-support triage prioritization.
Patient ID: ${patientId} (${age}y ${sex})
Imaging Modality: ${modality} (${anatomicalRegion || 'Standard view'})
Chief Complaint: ${chiefComplaint}
Clinical History: ${clinicalHistory || 'None documented'}
Clinical Dataset / Biomarkers: ${biomarkerSummary}

Provide structured clinical decision-support output to help healthcare professionals identify potential signs of disease and prioritize this case for further assessment. Include:
1. imagingAbnormalityScore (0-100 integer representing severity of visual/structural findings)
2. primarySummary (concise 1-2 sentence clinical synthesis)
3. differentialIndicators (list of 3 potential conditions with probability 0-100, key supporting evidence, and ICD-10 code)
4. recommendedNextSteps (list of 3 concrete diagnostic or clinical actions)
5. detectedRegions (1-2 regions of interest with label, normalized x, y, width, height percentages between 15 and 75, and clinical finding note)`;

    parts.push({ text: promptText });

    const response = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: { parts },
      config: {
        systemInstruction:
          'You are an expert clinical decision-support diagnostic engine assisting board-certified radiologists and clinicians. Provide calibrated, evidence-based observations to help prioritize cases for physician assessment. Always frame outputs as decision-support indicators rather than definitive standalone diagnoses.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            imagingAbnormalityScore: {
              type: Type.INTEGER,
              description: 'Severity score of imaging and clinical findings from 0 to 100.',
            },
            primarySummary: {
              type: Type.STRING,
              description: 'Concise 1-2 sentence synthesis of potential disease signs and triage rationale.',
            },
            differentialIndicators: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  condition: { type: Type.STRING },
                  icd10: { type: Type.STRING },
                  probability: { type: Type.INTEGER },
                  evidence: { type: Type.STRING },
                },
                required: ['condition', 'icd10', 'probability', 'evidence'],
              },
            },
            recommendedNextSteps: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            detectedRegions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  label: { type: Type.STRING },
                  x: { type: Type.NUMBER },
                  y: { type: Type.NUMBER },
                  width: { type: Type.NUMBER },
                  height: { type: Type.NUMBER },
                  confidence: { type: Type.NUMBER },
                  finding: { type: Type.STRING },
                },
                required: ['id', 'label', 'x', 'y', 'width', 'height', 'confidence', 'finding'],
              },
            },
          },
          required: [
            'imagingAbnormalityScore',
            'primarySummary',
            'differentialIndicators',
            'recommendedNextSteps',
            'detectedRegions',
          ],
        },
      },
    });

    const jsonText = (response.text ?? '{}').trim();
    const parsed = JSON.parse(jsonText);
    res.json(parsed);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unexpected error during clinical case analysis.';
    console.error('Gemini API Error:', message);
    res.status(500).json({ error: message });
  }
});

async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const port = Number(process.env.PORT) || 3000;
  app.listen(port, '0.0.0.0', () => {
    console.log(`AcuityMed CDS server listening on http://localhost:${port}`);
  });
}

startServer();
