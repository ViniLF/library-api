const express = require('express');
const bookController = require('../controllers/bookController');
const { validateCreateBook, validateUpdateBook, validateQuery } = require('../validators/bookValidators');
const { authenticate, requireAuth } = require('../middleware/authMiddleware');

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
 *         description: Página da listagem
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Itens por página
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Busca por título, descrição ou ISBN
 *       - in: query
 *         name: categoryId
 *         schema:
 *           type: string
 *         description: Filtrar por categoria
 *       - in: query
 *         name: authorId
 *         schema:
 *           type: string
 *         description: Filtrar por autor
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [AVAILABLE, UNAVAILABLE, MAINTENANCE]
 *         description: Filtrar por status
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [title, createdAt, publishedYear, pages]
 *           default: createdAt
 *         description: Campo para ordenação
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Ordem da listagem
 *     responses:
 *       200:
 *         description: Lista de livros com paginação
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         books:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/Book'
 *                         pagination:
 *                           type: object
 *                           properties:
 *                             page:
 *                               type: integer
 *                             limit:
 *                               type: integer
 *                             total:
 *                               type: integer
 *                             totalPages:
 *                               type: integer
 *                             hasNext:
 *                               type: boolean
 *                             hasPrev:
 *                               type: boolean
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
 *         description: Termo de busca
 *     responses:
 *       200:
 *         description: Resultados da busca
 */
router.get('/search', validateQuery, bookController.searchBooks);

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
 *         description: ID da categoria
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
 *         description: ID do autor
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
 *         description: ID do livro
 *     responses:
 *       200:
 *         description: Detalhes do livro
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         book:
 *                           $ref: '#/components/schemas/Book'
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
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         book:
 *                           $ref: '#/components/schemas/Book'
 *       401:
 *         description: Não autorizado
 *       403:
 *         description: Permissões insuficientes (apenas ADMIN/LIBRARIAN)
 */
router.post('/', requireAuth('ADMIN', 'LIBRARIAN'), validateCreateBook, bookController.createBook);

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
 *         description: ID do livro
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               isbn:
 *                 type: string
 *               description:
 *                 type: string
 *               publishedYear:
 *                 type: integer
 *               totalCopies:
 *                 type: integer
 *               availableCopies:
 *                 type: integer
 *               language:
 *                 type: string
 *               pages:
 *                 type: integer
 *               categoryId:
 *                 type: string
 *               authors:
 *                 type: array
 *                 items:
 *                   type: string
 *               status:
 *                 type: string
 *                 enum: [AVAILABLE, UNAVAILABLE, MAINTENANCE]
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
router.put('/:id', requireAuth('ADMIN', 'LIBRARIAN'), validateUpdateBook, bookController.updateBook);

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
 *         description: ID do livro
 *     responses:
 *       200:
 *         description: Livro deletado com sucesso
 *       401:
 *         description: Não autorizado
 *       403:
 *         description: Apenas ADMIN pode deletar
 *       404:
 *         description: Livro não encontrado
 *       400:
 *         description: Não pode deletar livro com empréstimos ativos
 */
router.delete('/:id', requireAuth('ADMIN'), bookController.deleteBook);

module.exports = router;