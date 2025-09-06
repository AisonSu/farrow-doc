# Pipeline 核心概念

Pipeline 是 Farrow 框架的核心抽象，它提供了一种优雅的方式来处理数据流和中间件组合。深入理解 Pipeline 的工作原理对于掌握 Farrow 至关重要。

## 什么是 Pipeline？

Pipeline 是一个函数式的数据处理管道，它允许你将多个处理步骤串联起来，形成一个完整的数据处理流程。

### 基本概念

```typescript
import { createPipeline } from 'farrow-pipeline'

// Pipeline 的类型签名：Pipeline<Input, Output>
const pipeline = createPipeline<string, string>()

// 添加处理步骤
pipeline.use((input, next) => {
  console.log('处理输入:', input)
  const result = next(input + ' processed')
  console.log('处理结果:', result)
  return result
})

// 运行 Pipeline
const result = pipeline.run('hello')  // 输出: "hello processed"
```

### Pipeline 的特点

1. **类型安全** - 每个 Pipeline 都有明确的输入和输出类型
2. **函数式** - 不可变的数据流，每步都返回新值
3. **组合性** - 可以轻松组合多个 Pipeline
4. **上下文隔离** - 每次运行都有独立的执行环境

## Container 概念详解

Container（容器）是 Pipeline 中最重要的概念之一，它负责管理执行上下文和状态隔离。

### 什么是 Container？

Container 是一个执行环境，用于存储和管理 Context 的值。每次调用 `pipeline.run()` 时，Farrow 都会创建一个新的 Container。

```typescript
import { createPipeline, createContext } from 'farrow-pipeline'

const UserContext = createContext<{ name: string } | null>(null)
const RequestContext = createContext<{ id: string; startTime: number }>()

const pipeline = createPipeline<string, string>()

pipeline.use((input, next) => {
  // 在当前 Container 中设置 Context
  RequestContext.set({
    id: `req-${Date.now()}`,
    startTime: Date.now()
  })
  
  UserContext.set({ name: input })
  
  return next(input)
})

pipeline.use((input, next) => {
  // 从当前 Container 中读取 Context
  const request = RequestContext.get()
  const user = UserContext.get()
  
  console.log(`Request ${request.id}: Processing user ${user?.name}`)
  return next(`processed: ${input}`)
})
```

### Container 的隔离性

每次 `pipeline.run()` 调用都会创建全新的 Container，确保不同执行之间完全隔离：

```typescript
const pipeline = createPipeline<string, string>()

pipeline.use((input, next) => {
  UserContext.set({ name: input })
  console.log('设置用户:', input)
  return next(input)
})

pipeline.use((input, next) => {
  const user = UserContext.get()
  console.log('获取用户:', user?.name)
  return next(user?.name || 'unknown')
})

// 并发执行 - 每个都有独立的 Container
Promise.all([
  pipeline.run('Alice'),    // Container A: UserContext = { name: 'Alice' }
  pipeline.run('Bob'),      // Container B: UserContext = { name: 'Bob' }
  pipeline.run('Charlie')   // Container C: UserContext = { name: 'Charlie' }
]).then(results => {
  console.log(results)  // ['Alice', 'Bob', 'Charlie']
})
```

::: warning 重要提醒
即使在异步环境中，Container 也会保持隔离。这是基于 Node.js 的 AsyncLocalStorage 实现的。
:::

### Container 生命周期

```typescript
const pipeline = createPipeline<string, string>()

pipeline.use((input, next) => {
  console.log('1. Container 创建，Context 初始化')
  UserContext.set({ name: input })
  
  // 异步操作也在同一个 Container 中
  setTimeout(() => {
    console.log('3. 异步操作中的用户:', UserContext.get()?.name)
  }, 100)
  
  const result = next(input)
  console.log('2. 中间件执行完成')
  return result
})

pipeline.use((input, next) => {
  const user = UserContext.get()
  return next(`Hello, ${user?.name}!`)
})

// 运行完成后，Container 被销毁
const result = pipeline.run('Alice')
console.log('4. 最终结果:', result)
```


## Pipeline 的同步和异步

### 同步 Pipeline

