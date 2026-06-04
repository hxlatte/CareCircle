const mongoose = require('mongoose');

const MedicalRecordSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  doctorName: { type: String, required: true },
  date: { type: Date, required: true },
  condition: { type: String, required: true },
  notes: { type: String },
  fileUrl: { type: String }, // URL to the uploaded file
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('MedicalRecord', MedicalRecordSchema);
