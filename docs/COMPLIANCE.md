# Compliance Acceptance

## Overview
The Compliance Acceptance feature ensures that vendors and suppliers accept required terms (SLAs, compliance terms, etc.) before performing certain actions in the dropshipping system.

## Features

### Versioned Agreements
- Each agreement has a type (`sla`, `compliance`, `terms_of_service`, `privacy_policy`)
- Agreements are versioned (e.g., "1.0", "2.0")
- When a new version is released, users must accept it again

### Acceptance Tracking
- Records who accepted, when, and from which IP/user agent
- Provides full audit trail for compliance purposes

### Enforcement
- Certain actions (e.g., receiving orders) can be blocked until agreements are accepted
- Middleware automatically enforces compliance on protected routes

## Usage

### Backend - Enforcing Compliance

```typescript
import { requireCompliance } from './middleware/requireCompliance';

// Protect routes that require compliance
app.use('/api/orders', requireCompliance(['sla', 'compliance']), orderRoutes);
```

### Backend - Checking Compliance Manually

```typescript
import { hasAcceptedLatestAgreement, enforceCompliance } from './services/compliance';

// Check if a vendor has accepted the latest SLA
const accepted = await hasAcceptedLatestAgreement(vendorId, 'vendor', 'sla');

// Enforce compliance (throws error if not accepted)
await enforceCompliance(vendorId, 'vendor', ['sla', 'compliance']);
```

### Frontend - Compliance Prompt

```tsx
import CompliancePrompt from './components/CompliancePrompt';

function App() {
  return (
    <>
      <CompliancePrompt />
      {/* Rest of app */}
    </>
  );
}
```

## API Endpoints

### GET /api/agreements/pending
Get all pending agreements for the current user.

**Response:**
```json
{
  "pending": [
    {
      "type": "sla",
      "version": "1.0",
      "title": "Service Level Agreement v1.0",
      "content": "..."
    }
  ]
}
```

### POST /api/agreements/:id/accept
Record acceptance of a specific agreement.

**Response:**
```json
{
  "success": true,
  "message": "Agreement accepted"
}
```

### POST /api/agreements (Admin)
Create a new agreement version.

**Request:**
```json
{
  "type": "sla",
  "version": "2.0",
  "title": "Service Level Agreement v2.0",
  "content": "...",
  "effectiveDate": "2025-10-01"
}
```

### GET /api/agreements/acceptances (Audit)
Get acceptance records for audit purposes.

**Query Parameters:**
- `acceptorId`: Filter by vendor/supplier ID
- `acceptorType`: Filter by 'vendor' or 'supplier'

## Data Models

### Agreement
```typescript
{
  type: 'sla' | 'compliance' | 'terms_of_service' | 'privacy_policy',
  version: string,
  title: string,
  content: string, // markdown or HTML
  effectiveDate: Date,
  createdAt: Date
}
```

### AgreementAcceptance
```typescript
{
  agreementId: ObjectId,
  agreementVersion: string,
  acceptorId: ObjectId,
  acceptorType: 'vendor' | 'supplier',
  acceptedAt: Date,
  ipAddress?: string,
  userAgent?: string
}
```

## Workflow

1. **Agreement Creation**: Admin creates a new agreement version
2. **Detection**: When vendor/supplier logs in, system checks for pending agreements
3. **Prompt**: UI displays compliance prompt with agreement content
4. **Acceptance**: User reviews and accepts agreement
5. **Recording**: System records acceptance with audit info (IP, user agent, timestamp)
6. **Enforcement**: Protected actions are now allowed

## Versioning Strategy

When releasing a new version:
1. Create new Agreement document with incremented version
2. All users who accepted previous version will see the new prompt
3. System enforces re-acceptance before allowing critical actions

## Testing

Run compliance tests:
```bash
npm test -- compliance.test.ts
```

Tests cover:
- Acceptance status checking
- Pending agreement retrieval
- Version-based re-prompting
- Enforcement blocking behavior
- Audit trail recording

## Edge Cases

### No Agreement Defined
If no agreement exists for a type, it's considered accepted (allows system to operate before agreements are created).

### Multiple Pending Agreements
UI displays them one at a time, requiring sequential acceptance.

### Blocking Behavior
If enforcement fails, API returns 403 with code `COMPLIANCE_REQUIRED`.

## Migration

To add new agreement types or update existing ones:

```typescript
import { AgreementModel } from './models/Agreement';

await AgreementModel.create({
  type: 'privacy_policy',
  version: '1.0',
  title: 'Privacy Policy',
  content: '...',
  effectiveDate: new Date(),
});
```

## Security Considerations

- Acceptance records include IP address and user agent for audit
- Cannot delete acceptance records (immutable audit trail)
- Agreement content should be sanitized if accepting HTML
- Use HTTPS to protect agreement content in transit
