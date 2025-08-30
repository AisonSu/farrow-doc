# 快速开始

> 只需 10 分钟，开启你的 Farrow 之旅

## 开始之前

在开始之前，让我们先理解 Farrow 的定位：

**Farrow 是一个渐进式框架**。这意味着：

- 你可以从最简单的 HTTP 服务器开始
- 根据需要逐步添加功能
- 每个部分都可以独立使用
- 灵活组合，按需定制

## 环境准备

### 系统要求

- Node.js 14.0 或更高版本
- TypeScript 4.1 或更高版本（会自动安装）
- 推荐使用 VS Code 获得最佳开发体验

### 创建项目

#### 方式一：使用模板（推荐）

最快的方式是使用官方脚手架：

```bash
# 使用 npm
npm init farrow-app farrow-project

# 使用 yarn
yarn create farrow-app farrow-project

# 使用 pnpm
pnpm create farrow-app farrow-project
```

然后选择一个模板即可。

#### 方式二：手动安装

如果你想手动创建项目：

##### 1. 初始化项目

```bash
mkdir farrow-project
cd farrow-project
npm init -y
```

##### 2. 安装依赖

```bash
# 安装 Farrow 库
npm install farrow-http

# 安装开发工具
npm install --save-dev farrow typescript
```

##### 3. 配置脚本

在 `package.json` 中添加脚本：

```json
{
  "scripts": {
    "dev": "farrow dev",
    "build": "farrow build",
    "start": "farrow start"
  }
}
```

::: tip 提示
如果你需要更多控制，也可以手动配置 TypeScript：

```bash
# 安装核心依赖
npm install farrow-http farrow-schema farrow-pipeline

# 安装开发依赖
npm install -D typescript @types/node tsx
```

创建 `tsconfig.json`：

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

## 第一个应用：Hello World

让我们创建一个最简单的 Farrow 应用：

### 1. 创建服务器

创建 `src/index.ts` 作为入口文件：

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

### 2. 运行应用

使用以下命令启动开发服务器：

```bash
npm run dev
```

打开浏览器访问 http://localhost:3000。

恭喜！你已经创建了第一个 Farrow 应用！

## 进阶一点：TODO API

让我们创建一个更实际的例子 - 一个简单的 TODO API，并学习如何使用 Context 管理状态：

### 1. 定义数据结构和 Context

```typescript
import { Http, Response } from 'farrow-http'
import { ObjectType, String, Number, Boolean, List, TypeOf } from 'farrow-schema'
import { createContext } from 'farrow-pipeline'

// 使用 Schema 定义数据结构
class Todo extends ObjectType {
  id = Number
  title = String
  completed = Boolean
}

// 自动获得 TypeScript 类型
type TodoType = TypeOf<typeof Todo>

// 模拟数据库
let todos: TodoType[] = [
  { id: 1, title: '学习 Farrow', completed: false },
  { id: 2, title: '构建应用', completed: false },
]

// 创建 Context 来管理用户信息（后面会用到）
const UserContext = createContext<{ name: string } | null>(null)
```

### 2. 创建 CRUD API

```typescript
const app = Http()

// 获取所有 TODOs
app.get('/api/todos').use(() => {
  return Response.json(todos)
})

// 获取单个 TODO - 注意类型安全的路由参数
app.get('/api/todos/<id:int>').use((request) => {
  // request.params.id 自动推导为 number 类型，且会在运行时自动验证
  const todo = todos.find(t => t.id === request.params.id)
  
  if (!todo) {
    return Response.status(404).json({ error: 'Todo not found' })
  }
  
  return Response.json(todo)
})

// 创建 TODO - 你也可以选择自定义Schema进行类型约束和验证
class CreateTodoRequest extends ObjectType {
  title = String
}

app.post('/api/todos', {
  body: CreateTodoRequest  // 自动验证请求体
}).use((request) => {
  const newTodo: TodoType = {
    id: Date.now(),
    title: request.body.title,  // 类型安全
    completed: false
  }
  
  todos.push(newTodo)
  
  return Response
    .status(201)
    .json(newTodo)
    .header('Location', `/api/todos/${newTodo.id}`)
})

// 更新 TODO
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
  
  // 更新数据
  todo.title = request.body.title
  todo.completed = request.body.completed
  
  return Response.json(todo)
})

// 删除 TODO
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

### 3. 使用 Context 增强功能

现在让我们添加一个简单的"用户"概念，使用 Context 在请求间共享用户信息：

```typescript
// 模拟认证中间件
app.use((request, next) => {
  // 从请求头获取用户名（实际应用中应该验证 token）
  const username = request.headers?.['x-username']
  
  if (username) {
    // 设置当前用户到 Context
    UserContext.set({ name: username })
  }
  
  return next(request)
})

// 在创建 TODO 时记录创建者
app.post('/api/todos', {
  body: CreateTodoRequest
}).use((request) => {
  // 从 Context 获取当前用户
  const user = UserContext.get()
  
  const newTodo: TodoType = {
    id: Date.now(),
    title: request.body.title,
    completed: false
  }
  
  todos.push(newTodo)
  
  // 如果有用户信息，记录谁创建了这个 TODO
  if (user) {
    console.log(`TODO created by ${user.name}`)
  }
  
  return Response
    .status(201)
    .json(newTodo)
    .header('Location', `/api/todos/${newTodo.id}`)
    .header('X-Created-By', user?.name || 'anonymous')
})

