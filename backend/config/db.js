const mongoose = require('mongoose');
const { MONGO_URI } = require('./constants');

const connectDB = async () => {
  try {
    await mongoose.connect(MONGO_URI, {});
    console.log('Connected to MongoDB');
  } catch (err) {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  }
};

module.exports = connectDB;