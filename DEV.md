# NearbyBazaar Developer Guide (DEV.md)

Welcome to NearbyBazaar! This document helps you get productive quickly and serves as a living guide for day-to-day development tasks, gotchas, and tips.

## Prerequisites

- Node.js 18 or 20 (LTS recommended)
- pnpm (installed globally)
- Git
- Docker (optional but recommended for local MongoDB/Redis)

## First-time setup

```powershell
# Install workspace deps
pnpm install

# Copy environment templates and adjust as needed
Copy-Item .env.example .env -ErrorAction Ignore
Copy-Item apps/api/.env.example apps/api/.env -ErrorAction Ignore
Copy-Item apps/web/.env.example apps/web/.env -ErrorAction Ignore
Copy-Item apps/vendor/.env.example apps/vendor/.env -ErrorAction Ignore
Copy-Item apps/admin/.env.example apps/admin/.env -ErrorAction Ignore
```

## Running the stack (dev)

```powershell
# Start API + Web + Vendor + Admin (concurrently)
pnpm dev
```

- Default dev ports (subject to change in scripts):
  - API: 4000
  - Web: 3001
  - Vendor: 3002
  - Admin: 3003

If you only want to run a single app:

```powershell
# Example: API only
pnpm --filter @nearbybazaar/api dev
```

## Local services via Docker

Spin up MongoDB and Redis locally using Docker Compose:

```powershell
# From repo root
docker compose up -d
```

- MongoDB: `mongodb://localhost:27017/nearbybazaar`
- Redis: `redis://localhost:6379`

See `docs/FEATURE_159_DOCKER.md` and `docs/DOCKER_QUICK_REFERENCE.md` for details.

## Database seeding

Idempotent seeders help you set up meaningful development data.

```powershell
# Seed everything (users/vendor/products/service + plans + dropship + agreements + optional kaizen)
pnpm --filter @nearbybazaar/api seed:all

# Or run individually
pnpm --filter @nearbybazaar/api seed:dev         # Core dev data
pnpm --filter @nearbybazaar/api seed:plans       # Classified plans + assignment
pnpm --filter @nearbybazaar/api seed:dropship    # Suppliers/mappings/margin rules
pnpm --filter @nearbybazaar/api seed:agreements  # Vendor agreements
pnpm --filter @nearbybazaar/api seed:kaizen      # Example ideas/decisions (requires SEED_KAIZEN_EXAMPLES=true)
```

Notes:

- Configure `apps/api/.env` for `MONGODB_URI`.
- Safe to re-run: all seeders upsert/update without duplicating.

## Testing

```powershell
# Unit/Integration tests (workspace)
pnpm test

# API tests only
pnpm --filter @nearbybazaar/api test

# API: run full integration suites (Mongo/Redis heavy)
$env:RUN_INTEGRATION = 'true'; pnpm --filter @nearbybazaar/api test; Remove-Item Env:RUN_INTEGRATION

# API: run unit-only (default)
pnpm --filter @nearbybazaar/api test

# E2E tests (Playwright)

Notes:
- On Windows, mongodb-memory-server requires Microsoft Visual C++ Redistributable (vc_redist). If you see exit code 3221225781, install the latest from Microsoft Docs.
- During Jest runs we disable BullMQ workers to avoid requiring Redis. This is controlled by NODE_ENV=test (automatic) or setting NO_QUEUE=true.
pnpm test:e2e
```

- CI runs lint/build/test; E2E launches apps on known ports and runs Playwright. Artifacts (coverage, reports) are uploaded on failure.

## Linting & formatting

- Pre-commit hooks run ESLint + Prettier on changed files (via Husky + lint-staged).
- Pre-push hook runs tests.
- You can run lint manually:

```powershell
pnpm -w lint
```

## API docs (OpenAPI/Swagger)

- Visit Swagger UI at: `http://localhost:4000/v1/docs`
- Raw JSON: `http://localhost:4000/v1/docs/swagger.json`
- We use `swagger-jsdoc`; add JSDoc annotations to routes/controllers and they’ll appear automatically.

## Debugging tips

- Ports already in use:
  - Stop previous dev servers or adjust ports in `package.json` scripts.
- Mongo/Redis connection errors:
  - Ensure Docker services are running or update `MONGODB_URI`/`REDIS_URL` in env files.
- Jest OOM or slow tests:
  - Try `pnpm test:ci` to run serially; use `--runInBand` for resource-limited environments.
  - To include Mongo-heavy suites locally: `set RUN_INTEGRATION=true && pnpm --filter @nearbybazaar/api test` (cmd) or `$env:RUN_INTEGRATION='true'; pnpm --filter @nearbybazaar/api test` (PowerShell).
