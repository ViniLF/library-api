const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Library API',
      version: '1.0.0',
      description: 'API RESTful para sistema de gerenciamento de biblioteca digital',
      contact: {
        name: 'ViniLF',
        email: 'vinihlucas90@gmail.com'
      }
    },
    servers: [
      {
        url: process.env.NODE_ENV === 'production' 
          ? 'https://sua-api.herokuapp.com' 
          : `http://localhost:${process.env.PORT || 3001}`,
        description: process.env.NODE_ENV === 'production' ? 'Produção' : 'Desenvolvimento'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Token JWT para autenticação'
        }
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', description: 'ID único do usuário' },
            name: { type: 'string', description: 'Nome completo' },
            email: { type: 'string', format: 'email', description: 'Email do usuário' },
            role: { type: 'string', enum: ['USER', 'LIBRARIAN', 'ADMIN'], description: 'Nível de acesso' },
            isActive: { type: 'boolean', description: 'Status ativo/inativo' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        Book: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            title: { type: 'string', description: 'Título do livro' },
            isbn: { type: 'string', description: 'ISBN do livro' },
            description: { type: 'string', description: 'Descrição/sinopse' },
            publishedYear: { type: 'integer', description: 'Ano de publicação' },
            totalCopies: { type: 'integer', description: 'Total de exemplares' },
            availableCopies: { type: 'integer', description: 'Exemplares disponíveis' },
            language: { type: 'string', description: 'Idioma do livro' },
            pages: { type: 'integer', description: 'Número de páginas' },
            status: { type: 'string', enum: ['AVAILABLE', 'UNAVAILABLE', 'MAINTENANCE'] },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
            category: { $ref: '#/components/schemas/Category' },
            authors: { type: 'array', items: { $ref: '#/components/schemas/Author' } }
          }
        },
        Category: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string', description: 'Nome da categoria' },
            description: { type: 'string', description: 'Descrição da categoria' },
            booksCount: { type: 'integer', description: 'Número de livros na categoria' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        Author: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string', description: 'Nome do autor' },
            biography: { type: 'string', description: 'Biografia do autor' },
            birthDate: { type: 'string', format: 'date', description: 'Data de nascimento' },
            nationality: { type: 'string', description: 'Nacionalidade' },
            booksCount: { type: 'integer', description: 'Número de livros do autor' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        ApiResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', description: 'Status da operação' },
            message: { type: 'string', description: 'Mensagem descritiva' },
            data: { type: 'object', description: 'Dados da resposta' }
          }
        },
        ApiError: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            error: {
              type: 'object',
              properties: {
                type: { type: 'string', description: 'Tipo do erro' },
                message: { type: 'string', description: 'Mensagem do erro' }
              }
            }
          }
        },
        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email', example: 'admin@email.com' },
            password: { type: 'string', example: '123456' }
          }
        },
        RegisterRequest: {
          type: 'object',
          required: ['name', 'email', 'password'],
          properties: {
            name: { type: 'string', example: 'João Silva' },
            email: { type: 'string', format: 'email', example: 'joao@email.com' },
            password: { type: 'string', example: '123456' },
            role: { type: 'string', enum: ['USER', 'LIBRARIAN', 'ADMIN'], default: 'USER' }
          }
        },
        CreateBookRequest: {
          type: 'object',
          required: ['title', 'categoryId', 'authors'],
          properties: {
            title: { type: 'string', example: 'Clean Code' },
            isbn: { type: 'string', example: '9780132350884' },
            description: { type: 'string', example: 'Manual de boas práticas de programação' },
            publishedYear: { type: 'integer', example: 2008 },
            totalCopies: { type: 'integer', example: 3, default: 1 },
            language: { type: 'string', example: 'pt-BR', default: 'pt-BR' },
            pages: { type: 'integer', example: 464 },
            categoryId: { type: 'string', example: 'category-id-here' },
            authors: { type: 'array', items: { type: 'string' }, example: ['author-id-here'] }
          }
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  apis: ['./src/routes/*.js']
};

const specs = swaggerJsdoc(options);

module.exports = {
  swaggerUi,
  specs
};