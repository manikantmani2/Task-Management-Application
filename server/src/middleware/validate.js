import { ApiError } from './errorHandler.js';

export const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse({
    body: req.body,
    params: req.params,
    query: req.query
  });

  if (!result.success) {
    return next(new ApiError(400, result.error.issues.map((issue) => issue.message).join(', ')));
  }

  req.validated = result.data;
  return next();
};