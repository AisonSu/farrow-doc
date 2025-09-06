# Schema 操作与变换

> 让 Schema 更加灵活和可复用 🔄

随着应用的发展，你会发现需要基于现有的 Schema 创建变体，比如从完整的用户信息中提取公开信息，或者将所有字段变为可选。Farrow Schema 提供了强大的操作工具来满足这些需求。

## 类型推导

### TypeOf - 从 Schema 提取类型

`TypeOf` 是最基础也最重要的工具，它将 Schema 转换为 TypeScript 类型：

```typescript
import { ObjectType, String, Number, Optional, List, TypeOf } from 'farrow-schema'

class User extends ObjectType {
  id = Number
  name = String
  email = String
  age = Optional(Number)
  tags = List(String)
}

// 提取类型
type UserType = TypeOf<typeof User>
// {
//   id: number
//   name: string
//   email: string
//   age?: number
//   tags: string[]
// }

// 在函数中使用
function processUser(user: UserType) {
  console.log(`Processing ${user.name} (ID: ${user.id})`)
  
  if (user.age) {
    console.log(`Age: ${user.age}`)
  }
  
  if (user.tags.length > 0) {
    console.log(`Tags: ${user.tags.join(', ')}`)
  }
}

// 在 API 响应中使用
app.get('/users/<id:int>').use((req) => {
  const user = getUserById(req.params.id)
  
  // user 的类型自动推导为 UserType
  return Response.json({ user })
})
```

### 嵌套类型提取

```typescript
class Profile extends ObjectType {
  bio = String
  avatar = Optional(String)
  social = {
    twitter: Optional(String),
    github: Optional(String),
    website: Optional(String)
  }
}

class User extends ObjectType {
  id = Number
  name = String
  email = String
  profile = Profile
}

type UserType = TypeOf<typeof User>
type ProfileType = TypeOf<typeof Profile>

// 也可以直接从嵌套结构提取
type SocialType = UserType['profile']['social']
// {
//   twitter?: string
//   github?: string  
//   website?: string
// }

// 在函数中使用嵌套类型
function updateUserProfile(userId: number, profile: ProfileType) {
  return updateUser(userId, { profile })
}

function updateUserSocial(userId: number, social: SocialType) {
  const user = getUserById(userId)
  return updateUser(userId, {
    profile: {
      ...user.profile,
      social
    }
  })
}
```

## 字段选择操作

### pickObject - 选择特定字段

`pickObject` 让你从 ObjectType 中选择需要的字段：

```typescript
import { pickObject } from 'farrow-schema'

class FullUser extends ObjectType {
  id = Number
  name = String
  email = String
  password = String
  phone = Optional(String)
  isAdmin = Boolean
  createdAt = Date
  lastLoginAt = Optional(Date)
  profile = {
    bio: Optional(String),
    avatar: Optional(String)
  }
}

// 创建公开用户信息 Schema
const PublicUser = pickObject(FullUser, [
  'id', 
  'name', 
  'profile'
])

type PublicUserType = TypeOf<typeof PublicUser>
// {
//   id: number
//   name: string
//   profile: {
//     bio?: string
//     avatar?: string
//   }
// }

// 创建用户基本信息 Schema
const UserBasic = pickObject(FullUser, [
  'id',
  'name', 
  'email'
])

// 创建管理员视图 Schema
const AdminUser = pickObject(FullUser, [
  'id',
  'name',
  'email', 
  'phone',
  'isAdmin',
  'createdAt',
  'lastLoginAt'
])

// 在不同场景下使用
app.get('/users').use(() => {
  const users = getAllUsers()
  
  // 只返回公开信息
  const publicUsers: PublicUserType[] = users.map(user => ({
    id: user.id,
    name: user.name,
    profile: user.profile
  }))
  
  return Response.json({ users: publicUsers })
})

app.get('/admin/users').use((req) => {
  // 需要管理员权限
  requireAdmin(req)
  
  const users = getAllUsers()
  
  // 返回管理员视图
  const adminUsers: TypeOf<typeof AdminUser>[] = users.map(user => ({
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    isAdmin: user.isAdmin,
    createdAt: user.createdAt,
    lastLoginAt: user.lastLoginAt
  }))
  
  return Response.json({ users: adminUsers })
})
```

