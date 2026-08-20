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
