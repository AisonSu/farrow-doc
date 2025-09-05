# 基础教程

> 掌握 Farrow 日常开发的核心技能 🛠️

## 概览

本章将系统地介绍 Farrow 的基础功能，让你能够熟练地进行日常开发。我们将通过构建一个博客 API 来学习这些概念。

学习目标：
- 🛣️ 掌握路由系统的所有特性
- 🔗 理解和使用中间件
- 📝 精通 Schema 定义和验证
- 🎨 构建各种类型的响应
- 🔒 实现认证和授权
- ⚡ 处理错误和异常

## 路由系统详解

### 基础路由

Farrow 的路由系统基于 Template Literal Types，提供了强大的类型推导：

```typescript
import { Http, Response } from 'farrow-http'

const app = Http()

// 基础路由方法
app.get('/posts')       // GET 请求
app.post('/posts')      // POST 请求
app.put('/posts')       // PUT 请求
app.patch('/posts')     // PATCH 请求
app.delete('/posts')    // DELETE 请求
app.head('/posts')      // HEAD 请求
app.options('/posts')   // OPTIONS 请求

// 处理所有方法
app.all('/posts')       // 匹配所有 HTTP 方法
```

### 路由参数

#### 基础类型参数

```typescript
// 整数参数
app.get('/posts/<id:int>').use((request) => {
  const id: number = request.params.id  // 自动推导为 number
  return Response.json({ postId: id })
})

// 字符串参数
app.get('/users/<username:string>').use((request) => {
  const username: string = request.params.username
  return Response.json({ username })
})

// 布尔参数
app.get('/posts/<published:boolean>').use((request) => {
  const published: boolean = request.params.published
  return Response.json({ published })
})

// 浮点数参数
app.get('/products/<price:float>').use((request) => {
  const price: number = request.params.price
  return Response.json({ price })
})

// ID 参数（特殊的字符串，通常用于标识符）
app.get('/items/<itemId:id>').use((request) => {
  const itemId: string = request.params.itemId
  return Response.json({ itemId })
})
```

#### 可选参数

```typescript
// 可选路径参数
app.get('/posts/<id?:int>').use((request) => {
  const id: number | undefined = request.params.id
  
  if (id === undefined) {
    // 返回所有文章
    return Response.json(getAllPosts())
  } else {
    // 返回特定文章
    return Response.json(getPost(id))
  }
})

// 可选查询参数
app.get('/search?<q:string>&<page?:int>&<limit?:int>').use((request) => {
  const { q, page = 1, limit = 10 } = request.query
  // q: string (必需)
  // page: number (可选，默认 1)
  // limit: number (可选，默认 10)
  
  return Response.json(search(q, { page, limit }))
})
```

#### 数组参数

```typescript
// 一个或多个（+）
app.get('/tags/<tags+:string>').use((request) => {
  const tags: string[] = request.params.tags  // 至少一个
  return Response.json({ tags })
})
// 匹配: /tags/javascript/typescript/nodejs

// 零个或多个（*）
app.get('/categories/<cats*:string>').use((request) => {
  const cats: string[] | undefined = request.params.cats  // 可能为空
  return Response.json({ categories: cats || [] })
})
// 匹配: /categories 或 /categories/tech/web
```

#### 联合类型参数

```typescript
// 枚举值
app.get('/posts/<status:draft|published|archived>').use((request) => {
  const status: 'draft' | 'published' | 'archived' = request.params.status
  return Response.json(getPostsByStatus(status))
})

// 字面量类型
app.get('/theme/<mode:{light}|{dark}>').use((request) => {
  const mode: 'light' | 'dark' = request.params.mode
  return Response.json({ theme: mode })
})
```

### 复杂路由示例

```typescript
// 组合多种参数类型
app.get(
  '/api/v<version:int>/posts/<id:int>/comments?<page?:int>&<limit?:int>&<sort?:asc|desc>'
).use((request) => {
  const { version, id } = request.params
  const { page = 1, limit = 20, sort = 'asc' } = request.query
  
  // version: number
  // id: number
  // page: number
  // limit: number
  // sort: 'asc' | 'desc'
  
  return Response.json({
    api: `v${version}`,
    postId: id,
    comments: getComments(id, { page, limit, sort })
  })
})
```

### 路由组织

#### 使用 Router

