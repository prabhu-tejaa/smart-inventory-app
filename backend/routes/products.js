import express from 'express';
import { isMongoConnected, readProductsJSON, writeProductsJSON } from '../config/db.js';
import Product from '../models/Product.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();
router.use(requireAuth);

// GET /api/products - Fetch all products ordered ascendingly by expiryDate
router.get('/', async (req, res) => {
  try {
    if (isMongoConnected()) {
      const filter = req.user.role === 'admin' ? {} : { user: req.user.id };
      const products = await Product.find(filter).sort({ expiryDate: 1 });
      return res.json(products);
    } else {
      let products = readProductsJSON();
      if (req.user.role !== 'admin') {
        products = products.filter(p => p.userId === req.user.id);
      }
      // Sort ascendingly by expiryDate
      products.sort((a, b) => {
        const dateA = a.expiryDate || '';
        const dateB = b.expiryDate || '';
        return dateA.localeCompare(dateB);
      });
      return res.json(products);
    }
  } catch (err) {
    console.error("GET /api/products error:", err);
    return res.status(500).json({ error: "Failed to retrieve products.", details: err.message });
  }
});

// POST /api/products - Parse and create a new product entry
router.post('/', async (req, res) => {
  try {
    const { name, category, buyPrice, sellPrice, quantity, expiryDate, lowStockThreshold } = req.body;

    // Form-validation
    if (!name || name.trim() === '') {
      return res.status(400).json({ error: "Product name is required." });
    }
    if (!category || category.trim() === '') {
      return res.status(400).json({ error: "Category is required." });
    }
    
    const parsedBuyPrice = Number(buyPrice);
    const parsedSellPrice = Number(sellPrice);
    const parsedQuantity = Number(quantity);
    const parsedThreshold = lowStockThreshold !== undefined ? Number(lowStockThreshold) : 5;

    if (isNaN(parsedBuyPrice) || parsedBuyPrice < 0) {
      return res.status(400).json({ error: "Buy price must be a positive number." });
    }
    if (isNaN(parsedSellPrice) || parsedSellPrice < 0) {
      return res.status(400).json({ error: "Sell price must be a positive number." });
    }
    if (isNaN(parsedQuantity) || parsedQuantity < 0) {
      return res.status(400).json({ error: "Quantity must be a positive number." });
    }
    if (!expiryDate || !/^\d{4}-\d{2}-\d{2}$/.test(expiryDate)) {
      return res.status(400).json({ error: "Expiry Date must be in YYYY-MM-DD format." });
    }

    if (isMongoConnected()) {
      const newProduct = new Product({
        name: name.trim(),
        category: category.trim(),
        buyPrice: parsedBuyPrice,
        sellPrice: parsedSellPrice,
        quantity: parsedQuantity,
        expiryDate,
        lowStockThreshold: parsedThreshold,
        user: req.user.id
      });
      const saved = await newProduct.save();
      return res.status(201).json(saved);
    } else {
      const products = readProductsJSON();
      const newProduct = {
        _id: "local_p_" + Date.now() + "_" + Math.floor(Math.random() * 1000),
        name: name.trim(),
        category: category.trim(),
        buyPrice: parsedBuyPrice,
        sellPrice: parsedSellPrice,
        quantity: parsedQuantity,
        expiryDate,
        lowStockThreshold: parsedThreshold,
        createdAt: new Date().toISOString(),
        userId: req.user.id
      };
      products.push(newProduct);
      writeProductsJSON(products);
      return res.status(201).json(newProduct);
    }
  } catch (err) {
    console.error("POST /api/products error:", err);
    return res.status(500).json({ error: "Failed to create product.", details: err.message });
  }
});

// PUT /api/products/:id - Adjust/update a specific product's inventory stock quantity directly
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity } = req.body;

    const parsedQuantity = Number(quantity);
    if (isNaN(parsedQuantity) || parsedQuantity < 0) {
      return res.status(400).json({ error: "Quantity must be a valid positive number." });
    }

    if (isMongoConnected()) {
      const filter = req.user.role === 'admin' ? { _id: id } : { _id: id, user: req.user.id };
      const updated = await Product.findOneAndUpdate(
        filter,
        { quantity: parsedQuantity },
        { new: true, runValidators: true }
      );
      if (!updated) {
        return res.status(404).json({ error: "Product not found." });
      }
      return res.json(updated);
    } else {
      const products = readProductsJSON();
      const index = products.findIndex(p => p._id === id && (req.user.role === 'admin' || p.userId === req.user.id));
      if (index === -1) {
        return res.status(404).json({ error: "Product not found in local inventory storage." });
      }
      products[index].quantity = parsedQuantity;
      writeProductsJSON(products);
      return res.json(products[index]);
    }
  } catch (err) {
    console.error("PUT /api/products/:id error:", err);
    return res.status(500).json({ error: "Failed to update stock quantity.", details: err.message });
  }
});

export default router;
