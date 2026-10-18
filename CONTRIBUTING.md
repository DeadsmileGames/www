# Contributing

## Local development

- Use Node.js 24 or newer.
- Run `npm ci` to install the versions recorded in `package-lock.json`.
- Run `npm run dev` for local development.
- Run `npm run build` before `npm test`. The test suite covers URL/date utilities and smoke-tests the built SPA routes through Vite Preview.
- Run `npm run build` and `npm audit --audit-level=high` before proposing dependency changes.

## Pull requests

Work in a branch and target `main`. Keep changes scoped, explain user-visible behavior changes, and include tests for changed business rules. Do not add secrets, tokens, production data, generated build output, or unrelated formatting changes.

Coordinate API contract changes with the API and launcher repositories. A shop link does not prove ownership of a paid game. For changes to game access, library behavior, authentication, videos, or localized content, describe the affected cases and how they were verified.
