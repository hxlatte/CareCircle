const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Task = require('../models/Task');
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
    return text; // Fallback to original text on failure
  }
}

const TASK_KEY_MAP = {
  "call the doctor": "task_call_doctor",
  "call doctor": "task_call_doctor",
  "take medicines": "task_take_medicines",
  "take medicine": "task_take_medicines",
  "morning walk": "task_morning_walk",
  "evening walk": "task_evening_walk",
  "drink water": "task_drink_water",
  "rest": "task_rest"
};

// POST /api/tasks
router.post('/', auth, async (req, res) => {
  const { title, assignedTo, dueDate, languageCode } = req.body;
  try {
    const familyUser = await User.findById(req.user.id);
    const targetSeniorId = assignedTo || familyUser.linkedSeniorId;

    if (!targetSeniorId) {
      return res.status(400).json({ msg: 'No senior linked to this account. Please link a senior first.' });
    }

    const seniorUser = await User.findById(targetSeniorId);
    
    // Key-based translation check
    const lowerTitle = title.toLowerCase().trim();
    const titleKey = TASK_KEY_MAP[lowerTitle] || null;

    const trans_en = languageCode === 'en' ? title : await translateText(title, 'en');
    const trans_te = languageCode === 'te' ? title : await translateText(title, 'te');
    const trans_hi = languageCode === 'hi' ? title : await translateText(title, 'hi');
    const trans_mr = languageCode === 'mr' ? title : await translateText(title, 'mr');

    const newTask = new Task({
      assignedTo: targetSeniorId,
      assignedBy: req.user.id,
      titleKey: titleKey,
      originalText: title,
      languageCode: languageCode || 'en',
      title_en: trans_en,
      title_te: trans_te,
      title_hi: trans_hi,
      title_mr: trans_mr,
      dueDate
    });

    const task = await newTask.save();

    // Notify Senior
    let notifTranslations = {};
    const langs = ['te', 'hi', 'mr'];
    
    for (const l of langs) {
      if (seniorUser) {
        const transTitle = await translateText('New Task Assigned', l);
        const transMessage = await translateText(`${familyUser.name} added a new task: ${title}`, l);
        notifTranslations[l] = { title: transTitle, message: transMessage };
      }
    }

    const newNotif = new Notification({
      userId: targetSeniorId,
      title: 'New Task Assigned',
      titleKey: 'new_task_assigned',
      message: `${familyUser.name} added a new task: ${title}`,
      type: 'task',
      translations: notifTranslations
    });
    await newNotif.save();

    res.json(task);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// GET /api/tasks/family
router.get('/family', auth, async (req, res) => {
  try {
    const familyUser = await User.findById(req.user.id);
    if (!familyUser.linkedSeniorId) {
      return res.status(400).json({ msg: 'No senior linked' });
    }
    const tasks = await Task.find({ assignedTo: familyUser.linkedSeniorId }).sort({ dueDate: 1 });
    res.json(tasks);
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

// GET /api/tasks/:userId
router.get('/:userId', auth, async (req, res) => {
  try {
    let query = { assignedTo: req.params.userId };
    
    if (req.query.today === 'true') {
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      const end = new Date();
      end.setHours(23, 59, 59, 999);
      query.dueDate = { $gte: start, $lte: end };
    }

    const tasks = await Task.find(query).sort({ dueDate: 1 }).populate('assignedBy', 'name').lean();
    
    // Handle missing translations for old tasks on the fly
    let updated = false;
    for (let i = 0; i < tasks.length; i++) {
      let taskUpdated = false;
      let updates = {};
      
      // If task has old "title" but no "title_en", migrate it
      if (tasks[i].title && !tasks[i].title_en) {
        updates.title_en = tasks[i].title;
        tasks[i].title_en = tasks[i].title;
        taskUpdated = true;
      }

      if (!tasks[i].title_te) {
        const trans = await translateText(tasks[i].title_en || tasks[i].title, 'te');
        updates.title_te = trans;
        tasks[i].title_te = trans;
        taskUpdated = true;
      }
      
      if (!tasks[i].title_hi) {
        const trans = await translateText(tasks[i].title_en || tasks[i].title, 'hi');
        updates.title_hi = trans;
        tasks[i].title_hi = trans;
        taskUpdated = true;
      }
      
      if (!tasks[i].title_mr) {
        const trans = await translateText(tasks[i].title_en || tasks[i].title, 'mr');
        updates.title_mr = trans;
        tasks[i].title_mr = trans;
        taskUpdated = true;
      }
      
      if (taskUpdated) {
        await Task.findByIdAndUpdate(tasks[i]._id, { $set: updates });
      }
    }

    res.json(tasks);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// PATCH /api/tasks/status
router.patch('/status', auth, async (req, res) => {
  const { id, status } = req.body;
  try {
    const task = await Task.findByIdAndUpdate(id, { 
      status, 
      completedAt: status === 'completed' ? new Date() : null 
    }, { new: true });

    if (status === 'completed') {
      const seniorUser = await User.findById(task.assignedTo);
      const newNotif = new Notification({
        userId: task.assignedBy,
        title: 'Task Completed',
        message: `${seniorUser.name} completed the task: ${task.title_en || task.title}`,
        type: 'task'
      });
      await newNotif.save();
    }

    res.json(task);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