### omitObject - 排除特定字段

`omitObject` 与 `pickObject` 相反，它排除不需要的字段：

```typescript
// 排除敏感字段
const SafeUser = omitObject(FullUser, ['password'])

type SafeUserType = TypeOf<typeof SafeUser>
// 包含除了 password 之外的所有字段

// 排除系统字段，创建用户输入 Schema
const UserInput = omitObject(FullUser, [
  'id',           // ID 由系统生成
  'createdAt',    // 创建时间由系统生成
  'lastLoginAt'   // 登录时间由系统管理
])

type UserInputType = TypeOf<typeof UserInput>
// {
//   name: string
//   email: string
//   password: string
//   phone?: string
//   isAdmin: boolean
//   profile: { bio?: string, avatar?: string }
// }

// 创建更新用户的 Schema（排除不可修改字段）
const UserUpdate = omitObject(FullUser, [
  'id',
  'createdAt',
  'lastLoginAt',
  'password'      // 密码单独更新
])

// 在 API 中使用
app.post('/users', { body: UserInput }).use((req) => {
  const userData: UserInputType = req.body
  
  // 创建用户
  const newUser = createUser({
    ...userData,
    id: generateId(),
    createdAt: new Date(),
    lastLoginAt: null
  })
  
  // 返回安全的用户信息（不包含密码）
  const safeUser: SafeUserType = omit(newUser, ['password'])
  
  return Response.status(201).json({ user: safeUser })
})

app.put('/users/<id:int>', { body: UserUpdate }).use((req) => {
  const userId = req.params.id
  const updateData: TypeOf<typeof UserUpdate> = req.body
  
  const updatedUser = updateUser(userId, updateData)
  
  // 返回安全的用户信息
  const safeUser: SafeUserType = omit(updatedUser, ['password'])
  
  return Response.json({ user: safeUser })
})
```

## Struct 字段操作

### pickStruct / omitStruct

对于使用 `Struct` 创建的 Schema，也有对应的操作：

```typescript
import { Struct, pickStruct, omitStruct } from 'farrow-schema'

const FullUserStruct = Struct({
  id: Number,
  name: String,
  email: String,
  password: String,
  role: String,
  createdAt: Date
})

// 选择公开字段
const PublicUserStruct = pickStruct(FullUserStruct, ['id', 'name'])

// 排除敏感字段  
const SafeUserStruct = omitStruct(FullUserStruct, ['password'])

type PublicUserStructType = TypeOf<typeof PublicUserStruct>
// { id: number, name: string }

type SafeUserStructType = TypeOf<typeof SafeUserStruct>
// { id: number, name: string, email: string, role: string, createdAt: Date }

// 在快速原型中使用
const createQuickAPI = (resource: string, schema: any) => {
  const publicSchema = omitStruct(schema, ['password', 'secret'])
  
  app.get(`/${resource}`).use(() => {
    const items = getAll(resource)
    return Response.json({ [resource]: items.map(item => pick(item, publicSchema)) })
  })
  
  app.get(`/${resource}/<id:int>`).use((req) => {
    const item = getById(resource, req.params.id)
    return Response.json({ [resource.slice(0, -1)]: pick(item, publicSchema) })
  })
}
```

## 字段可选化操作

### partial - 转为可选字段

`partial` 将所有字段转换为可选字段，类似于 TypeScript 的 `Partial<T>`：

