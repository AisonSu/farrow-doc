# farrow-cors

为 farrow-http 提供跨域资源共享（CORS）支持。

## 概述

`farrow-cors` 是一个中间件包，为 Farrow HTTP 应用提供 CORS（Cross-Origin Resource Sharing）功能。它让你的 API 可以安全地被其他域名的前端应用访问。

## 特性

- 🌐 **灵活的 CORS 配置** - 支持所有标准 CORS 选项
- 🔒 **安全默认值** - 开箱即用的安全配置
- 🎯 **细粒度控制** - 可以为不同路由设置不同的 CORS 策略
- 🚀 **零配置** - 默认配置适用于大多数场景

## 安装

::: code-group

```bash [npm]
npm install farrow-cors
```

```bash [yarn]
yarn add farrow-cors
```

```bash [pnpm]
pnpm add farrow-cors
```

:::

## 快速开始

### 基础用法

为所有路由启用 CORS：

```typescript
import { Http, Response } from 'farrow-http'
import { cors } from 'farrow-cors'

const app = Http()

// 使用默认配置启用 CORS
app.use(cors())

app.get('/api/data').use(() => {
  return Response.json({ 
    message: 'This endpoint is CORS-enabled for all origins!' 
  })
})

app.listen(3000, () => {
  console.log('CORS-enabled server listening on port 3000')
})
```

### 自定义配置

配置特定的 CORS 选项：

```typescript
import { cors } from 'farrow-cors'

// 配置 CORS 选项
app.use(cors({
  origin: 'https://example.com',  // 允许特定域名
  credentials: true,               // 允许发送 Cookie
  methods: ['GET', 'POST'],       // 允许的 HTTP 方法
  allowedHeaders: ['Content-Type', 'Authorization']  // 允许的请求头
}))
```

## 配置选项

