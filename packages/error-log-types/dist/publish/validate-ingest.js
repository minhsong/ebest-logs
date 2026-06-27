"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateErrorIngestPayload = validateErrorIngestPayload;
const MAX_PAYLOAD_BYTES = 16 * 1024;
const MAX_STACK_BYTES = 8 * 1024;
function validateErrorIngestPayload(raw) {
    if (!raw || typeof raw !== 'object') {
        return { ok: false, reason: 'payload is not an object' };
    }
    const payload = raw;
    if (!payload.service?.trim()) {
        return { ok: false, reason: 'missing service' };
    }
    if (!payload.severity) {
        return { ok: false, reason: 'missing severity' };
    }
    if (!payload.errorType?.trim()) {
        return { ok: false, reason: 'missing errorType' };
    }
    if (!payload.message?.trim()) {
        return { ok: false, reason: 'missing message' };
    }
    if (!payload.fingerprint?.trim()) {
        return { ok: false, reason: 'missing fingerprint' };
    }
    if (!payload.source) {
        return { ok: false, reason: 'missing source' };
    }
    if (payload.stack && Buffer.byteLength(payload.stack, 'utf8') > MAX_STACK_BYTES) {
        payload.stack = payload.stack.slice(0, MAX_STACK_BYTES);
    }
    const size = Buffer.byteLength(JSON.stringify(payload), 'utf8');
    if (size > MAX_PAYLOAD_BYTES) {
        return { ok: false, reason: `payload exceeds ${MAX_PAYLOAD_BYTES} bytes` };
    }
    return { ok: true, payload };
}
