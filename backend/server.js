const express = require('express');
const mongoose = require('mongoose');
const dns = require('dns');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const mongoSanitize = require('express-mongo-sanitize');
const rateLimit = require('express-rate-limit');
const { startOrderAutoTracker } = require('./utils/orderAutoTracker');
require('dotenv').config();

const app = express();

// ── Security Middleware ────────────────────────────────────
app.use(helmet());
app.use(mongoSanitize());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: { success: false, message: 'Too many requests, please try again later.' }
});
if (process.env.NODE_ENV === 'production') {
  app.use('/api/', limiter);
}

// ── CORS ──────────────────────────────────────────────────
const defaultAllowedOrigins = ['http://localhost:3000', 'http://127.0.0.1:3000'];
const envAllowedOrigins = String(process.env.CLIENT_URL || '')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);
const allowedOrigins = [...new Set([...defaultAllowedOrigins, ...envAllowedOrigins])];

function normalizeOrigin(origin) {
  try {
    const parsed = new URL(origin);
    return parsed.origin;
  } catch {
    return origin;
  }
}

function isLoopbackOrigin(origin) {
  try {
    const parsed = new URL(origin);
    return parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1';
  } catch {
    return false;
  }
}

app.use(cors({
  origin(origin, callback) {
    // Allow non-browser requests (no Origin header).
    if (!origin) {
      return callback(null, true);
    }

    const normalized = normalizeOrigin(origin);
    const normalizedAllowed = allowedOrigins.map(normalizeOrigin);

    // In development, allow localhost/127.0.0.1 from any port.
    if (process.env.NODE_ENV !== 'production' && isLoopbackOrigin(normalized)) {
      return callback(null, true);
    }

    if (normalizedAllowed.includes(normalized)) {
      return callback(null, true);
    }

    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true
}));

// ── Body Parser ───────────────────────────────────────────
// Increase request body size to accommodate analytics payloads and admin uploads.
// Keep this reasonably bounded to avoid abuse; adjust as needed.
app.use(express.json({ limit: process.env.BODY_PARSER_LIMIT || '10mb' }));
app.use(express.urlencoded({ extended: true, limit: process.env.BODY_PARSER_LIMIT || '10mb' }));

// ── Logger ────────────────────────────────────────────────
if (process.env.NODE_ENV === 'development') app.use(morgan('dev'));

// ── Routes ────────────────────────────────────────────────
app.use('/api/auth',     require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/orders',   require('./routes/orders'));
app.use('/api/reviews',  require('./routes/reviews'));
app.use('/api/users',    require('./routes/users'));
app.use('/api/admin',    require('./routes/admin'));
app.use('/api/assistant', require('./routes/assistant'));
app.use('/api/ai', require('./routes/ai'));

// ── Health Check ──────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'GadgetGlam API is running 🚀', env: process.env.NODE_ENV });
});

// ── 404 Handler ───────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// ── Global Error Handler ──────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// ── MongoDB Atlas Connection (or Mock Mode) ───────────────
// Some networks/routers break SRV DNS lookups used by `mongodb+srv://`.
// Force reliable public DNS resolvers at runtime to keep local dev working.
if (typeof process.env.MONGODB_URI === 'string' && process.env.MONGODB_URI.startsWith('mongodb+srv://')) {
  try { dns.setServers(['1.1.1.1', '1.0.0.1', '8.8.8.8', '8.8.4.4']); } catch {}
}

const PORT = process.env.PORT || 5000;

if (process.env.MOCK_DB === 'true' || !process.env.MONGODB_URI) {
  console.warn('⚠️  Mock DB mode enabled — skipping MongoDB connection');
  // Start server without DB for quick local testing of routes (AI endpoints will still work).
  app.listen(PORT, () => console.log(`🚀 Server running (mock DB) on port ${PORT}`));
} else {
  mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
      console.log('✅ MongoDB Atlas connected successfully');
      try { startOrderAutoTracker(); } catch (e) { /* best-effort */ }
      app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
    })
    .catch(err => {
      console.error('❌ MongoDB connection failed:', err.message);
      console.warn('You can set MOCK_DB=true to start server without a DB for development.');
      process.exit(1);
    });
}

module.exports = app;
