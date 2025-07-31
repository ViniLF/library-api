const categoryService = require('../services/categoryService');

class CategoryController {

  async createCategory(req, res, next) {
    try {
      const categoryData = req.body;
      const category = await categoryService.createCategory(categoryData);

      res.status(201).json({
        success: true,
        message: 'Categoria criada com sucesso',
        data: { category }
      });

    } catch (error) {
      next(error);
    }
  }

  async getCategories(req, res, next) {
    try {
      const categories = await categoryService.getCategories();

      res.status(200).json({
        success: true,
        message: 'Categorias obtidas com sucesso',
        data: { categories }
      });

    } catch (error) {
      next(error);
    }
  }

  async getCategoryById(req, res, next) {
    try {
      const { id } = req.params;
      const category = await categoryService.getCategoryById(id);

      res.status(200).json({
        success: true,
        message: 'Categoria obtida com sucesso',
        data: { category }
      });

    } catch (error) {
      next(error);
    }
  }

  async updateCategory(req, res, next) {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const category = await categoryService.updateCategory(id, updateData);

      res.status(200).json({
        success: true,
        message: 'Categoria atualizada com sucesso',
        data: { category }
      });

    } catch (error) {
      next(error);
    }
  }

  async deleteCategory(req, res, next) {
    try {
      const { id } = req.params;
      const result = await categoryService.deleteCategory(id);

      res.status(200).json({
        success: true,
        message: result.message,
        data: null
      });

    } catch (error) {
      next(error);
    }
  }
}

module.exports = new CategoryController();