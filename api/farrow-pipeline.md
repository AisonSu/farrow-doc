# farrow-pipeline API 参考

farrow-pipeline 是一个强大的 Pipeline 和 Context 系统，提供类型安全的中间件管道和灵活的状态管理能力。

## 安装

```bash
npm install farrow-pipeline
```

## Pipeline API

### createPipeline()

创建一个类型安全的同步管道（Pipeline）。

```typescript
function createPipeline<I, O>(options?: PipelineOptions): Pipeline<I, O>

// 相关类型定义
type PipelineOptions = {
  contexts?: ContextStorage
}

type Pipeline<I = unknown, O = unknown> = {
  use: (...inputs: MiddlewareInput<I, O>[]) => Pipeline<I, O>
  run: (input: I, options?: RunPipelineOptions<I, O>) => O
  middleware: Middleware<I, O>
}

type RunPipelineOptions<I = unknown, O = unknown> = {
  container?: Container
  onLast?: (input: I) => O
}
```

#### 参数

- `options` (可选): Pipeline 配置选项
  - `contexts`: 要注入到 Pipeline 的上下文存储

#### 返回值

返回 `Pipeline<I, O>` 对象：
- `use(...middlewares)`: 添加中间件到管道，支持链式调用
- `run(input, options?)`: 运行管道并返回结果
- `middleware`: 将当前 Pipeline 作为中间件使用

#### 示例

```typescript
import { createPipeline } from 'farrow-pipeline'

// 基础用法
const pipeline = createPipeline<number, string>()

pipeline.use((input, next) => {
  console.log('前置处理:', input)
  const result = next(input * 2)
  console.log('后置处理:', result)
  return result
})

pipeline.use((input) => {
  return `结果: ${input}`
})

const result = pipeline.run(5) // "结果: 10"

// 嵌套 Pipeline
const subPipeline = createPipeline<number, number>()
subPipeline.use(x => x * 2)

const mainPipeline = createPipeline<number, string>()
mainPipeline.use(subPipeline.middleware)  // 作为中间件使用
mainPipeline.use(x => `Result: ${x}`)

mainPipeline.run(5) // "Result: 10"
```

### createAsyncPipeline()

创建支持异步操作和懒加载的管道。

```typescript
function createAsyncPipeline<I, O>(options?: PipelineOptions): AsyncPipeline<I, O>

// 相关类型定义
type AsyncPipeline<I = unknown, O = unknown> = 
  Pipeline<I, MaybeAsync<O>> & {
    useLazy: (thunk: ThunkMiddlewareInput<I, O>) => AsyncPipeline<I, O>
  }

type MaybeAsync<T> = T | Promise<T>

type ThunkMiddlewareInput<I, O> = 
  () => MaybeAsync<MiddlewareInput<I, MaybeAsync<O>>>
```

#### 参数

与 `createPipeline` 相同

#### 返回值

返回 `AsyncPipeline<I, O>`，除了 Pipeline 的所有方法外，还包含：
- `useLazy(thunk)`: 懒加载中间件

#### 示例

```typescript
import { createAsyncPipeline } from 'farrow-pipeline'

const pipeline = createAsyncPipeline<string, { data: any }>()

// 异步中间件
pipeline.use(async (input, next) => {
  const user = await fetchUser(input)
  return next(user.id)
})

// 懒加载中间件 - 按需加载大型依赖
pipeline.useLazy(async () => {
  const { processData } = await import('./heavy-processor')
  return (data) => processData(data)
})

// 条件加载
pipeline.useLazy(() => {
  if (process.env.NODE_ENV === 'production') {
    return import('./prod-middleware')
  }
  return import('./dev-middleware')
})

const result = await pipeline.run('user123')
```

### usePipeline()

在另一个 Pipeline 的中间件中使用 Pipeline，自动继承当前的 Container。

