# NearbyBazaar - Vercel Deployment Guide

## Overview

This guide explains how to deploy the NearbyBazaar web application from this monorepo to Vercel.

## Why Vercel Instead of Netlify?

The NearbyBazaar web app uses **Server-Side Rendering (SSR)** with `getServerSideProps` in multiple pages:

- `/c/[slug]` - Category pages
- `/p/[slug]` - Product pages
- `/s/[slug]` - Service pages
- `/sitemap.xml` - Dynamic sitemap
- `/store/[slug]` - Vendor store pages

**Static export (`output: 'export'`) does NOT support SSR**, which is why Netlify deployment fails. Vercel natively supports Next.js SSR and is the recommended hosting platform.

## Prerequisites

- GitHub repository: https://github.com/prashant183351/NEARBYBAZAAR
- Vercel account: https://vercel.com
- PR #3 merged (adds `vercel.json` configuration)

## Configuration Files

### `vercel.json` (Root Level)

```json
{
  "version": 2,
  "buildCommand": "pnpm install && pnpm --filter @nearbybazaar/web build",
  "devCommand": "pnpm --filter @nearbybazaar/web dev",
  "installCommand": "pnpm install",
  "framework": "nextjs",
  "outputDirectory": "apps/web/.next",
  "ignoreCommand": "git diff --quiet HEAD^ HEAD ./apps/web"
}
```

**Key Settings:**

- `buildCommand`: Builds only the web app using pnpm workspace filtering
- `ignoreCommand`: Only triggers deployment when `apps/web` directory changes
- `outputDirectory`: Points to Next.js build output in monorepo subdirectory

## Deployment Steps

### Step 1: Merge PR

Merge PR #3 to add the Vercel configuration:

```
https://github.com/prashant183351/NEARBYBAZAAR/pull/3
```

### Step 2: Create Vercel Project

1. **Go to Vercel Dashboard:**
   https://vercel.com/prashants-projects-c217e0c2

2. **Import Repository:**
   - Click "Add New..." → "Project"
   - Select `NEARBYBAZAAR` repository
   - Click "Import"

3. **Configure Project Settings:**

   | Setting          | Value                                                   |
   | ---------------- | ------------------------------------------------------- |
   | Project Name     | `nearbybazaar-web` (or your choice)                     |
   | Framework Preset | Next.js                                                 |
   | Root Directory   | `apps/web` ⚠️ **CRITICAL**                              |
   | Build Command    | `pnpm install && pnpm --filter @nearbybazaar/web build` |
   | Output Directory | `.next`                                                 |
   | Install Command  | `pnpm install`                                          |

4. **Add Environment Variables:**

   Go to Settings → Environment Variables and add:

   ```bash
   # API Configuration
   NEXT_PUBLIC_API_URL=https://your-api-url.com

   # Database
   MONGODB_URI=mongodb+srv://...

   # Authentication
   JWT_SECRET=your-jwt-secret
   NEXTAUTH_URL=https://your-domain.com
   NEXTAUTH_SECRET=your-nextauth-secret

   # Payment Gateway
   PHONEPE_MERCHANT_ID=your-merchant-id
   PHONEPE_API_KEY=your-api-key

   # Media Upload
   CLOUDINARY_CLOUD_NAME=your-cloud-name
   CLOUDINARY_API_KEY=your-api-key
   CLOUDINARY_API_SECRET=your-api-secret

   # Email Service
   BREVO_API_KEY=your-brevo-key

   # Other variables as needed
   NODE_ENV=production
   ```

   **Note:** Get these values from your `.env.example` file or existing setup.

5. **Deploy:**
   - Click "Deploy"
   - Wait 2-5 minutes for first deployment
   - Check build logs for any errors

### Step 3: Verify Deployment

After successful deployment:

1. **Check Build Output:**

   ```
   ✓ Collecting page data
   ✓ Generating static pages (14/14)
   ✓ Finalizing page optimization
   ```

2. **Test Preview URL:**
   - Visit the Vercel preview URL (e.g., `https://nearbybazaar-web-xxx.vercel.app`)
   - Test all dynamic routes:
     - Homepage: `/`
     - Products: `/products`
     - Services: `/services`
     - Category: `/c/electronics`
     - Product Detail: `/p/some-product`
     - Service Detail: `/s/some-service`
     - Store: `/store/some-vendor`

3. **Verify SSR:**
   - View page source (Ctrl+U)
   - Confirm HTML contains server-rendered data (not just loading spinners)

## Alternative: Update Existing Project

If you have an existing Vercel project (e.g., `nearbybazaar-complite`):

