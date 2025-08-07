const express = require('express');
const bookController = require('../controllers/bookController');
const { validateCreateBook, validateUpdateBook, validateQuery } = require('../validators/bookValidators');
const { authenticate, requireAuth } = require('../middleware/authMiddleware');
const { auditLogger } = require('../middleware/loggerMiddleware');
const { createLimiter, searchLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

/**
 * @swagger
 * /api/v1/books:
 *   get:
 *     summary: Listar livros com filtros e paginação
 *     tags: [Livros]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: categoryId
 *         schema:
 *           type: string
 *       - in: query
 *         name: authorId
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [AVAILABLE, UNAVAILABLE, MAINTENANCE]
 *     responses:
 *       200:
 *         description: Lista de livros com paginação
 *       429:
 *         description: Muitas requisições
 */
router.get('/', validateQuery, bookController.getBooks);

/**
 * @swagger
 * /api/v1/books/search:
 *   get:
 *     summary: Buscar livros por texto
 *     tags: [Livros]
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Resultados da busca
 *       429:
 *         description: Muitas buscas realizadas
 */
router.get('/search', searchLimiter, validateQuery, bookController.searchBooks);

/**
 * @swagger
 * /api/v1/books/category/{categoryId}:
 *   get:
 *     summary: Listar livros por categoria
 *     tags: [Livros]
 *     parameters:
 *       - in: path
 *         name: categoryId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Livros da categoria
 */
router.get('/category/:categoryId', validateQuery, bookController.getBooksByCategory);

/**
 * @swagger
 * /api/v1/books/author/{authorId}:
 *   get:
 *     summary: Listar livros por autor
 *     tags: [Livros]
 *     parameters:
 *       - in: path
 *         name: authorId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Livros do autor
 */
router.get('/author/:authorId', validateQuery, bookController.getBooksByAuthor);

/**
 * @swagger
 * /api/v1/books/{id}:
 *   get:
 *     summary: Obter detalhes de um livro
 *     tags: [Livros]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Detalhes do livro
 *       404:
 *         description: Livro não encontrado
 */
router.get('/:id', bookController.getBookById);

/**
 * @swagger
 * /api/v1/books:
 *   post:
 *     summary: Criar novo livro
 *     tags: [Livros]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateBookRequest'
 *     responses:
 *       201:
 *         description: Livro criado com sucesso
 *       401:
 *         description: Não autorizado
 *       403:
 *         description: Permissões insuficientes
 *       429:
 *         description: Muitas criações de recursos
 */
router.post('/', 
  createLimiter,
  requireAuth('ADMIN', 'LIBRARIAN'), 
  validateCreateBook, 
  auditLogger('BOOK_CREATE', 'book'),
  bookController.createBook
);

/**
 * @swagger
 * /api/v1/books/{id}:
 *   put:
 *     summary: Atualizar livro
 *     tags: [Livros]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Livro atualizado com sucesso
 *       401:
 *         description: Não autorizado
 *       403:
 *         description: Permissões insuficientes
 *       404:
 *         description: Livro não encontrado
 */
router.put('/:id', 
  requireAuth('ADMIN', 'LIBRARIAN'), 
  validateUpdateBook, 
  auditLogger('BOOK_UPDATE', 'book'),
  bookController.updateBook
);

/**
 * @swagger
 * /api/v1/books/{id}:
 *   delete:
 *     summary: Deletar livro
 *     tags: [Livros]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Livro deletado com sucesso
 *       401:
 *         description: Não autorizado
 *       403:
 *         description: Apenas ADMIN pode deletar
 *       404:
 *         description: Livro não encontrado
 */
router.delete('/:id', 
  requireAuth('ADMIN'), 
  auditLogger('BOOK_DELETE', 'book'),
  bookController.deleteBook
);

module.exports = router;