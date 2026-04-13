# API Setup

## Environment variables
1. Copy `.env.example` to `.env`.
2. Set `DATABASE_URL` to your development database.
3. Set `TEST_DATABASE_URL` to a separate test database.

## Commands
- Run API in dev mode: `npm --workspace apps/api run dev`
- Run API tests: `npm --workspace apps/api test`
- Build API: `npm --workspace apps/api run build`

## Notes
- Tests run in-band with open handle detection for stability.
- During tests, the API DB layer prefers `TEST_DATABASE_URL` and falls back to `DATABASE_URL` if needed.
