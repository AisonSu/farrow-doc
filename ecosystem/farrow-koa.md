# farrow-koa

Koa 适配器，让你在 Koa 应用中使用 Farrow。

## 概述

`farrow-koa` 是一个适配器包，允许你将 Farrow HTTP 应用无缝集成到现有的 Koa 应用中。这对于渐进式迁移或在 Koa 生态系统中使用 Farrow 的类型安全特性特别有用。

## 特性

- 🔄 **无缝集成** - 在 Koa 中使用 Farrow 应用
- 🎯 **保持类型安全** - 享受 Farrow 的类型系统优势
- 📦 **渐进式采用** - 逐步将 Koa 应用迁移到 Farrow
- 🔧 **生态兼容** - 同时使用 Koa 和 Farrow 的中间件

## 安装

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

## API 签名

```typescript
const adapter: (httpPipeline: HttpPipeline) => Middleware
```

## 快速开始

### 1. 创建 Farrow 应用

首先创建一个标准的 farrow-http 应用：

```typescript
import { Http, Response } from 'farrow-http'
import { ObjectType, String, Number } from 'farrow-schema'

// 创建 Farrow 应用
const farrowApp = Http()

// 定义 Schema
class User extends ObjectType {
  id = Number
  name = String
  email = String
}

// 定义路由
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
  // request.body 已验证且类型安全
  return Response.status(201).json(request.body)
})
```

### 2. 创建 Koa 应用

创建一个标准的 Koa 应用：

```typescript
import Koa from 'koa'
import Router from '@koa/router'

const app = new Koa()
const router = new Router()
const PORT = 3000

// Koa 原生路由
router.get('/', async (ctx) => {
  ctx.body = 'Koa Home Page'
})

router.get('/about', async (ctx) => {
  ctx.body = { message: 'About page from Koa' }
})

app.use(router.routes())
app.use(router.allowedMethods())
```

### 3. 集成两个框架

使用 `adapter` 函数将 Farrow 应用集成到 Koa：

```typescript
import { adapter } from 'farrow-koa'

// 在 Koa 路由之前使用 Farrow adapter
app.use(adapter(farrowApp))

// Koa 路由（作为后备）
app.use(router.routes())
app.use(router.allowedMethods())

// 启动服务器
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`)
  console.log('Koa routes: /, /about')
  console.log('Farrow routes: /api/users, /api/users/:id')
})
```

## 完整示例

```typescript
import Koa from 'koa'
import Router from '@koa/router'
import bodyParser from 'koa-bodyparser'
import cors from '@koa/cors'
import { Http, Response } from 'farrow-http'
import { ObjectType, String, Number, Boolean, List } from 'farrow-schema'
import { createContext } from 'farrow-pipeline'
import { adapter } from 'farrow-koa'

// === Farrow 应用 ===
const farrowApp = Http()

// Schema 定义
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

// 模拟数据库
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

