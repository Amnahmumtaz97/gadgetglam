const path = require('path');
const { generateJSONResponse, generateFromPromptFile } = require('../services/geminiService');

// Helpers
function buildProductFromAI(parsed) {
  if (!parsed || typeof parsed !== 'object') return null;
  return {
    name: parsed.productName || parsed.name || '',
    short_description: parsed.shortDescription || parsed.short_description || '',
    description: parsed.fullDescription || parsed.description || '',
    tags: Array.isArray(parsed.tags) ? parsed.tags : [],
    focus_keywords: Array.isArray(parsed.focusKeywords) ? parsed.focusKeywords : [],
    faqs: Array.isArray(parsed.faqs) ? parsed.faqs : [],
    variants: Array.isArray(parsed.variants) ? parsed.variants : [],
    seo: {
      meta_title: parsed.seoTitle || parsed.meta?.ogTitle || '',
      meta_description: parsed.seoDescription || parsed.meta?.ogDescription || '',
      meta_keywords: Array.isArray(parsed.tags) ? parsed.tags.slice(0, 12) : []
    }
  };
}

async function generateDraft(req, res) {
  try {
    const { title = '', description = '' } = req.body || {};
    if (!String(title).trim() && !String(description).trim()) {
      return res.status(400).json({ success: false, message: 'Provide title or description' });
    }

    // Use prompt template if present
    const promptFile = path.join(__dirname, '..', 'prompts', 'productGenerator.txt');
    const { parsed, raw } = await generateFromPromptFile(promptFile, { title, description }, { temperature: 0.42, maxOutputTokens: 700 });

    if (!parsed) {
      return res.status(502).json({ success: false, message: 'AI returned invalid JSON', raw });
    }

    const draft = buildProductFromAI(parsed);
    if (!draft) return res.status(500).json({ success: false, message: 'Failed to build draft from AI' });

    return res.json({ success: true, draft, raw });
  } catch (err) {
    console.error('generateDraft error', err);
    return res.status(500).json({ success: false, message: err.message || 'AI generation failed' });
  }
}

async function chat(req, res) {
  try {
    const { message = '', context = {} } = req.body || {};
    if (!String(message).trim()) return res.status(400).json({ success: false, message: 'Message is required' });

    const promptText = `You are an ecommerce assistant. Store context: ${JSON.stringify(context)}\nUser: ${message}\nRespond in JSON with keys {message, recommendedProducts, relatedAccessories}`;
    const { parsed, raw } = await generateJSONResponse({ promptText, temperature: 0.3, maxOutputTokens: 400 });
    if (!parsed) return res.status(502).json({ success: false, message: 'AI returned invalid JSON', raw });
    return res.json({ success: true, response: parsed, raw });
  } catch (err) {
    console.error('chat error', err);
    return res.status(500).json({ success: false, message: err.message || 'AI chat failed' });
  }
}

async function analytics(req, res) {
  try {
    const { data = {} } = req.body || {};
    const promptText = `You are an AI ecommerce analyst. DATA: ${JSON.stringify(data)}\nReturn concise JSON with keys: salesSummary, topProducts, poorProducts, seoRecommendations, actionItems`;
    const { parsed, raw } = await generateJSONResponse({ promptText, temperature: 0.2, maxOutputTokens: 800 });
    if (!parsed) return res.status(502).json({ success: false, message: 'AI returned invalid JSON', raw });
    return res.json({ success: true, analytics: parsed, raw });
  } catch (err) {
    console.error('analytics error', err);
    return res.status(500).json({ success: false, message: err.message || 'AI analytics failed' });
  }
}

module.exports = { generateDraft, chat, analytics };