```typescript
import { Router } from 'farrow-http'

// 创建模块化的路由
const postsRouter = Router()

postsRouter.get('/').use(() => {
  return Response.json(getAllPosts())
})

postsRouter.get('/<id:int>').use((request) => {
  return Response.json(getPost(request.params.id))
})

postsRouter.post('/', {
  body: CreatePostSchema
}).use((request) => {
  const post = createPost(request.body)
  return Response.status(201).json(post)
})

// 用户路由
const usersRouter = Router()

usersRouter.get('/').use(() => {
  return Response.json(getAllUsers())
})

usersRouter.get('/<id:int>').use((request) => {
  return Response.json(getUser(request.params.id))
})

// 组合路由 - 方式1：使用 route
const apiRouter = Router()
apiRouter.route('/posts').use(postsRouter)
apiRouter.route('/users').use(usersRouter)

// 挂载到主应用
app.route('/api/v1').use(apiRouter)

// 最终路由：
// GET /api/v1/posts
// GET /api/v1/posts/:id
// POST /api/v1/posts
// GET /api/v1/users
// GET /api/v1/users/:id
```

#### 路由前缀

```typescript
// 使用 basenames 设置全局前缀
const app = Http({
  basenames: ['/api', '/v1']  // 可以有多个前缀
})

app.get('/posts')  // 实际匹配: /api/posts 和 /v1/posts
```

## Schema 定义与验证

### 基础 Schema 定义

```typescript
import { ObjectType, String, Number, Boolean, Date, List, Optional, Nullable } from 'farrow-schema'

// 定义博客文章 Schema
class BlogPost extends ObjectType {
  // 基础类型
  id = Number
  title = String
  content = String
  published = Boolean
  createdAt = Date
  
  // 可选字段
  description = Optional(String)  // string | undefined
  
  // 可为 null
  publishedAt = Nullable(Date)    // Date | null
  
  // 数组
  tags = List(String)              // string[]
  
  // 嵌套对象
  author = {
    id: Number,
    name: String,
    email: String,
    avatar: Optional(String)
  }
  
  // 嵌套数组
  comments = List({
    id: Number,
    content: String,
    author: String,
    createdAt: Date
  })
}
```

### 高级 Schema 特性

#### 联合类型

```typescript
import { Union, Literal } from 'farrow-schema'

// 文章状态
const PostStatus = Union(
  Literal('draft'),
  Literal('published'),
  Literal('archived')
)

// 支付方式（复杂联合）
const PaymentMethod = Union(
  {
    type: Literal('credit_card'),
    cardNumber: String,
    cvv: String,
    expiryDate: String
  },
  {
    type: Literal('paypal'),
    email: String
  },
  {
    type: Literal('bank_transfer'),
    accountNumber: String,
    routingNumber: String
  }
)
```

#### 递归 Schema

```typescript
// 评论系统（支持嵌套回复）
class Comment extends ObjectType {
  id = Number
  content = String
  author = String
  createdAt = Date
  replies = List(Comment)  // 递归引用自己
}

// 分类树
class Category extends ObjectType {
  id = Number
  name = String
  parent = Optional(Category)
  children = List(Category)
}
```

#### Schema 操作

```typescript
import { pickObject, omitObject, partial, required } from 'farrow-schema'

// 完整的用户 Schema
class User extends ObjectType {
  id = Number
  username = String
  email = String
  password = String
  profile = {
    firstName: String,
    lastName: String,
    bio: Optional(String),
    avatar: Optional(String)
  }
  createdAt = Date
  updatedAt = Date
}

// 选择特定字段
const UserSummary = pickObject(User, ['id', 'username', 'profile'])

// 排除敏感字段
const PublicUser = omitObject(User, ['password'])

// 所有字段可选（用于更新）
const UpdateUser = partial(User)

// 所有字段必需
const RequiredUser = required(User)
```

### 自定义验证器

```typescript
import { ValidatorType, Validator } from 'farrow-schema/validator'

// 邮箱验证器
class EmailType extends ValidatorType<string> {
  validate(input: unknown) {
    const result = Validator.validate(String, input)
    if (result.isErr) return result
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(result.value)) {
      return this.Err('Invalid email format')
    }
    
    return this.Ok(result.value)
  }
}

// 带参数的验证器
const StringLength = (min: number, max: number) => {
  return class extends ValidatorType<string> {
    validate(input: unknown) {
      const result = Validator.validate(String, input)
      if (result.isErr) return result
      
      const len = result.value.length
      if (len < min || len > max) {
        return this.Err(`Length must be between ${min} and ${max}`)
      }
      
      return this.Ok(result.value)
    }
  }
}

// 使用自定义验证器
class CreateUserRequest extends ObjectType {
  username = StringLength(3, 20)
  email = EmailType
  password = StringLength(8, 100)
}
```

### 请求验证

