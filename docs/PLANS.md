# Classifieds Plans & Usage

This document describes the available Classifieds plans, their features, pricing, and usage limits.

## Plan Comparison Table

| Plan      | Tier      | Max Listings | Featured Listings | Extra Images | Price (INR) | Support |
|-----------|-----------|--------------|------------------|--------------|-------------|---------|
| Free      | Free      | 5            | No               | No           | 0           | Email   |
| Pro       | Pro       | 20           | Yes              | Yes          | 100         | Priority|
| Featured  | Featured  | 50           | Yes              | Yes          | 200         | Priority|

## Feature Details
- **Max Listings**: Maximum number of active classifieds a vendor can have.
- **Featured Listings**: Ability to mark listings as "Featured" for higher visibility.
- **Extra Images**: Upload more images per listing (up to 10 for Pro/Featured).
- **Support**: Type of support available to vendors.

## Example Usage Scenarios
- **Free Plan**: Vendor can create up to 5 listings. If they try to create a 6th, they will be prompted to upgrade.
- **Pro Plan**: Vendor can have up to 20 listings, use featured listings, and upload extra images.
- **Featured Plan**: Vendor can have up to 50 listings, all features enabled, and priority support.

## Pricing Table

| Plan      | Monthly Price (INR) | Annual Price (INR) |
|-----------|---------------------|--------------------|
| Free      | 0                   | 0                  |
| Pro       | 100                 | 1000               |
| Featured  | 200                 | 2000               |

## How Plan Limitations Work
- When a vendor reaches their plan's listing limit, further creation is blocked until they upgrade or remove listings.
- Featured listings are only available on Pro and Featured plans.
- Extra image uploads are only available on Pro and Featured plans.

## Upgrading & Downgrading
- Upgrading to a higher plan increases limits and unlocks features immediately.
- Downgrading is only allowed if usage is within the new plan's limits.

---
For more details, see the plan enforcement logic in `apps/api/src/middleware/planEnforcement.ts` and the vendor plan UI in `apps/vendor/pages/plan.tsx`.
