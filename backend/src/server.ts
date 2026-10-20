import { app } from './app';
import { config } from './config';
import { prisma } from './db/prisma';

const HOST = process.env.HOST || '0.0.0.0';

const server = app.listen(config.port, HOST, () => {
  console.log(`[PayFlow Sandbox Backend] running on http://${HOST}:${config.port} (env: ${config.nodeEnv})`);
  console.log(`Health endpoint: http://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${config.port}/api/v1/health`);
});

// Graceful shutdown
const shutdown = async () => {
  console.log('Shutting down server gracefully...');
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
