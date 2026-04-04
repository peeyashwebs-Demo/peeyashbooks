import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

function buildOutlinePrompt({ prompt, title = '', author = '', currentContent = '', tone = 'warm', depth = 'standard' }) {
  return `You are the premium PeeyashBooks writing copilot.
Create a clean, publishable ebook outline.

Rules:
- Avoid repetitive phrases.
- Write with variety, clarity, and natural flow.
- Return Markdown only.
- Start with a strong title as an H1.
- Add a one-line subtitle as an H2.
- Add a short positioning paragraph.
- Then create a structured outline with chapter headings and concise bullet points.
- Keep it polished and useful, not robotic.
- Tone preference: ${tone}.
- Depth preference: ${depth}.

User request: ${prompt}
Current title: ${title || 'Not provided'}
Author: ${author || 'Not provided'}
Draft context: ${currentContent || 'No current draft context provided.'}`;
}

function buildWritingPrompt({ prompt, mode = 'auto', title = '', author = '', currentContent = '', selectedText = '', chapterCount = 0 }) {
  const modeInstructions = {
    auto: 'Infer the best response from the user request.',
    ebook: 'Write a structured multi-chapter ebook draft with clear chapter headings and meaningful body paragraphs.',
    chapter: 'Write one strong chapter section with a heading and polished body copy.',
    intro: 'Write an introduction that hooks the reader and clearly frames the book.',
    blurb: 'Write a concise, marketable book blurb.',
    continue: 'Continue the existing draft naturally. Match the established topic, voice, and progression. Do not restart the book.',
    new_chapter: 'Write one brand-new chapter that logically follows the existing draft. Give it a heading and body paragraphs. Make it feel like the next real chapter, not a generic note.',
    expand: 'Expand the selected passage into a richer, more detailed section. Preserve the original idea, but deepen it with better explanation, transitions, and substance.'
  };

  return `You are the premium PeeyashBooks AI writing assistant.
Write like a polished nonfiction author and product-grade writing copilot.

Rules:
- Return Markdown only.
- Avoid repeated sentence openings and filler.
- Do not repeatedly use phrases like “this chapter”, “this section”, or “the reader will”.
- Use natural variation, stronger transitions, and specific language.
- Match the requested topic or niche exactly.
- Respect the requested mode and produce complete, useful copy.
- If current draft context is provided, use it so the new writing feels connected.
- If selected text is provided, treat it as the exact passage to expand or continue from.
- Keep headings clean and publication-ready.

Mode: ${mode}
Mode instruction: ${modeInstructions[mode] || modeInstructions.auto}
User request: ${prompt}
Current title: ${title || 'Not provided'}
Author: ${author || 'Not provided'}
Current chapter count: ${chapterCount || 0}
Selected text: ${selectedText || 'None selected'}
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
    const { action, prompt = '', mode = 'auto', title = '', author = '', currentContent = '', selectedText = '', chapterCount = 0, tone = 'warm', depth = 'standard' } = req.body || {};

    if (!prompt.trim()) {
      return res.status(400).json({ error: 'Please provide a prompt first.' });
    }

    let contents = '';
    if (action === 'generate_outline') {
      contents = buildOutlinePrompt({ prompt, title, author, currentContent, tone, depth });
    } else if (action === 'generate_writing') {
      contents = buildWritingPrompt({ prompt, mode, title, author, currentContent, selectedText, chapterCount });
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
