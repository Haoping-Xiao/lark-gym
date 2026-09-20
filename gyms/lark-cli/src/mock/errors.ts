export class ApiError extends Error {
  status: number;
  code: number;
  constructor(status: number, code: number, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}
export function fail(status: number, code: number, message: string): never {
  throw new ApiError(status, code, message);
}
export function requireValue(ok: unknown, message: string): asserts ok {
  if (!ok) fail(400, 99992402, message);
}
