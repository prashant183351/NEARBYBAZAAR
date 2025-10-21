# Feature #265: Integration & Deployment Checklist

## Pre-Deployment Checklist

### Phase 1: Code Integration (Week 1)

#### Authentication & Authorization
- [ ] **Enable Auth Middleware** (Priority: CRITICAL)
  - File: `apps/api/src/routes/vendorActions.ts`
  - Action: Uncomment `authenticate` middleware on all routes
  - Action: Uncomment `requireRole('admin')` on admin routes
  - Test: Verify 401 response without token
  - Test: Verify 403 response with non-admin token on admin routes

#### Order Guards
- [ ] **Integrate Order Acceptance Guard** (Priority: CRITICAL)
  - Files: Order creation endpoints (apps/api/src/controllers/orders.ts, etc.)
  - Action: Add `canVendorAcceptOrders()` check before order creation
  - Code:
    ```typescript
    const eligibility = await canVendorAcceptOrders(vendorId);
    if (!eligibility.canAccept) {
      return res.status(403).json({ 
        success: false, 
        error: eligibility.reason 
      });
    }
    ```
  - Test: Verify suspended vendor cannot create orders
  - Test: Verify blocked vendor cannot create orders
  - Test: Verify active vendor can create orders

#### Background Job Scheduling
- [ ] **Schedule Reputation Check Job** (Priority: CRITICAL)
  - File: Job scheduler configuration (likely `apps/api/src/queues/index.ts`)
  - Action: Add recurring job for `checkVendorReputation`
  - Recommended frequency: Every hour (`0 * * * *`)
  - Code:
    ```typescript
    queue.add('check-vendor-reputation', {}, {
      repeat: { cron: '0 * * * *' }
    });
    ```
  - Test: Verify job runs on schedule
  - Test: Verify job logs show correct behavior
  - Test: Verify expiration logic works

### Phase 2: Email Notifications (Week 1)

#### Email Service Integration
- [ ] **Warning Email Template** (Priority: HIGH)
  - File: `apps/api/src/templates/emails/vendor-warning.html`
  - Content: Include metrics, improvement tips, link to actions page
  - Variables: vendorName, actionType, reason, metrics, dashboardUrl

- [ ] **Suspension Email Template** (Priority: HIGH)
  - File: `apps/api/src/templates/emails/vendor-suspension.html`
  - Content: Include suspension duration, requirements, appeal process
  - Variables: vendorName, expiresAt, metrics, supportEmail

- [ ] **Block Email Template** (Priority: HIGH)
  - File: `apps/api/src/templates/emails/vendor-block.html`
  - Content: Include reason, appeal process, contact info
  - Variables: vendorName, reason, supportEmail, appealUrl

- [ ] **Admin Notification Template** (Priority: MEDIUM)
  - File: `apps/api/src/templates/emails/admin-action-notification.html`
  - Content: Daily digest of actions created
  - Variables: date, actionsSummary, vendorLinks

#### Email Triggers
- [ ] **Integrate Email Sending in createVendorAction()** (Priority: HIGH)
  - File: `apps/api/src/services/vendorEscalation.ts`
  - Action: Uncomment/implement email queue jobs
  - Code:
    ```typescript
    // After creating action
    await emailQueue.add('vendor-action-notification', {
      vendorId: action.vendor,
      actionType: action.actionType,
      actionId: action._id
    });
    ```
  - Test: Verify emails sent for each action type
  - Test: Verify email content is correct
  - Test: Verify emails respect opt-out preferences (if any)

- [ ] **Admin Daily Digest** (Priority: LOW)
  - Action: Create scheduled job for daily admin email
  - Frequency: Daily at 9 AM local time
  - Test: Verify digest includes all actions from previous 24h

### Phase 3: Testing (Week 2)

#### Unit Tests
- [ ] **Escalation Service Tests**
  - File: Create `apps/api/tests/services/vendorEscalation.test.ts`
  - Tests:
    - [ ] `evaluateEscalation()` with various metric combinations
    - [ ] `createVendorAction()` creates action and updates status
    - [ ] `overrideVendorAction()` restores vendor status
    - [ ] `canVendorAcceptOrders()` returns correct status
    - [ ] `expireSuspensions()` expires and restores vendors
    - [ ] `getEscalationHistory()` returns correct stats
    - [ ] Duplicate action prevention
  - Coverage target: >90%

