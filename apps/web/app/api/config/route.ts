import { NextResponse } from 'next/server';

import { getAppConfig } from '../../../lib/appConfig';

/**
 * Public configuration endpoint.
 * Exposes non-sensitive app configuration to frontend clients.
 */
export async function GET() {
  return NextResponse.json(getAppConfig());
}
