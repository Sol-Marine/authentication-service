const clients = new Map();

export function rateLimiter({ windowMs = 15 * 60 * 1000, max = 100 } = {}) {
  return async (c, next) => {
    const ip =
      c.req.header("x-forwarded-for") ||
      c.req.header("x-real-ip") ||
      "127.0.0.1";

    const now = Date.now();
    const windowStart = now - windowMs;

    if (!clients.has(ip)) {
      clients.set(ip, []);
    }

    const timestamps = clients.get(ip).filter((t) => t > windowStart);
    clients.set(ip, timestamps);

    if (timestamps.length >= max) {
      return c.json(
        {
          success: false,
          message: "Too many requests. Please try again later.",
        },
        429
      );
    }

    timestamps.push(now);
    await next();
  };
}
