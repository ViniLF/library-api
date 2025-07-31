const database = require('../config/database');

class CategoryService {
  constructor() {
    this.prisma = database.getClient();
  }

  async createCategory(categoryData) {
    const { name, description } = categoryData;

    // Verificar se categoria já existe
    const existingCategory = await this.prisma.category.findUnique({
      where: { name }
    });

    if (existingCategory) {
      const error = new Error('Categoria já existe com este nome');
      error.statusCode = 409;
      error.type = 'ConflictError';
      throw error;
    }

    try {
      const category = await this.prisma.category.create({
        data: { name, description },
        include: {
          _count: {
            select: { books: true }
          }
        }
      });

      return this.formatCategoryResponse(category);
    } catch (error) {
      if (error.code === 'P2002') {
        const conflictError = new Error('Nome da categoria já está em uso');
        conflictError.statusCode = 409;
        conflictError.type = 'ConflictError';
        throw conflictError;
      }
      throw error;
    }
  }

  async getCategories() {
    const categories = await this.prisma.category.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { books: true }
        }
      }
    });

    return categories.map(category => this.formatCategoryResponse(category));
  }

  async getCategoryById(categoryId) {
    const category = await this.prisma.category.findUnique({
      where: { id: categoryId },
      include: {
        _count: {
          select: { books: true }
        },
        books: {
          take: 5,
          select: {
            id: true,
            title: true,
            status: true,
            availableCopies: true
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!category) {
      const error = new Error('Categoria não encontrada');
      error.statusCode = 404;
      error.type = 'NotFoundError';
      throw error;
    }

    return this.formatCategoryResponse(category, true);
  }

  async updateCategory(categoryId, updateData) {
    // Verificar se categoria existe
    const existingCategory = await this.prisma.category.findUnique({
      where: { id: categoryId }
    });

    if (!existingCategory) {
      const error = new Error('Categoria não encontrada');
      error.statusCode = 404;
      error.type = 'NotFoundError';
      throw error;
    }

    // Verificar nome duplicado se fornecido
    if (updateData.name && updateData.name !== existingCategory.name) {
      const duplicateCategory = await this.prisma.category.findUnique({
        where: { name: updateData.name }
      });

      if (duplicateCategory) {
        const error = new Error('Nome da categoria já está em uso');
        error.statusCode = 409;
        error.type = 'ConflictError';
        throw error;
      }
    }

    try {
      const updatedCategory = await this.prisma.category.update({
        where: { id: categoryId },
        data: updateData,
        include: {
          _count: {
            select: { books: true }
          }
        }
      });

      return this.formatCategoryResponse(updatedCategory);
    } catch (error) {
      if (error.code === 'P2002') {
        const conflictError = new Error('Nome da categoria já está em uso');
        conflictError.statusCode = 409;
        conflictError.type = 'ConflictError';
        throw conflictError;
      }
      throw error;
    }
  }

  async deleteCategory(categoryId) {
    // Verificar se categoria existe
    const category = await this.prisma.category.findUnique({
      where: { id: categoryId },
      include: {
        _count: {
          select: { books: true }
        }
      }
    });

    if (!category) {
      const error = new Error('Categoria não encontrada');
      error.statusCode = 404;
      error.type = 'NotFoundError';
      throw error;
    }

    // Verificar se há livros associados
    if (category._count.books > 0) {
      const error = new Error('Não é possível deletar categoria que possui livros associados');
      error.statusCode = 400;
      error.type = 'ValidationError';
      throw error;
    }

    await this.prisma.category.delete({
      where: { id: categoryId }
    });

    return { message: 'Categoria deletada com sucesso' };
  }

  formatCategoryResponse(category, includeBooks = false) {
    const formatted = {
      id: category.id,
      name: category.name,
      description: category.description,
      booksCount: category._count.books,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt
    };

    if (includeBooks && category.books) {
      formatted.recentBooks = category.books;
    }

    return formatted;
  }
}

module.exports = new CategoryService();