```typescript
// 验证请求体
app.post('/posts', {
  body: {
    title: StringLength(1, 200),
    content: String,
    tags: List(String),
    published: Boolean
  }
}).use((request) => {
  // request.body 已验证，类型安全
  const post = createPost(request.body)
  return Response.status(201).json(post)
})

// 验证查询参数
app.get('/search', {
  query: {
    q: String,
    page: Optional(Number),
    limit: Optional(Number)
  }
}).use((request) => {
  const { q, page = 1, limit = 10 } = request.query
  return Response.json(search(q, { page, limit }))
})

// 验证请求头
app.post('/api/posts', {
  headers: {
    'authorization': String,
    'content-type': Literal('application/json')
  },
  body: CreatePostRequest
}).use((request) => {
  const token = request.headers.authorization
  // 处理请求...
})
```

### 错误处理

```typescript
// 自定义验证错误处理
app.post('/users', {
  body: CreateUserRequest
}, {
  onSchemaError: (error, input, next) => {
    // error.path: ['body', 'email']
    // error.message: 'Invalid email format'
    
    return Response.status(400).json({
      error: 'Validation failed',
      field: error.path?.join('.'),
      message: error.message,
      received: error.value
    })
  }
}).use((request) => {
  // 只有验证通过才会执行这里
  return Response.status(201).json(createUser(request.body))
})
```

## 中间件系统

### 中间件基础

```typescript
// farrow-http 中间件的类型定义
type HttpMiddleware = (
  request: RequestInfo, 
  next: Next<RequestInfo, MaybeAsyncResponse>
) => MaybeAsyncResponse

type Next<I = unknown, O = unknown> = (input: I) => O
type MaybeAsyncResponse = Response | Promise<Response>

// 基础中间件示例
app.use((request, next) => {
  console.log(`${request.method} ${request.pathname}`)
  return next(request)  // 调用下一个中间件并返回响应
})

// 需要处理响应的中间件（使用异步）
app.use(async (request, next) => {
  const start = Date.now()
  const response = await next(request)  // 等待响应
  console.log(`处理耗时: ${Date.now() - start}ms`)
  return response
})
```

### 常用中间件模式

#### 日志中间件

```typescript
import { RequestInfo, Response, MaybeAsyncResponse, HttpMiddleware } from 'farrow-http'

// 日志中间件 - 需要异步处理以正确计算响应时间
const logger: HttpMiddleware = async (request, next) => {
  const start = Date.now()
  const { method, pathname } = request
  
  console.log(`→ ${method} ${pathname}`)
  
  const response = await next(request)  // 等待响应完成
  
  const duration = Date.now() - start
  const status = response.info.status?.code || 200
  
  console.log(`← ${method} ${pathname} ${status} ${duration}ms`)
  
  return response
}

app.use(logger)
```

#### 认证中间件

```typescript
import { createContext } from 'farrow-pipeline'
import { RequestInfo, Response, MaybeAsyncResponse, HttpMiddleware } from 'farrow-http'

const UserContext = createContext<User | null>(null)

// 认证中间件 - 通常需要异步查询数据库
const authenticate: HttpMiddleware = async (request, next) => {
  const token = request.headers?.authorization?.replace('Bearer ', '')
  
  if (!token) {
    return Response.status(401).json({ error: 'Token required' })
  }
  
  try {
    const payload = jwt.verify(token, SECRET_KEY)
    const user = await getUserById(payload.userId)  // 异步查询用户
    
    if (!user) {
      return Response.status(401).json({ error: 'User not found' })
    }
    
    UserContext.set(user)
    return next(request)
  } catch (error) {
    return Response.status(401).json({ error: 'Invalid token' })
  }
}

// 应用到特定路由
app.use('/api/<path*:string>', authenticate)
```

#### CORS 中间件

```typescript
import { RequestInfo, Response, HttpMiddleware } from 'farrow-http'

interface CorsOptions {
  origin?: string
  methods?: string[]
  headers?: string[]
  credentials?: boolean
}

// 返回一个中间件函数
const cors = (options: CorsOptions = {}): HttpMiddleware => {
  const {
    origin = '*',
    methods = ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    headers = ['Content-Type', 'Authorization'],
    credentials = true
  } = options
  
  return (request, next) => {
    // 处理预检请求
    if (request.method === 'OPTIONS') {
      return Response.empty()
        .header('Access-Control-Allow-Origin', origin)
        .header('Access-Control-Allow-Methods', methods.join(', '))
        .header('Access-Control-Allow-Headers', headers.join(', '))
        .header('Access-Control-Allow-Credentials', String(credentials))
    }
    
    // 添加 CORS 头到响应
    const response = next(request)
    
    return response
      .header('Access-Control-Allow-Origin', origin)
      .header('Access-Control-Allow-Credentials', String(credentials))
  }
}

app.use(cors({ origin: 'https://example.com' }))
```

