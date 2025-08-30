# farrow-koa

Koa adapter that allows you to use Farrow in Koa applications.

## Overview

`farrow-koa` is an adapter package that allows you to seamlessly integrate Farrow HTTP applications into existing Koa applications. This is particularly useful for progressive migration or using Farrow's type safety features within the Koa ecosystem.

## Features

- 🔄 **Seamless Integration** - Use Farrow applications in Koa
- 🎯 **Maintain Type Safety** - Enjoy the benefits of Farrow's type system
- 📦 **Progressive Adoption** - Gradually migrate Koa applications to Farrow
- 🔧 **Ecosystem Compatibility** - Use both Koa and Farrow middleware simultaneously

## Installation

::: code-group

```bash [npm]
npm install farrow-koa
```

```bash [yarn]
yarn add farrow-koa
```

```bash [pnpm]
pnpm add farrow-koa
```

:::

## API Signature

```typescript
const adapter: (httpPipeline: HttpPipeline) => Middleware
```

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
farrowApp.get('/api/users').use(() => {
  return Response.json([
    { id: 1, name: 'Alice', email: 'alice@example.com' },
    { id: 2, name: 'Bob', email: 'bob@example.com' }
  ])
})

farrowApp.get('/api/users/<id:int>').use((request) => {
  return Response.json({
    id: request.params.id,
    name: 'Alice',
    email: 'alice@example.com'
  })
})

farrowApp.post('/api/users', {
  body: User
}).use((request) => {
  // request.body is validated and type-safe
  return Response.status(201).json(request.body)
})
```

### 2. Create Koa Application

Create a standard Koa application:

```typescript
import Koa from 'koa'
import Router from '@koa/router'

const app = new Koa()
const router = new Router()
const PORT = 3000

// Koa native routes
router.get('/', async (ctx) => {
  ctx.body = 'Koa Home Page'
})

router.get('/about', async (ctx) => {
  ctx.body = { message: 'About page from Koa' }
})

app.use(router.routes())
app.use(router.allowedMethods())
```

### 3. Integrate Both Frameworks

Use the `adapter` function to integrate the Farrow application into Koa:

```typescript
import { adapter } from 'farrow-koa'

// Use Farrow adapter before Koa routes
app.use(adapter(farrowApp))

// Koa routes (as fallback)
app.use(router.routes())
app.use(router.allowedMethods())

// Start server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`)
  console.log('Koa routes: /, /about')
  console.log('Farrow routes: /api/users, /api/users/:id')
})
```

## Complete Example

```typescript
import Koa from 'koa'
import Router from '@koa/router'
import bodyParser from 'koa-bodyparser'
import cors from '@koa/cors'
import { Http, Response } from 'farrow-http'
import { ObjectType, String, Number, Boolean, List } from 'farrow-schema'
import { createContext } from 'farrow-pipeline'
import { adapter } from 'farrow-koa'

// === Farrow Application ===
const farrowApp = Http()

// Schema definitions
class CreatePostRequest extends ObjectType {
  title = String
  content = String
  tags = List(String)
  published = Boolean
}

class Post extends ObjectType {
  id = Number
  title = String
  content = String
  tags = List(String)
  published = Boolean
  authorId = Number
  createdAt = String
  updatedAt = String
}

// Context
const UserContext = createContext<{ id: number; name: string; role: string } | null>(null)

