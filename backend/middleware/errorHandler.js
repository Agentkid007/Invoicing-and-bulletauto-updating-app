'use strict';

// Global error-handling middleware — must be the last app.use() call
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  if (process.env.NODE_ENV !== 'production') {
    console.error('[Error]', status, message, err.stack || '');
  }

  res.status(status).json({ error: message });
}

module.exports = { errorHandler };
