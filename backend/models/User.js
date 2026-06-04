const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['senior', 'family'], required: true },
  languagePreference: { type: String, default: 'en' },
  linkedSeniorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  familyMembers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  phone: { type: String },
  medicalInfo: {
    bloodGroup: { type: String },
    allergies: { type: String },
    conditions: { type: String }
  },
  location: {
    lat: { type: Number },
    lng: { type: Number },
    address: { type: String },
    updatedAt: { type: Date }
  }
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);