// 获取当前用户的信息
app.get('/api/me').use(() => {
  const user = UserContext.get()
  
  if (!user) {
    return Response.status(401).json({ error: 'Not authenticated' })
  }
  
  return Response.json({ user })
})
```

### 4. 添加错误处理

让我们为 API 添加统一的错误处理：

```typescript
// 错误处理中间件
app.use((request, next) => {
  try {
    return next(request)
  } catch (error) {
    console.error('Error:', error)
    
    // 返回友好的错误响应
    return Response
      .status(500)
      .json({ 
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
  }
})

// 使用自定义错误类
class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message)
  }
}

// 在处理器中抛出错误
app.get('/api/todos/<id:int>').use((request) => {
  const todo = todos.find(t => t.id === request.params.id)
  
  if (!todo) {
    throw new ApiError(404, 'Todo not found')
  }
  
  return Response.json(todo)
})
```

### 5. 测试 API

使用 curl 或 Postman 测试：

```bash
# 获取所有 TODOs
curl http://localhost:3000/api/todos

# 创建新 TODO（匿名）
curl -X POST http://localhost:3000/api/todos \
  -H "Content-Type: application/json" \
  -d '{"title":"学习 TypeScript"}'

# 创建新 TODO（带用户信息）
curl -X POST http://localhost:3000/api/todos \
  -H "Content-Type: application/json" \
  -H "X-Username: Alice" \
  -d '{"title":"学习 Context"}'

# 获取当前用户信息
curl http://localhost:3000/api/me \
  -H "X-Username: Alice"

# 更新 TODO
curl -X PUT http://localhost:3000/api/todos/1 \
  -H "Content-Type: application/json" \
  -d '{"title":"精通 Farrow","completed":true}'

# 删除 TODO
curl -X DELETE http://localhost:3000/api/todos/1

# 测试错误处理（不存在的 TODO）
curl http://localhost:3000/api/todos/999999
```

## 核心概念预览

通过这个简单的例子，你已经接触到了 Farrow 的核心概念：

### 类型安全的路由

```typescript
// 路由参数自动解析和类型推导
app.get('/todos/<id:int>')  // id 是 number
app.get('/users/<name:string>')  // name 是 string
app.get('/posts/<published:boolean>')  // published 是 boolean
```

### Schema 驱动

```typescript
// 一次定义，获得编译时类型检查 + 运行时类型验证
class User extends ObjectType {
  name = String
  age = Number
}

// 自动验证请求体
app.post('/users', { body: User })
```

### 函数式中间件

```typescript
// 纯函数，必须返回响应，这下子看你还怎么忘记返回响应！
app.use((request, next) => {
  console.log(`${request.method} ${request.pathname}`)
  return next(request)  // 继续处理
})
```

### Context 系统

```typescript
// React Hooks 风格的状态管理
const UserContext = createContext<User | null>(null)

// 在中间件中设置
UserContext.set(currentUser)

// 在任何地方获取
const user = UserContext.get()
```

### 优雅的响应构建

```typescript
// 链式 API，清晰直观
Response
  .json(data)
  .status(201)
  .header('X-Custom', 'value')
  .cookie('session', 'abc123')
```

## 渐进式迁移

### 与现有项目集成

Farrow 支持渐进式采用，你可以在现有的 Express 或 Koa 项目中逐步引入 Farrow：

#### 在 Express 中使用 Farrow

```typescript
import express from 'express'
import { Http } from 'farrow-http'
import { adapter } from 'farrow-express'

// 现有的 Express 应用
const expressApp = express()
expressApp.get('/legacy', (req, res) => {
  res.json({ message: 'Express route' })
})

// 创建 Farrow 应用处理新功能
const farrowApp = Http()
farrowApp.get('/api/users/<id:int>').use((request) => {
  return Response.json({ id: request.params.id })
})

// 将 Farrow 挂载到 Express
expressApp.use('/new', adapter(farrowApp))

expressApp.listen(3000)
```

#### 在 Koa 中使用 Farrow

```typescript
import Koa from 'koa'
import { Http } from 'farrow-http'
import { adapter } from 'farrow-koa'

// 现有的 Koa 应用
const koaApp = new Koa()

// Farrow 应用处理新的 API
const farrowApp = Http()
farrowApp.post('/api/todos', { body: TodoSchema }).use((request) => {
  return Response.json(createTodo(request.body))
})

// 将 Farrow 作为 Koa 中间件
koaApp.use(adapter(farrowApp))

koaApp.listen(3000)
```

**渐进式迁移的好处：**
- 无需重写整个应用
- 新功能用 Farrow，享受类型安全
- 按自己的节奏逐步迁移
- 保持生产环境稳定

## 下一步

恭喜你完成了 Farrow 的快速入门！你已经学会了：

- 创建 Farrow 应用  
- 定义类型安全的路由  
- 使用 Schema 验证数据  
- 使用 Context 管理状态  
- 构建 RESTful API  
- 与现有框架集成  

### 继续学习

根据你的需求，选择下一步：

**[核心概念](/guide/core-concepts)**  
深入理解 Farrow 的设计理念和架构

**[基础教程](/guide/essentials)**  
学习日常开发所需的所有功能

**[实战项目](/examples/)**  
通过完整项目掌握最佳实践

**[API 参考](/api/)**  
查阅详细的 API 文档