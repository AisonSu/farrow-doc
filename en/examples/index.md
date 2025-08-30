# Practical Examples

> Master Farrow's best practices through complete project examples

## Example Projects

### Basic Examples

<div class="example-grid">

#### [Hello World](/en/examples/hello-world)
The simplest Farrow application, get started in 5 minutes.

#### [TODO API](/en/examples/todo-api)
Classic TODO application, learn CRUD operations and state management.

#### [User Authentication](/en/examples/authentication)
JWT authentication system, including login, registration and access control.

#### [File Upload](/en/examples/file-upload)
Handle file uploads, including progress tracking and type validation.

</div>

### Advanced Examples

<div class="example-grid">

#### [Blog System](/en/examples/blog-system)
Complete blog API, including articles, comments, tags and other features.

#### [E-commerce API](/en/examples/e-commerce)
Simulated e-commerce system, including products, orders, payments and other modules.

#### [Real-time Chat](/en/examples/real-time-chat)
WebSocket real-time communication, build chat applications.

#### [Microservices Architecture](/en/examples/microservices)
Build microservices with Farrow, including service discovery and communication.

</div>

### Specialized Examples

<div class="example-grid">

#### [Database Integration](/en/examples/database-integration)
Integration examples with ORMs like TypeORM, Prisma, etc.

#### [GraphQL API](/en/examples/graphql-api)
Build GraphQL services using farrow-graphql.

#### [Testing Strategies](/en/examples/testing-strategies)
Unit testing, integration testing, and E2E testing examples.

#### [Deployment Solutions](/en/examples/deployment)
Docker, Kubernetes, Serverless deployment examples.

</div>

## Quick Start

### 1. Clone Example Repository

```bash
git clone https://github.com/farrowjs/examples.git
cd examples
```

### 2. Choose a Project

```bash
cd hello-world  # or other project
npm install
```

### 3. Run Project

```bash
npm run dev
```

## Learning Paths

### Beginner Path

1. **Hello World** - Understand basic structure
2. **TODO API** - Learn CRUD and routing
3. **User Authentication** - Master middleware and Context
4. **Blog System** - Comprehensive application

### Advanced Path

1. **Database Integration** - Learn data persistence
2. **GraphQL API** - Explore different API styles
3. **Microservices Architecture** - Build distributed systems
4. **Deployment Solutions** - Production environment practice

### Expert Path

1. **Performance Optimization** - Learn caching, concurrency handling
2. **Security Practices** - Protect against common attacks
3. **Monitoring and Alerting** - Build observable systems
4. **CI/CD Pipeline** - Automated deployment

## Project Structure Best Practices

### Recommended Directory Structure

```
my-farrow-app/
├── src/
│   ├── api/           # API routes
│   │   ├── users/
│   │   ├── posts/
│   │   └── index.ts
│   ├── services/      # Business logic
│   │   ├── auth.ts
│   │   └── database.ts
│   ├── schemas/       # Schema definitions
│   │   ├── user.ts
│   │   └── post.ts
│   ├── middlewares/   # Middleware
│   │   ├── auth.ts
│   │   └── logger.ts
│   ├── contexts/      # Context definitions
│   │   └── user.ts
│   ├── utils/         # Utility functions
│   └── index.ts       # Entry file
├── tests/             # Test files
├── docs/              # Documentation
└── package.json
```

### Modular Organization

```typescript
// src/api/users/index.ts
import { Router } from 'farrow-http'
import { UserService } from '../../services/user'
import { authenticate } from '../../middlewares/auth'

export const userRouter = Router()

userRouter.get('/users').use(getUserList)
userRouter.get('/users/<id:int>').use(getUserById)
userRouter.post('/users', { body: CreateUserSchema }).use(createUser)
userRouter.use('/users/*', authenticate)  // Routes requiring authentication

// src/index.ts
import { Http } from 'farrow-http'
import { userRouter } from './api/users'
import { postRouter } from './api/posts'

const app = Http()

app.use('/api', userRouter)
app.use('/api', postRouter)

app.listen(3000)
```

## Code Snippets

### Authentication Middleware

```typescript
export const authenticate = (request, next) => {
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
```

### Error Handling

