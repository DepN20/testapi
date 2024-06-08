const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();
const port = 8080;
const jwtSecret = '69c0600e2b70a659ca1f4e98c7f775815b462bd6fd1297da001a6f11b6385817';

// Middleware
app.use(bodyParser.json());

// MongoDB connection string
const dbURI = 'mongodb://mongo:27017/testdb';

// Connect to MongoDB
mongoose.connect(dbURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.log('Failed to connect to MongoDB:', err));

// Define the User model
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

// Define the Book model
const bookSchema = new mongoose.Schema({
  title: String,
  author: String,
  publishedDate: Date,
  pages: Number,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

const Book = mongoose.model('Book', bookSchema);

// Authentication middleware
const authenticateJWT = (req, res, next) => {
  const token = req.header('Authorization');
  if (!token) return res.status(401).json({ message: 'Access denied' });

  try {
    const decoded = jwt.verify(token.split(' ')[1], jwtSecret);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(400).json({ message: 'Invalid token' });
  }
};

// Routes
app.get('/', (req, res) => {
  res.send('Welcome to the Book API');
});

app.get('/testAPI', (req, res) => {
  res.send('Hello from testAPI!');
});

app.post('/signup', async (req, res) => {
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

app.post('/login', async (req, res) => {
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

// Update user account
app.put('/users/update', authenticateJWT, async (req, res) => {
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

// Create a book
app.post('/books', authenticateJWT, async (req, res) => {
  const book = new Book({ ...req.body, createdBy: req.user.id });
  try {
    const savedBook = await book.save();
    res.status(201).json(savedBook);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Get all books
app.get('/books', authenticateJWT, async (req, res) => {
  try {
    const books = await Book.find().populate('createdBy', 'username');
    res.json(books);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get a book by ID
app.get('/books/:id', authenticateJWT, async (req, res) => {
  try {
    const book = await Book.findById(req.params.id).populate('createdBy', 'username');
    if (!book) return res.status(404).json({ message: 'Book not found' });
    res.json(book);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update a book
app.put('/books/:id', authenticateJWT, async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) return res.status(404).json({ message: 'Book not found' });

    // Only allow the owner or an admin to update the book
    if (book.createdBy.toString() !== req.user.id && !req.user.role === 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const updatedBook = await Book.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updatedBook);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete a book
app.delete('/books/:id', authenticateJWT, async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) return res.status(404).json({ message: 'Book not found' });

    // Only allow the owner or an admin to delete the book
    if (book.createdBy.toString() !== req.user.id && !req.user.role === 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    await book.remove();
    res.json({ message: 'Book deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Start the server
app.listen(port, () => console.log(`Server running on port ${port}`));
