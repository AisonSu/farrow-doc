# Farrow Design Philosophy

> Deeply understand Farrow's design principles and core concepts

## Philosophical Foundation of Farrow

### Three Core Principles

<div class="philosophy-pillars">

#### 1. Type as Truth

> "Make the compiler your first line of defense"

In Farrow's worldview, types are not constraints but liberation. Through precise type definitions, we reject impossible states at compile time.

```typescript
// ❌ Traditional approach: errors discovered at runtime
function processUser(data: any) {
  // data.age could be string? number? undefined?
  if (data.age > 18) {  // might crash at runtime
    // ...
  }
}

// ✅ Farrow approach: correctness guaranteed at compile time
class User extends ObjectType {
  age = Number  // explicit type definition
}

function processUser(user: TypeOf<typeof User>) {
  if (user.age > 18) {  // compiler guarantees age is number
    // ...
  }
}
```

**Principle Applications:**
- Use Schema instead of interfaces to define data structures
- Let TypeScript infer rather than manually annotate types
- Prefer compile-time errors over runtime checks

#### 2. Pure Function First

> "Push side effects to boundaries, keep core logic pure"

Farrow encourages building application core logic with pure functions, pushing side effects (I/O, database, network) to application boundaries.

```typescript
// ❌ Business logic mixed with side effects
async function createPost(data: any) {
  const user = await db.getUser(data.userId)  // side effect
  if (!user.canPost) {  // business logic
    throw new Error('Cannot post')
  }
  const post = await db.createPost(data)  // side effect
  await emailService.notify(user)  // side effect
  return post
}

// ✅ Pure business logic
// Pure function: business rules
function canUserPost(user: User): boolean {
  return user.role === 'author' || user.role === 'admin'
}

function preparePostData(data: CreatePostInput, user: User): PostData {
  return {
    ...data,
    authorId: user.id,
    createdAt: new Date(),
    status: 'draft'
  }
}

// Side effects handled at boundaries
app.post('/posts', { body: CreatePostSchema }).use((request) => {
  const user = useCurrentUser()  // side effect: read Context
  
  if (!canUserPost(user)) {  // pure function: business logic
    return Response.status(403).json({ error: 'Cannot post' })
  }
  
  const postData = preparePostData(request.body, user)  // pure function
  const post = createPost(postData)  // side effect: database
  
  return Response.status(201).json(post)
})
```

#### 3. Composition over Configuration

> "Small and beautiful components, infinite possibilities"

Farrow prefers building complex functionality through composing simple components rather than configuration files.

```typescript
// ❌ Configuration-driven
const app = createApp({
  middleware: ['cors', 'auth', 'logger'],
  cors: { origin: '*' },
  auth: { secret: 'xxx' },
  logger: { level: 'info' },
  routes: [
    { path: '/users', method: 'GET', handler: getUsers },
    { path: '/users', method: 'POST', handler: createUser }
  ]
})

// ✅ Composition-driven
const app = Http()

// Compose middleware
app.use(cors({ origin: '*' }))
app.use(auth({ secret: 'xxx' }))
app.use(logger({ level: 'info' }))

// Compose routes
const userRouter = Router()
userRouter.get('/').use(getUsers)
userRouter.post('/').use(createUser)

app.route('/users').use(userRouter)
```

</div>

## Summary

Farrow's design philosophy can be summarized as:

### Core Concepts
- 🎯 **Type as Truth** - Let the compiler help you catch errors
- 🧩 **Pure Function First** - Push side effects to boundaries
- 🔄 **Composition over Configuration** - Build large systems with small components

These core principles guide Farrow's design decisions, ensuring the framework helps developers build type-safe, predictable, and maintainable applications.

---

<div class="doc-footer">
  <div class="doc-nav">
    <a href="./essentials.md">← Essentials</a>
    <a href="../">Home →</a>
  </div>
</div>
