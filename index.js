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

// Define the Book model
const bookSchema = new mongoose.Schema({
  title: String,
  author: String,
  publishedDate: Date,
  pages: Number,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

const Book = mongoose.model('Book', bookSchema);

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  role: { type: String, default: 'user' }
});

const User = mongoose.model('User', userSchema);

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

// Create a book
app.post('/books', async (req, res) => {
  const book = new Book(req.body);
  try {
    const savedBook = await book.save();
    res.status(201).json(savedBook);
  } catch (err) {
    console.log(err);
    res.status(400).json({ message: err.message });
  }
});

// Get all books
app.get('/books', async (req, res) => {
  try {
    const books = await Book.find();
    res.json(books);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get a book by ID
app.get('/books/:id', async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) return res.status(404).json({ message: 'Book not found' });
    res.json(book);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update a book
app.put('/books/:id', async (req, res) => {
  try {
    const updatedBook = await Book.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedBook) return res.status(404).json({ message: 'Book not found' });
    res.json(updatedBook);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete a book
app.delete('/books/:id', async (req, res) => {
  try {
    const deletedBook = await Book.findByIdAndDelete(req.params.id);
    if (!deletedBook) return res.status(404).json({ message: 'Book not found' });
    res.json({ message: 'Book deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

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

app.use('/books', authenticateJWT);

// Start the server
app.listen(port, () => console.log(`Server running on port ${port}`));
