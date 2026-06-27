import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';

let mongoConnected = false;

// Ensure directories and files exist
const dataDir = path.join(process.cwd(), 'data');
const productsFile = path.join(dataDir, 'products.json');
const salesFile = path.join(dataDir, 'sales.json');

function ensureDataFiles() {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  if (!fs.existsSync(productsFile)) {
    fs.writeFileSync(productsFile, JSON.stringify([], null, 2), 'utf-8');
  }
  if (!fs.existsSync(salesFile)) {
    fs.writeFileSync(salesFile, JSON.stringify([], null, 2), 'utf-8');
  }
}

// Run immediately
ensureDataFiles();

export async function connectDB() {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!uri) {
    console.warn("⚠️ MONGODB_URI/MONGO_URI is missing. Switched to hybrid local flat-file storage database mode.");
    mongoConnected = false;
    return false;
  }
  
  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000
    });
    console.log("🚀 Connected to MongoDB Atlas successfully!");
    mongoConnected = true;
    return true;
  } catch (err) {
    console.error("❌ Failed to connect to MongoDB Atlas:", err.message);
    console.warn("⚠️ Switched to hybrid local flat-file storage database mode because MongoDB Atlas is offline/unreachable.");
    mongoConnected = false;
    return false;
  }
}

export function isMongoConnected() {
  return mongoConnected && mongoose.connection && mongoose.connection.readyState === 1;
}

// Flat-file Database Helpers
export function readProductsJSON() {
  try {
    ensureDataFiles();
    const data = fs.readFileSync(productsFile, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    console.error("Error reading products JSON:", err);
    return [];
  }
}

export function writeProductsJSON(products) {
  try {
    ensureDataFiles();
    fs.writeFileSync(productsFile, JSON.stringify(products, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error("Error writing products JSON:", err);
    return false;
  }
}

export function readSalesJSON() {
  try {
    ensureDataFiles();
    const data = fs.readFileSync(salesFile, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    console.error("Error reading sales JSON:", err);
    return [];
  }
}

export function writeSalesJSON(sales) {
  try {
    ensureDataFiles();
    fs.writeFileSync(salesFile, JSON.stringify(sales, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error("Error writing sales JSON:", err);
    return false;
  }
}
