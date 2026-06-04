const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Checkin = require('../models/Checkin');
const Sentiment = require('sentiment');
const sentiment = new Sentiment();

// POST /api/checkin
router.post('/', auth, async (req, res) => {
  const { mood, notes } = req.body;

  try {
    const analysis = sentiment.analyze(notes || '');
    let sentimentLabel = 'neutral';
    let moodScore = 3;

    if (analysis.score > 0) {
      sentimentLabel = 'positive';
      moodScore = 4 + (analysis.score > 3 ? 1 : 0); // 4 or 5
    } else if (analysis.score < 0) {
      sentimentLabel = 'negative';
      moodScore = 2 - (analysis.score < -3 ? 1 : 0); // 1 or 2
    }

    const newCheckin = new Checkin({
      userId: req.user.id,
      mood,
      notes,
      sentimentScore: sentimentLabel,
      moodScore: moodScore
    });

    const checkin = await newCheckin.save();
    res.json(checkin);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// GET /api/checkin/:userId
router.get('/:userId', auth, async (req, res) => {
  try {
    const checkins = await Checkin.find({ userId: req.params.userId }).sort({ date: -1 }).limit(7);
    res.json(checkins);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
