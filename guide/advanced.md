# Farrow 深度教程

> 探索 Farrow 框架的高级特性与深层用法

## 概述

在掌握了 Farrow 的基础用法后，本教程将带你深入了解框架的高级特性。我们将学习：

- farrow-pipeline：Pipeline 组合、Context 隔离、延迟加载
- farrow-schema：手动验证、自定义验证器、Schema 转换
- farrow-http：响应拦截、自定义响应、响应合并

---

## farrow-pipeline 高级特性

### usePipeline - Pipeline 的组合与复用

`usePipeline` 允许你在一个 Pipeline 的中间件中调用另一个 Pipeline，实现模块化和复用。

#### 基础用法

```typescript
import { createPipeline, usePipeline } from 'farrow-pipeline'

// 创建独立的 Pipeline
const validationPipeline = createPipeline<UserInput, ValidatedUser>()
validationPipeline.use((input, next) => {
  if (!input.email?.includes('@')) {
    throw new Error('Invalid email')
  }
  return next({ ...input, validated: true })
})

const transformPipeline = createPipeline<ValidatedUser, ProcessedUser>()
transformPipeline.use((input, next) => {
  return next({
    ...input,
    email: input.email.toLowerCase(),
    createdAt: new Date()
  })
})

// 主 Pipeline 组合其他 Pipeline
const mainPipeline = createPipeline<UserInput, Result>()
mainPipeline.use((input, next) => {
  // 使用 usePipeline 获取可调用的函数
  const validate = usePipeline(validationPipeline)
  const transform = usePipeline(transformPipeline)
  
  try {
    const validated = validate(input)
    const processed = transform(validated)
    return next({ success: true, data: processed })
  } catch (error) {
    return { success: false, error: error.message }
  }
})
```

#### 条件性 Pipeline 执行

```typescript
const processingPipeline = createPipeline<Request, Response>()

processingPipeline.use((request, next) => {
  // 根据条件选择不同的处理流程
  const pipeline = request.type === 'batch' 
    ? usePipeline(batchPipeline)
    : usePipeline(singlePipeline)
  
  const result = pipeline(request.data)
  return next(result)
})
```

### Container 与 runWithContainer - 上下文隔离

Container 提供了请求级的上下文隔离，确保并发请求之间的数据不会相互干扰。

#### 创建隔离的执行环境

```typescript
import { createContainer, runWithContainer, createContext } from 'farrow-pipeline'

// 定义 Context
const UserContext = createContext<User | null>(null)
const DatabaseContext = createContext<Database | null>(null)
const LoggerContext = createContext<Logger>(defaultLogger)

// 为每个请求创建独立的执行环境
function handleRequest(requestData: RequestData) {
  // 创建请求专属的 Container
  const container = createContainer({
    [UserContext]: requestData.user,
    [DatabaseContext]: createDatabaseConnection(requestData.tenantId),
    [LoggerContext]: createLogger(requestData.requestId)
  })
  
  // 在 Container 环境中执行业务逻辑
  return runWithContainer(() => {
    // 这里的所有 Context 访问都是隔离的
    const user = UserContext.get()
    const db = DatabaseContext.get()
    const logger = LoggerContext.get()
    
    logger.info(`Processing request for user: ${user?.id}`)
    return processBusinessLogic(db, user)
  }, container)
}
```

#### 嵌套 Container

```typescript
const parentPipeline = createPipeline<Input, Output>()

parentPipeline.use((input, next) => {
  // 父级设置
  ConfigContext.set({ env: 'production' })
  
  // 创建子 Container，继承并扩展父级环境
  const childContainer = createContainer({
    [ConfigContext]: { ...ConfigContext.get(), feature: 'enabled' }
  })
  
  // 在子 Container 中运行，修改不影响父级
  const result = runWithContainer(() => {
    return processInIsolation(input)
  }, childContainer)
  
  return next(result)
})
```

### AsyncPipeline.useLazy - 延迟加载

`useLazy` 允许延迟加载中间件，优化启动时间和内存使用。

#### 同步延迟加载

```typescript
import { createAsyncPipeline } from 'farrow-pipeline'

const pipeline = createAsyncPipeline<Request, Response>()

// 延迟加载重量级中间件
pipeline.useLazy(() => {
  // 这个函数只在第一次使用时执行
  console.log('Loading heavy middleware...')
  const heavyDependency = loadHeavyDependency()
  
  return (input, next) => {
    const processed = heavyDependency.process(input)
    return next(processed)
  }
})

// 条件性加载
pipeline.useLazy(() => {
  if (process.env.FEATURE_FLAG === 'enabled') {
    return featureMiddleware
  }
  // 返回透传中间件
  return (input, next) => next(input)
})
```

#### 异步模块加载

