export function notFound(request, response) {
  response.status(404).json({ success: false, message: 'Route not found.' });
}

export function errorHandler(error, request, response, next) {
  if (response.headersSent) return next(error);
  console.error(error);
  const status = error.status || 500;
  response.status(status).json({
    success: false,
    message: status === 500 ? 'An unexpected server error occurred.' : error.message
  });
}

export function httpError(status, message) {
  return Object.assign(new Error(message), { status });
}