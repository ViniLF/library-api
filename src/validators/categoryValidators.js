const Joi = require('joi');

const createCategorySchema = Joi.object({
  name: Joi.string()
    .min(2)
    .max(50)
    .required()
    .messages({
      'string.empty': 'Nome é obrigatório',
      'string.min': 'Nome deve ter pelo menos 2 caracteres',
      'string.max': 'Nome deve ter no máximo 50 caracteres',
      'any.required': 'Nome é obrigatório'
    }),

  description: Joi.string()
    .max(200)
    .optional()
    .messages({
      'string.max': 'Descrição deve ter no máximo 200 caracteres'
    })
});

const updateCategorySchema = Joi.object({
  name: Joi.string()
    .min(2)
    .max(50)
    .optional()
    .messages({
      'string.empty': 'Nome não pode estar vazio',
      'string.min': 'Nome deve ter pelo menos 2 caracteres',
      'string.max': 'Nome deve ter no máximo 50 caracteres'
    }),

  description: Joi.string()
    .max(200)
    .optional()
    .messages({
      'string.max': 'Descrição deve ter no máximo 200 caracteres'
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
  createCategorySchema,
  updateCategorySchema,
  validate,
  validateCreateCategory: validate(createCategorySchema),
  validateUpdateCategory: validate(updateCategorySchema)
};