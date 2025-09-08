# Farrow Pipeline 用户友好教程

欢迎来到 Farrow Pipeline 的世界！这是一个**面向实际应用**的渐进式教程，我们将从生活中的例子开始，逐步构建你自己的中间件系统。

## 学习路径

通过6个循序渐进的步骤，你将掌握类型安全中间件系统的精髓：

1. 🏠 [理解 Pipeline：快递分拣中心](#第一步理解-pipeline快递分拣中心) - 用生活场景理解概念
2. ⚡ [5分钟快速上手](#第二步-5分钟快速上手) - 最简实用示例
3. 🔄 [数据流动：next() 的魔法](#第三步-数据流动-next-的魔法) - 掌握中间件协作
4. 📦 [Context：共享的记忆](#第四步-context-共享的记忆) - 跨中间件状态管理
5. 🏗️ [Container：独立工作空间](#第五步-container-幕后的隔离机制) - 并发隔离的奥秘
6. 🔧 [Pipeline 嵌套的正确姿势](#第六步-pipeline-嵌套的正确姿势) - usePipeline 真正的用途

---

## 第一步：理解 Pipeline：快递分拣中心

### 生活中的 Pipeline

想象一个快递分拣中心：

```
包裹进入 → [扫码登记] → [重量检查] → [地址验证] → [装车分配] → 包裹出库
```

每个 **[ ]** 就是一个工作站（中间件），包裹必须依次通过每个工作站，最后才能出库。如果任何一个工作站发现问题，包裹就会被特殊处理或退回。

### 代码中的 Pipeline

```typescript
import { createPipeline } from 'farrow-pipeline'

// 包裹信息（输入类型）
interface Package {
  id: string
  weight: number
  address: string
}

// 处理结果（输出类型）
interface ProcessResult {
  id: string
  status: 'success' | 'rejected'
  message: string
  assignedTruck?: string
}

// 创建快递分拣 Pipeline
const packagePipeline = createPipeline<Package, ProcessResult>()

// 工作站1：重量检查
packagePipeline.use((pkg, next) => {
  console.log(`📦 检查包裹 ${pkg.id} 的重量...`)
  
  if (pkg.weight > 30) {
    // 超重直接返回，不继续下一工作站
    return {
      id: pkg.id,
      status: 'rejected',
      message: '包裹超重，无法处理'
    }
  }
  
  // 通过检查，送到下一个工作站
  return next(pkg)
})

// 工作站2：地址验证
packagePipeline.use((pkg, next) => {
  console.log(`📮 验证包裹 ${pkg.id} 的地址...`)
  
  if (!pkg.address || pkg.address.length < 5) {
    return {
      id: pkg.id,
      status: 'rejected',
      message: '地址信息不完整'
    }
  }
  
  return next(pkg)
})

// 工作站3：分配卡车
packagePipeline.use((pkg) => {
  console.log(`🚚 为包裹 ${pkg.id} 分配运输车辆...`)
  
  const truckId = `TRUCK-${Math.floor(Math.random() * 100)}`
  
  return {
    id: pkg.id,
    status: 'success',
    message: '包裹处理完成',
    assignedTruck: truckId
  }
})

// 测试我们的快递分拣系统
const package1: Package = {
  id: 'PKG001',
  weight: 5,
  address: '北京市朝阳区某某路123号'
}

const result = packagePipeline.run(package1)
console.log('处理结果:', result)

// 输出：
// 📦 检查包裹 PKG001 的重量...
// 📮 验证包裹 PKG001 的地址...
// 🚚 为包裹 PKG001 分配运输车辆...
// 处理结果: { id: 'PKG001', status: 'success', message: '包裹处理完成', assignedTruck: 'TRUCK-42' }
```

### 核心理解

1. **Pipeline = 流水线**：数据按顺序通过每个处理步骤
2. **中间件 = 工作站**：每个站点负责特定的检查或处理
3. **next() = 传送带**：将数据送到下一个工作站
4. **不调用 next() = 终止流程**：在当前工作站结束处理

**这就是 Pipeline 的全部核心！** 接下来我们看看如何在5分钟内快速上手。

---

## 第二步：5分钟快速上手

现在你已经理解了 Pipeline 的基本概念，让我们用一个**超级简单**的实际例子来快速上手。

### 最简单的用户注册流程

```typescript
import { createPipeline } from 'farrow-pipeline'

// 输入：用户提交的注册信息
interface RegisterRequest {
  username: string
  password: string
}

// 输出：注册结果
interface RegisterResponse {
  success: boolean
  message: string
  userId?: string
}

// 创建注册Pipeline
const registerPipeline = createPipeline<RegisterRequest, RegisterResponse>()

// 步骤1：检查用户名
registerPipeline.use((request, next) => {
  if (request.username.length < 3) {
    // 不合格直接返回，不继续后面的步骤
    return {
      success: false,
      message: '用户名太短了！至少需要3个字符'
    }
  }
  
  // 合格，继续下一步
  return next(request)
})

// 步骤2：检查密码
registerPipeline.use((request, next) => {
  if (request.password.length < 6) {
    return {
      success: false,
      message: '密码太短了！至少需要6个字符'
    }
  }
  
  return next(request)
})

// 步骤3：创建用户账号
registerPipeline.use((request) => {
  // 模拟创建用户
  const userId = 'USER_' + Math.random().toString(36).substr(2, 8)
  
  return {
    success: true,
    message: '注册成功！',
    userId
  }
})

// 🧪 测试一下
const goodRequest = {
  username: 'alice',
  password: '123456'
}

const badRequest = {
  username: 'ab',  // 太短
  password: '123456'
}

console.log('好的请求:', registerPipeline.run(goodRequest))
// 输出: { success: true, message: '注册成功！', userId: 'USER_abc123de' }

console.log('坏的请求:', registerPipeline.run(badRequest))
// 输出: { success: false, message: '用户名太短了！至少需要3个字符' }
```

### 就这么简单！

你已经会使用 Farrow Pipeline 了！核心就是：

1. 定义输入输出类型
2. 创建 Pipeline
3. 用 `.use()` 添加处理步骤
4. 用 `.run()` 执行处理

**每个步骤可以：**
- ✅ 调用 `next()` 继续下一步
- ❌ 直接 `return` 终止并返回结果

### 为什么这样设计？

- **类型安全**：TypeScript 会检查你的输入输出类型
- **职责分离**：每个步骤只负责一件事情
- **灵活控制**：任何步骤都可以决定是否继续
- **易于测试**：每个步骤都可以单独测试

---

## 第三步：数据流动：next() 的魔法

你已经会创建简单的 Pipeline 了，现在让我们深入理解**数据是如何在中间件之间流动的**。

### 数据可以被修改和传递

在快递分拣中心，包裹不仅仅是被检查，还可能被**重新包装**、**添加标签**或**修改信息**。在 Pipeline 中也是一样！

```typescript
import { createPipeline } from 'farrow-pipeline'

interface UserData {
  username: string
  email: string
  profileComplete?: boolean  // 可选字段，后续添加
  securityScore?: number     // 安全评分，后续计算
}

interface Result {
  success: boolean
  user?: UserData
  warnings?: string[]
}

const userPipeline = createPipeline<UserData, Result>()

// 步骤1：数据清理和标准化
userPipeline.use((userData, next) => {
  console.log('🧹 清理数据...')
  
  // 修改数据：去除空格，转换为小写
  const cleanedData = {
    ...userData,
    username: userData.username.trim().toLowerCase(),
    email: userData.email.trim().toLowerCase()
  }
  
  // 传递修改后的数据到下一步
  return next(cleanedData)
})

// 步骤2：添加更多信息
userPipeline.use((userData, next) => {
  console.log('📋 评估用户档案...')
  
  // 在原数据基础上添加新字段
  const enhancedData = {
    ...userData,
    profileComplete: userData.username.length > 0 && userData.email.includes('@')
  }
  
  return next(enhancedData)
})

// 步骤3：安全评分
userPipeline.use((userData, next) => {
  console.log('🔒 计算安全评分...')
  
  let score = 0
  if (userData.username.length >= 3) score += 30
  if (userData.email.includes('@')) score += 40
  if (userData.profileComplete) score += 30
  
  const finalData = {
    ...userData,
    securityScore: score
  }
  
  return next(finalData)
})

// 步骤4：生成最终结果
userPipeline.use((userData) => {
  console.log('✅ 生成结果...')
  
  const warnings = []
  if (userData.securityScore < 50) {
    warnings.push('安全评分较低，建议完善资料')
  }
  
  return {
    success: true,
    user: userData,
    warnings: warnings.length > 0 ? warnings : undefined
  }
})

// 🧪 测试数据流动
const inputData = {
  username: '  Alice  ',  // 有多余空格
  email: 'ALICE@EXAMPLE.COM'  // 大小写混合
}

console.log('输入数据:', inputData)
const result = userPipeline.run(inputData)
console.log('最终结果:', JSON.stringify(result, null, 2))

// 输出：
// 🧹 清理数据...
// 📋 评估用户档案...
// 🔒 计算安全评分...
// ✅ 生成结果...
// 输入数据: { username: '  Alice  ', email: 'ALICE@EXAMPLE.COM' }
// 最终结果: {
//   "success": true,
//   "user": {
//     "username": "alice",
//     "email": "alice@example.com",
//     "profileComplete": true,
//     "securityScore": 100
//   }
// }
```

### 数据流动的关键点

1. **渐进式增强**：每一步都可以在原数据基础上添加新信息
2. **数据变换**：可以清理、格式化、验证数据
3. **保持类型安全**：TypeScript 确保每次传递的数据结构正确
4. **链式处理**：前一步的输出成为下一步的输入

### 实际应用场景

这种数据流动模式在实际开发中非常有用：

```typescript
// Web API 请求处理
const apiPipeline = createPipeline<RawRequest, ApiResponse>()
  .use(parseRequestBody)      // 解析请求体
  .use(validateInput)         // 验证输入
  .use(authenticateUser)      // 用户认证（添加user信息）
  .use(authorizeAccess)       // 权限检查（添加权限信息）
  .use(processBusinessLogic)  // 业务逻辑处理
  .use(formatResponse)        // 格式化响应

// 图片处理流水线
const imagePipeline = createPipeline<ImageFile, ProcessedImage>()
  .use(validateImageFormat)   // 验证格式
  .use(extractMetadata)       // 提取元数据
  .use(resizeImage)          // 调整尺寸
  .use(optimizeQuality)      // 优化质量
  .use(addWatermark)         // 添加水印
  .use(saveToStorage)        // 保存到存储
```

### next() 的深层理解

`next(data)` 不只是"继续下一步"，它是：
- **数据传递器**：将处理后的数据传给下一个中间件
- **控制流程**：决定是否继续执行后续步骤
- **类型守护**：确保传递的数据符合类型约定

现在你已经掌握了数据流动的精髓！接下来让我们学习如何在中间件之间共享状态。

---

## 第四步：Context：共享的记忆

到现在为止，我们只能通过 `next(data)` 在中间件之间传递数据。但有时候，我们需要**在所有步骤之间共享某些状态信息**。这就是 Context（上下文）的作用！

### 什么是 Context？

Context 就像是流水线工作区的**共享记事本**：
- 任何工作站都可以在上面写东西
- 任何工作站都可以读取上面的内容
- 每次处理新包裹时，记事本重新开始

### 基础用法：处理时间追踪

让我们为用户注册流程添加**处理时间统计**：

```typescript
import { createPipeline, createContext } from 'farrow-pipeline'

interface UserRequest {
  username: string
  email: string
}

interface UserResponse {
  success: boolean
  message: string
  userId?: string
  processingTime?: number  // 新增：处理时间
}

// 创建 Context - 就像创建一个共享记事本
const StartTimeContext = createContext<number>(0)

const registerPipeline = createPipeline<UserRequest, UserResponse>()

// 步骤1：记录开始时间
registerPipeline.use((request, next) => {
  console.log('⏰ 记录开始时间')
  
  // 在共享记事本上写下开始时间
  StartTimeContext.set(Date.now())
  
  return next(request)
})

// 步骤2：验证用户名（耗时操作）
registerPipeline.use((request, next) => {
  console.log('👤 验证用户名...')
  
  // 模拟耗时操作
  const simulatedDelay = Math.random() * 100
  const start = Date.now()
  while (Date.now() - start < simulatedDelay) {}
  
  if (request.username.length < 3) {
    // 即使在错误情况下，也可以读取开始时间
    const startTime = StartTimeContext.get()
    const processingTime = Date.now() - startTime
    
    return {
      success: false,
      message: '用户名太短',
      processingTime
    }
  }
  
  return next(request)
})

// 步骤3：验证邮箱（另一个耗时操作）
registerPipeline.use((request, next) => {
  console.log('📧 验证邮箱...')
  
  // 又一个模拟耗时操作
  const simulatedDelay = Math.random() * 50
  const start = Date.now()
  while (Date.now() - start < simulatedDelay) {}
  
  if (!request.email.includes('@')) {
    const startTime = StartTimeContext.get()
    const processingTime = Date.now() - startTime
    
    return {
      success: false,
      message: '邮箱格式错误',
      processingTime
    }
  }
  
  return next(request)
})

// 步骤4：创建用户
registerPipeline.use((request) => {
  console.log('✅ 创建用户账号')
  
  // 读取开始时间，计算总处理时间
  const startTime = StartTimeContext.get()
  const processingTime = Date.now() - startTime
  
  return {
    success: true,
    message: '注册成功！',
    userId: 'USER_' + Math.random().toString(36).substr(2, 8),
    processingTime
  }
})

// 🧪 测试
const request1 = { username: 'alice', email: 'alice@example.com' }
const request2 = { username: 'ab', email: 'invalid-email' }

console.log('测试1:', registerPipeline.run(request1))
// 输出: { success: true, message: '注册成功！', userId: 'USER_abc123', processingTime: 156 }

console.log('测试2:', registerPipeline.run(request2))
// 输出: { success: false, message: '用户名太短', processingTime: 89 }
```

### Context 的核心特点

1. **跨步骤共享**：任何中间件都可以读写 Context
2. **自动隔离**：每次 `pipeline.run()` 都有独立的 Context 实例
3. **类型安全**：`createContext<T>()` 确保存储的数据类型正确

### 多个 Context 协作

在复杂场景中，我们通常需要多个 Context：

```typescript
import { createPipeline, createContext } from 'farrow-pipeline'

interface ApiRequest {
  url: string
  token?: string
}

interface ApiResponse {
  status: number
  data: any
  metadata?: {
    userId?: string
    requestId: string
    processingTime: number
  }
}

// 多个Context，各司其职
const RequestIdContext = createContext<string>('')
const UserContext = createContext<{ id: string, name: string } | null>(null)
const TimingContext = createContext<{ start: number, steps: Array<{ name: string, time: number }> }>({
  start: 0,
  steps: []
})

const apiPipeline = createPipeline<ApiRequest, ApiResponse>()

// 步骤1：初始化
apiPipeline.use((request, next) => {
  const requestId = `REQ_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`
  const startTime = Date.now()
  
  RequestIdContext.set(requestId)
  TimingContext.set({ start: startTime, steps: [] })
  
  console.log(`🆔 请求 ${requestId} 开始处理`)
  return next(request)
})

// 步骤2：认证
apiPipeline.use((request, next) => {
  const requestId = RequestIdContext.get()
  const stepStart = Date.now()
  
  console.log(`🔐 [${requestId}] 验证用户身份`)
  
  if (request.token === 'valid-token') {
    UserContext.set({ id: 'user123', name: 'Alice' })
  }
  
  // 记录此步骤的耗时
  const timing = TimingContext.get()
  timing.steps.push({ name: 'auth', time: Date.now() - stepStart })
  TimingContext.set(timing)
  
  return next(request)
})

// 步骤3：处理业务逻辑
apiPipeline.use((request, next) => {
  const requestId = RequestIdContext.get()
  const user = UserContext.get()
  const stepStart = Date.now()
  
  console.log(`💼 [${requestId}] 处理业务逻辑`)
  
  if (!user) {
    return {
      status: 401,
      data: { error: 'Unauthorized' },
      metadata: {
        requestId: RequestIdContext.get(),
        processingTime: Date.now() - TimingContext.get().start
      }
    }
  }
  
  // 模拟业务处理
  const simulatedWork = Math.random() * 50
  const start = Date.now()
  while (Date.now() - start < simulatedWork) {}
  
  const timing = TimingContext.get()
  timing.steps.push({ name: 'business', time: Date.now() - stepStart })
  TimingContext.set(timing)
  
  return next(request)
})

// 步骤4：生成响应
apiPipeline.use((request) => {
  const requestId = RequestIdContext.get()
  const user = UserContext.get()
  const timing = TimingContext.get()
  const totalTime = Date.now() - timing.start
  
  console.log(`📦 [${requestId}] 生成响应 (总耗时: ${totalTime}ms)`)
  
  return {
    status: 200,
    data: { 
      message: `Hello, ${user?.name}!`,
      url: request.url
    },
    metadata: {
      userId: user?.id,
      requestId,
      processingTime: totalTime
    }
  }
})

// 🧪 测试
console.log('=== 成功请求 ===')
const successResult = apiPipeline.run({ 
  url: '/api/profile', 
  token: 'valid-token' 
})
console.log(JSON.stringify(successResult, null, 2))

console.log('\n=== 未认证请求 ===')
const failResult = apiPipeline.run({ 
  url: '/api/profile' 
})
console.log(JSON.stringify(failResult, null, 2))
```

### Context 的最佳实践

1. **明确职责**：每个 Context 负责特定类型的数据
2. **合理命名**：使用描述性的名称，如 `UserContext`、`TimingContext`
3. **默认值**：始终为 Context 设置合理的默认值
4. **类型约束**：使用 TypeScript 类型确保数据结构正确

现在你已经掌握了 Context 的用法！接下来我们学习 Container 的概念。

---

## 第五步：Container：幕后的隔离机制

你可能注意到一个细节：每次调用 `pipeline.run()` 时，Context 都会重新开始，互不干扰。这是如何实现的？

### 什么是 Container？

**Container（容器）** 是 Farrow Pipeline 的幕后英雄：
- 每次 `pipeline.run()` 都会自动创建一个独立的 Container
- Container 负责管理该次运行的所有 Context 数据
- 多个请求并发时，各自的 Context 完全隔离

### Container 的实现原理

Container 基于 Node.js 的 **AsyncLocalStorage** 实现：
- 这是 Node.js 提供的异步上下文追踪 API
- 能够在异步调用链中保持上下文状态
- **因此 Farrow Pipeline 主要面向 Node.js 服务端环境**
- 浏览器环境缺少 AsyncLocalStorage，Context 功能会受限

### 简单验证：Context 自动隔离

```typescript
import { createPipeline, createContext } from 'farrow-pipeline'

const CounterContext = createContext<number>(0)

const pipeline = createPipeline<string, { input: string, count: number }>()

pipeline.use((input, next) => {
  // 每个请求都从 0 开始计数
  const current = CounterContext.get()
  CounterContext.set(current + 1)
  return next(input)
})

pipeline.use((input) => {
  return {
    input,
    count: CounterContext.get()
  }
})

// 多次运行，每次都独立计数
console.log(pipeline.run('第一次'))  // { input: '第一次', count: 1 }
console.log(pipeline.run('第二次'))  // { input: '第二次', count: 1 }
console.log(pipeline.run('第三次'))  // { input: '第三次', count: 1 }
```

### 测试专用 Container

有时我们需要为测试预设 Context 值：

```typescript
import { createContainer } from 'farrow-pipeline'

const UserContext = createContext<string>('anonymous')

// 创建测试专用的 Container，预设用户为 'test-user'
const testContainer = createContainer({
  user: UserContext.create('test-user')
})

// 使用测试 Container
const result = pipeline.run(
  { action: 'getData' },
  { container: testContainer }
)
// 这次运行中，UserContext.get() 将返回 'test-user'
```

### 核心要点

1. **自动工作**：Container 在后台自动管理，你通常不需要关心
2. **完全隔离**：每次 `run()` 都有独立的 Context 环境
3. **并发安全**：多个请求同时处理时不会冲突
4. **测试友好**：可以为测试创建预设的 Container

大多数时候，你只需要知道"Context 会自动隔离"就够了！

---

## 第六步：Pipeline 嵌套的正确姿势

现在你已经掌握了 Pipeline 的基础概念，让我们学习如何**正确地组合多个 Pipeline**。这里我们要重点介绍 `usePipeline` 的**真正用途**。

### 两种嵌套方式

Farrow Pipeline 提供了两种嵌套 Pipeline 的方式：

#### **直接嵌套**：简单且高效

当 Pipeline 的输入输出类型兼容时，可以直接嵌套：

```typescript
import { createPipeline } from 'farrow-pipeline'

type User = { username: string; email: string }
type Result = { ok: boolean }

// 子 Pipeline：验证并标记结果
const validate = createPipeline<User, { user: User; valid: boolean }>()
validate.use((u) => ({
  user: u,
  valid: u.username.length >= 3 && u.email.includes('@'),
}))

// 主 Pipeline：直接嵌套子 Pipeline
const main = createPipeline<User, Result>()
main.use(validate)
main.use(({ valid }) => ({ ok: valid }))

// main.run({ username: 'alice', email: 'a@b.com' }) -> { ok: true }
```

#### **usePipeline**：Context 传递和错误处理

`usePipeline` 的真正用途是：
- **保持 Context 传递**：确保子 Pipeline 能访问父 Pipeline 的 Context
- **错误处理**：可以用 try-catch 处理子 Pipeline 的错误
- **返回值处理**：对子 Pipeline 的结果进行进一步处理

```typescript
import { createPipeline, usePipeline } from 'farrow-pipeline'

// 不同签名的子 Pipeline：输入输出逐步变换
type Incoming = { authorization?: string }
type Authed = { userId: string }
type Order = { userId: string; items: string[] }
type Response = { status: number; body?: any }

// 认证：Incoming -> Authed（可能抛错）
const authenticate = createPipeline<Incoming, Authed>()
authenticate.use((req) => {
  if (req.authorization !== 'token') throw new Error('unauthorized')
  return { userId: 'u1' }
})

// 组装订单：Authed -> Order
const buildOrder = createPipeline<Authed, Order>()
buildOrder.use((u) => ({ userId: u.userId, items: ['book'] }))

// 结算：Order -> Response
const checkout = createPipeline<Order, Response>()
checkout.use((order) => ({ status: 200, body: { order } }))

// 主 Pipeline：Incoming -> Response
const main = createPipeline<Incoming, Response>()
main.use((req) => {
  const runAuth = usePipeline(authenticate)
  const runBuild = usePipeline(buildOrder)
  const runCheckout = usePipeline(checkout)
  try {
    const authed = runAuth(req)        // Incoming -> Authed
    const order = runBuild(authed)     // Authed -> Order
    return runCheckout(order)          // Order -> Response
  } catch {
    return { status: 401 }
  }
})
```

### 何时使用哪种方式？

| 场景 | 推荐方式 | 原因 |
|------|----------|------|
| 类型兼容的简单组合 | 直接嵌套 | 简洁高效，类型安全 |
| 需要错误处理 | usePipeline | 可以 try-catch 处理错误 |
| 需要 Context 传递 | usePipeline | 确保子 Pipeline 能访问父 Context |
| 需要处理返回值 | usePipeline | 可以对子 Pipeline 结果做后处理 |

### 常见错误用法

```typescript
// ❌ 错误：不要把 usePipeline 当作函数组合工具
const logger = usePipeline(createLogger())
const auth = usePipeline(createAuth())
return auth(logger(request))  // 这是错误的！

// ✅ 正确：usePipeline 的真正用途
mainPipeline.use((request, next) => {
  const runAuth = usePipeline(authPipeline)
  
  try {
    const authenticatedRequest = runAuth(request)
    return next(authenticatedRequest)
  } catch (error) {
    return { error: 'Authentication failed' }
  }
})
```

### usePipeline 的核心价值

1. **Context 继承**：子 Pipeline 自动继承父 Pipeline 的 Container 和 Context
2. **错误边界**：为子 Pipeline 提供错误处理机制
3. **灵活控制**：可以根据子 Pipeline 的结果决定下一步操作

现在你已经掌握了 Pipeline 嵌套的正确姿势！

---

## 总结

🎉 **恭喜！** 你已经完成了 Farrow Pipeline 的完整学习之旅！

## 核心概念掌握清单

✅ **Pipeline = 类型安全的流水线**
- 数据按顺序通过中间件处理
- TypeScript 类型约束确保安全

✅ **Context = 跨中间件的共享记忆**  
- 在所有处理步骤间传递状态
- 自动隔离，并发安全

✅ **Container = 独立的工作空间**
- 每次 `run()` 创建隔离环境
- 多请求并发处理不干扰
- 基于 Node.js 的 AsyncLocalStorage 实现

✅ **usePipeline = Context 传递 + 错误处理**
- 保持子 Pipeline 的 Context 继承
- 提供 try-catch 错误处理能力
- **不是函数组合工具！**

## 从入门到实战的学习路径

1. 🏠 **快递分拣中心比喻** → 理解 Pipeline 基本概念
2. ⚡ **5分钟快速上手** → 掌握最基础的用法
3. 🔄 **数据流动机制** → 理解 `next()` 的作用
4. 📦 **Context 状态共享** → 跨中间件传递数据
5. 🏗️ **Container 隔离机制** → 并发安全的奥秘
6. 🔧 **Pipeline 嵌套技巧** → 正确使用 usePipeline

## 关键要点总结

### **推荐做法**
```typescript
// 直接嵌套：类型兼容时
mainPipeline.use(subPipeline)

// usePipeline：需要 Context 传递或错误处理时
const runSubPipeline = usePipeline(subPipeline)
try {
  const result = runSubPipeline(input)
  return next(result)
} catch (error) {
  return handleError(error)
}
```

### **避免误区**
```typescript
// 错误：把 usePipeline 当函数组合用
return auth(logger(request))  // ❌

// 正确：在中间件内使用 usePipeline
pipeline.use((request, next) => {
  const runAuth = usePipeline(authPipeline)
  // ... 处理逻辑
})
```

## 下一步

你现在已经具备了构建**企业级中间件系统**的能力！可以开始：

- 🏗️ **构建自己的 Web 框架**中间件
- 📊 **设计数据处理流水线**
- 🔧 **创建可复用的业务组件**
- 🚀 **优化现有项目的架构**

### ⚠️ 重要提醒

**Farrow Pipeline 主要面向 Node.js 服务端环境**，因为：
- Container 基于 Node.js 的 AsyncLocalStorage 实现
- 浏览器环境缺少此 API，Context 功能会受到限制
- 建议在 Node.js 服务端项目中使用

### 深入学习

- [📖 完整 API 参考](/api/farrow-pipeline) - 了解所有可用功能
- [⚡ 异步 Pipeline](/api/farrow-pipeline#createasyncpipeline) - 处理异步场景
- [🛠️ 最佳实践](/api/farrow-pipeline#最佳实践) - 生产环境指南

**Happy Coding! 🚀**
