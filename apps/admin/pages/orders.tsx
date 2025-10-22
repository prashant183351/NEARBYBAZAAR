import Head from 'next/head';
import Link from 'next/link';

export default function OrdersPage() {
  return (
    <>
      <Head>
        <title>Orders | Admin | NearbyBazaar</title>
      </Head>
      <main style={{ padding: 32, textAlign: 'center' }}>
        <h1>Orders</h1>
        <Link href="/">Back to Dashboard</Link>
      </main>
    </>
  );
}
