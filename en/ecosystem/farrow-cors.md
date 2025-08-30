# farrow-cors

Provides Cross-Origin Resource Sharing (CORS) support for farrow-http.

## Overview

`farrow-cors` is a middleware package that provides CORS (Cross-Origin Resource Sharing) functionality for Farrow HTTP applications. It allows your API to be safely accessed by frontend applications from other domains.

## Features

- 🌐 **Flexible CORS Configuration** - Supports all standard CORS options
- 🔒 **Secure Defaults** - Security configuration out of the box
- 🎯 **Fine-grained Control** - Different CORS policies for different routes
- 🚀 **Zero Configuration** - Default configuration works for most scenarios

## Installation

::: code-group

```bash [npm]
npm install farrow-cors
```

```bash [yarn]
yarn add farrow-cors
```

```bash [pnpm]
pnpm add farrow-cors
```

:::

## Quick Start

### Basic Usage

Enable CORS for all routes:

```typescript
import { Http, Response } from 'farrow-http'
import { cors } from 'farrow-cors'

const app = Http()

// Enable CORS with default configuration
app.use(cors())

app.get('/api/data').use(() => {
  return Response.json({ 
    message: 'This endpoint is CORS-enabled for all origins!' 
  })
})

app.listen(3000, () => {
  console.log('CORS-enabled server listening on port 3000')
})
```

### Custom Configuration

Configure specific CORS options:

```typescript
import { cors } from 'farrow-cors'

// Configure CORS options
app.use(cors({
  origin: 'https://example.com',  // Allow specific domain
  credentials: true,               // Allow sending cookies
  methods: ['GET', 'POST'],       // Allowed HTTP methods
  allowedHeaders: ['Content-Type', 'Authorization']  // Allowed request headers
}))
```

## Configuration Options

