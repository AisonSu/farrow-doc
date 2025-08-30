# farrow-http API Reference

farrow-http is a powerful HTTP server and routing system that provides type-safe route definitions and request handling capabilities.

## Installation

```bash
npm install farrow-http
```

## Core API

### Http(options?)

Create an HTTP server instance.

```typescript
function Http(options?: HttpPipelineOptions): HttpPipeline

type HttpPipelineOptions = {
  basenames?: string[]                    // Base path list
  body?: BodyOptions                      // Request body parsing options
  cookie?: CookieOptions                  // Cookie parsing options
  query?: QueryOptions                    // Query parameter parsing options
  contexts?: ContextFactory               // Context factory function
  logger?: boolean | HttpLoggerOptions    // Logging configuration
  errorStack?: boolean                    // Whether to show error stack
}
```

#### Example Usage

```typescript
import { Http } from 'farrow-http'

// Basic usage
const app = Http()

// Usage with configuration
const app = Http({
  basenames: ['/api', '/v1'],
  body: {
    limit: '10mb',
    encoding: 'utf8'
  },
  cookie: {
    decode: decodeURIComponent
  },
  query: {
    depth: 5,
    arrayLimit: 100
  },
  logger: {
    transporter: (str) => console.log(str),
    ignoreIntrospectionRequestOfFarrowApi: false
  },
  contexts: ({ req, requestInfo, basename }) => ({
    requestId: generateRequestId(),
    startTime: Date.now()
  })
})
```

### HttpPipeline Methods

#### handle() - Handle HTTP Requests

Handle HTTP requests, typically used for integration with other frameworks.

```typescript
handle(req: IncomingMessage, res: ServerResponse, options?: HttpHandlerOptions): MaybeAsync<void>

type HttpHandlerOptions = {
  onLast?: CustomBodyHandler  // Custom handler when no routes match
}
```

**Example:**

```typescript
// Integrate with Express
expressApp.use((req, res) => {
  app.handle(req, res)
})
```

#### listen() - Start Server

Start the HTTP server and listen on the specified port.

```typescript
listen(...args: Parameters<Server['listen']>): Server
```

**Example:**

```typescript
// Listen on port
app.listen(3000)
app.listen(3000, 'localhost')
app.listen(3000, () => console.log('Server started'))

// Listen on Unix Socket
app.listen('/tmp/server.sock')
```

#### server() - Create Server Instance

Create an HTTP server without starting to listen.

```typescript
server(): Server
```

**Example:**

```typescript
const server = app.server()
server.listen(3000)

// For testing
import request from 'supertest'
const response = await request(app.server()).get('/')
```

## HTTPS Support

### Https(options?)

Create an HTTPS server instance.

```typescript
function Https(options?: HttpsPipelineOptions): HttpsPipeline

type HttpsPipelineOptions = HttpPipelineOptions & {
  tls?: HttpsOptions  // TLS/SSL configuration
}
```

**Example:**

```typescript
import { Https } from 'farrow-http'
import fs from 'fs'

const app = Https({
  tls: {
    key: fs.readFileSync('path/to/private-key.pem'),
    cert: fs.readFileSync('path/to/certificate.pem')
  }
})

app.listen(443)
```

## Response - Response Builder

### Static Methods

#### Response.json() - JSON Response

```typescript
static json(value: JsonType): Response
```

**Example:**

```typescript
return Response.json({ message: 'Success', data: [] })
return Response.json(null)
return Response.json(42)
```

#### Response.text() - Plain Text Response

```typescript
static text(value: string): Response
```

**Example:**

```typescript
return Response.text('Hello, World!')
```

#### Response.html() - HTML Response

```typescript
static html(value: string): Response
```

**Example:**

```typescript
return Response.html('<h1>Welcome</h1>')
```

#### Response.redirect() - Redirect Response

