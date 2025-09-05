# API Reference

Farrow provides a complete API for building type-safe Web applications. This documentation provides detailed API reference for all core modules.

## Core Modules

### [farrow-http](/en/api/farrow-http)
**TypeScript-first Web framework** - Provides type-safe routing and automatic validation

- HTTP/HTTPS server creation and configuration
- Type-safe routing patterns and automatic validation
- Powerful Response construction system
- Modular router and middleware system
- Context management and error handling
- Static file serving and CORS integration
- Express integration support

### [farrow-schema](/en/api/farrow-schema)
**Powerful type validation and serialization library** - Easily handle data through type-driven design

- Complete basic type system (String, Number, Boolean, Date, ID)
- Flexible composite types (List, Optional, Nullable, Record, Tuple)
- Structured type definitions (ObjectType, Struct)
- Union and intersection types (Union, Intersect, Literal)
- Schema operation tools (pickObject, omitObject, partial, required)
- Built-in and custom validator systems
- Complete TypeScript type inference support

### [farrow-pipeline](/en/api/farrow-pipeline)
**Type-safe middleware pipeline library** - Provides functional programming style request processing

- Synchronous and asynchronous Pipeline creation
- Type-safe context management system
- Container concept and dependency injection
- Pipeline composition and middleware execution
- Utilities and error handling
- Async tracing support

## Quick Navigation

### HTTP Service