- Playwright issues:
  - Use `pnpm test:e2e:ui` to run the UI test runner.

## Common commands (reference)

```powershell
# Clean build outputs
pnpm clean

# Rebuild everything
pnpm build

# Run a specific app
pnpm --filter @nearbybazaar/web dev

# Check servers before E2E
node scripts/check-servers.js
```

## Contributing conventions

- TypeScript everywhere, strict mode wherever practical.
- Keep shared logic in `packages/lib` when possible.
- Prefer Zod schemas for runtime validation and keep them close to models/controllers.
- Commit messages: concise, imperative; reference feature numbers when applicable (e.g., "feat(162): swagger docs").

## CI/CD

- CI runs on push/PR: install → lint → build → test (+ E2E smoke).
- See `.github/workflows/ci.yml` for details.

## Security & secrets

- Never commit real secrets. Use `.env` files locally; CI uses repository secrets.
- See `SECURITY.md` for policies.

## Roadmap & modules overview

- See `docs/` for detailed feature docs (Forms, Dropship, SEO, Watermarking, Plans, etc.).
- High-level plan lives in `.github/copilot-instructions.md`.

## Keep this file fresh

- As you add features or find gotchas, update this guide. Short snippets and links are welcomed.

# NearbyBazaar Developer Guide

Welcome to the NearbyBazaar monorepo! This guide covers setup, development workflows, testing, and troubleshooting.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Initial Setup](#initial-setup)
- [Development Workflow](#development-workflow)
- [Testing](#testing)
- [Building for Production](#building-for-production)
- [Troubleshooting](#troubleshooting)

## Prerequisites

- **Node.js**: v18 or higher
- **pnpm**: v8 or higher (`npm install -g pnpm`)
- **MongoDB**: For API development (local or Docker)
- **Redis**: For caching and queues (local or Docker)

## Initial Setup

1. **Clone the repository**

   ```bash
   git clone <repo-url>
   cd nearbybazaar
   ```

2. **Install dependencies**

   ```bash
   pnpm install
   ```

3. **Set up environment variables**

   ```bash
   cp .env.example .env
   # Edit .env with your local configuration
   ```

4. **Start MongoDB and Redis** (if using Docker)

   ```bash
   docker-compose up -d
   ```

5. **Run database migrations**

   ```bash
   pnpm --filter @nearbybazaar/api migrate
   ```

6. **Seed development data**
   ```bash
   pnpm --filter @nearbybazaar/api seed:dev
   ```

## Development Workflow

### Starting Dev Servers

**All apps at once:**

```bash
pnpm dev
```

This starts:

- API server on `http://localhost:4000`
- Web (customer) PWA on `http://localhost:3001`
- Vendor PWA on `http://localhost:3002`
- Admin PWA on `http://localhost:3003`

**Individual apps:**

```bash
# API only
pnpm --filter @nearbybazaar/api dev

# Web PWA only
pnpm --filter @nearbybazaar/web dev

# Vendor PWA only
pnpm --filter @nearbybazaar/vendor dev

# Admin PWA only
pnpm --filter @nearbybazaar/admin dev
```

### Code Quality

**Linting:**

```bash
pnpm lint
```

**Type checking:**

```bash
pnpm -r tsc --noEmit
```

**Formatting:**

```bash
pnpm format
# Or auto-fix:
pnpm format:fix
```

## Testing

### Git Hooks (Husky)

**Feature #158: Automatic Code Quality Enforcement**

The repository uses Husky to enforce code quality via Git hooks:

**Pre-commit Hook**:

- Runs `lint-staged` on staged files only
- Auto-fixes ESLint issues where possible
- Formats code with Prettier
- Very fast (< 5 seconds typically)

**Pre-push Hook**:

- Runs full Jest test suite before push
- Catches failing tests before they reach CI
- Takes ~10-30 seconds depending on suite size

**Installation**:
Hooks are installed automatically via `pnpm install` (using the `prepare` script).

**Bypassing Hooks** (emergency only):

```bash
git commit --no-verify  # Skip pre-commit
git push --no-verify    # Skip pre-push
```

⚠️ **Use `--no-verify` sparingly** - it defeats the purpose of quality checks.

**Troubleshooting Hooks**:

- If hooks don't run: `pnpm exec husky install`
- If permission errors (Mac/Linux): `chmod +x .husky/*`
- See `docs/FEATURE_158_HUSKY_HOOKS.md` for detailed troubleshooting

### Unit & Integration Tests (Jest)

**Run all tests:**

```bash
pnpm test
```

**Watch mode:**

```bash
pnpm test:watch
```

**Coverage report:**

```bash
pnpm test
# Open coverage/lcov-report/index.html in browser
```

**Test specific package:**

```bash
# Test lib utilities
pnpm --filter @nearbybazaar/lib test

# Test API
pnpm --filter @nearbybazaar/api test
```

### End-to-End Tests (Playwright)

**Feature #157: Playwright Smoke Tests**

E2E tests verify critical user flows across all PWAs using headless Chromium.

**Prerequisites:**

- Dev servers must be running before E2E tests
- Playwright browsers installed (`npx playwright install`)

**Run E2E tests:**

```bash
# 1. Start dev servers in one terminal
pnpm dev

# 2. In another terminal, run E2E tests
pnpm test:e2e
```

**E2E Test Options:**

```bash
# Run with UI mode (interactive)
pnpm test:e2e:ui

# Run in headed mode (see browser)
pnpm test:e2e:headed

# Debug mode (step through tests)
pnpm test:e2e:debug

# Run specific test file
npx playwright test tests/e2e/web.spec.ts

# Run specific project (e.g., only web PWA)
npx playwright test --project=web-chromium
```

**E2E Test Structure:**

- `tests/e2e/web.spec.ts` - Customer PWA smoke tests
- `tests/e2e/vendor.spec.ts` - Vendor PWA smoke tests
- `tests/e2e/admin.spec.ts` - Admin PWA smoke tests
- `tests/e2e/fixtures/` - Shared test utilities and data

**Writing New E2E Tests:**

1. Add test files to `tests/e2e/`
2. Use descriptive test names and organize with `test.describe()`
3. Follow the pattern: Arrange → Act → Assert
4. Keep tests independent (no shared state between tests)
5. Use data-testid attributes for reliable selectors

**Example:**

```typescript
import { test, expect } from '@playwright/test';

test('should add product to cart', async ({ page }) => {
  await page.goto('/p/sample-product');
  await page.click('[data-testid="add-to-cart"]');
  await expect(page.locator('[data-testid="cart-count"]')).toHaveText('1');
});
```

**CI Integration:**

- E2E tests run automatically on PRs via GitHub Actions
- Tests use `reuseExistingServer: false` in CI to start fresh servers
- Retries: 2 attempts in CI, 0 locally
- Artifacts: Screenshots and traces saved on failure

## Building for Production

**Build all apps:**

```bash
pnpm build
```

**Build specific app:**

```bash
pnpm --filter @nearbybazaar/api build
pnpm --filter @nearbybazaar/web build
```

**Clean build artifacts:**

```bash
pnpm clean
```

## Troubleshooting

### Common Issues

**Port already in use:**

```bash
# Kill process on port (Windows PowerShell)
Get-Process -Id (Get-NetTCPConnection -LocalPort 3001).OwningProcess | Stop-Process

# Or change port in app's package.json dev script
```

**TypeScript errors in monorepo:**

- Ensure all `@nearbybazaar/*` packages are built: `pnpm build`
- Clear TypeScript cache: `pnpm -r tsc --build --clean`

**Tests failing with MongoDB connection:**

- Check MongoDB is running: `docker ps` or `mongosh`
- Verify `MONGODB_URI` in `.env`
- For unit tests, ensure test setup uses in-memory MongoDB

**E2E tests timeout or fail:**

- Verify dev servers are running: `pnpm dev` (or use pretest:e2e check)
- Check browser installation: `npx playwright install chromium`
- Increase timeout in `playwright.config.ts` if needed
- Run with `--headed` to see what's happening

**Module not found errors:**

- Run `pnpm install` at root to sync dependencies
- Check `tsconfig.json` paths are correct
- Verify workspace references in `pnpm-workspace.yaml`

### Getting Help

- Check feature documentation in `docs/`
- Review existing tests for examples
- Open an issue with reproduction steps

## Feature Implementation Status

- ✅ Feature #154: Slug History + 301 Redirects
- ✅ Feature #155: JSON-LD Schema (Products, Services, Stores)
- ✅ Feature #156: Jest Setup (Monorepo Unit Tests)
- ✅ Feature #157: Playwright Smoke Tests (E2E)
- ✅ Feature #158: Husky Git Hooks (Pre-commit & Pre-push)
- 🚧 Additional features in progress...

## Next Steps

1. Read `docs/ARCHITECTURE.md` for system design
2. Check `docs/API.md` for API documentation
3. Review `OPS.md` for deployment and operations
4. See `.github/copilot-instructions.md` for full feature plan
