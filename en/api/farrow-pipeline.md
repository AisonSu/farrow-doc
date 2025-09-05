# Farrow Pipeline User API Reference

## Overview

Farrow Pipeline is a type-safe middleware pipeline library that provides functional programming style request processing capabilities.

## Table of Contents

- [Quick Start](#quick-start)
- [Core API](#core-api)
  - [createPipeline](#createpipeline)
  - [createAsyncPipeline](#createasyncpipeline)
  - [usePipeline](#usepipeline)
- [Context Management](#context-management)
  - [createContext](#createcontext)
  - [Container Concept](#container-concept)
  - [createContainer](#createcontainer)
- [Utilities](#utilities)
  - [isPipeline](#ispipeline)
- [Error Handling](#error-handling)
- [Best Practices](#best-practices)

---

## Quick Start

```typescript
import { createPipeline, createContext } from 'farrow-pipeline'
import * as asyncTracerImpl from 'farrow-pipeline/asyncTracerImpl.node'

// Required for Node.js environment - Enable async tracing
asyncTracerImpl.enable()

// Create Pipeline
const app = createPipeline<Request, Response>()

app.use((req, next) => {
  console.log(`${req.method} ${req.url}`)
  return next(req)
})

app.use((req) => {
  return { status: 200, body: 'Hello World' }
})

// Run
const response = app.run(request)
```

---

## Core API

### createPipeline

Create a synchronous Pipeline that enables sequential middleware processing.

**Type Signature**

```typescript
function createPipeline<Input, Output>(): Pipeline<Input, Output>

interface Pipeline<Input, Output> {
  use(middleware: Middleware<Input, Output>): Pipeline<Input, Output>
  run(input: Input): Output
}

type Middleware<Input, Output> = (
  input: Input,
  next: (input: Input) => Output
) => Output
```

**Usage Example**

```typescript
import { createPipeline } from 'farrow-pipeline'

// Define request/response types
type Request = {
  method: string
  url: string
  body?: any
}

type Response = {
  status: number
  body: any
}

// Create Pipeline
const app = createPipeline<Request, Response>()

// Add logging middleware
app.use((req, next) => {
  console.log(`${req.method} ${req.url}`)
  return next(req)
})

// Add authentication middleware  
app.use((req, next) => {
  if (!req.headers?.authorization) {
    return { status: 401, body: 'Unauthorized' }
  }
  return next(req)
})

// Business logic
app.use((req) => {
  return { 
    status: 200, 
    body: { message: 'Success', data: req.body } 
  }
})

// Execute Pipeline
const response = app.run({
  method: 'POST',
  url: '/api/users',
  body: { name: 'John' }
})

console.log(response) // { status: 200, body: { message: 'Success', data: { name: 'John' } } }
```

**Pipeline Composition**

```typescript
// Create reusable middleware components
const authPipeline = createPipeline<Request, Request>()
authPipeline.use((req, next) => {
  if (!isAuthenticated(req)) {
    throw new Error('Authentication required')
  }
  return next(req)
})

const logPipeline = createPipeline<Request, Request>()
logPipeline.use((req, next) => {
  console.log(`Request: ${req.method} ${req.url}`)
  return next(req)
})

// Combine Pipelines
const mainApp = createPipeline<Request, Response>()
mainApp.use(logPipeline.middleware) // Use as middleware
mainApp.use(authPipeline.middleware)
mainApp.use((req) => {
  return { status: 200, body: 'Authenticated request processed' }
})
```

### createAsyncPipeline

Create an asynchronous Pipeline that supports Promise-based middleware.

**Type Signature**

```typescript
function createAsyncPipeline<Input, Output>(): AsyncPipeline<Input, Output>

interface AsyncPipeline<Input, Output> {
  use(middleware: AsyncMiddleware<Input, Output>): AsyncPipeline<Input, Output>
  run(input: Input): Promise<Output>
}

type AsyncMiddleware<Input, Output> = (
  input: Input,
  next: (input: Input) => Promise<Output>
) => Promise<Output>
```

**Usage Example**

```typescript
import { createAsyncPipeline } from 'farrow-pipeline'
import * as asyncTracerImpl from 'farrow-pipeline/asyncTracerImpl.node'

// Enable async tracing (required for Node.js)
asyncTracerImpl.enable()

type Request = {
  userId: string
  action: string
}

type Response = {
  success: boolean
  data?: any
  error?: string
}

// Create async Pipeline
const app = createAsyncPipeline<Request, Response>()

// Database connection middleware
app.use(async (req, next) => {
  console.log('Connecting to database...')
  await connectToDatabase()
  return next(req)
})

// User authentication middleware
app.use(async (req, next) => {
  const user = await getUserById(req.userId)
  if (!user) {
    return { success: false, error: 'User not found' }
  }
  return next({ ...req, user })
})

// Business logic
app.use(async (req) => {
  const result = await performAction(req.action, req.user)
  return { success: true, data: result }
})

// Execute async Pipeline
const response = await app.run({
  userId: '123',
  action: 'getData'
})

console.log(response)
```

**Error Handling in Async Pipeline**

```typescript
const app = createAsyncPipeline<Request, Response>()

app.use(async (req, next) => {
  try {
    const result = await next(req)
    return result
  } catch (error) {
    console.error('Pipeline error:', error)
    return { success: false, error: error.message }
  }
})

app.use(async (req) => {
  // Simulate potential error
  if (req.shouldFail) {
    throw new Error('Simulated error')
  }
  return { success: true, data: 'Success' }
})
```

### usePipeline

Access the currently running Pipeline instance within middleware.

**Type Signature**

```typescript
function usePipeline<Input, Output>(): Pipeline<Input, Output>
```

**Usage Example**

```typescript
import { createPipeline, usePipeline } from 'farrow-pipeline'

const app = createPipeline<Request, Response>()

app.use((req, next) => {
  // Get current Pipeline instance
  const pipeline = usePipeline()
  
  console.log('Current Pipeline:', pipeline)
  
  // Can be used to access Pipeline metadata or configuration
  return next(req)
})

app.use((req) => {
  return { status: 200, body: 'OK' }
})
```

---

## Context Management

### createContext

Create a context for sharing state between middleware in the same Pipeline.

**Type Signature**

```typescript
function createContext<T>(defaultValue: T): Context<T>

interface Context<T> {
  get(): T
  set(value: T): void
  Provider: React.ComponentType<{
    value?: T
    children: React.ReactNode
  }>
}
```

**Usage Example**

```typescript
import { createPipeline, createContext } from 'farrow-pipeline'

// Create context
const UserContext = createContext<User | null>(null)
const RequestIdContext = createContext<string>('')

type User = {
  id: string
  name: string
  role: string
}

type Request = {
  headers: Record<string, string>
  body: any
}

type Response = {
  status: number
  body: any
}

const app = createPipeline<Request, Response>()

// Set request ID
app.use((req, next) => {
  const requestId = req.headers['x-request-id'] || generateRequestId()
  RequestIdContext.set(requestId)
  
  console.log(`Request ID: ${requestId}`)
  return next(req)
})

// User authentication
app.use(async (req, next) => {
  const token = req.headers.authorization
  if (token) {
    const user = await authenticateUser(token)
    UserContext.set(user)
  }
  
  return next(req)
})

// Authorization middleware
app.use((req, next) => {
  const user = UserContext.get()
  const requestId = RequestIdContext.get()
  
  if (!user) {
    console.log(`[${requestId}] Unauthorized access attempt`)
    return { status: 401, body: 'Unauthorized' }
  }
  
  console.log(`[${requestId}] User ${user.name} accessing resource`)
  return next(req)
})

// Business logic
app.use((req) => {
  const user = UserContext.get()
  const requestId = RequestIdContext.get()
  
  return {
    status: 200,
    body: {
      message: `Hello ${user?.name}`,
      requestId
    }
  }
})
```

**Context Best Practices**

```typescript
// Create strongly typed contexts
const DatabaseContext = createContext<{
  connection: DatabaseConnection
  transaction?: Transaction
}>({
  connection: null as any,
  transaction: undefined
})

const ConfigContext = createContext<{
  apiUrl: string
  timeout: number
  retries: number
}>({
  apiUrl: process.env.API_URL || '',
  timeout: 5000,
  retries: 3
})

// Use contexts for dependency injection
app.use((req, next) => {
  const config = ConfigContext.get()
  const db = DatabaseContext.get()
  
  // Use configuration and database connection
  return next(req)
})
```

### Container Concept

Container is a dependency injection container that manages context lifecycle and provides advanced context features.

**Core Concepts**

1. **Dependency Injection**: Automatically provide dependencies to middleware
2. **Lifecycle Management**: Control when contexts are created and destroyed
3. **Scoped Contexts**: Different context scopes (request, application, etc.)

**Usage Example**

```typescript
import { createContainer, createContext, createPipeline } from 'farrow-pipeline'

// Define service interfaces
interface Logger {
  log(message: string): void
  error(message: string): void
}

interface Database {
  query(sql: string): Promise<any[]>
  close(): Promise<void>
}

// Create contexts
const LoggerContext = createContext<Logger>(console)
const DatabaseContext = createContext<Database | null>(null)

// Create container
const container = createContainer()

// Register services in container
container.set(LoggerContext, new CustomLogger())
container.set(DatabaseContext, new DatabaseService())

const app = createPipeline<Request, Response>()

// Use container in Pipeline
app.use((req, next) => {
  // Container automatically provides the correct context values
  const logger = LoggerContext.get() // Gets CustomLogger instance
  const db = DatabaseContext.get()   // Gets DatabaseService instance
  
  logger.log(`Processing request: ${req.url}`)
  return next(req)
})
```

### createContainer

Create a dependency injection container.

**Type Signature**

```typescript
function createContainer(): Container

interface Container {
  get<T>(context: Context<T>): T
  set<T>(context: Context<T>, value: T): void
  has<T>(context: Context<T>): boolean
  delete<T>(context: Context<T>): boolean
  run<T>(fn: () => T): T
}
```

**Usage Example**

```typescript
import { createContainer, createContext } from 'farrow-pipeline'

// Create container
const container = createContainer()

// Create contexts
const UserServiceContext = createContext<UserService | null>(null)
const ConfigContext = createContext<AppConfig>({
  port: 3000,
  dbUrl: ''
})

// Register services
container.set(UserServiceContext, new UserService())
container.set(ConfigContext, {
  port: 8080,
  dbUrl: 'postgresql://localhost/myapp'
})

// Use container
container.run(() => {
  const userService = UserServiceContext.get() // Gets registered UserService
  const config = ConfigContext.get()           // Gets registered config
  
  console.log(`Server running on port ${config.port}`)
  return userService.getAllUsers()
})
```

**Container Scoping**

```typescript
// Application-level container
const appContainer = createContainer()
appContainer.set(ConfigContext, appConfig)
appContainer.set(DatabaseContext, dbConnection)

const app = createPipeline<Request, Response>()

app.use((req, next) => {
  // Create request-scoped container
  const requestContainer = createContainer()
  
  // Inherit from app container
  requestContainer.set(ConfigContext, appContainer.get(ConfigContext))
  requestContainer.set(DatabaseContext, appContainer.get(DatabaseContext))
  
  // Add request-specific context
  requestContainer.set(RequestContext, {
    id: generateRequestId(),
    startTime: Date.now(),
    user: null
  })
  
  return requestContainer.run(() => next(req))
})
```

---

## Utilities

### isPipeline

Check if an object is a Pipeline instance.

**Type Signature**

```typescript
function isPipeline(value: unknown): value is Pipeline<any, any>
```

**Usage Example**

```typescript
import { createPipeline, isPipeline } from 'farrow-pipeline'

const app = createPipeline<Request, Response>()
const notPipeline = { use: () => {}, run: () => {} }

console.log(isPipeline(app))        // true
console.log(isPipeline(notPipeline)) // false

// Use in generic functions
function processPipeline(value: unknown) {
  if (isPipeline(value)) {
    // Type-safe access to Pipeline methods
    value.use((input, next) => next(input))
    return value.run(someInput)
  }
  throw new Error('Not a Pipeline')
}
```

---

## Error Handling

### Synchronous Error Handling

```typescript
const app = createPipeline<Request, Response>()

// Global error handling middleware
app.use((req, next) => {
  try {
    return next(req)
  } catch (error) {
    console.error('Pipeline error:', error)
    return {
      status: 500,
      body: { error: 'Internal Server Error' }
    }
  }
})

// Middleware that might throw
app.use((req, next) => {
  if (req.shouldFail) {
    throw new Error('Something went wrong')
  }
  return next(req)
})

app.use((req) => {
  return { status: 200, body: 'Success' }
})
```

### Asynchronous Error Handling

```typescript
const app = createAsyncPipeline<Request, Response>()

// Async error handling middleware
app.use(async (req, next) => {
  try {
    const result = await next(req)
    return result
  } catch (error) {
    console.error('Async Pipeline error:', error)
    
    // Handle specific error types
    if (error instanceof ValidationError) {
      return { status: 400, body: { error: error.message } }
    }
    
    if (error instanceof AuthenticationError) {
      return { status: 401, body: { error: 'Unauthorized' } }
    }
    
    return { status: 500, body: { error: 'Internal Server Error' } }
  }
})

// Async middleware that might reject
app.use(async (req, next) => {
  await validateRequest(req) // May throw ValidationError
  const user = await authenticateUser(req) // May throw AuthenticationError
  
  return next({ ...req, user })
})
```

### Context-Based Error Handling

```typescript
const ErrorContext = createContext<Error[]>([])

const app = createPipeline<Request, Response>()

// Error collection middleware
app.use((req, next) => {
  const errors: Error[] = []
  ErrorContext.set(errors)
  
  const result = next(req)
  
  // Check if any errors were collected
  if (errors.length > 0) {
    return {
      status: 400,
      body: {
        errors: errors.map(e => e.message)
      }
    }
  }
  
  return result
})

// Middleware that collects errors instead of throwing
app.use((req, next) => {
  const errors = ErrorContext.get()
  
  if (!req.name) {
    errors.push(new Error('Name is required'))
  }
  
  if (!req.email || !isValidEmail(req.email)) {
    errors.push(new Error('Valid email is required'))
  }
  
  return next(req)
})
```

---

## Best Practices

### 1. Use TypeScript for Type Safety

```typescript
// ✅ Define clear input/output types
type AuthenticatedRequest = {
  user: User
  sessionId: string
} & BaseRequest

type APIResponse<T> = {
  success: boolean
  data?: T
  error?: string
}

const app = createPipeline<AuthenticatedRequest, APIResponse<any>>()
```

### 2. Create Reusable Middleware

```typescript
// ✅ Create factory functions for reusable middleware
function createAuthMiddleware(requiredRole?: string) {
  return (req: Request, next: (req: Request) => Response) => {
    const user = UserContext.get()
    
    if (!user) {
      return { status: 401, body: 'Unauthorized' }
    }
    
    if (requiredRole && user.role !== requiredRole) {
      return { status: 403, body: 'Forbidden' }
    }
    
    return next(req)
  }
}

// Usage
const adminPipeline = createPipeline<Request, Response>()
adminPipeline.use(createAuthMiddleware('admin'))

const userPipeline = createPipeline<Request, Response>()
userPipeline.use(createAuthMiddleware())
```

### 3. Proper Context Usage

```typescript
// ✅ Create context with proper typing and default values
const RequestMetadataContext = createContext<{
  requestId: string
  startTime: number
  userAgent?: string
}>({
  requestId: '',
  startTime: 0
})

// ✅ Use context consistently
app.use((req, next) => {
  RequestMetadataContext.set({
    requestId: req.headers['x-request-id'] || generateId(),
    startTime: Date.now(),
    userAgent: req.headers['user-agent']
  })
  
  return next(req)
})
```

### 4. Error Handling Strategy

```typescript
// ✅ Implement layered error handling
const app = createAsyncPipeline<Request, Response>()

// Top-level error boundary
app.use(async (req, next) => {
  try {
    return await next(req)
  } catch (error) {
    const requestId = RequestIdContext.get()
    const logger = LoggerContext.get()
    
    logger.error(`[${requestId}] Unhandled error:`, error)
    
    return {
      status: 500,
      body: { 
        error: 'Internal Server Error',
        requestId 
      }
    }
  }
})

// Specific error handling
app.use(async (req, next) => {
  try {
    return await next(req)
  } catch (error) {
    if (error instanceof BusinessLogicError) {
      return {
        status: 422,
        body: { error: error.message }
      }
    }
    throw error // Re-throw for upper-level handling
  }
})
```

### 5. Performance Considerations

```typescript
// ✅ Enable async tracing for Node.js
import * as asyncTracerImpl from 'farrow-pipeline/asyncTracerImpl.node'
asyncTracerImpl.enable()

// ✅ Use appropriate Pipeline type
const syncPipeline = createPipeline<Request, Response>() // For CPU-intensive tasks
const asyncPipeline = createAsyncPipeline<Request, Response>() // For I/O operations

// ✅ Minimize context usage
const EssentialContext = createContext<{
  userId: string
  permissions: string[]
}>({
  userId: '',
  permissions: []
})

// Instead of multiple contexts for related data
// ❌ Avoid
// const UserIdContext = createContext('')
// const PermissionsContext = createContext<string[]>([])
```