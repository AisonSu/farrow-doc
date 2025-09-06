# 路由参数进阶

> 掌握 Farrow 路由系统的高级参数处理 🛣️

当你的应用变得复杂时，简单的路由参数可能无法满足需求。本章将深入探讨 Farrow 路由参数的高级功能，让你能够处理更复杂的 URL 模式和参数验证。

## 复杂路径参数模式

### 参数修饰符详解

Farrow 提供了丰富的参数修饰符来处理不同的 URL 模式：

```typescript
import { Http, Response } from 'farrow-http'

const app = Http()

// 基础参数
app.get('/users/<id:int>').use((req) => {
  // req.params.id 类型: number
  return Response.json({ userId: req.params.id })
})

// 可选参数
app.get('/posts/<id:int>/comments/<commentId?:int>').use((req) => {
  const { id, commentId } = req.params
  // id: number, commentId: number | undefined
  
  if (commentId) {
    return Response.json({ postId: id, commentId })
  } else {
    return Response.json({ postId: id, allComments: true })
  }
})

// 一个或多个 (+)
app.get('/categories/<path+:string>').use((req) => {
  // req.params.path 类型: string[]
  // /categories/tech/frontend/react -> path: ["tech", "frontend", "react"]
  return Response.json({ 
    categoryPath: req.params.path,
    depth: req.params.path.length 
  })
})

// 零个或多个 (*)
app.get('/files/<segments*:string>').use((req) => {
  // req.params.segments 类型: string[] | undefined
  // /files/ -> segments: undefined
  // /files/docs -> segments: ["docs"]  
  // /files/docs/images/photo.jpg -> segments: ["docs", "images", "photo.jpg"]
  
  const segments = req.params.segments || []
  return Response.json({ 
    filePath: segments.join('/'),
    isRoot: segments.length === 0
  })
})
```

### 联合类型参数

创建具有多种可能值的参数：

```typescript
// 字符串联合类型
app.get('/posts/<status:draft|published|archived>').use((req) => {
  // req.params.status 类型: "draft" | "published" | "archived"
  const { status } = req.params
  
  return Response.json({
    status,
    isPending: status === 'draft',
    isLive: status === 'published'
  })
})

// 混合类型联合
app.get('/content/<type:post|page|product>/<id:int>').use((req) => {
  const { type, id } = req.params
  // type: "post" | "page" | "product"
  // id: number
  
  return Response.json({ 
    contentType: type,
    contentId: id,
    endpoint: `/${type}s/${id}` // 动态构建端点
  })
})
```

### 精确匹配参数

使用大括号定义精确的字符串匹配：

```typescript
// API 版本控制
app.get('/api/<version:{v1}|{v2}|{v3}>/users').use((req) => {
  const { version } = req.params
  // version 类型: "v1" | "v2" | "v3"
  
  switch (version) {
    case 'v1':
      return Response.json({ users: getUsersV1() })
    case 'v2':
      return Response.json({ users: getUsersV2(), version: 2 })
    case 'v3':
      return Response.json({ users: getUsersV3(), meta: { version: 3 } })
  }
})

// 语言路由
app.get('/<lang:{zh}|{en}|{ja}>/about').use((req) => {
  const { lang } = req.params
  
  const content = {
    zh: { title: '关于我们', content: '中文内容' },
    en: { title: 'About Us', content: 'English content' },
    ja: { title: '私たちについて', content: '日本語コンテンツ' }
  }
  
  return Response.json(content[lang])
})
```

## 高级查询参数处理

### 复杂查询参数组合

```typescript
// 搜索和过滤
app.get('/products?<q:string>&<category?:string>&<minPrice?:float>&<maxPrice?:float>&<sort?:price|name|date>&<order?:asc|desc>&<page?:int>&<limit?:int>').use((req) => {
  const { 
    q,                    // string (必需)
    category,             // string | undefined
    minPrice,             // number | undefined
    maxPrice,             // number | undefined
    sort = 'name',        // "price" | "name" | "date" (默认 name)
    order = 'asc',        // "asc" | "desc" (默认 asc)  
    page = 1,             // number (默认 1)
    limit = 20            // number (默认 20)
  } = req.query
  
  // 构建查询条件
  const filters = {
    search: q,
    category,
    priceRange: minPrice && maxPrice ? { min: minPrice, max: maxPrice } : undefined,
    sorting: { field: sort, direction: order },
    pagination: { page, limit, offset: (page - 1) * limit }
  }
  
  return Response.json({
    products: searchProducts(filters),
    filters: Object.fromEntries(
      Object.entries(filters).filter(([_, value]) => value !== undefined)
    )
  })
})
```

### 数组查询参数

```typescript
// 多选标签
app.get('/articles?<tags*:string>&<authors*:string>&<published?:boolean>').use((req) => {
  const { tags, authors, published } = req.query
  // tags: string[] | undefined
  // authors: string[] | undefined  
  // published: boolean | undefined
  
  // URL: /articles?tags=tech&tags=frontend&authors=alice&authors=bob
  // 结果: { tags: ["tech", "frontend"], authors: ["alice", "bob"] }
  
  return Response.json({
    articles: getArticles({
      tags: tags || [],
      authors: authors || [],
      publishedOnly: published
    }),
    appliedFilters: {
      tagCount: tags?.length || 0,
      authorCount: authors?.length || 0,
      publishedFilter: published
    }
  })
})
```

