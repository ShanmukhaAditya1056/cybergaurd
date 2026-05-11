const mongoose = require('mongoose');
const { getMongoStatus } = require('../config/db');
const { getCollection } = require('../utils/memoryStore');

const breachLogSchema = new mongoose.Schema({
  hashPrefix: {
    type: String,
    required: true,
    maxlength: 5
  },
  breachFound: {
    type: Boolean,
    default: false
  },
  breachCount: {
    type: Number,
    default: 0
  },
  checkedAt: {
    type: Date,
    default: Date.now,
    index: true
  }
});

const MongoModel = mongoose.model('BreachLog', breachLogSchema);
const memoryFallback = getCollection('BreachLog');

const BreachLog = new Proxy(MongoModel, {
  get(target, prop) {
    const store = getMongoStatus() ? target : memoryFallback;
    const value = store[prop];
    if (typeof value === 'function') {
      return value.bind(store);
    }
    return value;
  }
});

module.exports = BreachLog;
