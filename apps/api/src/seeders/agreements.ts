import { AgreementModel } from '../models/Agreement';

/**
 * Seed initial compliance agreements.
 */
export async function seedAgreements() {
    const existingSLA = await AgreementModel.findOne({ type: 'sla', version: '1.0' });
    if (!existingSLA) {
        await AgreementModel.create({
            type: 'sla',
            version: '1.0',
            title: 'Service Level Agreement v1.0',
            content: `
# Service Level Agreement

## 1. Order Processing
- Orders must be processed within 24 hours
- Shipping updates must be provided within 48 hours

## 2. Product Quality
- All products must match descriptions
- Defect rate must not exceed 2%

## 3. Response Time
- Customer inquiries must be responded to within 12 hours
      `.trim(),
            effectiveDate: new Date('2025-01-01'),
        });
    }

    const existingCompliance = await AgreementModel.findOne({ type: 'compliance', version: '1.0' });
    if (!existingCompliance) {
        await AgreementModel.create({
            type: 'compliance',
            version: '1.0',
            title: 'Compliance Terms v1.0',
            content: `
# Compliance Terms

## 1. Data Protection
- All customer data must be handled in accordance with GDPR
- No data sharing with third parties without consent

## 2. Product Authenticity
- All products must be genuine and not counterfeit
- Proper licensing for branded products required

## 3. Tax Compliance
- All tax obligations must be met
- Proper invoicing required for all transactions
      `.trim(),
            effectiveDate: new Date('2025-01-01'),
        });
    }

    console.log('Agreement seeding completed');
}
