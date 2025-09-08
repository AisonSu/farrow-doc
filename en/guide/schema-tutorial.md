# Farrow Schema Progressive Learning Guide

> 🎯 **User-oriented progressive learning, from basics to practical applications**  
> 🎮 **From beginner to mastery of type-safe journey**

---

## Why Choose farrow-schema?

Suppose you're developing a user registration feature. Using traditional approaches, you need to:

```typescript
// 1. Define TypeScript interface
interface User {
  name: string
  email: string
  age: number
}

// 2. Write validation functions (start questioning life)
function validateUser(data: any): User {
  if (!data.name || typeof data.name !== 'string') {
    throw new Error('Name is required and must be a string')
  }
  if (!data.email || !isValidEmail(data.email)) {
    throw new Error('Valid email is required')
  }
  if (!data.age || typeof data.age !== 'number') {
    throw new Error('Age is required and must be a number')
  }
  return data as User
}

// 3. Also need to maintain sync between two definitions... 😭
// 4. Product Manager: Can we add another field?
// 5. You: ...(internal collapse)
```

Using farrow-schema, life suddenly becomes beautiful:

```typescript
import { ObjectType, String, Number, Int } from 'farrow-schema'

class User extends ObjectType {
  name = String
  email = EmailType  // Custom validator
  age = Number
}

// That's it! Types and validation are both there 🎉
// Product Manager: Add another field?
// You: No problem, one line done!
```

---

## Basic Concepts: Starting Simple

### Define Your First Schema

Let's start with a product from an e-commerce website (after all, who doesn't want to open an online store to make money?):

```typescript
import { ObjectType, String, Number, Int, Float, Boolean, List, Optional } from 'farrow-schema'

class Product extends ObjectType {
  id = Int                // Product ID (integer)
  name = String           // Product name (like "Programmer Anti-Hair Loss Shampoo")
  price = Float           // Price (9999.99 - because programmers are rich)
  inStock = Boolean       // In stock (always false, too popular)
  tags = List(String)     // Tag list ["anti-hair loss", "programmer exclusive", "bug fixer"]
  description = Optional(String)  // Optional description (too lazy to write)
}
```

### Get TypeScript Types

TypeScript's type inference is more considerate than your first love:

```typescript
import { TypeOf } from 'farrow-schema'

type ProductType = TypeOf<typeof Product>
// Automatically inferred as:
// {
//   name: string
//   price: number
//   inStock: boolean
//   tags: string[]
//   description?: string  // See, even optional is inferred for you
// }

// No more manual type sync maintenance! 🎊
```

### Validate Data

Validate user input, let hackers cry:

```typescript
import { Validator } from 'farrow-schema/validator'

const productData = {
  name: "iPhone 15",
  price: 999,  // Apple: We're not selling phones, we're selling faith
  inStock: true,
  tags: ["smartphone", "apple", "kidney-selling exclusive"]
}

const result = Validator.validate(Product, productData)
if (result.isOk) {
  console.log('Validation successful:', result.value)
  // Can happily save to database
} else {
  console.log('Validation failed:', result.value.message)
  // Tell user: Your data has problems, don't try to get away with it!
}
```

---

## Advanced Usage: Handling Real Scenarios

### Nested Objects: Direct Object Literals

When you need nested structures, just write them directly (like Russian dolls, but more interesting):

```typescript
class Order extends ObjectType {
  id = String
  
  // Customer info (need to know who you are to deliver)
  customer = {
    name: String,
    email: String,
    phone: Optional(String)  // Social anxiety patients can skip
  }
  
  // Product list (buy buy buy!)
  items = List({
    productId: String,
    quantity: Number,    // Stock: How many do you want? User: All of them!
    price: Number        // Price at payment, prevent merchants from secretly raising prices
  })
  
  // Shipping address (delivery to Mars also requires shipping fee)
  shippingAddress = {
    street: String,
    city: String,
    country: String,
    zipCode: String      // Fill it wrong and the package goes traveling around the world
  }
}
```

### Union Types: Handle Multiple Possibilities

Life is full of choices, so is code:

