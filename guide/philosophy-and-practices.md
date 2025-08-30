# Farrow 哲学与最佳实践

> 深入理解 Farrow 的设计哲学，掌握最佳实践模式 🎯

## Farrow 的哲学基础

### 三大核心原则

<div class="philosophy-pillars">

#### 1. 类型即真理 (Type as Truth)

> "让编译器成为你的第一道防线"

在 Farrow 的世界观中，类型不是约束，而是解放。通过精确的类型定义，我们让不可能的状态在编译时就被拒绝。

```typescript
// ❌ 传统方式：运行时才发现错误
function processUser(data: any) {
  // data.age 可能是 string？number？undefined？
  if (data.age > 18) {  // 运行时可能崩溃
    // ...
  }
}

// ✅ Farrow 方式：编译时保证正确
class User extends ObjectType {
  age = Number  // 明确的类型定义
}

function processUser(user: TypeOf<typeof User>) {
  if (user.age > 18) {  // 编译器保证 age 是 number
    // ...
  }
}
```

**原则应用：**
- 使用 Schema 而不是接口定义数据结构
- 让 TypeScript 推导而不是手动标注类型
- 优先编译时错误而不是运行时检查

#### 2. 纯函数优先 (Pure Function First)

> "副作用推到边界，核心保持纯净"

Farrow 鼓励用纯函数构建应用的核心逻辑，将副作用（I/O、数据库、网络）推到应用的边界。

```typescript
// ❌ 混合了副作用的业务逻辑
async function createPost(data: any) {
  const user = await db.getUser(data.userId)  // 副作用
  if (!user.canPost) {  // 业务逻辑
    throw new Error('Cannot post')
  }
  const post = await db.createPost(data)  // 副作用
  await emailService.notify(user)  // 副作用
  return post
}

// ✅ 纯净的业务逻辑
// 纯函数：业务规则
function canUserPost(user: User): boolean {
  return user.role === 'author' || user.role === 'admin'
}

function preparePostData(data: CreatePostInput, user: User): PostData {
  return {
    ...data,
    authorId: user.id,
    createdAt: new Date(),
    status: 'draft'
  }
}

// 副作用在边界处理
app.post('/posts', { body: CreatePostSchema }).use((request) => {
  const user = useCurrentUser()  // 副作用：读取 Context
  
  if (!canUserPost(user)) {  // 纯函数：业务逻辑
    return Response.status(403).json({ error: 'Cannot post' })
  }
  
  const postData = preparePostData(request.body, user)  // 纯函数
  const post = createPost(postData)  // 副作用：数据库
  
  return Response.status(201).json(post)
})
```

#### 3. 组合优于配置 (Composition over Configuration)

> "小而美的组件，无限的可能"

Farrow 倾向于通过组合简单的组件来构建复杂的功能，而不是通过配置文件。

```typescript
// ❌ 配置驱动
const app = createApp({
  middleware: ['cors', 'auth', 'logger'],
  cors: { origin: '*' },
  auth: { secret: 'xxx' },
  logger: { level: 'info' },
  routes: [
    { path: '/users', method: 'GET', handler: getUsers },
    { path: '/users', method: 'POST', handler: createUser }
  ]
})

// ✅ 组合驱动
const app = Http()

// 组合中间件
app.use(cors({ origin: '*' }))
app.use(auth({ secret: 'xxx' }))
app.use(logger({ level: 'info' }))

// 组合路由
const userRouter = Router()
userRouter.get('/').use(getUsers)
userRouter.post('/').use(createUser)

app.route('/users').use(userRouter)
```

</div>

## 设计模式与最佳实践

### 1. Schema 设计模式

#### 分层 Schema

将 Schema 按照用途分层，提高复用性：

```typescript
// Layer 1: 领域模型（核心业务实体）
class User extends ObjectType {
  id = Number
  username = String
  email = EmailType
  passwordHash = String
  role = Union(Literal('admin'), Literal('author'), Literal('reader'))
  profile = {
    firstName: String,
    lastName: String,
    bio: Optional(String),
    avatar: Optional(String)
  }
  createdAt = Date
  updatedAt = Date
}

// Layer 2: API Schema（请求/响应）
// 注册请求：只需要必要字段
const RegisterRequest = pickObject(User, ['username', 'email'])
  .extend({ password: StringLength(8, 100) })

// 公开信息：排除敏感字段
const PublicUser = omitObject(User, ['passwordHash', 'email'])

// 更新请求：所有字段可选
const UpdateUserRequest = partial(pickObject(User, ['profile']))

// Layer 3: 视图 Schema（前端展示）
const UserSummary = pickObject(PublicUser, ['id', 'username', 'profile.avatar'])
const UserDetail = PublicUser
```

