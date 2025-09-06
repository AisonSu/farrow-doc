# Advanced Schema Types

Farrow Schema provides a rich type system that allows you to precisely define and validate data structures. This chapter will dive deep into all advanced types.

## Extended Basic Types

### Numeric Types

```typescript
import { Int, Float, Number } from 'farrow-schema'

// Int - integer type
const Age = Int
const Count = Int

// Float - floating point type  
const Price = Float
const Weight = Float

// Number - general numeric type (includes integers and floats)
const Score = Number
```

### Date and Time

```typescript
import { Date } from 'farrow-schema'

class Event extends ObjectType {
  name = String
  startTime = Date
  endTime = Date
  createdAt = Date
}

// Usage example
const eventData = {
  name: "Meeting",
  startTime: new Date('2024-01-15T09:00:00Z'),
  endTime: new Date('2024-01-15T10:00:00Z'),
  createdAt: new Date()
}
```

### Any Type

```typescript
import { Any } from 'farrow-schema'

class FlexibleConfig extends ObjectType {
  name = String
  settings = Any  // allows any type of value
  metadata = Optional(Any)
}

// Can accept any data
const config = {
  name: "app-config",
  settings: {
    theme: "dark",
    notifications: true,
    customData: [1, 2, 3]
  },
  metadata: { version: "1.0" }
}
```

## Composite Types Explained

### List - Array Type

```typescript
import { List } from 'farrow-schema'

// Basic arrays
const Tags = List(String)          // string[]
const Numbers = List(Int)          // number[]
const Booleans = List(Boolean)     // boolean[]

// Nested arrays
const Matrix = List(List(Number))  // number[][]

// Object arrays
class User extends ObjectType {
  id = Int
  name = String
}

const UserList = List(User)        // User[]

// Using in ObjectType
class Post extends ObjectType {
  title = String
  content = String
  tags = List(String)
  authors = List(User)
  comments = Optional(List(String))
}
```

### Optional - Optional Type

```typescript
import { Optional } from 'farrow-schema'

class UserProfile extends ObjectType {
  // Required fields
  id = Int
  email = String
  
  // Optional fields
  nickname = Optional(String)    // string | undefined
  avatar = Optional(String)      // string | undefined
  age = Optional(Int)            // number | undefined
  
  // Optional complex types
  preferences = Optional(ObjectType.create({
    theme = String,
    language = String
  }))
  
  // Optional arrays
  hobbies = Optional(List(String))  // string[] | undefined
}
```

### Nullable - Nullable Type

```typescript
import { Nullable } from 'farrow-schema'

class DatabaseRecord extends ObjectType {
  id = Int
  name = String
  
  // Fields that can be null
  deletedAt = Nullable(Date)     // Date | null
  lastLogin = Nullable(Date)     // Date | null
  
  // Difference from Optional
  description = Optional(String)  // string | undefined (field may not exist)
  notes = Nullable(String)       // string | null (field exists but value can be null)
}

// Usage example
const record = {
  id: 1,
  name: "User",
  deletedAt: null,           // explicitly set to null
  lastLogin: new Date(),
  // description field doesn't exist
  notes: null                // explicitly set to null
}
```

### Record - Map Type

```typescript
import { Record } from 'farrow-schema'

// Basic Record
const StringMap = Record(String, String)    // { [key: string]: string }
const NumberMap = Record(String, Number)    // { [key: string]: number }

// Complex Record
class Permission extends ObjectType {
  read = Boolean
  write = Boolean
  admin = Boolean
}

const UserPermissions = Record(String, Permission)  // { [username: string]: Permission }

// In practical applications
class Application extends ObjectType {
  name = String
  version = String
  
  // Configuration mapping
  config = Record(String, Any)                    // { [key: string]: any }
  
  // User permissions mapping
  permissions = Record(String, Permission)        // { [username: string]: Permission }
  
  // Multi-language support
  translations = Record(String, Record(String, String))  // { [lang: string]: { [key: string]: string } }
}
```

### Tuple - Tuple Type

```typescript
import { Tuple } from 'farrow-schema'

// Basic tuples
const Point2D = Tuple(Number, Number)           // [number, number]
const Point3D = Tuple(Number, Number, Number)   // [number, number, number]
const RGBColor = Tuple(Int, Int, Int)           // [number, number, number]

// Mixed type tuples
const UserAction = Tuple(String, Date, Boolean) // [string, Date, boolean]
// Example: ["login", new Date(), true]

// Using in ObjectType
class GeographicData extends ObjectType {
  location = Point2D        // [latitude, longitude]
  color = RGBColor          // [r, g, b]
  bounds = Tuple(Point2D, Point2D)  // [[x1, y1], [x2, y2]]
}
```

## Structured Types

### ObjectType Explained

