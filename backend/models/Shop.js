import mongoose from 'mongoose';


const ShopSchema = new mongoose.Schema({
name: { type: String, required: true },
address: { type: String, default: '' },
owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true }
}, { timestamps: true });


export default mongoose.model('Shop', ShopSchema);