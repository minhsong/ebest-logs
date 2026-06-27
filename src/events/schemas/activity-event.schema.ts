import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import type {
  ActivityActor,
  ActivityChange,
  ActivityEntityRefs,
  ActivitySnapshots,
} from '@ebest/crm-api-types/events/activity-log';

/** Mongoose hydrated document — không trùng ActivityEventWireDocument (query API). */
export type ActivityEventMongoDocument = HydratedDocument<ActivityEvent>;

@Schema({
  collection: 'activity_events',
  timestamps: false,
  versionKey: false,
})
export class ActivityEvent {
  @Prop({ required: true, unique: true, index: true })
  eventKey!: string;

  @Prop({ required: true })
  occurredAt!: Date;

  @Prop({ required: true })
  ingestedAt!: Date;

  @Prop({ index: true })
  requestId?: string;

  @Prop({ index: true })
  correlationId?: string;

  @Prop({ type: Object, required: true })
  actor!: ActivityActor;

  @Prop({ required: true, index: true })
  action!: string;

  @Prop({ required: true, index: true })
  category!: string;

  @Prop({ required: true })
  severity!: string;

  @Prop({ type: Object, required: true })
  refs!: ActivityEntityRefs;

  @Prop({ type: Object, required: true })
  snapshots!: ActivitySnapshots;

  @Prop({ required: true })
  summary!: string;

  @Prop({ type: Object })
  change?: ActivityChange;

  @Prop({ required: true })
  source!: string;

  @Prop({ required: true })
  module!: string;

  @Prop()
  endpoint?: string;

  @Prop({ type: [String] })
  tags?: string[];
}

export const ActivityEventSchema = SchemaFactory.createForClass(ActivityEvent);

ActivityEventSchema.index({ occurredAt: -1 });
ActivityEventSchema.index({ 'refs.customerId': 1, occurredAt: -1 });
ActivityEventSchema.index({ 'refs.invoiceId': 1, occurredAt: -1 });
ActivityEventSchema.index({ 'refs.classId': 1, occurredAt: -1 });
ActivityEventSchema.index({ 'refs.targetClassId': 1, occurredAt: -1 });
ActivityEventSchema.index({ 'actor.userId': 1, occurredAt: -1 });
ActivityEventSchema.index({ category: 1, occurredAt: -1 });
ActivityEventSchema.index({ action: 1, occurredAt: -1 });
ActivityEventSchema.index(
  { module: 1, occurredAt: -1, _id: -1 },
  { name: 'module_1_occurredAt_-1__id_-1' },
);
ActivityEventSchema.index(
  { severity: 1, occurredAt: -1, _id: -1 },
  { name: 'severity_1_occurredAt_-1__id_-1' },
);
ActivityEventSchema.index(
  { module: 1, severity: 1, occurredAt: -1, _id: -1 },
  { name: 'module_1_severity_1_occurredAt_-1__id_-1' },
);
ActivityEventSchema.index(
  { requestId: 1, occurredAt: -1, _id: -1 },
  { name: 'requestId_1_occurredAt_-1__id_-1' },
);
ActivityEventSchema.index(
  { occurredAt: 1 },
  { expireAfterSeconds: 365 * 24 * 60 * 60 },
);
