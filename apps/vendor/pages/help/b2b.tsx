/**
 * B2B Help & Training Page
 * Vendor portal help section with documentation, FAQs, and training materials
 */

import React, { useState } from 'react';
import Link from 'next/link';

interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

const faqs: FAQItem[] = [
  // Getting Started
  {
    category: 'Getting Started',
    question: 'How do I enable B2B features?',
    answer: 'Go to Settings > B2B Configuration and toggle "B2B Sales" on. Complete your business profile (GSTIN, bank details) to get started.'
  },
  {
    category: 'Getting Started',
    question: 'What documents do I need for B2B selling?',
    answer: 'You need: Valid GSTIN, GST certificate (PDF), Bank account details, and at least 10 products listed.'
  },
  {
    category: 'Getting Started',
    question: 'How long does approval take?',
    answer: 'B2B feature approval typically takes 24-48 hours after submitting all required documents.'
  },

  // Pricing
  {
    category: 'Pricing',
    question: 'What discount should I offer for bulk orders?',
    answer: 'Typical bulk discounts range from 10-30% off retail price. Start with 15% for Tier 1 and increase for higher tiers. Monitor your analytics to optimize.'
  },
  {
    category: 'Pricing',
    question: 'How do I set up tiered pricing?',
    answer: 'Edit any product → Scroll to "Bulk Pricing" section → Click "Add Tier" → Enter minimum quantity and discounted price → Save. Repeat for multiple tiers.'
  },
  {
    category: 'Pricing',
    question: 'Can I change pricing after setting it up?',
    answer: 'Yes, you can update bulk pricing anytime. Changes take effect immediately for new orders (existing orders use original pricing).'
  },

  // RFQs
  {
    category: 'RFQs',
    question: 'How quickly should I respond to RFQs?',
    answer: 'Respond within 24 hours for best results. Faster responses have significantly higher acceptance rates.'
  },
  {
    category: 'RFQs',
    question: 'What if I can\'t fulfill an RFQ?',
    answer: 'Still respond! Politely decline and suggest alternatives. This builds your reputation and may lead to future opportunities.'
  },
  {
    category: 'RFQs',
    question: 'Can I negotiate after submitting a quote?',
    answer: 'Yes, buyers often counter-offer. Be prepared to negotiate on price, payment terms, or delivery timeline.'
  },

  // Credit & Payments
  {
    category: 'Credit & Payments',
    question: 'Is offering credit terms risky?',
    answer: 'No! The platform pays you within 24 hours of order placement. We handle buyer collections, so you have zero risk.'
  },
  {
    category: 'Credit & Payments',
    question: 'What if a buyer doesn\'t pay on time?',
    answer: 'Not your concern. You already received payment from us. We handle all collections and any late fees.'
  },
  {
    category: 'Credit & Payments',
    question: 'Which payment terms should I offer?',
    answer: 'Start with Full Advance and Partial Advance (30-70). Add Net 30/60 once comfortable with B2B operations.'
  },

  // Orders & Shipping
  {
    category: 'Orders & Shipping',
    question: 'How do I ship bulk orders?',
    answer: 'Use your preferred courier or our bulk shipping partners. For large orders (>50kg), freight shipping is recommended.'
  },
  {
    category: 'Orders & Shipping',
    question: 'Do I need special packaging for bulk orders?',
    answer: 'Use sturdy bulk packaging (cartons, pallets). Label clearly with buyer\'s company name and include invoice/packing list.'
  },

  // Tax & Compliance
  {
    category: 'Tax & Compliance',
    question: 'Who files GST returns - me or NearbyBazaar?',
    answer: 'You are responsible for filing GST returns. We provide GST-compliant invoices that you can use for GSTR-1 filing.'
  },
  {
    category: 'Tax & Compliance',
    question: 'When do I need an E-Way Bill?',
    answer: 'E-Way Bill is required for interstate shipments with value >₹50,000. System will alert you when needed.'
  }
];

