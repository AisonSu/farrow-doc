# Essentials

> Master the core skills for daily Farrow development 🛠️

## Overview

This chapter will systematically introduce Farrow's fundamental features, enabling you to develop proficiently on a daily basis. We'll learn these concepts by building a blog API.

Learning objectives:
- 🛣️ Master all features of the routing system
- 🔗 Understand and use middleware
- 📝 Master Schema definition and validation
- 🎨 Build various types of responses
- 🔒 Implement authentication and authorization
- ⚡ Handle errors and exceptions

## Detailed Routing System

### Basic Routing

Farrow's routing system is based on Template Literal Types, providing powerful type inference:

```typescript
import { Http, Response } from 'farrow-http'

const app = Http()

// Basic routing methods
app.get('/posts')       // GET request
app.post('/posts')      // POST request
app.put('/posts')       // PUT request
app.patch('/posts')     // PATCH request
app.delete('/posts')    // DELETE request
app.head('/posts')      // HEAD request
app.options('/posts')   // OPTIONS request

// Handle all methods
app.all('/posts')       // Matches all HTTP methods
```

### Route Parameters

#### Basic Type Parameters

```typescript
// Integer parameter
app.get('/posts/<id:int>').use((request) => {
  const id: number = request.params.id  // Automatically inferred as number
  return Response.json({ postId: id })
})

// String parameter
app.get('/users/<username:string>').use((request) => {
  const username: string = request.params.username
  return Response.json({ username })
})

// Boolean parameter
app.get('/posts/<published:boolean>').use((request) => {
  const published: boolean = request.params.published
  return Response.json({ published })
})

// Float parameter
app.get('/products/<price:float>').use((request) => {
  const price: number = request.params.price
  return Response.json({ price })
})

// ID parameter (special string, usually for identifiers)
app.get('/items/<itemId:id>').use((request) => {
  const itemId: string = request.params.itemId
  return Response.json({ itemId })
})
```

#### Optional Parameters

```typescript
// Optional path parameter
app.get('/posts/<id?:int>').use((request) => {
  const id: number | undefined = request.params.id
  
  if (id === undefined) {
    // Return all articles
    return Response.json(getAllPosts())
  } else {
    // Return specific article
    return Response.json(getPost(id))
  }
})

// Optional query parameter
app.get('/search?<q:string>&<page?:int>&<limit?:int>').use((request) => {
  const { q, page = 1, limit = 10 } = request.query
  // q: string (required)
  // page: number (optional, default 1)
  // limit: number (optional, default 10)
  
  return Response.json(search(q, { page, limit }))
})
```

#### Array Parameters

```typescript
// One or more (+)
app.get('/tags/<tags+:string>').use((request) => {
  const tags: string[] = request.params.tags  // At least one
  return Response.json({ tags })
})
// Matches: /tags/javascript/typescript/nodejs

// Zero or more (*)
app.get('/categories/<cats*:string>').use((request) => {
  const cats: string[] | undefined = request.params.cats  // May be empty
  return Response.json({ categories: cats || [] })
})
// Matches: /categories or /categories/tech/web
```

#### Union Type Parameters

```typescript
// Enum values
app.get('/posts/<status:draft|published|archived>').use((request) => {
  const status: 'draft' | 'published' | 'archived' = request.params.status
  return Response.json(getPostsByStatus(status))
})

// Literal types
app.get('/theme/<mode:{light}|{dark}>').use((request) => {
  const mode: 'light' | 'dark' = request.params.mode
  return Response.json({ theme: mode })
})
```

### Complex Route Examples

```typescript
// Combining multiple parameter types
app.get(
  '/api/v<version:int>/posts/<id:int>/comments?<page?:int>&<limit?:int>&<sort?:asc|desc>'
).use((request) => {
  const { version, id } = request.params
  const { page = 1, limit = 20, sort = 'asc' } = request.query
  
  // version: number
  // id: number
  // page: number
  // limit: number
  // sort: 'asc' | 'desc'
  
  return Response.json({
    api: `v${version}`,
    postId: id,
    comments: getComments(id, { page, limit, sort })
  })
})
```

### Route Organization

#### Using Router

