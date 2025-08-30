# Farrow Advanced Tutorial

> Explore the advanced features and deep usage of the Farrow framework

## Overview

After mastering the basics of Farrow, this tutorial will take you deep into the framework's advanced features. We will learn:

- farrow-pipeline: Pipeline composition, Context isolation, lazy loading
- farrow-schema: Manual validation, custom validators, Schema transformation
- farrow-http: Response interception, custom responses, response merging

---

## farrow-pipeline Advanced Features

### usePipeline - Pipeline Composition and Reuse

`usePipeline` allows you to call another Pipeline within a Pipeline's middleware, enabling modularization and reuse.

#### Basic Usage

```typescript
import { createPipeline, usePipeline } from 'farrow-pipeline'

// Create independent Pipelines
const validationPipeline = createPipeline<UserInput, ValidatedUser>()
validationPipeline.use((input, next) => {
  if (!input.email?.includes('@')) {
    throw new Error('Invalid email')
  }
  return next({ ...input, validated: true })
})

const transformPipeline = createPipeline<ValidatedUser, ProcessedUser>()
transformPipeline.use((input, next) => {
  return next({
    ...input,
    email: input.email.toLowerCase(),
    createdAt: new Date()
  })
})

// Main Pipeline composing other Pipelines
const mainPipeline = createPipeline<UserInput, Result>()
mainPipeline.use((input, next) => {
  // Use usePipeline to get callable functions
  const validate = usePipeline(validationPipeline)
  const transform = usePipeline(transformPipeline)
  
  try {
    const validated = validate(input)
    const processed = transform(validated)
    return next({ success: true, data: processed })
  } catch (error) {
    return { success: false, error: error.message }
  }
})
```

#### Conditional Pipeline Execution

```typescript
const processingPipeline = createPipeline<Request, Response>()

processingPipeline.use((request, next) => {
  // Choose different processing flows based on conditions
  const pipeline = request.type === 'batch' 
    ? usePipeline(batchPipeline)
    : usePipeline(singlePipeline)
  
  const result = pipeline(request.data)
  return next(result)
})
```

### Container and runWithContainer - Context Isolation

Container provides request-level context isolation, ensuring data between concurrent requests doesn't interfere with each other.

#### Creating Isolated Execution Environment

```typescript
import { createContainer, runWithContainer, createContext } from 'farrow-pipeline'

// Define Contexts
const UserContext = createContext<User | null>(null)
const DatabaseContext = createContext<Database | null>(null)
const LoggerContext = createContext<Logger>(defaultLogger)

// Create independent execution environment for each request
function handleRequest(requestData: RequestData) {
  // Create request-specific Container
  const container = createContainer({
    [UserContext]: requestData.user,
    [DatabaseContext]: createDatabaseConnection(requestData.tenantId),
    [LoggerContext]: createLogger(requestData.requestId)
  })
  
  // Execute business logic in Container environment
  return runWithContainer(() => {
    // All Context access here is isolated
    const user = UserContext.get()
    const db = DatabaseContext.get()
    const logger = LoggerContext.get()
    
    logger.info(`Processing request for user: ${user?.id}`)
    return processBusinessLogic(db, user)
  }, container)
}
```

#### Nested Containers

```typescript
const parentPipeline = createPipeline<Input, Output>()

parentPipeline.use((input, next) => {
  // Parent setup
  ConfigContext.set({ env: 'production' })
  
  // Create child Container, inheriting and extending parent environment
  const childContainer = createContainer({
    [ConfigContext]: { ...ConfigContext.get(), feature: 'enabled' }
  })
  
  // Run in child Container, modifications don't affect parent
  const result = runWithContainer(() => {
    return processInIsolation(input)
  }, childContainer)
  
  return next(result)
})
```

### AsyncPipeline.useLazy - Lazy Loading

`useLazy` allows lazy loading of middleware, optimizing startup time and memory usage.

#### Synchronous Lazy Loading

```typescript
import { createAsyncPipeline } from 'farrow-pipeline'

const pipeline = createAsyncPipeline<Request, Response>()

// Lazy load heavyweight middleware
pipeline.useLazy(() => {
  // This function only executes on first use
  console.log('Loading heavy middleware...')
  const heavyDependency = loadHeavyDependency()
  
  return (input, next) => {
    const processed = heavyDependency.process(input)
    return next(processed)
  }
})

// Conditional loading
pipeline.useLazy(() => {
  if (process.env.FEATURE_FLAG === 'enabled') {
    return featureMiddleware
  }
  // Return pass-through middleware
  return (input, next) => next(input)
})
```

#### Asynchronous Module Loading