```typescript
const apiPipeline = createAsyncPipeline<ApiRequest, ApiResponse>()

// 异步加载外部模块
apiPipeline.useLazy(async () => {
  // 动态导入，只在需要时加载
  const { processPayment } = await import('./payment-processor')
  
  return async (request, next) => {
    if (request.type === 'payment') {
      const result = await processPayment(request.data)
      return { type: 'payment', result }
    }
    return next(request)
  }
})

// 并行加载多个中间件
apiPipeline.useLazy(async () => {
  const [auth, rateLimit, cache] = await Promise.all([
    import('./middleware/auth'),
    import('./middleware/rate-limit'),
    import('./middleware/cache')
  ])
  
  return (request, next) => {
    if (!auth.validate(request)) {
      return { error: 'Unauthorized' }
    }
    
    if (!rateLimit.check(request)) {
      return { error: 'Rate limit exceeded' }
    }
    
    const cached = cache.get(request)
    if (cached) return cached
    
    const response = next(request)
    cache.set(request, response)
    return response
  }
})
```

---

## farrow-schema 高级特性

### Validator.validate - 手动验证

`Validator.validate` 允许你在任何地方手动验证数据，不仅限于 HTTP 路由。

#### 基础用法

```typescript
import { Validator } from 'farrow-schema/validator'
import { ObjectType, String, Number, Optional } from 'farrow-schema'

// 定义 Schema
class UserInput extends ObjectType {
  name = String
  age = Number
  email = String
  bio = Optional(String)
}

// 手动验证数据
const data = { name: 'John', age: 25, email: 'john@example.com' }
const result = Validator.validate(UserInput, data)

if (result.isOk) {
  // 验证成功，result.value 是类型安全的数据
  console.log('Valid data:', result.value)
  // result.value 的类型：{ name: string; age: number; email: string; bio?: string }
} else {
  // 验证失败，result.value 包含错误信息
  console.error('Validation error:', result.value.message)
  console.error('Error path:', result.value.path)
}
```

#### 在业务逻辑中使用

```typescript
// 处理表单数据
function processForm(input: unknown) {
  const result = Validator.validate(UserInput, input)
  
  if (result.isErr) {
    throw new Error(`Validation failed at ${result.value.path?.join('.')}: ${result.value.message}`)
  }
  
  // 此时 result.value 是类型安全的
  return saveToDatabase(result.value)
}

// 批量验证
function validateBatch(items: unknown[]): { valid: any[], invalid: any[] } {
  const results = items.map(item => Validator.validate(UserInput, item))
  
  const valid = results
    .filter(r => r.isOk)
    .map(r => r.value)
  
  const invalid = results
    .filter(r => r.isErr)
    .map((r, index) => ({
      index,
      error: r.value.message,
      path: r.value.path
    }))
  
  return { valid, invalid }
}

// 验证嵌套数据
class OrderSchema extends ObjectType {
  orderId = String
  user = UserInput  // 嵌套 Schema
  items = List({
    productId: String,
    quantity: Number,
    price: Number
  })
}

const orderData = {
  orderId: 'ORD-001',
  user: { name: 'John', age: 25, email: 'john@example.com' },
  items: [
    { productId: 'P1', quantity: 2, price: 99.99 }
  ]
}

const orderResult = Validator.validate(OrderSchema, orderData)
```

### 自定义 ValidatorType

通过继承 `ValidatorType`，你可以创建自定义的验证逻辑。

#### 创建自定义验证器

```typescript
import { ValidatorType } from 'farrow-schema/validator'
import { Validator } from 'farrow-schema'

// 邮箱验证器
class EmailType extends ValidatorType<string> {
  validate(input: unknown) {
    // 先验证基础类型
    const stringResult = Validator.validate(String, input)
    if (stringResult.isErr) {
      return this.Err('Email must be a string')
    }
    
    const email = stringResult.value.trim().toLowerCase()
    
    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return this.Err('Invalid email format')
    }
    
    // 返回处理后的值
    return this.Ok(email)
  }
}

// 带参数的验证器
class RangeType extends ValidatorType<number> {
  constructor(
    private min: number,
    private max: number
  ) {
    super()
  }
  
  validate(input: unknown) {
    // 先验证是否为数字
    const numberResult = Validator.validate(Number, input)
    if (numberResult.isErr) {
      return numberResult  // 直接返回错误
    }
    
    const value = numberResult.value
    if (value < this.min || value > this.max) {
      return this.Err(`Value must be between ${this.min} and ${this.max}`)
    }
    
    return this.Ok(value)
  }
}

// 使用自定义验证器
class UserProfile extends ObjectType {
  email = EmailType  // 使用自定义邮箱验证器
  age = new RangeType(0, 150)
  score = new RangeType(0, 100)
}
```

