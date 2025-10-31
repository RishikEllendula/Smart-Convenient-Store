import jwt from 'jsonwebtoken';


export function authRequired(req, res, next) {
const header = req.headers.authorization || '';
const token = header.startsWith('Bearer ') ? header.slice(7) : null;
if (!token) return res.status(401).json({ message: 'No token' });
try {
const payload = jwt.verify(token, process.env.JWT_SECRET);
req.user = payload; // { id, role }
next();
} catch {
return res.status(401).json({ message: 'Invalid token' });
}
}


export function requireOwner(req, res, next) {
if (req.user?.role !== 'owner') return res.status(403).json({ message: 'Owner role required' });
next();
}