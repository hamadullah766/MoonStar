const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// ============ SIGNUP ============
router.post('/signup', async (req, res) => {
  try {
    const { fullName, phone, email, password, inviteCode } = req.body;

    if (!fullName || !phone || !email || !password) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }

    // Gmail only validation
    if (!email.toLowerCase().endsWith('@gmail.com')) {
      return res.status(400).json({ success: false, message: 'Only Gmail (@gmail.com) is accepted' });
    }

    const existingUser = await User.findOne({ $or: [{ email }, { phone }] });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email or Phone already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    let referredBy = null;
    if (inviteCode && inviteCode !== 'LOCKED') {
      const referrer = await User.findOne({ referralCode: inviteCode });
      if (referrer) referredBy = referrer.referralCode;
    }

    const user = new User({
      fullName,
      phone,
      email,
      password: hashedPassword,
      referredBy
    });

    await user.save();

    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.status(201).json({
      success: true,
      message: 'Account created! Welcome to NexusX 🎉',
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        balance: user.balance,
        adsCompleted: user.adsCompleted,
        adsToday: user.adsToday,
        referralCode: user.referralCode,
        badge: user.badge
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
});

// ============ LOGIN ============
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid email or password' });
    }

    if (user.isBlocked) {
      return res.status(403).json({ success: false, message: 'Account blocked. Contact support' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      success: true,
      message: 'Login successful! Welcome back 🎉',
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        balance: user.balance,
        adsCompleted: user.adsCompleted,
        adsToday: user.adsToday,
        referralCode: user.referralCode,
        badge: user.badge,
        profilePic: user.profilePic
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
});

module.exports = router;
