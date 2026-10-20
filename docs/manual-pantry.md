# Manual pantry flow

The mobile app exposes **Grocery → Open pantry** (Vietnamese: **Mua sắm → Mở kho nguyên liệu**). The frontend routes are `/pantry` and `/pantry/item?itemId=<uuid>`; omitting `itemId` opens the add form.

The existing `pantries` module supplies the complete manual CRUD API. This integration reuses that service, validation, owner checks, repositories, canonical model and optimistic version checks. No database migration, provider setup or new runtime configuration is required.

## HTTP contract

All paths below are relative to `/api/v1` and require the signed-in owner's bearer token.

| Method | Path                                      | Behavior                                                                      |
| ------ | ----------------------------------------- | ----------------------------------------------------------------------------- |
| GET    | `/pantry`                                 | Return the owner's pantry; create an empty aggregate if absent                |
| POST   | `/pantry/items`                           | Add one ingredient and return the updated pantry                              |
| PATCH  | `/pantry/items/:itemId`                   | Update quantity, unit, expiry or note                                         |
| DELETE | `/pantry/items/:itemId`                   | Delete the ingredient, retaining the pantry                                   |
| GET    | `/pantry/expiring?days=7&page=1&limit=20` | Paginated ingredients expiring from now through the cutoff, ordered by expiry |

Create payload:

```json
{
  "foodItemId": "200000000000000000000001",
  "quantity": 500,
  "unit": "g",
  "expiresAt": "2026-10-25T16:59:59.999Z",
  "note": "Keep chilled"
}
```

`foodItemId` must resolve to an active catalog entry. The server owns `itemId`, `foodNameSnapshot`, timestamps and user identity. Quantity must be positive and no greater than 1,000,000; units follow the shared measurement-unit enum. Expiry and note are optional. To clear them, send `expiresAt: null` and `note: ""`. An update cannot change the food ID. Adding the same food twice creates separate entries, allowing different batches and expiry dates. An inventory contains at most 500 entries.

Successful CRUD responses use `{ success: true, data: <pantry>, meta: ... }` with status 200. `data.items` contains stable UUID `itemId` values. Private bulk-request bookkeeping is excluded. Invalid inputs return 400, unavailable foods and other owners' ingredient IDs return 404, and exhausted concurrent-update retries return 409.

## Expiry behavior

The mobile form accepts `YYYY-MM-DD`, stores local end of day as an ISO instant, and displays dates in the device timezone. An unchanged expiry is preserved when editing other fields. A blank expiry means unknown, not expired. The inventory filters the full returned aggregate (bounded at 500 items) into all, expiring within seven days and expired, and sorts by expiry. It recalculates the time boundary every minute while mounted. The paginated `/pantry/expiring` endpoint remains available independently; `includeExpired=true` also includes expired entries through the cutoff.

This delivery implements manual inventory management and expiry visibility. AI recognition, bulk-add UI and scheduled expiry notifications are separate flows.

## Verification

Use Node.js 24 or newer from the backend directory:

```powershell
node node_modules/vitest/vitest.mjs run tests/integration/pantry-mobile.test.js tests/unit/planning.http.test.js tests/unit/planning.test.js
```

For browser integration, start the frontend with `npx expo start --offline --port 8085`. Then run from the backend directory with Chrome installed:

```powershell
node tests/browser/pantry-mobile.mjs
```

The browser script runs the real frontend against an injected backend app with in-memory persistence and fake authentication. Every API request is intercepted and forwarded to that app; external requests are blocked. It checks entry from Grocery, catalog pagination, validation, API failure/retry without losing the draft, create, expiry filters, edit, reload, English/Vietnamese and deletion cancellation/confirmation at 390 × 844. Screenshots are written to ignored `test-results/pantry-mobile/`.

Frontend checks: `npm run typecheck`, `npm run lint`, `npm run test:ui`. These checks do not establish live MongoDB/Firebase connectivity or Android/iOS device behavior.