```typescript
import { Router } from 'farrow-http'

// Create modular routing
const postsRouter = Router()

postsRouter.get('/').use(() => {
  return Response.json(getAllPosts())
})

postsRouter.get('/<id:int>').use((request) => {
  return Response.json(getPost(request.params.id))
})

postsRouter.post('/', {
  body: CreatePostSchema
}).use((request) => {
  const post = createPost(request.body)
  return Response.status(201).json(post)
})

// User routing
const usersRouter = Router()

usersRouter.get('/').use(() => {
  return Response.json(getAllUsers())
})

usersRouter.get('/<id:int>').use((request) => {
  return Response.json(getUser(request.params.id))
})

// Compose routing - Method 1: Using route
const apiRouter = Router()
apiRouter.route('/posts').use(postsRouter)
apiRouter.route('/users').use(usersRouter)

// Mount to main application
app.route('/api/v1').use(apiRouter)

// Final routes:
// GET /api/v1/posts
// GET /api/v1/posts/:id
// POST /api/v1/posts
// GET /api/v1/users
// GET /api/v1/users/:id
```

#### Route Prefixes

```typescript
// Use basenames to set global prefix
const app = Http({
  basenames: ['/api', '/v1']  // Can have multiple prefixes
})

app.get('/posts')  // Actually matches: /api/posts and /v1/posts
```

## Schema Definition and Validation

### Basic Schema Definition

```typescript
import { ObjectType, String, Number, Boolean, Date, List, Optional, Nullable } from 'farrow-schema'

// Define blog post Schema
class BlogPost extends ObjectType {
  // Basic types
  id = Number
  title = String
  content = String
  published = Boolean
  createdAt = Date
  
  // Optional field
  description = Optional(String)  // string | undefined
  
  // Nullable
  publishedAt = Nullable(Date)    // Date | null
  
  // Array
  tags = List(String)              // string[]
  
  // Nested object
  author = {
    id: Number,
    name: String,
    email: String,
    avatar: Optional(String)
  }
  
  // Nested array
  comments = List({
    id: Number,
    content: String,
    author: String,
    createdAt: Date
  })
}
```

### Advanced Schema Features

#### Union Types

```typescript
import { Union, Literal } from 'farrow-schema'

// Post status
const PostStatus = Union(
  Literal('draft'),
  Literal('published'),
  Literal('archived')
)

// Payment method (complex union)
const PaymentMethod = Union(
  {
    type: Literal('credit_card'),
    cardNumber: String,
    cvv: String,
    expiryDate: String
  },
  {
    type: Literal('paypal'),
    email: String
  },
  {
    type: Literal('bank_transfer'),
    accountNumber: String,
    routingNumber: String
  }
)
```

#### Recursive Schema

```typescript
// Comment system (supports nested replies)
class Comment extends ObjectType {
  id = Number
  content = String
  author = String
  createdAt = Date
  replies = List(Comment)  // Recursive reference to itself
}

// Category tree
class Category extends ObjectType {
  id = Number
  name = String
  parent = Optional(Category)
  children = List(Category)
}
```

#### Schema Operations

```typescript
import { pickObject, omitObject, partial, required } from 'farrow-schema'

// Complete user Schema
class User extends ObjectType {
  id = Number
  username = String
  email = String
  password = String
  profile = {
    firstName: String,
    lastName: String,
    bio: Optional(String),
    avatar: Optional(String)
  }
  createdAt = Date
  updatedAt = Date
}

// Pick specific fields
const UserSummary = pickObject(User, ['id', 'username', 'profile'])

// Exclude sensitive fields
const PublicUser = omitObject(User, ['password'])

// All fields optional (for updates)
const UpdateUser = partial(User)

// All fields required
const RequiredUser = required(User)
```

### Custom Validators

```typescript
import { ValidatorType, Validator } from 'farrow-schema/validator'

// Email validator
class EmailType extends ValidatorType<string> {
  validate(input: unknown) {
    const result = Validator.validate(String, input)
    if (result.isErr) return result
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(result.value)) {
      return this.Err('Invalid email format')
    }
    
    return this.Ok(result.value)
  }
}

// Validator with parameters
const StringLength = (min: number, max: number) => {
  return class extends ValidatorType<string> {
    validate(input: unknown) {
      const result = Validator.validate(String, input)
      if (result.isErr) return result
      
      const len = result.value.length
      if (len < min || len > max) {
        return this.Err(`Length must be between ${min} and ${max}`)
      }
      
      return this.Ok(result.value)
    }
  }
}

// Using custom validators
class CreateUserRequest extends ObjectType {
  username = StringLength(3, 20)
  email = EmailType
  password = StringLength(8, 100)
}
```

### Request Validation

```typescript
// Validate request body
app.post('/posts', {
  body: {
    title: StringLength(1, 200),
    content: String,
    tags: List(String),
    published: Boolean
  }
}).use((request) => {
  // request.body is validated and type-safe
  const post = createPost(request.body)
  return Response.status(201).json(post)
})

// Validate query parameters
app.get('/search', {
  query: {
    q: String,
    page: Optional(Number),
    limit: Optional(Number)
  }
}).use((request) => {
  const { q, page = 1, limit = 10 } = request.query
  return Response.json(search(q, { page, limit }))
})

// Validate request headers
app.post('/api/posts', {
  headers: {
    'authorization': String,
    'content-type': Literal('application/json')
  },
  body: CreatePostRequest
}).use((request) => {
  const token = request.headers.authorization
  // Handle request...
})
```