#### Getting Started
- [Installation and Quick Start](/en/api/farrow-http#installation-and-quick-start) - Get started in 5 minutes
- [Basic Examples](/en/api/farrow-http#basic-examples) - Common code templates
- [Complete Examples](/en/api/farrow-http#complete-examples) - Production-ready application code

#### Core API
- [Server Creation](/en/api/farrow-http#server-creation) - `Http()`, `Https()`, configuration options
- [Route Definition](/en/api/farrow-http#route-definition) - `get()`, `post()`, `match()`, etc.
- [Response Construction](/en/api/farrow-http#response-construction) - Response objects and methods
- [Middleware](/en/api/farrow-http#middleware) - `use()`, onion model, error handling

#### Advanced Features  
- [Router System](/en/api/farrow-http#router-system) - `Router()`, `route()`, modular
- [Context Management](/en/api/farrow-http#context-management) - Context, hooks, request isolation
- [Error Handling](/en/api/farrow-http#error-handling) - Exception handling mechanism
- [Static Files](/en/api/farrow-http#static-files) - `serve()`, security protection
- [Testing Support](/en/api/farrow-http#testing) - Test configuration and examples

### Schema Validation

#### Basic Types
- [`String`](/en/api/farrow-schema#string---string-type) - String validation
- [`Number`](/en/api/farrow-schema#number---numeric-type) - Numeric validation
- [`Boolean`](/en/api/farrow-schema#boolean---boolean-type) - Boolean validation
- [`Date`](/en/api/farrow-schema#date---date-type) - Date validation
- [`ID`](/en/api/farrow-schema#id---identifier-type) - Identifier type

#### Composite Types
- [`List`](/en/api/farrow-schema#list---array-type) - Array type validation
- [`Optional`](/en/api/farrow-schema#optional---optional-type) - Optional fields
- [`Nullable`](/en/api/farrow-schema#nullable---nullable-type) - Nullable type
- [`Record`](/en/api/farrow-schema#record---key-value-type) - Key-value type
- [`Tuple`](/en/api/farrow-schema#tuple---tuple-type) - Tuple type

#### Structured Types
- [`ObjectType`](/en/api/farrow-schema#objecttype---structured-object) - Object type definition
- [`Struct`](/en/api/farrow-schema#struct---quick-construction) - Struct definition
- [`Union`](/en/api/farrow-schema#union---or-logic) - Union types
- [`Intersect`](/en/api/farrow-schema#intersect---and-logic) - Intersection types

#### Utility Functions
- [`TypeOf`](/en/api/farrow-schema#typeof---extract-typescript-type) - Type inference
- [`pickObject`](/en/api/farrow-schema#pickobject---select-objecttype-fields) - Pick fields
- [`omitObject`](/en/api/farrow-schema#omitobject---exclude-objecttype-fields) - Omit fields
- [`partial`](/en/api/farrow-schema#partial---convert-to-optional-fields) - Convert to optional

### Pipeline System

#### Pipeline Creation
- [`createPipeline()`](/en/api/farrow-pipeline#createpipeline) - Create synchronous pipeline
- [`createAsyncPipeline()`](/en/api/farrow-pipeline#createasyncpipeline) - Create asynchronous pipeline
- [`usePipeline()`](/en/api/farrow-pipeline#usepipeline) - Use Pipeline

#### Context Management
- [`createContext()`](/en/api/farrow-pipeline#createcontext) - Create context
- [`createContainer()`](/en/api/farrow-pipeline#createcontainer) - Create container
- [Container Concept](/en/api/farrow-pipeline#container-concept) - Dependency injection container

## API Conventions

### Naming Conventions

- **Types**: PascalCase (e.g., `ObjectType`, `HttpError`)
- **Functions**: camelCase (e.g., `createContext`, `pickStruct`)
- **Constants**: UPPER_CASE (e.g., `DEFAULT_PORT`)
- **Files**: kebab-case (e.g., `farrow-http`)

### Type Annotations

All APIs include complete TypeScript type definitions:

```typescript
// Function signature
function createContext<T>(defaultValue: T): Context<T>

// Type definition
type RequestInfo = {
  readonly pathname: string
  readonly method?: string
  readonly query?: RequestQuery
  readonly body?: any
  readonly headers?: RequestHeaders
  readonly cookies?: RequestCookies
}
```

### Example Code

Every API provides real usage examples:

```typescript
// Create application
const app = Http()

// Define Schema
class User extends ObjectType {
  id = Int
  name = String
  email = String
}

// Type-safe routing
app.post('/users', {
  body: User
}).use((request) => {
  // request.body is already validated and type-safe
  return Response.status(201).json(createUser(request.body))
})
```

## Common Usage Patterns

### Basic Web Application

```typescript
import { Http, Response } from 'farrow-http'
import { ObjectType, String, Int } from 'farrow-schema'

// Define data model
class User extends ObjectType {
  id = Int
  name = String
  email = String
}

// Create application
const app = Http()

// API routes
app.get('/users').use(() => Response.json(users))
app.post('/users', { body: User }).use((req) => {
  const user = createUser(req.body)
  return Response.status(201).json(user)
})

app.listen(3000)
```

### Pipeline Middleware

```typescript
import { createAsyncPipeline, createContext } from 'farrow-pipeline'

// Create context
const UserContext = createContext<User | null>(null)

// Create pipeline
const pipeline = createAsyncPipeline<Request, Response>()

// Authentication middleware
pipeline.use(async (req, next) => {
  const user = await authenticate(req)
  UserContext.set(user)
  return next(req)
})

// Business processing
pipeline.use(async (req) => {
  const user = UserContext.get()
  return { success: true, user }
})
```

### Schema Validation

```typescript
import { 
  ObjectType, String, Int, List, Union, 
  Optional, pickStruct, omitStruct 
} from 'farrow-schema'

// Complete user model
class User extends ObjectType {
  id = Int
  name = String
  email = String
  role = Union([Literal('admin'), Literal('user')])
  profile = {
    bio: Optional(String),
    avatar: Optional(String)
  }
  tags = List(String)
}

// API Schema
const CreateUser = pickStruct(User, ['name', 'email', 'role'])
const PublicUser = omitStruct(User, ['email'])

// Type inference
type UserType = TypeOf<typeof User>
type CreateUserType = TypeOf<typeof CreateUser>
```

## Version Compatibility

| Farrow Version | Node.js | TypeScript | Status |
|----------------|---------|------------|--------|
| 2.x            | >= 16.0 | >= 4.5     | Recommended |
| 1.x            | >= 14.0 | >= 4.1     | Maintained |

## Learning Path

### 1. Getting Started
1. Read [Getting Started](/en/guide/getting-started)
2. Learn [farrow-http](/en/api/farrow-http) basics
3. Understand [farrow-schema](/en/api/farrow-schema) data validation

### 2. Intermediate
1. Master [farrow-pipeline](/en/api/farrow-pipeline) pipeline system
2. Learn middleware development and error handling
3. Understand Context system and dependency injection

### 3. Advanced
1. Custom Schema validators
2. Complex Pipeline composition
3. Performance optimization and best practices

## Getting Help

Having trouble? We provide multiple support channels:

- **Documentation** - Check the [complete guide](/en/guide/) for concepts and best practices
- **Community** - Chat with developers on [Discord](https://discord.gg/farrow)
- **Bug Reports** - Report bugs on [GitHub Issues](https://github.com/farrowjs/farrow/issues)
- **Feature Requests** - Propose ideas on [GitHub Discussions](https://github.com/farrowjs/farrow/discussions)
- **Sample Code** - Check out the [farrow-examples](https://github.com/farrowjs/farrow-examples) repository

---

**Ready to get started?** Choose a module to dive deep and build your next type-safe Web application!