```typescript
import { partial } from 'farrow-schema'

class User extends ObjectType {
  id = Number
  name = String
  email = String
  age = Number
}

// 创建可选版本
const PartialUser = partial(User)

type PartialUserType = TypeOf<typeof PartialUser>
// {
//   id?: number
//   name?: string  
//   email?: string
//   age?: number
// }

// 用于更新操作
app.put('/users/<id:int>', { body: PartialUser }).use((req) => {
  const userId = req.params.id
  const updates: PartialUserType = req.body
  
  // 只更新提供的字段
  const updatedUser = updateUser(userId, updates)
  
  return Response.json({ user: updatedUser })
})

// 用于搜索过滤
app.get('/users/search', { 
  body: partial(pickObject(User, ['name', 'email'])) 
}).use((req) => {
  const filters: { name?: string, email?: string } = req.body
  
  const users = searchUsers(filters)
  
  return Response.json({ users })
})
```

### required - 转为必填字段

`required` 与 `partial` 相反，将可选字段转换为必填字段：

```typescript
import { required } from 'farrow-schema'

class OptionalUser extends ObjectType {
  id = Optional(Number)
  name = Optional(String)
  email = Optional(String)
}

// 转为必填
const RequiredUser = required(OptionalUser)

type RequiredUserType = TypeOf<typeof RequiredUser>
// {
//   id: number
//   name: string
//   email: string  
// }

// 在验证步骤中使用
const validateCompleteUser = (data: any): RequiredUserType => {
  const result = Validator.validate(RequiredUser, data)
  
  if (result.isErr) {
    throw new Error(`验证失败: ${result.value.message}`)
  }
  
  return result.value
}

// 多步表单的最终验证
app.post('/users/complete-registration', { body: OptionalUser }).use((req) => {
  try {
    // 确保所有必要字段都已填写
    const completeUser = validateCompleteUser(req.body)
    
    const newUser = createUser(completeUser)
    
    return Response.status(201).json({ user: newUser })
  } catch (error) {
    return Response.status(400).json({ 
      error: '注册信息不完整',
      details: error.message 
    })
  }
})
```

## 复合操作

### 链式操作

你可以组合多个操作来创建复杂的 Schema 变换：

```typescript
class CompleteUser extends ObjectType {
  id = Number
  name = String
  email = String
  password = String
  phone = Optional(String)
  address = {
    street: String,
    city: String,
    zipCode: String
  }
  preferences = {
    theme: String,
    notifications: Boolean,
    language: String
  }
  createdAt = Date
  updatedAt = Optional(Date)
}

// 创建用户注册 Schema
// 1. 排除系统字段
// 2. 使一些字段可选
const UserRegistration = partial(
  omitObject(CompleteUser, [
    'id',
    'createdAt', 
    'updatedAt'
  ])
)

type UserRegistrationType = TypeOf<typeof UserRegistration>
// {
//   name?: string
//   email?: string
//   password?: string
//   phone?: string
//   address?: { street: string, city: string, zipCode: string }
//   preferences?: { theme: string, notifications: boolean, language: string }
// }

// 创建用户个人资料更新 Schema
// 1. 只选择可修改的字段
// 2. 排除密码（单独更新）
// 3. 使所有字段可选
const UserProfileUpdate = partial(
  omitObject(
    pickObject(CompleteUser, [
      'name',
      'phone', 
      'address',
      'preferences'
    ]),
    []
  )
)

// 创建管理员用户编辑 Schema
// 1. 排除系统字段和密码
// 2. 保持其他字段为必填
const AdminUserEdit = omitObject(CompleteUser, [
  'id',
  'password',
  'createdAt',
  'updatedAt'
])

// 在不同场景中使用
app.post('/auth/register', { body: UserRegistration }).use(async (req) => {
  const registrationData: UserRegistrationType = req.body
  
  // 验证必需字段
  if (!registrationData.name || !registrationData.email || !registrationData.password) {
    return Response.status(400).json({
      error: '姓名、邮箱和密码是必需的'
    })
  }
  
  const newUser = await createUser({
    ...registrationData,
    id: generateId(),
    createdAt: new Date()
  })
  
  return Response.status(201).json({ user: omit(newUser, ['password']) })
})

app.put('/profile', { body: UserProfileUpdate }).use((req) => {
  const currentUser = getCurrentUser(req)
  const updates: TypeOf<typeof UserProfileUpdate> = req.body
  
  const updatedUser = updateUser(currentUser.id, updates)
  
  return Response.json({ user: omit(updatedUser, ['password']) })
})
```

