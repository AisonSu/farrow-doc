# 实战示例

> 通过完整的项目示例，掌握 Farrow 的最佳实践

## 示例项目

### 基础示例

<div class="example-grid">

#### [Hello World](/examples/hello-world)
最简单的 Farrow 应用，5 分钟快速上手。

#### [TODO API](/examples/todo-api)
经典的 TODO 应用，学习 CRUD 操作和状态管理。

#### [用户认证](/examples/authentication)
JWT 认证系统，包含登录、注册和权限控制。

#### [文件上传](/examples/file-upload)
处理文件上传，包含进度跟踪和类型验证。

</div>

### 进阶示例

<div class="example-grid">

#### [博客系统](/examples/blog-system)
完整的博客 API，包含文章、评论、标签等功能。

#### [电商 API](/examples/e-commerce)
模拟电商系统，包含商品、订单、支付等模块。

#### [实时聊天](/examples/real-time-chat)
WebSocket 实时通信，构建聊天应用。

#### [微服务架构](/examples/microservices)
使用 Farrow 构建微服务，包含服务发现和通信。

</div>

### 专题示例

<div class="example-grid">

#### [数据库集成](/examples/database-integration)
与 TypeORM、Prisma 等 ORM 的集成示例。

#### [GraphQL API](/examples/graphql-api)
使用 farrow-graphql 构建 GraphQL 服务。

#### [测试策略](/examples/testing-strategies)
单元测试、集成测试和 E2E 测试示例。

#### [部署方案](/examples/deployment)
Docker、Kubernetes、Serverless 部署示例。

</div>

## 快速开始

### 1. 克隆示例仓库

```bash
git clone https://github.com/farrowjs/examples.git
cd examples
```

### 2. 选择一个项目

```bash
cd hello-world  # 或其他项目
npm install
```

### 3. 运行项目

```bash
npm run dev
```

## 学习路径

### 初学者路径

1. **Hello World** - 了解基本结构
2. **TODO API** - 学习 CRUD 和路由
3. **用户认证** - 掌握中间件和 Context
4. **博客系统** - 综合应用

### 进阶路径

1. **数据库集成** - 学习数据持久化
2. **GraphQL API** - 探索不同的 API 风格
3. **微服务架构** - 构建分布式系统
4. **部署方案** - 生产环境实践

### 专家路径

1. **性能优化** - 学习缓存、并发处理
2. **安全实践** - 防护常见攻击
3. **监控告警** - 构建可观测系统
4. **CI/CD 流程** - 自动化部署

## 项目结构最佳实践

### 推荐的目录结构

```
my-farrow-app/
├── src/
│   ├── api/           # API 路由
│   │   ├── users/
│   │   ├── posts/
│   │   └── index.ts
│   ├── services/      # 业务逻辑
│   │   ├── auth.ts
│   │   └── database.ts
│   ├── schemas/       # Schema 定义
│   │   ├── user.ts
│   │   └── post.ts
│   ├── middlewares/   # 中间件
│   │   ├── auth.ts
│   │   └── logger.ts
│   ├── contexts/      # Context 定义
│   │   └── user.ts
│   ├── utils/         # 工具函数
│   └── index.ts       # 入口文件
├── tests/             # 测试文件
├── docs/              # 文档
└── package.json
```

### 模块化组织

```typescript
// src/api/users/index.ts
import { Router } from 'farrow-http'
import { UserService } from '../../services/user'
import { authenticate } from '../../middlewares/auth'

export const userRouter = Router()

userRouter.get('/users').use(getUserList)
userRouter.get('/users/<id:int>').use(getUserById)
userRouter.post('/users', { body: CreateUserSchema }).use(createUser)
userRouter.use('/users/*', authenticate)  // 需要认证的路由

// src/index.ts
import { Http } from 'farrow-http'
import { userRouter } from './api/users'
import { postRouter } from './api/posts'

const app = Http()

app.use('/api', userRouter)
app.use('/api', postRouter)

app.listen(3000)
```

## 代码片段

### 认证中间件

```typescript
export const authenticate = (request, next) => {
  const token = request.headers?.authorization?.replace('Bearer ', '')
  
  if (!token) {
    return Response.status(401).json({ error: 'Token required' })
  }
  
  try {
    const user = verifyToken(token)
    UserContext.set(user)
    return next(request)
  } catch {
    return Response.status(401).json({ error: 'Invalid token' })
  }
}
```

