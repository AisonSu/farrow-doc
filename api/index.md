# API 参考

Farrow 提供了一套完整的 API 来构建类型安全的 Web 应用。本文档提供了所有核心模块的详细 API 参考。

## 核心模块

### [farrow-http](/api/farrow-http)
**HTTP 服务器和路由系统** - 构建类型安全的 Web 应用

- HTTP 应用和 HTTPS 支持
- 强大的路由系统和 URL Schema 语法
- Response 构建器和自定义响应
- 中间件系统和错误处理
- Context Hooks 和请求处理

### [farrow-schema](/api/farrow-schema)
**Schema 定义和验证系统** - 运行时类型验证和推导

- 丰富的基础类型（String、Int、Boolean、Date 等）
- 复合类型（ObjectType、List、Union、Tuple 等）
- 类型修饰符（Optional、Nullable、Strict 等）
- Schema 操作工具（pickStruct、omitStruct 等）
- 完整的验证系统和自定义验证器
- TypeScript 类型推导支持

### [farrow-pipeline](/api/farrow-pipeline)
**Pipeline 和 Context 系统** - 类型安全的中间件管道

- 同步和异步 Pipeline 创建
- 灵活的 Context 管理系统
- Pipeline 组合和中间件执行
- 工具函数和类型检查
- 高级模式和最佳实践

## 快速导航

### HTTP 服务