```typescript
const apiPipeline = createAsyncPipeline<ApiRequest, ApiResponse>()

// Asynchronously load external modules
apiPipeline.useLazy(async () => {
  // Dynamic import, load only when needed
  const { processPayment } = await import('./payment-processor')
  
  return async (request, next) => {
    if (request.type === 'payment') {
      const result = await processPayment(request.data)
      return { type: 'payment', result }
    }
    return next(request)
  }
})

// Parallel loading of multiple middleware
apiPipeline.useLazy(async () => {
  const [auth, rateLimit, cache] = await Promise.all([
    import('./middleware/auth'),
    import('./middleware/rate-limit'),
    import('./middleware/cache')
  ])
  
  return (request, next) => {
    if (!auth.validate(request)) {
      return { error: 'Unauthorized' }
    }
    
    if (!rateLimit.check(request)) {
      return { error: 'Rate limit exceeded' }
    }
    
    const cached = cache.get(request)
    if (cached) return cached
    
    const response = next(request)
    cache.set(request, response)
    return response
  }
})
```

---

## farrow-schema Advanced Features

### Validator.validate - Manual Validation

`Validator.validate` allows you to manually validate data anywhere, not just limited to HTTP routes.

#### Basic Usage

```typescript
import { Validator } from 'farrow-schema/validator'
import { ObjectType, String, Number, Optional } from 'farrow-schema'

// Define Schema
class UserInput extends ObjectType {
  name = String
  age = Number
  email = String
  bio = Optional(String)
}

// Manually validate data
const data = { name: 'John', age: 25, email: 'john@example.com' }
const result = Validator.validate(UserInput, data)

if (result.isOk) {
  // Validation successful, result.value is type-safe data
  console.log('Valid data:', result.value)
  // result.value type: { name: string; age: number; email: string; bio?: string }
} else {
  // Validation failed, result.value contains error information
  console.error('Validation error:', result.value.message)
  console.error('Error path:', result.value.path)
}
```

#### Using in Business Logic

```typescript
// Process form data
function processForm(input: unknown) {
  const result = Validator.validate(UserInput, input)
  
  if (result.isErr) {
    throw new Error(`Validation failed at ${result.value.path?.join('.')}: ${result.value.message}`)
  }
  
  // Now result.value is type-safe
  return saveToDatabase(result.value)
}

// Batch validation
function validateBatch(items: unknown[]): { valid: any[], invalid: any[] } {
  const results = items.map(item => Validator.validate(UserInput, item))
  
  const valid = results
    .filter(r => r.isOk)
    .map(r => r.value)
  
  const invalid = results
    .filter(r => r.isErr)
    .map((r, index) => ({
      index,
      error: r.value.message,
      path: r.value.path
    }))
  
  return { valid, invalid }
}

// Validate nested data
class OrderSchema extends ObjectType {
  orderId = String
  user = UserInput  // Nested Schema
  items = List({
    productId: String,
    quantity: Number,
    price: Number
  })
}

const orderData = {
  orderId: 'ORD-001',
  user: { name: 'John', age: 25, email: 'john@example.com' },
  items: [
    { productId: 'P1', quantity: 2, price: 99.99 }
  ]
}

const orderResult = Validator.validate(OrderSchema, orderData)
```

### Custom ValidatorType

By extending `ValidatorType`, you can create custom validation logic.

#### Creating Custom Validators

```typescript
import { ValidatorType } from 'farrow-schema/validator'
import { Validator } from 'farrow-schema'

// Email validator
class EmailType extends ValidatorType<string> {
  validate(input: unknown) {
    // First validate basic type
    const stringResult = Validator.validate(String, input)
    if (stringResult.isErr) {
      return this.Err('Email must be a string')
    }
    
    const email = stringResult.value.trim().toLowerCase()
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return this.Err('Invalid email format')
    }
    
    // Return processed value
    return this.Ok(email)
  }
}

// Parameterized validator
class RangeType extends ValidatorType<number> {
  constructor(
    private min: number,
    private max: number
  ) {
    super()
  }
  
  validate(input: unknown) {
    // First validate if it's a number
    const numberResult = Validator.validate(Number, input)
    if (numberResult.isErr) {
      return numberResult  // Return error directly
    }
    
    const value = numberResult.value
    if (value < this.min || value > this.max) {
      return this.Err(`Value must be between ${this.min} and ${this.max}`)
    }
    
    return this.Ok(value)
  }
}

// Use custom validators
class UserProfile extends ObjectType {
  email = EmailType  // Use custom email validator
  age = new RangeType(0, 150)
  score = new RangeType(0, 100)
}
```

#### Validator Factory Pattern