#### 限流中间件

```typescript
import { RequestInfo, Response, HttpMiddleware } from 'farrow-http'

// 高阶函数，返回配置好的中间件
const rateLimit = (maxRequests = 100, windowMs = 60000): HttpMiddleware => {
  const requests = new Map<string, number[]>()
  
  return (request, next) => {
    const ip = request.ip || 'unknown'
    const now = Date.now()
    
    // 获取或初始化请求记录
    const timestamps = requests.get(ip) || []
    
    // 清理过期的请求记录
    const validTimestamps = timestamps.filter(
      time => now - time < windowMs
    )
    
    // 检查是否超过限制
    if (validTimestamps.length >= maxRequests) {
      return Response.status(429).json({
        error: 'Too many requests',
        retryAfter: Math.ceil(windowMs / 1000)
      })
    }
    
    // 记录新请求
    validTimestamps.push(now)
    requests.set(ip, validTimestamps)
    
    // 添加限流信息到响应头
    const response = next(request)
    
    return response
      .header('X-RateLimit-Limit', String(maxRequests))
      .header('X-RateLimit-Remaining', String(maxRequests - validTimestamps.length))
      .header('X-RateLimit-Reset', String(now + windowMs))
  }
}

app.use(rateLimit(100, 60000))  // 每分钟 100 个请求
```

### 中间件组合

```typescript
// 创建中间件组
const apiMiddlewares = [
  logger,
  cors(),
  rateLimit(1000, 60000),
  authenticate
]

// 应用到特定路由组
const apiRouter = Router()

// use 方法支持多个中间件参数，可以直接展开数组
apiRouter.use(...apiMiddlewares)

// 或者链式调用
apiRouter
  .use(logger)
  .use(cors())
  .use(rateLimit(1000, 60000))
  .use(authenticate)

// 添加子路由
apiRouter.route('/posts').use(postsRouter)
apiRouter.route('/users').use(usersRouter)

// 挂载到主应用
app.route('/api').use(apiRouter)
```

## 响应构建

### 基础响应类型

```typescript
// JSON 响应（最常用）
app.get('/data').use(() => {
  return Response.json({ message: 'Hello', data: [1, 2, 3] })
})

// 文本响应
app.get('/text').use(() => {
  return Response.text('Plain text response')
})

// HTML 响应
app.get('/html').use(() => {
  return Response.html(`
    <!DOCTYPE html>
    <html>
      <head><title>Farrow</title></head>
      <body><h1>Hello Farrow!</h1></body>
    </html>
  `)
})

// 空响应（204 No Content）
app.delete('/items/<id:int>').use((request) => {
  deleteItem(request.params.id)
  return Response.empty()
})
```

### 文件响应

```typescript
// 发送文件
app.get('/download/<filename:string>').use((request) => {
  const filepath = path.join('./uploads', request.params.filename)
  return Response.file(filepath)
})

// 文件下载（带附件名）
app.get('/export').use(() => {
  return Response
    .file('./data/export.csv')
    .attachment('report-2024.csv')  // 设置下载文件名
})

// 内联显示（如 PDF）
app.get('/preview/<id:int>').use((request) => {
  const file = getFile(request.params.id)
  return Response
    .file(file.path)
    .header('Content-Disposition', 'inline')
})
```

### 重定向

```typescript
// 基础重定向
app.get('/old-path').use(() => {
  return Response.redirect('/new-path')
})

// 永久重定向（301）
app.get('/permanent').use(() => {
  return Response.redirect('/new-location', { 
    status: 301 
  })
})

// 外部重定向
app.get('/external').use(() => {
  return Response.redirect('https://example.com', {
    usePrefix: false  // 不使用应用前缀
  })
})
```

### 响应链式构建

```typescript
// 链式设置响应属性
app.post('/api/users').use((request) => {
  const user = createUser(request.body)
  
  return Response
    .json(user)
    .status(201)
    .header('Location', `/api/users/${user.id}`)
    .header('X-Total-Count', '100')
    .cookie('lastUserId', user.id, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 86400000  // 24 小时
    })
    .vary('Accept-Encoding')
})

// 设置多个 Cookie
app.get('/login').use(() => {
  return Response
    .json({ message: 'Logged in' })
    .cookie('sessionId', generateSessionId(), {
      httpOnly: true,
      secure: true
    })
    .cookie('username', 'john', {
      maxAge: 86400000
    })
})
```

### 响应合并 - Response.merge

`Response.merge` 允许你合并多个响应的属性，这在中间件组合中特别有用：

#### ⚠️ Response 合并注意事项

由于最初设计遗漏，Response 合并时需要注意顺序：

