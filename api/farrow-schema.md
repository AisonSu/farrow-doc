# farrow-schema 用户 API 参考

## 概述

farrow-schema 是一个强大的 TypeScript 类型验证和序列化库。通过类型驱动设计，让你轻松定义数据结构、验证输入、处理错误。

## 目录

- [Schema 构造器](#schema-构造器)
  - [基础类型](#基础类型)
    - [String - 字符串类型](#string---字符串类型)
    - [Number - 数值类型](#number---数值类型)
    - [Boolean - 布尔类型](#boolean---布尔类型)
    - [Date - 日期类型](#date---日期类型)
    - [ID - 标识符类型](#id---标识符类型)
  - [复合类型](#复合类型)
    - [List - 数组类型](#list---数组类型)
    - [Optional - 可选类型](#optional---可选类型)
    - [Nullable - 可空类型](#nullable---可空类型)
    - [Record - 键值对类型](#record---键值对类型)
    - [Tuple - 元组类型](#tuple---元组类型)
  - [结构化类型](#结构化类型)
    - [ObjectType - 结构化对象](#objecttype---结构化对象)
    - [Struct - 快速构建](#struct---快速构建)
  - [联合与交集](#联合与交集)
    - [Union - 或逻辑](#union---或逻辑)
    - [Intersect - 且逻辑](#intersect---且逻辑)
    - [Literal - 字面量类型](#literal---字面量类型)
- [Schema 操作](#schema-操作)
  - [类型推导](#类型推导)
    - [TypeOf - 提取 TypeScript 类型](#typeof---提取-typescript-类型)
  - [字段选择与变换](#字段选择与变换)
    - [pickObject - 选择 ObjectType 字段](#pickobject---选择-objecttype-字段)
    - [omitObject - 排除 ObjectType 字段](#omitobject---排除-objecttype-字段)
    - [pickStruct - 选择 Struct 字段](#pickstruct---选择-struct-字段)
    - [omitStruct - 排除 Struct 字段](#omitstruct---排除-struct-字段)
    - [partial - 转为可选字段](#partial---转为可选字段)
    - [required - 转为必填字段](#required---转为必填字段)
- [验证系统](#验证系统)
  - [内置验证器](#内置验证器)
    - [createSchemaValidator - 创建专用验证器](#createschemavalidator---创建专用验证器)
  - [自定义验证器](#自定义验证器)
    - [ValidatorType - 验证器基类](#validatortype---验证器基类)
- [错误处理](#错误处理)
- [实用示例](#实用示例)

## 快速开始

```typescript
import { ObjectType, String, Number, List } from 'farrow-schema'
import { Validator } from 'farrow-schema/validator'

// 定义用户 Schema
class User extends ObjectType {
  name = String
  age = Number
  tags = List(String)
}

// 验证数据
const result = Validator.validate(User, {
  name: "张三",
  age: 25,
  tags: ["开发者", "TypeScript"]
})

if (result.isOk) {
  console.log("验证成功:", result.value)
} else {
  console.log("验证失败:", result.value.message)
}
```

---

## Schema 构造器

### 基础类型

定义最基本的数据类型。

#### String - 字符串类型

```typescript
class User extends ObjectType {
  name = String
  email = String
}
```

#### Number - 数值类型

```typescript
class Product extends ObjectType {
  price = Number      // 普通数值
  quantity = Int      // 整数
  weight = Float      // 浮点数
}
```

#### Boolean - 布尔类型

```typescript
class Settings extends ObjectType {
  enabled = Boolean
  visible = Boolean
}
```

#### Date - 日期类型

```typescript
class Event extends ObjectType {
  title = String
  startDate = Date
  endDate = Date
}
```

#### ID - 标识符类型

```typescript
class User extends ObjectType {
  id = ID           // 等同于 String，语义更明确
  name = String
}
```

---

### 复合类型

组合基础类型构建复杂结构。

#### List - 数组类型

```typescript
class Blog extends ObjectType {
  title = String
  tags = List(String)              // string[]
  scores = List(Number)            // number[]
  nested = List(List(String))      // string[][]
}
```

#### Optional - 可选类型

```typescript
class User extends ObjectType {
  name = String                    // 必需
  bio = Optional(String)           // string | undefined
  avatar = Optional(String)        // string | undefined
}

// 生成的类型
type UserType = {
  name: string
  bio?: string
  avatar?: string
}
```

#### Nullable - 可空类型

```typescript
class Article extends ObjectType {
  title = String
  content = Nullable(String)       // string | null
  publishedAt = Nullable(Date)     // Date | null
}

// 使用区别
const data1 = { title: "标题" }                    // ❌ content 必须提供
const data2 = { title: "标题", content: null }     // ✅ 显式提供 null
```

#### Record - 键值对类型

```typescript
class Config extends ObjectType {
  labels = Record(String)          // { [key: string]: string }
  counters = Record(Number)        // { [key: string]: number }
}
```

#### Tuple - 元组类型

```typescript
class Geometry extends ObjectType {
  point = Tuple(Number, Number)                    // [number, number]
  rgb = Tuple(Number, Number, Number)              // [number, number, number]
  mixed = Tuple(String, Number, Boolean)           // [string, number, boolean]
}
```

---

### 对象类型

#### ObjectType - 结构化对象

定义复杂的嵌套对象结构，支持递归引用。

```typescript
// 基础用法
class User extends ObjectType {
  id = String
  name = String
  profile = {
    bio = String,
    avatar = Optional(String),
    social = {
      twitter = Optional(String),
      github = Optional(String)
    }
  }
}

// 递归引用
class Comment extends ObjectType {
  id = String
  content = String
  replies = List(Comment)          // 自引用
  parent = Optional(Comment)       // 可选父评论
}

// 相互引用
class Post extends ObjectType {
  title = String
  author = User                    // 引用其他 ObjectType
}

class User extends ObjectType {
  name = String
  posts = List(Post)               // 反向引用
}
```

#### Struct - 快速构建

适合快速定义静态结构，常用于联合类型中。

**⚠️ 重要限制：不支持递归引用**

```typescript
// ✅ 在联合类型中快速定义结构
const APIResult = Union(
  Struct({
    success: Literal(true),
    data: List(User)
  }),
  Struct({
    success: Literal(false), 
    error: String
  })
)

// ✅ 动态构建（运行时）
function createValidator(fields: string[]) {
  const descriptors = {}
  fields.forEach(field => {
    descriptors[field] = String
  })
  return Struct(descriptors)
}

// ❌ 不支持递归引用
const BadComment = Struct({
  id: String,
  content: String,
  replies: List(BadComment)  // ❌ 错误：不支持递归引用
})

// ✅ 递归引用请使用 ObjectType
class GoodComment extends ObjectType {
  id = String
  content = String
  replies = List(GoodComment)  // ✅ 正确：支持递归引用
}
```

---

### 联合类型

#### Union - 或逻辑

```typescript
// 枚举值
const Status = Union(
  Literal('draft'),
  Literal('published'),
  Literal('archived')
)

// 复杂联合类型
const Payment = Union(
  {
    type: Literal('credit_card'),
    cardNumber: String,
    cvv: String
  },
  {
    type: Literal('paypal'),
    email: String
  }
)

// TypeScript 自动类型窄化
function processPayment(payment: TypeOf<typeof Payment>) {
  switch (payment.type) {
    case 'credit_card':
      // 这里可以访问 cardNumber, cvv
      console.log(payment.cardNumber)
      break
    case 'paypal':
      // 这里可以访问 email
      console.log(payment.email)
      break
  }
}
```

#### Intersect - 且逻辑

```typescript
class BaseUser extends ObjectType {
  id = String
  name = String
}

class ContactInfo extends ObjectType {
  email = String
  phone = String
}

// 合并多个类型
const FullUser = Intersect(BaseUser, ContactInfo)

type FullUserType = TypeOf<typeof FullUser>
// { id: string, name: string, email: string, phone: string }
```

#### Literal - 字面量类型

```typescript
const Environment = Union(
  Literal('development'),
  Literal('staging'),
  Literal('production')
)

const APIResponse = {
  status: Literal(200),
  message: Literal('OK'),
  data: Any
}
```

---

## 验证系统

### 内置验证器

#### Validator.validate - 验证数据

**类型签名**
```typescript
function validate<T extends SchemaCtor>(
  Ctor: T,
  input: unknown,
  options?: ValidatorOptions
): ValidationResult<TypeOf<T>>

type ValidatorOptions = {
  strict?: boolean  // 严格模式，默认 false
}

type ValidationResult<T> = Result<T, ValidationError>
```

**示例**
```typescript
import { Validator } from 'farrow-schema/validator'

class User extends ObjectType {
  name = String
  age = Number
}

// 基础验证
const result = Validator.validate(User, {
  name: "张三",
  age: 25
})

if (result.isOk) {
  console.log("验证成功:", result.value)
  // result.value 的类型是 { name: string, age: number }
} else {
  console.log("验证失败:", result.value.message)
  console.log("错误位置:", result.value.path?.join('.'))
}

// 严格模式
const strictResult = Validator.validate(User, {
  name: "李四",
  age: "30"  // 字符串在严格模式下会失败
}, { strict: true })

// 宽松模式（默认）
const lenientResult = Validator.validate(User, {
  name: "王五", 
  age: "35"  // 字符串会被转换为数字
})
```

#### createSchemaValidator - 创建专用验证器

**类型签名**
```typescript
function createSchemaValidator<S extends SchemaCtor>(
  SchemaCtor: S,
  options?: ValidatorOptions
): (input: unknown) => ValidationResult<TypeOf<S>>
```

**示例**
```typescript
// 创建专用验证器
const validateUser = createSchemaValidator(User, { strict: true })

// 在 API 中使用
app.post('/users', (req, res) => {
  const result = validateUser(req.body)
  
  if (result.isErr) {
    return res.status(400).json({
      error: result.value.message,
      path: result.value.path
    })
  }
  
  // result.value 已通过类型检查
  const user = await createUser(result.value)
  res.json(user)
})
```

---

### 自定义验证器

#### ValidatorType - 验证器基类

**类型签名**
```typescript
abstract class ValidatorType<T = unknown> extends Schema {
  __type: T
  
  abstract validate(input: unknown): ValidationResult<T>
  
  Ok(value: T): ValidationResult<T>
  Err(message: string, path?: (string | number)[]): ValidationResult<T>
}
```

#### 创建自定义验证器

**示例**
```typescript
import { ValidatorType, Validator } from 'farrow-schema/validator'

// 邮箱验证器
class EmailType extends ValidatorType<string> {
  validate(input: unknown) {
    const result = Validator.validate(String, input)
    if (result.isErr) return result
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(result.value)) {
      return this.Err('邮箱格式不正确')
    }
    
    return this.Ok(result.value)
  }
}

// 使用
class User extends ObjectType {
  name = String
  email = EmailType  // 直接使用自定义验证器
}
```

#### 参数化验证器

**示例**
```typescript
// 字符串长度验证器
const StringLength = (min: number, max: number) => {
  return class StringLength extends ValidatorType<string> {
    validate(input: unknown) {
      const result = Validator.validate(String, input)
      if (result.isErr) return result
      
      if (result.value.length < min || result.value.length > max) {
        return this.Err(`长度必须在 ${min}-${max} 个字符之间`)
      }
      
      return this.Ok(result.value)
    }
  }
}

// 数值范围验证器
const NumberRange = (min: number, max: number) => {
  return class NumberRange extends ValidatorType<number> {
    validate(input: unknown) {
      const result = Validator.validate(Number, input)
      if (result.isErr) return result
      
      if (result.value < min || result.value > max) {
        return this.Err(`必须在 ${min}-${max} 之间`)
      }
      
      return this.Ok(result.value)
    }
  }
}

// 使用
class Article extends ObjectType {
  title = StringLength(5, 100)     // 标题 5-100 字符
  readTime = NumberRange(1, 60)    // 阅读时间 1-60 分钟
}
```

---

## Schema 操作

### 类型推导

#### TypeOf - 提取 TypeScript 类型

**类型签名**
```typescript
type TypeOf<T extends SchemaCtor | Schema> = 
  T extends new () => { __type: infer U } ? U : never
```

**示例**
```typescript
class User extends ObjectType {
  name = String
  age = Number
  profile = {
    bio: String,
    tags: List(String)
  }
}

type UserType = TypeOf<typeof User>
// {
//   name: string
//   age: number
//   profile: {
//     bio: string
//     tags: string[]
//   }
// }

// 提取嵌套类型
type ProfileType = UserType['profile']
// { bio: string, tags: string[] }
```

---

### 字段选择与变换

#### pickObject - 选择 ObjectType 字段

**类型签名**
```typescript
function pickObject<T extends ObjectType, Keys extends SchemaField<T, keyof T>[]>(
  Ctor: new () => T,
  keys: Keys
): PickObject<T, Keys>
```

**示例**
```typescript
class FullUser extends ObjectType {
  id = String
  name = String
  email = String
  password = String
  createdAt = Date
}

// 选择公开字段
const PublicUser = pickObject(FullUser, ['id', 'name'])

type PublicUserType = TypeOf<typeof PublicUser>
// { id: string, name: string }

// 选择认证字段
const AuthUser = pickObject(FullUser, ['email', 'password'])

type AuthUserType = TypeOf<typeof AuthUser>
// { email: string, password: string }
```

#### omitObject - 排除 ObjectType 字段

**类型签名**
```typescript
function omitObject<T extends ObjectType, Keys extends SchemaField<T, keyof T>[]>(
  Ctor: new () => T,
  keys: Keys
): OmitObject<T, Keys>
```

**示例**
```typescript
// 排除敏感字段
const SafeUser = omitObject(FullUser, ['password'])

type SafeUserType = TypeOf<typeof SafeUser>
// { id: string, name: string, email: string, createdAt: Date }

// 排除系统字段
const UserInput = omitObject(FullUser, ['id', 'createdAt'])

type UserInputType = TypeOf<typeof UserInput>
// { name: string, email: string, password: string }
```

#### pickStruct - 选择 Struct 字段

**类型签名**
```typescript
function pickStruct<T extends StructType, Keys extends (keyof T['descriptors'])[]>(
  Ctor: new () => T,
  keys: Keys
): new () => StructType
```

**示例**
```typescript
const FullUserStruct = Struct({
  id: String,
  name: String,
  email: String,
  password: String,
  createdAt: Date
})

// 选择公开字段
const PublicUserStruct = pickStruct(FullUserStruct, ['id', 'name'])

type PublicUserType = TypeOf<typeof PublicUserStruct>
// { id: string, name: string }
```

#### omitStruct - 排除 Struct 字段

**类型签名**
```typescript
function omitStruct<T extends StructType, Keys extends (keyof T['descriptors'])[]>(
  Ctor: new () => T,
  keys: Keys
): new () => StructType
```

**示例**
```typescript
// 排除敏感字段
const SafeUserStruct = omitStruct(FullUserStruct, ['password'])

type SafeUserType = TypeOf<typeof SafeUserStruct>
// { id: string, name: string, email: string, createdAt: Date }
```

#### partial - 转为可选字段

**类型签名**
```typescript
function partial<T extends ObjectType>(
  Ctor: new () => T
): PartialObject<T>

function partialStruct<T extends StructType>(
  Ctor: new () => T
): new () => StructType
```

**示例**
```typescript
class User extends ObjectType {
  id = String
  name = String
  email = String
}

// ObjectType 可选化
const PartialUser = partial(User)
type PartialUserType = TypeOf<typeof PartialUser>
// { id?: string, name?: string, email?: string }

// Struct 可选化
const UserStruct = Struct({
  id: String,
  name: String,
  email: String
})

const PartialUserStruct = partialStruct(UserStruct)
type PartialUserStructType = TypeOf<typeof PartialUserStruct>
// { id?: string, name?: string, email?: string }
```

#### required - 转为必填字段

**类型签名**
```typescript
function required<T extends ObjectType>(
  Ctor: new () => T
): RequiredObject<T>

function requiredStruct<T extends StructType>(
  Ctor: new () => T
): new () => StructType
```

**示例**
```typescript
class OptionalUser extends ObjectType {
  id = Optional(String)
  name = Optional(String)
  email = Optional(String)
}

// ObjectType 必填化
const RequiredUser = required(OptionalUser)
type RequiredUserType = TypeOf<typeof RequiredUser>
// { id: string, name: string, email: string }

// Struct 必填化
const OptionalUserStruct = Struct({
  id: Optional(String),
  name: Optional(String),
  email: Optional(String)
})

const RequiredUserStruct = requiredStruct(OptionalUserStruct)
type RequiredUserStructType = TypeOf<typeof RequiredUserStruct>
// { id: string, name: string, email: string }
```

---

## 错误处理

### Result 类型

farrow-schema 使用函数式错误处理模式。

```typescript
import { Result, Ok, Err } from 'farrow-schema/result'

// 验证结果总是 Result 类型
const result = Validator.validate(User, userData)

// 类型守卫检查
if (result.isOk) {
  console.log(result.value)  // 验证成功的数据
} else {
  console.log(result.value.message)  // 错误信息
  console.log(result.value.path)     // 错误路径
}

// 业务逻辑中使用 Result
function processUser(data: unknown): Result<UserType, string> {
  const validationResult = Validator.validate(User, data)
  
  if (validationResult.isErr) {
    return Err(`数据验证失败: ${validationResult.value.message}`)
  }
  
  const user = validationResult.value
  
  if (user.age < 18) {
    return Err('用户年龄必须大于18岁')
  }
  
  return Ok(user)
}
```

### ValidationError - 验证错误

```typescript
// 错误包含详细信息
interface ValidationError {
  message: string                    // 错误消息
  path?: (string | number)[]         // 错误路径
}

// 嵌套错误的路径追踪
class User extends ObjectType {
  profile = {
    contact = {
      email: String,
      phones: List(String)
    }
  }
}

const invalidData = {
  profile: {
    contact: {
      email: 'invalid-email',        // 格式错误
      phones: ['123', 456]           // 第二个元素类型错误
    }
  }
}

const result = Validator.validate(User, invalidData)
if (result.isErr) {
  console.log(result.value.message)  // "456 is not a string"
  console.log(result.value.path)     // ["profile", "contact", "phones", 1]
}
```

---

## 实用示例

### 表单验证

```typescript
// 用户注册表单
class UserRegistration extends ObjectType {
  username = StringLength(3, 20)
  email = EmailType
  password = Password({
    minLength: 8,
    requireUppercase: true,
    requireNumbers: true
  })
  confirmPassword = String
  age = NumberRange(18, 120)
  terms = Boolean
}

// 验证注册数据
function validateRegistration(formData: unknown) {
  const result = Validator.validate(UserRegistration, formData)
  
  if (result.isErr) {
    return {
      success: false,
      error: result.value.message,
      field: result.value.path?.join('.')
    }
  }
  
  // 自定义业务验证
  const data = result.value
  if (data.password !== data.confirmPassword) {
    return {
      success: false,
      error: '密码确认不匹配',
      field: 'confirmPassword'
    }
  }
  
  if (!data.terms) {
    return {
      success: false,
      error: '必须同意服务条款',
      field: 'terms'
    }
  }
  
  return { success: true, data }
}
```

### API 接口定义

```typescript
// 用户 CRUD 接口
class User extends ObjectType {
  id = String
  name = String
  email = String
  createdAt = Date
  updatedAt = Date
}

// 创建用户输入
const CreateUserInput = omitObject(User, ['id', 'createdAt', 'updatedAt'])

// 更新用户输入
const UpdateUserInput = partial(omitObject(User, ['id', 'createdAt', 'updatedAt']))

// API 响应格式
const UserListResponse = {
  data: List(User),
  meta: {
    total: Number,
    page: Number,
    limit: Number,
    hasMore: Boolean
  }
}

const APIResponse = Union(
  {
    success: Literal(true),
    result: UserListResponse
  },
  {
    success: Literal(false),
    error: {
      code: String,
      message: String,
      details: Optional(Any)
    }
  }
)

// 使用类型
type CreateUserInputType = TypeOf<typeof CreateUserInput>
type UpdateUserInputType = TypeOf<typeof UpdateUserInput>
type APIResponseType = TypeOf<typeof APIResponse>
```

### 配置验证

```typescript
// 应用配置
class DatabaseConfig extends ObjectType {
  host = String
  port = NumberRange(1, 65535)
  database = String
  username = String
  password = String
  ssl = Boolean
}

class ServerConfig extends ObjectType {
  port = NumberRange(1000, 9999)
  host = String
  cors = {
    origins: List(String),
    credentials: Boolean
  }
}

class AppConfig extends ObjectType {
  env = Union(
    Literal('development'),
    Literal('staging'), 
    Literal('production')
  )
  database = DatabaseConfig
  server = ServerConfig
  features = Record(Boolean)
}

// 验证配置文件
function loadConfig(configFile: unknown) {
  const result = Validator.validate(AppConfig, configFile)
  
  if (result.isErr) {
    console.error('配置文件验证失败:')
    console.error('错误:', result.value.message)
    console.error('位置:', result.value.path?.join('.'))
    process.exit(1)
  }
  
  return result.value
}

// 使用
const config = loadConfig(JSON.parse(fs.readFileSync('config.json', 'utf8')))
console.log(`服务器启动在 ${config.server.host}:${config.server.port}`)
```

---

## 最佳实践

### 1. 使用 ObjectType 定义结构

```typescript
// ✅ 推荐：使用 ObjectType
class User extends ObjectType {
  id = String
  name = String
  profile = {
    bio: String,
    avatar: Optional(String)
  }
}

// ❌ 避免：过度使用 Struct
const User = Struct({
  id: String,
  name: String
})
```

### 2. 合理使用联合类型

```typescript
// ✅ 推荐：有判别字段的联合类型
const Event = Union(
  { type: Literal('click'), element: String },
  { type: Literal('scroll'), position: Number }
)

// ❌ 避免：无判别字段的联合类型
const BadEvent = Union(
  { element: String },
  { position: Number }
)
```

### 3. 错误处理模式

```typescript
// ✅ 推荐：统一的错误处理
function processData(input: unknown): Result<ProcessedData, string> {
  const validation = Validator.validate(Schema, input)
  if (validation.isErr) {
    return Err(`验证失败: ${validation.value.message}`)
  }
  
  // 业务逻辑...
  return Ok(processedData)
}

// ✅ 推荐：在调用处处理错误
const result = processData(rawData)
if (result.isOk) {
  // 使用数据
} else {
  // 处理错误
}
```

### 4. 类型提取和复用

```typescript
// ✅ 推荐：提取常用类型
type UserType = TypeOf<typeof User>
type CreateUserType = TypeOf<typeof CreateUserInput>

// ✅ 推荐：创建类型变体
const PublicUser = omitObject(User, ['password', 'email'])
const UserSummary = pickObject(User, ['id', 'name', 'avatar'])
```

---

## 总结

farrow-schema 提供了强大而灵活的类型系统，让你能够：

- **类型安全**: 编译时和运行时的完整类型检查
- **易于使用**: 直观的 API 设计，快速上手
- **功能丰富**: 支持递归、联合、交集等复杂类型
- **错误处理**: 函数式错误处理模式，优雅处理异常
- **可组合**: 灵活的类型组合和变换操作

通过这些特性，farrow-schema 能够帮你构建类型安全、可维护的应用程序。