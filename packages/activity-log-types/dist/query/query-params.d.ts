/** Query params cho GET /internal/v1/events — mirror ActivityEventQueryDto. */
export interface ActivityEventQueryParams {
    cursor?: string;
    limit?: number;
    customerId?: number;
    invoiceId?: number;
    classId?: number;
    userId?: number;
    category?: string;
    action?: string;
    module?: string;
    severity?: string;
    from?: string;
    to?: string;
    requestId?: string;
    q?: string;
}
//# sourceMappingURL=query-params.d.ts.map