```typescript
// ⚠️ 重要：Response.merge 遵循"后者覆盖前者"原则

// ❌ 错误：将有body的响应放前面，会被空body覆盖
Response.text('Hello').merge(Response.cookie('token', '123'))
// 结果：只有cookie，文本内容丢失！

// ✅ 正确：链式调用
Response.text('Hello').cookie('token', '123')

// ✅ 正确：空响应在前，有body的响应在后
Response.cookie('token', '123').merge(Response.text('Hello'))
```

```typescript
// Response.merge 的基本用法
app.get('/api/data').use(() => {
  const headersResponse = Response
    .header('X-Custom', 'value')
    .header('X-Request-ID', generateId())
  const dataResponse = Response.json({ data: 'value' })
  
  // 正确：headers响应(空body)在前，data响应(有body)在后
  return headersResponse.merge(dataResponse)
})

// 在中间件中使用 Response.merge
const addSecurityHeaders = (request, next) => {
  const response = next(request)
  
  // 创建包含安全头的响应（空body）
  const securityHeaders = Response
    .header('X-Content-Type-Options', 'nosniff')
    .header('X-Frame-Options', 'DENY')
    .header('X-XSS-Protection', '1; mode=block')
  
  // 正确：安全头(空body)在前，原响应在后
  return securityHeaders.merge(response)
}

// 条件性合并响应
app.get('/api/profile').use((request) => {
  const user = getUserProfile()
  const baseResponse = Response.json(user)
  
  // 根据条件添加额外的响应属性
  if (user.isAdmin) {
    const adminHeaders = Response.header('X-Admin-Access', 'true')
    return adminHeaders.merge(baseResponse)  // 正确：空body在前
  }
  
  return baseResponse
})

// 合并多个响应
app.get('/api/resource').use(() => {
  const data = Response.json({ result: 'success' })
  const status = Response.status(201)
  const headers = Response
    .header('Location', '/api/resource/123')
    .header('X-Resource-ID', '123')
  const cookies = Response.cookie('lastResourceId', '123')
  
  // 正确：将有body的响应放在最后
  return Response.merge(status, headers, cookies, data)
})
```

### 流式响应

```typescript
import { Readable } from 'stream'

// 发送流
app.get('/stream').use(() => {
  const stream = fs.createReadStream('./large-file.json')
  
  return Response
    .stream(stream)
    .header('Content-Type', 'application/json')
    .header('Transfer-Encoding', 'chunked')
})

// Server-Sent Events (SSE)
app.get('/events').use(() => {
  const stream = new Readable({
    read() {
      // 每秒发送一个事件
      const interval = setInterval(() => {
        this.push(`data: ${JSON.stringify({ time: Date.now() })}\n\n`)
      }, 1000)
      
      // 10 秒后结束
      setTimeout(() => {
        clearInterval(interval)
        this.push(null)
      }, 10000)
    }
  })
  
  return Response
    .stream(stream)
    .header('Content-Type', 'text/event-stream')
    .header('Cache-Control', 'no-cache')
    .header('Connection', 'keep-alive')
})
```

## Context 系统

### 创建和使用 Context

```typescript
import { createContext } from 'farrow-pipeline'

// 创建各种 Context
const UserContext = createContext<User | null>(null)
const DatabaseContext = createContext<Database>()
const RequestIdContext = createContext<string>('')
const ConfigContext = createContext({
  apiUrl: 'https://api.example.com',
  timeout: 5000
})

// 在中间件中设置 Context
app.use((request, next) => {
  // 设置请求 ID
  const requestId = crypto.randomUUID()
  RequestIdContext.set(requestId)
  
  // 设置数据库连接
  const db = createDatabaseConnection()
  DatabaseContext.set(db)
  
  // 继续处理
  const response = next(request)
  
  // 清理（如果需要）
  db.close()
  
  return response
})

// 在路由中使用 Context
app.get('/profile').use(() => {
  const user = UserContext.get()
  const db = DatabaseContext.get()
  const requestId = RequestIdContext.get()
  
  if (!user) {
    return Response.status(401).json({ 
      error: 'Not authenticated',
      requestId 
    })
  }
  
  const profile = db.getProfile(user.id)
  
  return Response
    .json(profile)
    .header('X-Request-ID', requestId)
})
```

### 自定义 Hooks

