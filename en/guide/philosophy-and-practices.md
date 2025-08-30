# Farrow Philosophy and Best Practices

> Deeply understand Farrow's design philosophy and master best practice patterns

## Philosophical Foundation of Farrow

### Three Core Principles

<div class="philosophy-pillars">

#### 1. Type as Truth

> "Make the compiler your first line of defense"

In Farrow's worldview, types are not constraints but liberation. Through precise type definitions, we reject impossible states at compile time.

```typescript
// ❌ Traditional approach: errors discovered at runtime
function processUser(data: any) {
  // data.age could be string? number? undefined?
  if (data.age > 18) {  // might crash at runtime
    // ...
  }
}

// ✅ Farrow approach: correctness guaranteed at compile time
class User extends ObjectType {
  age = Number  // explicit type definition
}

function processUser(user: TypeOf<typeof User>) {
  if (user.age > 18) {  // compiler guarantees age is number
    // ...
  }
}
```

**Principle Applications:**
- Use Schema instead of interfaces to define data structures
- Let TypeScript infer rather than manually annotate types
- Prefer compile-time errors over runtime checks

#### 2. Pure Function First

> "Push side effects to boundaries, keep core logic pure"

Farrow encourages building application core logic with pure functions, pushing side effects (I/O, database, network) to application boundaries.

```typescript
// ❌ Business logic mixed with side effects
async function createPost(data: any) {
  const user = await db.getUser(data.userId)  // side effect
  if (!user.canPost) {  // business logic
    throw new Error('Cannot post')
  }
  const post = await db.createPost(data)  // side effect
  await emailService.notify(user)  // side effect
  return post
}

// ✅ Pure business logic
// Pure function: business rules
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

// Side effects handled at boundaries
app.post('/posts', { body: CreatePostSchema }).use((request) => {
  const user = useCurrentUser()  // side effect: read Context
  
  if (!canUserPost(user)) {  // pure function: business logic
    return Response.status(403).json({ error: 'Cannot post' })
  }
  
  const postData = preparePostData(request.body, user)  // pure function
  const post = createPost(postData)  // side effect: database
  
  return Response.status(201).json(post)
})
```

#### 3. Composition over Configuration

> "Small and beautiful components, infinite possibilities"

Farrow prefers building complex functionality through composing simple components rather than configuration files.

```typescript
// ❌ Configuration-driven
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

// ✅ Composition-driven
const app = Http()

// Compose middleware
app.use(cors({ origin: '*' }))
app.use(auth({ secret: 'xxx' }))
app.use(logger({ level: 'info' }))

// Compose routes
const userRouter = Router()
userRouter.get('/').use(getUsers)
userRouter.post('/').use(createUser)

app.route('/users').use(userRouter)
```

</div>

## Design Patterns and Best Practices

### 1. Schema Design Patterns

#### Layered Schema

Organize Schema by purpose in layers to improve reusability:

```typescript
// Layer 1: Domain models (core business entities)
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

// Layer 2: API Schema (request/response)
// Registration request: only necessary fields
const RegisterRequest = pickObject(User, ['username', 'email'])
  .extend({ password: StringLength(8, 100) })

// Public information: exclude sensitive fields
const PublicUser = omitObject(User, ['passwordHash', 'email'])

// Update request: all fields optional
const UpdateUserRequest = partial(pickObject(User, ['profile']))

// Layer 3: View Schema (frontend display)
const UserSummary = pickObject(PublicUser, ['id', 'username', 'profile.avatar'])
const UserDetail = PublicUser
```

#### Schema Inheritance Pattern

Use composition and extension to achieve Schema inheritance:

```typescript
// Base timestamp fields
const TimestampFields = {
  createdAt: Date,
  updatedAt: Date
}

// Base entity
class BaseEntity extends ObjectType {
  id = Number
  ...TimestampFields
}

// Publishable content
const PublishableFields = {
  status: Union(Literal('draft'), Literal('published'), Literal('archived')),
  publishedAt: Optional(Date)
}

// Article entity
class Article extends ObjectType {
  ...BaseEntity  // "inherit" base entity
  title = String
  content = String
  ...PublishableFields  // mixin publishable features
}

// Page entity
class Page extends ObjectType {
  ...BaseEntity
  title = String
  slug = String
  content = String
  ...PublishableFields
}
```