// Mock database
let posts: any[] = [
  {
    id: 1,
    title: 'Getting Started with Farrow',
    content: 'Farrow is a type-safe web framework...',
    tags: ['farrow', 'typescript'],
    published: true,
    authorId: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
]

// Farrow middleware
farrowApp.use((request, next) => {
  // Get user info from request headers (example)
  const userId = request.headers['x-user-id']
  const userName = request.headers['x-user-name']
  const userRole = request.headers['x-user-role']
  
  if (userId) {
    UserContext.set({
      id: Number(userId),
      name: String(userName || 'User'),
      role: String(userRole || 'user')
    })
  }
  
  console.log(`[Farrow] ${request.method} ${request.pathname}`)
  return next(request)
})

// Farrow routes
farrowApp.get('/api/posts').use(() => {
  const user = UserContext.get()
  
  // Filter based on user role
  const filteredPosts = user?.role === 'admin' 
    ? posts 
    : posts.filter(p => p.published)
  
  return Response.json({
    posts: filteredPosts,
    total: filteredPosts.length,
    user: user?.name || 'Guest'
  })
})

farrowApp.get('/api/posts/<id:int>').use((request) => {
  const post = posts.find(p => p.id === request.params.id)
  
  if (!post) {
    return Response.status(404).json({ error: 'Post not found' })
  }
  
  const user = UserContext.get()
  if (!post.published && user?.role !== 'admin') {
    return Response.status(403).json({ error: 'Access denied' })
  }
  
  return Response.json(post)
})

farrowApp.post('/api/posts', {
  body: CreatePostRequest
}).use((request) => {
  const user = UserContext.get()
  
  if (!user) {
    return Response.status(401).json({ error: 'Authentication required' })
  }
  
  const newPost = {
    id: posts.length + 1,
    ...request.body,
    authorId: user.id,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
  
  posts.push(newPost)
  
  return Response
    .status(201)
    .json(newPost)
    .header('Location', `/api/posts/${newPost.id}`)
})

farrowApp.delete('/api/posts/<id:int>').use((request) => {
  const user = UserContext.get()
  
  if (!user || user.role !== 'admin') {
    return Response.status(403).json({ error: 'Admin access required' })
  }
  
  const index = posts.findIndex(p => p.id === request.params.id)
  
  if (index === -1) {
    return Response.status(404).json({ error: 'Post not found' })
  }
  
  posts.splice(index, 1)
  
  return Response.status(204).empty()
})

// === Koa Application ===
const app = new Koa()
const router = new Router()
const PORT = 3000

// Koa middleware
app.use(cors())
app.use(bodyParser())

// Logging middleware
app.use(async (ctx, next) => {
  const start = Date.now()
  await next()
  const ms = Date.now() - start
  console.log(`[Koa] ${ctx.method} ${ctx.url} - ${ms}ms`)
})

// Koa routes
router.get('/', async (ctx) => {
  ctx.body = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Farrow + Koa Hybrid App</title>
    </head>
    <body>
      <h1>Hybrid Application</h1>
      <p>This app combines Koa and Farrow!</p>
      <h2>Available Routes:</h2>
      <ul>
        <li><strong>Koa Routes:</strong></li>
        <ul>
          <li><a href="/">Home</a> (this page)</li>
          <li><a href="/health">Health Check</a></li>
          <li><a href="/stats">Statistics</a></li>
        </ul>
        <li><strong>Farrow API Routes:</strong></li>
        <ul>
          <li>GET /api/posts</li>
          <li>GET /api/posts/:id</li>
          <li>POST /api/posts</li>
          <li>DELETE /api/posts/:id</li>
        </ul>
      </ul>
    </body>
    </html>
  `
  ctx.type = 'html'
})

// Health check (Koa)
router.get('/health', async (ctx) => {
  ctx.body = {
    status: 'healthy',
    framework: 'Koa',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  }
})

// Statistics (Koa)
router.get('/stats', async (ctx) => {
  ctx.body = {
    totalPosts: posts.length,
    publishedPosts: posts.filter(p => p.published).length,
    framework: 'Koa',
    memory: process.memoryUsage()
  }
})

// === Integration ===
// Use Farrow adapter (before Koa routes)
app.use(adapter(farrowApp))

// Koa routes
app.use(router.routes())
app.use(router.allowedMethods())

// 404 handler (Koa)
app.use(async (ctx) => {
  ctx.status = 404
  ctx.body = {
    error: 'Not Found',
    path: ctx.url,
    timestamp: new Date().toISOString()
  }
})

// Error handling (Koa)
app.on('error', (err, ctx) => {
  console.error('Server error:', err)
  ctx.status = err.status || 500
  ctx.body = {
    error: err.message,
    timestamp: new Date().toISOString()
  }
})

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`)
  console.log('📍 Routes:')
  console.log('  Koa:    /, /health, /stats')
  console.log('  Farrow: /api/posts, /api/posts/:id')
})
```

## Use Cases

### Progressive Migration

When you have a large Koa application you want to migrate to Farrow:

```typescript
// Keep existing Koa middleware and routes
app.use(koaSession())
app.use(koaCompress())
app.use(legacyRouter.routes())

// New features use Farrow
const farrowApp = Http()
// ... configure Farrow routes

app.use(adapter(farrowApp))
```

### API Version Management

Use different frameworks to handle different API versions:

```typescript
// v1 API - using Koa (legacy)
const v1Router = new Router({ prefix: '/api/v1' })
v1Router.get('/users', async (ctx) => {
  ctx.body = await getLegacyUsers()
})

// v2 API - using Farrow (new)
const v2App = Http()
v2App.get('/api/v2/users').use(() => {
  return Response.json(getUsers())
})

app.use(v1Router.routes())
app.use(adapter(v2App))
```

### Specific Feature Enhancement

Add type-safe APIs to Koa applications:

```typescript
// Koa handles file upload, WebSocket, etc.
app.use(koaStatic('./public'))
app.use(koaMulter().single('file'))

// Farrow handles complex business APIs
const apiApp = Http()

apiApp.post('/api/process', {
  body: ComplexDataSchema
}).use((request) => {
  // Automatic validation and type inference
  const result = processData(request.body)
  return Response.json(result)
})

app.use(adapter(apiApp))
```

## Migration Guide

### Migrating from Koa to Farrow

1. **Install Dependencies**
   ```bash
   npm install farrow-http farrow-schema farrow-pipeline farrow-koa
   ```

2. **Create Farrow Application**
   ```typescript
   const farrowApp = Http()
   ```

3. **Migrate Routes** (one by one)
   ```typescript
   // Koa route
   router.get('/users/:id', async (ctx) => {
     const user = await getUser(ctx.params.id)
     ctx.body = user
   })
   
   // Migrate to Farrow
   farrowApp.get('/users/<id:int>').use(async (request) => {
     const user = await getUser(request.params.id)
     return Response.json(user)
   })
   ```

4. **Use Adapter**
   ```typescript
   app.use(adapter(farrowApp))
   ```

5. **Progressive Migration**
   - Start with simple CRUD APIs
   - Gradually migrate complex business logic
   - Finally migrate middleware and global configuration

## Comparison with farrow-express

| Feature | farrow-koa | farrow-express |
|---------|------------|----------------|
| **Integration** | As Koa middleware | Mount to Express paths |
| **Async Support** | Native async/await | Need to handle callbacks |
| **Context** | Koa ctx | Express req/res |
| **Middleware Model** | Onion model | Linear model |
| **Ecosystem** | Koa ecosystem | Express ecosystem |

## Related Links

- [farrow-http Documentation](/en/ecosystem/farrow-http)
- [farrow-express Documentation](/en/ecosystem/farrow-express)
- [Koa Official Documentation](https://koajs.com/)
- [GitHub](https://github.com/farrowjs/farrow)