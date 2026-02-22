const { randomUUID } = require('crypto');
const logger = require('./logger');

function requestIdMiddleware(req, res, next) {
  const id = req.headers['x-request-id'] || randomUUID();
  req.id = id;
  res.setHeader('X-Request-ID', id);
  next();
}

function logRequest(req, res, next) {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    const meta = {
      requestId: req.id,
      method: req.method,
      path: req.path,
      status: res.statusCode,
      durationMs: duration,
    };
    if (req.auth?.email) meta.user = req.auth.email;
    const level = res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info';
    logger[level](`${req.method} ${req.path} ${res.statusCode} ${duration}ms`, meta);
  });
  next();
}

module.exports = { requestIdMiddleware, logRequest };
