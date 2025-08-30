# farrow-schema API 参考

farrow-schema 是一个强大的 Schema 定义和验证系统，提供运行时类型验证和 TypeScript 类型推导能力。

## 安装

```bash
npm install farrow-schema
```

## 基础类型

### Primitives 基础类型

#### String - 字符串类型

```typescript
import { String } from 'farrow-schema'

const nameSchema = String
const result = String.safeParse('hello') // { success: true, output: 'hello' }
```

#### Int - 整数类型

```typescript
import { Int } from 'farrow-schema'

const ageSchema = Int
const result = Int.safeParse(25) // { success: true, output: 25 }
const error = Int.safeParse(25.5) // { success: false, error: ValidationError }
```

#### Float - 浮点数类型

```typescript
import { Float } from 'farrow-schema'

const priceSchema = Float
const result = Float.safeParse(19.99) // { success: true, output: 19.99 }
```

#### Number - 数字类型（整数和浮点数）

```typescript
import { Number } from 'farrow-schema'

const numberSchema = Number
const result1 = Number.safeParse(42) // { success: true, output: 42 }
const result2 = Number.safeParse(3.14) // { success: true, output: 3.14 }
```

#### Boolean - 布尔类型

```typescript
import { Boolean } from 'farrow-schema'

const activeSchema = Boolean
const result = Boolean.safeParse(true) // { success: true, output: true }
```

#### Date - 日期类型

```typescript
import { Date } from 'farrow-schema'

const timestampSchema = Date
const result = Date.safeParse(new Date()) // { success: true, output: Date }
const result2 = Date.safeParse('2023-12-25') // 自动转换为 Date 对象
```

#### JSON - JSON 类型

```typescript
import { JSON } from 'farrow-schema'

const dataSchema = JSON
const result = JSON.safeParse({ key: 'value' }) // 接受任何可序列化的值
```

#### ID - 标识符类型

```typescript
import { ID } from 'farrow-schema'

const userIdSchema = ID
const result = ID.safeParse('user_123') // { success: true, output: 'user_123' }
// ID 本质上是非空字符串
```

### 字面量类型

#### Literal - 精确值匹配

```typescript
import { Literal } from 'farrow-schema'

const statusSchema = Literal('active')
const themeSchema = Literal('dark')
const countSchema = Literal(42)

// 使用示例
const result1 = statusSchema.safeParse('active') // 成功
const result2 = statusSchema.safeParse('inactive') // 失败
```

## 复合类型

### ObjectType - 对象类型

#### 基础用法

```typescript
import { ObjectType, String, Int } from 'farrow-schema'

class User extends ObjectType {
  id = Int
  name = String
  email = String
}

// 验证使用
const userData = { id: 1, name: 'Alice', email: 'alice@example.com' }
const result = User.safeParse(userData)
// result.success === true, result.output 是类型安全的 User 对象

// 获取 TypeScript 类型
type UserType = TypeOf<typeof User>
// { id: number; name: string; email: string }
```

#### 嵌套对象

```typescript
class Profile extends ObjectType {
  bio = String
  avatar = String
  social = {
    twitter: String,
    github: String
  }
}

class UserWithProfile extends ObjectType {
  id = Int
  name = String
  profile = Profile
}

// 使用
const user = {
  id: 1,
  name: 'Alice',
  profile: {
    bio: 'Developer',
    avatar: 'avatar.jpg',
    social: {
      twitter: '@alice',
      github: 'alice'
    }
  }
}
```

#### 可选字段和可空字段

```typescript
import { Optional, Nullable } from 'farrow-schema'

class User extends ObjectType {
  id = Int
  name = String
  bio = Optional(String)           // string | undefined
  lastLogin = Nullable(Date)       // Date | null
  metadata = Optional(Nullable(JSON))  // any | null | undefined
}
```

### List - 数组类型

