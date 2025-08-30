# 核心概念

> 理解 Farrow 的设计理念，掌握框架的精髓

## 概述

Farrow 不仅仅是另一个 Web 框架。它代表了一种全新的思考方式：

- **类型即文档** - 让 TypeScript 成为你的第一道防线
- **函数式优先** - 用纯函数构建可预测的应用
- **组合优于配置** - 通过组合小而美的组件构建复杂系统

让我们深入了解这些核心概念。

## 三大支柱

Farrow 建立在三个核心模块之上，它们相互配合，共同提供强大而优雅的开发体验：

### farrow-pipeline
**统一的数据处理管道**

提供类型安全的中间件系统，确保数据在处理链中的每一步都是类型安全的。

### farrow-schema  
**单一数据源定义**

一次定义，同时获得 TypeScript 类型、运行时验证和 API 文档。

### farrow-http
**类型安全的 HTTP 层**

基于前两者构建的 Web 框架，提供端到端的类型安全。

## 类型安全：第一公民

### 传统方式的问题

在传统的 Node.js 框架中，类型安全常常是后来添加的：

```typescript
// Express + TypeScript：类型是"装饰"
app.get('/users/:id', (req: Request, res: Response) => {
  const id = req.params.id  // string 类型，但实际需要 number
  const userId = parseInt(id)  // 手动转换，可能出错
  
  if (isNaN(userId)) {
    res.status(400).json({ error: 'Invalid ID' })
    return  // 容易忘记 return
  }
  
  const user = getUser(userId)
  res.json(user)  // 忘记这行？运行时才会发现
})
```

### Farrow 的方式

在 Farrow 中，类型安全是内置的：

```typescript
// Farrow：类型是"本质"
app.get('/users/<id:int>').use((request) => {
  // request.params.id 自动是 number，已验证
  const user = getUser(request.params.id)
  return Response.json(user)  // 编译器强制返回
})
```

**关键区别：**
- 路由参数自动解析和验证
- 编译时类型检查
- 强制返回响应，不会遗漏

### Template Literal Types 的魔法

Farrow 利用 TypeScript 4.1+ 的 Template Literal Types 实现了类型安全的路由：

```typescript
// 这不是字符串，是类型！
type Route = '/users/<id:int>/posts/<postId:string>?<page?:int>'

// TypeScript 自动推导出：
type Params = {
  id: number
  postId: string
}
type Query = {
  page?: number
}
```

## Schema 驱动开发

### 什么是 Schema？

Schema 是数据的结构化描述。在 Farrow 中，Schema 不仅描述数据，还提供验证和类型：

```typescript
import { ObjectType, String, Number, Boolean, List } from 'farrow-schema'

// 定义 Schema
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

// 自动获得 TypeScript 类型
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

### 一次定义，多处受益

#### 1. 类型安全
```typescript
// 编译时类型检查
const article: ArticleType = {
  title: "Hello",
  content: "...",
  // TypeScript 会提示缺少必需字段
}
```

#### 2. 自动验证
```typescript
app.post('/articles', { body: Article }).use((request) => {
  // request.body 已经过验证，类型为 ArticleType
  saveArticle(request.body)
})
```

#### 3. 手动验证
```typescript
// 使用 Validator 手动验证数据
const result = Validator.validate(Article, data)
if (result.isOk) {
  console.log('Valid:', result.value)
}
```

#### 4. 类型转换
```typescript
// 灵活的 Schema 操作
const ArticleSummary = pickObject(Article, ['title', 'author', 'tags'])
const ArticleUpdate = partial(Article)
const PublicArticle = omitObject(Article, ['author.email'])
```

### Schema vs 接口

为什么使用 Schema 而不是 TypeScript 接口？

```typescript
// ❌ 接口：只有编译时类型
interface User {
  name: string
  age: number
}

// 需要手写验证
function validateUser(data: any): User {
  if (!data.name || typeof data.name !== 'string') {
    throw new Error('Invalid name')
  }
  // ... 更多验证
}

// ✅ Schema：类型 + 验证
class User extends ObjectType {
  name = String
  age = Number
}

