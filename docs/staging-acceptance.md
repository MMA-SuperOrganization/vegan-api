# Staging acceptance after remediation

Use Node 24 and a separate staging database/bucket/account. Local regression and replica-set tests do not prove that provisioned external services work.

## Database and indexes

1. Back up and rehearse restoration. Run `npm run migrate` and resolve reported legacy conflicts without rewriting historical snapshots.
2. Stop writers and the reminder scheduler. Run `npm run db:indexes` (read-only default), review duplicates, slot pointers and the obsolete index.
3. Run `npm run db:indexes -- --apply --maintenance`. To intentionally retire `one_active_plan_per_owner_week`, also supply `--retire-old-active-index`. No other indexes are dropped. Index DDL is not transactional; inspect partial progress if a build fails.
4. Repeat inventory, verify two sequential plan activations, and resume one scheduler instance after acceptance.

## Provider preflight and workflow checks

Run `npm run preflight` after replacing configuration placeholders. It checks database ping, Firebase administration access, private R2 bucket access and configured AI model discovery. Disabled providers are reported as skipped. Set `STAGING_FCM_TOKEN` securely to include Firebase messaging dry-run validation. Results contain status names only; never paste tokens or private keys into reports. The command does not generate content, upload objects or deliver pushes.

- Firebase: sign in with a real client, sync identity, verify owner/admin isolation and suspended-user denial. Admin API access alone does not prove client token verification.
- R2: request upload, PUT an image, complete with HEAD verification, read through authorized signed GET, and check expiry/MIME/size rejection. Link an avatar using `avatarMediaId`; verify fresh signed responses, replacement, clearing and referenced-delete rejection.
- Cleanup: inspect default dry-run; inspect `--owner-id <ObjectId>` or explicit `--all-owners`. Apply only the reviewed scope. Verify stale pending/rejected uploads and retrying interrupted deletion; ready/referenced assets must remain protected.
- AI: exercise chat and image with the configured models, invalid output, timeout and disabled/unsupported video behavior. Model listing alone does not prove generation capabilities.
- FCM/reminders: deliver to a real staging device; verify timezone, DST, quiet hours and client deduplication. Dry-run alone does not prove delivery.
- Deployment: use actual proxy trust/CORS settings, verify readiness on database failure, graceful SIGTERM, private bucket policy and redacted errors. Inspect query plans/latency using representative data before claiming production-scale performance.

Record environment, commit, commands and redacted results for each check. Credentials in the local example configuration are placeholders; these external round trips remain outstanding until real staging credentials are provisioned.

## Backend checklist acceptance and restore rehearsal

See [backend checklist acceptance](backend-checklist-acceptance-2026-10-04.md) for the 199 feature rows, 184 independent API baseline and backend-only status. Mobile and Admin UI have not been accepted.

A local disposable MongoDB 8.0 replica set was used for a restore rehearsal on 04/10/2026. MongoDB Database Tools 100.19.1 dumped two fixture collections using an archive with gzip, restored into a different new database with namespace remapping, and verified document counts, nutrition snapshots, BSON dates and a unique slug index. This proves the local backup tooling flow; an Atlas recovery rehearsal, representative data and RPO/RTO measurement are still needed.

For staging, use dedicated least-privilege backup credentials and a new empty restore database. Stop writers or use a deployment-appropriate consistent snapshot/backup method; record source version and archive checksum. Run mongodump with an explicit source namespace and mongorestore with nsFrom/nsTo mapping to the new namespace. Do not use --drop or restore over the live application database. Verify counts, snapshots, indexes, references and authentication boundaries, then run application smoke tests against the restored staging namespace. Keep backup archives encrypted and test retention/access separately. Do not put credentials in shell command text or paste backup data into logs.

The API version policy is now configurable using APP_MINIMUM_VERSION, APP_LATEST_VERSION and APP_FORCE_UPDATE. Review these before release; the minimum must not exceed latest. VIDEOS_ENABLED/COMMUNITY_ENABLED control public client feature flags. Backend route authorization still applies independently.

Include reviewed AI proposal selections, dietary composition fields and diary target comparisons in the provider/mobile staging flows described above. Refer to OpenAPI for request bodies; confirmation remains idempotent, and missing composition or nutritional targets must not be displayed as proven absence/zero targets.