#### 验证器工厂模式

```typescript
// 创建可复用的验证器工厂
function StringPattern(pattern: RegExp, message: string) {
  return class extends ValidatorType<string> {
    validate(input: unknown) {
      const stringResult = Validator.validate(String, input)
      if (stringResult.isErr) {
        return this.Err('Must be a string')
      }
      
      if (!pattern.test(stringResult.value)) {
        return this.Err(message)
      }
      
      return this.Ok(stringResult.value)
    }
  }
}

// 使用工厂创建具体验证器
const UsernameType = StringPattern(
  /^[a-zA-Z0-9_]{3,20}$/,
  'Username must be 3-20 characters, alphanumeric and underscore only'
)

const PhoneType = StringPattern(
  /^\+?[1-9]\d{10,14}$/,
  'Invalid phone number format'
)

const SlugType = StringPattern(
  /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
  'Slug must be lowercase alphanumeric with hyphens'
)

// 组合使用
class ContactForm extends ObjectType {
  username = UsernameType
  phone = PhoneType
  slug = SlugType
}
```
## farrow-http 高级特性

### Response.capture - 响应拦截

`capture` 允许你拦截特定类型的响应并进行统一处理。

#### 统一响应格式

```typescript
// 拦截所有 JSON 响应
app.capture('json', (jsonBody, response) => {
  const statusCode = response.info.status?.code || 200
  
  // 统一成功响应格式
  if (statusCode < 400) {
    return Response.json({
      success: true,
      data: jsonBody.value,
      meta: {
        timestamp: Date.now(),
        version: 'v1'
      }
    }).merge(response)  // 保留原响应的其他属性
  }
  
  // 统一错误响应格式
  return Response.json({
    success: false,
    error: jsonBody.value,
    meta: {
      timestamp: Date.now(),
      statusCode
    }
  }).merge(response)
})

// 拦截文本响应添加字符集
app.capture('text', (textBody, response) => {
  return response.header('Content-Type', 'text/plain; charset=utf-8')
})

// 拦截 HTML 响应
app.capture('html', (htmlBody, response) => {
  const html = htmlBody.value
  // 注入分析脚本
  const modified = html.replace(
    '</head>',
    '<script>console.log("Page loaded")</script></head>'
  )
  return Response.html(modified).merge(response)
})
```

### Response.custom - 自定义响应

`Response.custom` 让你直接操作 Node.js 的原生请求和响应对象。

#### Server-Sent Events (SSE)

```typescript
app.get('/events').use(() => {
  return Response.custom(({ req, res }) => {
    // 设置 SSE 响应头
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    })
    
    // 发送初始连接事件
    res.write('event: connected\n')
    res.write('data: {"status": "connected"}\n\n')
    
    // 定期发送数据
    let counter = 0
    const interval = setInterval(() => {
      counter++
      res.write(`event: message\n`)
      res.write(`data: {"count": ${counter}}\n`)
      res.write(`id: ${counter}\n\n`)
      
      if (counter >= 10) {
        clearInterval(interval)
        res.end()
      }
    }, 1000)
    
    // 客户端断开时清理
    req.on('close', () => {
      clearInterval(interval)
    })
  })
})
```

#### 文件流式传输

```typescript
import { createReadStream } from 'fs'
import { pipeline } from 'stream'

app.get('/download/<file:string>').use((request) => {
  const filename = request.params.file
  
  return Response.custom(({ res }) => {
    const stream = createReadStream(`./uploads/${filename}`)
    
    // 设置下载响应头
    res.setHeader('Content-Type', 'application/octet-stream')
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
    
    // 流式传输
    pipeline(stream, res, (err) => {
      if (err) {
        console.error('Stream error:', err)
        if (!res.headersSent) {
          res.statusCode = 500
          res.end('Stream error')
        }
      }
    })
    
    // 文件不存在处理
    stream.on('error', () => {
      if (!res.headersSent) {
        res.statusCode = 404
        res.end('File not found')
      }
    })
  })
})
```

### Response.merge - 响应合并

`Response.merge` 用于合并多个响应对象的属性。

```typescript
// 创建响应增强函数
function withCors(response: Response): Response {
  const corsHeaders = Response
    .header('Access-Control-Allow-Origin', '*')
    .header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE')
    .header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  
  return Response.merge(response, corsHeaders)
}

function withCache(response: Response, maxAge: number): Response {
  const cacheHeaders = Response
    .header('Cache-Control', `public, max-age=${maxAge}`)
    .header('Expires', new Date(Date.now() + maxAge * 1000).toUTCString())
  
  return Response.merge(response, cacheHeaders)
}

// 使用响应增强
app.get('/api/data').use(() => {
  const data = Response.json({ items: [] })
  
  // 链式增强
  const enhanced = withCache(withCors(data), 3600)
  return enhanced
})

// 在中间件中合并响应
app.use((request, next) => {
  const startTime = Date.now()
  const response = next(request)
  
  // 添加性能追踪头
  const tracking = Response
    .header('X-Response-Time', `${Date.now() - startTime}ms`)
    .header('X-Server', 'Farrow')
  
  return Response.merge(response, tracking)
})
```

