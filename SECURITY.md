# Security Measures

This document outlines the security measures implemented in the Perplexity Clone application.

## API Key Security

### Server-Side Only
- All API keys (Exa and Mistral) are stored in environment variables
- API keys are only accessed in server-side code (`lib/exa-client.ts`, `lib/mistral-client.ts`)
- API routes run on the server, never exposing credentials to the client
- Next.js automatically excludes server-side environment variables from the client bundle

### Environment Variable Protection
- `.env.local` and `.env` files are in `.gitignore` to prevent accidental commits
- `.env.local.example` provides a template without actual credentials
- Environment variables are validated at build time in `next.config.ts`

### Verification
To verify API keys are not in the client bundle:
1. Build the application: `npm run build`
2. Check `.next/static/` - no environment variables should appear
3. Inspect browser Network tab - no API keys in responses

## Input Sanitization (XSS Prevention)

### Implementation
- `lib/input-sanitizer.ts` provides sanitization utilities
- All user input is sanitized before processing
- HTML tags and script patterns are removed
- Dangerous patterns (javascript:, on*= handlers) are filtered

### Functions
- `sanitizeInput()`: Removes dangerous characters and patterns
- `isInputSafe()`: Validates input doesn't contain XSS patterns
- `escapeHtml()`: Escapes HTML special characters for display

### Usage
```typescript
import { sanitizeInput, isInputSafe } from '@/lib/input-sanitizer';

// Validate input
if (!isInputSafe(userInput)) {
  throw new Error('Invalid input');
}

// Sanitize before processing
const clean = sanitizeInput(userInput);
```

## CORS Configuration

### Headers
CORS headers are configured in `next.config.ts`:
- `Access-Control-Allow-Origin`: Configurable via `ALLOWED_ORIGIN` env var
- `Access-Control-Allow-Methods`: POST, OPTIONS only
- `Access-Control-Allow-Headers`: Content-Type, Authorization
- Preflight requests handled via OPTIONS endpoint

### Production Configuration
Set `ALLOWED_ORIGIN` environment variable to your production domain:
```bash
ALLOWED_ORIGIN=https://yourdomain.com
```

For development, it defaults to `*` (all origins).

## Security Headers

The following security headers are configured in `next.config.ts`:

### Content Security
- `X-Content-Type-Options: nosniff` - Prevents MIME type sniffing
- `X-Frame-Options: SAMEORIGIN` - Prevents clickjacking
- `X-XSS-Protection: 1; mode=block` - Enables browser XSS protection

### Transport Security
- `Strict-Transport-Security` - Forces HTTPS connections
- `Referrer-Policy: origin-when-cross-origin` - Controls referrer information

### Permissions
- `Permissions-Policy` - Restricts access to camera, microphone, geolocation

## Additional Security Measures

### Request Validation
- Query validation prevents empty/invalid submissions
- JSON parsing errors are caught and handled gracefully
- Type checking ensures data integrity

### Error Handling
- Technical error details are never exposed to users
- Stack traces are logged server-side only
- User-friendly error messages prevent information leakage

### Rate Limiting
- API errors (429) are handled gracefully
- Users are informed to wait before retrying
- Consider adding rate limiting middleware for production

## Security Checklist

- [x] API keys stored in environment variables only
- [x] Environment files in `.gitignore`
- [x] Input sanitization implemented
- [x] XSS prevention measures in place
- [x] CORS configured properly
- [x] Security headers configured
- [x] No credentials in client bundle
- [x] Error messages don't leak sensitive info
- [x] HTTPS enforced in production (via headers)

## Recommendations for Production

1. **Set ALLOWED_ORIGIN**: Configure specific domain instead of wildcard
2. **Enable Rate Limiting**: Add rate limiting middleware to API routes
3. **Use HTTPS**: Ensure SSL/TLS certificates are properly configured
4. **Monitor Logs**: Set up logging and monitoring for security events
5. **Regular Updates**: Keep dependencies updated for security patches
6. **API Key Rotation**: Regularly rotate API keys
7. **Content Security Policy**: Consider adding CSP headers for additional protection

## Reporting Security Issues

If you discover a security vulnerability, please email security@yourdomain.com instead of using the issue tracker.