- [ ] **Controller Tests**
  - File: Create `apps/api/tests/controllers/escalation.test.ts`
  - Tests:
    - [ ] getMyActions returns vendor's actions
    - [ ] checkOrderAcceptance returns correct status
    - [ ] getVendorsPendingAction returns vendors above thresholds
    - [ ] adminOverrideAction requires reasoning
    - [ ] adminCreateAction creates action
    - [ ] getEscalationRules returns rules
  - Coverage target: >85%

- [ ] **Route Tests**
  - File: Create `apps/api/tests/routes/vendorActions.test.ts`
  - Tests:
    - [ ] Vendor endpoints require authentication
    - [ ] Admin endpoints require admin role
    - [ ] Routes return correct status codes
    - [ ] Input validation works
    - [ ] Error handling works
  - Coverage target: >80%

#### Integration Tests
- [ ] **End-to-End Action Flow**
  - Scenario 1: Warning → Suspension → Block
    - [ ] Create vendor with poor metrics
    - [ ] Trigger job, verify warning created
    - [ ] Worsen metrics, trigger job, verify suspension
    - [ ] Worsen metrics, trigger job, verify block
    - [ ] Verify vendor status updated at each step
  
  - Scenario 2: Admin Override
    - [ ] Create suspended vendor
    - [ ] Admin overrides with reasoning
    - [ ] Verify vendor restored to active
    - [ ] Verify action marked as overridden
  
  - Scenario 3: Auto-Expiration
    - [ ] Create suspended vendor with expiresAt in past
    - [ ] Trigger job
    - [ ] Verify suspension expired
    - [ ] Verify vendor restored to active

- [ ] **Order Guard Integration**
  - [ ] Active vendor can create orders
  - [ ] Suspended vendor gets 403 error
  - [ ] Blocked vendor gets 403 error
  - [ ] Error message explains restriction

#### UI Tests (Playwright)
- [ ] **Admin UI Tests**
  - File: Create `apps/admin/tests/vendors/actions.spec.ts`
  - Tests:
    - [ ] Pending vendors table loads
    - [ ] View history shows correct data
    - [ ] Override modal validates reasoning
    - [ ] Override succeeds and updates UI
    - [ ] Refresh button works

- [ ] **Vendor UI Tests**
  - File: Create `apps/vendor/tests/account/actions.spec.ts`
  - Tests:
    - [ ] Account status banner displays correctly
    - [ ] Active actions show with guidance
    - [ ] Historical actions display
    - [ ] No active actions shows success message

### Phase 4: Performance & Security (Week 2)

#### Performance Testing
- [ ] **Load Test Background Job** (Priority: HIGH)
  - Tool: Use k6 or similar
  - Scenario: 10,000 vendors, evaluate all
  - Target: Complete in <5 minutes
  - Monitor: Memory usage, CPU usage, database load
  - Action: Optimize if needed (batch processing, pagination)

- [ ] **Load Test API Endpoints** (Priority: MEDIUM)
  - Tool: Use k6 or Artillery
  - Endpoints: All 7 vendor action endpoints
  - Target: <100ms p95 latency, handle 100 req/s
  - Monitor: Response times, error rates
  - Action: Add rate limiting if needed

- [ ] **Database Query Performance** (Priority: MEDIUM)
  - Action: Run EXPLAIN on all queries
  - Verify: Indexes being used
  - Verify: No full collection scans
  - Verify: Query times <50ms

#### Security Review
- [ ] **Input Validation** (Priority: CRITICAL)
  - [ ] Override reason minimum length enforced
  - [ ] Action IDs validated (ObjectId format)
  - [ ] Vendor IDs validated
  - [ ] No SQL injection vectors

- [ ] **Authorization Checks** (Priority: CRITICAL)
  - [ ] Vendors can only see their own actions
  - [ ] Admin-only endpoints reject non-admin users
  - [ ] Override requires admin authentication
  - [ ] Manual action creation requires admin

- [ ] **Audit Trail Integrity** (Priority: HIGH)
  - [ ] All actions logged with full context
  - [ ] Overrides record admin ID and reasoning
  - [ ] Timestamps are immutable
  - [ ] Metrics snapshots preserved

