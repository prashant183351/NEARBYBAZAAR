import Head from 'next/head';

import Link from 'next/link';

export default function Home() {
  return (
    <>
      <Head>
        <title>NearbyBazaar</title>
        <meta name="description" content="Shop local, shop smart with NearbyBazaar." />
        <link rel="manifest" href="/manifest.json" />
      </Head>
      <main style={{ padding: 32, textAlign: 'center' }}>
        <h1>NearbyBazaar Web PWA</h1>
        <p>Welcome! This is a smoke test page for the PWA shell.</p>
        <nav style={{ margin: '2rem 0' }}>
          <Link href="/p/sample-product">Sample Product</Link> |{' '}
          <Link href="/s/sample-service">Sample Service</Link> |{' '}
          <Link href="/c/sample-classified">Sample Classified</Link> |{' '}
          <Link href="/store/sample-store">Sample Storefront</Link>
        </nav>
      </main>
    </>
  );
}
