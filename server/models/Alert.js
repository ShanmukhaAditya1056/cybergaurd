const mongoose = require('mongoose');
const { getMongoStatus } = require('../config/db');
const { getCollection } = require('../utils/memoryStore');

const alertSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['CRITICAL', 'WARNING', 'SAFE', 'INFO'],
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  module: {
    type: String,
    required: true
  },
  read: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
});

alertSchema.index({ createdAt: -1 });

const MongoModel = mongoose.model('Alert', alertSchema);
const memoryFallback = getCollection('Alert');

const Alert = new Proxy(MongoModel, {
  get(target, prop) {
    const store = getMongoStatus() ? target : memoryFallback;
    const value = store[prop];
    if (typeof value === 'function') {
      return value.bind(store);
    }
    return value;
  }
});

module.exports = Alert;
