# Pipeline Core Concepts

Pipeline is the core abstraction of the Farrow framework, providing an elegant way to handle data flow and middleware composition. Understanding how Pipeline works is crucial for mastering Farrow.

## What is Pipeline?

Pipeline is a functional data processing pipeline that allows you to chain multiple processing steps together to form a complete data processing flow.

### Basic Concepts

```typescript
import { createPipeline } from 'farrow-pipeline'

// Pipeline type signature: Pipeline<Input, Output>
const pipeline = createPipeline<string, string>()

// Add processing steps
pipeline.use((input, next) => {
  console.log('Processing input:', input)
  const result = next(input + ' processed')
  console.log('Processing result:', result)
  return result
})

// Run Pipeline
const result = pipeline.run('hello')  // Output: "hello processed"
```

### Pipeline Characteristics

1. **Type Safe** - Each Pipeline has clear input and output types
2. **Functional** - Immutable data flow, each step returns new values
3. **Composable** - Can easily compose multiple Pipelines
4. **Context Isolation** - Each run has independent execution environment

## Container Concept Explained

Container is one of the most important concepts in Pipeline, responsible for managing execution context and state isolation.

### What is Container?

Container is an execution environment used to store and manage Context values. Each time `pipeline.run()` is called, Farrow creates a new Container.

```typescript
import { createPipeline, createContext } from 'farrow-pipeline'

const UserContext = createContext<{ name: string } | null>(null)
const RequestContext = createContext<{ id: string; startTime: number }>()

const pipeline = createPipeline<string, string>()

pipeline.use((input, next) => {
  // Set Context in current Container
  RequestContext.set({
    id: `req-${Date.now()}`,
    startTime: Date.now()
  })
  
  UserContext.set({ name: input })
  
  return next(input)
})

pipeline.use((input, next) => {
  // Read Context from current Container
  const request = RequestContext.get()
  const user = UserContext.get()
  
  console.log(`Request ${request.id}: Processing user ${user?.name}`)
  return next(`processed: ${input}`)
})
```

### Container Isolation

Each `pipeline.run()` call creates a brand new Container, ensuring complete isolation between different executions:

```typescript
const pipeline = createPipeline<string, string>()

pipeline.use((input, next) => {
  UserContext.set({ name: input })
  console.log('Set user:', input)
  return next(input)
})

pipeline.use((input, next) => {
  const user = UserContext.get()
  console.log('Get user:', user?.name)
  return next(user?.name || 'unknown')
})

// Concurrent execution - each has independent Container
Promise.all([
  pipeline.run('Alice'),    // Container A: UserContext = { name: 'Alice' }
  pipeline.run('Bob'),      // Container B: UserContext = { name: 'Bob' }
  pipeline.run('Charlie')   // Container C: UserContext = { name: 'Charlie' }
]).then(results => {
  console.log(results)  // ['Alice', 'Bob', 'Charlie']
})
```

::: warning Important Note
Even in async environments, Container maintains isolation. This is implemented based on Node.js AsyncLocalStorage.
:::

### Container Lifecycle

```typescript
const pipeline = createPipeline<string, string>()

pipeline.use((input, next) => {
  console.log('1. Container created, Context initialized')
  UserContext.set({ name: input })
  
  // Async operations also in same Container
  setTimeout(() => {
    console.log('3. User in async operation:', UserContext.get()?.name)
  }, 100)
  
  const result = next(input)
  console.log('2. Middleware execution complete')
  return result
})

pipeline.use((input, next) => {
  const user = UserContext.get()
  return next(`Hello, ${user?.name}!`)
})

// After run completes, Container is destroyed
const result = pipeline.run('Alice')
console.log('4. Final result:', result)
```

## Sync and Async Pipelines

### Sync Pipeline

```typescript
import { createPipeline } from 'farrow-pipeline'

const syncPipeline = createPipeline<number, number>()

syncPipeline.use((input, next) => {
  console.log('Input:', input)
  return next(input * 2)
})

syncPipeline.use((input, next) => {
  console.log('Middle value:', input)
  return next(input + 10)
})

syncPipeline.use((input, next) => {
  console.log('Final processing:', input)
  return input
})

const result = syncPipeline.run(5)  // Output: 20 (5 * 2 + 10)
```

### Async Pipeline

```typescript
import { createAsyncPipeline } from 'farrow-pipeline'

const asyncPipeline = createAsyncPipeline<string, string>()

asyncPipeline.use(async (input, next) => {
  console.log('Start async processing:', input)
  
  // Simulate async operation
  await new Promise(resolve => setTimeout(resolve, 100))
  
  return next(`async-${input}`)
})

asyncPipeline.use(async (input, next) => {
  // Async database query
  const data = await queryDatabase(input)
  return next(`${input}-${data}`)
})

// Async run
const result = await asyncPipeline.run('test')
console.log('Async result:', result)
```

