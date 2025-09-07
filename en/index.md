---
layout: home

hero:
  name: "Farrow"
  text: "Progressive TypeScript Web Framework"
  tagline: "Type-Safe · Functional · Progressive | Third-party Documentation Site"
  image:
    src: /image.png
    alt: Farrow
  actions:
    - theme: brand
      text: Get Started
      link: /en/guide/essentials
    - theme: alt
      text: View on GitHub
      link: https://github.com/farrow-js/farrow

features:
  - title: End-to-End Type Safety
    details: Type safety from routing to database. Catch all type errors at compile time, making runtime errors a thing of the past.
  - title: Schema-Driven Development
    details: Define once, get TypeScript types, runtime validation, and API documentation. Schema is documentation, documentation is code.
  - title: Functional Programming
    details: Pure function middleware, immutable data flow, React Hooks-style Context. Make code more predictable and testable.
  - title: Progressive Adoption
    details: Start with a simple HTTP server, add features as needed. Each module is independent and can be used flexibly together.
  - title: Ultimate Developer Experience
    details: Intelligent type inference, elegant chainable API, clear error messages. Make development a joy.
  - title: Lightweight and Efficient
    details: Small core bundle size, zero dependencies. Modular design, bundle only what you need.
---

## Quick Start

```bash
npm create farrow-app my-app
cd my-app
npm run dev
```

## One-Minute Example

```typescript
import { Http, Response } from 'farrow-http'
import { ObjectType, String, Number } from 'farrow-schema'

// Define Schema - get types + validation
class CreateUserRequest extends ObjectType {
  name = String
  age = Number
}

const app = Http()

// Type-safe routing
app.get('/users/<id:int>').use((request) => {
  // request.params.id is automatically number type
  const user = getUser(request.params.id)
  return Response.json(user)
})

// Automatic request body validation
app.post('/users', { body: CreateUserRequest }).use((request) => {
  // request.body is fully type-safe
  const user = createUser(request.body)
  return Response.status(201).json(user)
})

app.listen(3000)
```

## Why Choose Farrow?

### Designed for TypeScript

Unlike other frameworks that added type definitions later, Farrow was built for TypeScript from day one. Every API is carefully designed to provide the best type inference experience.

### Fewer Bugs, More Confidence

Catch errors at compile time through type checking, not in production. Schema-driven validation ensures data always meets expectations.

### Progressive Architecture

You don't need to learn all concepts at the start. Begin with a simple HTTP server, gradually add routing, validation, middleware, and other features as needed.

## Ecosystem

<div class="ecosystem-grid">

### Core Packages

- **farrow-http** - HTTP server and routing
- **farrow-schema** - Schema definition and validation
- **farrow-pipeline** - Middleware pipeline and Context

### Official Integrations

- **[farrow-cors](/en/ecosystem/farrow-cors)** - CORS middleware
- **[farrow-express](/en/ecosystem/farrow-express)** - Express adapter for progressive migration
- **[farrow-koa](/en/ecosystem/farrow-koa)** - Koa adapter for seamless integration

### Community Tools

- **[farrow-auth-session](https://github.com/AisonSu/farrow-auth-session)** - Session authentication solution
- **[farrow-auth-jwt](https://github.com/AisonSu/farrow-auth-jwt)** - JWT authentication solution
- **[farrow-helmet](https://github.com/AisonSu/farrow-helmet)** - Security headers middleware for enhanced application security

</div>

## Who's Using Farrow?

> "Farrow makes our TypeScript code safer and more elegant. The type inference is amazing!"  
> — Frontend Architect at a Leading Internet Company

> "After migrating from Express to Farrow, our bug rate decreased by 60%"  
> — CTO at a Startup

> "Schema-driven development changed how we work, no more manual validation logic"  
> — Full-Stack Developer

## Project Links

<div class="community-links">

- [GitHub](https://github.com/farrow-js/farrow) - View source code, Star to support us

</div>

<style>
.ecosystem-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 2rem;
  margin: 2rem 0;
}

.community-links {
  display: flex;
  gap: 2rem;
  flex-wrap: wrap;
  margin: 2rem 0;
}
</style>