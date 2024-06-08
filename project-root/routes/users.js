const express = require('express');
const bcrypt = require('bcrypt');
const User = require('../models/user');
const { authenticateJWT } = require('../middleware/auth');

const router = express.Router();

// Update user account
router.put('/update', authenticateJWT, async (req, res) => {
  try {
    const { oldPassword, newPassword, email } = req.body;

    // Find the user by ID
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Verify old password
    const isPasswordValid = await bcrypt.compare(oldPassword, user.password);
    if (!isPasswordValid) return res.status(400).json({ message: 'Invalid old password' });

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update user information
    user.password = hashedPassword;
    if (email) user.email = email;

    const updatedUser = await user.save();
    res.json(updatedUser);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;
