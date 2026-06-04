const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const auth = require('../middleware/auth');
const MedicalRecord = require('../models/MedicalRecord');

// Ensure upload directory exists
const uploadDir = 'uploads/medical-records/';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer Setup
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// POST /api/medical-records
router.post('/', [auth, upload.single('file')], async (req, res) => {
  const { doctorName, date, condition, notes, userId } = req.body;
  
  const mongoose = require('mongoose');
  let targetUserId = userId;
  if (!targetUserId || targetUserId === 'undefined' || targetUserId === 'null' || !mongoose.Types.ObjectId.isValid(targetUserId)) {
    targetUserId = req.user.id;
  }

  try {
    let parsedDate = new Date(date);
    
    // Parse DD-MM-YYYY format strings safely (e.g. "30-05-2026")
    if (isNaN(parsedDate.getTime()) && typeof date === 'string') {
      const parts = date.split('-');
      if (parts.length === 3) {
        // DD-MM-YYYY -> parts[2]=YYYY, parts[1]=MM (0-indexed), parts[0]=DD
        parsedDate = new Date(parts[2], parts[1] - 1, parts[0]);
      }
    }

    if (isNaN(parsedDate.getTime())) {
      return res.status(400).json({ msg: 'Invalid date format provided. Please use YYYY-MM-DD or DD-MM-YYYY.' });
    }

    const newRecord = new MedicalRecord({
      userId: targetUserId,
      doctorName,
      date: parsedDate,
      condition,
      notes,
      fileUrl: req.file ? `/uploads/medical-records/${req.file.filename}` : null
    });

    const record = await newRecord.save();
    res.json(record);
  } catch (err) {
    console.error('Save medical record error:', err);
    res.status(500).json({ msg: 'Server Error saving medical record', error: err.message });
  }
});

// GET /api/medical-records/:userId
router.get('/:userId', auth, async (req, res) => {
  try {
    const records = await MedicalRecord.find({ userId: req.params.userId }).sort({ date: -1 });
    res.json(records);
  } catch (err) {
    console.error('Get medical records error:', err.message);
    res.status(500).send('Server Error');
  }
});

// DELETE /api/medical-records/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    await MedicalRecord.findByIdAndDelete(req.params.id);
    res.json({ msg: 'Record removed' });
  } catch (err) {
    console.error('Delete medical record error:', err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
