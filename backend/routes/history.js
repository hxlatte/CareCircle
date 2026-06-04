const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Checkin = require('../models/Checkin');
const Medication = require('../models/Medication');
const Task = require('../models/Task');
const HealthLog = require('../models/HealthLog');
const Alert = require('../models/Alert');

// GET /api/history/:userId
router.get('/:userId', auth, async (req, res) => {
  try {
    const userId = req.params.userId;
    
    // Fetch all related documents
    const checkins = await Checkin.find({ userId });
    const medications = await Medication.find({ userId });
    const tasks = await Task.find({ assignedTo: userId });
    const healthLogs = await HealthLog.find({ userId });
    const alerts = await Alert.find({ userId });

    let timeline = [];

    // Map Checkins
    checkins.forEach(c => {
      timeline.push({
        type: 'checkin',
        title: 'Mood Check-in',
        description: `Feeling ${c.mood}`,
        date: c.date,
        data: c
      });
    });

    // Map Medications
    medications.forEach(m => {
      if (m.status !== 'pending') {
        timeline.push({
          type: 'medication',
          title: 'Medication',
          description: `${m.medicineName} - ${m.status}`,
          date: m.date,
          data: m
        });
      }
    });

    // Map Tasks
    tasks.forEach(t => {
      if (t.status === 'completed') {
        timeline.push({
          type: 'task',
          title: 'Task Completed',
          description: t.title,
          date: t.completedAt || t.updatedAt,
          data: t
        });
      }
    });

    // Map HealthLogs
    healthLogs.forEach(h => {
      timeline.push({
        type: 'healthlog',
        title: 'Health Log Added',
        description: 'Vitals recorded',
        date: h.date,
        data: h
      });
    });

    // Map Alerts
    alerts.forEach(a => {
      timeline.push({
        type: 'alert',
        title: 'Alert',
        description: a.message,
        date: a.date,
        data: a
      });
    });

    // Sort by date descending
    timeline.sort((a, b) => new Date(b.date) - new Date(a.date));

    res.json(timeline);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
