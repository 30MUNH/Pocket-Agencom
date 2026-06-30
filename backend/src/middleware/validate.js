const { fail } = require('../utils/response');

function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const details = result.error.issues.map((i) => ({
        field: i.path.join('.'),
        message: i.message,
      }));
      return fail(res, 'Validation failed', 422, details);
    }
    req.body = result.data;
    next();
  };
}

module.exports = { validate };
