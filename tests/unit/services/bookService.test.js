jest.mock('../../../src/config/database');

const mockPrisma = {
  book: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn()
  },
  category: {
    findUnique: jest.fn()
  },
  author: {
    findMany: jest.fn()
  }
};

require('../../../src/config/database').getClient = jest.fn(() => mockPrisma);

// Importar o serviço DEPOIS do mock
const bookService = require('../../../src/services/bookService');

describe('BookService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createBook', () => {
    it('should create book successfully', async () => {
      const bookData = {
        title: 'Clean Code',
        isbn: '9780132350884',
        description: 'A book about clean coding',
        categoryId: 'category_id',
        authors: ['author_id_1', 'author_id_2'],
        totalCopies: 3
      };

      const category = { id: 'category_id', name: 'Programming' };
      const authors = [
        { id: 'author_id_1', name: 'Robert Martin' },
        { id: 'author_id_2', name: 'Co-author' }
      ];
      const createdBook = {
        id: 'book_id',
        title: 'Clean Code',
        isbn: '9780132350884',
        totalCopies: 3,
        availableCopies: 3,
        category,
        authors: [
          { author: authors[0] },
          { author: authors[1] }
        ]
      };

      mockPrisma.category.findUnique.mockResolvedValue(category);
      mockPrisma.author.findMany.mockResolvedValue(authors);
      mockPrisma.book.findUnique.mockResolvedValue(null); // ISBN não existe
      mockPrisma.book.create.mockResolvedValue(createdBook);

      const result = await bookService.createBook(bookData);

      expect(mockPrisma.category.findUnique).toHaveBeenCalledWith({
        where: { id: bookData.categoryId }
      });
      expect(mockPrisma.author.findMany).toHaveBeenCalledWith({
        where: { id: { in: bookData.authors } }
      });
      expect(result.id).toBe('book_id');
      expect(result.authors).toHaveLength(2);
    });

    it('should throw error if category not found', async () => {
      const bookData = {
        title: 'Test Book',
        categoryId: 'invalid_category',
        authors: ['author_id']
      };

      mockPrisma.category.findUnique.mockResolvedValue(null);

      await expect(bookService.createBook(bookData)).rejects.toThrow('Categoria não encontrada');
    });

    it('should throw error if authors not found', async () => {
      const bookData = {
        title: 'Test Book',
        categoryId: 'category_id',
        authors: ['invalid_author', 'another_invalid']
      };

      mockPrisma.category.findUnique.mockResolvedValue({ id: 'category_id' });
      mockPrisma.author.findMany.mockResolvedValue([]);

      await expect(bookService.createBook(bookData)).rejects.toThrow('Um ou mais autores não foram encontrados');
    });

    it('should throw error if ISBN already exists', async () => {
      const bookData = {
        title: 'Test Book',
        isbn: '9780132350884',
        categoryId: 'category_id',
        authors: ['author_id']
      };

      mockPrisma.category.findUnique.mockResolvedValue({ id: 'category_id' });
      mockPrisma.author.findMany.mockResolvedValue([{ id: 'author_id' }]);
      mockPrisma.book.findUnique.mockResolvedValue({ id: 'existing_book' });

      await expect(bookService.createBook(bookData)).rejects.toThrow('ISBN já está em uso');
    });
  });

  describe('getBooks', () => {
    it('should return books with pagination', async () => {
      const filters = {
        page: 1,
        limit: 10,
        search: 'clean'
      };

      const books = [
        {
          id: 'book_1',
          title: 'Clean Code',
          category: { id: 'cat_1', name: 'Programming' },
          authors: [{ author: { id: 'auth_1', name: 'Robert Martin' } }]
        }
      ];

      mockPrisma.book.findMany.mockResolvedValue(books);
      mockPrisma.book.count.mockResolvedValue(1);

      const result = await bookService.getBooks(filters);

      expect(mockPrisma.book.findMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { title: { contains: 'clean', mode: 'insensitive' } },
            { description: { contains: 'clean', mode: 'insensitive' } },
            { isbn: { contains: 'clean' } }
          ]
        },
        skip: 0,
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: expect.any(Object)
      });

      expect(result.books).toHaveLength(1);
      expect(result.pagination.total).toBe(1);
      expect(result.pagination.page).toBe(1);
    });

    it('should filter by category', async () => {
      const filters = { categoryId: 'category_id' };

      mockPrisma.book.findMany.mockResolvedValue([]);
      mockPrisma.book.count.mockResolvedValue(0);

      await bookService.getBooks(filters);

      expect(mockPrisma.book.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { categoryId: 'category_id' }
        })
      );
    });
  });

  describe('getBookById', () => {
    it('should return book with details', async () => {
      const bookId = 'book_id';
      const book = {
        id: bookId,
        title: 'Clean Code',
        category: { id: 'cat_1', name: 'Programming' },
        authors: [{ author: { id: 'auth_1', name: 'Robert Martin' } }],
        loans: [],
        reservations: []
      };

      mockPrisma.book.findUnique.mockResolvedValue(book);

      const result = await bookService.getBookById(bookId);

      expect(mockPrisma.book.findUnique).toHaveBeenCalledWith({
        where: { id: bookId },
        include: expect.any(Object)
      });
      expect(result.id).toBe(bookId);
      expect(result.activeLoans).toBeDefined();
      expect(result.activeReservations).toBeDefined();
    });

    it('should throw error if book not found', async () => {
      mockPrisma.book.findUnique.mockResolvedValue(null);

      await expect(bookService.getBookById('invalid_id')).rejects.toThrow('Livro não encontrado');
    });
  });

  describe('deleteBook', () => {
    it('should delete book successfully', async () => {
      const bookId = 'book_id';
      const book = {
        id: bookId,
        loans: [],
        reservations: []
      };

      mockPrisma.book.findUnique.mockResolvedValue(book);
      mockPrisma.book.delete.mockResolvedValue(book);

      const result = await bookService.deleteBook(bookId);

      expect(mockPrisma.book.delete).toHaveBeenCalledWith({
        where: { id: bookId }
      });
      expect(result.message).toBe('Livro deletado com sucesso');
    });

    it('should throw error if book has active loans', async () => {
      const book = {
        id: 'book_id',
        loans: [{ id: 'loan_id', status: 'ACTIVE' }],
        reservations: []
      };

      mockPrisma.book.findUnique.mockResolvedValue(book);

      await expect(bookService.deleteBook('book_id')).rejects.toThrow('Não é possível deletar livro com empréstimos ativos');
    });
  });
});