```typescript
static redirect(url: string, options?: RedirectOptions): Response

type RedirectOptions = {
  usePrefix?: boolean  // Whether to use path prefix, default true
}
```

**Example:**

```typescript
return Response.redirect('/login')
return Response.redirect('https://example.com')
return Response.redirect('/api/users', { usePrefix: false })
```

#### Response.file() - File Response

```typescript
static file(filename: string, options?: FileBodyOptions): Response
```

**Example:**

```typescript
return Response.file('./uploads/document.pdf')
return Response.file('./large-file.zip', { 
  start: 0, 
  end: 1024 * 1024 // Read only first 1MB
})
```

#### Response.stream() - Stream Response

```typescript
static stream(stream: Stream): Response
```

**Example:**

```typescript
import fs from 'fs'

return Response.stream(fs.createReadStream('./data.csv'))
```

#### Response.buffer() - Binary Response

```typescript
static buffer(buffer: Buffer): Response
```

**Example:**

```typescript
const data = Buffer.from('binary data')
return Response.buffer(data)
```

#### Response.empty() - Empty Response

```typescript
static empty(): Response
```

**Example:**

```typescript
return Response.empty()  // 204 No Content
```

#### Response.custom() - Custom Response

```typescript
static custom(handler?: CustomBodyHandler): Response

type CustomBodyHandler = (params: {
  req: IncomingMessage
  res: ServerResponse
  requestInfo: RequestInfo
  responseInfo: Omit<ResponseInfo, 'body'>
}) => void
```

**Example:**

```typescript
return Response.custom(({ res }) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' })
  res.end('Custom response')
})
```

### Instance Methods

#### status() - Set Status Code

```typescript
status(code: number, message?: string): Response
```

**Example:**

```typescript
return Response
  .json({ error: 'Not Found' })
  .status(404)
  .status(500, 'Internal Server Error')
```

#### header() / headers() - Set Response Headers

```typescript
header(name: string, value: Value): Response
headers(headers: Headers): Response
```

**Example:**

```typescript
return Response
  .json(data)
  .header('Cache-Control', 'no-cache')
  .header('X-Request-ID', requestId)
  .headers({
    'Cache-Control': 'no-cache',
    'X-Request-ID': requestId,
    'X-API-Version': 'v1'
  })
```

#### cookie() / cookies() - Set Cookies

```typescript
cookie(name: string, value: Value | null, options?: CookieOptions): Response
cookies(cookies: Record<string, Value | null>, options?: CookieOptions): Response
```

**Example:**

```typescript
return Response
  .json(user)
  .cookie('sessionId', sessionId, {
    httpOnly: true,
    secure: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  })
  .cookie('oldCookie', null) // Delete cookie
  .cookies({
    sessionId: sessionId,
    theme: 'dark',
    oldSession: null // Delete
  }, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production'
  })
```

#### vary() - Set Vary Response Header

```typescript
vary(...fields: string[]): Response
```

**Example:**

```typescript
return Response
  .json(data)
  .vary('Accept-Encoding', 'User-Agent')
```

#### attachment() - Set Attachment Download

```typescript
attachment(filename?: string, options?: ContentDispositionOptions): Response
```

**Example:**

```typescript
return Response
  .file('./report.pdf')
  .attachment('monthly-report.pdf')
```

#### merge() - Merge Response Objects

```typescript
merge(...responses: Response[]): Response
```

**Important Note:**

When merging, later `body` will override earlier `body`:

```typescript
// Wrong: text body will be overridden by empty body
const result = Response.text('Hello').merge(Response.cookie('token', '123'))
// Result: only cookie, no text content

// Correct: use method chaining
const result = Response.text('Hello').cookie('token', '123')

// Correct: body set last in merge
const result = Response.merge(
  Response.cookie('token', '123'),
  Response.text('Hello')  // body set last
)
```

## Router - Routing System

### Router() - Create Router

```typescript
function Router(): RouterPipeline
```

**Example:**