### 2. Middleware Design Patterns

#### Chain of Responsibility Pattern

Each middleware handles a single responsibility, achieving complex functionality through chain composition:

```typescript
// Each middleware does one thing
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

// Compose into complete functionality
app.use(requestId)
app.use(timer)
app.use(logger)
```

#### Decorator Pattern

Use higher-order functions to create configurable middleware:

```typescript
// Cache decorator
function withCache(ttl = 60000) {
  const cache = new Map()
  
  return (handler: Handler) => {
    return async (request) => {
      const key = getCacheKey(request)
      
      // Check cache
      if (cache.has(key)) {
        const { data, timestamp } = cache.get(key)
        if (Date.now() - timestamp < ttl) {
          return Response.json(data).header('X-Cache', 'HIT')
        }
      }
      
      // Execute original handler
      const response = await handler(request)
      
      // Cache result
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

// Use decorator
app.get('/api/posts')
  .use(withCache(300000)(  // 5-minute cache
    (request) => Response.json(getPosts())
  ))
```

#### Strategy Pattern

Choose different processing strategies based on conditions:

```typescript
// Authentication strategies
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

// Compose multiple strategies
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

// Usage
app.use(createAuthMiddleware([
  new JWTStrategy(),
  new SessionStrategy(),
  new APIKeyStrategy()
]))
```

### 3. Context Usage Patterns

#### Dependency Injection Pattern

Use Context to implement dependency injection:

```typescript
// Define service interfaces
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

// Create Contexts
const DatabaseContext = createContext<DatabaseService>()
const EmailContext = createContext<EmailService>()
const CacheContext = createContext<CacheService>()

// Inject dependencies
app.use((request, next) => {
  // Inject different implementations based on environment
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

// Use dependencies
function useDatabase() {
  const db = DatabaseContext.get()
  if (!db) throw new Error('Database not initialized')
  return db
}

app.post('/users', { body: CreateUserRequest }).use(async (request) => {
  const db = useDatabase()
  const email = EmailContext.get()
  const cache = CacheContext.get()
  
  // Use injected services
  const user = db.createUser(request.body)
  await email?.sendWelcome(user)
  cache?.set(`user:${user.id}`, user)
  
  return Response.status(201).json(user)
})
```

#### Request Tracing Pattern

Use Context to implement request-level tracing:

```typescript
// Trace Context
const TraceContext = createContext({
  requestId: '',
  userId: null as number | null,
  startTime: 0,
  spans: [] as Array<{ name: string, duration: number }>
})

// Tracing middleware
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

// Trace function
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

// Use tracing
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

### 4. Error Handling Patterns

#### Result Pattern

Use Result type to handle operations that might fail:

```typescript
import { Result, Ok, Err } from 'farrow-schema/result'

// Define business errors
type BusinessError = 
  | { type: 'NOT_FOUND', resource: string }
  | { type: 'VALIDATION', field: string, message: string }
  | { type: 'PERMISSION', action: string }
  | { type: 'CONFLICT', message: string }

