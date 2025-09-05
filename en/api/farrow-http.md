# Farrow HTTP API Reference

## Overview

Farrow HTTP is a TypeScript-first Web framework that provides type-safe routing and automatic validation features. Built on the farrow-pipeline middleware system and farrow-schema validation system, it offers powerful functionality with an excellent developer experience.

## Quick Navigation

### Getting Started
- [Installation and Quick Start](#installation-and-quick-start) - Get started in 5 minutes
- [Basic Examples](#basic-examples) - Common code templates

### Core API
- [Server Creation](#server-creation) - Http(), Https(), configuration options
- [Route Definition](#route-definition) - get(), post(), match() etc.
- [Response Construction](#response-construction) - Response objects and methods
- [Middleware](#middleware) - use(), onion model, error handling

### Advanced Features  
- [Router System](#router-system) - Router(), route(), modular
- [Context Management](#context-management) - Context, hooks, request isolation
- [Static Files](#static-files) - serve(), security protection
- [Testing Support](#testing) - Test configuration and examples

### Reference
- [API Quick Reference](#api-quick-reference) - Quick lookup for common methods  
- [Complete Examples](#complete-examples) - Production-ready application code

## Installation and Quick Start

### Installation

```bash
npm install farrow-http farrow-schema farrow-pipeline
```

### 30-Second Quick Start

```typescript
import { Http, Response } from 'farrow-http'

const app = Http()
app.get('/hello').use(() => Response.json({ message: 'Hello Farrow!' }))
app.listen(3000)
```

### Important Note: Automatic Async Context Enablement

**farrow-http framework automatically enables async context tracking**. When you create an `Http()` or `Https()` instance, the framework automatically calls `asyncTracerImpl.enable()` to ensure Context is properly passed through async operations.

```typescript
import { Http } from 'farrow-http'

// Framework automatically enables async tracking, no manual setup needed
const app = Http()  // Internally executes asyncTracerImpl.enable()
```

**This means:**
- ✅ **No Manual Configuration** - No need to manually import and call `asyncTracerImpl.enable()`
- ✅ **Context Auto-propagation** - Context automatically propagates through `async/await`, `Promise`, `setTimeout` and other async operations
- ✅ **Request-level Isolation** - Each HTTP request has its own isolated Context, preventing state pollution between concurrent requests

If you need to use pure farrow-pipeline environment (without farrow-http), manual enablement is required:

```typescript
import * as asyncTracerImpl from 'farrow-pipeline/asyncTracerImpl.node'

// Only needed in pure farrow-pipeline environments
asyncTracerImpl.enable()
```

### Basic Examples

#### 1. Simple API Server
```typescript
import { Http, Response } from 'farrow-http'

const app = Http()

// Basic routes
app.get('/').use(() => Response.json({ message: 'API server running' }))
app.get('/health').use(() => Response.json({ status: 'ok' }))

app.listen(3000, () => console.log('Server started at http://localhost:3000'))
```

#### 2. Routes with Type Validation
```typescript
import { Http, Response } from 'farrow-http'
import { ObjectType, String, Int } from 'farrow-schema'

const app = Http()

// Path parameters with automatic validation and type inference
app.get('/user/<id:int>').use((req) => {
  const userId = req.params.id  // Type: number
  return Response.json({ id: userId, name: `User${userId}` })
})

// Query parameter validation
app.get('/search?<q:string>&<page?:int>').use((req) => {
  const { q, page = 1 } = req.query
  return Response.json({ 
    query: q,      // Type: string
    page,          // Type: number
    results: []
  })
})

app.listen(3000)
```

#### 3. Request Body Validation
```typescript
import { Http, Response } from 'farrow-http'
import { ObjectType, String, Int, Optional } from 'farrow-schema'

class CreateUserInput extends ObjectType {
  name = String
  email = String  
  age = Optional(Int)
}

const app = Http()

app.post('/users', { body: CreateUserInput }).use((req) => {
  // req.body is already validated and type-safe
  const { name, email, age } = req.body
  const user = { id: Date.now(), name, email, age }
  return Response.status(201).json(user)
})

app.listen(3000)
```

#### 4. Middleware and Error Handling
```typescript
import { Http, Response, HttpError } from 'farrow-http'

const app = Http({ logger: true })

// Global authentication middleware
app.use((req, next) => {
  const token = req.headers?.authorization
  if (req.pathname.startsWith('/protected') && !token) {
    throw new HttpError('Authorization required', 401)
  }
  return next(req)
})

// Protected routes
app.get('/protected/profile').use(() => {
  return Response.json({ user: 'profile data' })
})

// Global error handling
app.use(async (req, next) => {
  try {
    return await next(req)
  } catch (error) {
    return Response.status(error.statusCode || 500).json({
      error: error.message
    })
  }
})

app.listen(3000)
```

---

## Server Creation

### `Http(options?: HttpPipelineOptions): HttpPipeline`

Creates an HTTP server instance with comprehensive configuration options.

```typescript
type HttpPipelineOptions = {
  basenames?: string[]          // Base paths
  body?: BodyOptions           // Request body parsing options
  cookie?: CookieParseOptions  // Cookie parsing options
  query?: IParseOptions        // Query parameter parsing options
  contexts?: (params: { req: IncomingMessage; requestInfo: RequestInfo; basename:string }) => ContextStorage // Context injection function
  logger?: boolean | {
    transporter?: (str: string) => void
    ignoreIntrospectionRequestOfFarrowApi?: boolean // Whether to ignore farrow-api introspection request logs, defaults to true
  }
  errorStack?: boolean         // Whether to show error stack trace
}
```

**Complete Configuration Example:**
```typescript
const app = Http({
  basenames: ['/api/v1'], // Optional base path
  logger: true,           // Enable logging
  body: {
    limit: '10mb',        // Request body size limit
    encoding: 'utf8'      // Default encoding
  },
  cookie: {
    decode: decodeURIComponent,  // Cookie value decoder
    maxAge: 86400000,           // Default max age (24 hours)
    httpOnly: true,             // Default httpOnly setting
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax'             // CSRF protection
  },
  query: {
    depth: 5,            // Maximum nesting depth for query objects
    arrayLimit: 100,     // Maximum array length in query parameters
    delimiter: '&',      // Query parameter delimiter
    allowDots: true,     // Allow dot notation: ?user.name=value
    parseArrays: true    // Parse array syntax: ?tags[0]=a&tags[1]=b
  },
  errorStack: process.env.NODE_ENV === 'development'
})
```

### Server Methods

#### `listen(port: number, callback?: () => void)`

Starts the server and listens on the specified port.

```typescript
app.listen(3000)
app.listen(3000, () => console.log('Server started on port 3000'))
```

#### `server()`

Gets the Node.js HTTP server instance (required for testing).

```typescript
const server = app.server()  // Returns http.Server instance
```

### BodyOptions

Request body parsing options (based on co-body library):

```typescript
type BodyOptions = {
  limit?: string | number          // Size limit, e.g. '1mb', '10kb' or 1024000
  encoding?: BufferEncoding        // Character encoding, default 'utf8'
  length?: number                  // Content length
  strict?: boolean                 // JSON strict mode, default true
  queryString?: object             // Query string parsing options
  jsonTypes?: string[]             // JSON content-type list
  formTypes?: string[]             // Form content-type list
  textTypes?: string[]             // Text content-type list
}
```

---

## HTTPS Server

### `Https(options?: HttpsPipelineOptions): HttpPipeline`

Creates an HTTPS server with TLS/SSL configuration.

```typescript
import { Https } from 'farrow-http'
import fs from 'fs'

const app = Https({
  tls: {
    key: fs.readFileSync('private-key.pem'),
    cert: fs.readFileSync('certificate.pem')
  },
  // ... other HttpPipelineOptions
})

app.listen(443)
```

---

## Route Definition

### HTTP Method Routes

```typescript
// GET request
http.get('/users', () => Response.json({ users: [] }))

// POST request with body validation
http.post('/users', { body: UserSchema }).use((req) => {
  return Response.status(201).json(req.body)
})

// PUT request with path parameters and body
http.put('/users/<id:int>', { body: UpdateUserSchema }).use((req) => {
  return Response.json({ id: req.params.id, ...req.body })
})

// PATCH request
http.patch('/users/<id:int>/email', {
  body: { email: String }
}).use((req) => {
  return Response.json({ id: req.params.id, email: req.body.email })
})

// DELETE request
http.delete('/users/<id:int>', (req) => {
  return Response.status(204).empty()
})

// HEAD request
http.head('/users', () => Response.status(200).empty())

// OPTIONS request
http.options('/users', () => {
  return Response
    .header('Allow', 'GET, POST, PUT, DELETE')
    .status(200)
    .empty()
})

// Match all methods
http.all('/catch-all', (req) => {
  return Response.json({ method: req.method })
})
```

### Advanced Route Matching

```typescript
// Custom matching with blocking options
http.match({
  url: '/api/users/<id:int>',
  method: 'GET'
}, {
  block: true,  // If this route doesn't match, stop here (return 404)
  onSchemaError: (error, input, next) => {
    return Response.status(400).json({
      error: 'Validation failed',
      details: error.message,
      field: error.path?.join('.')
    })
  }
}).use((request) => {
  return Response.json({ userId: request.params.id })
})
```

---

### Route Patterns and Automatic Validation

#### Parameter Types (Automatic Validation)

Farrow HTTP provides powerful automatic validation based on URL patterns:

```typescript
// Path parameters - automatic validation and typing
app.get('/post/<id:int>').use((req) => {
  req.params.id  // Type: number, validated as integer
})

app.get('/user/<name:string>').use((req) => {
  req.params.name  // Type: string
})

app.get('/price/<value:float>').use((req) => {
  req.params.value  // Type: number, validated as float
})

app.get('/active/<flag:boolean>').use((req) => {
  req.params.flag  // Type: boolean
})

app.get('/user/<userId:id>').use((req) => {
  req.params.userId  // Type: string, validated as non-empty identifier
})

// Union types in paths
app.get('/posts/<status:draft|published|archived>').use((req) => {
  req.params.status  // Type: 'draft' | 'published' | 'archived'
})

// Literal types with braces (exact string matching)
app.get('/api/<version:{v1}|{v2}>').use((req) => {
  req.params.version  // Type: 'v1' | 'v2'
})

// Array parameters with modifiers
app.get('/tags/<tags+:string>').use((req) => {
  req.params.tags  // Type: string[] (one or more)
})

app.get('/categories/<cats*:string>').use((req) => {
  req.params.cats  // Type: string[] | undefined (zero or more)
})

// Optional parameters
app.get('/user/<name?:string>').use((req) => {
  req.params.name  // Type: string | undefined (optional)
})

// Parameter modifiers summary:
// <param:type>   - Required parameter
// <param?:type>  - Optional parameter (type | undefined)
// <param+:type>  - One or more (type[])
// <param*:type>  - Zero or more (type[] | undefined)
```

### Query Parameters with Automatic Validation

```typescript
// Path parameters + query parameters with automatic validation and type inference
http.get('/<category:string>?<search:string>&<page?:int>').use((req) => {
  // req.params.category is string (required, from path)
  // req.query.search is string (required, from query)
  // req.query.page is number | undefined (optional)
  const { category } = req.params  // Automatically validated as string
  const { search, page = 1 } = req.query  // Automatically validated
  return Response.json({ category, search, page })
})

// Literal values in query (exact matching)
http.get('/products?<sort:asc|desc>&status=active').use((req) => {
  // req.query.sort is 'asc' | 'desc' (union type)
  // req.query.status is 'active' (literal string)
  return Response.json({
    sort: req.query.sort,     // Type: 'asc' | 'desc'
    status: req.query.status   // Type: 'active' (literal)
  })
})

// Complex query example
http.get('/search?<q:string>&<tags*:string>&<author?:int>&<limit?:int>').use((req) => {
  const { q, tags, author, limit = 10 } = req.query
  // q: string (required)
  // tags: string[] | undefined (zero or more)
  // author: number | undefined (optional)
  // limit: number | undefined (optional, with default)
  
  return Response.json({
    query: q,
    tags: tags || [],
    authorId: author,
    limit,
    results: []
  })
})
```

### Request Body with Schema

```typescript
import { ObjectType, String, Int, List, Optional } from 'farrow-schema'

class CreateUserInput extends ObjectType {
  name = String
  email = String
  age = Optional(Int)
}

class UpdateUserInput extends ObjectType {
  name = Optional(String)
  email = Optional(String)
  age = Optional(Int)
}

// POST request with body schema and validation error handling
http.post('/users', {
  body: CreateUserInput
}, {
  onSchemaError: (error, input, next) => {
    // error.message - validation error message
    // error.path - field path, e.g. ['body', 'email']
    // error.value - invalid value
    // input - request object (RequestInfo)
    // next - continue to next middleware
    
    return Response.status(400).json({
      error: 'Validation failed',
      field: error.path?.join('.'),
      message: error.message,
      received: error.value
    })
  }
}).use((req) => {
  const { name, email, age } = req.body
  const user = { id: 1, name, email, age }
  return Response.json(user)
})
```

### Advanced Schema Matching

```typescript
type RouterPipeline['match']=<U extends string, T extends RouterUrlSchema<U>>(
    schema: T,
    options?: MatchOptions,
  ): AsyncPipeline<TypeOfUrlSchema<T>, Response>

type RouterUrlSchema = {
  url: string                         // URL pattern (supports template literal types)
  method?: string | string[]          // HTTP methods
  body?: Schema.FieldDescriptor       // Request body validation
  headers?: RouterSchemaDescriptor    // Request headers validation
  cookies?: RouterSchemaDescriptor    // Cookie validation
}

type MatchOptions = {
  block?: boolean                     // Whether to block non-matching requests, defaults to false
  onSchemaError?(                     // Validation error handler
    error: ValidationError,
    input: RequestInfo,
    next: Next<RequestInfo, MaybeAsyncResponse>
  ): MaybeAsyncResponse | void
}

// Complex validation using detailed Schema
app.match({
  url: '/api/users/<id:int>?<expand?:string>',
  method: ['GET', 'PUT'],
  body: { name: String, email: String },
  headers: { authorization: String }
}, {
  block: true,  // Block mode: return error directly on validation failure
  onSchemaError: (error, input, next) => {
    console.log('Error path:', error.path)     // ['body', 'profile', 'email']
    console.log('User input:', error.value)    // User's actual input value
    console.log('Error message:', error.message)  // Detailed error description
    
    return Response.status(400).json({
      error: 'Data validation failed',
      field: error.path?.join('.'),         // 'body.profile.email'
      message: error.message,
      received: error.value,
      hint: 'Please check if the input format is correct'
    })
  }
}).use((req) => {
  // req.body is already validated and type-safe
  const { id } = req.params      // number
  const { expand } = req.query   // string | undefined
  const { name, email } = req.body
  return Response.json({ id, name, email })
})
```

### ValidationError

Validation error type definition:

```typescript
type ValidationError = {
  message: string                     // Error description
  path?: (string | number)[]          // Error field path
  value?: any                         // Value that caused the error
  schema?: any                        // Related Schema definition
}
```

---

## Response Construction

### JSON Response

```typescript
// Simple JSON
Response.json({ message: 'Hello' })

// With status code
Response.status(201).json({ id: 1 })

// With headers
Response.header('X-Total-Count', '100').json({ items: [] })

// Chaining multiple
Response
  .status(200)
  .header('Cache-Control', 'max-age=3600')
  .header('X-API-Version', '1.0')
  .json({ data: [] })
```

### Text Response

```typescript
Response.text('Plain text response')
Response.status(404).text('Not found')
```

### HTML Response

```typescript
Response.html('<h1>Hello World</h1>')
Response.status(200).html(`
  <!DOCTYPE html>
  <html>
    <body><h1>Welcome</h1></body>
  </html>
`)
```

### File Response

Creates file responses with support for streaming and range requests.

```typescript
// Basic file response
Response.file('./uploads/document.pdf')

// With content type
Response.file('./images/logo.png', 'image/png')

// With stream control options
Response.file('./large-file.zip', {
  start: 0,
  end: 1024 * 1024 - 1,  // Only read first 1MB
  highWaterMark: 1024 * 1024  // 1MB buffer size
})

// Combined with attachment for downloads
Response.file('./report.pdf')
  .attachment('monthly-report.pdf')
  .header('Cache-Control', 'private, max-age=3600')
```

### Stream Response

```typescript
import { Readable } from 'stream'

const stream = Readable.from(['Hello', ' ', 'World'])
Response.stream(stream)
```

### Redirect Response

```typescript
Response.redirect('/login')
Response.redirect('https://example.com')
Response.redirect('/path', { usePrefix: false })  // Don't use route prefix

// In nested routes - usePrefix behavior
const apiRouter = app.route('/api')
apiRouter.use(() => {
  return Response.redirect('/users')           // Redirects to /api/users
})
apiRouter.use(() => {
  return Response.redirect('/users', { usePrefix: false })  // Redirects to /users
})
```

### Empty Response

```typescript
Response.status(204).empty()
```

### Custom Response

Creates custom responses for direct Node.js response operations.

```typescript
Response.custom(({ req, res, requestInfo, responseInfo }) => {
  // req: IncomingMessage - Node.js request object
  // res: ServerResponse - Node.js response object
  // requestInfo: RequestInfo - Farrow request information
  // responseInfo: Omit<ResponseInfo, "body"> - Farrow response info without body
  
  res.statusCode = 200
  res.setHeader('Content-Type', 'application/octet-stream')
  res.end(Buffer.from('binary data'))
})

// Server-Sent Events (SSE) example
Response.custom(({ req, res }) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  })
  
  const sendEvent = (data: any) => {
    res.write(`data: ${JSON.stringify(data)}

`)
  }
  
  sendEvent({ message: 'Connected' })
  
  const interval = setInterval(() => {
    sendEvent({ timestamp: Date.now() })
  }, 1000)
  
  req.on('close', () => clearInterval(interval))
})
```

### Response Methods (Chainable)

```typescript
// Status and headers
Response.status(code: number, message?: string): Response
Response.header(name: string, value: string): Response
Response.headers(object: Record<string, string>): Response
Response.type(contentType: string): Response
Response.vary(field: string): Response

// Cookies
Response.cookie(name: string, value: string, options?: CookieOptions): Response
Response.cookies(object: Record<string, string>, options?: CookieOptions): Response

// Unicode-supporting attachments
Response.attachment(filename?: string, options?: AttachmentOptions): Response

type AttachmentOptions = {
  type?: 'attachment' | 'inline'  // Attachment type
  fallback?: string              // Fallback filename
}

type CookieOptions = {
  domain?: string                           // Cookie domain
  encode?: (val: string) => string         // Encoding function
  expires?: Date                           // Expiration date
  httpOnly?: boolean                       // HTTP-only access
  maxAge?: number                          // Maximum lifetime (milliseconds)
  path?: string                            // Cookie path
  priority?: 'low' | 'medium' | 'high'     // Priority
  sameSite?: boolean | 'lax' | 'strict' | 'none'  // SameSite policy
  secure?: boolean                         // Requires HTTPS
  signed?: boolean                         // Signed cookie
}

type FileBodyOptions = {
  flags?: string                    // File open flags
  encoding?: BufferEncoding         // Character encoding
  fd?: number                      // File descriptor
  mode?: number                    // File mode
  autoClose?: boolean              // Auto close
  emitClose?: boolean              // Emit close event
  start?: number                   // Read start position
  end?: number                     // Read end position
  highWaterMark?: number           // Buffer size
}

// File attachment examples
Response.file('./document.pdf').attachment('monthly-report.pdf')

// Chinese filename with fallback
Response.file('./数据报告.xlsx').attachment('数据报告.xlsx', {
  fallback: 'data-report.xlsx'  // Compatible with older browsers
})

// Inline display (open in browser instead of download)
Response.file('./document.pdf').attachment('document.pdf', {
  type: 'inline'
})
```

### Response Type Checking

```typescript
// Response.is() checks response content type
const response = Response.json({ data: 'test' })
response.is('json')        // Returns: 'json'
response.is('html')        // Returns: false
response.is('json', 'xml') // Returns: 'json' (first match)

const htmlResponse = Response.html('<h1>Hello</h1>')
htmlResponse.is('html')    // Returns: 'html'
htmlResponse.is('text', 'html') // Returns matching type or false
```

### Response Merging

```typescript
// Important: Response.merge follows "last wins" principle
// Response = createResponse(empty()) by default

// ✅ Correct: empty body + JSON body = JSON body
const baseResponse = Response.headers({
  'X-API-Version': 'v1',
  'X-Request-ID': requestId
})  // Keeps empty body

const dataResponse = Response.json({ users: [] })
return baseResponse.merge(dataResponse)
// Result: Has JSON body and all headers

// Wrong order: JSON body overwritten by empty body
const result = Response.json({ users: [] }).merge(Response.header('X-Version', 'v1'))
// Result: Only empty body and headers, JSON data lost!

// Correct order: empty body overwritten by JSON body
const result = Response.header('X-Version', 'v1').merge(Response.json({ users: [] }))
// Result: Has JSON body and headers

// Best practice: Use method chaining to avoid merge issues
const result = Response.json({ users: [] }).header('X-Version', 'v1')
// Result: Has JSON body and headers, no need to worry about order
```

**Important Note**: When using `merge()`, the last response's body **completely overwrites** previous bodies. For body + headers/cookies, always use method chaining or ensure the body is the last item in the merge.

---

## Router System

Routers provide modular route management with support for composition and nesting.

### `Router(): RouterPipeline`

Creates an independent router instance.

```typescript
import { Router } from 'farrow-http'

const userRouter = Router()
const apiRouter = Router()

// Routers can be used independently
userRouter.get('/profile').use(() => Response.json({ user: 'profile' }))
userRouter.post('/update').use(() => Response.json({ success: true }))

// Mount routers to the application
app.use(userRouter)
app.route('/api').use(apiRouter)
```

### Router Methods

#### `route(name: string): Pipeline<RequestInfo, MaybeAsyncResponse>`

Creates sub-routes with support for unlimited nesting.

```typescript
const app = Http({ basenames: ['/api'] })

// Create nested routes
const v1Router = app.route('/v1')        // Path prefix: /api/v1
const userRouter = v1Router.route('/users')  // Path prefix: /api/v1/users
const adminRouter = userRouter.route('/admin') // Path prefix: /api/v1/users/admin

// Each router has full functionality
userRouter.get('/').use(() => Response.json(users))           // GET /api/v1/users
userRouter.get('/<id:int>').use(() => Response.json(user))   // GET /api/v1/users/123
adminRouter.get('/stats').use(() => Response.json(stats))    // GET /api/v1/users/admin/stats

// Routers can have their own middleware
userRouter.use(authMiddleware)
adminRouter.use(adminMiddleware)
```

#### `serve(name: string, dirname: string): void`

Provides static file serving with built-in security protections.

```typescript
// Basic static file serving
app.serve('/static', './public')
app.serve('/uploads', './storage/uploads')

// Built-in security features:
// - Automatic directory traversal attack prevention (path normalization)
// - Automatic file permission checking (using fs.stat to verify access)
// - Serves index.html for directory requests (e.g., /static/ → ./public/index.html)
// - Gracefully passes to next middleware if file not found or inaccessible
// - Secure path handling across all platforms

// Examples:
// /static/style.css → ./public/style.css
// /static/ → ./public/index.html (if exists)
// /static/docs/ → ./public/docs/index.html (if exists)
// /uploads/../secret → blocked (directory traversal protection)
```

---

## Middleware

Middleware uses the onion execution model and must return Response objects.

### Middleware Execution Model

Middleware follows the onion model, where each middleware can execute code before and after request processing:

```typescript
app.use((req, next) => {
  console.log('1: Enter')
  const result = next(req)  // Call next middleware
  console.log('4: Exit')
  return result
})

app.use((req, next) => {
  console.log('2: Enter')
  const result = next(req)
  console.log('3: Exit')
  return result
})

// Execution order: 1 -> 2 -> 3 -> 4
```

**Important Principles:**
- Middleware **must return Response objects**
- Call `next(req)` to continue to subsequent middleware
- Not calling `next()` will interrupt the execution chain
- Supports mixing synchronous and asynchronous middleware

### Middleware Execution Order in Nested Routers

Middleware in nested routers executes in definition order:

```typescript
// Parent router middleware is inherited by child routers
const apiRouter = app.route('/api')
apiRouter.use(corsMiddleware)     // All API routes have CORS
apiRouter.use(rateLimitMiddleware) // All API routes have rate limiting

const v1Router = apiRouter.route('/v1')
v1Router.use(authMiddleware)      // v1 routes require authentication

const userRouter = v1Router.route('/users')
userRouter.use(userValidationMiddleware)     // User routes have additional validation

// Request to /api/v1/users will go through:
// 1. corsMiddleware
// 2. rateLimitMiddleware  
// 3. authMiddleware
// 4. userValidationMiddleware
// 5. Final handler
```

### Basic Middleware

```typescript
// Route-specific middleware
http.get('/protected')
  .use(async (req, next) => {
    const token = req.headers.authorization
    if (!token) {
      return Response.status(401).json({ error: 'Unauthorized' })
    }
    return next(req)
  })
  .use((req) => {
    return Response.json({ message: 'Protected content' })
  })
```

### Global Middleware

```typescript
// Apply to all routes
http.use(async (req, next) => {
  console.log(`${req.method} ${req.pathname}`)
  const start = Date.now()
  const response = await next(req)
  console.log(`Took ${Date.now() - start}ms`)
  return response
})
```

### Asynchronous Middleware

```typescript
app.use(async (req, next) => {
  const user = await authenticateUser(req)
  UserContext.set(user)
  return next(req)
})

// Handle async responses
app.use(async (req, next) => {
  const response = await next(req)
  return response.header('X-Processed-At', Date.now().toString())
})
```

### Error Handling Middleware

```typescript
import { HttpError } from 'farrow-http'

// Throw HTTP errors
http.get('/error', () => {
  throw new HttpError('Resource not found', 404)
})

// Global error handler
http.use(async (req, next) => {
  try {
    return await next(req)
  } catch (error) {
    if (error instanceof HttpError) {
      return Response.status(error.statusCode).json({
        error: error.message 
      })
    }
    return Response.status(500).json({
      error: 'Internal server error'
    })
  }
})
```

### Middleware Types

Middleware function TypeScript type definitions:

```typescript
type HttpMiddleware = (
  request: RequestInfo, 
  next: Next<RequestInfo, MaybeAsyncResponse>
) => MaybeAsyncResponse

type Next<I, O> = (input?: I) => O
type MaybeAsyncResponse = Response | Promise<Response>
```

---

## Context Management

**Request Isolation**: farrow-http automatically enables Node.js async hooks (AsyncLocalStorage) to provide request-level isolation. Each HTTP request runs in its own container, ensuring context values never leak between requests.

```typescript
import { createContext } from 'farrow-pipeline'
import { Http, Response } from 'farrow-http'

// createContext<T>(defaultValue: T): Context<T>
// Creates a new context instance, type-safe and request-isolated

// Define contexts with default values
const AuthContext = createContext<{ userId: string } | null>(null)
const DBContext = createContext<any | null>(null)
const RequestIdContext = createContext<string>('')

// Context<T> interface methods
type Context<T> = {
  get(): T                    // Get current value
  set(value: T): void         // Set new value  
  assert(): NonNullable<T>    // Assert non-null and return value (throws if null)
  create(value: T): Context<T> // Create new context instance with different default value
}

// Set context in middleware
app.use((req, next) => {
  const userId = extractUserFromToken(req.headers.authorization)
  const requestId = generateRequestId()
  
  AuthContext.set({ userId })
  RequestIdContext.set(requestId)
  
  return next(req)
})

// Use context in handlers
app.get('/profile').use(() => {
  const auth = AuthContext.get()          // { userId: string } | null
  const requestId = RequestIdContext.get() // string
  const db = DBContext.get()              // any | null
  
  if (!auth) {
    return Response.status(401).json({ error: 'Unauthorized' })
  }
  
  // Context.assert() throws if null, returns non-null value
  try {
    const safeAuth = AuthContext.assert()  // { userId: string } (never null)
    const user = db?.query('SELECT * FROM users WHERE id = ?', [safeAuth.userId])
    return Response.json(user)
  } catch {
    return Response.status(401).json({ error: 'Unauthenticated' })
  }
})

// Context isolation example - each request has independent context
app.get('/test').use(() => {
  RequestIdContext.set('unique-per-request')
  const id = RequestIdContext.get() // Different for each concurrent request
  return Response.json({ requestId: id })
})
```

### Context Hooks

Context hooks safely pass context information in async environments.

#### `useRequestInfo()`
Gets current request information.

```typescript
app.use(() => {
  const req = useRequestInfo()
  console.log({
    pathname: req.pathname,
    method: req.method,
    query: req.query,
    params: req.params,
    headers: req.headers,
    cookies: req.cookies,
  })
  
  return Response.json({ ok: true })
})
```

#### `useBasenames()`
Gets the list of base paths for current route.

```typescript
const app = Http({ basenames: ['/api'] })
const v1Router = app.route('/v1')

v1Router.use(() => {
  const basenames = useBasenames() // ['/api', '/v1']
  return Response.json({ basenames })
})
```

#### `usePrefix()`
Gets the complete path prefix.

```typescript
const userRouter = Router()
userRouter.get('/').use(() => {
  const basenames = useBasenames()
  // If mounted at /api/v1/users, basenames = ['/api', '/v1', '/users']
  return Response.json({ basenames })
})

http.route('/api').route('/v1').route('/users').use(userRouter)

// Get current route prefix
http.route('/api').route('/v1').get('/status').use(() => {
  const prefix = usePrefix()
  // prefix = '/api/v1' (combined basenames as single string)
  return Response.json({
    prefix,
    endpoint: `${prefix}/status`
  })
})
```

#### Raw Object Access
```typescript
import { useRequest, useResponse, useReq, useRes, useRequestInfo, useBasenames, usePrefix } from 'farrow-http'

// Get Node.js raw request/response (nullable)
http.use(() => {
  const req = useRequest()  // IncomingMessage | null
  const res = useResponse() // ServerResponse | null
  
  if (req && res) {
    console.log(req.method, req.url)
    // Direct manipulation (not recommended)
  }
  
  return Response.json({ ok: true })
})

// Get Node.js raw request/response (throws if null)
http.use(() => {
  const req = useReq()  // IncomingMessage (throws if null)
  const res = useRes()  // ServerResponse (throws if null)
  
  // Guaranteed to exist
  console.log(req.headers)
  
  return Response.json({ ok: true })
})
```

### RequestInfo

Request information object containing all parsed request data:

```typescript
type RequestInfo = {
  readonly pathname: string         // Pathname
  readonly method?: string          // HTTP method
  readonly query?: RequestQuery     // Query parameters
  readonly body?: any              // Request body
  readonly headers?: RequestHeaders // Request headers
  readonly cookies?: RequestCookies // Cookies
}

type RequestQuery = { readonly [key: string]: any }
type RequestHeaders = { readonly [key: string]: any }
type RequestCookies = { readonly [key: string]: any }
```

---

## Error Handling

### HttpError Class

Built-in HTTP error class with status code information.

```typescript
import { HttpError } from 'farrow-http'

// Throw HTTP errors
app.use((req, next) => {
  if (!isValidRequest(req)) {
    throw new HttpError('Bad request', 400)
  }
  return next(req)
})

// Custom error class
class AuthenticationError extends HttpError {
  constructor(message = 'Authentication required') {
    super(message, 401)
  }
}

// Custom error types
class ValidationError extends HttpError {
  constructor(message: string, field?: string) {
    super(message, 400)
    this.name = 'ValidationError'
    this.field = field
  }
}
```

### Automatic Error Handling

The framework automatically catches errors in middleware:

```typescript
// Synchronous errors
app.use(() => {
  throw new Error('Something went wrong')
  // Automatically converted to 500 response
})

// Asynchronous errors
app.use(async () => {
  const data = await fetchExternalAPI()
  return Response.json(data)
  // Promise rejections are automatically caught
})
```

### Global Error Handler

```typescript
// Global error handler
http.use(async (req, next) => {
  try {
    return await next(req)
  } catch (error) {
    console.error('Request failed:', {
      method: req.method,
      url: req.pathname,
      error: error.message
    })

    if (error instanceof ValidationError) {
      return Response.status(error.statusCode).json({
        error: error.message,
        field: error.field,
        type: 'validation_error'
      })
    }
    
    if (error instanceof HttpError) {
      return Response.status(error.statusCode).json({
        error: error.message,
        type: 'http_error'
      })
    }
    
    return Response.status(500).json({
      error: 'Internal server error',
      type: 'server_error'
    })
  }
})
```

### Error Stack Control

```typescript
const app = Http({
  errorStack: process.env.NODE_ENV === 'development'   // Show full stack in development
})
```

---

## Static Files

```typescript
// Serve static files with built-in security protections
http.serve('/static', './public')
http.serve('/uploads', './storage/uploads')

// Built-in security features:
// - Automatic directory traversal attack prevention (path normalization)
// - Automatic file permission checking (using fs.stat to verify access)
// - Serves index.html for directory requests (e.g., /static/ → ./public/index.html)
// - Gracefully passes to next middleware if file not found or inaccessible
// - Secure path handling across all platforms

// Examples:
// /static/style.css → ./public/style.css
// /static/ → ./public/index.html (if exists)
// /static/docs/ → ./public/docs/index.html (if exists)
// /uploads/../secret → blocked (directory traversal protection)
```

---

## Response Interception

### Capture and Transform Responses

```typescript
// Globally capture and transform JSON responses
http.capture('json', (jsonBody) => {
  // jsonBody type: { type: 'json', value: JsonType }
  return Response.json({
    data: jsonBody.value,
    timestamp: new Date().toISOString(),
    version: 'v1',
    success: true
  })
})

// Capture file responses for logging/analytics
http.capture('file', (fileBody) => {
  // fileBody type: { type: 'file', value: string, options?: FileBodyOptions }
  console.log(`Serving file: ${fileBody.value}`)
  return Response.file(fileBody.value, fileBody.options)
})

// All capturable body types:
// 'empty' | 'string' | 'json' | 'stream' | 'buffer' | 'file' | 'custom' | 'redirect'
```

### `matchBodyType<T extends keyof BodyMap>(type: T, callback: (body: BodyMap[T]) => MaybeAsyncResponse)`

Creates middleware to capture and handle specific response body types.

```typescript
import { matchBodyType } from 'farrow-http'

// Add timestamp and version info to all JSON responses
app.use(matchBodyType('json', (body) => {
  return Response.json({
    ...body.value,
    timestamp: Date.now(),
    version: 'v1'
  })
}))

// Add cache headers to all file responses
app.use(matchBodyType('file', (body) => {
  return Response.file(body.value, body.options)
    .header('Cache-Control', 'public, max-age=3600')
    .header('X-File-Server', 'farrow-http')
}))

// Process string responses, add prefix
app.use(matchBodyType('string', (body) => {
  return Response.string(`[${new Date().toISOString()}] ${body.value}`)
}))
```

---

## Testing

```typescript
import { Http } from 'farrow-http'
import request from 'supertest'

const app = Http()
app.get('/hello').use(() => Response.json({ message: 'Hello' }))

// Use app.server() to create server but not start it
// This is crucial for testing - don't call listen() in tests!
const server = app.server()  // Returns Node.js http.Server instance

// Use supertest for request testing
describe('API Tests', () => {
  test('GET /hello', async () => {
    const response = await request(server)
      .get('/hello')
      .expect(200)
    
    expect(response.body).toEqual({ message: 'Hello' })
  })
  
  test('POST /users', async () => {
    const response = await request(server)
      .post('/users')
      .send({ name: 'Alice', email: 'alice@example.com' })
      .expect(201)
    
    expect(response.body.name).toBe('Alice')
  })
  
  test('Protected routes', async () => {
    await request(server)
      .get('/protected')
      .set('Authorization', 'Bearer token')
      .expect(200)
  })
})
```
---


## Complete Examples

```typescript
import { Http, Response, HttpError, Router } from 'farrow-http'
import { ObjectType, String, Int, Optional } from 'farrow-schema'
import { createContext } from 'farrow-pipeline'

// Context definitions
const AuthContext = createContext<{ userId: string; role: string } | null>(null)

// Schema definitions
class CreateUserInput extends ObjectType {
  name = String
  email = String
  age = Optional(Int)
}

class UpdateUserInput extends ObjectType {
  name = Optional(String)
  email = Optional(String)
  age = Optional(Int)
}

// Create application
const app = Http({
  basenames: ['/api'],
  logger: {
    ignoreIntrospectionRequestOfFarrowApi: true // Recommended to clean up farrow-api logs
  },
  contexts: () => {
    // Example: inject context for each request
    // const RequestIdContext = createContext<string>('')
    // return {
    //   requestId: RequestIdContext.create(generateId())
    // }
    return {}
  },
  errorStack: process.env.NODE_ENV === 'development'
})

// Global middleware
app.use(async (req, next) => {
  console.log(`${req.method} ${req.pathname}`)
  const start = Date.now()
  const response = await next(req)
  console.log(`Took ${Date.now() - start}ms`)
  return response
})

// Authentication middleware
const authenticate = async (req: any, next: any) => {
  const token = req.headers?.authorization?.replace('Bearer ', '')
  if (!token) {
    throw new HttpError('Authorization required', 401)
  }
  
  try {
    const payload = verifyToken(token)
    AuthContext.set(payload)
    return next(req)
  } catch {
    throw new HttpError('Invalid token', 401)
  }
}

// Role-based access control
const requireRole = (role: string) => async (req: any, next: any) => {
  const auth = AuthContext.get()
  if (!auth || auth.role !== role) {
    throw new HttpError('Insufficient permissions', 403)
  }
  return next(req)
}

// Global error handler
app.use(async (req, next) => {
  try {
    return await next(req)
  } catch (error) {
    console.error('Request failed:', {
      method: req.method,
      url: req.pathname,
      error: error.message,
      stack: error.stack
    })

    if (error instanceof HttpError) {
      return Response.status(error.statusCode).json({
        error: error.message,
        type: 'http_error'
      })
    }
    
    return Response.status(500).json({
      error: 'Internal server error',
      type: 'server_error'
    })
  }
})

// Health check
app.get('/health').use(() => {
  return Response.json({
    status: 'ok', 
    timestamp: Date.now(),
    version: '1.0.0'
  })
})

// User routes
app.get('/users/<id:int>').use((req) => {
  const user = getUserById(req.params.id)
  if (!user) {
    throw new HttpError('User not found', 404)
  }
  return Response.json(user)
})

app.post('/users', {
  body: CreateUserInput
}, {
  onSchemaError: (error, input, next) => {
    return Response.status(400).json({
      error: 'Validation failed',
      field: error.path?.join('.'),
      message: error.message,
      received: error.value
    })
  }
}).use(authenticate)
  .use((req) => {
    const user = createUser(req.body)
    return Response.status(201).json(user)
  })

app.put('/users/<id:int>', {
  body: UpdateUserInput
}).use(authenticate)
  .use((req) => {
    const userId = req.params.id
    const auth = AuthContext.assert()
    
    // Users can only update their own profile, unless they're admin
    if (auth.userId !== userId.toString() && auth.role !== 'admin') {
      throw new HttpError('Can only update own profile', 403)
    }
    
    const updatedUser = updateUser(userId, req.body)
    return Response.json(updatedUser)
  })

// Static files
app.serve('/static', './public')
app.serve('/uploads', './storage/uploads')

// Admin router
const adminRouter = Router()
adminRouter.use(authenticate)
adminRouter.use(requireRole('admin'))

adminRouter.get('/dashboard').use(() => {
  return Response.json({
    message: 'Admin dashboard',
    stats: getAdminStats()
  })
})

adminRouter.delete('/users/<id:int>').use((req) => {
  deleteUser(req.params.id)
  return Response.status(204).empty()
})

app.route('/admin').use(adminRouter)

// Response transformation
app.capture('json', (body) => {
  return Response.json({
    ...body.value,
    timestamp: new Date().toISOString(),
    apiVersion: 'v1'
  })
})

// Start server
const port = process.env.PORT || 3000
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`)
  console.log(`Health check: http://localhost:${port}/api/health`)
})

// Export for testing
export { app }
```