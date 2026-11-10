import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

import authRoutes from './src/routes/authRoutes.js';
import publicRoutes from './src/routes/publicRoutes.js';
import studentRoutes from './src/routes/studentRoutes.js';
import teacherRoutes from './src/routes/teacherRoutes.js';
import adminRoutes from './src/routes/adminRoutes.js';
import dashboardRoutes from './src/routes/dashboardRoutes.js';
import galleryRoutes from './src/routes/galleryRoutes.js';
import admissionRoutes from './src/routes/admissionRoutes.js';
import { ensureDevelopmentData } from './prisma/ensure-development-data.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const port = Number(process.env.PORT || 5000);
const isProduction = process.env.NODE_ENV === 'production';

if (isProduction && (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32)) {
  throw new Error('JWT_SECRET must be configured with at least 32 characters in production.');
}

if (isProduction) app.set('trust proxy', 1);

const allowedOrigins = new Set([
  ...(process.env.CLIENT_URL
    ? process.env.CLIENT_URL.split(',').map((origin) => origin.trim())
    : isProduction
      ? []
      : ['http://localhost:5173']),
  process.env.RENDER_EXTERNAL_URL,
  process.env.RENDER_EXTERNAL_HOSTNAME && `https://${process.env.RENDER_EXTERNAL_HOSTNAME}`,
].filter(Boolean));

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.has(origin)) return callback(null, true);
    return callback(new Error('Origin is not allowed by CORS.'));
  },
  credentials: true,
}));
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(
  '/api',
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 500,
    standardHeaders: true,
    legacyHeaders: false,
  }),
);

const uploadDir = process.env.UPLOAD_DIR || path.join(__dirname, '../uploads');
fs.mkdirSync(uploadDir, { recursive: true });
app.use('/uploads', express.static(uploadDir));

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', app: 'SRISAI MODEL SCHOOL API' });
});

app.use('/api/auth', authRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/teacher', teacherRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/gallery', galleryRoutes);
app.use('/api/admin/admission-enquiries', admissionRoutes);

const frontendDir = path.join(__dirname, '../dist');
const frontendEntry = path.join(frontendDir, 'index.html');
if (isProduction) {
  if (!fs.existsSync(frontendEntry)) {
    throw new Error('Production frontend build is missing. Run `npm run build` before starting the server.');
  }

  app.use(express.static(frontendDir, { index: false }));
  app.use((req, res, next) => {
    if (
      req.method !== 'GET'
      || req.path === '/api'
      || req.path.startsWith('/api/')
      || req.path === '/uploads'
      || req.path.startsWith('/uploads/')
    ) {
      return next();
    }

    return res.sendFile(frontendEntry, (error) => {
      if (error) next(error);
    });
  });
}

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ message: 'Internal server error' });
});

if (!isProduction) await ensureDevelopmentData();

app.listen(port, () => {
  console.log(`SRISAI MODEL SCHOOL API running on http://localhost:${port}`);
});