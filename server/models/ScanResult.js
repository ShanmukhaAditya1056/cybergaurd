const mongoose = require('mongoose');
const { getMongoStatus } = require('../config/db');
const { getCollection } = require('../utils/memoryStore');

const scanResultSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['phishing', 'malware', 'breach', 'wifi'],
    required: true,
    index: true
  },
  input: {
    type: String,
    required: true
  },
  verdict: {
    type: String,
    required: true
  },
  score: {
    type: Number,
    default: 0
  },
  confidence: {
    type: Number,
    default: 0
  },
  details: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
});

scanResultSchema.index({ type: 1, createdAt: -1 });

const MongoModel = mongoose.model('ScanResult', scanResultSchema);
const memoryFallback = getCollection('ScanResult');

// Proxy that routes to Mongo or Memory based on connection state
const ScanResult = new Proxy(MongoModel, {
  get(target, prop) {
    const store = getMongoStatus() ? target : memoryFallback;
    const value = store[prop];
    if (typeof value === 'function') {
      return value.bind(store);
    }
    return value;
  }
});

module.exports = ScanResult;
