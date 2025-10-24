const withPWA = require('next-pwa')({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
});

module.exports = withPWA({
  output: 'export',
  reactStrictMode: true,
  transpilePackages: ['@nearbybazaar/ui', '@nearbybazaar/lib'],
  images: {
    unoptimized: true,
  },
  turbopack: {}, // Silence Turbopack error for Next.js 16+
});