```typescript
import { ObjectType } from 'farrow-schema'

// Basic ObjectType
class User extends ObjectType {
  id = Int
  name = String
  email = String
}

// Nested ObjectType
class Address extends ObjectType {
  street = String
  city = String
  zipCode = String
  country = String
}

class UserWithAddress extends ObjectType {
  id = Int
  name = String
  email = String
  address = Address        // nested object
  workAddress = Optional(Address)  // optional nested object
}

// Self-referencing ObjectType
class TreeNode extends ObjectType {
  id = Int
  name = String
  parent = Optional(TreeNode)      // parent node
  children = List(TreeNode)        // child node list
}
```

### Struct Quick Build

```typescript
import { Struct } from 'farrow-schema'

// Use Struct to quickly define structures
const UserStruct = Struct({
  id: Int,
  name: String,
  email: String,
  isActive: Boolean
})

// Nested Struct
const PostStruct = Struct({
  id: Int,
  title: String,
  content: String,
  author: UserStruct,           // nested structure
  tags: List(String),
  createdAt: Date,
  metadata: Optional(Struct({   // optional nested structure
    views: Int,
    likes: Int,
    category: String
  }))
})

// ObjectType vs Struct
// ObjectType - for defining reusable classes
// Struct - for quickly defining one-off structures
```

## Union and Intersection Types

### Union - Union Type

```typescript
import { Union, Literal } from 'farrow-schema'

// Enum union type
const Status = Union(
  Literal('draft'),
  Literal('published'),
  Literal('archived')
)

// Union type with discriminating field
const Shape = Union(
  {
    type: Literal('circle'),
    radius: Number
  },
  {
    type: Literal('rectangle'),
    width: Number,
    height: Number
  },
  {
    type: Literal('triangle'),
    base: Number,
    height: Number
  }
)

// Complex union type
const APIResponse = Union(
  {
    success: Literal(true),
    data: Any,
    timestamp: Date
  },
  {
    success: Literal(false),
    error: String,
    code: Int,
    timestamp: Date
  }
)

// Using union types in routes
app.post('/shapes', { body: Shape }).use((request) => {
  const shape = request.body
  
  // TypeScript automatic type narrowing
  switch (shape.type) {
    case 'circle':
      const area = Math.PI * shape.radius * shape.radius
      return Response.json({ area, type: 'circle' })
    
    case 'rectangle':
      const rectArea = shape.width * shape.height
      return Response.json({ area: rectArea, type: 'rectangle' })
    
    case 'triangle':
      const triArea = 0.5 * shape.base * shape.height
      return Response.json({ area: triArea, type: 'triangle' })
  }
})
```

### Intersect - Intersection Type

```typescript
import { Intersect } from 'farrow-schema'

// Basic usage
class UserInfo extends ObjectType {
  id = Int
  name = String
}

class ContactInfo extends ObjectType {
  email = String
  phone = Optional(String)
}

class TimestampInfo extends ObjectType {
  createdAt = Date
  updatedAt = Optional(Date)
}

// Merge multiple types
const FullUser = Intersect(UserInfo, ContactInfo, TimestampInfo)
// Result: { id: number, name: string, email: string, phone?: string, createdAt: Date, updatedAt?: Date }

// Practical usage scenarios
const UserCreateInput = Intersect(
  UserInfo,
  ContactInfo,
  Struct({ password: String })
)

const UserUpdateInput = Intersect(
  Partial(UserInfo),
  Partial(ContactInfo)
)
```

### Literal - Literal Type

```typescript
import { Literal } from 'farrow-schema'

// String literals
const Environment = Union(
  Literal('development'),
  Literal('staging'),
  Literal('production')
)

// Number literals
const HTTPStatus = Union(
  Literal(200),
  Literal(404),
  Literal(500)
)

// Boolean literals
const FeatureFlag = Struct({
  name: String,
  enabled: Literal(true),  // can only be true
  version: Literal(1)      // can only be 1
})

// Mixed literal types
const EventType = Union(
  {
    type: Literal('user_action'),
    action: Union(Literal('click'), Literal('scroll')),
    timestamp: Date
  },
  {
    type: Literal('system_event'),
    level: Union(Literal('info'), Literal('warn'), Literal('error')),
    message: String
  }
)
```

## Custom Validators

### ValidatorType Basics

```typescript
import { ValidatorType } from 'farrow-schema'

// Simple validator
const Email = ValidatorType.create({
  name: 'Email',
  validator: (input: unknown): input is string => {
    return typeof input === 'string' && 
           /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input)
  }
})

// Parameterized validator
const MinLength = (min: number) => ValidatorType.create({
  name: `MinLength(${min})`,
  validator: (input: unknown): input is string => {
    return typeof input === 'string' && input.length >= min
  }
})

// Numeric range validator
const Range = (min: number, max: number) => ValidatorType.create({
  name: `Range(${min}, ${max})`,
  validator: (input: unknown): input is number => {
    return typeof input === 'number' && 
           input >= min && 
           input <= max
  }
})
```

