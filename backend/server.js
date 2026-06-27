import 'dotenv/config';
import express from 'express';
import { connectDB, isMongoConnected } from './config/db.js';
import productsRoute from './routes/products.js';
import salesRoute from './routes/sales.js';
import authRoute from './routes/auth.js';

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize the database connection (Mongo / Offline fallback)
connectDB().then(success => {
  if (success) {
    console.log("Database initialized in MongoDB mode.");
  } else {
    console.log("Database initialized in Flat-File Offline mode.");
  }
}).catch(err => {
  console.error("Critical error during database initialization:", err);
});

// Endpoint to fetch current DB deployment mode
app.get('/api/db-status', (req, res) => {
  res.json({
    connected: isMongoConnected(),
    mode: isMongoConnected() ? "MongoDB Atlas Realtime Mode" : "Local JSON Flat-File Failover",
    info: isMongoConnected() 
      ? "Connected securely to MongoDB Atlas cluster." 
      : "MongoDB offline. Working in fully-functional hybrid offline failover."
  });
});

// Mount APIs
app.use('/api/auth', authRoute);
app.use('/api/products', productsRoute);
app.use('/api/sales', salesRoute);

export default app;
