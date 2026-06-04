const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const User = require('../models/User');
const Invitation = require('../models/Invitation');
const auth = require('../middleware/auth');

// @route   GET api/family/:id
// @desc    Get family member profile by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('name phone email');
    if (!user) {
      return res.status(404).json({ msg: 'Family member not found' });
    }
    res.json(user);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Invalid ID' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   POST api/family/invite
// @desc    Create a family invitation and generate invite link
// @access  Private (Family/Senior)
router.post('/invite', auth, async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ msg: 'Email is required' });
  }

  try {
    const currentUser = await User.findById(req.user.id);
    if (!currentUser) {
      return res.status(404).json({ msg: 'User not found' });
    }

    // Identify which senior this invitation links to.
    let seniorId = null;
    if (currentUser.role === 'senior') {
      seniorId = currentUser._id;
    } else if (currentUser.role === 'family') {
      seniorId = currentUser.linkedSeniorId;
    }

    if (!seniorId) {
      return res.status(400).json({ 
        msg: 'You must link your account to a senior before inviting other family members' 
      });
    }

    const code = crypto.randomBytes(16).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // Expires in 7 days

    const invitation = new Invitation({
      inviter: currentUser._id,
      senior: seniorId,
      email: email.toLowerCase(),
      code,
      expiresAt
    });

    await invitation.save();

    // Generate frontend invite link.
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const inviteLink = `${frontendUrl}/?invite=${code}`;

    res.json({
      msg: 'Invitation created successfully',
      code,
      inviteLink,
      expiresAt
    });
  } catch (err) {
    console.error('Create invitation error:', err);
    res.status(500).json({ msg: 'Server error creating invitation', error: err.message });
  }
});

// @route   GET api/family/invite/:code
// @desc    Verify invitation code and fetch metadata
// @access  Public
router.get('/invite/:code', async (req, res) => {
  try {
    const invitation = await Invitation.findOne({ code: req.params.code, status: 'pending' })
      .populate('inviter', 'name')
      .populate('senior', 'name');

    if (!invitation) {
      return res.status(404).json({ msg: 'Invitation not found or already accepted/expired' });
    }

    if (new Date() > invitation.expiresAt) {
      invitation.status = 'expired';
      await invitation.save();
      return res.status(410).json({ msg: 'Invitation has expired' });
    }

    res.json({
      inviterName: invitation.inviter.name,
      seniorName: invitation.senior.name,
      email: invitation.email
    });
  } catch (err) {
    console.error('Verify invitation error:', err);
    res.status(500).json({ msg: 'Server error verifying invitation', error: err.message });
  }
});

module.exports = router;
