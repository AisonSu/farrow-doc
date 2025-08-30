# farrow-http API 参考

farrow-http 是一个强大的 HTTP 服务器和路由系统，提供类型安全的路由定义和请求处理能力。

## 安装

```bash
npm install farrow-http
```

## 核心 API

### Http(options?)

创建 HTTP 服务器实例。

```typescript
function Http(options?: HttpPipelineOptions): HttpPipeline

type HttpPipelineOptions = {
  basenames?: string[]                    // 基础路径列表
  body?: BodyOptions                      // 请求体解析选项
  cookie?: CookieOptions                  // Cookie 解析选项
  query?: QueryOptions                    // 查询参数解析选项
  contexts?: ContextFactory               // 上下文工厂函数
  logger?: boolean | HttpLoggerOptions    // 日志配置
  errorStack?: boolean                    // 是否显示错误堆栈
}
```

#### 示例用法

```typescript
import { Http } from 'farrow-http'

// 基本用法
const app = Http()

// 带配置的用法
const app = Http({
  basenames: ['/api', '/v1'],
  body: {
    limit: '10mb',
    encoding: 'utf8'
  },
  cookie: {
    decode: decodeURIComponent
  },
  query: {
    depth: 5,
    arrayLimit: 100
  },
  logger: {
    transporter: (str) => console.log(str),
    ignoreIntrospectionRequestOfFarrowApi: false
  },
  contexts: ({ req, requestInfo, basename }) => ({
    requestId: generateRequestId(),
    startTime: Date.now()
  })
})
```

### HttpPipeline 方法

#### handle() - 处理 HTTP 请求

处理 HTTP 请求，通常用于集成到其他框架。

```typescript
handle(req: IncomingMessage, res: ServerResponse, options?: HttpHandlerOptions): MaybeAsync<void>

type HttpHandlerOptions = {
  onLast?: CustomBodyHandler  // 当没有路由匹配时的自定义处理函数
}
```

**示例：**

```typescript
// 集成到 Express
expressApp.use((req, res) => {
  app.handle(req, res)
})
```

#### listen() - 启动服务器

启动 HTTP 服务器并监听指定端口。

```typescript
listen(...args: Parameters<Server['listen']>): Server
```

**示例：**

```typescript
// 监听端口
app.listen(3000)
app.listen(3000, 'localhost')
app.listen(3000, () => console.log('Server started'))

// 监听 Unix Socket
app.listen('/tmp/server.sock')
```

#### server() - 创建服务器实例

创建 HTTP 服务器但不启动监听。

```typescript
server(): Server
```

**示例：**

```typescript
const server = app.server()
server.listen(3000)

// 用于测试
import request from 'supertest'
const response = await request(app.server()).get('/')
```

## HTTPS 支持

### Https(options?)

创建 HTTPS 服务器实例。

```typescript
function Https(options?: HttpsPipelineOptions): HttpsPipeline

type HttpsPipelineOptions = HttpPipelineOptions & {
  tls?: HttpsOptions  // TLS/SSL 配置
}
```

**示例：**

```typescript
import { Https } from 'farrow-http'
import fs from 'fs'

const app = Https({
  tls: {
    key: fs.readFileSync('path/to/private-key.pem'),
    cert: fs.readFileSync('path/to/certificate.pem')
  }
})

app.listen(443)
```

## Response - 响应构建器

### 静态方法

#### Response.json() - JSON 响应

```typescript
static json(value: JsonType): Response
```

**示例：**

```typescript
return Response.json({ message: 'Success', data: [] })
return Response.json(null)
return Response.json(42)
```

#### Response.text() - 纯文本响应

```typescript
static text(value: string): Response
```

**示例：**

```typescript
return Response.text('Hello, World!')
```

#### Response.html() - HTML 响应

```typescript
static html(value: string): Response
```

**示例：**

```typescript
return Response.html('<h1>Welcome</h1>')
```

#### Response.redirect() - 重定向响应

