# Vegan Support API — MMA302

Modular-monolith backend for a vegan-support mobile app: Firebase identity, master food/allergen data, recipes and community content, pantry/meal/grocery planning, nutrition and health diaries, private media, optional AI assistance, notifications/reminders, moderation and administration. Mobile UI, Firebase password provisioning, adaptive video transcoding and medical advice are outside this repository's scope.

**Verification boundary:** Node.js **24+ is required** (`package.json`). The remediation host currently provides **Node 22.19.0**, not the supported runtime. Local credentials are placeholders. Offline tests are not evidence that MongoDB/Atlas, Firebase, R2, FCM, AI or production deployment works. No real database seed/migration/cleanup or external-provider operation was performed during remediation; provision real configuration and validate on staging before deploying.

## Architecture

`HTTP → manifest-mounted route → authentication/owner/admin guards → strict Zod validation → operation/controller adapter → service → repository → canonical Mongoose model → MongoDB`.

`src/container.js` explicitly assembles module factories and returns `{ models, repositories, services, operations, validation, env, logger, ... }`. Providers, clock, transaction runner and repositories are injectable for offline testing. Importing configuration/scripts does not connect to a database or send provider requests; server/script `main()` performs startup. Historical singular files are not the persistence authority: see [persistence mapping](docs/persistence-mapping.md).

Growing lists are paginated. IDs are internal MongoDB ObjectIds; Firebase UIDs identify authentication identities. State transitions and ownership checks belong in services, not generic CRUD handlers. Cross-document invariants require MongoDB transactions and a **replica set/Atlas**, not a standalone MongoDB server. Production database startup disables automatic index building; development enables Mongoose auto-indexing. Deploy the reviewed canonical indexes explicitly before production traffic.

## Requirements and installation

- Node.js 24+ and npm 10+; built-in `--env-file`, watch mode and native `fetch` are used, not dotenv/nodemon.
- MongoDB 8+ replica set or Atlas with database/network permissions for the configured user.
- Firebase Authentication project and Admin service-account credentials to verify real ID tokens. In development unconfigured auth fails closed; production requires credentials.
- Private Cloudflare R2 bucket with scoped S3-compatible credentials for media. Production requires R2 configuration.
- Optional OpenAI-compatible HTTPS API supporting the configured chat/vision models and structured JSON responses. No additional AI SDK is required.

```bash
cd vegan-api-mma302
node --version                 # must report v24 or newer
npm ci
cp .env.example .env
# Edit .env privately: replace required CHANGE_ME values; do not commit it.
npm run dev
```

For local replica-set MongoDB, use a URI such as `mongodb://localhost:27017/vegan_support?replicaSet=rs0` after the replica set has actually been initialized. Do not treat this URI as a working database by itself. Atlas requires a real user/password, IP/network access and the correct cluster hostname. `.env` is parsed by Node's env-file support; escaped `\n` in Firebase private keys is normalized by `loadEnv`.

## Environment contract (all 47 keys)

The authoritative schema is `src/config/env.js`. Blank optional values become absent. Defaults below are schema defaults, not secrets or working credentials. `CHANGE_ME` values are not valid required credentials. Booleans accept `true`/`false` (and Zod stringbool forms); integers are validated and bounded.

