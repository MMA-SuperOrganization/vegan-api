# Redis integration verification — 2026-10-15

The original implementation had correctness defects. Real Redis/MongoDB regression tests reproduced the failures before the corresponding fixes. The final suite passes against both a disposable Redis instance and the configured Redis service, with isolated MongoDB databases in both modes.

| Integration group       |  Cases | Boundary verified                                                                |
| ----------------------- | -----: | -------------------------------------------------------------------------------- |
| HTTP cache              |     17 | Express routes, validation/authentication, repository persistence and Redis      |
| Standalone compensation |     17 | Real MongoDB standalone, Redis locking, journal recovery and independent workers |
| Native transactions     |      2 | Real one-node replica set and cache invalidation across commit/abort             |
| Network faults          |      4 | Real Redis connections through a private TCP proxy                               |
| **Total**               | **40** | **All passed**                                                                   |

## Defects reproduced and fixed

1. **Rollback dropped hidden user fields.** Mongoose lean reads still omit `select: false` fields. Restoring those snapshots removed FCM tokens/version. Snapshots now read complete stored BSON documents through the raw collection, preserving hidden and legacy fields. Regression checks exact document equality after rollback.
2. **Sorted writes could roll back the wrong document.** Snapshot selection ignored `sort`. Snapshot lookup now uses the write's sort/collation and pins the selected `_id` for update/delete.
3. **An in-flight write could finish after rollback.** A rejected parallel workflow could restore the journal while another write was still pending. The coordinator now closes the scope and drains started mutations before committing or restoring data. A test deliberately delays a real Mongo insert, fails the callback, then releases the delayed insert.
4. **Delayed child reads could reuse a finished scope.** AsyncLocalStorage context can outlive its parent callback. Closed scopes now reject further repository access with `COORDINATION_CLOSED`.
5. **Caught write failures could partially commit.** A callback could catch a duplicate-key error and cause earlier writes to commit. The coordinator records the first failed mutation and aborts the whole workflow even if its callback catches that error.
6. **Connected-but-unresponsive Redis could hang requests.** The installed client removes command timeout listeners once a command is sent. A separate application deadline now covers the full response, discards the stalled connection and reconnects. Cache reads fall back; coordination fails closed. Startup also has a five-second handshake deadline.
7. **A closed client could remain unusable after SDK retries ended.** Later requests can initiate a new bounded connection attempt. Tests verify fallback followed by recovery and a cache hit on the restored connection.

## Additional verified behavior

- Cache hit/miss, pagination/filter keys, actual Redis TTL, namespace separation, fresh HTTP request IDs, corrupt JSON and oversized-payload fallback.
- Authentication and validation execute before cache lookup. Admin inactive records do not populate guest cache.
- Create/update/soft-delete invalidate cached lists. Audit failure rolls back the domain write. HTTP errors are not cached.
- A read started before invalidation cannot populate the new cache generation with old data. Native transaction commit invalidates again after commit.
- Independent coordinators serialize read-modify-write operations and hide intermediate writes from cooperating readers.
- Duplicate-ID create failures preserve the original document; repeated updates, deletes and upserts restore correctly.
- Lease expiration/loss cannot steal the non-expiring Mongo guard. Unlock cannot remove another owner's Redis lease. Lock contention returns `DATABASE_BUSY`.
- Rollback storage failure retains the guard. Interrupted journals block reads, including warm HTTP cache reads. Recovery is repeatable; committed journals preserve successful writes.
- A real child process is killed after its Mongo write is acknowledged. The remaining journal blocks other workers and restores the previous document during recovery.

## Commands and results

Use Node 24 and Docker from the backend directory:

```sh
npm run test:redis
npm run test:redis -- --configured-redis
```

- Final disposable-service run: **40/40 passed**, approximately 21.5 seconds.
- Configured-service run: **40/40 passed**, approximately 35.3 seconds.
- Existing offline backend regression: **564 passed** using `--testTimeout=30000`; external suites remain opt-in and are exercised separately by the commands above.
- Focused existing Redis unit tests after the final reconnect change: **5/5 passed**.
- Backend build: **PASS**, syntax validation for 238 JavaScript source/script files, generated API documentation for 184 operations, offline startup/Swagger/health/auth smoke and shutdown.
- Whitespace check passed. Test Docker containers and their owned volumes were removed.

Firebase authentication uses a fake provider in HTTP integration tests; storage/messaging/AI providers are disabled. MongoDB and Redis are real. No fixture is written to the application MongoDB database. Configured Redis tests use random `vegeta-integration:<run-id>` key prefixes, remove only owned keys, and never flush Redis or stop the shared Redis service. Network faults affect only private test proxy connections.

The new script is added to `package.json`; `REDIS_COMMAND_TIMEOUT_MS` is validated and forwarded through the sanitized example and Compose configuration. No credentials were added to shareable files.

## Limits

These tests verify the listed integration contracts; they do not prove production throughput, long-duration stability or distributed fault tolerance under every failure sequence. Standalone persistence remains application-level compensation, not MongoDB ACID transactions. Recovery requires all writers to be stopped; raw-model maintenance tools and external writers bypass the repository barrier. See [configuration and recovery](redis-standalone.md).

Changes are in the workspace. Restart running API processes to load the fixes; no deployment was performed.