```typescript
function usePipeline<I, O>(
  pipeline: Pipeline<I, O>
): (input: I, options?: RunPipelineOptions<I, O>) => O
```

#### 参数

- `pipeline`: 要使用的 Pipeline 实例

#### 返回值

返回一个函数，该函数接收输入并运行 Pipeline，自动使用当前的 Container

#### 示例

```typescript
import { usePipeline, createPipeline } from 'farrow-pipeline'

// 子 Pipeline
const validationPipeline = createPipeline<User, User>()
validationPipeline.use((user) => {
  if (!user.email.includes('@')) {
    throw new Error('Invalid email')
  }
  return user
})

// 主 Pipeline
const mainPipeline = createPipeline<User, Result>()

mainPipeline.use((user, next) => {
  // 使用 usePipeline 运行子 Pipeline
  const runValidation = usePipeline(validationPipeline)
  
  try {
    const validatedUser = runValidation(user)
    return next(validatedUser)
  } catch (error) {
    return { success: false, error: error.message }
  }
})

// 对比：使用 pipeline.middleware
mainPipeline.use(validationPipeline.middleware)  // 更简洁但不能处理返回值
```

## Context API

### createContext()

创建一个可注入的上下文。

```typescript
function createContext<T>(defaultValue: T): Context<T>

// 相关类型定义
type Context<T = any> = {
  id: symbol
  create: (value: T) => Context<T>
  get: () => T
  set: (value: T) => void
  assert: () => Exclude<T, undefined | null>
}
```

#### 参数

- `defaultValue`: 上下文的默认值

#### 返回值

返回 `Context<T>` 对象：
- `id`: 唯一标识符
- `create(value)`: 创建具有相同 id 但不同值的新 Context 实例
- `get()`: 获取当前值
- `set(value)`: 设置当前值
- `assert()`: 断言值非空并返回

#### Context.create 方法详解

`create` 方法创建一个新的 Context 实例，保持相同的 `id` 但使用不同的值。

**何时使用 create：**
- 多环境配置 - 不同环境需要不同的初始值
- 测试模拟 - 覆盖生产环境的默认值
- 多租户系统 - 为不同用户提供不同配置
- A/B 测试 - 同时运行多个配置变体

**何时不需要 create：**
- 只有一个 Pipeline 使用该 Context
- Context 的默认值已经满足需求
- 运行时通过 `set()` 修改值即可

#### 示例

```typescript
import { createContext, createPipeline } from 'farrow-pipeline'

// 1. 简单场景 - 不需要 create
const CounterContext = createContext(0)

const simplePipeline = createPipeline()  // 不传入 contexts

simplePipeline.use((input) => {
  const count = CounterContext.get()  // 使用默认值 0
  CounterContext.set(count + 1)       // 运行时修改
  return input
})

// 2. 测试场景 - 使用 create 覆盖
const DatabaseContext = createContext<Database>(productionDB)

const testPipeline = createPipeline({
  contexts: {
    db: DatabaseContext.create(mockDB)  // 覆盖为测试数据库
  }
})

// 3. 多环境配置
const LoggerContext = createContext<Logger>(consoleLogger)

const environments = {
  development: LoggerContext.create(verboseLogger),
  production: LoggerContext.create(jsonLogger),
  test: LoggerContext.create(silentLogger)
}

const pipeline = createPipeline({
  contexts: {
    logger: environments[process.env.NODE_ENV] || LoggerContext
  }
})
```

### createContainer()

创建上下文容器来管理多个上下文。

```typescript
function createContainer(contexts?: ContextStorage): Container

// 相关类型定义
type ContextStorage = {
  [key: string]: Context
}

type Container = {
  read: <V>(context: Context<V>) => V
  write: <V>(context: Context<V>, value: V) => void
}
```

#### 参数

- `contexts` (可选): 初始上下文存储

#### 返回值

返回 `Container` 对象：
- `read(context)`: 读取上下文值
- `write(context, value)`: 写入上下文值

