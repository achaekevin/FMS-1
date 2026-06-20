require('dotenv').config();
const express      = require('express');
const cors         = require('cors');
const helmet       = require('helmet');
const rateLimit    = require('express-rate-limit');
const swaggerUi    = require('swagger-ui-express');
const swaggerSpec  = require('./config/swagger');
const requestLogger = require('./middleware/requestLogger');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const routes = require('./routes');

const app = express();

// ── Security middleware ───────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || '*',
  credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' },
});
app.use('/api', limiter);

// Stricter limiter for auth
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: 'Too many login attempts, please try again later.' },
});
app.use('/api/auth/login', authLimiter);

// ── Body parsing ───────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Logging ────────────────────────────────────────────────
app.use(requestLogger);

// ── Static uploads ────────────────────────────────────────
app.use('/uploads', express.static('uploads'));

// Ensure upload sub-directories exist
const fs   = require('fs');
const path = require('path');
['uploads/receipts','uploads/payslips','uploads/documents','backups'].forEach(dir => {
  const full = path.join(__dirname, dir);
  if (!fs.existsSync(full)) fs.mkdirSync(full, { recursive: true });
});

// ── Swagger docs ───────────────────────────────────────────
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customSiteTitle: 'Church Finance API Docs',
}));

// ── Routes ─────────────────────────────────────────────────
app.use('/api', routes);

app.get('/', (req, res) => {
  res.json({
    success: true,
    message: `${process.env.CHURCH_NAME || 'Grace Life Church'} Financial Management System API v2.0`,
    docs: '/api-docs',
    health: '/api/health',
  });
});

// ── 404 + Error handling ───────────────────────────────────
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