### 错误处理

```typescript
export const errorHandler = (request, next) => {
  try {
    return next(request)
  } catch (error) {
    if (error instanceof ValidationError) {
      return Response.status(400).json({
        error: 'Validation failed',
        details: error.details
      })
    }
    
    if (error instanceof HttpError) {
      return Response.status(error.status).json({
        error: error.message
      })
    }
    
    console.error(error)
    return Response.status(500).json({
      error: 'Internal server error'
    })
  }
}
```

### 分页处理

```typescript
class PaginationQuery extends ObjectType {
  page = Number
  limit = Number
}

app.get('/api/posts', { query: PaginationQuery }).use((request) => {
  const { page = 1, limit = 10 } = request.query
  
  const posts = await getPosts({
    offset: (page - 1) * limit,
    limit
  })
  
  return Response.json({
    data: posts,
    pagination: {
      page,
      limit,
      total: await getPostCount()
    }
  })
})
```

## 常见模式

### 1. 请求验证

```typescript
class CreatePostRequest extends ObjectType {
  title = String
  content = String
  tags = List(String)
}

app.post('/posts', { 
  body: CreatePostRequest 
}).use((request) => {
  // request.body 已验证和类型安全
  const post = await createPost(request.body)
  return Response.status(201).json(post)
})
```

### 2. 权限控制

```typescript
const requireRole = (role: string) => (request, next) => {
  const user = UserContext.get()
  
  if (!user || user.role !== role) {
    return Response.status(403).json({ 
      error: 'Insufficient permissions' 
    })
  }
  
  return next(request)
}

app.delete('/posts/<id:int>')
  .use(authenticate)
  .use(requireRole('admin'))
  .use(deletePost)
```

### 3. 缓存策略

```typescript
const cache = new Map()

const withCache = (key: string, ttl: number) => (request, next) => {
  const cached = cache.get(key)
  
  if (cached && cached.expires > Date.now()) {
    return Response.json(cached.data)
  }
  
  const response = next(request)
  
  if (response.status === 200) {
    cache.set(key, {
      data: response.body,
      expires: Date.now() + ttl
    })
  }
  
  return response
}

app.get('/api/trending')
  .use(withCache('trending', 60000))  // 缓存 1 分钟
  .use(getTrendingPosts)
```

## 测试示例

### 单元测试

```typescript
import { test, expect } from 'vitest'
import { Http } from 'farrow-http'
import { userRouter } from '../src/api/users'

test('GET /users returns user list', async () => {
  const app = Http()
  app.use(userRouter)
  
  const response = await app.handle({
    method: 'GET',
    pathname: '/users'
  })
  
  expect(response.status).toBe(200)
  expect(response.body).toBeInstanceOf(Array)
})
```

### 集成测试

```typescript
import { test, beforeAll, afterAll } from 'vitest'
import { createTestClient } from './utils'

let client

beforeAll(async () => {
  client = await createTestClient()
})

afterAll(async () => {
  await client.close()
})

test('User registration flow', async () => {
  // 注册
  const registerRes = await client.post('/register', {
    email: 'test@example.com',
    password: 'password123'
  })
  expect(registerRes.status).toBe(201)
  
  // 登录
  const loginRes = await client.post('/login', {
    email: 'test@example.com',
    password: 'password123'
  })
  expect(loginRes.status).toBe(200)
  expect(loginRes.body).toHaveProperty('token')
  
  // 访问受保护资源
  const profileRes = await client.get('/profile', {
    headers: {
      Authorization: `Bearer ${loginRes.body.token}`
    }
  })
  expect(profileRes.status).toBe(200)
})
```

## 部署示例

### Docker

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000
CMD ["node", "dist/index.js"]
```

### PM2

```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'farrow-app',
    script: './dist/index.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
}
```

## 获取帮助

### 相关文档

- [API 参考](/api/) - 完整的 API 文档
- [核心概念](/guide/core-concepts) - 理解框架设计
- [最佳实践](/guide/best-practices) - 生产环境建议

### 报告问题

发现 bug 或有改进建议？欢迎到 [GitHub](https://github.com/farrow-js/farrow) 提交 Issue！

<style>
.example-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin: 2rem 0;
}

.example-grid h4 {
  margin: 0 0 0.5rem 0;
}

.example-grid > div {
  padding: 1rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  transition: all 0.3s;
}

.example-grid > div:hover {
  border-color: var(--vp-c-brand);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}
</style>