#### Container 生命周期

1. **默认值回退**：未配置的 Context 自动使用 createContext 时的默认值
2. **默认隔离**：每次 pipeline.run() 创建新的 Container 副本
3. **显式共享**：通过 options.container 参数跨执行共享状态
4. **异步安全**：基于 AsyncLocalStorage 维护正确的上下文
5. **自动传递**：使用 pipeline.middleware 或 usePipeline 时继承父级 Container

#### 示例

```typescript
import { createContainer, createContext } from 'farrow-pipeline'

const UserContext = createContext({ id: '1', name: 'Alice' })
const ThemeContext = createContext('light')

// 创建容器
const container = createContainer({
  user: UserContext,
  theme: ThemeContext.create('dark')  // 覆盖默认值
})

// 读写操作
const user = container.read(UserContext)
container.write(ThemeContext, 'blue')

// 在 Pipeline 中使用容器
pipeline.run(input, { container })
```

### useContainer()

获取当前运行环境的容器。

```typescript
function useContainer(): Container
```

#### 返回值

返回当前的 `Container` 实例

#### 示例

```typescript
import { useContainer } from 'farrow-pipeline'

// 自定义 Hook
function useAuth() {
  const container = useContainer()
  const user = container.read(UserContext)
  
  if (!user) {
    throw new Error('未授权')
  }
  
  return user
}

// 在中间件中使用
pipeline.use((input, next) => {
  const user = useAuth()
  console.log(`已授权用户: ${user.name}`)
  return next(input)
})
```

## 中间件相关

### Middleware 类型

中间件函数类型定义。

```typescript
type Middleware<I = unknown, O = unknown> = (
  input: I,
  next: Next<I, O>
) => O

type Next<I = unknown, O = unknown> = (input?: I) => O

type MiddlewareInput<I = unknown, O = unknown> = 
  | Middleware<I, O> 
  | { middleware: Middleware<I, O> }
```

## 工具函数

### isPipeline()

检查对象是否为 Pipeline。

```typescript
function isPipeline(input: any): input is Pipeline

// 使用示例
if (isPipeline(obj)) {
  obj.run(input)  // TypeScript 知道 obj 是 Pipeline
}
```

### isContext()

检查对象是否为 Context。

```typescript
function isContext(input: any): input is Context

// 使用示例
if (isContext(obj)) {
  const value = obj.get()  // TypeScript 知道 obj 是 Context
}
```

### isContainer()

检查对象是否为 Container。

```typescript
function isContainer(input: any): input is Container

// 使用示例
if (isContainer(obj)) {
  obj.read(context)  // TypeScript 知道 obj 是 Container
}
```

## 高级模式

### 错误处理

```typescript
const pipeline = createPipeline<Request, Response>()

// 错误边界中间件
pipeline.use(async (req, next) => {
  try {
    return await next(req)
  } catch (error) {
    console.error('Pipeline 错误:', error)
    return {
      status: 500,
      body: 'Internal Server Error'
    }
  }
})
```

### 条件中间件

```typescript
const conditionalMiddleware = (condition: boolean) => {
  return (input, next) => {
    if (condition) {
      console.log('条件满足，执行额外逻辑')
    }
    return next(input)
  }
}

pipeline.use(conditionalMiddleware(process.env.NODE_ENV === 'development'))
```

### 组合多个 Pipeline

```typescript
// 方式1：使用 middleware 属性
const validationPipeline = createPipeline<Data, Data>()
const processingPipeline = createPipeline<Data, Data>()

const mainPipeline = createPipeline<Data, Result>()
mainPipeline
  .use(validationPipeline.middleware)
  .use(processingPipeline.middleware)
  .use((data) => ({ success: true, data }))

// 方式2：使用 usePipeline
mainPipeline.use((data, next) => {
  const runValidation = usePipeline(validationPipeline)
  const runProcessing = usePipeline(processingPipeline)
  
  const validated = runValidation(data)
  const processed = runProcessing(validated)
  
  return next(processed)
})
```