### Mixed Usage

```typescript
// Use sync operations in async Pipeline
const mixedPipeline = createAsyncPipeline<any, any>()

mixedPipeline.use(async (input, next) => {
  // Async data retrieval
  const userData = await fetchUserData(input.userId)
  
  // Sync data processing
  const processedData = processUserData(userData)
  
  return next({ ...input, userData: processedData })
})

mixedPipeline.use((input, next) => {
  // This middleware is sync, but works fine in async Pipeline
  const enhanced = enhanceData(input)
  return next(enhanced)
})
```

## usePipeline: Core of Pipeline Composition

`usePipeline` is the core tool for Pipeline composition, allowing you to use another Pipeline within one Pipeline while ensuring correct context passing.

### Basic Usage

```typescript
import { createPipeline, createAsyncPipeline, usePipeline } from 'farrow-pipeline'

// Create user authentication Pipeline
const authPipeline = createPipeline<string, { userId: number; role: string }>()

authPipeline.use((token, next) => {
  if (!token) {
    throw new Error('Token required')
  }
  
  const decoded = verifyJWT(token)
  const user = { userId: decoded.id, role: decoded.role }
  
  return next(user)
})

// Use authentication Pipeline in main Pipeline
const mainPipeline = createAsyncPipeline<{ token: string; action: string }, any>()

mainPipeline.use(async (input, next) => {
  // Use usePipeline to call authentication flow
  const user = await usePipeline(authPipeline)(input.token)
  
  console.log(`User ${user.userId} wants to perform: ${input.action}`)
  
  return next({
    user,
    action: input.action,
    timestamp: new Date()
  })
})
```

### Context Inheritance

An important feature of `usePipeline` is context inheritance—the called Pipeline inherits the caller's Context environment.

```typescript
import { createContext } from 'farrow-pipeline'

// Create Context
const RequestContext = createContext<{ id: string; startTime: number }>()
const UserContext = createContext<{ id: number; name: string } | null>(null)

// Logging Pipeline
const loggingPipeline = createPipeline<string, string>()

loggingPipeline.use((message, next) => {
  const request = RequestContext.get()
  const user = UserContext.get()
  
  console.log(`[${request?.id}] ${user?.name || 'Anonymous'}: ${message}`)
  
  return next(message)
})

// Business logic Pipeline
const businessPipeline = createAsyncPipeline<any, any>()

businessPipeline.use(async (input, next) => {
  // Set user context
  UserContext.set({ id: input.userId, name: input.userName })
  
  // Use logging Pipeline - it inherits UserContext
  await usePipeline(loggingPipeline)('Starting business operation')
  
  // Execute business logic
  const result = await performBusinessLogic(input)
  
  await usePipeline(loggingPipeline)('Business operation completed')
  
  return next(result)
})

// Main Pipeline sets request context
const mainPipeline = createAsyncPipeline<any, any>()

mainPipeline.use(async (input, next) => {
  // Set request context
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

## Manual Container Creation

In some scenarios, you may need to manually create and manage Containers, especially in testing or special application scenarios.

### What is Manual Container Creation?

Usually, Pipeline automatically creates a Container on each `run()` call. But you can also pre-create a Container and reuse it in multiple places.

```typescript
import { createContainer } from 'farrow-pipeline'

// Create Context
const DatabaseContext = createContext<Database>()
const LoggerContext = createContext<Logger>()

// Manually create Container
const testContainer = createContainer({
  database: DatabaseContext.create(mockDatabase),
  logger: LoggerContext.create(silentLogger)
})

// Use specific Container to run Pipeline
const result = pipeline.run(input, { container: testContainer })
```

### Testing Scenario Application

Manual Container creation is very useful in testing, allowing different test cases to create different environments:

```typescript
// Production environment configuration
const productionContainer = createContainer({
  database: DatabaseContext.create(productionDB),
  logger: LoggerContext.create(consoleLogger),
  cache: CacheContext.create(redisCache)
})

// Test environment configuration
const testContainer = createContainer({
  database: DatabaseContext.create(mockDatabase),
  logger: LoggerContext.create(silentLogger),
  cache: CacheContext.create(memoryCache)
})

// Use in tests
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

### Multi-environment Container Management

```typescript
// Environment configuration factory
const createEnvironmentContainer = (env: string) => {
  const config = getConfigForEnvironment(env)
  
  return createContainer({
    config: ConfigContext.create(config),
    database: DatabaseContext.create(createDatabase(config.db)),
    logger: LoggerContext.create(createLogger(config.logging)),
    cache: CacheContext.create(createCache(config.cache))
  })
}

// Pre-create environment containers
const environments = {
  development: createEnvironmentContainer('development'),
  production: createEnvironmentContainer('production'),
  test: createEnvironmentContainer('test')
}

// Use appropriate container based on environment
const currentContainer = environments[process.env.NODE_ENV || 'development']

// Use environment-specific container on app startup
app.use((request, next) => {
  // Associate environment container with current request
  const result = mainPipeline.run(
    { request, timestamp: Date.now() },
    { container: currentContainer }
  )
  
  return next(result)
})
```