### 条件 Schema 变换

```typescript
// 根据用户角色动态生成 Schema
const createUserSchemaByRole = (role: 'admin' | 'user' | 'guest') => {
  const baseFields = ['name', 'email'] as const
  
  switch (role) {
    case 'admin':
      return pickObject(CompleteUser, [
        ...baseFields,
        'phone',
        'address', 
        'preferences',
        'createdAt',
        'updatedAt'
      ])
    
    case 'user':
      return pickObject(CompleteUser, [
        ...baseFields,
        'phone',
        'preferences'
      ])
    
    case 'guest':
      return pickObject(CompleteUser, baseFields)
  }
}

// 在中间件中使用
app.get('/users/<id:int>').use((req) => {
  const user = getUserById(req.params.id)
  const currentUser = getCurrentUser(req)
  
  // 根据当前用户角色决定返回什么信息
  const userSchema = createUserSchemaByRole(currentUser.role)
  const filteredUser = pick(user, userSchema)
  
  return Response.json({ user: filteredUser })
})
```

## Schema 组合与继承

### 使用 Intersect 组合 Schema

```typescript
import { Intersect } from 'farrow-schema'

// 基础信息
class BaseInfo extends ObjectType {
  id = Number
  createdAt = Date
  updatedAt = Optional(Date)
}

// 用户信息
class UserInfo extends ObjectType {
  name = String
  email = String
}

// 联系信息
class ContactInfo extends ObjectType {
  phone = Optional(String)
  address = Optional(String)
}

// 组合成完整用户
const FullUser = Intersect(BaseInfo, UserInfo, ContactInfo)

type FullUserType = TypeOf<typeof FullUser>
// {
//   id: number
//   createdAt: Date
//   updatedAt?: Date
//   name: string
//   email: string
//   phone?: string
//   address?: string
// }

// 创建不同的组合
const PublicUser = Intersect(
  pickObject(BaseInfo, ['id']),
  UserInfo
)

const UserWithContact = Intersect(UserInfo, ContactInfo)

// 在 API 中使用
app.get('/users/<id:int>/full').use((req) => {
  const user = getUserById(req.params.id)
  const fullUser: FullUserType = user
  
  return Response.json({ user: fullUser })
})

app.get('/users/<id:int>/public').use((req) => {
  const user = getUserById(req.params.id)
  const publicUser: TypeOf<typeof PublicUser> = {
    id: user.id,
    name: user.name,
    email: user.email
  }
  
  return Response.json({ user: publicUser })
})
```



## 总结

通过掌握这些 Schema 操作技术，你可以：

- 🎯 **提取精确的类型** - 使用 `TypeOf` 获得完整的类型安全
- 🔧 **灵活选择字段** - 使用 `pick` 和 `omit` 创建不同的 Schema 视图
- 📝 **调整字段要求** - 使用 `partial` 和 `required` 改变字段的可选性
- 🔄 **组合多个 Schema** - 使用 `Intersect` 和链式操作构建复杂结构
- 🏗️ **构建可复用系统** - 通过链式操作和组合提高开发效率

::: tip 💡 最佳实践
- 为常用的 Schema 变体创建命名常量
- 使用类型别名提高代码可读性
- 在 API 文档中说明不同端点返回的字段
- 考虑向后兼容性，特别是在 API 升级时
:::

## 下一步

掌握了 Schema 操作后，你可以继续学习：

**[Pipeline 核心概念](./pipeline-concepts)**  
深入理解 Pipeline、usePipeline 和 Container 管理