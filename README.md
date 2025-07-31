# Library API

Uma API RESTful completa para sistema de gerenciamento de biblioteca digital, desenvolvida com Node.js, Express, Prisma e PostgreSQL.

![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white)
![Swagger](https://img.shields.io/badge/Swagger-85EA2D?style=for-the-badge&logo=swagger&logoColor=black)

## 🌐 Demo Online

**API em Produção:** https://library-api-706f.onrender.com//api/v1

**Documentação:** https://library-api-706f.onrender.com//api/v1/docs

**Health Check:** https://library-api-706f.onrender.com//health

> **Credenciais de teste:**
> - **Admin:** admin@email.com / 123456
> - **User:** joao@email.com / 123456

Esta é uma API completa para gerenciamento de biblioteca digital que permite:

- **Autenticação e autorização** com JWT e roles (USER, LIBRARIAN, ADMIN)
- **Gerenciamento de livros** com busca avançada e filtros
- **Catálogo de autores e categorias** com relacionamentos
- **Sistema de controle** com validações de negócio
- **Documentação** com Swagger UI

## Funcionalidades

### Sistema de Autenticação
- Registro e login de usuários
- Autenticação JWT com access e refresh tokens
- Autorização baseada em roles (USER/LIBRARIAN/ADMIN)
- Middleware de proteção de rotas

### Gerenciamento de Livros
- CRUD completo de livros
- Busca textual por título, descrição e ISBN
- Filtros avançados (categoria, autor, status, idioma)
- Paginação e ordenação configurável
- Controle de exemplares disponíveis

### Autores e Categorias
- CRUD de autores com biografia e nacionalidade
- CRUD de categorias com contagem de livros
- Busca por nome, biografia e nacionalidade
- Relacionamentos many-to-many entre livros e autores

### Segurança e Validação
- Validação robusta com Joi
- Hash de senhas com bcrypt
- Tratamento centralizado de erros
- Headers de segurança com Helmet
- Controle de CORS

**Padrões utilizados:**
- **Repository Pattern** para acesso a dados
- **Service Layer** para lógica de negócio
- **Middleware Pattern** para funcionalidades transversais
- **Error Handling** centralizado

## Tecnologias

- **Node.js** - Runtime JavaScript
- **Express.js** - Framework web
- **Prisma** - ORM moderno para TypeScript/JavaScript
- **PostgreSQL** - Banco de dados relacional
- **JWT** - Autenticação stateless
- **Joi** - Validação de dados
- **Bcrypt** - Hash de senhas
- **Swagger** - Documentação da API
- **Morgan** - Logger HTTP
- **Helmet** - Headers de segurança
- **CORS** - Cross-Origin Resource Sharing

## Database Schema

```mermaid
erDiagram
    User {
        string id PK
        string email UK
        string password
        string name
        enum role
        boolean isActive
        datetime createdAt
        datetime updatedAt
    }
    
    Book {
        string id PK
        string title
        string isbn UK
        string description
        int publishedYear
        int totalCopies
        int availableCopies
        string language
        int pages
        enum status
        string categoryId FK
        datetime createdAt
        datetime updatedAt
    }
    
    Author {
        string id PK
        string name
        string biography
        date birthDate
        string nationality
        datetime createdAt
        datetime updatedAt
    }
    
    Category {
        string id PK
        string name UK
        string description
        datetime createdAt
        datetime updatedAt
    }
    
    BookAuthor {
        string bookId FK
        string authorId FK
    }
    
    User ||--o{ Loan : creates
    User ||--o{ Reservation : makes
    Book ||--o{ Loan : borrowed
    Book ||--o{ Reservation : reserved
    Book }o--|| Category : belongs_to
    Book ||--o{ BookAuthor : has
    Author ||--o{ BookAuthor : writes
```

## Instalação e Uso

### Pré-requisitos
- Node.js 18+
- PostgreSQL 15+
- npm ou yarn

### 1. Clone o repositório
```bash
git clone https://github.com/ViniLF/library-api.git
cd library-api
```

### 2. Instale as dependências
```bash
npm install
```

### 3. Configure as variáveis de ambiente
```bash
cp .env.example .env
```

Edite o arquivo `.env` com suas configurações:
```env
# Server
PORT=3001
NODE_ENV=development

# Database
DATABASE_URL="postgresql://username:password@localhost:5432/library_db"

# JWT
JWT_SECRET=sua-chave-secreta-aqui
JWT_REFRESH_SECRET=sua-chave-refresh-aqui
```

### 4. Configure o banco de dados
```bash
# Gerar o cliente Prisma
npx prisma generate

# Executar migrations
npx prisma db push

# (Opcional) Visualizar dados
npx prisma studio
```

### 5. Inicie o servidor
```bash
# Desenvolvimento
npm run dev

# Produção
npm start
```

### 6. Acesse a documentação
- **API Base:** http://localhost:3001/api/v1
- **Documentação Swagger:** http://localhost:3001/api/v1/docs
- **Health Check:** http://localhost:3001/health

## Documentação da API

### Endpoints Principais

#### Autenticação
```http
POST   /api/v1/auth/register          # Registrar usuário
POST   /api/v1/auth/login             # Fazer login
POST   /api/v1/auth/refresh-token     # Renovar token
GET    /api/v1/auth/me                # Perfil do usuário
```

#### Livros
```http
GET    /api/v1/books                  # Listar livros (filtros/paginação)
GET    /api/v1/books/search?q=termo   # Buscar livros
GET    /api/v1/books/:id              # Detalhes do livro
POST   /api/v1/books                  # Criar livro ADMIN/LIBRARIAN
PUT    /api/v1/books/:id              # Atualizar livro ADMIN/LIBRARIAN
DELETE /api/v1/books/:id              # Deletar livro ADMIN
```

#### Autores
```http
GET    /api/v1/authors                # Listar autores
GET    /api/v1/authors/search?q=nome  # Buscar autores
POST   /api/v1/authors                # Criar autor ADMIN/LIBRARIAN
```

#### Categorias
```http
GET    /api/v1/categories             # Listar categorias
POST   /api/v1/categories             # Criar categoria ADMIN
```

### Filtros Avançados (Livros)
```http
GET /api/v1/books?page=1&limit=10&search=clean&categoryId=123&sortBy=title&sortOrder=asc
```

### Autenticação
Endpoints protegidos requerem Bearer Token:
```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Exemplos de Uso

#### Criar usuário ADMIN
```bash
curl -X POST http://localhost:3001/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Admin Silva",
    "email": "admin@library.com",
    "password": "123456",
    "role": "ADMIN"
  }'