### Error Handling

```typescript
// Custom validation error handling
app.post('/users', {
  body: CreateUserRequest
}, {
  onSchemaError: (error, input, next) => {
    // error.path: ['body', 'email']
    // error.message: 'Invalid email format'
    
    return Response.status(400).json({
      error: 'Validation failed',
      field: error.path?.join('.'),
      message: error.message,
      received: error.value
    })
  }
}).use((request) => {
  // Only executed if validation passes
  return Response.status(201).json(createUser(request.body))
})
```

## Middleware System

### Middleware Basics

```typescript
// farrow-http middleware type definition
type HttpMiddleware = (
  request: RequestInfo, 
  next: Next<RequestInfo, MaybeAsyncResponse>
) => MaybeAsyncResponse

type Next<I = unknown, O = unknown> = (input: I) => O
type MaybeAsyncResponse = Response | Promise<Response>

// Basic middleware example
app.use((request, next) => {
  console.log(`${request.method} ${request.pathname}`)
  return next(request)  // Call next middleware and return response
})

// Middleware that needs to handle response (using async)
app.use(async (request, next) => {
  const start = Date.now()
  const response = await next(request)  // Wait for response
  console.log(`Processing time: ${Date.now() - start}ms`)
  return response
})
```

### Common Middleware Patterns

#### Logging Middleware

```typescript
import { RequestInfo, Response, MaybeAsyncResponse, HttpMiddleware } from 'farrow-http'

// Logging middleware - needs async processing to correctly calculate response time
const logger: HttpMiddleware = async (request, next) => {
  const start = Date.now()
  const { method, pathname } = request
  
  console.log(`→ ${method} ${pathname}`)
  
  const response = await next(request)  // Wait for response completion
  
  const duration = Date.now() - start
  const status = response.info.status?.code || 200
  
  console.log(`← ${method} ${pathname} ${status} ${duration}ms`)
  
  return response
}

app.use(logger)
```

#### Authentication Middleware

```typescript
import { createContext } from 'farrow-pipeline'
import { RequestInfo, Response, MaybeAsyncResponse, HttpMiddleware } from 'farrow-http'

const UserContext = createContext<User | null>(null)

// Authentication middleware - usually needs async database queries
const authenticate: HttpMiddleware = async (request, next) => {
  const token = request.headers?.authorization?.replace('Bearer ', '')
  
  if (!token) {
    return Response.status(401).json({ error: 'Token required' })
  }
  
  try {
    const payload = jwt.verify(token, SECRET_KEY)
    const user = await getUserById(payload.userId)  // Async user query
    
    if (!user) {
      return Response.status(401).json({ error: 'User not found' })
    }
    
    UserContext.set(user)
    return next(request)
  } catch (error) {
    return Response.status(401).json({ error: 'Invalid token' })
  }
}

// Apply to specific routes
app.use('/api/<path*:string>', authenticate)
```

#### CORS Middleware

```typescript
import { RequestInfo, Response, HttpMiddleware } from 'farrow-http'

interface CorsOptions {
  origin?: string
  methods?: string[]
  headers?: string[]
  credentials?: boolean
}

// Returns a middleware function
const cors = (options: CorsOptions = {}): HttpMiddleware => {
  const {
    origin = '*',
    methods = ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    headers = ['Content-Type', 'Authorization'],
    credentials = true
  } = options
  
  return (request, next) => {
    // Handle preflight request
    if (request.method === 'OPTIONS') {
      return Response.empty()
        .header('Access-Control-Allow-Origin', origin)
        .header('Access-Control-Allow-Methods', methods.join(', '))
        .header('Access-Control-Allow-Headers', headers.join(', '))
        .header('Access-Control-Allow-Credentials', String(credentials))
    }
    
    // Add CORS headers to response
    const response = next(request)
    
    return response
      .header('Access-Control-Allow-Origin', origin)
      .header('Access-Control-Allow-Credentials', String(credentials))
  }
}

app.use(cors({ origin: 'https://example.com' }))
```

#### Rate Limiting Middleware

