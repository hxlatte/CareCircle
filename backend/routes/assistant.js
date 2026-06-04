const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');

const SYSTEM_PROMPT = `You are an AI healthcare assistant designed for a senior care platform called CareCircle.

Your role:
- Help elderly users with medicines, daily routines, and basic health queries
- Provide clear, simple, and safe guidance

Behavior:
- Always respond in simple, easy-to-understand language
- Be polite, calm, and supportive
- Keep responses short and clear (2–4 sentences)

Capabilities:
- Answer questions about medicines (usage, timing, precautions)
- Suggest daily routines and reminders
- Provide basic health advice (hydration, rest, diet)
- Recognize emergency situations and respond carefully

Safety Rules:
- NEVER give a final medical diagnosis
- NEVER replace a doctor
- If the question is serious (chest pain, overdose, severe symptoms):
  → Clearly say: "Please contact a doctor or emergency services immediately"

- For medicine questions (like "Can I take penicillin"):
  → Ask about allergies if relevant
  → Give general safety info
  → Suggest consulting a doctor if unsure

Tone:
- Friendly and caring (like a helpful nurse)
- No complex medical jargon

Output:
- Only return the response text (no extra formatting, no markdown, no asterisks)`;

// POST /api/assistant/chat
router.post('/chat', auth, async (req, res) => {
  const { message, history } = req.body;

  if (!message) {
    return res.status(400).json({ msg: 'Message is required' });
  }

  try {
    // Fetch user's medical info for context
    const user = await User.findById(req.user.id).select('name medicalInfo');
    
    let medicalContext = '';
    if (user?.medicalInfo) {
      const info = user.medicalInfo;
      const parts = [];
      if (info.bloodGroup) parts.push(`Blood Group: ${info.bloodGroup}`);
      if (info.allergies) parts.push(`Known Allergies: ${info.allergies}`);
      if (info.conditions) parts.push(`Medical Conditions: ${info.conditions}`);
      if (parts.length > 0) {
        medicalContext = `\n\nIMPORTANT - This patient's medical card:\n${parts.join('\n')}\nUse this information when answering medicine-related questions. If they ask about a medicine they're allergic to, WARN them clearly.`;
      }
    }

    const fullSystemPrompt = SYSTEM_PROMPT + medicalContext;

    const apiKey = process.env.GROQ_API_KEY;
    
    if (apiKey) {
      const response = await callGroqAPI(apiKey, fullSystemPrompt, message, history || []);
      return res.json({ response });
    } else {
      return res.status(500).json({ msg: 'GROQ_API_KEY is not configured' });
    }
  } catch (err) {
    console.error('Assistant error:', err.message);
    res.status(500).json({ msg: 'Assistant is temporarily unavailable. Please try again.' });
  }
});

// Groq API integration
async function callGroqAPI(apiKey, systemPrompt, userMessage, history) {
  const url = 'https://api.groq.com/openai/v1/chat/completions';
  
  const messages = [
    { role: 'system', content: systemPrompt }
  ];
  
  // Add conversation history (last 6 messages for context)
  for (const msg of history.slice(-6)) {
    messages.push({
      role: msg.sender === 'user' ? 'user' : 'assistant',
      content: msg.text
    });
  }
  
  // Add current user message
  messages.push({ role: 'user', content: userMessage });

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages,
      temperature: 0.7,
      max_tokens: 300
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Groq API error:', response.status, errorText);
    throw new Error(`Groq API request failed: ${response.status}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || "I'm sorry, I couldn't process that. Could you try asking again?";
}

module.exports = router;
