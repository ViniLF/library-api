const database = require('../config/database');

class BookService {
  constructor() {
    this.prisma = database.getClient();
  }

  async createBook(bookData) {
    const { authors, categoryId, ...bookInfo } = bookData;

    // Verificar se categoria existe
    const category = await this.prisma.category.findUnique({
      where: { id: categoryId }
    });

    if (!category) {
      const error = new Error('Categoria não encontrada');
      error.statusCode = 404;
      error.type = 'NotFoundError';
      throw error;
    }

    // Verificar se autores existem
    const existingAuthors = await this.prisma.author.findMany({
      where: { id: { in: authors } }
    });

    if (existingAuthors.length !== authors.length) {
      const error = new Error('Um ou mais autores não foram encontrados');
      error.statusCode = 404;
      error.type = 'NotFoundError';
      throw error;
    }

    // Verificar ISBN duplicado se fornecido
    if (bookInfo.isbn) {
      const existingBook = await this.prisma.book.findUnique({
        where: { isbn: bookInfo.isbn }
      });

      if (existingBook) {
        const error = new Error('ISBN já está em uso');
        error.statusCode = 409;
        error.type = 'ConflictError';
        throw error;
      }
    }

    try {
      const book = await this.prisma.book.create({
        data: {
          ...bookInfo,
          categoryId,
          availableCopies: bookInfo.totalCopies || 1,
          authors: {
            create: authors.map(authorId => ({ authorId }))
          }
        },
        include: {
          category: true,
          authors: {
            include: {
              author: true
            }
          }
        }
      });

      return this.formatBookResponse(book);
    } catch (error) {
      if (error.code === 'P2002') {
        const conflictError = new Error('ISBN já está em uso');
        conflictError.statusCode = 409;
        conflictError.type = 'ConflictError';
        throw conflictError;
      }
      throw error;
    }
  }