// Farrow 中间件
farrowApp.use((request, next) => {
  // 从请求头获取用户信息（示例）
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

// Farrow 路由
farrowApp.get('/api/posts').use(() => {
  const user = UserContext.get()
  
  // 根据用户角色过滤
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

// === Koa 应用 ===
const app = new Koa()
const router = new Router()
const PORT = 3000

// Koa 中间件
app.use(cors())
app.use(bodyParser())

// 日志中间件
app.use(async (ctx, next) => {
  const start = Date.now()
  await next()
  const ms = Date.now() - start
  console.log(`[Koa] ${ctx.method} ${ctx.url} - ${ms}ms`)
})

// Koa 路由
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

// 健康检查（Koa）
router.get('/health', async (ctx) => {
  ctx.body = {
    status: 'healthy',
    framework: 'Koa',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  }
})

// 统计信息（Koa）
router.get('/stats', async (ctx) => {
  ctx.body = {
    totalPosts: posts.length,
    publishedPosts: posts.filter(p => p.published).length,
    framework: 'Koa',
    memory: process.memoryUsage()
  }
})

// === 集成 ===
// 使用 Farrow adapter（在 Koa 路由之前）
app.use(adapter(farrowApp))

// Koa 路由
app.use(router.routes())
app.use(router.allowedMethods())

// 404 处理（Koa）
app.use(async (ctx) => {
  ctx.status = 404
  ctx.body = {
    error: 'Not Found',
    path: ctx.url,
    timestamp: new Date().toISOString()
  }
})

// 错误处理（Koa）
app.on('error', (err, ctx) => {
  console.error('Server error:', err)
  ctx.status = err.status || 500
  ctx.body = {
    error: err.message,
    timestamp: new Date().toISOString()
  }
})

// 启动服务器
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`)
  console.log('📍 Routes:')
  console.log('  Koa:    /, /health, /stats')
  console.log('  Farrow: /api/posts, /api/posts/:id')
})
```

## 使用场景

### 渐进式迁移

当你有一个大型 Koa 应用想要迁移到 Farrow 时：

```typescript
// 保留原有 Koa 中间件和路由
app.use(koaSession())
app.use(koaCompress())
app.use(legacyRouter.routes())

// 新功能使用 Farrow
const farrowApp = Http()
// ... 配置 Farrow 路由

app.use(adapter(farrowApp))
```

### API 版本管理

使用不同框架处理不同版本的 API：

```typescript
// v1 API - 使用 Koa（旧版）
const v1Router = new Router({ prefix: '/api/v1' })
v1Router.get('/users', async (ctx) => {
  ctx.body = await getLegacyUsers()
})

// v2 API - 使用 Farrow（新版）
const v2App = Http()
v2App.get('/api/v2/users').use(() => {
  return Response.json(getUsers())
})

app.use(v1Router.routes())
app.use(adapter(v2App))
```

### 特定功能增强

为 Koa 应用添加类型安全的 API：

```typescript
// Koa 处理文件上传、WebSocket 等
app.use(koaStatic('./public'))
app.use(koaMulter().single('file'))

// Farrow 处理复杂的业务 API
const apiApp = Http()

apiApp.post('/api/process', {
  body: ComplexDataSchema
}).use((request) => {
  // 自动验证和类型推导
  const result = processData(request.body)
  return Response.json(result)
})

app.use(adapter(apiApp))
```

## 迁移指南

### 从 Koa 迁移到 Farrow

1. **安装依赖**
   ```bash
   npm install farrow-http farrow-schema farrow-pipeline farrow-koa
   ```

2. **创建 Farrow 应用**
   ```typescript
   const farrowApp = Http()
   ```

3. **迁移路由**（逐个迁移）
   ```typescript
   // Koa 路由
   router.get('/users/:id', async (ctx) => {
     const user = await getUser(ctx.params.id)
     ctx.body = user
   })
   
   // 迁移到 Farrow
   farrowApp.get('/users/<id:int>').use(async (request) => {
     const user = await getUser(request.params.id)
     return Response.json(user)
   })
   ```

4. **使用适配器**
   ```typescript
   app.use(adapter(farrowApp))
   ```

5. **逐步迁移**
   - 从简单的 CRUD API 开始
   - 逐步迁移复杂的业务逻辑
   - 最后迁移中间件和全局配置

## 对比 farrow-express

| 特性 | farrow-koa | farrow-express |
|-----|------------|----------------|
| **集成方式** | 作为 Koa 中间件 | 挂载到 Express 路径 |
| **异步支持** | 原生 async/await | 需要处理回调 |
| **Context** | Koa ctx | Express req/res |
| **中间件模型** | 洋葱模型 | 线性模型 |
| **生态系统** | Koa 生态 | Express 生态 |

## 相关链接

- [farrow-http 文档](/ecosystem/farrow-http)
- [farrow-express 文档](/ecosystem/farrow-express)
- [Koa 官方文档](https://koajs.com/)
- [GitHub](https://github.com/farrowjs/farrow)