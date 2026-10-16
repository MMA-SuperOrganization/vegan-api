# Redis cache and MongoDB standalone

The user explicitly requested Redis on 2026-10-15. This overrides the older source specification's Redis prohibition. The application uses the official `redis` client. Connection credentials belong only in runtime configuration; no real URL is included here.

## Configuration

```dotenv
REDIS_URL=redis://localhost:6379/0
REDIS_KEY_PREFIX=vegeta
REDIS_CACHE_TTL_SECONDS=60
REDIS_COMMAND_TIMEOUT_MS=1000
MONGODB_STANDALONE_REDIS_ENABLED=true
```

The effective namespace includes `MONGODB_DB_NAME`. All API instances sharing a database must use the same Redis server, namespace and standalone flag. Restart the API after configuring it. Compose forwards these variables; it does not provision a Redis server. A configured Redis connection must succeed at startup within a five-second handshake deadline. Redis command responses have a separate deadline (REDIS_COMMAND_TIMEOUT_MS, default 1000 ms, range 100–10000). Expired commands discard their connection and reconnect; later requests can reconnect a client whose SDK retry budget has ended. Redis connection failures are logged without provider error bodies or credentials.

## Cache

Cache-aside covers categories, allergens, food search/detail, public recipe/post/video lists, anonymous home/search/suggestions and public app configuration. Validation and authentication still run before cache access. Authenticated contexts bypass shared caching, including admin queries for inactive records. Personal data, AI results, health, video playback URLs and media signed URLs are not cached.

Keys hash validated parameters and include a shared random generation. Entries expire after 60 seconds by default (configurable 1–600); payloads larger than 512 KiB are skipped. Repository mutations invalidate the shared generation; native transaction commits invalidate it again after commit so readers cannot fill the new generation with uncommitted data. Older generations expire naturally. Cache reads/writes fail open to MongoDB. An invalidation failure can leave public results stale until their TTL expires. There is no `FLUSHDB` or `FLUSHALL`.

## Standalone behavior

Startup detects topology with `hello`. Replica sets and mongos retain native MongoDB transactions. Standalone coordination is enabled only by the explicit flag and requires Redis. API transaction callbacks execute through one shared coordinator; repository reads and writes also enter that coordinator, so cooperating API instances cannot observe another workflow halfway through its writes.

1. Acquire a random-owner Redis lock (`SET NX PX`, 30-second lease, wait up to 3 seconds).
2. Insert the non-expiring MongoDB `_standalone_operation` guard. A leftover guard blocks further repository operations, including cached reads on standalone.
3. Before each create/update/delete, durably record the complete stored document (including select:false and legacy fields) and ID in the MongoDB journal. Sorted updates/deletes pin the selected document ID. Upserts receive an ID before writing. Journal and commit records request journaled acknowledgement.
4. Close the coordination scope and drain started mutations before committing or rolling back. Delayed child callbacks cannot reuse a closed scope. Any failed mutation aborts the workflow even if the callback catches that error. Commit by marking the guard committed, invalidating cache and removing the guard. On a normal failure, restore journal entries in reverse order and remove the guard only after restoration succeeds.

Lock acquisition waits at most three seconds by default. Contending callers can receive HTTP 503 with `DATABASE_BUSY` before their workflow starts; they may retry after the active operation completes. Remote Redis latency reduces the number of workflows that can fit in this window. A successful request must never be retried merely because another caller was busy.

Redis lease loss triggers rollback. A durable guard is never stolen automatically, even if Redis restarts or evicts a lock; this prevents a paused old worker from overlapping a new worker. Unlock uses an owner-checking Lua script. A database/rollback failure retains the journal and blocks further operations.

This is serialized application-level compensation, **not MongoDB ACID transactions**. It trades throughput and availability for a conservative standalone fallback. Direct database clients, old API versions, raw-model maintenance scripts and other applications are outside the repository barrier. Stop them before enabling this mode. A workflow taking more than the lease duration rolls back. Large journals can reach MongoDB's document-size limit and fail safely before the next write. External object storage/provider side effects are not rolled back by either persistence mode.

Legacy normalization (`migrate --apply`) and canonical slot backfill in `db:indexes --apply` retain their native transaction requirement. Run those maintenance operations on a replica set; do not interpret the API fallback as support for arbitrary raw-model migrations. Empty standalone test databases can build indexes before any application writers start.

## Crash recovery

Stop **every** API process, scheduler and other database writer. With the same database/Redis configuration, run:

```sh
npm run db:recover-standalone -- --writers-stopped
```

Uncommitted journals are restored; committed journals only have their guard removed. Restoration is repeatable if interrupted. Restart writers after recovery succeeds. Do not delete the guard manually or run recovery against a live worker. The CLI flag is an operator assertion that writers have stopped; it cannot detect paused processes on another host.

## Verification

Formal integration suite (Node 24 and Docker):

```sh
npm run test:redis
npm run test:redis -- --configured-redis
```

The default runner creates a standalone MongoDB, a one-node replica set and a disposable Redis container. The second command uses REDIS_URL from the ignored local .env and creates only its MongoDB containers. Both modes generate private test database names and Redis key prefixes, verify owner markers before cleanup, and remove only their labeled containers/volumes. They never use the application MongoDB URI and never flush Redis. Default offline tests skip this suite; direct Vitest opt-in requires RUN_REDIS_INTEGRATION_TESTS, REDIS_URL_TEST and explicit localhost test MongoDB URIs.

The 40 integration cases cover HTTP cache keys/TTL/invalidation and request IDs, auth/validation before cache, admin/guest isolation, audited rollback, corrupt/oversized payloads, disconnected and half-open network behavior, reconnect, native transaction commit/abort, standalone compensation with private fields and sort selection, independent coordinators, in-flight write draining, closed scopes, caught failures, actual lease expiry, rollback-storage failures and crash recovery. The crash case terminates a real child worker after an acknowledged Mongo write. Network faults use a private TCP proxy and never interrupt the shared Redis server.

See [integration verification results](redis-integration-results-2026-10-15.md) for discovered defects and validation evidence.

`scripts/verify-standalone-redis.js` only accepts an explicit disposable localhost MongoDB URI in `STANDALONE_TEST_URI`, creates its own marked test database and Redis namespace, and removes only resources it owns. It checks commit, rollback, upsert/delete, duplicate IDs, concurrent writers, lease loss, owner-safe unlock, interrupted-journal blocking/recovery and invalidation against real MongoDB standalone and Redis.

Frontend `npm run test:e2e:real` creates a temporary Firebase account and an isolated database. Set `E2E_MONGODB_URI` to a disposable localhost replica set, or set `E2E_MONGODB_STANDALONE=true` with a disposable localhost standalone and configured Redis. Credentials remain in process memory. Both modes were exercised successfully on 2026-10-15, including real login/onboarding, meal plan, grocery generation, diary, weight persistence and logout. The account and owned database were deleted afterward.

Client/lock implementation references: [node-redis connection documentation](https://redis.io/docs/latest/develop/clients/nodejs/connect/) and [Redis distributed lock guidance](https://redis.io/docs/latest/develop/clients/patterns/distributed-locks/).
