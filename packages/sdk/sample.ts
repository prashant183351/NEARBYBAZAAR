// Sample usage of the generated SDK
import { Api } from './';

async function main() {
  const api = new Api({ baseUrl: 'http://localhost:4000/v1' });
  // Example: fetch products (adjust as per actual generated API)
  try {
    const products = await api.products.getProducts();
    console.log('Products:', products);
  } catch (err) {
    console.error('API call failed:', err);
  }
}

main();