// Business functions return Result
function createUser(data: CreateUserInput): Result<User, BusinessError> {
  // Validate uniqueness
  if (userExists(data.email)) {
    return Err({ 
      type: 'CONFLICT', 
      message: 'Email already exists' 
    })
  }
  
  // Create user
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

// Handle Result uniformly
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

// Usage
app.post('/users', { body: CreateUserRequest }).use((request) => {
  const result = createUser(request.body)
  return handleBusinessResult(result)
})
```

#### Error Recovery Pattern

Implement graceful error recovery:

```typescript
// Retry mechanism
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

// Fallback mechanism
function withFallback<T>(
  primary: () => Promise<T>,
  fallback: () => Promise<T>
): Promise<T> {
  return primary().catch(error => {
    console.warn('Primary failed, using fallback:', error)
    return fallback()
  })
}

// Circuit breaker pattern
class CircuitBreaker {
  private failures = 0
  private lastFailTime = 0
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED'
  
  constructor(
    private threshold = 5,
    private timeout = 60000
  ) {}
  
  async execute<T>(operation: () => Promise<T>): Promise<T> {
    // Check circuit breaker state
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

// Usage
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

## Project Architecture Best Practices

### Directory Structure

```
src/
├── schemas/              # Schema definitions
│   ├── entities/        # Domain entities
│   │   ├── user.ts
│   │   └── post.ts
│   ├── requests/        # Request Schema
│   │   └── auth.ts
│   └── responses/       # Response Schema
│       └── api.ts
├── middlewares/         # Middleware
│   ├── auth.ts
│   ├── cors.ts
│   └── logger.ts
├── contexts/            # Context definitions
│   ├── user.ts
│   └── database.ts
├── services/            # Business services
│   ├── user.service.ts
│   └── post.service.ts
├── routes/              # Route modules
│   ├── auth.routes.ts
│   └── post.routes.ts
├── utils/               # Utility functions
│   ├── validators/      # Custom validators
│   └── helpers/         # Helper functions
├── config/              # Configuration
│   └── index.ts
└── index.ts            # Application entry
```

### Modular Architecture

```typescript
// services/user.service.ts
export class UserService {
  constructor(
    private db: DatabaseService,
    private email: EmailService
  ) {}
  
  async createUser(data: CreateUserInput): Promise<Result<User, BusinessError>> {
    // Business logic
  }
  
  async updateUser(id: number, data: UpdateUserInput): Promise<Result<User, BusinessError>> {
    // Business logic
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

// Dependency injection
app.use((request, next) => {
  const db = new DatabaseService()
  const email = new EmailService()
  const userService = new UserService(db, email)
  
  ServiceContext.set({ userService })
  
  return next(request)
})

// Route registration
const services = ServiceContext.get()
app.route('/api/users').use(createUserRouter(services.userService))
```

## Performance Optimization Principles

### 1. Lazy Loading

```typescript
// Load heavy dependencies on demand
const heavyRouter = Router()

heavyRouter.get('/process').use(async (request) => {
  // Load only when needed
  const { processData } = await import('./heavy-processor')
  const result = await processData(request.query)
  return Response.json(result)
})
```

### 2. Caching Strategy

```typescript
// Multi-level caching
const cache = {
  memory: new Map(),
  redis: new RedisClient()
}

async function getCached<T>(
  key: string,
  factory: () => Promise<T>,
  ttl = 60000
): Promise<T> {
  // L1: Memory cache
  if (cache.memory.has(key)) {
    return cache.memory.get(key)
  }
  
  // L2: Redis cache
  const redisValue = await cache.redis.get(key)
  if (redisValue) {
    const data = JSON.parse(redisValue)
    cache.memory.set(key, data)
    return data
  }
  
  // L3: Source data
  const data = await factory()
  
  // Write to cache
  cache.memory.set(key, data)
  await cache.redis.setex(key, ttl / 1000, JSON.stringify(data))
  
  return data
}
```

### 3. Batch Processing

```typescript
// Batch operation optimization
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

## Testing Strategy

### Unit Testing

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

### Integration Testing

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

## Summary

Farrow's philosophy and best practices can be summarized as:

### Core Concepts
- 🎯 **Type as Truth** - Let the compiler help you catch errors
- 🧩 **Pure Function First** - Push side effects to boundaries
- 🔄 **Composition over Configuration** - Build large systems with small components

### Design Principles
- 📐 **Single Responsibility** - Each component does one thing
- 🎨 **Dependency Injection** - Use Context to manage dependencies
- 🛡️ **Defensive Programming** - Use Result type for error handling
- ⚡ **Performance First** - Lazy loading, caching, batch processing

### Best Practices
- 📁 **Modular Architecture** - Clear project structure
- 🧪 **Test-Driven** - Unit tests + integration tests
- 📊 **Observability** - Logging, tracing, metrics
- 🔄 **Continuous Improvement** - Refactoring, optimization, evolution

By following these principles and practices, you can build reliable, maintainable, and scalable Farrow applications.

---

<div class="doc-footer">
  <div class="doc-nav">
    <a href="./essentials.md">← Essentials</a>
    <a href="../">Home →</a>
  </div>
</div>