```typescript
static redirect(url: string, options?: RedirectOptions): Response

type RedirectOptions = {
  usePrefix?: boolean  // 是否使用路径前缀，默认 true
}
```

**示例：**

```typescript
return Response.redirect('/login')
return Response.redirect('https://example.com')
return Response.redirect('/api/users', { usePrefix: false })
```

#### Response.file() - 文件响应

```typescript
static file(filename: string, options?: FileBodyOptions): Response
```

**示例：**

```typescript
return Response.file('./uploads/document.pdf')
return Response.file('./large-file.zip', { 
  start: 0, 
  end: 1024 * 1024 // 只读取前 1MB
})
```

#### Response.stream() - 流响应

```typescript
static stream(stream: Stream): Response
```

**示例：**

```typescript
import fs from 'fs'

return Response.stream(fs.createReadStream('./data.csv'))
```

#### Response.buffer() - 二进制响应

```typescript
static buffer(buffer: Buffer): Response
```

**示例：**

```typescript
const data = Buffer.from('binary data')
return Response.buffer(data)
```

#### Response.empty() - 空响应

```typescript
static empty(): Response
```

**示例：**

```typescript
return Response.empty()  // 204 No Content
```

#### Response.custom() - 自定义响应

```typescript
static custom(handler?: CustomBodyHandler): Response

type CustomBodyHandler = (params: {
  req: IncomingMessage
  res: ServerResponse
  requestInfo: RequestInfo
  responseInfo: Omit<ResponseInfo, 'body'>
}) => void
```

**示例：**

```typescript
return Response.custom(({ res }) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' })
  res.end('Custom response')
})
```

### 实例方法

#### status() - 设置状态码

```typescript
status(code: number, message?: string): Response
```

**示例：**

```typescript
return Response
  .json({ error: 'Not Found' })
  .status(404)
  .status(500, 'Internal Server Error')
```

#### header() / headers() - 设置响应头

```typescript
header(name: string, value: Value): Response
headers(headers: Headers): Response
```

**示例：**

```typescript
return Response
  .json(data)
  .header('Cache-Control', 'no-cache')
  .header('X-Request-ID', requestId)
  .headers({
    'Cache-Control': 'no-cache',
    'X-Request-ID': requestId,
    'X-API-Version': 'v1'
  })
```

#### cookie() / cookies() - 设置 Cookie

```typescript
cookie(name: string, value: Value | null, options?: CookieOptions): Response
cookies(cookies: Record<string, Value | null>, options?: CookieOptions): Response
```

**示例：**

```typescript
return Response
  .json(user)
  .cookie('sessionId', sessionId, {
    httpOnly: true,
    secure: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 小时
  })
  .cookie('oldCookie', null) // 删除 Cookie
  .cookies({
    sessionId: sessionId,
    theme: 'dark',
    oldSession: null // 删除
  }, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production'
  })
```

#### vary() - 设置 Vary 响应头

```typescript
vary(...fields: string[]): Response
```

**示例：**

```typescript
return Response
  .json(data)
  .vary('Accept-Encoding', 'User-Agent')
```

#### attachment() - 设置附件下载

```typescript
attachment(filename?: string, options?: ContentDispositionOptions): Response
```

**示例：**

```typescript
return Response
  .file('./report.pdf')
  .attachment('monthly-report.pdf')
```

#### merge() - 合并响应对象

```typescript
merge(...responses: Response[]): Response
```

**重要注意事项：**

合并时，后面的 `body` 会覆盖前面的 `body`：

```typescript
// 错误：text body 会被 empty body 覆盖
const result = Response.text('Hello').merge(Response.cookie('token', '123'))
// 结果：只有 cookie，没有 text 内容

// 正确：使用链式调用
const result = Response.text('Hello').cookie('token', '123')

// 正确：body 放在最后合并
const result = Response.merge(
  Response.cookie('token', '123'),
  Response.text('Hello')  // body 最后设置
)
```

## Router - 路由系统

### Router() - 创建路由器

```typescript
function Router(): RouterPipeline
```

**示例：**

