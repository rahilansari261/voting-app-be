class SuccessResponse {
  success: boolean;
  message: string;
  data: any;
  error: any | null;

  constructor(message: string, data: any, error: any | null = null) {
    this.success = true;
    this.message = message || "Successfully completed the request";
    this.data = data || {};
    this.error = error || null;
  }
}

export default SuccessResponse;