  async getBooks(filters = {}) {
    const {
      page = 1,
      limit = 10,
      search,
      categoryId,
      authorId,
      status,
      language,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = filters;

    const skip = (page - 1) * limit;

    // Construir filtros dinâmicos
    const where = {};

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { isbn: { contains: search } }
      ];
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (status) {
      where.status = status;
    }

    if (language) {
      where.language = language;
    }

    if (authorId) {
      where.authors = {
        some: { authorId }
      };
    }

    // Configurar ordenação
    const orderBy = {};
    orderBy[sortBy] = sortOrder;

    try {
      const [books, total] = await Promise.all([
        this.prisma.book.findMany({
          where,
          skip,
          take: limit,
          orderBy,
          include: {
            category: true,
            authors: {
              include: {
                author: true
              }
            }
          }
        }),
        this.prisma.book.count({ where })
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        books: books.map(book => this.formatBookResponse(book)),
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      };
    } catch (error) {
      throw error;
    }
  }

  async getBookById(bookId) {
    const book = await this.prisma.book.findUnique({
      where: { id: bookId },
      include: {
        category: true,
        authors: {
          include: {
            author: true
          }
        },
        loans: {
          where: {
            status: { in: ['ACTIVE', 'OVERDUE'] }
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        },
        reservations: {
          where: {
            status: 'ACTIVE'
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      }
    });

    if (!book) {
      const error = new Error('Livro não encontrado');
      error.statusCode = 404;
      error.type = 'NotFoundError';
      throw error;
    }

    return this.formatBookResponse(book, true);
  }

  async updateBook(bookId, updateData) {
    const { authors, ...bookInfo } = updateData;

    // Verificar se livro existe
    const existingBook = await this.prisma.book.findUnique({
      where: { id: bookId }
    });

    if (!existingBook) {
      const error = new Error('Livro não encontrado');
      error.statusCode = 404;
      error.type = 'NotFoundError';
      throw error;
    }

    // Verificar categoria se fornecida
    if (bookInfo.categoryId) {
      const category = await this.prisma.category.findUnique({
        where: { id: bookInfo.categoryId }
      });

      if (!category) {
        const error = new Error('Categoria não encontrada');
        error.statusCode = 404;
        error.type = 'NotFoundError';
        throw error;
      }
    }

    // Verificar autores se fornecidos
    if (authors && authors.length > 0) {
      const existingAuthors = await this.prisma.author.findMany({
        where: { id: { in: authors } }
      });

      if (existingAuthors.length !== authors.length) {
        const error = new Error('Um ou mais autores não foram encontrados');
        error.statusCode = 404;
        error.type = 'NotFoundError';
        throw error;
      }
    }

    // Verificar ISBN duplicado se fornecido
    if (bookInfo.isbn && bookInfo.isbn !== existingBook.isbn) {
      const duplicateBook = await this.prisma.book.findUnique({
        where: { isbn: bookInfo.isbn }
      });

      if (duplicateBook) {
        const error = new Error('ISBN já está em uso');
        error.statusCode = 409;
        error.type = 'ConflictError';
        throw error;
      }
    }

    // Validar availableCopies não pode ser maior que totalCopies
    if (bookInfo.availableCopies !== undefined && bookInfo.totalCopies !== undefined) {
      if (bookInfo.availableCopies > bookInfo.totalCopies) {
        const error = new Error('Cópias disponíveis não pode ser maior que total de cópias');
        error.statusCode = 400;
        error.type = 'ValidationError';
        throw error;
      }
    }

    try {
      const updatedBook = await this.prisma.book.update({
        where: { id: bookId },
        data: {
          ...bookInfo,
          ...(authors && {
            authors: {
              deleteMany: {},
              create: authors.map(authorId => ({ authorId }))
            }
          })
        },
        include: {
          category: true,
          authors: {
            include: {
              author: true
            }
          }
        }
      });

      return this.formatBookResponse(updatedBook);
    } catch (error) {
      if (error.code === 'P2002') {
        const conflictError = new Error('ISBN já está em uso');
        conflictError.statusCode = 409;
        conflictError.type = 'ConflictError';
        throw conflictError;
      }
      throw error;
    }
  }

  async deleteBook(bookId) {
    // Verificar se livro existe
    const book = await this.prisma.book.findUnique({
      where: { id: bookId },
      include: {
        loans: {
          where: {
            status: { in: ['ACTIVE', 'OVERDUE'] }
          }
        },
        reservations: {
          where: {
            status: 'ACTIVE'
          }
        }
      }
    });

    if (!book) {
      const error = new Error('Livro não encontrado');
      error.statusCode = 404;
      error.type = 'NotFoundError';
      throw error;
    }

    // Verificar se há empréstimos ativos
    if (book.loans.length > 0) {
      const error = new Error('Não é possível deletar livro com empréstimos ativos');
      error.statusCode = 400;
      error.type = 'ValidationError';
      throw error;
    }

    // Verificar se há reservas ativas
    if (book.reservations.length > 0) {
      const error = new Error('Não é possível deletar livro com reservas ativas');
      error.statusCode = 400;
      error.type = 'ValidationError';
      throw error;
    }

    await this.prisma.book.delete({
      where: { id: bookId }
    });

    return { message: 'Livro deletado com sucesso' };
  }

  formatBookResponse(book, includeDetails = false) {
    const formatted = {
      id: book.id,
      title: book.title,
      isbn: book.isbn,
      description: book.description,
      publishedYear: book.publishedYear,
      totalCopies: book.totalCopies,
      availableCopies: book.availableCopies,
      language: book.language,
      pages: book.pages,
      status: book.status,
      createdAt: book.createdAt,
      updatedAt: book.updatedAt,
      category: {
        id: book.category.id,
        name: book.category.name
      },
      authors: book.authors.map(ba => ({
        id: ba.author.id,
        name: ba.author.name,
        biography: ba.author.biography
      }))
    };

    if (includeDetails && book.loans) {
      formatted.activeLoans = book.loans;
      formatted.activeReservations = book.reservations;
    }

    return formatted;
  }
}

module.exports = new BookService();