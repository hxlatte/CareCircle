const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Checkin = require('../models/Checkin');
const Medication = require('../models/Medication');
const Task = require('../models/Task');
const HealthLog = require('../models/HealthLog');
const Alert = require('../models/Alert');
const User = require('../models/User');

// Helper to calculate percentages
const getPercentage = (part, total) => total === 0 ? 0 : Math.round((part / total) * 100);

// GET /api/insights/:userId
router.get('/:userId', auth, async (req, res) => {
  try {
    const userId = req.params.userId;
    
    // Fetch data
    const senior = await User.findById(userId).select('name location');
    const checkins = await Checkin.find({ userId }).sort({ date: -1 }).limit(10);
    const medications = await Medication.find({ userId });
    const tasks = await Task.find({ assignedTo: userId });
    const healthLogs = await HealthLog.find({ userId });
    const alerts = await Alert.find({ userId }).sort({ date: -1 }).limit(10);

    // 1. Average Mood Score
    const moodMap = { 'UNWELL': 1, 'TIRED': 2, 'JUST_OKAY': 3, 'GOOD': 4, 'WONDERFUL': 5 };
    let totalMoodScore = 0;
    let moodCount = 0;
    checkins.forEach(c => {
      // Use stored moodScore or calculate from string
      const score = c.moodScore || moodMap[c.mood] || 3;
      totalMoodScore += score;
      moodCount++;
    });
    const avgMoodScore = moodCount > 0 ? (totalMoodScore / moodCount).toFixed(1) : 0;

    // 2. Medicine Adherence %
    const totalMeds = medications.length;
    const takenMeds = medications.filter(m => m.status === 'taken').length;
    const medAdherence = getPercentage(takenMeds, totalMeds);

    // 3. Task Completion %
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    const taskCompletion = getPercentage(completedTasks, totalTasks);

    // 4. Average Sleep Hours
    let totalSleep = 0;
    let sleepCount = 0;
    healthLogs.forEach(h => {
      if (h.sleepHours) {
        totalSleep += h.sleepHours;
        sleepCount++;
      }
    });
    const avgSleepHours = sleepCount > 0 ? (totalSleep / sleepCount).toFixed(1) : 0;

    // 5. Mood History for Charts
    const moodHistory = checkins.slice(0, 7).map(c => ({
      date: new Date(c.date).toLocaleDateString([], { weekday: 'short' }),
      score: c.moodScore || moodMap[c.mood] || 3
    })).reverse();

    // 6. Sleep History for Charts
    const sleepHistory = healthLogs.slice(0, 7).map(h => ({
      date: new Date(h.date).toLocaleDateString([], { weekday: 'short' }),
      hours: h.sleepHours || 0
    })).reverse();

    // 7. Latest Health Log for vitals
    const latestHealthLog = await HealthLog.findOne({ userId }).sort({ date: -1 });

    res.json({
      seniorName: senior ? senior.name : 'Senior',
      averageMoodScore: avgMoodScore,
      medicineAdherence: medAdherence,
      medicationStats: { taken: takenMeds, total: totalMeds },
      taskCompletion: taskCompletion,
      taskStats: { completed: completedTasks, total: totalTasks },
      averageSleepHours: avgSleepHours,
      alertCount: alerts.length,
      recentAlerts: alerts.slice(0, 5),
      todayMood: checkins[0] ? checkins[0].mood : 'No data',
      lastCheckinTime: checkins[0] ? new Date(checkins[0].date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'No data',
      moodHistory,
      sleepHistory,
      latestVitals: latestHealthLog || { heartRate: '--', sleepHours: '--', steps: '--' },
      location: senior ? senior.location : null
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