```typescript
import { List, String, Int } from 'farrow-schema'

// 基础数组
const numbersSchema = List(Int)
const tagsSchema = List(String)

// 对象数组
const usersSchema = List(User)

// 嵌套数组
const matrixSchema = List(List(Int)) // number[][]

// 使用示例
const numbers = [1, 2, 3, 4, 5]
const result = numbersSchema.safeParse(numbers) // 成功

const users = [
  { id: 1, name: 'Alice', email: 'alice@example.com' },
  { id: 2, name: 'Bob', email: 'bob@example.com' }
]
const usersResult = usersSchema.safeParse(users) // 成功
```

### Struct - 结构体类型

```typescript
import { Struct, String, Int } from 'farrow-schema'

// 使用对象字面量定义结构
const UserStruct = Struct({
  id: Int,
  name: String,
  email: String
})

// 获取类型
type UserStructType = TypeOf<typeof UserStruct>
// { id: number; name: string; email: string }

// ObjectType vs Struct
// ObjectType: 类语法，适合复杂的继承场景
// Struct: 对象字面量，更轻量级，适合简单结构
```

### Union - 联合类型

#### 基础联合类型

```typescript
import { Union, Literal, String, Int } from 'farrow-schema'

// 字面量联合
const StatusSchema = Union([
  Literal('pending'),
  Literal('approved'),
  Literal('rejected')
])

// 混合类型联合
const ValueSchema = Union([String, Int, Boolean])

// 类型推导
type Status = TypeOf<typeof StatusSchema> // 'pending' | 'approved' | 'rejected'
type Value = TypeOf<typeof ValueSchema>   // string | number | boolean
```

#### 判别联合（Discriminated Union）

```typescript
const ResultSchema = Union([
  Struct({
    type: Literal('success'),
    data: String
  }),
  Struct({
    type: Literal('error'),
    message: String,
    code: Int
  })
])

// 使用
const successResult = { type: 'success', data: 'Hello World' }
const errorResult = { type: 'error', message: 'Not Found', code: 404 }

type Result = TypeOf<typeof ResultSchema>
// { type: 'success'; data: string } | { type: 'error'; message: string; code: number }
```

### Tuple - 元组类型

```typescript
import { Tuple, String, Int, Boolean } from 'farrow-schema'

// 定长数组
const PointSchema = Tuple([Int, Int])           // [number, number]
const PersonSchema = Tuple([String, Int])       // [string, number]
const ConfigSchema = Tuple([String, Int, Boolean]) // [string, number, boolean]

// 使用示例
const point = [10, 20]
const result = PointSchema.safeParse(point) // { success: true, output: [10, 20] }

type Point = TypeOf<typeof PointSchema> // [number, number]
```

### Record - 记录类型

```typescript
import { Record, String, Int } from 'farrow-schema'

// 键值对结构
const ScoresSchema = Record(String, Int) // Record<string, number>
const ConfigSchema = Record(String, String) // Record<string, string>

// 使用示例
const scores = {
  alice: 95,
  bob: 87,
  charlie: 92
}

const result = ScoresSchema.safeParse(scores) // 成功
type Scores = TypeOf<typeof ScoresSchema> // Record<string, number>
```

## 修饰符和工具

### Optional - 可选类型

```typescript
import { Optional, String, Int } from 'farrow-schema'

const optionalName = Optional(String)    // string | undefined
const optionalAge = Optional(Int)        // number | undefined

class User extends ObjectType {
  id = Int
  name = String
  bio = Optional(String)  // 可选字段
}
```

### Nullable - 可空类型

```typescript
import { Nullable, String, Date } from 'farrow-schema'

const nullableName = Nullable(String)       // string | null
const nullableDate = Nullable(Date)         // Date | null

class Post extends ObjectType {
  title = String
  publishedAt = Nullable(Date)  // 可能为 null 的发布时间
}
```

### Readonly - 只读类型

```typescript
import { Readonly, String, Int } from 'farrow-schema'

const readonlyUser = Readonly(Struct({
  id: Int,
  name: String
}))

type ReadonlyUserType = TypeOf<typeof readonlyUser>
// { readonly id: number; readonly name: string }
```

### Strict - 严格模式

