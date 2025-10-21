# Immutable Audit Log

## Overview

NearbyBazaar implements a tamper-evident, blockchain-inspired audit log system to track critical events across the platform. This ensures accountability, regulatory compliance, and forensic capability.

## Features

### Hash Chaining

Every audit log entry contains:
- **`hash`**: SHA-256 hash of the entry's content
- **`prevHash`**: Hash of the previous entry (forming a chain)
- **Genesis entry**: First entry has `prevHash` of 64 zeros

This creates a tamper-evident chain where any modification breaks the integrity.

### Immutability Enforcement

The audit log model enforces immutability through:
1. **Pre-save hooks**: Prevent modifications to existing records
2. **Pre-update hooks**: Block all update operations
3. **Pre-delete hooks**: Prevent deletions

Any attempt to tamper with logs will:
- Fail at the application level (hooks)
- Be detectable via chain verification even if bypassed

### Verification

```typescript
import { verifyAuditChain } from '../models/ImmutableAudit';

const result = await verifyAuditChain();
// Returns: { valid: boolean, brokenAt?: string, message: string }
```

Verification checks:
1. **Hash integrity**: Recomputes each entry's hash and compares
2. **Chain links**: Verifies each entry's `prevHash` matches previous entry's `hash`
3. **Genesis**: Ensures first entry has correct initial hash

### Daily Anchoring

A scheduled job runs daily at 23:59 UTC to:
1. Retrieve the latest audit hash
2. Email it to platform admins
3. Provide external proof of audit state

This creates timestamped checkpoints that can prove the audit log state at any point in time.

## Usage

### Logging Events

```typescript
import { logAuditEvent } from '../models/ImmutableAudit';

await logAuditEvent({
    userId: 'user123',
    action: 'login',
    resource: 'auth',
    resourceId: 'user123',
    metadata: { ip: '1.2.3.4', userAgent: 'Mozilla/...' },
});
```

### Critical Events to Log

The system automatically logs:
- **Authentication**: signup, login, logout, password resets
- **Authorization**: role changes, permission grants
- **Financial**: payouts, refunds, commission adjustments
- **Data**: exports, deletions (GDPR/DPDP compliance)
- **Security**: 2FA enable/disable, failed login attempts

### Manual Verification

```typescript
import { verifyAuditChain, getLatestAuditHash } from '../models/ImmutableAudit';

// Verify entire chain
const result = await verifyAuditChain();
console.log(result.message);

// Get current hash for external storage
const hash = await getLatestAuditHash();
console.log('Current audit hash:', hash);
```

### Manual Anchor Trigger

```typescript
import { triggerAuditAnchor } from '../jobs/auditAnchor';

// Manually trigger an anchor email (for on-demand use)
const hash = await triggerAuditAnchor();
```

## Schema

```typescript
{
    userId: string;         // Who performed the action
    action: string;         // What they did (e.g., 'login', 'payout')
    resource: string;       // What resource (e.g., 'auth', 'payment')
    resourceId?: string;    // Specific resource ID if applicable
    metadata?: object;      // Additional context
    prevHash: string;       // Previous entry's hash (chain link)
    hash: string;           // This entry's hash (computed automatically)
    timestamp: Date;        // When the event occurred
}
```

## Configuration

Environment variables:

```env
# Daily anchor email recipient
ADMIN_EMAIL=admin@nearbybazaar.com

# Enable/disable anchoring (default: true)
AUDIT_ANCHOR_ENABLED=true

# Redis for job queue (required for anchoring)
REDIS_URL=redis://localhost:6379

# SMTP for email delivery
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=user
SMTP_PASS=password
MAIL_FROM=no-reply@nearbybazaar.com
```

## Testing

Integration tests verify:
1. Hash chain generation
2. Immutability enforcement
3. Tamper detection
4. Chain verification
5. Metadata support

Run integration tests:

```bash
# Requires MongoDB and vc_redist installed
RUN_INTEGRATION=true pnpm --filter @nearbybazaar/api test
```

## Security Considerations

### What This Protects Against

✅ **Unauthorized modifications** to historical audit logs
✅ **Silent deletions** of audit entries
✅ **Tampering detection** via hash chain breaks
✅ **External verification** via daily anchor emails
✅ **Forensic investigation** with complete, immutable history

### What This Does NOT Protect Against

