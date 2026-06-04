const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const HealthLog = require('../models/HealthLog');

// POST /api/health
router.post('/', auth, async (req, res) => {
  const { heartRate, bloodPressure, weight, sleepHours } = req.body;

  try {
    const newHealthLog = new HealthLog({
      userId: req.user.id,
      heartRate,
      bloodPressure,
      weight,
      sleepHours
    });

    const healthLog = await newHealthLog.save();
    res.json(healthLog);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// GET /api/health/:userId
router.get('/:userId', auth, async (req, res) => {
  try {
    const healthLogs = await HealthLog.find({ userId: req.params.userId }).sort({ date: -1 });
    res.json(healthLogs);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
