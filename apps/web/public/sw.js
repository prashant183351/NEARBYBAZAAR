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
  self.define = (n, t) => {
    const c = e || ('document' in self ? document.currentScript.src : '') || location.href;
    if (s[c]) return;
    let i = {};
    const r = (e) => a(e, c),
      o = { module: { uri: c }, exports: i, require: r };
    s[c] = Promise.all(n.map((e) => o[e] || r(e))).then((e) => (t(...e), i));
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
          url: '/_next/static/WTmJeYaqiKfeXY-K5QxGb/_buildManifest.js',
          revision: 'cea606e9ead6ab38ebf6b6a0a6bf5252',
        },
        {
          url: '/_next/static/WTmJeYaqiKfeXY-K5QxGb/_ssgManifest.js',
          revision: 'b6652df95db52feb4daf4eca35380933',
        },
        { url: '/_next/static/chunks/12-1200abd565de724d.js', revision: '1200abd565de724d' },
        { url: '/_next/static/chunks/147-acd8cef869a1e527.js', revision: 'acd8cef869a1e527' },
        { url: '/_next/static/chunks/274.94259e3243a06c28.js', revision: '94259e3243a06c28' },
        { url: '/_next/static/chunks/445-65465fd3e6adbd46.js', revision: '65465fd3e6adbd46' },
        { url: '/_next/static/chunks/623-ca8361e9229fe0bb.js', revision: 'ca8361e9229fe0bb' },
        { url: '/_next/static/chunks/861-9582d577ba24afe8.js', revision: '9582d577ba24afe8' },
        { url: '/_next/static/chunks/e01d70c7-5d9313a8d7e8f296.js', revision: '5d9313a8d7e8f296' },
        { url: '/_next/static/chunks/framework-8051a8b17472378c.js', revision: '8051a8b17472378c' },
        { url: '/_next/static/chunks/main-201c35b14ea31b6d.js', revision: '201c35b14ea31b6d' },
        {
          url: '/_next/static/chunks/pages/_app-7c02328aa89250e4.js',
          revision: '7c02328aa89250e4',
        },
        {
          url: '/_next/static/chunks/pages/_error-a96a6d1e5847d9c0.js',
          revision: 'a96a6d1e5847d9c0',
        },
        {
          url: '/_next/static/chunks/pages/auth/password-reset-78d894262deb06fe.js',
          revision: '78d894262deb06fe',
        },
        { url: '/_next/static/chunks/pages/b2b-2eb2d4a3a1b12b6f.js', revision: '2eb2d4a3a1b12b6f' },
        {
          url: '/_next/static/chunks/pages/b2b/credit-b8c4c16d8b75ac42.js',
          revision: 'b8c4c16d8b75ac42',
        },
        {
          url: '/_next/static/chunks/pages/b2b/register-c7ef9dfa14f70d47.js',
          revision: 'c7ef9dfa14f70d47',
        },
        {
          url: '/_next/static/chunks/pages/book/%5Bslug%5D-64de6c4e19050e77.js',
          revision: '64de6c4e19050e77',
        },
        {
          url: '/_next/static/chunks/pages/c/%5Bslug%5D-4cb093650e71d8d2.js',
          revision: '4cb093650e71d8d2',
        },
        {
          url: '/_next/static/chunks/pages/cart-7356ec8b355fc721.js',
          revision: '7356ec8b355fc721',
        },
        {
          url: '/_next/static/chunks/pages/changelog-49016429ee6fbe90.js',
          revision: '49016429ee6fbe90',
        },
        {
          url: '/_next/static/chunks/pages/index-bc3fbcb42283d7bd.js',
          revision: 'bc3fbcb42283d7bd',
        },
        {
          url: '/_next/static/chunks/pages/inquire/%5Bslug%5D-aea6bb05a8b61887.js',
          revision: 'aea6bb05a8b61887',
        },
        {
          url: '/_next/static/chunks/pages/kaizen/submit-9a5060a07e85b5e7.js',
          revision: '9a5060a07e85b5e7',
        },
        {
          url: '/_next/static/chunks/pages/p/%5Bslug%5D-9b0411a027fbb00c.js',
          revision: '9b0411a027fbb00c',
        },
        {
          url: '/_next/static/chunks/pages/rfq/%5Bid%5D-6595e549e4c7bf14.js',
          revision: '6595e549e4c7bf14',
        },
        {
          url: '/_next/static/chunks/pages/s/%5Bslug%5D-1d2564f8dcd6419e.js',
          revision: '1d2564f8dcd6419e',
        },
        {
          url: '/_next/static/chunks/pages/search-a9e04be8830913ec.js',
          revision: 'a9e04be8830913ec',
        },
        {
          url: '/_next/static/chunks/pages/sitemap.xml-eb85ec263c378e3a.js',
          revision: 'eb85ec263c378e3a',
        },
        {
          url: '/_next/static/chunks/pages/store/%5Bslug%5D-791b29cec7fb900e.js',
          revision: '791b29cec7fb900e',
        },
        {
          url: '/_next/static/chunks/polyfills-78c92fac7aa8fdd8.js',
          revision: '79330112775102f91e1010318bae2bd3',
        },
        { url: '/_next/static/chunks/webpack-820ce1d1bbecdbf4.js', revision: '820ce1d1bbecdbf4' },
        { url: '/_next/static/css/111300f51b960d06.css', revision: '111300f51b960d06' },
        { url: '/embed/form.js', revision: '64a9d7142baa49c8f69eb4f2eb092ea0' },
        { url: '/icon-192.png', revision: 'd41d8cd98f00b204e9800998ecf8427e' },
        { url: '/icon-512.png', revision: 'd41d8cd98f00b204e9800998ecf8427e' },
        { url: '/manifest.json', revision: '8a375196e5dd17bafc5983db23f453c6' },
        { url: '/og-default.png', revision: 'd41d8cd98f00b204e9800998ecf8427e' },
        { url: '/robots.txt', revision: 'a39b521a172a995a9b0de1599315b280' },
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
