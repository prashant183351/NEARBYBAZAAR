# B2B Vendor Guide

## Complete Guide to Managing B2B Sales on NearbyBazaar

Welcome to NearbyBazaar's B2B vendor portal! This guide will help you set up bulk pricing, handle RFQs, manage credit sales, and optimize your B2B operations.

---

## Table of Contents

1. [Getting Started with B2B](#getting-started-with-b2b)
2. [Setting Up Bulk Pricing](#setting-up-bulk-pricing)
3. [Managing RFQs](#managing-rfqs)
4. [Credit Sales & Payment Terms](#credit-sales--payment-terms)
5. [B2B Order Management](#b2b-order-management)
6. [Using B2B Analytics](#using-b2b-analytics)
7. [GST & Tax Compliance](#gst--tax-compliance)
8. [Best Practices](#best-practices)
9. [FAQ](#faq)

---

## Getting Started with B2B

### Why Sell B2B?

**Benefits:**
- **Higher Order Values**: Bulk orders typically 10-50x retail sales
- **Predictable Revenue**: B2B customers order regularly
- **Lower Marketing Costs**: Fewer customers, higher revenue per customer
- **Credit Terms**: Get paid even before delivery with proper terms
- **Bulk Shipping**: Lower per-unit shipping costs

**Example:**
```
Retail: 100 customers × ₹500 = ₹50,000
B2B: 5 customers × ₹25,000 = ₹1,25,000 (same products)
```

### Enabling B2B Features

1. Log in to **Vendor Dashboard**
2. Go to **Settings > B2B Configuration**
3. Enable **"B2B Sales"** toggle
4. Complete your business profile:
   - GSTIN (required for B2B invoicing)
   - Manufacturing/Trading License
   - Bank account for settlements
   - Credit policy preferences

### B2B Account Requirements

To sell B2B, you must have:
- ✅ Verified GSTIN
- ✅ Complete business profile
- ✅ Minimum 10 products listed
- ✅ Average rating ≥ 4.0 stars
- ✅ Bank account verified

---

## Setting Up Bulk Pricing

### Understanding Tiered Pricing

Bulk pricing uses **quantity tiers** with automatic discounts:

**Example: Your Product**
```
Base Price: ₹100 per unit
Tier 1 (100-499): ₹90 per unit (10% off)
Tier 2 (500-999): ₹80 per unit (20% off)
Tier 3 (1000+): ₹70 per unit (30% off)
```

**Buyer sees:**
- 1 unit: ₹100
- 100 units: ₹9,000 (₹90 each) - saves ₹1,000
- 500 units: ₹40,000 (₹80 each) - saves ₹10,000

### Creating Tiered Pricing

#### Method 1: Product-by-Product

1. Go to **Products > Edit Product**
2. Scroll to **"Bulk Pricing"** section
3. Click **"Add Tier"**
4. Fill in:
   - **Min Quantity**: Minimum units for this tier
   - **Price**: Discounted price per unit
   - **Discount %**: Auto-calculated (or enter manually)
5. **Add more tiers** (recommended: 3-4 tiers)
6. **Save** changes

**Best Practice Tiers:**
```
Tier 1: 10-20% MOQ of your typical stock
Tier 2: 50% of stock (sweet spot for buyers)
Tier 3: 100% or more (deepest discount)
```

#### Method 2: Bulk Edit (Multiple Products)

1. Go to **Products > Bulk Actions**
2. Select multiple products (checkbox)
3. Click **"Apply Bulk Pricing Template"**
4. Choose template:
   - **Conservative**: 10%, 15%, 20% discounts
   - **Aggressive**: 20%, 25%, 30% discounts
   - **Custom**: Define your own
5. **Preview** changes
6. **Confirm** to apply to all selected

### Wholesale-Only Products

For products with high MOQ (Minimum Order Quantity):

1. Edit product
2. Enable **"Wholesale Only"**
3. Set **Minimum Order Quantity** (e.g., 50 units)
4. Set tiered pricing starting from MOQ
5. **Save**

**Example: Electronics Components Kit**
```
Wholesale Only: Yes
MOQ: 50 kits
Price: ₹2,250 per kit (for 50+)

Tiers:
- 50-99: ₹2,250
- 100-199: ₹2,000
- 200+: ₹1,750
```

**Effect**: Buyers cannot purchase <50 kits. Product hidden from retail search.

### Pricing Strategies

#### 1. Volume Discount Strategy
- **Goal**: Move high inventory
- **Tiers**: Aggressive (20-30% off)
- **Best for**: Seasonal items, overstocked items

#### 2. Margin Protection Strategy
- **Goal**: Maintain profitability
- **Tiers**: Conservative (10-15% off)
- **Best for**: High-demand, low-margin items

#### 3. Market Penetration Strategy
- **Goal**: Acquire B2B customers
- **Tiers**: Loss-leader pricing initially
- **Best for**: New products, new to B2B

#### 4. Dynamic Pricing
- **Adjust tiers** based on:
  - Season (festive season: lower MOQ)
  - Competition (match or beat competitors)
  - Inventory (overstocked: deeper discounts)

### Monitoring Bulk Pricing Performance

**Dashboard > B2B Analytics > Pricing Analysis**

Track:
- **Tier Utilization**: Which tiers buyers use most
- **Average Discount Given**: Should be 15-25%
- **Bulk vs Retail Mix**: Target 60-70% bulk revenue
- **Cart Abandonment**: High = pricing not competitive

**Optimization Tips:**
- If Tier 1 underused: Lower MOQ
- If Tier 3 overused: Add higher tier with deeper discount
- If abandonment high: Check competitor pricing

---

## Managing RFQs

### What is an RFQ?

**Request for Quotation (RFQ)**: Buyer requests custom pricing for:
- Quantities beyond standard tiers
- Product customization
- Special delivery/payment terms
- Products not in your catalog

### Receiving RFQs

**Notifications:**
- Email alert: "New RFQ for [Product Name]"
- Dashboard notification badge
- SMS (if enabled)

**RFQ Details Include:**
- Buyer company and industry
- Product/specifications requested
- Quantity needed
- Target price (if provided)
- Delivery location and date
- Special requirements (customization, etc.)

### Responding to RFQs

#### Step 1: Review RFQ

1. Go to **Dashboard > RFQs**
2. Click on RFQ to view full details
3. Check:
   - Can you fulfill the quantity?
   - Do you have the product (or can source it)?
   - Is delivery timeline feasible?
   - Is target price acceptable (if given)?

#### Step 2: Calculate Your Quote

**Pricing Formula:**
```
Cost per Unit: ₹X
Desired Margin: 20-30%
Quote Price = Cost × (1 + Margin)

Then apply:
- Volume discount (for large quantity)
- Customization fees (if applicable)
- Delivery premium (if rush order)
```

**Example:**
```
Product: Cotton T-Shirts (with logo printing)
Quantity: 5,000 pieces
Cost: ₹60 per piece (₹50 + ₹10 printing)
Margin: 25%
Quote = ₹60 × 1.25 = ₹75 per piece
Total: ₹3,75,000
```

#### Step 3: Submit Quote

1. Click **"Submit Quote"** on RFQ
2. Fill in:
   - **Price per Unit**: ₹75
   - **Total Amount**: ₹3,75,000 (auto-calculated)
   - **Minimum Order Quantity**: 5,000 (from RFQ)
   - **Lead Time**: 15 days (production + delivery)
   - **Payment Terms**: 
     - Full Advance, OR
     - 30% Advance + 70% on Delivery, OR
     - Net 30 (if buyer has credit)
   - **Additional Notes**: "Includes custom logo printing in 2 colors. Free delivery in Mumbai."
3. **Attach samples** (if available): Photos of similar work
4. **Submit** quote

#### Step 4: Negotiation (Optional)

Buyer may counter-offer:
- Lower price requested
- Different payment terms
- Modified specifications

**Your Options:**
- **Accept Counter-Offer**: Update quote and resubmit
- **Reject**: Politely decline with reason
- **Negotiate Further**: Propose middle ground

**Negotiation Tips:**
- Be flexible on payment terms (easier than price)
- Offer volume incentives ("₹72/piece for 6,000+")
- Suggest alternatives ("₹70/piece without custom packaging")

#### Step 5: Quote Accepted

When buyer accepts:
- Order automatically created
- You receive payment (based on agreed terms)
- Fulfill order as per timeline
- Track via **Dashboard > Orders**

### RFQ Best Practices

**Response Time:**
- Respond within **24 hours** (buyers compare multiple vendors)
- Set auto-reply: "We've received your RFQ and will respond within 24 hours."

**Competitive Pricing:**
- Research market rates (check competitor listings)
- Don't undercut too much (low price = low quality perception)
- Justify premium pricing (quality, faster delivery, customization)

**Clear Communication:**
- Ask questions if requirements unclear
- Provide samples/portfolio for custom work
- Set realistic timelines (better to over-deliver than under-promise)

**Professionalism:**
- Use formal language in quotes
- Include terms & conditions
- Provide detailed breakdown (transparent pricing)

### RFQ Analytics

**Dashboard > B2B Analytics > RFQ Performance**

Track:
- **Response Rate**: % of RFQs you responded to
- **Quote Acceptance Rate**: % of your quotes accepted
- **Average Quote Value**: Higher = better quality RFQs
- **Time to Response**: Faster = higher acceptance

**Optimization:**
- Response rate <70%: Enable more notifications
- Acceptance rate <30%: Your pricing may be too high
- Avg quote value low: Focus on high-value RFQs

---

## Credit Sales & Payment Terms

### Why Offer Credit Terms?

**Benefits:**
- **Higher Order Values**: B2B buyers order more with credit
- **Customer Loyalty**: Credit terms lock in repeat business
- **Competitive Advantage**: Not all vendors offer credit
- **Faster Sales Cycle**: No payment delay before shipment

**Risk Mitigation:**
- NearbyBazaar verifies all B2B buyer accounts
- Credit limits set based on buyer's business profile
- Platform guarantees payment (you get paid even if buyer defaults)

### Setting Up Credit Policies

1. Go to **Settings > B2B Configuration > Credit Policy**
2. Choose policies to offer:
   - ✅ Full Advance (pay before shipment)
   - ✅ Partial Advance (30-70, 50-50, etc.)
   - ✅ Net 30 (pay within 30 days)
   - ✅ Net 60 (pay within 60 days)
   - ❌ COD (cash on delivery)
3. Set **minimum order value** for each term:
   ```
   Full Advance: No minimum (₹0)
   Partial: ₹10,000 minimum
   Net 30: ₹25,000 minimum
   Net 60: ₹50,000 minimum
   ```
4. Enable **"Auto-approve"** or **"Manual review"**:
   - Auto: System approves based on buyer's credit limit
   - Manual: You review each credit order before shipment

### How Credit Orders Work

#### Buyer Perspective:
1. Places order with credit terms (e.g., Net 30)
2. No immediate payment required
3. Credit is reserved from their limit
4. Receives invoice with due date

#### Vendor Perspective (You):
1. Receive order notification
2. **Platform pays you immediately** (within 24 hours)
3. Ship order to buyer
4. Platform collects from buyer on due date
5. You're protected from buyer default

**Example Timeline:**
```
Day 1: Buyer orders ₹1,00,000 (Net 30)
Day 2: You receive ₹97,000* in your account
        (*Platform fee: 3%)
Day 3: You ship order
Day 31: Platform collects ₹1,00,000 from buyer
```

### Payment Term Types

#### 1. Full Advance
- **Buyer pays**: 100% before shipment
- **You receive**: Payment before you ship
- **Risk**: None
- **Use case**: New buyers, high-value items, custom orders

#### 2. Partial Advance (30-70 common)
- **Buyer pays**: 30% upfront, 70% on delivery
- **You receive**: 30% immediately, 70% after delivery confirmation
- **Risk**: Low (you shipped, so buyer has product)
- **Use case**: Regular buyers, standard products

#### 3. Net 30
- **Buyer pays**: Full amount within 30 days
- **You receive**: Full amount within 24 hours (platform advance)
- **Risk**: None (platform guarantees)
- **Use case**: Established buyers with good credit

#### 4. Net 60
- **Buyer pays**: Full amount within 60 days
- **You receive**: Full amount within 24 hours (platform advance)
- **Risk**: None (platform guarantees)
- **Use case**: Large enterprises, high-value contracts

### Monitoring Credit Orders

**Dashboard > Orders > Credit Sales**

View:
- **Active credit orders**: Not yet paid by buyer
- **Payment due dates**: When buyer needs to pay
- **Overdue orders**: Buyer missed deadline (platform handles collection)
- **Your payout status**: Track platform payments to you

**Alerts:**
- Green: Order paid by buyer
- Yellow: Payment due soon (7 days)
- Red: Payment overdue (platform collection in progress)

### What if Buyer Defaults?

**You're protected:**
- Platform already paid you (within 24 hours of order)
- Platform handles collection and any legal action
- Your account unaffected

**Platform actions on buyer:**
- Late fees charged (2% per month)
- Credit frozen until paid
- Account suspended if 60+ days overdue

---

## B2B Order Management

### Order Lifecycle

```
1. Order Received → 2. Payment Confirmed → 3. Ready to Ship → 4. Shipped → 5. Delivered → 6. Completed
```

#### 1. Order Received
- Notification sent (email/SMS/dashboard)
- Review order details
- Confirm inventory availability

**Action:**
- Click **"Accept Order"** (within 24 hours)
- Or **"Cancel"** if cannot fulfill

#### 2. Payment Confirmed
- For advance payments: buyer paid
- For credit terms: platform paid you
- Proceed to prepare shipment

#### 3. Ready to Ship
- Pack order
- Generate shipping label (or use your courier)
- Mark **"Ready to Ship"**

#### 4. Shipped
- Enter tracking details
- Buyer receives tracking link
- Update estimated delivery date

#### 5. Delivered
- Courier confirms delivery
- For partial advance: remaining payment released to you
- Buyer can rate/review

#### 6. Completed
- Order closed
- Funds settled to your account
- Analytics updated

### Bulk Order Considerations

**Packaging:**
- Use bulk packaging (pallets, cartons)
- Label clearly with buyer's company name
- Include packing list and invoice inside

**Shipping:**
- Bulk orders may require freight shipping (not courier)
- Coordinate delivery date/time with buyer
- Provide advance notice (24-48 hours)

**Documentation:**
- Commercial invoice (for customs if interstate)
- Delivery challan
- GST invoice (E-way bill if value >₹50,000)
- Quality certificates (if applicable)

### Handling Issues

#### Order Cancellation
- **Before shipment**: Accept cancellation, refund if paid
- **After shipment**: Per your cancellation policy

#### Buyer Requests Changes
- **Before shipment**: Update if feasible
- **After shipment**: Cannot change, offer resolution

#### Quality Disputes
- Buyer claims defect/damage
- **Step 1**: Request photos/video proof
- **Step 2**: Offer resolution:
  - Partial refund (for minor issues)
  - Replacement (if major defect)
  - Return + full refund (last resort)
- **Step 3**: If unresolved, platform mediation

#### Returns
- Accept returns per your policy (e.g., 7 days)
- Buyer ships back (or you arrange pickup)
- Inspect returned items
- Process refund (full or partial based on condition)

---

## Using B2B Analytics

### Accessing Analytics Dashboard

1. Go to **Dashboard > B2B Analytics**
2. Select date range (default: last 30 days)
3. View 4 key sections:
   - Summary Cards
   - Pricing Performance
   - Order Types
   - 30-Day Trend

### Key Metrics Explained

#### 1. Total Bulk Revenue
- Total earnings from bulk orders
- Compare to retail revenue
- **Target**: 60-70% of total revenue from bulk

**Example:**
```
Bulk Revenue: ₹15,00,000 (45 orders)
Retail Revenue: ₹8,00,000 (320 orders)
Bulk %: 65.2% ✅ (Good)
```

#### 2. Bulk vs Retail Orders
- Number of bulk vs retail transactions
- Shows order efficiency

**Example:**
```
Bulk Orders: 45 (avg ₹33,333 each)
Retail Orders: 320 (avg ₹2,500 each)
Efficiency: Bulk orders are 13x more efficient
```

#### 3. Average Bulk Order Value
- Average ₹ per bulk order
- **Target**: ₹15,000 - ₹50,000

**Interpretation:**
- Too low (<₹10,000): Buyers not reaching good tiers
- Just right (₹15-50K): Sweet spot
- Too high (>₹1L): May intimidate small businesses

#### 4. Top Segments
- **Top Order Type**: Wholesale, RFQ, or Contract
- **Top Industry**: Which buyer industries purchase most
- **Top Region**: Geographic concentration

**Use This To:**
- Focus marketing on top industries
- Stock inventory based on regional demand
- Optimize pricing for popular segments

### Pricing Performance

**Dashboard > B2B Analytics > Pricing**

- **Average Discount Given**: Should be 15-25%
  - Too low: Not competitive, losing sales
  - Too high: Eroding margins unnecessarily
- **Most Popular Tier**: Which tier buyers choose
  - Usually Tier 2 (middle tier)
- **Tier Utilization Chart**: Visual of tier usage

### Regional Analysis

**Dashboard > B2B Analytics > Regional**

- **Sales by Region**: North, South, East, West
- **Top Cities**: Where your B2B customers are
- **Growth Trends**: Which regions growing fastest

**Use For:**
- Targeted advertising (focus on high-sales regions)
- Shipping optimization (warehouse near top cities)
- Regional pricing (competitive in each market)

### Industry Breakdown

**Dashboard > B2B Analytics > Industry**

- **Sales by Industry**: Manufacturing, Retail, Services, etc.
- **Average Order Value by Industry**: Who spends most
- **Repeat Purchase Rate**: Most loyal industries

**Use For:**
- Vertical marketing (industry-specific campaigns)
- Product development (what each industry needs)
- Relationship building (account managers for top industries)

### Exporting Data

1. Click **"Export"** in analytics
2. Choose format:
   - **CSV**: For Excel analysis
   - **JSON**: For custom tools
3. Download includes:
   - All order details
   - Buyer information (company, industry)
   - Payment terms used
   - Revenue and margins

**Use Exported Data For:**
- Accounting reconciliation
- Tax filing (GST returns)
- Custom analytics (Excel pivot tables)
- CRM integration (import buyer data)

---

## GST & Tax Compliance

### GST on B2B Sales

**Requirements:**
- You must have valid GSTIN
- Buyer must have valid GSTIN
- Invoice must show both GSTINs

### Invoice Generation

NearbyBazaar auto-generates GST invoices:
- **Your GSTIN** (from profile)
- **Buyer's GSTIN** (from their account)
- **HSN/SAC codes** (from product settings)
- **Tax breakdown**: CGST/SGST or IGST
- **Invoice number**: Auto-sequential

**Your Responsibility:**
- Ensure GSTIN is correct in profile
- Set correct HSN/SAC codes on products
- Report invoices in GSTR-1 monthly return

### Tax Rates

Common GST rates on products:
- **5%**: Essential goods (food grains, etc.)
- **12%**: Processed foods, some electronics
- **18%**: Most products (default)
- **28%**: Luxury items, automobiles

**Set Tax Rate:**
1. Edit product
2. **"Tax Rate"** field: Select 5%, 12%, 18%, or 28%
3. **"HSN Code"**: Enter 6-8 digit code
4. Save

### Intrastate vs Interstate

#### Intrastate (Same State)
- **CGST** + **SGST** (split equally)
- Example (18%): 9% CGST + 9% SGST

#### Interstate (Different State)
- **IGST** (integrated)
- Example (18%): 18% IGST

**System automatically determines** based on buyer's state.

### E-Way Bill

Required for interstate shipments >₹50,000:
1. Order ships to different state
2. Value >₹50,000
3. System prompts: "E-Way Bill Required"
4. Generate on GST portal
5. Enter E-Way Bill number in order

**Penalty for not generating**: ₹10,000 or 100% tax amount (whichever is higher)

### Monthly GST Filing

**Your Process:**
1. **1st-10th of month**: Download all invoices from NearbyBazaar
2. **By 11th**: File GSTR-1 (outward supplies)
3. **By 20th**: File GSTR-3B (summary return)
4. **Pay tax**: Based on GSTR-3B

**NearbyBazaar Helps:**
- Export all invoices with one click
- Pre-formatted for GST returns
- Auto-populated buyer GSTIN (they file GSTR-2)

### Compliance Checklist

Monthly:
- ✅ Download all invoices (1st of month)
- ✅ Reconcile sales with accounting software
- ✅ File GSTR-1 (by 11th)
- ✅ File GSTR-3B (by 20th)
- ✅ Pay tax (by 20th)

Quarterly:
- ✅ Review pricing (ensure competitive)
- ✅ Check credit policies (any issues?)
- ✅ Analyze top buyers (relationship health)

Annually:
- ✅ File GSTR-9 (annual return)
- ✅ Audit financial statements
- ✅ Plan inventory for next year

---

## Best Practices

### Pricing Optimization

**Do:**
- ✅ Research competitor pricing weekly
- ✅ Test different tier structures (A/B testing)
- ✅ Offer seasonal discounts (festive seasons)
- ✅ Bundle complementary products
- ✅ Use analytics to refine tiers monthly

**Don't:**
- ❌ Price below cost (even for bulk)
- ❌ Have too many tiers (3-4 is ideal)
- ❌ Change pricing too frequently (confuses buyers)
- ❌ Ignore shipping costs in calculations

### RFQ Management

**Do:**
- ✅ Respond within 24 hours (faster = higher acceptance)
- ✅ Ask clarifying questions (avoid assumptions)
- ✅ Provide samples/portfolio for custom work
- ✅ Be flexible on payment terms (easier than price)
- ✅ Follow up if no response after 3 days

**Don't:**
- ❌ Over-promise and under-deliver
- ❌ Give unrealistic timelines
- ❌ Ignore RFQs (even if you can't fulfill, respond politely)
- ❌ Be too rigid in negotiation

### Customer Relationships

**Do:**
- ✅ Thank buyers for orders (personal message)
- ✅ Update on order status proactively
- ✅ Offer volume discounts for repeat customers
- ✅ Seek feedback after delivery
- ✅ Resolve issues quickly (within 24 hours)

**Don't:**
- ❌ Go silent after receiving payment
- ❌ Blame buyer for issues (always find solution)
- ❌ Ignore negative reviews (respond professionally)
- ❌ Over-sell capabilities

### Inventory Management

**For Bulk Sales:**
- Maintain 2-3 months of inventory (bulk orders are larger)
- Set stock alerts (low stock = lost bulk sales)
- Communicate lead times clearly (don't promise if out of stock)
- Pre-order system (for seasonal items, get orders before stocking)

### Credit Sales Safety

**Do:**
- ✅ Trust platform's buyer verification
- ✅ Ship immediately after platform payment
- ✅ Keep proof of delivery (tracking, signatures)
- ✅ Monitor overdue orders (even though platform handles)

**Don't:**
- ❌ Delay shipment waiting for buyer payment (you already got paid)
- ❌ Offer credit outside platform (no protection)
- ❌ Ignore repeated cancellations from a buyer (report to platform)

### Tax Compliance

**Do:**
- ✅ File GST returns on time (penalties are high)
- ✅ Maintain 6 years of invoice records
- ✅ Reconcile buyer GSTR-2 with your GSTR-1
- ✅ Set aside tax payments (separate bank account)

**Don't:**
- ❌ Show incorrect GSTIN on invoices
- ❌ Delay payment of collected tax
- ❌ Misclassify products (wrong HSN = wrong tax rate)

---

## FAQ

### Getting Started

**Q: Do I need to register separately for B2B selling?**
A: No, just enable B2B in your vendor dashboard settings.

**Q: Is there a fee for B2B features?**
A: No additional fee. Same commission applies (3-5% depending on category).

**Q: Can I sell both B2B and retail?**
A: Yes, most vendors do both. Retail for consumers, B2B for businesses.

### Pricing

**Q: What discount should I offer for bulk?**
A: Typical: 10-30% off retail. Start with 15% and adjust based on demand.

**Q: Can I have different pricing for different buyer industries?**
A: Not directly, but you can offer custom quotes via RFQ for specific industries.

**Q: How do I change my bulk pricing?**
A: Edit product > Bulk Pricing section > Update tiers > Save. Takes effect immediately.

### RFQs

**Q: What if I can't fulfill an RFQ?**
A: Respond anyway: "Thank you for your inquiry. Unfortunately, we cannot fulfill this quantity/specification at this time. We'd be happy to assist with [alternative]."

**Q: Can I subcontract RFQ fulfillment?**
A: Yes, but you're responsible for quality and delivery. Buyer's agreement is with you.

**Q: How many RFQs should I respond to?**
A: All of them, ideally. Even if declining, respond within 24 hours.

### Credit & Payments

**Q: What if buyer defaults on payment?**
A: You're not affected. Platform already paid you. They handle collections.

**Q: Can I offer credit terms outside the platform?**
A: Not recommended. Platform protection only applies to on-platform orders.

**Q: When do I receive payment for credit orders?**
A: Within 24 hours of order placement (not when buyer pays).

**Q: What are the fees for credit sales?**
A: Same as regular sales (3-5%). No additional credit processing fee.

### Orders & Shipping

**Q: Do I have to ship bulk orders myself?**
A: You can use your own shipping or NearbyBazaar's bulk shipping partners.

**Q: What if buyer wants delivery in multiple locations?**
A: Accept via RFQ, quote separate shipping for each location.

**Q: Can I set minimum order value for B2B?**
A: Yes, in Settings > B2B Config > Minimum Order Value.

### Tax

**Q: Who is responsible for GST filing - me or NearbyBazaar?**
A: You. NearbyBazaar generates invoices, but you must file returns.

**Q: What if buyer's GSTIN is invalid?**
A: Order cannot proceed without valid GSTIN. Buyer must update profile.

**Q: Do I need E-Way Bill for all interstate orders?**
A: Only if value >₹50,000. System will alert you.

---

## Need Help?

### Vendor Support

- **Email**: vendor-support@nearbybazaar.com
- **Phone**: +91-XXXX-XXXXXX (Mon-Sat, 9 AM - 7 PM)
- **Chat**: Dashboard bottom-right corner
- **WhatsApp**: +91-XXXX-XXXXXX

### Training Resources

- **Video Tutorials**: [Vendor Academy](https://academy.nearbybazaar.com)
- **Webinars**: Weekly B2B webinars (register in dashboard)
- **Community Forum**: Connect with other vendors
- **1-on-1 Consultation**: Schedule with account manager

### Documentation

- [B2B Analytics Guide](./B2B_ANALYTICS.md)
- [Setting Up Bulk Pricing](./BULK_PRICING.md)
- [RFQ Handbook](./RFQ_GUIDE.md)
- [GST Compliance Checklist](./GST_COMPLIANCE.md)

---

**Last Updated**: October 2024  
**Version**: 1.0

---

*Happy Selling! 🚀*
