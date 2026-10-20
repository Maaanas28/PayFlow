export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: unknown;

  constructor(statusCode: number, code: string, message: string, details?: unknown) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
  }

  static badRequest(message: string, code = 'BAD_REQUEST', details?: unknown): AppError {
    return new AppError(400, code, message, details);
  }

  static notFound(message: string, code = 'NOT_FOUND'): AppError {
    return new AppError(404, code, message);
  }

  static conflict(message: string, code = 'CONFLICT', details?: unknown): AppError {
    return new AppError(409, code, message, details);
  }

  static internal(message = 'Internal server error', code = 'INTERNAL_ERROR'): AppError {
    return new AppError(500, code, message);
  }
}
