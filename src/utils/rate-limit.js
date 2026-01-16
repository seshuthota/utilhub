const rateLimitMap = new Map();

/**
 * Basic in-memory rate limiter.
 * @param {string} ip - IP address to rate limit
 * @param {number} limit - Max requests per window
 * @param {number} windowMs - Window size in milliseconds
 * @returns {boolean} - True if allowed, False if limit exceeded
 */
export function checkRateLimit(ip, limit = 20, windowMs = 60 * 1000) {
    const now = Date.now();

    // Clean up old entries periodically (lazy cleanup on request for now is fine for small scale)
    // For a cleaner approach, one might run a cleanup interval, but this is a utility function.

    const record = rateLimitMap.get(ip) || { count: 0, startTime: now };

    if (now - record.startTime > windowMs) {
        // Reset window
        record.count = 1;
        record.startTime = now;
    } else {
        record.count++;
    }

    rateLimitMap.set(ip, record);
    return record.count <= limit;
}
