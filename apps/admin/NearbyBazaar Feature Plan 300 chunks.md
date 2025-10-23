NearbyBazaar Feature Plan 300 chunks
You are a code generation tool. Your task is to implement the NearbyBazaar e-commerce
platform using a monorepo structure with pnpm workspaces. The project must be built in a
step-by-step, chunk-wise manner, following the instructions below.
Project Overview
Build the 'NearbyBazaar' e-commerce platform in a monorepo.
Technology Stack: Next.js (frontend), Node.js/Express (backend), MongoDB (database),
TypeScript.
Architecture: Monorepo with pnpm workspaces.
Module-Based Implementation Plan

1. Core Setup (chunks 1-15)
   Initialize the monorepo and workspaces.
   Set up configurations like Git, Prettier, ESLint, and Jest.
   Create shared packages (types, libs, ui).
   Create the base structure for all apps (api, web, vendor, admin).
2. Backend Development (API - chunks 16-100)
   User Management: User model, registration, login, JWT tokens, and profile management.
   Products and Services: Product schema, CRUD operations, search functionality.
   Orders and Transactions: Cart management, order flow, and payment integration
   (PhonePe/UPI).
   Vendor Management: Vendor verification (KYC), vendor dashboard, and product listings.
   Security: Rate-limiting, CORS, and data validation.
3. Frontend Development (WEB, VENDOR, ADMIN - chunks 101-250)
   Consumer Web App: UI components with Next.js, authentication flow, product listing and
   detail pages.
   Vendor App: Vendor dashboard, product upload form, and order tracking.

Admin Panel: Management panels for users, vendors, and content.

UI/UX: Using Tailwind CSS and shared UI components.

Integrations: Cloudinary for image uploads, Brevo for email.

4.  Advanced Features and Improvements (chunks 251-300)

SEO and Performance: Meta tags, sitemaps, and image optimization.

Security: Bot protection (CAPTCHA) and logging.

Social and Referrals: Referral system and user reviews.

Push Notifications: Using Firebase.

5. Additional and Final Steps (chunks 301-315)

CI/CD Pipeline: Automated deployment with GitHub Actions.

Logging and Monitoring: Structured logging with pino.

Security Testing: End-to-end security testing with Playwright.

Backup and Recovery: Database backup plan.

**Project Context:** - **Framework:** Next.js (for PWA frontend), Node.js with Express (for backend API). - **Languages:** TypeScript throughout the codebase. - **Database:** MongoDB with Mongoose. - **Tools & Libraries:** Vite, Tailwind, Zod, Jest (unit tests), Playwright (E2E tests),
Cloudinary (image uploads), Brevo (email), and PhonePe/UPI (payments). - **Architecture:** Monorepo using `pnpm workspaces`. The directory structure must be
`apps/{api,web,vendor,admin}/` and `packages/{types,lib,ui}/`.

**Environment Setup (PowerShell in VS Code):**

1.  **Prerequisites:** Ensure Node.js (v18 or higher) and pnpm are installed globally.
    `npm install -g pnpm`
