const Joi = require('joi');

const createBookSchema = Joi.object({
  title: Joi.string()
    .min(1)
    .max(200)
    .required()
    .messages({
      'string.empty': 'Título é obrigatório',
      'string.min': 'Título deve ter pelo menos 1 caractere',
      'string.max': 'Título deve ter no máximo 200 caracteres',
      'any.required': 'Título é obrigatório'
    }),

  isbn: Joi.string()
    .pattern(/^(?:\d{10}|\d{13})$/)
    .optional()
    .messages({
      'string.pattern.base': 'ISBN deve ter 10 ou 13 dígitos'
    }),

  description: Joi.string()
    .max(1000)
    .optional()
    .messages({
      'string.max': 'Descrição deve ter no máximo 1000 caracteres'
    }),

  publishedYear: Joi.number()
    .integer()
    .min(1000)
    .max(new Date().getFullYear())
    .optional()
    .messages({
      'number.min': 'Ano deve ser maior que 1000',
      'number.max': `Ano não pode ser maior que ${new Date().getFullYear()}`,
      'number.integer': 'Ano deve ser um número inteiro'
    }),

  totalCopies: Joi.number()
    .integer()
    .min(1)
    .default(1)
    .messages({
      'number.min': 'Total de cópias deve ser pelo menos 1',
      'number.integer': 'Total de cópias deve ser um número inteiro'
    }),

  language: Joi.string()
    .min(2)
    .max(10)
    .default('pt-BR')
    .messages({
      'string.min': 'Idioma deve ter pelo menos 2 caracteres',
      'string.max': 'Idioma deve ter no máximo 10 caracteres'
    }),

  pages: Joi.number()
    .integer()
    .min(1)
    .optional()
    .messages({
      'number.min': 'Número de páginas deve ser pelo menos 1',
      'number.integer': 'Número de páginas deve ser um número inteiro'
    }),

  categoryId: Joi.string()
    .required()
    .messages({
      'string.empty': 'Categoria é obrigatória',
      'any.required': 'Categoria é obrigatória'
    }),

  authors: Joi.array()
    .items(Joi.string())
    .min(1)
    .required()
    .messages({
      'array.min': 'Deve ter pelo menos um autor',
      'any.required': 'Autores são obrigatórios'
    })
});

const updateBookSchema = Joi.object({
  title: Joi.string()
    .min(1)
    .max(200)
    .optional()
    .messages({
      'string.empty': 'Título não pode estar vazio',
      'string.min': 'Título deve ter pelo menos 1 caractere',
      'string.max': 'Título deve ter no máximo 200 caracteres'
    }),

  isbn: Joi.string()
    .pattern(/^(?:\d{10}|\d{13})$/)
    .optional()
    .messages({
      'string.pattern.base': 'ISBN deve ter 10 ou 13 dígitos'
    }),

  description: Joi.string()
    .max(1000)
    .optional()
    .messages({
      'string.max': 'Descrição deve ter no máximo 1000 caracteres'
    }),

  publishedYear: Joi.number()
    .integer()
    .min(1000)
    .max(new Date().getFullYear())
    .optional()
    .messages({
      'number.min': 'Ano deve ser maior que 1000',
      'number.max': `Ano não pode ser maior que ${new Date().getFullYear()}`,
      'number.integer': 'Ano deve ser um número inteiro'
    }),

  totalCopies: Joi.number()
    .integer()
    .min(1)
    .optional()
    .messages({
      'number.min': 'Total de cópias deve ser pelo menos 1',
      'number.integer': 'Total de cópias deve ser um número inteiro'
    }),

  language: Joi.string()
    .min(2)
    .max(10)
    .optional()
    .messages({
      'string.min': 'Idioma deve ter pelo menos 2 caracteres',
      'string.max': 'Idioma deve ter no máximo 10 caracteres'
    }),

  pages: Joi.number()
    .integer()
    .min(1)
    .optional()
    .messages({
      'number.min': 'Número de páginas deve ser pelo menos 1',
      'number.integer': 'Número de páginas deve ser um número inteiro'
    }),

  categoryId: Joi.string()
    .optional(),

  authors: Joi.array()
    .items(Joi.string())
    .min(1)
    .optional()
    .messages({
      'array.min': 'Deve ter pelo menos um autor'
    }),

  status: Joi.string()
    .valid('AVAILABLE', 'UNAVAILABLE', 'MAINTENANCE')
    .optional()
    .messages({
      'any.only': 'Status deve ser AVAILABLE, UNAVAILABLE ou MAINTENANCE'
    }),

  availableCopies: Joi.number()
    .integer()
    .min(0)
    .optional()
    .messages({
      'number.min': 'Cópias disponíveis não pode ser negativo',
      'number.integer': 'Cópias disponíveis deve ser um número inteiro'
    })
});

const querySchema = Joi.object({
  page: Joi.number()
    .integer()
    .min(1)
    .default(1)
    .messages({
      'number.min': 'Página deve ser pelo menos 1',
      'number.integer': 'Página deve ser um número inteiro'
    }),

  limit: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .default(10)
    .messages({
      'number.min': 'Limit deve ser pelo menos 1',
      'number.max': 'Limit deve ser no máximo 100',
      'number.integer': 'Limit deve ser um número inteiro'
    }),

  search: Joi.string()
    .min(1)
    .optional()
    .messages({
      'string.min': 'Busca deve ter pelo menos 1 caractere'
    }),

  categoryId: Joi.string()
    .optional(),

  authorId: Joi.string()
    .optional(),

  status: Joi.string()
    .valid('AVAILABLE', 'UNAVAILABLE', 'MAINTENANCE')
    .optional()
    .messages({
      'any.only': 'Status deve ser AVAILABLE, UNAVAILABLE ou MAINTENANCE'
    }),

  language: Joi.string()
    .optional(),

  sortBy: Joi.string()
    .valid('title', 'createdAt', 'publishedYear', 'pages')
    .default('createdAt')
    .messages({
      'any.only': 'SortBy deve ser title, createdAt, publishedYear ou pages'
    }),

  sortOrder: Joi.string()
    .valid('asc', 'desc')
    .default('desc')
    .messages({
      'any.only': 'SortOrder deve ser asc ou desc'
    })
});

const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      return next(error);
    }

    req[property] = value;
    next();
  };
};

module.exports = {
  createBookSchema,
  updateBookSchema,
  querySchema,
  validate,
  validateCreateBook: validate(createBookSchema),
  validateUpdateBook: validate(updateBookSchema),
  validateQuery: validate(querySchema, 'query')
};