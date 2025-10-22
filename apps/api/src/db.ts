import mongoose from 'mongoose';

let isConnecting = false;

export async function connectMongo(uri?: string) {
  if (mongoose.connection.readyState === 1) return; // already connected
  if (isConnecting) return; // prevent parallel connects
  isConnecting = true;
  const MONGODB_URI =
    uri ||
    process.env.MONGODB_URI ||
    process.env.MONGO_URL ||
    'mongodb://localhost:27017/nearbybazaar';
  await mongoose.connect(MONGODB_URI);
}

export async function disconnectMongo() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
}

export function mongoReadyState() {
  return mongoose.connection.readyState; // 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
}
