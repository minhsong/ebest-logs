export type NormalizedErrorForLog = {
  errorType: string;
  message: string;
  stack?: string;
};

export function formatErrorMessage(
  message: string | string[] | undefined,
): string {
  if (message == null) {
    return 'Unknown error';
  }
  if (Array.isArray(message)) {
    return message.map(String).join('; ').slice(0, 2000);
  }
  return String(message).slice(0, 2000);
}

/** Chuẩn hóa throw không phụ thuộc NestJS — dùng chung CRM API + Gateway. */
export function normalizeUnknownError(error: unknown): NormalizedErrorForLog {
  if (error instanceof Error) {
    return {
      errorType: error.constructor.name || 'Error',
      message: error.message || 'Unknown error',
      stack: error.stack,
    };
  }

  if (typeof error === 'string') {
    return { errorType: 'StringError', message: error.slice(0, 2000) };
  }

  try {
    return {
      errorType: 'NonErrorThrowable',
      message: JSON.stringify(error).slice(0, 2000),
    };
  } catch {
    return { errorType: 'NonErrorThrowable', message: String(error) };
  }
}
