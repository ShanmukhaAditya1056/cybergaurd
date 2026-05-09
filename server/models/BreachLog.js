const mongoose = require('mongoose');

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

module.exports = mongoose.model('BreachLog', breachLogSchema);
