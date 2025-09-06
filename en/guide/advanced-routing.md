# Advanced Route Parameters

> Master complex parameter handling in the Farrow routing system 🛣️

When your application becomes complex, simple route parameters may not meet your needs. This chapter explores advanced route parameter features in Farrow for handling more complex URL patterns and parameter validation.

## Complex Path Parameter Patterns

### Parameter Modifier Details

Farrow provides rich parameter modifiers to handle different URL patterns:

```typescript
import { Http, Response } from 'farrow-http'

const app = Http()

// Basic parameters
app.get('/users/<id:int>').use((req) => {
  // req.params.id type: number
  return Response.json({ userId: req.params.id })
})

// Optional parameters
app.get('/posts/<id:int>/comments/<commentId?:int>').use((req) => {
  const { id, commentId } = req.params
  // id: number, commentId: number | undefined
  
  if (commentId) {
    return Response.json({ postId: id, commentId })
  } else {
    return Response.json({ postId: id, allComments: true })
  }
})

// One or more (+)
app.get('/categories/<path+:string>').use((req) => {
  // req.params.path type: string[]
  // /categories/tech/frontend/react -> path: ["tech", "frontend", "react"]
  return Response.json({ 
    categoryPath: req.params.path,
    depth: req.params.path.length 
  })
})

// Zero or more (*)
app.get('/files/<segments*:string>').use((req) => {
  // req.params.segments type: string[] | undefined
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

### Union Type Parameters

Create parameters with multiple possible values:

```typescript
// String union types
app.get('/posts/<status:draft|published|archived>').use((req) => {
  // req.params.status type: "draft" | "published" | "archived"
  const { status } = req.params
  
  return Response.json({
    status,
    isPending: status === 'draft',
    isLive: status === 'published'
  })
})

// Mixed type unions
app.get('/content/<type:post|page|product>/<id:int>').use((req) => {
  const { type, id } = req.params
  // type: "post" | "page" | "product"
  // id: number
  
  return Response.json({ 
    contentType: type,
    contentId: id,
    endpoint: `/${type}s/${id}` // dynamically build endpoint
  })
})
```

### Exact Match Parameters

Use braces to define exact string matches:

```typescript
// API version control
app.get('/api/<version:{v1}|{v2}|{v3}>/users').use((req) => {
  const { version } = req.params
  // version type: "v1" | "v2" | "v3"
  
  switch (version) {
    case 'v1':
      return Response.json({ users: getUsersV1() })
    case 'v2':
      return Response.json({ users: getUsersV2(), version: 2 })
    case 'v3':
      return Response.json({ users: getUsersV3(), meta: { version: 3 } })
  }
})

// Language routing
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

## Advanced Query Parameter Handling

### Complex Query Parameter Combinations