---

## 实战案例：综合应用

让我们综合运用这些高级特性构建一个完整的示例。

```typescript
import { Http, Response } from 'farrow-http'
import { createAsyncPipeline, createContext, createContainer, runWithContainer } from 'farrow-pipeline'
import { ObjectType, ValidatorType, Validator } from 'farrow-schema'

// === 自定义验证器 ===
class StrongPasswordType extends ValidatorType<string> {
  validate(input: unknown) {
    const stringResult = Validator.validate(String, input)
    if (stringResult.isErr) {
      return this.Err('Password must be a string')
    }
    
    const password = stringResult.value
    
    if (password.length < 8) {
      return this.Err('Password must be at least 8 characters')
    }
    
    if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password)) {
      return this.Err('Password must contain uppercase, lowercase and numbers')
    }
    
    return this.Ok(password)
  }
}

// === Schema 定义 ===
class RegisterRequest extends ObjectType {
  username = String
  email = String
  password = StrongPasswordType
}

// === Context 定义 ===
const RequestIdContext = createContext<string>('')
const UserContext = createContext<User | null>(null)

// === 处理 Pipeline ===
const authPipeline = createAsyncPipeline<AuthRequest, AuthResponse>()

// 延迟加载认证模块
authPipeline.useLazy(async () => {
  const { authenticate } = await import('./auth')
  
  return async (request, next) => {
    const result = await authenticate(request)
    if (!result.success) {
      return { success: false, error: 'Authentication failed' }
    }
    return next({ ...request, user: result.user })
  }
})

// === 主应用 ===
const app = Http()

// 请求追踪中间件
app.use((request, next) => {
  const requestId = generateRequestId()
  
  // 创建请求级 Container
  const container = createContainer({
    [RequestIdContext]: requestId
  })
  
  return runWithContainer(() => {
    const startTime = Date.now()
    const response = next(request)
    
    // 添加追踪头
    return response
      .header('X-Request-ID', requestId)
      .header('X-Response-Time', `${Date.now() - startTime}ms`)
  }, container)
})

// 统一响应格式
app.capture('json', (jsonBody, response) => {
  const requestId = RequestIdContext.get()
  
  return Response.json({
    requestId,
    timestamp: Date.now(),
    ...jsonBody.value
  }).merge(response)
})

// 注册接口
app.post('/register', {
  body: RegisterRequest
}).use(async (request) => {
  // 手动验证额外的业务规则
  const usernameCheck = await checkUsernameExists(request.body.username)
  if (usernameCheck) {
    return Response.status(400).json({ error: 'Username already exists' })
  }
  
  // 使用 Pipeline 处理
  const authResult = await authPipeline.run({
    type: 'register',
    data: request.body
  })
  
  if (!authResult.success) {
    return Response.status(400).json({ error: authResult.error })
  }
  
  return Response.status(201).json({
    user: authResult.user,
    token: authResult.token
  })
})

// SSE 通知接口
app.get('/notifications').use(() => {
  return Response.custom(({ req, res }) => {
    const requestId = RequestIdContext.get()
    const user = UserContext.get()
    
    if (!user) {
      res.writeHead(401)
      res.end('Unauthorized')
      return
    }
    
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'X-Request-ID': requestId
    })
    
    // 订阅用户通知
    const unsubscribe = subscribeToUserNotifications(user.id, (notification) => {
      res.write(`event: notification\n`)
      res.write(`data: ${JSON.stringify(notification)}\n\n`)
    })
    
    req.on('close', () => {
      unsubscribe()
    })
  })
})

app.listen(3000)
```

---

## 总结

本教程深入介绍了 Farrow 框架的高级特性：

### farrow-pipeline
- **usePipeline**：实现 Pipeline 的模块化组合
- **Container**：提供请求级的上下文隔离
- **useLazy**：优化性能的延迟加载机制

### farrow-schema
- **Validator.validate**：手动验证数据的核心 API
- **ValidatorType**：创建自定义验证器的基类
- **required**：Schema 转换工具函数

### farrow-http
- **Response.capture**：统一处理特定类型的响应
- **Response.custom**：直接操作原生对象实现特殊功能
- **Response.merge**：灵活组合响应属性

这些高级特性让你能够构建更加复杂、高效和可维护的应用。