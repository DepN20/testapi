const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');

const app = express();
const port = 8080;

// Middleware
app.use(bodyParser.json());

// MongoDB connection string (commented out for now)
// const dbURI = 'mongodb://mongo:27017/testdb';

// Connect to MongoDB (commented out for now)
// mongoose.connect(dbURI, { useNewUrlParser: true, useUnifiedTopology: true })
//   .then(() => console.log('Connected to MongoDB'))
//   .catch(err => console.log(err));

// Routes
app.get('/', (req, res) => {
  res.send('Welcome to the Book API');
});

app.get('/testAPI', (req, res) => {
  res.send('Hello from testAPI!');
});

// Start the server
app.listen(port, () => console.log(`Server running on port ${port}`));
