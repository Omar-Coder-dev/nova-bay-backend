export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    // Identifies this as a operational error (user input / business logic), not a code crash
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}