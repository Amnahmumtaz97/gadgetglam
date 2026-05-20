const express = require('express');
const router = express.Router();
const { generateDraft, chat, analytics } = require('../controllers/aiController');
const { protect, adminOnly } = require('../middleware/auth');

// Public chatbot endpoint
router.post('/chat', chat);

// Admin-only draft generator
router.post('/generate-draft', protect, adminOnly, generateDraft);

// Admin-only analytics
router.post('/analytics', protect, adminOnly, analytics);

module.exports = router;
