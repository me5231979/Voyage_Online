// Compass: the Vanderbilt Voyage Online question helper.
// POST /api/compass  { messages: [{ role: 'user'|'assistant', content: '...' }] }
//   -> { answer, sources: [{ title, url }], blocked?: topic }
// Answers come from the course itself and from vanderbilt.edu pages that
// Claude searches and reads live (web search and web fetch, both limited to
// vanderbilt.edu). Benefits, pay, leave, personnel, medical, legal, and other
// sensitive topics are declined, first by lib/guard.js (before any call), then
// by the system prompt.
import Anthropic from '@anthropic-ai/sdk';
import { screen } from '../lib/guard.js';
import { COURSE_NOTES } from '../lib/course.js';

const client = new Anthropic(); // reads ANTHROPIC_API_KEY
const MODEL = process.env.COMPASS_MODEL || 'claude-opus-5-5';
const MAX_TURNS = 8, MAX_CHARS = 1200;

const SYSTEM = `You are Compass, the question helper inside Vanderbilt Voyage Online, the self-paced course that welcomes new Vanderbilt University staff.

Answer questions about the course and about Vanderbilt University: its mission, history, leadership, the four beliefs, campuses and cities, schools, research, rankings, and campus life.

Sources:
- For anything about the course, use the course notes below.
- For anything about the university, search vanderbilt.edu with web_search, and read pages with web_fetch when the snippet is not enough. Your tools can only reach vanderbilt.edu, which is the only source you may use. Do not answer university questions from memory: if you cannot find it on vanderbilt.edu, say so and suggest where on vanderbilt.edu to look.
- Cite the vanderbilt.edu pages you used.

Topics you must decline, even if asked indirectly or as a hypothetical: employee benefits of any kind (health, dental, vision, retirement, tuition, insurance, enrollment), pay, payroll and compensation, leave, time off and accommodations, workplace complaints, harassment, discrimination, discipline, termination and other personnel matters, and personal medical, legal, immigration, or account questions. For these, say in one or two sentences that Compass cannot help with that topic, and point the person to Vanderbilt Human Resources (hr.vanderbilt.edu) or their manager. Do not search for these topics. If someone seems to be in crisis or at risk of harming themselves, tell them to call or text 988, or 911 in an emergency.

Style: you are talking with a new staff member. Be warm and brief: two to five sentences, or a short list when the question asks for several things. Plain text only, no headings, no tables, no em dashes. Begin your answer right away. If a question is outside Vanderbilt and the course, say what Compass can help with instead.

<course_notes>
${COURSE_NOTES}
</course_notes>`;

const TOOLS = [
  { type: 'web_search_20260209', name: 'web_search', max_uses: 4, allowed_domains: ['vanderbilt.edu'] },
  { type: 'web_fetch_20260209', name: 'web_fetch', max_uses: 3, allowed_domains: ['vanderbilt.edu'], citations: { enabled: true }, max_content_tokens: 8000 }
];

/* best-effort limit per IP, per warm instance (set an Anthropic spend limit too) */
const hits = new Map();
function limited(ip) {
  const now = Date.now(), win = 10 * 60 * 1000, max = Number(process.env.COMPASS_RATE_LIMIT || 20);
  const list = (hits.get(ip) || []).filter((t) => now - t < win);
  list.push(now); hits.set(ip, list);
  return list.length > max;
}

function cors(req, res) {
  const allow = (process.env.COMPASS_ALLOWED_ORIGINS || '*').split(',').map((s) => s.trim());
  const origin = req.headers.origin || '';
  res.setHeader('Access-Control-Allow-Origin', allow.includes('*') ? '*' : (allow.includes(origin) ? origin : allow[0]));
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function clean(messages) {
  if (!Array.isArray(messages)) return null;
  const out = messages
    .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string' && m.content.trim())
    .slice(-MAX_TURNS)
    .map((m) => ({ role: m.role, content: m.content.trim().slice(0, MAX_CHARS) }));
  while (out.length && out[0].role !== 'user') out.shift();
  return out.length && out[out.length - 1].role === 'user' ? out : null;
}

const onlyVanderbilt = (u) => { try { const h = new URL(u).hostname; return h === 'vanderbilt.edu' || h.endsWith('.vanderbilt.edu'); } catch { return false; } };

function readAnswer(content) {
  let text = '';
  const seen = new Map();
  for (const b of content) {
    if (b.type !== 'text') continue;
    text += b.text;
    for (const c of b.citations || []) {
      if (c.url && onlyVanderbilt(c.url) && !seen.has(c.url)) seen.set(c.url, c.title || c.url);
    }
  }
  return { answer: text.trim(), sources: [...seen].slice(0, 5).map(([url, title]) => ({ title, url })) };
}

export default async function handler(req, res) {
  cors(req, res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Use POST.' });

  const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown';
  if (limited(ip)) return res.status(429).json({ error: 'Compass needs a short break. Please try again in a few minutes.' });

  const body = typeof req.body === 'string' ? (() => { try { return JSON.parse(req.body); } catch { return {}; } })() : (req.body || {});
  const messages = clean(body.messages);
  if (!messages) return res.status(400).json({ error: 'Ask a question to get started.' });

  const blocked = screen(messages[messages.length - 1].content);
  if (blocked) return res.status(200).json({ answer: blocked.answer, sources: blocked.sources, blocked: blocked.topic });

  try {
    const convo = messages.slice();
    let response;
    // a long server-side search turn can pause; send it back so the server continues
    for (let i = 0; i < 3; i++) {
      response = await client.beta.messages.create({
        model: MODEL,
        max_tokens: 8000,
        betas: ['server-side-fallback-2026-07-01'],
        fallbacks: 'default',
        output_config: { effort: 'low' },
        system: [{ type: 'text', text: SYSTEM, cache_control: { type: 'ephemeral' } }],
        tools: TOOLS,
        messages: convo
      });
      if (response.stop_reason !== 'pause_turn') break;
      convo.push({ role: 'assistant', content: response.content });
    }
    if (response.stop_reason === 'refusal') {
      return res.status(200).json({ answer: 'Compass can’t help with that one. Try a question about the course or about Vanderbilt.', sources: [] });
    }
    const out = readAnswer(response.content);
    if (!out.answer) out.answer = 'I could not find that on vanderbilt.edu. Try asking another way, or browse vanderbilt.edu directly.';
    return res.status(200).json(out);
  } catch (err) {
    if (err instanceof Anthropic.RateLimitError) return res.status(429).json({ error: 'Compass is busy right now. Please try again in a minute.' });
    if (err instanceof Anthropic.AuthenticationError) { console.error('Compass: check ANTHROPIC_API_KEY'); return res.status(503).json({ error: 'Compass is not set up yet.' }); }
    if (err instanceof Anthropic.APIError) { console.error('Compass API error', err.status, err.message); return res.status(502).json({ error: 'Compass could not answer just now. Please try again.' }); }
    console.error('Compass error', err);
    return res.status(500).json({ error: 'Compass could not answer just now. Please try again.' });
  }
}
