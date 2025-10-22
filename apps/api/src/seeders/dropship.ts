/**
 * Dropshipping Seeder
 *
 * Seeds sample suppliers, SKU mappings, and margin rules for development.
 * Safe to run multiple times - uses upsert logic to avoid duplicates.
 *
 * Usage:
 *   pnpm --filter @nearbybazaar/api seed:dropship
 *   pnpm --filter @nearbybazaar/api seed:all
 */

import mongoose from 'mongoose';
import { Supplier } from '../models/Supplier';
import { SkuMapping } from '../models/SkuMapping';
import MarginRule from '../models/MarginRule';

/**
 * Sample suppliers for development
 */
const SAMPLE_SUPPLIERS = [
  {
    companyName: 'Tech Wholesale Inc',
    contactName: 'Alice Johnson',
    email: 'alice@techwholesale.com',
    taxId: 'EIN-12-3456789',
    address: '1000 Technology Drive, San Jose, CA 95134',
    phone: '+1-408-555-0100',
    status: 'active',
    approvedAt: new Date('2025-01-15'),
    apiEndpoint: 'https://api.techwholesale.com',
    apiKey: 'tw_test_key_abc123',
    webhookUrl: 'https://api.nearbybazaar.com/webhooks/techwholesale',
  },
  {
    companyName: 'Global Gadgets Supply',
    contactName: 'Bob Chen',
    email: 'bob@globalgadgets.com',
    taxId: 'EIN-98-7654321',
    address: '500 Innovation Blvd, Austin, TX 78701',
    phone: '+1-512-555-0200',
    status: 'active',
    approvedAt: new Date('2025-02-01'),
    apiEndpoint: 'https://api.globalgadgets.com',
    apiKey: 'gg_test_key_xyz789',
    webhookUrl: 'https://api.nearbybazaar.com/webhooks/globalgadgets',
  },
  {
    companyName: 'Home & Garden Direct',
    contactName: 'Carol Martinez',
    email: 'carol@homegardenirect.com',
    taxId: 'EIN-45-6789012',
    address: '250 Commerce Way, Portland, OR 97201',
    phone: '+1-503-555-0300',
    status: 'active',
    approvedAt: new Date('2025-02-10'),
    apiEndpoint: 'https://api.homegardenirect.com',
    apiKey: 'hgd_test_key_def456',
  },
  {
    companyName: 'Fashion Wholesale Hub',
    contactName: 'David Kim',
    email: 'david@fashionhub.com',
    taxId: 'EIN-78-9012345',
    address: '800 Style Avenue, New York, NY 10018',
    phone: '+1-212-555-0400',
    status: 'pending',
    invitedAt: new Date('2025-03-01'),
  },
  {
    companyName: 'Sports Gear Suppliers',
    contactName: 'Emma Davis',
    email: 'emma@sportsgearsuppliers.com',
    taxId: 'EIN-23-4567890',
    address: '1200 Athletic Court, Denver, CO 80202',
    phone: '+1-303-555-0500',
    status: 'invited',
    invitedAt: new Date('2025-03-15'),
  },
];

/**
 * Sample SKU mappings (linking platform SKUs to supplier SKUs)
 */
