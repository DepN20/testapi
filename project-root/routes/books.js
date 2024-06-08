const express = require('express');
const Book = require('../models/book');
const { authenticateJWT } = require('../middleware/auth');

const router = express.Router();

// Create a book
router.post('/', authenticateJWT, async (req, res) => {
  const book = new Book({ ...req.body, createdBy: req.user.id });
  try {
    const savedBook = await book.save();
    res.status(201).json(savedBook);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Get all books
router.get('/', authenticateJWT, async (req, res) => {
  try {
    const books = await Book.find().populate('createdBy', 'username');
    res.json(books);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get a book by ID
router.get('/:id', authenticateJWT, async (req, res) => {
  try {
    const book = await Book.findById(req.params.id).populate('createdBy', 'username');
    if (!book) return res.status(404).json({ message: 'Book not found' });
    res.json(book);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update a book
router.put('/:id', authenticateJWT, async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) return res.status(404).json({ message: 'Book not found' });

    // Only allow the owner or an admin to update the book
    if (book.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const updatedBook = await Book.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updatedBook);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete a book
router.delete('/:id', authenticateJWT, async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) return res.status(404).json({ message: 'Book not found' });

    // Only allow the owner or an admin to delete the book
    if (book.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    await book.remove();
    res.json({ message: 'Book deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