### Business Logic Validators

```typescript
// Async validator
const UniqueUsername = ValidatorType.create({
  name: 'UniqueUsername',
  validator: async (input: unknown): Promise<input is string> => {
    if (typeof input !== 'string') return false
    
    // Simulate database query
    const exists = await checkUsernameExists(input)
    return !exists
  }
})

// Complex business logic validator
const ValidCreditCard = ValidatorType.create({
  name: 'ValidCreditCard',
  validator: (input: unknown): input is string => {
    if (typeof input !== 'string') return false
    
    // Remove spaces and dashes
    const cardNumber = input.replace(/[\s-]/g, '')
    
    // Length check
    if (cardNumber.length < 13 || cardNumber.length > 19) return false
    
    // Luhn algorithm validation
    let sum = 0
    let alternate = false
    
    for (let i = cardNumber.length - 1; i >= 0; i--) {
      let digit = parseInt(cardNumber.charAt(i))
      
      if (alternate) {
        digit *= 2
        if (digit > 9) digit = (digit % 10) + 1
      }
      
      sum += digit
      alternate = !alternate
    }
    
    return sum % 10 === 0
  }
})
```

### Conditional Validators

```typescript
// Validate based on other field values
const ConditionalValidator = ValidatorType.create({
  name: 'ConditionalValidator',
  validator: (input: unknown, context?: any): input is any => {
    if (!context || typeof input !== 'object' || !input) return false
    
    const obj = input as any
    
    // If user type is 'admin', must have permissions field
    if (obj.type === 'admin') {
      return Array.isArray(obj.permissions) && obj.permissions.length > 0
    }
    
    // If user type is 'guest', cannot have permissions field
    if (obj.type === 'guest') {
      return !obj.permissions
    }
    
    return true
  }
})

// Using in Schema
class UserRegistration extends ObjectType {
  username = String
  email = Email
  password = MinLength(8)
  age = Range(18, 120)
  type = Union(Literal('admin'), Literal('user'), Literal('guest'))
}
```

## Practical Application Example

### E-commerce System Schema

```typescript
// Product Schema
const ProductStatus = Union(
  Literal('available'),
  Literal('out_of_stock'),
  Literal('discontinued')
)

const ProductCategory = Union(
  Literal('electronics'),
  Literal('clothing'),
  Literal('books'),
  Literal('home')
)

class Product extends ObjectType {
  id = Int
  name = String
  description = String
  price = Float
  currency = Union(Literal('USD'), Literal('EUR'), Literal('CNY'))
  status = ProductStatus
  category = ProductCategory
  tags = List(String)
  images = List(String)
  inventory = Int
  createdAt = Date
  updatedAt = Optional(Date)
}

// Order Schema
const OrderStatus = Union(
  Literal('pending'),
  Literal('paid'),
  Literal('shipped'),
  Literal('delivered'),
  Literal('cancelled')
)

class OrderItem extends ObjectType {
  productId = Int
  quantity = Int
  price = Float
}

class ShippingAddress extends ObjectType {
  street = String
  city = String
  state = String
  zipCode = String
  country = String
}

class Order extends ObjectType {
  id = Int
  userId = Int
  items = List(OrderItem)
  totalAmount = Float
  currency = String
  status = OrderStatus
  shippingAddress = ShippingAddress
  paymentMethod = Union(
    { type: Literal('credit_card'), last4: String },
    { type: Literal('paypal'), email: String },
    { type: Literal('bank_transfer'), account: String }
  )
  createdAt = Date
  updatedAt = Optional(Date)
}
```

### API Response Schema

```typescript
// Unified API response format
const createApiResponse = <T>(dataSchema: T) => {
  return Union(
    {
      success: Literal(true),
      data: dataSchema,
      timestamp: Date,
      requestId: String
    },
    {
      success: Literal(false),
      error: String,
      code: String,
      details: Optional(Any),
      timestamp: Date,
      requestId: String
    }
  )
}

// Use factory function to create specific response Schema
const UserListResponse = createApiResponse(
  Struct({
    users: List(User),
    pagination: Struct({
      page: Int,
      limit: Int,
      total: Int,
      hasMore: Boolean
    })
  })
)

const UserResponse = createApiResponse(User)

// Using in routes
app.get('/users').use(async () => {
  const users = await getUsers()
  
  // Returned data will automatically conform to UserListResponse structure
  return Response.json({
    success: true,
    data: {
      users,
      pagination: {
        page: 1,
        limit: 10,
        total: users.length,
        hasMore: false
      }
    },
    timestamp: new Date(),
    requestId: generateRequestId()
  })
})
```

Farrow Schema's type system is very powerful. By composing these basic types, you can build Schemas that precisely describe any data structure, enjoying complete type safety and runtime validation.