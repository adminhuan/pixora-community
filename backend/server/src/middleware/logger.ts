import morgan from 'morgan';
import { morganStream } from '../utils/logger';

export const requestLogger = morgan(':method :url :status :response-time ms - :res[content-length]', {
  stream: morganStream
});