```typescript
import { RequestInfo, Response, HttpMiddleware } from 'farrow-http'

// Higher-order function, returns configured middleware
const rateLimit = (maxRequests = 100, windowMs = 60000): HttpMiddleware => {
  const requests = new Map<string, number[]>()
  
  return (request, next) => {
    const ip = request.ip || 'unknown'
    const now = Date.now()
    
    // Get or initialize request records
    const timestamps = requests.get(ip) || []
    
    // Clean expired request records
    const validTimestamps = timestamps.filter(
      time => now - time < windowMs
    )
    
    // Check if limit exceeded
    if (validTimestamps.length >= maxRequests) {
      return Response.status(429).json({
        error: 'Too many requests',
        retryAfter: Math.ceil(windowMs / 1000)
      })
    }
    
    // Record new request
    validTimestamps.push(now)
    requests.set(ip, validTimestamps)
    
    // Add rate limit info to response headers
    const response = next(request)
    
    return response
      .header('X-RateLimit-Limit', String(maxRequests))
      .header('X-RateLimit-Remaining', String(maxRequests - validTimestamps.length))
      .header('X-RateLimit-Reset', String(now + windowMs))
  }
}

app.use(rateLimit(100, 60000))  // 100 requests per minute
```

### Middleware Composition

```typescript
// Create middleware groups
const apiMiddlewares = [
  logger,
  cors(),
  rateLimit(1000, 60000),
  authenticate
]

// Apply to specific route groups
const apiRouter = Router()

// use method supports multiple middleware parameters, can directly spread array
apiRouter.use(...apiMiddlewares)

// Or chain calls
apiRouter
  .use(logger)
  .use(cors())
  .use(rateLimit(1000, 60000))
  .use(authenticate)

// Add sub-routes
apiRouter.route('/posts').use(postsRouter)
apiRouter.route('/users').use(usersRouter)

// Mount to main application
app.route('/api').use(apiRouter)
```

## Response Building

### Basic Response Types

```typescript
// JSON response (most common)
app.get('/data').use(() => {
  return Response.json({ message: 'Hello', data: [1, 2, 3] })
})

// Text response
app.get('/text').use(() => {
  return Response.text('Plain text response')
})

// HTML response
app.get('/html').use(() => {
  return Response.html(`
    <!DOCTYPE html>
    <html>
      <head><title>Farrow</title></head>
      <body><h1>Hello Farrow!</h1></body>
    </html>
  `)
})

// Empty response (204 No Content)
app.delete('/items/<id:int>').use((request) => {
  deleteItem(request.params.id)
  return Response.empty()
})
```

### File Responses

```typescript
// Send file
app.get('/download/<filename:string>').use((request) => {
  const filepath = path.join('./uploads', request.params.filename)
  return Response.file(filepath)
})

// File download (with attachment name)
app.get('/export').use(() => {
  return Response
    .file('./data/export.csv')
    .attachment('report-2024.csv')  // Set download filename
})

// Inline display (e.g., PDF)
app.get('/preview/<id:int>').use((request) => {
  const file = getFile(request.params.id)
  return Response
    .file(file.path)
    .header('Content-Disposition', 'inline')
})
```

### Redirects

```typescript
// Basic redirect
app.get('/old-path').use(() => {
  return Response.redirect('/new-path')
})

// Permanent redirect (301)
app.get('/permanent').use(() => {
  return Response.redirect('/new-location', { 
    status: 301 
  })
})

// External redirect
app.get('/external').use(() => {
  return Response.redirect('https://example.com', {
    usePrefix: false  // Don't use application prefix
  })
})
```

### Chainable Response Building

```typescript
// Chain response properties
app.post('/api/users').use((request) => {
  const user = createUser(request.body)
  
  return Response
    .json(user)
    .status(201)
    .header('Location', `/api/users/${user.id}`)
    .header('X-Total-Count', '100')
    .cookie('lastUserId', user.id, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 86400000  // 24 hours
    })
    .vary('Accept-Encoding')
})

// Set multiple cookies
app.get('/login').use(() => {
  return Response
    .json({ message: 'Logged in' })
    .cookie('sessionId', generateSessionId(), {
      httpOnly: true,
      secure: true
    })
    .cookie('username', 'john', {
      maxAge: 86400000
    })
})
```

### Response Merging - Response.merge

`Response.merge` allows you to merge properties from multiple responses, which is particularly useful in middleware composition:

#### ⚠️ Response Merge Considerations

Due to an initial design oversight, you need to be careful about order when merging responses:

```typescript
// ⚠️ Important: Response.merge follows "later overrides former" principle

// ❌ Wrong: putting response with body first, will be overridden by empty body
Response.text('Hello').merge(Response.cookie('token', '123'))
// Result: only cookie, text content lost!

// ✅ Correct: chain calls
Response.text('Hello').cookie('token', '123')

// ✅ Correct: empty response first, response with body last
Response.cookie('token', '123').merge(Response.text('Hello'))
```

