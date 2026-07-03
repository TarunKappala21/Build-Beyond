# Redis Cache Map and Recommendations

This document maps current Redis cache usage in the backend and recommends the next endpoints to cache for maximum impact.

## Route mount context

All endpoints below are final paths under `/api` because route mounts are configured in `backend/app.js`.

- Admin routes mounted at `/api`
- Payment routes mounted at `/api/payment`

## Current endpoint cache status

| Endpoint | Cached in Redis | Current behavior | Notes |
|---|---:|---|---|
| `/api/admin/revenue/platform-intelligence` | Yes | Read-through cache using query-based key; returns cache hit payload; writes with TTL 180s | Core active Redis cache endpoint |
| `/api/admin/cache/redis-stats` | Yes | Route-level Redis cache (short TTL) for observability response | Script now uses cache-busted reads for live counters |
| `/api/admin/cache/redis-stats/reset` | No (write) | Resets Redis cache stats counters and invalidates admin GET cache | Observability write endpoint |
| `/api/admindashboard` | Yes | Route-level Redis cache with short TTL | Cached for admin read performance |
| `/api/admin/analytics` | Yes | Read-through cache with timeFilter-based key; TTL 120s | Newly implemented |
| `/api/admin/revenue` | Yes | Route-level Redis cache with short TTL | Cached for admin read performance |
| `/api/companyongoing_projects` | Yes | Per-company cache key (`company:ongoing-projects:v1`) | Implemented with targeted invalidation |
| `/api/ongoing_projects` | Yes | Per-customer cache key (`customer:ongoing-projects:v1`) | Implemented with targeted invalidation |

## Existing invalidation coverage

The following mutation flows invalidate both admin cache prefixes:

- `admin:platform-revenue-intelligence:v1`
- `admin:analytics:v1`

Mutation flows:

- `POST /api/company/platform-fee-invoice`
- `POST /api/payment/company/verify-payment`
- `POST /api/payment/company/release-milestone`
- `POST /api/payment/company/platform-fee/verify-payment`
- `POST /api/platform-manager/company-payments/:projectId/:milestonePercentage/collect`

## Best next 3 endpoints to cache (ranked)

| Priority | Endpoint | Why this is high impact | Suggested TTL |
|---|---|---|---|
| 1 | `/api/admindashboard` | Multi-collection dashboard loaded frequently by admins | 60-120s |
| 2 | `/api/ongoing_projects` | High user traffic path; repeated reads per customer session | 30-60s |
| 3 | `/api/companyongoing_projects` | Frequent company dashboard polling/navigation pattern | 30-60s |

## Implementation notes for next phase

1. Build cache keys with user and filter scope to avoid cross-user data leakage.
2. Use short TTLs first, then tune from real hit-rate metrics.
3. Add invalidation hooks on writes that impact each cached endpoint.
4. Keep graceful fallback: if Redis is unavailable, continue serving from DB.

## Benchmark script updates

The benchmark script at `backend/scripts/redis-cache-perf.js` now supports clear endpoint names per test and endpoint-level summaries.

### New capture options

- Single endpoint with explicit display name:
	- `node backend/scripts/redis-cache-perf.js --mode capture --label with-redis-one --endpointName "Admin Revenue" --endpoint "/api/admin/revenue" --requests 30 --baseUrl http://localhost:3000`
- Multiple endpoints with explicit names:
	- `node backend/scripts/redis-cache-perf.js --mode capture --label with-redis-multi --endpoints "Admin Dashboard::/api/admindashboard,Admin Revenue::/api/admin/revenue,Admin Analytics::/api/admin/analytics" --requests 20 --baseUrl http://localhost:3000`
- Built-in admin core suite:
	- `node backend/scripts/redis-cache-perf.js --mode capture --label with-redis-admin-core --endpointSuite admin-core --requests 20 --baseUrl http://localhost:3000`

### Compare runs (without Redis vs with Redis)

- `node backend/scripts/redis-cache-perf.js --mode compare --before no-redis-now --after with-redis-admin-core`

The compare output now includes endpoint-by-endpoint latency deltas and endpoint-specific hit/miss/sets metrics.
