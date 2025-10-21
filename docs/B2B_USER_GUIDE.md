# NearbyBazaar B2B Platform - Complete User Guide

## Your Complete Guide to B2B Features

Welcome to NearbyBazaar's B2B platform! This master guide consolidates all B2B documentation, organized by user type for easy navigation.

---

## 📋 Table of Contents

### Quick Navigation
- [For Buyers](#for-buyers) - Business purchasing, bulk orders, RFQs
- [For Vendors](#for-vendors) - Selling bulk, managing RFQs, credit sales
- [For Administrators](#for-administrators) - Platform analytics, compliance
- [Technical Documentation](#technical-documentation) - APIs, integration guides

### Feature Guides
- [B2B Account Setup](#b2b-account-setup)
- [Bulk Pricing & Orders](#bulk-pricing--orders)
- [RFQ System](#rfq-system)
- [Credit & Payment Terms](#credit--payment-terms)
- [Analytics & Reporting](#analytics--reporting)
- [GST & Tax Compliance](#gst--tax-compliance)

---

## For Buyers

### Getting Started

**📘 Complete Buyer Guide**  
[B2B Buyer Guide](./B2B_BUYER_GUIDE.md) - Comprehensive guide covering:
- Applying for B2B account (with credit)
- Understanding bulk pricing tiers
- Placing bulk orders
- Submitting and managing RFQs
- Managing credit and payment terms
- Using buyer analytics dashboard
- GST invoicing for businesses
- Best practices and FAQ

**🎯 Quick Start Checklist:**
1. Create business account with company details
2. Upload GST certificate and PAN card
3. Apply for credit line (optional, 1-2 days approval)
4. Start browsing bulk-priced products
5. Place first bulk order or submit RFQ

### Key Features for Buyers

#### Bulk Pricing
- **What**: Tiered discounts based on quantity
- **Example**: Buy 100 units get 10% off, 500 units get 20% off
- **Savings**: 10-30% below retail prices
- **Documentation**: [Buyer Guide § Understanding Bulk Pricing](./B2B_BUYER_GUIDE.md#understanding-bulk-pricing)

#### Request for Quotation (RFQ)
- **What**: Request custom quotes for large orders or customization
- **When to Use**: 
  - Quantities beyond standard tiers
  - Product customization needed
  - Special delivery/payment terms
- **Documentation**: [Buyer Guide § Submitting RFQs](./B2B_BUYER_GUIDE.md#submitting-rfqs)

#### Credit Terms
- **Options Available**:
  - Net 30 (pay in 30 days)
  - Net 60 (pay in 60 days)
  - Partial advance (e.g., 30% now, 70% later)
- **Credit Limits**: ₹50K - ₹10L based on business size
- **Documentation**: [Buyer Guide § Managing Credit](./B2B_BUYER_GUIDE.md#managing-credit--payment-terms)

#### Analytics Dashboard
- **Features**:
  - Track spending (bulk vs retail)
  - 30-day trends
  - Export for accounting
- **Access**: Dashboard → B2B Analytics
- **Documentation**: [B2B Analytics Guide](./B2B_ANALYTICS.md)

### Support for Buyers
- Email: b2b-support@nearbybazaar.com
- Phone: +91-XXXX-XXXXXX
- Live Chat: Available on website

---

## For Vendors

### Getting Started

**📘 Complete Vendor Guide**  
[B2B Vendor Guide](./B2B_VENDOR_GUIDE.md) - Comprehensive guide covering:
- Setting up bulk pricing strategies
- Handling RFQs professionally
- Managing B2B orders with credit terms
- Using vendor analytics dashboard
- GST compliance and invoicing
- Best practices for maximizing B2B sales

**🎓 Training Materials**  
[Vendor Training: B2B Sales Mastery](./VENDOR_TRAINING.md) - Interactive training covering:
- Why B2B matters (5x revenue potential)
- Creating tiered pricing (with templates)
- RFQ mastery (response templates, negotiation)
- Credit sales safety (platform guarantee)
- Analytics optimization
- Module-based learning with examples

**💡 Quick Start:**
1. Enable B2B in Settings → B2B Configuration
2. Set up bulk pricing (use templates)
3. Configure credit policy
4. Start receiving bulk orders and RFQs

### Key Features for Vendors

#### Bulk Pricing Setup
- **Recommended Tiers**: 3-4 tiers
- **Typical Discounts**: 10%, 20%, 30% off retail
- **Templates**: Conservative, Balanced, Aggressive
- **Tools**: Bulk pricing templates, calculator
- **Documentation**: [Vendor Guide § Setting Up Bulk Pricing](./B2B_VENDOR_GUIDE.md#setting-up-bulk-pricing)

#### RFQ Management
- **Response Time**: <24 hours (critical)
- **Components**: Pricing, timeline, terms
- **Negotiation**: Be flexible on payment terms
- **Tools**: Response templates, quote calculator
- **Documentation**: [Vendor Guide § Managing RFQs](./B2B_VENDOR_GUIDE.md#managing-rfqs)

#### Credit Sales (Zero Risk)
- **How It Works**: Platform pays you immediately (24h)
- **Options**: Net 30, Net 60, Partial advance
- **Your Protection**: Platform guarantees payment
- **Fees**: Standard 3-5% (same as retail)
- **Documentation**: [Vendor Guide § Credit Sales](./B2B_VENDOR_GUIDE.md#credit-sales--payment-terms)

#### Analytics Dashboard
- **Metrics**:
  - Bulk vs retail revenue
  - Average bulk order value
  - Top industries/regions
  - Pricing performance
- **Optimization**: Monthly tier adjustments
- **Export**: CSV for accounting
- **Documentation**: [B2B Analytics Guide](./B2B_ANALYTICS.md)

### Vendor Help Center
- **In-App Help**: Dashboard → Help → B2B Section
- **Training**: Weekly webinars (Tuesdays 3 PM)
- **Support**: vendor-support@nearbybazaar.com
- **Community**: Vendor forum for peer advice

---

## For Administrators

### Platform Management

**📊 Analytics & Reports**  
[B2B Analytics Documentation](./B2B_ANALYTICS.md) - Platform-wide analytics:
- Regional breakdown (North, South, East, West)
- Industry analysis (Manufacturing, Retail, Services)
- Order type distribution (Wholesale, RFQ, Contract)
- Revenue metrics and trends
- Vendor performance tracking

**📈 Key Admin Metrics:**
- Total B2B revenue
- Number of active B2B buyers/vendors
- Average order values by segment
- Credit utilization rates
- Regional growth trends

**🛠️ Admin Tools:**
- User verification (B2B account approvals)
- Credit limit management
- Dispute resolution
- Vendor performance monitoring
- Compliance tracking (GST, KYC)

### Compliance & Security

**GST Compliance:**
- [GST Invoicing Guide](./GST_INVOICING.md)
- E-invoice generation (for orders >₹50K)
- GSTIN verification
- Tax rate management

**KYC & Verification:**
- Document verification workflow
- Credit assessment criteria
- Fraud detection and prevention

**Reporting:**
- Monthly GST reports
- Credit aging reports
- Vendor performance scorecards
- Export all data for audits

---

## Technical Documentation

### API Reference

#### Analytics API
- **Guide**: [B2B Analytics API](./B2B_ANALYTICS.md#api-endpoints)
- **Quick Ref**: [Analytics Quick Reference](./B2B_ANALYTICS_QUICK_REFERENCE.md)
- **Endpoints**:
  - `GET /v1/analytics/vendor/b2b/summary`
  - `GET /v1/analytics/admin/b2b/breakdown`
  - `GET /v1/analytics/.../export`

#### Payment Terms API
- **Guide**: [Payment Terms Documentation](./PAYMENT_TERMS.md)
- **Quick Ref**: [Payment Terms Quick Reference](./PAYMENT_TERMS_QUICK_REFERENCE.md)
- **Features**: Credit limits, payment term templates, buyer credit tracking

#### GST Invoicing API
- **Guide**: [GST Invoicing Guide](./GST_INVOICING.md)
- **Quick Ref**: [GST Quick Reference](./GST_INVOICING_QUICK_REFERENCE.md)
- **Features**: Invoice generation, tax calculation, E-way bill

### Integration Guides

**ERP Integration:**
- Sync orders to accounting software
- Automated invoice export
- Stock level synchronization

**Shipping Integration:**
- Bulk shipping partners
- Tracking integration
- Freight calculation

---

## B2B Account Setup

### For Buyers (Business Accounts)

**Step 1: Registration**
1. Sign up at nearbybazaar.com/register
2. Select "Business Account"
3. Provide company details:
   - Company name
   - GSTIN (GST number)
   - PAN
   - Industry type
   - Business address

**Step 2: Verification**
Upload documents:
- GST Certificate (PDF/JPG)
- PAN Card
- Company registration (optional)
- Address proof

**Step 3: Credit Application (Optional)**
1. Navigate to Account → Credit Application
2. Provide financial details
3. Wait 2-3 days for approval
4. Typical limits: ₹50K - ₹10L

**Timeline:**
- Account approval: 1-2 business days
- Credit approval: 2-3 business days

**Documentation**: [Buyer Guide § Applying for B2B Account](./B2B_BUYER_GUIDE.md#applying-for-b2b-account)

---

### For Vendors (B2B Sellers)

**Step 1: Enable B2B**
1. Login to Vendor Dashboard
2. Settings → B2B Configuration
3. Toggle "B2B Sales" ON

**Step 2: Complete Profile**
Required information:
- GSTIN (must be valid)
- Bank account details
- Business type
- Minimum 10 products listed
- Average rating ≥ 4.0 stars

**Step 3: Set Up Pricing**
1. Choose products for bulk sales
2. Add tiered pricing (3-4 tiers recommended)
3. Set minimum order quantities

**Step 4: Configure Credit Policy**
Choose payment terms to offer:
- Full Advance (recommended for new vendors)
- Partial Advance (e.g., 30-70 split)
- Net 30/60 (requires manual review initially)

**Timeline:**
- Profile verification: 24-48 hours
- Start selling: Immediately after approval

**Documentation**: [Vendor Guide § Getting Started](./B2B_VENDOR_GUIDE.md#getting-started-with-b2b)

---

## Bulk Pricing & Orders

### How Bulk Pricing Works

**Concept:** Discounts based on quantity purchased.

**Example Product:**
```
Product: Industrial Steel Pipes
Retail Price: ₹150 per unit

Bulk Pricing Tiers:
┌─────────────┬──────────┬──────────┬────────────┐
│ Quantity    │ Price    │ Discount │ Total      │
├─────────────┼──────────┼──────────┼────────────┤
│ 1-99        │ ₹150     │ 0%       │ ₹14,850    │
│ 100-499     │ ₹135     │ 10%      │ ₹67,065    │
│ 500-999     │ ₹120     │ 20%      │ ₹119,400   │
│ 1000+       │ ₹105     │ 30%      │ ₹105,000   │
└─────────────┴──────────┴──────────┴────────────┘
```

**Buyer saves**: ₹45,000 on 1000 units vs retail price

### Placing Bulk Orders

**As a Buyer:**
1. Browse products with "Bulk Available" badge
2. Select quantity (must meet minimum if "Wholesale Only")
3. Bulk price automatically applied at cart
4. Choose payment terms at checkout
5. Confirm order

**Order Flow:**
```
Cart → Select Payment Terms → Payment → Vendor Ships → Delivered
```

**Documentation:**
- Buyers: [Placing Bulk Orders](./B2B_BUYER_GUIDE.md#placing-bulk-orders)
- Vendors: [B2B Order Management](./B2B_VENDOR_GUIDE.md#b2b-order-management)

---

## RFQ System

### What is an RFQ?

**RFQ = Request for Quotation**

Used when:
- Need quantities beyond standard tiers
- Require product customization (logo, colors, specs)
- Want special delivery or payment terms
- Product not in standard catalog

### How RFQs Work

**Buyer Side:**
1. Submit RFQ with requirements (quantity, specs, budget, timeline)
2. Receive quotes from vendor(s) within 24-48 hours
3. Compare quotes (price, delivery, terms)
4. Accept best quote or negotiate further
5. Quote converts to order automatically

**Vendor Side:**
1. Receive RFQ notification
2. Review requirements and feasibility
3. Calculate pricing (cost + margin)
4. Submit quote with terms
5. Negotiate if buyer counter-offers
6. Order created when buyer accepts

### RFQ Best Practices

**For Buyers:**
- Be specific with requirements
- Provide realistic target price
- Allow adequate lead time (2-4 weeks)
- Submit to multiple vendors for comparison

**For Vendors:**
- Respond within 24 hours (critical!)
- Ask clarifying questions
- Provide multiple options (good, better, best)
- Be flexible on payment terms
- Follow up if no response in 3 days

**Documentation:**
- Buyers: [Submitting RFQs](./B2B_BUYER_GUIDE.md#submitting-rfqs)
- Vendors: [Managing RFQs](./B2B_VENDOR_GUIDE.md#managing-rfqs)
- Training: [RFQ Mastery Module](./VENDOR_TRAINING.md#module-3-rfq-mastery-45-minutes)

---

## Credit & Payment Terms

### Available Payment Terms

#### 1. Full Advance
- Buyer pays 100% before shipment
- No credit used
- **Use for**: New relationships, high-value items

#### 2. Partial Advance (e.g., 30-70)
- Buyer pays 30% upfront, 70% on delivery
- Credit used for balance
- **Use for**: Regular orders, established vendors

#### 3. Net 30
- Buyer pays full amount within 30 days
- Full amount uses credit
- **Use for**: Established relationships

#### 4. Net 60
- Buyer pays full amount within 60 days
- Higher credit limit required
- **Use for**: Large enterprises, contracts

### Credit System (Buyers)

**Credit Limits:**
- Small businesses: ₹50,000 - ₹2,00,000
- Medium businesses: ₹2,00,000 - ₹10,00,000
- Large enterprises: ₹10,00,000+

**Credit Tracking:**
- Credit Limit: Maximum you can owe
- Available Credit: Current unused amount
- Outstanding: Total owed across orders
- Payment Due Dates: Tracked per order

**Late Payments:**
- Late fee: 2% per month
- Credit frozen until paid
- Account suspended after 60 days

### Vendor Protection

**How It Works:**
1. Buyer places credit order (e.g., Net 30)
2. **Platform pays vendor within 24 hours**
3. Vendor ships order
4. Platform collects from buyer on due date

**Zero Risk for Vendors:**
- You get paid immediately (even for Net 30/60)
- Platform handles all collections
- You're protected from buyer defaults

**Documentation:**
- [Payment Terms Complete Guide](./PAYMENT_TERMS.md)
- [Quick Reference](./PAYMENT_TERMS_QUICK_REFERENCE.md)

---

## Analytics & Reporting

### Buyer Analytics

**Access:** Dashboard → B2B Analytics

**Key Metrics:**
- Bulk revenue vs retail revenue
- Average bulk order value
- Bulk vs retail ratio (target: 60-80%)
- Top categories purchased
- 30-day spending trend

**Use Cases:**
- Budget planning
- Cost optimization
- Tax planning (GST summary)

**Export:** CSV/JSON for accounting software

**Documentation:** [B2B Analytics Guide](./B2B_ANALYTICS.md#buyer-analytics)

---

### Vendor Analytics

**Access:** Dashboard → B2B Analytics

**Key Metrics:**
- Total bulk revenue (vs retail)
- Number of bulk orders
- Average bulk order value (target: ₹15K-₹50K)
- Top industries/regions
- Pricing performance (avg discount given)
- RFQ acceptance rate

**Insights:**
- Which tiers are most popular
- Which products to focus on
- Regional demand patterns
- Industry trends

**Optimization:**
- Adjust tier pricing monthly
- Focus marketing on top segments
- Stock inventory based on demand

**Export:** CSV/JSON with full order details

**Documentation:** [B2B Analytics Guide](./B2B_ANALYTICS.md#vendor-analytics)

---

### Admin Analytics

**Access:** Admin Dashboard → B2B Analytics

**Platform-Wide Metrics:**
- Total B2B revenue
- Active B2B buyers and vendors
- Regional breakdown (North, South, East, West)
- Industry analysis (Manufacturing, Retail, Services)
- Order type distribution (Wholesale, RFQ, Contract)
- 30-day trends

**Regional View:**
- Revenue and order count per region
- Average order value by region
- Top industries in each region

**Industry View:**
- Revenue and order count per industry
- Average order value by industry
- Top regions for each industry

**Export:** Filtered CSV/JSON for reports

**Documentation:** [B2B Analytics Complete Guide](./B2B_ANALYTICS.md)

---

## GST & Tax Compliance

### GST-Compliant Invoices

All B2B orders include proper GST invoices:
- Both party GSTINs (buyer and vendor)
- HSN/SAC codes
- Tax breakdown (CGST/SGST or IGST)
- Unique invoice number
- E-way bill (for interstate >₹50K)

### Tax Components

**Intrastate (Same State):**
- CGST: 9%
- SGST: 9%
- Total: 18%

**Interstate (Different State):**
- IGST: 18%

### For Buyers

**Input Tax Credit (ITC):**
1. Download invoices from order history
2. Verify on GSTN portal (auto-populated)
3. File GSTR-3B monthly
4. Claim credit

**Record Keeping:**
- Keep invoices for 6 years (GST law)
- Use export feature for bulk download

### For Vendors

**Monthly GST Filing:**
1. Download all invoices (1st-10th)
2. File GSTR-1 (by 11th)
3. File GSTR-3B (by 20th)
4. Pay tax (by 20th)

**E-Way Bill:**
- Required for interstate orders >₹50,000
- Generate on GST portal
- Enter number in order details

**Documentation:**
- [GST Invoicing Complete Guide](./GST_INVOICING.md)
- [Quick Reference](./GST_INVOICING_QUICK_REFERENCE.md)

---

## Sample Data & Testing

### Seeding Sample B2B Data

**For Development/Testing:**

Run the B2B seeder to populate sample data:

```powershell
# Set environment flag
$env:SEED_B2B_DATA="true"

# Run seeder
pnpm --filter @nearbybazaar/api seed:dev
```

**Sample Data Includes:**
- 3 B2B buyer accounts (different industries)
- 4 products with tiered pricing
- 2 sample RFQs
- 3 bulk orders (different payment terms)
- Credit accounts with limits

**Sample Accounts:**
```
Buyer 1: rajesh@kumarmfg.com (Manufacturing, ₹5L credit)
Buyer 2: priya@sharmaretail.com (Retail, ₹3L credit)
Buyer 3: amit@techservices.com (Services)
```

**Documentation:** [B2B Sample Data Seeder](../apps/api/src/seeders/b2bSampleData.ts)

---

## Frequently Asked Questions

### General

**Q: What's the difference between B2B and retail?**
A: B2B offers bulk pricing, credit terms, RFQs, and business invoicing. Retail is for individual consumers at standard pricing.

**Q: Can I use both B2B and retail features?**
A: Yes! Business accounts can place both bulk and retail orders.

---

### For Buyers

**Q: How long does B2B approval take?**
A: 1-2 business days after document submission.

**Q: What if I need more credit?**
A: Contact support with business case. Limits reviewed quarterly.

**Q: Can I cancel a bulk order?**
A: Before shipment: free cancellation. After: per vendor's policy.

---

### For Vendors

**Q: Is offering credit risky?**
A: No! Platform pays you within 24 hours. We handle collections.

**Q: What discount should I offer?**
A: Start with 10-20%. Monitor analytics and adjust monthly.

**Q: How do I handle RFQs I can't fulfill?**
A: Respond anyway! Politely decline and suggest alternatives.

---

## Support & Resources

### Contact Support

**Buyers:**
- Email: b2b-support@nearbybazaar.com
- Phone: +91-XXXX-XXXXXX
- Live Chat: Available on website

**Vendors:**
- Email: vendor-support@nearbybazaar.com
- Phone: +91-XXXX-XXXXXX
- In-App Chat: Dashboard bottom-right
- 1-on-1 Consultation: Schedule with account manager

**Admins:**
- Internal Slack: #b2b-platform
- Email: platform-team@nearbybazaar.com

### Training & Learning

**For Vendors:**
- [Training: B2B Sales Mastery](./VENDOR_TRAINING.md)
- Weekly webinars (Tuesdays 3 PM IST)
- Vendor forum (community.nearbybazaar.com)
- Video tutorials (academy.nearbybazaar.com)

**For Buyers:**
- [Complete Buyer Guide](./B2B_BUYER_GUIDE.md)
- Video demos (coming soon)
- 1-on-1 onboarding calls (for large accounts)

### Documentation Index

**User Guides:**
- [B2B Buyer Guide](./B2B_BUYER_GUIDE.md) - Complete buyer documentation
- [B2B Vendor Guide](./B2B_VENDOR_GUIDE.md) - Complete vendor documentation
- [Vendor Training Materials](./VENDOR_TRAINING.md) - Interactive training modules

**Feature Documentation:**
- [B2B Analytics & Reports](./B2B_ANALYTICS.md) - Analytics features
- [Payment Terms & Credit](./PAYMENT_TERMS.md) - Credit system
- [GST Invoicing](./GST_INVOICING.md) - Tax compliance

**Quick References:**
- [Analytics Quick Reference](./B2B_ANALYTICS_QUICK_REFERENCE.md)
- [Payment Terms Quick Reference](./PAYMENT_TERMS_QUICK_REFERENCE.md)
- [GST Quick Reference](./GST_INVOICING_QUICK_REFERENCE.md)

**Technical:**
- API documentation in respective guides
- Integration guides (coming soon)
- Developer portal (dev.nearbybazaar.com)

---

## Version History

- **v1.0** (October 2024) - Initial B2B platform launch
  - Bulk pricing with tiered discounts
  - RFQ system
  - Credit terms (Net 30/60)
  - B2B analytics dashboards
  - GST-compliant invoicing

---

**Last Updated**: October 2024  
**Maintained By**: NearbyBazaar Platform Team

---

*For the latest updates, visit [NearbyBazaar Documentation](https://docs.nearbybazaar.com)*
