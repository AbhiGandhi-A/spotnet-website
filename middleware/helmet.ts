import { IncomingMessage, ServerResponse } from 'http';

// Helmet security headers middleware (stub)
export function helmet(req: IncomingMessage, res: ServerResponse, next: () => void) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
}