```typescript
import { createPipeline } from 'farrow-pipeline'

const syncPipeline = createPipeline<number, number>()

syncPipeline.use((input, next) => {
  console.log('输入:', input)
  return next(input * 2)
})

syncPipeline.use((input, next) => {
  console.log('中间值:', input)
  return next(input + 10)
})

syncPipeline.use((input, next) => {
  console.log('最终处理:', input)
  return input
})

const result = syncPipeline.run(5)  // 输出: 20 (5 * 2 + 10)
```

### 异步 Pipeline

```typescript
import { createAsyncPipeline } from 'farrow-pipeline'

const asyncPipeline = createAsyncPipeline<string, string>()

asyncPipeline.use(async (input, next) => {
  console.log('开始异步处理:', input)
  
  // 模拟异步操作
  await new Promise(resolve => setTimeout(resolve, 100))
  
  return next(`async-${input}`)
})

asyncPipeline.use(async (input, next) => {
  // 异步数据库查询
  const data = await queryDatabase(input)
  return next(`${input}-${data}`)
})

// 异步运行
const result = await asyncPipeline.run('test')
console.log('异步结果:', result)
```

### 混合使用

```typescript
// 在异步 Pipeline 中调用同步操作
const mixedPipeline = createAsyncPipeline<any, any>()

mixedPipeline.use(async (input, next) => {
  // 异步数据获取
  const userData = await fetchUserData(input.userId)
  
  // 同步数据处理
  const processedData = processUserData(userData)
  
  return next({ ...input, userData: processedData })
})

mixedPipeline.use((input, next) => {
  // 这个中间件是同步的，但在异步 Pipeline 中也能正常工作
  const enhanced = enhanceData(input)
  return next(enhanced)
})
```

## usePipeline：Pipeline 组合的核心

`usePipeline` 是 Pipeline 组合的核心工具，它允许你在一个 Pipeline 中使用另一个 Pipeline，并确保上下文的正确传递。

### 基础用法

```typescript
import { createPipeline, createAsyncPipeline, usePipeline } from 'farrow-pipeline'

// 创建一个用户认证 Pipeline
const authPipeline = createPipeline<string, { userId: number; role: string }>()

authPipeline.use((token, next) => {
  if (!token) {
    throw new Error('Token required')
  }
  
  const decoded = verifyJWT(token)
  const user = { userId: decoded.id, role: decoded.role }
  
  return next(user)
})

// 在主 Pipeline 中使用认证 Pipeline
const mainPipeline = createAsyncPipeline<{ token: string; action: string }, any>()

mainPipeline.use(async (input, next) => {
  // 使用 usePipeline 调用认证流程
  const user = await usePipeline(authPipeline)(input.token)
  
  console.log(`User ${user.userId} wants to perform: ${input.action}`)
  
  return next({
    user,
    action: input.action,
    timestamp: new Date()
  })
})
```

### 上下文继承

`usePipeline` 的一个重要特性是上下文继承——被调用的 Pipeline 会继承调用者的 Context 环境。

```typescript
import { createContext } from 'farrow-pipeline'

// 创建 Context
const RequestContext = createContext<{ id: string; startTime: number }>()
const UserContext = createContext<{ id: number; name: string } | null>(null)

// 日志记录 Pipeline
const loggingPipeline = createPipeline<string, string>()

loggingPipeline.use((message, next) => {
  const request = RequestContext.get()
  const user = UserContext.get()
  
  console.log(`[${request?.id}] ${user?.name || 'Anonymous'}: ${message}`)
  
  return next(message)
})

// 业务逻辑 Pipeline
const businessPipeline = createAsyncPipeline<any, any>()

businessPipeline.use(async (input, next) => {
  // 设置用户上下文
  UserContext.set({ id: input.userId, name: input.userName })
  
  // 使用日志 Pipeline - 它会继承 UserContext
  await usePipeline(loggingPipeline)('Starting business operation')
  
  // 执行业务逻辑
  const result = await performBusinessLogic(input)
  
  await usePipeline(loggingPipeline)('Business operation completed')
  
  return next(result)
})

// 主 Pipeline 设置请求上下文
const mainPipeline = createAsyncPipeline<any, any>()

mainPipeline.use(async (input, next) => {
  // 设置请求上下文
  RequestContext.set({
    id: generateRequestId(),
    startTime: Date.now()
  })
  
  const result = await usePipeline(businessPipeline)(input)
  
  const duration = Date.now() - RequestContext.get()!.startTime
  console.log(`Request completed in ${duration}ms`)
  
  return next(result)
})
```

## 手动创建 Container

