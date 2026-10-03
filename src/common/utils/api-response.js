export const sendSuccess = (res, { statusCode = 200, data = null, meta = {} } = {}) =>
  res.status(statusCode).json({
    success: true,
    data,
    meta: { ...meta, requestId: res.locals.requestId ?? res.req?.id ?? null },
  });

export const buildErrorBody = ({ message, code, errors, details, requestId = null }) => ({
  success: false,
  error: { code, message, details: details ?? errors ?? [] },
  meta: { requestId },
});

export const sendError = (res, { statusCode = 500, ...error }) =>
  res
    .status(statusCode)
    .json(buildErrorBody({ ...error, requestId: res.locals.requestId ?? null }));
