const mongoose = require('mongoose');

const CheckinSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  mood: { type: String, required: true },
  notes: { type: String },
  sentimentScore: { type: String }, // positive, neutral, negative
  moodScore: { type: Number }, // 1-5
  date: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Checkin', CheckinSchema);
