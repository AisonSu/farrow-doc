# Response Building & Handling

> Master the core features of the Farrow Response system 🎨

## Response Basics

### Core Concepts

Key characteristics of the Farrow Response system:
- **Immutability** - Each operation returns a new Response instance
- **Chainable API** - Supports fluent API calls
- **Type Safety** - Complete TypeScript type support

```typescript
import { Response } from 'farrow-http'

// Basic usage
const response = Response.json({ message: 'Hello' })
  .status(201)
  .header('X-Custom', 'value')
```

## Basic Response Types

### JSON Response

```typescript
// Basic JSON
app.get('/users').use(() => {
  return Response.json({ users: [], total: 0 })
})

// With status code
app.post('/users').use(() => {
  return Response.json({ created: true }).status(201)
})

// Error response
app.get('/error').use(() => {
  return Response.json({ error: 'Not found' }).status(404)
})
```

### Text Response

```typescript
// Plain text
app.get('/hello').use(() => {
  return Response.text('Hello World')
})

// HTML response
app.get('/page').use(() => {
  return Response.html('<h1>Welcome</h1>')
})
```

### File Response

```typescript
// File download
app.get('/download').use(() => {
  return Response.file('./file.pdf')
})

// Custom filename
app.get('/report').use(() => {
  return Response.file('./data.csv', 'report-2024.csv')
})
```

### Buffer Response

```typescript
app.get('/binary').use(() => {
  const buffer = Buffer.from('binary data')
  return Response.buffer(buffer)
    .header('Content-Type', 'application/octet-stream')
})
```

## Status Code Setting

### Common Status Codes

```typescript
// Success responses
Response.json({ data: 'ok' }).status(200)  // default
Response.json({ created: true }).status(201)
Response.empty().status(204)  // no content

// Redirects
Response.redirect('/new-url')  // 302
Response.redirect('/new-url', 301)  // permanent redirect

// Client errors
Response.json({ error: 'Bad request' }).status(400)
Response.json({ error: 'Unauthorized' }).status(401)
Response.json({ error: 'Not found' }).status(404)

// Server errors
Response.json({ error: 'Server error' }).status(500)
```

### Custom Status Messages

```typescript
app.get('/custom').use(() => {
  return Response.json({ message: 'Custom status' })
    .status(418, 'I am a teapot')
})
```

## Response Headers

### Single Header

```typescript
app.get('/api/data').use(() => {
  return Response.json({ data: [] })
    .header('Cache-Control', 'no-cache')
    .header('X-API-Version', 'v1')
})
```

### Multiple Headers

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

### Common Header Examples

```typescript
// CORS headers
Response.json(data)
  .header('Access-Control-Allow-Origin', '*')
  .header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE')

// Cache control
Response.json(data)
  .header('Cache-Control', 'public, max-age=3600')
  .header('ETag', '"123456"')

// Security headers
Response.json(data)
  .header('X-Content-Type-Options', 'nosniff')
  .header('X-Frame-Options', 'DENY')
```

## Cookie Operations

### Setting Cookies

```typescript
// Basic cookie
app.post('/login').use(() => {
  return Response.json({ success: true })
    .cookie('session', 'abc123')
})

// Cookie with options
app.post('/auth').use(() => {
  return Response.json({ authenticated: true })
    .cookie('token', 'jwt-token', {
      httpOnly: true,
      secure: true,
      maxAge: 86400000, // 24 hours
      sameSite: 'strict'
    })
})

// Delete cookie
app.post('/logout').use(() => {
  return Response.json({ success: true })
    .cookie('session', '', { maxAge: 0 })
})
```

## Special Response Types

### Empty Response

```typescript
// 204 No Content
app.delete('/users/<id:int>').use(() => {
  // Delete user logic
  return Response.empty().status(204)
})

// HEAD request response
app.head('/users/<id:int>').use(() => {
  return Response.empty()
    .header('Content-Length', '1024')
    .header('Last-Modified', new Date().toUTCString())
})
```

### Redirect Response

```typescript
// Temporary redirect (302)
app.get('/old-page').use(() => {
  return Response.redirect('/new-page')
})

// Permanent redirect (301)
app.get('/deprecated').use(() => {
  return Response.redirect('/current', 301)
})

// Redirect with parameters
app.post('/submit').use((request) => {
  const { id } = request.body
  return Response.redirect(`/success?id=${id}`)
})
```

## Response Merging

### Merging Rules

```typescript
// Later responses override earlier response bodies
const response1 = Response.json({ data: 'first' })
const response2 = Response.json({ data: 'second' })
const merged = response1.merge(response2)
// Result: { data: 'second' }

// Headers are merged
const withHeaders = Response.json({ data: 'test' })
  .header('X-First', 'value1')
  .merge(Response.empty().header('X-Second', 'value2'))
// Result contains both headers
```

### Practical Application

```typescript
// Add common headers in middleware
app.use((request, next) => {
  const response = next(request)
  return response.header('X-API-Version', '1.0')
})

// Business logic returns specific data
app.get('/data').use(() => {
  return Response.json({ data: 'example' })
  // Final response will include X-API-Version header
})
```

## Practical Examples

### API Error Handling

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

### File Service

```typescript
app.get('/files/<filename:string>').use((request) => {
  const { filename } = request.params
  const filePath = `./uploads/${filename}`
  
  // Check file exists
  if (!fs.existsSync(filePath)) {
    return Response.json({ error: 'File not found' }).status(404)
  }
  
  // Return file
  return Response.file(filePath)
    .header('Content-Disposition', `attachment; filename="${filename}"`)
})
```

### Content Negotiation

```typescript
app.get('/data').use((request) => {
  const accept = request.headers.accept
  const data = { message: 'Hello', timestamp: Date.now() }
  
  if (accept?.includes('application/xml')) {
    const xml = `<data><message>${data.message}</message></data>`
    return Response.text(xml)
      .header('Content-Type', 'application/xml')
  }
  
  // Default to JSON
  return Response.json(data)
})
```

## Stream Responses

```typescript
import { Readable } from 'stream'

// Send stream
app.get('/stream').use(() => {
  const stream = fs.createReadStream('./large-file.json')
  
  return Response
    .stream(stream)
    .header('Content-Type', 'application/json')
    .header('Transfer-Encoding', 'chunked')
})

// Server-Sent Events (SSE)
app.get('/events').use(() => {
  const stream = new Readable({
    read() {
      // Send an event every second
      const interval = setInterval(() => {
        this.push(`data: ${JSON.stringify({ time: Date.now() })}\n\n`)
      }, 1000)
      
      // End after 10 seconds
      setTimeout(() => {
        clearInterval(interval)
        this.push(null)
      }, 10000)
    }
  })
  
  return Response
    .stream(stream)
    .header('Content-Type', 'text/event-stream')
    .header('Cache-Control', 'no-cache')
    .header('Connection', 'keep-alive')
})
```

## Summary

Core features of the Farrow Response system:

- **Multiple Response Types** - JSON, text, files, Buffer, etc.
- **Chainable API** - Fluent response building approach
- **Immutable Design** - Safe concurrent processing
- **Complete HTTP Semantics** - Status codes, headers, cookies support

By properly utilizing these features, you can build comprehensive HTTP response handling systems.