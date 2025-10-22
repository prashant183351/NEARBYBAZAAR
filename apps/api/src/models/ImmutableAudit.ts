import mongoose, { Schema, Document } from 'mongoose';
import crypto from 'crypto';

export interface IAuditLog extends Document {
  userId: string;
  action: string;
  resource: string;
  resourceId?: string;
  metadata?: Record<string, any>;
  prevHash: string;
  hash: string;
  timestamp: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    userId: { type: String, required: true, index: true },
    action: { type: String, required: true, index: true },
    resource: { type: String, required: true, index: true },
    resourceId: { type: String, index: true },
    metadata: { type: Schema.Types.Mixed },
    prevHash: { type: String, required: true, index: true },
    hash: { type: String, required: true, unique: true, index: true },
    timestamp: { type: Date, default: Date.now, index: true },
  },
  {
    timestamps: false, // We use custom timestamp
  },
);

// Prevent modifications after creation
AuditLogSchema.pre('save', function (next) {
  if (!this.isNew) {
    return next(new Error('Audit logs are immutable'));
  }
  next();
});

// Prevent updates and deletes
AuditLogSchema.pre('findOneAndUpdate', function (next) {
  next(new Error('Audit logs cannot be updated'));
});

AuditLogSchema.pre('findOneAndDelete', function (next) {
  next(new Error('Audit logs cannot be deleted'));
});

AuditLogSchema.pre('deleteOne', function (next) {
  next(new Error('Audit logs cannot be deleted'));
});

AuditLogSchema.pre('deleteMany', function (next) {
  next(new Error('Audit logs cannot be deleted'));
});

// Generate hash before validation
AuditLogSchema.pre('validate', async function (next) {
  if (!this.isNew) return next();

  try {
    // Get the last audit log to chain from
    const lastLog = await ImmutableAudit.findOne().sort({ timestamp: -1 }).select('hash');
    this.prevHash = lastLog ? lastLog.hash : '0'.repeat(64); // Genesis hash

    // Compute current hash
    const content = JSON.stringify({
      userId: this.userId,
      action: this.action,
      resource: this.resource,
      resourceId: this.resourceId,
      metadata: this.metadata,
      prevHash: this.prevHash,
      timestamp: this.timestamp,
    });

    this.hash = crypto.createHash('sha256').update(content).digest('hex');
    next();
  } catch (err) {
    next(err as Error);
  }
});

export const ImmutableAudit =
  (mongoose.models.ImmutableAudit as mongoose.Model<IAuditLog>) ||
  mongoose.model<IAuditLog>('ImmutableAudit', AuditLogSchema);

/**
 * Verify the integrity of the audit log chain
 * @param startFromId Optional: start verification from a specific log ID
 * @returns { valid: boolean, brokenAt?: string, message: string }
 */
export async function verifyAuditChain(startFromId?: string): Promise<{
  valid: boolean;
  brokenAt?: string;
  message: string;
}> {
  const query = startFromId ? { _id: { $gte: startFromId } } : {};
  const logs = await ImmutableAudit.find(query).sort({ timestamp: 1 });

  if (logs.length === 0) {
    return { valid: true, message: 'No logs to verify' };
  }

  // Verify genesis
  const genesis = logs[0];
  if (genesis.prevHash !== '0'.repeat(64)) {
    return {
      valid: false,
      brokenAt: genesis.id,
      message: 'Genesis log has invalid prevHash',
    };
  }

  // Verify each log's hash and chain
  for (let i = 0; i < logs.length; i++) {
    const log = logs[i];

    // Recompute hash
    const content = JSON.stringify({
      userId: log.userId,
      action: log.action,
      resource: log.resource,
      resourceId: log.resourceId,
      metadata: log.metadata,
      prevHash: log.prevHash,
      timestamp: log.timestamp,
    });
    const expectedHash = crypto.createHash('sha256').update(content).digest('hex');

    if (log.hash !== expectedHash) {
      return {
        valid: false,
        brokenAt: log.id,
        message: `Log ${log.id} has invalid hash (tampered content)`,
      };
    }

    // Verify chain link
    if (i > 0) {
      const prevLog = logs[i - 1];
      if (log.prevHash !== prevLog.hash) {
        return {
          valid: false,
          brokenAt: log.id,
          message: `Log ${log.id} has broken chain link`,
        };
      }
    }
  }

  return { valid: true, message: `Verified ${logs.length} logs successfully` };
}

/**
 * Get the latest hash for daily anchoring/backup
 */
export async function getLatestAuditHash(): Promise<string | null> {
  const latest = await ImmutableAudit.findOne().sort({ timestamp: -1 }).select('hash');
  return latest ? latest.hash : null;
}

/**
 * Helper to log critical events
 */
export async function logAuditEvent(params: {
  userId: string;
  action: string;
  resource: string;
  resourceId?: string;
  metadata?: Record<string, any>;
}): Promise<IAuditLog> {
  const log = new ImmutableAudit({
    userId: params.userId,
    action: params.action,
    resource: params.resource,
    resourceId: params.resourceId,
    metadata: params.metadata,
    timestamp: new Date(),
  });
  await log.save();
  return log;
}