const SAMPLE_SKU_MAPPINGS = [
  // Tech Wholesale Inc products
  {
    supplierEmail: 'alice@techwholesale.com',
    supplierSku: 'TW-LAPTOP-001',
    ourSku: 'NB-LAPTOP-DELL-XPS13',
    status: 'active',
  },
  {
    supplierEmail: 'alice@techwholesale.com',
    supplierSku: 'TW-LAPTOP-002',
    ourSku: 'NB-LAPTOP-HP-SPECTRE',
    status: 'active',
  },
  {
    supplierEmail: 'alice@techwholesale.com',
    supplierSku: 'TW-MOUSE-101',
    ourSku: 'NB-MOUSE-LOGITECH-MX3',
    status: 'active',
  },
  {
    supplierEmail: 'alice@techwholesale.com',
    supplierSku: 'TW-KEYBOARD-201',
    ourSku: 'NB-KEYBOARD-MECHANICAL-RGB',
    status: 'active',
  },
  {
    supplierEmail: 'alice@techwholesale.com',
    supplierSku: 'TW-MONITOR-301',
    ourSku: 'NB-MONITOR-4K-27INCH',
    status: 'active',
  },

  // Global Gadgets Supply products
  {
    supplierEmail: 'bob@globalgadgets.com',
    supplierSku: 'GG-PHONE-CASE-A12',
    ourSku: 'NB-CASE-IPHONE15-PRO',
    status: 'active',
  },
  {
    supplierEmail: 'bob@globalgadgets.com',
    supplierSku: 'GG-CHARGER-USB-C',
    ourSku: 'NB-CHARGER-USBC-65W',
    status: 'active',
  },
  {
    supplierEmail: 'bob@globalgadgets.com',
    supplierSku: 'GG-EARBUDS-PRO',
    ourSku: 'NB-EARBUDS-WIRELESS-ANC',
    status: 'active',
  },
  {
    supplierEmail: 'bob@globalgadgets.com',
    supplierSku: 'GG-SMARTWATCH-V2',
    ourSku: 'NB-WATCH-FITNESS-TRACKER',
    status: 'active',
  },
  {
    supplierEmail: 'bob@globalgadgets.com',
    supplierSku: 'GG-TABLET-10IN',
    ourSku: 'NB-TABLET-ANDROID-10INCH',
    status: 'active',
  },

  // Home & Garden Direct products
  {
    supplierEmail: 'carol@homegardenirect.com',
    supplierSku: 'HGD-PLANT-STAND-WOOD',
    ourSku: 'NB-PLANTSTAND-BAMBOO-3TIER',
    status: 'active',
  },
  {
    supplierEmail: 'carol@homegardenirect.com',
    supplierSku: 'HGD-GARDEN-TOOLS-SET',
    ourSku: 'NB-TOOLSET-GARDEN-10PC',
    status: 'active',
  },
  {
    supplierEmail: 'carol@homegardenirect.com',
    supplierSku: 'HGD-PLANTER-CERAMIC-LG',
    ourSku: 'NB-PLANTER-CERAMIC-LARGE',
    status: 'active',
  },
  {
    supplierEmail: 'carol@homegardenirect.com',
    supplierSku: 'HGD-WATERING-CAN-2GAL',
    ourSku: 'NB-WATERINGCAN-METAL-2GAL',
    status: 'active',
  },
  {
    supplierEmail: 'carol@homegardenirect.com',
    supplierSku: 'HGD-HOSE-EXPANDABLE-50FT',
    ourSku: 'NB-HOSE-EXPANDABLE-50FT',
    status: 'active',
  },
];

/**
 * Sample margin rules for different suppliers and categories
 */
const SAMPLE_MARGIN_RULES = [
  // Tech Wholesale - Default 25% margin
  {
    supplierEmail: 'alice@techwholesale.com',
    category: null,
    marginType: 'percent' as const,
    value: 25,
    description: 'Default margin for Tech Wholesale products',
  },

  // Tech Wholesale - Higher margin for accessories
  {
    supplierEmail: 'alice@techwholesale.com',
    category: 'accessories',
    marginType: 'percent' as const,
    value: 40,
    description: 'Higher margin for tech accessories',
  },

  // Global Gadgets - 30% margin
  {
    supplierEmail: 'bob@globalgadgets.com',
    category: null,
    marginType: 'percent' as const,
    value: 30,
    description: 'Default margin for Global Gadgets products',
  },

  // Home & Garden - Fixed $10 margin for lower-priced items
  {
    supplierEmail: 'carol@homegardenirect.com',
    category: 'tools',
    marginType: 'fixed' as const,
    value: 10,
    description: 'Fixed margin for garden tools',
  },

  // Home & Garden - 35% margin for decorative items
  {
    supplierEmail: 'carol@homegardenirect.com',
    category: 'decor',
    marginType: 'percent' as const,
    value: 35,
    description: 'Higher margin for decorative items',
  },
];

/**
 * Main seeder function
 */