| Key                                      | Required / default                                          | Meaning                                                                                            |
| ---------------------------------------- | ----------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `NODE_ENV`                               | Optional; `development`                                     | `development`, `test`, `production`                                                                |
| `PORT`                                   | Optional; `3000`                                            | Integer 1–65535                                                                                    |
| `API_PREFIX`                             | Optional; `/api/v1`                                         | Absolute path prefix; health paths follow it                                                       |
| `APP_NAME`                               | Optional; `vegan-support-api`                               | Log/app identifier                                                                                 |
| `APP_BASE_URL`                           | Optional; `http://localhost:3000`                           | HTTPS in production; localhost HTTP only outside production                                        |
| `APP_MINIMUM_VERSION`                    | Optional; `1.0.0`                                           | Minimum Android app version, numeric major.minor.patch                                             |
| `APP_LATEST_VERSION`                     | Optional; `1.0.0`                                           | Latest app version; must be at least minimum                                                       |
| `APP_FORCE_UPDATE`                       | Optional; `false`                                           | Client update policy returned by public config                                                     |
| `VIDEOS_ENABLED`                         | Optional; `true`                                            | Public client feature flag for videos                                                              |
| `COMMUNITY_ENABLED`                      | Optional; `true`                                            | Public client feature flag for community                                                           |
| `TRUST_PROXY`                            | Optional; `0`                                               | Trusted proxy hops 0–10; set to actual topology, not blindly 1                                     |
| `SHUTDOWN_TIMEOUT_MS`                    | Optional; `10000`                                           | Shutdown deadline 100–120000 ms                                                                    |
| `JSON_BODY_LIMIT`                        | Optional; `1mb`                                             | JSON body size (`b`, `kb`, `mb`)                                                                   |
| `CORS_ORIGINS`                           | Optional; empty                                             | Comma-separated exact origins; no `*`, no URL paths                                                |
| `LOG_LEVEL`                              | Optional; `info`                                            | fatal/error/warn/info/debug/trace/silent                                                           |
| `MONGODB_URI`                            | Required outside `test`; none                               | `mongodb://` or `mongodb+srv://`; scripts require a URI even in test mode                          |
| `MONGODB_DB_NAME`                        | Optional; `vegan_support`                                   | Database name; overrides the URI database                                                          |
| `MONGODB_MIN_POOL_SIZE`                  | Optional; `1`                                               | 0–1000, must not exceed max                                                                        |
| `MONGODB_MAX_POOL_SIZE`                  | Optional; `10`                                              | 1–1000                                                                                             |
| `MONGODB_SERVER_SELECTION_TIMEOUT_MS`    | Optional; `10000`                                           | 100–120000 ms                                                                                      |
| `FIREBASE_PROJECT_ID`                    | Required in production or if FCM enabled; none              | Real Firebase project                                                                              |
| `FIREBASE_CLIENT_EMAIL`                  | Required in production or if FCM enabled; none              | Service account email; paired with private key                                                     |
| `FIREBASE_PRIVATE_KEY`                   | Required in production or if FCM enabled; none              | Service account PEM; escaped newlines normalized                                                   |
| `FCM_ENABLED`                            | Optional; `false`                                           | Enables optional push delivery; in-app notifications remain independent                            |
| `CLOUDFLARE_R2_ACCOUNT_ID`               | Required in production or if any core R2 key supplied; none | Derives the R2 endpoint                                                                            |
| `CLOUDFLARE_R2_ACCESS_KEY_ID`            | Same R2 condition; none                                     | Scoped access key                                                                                  |
| `CLOUDFLARE_R2_SECRET_ACCESS_KEY`        | Same R2 condition; none                                     | Secret access key                                                                                  |
| `CLOUDFLARE_R2_BUCKET_NAME`              | Same R2 condition; none                                     | Private bucket                                                                                     |
| `CLOUDFLARE_R2_PUBLIC_BASE_URL`          | Optional; none                                              | Legacy/public-asset configuration; not used to authorize draft/private media                       |
| `CLOUDFLARE_R2_PRESIGNED_URL_EXPIRES_IN` | Optional; `300`                                             | Signed URL lifetime seconds, 60–3600                                                               |
| `CLOUDFLARE_R2_MAX_IMAGE_SIZE_BYTES`     | Optional; `10485760`                                        | Image limit, 1024–104857600 bytes                                                                  |
| `CLOUDFLARE_R2_MAX_VIDEO_SIZE_BYTES`     | Optional; `524288000`                                       | Video limit, 1024–2147483648 bytes                                                                 |
| `AI_ENABLED`                             | Optional; `false`                                           | Disables provider-backed AI when false                                                             |
| `AI_PROVIDER`                            | Optional; `openai-compatible`                               | Only supported adapter kind                                                                        |
| `AI_BASE_URL`                            | Required if AI enabled; none                                | HTTPS API base (development localhost HTTP allowed by env schema)                                  |
| `AI_API_KEY`                             | Required if AI enabled; none                                | Provider API secret                                                                                |
| `AI_CHAT_MODEL`                          | Required if AI enabled; none                                | Chat/structured generation model; no model-name default                                            |
| `AI_VISION_MODEL`                        | Required if AI enabled; none                                | Image recognition model; confirm capability with provider                                          |
| `AI_TIMEOUT_MS`                          | Optional; `30000`                                           | Env bounds 100–300000 ms; adapter currently caps effective timeout at 120000 ms                    |
| `AI_MAX_RETRIES`                         | Optional; `1`                                               | 0–3 transient retries; billing/idempotency ultimately provider-dependent                           |
| `REMINDER_SCHEDULER_ENABLED`             | Optional; `false`                                           | Enables DB polling in server startup                                                               |
| `REMINDER_POLL_INTERVAL_MS`              | Optional; `60000`                                           | 100–3600000 ms                                                                                     |
| `REMINDER_BATCH_SIZE`                    | Optional; `50`                                              | 1–500                                                                                              |
| `REMINDER_LOCK_TTL_MS`                   | Optional; `120000`                                          | 1000–3600000 ms; must be at least poll interval                                                    |
| `RATE_LIMIT_WINDOW_MS`                   | Optional; `900000`                                          | 100–86400000 ms                                                                                    |
| `RATE_LIMIT_MAX`                         | Optional; `200`                                             | Global API requests/window, 1–100000                                                               |
| `AUTH_RATE_LIMIT_MAX`                    | Optional; `30`                                              | Auth requests/window                                                                               |
| `UPLOAD_RATE_LIMIT_MAX`                  | Optional; `30`                                              | Upload request limit/window                                                                        |
| `AI_RATE_LIMIT_MAX`                      | Optional; `20`                                              | AI request limit/window                                                                            |
| `SWAGGER_ENABLED`                        | Optional; `true`                                            | Explicitly set false for production; not automatically disabled by schema                          |
| `SEED_ADMIN_FIREBASE_UID`                | Required for default seed / cleanup admin; none             | Existing real Firebase user's UID, never CHANGE_ME; `--master-only` bypasses admin seed explicitly |
| `SEED_ADMIN_EMAIL`                       | Required for default seed; none                             | Real matching admin email, not example/placeholder                                                 |

