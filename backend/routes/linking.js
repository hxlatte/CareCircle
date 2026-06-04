const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middleware/auth');

// @route   POST /api/linking/senior
// @desc    Link a family member to a senior citizen
router.post('/senior', auth, async (req, res) => {
  const { familyUserId, seniorEmail } = req.body;
  const fId = familyUserId || req.user.id;
  try {
    const seniorUser = await User.findOne({ email: seniorEmail, role: 'senior' });
    if (!seniorUser) {
      return res.status(404).json({ msg: `Senior account not found with email ${seniorEmail}. Please ensure the senior has registered with this email.` });
    }

    const familyUser = await User.findById(fId);
    if (!familyUser) {
      return res.status(404).json({ msg: 'Family account not found' });
    }

    familyUser.linkedSeniorId = seniorUser._id;
    await familyUser.save();

    await User.findByIdAndUpdate(seniorUser._id, { $addToSet: { familyMembers: fId } });

    res.json({ msg: `Successfully linked to ${seniorUser.name}`, seniorName: seniorUser.name });
  } catch (err) {
    console.error('Linking error:', err);
    res.status(500).json({ msg: 'Internal server error during linking', error: err.message });
  }
});

module.exports = router;
