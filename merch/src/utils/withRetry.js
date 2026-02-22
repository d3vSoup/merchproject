/**
 * Retry utility for critical API calls.
 * Retries on network errors, timeouts, and 5xx/502/503.
 * Does NOT retry on 4xx (client errors) to avoid duplicate mutations.
 */

const RETRYABLE_STATUSES = new Set([502, 503, 504]);
const RETRYABLE_CODES = new Set(['ECONNABORTED', 'ERR_NETWORK', 'ETIMEDOUT']);

function isRetryable(error) {
  if (!error) return false;
  const code = error.code || error.name;
  const status = error.response?.status;
  if (RETRYABLE_CODES.has(code)) return true;
  if (status && RETRYABLE_STATUSES.has(status)) return true;
  return false;
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Execute an async function with retries.
 * @param {() => Promise<T>} fn - Function that returns a promise
 * @param {Object} options - { maxRetries, baseDelayMs, isRetryable }
 * @returns {Promise<T>}
 */
export async function withRetry(fn, options = {}) {
  const {
    maxRetries = 3,
    baseDelayMs = 1000,
    isRetryable: customRetryable = null,
  } = options;

  let lastError;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      const shouldRetry = customRetryable ? customRetryable(err) : isRetryable(err);
      if (!shouldRetry || attempt >= maxRetries) {
        throw err;
      }
      const delayMs = baseDelayMs * Math.pow(2, attempt);
      await delay(delayMs);
    }
  }
  throw lastError;
}

/**
 * For createOrder: only retry on network/timeout, never on 4xx.
 * Use fewer retries to avoid duplicate order risk.
 */
export function isOrderRetryable(err) {
  if (!err) return false;
  const status = err.response?.status;
  if (status && status >= 400 && status < 500) return false;
  return isRetryable(err);
}