```typescript
import { Router } from 'farrow-http'

const userRouter = Router()
const apiRouter = Router()
```

### RouterPipeline Methods

#### route() - Create Sub-route

```typescript
route(name: string): Pipeline<RequestInfo, MaybeAsyncResponse>
```

**Example:**

```typescript
const app = Http()
const apiRouter = app.route('/api')
const v1Router = apiRouter.route('/v1')

v1Router.get('/users').use(() => Response.json(users))
// Actual path: /api/v1/users
```

#### serve() - Static File Service

Provide static file service with automatic directory traversal attack protection and index.html file support.

```typescript
serve(name: string, dirname: string): void
```

**Features:**
- Automatic prevention of directory traversal attacks (path normalization check)
- Automatic search for index.html when accessing directories
- Proper forwarding to next middleware when files don't exist

**Example:**

```typescript
app.serve('/static', './public')
app.serve('/uploads', './storage/uploads')

// Accessing /static/style.css returns ./public/style.css
// Accessing /static/docs/ tries to return ./public/docs/index.html
```

#### capture() - Capture Response Body

```typescript
capture<T extends keyof BodyMap>(type: T, callback: (body: BodyMap[T]) => MaybeAsyncResponse): void
```

**Example:**

```typescript
// Capture all JSON responses and add timestamp
app.capture('json', (body) => {
  return Response.json({
    ...body.value,
    timestamp: Date.now()
  })
})
```

## Route Matching

### HTTP Method Shortcuts

Supports all standard HTTP methods with Template Literal Types URL patterns, providing automatic type inference and runtime validation.

```typescript
get(url: string, schema?: RouterSharedSchema, options?: MatchOptions)
post(url: string, schema?: RouterSharedSchema, options?: MatchOptions)
put(url: string, schema?: RouterSharedSchema, options?: MatchOptions)
patch(url: string, schema?: RouterSharedSchema, options?: MatchOptions)
delete(url: string, schema?: RouterSharedSchema, options?: MatchOptions)
head(url: string, schema?: RouterSharedSchema, options?: MatchOptions)
options(url: string, schema?: RouterSharedSchema, options?: MatchOptions)
```

**Example:**

```typescript
// GET request
app.get('/users').use(() => Response.json(users))

// Route with parameters
app.get('/users/<id:int>').use((request) => {
  return Response.json({ userId: request.params.id })
})

// With query parameters
app.get('/search?<q:string>&<limit?:int>').use((request) => {
  const { q, limit = 10 } = request.query
  return Response.json(search(q, limit))
})

// With additional validation
app.post('/users', {
  body: CreateUserSchema,
  headers: { 'content-type': Literal('application/json') }
}).use((request) => {
  return Response.status(201).json(createUser(request.body))
})
```

### URL Schema Syntax

URL Schema is based on farrow-schema, providing automatic type inference and runtime validation.

#### Path Parameters

```typescript
// Basic types (auto validation)
'<name:string>'     // string type, auto validation
'<id:int>'          // number type (integer), auto validation as integer
'<price:float>'     // number type (float), auto validation as number
'<id:number>'       // number type, auto validation as number
'<active:boolean>'  // boolean type, auto validation as boolean
'<userId:id>'       // string type (non-empty validation), auto validation non-empty

// Modifiers
'<name?:string>'    // Optional parameter (string | undefined)
'<tags+:string>'    // One or more (string[])
'<cats*:string>'    // Zero or more (string[] | undefined)

// Union types
'<type:product|service>'  // 'product' | 'service'
'<id:int|string>'         // number | string

// Literal types
'<status:{active}|{inactive}>'  // 'active' | 'inactive'
```

#### Query Parameters

```typescript
// Define query parameters after ?
'/search?<q:string>'              // Required query parameter
'/search?<q:string>&<page?:int>'  // Optional query parameter
'/items?sort=name&<order:{asc}|{desc}>'  // Mixed static and dynamic parameters
```

