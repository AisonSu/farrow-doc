# Getting Started

> Just 10 minutes to begin your Farrow journey

## Before You Start

Before we begin, let's understand Farrow's positioning:

**Farrow is a progressive framework**. This means:

- You can start with the simplest HTTP server
- Gradually add features as needed
- Each part can be used independently
- Flexible composition, customizable on demand

## Environment Setup

### System Requirements

- Node.js 14.0 or higher
- TypeScript 4.1 or higher (will be automatically installed)
- VS Code recommended for the best development experience

### Creating a Project

#### Method 1: Using Template (Recommended)

The fastest way is to use the official scaffolding:

```bash
# Using npm
npm init farrow-app farrow-project

# Using yarn
yarn create farrow-app farrow-project

# Using pnpm
pnpm create farrow-app farrow-project
```

Then select a template.

#### Method 2: Manual Installation

If you want to create a project manually:

##### 1. Initialize Project

```bash
mkdir farrow-project
cd farrow-project
npm init -y
```

##### 2. Install Dependencies

```bash
# Install Farrow libraries
npm install farrow-http

# Install development tools
npm install --save-dev farrow typescript
```

##### 3. Configure Scripts

Add scripts in `package.json`:

```json
{
  "scripts": {
    "dev": "farrow dev",
    "build": "farrow build",
    "start": "farrow start"
  }
}
```

::: tip Tip
If you need more control, you can also manually configure TypeScript:

```bash
# Install core dependencies
npm install farrow-http farrow-schema farrow-pipeline

# Install dev dependencies
npm install -D typescript @types/node tsx
```

Create `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "outDir": "./dist",
    "rootDir": "./src"
  }
}
```

:::

## First Application: Hello World

Let's create the simplest Farrow application:

### 1. Create Server

Create `src/index.ts` as the entry file:

```typescript
import { Http, Response } from 'farrow-http'

const http = Http()

http.use(() => {
  return Response.text('Hello Farrow')
})

http.listen(3000, () => {
  console.log('server started at http://localhost:3000')
})
```

### 2. Run Application

Start the development server with:

```bash
npm run dev
```

Open your browser and navigate to http://localhost:3000.

Congratulations! You've created your first Farrow application!

## More Advanced: TODO API

Let's create a more practical example - a simple TODO API, and learn how to use Context to manage state:

### 1. Define Data Structures and Context

```typescript
import { Http, Response } from 'farrow-http'
import { ObjectType, String, Number, Boolean, List, TypeOf } from 'farrow-schema'
import { createContext } from 'farrow-pipeline'

// Use Schema to define data structures
class Todo extends ObjectType {
  id = Number
  title = String
  completed = Boolean
}

// Automatically get TypeScript types
type TodoType = TypeOf<typeof Todo>

// Mock database
let todos: TodoType[] = [
  { id: 1, title: 'Learn Farrow', completed: false },
  { id: 2, title: 'Build Application', completed: false },
]

// Create Context to manage user information (will be used later)
const UserContext = createContext<{ name: string } | null>(null)
```

### 2. Create CRUD API

```typescript
const app = Http()

// Get all TODOs
app.get('/api/todos').use(() => {
  return Response.json(todos)
})

// Get single TODO - note type-safe route parameters
app.get('/api/todos/<id:int>').use((request) => {
  // request.params.id is automatically inferred as number type and validated at runtime
  const todo = todos.find(t => t.id === request.params.id)
  
  if (!todo) {
    return Response.status(404).json({ error: 'Todo not found' })
  }
  
  return Response.json(todo)
})

// Create TODO - you can also choose to use custom Schema for type constraints and validation
class CreateTodoRequest extends ObjectType {
  title = String
}

app.post('/api/todos', {
  body: CreateTodoRequest  // Automatically validate request body
}).use((request) => {
  const newTodo: TodoType = {
    id: Date.now(),
    title: request.body.title,  // Type-safe
    completed: false
  }
  
  todos.push(newTodo)
  
  return Response
    .status(201)
    .json(newTodo)
    .header('Location', `/api/todos/${newTodo.id}`)
})

// Update TODO
app.put('/api/todos/<id:int>', {
  body: {
    title: String,
    completed: Boolean
  }
}).use((request) => {
  const todo = todos.find(t => t.id === request.params.id)
  
  if (!todo) {
    return Response.status(404).json({ error: 'Todo not found' })
  }
  
  // Update data
  todo.title = request.body.title
  todo.completed = request.body.completed
  
  return Response.json(todo)
})

// Delete TODO
app.delete('/api/todos/<id:int>').use((request) => {
  const index = todos.findIndex(t => t.id === request.params.id)
  
  if (index === -1) {
    return Response.status(404).json({ error: 'Todo not found' })
  }
  
  todos.splice(index, 1)
  
  return Response.empty()  // 204 No Content
})

app.listen(3000)
```

### 3. Use Context to Enhance Functionality

Now let's add a simple "user" concept, using Context to share user information across requests:

