export interface AppErrorOptions {
  statusCode: number;
  code?: string;
  details?: unknown;
}

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: unknown;

  constructor(message: string, options: AppErrorOptions) {
    super(message);
    this.name = 'AppError';
    this.statusCode = options.statusCode;
    this.code = options.code ?? 'APP_ERROR';
    this.details = options.details;
  }
}
