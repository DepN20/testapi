const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/user');

const router = express.Router();
const jwtSecret = '69c0600e2b70a659ca1f4e98c7f775815b462bd6fd1297da001a6f11b6385817';

router.post('/signup', async (req, res) => {
  console.log('Signup request received:', req.body);
  try {
    const { username, password, email } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ username, password: hashedPassword, email });
    const savedUser = await newUser.save();
    console.log('User saved:', savedUser);
    res.status(201).json(savedUser);
  } catch (err) {
    console.error('Error during signup:', err);
    res.status(400).json({ message: err.message });
  }
});

router.post('/login', async (req, res) => {
  console.log('Login request received:', req.body);
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user) {
      console.log('User not found:', username);
      return res.status(404).json({ message: 'User not found' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      console.log('Invalid password for user:', username);
      return res.status(400).json({ message: 'Invalid password' });
    }

    const token = jwt.sign({ id: user._id, role: user.role }, jwtSecret, { expiresIn: '1h' });
    console.log('Token generated for user:', username);
    res.json({ token });
  } catch (err) {
    console.error('Error during login:', err);
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;