#### Schema 继承模式

使用组合和扩展来实现 Schema 的继承：

```typescript
// 基础时间戳
const TimestampFields = {
  createdAt: Date,
  updatedAt: Date
}

// 基础实体
class BaseEntity extends ObjectType {
  id = Number
  ...TimestampFields
}

// 可发布内容
const PublishableFields = {
  status: Union(Literal('draft'), Literal('published'), Literal('archived')),
  publishedAt: Optional(Date)
}

// 文章实体
class Article extends ObjectType {
  ...BaseEntity  // "继承"基础实体
  title = String
  content = String
  ...PublishableFields  // 混入可发布特性
}

// 页面实体
class Page extends ObjectType {
  ...BaseEntity
  title = String
  slug = String
  content = String
  ...PublishableFields
}
```

### 2. 中间件设计模式

#### 职责链模式

每个中间件负责单一职责，通过链式组合实现复杂功能：

```typescript
// 每个中间件只做一件事
const requestId = (request, next) => {
  RequestIdContext.set(generateId())
  return next(request).header('X-Request-ID', RequestIdContext.get())
}

const timer = (request, next) => {
  const start = Date.now()
  const response = next(request)
  const duration = Date.now() - start
  return response.header('X-Response-Time', `${duration}ms`)
}

const logger = (request, next) => {
  const id = RequestIdContext.get()
  console.log(`[${id}] ${request.method} ${request.pathname}`)
  return next(request)
}

// 组合成完整功能
app.use(requestId)
app.use(timer)
app.use(logger)
```

#### 装饰器模式

使用高阶函数创建可配置的中间件：

```typescript
// 缓存装饰器
function withCache(ttl = 60000) {
  const cache = new Map()
  
  return (handler: Handler) => {
    return async (request) => {
      const key = getCacheKey(request)
      
      // 检查缓存
      if (cache.has(key)) {
        const { data, timestamp } = cache.get(key)
        if (Date.now() - timestamp < ttl) {
          return Response.json(data).header('X-Cache', 'HIT')
        }
      }
      
      // 执行原始处理器
      const response = await handler(request)
      
      // 缓存结果
      if (response.info.status?.code === 200) {
        cache.set(key, {
          data: response.info.body?.value,
          timestamp: Date.now()
        })
      }
      
      return response.header('X-Cache', 'MISS')
    }
  }
}

// 使用装饰器
app.get('/api/posts')
  .use(withCache(300000)(  // 5分钟缓存
    (request) => Response.json(getPosts())
  ))
```

#### 策略模式

根据条件选择不同的处理策略：

```typescript
// 认证策略
interface AuthStrategy {
  authenticate(request: RequestInfo): User | null
}

class JWTStrategy implements AuthStrategy {
  authenticate(request) {
    const token = request.headers?.authorization?.replace('Bearer ', '')
    if (!token) return null
    
    try {
      return jwt.verify(token, SECRET)
    } catch {
      return null
    }
  }
}

class SessionStrategy implements AuthStrategy {
  authenticate(request) {
    const sessionId = request.cookies?.sessionId
    if (!sessionId) return null
    
    return getSession(sessionId)?.user || null
  }
}

class APIKeyStrategy implements AuthStrategy {
  authenticate(request) {
    const apiKey = request.headers?.['x-api-key']
    if (!apiKey) return null
    
    return getUserByApiKey(apiKey)
  }
}

// 组合多种策略
function createAuthMiddleware(strategies: AuthStrategy[]) {
  return (request, next) => {
    for (const strategy of strategies) {
      const user = strategy.authenticate(request)
      if (user) {
        UserContext.set(user)
        return next(request)
      }
    }
    
    return Response.status(401).json({ error: 'Unauthorized' })
  }
}

// 使用
app.use(createAuthMiddleware([
  new JWTStrategy(),
  new SessionStrategy(),
  new APIKeyStrategy()
]))
```

### 3. Context 使用模式

#### 依赖注入模式

使用 Context 实现依赖注入：

