import fs from 'fs';
import https from 'https';
import Anthropic from '@anthropic-ai/sdk';

const envContent = fs.readFileSync('/Users/annhunt/Applications/BiasBoost/.env.local', 'utf-8');
const apiKeyMatch = envContent.match(/ANTHROPIC_API_KEY=(.+)/);
if (!apiKeyMatch) { console.error('Could not find ANTHROPIC_API_KEY'); process.exit(1); }
const apiKey = apiKeyMatch[1].trim();

// Use a custom agent with a long socket timeout to avoid ETIMEDOUT
const agent = new https.Agent({ timeout: 300000, keepAlive: true });

const client = new Anthropic({
  apiKey,
  timeout: 300000,
  httpAgent: agent,
});

const prompt = `You are a behavioural psychologist designing a cognitive bias assessment for experienced professionals (founders, executives, investors).

Generate exactly 40 multiple-choice questions as a valid JSON array.

Requirements:
- Map to these 10 cognitive biases (exactly 4 questions each):
  Confirmation Bias, Anchoring Bias, Availability Heuristic, Overconfidence Bias,
  Loss Aversion, Sunk Cost Fallacy, Halo Effect, Framing Effect, Status Quo Bias, Dunning-Kruger Effect
- Use senior decision-making scenarios: hiring/promotion, strategy, capital allocation, risk, board dynamics, evaluating people or data
- All 4 options (A-D) must sound equally reasonable and defensible to a senior professional
- Questions must be subtle — do NOT signal what bias is being tested
- Avoid textbook-style or obvious bias questions
- Use non-linear scoring (0–3 per question, where 3 = strongest bias expression)
- Occasionally invert expected patterns so that more "analytical" answers are not always lower-bias
- No two questions should be too similar

Output ONLY a valid JSON array — no markdown, no explanation, no extra text:
[
  {
    "number": 1,
    "bias": "Confirmation Bias",
    "question": "...",
    "options": {
      "A": "...",
      "B": "...",
      "C": "...",
      "D": "..."
    },
    "scoring": { "A": 2, "B": 0, "C": 3, "D": 1 }
  },
  ... (continue to 40)
]`;

const response = await client.messages.create({
  model: 'claude-opus-4-7',
  max_tokens: 16000,
  messages: [{ role: 'user', content: prompt }],
});

const text = response.content.find(b => b.type === 'text')?.text ?? '';
process.stdout.write(text);
process.stdout.write('\n');
