import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/auth.js';
import { requirePermission } from '../rbac.js';

const router = express.Router();
const prisma = new PrismaClient();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = process.env.UPLOAD_DIR || path.join(__dirname, '../../uploads');

const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (_req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();
    callback(null, `gallery-${Date.now()}-${Math.random().toString(36).slice(2, 8)}${extension}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, callback) => {
    callback(null, file.mimetype.startsWith('image/'));
  },
});

const galleryInclude = {
  album: true,
  category: true,
  event: true,
};

function parseBoolean(value, fallback = false) {
  if (value === undefined || value === null || value === '') return fallback;
  return value === true || value === 'true' || value === '1';
}

function parseOrder(value) {
  const order = Number(value);
  return Number.isInteger(order) && order >= 0 ? order : 0;
}

function galleryData(body, file, existing = {}) {
  return {
    title: String(body.title ?? existing.title ?? '').trim(),
    description: body.description === undefined ? (existing.description ?? null) : String(body.description).trim() || null,
    imageUrl: file ? `/uploads/${file.filename}` : String(body.imageUrl ?? existing.imageUrl ?? '').trim(),
    albumId: body.albumId || existing.albumId || null,
    categoryId: body.categoryId || existing.categoryId || null,
    eventId: body.eventId || existing.eventId || null,
    displayOrder: body.displayOrder === undefined ? (existing.displayOrder ?? 0) : parseOrder(body.displayOrder),
    published: body.published === undefined ? (existing.published ?? false) : parseBoolean(body.published),
  };
}

router.get('/', async (_req, res) => {
  const gallery = await prisma.galleryImage.findMany({
    where: { published: true },
    orderBy: [{ displayOrder: 'asc' }, { createdAt: 'desc' }],
    include: galleryInclude,
  });
  res.json({ gallery });
});

router.get('/albums', async (_req, res) => {
  const albums = await prisma.galleryAlbum.findMany({
    where: { images: { some: { published: true } } },
    orderBy: { name: 'asc' },
  });
  res.json({ albums });
});

router.get('/categories', async (_req, res) => {
  const categories = await prisma.galleryCategory.findMany({
    where: { images: { some: { published: true } } },
    orderBy: { name: 'asc' },
  });
  res.json({ categories });
});

router.use(authMiddleware);

router.post('/', requirePermission('admin:gallery:create'), async (req, res) => {
  const data = galleryData(req.body, null);
  if (!data.title || !data.imageUrl) {
    return res.status(400).json({ message: 'Title and image URL are required.' });
  }

  const gallery = await prisma.galleryImage.create({ data: { ...data, createdById: req.user.id }, include: galleryInclude });
  res.status(201).json({ gallery });
});

router.post('/upload', requirePermission('admin:gallery:create'), upload.single('image'), async (req, res) => {
  const data = galleryData(req.body, req.file);
  if (!data.title || !req.file) {
    return res.status(400).json({ message: 'An image and title are required.' });
  }

  const gallery = await prisma.galleryImage.create({ data: { ...data, createdById: req.user.id }, include: galleryInclude });
  res.status(201).json({ gallery });
});

router.post('/albums', requirePermission('admin:gallery:create'), async (req, res) => {
  const name = String(req.body.name ?? '').trim();
  if (!name) return res.status(400).json({ message: 'Album name is required.' });
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const album = await prisma.galleryAlbum.create({ data: { name, slug, description: req.body.description || null } });
  res.status(201).json({ album });
});

router.post('/categories', requirePermission('admin:gallery:create'), async (req, res) => {
  const name = String(req.body.name ?? '').trim();
  if (!name) return res.status(400).json({ message: 'Category name is required.' });
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const category = await prisma.galleryCategory.create({ data: { name, slug, description: req.body.description || null } });
  res.status(201).json({ category });
});

router.put('/:id', requirePermission('admin:gallery:update'), upload.single('image'), async (req, res) => {
  const current = await prisma.galleryImage.findUnique({ where: { id: req.params.id } });
  if (!current) return res.status(404).json({ message: 'Gallery item not found.' });

  const data = galleryData(req.body, req.file, current);
  if (!data.title || !data.imageUrl) return res.status(400).json({ message: 'Title and image are required.' });

  const gallery = await prisma.galleryImage.update({ where: { id: current.id }, data, include: galleryInclude });
  res.json({ gallery });
});

router.delete('/:id', requirePermission('admin:gallery:delete'), async (req, res) => {
  const deleted = await prisma.galleryImage.deleteMany({ where: { id: req.params.id } });
  if (!deleted.count) return res.status(404).json({ message: 'Gallery item not found.' });
  res.json({ message: 'Gallery item deleted.' });
});

export default router;