```typescript
import { Strict, Struct, String, Int } from 'farrow-schema'

// 不允许额外字段
const StrictUser = Strict(Struct({
  id: Int,
  name: String
}))

// 这将失败 - 包含额外的 email 字段
const result = StrictUser.safeParse({
  id: 1,
  name: 'Alice',
  email: 'alice@example.com' // 多余字段
})
```

### NonEmpty - 非空类型

```typescript
import { NonEmpty, String, List } from 'farrow-schema'

const nonEmptyString = NonEmpty(String)    // 非空字符串
const nonEmptyList = NonEmpty(List(Int))   // 非空数组

// 使用示例
nonEmptyString.safeParse('')       // 失败
nonEmptyString.safeParse('hello')  // 成功

nonEmptyList.safeParse([])         // 失败
nonEmptyList.safeParse([1, 2, 3])  // 成功
```

## Schema 操作工具

### pickStruct() - 选择字段

```typescript
import { pickStruct } from 'farrow-schema'

class User extends ObjectType {
  id = Int
  name = String
  email = String
  password = String
  createdAt = Date
}

// 选择特定字段
const PublicUser = pickStruct(User, ['id', 'name', 'email'])
// { id: number; name: string; email: string }

const UserSummary = pickStruct(User, ['id', 'name'])
// { id: number; name: string }
```

### omitStruct() - 排除字段

```typescript
import { omitStruct } from 'farrow-schema'

// 排除敏感字段
const SafeUser = omitStruct(User, ['password'])
// { id: number; name: string; email: string; createdAt: Date }

const PublicUser = omitStruct(User, ['password', 'email'])
// { id: number; name: string; createdAt: Date }
```

### partialStruct() - 可选化所有字段

```typescript
import { partialStruct } from 'farrow-schema'

// 更新时的部分数据
const UpdateUser = partialStruct(User)
// { id?: number; name?: string; email?: string; password?: string; createdAt?: Date }

// 使用场景：PATCH 请求
const updateData = { name: 'New Name' } // 只更新名称
const result = UpdateUser.safeParse(updateData) // 成功
```

### requiredStruct() - 必需化所有字段

```typescript
import { requiredStruct } from 'farrow-schema'

class PartialUser extends ObjectType {
  id = Optional(Int)
  name = Optional(String)
  email = Optional(String)
}

// 强制所有字段必需
const RequiredUser = requiredStruct(PartialUser)
// { id: number; name: string; email: string }
```

### intersectStruct() - 合并结构

```typescript
import { intersectStruct } from 'farrow-schema'

const BaseUser = Struct({
  id: Int,
  name: String
})

const UserExtension = Struct({
  email: String,
  createdAt: Date
})

// 合并两个结构
const FullUser = intersectStruct([BaseUser, UserExtension])
// { id: number; name: string; email: string; createdAt: Date }
```

## 验证系统

### 基础验证方法

#### safeParse() - 安全解析

```typescript
const result = schema.safeParse(input)

if (result.success) {
  // 验证成功
  console.log(result.output) // 类型安全的结果
} else {
  // 验证失败
  console.error(result.error.message)
  console.error(result.error.path) // 错误字段路径
}
```

#### parse() - 直接解析（可能抛异常）

```typescript
try {
  const result = schema.parse(input) // 直接返回结果或抛出异常
  console.log(result)
} catch (error) {
  console.error('验证失败:', error.message)
}
```

### 验证错误处理

#### ValidationError 结构

```typescript
interface ValidationError {
  message: string                    // 错误描述
  path: (string | number)[]         // 错误路径 ['user', 'profile', 'email']
  expected: any                     // 期望的类型
  actual: any                       // 实际收到的值
  issues: ValidationIssue[]         // 详细错误列表
}

// 实际使用
const userSchema = Struct({
  profile: Struct({
    email: String
  })
})

const result = userSchema.safeParse({
  profile: { email: 123 } // 类型错误
})

if (!result.success) {
  console.log(result.error.path)     // ['profile', 'email']
  console.log(result.error.message)  // 'Expected string, received number'
  console.log(result.error.actual)   // 123
}
```