```typescript
// 定义服务接口
interface DatabaseService {
  getUser(id: number): User | null
  createUser(data: CreateUserInput): User
}

interface EmailService {
  sendWelcome(user: User): Promise<void>
  sendPasswordReset(email: string): Promise<void>
}

interface CacheService {
  get<T>(key: string): T | null
  set<T>(key: string, value: T, ttl?: number): void
}

// 创建 Context
const DatabaseContext = createContext<DatabaseService>()
const EmailContext = createContext<EmailService>()
const CacheContext = createContext<CacheService>()

// 注入依赖
app.use((request, next) => {
  // 根据环境注入不同实现
  if (process.env.NODE_ENV === 'test') {
    DatabaseContext.set(new MockDatabase())
    EmailContext.set(new MockEmailService())
    CacheContext.set(new MemoryCache())
  } else {
    DatabaseContext.set(new PostgresDatabase())
    EmailContext.set(new SendGridService())
    CacheContext.set(new RedisCache())
  }
  
  return next(request)
})

// 使用依赖
function useDatabase() {
  const db = DatabaseContext.get()
  if (!db) throw new Error('Database not initialized')
  return db
}

app.post('/users', { body: CreateUserRequest }).use(async (request) => {
  const db = useDatabase()
  const email = EmailContext.get()
  const cache = CacheContext.get()
  
  // 使用注入的服务
  const user = db.createUser(request.body)
  await email?.sendWelcome(user)
  cache?.set(`user:${user.id}`, user)
  
  return Response.status(201).json(user)
})
```

#### 请求追踪模式

使用 Context 实现请求级的追踪：

```typescript
// 追踪 Context
const TraceContext = createContext({
  requestId: '',
  userId: null as number | null,
  startTime: 0,
  spans: [] as Array<{ name: string, duration: number }>
})

// 追踪中间件
const tracing = (request, next) => {
  TraceContext.set({
    requestId: generateId(),
    userId: null,
    startTime: Date.now(),
    spans: []
  })
  
  const response = next(request)
  
  const trace = TraceContext.get()
  const totalDuration = Date.now() - trace.startTime
  
  console.log(JSON.stringify({
    requestId: trace.requestId,
    userId: trace.userId,
    duration: totalDuration,
    spans: trace.spans
  }))
  
  return response
}

// 追踪函数
function traceOperation<T>(name: string, operation: () => T): T {
  const start = Date.now()
  
  try {
    return operation()
  } finally {
    const trace = TraceContext.get()
    trace.spans.push({
      name,
      duration: Date.now() - start
    })
  }
}

// 使用追踪
app.get('/api/posts').use(() => {
  const posts = traceOperation('fetchPosts', () => {
    return getPosts()
  })
  
  const formatted = traceOperation('formatPosts', () => {
    return posts.map(formatPost)
  })
  
  return Response.json(formatted)
})
```

### 4. 错误处理模式

#### Result 模式

使用 Result 类型处理可能失败的操作：

```typescript
import { Result, Ok, Err } from 'farrow-schema/result'

// 定义业务错误
type BusinessError = 
  | { type: 'NOT_FOUND', resource: string }
  | { type: 'VALIDATION', field: string, message: string }
  | { type: 'PERMISSION', action: string }
  | { type: 'CONFLICT', message: string }

// 业务函数返回 Result
function createUser(data: CreateUserInput): Result<User, BusinessError> {
  // 验证唯一性
  if (userExists(data.email)) {
    return Err({ 
      type: 'CONFLICT', 
      message: 'Email already exists' 
    })
  }
  
  // 创建用户
  const user = insertUser(data)
  return Ok(user)
}

function updatePost(id: number, data: UpdatePostInput): Result<Post, BusinessError> {
  const post = getPost(id)
  
  if (!post) {
    return Err({ 
      type: 'NOT_FOUND', 
      resource: 'Post' 
    })
  }
  
  const user = useCurrentUser()
  if (post.authorId !== user.id) {
    return Err({ 
      type: 'PERMISSION', 
      action: 'update post' 
    })
  }
  
  const updated = updatePostData(id, data)
  return Ok(updated)
}

// 统一处理 Result
function handleBusinessResult<T>(result: Result<T, BusinessError>): Response {
  if (result.isOk) {
    return Response.json(result.value)
  }
  
  const error = result.value
  
  switch (error.type) {
    case 'NOT_FOUND':
      return Response.status(404).json({
        error: `${error.resource} not found`
      })
    
    case 'VALIDATION':
      return Response.status(400).json({
        error: 'Validation failed',
        field: error.field,
        message: error.message
      })
    
    case 'PERMISSION':
      return Response.status(403).json({
        error: `No permission to ${error.action}`
      })
    
    case 'CONFLICT':
      return Response.status(409).json({
        error: error.message
      })
  }
}

// 使用
app.post('/users', { body: CreateUserRequest }).use((request) => {
  const result = createUser(request.body)
  return handleBusinessResult(result)
})
```