### match() - Detailed Route Matching

```typescript
match<T extends RouterSchema>(schema: T, options?: MatchOptions)

type RouterRequestSchema = {
  pathname: string                    // Path pattern
  method?: string | string[]          // HTTP method
  params?: RouterSchemaDescriptor     // Path parameter validation
  query?: RouterSchemaDescriptor      // Query parameter validation
  body?: Schema.FieldDescriptor       // Request body validation
  headers?: RouterSchemaDescriptor    // Request header validation
  cookies?: RouterSchemaDescriptor    // Cookie validation
}

type RouterUrlSchema = {
  url: string                         // URL pattern (supports Template Literal Types)
  method?: string | string[]          // HTTP method
  body?: Schema.FieldDescriptor       // Request body validation
  headers?: RouterSchemaDescriptor    // Request header validation
  cookies?: RouterSchemaDescriptor    // Cookie validation
}

type MatchOptions = {
  block?: boolean                     // Whether to block unmatched requests
  onSchemaError?(                     // Validation error handler
    error: ValidationError,
    input: RequestInfo,
    next: Next
  ): MaybeAsyncResponse | void
}
```

#### ValidationError Detailed Structure

Validation error objects contain detailed error information:

```typescript
interface ValidationError {
  message: string                     // Error description
  path?: (string | number)[]          // Error field path (e.g., ['body', 'name'])
  value?: any                         // Value that caused the error
  schema?: any                        // Related Schema definition
}
```

**Example:**

```typescript
app.post('/users', {
  body: { 
    name: String, 
    age: Number,
    profile: {
      email: String
    }
  }
}, {
  onSchemaError: (error, input, next) => {
    console.log('Error field path:', error.path)     // ['body', 'profile', 'email']
    console.log('User input value:', error.value)    // Actual user input value
    console.log('Error description:', error.message)  // Detailed error message
    
    // Return user-friendly error message
    return Response.status(400).json({
      error: 'Data validation failed',
      field: error.path?.join('.'),           // 'body.profile.email'
      message: error.message,
      received: error.value,
      hint: 'Please check input format'
    })
  }
}).use((request) => {
  // request.body is validated and type-safe
  return Response.status(201).json(createUser(request.body))
})
```

## Middleware System

### Middleware Type Definitions

```typescript
type Middleware<I, O> = (input: I, next: Next<I, O>) => O
type Next<I, O> = (input?: I) => O
type HttpMiddleware = Middleware<RequestInfo, MaybeAsyncResponse>
type MaybeAsyncResponse = Response | Promise<Response>
```

**Important:** Middleware must return a Response object, which is one of the core design principles of farrow-http.

### use() - Add Middleware

```typescript
use(middleware: HttpMiddleware): void
```

**Example:**

```typescript
// Logging middleware
app.use((request, next) => {
  console.log(`${request.method} ${request.pathname}`)
  return next(request)
})

// Authentication middleware
app.use((request, next) => {
  const token = request.headers?.authorization
  
  if (!isValidToken(token)) {
    return Response.status(401).json({ error: 'Unauthorized' })
  }
  
  return next(request)
})

// Error handling middleware
app.use((request, next) => {
  try {
    return next(request)
  } catch (error) {
    console.error(error)
    return Response.status(500).json({ error: 'Internal Server Error' })
  }
})
```

### Asynchronous Middleware

```typescript
// Async middleware
app.use(async (request, next) => {
  const user = await authenticateUser(request)
  UserContext.set(user)
  return next(request)
})

// Handle Promise
app.use((request, next) => {
  const result = next(request)
  
  if (result instanceof Promise) {
    return result.then(response => {
      return response.header('X-Processed-At', Date.now().toString())
    })
  }
  
  return result.header('X-Processed-At', Date.now().toString())
})
```

## Context Hooks

farrow-http uses farrow-pipeline's Context system.