// 自动验证
const result = Validator.validate(User, data)
```

## 函数式中间件

### 纯函数的力量

Farrow 的中间件是纯函数，这带来了许多好处：

```typescript
// 纯函数中间件
const logger = (request: Request, next: Next) => {
  console.log(`${request.method} ${request.path}`)
  const response = next(request)  // 调用下一个中间件
  console.log(`Status: ${response.status}`)
  return response  // 必须返回响应
}
```

**特点：**
- 输入不可变 - request 对象不会被修改
- 必须有输出 - 强制返回 response
- 可预测 - 相同输入总是产生相同输出
- 易测试 - 不依赖外部状态

### 洋葱模型

中间件按照"洋葱模型"执行：

```typescript
app.use((request, next) => {
  console.log('1. 外层前置')
  const response = next(request)
  console.log('6. 外层后置')
  return response
})

app.use((request, next) => {
  console.log('2. 中层前置')
  const response = next(request)
  console.log('5. 中层后置')
  return response
})

app.use((request, next) => {
  console.log('3. 内层前置')
  const response = next(request)
  console.log('4. 内层后置')
  return response
})

// 执行顺序：1 → 2 → 3 → 4 → 5 → 6
```

### Pipeline：类型安全的组合

Pipeline 确保整个中间件链的类型一致性：

```typescript
import { createPipeline } from 'farrow-pipeline'

// 创建类型安全的管道
const pipeline = createPipeline<Input, Output>()

pipeline.use((input, next) => {
  // input 类型为 Input
  const result = next(input)  // result 类型为 Output
  return result  // 必须返回 Output
})

// 类型不匹配会在编译时报错
pipeline.use((input, next) => {
  return "wrong type"  // ❌ 编译错误：不是 Output 类型
})
```

## Context：优雅的状态管理

### React Hooks 风格的 API

受 React Hooks 启发，Farrow 提供了优雅的 Context API：

```typescript
import { createContext } from 'farrow-pipeline'

// 创建 Context
const UserContext = createContext<User | null>(null)
const ThemeContext = createContext<'light' | 'dark'>('light')

// 在中间件中设置
app.use((request, next) => {
  const user = authenticateUser(request)
  UserContext.set(user)
  return next(request)
})

// 在任何地方使用
app.get('/profile').use(() => {
  const user = UserContext.get()
  if (!user) {
    return Response.status(401).json({ error: 'Not authenticated' })
  }
  return Response.json(user)
})
```

### 请求级隔离

每个请求都有独立的 Context，避免了状态污染：

```typescript
const RequestIdContext = createContext<string>()

app.use((request, next) => {
  // 每个请求设置独立的 ID
  RequestIdContext.set(generateId())
  return next(request)
})

// 并发请求不会相互影响
// 请求 A: RequestIdContext = "id-123"
// 请求 B: RequestIdContext = "id-456"
// 两者完全隔离
```

### 自定义 Hooks

你可以创建自定义 Hooks 来封装常用逻辑：

```typescript
// 自定义 Hook
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

// 使用自定义 Hook
app.get('/api/posts').use(() => {
  const user = useCurrentUser()  // 自动处理认证
  const db = useDatabase()        // 自动获取数据库连接
  
  const posts = db.getPostsByUser(user.id)
  return Response.json(posts)
})
```

## 响应式编程模型

### 强制返回值

不同于 Express 的回调风格，Farrow 强制每个处理器返回响应：

```typescript
// ❌ Express：容易忘记响应
app.get('/users', (req, res) => {
  if (!authorized) {
    res.status(401).json({ error: 'Unauthorized' })
    // 忘记 return，代码继续执行！
  }
  res.json(users)  // 可能发送两次响应
})

// ✅ Farrow：编译器强制返回
app.get('/users').use((request) => {
  if (!authorized) {
    return Response.status(401).json({ error: 'Unauthorized' })
    // 代码不会继续执行
  }
  return Response.json(users)  // 必须返回
})
```

### 链式响应构建

Farrow 提供了优雅的链式 API 来构建响应：

```typescript
// 清晰、类型安全的响应构建
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

## 错误处理哲学

### 类型安全的错误

Farrow 鼓励使用类型安全的错误处理：

```typescript
import { HttpError } from 'farrow-http'

// 自定义错误类
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

// 使用错误
app.get('/users/<id:int>').use((request) => {
  const user = getUser(request.params.id)
  
  if (!user) {
    throw new NotFoundError('User')
  }
  
  return Response.json(user)
})
```

### 统一错误边界

使用中间件创建统一的错误处理：

