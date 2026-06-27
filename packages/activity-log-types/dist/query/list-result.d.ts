import type { ActivityEventWireDocument } from '../storage/activity-event-wire';
export interface ActivityEventListResult {
    data: ActivityEventWireDocument[];
    nextCursor?: string;
    hasMore: boolean;
}
//# sourceMappingURL=list-result.d.ts.map