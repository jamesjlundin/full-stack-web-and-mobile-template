# Test Templates

## Integration Test (API Endpoint)

```typescript
// packages/tests/src/{feature}.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { http, getTestToken } from './http';

describe('{Feature} API', () => {
  let token: string;

  beforeAll(async () => {
    token = await getTestToken();
  });

  describe('POST /api/{path}', () => {
    it('requires authentication', async () => {
      const response = await http.post('/api/{path}', {});
      expect(response.status).toBe(401);
    });

    it('validates request body', async () => {
      const response = await http.post(
        '/api/{path}',
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBeDefined();
    });

    it('succeeds with valid input', async () => {
      const response = await http.post(
        '/api/{path}',
        {
          field: 'valid value',
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
    });
  });

  describe('GET /api/{path}', () => {
    it('returns data for authenticated user', async () => {
      const response = await http.get('/api/{path}', {
        headers: { Authorization: `Bearer ${token}` },
      });
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty('data');
    });
  });
});
```

## Test with Database Setup

```typescript
// packages/tests/src/{feature}.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { http, getTestToken } from './http';
import { db, schema } from '@acme/db';
import { eq } from 'drizzle-orm';

describe('{Feature} with DB', () => {
  let token: string;
  let testItemId: string;

  beforeAll(async () => {
    token = await getTestToken();

    // Create test data
    const [item] = await db
      .insert(schema.items)
      .values({
        name: 'Test Item',
      })
      .returning();
    testItemId = item.id;
  });

  afterAll(async () => {
    // Clean up test data
    await db.delete(schema.items).where(eq(schema.items.id, testItemId));
  });

  it('fetches item by id', async () => {
    const response = await http.get(`/api/items/${testItemId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.data.name).toBe('Test Item');
  });
});
```

## Mobile Unit Test (Jest)

```typescript
// apps/mobile/__tests__/{Component}.test.tsx
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { ComponentName } from '../src/components/ComponentName';

describe('ComponentName', () => {
  it('renders correctly', () => {
    const { getByText } = render(<ComponentName />);
    expect(getByText('Expected Text')).toBeTruthy();
  });

  it('handles button press', async () => {
    const onPress = jest.fn();
    const { getByTestId } = render(<ComponentName onPress={onPress} />);

    fireEvent.press(getByTestId('button'));

    await waitFor(() => {
      expect(onPress).toHaveBeenCalledTimes(1);
    });
  });

  it('shows loading state', () => {
    const { getByTestId } = render(<ComponentName loading />);
    expect(getByTestId('loading-indicator')).toBeTruthy();
  });
});
```

## Auth Flow Test

```typescript
// packages/tests/src/auth.{flow}.test.ts
import { describe, it, expect } from 'vitest';
import { http } from './http';

describe('Auth Flow: {Flow Name}', () => {
  const testUser = {
    email: `test-${Date.now()}@example.com`,
    password: 'Test123!@#',
    name: 'Test User',
  };

  it('registers new user', async () => {
    const response = await http.post('/api/auth/sign-up/email', {
      email: testUser.email,
      password: testUser.password,
      name: testUser.name,
    });
    expect(response.status).toBe(200);
  });

  it('logs in with credentials', async () => {
    const response = await http.post('/api/auth/sign-in/email', {
      email: testUser.email,
      password: testUser.password,
    });
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.token).toBeDefined();
  });

  it('accesses protected route with token', async () => {
    const loginResponse = await http.post('/api/auth/sign-in/email', {
      email: testUser.email,
      password: testUser.password,
    });
    const { token } = await loginResponse.json();

    const meResponse = await http.get('/api/me', {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(meResponse.status).toBe(200);
  });
});
```

## Rate Limiting Test

```typescript
// packages/tests/src/ratelimit.{endpoint}.test.ts
import { describe, it, expect } from 'vitest';
import { http, getTestToken } from './http';

describe('Rate Limiting: /api/{path}', () => {
  it('enforces rate limit', async () => {
    const token = await getTestToken();
    const requests = [];

    // Make requests up to limit
    for (let i = 0; i < 15; i++) {
      requests.push(
        http.post(
          '/api/{path}',
          { data: i },
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        ),
      );
    }

    const responses = await Promise.all(requests);
    const statuses = responses.map((r) => r.status);

    // Some should succeed, some should be rate limited
    expect(statuses).toContain(200);
    expect(statuses).toContain(429);
  });
});
```

## Streaming Endpoint Test

```typescript
// packages/tests/src/stream.{feature}.test.ts
import { describe, it, expect } from 'vitest';
import { http, getTestToken } from './http';

describe('Streaming: /api/{path}', () => {
  it('returns SSE stream', async () => {
    const token = await getTestToken();

    const response = await http.post(
      '/api/{path}',
      {
        message: 'test',
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'text/event-stream',
        },
      },
    );

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('text/event-stream');

    const text = await response.text();
    expect(text).toContain('data:');
  });
});
```

## Test Commands

```bash
# Run all integration tests
pnpm test:integration

# Run specific test file
pnpm -C packages/tests vitest run src/{file}.test.ts

# Run tests in watch mode
pnpm -C packages/tests vitest src/{file}.test.ts

# Run mobile tests
pnpm -C apps/mobile test

# Run mobile tests in watch mode
pnpm -C apps/mobile test --watch
```
