"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildErrorFingerprint = buildErrorFingerprint;
const node_crypto_1 = require("node:crypto");
function normalizeMessage(message) {
    return message.replace(/\d+/g, '#').trim().slice(0, 200);
}
function topStackFrame(stack) {
    if (!stack?.trim()) {
        return '';
    }
    const line = stack.split('\n').find((l) => l.trim().startsWith('at '));
    return line?.trim() ?? '';
}
/** Nhóm lỗi giống nhau trên UI — SSOT producer + consumer. */
function buildErrorFingerprint(input) {
    const raw = [
        input.service,
        input.errorType,
        normalizeMessage(input.message),
        topStackFrame(input.stack),
    ].join('|');
    return (0, node_crypto_1.createHash)('sha256').update(raw).digest('hex').slice(0, 32);
}