There is **no** `MONGODB_URI_TEST`, `CLOUDFLARE_R2_ENDPOINT`, `CLOUDFLARE_R2_PUBLIC_URL` or `AI_MODEL` setting in the current runtime schema. `MONGODB_URI_TEST` and `RUN_DATABASE_TESTS` are **test-harness-only** opt-in values described below, not additional application settings. Offline tests inject repositories; real persistence tests require a separate explicitly named disposable database, never production configuration.

## Firebase setup and authentication flow

In the Firebase console, enable the client sign-in providers. Under project settings/service accounts, generate a dedicated Admin service-account private key. Copy the JSON's `project_id`, `client_email` and complete `private_key` to the matching environment keys, preserving PEM boundaries and newlines. Keep the JSON/key outside version control and rotate exposed credentials.

The mobile client signs in with the Firebase client SDK, gets a fresh ID token, and sends `Authorization: Bearer <idToken>`. The backend verifies the token, synchronizes/maps its UID to an internal user, checks active status and role, then enforces owner/admin permissions. Clients cannot self-assign role/status. Seed only maps an already-existing UID to MongoDB; it neither creates a Firebase account nor creates/stores a password.

## Private R2 media and browser CORS

Create a private bucket; disable public `r2.dev` and public/custom-domain access to the bucket used for private/draft content. Scope credentials to that bucket and necessary object actions. **A public URL is directly accessible regardless of API authorization; hiding it in a DTO does not protect a draft.** A public custom domain is only appropriate for separately reviewed public assets in separate storage/access rules. `CLOUDFLARE_R2_PUBLIC_BASE_URL` does not make private media safe.

Configure bucket CORS for the exact browser/web origins that need direct uploads, allowed methods `PUT`, `GET`, `HEAD`, necessary headers such as `Content-Type` (and checksum headers if used), and expose `ETag` when needed. Do not use wildcard origins for an authenticated web app. Native Android/iOS HTTP clients are not browser-CORS-enforced; the upload authorization still comes from the signed URL. API CORS is configured separately with `CORS_ORIGINS`.

1. Authenticated client requests `POST /api/v1/media/upload-requests` with filename, MIME type, size and purpose.
2. Service checks allowed MIME/size, generates a server-controlled owner namespace key and a `pending` record, and returns short-lived signed `PUT` URL plus required headers.
3. Client uploads raw bytes directly to R2 with those headers. No file bytes pass through Express.
4. Client calls `POST /api/v1/media/:id/confirm`. Backend `HeadObject` checks MIME and byte count before making the asset `ready`.
5. Content linking requires ready, correct-owner/purpose/kind media. Authorized retrieval returns short-lived signed **GET**, not a synthesized public CDN URL. Unpublished content is not anonymous-accessible. Existing signed GET URLs remain usable until expiry; choose an appropriately short TTL.
6. Delete checks references and uses a deleting/retry state. Storage deletion and MongoDB cannot share a distributed transaction; a failed deletion may require a controlled retry.