在某些场景下，你可能需要手动创建和管理 Container，特别是在测试或特殊应用场景中。

### 什么是手动创建 Container？

通常，Pipeline 会在每次 `run()` 调用时自动创建 Container。但你也可以预先创建一个 Container，并在多个地方复用它。

```typescript
import { createContainer } from 'farrow-pipeline'

// 创建 Context
const DatabaseContext = createContext<Database>()
const LoggerContext = createContext<Logger>()

// 手动创建 Container
const testContainer = createContainer({
  database: DatabaseContext.create(mockDatabase),
  logger: LoggerContext.create(silentLogger)
})

// 使用特定的 Container 运行 Pipeline
const result = pipeline.run(input, { container: testContainer })
```

### 测试场景应用

手动创建 Container 在测试中非常有用，可以为不同的测试用例创建不同的环境：

```typescript
// 生产环境配置
const productionContainer = createContainer({
  database: DatabaseContext.create(productionDB),
  logger: LoggerContext.create(consoleLogger),
  cache: CacheContext.create(redisCache)
})

// 测试环境配置
const testContainer = createContainer({
  database: DatabaseContext.create(mockDatabase),
  logger: LoggerContext.create(silentLogger),
  cache: CacheContext.create(memoryCache)
})

// 在测试中使用
describe('User Service', () => {
  it('should create user', async () => {
    const result = await userPipeline.run(
      { name: 'Alice', email: 'alice@example.com' },
      { container: testContainer }
    )
    
    expect(result.success).toBe(true)
  })
})
```

### 多环境容器管理

```typescript
// 环境配置工厂
const createEnvironmentContainer = (env: string) => {
  const config = getConfigForEnvironment(env)
  
  return createContainer({
    config: ConfigContext.create(config),
    database: DatabaseContext.create(createDatabase(config.db)),
    logger: LoggerContext.create(createLogger(config.logging)),
    cache: CacheContext.create(createCache(config.cache))
  })
}

// 预创建环境容器
const environments = {
  development: createEnvironmentContainer('development'),
  production: createEnvironmentContainer('production'),
  test: createEnvironmentContainer('test')
}

// 根据环境使用相应的容器
const currentContainer = environments[process.env.NODE_ENV || 'development']

// 应用启动时使用环境特定的容器
app.use((request, next) => {
  // 将环境容器与当前请求关联
  const result = mainPipeline.run(
    { request, timestamp: Date.now() },
    { container: currentContainer }
  )
  
  return next(result)
})
```

### Container 与 usePipeline 的协作

当使用 `usePipeline` 时，被调用的 Pipeline 会继承当前的 Container：

```typescript
const sharedContainer = createContainer({
  user: UserContext.create({ id: 1, name: 'Alice' }),
  session: SessionContext.create({ sessionId: 'abc123' })
})

const authPipeline = createPipeline<any, any>()
authPipeline.use((input, next) => {
  const user = UserContext.get()  // 会获取到 Alice
  console.log(`Authenticating ${user?.name}`)
  return next(input)
})

const mainPipeline = createPipeline<any, any>()
mainPipeline.use((input, next) => {
  // 调用 authPipeline，它会继承当前的 Container
  const result = usePipeline(authPipeline)(input)
  return next(result)
})

// 使用共享容器运行
const result = mainPipeline.run(
  { action: 'getData' },
  { container: sharedContainer }
)
```

## Pipeline 执行模型

### 中间件执行顺序

```typescript
const pipeline = createPipeline<string, string>()

pipeline.use((input, next) => {
  console.log('中间件 1 - 开始')
  const result = next(input + ' -> 1')
  console.log('中间件 1 - 结束')
  return result
})

pipeline.use((input, next) => {
  console.log('中间件 2 - 开始')
  const result = next(input + ' -> 2')
  console.log('中间件 2 - 结束')
  return result
})

pipeline.use((input, next) => {
  console.log('中间件 3 - 处理')
  return input + ' -> 3'
})

pipeline.run('start')

// 输出顺序：
// 中间件 1 - 开始
// 中间件 2 - 开始  
// 中间件 3 - 处理
// 中间件 2 - 结束
// 中间件 1 - 结束
```

这种执行模型被称为"洋葱模型"，与 Koa.js 的中间件模型类似。

### 条件执行与组合

