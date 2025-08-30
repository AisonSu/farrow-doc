# API Reference

Farrow provides a complete API for building type-safe Web applications. This documentation provides detailed API reference for all core modules.

## Core Modules

### [farrow-http](/en/api/farrow-http)
**HTTP server and routing system** - Build type-safe Web applications

- HTTP application and HTTPS support
- Powerful routing system and URL Schema syntax
- Response builder and custom responses
- Middleware system and error handling
- Context Hooks and request processing

### [farrow-schema](/en/api/farrow-schema)
**Schema definition and validation system** - Runtime type validation and inference

- Rich basic types (String, Int, Boolean, Date, etc.)
- Composite types (ObjectType, List, Union, Tuple, etc.)
- Type modifiers (Optional, Nullable, Strict, etc.)
- Schema operation tools (pickStruct, omitStruct, etc.)
- Complete validation system and custom validators
- TypeScript type inference support

### [farrow-pipeline](/en/api/farrow-pipeline)
**Pipeline and Context system** - Type-safe middleware pipeline

- Synchronous and asynchronous Pipeline creation
- Flexible Context management system
- Pipeline composition and middleware execution
- Utility functions and type checking
- Advanced patterns and best practices

## Quick Navigation

### HTTP Service

#### Core API
- [`Http()`](/en/api/farrow-http#http-options) - Create HTTP application instance
- [`Https()`](/en/api/farrow-http#https-options) - Create HTTPS application instance
- [`Router()`](/en/api/farrow-http#router-创建路由器) - Create modular router

#### Response Handling
- [`Response.json()`](/en/api/farrow-http#response-json-json-响应) - JSON response
- [`Response.text()`](/en/api/farrow-http#response-text-纯文本响应) - Text response
- [`Response.file()`](/en/api/farrow-http#response-file-文件响应) - File response
- [`Response.redirect()`](/en/api/farrow-http#response-redirect-重定向响应) - Redirect response

#### Route Matching
- [HTTP method shortcuts](/en/api/farrow-http#http-方法快捷方式) - `get()`, `post()`, `put()`, etc.
- [URL Schema syntax](/en/api/farrow-http#url-schema-语法) - Path parameters and query parameters
- [`match()`](/en/api/farrow-http#match-详细路由匹配) - Detailed route matching

### Schema Validation

#### Basic Types
- [`String`](/en/api/farrow-schema#string-字符串类型) - String validation
- [`Int`](/en/api/farrow-schema#int-整数类型) / [`Number`](/en/api/farrow-schema#number-数字类型（整数和浮点数）) - Number validation
- [`Boolean`](/en/api/farrow-schema#boolean-布尔类型) - Boolean validation
- [`Date`](/en/api/farrow-schema#date-日期类型) - Date validation
- [`Literal`](/en/api/farrow-schema#literal-精确值匹配) - Literal types

#### Composite Types
- [`ObjectType`](/en/api/farrow-schema#objecttype-对象类型) - Object type definition
- [`List`](/en/api/farrow-schema#list-数组类型) - Array type validation
- [`Union`](/en/api/farrow-schema#union-联合类型) - Union types
- [`Struct`](/en/api/farrow-schema#struct-结构体类型) - Struct definition

#### Utility Functions
- [`pickStruct()`](/en/api/farrow-schema#pickstruct-选择字段) - Pick fields
- [`omitStruct()`](/en/api/farrow-schema#omitstruct-排除字段) - Omit fields
- [`partialStruct()`](/en/api/farrow-schema#partialstruct-可选化所有字段) - Partial update
- [`TypeOf<T>`](/en/api/farrow-schema#typeof-获取-typescript-类型) - Type inference

### Pipeline System

#### Pipeline Creation
- [`createPipeline()`](/en/api/farrow-pipeline#createpipeline) - Create synchronous pipeline
- [`createAsyncPipeline()`](/en/api/farrow-pipeline#createasyncpipeline) - Create asynchronous pipeline
- [`usePipeline()`](/en/api/farrow-pipeline#usepipeline) - Use Pipeline

#### Context Management
- [`createContext()`](/en/api/farrow-pipeline#createcontext) - Create context
- [`createContainer()`](/en/api/farrow-pipeline#createcontainer) - Create container
- [`useContainer()`](/en/api/farrow-pipeline#usecontainer) - Get container

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