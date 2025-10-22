/**
 * B2B Sample Data Seeder
 * Seeds sample B2B products, buyers, RFQs, and orders for development/demo
 */

import { User } from '../models/User';
import { Product } from '../models/Product';
import { Order } from '../models/Order';
import { BuyerCredit, PaymentTermTemplate } from '../models/CreditTerm';

/**
 * Seed payment term templates
 */
export async function seedPaymentTerms() {
  console.log('Seeding payment term templates...');

  const templates = [
    {
      name: 'Full Advance',
      type: 'full_advance',
      advancePercentage: 100,
      daysUntilDue: 0,
      lateFeePercentage: 0,
      minOrderValue: 0,
      requiresApproval: false,
      isActive: true,
    },
    {
      name: '30% Advance, 70% on Delivery',
      type: 'partial_advance',
      advancePercentage: 30,
      daysUntilDue: 0,
      lateFeePercentage: 2,
      minOrderValue: 10000,
      requiresApproval: false,
      isActive: true,
    },
    {
      name: 'Net 30',
      type: 'net_days',
      advancePercentage: 0,
      netDays: 30,
      daysUntilDue: 30,
      lateFeePercentage: 2,
      minOrderValue: 25000,
      requiresApproval: true,
      isActive: true,
    },
    {
      name: 'Net 60',
      type: 'net_days',
      advancePercentage: 0,
      netDays: 60,
      daysUntilDue: 60,
      lateFeePercentage: 2,
      minOrderValue: 50000,
      requiresApproval: true,
      isActive: true,
    },
    {
      name: 'Cash on Delivery',
      type: 'cod',
      advancePercentage: 0,
      daysUntilDue: 0,
      lateFeePercentage: 0,
      minOrderValue: 0,
      requiresApproval: false,
      isActive: true,
    },
  ];

  for (const template of templates) {
    await PaymentTermTemplate.findOneAndUpdate({ name: template.name }, template, {
      upsert: true,
      new: true,
    });
  }

  console.log(`✓ Seeded ${templates.length} payment term templates`);
}

/**
 * Seed sample B2B buyer accounts
 */
export async function seedB2BBuyers() {
  console.log('Seeding B2B buyer accounts...');

  const buyers = [
    {
      email: 'rajesh@kumarmfg.com',
      name: 'Rajesh Kumar',
      companyName: 'Kumar Manufacturing Pvt Ltd',
      gstin: '27AABCK1234F1Z5',
      pan: 'AABCK1234F',
      industry: 'manufacturing',
      region: 'north',
      phone: '+919876543210',
      address: {
        street: 'Plot 123, Industrial Area',
        city: 'Delhi',
        state: 'Delhi',
        pincode: '110001',
        country: 'India',
      },
      isBusinessAccount: true,
      role: 'buyer',
    },
    {
      email: 'priya@sharmaretail.com',
      name: 'Priya Sharma',
      companyName: 'Sharma Retail Chain',
      gstin: '27AABCS5678G2Z6',
      pan: 'AABCS5678G',
      industry: 'retail',
      region: 'west',
      phone: '+919876543211',
      address: {
        street: 'Shop 45, Market Complex',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400001',
        country: 'India',
      },
      isBusinessAccount: true,
      role: 'buyer',
    },
    {
      email: 'amit@techservices.com',
      name: 'Amit Patel',
      companyName: 'Tech Services India',
      gstin: '24AABCT9012H3Z7',
      pan: 'AABCT9012H',
      industry: 'services',
      region: 'west',
      phone: '+919876543212',
      address: {
        street: 'Office 301, IT Park',
        city: 'Ahmedabad',
        state: 'Gujarat',
        pincode: '380001',
        country: 'India',
      },
      isBusinessAccount: true,
      role: 'buyer',
    },
  ];

  const createdBuyers = [];
  for (const buyer of buyers) {
    const existingUser = await User.findOne({ email: buyer.email });
    if (existingUser) {
      createdBuyers.push(existingUser);
    } else {
      const newUser = await User.create(buyer);
      createdBuyers.push(newUser);
    }
  }

  console.log(`✓ Seeded ${createdBuyers.length} B2B buyer accounts`);
  return createdBuyers;
}

