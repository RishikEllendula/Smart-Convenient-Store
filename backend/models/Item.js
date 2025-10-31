import mongoose from 'mongoose';


const ItemSchema = new mongoose.Schema({
shop: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', required: true },
name: { type: String, required: true, index: true },
price: { type: Number, required: true, min: 0 },
unit: { type: String, default: 'unit' }
}, { timestamps: true });


ItemSchema.index({ name: 1, shop: 1 }, { unique: true });


export default mongoose.model('Item', ItemSchema);