import type { ErrorEventPublishPayload } from './envelope';
export type ErrorPayloadValidationResult = {
    ok: true;
    payload: ErrorEventPublishPayload;
} | {
    ok: false;
    reason: string;
};
export declare function validateErrorIngestPayload(raw: unknown): ErrorPayloadValidationResult;
//# sourceMappingURL=validate-ingest.d.ts.map