# Backend verification — 2026-10-16

Verification uses Node.js 24.19.0 and Docker. The backend source changes include the existing Redis/catalog/profile updates and safe public server-error messages. Original errors remain available to server debug logging through `res.locals.debugError`; HTTP error logging remains enabled. Frontend display/logging changes are outside the backend commit.

## Checks

- Backend build: syntax checks for 238 JavaScript files, generated documentation for 184 operations, native HTTP startup/readiness/Swagger/auth smoke, and graceful shutdown passed.
- Offline Vitest regression: **567 passed, 50 skipped, 0 failed** (33 passing files). The skipped Redis and database suites were exercised separately as recorded below.
- Real Redis/MongoDB integration: 40/40 passed with disposable Redis and 40/40 passed with configured Redis after correcting the contention test described below.
- Real MongoDB canonical persistence: 10/10 passed against a disposable one-node replica set.
- Playwright acceptance: **833 passed, 8 skipped, 0 failed, 0 flaky** out of 841 cases. Real database cases used a disposable replica set. The remaining cases require external staging, performance budgets/GC instrumentation, large-upload opt-in, or MongoDB backup tools.
- Playwright scenario coverage: 841/841 unique workbook IDs.
- Formatting and generated-document checks passed. Staged-file review is required before push. The environment example contains placeholders only; application environment files and credentials are excluded.

## Findings and test corrections

The first configured-Redis run passed 39/40 tests. Six concurrent standalone workflows exceeded the existing three-second lock-acquisition window on remote Redis. `DATABASE_BUSY` is the intended rejection before a workflow starts. The test now drains all callers, checks that the stored increment equals the number of accepted workflows, accepts only `DATABASE_BUSY` rejections, retries those rejected workflows sequentially, and verifies all six increments and a cleared durable guard. The separate lock-timeout test still requires the bounded rejection. No production lock timeout was increased and no automatic application retries were introduced.

The first Playwright run passed 828 cases, failed two, and skipped eleven. The two failures came from generic cross-user assumptions:

- FCM token removal is intentionally idempotent and scoped to the authenticated user. Removing another user's token ID returns an acknowledgement while preserving that user's token. The case now verifies the original owner's record and both users' token lists remain unchanged and that the response contains no token value.
- Public video progress belongs to each viewer, so another viewer's progress update is permitted. The denied-access case now uses a private video. Existing content integration tests continue to verify independent public-viewer progress.

One later parallel Vitest run exceeded the existing 90-second documentation-generation test timeout while multiple suites and the build were competing for resources. The final regression run passed in 55.70 seconds when executed alone with the original test timeout unchanged.

The generic successful-mutation assertion now selects the protected user from the authenticated caller instead of assuming a fixed user is always the caller. These changes preserve the existing product contracts while checking actual isolation.

## Isolation and limits

MongoDB test data was written only to new marked disposable databases. Configured Redis uses random `vegeta-integration:<run-id>` key prefixes; cleanup removes only owned keys. No application database was used, no Redis flush was performed, and shared Redis was not stopped. Disposable Docker containers and volumes are labeled and ownership-checked before removal.

These checks cover implemented regression and integration contracts. They do not establish production throughput, long-duration reliability, external Firebase/storage/messaging/AI availability, or every distributed failure sequence. Standalone coordination is serialized compensating rollback, with bounded busy responses under contention. See [Redis configuration and recovery](redis-standalone.md).