```typescript
// Create reusable validator factories
function StringPattern(pattern: RegExp, message: string) {
  return class extends ValidatorType<string> {
    validate(input: unknown) {
      const stringResult = Validator.validate(String, input)
      if (stringResult.isErr) {
        return this.Err('Must be a string')
      }
      
      if (!pattern.test(stringResult.value)) {
        return this.Err(message)
      }
      
      return this.Ok(stringResult.value)
    }
  }
}

// Use factory to create concrete validators
const UsernameType = StringPattern(
  /^[a-zA-Z0-9_]{3,20}$/,
  'Username must be 3-20 characters, alphanumeric and underscore only'
)

const PhoneType = StringPattern(
  /^\+?[1-9]\d{10,14}$/,
  'Invalid phone number format'
)

const SlugType = StringPattern(
  /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
  'Slug must be lowercase alphanumeric with hyphens'
)

// Compose usage
class ContactForm extends ObjectType {
  username = UsernameType
  phone = PhoneType
  slug = SlugType
}
```

## farrow-http Advanced Features

### Response.capture - Response Interception

`capture` allows you to intercept specific types of responses and handle them uniformly.

#### Unified Response Format

```typescript
// Intercept all JSON responses
app.capture('json', (jsonBody, response) => {
  const statusCode = response.info.status?.code || 200
  
  // Unified success response format
  if (statusCode < 400) {
    return Response.json({
      success: true,
      data: jsonBody.value,
      meta: {
        timestamp: Date.now(),
        version: 'v1'
      }
    }).merge(response)  // Preserve other properties of original response
  }
  
  // Unified error response format
  return Response.json({
    success: false,
    error: jsonBody.value,
    meta: {
      timestamp: Date.now(),
      statusCode
    }
  }).merge(response)
})

// Intercept text responses to add charset
app.capture('text', (textBody, response) => {
  return response.header('Content-Type', 'text/plain; charset=utf-8')
})

// Intercept HTML responses
app.capture('html', (htmlBody, response) => {
  const html = htmlBody.value
  // Inject analytics script
  const modified = html.replace(
    '</head>',
    '<script>console.log("Page loaded")</script></head>'
  )
  return Response.html(modified).merge(response)
})
```

### Response.custom - Custom Responses

`Response.custom` lets you directly manipulate Node.js native request and response objects.

#### Server-Sent Events (SSE)

```typescript
app.get('/events').use(() => {
  return Response.custom(({ req, res }) => {
    // Set SSE response headers
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    })
    
    // Send initial connection event
    res.write('event: connected\n')
    res.write('data: {"status": "connected"}\n\n')
    
    // Send data periodically
    let counter = 0
    const interval = setInterval(() => {
      counter++
      res.write(`event: message\n`)
      res.write(`data: {"count": ${counter}}\n`)
      res.write(`id: ${counter}\n\n`)
      
      if (counter >= 10) {
        clearInterval(interval)
        res.end()
      }
    }, 1000)
    
    // Clean up when client disconnects
    req.on('close', () => {
      clearInterval(interval)
    })
  })
})
```

#### File Streaming

```typescript
import { createReadStream } from 'fs'
import { pipeline } from 'stream'

app.get('/download/<file:string>').use((request) => {
  const filename = request.params.file
  
  return Response.custom(({ res }) => {
    const stream = createReadStream(`./uploads/${filename}`)
    
    // Set download response headers
    res.setHeader('Content-Type', 'application/octet-stream')
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
    
    // Stream transfer
    pipeline(stream, res, (err) => {
      if (err) {
        console.error('Stream error:', err)
        if (!res.headersSent) {
          res.statusCode = 500
          res.end('Stream error')
        }
      }
    })
    
    // Handle file not found
    stream.on('error', () => {
      if (!res.headersSent) {
        res.statusCode = 404
        res.end('File not found')
      }
    })
  })
})
```

### Response.merge - Response Merging

`Response.merge` is used to merge properties of multiple response objects.

```typescript
// Create response enhancement functions
function withCors(response: Response): Response {
  const corsHeaders = Response
    .header('Access-Control-Allow-Origin', '*')
    .header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE')
    .header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  
  return Response.merge(response, corsHeaders)
}

function withCache(response: Response, maxAge: number): Response {
  const cacheHeaders = Response
    .header('Cache-Control', `public, max-age=${maxAge}`)
    .header('Expires', new Date(Date.now() + maxAge * 1000).toUTCString())
  
  return Response.merge(response, cacheHeaders)
}

// Use response enhancement
app.get('/api/data').use(() => {
  const data = Response.json({ items: [] })
  
  // Chain enhancements
  const enhanced = withCache(withCors(data), 3600)
  return enhanced
})

// Merge responses in middleware
app.use((request, next) => {
  const startTime = Date.now()
  const response = next(request)
  
  // Add performance tracking headers
  const tracking = Response
    .header('X-Response-Time', `${Date.now() - startTime}ms`)
    .header('X-Server', 'Farrow')
  
  return Response.merge(response, tracking)
})
```

