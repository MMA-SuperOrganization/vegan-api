# Persistence mapping and conservative migration

## Source of truth

Only models exposed by `createContainer({ env, logger, overrides }).models` and their corresponding canonical module factories are active. A filename, model registration name, repository key, source-spec collection label and actual MongoDB collection name are different things. MongoDB collection casing is significant. Do not assume that `FoodItem` and `FoodItems` or `foodItems` and `fooditems` are aliases.

The older singular model/controller/repository files remain historical artifacts; the active container does not wire them. Historical generator/bulk-fix scripts are disabled with an unconditional startup error, with their original bodies retained for reference. They must not be used to regenerate application code.

## Active mapping

This table names actual `model.collection.name` values, not a proposal to rename them. The migration inventory dynamically reads the container models, so its runtime report remains authoritative if a factory changes.

| Container model/repository key                                                         | Active collection                  | Legacy/spec collection to review                                                                       |
| -------------------------------------------------------------------------------------- | ---------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `users`                                                                                | `users`                            | Same collection; uppercase roles/status and older fields                                               |
| `userProfiles`                                                                         | `userProfiles`                     | `userprofiles`                                                                                         |
| `adminGuards`                                                                          | `adminguards`                      | Internal last-admin transaction guard, not a user profile                                              |
| `nutritionProfiles`                                                                    | `nutritionprofiles`                | `nutritionProfiles`                                                                                    |
| `categories`                                                                           | `categories`                       | Same collection; `isActive` vs `status`                                                                |
| `allergens`                                                                            | `allergens`                        | Same collection; `isActive` vs `status`                                                                |
| `foodItems`                                                                            | `fooditems`                        | `foodItems`                                                                                            |
| `recipes`, `posts`, `videos`                                                           | `recipes`, `posts`, `videos`       | Same collections; incompatible older fields/snapshots                                                  |
| `PantriesModel` (model), `pantries` (repository)                                       | `pantries`                         | `pantryitems` (standalone items versus aggregate)                                                      |
| `MealPlansModel` (model), `mealPlans` (repository)                                     | `mealplans`                        | `mealPlans`                                                                                            |
| `GroceryListsModel` (model), `groceryLists` (repository)                               | `grocerylists`                     | `groceryLists`                                                                                         |
| `DiaryModel` (model), `diaryEntries` (repository)                                      | `diaries`                          | `diaryEntries`, `diaryentries`                                                                         |
| `WeightLogsModel`, `WaterLogsModel` (models), `weightLogs`, `waterLogs` (repositories) | `weightlogs`, `waterlogs`          | `weightLogs`, `waterLogs`                                                                              |
| `mediaAssets`                                                                          | `media`                            | `mediaAssets`, `mediaassets`                                                                           |
| `comments`, `reactions`, `ratings`                                                     | `comments`, `reactions`, `ratings` | Same collections; target discriminators and unique-key conflicts                                       |
| `savedItems`                                                                           | `saveditems`                       | `savedItems`                                                                                           |
| `viewHistories`                                                                        | `viewhistories`                    | `viewHistories`                                                                                        |
| `searchHistory`                                                                        | `searchhistories`                  | `searchHistories`                                                                                      |
| `aiConversations`, `aiMessages`, `aiRuns`, `aiFeedback`, `aiProposals`                 | Same camel-case collection names   | Lowercase names from former generated schemas; proposals retain consumed results for retry idempotency |
| `notifications`                                                                        | `notifications`                    | Same collection; delivery keys/read/push state                                                         |
| `notificationPreferences`                                                              | `notificationPreferences`          | `notificationpreferences`                                                                              |
| `reminders`, `reports`                                                                 | `reminders`, `reports`             | Same collections; schedule/claim and moderation fields                                                 |
| `moderation`                                                                           | `moderations`                      | `moderationCases`, `moderationcases`                                                                   |
| `auditLogs`                                                                            | `auditlogs`                        | `auditLogs`                                                                                            |

Discovery, health, auth, dashboard and AI monitoring compose these repositories; their historical generated model files are not evidence of a new active collection.

## Active meal-plan index transition (explicit maintenance required)

`MealPlanActiveSlotsModel` (container model) / `mealPlanActiveSlots` (repository) uses collection `mealplanactiveslots`. Fields are `userId`, `weekStartDate`, `activePlanId` (ObjectId or null), `version` and timestamps; the stable unique index `{ userId: 1, weekStartDate: 1 }` is named `one_active_slot_per_owner_week`. Activation writes this pointer and the old/new plan statuses in the same transaction. The prior partial index on `mealplans`, `one_active_plan_per_owner_week`, is no longer part of the canonical schema: reusing its active key within a transaction can fail on real MongoDB even after archiving the previous plan.

On an existing deployment, **stop writers/scheduler and perform a reviewed explicit index transition before enabling activation**. Inventory active plans; fail if more than one active plan exists for any owner/week. Preserve each plan's ID/snapshots, create/backfill exactly one stable slot pointing at the unique active plan for each owner/week, and build/verify `one_active_slot_per_owner_week`. Only then explicitly retire the old `one_active_plan_per_owner_week` index in the maintenance window and verify two sequential activations on staging. Do not call `syncIndexes`, drop indexes against a live deployment, or blindly populate slots when there are conflicts. The provided migration dry-run reports the old index, duplicate active owner/week plans and missing/mismatched pointers; `--apply` refuses these manual-review cases and **never drops/builds/backfills an index/slot automatically**. The separate `db:indexes` command supports this explicit transition; its backfill and named-index retirement were verified only on a disposable replica-set test DB. No production migration was executed.

