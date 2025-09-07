# Router System & Modular Routing

> Build maintainable and scalable routing with the Farrow Router system 🏗️

As your application grows, organizing routes becomes crucial. Farrow's Router system provides powerful tools for building modular, maintainable routing architectures.

## Router Basics

### Router Design Philosophy

The Farrow Router system is designed based on these core principles:

- **🧩 Modularity First** - Each Router is an independent, reusable routing module
- **🔗 Composition Over Inheritance** - Build complex routing structures by composing simple routers  
- **🎯 Single Responsibility** - Each Router handles routing for a specific functional domain
- **♻️ Reusability** - The same Router can be mounted to different paths
- **🔧 Easy Maintenance** - Routers can be independently developed, tested, and maintained

### Creating and Using Router

The Router is Farrow's tool for organizing routes into logical modules:

```typescript
import { Http, Router, Response } from 'farrow-http'

// Create Router
const userRouter = Router()
  .get('/').use(() => Response.json({ users: [] }))
  .post('/').use(() => Response.json({ created: true }))
  .get('/<id:int>').use((request) => {
    return Response.json({ id: request.params.id })
  })

const app = Http()
app.route('/users').use(userRouter)
```

### Router Core Capabilities

**Router instances have the same complete API as the main application:**

```typescript
const router = Router()

// ✅ All HTTP methods
router.get('/items').use(getItems)
router.post('/items').use(createItems)
router.put('/items/<id:int>').use(updateItem)

// ✅ Middleware support
router.use(loggingMiddleware)
router.use(authMiddleware)

// ✅ Nested routing
router.route('/admin').use(adminRouter)

// ✅ Static file serving
router.serve('/static', './public')

// ✅ Advanced route matching
router.match({ url: '/api/<id:int>', method: 'GET' })
```

This design ensures Router consistency and predictability - anything you can do on the main application, you can also do on a Router.

### HTTP Method Support

Router supports all standard HTTP methods:

```typescript
const router = Router()
  .get('/items').use(getItems)
  .post('/items').use(createItem)
  .put('/items/<id:int>').use(updateItem)
  .patch('/items/<id:int>').use(patchItem)
  .delete('/items/<id:int>').use(deleteItem)
  .head('/items/<id:int>').use(getItemHead)
  .options('/items').use(getItemOptions)
```

### Router Chaining

Router methods can be chained for clean, readable code:

```typescript
const apiRouter = Router()
  .get('/health').use(() => Response.json({ status: 'ok' }))
  .get('/version').use(() => Response.json({ version: '1.0.0' }))
  .use(loggingMiddleware)  // Apply middleware
  .get('/data').use(getData)
  .post('/data').use(createData)
```

## Router Composition Patterns

### Router() and route() Working Together

`Router()` and `route()` methods are designed to work collaboratively:

- **`Router()`** - Creates independent, reusable router instances
- **`route()`** - Assigns path prefixes to routers and mounts them to the application

```typescript
// Standard three-step pattern
// 1. Create independent routers
const userRouter = Router()
const adminRouter = Router()

// 2. Configure routers
userRouter.get('/profile').use(getUserProfile)
userRouter.get('/settings').use(getUserSettings)

adminRouter.get('/dashboard').use(getAdminDashboard)
adminRouter.get('/users').use(getAllUsers)

// 3. Use route() to mount to specific paths
app.route('/users').use(userRouter)    // /users/profile, /users/settings
app.route('/admin').use(adminRouter)   // /admin/dashboard, /admin/users
```

**Why This Design?**

| Feature | Benefit |
|---------|---------|
| **Modularity** | Routers can be defined and exported in separate files |
| **Reusability** | Same Router can be mounted to different paths |
| **Path Management** | route() uniformly manages path prefixes |
| **Test Friendly** | Routers can be tested independently |
| **Team Collaboration** | Different developers can independently develop different routers |

### Basic Router Composition

Compose multiple routers to build complex routing structures:

```typescript
// Sub-route modules
const authRouter = Router()
  .post('/login').use(handleLogin)
  .post('/logout').use(handleLogout)
  .post('/register').use(handleRegister)

const userRouter = Router()
  .get('/profile').use(getProfile)
  .put('/profile').use(updateProfile)
  .get('/settings').use(getSettings)

// Composition method 1: compose within Router
const apiRouter = Router()
  .route('/auth').use(authRouter)
  .route('/user').use(userRouter)

const app = Http()
app.route('/api').use(apiRouter)

// Final routes:
// POST /api/auth/login
// POST /api/auth/logout
// POST /api/auth/register
// GET /api/user/profile
// PUT /api/user/profile
// GET /api/user/settings
```