```typescript
// Mock authentication middleware
app.use((request, next) => {
  // Get username from request header (in real apps, you should validate token)
  const username = request.headers?.['x-username']
  
  if (username) {
    // Set current user to Context
    UserContext.set({ name: username })
  }
  
  return next(request)
})

// Record creator when creating TODO
app.post('/api/todos', {
  body: CreateTodoRequest
}).use((request) => {
  // Get current user from Context
  const user = UserContext.get()
  
  const newTodo: TodoType = {
    id: Date.now(),
    title: request.body.title,
    completed: false
  }
  
  todos.push(newTodo)
  
  // If there's user information, record who created this TODO
  if (user) {
    console.log(`TODO created by ${user.name}`)
  }
  
  return Response
    .status(201)
    .json(newTodo)
    .header('Location', `/api/todos/${newTodo.id}`)
    .header('X-Created-By', user?.name || 'anonymous')
})

// Get current user information
app.get('/api/me').use(() => {
  const user = UserContext.get()
  
  if (!user) {
    return Response.status(401).json({ error: 'Not authenticated' })
  }
  
  return Response.json({ user })
})
```

### 4. Add Error Handling

Let's add unified error handling for the API:

```typescript
// Error handling middleware
app.use(async (request, next) => {
  try {
    return await next(request)
  } catch (error) {
    console.error('Error:', error)
    
    // Return friendly error response
    return Response
      .status(500)
      .json({ 
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
  }
})

// Use custom error class
class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message)
  }
}

// Throw errors in handlers
app.get('/api/todos/<id:int>').use((request) => {
  const todo = todos.find(t => t.id === request.params.id)
  
  if (!todo) {
    throw new ApiError(404, 'Todo not found')
  }
  
  return Response.json(todo)
})
```

### 5. Test API

Test with curl or Postman:

```bash
# Get all TODOs
curl http://localhost:3000/api/todos

# Create new TODO (anonymous)
curl -X POST http://localhost:3000/api/todos \
  -H "Content-Type: application/json" \
  -d '{"title":"Learn TypeScript"}'

# Create new TODO (with user info)
curl -X POST http://localhost:3000/api/todos \
  -H "Content-Type: application/json" \
  -H "X-Username: Alice" \
  -d '{"title":"Learn Context"}'

# Get current user info
curl http://localhost:3000/api/me \
  -H "X-Username: Alice"

# Update TODO
curl -X PUT http://localhost:3000/api/todos/1 \
  -H "Content-Type: application/json" \
  -d '{"title":"Master Farrow","completed":true}'

# Delete TODO
curl -X DELETE http://localhost:3000/api/todos/1

# Test error handling (non-existent TODO)
curl http://localhost:3000/api/todos/999999
```

## Core Concepts Preview

Through this simple example, you've encountered Farrow's core concepts:

### Type-Safe Routing

```typescript
// Route parameters automatically parsed and type-inferred
app.get('/todos/<id:int>')  // id is number
app.get('/users/<name:string>')  // name is string
app.get('/posts/<published:boolean>')  // published is boolean
```

### Schema-Driven

```typescript
// Define once, get compile-time type checking + runtime type validation
class User extends ObjectType {
  name = String
  age = Number
}

// Automatically validate request body
app.post('/users', { body: User })
```

### Functional Middleware

```typescript
// Pure functions, must return response, now you can't forget to return a response!
app.use((request, next) => {
  console.log(`${request.method} ${request.pathname}`)
  return next(request)  // Continue processing
})
```

### Context System

```typescript
// React Hooks-style state management
const UserContext = createContext<User | null>(null)

// Set in middleware
UserContext.set(currentUser)

// Get anywhere
const user = UserContext.get()
```

### Elegant Response Building

```typescript
// Chainable API, clear and intuitive
Response
  .json(data)
  .status(201)
  .header('X-Custom', 'value')
  .cookie('session', 'abc123')
```

## Progressive Migration

### Integration with Existing Projects

Farrow supports progressive adoption, you can gradually introduce Farrow into existing Express or Koa projects:

#### Using Farrow in Express

```typescript
import express from 'express'
import { Http } from 'farrow-http'
import { adapter } from 'farrow-express'

// Existing Express application
const expressApp = express()
expressApp.get('/legacy', (req, res) => {
  res.json({ message: 'Express route' })
})

// Create Farrow application for new features
const farrowApp = Http()
farrowApp.get('/api/users/<id:int>').use((request) => {
  return Response.json({ id: request.params.id })
})

// Mount Farrow to Express
expressApp.use('/new', adapter(farrowApp))

expressApp.listen(3000)
```

#### Using Farrow in Koa

```typescript
import Koa from 'koa'
import { Http } from 'farrow-http'
import { adapter } from 'farrow-koa'

// Existing Koa application
const koaApp = new Koa()

// Farrow application handles new API
const farrowApp = Http()
farrowApp.post('/api/todos', { body: TodoSchema }).use((request) => {
  return Response.json(createTodo(request.body))
})

// Use Farrow as Koa middleware
koaApp.use(adapter(farrowApp))

koaApp.listen(3000)
```

**Benefits of Progressive Migration:**
- No need to rewrite entire application
- Use Farrow for new features, enjoy type safety
- Migrate at your own pace
- Keep production environment stable

## Next Steps

Congratulations on completing the Farrow quickstart! You've learned:

- Creating Farrow applications  
- Defining type-safe routes  
- Using Schema to validate data  
- Using Context to manage state  
- Building RESTful APIs  
- Integrating with existing frameworks  

### Continue Learning

Based on your needs, choose your next step:

**[Core Concepts](/en/guide/core-concepts)**  
Deeply understand Farrow's design philosophy and architecture

**[Essentials](/en/guide/essentials)**  
Learn all features needed for daily development

**[Practical Projects](/en/examples/)**  
Master best practices through complete projects

**[API Reference](/en/api/)**  
Browse detailed API documentation