### 自定义验证器

#### 创建自定义 Schema

```typescript
import { SchemaCtor } from 'farrow-schema'

// 邮箱验证器
const Email = SchemaCtor((input: unknown) => {
  if (typeof input !== 'string') {
    return { tag: 'fail', error: 'Expected string' }
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(input)) {
    return { tag: 'fail', error: 'Invalid email format' }
  }
  
  return { tag: 'success', output: input.toLowerCase() }
})

// 范围验证器
const Range = (min: number, max: number) => 
  SchemaCtor((input: unknown) => {
    if (typeof input !== 'number') {
      return { tag: 'fail', error: 'Expected number' }
    }
    
    if (input < min || input > max) {
      return { tag: 'fail', error: `Number must be between ${min} and ${max}` }
    }
    
    return { tag: 'success', output: input }
  })

// 使用自定义验证器
class User extends ObjectType {
  email = Email
  age = Range(0, 150)
}
```

#### 组合验证器

```typescript
// 创建可复用的验证器组合
const PositiveInt = SchemaCtor((input: unknown) => {
  const intResult = Int.safeParse(input)
  if (!intResult.success) return intResult
  
  if (intResult.output <= 0) {
    return { tag: 'fail', error: 'Must be positive' }
  }
  
  return { tag: 'success', output: intResult.output }
})

const Price = Range(0, 999999)  // 价格范围
const Quantity = PositiveInt    // 正整数数量
```

## 转换器（Transform）

### 基础转换

```typescript
import { transform } from 'farrow-schema'

// 字符串转换
const TrimmedString = transform(String, (str) => str.trim())
const UppercaseString = transform(String, (str) => str.toUpperCase())

// 数字转换
const RoundedNumber = transform(Float, (num) => Math.round(num))

// 使用
const result = TrimmedString.safeParse('  hello world  ')
// { success: true, output: 'hello world' }
```

### 复杂转换

```typescript
// 日期字符串转换
const DateFromString = transform(String, (str) => {
  const date = new Date(str)
  if (isNaN(date.getTime())) {
    throw new Error('Invalid date string')
  }
  return date
})

// JSON 字符串转换
const JSONFromString = transform(String, (str) => {
  try {
    return JSON.parse(str)
  } catch {
    throw new Error('Invalid JSON string')
  }
})

// 使用
class Event extends ObjectType {
  name = String
  date = DateFromString  // 字符串自动转为 Date
  metadata = JSONFromString  // JSON 字符串自动解析
}
```

## 类型推导

### TypeOf - 获取 TypeScript 类型

```typescript
import { TypeOf } from 'farrow-schema'

// 基础类型推导
type StringType = TypeOf<typeof String> // string
type IntType = TypeOf<typeof Int>       // number

// 复杂类型推导
class User extends ObjectType {
  id = Int
  name = String
  profile = Struct({
    bio: Optional(String),
    tags: List(String),
    settings: Record(String, Boolean)
  })
}

type UserType = TypeOf<typeof User>
/*
{
  id: number
  name: string
  profile: {
    bio?: string
    tags: string[]
    settings: Record<string, boolean>
  }
}
*/

// 联合类型推导
const StatusSchema = Union([
  Literal('active'),
  Literal('inactive'),
  Literal('pending')
])

type Status = TypeOf<typeof StatusSchema> // 'active' | 'inactive' | 'pending'
```

### 高级类型工具

#### 条件类型推导

```typescript
// 提取可选字段
type OptionalKeys<T> = {
  [K in keyof T]: T[K] extends { __type: 'optional' } ? K : never
}[keyof T]

// 提取必需字段
type RequiredKeys<T> = Exclude<keyof T, OptionalKeys<T>>

// 提取数组元素类型
type ArrayElement<T> = T extends List<infer U> ? TypeOf<U> : never
```

## 完整示例

