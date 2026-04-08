export type AppErrorCode =
  | "UNAUTHENTICATED"
  | "DB_ERROR"
  | "NOT_FOUND"
  | "UNKNOWN";

export class AppError extends Error {
  readonly code: AppErrorCode;

  constructor(code: AppErrorCode, message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "AppError";
    this.code = code;
  }
}

export function authError(): AppError {
  return new AppError("UNAUTHENTICATED", "로그인이 필요합니다");
}

export function dbError(cause: unknown): AppError {
  return new AppError("DB_ERROR", "데이터베이스 오류가 발생했어요", { cause });
}

const STATUS_MAP: Record<AppErrorCode, number> = {
  UNAUTHENTICATED: 401,
  NOT_FOUND: 404,
  DB_ERROR: 500,
  UNKNOWN: 500,
};

export function statusFor(err: AppError): number {
  return STATUS_MAP[err.code];
}