/**
 * Seed B2B products with tiered pricing
 */
export async function seedB2BProducts() {
  console.log('Seeding B2B products with tiered pricing...');

  const products = [
    {
      name: 'Industrial Steel Pipes (Grade A)',
      slug: 'industrial-steel-pipes-grade-a',
      description:
        'High-quality steel pipes for industrial use. Available in bulk quantities with tiered pricing.',
      category: 'industrial-supplies',
      sku: 'ISP-GA-001',

      // Retail pricing
      price: 150,
      currency: 'INR',
      stock: 5000,
      minOrderQty: 1,

      // Wholesale/Bulk pricing tiers
      wholesalePricing: [
        { minQty: 100, price: 135, discount: 10 },
        { minQty: 500, price: 120, discount: 20 },
        { minQty: 1000, price: 105, discount: 30 },
      ],

      // B2B flags
      availableForWholesale: true,
      wholesaleOnly: false,

      specifications: {
        material: 'Steel',
        grade: 'A',
        length: '6 meters',
        diameter: '2 inches',
        weight: '5 kg/piece',
      },

      tags: ['industrial', 'steel', 'pipes', 'wholesale', 'bulk'],
      isActive: true,
    },
    {
      name: 'Cotton T-Shirts (Bulk Pack - 100 pcs)',
      slug: 'cotton-tshirts-bulk-pack',
      description:
        'Plain cotton t-shirts in assorted sizes. Ideal for retail stores, events, and corporate gifting.',
      category: 'apparel',
      sku: 'CTB-100-001',

      price: 15000, // ₹150 per piece
      currency: 'INR',
      stock: 200, // 200 packs
      minOrderQty: 1, // 1 pack = 100 pieces

      wholesalePricing: [
        { minQty: 5, price: 13500, discount: 10 }, // 5 packs = 500 pieces
        { minQty: 10, price: 12000, discount: 20 }, // 10 packs = 1000 pieces
        { minQty: 20, price: 10500, discount: 30 }, // 20 packs = 2000 pieces
      ],

      availableForWholesale: true,
      wholesaleOnly: false,

      specifications: {
        material: '100% Cotton',
        sizes: 'S, M, L, XL, XXL (20 pcs each)',
        colors: 'White, Black (50 pcs each)',
        gsm: '180 GSM',
      },

      tags: ['apparel', 'tshirts', 'cotton', 'bulk', 'wholesale'],
      isActive: true,
    },
    {
      name: 'Electronics Components Kit (Wholesale Only)',
      slug: 'electronics-components-kit-wholesale',
      description:
        'Comprehensive kit with resistors, capacitors, LEDs, and more. Minimum order: 50 kits.',
      category: 'electronics',
      sku: 'ECK-W-001',

      price: 2500,
      currency: 'INR',
      stock: 1000,
      minOrderQty: 50, // Wholesale minimum

      wholesalePricing: [
        { minQty: 50, price: 2250, discount: 10 },
        { minQty: 100, price: 2000, discount: 20 },
        { minQty: 200, price: 1750, discount: 30 },
      ],

      availableForWholesale: true,
      wholesaleOnly: true, // Cannot be purchased at retail

      specifications: {
        components: '500+ pieces',
        categories: 'Resistors, Capacitors, LEDs, Transistors, ICs',
        packaging: 'Organized storage box',
      },

      tags: ['electronics', 'components', 'wholesale-only', 'bulk'],
      isActive: true,
    },
    {
      name: 'Office Furniture Set (Bulk Order)',
      slug: 'office-furniture-set-bulk',
      description:
        'Complete office furniture set including desk, chair, and storage. Bulk orders for corporate offices.',
      category: 'furniture',
      sku: 'OFS-B-001',

      price: 25000,
      currency: 'INR',
      stock: 500,
      minOrderQty: 10, // Minimum 10 sets

      wholesalePricing: [
        { minQty: 10, price: 22500, discount: 10 },
        { minQty: 25, price: 20000, discount: 20 },
        { minQty: 50, price: 17500, discount: 30 },
      ],

      availableForWholesale: true,
      wholesaleOnly: false,

      specifications: {
        includes: 'Desk (4x2 ft), Ergonomic Chair, Mobile Pedestal',
        material: 'Engineered Wood, Metal Frame',
        warranty: '2 years',
      },

      tags: ['furniture', 'office', 'corporate', 'bulk'],
      isActive: true,
    },
  ];

  const createdProducts = [];
  for (const product of products) {
    const existing = await Product.findOne({ sku: product.sku });
    if (existing) {
      createdProducts.push(existing);
    } else {
      const newProduct = await Product.create(product);
      createdProducts.push(newProduct);
    }
  }

  console.log(`✓ Seeded ${createdProducts.length} B2B products`);
  return createdProducts;
}

