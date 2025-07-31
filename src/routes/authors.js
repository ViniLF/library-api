const express = require('express');
const authorController = require('../controllers/authorController');
const { validateCreateAuthor, validateUpdateAuthor } = require('../validators/authorValidators');
const { requireAuth } = require('../middleware/authMiddleware');

const router = express.Router();

/**
 * @route   GET /api/v1/authors
 * @desc    Listar todos os autores
 * @access  Public
 */
router.get('/', authorController.getAuthors);

/**
 * @route   GET /api/v1/authors/search
 * @desc    Buscar autores por texto
 * @access  Public
 */
router.get('/search', authorController.searchAuthors);

/**
 * @route   GET /api/v1/authors/:id
 * @desc    Obter detalhes de um autor
 * @access  Public
 */
router.get('/:id', authorController.getAuthorById);

/**
 * @route   POST /api/v1/authors
 * @desc    Criar novo autor
 * @access  Private (ADMIN, LIBRARIAN)
 */
router.post('/', requireAuth('ADMIN', 'LIBRARIAN'), validateCreateAuthor, authorController.createAuthor);

/**
 * @route   PUT /api/v1/authors/:id
 * @desc    Atualizar autor
 * @access  Private (ADMIN, LIBRARIAN)
 */
router.put('/:id', requireAuth('ADMIN', 'LIBRARIAN'), validateUpdateAuthor, authorController.updateAuthor);

/**
 * @route   DELETE /api/v1/authors/:id
 * @desc    Deletar autor
 * @access  Private (ADMIN only)
 */
router.delete('/:id', requireAuth('ADMIN'), authorController.deleteAuthor);

module.exports = router;