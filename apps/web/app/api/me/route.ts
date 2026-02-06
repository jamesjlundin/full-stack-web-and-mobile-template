import { getCurrentUser } from '@acme/auth';
import { NextResponse } from 'next/server';

import { getAppConfig } from '../../../lib/appConfig';

export async function GET(request: Request) {
  const result = await getCurrentUser(request);

  if (result?.user) {
    const response = NextResponse.json(
      {
        user: {
          id: result.user.id,
          email: result.user.email,
          name: result.user.name,
          emailVerified: result.user.emailVerified,
        },
        config: getAppConfig(),
      },
      { status: 200 },
    );

    if (result.headers) {
      result.headers.forEach((value, key) => {
        response.headers.append(key, value);
      });
    }

    return response;
  }

  const status = result?.status ?? 401;
  const response = NextResponse.json({ error: 'unauthorized' }, { status });

  if (result?.headers) {
    result.headers.forEach((value, key) => {
      response.headers.append(key, value);
    });
  }

  return response;
}
