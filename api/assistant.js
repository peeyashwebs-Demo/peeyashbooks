import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({
      error: 'Missing OPENAI_API_KEY. Add it in your local environment or Vercel project settings.'
    });
  }

  try {
    const { action, prompt = '', title = '', author = '', currentContent = '' } = req.body || {};

    if (action !== 'generate_outline') {
      return res.status(400).json({ error: 'Unsupported assistant action.' });
    }

    if (!prompt.trim()) {
      return res.status(400).json({ error: 'Please provide a book idea first.' });
    }

    const response = await client.responses.create({
      model: 'gpt-5.4',
      input: [
        {
          role: 'system',
          content: [
            {
              type: 'input_text',
              text: 'You are the PeeyashBooks AI writing assistant. Generate polished ebook outlines only. Keep the response clean and easy to paste into a writing editor. Use Markdown. Start with a strong title suggestion, then a short positioning line, then a chapter-by-chapter outline with concise bullet points. Do not include commentary outside the outline.'
            }
          ]
        },
        {
          role: 'user',
          content: [
            {
              type: 'input_text',
              text: `Create an ebook outline based on this request:

${prompt.trim()}

Current ebook title: ${title || 'Not provided'}
Author: ${author || 'Not provided'}
Existing draft context:
${currentContent || 'No current draft content provided.'}`
            }
          ]
        }
      ]
    });

    return res.status(200).json({ text: response.output_text || '' });
  } catch (error) {
    console.error('Assistant error:', error);
    return res.status(500).json({ error: 'The AI assistant could not generate an outline right now.' });
  }
}
