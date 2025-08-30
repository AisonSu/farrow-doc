# farrow-pipeline

Pipeline and Context system.

## Overview

`farrow-pipeline` is the core infrastructure of the Farrow framework, providing:

- 🔗 Type-safe Pipeline system
- 🎭 React Hooks-style Context API
- 📦 Request-level state isolation
- ⚡ Lazy loading support

## Features

### Pipeline System

Build type-safe processing pipelines:

```typescript
const pipeline = createPipeline<Input, Output>()

pipeline.use((input, next) => {
  // Processing logic
  return next(input)
})

const result = pipeline.run(input)
```

### Context System

Elegant state management:

```typescript
const UserContext = createContext<User>()

// Set
UserContext.set(user)

// Get
const user = UserContext.get()
```

### Container Isolation

Independent state space for each request:

```typescript
const container = createContainer({
  [UserContext]: user,
  [ThemeContext]: theme
})

runWithContainer(() => {
  // Isolated execution environment
}, container)
```

## Installation

```bash
npm install farrow-pipeline
```

## Quick Start

```typescript
import { createPipeline, createContext } from 'farrow-pipeline'

// Create Context
const CounterContext = createContext(0)

// Create Pipeline
const pipeline = createPipeline<number, string>()

pipeline.use((input, next) => {
  CounterContext.set(input)
  return next(input * 2)
})

pipeline.use((input, next) => {
  const count = CounterContext.get()
  return `Original: ${count}, Processed: ${input}`
})

// Run
const result = pipeline.run(5)
// "Original: 5, Processed: 10"
```

## Core Concepts

### Pipeline

Data processing pipelines, supporting:

- Sync Pipeline: `createPipeline`
- Async Pipeline: `createAsyncPipeline`
- Pipeline composition: `usePipeline`
- Lazy loading: `useLazy`

### Context

State management system:

- Create: `createContext`
- Get: `context.get()`
- Set: `context.set()`
- Assert: `context.assert()`

### Container

Isolation container:

- Create: `createContainer`
- Run: `runWithContainer`
- Request-level isolation

## Use Cases

### Dependency Injection

```typescript
const DatabaseContext = createContext<Database>()
const CacheContext = createContext<Cache>()

app.use((request, next) => {
  DatabaseContext.set(new Database())
  CacheContext.set(new Cache())
  return next(request)
})
```

### Request Tracing

```typescript
const RequestIdContext = createContext<string>()

app.use((request, next) => {
  RequestIdContext.set(generateId())
  const response = next(request)
  return response.header('X-Request-ID', RequestIdContext.get())
})
```

### Middleware Composition

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

## Integration with Other Modules

### With farrow-http

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

### With farrow-schema

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

## Best Practices

### Context Naming

```typescript
// ✅ Good
const CurrentUserContext = createContext<User>()
const DatabaseConnectionContext = createContext<Database>()

// ❌ Avoid
const DataContext = createContext()
const ConfigContext = createContext()
```

### Pipeline Composition

```typescript
// ✅ Small, focused Pipelines
const authPipeline = createPipeline()
const loggingPipeline = createPipeline()
const validationPipeline = createPipeline()

// Compose usage
const appPipeline = createPipeline()
appPipeline.use(compose(
  authPipeline,
  loggingPipeline,
  validationPipeline
))
```

## API Reference

For detailed API documentation, see [farrow-pipeline API](/en/api/farrow-pipeline)

## Related Links

- [GitHub](https://github.com/farrowjs/farrow)
- [Core Concepts](/en/guide/core-concepts)
- [Advanced Tutorial](/en/guide/advanced)