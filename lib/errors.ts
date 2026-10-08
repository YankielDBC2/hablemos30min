export class AppError extends Error {
  constructor(message: string, public status = 400, public code = "INVALID_REQUEST") {
    super(message);
    this.name = "AppError";
  }
}
