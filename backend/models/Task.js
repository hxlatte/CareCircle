const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema({
  titleKey: { type: String },
  originalText: { type: String },
  languageCode: { type: String, default: 'en' },
  title_en: { type: String, required: true },
  title_te: { type: String },
  title_hi: { type: String },
  title_mr: { type: String },
  description: { type: String },
  assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  dueDate: { type: Date },
  status: { type: String, enum: ['pending', 'completed'], default: 'pending' },
  completedAt: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('Task', TaskSchema);