### useRequest() / useResponse()

Get Node.js native request/response objects (may be null).

```typescript
function useRequest(): IncomingMessage | null
function useResponse(): ServerResponse | null
```

**Example:**

```typescript
app.use(() => {
  const req = useRequest()
  const res = useResponse()
  
  if (req && res) {
    console.log(req.method, req.url)
    res.setHeader('X-Custom', 'value')
  }
  
  return Response.text('OK')
})
```

### useReq() / useRes()

Get Node.js native request/response objects. Throws error if objects don't exist.

```typescript
function useReq(): IncomingMessage
function useRes(): ServerResponse
```

### useRequestInfo()

Get current request information.

```typescript
function useRequestInfo(): RequestInfo
```

**Example:**

```typescript
app.use(() => {
  const request = useRequestInfo()
  
  console.log({
    pathname: request.pathname,
    method: request.method,
    query: request.query
  })
  
  return Response.text('OK')
})
```

### useBasenames() / usePrefix()

Get current route's base paths and complete prefix.

```typescript
function useBasenames(): string[]
function usePrefix(): string
```

**Example:**

```typescript
const app = Http({ basenames: ['/api'] })
const v1Router = app.route('/v1')
const userRouter = v1Router.route('/users')

userRouter.get('/').use(() => {
  const basenames = useBasenames()
  // ['/api', '/v1', '/users']
  
  const prefix = usePrefix()
  // '/api/v1'
  
  return Response.json({ basenames, prefix })
})
```

## Error Handling

### HttpError Class

```typescript
class HttpError extends Error {
  constructor(message: string, public statusCode: number = 500)
  statusCode: number
}
```

**Example:**

```typescript
import { HttpError } from 'farrow-http'

app.use((request, next) => {
  if (!isValidRequest(request)) {
    throw new HttpError('Bad Request', 400)
  }
  
  return next(request)
})

// Custom error
class AuthenticationError extends HttpError {
  constructor(message = 'Authentication required') {
    super(message, 401)
  }
}

app.use((request, next) => {
  if (!isAuthenticated(request)) {
    throw new AuthenticationError()
  }
  
  return next(request)
})
```

## Type Definitions

### Core Types

#### RequestInfo

```typescript
type RequestInfo = {
  readonly pathname: string
  readonly method?: string
  readonly query?: RequestQuery
  readonly body?: any
  readonly headers?: RequestHeaders
  readonly cookies?: RequestCookies
}

type RequestQuery = { readonly [key: string]: any }
type RequestHeaders = { readonly [key: string]: any }
type RequestCookies = { readonly [key: string]: any }
```

#### ResponseInfo

```typescript
type ResponseInfo = {
  status?: Status
  headers?: Headers
  cookies?: Cookies
  body?: Body
  vary?: string[]
}

type Status = {
  code: number
  message?: string
}

type Headers = { [key: string]: Value }
type Value = string | number

type Cookies = {
  [key: string]: {
    value: Value | null
    options?: CookieOptions
  }
}
```

#### Body Types

```typescript
type Body = 
  | EmptyBody 
  | StringBody 
  | JsonBody 
  | StreamBody 
  | BufferBody 
  | FileBody 
  | CustomBody 
  | RedirectBody

type EmptyBody = { type: 'empty'; value: null }
type StringBody = { type: 'string'; value: string }
type JsonBody = { type: 'json'; value: JsonType }
type StreamBody = { type: 'stream'; value: Stream }
type BufferBody = { type: 'buffer'; value: Buffer }
type RedirectBody = { type: 'redirect'; value: string; usePrefix: boolean }
type FileBody = { type: 'file'; value: string; options?: FileBodyOptions }
type CustomBody = { type: 'custom'; handler: CustomBodyHandler }
```

### Utility Types

#### TypeOfRequestSchema

