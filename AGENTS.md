# Repository instructions

## Configuration and secret safety

- Never stage, commit, or push machine-specific configuration, environment files, credentials, service-account files, signing keys, certificates, local SDK paths, or generated provider configuration.
- Protected examples include `.env*` except a sanitized `.env.example`, `google-services.json`, `GoogleService-Info.plist`, service-account JSON, `local.properties`, `*.jks`, `*.keystore`, `*.p8`, `*.p12`, `*.pem`, and `*.key`.
- Do not change or push an already tracked environment-specific configuration file unless the user explicitly names that exact file and acknowledges its team-wide or deployment-wide effect.
- Use sanitized example/template files for shareable configuration. Never place real credentials or private URLs in those templates.
- Before every commit or push, inspect `git diff --cached --name-only`. If a protected file is staged, unstage it and report the issue instead of pushing.
- Normal source-controlled project configuration such as `package.json`, runtime schemas, lint rules, and deployment templates may only be changed when required by the requested implementation; mention such changes in the handoff.
