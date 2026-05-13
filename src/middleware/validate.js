/**
 * Factory: returns an Express middleware that validates req.body against a Joi schema.
 * On failure it responds 422 with a clean error array.
 */
export const validate = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, {
    abortEarly: false,    // collect ALL errors at once
    stripUnknown: true,   // drop fields not in the schema
  });

  if (error) {
    const errors = error.details.map((d) => d.message.replace(/['"]/g, ''));
    return res.status(422).json({ error: 'Validation failed', errors });
  }

  req.body = value;   // use the sanitised + defaulted values
  next();
};
