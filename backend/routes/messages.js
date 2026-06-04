const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Message = require('../models/Message');
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

// POST /api/messages
router.post('/', auth, async (req, res) => {
  const { text, receiverId, languageCode } = req.body;
  try {
    const user = await User.findById(req.user.id);
    let targetId = receiverId;
    
    if (!targetId) {
      if (user.role === 'family') {
        targetId = user.linkedSeniorId;
      } else {
        targetId = user.familyMembers[0];
      }
    }

    if (!targetId) return res.status(400).json({ msg: 'No linked user found' });

    const langs = ['te', 'hi', 'mr'];
    let translations = {};
    for (const l of langs) {
      if (l !== languageCode) {
        translations[l] = await translateText(text, l);
      } else {
        translations[l] = text;
      }
    }

    const newMessage = new Message({
      senderId: req.user.id,
      receiverId: targetId,
      text,
      languageCode: languageCode || 'en',
      translations
    });

    const message = await newMessage.save();

    // Create Notification
    const targetUser = await User.findById(targetId);
    let notifTranslations = {};
    if (targetUser && targetUser.languagePreference && targetUser.languagePreference !== 'en') {
      const transTitle = await translateText('New Message', targetUser.languagePreference);
      const transMessage = await translateText(`${user.name} sent you a message: "${text.substring(0, 20)}${text.length > 20 ? '...' : ''}"`, targetUser.languagePreference);
      notifTranslations[targetUser.languagePreference] = { title: transTitle, message: transMessage };
    }

    const newNotification = new Notification({
      userId: targetId,
      title: 'New Message',
      titleKey: 'new_message',
      message: `${user.name} sent you a message: "${text.substring(0, 20)}${text.length > 20 ? '...' : ''}"`,
      type: 'message',
      translations: notifTranslations
    });
    await newNotification.save();

    res.json(message);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// GET /api/messages/:userId
router.get('/:userId', auth, async (req, res) => {
  try {
    const messages = await Message.find({ 
      $or: [{ receiverId: req.params.userId }, { senderId: req.params.userId }]
    })
    .sort({ timestamp: -1 })
    .populate('senderId', 'name');
    res.json(messages);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
