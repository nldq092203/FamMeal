function validate(schema, source = 'body') {
  return (req, _res, next) => {
    const { error, value } = schema.validate(req[source], {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const { ValidationError } = require('../shared/errors');
      const details = error.details.map((d) => ({
        path: d.path.join('.'),
        message: d.message,
      }));
      const err = new ValidationError('Validation failed');
      err.details = details;
      throw err;
    }

    req[source] = value;
    next();
  };
}

module.exports = { validate };
