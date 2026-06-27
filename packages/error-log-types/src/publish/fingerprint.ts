import { createHash } from 'node:crypto';

function normalizeMessage(message: string): string {
  return message.replace(/\d+/g, '#').trim().slice(0, 200);
}

function topStackFrame(stack?: string): string {
  if (!stack?.trim()) {
    return '';
  }
  const line = stack.split('\n').find((l) => l.trim().startsWith('at '));
  return line?.trim() ?? '';
}

/** Nhóm lỗi giống nhau trên UI — SSOT producer + consumer. */
export function buildErrorFingerprint(input: {
  service: string;
  errorType: string;
  message: string;
  stack?: string;
}): string {
  const raw = [
    input.service,
    input.errorType,
    normalizeMessage(input.message),
    topStackFrame(input.stack),
  ].join('|');
  return createHash('sha256').update(raw).digest('hex').slice(0, 32);
}
