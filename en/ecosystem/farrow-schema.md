# farrow-schema

Schema definition and validation system.

## Overview

`farrow-schema` provides a complete Schema definition and validation system:

- 📝 Declarative Schema definition
- ✅ Runtime type validation
- 🎯 TypeScript type inference
- 🔧 Custom validators

## Features

### Single Source of Truth

Define once, get multiple capabilities:

```typescript
class User extends ObjectType {
  name = String
  age = Number
}

// 1. TypeScript type
type UserType = TypeOf<typeof User>

// 2. Runtime validation
const result = Validator.validate(User, data)

// 3. API documentation (extensible)
const docs = generateDocs(User)
```

### Rich Type System

Supports all common data types:

- Basic types: String, Number, Boolean, Date
- Composite types: ObjectType, List, Union, Tuple
- Modifiers: Optional, Nullable

### Flexible Schema Operations

```typescript
const UserSummary = pickObject(User, ['id', 'name'])
const UpdateUser = partial(User)
const PublicUser = omitObject(User, ['password'])
```

## Installation

```bash
npm install farrow-schema
```

## Quick Start

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

## Core Concepts

### Schema Definition

Two definition approaches:

```typescript
// Class inheritance approach
class User extends ObjectType {
  name = String
}

// Object literal approach
const User = {
  name: String
}
```

### Validation Flow

```typescript
const result = Validator.validate(Schema, data)

if (result.isOk) {
  // result.value is validated data
} else {
  // result.value contains error information
}
```

### Custom Validators

```typescript
class EmailType extends ValidatorType<string> {
  validate(input: unknown) {
    // Custom validation logic
  }
}
```

## Integration with Other Modules

### With farrow-http

```typescript
app.post('/articles', {
  body: Article
}).use((request) => {
  // request.body is automatically validated
})
```

### Type Inference

```typescript
type ArticleType = TypeOf<typeof Article>
// Automatically infers complete TypeScript type
```

## Use Cases

### API Validation

```typescript
class LoginRequest extends ObjectType {
  email = EmailType
  password = StringLength(8, 100)
}

app.post('/login', { body: LoginRequest })
```

### Data Transformation

```typescript
const result = Validator.validate(Schema, rawData)
// Validates while performing data transformation (like trim, toLowerCase)
```

### Configuration Validation

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

## API Reference

For detailed API documentation, see [farrow-schema API](/en/api/farrow-schema)

## Related Links

- [GitHub](https://github.com/farrowjs/farrow)
- [Core Concepts & Philosophy](/en/guide/philosophy-and-practices)
- [Essentials](/en/guide/essentials)