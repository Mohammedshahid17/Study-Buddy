import express from 'express';
import type { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
// Cloud Run reverse proxy (nginx) listens on 8080 and proxies all requests to port 3000.
// Per AI Studio runtime guidelines, the Node server must listen on port 3000.
const PORT = 3000;

app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Initialize GoogleGenAI SDK server-side
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

const STUDYBUDDY_SYSTEM_PROMPT = `
You are "StudyBuddy" 🎓, an expert AI programming tutor and study companion designed specifically for first-year university computer science students, self-learners, and beginner programmers.

# PERSONALITY & TONE
- Beginner-friendly, Teacher-like, Friendly, Funny, Motivational, Concise yet Detailed when explaining subtleties, and Professional.
- Always encouraging, empathetic to beginner frustrations (like off-by-one errors or cryptic syntax errors), and respectful.
- Maintain consistency from the first prompt through long multi-turn sessions.
- Balance domain knowledge with approachable, non-intimidating simplicity.

# CORE KNOWLEDGE & SCOPE
- Specialize in: Python basics, JavaScript basics, core computer science concepts (variables, memory models, data structures, loops, recursion, functions, scope, Big O, conditionals, OOP, debugging, algorithms), university exam preparation, coursework workflows, and study habits.
- Strict Domain Guardrail: Stay strictly within programming, CS fundamentals, coursework, and study skills. If the user asks about unrelated topics (e.g. general pop culture, cooking, politics, etc.), politely decline and steer them back to programming: "I'm your dedicated CS StudyBuddy! Let's refocus on programming or your computer science coursework. What concept or code challenge can we tackle next?"

# PEDAGOGICAL RESPONSE BEHAVIOUR
1. **Step-by-step breakdown**: Break intimidating algorithms or logic down into bite-sized, digestible steps.
2. **Real-world analogies**: Always connect abstract ideas to everyday things (e.g., variables = labeled storage jars, functions = kitchen recipes, arrays = train compartments, recursion = Russian nesting dolls).
3. **Give hints before direct answers**: When a student asks a homework or exercise problem (e.g., "Write a function that reverses a linked list" or "What is the answer to question 3?"), do NOT just dump the full final solution immediately. Offer guiding questions, pseudocode hints, or conceptual scaffolds so they learn by doing.
4. **Code examples**: Provide clean, modern, beginner-friendly code snippets with inline comments explaining tricky lines.
5. **Constructive debugging**: If the user provides broken or partial code, identify what's working well first, explain *why* the bug happens intuitively, and show how to fix it.
6. **Formatting**: Use clean Markdown with headers, bullet points, bold key terms, and code blocks.
7. **Summary**: Provide a quick, memorable 1-2 sentence "TL;DR Key Takeaway" at the end of longer conceptual explanations.
8. **Follow-up engagement check**: End explanations with a friendly check-in question (e.g., "Does this mental model make sense, or would you like to see a Python example?" or "Want to try a quick mini-challenge to test it?").

# SAFETY & TRUTHFULNESS
- Avoid inventing facts or hallucinating. If unsure or if essential context is missing, say: "I do not have enough verified information to answer this reliably."
- Ask clarifying questions when user input is ambiguous rather than making unfounded assumptions.
- Clearly distinguish verified facts/standards from arbitrary rules or conventions.
`;

// Health check endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    hasKey: !!process.env.GEMINI_API_KEY,
    app: 'StudyBuddy',
    timestamp: new Date().toISOString(),
  });
});

// Helper to stream content with model fallback
async function streamWithModelFallback(
  contents: any,
  systemPrompt: string,
  onChunk: (text: string) => void
) {
  // Try ultra-fast gemini-3.1-flash-lite first, fallback to gemini-3.8-flash if needed
  const models = ['gemini-3.1-flash-lite', 'gemini-3.8-flash'];
  let lastError: any = null;

  for (const model of models) {
    try {
      const responseStream = await ai.models.generateContentStream({
        model,
        contents,
        config: {
          systemInstruction: systemPrompt,
          temperature: 0.7,
          topP: 0.95,
        },
      });

      let receivedAny = false;
      for await (const chunk of responseStream) {
        const text = chunk.text;
        if (text) {
          receivedAny = true;
          onChunk(text);
        }
      }

      if (receivedAny) {
        return; // Success!
      }
    } catch (err: any) {
      console.warn(`Model ${model} failed with error:`, err?.message || err);
      lastError = err;
      // Continue to next model in fallback list
    }
  }

  throw lastError || new Error('All models failed to respond.');
}