### 嵌套查询对象

虽然 URL 查询参数天然是扁平的，但你可以通过约定来处理嵌套结构：

```typescript
// 使用点符号表示嵌套
app.get('/reports?<filter.dateFrom?:string>&<filter.dateTo?:string>&<filter.status?:string>&<options.format?:json|csv|pdf>&<options.includeDetails?:boolean>').use((req) => {
  // 手动重建嵌套结构
  const filter = {
    dateFrom: req.query['filter.dateFrom'],
    dateTo: req.query['filter.dateTo'], 
    status: req.query['filter.status']
  }
  
  const options = {
    format: req.query['options.format'] || 'json',
    includeDetails: req.query['options.includeDetails'] || false
  }
  
  const reportData = generateReport(filter)
  
  if (options.format === 'csv') {
    return Response.text(convertToCSV(reportData))
      .header('Content-Type', 'text/csv')
      .header('Content-Disposition', 'attachment; filename=report.csv')
  }
  
  if (options.format === 'pdf') {
    const pdf = await generatePDF(reportData, options.includeDetails)
    return Response.buffer(pdf)
      .header('Content-Type', 'application/pdf')
  }
  
  return Response.json({
    data: reportData,
    meta: { 
      format: options.format,
      includeDetails: options.includeDetails,
      generatedAt: new Date()
    }
  })
})
```


## 路由匹配优化

### match 方法详解

`match` 方法是 Farrow 路由系统的核心，它提供了比基本 HTTP 方法更强大的匹配功能，特别是支持 Headers 验证：

```typescript
// 基本 match 用法
app.match({
  url: '/api/users/<id:int>',
  method: 'GET'
}).use((request) => {
  return Response.json({ userId: request.params.id })
})

// 多方法匹配
app.match({
  url: '/api/data',
  method: ['GET', 'POST']
}).use((request) => {
  if (request.method === 'GET') {
    return Response.json({ data: [] })
  }
  return Response.json({ created: true })
})
```

#### Headers 匹配与验证

`match` 方法最强大的功能之一是支持使用 Schema 验证 Headers：

##### 基础 Header 验证

```typescript
import { String, Literal, Optional } from 'farrow-schema'

// 通过 headers 进行 API key 认证
app.match({
  url: '/api/secure/<endpoint:string>',
  method: 'GET',
  headers: {
    'x-api-key': String,  // 必需的 API key header
    'user-agent': String  // 必需的 user agent
  }
}).use((req) => {
  const { endpoint } = req.params
  const { 'x-api-key': apiKey, 'user-agent': userAgent } = req.headers
  
  return Response.json({
    endpoint,
    authenticated: true,
    apiKey: apiKey.substring(0, 8) + '...',  // 掩码 API key
    userAgent
  })
})

// 内容协商与 header 验证
app.match({
  url: '/api/data',
  method: 'GET',
  headers: {
    'accept': Literal('application/json'),  // 必须接受 JSON
    'x-client-version': String              // 必需的客户端版本
  }
}).use((req) => {
  const version = req.headers['x-client-version']
  
  // 根据客户端版本返回不同数据
  if (version.startsWith('v2')) {
    return Response.json({ data: 'v2 format', version: 2 })
  }
  
  return Response.json({ data: 'v1 format', version: 1 })
})
```

##### 高级 Header Schema

```typescript
import { Union, ObjectType, Number } from 'farrow-schema'

// 复杂的 header 验证与联合类型
app.match({
  url: '/api/upload',
  method: 'POST',
  headers: {
    'content-type': Union(
      Literal('application/json'),
      Literal('multipart/form-data'),
      Literal('application/x-www-form-urlencoded')
    ),
    'content-length': Number,
    'authorization': String,
    'x-upload-type': Union(
      Literal('avatar'),
      Literal('document'),
      Literal('media')
    )
  }
}).use((req) => {
  const {
    'content-type': contentType,
    'content-length': contentLength,
    authorization,
    'x-upload-type': uploadType
  } = req.headers
  
  // 根据上传类型验证内容长度
  const maxSizes = {
    avatar: 5 * 1024 * 1024,    // 头像 5MB
    document: 50 * 1024 * 1024, // 文档 50MB
    media: 100 * 1024 * 1024    // 媒体 100MB
  }
  
  if (contentLength > maxSizes[uploadType]) {
    return Response.status(413).json({
      error: '文件过大',
      maxSize: maxSizes[uploadType],
      uploadType
    })
  }
  
  return Response.json({
    message: '上传已接受',
    contentType,
    contentLength,
    uploadType
  })
})
```

##### 自定义 Header 验证器

