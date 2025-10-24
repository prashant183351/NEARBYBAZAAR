if (!self.define) {
  let e,
    s = {};
  const n = (n, a) => (
    (n = new URL(n + '.js', a).href),
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
  self.define = (a, t) => {
    const c = e || ('document' in self ? document.currentScript.src : '') || location.href;
    if (s[c]) return;
    let i = {};
    const r = (e) => n(e, c),
      o = { module: { uri: c }, exports: i, require: r };
    s[c] = Promise.all(a.map((e) => o[e] || r(e))).then((e) => (t(...e), i));
  };
}
define(['./workbox-01fd22c6'], function (e) {
  'use strict';
  (importScripts(),
    self.skipWaiting(),
    e.clientsClaim(),
    e.precacheAndRoute(
      [
        { url: '/_next/static/chunks/12-32673bdd64a974d7.js', revision: '32673bdd64a974d7' },
        { url: '/_next/static/chunks/432.b24a5e5373240e00.js', revision: 'b24a5e5373240e00' },
        { url: '/_next/static/chunks/581.d28618816791e4d4.js', revision: 'd28618816791e4d4' },
        { url: '/_next/static/chunks/623-ca8361e9229fe0bb.js', revision: 'ca8361e9229fe0bb' },
        { url: '/_next/static/chunks/786.9fed4c8b095d3c51.js', revision: '9fed4c8b095d3c51' },
        { url: '/_next/static/chunks/89.cd0d9fcdca02cce9.js', revision: 'cd0d9fcdca02cce9' },
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
          url: '/_next/static/chunks/pages/advertising/dashboard-bd6642dbd21b453c.js',
          revision: 'bd6642dbd21b453c',
        },
        {
          url: '/_next/static/chunks/pages/analytics/b2b-03e3b0a516b11f75.js',
          revision: '03e3b0a516b11f75',
        },
        {
          url: '/_next/static/chunks/pages/credit/approvals-1af32c938400f41b.js',
          revision: '1af32c938400f41b',
        },
        {
          url: '/_next/static/chunks/pages/dashboard-a9a4ac9716b7e55c.js',
          revision: 'a9a4ac9716b7e55c',
        },
        {
          url: '/_next/static/chunks/pages/dashboard/recommendations-3d27d0946353472a.js',
          revision: '3d27d0946353472a',
        },
        {
          url: '/_next/static/chunks/pages/dashboard/reputation-5cfb6015a2cb8995.js',
          revision: '5cfb6015a2cb8995',
        },
        {
          url: '/_next/static/chunks/pages/erp/mapping-572a07f7c48a0f5b.js',
          revision: '572a07f7c48a0f5b',
        },
        {
          url: '/_next/static/chunks/pages/erp/syncNow-7a1af5f952ede079.js',
          revision: '7a1af5f952ede079',
        },
        {
          url: '/_next/static/chunks/pages/forms/builder-dd839c2c100ea855.js',
          revision: 'dd839c2c100ea855',
        },
        {
          url: '/_next/static/chunks/pages/forms/permissions-f2a79273b0a231f0.js',
          revision: 'f2a79273b0a231f0',
        },
        {
          url: '/_next/static/chunks/pages/index-23cf8e51922be3b3.js',
          revision: '23cf8e51922be3b3',
        },
        {
          url: '/_next/static/chunks/pages/kaizen/board-5e89dba86d658136.js',
          revision: '5e89dba86d658136',
        },
        {
          url: '/_next/static/chunks/pages/orders-68629c818004efc4.js',
          revision: '68629c818004efc4',
        },
        {
          url: '/_next/static/chunks/pages/reports/abtest-d179b85f75578273.js',
          revision: 'd179b85f75578273',
        },
        {
          url: '/_next/static/chunks/pages/reports/fomo-fcb08152779560cb.js',
          revision: 'fcb08152779560cb',
        },
        {
          url: '/_next/static/chunks/pages/reports/plans-b9026502271eb8e6.js',
          revision: 'b9026502271eb8e6',
        },
        {
          url: '/_next/static/chunks/pages/users-59979676db72e265.js',
          revision: '59979676db72e265',
        },
        {
          url: '/_next/static/chunks/pages/vendors/actions-1c669095b2c639e4.js',
          revision: '1c669095b2c639e4',
        },
        {
          url: '/_next/static/chunks/polyfills-78c92fac7aa8fdd8.js',
          revision: '79330112775102f91e1010318bae2bd3',
        },
        { url: '/_next/static/chunks/webpack-78f00ebb625b9800.js', revision: '78f00ebb625b9800' },
        {
          url: '/_next/static/xfcryCN4dzTvRk75vpnRp/_buildManifest.js',
          revision: '4c78574147feb0975072309de648c44a',
        },
        {
          url: '/_next/static/xfcryCN4dzTvRk75vpnRp/_ssgManifest.js',
          revision: 'b6652df95db52feb4daf4eca35380933',
        },
        { url: '/icon-192.png', revision: 'd41d8cd98f00b204e9800998ecf8427e' },
        { url: '/icon-512.png', revision: 'd41d8cd98f00b204e9800998ecf8427e' },
        { url: '/manifest.json', revision: '430cdc5bf35da6e1790d92d74e1bfcc8' },
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
            cacheWillUpdate: async ({ request: e, response: s, event: n, state: a }) =>
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
