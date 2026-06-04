const express = require('express');
const router = express.Router();
const axios = require('axios');
const auth = require('../middleware/auth');
const Post = require('../models/Post');
const Comment = require('../models/Comment');

// AI Helper: Detect language of a community post
async function detectLanguage(text) {
  if (!text) return 'en';
  try {
    const response = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: 'You are a language detection expert. Analyze the following text and return ONLY its 2-letter ISO language code (e.g., "en" for English, "te" for Telugu, "hi" for Hindi, "mr" for Marathi). Do not write anything else, do not include punctuation.' },
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
    const code = response.data.choices[0].message.content.trim().toLowerCase().replace(/[^a-z]/g, '');
    const validCodes = ['en', 'te', 'hi', 'mr'];
    return validCodes.includes(code) ? code : 'en';
  } catch (error) {
    console.error('Language detection error:', error.message);
    return 'en'; // Safe fallback
  }
}

// AI Helper: Translate text
async function translateText(text, targetLang) {
  if (!text || !targetLang || targetLang === 'en') return text;
  
  const langMap = {
    'te': 'Telugu',
    'hi': 'Hindi',
    'mr': 'Marathi',
    'en': 'English'
  };
  const target = langMap[targetLang];
  if (!target) return text;

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
    console.error(`Translation to ${target} failed:`, error.message);
    return text;
  }
}

// Create a new post
router.post('/posts', auth, async (req, res) => {
  try {
    const { content } = req.body;
    if (!content) return res.status(400).json({ msg: 'Post content is required' });

    // Mock AI moderation check
    const unsafeWords = ['kill', 'suicide', 'die', 'murder', 'idiot', 'stupid'];
    const isUnsafe = unsafeWords.some(word => content.toLowerCase().includes(word));
    if (isUnsafe) {
      return res.status(400).json({ msg: 'Your post violates our safety and positivity guidelines.' });
    }

    const detectedLang = await detectLanguage(content);

    const post = new Post({
      author: req.user.id,
      authorName: req.user.name || 'Anonymous Senior',
      content,
      languageCode: detectedLang,
      translations: {
        [detectedLang]: content
      }
    });

    await post.save();
    res.json(post);
  } catch (err) {
    console.error('Create post error:', err.message);
    res.status(500).send('Server Error');
  }
});

// Get all posts
router.get('/posts', auth, async (req, res) => {
  try {
    const posts = await Post.find().sort({ createdAt: -1 });
    res.json(posts);
  } catch (err) {
    console.error('Get posts error:', err.message);
    res.status(500).send('Server Error');
  }
});

// Support a post (like toggle)
router.patch('/posts/:id/support', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ msg: 'Post not found' });
    
    if (!post.supportedBy) {
      post.supportedBy = [];
    }

    const userIdStr = req.user.id.toString();
    const hasSupported = post.supportedBy.some(id => id && id.toString() === userIdStr);

    let updatedPost;
    if (hasSupported) {
      updatedPost = await Post.findByIdAndUpdate(
        req.params.id,
        { 
          $pull: { supportedBy: req.user.id },
          $inc: { supportCount: -1 } 
        },
        { new: true }
      );
    } else {
      updatedPost = await Post.findByIdAndUpdate(
        req.params.id,
        { 
          $addToSet: { supportedBy: req.user.id },
          $inc: { supportCount: 1 } 
        },
        { new: true }
      );
    }

    if (updatedPost) {
      // Always enforce supportCount equals supportedBy array length
      updatedPost.supportCount = updatedPost.supportedBy.length;
      await updatedPost.save();
    }

    res.json(updatedPost || post);
  } catch (err) {
    console.error('Support post error:', err.message);
    res.status(500).send('Server Error');
  }
});

// Translate a community post and cache it in the database
router.patch('/posts/:id/translate', auth, async (req, res) => {
  const { targetLang } = req.body;
  if (!targetLang) return res.status(400).json({ msg: 'Target language is required' });

  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ msg: 'Post not found' });

    if (!post.translations) {
      post.translations = {};
    }

    // Return cached version if already available
    if (post.translations[targetLang]) {
      return res.json(post);
    }

    // Call Groq Llama 3 to translate post dynamically
    const translatedText = await translateText(post.content, targetLang);
    post.translations[targetLang] = translatedText;
    
    post.markModified('translations');
    await post.save();

    res.json(post);
  } catch (err) {
    console.error('Post translation error:', err.message);
    res.status(500).json({ msg: 'Server error translating post', error: err.message });
  }
});

// Delete a post
router.delete('/posts/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ msg: 'Post not found' });
    
    if (post.author.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'User not authorized' });
    }

    await Post.findByIdAndDelete(req.params.id);
    res.json({ msg: 'Post removed' });
  } catch (err) {
    console.error('Delete post error:', err.message);
    if (err.kind === 'ObjectId') return res.status(404).json({ msg: 'Post not found' });
    res.status(500).send('Server Error');
  }
});

// Add a comment
router.post('/comments', auth, async (req, res) => {
  try {
    const { postId, content } = req.body;
    if (!postId || !content) return res.status(400).json({ msg: 'Post ID and content are required' });

    const comment = new Comment({
      postId,
      author: req.user.id,
      authorName: req.user.name || 'Anonymous',
      content
    });

    await comment.save();
    res.json(comment);
  } catch (err) {
    console.error('Add comment error:', err.message);
    res.status(500).send('Server Error');
  }
});

// Get comments for a post
router.get('/comments/:postId', auth, async (req, res) => {
  try {
    const comments = await Comment.find({ postId: req.params.postId }).sort({ createdAt: 1 });
    res.json(comments);
  } catch (err) {
    console.error('Get comments error:', err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
