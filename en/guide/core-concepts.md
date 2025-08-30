# Core Concepts

> Understand Farrow's design philosophy and master the essence of the framework

## Overview

Farrow is not just another Web framework. It represents a completely new way of thinking:

- **Types as Documentation** - Make TypeScript your first line of defense
- **Functional-First** - Build predictable applications with pure functions
- **Composition over Configuration** - Build complex systems by composing small, beautiful components

Let's dive deep into these core concepts.

## Three Pillars

Farrow is built on three core modules that work together to provide a powerful and elegant development experience:

### farrow-pipeline
**Unified data processing pipeline**

Provides a type-safe middleware system, ensuring data is type-safe at every step in the processing chain.

### farrow-schema  
**Single source of truth for data definition**

Define once, get TypeScript types, runtime validation, and API documentation all at once.

### farrow-http
**Type-safe HTTP layer**

A Web framework built on the previous two, providing end-to-end type safety.

## Type Safety: First-Class Citizen

### Problems with Traditional Approaches

In traditional Node.js frameworks, type safety is often added as an afterthought:

```typescript
// Express + TypeScript: Types are "decorative"
app.get('/users/:id', (req: Request, res: Response) => {
  const id = req.params.id  // string type, but actually needs number
  const userId = parseInt(id)  // Manual conversion, error-prone
  
  if (isNaN(userId)) {
    res.status(400).json({ error: 'Invalid ID' })
    return  // Easy to forget return
  }
  
  const user = getUser(userId)
  res.json(user)  // Forget this line? Runtime error
})
```

### The Farrow Way

In Farrow, type safety is built-in:

```typescript
// Farrow: Types are "essential"
app.get('/users/<id:int>').use((request) => {
  // request.params.id is automatically number, already validated
  const user = getUser(request.params.id)
  return Response.json(user)  // Compiler enforces return
})
```

**Key differences:**
- Route parameters automatically parsed and validated
- Compile-time type checking
- Forced response return, no missing responses

### The Magic of Template Literal Types

Farrow leverages TypeScript 4.1+ Template Literal Types to achieve type-safe routing:

```typescript
// This isn't a string, it's a type!
type Route = '/users/<id:int>/posts/<postId:string>?<page?:int>'

// TypeScript automatically infers:
type Params = {
  id: number
  postId: string
}
type Query = {
  page?: number
}
```

## Schema-Driven Development

### What is Schema?

Schema is a structured description of data. In Farrow, Schema not only describes data but also provides validation and types:

```typescript
import { ObjectType, String, Number, Boolean, List } from 'farrow-schema'

// Define Schema
class Article extends ObjectType {
  title = String
  content = String
  author = {
    name: String,
    email: String
  }
  tags = List(String)
  published = Boolean
  views = Number
}

// Automatically get TypeScript types
type ArticleType = TypeOf<typeof Article>
// {
//   title: string
//   content: string
//   author: { name: string, email: string }
//   tags: string[]
//   published: boolean
//   views: number
// }
```

### Define Once, Benefit Everywhere

#### 1. Type Safety
```typescript
// Compile-time type checking
const article: ArticleType = {
  title: "Hello",
  content: "...",
  // TypeScript will prompt for missing required fields
}
```

#### 2. Automatic Validation
```typescript
app.post('/articles', { body: Article }).use((request) => {
  // request.body is already validated, type is ArticleType
  saveArticle(request.body)
})
```

#### 3. Manual Validation
```typescript
// Use Validator to manually validate data
const result = Validator.validate(Article, data)
if (result.isOk) {
  console.log('Valid:', result.value)
}
```

#### 4. Type Transformation
```typescript
// Flexible Schema operations
const ArticleSummary = pickObject(Article, ['title', 'author', 'tags'])
const ArticleUpdate = partial(Article)
const PublicArticle = omitObject(Article, ['author.email'])
```

### Schema vs Interfaces

Why use Schema instead of TypeScript interfaces?

```typescript
// ❌ Interface: Only compile-time types
interface User {
  name: string
  age: number
}

// Need to write validation manually
function validateUser(data: any): User {
  if (!data.name || typeof data.name !== 'string') {
    throw new Error('Invalid name')
  }
  // ... more validation
}

// ✅ Schema: Types + validation
class User extends ObjectType {
  name = String
  age = Number
}

// Automatic validation
const result = Validator.validate(User, data)
```

## Functional Middleware

### The Power of Pure Functions

Farrow's middleware are pure functions, which brings many benefits:

```typescript
// Pure function middleware
const logger = (request: Request, next: Next) => {
  console.log(`${request.method} ${request.path}`)
  const response = next(request)  // Call next middleware
  console.log(`Status: ${response.status}`)
  return response  // Must return response
}
```

**Characteristics:**
- Immutable input - request object is never modified
- Must have output - forced to return response
- Predictable - same input always produces same output
- Easy to test - no dependency on external state

### Onion Model

Middleware executes according to the "onion model":

