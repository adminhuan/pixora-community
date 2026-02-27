import http from 'http';
import { app } from './app';
import { config } from './config';
import { connectDatabase, disconnectDatabase } from './config/database';
import { closeRedisClient, getRedisClient } from './config/redis';
import { ipBlacklistService } from './services/admin/ipBlacklist.service';
import { ipWhitelistService } from './services/admin/ipWhitelist.service';
import { initRealtimeServer } from './services/realtime.service';
import { sensitiveWordService } from './services/sensitiveWord.service';
import { logger } from './utils/logger';

const server = http.createServer(app);
initRealtimeServer(server);

const bootstrap = async (): Promise<void> => {
  try {
    await connectDatabase();
  } catch (error) {
    logger.error('PostgreSQL 启动连接失败，服务终止', { error });
    process.exit(1);
  }

  getRedisClient();

  await ipBlacklistService.init().catch((err) => {
    logger.warn('IP黑名单加载失败，将继续启动', { error: err });
  });

  await ipWhitelistService.init().catch((err) => {
    logger.warn('IP白名单加载失败，将继续启动', { error: err });
  });

  await sensitiveWordService.init().catch((err) => {
    logger.warn('敏感词缓存加载失败，将继续启动', { error: err });
  });

  server.listen(config.port, () => {
    logger.info(`Server started at ${config.baseUrl}`);
  });
};

void bootstrap();

const shutdown = async (): Promise<void> => {
  logger.info('Shutting down server...');
  server.close(async () => {
    await Promise.allSettled([disconnectDatabase(), closeRedisClient()]);
    process.exit(0);
  });
};

process.on('SIGINT', () => {
  void shutdown();
});

process.on('SIGTERM', () => {
  void shutdown();
});
