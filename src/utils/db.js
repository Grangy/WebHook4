
// src/utils/db.js
const mongoose = require('mongoose');
const { dbUri } = require('../../config/config');

async function connectToDatabase() {
  mongoose.connect(dbUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  const db = mongoose.connection;

  db.once('open', () => {
    console.log('Connected to MongoDB Atlas');
  });

  db.on('error', (error) => {
    console.error('MongoDB connection error:', error);
  });

  // Check if collection exists
  db.once('open', () => {
    db.db.listCollections({ name: 'leads' }).next((err, collinfo) => {
      if (!collinfo) {
        db.db.createCollection('leads');
        console.log('Collection "leads" created');
      } else {
        console.log('Collection "leads" exists');
      }
    });
  });
}

module.exports = { connectToDatabase };
