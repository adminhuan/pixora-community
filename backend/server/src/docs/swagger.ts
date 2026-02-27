import path from 'path';
import swaggerJsdoc from 'swagger-jsdoc';
import { config } from '../config';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: process.env.SWAGGER_TITLE?.trim() || '社区 API',
      version: '1.0.0',
      description: process.env.SWAGGER_DESCRIPTION?.trim() || '社区后端 API 文档'
    },
    servers: [{ url: `${config.baseUrl}${config.apiPrefix}`, description: 'Default API server' }]
  },
  apis: [path.join(__dirname, '../routes/**/*.{ts,js}')]
};

export const swaggerSpec = swaggerJsdoc(options);