```typescript
// Basic usage of Response.merge
app.get('/api/data').use(() => {
  const headersResponse = Response
    .header('X-Custom', 'value')
    .header('X-Request-ID', generateId())
  const dataResponse = Response.json({ data: 'value' })
  
  // Correct: headers response (empty body) first, data response (with body) last
  return headersResponse.merge(dataResponse)
})

// Using Response.merge in middleware
const addSecurityHeaders = (request, next) => {
  const response = next(request)
  
  // Create response with security headers (empty body)
  const securityHeaders = Response
    .header('X-Content-Type-Options', 'nosniff')
    .header('X-Frame-Options', 'DENY')
    .header('X-XSS-Protection', '1; mode=block')
  
  // Correct: security headers (empty body) first, original response last
  return securityHeaders.merge(response)
}

// Conditional response merging
app.get('/api/profile').use((request) => {
  const user = getUserProfile()
  const baseResponse = Response.json(user)
  
  // Add additional response properties based on condition
  if (user.isAdmin) {
    const adminHeaders = Response.header('X-Admin-Access', 'true')
    return adminHeaders.merge(baseResponse)  // Correct: empty body first
  }
  
  return baseResponse
})

// Merge multiple responses
app.get('/api/resource').use(() => {
  const data = Response.json({ result: 'success' })
  const status = Response.status(201)
  const headers = Response
    .header('Location', '/api/resource/123')
    .header('X-Resource-ID', '123')
  const cookies = Response.cookie('lastResourceId', '123')
  
  // Correct: put response with body last
  return Response.merge(status, headers, cookies, data)
})
```

### Stream Responses

```typescript
import { Readable } from 'stream'

// Send stream
app.get('/stream').use(() => {
  const stream = fs.createReadStream('./large-file.json')
  
  return Response
    .stream(stream)
    .header('Content-Type', 'application/json')
    .header('Transfer-Encoding', 'chunked')
})

// Server-Sent Events (SSE)
app.get('/events').use(() => {
  const stream = new Readable({
    read() {
      // Send an event every second
      const interval = setInterval(() => {
        this.push(`data: ${JSON.stringify({ time: Date.now() })}\n\n`)
      }, 1000)
      
      // End after 10 seconds
      setTimeout(() => {
        clearInterval(interval)
        this.push(null)
      }, 10000)
    }
  })
  
  return Response
    .stream(stream)
    .header('Content-Type', 'text/event-stream')
    .header('Cache-Control', 'no-cache')
    .header('Connection', 'keep-alive')
})
```

## Context System

### Creating and Using Context

```typescript
import { createContext } from 'farrow-pipeline'

// Create various Contexts
const UserContext = createContext<User | null>(null)
const DatabaseContext = createContext<Database>()
const RequestIdContext = createContext<string>('')
const ConfigContext = createContext({
  apiUrl: 'https://api.example.com',
  timeout: 5000
})

// Set Context in middleware
app.use((request, next) => {
  // Set request ID
  const requestId = crypto.randomUUID()
  RequestIdContext.set(requestId)
  
  // Set database connection
  const db = createDatabaseConnection()
  DatabaseContext.set(db)
  
  // Continue processing
  const response = next(request)
  
  // Cleanup (if needed)
  db.close()
  
  return response
})

// Use Context in routes
app.get('/profile').use(() => {
  const user = UserContext.get()
  const db = DatabaseContext.get()
  const requestId = RequestIdContext.get()
  
  if (!user) {
    return Response.status(401).json({ 
      error: 'Not authenticated',
      requestId 
    })
  }
  
  const profile = db.getProfile(user.id)
  
  return Response
    .json(profile)
    .header('X-Request-ID', requestId)
})
```

### Custom Hooks

```typescript
// Create reusable Hooks
function useCurrentUser() {
  const user = UserContext.get()
  if (!user) {
    throw new HttpError('Authentication required', 401)
  }
  return user
}

function useDatabase() {
  const db = DatabaseContext.get()
  if (!db) {
    throw new Error('Database not initialized')
  }
  return db
}

function useRequestId() {
  return RequestIdContext.get()
}

// Compose Hooks
function useAuthenticatedRequest() {
  const user = useCurrentUser()
  const db = useDatabase()
  const requestId = useRequestId()
  
  return { user, db, requestId }
}

// Use Hooks in routes
app.get('/api/posts').use(() => {
  const { user, db } = useAuthenticatedRequest()
  
  const posts = db.getPostsByUser(user.id)
  
  return Response.json(posts)
})

app.post('/api/posts', {
  body: CreatePostSchema
}).use((request) => {
  const { user, db } = useAuthenticatedRequest()
  
  const post = db.createPost({
    ...request.body,
    authorId: user.id
  })
  
  return Response.status(201).json(post)
})
```

