const mongoose = require('mongoose');

const PostSchema = new mongoose.Schema({
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  authorName: { type: String, required: true },
  content: { type: String, required: true },
  supportCount: { type: Number, default: 0 },
  supportedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  languageCode: { type: String, default: 'en' },
  translations: {
    en: { type: String },
    te: { type: String },
    hi: { type: String },
    mr: { type: String }
  }
}, { timestamps: true });

module.exports = mongoose.model('Post', PostSchema);