```typescript
import { Router } from 'farrow-http'

const userRouter = Router()
const apiRouter = Router()
```

### RouterPipeline 方法

#### route() - 创建子路由

```typescript
route(name: string): Pipeline<RequestInfo, MaybeAsyncResponse>
```

**示例：**

```typescript
const app = Http()
const apiRouter = app.route('/api')
const v1Router = apiRouter.route('/v1')

v1Router.get('/users').use(() => Response.json(users))
// 实际路径: /api/v1/users
```

#### serve() - 静态文件服务

提供静态文件服务，自动处理目录遍历攻击防护，并支持 index.html 文件。

```typescript
serve(name: string, dirname: string): void
```

**特性：**
- 自动防止目录遍历攻击（路径规范化检查）
- 目录访问时自动查找 index.html
- 文件不存在时正确传递给下一个中间件

**示例：**

```typescript
app.serve('/static', './public')
app.serve('/uploads', './storage/uploads')

// 访问 /static/style.css 会返回 ./public/style.css
// 访问 /static/docs/ 会尝试返回 ./public/docs/index.html
```

#### capture() - 捕获响应体

```typescript
capture<T extends keyof BodyMap>(type: T, callback: (body: BodyMap[T]) => MaybeAsyncResponse): void
```

**示例：**

```typescript
// 捕获所有 JSON 响应并添加时间戳
app.capture('json', (body) => {
  return Response.json({
    ...body.value,
    timestamp: Date.now()
  })
})
```

## 路由匹配

### HTTP 方法快捷方式

支持所有标准 HTTP 方法，并支持 Template Literal Types 的 URL 模式，提供自动类型推导和运行时验证。

```typescript
get(url: string, schema?: RouterSharedSchema, options?: MatchOptions)
post(url: string, schema?: RouterSharedSchema, options?: MatchOptions)
put(url: string, schema?: RouterSharedSchema, options?: MatchOptions)
patch(url: string, schema?: RouterSharedSchema, options?: MatchOptions)
delete(url: string, schema?: RouterSharedSchema, options?: MatchOptions)
head(url: string, schema?: RouterSharedSchema, options?: MatchOptions)
options(url: string, schema?: RouterSharedSchema, options?: MatchOptions)
```

**示例：**

```typescript
// GET 请求
app.get('/users').use(() => Response.json(users))

// 带参数的路由
app.get('/users/<id:int>').use((request) => {
  return Response.json({ userId: request.params.id })
})

// 带查询参数
app.get('/search?<q:string>&<limit?:int>').use((request) => {
  const { q, limit = 10 } = request.query
  return Response.json(search(q, limit))
})

// 带额外验证
app.post('/users', {
  body: CreateUserSchema,
  headers: { 'content-type': Literal('application/json') }
}).use((request) => {
  return Response.status(201).json(createUser(request.body))
})
```

### URL Schema 语法

URL Schema 基于 farrow-schema，提供自动类型推导和运行时验证。

#### 路径参数

```typescript
// 基本类型（自动验证）
'<name:string>'     // string 类型，自动验证
'<id:int>'          // number 类型（整数），自动验证为整数
'<price:float>'     // number 类型（浮点数），自动验证为数字
'<id:number>'       // number 类型，自动验证为数字
'<active:boolean>'  // boolean 类型，自动验证为布尔值
'<userId:id>'       // string 类型（非空验证），自动验证非空

// 修饰符
'<name?:string>'    // 可选参数 (string | undefined)
'<tags+:string>'    // 一个或多个 (string[])
'<cats*:string>'    // 零个或多个 (string[] | undefined)

// 联合类型
'<type:product|service>'  // 'product' | 'service'
'<id:int|string>'         // number | string

// 字面量类型
'<status:{active}|{inactive}>'  // 'active' | 'inactive'
```

#### 查询参数

```typescript
// 在 ? 后面定义查询参数
'/search?<q:string>'              // 必需查询参数
'/search?<q:string>&<page?:int>'  // 可选查询参数
'/items?sort=name&<order:{asc}|{desc}>'  // 混合静态和动态参数
```

