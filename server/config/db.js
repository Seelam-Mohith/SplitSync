import mongoose from 'mongoose';

let isConnected = false;
let retryTimer = null;

const connectDB = async () => {
  if (isConnected) return;

  try {
    await mongoose.disconnect();
  } catch {
    // ignore if not connected
  }

  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    isConnected = true;
    if (retryTimer) {
      clearTimeout(retryTimer);
      retryTimer = null;
    }
    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);
    console.log('Server will continue running without database. Retrying in 10 seconds...');
    isConnected = false;
    retryTimer = setTimeout(connectDB, 10000);
  }
};

mongoose.connection.on('disconnected', () => {
  if (isConnected) {
    console.log('MongoDB disconnected. Attempting to reconnect...');
    isConnected = false;
    connectDB();
  }
});

export { isConnected };
export default connectDB;