```typescript
// Extract TypeScript types from RouterRequestSchema
type TypeOfRequestSchema<T extends RouterRequestSchema> = {
  readonly [K in keyof T]: TypeOfRouterRequestField<T[K]>
}
```

#### TypeOfUrlSchema

```typescript
// Extract TypeScript types from RouterUrlSchema
type TypeOfUrlSchema<T extends RouterUrlSchema> = ParseUrl<T['url']> & {
  readonly [K in keyof Omit<T, 'url'>]: TypeOfRouterRequestField<Omit<T, 'url'>[K]>
}
```

### Common Interfaces

#### CookieOptions

```typescript
interface CookieOptions {
  domain?: string
  encode?: (val: string) => string
  expires?: Date
  httpOnly?: boolean
  maxAge?: number
  path?: string
  priority?: 'low' | 'medium' | 'high'
  sameSite?: boolean | 'lax' | 'strict' | 'none'
  secure?: boolean
  signed?: boolean
}
```

## Complete Example

```typescript
import { Http, Response, Router, HttpError } from 'farrow-http'
import { ObjectType, String, Number } from 'farrow-schema'
import { createContext } from 'farrow-pipeline'

// Schema
class User extends ObjectType {
  id = Number
  name = String
  email = String
}

// Context
const UserContext = createContext<User | null>(null)

// Middleware
const authenticate = (request, next) => {
  const token = request.headers?.authorization
  if (!token) {
    return Response.status(401).json({ error: 'Unauthorized' })
  }
  
  const user = verifyToken(token)
  UserContext.set(user)
  return next(request)
}

// Create application
const app = Http()

// Global middleware
app.use((request, next) => {
  console.log(`${request.method} ${request.pathname}`)
  return next(request)
})

// Public routes
app.get('/').use(() => {
  return Response.json({ message: 'Welcome to API' })
})

// User routes
const userRouter = Router()

userRouter.get('/').use(() => {
  return Response.json(getAllUsers())
})

userRouter.get('/<id:int>').use((request) => {
  const user = getUser(request.params.id)
  if (!user) {
    throw new HttpError('User not found', 404)
  }
  return Response.json(user)
})

userRouter.post('/', {
  body: User
}).use((request) => {
  const user = createUser(request.body)
  return Response
    .status(201)
    .json(user)
    .header('Location', `/api/users/${user.id}`)
})

// Protected routes
app.use('/api/*', authenticate)
app.route('/api/users').use(userRouter)

// Error handling
app.use((request, next) => {
  try {
    return next(request)
  } catch (error) {
    if (error instanceof HttpError) {
      return Response.status(error.status).json({
        error: error.message
      })
    }
    return Response.status(500).json({
      error: 'Internal server error'
    })
  }
})

// Start server
app.listen(3000, () => {
  console.log('Server running on http://localhost:3000')
})
```

## Best Practices

### 1. Structured Routing

```typescript
// Recommended: Modular routing
const userRouter = Router()
const postRouter = Router()
const adminRouter = Router()

// Clear route mounting
app.route('/api/users').use(userRouter)
app.route('/api/posts').use(postRouter)
app.route('/admin').use(adminRouter)
```

### 2. Security Best Practices

```typescript
// Recommended: Secure middleware configuration
app.use((request, next) => {
  // CORS headers
  const response = next(request)
  return response
    .header('Access-Control-Allow-Origin', 'https://yourdomain.com')
    .header('X-Content-Type-Options', 'nosniff')
    .header('X-Frame-Options', 'DENY')
    .header('X-XSS-Protection', '1; mode=block')
})
```

### 3. Performance Optimization

```typescript
// Recommended: Response compression and caching
app.use((request, next) => {
  const response = next(request)
  
  // Set caching strategy
  if (request.pathname.startsWith('/static/')) {
    return response.header('Cache-Control', 'public, max-age=31536000')
  }
  
  return response
})
```

Congratulations! You've mastered the complete farrow-http API. Now you can build powerful, type-safe HTTP applications!