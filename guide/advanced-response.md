# Response 构建与处理

> 掌握 Farrow Response 系统的核心功能 🎨

## Response 基础

### 核心概念

Farrow Response 系统的特点：
- **不可变性** - 每次操作返回新的 Response 实例
- **链式调用** - 支持流畅的 API 调用
- **类型安全** - 完整的 TypeScript 类型支持

```typescript
import { Response } from 'farrow-http'

// 基础用法
const response = Response.json({ message: 'Hello' })
  .status(201)
  .header('X-Custom', 'value')
```

## 基础响应类型

### JSON 响应

```typescript
// 基础 JSON
app.get('/users').use(() => {
  return Response.json({ users: [], total: 0 })
})

// 带状态码
app.post('/users').use(() => {
  return Response.json({ created: true }).status(201)
})

// 错误响应
app.get('/error').use(() => {
  return Response.json({ error: 'Not found' }).status(404)
})
```

### 文本响应

```typescript
// 纯文本
app.get('/hello').use(() => {
  return Response.text('Hello World')
})

// HTML 响应
app.get('/page').use(() => {
  return Response.html('<h1>Welcome</h1>')
})
```

### 文件响应

```typescript
// 文件下载
app.get('/download').use(() => {
  return Response.file('./file.pdf')
})

// 自定义文件名
app.get('/report').use(() => {
  return Response.file('./data.csv', 'report-2024.csv')
})
```

### Buffer 响应

```typescript
app.get('/binary').use(() => {
  const buffer = Buffer.from('binary data')
  return Response.buffer(buffer)
    .header('Content-Type', 'application/octet-stream')
})
```

## 状态码设置

### 常用状态码

```typescript
// 成功响应
Response.json({ data: 'ok' }).status(200)  // 默认
Response.json({ created: true }).status(201)
Response.empty().status(204)  // 无内容

// 重定向
Response.redirect('/new-url')  // 302
Response.redirect('/new-url', 301)  // 永久重定向

// 客户端错误
Response.json({ error: 'Bad request' }).status(400)
Response.json({ error: 'Unauthorized' }).status(401)
Response.json({ error: 'Not found' }).status(404)

// 服务器错误
Response.json({ error: 'Server error' }).status(500)
```

### 自定义状态消息

```typescript
app.get('/custom').use(() => {
  return Response.json({ message: 'Custom status' })
    .status(418, 'I am a teapot')
})
```

## 响应头设置

### 单个头部

```typescript
app.get('/api/data').use(() => {
  return Response.json({ data: [] })
    .header('Cache-Control', 'no-cache')
    .header('X-API-Version', 'v1')
})
```

### 多个头部

```typescript
app.get('/api/info').use(() => {
  return Response.json({ info: 'example' })
    .headers({
      'Cache-Control': 'max-age=3600',
      'X-Custom-Header': 'value',
      'Access-Control-Allow-Origin': '*'
    })
})
```

### 常用头部示例

```typescript
// CORS 头部
Response.json(data)
  .header('Access-Control-Allow-Origin', '*')
  .header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE')

// 缓存控制
Response.json(data)
  .header('Cache-Control', 'public, max-age=3600')
  .header('ETag', '"123456"')

// 安全头部
Response.json(data)
  .header('X-Content-Type-Options', 'nosniff')
  .header('X-Frame-Options', 'DENY')
```

## Cookie 操作

### 设置 Cookie

```typescript
// 基础 Cookie
app.post('/login').use(() => {
  return Response.json({ success: true })
    .cookie('session', 'abc123')
})

// 带选项的 Cookie
app.post('/auth').use(() => {
  return Response.json({ authenticated: true })
    .cookie('token', 'jwt-token', {
      httpOnly: true,
      secure: true,
      maxAge: 86400000, // 24小时
      sameSite: 'strict'
    })
})

// 删除 Cookie
app.post('/logout').use(() => {
  return Response.json({ success: true })
    .cookie('session', '', { maxAge: 0 })
})
```

## 特殊响应类型

### 空响应

```typescript
// 204 No Content
app.delete('/users/<id:int>').use(() => {
  // 删除用户逻辑
  return Response.empty().status(204)
})

// HEAD 请求响应
app.head('/users/<id:int>').use(() => {
  return Response.empty()
    .header('Content-Length', '1024')
    .header('Last-Modified', new Date().toUTCString())
})
```

### 重定向响应

```typescript
// 临时重定向 (302)
app.get('/old-page').use(() => {
  return Response.redirect('/new-page')
})

// 永久重定向 (301)
app.get('/deprecated').use(() => {
  return Response.redirect('/current', 301)
})

// 带参数重定向
app.post('/submit').use((request) => {
  const { id } = request.body
  return Response.redirect(`/success?id=${id}`)
})
```

## 响应合并

### 合并规则

```typescript
// 后面的响应会覆盖前面的主体
const response1 = Response.json({ data: 'first' })
const response2 = Response.json({ data: 'second' })
const merged = response1.merge(response2)
// 结果: { data: 'second' }

// 头部会合并
const withHeaders = Response.json({ data: 'test' })
  .header('X-First', 'value1')
  .merge(Response.empty().header('X-Second', 'value2'))
// 结果包含两个头部
```

### 实际应用

```typescript
// 中间件中添加通用头部
app.use((request, next) => {
  const response = next(request)
  return response.header('X-API-Version', '1.0')
})

// 业务逻辑返回具体数据
app.get('/data').use(() => {
  return Response.json({ data: 'example' })
  // 最终响应会包含 X-API-Version 头部
})
```

## 实践示例

### API 错误处理

```typescript
class ApiError extends Error {
  constructor(public code: number, message: string) {
    super(message)
  }
}

app.use((request, next) => {
  try {
    return next(request)
  } catch (error) {
    if (error instanceof ApiError) {
      return Response.json({
        error: error.message,
        code: error.code
      }).status(error.code)
    }
    
    return Response.json({
      error: 'Internal server error'
    }).status(500)
  }
})
```

### 文件服务

```typescript
app.get('/files/<filename:string>').use((request) => {
  const { filename } = request.params
  const filePath = `./uploads/${filename}`
  
  // 检查文件存在
  if (!fs.existsSync(filePath)) {
    return Response.json({ error: 'File not found' }).status(404)
  }
  
  // 返回文件
  return Response.file(filePath)
    .header('Content-Disposition', `attachment; filename="${filename}"`)
})
```

### 内容协商

```typescript
app.get('/data').use((request) => {
  const accept = request.headers.accept
  const data = { message: 'Hello', timestamp: Date.now() }
  
  if (accept?.includes('application/xml')) {
    const xml = `<data><message>${data.message}</message></data>`
    return Response.text(xml)
      .header('Content-Type', 'application/xml')
  }
  
  // 默认返回 JSON
  return Response.json(data)
})
```

## 总结

Farrow Response 系统的核心特性：

- **多种响应类型** - JSON、文本、文件、Buffer 等
- **链式 API** - 流畅的响应构建方式
- **不可变设计** - 安全的并发处理
- **完整的 HTTP 语义** - 状态码、头部、Cookie 支持

通过合理运用这些特性，你可以构建出功能完善的 HTTP 响应处理系统。