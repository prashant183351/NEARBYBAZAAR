if (!self.define) {
  let e,
    s = {};
  const n = (n, t) => (
    (n = new URL(n + '.js', t).href),
    s[n] ||
      new Promise((s) => {
        if ('document' in self) {
          const e = document.createElement('script');
          ((e.src = n), (e.onload = s), document.head.appendChild(e));
        } else ((e = n), importScripts(n), s());
      }).then(() => {
        let e = s[n];
        if (!e) throw new Error(`Module ${n} didn’t register its module`);
        return e;
      })
  );
  self.define = (t, i) => {
    const c = e || ('document' in self ? document.currentScript.src : '') || location.href;
    if (s[c]) return;
    let a = {};
    const r = (e) => n(e, c),
      o = { module: { uri: c }, exports: a, require: r };
    s[c] = Promise.all(t.map((e) => o[e] || r(e))).then((e) => (i(...e), a));
  };
}
define(['./workbox-01fd22c6'], function (e) {
  'use strict';
  (importScripts(),
    self.skipWaiting(),
    e.clientsClaim(),
    e.precacheAndRoute(
      [
        {
          url: '/_next/static/TDx_i9FeOCXGz4_2NY3OS/_buildManifest.js',
          revision: '780c8359addc54e06e1877c0fcfb4196',
        },
        {
          url: '/_next/static/TDx_i9FeOCXGz4_2NY3OS/_ssgManifest.js',
          revision: 'b6652df95db52feb4daf4eca35380933',
        },
        { url: '/_next/static/chunks/12-d2c0f104336b97f5.js', revision: 'd2c0f104336b97f5' },
        { url: '/_next/static/chunks/framework-8051a8b17472378c.js', revision: '8051a8b17472378c' },
        { url: '/_next/static/chunks/main-12c642f9623cffef.js', revision: '12c642f9623cffef' },
        {
          url: '/_next/static/chunks/pages/_app-8ac33c653e57251a.js',
          revision: '8ac33c653e57251a',
        },
        {
          url: '/_next/static/chunks/pages/_error-a96a6d1e5847d9c0.js',
          revision: 'a96a6d1e5847d9c0',
        },
        {
          url: '/_next/static/chunks/pages/dropship/Mappings-720f799b65097fb2.js',
          revision: '720f799b65097fb2',
        },
        {
          url: '/_next/static/chunks/pages/dropship/Performance-762673e298c98209.js',
          revision: '762673e298c98209',
        },
        {
          url: '/_next/static/chunks/pages/dropship/Suppliers-85caf716e55f11cc.js',
          revision: '85caf716e55f11cc',
        },
        {
          url: '/_next/static/chunks/pages/dropship/__tests__/dropship.smoke.test-2b444c535253929d.js',
          revision: '2b444c535253929d',
        },
        { url: '/_next/static/chunks/pages/gst-b4a6d7bdab182527.js', revision: 'b4a6d7bdab182527' },
        {
          url: '/_next/static/chunks/pages/index-7bfdc12cca64f440.js',
          revision: '7bfdc12cca64f440',
        },
        {
          url: '/_next/static/chunks/pages/notifications/inbox-d315cf840f474a5e.js',
          revision: 'd315cf840f474a5e',
        },
        {
          url: '/_next/static/chunks/pages/notifications/preferences-b86bba9651635ad3.js',
          revision: 'b86bba9651635ad3',
        },
        {
          url: '/_next/static/chunks/pages/plan-58f646c0b4f7918b.js',
          revision: '58f646c0b4f7918b',
        },
        {
          url: '/_next/static/chunks/pages/products/%5Bid%5D-b39bd2065f679b8b.js',
          revision: 'b39bd2065f679b8b',
        },
        {
          url: '/_next/static/chunks/pages/returns-04e3c93e5dcbe498.js',
          revision: '04e3c93e5dcbe498',
        },
        { url: '/_next/static/chunks/pages/rfq-571e18e84631f466.js', revision: '571e18e84631f466' },
        {
          url: '/_next/static/chunks/pages/rfq/%5Bid%5D-eb99668a6fb9d285.js',
          revision: 'eb99668a6fb9d285',
        },
        {
          url: '/_next/static/chunks/polyfills-78c92fac7aa8fdd8.js',
          revision: '79330112775102f91e1010318bae2bd3',
        },
        { url: '/_next/static/chunks/webpack-ee7e63bc15b31913.js', revision: 'ee7e63bc15b31913' },
        { url: '/_next/static/css/111300f51b960d06.css', revision: '111300f51b960d06' },
        { url: '/icon-192.png', revision: 'd41d8cd98f00b204e9800998ecf8427e' },
        { url: '/icon-512.png', revision: 'd41d8cd98f00b204e9800998ecf8427e' },
        { url: '/manifest.json', revision: '8ff7f8c4d5c3354f1c0e165a717a35b4' },
      ],
      { ignoreURLParametersMatching: [] },
    ),
    e.cleanupOutdatedCaches(),
    e.registerRoute(
      '/',
      new e.NetworkFirst({
        cacheName: 'start-url',
        plugins: [
          {
            cacheWillUpdate: async ({ request: e, response: s, event: n, state: t }) =>
              s && 'opaqueredirect' === s.type
                ? new Response(s.body, { status: 200, statusText: 'OK', headers: s.headers })
                : s,
          },
        ],
      }),
      'GET',
    ),
    e.registerRoute(
      /^https:\/\/fonts\.(?:gstatic)\.com\/.*/i,
      new e.CacheFirst({
        cacheName: 'google-fonts-webfonts',
        plugins: [new e.ExpirationPlugin({ maxEntries: 4, maxAgeSeconds: 31536e3 })],
      }),
      'GET',
    ),
    e.registerRoute(
      /^https:\/\/fonts\.(?:googleapis)\.com\/.*/i,
      new e.StaleWhileRevalidate({
        cacheName: 'google-fonts-stylesheets',
        plugins: [new e.ExpirationPlugin({ maxEntries: 4, maxAgeSeconds: 604800 })],
      }),
      'GET',
    ),
    e.registerRoute(
      /\.(?:eot|otf|ttc|ttf|woff|woff2|font.css)$/i,
      new e.StaleWhileRevalidate({
        cacheName: 'static-font-assets',
        plugins: [new e.ExpirationPlugin({ maxEntries: 4, maxAgeSeconds: 604800 })],
      }),
      'GET',
    ),
    e.registerRoute(
      /\.(?:jpg|jpeg|gif|png|svg|ico|webp)$/i,
      new e.StaleWhileRevalidate({
        cacheName: 'static-image-assets',
        plugins: [new e.ExpirationPlugin({ maxEntries: 64, maxAgeSeconds: 86400 })],
      }),
      'GET',
    ),
    e.registerRoute(
      /\/_next\/image\?url=.+$/i,
      new e.StaleWhileRevalidate({
        cacheName: 'next-image',
        plugins: [new e.ExpirationPlugin({ maxEntries: 64, maxAgeSeconds: 86400 })],
      }),
      'GET',
    ),
    e.registerRoute(
      /\.(?:mp3|wav|ogg)$/i,
      new e.CacheFirst({
        cacheName: 'static-audio-assets',
        plugins: [
          new e.RangeRequestsPlugin(),
          new e.ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 86400 }),
        ],
      }),
      'GET',
    ),
    e.registerRoute(
      /\.(?:mp4)$/i,
      new e.CacheFirst({
        cacheName: 'static-video-assets',
        plugins: [
          new e.RangeRequestsPlugin(),
          new e.ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 86400 }),
        ],
      }),
      'GET',
    ),
    e.registerRoute(
      /\.(?:js)$/i,
      new e.StaleWhileRevalidate({
        cacheName: 'static-js-assets',
        plugins: [new e.ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 86400 })],
      }),
      'GET',
    ),
    e.registerRoute(
      /\.(?:css|less)$/i,
      new e.StaleWhileRevalidate({
        cacheName: 'static-style-assets',
        plugins: [new e.ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 86400 })],
      }),
      'GET',
    ),
    e.registerRoute(
      /\/_next\/data\/.+\/.+\.json$/i,
      new e.StaleWhileRevalidate({
        cacheName: 'next-data',
        plugins: [new e.ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 86400 })],
      }),
      'GET',
    ),
    e.registerRoute(
      /\.(?:json|xml|csv)$/i,
      new e.NetworkFirst({
        cacheName: 'static-data-assets',
        plugins: [new e.ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 86400 })],
      }),
      'GET',
    ),
    e.registerRoute(
      ({ url: e }) => {
        if (!(self.origin === e.origin)) return !1;
        const s = e.pathname;
        return !s.startsWith('/api/auth/') && !!s.startsWith('/api/');
      },
      new e.NetworkFirst({
        cacheName: 'apis',
        networkTimeoutSeconds: 10,
        plugins: [new e.ExpirationPlugin({ maxEntries: 16, maxAgeSeconds: 86400 })],
      }),
      'GET',
    ),
    e.registerRoute(
      ({ url: e }) => {
        if (!(self.origin === e.origin)) return !1;
        return !e.pathname.startsWith('/api/');
      },
      new e.NetworkFirst({
        cacheName: 'others',
        networkTimeoutSeconds: 10,
        plugins: [new e.ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 86400 })],
      }),
      'GET',
    ),
    e.registerRoute(
      ({ url: e }) => !(self.origin === e.origin),
      new e.NetworkFirst({
        cacheName: 'cross-origin',
        networkTimeoutSeconds: 10,
        plugins: [new e.ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 3600 })],
      }),
      'GET',
    ));
});
