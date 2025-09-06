# Router 系统与模块化路由

> 使用 Farrow Router 系统构建可维护、可扩展的路由架构 🏗️

随着应用程序的增长，组织路由变得至关重要。Farrow 的 Router 系统提供了强大的工具来构建模块化、可维护的路由架构。

## Router 基础

### 创建和使用 Router

Router 是 Farrow 用于将路由组织成逻辑模块的工具：

```typescript
import { Http, Router, Response } from 'farrow-http'

// 创建 Router
const userRouter = Router()
  .get('/').use(() => Response.json({ users: [] }))
  .post('/').use(() => Response.json({ created: true }))
  .get('/<id:int>').use((request) => {
    return Response.json({ id: request.params.id })
  })

const app = Http()
app.route('/users').use(userRouter)
```

### HTTP 方法支持

Router 支持所有标准 HTTP 方法：

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

### Router 链式调用

Router 方法可以链式调用，使代码简洁易读：

```typescript
const apiRouter = Router()
  .get('/health').use(() => Response.json({ status: 'ok' }))
  .get('/version').use(() => Response.json({ version: '1.0.0' }))
  .use(loggingMiddleware)  // 应用中间件
  .get('/data').use(getData)
  .post('/data').use(createData)
```

## Router 组合

### 基础 Router 组合

组合多个路由器构建复杂的路由结构：

```typescript
// 子路由模块
const authRouter = Router()
  .post('/login').use(handleLogin)
  .post('/logout').use(handleLogout)
  .post('/register').use(handleRegister)

const userRouter = Router()
  .get('/profile').use(getProfile)
  .put('/profile').use(updateProfile)
  .get('/settings').use(getSettings)

// 组合方式1: 在 Router 中组合
const apiRouter = Router()
  .route('/auth').use(authRouter)
  .route('/user').use(userRouter)

const app = Http()
app.route('/api').use(apiRouter)

// 最终路由:
// POST /api/auth/login
// POST /api/auth/logout
// POST /api/auth/register
// GET /api/user/profile
// PUT /api/user/profile
// GET /api/user/settings
```

### 嵌套路由

构建深度嵌套的路由结构：

```typescript
// 用户路由
const userRouter = Router()
  .get('/').use(() => Response.json({ users: [] }))
  .get('/<id:int>').use((request) => {
    return Response.json({ id: request.params.id })
  })

// 用户文章路由
const userPostsRouter = Router()
  .get('/').use((request) => {
    const { userId } = request.params
    return Response.json({ userId, posts: [] })
  })
  .post('/').use((request) => {
    const { userId } = request.params
    return Response.json({ userId, created: true })
  })

// 嵌套组合
userRouter.route('/<userId:int>/posts').use(userPostsRouter)

const app = Http()
app.route('/users').use(userRouter)

// 结果：
// GET /users
// GET /users/:id  
// GET /users/:userId/posts
// POST /users/:userId/posts
```

### 领域驱动的组织

按业务领域组织路由器：

```typescript
// 电商领域路由器
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

// 组合商城 API
const shopRouter = Router()
  .route('/products').use(productRouter)
  .route('/orders').use(orderRouter)
  .route('/cart').use(cartRouter)

const app = Http()
app.route('/api/shop').use(shopRouter)
```

## 中间件集成

### Router 级中间件

对整个路由器或特定路由应用中间件：

```typescript
const authMiddleware = (request: any, next: any) => {
  const token = request.headers.authorization
  if (!token) {
    return Response.status(401).json({ error: 'Unauthorized' })
  }
  return next(request)
}

// 将中间件应用到路由器的所有路由
const protectedRouter = Router()
  .use(authMiddleware)  // 应用到下面所有路由
  .get('/data').use(() => Response.json({ data: 'secret' }))
  .post('/action').use(() => Response.json({ success: true }))

// 应用多个中间件
const adminRouter = Router()
  .use(authMiddleware)
  .use(requireAdminRole)
  .use(auditLogging)
  .get('/dashboard').use(getDashboard)
  .get('/users').use(getAllUsers)
```

### 选择性中间件应用

只对特定路由应用中间件：

```typescript
const apiRouter = Router()
  // 公开路由（无中间件）
  .get('/health').use(() => Response.json({ status: 'ok' }))
  .get('/version').use(() => Response.json({ version: '1.0' }))
  
  // 受保护的路由使用认证中间件
  .get('/profile').use(authMiddleware).use(getProfile)
  .get('/settings').use(authMiddleware).use(getSettings)
  
  // 管理员路由使用额外中间件  
  .get('/admin').use(authMiddleware).use(requireAdmin).use(getAdminPanel)
```

## route 方法详解

`route` 方法用于在特定路径挂载子路由器：

### 基础用法

```typescript
// 在 Http 上使用
const app = Http()
app.route('/api').use(apiRouter)
app.route('/admin').use(adminRouter)

// 在 Router 上使用
const mainRouter = Router()
  .route('/v1').use(v1Router)
  .route('/v2').use(v2Router)

app.route('/api').use(mainRouter)
```

### 参数化路径

在参数化路径上挂载路由器：

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
// 结果：
// GET /users/123/posts
// GET /users/123/followers
```

## use 方法详解

Router 中的 `use` 方法有多种用途：

### 添加中间件

```typescript
const router = Router()