### match() - 详细路由匹配

```typescript
match<T extends RouterSchema>(schema: T, options?: MatchOptions)

type RouterRequestSchema = {
  pathname: string                    // 路径模式
  method?: string | string[]          // HTTP 方法
  params?: RouterSchemaDescriptor     // 路径参数验证
  query?: RouterSchemaDescriptor      // 查询参数验证
  body?: Schema.FieldDescriptor       // 请求体验证
  headers?: RouterSchemaDescriptor    // 请求头验证
  cookies?: RouterSchemaDescriptor    // Cookie 验证
}

type RouterUrlSchema = {
  url: string                         // URL 模式（支持 Template Literal Types）
  method?: string | string[]          // HTTP 方法
  body?: Schema.FieldDescriptor       // 请求体验证
  headers?: RouterSchemaDescriptor    // 请求头验证
  cookies?: RouterSchemaDescriptor    // Cookie 验证
}

type MatchOptions = {
  block?: boolean                     // 是否阻塞未匹配的请求
  onSchemaError?(                     // 验证错误处理函数
    error: ValidationError,
    input: RequestInfo,
    next: Next
  ): MaybeAsyncResponse | void
}
```

#### ValidationError 详细结构

验证错误对象包含详细的错误信息：

```typescript
interface ValidationError {
  message: string                     // 错误描述信息
  path?: (string | number)[]          // 错误字段路径（如 ['body', 'name']）
  value?: any                         // 导致错误的值
  schema?: any                        // 相关的 Schema 定义
}
```

**示例：**

```typescript
app.post('/users', {
  body: { 
    name: String, 
    age: Number,
    profile: {
      email: String
    }
  }
}, {
  onSchemaError: (error, input, next) => {
    console.log('错误字段路径:', error.path)     // ['body', 'profile', 'email']
    console.log('用户输入值:', error.value)      // 用户实际输入的值
    console.log('错误描述:', error.message)      // 详细错误信息
    
    // 返回用户友好的错误信息
    return Response.status(400).json({
      error: '数据验证失败',
      field: error.path?.join('.'),           // 'body.profile.email'
      message: error.message,
      received: error.value,
      hint: '请检查输入格式是否正确'
    })
  }
}).use((request) => {
  // request.body 已经过验证且类型安全
  return Response.status(201).json(createUser(request.body))
})
```

## 中间件系统

### 中间件类型定义

```typescript
type Middleware<I, O> = (input: I, next: Next<I, O>) => O
type Next<I, O> = (input?: I) => O
type HttpMiddleware = Middleware<RequestInfo, MaybeAsyncResponse>
type MaybeAsyncResponse = Response | Promise<Response>
```

**重要：** 中间件必须返回 Response 对象，这是 farrow-http 的核心设计原则之一。

### use() - 添加中间件

```typescript
use(middleware: HttpMiddleware): void
```

**示例：**

```typescript
// 日志中间件
app.use((request, next) => {
  console.log(`${request.method} ${request.pathname}`)
  return next(request)
})

// 认证中间件
app.use((request, next) => {
  const token = request.headers?.authorization
  
  if (!isValidToken(token)) {
    return Response.status(401).json({ error: 'Unauthorized' })
  }
  
  return next(request)
})

// 错误处理中间件
app.use((request, next) => {
  try {
    return next(request)
  } catch (error) {
    console.error(error)
    return Response.status(500).json({ error: 'Internal Server Error' })
  }
})
```

### 异步中间件

```typescript
// 异步中间件
app.use(async (request, next) => {
  const user = await authenticateUser(request)
  UserContext.set(user)
  return next(request)
})

// 处理 Promise
app.use((request, next) => {
  const result = next(request)
  
  if (result instanceof Promise) {
    return result.then(response => {
      return response.header('X-Processed-At', Date.now().toString())
    })
  }
  
  return result.header('X-Processed-At', Date.now().toString())
})
```

## Context Hooks

