import { app } from './app';
import { config } from './config';
import { prisma } from './db/prisma';

const server = app.listen(config.port, () => {
  console.log(`[PayFlow Sandbox Backend] running on port ${config.port} (env: ${config.nodeEnv})`);
  console.log(`Health endpoint: http://localhost:${config.port}/api/v1/health`);
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
