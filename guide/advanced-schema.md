# Schema 高级类型

Farrow Schema 提供了丰富的类型系统，让你可以精确地定义和验证数据结构。本章将深入介绍所有高级类型的用法。

## 基础类型扩展

### 数值类型

```typescript
import { Int, Float, Number } from 'farrow-schema'

// Int - 整数类型
const Age = Int
const Count = Int

// Float - 浮点数类型  
const Price = Float
const Weight = Float

// Number - 通用数字类型（包含整数和浮点数）
const Score = Number
```

### 日期和时间

```typescript
import { Date } from 'farrow-schema'

class Event extends ObjectType {
  name = String
  startTime = Date
  endTime = Date
  createdAt = Date
}

// 使用示例
const eventData = {
  name: "会议",
  startTime: new Date('2024-01-15T09:00:00Z'),
  endTime: new Date('2024-01-15T10:00:00Z'),
  createdAt: new Date()
}
```

### Any 类型

```typescript
import { Any } from 'farrow-schema'

class FlexibleConfig extends ObjectType {
  name = String
  settings = Any  // 允许任何类型的值
  metadata = Optional(Any)
}

// 可以接受任何数据
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

## 复合类型详解

### List - 数组类型

```typescript
import { List } from 'farrow-schema'

// 基础数组
const Tags = List(String)          // string[]
const Numbers = List(Int)          // number[]
const Booleans = List(Boolean)     // boolean[]

// 嵌套数组
const Matrix = List(List(Number))  // number[][]

// 对象数组
class User extends ObjectType {
  id = Int
  name = String
}

const UserList = List(User)        // User[]

// 在 ObjectType 中使用
class Post extends ObjectType {
  title = String
  content = String
  tags = List(String)
  authors = List(User)
  comments = Optional(List(String))
}
```

### Optional - 可选类型

```typescript
import { Optional } from 'farrow-schema'

class UserProfile extends ObjectType {
  // 必需字段
  id = Int
  email = String
  
  // 可选字段
  nickname = Optional(String)    // string | undefined
  avatar = Optional(String)      // string | undefined
  age = Optional(Int)            // number | undefined
  
  // 可选的复杂类型
  preferences = Optional(ObjectType.create({
    theme = String,
    language = String
  }))
  
  // 可选数组
  hobbies = Optional(List(String))  // string[] | undefined
}
```

### Nullable - 可空类型

```typescript
import { Nullable } from 'farrow-schema'

class DatabaseRecord extends ObjectType {
  id = Int
  name = String
  
  // 可以是 null 的字段
  deletedAt = Nullable(Date)     // Date | null
  lastLogin = Nullable(Date)     // Date | null
  
  // 与 Optional 的区别
  description = Optional(String)  // string | undefined (字段可以不存在)
  notes = Nullable(String)       // string | null (字段存在但值可以是 null)
}

// 使用示例
const record = {
  id: 1,
  name: "用户",
  deletedAt: null,           // 明确设为 null
  lastLogin: new Date(),
  // description 字段不存在
  notes: null                // 明确设为 null
}
```

### Record - 映射类型

```typescript
import { Record } from 'farrow-schema'

// 基础 Record
const StringMap = Record(String, String)    // { [key: string]: string }
const NumberMap = Record(String, Number)    // { [key: string]: number }

// 复杂的 Record
class Permission extends ObjectType {
  read = Boolean
  write = Boolean
  admin = Boolean
}

const UserPermissions = Record(String, Permission)  // { [username: string]: Permission }

// 在实际应用中使用
class Application extends ObjectType {
  name = String
  version = String
  
  // 配置映射
  config = Record(String, Any)                    // { [key: string]: any }
  
  // 用户权限映射
  permissions = Record(String, Permission)        // { [username: string]: Permission }
  
  // 多语言支持
  translations = Record(String, Record(String, String))  // { [lang: string]: { [key: string]: string } }
}
```

### Tuple - 元组类型

```typescript
import { Tuple } from 'farrow-schema'

// 基础元组
const Point2D = Tuple(Number, Number)           // [number, number]
const Point3D = Tuple(Number, Number, Number)   // [number, number, number]
const RGBColor = Tuple(Int, Int, Int)           // [number, number, number]

// 混合类型元组
const UserAction = Tuple(String, Date, Boolean) // [string, Date, boolean]
// 例如：["login", new Date(), true]

// 在 ObjectType 中使用
class GeographicData extends ObjectType {
  location = Point2D        // [latitude, longitude]
  color = RGBColor          // [r, g, b]
  bounds = Tuple(Point2D, Point2D)  // [[x1, y1], [x2, y2]]
}
```

## 结构化类型

### ObjectType 详解

```typescript
import { ObjectType } from 'farrow-schema'

// 基础 ObjectType
class User extends ObjectType {
  id = Int
  name = String
  email = String
}

// 嵌套 ObjectType
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
  address = Address        // 嵌套对象
  workAddress = Optional(Address)  // 可选的嵌套对象
}

// 自引用 ObjectType
class TreeNode extends ObjectType {
  id = Int
  name = String
  parent = Optional(TreeNode)      // 父节点
  children = List(TreeNode)        // 子节点列表
}
```

### Struct 快速构建

```typescript
import { Struct } from 'farrow-schema'