#### 错误恢复模式

实现优雅的错误恢复：

```typescript
// 重试机制
function withRetry<T>(
  operation: () => Promise<T>,
  options = { maxAttempts: 3, delay: 1000, backoff: 2 }
): Promise<T> {
  return async function attempt(attemptNumber = 1): Promise<T> {
    try {
      return await operation()
    } catch (error) {
      if (attemptNumber >= options.maxAttempts) {
        throw error
      }
      
      const delay = options.delay * Math.pow(options.backoff, attemptNumber - 1)
      await sleep(delay)
      
      console.log(`Retry attempt ${attemptNumber + 1}/${options.maxAttempts}`)
      return attempt(attemptNumber + 1)
    }
  }()
}

// 降级机制
function withFallback<T>(
  primary: () => Promise<T>,
  fallback: () => Promise<T>
): Promise<T> {
  return primary().catch(error => {
    console.warn('Primary failed, using fallback:', error)
    return fallback()
  })
}

// 熔断器模式
class CircuitBreaker {
  private failures = 0
  private lastFailTime = 0
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED'
  
  constructor(
    private threshold = 5,
    private timeout = 60000
  ) {}
  
  async execute<T>(operation: () => Promise<T>): Promise<T> {
    // 检查熔断器状态
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailTime > this.timeout) {
        this.state = 'HALF_OPEN'
      } else {
        throw new Error('Circuit breaker is OPEN')
      }
    }
    
    try {
      const result = await operation()
      
      if (this.state === 'HALF_OPEN') {
        this.state = 'CLOSED'
        this.failures = 0
      }
      
      return result
    } catch (error) {
      this.failures++
      this.lastFailTime = Date.now()
      
      if (this.failures >= this.threshold) {
        this.state = 'OPEN'
      }
      
      throw error
    }
  }
}

// 使用
const apiBreaker = new CircuitBreaker()

app.get('/external-data').use(async () => {
  try {
    const data = await apiBreaker.execute(() =>
      withRetry(() =>
        withFallback(
          () => fetchFromPrimaryAPI(),
          () => fetchFromSecondaryAPI()
        )
      )
    )
    
    return Response.json(data)
  } catch (error) {
    return Response.status(503).json({
      error: 'Service temporarily unavailable'
    })
  }
})
```

## 项目架构最佳实践

### 目录结构

```
src/
├── schemas/              # Schema 定义
│   ├── entities/        # 领域实体
│   │   ├── user.ts
│   │   └── post.ts
│   ├── requests/        # 请求 Schema
│   │   └── auth.ts
│   └── responses/       # 响应 Schema
│       └── api.ts
├── middlewares/         # 中间件
│   ├── auth.ts
│   ├── cors.ts
│   └── logger.ts
├── contexts/            # Context 定义
│   ├── user.ts
│   └── database.ts
├── services/            # 业务服务
│   ├── user.service.ts
│   └── post.service.ts
├── routes/              # 路由模块
│   ├── auth.routes.ts
│   └── post.routes.ts
├── utils/               # 工具函数
│   ├── validators/      # 自定义验证器
│   └── helpers/         # 辅助函数
├── config/              # 配置
│   └── index.ts
└── index.ts            # 应用入口
```

### 模块化架构

```typescript
// services/user.service.ts
export class UserService {
  constructor(
    private db: DatabaseService,
    private email: EmailService
  ) {}
  
  async createUser(data: CreateUserInput): Promise<Result<User, BusinessError>> {
    // 业务逻辑
  }
  
  async updateUser(id: number, data: UpdateUserInput): Promise<Result<User, BusinessError>> {
    // 业务逻辑
  }
}

// routes/user.routes.ts
export function createUserRouter(userService: UserService) {
  const router = Router()
  
  router.post('/', { body: CreateUserRequest }).use(async (request) => {
    const result = await userService.createUser(request.body)
    return handleBusinessResult(result)
  })
  
  router.put('/<id:int>', { body: UpdateUserRequest }).use(async (request) => {
    const result = await userService.updateUser(
      request.params.id,
      request.body
    )
    return handleBusinessResult(result)
  })
  
  return router
}

// index.ts
const app = Http()

// 依赖注入
app.use((request, next) => {
  const db = new DatabaseService()
  const email = new EmailService()
  const userService = new UserService(db, email)
  
  ServiceContext.set({ userService })
  
  return next(request)
})

// 路由注册
const services = ServiceContext.get()
app.route('/api/users').use(createUserRouter(services.userService))
```

