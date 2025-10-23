const withPWA = require('next-pwa')({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
});

module.exports = withPWA({
  output: 'export',
  reactStrictMode: true,
  swcMinify: true,
  transpilePackages: ['@nearbybazaar/ui', '@nearbybazaar/lib'],
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    unoptimized: true,
  },
});
