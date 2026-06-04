const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Alert = require('../models/Alert');
const User = require('../models/User');
const Notification = require('../models/Notification');
const axios = require('axios');

async function translateText(text, targetLang) {
  if (!text || targetLang === 'en') return text;
  
  const langMap = {
    'te': 'Telugu',
    'hi': 'Hindi',
    'mr': 'Marathi'
  };
  const target = langMap[targetLang] || 'English';

  try {
    const response = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: `You are a professional translator. Translate the following text into ${target}. Respond with ONLY the translated text, no quotes or extra words.` },
          { role: 'user', content: text }
        ]
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    return response.data.choices[0].message.content.trim();
  } catch (error) {
    console.error('Translation error:', error.message);
    return text;
  }
}

// POST /api/alerts
router.post('/', auth, async (req, res) => {
  const { userId, type, message, severity } = req.body;
  const targetUserId = userId || req.user.id;

  try {
    const newAlert = new Alert({
      userId: targetUserId,
      type: type || 'emergency',
      message,
      severity
    });

    const alert = await newAlert.save();

    // Create Notification for Linked Users (Family)
    const user = await User.findById(targetUserId);
    if (user && user.role === 'senior') {
      // Find family members linked to this senior
      const linkedFamily = await User.find({ linkedSeniorId: targetUserId, role: 'family' });
      for (const family of linkedFamily) {
        let notifTranslations = {};
        if (family.languagePreference && family.languagePreference !== 'en') {
          const l = family.languagePreference;
          const transTitle = await translateText('Emergency Alert', l);
          const transMessage = await translateText(`${user.name} sent an SOS alert: ${message}`, l);
          notifTranslations[l] = { title: transTitle, message: transMessage };
        }
        const notification = new Notification({
          userId: family._id,
          title: 'Emergency Alert',
          titleKey: 'emergency_alert',
          message: `${user.name} sent an SOS alert: ${message}`,
          type: 'alert',
          severity: severity || 'critical',
          translations: notifTranslations
        });
        await notification.save();
      }
    }

    res.json(alert);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// GET /api/alerts/:userId
router.get('/:userId', auth, async (req, res) => {
  try {
    const alerts = await Alert.find({ userId: req.params.userId }).sort({ date: -1 });
    res.json(alerts);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// DELETE /api/alerts/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    await Alert.findByIdAndDelete(req.params.id);
    res.json({ msg: 'Alert removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