```typescript
app.use((request, next) => {
  console.log('1. Outer pre')
  const response = next(request)
  console.log('6. Outer post')
  return response
})

app.use((request, next) => {
  console.log('2. Middle pre')
  const response = next(request)
  console.log('5. Middle post')
  return response
})

app.use((request, next) => {
  console.log('3. Inner pre')
  const response = next(request)
  console.log('4. Inner post')
  return response
})

// Execution order: 1 → 2 → 3 → 4 → 5 → 6
```

### Pipeline: Type-Safe Composition

Pipeline ensures type consistency across the entire middleware chain:

```typescript
import { createPipeline } from 'farrow-pipeline'

// Create type-safe pipeline
const pipeline = createPipeline<Input, Output>()

pipeline.use((input, next) => {
  // input type is Input
  const result = next(input)  // result type is Output
  return result  // Must return Output
})

// Type mismatch will cause compile-time error
pipeline.use((input, next) => {
  return "wrong type"  // ❌ Compile error: not Output type
})
```

## Context: Elegant State Management

### React Hooks-Style API

Inspired by React Hooks, Farrow provides an elegant Context API:

```typescript
import { createContext } from 'farrow-pipeline'

// Create Context
const UserContext = createContext<User | null>(null)
const ThemeContext = createContext<'light' | 'dark'>('light')

// Set in middleware
app.use((request, next) => {
  const user = authenticateUser(request)
  UserContext.set(user)
  return next(request)
})

// Use anywhere
app.get('/profile').use(() => {
  const user = UserContext.get()
  if (!user) {
    return Response.status(401).json({ error: 'Not authenticated' })
  }
  return Response.json(user)
})
```

### Request-Level Isolation

Each request has independent Context, avoiding state pollution:

```typescript
const RequestIdContext = createContext<string>()

app.use((request, next) => {
  // Set independent ID for each request
  RequestIdContext.set(generateId())
  return next(request)
})

// Concurrent requests don't interfere with each other
// Request A: RequestIdContext = "id-123"
// Request B: RequestIdContext = "id-456"
// Completely isolated
```

### Custom Hooks

You can create custom Hooks to encapsulate common logic:

```typescript
// Custom Hook
function useCurrentUser() {
  const user = UserContext.get()
  if (!user) {
    throw new HttpError('Not authenticated', 401)
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

// Use custom Hook
app.get('/api/posts').use(() => {
  const user = useCurrentUser()  // Automatically handle authentication
  const db = useDatabase()        // Automatically get database connection
  
  const posts = db.getPostsByUser(user.id)
  return Response.json(posts)
})
```

## Reactive Programming Model

### Forced Return Values

Unlike Express's callback style, Farrow forces each handler to return a response:

```typescript
// ❌ Express: Easy to forget response
app.get('/users', (req, res) => {
  if (!authorized) {
    res.status(401).json({ error: 'Unauthorized' })
    // Forgot return, code continues executing!
  }
  res.json(users)  // Might send response twice
})

// ✅ Farrow: Compiler enforces return
app.get('/users').use((request) => {
  if (!authorized) {
    return Response.status(401).json({ error: 'Unauthorized' })
    // Code won't continue executing
  }
  return Response.json(users)  // Must return
})
```

### Chainable Response Building

Farrow provides an elegant chainable API for building responses:

```typescript
// Clear, type-safe response building
return Response
  .json({ message: 'User created', user })
  .status(201)
  .header('Location', `/users/${user.id}`)
  .header('X-RateLimit-Remaining', '99')
  .cookie('session', sessionId, {
    httpOnly: true,
    secure: true,
    sameSite: 'strict'
  })
  .vary('Accept-Encoding')
```

## Error Handling Philosophy

### Type-Safe Errors

Farrow encourages type-safe error handling:

```typescript
import { HttpError } from 'farrow-http'

// Custom error classes
class ValidationError extends HttpError {
  constructor(public field: string, message: string) {
    super(message, 400)
  }
}

class NotFoundError extends HttpError {
  constructor(resource: string) {
    super(`${resource} not found`, 404)
  }
}

// Using errors
app.get('/users/<id:int>').use((request) => {
  const user = getUser(request.params.id)
  
  if (!user) {
    throw new NotFoundError('User')
  }
  
  return Response.json(user)
})
```

### Unified Error Boundaries

Use middleware to create unified error handling:

```typescript
// Error boundary middleware
app.use((request, next) => {
  try {
    return next(request)
  } catch (error) {
    if (error instanceof ValidationError) {
      return Response.status(400).json({
        error: 'Validation failed',
        field: error.field,
        message: error.message
      })
    }
    
    if (error instanceof HttpError) {
      return Response.status(error.status).json({
        error: error.message
      })
    }
    
    // Unknown error
    console.error(error)
    return Response.status(500).json({
      error: 'Internal server error'
    })
  }
})
```

## Progressive Architecture

### Start Simple

You can start with the simplest application:

```typescript
// Step 1: Simple HTTP server
const app = Http()
app.get('/').use(() => Response.text('Hello'))
app.listen(3000)
```

