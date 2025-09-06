# farrow-http

HTTP 服务器和路由系统的核心包。

## 概述

`farrow-http` 是 Farrow 框架的 HTTP 层实现，提供：

- 🎯 类型安全的路由系统
- 🔗 函数式中间件
- 📝 自动参数解析和验证
- 🎨 优雅的响应构建 API

## 特性

### 类型安全的路由

利用 TypeScript 的 Template Literal Types，实现编译时类型推导：

```typescript
app.get('/users/<id:int>/posts/<postId:string>').use((request) => {
  // request.params.id: number
  // request.params.postId: string
})
```

### 自动验证

结合 farrow-schema，自动验证请求数据：

```typescript
app.post('/users', { body: UserSchema }).use((request) => {
  // request.body 已验证且类型安全
})
```

### 纯函数中间件

中间件是纯函数，必须返回响应：

```typescript
app.use((request, next) => {
  // 前置处理
  const response = next(request)
  // 后置处理
  return response
})
```

## 安装

```bash
npm install farrow-http
```

## 快速开始

```typescript
import { Http, Response } from 'farrow-http'

const app = Http()

app.get('/').use(() => {
  return Response.json({ message: 'Hello, Farrow!' })
})

app.listen(3000)
```

## 核心概念

### 路由系统

支持多种参数类型和模式：

- 基础类型：`int`, `float`, `string`, `boolean`, `id`
- 可选参数：`<name?:type>`
- 数组参数：`<name+:type>`, `<name*:type>`
- 查询参数：`?<query:type>`

### 中间件模型

采用洋葱模型，支持前置和后置处理：

```typescript
app.use((request, next) => {
  console.log('1. 前置')
  const response = next(request)
  console.log('2. 后置')
  return response
})
```

### 响应构建

链式 API 构建响应：

```typescript
Response
  .json(data)
  .status(201)
  .header('Location', '/resource/123')
  .cookie('session', 'abc123')
```

## 与其他模块的集成

### 与 farrow-schema

```typescript
import { ObjectType, String } from 'farrow-schema'

class User extends ObjectType {
  name = String
  email = String
}

app.post('/users', { body: User })
```

### 与 farrow-pipeline

```typescript
import { createContext } from 'farrow-pipeline'

const UserContext = createContext<User>()

app.use((request, next) => {
  UserContext.set(currentUser)
  return next(request)
})
```

## API 参考

详细 API 文档请查看 [farrow-http API](/api/farrow-http)

## 相关链接

- [GitHub](https://github.com/farrowjs/farrow)
- [基础教程](/guide/essentials)
- [基础教程](/guide/essentials)