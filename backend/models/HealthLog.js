const mongoose = require('mongoose');

const HealthLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  heartRate: { type: Number },
  bloodPressure: { type: String },
  weight: { type: Number },
  sleepHours: { type: Number },
  date: { type: Date, default: Date.now }
});

module.exports = mongoose.model('HealthLog', HealthLogSchema);
