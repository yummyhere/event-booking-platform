import app from '../backend/src/app.js';
import { config } from '../backend/src/config/env.js';
import { initializeDatabase } from '../backend/src/config/db.js';

let databaseReady;

export default async function handler(request, response) {
  if (!config.jwtSecret) {
    return response.status(500).json({ success: false, message: 'Server configuration is incomplete.' });
  }
  if (!config.tursoDatabaseUrl || !config.tursoAuthToken) {
    return response.status(500).json({
      success: false,
      message: 'Set TURSO_DATABASE_URL and TURSO_AUTH_TOKEN for the Vercel deployment.'
    });
  }

  databaseReady ||= initializeDatabase();
  try {
    await databaseReady;
  } catch (error) {
    databaseReady = null;
    console.error('Could not initialize the database:', error);
    return response.status(500).json({ success: false, message: 'Database initialization failed.' });
  }

  return app(request, response);
}