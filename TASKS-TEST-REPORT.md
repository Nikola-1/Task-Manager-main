# Tasks test report — 2026-11-09

## Results

- `npm run test:tasks`: 28 passed, 1 failed (29 checks).
- `npm run test:user-data`: 17 passed, including priority authorization and invalid-priority rejection.
- Tasks ESLint: 23 errors, 11 warnings. Full output: `tasks-lint-results.txt`.
- TypeScript: 7 diagnostics in Tasks files; other project diagnostics also exist. Full output: `tasks-typecheck-results.txt`.
- `GET http://localhost:3000/pages/Task`: HTTP 200. This only verifies that the route responds.

## Confirmed functional defect

`renameTask` in `src/features/tasks/data/tasks.repository.ts` accepts names longer than 200 characters. Task creation rejects those names. The failing regression test expects the same limit before any database write. Rename also does not reuse the creation checks for invisible-only names and embedded control characters (code inspection).

## Automated coverage

Tests exercise actual TypeScript modules with a mocked database and storage transport: required values, name/file boundaries, invalid identifiers and dates, priority/date sorting and input immutability, creation payload and tag deduplication, cleanup after partial creation failures, shared attachment preservation, storage failure retry safety, and rename validation.

Database mocks do not validate live schema, RLS policies, or network behavior. No real tasks were created, changed, or deleted.

## Limitations

Interactive browser testing was unavailable: browser inventory reported `The browser access host is unavailable`. Creation/editing/completion/filtering through the UI and persistence against the real database remain unverified.

Application code was not changed as part of this test pass. The failing test intentionally remains to document the defect.
