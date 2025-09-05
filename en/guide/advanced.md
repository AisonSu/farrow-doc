# Farrow Advanced Tutorial

> Master advanced features and APIs of the Farrow framework

## Overview

This tutorial will dive deep into the advanced features and APIs of the Farrow framework, helping you fully leverage the framework's capabilities.

**Learning Objectives:**
- Master advanced APIs of farrow-pipeline
- Understand extended features of farrow-schema
- Familiarize with complete features of farrow-http
- Understand the design philosophy of each module

## Table of Contents

### farrow-pipeline Advanced Features
- [Container: Understanding Context Isolation](#container-understanding-context-isolation)
- [usePipeline: Maintaining Container Inheritance](#usepipeline-maintaining-container-inheritance)
- [AsyncPipeline.useLazy: Lazy Loading](#asyncpipelineuselazy-lazy-loading)

### farrow-schema Advanced Features
- [Validator.validate: Manual Validation](#validatorvalidate-manual-validation)
- [ValidatorType: Custom Validators](#validatortype-custom-validators)

### farrow-http Advanced Features
- [Response.capture: Global Response Interception](#responsecapture-global-response-interception)
- [Response.custom: Low-level Response Control](#responsecustom-low-level-response-control)
- [Http Constructor Options: Advanced Configuration](#http-constructor-options-advanced-configuration)
- [Router Advanced Features](#router-advanced-features)
- [Error Boundaries and Recovery](#error-boundaries-and-recovery)
- [Advanced Middleware Patterns](#advanced-middleware-patterns)

---

## farrow-pipeline Advanced Features

### Container: Understanding Context Isolation

Before diving into `usePipeline`, we need to understand Farrow's Container concept.

#### What is Container?

Container is Farrow's internal mechanism for managing Context storage and isolation. Each time `pipeline.run()` is called, a new Container is created, containing all Context state for that execution.

```typescript
import { createPipeline, createContext } from 'farrow-pipeline'

const UserContext = createContext<{ name: string } | null>(null)

const pipeline = createPipeline<void, string>()

pipeline.use((input, next) => {
  UserContext.set({ name: 'John' })
  console.log('Set user:', UserContext.get()) // { name: 'John' }
  return next('Processing complete')
})

// Each run creates a new Container
pipeline.run() // Container A: UserContext = { name: 'John' }
pipeline.run() // Container B: UserContext = { name: 'John' } (independent container)
```

#### Container Isolation Features

Different Pipeline executions are completely isolated:

```typescript
const pipeline1 = createPipeline<void, void>()
const pipeline2 = createPipeline<void, void>()

pipeline1.use((input, next) => {
  UserContext.set({ name: 'Alice' })
  console.log('Pipeline1 user:', UserContext.get()) // { name: 'Alice' }
  return next()
})

pipeline2.use((input, next) => {
  console.log('Pipeline2 user:', UserContext.get()) // null (different Container)
  return next()
})

pipeline1.run() // Executes in Container A
pipeline2.run() // Executes in Container B, cannot access Container A's state
```

### usePipeline: Maintaining Container Inheritance

Now that we understand Container isolation issues, the purpose of `usePipeline` is clear: it allows sub-Pipelines to inherit the current Container instead of creating a new one.

#### Problem Demo: Why usePipeline is Needed?

```typescript
const UserContext = createContext<{ id: string } | null>(null)

const authPipeline = createPipeline<{ token: string }, { userId: string }>()
authPipeline.use((input, next) => {
  const userId = validateToken(input.token)
  UserContext.set({ id: userId }) // Set user context
  return next({ userId })
})

const dataPipeline = createPipeline<{ userId: string }, { data: any }>()
dataPipeline.use((input, next) => {
  const user = UserContext.get() // Try to get user context
  console.log('Current user:', user) // What will this output?
  return next({ data: 'some data' })
})

const mainPipeline = createPipeline<{ token: string }, { data: any }>()

// ❌ Wrong way: directly calling run()
mainPipeline.use((input, next) => {
  const authResult = authPipeline.run(input)    // Creates new Container A
  const dataResult = dataPipeline.run(authResult) // Creates new Container B
  
  // UserContext.get() in dataPipeline returns null!
  // Because Container B doesn't have UserContext state
  
  return next(dataResult)
})
```

#### usePipeline Solution

```typescript
// ✅ Correct way: using usePipeline
mainPipeline.use((input, next) => {
  const runAuth = usePipeline(authPipeline)  // Inherits current Container
  const runData = usePipeline(dataPipeline)  // Inherits current Container
  
  const authResult = runAuth(input)    // Executes in current Container
  const dataResult = runData(authResult) // Executes in same Container
  
  // UserContext.get() in dataPipeline can correctly get user info!
  
  return next(dataResult)
})

// Complete example
const completeExample = createPipeline<{ token: string }, string>()
completeExample.use((input, next) => {
  console.log('Main process started')
  
  const runAuth = usePipeline(authPipeline)
  const runData = usePipeline(dataPipeline)
  
  try {
    const authResult = runAuth(input)
    console.log('Authentication complete, user ID:', authResult.userId)
    
    const dataResult = runData(authResult)
    console.log('Data retrieval complete')
    
    return next('Processing successful')
  } catch (error) {
    return next('Processing failed: ' + error.message)
  }
})
```

### Container: Manual Creation and Management

Besides automatically created Containers, you can manually create and manage Containers.

#### Creating and Using Container

```typescript
import { createContainer, createContext } from 'farrow-pipeline'

const DatabaseContext = createContext<Database>(defaultDB)
const ConfigContext = createContext<Config>(defaultConfig)

// Create dedicated container
const testContainer = createContainer({
  db: DatabaseContext.create(mockDatabase),
  config: ConfigContext.create(testConfig)
})

// Run in specific container
const result = pipeline.run(input, { container: testContainer })
```

#### Multi-environment Configuration Example

```typescript
const environments = {
  development: createContainer({
    db: DatabaseContext.create(devDB),
    config: ConfigContext.create(devConfig)
  }),
  production: createContainer({
    db: DatabaseContext.create(prodDB),
    config: ConfigContext.create(prodConfig)
  }),
  test: createContainer({
    db: DatabaseContext.create(mockDB),
    config: ConfigContext.create(testConfig)
  })
}

const currentContainer = environments[process.env.NODE_ENV] || environments.development
const result = pipeline.run(input, { container: currentContainer })
```

### AsyncPipeline.useLazy: Lazy Loading

`useLazy` allows lazy loading of middleware, suitable for conditional or heavy dependencies.

```typescript
import { createAsyncPipeline } from 'farrow-pipeline'

const pipeline = createAsyncPipeline<Request, Response>()

// Lazy load middleware
pipeline.useLazy(async () => {
  // Only loads when actually needed
  const heavyLibrary = await import('heavy-library')
  
  return async (input, next) => {
    if (shouldUseHeavyLibrary(input)) {
      const result = await heavyLibrary.process(input)
      return { ...input, processed: result }
    }
    return next(input)
  }
})

// Conditional loading
pipeline.useLazy(async () => {
  const feature = await getFeatureFlag('advanced-processing')
  
  if (feature.enabled) {
    const processor = await import('./advanced-processor')
    return processor.middleware
  }
  
  // Return pass-through middleware
  return (input, next) => next(input)
})
```

---

## farrow-schema Advanced Features

### Validator.validate: Manual Validation

Besides automatic validation, you can manually use Validator for data validation.

```typescript
import { Validator } from 'farrow-schema/validator'
import { ObjectType, String, Number } from 'farrow-schema'

class User extends ObjectType {
  name = String
  age = Number
}

// Manual validation
const result = Validator.validate(User, {
  name: "John",
  age: 25
})

if (result.isOk) {
  console.log('Validation successful:', result.value)
} else {
  console.log('Validation failed:', result.value.message)
}
```

#### Batch Validation

```typescript
function validateBatch<T>(schema: any, dataList: unknown[]): {
  valid: T[]
  invalid: Array<{ index: number, error: string, data: unknown }>
} {
  const results = dataList.map((data, index) => ({
    index,
    data,
    result: Validator.validate(schema, data)
  }))
  
  return {
    valid: results.filter(r => r.result.isOk).map(r => r.result.value),
    invalid: results.filter(r => r.result.isErr).map(r => ({
      index: r.index,
      error: r.result.value.message,
      data: r.data
    }))
  }
}
```

### ValidatorType: Custom Validators

Create custom validation logic validators.

```typescript
import { ValidatorType, Validator } from 'farrow-schema/validator'

class EmailType extends ValidatorType<string> {
  validate(input: unknown) {
    const stringResult = Validator.validate(String, input)
    if (stringResult.isErr) {
      return this.Err('Must be a string')
    }
    
    const email = stringResult.value
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    
    if (!emailRegex.test(email)) {
      return this.Err('Invalid email format')
    }
    
    return this.Ok(email)
  }
}

// Use custom validator
class UserSchema extends ObjectType {
  email = new EmailType()
  name = String
}
```

#### Parameterized Validators

```typescript
class StringLengthType extends ValidatorType<string> {
  constructor(private min: number, private max: number) {
    super()
  }
  
  validate(input: unknown) {
    const result = Validator.validate(String, input)
    if (result.isErr) return result
    
    const str = result.value
    if (str.length < this.min || str.length > this.max) {
      return this.Err(`Length must be between ${this.min}-${this.max}`)
    }
    
    return this.Ok(str)
  }
}

// Factory function
const StringLength = (min: number, max: number) => new StringLengthType(min, max)

class Article extends ObjectType {
  title = StringLength(5, 100)
  content = StringLength(50, 5000)
}
```

---

## farrow-http Advanced Features

### Response.capture: Global Response Interception

`capture` allows you to intercept and transform specific response types, implementing global response format unification.

#### Basic Response Interception

```typescript
import { Http, Response } from 'farrow-http'

const app = Http()

// Intercept all JSON responses for unified format
app.capture('json', (jsonBody) => {
  return Response.json({
    success: true,
    data: jsonBody.value,
    timestamp: new Date().toISOString(),
    version: 'v1'
  })
})

// Now all JSON responses will be automatically wrapped
app.get('/users').use(() => {
  return Response.json({ users: ['Alice', 'Bob'] })
  // Actual response:
  // {
  //   "success": true,
  //   "data": { "users": ["Alice", "Bob"] },
  //   "timestamp": "2024-01-01T00:00:00.000Z",
  //   "version": "v1"
  // }
})
```

#### Multiple Response Type Interception

```typescript
// Intercept file responses, add cache headers
app.capture('file', (fileBody) => {
  return Response.file(fileBody.value, fileBody.options)
    .header('Cache-Control', 'public, max-age=31536000')
    .header('X-Served-By', 'Farrow-HTTP')
})

// Intercept HTML responses, inject security headers
app.capture('html', (htmlBody) => {
  return Response.html(htmlBody.value)
    .header('X-Content-Type-Options', 'nosniff')
    .header('X-Frame-Options', 'DENY')
    .header('Content-Security-Policy', "default-src 'self'")
})

// Intercept text responses
app.capture('text', (textBody) => {
  return Response.text(textBody.value)
    .header('X-Content-Type', 'text/plain')
})

// Intercept redirect responses
app.capture('redirect', (redirectBody) => {
  return Response.redirect(redirectBody.url, redirectBody.options)
    .header('X-Redirect-Reason', 'API-Redirect')
})
```

### Response.custom: Low-level Response Control

`Response.custom` provides direct access to Node.js native `req` and `res` objects for implementing needs that standard response types cannot meet.

#### Server-Sent Events (SSE) Implementation

```typescript
app.get('/events').use(() => {
  return Response.custom(({ req, res }) => {
    // Set SSE response headers
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*'
    })
    
    // Send initial connection event
    res.write('event: connected\n')
    res.write(`data: ${JSON.stringify({ time: Date.now() })}\n\n`)
    
    // Send data periodically
    const interval = setInterval(() => {
      res.write('event: heartbeat\n')
      res.write(`data: ${JSON.stringify({ time: Date.now() })}\n\n`)
    }, 1000)
    
    // Clean up connection
    req.on('close', () => {
      clearInterval(interval)
      console.log('SSE connection closed')
    })
    
    req.on('error', (err) => {
      console.error('SSE error:', err)
      clearInterval(interval)
    })
  })
})
```

#### Long Polling Implementation

```typescript
const pendingRequests = new Map()

app.get('/poll/<channelId:string>').use((request) => {
  const { channelId } = request.params
  const timeout = parseInt(request.query.timeout) || 30000
  
  return Response.custom(({ req, res }) => {
    const requestId = Math.random().toString(36)
    
    // Check if data is immediately available
    const immediateData = checkForData(channelId)
    if (immediateData) {
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ data: immediateData }))
      return
    }
    
    // Save pending request
    pendingRequests.set(requestId, { res, channelId })
    
    // Set timeout
    const timer = setTimeout(() => {
      pendingRequests.delete(requestId)
      res.writeHead(204) // No Content
      res.end()
    }, timeout)
    
    // Clean up when client disconnects
    req.on('close', () => {
      clearTimeout(timer)
      pendingRequests.delete(requestId)
    })
  })
})

// Notify all waiting requests when new data arrives
function notifyChannel(channelId: string, data: any) {
  for (const [requestId, { res, channelId: reqChannelId }] of pendingRequests) {
    if (reqChannelId === channelId) {
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ data }))
      pendingRequests.delete(requestId)
    }
  }
}
```

#### Chunked Transfer Implementation

```typescript
app.get('/large-data').use(() => {
  return Response.custom(({ req, res }) => {
    res.writeHead(200, {
      'Content-Type': 'application/json',
      'Transfer-Encoding': 'chunked'
    })
    
    // Start JSON array
    res.write('{"items":[')
    
    let first = true
    const totalItems = 10000
    
    // Process large amounts of data in batches
    function sendBatch(startIndex: number) {
      const batchSize = 100
      const endIndex = Math.min(startIndex + batchSize, totalItems)
      
      for (let i = startIndex; i < endIndex; i++) {
        if (!first) res.write(',')
        first = false
        
        res.write(JSON.stringify({
          id: i,
          data: `Item ${i}`,
          timestamp: Date.now()
        }))
      }
      
      if (endIndex < totalItems) {
        // Asynchronously process next batch
        setImmediate(() => sendBatch(endIndex))
      } else {
        // End JSON array
        res.write(']}')
        res.end()
      }
    }
    
    sendBatch(0)
  })
})
```

### Http Constructor Options: Advanced Configuration

#### basenames: Route Prefixes

```typescript
// Support multiple basenames
const app = Http({
  basenames: ['/api', '/v1', '/app']
})

// This route will match multiple paths:
// /api/users, /v1/users, /app/users
app.get('/users').use(() => Response.json({ users: [] }))
```

#### logger: Custom Logging

```typescript
const app = Http({
  logger: false  // Disable default logging
})

// Or custom logging
const app = Http({
  logger: {
    info: (message) => console.log(`INFO: ${message}`),
    warn: (message) => console.warn(`WARN: ${message}`),
    error: (message) => console.error(`ERROR: ${message}`)
  }
})
```

### Router Advanced Features

#### Router.match: Pattern Matching

```typescript
import { Router } from 'farrow-http'
import { String, Literal } from 'farrow-schema'

const router = Router()

// Complex matching using match
router.match({
  url: '/admin/<path+:string>',  // One or more path segments
  method: ['GET', 'POST']  // Only match GET and POST
}).use((request, next) => {
  // Admin route preprocessing
  const user = UserContext.get()
  if (!user || user.role !== 'admin') {
    return Response.status(403).json({ error: 'Admin required' })
  }
  
  // Access path parameters
  const adminPath = request.params.path  // string[] type
  console.log('Admin accessing:', adminPath.join('/'))
  
  return next(request)
})

// Complex matching conditions - headers using Schema
router.match({
  url: '/api/<segments*:string>',  // Zero or more path segments
  headers: {
    'content-type': Literal('application/json')  // Using Schema definition
  }
}).use((request, next) => {
  // Only handle JSON requests
  const apiSegments = request.params.segments  // string[] | undefined type
  console.log('API path segments:', apiSegments)
  
  return next(request)
})

// More complex matching example
router.match({
  url: '/api/<version:string>/users',  // Match any version path segment
  method: ['POST', 'PUT'],
  headers: {
    'authorization': String,  // Required auth header
    'content-type': Literal('application/json')
  },
  body: {
    name: String,
    email: String
  }
}).use((request, next) => {
  // All conditions met to execute here
  const { version } = request.params  // string type
  const { authorization } = request.headers
  const { name, email } = request.body
  
  console.log('API version:', version)
  return next(request)
})

// To match specific version values, use Literal union types
router.post('/api/<version:v1|v2>/users', {
  headers: {
    'authorization': String,
    'content-type': Literal('application/json')
  },
  body: {
    name: String,
    email: String
  }
}).use((request, next) => {
  // Get type-safe route parameters here
  const { version } = request.params  // 'v1' | 'v2' type
  const { authorization } = request.headers
  const { name, email } = request.body
  
  return next(request)
})
```

#### Router.use Advanced Usage

```typescript
const router = Router()

// Path matching middleware
router.use('/public/<path*:string>', (request, next) => {
  // Middleware effective only for /public/* paths
  return next(request)
})

// Method filtering - judge within middleware
router.use((request, next) => {
  // Middleware effective only for write operations
  if (request.method === 'POST' || request.method === 'PUT' || request.method === 'PATCH') {
    // Execute write operation related logic
    console.log('Processing write operation:', request.method)
  }
  return next(request)
})

// Combined conditions - use match for compound matching
router.match({
  url: '/api/v2/<path*:string>',
  method: 'POST',
  headers: { 'authorization': String }
}).use((request, next) => {
  // Compound condition matching
  return next(request)
})
```

### Error Boundaries and Recovery

#### onSchemaError: Schema Error Handling

```typescript
// Global Schema error handling
app.match({
  url: '/<path*:string>'  // Match all paths
}, {
  onSchemaError: (error, request, next) => {
    console.error('Schema validation failed:', error)
    
    return Response.status(400).json({
      error: 'Validation Error',
      details: {
        path: error.path?.join('.'),
        message: error.message,
        received: typeof error.value
      }
    })
  }
})

// Specific route Schema error handling
app.post('/users', {
  body: { email: String, password: String }
}, {
  onSchemaError: (error, request, next) => {
    if (error.path?.includes('email')) {
      return Response.status(400).json({
        error: 'Invalid email address'
      })
    }
    
    if (error.path?.includes('password')) {
      return Response.status(400).json({
        error: 'Password is required'
      })
    }
    
    return Response.status(400).json({
      error: 'Invalid request data'
    })
  }
}).use((request) => {
  // Handle valid requests
  return Response.json({ success: true })
})
```

### Advanced Middleware Patterns

#### Conditional Middleware

```typescript
const conditionalMiddleware = (condition: (req: any) => boolean, middleware: any) => {
  return (request, next) => {
    if (condition(request)) {
      return middleware(request, next)
    }
    return next(request)
  }
}

// Usage examples
app.use(
  conditionalMiddleware(
    req => req.method === 'POST',
    rateLimitMiddleware
  )
)

app.use(
  conditionalMiddleware(
    req => req.headers['x-debug'] === 'true',
    debugMiddleware
  )
)
```

#### Async Middleware Composition

```typescript
const asyncMiddleware = (...middlewares) => {
  return async (request, next) => {
    // Execute async middleware sequentially
    let modifiedRequest = request
    
    for (const middleware of middlewares) {
      const result = await middleware(modifiedRequest, (req) => req)
      modifiedRequest = result
    }
    
    return next(modifiedRequest)
  }
}

// Usage
app.use(asyncMiddleware(
  loadUserMiddleware,
  loadPermissionsMiddleware,
  loadPreferencesMiddleware
))
```

---

## Summary

This tutorial introduced the main advanced features of the Farrow framework:

### farrow-pipeline
- **usePipeline**: Context-preserving Pipeline composition
- **Container**: Context isolation and management
- **useLazy**: Lazy loading middleware

### farrow-schema
- **Validator.validate**: Manual data validation
- **ValidatorType**: Custom validators

### farrow-http
- **Response.capture**: Response type interception
- **Response.custom**: Low-level response control
- **Router.route**: Nested routing

These features provide powerful foundational capabilities for building complex applications.

---

## Next Steps

📚 **[API Reference](/api/)**  
Browse complete API documentation

🚀 **[Examples](/examples/)**  
Learn practical techniques through complete projects