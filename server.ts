import app from "./backend/server.js";
import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

const PORT = 3000;

async function bootstrap() {
  // If we are in dev mode, mount Vite middleware
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { 
        middlewareMode: true,
        hmr: false
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("🛠️ Vite development server middleware integrated");
  } else {
    // In production, serve the compiled vite bundle from /dist
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
    console.log("📦 Production static assets mounted from /dist");
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Smart Inventory Fullstack Server running at http://localhost:${PORT}`);
  });
}

bootstrap();
