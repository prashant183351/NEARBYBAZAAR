import Head from 'next/head';
import { Navbar } from '../components/Navbar';

export default function Dashboard() {
  return (
    <>
      <Head>
        <title>Vendor Dashboard | NearbyBazaar</title>
        <meta name="description" content="Vendor portal for managing your shop on NearbyBazaar." />
        <link rel="manifest" href="/manifest.json" />
      </Head>
      <Navbar />
      <main style={{ padding: 32, textAlign: 'center' }}>
        <h1>Vendor Dashboard</h1>
        <p>Welcome, vendor! This is your dashboard stub page.</p>
      </main>
    </>
  );
}
