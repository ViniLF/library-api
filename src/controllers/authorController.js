const authorService = require('../services/authorService');

class AuthorController {

  async createAuthor(req, res, next) {
    try {
      const authorData = req.body;
      const author = await authorService.createAuthor(authorData);

      res.status(201).json({
        success: true,
        message: 'Autor criado com sucesso',
        data: { author }
      });

    } catch (error) {
      next(error);
    }
  }

  async getAuthors(req, res, next) {
    try {
      const authors = await authorService.getAuthors();

      res.status(200).json({
        success: true,
        message: 'Autores obtidos com sucesso',
        data: { authors }
      });

    } catch (error) {
      next(error);
    }
  }

  async getAuthorById(req, res, next) {
    try {
      const { id } = req.params;
      const author = await authorService.getAuthorById(id);

      res.status(200).json({
        success: true,
        message: 'Autor obtido com sucesso',
        data: { author }
      });

    } catch (error) {
      next(error);
    }
  }

  async updateAuthor(req, res, next) {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const author = await authorService.updateAuthor(id, updateData);

      res.status(200).json({
        success: true,
        message: 'Autor atualizado com sucesso',
        data: { author }
      });

    } catch (error) {
      next(error);
    }
  }

  async deleteAuthor(req, res, next) {
    try {
      const { id } = req.params;
      const result = await authorService.deleteAuthor(id);

      res.status(200).json({
        success: true,
        message: result.message,
        data: null
      });

    } catch (error) {
      next(error);
    }
  }

  async searchAuthors(req, res, next) {
    try {
      const { q: searchTerm } = req.query;

      if (!searchTerm || searchTerm.trim().length === 0) {
        return res.status(400).json({
          success: false,
          error: {
            type: 'ValidationError',
            message: 'Termo de busca é obrigatório'
          }
        });
      }

      const authors = await authorService.searchAuthors(searchTerm.trim());

      res.status(200).json({
        success: true,
        message: `Encontrados ${authors.length} autores`,
        data: { authors }
      });

    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AuthorController();