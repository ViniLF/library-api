const Joi = require('joi');

const createAuthorSchema = Joi.object({
  name: Joi.string()
    .min(2)
    .max(100)
    .required()
    .messages({
      'string.empty': 'Nome é obrigatório',
      'string.min': 'Nome deve ter pelo menos 2 caracteres',
      'string.max': 'Nome deve ter no máximo 100 caracteres',
      'any.required': 'Nome é obrigatório'
    }),

  biography: Joi.string()
    .max(1000)
    .optional()
    .messages({
      'string.max': 'Biografia deve ter no máximo 1000 caracteres'
    }),

  birthDate: Joi.date()
    .max('now')
    .optional()
    .messages({
      'date.max': 'Data de nascimento não pode ser no futuro'
    }),

  nationality: Joi.string()
    .min(2)
    .max(50)
    .optional()
    .messages({
      'string.min': 'Nacionalidade deve ter pelo menos 2 caracteres',
      'string.max': 'Nacionalidade deve ter no máximo 50 caracteres'
    })
});

const updateAuthorSchema = Joi.object({
  name: Joi.string()
    .min(2)
    .max(100)
    .optional()
    .messages({
      'string.empty': 'Nome não pode estar vazio',
      'string.min': 'Nome deve ter pelo menos 2 caracteres',
      'string.max': 'Nome deve ter no máximo 100 caracteres'
    }),

  biography: Joi.string()
    .max(1000)
    .optional()
    .messages({
      'string.max': 'Biografia deve ter no máximo 1000 caracteres'
    }),

  birthDate: Joi.date()
    .max('now')
    .optional()
    .messages({
      'date.max': 'Data de nascimento não pode ser no futuro'
    }),

  nationality: Joi.string()
    .min(2)
    .max(50)
    .optional()
    .messages({
      'string.min': 'Nacionalidade deve ter pelo menos 2 caracteres',
      'string.max': 'Nacionalidade deve ter no máximo 50 caracteres'
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
  createAuthorSchema,
  updateAuthorSchema,
  validate,
  validateCreateAuthor: validate(createAuthorSchema),
  validateUpdateAuthor: validate(updateAuthorSchema)
};