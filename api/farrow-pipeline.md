# Farrow Pipeline 用户 API 参考

## 概述

Farrow Pipeline 是一个类型安全的中间件管道库，提供函数式编程风格的请求处理能力。

## 目录

- [快速开始](#快速开始)
- [核心 API](#核心-api)
  - [createPipeline](#createpipeline)
  - [createAsyncPipeline](#createasyncpipeline)
  - [usePipeline](#usepipeline)
- [上下文管理](#上下文管理)
  - [createContext](#createcontext)
  - [Container 概念](#container-概念)
  - [createContainer](#createcontainer)
- [实用工具](#实用工具)
  - [isPipeline](#ispipeline)
- [错误处理](#错误处理)
- [最佳实践](#最佳实践)

---

## 快速开始

```typescript
import { createPipeline, createContext } from 'farrow-pipeline'
import * as asyncTracerImpl from 'farrow-pipeline/asyncTracerImpl.node'

// Node.js 环境必需 - 启用异步追踪
asyncTracerImpl.enable()

// 创建 Pipeline
const app = createPipeline<Request, Response>()

app.use((req, next) => {
  console.log(`${req.method} ${req.url}`)
  return next(req)
})

app.use((req) => {
  return { status: 200, body: 'Hello World' }
})

// 运行
const response = app.run(request)
```

---

## 核心 API

### createPipeline

创建一个类型安全的管道，用于处理请求流。

```typescript
function createPipeline<Input, Output>(options?: {
  contexts?: ContextStorage
}): Pipeline<Input, Output>
```

**基础用法**

```typescript
const pipeline = createPipeline<number, string>()

pipeline.use((input, next) => {
  // 前置处理
  const processed = input * 2
  return next(processed)
})

pipeline.use((input) => {
  // 最终处理
  return `Result: ${input}`
})

const result = pipeline.run(5) // "Result: 10"
```

**链式调用**

```typescript
const app = createPipeline<Request, Response>()
  .use(authMiddleware)
  .use(loggerMiddleware)  
  .use(routerMiddleware)
```

**Pipeline 嵌套**

```typescript
const validationPipeline = createPipeline<User, User>()
validationPipeline.use((user) => {
  if (!user.email.includes('@')) {
    throw new Error('Invalid email')
  }
  return user
})

const mainPipeline = createPipeline<User, Response>()
mainPipeline.use(validationPipeline) // 直接嵌套
mainPipeline.use((user) => ({ status: 200, user }))
```

---

### createAsyncPipeline

创建支持异步操作的管道，包含懒加载功能。

```typescript
function createAsyncPipeline<Input, Output>(options?: {
  contexts?: ContextStorage
}): AsyncPipeline<Input, Output>
```

**异步中间件**

```typescript
const pipeline = createAsyncPipeline<string, User>()

pipeline.use(async (userId, next) => {
  const user = await database.findUser(userId)
  if (!user) throw new Error('User not found')
  return next(user)
})

pipeline.use(async (user) => {
  await logActivity(user.id)
  return user
})

const user = await pipeline.run('user123')
```

**懒加载中间件**

```typescript
const pipeline = createAsyncPipeline<Request, Response>()

// 按需加载重型依赖
pipeline.useLazy(async () => {
  const { imageProcessor } = await import('./heavy-image-lib')
  return (req, next) => {
    if (req.url.startsWith('/image')) {
      const processed = imageProcessor(req)
      return next(processed)
    }
    return next(req)
  }
})

// 环境特定中间件
pipeline.useLazy(() => {
  if (process.env.NODE_ENV === 'development') {
    return (req, next) => {
      console.log('Dev mode:', req)
      return next(req)
    }
  }
  return (req, next) => next(req) // 生产环境跳过
})
```

---

### usePipeline

在中间件中运行另一个 Pipeline，自动继承当前的 Container（上下文容器）。

```typescript
function usePipeline<Input, Output>(
  pipeline: Pipeline<Input, Output>
): (input: Input, options?: RunOptions) => Output
```

**为什么需要 usePipeline？**

当你直接调用 `pipeline.run()` 时，会创建新的 Container，导致上下文丢失。`usePipeline` 确保子 Pipeline 继承当前的上下文状态。

```typescript
const UserContext = createContext<User | null>(null)

const authPipeline = createPipeline<Request, User>()
authPipeline.use((req) => {
  const user = authenticate(req)
  UserContext.set(user) // 设置用户上下文
  return user
})

const businessPipeline = createPipeline<User, Response>()
businessPipeline.use((user) => {
  // 这里能正确获取到用户上下文
  const currentUser = UserContext.get()
  return { status: 200, user: currentUser }
})

const mainPipeline = createPipeline<Request, Response>()

// ❌ 错误用法 - 上下文会丢失
mainPipeline.use((req, next) => {
  const user = authPipeline.run(req) // 新建 Container
  const response = businessPipeline.run(user) // 又是新的 Container
  return response // UserContext.get() 在 businessPipeline 中可能为空
})

// ✅ 正确用法 - 继承上下文
mainPipeline.use((req, next) => {
  const runAuth = usePipeline(authPipeline)
  const runBusiness = usePipeline(businessPipeline)
  
  const user = runAuth(req) // 继承当前 Container
  const response = runBusiness(user) // 继承当前 Container
  return response // 上下文正确传递
})
```

**错误处理组合**

```typescript
const validationPipeline = createPipeline<Data, Data>()
const processingPipeline = createPipeline<Data, Result>()

const mainPipeline = createPipeline<Data, Response>()

mainPipeline.use((data, next) => {
  const runValidation = usePipeline(validationPipeline)
  const runProcessing = usePipeline(processingPipeline)
  
  try {
    const validated = runValidation(data)
    const result = runProcessing(validated)
    return { status: 200, result }
  } catch (error) {
    return { status: 400, error: error.message }
  }
})
```

---

## 上下文管理

### createContext

创建可在 Pipeline 间共享的上下文状态。Context 是 Farrow Pipeline 的核心特性，用于在中间件间传递状态。

```typescript
function createContext<T>(defaultValue: T): Context<T>
```

**Context 对象包含：**
- `get()`: 获取当前值
- `set(value)`: 设置当前值
- `create(value)`: 创建具有不同初始值但 ID 相同的新 Context 实例
- `assert()`: 断言值非空并返回

**基础用法**

```typescript
const UserContext = createContext<User | null>(null)
const RequestIdContext = createContext('')

const pipeline = createPipeline<Request, Response>()

pipeline.use((req, next) => {
  // 设置上下文
  const user = authenticate(req)
  UserContext.set(user)
  RequestIdContext.set(generateId())
  
  return next(req)
})

pipeline.use((req, next) => {
  // 在任何后续中间件中获取上下文
  const user = UserContext.get()
  const requestId = RequestIdContext.get()
  
  console.log(`User: ${user?.name}, Request: ${requestId}`)
  return next(req)
})

pipeline.use((req) => {
  // 最终处理
  const user = UserContext.get()
  return { 
    status: 200, 
    body: `Hello, ${user?.name}!` 
  }
})
```

**上下文隔离**

每次 `pipeline.run()` 都会创建独立的上下文，互不干扰：

```typescript
const CounterContext = createContext(0)

const pipeline = createPipeline<string, string>()

pipeline.use((input, next) => {
  const count = CounterContext.get()
  CounterContext.set(count + 1)
  return next(`${input}:${CounterContext.get()}`)
})

// 并发执行，每个都有独立的计数器
const results = await Promise.all([
  pipeline.run('A'), // "A:1"
  pipeline.run('B'), // "B:1" 
  pipeline.run('C')  // "C:1"
])
```

---

### Container 概念

**Container（容器）**是 Farrow Pipeline 的内部机制，用于管理 Context 的存储和隔离。理解 Container 概念有助于更好地使用 Context 和 Pipeline。

**Container 的作用：**

1. **状态隔离**：每次 `pipeline.run()` 创建独立的 Container
2. **自动传递**：使用 `usePipeline` 时自动继承父 Container  
3. **异步安全**：基于 AsyncLocalStorage 确保异步操作中上下文正确传递

**Container 生命周期：**

```typescript
const UserContext = createContext<User | null>(null)

// 创建 Pipeline 时可以预设 Context
const pipeline = createPipeline<Request, Response>({
  contexts: {
    user: UserContext.create({ id: '1', name: 'Default User' })
  }
})

pipeline.use((req) => {
  // 读取预设的用户
  const user = UserContext.get() // { id: '1', name: 'Default User' }
  
  // 运行时可以修改
  UserContext.set({ id: '2', name: 'Logged In User' })
  
  return { user: UserContext.get() }
})

// 每次运行都从预设值开始，然后可以修改
const result1 = pipeline.run(request1) // 从 Default User 开始
const result2 = pipeline.run(request2) // 又从 Default User 开始
```

---

### createContainer

创建上下文容器来管理多个上下文。通常用于测试或特殊场景。

```typescript
function createContainer(contexts?: ContextStorage): Container
```

**测试场景使用**

```typescript
const DatabaseContext = createContext<Database>(productionDB)
const LoggerContext = createContext<Logger>(consoleLogger)

// 创建测试专用容器
const testContainer = createContainer({
  db: DatabaseContext.create(mockDatabase),
  logger: LoggerContext.create(silentLogger)
})

// 在测试中使用特定容器
const testResult = pipeline.run(testInput, { container: testContainer })
```

**多环境配置**

```typescript
const ConfigContext = createContext({ env: 'development' })

const environments = {
  development: createContainer({
    config: ConfigContext.create({ env: 'development', debug: true })
  }),
  production: createContainer({
    config: ConfigContext.create({ env: 'production', debug: false })
  }),
  test: createContainer({
    config: ConfigContext.create({ env: 'test', debug: false })
  })
}

const currentContainer = environments[process.env.NODE_ENV] || environments.development

const result = pipeline.run(input, { container: currentContainer })
```

---

## 实用工具

### isPipeline

检查对象是否为 Pipeline 实例。

```typescript
function isPipeline(obj: any): obj is Pipeline

// 动态处理不同类型的处理器
function handleRequest(handler: Pipeline | Function, input: any) {
  if (isPipeline(handler)) {
    return handler.run(input)
  } else {
    return handler(input)
  }
}
```

---

## 错误处理

### 同步错误处理

```typescript
const pipeline = createPipeline<Request, Response>()

pipeline.use((req, next) => {
  try {
    validateRequest(req)
    return next(req)
  } catch (error) {
    return {
      status: 400,
      error: error.message
    }
  }
})
```

### 异步错误处理

```typescript
const pipeline = createAsyncPipeline<Request, Response>()

pipeline.use(async (req, next) => {
  try {
    await validateRequestAsync(req)
    return await next(req)
  } catch (error) {
    return {
      status: 500,
      error: 'Internal server error'
    }
  }
})
```

### 全局错误边界

```typescript
const pipeline = createAsyncPipeline<Request, Response>()

// 第一个中间件作为错误边界
pipeline.use(async (req, next) => {
  try {
    return await next(req)
  } catch (error) {
    console.error('Pipeline error:', error)
    
    if (error.name === 'ValidationError') {
      return { status: 400, error: error.message }
    }
    
    if (error.name === 'AuthError') {
      return { status: 401, error: 'Unauthorized' }
    }
    
    return { status: 500, error: 'Internal server error' }
  }
})

// 业务中间件可以直接抛出错误
pipeline.use(async (req) => {
  if (!req.headers.authorization) {
    const error = new Error('Missing authorization header')
    error.name = 'AuthError'
    throw error
  }
  // ... 处理逻辑
})
```

---

## 最佳实践

### 1. 环境初始化

```typescript
// app.ts - 应用启动文件
import * as asyncTracerImpl from 'farrow-pipeline/asyncTracerImpl.node'

// Node.js 环境必需
asyncTracerImpl.enable()

// 应用关闭时清理（可选）
process.on('exit', () => {
  asyncTracerImpl.disable()
})
```

### 2. Context 设计原则

```typescript
// ✅ 好的做法 - 为不同职责创建专门的 Context
const AuthContext = createContext<User | null>(null)
const RequestContext = createContext<{ id: string, startTime: number }>()
const ConfigContext = createContext<AppConfig>()

// ❌ 避免 - 将无关数据混在一个 Context 中
const GlobalContext = createContext<{ 
  user?: User, 
  config?: Config, 
  temp?: any,
  requestId?: string 
}>()
```

### 3. Pipeline 组织

```typescript
// ✅ 按职责分离 Pipeline
const authPipeline = createPipeline<Request, AuthenticatedRequest>()
const validationPipeline = createPipeline<Data, ValidatedData>()
const businessPipeline = createPipeline<ValidatedData, Result>()

// 主 Pipeline 负责组合
const mainPipeline = createPipeline<Request, Response>()
  .use((req, next) => {
    const runAuth = usePipeline(authPipeline)
    const runValidation = usePipeline(validationPipeline) 
    const runBusiness = usePipeline(businessPipeline)
    
    const authReq = runAuth(req)
    const validatedData = runValidation(authReq.data)
    const result = runBusiness(validatedData)
    
    return { status: 200, result }
  })
```

### 4. 错误处理前置

```typescript
// ✅ 将错误处理放在管道前面
const pipeline = createAsyncPipeline<Request, Response>()
  .use(errorBoundaryMiddleware)    // 第一个中间件
  .use(validationMiddleware)       // 验证逻辑
  .use(authenticationMiddleware)   // 认证逻辑
  .use(businessLogicMiddleware)    // 业务逻辑（可以安全抛出错误）
```

### 5. 类型优先设计

```typescript
// ✅ 先定义清晰的接口
interface ApiRequest {
  path: string
  method: string
  headers: Record<string, string>
  body?: any
}

interface ApiResponse {
  status: number
  headers?: Record<string, string>
  data?: any
  error?: string
}

// 然后创建类型安全的 Pipeline
const apiPipeline = createPipeline<ApiRequest, ApiResponse>()

// TypeScript 会确保类型安全
apiPipeline.use((req, next) => {
  // req 自动推断为 ApiRequest 类型
  // next 的返回值必须是 ApiResponse 类型
  return next(req)
})
```

### 6. 条件中间件模式

```typescript
const createConditionalMiddleware = <T>(
  condition: boolean | ((input: T) => boolean),
  middleware: Middleware<T>
) => {
  return (input: T, next: Next<T>) => {
    const shouldExecute = typeof condition === 'function' 
      ? condition(input) 
      : condition
      
    if (shouldExecute) {
      return middleware(input, next)
    }
    return next(input)
  }
}

// 使用示例
pipeline.use(
  createConditionalMiddleware(
    process.env.NODE_ENV === 'development',
    debugMiddleware
  )
)

pipeline.use(
  createConditionalMiddleware(
    (req) => req.url.startsWith('/api'),
    apiMiddleware
  )
)
```

---

## 常见问题

**Q: 为什么 Context 在异步操作中丢失？**

A: 确保启用了 AsyncTracer：

```typescript
import * as asyncTracerImpl from 'farrow-pipeline/asyncTracerImpl.node'
asyncTracerImpl.enable() // 必需

// 现在异步操作中 Context 会自动传递
pipeline.use(async (input, next) => {
  UserContext.set(user)
  
  await delay(1000) // 异步等待
  
  const user = UserContext.get() // 正确获取到用户
  return next(input)
})
```

**Q: 何时使用 usePipeline 而不是直接嵌套？**

A: 当你需要处理子 Pipeline 的返回值或错误时使用 `usePipeline`：

```typescript
// 简单嵌套 - 推荐
mainPipeline.use(subPipeline)

// 需要处理返回值 - 使用 usePipeline  
mainPipeline.use((input, next) => {
  const runSubPipeline = usePipeline(subPipeline)
  
  try {
    const result = runSubPipeline(input)
    // 对结果做额外处理
    return next(processResult(result))
  } catch (error) {
    // 错误处理
    return handleError(error)
  }
})
```

**Q: Pipeline 可以重复使用吗？**

A: 可以，每次 `run()` 都是独立执行：

```typescript
const pipeline = createPipeline<number, number>()
pipeline.use(x => x + 1)

// 多次使用同一个 Pipeline
const result1 = pipeline.run(1) // 2
const result2 = pipeline.run(5) // 6

// 并发执行也是安全的
await Promise.all([
  pipeline.run(1),
  pipeline.run(2), 
  pipeline.run(3)
])
```

**Q: 浏览器环境如何使用？**

A: 浏览器环境不支持异步上下文追踪，需要避免在异步操作中依赖 Context：

```typescript
// 浏览器中使用
const pipeline = createPipeline<Request, Response>()

// ✅ 同步使用 Context
pipeline.use((req, next) => {
  UserContext.set(req.user)
  return next(req)
})

// ❌ 异步中可能丢失 Context  
pipeline.use(async (req, next) => {
  await fetchData()
  const user = UserContext.get() // 可能为空
  return next(req)
})

// ✅ 手动传递数据而不依赖 Context
pipeline.use(async (req, next) => {
  const data = await fetchData()
  return next({ ...req, data })
})
```