### Context Isolation

```typescript
// Each request has independent Context
const CounterContext = createContext(0)

app.use((request, next) => {
  // Each request starts from 0
  CounterContext.set(0)
  return next(request)
})

app.use((request, next) => {
  const count = CounterContext.get()
  CounterContext.set(count + 1)
  console.log(`Middleware 1: ${count + 1}`)
  return next(request)
})

app.use((request, next) => {
  const count = CounterContext.get()
  CounterContext.set(count + 1)
  console.log(`Middleware 2: ${count + 1}`)
  return next(request)
})

// Concurrent requests don't affect each other
// Request A: Middleware 1: 1, Middleware 2: 2
// Request B: Middleware 1: 1, Middleware 2: 2
```

## Error Handling

### Using HttpError

```typescript
import { HttpError } from 'farrow-http'

// Basic HttpError
app.get('/users/<id:int>').use((request) => {
  const user = getUser(request.params.id)
  
  if (!user) {
    throw new HttpError('User not found', 404)
  }
  
  return Response.json(user)
})

// Custom error classes
class ValidationError extends HttpError {
  constructor(
    public field: string,
    message: string
  ) {
    super(message, 400)
    this.name = 'ValidationError'
  }
}

class UnauthorizedError extends HttpError {
  constructor(message = 'Unauthorized') {
    super(message, 401)
    this.name = 'UnauthorizedError'
  }
}

class ForbiddenError extends HttpError {
  constructor(resource: string) {
    super(`Access to ${resource} is forbidden`, 403)
    this.name = 'ForbiddenError'
  }
}

// Using custom errors
app.post('/posts').use((request) => {
  if (!request.body.title) {
    throw new ValidationError('title', 'Title is required')
  }
  
  const user = useCurrentUser()
  if (!user.canCreatePost) {
    throw new ForbiddenError('posts')
  }
  
  // ...
})
```

### Global Error Handling

```typescript
// Error handling middleware (put at the beginning) - uniformly use async/await
app.use(async (request, next) => {
  try {
    return await next(request)
  } catch (error) {
    // Handle all errors (synchronous and asynchronous)
    return handleError(error)
  }
})

// Handle async errors
app.use(async (request, next) => {
  try {
    const response = await next(request)
    return response
  } catch (error) {
    return handleError(error)
  }
})

function handleError(error: unknown): Response {
  // Known HTTP errors
  if (error instanceof HttpError) {
    return Response.status(error.status).json({
      error: error.message,
      status: error.status
    })
  }
  
  // Validation errors
  if (error instanceof ValidationError) {
    return Response.status(400).json({
      error: 'Validation failed',
      field: error.field,
      message: error.message
    })
  }
  
  // Database errors
  if (error instanceof DatabaseError) {
    console.error('Database error:', error)
    return Response.status(503).json({
      error: 'Service temporarily unavailable'
    })
  }
  
  // Unknown errors
  console.error('Unexpected error:', error)
  
  if (process.env.NODE_ENV === 'production') {
    return Response.status(500).json({
      error: 'Internal server error'
    })
  } else {
    // Return detailed error in development
    return Response.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    })
  }
}
```

### Schema Validation Error Handling

```typescript
// Global Schema error handling
app.match({
  url: '/<path*:string>',
  onSchemaError: (error, input, next) => {
    const field = error.path?.join('.')
    
    return Response.status(400).json({
      error: 'Validation failed',
      details: {
        field,
        message: error.message,
        value: error.value
      }
    })
  }
})

// Specific route error handling
app.post('/users', {
  body: CreateUserSchema
}, {
  onSchemaError: (error, input, next) => {
    // Custom error response
    if (error.path?.includes('email')) {
      return Response.status(400).json({
        error: 'Invalid email address',
        suggestion: 'Please use a valid email format'
      })
    }
    
    return Response.status(400).json({
      error: error.message
    })
  }
})
```

## Practical Example: Building a Complete Blog API

Let's apply all the knowledge we've learned to build a complete blog API:

