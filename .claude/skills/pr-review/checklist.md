# PR Review Checklist

## Security

- [ ] No hardcoded secrets, API keys, or credentials
- [ ] Authentication check on protected endpoints (`getCurrentUser()`)
- [ ] Authorization verified (user can access resource)
- [ ] Input validated with Zod schemas
- [ ] No SQL injection vulnerabilities (using Drizzle ORM)
- [ ] No XSS vulnerabilities (React auto-escapes)
- [ ] Rate limiting applied to user-facing endpoints
- [ ] No sensitive data in logs or error messages

## API Endpoints

- [ ] Correct HTTP method for action (GET=read, POST=create, PUT=update, DELETE=remove)
- [ ] Authentication required for protected routes
- [ ] Rate limiting configured appropriately
- [ ] Request body validated
- [ ] Proper error responses (400, 401, 403, 404, 429, 500)
- [ ] No internal errors exposed to client
- [ ] Response schema matches TypeScript types

## Database Changes

- [ ] Migration generated (not manual SQL)
- [ ] Migration reviewed for data safety
- [ ] No `DROP` without explicit confirmation
- [ ] Indexes added for frequently queried columns
- [ ] Foreign keys have appropriate `onDelete` behavior
- [ ] Nullable vs required columns considered
- [ ] Default values set where appropriate

## Code Quality

- [ ] TypeScript strict mode satisfied
- [ ] No `any` types without justification
- [ ] No unused imports or variables
- [ ] Functions have clear single responsibility
- [ ] Error handling is appropriate
- [ ] No console.log (use proper logging)
- [ ] Comments explain "why" not "what"

## Testing

- [ ] New functionality has tests
- [ ] Edge cases covered
- [ ] Error cases tested
- [ ] Integration tests for API endpoints
- [ ] All existing tests pass

## Patterns

- [ ] Follows existing code patterns in the package
- [ ] Uses workspace packages (`@acme/*`) for shared code
- [ ] Configuration via environment variables
- [ ] Consistent naming conventions

## Mobile (if applicable)

- [ ] Works on both iOS and Android
- [ ] Secure token storage using Keychain
- [ ] Deep links handled correctly
- [ ] No platform-specific code without fallback

## Performance

- [ ] No N+1 database queries
- [ ] Large datasets paginated
- [ ] Heavy computations not in request path
- [ ] Images optimized and lazy-loaded
- [ ] No unnecessary re-renders (React)

## Accessibility

- [ ] Semantic HTML elements used
- [ ] ARIA labels where needed
- [ ] Keyboard navigation works
- [ ] Color contrast sufficient

## Documentation

- [ ] README updated if needed
- [ ] API changes documented
- [ ] Breaking changes noted
- [ ] Complex logic commented