## 性能优化原则

### 1. 惰性加载

```typescript
// 按需加载大型依赖
const heavyRouter = Router()

heavyRouter.get('/process').use(async (request) => {
  // 只在需要时加载
  const { processData } = await import('./heavy-processor')
  const result = await processData(request.query)
  return Response.json(result)
})
```

### 2. 缓存策略

```typescript
// 多级缓存
const cache = {
  memory: new Map(),
  redis: new RedisClient()
}

async function getCached<T>(
  key: string,
  factory: () => Promise<T>,
  ttl = 60000
): Promise<T> {
  // L1: 内存缓存
  if (cache.memory.has(key)) {
    return cache.memory.get(key)
  }
  
  // L2: Redis 缓存
  const redisValue = await cache.redis.get(key)
  if (redisValue) {
    const data = JSON.parse(redisValue)
    cache.memory.set(key, data)
    return data
  }
  
  // L3: 源数据
  const data = await factory()
  
  // 写入缓存
  cache.memory.set(key, data)
  await cache.redis.setex(key, ttl / 1000, JSON.stringify(data))
  
  return data
}
```

### 3. 批处理

```typescript
// 批量操作优化
class BatchProcessor<T, R> {
  private batch: T[] = []
  private timer: NodeJS.Timeout | null = null
  
  constructor(
    private processor: (items: T[]) => Promise<R[]>,
    private maxSize = 100,
    private maxWait = 100
  ) {}
  
  async add(item: T): Promise<R> {
    return new Promise((resolve, reject) => {
      this.batch.push(item)
      
      if (this.batch.length >= this.maxSize) {
        this.flush()
      } else if (!this.timer) {
        this.timer = setTimeout(() => this.flush(), this.maxWait)
      }
    })
  }
  
  private async flush() {
    if (this.timer) {
      clearTimeout(this.timer)
      this.timer = null
    }
    
    const batch = this.batch
    this.batch = []
    
    if (batch.length > 0) {
      await this.processor(batch)
    }
  }
}
```

## 测试策略

### 单元测试

```typescript
import { describe, it, expect } from 'vitest'

describe('UserService', () => {
  it('should create user with valid data', async () => {
    const mockDb = {
      insertUser: vi.fn().mockResolvedValue({ id: 1, ...userData })
    }
    
    const service = new UserService(mockDb)
    const result = await service.createUser(userData)
    
    expect(result.isOk).toBe(true)
    expect(result.value).toMatchObject(userData)
  })
})
```

### 集成测试

```typescript
import request from 'supertest'

describe('User API', () => {
  const app = createTestApp()
  
  it('POST /users should create user', async () => {
    const response = await request(app.server())
      .post('/api/users')
      .send({ name: 'John', email: 'john@example.com' })
      .expect(201)
    
    expect(response.body).toHaveProperty('id')
    expect(response.body.name).toBe('John')
  })
})
```

## 小结

Farrow 的哲学和最佳实践可以总结为：

### 核心理念
- 🎯 **类型即真理** - 让编译器帮你捕获错误
- 🧩 **纯函数优先** - 将副作用推到边界
- 🔄 **组合优于配置** - 用小组件构建大系统

### 设计原则
- 📐 **单一职责** - 每个组件只做一件事
- 🎨 **依赖注入** - 使用 Context 管理依赖
- 🛡️ **防御性编程** - 使用 Result 类型处理错误
- ⚡ **性能优先** - 惰性加载、缓存、批处理

### 最佳实践
- 📁 **模块化架构** - 清晰的项目结构
- 🧪 **测试驱动** - 单元测试 + 集成测试
- 📊 **可观测性** - 日志、追踪、指标
- 🔄 **持续改进** - 重构、优化、演进

通过遵循这些原则和实践，你可以构建出可靠、可维护、可扩展的 Farrow 应用。

---

<div class="doc-footer">
  <div class="doc-nav">
    <a href="./03-essentials.md">← 基础教程</a>
    <a href="../">返回首页 →</a>
  </div>
</div>