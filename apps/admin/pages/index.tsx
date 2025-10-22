import Head from 'next/head';
import Link from 'next/link';

export default function AdminHome() {
  return (
    <>
      <Head>
        <title>Admin Dashboard | NearbyBazaar</title>
        <meta name="description" content="Admin portal for NearbyBazaar." />
        <link rel="manifest" href="/manifest.json" />
      </Head>
      <main style={{ padding: 32, textAlign: 'center' }}>
        <h1>Admin Dashboard</h1>
        <nav style={{ margin: '2rem 0' }}>
          <Link href="/users">Users</Link> | <Link href="/orders">Orders</Link>
        </nav>
        <p>Welcome, admin! This is your dashboard stub page.</p>
      </main>
    </>
  );
}