```typescript
import { ValidatorType } from 'farrow-schema/validator'

// 自定义 JWT token 验证器
class JWTToken extends ValidatorType<string> {
  validate(input: unknown) {
    if (typeof input !== 'string') {
      return this.Err('JWT token 必须是字符串')
    }
    
    if (!input.startsWith('Bearer ')) {
      return this.Err('JWT token 必须以 "Bearer " 开头')
    }
    
    const token = input.substring(7)
    const parts = token.split('.')
    
    if (parts.length !== 3) {
      return this.Err('无效的 JWT token 格式')
    }
    
    return this.Ok(input)
  }
}

// 在 header 匹配中使用自定义验证器
app.match({
  url: '/api/v2/<resource:string>',
  method: ['GET', 'POST'],
  headers: {
    'authorization': new JWTToken(),
    'content-type': Literal('application/json')
  }
}).use((req) => {
  const { resource } = req.params
  const { authorization } = req.headers
  
  return Response.json({
    resource,
    tokenValid: true,
    timestamp: new Date().toISOString()
  })
})
```

##### Header 验证错误处理

```typescript
// 全局 header 验证错误处理
app.match({
  url: '/api/<path*:string>',
  headers: {
    'authorization': String,
    'x-api-version': Union(Literal('v1'), Literal('v2'), Literal('v3'))
  }
}, {
  onSchemaError: (error, request, next) => {
    // Header 验证失败的自定义错误处理
    if (error.path?.includes('authorization')) {
      return Response.status(401).json({
        error: '缺少或无效的授权 header',
        required: '需要 Authorization header',
        example: 'Authorization: Bearer your-token-here'
      })
    }
    
    if (error.path?.includes('x-api-version')) {
      return Response.status(400).json({
        error: '无效的 API 版本',
        supported: ['v1', 'v2', 'v3'],
        received: error.value,
        example: 'X-API-Version: v2'
      })
    }
    
    return Response.status(400).json({
      error: 'Header 验证失败',
      details: error.message,
      path: error.path
    })
  }
}).use((req) => {
  // 处理有效请求
  const apiVersion = req.headers['x-api-version']
  return Response.json({
    message: 'Headers 验证成功',
    apiVersion
  })
})
```

### 路由优先级

```typescript
// 优先级规则：具体路由优先于通用路由
app.get('/api/health').use(() => {
  return Response.json({ status: 'ok' })
})

// 这个路由不会匹配 /api/health，因为上面的路由更具体
app.get('/api/<endpoint:string>').use((req) => {
  return Response.json({ 
    endpoint: req.params.endpoint,
    message: 'Generic API endpoint'
  })
})

// 使用 block 选项控制路由匹配
app.match({
  url: '/admin/<action:string>',
  method: 'GET'
}, {
  block: true,  // 如果不匹配，停止在这里
  onSchemaError: (error) => {
    return Response.status(400).json({
      error: 'Invalid admin action',
      details: error.message
    })
  }
}).use((req) => {
  const allowedActions = ['dashboard', 'users', 'settings']
  
  if (!allowedActions.includes(req.params.action)) {
    return Response.status(404).json({
      error: 'Admin action not found'
    })
  }
  
  return Response.json({ 
    action: req.params.action,
    adminAccess: true
  })
})
```

### 条件路由

```typescript
// 基于请求头的条件路由
const createConditionalRoute = (condition: (req: any) => boolean, routes: any) => {
  return (req: any, next: any) => {
    if (condition(req)) {
      return routes(req, next)
    }
    return next(req)
  }
}

// 移动端特殊路由
app.get('/').use(
  createConditionalRoute(
    (req) => req.headers['user-agent']?.includes('Mobile'),
    () => Response.json({ 
      message: 'Mobile version',
      isMobile: true 
    })
  )
).use(() => {
  return Response.json({ 
    message: 'Desktop version',
    isMobile: false 
  })
})

// API key 条件路由
app.get('/api/premium/<endpoint:string>').use(
  createConditionalRoute(
    (req) => req.headers['x-api-key'] === 'premium-key',
    (req) => Response.json({
      endpoint: req.params.endpoint,
      tier: 'premium',
      features: ['advanced-analytics', 'real-time-sync']
    })
  )
).use((req) => {
  return Response.status(403).json({
    error: 'Premium API key required',
    endpoint: req.params.endpoint
  })
})
```

## 总结

通过掌握这些高级路由技术，你可以：

- 🎯 **处理复杂的 URL 模式** - 使用修饰符和联合类型创建灵活的路由参数
- 📊 **高级查询参数处理** - 支持复杂的搜索和过滤功能
- 🔒 **基于 Header 的路由匹配** - 使用 Schema 验证 headers 来强制执行 API 要求
- ⚡ **路由匹配优化** - 控制路由优先级和条件匹配
- 🏗️ **多租户架构** - 通过基于 header 的租户识别构建可扩展的 API

::: tip 💡 最佳实践
- 保持 API 中路由结构的一致性
- 使用有意义的参数和 header 名称
- 在 API 文档中记录 header 要求
- 为复杂的路由匹配逻辑添加注释
- 早期验证 headers 以提供清晰的错误消息
- 为业务特定的 header 格式使用自定义验证器
- 在更新 header 要求时考虑向后兼容性
:::

## 下一步

掌握了高级路由后，你可以继续学习：

**[Schema 操作与变换](./schema-operations)**  
学习如何灵活地操作和组合 Schema