`farrow-cors` supports the same configuration options as [expressjs/cors](https://github.com/expressjs/cors):

### origin

Configures the Access-Control-Allow-Origin CORS header.

```typescript
// Allow all origins (default)
cors({ origin: '*' })

// Allow single domain
cors({ origin: 'https://example.com' })

// Allow multiple domains
cors({ origin: ['https://example.com', 'https://app.example.com'] })

// Dynamic determination
cors({
  origin: (origin, callback) => {
    // Dynamically decide whether to allow based on origin
    if (allowedOrigins.includes(origin)) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  }
})

// Use regular expression
cors({ origin: /example\.com$/ })
```

### credentials

Configures the Access-Control-Allow-Credentials CORS header.

```typescript
// Allow sending credentials (cookies, authorization headers)
cors({ credentials: true })
```

### methods

Configures the Access-Control-Allow-Methods CORS header.

```typescript
// Default value
cors({ methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE'] })

// Custom methods
cors({ methods: ['GET', 'POST'] })
```

### allowedHeaders

Configures the Access-Control-Allow-Headers CORS header.

```typescript
// Allow all request headers (default)
cors({ allowedHeaders: '*' })

// Allow specific request headers
cors({ allowedHeaders: ['Content-Type', 'Authorization'] })

// Multiple request headers
cors({ 
  allowedHeaders: [
    'Content-Type',
    'Authorization', 
    'X-Requested-With',
    'X-Custom-Header'
  ]
})
```

### exposedHeaders

Configures the Access-Control-Expose-Headers CORS header.

```typescript
// Expose custom response headers to frontend
cors({ 
  exposedHeaders: [
    'X-Total-Count',
    'X-Page-Number',
    'X-Page-Size'
  ]
})
```

### maxAge

Configures the Access-Control-Max-Age CORS header.

```typescript
// Preflight request cache time (seconds)
cors({ maxAge: 86400 })  // 24 hours
```

### preflightContinue

Whether to pass CORS preflight response to the next handler.

```typescript
// Continue processing preflight requests
cors({ preflightContinue: true })
```

### optionsSuccessStatus

Success status code for OPTIONS requests.

```typescript
// Some older browsers need 200
cors({ optionsSuccessStatus: 200 })  // Default is 204
```

## Complete Examples

### Production Environment Configuration

```typescript
import { Http, Response } from 'farrow-http'
import { cors } from 'farrow-cors'
import { createContext } from 'farrow-pipeline'

const app = Http()

// Production environment CORS configuration
const corsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = [
      'https://app.example.com',
      'https://www.example.com',
      'https://admin.example.com'
    ]
    
    // Allow requests without origin (like Postman, server-side requests)
    if (!origin) return callback(null, true)
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'X-API-Key'
  ],
  exposedHeaders: [
    'X-Total-Count',
    'X-Page-Number',
    'X-Rate-Limit-Remaining'
  ],
  maxAge: 86400  // 24 hours
}

app.use(cors(corsOptions))

// API routes
app.get('/api/users').use(() => {
  return Response
    .json([
      { id: 1, name: 'Alice' },
      { id: 2, name: 'Bob' }
    ])
    .header('X-Total-Count', '2')
})

app.post('/api/login', {
  body: {
    email: String,
    password: String
  }
}).use((request) => {
  // Handle login
  const token = generateToken(request.body)
  
  return Response
    .json({ token })
    .cookie('session', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'none'  // Cross-domain cookies need this setting
    })
})

app.listen(3000)
```

### Development Environment Configuration

```typescript
import { cors } from 'farrow-cors'

// Development environment: allow all origins
if (process.env.NODE_ENV === 'development') {
  app.use(cors({
    origin: true,  // Allow all origins
    credentials: true
  }))
} else {
  // Production environment: strict control
  app.use(cors({
    origin: 'https://app.example.com',
    credentials: true
  }))
}
```

### Configure CORS for Specific Routes

```typescript
import { Router } from 'farrow-http'
import { cors } from 'farrow-cors'

const app = Http()

// Public API: allow all origins
const publicRouter = Router()
publicRouter.use(cors())
publicRouter.get('/data').use(() => {
  return Response.json({ public: true })
})

// Private API: restrict origins
const privateRouter = Router()
privateRouter.use(cors({
  origin: 'https://app.example.com',
  credentials: true
}))
privateRouter.get('/user').use(() => {
  return Response.json({ private: true })
})

// Mount routes
app.route('/api/public').use(publicRouter)
app.route('/api/private').use(privateRouter)
```

### Handling Preflight Requests

```typescript
import { cors } from 'farrow-cors'

const app = Http()

// Configure CORS, allow custom handling of preflight requests
app.use(cors({
  origin: 'https://example.com',
  preflightContinue: true  // Continue processing OPTIONS requests
}))

// Custom OPTIONS handling
app.options('/api/upload').use(() => {
  // Can add additional logic
  console.log('Preflight request for upload')
  
  return Response
    .empty()
    .header('X-Custom-Header', 'value')
})
```

## Common Issues

### 1. Why does the browser still report CORS errors?

Check the following points:

```typescript
// ✅ Ensure CORS middleware is before all routes
app.use(cors())  // Must be before route definitions
app.get('/api/data').use(handler)

// ❌ Error: CORS middleware after routes
app.get('/api/data').use(handler)
app.use(cors())  // Too late
```

### 2. Cookies cannot be sent cross-domain?

Need to correctly configure credentials and Cookie options:

```typescript
// Server side
app.use(cors({
  origin: 'https://frontend.com',
  credentials: true  // Must be set
}))

app.post('/login').use(() => {
  return Response
    .json({ success: true })
    .cookie('session', 'token', {
      httpOnly: true,
      secure: true,      // Required in HTTPS environment
      sameSite: 'none'   // Required for cross-domain
    })
})

// Client side
fetch('https://api.com/login', {
  method: 'POST',
  credentials: 'include',  // Must be set
  body: JSON.stringify(data)
})
```

### 3. Preflight request fails?

Ensure OPTIONS method is allowed:

```typescript
app.use(cors({
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],  // Include OPTIONS
  allowedHeaders: ['Content-Type', 'Authorization']
}))
```

### 4. Custom request headers are rejected?

Add to allowedHeaders:

```typescript
app.use(cors({
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Custom-Header',  // Add custom request header
    'X-API-Key'
  ]
}))
```

## Security Recommendations

### 1. Avoid Using Wildcards

```typescript
// ❌ Unsafe: allow all origins
app.use(cors({ origin: '*' }))

// ✅ Safe: specify specific origins
app.use(cors({ 
  origin: ['https://app.example.com', 'https://www.example.com']
}))
```

### 2. Validate Dynamic Origins

```typescript
// ✅ Validate origin
app.use(cors({
  origin: (origin, callback) => {
    // Validate origin format
    if (!origin || !isValidOrigin(origin)) {
      callback(new Error('Invalid origin'))
      return
    }
    
    // Check whitelist
    if (whitelist.includes(origin)) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed'))
    }
  }
}))
```

### 3. Limit Methods and Headers

```typescript
// ✅ Only allow necessary methods and headers
app.use(cors({
  methods: ['GET', 'POST'],  // Only allow needed methods
  allowedHeaders: ['Content-Type'],  // Only allow needed headers
  exposedHeaders: []  // Only expose necessary response headers
}))
```

### 4. Set Reasonable Cache Time

```typescript
// ✅ Balance performance and security
app.use(cors({
  maxAge: 3600  // 1 hour, don't set too long
}))
```

## Working with Other Middleware

### With Authentication Middleware

```typescript
import { cors } from 'farrow-cors'

// 1. CORS must be before authentication
app.use(cors({ 
  origin: 'https://app.example.com',
  credentials: true 
}))

// 2. Authentication middleware
app.use(authenticate)

// 3. Business routes
app.get('/api/protected').use(requireAuth)
```

### With Rate Limiting

```typescript
import { cors } from 'farrow-cors'
import { rateLimit } from 'farrow-rate-limit'

// Order matters
app.use(cors())         // 1. CORS
app.use(rateLimit())    // 2. Rate limiting
app.use(authenticate)   // 3. Authentication
```

## Debugging Tips

### View CORS Response Headers

```typescript
app.use((request, next) => {
  const response = next(request)
  
  // Print CORS-related response headers
  console.log('CORS Headers:', {
    'Access-Control-Allow-Origin': response.headers['access-control-allow-origin'],
    'Access-Control-Allow-Credentials': response.headers['access-control-allow-credentials'],
    'Access-Control-Allow-Methods': response.headers['access-control-allow-methods']
  })
  
  return response
})
```

### Test CORS Configuration

```bash
# Test preflight request
curl -X OPTIONS http://localhost:3000/api/data \
  -H "Origin: https://example.com" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type" \
  -v

# Test actual request
curl http://localhost:3000/api/data \
  -H "Origin: https://example.com" \
  -v
```

## Related Links

- [MDN CORS Documentation](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)
- [expressjs/cors](https://github.com/expressjs/cors) - Configuration options reference
- [farrow-http Documentation](/en/ecosystem/farrow-http)
- [GitHub](https://github.com/farrowjs/farrow)