```typescript
import { Http, Response, Router, HttpError } from 'farrow-http'
import { ObjectType, String, Number, Boolean, Date, List, Optional, TypeOf, Union, Literal } from 'farrow-schema'
import { createContext } from 'farrow-pipeline'
import { Validator, ValidatorType } from 'farrow-schema/validator'

// ========== Schema Definitions ==========

// Custom validators
class EmailType extends ValidatorType<string> {
  validate(input: unknown) {
    const result = Validator.validate(String, input)
    if (result.isErr) return result
    
    if (!input.includes('@')) {
      return this.Err('Invalid email')
    }
    
    return this.Ok(result.value)
  }
}

const StringLength = (min: number, max: number) => {
  return class extends ValidatorType<string> {
    validate(input: unknown) {
      const result = Validator.validate(String, input)
      if (result.isErr) return result
      
      if (result.value.length < min || result.value.length > max) {
        return this.Err(`Length must be ${min}-${max} characters`)
      }
      
      return this.Ok(result.value)
    }
  }
}

// Data models
class User extends ObjectType {
  id = Number
  username = StringLength(3, 20)
  email = EmailType
  role = Union(Literal('admin'), Literal('author'), Literal('reader'))
  createdAt = Date
}

class BlogPost extends ObjectType {
  id = Number
  title = StringLength(1, 200)
  slug = String
  content = String
  excerpt = Optional(String)
  authorId = Number
  published = Boolean
  tags = List(String)
  createdAt = Date
  updatedAt = Date
}

class Comment extends ObjectType {
  id = Number
  postId = Number
  content = StringLength(1, 1000)
  authorName = String
  authorEmail = EmailType
  createdAt = Date
}

// API request/response schemas
const CreatePostRequest = pickObject(BlogPost, ['title', 'content', 'excerpt', 'tags'])
const UpdatePostRequest = partial(CreatePostRequest)
const PostResponse = omitObject(BlogPost, ['authorId'])

// ========== Context ==========

const UserContext = createContext<User | null>(null)
const DatabaseContext = createContext<Database>()

// ========== Custom Hooks ==========

function useCurrentUser() {
  const user = UserContext.get()
  if (!user) {
    throw new HttpError('Authentication required', 401)
  }
  return user
}

function useDatabase() {
  const db = DatabaseContext.get()
  if (!db) {
    throw new Error('Database not initialized')
  }
  return db
}

// ========== Middleware ==========

// Logging middleware
const logger = (request, next) => {
  const start = Date.now()
  console.log(`→ ${request.method} ${request.pathname}`)
  
  const response = next(request)
  
  const duration = Date.now() - start
  console.log(`← ${response.info.status?.code} (${duration}ms)`)
  
  return response
}

// Authentication middleware
const authenticate = (request, next) => {
  const token = request.headers?.authorization?.replace('Bearer ', '')
  
  if (!token) {
    return next(request)  // Continue, but don't set user
  }
  
  try {
    const user = verifyToken(token)
    UserContext.set(user)
  } catch {
    // Invalid token, continue but don't set user
  }
  
  return next(request)
}

// Require authentication middleware
const requireAuth = (request, next) => {
  const user = UserContext.get()
  
  if (!user) {
    return Response.status(401).json({ error: 'Authentication required' })
  }
  
  return next(request)
}

// Require specific role
const requireRole = (role: string) => (request, next) => {
  const user = useCurrentUser()
  
  if (user.role !== role && user.role !== 'admin') {
    return Response.status(403).json({ error: 'Insufficient permissions' })
  }
  
  return next(request)
}

// ========== Routes ==========

const app = Http()

// Global middleware
app.use(logger)
app.use(authenticate)

// Public routes
app.get('/').use(() => {
  return Response.json({ 
    message: 'Blog API',
    version: '1.0.0'
  })
})

// Post routes
const postsRouter = Router()

// Get post list
postsRouter.get('/?<page?:int>&<limit?:int>&<tag?:string>').use((request) => {
  const { page = 1, limit = 10, tag } = request.query
  const db = useDatabase()
  
  const posts = db.getPosts({ page, limit, tag })
  const total = db.getPostCount({ tag })
  
  return Response.json({
    posts,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  })
})

// Get single post
postsRouter.get('/<id:int>').use((request) => {
  const db = useDatabase()
  const post = db.getPost(request.params.id)
  
  if (!post) {
    throw new HttpError('Post not found', 404)
  }
  
  return Response.json(post)
})

// Create post (requires authentication + author role)
postsRouter.post('/', {
  body: CreatePostRequest
})
  .use(requireAuth)
  .use(requireRole('author'))
  .use((request) => {
    const user = useCurrentUser()
    const db = useDatabase()
    
    const post = db.createPost({
      ...request.body,
      authorId: user.id,
      slug: generateSlug(request.body.title),
      published: false,
      createdAt: new Date(),
      updatedAt: new Date()
    })
    
    return Response
      .status(201)
      .json(post)
      .header('Location', `/api/posts/${post.id}`)
  })

// Update post
postsRouter.put('/<id:int>', {
  body: UpdatePostRequest
})
  .use(requireAuth)
  .use((request) => {
    const user = useCurrentUser()
    const db = useDatabase()
    const post = db.getPost(request.params.id)
    
    if (!post) {
      throw new HttpError('Post not found', 404)
    }
    
    // Only author or admin can edit
    if (post.authorId !== user.id && user.role !== 'admin') {
      throw new HttpError('Forbidden', 403)
    }
    
    const updated = db.updatePost(request.params.id, {
      ...request.body,
      updatedAt: new Date()
    })
    
    return Response.json(updated)
  })

// Delete post
postsRouter.delete('/<id:int>')
  .use(requireAuth)
  .use((request) => {
    const user = useCurrentUser()
    const db = useDatabase()
    const post = db.getPost(request.params.id)
    
    if (!post) {
      throw new HttpError('Post not found', 404)
    }
    
    if (post.authorId !== user.id && user.role !== 'admin') {
      throw new HttpError('Forbidden', 403)
    }
    
    db.deletePost(request.params.id)
    
    return Response.empty()
  })

// Comment routes
const commentsRouter = Router()

// Get post comments
commentsRouter.get('/posts/<postId:int>/comments').use((request) => {
  const db = useDatabase()
  const comments = db.getCommentsByPost(request.params.postId)
  
  return Response.json(comments)
})

// Add comment
commentsRouter.post('/posts/<postId:int>/comments', {
  body: {
    content: StringLength(1, 1000),
    authorName: String,
    authorEmail: EmailType
  }
}).use((request) => {
  const db = useDatabase()
  
  const comment = db.createComment({
    postId: request.params.postId,
    ...request.body,
    createdAt: new Date()
  })
  
  return Response.status(201).json(comment)
})

// Compose routes
app.route('/api/posts').use(postsRouter)
app.route('/api').use(commentsRouter)

// Error handling
app.use(async (request, next) => {
  try {
    return await next(request)
  } catch (error) {
    if (error instanceof HttpError) {
      return Response.status(error.status).json({
        error: error.message
      })
    }
    
    console.error(error)
    return Response.status(500).json({
      error: 'Internal server error'
    })
  }
})

// Start server
app.listen(3000, () => {
  console.log('Blog API running on http://localhost:3000')
})
```

