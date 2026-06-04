const mongoose = require('mongoose');

const ReminderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  time: { type: String, required: true }, // Format "HH:mm"
  status: { type: String, enum: ['pending', 'completed', 'snoozed'], default: 'pending' },
  lastTriggered: { type: Date },
  isSnoozed: { type: Boolean, default: false },
  snoozeTime: { type: Date },
  date: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Reminder', ReminderSchema);
