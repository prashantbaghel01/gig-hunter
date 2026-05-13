// ============================================================
// middleware/errorHandler.js
// Global Express error handler — catches anything thrown
// inside route handlers and sends a clean JSON response.
// ============================================================

function errorHandler(err, req, res, next) {
  // Log full stack in dev, suppress in production
  if (process.env.NODE_ENV !== 'production') {
    console.error('[Error]', err.stack || err.message);
  }

  // OpenAI specific errors
  if (err.status === 401) {
    return res.status(401).json({
      success : false,
      message : 'Invalid OpenAI API key. Check OPENAI_API_KEY in .env',
    });
  }

  if (err.status === 429) {
    return res.status(429).json({
      success : false,
      message : 'OpenAI rate limit reached. Wait a moment and retry.',
    });
  }

  // Sequelize validation errors
  if (err.name === 'SequelizeValidationError') {
    return res.status(400).json({
      success  : false,
      message  : 'Validation error',
      details  : err.errors.map(e => e.message),
    });
  }

  if (err.name === 'SequelizeUniqueConstraintError') {
    return res.status(409).json({
      success : false,
      message : 'Record already exists',
    });
  }

  // Generic fallback
  const statusCode = err.statusCode || err.status || 500;
  res.status(statusCode).json({
    success : false,
    message : err.message || 'Internal server error',
    error   : process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
}

module.exports = errorHandler;