## AI behavior and limitations

With `AI_ENABLED=false`, provider-backed AI endpoints return `503 AI_DISABLED`; the app should hide/disable those actions while pantry/planning/community features continue. The adapter uses native fetch, abort/deadline handling and bounded transient retries. Structured output is parsed/validated, references are resolved against allowed canonical records, and pantry/meal-plan changes require explicit owner confirmation; proposal retries reuse consumed results rather than mutate twice. Unconfirmed proposals expire after one hour; consumed rows/results are retained for retry idempotency. Unresolved recognized food IDs block pantry confirmation with a conflict rather than invent master data. Safety responses are not medical advice, and prompts/media/transcripts are untrusted input, not instructions overriding the safety policy.

Video summarization supports the available transcript/context path; **raw video understanding is not implemented by the default OpenAI-compatible image/chat adapter**. A video without an available transcript is not proof of an AI video capability; the client must handle `422 AI_VIDEO_UNSUPPORTED` when there is no transcript. Ingredient vision requires a configured image-capable model and authorized media. No provider/model capability was verified externally here.

## Reminder delivery semantics

The optional scheduler polls due MongoDB reminders, atomically claims a bounded batch with owner/expiry fencing, and advances recurrence. In-app notification `deliveryKey` is uniquely indexed for per-occurrence deduplication. FCM is **at-least-once**, not exactly-once: a crash after provider acceptance but before recording success can resend. Mobile clients should deduplicate by `deliveryKey`/`notificationId`. Disabled push, type preferences and quiet hours do not erase in-app notification history; invalid device tokens are removed. Raw FCM tokens must never appear in responses/logs.

Recurring schedules use an IANA timezone. DST spring-forward nonexistent local times shift forward by the gap; fall-back ambiguous times use the **earlier occurrence**. Quiet hours use the user's local timezone, including overnight ranges. Missed recurring slots are skipped rather than replayed as a burst. Polling remains a **single-scheduler-instance deployment**: atomic claims help race safety but do not turn this into a supported horizontally scaled queue. Rate limits likewise use process-local memory. Scale-out requires a reviewed distributed scheduler/rate-limit design.

## Commands and safe maintenance

```bash
npm run dev                    # watch, loads local .env
npm start                      # loads local .env (requires it)
node src/server.js             # injected production env; does not load .env
npm run build                  # Node 24+, syntax, docs consistency and offline startup smoke
npm run test:run               # offline Vitest suite
npm run test:contract          # manifest/docs/mounted route contract tests
npm test                       # test watch mode
npm run docs:generate          # maintained docs generation
npm run docs:check             # detect stale generated docs
npm run smoke                  # local HTTP/import/listen smoke with mocked integrations
npm run format:check
npm run format
```

`npm run build` is the verification build for this native JavaScript backend: it checks every JavaScript file in `src/` and `scripts/`, validates committed generated documentation, and starts/stops an HTTP server with mocked dependencies. It exits nonzero when a check fails and does not load `.env`, call real providers, or generate a `dist/` directory. Run `npm run test:run` separately for the full suite. To package a deployable image, run `docker build -t vegan-api .`.

The default tests inject fake auth/storage/AI/messaging/repositories and do not call real providers or MongoDB. Node 24 is the acceptance runtime even if selected tests can be executed on the Node 22 host. Do not claim a real integration pass from offline tests.

### Optional real MongoDB persistence tests

`tests/database/persistence.test.js` is skipped unless **both** `RUN_DATABASE_TESTS=true` and `MONGODB_URI_TEST` are supplied. This is an operational opt-in, not a routine offline test. Use a new empty replica-set/Atlas DB named exactly `test_vegan_<unique lowercase suffix of 8–64 letters/digits/underscores>`. The guard rejects the application URI/database, unnamed/default/production DB names and standalone URIs; startup verifies replica-set/Atlas capability, empty DB and an exclusive test lock. Providers remain disabled/injected.

```bash
# Use a dedicated disposable empty test database.
RUN_DATABASE_TESTS=true MONGODB_URI_TEST='mongodb://localhost:27017/test_vegan_unique_run_01?replicaSet=rs0' npm run test:database
```

