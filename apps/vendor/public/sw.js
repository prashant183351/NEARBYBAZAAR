if (!self.define) {
  let e,
    s = {};
  const a = (a, n) => (
    (a = new URL(a + '.js', n).href),
    s[a] ||
      new Promise((s) => {
        if ('document' in self) {
          const e = document.createElement('script');
          ((e.src = a), (e.onload = s), document.head.appendChild(e));
        } else ((e = a), importScripts(a), s());
      }).then(() => {
        let e = s[a];
        if (!e) throw new Error(`Module ${a} didn’t register its module`);
        return e;
      })
  );
  self.define = (n, c) => {
    const t = e || ('document' in self ? document.currentScript.src : '') || location.href;
    if (s[t]) return;
    let i = {};
    const r = (e) => a(e, t),
      o = { module: { uri: t }, exports: i, require: r };
    s[t] = Promise.all(n.map((e) => o[e] || r(e))).then((e) => (c(...e), i));
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
          url: '/_next/static/LjN_81v577tcQDnyF_r_N/_buildManifest.js',
          revision: '42b2d968feb02abb4dc95e689f1c2b37',
        },
        {
          url: '/_next/static/LjN_81v577tcQDnyF_r_N/_ssgManifest.js',
          revision: 'b6652df95db52feb4daf4eca35380933',
        },
        { url: '/_next/static/chunks/12-32673bdd64a974d7.js', revision: '32673bdd64a974d7' },
        { url: '/_next/static/chunks/793-fbfdfb3c42e1cdf4.js', revision: 'fbfdfb3c42e1cdf4' },
        { url: '/_next/static/chunks/framework-8051a8b17472378c.js', revision: '8051a8b17472378c' },
        { url: '/_next/static/chunks/main-65ca48a8b33d3de7.js', revision: '65ca48a8b33d3de7' },
        {
          url: '/_next/static/chunks/pages/_app-0ffd0453ced823b7.js',
          revision: '0ffd0453ced823b7',
        },
        {
          url: '/_next/static/chunks/pages/_error-ace06f6f86cc588c.js',
          revision: 'ace06f6f86cc588c',
        },
        {
          url: '/_next/static/chunks/pages/account/actions-d72ca6f32dfbdcc9.js',
          revision: 'd72ca6f32dfbdcc9',
        },
        {
          url: '/_next/static/chunks/pages/analytics/b2b-12666d53504d254f.js',
          revision: '12666d53504d254f',
        },
        {
          url: '/_next/static/chunks/pages/campaigns-c805636bc03d5f09.js',
          revision: 'c805636bc03d5f09',
        },
        {
          url: '/_next/static/chunks/pages/campaigns/create-a562b7267fb16c50.js',
          revision: 'a562b7267fb16c50',
        },
        {
          url: '/_next/static/chunks/pages/dashboard/recommendations-f9660e12764ffa60.js',
          revision: 'f9660e12764ffa60',
        },
        {
          url: '/_next/static/chunks/pages/dashboard/reputation-7bcb2a4fa5524823.js',
          revision: '7bcb2a4fa5524823',
        },
        {
          url: '/_next/static/chunks/pages/dropship/Mappings-3c73564e2a0da2c4.js',
          revision: '3c73564e2a0da2c4',
        },
        {
          url: '/_next/static/chunks/pages/dropship/Performance-4a85ccd3259b5c01.js',
          revision: '4a85ccd3259b5c01',
        },
        {
          url: '/_next/static/chunks/pages/dropship/Suppliers-44048219dbca29f4.js',
          revision: '44048219dbca29f4',
        },
        {
          url: '/_next/static/chunks/pages/dropship/__tests__/dropship.smoke.test-e9c0c1e6e6958c91.js',
          revision: 'e9c0c1e6e6958c91',
        },
        { url: '/_next/static/chunks/pages/gst-6d863f7652a079a0.js', revision: '6d863f7652a079a0' },
        {
          url: '/_next/static/chunks/pages/help/b2b-67a0aa1d0d7af91b.js',
          revision: '67a0aa1d0d7af91b',
        },
        {
          url: '/_next/static/chunks/pages/index-23d0a4bf90c0ff82.js',
          revision: '23d0a4bf90c0ff82',
        },
        {
          url: '/_next/static/chunks/pages/notifications/inbox-427ff83ab58dc4fd.js',
          revision: '427ff83ab58dc4fd',
        },
        {
          url: '/_next/static/chunks/pages/notifications/preferences-5447207e1cba23c7.js',
          revision: '5447207e1cba23c7',
        },
        {
          url: '/_next/static/chunks/pages/plan-0c9b7e9b947134e4.js',
          revision: '0c9b7e9b947134e4',
        },
        {
          url: '/_next/static/chunks/pages/products/%5Bid%5D-125dc938458f8ab9.js',
          revision: '125dc938458f8ab9',
        },
        {
          url: '/_next/static/chunks/pages/returns-333a0a12ef6ce201.js',
          revision: '333a0a12ef6ce201',
        },
        { url: '/_next/static/chunks/pages/rfq-12dbc905a9dd35a6.js', revision: '12dbc905a9dd35a6' },
        {
          url: '/_next/static/chunks/pages/rfq/%5Bid%5D-68874705fe0b15da.js',
          revision: '68874705fe0b15da',
        },
        {
          url: '/_next/static/chunks/polyfills-78c92fac7aa8fdd8.js',
          revision: '79330112775102f91e1010318bae2bd3',
        },
        { url: '/_next/static/chunks/webpack-8fa1640cc84ba8fe.js', revision: '8fa1640cc84ba8fe' },
        { url: '/icon-192.png', revision: 'd41d8cd98f00b204e9800998ecf8427e' },
        { url: '/icon-512.png', revision: 'd41d8cd98f00b204e9800998ecf8427e' },
        { url: '/manifest.json', revision: '64c812c15cabea29965b31291f6f827f' },
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
            cacheWillUpdate: async ({ request: e, response: s, event: a, state: n }) =>
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