`farrow-cors` 支持与 [expressjs/cors](https://github.com/expressjs/cors) 相同的配置选项：

### origin

配置 Access-Control-Allow-Origin CORS 头。

```typescript
// 允许所有来源（默认）
cors({ origin: '*' })

// 允许单个域名
cors({ origin: 'https://example.com' })

// 允许多个域名
cors({ origin: ['https://example.com', 'https://app.example.com'] })

// 动态判断
cors({
  origin: (origin, callback) => {
    // 根据 origin 动态决定是否允许
    if (allowedOrigins.includes(origin)) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  }
})

// 使用正则表达式
cors({ origin: /example\.com$/ })
```

### credentials

配置 Access-Control-Allow-Credentials CORS 头。

```typescript
// 允许发送凭证（cookies, authorization headers）
cors({ credentials: true })
```

### methods

配置 Access-Control-Allow-Methods CORS 头。

```typescript
// 默认值
cors({ methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE'] })

// 自定义方法
cors({ methods: ['GET', 'POST'] })
```

### allowedHeaders

配置 Access-Control-Allow-Headers CORS 头。

```typescript
// 允许所有请求头（默认）
cors({ allowedHeaders: '*' })

// 允许特定请求头
cors({ allowedHeaders: ['Content-Type', 'Authorization'] })

// 多个请求头
cors({ 
  allowedHeaders: [
    'Content-Type',
    'Authorization', 
    'X-Requested-With',
    'X-Custom-Header'
  ]
})
```

### exposedHeaders

配置 Access-Control-Expose-Headers CORS 头。

```typescript
// 暴露自定义响应头给前端
cors({ 
  exposedHeaders: [
    'X-Total-Count',
    'X-Page-Number',
    'X-Page-Size'
  ]
})
```

### maxAge

配置 Access-Control-Max-Age CORS 头。

```typescript
// 预检请求缓存时间（秒）
cors({ maxAge: 86400 })  // 24 小时
```

### preflightContinue

是否将 CORS 预检响应传递给下一个处理器。

```typescript
// 继续处理预检请求
cors({ preflightContinue: true })
```

### optionsSuccessStatus

OPTIONS 请求的成功状态码。

```typescript
// 某些旧浏览器需要 200
cors({ optionsSuccessStatus: 200 })  // 默认是 204
```

## 完整示例

### 生产环境配置

```typescript
import { Http, Response } from 'farrow-http'
import { cors } from 'farrow-cors'
import { createContext } from 'farrow-pipeline'

const app = Http()

// 生产环境 CORS 配置
const corsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = [
      'https://app.example.com',
      'https://www.example.com',
      'https://admin.example.com'
    ]
    
    // 允许没有 origin 的请求（如 Postman、服务器端请求）
    if (!origin) return callback(null, true)
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'X-API-Key'
  ],
  exposedHeaders: [
    'X-Total-Count',
    'X-Page-Number',
    'X-Rate-Limit-Remaining'
  ],
  maxAge: 86400  // 24小时
}

app.use(cors(corsOptions))

// API 路由
app.get('/api/users').use(() => {
  return Response
    .json([
      { id: 1, name: 'Alice' },
      { id: 2, name: 'Bob' }
    ])
    .header('X-Total-Count', '2')
})

app.post('/api/login', {
  body: {
    email: String,
    password: String
  }
}).use((request) => {
  // 处理登录
  const token = generateToken(request.body)
  
  return Response
    .json({ token })
    .cookie('session', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'none'  // 跨域 Cookie 需要设置
    })
})

app.listen(3000)
```

### 开发环境配置

```typescript
import { cors } from 'farrow-cors'

// 开发环境：允许所有来源
if (process.env.NODE_ENV === 'development') {
  app.use(cors({
    origin: true,  // 允许所有来源
    credentials: true
  }))
} else {
  // 生产环境：严格控制
  app.use(cors({
    origin: 'https://app.example.com',
    credentials: true
  }))
}
```

### 为特定路由配置 CORS

```typescript
import { Router } from 'farrow-http'
import { cors } from 'farrow-cors'

const app = Http()

// 公开 API：允许所有来源
const publicRouter = Router()
publicRouter.use(cors())
publicRouter.get('/data').use(() => {
  return Response.json({ public: true })
})

// 私有 API：限制来源
const privateRouter = Router()
privateRouter.use(cors({
  origin: 'https://app.example.com',
  credentials: true
}))
privateRouter.get('/user').use(() => {
  return Response.json({ private: true })
})

// 挂载路由
app.route('/api/public').use(publicRouter)
app.route('/api/private').use(privateRouter)
```

### 处理预检请求

```typescript
import { cors } from 'farrow-cors'

const app = Http()

// 配置 CORS，允许自定义处理预检请求
app.use(cors({
  origin: 'https://example.com',
  preflightContinue: true  // 继续处理 OPTIONS 请求
}))

// 自定义 OPTIONS 处理
app.options('/api/upload').use(() => {
  // 可以添加额外的逻辑
  console.log('Preflight request for upload')
  
  return Response
    .empty()
    .header('X-Custom-Header', 'value')
})
```

## 常见问题

### 1. 为什么浏览器仍然报 CORS 错误？

检查以下几点：

```typescript
// ✅ 确保 CORS 中间件在所有路由之前
app.use(cors())  // 必须在路由定义之前
app.get('/api/data').use(handler)

// ❌ 错误：CORS 中间件在路由之后
app.get('/api/data').use(handler)
app.use(cors())  // 太晚了
```

### 2. Cookie 无法跨域发送？

需要正确配置 credentials 和 Cookie 选项：

```typescript
// 服务器端
app.use(cors({
  origin: 'https://frontend.com',
  credentials: true  // 必须设置
}))

app.post('/login').use(() => {
  return Response
    .json({ success: true })
    .cookie('session', 'token', {
      httpOnly: true,
      secure: true,      // HTTPS 环境必须
      sameSite: 'none'   // 跨域必须设置
    })
})

// 客户端
fetch('https://api.com/login', {
  method: 'POST',
  credentials: 'include',  // 必须设置
  body: JSON.stringify(data)
})
```

### 3. 预检请求失败？

确保允许 OPTIONS 方法：

```typescript
app.use(cors({
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],  // 包含 OPTIONS
  allowedHeaders: ['Content-Type', 'Authorization']
}))
```

### 4. 自定义请求头被拒绝？

添加到 allowedHeaders：

```typescript
app.use(cors({
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Custom-Header',  // 添加自定义请求头
    'X-API-Key'
  ]
}))
```

## 安全建议

### 1. 避免使用通配符

```typescript
// ❌ 不安全：允许所有来源
app.use(cors({ origin: '*' }))

// ✅ 安全：指定具体来源
app.use(cors({ 
  origin: ['https://app.example.com', 'https://www.example.com']
}))
```

### 2. 验证动态来源

```typescript
// ✅ 验证来源
app.use(cors({
  origin: (origin, callback) => {
    // 验证 origin 格式
    if (!origin || !isValidOrigin(origin)) {
      callback(new Error('Invalid origin'))
      return
    }
    
    // 检查白名单
    if (whitelist.includes(origin)) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed'))
    }
  }
}))
```

### 3. 限制方法和头部

```typescript
// ✅ 只允许必要的方法和头部
app.use(cors({
  methods: ['GET', 'POST'],  // 只允许需要的方法
  allowedHeaders: ['Content-Type'],  // 只允许需要的头部
  exposedHeaders: []  // 只暴露必要的响应头
}))
```

### 4. 合理设置缓存时间

```typescript
// ✅ 平衡性能和安全
app.use(cors({
  maxAge: 3600  // 1小时，不要设置过长
}))
```

## 与其他中间件配合

### 与认证中间件

```typescript
import { cors } from 'farrow-cors'

// 1. CORS 必须在认证之前
app.use(cors({ 
  origin: 'https://app.example.com',
  credentials: true 
}))

// 2. 认证中间件
app.use(authenticate)

// 3. 业务路由
app.get('/api/protected').use(requireAuth)
```

### 与速率限制

```typescript
import { cors } from 'farrow-cors'
import { rateLimit } from 'farrow-rate-limit'

// 顺序很重要
app.use(cors())         // 1. CORS
app.use(rateLimit())    // 2. 速率限制
app.use(authenticate)   // 3. 认证
```

## 调试技巧

### 查看 CORS 响应头

```typescript
app.use((request, next) => {
  const response = next(request)
  
  // 打印 CORS 相关响应头
  console.log('CORS Headers:', {
    'Access-Control-Allow-Origin': response.headers['access-control-allow-origin'],
    'Access-Control-Allow-Credentials': response.headers['access-control-allow-credentials'],
    'Access-Control-Allow-Methods': response.headers['access-control-allow-methods']
  })
  
  return response
})
```

### 测试 CORS 配置

```bash
# 测试预检请求
curl -X OPTIONS http://localhost:3000/api/data \
  -H "Origin: https://example.com" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type" \
  -v

# 测试实际请求
curl http://localhost:3000/api/data \
  -H "Origin: https://example.com" \
  -v
```

## 相关链接

- [MDN CORS 文档](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/CORS)
- [expressjs/cors](https://github.com/expressjs/cors) - 配置选项参考
- [farrow-http 文档](/ecosystem/farrow-http)
- [GitHub](https://github.com/farrowjs/farrow)