## Performance Optimization Tips

### 1. Schema Reuse

```typescript
// ✅ Good: Reuse Schema definitions
const UpdateUserSchema = partial(User)
app.post('/users', { body: User })
app.patch('/users/<id:int>', { body: UpdateUserSchema })

// ❌ Avoid: Duplicate definitions of same structure
app.post('/users', { body: { name: String, email: String } })
app.put('/users/<id:int>', { body: { name: String, email: String } })
```

### 2. Middleware Order

```typescript
// ✅ Good: Fast-failing middleware first
app.use(rateLimit())     // Quick check
app.use(authenticate)     // May query database
app.use(loadUserData)     // Heavy operations last

// ❌ Avoid: Heavy operations first
app.use(loadUserData)     // Executed for every request
app.use(rateLimit())      // May reject directly
```

### 3. Context Usage

```typescript
// ✅ Good: Only read Context when needed
app.get('/public').use(() => {
  // Don't need user info, don't read UserContext
  return Response.json({ message: 'Public data' })
})

// ❌ Avoid: Unnecessary Context reads
app.get('/public').use(() => {
  const user = UserContext.get()  // Not needed but read anyway
  return Response.json({ message: 'Public data' })
})
```

## Summary

Through this chapter, you have mastered:

✅ **Routing System** - Type-safe parameters, query strings, route organization  
✅ **Schema System** - Definition, validation, custom validators  
✅ **Middleware** - Authentication, logging, CORS, rate limiting, etc.  
✅ **Response Building** - JSON, files, redirects, stream responses  
✅ **Context** - State management, custom Hooks  
✅ **Error Handling** - HttpError, global error handling  

You now have all the skills needed for daily Farrow development!

## Next Steps

<div class="next-steps-grid">

🔧 **[Components In-Depth](./04-components-in-depth.md)**  
Deep dive into advanced features of Schema, Pipeline, Context

⚡ **[Advanced Techniques](./05-advanced.md)**  
Learn advanced patterns and best practices

🚀 **[Practical Projects](./examples/)**  
Consolidate your learning through complete projects

</div>

---

<div class="doc-footer">
  <div class="doc-nav">
    <a href="./02-core-concepts.md">← Core Concepts</a>
    <a href="./04-components-in-depth.md">Components In-Depth →</a>
  </div>
</div>