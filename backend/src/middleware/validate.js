const { z } = require('zod');

/**
 * Middleware factory for validating incoming request body using a Zod schema.
 */
const validateBody = (schema) => {
  return (req, res, next) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          message: 'Input validation failed',
          errors: error.errors.map((err) => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        });
      }
      return res.status(500).json({
        success: false,
        message: 'Internal schema parsing error',
      });
    }
  };
};

module.exports = { validateBody };
