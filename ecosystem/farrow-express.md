# farrow-express

Express 适配器，让你在 Express 应用中使用 Farrow。

## 概述

`farrow-express` 是一个适配器包，允许你将 Farrow HTTP 应用无缝集成到现有的 Express 应用中。这对于渐进式迁移或混合使用两个框架特别有用。

## 特性

- 🔄 **无缝集成** - 在 Express 中挂载 Farrow 应用
- 🎯 **类型安全** - 保持 Farrow 的类型安全特性
- 📦 **渐进式迁移** - 逐步将 Express 应用迁移到 Farrow
- 🔧 **灵活部署** - 在同一应用中混合使用两个框架

## 安装

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
  // request.body 已验证且类型安全
  return Response.status(201).json(request.body)
})
```

### 2. 创建 Express 应用

创建一个标准的 Express 应用：

```typescript
import express from 'express'

const app = express()
const PORT = 3000

// Express 原生路由
app.get('/', (req, res) => {
  res.send('Express Home Page')
})

app.get('/about', (req, res) => {
  res.json({ message: 'About page from Express' })
})
```

### 3. 集成两个框架

使用 `adapter` 函数将 Farrow 应用挂载到 Express：

```typescript
import { adapter } from 'farrow-express'

// 将 Farrow 应用挂载到 /api 路径
app.use('/api', adapter(farrowApp))

// 启动服务器
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`)
  console.log('Express routes: /, /about')
  console.log('Farrow routes: /api/users, /api/users/:id')
})
```

## 完整示例

```typescript
import express from 'express'
import { Http, Response } from 'farrow-http'
import { ObjectType, String, Number, List } from 'farrow-schema'
import { createContext } from 'farrow-pipeline'
import { adapter } from 'farrow-express'

// === Farrow 应用 ===
const farrowApp = Http()

// Schema 定义
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

// 中间件
farrowApp.use((request, next) => {
  // 从请求头获取用户信息（示例）
  const userId = request.headers['x-user-id']
  if (userId) {
    UserContext.set({ id: Number(userId), name: 'User' })
  }
  return next(request)
})

// 路由
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

// === Express 应用 ===
const app = express()
const PORT = 3000

// Express 中间件
app.use(express.json())
app.use(express.static('public'))

// Express 路由
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

// 健康检查（Express）
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date() })
})

// === 集成 Farrow ===
// 将 Farrow 应用挂载到 /api 路径
app.use('/api', adapter(farrowApp))

// 404 处理（Express）
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' })
})

// 错误处理（Express）
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({ error: 'Internal Server Error' })
})

// 启动服务器
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`)
  console.log('📍 Routes:')
  console.log('  Express: /, /legacy, /health')
  console.log('  Farrow:  /api/posts, /api/posts/:id')
})
```

## 使用场景

### 渐进式迁移

当你有一个大型 Express 应用想要迁移到 Farrow 时：

```typescript
// 保留原有 Express 路由
app.use('/v1', legacyExpressRouter)

// 新功能使用 Farrow
app.use('/v2', adapter(farrowApp))
```

### 微服务整合

在微服务架构中混合使用不同框架：

```typescript
// 认证服务（Express）
app.use('/auth', expressAuthRouter)

// 业务 API（Farrow）
app.use('/api', adapter(farrowBusinessLogic))

// 管理面板（Express）
app.use('/admin', expressAdminRouter)
```

### 特定功能增强

为 Express 应用添加类型安全的 API：

```typescript
// Express 处理网页渲染
app.get('/', (req, res) => {
  res.render('index')
})

// Farrow 处理类型安全的 API
const apiApp = Http()

apiApp.post('/api/validate', {
  body: ComplexSchema
}).use((request) => {
  // 自动验证和类型推导
  return Response.json({ valid: true })
})

app.use(adapter(apiApp))
```

## API 参考

### adapter(app)

将 Farrow HTTP 应用转换为 Express 中间件。

```typescript
function adapter(app: HttpApp): express.RequestHandler
```

**参数：**
- `app`: Farrow HTTP 应用实例

**返回：**
- Express 中间件函数

**示例：**

```typescript
import { adapter } from 'farrow-express'
import { Http } from 'farrow-http'

const farrowApp = Http()
// ... 配置 Farrow 应用

// 作为中间件使用
app.use(adapter(farrowApp))

// 挂载到特定路径
app.use('/api', adapter(farrowApp))

// 条件性使用
if (process.env.USE_FARROW === 'true') {
  app.use('/modern', adapter(farrowApp))
}
```

## 迁移指南

### 从 Express 迁移到 Farrow

1. **安装依赖**
   ```bash
   npm install farrow-http farrow-schema farrow-pipeline farrow-express
   ```

2. **创建 Farrow 应用**
   ```typescript
   const farrowApp = Http()
   ```

3. **迁移路由**（逐个迁移）
   ```typescript
   // Express 路由
   app.get('/users/:id', (req, res) => {
     res.json({ id: req.params.id })
   })
   
   // 迁移到 Farrow
   farrowApp.get('/users/<id:int>').use((request) => {
     return Response.json({ id: request.params.id })
   })
   ```

4. **使用适配器**
   ```typescript
   // 移除 Express 路由
   // app.get('/users/:id', handler)
   
   // 使用 Farrow 版本
   app.use(adapter(farrowApp))
   ```

5. **逐步迁移**
   - 从简单的 API 路由开始
   - 逐步迁移复杂的业务逻辑
   - 最后迁移中间件和全局配置

## 相关链接

- [farrow-http 文档](/ecosystem/farrow-http)
- [Express 官方文档](https://expressjs.com/)
- [迁移指南](/guide/migration)
- [GitHub](https://github.com/farrowjs/farrow)