1. Go to project Settings → General
2. Update **Root Directory** from `apps/admin` to `apps/web`
3. Update **Build Command** to `pnpm install && pnpm --filter @nearbybazaar/web build`
4. Go to Deployments → Redeploy from `master` branch

## Monorepo Considerations

### Deployment Triggers

The `ignoreCommand` in `vercel.json` ensures deployments only trigger when `apps/web` changes:

```bash
"ignoreCommand": "git diff --quiet HEAD^ HEAD ./apps/web"
```

**This means:**

- ✅ Changes in `apps/web` → Triggers deployment
- ❌ Changes in `apps/api` → No deployment
- ❌ Changes in `apps/vendor` → No deployment
- ❌ Changes in `apps/admin` → No deployment

**Exception:** Changes in shared `packages/*` may require manual deployment trigger.

### Workspace Dependencies

The build command correctly resolves monorepo dependencies:

```bash
pnpm install && pnpm --filter @nearbybazaar/web build
```

This ensures:

- `@nearbybazaar/ui` package is built and available
- `@nearbybazaar/lib` package is built and available
- Next.js `transpilePackages` config handles the rest

## Production Setup

### 1. Custom Domain

1. Go to Settings → Domains
2. Add your domain (e.g., `www.nearbybazaar.in`)
3. Update DNS records as instructed
4. Wait for SSL certificate provisioning (automatic)

### 2. Production Branch

1. Settings → Git → Production Branch
2. Set to `master` or `main`
3. All pushes to this branch will deploy to production

### 3. Preview Deployments

- Every PR automatically gets a preview deployment
- URL format: `https://nearbybazaar-web-git-branch-name-xxx.vercel.app`
- Perfect for testing before merge

### 4. Enable Analytics

1. Settings → Analytics
2. Enable Vercel Analytics (optional but recommended)
3. View performance metrics in dashboard

## Troubleshooting

### Build Fails: "Module not found"

**Cause:** Root directory not set correctly

**Fix:**

1. Settings → General → Root Directory
2. Set to `apps/web`
3. Redeploy

### Build Fails: "Workspace not found"

**Cause:** pnpm workspaces not configured

**Fix:**

1. Verify `pnpm-workspace.yaml` exists in root
2. Verify build command includes `pnpm install`
3. Check `package.json` has correct workspace paths

### Pages Not Rendering (SSR Issues)

**Cause:** Environment variables missing

**Fix:**

1. Settings → Environment Variables
2. Add all required variables (especially API URLs)
3. Redeploy

### Slow Builds

**Cause:** Monorepo overhead on first build

**Solution:**

- First build: 2-5 minutes (normal)
- Subsequent builds: 30-60 seconds (cached)
- Use Vercel's build cache (automatic)

### "getServerSideProps" Errors

**Cause:** Trying to use static export

**Fix:**

- Remove `output: 'export'` from `next.config.js`
- Keep SSR enabled (default)
- Vercel handles SSR automatically

## Comparison: Vercel vs Netlify

| Feature              | Vercel                     | Netlify                 |
| -------------------- | -------------------------- | ----------------------- |
| Next.js SSR          | ✅ Native Support          | ❌ Complex Setup        |
| `getServerSideProps` | ✅ Works                   | ❌ Requires Functions   |
| API Routes           | ✅ Automatic               | ⚠️ Needs Configuration  |
| Build Speed          | ⚡ Fast                    | ⚡ Fast                 |
| Free Tier            | ✅ Generous                | ✅ Generous             |
| Monorepo             | ✅ Excellent               | ⚠️ Limited              |
| **Recommendation**   | **✅ Perfect for Next.js** | Better for static sites |

## Summary

**✅ Vercel is the correct choice for NearbyBazaar because:**

1. Native Next.js SSR support
2. Handles `getServerSideProps` automatically
3. Excellent monorepo support with pnpm
4. Zero-config deployment for Next.js
5. Automatic preview deployments for PRs

**🚫 Netlify is NOT suitable because:**

1. No native SSR support
2. Requires complex serverless function setup
3. Our app uses `getServerSideProps` extensively
4. Static export breaks dynamic functionality

---

## Quick Reference

**Repository:** https://github.com/prashant183351/NEARBYBAZAAR

**Vercel Dashboard:** https://vercel.com/prashants-projects-c217e0c2

**Configuration PR:** https://github.com/prashant183351/NEARBYBAZAAR/pull/3

**Support:** Contact Devin or refer to Vercel documentation

---

_Last Updated: October 2025_
_Created by: Devin AI_
_Session: https://app.devin.ai/sessions/03053f32058b45dabe936af60c21da51_
