# Farrow HTTP 用户 API 参考

## 概述

Farrow HTTP 是一个 TypeScript 优先的 Web 框架，提供类型安全的路由和自动验证功能。它构建在 farrow-pipeline 中间件系统和 farrow-schema 验证系统之上，既提供强大的功能，又提供出色的开发者体验。

## 目录

- [快速开始](#快速开始)
- [核心概念](#核心概念)
  - [RequestInfo - 请求信息对象](#requestinfo---请求信息对象)
- [服务器创建](#服务器创建)
  - [Http - HTTP 服务器](#http---http-服务器)
  - [Https - HTTPS 服务器](#https---https-服务器)
- [路由系统](#路由系统)
  - [HTTP 方法路由](#http-方法路由)
  - [路由模式和自动验证](#路由模式和自动验证)
  - [高级路由匹配](#高级路由匹配)
- [响应构建](#响应构建)
  - [基础响应类型](#基础响应类型)
    - [JSON 响应](#json-响应)
    - [文本响应](#文本响应)
    - [HTML 响应](#html-响应)
    - [文件响应](#文件响应)
    - [流响应](#流响应)
    - [重定向响应](#重定向响应)
    - [自定义响应](#自定义响应)
  - [响应操作](#响应操作)
    - [响应方法](#响应方法-可链式调用)
    - [响应合并](#响应合并)
    - [响应拦截](#响应拦截)
- [中间件系统](#中间件系统)
  - [中间件执行模型](#中间件执行模型)
  - [中间件类型](#中间件类型)
- [路由器与模块化](#路由器与模块化)
  - [Router - 独立路由器](#router-routerpipeline)
  - [嵌套路由](#嵌套路由)
  - [静态文件服务](#静态文件服务)
- [上下文管理](#上下文管理)
  - [Context 上下文](#context-上下文)
  - [上下文钩子](#上下文钩子)
- [错误处理](#错误处理)
  - [HttpError 类](#httperror-类)
  - [全局错误处理](#全局错误处理器)
- [测试支持](#测试支持)

## 快速开始

### 安装

```bash
npm install farrow-http farrow-schema farrow-pipeline
```

### 30秒快速开始

```typescript
import { Http, Response } from 'farrow-http'

const app = Http()
app.get('/hello').use(() => Response.json({ message: 'Hello Farrow!' }))
app.listen(3000)
```

### 重要提示：异步上下文自动启用

**farrow-http 框架会自动启用异步上下文追踪功能**。当你创建 `Http()` 或 `Https()` 实例时，框架会自动调用 `asyncTracerImpl.enable()` 来确保 Context 在异步操作中正确传递。

```typescript
import { Http } from 'farrow-http'

// 框架会自动启用异步追踪，无需手动调用
const app = Http()  // 内部自动执行 asyncTracerImpl.enable()
```

**这意味着：**
- ✅ **无需手动配置** - 不需要手动导入和调用 `asyncTracerImpl.enable()`
- ✅ **Context 自动传递** - 在 `async/await`、`Promise`、`setTimeout` 等异步操作中，Context 会自动正确传递
- ✅ **请求级隔离** - 每个 HTTP 请求都有独立的 Context，避免并发请求间的状态污染

如果你需要在纯 farrow-pipeline 环境中使用（不依赖 farrow-http），则需要手动启用：

```typescript
import * as asyncTracerImpl from 'farrow-pipeline/asyncTracerImpl.node'

// 仅在纯 farrow-pipeline 环境中需要手动启用
asyncTracerImpl.enable()
```

### 基础示例

#### 1. 简单 API 服务器
```typescript
import { Http, Response } from 'farrow-http'

const app = Http()

// 基础路由
app.get('/').use(() => Response.json({ message: 'API 服务运行中' }))
app.get('/health').use(() => Response.json({ status: 'ok' }))

app.listen(3000, () => console.log('服务器启动在 http://localhost:3000'))
```

#### 2. 带类型验证的路由
```typescript
import { Http, Response } from 'farrow-http'
import { ObjectType, String, Int } from 'farrow-schema'

const app = Http()

// 路径参数自动验证和类型推导
app.get('/user/<id:int>').use((req) => {
  const userId = req.params.id  // 类型: number
  return Response.json({ id: userId, name: `用户${userId}` })
})

// 查询参数验证
app.get('/search?<q:string>&<page?:int>').use((req) => {
  const { q, page = 1 } = req.query
  return Response.json({ 
    query: q,      // 类型: string
    page,          // 类型: number
    results: []
  })
})

app.listen(3000)
```

#### 3. 请求体验证
```typescript
import { Http, Response } from 'farrow-http'
import { ObjectType, String, Int, Optional } from 'farrow-schema'

class CreateUserInput extends ObjectType {
  name = String
  email = String  
  age = Optional(Int)
}

const app = Http()

app.post('/users', { body: CreateUserInput }).use((req) => {
  // req.body 已通过验证，类型安全
  const { name, email, age } = req.body
  const user = { id: Date.now(), name, email, age }
  return Response.status(201).json(user)
})

app.listen(3000)
```

#### 4. 中间件和错误处理
```typescript
import { Http, Response, HttpError } from 'farrow-http'

const app = Http({ logger: true })

// 全局认证中间件
app.use((req, next) => {
  const token = req.headers?.authorization
  if (req.pathname.startsWith('/protected') && !token) {
    throw new HttpError('需要授权', 401)
  }
  return next(req)
})

// 受保护的路由
app.get('/protected/profile').use(() => {
  return Response.json({ user: 'profile data' })
})

// 全局错误处理
app.use(async (req, next) => {
  try {
    return await next(req)
  } catch (error) {
    return Response.status(error.statusCode || 500).json({
      error: error.message
    })
  }
})

app.listen(3000)
```

---

## 核心概念

### RequestInfo - 请求信息对象

farrow-http 的核心是 `RequestInfo` 对象，它包含所有解析后的请求数据：

```typescript
type RequestInfo = {
  readonly pathname: string         // 路径名，如 "/users/123"
  readonly method?: string          // HTTP 方法，如 "GET", "POST"
  readonly query?: RequestQuery     // 查询参数，如 { page: 1, limit: 10 }
  readonly body?: any              // 请求体，已解析和验证
  readonly headers?: RequestHeaders // 请求标头，如 { authorization: "Bearer token" }
  readonly cookies?: RequestCookies // Cookies，如 { sessionId: "abc123" }
  readonly params?: RequestParams   // 路径参数，如 { id: 123 } (从 /users/<id:int> 解析)
}

type RequestQuery = { readonly [key: string]: any }
type RequestHeaders = { readonly [key: string]: any }
type RequestCookies = { readonly [key: string]: any }
type RequestParams = { readonly [key: string]: any }
```

**RequestInfo 的特点：**

- **类型安全**: 所有字段都有明确的类型定义
- **只读属性**: 使用 `readonly` 确保数据不被意外修改
- **自动解析**: 路径参数、查询参数、请求体等都会根据路由定义自动验证和类型转换
- **一致性**: 在整个中间件链中，RequestInfo 提供统一的请求数据访问接口

**RequestInfo 在中间件中的使用：**

```typescript
// 中间件函数签名
type Middleware = (req: RequestInfo, next: Next) => MaybeAsyncResponse

// 实际使用示例
app.get('/users/<id:int>?<page?:int>').use((req) => {
  // req.pathname: string - "/users/123"
  // req.method: string - "GET"  
  // req.params.id: number - 123 (已验证为整数)
  // req.query.page: number | undefined - 可选的页码参数
  
  return Response.json({
    userId: req.params.id,
    page: req.query.page || 1
  })
})
```

---

## 服务器创建

### Http - HTTP 服务器

### `Http(options?: HttpPipelineOptions): HttpPipeline`

创建具有全面配置选项的 HTTP 服务器实例。

```typescript
type HttpPipelineOptions = {
  basenames?: string[]          // 基础路径
  body?: BodyOptions           // 请求体解析选项
  cookie?: CookieParseOptions  // Cookie 解析选项
  query?: IParseOptions        // 查询参数解析选项
  contexts?: (params: { req: IncomingMessage; requestInfo: RequestInfo; basename:string }) => ContextStorage // 上下文注入函数
  logger?: boolean | {
    transporter?: (str: string) => void
    ignoreIntrospectionRequestOfFarrowApi?: boolean // 是否忽略 farrow-api 的内省请求日志，默认为 true
  }
  errorStack?: boolean         // 是否显示错误堆栈
}
```

**完整配置示例：**
```typescript
const app = Http({
  basenames: ['/api/v1'], // 可选的基础路径
  logger: true,           // 启用日志记录
  body: {
    limit: '10mb',        // 请求体大小限制
    encoding: 'utf8'      // 默认编码
  },
  cookie: {
    decode: decodeURIComponent,  // Cookie 值解码器
    maxAge: 86400000,           // 默认最大存活时间（24 小时）
    httpOnly: true,             // 默认 httpOnly 设置
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax'             // CSRF 保护
  },
  query: {
    depth: 5,            // 查询对象的最大嵌套深度
    arrayLimit: 100,     // 查询参数中数组的最大长度
    delimiter: '&',      // 查询参数分隔符
    allowDots: true,     // 允许点符号：?user.name=value
    parseArrays: true    // 解析数组语法：?tags[0]=a&tags[1]=b
  },
  errorStack: process.env.NODE_ENV === 'development'
})
```

### 服务器方法

#### `listen(port: number, callback?: () => void)`

启动服务器并监听指定端口。

```typescript
app.listen(3000)
app.listen(3000, () => console.log('服务器在端口 3000 启动'))
```

#### `server()`

获取 Node.js HTTP 服务器实例（测试时必需）。

```typescript
const server = app.server()  // 返回 http.Server 实例
```

### BodyOptions

请求体解析选项（基于 co-body 库）：

```typescript
type BodyOptions = {
  limit?: string | number          // 大小限制，例如 '1mb', '10kb' 或 1024000
  encoding?: BufferEncoding        // 字符编码，默认 'utf8'
  length?: number                  // 内容长度
  strict?: boolean                 // JSON 严格模式，默认 true
  queryString?: object             // 查询字符串解析选项
  jsonTypes?: string[]             // JSON content-type 列表
  formTypes?: string[]             // 表单 content-type 列表
  textTypes?: string[]             // 文本 content-type 列表
}
```

### Https - HTTPS 服务器

#### `Https(options?: HttpsPipelineOptions): HttpPipeline`

创建带有 TLS/SSL 配置的 HTTPS 服务器。

```typescript
import { Https } from 'farrow-http'
import fs from 'fs'

const app = Https({
  tls: {
    key: fs.readFileSync('private-key.pem'),
    cert: fs.readFileSync('certificate.pem')
  },
  // ... 其他 HttpPipelineOptions
})

app.listen(443)
```

---

## 路由系统

### HTTP 方法路由

```typescript
// GET 请求
http.get('/users', () => Response.json({ users: [] }))

// 带请求体验证的 POST 请求
http.post('/users', { body: UserSchema }).use((req) => {
  return Response.status(201).json(req.body)
})

// 带路径参数和请求体的 PUT 请求
http.put('/users/<id:int>', { body: UpdateUserSchema }).use((req) => {
  return Response.json({ id: req.params.id, ...req.body })
})

// PATCH 请求
http.patch('/users/<id:int>/email', {
  body: { email: String }
}).use((req) => {
  return Response.json({ id: req.params.id, email: req.body.email })
})

// DELETE 请求
http.delete('/users/<id:int>', (req) => {
  return Response.status(204).empty()
})

// HEAD 请求
http.head('/users', () => Response.status(200).empty())

// OPTIONS 请求
http.options('/users', () => {
  return Response
    .header('Allow', 'GET, POST, PUT, DELETE')
    .status(200)
    .empty()
})

```

### 高级路由匹配

```typescript
// 带阻塞选项的自定义匹配
http.match({
  url: '/api/users/<id:int>',
  method: 'GET'
}, {
  block: true,  // 如果此路由不匹配，停止在这里（返回 404）
  onSchemaError: (error, input, next) => {
    return Response.status(400).json({
      error: '验证失败',
      details: error.message,
      field: error.path?.join('.')
    })
  }
}).use((request) => {
  return Response.json({ userId: request.params.id })
})
```

### 路由模式和自动验证

#### 参数类型（自动验证）

Farrow HTTP 基于 URL 模式提供强大的自动验证功能：

```typescript
// 路径参数 - 自动验证和类型化
app.get('/post/<id:int>').use((req) => {
  req.params.id  // 类型：number，验证为整数
})

app.get('/user/<name:string>').use((req) => {
  req.params.name  // 类型：string
})

app.get('/price/<value:float>').use((req) => {
  req.params.value  // 类型：number，验证为浮点数
})

app.get('/active/<flag:boolean>').use((req) => {
  req.params.flag  // 类型：boolean
})

app.get('/user/<userId:id>').use((req) => {
  req.params.userId  // 类型：string，验证为非空标识符
})

// 路径中的联合类型
app.get('/posts/<status:draft|published|archived>').use((req) => {
  req.params.status  // 类型：'draft' | 'published' | 'archived'
})

// 带大括号的字面量类型（精确字符串匹配）
app.get('/api/<version:{v1}|{v2}>').use((req) => {
  req.params.version  // 类型：'v1' | 'v2'
})

// 带修饰符的数组参数
app.get('/tags/<tags+:string>').use((req) => {
  req.params.tags  // 类型：string[]（一个或多个）
})

app.get('/categories/<cats*:string>').use((req) => {
  req.params.cats  // 类型：string[] | undefined（零个或多个）
})

// 可选参数
app.get('/user/<name?:string>').use((req) => {
  req.params.name  // 类型：string | undefined（可选）
})

// 参数修饰符总结：
// <param:type>   - 必需参数
// <param?:type>  - 可选参数（type | undefined）
// <param+:type>  - 一个或多个（type[]）
// <param*:type>  - 零个或多个（type[] | undefined）
```

### 带自动验证的查询参数

```typescript
// 路径参数 + 查询参数与自动验证和类型推断
http.get('/<category:string>?<search:string>&<page?:int>').use((req) => {
  // req.params.category 是 string（必需，来自路径）
  // req.query.search 是 string（必需，来自查询）
  // req.query.page 是 number | undefined（可选）
  const { category } = req.params  // 自动验证为 string
  const { search, page = 1 } = req.query  // 自动验证
  return Response.json({ category, search, page })
})

// 查询中的字面量值（精确匹配）
http.get('/products?<sort:asc|desc>&status=active').use((req) => {
  // req.query.sort 是 'asc' | 'desc'（联合类型）
  // req.query.status 是 'active'（字面量字符串）
  return Response.json({
    sort: req.query.sort,     // 类型：'asc' | 'desc'
    status: req.query.status   // 类型：'active'（字面量）
  })
})

// 复杂查询示例
http.get('/search?<q:string>&<tags*:string>&<author?:int>&<limit?:int>').use((req) => {
  const { q, tags, author, limit = 10 } = req.query
  // q: string（必需）
  // tags: string[] | undefined（零个或多个）
  // author: number | undefined（可选）
  // limit: number | undefined（可选，有默认值）
  
  return Response.json({
    query: q,
    tags: tags || [],
    authorId: author,
    limit,
    results: []
  })
})
```

### 带 Schema 的请求体

```typescript
import { ObjectType, String, Int, List, Optional } from 'farrow-schema'

class CreateUserInput extends ObjectType {
  name = String
  email = String
  age = Optional(Int)
}

class UpdateUserInput extends ObjectType {
  name = Optional(String)
  email = Optional(String)
  age = Optional(Int)
}

// 带请求体 schema 和验证错误处理的 POST 请求
http.post('/users', {
  body: CreateUserInput
}, {
  onSchemaError: (error, input, next) => {
    // error.message - 验证错误消息
    // error.path - 字段路径，如 ['body', 'email']
    // error.value - 无效的值
    // input - 请求对象 (RequestInfo)
    // next - 继续到下一个中间件
    
    return Response.status(400).json({
      error: '验证失败',
      field: error.path?.join('.'),
      message: error.message,
      received: error.value
    })
  }
}).use((req) => {
  const { name, email, age } = req.body
  const user = { id: 1, name, email, age }
  return Response.json(user)
})
```

### 高级 Schema 匹配

```typescript
type RouterPipeline['match']=<U extends string, T extends RouterUrlSchema<U>>(
    schema: T,
    options?: MatchOptions,
  ): AsyncPipeline<TypeOfUrlSchema<T>, Response>

type RouterUrlSchema = {
  url: string                         // URL 模式（支持模板字面量类型）
  method?: string | string[]          // HTTP 方法
  body?: Schema.FieldDescriptor       // 请求体验证
  headers?: RouterSchemaDescriptor    // 请求标头验证
  cookies?: RouterSchemaDescriptor    // Cookie 验证
}

type MatchOptions = {
  block?: boolean                     // 是否阻塞不匹配的请求，默认 false
  onSchemaError?(                     // 验证错误处理器
    error: ValidationError,
    input: RequestInfo,
    next: Next<RequestInfo, MaybeAsyncResponse>
  ): MaybeAsyncResponse | void
}

// 使用详细 Schema 进行复杂验证
app.match({
  url: '/api/users/<id:int>?<expand?:string>',
  method: ['GET', 'PUT'],
  body: { name: String, email: String },
  headers: { authorization: String }
}, {
  block: true,  // 阻塞模式：验证失败直接返回错误
  onSchemaError: (error, input, next) => {
    console.log('错误路径:', error.path)     // ['body', 'profile', 'email']
    console.log('用户输入:', error.value)    // 用户实际输入的值
    console.log('错误消息:', error.message)  // 详细错误描述
    
    return Response.status(400).json({
      error: '数据验证失败',
      field: error.path?.join('.'),         // 'body.profile.email'
      message: error.message,
      received: error.value,
      hint: '请检查输入格式是否正确'
    })
  }
}).use((req) => {
  // req.body 已验证且类型安全
  const { id } = req.params      // number
  const { expand } = req.query   // string | undefined
  const { name, email } = req.body
  return Response.json({ id, name, email })
})
```

### ValidationError

验证错误类型定义：

```typescript
type ValidationError = {
  message: string                     // 错误描述
  path?: (string | number)[]          // 错误字段路径
  value?: any                         // 导致错误的值
  schema?: any                        // 相关的 Schema 定义
}
```

---

## 响应构建

### 基础响应类型

#### JSON 响应

```typescript
// 简单 JSON
Response.json({ message: 'Hello' })

// 带状态码
Response.status(201).json({ id: 1 })

// 带标头
Response.header('X-Total-Count', '100').json({ items: [] })

// 链式调用多个
Response
  .status(200)
  .header('Cache-Control', 'max-age=3600')
  .header('X-API-Version', '1.0')
  .json({ data: [] })
```

#### 文本响应

```typescript
Response.text('纯文本响应')
Response.status(404).text('未找到')
```

#### HTML 响应

```typescript
Response.html('<h1>Hello World</h1>')
Response.status(200).html(`
  <!DOCTYPE html>
  <html>
    <body><h1>欢迎</h1></body>
  </html>
`)
```

#### 文件响应

创建支持流式传输和范围请求的文件响应。

```typescript
// 基本文件响应
Response.file('./uploads/document.pdf')

// 带内容类型
Response.file('./images/logo.png', 'image/png')

// 带流控制选项
Response.file('./large-file.zip', {
  start: 0,
  end: 1024 * 1024 - 1,  // 只读取前 1MB
  highWaterMark: 1024 * 1024  // 1MB 缓冲区大小
})

// 与附件结合用于下载
Response.file('./report.pdf')
  .attachment('monthly-report.pdf')
  .header('Cache-Control', 'private, max-age=3600')
```

#### 流响应

```typescript
import { Readable } from 'stream'

const stream = Readable.from(['Hello', ' ', 'World'])
Response.stream(stream)
```

#### 重定向响应

```typescript
Response.redirect('/login')
Response.redirect('https://example.com')
Response.redirect('/path', { usePrefix: false })  // 不使用路由前缀

// 在嵌套路由中 - usePrefix 行为
const apiRouter = app.route('/api')
apiRouter.use(() => {
  return Response.redirect('/users')           // 重定向到 /api/users
})
apiRouter.use(() => {
  return Response.redirect('/users', { usePrefix: false })  // 重定向到 /users
})
```

#### 空响应

```typescript
Response.status(204).empty()
```

#### 自定义响应

创建用于直接 Node.js 响应操作的自定义响应。

```typescript
Response.custom(({ req, res, requestInfo, responseInfo }) => {
  // req: IncomingMessage - Node.js 请求对象
  // res: ServerResponse - Node.js 响应对象
  // requestInfo: RequestInfo - Farrow 请求信息
  // responseInfo: Omit<ResponseInfo, "body"> - 不含 body 的 Farrow 响应信息
  
  res.statusCode = 200
  res.setHeader('Content-Type', 'application/octet-stream')
  res.end(Buffer.from('binary data'))
})

// 服务器推送事件（SSE）示例
Response.custom(({ req, res }) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  })
  
  const sendEvent = (data: any) => {
    res.write(`data: ${JSON.stringify(data)}

`)
  }
  
  sendEvent({ message: '已连接' })
  
  const interval = setInterval(() => {
    sendEvent({ timestamp: Date.now() })
  }, 1000)
  
  req.on('close', () => clearInterval(interval))
})
```

### 响应操作

#### 响应方法（可链式调用）

```typescript
// 状态和标头
Response.status(code: number, message?: string): Response
Response.header(name: string, value: string): Response
Response.headers(object: Record<string, string>): Response
Response.type(contentType: string): Response
Response.vary(field: string): Response

// Cookies
Response.cookie(name: string, value: string, options?: CookieOptions): Response
Response.cookies(object: Record<string, string>, options?: CookieOptions): Response

// 支持 Unicode 的附件
Response.attachment(filename?: string, options?: AttachmentOptions): Response

type AttachmentOptions = {
  type?: 'attachment' | 'inline'  // 附件类型
  fallback?: string              // 后备文件名
}

type CookieOptions = {
  domain?: string                           // Cookie 域
  encode?: (val: string) => string         // 编码函数
  expires?: Date                           // 过期时间
  httpOnly?: boolean                       // 仅 HTTP 访问
  maxAge?: number                          // 最大生存时间（毫秒）
  path?: string                            // Cookie 路径
  priority?: 'low' | 'medium' | 'high'     // 优先级
  sameSite?: boolean | 'lax' | 'strict' | 'none'  // SameSite 策略
  secure?: boolean                         // 需要 HTTPS
  signed?: boolean                         // 签名 cookie
}

type FileBodyOptions = {
  flags?: string                    // 文件打开标志
  encoding?: BufferEncoding         // 字符编码
  fd?: number                      // 文件描述符
  mode?: number                    // 文件模式
  autoClose?: boolean              // 自动关闭
  emitClose?: boolean              // 触发关闭事件
  start?: number                   // 读取起始位置
  end?: number                     // 读取结束位置
  highWaterMark?: number           // 缓冲区大小
}

// 文件附件示例
Response.file('./document.pdf').attachment('monthly-report.pdf')

// 中文文件名带后备
Response.file('./数据报告.xlsx').attachment('数据报告.xlsx', {
  fallback: 'data-report.xlsx'  // 兼容旧浏览器
})

// 内联显示（在浏览器中打开而非下载）
Response.file('./document.pdf').attachment('document.pdf', {
  type: 'inline'
})
```

#### 响应类型检查

```typescript
// Response.is() 检查响应内容类型
const response = Response.json({ data: 'test' })
response.is('json')        // 返回：'json'
response.is('html')        // 返回：false
response.is('json', 'xml') // 返回：'json'（第一个匹配）

const htmlResponse = Response.html('<h1>Hello</h1>')
htmlResponse.is('html')    // 返回：'html'
htmlResponse.is('text', 'html') // 返回匹配的类型或 false
```

#### 响应合并

```typescript
// 重要：Response.merge 遵循"后者覆盖前者"原则
// Response = createResponse(empty()) 默认情况下

// ✅ 正确：空主体 + JSON 主体 = JSON 主体
const baseResponse = Response.headers({
  'X-API-Version': 'v1',
  'X-Request-ID': requestId
})  // 保持空主体

const dataResponse = Response.json({ users: [] })
return baseResponse.merge(dataResponse)
// 结果：有 JSON 主体和所有标头

// ⚠️ 错误顺序：JSON 主体被空主体覆盖
const result = Response.json({ users: [] }).merge(Response.header('X-Version', 'v1'))
// 结果：只有空主体和标头，JSON 数据丢失！

// ✅ 正确顺序：空主体被 JSON 主体覆盖
const result = Response.header('X-Version', 'v1').merge(Response.json({ users: [] }))
// 结果：有 JSON 主体和标头

// ✅ 最佳实践：使用链式调用避免合并问题
const result = Response.json({ users: [] }).header('X-Version', 'v1')
// 结果：有 JSON 主体和标头，无需担心顺序
```

**重要提示**：使用 `merge()` 时，最后一个响应的主体会**完全覆盖**之前的主体。对于主体 + 标头/cookies，请始终使用链式调用，或确保主体是合并中的最后一项。

#### 响应拦截

##### 捕获和转换响应

```typescript
// 全局捕获和转换 JSON 响应
http.capture('json', (jsonBody) => {
  // jsonBody 类型：{ type: 'json', value: JsonType }
  return Response.json({
    data: jsonBody.value,
    timestamp: new Date().toISOString(),
    version: 'v1',
    success: true
  })
})

// 捕获文件响应用于日志/分析
http.capture('file', (fileBody) => {
  // fileBody 类型：{ type: 'file', value: string, options?: FileBodyOptions }
  console.log(`文件服务: ${fileBody.value}`)
  return Response.file(fileBody.value, fileBody.options)
})

// 所有可捕获的主体类型：
// 'empty' | 'string' | 'json' | 'stream' | 'buffer' | 'file' | 'custom' | 'redirect'
```

##### `matchBodyType<T extends keyof BodyMap>(type: T, callback: (body: BodyMap[T]) => MaybeAsyncResponse)`

创建中间件来捕获和处理特定响应主体类型。

```typescript
import { matchBodyType } from 'farrow-http'

// 为所有 JSON 响应添加时间戳和版本信息
app.use(matchBodyType('json', (body) => {
  return Response.json({
    ...body.value,
    timestamp: Date.now(),
    version: 'v1'
  })
}))

// 为所有文件响应添加缓存标头
app.use(matchBodyType('file', (body) => {
  return Response.file(body.value, body.options)
    .header('Cache-Control', 'public, max-age=3600')
    .header('X-File-Server', 'farrow-http')
}))

// 处理字符串响应，添加前缀
app.use(matchBodyType('string', (body) => {
  return Response.string(`[${new Date().toISOString()}] ${body.value}`)
}))
```

---

## 中间件系统

中间件使用洋葱执行模型，必须返回 Response 对象。

### 中间件执行模型

中间件遵循洋葱模型，每个中间件可以在请求处理前后执行代码：

```typescript
app.use((req, next) => {
  console.log('1: 进入')
  const result = next(req)  // 调用下一个中间件
  console.log('4: 退出')
  return result
})

app.use((req, next) => {
  console.log('2: 进入')
  const result = next(req)
  console.log('3: 退出')
  return result
})

// 执行顺序：1 -> 2 -> 3 -> 4
```

**重要原则：**
- 中间件**必须返回 Response 对象**
- 调用 `next(req)` 继续到后续中间件
- 不调用 `next()` 会中断执行链
- 支持同步和异步中间件混合使用

### 嵌套路由器中的中间件执行顺序

嵌套路由器中的中间件按照定义顺序依次执行：

```typescript
// 父路由器的中间件会被子路由器继承
const apiRouter = app.route('/api')
apiRouter.use(corsMiddleware)     // 所有 API 路由都有 CORS
apiRouter.use(rateLimitMiddleware) // 所有 API 路由都有限流

const v1Router = apiRouter.route('/v1')
v1Router.use(authMiddleware)      // v1 路由需要认证

const userRouter = v1Router.route('/users')
userRouter.use(userValidationMiddleware)     // 用户路由有额外验证

// 请求 /api/v1/users 会依次经过：
// 1. corsMiddleware
// 2. rateLimitMiddleware  
// 3. authMiddleware
// 4. userValidationMiddleware
// 5. 最终处理函数
```

### 基本中间件

```typescript
// 路由特定中间件
http.get('/protected')
  .use(async (req, next) => {
    const token = req.headers.authorization
    if (!token) {
      return Response.status(401).json({ error: '未授权' })
    }
    return next(req)
  })
  .use((req) => {
    return Response.json({ message: '受保护的内容' })
  })
```

### 全局中间件

```typescript
// 应用到所有路由
http.use(async (req, next) => {
  console.log(`${req.method} ${req.pathname}`)
  const start = Date.now()
  const response = await next(req)
  console.log(`耗时 ${Date.now() - start}ms`)
  return response
})
```

### 异步中间件

```typescript
app.use(async (req, next) => {
  const user = await authenticateUser(req)
  UserContext.set(user)
  return next(req)
})

// 处理异步响应
app.use(async (req, next) => {
  const response = await next(req)
  return response.header('X-Processed-At', Date.now().toString())
})
```

### 错误处理中间件

```typescript
import { HttpError } from 'farrow-http'

// 抛出 HTTP 错误
http.get('/error', () => {
  throw new HttpError('资源未找到', 404)
})

// 全局错误处理器
http.use(async (req, next) => {
  try {
    return await next(req)
  } catch (error) {
    if (error instanceof HttpError) {
      return Response.status(error.statusCode).json({
        error: error.message 
      })
    }
    return Response.status(500).json({
      error: '内部服务器错误'
    })
  }
})
```

### 中间件类型

中间件函数的 TypeScript 类型定义：

```typescript
type HttpMiddleware = (
  request: RequestInfo, 
  next: Next<RequestInfo, MaybeAsyncResponse>
) => MaybeAsyncResponse

type Next<I, O> = (input?: I) => O
type MaybeAsyncResponse = Response | Promise<Response>
```

---

## 路由器与模块化

路由器提供模块化路由管理，支持组合和嵌套。

### Router - 独立路由器

#### `Router(): RouterPipeline`

创建独立的路由器实例，用于模块化路由管理。

```typescript
import { Router } from 'farrow-http'

const userRouter = Router()
const apiRouter = Router()

// 路由器可以独立使用
userRouter.get('/profile').use(() => Response.json({ user: 'profile' }))
userRouter.post('/update').use(() => Response.json({ success: true }))

// 将路由器挂载到应用程序
app.use(userRouter)
app.route('/api').use(apiRouter)
```

#### Router 的核心特性

**Router 实例具有与主应用相同的 API：**

```typescript
const router = Router()

// HTTP 方法路由
router.get('/users')
router.post('/users')
router.put('/users/<id:int>')
router.delete('/users/<id:int>')

// 中间件支持
router.use(authMiddleware)
router.use(validationMiddleware)

// 嵌套子路由
router.route('/admin').use(adminRouter)

// 静态文件服务
router.serve('/static', './public')

// 路由匹配
router.match({ url: '/api/<id:int>', method: 'GET' })
```

#### Router 使用模式

**基础模式：创建 + 配置 + 挂载**

```typescript
// 1. 创建并配置路由器
const userRouter = Router()
userRouter.get('/').use(getUsersList)
userRouter.get('/<id:int>').use(getUserById)

// 2. 挂载到应用
app.route('/users').use(userRouter)  // 路径: /users/*, /users/123
```

**嵌套模式：多层路由组合**

```typescript
const apiRouter = Router()
const v1Router = Router()
const userRouter = Router()

// 配置各层路由器
userRouter.get('/profile').use(getProfile)
v1Router.route('/users').use(userRouter)
apiRouter.route('/v1').use(v1Router)

// 最终挂载: /api/v1/users/profile
app.route('/api').use(apiRouter)
```

**模块化模式：文件分离**

```typescript
// modules/auth.ts
export const authRouter = Router()
authRouter.post('/login').use(loginHandler)

// modules/users.ts  
export const usersRouter = Router()
usersRouter.get('/').use(getUsersHandler)

// main.ts
import { authRouter } from './modules/auth'
import { usersRouter } from './modules/users'

app.route('/auth').use(authRouter)
app.route('/users').use(usersRouter)
```

#### Router() 与 route() 配合使用

`Router()` 和 `route()` 方法是设计来配合工作的：

- **`Router()`** - 创建独立的、可复用的路由器实例
- **`route()`** - 为路由器分配路径前缀并挂载到应用

**标准配合模式：**

```typescript
// 1. 创建独立路由器
const userRouter = Router()
const adminRouter = Router()

// 2. 配置路由器
userRouter.get('/profile').use(getUserProfile)
userRouter.get('/settings').use(getUserSettings)

adminRouter.get('/dashboard').use(getAdminDashboard)
adminRouter.get('/users').use(getAllUsers)

// 3. 使用 route() 挂载路由器到特定路径
app.route('/users').use(userRouter)    // /users/profile, /users/settings
app.route('/admin').use(adminRouter)   // /admin/dashboard, /admin/users
```

**为什么这样设计？**

| 特性 | 好处 |
|------|------|
| **模块化** | Router 可以在单独文件中定义和导出 |
| **复用性** | 同一个 Router 可以挂载到不同路径 |
| **路径管理** | route() 统一管理路径前缀 |
| **测试友好** | Router 可以独立测试 |
| **团队协作** | 不同开发者可以独立开发不同的路由器 |

**复杂嵌套示例：**

```typescript
// API v1 路由器
const apiV1Router = Router()

// 用户管理路由器  
const usersRouter = Router()
usersRouter.get('/').use(getUsers)
usersRouter.post('/').use(createUser)
usersRouter.get('/<id:int>').use(getUserById)

// 产品管理路由器
const productsRouter = Router()
productsRouter.get('/').use(getProducts)
productsRouter.post('/').use(createProduct)

// 组合路由结构
apiV1Router.route('/users').use(usersRouter)       // /api/v1/users/*
apiV1Router.route('/products').use(productsRouter) // /api/v1/products/*

// 挂载到主应用
app.route('/api/v1').use(apiV1Router)
```

**使用建议：**

- ✅ **创建模块化路由器** - 使用 `Router()` 创建功能相关的路由组
- ✅ **路径前缀管理** - 使用 `route()` 为路由器分配有意义的路径
- ✅ **单一职责** - 每个 Router 负责单一功能域的路由
- ✅ **便于维护** - Router 可以独立开发、测试和维护

### 嵌套路由

#### `route(name: string): Pipeline<RequestInfo, MaybeAsyncResponse>`

创建支持无限嵌套的子路由。

```typescript
const app = Http({ basenames: ['/api'] })

// 创建嵌套路由
const v1Router = app.route('/v1')        // 路径前缀：/api/v1
const userRouter = v1Router.route('/users')  // 路径前缀：/api/v1/users
const adminRouter = userRouter.route('/admin') // 路径前缀：/api/v1/users/admin

// 每个路由器都有完整功能
userRouter.get('/').use(() => Response.json(users))           // GET /api/v1/users
userRouter.get('/<id:int>').use(() => Response.json(user))   // GET /api/v1/users/123
adminRouter.get('/stats').use(() => Response.json(stats))    // GET /api/v1/users/admin/stats

// 路由器可以有自己的中间件
userRouter.use(authMiddleware)
adminRouter.use(adminMiddleware)
```

### 静态文件服务

#### `serve(name: string, dirname: string): void`

提供带有内置安全保护的静态文件服务。

```typescript
// 基本静态文件服务
app.serve('/static', './public')
app.serve('/uploads', './storage/uploads')

// 内置安全特性：
// - 自动防止目录遍历攻击（路径规范化）
// - 自动文件权限检查（使用 fs.stat 验证访问权限）
// - 为目录请求提供 index.html（例如：/static/ → ./public/index.html）
// - 如果文件未找到或不可访问，优雅地传递给下一个中间件
// - 跨所有平台的安全路径处理

// 示例：
// /static/style.css → ./public/style.css
// /static/ → ./public/index.html（如果存在）
// /static/docs/ → ./public/docs/index.html（如果存在）
// /uploads/../secret → 被阻止（目录遍历防护）
```

---

## 上下文管理

### Context 上下文

**上下文隔离**：farrow-http 自动启用 Node.js 异步钩子（AsyncLocalStorage）来提供请求级隔离。每个 HTTP 请求在自己的容器中运行，确保上下文值永远不会在请求之间泄露。

```typescript
import { createContext } from 'farrow-pipeline'
import { Http, Response } from 'farrow-http'

// createContext<T>(defaultValue: T): Context<T>
// 创建一个新的上下文实例，类型安全且请求隔离

// 定义带默认值的上下文
const AuthContext = createContext<{ userId: string } | null>(null)
const DBContext = createContext<any | null>(null)
const RequestIdContext = createContext<string>('')

// Context<T> 接口方法
type Context<T> = {
  get(): T                    // 获取当前值
  set(value: T): void         // 设置新值  
  assert(): NonNullable<T>    // 断言非空并返回值（抛出异常如果为空）
  create(value: T): Context<T> // 创建具有不同默认值的新上下文实例
}

// 在中间件中设置上下文
app.use((req, next) => {
  const userId = extractUserFromToken(req.headers.authorization)
  const requestId = generateRequestId()
  
  AuthContext.set({ userId })
  RequestIdContext.set(requestId)
  
  return next(req)
})

// 在处理器中使用上下文
app.get('/profile').use(() => {
  const auth = AuthContext.get()          // { userId: string } | null
  const requestId = RequestIdContext.get() // string
  const db = DBContext.get()              // any | null
  
  if (!auth) {
    return Response.status(401).json({ error: '未授权' })
  }
  
  // Context.assert() 如果为空会抛出异常，返回非空值
  try {
    const safeAuth = AuthContext.assert()  // { userId: string }（永不为空）
    const user = db?.query('SELECT * FROM users WHERE id = ?', [safeAuth.userId])
    return Response.json(user)
  } catch {
    return Response.status(401).json({ error: '未认证' })
  }
})

// 上下文隔离示例 - 每个请求都有独立的上下文
app.get('/test').use(() => {
  RequestIdContext.set('unique-per-request')
  const id = RequestIdContext.get() // 每个并发请求都不同
  return Response.json({ requestId: id })
})
```

### 上下文钩子

上下文钩子在异步环境中安全传递上下文信息。

#### `useRequestInfo()`
获取当前请求信息。

```typescript
app.use(() => {
  const req = useRequestInfo()
  console.log({
    pathname: req.pathname,
    method: req.method,
    query: req.query,
    params: req.params,
    headers: req.headers,
    cookies: req.cookies,
  })
  
  return Response.json({ ok: true })
})
```

#### `useBasenames()`
获取当前路由的基础路径列表。

```typescript
const app = Http({ basenames: ['/api'] })
const v1Router = app.route('/v1')

v1Router.use(() => {
  const basenames = useBasenames() // ['/api', '/v1']
  return Response.json({ basenames })
})
```

#### `usePrefix()`
获取完整的路径前缀。

```typescript
const userRouter = Router()
userRouter.get('/').use(() => {
  const basenames = useBasenames()
  // 如果挂载在 /api/v1/users，basenames = ['/api', '/v1', '/users']
  return Response.json({ basenames })
})

http.route('/api').route('/v1').route('/users').use(userRouter)

// 获取当前路由前缀
http.route('/api').route('/v1').get('/status').use(() => {
  const prefix = usePrefix()
  // prefix = '/api/v1'（组合的 basenames 作为单个字符串）
  return Response.json({
    prefix,
    endpoint: `${prefix}/status`
  })
})
```

#### 原始对象访问
```typescript
import { useRequest, useResponse, useReq, useRes, useRequestInfo, useBasenames, usePrefix } from 'farrow-http'

// 获取 Node.js 原始请求/响应（可为空）
http.use(() => {
  const req = useRequest()  // IncomingMessage | null
  const res = useResponse() // ServerResponse | null
  
  if (req && res) {
    console.log(req.method, req.url)
    // 直接操作（不推荐）
  }
  
  return Response.json({ ok: true })
})

// 获取 Node.js 原始请求/响应（如果为空则抛出异常）
http.use(() => {
  const req = useReq()  // IncomingMessage（如果为空则抛出异常）
  const res = useRes()  // ServerResponse（如果为空则抛出异常）
  
  // 保证存在
  console.log(req.headers)
  
  return Response.json({ ok: true })
})
```


## 错误处理

### HttpError 类

内置的带状态码信息的 HTTP 错误类。

```typescript
import { HttpError } from 'farrow-http'

// 抛出 HTTP 错误
app.use((req, next) => {
  if (!isValidRequest(req)) {
    throw new HttpError('错误请求', 400)
  }
  return next(req)
})

// 自定义错误类
class AuthenticationError extends HttpError {
  constructor(message = '需要认证') {
    super(message, 401)
  }
}

// 自定义错误类型
class ValidationError extends HttpError {
  constructor(message: string, field?: string) {
    super(message, 400)
    this.name = 'ValidationError'
    this.field = field
  }
}
```

### 自动错误处理

框架自动捕获中间件中的错误：

```typescript
// 同步错误
app.use(() => {
  throw new Error('出了问题')
  // 自动转换为 500 响应
})

// 异步错误
app.use(async () => {
  const data = await fetchExternalAPI()
  return Response.json(data)
  // Promise 异常会被自动捕获
})
```

### 全局错误处理器

```typescript
// 全局错误处理器
http.use(async (req, next) => {
  try {
    return await next(req)
  } catch (error) {
    console.error('请求失败:', {
      method: req.method,
      url: req.pathname,
      error: error.message
    })

    if (error instanceof ValidationError) {
      return Response.status(error.statusCode).json({
        error: error.message,
        field: error.field,
        type: 'validation_error'
      })
    }
    
    if (error instanceof HttpError) {
      return Response.status(error.statusCode).json({
        error: error.message,
        type: 'http_error'
      })
    }
    
    return Response.status(500).json({
      error: '内部服务器错误',
      type: 'server_error'
    })
  }
})
```

### 错误堆栈控制

```typescript
const app = Http({
  errorStack: process.env.NODE_ENV === 'development'   // 在开发环境显示完整堆栈
})
```

---

## 测试支持

```typescript
import { Http } from 'farrow-http'
import request from 'supertest'

const app = Http()
app.get('/hello').use(() => Response.json({ message: 'Hello' }))

// 使用 app.server() 创建服务器但不启动它
// 这对测试至关重要 - 在测试中不要调用 listen()！
const server = app.server()  // 返回 Node.js http.Server 实例

// 使用 supertest 测试请求
describe('API 测试', () => {
  test('GET /hello', async () => {
    const response = await request(server)
      .get('/hello')
      .expect(200)
    
    expect(response.body).toEqual({ message: 'Hello' })
  })
  
  test('POST /users', async () => {
    const response = await request(server)
      .post('/users')
      .send({ name: 'Alice', email: 'alice@example.com' })
      .expect(201)
    
    expect(response.body.name).toBe('Alice')
  })
  
  test('受保护的路由', async () => {
    await request(server)
      .get('/protected')
      .set('Authorization', 'Bearer token')
      .expect(200)
  })
})
```
---


## 完整示例

```typescript
import { Http, Response, HttpError, Router } from 'farrow-http'
import { ObjectType, String, Int, Optional } from 'farrow-schema'
import { createContext } from 'farrow-pipeline'

// 上下文定义
const AuthContext = createContext<{ userId: string; role: string } | null>(null)

// Schema 定义
class CreateUserInput extends ObjectType {
  name = String
  email = String
  age = Optional(Int)
}

class UpdateUserInput extends ObjectType {
  name = Optional(String)
  email = Optional(String)
  age = Optional(Int)
}

// 创建应用程序
const app = Http({
  basenames: ['/api'],
  logger: {
    ignoreIntrospectionRequestOfFarrowApi: true // 推荐，可清理 farrow-api 日志
  },
  contexts: () => {
    // 示例：为每个请求注入上下文
    // const RequestIdContext = createContext<string>('')
    // return {
    //   requestId: RequestIdContext.create(generateId())
    // }
    return {}
  },
  errorStack: process.env.NODE_ENV === 'development'
})

// 全局中间件
app.use(async (req, next) => {
  console.log(`${req.method} ${req.pathname}`)
  const start = Date.now()
  const response = await next(req)
  console.log(`耗时 ${Date.now() - start}ms`)
  return response
})

// 认证中间件
const authenticate = async (req: any, next: any) => {
  const token = req.headers?.authorization?.replace('Bearer ', '')
  if (!token) {
    throw new HttpError('需要授权', 401)
  }
  
  try {
    const payload = verifyToken(token)
    AuthContext.set(payload)
    return next(req)
  } catch {
    throw new HttpError('无效令牌', 401)
  }
}

// 基于角色的访问控制
const requireRole = (role: string) => async (req: any, next: any) => {
  const auth = AuthContext.get()
  if (!auth || auth.role !== role) {
    throw new HttpError('权限不足', 403)
  }
  return next(req)
}

// 全局错误处理器
app.use(async (req, next) => {
  try {
    return await next(req)
  } catch (error) {
    console.error('请求失败:', {
      method: req.method,
      url: req.pathname,
      error: error.message,
      stack: error.stack
    })

    if (error instanceof HttpError) {
      return Response.status(error.statusCode).json({
        error: error.message,
        type: 'http_error'
      })
    }
    
    return Response.status(500).json({
      error: '内部服务器错误',
      type: 'server_error'
    })
  }
})

// 健康检查
app.get('/health').use(() => {
  return Response.json({
    status: 'ok', 
    timestamp: Date.now(),
    version: '1.0.0'
  })
})

// 用户路由
app.get('/users/<id:int>').use((req) => {
  const user = getUserById(req.params.id)
  if (!user) {
    throw new HttpError('用户未找到', 404)
  }
  return Response.json(user)
})

app.post('/users', {
  body: CreateUserInput
}, {
  onSchemaError: (error, input, next) => {
    return Response.status(400).json({
      error: '验证失败',
      field: error.path?.join('.'),
      message: error.message,
      received: error.value
    })
  }
}).use(authenticate)
  .use((req) => {
    const user = createUser(req.body)
    return Response.status(201).json(user)
  })

app.put('/users/<id:int>', {
  body: UpdateUserInput
}).use(authenticate)
  .use((req) => {
    const userId = req.params.id
    const auth = AuthContext.assert()
    
    // 用户只能更新自己的资料，除非是管理员
    if (auth.userId !== userId.toString() && auth.role !== 'admin') {
      throw new HttpError('只能更新自己的资料', 403)
    }
    
    const updatedUser = updateUser(userId, req.body)
    return Response.json(updatedUser)
  })

// 静态文件
app.serve('/static', './public')
app.serve('/uploads', './storage/uploads')

// 管理员路由器
const adminRouter = Router()
adminRouter.use(authenticate)
adminRouter.use(requireRole('admin'))

adminRouter.get('/dashboard').use(() => {
  return Response.json({
    message: '管理员仪表板',
    stats: getAdminStats()
  })
})

adminRouter.delete('/users/<id:int>').use((req) => {
  deleteUser(req.params.id)
  return Response.status(204).empty()
})

app.route('/admin').use(adminRouter)

// 响应转换
app.capture('json', (body) => {
  return Response.json({
    ...body.value,
    timestamp: new Date().toISOString(),
    apiVersion: 'v1'
  })
})

// 启动服务器
const port = process.env.PORT || 3000
app.listen(port, () => {
  console.log(`服务器运行在 http://localhost:${port}`)
  console.log(`健康检查: http://localhost:${port}/api/health`)
})

// 导出用于测试
export { app }
```

