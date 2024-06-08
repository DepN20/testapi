const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
  title: String,
  author: String,
  publishedDate: Date,
  pages: Number,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

const Book = mongoose.model('Book', bookSchema);

module.exports = Book;
