# Farrow 深度教程

> 深入掌握 Farrow 框架的高级特性和 API

## 概述

本教程将深入介绍 Farrow 框架的高级功能和 API，帮助你充分利用框架的能力。

**学习目标：**
- 掌握 farrow-pipeline 的高级 API
- 了解 farrow-schema 的扩展功能  
- 熟悉 farrow-http 的完整特性
- 理解各模块的设计思路

## 目录

### farrow-pipeline 高级特性
- [Container：理解上下文隔离](#container理解上下文隔离)
- [usePipeline：保持 Container 继承](#usepipeline保持-container-继承)
- [AsyncPipeline.useLazy：延迟加载](#asyncpipelineuselazy延迟加载)

### farrow-schema 高级特性
- [Validator.validate：手动验证](#validatorvalidate手动验证)
- [ValidatorType：自定义验证器](#validatortype自定义验证器)

### farrow-http 高级特性
- [Response.capture：全局响应拦截](#responsecapture全局响应拦截)
- [Response.custom：底层响应控制](#responsecustom底层响应控制)
- [Http 构造选项：高级配置](#http-构造选项高级配置)
- [Router 高级特性](#router-高级特性)
- [错误边界与错误恢复](#错误边界与错误恢复)
- [高级中间件模式](#高级中间件模式)

---

## farrow-pipeline 高级特性

### Container：理解上下文隔离

在深入了解 `usePipeline` 之前，我们需要理解 Farrow 的 Container 概念。

#### 什么是 Container？

Container（容器）是 Farrow 用来管理 Context 存储和隔离的内部机制。每次调用 `pipeline.run()` 时，都会创建一个新的 Container，其中包含了该次执行的所有 Context 状态。

```typescript
import { createPipeline, createContext } from 'farrow-pipeline'

const UserContext = createContext<{ name: string } | null>(null)

const pipeline = createPipeline<void, string>()

pipeline.use((input, next) => {
  UserContext.set({ name: '张三' })
  console.log('设置用户:', UserContext.get()) // { name: '张三' }
  return next('处理完成')
})

// 每次 run 都创建新的 Container
pipeline.run() // Container A: UserContext = { name: '张三' }
pipeline.run() // Container B: UserContext = { name: '张三' }（独立的容器）
```

#### Container 的隔离特性

不同的 Pipeline 执行之间是完全隔离的：

```typescript
const pipeline1 = createPipeline<void, void>()
const pipeline2 = createPipeline<void, void>()

pipeline1.use((input, next) => {
  UserContext.set({ name: 'Alice' })
  console.log('Pipeline1 用户:', UserContext.get()) // { name: 'Alice' }
  return next()
})

pipeline2.use((input, next) => {
  console.log('Pipeline2 用户:', UserContext.get()) // null（不同的 Container）
  return next()
})

pipeline1.run() // 在 Container A 中执行
pipeline2.run() // 在 Container B 中执行，无法访问 Container A 的状态
```

### usePipeline：保持 Container 继承

现在我们理解了 Container 隔离的问题，`usePipeline` 的意义就很明确了：它允许子 Pipeline 继承当前的 Container，而不是创建新的。

#### 问题演示：为什么需要 usePipeline？

```typescript
const UserContext = createContext<{ id: string } | null>(null)

const authPipeline = createPipeline<{ token: string }, { userId: string }>()
authPipeline.use((input, next) => {
  const userId = validateToken(input.token)
  UserContext.set({ id: userId }) // 设置用户上下文
  return next({ userId })
})

const dataPipeline = createPipeline<{ userId: string }, { data: any }>()
dataPipeline.use((input, next) => {
  const user = UserContext.get() // 尝试获取用户上下文
  console.log('当前用户:', user) // 这里会输出什么？
  return next({ data: 'some data' })
})

const mainPipeline = createPipeline<{ token: string }, { data: any }>()

// ❌ 错误方式：直接调用 run()
mainPipeline.use((input, next) => {
  const authResult = authPipeline.run(input)    // 创建新 Container A
  const dataResult = dataPipeline.run(authResult) // 创建新 Container B
  
  // dataPipeline 中的 UserContext.get() 返回 null！
  // 因为 Container B 中没有 UserContext 的状态
  
  return next(dataResult)
})
```

#### usePipeline 的解决方案

```typescript
// ✅ 正确方式：使用 usePipeline
mainPipeline.use((input, next) => {
  const runAuth = usePipeline(authPipeline)  // 继承当前 Container
  const runData = usePipeline(dataPipeline)  // 继承当前 Container
  
  const authResult = runAuth(input)    // 在当前 Container 中执行
  const dataResult = runData(authResult) // 在同一 Container 中执行
  
  // dataPipeline 中的 UserContext.get() 能正确获取到用户信息！
  
  return next(dataResult)
})

// 完整示例
const completeExample = createPipeline<{ token: string }, string>()
completeExample.use((input, next) => {
  console.log('主流程开始')
  
  const runAuth = usePipeline(authPipeline)
  const runData = usePipeline(dataPipeline)
  
  try {
    const authResult = runAuth(input)
    console.log('认证完成，用户ID:', authResult.userId)
    
    const dataResult = runData(authResult)
    console.log('数据获取完成')
    
    return next('处理成功')
  } catch (error) {
    return next('处理失败: ' + error.message)
  }
})
```

### Container：手动创建和管理

除了自动创建的 Container，你也可以手动创建和管理 Container。

#### 创建和使用 Container

```typescript
import { createContainer, createContext } from 'farrow-pipeline'

const DatabaseContext = createContext<Database>(defaultDB)
const ConfigContext = createContext<Config>(defaultConfig)

// 创建专用容器
const testContainer = createContainer({
  db: DatabaseContext.create(mockDatabase),
  config: ConfigContext.create(testConfig)
})

// 在特定容器中运行
const result = pipeline.run(input, { container: testContainer })
```

#### 多环境配置示例

```typescript
const environments = {
  development: createContainer({
    db: DatabaseContext.create(devDB),
    config: ConfigContext.create(devConfig)
  }),
  production: createContainer({
    db: DatabaseContext.create(prodDB),
    config: ConfigContext.create(prodConfig)
  }),
  test: createContainer({
    db: DatabaseContext.create(mockDB),
    config: ConfigContext.create(testConfig)
  })
}

const currentContainer = environments[process.env.NODE_ENV] || environments.development
const result = pipeline.run(input, { container: currentContainer })
```

### AsyncPipeline.useLazy：延迟加载

`useLazy` 允许延迟加载中间件，适用于条件性或重型依赖。

```typescript
import { createAsyncPipeline } from 'farrow-pipeline'

const pipeline = createAsyncPipeline<Request, Response>()

// 延迟加载中间件
pipeline.useLazy(async () => {
  // 只有在实际需要时才加载
  const heavyLibrary = await import('heavy-library')
  
  return async (input, next) => {
    if (shouldUseHeavyLibrary(input)) {
      const result = await heavyLibrary.process(input)
      return { ...input, processed: result }
    }
    return next(input)
  }
})

// 条件性加载
pipeline.useLazy(async () => {
  const feature = await getFeatureFlag('advanced-processing')
  
  if (feature.enabled) {
    const processor = await import('./advanced-processor')
    return processor.middleware
  }
  
  // 返回透传中间件
  return (input, next) => next(input)
})
```

---

## farrow-schema 高级特性

### Validator.validate：手动验证

除了自动验证外，可以手动使用 Validator 进行数据验证。

```typescript
import { Validator } from 'farrow-schema/validator'
import { ObjectType, String, Number } from 'farrow-schema'

class User extends ObjectType {
  name = String
  age = Number
}

// 手动验证
const result = Validator.validate(User, {
  name: "张三",
  age: 25
})

if (result.isOk) {
  console.log('验证成功:', result.value)
} else {
  console.log('验证失败:', result.value.message)
}
```

#### 批量验证

```typescript
function validateBatch<T>(schema: any, dataList: unknown[]): {
  valid: T[]
  invalid: Array<{ index: number, error: string, data: unknown }>
} {
  const results = dataList.map((data, index) => ({
    index,
    data,
    result: Validator.validate(schema, data)
  }))
  
  return {
    valid: results.filter(r => r.result.isOk).map(r => r.result.value),
    invalid: results.filter(r => r.result.isErr).map(r => ({
      index: r.index,
      error: r.result.value.message,
      data: r.data
    }))
  }
}
```

### ValidatorType：自定义验证器

创建自定义验证逻辑的验证器。

```typescript
import { ValidatorType, Validator } from 'farrow-schema/validator'

class EmailType extends ValidatorType<string> {
  validate(input: unknown) {
    const stringResult = Validator.validate(String, input)
    if (stringResult.isErr) {
      return this.Err('必须是字符串')
    }
    
    const email = stringResult.value
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    
    if (!emailRegex.test(email)) {
      return this.Err('邮箱格式不正确')
    }
    
    return this.Ok(email)
  }
}

// 使用自定义验证器
class UserSchema extends ObjectType {
  email = new EmailType()
  name = String
}
```

#### 参数化验证器

```typescript
class StringLengthType extends ValidatorType<string> {
  constructor(private min: number, private max: number) {
    super()
  }
  
  validate(input: unknown) {
    const result = Validator.validate(String, input)
    if (result.isErr) return result
    
    const str = result.value
    if (str.length < this.min || str.length > this.max) {
      return this.Err(`长度必须在 ${this.min}-${this.max} 之间`)
    }
    
    return this.Ok(str)
  }
}

// 工厂函数
const StringLength = (min: number, max: number) => new StringLengthType(min, max)

class Article extends ObjectType {
  title = StringLength(5, 100)
  content = StringLength(50, 5000)
}
```

---

## farrow-http 高级特性

### Response.capture：全局响应拦截

`capture` 允许你拦截和转换特定类型的响应，实现全局的响应格式统一。

#### 基本响应拦截

```typescript
import { Http, Response } from 'farrow-http'

const app = Http()

// 拦截所有 JSON 响应，统一格式
app.capture('json', (jsonBody) => {
  return Response.json({
    success: true,
    data: jsonBody.value,
    timestamp: new Date().toISOString(),
    version: 'v1'
  })
})

// 现在所有的 JSON 响应都会被自动包装
app.get('/users').use(() => {
  return Response.json({ users: ['Alice', 'Bob'] })
  // 实际响应：
  // {
  //   "success": true,
  //   "data": { "users": ["Alice", "Bob"] },
  //   "timestamp": "2024-01-01T00:00:00.000Z",
  //   "version": "v1"
  // }
})
```

#### 多种响应类型拦截

```typescript
// 拦截文件响应，添加缓存头
app.capture('file', (fileBody) => {
  return Response.file(fileBody.value, fileBody.options)
    .header('Cache-Control', 'public, max-age=31536000')
    .header('X-Served-By', 'Farrow-HTTP')
})

// 拦截 HTML 响应，注入安全头
app.capture('html', (htmlBody) => {
  return Response.html(htmlBody.value)
    .header('X-Content-Type-Options', 'nosniff')
    .header('X-Frame-Options', 'DENY')
    .header('Content-Security-Policy', "default-src 'self'")
})

// 拦截文本响应
app.capture('text', (textBody) => {
  return Response.text(textBody.value)
    .header('X-Content-Type', 'text/plain')
})

// 拦截重定向响应
app.capture('redirect', (redirectBody) => {
  return Response.redirect(redirectBody.url, redirectBody.options)
    .header('X-Redirect-Reason', 'API-Redirect')
})
```

### Response.custom：底层响应控制

`Response.custom` 提供了对 Node.js 原生 `req` 和 `res` 对象的直接访问，用于实现标准响应类型无法满足的需求。

#### Server-Sent Events (SSE) 实现

```typescript
app.get('/events').use(() => {
  return Response.custom(({ req, res }) => {
    // 设置 SSE 响应头
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*'
    })
    
    // 发送初始连接事件
    res.write('event: connected\n')
    res.write(`data: ${JSON.stringify({ time: Date.now() })}\n\n`)
    
    // 定时发送数据
    const interval = setInterval(() => {
      res.write('event: heartbeat\n')
      res.write(`data: ${JSON.stringify({ time: Date.now() })}\n\n`)
    }, 1000)
    
    // 清理连接
    req.on('close', () => {
      clearInterval(interval)
      console.log('SSE connection closed')
    })
    
    req.on('error', (err) => {
      console.error('SSE error:', err)
      clearInterval(interval)
    })
  })
})
```

#### 长轮询实现

```typescript
const pendingRequests = new Map()

app.get('/poll/<channelId:string>').use((request) => {
  const { channelId } = request.params
  const timeout = parseInt(request.query.timeout) || 30000
  
  return Response.custom(({ req, res }) => {
    const requestId = Math.random().toString(36)
    
    // 检查是否有立即可用的数据
    const immediateData = checkForData(channelId)
    if (immediateData) {
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ data: immediateData }))
      return
    }
    
    // 保存待处理的请求
    pendingRequests.set(requestId, { res, channelId })
    
    // 设置超时
    const timer = setTimeout(() => {
      pendingRequests.delete(requestId)
      res.writeHead(204) // No Content
      res.end()
    }, timeout)
    
    // 客户端断开连接时清理
    req.on('close', () => {
      clearTimeout(timer)
      pendingRequests.delete(requestId)
    })
  })
})

// 当有新数据时通知所有等待的请求
function notifyChannel(channelId: string, data: any) {
  for (const [requestId, { res, channelId: reqChannelId }] of pendingRequests) {
    if (reqChannelId === channelId) {
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ data }))
      pendingRequests.delete(requestId)
    }
  }
}
```

#### 分块传输实现

```typescript
app.get('/large-data').use(() => {
  return Response.custom(({ req, res }) => {
    res.writeHead(200, {
      'Content-Type': 'application/json',
      'Transfer-Encoding': 'chunked'
    })
    
    // 开始 JSON 数组
    res.write('{"items":[')
    
    let first = true
    const totalItems = 10000
    
    // 分批处理大量数据
    function sendBatch(startIndex: number) {
      const batchSize = 100
      const endIndex = Math.min(startIndex + batchSize, totalItems)
      
      for (let i = startIndex; i < endIndex; i++) {
        if (!first) res.write(',')
        first = false
        
        res.write(JSON.stringify({
          id: i,
          data: `Item ${i}`,
          timestamp: Date.now()
        }))
      }
      
      if (endIndex < totalItems) {
        // 异步处理下一批
        setImmediate(() => sendBatch(endIndex))
      } else {
        // 结束 JSON 数组
        res.write(']}')
        res.end()
      }
    }
    
    sendBatch(0)
  })
})
```

### Http 构造选项：高级配置

#### basenames：路由前缀

```typescript
// 支持多个 basename
const app = Http({
  basenames: ['/api', '/v1', '/app']
})

// 这个路由会匹配多个路径：
// /api/users, /v1/users, /app/users
app.get('/users').use(() => Response.json({ users: [] }))
```

#### logger：自定义日志

```typescript
const app = Http({
  logger: false  // 禁用默认日志
})

// 或者自定义日志
const app = Http({
  logger: {
    info: (message) => console.log(`INFO: ${message}`),
    warn: (message) => console.warn(`WARN: ${message}`),
    error: (message) => console.error(`ERROR: ${message}`)
  }
})
```

### Router 高级特性

#### Router.match：模式匹配

```typescript
import { Router } from 'farrow-http'
import { String, Literal } from 'farrow-schema'

const router = Router()

// 使用 match 进行复杂匹配
router.match({
  url: '/admin/<path+:string>',  // 一个或多个路径段
  method: ['GET', 'POST']  // 只匹配 GET 和 POST
}).use((request, next) => {
  // 管理员路由的预处理
  const user = UserContext.get()
  if (!user || user.role !== 'admin') {
    return Response.status(403).json({ error: 'Admin required' })
  }
  
  // 可以访问路径参数
  const adminPath = request.params.path  // string[] 类型
  console.log('Admin accessing:', adminPath.join('/'))
  
  return next(request)
})

// 复杂匹配条件 - headers 使用 Schema
router.match({
  url: '/api/<segments*:string>',  // 零个或多个路径段
  headers: {
    'content-type': Literal('application/json')  // 使用 Schema 定义
  }
}).use((request, next) => {
  // 只处理 JSON 请求
  const apiSegments = request.params.segments  // string[] | undefined 类型
  console.log('API path segments:', apiSegments)
  
  return next(request)
})

// 更复杂的匹配示例
router.match({
  url: '/api/<version:string>/users',  // 匹配任意版本路径段
  method: ['POST', 'PUT'],
  headers: {
    'authorization': String,  // 必需的认证头
    'content-type': Literal('application/json')
  },
  body: {
    name: String,
    email: String
  }
}).use((request, next) => {
  // 所有条件都满足才会执行到这里
  const { version } = request.params  // string 类型
  const { authorization } = request.headers
  const { name, email } = request.body
  
  console.log('API version:', version)
  return next(request)
})

// 如果需要匹配特定版本值，使用 Literal 联合类型
router.post('/api/<version:v1|v2>/users', {
  headers: {
    'authorization': String,
    'content-type': Literal('application/json')
  },
  body: {
    name: String,
    email: String
  }
}).use((request, next) => {
  // 这里可以获取类型安全的路由参数
  const { version } = request.params  // 'v1' | 'v2' 类型
  const { authorization } = request.headers
  const { name, email } = request.body
  
  return next(request)
})
```

#### Router.use 的高级用法

```typescript
const router = Router()

// 路径匹配的中间件
router.use('/public/<path*:string>', (request, next) => {
  // 只对 /public/* 路径生效的中间件
  return next(request)
})

// 方法过滤 - 在中间件内部判断
router.use((request, next) => {
  // 只对写操作生效的中间件
  if (request.method === 'POST' || request.method === 'PUT' || request.method === 'PATCH') {
    // 执行写操作相关的逻辑
    console.log('Processing write operation:', request.method)
  }
  return next(request)
})

// 组合条件 - 使用 match 进行复合匹配
router.match({
  url: '/api/v2/<path*:string>',
  method: 'POST',
  headers: { 'authorization': String }
}).use((request, next) => {
  // 复合条件匹配
  return next(request)
})
```

### 错误边界与错误恢复

#### onSchemaError：Schema 错误处理

```typescript
// 全局 Schema 错误处理
app.match({
  url: '/<path*:string>'  // 匹配所有路径
}, {
  onSchemaError: (error, request, next) => {
    console.error('Schema validation failed:', error)
    
    return Response.status(400).json({
      error: 'Validation Error',
      details: {
        path: error.path?.join('.'),
        message: error.message,
        received: typeof error.value
      }
    })
  }
})

// 特定路由的 Schema 错误处理
app.post('/users', {
  body: { email: String, password: String }
}, {
  onSchemaError: (error, request, next) => {
    if (error.path?.includes('email')) {
      return Response.status(400).json({
        error: 'Invalid email address'
      })
    }
    
    if (error.path?.includes('password')) {
      return Response.status(400).json({
        error: 'Password is required'
      })
    }
    
    return Response.status(400).json({
      error: 'Invalid request data'
    })
  }
}).use((request) => {
  // 处理有效请求
  return Response.json({ success: true })
})
```

### 高级中间件模式

#### 条件中间件

```typescript
const conditionalMiddleware = (condition: (req: any) => boolean, middleware: any) => {
  return (request, next) => {
    if (condition(request)) {
      return middleware(request, next)
    }
    return next(request)
  }
}

// 使用示例
app.use(
  conditionalMiddleware(
    req => req.method === 'POST',
    rateLimitMiddleware
  )
)

app.use(
  conditionalMiddleware(
    req => req.headers['x-debug'] === 'true',
    debugMiddleware
  )
)
```

#### 异步中间件组合

```typescript
const asyncMiddleware = (...middlewares) => {
  return async (request, next) => {
    // 顺序执行异步中间件
    let modifiedRequest = request
    
    for (const middleware of middlewares) {
      const result = await middleware(modifiedRequest, (req) => req)
      modifiedRequest = result
    }
    
    return next(modifiedRequest)
  }
}

// 使用
app.use(asyncMiddleware(
  loadUserMiddleware,
  loadPermissionsMiddleware,
  loadPreferencesMiddleware
))
```

---

## 总结

本教程介绍了 Farrow 框架的主要高级特性：

### farrow-pipeline
- **usePipeline**: 保持上下文的 Pipeline 组合
- **Container**: 上下文隔离和管理
- **useLazy**: 延迟加载中间件

### farrow-schema
- **Validator.validate**: 手动数据验证
- **ValidatorType**: 自定义验证器

### farrow-http
- **Response.capture**: 响应类型拦截
- **Response.custom**: 底层响应控制
- **Router.route**: 嵌套路由

这些特性为构建复杂应用提供了强大的基础能力。

---

## 下一步

📚 **[API 参考](/api/)**  
查阅完整的 API 文档

🚀 **[实战示例](/examples/)**  
通过具体项目学习实践技巧