import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: Number(process.env.PORT) || 5000,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1d',
  dbPath: process.env.DB_PATH || './database/events.db',
  tursoDatabaseUrl: process.env.TURSO_DATABASE_URL,
  tursoAuthToken: process.env.TURSO_AUTH_TOKEN,
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173'
};