```typescript
export const errorHandler = (request, next) => {
  try {
    return next(request)
  } catch (error) {
    if (error instanceof ValidationError) {
      return Response.status(400).json({
        error: 'Validation failed',
        details: error.details
      })
    }
    
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
}
```

### Pagination Handling

```typescript
class PaginationQuery extends ObjectType {
  page = Number
  limit = Number
}

app.get('/api/posts', { query: PaginationQuery }).use((request) => {
  const { page = 1, limit = 10 } = request.query
  
  const posts = await getPosts({
    offset: (page - 1) * limit,
    limit
  })
  
  return Response.json({
    data: posts,
    pagination: {
      page,
      limit,
      total: await getPostCount()
    }
  })
})
```

## Common Patterns

### 1. Request Validation

```typescript
class CreatePostRequest extends ObjectType {
  title = String
  content = String
  tags = List(String)
}

app.post('/posts', { 
  body: CreatePostRequest 
}).use((request) => {
  // request.body is validated and type-safe
  const post = await createPost(request.body)
  return Response.status(201).json(post)
})
```

### 2. Access Control

```typescript
const requireRole = (role: string) => (request, next) => {
  const user = UserContext.get()
  
  if (!user || user.role !== role) {
    return Response.status(403).json({ 
      error: 'Insufficient permissions' 
    })
  }
  
  return next(request)
}

app.delete('/posts/<id:int>')
  .use(authenticate)
  .use(requireRole('admin'))
  .use(deletePost)
```

### 3. Caching Strategy

```typescript
const cache = new Map()

const withCache = (key: string, ttl: number) => (request, next) => {
  const cached = cache.get(key)
  
  if (cached && cached.expires > Date.now()) {
    return Response.json(cached.data)
  }
  
  const response = next(request)
  
  if (response.status === 200) {
    cache.set(key, {
      data: response.body,
      expires: Date.now() + ttl
    })
  }
  
  return response
}

app.get('/api/trending')
  .use(withCache('trending', 60000))  // Cache for 1 minute
  .use(getTrendingPosts)
```

## Testing Examples

### Unit Testing

```typescript
import { test, expect } from 'vitest'
import { Http } from 'farrow-http'
import { userRouter } from '../src/api/users'

test('GET /users returns user list', async () => {
  const app = Http()
  app.use(userRouter)
  
  const response = await app.handle({
    method: 'GET',
    pathname: '/users'
  })
  
  expect(response.status).toBe(200)
  expect(response.body).toBeInstanceOf(Array)
})
```

### Integration Testing

```typescript
import { test, beforeAll, afterAll } from 'vitest'
import { createTestClient } from './utils'

let client

beforeAll(async () => {
  client = await createTestClient()
})

afterAll(async () => {
  await client.close()
})

test('User registration flow', async () => {
  // Registration
  const registerRes = await client.post('/register', {
    email: 'test@example.com',
    password: 'password123'
  })
  expect(registerRes.status).toBe(201)
  
  // Login
  const loginRes = await client.post('/login', {
    email: 'test@example.com',
    password: 'password123'
  })
  expect(loginRes.status).toBe(200)
  expect(loginRes.body).toHaveProperty('token')
  
  // Access protected resource
  const profileRes = await client.get('/profile', {
    headers: {
      Authorization: `Bearer ${loginRes.body.token}`
    }
  })
  expect(profileRes.status).toBe(200)
})
```

## Deployment Examples

### Docker

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000
CMD ["node", "dist/index.js"]
```

### PM2

```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'farrow-app',
    script: './dist/index.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
}
```

## Getting Help

### Related Documentation

- [API Reference](/en/api/) - Complete API documentation
- [Core Concepts](/en/guide/core-concepts) - Understand framework design
- [Best Practices](/en/guide/best-practices) - Production environment recommendations

### Report Issues

Found a bug or have improvement suggestions? Feel free to submit an Issue on [GitHub](https://github.com/farrow-js/farrow)!

<style>
.example-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin: 2rem 0;
}

.example-grid h4 {
  margin: 0 0 0.5rem 0;
}

.example-grid > div {
  padding: 1rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  transition: all 0.3s;
}

.example-grid > div:hover {
  border-color: var(--vp-c-brand);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}
</style>