```typescript
// 创建可复用的 Hooks
function useCurrentUser() {
  const user = UserContext.get()
  if (!user) {
    throw new HttpError('Authentication required', 401)
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

function useRequestId() {
  return RequestIdContext.get()
}

// 组合 Hooks
function useAuthenticatedRequest() {
  const user = useCurrentUser()
  const db = useDatabase()
  const requestId = useRequestId()
  
  return { user, db, requestId }
}

// 在路由中使用 Hooks
app.get('/api/posts').use(() => {
  const { user, db } = useAuthenticatedRequest()
  
  const posts = db.getPostsByUser(user.id)
  
  return Response.json(posts)
})

app.post('/api/posts', {
  body: CreatePostSchema
}).use((request) => {
  const { user, db } = useAuthenticatedRequest()
  
  const post = db.createPost({
    ...request.body,
    authorId: user.id
  })
  
  return Response.status(201).json(post)
})
```

### Context 隔离

```typescript
// 每个请求都有独立的 Context
const CounterContext = createContext(0)

app.use((request, next) => {
  // 每个请求从 0 开始
  CounterContext.set(0)
  return next(request)
})

app.use((request, next) => {
  const count = CounterContext.get()
  CounterContext.set(count + 1)
  console.log(`Middleware 1: ${count + 1}`)
  return next(request)
})

app.use((request, next) => {
  const count = CounterContext.get()
  CounterContext.set(count + 1)
  console.log(`Middleware 2: ${count + 1}`)
  return next(request)
})

// 并发请求不会相互影响
// 请求 A: Middleware 1: 1, Middleware 2: 2
// 请求 B: Middleware 1: 1, Middleware 2: 2
```

## 错误处理

### 使用 HttpError

```typescript
import { HttpError } from 'farrow-http'

// 基础 HttpError
app.get('/users/<id:int>').use((request) => {
  const user = getUser(request.params.id)
  
  if (!user) {
    throw new HttpError('User not found', 404)
  }
  
  return Response.json(user)
})

// 自定义错误类
class ValidationError extends HttpError {
  constructor(
    public field: string,
    message: string
  ) {
    super(message, 400)
    this.name = 'ValidationError'
  }
}

class UnauthorizedError extends HttpError {
  constructor(message = 'Unauthorized') {
    super(message, 401)
    this.name = 'UnauthorizedError'
  }
}

class ForbiddenError extends HttpError {
  constructor(resource: string) {
    super(`Access to ${resource} is forbidden`, 403)
    this.name = 'ForbiddenError'
  }
}

// 使用自定义错误
app.post('/posts').use((request) => {
  if (!request.body.title) {
    throw new ValidationError('title', 'Title is required')
  }
  
  const user = useCurrentUser()
  if (!user.canCreatePost) {
    throw new ForbiddenError('posts')
  }
  
  // ...
})
```

### 全局错误处理

```typescript
// 错误处理中间件（放在最前面） - 统一使用 async/await
app.use(async (request, next) => {
  try {
    return await next(request)
  } catch (error) {
    // 处理所有错误（同步和异步）
    return handleError(error)
  }
})

// 处理异步错误
app.use(async (request, next) => {
  try {
    const response = await next(request)
    return response
  } catch (error) {
    return handleError(error)
  }
})

function handleError(error: unknown): Response {
  // 已知的 HTTP 错误
  if (error instanceof HttpError) {
    return Response.status(error.status).json({
      error: error.message,
      status: error.status
    })
  }
  
  // 验证错误
  if (error instanceof ValidationError) {
    return Response.status(400).json({
      error: 'Validation failed',
      field: error.field,
      message: error.message
    })
  }
  
  // 数据库错误
  if (error instanceof DatabaseError) {
    console.error('Database error:', error)
    return Response.status(503).json({
      error: 'Service temporarily unavailable'
    })
  }
  
  // 未知错误
  console.error('Unexpected error:', error)
  
  if (process.env.NODE_ENV === 'production') {
    return Response.status(500).json({
      error: 'Internal server error'
    })
  } else {
    // 开发环境返回详细错误
    return Response.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    })
  }
}
```

### Schema 验证错误处理

```typescript
// 全局 Schema 错误处理
app.match({
  url: '/<path*:string>',
  onSchemaError: (error, input, next) => {
    const field = error.path?.join('.')
    
    return Response.status(400).json({
      error: 'Validation failed',
      details: {
        field,
        message: error.message,
        value: error.value
      }
    })
  }
})

// 特定路由的错误处理
app.post('/users', {
  body: CreateUserSchema
}, {
  onSchemaError: (error, input, next) => {
    // 自定义错误响应
    if (error.path?.includes('email')) {
      return Response.status(400).json({
        error: 'Invalid email address',
        suggestion: 'Please use a valid email format'
      })
    }
    
    return Response.status(400).json({
      error: error.message
    })
  }
})
```

## 实战：构建完整的博客 API

让我们综合运用所学知识，构建一个完整的博客 API：

