import mongoose from 'mongoose';

const SaleSchema = new mongoose.Schema({
  productId: { type: String, required: true },
  productName: { type: String, required: true },
  qtySold: { type: Number, required: true, min: 1 },
  buyPrice: { type: Number, required: true },
  sellPrice: { type: Number, required: true },
  profit: { type: Number, required: true },
  soldAt: { type: Date, default: Date.now },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
});

const Sale = mongoose.models.Sale || mongoose.model('Sale', SaleSchema);
export default Sale;
