export abstract class AppError extends Error {
  abstract statusCode: number;
  abstract code: string;
  readonly isOperational: boolean = true;

  public constructor(message: string) {
    super(message);
    Error.captureStackTrace(this, this.constructor);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