## Fields requiring review

- Users: `USER`/`ADMIN` become `user`/`admin`; recognized uppercase statuses become lowercase. Missing roles may safely become `user`, never `admin`. Unknown/missing statuses are not silently activated. IDs and Firebase UIDs must be preserved, and duplicate UIDs require a human decision. Profile data belongs in `userProfiles`, not an arbitrary generic users subdocument. Raw FCM strings must be reviewed into validated token objects, not exposed in logs.
- Master data: `isActive` can translate to `active`/`inactive` only when canonical status is absent or agrees. A disagreement is a conflict. Categories/allergens need unique valid slugs; food items need normalized names, explicit default serving, both vegan/vegetarian flags and allergen references.
- Nutrition: legacy `{ calories, protein, carbs, fat, fiber }` is not the canonical unit-bearing schema. Canonical keys are `caloriesKcal`, `proteinG`, `carbsG`, `fatG`, `fiberG`, `sugarG`, `sodiumMg`, `calciumMg`, `ironMg`, `vitaminB12Mcg`, `vitaminDMcg`. A reviewer must establish units/provenance before conversion. Do not fill historical nutrition with current food data and thereby change an old diary/meal/recipe snapshot.
- Recipes: old `categoryId` becomes reviewed `categoryIds`; `prepTimeMinutes`/`cookTimeMinutes` correspond to `prepMinutes`/`cookMinutes`; `steps.stepNumber` corresponds to `steps.order`. Ingredients require `foodNameSnapshot`, resolved `nutritionPer100g`, allergen/diet flags, quantity/unit and explicit gram equivalent. Keep the original historical snapshot; missing snapshots are a blocker rather than an instruction to recalculate silently.
- Pantry/planning/tracking: preserve embedded item IDs, snapshot values, dates and owner relationships. Do not merge separate pantry items by name alone. Resolve multiple active meal plans and duplicate per-user keys before building unique indexes.
- Media: preserve owner, object key, bucket and lifecycle state. Never infer public access from a public URL, or treat pending objects as ready. Existing public objects need infrastructure-level access remediation in the bucket, not just API response filtering.
- Content/engagement: preserve `_id`, author/target references, soft-delete state and snapshots. `version` is a server compare-and-set field. Existing view/reaction/rating/save counters must not be reset or guessed. Unique reaction/save/rating/watch/delivery records need duplicate reconciliation before index creation.
- AI/reminders: preserve owner, proposal result/idempotency state, notification delivery key and reminder occurrence/claim state. Historical free-form AI records or schedule shapes require explicit review rather than casts into `Mixed` fields.

## Supported migration command

```bash
npm run migrate                # default read-only DB inventory
npm run migrate -- --dry-run   # explicit equivalent
npm run migrate -- --apply     # explicitly authorized normalization only
```

These commands require a configured DB and are operational actions; do not run them against a database merely to test imports. No database migration was executed during this implementation.

`--apply` is deliberately narrow: recognized user role/status casing, recognized enum status casing, agreed/missing master-data status from a boolean `isActive`, and initializing a missing canonical `version` to zero. It does not copy collections, convert references, rewrite snapshots, invent slugs, remove legacy fields, rebuild indexes, or delete anything. Required missing fields, unknown statuses, conflicting flags, legacy nutrition fields, string references, populated legacy aliases and scan truncation block all writes. The per-collection scan cap is 10,000 documents; larger datasets need a separately reviewed bounded migration.

Each update compares original role/status/isActive/version fields, uses an explicit MongoDB transaction, and aborts on a concurrent mismatch. Apply therefore requires an Atlas/replica-set MongoDB. The report logs counts and record IDs/reasons, not raw document contents, tokens or health snapshots. Dry-run may still connect/read the database; only importing its pure helpers is offline.

## Deployment procedure

1. Back up and test restoration first. Use staging restored from production with access controls and private media.
2. Stop application writers and the reminder scheduler during inventory and any approved apply. Keep the maintenance window small; do not normalize against concurrent writes.
3. Inventory actual collections/casing and duplicate unique keys. Compare active models with the table and migration report.
4. Review each legacy field/collection, orphan and conflict. A reviewed manual copy must preserve `_id` and snapshots, validate canonical shape, reject conflicting `_id`/UID/slug/owner keys and record counts. Do not use blind `renameCollection`, `$merge` overwrite, or delete legacy sources.
5. Apply only the approved safe normalization, then run a second inventory and compare counts. Verify relationships and snapshots on staging.
6. Run `npm run db:indexes` to review the read-only inventory. During stopped-writer maintenance, run `npm run db:indexes -- --apply --maintenance`; add `--retire-old-active-index` only when retiring the obsolete named partial index is intended. The tool builds canonical indexes, transactionally backfills consistent missing slots, verifies pointers, and only then optionally drops that one obsolete index. It rejects conflicting/orphan pointers, duplicate active plans and scans exceeding 10,000 records. Index DDL is not transactional; if any build fails, keep traffic stopped and inspect the report before retrying. Startup uses `autoIndex: false`; the normalization migration remains separate.
7. Start a single scheduler instance, verify liveness/readiness and authorized client flows, and monitor errors. Keep backup/rollback plan until acceptance.
