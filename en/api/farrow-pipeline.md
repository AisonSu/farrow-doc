# farrow-pipeline API Reference

farrow-pipeline is a powerful Pipeline and Context system that provides type-safe middleware pipelines and flexible state management capabilities.

## Installation

```bash
npm install farrow-pipeline
```

## Pipeline API

### createPipeline()

Create a type-safe synchronous pipeline.

```typescript
function createPipeline<I, O>(options?: PipelineOptions): Pipeline<I, O>

// Related type definitions
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

#### Parameters

- `options` (optional): Pipeline configuration options
  - `contexts`: Context storage to inject into the Pipeline

#### Return Value

Returns a `Pipeline<I, O>` object:
- `use(...middlewares)`: Add middleware to the pipeline, supports method chaining
- `run(input, options?)`: Run the pipeline and return the result
- `middleware`: Use the current Pipeline as middleware

#### Examples

```typescript
import { createPipeline } from 'farrow-pipeline'

// Basic usage
const pipeline = createPipeline<number, string>()

pipeline.use((input, next) => {
  console.log('Pre-processing:', input)
  const result = next(input * 2)
  console.log('Post-processing:', result)
  return result
})

pipeline.use((input) => {
  return `Result: ${input}`
})

const result = pipeline.run(5) // "Result: 10"

// Nested Pipeline
const subPipeline = createPipeline<number, number>()
subPipeline.use(x => x * 2)

const mainPipeline = createPipeline<number, string>()
mainPipeline.use(subPipeline.middleware)  // Use as middleware
mainPipeline.use(x => `Result: ${x}`)

mainPipeline.run(5) // "Result: 10"
```

### createAsyncPipeline()

Create a pipeline that supports asynchronous operations and lazy loading.

```typescript
function createAsyncPipeline<I, O>(options?: PipelineOptions): AsyncPipeline<I, O>

// Related type definitions
type AsyncPipeline<I = unknown, O = unknown> = 
  Pipeline<I, MaybeAsync<O>> & {
    useLazy: (thunk: ThunkMiddlewareInput<I, O>) => AsyncPipeline<I, O>
  }

type MaybeAsync<T> = T | Promise<T>

type ThunkMiddlewareInput<I, O> = 
  () => MaybeAsync<MiddlewareInput<I, MaybeAsync<O>>>
```

#### Parameters

Same as `createPipeline`

#### Return Value

Returns `AsyncPipeline<I, O>`, which includes all Pipeline methods plus:
- `useLazy(thunk)`: Lazy-load middleware

#### Examples

```typescript
import { createAsyncPipeline } from 'farrow-pipeline'

const pipeline = createAsyncPipeline<string, { data: any }>()

// Async middleware
pipeline.use(async (input, next) => {
  const user = await fetchUser(input)
  return next(user.id)
})

// Lazy-load middleware - load heavy dependencies on demand
pipeline.useLazy(async () => {
  const { processData } = await import('./heavy-processor')
  return (data) => processData(data)
})

// Conditional loading
pipeline.useLazy(() => {
  if (process.env.NODE_ENV === 'production') {
    return import('./prod-middleware')
  }
  return import('./dev-middleware')
})

const result = await pipeline.run('user123')
```

### usePipeline()

Use a Pipeline within another Pipeline's middleware, automatically inheriting the current Container.

```typescript
function usePipeline<I, O>(
  pipeline: Pipeline<I, O>
): (input: I, options?: RunPipelineOptions<I, O>) => O
```

#### Parameters

- `pipeline`: The Pipeline instance to use

#### Return Value

Returns a function that accepts input and runs the Pipeline, automatically using the current Container

#### Examples

```typescript
import { usePipeline, createPipeline } from 'farrow-pipeline'

// Sub Pipeline
const validationPipeline = createPipeline<User, User>()
validationPipeline.use((user) => {
  if (!user.email.includes('@')) {
    throw new Error('Invalid email')
  }
  return user
})

// Main Pipeline
const mainPipeline = createPipeline<User, Result>()

