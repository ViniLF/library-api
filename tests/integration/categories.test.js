const request = require('supertest');
const app = require('../../src/app');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

describe('Categories Endpoints', () => {
  let adminToken, librarianToken, userToken;

  beforeAll(async () => {
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Limpar dados
    await prisma.bookAuthor.deleteMany();
    await prisma.book.deleteMany();
    await prisma.category.deleteMany();
    await prisma.user.deleteMany();

    // Criar usuários
    await Promise.all([
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

    // Fazer login
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
  });

  describe('POST /api/v1/categories', () => {
    const validCategoryData = {
      name: 'Programming',
      description: 'Books about programming and software development'
    };

    it('should create category as admin', async () => {
      const response = await request(app)
        .post('/api/v1/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(validCategoryData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Categoria criada com sucesso');
      expect(response.body.data.category).toMatchObject({
        name: validCategoryData.name,
        description: validCategoryData.description,
        booksCount: 0
      });
    });

    it('should deny access to librarian', async () => {
      const response = await request(app)
        .post('/api/v1/categories')
        .set('Authorization', `Bearer ${librarianToken}`)
        .send(validCategoryData)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error.type).toBe('AuthorizationError');
    });

    it('should deny access to regular user', async () => {
      const response = await request(app)
        .post('/api/v1/categories')
        .set('Authorization', `Bearer ${userToken}`)
        .send(validCategoryData)
        .expect(403);

      expect(response.body.error.type).toBe('AuthorizationError');
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/v1/categories')
        .send(validCategoryData)
        .expect(401);

      expect(response.body.error.type).toBe('AuthenticationError');
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/v1/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          description: 'Missing name'
        })
        .expect(400);

      expect(response.body.error.type).toBe('ValidationError');
    });

    it('should return 409 for duplicate name', async () => {
      // Criar primeira categoria
      await request(app)
        .post('/api/v1/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(validCategoryData);

      // Tentar criar categoria com mesmo nome
      const response = await request(app)
        .post('/api/v1/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(validCategoryData)
        .expect(409);

      expect(response.body.error.type).toBe('ConflictError');
    });

    it('should validate name length', async () => {
      const response = await request(app)
        .post('/api/v1/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'A',
          description: 'Too short name'
        })
        .expect(400);

      expect(response.body.error.type).toBe('ValidationError');
    });
  });

  describe('GET /api/v1/categories', () => {
    beforeEach(async () => {
      // Criar algumas categorias para teste
      await Promise.all([
        request(app)
          .post('/api/v1/categories')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            name: 'Fiction',
            description: 'Fiction books'
          }),
        request(app)
          .post('/api/v1/categories')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            name: 'Non-Fiction',
            description: 'Non-fiction books'
          }),
        request(app)
          .post('/api/v1/categories')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            name: 'Science',
            description: 'Science books'
          })
      ]);
    });

    it('should list categories without authentication', async () => {
      const response = await request(app)
        .get('/api/v1/categories')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.categories).toHaveLength(3);
      expect(response.body.data.categories[0]).toHaveProperty('name');
      expect(response.body.data.categories[0]).toHaveProperty('booksCount');
    });

    it('should return categories sorted by name', async () => {
      const response = await request(app)
        .get('/api/v1/categories')
        .expect(200);

      const names = response.body.data.categories.map(cat => cat.name);
      expect(names).toEqual(['Fiction', 'Non-Fiction', 'Science']);
    });
  });

  describe('GET /api/v1/categories/:id', () => {
    let categoryId;

    beforeEach(async () => {
      const categoryResponse = await request(app)
        .post('/api/v1/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Test Category',
          description: 'Test category description'
        });
      categoryId = categoryResponse.body.data.category.id;
    });

    it('should return category details', async () => {
      const response = await request(app)
        .get(`/api/v1/categories/${categoryId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.category).toMatchObject({
        id: categoryId,
        name: 'Test Category',
        description: 'Test category description',
        booksCount: 0
      });
      expect(response.body.data.category).toHaveProperty('recentBooks');
    });

    it('should return 404 for non-existent category', async () => {
      const response = await request(app)
        .get('/api/v1/categories/non_existent_id')
        .expect(404);

      expect(response.body.error.type).toBe('NotFoundError');
    });
  });

  describe('PUT /api/v1/categories/:id', () => {
    let categoryId;

    beforeEach(async () => {
      const categoryResponse = await request(app)
        .post('/api/v1/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Original Category',
          description: 'Original description'
        });
      categoryId = categoryResponse.body.data.category.id;
    });

    it('should update category as admin', async () => {
      const updateData = {
        name: 'Updated Category',
        description: 'Updated description'
      };

      const response = await request(app)
        .put(`/api/v1/categories/${categoryId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.category).toMatchObject(updateData);
    });

    it('should deny access to librarian', async () => {
      const response = await request(app)
        .put(`/api/v1/categories/${categoryId}`)
        .set('Authorization', `Bearer ${librarianToken}`)
        .send({ name: 'New Name' })
        .expect(403);

      expect(response.body.error.type).toBe('AuthorizationError');
    });

    it('should return 404 for non-existent category', async () => {
      const response = await request(app)
        .put('/api/v1/categories/non_existent_id')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'New Name' })
        .expect(404);

      expect(response.body.error.type).toBe('NotFoundError');
    });

    it('should prevent duplicate names', async () => {
      // Criar segunda categoria
      await request(app)
        .post('/api/v1/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Existing Category' });

      // Tentar atualizar primeira categoria com nome existente
      const response = await request(app)
        .put(`/api/v1/categories/${categoryId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Existing Category' })
        .expect(409);

      expect(response.body.error.type).toBe('ConflictError');
    });
  });

  describe('DELETE /api/v1/categories/:id', () => {
    let categoryId;

    beforeEach(async () => {
      const categoryResponse = await request(app)
        .post('/api/v1/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Category to Delete',
          description: 'This category will be deleted'
        });
      categoryId = categoryResponse.body.data.category.id;
    });

    it('should delete category as admin', async () => {
      const response = await request(app)
        .delete(`/api/v1/categories/${categoryId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Categoria deletada com sucesso');
    });

    it('should deny access to librarian', async () => {
      const response = await request(app)
        .delete(`/api/v1/categories/${categoryId}`)
        .set('Authorization', `Bearer ${librarianToken}`)
        .expect(403);

      expect(response.body.error.type).toBe('AuthorizationError');
    });

    it('should return 404 for non-existent category', async () => {
      const response = await request(app)
        .delete('/api/v1/categories/non_existent_id')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);

      expect(response.body.error.type).toBe('NotFoundError');
    });
  });
});