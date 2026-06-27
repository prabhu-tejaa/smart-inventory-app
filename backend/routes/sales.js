import express from 'express';
import { isMongoConnected, readProductsJSON, writeProductsJSON, readSalesJSON, writeSalesJSON } from '../config/db.js';
import Product from '../models/Product.js';
import Sale from '../models/Sale.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();
router.use(requireAuth);

// GET /api/sales - Fetch complete transactional checkout sales sorted descendingly by soldAt
router.get('/', async (req, res) => {
  try {
    if (isMongoConnected()) {
      const filter = req.user.role === 'admin' ? {} : { user: req.user.id };
      const sales = await Sale.find(filter).sort({ soldAt: -1 });
      return res.json(sales);
    } else {
      let sales = readSalesJSON();
      if (req.user.role !== 'admin') {
        sales = sales.filter(s => s.userId === req.user.id);
      }
      // Sort descendingly by soldAt datetime
      sales.sort((a, b) => {
        const dateA = new Date(a.soldAt || 0);
        const dateB = new Date(b.soldAt || 0);
        return dateB.getTime() - dateA.getTime();
      });
      return res.json(sales);
    }
  } catch (err) {
    console.error("GET /api/sales error:", err);
    return res.status(500).json({ error: "Failed to retrieve sales receipts logs.", details: err.message });
  }
});

// POST /api/sales - Perform a synchronized storefront transaction event
router.post('/', async (req, res) => {
  try {
    const { productId, qtySold } = req.body;
    const parsedQty = Number(qtySold);

    if (!productId) {
      return res.status(400).json({ error: "Product ID is required manually or from selection." });
    }
    if (isNaN(parsedQty) || parsedQty < 1) {
      return res.status(400).json({ error: "Quantity sold must be a vital positive number (minimum 1)." });
    }

    if (isMongoConnected()) {
      // Sync on MongoDB Atlas database
      const filter = req.user.role === 'admin' ? { _id: productId } : { _id: productId, user: req.user.id };
      const product = await Product.findOne(filter);
      if (!product) {
        return res.status(404).json({ error: "Product not found in Atlas database." });
      }

      if (product.quantity < parsedQty) {
        return res.status(400).json({ 
          error: `Insufficient stock in inventory. Requested: ${parsedQty}, Available: ${product.quantity}` 
        });
      }

      // Deduct stock quantity
      product.quantity -= parsedQty;
      await product.save();

      // Net profit = (sellPrice - buyPrice) * qtySold
      const profit = (product.sellPrice - product.buyPrice) * parsedQty;

      // Log receipt
      const newSale = new Sale({
        productId: product._id.toString(),
        productName: product.name,
        qtySold: parsedQty,
        buyPrice: product.buyPrice,
        sellPrice: product.sellPrice,
        profit,
        soldAt: new Date(),
        user: req.user.id
      });

      const savedSale = await newSale.save();
      return res.status(201).json(savedSale);

    } else {
      // Local flat-file fallback transaction
      const products = readProductsJSON();
      const pIndex = products.findIndex(p => p._id === productId && (req.user.role === 'admin' || p.userId === req.user.id));
      if (pIndex === -1) {
        return res.status(404).json({ error: "Product not found in custom offline inventory." });
      }

      const product = products[pIndex];
      if (product.quantity < parsedQty) {
        return res.status(400).json({ 
          error: `Insufficient stock in inventory. Requested: ${parsedQty}, Available: ${product.quantity}` 
        });
      }

      // Subtract qty from product details
      product.quantity -= parsedQty;
      writeProductsJSON(products);

      // Profit calculation
      const profit = (product.sellPrice - product.buyPrice) * parsedQty;

      const sales = readSalesJSON();
      const newSale = {
        _id: "local_s_" + Date.now() + "_" + Math.floor(Math.random() * 1000),
        productId: product._id,
        productName: product.name,
        qtySold: parsedQty,
        buyPrice: product.buyPrice,
        sellPrice: product.sellPrice,
        profit,
        soldAt: new Date().toISOString(),
        userId: req.user.id
      };
      
      sales.push(newSale);
      writeSalesJSON(sales);

      return res.status(201).json(newSale);
    }
  } catch (err) {
    console.error("POST /api/sales txn error:", err);
    return res.status(500).json({ error: "Storefront transaction failed to process.", details: err.message });
  }
});

export default router;