```

#### Criar livro
```bash
curl -X POST http://localhost:3001/api/v1/books \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "title": "Clean Code",
    "isbn": "9780132350884",
    "description": "Manual de boas práticas",
    "publishedYear": 2008,
    "totalCopies": 3,
    "categoryId": "category-id",
    "authors": ["author-id"]
  }'
```

## Testes

```bash
# Executar testes
npm test

# Testes com coverage
npm run test:coverage

# Testes em modo watch
npm run test:watch
```

## Scripts Disponíveis

```bash
npm start          # Inicia em produção
npm run dev        # Inicia em desenvolvimento (nodemon)
npm test           # Executa testes
npm run db:migrate # Executa migrations
npm run db:seed    # Popula banco com dados de exemplo
npm run db:studio  # Abre Prisma Studio
```

## Deploy

### Heroku
```bash
# Instalar Heroku CLI
npm install -g heroku

# Login e criar app
heroku login
heroku create library-api-seu-nome

# Configurar variáveis
heroku config:set DATABASE_URL="sua-url-postgresql"
heroku config:set JWT_SECRET="sua-chave"
heroku config:set NODE_ENV="production"

# Deploy
git push heroku main
```

### Railway
```bash
# Instalar Railway CLI
npm install -g @railway/cli

# Login e deploy
railway login
railway link
railway up
```

## Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## Autor

**Vinícius Lucas Faria**
- GitHub: [@ViniLF](https://github.com/ViniLF)
- LinkedIn: [Vinicius Lucas](https://www.linkedin.com/in/viniciuslucasfaria/)
- Email: vinihlucas90@gmail.com

---

**Se este projeto te ajudou, deixe uma estrela!**