```typescript
import {
  ObjectType,
  Struct,
  String,
  Int,
  Float,
  Boolean,
  Date,
  List,
  Union,
  Optional,
  Nullable,
  Literal,
  pickStruct,
  omitStruct,
  partialStruct,
  TypeOf,
  SchemaCtor,
  transform
} from 'farrow-schema'

// ===== 自定义验证器 =====
const Email = SchemaCtor((input: unknown) => {
  if (typeof input !== 'string') {
    return { tag: 'fail', error: 'Expected string' }
  }
  
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input)) {
    return { tag: 'fail', error: 'Invalid email format' }
  }
  
  return { tag: 'success', output: input.toLowerCase() }
})

const Username = SchemaCtor((input: unknown) => {
  if (typeof input !== 'string') {
    return { tag: 'fail', error: 'Expected string' }
  }
  
  if (input.length < 3 || input.length > 20) {
    return { tag: 'fail', error: 'Username must be 3-20 characters' }
  }
  
  if (!/^[a-zA-Z0-9_]+$/.test(input)) {
    return { tag: 'fail', error: 'Username can only contain letters, numbers, and underscores' }
  }
  
  return { tag: 'success', output: input }
})

// ===== Schema 定义 =====
const UserRole = Union([
  Literal('admin'),
  Literal('user'),
  Literal('moderator')
])

const UserSettings = Struct({
  theme: Union([Literal('light'), Literal('dark')]),
  notifications: Boolean,
  language: String
})

const UserProfile = Struct({
  firstName: String,
  lastName: String,
  bio: Optional(String),
  avatar: Optional(String),
  website: Optional(String),
  location: Optional(String)
})

class User extends ObjectType {
  id = Int
  username = Username
  email = Email
  role = UserRole
  profile = UserProfile
  settings = UserSettings
  tags = List(String)
  isActive = Boolean
  lastLoginAt = Nullable(Date)
  createdAt = Date
  updatedAt = Date
}

// ===== Schema 操作 =====
const CreateUserRequest = pickStruct(User, [
  'username',
  'email',
  'profile'
])

const UpdateUserRequest = partialStruct(
  omitStruct(User, ['id', 'createdAt', 'updatedAt'])
)

const PublicUser = omitStruct(User, ['email'])

const UserSummary = pickStruct(User, ['id', 'username', 'role', 'isActive'])

// ===== 类型推导 =====
type UserType = TypeOf<typeof User>
type CreateUserType = TypeOf<typeof CreateUserRequest>
type UpdateUserType = TypeOf<typeof UpdateUserRequest>
type PublicUserType = TypeOf<typeof PublicUser>

// ===== 实际使用 =====
const userData = {
  username: 'alice_dev',
  email: 'ALICE@EXAMPLE.COM', // 会被转换为小写
  role: 'admin',
  profile: {
    firstName: 'Alice',
    lastName: 'Johnson',
    bio: 'Full-stack developer'
  },
  settings: {
    theme: 'dark',
    notifications: true,
    language: 'en'
  },
  tags: ['typescript', 'react', 'nodejs'],
  isActive: true,
  lastLoginAt: null,
  createdAt: new Date(),
  updatedAt: new Date()
}

// 验证创建用户请求
const createResult = CreateUserRequest.safeParse({
  username: 'alice_dev',
  email: 'alice@example.com',
  profile: {
    firstName: 'Alice',
    lastName: 'Johnson'
  }
})

if (createResult.success) {
  console.log('用户数据验证成功:', createResult.output)
  // createResult.output 是类型安全的
} else {
  console.error('验证失败:', createResult.error.message)
  console.error('错误路径:', createResult.error.path)
}

// 验证更新请求（部分数据）
const updateResult = UpdateUserRequest.safeParse({
  profile: {
    bio: '资深全栈开发者'
  },
  settings: {
    theme: 'light'
  }
})

// 在 API 中使用
import { Http, Response } from 'farrow-http'

const app = Http()

app.post('/users', {
  body: CreateUserRequest
}).use((request) => {
  // request.body 已验证且类型安全
  const user = createUser(request.body)
  return Response.status(201).json(user)
})

app.put('/users/<id:int>', {
  body: UpdateUserRequest
}).use((request) => {
  // request.body 和 request.params 都是类型安全的
  const updated = updateUser(request.params.id, request.body)
  return Response.json(updated)
})

app.get('/users/<id:int>').use((request) => {
  const user = getUser(request.params.id)
  if (!user) {
    return Response.status(404).json({ error: 'User not found' })
  }
  
  // 返回公开信息（排除敏感字段）
  const publicUserResult = PublicUser.safeParse(user)
  return Response.json(publicUserResult.success ? publicUserResult.output : null)
})

// ===== 错误处理示例 =====
const invalidUser = {
  username: 'ab', // 太短
  email: 'not-an-email', // 无效邮箱
  profile: {
    firstName: '', // 空字符串
    // lastName 缺失
  }
}

const result = CreateUserRequest.safeParse(invalidUser)
if (!result.success) {
  console.log('详细错误信息:')
  result.error.issues.forEach(issue => {
    console.log(`- ${issue.path.join('.')}: ${issue.message}`)
  })
  /*
  输出:
  - username: Username must be 3-20 characters
  - email: Invalid email format  
  - profile.firstName: String cannot be empty
  - profile.lastName: Required field is missing
  */
}
```

