const Joi = require('joi');

/**
 * Validadores para endpoints de autenticação
 * Usando Joi para validação robusta de dados de entrada
 */

/**
 * Schema para registro de usuário
 */
const registerSchema = Joi.object({
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

  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.empty': 'Email é obrigatório',
      'string.email': 'Email deve ter um formato válido',
      'any.required': 'Email é obrigatório'
    }),

  password: Joi.string()
    .min(6)
    .max(100)
    .required()
    .messages({
      'string.empty': 'Senha é obrigatória',
      'string.min': 'Senha deve ter pelo menos 6 caracteres',
      'string.max': 'Senha deve ter no máximo 100 caracteres',
      'any.required': 'Senha é obrigatória'
    }),

  role: Joi.string()
    .valid('USER', 'LIBRARIAN', 'ADMIN')
    .default('USER')
    .messages({
      'any.only': 'Role deve ser USER, LIBRARIAN ou ADMIN'
    })
});

/**
 * Schema para login de usuário
 */
const loginSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.empty': 'Email é obrigatório',
      'string.email': 'Email deve ter um formato válido',
      'any.required': 'Email é obrigatório'
    }),

  password: Joi.string()
    .required()
    .messages({
      'string.empty': 'Senha é obrigatória',
      'any.required': 'Senha é obrigatória'
    })
});

/**
 * Schema para refresh token
 */
const refreshTokenSchema = Joi.object({
  refreshToken: Joi.string()
    .required()
    .messages({
      'string.empty': 'Refresh token é obrigatório',
      'any.required': 'Refresh token é obrigatório'
    })
});

/**
 * Middleware de validação genérico
 * @param {Joi.Schema} schema - Schema Joi para validação
 * @param {string} property - Propriedade do request a ser validada (body, params, query)
 */
const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false, // Retorna todos os erros, não apenas o primeiro
      stripUnknown: true // Remove campos não definidos no schema
    });

    if (error) {
      // O middleware errorHandler vai capturar este erro
      return next(error);
    }

    // Substitui os dados originais pelos dados validados/sanitizados
    req[property] = value;
    next();
  };
};

module.exports = {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  validate,
  
  // Middlewares prontos para usar nas rotas
  validateRegister: validate(registerSchema),
  validateLogin: validate(loginSchema),
  validateRefreshToken: validate(refreshTokenSchema)
};