- [ ] **Rate Limiting** (Priority: MEDIUM)
  - [ ] Admin endpoints limited (e.g., 100 req/min)
  - [ ] Vendor endpoints limited (e.g., 10 req/min)
  - [ ] Background job respects rate limits

### Phase 5: Documentation & Training (Week 3)

#### Internal Documentation
- [x] Comprehensive guide (`docs/VENDOR_ESCALATION.md`)
- [x] Quick reference (`docs/VENDOR_ESCALATION_QUICK_REFERENCE.md`)
- [x] Implementation summary (`docs/features/FEATURE_265_IMPLEMENTATION_SUMMARY.md`)
- [ ] **Troubleshooting Runbook** (Priority: MEDIUM)
  - Create: `docs/runbooks/VENDOR_ESCALATION_TROUBLESHOOTING.md`
  - Include: Common issues, resolution steps, emergency procedures
  
- [ ] **Operational Procedures** (Priority: MEDIUM)
  - Create: `docs/procedures/VENDOR_ESCALATION_OPS.md`
  - Include: Daily checks, weekly reports, escalation procedures

#### User-Facing Documentation
- [ ] **Vendor Help Article** (Priority: HIGH)
  - Title: "Understanding Account Actions and Performance Metrics"
  - Content: What actions mean, how to improve, appeal process
  - Location: Help center / knowledge base

- [ ] **Admin Training Guide** (Priority: HIGH)
  - Title: "Managing Vendor Actions and Overrides"
  - Content: How to use admin UI, when to override, best practices
  - Location: Internal wiki / training portal

#### Team Training
- [ ] **Engineering Team** (Priority: MEDIUM)
  - Schedule: Training session on system architecture
  - Duration: 1 hour
  - Topics: How it works, monitoring, troubleshooting
  - Record: Session for future reference

- [ ] **Support Team** (Priority: HIGH)
  - Schedule: Training on vendor appeals
  - Duration: 1 hour
  - Topics: Understanding actions, escalation process, vendor communication
  - Provide: Scripts for common scenarios

- [ ] **Product/Policy Team** (Priority: MEDIUM)
  - Schedule: Review of thresholds and policies
  - Duration: 30 minutes
  - Topics: Current rules, adjustment process, business impact

### Phase 6: Monitoring & Alerts (Week 3)

#### Application Monitoring
- [ ] **Background Job Monitoring** (Priority: CRITICAL)
  - Alert: Job failure (any run)
  - Alert: Job duration >10 minutes
  - Alert: No job run in 2 hours (expected hourly)
  - Dashboard: Job duration trend, success rate

- [ ] **API Endpoint Monitoring** (Priority: HIGH)
  - Alert: Error rate >1%
  - Alert: p95 latency >500ms
  - Dashboard: Request volume, latency percentiles

- [ ] **Action Creation Monitoring** (Priority: HIGH)
  - Alert: Spike in actions (>10 in 1 hour)
  - Alert: High override rate (>50% in 24h)
  - Dashboard: Actions per day by type, override rate

#### Business Metrics Dashboard
- [ ] **Vendor Performance Dashboard** (Priority: MEDIUM)
  - Metrics:
    - Total actions created (today, week, month)
    - Actions by type (warning, suspension, block)
    - Override rate and reasons
    - Average time to resolution
    - Vendor improvement rate after warning
  - Audience: Product team, exec team

- [ ] **Escalation Effectiveness Dashboard** (Priority: LOW)
  - Metrics:
    - Warning → Suspension rate
    - Suspension → Block rate
    - False positive rate (estimated from overrides)
    - Vendor churn attributed to blocks
  - Audience: Policy team

### Phase 7: Deployment (Week 3-4)

#### Staging Deployment
- [ ] **Deploy to Staging** (Priority: CRITICAL)
  - [ ] Deploy code changes
  - [ ] Run database migrations (add status to vendors)
  - [ ] Configure environment variables
  - [ ] Schedule background job
  - [ ] Verify all endpoints accessible
  - [ ] Run smoke tests

- [ ] **Staging Validation** (Priority: CRITICAL)
  - [ ] Create test vendor with poor metrics
  - [ ] Verify action created automatically
  - [ ] Test admin UI (override action)
  - [ ] Test vendor UI (view action)
  - [ ] Verify order guard works
  - [ ] Check email notifications sent
  - [ ] Verify logs contain expected entries

