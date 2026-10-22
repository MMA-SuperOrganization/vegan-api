# Native Android acceptance

These runners are opt-in and require Node 24, Android platform-tools (`adb` on PATH), an installed standalone APK, backend `.env` and the frontend's local Firebase configuration. They never start a development server.

Use a dedicated AVD named **VEGETA_Requirement_Test** on `emulator-5560` (override the serial with `ANDROID_TEST_SERIAL`). Both native runners verify that exact AVD name before clearing app data. Never rename a personal AVD to satisfy this guard.

## Core persistence

Build a test APK whose `EXPO_PUBLIC_API_URL` is `http://127.0.0.1:4011/api/v1`, install it on the test AVD, then run from the backend:

```powershell
node --env-file=.env tests/android/requirements-native.mjs --allow-external-test-user
```

The runner creates a random MongoDB database, verifies it was empty, starts the real HTTP server on port 4011 and reverses that port through ADB. It creates a temporary Firebase identity through the registration UI, verifies database writes directly and deletes that identity afterward. Only the newly generated database is cleared. No application database is seeded, dropped or cleared. AI, outgoing FCM and reminder polling are disabled for this isolated server.

Screenshots, sanitized request status records and assertions are written under ignored `test-results/android-requirements/`.

## Deployed backend

Build a standalone APK with the frontend `.env` API URL (no localhost override), install it on the same test AVD, then run:

```powershell
node --env-file=.env tests/android/deployed-smoke.mjs --allow-external-test-user --android
```

Omit `--android` for an API-only deployment probe. This reads the HTTPS backend URL and public Firebase API key from the frontend's local `.env`. It creates a temporary Firebase identity, verifies deployed auth and makes one real AI request, which can incur provider charges. With `--android`, it also completes the test account's onboarding, signs in through the native UI, opens core tabs/pantry, registers and unregisters the test device's FCM token and signs out.

Cleanup soft-deletes only this generated backend account through its own authenticated API and deletes the temporary Firebase identity. Deployment logs and associated soft-deleted records remain subject to the backend's normal retention policy. API-only output distinguishes AI failure from auth/public API success; inspect `ai.passed` instead of treating process exit alone as AI acceptance.

Provider keys, bearer tokens and passwords are never written to the report. Do not commit environment files, Firebase provider JSON, local signing keys or generated artifacts.
