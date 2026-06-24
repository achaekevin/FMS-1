const { validationResult } = require('express-validator');
const api = require('../utils/apiResponse');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return api.badRequest(res, 'Validation failed', errors.array());
  next();
};

module.exports = validate;
