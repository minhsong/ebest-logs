import type { ErrorEventWireDocument } from '../storage/error-event-wire';

export interface ErrorEventListResult {
  data: ErrorEventWireDocument[];
  nextCursor?: string;
  hasMore: boolean;
}