mainPipeline.use((user, next) => {
  // Use usePipeline to run sub Pipeline
  const runValidation = usePipeline(validationPipeline)
  
  try {
    const validatedUser = runValidation(user)
    return next(validatedUser)
  } catch (error) {
    return { success: false, error: error.message }
  }
})

// Compare: using pipeline.middleware
mainPipeline.use(validationPipeline.middleware)  // More concise but can't handle return values
```

## Context API

### createContext()

Create an injectable context.

```typescript
function createContext<T>(defaultValue: T): Context<T>

// Related type definitions
type Context<T = any> = {
  id: symbol
  create: (value: T) => Context<T>
  get: () => T
  set: (value: T) => void
  assert: () => Exclude<T, undefined | null>
}
```

#### Parameters

- `defaultValue`: Default value for the context

#### Return Value

Returns a `Context<T>` object:
- `id`: Unique identifier
- `create(value)`: Create a new Context instance with the same id but different value
- `get()`: Get current value
- `set(value)`: Set current value
- `assert()`: Assert value is non-null and return it

#### Context.create Method Details

The `create` method creates a new Context instance, maintaining the same `id` but using a different value.

**When to use create:**
- Multi-environment configuration - different environments need different initial values
- Test mocking - override production environment defaults
- Multi-tenant systems - provide different configurations for different users
- A/B testing - run multiple configuration variants simultaneously

**When create is not needed:**
- Only one Pipeline uses the Context
- The Context's default value already meets requirements
- Runtime modification through `set()` is sufficient

#### Examples

```typescript
import { createContext, createPipeline } from 'farrow-pipeline'

// 1. Simple scenario - no need for create
const CounterContext = createContext(0)

const simplePipeline = createPipeline()  // Don't pass contexts

simplePipeline.use((input) => {
  const count = CounterContext.get()  // Use default value 0
  CounterContext.set(count + 1)       // Modify at runtime
  return input
})

// 2. Test scenario - use create to override
const DatabaseContext = createContext<Database>(productionDB)

const testPipeline = createPipeline({
  contexts: {
    db: DatabaseContext.create(mockDB)  // Override with test database
  }
})

// 3. Multi-environment configuration
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

Create a context container to manage multiple contexts.

```typescript
function createContainer(contexts?: ContextStorage): Container

// Related type definitions
type ContextStorage = {
  [key: string]: Context
}

type Container = {
  read: <V>(context: Context<V>) => V
  write: <V>(context: Context<V>, value: V) => void
}
```

#### Parameters

- `contexts` (optional): Initial context storage

#### Return Value

Returns a `Container` object:
- `read(context)`: Read context value
- `write(context, value)`: Write context value

#### Container Lifecycle

1. **Default value fallback**: Unconfigured Contexts automatically use default values from createContext
2. **Default isolation**: Each pipeline.run() creates a new Container copy
3. **Explicit sharing**: Share state across executions through options.container parameter
4. **Async safety**: Maintains correct context based on AsyncLocalStorage
5. **Automatic propagation**: Inherits parent Container when using pipeline.middleware or usePipeline

#### Examples

```typescript
import { createContainer, createContext } from 'farrow-pipeline'

const UserContext = createContext({ id: '1', name: 'Alice' })
const ThemeContext = createContext('light')

// Create container
const container = createContainer({
  user: UserContext,
  theme: ThemeContext.create('dark')  // Override default value
})

// Read/write operations
const user = container.read(UserContext)
container.write(ThemeContext, 'blue')

// Use container in Pipeline
pipeline.run(input, { container })
```

### useContainer()

Get the container of the current running environment.

```typescript
function useContainer(): Container
```

#### Return Value

Returns the current `Container` instance

#### Examples

```typescript
import { useContainer } from 'farrow-pipeline'

// Custom Hook
function useAuth() {
  const container = useContainer()
  const user = container.read(UserContext)
  
  if (!user) {
    throw new Error('Unauthorized')
  }
  
  return user
}

// Use in middleware
pipeline.use((input, next) => {
  const user = useAuth()
  console.log(`Authorized user: ${user.name}`)
  return next(input)
})
```

