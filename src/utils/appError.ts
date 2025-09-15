class AppError extends Error {
  statusCode: number;
  explanation: string;

  constructor(message: string, statusCode: number, explanation: string) {
    super(message);
    this.statusCode = statusCode;
    this.explanation = explanation || "Something went wrong";
  }
}

export default AppError;
