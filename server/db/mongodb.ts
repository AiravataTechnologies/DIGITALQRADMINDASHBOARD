import mongoose from 'mongoose';

let isConnected = false;

export async function connectToDatabase() {
  if (isConnected) {
    return;
  }

  const MONGODB_URI = process.env.MONGODB_URI;

  if (!MONGODB_URI) {
    console.log('⚠️  MONGODB_URI not provided - continuing without MongoDB connection');
    return;
  }

  try {
    console.log('Attempting to connect to MongoDB...');
    await mongoose.connect(MONGODB_URI, {
      connectTimeoutMS: 2000,
      serverSelectionTimeoutMS: 2000,
      maxPoolSize: 5,
      minPoolSize: 1,
      retryWrites: true,
      w: 'majority'
    });
    isConnected = true;
    console.log('✅ Connected to MongoDB successfully');
  } catch (error) {
    console.error('❌ Error connecting to MongoDB:', error);
    console.log('⚠️  Continuing without MongoDB connection - admin features will be disabled');
    // Don't throw error, just log it so the server can start
  }
}

export { mongoose };