farrow-http 使用 farrow-pipeline 的 Context 系统。

### useRequest() / useResponse()

获取 Node.js 原始请求/响应对象（可能为 null）。

```typescript
function useRequest(): IncomingMessage | null
function useResponse(): ServerResponse | null
```

**示例：**

```typescript
app.use(() => {
  const req = useRequest()
  const res = useResponse()
  
  if (req && res) {
    console.log(req.method, req.url)
    res.setHeader('X-Custom', 'value')
  }
  
  return Response.text('OK')
})
```

### useReq() / useRes()

获取 Node.js 原始请求/响应对象。如果对象不存在会抛出错误。

```typescript
function useReq(): IncomingMessage
function useRes(): ServerResponse
```

### useRequestInfo()

获取当前请求信息。

```typescript
function useRequestInfo(): RequestInfo
```

**示例：**

```typescript
app.use(() => {
  const request = useRequestInfo()
  
  console.log({
    pathname: request.pathname,
    method: request.method,
    query: request.query
  })
  
  return Response.text('OK')
})
```

### useBasenames() / usePrefix()

获取当前路由的基础路径和完整前缀。

```typescript
function useBasenames(): string[]
function usePrefix(): string
```

**示例：**

```typescript
const app = Http({ basenames: ['/api'] })
const v1Router = app.route('/v1')
const userRouter = v1Router.route('/users')

userRouter.get('/').use(() => {
  const basenames = useBasenames()
  // ['/api', '/v1', '/users']
  
  const prefix = usePrefix()
  // '/api/v1'
  
  return Response.json({ basenames, prefix })
})
```

## 错误处理

### HttpError 类

```typescript
class HttpError extends Error {
  constructor(message: string, public statusCode: number = 500)
  statusCode: number
}
```

**示例：**

```typescript
import { HttpError } from 'farrow-http'

app.use((request, next) => {
  if (!isValidRequest(request)) {
    throw new HttpError('Bad Request', 400)
  }
  
  return next(request)
})

// 自定义错误
class AuthenticationError extends HttpError {
  constructor(message = 'Authentication required') {
    super(message, 401)
  }
}

app.use((request, next) => {
  if (!isAuthenticated(request)) {
    throw new AuthenticationError()
  }
  
  return next(request)
})
```

## 类型定义

### 核心类型

#### RequestInfo

```typescript
type RequestInfo = {
  readonly pathname: string
  readonly method?: string
  readonly query?: RequestQuery
  readonly body?: any
  readonly headers?: RequestHeaders
  readonly cookies?: RequestCookies
}

type RequestQuery = { readonly [key: string]: any }
type RequestHeaders = { readonly [key: string]: any }
type RequestCookies = { readonly [key: string]: any }
```

#### ResponseInfo

```typescript
type ResponseInfo = {
  status?: Status
  headers?: Headers
  cookies?: Cookies
  body?: Body
  vary?: string[]
}

type Status = {
  code: number
  message?: string
}

type Headers = { [key: string]: Value }
type Value = string | number

type Cookies = {
  [key: string]: {
    value: Value | null
    options?: CookieOptions
  }
}
```

#### Body Types

```typescript
type Body = 
  | EmptyBody 
  | StringBody 
  | JsonBody 
  | StreamBody 
  | BufferBody 
  | FileBody 
  | CustomBody 
  | RedirectBody

type EmptyBody = { type: 'empty'; value: null }
type StringBody = { type: 'string'; value: string }
type JsonBody = { type: 'json'; value: JsonType }
type StreamBody = { type: 'stream'; value: Stream }
type BufferBody = { type: 'buffer'; value: Buffer }
type RedirectBody = { type: 'redirect'; value: string; usePrefix: boolean }
type FileBody = { type: 'file'; value: string; options?: FileBodyOptions }
type CustomBody = { type: 'custom'; handler: CustomBodyHandler }
```

### 工具类型

#### TypeOfRequestSchema

