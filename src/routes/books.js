const express = require('express');
const bookController = require('../controllers/bookController');
const { validateCreateBook, validateUpdateBook, validateQuery } = require('../validators/bookValidators');
const { authenticate, requireAuth } = require('../middleware/authMiddleware');

const router = express.Router();

/**
 * @route   GET /api/v1/books
 * @desc    Listar livros com filtros e paginação
 * @access  Public
 */
router.get('/', validateQuery, bookController.getBooks);

/**
 * @route   GET /api/v1/books/search
 * @desc    Buscar livros por texto
 * @access  Public
 */
router.get('/search', validateQuery, bookController.searchBooks);

/**
 * @route   GET /api/v1/books/category/:categoryId
 * @desc    Listar livros por categoria
 * @access  Public
 */
router.get('/category/:categoryId', validateQuery, bookController.getBooksByCategory);

/**
 * @route   GET /api/v1/books/author/:authorId
 * @desc    Listar livros por autor
 * @access  Public
 */
router.get('/author/:authorId', validateQuery, bookController.getBooksByAuthor);

/**
 * @route   GET /api/v1/books/:id
 * @desc    Obter detalhes de um livro
 * @access  Public
 */
router.get('/:id', bookController.getBookById);

/**
 * @route   POST /api/v1/books
 * @desc    Criar novo livro
 * @access  Private (ADMIN, LIBRARIAN)
 */
router.post('/', requireAuth('ADMIN', 'LIBRARIAN'), validateCreateBook, bookController.createBook);

/**
 * @route   PUT /api/v1/books/:id
 * @desc    Atualizar livro
 * @access  Private (ADMIN, LIBRARIAN)
 */
router.put('/:id', requireAuth('ADMIN', 'LIBRARIAN'), validateUpdateBook, bookController.updateBook);

/**
 * @route   DELETE /api/v1/books/:id
 * @desc    Deletar livro
 * @access  Private (ADMIN only)
 */
router.delete('/:id', requireAuth('ADMIN'), bookController.deleteBook);

module.exports = router;