2.  **Project Initialization:** Create the project directory and set up the monorepo.
`mkdir NearbyBazaar`
`cd NearbyBazaar`
`New-Item pnpm-workspace.yaml -Type File`
`'packages:' | Out-File pnpm-workspace.yaml`
`'  - "apps/*"' | Add-Content pnpm-workspace.yaml`
`'  - "packages/*"' | Add-Content pnpm-workspace.yaml`
`pnpm init -w`
`mkdir apps packages`
`mkdir apps/api apps/web apps/vendor apps/admin`
`mkdir packages/types packages/lib packages/ui`
**Task: Chunk-wise Code Generation (1 to 300)**
Generate the code for each chunk sequentially. For each chunk, provide the complete file
content, any new dependency installation commands (`pnpm add -w` or `pnpm add -D -w`),
and any necessary environment variables. The code must be production-ready and free of
errors when run with `pnpm -w build` after each step.
**Instructions for Each Chunk:** - **File Paths:** Use the full, correct monorepo path (e.g.,
`apps\web\src\components\Header.tsx`). - **File Content:** Provide the complete code for new files. For existing files, provide the
logic to be appended or modified. Do not overwrite existing code unless explicitly instructed. - **Dependencies:** List all new dependencies with their `pnpm add` command. - **Notes:** Include any necessary notes for `README.md` or `.env` files.
**Example Chunk Structure to Follow:**
Chunk 001 - Workspace Scaffolding
Objective: Set up the monorepo skeleton.
File to Create: apps\web\package.json
Code:
<!-- end list → 
You will now begin generating the code starting with Chunk 002, and continuing sequentially 
up to Chunk 300. 
Phase 1: Core Platform Foundation (001–165) 
. 
Workspace & Initial Setup (001–010) 
001 — Workspace Scaffolding 
Feature: Monorepo skeleton with workspaces. 
Paths: pnpm-workspace.yaml; root package.json; apps/{api,web,vendor,admin}/; 
packages/{types,lib,ui}/. 
Tech: pnpm workspaces, TS baseline. 
Deps: none. 
Tests/Mig/Env: N/A. 
Agent: Scaffold dirs & minimal package.json per workspace with placeholder 
build/dev/clean. 
002 — Root Scripts 
Feature: Root scripts for build/dev/lint/test/clean. 
Paths: root package.json (scripts), add concurrently, rimraf. 
Tech: pnpm recursive, concurrently. 
Deps: dev concurrently, rimraf. 
Tests/Mig/Env: N/A. 
Agent: Ensure pnpm -w build/dev run API+PWAs concurrently (reserve ports). 
003 — TypeScript/ESLint/Prettier 
Feature: TS configs, lint/format baseline. 
Paths: root tsconfig.json, .eslintrc, .eslintignore, .prettierrc, .prettierignore; per‑pkg 
tsconfig.json. 
Tech: typescript, @typescript-eslint, prettier. 
Deps: dev typescript, eslint, @typescript-eslint/, prettier, eslint-config-prettier, 
eslint-plugin-prettier. 
Tests/Mig/Env: N/A. 
Agent: Strict TS, enable JSX in UI/apps, ensure lint passes. 
004 — Env Template 
Feature: .env.example with all keys. 
Paths: root .env.example, README (env section). 
Tech: dotenv (for API). 
Deps: none (for now). 
Tests/Mig/Env: Environment keys list (e.g. MONGODB_URI, REDIS_URL, JWT_SECRET, 
CLOUDINARY_, PHONEPE_, BREVO_API_KEY, various PORTs, etc). 
Agent: Keep .env.example updated as new keys are added. 
005 — Shared Types 
Feature: Create @nearbybazaar/types package for cross-app TypeScript types. 
Paths: packages/types/src/index.ts (define shared interfaces/types like UserRole, ApiResult, 
BaseEntity, Address, various ID types); setup build output to dist. 
Tech: TypeScript declaration outputs. 
Deps: other workspaces depend on @nearbybazaar/types. 
Tests/Mig/Env: N/A. 
Agent: Configure package to emit .d.ts files; refactor apps to use these shared types. 
006 — Core Lib 
Feature: Create @nearbybazaar/lib utilities (e.g. SKU generator, slug generator, SEO 
helpers, pricing functions, watermark stubs). 
Paths: packages/lib/src/{sku.ts, slug.ts, seo.ts, pricing.ts, watermark.client.ts, 
watermark.server.ts, index.ts}. 
Tech: Plain TypeScript, no heavy external dependencies. 
Deps: none. 
Tests/Mig/Env: Include minimal unit test stubs for utility functions. 
Agent: Export typed utility functions; (Later phases will expand these utilities). 
007 — UI Library 
Feature: Create @nearbybazaar/ui with basic reusable React components. 
Paths: packages/ui/src/{Button.tsx, Spinner.tsx, ThemeProvider.tsx, index.ts} plus minimal 
CSS (e.g. CSS variables for theme). 
Tech: React 18, JSX/TSX, CSS variables for theming. 
Deps: peer dependencies on react and react-dom. 
Tests/Mig/Env: Optionally stub out stories/previews for components. 
Agent: Implement basic components and ensure the package can be built and consumed by 
apps. 
008 — API Init + Mig/Seed Stubs 
Feature: Initialize Express API app, connect to MongoDB, set up migration/seed structure. 
Paths: apps/api/src/{index.ts, utils/errors.ts, migrations/runner.ts, seeders/dev.ts}. 
Tech: Express, Mongoose for Mongo, dotenv for config, CORS enabled. 
Deps: express, cors, mongoose, dotenv; dev deps: ts-node, nodemon for development. 
Tests/Mig/Env: Provide a /health endpoint; stub out a migration and a development seeder; 
use MONGODB_URI from env. 
Agent: Compile API to dist, ensure it starts on configured PORT. 
009 — Mailer + Queue Stubs 
Feature: Set up Nodemailer and BullMQ for async jobs (e.g. email sending). 
Paths: apps/api/src/{services/mailer.ts, queues/index.ts}. 
Tech: nodemailer for SMTP emails, BullMQ for job queue, ioredis for Redis connection. 
Deps: nodemailer, bullmq, ioredis. 
Tests/Mig/Env: Define env keys SMTP_*, MAIL_FROM, REDIS_URL; add a test route that 
enqueues an email job. 
Agent: Ensure queue workers start with the API process (for development, possibly in same 
process). 
010 — Standard API Result (Zod) 
Feature: Unified API response envelope for success/error using Zod for validation. 
Paths: apps/api/src/utils/apiResponse.ts. 
Tech: Zod schemas for results. 
Deps: zod. 
Tests/Mig/Env: Update /health to return { success: true, data: ... }; create a test 
error route to demonstrate error envelope. 
Agent: Enforce using this standard response format in all controllers (wrap data and errors 
accordingly). 
PWA & Frontends (011–020) 
011 — Web PWA Shell 
Feature: Next.js app for customers with PWA capabilities. 
Paths: apps/web/{pages, components, public/manifest.json, next.config.js}. 
Tech: Next.js 14, configured with next-pwa for offline support, next-transpile-modules to 
include @nearbybazaar/ui and @nearbybazaar/lib. 
Deps: next, react, react-dom, next-pwa. 
Tests/Mig/Env: Runs on port 3001 in development; include a manifest and basic icons; add 
a smoke-test page to verify setup. 
Agent: Set up basic layout and route structure for the web client. 
012 — Vendor PWA 
Feature: Next.js app for vendors (merchant portal) with PWA behavior (optional). 
Paths: apps/vendor/... (similar structure to web app); use port 3002 for dev. 
Tech: Next.js (same version as web); possibly configure PWA as well. 
Deps: same core dependencies as web app. 
Tests/Mig/Env: Include a simple navbar and dashboard stub page. 
Agent: Use @nearbybazaar/ui components to ensure design consistency. 
013 — Admin PWA 
Feature: Next.js app for admin portal. 
Paths: apps/admin/...; use port 3003 for dev. 
Tech: Next.js. 
Deps: same core deps (next, react, etc). 
Tests/Mig/Env: Stub out basic section pages (e.g. Users, Orders) to ensure routing works. 
Agent: Prepare for protected routes (to be implemented later). 
014 — Dark Mode + i18n (en/hi) 
Feature: Add dark/light theme toggle and internationalization (English/Hindi). 
Paths: packages/ui/ThemeProvider.tsx (manage CSS variable themes); apps/*/locales/{en, 
hi}.json for translations; possibly an i18n context or use react-i18next. 
Tech: CSS variables for theming; use react-i18next or a lightweight custom context for 
translations. 
Deps: If using react-i18next, include react-i18next and i18next. 
Tests/Mig/Env: Theme preference persists in localStorage; verify language toggle swaps 
text. 
Agent: Implement a LanguageSwitcher component; ensure visible strings in the UI are 
pulled from locale files. 
015 — Routes (/, /p/:slug, /s/:slug, /c/:slug, /store/:slug) 
Feature: Implement Next.js dynamic routes for key pages (home, product detail, service 
detail, classified detail, storefront). 
Paths: apps/web/pages/{index.tsx, p/[slug].tsx, s/[slug].tsx, c/[slug].tsx, store/[slug].tsx}. 
Tech: Next.js file-based routing for dynamic segments. 
Deps: slugify function from @nearbybazaar/lib for generating slugs. 
Tests/Mig/Env: Ensure links from home page navigate to these pages (e.g. sample links for 
a product, service, etc.). 
Agent: Set up stub pages that can render based on slug (SSR/CSR), with TypeScript types 
for query params. 
016 — Local Search Faceting 
Feature: Client-side search UI with category/type filters. 
Paths: apps/web/pages/search.tsx, apps/web/components/SearchBar.tsx (and any needed 
components); optionally include sample data for testing UI. 
Tech: React state management for search query and filters; later to be integrated with a 
search engine (Meilisearch/Elastic). 
Deps: none for now (using local state and dummy data). 
Tests/Mig/Env: Keep search query in sync with URL query parameters. 
Agent: Build an accessible interface with filters for Products, Services, Classifieds, etc., and 
a search bar. 
017 — Cart/Booking/Inquiry Stubs 
Feature: Frontend UX flows for adding to cart (products), booking services, and sending 
inquiries for classifieds. 
Paths: apps/web/context/CartContext.tsx (to manage cart state); apps/web/pages/cart.tsx; 
apps/web/pages/book/[slug].tsx; apps/web/pages/inquire/[slug].tsx. 
Tech: React Context for cart management; use localStorage to persist cart between 
sessions. 
Deps: none (basic state only). 
Tests/Mig/Env: Basic form validation on booking/inquiry forms. 
Agent: Add "Add to Cart", "Book Service", "Inquire" buttons on relevant detail pages that 
trigger these flows (e.g. updating context or navigating to form page). 
018 — Toasts + Mailer Hooks 
Feature: User feedback toasts and hooking front-end inquiries/bookings to the API queue 
system. 
Paths: packages/ui/src/ToastProvider.tsx (and related toast components); API: implement 
endpoints POST /inquiry and POST /booking to accept data. 
Tech: Use fetch in front-end to call API endpoints; configure CORS in API to allow dev 
origins. 
Deps: none (toasts implemented in-house). 
Tests/Mig/Env: Add ADMIN_EMAIL in .env for where inquiries/bookings emails should go; 
show success/error toasts on submission. 
Agent: When inquiry or booking is submitted, enqueue a job in the API’s mailer queue 
(stubbed); display a confirmation toast to the user. 
019 — SEO Head 
Feature: Reusable SEO component for managing meta tags (title, description, Open Graph, 
Twitter cards). 
Paths: apps/web/components/SeoHead.tsx; use this component in main pages (product, 
service, etc.). 
Tech: Utilize next/head for injecting tags; use helpers from @nearbybazaar/lib/seo for 
generating meta content. 
Deps: none beyond Next.js. 
Tests/Mig/Env: Provide a default Open Graph image and verify it’s included; ensure title and 
description are set per page. 
Agent: Configure dynamic titles and meta descriptions based on content (placeholder data 
for now). 
020 — Storefront Page 
Feature: Public vendor storefront page displaying that vendor’s products, services, 
classifieds. 
Paths: apps/web/pages/store/[slug].tsx; apps/web/components/{StoreHeader.tsx, 
ItemGrid.tsx}. 
Tech: Next.js SSR stub (later will fetch actual data via API); for now, maybe static sample 
data. 
Deps: Use UI library components (cards, etc.) for listing items. 
Tests/Mig/Env: Create a sample vendor data object for SSR rendering. 
Agent: Structure the page with tabs or sections for Products, Services, Classifieds 
belonging to the vendor. 
API & Core Domain (021–035) 
021 — API Skeleton 
Feature: Organize API code into controllers, routers, middleware, config, etc. 
Paths: apps/api/src/{app.ts, server.ts, config/index.ts, routes/index.ts, controllers/shared.ts}. 
Tech: Express Router for modular routes; use an async handler wrapper to catch errors. 
Deps: helmet for security headers, compression for gzip. 
Tests/Mig/Env: Provide a basic /v1/health route. 
Agent: Split startup logic into app initialization vs. server listen; mount all routes under /v1. 
022 — JWT + RBAC Guards 
Feature: JWT authentication and role-based access control middleware. 
Paths: apps/api/src/auth/{jwt.ts, guard.ts}; apps/api/src/rbac/{ability.ts, policies/*.ts} 
(skeletons). 
Tech: jsonwebtoken for JWT; use Zod to validate token claims; define an RBAC ability 
function like can(user, action, resource). 
Deps: jsonwebtoken. 
Tests/Mig/Env: Use JWT_SECRET from env, set token expiry; write unit tests for the guard 
logic. 
Agent: Middleware to attach req.user from JWT if valid; default deny access if not allowed 
by role/policies. 
023 — User/Vendor Models 
Feature: Mongoose models for User and Vendor with necessary schema fields. 
Paths: apps/api/src/models/{User.ts, Vendor.ts}; include appropriate indexes (e.g. unique 
email). 
Tech: Define schemas and create Zod adapters for validation if needed. 
Deps: none (Mongoose already included). 
Tests/Mig/Env: Seed an admin user and a sample vendor in dev seeder; ensure email 
uniqueness, soft-delete flags perhaps. 
Agent: Set up basic stub CRUD endpoints for users/vendors for testing (to be expanded 
later). 
024 — Product Model 
Feature: Mongoose model for Products (with variants, media references, pricing info). 
Paths: apps/api/src/models/Product.ts; apps/api/src/controllers/products.ts; 
apps/api/src/routes/products.ts. 
Tech: Generate a SKU on product creation (use @nearbybazaar/lib sku utility); maintain 
slug history (reference to slug logic chunk); pricing fields. 
Deps: @nearbybazaar/lib for SKU, slug, pricing helpers. 
Tests/Mig/Env: Add indexes (unique slug, text index on name for search). 
Agent: Implement stubbed CRUD and list endpoints for products; validate input with Zod. 
025 — Service Model 
Feature: Mongoose model for Services (bookable offerings), including duration and 
scheduling slots. 
Paths: apps/api/src/models/Service.ts; controllers/services.ts; routes/services.ts. 
Tech: Include scheduling fields (e.g. duration, availability schedule stub); price fields. 
Deps: none beyond core. 
Tests/Mig/Env: Ensure indexes on relevant fields; provide a basic availability calculation 
stub method. 
Agent: Implement basic CRUD and search for services. 
026 — Classified Model 
Feature: Mongoose model for Classified ads with status and contact preferences. 
Paths: apps/api/src/models/Classified.ts; controllers/classifieds.ts; routes/classifieds.ts. 
Tech: Include fields for status (active/expired), contact info preferences. Add a plan 
enforcement hook placeholder (to integrate with plan limits from chunk 081–095 later). 
Deps: none. 
Tests/Mig/Env: Include a stub for automatic expiry scheduling (e.g. set expiration date). 
Agent: Implement basic CRUD and list endpoints for classifieds. 
027 — Media Model 
Feature: Mongoose model to reference media assets (e.g. images) with Cloudinary IDs and 
alt text. 
Paths: apps/api/src/models/Media.ts; controllers/media.ts; routes/media.ts. 
Tech: Integrate Cloudinary for upload or presigned upload token; stub EXIF stripping logic. 
Deps: cloudinary SDK. 
Tests/Mig/Env: Use CLOUDINARY_* env vars for configuration; enforce alt-text requirement 
for accessibility. 
Agent: Prepare to link this to watermark pipeline later on. 
028 — Classified Plans Model 
Feature: Mongoose model for Classified listing plans (different tiers with limits/quotas). 
Paths: apps/api/src/models/ClassifiedPlan.ts; controllers/plans.ts. 
Tech: Define tier enum (Free, Pro, Featured, etc.) and entitlements (max listings, features 
allowed). 
Deps: none. 
Tests/Mig/Env: Seed default plan documents. 
Agent: Provide CRUD for plans (admin use) and plan assignment to vendors (later feature). 
029 — Commission Model 
Feature: Mongoose model for commission rules per category or vendor. 
Paths: apps/api/src/models/Commission.ts. 
Tech: Support fixed, percentage, or tiered commission structures; allow overrides per 
vendor. 
Deps: none. 
Tests/Mig/Env: Create a sample set of commission rules in seed or test. 
Agent: Will integrate commission calculation logic later (see Commission Logic 071–080). 
030 — Order/Booking Models 
Feature: Mongoose schemas for Orders (product purchases) and Bookings (service 
reservations). 
Paths: apps/api/src/models/{Order.ts, Booking.ts}. 
Tech: Define statuses (e.g. pending, confirmed, completed, cancelled), line items, totals, 
and tax breakdown references. 
Deps: none. 
Tests/Mig/Env: Add indexes on status, date, user fields for querying. 
Agent: Stub controllers for creating orders/bookings (logic to be fleshed out in later chunks). 
031 — Kaizen Model 
Feature: Mongoose model for Kaizen (continuous improvement) log entries (ideas, 
suggestions, experiments). 
Paths: apps/api/src/models/Kaizen.ts. 
Tech: Fields for tags, owner, RICE score components. 
Deps: none. 
Tests/Mig/Env: Seed a few example ideas in dev. 
Agent: Provide a basic CRUD skeleton for Kaizen entries. 
032 — ERP Connector Base 
Feature: Define an interface for ERP connectors and a registry to manage them. 
Paths: apps/api/src/services/erp/{types.ts, index.ts}. 
Tech: Design a pluggable adapter pattern; support events for data sync. 
Deps: none. 
Tests/Mig/Env: Include a mock adapter implementation for testing. 
Agent: Prepare to implement a real file-based adapter later. 
033 — Dropship Base 
Feature: Establish base abstractions for dropshipping (supplier integration, SKU mapping). 
Paths: apps/api/src/services/dropship/{types.ts, index.ts}. 
Tech: Outline hooks for stock and price synchronization with suppliers. 
Deps: none. 
Tests/Mig/Env: Provide stub functions. 
Agent: This will be expanded in chunks 136–150. 
034 — Form Builder Models 
Feature: Mongoose models for form builder (custom forms) and form entries. 
Paths: apps/api/src/models/{Form.ts, FormEntry.ts}. 
Tech: Represent form schema (fields, metadata) and store form submission entries; 
consider using Zod or JSON schema for field definitions. 
Deps: none. 
Tests/Mig/Env: Provide sample form templates in seeds. 
Agent: Basic CRUD for forms; rendering logic to come later. 
035 — Activity/Audit (basic) 
Feature: Basic audit log model for tracking system events (mutable for now). 
Paths: apps/api/src/models/AuditLog.ts; also middleware to log CRUD actions. 
Tech: Each log entry captures user, action, resource reference. 
Deps: none. 
Tests/Mig/Env: Ensure that certain create/update/delete actions generate a log entry. 
Agent: Logs are mutable in this version; plan to implement immutable chain later (see chunk 
171). 
Auto‑Generators (036–045) 
036 — SKU Util 
Feature: Deterministic SKU generator function. 
Paths: packages/lib/src/sku.ts (finalize implementation). 
Tech: Combine product name, category, date or ID to generate unique SKU hash. 
Deps: none. 
Tests/Mig/Env: Write Jest test cases to ensure uniqueness and determinism of SKUs. 
Agent: Integrate into Mongoose pre-save or post-save hooks on Product model. 
037 — Slug Util 
Feature: Locale-aware slug generator with history support. 
Paths: packages/lib/src/slug.ts; (and ensure API uses it to record old slugs). 
Tech: Transliterate Unicode to URL-safe ASCII; ensure uniqueness (append deduplicating 
counter if needed). 
Deps: optional speakingurl or similar for transliteration (or custom logic). 
Tests/Mig/Env: Test collisions and edge cases (e.g. same name in different locales). 
Agent: Plan to implement 301 redirect mapping from old slugs later (see chunk 154). 
038 — SEO Util 
Feature: Utilities for SEO (title/description generation, canonical URL helpers). 
Paths: packages/lib/src/seo.ts (advance implementation). 
Tech: Functions to clamp lengths of titles/descriptions, sanitize content for meta usage. 
Deps: none. 
Tests/Mig/Env: Test handling of edge string inputs (too long, special characters). 
Agent: Use these helpers in SeoHead component and to prepare SEO data in API 
responses. 
039 — Product Hooks 
Feature: Mongoose pre/post-save hooks for Product model (auto-generate SKU, slug, SEO 
fields). 
Paths: apps/api/src/models/Product.ts (within schema definition, add hooks). 
Tech: On product name change, regenerate slug (and preserve old slug in history); generate 
SKU on creation. 
Deps: @nearbybazaar/lib for slug and SKU. 
Tests/Mig/Env: Ensure updating a product’s name updates slug and retains old slug in 
history. 
Agent: Emit events or logs for product creation/update for further processing. 
040 — Service Hooks 
Feature: Similar hooks for Service model. 
Paths: apps/api/src/models/Service.ts. 
Tech: Auto-generate slug and SKU if applicable for services. 
Deps: @nearbybazaar/lib. 
Tests/Mig/Env: Cover rename cases in tests (slug changes). 
Agent: Emit events on service create/update for future use. 
041 — Classified Hooks 
Feature: Hooks for Classified model (slug generation, expiry calculation). 
Paths: apps/api/src/models/Classified.ts. 
Tech: On create, auto-set an expiration date based on plan (e.g. Free posts expire sooner); 
on plan change, recalc expiry. 
Deps: lookup current plan settings for the vendor. 
Tests/Mig/Env: Verify plan changes trigger new expiry. 
Agent: Emit events or notifications on classification expiration (stubs for now). 
042 — Admin Overrides 
Feature: Allow admin to override automatically generated slug/SEO data. 
Paths: apps/api/src/controllers/admin/overrides.ts (endpoints for overrides). 
Tech: Only admins via RBAC can modify slug or SEO fields on 
products/services/classifieds; log changes. 
Deps: RBAC to restrict access. 
Tests/Mig/Env: Verify changes are logged in audit. 
Agent: Expose endpoints like PUT /v1/admin/overrideSlug, etc., to apply manual overrides. 
043 — Bulk Import 
Feature: Bulk import products/services/classifieds via CSV/XLS files. 
Paths: apps/api/src/controllers/import.ts; services/csv.ts (to parse files). 
Tech: Stream file parsing (avoid loading entire file in memory); validate each row. 
Deps: papaparse or fast-csv for CSV parsing. 
Tests/Mig/Env: Use sample files to test; simulate large number of rows. 
Agent: Use a queue job for processing to avoid blocking requests; support uploading file 
and then processing asynchronously. 
044 — API Exposure 
Feature: Public read-only APIs for products, services, classifieds with filtering and 
pagination. 
Paths: apps/api/src/routes/public/*.ts (e.g. public/products.ts, public/services.ts…). 
Tech: Set proper cache headers (Cache-Control, ETag) for these GET endpoints. 
Deps: none. 
Tests/Mig/Env: Later add rate-limiting (placeholder for now). 
Agent: Document these endpoints in OpenAPI (to be done in docs chunk). 
045 — Docs 
Feature: Developer documentation for the above generator features. 
Paths: docs/GENERATORS.md. 
Tech: Include examples (e.g. example cURL commands for bulk import). 
Deps: none. 
Tests/Mig/Env: N/A (documentation only). 
Agent: Keep this documentation updated as generator features evolve. 
Watermark Pipeline (046–055) 
046 — Client Watermark Lib 
Feature: Front-end library for applying watermark on images (e.g. on client side before 
upload). 
Paths: packages/lib/src/watermark.client.ts. 
Tech: Use HTMLCanvasElement or similar to overlay watermark text/graphics; handle EXIF 
orientation in images. 
Deps: optional: pica for image resizing if needed. 
Tests/Mig/Env: Create a simple page (maybe in web app) to visually test watermark overlay. 
Agent: Make opacity and position configurable via function parameters. 
047 — Vendor Logo 
Feature: Vendor logo upload/validation. 
Paths: apps/api/src/models/Vendor.ts (add logo fields/validators); possibly front-end widget 
for upload. 
Tech: Save vendor logos in a dedicated Cloudinary folder per vendor; ensure size/ratio 
constraints. 
Deps: cloudinary SDK for upload. 
Tests/Mig/Env: Enforce max dimensions/size in upload tests. 
Agent: Provide a default fallback (e.g. generated initials avatar) if no logo is set. 
048 — Upload Widgets 
Feature: Reusable file uploader component with preview and watermark integration. 
Paths: packages/ui/src/Upload.tsx; integrate in web/vendor apps for image uploads. 
Tech: Drag-and-drop (e.g. react-dropzone for file handling); show preview with client-side 
watermark applied. 
Deps: react-dropzone (for drag-drop support). 
Tests/Mig/Env: Limit number of files and allowed types; ensure accessibility (keyboard 
navigation, screenreader labels). 
Agent: Provide upload progress feedback; prepare to handle both direct and signed 
uploads. 
049 — Server Verify 
Feature: Server-side verification of watermark signature on images. 
Paths: packages/lib/src/watermark.server.ts; corresponding API endpoints to process 
uploads. 
Tech: Embed a tiny digital signature in the watermark (like a hash) that the server can 
recompute and verify. 
Deps: sharp for image processing (to read pixels or metadata). 
Tests/Mig/Env: Simulate corrupted or un-watermarked image uploads to ensure detection. 
Agent: Reject classified image uploads that don’t contain the expected watermark signature. 
050 — Cloud Storage Adapter 
Feature: Abstract service for cloud storage operations (so we can switch between 
Cloudinary, S3, etc.). 
Paths: apps/api/src/services/storage/{cloudinary.ts, types.ts}. 
Tech: Provide functions for upload, deletion, and generating variant URLs in a unified way. 
Deps: Cloud provider SDK (e.g. Cloudinary Node SDK). 
Tests/Mig/Env: Use CLOUDINARY_* env settings; implement retry with exponential backoff 
on upload failures. 
Agent: All image upload/management in app should go through this adapter for consistency. 
051 — Thumb/WebP Variants 
Feature: Automatically generate responsive thumbnails and WebP format images. 
Paths: incorporate into storage adapter; update Media model to store variant URLs or IDs. 
Tech: Use Cloudinary transformations or similar to get different sizes and WebP versions. 
Deps: cloudinary. 
Tests/Mig/Env: Ensure generated URLs are properly signed if needed. 
Agent: Decide on eager vs lazy generation (e.g. generate some sizes on upload, others on 
demand). 
052 — Alt‑text Enforcement 
Feature: Enforce presence of alt text for images. 
Paths: media controller (when uploading images or saving media references). 
Tech: Use Zod validation to ensure alt text is provided for each image. 
Deps: none. 
Tests/Mig/Env: API should aggregate errors if multiple images missing alt. 
Agent: Plan for i18n alt text if needed (could allow alt text in multiple languages down the 
line). 
053 — Classifieds Images 
Feature: Enforce watermarking and plan-based limits on classified images. 
Paths: Classifieds controller (hooks or validation logic on image upload endpoints). 
Tech: Check that images uploaded for classifieds contain the watermark signature (from 
#049) and that the number of images does not exceed plan limits. 
Deps: plan lookup from ClassifiedPlan model. 
Tests/Mig/Env: Test edge cases where user tries to add more images than allowed by their 
plan. 
Agent: Provide friendly error messages or UI hints when limit is reached in the uploader 
component. 
054 — Tests 
Feature: Unit and integration tests for the watermark pipeline and upload process. 
Paths: apps/api/tests/watermark.spec.ts; packages/lib/tests/watermark.test.ts (and others as 
needed). 
Tech: Use Jest for unit tests with sample image fixtures. 
Deps: jest, ts-jest. 
Tests/Mig/Env: Ensure these run in CI (smoke test that watermarking functions and upload 
endpoints behave as expected). 
Agent: Possibly include snapshot tests for variant URL generation. 
055 — Docs 
Feature: Documentation for watermarking approach. 
Paths: docs/WATERMARKING.md. 
Tech: Include diagrams or flowcharts illustrating the watermark process. 
Deps: none. 
Tests/Mig/Env: N/A (documentation). 
Agent: Provide troubleshooting tips (e.g. common issues if watermarks aren’t verified, etc.). 
Form Builder (056–070) 
056 — Builder UI 
Feature: Drag-and-drop form builder interface (admin side). 
Paths: apps/admin/pages/forms/builder.tsx; possibly some shared drag-drop components in 
@nearbybazaar/ui. 
Tech: Use a drag-and-drop library (dnd-kit or react-beautiful-dnd) to allow adding/reordering 
form fields. 
Deps: dnd-kit or react-beautiful-dnd for DnD support. 
Tests/Mig/Env: Ensure the builder renders with a basic form layout and can add fields. 
Agent: Save the designed form schema (likely as JSON) to the backend via an API call. 
057 — Render + Zod 
Feature: Runtime form renderer and automatic Zod schema generation for validation. 
Paths: packages/lib/src/form/render.tsx (React component to render a form from schema); 
packages/lib/src/form/zod.ts (functions to build Zod schema from field definitions). 
Tech: Map each field type (text, number, etc.) to a corresponding Zod validator. 
Deps: zod. 
Tests/Mig/Env: Test with various field configurations, including invalid inputs, to ensure the 
Zod schema catches errors. 
Agent: The form renderer should output structured data that can be parsed by the 
generated Zod schema. 
058 — Ownership 
Feature: Associate forms with owners (user or vendor) and enforce access control. 
Paths: Expand Form model to include owner info; define RBAC policies for form access. 
Tech: Use existing RBAC/abilities to check if the current user can access/modify a given 
form (based on ownership or role). 
Deps: rbac (reuse earlier RBAC system). 
Tests/Mig/Env: Write tests to ensure that non-owners cannot access or modify another’s 
form (expect access denied). 
Agent: Log form changes in audit trail for accountability. 
059 — Attachments Limits 
Feature: Limit file uploads in forms by count and size. 
Paths: Integrate file uploader in form renderer for file fields; enforce limits in front-end and 
back-end. 
Tech: Each form field definition can specify max files and max file size; the 
renderer/uploader enforces it. 
Deps: storage module for handling file saving. 
Tests/Mig/Env: Test boundary cases (one over the limit, maximum size, etc.). 
Agent: Show UI hints when user approaches limits (e.g. “X of Y files uploaded”). 
060 — Notifications 
Feature: Email or queue notifications when a new form entry is submitted. 
Paths: Trigger in form submission API (e.g. apps/api/src/controllers/forms.ts) to enqueue an 
email job in emailQueue. 
Tech: Use templated emails or simple text to notify form owner or admin about new 
submission; throttle to avoid spamming on frequent submissions. 
Deps: mailer (Nodemailer from earlier setup). 
Tests/Mig/Env: End-to-end test: submit a form and verify an email job is created. 
Agent: Make notification recipients configurable per form (some forms email the vendor, 
others email admin, etc.). 
061 — Embed Widget 
Feature: Public embed script to embed forms on external sites. 
Paths: apps/web/public/embed/form.js (a JS snippet to include via script tag); allow forms to 
be rendered in an iframe. 
Tech: Use postMessage API for communication between embedded form and parent page 
(to handle form submission events, height adjustments, etc.). 
Deps: none (plain JS for embed). 
Tests/Mig/Env: Ensure the embed works in a sandboxed iframe with correct CORS headers 
on the iframe content. 
Agent: Set appropriate Content Security Policy (CSP) headers to allow embedding as 
needed. 
062 — Versioning 
Feature: Maintain immutable versions of form schemas. 
Paths: Extend Form model to have a version history (or a separate FormVersion model); 
provide API to publish a new version. 
Tech: Once a form is published, freeze that version for reference (especially for submitted 
entries). 
Deps: none. 
Tests/Mig/Env: Write a migration if needed to support version references in FormEntry (so 
old entries link to the schema version they were created with). 
Agent: Support draft vs published states for forms. 
063 — Export CSV 
Feature: Export form submission entries as CSV. 
Paths: apps/api/src/controllers/forms.ts (add an endpoint for CSV export). 
Tech: Stream data to avoid memory issues on many entries; set response Content-Type to 
text/csv. 
Deps: fast-csv or similar for streaming CSV creation. 
Tests/Mig/Env: Test with a large number of entries to ensure performance; verify CSV 
format is correct. 
Agent: Enforce RBAC and possibly rate-limit this heavy operation. 
064 — Rate Limits 
Feature: Limit form submission rate to prevent spam. 
Paths: Middleware (possibly apps/api/src/middleware/rateLimit.ts) applied to form submit 
routes, using Redis to track counts. 
Tech: Use a sliding window or token bucket algorithm keyed by form and IP (or user). 
Deps: ioredis for rate-limit counters. 
Tests/Mig/Env: Simulate rapid submissions to trigger 429 responses; ensure a Retry-After 
header or similar is returned. 
Agent: Possibly vary limits by form or user role if needed. 
065 — PII Masking 
Feature: Mask or redact sensitive fields in storage and logs. 
Paths: Mongoose pre-save hooks on FormEntry to redact fields marked as sensitive; ensure 
audit logs or exports also apply masking. 
Tech: Each form field metadata can have a flag indicating PII; if so, store an encrypted or 
hashed version or partially masked version in the database. 
Deps: none. 
Tests/Mig/Env: Ensure that sensitive data is not visible in logs or plain exports (except to 
authorized roles). 
Agent: Allow configurable masking patterns (e.g. show last 4 digits of a phone number). 
066 — CRUD + OpenAPI 
Feature: Full CRUD API for forms and integrate with OpenAPI docs. 
Paths: apps/api/src/routes/forms.ts (create routes for create/update/delete forms); 
auto-generate or write OpenAPI (Swagger) specs for these. 
Tech: Use swagger-jsdoc or similar to generate OpenAPI definitions from JSDoc or define 
manually. 
Deps: swagger-ui-express for serving docs. 
Tests/Mig/Env: Ensure /v1/docs shows the forms endpoints and models correctly. 
Agent: Convert Zod schemas to OpenAPI definitions if possible, to avoid duplication of 
schema definitions. 
067 — Tests 
Feature: Unit and integration tests for form builder and renderer. 
Paths: Add Jest test suites for form logic; possibly use Playwright for a headless browser 
test of the form submission flow. 
Tech: Use Playwright to simulate a user filling and submitting a form in the web app. 
Deps: jest, @playwright/test. 
Tests/Mig/Env: Ensure these run in CI. 
Agent: Create some fixture forms and entries to test end-to-end behavior. 
068 — Templates 
Feature: Provide prebuilt form templates (e.g. Contact Us form, Booking form). 
Paths: Seed data and possibly a UI gallery to select a template. 
Tech: Templates stored as JSON schema that can be copied into a new form. 
Deps: none. 
Tests/Mig/Env: Snapshot test the templates to ensure they don’t change unexpectedly. 
Agent: Allow admin to clone a template into an editable form for quick setup. 
069 — Permissions UI 
Feature: Admin interface to manage who can access which forms (permissions settings). 
Paths: apps/admin/pages/forms/permissions.tsx (or integrate into builder page). 
Tech: Surface the underlying RBAC rules in a user-friendly way (checkboxes for roles that 
can view/submit a form, etc.). 
Deps: rbac system. 
Tests/Mig/Env: End-to-end tests ensuring that toggling a permission in the UI actually 
affects API authorization. 
Agent: Provide guidance in UI about what each permission means. 
070 — Docs 
Feature: Documentation for the form builder feature. 
Paths: docs/FORMS.md. 
Tech: Provide a how-to guide and API documentation for forms. 
Deps: none. 
Tests/Mig/Env: N/A. 
Agent: Include examples of embedding a form and using the API to retrieve submissions. 
Commission Logic (071–080) 
071 — Rules 
Feature: Define a domain-specific language or schema for commission rules (fixed amount, 
percentage, tiered rates). 
Paths: apps/api/src/models/Commission.ts (finalize fields for rules); 
apps/api/src/services/commission/rules.ts (implement rule evaluation). 
Tech: Determine rule precedence (e.g. vendor-specific override vs category default) and 
how to represent tiered commissions (maybe ranges with different percentages). 
Deps: none. 
Tests/Mig/Env: Unit tests for edge tier calculations (e.g. different slabs of prices). 
Agent: Allow per-vendor or per-category overrides of default platform commission. 
072 — Calculator 
Feature: Commission calculation function for order line items. 
Paths: apps/api/src/services/commission/calc.ts. 
Tech: Take inputs like item price, category, vendor info (e.g. vendor’s commission overrides 
or plan), output commission amount for that item. 
Deps: none. 
Tests/Mig/Env: Test rounding behavior, ensure sum of commissions matches expected 
totals. 
Agent: Return a breakdown (maybe include which rule applied for transparency). 
073 — Product Order Flow 
Feature: Apply commission calculation during product order creation. 
Paths: apps/api/src/controllers/orders.ts (extend order creation logic to calculate 
commissions for each line). 
Tech: For each order line, use commission calc to determine commission and store it in 
order record (or a separate ledger). 
Deps: commission calc from above. 
Tests/Mig/Env: Integration test for creating an order and verifying commission fields are set. 
Agent: Possibly maintain a commission ledger or accumulate total commissions per order 
for reports. 
074 — Service Booking Flow 
Feature: Calculate commission for service bookings when confirmed. 
Paths: apps/api/src/controllers/bookings.ts. 
Tech: Commission might be applied when service is delivered or payment received; mark 
commission pending until service is completed if necessary. 
Deps: commission calc. 
Tests/Mig/Env: Handle partial payments or deposits (commission might only apply to 
completed part). 
Agent: Add flags for refundable commissions if a service booking is cancelled. 
075 — Reports 
Feature: Commission reporting endpoints per vendor and date range. 
Paths: apps/api/src/controllers/reports.ts (add commission report generation). 
Tech: Use Mongo aggregation or map-reduce to sum commissions by vendor, or by month, 
etc. 
Deps: none. 
Tests/Mig/Env: Test with a large date range to ensure performance (simulate many orders). 
Agent: Provide CSV export for these reports if needed. 
076 — Refund Adjustments 
Feature: Adjust commissions when orders are refunded. 
Paths: Payment/refund handling logic (apps/api/src/controllers/payments.ts or a service) to 
reverse commission entries. 
Tech: If an order (or part of it) is refunded, compute pro-rata commission reversal and 
update the ledger. 
Deps: payments integration. 
Tests/Mig/Env: Edge cases like partial refunds, multiple refunds on same order. 
Agent: Make these adjustments immutable in the audit log (see chunk 171 for immutable 
audit trail). 
077 — Tax‑friendly Layout 
Feature: Structure commission and tax information for invoices to be clear. 
Paths: Invoice builder (perhaps part of order service or a separate module). 
Tech: Ensure invoices show commission separate from item price for vendor’s copy (since 
commission is platform fee, not part of vendor revenue for tax). 
Deps: tax engine integration. 
Tests/Mig/Env: Create sample invoices to ensure GST or other taxes are applied correctly 
separate from commission. 
Agent: Format numbers in localized format (e.g. INR currency with proper symbols). 
078 — UI Badges 
Feature: Show UI indications when commission considerations lead to better deals (e.g. 
“Best Price” badge if platform is not taking commission or offering discount). 
Paths: apps/web and apps/vendor UI components. 
Tech: Use results from commission calc or flags in product data to conditionally render 
badges. 
Deps: none. 
Tests/Mig/Env: Plan A/B test later to see if badges improve conversion. 
Agent: Ensure badges have accessible text (so screen readers convey the meaning). 
079 — /pricing/quote 
Feature: Public API endpoint to get a price quote including commission breakdown. 
Paths: apps/api/src/routes/public/pricing.ts. 
Tech: Accept input (item ID, maybe quantity) and return computed price + commission + any 
fees or taxes. 
Deps: commission calc service. 
Tests/Mig/Env: Validate inputs with Zod; test with various scenarios (different categories, 
vendor overrides). 
Agent: Implement caching for short duration (few minutes) if needed, since many users 
might request quotes. 
080 — Docs 
Feature: Documentation for pricing and commission logic. 
Paths: docs/PRICING.md. 
Tech: Include diagrams showing how price splits into vendor earnings, commission, taxes. 
Deps: none. 
Tests/Mig/Env: N/A. 
Agent: Provide example calculations for clarity (e.g. on a ₹100 order, how much goes to 
vendor vs commission vs tax). 
Classifieds Plans (081–095) 
081 — Plan Catalog 
Feature: Public (or vendor-facing) API/endpoint to list available Classifieds plans (Free, Pro, 
Featured, etc.). 
Paths: apps/api/src/controllers/plans.ts (maybe reuse from ClassifiedPlan model); routes for 
public or vendor to fetch plan list. 
Tech: Each plan includes entitlements (limits on number of listings, features enabled, etc.). 
Deps: ClassifiedPlan model. 
Tests/Mig/Env: Seed the plans and test that they are returned correctly. 
Agent: Provide an endpoint like GET /v1/plans that lists all active plans. 
082 — Subscribe/Upgrade 
Feature: Allow vendors to subscribe to a plan or upgrade their current plan. 
Paths: apps/api/src/routes/plans.ts; perhaps payment integration stub (e.g. generate 
PhonePe payment link in future chunk). 
Tech: Track subscription start/end dates, status (active, expired, etc.) in vendor or a 
separate subscription model. 
Deps: payment processing (to be integrated later, e.g. PhonePe). 
Tests/Mig/Env: Simulate a successful subscription (without actual payment initially). 
Agent: Set up webhook or callback placeholders to update plan status upon payment 
confirmation (integration in later chunks). 
083 — Enforcement 
Feature: Middleware or checks to enforce plan quotas and feature access. 
Paths: Integrate into classifieds controllers (create/update routes check vendor’s current 
plan allowances). 
Tech: If vendor has Free plan and tries to create beyond the limit, respond with an error; 
similarly restrict access to features like “Featured listing” if not allowed on current plan. 
Deps: plan data (from ClassifiedPlan model or vendor record). 
Tests/Mig/Env: Test boundary conditions (exactly at limit vs one over). 
Agent: Return informative error messages so front-end can prompt upgrade. 
084 — Renewal Reminders 
Feature: Queue scheduled emails to remind vendors to renew/upgrade plan before expiry. 
Paths: Use BullMQ delayed jobs or a cron job (to be refined in Durable Scheduler chunk) to 
schedule emails. 
Tech: Compute a date (e.g. 5 days before expiry) to send reminder email. 
Deps: BullMQ (already set up for email queue). 
Tests/Mig/Env: Check that a vendor with expiring plan gets a job scheduled. 
Agent: Use i18n templates for emails (so content can be in vendor’s language). 
085 — Featured 
Feature: “Featured Listing” flag for classifieds that boosts visibility. 
Paths: Add a field in Classified model for isFeatured and perhaps an expiry for featured 
status; modify search sorting to boost featured items. 
Tech: When listing classifieds, if isFeatured true, sort them higher or in a separate 
section. 
Deps: search infrastructure (to be integrated later, e.g. Meilisearch). 
Tests/Mig/Env: Ensure featured items appear ahead of non-featured. 
Agent: Possibly allow admin override to mark something featured regardless of plan. 
086 — Bump 
Feature: Allow vendors to “bump” their listing to top of list occasionally. 
Paths: Create an endpoint e.g. POST /v1/classifieds/:id/bump; implement cooldown logic in 
Classified model (timestamp of last bump). 
Tech: Update the listing’s timestamp or a separate “bumpScore” that is used in sorting. 
Deps: plan rules (number of bumps allowed, cooldown period). 
Tests/Mig/Env: Prevent bump if used too recently (respond with error). 
Agent: Audit these bump actions for monitoring abuse. 
087 — Vendor Plan Page 
Feature: Vendor UI page to view and manage their current plan and usage. 
Paths: apps/vendor/pages/plan.tsx (or a section in dashboard). 
Tech: Show current plan details, usage vs quota (e.g. listings used out of allowed). 
Deps: plans API. 
Tests/Mig/Env: Simulate usage data and ensure UI displays correctly. 
Agent: Include a call-to-action to upgrade if they are on a lower tier plan. 
088 — Admin Plan Reports 
Feature: Admin dashboard for plan subscriptions and revenue. 
Paths: apps/admin/pages/reports/plans.tsx (for example). 
Tech: Use aggregation APIs to show number of vendors on each plan, revenue from paid 
plans. 
Deps: payment data (once integrated). 
Tests/Mig/Env: Provide dummy data for CSV export. 
Agent: Allow filtering by time range, plan type, etc., and export results to CSV. 
089 — Cancel/Refund Policy 
Feature: Model and store plan cancellation/refund policy text and enforce it. 
Paths: Possibly a simple model to hold policy text or just documentation; incorporate logic in 
refund handling to obey policy. 
Tech: For example, no refunds after X days into the subscription. 
Deps: payment processing (for actual refunds). 
Tests/Mig/Env: Various scenarios (full refund within window vs no refund outside window). 
Agent: Require vendors to accept this policy when subscribing (store an acceptance log 
with timestamp). 
090 — Pro Badges 
Feature: Display a “Pro” badge on vendor profiles or storefront if they have a Pro/paid plan. 
Paths: apps/web/components/StoreHeader.tsx or similar (to show badge on storefront); 
maybe vendor listing pages. 
Tech: Check vendor’s plan status on front-end to conditionally render a badge icon/text. 
Deps: plan info via API. 
Tests/Mig/Env: Ensure fallback for vendors with no plan or free plan (no badge). 
Agent: Make sure the badge has an accessible label (like “Pro Plan Vendor”). 
091 — Plan CRUD API 
Feature: Admin endpoints to create/update/delete plan offerings. 
Paths: apps/api/src/routes/admin/plans.ts. 
Tech: Only accessible by admin (RBAC guard); use Zod for input validation of plan fields. 
Deps: rbac. 
Tests/Mig/Env: Validate that only admin tokens can access; test creating a new plan and 
then retrieving via plan catalog. 
Agent: Log all changes to plans in audit logs for traceability. 
092 — Tests 
Feature: Comprehensive tests for plan logic. 
Paths: Write unit tests for plan enforcement, upgrade/downgrade flows; integration tests for 
plan subscription endpoints. 
Tech: jest for unit tests, possibly supertest for API endpoints. 
Deps: none. 
Tests/Mig/Env: Ensure all edge cases (like upgrading from a lower plan to higher plan 
mid-cycle) are covered. 
Agent: All tests should pass in CI. 
093 — Docs 
Feature: Documentation for Classifieds plans and their usage. 
Paths: docs/PLANS.md. 
Tech: Possibly include pricing tables and feature comparison charts between plans. 
Deps: none. 
Tests/Mig/Env: N/A. 
Agent: Include examples of how plan limitations work (e.g. Free plan allows 5 listings). 
094 — Seeds 
Feature: Seed script entries for default plans and sample vendor plan assignments. 
Paths: apps/api/src/seeders/*.ts (expand dev seeder to include plans and assign a plan to 
sample vendor). 
Tech: Idempotent seed functions so it can be run multiple times without duplicating. 
Deps: none. 
Tests/Mig/Env: Ensure seeder can run repeatedly for local dev without issues. 
Agent: Reference migration/seed README to guide developers on seeding. 
095 — Receipts 
Feature: Model for receipts of plan purchases and an endpoint to retrieve them. 
Paths: apps/api/src/models/Receipt.ts; apps/api/src/controllers/receipts.ts. 
Tech: For each plan purchase (especially paid ones), generate a receipt number and record 
(could be used to generate PDF). 
Deps: none. 
Tests/Mig/Env: Ensure receipt number uniqueness/format; maybe stub out PDF generation. 
Agent: Email receipts to vendor after purchase (tie into mailer queue). 
Kaizen (096–110) 
096 — Board UI 
Feature: Kanban board interface for Kaizen ideas. 
Paths: apps/admin/pages/kaizen/board.tsx (for example). 
Tech: Use a drag-and-drop library to allow sorting ideas into columns (e.g. “Backlog”, “In 
Progress”, “Completed”). 
Deps: dnd-kit or similar. 
Tests/Mig/Env: Basic rendering smoke test to ensure columns display. 
Agent: Persist column/order changes to the server (so others see updated board). 
097 — Submission Flow 
Feature: Mechanism for anyone (public or internal team) to submit a Kaizen idea. 
Paths: Possibly a public page or an admin page for submission 
(apps/web/pages/kaizen/submit.tsx or a section in admin). 
Tech: Add spam protection like a rate-limit or captcha if public. 
Deps: reuse rate-limit middleware. 
Tests/Mig/Env: Ensure that submitting too quickly yields a 429. 
Agent: Send an email or notification on new idea submission. 
098 — RICE Score 
Feature: Calculate RICE (Reach, Impact, Confidence, Effort) score for ideas and store it. 
Paths: apps/api/src/models/Kaizen.ts (add fields for R, I, C, E and a computed score); 
reflect in admin UI sliders/inputs. 
Tech: Score = (Reach * Impact * Confidence) / Effort. 
Deps: none. 
Tests/Mig/Env: Unit test the calculation. 
Agent: Allow sorting the Kanban board by RICE score to prioritize. 
099 — Experiments 
Feature: Track experiments under the Kaizen system, with statuses. 
Paths: apps/api/src/models/Experiment.ts (or integrate into Kaizen model); apps/admin UI to 
list experiments. 
Tech: Each experiment might link to one or more ideas, have a status machine (e.g. Draft, 
Running, Completed, Aborted). 
Deps: none. 
Tests/Mig/Env: Ensure status transitions follow valid pattern. 
Agent: Log status changes in audit. 
100 — Decisions 
Feature: Decision log entries resulting from Kaizen ideas or experiments. 
Paths: apps/api/src/models/Decision.ts; admin UI timeline component to display decisions. 
Tech: Reference fields linking decisions to experiments or ideas; maintain an immutable 
record of decisions taken. 
Deps: none. 
Tests/Mig/Env: Ensure decisions, once made, cannot be edited (or if edited, track changes). 
Agent: Optionally email a digest of decisions to team. 
101 — Insights Digest 
Feature: Weekly summary of Kaizen insights emailed to relevant team members. 
Paths: Cron job (BullMQ repeatable job) plus mailer template. 
Tech: Summarize new ideas, experiment results, decisions from the week in a Markdown or 
HTML email. 
Deps: BullMQ for scheduling. 
Tests/Mig/Env: Simulate the scheduled job to ensure it queries recent items and formats 
email correctly. 
Agent: Include an unsubscribe or opt-out mechanism for recipients. 
102 — Tags/Owners 
Feature: Tagging of Kaizen items and assigning owners. 
Paths: apps/api/src/models/Kaizen.ts (tags: [String], owners: [UserId]); admin UI for filtering 
by tag or owner. 
Tech: Add text index on tags for search; allow multiple owners per item (e.g. co-owned 
idea). 
Deps: none. 
Tests/Mig/Env: Ensure filtering by tag returns correct items; test adding multiple owners. 
Agent: Owners could be internal team members responsible for that improvement. 
103 — Attachments 
Feature: Attach files to Kaizen items. 
Paths: Leverage storage service to upload and link files (could use an S3/Cloudinary bucket 
for attachments); update Kaizen model to hold attachment info. 
Tech: Could allow images, PDFs, etc., associated with an idea or experiment. 
Deps: storage adapter (from earlier chunk). 
Tests/Mig/Env: Enforce file size/type limits. 
Agent: Provide previews or links for common file types in the UI. 
104 — Public Changelog 
Feature: Generate a public-facing changelog page from decisions. 
Paths: apps/web/pages/changelog.tsx (list of public decisions); possibly generate an 
RSS/Atom feed. 
Tech: Use decision records marked as public to build a timeline of changes/improvements 
for users to see. 
Deps: none. 
Tests/Mig/Env: Ensure SEO metadata (title, descriptions) is present for this page. 
Agent: Tag releases or versions in decisions so they can be grouped. 
105 — Sparklines 
Feature: Add tiny trend charts (sparklines) for metrics in the admin UI. 
Paths: Create a UI component for sparkline charts (apps/admin/components/Sparkline.tsx 
maybe). 
Tech: Use a lightweight charting library or custom SVG for tiny charts showing trends (like 
idea submission per week, etc.). 
Deps: recharts or a smaller alternative for minimal graphs. 
Tests/Mig/Env: Make sure adding many sparklines doesn’t affect performance. 
Agent: Ensure they have appropriate alt text or aria labels for accessibility since they 
convey info. 
106 — Staff‑only Notes 
Feature: Allow internal notes on Kaizen items that are not visible publicly (if some Kaizen 
info is shared publicly). 
Paths: apps/api/src/models/Kaizen.ts (add a privateNotes field); enforce via RBAC that only 
staff can read them. 
Tech: If a Kaizen item is exposed via an API or changelog, strip out private notes. 
Deps: rbac. 
Tests/Mig/Env: ACL tests ensuring private notes are not returned to unauthorized requests. 
Agent: Audit log any changes to these notes. 
107 — API 
Feature: Public (or at least internal) REST API endpoints for Kaizen items. 
Paths: apps/api/src/routes/kaizen/*.ts (list, create, update, etc.). 
Tech: Use Zod to validate incoming idea submissions or updates. 
Deps: none beyond base. 
Tests/Mig/Env: Ensure these appear in OpenAPI docs (/docs) and function with proper 
auth/rate-limits. 
Agent: Possibly apply a rate-limit to idea submissions if it’s open to public to avoid spam. 
108 — Tests 
Feature: Unit and integration tests for Kaizen workflows. 
Paths: e.g. apps/api/tests/kaizen.spec.ts for API tests; create factory data for ideas, 
experiments, etc. 
Tech: Use jest with a memory MongoDB or test database. 
Deps: jest, maybe mongodb-memory-server for isolated tests. 
Tests/Mig/Env: Aim for high coverage on Kaizen module. 
Agent: Make CI gating on these tests passing. 
109 — Docs 
Feature: Documentation for the Kaizen process and features. 
Paths: docs/KAIZEN.md. 
Tech: Describe how to use the Kaizen board, how RICE is calculated, etc. 
Deps: none. 
Tests/Mig/Env: N/A. 
Agent: Include explanation of what RICE means for new team members. 
110 — Seeds 
Feature: Seed some example Kaizen ideas and decisions for development/testing. 
Paths: apps/api/src/seeders/kaizen.ts (or included in main dev seed). 
Tech: Make it idempotent and optionally toggle via an env flag if loading sample data is 
desired or not. 
Deps: none. 
Tests/Mig/Env: Running seeder multiple times should not duplicate entries. 
Agent: Provide an env switch like SEED_KAIZEN_EXAMPLES to include these or not. 
Store Link & Pages (111–120) 
111 — Store Slug 
Feature: Unique slug generation for each vendor’s store. 
Paths: apps/api/src/models/Vendor.ts (add slug field and perhaps a pre-save hook). 
Tech: Use slug utility to generate a slug from vendor name; maintain history of old slugs for 
redirects (similar to product slugs). 
Deps: @nearbybazaar/lib slug functions. 
Tests/Mig/Env: Handle collisions (e.g. two vendors with same name); ensure slug 
uniqueness. 
Agent: Plan to implement 301 redirects for changed store slugs in later SEO chunk. 
112 — Storefront 
Feature: Build out the public storefront UI for a vendor. 
Paths: apps/web/components/StoreHeader.tsx, ItemGrid.tsx, etc., and flesh out 
apps/web/pages/store/[slug].tsx with real layout. 
Tech: Include pagination controls if vendor has many items. 
Deps: use public APIs for products/services/classifieds by vendor (once those exist). 
Tests/Mig/Env: SSR rendering test to ensure it works with a sample data set. 
Agent: Add proper SEO tags on this page (like vendor name in title, etc.). 
113 — Store SEO 
Feature: Improve SEO for store pages. 
Paths: SeoHead component and possibly generate JSON-LD structured data in store page. 
Tech: Add Organization schema in JSON-LD for the store (with vendor info), canonical 
URLs for store pages. 
Deps: none beyond existing. 
Tests/Mig/Env: Use Google’s rich results test to validate the JSON-LD output (manually, as 
part of dev). 
Agent: Internationalize title and description (e.g. include city or category if relevant). 
114 — Share Buttons 
Feature: Add social sharing options on product/store pages (copy link, WhatsApp share, QR 
code, etc.). 
Paths: packages/ui/src/Share.tsx (component implementing share buttons and QR 
generation). 
Tech: Use Web Share API for mobile if available; use a QR code library (e.g. qrcode) to 
generate a scannable code. 
Deps: qrcode (for QR code generation). 
Tests/Mig/Env: Ensure that on mobile devices, native share sheet opens (Web Share API) 
as fallback to copying link. 
Agent: Append UTM parameters to shared URLs for tracking referral sources. 
115 — Custom Sections 
Feature: Allow vendors to add custom content sections to their storefront (e.g. an “About 
Us” or special promotions). 
Paths: Could treat as simple CMS: maybe a field in Vendor model for markdown content; UI 
in vendor portal to edit it; public store page to render it. 
Tech: Use a markdown parser (marked or micromark) to render to HTML safely (sanitize to 
prevent XSS). 
Deps: marked or micromark for parsing markdown. 
Tests/Mig/Env: Ensure scripts cannot be injected via markdown (use sanitize-html if 
needed). 
Agent: Provide a preview in the vendor UI when editing the section. 
116 — Policies 
Feature: Store-specific policy pages (return policy, terms, etc.) editable by vendor. 
Paths: Vendor portal UI to edit policy text (could be markdown as well); public pages to 
display them (e.g. store/[slug]/policies/return.tsx or a modal). 
Tech: Version the policies if needed (so changes are tracked). 
Deps: none. 
Tests/Mig/Env: Ensure links to these pages appear in the storefront footer. 
Agent: Optionally mark these pages with noindex for SEO if they are largely duplicate 
content across stores. 
117 — Review Summary 
Feature: Show an aggregate rating on the storefront (e.g. “4.5 stars from 50 reviews”). 
Paths: Possibly extend Order model to have reviews, or a separate Review model 
aggregated; compute average rating and total count, store in Vendor for quick access. 
Tech: Rolling average update whenever a new review comes in. 
Deps: order completion triggers (if after order delivered, allow review). 
Tests/Mig/Env: Introduce a basic spam filter placeholder (to filter out suspicious reviews, to 
refine later). 
Agent: Add Schema.org AggregateRating JSON-LD to the storefront page for SEO. 
118 — Contact Widget 
Feature: A contact form/widget on the store page for users to message the vendor 
(rate-limited). 
Paths: apps/web/components/ContactForm.tsx and corresponding API endpoint to send 
message to vendor. 
Tech: Use Redis-backed rate limiter (to prevent abuse of contact form). 
Deps: ioredis. 
Tests/Mig/Env: Verify that exceeding a threshold of messages returns HTTP 429 with proper 
headers. 
Agent: On submit, send the message to vendor via email or queue (reuse emailQueue 
service). 
119 — Store Analytics 
Feature: Provide vendors basic analytics about their store page visits and user actions. 
Paths: Vendor dashboard page to display metrics (views, clicks, etc.). 
Tech: Capture page view events server-side or via a lightweight tracking script when store 
page loads; aggregate counts per vendor. 
Deps: Planning integration with OpenTelemetry or similar for future, but for now maybe a 
simple server hit count. 
Tests/Mig/Env: Ensure this tracking adds minimal overhead to page load (keep script small). 
Agent: Adhere to privacy norms (don’t capture personal data, just counts). 
120 — Tests & Docs 
Feature: End-to-end tests for storefront flows and documentation. 
Paths: Use Playwright to simulate visiting a store, adding items to cart, using contact form, 
etc.; docs/STORES.md for store feature documentation. 
Tech: Playwright for browser automation and screenshot diffing for UI consistency. 
Deps: @playwright/test. 
Tests/Mig/Env: Integrate these tests into CI; possibly generate screenshots for 
documentation. 
Agent: Include tests for share buttons (e.g. is QR code generated) and any dynamic 
behavior. 
ERP Connection (121–135) 
121 — Connector Interface 
Feature: Define a generic interface for ERP connectors. 
Paths: apps/api/src/services/erp/types.ts (finalize method signatures for export/import 
operations). 
Tech: Determine what data structures to pass (e.g. orders array, inventory updates); plan for 
versioning the payloads. 
Deps: none. 
Tests/Mig/Env: Keep a mock implementation to test against the interface. 
Agent: Prepare to implement specific adapters, ensuring they conform to this interface. 
122 — File Adapter 
Feature: Implement an ERP adapter that reads/writes CSV or Excel files. 
Paths: apps/api/src/services/erp/fileAdapter.ts. 
Tech: Map internal data to CSV columns or XLSX format (probably using a library). 
Deps: xlsx (for reading/writing Excel) or csv-stringify. 
Tests/Mig/Env: Provide sample files and ensure the adapter can parse them and produce 
output. 
Agent: Define error handling for format issues. 
123 — Tally/Generic Stub 
Feature: Create a stub adapter for Tally (a popular accounting software) or a generic 
example. 
Paths: apps/api/src/services/erp/tallyStub.ts. 
Tech: Implement mapping of orders to Tally’s expected format (if known) or simulate 
sending data. 
Deps: none (pure transformation). 
Tests/Mig/Env: Unit test with a typical order to see if transformation meets expected values. 
Agent: In future, allow configuration via UI to tweak field mappings. 
124 — Nightly Scheduler 
Feature: Setup a cron-like scheduler to run ERP sync jobs nightly. 
Paths: Could use BullMQ’s repeatable jobs feature; define a job that queues an ERP sync 
for each vendor with integration. 
Tech: Add jitter (random small delay per vendor) to avoid all running exactly at same time; 
implement backoff if one fails. 
Deps: bullmq (repeatable job). 
Tests/Mig/Env: Check that scheduling logic actually enqueues jobs at roughly the expected 
times. 
Agent: Log summary of each run for monitoring. 
125 — Mapping UI 
Feature: Admin UI to map internal fields to ERP fields. 
Paths: apps/admin/pages/erp/mapping.tsx (for instance). 
Tech: Provide draggable or form-based interface where an admin can align our data fields 
with those expected by an ERP adapter. 
Deps: none (unless a small library for nice mapping UI). 
Tests/Mig/Env: Provide a preview function to test the mapping with sample data. 
Agent: Save these mappings per vendor or globally depending on scope. 
126 — Error CSV 
Feature: If some rows fail in an ERP sync (e.g. data issues), generate a CSV of errors for 
download. 
Paths: apps/api/src/controllers/erp.ts (endpoint to download last error file, perhaps). 
Tech: Collect failed rows and error reasons during import; use fast-csv to output a CSV that 
vendor can download and review. 
Deps: fast-csv. 
Tests/Mig/Env: Simulate failures and ensure the CSV is well-formed with appropriate 
columns. 
Agent: Provide a link in the vendor or admin UI to download this error report. 
127 — Secret Encrypt/Mask 
Feature: Securely store ERP adapter credentials (API keys, etc.). 
Paths: apps/api/src/utils/crypto.ts (for encryption logic); use it in wherever secrets are stored 
(maybe in Vendor model integration settings). 
Tech: Use AES-GCM or similar strong encryption; derive key from environment variable (so 
it’s not stored in code). 
Deps: Node crypto library. 
Tests/Mig/Env: Plan for key rotation (maybe a future improvement); ensure that when 
displaying in UI, secrets are masked (e.g. show only last 4 chars). 
Agent: Prevent logging these secrets. 
128 — Signed Webhooks Stub 
Feature: Prepare for receiving webhooks from ERP systems with verification. 
Paths: apps/api/src/routes/webhooks/erp/*.ts (stub endpoints); implement signature 
verification logic. 
Tech: Use HMAC with a pre-shared secret to verify incoming data hasn’t been tampered. 
Deps: none. 
Tests/Mig/Env: Simulate a webhook POST with correct and incorrect signature to test 
verification. 
Agent: Ensure idempotency by ignoring duplicates (tie in with global idempotency system 
from chunk 173). 
129 — Delta Sync 
Feature: Optimize ERP sync by only transferring changes since last successful sync 
(high-water mark token). 
Paths: apps/api/src/models/SyncState.ts (to store last sync timestamp per vendor); logic in 
ERP service to use it. 
Tech: After each sync, store the timestamp or unique ID of last record; next sync starts from 
there. 
Deps: none. 
Tests/Mig/Env: Simulate two sync runs and ensure the second one only processes new 
changes. 
Agent: Make sure if a sync fails mid-way, the state is not updated (so it retries those 
changes next time). 
130 — Manual Trigger 
Feature: Add a button in admin/vendor UI to manually trigger an ERP sync on-demand. 
Paths: apps/admin or vendor/pages/erp/syncNow.tsx or a component with a button. 
Tech: Simply enqueue the sync job for that vendor out-of-schedule when clicked. 
Deps: bullmq (to enqueue job). 
Tests/Mig/Env: Permission check – only authorized users should see/activate this. 
Agent: Show a toast or notification on UI that sync was triggered (and maybe when it 
completes, via polling or webhook). 
131 — Vendor Order Export 
Feature: Provide vendors a way to export their orders in the format required by their ERP. 
Paths: apps/api/src/controllers/erp.ts (endpoint to download file); could reuse adapter to 
generate file. 
Tech: Accept query (date range, etc.), use the appropriate ERP adapter mapping to create a 
CSV/XLSX, and stream it to response. 
Deps: adapter from earlier tasks. 
Tests/Mig/Env: Test pagination for very large exports (maybe chunk the generation if 
needed). 
Agent: Allow specifying a date range or “all orders” for flexibility. 
132 — Adapter Tests 
Feature: Add dedicated unit tests for each ERP adapter. 
Paths: apps/api/tests/erpAdapters.spec.ts (for example). 
Tech: Use fixtures for input (e.g. sample orders) and expected output (like a sample CSV) to 
test mapping logic. 
Deps: jest. 
Tests/Mig/Env: Achieve near 100% coverage on the adapter functions, given the criticality of 
data correctness. 
Agent: Make these tests part of required CI checks. 
133 — Docs 
Feature: Documentation for ERP integration feature. 
Paths: docs/ERP.md. 
Tech: Include flow diagrams showing data flow between NearbyBazaar and external ERP; 
explain how to set up an adapter, etc. 
Deps: none. 
Tests/Mig/Env: N/A. 
Agent: Highlight security aspects (like encryption of secrets, verification of webhooks) in the 
docs. 
134 — Job Audit 
Feature: Maintain an audit log of ERP sync jobs (successes/failures, timestamps). 
Paths: apps/api/src/models/SyncJob.ts (fields for vendor, type, status, errors); admin UI 
page to view job history. 
Tech: If using BullMQ, can hook into global events or just log when job starts/completes. 
Deps: bullmq. 
Tests/Mig/Env: Simulate failures to ensure they’re recorded. 
Agent: Provide filters in UI (e.g. show only failed jobs, or jobs for a certain vendor). 
135 — Sample Data 
Feature: Provide sample ERP import/export files for testing and development. 
Paths: /samples/erp/ (a directory with example CSV/XLSX files). 
Tech: Cover a couple of typical schemas in these samples. 
Deps: none. 
Tests/Mig/Env: Use these samples in automated tests or documentation examples. 
Agent: Document the structure of these sample files in the ERP docs (so developers know 
how to use them). 
Dropshipping (136–150) 
136 — Supplier Onboarding 
Feature: Model and flow for onboarding dropship suppliers. 
Paths: apps/api/src/models/Supplier.ts and controllers for invite/approval. 
Tech: Include KYC fields (company info, tax IDs) in Supplier model; define statuses (invited, 
active, suspended). 
Deps: KYC verification later (see chunk 189). 
Tests/Mig/Env: Create an email invite flow to a new supplier (maybe generating a signup 
link). 
Agent: Manage supplier lifecycle (pending approval → active → maybe terminated). 
137 — SKU Mapping 
Feature: Map supplier-provided SKUs to NearbyBazaar’s SKUs. 
Paths: apps/api/src/models/SkuMapping.ts (with fields: supplierId, supplierSku, ourSku); UI 
in vendor portal to manage mapping. 
Tech: Handle conflicts (if two suppliers use same SKU code, keep separate by supplierId). 
Deps: @nearbybazaar/lib sku utilities (to generate our SKUs for new items if needed). 
Tests/Mig/Env: Ensure that adding a mapping for an SKU already mapped triggers an 
update or error appropriately. 
Agent: Log changes to mappings for audit. 
138 — Stock/Price Sync 
Feature: Pull inventory and price feed from suppliers to update our listings. 
Paths: apps/api/src/jobs/supplierSync.ts (a job that fetches supplier feeds); parse and 
update Products’ stock and price. 
Tech: Rate-limit feed fetches to not overload suppliers; only propagate changes (delta 
updates). 
Deps: queue system for scheduling these jobs. 
Tests/Mig/Env: Test with large feed input to ensure processing works; ensure out-of-stock or 
price drop updates reflect correctly. 
Agent: Send notifications to vendors if their product pricing or availability was auto-updated 
(optional). 
139 — Auto‑push Orders 
Feature: Automatically send incoming orders to supplier’s system. 
Paths: apps/api/src/services/dropship/outboundWebhook.ts or similar. 
Tech: On order creation (for a dropshipped product), call supplier’s order API or send 
webhook with idempotency keys. 
Deps: Use global idempotency (chunk 173) to prevent duplicate pushes. 
Tests/Mig/Env: Simulate duplicate notifications and ensure supplier doesn’t get the same 
order twice. 
Agent: Maintain an audit trail of each push (timestamp, response from supplier). 
140 — Fulfillment Updates 
Feature: Retrieve shipment tracking and status updates from suppliers. 
Paths: jobs or webhook endpoints to get status from supplier’s API or receive callbacks. 
Tech: Map supplier’s status codes to our order status (shipped, delivered, etc.). 
Deps: shipping adapter (later chunk) or direct API calls. 
Tests/Mig/Env: Handle partial shipments or split orders. 
Agent: Notify buyers when their order status updates (and vendors too, if needed). 
141 — Vendor Dropship Pages 
Feature: Vendor UI for managing dropship integration. 
Paths: apps/vendor/pages/dropship/*.tsx (pages like “Suppliers”, “Mappings”, 
“Performance”). 
Tech: Provide charts or stats (like number of products from each supplier, sales, etc.). 
Deps: none distinct (just use existing data). 
Tests/Mig/Env: Basic smoke test for the pages loading with dummy data. 
Agent: Filters to view specific supplier’s products or orders. 
142 — Margin Rules 
Feature: Allow vendors to set margin rules for dropship products (to ensure a minimum 
profit). 
Paths: apps/api/src/models/MarginRule.ts; perhaps UI in vendor app to configure. 
Tech: For each supplier or category, vendor can define a minimum margin percentage or 
fixed markup; enforce that on price updates (don’t price below cost + margin). 
Deps: pricing utility for rounding final price. 
Tests/Mig/Env: Edge cases where rounding might cause slight below-threshold margin. 
Agent: Adjust auto-pricing to obey these rules (or flag items needing manual pricing if 
conflict). 
143 — Compliance Acceptance 
Feature: Ensure suppliers and vendors accept certain terms (SLAs, compliance terms) for 
dropshipping. 
Paths: apps/api/src/models/Agreement.ts (store versioned agreement and acceptance 
records); UI prompt on first login or when new terms released. 
Tech: If not accepted, block certain actions (like receiving new orders). 
Deps: none. 
Tests/Mig/Env: Audit log when terms are accepted; test blocking behavior. 
Agent: Version each compliance document so new ones trigger re-prompt. 
144 — Notifications 
Feature: Comprehensive notifications for dropship events (e.g. new order to supplier, stock 
low, etc.). 
Paths: Set up email templates or in-app inbox (admin or vendor UI inbox page) for such 
events. 
Tech: Use the existing mailer queue; possibly also integrate a web push or app push. 
Deps: mailer. 
Tests/Mig/Env: Rate-limit or aggregate notifications to avoid spamming (e.g. one summary 
email for multiple low-stock alerts). 
Agent: Provide a preference center if needed for vendors to opt-in/out of certain 
notifications. 
145 — Returns (stub) 
Feature: Stub out return merchandise authorization (RMA) flows for dropship orders. 
Paths: apps/api/src/models/Return.ts and maybe routes. 
Tech: Define statuses (requested, approved, shipped back, refunded) and interactions 
between buyer-vendor-supplier. 
Deps: none for now. 
Tests/Mig/Env: N/A for now (no full implementation). 
Agent: This will be extended later; initial stub just to plan data model. 
146 — API Endpoints 
Feature: Build REST endpoints for dropshipping module. 
Paths: apps/api/src/routes/dropship/*.ts (cover CRUD for suppliers, mapping endpoints, 
etc.). 
Tech: Use Zod to validate requests; likely admin/vendor protected. 
Deps: none beyond core. 
Tests/Mig/Env: Ensure these endpoints are listed in OpenAPI spec. 
Agent: Apply RBAC guards appropriately (vendors can only access their own supplier 
mappings, etc., admin can access all). 
147 — Tests 
Feature: Unit and integration tests for dropshipping functions. 
Paths: apps/api/tests/dropship.spec.ts (cover mapping logic, order push, etc.). 
Tech: Use jest with mocks for external supplier calls. 
Deps: jest. 
Tests/Mig/Env: Achieve good coverage; ensure CI passes. 
Agent: This should be a CI gate given importance of correct fulfillment. 
148 — Docs 
Feature: Documentation for dropshipping module. 
Paths: docs/DROPSHIP.md. 
Tech: Use sequence diagrams to show order flow to supplier and back. 
Deps: none. 
Tests/Mig/Env: N/A. 
Agent: Include examples of webhook payloads or API calls for suppliers. 
149 — Seeds 
Feature: Seed sample suppliers and SKU mappings for dev. 
Paths: apps/api/src/seeders/dropship.ts. 
Tech: Create a couple of supplier records and map some existing products to them. 
Deps: none. 
Tests/Mig/Env: Can be re-run safely (check and update if exists). 
Agent: Mention in README how to use these seeds (perhaps linking to them from main 
README). 
150 — Push Rate Limits 
Feature: Rate-limit outgoing order pushes to suppliers. 
Paths: Could be middleware in outbound webhook logic or a check in job processing. 
Tech: Use Redis sliding window per supplier to allow only X pushes per minute (to avoid 
overwhelming supplier API). 
Deps: ioredis. 
Tests/Mig/Env: Test fairness if multiple suppliers; ensure one slow supplier doesn’t block 
others. 
Agent: If limit reached, queue the push to retry shortly and log a warning. 
SEO + Slugs (151–155) 
151 — Server SEO API 
Feature: API endpoint to fetch SEO metadata for a given route (to support server-side or 
dynamic rendering). 
Paths: apps/api/src/routes/seo.ts (e.g. GET /v1/seo?path=/p/slug returns title, desc, etc.). 
Tech: Precompute or cache common SEO tags for known routes to avoid recalculating 
frequently. 
Deps: @nearbybazaar/lib/seo for generation. 
Tests/Mig/Env: Use ETag or Last-Modified to allow clients to cache responses. 
Agent: Include localized fields if supporting multi-language SEO (title_en, title_hi, etc.). 
152 — Sitemap + robots.txt 
Feature: Dynamically generate sitemap(s) and provide a static robots.txt. 
Paths: apps/web/pages/sitemap.xml.ts (Next.js API route that generates XML); 
public/robots.txt (static or generated). 
Tech: If many URLs, chunk into multiple sitemaps (e.g. one per type or date range); ensure 
proper indexing of products, services, store pages. 
Deps: might use APIs to fetch all slugs. 
Tests/Mig/Env: Validate that hitting /sitemap.xml returns 200 and contains expected entries; 
check that gzipping works if enabled. 
Agent: Include image URLs in sitemap entries if possible (to help image indexing). 
153 — Canonicals 
Feature: Ensure each page sets a canonical URL tag (especially if content can be accessed 
via multiple URLs). 
Paths: SeoHead or in Next.js pages as needed; also API can give hints for canonical. 
Tech: Remove or unify URL parameters (e.g. strip utm_* params or language query when 
setting canonical). 
Deps: none. 
Tests/Mig/Env: Make sure duplicate pages (like same product via different category path if 
any) point to one canonical URL to avoid SEO penalty. 
Agent: Avoid creating thin or duplicate pages that might confuse search engines. 
154 — Slug History + 301 
Feature: Keep track of old slugs and serve 301 redirects when content moves to a new slug. 
Paths: apps/api/src/models/SlugHistory.ts (fields: oldSlug, newSlug, type e.g. 'product'); 
middleware in web server (maybe Next.js custom server or API middleware) to handle. 
Tech: On a slug not found (404), check SlugHistory; if found, respond with 301 redirect to 
new URL. 
Deps: product/service/classified models integration. 
Tests/Mig/Env: Ensure no infinite redirect loops (e.g. chain of slugs resolves properly). 
Agent: Populate SlugHistory in hooks (from chunks 039–041) whenever slug changes. 
155 — JSON‑LD Schema 
Feature: Add rich snippet structured data (JSON-LD) for products, stores, and services. 
Paths: SeoHead component or individual pages where needed. 
Tech: For products: use schema.org Product (with name, image, price, etc.); for services: 
maybe schema.org Service; for store: LocalBusiness or Organization schema. 
Deps: none. 
Tests/Mig/Env: Use Google’s structured data testing tool to verify the output. 
Agent: Include pricing in INR with proper currency code, stock availability, etc., to qualify for 
rich results. 
Testing/CI/DevOps (156–165) 
156 — Jest Setup 
Feature: Configure Jest for the monorepo. 
Paths: jest.config.ts at root (possibly extend in each package/app as needed). 
Tech: Use ts-jest for TypeScript support; set up coverage thresholds. 
Deps: jest, ts-jest, @types/jest. 
Tests/Mig/Env: Ensure pnpm test runs all tests across workspaces. 
Agent: Write a basic unit test in one module to verify the setup is working. 
157 — Playwright Smoke 
Feature: Set up Playwright for end-to-end smoke testing of the PWAs. 
Paths: playwright.config.ts; maybe a tests/e2e/ directory. 
Tech: Use headless Chromium to launch the web, vendor, admin apps and perform simple 
interactions. 
Deps: @playwright/test. 
Tests/Mig/Env: Configure CI to spin up the dev servers (API + apps) before running tests; 
verify basic flows (login if exists, navigation). 
Agent: Ensure these tests are run on pull requests to catch integration issues. 
158 — Husky Hooks 
Feature: Add Git hooks (via Husky) to enforce code quality on commits. 
Paths: .husky/pre-commit, .husky/pre-push etc. 
Tech: Use lint-staged to run ESLint and Prettier on changed files pre-commit; run tests on 
pre-push perhaps. 
Deps: husky, lint-staged. 
Tests/Mig/Env: Ensure that committing with badly formatted code fails (test locally). 
Agent: Install hooks on pnpm install via postinstall script. 
159 — Docker (Mongo/Redis) 
Feature: Provide a Docker Compose for local dev of MongoDB and Redis. 
Paths: docker-compose.yml at project root. 
Tech: Define services for mongodb and redis with persistent volumes. 
Deps: Docker. 
Tests/Mig/Env: Include a readiness check or wait script so they are up before API tries to 
connect. 
Agent: Update README with instructions to use docker-compose up -d for dev 
environment. 
160 — CI Workflow 
Feature: Set up GitHub Actions (or similar CI) for build, lint, test. 
Paths: .github/workflows/ci.yml. 
Tech: Matrix build for multiple Node versions if needed; cache pnpm dependencies for 
speed. 
Deps: actions/setup-node, perhaps actions/cache. 
Tests/Mig/Env: Ensure that on each push/PR, the workflow installs deps, runs lint, runs 
tests, and reports status. 
Agent: Archive test artifacts (like coverage or screenshots from e2e) for debugging if 
needed. 
161 — Seeders 
Feature: Standardize seed scripts for populating dev/test data. 
Paths: apps/api/package.json (add scripts like seed:dev); possibly utilize ts-node to run 
seeder files. 
Tech: Use idempotent upsert logic in seed scripts so they can be rerun. 
Deps: none additional. 
Tests/Mig/Env: Running pnpm seed:dev multiple times should not duplicate data. 
Agent: Provide enough sample data (users, vendors, products, etc.) for e2e tests to run 
meaningfully. 
162 — OpenAPI at /docs 
Feature: Serve API documentation (Swagger UI) from the API server. 
Paths: apps/api/src/routes/docs.ts (serve swagger.json via swagger-jsdoc); configure 
swagger-ui-express. 
Tech: Auto-generate schemas from JSDoc or define manually; integrate Zod schemas if 
possible. 
Deps: swagger-jsdoc, swagger-ui-express. 
Tests/Mig/Env: Visiting /v1/docs in a browser should show the Swagger UI with all 
endpoints. 
Agent: Continuously update these docs as new endpoints are added. 
163 — DEV.md 
Feature: Developer guide documentation. 
Paths: DEV.md at root. 
Tech: Include instructions for common tasks (setting up, running, testing, debugging). 
Deps: none. 
Tests/Mig/Env: N/A. 
Agent: This should be updated over time with gotchas, tips, and onboarding info. 
164 — OPS.md 
Feature: Operations runbook documentation. 
Paths: OPS.md at root. 
Tech: Cover deployment process, scaling strategy, backup/restore procedures. 
Deps: none. 
Tests/Mig/Env: N/A. 
Agent: Include instructions for on-call engineers to handle incidents, known issues, etc. 
165 — SECURITY.md 
Feature: Security policy and guidelines. 
Paths: SECURITY.md at root. 
Tech: Outline how to report vulnerabilities, scope of bounty (if any), etc. 
Deps: none. 
Tests/Mig/Env: N/A. 
Agent: Emphasize secrets management and not sharing sensitive info; include link to 
disclosure program if exists. 
Phase 2: Platform Hardening & Extensions (166–195) 
Platform & Security Hardening (166–173) 
166 — Request Validation Layer 
Feature: Centralize request validation using Zod schemas per route. 
Paths: apps/api/src/middleware/validate.ts (to use schemas); define schema objects 
alongside routes. 
Tech: If validation fails, respond with 400 and aggregated error details (all issues in input). 
Deps: zod (already in use). 
Tests/Mig/Env: Test sending malformed JSON or missing fields to ensure a proper 400 with 
error info. 
Agent: Use this middleware in all routes to fail-fast on bad input. 
167 — Input Sanitizers 
Feature: Sanitize incoming inputs for HTML/JS to prevent XSS and other injection attacks. 
Paths: apps/api/src/utils/sanitize.ts; use in relevant places (maybe a middleware or in 
Mongoose hooks before save). 
Tech: Use libraries like sanitize-html or xss to strip disallowed tags and attributes. 
Deps: sanitize-html, xss (add to project). 
Tests/Mig/Env: Send inputs containing <script> tags and ensure they’re sanitized out or 
rejected. 
Agent: Maintain a whitelist of allowed HTML elements in rich text fields (if any); otherwise 
strip all HTML. 
168 — Password Hash + Refresh Tokens 
Feature: Improve auth security with strong password hashing and refresh token mechanism. 
Paths: apps/api/src/auth/login.ts (hash password on sign-up); /auth/refresh, /auth/logout 
handlers; a token store (like Redis) for refresh tokens. 
Tech: Use argon2 for hashing passwords; store refresh tokens in Redis with TTL to allow 
logout and rotation. 
Deps: argon2. 
Tests/Mig/Env: Set REFRESH_TOKEN_TTL in env for token longevity; test that logging out 
invalidates refresh token. 
Agent: Consider device-based token tracking so a user can log out from all devices. 
169 — Email/OTP + 2FA 
Feature: Implement one-time password (OTP) for actions like login or as second factor, plus 
TOTP 2FA. 
Paths: apps/api/src/auth/otp/*.ts (endpoints to send and verify OTP); integrate with 2FA 
library for TOTP (like Google Authenticator codes). 
Tech: Use Brevo (Sendinblue) API or SMTP to send OTP emails; use speakeasy for 
generating/validating TOTP codes; allow backup codes. 
Deps: brevo (Sendinblue) SDK or just SMTP via nodemailer; speakeasy for TOTP. 
Tests/Mig/Env: Simulate enabling 2FA for an account and test login flow with OTP; ensure 
backup codes are one-time use and hashed in DB. 
Agent: Enforce 2FA for admin and vendors optionally (maybe a policy that can be toggled). 
170 — Granular RBAC 
Feature: Fine-grained role permissions for various resources/actions. 
Paths: apps/api/src/rbac/ability.ts and policies/*.ts (define specific rules for each model and 
action). 
Tech: Use a library or custom logic to define can(user, action, resource) in detail. 
For example, vendor can update own product, admin can update any. 
Deps: none beyond existing structure. 
Tests/Mig/Env: Create a matrix of roles vs actions to ensure denies by default unless 
explicitly allowed. 
Agent: Make sure any new endpoint checks permission via this centralized ability function. 
171 — Immutable Audit Log 
Feature: Switch to an immutable, tamper-evident audit log. 
Paths: apps/api/src/models/ImmutableAudit.ts (like a blockchain of logs with previous hash); 
a daily job to anchor the log. 
Tech: Each new log entry stores a hash of its content plus the previous entry’s hash 
(forming a chain). Possibly compute a daily hash of last entry and store externally (or just 
email it out as poor man’s backup). 
Deps: crypto (Node’s crypto for hashing). 
Tests/Mig/Env: Attempt to tamper with an old log entry in tests and ensure the hash chain 
breaks detection. 
Agent: Use this for critical events (auth changes, payouts, etc. as mentioned in later 
chunks). 
172 — CORS + Rate Limits 
Feature: Refine CORS and introduce robust rate limiting. 
Paths: apps/api/src/middleware/cors.ts (configure allowed origins from env 
CORS_ALLOW_ORIGINS); apps/api/src/middleware/rateLimit.ts. 
Tech: Only allow specified domains to call the APIs (for production, list our front-end 
domains); implement sliding window rate limit per route and per user/IP (e.g. 100 
requests/minute). 
Deps: ioredis (for distributed rate limit counting). 
Tests/Mig/Env: Ensure a burst of requests returns 429 after threshold; verify CORS headers 
appear correctly for allowed origins and not for others. 
Agent: Possibly allow higher limits for authenticated users vs anonymous. 
173 — Request‑ID, Idempotency, Structured Logs 
Feature: Enhance logging and idempotency for requests (especially critical ones like 
payments). 
Paths: apps/api/src/middleware/logging.ts (to attach a unique X-Request-Id to each request, 
using incoming header or generating new); payment and webhook handlers to check for an 
Idempotency-Key header and use Redis to prevent duplicate processing. 
Tech: Use pino and pino-http for structured JSON logs; log requestId with each log for 
tracing. 
Deps: pino, pino-http. 
Tests/Mig/Env: Resend the same payment webhook with Idempotency-Key and ensure 
second is ignored; check logs contain request IDs. 
Agent: Honor a LOG_LEVEL env to control verbosity (info in prod, debug in dev, etc.). 
Commerce Core (174–181) 
174 — Checkout Domain Models 
Feature: Define data models for checkout process entities. 
Paths: apps/api/src/models/{Address.ts, Cart.ts, Shipment.ts, PaymentIntent.ts, 
StockReservation.ts}. 
Tech: Address: fields for user addresses; Cart: possibly ephemeral (maybe just in frontend, 
or server-side for logged-in users); Shipment: tracking shipments; PaymentIntent: store 
payment gateway info; StockReservation: hold inventory for pending orders. 
Deps: none new. 
Tests/Mig/Env: Ensure that creating an order moves stock from reservation to actual order. 
Agent: Keep IDs consistent and unique (e.g. maybe use ULID for human-readable order 
IDs). 
175 — Checkout API 
Feature: Implement multi-step checkout API. 
Paths: apps/api/src/controllers/checkout.ts and routes: /cart, /checkout/address, 
/checkout/shipping, /checkout/pay, /checkout/confirm. 
Tech: Represent state machine transitions (cart → address → shipping option → payment 
initiation → confirmation). Possibly use server session or track by cart ID. 
Deps: payment integration stub, inventory for stock allocation. 
Tests/Mig/Env: Simulate full flow in tests: add to cart, set address, choose shipping, 
simulate payment success, confirm order creation. 
Agent: Use idempotency keys on confirm endpoint to avoid double order creation if last step 
is retried. 
176 — Payments: PhonePe/UPI 
Feature: Integrate with PhonePe (a popular Indian UPI payment gateway) for collecting 
payments. 
Paths: apps/api/src/services/payment/phonepe.ts (create payment request, verify 
signature); apps/api/src/routes/payments.ts (webhook handler for payment confirmation). 
Tech: PhonePe provides SDK or HTTP API; incorporate HMAC verification of their 
callbacks. 
Deps: PhonePe’s API details (maybe an SDK or just manual HTTP calls). 
Tests/Mig/Env: Use sandbox credentials; simulate a payment creation and a webhook 
callback in tests. 
Agent: Keep sensitive keys secure; do not log raw payloads with keys. 
177 — Refunds & Partial Refunds 
Feature: Support initiating refunds (full or partial) for orders and adjust commissions 
accordingly. 
Paths: apps/api/src/controllers/payments.ts (POST /payments/refund); integrate with 
commission ledger to create reversal entries. 
Tech: Calculate how much of commission to claw back on refund (proportional to refunded 
amount). 
Deps: integration with PhonePe or relevant gateway’s refund API (if available). 
Tests/Mig/Env: Test scenario: an order of 2 items, refund 1 item, ensure commission for that 
item is reversed. 
Agent: Ensure audit logs capture these events. 
178 — Tax Engine (GST) 
Feature: Introduce tax calculation logic for GST. 
Paths: apps/api/src/services/tax/*.ts (maybe a module to compute GST based on item 
categories and location). Invoice service to generate PDF invoice with tax breakdown. 
Tech: Maintain tables for HSN (goods) and SAC (services) codes with applicable GST rates; 
handle IGST vs CGST/SGST logic based on interstate/intrastate sale. 
Deps: pdfkit or puppeteer (to generate PDF invoices if needed). 
Tests/Mig/Env: Test rounding and splitting of GST (should be correctly split between CGST 
and SGST if intrastate). Use INR currency formatting. 
Agent: Maintain invoice number sequences (maybe per financial year or per vendor) for 
compliance. 
179 — Shipping Integrations 
Feature: Standardize interface for shipping couriers and integrate with Shiprocket/Delhivery 
(as stubs to start). 
Paths: apps/api/src/services/shipping/{shiprocket.ts, delhivery.ts, types.ts}. 
Tech: Support functions like rateQuote, createLabel, trackShipment via these adapters. 
Deps: could use their HTTP APIs (no heavy SDK needed). 
Tests/Mig/Env: Use dummy sandbox credentials; test that functions return expected 
structured data. 
Agent: Design for pluggability (similar to ERP adapter approach). 
180 — Inventory: Multi‑warehouse + Reservations 
Feature: Expand inventory management to support multiple warehouses and stock 
reservations. 
Paths: apps/api/src/models/Warehouse.ts; StockItem.ts (stock per warehouse); expand 
StockReservation model to hold specific warehouse info if needed. 
Tech: Atomic updates when reserving stock (to avoid race conditions); possibly use 
transactions or findAndUpdate with conditions. 
Deps: none beyond Mongo/Mongoose. 
Tests/Mig/Env: Simulate two parallel checkout attempts for the last item to ensure one fails 
to reserve stock. 
Agent: Release reservations if not checked out in a certain time (e.g. 15 minutes hold). 
181 — Pricing Rules 
Feature: Add flexible pricing rules (coupons, promotions, tiered pricing for bulk, etc.). 
Paths: apps/api/src/services/pricingEngine.ts (to evaluate applicable rules for a cart or 
order). 
Tech: Define rule types: coupon (code for discount), automatic promo (e.g. 10% off on 
electronics this week), tiered pricing (buy 10+ get lower per unit price). 
Deps: none specifically. 
Tests/Mig/Env: Test stacking rules and exclusion (some coupons not combinable with 
others). 
Agent: Provide explanation breakdown so front-end can show “Applied Coupon SAVE10: -₹100”. 
Marketplace Features (182–186) 
182 — “Sell Yours” Multi‑offer 
Feature: Allow multiple vendors to offer the same product (multi-seller marketplace for a 
product page). 
Paths: apps/api/src/models/ProductOffer.ts (fields: productId, vendorId, price, stock, SLA, 
etc.); controllers/offers.ts for CRUD. 
Tech: On a product page, buyers see a “More Buying Options” if multiple vendors sell it. 
Deps: linking with Products and Vendors. 
Tests/Mig/Env: Enforce uniqueness: one offer per vendor per product; test creating offers 
and retrieving. 
Agent: Add validation to ensure a vendor can’t offer negative price or stock beyond their 
inventory. 
183 — Buy Box Service 
Feature: Determine which vendor’s offer wins the “Buy Box” (the default add-to-cart vendor 
if multiple offers). 
Paths: apps/api/src/services/buyBox.ts (score calculation); controllers maybe to expose buy 
box info or override. 
Tech: Score based on a combination of price (lower better), vendor rating, SLA (faster 
shipping better), past cancellation rates, etc. 
Deps: uses data from offers, vendor ratings, etc. 
Tests/Mig/Env: Test tie-break scenarios and extreme differences (one vendor much cheaper 
vs another with much better rating). 
Agent: Cache results for short periods because data changes will recalculation; allow admin 
to override manually if needed for fairness or promotions. 
184 — Vendor KYC & Payouts 
Feature: Manage vendor Know-Your-Customer (KYC) verification and payout tracking. 
Paths: apps/api/src/models/KYC.ts (store documents like PAN, GST, etc. status); 
models/Payout.ts for payout entries; admin review UI for KYC. 
Tech: Before vendors can receive payouts, ensure KYC documents are uploaded and 
approved by admin. Mask sensitive info when displaying. 
Deps: storage (for documents), possibly an external verification API. 
Tests/Mig/Env: Status transitions: e.g. Submitted → Verified or Rejected. 
Agent: Securely store KYC docs (encrypted at rest, watermark them with vendor ID and 
timestamp to prevent reuse elsewhere), see chunk 259 for advanced checks. 
185 — Reviews Moderation & Spam 
Feature: Tools to moderate product/store reviews and detect spam. 
Paths: apps/api/src/middleware/reviewGuard.ts (heuristics like time between posts, IP 
checks); admin UI to view reported reviews. 
Tech: Basic signals: if a single user posts many reviews quickly, flag; allow users to report 
reviews which then admin can mark as resolved or remove. 
Deps: rate-limit (reuse existing limiter for posting reviews). 
Tests/Mig/Env: Simulate rapid reviews to trigger spam detection; ensure reported reviews 
appear in admin panel. 
Agent: Possibly implement shadow-banning: flagged users’ reviews become invisible to 
others without alerting the user immediately. 
186 — Dispute Management 
Feature: System to handle disputes (e.g. buyer vs vendor issues, like item not received, not 
as described, etc.). 
Paths: apps/api/src/models/Dispute.ts; controllers/disputes.ts; admin UI for disputes. 
Tech: Create tickets with status (open, vendor responded, escalated, resolved); set SLA 
timers (e.g. vendor must respond in X days or auto-escalate). 
Deps: bullmq (for escalation reminders via delayed jobs). 
Tests/Mig/Env: End-to-end test: buyer raises dispute, vendor responds, admin resolves. 
Agent: Notify relevant parties at each stage (emails or in-app notifications via earlier 
system). 
Catalog & Search (187–189) 
187 — Taxonomy & Attributes 
Feature: Implement category hierarchy and product attributes. 
Paths: apps/api/src/models/Category.ts (with parent/children for tree); models/Attribute.ts 
and linking in Product model for things like size, color; possibly support bundles of products. 
Tech: Use nested set or parent reference for category tree; allow products to have multiple 
attributes (key-value pairs). 
Deps: none. 
Tests/Mig/Env: Ensure querying by category includes subcategories (if deep); test adding 
attributes and filtering by them. 
Agent: Admin UI to manage categories (maybe seed initial taxonomy); plan to sync this to 
search index. 
188 — Search Infra 
Feature: Integrate an actual search engine (like Meilisearch or Elasticsearch) for robust 
searching. 
Paths: apps/api/src/services/search.ts (client to search engine); indexers to push 
product/service data to the engine. 
Tech: Choose Meilisearch for simplicity (lightweight); configure synonyms, custom analyzers 
for better text matching; implement search result sorting, pagination. 
Deps: meilisearch client. 
Tests/Mig/Env: Relevance tests: ensure that searching “phone” returns “phone cover” etc if 
synonyms present; test non-English queries if needed. 
Agent: Keep the search index updated in near real-time on data changes (listen to 
Mongoose post-save to index new or updated documents). 
189 — Media Pipeline 
Feature: Enhance media handling with presigned uploads, virus scanning, and responsive 
variants. 
Paths: apps/api/src/services/media.ts (to generate presigned URLs for direct upload to 
storage, if we go that route); integrate an antivirus scan hook after upload (maybe using 
ClamAV). 
Tech: After user uploads an image or file, scan it for viruses (ClamAV CLI or a service); strip 
EXIF metadata from images for privacy. 
Deps: clamav (could integrate if available); or use a service if not running our own. 
Tests/Mig/Env: Test uploading an EICAR test file (common antivirus test string) and ensure 
it’s detected and upload is rejected. 
Agent: Pay attention to large file handling (set timeouts, file size limits, etc., to avoid DoS via 
huge files). 
Ops & Reliability (190–192) 
190 — Workers/Queues 
Feature: Set up a UI or monitoring for BullMQ queues and background workers. 
Paths: apps/api/src/queues/index.ts (centralize queue definitions); integrate bull-board or 
arena for a quick dashboard. 
Tech: Standardize retry counts, backoff strategies for each queue (email, webhooks, ERP, 
shipping, etc.). 
Deps: bull-board or arena (optional, for UI). 
Tests/Mig/Env: Simulate a “poison pill” job (one that always fails) and ensure it moves to 
dead-letter queue after retries. 
Agent: Add hooks to alert (maybe send an email or log) if too many failures occur. 
191 — Durable Scheduler 
Feature: Create a more sophisticated scheduled task runner that persists schedules (so 
they can be managed at runtime). 
Paths: apps/api/src/services/scheduler.ts (manage a collection of scheduled tasks in DB 
with next run times and jitter); admin UI to monitor scheduled tasks. 
Tech: If a task is missed (due to downtime), decide whether to catch up or skip; add 
backpressure (don’t start new if last run still going). 
Deps: none (BullMQ covers basic cron, but we want custom control). 
Tests/Mig/Env: Test pausing a scheduler (simulate server down) and ensure tasks run when 
it comes back or appropriately skipped. 
Agent: Provide admin controls to pause/resume schedules, run tasks immediately, etc. 
192 — Health/DR/Backups 
Feature: Add health check endpoints and set up backup scripts for disaster recovery. 
Paths: apps/api/src/routes/health.ts (/livez for liveness, /readyz for readiness); 
scripts/backup_mongo.sh, backup_redis.sh, etc. 
Tech: /livez returns OK if process up; /readyz does deeper checks like DB connection; for 
backups, use mongodump, redis SAVE or copy RDB files, etc., schedule via cron or external 
service. 
Deps: system CLI tools (mongodump). 
Tests/Mig/Env: Ensure /readyz fails if DB down to help orchestration (like Kubernetes 
readiness); test backup scripts manually in dev. 
Agent: Document Recovery Time Objective (RTO) and Recovery Point Objective (RPO) in 
OPS.md (how long to restore, how much data could be lost). 
Compliance & Performance (193–194) 
193 — Compliance Suite 
Feature: Implement compliance features like GDPR/DPDP data handling, CSRF protection 
if needed, cookie consent. 
Paths: apps/api/src/services/compliance.ts (functions for data export and deletion); possibly 
front-end components for consent banners. 
Tech: Provide an API for users to request data export or account deletion; ensure proper 
logging of these events. If using cookies (for a web session), ensure CSRF tokens in forms 
(if any). 
Deps: none new (maybe csurf if needed for CSRF). 
Tests/Mig/Env: Redact personal data for users who requested deletion, test that export 
provides all user data in a structured format (JSON or ZIP of JSON files). 
Agent: Implement a consent store for tracking user consents (privacy policy, cookie usage, 
etc.). 
194 — Telemetry & Tracing 
Feature: Integrate OpenTelemetry for system traces/metrics and ensure web performance 
metrics are collected. 
Paths: apps/api/src/index.ts (initialize OTLP exporter and instrument express and DB calls); 
front-end: measure Core Web Vitals. 
Tech: Use OpenTelemetry Node SDK to capture request traces, DB spans, etc., send to a 
collector (could be self-hosted or service); capture metrics like p95 response times. For 
front-end, use an analytics endpoint to record page load times, etc. 
Deps: @opentelemetry/api, @opentelemetry/sdk-node, etc. 
Tests/Mig/Env: Verify that basic traces appear in logs or exported; ensure PII like emails, 
etc., are not included in traces (scrub them). 
Agent: Set sampling rate to avoid too much overhead; perhaps 1 in 100 requests traced in 
detail in production. 
DevEx & Docs (195) 
195 — OpenAPI + Typed SDK + Test Gates 
Feature: Finalize serving Swagger JSON and generate a typed API client SDK, plus enforce 
test coverage gates in CI. 
Paths: apps/api/src/routes/docs.ts (ensure Swagger JSON is up-to-date); packages/sdk 
(perhaps create a small TypeScript SDK that wraps our APIs for third-party usage). 
Tech: Use openapi-typescript-codegen or similar to generate a TS client from the OpenAPI 
spec; set up CI to fail if coverage falls below a threshold or if any test fails (if not already 
done). 
Deps: openapi-typescript-codegen (if generating SDK). 
Tests/Mig/Env: Confirm that the generated SDK can call our APIs in a sample Node script; 
ensure CI threshold is set (e.g. 80% coverage required). 
Agent: Potentially include any last-minute RBI (Reserve Bank of India) e-mandate hooks if 
needed for recurring payments (the mention “RBI e-mandate hooksclient” suggests maybe 
integrating compliance for recurring mandates, ensure any needed tasks around that are 
noted). 
Phase 3: Expansion & Growth (196–215) 
Mobile & App Layer (196–197) 
196 — Native App Wrapper 
● Develop a minimal React Native (or Flutter) application wrapping the NearbyBazaar 
web via WebView or using a shared codebase for iOS/Android. 
● Implement bridging to the monorepo’s functionality (maybe reuse components or use 
a headless API approach). 
● Stub out push notification setup in the app (request device token, etc., but no 
backend logic yet). 
197 — Push Notifications Service 
● Integrate Firebase Cloud Messaging (FCM) for Android and Apple Push Notification 
service (APNs) for iOS. 
● Build a backend service or cron to send topic-based notifications (topics could be 
orders, promotions, wishlist updates, etc.). 
● Lay groundwork for a UI for vendors to send campaign notifications (to be fleshed out 
later). 
AI & Personalization (198–200) 
198 — Recommendation Engine 
● Implement a basic collaborative filtering engine using past purchase/view data to 
suggest products. 
● Identify “trending products” by overall popularity and generate recommendations at 
platform and vendor level. 
● Create an API endpoint for recommendations (e.g. GET 
/v1/recommendations/:userId returns personalized suggestions). 
199 — Vector Search + Semantic Queries 
● Integrate Meilisearch (or chosen search engine) with vector search capabilities (store 
vector embeddings for product descriptions). 
● Use a language model or embeddings service (OpenAI, HuggingFace) to allow 
semantic search queries (users can search in natural language). 
● Ensure multi-lingual support: embed queries and items in both Hindi and English 
spaces for cross-language matching. 
200 — Auto Product Categorization 
● Train or implement a machine learning classifier that suggests categories for new 
product listings automatically. 
● Build an admin UI for reviewing and correcting auto-categorization suggestions (with 
a “approve” or “correct” workflow). 
● Use a pre-trained model or fine-tune on our taxonomy if data is available. 
Logistics & Fulfilment (201–204) 
201 — COD Payments 
● Add support for Cash on Delivery (COD) as a payment option per vendor (a setting 
vendors can toggle). 
● Adjust order flow: if COD, mark order as pending payment but allow order creation. 
● Introduce settlement flow: vendor marks COD orders as paid upon collection, and 
platform handles commission accordingly. 
202 — Reverse Logistics 
● Implement return pickup scheduling with courier partners (extend shipping adapters 
to schedule pickups). 
● If a return is initiated (tie in with RMA stub), allow booking a pickup through courier 
API extension. 
● Provide vendor interface to approve/arrange returns and track them similar to 
outward shipments. 
203 — Courier Bidding System 
● If multiple courier services are integrated, build logic to fetch quotes from each for a 
given shipment. 
● Select the best option based on cost or delivery time (auto-selection for the platform 
or give vendor a choice). 
● Ensure that the order shipment creation can iterate through integrated couriers to 
pick optimal service. 
204 — Hyperlocal Delivery 
● Add support for hyperlocal delivery providers (for very local deliveries like within a 
city). Map pincodes or geo-radius to determine eligibility. 
● Maintain a mapping of pincodes to serviceability by certain courier or delivery fleet. 
● Provide a stub integration (maybe a local delivery startup’s API) to schedule 
hyperlocal deliveries; ensure the system can choose that if buyer is within range. 
Risk & Trust (205–207) 
205 — Fraud Detection Engine 
● Implement velocity checks (e.g. too many orders from the same IP in a short time) to 
flag potential fraud. 
● Incorporate IP and device fingerprinting (could use a library to generate a device ID 
from user agent + IP) to track suspicious activity. 
● Maintain a risk score for each order or user; high-risk actions could require manual 
review or trigger 2FA challenge. 
206 — Seller Trust & Reputation 
● Calculate a “seller score” for vendors based on metrics like Order Defect Rate 
(refunds/returns), late shipment rate, customer review averages, dispute history. 
● Display a trust badge or score on vendor profile (e.g. “Trusted Seller: 98% 
satisfaction”). 
● Use weighted formula giving more importance to recent performance and severe 
issues (like disputes). 
207 — Escrow Payments 
● For high-risk transactions or categories, hold buyer’s payment in escrow until delivery 
confirmed (especially if platform wants to protect buyers). 
● Modify payment flow: capture payment but don’t immediately settle to vendor; 
release X days after delivery or if buyer marks order OK. 
● Auto-release funds after an SLA if no dispute raised. This may involve modifications 
to payment integration (holding funds in gateway if supported, or platform manually 
delaying payout). 
Marketing & Growth (208–210) 
208 — Affiliate & Influencer Tracking 
● Create a system to generate referral links or codes for affiliates/influencers that track 
new user signups or sales. 
● On purchase or signup via a referral, attribute credit to the referrer; maintain a ledger 
of payouts owed to affiliates. 
● Provide affiliates a dashboard to see clicks, conversions, earnings; and admin a way 
to approve/pay out those commissions. 
209 — Campaign Manager + A/B Testing 
● Build an interface to create marketing campaigns (promo codes, special offers) and 
possibly run A/B tests on them. 
● For example, allow testing two different coupon amounts or banner messages and 
track conversion. 
● Integrate a conversion tracking snippet on key pages (order confirmation, etc.) to 
measure campaign effectiveness. 
210 — Gamified Loyalty Program 
● Design a loyalty system where buyers earn points for purchases, engagement 
(reviews, referrals, etc.), and reach reward tiers (Silver, Gold, etc.). 
● Display badges or streaks for frequent shoppers (e.g. streak for buying monthly). 
● Provide an API or UI element for vendors to integrate (if they want to reward 
interactions in their own channels). 
Buyer Experience (211–213) 
211 — Live Video Commerce 
● Integrate a live streaming solution (like Agora or WebRTC) so vendors can host live 
video sales sessions. 
● Develop front-end where buyers can watch live streams and see clickable product 
overlays to add to cart in real-time. 
● Ensure chat functionality for buyer questions during live stream. 
212 — AR/3D Product Previews 
● Support augmented reality previews or 3D models for products (especially in 
categories like furniture, apparel). 
● Use WebAR or model-viewer library to display GLTF/GLB 3D models on product 
pages. Optionally allow AR view on ARKit/ARCore supported devices. 
● Create an upload pipeline for vendors to add 3D models for their products (with file 
validations). 
213 — Social Commerce Layer 
● Implement social features: users can follow vendors or other users, share wishlists or 
carts. 
● Activity feed: e.g. “Alice started following XYZ Store” or “Bob added a new product to 
his wishlist” (only show to their followers, or in a global feed if appropriate). 
● Ensure privacy controls so users can opt out of sharing their activity. 
Ecosystem Extensibility (214–215) 
214 — Plugin Marketplace 
● Lay groundwork for a marketplace where third-party developers can build plugins or 
apps for vendors (e.g. custom analytics, integrations). 
● Develop a model to register third-party apps with scopes/permissions. Admin 
interface to approve and list these extensions. 
● Possibly not fully implement plugin runtime now, but define how an app can be 
plugged in (API keys or iframe in vendor portal, etc.). 
215 — Compliance India (DPDP + GSTN) 
● Adapt to Indian regulations: DPDP (Digital Personal Data Protection Act) compliance 
for user data consent and storage location. 
● Integrate with GSTN (Goods and Services Tax Network) for e-invoice or reporting if 
applicable: e.g. auto-upload of invoices to government portal (if threshold triggers). 
● Possibly create vendor guidance or features to help them comply (like downloading 
all invoices for GST filing). 
Phase 4: Vendor Sathi Program (216–225) 
Vendor Sathi Program (216–225) 
216 — Sathi Role Definition 
Feature: Introduce a new user role “Sathi” (field agent) with specific permissions. 
● Define in RBAC policies what Sathis can do: e.g., onboard vendors, assist with 
catalog management, act as intermediary in support tickets. 
● Update roles enum and any role-based UI conditions to accommodate Sathi. 
217 — Recruitment & Assignment Model 
Feature: Model Sathi records and assign them to vendors or regions. 
● Create a Sathi model including area details (city, region), possibly link to an 
NGO/partner if applicable. 
● Admin UI to assign a Sathi to a cluster of vendors or a geographic region. 
● Ensure one vendor can have a Sathi assigned (one-to-many or many-to-many 
depending on program design, but likely each vendor -> one Sathi). 
218 — Payment & Incentive Engine 
Feature: Track tasks done by Sathis and compute incentives. 
● Create a ledger for Sathi tasks: e.g., vendor onboardings completed, orders 
facilitated, disputes resolved, each with a certain reward/commission for the Sathi. 
● Calculate monthly payout amounts for each Sathi based on tasks and possibly 
performance bonuses. 
● Ensure that this ledger resets or accumulates per payout cycle. 
219 — Hierarchy & Reporting Flow 
Feature: Establish hierarchical roles in Sathi program. 
● Define relationships: Sathi -> City Manager -> Regional Manager -> Admin (HQ). 
Store references in the database. 
● Use this hierarchy in workflows: e.g., escalations go from Sathi to City Manager to 
Regional Manager to core Admin if not resolved. 
● Ensure the database can efficiently query all vendors under a City Manager (which is 
union of those under their city’s Sathis, etc.). 
220 — Sathi Mobile App (PWA) 
Feature: Create a front-end portal specifically for Sathis (could be a PWA or separate app). 
● Path: apps/sathi/ for a Next.js app or React PWA targeted at Sathi users. 
● Features: Task list (which vendors to visit or assist, tasks like collect documents, 
verify address), forms for vendor onboarding, GPS check-in (to confirm Sathi was 
on-site). 
● This app should have offline capability since field agents might be in low connectivity 
areas. 
221 — Training & Certification Module 
Feature: Provide online training materials and a certification quiz for Sathi onboarding. 
● Sathi users must go through training content (could be slides or videos), then take an 
exam (multiple choice). 
● Score the exam; only certify (perhaps unlock certain app features) if passed. 
● Issue a digital badge or ID (maybe a PDF certificate or an in-app badge) upon 
completion. 
222 — Monitoring Dashboard 
Feature: Admin dashboard to monitor Sathi program metrics. 
● Show number of vendors onboarded by each Sathi, orders facilitated (Sathi might 
help place orders on behalf of less tech-savvy vendors or buyers), disputes resolved 
with Sathi help. 
● Use maps to visualize distribution of Sathis across cities (e.g., markers or heatmap 
by area). 
● Leaderboards highlighting top-performing Sathis (to encourage healthy competition). 
223 — Data Privacy & Compliance Guard 
Feature: Enforce data privacy measures for Sathi access. 
● Require Sathi to accept an NDA or data privacy agreement in the app (log this 
acceptance with timestamp). 
● For sensitive actions (like viewing vendor personal documents), maybe force an OTP 
verification each time or a higher auth level. 
● Ensure DPDP compliance specifically in Sathi workflow: e.g., limit what personal data 
they can see and for how long (maybe restrict PII after onboarding is done). 
224 — Cost & Sustainability Reports 
Feature: Admin view to evaluate Sathi program cost vs benefits. 
● Calculate the operational expense (stipends, incentives of all Sathis) vs revenue 
generated from vendors they onboarded or managed. 
● Break it down by city or region to identify where program is profitable vs where it’s 
not. 
● Include metrics like cost per vendor onboarded, average revenue per Sathi-managed 
vendor, etc. 
225 — Scaling Strategy Automation 
Feature: Tools to help decide when/how to scale Sathi program to new regions. 
● Config: mark certain cities as pilot (to focus initial efforts). 
● Scripts or logic to automatically identify areas with high vendor density but no Sathi, 
and flag for recruitment. 
● Automate certain tasks: e.g., when a region’s vendor count exceeds X, prompt admin 
to hire a new Sathi there. 
● Possibly integrate with government’s e-invoicing or other frameworks if needed as 
part of scale (if mention of GSTN Vendor Sathi implies integration with a govt 
program). 
Phase 5: Admin Super Dashboard (226–230) 
226 — Dashboard UI Skeleton 
● Create the main dashboard page for the admin in the admin app 
(apps/admin/pages/dashboard.tsx). 
● Layout includes a sidebar with sections: Strategic, Operational, Ground (which likely 
correspond to different levels of metrics or user roles). 
● Use a UI kit (like shadcn/ui or custom Tailwind components) to create a clean base 
design. 
227 — KPIs & Summary Cards 
● Implement top-level KPI cards showing summary numbers: 
○ Vendors onboarded (today and total overall). 
○ Orders processed (today/this week vs total). 
○ Disputes pending resolution (count). 
○ Perhaps revenue vs Sathi program cost snapshot (if easily computed). 
● Ensure these update either live or on page refresh (pull from backend stats 
endpoint). 
228 — Vendor Sathi Performance View 
● Section/tab showing Sathi program performance: 
○ A table listing Sathi details with their metrics (vendors onboarded, orders 
facilitated, disputes resolved). 
○ A city map visualization indicating Sathi distribution (maybe using Google 
Maps or an SVG map where cities with Sathis are highlighted). 
○ A leaderboard highlighting top-performing Sathis by KPI (onboardings or 
successful order rates). 
229 — Finance & Compliance Snapshot 
● Section showing financial and compliance status: 
○ Commission collected vs payouts made (in aggregate and possibly recent 
trends). 
○ Vendor payout pending amounts. 
○ Sathi incentives paid this period. 
○ Alerts for compliance: e.g. how many vendors have pending GST/TDS filings 
if we track that, or NDA not signed count, etc. 
● Provide an option to download detail data as CSV or Excel for finance team. 
230 — Kaizen & Notifications Feed 
● Integrate a live feed panel for Kaizen suggestions (from the Kaizen module) and 
admin notifications: 
○ Show list of recent suggestions/ideas with quick approve/reject buttons or a 
link to detail. 
○ Display system notifications or alerts (like “X vendors awaiting KYC approval”, 
“New version deployed”, etc.). 
● Ensure the feed updates or is easily refreshable so admin can monitor without 
leaving dashboard. 
Phase 6: Buyer FOMO & Urgency System (236–240) 
231 — FOMO Badge Linked to Inventory 
● Add a feature for vendors to toggle a “Hurry, only X left!” badge on their product when 
stock is low. 
● Provide a field in Product or a related setting: fomoEnabled (boolean) and 
fomoThreshold (number of units). 
● Front-end: If fomoEnabled and stock <= fomoThreshold, display a prominent badge 
“Only {stock} left in stock!” on the product card or page. 
232 — Automated FOMO Triggers 
● Implement backend logic to auto-enable FOMO badges based on product 
performance: 
○ If product sells more than N units per day (trending fast), auto-turn on 
fomoEnabled. 
○ Or if current stock falls below 10% of original stock (e.g., started with 100, 
now 9 left => trigger). 
● Add configurable rules in admin panel to tweak N (sales/day) or percentage 
threshold. 
● Allow admin override: admin can force enable/disable FOMO on certain products 
regardless of auto rules. 
233 — FOMO Analytics Dashboard 
● Provide analytics to measure the effect of FOMO badges on sales. 
● Vendor dashboard addition: compare conversion rate for products with FOMO vs 
those without (if vendor has both types). 
● Admin dashboard: aggregate by city/region or globally, how FOMO is affecting user 
behavior (click-through, conversion). 
● Use CTR (click-through rate on product after seeing listing) and conversion 
(purchase rate) as metrics to compare. 
234 — Time-Based Urgency Badges 
● Enable vendors to create time-limited offers with countdown timers. 
● On product or cart: if an offer expires at a certain date/time, show “Offer ends in X 
days HH:MM:SS” countdown. 
● Hide or update badge after expiry (auto-remove it). 
● Possibly integrate with sale price logic: vendor sets a sale price that expires at a 
certain time and we show the timer until then. 
235 — A/B Testing & Optimization 
● Build functionality to run A/B tests for FOMO features (and possibly other UX 
elements). 
● E.g., randomly show FOMO badge to half of users and hide for half, measure 
difference in conversion. 
● Admin panel controls to enable/disable such experiments globally or by category. 
● Store experiment results (how many saw variant A vs B, and how many converted for 
each) for analysis. 
● Use these learnings to fine-tune when to use FOMO (the system might eventually 
auto-enable only if effective). 
(By implementing features 231–235, the platform now supports basic vendor-controlled 
FOMO as well as smart triggers to auto-enable it, analytics to measure impact, time-based 
urgency in promotions, and a system to experimentally verify its effectiveness.) 
Phase 7: B2B & Bulk Buying (236–245) 
236 — MOQ & Bulk Pricing 
● Add fields to Product for minimum order quantity (minOrderQty) and an array for 
wholesale pricing tiers (wholesalePricing[]). 
● These tiers might be structured like: [{ minQty:100, price: X }, { minQty:500, price: Y 
}, ...]. 
● UI: If user is a business buyer or buying large quantity, show these bulk discount tiers 
on the product page. 
● Only allow adding to cart if quantity >= minOrderQty when it’s set for that product. 
237 — Tiered Wholesale Catalog 
● Allow vendors to designate certain products as “wholesale-only” (not sold retail). 
Possibly separate section or flag. 
● Show pricing by tiers clearly (e.g., “Price: ₹100 each for 100-499 units, ₹90 each for 
500-999, ₹80 each for 1000+”). 
● If a normal buyer stumbles on these, maybe prompt them to switch to a business 
account (or at least inform MOQ). 
● Ensure the cart calculates total costs properly for large quantities (price breaks 
apply). 
238 — RFQ Request Submission 
● Implement a form for buyers to Request For Quote (RFQ) for bulk orders. 
● Path: maybe an API endpoint POST /v1/rfq (with fields: product or list of products, 
quantity, delivery location, needed-by date, etc.). 
● Store RFQ in DB linking interested buyer and potentially multiple vendor targets (or 
broadcast to vendors in category?). For now, maybe tie to one product’s vendor or 
category. 
● Notify relevant vendors or an admin to triage which vendors to forward RFQ to. 
239 — Vendor Quote Response 
● Provide vendors a way to respond to RFQs with a quote: price, minimum order, lead 
time, etc. 
● Possibly allow multiple vendors to respond to the same RFQ (so buyer can 
compare). 
● Build UI for buyer to see all quotes received for their RFQ and choose one, or 
negotiate further (counter-offer). 
● Keep track of negotiation messages or revisions (a simple thread under the RFQ). 
240 — B2B Buyer Accounts 
● Extend User model to mark accounts as “business” with additional fields (Company 
name, GSTIN, PAN for India, any other business details). 
● Provide a separate registration or upgrade flow for business accounts to collect this 
info. 
● Business accounts might get access to the bulk buying features (like viewing 
wholesale-only products, RFQ, etc.) that regular consumers might not. 
● Add a “Bulk Orders” or “B2B” section in buyer dashboard for these users. 
241 — GST-Compliant Business Invoicing 
● Modify invoice generation (from tax engine) to include buyer’s business details 
(GSTIN, company name) when a business account places an order. 
● Ensure invoice format meets Indian GST requirements (show tax breakup, GSTIN of 
seller and buyer, consecutive invoice number, etc.). 
● Possibly integrate with e-invoicing API (if thresholds apply) to auto-report the invoice 
to GSTN and get an IRN (Invoice Reference Number). This might be complex, but a 
stub could be in place. 
242 — Bulk Order Payment Terms 
● Support payment terms for bulk orders: e.g. 30% advance, 70% on delivery, or net 30 
credit for certain approved buyers. 
● Add fields in Order for payment terms, due dates, etc. 
● Possibly integrate with ledger: track outstanding balance for a buyer if they have 
credit terms (so they can order and pay later). 
● This will likely need admin approval for which buyers get credit and how much. 
243 — Bulk Logistics Integration 
● For bulk orders, integrate freight options (LTL – Less than Truckload, FTL – Full 
Truckload shipping). 
● Maybe connect to a freight service API or allow generating a freight request. At least, 
collect dimensions/weight if needed. 
● Provide option for palletized shipments in order details (maybe an extra field 
indicating pallets, etc.). 
● Ensure tracking and delivery confirmation works for these larger shipments (which 
might not have typical courier tracking). 
244 — B2B Analytics & Reports 
● Vendor dashboard: provide summary of their bulk sales (e.g., how much revenue 
from bulk vs retail, average bulk order size). 
● Admin: breakdown of B2B activity by region/industry. E.g., see which industries are 
most using bulk (maybe infer from product categories or buyer company type), 
region-wise volumes. 
● Provide export options for accounting teams to reconcile bulk order payments or for 
vendor to upload into their accounting system. 
245 — Seeds & Docs 
● Add default sample B2B products (maybe one with tiered pricing), and an example 
RFQ in dev seeds to illustrate usage. 
● Documentation: “How to use B2B mode” for both vendors and buyers, possibly as a 
guide or FAQ. 
● Provide training material for vendors (maybe a PDF or link in vendor app) explaining 
how to handle RFQs, set up bulk pricing, etc. 
Phase 8: Bot Protection & CAPTCHA (246–250) 
246 — Google reCAPTCHA v3 Integration 
● Enable bot detection on critical forms using reCAPTCHA v3 (invisible captcha 
scoring). 
● Add NEXT_PUBLIC_RECAPTCHA_SITE_KEY and RECAPTCHA_SECRET_KEY in .env 
and use them. 
● Front-end: load Google reCAPTCHA v3 script on pages like signup, etc., get a token 
on form submit. 
● Back-end: verify the token by calling Google’s API (with secret) before processing the 
request; only accept if score above threshold or if human. 
247 — hCaptcha Adapter (Fallback) 
● Implement a modular approach to CAPTCHA so we can switch between 
reCAPTCHA and hCaptcha easily via env (CAPTCHA_PROVIDER). 
● Abstract the captcha verification logic behind an interface that supports either Google 
or hCaptcha. 
● Use hCaptcha as an alternative to avoid Google dependency (especially if wanting 
no Google services). 
● Ensure minimal differences for front-end aside from script URLs and sitekey. 
248 — Auth & Signup Protection 
● Apply CAPTCHA checks on user registration (signup form) and perhaps login if 
repeated failures, plus password reset requests. 
● Also use it on vendor onboarding forms and Sathi onboarding forms, since those 
could be targeted by spam bots. 
● Ensure that if CAPTCHA verification fails or score is too low, the backend returns a 
4xx error and doesn’t proceed. 
● Keep metrics of failed vs passed captcha attempts for admin review. 
249 — Inquiry / Booking / RFQ Forms 
● Add CAPTCHA to product inquiry form (from chunk 018), service booking form (017), 
and the RFQ submission (238) as these can be spam targets. 
● Implement similarly: client gets token and sends with request, server verifies before 
queuing the email/job. 
● With RFQ, which might be more open (someone on site can send RFQ without login 
perhaps), definitely needed. 
● If verification fails, reject with message “Please verify you are not a robot” or similar. 
250 — Admin Anti-Spam Dashboard 
● Build an admin view to monitor spam-related metrics: 
○ Graph of CAPTCHA failures over time (to spot spikes maybe indicating 
attack). 
○ Table of top suspicious IPs (those that triggered many failures). 
○ Possibly allow exporting logs of these attempts for analysis or blocking at 
firewall level. 
● Keep data minimal (don’t store full form data of failures, just metadata like IP, 
timestamp, which endpoint). 
● Provide a way to clear or reset stats after review if needed. 
Phase 9: Advanced Security (251–260) 
251 — Web Application Firewall (WAF) Layer 
● Integrate a basic WAF at the application level (if not using an external one). 
● Middleware to detect common malicious patterns in requests: SQL injection attempts 
(' OR 1=1 patterns, etc.), XSS payloads (script tags), CSRF patterns (maybe check 
referer and origin on state-changing requests if not using same-site cookies). 
● Could set up Nginx or Cloudflare rules outside code too, but in-code provide some 
detection as backup. 
● If detected, block the request (return 403 or similar) and possibly log the incident. 
252 — Bot Fingerprinting & Mitigation 
● Use device/browser fingerprinting to better identify clients. 
● For example, generate a fingerprint hash using User-Agent, IP, and some browser 
properties (could embed a small JS to gather canvas fingerprint or other signals). 
● If fingerprint seems to match known headless browser patterns (very minimal, like 
missing certain APIs), then challenge or rate-limit them separately. 
● If a certain fingerprint makes too many requests (even with changing IPs), treat it as 
suspicious. 
253 — Device & Session Security 
● Bind user sessions or tokens to a device fingerprint; if a user’s token is used from a 
very different fingerprint, possibly alert or require re-auth (could be an indicator of 
token theft). 
● Send an email or notification if login from a new device or location occurs (allow user 
to verify it’s them). 
● Optionally, allow an additional OTP challenge for logins from unrecognized devices (if 
2FA not already enabled). 
254 — Vendor KYC Document Security 
● Enhance security for KYC docs (from chunk 184): 
○ Encrypt those files at rest using a strong key (maybe vendor’s id combined 
with server secret). 
○ When generating or viewing, add a visible watermark on documents (like “For 
NearbyBazaar use only - VendorID - Date”) to discourage misuse. 
○ Use OCR or other checks to detect obvious forgeries (e.g. check that text 
fields like PAN/GST match the values vendor entered, using an OCR library). 
255 — Financial Fraud Detection Engine 
● Add checks on financial transactions: 
○ Monitor if a vendor suddenly issues a lot of refunds or if multiple refund 
requests come from same buyer (could indicate fraud patterns). 
○ Maintain a blacklist database of known fraudulent UPI IDs or bank IFSC 
codes (if any reported). 
○ If a payout to a vendor is suspicious (e.g., much larger than their average or 
after a spike in disputes), automatically hold it for admin review. 
256 — Buyer Payment Protection 
● Identify buyers who might be abusing the system (like doing COD orders and 
refusing, or using stolen cards that lead to chargebacks). 
○ Keep a risk score per buyer based on chargebacks, failed payments, dispute 
history. 
○ If a buyer’s risk score passes a threshold, require only secure payment 
methods (no COD, or maybe require additional verification). 
● Extend escrow from chunk 207: if a buyer is high-risk, maybe hold their funds until 
delivery confirmation even for items that normally wouldn’t, or mandate prepayment. 
257 — API Abuse Protection 
● Implement API keys or app identifiers for integrations (like ERP or shipping 
connectors, or mobile app usage) instead of only relying on user tokens. 
● Allow rotating these keys (with expiration) and enforce per-app rate limits and 
scopes. 
● E.g., ERP integration uses a client credentials token that only has scope to fetch 
orders and update inventory, nothing else. 
● Sign all internal service calls with HMAC as well (for webhooks and such, some 
already done in chunk 128). 
258 — Attribute-Based Access Control (ABAC) 
● Extend the RBAC system with attributes for context-based permissions. 
● Example scenario given: Admin can export vendor PII only if they have OTP’d within 
last X minutes or are in office IP range. 
● Implement a policy engine that considers user role + environmental attributes (time of 
day, IP address, device trust level, etc.). 
● Possibly integrate with the 2FA: if an admin tries a sensitive action, require an OTP 
(so attribute “otpVerified=true” for that session to allow PII export). 
259 — SIEM & Threat Monitoring 
● Set up a pipeline to send logs to a Security Information and Event Management 
system (could be an external service or self-hosted ELK stack). 
● Analyze logs for anomalies: too many failed logins, unusual traffic surges, etc. 
● Configure alerts (email/Slack/WhatsApp) for certain patterns: e.g., more than X 500 
errors in a minute, or repeated admin login failures, etc. 
● Possibly integrate a third-party monitoring service or just build simple alert triggers. 
260 — Disaster Recovery Security 
● Ensure backup files (from chunk 192) are stored in a secure, tamper-proof way (like 
append-only storage or offsite with write-once). 
● Implement geo-replication: e.g., have backups or even live replica of DB in another 
data center or cloud region to guard against region-wide outage. 
● Conduct simulated disaster recovery drills: test restoring the database from backup, 
test failing over to replica, etc., and document how long it takes (RTO) and how much 
data was lost (RPO). 
● Use these drills to improve processes and update OPS.md with the results and 
refined procedures. 
Phase 10: Enterprise Expansion (261–270) 
261 — Recommendation Engine (Core ML) 
● Expand on the earlier recommendation engine with a more advanced machine 
learning model. 
● Collect detailed buyer activity (views, add to cart, purchases, wishlist adds) and train 
a collaborative filtering model (e.g., matrix factorization or use an ML service). 
● Provide an API endpoint /v1/recommendations/:userId that returns “You may also 
like” suggestions leveraging this model. 
● Possibly periodically re-train as data grows, or do near-real-time updates with 
incremental algorithms. 
262 — Recommendation Variants 
● Add additional recommendation types beyond user-personalized: 
○ “Frequently Bought Together” suggestions on product pages (based on 
cart/order data). 
○ “Customers also viewed” on product pages (based on browse data similarity). 
● Ensure multi-lingual support in recommendations (if describing rec categories, etc.). 
● A/B test different recommendation algorithms or placements to see which yields 
better engagement. 
263 — Recommendation Dashboard 
● Provide vendors with visibility into recommendation performance: e.g., see which of 
their products are frequently recommended and the resulting CTR or sales. 
● Admin dashboard to see overall CTR uplift from recommendations. 
● Show results of any A/B tests run on recommendations (if we try different algorithms, 
display which had better performance). 
264 — Marketplace Reputation Metrics 
● Compute key seller performance metrics: 
○ Order Defect Rate (ODR): percentage of orders with a serious issue (like 
refund, return, dispute) in a period. 
○ Late Shipment Rate: percentage of orders shipped after expected dispatch 
time. 
○ Cancellation Rate: vendor-initiated cancellations or out-of-stock cancellations 
ratio. 
● Show these metrics in vendor portal as part of a performance scorecard so vendors 
can improve. 
● Possibly make some metrics or threshold public (or used internally to decide 
marketplace actions like warnings or suspension). 
265 — Vendor Suspension & Escalation Engine 
● Implement an automated system to handle underperforming vendors. 
○ Set threshold rules e.g., ODR > 1% triggers a warning; if it remains high or 
goes higher, auto-temporary suspend new orders for that vendor; beyond a 
point, escalate to permanent block. 
● Ensure any auto action logs an audit and sends a notice to vendor and admin. 
● Provide admin override capabilities with reasoning (maybe an admin can postpone 
suspension if vendor promises changes, etc. but log that decision). 
266 — Sponsored Listings (Ads Base) 
● Introduce a basic sponsored ads system where vendors can pay to boost their 
product visibility. 
● Allow vendors to create ad campaigns for certain products, choosing CPC 
(cost-per-click) or CPM (cost per 1000 impressions). 
● Build an auction mechanism for search results or category pages: highest bidder for 
relevant keywords gets top slot with “Sponsored” label. 
● Track clicks from these positions to charge the vendor’s wallet. 
267 — Ad Management Dashboard 
● Vendor-facing: interface to create campaigns (select products, set daily budget, bid 
amount) and view stats (impressions, clicks, CTR, cost). 
● Admin-facing: overview of ad revenue being generated, and tools to detect any 
abuse (e.g., misleading ads). 
● Key metrics: total impressions of ads, total clicks, overall CTR and revenue from the 
ad system. 
268 — Returns Management (RMA) 
● Build out the return management system started in stub (145): 
○ Allow buyers to initiate a return from their order details within a set return 
window. 
○ Generate a return merchandise authorization (RMA) number and instructions 
(like shipping label if integrated). 
○ Provide vendor a UI to approve or reject return requests (with reason). 
○ On approval, integrate with courier pickup (as done in Reverse Logistics 
chunk) to get item back. 
● Ensure refunds are tied to these returns (from earlier refund logic). 
269 — Warranty Management 
● Add support for warranty information on products. 
○ Let vendors specify warranty period (e.g., 1 year manufacturer warranty). 
○ Enable vendors to upload warranty documents or terms. 
● Buyers can see warranty status in their order history for applicable products, and 
maybe initiate warranty claims if needed (not same as returns, might link to service 
centers). 
● Possibly not fully automate claims, but at least track warranty durations and remind 
buyers when warranty is about to lapse. 
270 — Instant Refund System 
● To improve customer experience, implement instant refunds to NB wallet or UPI for 
eligible cases. 
○ If return is scanned by courier (i.e., we have confirmation item is on the way 
back), immediately credit buyer’s NearbyBazaar wallet or original payment 
method if supported (UPI might support instant refund via API). 
○ Adjust commission and taxes immediately as well (so vendor ledger knows 
commission reversed, etc.). 
● Notify buyer and vendor when refund is processed. 
● This requires confidence in logistics + maybe limiting to certain categories or trusted 
buyers to avoid abuse (could tie into risk scores: low-risk scenarios get instant 
refund). 
Phase 11: Extension Features (271–280) 
271 — Product/Service/Property Comparison Engine 
● Implement feature for users to compare multiple listings side by side. Could be for 
products, services, or even properties if relevant. 
● Provide UI to add items to a “compare tray” and then see a comparison table of 
features. For products, compare specs; for services, compare features/duration; if we 
extended to real estate (just guessing from “Property” word) compare attributes. 
● Use AI to highlight differences or generate a summary of differences in multiple 
languages. E.g., “Product A has 4GB RAM whereas Product B has 8GB RAM.” 
● Mark up the comparison with schema.org if possible for SEO (ProductComparison). 
272 — Referral System (Buyers & Sellers) 
● Launch a referral program for both buyers and sellers: 
○ Buyers get a unique code or link; new users who sign up with it give referrer 
some credit (post first purchase maybe). 
○ Similarly, sellers (vendors) could refer other vendors to the platform and get 
benefits if they join and succeed (like lower commission for some period, 
etc.). 
● Track usage of referral codes and credit accounts appropriately, with checks to 
prevent self-referral or other gaming (fraud detection from earlier could help). 
273 — Loyalty & Reward Points 
● Expand on the loyalty program: 
○ Buyers earn points on each order (perhaps 1 point per ₹100 spent or vendor 
can sponsor extra points on certain items). 
○ Points can be redeemed at checkout (with conversion like 1 point = ₹1 or 
such), possibly with rules on max redemption per order. 
○ Determine whether points are funded by platform (reducing commission 
effectively) or by vendors (like discount) or combination. Possibly allow 
vendors to buy points to give as promo. 
● Show points balance in user profile and an option at checkout to apply points. 
274 — Blog + AI Blog Generator 
● Add a blog section (perhaps for SEO content marketing, or community engagement). 
○ Provide a CMS-like interface to create blog posts under /blog. 
○ Integrate an AI assistance tool for drafting posts: e.g., admin types a prompt 
or bullet points, and an AI model generates a draft that they can edit. 
● Ensure blog posts have SEO tags, open graph data, etc. 
● Possibly auto-generate meta descriptions or tags using AI as well. 
275 — Wallet Features 
● Introduce a NearbyBazaar wallet for buyers (and possibly vendors for payouts). 
○ Buyers can add money via UPI/PhonePe to their wallet (making future small 
purchases easier, or to get refunds faster). 
○ Allow withdrawal from wallet to bank/UPI if they have excess (subject to KYC 
maybe, to avoid misuse of being a quasi-bank). 
○ Auto-credit refunds to wallet by default for speed, but allow withdrawal if 
needed. 
○ Admin panel to adjust wallet balances (e.g., add goodwill credits or remove if 
needed with logs). 
276 — Custom/Partial Payments 
● Allow vendors to create custom payment links for bespoke orders or partial 
payments. 
○ E.g., for a big B2B order, vendor can generate a link for 30% advance 
amount. 
○ Link should tie to an order or invoice context and allow buyer to pay that 
specific amount. 
○ Track partial vs remaining payment in the ledger; ensure order only moves to 
confirmed after all required parts are paid. 
● Useful for services where maybe cost is finalized after some process or for allowing a 
deposit. 
277 — Buyer Behavior Recommendation System 
● Add script to log fine-grained buyer behaviors: search terms, product views, adds to 
wishlist/cart, time spent, etc. 
○ Possibly done via a tracking script on web (with consent). 
○ Build out a service to analyze these events for patterns (like frequent views 
but no purchase could trigger a coupon offer). 
● Use this data to feed a more advanced personalized recommendation or retargeting 
(maybe show personalized deals on homepage for returning user based on browsing 
history). 
278 — Full Multilingual Support 
● Extend earlier i18n: aim to translate all UI and maybe product content. 
○ Ensure every page and component supports an alternate language fully (not 
just a toggle stub). 
○ Possibly integrate an AI translation service for user-generated content 
fallback (like product descriptions in Hindi if vendor only wrote English, use a 
translation API to show Hindi version to Hindi locale users, with a notice it’s 
translated). 
○ Persist language selection for users and apply to all content including SEO 
tags. 
279 — Vendor UPI QR Checkout Toggle 
● Allow vendors to optionally accept direct UPI QR payments for their store (outside 
the platform’s online gateway). 
○ For example, on checkout, if vendor has provided their own UPI QR code or 
VPA, the buyer can choose to pay offline by scanning that QR. 
○ The system would then either trust the vendor to confirm or use some UPI 
collect request mechanism. 
● Include audit: if vendor handles payment offline, platform needs record (especially for 
commission calculation, maybe treat as COD in commission sense). 
● Admin oversight: if enabled globally or per vendor, ensure terms are agreed (since 
platform might lose tracking of payment status, it’s a risk). 
280 — FinNbiz Integration Gateway 
● FinNbiz might be some fintech or accounting system – implement joint features: 
○ Shared API endpoints so FinNbiz can pull orders or push invoices maybe. 
○ Webhooks for order creation or payment events to sync with FinNbiz. 
○ Possibly a unified dashboard if FinNbiz is another product (maybe the 
company’s fintech tool). 
● Essentially ensure NearbyBazaar can send and receive data from FinNbiz 
seamlessly for things like invoice automation (order in NB triggers invoice in FinNbiz), 
keeping in mind security (like OAuth scopes from earlier). 
Phase 12: OAuth2 + Role-Based Security (281–285) 
281 — OAuth2 Authorization Server 
● Implement an OAuth2 server for the platform if external clients or integrations need to 
use APIs. 
○ Support client credentials flow for service-to-service integration, and possibly 
auth code flow for user third-party apps in future. 
○ Create endpoints: /oauth/authorize, /oauth/token, /oauth/revoke etc., or 
simplify with just token endpoint for client credentials if that’s primary need. 
○ Store client_id and client_secret for trusted clients (like FinNbiz integration or 
mobile app) in the database. 
282 — Role & Scope Mapping 
● Map our roles (admin, vendor, buyer, sathi, erp etc.) and specific scopes 
(permissions) to the OAuth tokens. 
○ For example, an admin user logging in via OAuth could get scopes 
[orders.read, users.write, etc.] while a vendor gets maybe [orders.read, 
products.write] etc. 
○ Client credentials tokens might have fixed scopes defined at client registration 
(e.g., ERP client gets inventory.read, orders.write for updates). 
○ Define these scopes in a config or model and attach to tokens on issue. 
283 — Token Validation Middleware 
● Enhance the Express auth middleware to handle OAuth2 Bearer tokens (in addition 
to our JWT if separate). Possibly unify if our JWT is already used as Bearer tokens. 
○ When a token comes in Authorization header, check if it’s our JWT (then 
proceed as before for user), or if it’s an OAuth access token (could be JWT or 
a reference token if we choose). 
○ Check signature and expiry, then check that required scopes for the endpoint 
are present (we might annotate routes with required scopes). 
○ Return 401 or 403 appropriately if token invalid or scopes missing. 
284 — Refresh & Revoke Flow 
● Implement refresh token issuance and rotation. 
○ When issuing access token, if applicable, also issue a refresh token (longer 
expiry, stored in Redis as per earlier system). 
○ /auth/refresh endpoint to exchange a valid refresh token for a new access 
token (and possibly new refresh token, invalidating the old one to prevent 
reuse). 
○ /auth/revoke to allow clients or users to revoke a token (which would delete it 
from store so it can’t be used, e.g., on logout or if device lost). 
○ Log these events to audit to have trail of all token issues and revokes. 
285 — ERP/FinNbiz Secure Integration 
● Migrate any existing integration points to use OAuth2 flows instead of static API keys. 
○ The ERP connector (from phase 11) should use a client credentials token to 
call our APIs instead of a hardcoded key, meaning register an “ERP” client 
with limited scopes. 
○ Same for FinNbiz integration: use OAuth2 client credentials or authorization 
code if FinNbiz is an external user-facing integration requiring user 
permission. 
○ Update webhook verification perhaps to include checking a token if FinNbiz 
calls our webhooks (or sign it as per chunk 128). 
○ In summary, replace less secure auth methods with proper OAuth tokens and 
scope enforcement for these integrations. 
(With Phase 12, the platform can securely expose APIs to third parties and internal services 
using OAuth2, with fine-grained scope control, making integrations like ERP and FinNbiz 
both more secure and easier to manage.) 
Phase 13: Advanced AdTech, FinTech & Community 
(286–300) 
AdTech Sophistication (286–290) 
286 — Ad Exchange (DSP Base) 
● Lay the foundation for a Demand-Side Platform where vendors (advertisers) bid in 
real-time for ad placements. 
● Implement a basic real-time bidding engine: when a page is loaded (impression 
opportunity), evaluate bids from active campaigns and select a winner. (This might be 
simplified due to scale, possibly just allocate impressions based on preset bids rather 
than true RTB initially.) 
● Structure the system to be extensible for real RTB if needed. For now, ensure we can 
handle CPC/CPM logic: e.g., if CPM bidding, convert to e.g. cost per impression and 
rotate accordingly. 
287 — Audience Targeting Engine 
● Allow ads to be targeted to specific buyer segments: by location, behavior, 
demographics if known. 
● Categorize buyers into segments (could use behavior data from earlier phases, e.g., 
frequent electronics shoppers, or location by city). 
● In the campaign creation, let vendors choose target audience characteristics (which 
we can map to segment IDs internally). 
● Only serve ads to users matching those segments. This implies tracking those 
attributes for users in their profile or session. 
288 — Retargeting System 
● Implement retargeting: track when a user views a product but doesn’t buy, so we can 
later show them ads for that product or similar. 
● Could be on-site retargeting (e.g., recommended section “You viewed X, you might 
still want it”) or off-site (if doing email/WhatsApp push, but that might be separate). 
For now likely on-site and maybe email. 
● Build a simple rule: if product viewed but not purchased in X days, include in a 
retargeting list. 
● Show those as ads on homepage or sidebar when user returns, or send an 
automated “still interested in this product?” email/notification. 
289 — Video & Rich Media Ads 
● Support uploading video ads or rich media (HTML5) ads by vendors for their 
campaigns. 
● This requires handling video hosting or embed (maybe via a link or integrate with 
YouTube unlisted if we want to offload hosting). 
● Modify product pages or certain ad slots to play these video ads (like a vendor’s 
product video in a carousel or a dedicated ad spot). 
● Make videos shoppable: overlay a link or button to the product in the video or the 
vendor’s store. 
● Ensure these don’t slow page loads too much; use lazy loading. 
290 — Ad Analytics Dashboard 
● Provide deeper analytics for ads: 
○ Vendors can see breakdown by ad creative (which of their ads got what CTR, 
conversion, ROI). 
○ Possibly measure not just clicks but resulting orders (if we can attribute that, 
e.g., if user clicked ad for product A and then purchased it or something else, 
track that). 
○ Admin sees overall ad revenue, top advertisers, and can identify if any 
category is saturating with ads or any suspicious patterns (like click fraud if 
any). 
● Visualize trends over time so advertisers can adjust campaigns. 
FinTech Layer (291–295) 
291 — Buyer BNPL / EMI System 
● Integrate a Buy Now Pay Later option or EMI installments for buyers at checkout. 
○ Possibly partner with a BNPL provider (like LazyPay, Simpl in India or an 
integration via PhonePe or Razorpay if they offer BNPL). 
○ Offer an option on payment screen: “Pay Later in 3/6/12 months”. On 
selection, engage BNPL API to do credit check, etc. 
○ If approved, order goes through, but platform likely gets paid by BNPL 
provider and buyer owes them. Needs proper integration and possibly 
regulatory compliance (like showing interest, etc.). 
292 — Seller Financing Module 
● Provide a portal for vendors to apply for loans (working capital loans using their sales 
history as creditworthiness). 
○ Possibly integrate with an NBFC (Non-banking financial company) or bank’s 
API to submit loan applications with vendor’s data. 
○ Show a form for vendors to request X amount, send relevant financial data 
(sales, growth, etc.) to partner for scoring. 
○ Track status of application (pending, approved, rejected) in vendor 
dashboard. 
293 — Credit Ledger 
● Maintain a ledger of credit given to buyers (if BNPL is platform-run or if we allow 
purchase on credit directly) and to sellers (loans). 
○ Track outstanding amounts, due dates, interest if any. 
○ Deduct repayments either via auto-debit (for buyers using UPI e-mandates) or 
from vendor’s future payouts for seller loans. 
○ Ensure transparency: vendor can see how much of their payout will be 
deducted for loan repayment, buyer can see remaining BNPL installments. 
294 — EMI/Loan Compliance Hooks 
● Ensure EMI invoices are GST compliant (interest portion vs principal separation if 
needed, etc.). Might need to generate monthly statements for buyers on EMI. 
○ If RBI e-mandate for auto-debit of recurring payments: integrate setting up an 
e-mandate for buyer’s UPI or card so installments auto-pay. 
○ Implement hooks for success/failure of auto-debits: if fail, notify buyer and 
possibly block new orders until payment made. 
○ Keep a log for regulatory compliance with loans (like KYC info of borrower, 
schedule of payments, etc.). 
295 — FinTech Dashboard 
● Vendor view: a page showing their credit limit (how much loan or credit is available to 
them, used vs remaining), repayment schedule, any overdue. 
○ Perhaps link with their sales to show how much could be eligible for financing. 
● Admin view: overview of all disbursed loans, their repayment status, defaults risk 
indicators (like if a vendor’s sales drop while they have a loan, flag risk). 
○ Also integrate with risk engine to maybe stop offering credit to those flagged 
by fraud checks. 
● Possibly graphs of credit usage vs recovery, and potential earnings from interest if 
platform or partner takes interest. 
Community / Social Commerce (296–300) 
296 — Buyer–Seller Q&A / Forums 
● On product pages, enable a Q&A section where buyers can ask questions and 
sellers or previous buyers can answer. 
○ E.g., “Does this come with a charger?” and vendor or others respond. 
● Also possibly a general forum or community board for discussions (maybe by 
category: electronics forum, fashion forum). 
● Moderate content (some integration with moderation from earlier should apply – 
spam, offensive content filtering). 
297 — Group Buying Deals 
● Allow buyers to form a group to buy an item in bulk for a discount. 
○ For example, a deal is listed: “Need 5 buyers to unlock price ₹X each, 3 
joined so far”. 
○ Buyers join (commit to buy). If threshold reached within time limit, order goes 
through for all at discounted price; if not, order cancels (and no one is 
charged or they get refund). 
● Vendors can create these deals to spur sales for new products or clearance. 
● Manage partial payments or holds on buyer’s payment method until deal closes. 
298 — Follow & Wishlist Notifications 
● Add ability for buyers to “follow” a vendor or product. 
○ Following a vendor means they get notified when that vendor launches new 
products or posts an update. 
○ Following a specific product (or adding to wishlist) means notifications for 
price drops, back in stock, or new offers on that product. 
● Implement notifications: could be email, push, or in-app feed, telling user e.g., 
“Product X on your wishlist is now ₹200 off!” or “Vendor Y you follow just added a 
new service.” 
299 — Live Video Shopping 
● Expand live commerce: allow not just one-way video from vendor but buyers to 
directly purchase products shown in the live stream. 
○ Integrate with cart: when vendor highlights a product in stream, an “Add to 
Cart” button appears for viewers. 
○ Enable chat moderation tools (maybe assign a staff or use a simple filter for 
bad words in chat). 
○ Archive live sessions as shoppable videos that can be replayed with the 
product links still active. 
300 — Community Trust Badges 
● Introduce badges earned through community participation and trust: 
○ E.g., a seller gets “Top Seller in CityName” if they have highest sales or best 
rating in that city. 
○ A badge like “Trusted by 500 buyers” if they have over 500 distinct customers 
with positive feedback. 
○ Buyers could have badges like “Community Helper” if they answer questions 
or “Verified Buyer” if they purchased certain categories (just ideas). 
● Display these badges on profiles and possibly next to names in Q&A or reviews for 
credibility. 
● Base badges on objective criteria (sales count, review ratings, etc.) and update 
periodically. 
Extra Chunks for NearbyBazaar (301–315) 
These chunks extend the roadmap. Each chunk has Objective, Paths, Tech, Deps, 
Tests/Mig/Env, Agent and where relevant, actual starter code is included. --- 
Phase 10: CI/CD & Security (301–307) 
301 — CI/CD Pipeline Setup

Objective: Add GitHub Actions pipeline for lint, build, test.

Paths: .github/workflows/ci.yml

Tech: GitHub Actions, pnpm caching

Deps: none

Tests/Mig/Env: Run pnpm -w build, pnpm -w lint, pnpm -w test in matrix (Node 18, 20)

Agent: Block PR merges unless pipeline passes

# .github/workflows/ci.yml

name: CI
on: [push, pull_request]
jobs:
build:
runs-on: ubuntu-latest
strategy:
matrix:
node-version: [18.x, 20.x]
steps: - uses: actions/checkout@v3 - uses: actions/setup-node@v3
with:
node-version: ${{ matrix.node-version }} - run: npm install -g pnpm - run: pnpm install --frozen-lockfile - run: pnpm -w lint - run: pnpm -w build - run: pnpm -w test

302 — Secrets Management

Objective: Centralize secrets handling

Paths: apps/api/src/utils/secrets.ts

Tech: dotenv-safe

Deps: pnpm add dotenv-safe -w

Tests/Mig/Env: Fail startup if required keys missing

Agent: Document in .env.example

// apps/api/src/utils/secrets.ts
import dotenvSafe from 'dotenv-safe';
dotenvSafe.config({
example: '.env.example',
});
export const getEnv = (key: string): string => {
const val = process.env[key];
if (!val) throw new Error(`Missing env var: ${key}`);
return val;
};
303 — Security Middleware
Objective: Add OWASP protections
Paths: apps/api/src/middleware/security.ts
Tech: helmet, cors, express-rate-limit, csurf
Deps: pnpm add helmet cors express-rate-limit csurf -w
Tests/Mig/Env: Simulate CSRF, check headers
Agent: Apply globally in app.ts
// apps/api/src/middleware/security.ts
import helmet from 'helmet';
import cors from 'cors';
import csrf from 'csurf';
import rateLimit from 'express-rate-limit';
import { Express } from 'express';
export const applySecurity = (app: Express) => {
app.use(helmet());
app.use(cors({ origin: '_' }));
app.use(rateLimit({ windowMs: 15 _ 60 \* 1000, max: 100 }));
app.use(csrf());
};
304 — Input Sanitization
Objective: Sanitize input before DB
Paths: apps/api/src/middleware/sanitize.ts

Tech: validator.js

Deps: pnpm add validator -w

Tests/Mig/Env: Test XSS payload rejection

Agent: Attach middleware to all routes

// apps/api/src/middleware/sanitize.ts
import { sanitize } from 'validator';
import { Request, Response, NextFunction } from 'express';

export function sanitizeInput(req: Request, \_res: Response, next: NextFunction) {
for (const key in req.body) {
if (typeof req.body[key] === 'string') {
req.body[key] = sanitize(req.body[key]);
}
}
next();
}

305 — Audit Trail Hardening

Objective: Immutable audit log chain

Paths: apps/api/src/models/AuditLog.ts

Tech: SHA-256 chaining

Deps: crypto (built-in)

Tests/Mig/Env: Tamper test

Agent: Store hash pointers

// apps/api/src/models/AuditLog.ts
import { Schema, model } from 'mongoose';
import crypto from 'crypto';

const auditSchema = new Schema({
user: String,
action: String,
prevHash: String,
hash: String,
timestamp: { type: Date, default: Date.now },
});
auditSchema.pre('save', function (next) {
const str = `${this.user}-${this.action}-${this.prevHash}-${this.timestamp}`;
this.hash = crypto.createHash('sha256').update(str).digest('hex');
next();
});
export const AuditLog = model('AuditLog', auditSchema);
306 — Advanced Payment Flows
Objective: Escrow + disputes
Paths: apps/api/src/services/payments/escrow.ts
Tech: Escrow states in DB
Deps: none
Tests/Mig/Env: Simulate late refund
Agent: Admin can release/refund
// apps/api/src/services/payments/escrow.ts
export type EscrowState = 'HELD' | 'RELEASED' | 'REFUNDED';
export interface EscrowRecord {
orderId: string;
amount: number;
state: EscrowState;
}
export const createEscrow = (orderId: string, amount: number): EscrowRecord => ({
orderId,
amount,
state: 'HELD',
});
307 — Refund Engine
Objective: Partial refunds + commission rollback
Paths: apps/api/src/services/payments/refund.ts
Tech: Refund logic with adjustments
Deps: none
Tests/Mig/Env: Multiple refunds
Agent: Connect with commission service
// apps/api/src/services/payments/refund.ts
export const calculateRefund = (orderTotal: number, refundAmount: number) => {
if (refundAmount > orderTotal) throw new Error('Refund exceeds total');
return orderTotal - refundAmount;
}; ---
Phase 11: Ops & Vendor Compliance (308–312)
308 — Dispute Management
Objective: Vendor–customer disputes
Paths: apps/api/src/models/Dispute.ts, apps/admin/pages/disputes.tsx
Tech: Mongoose model + Admin UI
Deps: none
Tests/Mig/Env: Status transitions
Agent: Email alerts on open/close
309 — Vendor KYC Automation
Objective: PAN/Aadhaar/GST checks
Paths: apps/api/src/services/kyc.ts, apps/vendor/pages/kyc.tsx
Tech: External API stub
Deps: axios
Tests/Mig/Env: Mock API
Agent: Store KYC status in Vendor
310 — Enhanced Logging & Monitoring
Objective: Structured logs
Paths: apps/api/src/utils/logger.ts
Tech: pino
Deps: pnpm add pino -w
Tests/Mig/Env: Simulate error trace
Agent: JSON logs for ELK
// apps/api/src/utils/logger.ts
import pino from 'pino';
export const logger = pino({
level: process.env.LOG_LEVEL || 'info',
});
311 — Rate-Limit Global
Objective: Apply global limits
Paths: apps/api/src/middleware/rateLimitGlobal.ts
Tech: express-rate-limit + Redis
Deps: rate-limit-redis
Tests/Mig/Env: Stress test
Agent: Configurable via env
312 — E2E Secure Testing
Objective: Security regression tests
Paths: apps/web/tests/security.spec.ts
Tech: Playwright
Deps: @playwright/test
Tests/Mig/Env: Simulate attacks
Agent: Run nightly in CI ---
Phase 12: Release & Recovery (313–315)
313 — CI Release Pipeline
Objective: Auto deploy web + API
Paths: .github/workflows/release.yml
Tech: GitHub Actions + Netlify CLI
Deps: netlify-cli
Tests/Mig/Env: Deploy on main
Agent: Add badge in README
314 — Backup & Recovery
Objective: Automated DB backups
Paths: scripts/backup.ts, scripts/restore.ts
Tech: mongodump
Deps: none
Tests/Mig/Env: Restore from backup
Agent: Encrypt backups
315 — Final Docs & Checklist
Objective: Consolidated production notes
Paths: docs/PRODUCTION.md
Tech: Markdown
Deps: none
Tests/Mig/Env: N/A
Agent: Include infra, monitoring, security, backups
