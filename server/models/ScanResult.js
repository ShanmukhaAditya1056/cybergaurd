const mongoose = require('mongoose');

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

module.exports = mongoose.model('ScanResult', scanResultSchema);
