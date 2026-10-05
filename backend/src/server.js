import app from './app.js';
import { config } from './config/env.js';
import { initializeDatabase } from './config/db.js';

try {
  if (!config.jwtSecret) throw new Error('JWT_SECRET is required. Copy backend/.env.example to backend/.env and set a secret.');
  await initializeDatabase();
  app.listen(config.port, () => console.log(`Event platform API listening on http://localhost:${config.port}`));
} catch (error) {
  console.error('Could not initialize the database:', error);
  process.exit(1);
}