```typescript
import { Union, Literal } from 'farrow-schema'

// Order status (the emotional journey from order to delivery)
class Order extends ObjectType {
  status = Union(
    Literal('pending'),    // Pending (boss is still sleeping)
    Literal('processing'), // Processing (boss woke up)
    Literal('shipped'),    // Shipped (flying on the road)
    Literal('delivered')   // Delivered (finally arrived!)
  )
}

// Payment method (not enough money? Try installments!)
const PaymentMethod = Union(
  {
    type: Literal('credit_card'),
    cardNumber: String,
    cvv: String,
    expiryDate: String  // Expires 2099, hope we're still using credit cards then
  },
  {
    type: Literal('paypal'),
    email: String       // PayPal: Make transfers as simple as sending emails (not really)
  },
  {
    type: Literal('bank_transfer'),
    accountNumber: String,
    routingNumber: String  // Fill one digit wrong, money goes on vacation
  }
)

// TypeScript will automatically recognize different types (smarter than AI)
function processPayment(payment: TypeOf<typeof PaymentMethod>) {
  switch (payment.type) {
    case 'credit_card':
      // TypeScript knows there's cardNumber, cvv, expiryDate here
      console.log(payment.cardNumber)
      // Credit card: spend future money first, let future self worry
      break
    case 'paypal':
      // TypeScript knows there's email here
      console.log(payment.email)
      // PayPal: international transfer tool (fees are also international level)
      break
    case 'bank_transfer':
      // TypeScript knows there's accountNumber, routingNumber here
      console.log(payment.accountNumber)
      // Bank transfer: most traditional method, also the slowest
      break
  }
}
```

### Recursive Structures: Comment System

Recursion, the programmer's romance (also interviewer's favorite):

```typescript
// Comments can have replies, replies can have replies (infinite nesting warning!)
class Comment extends ObjectType {
  id = String
  content = String        // "First!" "Second!" "Floor!"
  author = String         // "Keyboard Warrior 123"
  createdAt = Date
  replies = List(Comment)  // Directly reference itself! The charm of recursion
}

// Category tree (as complex as family genealogy)
class Category extends ObjectType {
  name = String
  slug = String
  parent = Optional(Category)     // Find parent
  children = List(Category)       // Have children
}

// Social network (complex interpersonal relationships)
class User extends ObjectType {
  id = String
  name = String
  friends = List(User)      // Friends (superficial)
  following = List(User)    // Following (secretly observing)
  followers = List(User)    // Followers (also secretly observing you)
}
```

---

## Practical Tips: Make Code More Elegant

### Create API-Specific Schemas

In real projects, different APIs need different data (like different occasions need different clothes):

```typescript
import { pickObject, omitObject, partial } from 'farrow-schema'

// Complete user model (all info here)
class User extends ObjectType {
  id = String
  username = String
  email = String
  password = String        // Encrypted storage, or you'll be trending
  profile = {
    firstName: String,
    lastName: String,
    avatar: Optional(String),    // Avatar (default blue person if not provided)
    bio: Optional(String)        // Bio ("This person is lazy, wrote nothing")
  }
  createdAt = Date
  updatedAt = Date
}

// User registration: only need basic info (don't ask for ID card right away)
const UserRegistration = pickObject(User, ['username', 'email', 'password'])

// User profile: exclude sensitive info (password is secret!)
const UserProfile = omitObject(User, ['password'])

// User update: all fields optional (change whatever you want)
const UserUpdate = partial(pickObject(User, ['username', 'profile']))

// Use in API
app.post('/api/register', async (req, res) => {
  const result = Validator.validate(UserRegistration, req.body)
  if (result.isErr) {
    return res.status(400).json({ 
      error: result.value.message,
      translation: "Your input has problems, try again young one!"
    })
  }
  // result.value type is { username: string, email: string, password: string }
  const user = await createUser(result.value)
  res.json({ 
    message: "Registration successful! Welcome to our big family!",
    user 
  })
})
```

### Custom Validators

Built-in types not enough? DIY, self-sufficient:

```typescript
import { ValidatorType, Validator } from 'farrow-schema/validator'
import { String } from 'farrow-schema'

// Email validator (reject test@test.com)
class EmailType extends ValidatorType<string> {
  validate(input: unknown) {
    const result = Validator.validate(String, input)
    if (result.isErr) return result
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(result.value)) {
      return this.Err('This is not an email right? You sure you\'re not kidding?')
    }
    
    // Easter egg: reject test emails
    if (result.value === 'test@test.com') {
      return this.Err('Be serious! test@test.com is not a real email!')
    }
    
    return this.Ok(result.value)
  }
}

// Parameterized validator: string length (flexible customization)
const StringLength = (min: number, max: number) => {
  return class extends ValidatorType<string> {
    validate(input: unknown) {
      const result = Validator.validate(String, input)
      if (result.isErr) return result
      
      if (result.value.length < min) {
        return this.Err(`Too short! At least ${min} characters needed (don't be lazy)`)
      }
      if (result.value.length > max) {
        return this.Err(`Too long! Maximum ${max} characters (writing an essay?)`)
      }
      
      return this.Ok(result.value)
    }
  }
}

