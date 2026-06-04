const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const auth = require('../middleware/auth');
const User = require('../models/User');
const Invitation = require('../models/Invitation');

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { name, email, password, role, languagePreference, inviteCode } = req.body;

  try {
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ msg: 'User already exists' });
    }

    let linkedSeniorId = null;
    let actualRole = role;
    let activeInvitation = null;

    if (inviteCode) {
      activeInvitation = await Invitation.findOne({ code: inviteCode, status: 'pending' });
      if (!activeInvitation) {
        return res.status(400).json({ msg: 'Invalid or expired invite code' });
      }
      if (new Date() > activeInvitation.expiresAt) {
        activeInvitation.status = 'expired';
        await activeInvitation.save();
        return res.status(400).json({ msg: 'This invitation has expired' });
      }
      actualRole = 'family';
      linkedSeniorId = activeInvitation.senior;
    }

    user = new User({
      name,
      email,
      password,
      role: actualRole,
      languagePreference,
      linkedSeniorId
    });

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    await user.save();

    if (activeInvitation) {
      activeInvitation.status = 'accepted';
      await activeInvitation.save();

      await User.findByIdAndUpdate(activeInvitation.senior, {
        $addToSet: { familyMembers: user._id }
      });
    }

    const payload = {
      user: {
        id: user.id
      }
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET || 'secret',
      { expiresIn: 360000 },
      (err, token) => {
        if (err) throw err;
        res.json({ token, user: { id: user.id, name: user.name, role: user.role, linkedSeniorId: user.linkedSeniorId } });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    let user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ msg: 'Invalid Credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Invalid Credentials' });
    }

    const payload = {
      user: {
        id: user.id
      }
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET || 'secret',
      { expiresIn: 360000 },
      (err, token) => {
        if (err) throw err;
        res.json({ 
          token, 
          user: { 
            id: user.id, 
            name: user.name, 
            email: user.email,
            role: user.role, 
            phone: user.phone,
            medicalInfo: user.medicalInfo,
            linkedSeniorId: user.linkedSeniorId,
            languagePreference: user.languagePreference
          } 
        });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

// POST /api/auth/link-senior
router.post('/link-senior', auth, async (req, res) => {
  const { familyUserId, seniorEmail } = req.body;
  const fId = familyUserId || req.user.id;

  try {
    const familyUser = await User.findById(fId);
    if (!familyUser || familyUser.role !== 'family') {
      return res.status(403).json({ msg: 'Only family members can link senior accounts' });
    }

    const seniorUser = await User.findOne({ email: seniorEmail, role: 'senior' });
    if (!seniorUser) {
      return res.status(404).json({ msg: 'Senior account not found' });
    }

    familyUser.linkedSeniorId = seniorUser._id;
    await familyUser.save();

    if (!seniorUser.familyMembers.includes(familyUser._id)) {
      seniorUser.familyMembers.push(familyUser._id);
      await seniorUser.save();
    }

    res.json({ 
      msg: 'Accounts linked successfully', 
      seniorName: seniorUser.name, 
      linkedSeniorId: seniorUser._id 
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// GET /api/auth/me
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// GET /api/auth/profile/:userId
router.get('/profile/:userId', auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select('-password');
    if (!user) return res.status(404).json({ msg: 'User not found' });
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// GET /api/auth/family/:id
router.get('/family/:id', auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('name phone email');
    if (!user) return res.status(404).json({ msg: 'Family member not found' });
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});


// PATCH /api/auth/profile
// Update current user's profile
router.patch('/profile', auth, async (req, res) => {
  const { name, phone, medicalInfo, linkedSeniorId, location, languagePreference } = req.body;
  const updateFields = {};
  if (name !== undefined) updateFields.name = name;
  if (phone !== undefined) updateFields.phone = phone;
  if (medicalInfo !== undefined) updateFields.medicalInfo = medicalInfo;
  if (linkedSeniorId !== undefined) updateFields.linkedSeniorId = linkedSeniorId;
  if (location !== undefined) updateFields.location = location;
  if (languagePreference !== undefined) updateFields.languagePreference = languagePreference;

  try {
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updateFields },
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    res.json(user);
  } catch (err) {
    res.status(500).json({ msg: 'Server Error', error: err.message });
  }
});

// PATCH /api/auth/profile/:userId
// Update a specific user's profile
router.patch('/profile/:userId', auth, async (req, res) => {
  const { name, phone, medicalInfo, linkedSeniorId, location } = req.body;
  const updateFields = {};
  if (name !== undefined) updateFields.name = name;
  if (phone !== undefined) updateFields.phone = phone;
  if (medicalInfo !== undefined) updateFields.medicalInfo = medicalInfo;
  if (linkedSeniorId !== undefined) updateFields.linkedSeniorId = linkedSeniorId;
  if (location !== undefined) updateFields.location = location;

  try {
    const user = await User.findByIdAndUpdate(
      req.params.userId,
      { $set: updateFields },
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    
    res.json(user);
  } catch (err) {
    res.status(500).json({ msg: 'Server Error', error: err.message });
  }
});


// PATCH /api/auth/location
// Update current user's GPS coordinates
router.patch('/location', auth, async (req, res) => {
  const { lat, lng, address } = req.body;
  if (lat === undefined || lng === undefined) {
    return res.status(400).json({ msg: 'Latitude and longitude are required' });
  }

  try {
    const user = await User.findByIdAndUpdate(
      req.user.id,
      {
        $set: {
          location: {
            lat,
            lng,
            address: address || `${lat.toFixed(4)}, ${lng.toFixed(4)} (GPS)`,
            updatedAt: new Date()
          }
        }
      },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    res.json(user);
  } catch (err) {
    console.error('Location update error:', err.message);
    res.status(500).json({ msg: 'Server Error', error: err.message });
  }
});

module.exports = router;
