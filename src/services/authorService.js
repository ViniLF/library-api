const database = require('../config/database');

class AuthorService {
  constructor() {
    this.prisma = database.getClient();
  }

  async createAuthor(authorData) {
    const { name, biography, birthDate, nationality } = authorData;

    try {
      const author = await this.prisma.author.create({
        data: {
          name,
          biography,
          birthDate: birthDate ? new Date(birthDate) : null,
          nationality
        },
        include: {
          _count: {
            select: { books: true }
          }
        }
      });

      return this.formatAuthorResponse(author);
    } catch (error) {
      throw error;
    }
  }

  async getAuthors() {
    const authors = await this.prisma.author.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { books: true }
        }
      }
    });

    return authors.map(author => this.formatAuthorResponse(author));
  }

  async getAuthorById(authorId) {
    const author = await this.prisma.author.findUnique({
      where: { id: authorId },
      include: {
        _count: {
          select: { books: true }
        },
        books: {
          take: 10,
          include: {
            book: {
              select: {
                id: true,
                title: true,
                isbn: true,
                publishedYear: true,
                status: true,
                availableCopies: true,
                category: {
                  select: {
                    id: true,
                    name: true
                  }
                }
              }
            }
          },
          orderBy: {
            book: { createdAt: 'desc' }
          }
        }
      }
    });

    if (!author) {
      const error = new Error('Autor não encontrado');
      error.statusCode = 404;
      error.type = 'NotFoundError';
      throw error;
    }

    return this.formatAuthorResponse(author, true);
  }

  async updateAuthor(authorId, updateData) {
    // Verificar se autor existe
    const existingAuthor = await this.prisma.author.findUnique({
      where: { id: authorId }
    });

    if (!existingAuthor) {
      const error = new Error('Autor não encontrado');
      error.statusCode = 404;
      error.type = 'NotFoundError';
      throw error;
    }

    // Preparar dados para update
    const dataToUpdate = { ...updateData };
    if (dataToUpdate.birthDate) {
      dataToUpdate.birthDate = new Date(dataToUpdate.birthDate);
    }

    try {
      const updatedAuthor = await this.prisma.author.update({
        where: { id: authorId },
        data: dataToUpdate,
        include: {
          _count: {
            select: { books: true }
          }
        }
      });

      return this.formatAuthorResponse(updatedAuthor);
    } catch (error) {
      throw error;
    }
  }

  async deleteAuthor(authorId) {
    // Verificar se autor existe
    const author = await this.prisma.author.findUnique({
      where: { id: authorId },
      include: {
        _count: {
          select: { books: true }
        }
      }
    });

    if (!author) {
      const error = new Error('Autor não encontrado');
      error.statusCode = 404;
      error.type = 'NotFoundError';
      throw error;
    }

    // Verificar se há livros associados
    if (author._count.books > 0) {
      const error = new Error('Não é possível deletar autor que possui livros associados');
      error.statusCode = 400;
      error.type = 'ValidationError';
      throw error;
    }

    await this.prisma.author.delete({
      where: { id: authorId }
    });

    return { message: 'Autor deletado com sucesso' };
  }

  async searchAuthors(searchTerm) {
    const authors = await this.prisma.author.findMany({
      where: {
        OR: [
          { name: { contains: searchTerm, mode: 'insensitive' } },
          { biography: { contains: searchTerm, mode: 'insensitive' } },
          { nationality: { contains: searchTerm, mode: 'insensitive' } }
        ]
      },
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { books: true }
        }
      }
    });

    return authors.map(author => this.formatAuthorResponse(author));
  }

  formatAuthorResponse(author, includeBooks = false) {
    const formatted = {
      id: author.id,
      name: author.name,
      biography: author.biography,
      birthDate: author.birthDate,
      nationality: author.nationality,
      booksCount: author._count.books,
      createdAt: author.createdAt,
      updatedAt: author.updatedAt
    };

    if (includeBooks && author.books) {
      formatted.books = author.books.map(ba => ({
        id: ba.book.id,
        title: ba.book.title,
        isbn: ba.book.isbn,
        publishedYear: ba.book.publishedYear,
        status: ba.book.status,
        availableCopies: ba.book.availableCopies,
        category: ba.book.category
      }));
    }

    return formatted;
  }
}

module.exports = new AuthorService();