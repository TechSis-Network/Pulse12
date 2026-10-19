export interface AppError extends Error {
  status?: number;
  data?: { extra_data?: { reason?: string } };
}

export function asError(value: unknown): AppError {
  return value instanceof Error ? value : new Error(String(value));
}