#### 核心 API
- [`Http()`](/api/farrow-http#http-options) - 创建 HTTP 应用实例
- [`Https()`](/api/farrow-http#https-options) - 创建 HTTPS 应用实例
- [`Router()`](/api/farrow-http#router-创建路由器) - 创建模块化路由器

#### 响应处理
- [`Response.json()`](/api/farrow-http#response-json-json-响应) - JSON 响应
- [`Response.text()`](/api/farrow-http#response-text-纯文本响应) - 文本响应
- [`Response.file()`](/api/farrow-http#response-file-文件响应) - 文件响应
- [`Response.redirect()`](/api/farrow-http#response-redirect-重定向响应) - 重定向响应

#### 路由匹配
- [HTTP 方法快捷方式](/api/farrow-http#http-方法快捷方式) - `get()`, `post()`, `put()` 等
- [URL Schema 语法](/api/farrow-http#url-schema-语法) - 路径参数和查询参数
- [`match()`](/api/farrow-http#match-详细路由匹配) - 详细路由匹配

### Schema 验证

#### 基础类型
- [`String`](/api/farrow-schema#string-字符串类型) - 字符串验证
- [`Int`](/api/farrow-schema#int-整数类型) / [`Number`](/api/farrow-schema#number-数字类型（整数和浮点数）) - 数字验证
- [`Boolean`](/api/farrow-schema#boolean-布尔类型) - 布尔值验证
- [`Date`](/api/farrow-schema#date-日期类型) - 日期验证
- [`Literal`](/api/farrow-schema#literal-精确值匹配) - 字面量类型

#### 复合类型
- [`ObjectType`](/api/farrow-schema#objecttype-对象类型) - 对象类型定义
- [`List`](/api/farrow-schema#list-数组类型) - 数组类型验证
- [`Union`](/api/farrow-schema#union-联合类型) - 联合类型
- [`Struct`](/api/farrow-schema#struct-结构体类型) - 结构体定义

#### 工具函数
- [`pickStruct()`](/api/farrow-schema#pickstruct-选择字段) - 选择字段
- [`omitStruct()`](/api/farrow-schema#omitstruct-排除字段) - 排除字段
- [`partialStruct()`](/api/farrow-schema#partialstruct-可选化所有字段) - 部分更新
- [`TypeOf<T>`](/api/farrow-schema#typeof-获取-typescript-类型) - 类型推导

### Pipeline 系统

#### Pipeline 创建
- [`createPipeline()`](/api/farrow-pipeline#createpipeline) - 创建同步管道
- [`createAsyncPipeline()`](/api/farrow-pipeline#createasyncpipeline) - 创建异步管道
- [`usePipeline()`](/api/farrow-pipeline#usepipeline) - 使用 Pipeline

#### Context 管理
- [`createContext()`](/api/farrow-pipeline#createcontext) - 创建上下文
- [`createContainer()`](/api/farrow-pipeline#createcontainer) - 创建容器
- [`useContainer()`](/api/farrow-pipeline#usecontainer) - 获取容器

## API 规范

### 命名约定

- **类型**: PascalCase (如 `ObjectType`, `HttpError`)
- **函数**: camelCase (如 `createContext`, `pickStruct`)
- **常量**: UPPER_CASE (如 `DEFAULT_PORT`)
- **文件**: kebab-case (如 `farrow-http`)

### 类型标注

所有 API 都包含完整的 TypeScript 类型定义：

```typescript
// 函数签名
function createContext<T>(defaultValue: T): Context<T>

// 类型定义
type RequestInfo = {
  readonly pathname: string
  readonly method?: string
  readonly query?: RequestQuery
  readonly body?: any
  readonly headers?: RequestHeaders
  readonly cookies?: RequestCookies
}
```

### 示例代码

每个 API 都提供了实际使用示例：

```typescript
// 创建应用
const app = Http()

// 定义 Schema
class User extends ObjectType {
  id = Int
  name = String
  email = String
}

// 类型安全的路由
app.post('/users', {
  body: User
}).use((request) => {
  // request.body 已验证且类型安全
  return Response.status(201).json(createUser(request.body))
})
```

## 常见用法模式

### 基础 Web 应用

```typescript
import { Http, Response } from 'farrow-http'
import { ObjectType, String, Int } from 'farrow-schema'

// 定义数据模型
class User extends ObjectType {
  id = Int
  name = String
  email = String
}

// 创建应用
const app = Http()

// API 路由
app.get('/users').use(() => Response.json(users))
app.post('/users', { body: User }).use((req) => {
  const user = createUser(req.body)
  return Response.status(201).json(user)
})

app.listen(3000)
```

### Pipeline 中间件

```typescript
import { createAsyncPipeline, createContext } from 'farrow-pipeline'

// 创建上下文
const UserContext = createContext<User | null>(null)

// 创建管道
const pipeline = createAsyncPipeline<Request, Response>()

// 认证中间件
pipeline.use(async (req, next) => {
  const user = await authenticate(req)
  UserContext.set(user)
  return next(req)
})

// 业务处理
pipeline.use(async (req) => {
  const user = UserContext.get()
  return { success: true, user }
})
```

### Schema 验证

```typescript
import { 
  ObjectType, String, Int, List, Union, 
  Optional, pickStruct, omitStruct 
} from 'farrow-schema'

// 完整用户模型
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

// 类型推导
type UserType = TypeOf<typeof User>
type CreateUserType = TypeOf<typeof CreateUser>
```

## 版本兼容性

| Farrow 版本 | Node.js | TypeScript | 状态 |
|------------|---------|------------|------|
| 2.x        | >= 16.0 | >= 4.5     | 推荐 |
| 1.x        | >= 14.0 | >= 4.1     | 维护中 |

## 学习路径

### 1. 入门阶段
1. 阅读[快速开始](/guide/getting-started)
2. 学习 [farrow-http](/api/farrow-http) 基础用法
3. 了解 [farrow-schema](/api/farrow-schema) 数据验证

### 2. 进阶阶段
1. 掌握 [farrow-pipeline](/api/farrow-pipeline) 管道系统
2. 学习中间件开发和错误处理
3. 理解 Context 系统和依赖注入

### 3. 高级阶段
1. 自定义 Schema 验证器
2. 复杂 Pipeline 组合
3. 性能优化和最佳实践

## 获取帮助

遇到问题？我们为您提供多种支持渠道：

- **文档** - 查看[完整指南](/guide/)了解概念和最佳实践
- **社区** - 在 [Discord](https://discord.gg/farrow) 上与开发者交流
- **问题反馈** - 在 [GitHub Issues](https://github.com/farrowjs/farrow/issues) 报告 bug
- **功能建议** - 在 [GitHub Discussions](https://github.com/farrowjs/farrow/discussions) 提出想法
- **示例代码** - 查看 [farrow-examples](https://github.com/farrowjs/farrow-examples) 仓库

---

**准备好开始了吗？** 选择一个模块深入学习，构建您的下一个类型安全的 Web 应用！