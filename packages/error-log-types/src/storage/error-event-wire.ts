import type { ErrorEventPublishPayload } from '../publish/envelope';

export interface ErrorEventWireDocument extends ErrorEventPublishPayload {
  _id?: string;
  id?: string;
  occurredAt: string;
  ingestedAt?: string;
  eventKey?: string;
}