The suite builds canonical indexes with `createIndexes` (never `syncIndexes`), checks actual UID/engagement/delivery/stable owner-week slot constraints and sequential activation of distinct plans, transaction rollback and last-admin guard, seed-twice ID/count stability, pantry compare-and-set concurrency and AI pantry confirmation idempotency/rollback. Cleanup removes only tracked fixture IDs under the run's own lock; it never drops the database, deletes all records or touches the application DB. Empty collections/indexes may remain. A failed/killed run can leave test fixtures/lock; choose a new isolated suffix rather than remove arbitrary records. The remediation ran all 8 persistence tests against an isolated MongoDB 8.0 replica set on Node 24.21.0, including cross-domain pagination, avatar transactions and index/slot provisioning. No application or production database was used.

### Seed (writes; run only with explicit database authorization)

```bash
npm run seed                               # real admin UID/email + master data + 8 demo recipes
npm run seed -- --master-only               # skips admin AND recipes, seeds master data only
npm run seed -- --master-only --with-demo-content
# last form explicitly creates a non-login internal demo author + all 8 recipes, no admin
```

The seed uses **container.models**, not retired singular models. It upserts 12 categories, 5 allergens and 20 plant-based foods with canonical slugs/full unit-bearing nutrition; 8 recipes have resolved ingredient snapshots and calculated per-serving nutrition. Original macronutrients are approximate demo data; zero unspecified micronutrients mean unknown demo values, not verified absence. `aliases: ['demo fixture']`, recipe tags and descriptions label fixtures. Idempotent fixture upserts log inserted/updated/unchanged counts and never delete existing records or reset engagement counters. Colliding non-demo food/recipe records fail closed rather than silently overwrite. Default admin config must match a real existing Firebase account; seed does not verify/provision it through Firebase. An existing suspended/deleted or mismatched account is refused rather than reactivated. The internal demo UID `internal:vegan-demo-fixtures:v1` has role `user`, email `vegan-demo-fixtures@example.invalid`, and recipes use `sourceType: community`; no password or login identity is provisioned. Do not create a real Firebase login using that internal UID.

### Migration and cleanup (default dry-run)

```bash
npm run migrate                            # DB inventory only
npm run migrate -- --apply                 # explicit safe normalization transaction
npm run media:cleanup                      # owned stale pending inventory only
npm run media:cleanup -- --apply --limit 50 --older-than-hours 24
node scripts/seed.js --help
node scripts/migrate.js --help
node scripts/cleanup-media.js --help
```

Dry-run still connects/reads the configured DB; it is not an offline test. Migration inventories actual canonical/legacy collection casing, preserves IDs/references/snapshots, and refuses conflicts/legacy aliases/string refs/truncation on apply. Only recognized role/status and absent server versions are automatically normalized. Backup, stop writers, review the report and stage first; see [persistence mapping](docs/persistence-mapping.md) for details.

Cleanup requires a configured active admin UID. Default scope is that admin’s uploads; `--owner-id <ObjectId>` selects one owner and `--all-owners` explicitly selects all owners. These flags are mutually exclusive. Candidates are stale pending/rejected/deleting uploads with an expired or absent upload window, no references or linked entity, and a matching owner namespace/bucket. Ready assets are excluded. Apply atomically claims each candidate, audits the claim and calls guarded deletion; interrupted deleting assets can be retried. Dry-run does not write or delete objects.

Retired `build-phase5-9`, `generate-modules`, `generate-phase5-9`, `scaffold-all`, `relink-all`, `restore-users`, `fix-auth`, `fix-tests`, and `fix-validation` scripts and unreachable historical generated source files have been removed. Maintained docs generators are not retired.

## Modules and API docs

Modules include health, app-config/home/onboarding; auth/users/nutrition-profiles; categories/allergens/food-items; recipes/search/recommendations; pantries/meal-plans/grocery-lists/diary/weight-logs/water-logs; media/posts/videos/comments/reactions/ratings/saved-items/view-history; AI/AI monitoring; notifications/reminders; reports/moderation/admin dashboard/audit logs.

`src/routes/api-manifest.js` is the HTTP contract, `docs/openapi.yaml` is the generated OpenAPI contract, and `docs/api-matrix.md` maps business operations. Swagger UI is at `http://localhost:3000/api-docs` when explicitly enabled. Default health paths are `/api/v1/health` (liveness) and `/api/v1/health/ready`; liveness is not DB readiness.