```typescript
// 从 RouterRequestSchema 提取 TypeScript 类型
type TypeOfRequestSchema<T extends RouterRequestSchema> = {
  readonly [K in keyof T]: TypeOfRouterRequestField<T[K]>
}
```

#### TypeOfUrlSchema

```typescript
// 从 RouterUrlSchema 提取 TypeScript 类型
type TypeOfUrlSchema<T extends RouterUrlSchema> = ParseUrl<T['url']> & {
  readonly [K in keyof Omit<T, 'url'>]: TypeOfRouterRequestField<Omit<T, 'url'>[K]>
}
```

### 常用接口

#### CookieOptions

```typescript
interface CookieOptions {
  domain?: string
  encode?: (val: string) => string
  expires?: Date
  httpOnly?: boolean
  maxAge?: number
  path?: string
  priority?: 'low' | 'medium' | 'high'
  sameSite?: boolean | 'lax' | 'strict' | 'none'
  secure?: boolean
  signed?: boolean
}
```

## 完整示例

```typescript
import { Http, Response, Router, HttpError } from 'farrow-http'
import { ObjectType, String, Number } from 'farrow-schema'
import { createContext } from 'farrow-pipeline'

// Schema
class User extends ObjectType {
  id = Number
  name = String
  email = String
}

// Context
const UserContext = createContext<User | null>(null)

// 中间件
const authenticate = (request, next) => {
  const token = request.headers?.authorization
  if (!token) {
    return Response.status(401).json({ error: 'Unauthorized' })
  }
  
  const user = verifyToken(token)
  UserContext.set(user)
  return next(request)
}

// 创建应用
const app = Http()

// 全局中间件
app.use((request, next) => {
  console.log(`${request.method} ${request.pathname}`)
  return next(request)
})

// 公开路由
app.get('/').use(() => {
  return Response.json({ message: 'Welcome to API' })
})

// 用户路由
const userRouter = Router()

userRouter.get('/').use(() => {
  return Response.json(getAllUsers())
})

userRouter.get('/<id:int>').use((request) => {
  const user = getUser(request.params.id)
  if (!user) {
    throw new HttpError('User not found', 404)
  }
  return Response.json(user)
})

userRouter.post('/', {
  body: User
}).use((request) => {
  const user = createUser(request.body)
  return Response
    .status(201)
    .json(user)
    .header('Location', `/api/users/${user.id}`)
})

// 受保护的路由
app.use('/api/*', authenticate)
app.route('/api/users').use(userRouter)

// 错误处理
app.use((request, next) => {
  try {
    return next(request)
  } catch (error) {
    if (error instanceof HttpError) {
      return Response.status(error.status).json({
        error: error.message
      })
    }
    return Response.status(500).json({
      error: 'Internal server error'
    })
  }
})

// 启动服务器
app.listen(3000, () => {
  console.log('Server running on http://localhost:3000')
})
```

## 最佳实践

### 1. 结构化路由

```typescript
// 推荐：模块化路由
const userRouter = Router()
const postRouter = Router()
const adminRouter = Router()

// 明确的路由挂载
app.route('/api/users').use(userRouter)
app.route('/api/posts').use(postRouter)
app.route('/admin').use(adminRouter)
```

### 2. 安全最佳实践

```typescript
// 推荐：安全的中间件配置
app.use((request, next) => {
  // CORS 头部
  const response = next(request)
  return response
    .header('Access-Control-Allow-Origin', 'https://yourdomain.com')
    .header('X-Content-Type-Options', 'nosniff')
    .header('X-Frame-Options', 'DENY')
    .header('X-XSS-Protection', '1; mode=block')
})
```

### 3. 性能优化

```typescript
// 推荐：响应压缩和缓存
app.use((request, next) => {
  const response = next(request)
  
  // 设置缓存策略
  if (request.pathname.startsWith('/static/')) {
    return response.header('Cache-Control', 'public, max-age=31536000')
  }
  
  return response
})
```

恭喜！您已经掌握了 farrow-http 的完整 API。现在可以构建强大、类型安全的 HTTP 应用了！