// Use custom validators
class User extends ObjectType {
  email = EmailType
  username = StringLength(3, 20)   // Username: can't be too short or too long
  password = StringLength(8, 100)  // Password: be secure but not too crazy
  bio = Optional(StringLength(0, 500))  // Bio: optional, but don't write a novel
}
```

### Optional vs Nullable

The difference between these two is like "forgot to bring money" vs "brought 0 dollars":

```typescript
class UserProfile extends ObjectType {
  // Optional: field might not exist (didn't fill means didn't fill)
  bio = Optional(String)        // { bio?: string }
  
  // Nullable: field exists but might be null (explicitly saying "I don't want to fill")
  avatar = Nullable(String)     // { avatar: string | null }
  
  // Combine both: might not exist and might be null (Schrödinger's field)
  website = Optional(Nullable(String))  // { website?: string | null }
}

// Difference in actual use
const profile1 = {
  avatar: null,    // ✅ Nullable allows (I just don't want an avatar)
  // bio doesn't exist    // ✅ Optional allows (too lazy to write bio)
}

const profile2 = {
  bio: "I'm a person with stories",    // ✅ Provided value
  avatar: "handsome.jpg"               // ✅ Provided value (confident!)
}
```

### Flexible Field Control

Use `required` and `partial` to master fields (flexible like Transformers):

```typescript
// Event info
class Event extends ObjectType {
  title = String                      // Title required (how to attract without title?)
  description = Optional(String)      // Description optional (forget it if lazy)
  location = Optional(String)         // Location optional (online events don't need)
  startTime = Optional(Date)          // Start time optional (start randomly)
  endTime = Optional(Date)            // End time optional (end randomly)
}

// Create draft: only need title (reserve a spot first)
const DraftEvent = Event

// Publish event: all fields required (getting serious now)
const PublishedEvent = required(Event)

// Update event: all fields optional (change whatever you want)
const UpdateEvent = partial(Event)

// Actual usage
function saveDraft(data: TypeOf<typeof DraftEvent>) {
  // data.title is required
  // Other fields are all optional
  console.log("Draft saved, perfect it slowly")
}

function publishEvent(data: TypeOf<typeof PublishedEvent>) {
  // All fields are required
  console.log(data.description)  // string (not string | undefined)
  console.log("Event published successfully! Get ready to welcome participants!")
}
```

---

## Real-World Example: Building a Blog System

Let's build a blog system (every programmer needs their own blog, even if no one reads it):

```typescript
import { 
  ObjectType, String, Number, Boolean, Date, 
  List, Optional, Union, Literal,
  TypeOf, pickObject, omitObject, partial
} from 'farrow-schema'

// Article model (your crystallized thoughts)
class Article extends ObjectType {
  id = String
  title = String          // Clickbait essential
  slug = String           // SEO-friendly URL
  content = String        // Body (supports Markdown, programmer's favorite)
  excerpt = Optional(String)  // Summary (auto-truncate if too lazy to write)
  
  author = {
    id: String,
    name: String,        // Author's great name
    avatar: Optional(String)  // Avatar (mysterious person if not provided)
  }
  
  status = Union(
    Literal('draft'),      // Draft (wrote half then went to slack off)
    Literal('published'),  // Published (finally finished!)
    Literal('archived')    // Archived (outdated content)
  )
  
  tags = List(String)      // Tags (SEO optimization essential)
  
  metadata = {
    views: Number,         // View count (mostly yourself clicking)
    likes: Number,         // Like count (mom's likes count too)
    commentsCount: Number  // Comment count (including your own test comments)
  }
  
  publishedAt = Optional(Date)  // Publish time
  createdAt = Date
  updatedAt = Date
}

// Comment model (keyboard warriors' battlefield)
class Comment extends ObjectType {
  id = String
  articleId = String
  content = String         // Comment content (be friendly, no flame wars)
  