Swagger includes Vietnamese operation/business descriptions for all 184 APIs, parameter and schema-field descriptions, validated JSON request examples (including diary/reminder branches), synthetic success/error responses, Firebase authentication instructions, error codes and request-correlation headers. JSON is available at `/api-docs.json` and YAML at `/api-docs/openapi.yaml` when `SWAGGER_ENABLED=true`. The default server follows the current origin and configured `API_PREFIX`; select the configurable server to use another environment. Enter only the Firebase ID token in Authorize: Swagger adds `Bearer`.

Maintain annotations and curated examples in `scripts/openapi-details.js`, not directly in the generated YAML. Run `npm run docs:generate`, `npm run docs:check` and `npm run test:contract` after changes. Contract checks validate examples against Zod and response schemas; example IDs/URLs are illustrative and must be replaced by real accessible records. These checks do not contact Firebase/R2/AI providers. See [Swagger verification](docs/swagger-detail-verification-2026-10-04.md).

## Business rules and security

- One Firebase UID maps to one internal user. Suspended/deleted identities cannot authenticate normally; admin operations are audited and the last active admin is protected.
- Food items are master data. Recipe ingredients resolve foods and snapshot nutrition/allergens; historical snapshots do not change when master data changes.
- Private/draft/hidden/deleted content is filtered from anonymous discovery. Media links require ownership/readiness; counters/version are server-controlled, never trusted client updates.
- Pantry consumption needs explicit owner consent; completing a meal does not silently consume inventory. Only one active meal plan per owner/week is allowed, serialized by a stable unique active-slot pointer and transactional status changes.
- Engagement/delivery unique indexes and transactionally guarded aggregates prevent duplicates; indexes must actually exist in the deployed DB. Content view deduplication retains at most 10,000 receipts per 30-minute window and fails closed for counting at saturation; owner progress/history can still update. This bounds memory/state rather than guaranteeing unlimited exact view accounting.
- Owner checks cover personal planning/tracking/history/AI/notification data; strict validation rejects unknown fields and unsafe nested updates.
- Soft-delete/state transitions preserve important history. Do not use a generic bulk delete to clean production data.
- Do not log credentials, bearer tokens, private keys, raw FCM tokens, signed URL query strings, sensitive health notes, or raw AI prompts/provider response bodies. AI conversation content is intentionally persisted owner-scoped; this is not a claim that no prompts are ever stored. Plan retention/access/export/deletion policies before handling real users.
- Use HTTPS, narrowly scoped service accounts/R2 credentials, exact CORS origins and correct trusted-proxy settings. CORS is not authentication; rate limits and helmet are defense-in-depth, not complete abuse prevention.

## Docker / deployment checklist

For the GitHub Actions → GHCR → Coolify release pipeline, follow [Coolify deployment setup](docs/coolify-deployment.md). The workflow verifies Node 24 build/tests and isolated MongoDB persistence before publishing the image and calling the authenticated deploy webhook.

The Dockerfile uses Node 24 Alpine, production-only lockfile dependencies, non-root execution and native-fetch readiness healthchecks. It excludes `.env` and starts `node src/server.js`, using runtime-injected configuration. Compose targets external Atlas/replica-set MongoDB; it does **not** provision or initialize a database. Compose requires the production app HTTPS URL, Firebase credentials and private R2 settings. Compose variable interpolation may read a local `.env` to inject variables; the application image does not read/copy that file.

```bash
# Only after configuration is provisioned/reviewed on staging:
docker compose build
docker compose up -d
# Health requests are local checks; they do not prove all providers work.
```

- [ ] Replace all placeholders securely; `NODE_ENV=production`, HTTPS `APP_BASE_URL`, explicit origins/trust proxy, `SWAGGER_ENABLED=false`.
- [ ] Back up DB and verify restore; review active/legacy persistence mapping and run the authorized dry-run inventory.
- [ ] Use replica set/Atlas, resolve duplicate/orphan records, build reviewed indexes before traffic; production startup does not auto-create indexes. Existing deployments must backfill/review stable meal-plan owner/week slots and explicitly retire the old `one_active_plan_per_owner_week` partial index during a stopped-writer maintenance window, not via live `syncIndexes` (see persistence mapping).
- [ ] Verify Firebase token verification, suspended-user denial and owner/admin boundaries on staging.
- [ ] Keep bucket private; validate signed PUT/HEAD/authorized GET, MIME/size checks and expired/referenced delete safeguards.
- [ ] Validate AI model capabilities only if enabled; handle disabled/invalid-output/timeout/unsupported-video paths.
- [ ] Run one scheduler instance; verify timezone/DST, quiet hours and client push deduplication.
- [ ] Check `/api/v1/health` and `/api/v1/health/ready` (or your configured prefix); test graceful shutdown (`SIGTERM`) and DB/provider failures.
- [ ] Monitor redacted request/error logs, notification failures, pending-media backlog and operational limits.

