export class OpenCodeError extends Error {
  constructor(
    public code: string,
    message: string,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = "OpenCodeError";
  }

  static fromError(error: Error, code: string): OpenCodeError {
    return new OpenCodeError(code, error.message);
  }

  toJSON() {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      details: this.details,
    };
  }
}