// Streaming Chat Endpoint
app.post('/api/chat', async (req: Request, res: Response): Promise<void> => {
  try {
    const { messages, socraticMode, studentCourse } = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
      res.status(400).json({ error: 'Messages array is required.' });
      return;
    }

    if (!process.env.GEMINI_API_KEY) {
      res.status(500).json({
        error: 'Gemini API key is not configured on the server.',
      });
      return;
    }

    // Build system instruction with optional mode modifiers
    let effectiveSystemPrompt = STUDYBUDDY_SYSTEM_PROMPT;
    if (socraticMode) {
      effectiveSystemPrompt += `\n\n[SOCRATIC HINT MODE ACTIVE]: The student has explicitly requested hint mode! Do NOT provide complete code solutions. Provide gentle progressive clues, conceptual questions, and guide them to find the answer themselves.`;
    }
    if (studentCourse) {
      effectiveSystemPrompt += `\n\n[STUDENT COURSE CONTEXT]: The student is currently studying: ${studentCourse}. Tailor examples and terminology to this course level.`;
    }

    // Format conversation history for Gemini
    const contents: Array<{
      role: 'user' | 'model';
      parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }>;
    }> = [];

    for (const msg of messages) {
      const role: 'user' | 'model' = msg.role === 'assistant' || msg.role === 'model' ? 'model' : 'user';
      const parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> = [];

      // Add text content
      if (msg.content && msg.content.trim()) {
        parts.push({ text: msg.content });
      }

      // Add attachments if any (images, screenshots, code files)
      if (Array.isArray(msg.attachments)) {
        for (const att of msg.attachments) {
          if (att.base64 && att.type) {
            const cleanBase64 = att.base64.replace(/^data:[^;]+;base64,/, '');
            parts.push({
              inlineData: {
                mimeType: att.type,
                data: cleanBase64,
              },
            });
          }
        }
      }

      if (parts.length > 0) {
        contents.push({ role, parts });
      }
    }

    if (contents.length === 0) {
      res.status(400).json({ error: 'No valid message content provided.' });
      return;
    }

    // Set headers for Server-Sent Events (SSE) with X-Accel-Buffering: no for NGINX/Cloud Run
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders?.();

    await streamWithModelFallback(contents, effectiveSystemPrompt, (chunkText) => {
      res.write(`data: ${JSON.stringify({ chunk: chunkText })}\n\n`);
    });

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (error: any) {
    console.error('Error in /api/chat:', error);
    if (res.headersSent) {
      res.write(`data: ${JSON.stringify({ error: error?.message || 'Generation failed. Please try again.' })}\n\n`);
      res.end();
    } else {
      res.status(500).json({
        error: error?.message || 'Failed to generate response. Please try again.',
      });
    }
  }
});

// Interactive Diagnostic Quiz Generator
app.post('/api/quiz/generate', async (req: Request, res: Response): Promise<void> => {
  try {
    const { topic = 'Python Basics', difficulty = 'Beginner' } = req.body;

    const prompt = `Generate an interactive 3-question diagnostic quiz for a first-year student on the topic "${topic}" at level "${difficulty}".
Questions must test fundamental understanding, common beginner edge cases, or code reading.`;

    const models = ['gemini-3.1-flash-lite', 'gemini-3.8-flash'];
    let response: any = null;
    let lastErr: any = null;

    for (const m of models) {
      try {
        response = await ai.models.generateContent({
          model: m,
          contents: prompt,
          config: {
            systemInstruction: `You are StudyBuddy 🎓 quiz master. Generate engaging, educational multiple-choice questions with clear explanations and hints.`,
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                topic: { type: Type.STRING },
                questions: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      id: { type: Type.STRING },
                      question: { type: Type.STRING },
                      codeSnippet: { type: Type.STRING },
                      options: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING },
                      },
                      correctIndex: { type: Type.INTEGER },
                      hint: { type: Type.STRING },
                      explanation: { type: Type.STRING },
                      analogy: { type: Type.STRING },
                    },
                    required: ['id', 'question', 'options', 'correctIndex', 'hint', 'explanation'],
                  },
                },
              },
              required: ['topic', 'questions'],
            },
          },
        });
        if (response?.text) break;
      } catch (e) {
        lastErr = e;
      }
    }

    if (!response?.text) {
      throw lastErr || new Error('Quiz could not be generated.');
    }

    const parsed = JSON.parse(response.text || '{}');
    res.json(parsed);
  } catch (err: any) {
    console.error('Error in /api/quiz/generate:', err);
    res.status(500).json({ error: err?.message || 'Failed to generate quiz' });
  }
});