/**
 * Seed sample RFQs (Request for Quotation)
 */
export async function seedSampleRFQs(buyers: any[], products: any[]) {
  console.log('Seeding sample RFQs...');

  // Note: RFQ model needs to be created if not exists
  // For now, we'll create placeholder data structure

  const rfqs = [
    {
      buyerId: buyers[0]._id,
      buyerName: buyers[0].name,
      buyerCompany: buyers[0].companyName,
      buyerEmail: buyers[0].email,
      buyerPhone: buyers[0].phone,

      productId: products[0]._id,
      productName: products[0].name,
      productSku: products[0].sku,

      quantity: 500,
      targetPrice: 120, // Looking for ₹120 per piece
      deliveryLocation: 'Delhi, India',
      neededBy: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now

      requirements:
        'Need 500 steel pipes for construction project. Looking for best price with 30-day payment terms.',
      industry: 'manufacturing',
      region: 'north',

      status: 'open',
      createdAt: new Date(),
    },
    {
      buyerId: buyers[1]._id,
      buyerName: buyers[1].name,
      buyerCompany: buyers[1].companyName,
      buyerEmail: buyers[1].email,
      buyerPhone: buyers[1].phone,

      productId: products[1]._id,
      productName: products[1].name,
      productSku: products[1].sku,

      quantity: 20, // 20 packs = 2000 pieces
      targetPrice: 11000, // Looking for ₹11,000 per pack
      deliveryLocation: 'Mumbai, India',
      neededBy: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),

      requirements:
        'Need 2000 cotton t-shirts for retail chain. Require customization with our logo. Net 30 payment terms preferred.',
      industry: 'retail',
      region: 'west',

      status: 'open',
      createdAt: new Date(),
    },
  ];

  console.log(`✓ Created ${rfqs.length} sample RFQs (data structure only)`);
  return rfqs;
}

/**
 * Seed approved buyer credit accounts
 */
export async function seedBuyerCredit(buyers: any[]) {
  console.log('Seeding buyer credit accounts...');

  const net30Term = await PaymentTermTemplate.findOne({ type: 'net_days', netDays: 30 });

  const credits = [
    {
      userId: buyers[0]._id,
      creditLimit: 500000, // ₹5,00,000
      availableCredit: 500000,
      outstandingAmount: 0,
      totalCreditUsed: 0,
      approvedBy: 'admin',
      approvedAt: new Date(),
      defaultPaymentTermId: net30Term?._id,
      maxNetDays: 30,
      creditScore: 750,
      riskLevel: 'low',
      status: 'approved',
      notes: 'Established manufacturing company with good payment history',
    },
    {
      userId: buyers[1]._id,
      creditLimit: 300000, // ₹3,00,000
      availableCredit: 300000,
      outstandingAmount: 0,
      totalCreditUsed: 0,
      approvedBy: 'admin',
      approvedAt: new Date(),
      defaultPaymentTermId: net30Term?._id,
      maxNetDays: 30,
      creditScore: 720,
      riskLevel: 'low',
      status: 'approved',
      notes: 'Growing retail chain with multiple stores',
    },
  ];

  for (const credit of credits) {
    await BuyerCredit.findOneAndUpdate({ userId: credit.userId }, credit, {
      upsert: true,
      new: true,
    });
  }

  console.log(`✓ Seeded ${credits.length} buyer credit accounts`);
}

