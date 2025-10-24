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
    const i = e || ('document' in self ? document.currentScript.src : '') || location.href;
    if (s[i]) return;
    let c = {};
    const r = (e) => n(e, i),
      o = { module: { uri: i }, exports: c, require: r };
    s[i] = Promise.all(a.map((e) => o[e] || r(e))).then((e) => (t(...e), c));
  };
}
define(['./workbox-01fd22c6'], function (e) {
  'use strict';
  (importScripts(),
    self.skipWaiting(),
    e.clientsClaim(),
    e.precacheAndRoute(
      [
        { url: '/_next/dynamic-css-manifest.json', revision: 'd751713988987e9331980363e24189ce' },
        {
          url: '/_next/static/7uD1-FOMAm-vBlky-X3iW/_buildManifest.js',
          revision: '8fc64ac8bf12469bbb062ccdeb8b4d5c',
        },
        {
          url: '/_next/static/7uD1-FOMAm-vBlky-X3iW/_ssgManifest.js',
          revision: 'b6652df95db52feb4daf4eca35380933',
        },
        { url: '/_next/static/chunks/148.ced38b484572a82c.js', revision: 'ced38b484572a82c' },
        { url: '/_next/static/chunks/166.3d0edcd72df8499c.js', revision: '3d0edcd72df8499c' },
        { url: '/_next/static/chunks/217.cca26e4407b049b9.js', revision: 'cca26e4407b049b9' },
        { url: '/_next/static/chunks/229.3ea05d15cf326140.js', revision: '3ea05d15cf326140' },
        { url: '/_next/static/chunks/277-c31a42136a7d7a43.js', revision: 'c31a42136a7d7a43' },
        { url: '/_next/static/chunks/379-484f35b4354f7960.js', revision: '484f35b4354f7960' },
        { url: '/_next/static/chunks/903.61df6d106f820a7c.js', revision: '61df6d106f820a7c' },
        { url: '/_next/static/chunks/934.9fbe81bba4049843.js', revision: '9fbe81bba4049843' },
        { url: '/_next/static/chunks/framework-d7100435d1a34b54.js', revision: 'd7100435d1a34b54' },
        { url: '/_next/static/chunks/main-97848249a8193825.js', revision: '97848249a8193825' },
        {
          url: '/_next/static/chunks/pages/_app-15520a55e25a3f4f.js',
          revision: '15520a55e25a3f4f',
        },
        {
          url: '/_next/static/chunks/pages/_error-0355b6afcffde92a.js',
          revision: '0355b6afcffde92a',
        },
        {
          url: '/_next/static/chunks/pages/advertising/dashboard-4923339b91ea02bc.js',
          revision: '4923339b91ea02bc',
        },
        {
          url: '/_next/static/chunks/pages/analytics/b2b-de1fa6b6f196b936.js',
          revision: 'de1fa6b6f196b936',
        },
        {
          url: '/_next/static/chunks/pages/credit/approvals-25f9dab5121ed56e.js',
          revision: '25f9dab5121ed56e',
        },
        {
          url: '/_next/static/chunks/pages/dashboard-ff74c93d583d088d.js',
          revision: 'ff74c93d583d088d',
        },
        {
          url: '/_next/static/chunks/pages/dashboard/recommendations-6c4e4695c55c20b0.js',
          revision: '6c4e4695c55c20b0',
        },
        {
          url: '/_next/static/chunks/pages/dashboard/reputation-144054b2fa768323.js',
          revision: '144054b2fa768323',
        },
        {
          url: '/_next/static/chunks/pages/erp/mapping-4124e5f6e9e4bd38.js',
          revision: '4124e5f6e9e4bd38',
        },
        {
          url: '/_next/static/chunks/pages/erp/syncNow-ed0c98f9c5fecfb7.js',
          revision: 'ed0c98f9c5fecfb7',
        },
        {
          url: '/_next/static/chunks/pages/forms/builder-d657623a12e2f578.js',
          revision: 'd657623a12e2f578',
        },
        {
          url: '/_next/static/chunks/pages/forms/permissions-c29e16c779ed4086.js',
          revision: 'c29e16c779ed4086',
        },
        {
          url: '/_next/static/chunks/pages/index-ac7b0b299262a260.js',
          revision: 'ac7b0b299262a260',
        },
        {
          url: '/_next/static/chunks/pages/kaizen/board-30a22093abaf80e0.js',
          revision: '30a22093abaf80e0',
        },
        {
          url: '/_next/static/chunks/pages/orders-5f8a860893badfd2.js',
          revision: '5f8a860893badfd2',
        },
        {
          url: '/_next/static/chunks/pages/reports/abtest-7fd6f94790603db1.js',
          revision: '7fd6f94790603db1',
        },
        {
          url: '/_next/static/chunks/pages/reports/fomo-792cf911a6492bdb.js',
          revision: '792cf911a6492bdb',
        },
        {
          url: '/_next/static/chunks/pages/reports/plans-d8d8bb1fd6f9b26e.js',
          revision: 'd8d8bb1fd6f9b26e',
        },
        {
          url: '/_next/static/chunks/pages/users-e27ae776a881568c.js',
          revision: 'e27ae776a881568c',
        },
        {
          url: '/_next/static/chunks/pages/vendors/actions-27ba6296f45d1974.js',
          revision: '27ba6296f45d1974',
        },
        {
          url: '/_next/static/chunks/polyfills-42372ed130431b0a.js',
          revision: '846118c33b2c0e922d7b3a7676f81f6f',
        },
        { url: '/_next/static/chunks/webpack-bff0ba604d8e3488.js', revision: 'bff0ba604d8e3488' },
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