### Nested Routing

Build deeply nested routing structures:

```typescript
// User routes
const userRouter = Router()
  .get('/').use(() => Response.json({ users: [] }))
  .get('/<id:int>').use((request) => {
    return Response.json({ id: request.params.id })
  })

// User posts routes
const userPostsRouter = Router()
  .get('/').use((request) => {
    const { userId } = request.params
    return Response.json({ userId, posts: [] })
  })
  .post('/').use((request) => {
    const { userId } = request.params
    return Response.json({ userId, created: true })
  })

// Nested composition
userRouter.route('/<userId:int>/posts').use(userPostsRouter)

const app = Http()
app.route('/users').use(userRouter)

// Result: 
// GET /users
// GET /users/:id  
// GET /users/:userId/posts
// POST /users/:userId/posts
```

### Domain-Based Organization

Organize routers by business domains:

```typescript
// E-commerce domain routers
const productRouter = Router()
  .get('/').use(listProducts)
  .get('/<id:int>').use(getProduct)
  .get('/<id:int>/reviews').use(getProductReviews)

const orderRouter = Router()
  .get('/').use(listOrders)
  .post('/').use(createOrder)
  .get('/<id:int>').use(getOrder)
  .put('/<id:int>/status').use(updateOrderStatus)

const cartRouter = Router()
  .get('/').use(getCart)
  .post('/items').use(addToCart)
  .delete('/items/<itemId:int>').use(removeFromCart)

// Compose shop API
const shopRouter = Router()
  .route('/products').use(productRouter)
  .route('/orders').use(orderRouter)
  .route('/cart').use(cartRouter)

const app = Http()
app.route('/api/shop').use(shopRouter)
```

## Middleware Integration

### Router-level Middleware

Apply middleware to entire router or specific routes:

```typescript
const authMiddleware = (request: any, next: any) => {
  const token = request.headers.authorization
  if (!token) {
    return Response.status(401).json({ error: 'Unauthorized' })
  }
  return next(request)
}

// Apply middleware to all routes in router
const protectedRouter = Router()
  .use(authMiddleware)  // applies to all routes below
  .get('/data').use(() => Response.json({ data: 'secret' }))
  .post('/action').use(() => Response.json({ success: true }))

// Apply multiple middleware
const adminRouter = Router()
  .use(authMiddleware)
  .use(requireAdminRole)
  .use(auditLogging)
  .get('/dashboard').use(getDashboard)
  .get('/users').use(getAllUsers)
```

### Selective Middleware Application

Apply middleware only to specific routes:

```typescript
const apiRouter = Router()
  // Public routes (no middleware)
  .get('/health').use(() => Response.json({ status: 'ok' }))
  .get('/version').use(() => Response.json({ version: '1.0' }))
  
  // Protected routes with auth middleware
  .get('/profile').use(authMiddleware).use(getProfile)
  .get('/settings').use(authMiddleware).use(getSettings)
  
  // Admin routes with additional middleware  
  .get('/admin').use(authMiddleware).use(requireAdmin).use(getAdminPanel)
```

## route Method Explained

The `route` method is used to mount sub-routers at specific paths:

### Basic Usage

```typescript
// Used on Http
const app = Http()
app.route('/api').use(apiRouter)
app.route('/admin').use(adminRouter)

// Used on Router
const mainRouter = Router()
  .route('/v1').use(v1Router)
  .route('/v2').use(v2Router)

app.route('/api').use(mainRouter)
```

### Parameterized Paths

Mount routers at parameterized paths:

```typescript
const userSpecificRouter = Router()
  .get('/posts').use((request) => {
    const { userId } = request.params
    return Response.json({ userId, posts: [] })
  })
  .get('/followers').use((request) => {
    const { userId } = request.params
    return Response.json({ userId, followers: [] })
  })

app.route('/users/<userId:int>').use(userSpecificRouter)
// Result: 
// GET /users/123/posts
// GET /users/123/followers
```

## use Method Explained

The `use` method has multiple purposes in Router:

