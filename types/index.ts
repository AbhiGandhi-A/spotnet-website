export type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
  details?: any;
};

// Add more types and enums as needed for models, events, etc.