❌ **Database administrator access** with direct collection manipulation (mitigated by daily anchors)
❌ **Complete database deletion** (mitigated by backups and external anchors)
❌ **Unauthorized initial logging** (mitigated by RBAC on audit write operations)

### Best Practices

1. **Store anchor emails** in a separate, secure system (offline backup or separate email archive)
2. **Regularly verify** the chain integrity (automated checks)
3. **Monitor failures** in the audit system (alerts on write failures)
4. **Backup the database** with retention policies
5. **Limit direct database access** to prevent bypass of application-level protections

## Compliance

This audit system supports:

- **GDPR Article 30**: Records of processing activities
- **DPDP Act (India)**: Data processing accountability
- **PCI-DSS**: Audit trail requirements
- **SOX**: Financial transaction logs
- **HIPAA**: Access logs (if handling health data)

## Troubleshooting

### Chain Verification Fails

```typescript
const result = await verifyAuditChain();
if (!result.valid) {
    console.error(`Chain broken at: ${result.brokenAt}`);
    console.error(result.message);
}
```

Possible causes:
- Direct database modification
- Bug in hash generation logic
- Data corruption

### Anchor Emails Not Sending

Check:
1. Redis connection (required for job queue)
2. SMTP configuration
3. `AUDIT_ANCHOR_ENABLED` env var
4. Worker process is running
5. BullMQ queue health

### Cannot Delete Test Data

By design! The audit log prevents deletions.

For test cleanup:
```typescript
// Bypass protection (tests only!)
await AuditLog.collection.deleteMany({});
```

## API Reference

### `logAuditEvent(params)`

Create a new audit log entry.

**Parameters:**
- `userId` (string): User performing the action
- `action` (string): Action performed
- `resource` (string): Resource affected
- `resourceId?` (string): Specific resource ID
- `metadata?` (object): Additional context

**Returns:** `Promise<IAuditLog>`

### `verifyAuditChain(startFromId?)`

Verify the integrity of the audit chain.

**Parameters:**
- `startFromId?` (string): Optional starting point for verification

**Returns:** `Promise<{ valid: boolean, brokenAt?: string, message: string }>`

### `getLatestAuditHash()`

Get the hash of the most recent audit entry.

**Returns:** `Promise<string | null>`

### `triggerAuditAnchor()`

Manually trigger an anchor email.

**Returns:** `Promise<string | null>` (latest hash)

## Examples

### Track User Actions

```typescript
// After successful login
await logAuditEvent({
    userId: user.id,
    action: 'login',
    resource: 'auth',
    resourceId: user.id,
    metadata: {
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        timestamp: new Date(),
    },
});
```

### Track Financial Events

```typescript
// When processing a payout
await logAuditEvent({
    userId: admin.id,
    action: 'payout',
    resource: 'payment',
    resourceId: payout.id,
    metadata: {
        vendorId: vendor.id,
        amount: payout.amount,
        currency: 'INR',
        transactionId: payout.transactionId,
    },
});
```

### Regular Verification

```typescript
// Run nightly verification job
import { verifyAuditChain } from '../models/ImmutableAudit';

const result = await verifyAuditChain();
if (!result.valid) {
    // Alert admins immediately
    await sendAlert({
        severity: 'CRITICAL',
        message: `Audit chain integrity compromised: ${result.message}`,
        brokenAt: result.brokenAt,
    });
}
```

## Migration from Old Audit System

If you have an existing mutable audit log:

1. **Freeze old system**: Stop new writes to old audit table
2. **Export data**: Backup existing audit records
3. **Verify export**: Ensure all critical events are captured
4. **Initialize new system**: Let first entry be genesis
5. **Resume logging**: All new events go to immutable log
6. **Archive old logs**: Keep for reference but mark as legacy

## Future Enhancements

Potential improvements:
- **Merkle tree**: For efficient partial verification
- **Blockchain integration**: For public anchoring (e.g., Ethereum)
- **Distributed consensus**: Multi-node verification
- **Zero-knowledge proofs**: Privacy-preserving verification
- **Retention policies**: Archival of very old logs while maintaining chain

## Related Documentation

- [Authentication (Feature #168)](./AUTH.md)
- [RBAC (Feature #170)](./RBAC.md)
- [Compliance Suite (Feature #193)](./COMPLIANCE.md)
- [Operations Guide](./OPS.md)
