// server.js (ESM)

import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const app = express();

/* ------------ Config ------------ */
const PORT = process.env.PORT || 4000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/smart_stores';
const JWT_SECRET = process.env.JWT_SECRET || 'dev-super-secret';

/* ------------ Middleware ------------ */
app.use(cors({ origin: '*' }));
app.use(express.json());

/* ------------ DB ------------ */
mongoose.connect(MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('Mongo error', err));

/* ------------ Schemas ------------ */
const UserSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true, index: true },
  passwordHash: String,
  role: { type: String, enum: ['Owner', 'Customer'], default: 'Customer' }
}, { timestamps: true });

const ShopSchema = new mongoose.Schema({
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  name: String,
  address: String
}, { timestamps: true });

const ItemSchema = new mongoose.Schema({
  shopId: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop' },
  shopName: String,
  name: String,
  price: Number,
  unit: String
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model('User', UserSchema);
const Shop = mongoose.models.Shop || mongoose.model('Shop', ShopSchema);
const Item = mongoose.models.Item || mongoose.model('Item', ItemSchema);

/* ------------ Helpers ------------ */
function normalizeRole(r) {
  if (!r) return 'Customer';
  const k = String(r).toLowerCase();
  return k === 'owner' ? 'Owner' : 'Customer';
}
function signToken(user) {
  return jwt.sign(
    { id: user._id, email: user.email, role: user.role, name: user.name },
    JWT_SECRET, { expiresIn: '7d' }
  );
}
function authRequired(req, res, next) {
  const auth = req.headers.authorization; // Bearer <token>
  if (!auth?.startsWith('Bearer ')) return res.status(401).json({ message: 'Missing token' });
  const token = auth.slice(7);
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    // Normalize role from any legacy lowercase tokens/documents
    req.user = { ...payload, role: normalizeRole(payload.role) };
    next();
  } catch {
    return res.status(401).json({ message: 'Invalid token' });
  }
}
function ownerOnly(req, res, next) {
  if (normalizeRole(req.user?.role) !== 'Owner') return res.status(403).json({ message: 'Owners only' });
  next();
}

/* ------------ Auth ------------ */
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email and password required' });

    const exists = await User.findOne({ email });
    if (exists) return res.status(409).json({ message: 'Email already in use' });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, passwordHash, role: normalizeRole(role) });

    if (user.role === 'Owner') {
      await Shop.create({ ownerId: user._id, name: `${user.name}'s Shop`, address: '' });
    }

    const token = signToken(user);
    res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Registration failed' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body; // role ignored to be lenient
  const user = await User.findOne({ email });
  if (!user) return res.status(401).json({ message: 'Invalid credentials' });

  const ok = await bcrypt.compare(password, user.passwordHash || '');
  if (!ok) return res.status(401).json({ message: 'Invalid credentials' });

  // Ensure consistent casing regardless of how it was stored
  const normalizedRole = normalizeRole(user.role);
  if (user.role !== normalizedRole) {
    try { user.role = normalizedRole; await user.save(); } catch {/* non-fatal */}
  }
  const token = signToken({ ...user.toObject(), role: normalizedRole });
  res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: normalizedRole } });
});

/* ------------ Owner (authed) ------------ */
// My shop
app.get('/api/shops/me', authRequired, ownerOnly, async (req, res) => {
  const shop = await Shop.findOne({ ownerId: req.user.id });
  res.json(shop || {});
});

app.post('/api/shops', authRequired, ownerOnly, async (req, res) => {
  const { name, address } = req.body;
  let shop = await Shop.findOne({ ownerId: req.user.id });
  if (shop) {
    shop.name = name; shop.address = address;
    await shop.save();
    await Item.updateMany({ shopId: shop._id }, { $set: { shopName: shop.name } });
  } else {
    shop = await Shop.create({ ownerId: req.user.id, name, address });
  }
  res.json(shop);
});

// My items
app.get('/api/items/mine', authRequired, ownerOnly, async (req, res) => {
  const shop = await Shop.findOne({ ownerId: req.user.id });
  if (!shop) return res.json([]);
  const items = await Item.find({ shopId: shop._id }).sort({ name: 1 });
  res.json(items);
});

app.post('/api/items', authRequired, ownerOnly, async (req, res) => {
  const { name, price, unit } = req.body;
  const shop = await Shop.findOne({ ownerId: req.user.id });
  if (!shop) return res.status(400).json({ message: 'Create your shop first.' });
  const item = await Item.create({
    shopId: shop._id, shopName: shop.name, name, price: Number(price), unit
  });
  res.json(item);
});

app.put('/api/items/:id', authRequired, ownerOnly, async (req, res) => {
  const { id } = req.params;
  const { name, price, unit } = req.body;
  const shop = await Shop.findOne({ ownerId: req.user.id });
  if (!shop) return res.status(400).json({ message: 'Create your shop first.' });

  const item = await Item.findOneAndUpdate(
    { _id: id, shopId: shop._id },
    { $set: { name, price: Number(price), unit } },
    { new: true }
  );
  if (!item) return res.status(404).json({ message: 'Item not found' });
  res.json(item);
});

app.delete('/api/items/:id', authRequired, ownerOnly, async (req, res) => {
  const { id } = req.params;
  const shop = await Shop.findOne({ ownerId: req.user.id });
  if (!shop) return res.status(400).json({ message: 'Create your shop first.' });
  const del = await Item.findOneAndDelete({ _id: id, shopId: shop._id });
  if (!del) return res.status(404).json({ message: 'Item not found' });
  res.json({ ok: true });
});

/* ------------ Public browse/compare ------------ */
app.get('/api/shops', async (_req, res) => {
  const shops = await Shop.find().select('_id name address').sort({ name: 1 });
  res.json(shops);
});

// items by shop (public, read-only)
app.get('/api/items/by-shop/:shopId', async (req, res) => {
  const items = await Item.find({ shopId: req.params.shopId })
    .select('_id name price unit shopId shopName')
    .sort({ name: 1 });
  res.json(items);
});

app.get('/api/items', async (req, res) => {
  const { name = '', fuzzy = '' } = req.query;
  const q = String(name).trim();
  if (!q) return res.json([]);
  const cond = (fuzzy === '1')
    ? { name: new RegExp(q, 'i') }
    : { name: new RegExp(`^${q}$`, 'i') };
  const items = await Item.find(cond).select('name price unit shopName shopId');
  res.json(items);
});

app.get('/api/items/compare', async (req, res) => {
  const { name } = req.query;
  if (!name) return res.json([]);
  const items = await Item.find({ name: new RegExp(`^${name}$`, 'i') })
    .select('price unit shopName shopId');
  res.json(items);
});

/* ------------ Health ------------ */
app.get('/health', (_req, res) => res.json({ ok: true }));

/* ------------ Start ------------ */
app.listen(PORT, () => console.log(`Server listening on ${PORT}`));
