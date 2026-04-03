PeeyashBooks AI Outline Assistant

What was added:
- AI outline box in editor sidebar
- Serverless API route at /api/assistant
- OpenAI SDK dependency in package.json

Before running locally:
1. Open a terminal in this project folder.
2. Run: npm install
3. Add your API key:
   - macOS/Linux: export OPENAI_API_KEY=your_key_here
   - Windows PowerShell: setx OPENAI_API_KEY "your_key_here"
4. Run your local server.

For Vercel:
1. Go to Project Settings > Environment Variables
2. Add OPENAI_API_KEY
3. Redeploy

How it works:
- Type your book idea in the AI Outline Assistant box.
- Click Generate Outline.
- Use Insert into editor or Replace draft.