```typescript
// 错误边界中间件
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
    
    // 未知错误
    console.error(error)
    return Response.status(500).json({
      error: 'Internal server error'
    })
  }
})
```

## 渐进式架构

### 从简单开始

你可以从最简单的应用开始：

```typescript
// 第一步：简单的 HTTP 服务器
const app = Http()
app.get('/').use(() => Response.text('Hello'))
app.listen(3000)
```

### 按需增强

然后根据需要逐步添加功能：

```typescript
// 第二步：添加路由参数
app.get('/users/<id:int>')

// 第三步：添加验证
app.post('/users', { body: UserSchema })

// 第四步：添加中间件
app.use(authMiddleware)

// 第五步：添加 Context
const UserContext = createContext<User>()

// 第六步：组合成完整应用
const apiRouter = Router()
apiRouter.use('/users', userRouter)
apiRouter.use('/posts', postRouter)
app.use('/api', apiRouter)
```

### 模块化设计

每个部分都可以独立使用：

```typescript
// 只用 Schema
import { ObjectType, String } from 'farrow-schema'

// 只用 Pipeline
import { createPipeline } from 'farrow-pipeline'

// 只用 HTTP
import { Http, Response } from 'farrow-http'

// 或者组合使用
import { Http } from 'farrow-http'
import { ObjectType } from 'farrow-schema'
import { createContext } from 'farrow-pipeline'
```

## 设计原则总结

### 类型优先
> "如果它能编译，它就能工作"

每个 API 都经过精心设计，以提供最佳的类型推导体验。

### 组合优于继承
> "小而美的组件，无限的可能"

通过组合简单的组件构建复杂的系统。

### 纯函数构建
> "可预测、可测试、可维护"

使用纯函数减少副作用，提高代码质量。

### 数据不可变
> "数据流动，状态不变"

不可变数据避免了意外的修改和难以追踪的 bug。

### 渐进式增强
> "简单的事情简单做，复杂的事情也能做"

从简单开始，按需增强，永不过度设计。

## 与其他框架的对比

### vs Express.js

| 方面 | Express | Farrow |
|-----|---------|--------|
| **类型安全** | 需要额外配置 | 内置支持 |
| **参数验证** | 手动或第三方库 | 自动验证 |
| **中间件模型** | 修改 req/res | 纯函数链 |
| **错误处理** | 回调地狱 | 类型安全的异常 |
| **学习曲线** | 简单但易出错 | 简单且安全 |

### vs Nest.js

| 方面 | Nest.js | Farrow |
|-----|---------|--------|
| **架构风格** | OOP + 装饰器 | 函数式 + 组合 |
| **依赖注入** | 复杂的 DI 容器 | 简单的 Context |
| **样板代码** | 较多 | 极少 |
| **类型推导** | 需要装饰器 | 自动推导 |
| **bundle 大小** | 较大 | 轻量 |

## 实践示例：构建认证系统

让我们通过一个实际例子来综合运用这些概念：

```typescript
import { Http, Response, HttpError } from 'farrow-http'
import { ObjectType, String } from 'farrow-schema'
import { createContext } from 'farrow-pipeline'

// Schema 定义
class LoginRequest extends ObjectType {
  email = String
  password = String
}

class User extends ObjectType {
  id = String
  email = String
  name = String
}

// Context 定义
const UserContext = createContext<User | null>(null)

// 认证中间件
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

// 自定义 Hook
function useCurrentUser() {
  const user = UserContext.get()
  if (!user) {
    throw new HttpError('Not authenticated', 401)
  }
  return user
}

// 应用
const app = Http()

// 登录端点
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

// 受保护的端点
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

## 小结

通过本章，你已经理解了 Farrow 的核心概念：

- **类型安全** - 让编译器成为你的第一道防线  
- **Schema 驱动** - 一次定义，多处受益  
- **函数式中间件** - 纯函数构建可预测的应用  
- **Context 系统** - 优雅的状态管理  
- **渐进式架构** - 按需增强，永不过度  

这些概念相互配合，共同提供了一个强大、优雅、类型安全的开发体验。

## 下一步

准备好深入学习了吗？

**[基础教程](/guide/essentials)**  
学习路由、中间件、验证等日常开发技能

**[深入组件](/guide/components-in-depth)**  
深入理解 Schema、Pipeline、Context

**[实战项目](/examples/)**  
通过完整项目掌握最佳实践