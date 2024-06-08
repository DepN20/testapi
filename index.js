const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');

const app = express();
const port = 8080;

// Middleware
app.use(bodyParser.json());

// MongoDB connection string
const dbURI = 'mongodb://mongo:27017/testdb';

// Connect to MongoDB
mongoose.connect(dbURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.log('Failed to connect to MongoDB:', err));

// Routes
const authRoutes = require('./project-root/routes/auth.js');
const bookRoutes = require('./project-root/routes/books.js');
const userRoutes = require('./project-root/routes/users.js');

app.use('/auth', authRoutes);
app.use('/books', bookRoutes);
app.use('/users', userRoutes);

// Root route
app.get('/', (req, res) => {
  res.send('Welcome to the Book API');
});

app.get('/testAPI', (req, res) => {
  res.send('Hello from testAPI!');
});

// Start the server
app.listen(port, () => console.log(`Server running on port ${port}`));
