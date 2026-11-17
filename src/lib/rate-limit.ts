const WINDOW_MS = 60_000; // 1 menit
const MAX_REQUESTS = 5; // 5 request per menit per IP

const attempts = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(ip: string): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const record = attempts.get(ip);

  if (!record || now > record.resetAt) {
    attempts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return { allowed: true, remaining: MAX_REQUESTS - 1, resetAt: now + WINDOW_MS };
  }

  if (record.count >= MAX_REQUESTS) {
    return { allowed: false, remaining: 0, resetAt: record.resetAt };
  }

  record.count++;
  return { allowed: true, remaining: MAX_REQUESTS - record.count, resetAt: record.resetAt };
}

// Cleanup interval
setInterval(() => {
  const now = Date.now();
  attempts.forEach((record, ip) => {
    if (now > record.resetAt) attempts.delete(ip);
  });
}, WINDOW_MS);