import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

function buildOutlinePrompt({ prompt, title = '', author = '', currentContent = '' }) {
  return `You are the premium PeeyashBooks writing copilot.
Create a clean, publishable ebook outline.

Rules:
- Avoid repetitive phrases.
- Write with variety, clarity, and natural flow.
- Return Markdown only.
- Start with a strong title.
- Add a one-line subtitle.
- Add a short positioning paragraph.
- Then create a structured outline with chapter headings and concise bullet points.
- Keep it polished and useful, not robotic.

User request: ${prompt}
Current title: ${title || 'Not provided'}
Author: ${author || 'Not provided'}
Draft context: ${currentContent || 'No current draft context provided.'}`;
}

function buildWritingPrompt({ prompt, mode = 'auto', title = '', author = '', currentContent = '' }) {
  return `You are the premium PeeyashBooks AI writing assistant.
Write like a polished nonfiction author and product-grade writing copilot.

Rules:
- Avoid repeated sentence openings and filler.
- Do not keep repeating phrases like “this chapter”, “this section”, or “the reader will”.
- Use natural variation, rhythm, and stronger transitions.
- Write with specificity and real substance.
- Match the user's requested topic or niche exactly.
- If asked for ebook chapters, write a complete multi-chapter draft with headings and readable paragraphs.
- Return Markdown only.
- Do not include explanations outside the requested content.

Mode: ${mode}
User request: ${prompt}
Current title: ${title || 'Not provided'}
Author: ${author || 'Not provided'}
Current draft context: ${currentContent || 'No current draft context provided.'}`;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({
      error: 'Missing GEMINI_API_KEY. Add it in your Vercel environment variables.'
    });
  }

  try {
    const { action, prompt = '', mode = 'auto', title = '', author = '', currentContent = '' } = req.body || {};

    if (!prompt.trim()) {
      return res.status(400).json({ error: 'Please provide a prompt first.' });
    }

    let contents = '';
    if (action === 'generate_outline') {
      contents = buildOutlinePrompt({ prompt, title, author, currentContent });
    } else if (action === 'generate_writing') {
      contents = buildWritingPrompt({ prompt, mode, title, author, currentContent });
    } else {
      return res.status(400).json({ error: 'Unsupported assistant action.' });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents
    });

    return res.status(200).json({ text: response.text || '' });
  } catch (error) {
    console.error('Gemini assistant error:', error);
    return res.status(500).json({
      error: 'The AI assistant could not generate content right now.'
    });
  }
}
