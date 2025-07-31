const express = require('express');
const categoryController = require('../controllers/categoryController');
const { validateCreateCategory, validateUpdateCategory } = require('../validators/categoryValidators');
const { requireAuth } = require('../middleware/authMiddleware');

const router = express.Router();

/**
 * @route   GET /api/v1/categories
 * @desc    Listar todas as categorias
 * @access  Public
 */
router.get('/', categoryController.getCategories);

/**
 * @route   GET /api/v1/categories/:id
 * @desc    Obter detalhes de uma categoria
 * @access  Public
 */
router.get('/:id', categoryController.getCategoryById);

/**
 * @route   POST /api/v1/categories
 * @desc    Criar nova categoria
 * @access  Private (ADMIN only)
 */
router.post('/', requireAuth('ADMIN'), validateCreateCategory, categoryController.createCategory);

/**
 * @route   PUT /api/v1/categories/:id
 * @desc    Atualizar categoria
 * @access  Private (ADMIN only)
 */
router.put('/:id', requireAuth('ADMIN'), validateUpdateCategory, categoryController.updateCategory);

/**
 * @route   DELETE /api/v1/categories/:id
 * @desc    Deletar categoria
 * @access  Private (ADMIN only)
 */
router.delete('/:id', requireAuth('ADMIN'), categoryController.deleteCategory);

module.exports = router;