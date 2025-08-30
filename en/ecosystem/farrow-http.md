# farrow-http

HTTP server and routing system core package.

## Overview

`farrow-http` is the HTTP layer implementation of the Farrow framework, providing:

- 🎯 Type-safe routing system
- 🔗 Functional middleware
- 📝 Automatic parameter parsing and validation
- 🎨 Elegant response building API

## Features

### Type-safe Routing

Utilizing TypeScript's Template Literal Types for compile-time type inference:

```typescript
app.get('/users/<id:int>/posts/<postId:string>').use((request) => {
  // request.params.id: number
  // request.params.postId: string
})
```

### Automatic Validation

Combined with farrow-schema for automatic request data validation:

```typescript
app.post('/users', { body: UserSchema }).use((request) => {
  // request.body is validated and type-safe
})
```

### Pure Function Middleware

Middleware are pure functions that must return responses:

```typescript
app.use((request, next) => {
  // Pre-processing
  const response = next(request)
  // Post-processing
  return response
})
```

## Installation

```bash
npm install farrow-http
```

## Quick Start

```typescript
import { Http, Response } from 'farrow-http'

const app = Http()

app.get('/').use(() => {
  return Response.json({ message: 'Hello, Farrow!' })
})

app.listen(3000)
```

## Core Concepts

### Routing System

Supports various parameter types and patterns:

- Basic types: `int`, `float`, `string`, `boolean`, `id`
- Optional parameters: `<name?:type>`
- Array parameters: `<name+:type>`, `<name*:type>`
- Query parameters: `?<query:type>`

### Middleware Model

Uses onion model, supporting pre and post processing:

```typescript
app.use((request, next) => {
  console.log('1. Pre-processing')
  const response = next(request)
  console.log('2. Post-processing')
  return response
})
```

### Response Building

Chained API for building responses:

```typescript
Response
  .json(data)
  .status(201)
  .header('Location', '/resource/123')
  .cookie('session', 'abc123')
```

## Integration with Other Modules

### With farrow-schema

```typescript
import { ObjectType, String } from 'farrow-schema'

class User extends ObjectType {
  name = String
  email = String
}

app.post('/users', { body: User })
```

### With farrow-pipeline

```typescript
import { createContext } from 'farrow-pipeline'

const UserContext = createContext<User>()

app.use((request, next) => {
  UserContext.set(currentUser)
  return next(request)
})
```

## API Reference

For detailed API documentation, see [farrow-http API](/en/api/farrow-http)

## Related Links

- [GitHub](https://github.com/farrowjs/farrow)
- [Getting Started](/en/guide/getting-started)
- [Essentials](/en/guide/essentials)