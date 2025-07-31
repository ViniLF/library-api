const express = require('express');
const categoryController = require('../controllers/categoryController');
const { validateCreateCategory, validateUpdateCategory } = require('../validators/categoryValidators');
const { requireAuth } = require('../middleware/authMiddleware');

const router = express.Router();

/**
 * @swagger
 * /api/v1/categories:
 *   get:
 *     summary: Listar todas as categorias
 *     tags: [Categorias]
 *     responses:
 *       200:
 *         description: Lista de categorias
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
 *                         categories:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/Category'
 */
router.get('/', categoryController.getCategories);

/**
 * @swagger
 * /api/v1/categories/{id}:
 *   get:
 *     summary: Obter detalhes de uma categoria
 *     tags: [Categorias]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID da categoria
 *     responses:
 *       200:
 *         description: Detalhes da categoria
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
 *                         category:
 *                           allOf:
 *                             - $ref: '#/components/schemas/Category'
 *                             - type: object
 *                               properties:
 *                                 recentBooks:
 *                                   type: array
 *                                   items:
 *                                     type: object
 *                                     properties:
 *                                       id:
 *                                         type: string
 *                                       title:
 *                                         type: string
 *                                       status:
 *                                         type: string
 *                                       availableCopies:
 *                                         type: integer
 *       404:
 *         description: Categoria não encontrada
 */
router.get('/:id', categoryController.getCategoryById);

/**
 * @swagger
 * /api/v1/categories:
 *   post:
 *     summary: Criar nova categoria
 *     tags: [Categorias]
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
 *                 example: "Ficção Científica"
 *                 description: "Nome da categoria"
 *               description:
 *                 type: string
 *                 example: "Livros de ficção científica e fantasia"
 *                 description: "Descrição da categoria"
 *     responses:
 *       201:
 *         description: Categoria criada com sucesso
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
 *                         category:
 *                           $ref: '#/components/schemas/Category'
 *       401:
 *         description: Não autorizado
 *       403:
 *         description: Apenas ADMIN pode criar categorias
 *       409:
 *         description: Categoria já existe com este nome
 */
router.post('/', requireAuth('ADMIN'), validateCreateCategory, categoryController.createCategory);

/**
 * @swagger
 * /api/v1/categories/{id}:
 *   put:
 *     summary: Atualizar categoria
 *     tags: [Categorias]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID da categoria
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Ficção Científica"
 *               description:
 *                 type: string
 *                 example: "Livros de ficção científica e fantasia"
 *     responses:
 *       200:
 *         description: Categoria atualizada com sucesso
 *       401:
 *         description: Não autorizado
 *       403:
 *         description: Apenas ADMIN pode atualizar categorias
 *       404:
 *         description: Categoria não encontrada
 *       409:
 *         description: Nome da categoria já está em uso
 */
router.put('/:id', requireAuth('ADMIN'), validateUpdateCategory, categoryController.updateCategory);

/**
 * @swagger
 * /api/v1/categories/{id}:
 *   delete:
 *     summary: Deletar categoria
 *     tags: [Categorias]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID da categoria
 *     responses:
 *       200:
 *         description: Categoria deletada com sucesso
 *       401:
 *         description: Não autorizado
 *       403:
 *         description: Apenas ADMIN pode deletar categorias
 *       404:
 *         description: Categoria não encontrada
 *       400:
 *         description: Não pode deletar categoria que possui livros associados
 */
router.delete('/:id', requireAuth('ADMIN'), categoryController.deleteCategory);

module.exports = router;