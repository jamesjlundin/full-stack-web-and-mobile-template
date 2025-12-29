import { authHandler } from '@acme/auth';
import { createRateLimiter } from '@acme/security';

import { withRateLimit } from '../../_lib/withRateLimit';

// Rate limiter: 5 requests per 60 seconds per IP
const authLimiter = createRateLimiter({
  limit: 5,
  windowMs: 60_000,
});

const routeId = '/api/auth';

export const DELETE = withRateLimit(routeId, authLimiter, authHandler.DELETE);
export const GET = withRateLimit(routeId, authLimiter, authHandler.GET);
export const PATCH = withRateLimit(routeId, authLimiter, authHandler.PATCH);
export const POST = withRateLimit(routeId, authLimiter, authHandler.POST);
export const PUT = withRateLimit(routeId, authLimiter, authHandler.PUT);