## Middleware Related

### Middleware Types

Middleware function type definitions.

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

## Utility Functions

### isPipeline()

Check if an object is a Pipeline.

```typescript
function isPipeline(input: any): input is Pipeline

// Usage example
if (isPipeline(obj)) {
  obj.run(input)  // TypeScript knows obj is Pipeline
}
```

### isContext()

Check if an object is a Context.

```typescript
function isContext(input: any): input is Context

// Usage example
if (isContext(obj)) {
  const value = obj.get()  // TypeScript knows obj is Context
}
```

### isContainer()

Check if an object is a Container.

```typescript
function isContainer(input: any): input is Container

// Usage example
if (isContainer(obj)) {
  obj.read(context)  // TypeScript knows obj is Container
}
```

## Advanced Patterns

### Error Handling

```typescript
const pipeline = createPipeline<Request, Response>()

// Error boundary middleware
pipeline.use(async (req, next) => {
  try {
    return await next(req)
  } catch (error) {
    console.error('Pipeline error:', error)
    return {
      status: 500,
      body: 'Internal Server Error'
    }
  }
})
```

### Conditional Middleware

```typescript
const conditionalMiddleware = (condition: boolean) => {
  return (input, next) => {
    if (condition) {
      console.log('Condition met, executing additional logic')
    }
    return next(input)
  }
}

pipeline.use(conditionalMiddleware(process.env.NODE_ENV === 'development'))
```

### Composing Multiple Pipelines

```typescript
// Method 1: Using middleware property
const validationPipeline = createPipeline<Data, Data>()
const processingPipeline = createPipeline<Data, Data>()

const mainPipeline = createPipeline<Data, Result>()
mainPipeline
  .use(validationPipeline.middleware)
  .use(processingPipeline.middleware)
  .use((data) => ({ success: true, data }))

// Method 2: Using usePipeline
mainPipeline.use((data, next) => {
  const runValidation = usePipeline(validationPipeline)
  const runProcessing = usePipeline(processingPipeline)
  
  const validated = runValidation(data)
  const processed = runProcessing(validated)
  
  return next(processed)
})
```

### Context Patterns

#### Dependency Injection

```typescript
// Define service interfaces
interface Database {
  query(sql: string): Promise<any>
}

interface Cache {
  get(key: string): any
  set(key: string, value: any): void
}

// Create Contexts
const DatabaseContext = createContext<Database>()
const CacheContext = createContext<Cache>()

// Inject dependencies
app.use((request, next) => {
  DatabaseContext.set(new PostgresDatabase())
  CacheContext.set(new RedisCache())
  return next(request)
})

// Use dependencies
function useDatabase() {
  const db = DatabaseContext.use()
  return db
}

function useCache() {
  const cache = CacheContext.use()
  return cache
}
```

#### Request Tracing

```typescript
const RequestIdContext = createContext<string>()
const TracingContext = createContext<{
  spans: Array<{ name: string; duration: number }>
}>()

// Tracing middleware
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

// Record span
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

// Usage
app.get('/api/data').use(() => {
  const data = trace('fetchData', () => fetchData())
  const processed = trace('processData', () => processData(data))
  return Response.json(processed)
})
```

### Conditional Pipelines

```typescript
const pipeline = createAsyncPipeline<Request, Response>()

// Conditional middleware
pipeline.use((request, next) => {
  if (request.skipAuth) {
    return next(request)
  }
  
  // Dynamically select Pipeline
  const authPipeline = request.type === 'jwt'
    ? jwtAuthPipeline
    : sessionAuthPipeline
  
  const user = usePipeline(authPipeline)(request)
  return next({ ...request, user })
})

// Dynamic loading
pipeline.useLazy(async () => {
  if (process.env.FEATURE_FLAG === 'enabled') {
    const { featureMiddleware } = await import('./feature')
    return featureMiddleware
  }
  
  // Return pass-through middleware
  return (input, next) => next(input)
})
```