---

## Practical Case: Comprehensive Application

Let's build a complete example combining these advanced features.

```typescript
import { Http, Response } from 'farrow-http'
import { createAsyncPipeline, createContext, createContainer, runWithContainer } from 'farrow-pipeline'
import { ObjectType, ValidatorType, Validator } from 'farrow-schema'

// === Custom Validators ===
class StrongPasswordType extends ValidatorType<string> {
  validate(input: unknown) {
    const stringResult = Validator.validate(String, input)
    if (stringResult.isErr) {
      return this.Err('Password must be a string')
    }
    
    const password = stringResult.value
    
    if (password.length < 8) {
      return this.Err('Password must be at least 8 characters')
    }
    
    if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password)) {
      return this.Err('Password must contain uppercase, lowercase and numbers')
    }
    
    return this.Ok(password)
  }
}

// === Schema Definitions ===
class RegisterRequest extends ObjectType {
  username = String
  email = String
  password = StrongPasswordType
}

// === Context Definitions ===
const RequestIdContext = createContext<string>('')
const UserContext = createContext<User | null>(null)

// === Processing Pipeline ===
const authPipeline = createAsyncPipeline<AuthRequest, AuthResponse>()

// Lazy load authentication module
authPipeline.useLazy(async () => {
  const { authenticate } = await import('./auth')
  
  return async (request, next) => {
    const result = await authenticate(request)
    if (!result.success) {
      return { success: false, error: 'Authentication failed' }
    }
    return next({ ...request, user: result.user })
  }
})

// === Main Application ===
const app = Http()

// Request tracking middleware
app.use((request, next) => {
  const requestId = generateRequestId()
  
  // Create request-level Container
  const container = createContainer({
    [RequestIdContext]: requestId
  })
  
  return runWithContainer(() => {
    const startTime = Date.now()
    const response = next(request)
    
    // Add tracking headers
    return response
      .header('X-Request-ID', requestId)
      .header('X-Response-Time', `${Date.now() - startTime}ms`)
  }, container)
})

// Unified response format
app.capture('json', (jsonBody, response) => {
  const requestId = RequestIdContext.get()
  
  return Response.json({
    requestId,
    timestamp: Date.now(),
    ...jsonBody.value
  }).merge(response)
})

// Register endpoint
app.post('/register', {
  body: RegisterRequest
}).use(async (request) => {
  // Manually validate additional business rules
  const usernameCheck = await checkUsernameExists(request.body.username)
  if (usernameCheck) {
    return Response.status(400).json({ error: 'Username already exists' })
  }
  
  // Use Pipeline for processing
  const authResult = await authPipeline.run({
    type: 'register',
    data: request.body
  })
  
  if (!authResult.success) {
    return Response.status(400).json({ error: authResult.error })
  }
  
  return Response.status(201).json({
    user: authResult.user,
    token: authResult.token
  })
})

// SSE notification endpoint
app.get('/notifications').use(() => {
  return Response.custom(({ req, res }) => {
    const requestId = RequestIdContext.get()
    const user = UserContext.get()
    
    if (!user) {
      res.writeHead(401)
      res.end('Unauthorized')
      return
    }
    
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'X-Request-ID': requestId
    })
    
    // Subscribe to user notifications
    const unsubscribe = subscribeToUserNotifications(user.id, (notification) => {
      res.write(`event: notification\n`)
      res.write(`data: ${JSON.stringify(notification)}\n\n`)
    })
    
    req.on('close', () => {
      unsubscribe()
    })
  })
})

app.listen(3000)
```

---

## Summary

This tutorial has covered the advanced features of the Farrow framework in depth:

### farrow-pipeline
- **usePipeline**: Enables modular composition of Pipelines
- **Container**: Provides request-level context isolation
- **useLazy**: Performance optimization through lazy loading

### farrow-schema
- **Validator.validate**: Core API for manual data validation
- **ValidatorType**: Base class for creating custom validators
- **required**: Schema transformation utility functions

### farrow-http
- **Response.capture**: Unified handling of specific response types
- **Response.custom**: Direct manipulation of native objects for special functionality
- **Response.merge**: Flexible composition of response properties

These advanced features enable you to build more complex, efficient, and maintainable applications.