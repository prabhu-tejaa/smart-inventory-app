import mongoose from 'mongoose';

const ProductSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  category: { type: String, required: true, trim: true },
  buyPrice: { type: Number, required: true, min: 0 },
  sellPrice: { type: Number, required: true, min: 0 },
  quantity: { type: Number, required: true, min: 0 },
  expiryDate: { type: String, required: true },
  lowStockThreshold: { type: Number, default: 5 },
  createdAt: { type: Date, default: Date.now },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
});

const Product = mongoose.models.Product || mongoose.model('Product', ProductSchema);
export default Product;
