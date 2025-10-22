import Head from 'next/head';
import Link from 'next/link';

export default function UsersPage() {
  return (
    <>
      <Head>
        <title>Users | Admin | NearbyBazaar</title>
      </Head>
      <main style={{ padding: 32, textAlign: 'center' }}>
        <h1>Users</h1>
        <Link href="/">Back to Dashboard</Link>
      </main>
    </>
  );
}