const B2BHelpPage: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const categories = ['All', 'Getting Started', 'Pricing', 'RFQs', 'Credit & Payments', 'Orders & Shipping', 'Tax & Compliance'];

  const filteredFAQs = faqs.filter(faq => {
    const matchesCategory = activeCategory === 'All' || faq.category === activeCategory;
    const matchesSearch = searchQuery === '' || 
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '8px' }}>
          B2B Help & Training
        </h1>
        <p style={{ color: '#666', fontSize: '16px' }}>
          Everything you need to master B2B selling on NearbyBazaar
        </p>
      </div>

      {/* Quick Links */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
        gap: '16px',
        marginBottom: '48px'
      }}>
        <div style={{ 
          border: '1px solid #e0e0e0', 
          borderRadius: '8px', 
          padding: '20px',
          backgroundColor: '#f9fafb'
        }}>
          <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '12px' }}>
            📘 Documentation
          </h3>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            <li style={{ marginBottom: '8px' }}>
              <a href="/docs/B2B_VENDOR_GUIDE.md" target="_blank" style={{ color: '#2563eb', textDecoration: 'none' }}>
                Complete Vendor Guide →
              </a>
            </li>
            <li style={{ marginBottom: '8px' }}>
              <a href="/docs/B2B_ANALYTICS.md" target="_blank" style={{ color: '#2563eb', textDecoration: 'none' }}>
                Analytics Documentation →
              </a>
            </li>
            <li style={{ marginBottom: '8px' }}>
              <a href="/docs/PAYMENT_TERMS.md" target="_blank" style={{ color: '#2563eb', textDecoration: 'none' }}>
                Payment Terms Guide →
              </a>
            </li>
            <li>
              <a href="/docs/GST_INVOICING.md" target="_blank" style={{ color: '#2563eb', textDecoration: 'none' }}>
                GST Compliance →
              </a>
            </li>
          </ul>
        </div>

        <div style={{ 
          border: '1px solid #e0e0e0', 
          borderRadius: '8px', 
          padding: '20px',
          backgroundColor: '#f0fdf4'
        }}>
          <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '12px' }}>
            🎓 Training Materials
          </h3>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            <li style={{ marginBottom: '8px' }}>
              <a href="/docs/VENDOR_TRAINING.md" target="_blank" style={{ color: '#16a34a', textDecoration: 'none' }}>
                B2B Sales Mastery Course →
              </a>
            </li>
            <li style={{ marginBottom: '8px' }}>
              <a href="#" style={{ color: '#16a34a', textDecoration: 'none' }}>
                Video Tutorials (Coming Soon) →
              </a>
            </li>
            <li style={{ marginBottom: '8px' }}>
              <a href="#" style={{ color: '#16a34a', textDecoration: 'none' }}>
                Weekly Webinars →
              </a>
            </li>
            <li>
              <a href="#" style={{ color: '#16a34a', textDecoration: 'none' }}>
                Success Stories →
              </a>
            </li>
          </ul>
        </div>

        <div style={{ 
          border: '1px solid #e0e0e0', 
          borderRadius: '8px', 
          padding: '20px',
          backgroundColor: '#fef3c7'
        }}>
          <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '12px' }}>
            🚀 Quick Start
          </h3>
          <ol style={{ paddingLeft: '20px', margin: 0 }}>
            <li style={{ marginBottom: '8px', color: '#92400e' }}>
              Enable B2B in Settings
            </li>
            <li style={{ marginBottom: '8px', color: '#92400e' }}>
              Set up bulk pricing (3-4 tiers)
            </li>
            <li style={{ marginBottom: '8px', color: '#92400e' }}>
              Configure credit policy
            </li>
            <li style={{ color: '#92400e' }}>
              Start receiving orders!
            </li>
          </ol>
          <Link href="/settings/b2b">
            <a style={{ 
              display: 'inline-block',
              marginTop: '16px',
              padding: '8px 16px',
              backgroundColor: '#f59e0b',
              color: 'white',
              borderRadius: '6px',
              textDecoration: 'none',
              fontWeight: '500'
            }}>
              Configure Now →
            </a>
          </Link>
        </div>

        <div style={{ 
          border: '1px solid #e0e0e0', 
          borderRadius: '8px', 
          padding: '20px',
          backgroundColor: '#fef2f2'
        }}>
          <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '12px' }}>
            💬 Get Support
          </h3>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            <li style={{ marginBottom: '8px' }}>
              📧 vendor-support@nearbybazaar.com
            </li>
            <li style={{ marginBottom: '8px' }}>
              📞 +91-XXXX-XXXXXX
            </li>
            <li style={{ marginBottom: '8px' }}>
              💬 Live Chat (bottom-right)
            </li>
            <li>
              🎥 Schedule 1-on-1 Call →
            </li>
          </ul>
        </div>
      </div>

      {/* FAQ Section */}
      <div style={{ marginBottom: '48px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '24px' }}>
          Frequently Asked Questions
        </h2>

        {/* Search */}
        <div style={{ marginBottom: '24px' }}>
          <input
            type="text"
            placeholder="Search FAQs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 16px',
              border: '1px solid #e0e0e0',
              borderRadius: '8px',
              fontSize: '16px'
            }}
          />
        </div>

        {/* Category Tabs */}
        <div style={{ 
          display: 'flex', 
          gap: '8px', 
          marginBottom: '24px',
          flexWrap: 'wrap'
        }}>
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              style={{
                padding: '8px 16px',
                borderRadius: '20px',
                border: '1px solid #e0e0e0',
                backgroundColor: activeCategory === category ? '#2563eb' : 'white',
                color: activeCategory === category ? 'white' : '#666',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              {category}
            </button>
          ))}
        </div>

        {/* FAQ List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {filteredFAQs.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#666', padding: '40px' }}>
              No FAQs found matching your search.
            </p>
          ) : (
            filteredFAQs.map((faq, index) => (
              <details 
                key={index}
                style={{
                  border: '1px solid #e0e0e0',
                  borderRadius: '8px',
                  padding: '16px'
                }}
              >
                <summary style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  color: '#1f2937'
                }}>
                  {faq.question}
                </summary>
                <div style={{ 
                  marginTop: '12px', 
                  paddingTop: '12px',
                  borderTop: '1px solid #f3f4f6',
                  color: '#666',
                  lineHeight: '1.6'
                }}>
                  {faq.answer}
                </div>
              </details>
            ))
          )}
        </div>
      </div>

      {/* Additional Resources */}
      <div style={{
        backgroundColor: '#f9fafb',
        border: '1px solid #e0e0e0',
        borderRadius: '8px',
        padding: '24px',
        marginBottom: '32px'
      }}>
        <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '16px' }}>
          📚 Additional Resources
        </h3>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '16px'
        }}>
          <div>
            <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>
              API Documentation
            </h4>
            <ul style={{ fontSize: '14px', color: '#666', paddingLeft: '20px' }}>
              <li>
                <a href="/docs/B2B_ANALYTICS_QUICK_REFERENCE.md" target="_blank" style={{ color: '#2563eb' }}>
                  Analytics API
                </a>
              </li>
              <li>
                <a href="/docs/PAYMENT_TERMS_QUICK_REFERENCE.md" target="_blank" style={{ color: '#2563eb' }}>
                  Credit API
                </a>
              </li>
              <li>
                <a href="/docs/GST_INVOICING_QUICK_REFERENCE.md" target="_blank" style={{ color: '#2563eb' }}>
                  Invoice API
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>
              Community
            </h4>
            <ul style={{ fontSize: '14px', color: '#666', paddingLeft: '20px' }}>
              <li><a href="#" style={{ color: '#2563eb' }}>Vendor Forum</a></li>
              <li><a href="#" style={{ color: '#2563eb' }}>Success Stories</a></li>
              <li><a href="#" style={{ color: '#2563eb' }}>Best Practices Blog</a></li>
            </ul>
          </div>

          <div>
            <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>
              Tools
            </h4>
            <ul style={{ fontSize: '14px', color: '#666', paddingLeft: '20px' }}>
              <li><a href="#" style={{ color: '#2563eb' }}>Pricing Calculator</a></li>
              <li><a href="#" style={{ color: '#2563eb' }}>RFQ Template</a></li>
              <li><a href="#" style={{ color: '#2563eb' }}>Invoice Generator</a></li>
            </ul>
          </div>

          <div>
            <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>
              Updates
            </h4>
            <ul style={{ fontSize: '14px', color: '#666', paddingLeft: '20px' }}>
              <li><a href="#" style={{ color: '#2563eb' }}>Feature Releases</a></li>
              <li><a href="#" style={{ color: '#2563eb' }}>Platform Updates</a></li>
              <li><a href="#" style={{ color: '#2563eb' }}>Policy Changes</a></li>
            </ul>
          </div>
        </div>
      </div>

      {/* Contact Section */}
      <div style={{
        backgroundColor: '#eff6ff',
        border: '1px solid #bfdbfe',
        borderRadius: '8px',
        padding: '24px',
        textAlign: 'center'
      }}>
        <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '12px' }}>
          Still have questions?
        </h3>
        <p style={{ color: '#666', marginBottom: '16px' }}>
          Our B2B support team is here to help you succeed
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button style={{
            padding: '12px 24px',
            backgroundColor: '#2563eb',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontSize: '16px',
            fontWeight: '500',
            cursor: 'pointer'
          }}>
            Contact Support
          </button>
          <button style={{
            padding: '12px 24px',
            backgroundColor: 'white',
            color: '#2563eb',
            border: '1px solid #2563eb',
            borderRadius: '6px',
            fontSize: '16px',
            fontWeight: '500',
            cursor: 'pointer'
          }}>
            Schedule Call
          </button>
        </div>
      </div>
    </div>
  );
};

export default B2BHelpPage;
