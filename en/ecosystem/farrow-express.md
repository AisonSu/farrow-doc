# farrow-express

Express adapter that allows you to use Farrow in Express applications.

## Overview

`farrow-express` is an adapter package that allows you to seamlessly integrate Farrow HTTP applications into existing Express applications. This is particularly useful for progressive migration or hybrid usage of both frameworks.

## Features

- 🔄 **Seamless Integration** - Mount Farrow applications in Express
- 🎯 **Type Safety** - Maintain Farrow's type safety features
- 📦 **Progressive Migration** - Gradually migrate Express applications to Farrow
- 🔧 **Flexible Deployment** - Mix both frameworks in the same application

## Installation

::: code-group

```bash [npm]
npm install farrow-express
```

```bash [yarn]
yarn add farrow-express
```

```bash [pnpm]
pnpm add farrow-express
```

:::

## Quick Start

### 1. Create Farrow Application

First create a standard farrow-http application:

```typescript
import { Http, Response } from 'farrow-http'
import { ObjectType, String, Number } from 'farrow-schema'

// Create Farrow application
const farrowApp = Http()

// Define Schema
class User extends ObjectType {
  id = Number
  name = String
  email = String
}

// Define routes
farrowApp.get('/users').use(() => {
  return Response.json([
    { id: 1, name: 'Alice', email: 'alice@example.com' },
    { id: 2, name: 'Bob', email: 'bob@example.com' }
  ])
})

farrowApp.get('/users/<id:int>').use((request) => {
  return Response.json({
    id: request.params.id,
    name: 'Alice',
    email: 'alice@example.com'
  })
})

farrowApp.post('/users', {
  body: User
}).use((request) => {
  // request.body is validated and type-safe
  return Response.status(201).json(request.body)
})
```

### 2. Create Express Application

Create a standard Express application:

```typescript
import express from 'express'

const app = express()
const PORT = 3000

// Express native routes
app.get('/', (req, res) => {
  res.send('Express Home Page')
})

app.get('/about', (req, res) => {
  res.json({ message: 'About page from Express' })
})
```

### 3. Integrate Both Frameworks

Use the `adapter` function to mount the Farrow application in Express:

```typescript
import { adapter } from 'farrow-express'

// Mount Farrow application at /api path
app.use('/api', adapter(farrowApp))

// Start server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`)
  console.log('Express routes: /, /about')
  console.log('Farrow routes: /api/users, /api/users/:id')
})
```

## Complete Example

```typescript
import express from 'express'
import { Http, Response } from 'farrow-http'
import { ObjectType, String, Number, List } from 'farrow-schema'
import { createContext } from 'farrow-pipeline'
import { adapter } from 'farrow-express'

// === Farrow Application ===
const farrowApp = Http()

// Schema definitions
class CreatePostRequest extends ObjectType {
  title = String
  content = String
  tags = List(String)
}

class Post extends ObjectType {
  id = Number
  title = String
  content = String
  tags = List(String)
  createdAt = String
}

// Context
const UserContext = createContext<{ id: number; name: string } | null>(null)

// Middleware
farrowApp.use((request, next) => {
  // Get user info from request headers (example)
  const userId = request.headers['x-user-id']
  if (userId) {
    UserContext.set({ id: Number(userId), name: 'User' })
  }
  return next(request)
})

// Routes
farrowApp.get('/posts').use(() => {
  const posts = [
    {
      id: 1,
      title: 'Hello Farrow',
      content: 'Introduction to Farrow',
      tags: ['farrow', 'typescript'],
      createdAt: new Date().toISOString()
    }
  ]
  return Response.json(posts)
})

farrowApp.get('/posts/<id:int>').use((request) => {
  const post = {
    id: request.params.id,
    title: 'Sample Post',
    content: 'This is a sample post',
    tags: ['sample'],
    createdAt: new Date().toISOString()
  }
  return Response.json(post)
})

farrowApp.post('/posts', {
  body: CreatePostRequest
}).use((request) => {
  const user = UserContext.get()
  
  const newPost = {
    id: Date.now(),
    ...request.body,
    createdAt: new Date().toISOString(),
    author: user?.name || 'Anonymous'
  }
  
  return Response.status(201).json(newPost)
})

