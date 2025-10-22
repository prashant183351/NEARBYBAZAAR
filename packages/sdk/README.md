# NearbyBazaar TypeScript SDK

This SDK is auto-generated from the NearbyBazaar OpenAPI spec using [openapi-typescript-codegen](https://github.com/ferdikoomen/openapi-typescript-codegen).

## Usage

1. Install dependencies (if using outside monorepo):
   ```sh
   pnpm add cross-fetch
   ```
2. Import and use the SDK in your TypeScript/Node.js project:
   ```ts
   import { Api } from '@nearbybazaar/sdk';
   const api = new Api({ baseUrl: 'https://your-api-url/v1' });
   const products = await api.products.getProducts();
   ```

## Regenerating the SDK

After updating the OpenAPI spec, run:

```sh
pnpm generate:sdk
```

This will update the SDK in this directory.

## Notes

- The SDK uses the Fetch API (works in Node.js and browsers).
- Auth: Pass JWT tokens via the `Api` constructor or per-request options.
- See the generated `README.md` and types for full API details.
