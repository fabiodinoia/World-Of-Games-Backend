import dotenv from 'dotenv';

dotenv.config();

const DEFAULT_ORIGINS = ['http://localhost:4200'];

export const parseOrigins = (value?: string): string[] => {
  const origins = (value ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  return origins.length > 0 ? origins : DEFAULT_ORIGINS;
};

export const config = {
  // Full connection string (preferred). Legacy Atlas vars are the fallback.
  mongoUri: process.env.MONGODB_URI,
  user: process.env.USERNAME,
  pass: process.env.PASSWORD,
  cluster: process.env.CLUSTER,
  dbname: process.env.NAME || 'worldofgames',
  jwtsecret: process.env.SECRET,
  port: Number(process.env.PORT) || 4800,
  corsOrigins: parseOrigins(process.env.CORS_ORIGINS),
};
