export type NormalizedErrorForLog = {
    errorType: string;
    message: string;
    stack?: string;
};
export declare function formatErrorMessage(message: string | string[] | undefined): string;
/** Chuẩn hóa throw không phụ thuộc NestJS — dùng chung CRM API + Gateway. */
export declare function normalizeUnknownError(error: unknown): NormalizedErrorForLog;
//# sourceMappingURL=normalize.d.ts.map