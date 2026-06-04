const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  titleKey: { type: String },
  messageKey: { type: String },
  translations: {
    te: { title: String, message: String },
    hi: { title: String, message: String },
    mr: { title: String, message: String }
  },
  type: { type: String, enum: ['medicine', 'message', 'alert', 'task'], required: true },
  isRead: { type: Boolean, default: false },
  timestamp: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Notification', NotificationSchema);