// Line-by-Line Code Explainer Endpoint
app.post('/api/explain-code', async (req: Request, res: Response): Promise<void> => {
  try {
    const { code, language = 'python' } = req.body;
    if (!code || typeof code !== 'string') {
      res.status(400).json({ error: 'Code string is required' });
      return;
    }

    const prompt = `Analyze this ${language} code snippet line-by-line for a first-year CS student:\n\`\`\`${language}\n${code}\n\`\`\``;

    const models = ['gemini-3.1-flash-lite', 'gemini-3.8-flash'];
    let response: any = null;
    let lastErr: any = null;

    for (const m of models) {
      try {
        response = await ai.models.generateContent({
          model: m,
          contents: prompt,
          config: {
            systemInstruction: `You are StudyBuddy 🎓. Provide a visual, mental-model breakdown of the provided code snippet.
Highlight what memory or variables look like at each step, any subtle pitfalls for beginners, and a simple real-world analogy.`,
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                overview: { type: Type.STRING },
                analogy: { type: Type.STRING },
                timeComplexity: { type: Type.STRING },
                spaceComplexity: { type: Type.STRING },
                steps: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      lineNumber: { type: Type.INTEGER },
                      codeLine: { type: Type.STRING },
                      action: { type: Type.STRING },
                      variableState: { type: Type.STRING },
                    },
                    required: ['lineNumber', 'codeLine', 'action'],
                  },
                },
                commonPitfalls: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
              },
              required: ['title', 'overview', 'steps', 'commonPitfalls'],
            },
          },
        });
        if (response?.text) break;
      } catch (e) {
        lastErr = e;
      }
    }

    if (!response?.text) {
      throw lastErr || new Error('Code explanation could not be generated.');
    }

    const parsed = JSON.parse(response.text || '{}');
    res.json(parsed);
  } catch (err: any) {
    console.error('Error in /api/explain-code:', err);
    res.status(500).json({ error: err?.message || 'Failed to explain code' });
  }
});

// Server-side Text-to-Speech using gemini-3.8-flash-lite-tts
app.post('/api/tts', async (req: Request, res: Response): Promise<void> => {
  try {
    const { text, voice = 'Puck' } = req.body;
    if (!text || typeof text !== 'string') {
      res.status(400).json({ error: 'Text string is required' });
      return;
    }

    const sanitizedText = text.slice(0, 1000);

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash-lite-tts',
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: sanitizedText,
              speechMetadata: {
                style: 'Friendly, engaging and clear university tutor',
              },
            },
          ],
        },
      ],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voice || 'Puck' },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) {
      throw new Error('No audio generated by model');
    }

    res.json({ audio: base64Audio, format: 'audio/wav' });
  } catch (err: any) {
    console.error('Error in /api/tts:', err);
    res.status(500).json({ error: err?.message || 'Failed to synthesize speech' });
  }
});

// Start Express server and mount Vite middleware in development or static dist in production
async function startServer() {
  const distPath = path.resolve(__dirname, 'dist');
  const hasDist = fs.existsSync(path.join(distPath, 'index.html'));
  const isProd = process.env.NODE_ENV === 'production' || hasDist;

  if (isProd && hasDist) {
    console.log(`Serving static production build from ${distPath}`);
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    console.log('Mounting Vite dev middleware');
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🎓 StudyBuddy full-stack server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
