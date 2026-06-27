import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import type {
  ErrorLogActor,
  ErrorLogHttpContext,
  ErrorLogServiceName,
  ErrorLogSeverity,
  ErrorLogSource,
} from '@ebest/error-log-types';

export type ErrorEventMongoDocument = HydratedDocument<ErrorEvent>;

@Schema({
  collection: 'error_events',
  timestamps: false,
  versionKey: false,
})
export class ErrorEvent {
  @Prop({ required: true, unique: true, index: true })
  eventKey!: string;

  @Prop({ required: true, index: true })
  occurredAt!: Date;

  @Prop({ required: true })
  ingestedAt!: Date;

  @Prop({ index: true })
  requestId?: string;

  @Prop({ index: true })
  traceId?: string;

  @Prop({ required: true, index: true })
  service!: ErrorLogServiceName;

  @Prop({ required: true, index: true })
  environment!: string;

  @Prop({ required: true, index: true })
  severity!: ErrorLogSeverity;

  @Prop({ required: true, index: true })
  errorType!: string;

  @Prop({ required: true })
  message!: string;

  @Prop()
  stack?: string;

  @Prop({ required: true, index: true })
  fingerprint!: string;

  @Prop({ type: Object })
  http?: ErrorLogHttpContext;

  @Prop({ type: Object })
  actor?: ErrorLogActor;

  @Prop({ type: Object })
  context?: Record<string, unknown>;

  @Prop({ required: true })
  source!: ErrorLogSource;

  @Prop({ type: [String] })
  tags?: string[];
}

export const ErrorEventSchema = SchemaFactory.createForClass(ErrorEvent);

ErrorEventSchema.index({ occurredAt: -1 });
ErrorEventSchema.index({ service: 1, occurredAt: -1 });
ErrorEventSchema.index({ severity: 1, occurredAt: -1 });
ErrorEventSchema.index({ fingerprint: 1, occurredAt: -1 });
ErrorEventSchema.index(
  { occurredAt: 1 },
  { expireAfterSeconds: 90 * 24 * 60 * 60 },
);
