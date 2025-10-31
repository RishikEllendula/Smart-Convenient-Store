import { Router } from 'express';
import Shop from '../models/Shop.js';
import { authRequired, requireOwner } from '../middleware/auth.js';


const router = Router();


// Create or update current owner's single shop
router.post('/me', authRequired, requireOwner, async (req, res) => {
const { name, address } = req.body;
if (!name) return res.status(400).json({ message: 'Shop name required' });
let shop = await Shop.findOne({ owner: req.user.id });
if (!shop) shop = await Shop.create({ name, address, owner: req.user.id });
else { shop.name = name; shop.address = address ?? shop.address; await shop.save(); }
res.json(shop);
});


router.get('/me', authRequired, requireOwner, async (req, res) => {
const shop = await Shop.findOne({ owner: req.user.id });
res.json(shop);
});


// Public: list shops
router.get('/', async (_req, res) => {
const shops = await Shop.find().select('name address');
res.json(shops);
});


router.get('/:id', async (req, res) => {
const shop = await Shop.findById(req.params.id).select('name address');
if (!shop) return res.status(404).json({ message: 'Not found' });
res.json(shop);
});


export default router;