  author = {
    name: String,          // Nickname ("Passing Master")
    email: EmailType,      // Email (for Gravatar avatar display)
    website: Optional(String)  // Personal website (promote while you're at it)
  }
  
  replies = List(Comment)  // Support nested replies (arguing made easier)
  
  createdAt = Date
}

// API Schema
const CreateArticleInput = pickObject(Article, ['title', 'content', 'excerpt', 'tags'])
const UpdateArticleInput = partial(CreateArticleInput)
const ArticleResponse = omitObject(Article, ['updatedAt'])

const CreateCommentInput = {
  content: StringLength(1, 1000),  // Comments shouldn't be too long (writing a thesis?)
  author: {
    name: StringLength(1, 50),     // Nickname shouldn't be too long
    email: EmailType,
    website: Optional(String)
  }
}

// Express API implementation
import express from 'express'
import { Validator } from 'farrow-schema/validator'

const app = express()

// Create article
app.post('/api/articles', authenticate, async (req, res) => {
  const result = Validator.validate(CreateArticleInput, req.body)
  
  if (result.isErr) {
    return res.status(400).json({
      error: result.value.message,
      field: result.value.path?.join('.'),
      advice: "Check your input, don't let bugs escape!"
    })
  }
  
  const article = await createArticle({
    ...result.value,
    authorId: req.user.id,
    status: 'draft'  // Save as draft first, think before publishing
  })
  
  res.json({ 
    message: "Article created successfully! Time to show your talent!",
    article 
  })
})

// Add comment
app.post('/api/articles/:id/comments', async (req, res) => {
  const result = Validator.validate(CreateCommentInput, req.body)
  
  if (result.isErr) {
    return res.status(400).json({
      error: result.value.message,
      field: result.value.path?.join('.'),
      hint: "Comments should be friendly, be a civilized netizen!"
    })
  }
  
  const comment = await createComment({
    ...result.value,
    articleId: req.params.id
  })
  
  res.json({
    message: "Comment successful! Thanks for your participation!",
    comment
  })
})
```

---

## Design Principles: Write Better Schemas

### 1. Static Definition, No Dynamic Generation

```typescript
// ✅ Good: Static definition (TypeScript will thank you)
class User extends ObjectType {
  name = String
  email = String
}

// ❌ Bad: Dynamic generation (TypeScript: This is too hard)
function createSchema(fields: any) {
  return Struct(fields)  // Lost type safety, bugs are laughing
}
```

### 2. Create Dedicated Schemas for Different Scenarios

```typescript
// ✅ Good: Dedicated Schema for each scenario (each has its role)
const UserRegistration = pickObject(User, ['email', 'password'])
const UserLogin = pickObject(User, ['email', 'password'])
const UserProfile = omitObject(User, ['password'])

// ❌ Bad: One Schema trying to fit all scenarios (exhausting)
class UniversalUser extends ObjectType {
  // 100 fields, 99 Optional
  // The maintainer will hate you
}
```

### 3. Schema Only Handles Data Format, Separate Business Logic

```typescript
// ✅ Good: Schema only handles format (focus on doing one thing well)
class EmailType extends ValidatorType<string> {
  validate(input: unknown) {
    // Only validate email format
    if (!isValidEmailFormat(input)) {
      return this.Err('Invalid email format')
    }
    return this.Ok(input)
  }
}

// Business logic in service layer (its job to worry about)
async function registerUser(data: UserInput) {
  // Schema validation
  const validation = Validator.validate(UserRegistration, data)
  if (validation.isErr) throw new Error(validation.value.message)
  
  // Business logic
  if (await emailExists(data.email)) {
    throw new Error('Email already registered (try another one)')
  }
  
  return await createUser(data)
}
```

---

## Next Steps

Congratulations! You've now mastered the essence of farrow-schema. Time to conquer the world (at least your projects):

1. Check [API Reference](/api/farrow-schema) - Learn about all available APIs (every tool in the toolbox)
2. Start using farrow-schema in your projects (don't forget to give a star ⭐)

Remember: **Good Schema design makes bugs have nowhere to hide and makes colleagues look at you with new respect!**

**Start using farrow-schema to make your TypeScript projects more type-safe!** 🚀

*P.S. If this library helped you, remember to buy the author a coffee ☕ (though the author might need sleep more)*