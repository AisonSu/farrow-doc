# farrow-schema

Schema 定义和验证系统。

## 概述

`farrow-schema` 提供了一套完整的 Schema 定义和验证系统：

- 📝 声明式 Schema 定义
- ✅ 运行时类型验证
- 🎯 TypeScript 类型推导
- 🔧 自定义验证器

## 特性

### 单一数据源

一次定义，获得多种能力：

```typescript
class User extends ObjectType {
  name = String
  age = Number
}

// 1. TypeScript 类型
type UserType = TypeOf<typeof User>

// 2. 运行时验证
const result = Validator.validate(User, data)

// 3. API 文档（可扩展）
const docs = generateDocs(User)
```

### 丰富的类型系统

支持所有常见的数据类型：

- 基础类型：String, Number, Boolean, Date
- 复合类型：ObjectType, List, Union, Tuple
- 修饰符：Optional, Nullable

### 灵活的 Schema 操作

```typescript
const UserSummary = pickObject(User, ['id', 'name'])
const UpdateUser = partial(User)
const PublicUser = omitObject(User, ['password'])
```

## 安装

```bash
npm install farrow-schema
```

## 快速开始

```typescript
import { ObjectType, String, Number, List } from 'farrow-schema'
import { Validator } from 'farrow-schema/validator'

class Article extends ObjectType {
  title = String
  content = String
  tags = List(String)
  views = Number
}

const data = {
  title: 'Hello',
  content: 'World',
  tags: ['farrow'],
  views: 100
}

const result = Validator.validate(Article, data)
if (result.isOk) {
  console.log('Valid:', result.value)
}
```

## 核心概念

### Schema 定义

两种定义方式：

```typescript
// 类继承方式
class User extends ObjectType {
  name = String
}

// 对象字面量方式
const User = {
  name: String
}
```

### 验证流程

```typescript
const result = Validator.validate(Schema, data)

if (result.isOk) {
  // result.value 是验证后的数据
} else {
  // result.value 包含错误信息
}
```

### 自定义验证器

```typescript
class EmailType extends ValidatorType<string> {
  validate(input: unknown) {
    // 自定义验证逻辑
  }
}
```

## 与其他模块的集成

### 与 farrow-http

```typescript
app.post('/articles', {
  body: Article
}).use((request) => {
  // request.body 自动验证
})
```

### 类型推导

```typescript
type ArticleType = TypeOf<typeof Article>
// 自动推导出完整的 TypeScript 类型
```

## 使用场景

### API 验证

```typescript
class LoginRequest extends ObjectType {
  email = EmailType
  password = StringLength(8, 100)
}

app.post('/login', { body: LoginRequest })
```

### 数据转换

```typescript
const result = Validator.validate(Schema, rawData)
// 验证的同时进行数据转换（如 trim、toLowerCase）
```

### 配置验证

```typescript
class Config extends ObjectType {
  port = Number
  host = String
  database = {
    url: String,
    poolSize: Optional(Number)
  }
}

const config = loadConfig()
Validator.validate(Config, config)
```

## API 参考

详细 API 文档请查看 [farrow-schema API](/api/farrow-schema)

## 相关链接

- [GitHub](https://github.com/farrowjs/farrow)
- [核心概念与设计哲学](/guide/philosophy-and-practices)
- [基础教程](/guide/essentials)