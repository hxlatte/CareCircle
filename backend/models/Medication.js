const mongoose = require('mongoose');

const MedicationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  medicineName: { type: String, required: true },
  dosage: { type: String, required: true },
  languageCode: { type: String, default: 'en' },
  time: { type: String, required: true }, // e.g. "09:00 AM"
  status: { type: String, enum: ['pending', 'taken', 'missed', 'snoozed'], default: 'pending' },
  translations: {
    te: { medicineName: String, dosage: String },
    hi: { medicineName: String, dosage: String },
    mr: { medicineName: String, dosage: String }
  },
  date: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Medication', MedicationSchema);
