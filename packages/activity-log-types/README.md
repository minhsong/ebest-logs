# @ebest/activity-log-types

Type wire do **Activity Log service** sở hữu — query API + document trả về từ Mongo.

## Export

- `ActivityEventQueryParams` — mirror `GET /internal/v1/events`
- `ActivityEventListResult` — `{ data, nextCursor?, hasMore }`
- `ActivityEventWireDocument` — publish payload + `_id`, `id`, timestamps
- `ActivityEventDocument` — alias của `ActivityEventWireDocument`

## Phụ thuộc

```json
{
  "peerDependencies": {
    "@ebest/crm-api-types": "^0.2.0"
  }
}
```

Wire document **extends** publish shape từ `@ebest/crm-api-types/events/activity-log`.

## Build

```bash
# Build crm-api-types trước
cd ebest-crm-api/packages/crm-api-types && npm run build

cd ebest-logs/packages/activity-log-types
npm install
npm run build
```

Log service `prebuild` build cả hai package.

## Deploy độc lập (`ebest-logs`)

Prod: `npm ci` chỉ cần `@ebest/crm-api-types@^0.2.x` + `@ebest/activity-log-types@^0.2.x`.
