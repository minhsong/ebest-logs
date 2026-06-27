import type { ActivityEventPublishPayload } from '@ebest/crm-api-types/events/activity-log';
/** Document trả về từ query API / CRM proxy (Mongo projection, không phải Mongoose HydratedDocument). */
export interface ActivityEventWireDocument extends ActivityEventPublishPayload {
    _id?: string;
    id?: string;
    occurredAt: string;
    ingestedAt?: string;
    eventKey?: string;
}
/** Alias theo ACTIVITY_LOG_TYPES_MIGRATION_PLAN — prefer ActivityEventWireDocument. */
export type ActivityEventDocument = ActivityEventWireDocument;
//# sourceMappingURL=activity-event-wire.d.ts.map