### Context 模式

#### 依赖注入

```typescript
// 定义服务接口
interface Database {
  query(sql: string): Promise<any>
}

interface Cache {
  get(key: string): any
  set(key: string, value: any): void
}

// 创建 Context
const DatabaseContext = createContext<Database>()
const CacheContext = createContext<Cache>()

// 注入依赖
app.use((request, next) => {
  DatabaseContext.set(new PostgresDatabase())
  CacheContext.set(new RedisCache())
  return next(request)
})

// 使用依赖
function useDatabase() {
  const db = DatabaseContext.use()
  return db
}

function useCache() {
  const cache = CacheContext.use()
  return cache
}
```

#### 请求追踪

```typescript
const RequestIdContext = createContext<string>()
const TracingContext = createContext<{
  spans: Array<{ name: string; duration: number }>
}>()

// 追踪中间件
const tracing = (request, next) => {
  const requestId = generateId()
  RequestIdContext.set(requestId)
  TracingContext.set({ spans: [] })
  
  const start = Date.now()
  const response = next(request)
  
  const tracing = TracingContext.get()
  console.log({
    requestId,
    duration: Date.now() - start,
    spans: tracing?.spans
  })
  
  return response
}

// 记录 span
function trace<T>(name: string, fn: () => T): T {
  const start = Date.now()
  try {
    return fn()
  } finally {
    const tracing = TracingContext.get()
    if (tracing) {
      tracing.spans.push({
        name,
        duration: Date.now() - start
      })
    }
  }
}

// 使用
app.get('/api/data').use(() => {
  const data = trace('fetchData', () => fetchData())
  const processed = trace('processData', () => processData(data))
  return Response.json(processed)
})
```

### 条件性 Pipeline

```typescript
const pipeline = createAsyncPipeline<Request, Response>()

// 条件性中间件
pipeline.use((request, next) => {
  if (request.skipAuth) {
    return next(request)
  }
  
  // 动态选择 Pipeline
  const authPipeline = request.type === 'jwt'
    ? jwtAuthPipeline
    : sessionAuthPipeline
  
  const user = usePipeline(authPipeline)(request)
  return next({ ...request, user })
})

// 动态加载
pipeline.useLazy(async () => {
  if (process.env.FEATURE_FLAG === 'enabled') {
    const { featureMiddleware } = await import('./feature')
    return featureMiddleware
  }
  
  // 返回透传中间件
  return (input, next) => next(input)
})
```

## 完整示例