### Adding Middleware

```typescript
const router = Router()

// Add middleware to all subsequent routes
router.use((request, next) => {
  console.log(`${request.method} ${request.pathname}`)
  return next(request)
})

// Add route handler
router.get('/hello').use((request) => {
  return Response.text('Hello!')
})

// Chain multiple middleware
router.get('/protected')
  .use(authMiddleware)
  .use(validatePermissions)
  .use((request) => {
    return Response.json({ message: 'Protected data' })
  })
```

### Mounting Sub-Routers

```typescript
const mainRouter = Router()

// Mount sub-router using use method
mainRouter.route('/api').use(apiRouter)
mainRouter.route('/auth').use(authRouter)

// Equivalent to direct mounting
const app = Http()
app.use('/main', mainRouter)
```

## Practical Examples

### Modular API Structure

```typescript
// Feature-based modules
const authModule = Router()
  .post('/login').use(handleLogin)
  .post('/register').use(handleRegister)
  .post('/refresh').use(refreshToken)

const userModule = Router()
  .use(authMiddleware) // all user routes require auth
  .get('/profile').use(getProfile)
  .put('/profile').use(updateProfile)
  .delete('/account').use(deleteAccount)

const postModule = Router()
  .get('/').use(listPosts)
  .get('/<id:int>').use(getPost)
  .post('/').use(authMiddleware).use(createPost)
  .put('/<id:int>').use(authMiddleware).use(updatePost)

// Main application composition
const app = Http()
  .route('/auth').use(authModule)
  .route('/user').use(userModule)  
  .route('/posts').use(postModule)
```

### Versioned API Architecture

```typescript
// Version 1 API
const v1Router = Router()
  .get('/users').use(() => Response.json({ 
    users: [], 
    version: 'v1',
    deprecated: true 
  }))

// Version 2 API  
const v2Router = Router()
  .get('/users').use(() => Response.json({ 
    users: [], 
    version: 'v2',
    features: ['pagination', 'filtering']
  }))
  .get('/users/<id:int>').use((request) => {
    return Response.json({ 
      id: request.params.id, 
      version: 'v2' 
    })
  })

// Version composition
const apiRouter = Router()
  .route('/v1').use(v1Router)
  .route('/v2').use(v2Router)

const app = Http()
  .route('/api').use(apiRouter)
```

### Environment-Specific Routing

```typescript
const app = Http()

// Production routes
const productionRouter = Router()
  .get('/metrics').use(getMetrics)
  .get('/health').use(getHealth)

// Development routes  
const developmentRouter = Router()
  .get('/debug').use(getDebugInfo)
  .get('/test-data').use(generateTestData)
  .post('/reset-db').use(resetDatabase)

// Conditional mounting
if (process.env.NODE_ENV === 'production') {
  app.route('/admin').use(productionRouter)
} else {
  app.route('/admin').use(productionRouter)
  app.route('/dev').use(developmentRouter)
}
```

### Microservices Gateway Pattern

```typescript
// Service-specific routers
const userServiceRouter = Router()
  .get('/users').use(forwardToUserService)
  .get('/users/<id:int>').use(forwardToUserService)

const orderServiceRouter = Router()
  .get('/orders').use(forwardToOrderService)
  .post('/orders').use(forwardToOrderService)

const paymentServiceRouter = Router()
  .post('/payments').use(forwardToPaymentService)
  .get('/payments/<id:int>').use(forwardToPaymentService)

// Gateway composition
const gatewayRouter = Router()
  .use(rateLimitingMiddleware)
  .use(authenticationMiddleware)
  .route('/users').use(userServiceRouter)
  .route('/orders').use(orderServiceRouter)
  .route('/payments').use(paymentServiceRouter)

const gateway = Http()
  .route('/api/v1').use(gatewayRouter)
```

### File-Separated Modular Pattern

Separate different functional routers into independent files:

```typescript
// routes/auth.ts
export const authRouter = Router()
  .post('/login').use(handleLogin)
  .post('/logout').use(handleLogout)
  .post('/register').use(handleRegister)

// routes/users.ts  
export const usersRouter = Router()
  .get('/').use(listUsers)
  .get('/<id:int>').use(getUserById)
  .post('/').use(createUser)

// routes/posts.ts
export const postsRouter = Router()
  .get('/').use(listPosts)
  .get('/<id:int>').use(getPostById)
  .post('/').use(authMiddleware).use(createPost)

// main.ts - Main application assembly
import { authRouter } from './routes/auth'
import { usersRouter } from './routes/users'
import { postsRouter } from './routes/posts'

const app = Http()
  .route('/auth').use(authRouter)
  .route('/users').use(usersRouter)
  .route('/posts').use(postsRouter)
```

