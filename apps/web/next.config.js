const withPWA = require('next-pwa')({
    dest: 'public',
    disable: process.env.NODE_ENV === 'development',
});

module.exports = withPWA({
    reactStrictMode: true,
    swcMinify: true,
    // Use Next.js built-in transpilation for monorepo packages
    transpilePackages: [
        '@nearbybazaar/ui',
        '@nearbybazaar/lib',
    ],
    eslint: {
        ignoreDuringBuilds: true,
    },
});