```typescript
import {
  createPipeline,
  createAsyncPipeline,
  createContext,
  createContainer,
  runWithContainer,
  usePipeline
} from 'farrow-pipeline'

// ===== Context 定义 =====
const UserContext = createContext<User | null>(null)
const DatabaseContext = createContext<Database>()
const LoggerContext = createContext<Logger>()

// ===== Pipeline 定义 =====

// 认证 Pipeline
const authPipeline = createAsyncPipeline<string, User>()
authPipeline.use(async (token, next) => {
  const payload = jwt.verify(token, SECRET)
  const user = await fetchUser(payload.userId)
  return user
})

// 验证 Pipeline
const validationPipeline = createPipeline<any, ValidatedData>()
validationPipeline.use((data, next) => {
  const result = validate(data)
  if (!result.valid) {
    throw new ValidationError(result.errors)
  }
  return next(result.data)
})

// 主 Pipeline
const appPipeline = createAsyncPipeline<Request, Response>()

// 依赖注入中间件
appPipeline.use(async (request, next) => {
  const container = createContainer({
    [DatabaseContext]: new Database(config.db),
    [LoggerContext]: new Logger(request.id)
  })
  
  return runWithContainer(() => next(request), container)
})

// 认证中间件
appPipeline.use(async (request, next) => {
  const token = request.headers.authorization
  
  if (token) {
    const authenticate = usePipeline(authPipeline)
    try {
      const user = await authenticate(token)
      UserContext.set(user)
    } catch (error) {
      return { status: 401, error: 'Invalid token' }
    }
  }
  
  return next(request)
})

// 延迟加载功能
appPipeline.useLazy(async () => {
  if (config.features.rateLimit) {
    const { rateLimitMiddleware } = await import('./rate-limit')
    return rateLimitMiddleware
  }
  return (input, next) => next(input)
})

// 业务处理
appPipeline.use(async (request, next) => {
  const db = DatabaseContext.use()
  const logger = LoggerContext.use()
  const user = UserContext.get()
  
  logger.info(`Processing request from ${user?.name || 'anonymous'}`)
  
  try {
    const validate = usePipeline(validationPipeline)
    const data = validate(request.body)
    
    const result = await db.process(data)
    
    return {
      status: 200,
      data: result
    }
  } catch (error) {
    logger.error('Processing failed:', error)
    
    if (error instanceof ValidationError) {
      return {
        status: 400,
        error: error.message
      }
    }
    
    return {
      status: 500,
      error: 'Internal server error'
    }
  }
})

// 运行应用
async function handleRequest(request: Request) {
  const response = await appPipeline.run(request)
  return response
}

// 测试隔离
async function testWithMocks() {
  const container = createContainer({
    [DatabaseContext]: new MockDatabase(),
    [LoggerContext]: new ConsoleLogger()
  })
  
  return runWithContainer(async () => {
    const response = await appPipeline.run(testRequest)
    return response
  }, container)
}
```

## 最佳实践

### 1. Context 命名

```typescript
// 好：描述性命名
const CurrentUserContext = createContext<User>()
const DatabaseConnectionContext = createContext<Database>()
const RequestTracingContext = createContext<Tracing>()

// 避免：通用命名
const DataContext = createContext()
const ConfigContext = createContext()
```

### 2. Pipeline 组合

```typescript
// 好：小而专注的 Pipeline
const authPipeline = createPipeline()  // 只处理认证
const validationPipeline = createPipeline()  // 只处理验证
const loggingPipeline = createPipeline()  // 只处理日志

// 组合使用
const appPipeline = createPipeline()
appPipeline.use((input, next) => {
  const auth = usePipeline(authPipeline)
  const validate = usePipeline(validationPipeline)
  // ...
})
```

### 3. 错误处理

```typescript
// 好：明确的错误处理
pipeline.use((input, next) => {
  try {
    return next(input)
  } catch (error) {
    if (error instanceof ValidationError) {
      return handleValidationError(error)
    }
    throw error  // 重新抛出未知错误
  }
})
```

### 4. 类型安全

```typescript
// 好：明确的类型定义
const pipeline = createPipeline<
  { userId: string; data: unknown },
  { success: boolean; result?: any; error?: string }
>()

// Context 带默认值
const ThemeContext = createContext<'light' | 'dark'>('light')
```

### 5. 生命周期管理

```typescript
// 好：合理的 Context 生命周期
const pipeline = createAsyncPipeline<Request, Response>()

pipeline.use(async (request, next) => {
  // 为每个请求创建新的上下文
  const container = createContainer({
    [RequestIdContext]: generateId(),
    [TimestampContext]: Date.now()
  })
  
  return runWithContainer(() => next(request), container)
})
```

## 总结

恭喜！您已经掌握了 farrow-pipeline 的完整 API：

- **Pipeline 系统**: 类型安全的中间件管道
- **Context 系统**: 灵活的状态管理和依赖注入
- **异步支持**: 完整的 Promise 和异步中间件支持
- **工具函数**: 丰富的类型检查和开发工具
- **高级模式**: 复杂场景下的最佳实践

现在可以构建高质量、可维护的中间件系统了！