#### Production Deployment
- [ ] **Pre-Deployment** (Priority: CRITICAL)
  - [ ] QA sign-off on staging
  - [ ] Security review completed
  - [ ] Load testing passed
  - [ ] Rollback plan documented
  - [ ] Team briefed on monitoring plan
  - [ ] Support team trained

- [ ] **Deployment** (Priority: CRITICAL)
  - [ ] Create database backup
  - [ ] Deploy during low-traffic window
  - [ ] Run database migrations
  - [ ] Deploy API changes
  - [ ] Deploy admin UI changes
  - [ ] Deploy vendor UI changes
  - [ ] Configure background job (start with 2-hour frequency, then hourly)
  - [ ] Smoke test critical paths

- [ ] **Post-Deployment** (Priority: CRITICAL)
  - [ ] Monitor error rates (first 4 hours)
  - [ ] Check background job executes
  - [ ] Verify no spike in support tickets
  - [ ] Review first batch of actions created
  - [ ] Collect feedback from admins
  - [ ] Document any issues

#### Phased Rollout (Optional)
- [ ] **Phase 1: Shadow Mode** (Week 1)
  - Actions created but NOT enforced (no status updates)
  - Monitor action creation rate
  - Review false positive rate
  - Adjust thresholds if needed

- [ ] **Phase 2: Warnings Only** (Week 2)
  - Enable warnings, keep suspensions/blocks off
  - Monitor vendor response
  - Collect feedback
  - Refine communication

- [ ] **Phase 3: Full Enforcement** (Week 3)
  - Enable all action types
  - Monitor closely
  - Respond quickly to issues

### Phase 8: Post-Launch (Ongoing)

#### Week 1 Post-Launch
- [ ] Daily review of actions created
- [ ] Daily review of override requests
- [ ] Collect vendor feedback
- [ ] Adjust thresholds if needed (document changes)
- [ ] Address any bugs immediately

#### Week 2-4 Post-Launch
- [ ] Weekly review of key metrics
- [ ] Identify patterns in actions/overrides
- [ ] Plan improvements based on feedback
- [ ] Document lessons learned

#### Monthly Review
- [ ] Review escalation effectiveness
- [ ] Analyze vendor improvement rates
- [ ] Assess business impact (GMV, churn)
- [ ] Propose threshold adjustments
- [ ] Plan feature enhancements

---

## Sign-Off Checklist

### Code Review
- [ ] Backend code reviewed by: _________________
- [ ] Frontend code reviewed by: _________________
- [ ] Tests reviewed by: _________________

### Functional Review
- [ ] Product Manager approval: _________________
- [ ] QA approval: _________________

### Security & Compliance
- [ ] Security review completed: _________________
- [ ] Compliance review (if needed): _________________

### Operations
- [ ] DevOps approval: _________________
- [ ] Monitoring configured: _________________
- [ ] Runbooks reviewed: _________________

### Deployment Approval
- [ ] Engineering Lead: _________________
- [ ] Product Lead: _________________
- [ ] CTO/VP Engineering: _________________

---

## Emergency Rollback Procedure

If critical issues arise post-deployment:

1. **Disable Background Job**
   ```bash
   # Stop creating new actions
   # Via admin panel or job scheduler
   ```

2. **Restore All Suspended/Blocked Vendors** (if needed)
   ```javascript
   await Vendor.updateMany(
     { status: { $in: ['suspended', 'blocked'] } },
     { status: 'active' }
   );
   ```

3. **Mark All Active Actions as Overridden**
   ```javascript
   await VendorAction.updateMany(
     { status: 'active' },
     { status: 'overridden', overrideReason: 'Emergency rollback due to [issue]' }
   );
   ```

4. **Revert Code Deployment** (if needed)
   - Follow standard deployment rollback procedure

5. **Communicate**
   - Notify affected vendors
   - Update internal teams
   - Post-mortem after issue resolved

---

## Contact List

**Engineering Lead**: _________________  
**Product Manager**: _________________  
**DevOps On-Call**: _________________  
**Security Team**: _________________  
**Support Lead**: _________________  

---

**Checklist Created**: January 20, 2025  
**Last Updated**: January 20, 2025  
**Version**: 1.0  
**Owner**: Platform Engineering Team

