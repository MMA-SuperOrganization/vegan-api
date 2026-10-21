# Expanded mobile integration — 2026-10-21

The mobile app now connects the existing AI, media, pantry, community, reports, moderation and reminders APIs. No additional endpoint or persistence migration was required for these modules. Auth sync was corrected to preserve an owner's edited display name across subsequent Firebase syncs.

## Verification

Run Node 24+. Start the frontend web server on port 8085, then run:

    npm run test:expanded:mobile

Override SPRINT2_FE_URL to target another local frontend port. The script starts a real Express/container instance with in-memory repositories. Firebase identity, AI generation, presigned object storage and device messaging are isolated at provider boundaries. It does not connect production accounts, publish production posts or send actual push notifications.

The 390×844 browser flow checks:

- AI conversation/send/feedback and persisted history.
- Proposal review without side effects, explicit confirmation, plan retrieval and activation.
- Bulk pantry add, expiry query, recipe matching, image upload/confirmation/recognition and explicit pantry confirmation.
- Grocery generation subtracting available pantry ingredients.
- Community draft/submit, reaction toggle state, comment create/edit and report submission.
- Reminder create/pause/resume/edit/delete.
- User/admin route isolation and unregistering FCM before logout.
- Admin publish/reject, report-to-case linking, hide/restore and resolution propagation.

Latest successful run: 46 browser mutations and 3 offline AI provider calls; screenshots under test-results/expanded-mobile (ignored).

Other verification: 579 backend tests pass, 50 opt-in tests skip; build checks 252 JS files and 184 operations. The independent MongoDB persistence runner for Sprint 2 is documented in the workspace requirements audit.

## Runtime prerequisites

AI_ENABLED enables chat/planning/recognition and needs AI provider credentials/models. REMINDER_SCHEDULER_ENABLED starts the reminder poller; FCM_ENABLED and Firebase messaging configuration permit device delivery. Respect push preferences/quiet hours. Register Android native FCM tokens, not Expo push tokens.

The user explicitly authorized changing local .env and enabling AI, reminder scheduling and FCM. All three flags are now true; the real backend runs on port 3000 with health/readiness/catalog HTTP 200. A real provider request returned HTTP 401 invalid_authentication_error. A valid AI_API_KEY is still required locally; no credential was printed or committed. No connected Android device was available to verify real FCM receipt. Enabling scheduling can process reminders already in the database.

Media upload uses POST /media/upload-requests → signed PUT without application bearer token → POST /media/:id/confirm. Browser uploads require bucket CORS allowing PUT and Content-Type. Do not place provider secrets in frontend configuration.

AI plans remain drafts until explicitly activated. Activation uses POST /meal-plans/:id/activate (not PATCH status=active). Feedback uses PUT /ai/runs/:runId/feedback. Post detail exposes reacted as a reaction type or null. Mobile code and E2E now follow these contracts.

No real native FCM/camera/emulator runtime certification or production deployment is claimed by these tests.
