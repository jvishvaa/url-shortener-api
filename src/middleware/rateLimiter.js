import { redis } from "../db/redis.js";

export async function rateLimiter(req, res, next) {
  const ip = req.ip;
  const key = `rl:${ip}`;
  const limit = 10;
  const window = 60;

  const now = Date.now();
  const windowStart = now - window * 1000;

  // Lua script runs atomically in Redis — no race conditions
  const script = `
        local key = KEYS[1]
        local now = tonumber(ARGV[1])
        local window_start = tonumber(ARGV[2])
        local limit = tonumber(ARGV[3])
        local window = tonumber(ARGV[4])

        -- Remove timestamps older than our window
        redis.call('ZREMRANGEBYSCORE', key, 0, window_start)

        -- Count remaining requests in window
        local count = redis.call('ZCARD', key)

        -- Check if over limit
        if count >= limit then
        return 0
        end

        -- Add current timestamp
        redis.call('ZADD', key, now, now)

        -- Set expiry so Redis auto-cleans old keys
        redis.call('EXPIRE', key, window)

        return 1
    `;

  try {
    const allowed = await redis.eval(
      script,
      1,
      key,
      now,
      windowStart,
      limit,
      window,
    );

    if (allowed == 0) {
      return res.status(429).json({
        error: "Too many requests. Please wait a minute",
      });
    }

    next(); // allowed -> continue to route handler
  } catch (err) {
    console.error("Rate limiter error:", err.message);
    next(); // if Redis fails, don't block the user
  }
}
