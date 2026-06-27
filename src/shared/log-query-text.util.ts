/** Token tra cứu nhanh — requestId, correlationId, eventKey, fingerprint. */
const EXACT_LOOKUP_TOKEN = /^[a-zA-Z0-9._-]{8,128}$/;

export function isExactLookupToken(value: string): boolean {
  const trimmed = value.trim();
  return trimmed.length > 0 && !trimmed.includes(' ') && EXACT_LOOKUP_TOKEN.test(trimmed);
}

export function isLikelyFingerprint(value: string): boolean {
  return /^[a-f0-9]{32}$/i.test(value.trim());
}
