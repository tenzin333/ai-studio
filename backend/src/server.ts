// src/server.ts
import app from "./app.js";
import "dotenv-config";
import { initDB } from "./lib/db.js";

const PORT = process.env.PORT || 5000;

// Initialize database once at startup
initDB()
  .then(() => {
    console.log('Database initialized');
    
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to initialize database:', err);
    process.exit(1);
  });

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, closing database...');
  const { closeDB } = await import('./lib/db.js');
  await closeDB();
  process.exit(0);
});