### Enhance On-Demand

Then gradually add features as needed:

```typescript
// Step 2: Add route parameters
app.get('/users/<id:int>')

// Step 3: Add validation
app.post('/users', { body: UserSchema })

// Step 4: Add middleware
app.use(authMiddleware)

// Step 5: Add Context
const UserContext = createContext<User>()

// Step 6: Compose into complete application
const apiRouter = Router()
apiRouter.use('/users', userRouter)
apiRouter.use('/posts', postRouter)
app.use('/api', apiRouter)
```

### Modular Design

Each part can be used independently:

```typescript
// Use only Schema
import { ObjectType, String } from 'farrow-schema'

// Use only Pipeline
import { createPipeline } from 'farrow-pipeline'

// Use only HTTP
import { Http, Response } from 'farrow-http'

// Or use in combination
import { Http } from 'farrow-http'
import { ObjectType } from 'farrow-schema'
import { createContext } from 'farrow-pipeline'
```

## Design Principles Summary

### Types First
> "If it compiles, it works"

Every API is carefully designed to provide the best type inference experience.

### Composition over Inheritance
> "Small, beautiful components, infinite possibilities"

Build complex systems by composing simple components.

### Pure Function Construction
> "Predictable, testable, maintainable"

Use pure functions to reduce side effects and improve code quality.

### Immutable Data
> "Data flows, state remains unchanged"

Immutable data avoids accidental modifications and hard-to-track bugs.

### Progressive Enhancement
> "Simple things simple, complex things possible"

Start simple, enhance as needed, never over-engineer.

## Comparison with Other Frameworks

### vs Express.js

| Aspect | Express | Farrow |
|--------|---------|---------|
| **Type Safety** | Requires extra configuration | Built-in support |
| **Parameter Validation** | Manual or third-party libraries | Automatic validation |
| **Middleware Model** | Modify req/res | Pure function chain |
| **Error Handling** | Callback hell | Type-safe exceptions |
| **Learning Curve** | Simple but error-prone | Simple and safe |

### vs Nest.js

| Aspect | Nest.js | Farrow |
|--------|---------|---------|
| **Architecture Style** | OOP + Decorators | Functional + Composition |
| **Dependency Injection** | Complex DI container | Simple Context |
| **Boilerplate Code** | More | Minimal |
| **Type Inference** | Requires decorators | Automatic inference |
| **Bundle Size** | Larger | Lightweight |

## Practical Example: Building an Authentication System

Let's see how to apply these concepts through a real example:

```typescript
import { Http, Response, HttpError } from 'farrow-http'
import { ObjectType, String } from 'farrow-schema'
import { createContext } from 'farrow-pipeline'

// Schema definitions
class LoginRequest extends ObjectType {
  email = String
  password = String
}

class User extends ObjectType {
  id = String
  email = String
  name = String
}

// Context definition
const UserContext = createContext<User | null>(null)

// Authentication middleware
const authenticate = (request, next) => {
  const token = request.headers?.authorization?.replace('Bearer ', '')
  
  if (!token) {
    return Response.status(401).json({ error: 'Token required' })
  }
  
  try {
    const user = verifyToken(token)
    UserContext.set(user)
    return next(request)
  } catch {
    return Response.status(401).json({ error: 'Invalid token' })
  }
}

// Custom Hook
function useCurrentUser() {
  const user = UserContext.get()
  if (!user) {
    throw new HttpError('Not authenticated', 401)
  }
  return user
}

// Application
const app = Http()

// Login endpoint
app.post('/login', { body: LoginRequest }).use((request) => {
  const { email, password } = request.body
  
  const user = validateCredentials(email, password)
  if (!user) {
    return Response.status(401).json({ error: 'Invalid credentials' })
  }
  
  const token = generateToken(user)
  
  return Response.json({
    user,
    token
  })
})

// Protected endpoints
app.use('/api/*', authenticate)

app.get('/api/profile').use(() => {
  const user = useCurrentUser()
  return Response.json(user)
})

app.put('/api/profile', {
  body: {
    name: String
  }
}).use((request) => {
  const user = useCurrentUser()
  const updated = updateUser(user.id, request.body)
  return Response.json(updated)
})
```

## Summary

Through this chapter, you now understand Farrow's core concepts:

- **Type Safety** - Let the compiler be your first line of defense  
- **Schema-Driven** - Define once, benefit everywhere  
- **Functional Middleware** - Build predictable applications with pure functions  
- **Context System** - Elegant state management  
- **Progressive Architecture** - Enhance on-demand, never over-engineer  

These concepts work together to provide a powerful, elegant, type-safe development experience.

## Next Steps

Ready to dive deeper?

**[Essentials](/en/guide/essentials)**  
Learn routing, middleware, validation, and other daily development skills

**[Components In-Depth](/en/guide/components-in-depth)**  
Deep dive into Schema, Pipeline, Context

**[Practical Projects](/en/examples/)**  
Master best practices through complete projects