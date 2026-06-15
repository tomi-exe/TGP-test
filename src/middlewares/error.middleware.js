export class ApiError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
  }
}

export function notFoundMiddleware(req, res, next) {
  next(new ApiError('Ruta no encontrada', 404));
}

export function errorMiddleware(error, req, res, next) {
  const statusCode = error.statusCode || 500;

  console.error(`[${req.method} ${req.originalUrl}]`, {
    message: error.message,
    stack: process.env.NODE_ENV === 'production' ? undefined : error.stack,
  });

  res.status(statusCode).json({
    error: error.isOperational ? error.message : 'Error interno del servidor',
  });
}