// 为所有后续路由添加中间件
router.use((request, next) => {
  console.log(`${request.method} ${request.pathname}`)
  return next(request)
})

// 添加路由处理器
router.get('/hello').use((request) => {
  return Response.text('Hello!')
})

// 链式多个中间件
router.get('/protected')
  .use(authMiddleware)
  .use(validatePermissions)
  .use((request) => {
    return Response.json({ message: 'Protected data' })
  })
```

### 挂载子路由器

```typescript
const mainRouter = Router()

// 使用 use 方法挂载子路由器
mainRouter.route('/api').use(apiRouter)
mainRouter.route('/auth').use(authRouter)

// 等价于直接挂载
const app = Http()
app.use('/main', mainRouter)
```

## 实践示例

### 模块化 API 结构

```typescript
// 基于功能的模块
const authModule = Router()
  .post('/login').use(handleLogin)
  .post('/register').use(handleRegister)
  .post('/refresh').use(refreshToken)

const userModule = Router()
  .use(authMiddleware) // 所有用户路由都需要认证
  .get('/profile').use(getProfile)
  .put('/profile').use(updateProfile)
  .delete('/account').use(deleteAccount)

const postModule = Router()
  .get('/').use(listPosts)
  .get('/<id:int>').use(getPost)
  .post('/').use(authMiddleware).use(createPost)
  .put('/<id:int>').use(authMiddleware).use(updatePost)

// 主应用组合
const app = Http()
  .route('/auth').use(authModule)
  .route('/user').use(userModule)  
  .route('/posts').use(postModule)
```

### 版本化 API 架构

```typescript
// 版本1 API
const v1Router = Router()
  .get('/users').use(() => Response.json({ 
    users: [], 
    version: 'v1',
    deprecated: true 
  }))

// 版本2 API  
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

// 版本组合
const apiRouter = Router()
  .route('/v1').use(v1Router)
  .route('/v2').use(v2Router)

const app = Http()
  .route('/api').use(apiRouter)
```

### 环境特定路由

```typescript
const app = Http()

// 生产环境路由
const productionRouter = Router()
  .get('/metrics').use(getMetrics)
  .get('/health').use(getHealth)

// 开发环境路由  
const developmentRouter = Router()
  .get('/debug').use(getDebugInfo)
  .get('/test-data').use(generateTestData)
  .post('/reset-db').use(resetDatabase)

// 条件挂载
if (process.env.NODE_ENV === 'production') {
  app.route('/admin').use(productionRouter)
} else {
  app.route('/admin').use(productionRouter)
  app.route('/dev').use(developmentRouter)
}
```

### 微服务网关模式

```typescript
// 服务特定的路由器
const userServiceRouter = Router()
  .get('/users').use(forwardToUserService)
  .get('/users/<id:int>').use(forwardToUserService)

const orderServiceRouter = Router()
  .get('/orders').use(forwardToOrderService)
  .post('/orders').use(forwardToOrderService)

const paymentServiceRouter = Router()
  .post('/payments').use(forwardToPaymentService)
  .get('/payments/<id:int>').use(forwardToPaymentService)

// 网关组合
const gatewayRouter = Router()
  .use(rateLimitingMiddleware)
  .use(authenticationMiddleware)
  .route('/users').use(userServiceRouter)
  .route('/orders').use(orderServiceRouter)
  .route('/payments').use(paymentServiceRouter)

const gateway = Http()
  .route('/api/v1').use(gatewayRouter)
```

## 最佳实践

### Router 组织

```typescript
// ✅ 好：按功能/领域组织
const userManagement = Router()
const contentManagement = Router()
const authenticationSystem = Router()

// ❌ 避免：通用命名
const router1 = Router()
const apiRouter = Router()
const mainRouter = Router()
```

### 中间件分层

```typescript
// ✅ 好：逻辑分层中间件
const apiRouter = Router()
  .use(loggingMiddleware)      // 首先：日志记录
  .use(corsMiddleware)         // 第二：CORS
  .use(authMiddleware)         // 第三：认证
  .use(validationMiddleware)   // 第四：验证
  .route('/users').use(userRouter)

// ❌ 避免：随机中间件顺序
const badRouter = Router()
  .use(authMiddleware)
  .use(loggingMiddleware)
  .use(corsMiddleware)         // CORS 应该更早
```

### 路径一致性

```typescript
// ✅ 好：一致的路径模式
const apiRouter = Router()
  .route('/users').use(userRouter)
  .route('/posts').use(postRouter)
  .route('/comments').use(commentRouter)

// ❌ 避免：不一致的模式
const badRouter = Router()
  .route('/user').use(userRouter)      // 单数
  .route('/posts').use(postRouter)     // 复数  
  .route('/comment-system').use(commentRouter) // 不同模式
```

## 总结

Farrow Router 系统提供了构建可维护路由架构的强大工具：

- 🏗️ **模块化设计** - 将路由组织为逻辑的、可复用的模块
- 🔧 **灵活组合** - 从简单的路由器组合复杂的路由结构
- 🛡️ **中间件集成** - 在路由器或路由级别应用中间件
- 📈 **可扩展架构** - 支持微服务和版本化 API
- 🎯 **类型安全** - 完整的 TypeScript 支持

通过恰当地利用 Router 功能，你可以构建既强大又可维护的路由系统，随着应用程序的增长而扩展。