Known limitations: no video transcoding/adaptive streaming; no native raw-video AI in the default adapter; demo food values are not a researched clinical dataset; nutrition does not model cooking loss; no distributed scheduler/rate limiter; MongoDB and object storage do not share transactions; conservative migration does not automatically repair legacy records; external credentials and supported Node runtime remain deployment prerequisites. Offline tests cannot replace a real staging smoke test.

## Remediation contracts and acceptance

The original 184-endpoint specification is frozen in `docs/source-requirements.md`; contract tests read this versioned snapshot so clean checkouts and CI do not depend on a file outside the repository. Update it deliberately when requirements change. Domain controllers now execute the mounted Express adapters; shared content/validation code lives under `src/common`.

Profile updates use `avatarMediaId` pointing to a ready image uploaded for purpose `avatar` by the same user, or null to clear. Arbitrary `avatarUrl` values are rejected; legacy `avatarUrl: null` clears the avatar. Account/public responses include freshly signed `avatarUrl`, `avatarMediaId` and (when signed) `avatarExpiresAt`. Upload and complete media before updating the profile. Replacing/clearing an avatar releases its reference; linked avatars cannot be deleted.

Search and moderation pending queues paginate/sort in MongoDB with stable tie-breakers and card projections. Pending queues have no implicit 30-day cutoff; explicit from/to filters remain available. Vegan requires isVegan. Lacto vegetarian excludes eggs; ovo vegetarian excludes dairy. Admin food inputs accept optional containsEggs/containsDairy booleans, and recipes derive these from ingredient snapshots. Unknown composition is excluded from the corresponding restricted diet unless the food/recipe is vegan. Vegetarian, lacto-ovo and pescatarian use vegetarian/vegan foods; fish classifications are outside this catalog. Flexitarian/other apply no diet exclusion. Allergy filters remain separate. Pantry suggestions and personalized recommendations additionally check current ingredient food safety without modifying historical snapshots. Recommendations retain the bounded 200-candidate pool; every advertised page is accessible, including with limit=1.

AI confirmation accepts optional reviewed selections: meal-plan confirmation can receive title/days in the proposal output shape; pantry confirmation can receive items with foodItemId, quantity, unit and optional expiryDate. Omitting selections retains the original proposal. All selected meals must retain the original proposal dates, and all recipes/foods are checked again against the owner's current diet/allergens. Unknown recognized ingredients can be resolved before confirmation, and unwanted items can be omitted. Empty selections and system fields are rejected. No plan activation occurs unless activate=true. Confirmation persists the chosen structured data and resource atomically; replay returns the first result even if the retry body differs.

Diary summaries return dailyTargets and targetComparison for calories/protein/carbs/fat/fiber, both per logged day and for the requested calendar range. Range targets multiply current daily targets by the inclusive day count, including empty days; they are not historical target snapshots. Missing/zero targets return null comparison values. Negative remaining amounts indicate exceeding the target. Default date respects the requested timezone; explicit diary dates remain calendar dates.

Reminder notification data includes reminderId, scheduledAt and route (meal-plans, water-logs or reminders). These are client navigation keys; authentication and ownership still apply when the destination loads data. Device routing/deduplication must be implemented by the mobile client.

Compose defaults TRUST_PROXY to 0 for direct exposure. Configure trust explicitly for the actual reverse proxy; process-local rate limiting and the single-scheduler constraint still apply.

See [staging acceptance](docs/staging-acceptance.md) for index maintenance and provider verification. CI uses Node 24, a clean install, contract/offline checks, isolated replica-set persistence tests and production Docker build.

The [product checklist](docs/product-checklist.md) is versioned for independent endpoint contract checks. The [backend acceptance report](docs/backend-checklist-acceptance-2026-10-04.md) records backend-only scope, feature evidence, fixes and remaining external verification. Mobile and Admin UI acceptance remains outside this backend change.
