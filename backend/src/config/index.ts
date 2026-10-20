import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '4000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: process.env.DATABASE_URL || 'postgresql://payflow_user:payflow_password@localhost:5432/payflow_db?schema=public',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  webhookSecret: process.env.WEBHOOK_SECRET || 'whsec_sandbox_secret_key_12345',
  webhookDefaultUrl: process.env.WEBHOOK_DEFAULT_URL || '',
};
