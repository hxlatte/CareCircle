const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Medication = require('../models/Medication');
const User = require('../models/User');
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

// POST /api/medications
router.post('/', auth, async (req, res) => {
  const { medicineName, dosage, time, userId, languageCode } = req.body;
  try {
    const familyUser = await User.findById(req.user.id);
    const targetSeniorId = userId || familyUser.linkedSeniorId;

    if (!targetSeniorId) {
      return res.status(400).json({ msg: 'No senior linked' });
    }

    const langs = ['te', 'hi', 'mr'];
    let translations = {};
    
    for (const l of langs) {
      if (l !== languageCode) {
        const transName = await translateText(medicineName, l);
        const transDosage = await translateText(dosage, l);
        translations[l] = { medicineName: transName, dosage: transDosage };
      } else {
        translations[l] = { medicineName, dosage };
      }
    }

    const newMed = new Medication({
      userId: targetSeniorId,
      medicineName,
      dosage,
      languageCode: languageCode || 'en',
      time,
      translations
    });

    const med = await newMed.save();
    res.json(med);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// GET /api/medications/:userId
router.get('/:userId', auth, async (req, res) => {
  try {
    const medications = await Medication.find({ userId: req.params.userId }).lean();
    
    const seniorUser = await User.findById(req.params.userId);
    const prefLang = seniorUser?.languagePreference || 'en';

    if (prefLang !== 'en') {
      let updated = false;
      for (let i = 0; i < medications.length; i++) {
        if (!medications[i].translations) medications[i].translations = {};
        if (!medications[i].translations[prefLang]) {
          const transName = await translateText(medications[i].medicineName, prefLang);
          const transDosage = await translateText(medications[i].dosage, prefLang);
          medications[i].translations[prefLang] = { medicineName: transName, dosage: transDosage };
          await Medication.findByIdAndUpdate(medications[i]._id, { 
            $set: { [`translations.${prefLang}`]: medications[i].translations[prefLang] } 
          });
          updated = true;
        }
      }
    }

    res.json(medications);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

const Notification = require('../models/Notification');

// PATCH /api/medications/status
router.patch('/status', auth, async (req, res) => {
  const { id, status } = req.body;
  try {
    const med = await Medication.findByIdAndUpdate(id, { status, date: new Date() }, { new: true });
    
    if (status === 'taken') {
      const seniorUser = await User.findById(med.userId);
      if (seniorUser && seniorUser.familyMembers) {
        for (const familyId of seniorUser.familyMembers) {
          const familyUser = await User.findById(familyId);
          let notifTranslations = {};
          if (familyUser && familyUser.languagePreference !== 'en') {
            const l = familyUser.languagePreference;
            const transTitle = await translateText('Medicine Taken', l);
            const transMessage = await translateText(`${seniorUser.name} has taken their medicine: ${med.medicineName}`, l);
            notifTranslations[l] = { title: transTitle, message: transMessage };
          }

          const newNotif = new Notification({
            userId: familyId,
            title: 'Medicine Taken',
            titleKey: 'medicine_taken',
            message: `${seniorUser.name} has taken their medicine: ${med.medicineName}`,
            type: 'medicine',
            translations: notifTranslations
          });
          await newNotif.save();
        }
      }
    }

    res.json(med);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