// 使用 Struct 快速定义结构
const UserStruct = Struct({
  id: Int,
  name: String,
  email: String,
  isActive: Boolean
})

// 嵌套 Struct
const PostStruct = Struct({
  id: Int,
  title: String,
  content: String,
  author: UserStruct,           // 嵌套结构
  tags: List(String),
  createdAt: Date,
  metadata: Optional(Struct({   // 可选的嵌套结构
    views: Int,
    likes: Int,
    category: String
  }))
})

// ObjectType vs Struct
// ObjectType - 用于定义可复用的类
// Struct - 用于快速定义一次性的结构
```

## 联合与交集类型

### Union - 联合类型

```typescript
import { Union, Literal } from 'farrow-schema'

// 枚举联合类型
const Status = Union(
  Literal('draft'),
  Literal('published'),
  Literal('archived')
)

// 有判别字段的联合类型
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

// 复杂的联合类型
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

// 在路由中使用联合类型
app.post('/shapes', { body: Shape }).use((request) => {
  const shape = request.body
  
  // TypeScript 自动类型窄化
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

### Intersect - 交集类型

```typescript
import { Intersect } from 'farrow-schema'

// 基础用法
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

// 合并多个类型
const FullUser = Intersect(UserInfo, ContactInfo, TimestampInfo)
// 结果: { id: number, name: string, email: string, phone?: string, createdAt: Date, updatedAt?: Date }

// 实际使用场景
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

### Literal - 字面量类型

```typescript
import { Literal } from 'farrow-schema'

// 字符串字面量
const Environment = Union(
  Literal('development'),
  Literal('staging'),
  Literal('production')
)

// 数字字面量
const HTTPStatus = Union(
  Literal(200),
  Literal(404),
  Literal(500)
)

// 布尔字面量
const FeatureFlag = Struct({
  name: String,
  enabled: Literal(true),  // 只能是 true
  version: Literal(1)      // 只能是 1
})

// 混合字面量类型
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

## 自定义验证器

### ValidatorType 基础

```typescript
import { ValidatorType } from 'farrow-schema'

// 简单验证器
const Email = ValidatorType.create({
  name: 'Email',
  validator: (input: unknown): input is string => {
    return typeof input === 'string' && 
           /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input)
  }
})

// 带参数的验证器
const MinLength = (min: number) => ValidatorType.create({
  name: `MinLength(${min})`,
  validator: (input: unknown): input is string => {
    return typeof input === 'string' && input.length >= min
  }
})

// 数值范围验证器
const Range = (min: number, max: number) => ValidatorType.create({
  name: `Range(${min}, ${max})`,
  validator: (input: unknown): input is number => {
    return typeof input === 'number' && 
           input >= min && 
           input <= max
  }
})
```

### 业务逻辑验证器

```typescript
// 异步验证器
const UniqueUsername = ValidatorType.create({
  name: 'UniqueUsername',
  validator: async (input: unknown): Promise<input is string> => {
    if (typeof input !== 'string') return false
    
    // 模拟数据库查询
    const exists = await checkUsernameExists(input)
    return !exists
  }
})

// 复杂业务逻辑验证器
const ValidCreditCard = ValidatorType.create({
  name: 'ValidCreditCard',
  validator: (input: unknown): input is string => {
    if (typeof input !== 'string') return false
    
    // 移除空格和连字符
    const cardNumber = input.replace(/[\s-]/g, '')
    
    // 长度检查
    if (cardNumber.length < 13 || cardNumber.length > 19) return false
    
    // Luhn 算法验证
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

### 条件验证器

```typescript
// 根据其他字段的值进行验证
const ConditionalValidator = ValidatorType.create({
  name: 'ConditionalValidator',
  validator: (input: unknown, context?: any): input is any => {
    if (!context || typeof input !== 'object' || !input) return false
    
    const obj = input as any
    
    // 如果用户类型是 'admin'，必须有 permissions 字段
    if (obj.type === 'admin') {
      return Array.isArray(obj.permissions) && obj.permissions.length > 0
    }
    
    // 如果用户类型是 'guest'，不能有 permissions 字段
    if (obj.type === 'guest') {
      return !obj.permissions
    }
    
    return true
  }
})

// 在 Schema 中使用
class UserRegistration extends ObjectType {
  username = String
  email = Email
  password = MinLength(8)
  age = Range(18, 120)
  type = Union(Literal('admin'), Literal('user'), Literal('guest'))
}
```

## 实际应用示例

### 电商系统 Schema

```typescript
// 商品 Schema
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

// 订单 Schema
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

### API 响应 Schema

```typescript
// 统一的 API 响应格式
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

// 使用工厂函数创建特定的响应 Schema
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

// 在路由中使用
app.get('/users').use(async () => {
  const users = await getUsers()
  
  // 返回的数据会自动符合 UserListResponse 的结构
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

Farrow Schema 的类型系统非常强大，通过组合这些基础类型，你可以构建出精确描述任何数据结构的 Schema，并享受完整的类型安全和运行时验证。