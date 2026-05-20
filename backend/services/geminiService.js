const { GoogleGenerativeAI } = require('@google/generative-ai');
const { readFileSync } = require('fs');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const DEFAULT_MODEL = process.env.GEMINI_MODEL || 'gemini-1.5-pro';

if (!GEMINI_API_KEY) {
  console.warn('GEMINI_API_KEY not set — Gemini service will not be available');
}

function getClient() {
  if (!GEMINI_API_KEY) return null;
  // The SDK accepts either a key string or an options object depending on version.
  try {
    return new GoogleGenerativeAI({ apiKey: GEMINI_API_KEY });
  } catch (err) {
    return new GoogleGenerativeAI(GEMINI_API_KEY);
  }
}

function safeJsonParse(raw) {
  if (!raw) return null;
  try { return JSON.parse(raw); } catch (e) {
    const s = String(raw || '');
    const start = s.indexOf('{');
    const end = s.lastIndexOf('}');
    if (start === -1 || end === -1) return null;
    try { return JSON.parse(s.slice(start, end + 1)); } catch { return null; }
  }
}

async function generateJSONResponse({ promptText, model = DEFAULT_MODEL, temperature = 0.45, maxOutputTokens = 700 }) {
  // Mock mode for local development when GEMINI_API_KEY is missing or MOCK_AI=true
  if (process.env.MOCK_AI === 'true' || !GEMINI_API_KEY) {
    const mock = {
      productName: 'Mock Slim MagSafe Case',
      slug: 'mock-slim-magsafe-case',
      seoTitle: 'Slim MagSafe Case — Mock | GadgetGlam',
      seoDescription: 'A mock slim MagSafe-compatible protective case with premium finish and everyday protection.',
      shortDescription: 'Slim protective MagSafe case with premium feel.',
      fullDescription: 'This mock slim MagSafe case combines lightweight protection with a premium matte finish. Designed for perfect compatibility and wireless charging.',
      features: ['Slim profile', 'MagSafe compatible', 'Anti-scratch finish'],
      specifications: [{ key: 'Material', value: 'TPU + PC' }],
      compatibility: ['iPhone 14', 'iPhone 14 Pro'],
      focusKeywords: ['MagSafe case', 'slim case', 'iPhone 14 case'],
      tags: ['magsafe', 'slim', 'protective'],
      category: 'Cases',
      faqs: [{ question: 'Is it MagSafe compatible?', answer: 'Yes, fully compatible.' }],
      variants: [{ name: 'Black', color: 'Black', material: 'TPU' }],
    };
    return { raw: JSON.stringify(mock), parsed: mock };
  }

  const client = getClient();
  if (!client) throw new Error('Gemini client not available (missing GEMINI_API_KEY)');

  const modelRef = client.getGenerativeModel({ model });

  const contents = [{ role: 'user', parts: [{ text: promptText }] }];

  const result = await modelRef.generateContent({
    contents,
    generationConfig: { temperature, maxOutputTokens }
  });

  const rawText = result?.response?.text?.() || result?.output?.[0]?.content?.[0]?.text || '';
  const parsed = safeJsonParse(rawText);
  return { raw: rawText, parsed };
}

async function generateFromPromptFile(filePath, vars = {}, options = {}) {
  const tpl = readFileSync(filePath, 'utf8');
  const promptText = tpl.replace(/\$\{(\w+)\}/g, (_, name) => String(vars[name] || ''));
  return generateJSONResponse({ promptText, ...options });
}

module.exports = { generateJSONResponse, generateFromPromptFile };
