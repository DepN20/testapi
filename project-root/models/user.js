const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  role: { type: String, default: 'user' }
});

userSchema.methods.isAdmin = function() {
  return this.role === 'admin';
};

const User = mongoose.model('User', userSchema);

module.exports = User;