/**
 * Seed sample bulk orders
 */
export async function seedBulkOrders(buyers: any[], products: any[]) {
  console.log('Seeding sample bulk orders...');

  const orders = [
    {
      user: buyers[0]._id,
      items: [
        {
          product: products[0]._id,
          quantity: 500,
          price: 120, // Tier 2 pricing
          total: 60000,
        },
      ],
      subtotal: 60000,
      tax: 10800, // 18% GST
      total: 70800,
      currency: 'INR',

      // B2B flags
      isBulkOrder: true,
      bulkOrderType: 'wholesale',
      businessAccount: true,
      industry: 'manufacturing',
      region: 'north',

      // Payment terms
      paymentTerms: {
        type: 'net_days',
        netDays: 30,
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
      creditUsed: 70800,
      outstandingAmount: 70800,
      paidAmount: 0,
      paymentStatus: 'unpaid',

      status: 'confirmed',
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
    },
    {
      user: buyers[1]._id,
      items: [
        {
          product: products[1]._id,
          quantity: 10,
          price: 12000, // Tier 2 pricing
          total: 120000,
        },
      ],
      subtotal: 120000,
      tax: 21600, // 18% GST
      total: 141600,
      currency: 'INR',

      isBulkOrder: true,
      bulkOrderType: 'wholesale',
      businessAccount: true,
      industry: 'retail',
      region: 'west',

      paymentTerms: {
        type: 'partial_advance',
        advancePercentage: 30,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
      creditUsed: 0,
      outstandingAmount: 99120, // 70% balance
      paidAmount: 42480, // 30% advance
      paymentStatus: 'partial',

      status: 'confirmed',
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    },
    {
      user: buyers[2]._id,
      items: [
        {
          product: products[2]._id,
          quantity: 100,
          price: 2000, // Tier 2 pricing
          total: 200000,
        },
      ],
      subtotal: 200000,
      tax: 36000,
      total: 236000,
      currency: 'INR',

      isBulkOrder: true,
      bulkOrderType: 'contract',
      businessAccount: true,
      industry: 'services',
      region: 'west',

      paymentTerms: {
        type: 'full_advance',
      },
      creditUsed: 0,
      outstandingAmount: 0,
      paidAmount: 236000,
      paymentStatus: 'paid',

      status: 'completed',
      createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
    },
  ];

  for (const order of orders) {
    await Order.create(order);
  }

  console.log(`✓ Seeded ${orders.length} bulk orders`);
}

/**
 * Main seeder function
 */
export async function seedB2BData() {
  try {
    console.log('\n=== Seeding B2B Sample Data ===\n');

    await seedPaymentTerms();
    const buyers = await seedB2BBuyers();
    const products = await seedB2BProducts();
    await seedSampleRFQs(buyers, products);
    await seedBuyerCredit(buyers);
    await seedBulkOrders(buyers, products);

    console.log('\n✓ B2B sample data seeding complete!\n');
    console.log('Sample accounts:');
    console.log('  - rajesh@kumarmfg.com (Manufacturing, ₹5L credit)');
    console.log('  - priya@sharmaretail.com (Retail, ₹3L credit)');
    console.log('  - amit@techservices.com (Services)');
    console.log('\nSample products with tiered pricing available in catalog');
    console.log('Sample RFQs and bulk orders created for analytics\n');
  } catch (error) {
    console.error('Error seeding B2B data:', error);
    throw error;
  }
}

// Run seeder if called directly
if (require.main === module) {
  // Import DB connection
  const mongoose = require('mongoose');

  mongoose
    .connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/nearbybazaar')
    .then(async () => {
      await seedB2BData();
      await mongoose.disconnect();
      process.exit(0);
    })
    .catch((error: Error) => {
      console.error('Database connection error:', error);
      process.exit(1);
    });
}
