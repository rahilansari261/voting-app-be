class ErrorResponse {
  success: boolean;
  message: string;
  data: any;
  error: any | null;

  constructor(message: string, data: any, error: any | null = null) {
    this.success = false;
    this.message = message || "Something went wrong";
    this.data = data || {};
    this.error = error || null;
  }
}

export default ErrorResponse;
