import { Queue, Worker } from 'bullmq';
import { Product } from '../models/Product';

const connection = { host: 'localhost', port: 6379 };
const supplierSyncQueue = new Queue('supplier-sync', { connection });

// Rate-limit: max 1 job per supplier per hour (example)
// Delta update: only propagate changes
export async function enqueueSupplierSync(supplierId: string) {
  await supplierSyncQueue.add(
    'sync',
    { supplierId },
    {
      removeOnComplete: true,
      repeat: { every: 60 * 60 * 1000 }, // every hour
    },
  );
}

new Worker(
  'supplier-sync',
  async (job) => {
    const { supplierId } = job.data;
    // TODO: Fetch supplier feed (CSV, API, etc.)
    interface SupplierFeedItem {
      sku: string;
      quantity: number;
      price: number;
      // add other fields as needed
    }
    const feed: SupplierFeedItem[] = []; // Replace with real feed parsing
    for (const item of feed) {
      // Find product by supplierSku mapping
      const product = await Product.findOne({ supplierId, supplierSku: item.sku });
      if (!product) continue;
      let updated = false;
      if (product.stock !== item.quantity) {
        product.stock = item.quantity;
        updated = true;
      }
      if (product.price !== item.price) {
        product.price = item.price;
        updated = true;
      }
      if (updated) {
        await product.save();
        // TODO: Optionally notify vendor of update
      }
    }
    // TODO: Log summary, handle errors, test with large feeds
  },
  { connection },
);
