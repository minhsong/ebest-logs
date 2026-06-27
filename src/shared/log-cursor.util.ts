import { Types } from 'mongoose';

/** Cursor compound: `{occurredAtMs}_{mongoId}` — sort occurredAt DESC, _id DESC. */
export function encodeLogCursor(occurredAt: Date, id: string): string {
  return `${occurredAt.getTime()}_${id}`;
}

export function parseLogCursor(
  cursor: string,
): { occurredAt: Date; id: Types.ObjectId } | null {
  const sep = cursor.indexOf('_');
  if (sep <= 0) {
    return null;
  }
  const ts = Number(cursor.slice(0, sep));
  const id = cursor.slice(sep + 1);
  if (!Number.isFinite(ts) || !id || !Types.ObjectId.isValid(id)) {
    return null;
  }
  return { occurredAt: new Date(ts), id: new Types.ObjectId(id) };
}
