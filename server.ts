import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

let aiClient: GoogleGenAI | null = null;

function getAi(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is required');
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // AI Generate Flashcards API endpoint
  app.post('/api/generate-cards', async (req, res) => {
    try {
      const { text, deckName } = req.body;

      if (!text || typeof text !== 'string' || text.trim().length === 0) {
        return res.status(400).json({ error: 'Text content is required for card generation' });
      }

      const ai = getAi();

      const prompt = `You are an expert cognitive scientist and educator specializing in spaced repetition (SM-2) active recall memory systems.
Analyze the following study notes / text and generate 3 to 10 high-quality active recall flashcard question-and-answer pairs.
Subject/Deck Context: "${deckName || 'General Knowledge'}"

Guidelines for optimal SM-2 active recall cards:
1. One core atomic concept per card (avoid convoluted multi-part questions).
2. The question must be a clear, unambiguous prompt that tests understanding or key definitions.
3. The answer must be crisp, complete, and directly target the prompt.
4. Extract any citation or quote if available in the text.

Source Text:
"""
${text.slice(0, 15000)}
"""`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          systemInstruction: 'You extract precise spaced repetition active recall flashcards from notes in structured JSON.',
          temperature: 0.3,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              cards: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    question: {
                      type: Type.STRING,
                      description: 'The active recall question or prompt for the front of the flashcard',
                    },
                    answer: {
                      type: Type.STRING,
                      description: 'The target answer for the back of the flashcard',
                    },
                    keyConcept: {
                      type: Type.STRING,
                      description: 'Short 2-4 word summary of the concept',
                    },
                    quote: {
                      type: Type.STRING,
                      description: 'Optional excerpt from the source text supporting this fact',
                    },
                    citation: {
                      type: Type.STRING,
                      description: 'Optional book/paper/author citation extracted from the text',
                    },
                  },
                  required: ['question', 'answer'],
                },
              },
            },
            required: ['cards'],
          },
        },
      });

      const responseText = response.text?.trim() || '{}';
      const parsedData = JSON.parse(responseText);

      return res.json({
        success: true,
        cards: parsedData.cards || [],
      });
    } catch (error: unknown) {
      console.error('Error generating cards with Gemini:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate flashcards with AI';
      return res.status(500).json({ error: errorMessage });
    }
  });

  // Vite middleware setup
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
