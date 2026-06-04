const express = require('express');
const router = express.Router();
const axios = require('axios');
const auth = require('../middleware/auth');
const Notification = require('../models/Notification');

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
    return text; // Fallback to original text on failure
  }
}

// GET /api/notifications
// Get all notifications for the current user and translate dynamically if language preference is provided
router.get('/', auth, async (req, res) => {
  try {
    const lang = req.query.lang || req.user.languagePreference || 'en';
    const notifications = await Notification.find({ userId: req.user.id })
      .sort({ timestamp: -1 })
      .limit(20);

    const isSupportedLang = ['te', 'hi', 'mr'].includes(lang);

    if (isSupportedLang) {
      const updatedNotifications = await Promise.all(notifications.map(async (n) => {
        if (!n.translations) {
          n.translations = {};
        }
        if (!n.translations[lang] || !n.translations[lang].message || !n.translations[lang].title) {
          try {
            const transTitle = await translateText(n.title, lang);
            const transMessage = await translateText(n.message, lang);
            n.translations[lang] = { title: transTitle, message: transMessage };
            n.markModified('translations');
            await n.save();
          } catch (transErr) {
            console.error(`Dynamic notification translation error for notification ${n._id}:`, transErr.message);
          }
        }
        return n;
      }));
      return res.json(updatedNotifications);
    }

    res.json(notifications);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// PATCH /api/notifications/:id/read
// Mark a notification as read
router.patch('/:id/read', auth, async (req, res) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { $set: { isRead: true } },
      { new: true }
    );
    res.json(notification);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
