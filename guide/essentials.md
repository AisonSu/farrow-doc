# 基础教程

Farrow 是一个渐进式 TypeScript Web 框架。你可以从最简单的 HTTP 服务器开始，然后根据需要逐步添加更多功能。

## 什么是 Farrow？

Farrow 是一个专为 TypeScript 设计的 Web 框架，它由三个核心部分组成：

- **🛣️ HTTP 服务器** - 类型安全的路由和响应处理
- **📝 Schema 验证** - 强大的类型定义和数据验证  
- **🔗 中间件管道** - 函数式的请求处理流程

与其他框架不同，Farrow 从一开始就为 TypeScript 而设计，让你享受完整的类型安全体验。

## 创建你的第一个应用

### 前提条件

- [Node.js](https://nodejs.org/) 版本 16 或更高
- 熟悉 [TypeScript](https://www.typescriptlang.org/) 语法

### 安装

在你的项目中安装 Farrow：

```bash
npm install farrow-http farrow-schema farrow-pipeline
```

### Hello World

创建一个名为 `app.ts` 的文件：

```typescript
import { Http, Response } from 'farrow-http'

const app = Http()

app.get('/').use(() => {
  return Response.text('Hello Farrow!')
})

app.listen(3000)
```

现在运行：

```bash
npx tsx app.ts
```

你应该能看到 "Hello Farrow!" 在 [http://localhost:3000](http://localhost:3000)！

恭喜！你刚刚创建了你的第一个 Farrow 应用。它只是一个简单的服务器，但这已经展示了 Farrow 的核心特性：**简洁的 API** 和 **类型安全**。

## 创建一个应用

现在让我们创建一个稍微复杂一点的应用。我们将构建一个简单的用户 API。

### 定义数据结构

首先，让我们定义用户的数据结构：

```typescript
import { ObjectType, String, Number, Optional } from 'farrow-schema'

class User extends ObjectType {
  id = Number
  name = String
  email = String
  age = Optional(Number)
}
```

::: details 为什么使用 Class？
Farrow 使用 ES6 类语法来定义数据结构，这样可以获得更好的 TypeScript 类型推导和 IDE 支持。
:::

### 添加路由

现在让我们添加一些路由来处理用户数据：

```typescript
import { Http, Response } from 'farrow-http'

const app = Http()

// 获取所有用户
app.get('/users').use(() => {
  const users = [
    { id: 1, name: 'Alice', email: 'alice@example.com' },
    { id: 2, name: 'Bob', email: 'bob@example.com' }
  ]
  
  return Response.json(users)
})

// 获取单个用户 - 路径参数会自动验证类型
app.get('/users/<id:int>').use((request) => {
  // request 是 RequestInfo 对象，包含请求的所有信息
  const userId = request.params.id // TypeScript 知道这是 number!
  // 如果访问 /users/abc，会自动返回 400 错误
  
  return Response.json({
    id: userId,
    name: `用户 ${userId}`,
    email: `user${userId}@example.com`
  })
})

app.listen(3000)
```

::: tip 💡 什么是 RequestInfo？
每个路由处理器都会接收一个 `request` 参数，它是一个 `RequestInfo` 对象，包含了请求的所有信息：
- `request.params` - 路径参数，如 `{ id: 123 }`
- `request.query` - 查询参数，如 `{ page: 1 }`  
- `request.body` - 请求体数据
- `request.headers` - 请求头

注意 `request.params.id` 自动被推导为 `number` 类型，因为我们在路由中使用了 `<id:int>`。Farrow 会自动解析和验证这些数据！
:::

### 请求体验证

让我们添加一个创建用户的端点，并自动验证请求体：

```typescript
class CreateUserInput extends ObjectType {
  name = String
  email = String
  age = Optional(Number)
}

app.post('/users', { body: CreateUserInput }).use((request) => {
  // request.body 已经被验证并且具有正确的类型！
  const newUser = {
    id: Date.now(),
    ...request.body
  }
  
  return Response.status(201).json(newUser)
})
```

现在如果你发送一个无效的请求体，Farrow 会自动返回 400 错误！

### 路径参数（Params）

路径参数是 URL 路径中的动态部分，使用 `<name:type>` 语法定义：

```typescript
// 基本路径参数
app.get('/users/<id:int>').use((request) => {
  const userId = request.params.id  // 自动验证为 number 类型
  
  return Response.json({
    id: userId,
    name: `用户 ${userId}`,
    email: `user${userId}@example.com`
  })
})

// 字符串参数
app.get('/users/<name:string>').use((request) => {
  const userName = request.params.name  // string 类型
  
  return Response.json({
    message: `你好，${userName}！`
  })
})

// 多个路径参数
app.get('/users/<id:int>/posts/<postId:int>').use((request) => {
  const { id, postId } = request.params
  // id 和 postId 都是 number 类型
  
  return Response.json({
    userId: id,
    postId: postId,
    post: `用户 ${id} 的文章 ${postId}`
  })
})
```

::: tip 💡 路径参数类型
- `<id:int>` - 整数，自动验证并转换为 `number`
- `<name:string>` - 字符串，类型为 `string`
- `<id?:int>` - 可选参数，类型为 `number | undefined`
:::

### 路径参数的验证

Farrow 会自动验证路径参数的类型：

```typescript
// 访问 /users/abc 会自动返回 400 错误，因为 "abc" 不是有效整数
app.get('/users/<id:int>').use((request) => {
  // 这里 request.params.id 保证是 number 类型
  return Response.json({ userId: request.params.id })
})

// 可选参数处理
app.get('/posts/<id:int>/comments/<commentId?:int>').use((request) => {
  const { id, commentId } = request.params
  
  if (commentId) {
    // 获取特定评论
    return Response.json({ postId: id, commentId })
  } else {
    // 获取所有评论
    return Response.json({ postId: id, comments: [] })
  }
})
```

### 查询参数（Query）

查询参数是 URL 中 `?` 后面的参数，同样支持类型验证：

```typescript
// 查询参数验证
app.get('/users?<page?:int>&<limit?:int>').use((request) => {
  const { page = 1, limit = 10 } = request.query
  // page 和 limit 自动被验证为数字类型
  
  return Response.json({
    users: [],
    pagination: { page, limit }
  })
})

// 必需的查询参数
app.get('/search?<q:string>&<page?:int>').use((request) => {
  const { q, page = 1 } = request.query
  // q 是必需的字符串，page 是可选的数字
  
  return Response.json({
    query: q,
    page,
    results: []
  })
})
```

### 组合路径参数和查询参数

```typescript
// 同时使用路径参数和查询参数
app.get('/users/<id:int>?<include?:string>').use((request) => {
  const { id } = request.params           // number
  const { include } = request.query       // string | undefined
  
  const user = { id, name: `用户 ${id}`, email: `user${id}@example.com` }
  
  if (include === 'posts') {
    return Response.json({
      ...user,
      posts: [`文章 1`, `文章 2`]
    })
  }
  
  return Response.json(user)
})

// 复杂的组合示例
app.get('/categories/<category:string>/products?<sort?:string>&<page?:int>&<limit?:int>').use((request) => {
  const { category } = request.params
  const { sort = 'name', page = 1, limit = 20 } = request.query
  
  return Response.json({
    category,
    sort,
    pagination: { page, limit },
    products: []
  })
})
```

## 深入理解响应

Farrow 提供了丰富的响应构建 API：

```typescript
import { Response } from 'farrow-http'

// JSON 响应
Response.json({ message: 'Hello' })

// 文本响应
Response.text('纯文本内容')

// HTML 响应
Response.html('<h1>HTML 内容</h1>')

// 自定义状态码
Response.status(201).json({ created: true })

// 设置响应头
Response.header('X-Custom-Header', 'value').json({ data: 'test' })

// 设置多个响应头
Response.headers({
  'X-API-Version': '1.0',
  'X-Rate-Limit': '100'
}).json({ data: 'test' })

// 设置 Cookie
Response.cookie('session', 'abc123').json({ authenticated: true })
```

### Response 合并注意事项

在使用多个中间件时需要注意 Response 合并的规则：

::: warning ⚠️ 重要规则
`Response.merge()` 中**后面的响应会覆盖前面的响应主体**！
:::

```typescript
// ❌ 错误：JSON 数据会丢失
const withData = Response.json({ users: ['Alice', 'Bob'] })
const withHeaders = Response.header('X-Version', 'v1')  // 空主体
const result = withData.merge(withHeaders)  // 数据被空主体覆盖！

// ✅ 正确做法：使用链式调用
const result = Response.json({ users: ['Alice', 'Bob'] }).header('X-Version', 'v1')

// ✅ 或者注意合并顺序
const result = withHeaders.merge(withData)  // 空主体被 JSON 覆盖
```

**最佳实践**：优先使用链式调用，避免 `merge()` 导致的数据丢失。

```typescript
// ✅ 推荐：在中间件中使用链式调用
app.use((request, next) => {
  const response = next(request)
  return response.header('X-API-Version', '1.0')  // 直接添加 header
})
```

## 理解中间件

中间件是 Farrow 的核心概念。它们是可以访问请求对象、响应对象，以及应用程序请求-响应循环中的下一个中间件的函数。

### 简单中间件

```typescript
const app = Http()

// 记录所有请求
app.use((request, next) => {
  console.log(`${request.method} ${request.url}`)
  return next(request)
})

app.get('/').use(() => {
  return Response.text('Hello')
})
```

### 条件中间件

```typescript
// 只在特定路径使用中间件
app.get('/protected').use((request, next) => {
  const token = request.headers.authorization
  
  if (!token) {
    return Response.status(401).json({ error: '需要认证' })
  }
  
  return next(request)
}).use(() => {
  return Response.json({ message: '你已通过认证' })
})
```

## 使用 Context

Context 是 Farrow 中用于在中间件之间共享数据的强大机制。你可以把它想象成一个请求范围内的全局状态。

### 创建和使用 Context

```typescript
import { createContext } from 'farrow-pipeline'

// 创建用户上下文
const UserContext = createContext<{ id: number; name: string } | null>(null)

// 在中间件中设置用户信息
app.use((request, next) => {
  // 模拟从 token 中解析用户信息
  const token = request.headers.authorization
  if (token) {
    UserContext.set({ id: 123, name: 'Alice' })
  }
  return next(request)
})

// 在路由中获取用户信息
app.get('/profile').use((request) => {
  const user = UserContext.get()
  
  if (!user) {
    return Response.status(401).json({ error: '需要登录' })
  }
  
  return Response.json({
    message: `欢迎，${user.name}！`,
    userId: user.id
  })
})
```

::: tip 💡 Context 的特点
每个请求都有独立的 Context 容器，不会互相干扰。这意味着即使在高并发情况下，每个请求的用户信息都是隔离的。
:::

### 实际应用：用户认证

让我们看一个完整的用户认证示例：

```typescript
import { createContext } from 'farrow-pipeline'

// 定义用户类型
class User extends ObjectType {
  id = Number
  name = String
  email = String
}

// 创建用户上下文
const AuthContext = createContext<User | null>(null)

// 认证中间件
const authenticate = (request: any, next: any) => {
  const token = request.headers.authorization?.replace('Bearer ', '')
  
  if (!token) {
    return Response.status(401).json({ error: '缺少认证令牌' })
  }
  
  // 验证 token（这里简化处理）
  if (token === 'valid-token') {
    AuthContext.set({
      id: 1,
      name: 'Alice',
      email: 'alice@example.com'
    })
    return next(request)
  } else {
    return Response.status(401).json({ error: '无效令牌' })
  }
}

// 需要认证的路由
app.get('/me').use(authenticate).use((request) => {
  const user = AuthContext.get() // 肯定不为空，因为通过了认证中间件
  return Response.json(user)
})

app.get('/posts').use(authenticate).use((request) => {
  const user = AuthContext.get()
  return Response.json({
    message: `${user.name} 的文章列表`,
    posts: []
  })
})

// 公开路由（不需要认证）
app.get('/').use(() => {
  return Response.json({ message: '欢迎访问我们的 API' })
})
```

### 多个 Context

你可以同时使用多个 Context 来管理不同类型的数据：

```typescript
// 创建多个上下文
const UserContext = createContext<User | null>(null)
const RequestIdContext = createContext<string>()
const TimerContext = createContext<number>()

app.use((request, next) => {
  // 生成请求 ID
  RequestIdContext.set(Math.random().toString(36))
  
  // 记录请求开始时间
  TimerContext.set(Date.now())
  
  console.log(`请求开始: ${RequestIdContext.get()}`)
  
  const response = next(request)
  
  // 计算请求耗时
  const duration = Date.now() - TimerContext.get()
  console.log(`请求结束: ${RequestIdContext.get()}, 耗时: ${duration}ms`)
  
  return response
})
```

## 错误处理

Farrow 提供了优雅的错误处理方式：

```typescript
// 全局错误处理
app.use((request, next) => {
  try {
    return next(request)
  } catch (error) {
    console.error('发生错误:', error)
    return Response.status(500).json({
      error: '服务器内部错误'
    })
  }
})

// 处理 404
app.use((request, next) => {
  const response = next(request)
  
  // 如果没有路由匹配
  if (!response) {
    return Response.status(404).json({
      error: '页面未找到'
    })
  }
  
  return response
})
```

## 模块化你的应用

随着应用的增长，你可以将路由分组到模块中：

```typescript
import { Router } from 'farrow-http'

// 创建用户路由模块
const userRouter = Router()

userRouter.get('/').use(() => {
  return Response.json({ users: [] })
})

userRouter.get('/<id:int>').use((request) => {
  return Response.json({ 
    id: request.params.id,
    name: '用户'
  })
})

// 在主应用中使用
app.route('/users').use(userRouter)
```

## 完整示例：博客 API

让我们创建一个完整的示例，将所有学到的概念组合起来：

```typescript
import { Http, Response } from 'farrow-http'
import { ObjectType, String, Number, Optional, List } from 'farrow-schema'
import { createContext } from 'farrow-pipeline'

// 1. 定义数据结构
class User extends ObjectType {
  id = Number
  name = String
  email = String
}

class Post extends ObjectType {
  id = Number
  title = String
  content = String
  authorId = Number
}

class CreatePostInput extends ObjectType {
  title = String
  content = String
}

// 2. 创建 Context
const AuthContext = createContext<User | null>(null)

// 3. 认证中间件
const authenticate = (request: any, next: any) => {
  const token = request.headers.authorization?.replace('Bearer ', '')
  
  if (token === 'user-token') {
    AuthContext.set({ id: 1, name: 'Alice', email: 'alice@example.com' })
    return next(request)
  }
  
  return Response.status(401).json({ error: '需要认证' })
}

// 4. 创建应用
const app = Http()

// 全局中间件：请求日志
app.use((request, next) => {
  console.log(`${request.method} ${request.pathname}`)
  return next(request)
})

// 5. 公开路由
app.get('/').use(() => {
  return Response.json({ 
    message: '欢迎来到博客 API',
    endpoints: ['/posts', '/posts/<id:int>', '/me', '/my-posts']
  })
})

// 获取所有文章（带分页）
app.get('/posts?<page?:int>&<limit?:int>').use((request) => {
  const { page = 1, limit = 10 } = request.query
  
  // 模拟数据
  const posts = [
    { id: 1, title: '第一篇文章', content: '内容...', authorId: 1 },
    { id: 2, title: '第二篇文章', content: '内容...', authorId: 1 }
  ]
  
  return Response.json({
    posts,
    pagination: { page, limit, total: posts.length }
  })
})

// 获取单篇文章
app.get('/posts/<id:int>').use((request) => {
  const post = { 
    id: request.params.id, 
    title: `文章 ${request.params.id}`, 
    content: '这是文章内容...',
    authorId: 1
  }
  
  return Response.json(post)
})

// 6. 需要认证的路由
app.get('/me').use(authenticate).use(() => {
  const user = AuthContext.get()
  return Response.json(user)
})

app.get('/my-posts').use(authenticate).use(() => {
  const user = AuthContext.get()
  const posts = [
    { id: 1, title: '我的文章', content: '内容...', authorId: user!.id }
  ]
  
  return Response.json({
    user: user!.name,
    posts
  })
})

app.post('/posts', { body: CreatePostInput }).use(authenticate).use((request) => {
  const user = AuthContext.get()
  const newPost = {
    id: Date.now(),
    ...request.body,
    authorId: user!.id
  }
  
  return Response.status(201).json({
    message: '文章创建成功',
    post: newPost
  })
})

// 7. 启动服务器
app.listen(3000, () => {
  console.log('博客 API 服务器运行在 http://localhost:3000')
})
```

这个示例展示了：
- ✅ **Schema 定义和验证** - User、Post、CreatePostInput
- ✅ **Context 状态管理** - AuthContext 在中间件间共享用户信息
- ✅ **中间件组合** - 认证中间件、日志中间件
- ✅ **路由参数和查询参数** - `<id:int>`、`?<page?:int>&<limit?:int>`
- ✅ **请求体验证** - 自动验证 CreatePostInput
- ✅ **响应构建** - JSON 响应、状态码设置

## 下一步

现在你已经学会了 Farrow 的基础知识！你可以：

- **构建更复杂的 API** - 尝试添加更多路由和数据验证
- **学习高级特性** - 查看 [高级指南](./advanced) 了解更多功能
- **探索生态系统** - 发现可用的插件和工具

::: tip 💡 小贴士
记住，Farrow 是渐进式的。你可以从简单开始，然后根据需要逐步添加功能。不需要一开始就学会所有东西！
:::

## 常见问题

<details>
<summary><strong>为什么选择 Class 而不是 Interface？</strong></summary>

Farrow Schema 使用类是因为它们在运行时存在，可以用于验证。而 TypeScript 接口在编译后会消失。

</details>

<details>
<summary><strong>如何处理跨域请求？</strong></summary>

你可以使用中间件来处理 CORS：

```typescript
app.use((request, next) => {
  const response = next(request)
  return response.header('Access-Control-Allow-Origin', '*')
})
```

</details>

<details>
<summary><strong>为什么我的响应数据在中间件中丢失了？</strong></summary>

这通常是由于 Response 合并顺序错误导致的：

```typescript
// ❌ 错误：数据被覆盖
app.use((request, next) => {
  const response = next(request)
  return Response.header('X-Custom', 'value').merge(response)
})

// ✅ 正确：使用链式调用
app.use((request, next) => {
  const response = next(request)
  return response.header('X-Custom', 'value')
})
```

记住：`merge()` 中最后一个响应会覆盖前面的主体内容。

</details>

<details>
<summary><strong>路径参数验证失败时会发生什么？</strong></summary>

当访问的 URL 不符合路径参数的类型要求时，Farrow 会自动返回 400 Bad Request 错误：

```typescript
// 定义路由
app.get('/users/<id:int>').use((request) => {
  return Response.json({ userId: request.params.id })
})

// 访问 /users/123 -> 正常返回 { userId: 123 }
// 访问 /users/abc -> 自动返回 400 错误
```

这保证了到达处理器的参数一定是有效的类型。

</details>

<details>
<summary><strong>支持 async/await 吗？</strong></summary>

是的！中间件和路由处理器都支持异步操作：

```typescript
app.get('/async').use(async (request) => {
  const data = await fetchSomeData()
  return Response.json(data)
})
```

</details>