export class NotFoundError extends Error {
  public statusCode: number;

  constructor(message: string = 'Resource not found') {
    super(message);
    this.statusCode = 404;
    this.name = 'NotFoundError';
    Error.captureStackTrace(this, this.constructor);
  }
}

export class InternalServerError extends Error {
  public statusCode: number;

  constructor(message: string = 'Internal server error') {
    super(message);
    this.statusCode = 500;
    this.name = 'InternalServerError';
    Error.captureStackTrace(this, this.constructor);
  }
}