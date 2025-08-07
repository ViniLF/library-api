const request = require('supertest');
const app = require('../../src/app');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

describe('Books Endpoints', () => {
  let adminToken, librarianToken, userToken;
  let categoryId, authorId;

  beforeAll(async () => {
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    try {
      // Limpar dados usando transação para melhor performance
      await prisma.$transaction([
        prisma.bookAuthor.deleteMany(),
        prisma.book.deleteMany(),
        prisma.author.deleteMany(),
        prisma.category.deleteMany(),
        prisma.user.deleteMany(),
      ]);

      // Criar usuários em paralelo
      const users = await Promise.all([
        request(app).post('/api/v1/auth/register').send({
          name: 'Admin User',
          email: 'admin@test.com',
          password: 'password123',
          role: 'ADMIN'
        }),
        request(app).post('/api/v1/auth/register').send({
          name: 'Librarian User',
          email: 'librarian@test.com',
          password: 'password123',
          role: 'LIBRARIAN'
        }),
        request(app).post('/api/v1/auth/register').send({
          name: 'Regular User',
          email: 'user@test.com',
          password: 'password123',
          role: 'USER'
        })
      ]);

      // Fazer login em paralelo
      const logins = await Promise.all([
        request(app).post('/api/v1/auth/login').send({
          email: 'admin@test.com',
          password: 'password123'
        }),
        request(app).post('/api/v1/auth/login').send({
          email: 'librarian@test.com',
          password: 'password123'
        }),
        request(app).post('/api/v1/auth/login').send({
          email: 'user@test.com',
          password: 'password123'
        })
      ]);

      adminToken = logins[0].body.data.tokens.accessToken;
      librarianToken = logins[1].body.data.tokens.accessToken;
      userToken = logins[2].body.data.tokens.accessToken;

      // Criar categoria e autor em paralelo
      const [categoryResponse, authorResponse] = await Promise.all([
        request(app)
          .post('/api/v1/categories')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            name: 'Programming',
            description: 'Programming books'
          }),
        request(app)
          .post('/api/v1/authors')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            name: 'Robert Martin',
            biography: 'Software engineer and author'
          })
      ]);

      categoryId = categoryResponse.body.data.category.id;
      authorId = authorResponse.body.data.author.id;
    } catch (error) {
      console.error('Error in beforeEach:', error);
      throw error;
    }
  }, 30000); // Aumentar timeout para 30 segundos

  describe('POST /api/v1/books', () => {
    const validBookData = {
      title: 'Clean Code',
      isbn: '9780132350884',
      description: 'A Handbook of Agile Software Craftsmanship',
      publishedYear: 2008,
      totalCopies: 3,
      language: 'en-US',
      pages: 464
    };

    it('should create book as admin', async () => {
      const response = await request(app)
        .post('/api/v1/books')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          ...validBookData,
          categoryId,
          authors: [authorId]
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.book).toMatchObject({
        title: validBookData.title,
        isbn: validBookData.isbn,
        totalCopies: validBookData.totalCopies,
        availableCopies: validBookData.totalCopies
      });
      expect(response.body.data.book.authors).toHaveLength(1);
      expect(response.body.data.book.category.id).toBe(categoryId);
    }, 15000); // Timeout específico para este teste

    it('should create book as librarian', async () => {
      const response = await request(app)
        .post('/api/v1/books')
        .set('Authorization', `Bearer ${librarianToken}`)
        .send({
          ...validBookData,
          isbn: '9780132350885', // ISBN diferente para evitar conflito
          categoryId,
          authors: [authorId]
        })
        .expect(201);

      expect(response.body.success).toBe(true);
    }, 15000);

    it('should deny access to regular user', async () => {
      const response = await request(app)
        .post('/api/v1/books')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          ...validBookData,
          isbn: '9780132350886', // ISBN diferente
          categoryId,
          authors: [authorId]
        })
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error.type).toBe('AuthorizationError');
    }, 15000);

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/v1/books')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Test Book'
          // missing categoryId and authors
        })
        .expect(400);

      expect(response.body.error.type).toBe('ValidationError');
    }, 15000);

    it('should return 404 for invalid category', async () => {
      const response = await request(app)
        .post('/api/v1/books')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          ...validBookData,
          isbn: '9780132350887', // ISBN diferente
          categoryId: 'invalid_category_id',
          authors: [authorId]
        })
        .expect(404);

      expect(response.body.error.message).toBe('Categoria não encontrada');
    }, 15000);

    it('should return 409 for duplicate ISBN', async () => {
      const testIsbn = '9780132350888';
      
      // Criar primeiro livro
      await request(app)
        .post('/api/v1/books')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          ...validBookData,
          isbn: testIsbn,
          categoryId,
          authors: [authorId]
        });

      // Tentar criar com mesmo ISBN
      const response = await request(app)
        .post('/api/v1/books')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          ...validBookData,
          title: 'Different Title',
          isbn: testIsbn, // Mesmo ISBN
          categoryId,
          authors: [authorId]
        })
        .expect(409);

      expect(response.body.error.type).toBe('ConflictError');
    }, 20000); // Este teste precisa de mais tempo pois cria 2 livros
  });

  describe('GET /api/v1/books', () => {
    beforeEach(async () => {
      // Criar alguns livros para teste em paralelo
      await Promise.all([
        request(app)
          .post('/api/v1/books')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            title: 'Clean Code',
            isbn: '9780132350891',
            categoryId,
            authors: [authorId]
          }),
        request(app)
          .post('/api/v1/books')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            title: 'The Clean Coder',
            isbn: '9780137081073',
            categoryId,
            authors: [authorId]
          })
      ]);
    }, 15000);

    it('should list books without authentication', async () => {
      const response = await request(app)
        .get('/api/v1/books')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.books).toHaveLength(2);
      expect(response.body.data.pagination).toMatchObject({
        page: 1,
        limit: 10,
        total: 2,
        totalPages: 1
      });
    }, 15000);

    it('should filter books by search term', async () => {
      const response = await request(app)
        .get('/api/v1/books?search=coder')
        .expect(200);

      expect(response.body.data.books).toHaveLength(1);
      expect(response.body.data.books[0].title).toBe('The Clean Coder');
    }, 15000);

    it('should paginate results', async () => {
      const response = await request(app)
        .get('/api/v1/books?page=1&limit=1')
        .expect(200);

      expect(response.body.data.books).toHaveLength(1);
      expect(response.body.data.pagination.hasNext).toBe(true);
    }, 15000);

    it('should filter by category', async () => {
      const response = await request(app)
        .get(`/api/v1/books?categoryId=${categoryId}`)
        .expect(200);

      expect(response.body.data.books).toHaveLength(2);
    }, 15000);
  });

  describe('GET /api/v1/books/:id', () => {
    let bookId;

    beforeEach(async () => {
      const bookResponse = await request(app)
        .post('/api/v1/books')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Clean Code',
          isbn: '9780132350892',
          description: 'Test description',
          categoryId,
          authors: [authorId]
        });
      bookId = bookResponse.body.data.book.id;
    }, 15000);

    it('should return book details', async () => {
      const response = await request(app)
        .get(`/api/v1/books/${bookId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.book).toMatchObject({
        id: bookId,
        title: 'Clean Code',
        isbn: '9780132350892'
      });
      expect(response.body.data.book.activeLoans).toBeDefined();
      expect(response.body.data.book.activeReservations).toBeDefined();
    }, 15000);

    it('should return 404 for non-existent book', async () => {
      const response = await request(app)
        .get('/api/v1/books/non_existent_id')
        .expect(404);

      expect(response.body.error.type).toBe('NotFoundError');
    }, 15000);
  });

  describe('DELETE /api/v1/books/:id', () => {
    let bookId;

    beforeEach(async () => {
      const bookResponse = await request(app)
        .post('/api/v1/books')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Book to Delete',
          isbn: '9780132350893',
          categoryId,
          authors: [authorId]
        });
      bookId = bookResponse.body.data.book.id;
    }, 15000);

    it('should delete book as admin', async () => {
      const response = await request(app)
        .delete(`/api/v1/books/${bookId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Livro deletado com sucesso');
    }, 15000);

    it('should deny access to librarian', async () => {
      const response = await request(app)
        .delete(`/api/v1/books/${bookId}`)
        .set('Authorization', `Bearer ${librarianToken}`)
        .expect(403);

      expect(response.body.error.type).toBe('AuthorizationError');
    }, 15000);

    it('should return 404 for non-existent book', async () => {
      const response = await request(app)
        .delete('/api/v1/books/non_existent_id')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);

      expect(response.body.error.type).toBe('NotFoundError');
    }, 15000);
  });
});