export async function seedDropship() {
  try {
    console.log('🌱 Starting dropship seeder...\n');

    // Connect to database if not already connected
    if (mongoose.connection.readyState === 0) {
      const mongoUrl = process.env.MONGO_URL || 'mongodb://localhost:27017/nearbybazaar';
      await mongoose.connect(mongoUrl);
      console.log('✅ Connected to MongoDB\n');
    }

    // Seed suppliers
    console.log('📦 Seeding suppliers...');
    const supplierMap = new Map<string, any>();

    for (const supplierData of SAMPLE_SUPPLIERS) {
      const existing = await Supplier.findOne({ email: supplierData.email });

      if (existing) {
        // Update existing supplier
        await Supplier.updateOne({ email: supplierData.email }, { $set: supplierData });
        supplierMap.set(supplierData.email, existing);
        console.log(`  ↻ Updated: ${supplierData.companyName} (${supplierData.status})`);
      } else {
        // Create new supplier
        const supplier = await Supplier.create(supplierData);
        supplierMap.set(supplierData.email, supplier);
        console.log(`  ✓ Created: ${supplierData.companyName} (${supplierData.status})`);
      }
    }

    console.log(`\n✅ Seeded ${SAMPLE_SUPPLIERS.length} suppliers\n`);

    // Seed SKU mappings
    console.log('🔗 Seeding SKU mappings...');
    let createdMappings = 0;
    let updatedMappings = 0;

    for (const mappingData of SAMPLE_SKU_MAPPINGS) {
      const supplier = supplierMap.get(mappingData.supplierEmail);

      if (!supplier) {
        console.log(`  ⚠️  Skipping mapping: Supplier not found (${mappingData.supplierEmail})`);
        continue;
      }

      const existing = await SkuMapping.findOne({
        supplierId: String(supplier._id),
        supplierSku: mappingData.supplierSku,
      });

      if (existing) {
        // Update existing mapping
        await SkuMapping.updateOne(
          { _id: existing._id },
          {
            $set: {
              ourSku: mappingData.ourSku,
              status: mappingData.status,
            },
          },
        );
        updatedMappings++;
        console.log(`  ↻ Updated: ${mappingData.ourSku} ← ${mappingData.supplierSku}`);
      } else {
        // Create new mapping
        await SkuMapping.create({
          supplierId: String(supplier._id),
          supplierSku: mappingData.supplierSku,
          ourSku: mappingData.ourSku,
          status: mappingData.status || 'active',
        });
        createdMappings++;
        console.log(`  ✓ Created: ${mappingData.ourSku} ← ${mappingData.supplierSku}`);
      }
    }

    console.log(
      `\n✅ Seeded SKU mappings (${createdMappings} created, ${updatedMappings} updated)\n`,
    );

    // Seed margin rules (using a dummy vendor ID for now)
    console.log('💰 Seeding margin rules...');
    const dummyVendorId = new mongoose.Types.ObjectId(); // In real app, use actual vendor
    let createdRules = 0;
    let updatedRules = 0;

    for (const ruleData of SAMPLE_MARGIN_RULES) {
      const supplier = supplierMap.get(ruleData.supplierEmail);

      if (!supplier) {
        console.log(`  ⚠️  Skipping rule: Supplier not found (${ruleData.supplierEmail})`);
        continue;
      }

      const query: any = {
        vendorId: dummyVendorId,
        supplierId: supplier._id,
      };

      if (ruleData.category) {
        query.category = ruleData.category;
      } else {
        query.category = { $exists: false };
      }

      const existing = await MarginRule.findOne(query);

      if (existing) {
        // Update existing rule
        await MarginRule.updateOne(
          { _id: existing._id },
          {
            $set: {
              marginType: ruleData.marginType,
              value: ruleData.value,
              active: true,
            },
          },
        );
        updatedRules++;
        console.log(
          `  ↻ Updated: ${ruleData.description} (${ruleData.marginType}: ${ruleData.value})`,
        );
      } else {
        // Create new rule
        await MarginRule.create({
          vendorId: dummyVendorId,
          supplierId: supplier._id,
          category: ruleData.category,
          marginType: ruleData.marginType,
          value: ruleData.value,
          active: true,
        });
        createdRules++;
        console.log(
          `  ✓ Created: ${ruleData.description} (${ruleData.marginType}: ${ruleData.value})`,
        );
      }
    }

    console.log(`\n✅ Seeded margin rules (${createdRules} created, ${updatedRules} updated)\n`);

    // Summary
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ Dropship seeding completed successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`\n📊 Summary:`);
    console.log(`   • Suppliers: ${SAMPLE_SUPPLIERS.length} total`);
    console.log(`     - Active: ${SAMPLE_SUPPLIERS.filter((s) => s.status === 'active').length}`);
    console.log(`     - Pending: ${SAMPLE_SUPPLIERS.filter((s) => s.status === 'pending').length}`);
    console.log(`     - Invited: ${SAMPLE_SUPPLIERS.filter((s) => s.status === 'invited').length}`);
    console.log(`   • SKU Mappings: ${createdMappings + updatedMappings} total`);
    console.log(`     - Created: ${createdMappings}`);
    console.log(`     - Updated: ${updatedMappings}`);
    console.log(`   • Margin Rules: ${createdRules + updatedRules} total`);
    console.log(`     - Created: ${createdRules}`);
    console.log(`     - Updated: ${updatedRules}`);
    console.log(`\n💡 Next steps:`);
    console.log(`   • View suppliers: GET /api/dropship/suppliers`);
    console.log(`   • View mappings: GET /api/dropship/mappings`);
    console.log(`   • View margin rules: GET /api/dropship/margin-rules`);
    console.log(`   • Run tests: pnpm --filter @nearbybazaar/api test dropship.spec.ts`);
    console.log('');
  } catch (error) {
    console.error('❌ Error seeding dropship data:', error);
    throw error;
  }
}

/**
 * Run seeder if executed directly
 */
if (require.main === module) {
  seedDropship()
    .then(() => {
      console.log('Seeding complete. Disconnecting...');
      return mongoose.disconnect();
    })
    .then(() => {
      console.log('Disconnected from MongoDB');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Seeding failed:', error);
      process.exit(1);
    });
}
