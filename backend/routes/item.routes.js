import { Router } from 'express';
import Item from '../models/Item.js';
import Shop from '../models/Shop.js';
import { authRequired, requireOwner } from '../middleware/auth.js';


const router = Router();


// Owner: upsert item in own shop
router.post('/upsert', authRequired, requireOwner, async (req, res) => {
const { name, price, unit } = req.body;
if (!name || price == null) return res.status(400).json({ message: 'name and price required' });
const shop = await Shop.findOne({ owner: req.user.id });
if (!shop) return res.status(400).json({ message: 'Create your shop first' });
const existing = await Item.findOne({ shop: shop._id, name });
if (existing) { existing.price = price; if (unit) existing.unit = unit; await existing.save(); return res.json(existing); }
const item = await Item.create({ shop: shop._id, name, price, unit });
res.json(item);
});


// Public: items of a shop
router.get('/by-shop/:shopId', async (req, res) => {
const items = await Item.find({ shop: req.params.shopId }).select('name price unit');
res.json(items);
});


// Public: compare price of item across shops (exact name match)
router.get('/compare', async (req, res) => {
const { name } = req.query;
if (!name) return res.status(400).json({ message: 'name query required' });
const results = await Item.aggregate([
{ $match: { name: String(name) } },
{ $lookup: { from: 'shops', localField: 'shop', foreignField: '_id', as: 'shop' } },
{ $unwind: '$shop' },
{ $project: { price: 1, unit: 1, shopName: '$shop.name', shopId: '$shop._id' } },
{ $sort: { price: 1 } }
]);
res.json(results);
});


export default router;