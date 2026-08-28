import { DatabaseConfigError } from "@/lib/db/prisma";

export class ApiError extends Error {
  constructor(
    message: string,
    public status = 500,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function jsonError(message: string, status = 400) {
  return Response.json({ error: message }, { status });
}

export function toApiErrorResponse(
  error: unknown,
  fallbackMessage: string,
  fallbackStatus = 500,
) {
  if (error instanceof DatabaseConfigError) {
    return jsonError(error.message, 503);
  }
  const message = error instanceof Error ? error.message : fallbackMessage;
  return jsonError(message, fallbackStatus);
}
