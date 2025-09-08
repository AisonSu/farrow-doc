# Farrow Pipeline User-Friendly Tutorial

Welcome to the world of Farrow Pipeline! This is a **practical application-oriented** progressive tutorial where we'll start with real-life examples and gradually build your own middleware system.

## Learning Path

Through 6 progressive steps, you'll master the essence of type-safe middleware systems:

1. 🏠 [Understanding Pipeline: Package Sorting Center](#step-one-understanding-pipeline-package-sorting-center) - Understand concepts through real-life scenarios
2. ⚡ [5-Minute Quick Start](#step-two-5-minute-quick-start) - Simplest practical examples
3. 🔄 [Data Flow: The Magic of next()](#step-three-data-flow-the-magic-of-next) - Master middleware collaboration
4. 📦 [Context: Shared Memory](#step-four-context-shared-memory) - Cross-middleware state management
5. 🏗️ [Container: Independent Workspace](#step-five-container-independent-workspace) - The secret of concurrent isolation
6. 🔧 [Proper Pipeline Nesting](#step-six-proper-pipeline-nesting) - The real purpose of usePipeline

---

## Step One: Understanding Pipeline: Package Sorting Center

### Pipeline in Real Life

Imagine a package sorting center:

```
Package arrives → [Scan & Log] → [Weight Check] → [Address Verification] → [Truck Assignment] → Package ships
```

Each **[ ]** is a workstation (middleware). Packages must pass through each workstation in sequence before they can be shipped. If any workstation finds a problem, the package will be specially handled or returned.

### Pipeline in Code

```typescript
import { createPipeline } from 'farrow-pipeline'

// Package information (input type)
interface Package {
  id: string
  weight: number
  address: string
}

// Processing result (output type)
interface ProcessResult {
  id: string
  status: 'success' | 'rejected'
  message: string
  assignedTruck?: string
}

// Create package sorting Pipeline
const packagePipeline = createPipeline<Package, ProcessResult>()

// Workstation 1: Weight check
packagePipeline.use((pkg, next) => {
  console.log(`📦 Checking weight of package ${pkg.id}...`)
  
  if (pkg.weight > 30) {
    // Overweight, return directly without continuing to next workstation
    return {
      id: pkg.id,
      status: 'rejected',
      message: 'Package is overweight, cannot be processed'
    }
  }
  
  // Passed check, send to next workstation
  return next(pkg)
})

// Workstation 2: Address verification
packagePipeline.use((pkg, next) => {
  console.log(`📮 Verifying address of package ${pkg.id}...`)
  
  if (!pkg.address || pkg.address.length < 5) {
    return {
      id: pkg.id,
      status: 'rejected',
      message: 'Address information is incomplete'
    }
  }
  
  return next(pkg)
})

// Workstation 3: Truck assignment
packagePipeline.use((pkg) => {
  console.log(`🚚 Assigning transport vehicle for package ${pkg.id}...`)
  
  const truckId = `TRUCK-${Math.floor(Math.random() * 100)}`
  
  return {
    id: pkg.id,
    status: 'success',
    message: 'Package processing completed',
    assignedTruck: truckId
  }
})

// Test our package sorting system
const package1: Package = {
  id: 'PKG001',
  weight: 5,
  address: '123 Main Street, Beijing'
}

const result = packagePipeline.run(package1)
console.log('Processing result:', result)

// Output:
// 📦 Checking weight of package PKG001...
// 📮 Verifying address of package PKG001...
// 🚚 Assigning transport vehicle for package PKG001...
// Processing result: { id: 'PKG001', status: 'success', message: 'Package processing completed', assignedTruck: 'TRUCK-42' }
```

### Core Understanding

1. **Pipeline = Assembly Line**: Data passes through each processing step in order
2. **Middleware = Workstation**: Each station handles specific checks or processing
3. **next() = Conveyor Belt**: Sends data to the next workstation
4. **Not calling next() = Terminate Process**: End processing at current workstation

**This is the entire core of Pipeline!** Next, let's see how to get started quickly in 5 minutes.

---

## Step Two: 5-Minute Quick Start

Now that you understand the basic concept of Pipeline, let's quickly get started with a **super simple** practical example.

### Simplest User Registration Flow

```typescript
import { createPipeline } from 'farrow-pipeline'

// Input: User submitted registration information
interface RegisterRequest {
  username: string
  password: string
}

// Output: Registration result
interface RegisterResponse {
  success: boolean
  message: string
  userId?: string
}

// Create registration Pipeline
const registerPipeline = createPipeline<RegisterRequest, RegisterResponse>()

// Step 1: Check username
registerPipeline.use((request, next) => {
  if (request.username.length < 3) {
    // Unqualified, return directly without continuing to next steps
    return {
      success: false,
      message: 'Username is too short! At least 3 characters required'
    }
  }
  
  // Qualified, continue to next step
  return next(request)
})

// Step 2: Check password
registerPipeline.use((request, next) => {
  if (request.password.length < 6) {
    return {
      success: false,
      message: 'Password is too short! At least 6 characters required'
    }
  }
  
  return next(request)
})

// Step 3: Create user account
registerPipeline.use((request) => {
  // Simulate user creation
  const userId = 'USER_' + Math.random().toString(36).substr(2, 8)
  
  return {
    success: true,
    message: 'Registration successful!',
    userId
  }
})

// 🧪 Test it out
const goodRequest = {
  username: 'alice',
  password: '123456'
}

const badRequest = {
  username: 'ab',  // Too short
  password: '123456'
}

console.log('Good request:', registerPipeline.run(goodRequest))
// Output: { success: true, message: 'Registration successful!', userId: 'USER_abc123de' }

console.log('Bad request:', registerPipeline.run(badRequest))
// Output: { success: false, message: 'Username is too short! At least 3 characters required' }
```

### It's that simple!

You now know how to use Farrow Pipeline! The core is:

1. Define input and output types
2. Create Pipeline
3. Use `.use()` to add processing steps
4. Use `.run()` to execute processing

**Each step can:**
- ✅ Call `next()` to continue to next step
- ❌ Directly `return` to terminate and return result

### Why this design?

- **Type Safety**: TypeScript checks your input/output types
- **Separation of Concerns**: Each step handles only one thing
- **Flexible Control**: Any step can decide whether to continue
- **Easy Testing**: Each step can be tested independently

---

## Step Three: Data Flow: The Magic of next()

You can now create simple Pipelines. Now let's dive deep into understanding **how data flows between middleware**.

### Data Can Be Modified and Passed

In a package sorting center, packages are not just inspected - they might be **repackaged**, **labeled**, or have their **information modified**. The same applies in Pipeline!

```typescript
import { createPipeline } from 'farrow-pipeline'

interface UserData {
  username: string
  email: string
  profileComplete?: boolean  // Optional field, added later
  securityScore?: number     // Security score, calculated later
}

interface Result {
  success: boolean
  user?: UserData
  warnings?: string[]
}

const userPipeline = createPipeline<UserData, Result>()

// Step 1: Data cleaning and normalization
userPipeline.use((userData, next) => {
  console.log('🧹 Cleaning data...')
  
  // Modify data: remove whitespace, convert to lowercase
  const cleanedData = {
    ...userData,
    username: userData.username.trim().toLowerCase(),
    email: userData.email.trim().toLowerCase()
  }
  
  // Pass modified data to next step
  return next(cleanedData)
})

// Step 2: Add more information
userPipeline.use((userData, next) => {
  console.log('📋 Evaluating user profile...')
  
  // Add new fields based on existing data
  const enhancedData = {
    ...userData,
    profileComplete: userData.username.length > 0 && userData.email.includes('@')
  }
  
  return next(enhancedData)
})

// Step 3: Security scoring
userPipeline.use((userData, next) => {
  console.log('🔒 Calculating security score...')
  
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

// Step 4: Generate final result
userPipeline.use((userData) => {
  console.log('✅ Generating result...')
  
  const warnings = []
  if (userData.securityScore < 50) {
    warnings.push('Low security score, recommend completing profile')
  }
  
  return {
    success: true,
    user: userData,
    warnings: warnings.length > 0 ? warnings : undefined
  }
})

// 🧪 Test data flow
const inputData = {
  username: '  Alice  ',  // Extra whitespace
  email: 'ALICE@EXAMPLE.COM'  // Mixed case
}

console.log('Input data:', inputData)
const result = userPipeline.run(inputData)
console.log('Final result:', JSON.stringify(result, null, 2))

// Output:
// 🧹 Cleaning data...
// 📋 Evaluating user profile...
// 🔒 Calculating security score...
// ✅ Generating result...
// Input data: { username: '  Alice  ', email: 'ALICE@EXAMPLE.COM' }
// Final result: {
//   "success": true,
//   "user": {
//     "username": "alice",
//     "email": "alice@example.com",
//     "profileComplete": true,
//     "securityScore": 100
//   }
// }
```

### Key Points of Data Flow

1. **Progressive Enhancement**: Each step can add new information based on existing data
2. **Data Transformation**: Can clean, format, and validate data
3. **Type Safety**: TypeScript ensures correct data structure at each pass
4. **Chain Processing**: Previous step's output becomes next step's input

### Real-World Application Scenarios

This data flow pattern is very useful in real development:

```typescript
// Web API request processing
const apiPipeline = createPipeline<RawRequest, ApiResponse>()
  .use(parseRequestBody)      // Parse request body
  .use(validateInput)         // Validate input
  .use(authenticateUser)      // User authentication (add user info)
  .use(authorizeAccess)       // Permission check (add permission info)
  .use(processBusinessLogic)  // Business logic processing
  .use(formatResponse)        // Format response

// Image processing pipeline
const imagePipeline = createPipeline<ImageFile, ProcessedImage>()
  .use(validateImageFormat)   // Validate format
  .use(extractMetadata)       // Extract metadata
  .use(resizeImage)          // Resize
  .use(optimizeQuality)      // Optimize quality
  .use(addWatermark)         // Add watermark
  .use(saveToStorage)        // Save to storage
```

### Deep Understanding of next()

`next(data)` is not just "continue to next step", it is:
- **Data Transmitter**: Passes processed data to next middleware
- **Flow Controller**: Decides whether to continue executing subsequent steps
- **Type Guardian**: Ensures passed data conforms to type constraints

Now you've mastered the essence of data flow! Next, let's learn how to share state between middleware.

---

## Step Four: Context: Shared Memory

So far, we can only pass data between middleware through `next(data)`. But sometimes, we need to **share certain state information across all steps**. This is where Context comes in!

### What is Context?

Context is like a **shared notepad** in the pipeline workspace:
- Any workstation can write on it
- Any workstation can read from it
- Each time a new package is processed, the notepad starts fresh

### Basic Usage: Processing Time Tracking

Let's add **processing time statistics** to our user registration flow:

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
  processingTime?: number  // New: processing time
}

// Create Context - like creating a shared notepad
const StartTimeContext = createContext<number>(0)

const registerPipeline = createPipeline<UserRequest, UserResponse>()

// Step 1: Record start time
registerPipeline.use((request, next) => {
  console.log('⏰ Recording start time')
  
  // Write start time on shared notepad
  StartTimeContext.set(Date.now())
  
  return next(request)
})

// Step 2: Validate username (time-consuming operation)
registerPipeline.use((request, next) => {
  console.log('👤 Validating username...')
  
  // Simulate time-consuming operation
  const simulatedDelay = Math.random() * 100
  const start = Date.now()
  while (Date.now() - start < simulatedDelay) {}
  
  if (request.username.length < 3) {
    // Even in error cases, can read start time
    const startTime = StartTimeContext.get()
    const processingTime = Date.now() - startTime
    
    return {
      success: false,
      message: 'Username is too short',
      processingTime
    }
  }
  
  return next(request)
})

// Step 3: Validate email (another time-consuming operation)
registerPipeline.use((request, next) => {
  console.log('📧 Validating email...')
  
  // Another simulated time-consuming operation
  const simulatedDelay = Math.random() * 50
  const start = Date.now()
  while (Date.now() - start < simulatedDelay) {}
  
  if (!request.email.includes('@')) {
    const startTime = StartTimeContext.get()
    const processingTime = Date.now() - startTime
    
    return {
      success: false,
      message: 'Invalid email format',
      processingTime
    }
  }
  
  return next(request)
})

// Step 4: Create user
registerPipeline.use((request) => {
  console.log('✅ Creating user account')
  
  // Read start time, calculate total processing time
  const startTime = StartTimeContext.get()
  const processingTime = Date.now() - startTime
  
  return {
    success: true,
    message: 'Registration successful!',
    userId: 'USER_' + Math.random().toString(36).substr(2, 8),
    processingTime
  }
})

// 🧪 Test
const request1 = { username: 'alice', email: 'alice@example.com' }
const request2 = { username: 'ab', email: 'invalid-email' }

console.log('Test 1:', registerPipeline.run(request1))
// Output: { success: true, message: 'Registration successful!', userId: 'USER_abc123', processingTime: 156 }

console.log('Test 2:', registerPipeline.run(request2))
// Output: { success: false, message: 'Username is too short', processingTime: 89 }
```

### Core Characteristics of Context

1. **Cross-step Sharing**: Any middleware can read/write Context
2. **Automatic Isolation**: Each `pipeline.run()` has independent Context instance
3. **Type Safety**: `createContext<T>()` ensures stored data type correctness

### Multiple Context Collaboration

In complex scenarios, we usually need multiple Contexts:

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

// Multiple Contexts, each with their own responsibility
const RequestIdContext = createContext<string>('')
const UserContext = createContext<{ id: string, name: string } | null>(null)
const TimingContext = createContext<{ start: number, steps: Array<{ name: string, time: number }> }>({
  start: 0,
  steps: []
})

const apiPipeline = createPipeline<ApiRequest, ApiResponse>()

// Step 1: Initialize
apiPipeline.use((request, next) => {
  const requestId = `REQ_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`
  const startTime = Date.now()
  
  RequestIdContext.set(requestId)
  TimingContext.set({ start: startTime, steps: [] })
  
  console.log(`🆔 Request ${requestId} starting processing`)
  return next(request)
})

// Step 2: Authentication
apiPipeline.use((request, next) => {
  const requestId = RequestIdContext.get()
  const stepStart = Date.now()
  
  console.log(`🔐 [${requestId}] Verifying user identity`)
  
  if (request.token === 'valid-token') {
    UserContext.set({ id: 'user123', name: 'Alice' })
  }
  
  // Record timing for this step
  const timing = TimingContext.get()
  timing.steps.push({ name: 'auth', time: Date.now() - stepStart })
  TimingContext.set(timing)
  
  return next(request)
})

// Step 3: Process business logic
apiPipeline.use((request, next) => {
  const requestId = RequestIdContext.get()
  const user = UserContext.get()
  const stepStart = Date.now()
  
  console.log(`💼 [${requestId}] Processing business logic`)
  
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
  
  // Simulate business processing
  const simulatedWork = Math.random() * 50
  const start = Date.now()
  while (Date.now() - start < simulatedWork) {}
  
  const timing = TimingContext.get()
  timing.steps.push({ name: 'business', time: Date.now() - stepStart })
  TimingContext.set(timing)
  
  return next(request)
})

// Step 4: Generate response
apiPipeline.use((request) => {
  const requestId = RequestIdContext.get()
  const user = UserContext.get()
  const timing = TimingContext.get()
  const totalTime = Date.now() - timing.start
  
  console.log(`📦 [${requestId}] Generating response (total time: ${totalTime}ms)`)
  
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

// 🧪 Test
console.log('=== Successful Request ===')
const successResult = apiPipeline.run({ 
  url: '/api/profile', 
  token: 'valid-token' 
})
console.log(JSON.stringify(successResult, null, 2))

console.log('\n=== Unauthorized Request ===')
const failResult = apiPipeline.run({ 
  url: '/api/profile' 
})
console.log(JSON.stringify(failResult, null, 2))
```

### Context Best Practices

1. **Clear Responsibilities**: Each Context handles specific type of data
2. **Descriptive Naming**: Use descriptive names like `UserContext`, `TimingContext`
3. **Default Values**: Always set reasonable default values for Context
4. **Type Constraints**: Use TypeScript types to ensure correct data structure

Now you've mastered Context usage! Next, let's learn about the Container concept.

---

## Step Five: Container: Behind-the-Scenes Isolation Mechanism

You might have noticed a detail: every time you call `pipeline.run()`, Context starts fresh and doesn't interfere with each other. How is this achieved?

### What is Container?

**Container** is the behind-the-scenes hero of Farrow Pipeline:
- Each `pipeline.run()` automatically creates an independent Container
- Container manages all Context data for that execution
- When multiple requests run concurrently, their Contexts are completely isolated

### Container Implementation Principle

Container is based on Node.js's **AsyncLocalStorage**:
- This is an async context tracking API provided by Node.js
- It can maintain context state throughout async call chains
- **Therefore Farrow Pipeline is primarily designed for Node.js server environments**
- Browser environments lack AsyncLocalStorage, limiting Context functionality

### Simple Verification: Automatic Context Isolation

```typescript
import { createPipeline, createContext } from 'farrow-pipeline'

const CounterContext = createContext<number>(0)

const pipeline = createPipeline<string, { input: string, count: number }>()

pipeline.use((input, next) => {
  // Each request starts counting from 0
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

// Multiple runs, each with independent counting
console.log(pipeline.run('First'))   // { input: 'First', count: 1 }
console.log(pipeline.run('Second'))  // { input: 'Second', count: 1 }
console.log(pipeline.run('Third'))   // { input: 'Third', count: 1 }
```

### Test-Specific Container

Sometimes we need to preset Context values for testing:

```typescript
import { createContainer } from 'farrow-pipeline'

const UserContext = createContext<string>('anonymous')

// Create test-specific Container with preset user as 'test-user'
const testContainer = createContainer({
  user: UserContext.create('test-user')
})

// Use test Container
const result = pipeline.run(
  { action: 'getData' },
  { container: testContainer }
)
// In this run, UserContext.get() will return 'test-user'
```

### Key Points

1. **Automatic Operation**: Container works behind the scenes automatically, you usually don't need to worry about it
2. **Complete Isolation**: Each `run()` has independent Context environment
3. **Concurrency Safe**: Multiple concurrent requests won't conflict
4. **Test Friendly**: Can create preset Containers for testing

Most of the time, you just need to know "Context will automatically isolate"!

---

## Step Six: Proper Pipeline Nesting

Now that you've mastered the basic concepts of Pipeline, let's learn how to **properly compose multiple Pipelines**. Here we'll focus on the **real purpose** of `usePipeline`.

### Two Ways to Nest

Farrow Pipeline provides two ways to nest Pipelines:

#### **Direct Nesting**: Simple and Efficient

When Pipeline input/output types are compatible, you can nest directly:

```typescript
import { createPipeline } from 'farrow-pipeline'

type User = { username: string; email: string }
type Result = { ok: boolean }

// Sub-Pipeline: validate and mark result
const validate = createPipeline<User, { user: User; valid: boolean }>()
validate.use((u) => ({
  user: u,
  valid: u.username.length >= 3 && u.email.includes('@'),
}))

// Main Pipeline: directly nest sub-Pipeline
const main = createPipeline<User, Result>()
main.use(validate)
main.use(({ valid }) => ({ ok: valid }))

// main.run({ username: 'alice', email: 'a@b.com' }) -> { ok: true }
```

#### **usePipeline**: Context Passing and Error Handling

The real purpose of `usePipeline` is:
- **Maintain Context Passing**: Ensure sub-Pipeline can access parent Pipeline's Context
- **Error Handling**: Can use try-catch to handle sub-Pipeline errors
- **Return Value Processing**: Further process sub-Pipeline results

```typescript
import { createPipeline, usePipeline } from 'farrow-pipeline'

// Sub-Pipelines with different signatures: input/output gradually transform
type Incoming = { authorization?: string }
type Authed = { userId: string }
type Order = { userId: string; items: string[] }
type Response = { status: number; body?: any }

// Authentication: Incoming -> Authed (may throw error)
const authenticate = createPipeline<Incoming, Authed>()
authenticate.use((req) => {
  if (req.authorization !== 'token') throw new Error('unauthorized')
  return { userId: 'u1' }
})

// Build order: Authed -> Order
const buildOrder = createPipeline<Authed, Order>()
buildOrder.use((u) => ({ userId: u.userId, items: ['book'] }))

// Checkout: Order -> Response
const checkout = createPipeline<Order, Response>()
checkout.use((order) => ({ status: 200, body: { order } }))

// Main Pipeline: Incoming -> Response
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

### When to Use Which Approach?

| Scenario | Recommended Approach | Reason |
|----------|---------------------|---------|
| Type-compatible simple composition | Direct nesting | Clean and efficient, type-safe |
| Need error handling | usePipeline | Can try-catch handle errors |
| Need Context passing | usePipeline | Ensure sub-Pipeline can access parent Context |
| Need to process return values | usePipeline | Can post-process sub-Pipeline results |

### Common Incorrect Usage

```typescript
// ❌ Wrong: Don't use usePipeline as function composition tool
const logger = usePipeline(createLogger())
const auth = usePipeline(createAuth())
return auth(logger(request))  // This is wrong!

// ✅ Correct: Real purpose of usePipeline
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

### Core Value of usePipeline

1. **Context Inheritance**: Sub-Pipeline automatically inherits parent Pipeline's Container and Context
2. **Error Boundary**: Provides error handling mechanism for sub-Pipeline
3. **Flexible Control**: Can decide next operation based on sub-Pipeline results

Now you've mastered the proper way to nest Pipelines!

---

## Summary

🎉 **Congratulations!** You've completed the complete learning journey of Farrow Pipeline!

## Core Concepts Mastery Checklist

✅ **Pipeline = Type-safe assembly line**
- Data passes through middleware in order
- TypeScript type constraints ensure safety

✅ **Context = Shared memory across middleware**
- Pass state between all processing steps
- Automatic isolation, concurrency safe

✅ **Container = Independent workspace**
- Each `run()` creates isolated environment
- Concurrent multi-request processing without interference
- Based on Node.js AsyncLocalStorage implementation

✅ **usePipeline = Context passing + error handling**
- Maintain sub-Pipeline Context inheritance
- Provide try-catch error handling capability
- **Not a function composition tool!**

## Learning Path from Beginner to Practice

1. 🏠 **Package sorting center analogy** → Understand basic Pipeline concepts
2. ⚡ **5-minute quick start** → Master most basic usage
3. 🔄 **Data flow mechanism** → Understand the role of `next()`
4. 📦 **Context state sharing** → Pass data across middleware
5. 🏗️ **Container isolation mechanism** → Secret of concurrency safety
6. 🔧 **Pipeline nesting techniques** → Proper use of usePipeline

## Key Points Summary

### **Recommended Practices**
```typescript
// Direct nesting: when types are compatible
mainPipeline.use(subPipeline)

// usePipeline: when Context passing or error handling needed
const runSubPipeline = usePipeline(subPipeline)
try {
  const result = runSubPipeline(input)
  return next(result)
} catch (error) {
  return handleError(error)
}
```

### **Avoid Pitfalls**
```typescript
// Wrong: using usePipeline for function composition
return auth(logger(request))  // ❌

// Correct: using usePipeline within middleware
pipeline.use((request, next) => {
  const runAuth = usePipeline(authPipeline)
  // ... processing logic
})
```

## Next Steps

You now have the ability to build **enterprise-level middleware systems**! You can start:

- 🏗️ **Build your own Web framework** middleware
- 📊 **Design data processing pipelines**
- 🔧 **Create reusable business components**
- 🚀 **Optimize existing project architecture**

### ⚠️ Important Reminder

**Farrow Pipeline is primarily designed for Node.js server environments** because:
- Container is based on Node.js AsyncLocalStorage implementation
- Browser environments lack this API, limiting Context functionality
- Recommended for use in Node.js server projects

### Further Learning

- [📖 Complete API Reference](/api/farrow-pipeline) - Learn about all available features
- [⚡ Async Pipeline](/api/farrow-pipeline#createasyncpipeline) - Handle async scenarios
- [🛠️ Best Practices](/api/farrow-pipeline#best-practices) - Production environment guide

**Happy Coding! 🚀**