const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Reminder = require('../models/Reminder');

// POST /api/reminders
router.post('/', auth, async (req, res) => {
  try {
    const { title, time, userId } = req.body;
    const newReminder = new Reminder({
      userId: userId || req.user.id,
      title,
      time
    });
    const reminder = await newReminder.save();
    res.json(reminder);
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

// GET /api/reminders/:userId
router.get('/:userId', auth, async (req, res) => {
  try {
    const reminders = await Reminder.find({ userId: req.params.userId }).sort({ date: -1 });
    res.json(reminders);
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

// PATCH /api/reminders/:id/status
router.patch('/:id/status', auth, async (req, res) => {
  try {
    const { status, lastTriggered, isSnoozed, snoozeTime } = req.body;
    const update = {};
    if (status) update.status = status;
    if (lastTriggered) update.lastTriggered = lastTriggered;
    if (isSnoozed !== undefined) update.isSnoozed = isSnoozed;
    if (snoozeTime) update.snoozeTime = snoozeTime;

    const reminder = await Reminder.findByIdAndUpdate(req.params.id, { $set: update }, { new: true });
    res.json(reminder);
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

module.exports = router;