```typescript
import { Http, Response, Router, HttpError } from 'farrow-http'
import { ObjectType, String, Number, Boolean, Date, List, Optional, TypeOf } from 'farrow-schema'
import { createContext } from 'farrow-pipeline'
import { Validator, ValidatorType } from 'farrow-schema/validator'

// ========== Schema 定义 ==========

// 自定义验证器
class EmailType extends ValidatorType<string> {
  validate(input: unknown) {
    const result = Validator.validate(String, input)
    if (result.isErr) return result
    
    if (!input.includes('@')) {
      return this.Err('Invalid email')
    }
    
    return this.Ok(result.value)
  }
}

const StringLength = (min: number, max: number) => {
  return class extends ValidatorType<string> {
    validate(input: unknown) {
      const result = Validator.validate(String, input)
      if (result.isErr) return result
      
      if (result.value.length < min || result.value.length > max) {
        return this.Err(`Length must be ${min}-${max} characters`)
      }
      
      return this.Ok(result.value)
    }
  }
}

// 数据模型
class User extends ObjectType {
  id = Number
  username = StringLength(3, 20)
  email = EmailType
  role = Union(Literal('admin'), Literal('author'), Literal('reader'))
  createdAt = Date
}

class BlogPost extends ObjectType {
  id = Number
  title = StringLength(1, 200)
  slug = String
  content = String
  excerpt = Optional(String)
  authorId = Number
  published = Boolean
  tags = List(String)
  createdAt = Date
  updatedAt = Date
}

class Comment extends ObjectType {
  id = Number
  postId = Number
  content = StringLength(1, 1000)
  authorName = String
  authorEmail = EmailType
  createdAt = Date
}

// API 请求/响应 Schema
const CreatePostRequest = pickObject(BlogPost, ['title', 'content', 'excerpt', 'tags'])
const UpdatePostRequest = partial(CreatePostRequest)
const PostResponse = omitObject(BlogPost, ['authorId'])

// ========== Context ==========

const UserContext = createContext<User | null>(null)
const DatabaseContext = createContext<Database>()

// ========== 自定义 Hooks ==========

function useCurrentUser() {
  const user = UserContext.get()
  if (!user) {
    throw new HttpError('Authentication required', 401)
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

// ========== 中间件 ==========

// 日志中间件
const logger = (request, next) => {
  const start = Date.now()
  console.log(`→ ${request.method} ${request.pathname}`)
  
  const response = next(request)
  
  const duration = Date.now() - start
  console.log(`← ${response.info.status?.code} (${duration}ms)`)
  
  return response
}

// 认证中间件
const authenticate = (request, next) => {
  const token = request.headers?.authorization?.replace('Bearer ', '')
  
  if (!token) {
    return next(request)  // 继续，但不设置用户
  }
  
  try {
    const user = verifyToken(token)
    UserContext.set(user)
  } catch {
    // 无效 token，继续但不设置用户
  }
  
  return next(request)
}

// 需要认证的中间件
const requireAuth = (request, next) => {
  const user = UserContext.get()
  
  if (!user) {
    return Response.status(401).json({ error: 'Authentication required' })
  }
  
  return next(request)
}

// 需要特定角色
const requireRole = (role: string) => (request, next) => {
  const user = useCurrentUser()
  
  if (user.role !== role && user.role !== 'admin') {
    return Response.status(403).json({ error: 'Insufficient permissions' })
  }
  
  return next(request)
}

// ========== 路由 ==========

const app = Http()

// 全局中间件
app.use(logger)
app.use(authenticate)

// 公开路由
app.get('/').use(() => {
  return Response.json({ 
    message: 'Blog API',
    version: '1.0.0'
  })
})

// 文章路由
const postsRouter = Router()

// 获取文章列表
postsRouter.get('/?<page?:int>&<limit?:int>&<tag?:string>').use((request) => {
  const { page = 1, limit = 10, tag } = request.query
  const db = useDatabase()
  
  const posts = db.getPosts({ page, limit, tag })
  const total = db.getPostCount({ tag })
  
  return Response.json({
    posts,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  })
})

// 获取单篇文章
postsRouter.get('/<id:int>').use((request) => {
  const db = useDatabase()
  const post = db.getPost(request.params.id)
  
  if (!post) {
    throw new HttpError('Post not found', 404)
  }
  
  return Response.json(post)
})

// 创建文章（需要认证 + 作者角色）
postsRouter.post('/', {
  body: CreatePostRequest
})
  .use(requireAuth)
  .use(requireRole('author'))
  .use((request) => {
    const user = useCurrentUser()
    const db = useDatabase()
    
    const post = db.createPost({
      ...request.body,
      authorId: user.id,
      slug: generateSlug(request.body.title),
      published: false,
      createdAt: new Date(),
      updatedAt: new Date()
    })
    
    return Response
      .status(201)
      .json(post)
      .header('Location', `/api/posts/${post.id}`)
  })

// 更新文章
postsRouter.put('/<id:int>', {
  body: UpdatePostRequest
})
  .use(requireAuth)
  .use((request) => {
    const user = useCurrentUser()
    const db = useDatabase()
    const post = db.getPost(request.params.id)
    
    if (!post) {
      throw new HttpError('Post not found', 404)
    }
    
    // 只有作者或管理员可以编辑
    if (post.authorId !== user.id && user.role !== 'admin') {
      throw new HttpError('Forbidden', 403)
    }
    
    const updated = db.updatePost(request.params.id, {
      ...request.body,
      updatedAt: new Date()
    })
    
    return Response.json(updated)
  })

// 删除文章
postsRouter.delete('/<id:int>')
  .use(requireAuth)
  .use((request) => {
    const user = useCurrentUser()
    const db = useDatabase()
    const post = db.getPost(request.params.id)
    
    if (!post) {
      throw new HttpError('Post not found', 404)
    }
    
    if (post.authorId !== user.id && user.role !== 'admin') {
      throw new HttpError('Forbidden', 403)
    }
    
    db.deletePost(request.params.id)
    
    return Response.empty()
  })

// 评论路由
const commentsRouter = Router()

// 获取文章评论
commentsRouter.get('/posts/<postId:int>/comments').use((request) => {
  const db = useDatabase()
  const comments = db.getCommentsByPost(request.params.postId)
  
  return Response.json(comments)
})

// 添加评论
commentsRouter.post('/posts/<postId:int>/comments', {
  body: {
    content: StringLength(1, 1000),
    authorName: String,
    authorEmail: EmailType
  }
}).use((request) => {
  const db = useDatabase()
  
  const comment = db.createComment({
    postId: request.params.postId,
    ...request.body,
    createdAt: new Date()
  })
  
  return Response.status(201).json(comment)
})

// 组合路由
app.route('/api/posts').use(postsRouter)
app.route('/api').use(commentsRouter)

// 错误处理
app.use(async (request, next) => {
  try {
    return await next(request)
  } catch (error) {
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
})

// 启动服务器
app.listen(3000, () => {
  console.log('Blog API running on http://localhost:3000')
})
```