```typescript
// 条件执行 Pipeline
const conditionalPipeline = createPipeline<{ type: string; data: any }, any>()

conditionalPipeline.use((input, next) => {
  if (input.type === 'skip') {
    // 跳过后续中间件
    return { result: 'skipped', data: input.data }
  }
  
  // 正常执行
  return next(input)
})

// 使用 usePipeline 创建条件处理
const createConditionalProcessor = <T, R>(
  condition: (input: T) => boolean,
  truePipeline: any,
  falsePipeline: any
) => {
  const conditionalPipeline = createAsyncPipeline<T, R>()
  
  conditionalPipeline.use(async (input, next) => {
    const pipeline = condition(input) ? truePipeline : falsePipeline
    const result = await usePipeline(pipeline)(input)
    return next(result)
  })
  
  return conditionalPipeline
}
```

### 错误处理和传播

```typescript
const errorHandlingPipeline = createAsyncPipeline<any, any>()

errorHandlingPipeline.use(async (input, next) => {
  try {
    console.log('尝试处理:', input)
    const result = await next(input)
    console.log('处理成功:', result)
    return result
  } catch (error) {
    console.error('捕获到错误:', error.message)
    
    // 可以选择重新抛出错误或返回默认值
    if (error.code === 'RECOVERABLE') {
      return { status: 'error', message: error.message }
    }
    
    throw error  // 重新抛出不可恢复的错误
  }
})

// 使用 usePipeline 处理错误恢复
const createErrorBoundary = <T, R>(
  pipeline: any,
  fallbackPipeline: any
) => {
  const errorBoundaryPipeline = createAsyncPipeline<T, R>()
  
  errorBoundaryPipeline.use(async (input, next) => {
    try {
      const result = await usePipeline(pipeline)(input)
      return next(result)
    } catch (error) {
      console.warn('Pipeline failed, using fallback:', error.message)
      const fallbackResult = await usePipeline(fallbackPipeline)(input)
      return next(fallbackResult)
    }
  })
  
  return errorBoundaryPipeline
}
```

## 实际应用示例

### 复杂业务流程管理

```typescript
// 1. 创建专用容器
const businessContainer = createContainer({
  user: UserContext.create(null),
  transaction: TransactionContext.create(null),
  audit: AuditContext.create([])
})

// 2. 定义子流程 Pipeline
const validateUserPipeline = createPipeline<any, any>()
validateUserPipeline.use((input, next) => {
  const user = UserContext.get()
  if (!user || !user.isActive) {
    throw new Error('User validation failed')
  }
  return next(input)
})

const auditLogPipeline = createPipeline<string, void>()
auditLogPipeline.use((action, next) => {
  const user = UserContext.get()
  const audit = AuditContext.get()
  
  audit.push({
    action,
    userId: user?.id,
    timestamp: new Date()
  })
  
  AuditContext.set(audit)
  return next()
})

// 3. 主业务流程
const businessProcessPipeline = createAsyncPipeline<any, any>()

businessProcessPipeline.use(async (input, next) => {
  // 设置用户上下文
  UserContext.set(input.user)
  
  // 开始审计
  await usePipeline(auditLogPipeline)('process_started')
  
  try {
    // 验证用户
    await usePipeline(validateUserPipeline)(input)
    
    // 执行业务逻辑
    const result = await performBusinessLogic(input)
    
    // 记录成功
    await usePipeline(auditLogPipeline)('process_completed')
    
    return next({ success: true, data: result })
  } catch (error) {
    // 记录失败
    await usePipeline(auditLogPipeline)('process_failed')
    throw error
  }
})

// 4. 使用专用容器执行
const processOrder = async (orderData: any) => {
  return businessProcessPipeline.run(
    orderData,
    { container: businessContainer }
  )
}
```

通过整合 Pipeline 核心概念、usePipeline 组合能力和手动 Container 管理，你可以构建出强大而灵活的数据处理系统。这些技术相互配合，提供了：

- **模块化设计** - 通过 usePipeline 组合不同的处理逻辑
- **上下文管理** - Container 确保状态正确隔离和传递
- **环境控制** - 手动创建的 Container 支持多环境和测试场景
- **错误恢复** - 结合使用实现复杂的错误处理策略

理解了这些核心概念，你就能够充分利用 Pipeline 的强大功能来构建复杂而优雅的数据处理流程。Pipeline 的设计哲学是组合性和可预测性，这使得复杂的业务逻辑变得易于理解和维护。