### Container and usePipeline Collaboration

When using `usePipeline`, the called Pipeline inherits the current Container:

```typescript
const sharedContainer = createContainer({
  user: UserContext.create({ id: 1, name: 'Alice' }),
  session: SessionContext.create({ sessionId: 'abc123' })
})

const authPipeline = createPipeline<any, any>()
authPipeline.use((input, next) => {
  const user = UserContext.get()  // Will get Alice
  console.log(`Authenticating ${user?.name}`)
  return next(input)
})

const mainPipeline = createPipeline<any, any>()
mainPipeline.use((input, next) => {
  // Call authPipeline, it inherits current Container
  const result = usePipeline(authPipeline)(input)
  return next(result)
})

// Use shared container to run
const result = mainPipeline.run(
  { action: 'getData' },
  { container: sharedContainer }
)
```

## Pipeline Execution Model

### Middleware Execution Order

```typescript
const pipeline = createPipeline<string, string>()

pipeline.use((input, next) => {
  console.log('Middleware 1 - start')
  const result = next(input + ' -> 1')
  console.log('Middleware 1 - end')
  return result
})

pipeline.use((input, next) => {
  console.log('Middleware 2 - start')
  const result = next(input + ' -> 2')
  console.log('Middleware 2 - end')
  return result
})

pipeline.use((input, next) => {
  console.log('Middleware 3 - processing')
  return input + ' -> 3'
})

pipeline.run('start')

// Output order:
// Middleware 1 - start
// Middleware 2 - start  
// Middleware 3 - processing
// Middleware 2 - end
// Middleware 1 - end
```

This execution model is called the "onion model", similar to Koa.js middleware model.

### Conditional Execution and Composition

```typescript
// Conditional Pipeline execution
const conditionalPipeline = createPipeline<{ type: string; data: any }, any>()

conditionalPipeline.use((input, next) => {
  if (input.type === 'skip') {
    // Skip subsequent middleware
    return { result: 'skipped', data: input.data }
  }
  
  // Normal execution
  return next(input)
})

// Use usePipeline to create conditional processing
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

### Error Handling and Propagation

```typescript
const errorHandlingPipeline = createAsyncPipeline<any, any>()

errorHandlingPipeline.use(async (input, next) => {
  try {
    console.log('Attempting to process:', input)
    const result = await next(input)
    console.log('Processing successful:', result)
    return result
  } catch (error) {
    console.error('Caught error:', error.message)
    
    // Can choose to re-throw error or return default value
    if (error.code === 'RECOVERABLE') {
      return { status: 'error', message: error.message }
    }
    
    throw error  // Re-throw unrecoverable error
  }
})

// Use usePipeline for error recovery
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

## Practical Application Example

### Complex Business Process Management

```typescript
// 1. Create dedicated container
const businessContainer = createContainer({
  user: UserContext.create(null),
  transaction: TransactionContext.create(null),
  audit: AuditContext.create([])
})

// 2. Define sub-process Pipeline
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

// 3. Main business process
const businessProcessPipeline = createAsyncPipeline<any, any>()

businessProcessPipeline.use(async (input, next) => {
  // Set user context
  UserContext.set(input.user)
  
  // Start audit
  await usePipeline(auditLogPipeline)('process_started')
  
  try {
    // Validate user
    await usePipeline(validateUserPipeline)(input)
    
    // Execute business logic
    const result = await performBusinessLogic(input)
    
    // Log success
    await usePipeline(auditLogPipeline)('process_completed')
    
    return next({ success: true, data: result })
  } catch (error) {
    // Log failure
    await usePipeline(auditLogPipeline)('process_failed')
    throw error
  }
})

// 4. Use dedicated container for execution
const processOrder = async (orderData: any) => {
  return businessProcessPipeline.run(
    orderData,
    { container: businessContainer }
  )
}
```

By integrating Pipeline core concepts, usePipeline composition capabilities, and manual Container management, you can build powerful and flexible data processing systems. These technologies work together to provide:

- **Modular Design** - Compose different processing logic through usePipeline
- **Context Management** - Container ensures correct state isolation and passing
- **Environment Control** - Manually created Containers support multi-environment and testing scenarios
- **Error Recovery** - Combined use implements complex error handling strategies

Understanding these core concepts allows you to fully leverage Pipeline's powerful capabilities to build complex yet elegant data processing flows. Pipeline's design philosophy is composability and predictability, making complex business logic easy to understand and maintain.