// === Express Application ===
const app = express()
const PORT = 3000

// Express middleware
app.use(express.json())
app.use(express.static('public'))

// Express routes
app.get('/', (req, res) => {
  res.send(`
    <h1>Hybrid App</h1>
    <p>This app uses both Express and Farrow!</p>
    <ul>
      <li><a href="/legacy">Legacy Express Route</a></li>
      <li><a href="/api/posts">Farrow API Routes</a></li>
    </ul>
  `)
})

app.get('/legacy', (req, res) => {
  res.json({
    framework: 'Express',
    message: 'This is a legacy Express route'
  })
})

// Health check (Express)
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date() })
})

// === Integrate Farrow ===
// Mount Farrow application at /api path
app.use('/api', adapter(farrowApp))

// 404 handler (Express)
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' })
})

// Error handler (Express)
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({ error: 'Internal Server Error' })
})

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`)
  console.log('📍 Routes:')
  console.log('  Express: /, /legacy, /health')
  console.log('  Farrow:  /api/posts, /api/posts/:id')
})
```

## Use Cases

### Progressive Migration

When you have a large Express application you want to migrate to Farrow:

```typescript
// Keep existing Express routes
app.use('/v1', legacyExpressRouter)

// New features use Farrow
app.use('/v2', adapter(farrowApp))
```

### Microservice Integration

Mix different frameworks in microservice architecture:

```typescript
// Authentication service (Express)
app.use('/auth', expressAuthRouter)

// Business API (Farrow)
app.use('/api', adapter(farrowBusinessLogic))

// Admin panel (Express)
app.use('/admin', expressAdminRouter)
```

### Specific Feature Enhancement

Add type-safe APIs to Express applications:

```typescript
// Express handles web page rendering
app.get('/', (req, res) => {
  res.render('index')
})

// Farrow handles type-safe APIs
const apiApp = Http()

apiApp.post('/api/validate', {
  body: ComplexSchema
}).use((request) => {
  // Automatic validation and type inference
  return Response.json({ valid: true })
})

app.use(adapter(apiApp))
```

## API Reference

### adapter(app)

Convert a Farrow HTTP application to Express middleware.

```typescript
function adapter(app: HttpApp): express.RequestHandler
```

**Parameters:**
- `app`: Farrow HTTP application instance

**Returns:**
- Express middleware function

**Examples:**

```typescript
import { adapter } from 'farrow-express'
import { Http } from 'farrow-http'

const farrowApp = Http()
// ... configure Farrow application

// Use as middleware
app.use(adapter(farrowApp))

// Mount at specific path
app.use('/api', adapter(farrowApp))

// Conditional usage
if (process.env.USE_FARROW === 'true') {
  app.use('/modern', adapter(farrowApp))
}
```

## Migration Guide

### Migrating from Express to Farrow

1. **Install Dependencies**
   ```bash
   npm install farrow-http farrow-schema farrow-pipeline farrow-express
   ```

2. **Create Farrow Application**
   ```typescript
   const farrowApp = Http()
   ```

3. **Migrate Routes** (one by one)
   ```typescript
   // Express route
   app.get('/users/:id', (req, res) => {
     res.json({ id: req.params.id })
   })
   
   // Migrate to Farrow
   farrowApp.get('/users/<id:int>').use((request) => {
     return Response.json({ id: request.params.id })
   })
   ```

4. **Use Adapter**
   ```typescript
   // Remove Express route
   // app.get('/users/:id', handler)
   
   // Use Farrow version
   app.use(adapter(farrowApp))
   ```

5. **Progressive Migration**
   - Start with simple API routes
   - Gradually migrate complex business logic
   - Finally migrate middleware and global configuration

## Related Links

- [farrow-http Documentation](/en/ecosystem/farrow-http)
- [Express Official Documentation](https://expressjs.com/)
- [Migration Guide](/en/guide/migration)
- [GitHub](https://github.com/farrowjs/farrow)