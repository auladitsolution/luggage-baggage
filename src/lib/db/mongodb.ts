import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development and serverless function executions on Vercel.
 */
interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: MongooseCache | undefined;
}

let cached: MongooseCache = global.mongooseCache || { conn: null, promise: null };

if (!global.mongooseCache) {
  global.mongooseCache = cached;
}

export async function connectToDatabase(): Promise<typeof mongoose | null> {
  // If no URI configured yet, return null gracefully (mock mode)
  if (!MONGODB_URI || MONGODB_URI.includes("<username>")) {
    console.warn("⚠️ MONGODB_URI is not configured. Running in offline/mock database mode.");
    return null;
  }

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts: mongoose.ConnectOptions = {
      bufferCommands: false,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 15000, // 15 seconds to handle cold-start and network latency
      connectTimeoutMS: 15000,
      socketTimeoutMS: 45000,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongooseInstance) => {
      console.log("✓ MongoDB Atlas connected successfully.");
      return mongooseInstance;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e: any) {
    cached.promise = null;
    console.error("❌ MongoDB connection error:", e?.message || e);
    // Return null gracefully so that the app can fallback to memory store
    // instead of throwing unhandled 500 errors to visitors
    return null;
  }

  return cached.conn;
}

export async function isDatabaseConnected(): Promise<boolean> {
  try {
    const conn = await connectToDatabase();
    return !!conn && mongoose.connection.readyState === 1;
  } catch {
    return false;
  }
}

