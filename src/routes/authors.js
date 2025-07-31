const express = require('express');
const authorController = require('../controllers/authorController');
const { validateCreateAuthor, validateUpdateAuthor } = require('../validators/authorValidators');
const { requireAuth } = require('../middleware/authMiddleware');

const router = express.Router();

/**
 * @swagger
 * /api/v1/authors:
 *   get:
 *     summary: Listar todos os autores
 *     tags: [Autores]
 *     responses:
 *       200:
 *         description: Lista de autores
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
 *                         authors:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/Author'
 */
router.get('/', authorController.getAuthors);

/**
 * @swagger
 * /api/v1/authors/search:
 *   get:
 *     summary: Buscar autores por texto
 *     tags: [Autores]
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Termo de busca (nome, biografia ou nacionalidade)
 *         example: "Machado"
 *     responses:
 *       200:
 *         description: Resultados da busca
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
 *                         authors:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/Author'
 *       400:
 *         description: Termo de busca é obrigatório
 */
router.get('/search', authorController.searchAuthors);

/**
 * @swagger
 * /api/v1/authors/{id}:
 *   get:
 *     summary: Obter detalhes de um autor
 *     tags: [Autores]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do autor
 *     responses:
 *       200:
 *         description: Detalhes do autor
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
 *                         author:
 *                           allOf:
 *                             - $ref: '#/components/schemas/Author'
 *                             - type: object
 *                               properties:
 *                                 books:
 *                                   type: array
 *                                   items:
 *                                     type: object
 *                                     properties:
 *                                       id:
 *                                         type: string
 *                                       title:
 *                                         type: string
 *                                       isbn:
 *                                         type: string
 *                                       publishedYear:
 *                                         type: integer
 *                                       status:
 *                                         type: string
 *                                       availableCopies:
 *                                         type: integer
 *                                       category:
 *                                         type: object
 *                                         properties:
 *                                           id:
 *                                             type: string
 *                                           name:
 *                                             type: string
 *       404:
 *         description: Autor não encontrado
 */
router.get('/:id', authorController.getAuthorById);

/**
 * @swagger
 * /api/v1/authors:
 *   post:
 *     summary: Criar novo autor
 *     tags: [Autores]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Machado de Assis"
 *                 description: "Nome do autor"
 *               biography:
 *                 type: string
 *                 example: "Joaquim Maria Machado de Assis foi um escritor brasileiro..."
 *                 description: "Biografia do autor"
 *               birthDate:
 *                 type: string
 *                 format: date
 *                 example: "1839-06-21"
 *                 description: "Data de nascimento (YYYY-MM-DD)"
 *               nationality:
 *                 type: string
 *                 example: "Brasileiro"
 *                 description: "Nacionalidade do autor"
 *     responses:
 *       201:
 *         description: Autor criado com sucesso
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
 *                         author:
 *                           $ref: '#/components/schemas/Author'
 *       401:
 *         description: Não autorizado
 *       403:
 *         description: Apenas ADMIN/LIBRARIAN podem criar autores
 */
router.post('/', requireAuth('ADMIN', 'LIBRARIAN'), validateCreateAuthor, authorController.createAuthor);

/**
 * @swagger
 * /api/v1/authors/{id}:
 *   put:
 *     summary: Atualizar autor
 *     tags: [Autores]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do autor
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Machado de Assis"
 *               biography:
 *                 type: string
 *                 example: "Joaquim Maria Machado de Assis foi um escritor brasileiro..."
 *               birthDate:
 *                 type: string
 *                 format: date
 *                 example: "1839-06-21"
 *               nationality:
 *                 type: string
 *                 example: "Brasileiro"
 *     responses:
 *       200:
 *         description: Autor atualizado com sucesso
 *       401:
 *         description: Não autorizado
 *       403:
 *         description: Apenas ADMIN/LIBRARIAN podem atualizar autores
 *       404:
 *         description: Autor não encontrado
 */
router.put('/:id', requireAuth('ADMIN', 'LIBRARIAN'), validateUpdateAuthor, authorController.updateAuthor);

/**
 * @swagger
 * /api/v1/authors/{id}:
 *   delete:
 *     summary: Deletar autor
 *     tags: [Autores]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do autor
 *     responses:
 *       200:
 *         description: Autor deletado com sucesso
 *       401:
 *         description: Não autorizado
 *       403:
 *         description: Apenas ADMIN pode deletar autores
 *       404:
 *         description: Autor não encontrado
 *       400:
 *         description: Não pode deletar autor que possui livros associados
 */
router.delete('/:id', requireAuth('ADMIN'), authorController.deleteAuthor);

module.exports = router;