## 性能优化技巧

### 1. Schema 复用

```typescript
// ✅ 好：复用 Schema 定义
const UpdateUserSchema = partial(User)
app.post('/users', { body: User })
app.patch('/users/<id:int>', { body: UpdateUserSchema })

// ❌ 避免：重复定义相同结构
app.post('/users', { body: { name: String, email: String } })
app.put('/users/<id:int>', { body: { name: String, email: String } })
```

### 2. 中间件顺序

```typescript
// ✅ 好：快速失败的中间件放前面
app.use(rateLimit())     // 快速检查
app.use(authenticate)     // 可能查询数据库
app.use(loadUserData)     // 重操作放后面

// ❌ 避免：重操作放前面
app.use(loadUserData)     // 每个请求都执行
app.use(rateLimit())      // 可能直接拒绝
```

### 3. Context 使用

```typescript
// ✅ 好：只在需要时读取 Context
app.get('/public').use(() => {
  // 不需要用户信息，不读取 UserContext
  return Response.json({ message: 'Public data' })
})

// ❌ 避免：不必要的 Context 读取
app.get('/public').use(() => {
  const user = UserContext.get()  // 不需要但读取了
  return Response.json({ message: 'Public data' })
})
```

## 小结

通过本章，你已经掌握了：

✅ **路由系统** - 类型安全的参数、查询字符串、路由组织  
✅ **Schema 系统** - 定义、验证、自定义验证器  
✅ **中间件** - 认证、日志、CORS、限流等  
✅ **响应构建** - JSON、文件、重定向、流式响应  
✅ **Context** - 状态管理、自定义 Hooks  
✅ **错误处理** - HttpError、全局错误处理  

你现在已经具备了使用 Farrow 进行日常开发的所有技能！

## 下一步

<div class="next-steps-grid">

🔧 **[深入组件](./04-components-in-depth.md)**  
深入理解 Schema、Pipeline、Context 的高级特性

⚡ **[进阶技巧](./05-advanced.md)**  
学习高级模式和最佳实践

🚀 **[实战项目](./examples/)**  
通过完整项目巩固所学

</div>

---

<div class="doc-footer">
  <div class="doc-nav">
    <a href="./02-core-concepts.md">← 核心概念</a>
    <a href="./04-components-in-depth.md">深入组件 →</a>
  </div>
</div>