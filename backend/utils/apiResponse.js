const success = (res, data = null, message = 'Success', statusCode = 200, meta = null) => {
  const response = { success: true, message };
  if (data !== null) response.data = data;
  if (meta)          response.meta = meta;
  return res.status(statusCode).json(response);
};

const created = (res, data, message = 'Resource created successfully') =>
  success(res, data, message, 201);

const error = (res, message = 'An error occurred', statusCode = 500, errors = null) => {
  const response = { success: false, message };
  if (errors) response.errors = errors;
  if (process.env.NODE_ENV === 'development' && errors?.stack)
    response.stack = errors.stack;
  return res.status(statusCode).json(response);
};

const notFound    = (res, message = 'Resource not found')    => error(res, message, 404);
const unauthorized= (res, message = 'Unauthorized')          => error(res, message, 401);
const forbidden   = (res, message = 'Access denied')         => error(res, message, 403);
const badRequest  = (res, message, errs = null)              => error(res, message, 400, errs);
const conflict    = (res, message = 'Resource already exists') => error(res, message, 409);

const paginate = (res, data, total, page, limit, message = 'Success') =>
  success(res, data, message, 200, {
    total,
    page:       parseInt(page),
    limit:      parseInt(limit),
    totalPages: Math.ceil(total / limit),
    hasNext:    page * limit < total,
    hasPrev:    page > 1,
  });

module.exports = { success, created, error, notFound, unauthorized, forbidden, badRequest, conflict, paginate };
