import 'express-async-errors';
import compression from 'compression';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import hpp from 'hpp';
import path from 'path';
import swaggerUi from 'swagger-ui-express';
import { config } from './config';
import { corsOptions } from './config/cors';
import { swaggerSpec } from './docs/swagger';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/logger';
import { ipBlock } from './middleware/ipBlock';
import { apiRateLimiter } from './middleware/rateLimiter';
import { apiRouter } from './routes';

export const app = express();

app.disable('x-powered-by');

if (config.security.trustProxy) {
  app.set('trust proxy', 1);
}

app.use(
  helmet({
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    contentSecurityPolicy: config.security.enableHelmetCsp
      ? {
          useDefaults: true,
          directives: {
            defaultSrc: ["'self'"],
            connectSrc: ["'self'", 'https:'],
            imgSrc: ["'self'", 'https:', 'data:', 'blob:'],
            styleSrc: ["'self'", "'unsafe-inline'", 'https:'],
            scriptSrc: ["'self'", "'unsafe-inline'", 'https:']
          }
        }
      : false,
    hsts:
      config.env === 'production'
        ? {
            maxAge: config.security.hstsMaxAgeSeconds,
            includeSubDomains: true,
            preload: false
          }
        : false
  })
);
app.use(cors(corsOptions));
app.use(compression());
app.use(hpp());
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));
app.use(requestLogger);
app.use(apiRateLimiter);
app.use(ipBlock);

app.use('/uploads', express.static(path.resolve(process.cwd(), config.upload.dir)));

if (config.swaggerEnabled) {
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
}

app.use(config.apiPrefix, apiRouter);

app.use(notFoundHandler);
app.use(errorHandler);