```typescript
// Search and filtering
app.get('/products?<q:string>&<category?:string>&<minPrice?:float>&<maxPrice?:float>&<sort?:price|name|date>&<order?:asc|desc>&<page?:int>&<limit?:int>').use((req) => {
  const { 
    q,                    // string (required)
    category,             // string | undefined
    minPrice,             // number | undefined
    maxPrice,             // number | undefined
    sort = 'name',        // "price" | "name" | "date" (default name)
    order = 'asc',        // "asc" | "desc" (default asc)  
    page = 1,             // number (default 1)
    limit = 20            // number (default 20)
  } = req.query
  
  // Build query conditions
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

### Array Query Parameters

```typescript
// Multi-select tags
app.get('/articles?<tags*:string>&<authors*:string>&<published?:boolean>').use((req) => {
  const { tags, authors, published } = req.query
  // tags: string[] | undefined
  // authors: string[] | undefined  
  // published: boolean | undefined
  
  // URL: /articles?tags=tech&tags=frontend&authors=alice&authors=bob
  // Result: { tags: ["tech", "frontend"], authors: ["alice", "bob"] }
  
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

### Nested Query Objects

While URL query parameters are naturally flat, you can handle nested structures through conventions:

```typescript
// Use dot notation for nesting
app.get('/reports?<filter.dateFrom?:string>&<filter.dateTo?:string>&<filter.status?:string>&<options.format?:json|csv|pdf>&<options.includeDetails?:boolean>').use((req) => {
  // Manually rebuild nested structure
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

## Route Matching Optimization

### match Method Deep Dive

The `match` method is the core of Farrow's routing system, providing more powerful matching capabilities than basic HTTP methods, especially with Headers validation support:

```typescript
// Basic match usage
app.match({
  url: '/api/users/<id:int>',
  method: 'GET'
}).use((request) => {
  return Response.json({ userId: request.params.id })
})

// Multiple method matching
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

#### Headers Matching and Validation

One of the most powerful features of the `match` method is support for Headers validation using schemas:

##### Basic Header Validation

```typescript
import { String, Literal, Optional } from 'farrow-schema'

// API key authentication via headers
app.match({
  url: '/api/secure/<endpoint:string>',
  method: 'GET',
  headers: {
    'x-api-key': String,  // Required API key header
    'user-agent': String  // Required user agent
  }
}).use((req) => {
  const { endpoint } = req.params
  const { 'x-api-key': apiKey, 'user-agent': userAgent } = req.headers
  
  return Response.json({
    endpoint,
    authenticated: true,
    apiKey: apiKey.substring(0, 8) + '...',  // Mask API key
    userAgent
  })
})

// Content negotiation with header validation
app.match({
  url: '/api/data',
  method: 'GET',
  headers: {
    'accept': Literal('application/json'),  // Must accept JSON
    'x-client-version': String              // Required client version
  }
}).use((req) => {
  const version = req.headers['x-client-version']
  
  // Return different data based on client version
  if (version.startsWith('v2')) {
    return Response.json({ data: 'v2 format', version: 2 })
  }
  
  return Response.json({ data: 'v1 format', version: 1 })
})
```

##### Advanced Header Schemas

```typescript
import { Union, ObjectType, Number } from 'farrow-schema'

// Complex header validation with union types
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
  
  // Validate content length based on upload type
  const maxSizes = {
    avatar: 5 * 1024 * 1024,    // 5MB for avatars
    document: 50 * 1024 * 1024, // 50MB for documents
    media: 100 * 1024 * 1024    // 100MB for media
  }
  
  if (contentLength > maxSizes[uploadType]) {
    return Response.status(413).json({
      error: 'File too large',
      maxSize: maxSizes[uploadType],
      uploadType
    })
  }
  
  return Response.json({
    message: 'Upload accepted',
    contentType,
    contentLength,
    uploadType
  })
})
```

##### Custom Header Validators

```typescript
import { ValidatorType } from 'farrow-schema/validator'

// Custom JWT token validator
class JWTToken extends ValidatorType<string> {
  validate(input: unknown) {
    if (typeof input !== 'string') {
      return this.Err('JWT token must be a string')
    }
    
    if (!input.startsWith('Bearer ')) {
      return this.Err('JWT token must start with "Bearer "')
    }
    
    const token = input.substring(7)
    const parts = token.split('.')
    
    if (parts.length !== 3) {
      return this.Err('Invalid JWT token format')
    }
    
    return this.Ok(input)
  }
}

// Use custom validators in header matching
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

##### Error Handling for Header Validation

```typescript
// Global header validation error handling
app.match({
  url: '/api/<path*:string>',
  headers: {
    'authorization': String,
    'x-api-version': Union(Literal('v1'), Literal('v2'), Literal('v3'))
  }
}, {
  onSchemaError: (error, request, next) => {
    // Custom error handling for header validation failures
    if (error.path?.includes('authorization')) {
      return Response.status(401).json({
        error: 'Missing or invalid authorization header',
        required: 'Authorization header is required',
        example: 'Authorization: Bearer your-token-here'
      })
    }
    
    if (error.path?.includes('x-api-version')) {
      return Response.status(400).json({
        error: 'Invalid API version',
        supported: ['v1', 'v2', 'v3'],
        received: error.value,
        example: 'X-API-Version: v2'
      })
    }
    
    return Response.status(400).json({
      error: 'Header validation failed',
      details: error.message,
      path: error.path
    })
  }
}).use((req) => {
  // Handle valid requests
  const apiVersion = req.headers['x-api-version']
  return Response.json({
    message: 'Headers validated successfully',
    apiVersion
  })
})
```

### Route Priority

```typescript
// Priority rule: specific routes take precedence over generic routes
app.get('/api/health').use(() => {
  return Response.json({ status: 'ok' })
})

// This route won't match /api/health because the above route is more specific
app.get('/api/<endpoint:string>').use((req) => {
  return Response.json({ 
    endpoint: req.params.endpoint,
    message: 'Generic API endpoint'
  })
})

// Use block option to control route matching
app.match({
  url: '/admin/<action:string>',
  method: 'GET'
}, {
  block: true,  // if no match, stop here
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

### Conditional Routing

```typescript
// Header-based conditional routing
const createConditionalRoute = (condition: (req: any) => boolean, routes: any) => {
  return (req: any, next: any) => {
    if (condition(req)) {
      return routes(req, next)
    }
    return next(req)
  }
}

// Special mobile routes
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

// API key conditional routing
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

## Summary

By mastering these advanced routing techniques, you can:

- 🎯 **Handle Complex URL Patterns** - Use modifiers and union types to create flexible route parameters
- 📊 **Advanced Query Parameter Handling** - Support complex search and filtering functionality
- 🔒 **Header-Based Route Matching** - Use schema validation for headers to enforce API requirements
- ⚡ **Route Matching Optimization** - Control route priority and conditional matching
- 🏗️ **Multi-Tenant Architecture** - Build scalable APIs with header-based tenant identification

::: tip 💡 Best Practices
- Keep route structure consistent across your API
- Use meaningful parameter and header names
- Document header requirements in your API documentation
- Add comments for complex route matching logic
- Validate headers early to provide clear error messages
- Use custom validators for business-specific header formats
- Consider backwards compatibility when updating header requirements
:::

## Next Steps

After mastering advanced routing, you can continue learning:

**[Schema Operations & Transformations](./schema-operations)**  
Learn how to flexibly manipulate and compose Schemas