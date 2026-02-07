// Server startup and database connection
import 'dotenv/config';

import mongoose from 'mongoose';

import app from './app.js';

const port = process.env.PORT || 3000;

async function startServer() {
  const mongoUri = process.env.MONGODB_URI;

  // Fail fast if MongoDB is not configured.
  if (!mongoUri) {
    console.error('Missing MONGODB_URI. Add it to your .env file to connect to MongoDB.');
    process.exit(1);
  }

  try {
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    app.listen(port, () => {
      console.log(`Server running on http://localhost:${port}`);
    });
  } catch (error) {
    console.error('MongoDB connection error:', error?.message || error);
    process.exit(1);
  }
}

startServer();
