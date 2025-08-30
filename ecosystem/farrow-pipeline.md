# farrow-pipeline

Pipeline 和 Context 系统。

## 概述

`farrow-pipeline` 是 Farrow 框架的核心基础设施，提供：

- 🔗 类型安全的 Pipeline 系统
- 🎭 React Hooks 风格的 Context API
- 📦 请求级的状态隔离
- ⚡ 延迟加载支持

## 特性

### Pipeline 系统

构建类型安全的处理管道：

```typescript
const pipeline = createPipeline<Input, Output>()

pipeline.use((input, next) => {
  // 处理逻辑
  return next(input)
})

const result = pipeline.run(input)
```

### Context 系统

优雅的状态管理：

```typescript
const UserContext = createContext<User>()

// 设置
UserContext.set(user)

// 获取
const user = UserContext.get()
```

### 容器隔离

每个请求独立的状态空间：

```typescript
const container = createContainer({
  [UserContext]: user,
  [ThemeContext]: theme
})

runWithContainer(() => {
  // 隔离的执行环境
}, container)
```

## 安装

```bash
npm install farrow-pipeline
```

## 快速开始

```typescript
import { createPipeline, createContext } from 'farrow-pipeline'

// 创建 Context
const CounterContext = createContext(0)

// 创建 Pipeline
const pipeline = createPipeline<number, string>()

pipeline.use((input, next) => {
  CounterContext.set(input)
  return next(input * 2)
})

pipeline.use((input, next) => {
  const count = CounterContext.get()
  return `Original: ${count}, Processed: ${input}`
})

// 运行
const result = pipeline.run(5)
// "Original: 5, Processed: 10"
```

## 核心概念

### Pipeline

数据处理管道，支持：

- 同步 Pipeline：`createPipeline`
- 异步 Pipeline：`createAsyncPipeline`
- Pipeline 组合：`usePipeline`
- 延迟加载：`useLazy`

### Context

状态管理系统：

- 创建：`createContext`
- 获取：`context.get()`
- 设置：`context.set()`
- 断言：`context.assert()`

### Container

隔离容器：

- 创建：`createContainer`
- 运行：`runWithContainer`
- 请求级隔离

## 使用场景

### 依赖注入

```typescript
const DatabaseContext = createContext<Database>()
const CacheContext = createContext<Cache>()

app.use((request, next) => {
  DatabaseContext.set(new Database())
  CacheContext.set(new Cache())
  return next(request)
})
```

### 请求追踪

```typescript
const RequestIdContext = createContext<string>()

app.use((request, next) => {
  RequestIdContext.set(generateId())
  const response = next(request)
  return response.header('X-Request-ID', RequestIdContext.get())
})
```

### 中间件组合

```typescript
const authPipeline = createPipeline()
const validationPipeline = createPipeline()

const mainPipeline = createPipeline()
mainPipeline.use((input, next) => {
  const auth = usePipeline(authPipeline)
  const validate = usePipeline(validationPipeline)
  
  const user = auth(input)
  const data = validate(input)
  
  return next({ user, data })
})
```

## 与其他模块的集成

### 与 farrow-http

```typescript
import { Http } from 'farrow-http'
import { createContext } from 'farrow-pipeline'

const app = Http()
const UserContext = createContext<User>()

app.use((request, next) => {
  UserContext.set(authenticateUser(request))
  return next(request)
})
```

### 与 farrow-schema

```typescript
const validationPipeline = createPipeline()

validationPipeline.use((data, next) => {
  const result = Validator.validate(Schema, data)
  if (result.isErr) {
    throw new ValidationError(result.value)
  }
  return next(result.value)
})
```

## 最佳实践

### Context 命名

```typescript
// ✅ 好
const CurrentUserContext = createContext<User>()
const DatabaseConnectionContext = createContext<Database>()

// ❌ 避免
const DataContext = createContext()
const ConfigContext = createContext()
```

### Pipeline 组合

```typescript
// ✅ 小而专注的 Pipeline
const authPipeline = createPipeline()
const loggingPipeline = createPipeline()
const validationPipeline = createPipeline()

// 组合使用
const appPipeline = createPipeline()
appPipeline.use(compose(
  authPipeline,
  loggingPipeline,
  validationPipeline
))
```

## API 参考

详细 API 文档请查看 [farrow-pipeline API](/api/farrow-pipeline)

## 相关链接

- [GitHub](https://github.com/farrowjs/farrow)
- [核心概念](/guide/core-concepts)
- [深度教程](/guide/advanced)