### Complex Nested Routing Example

Build enterprise-level application routing architecture:

```typescript
// API v1 router
const apiV1Router = Router()

// User management module
const usersRouter = Router()
  .get('/').use(getUsers)
  .post('/').use(createUser)
  .get('/<id:int>').use(getUserById)
  .put('/<id:int>').use(updateUser)

// Product management module
const productsRouter = Router()
  .get('/').use(getProducts)
  .post('/').use(createProduct)
  .get('/<id:int>/reviews').use(getProductReviews)

// Order management module
const ordersRouter = Router()
  .get('/').use(getOrders)
  .post('/').use(createOrder)
  .get('/<id:int>').use(getOrderById)

// Build complete API structure
apiV1Router
  .route('/users').use(usersRouter)       // /api/v1/users/*
  .route('/products').use(productsRouter) // /api/v1/products/*  
  .route('/orders').use(ordersRouter)     // /api/v1/orders/*

// Mount to main application
app.route('/api/v1').use(apiV1Router)
```

## Best Practices

### Router Organization

```typescript
// ✅ Good: Organize by feature/domain
const userManagement = Router()
const contentManagement = Router()
const authenticationSystem = Router()

// ❌ Avoid: Generic naming
const router1 = Router()
const apiRouter = Router()
const mainRouter = Router()
```

### Router Design Principles

```typescript
// ✅ Follow single responsibility principle
const userRouter = Router()
  // Only handle user-related functionality
  .get('/profile').use(getUserProfile)
  .put('/profile').use(updateUserProfile)
  .get('/settings').use(getUserSettings)

// ✅ Maintain router reusability
const authRouter = Router()
  .post('/login').use(handleLogin)
  .post('/logout').use(handleLogout)
  
// Can be reused in multiple places
app.route('/api/v1/auth').use(authRouter)
app.route('/mobile/auth').use(authRouter)

// ✅ Use descriptive router names
const blogPostManagement = Router()      // Clearly expresses intent
const userAccountOperations = Router()   // Defines functional scope
const paymentProcessingSystem = Router() // Accurately describes responsibility
```

### Middleware Layering

```typescript
// ✅ Good: Layer middleware logically
const apiRouter = Router()
  .use(loggingMiddleware)      // First: logging
  .use(corsMiddleware)         // Second: CORS
  .use(authMiddleware)         // Third: authentication
  .use(validationMiddleware)   // Fourth: validation
  .route('/users').use(userRouter)

// ❌ Avoid: Random middleware order
const badRouter = Router()
  .use(authMiddleware)
  .use(loggingMiddleware)
  .use(corsMiddleware)         // CORS should be earlier
```

### Path Consistency

```typescript
// ✅ Good: Consistent path patterns
const apiRouter = Router()
  .route('/users').use(userRouter)
  .route('/posts').use(postRouter)
  .route('/comments').use(commentRouter)

// ❌ Avoid: Inconsistent patterns
const badRouter = Router()
  .route('/user').use(userRouter)      // singular
  .route('/posts').use(postRouter)     // plural  
  .route('/comment-system').use(commentRouter) // different pattern
```

## Summary

The Farrow Router system provides powerful tools for building maintainable routing architectures:

- 🏗️ **Modular Design** - Organize routes into logical, reusable modules
- 🔧 **Flexible Composition** - Build complex routing structures through Router() and route() collaboration
- 🛡️ **Middleware Integration** - Apply middleware at router or route level
- 📈 **Scalable Architecture** - Support for microservices and versioned APIs
- 🎯 **Type Safety** - Complete TypeScript support throughout
- ♻️ **High Reusability** - Same Router can be mounted to different paths
- 🧩 **Single Responsibility** - Each Router focuses on a specific functional domain
- 🔧 **Easy Maintenance** - Routers can be independently developed, tested, and maintained

By properly utilizing Router design philosophy and best practices, you can build both powerful and maintainable routing systems that scale with your application's growth.