## 最佳实践

### 1. 命名约定

```typescript
// 推荐：清晰的命名
const UserCreateRequest = Struct({ ... })
const UserUpdateRequest = partialStruct(User)
const PublicUserResponse = omitStruct(User, ['password'])

// 避免：模糊的命名
const UserData = Struct({ ... })
const UserStuff = Struct({ ... })
```

### 2. 合理使用修饰符

```typescript
// 推荐：明确语义
class User extends ObjectType {
  id = Int                    // 必需字段
  email = Email              // 必需字段
  bio = Optional(String)     // 可选字段
  deletedAt = Nullable(Date) // 可空字段（软删除）
}

// 避免：过度使用 Optional
class BadUser extends ObjectType {
  id = Optional(Int)         // ID 应该是必需的
  email = Optional(Email)    // 邮箱通常是必需的
}
```

### 3. 复用和组合

```typescript
// 推荐：创建可复用的组件
const TimestampFields = {
  createdAt: Date,
  updatedAt: Date
}

const SoftDeleteFields = {
  deletedAt: Nullable(Date)
}

class User extends ObjectType {
  id = Int
  name = String
  ...TimestampFields
  ...SoftDeleteFields
}

class Post extends ObjectType {
  id = Int
  title = String
  content = String
  ...TimestampFields
  ...SoftDeleteFields
}
```

### 4. 渐进式验证

```typescript
// 推荐：从简单到复杂
const BasicUser = Struct({
  name: String,
  email: String
})

const FullUser = intersectStruct([
  BasicUser,
  Struct({
    profile: UserProfile,
    settings: UserSettings,
    permissions: List(String)
  })
])
```

### 5. 错误处理策略

```typescript
// 推荐：统一的错误处理
function parseUserSafely(data: unknown): UserType | null {
  const result = User.safeParse(data)
  
  if (result.success) {
    return result.output
  }
  
  // 记录详细错误用于调试
  console.error('User validation failed:', {
    issues: result.error.issues,
    input: data
  })
  
  return null
}

// 在 HTTP 中使用
app.post('/users', {
  body: User
}, {
  onSchemaError: (error, input) => {
    // 返回用户友好的错误信息
    return Response.status(400).json({
      error: 'Invalid user data',
      details: error.issues.map(issue => ({
        field: issue.path.join('.'),
        message: issue.message
      }))
    })
  }
})
```

## 总结

恭喜！您已经掌握了 farrow-schema 的完整 API：

- **基础类型**: String、Int、Boolean 等基础构建块
- **复合类型**: ObjectType、List、Union 等复杂结构
- **修饰符**: Optional、Nullable、Strict 等类型修饰器
- **工具函数**: pickStruct、omitStruct 等 Schema 操作工具
- **验证系统**: 类型安全的验证和错误处理
- **类型推导**: 完整的 TypeScript 类型支持

现在您可以构建类型安全、可维护的数据验证系统了！