## Complete Example

```typescript
import {
  createPipeline,
  createAsyncPipeline,
  createContext,
  createContainer,
  runWithContainer,
  usePipeline
} from 'farrow-pipeline'

// ===== Context Definitions =====
const UserContext = createContext<User | null>(null)
const DatabaseContext = createContext<Database>()
const LoggerContext = createContext<Logger>()

// ===== Pipeline Definitions =====

// Authentication Pipeline
const authPipeline = createAsyncPipeline<string, User>()
authPipeline.use(async (token, next) => {
  const payload = jwt.verify(token, SECRET)
  const user = await fetchUser(payload.userId)
  return user
})

// Validation Pipeline
const validationPipeline = createPipeline<any, ValidatedData>()
validationPipeline.use((data, next) => {
  const result = validate(data)
  if (!result.valid) {
    throw new ValidationError(result.errors)
  }
  return next(result.data)
})

// Main Pipeline
const appPipeline = createAsyncPipeline<Request, Response>()

// Dependency injection middleware
appPipeline.use(async (request, next) => {
  const container = createContainer({
    [DatabaseContext]: new Database(config.db),
    [LoggerContext]: new Logger(request.id)
  })
  
  return runWithContainer(() => next(request), container)
})

// Authentication middleware
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

// Lazy load features
appPipeline.useLazy(async () => {
  if (config.features.rateLimit) {
    const { rateLimitMiddleware } = await import('./rate-limit')
    return rateLimitMiddleware
  }
  return (input, next) => next(input)
})

// Business processing
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

// Run application
async function handleRequest(request: Request) {
  const response = await appPipeline.run(request)
  return response
}

// Test isolation
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

## Best Practices

### 1. Context Naming

```typescript
// Good: Descriptive naming
const CurrentUserContext = createContext<User>()
const DatabaseConnectionContext = createContext<Database>()
const RequestTracingContext = createContext<Tracing>()

// Avoid: Generic naming
const DataContext = createContext()
const ConfigContext = createContext()
```

### 2. Pipeline Composition

```typescript
// Good: Small, focused Pipelines
const authPipeline = createPipeline()  // Only handles authentication
const validationPipeline = createPipeline()  // Only handles validation
const loggingPipeline = createPipeline()  // Only handles logging

// Compose usage
const appPipeline = createPipeline()
appPipeline.use((input, next) => {
  const auth = usePipeline(authPipeline)
  const validate = usePipeline(validationPipeline)
  // ...
})
```

### 3. Error Handling

```typescript
// Good: Explicit error handling
pipeline.use((input, next) => {
  try {
    return next(input)
  } catch (error) {
    if (error instanceof ValidationError) {
      return handleValidationError(error)
    }
    throw error  // Re-throw unknown errors
  }
})
```

### 4. Type Safety

```typescript
// Good: Explicit type definitions
const pipeline = createPipeline<
  { userId: string; data: unknown },
  { success: boolean; result?: any; error?: string }
>()

// Context with default values
const ThemeContext = createContext<'light' | 'dark'>('light')
```

### 5. Lifecycle Management

```typescript
// Good: Reasonable Context lifecycle
const pipeline = createAsyncPipeline<Request, Response>()

pipeline.use(async (request, next) => {
  // Create new context for each request
  const container = createContainer({
    [RequestIdContext]: generateId(),
    [TimestampContext]: Date.now()
  })
  
  return runWithContainer(() => next(request), container)
})
```

## Summary

Congratulations! You've mastered the complete farrow-pipeline API:

- **Pipeline System**: Type-safe middleware pipelines
- **Context System**: Flexible state management and dependency injection
- **Async Support**: Complete Promise and async middleware support
- **Utility Functions**: Rich type checking and development tools
- **Advanced Patterns**: Best practices for complex scenarios

Now you can build high-quality, maintainable middleware systems!