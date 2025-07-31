const bookService = require('../services/bookService');

class BookController {

  async createBook(req, res, next) {
    try {
      const bookData = req.body;
      const book = await bookService.createBook(bookData);

      res.status(201).json({
        success: true,
        message: 'Livro criado com sucesso',
        data: { book }
      });

    } catch (error) {
      next(error);
    }
  }

  async getBooks(req, res, next) {
    try {
      const filters = req.query;
      const result = await bookService.getBooks(filters);

      res.status(200).json({
        success: true,
        message: 'Livros obtidos com sucesso',
        data: result
      });

    } catch (error) {
      next(error);
    }
  }

  async getBookById(req, res, next) {
    try {
      const { id } = req.params;
      const book = await bookService.getBookById(id);

      res.status(200).json({
        success: true,
        message: 'Livro obtido com sucesso',
        data: { book }
      });

    } catch (error) {
      next(error);
    }
  }

  async updateBook(req, res, next) {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const book = await bookService.updateBook(id, updateData);

      res.status(200).json({
        success: true,
        message: 'Livro atualizado com sucesso',
        data: { book }
      });

    } catch (error) {
      next(error);
    }
  }

  async deleteBook(req, res, next) {
    try {
      const { id } = req.params;
      const result = await bookService.deleteBook(id);

      res.status(200).json({
        success: true,
        message: result.message,
        data: null
      });

    } catch (error) {
      next(error);
    }
  }

  async searchBooks(req, res, next) {
    try {
      const { q: search, ...otherFilters } = req.query;
      const filters = { search, ...otherFilters };
      const result = await bookService.getBooks(filters);

      res.status(200).json({
        success: true,
        message: `Encontrados ${result.pagination.total} livros`,
        data: result
      });

    } catch (error) {
      next(error);
    }
  }

  async getBooksByCategory(req, res, next) {
    try {
      const { categoryId } = req.params;
      const otherFilters = req.query;
      const filters = { categoryId, ...otherFilters };
      const result = await bookService.getBooks(filters);

      res.status(200).json({
        success: true,
        message: 'Livros da categoria obtidos com sucesso',
        data: result
      });

    } catch (error) {
      next(error);
    }
  }

  async getBooksByAuthor(req, res, next) {
    try {
      const { authorId } = req.params;
      const otherFilters = req.query;
      const filters = { authorId, ...otherFilters };
      const result = await bookService.getBooks(filters);

      res.status(200).json({
        success: true,
        message: 'Livros do autor obtidos com sucesso',
        data: result
      });

    } catch (error) {
      next(error);
    }
  }
}

module.exports = new BookController();