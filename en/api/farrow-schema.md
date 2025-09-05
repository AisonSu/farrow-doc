# farrow-schema User API Reference

## Overview

farrow-schema is a powerful TypeScript type validation and serialization library. Through type-driven design, it makes it easy to define data structures, validate inputs, and handle errors.

## Table of Contents

- [Schema Constructors](#schema-constructors)
  - [Basic Types](#basic-types)
    - [String - String Type](#string---string-type)
    - [Number - Numeric Type](#number---numeric-type)
    - [Boolean - Boolean Type](#boolean---boolean-type)
    - [Date - Date Type](#date---date-type)
    - [ID - Identifier Type](#id---identifier-type)
  - [Composite Types](#composite-types)
    - [List - Array Type](#list---array-type)
    - [Optional - Optional Type](#optional---optional-type)
    - [Nullable - Nullable Type](#nullable---nullable-type)
    - [Record - Key-Value Type](#record---key-value-type)
    - [Tuple - Tuple Type](#tuple---tuple-type)
  - [Structured Types](#structured-types)
    - [ObjectType - Structured Object](#objecttype---structured-object)
    - [Struct - Quick Construction](#struct---quick-construction)
  - [Union and Intersection](#union-and-intersection)
    - [Union - Or Logic](#union---or-logic)
    - [Intersect - And Logic](#intersect---and-logic)
    - [Literal - Literal Type](#literal---literal-type)
- [Schema Operations](#schema-operations)
  - [Type Inference](#type-inference)
    - [TypeOf - Extract TypeScript Type](#typeof---extract-typescript-type)
  - [Field Selection and Transformation](#field-selection-and-transformation)
    - [pickObject - Select ObjectType Fields](#pickobject---select-objecttype-fields)
    - [omitObject - Exclude ObjectType Fields](#omitobject---exclude-objecttype-fields)
    - [pickStruct - Select Struct Fields](#pickstruct---select-struct-fields)
    - [omitStruct - Exclude Struct Fields](#omitstruct---exclude-struct-fields)
    - [partial - Convert to Optional Fields](#partial---convert-to-optional-fields)
    - [required - Convert to Required Fields](#required---convert-to-required-fields)
- [Validation System](#validation-system)
  - [Built-in Validators](#built-in-validators)
    - [createSchemaValidator - Create Dedicated Validator](#createschemavalidator---create-dedicated-validator)
  - [Custom Validators](#custom-validators)
    - [ValidatorType - Validator Base Class](#validatortype---validator-base-class)
- [Error Handling](#error-handling)
- [Practical Examples](#practical-examples)

## Quick Start

```typescript
import { ObjectType, String, Number, List } from 'farrow-schema'
import { Validator } from 'farrow-schema/validator'

// Define User Schema
class User extends ObjectType {
  name = String
  age = Number
  tags = List(String)
}

// Validate data
const result = Validator.validate(User, {
  name: "John Doe",
  age: 25,
  tags: ["developer", "TypeScript"]
})

if (result.isOk) {
  console.log("Validation successful:", result.value)
} else {
  console.log("Validation failed:", result.value.message)
}
```

---

## Schema Constructors

### Basic Types

Define the most fundamental data types.

#### String - String Type

```typescript
class User extends ObjectType {
  name = String
  email = String
}

// Generated TypeScript type
type UserType = {
  name: string
  email: string
}
```

#### Number - Numeric Type

```typescript
class Product extends ObjectType {
  price = Number      // Regular number
  quantity = Int      // Integer
  weight = Float      // Floating point
}
```

#### Boolean - Boolean Type

```typescript
class Settings extends ObjectType {
  enabled = Boolean
  visible = Boolean
}
```

#### Date - Date Type

```typescript
class Event extends ObjectType {
  title = String
  startDate = Date
  endDate = Date
}
```

#### ID - Identifier Type

```typescript
class User extends ObjectType {
  id = ID           // Equivalent to String, but semantically clearer
  name = String
}
```

---

### Composite Types

Combine basic types to build complex structures.

#### List - Array Type

```typescript
class Blog extends ObjectType {
  title = String
  tags = List(String)              // string[]
  scores = List(Number)            // number[]
  nested = List(List(String))      // string[][]
}
```

#### Optional - Optional Type

```typescript
class User extends ObjectType {
  name = String                    // Required
  bio = Optional(String)           // string | undefined
  avatar = Optional(String)        // string | undefined
}

// Generated TypeScript type
type UserType = {
  name: string
  bio?: string
  avatar?: string
}
```

#### Nullable - Nullable Type

```typescript
class Article extends ObjectType {
  title = String
  content = Nullable(String)       // string | null
}

// Usage difference
const data1 = { title: "Title" }                    // ❌ content must be provided
const data2 = { title: "Title", content: null }     // ✅ explicitly provide null
```

#### Record - Key-Value Type

```typescript
class Config extends ObjectType {
  labels = Record(String)          // { [key: string]: string }
  counters = Record(Number)        // { [key: string]: number }
}
```

#### Tuple - Tuple Type

```typescript
class Geometry extends ObjectType {
  point = Tuple(Number, Number)                    // [number, number]
  line = Tuple(Number, Number, Number, Number)     // [number, number, number, number]
}
```

---

### Structured Types

Define complex nested object structures with support for recursive references.

```typescript
// Basic usage
class User extends ObjectType {
  id = String
  name = String
  email = String
  profile = {
    bio: Optional(String),
    avatar: Optional(String),
    social: {
      twitter: Optional(String),
      github: Optional(String)
    }
  }
}

// Generated TypeScript type
type UserType = {
  id: string
  name: string  
  email: string
  profile: {
    bio?: string
    avatar?: string
    social: {
      twitter?: string
      github?: string
    }
  }
}
```

#### Struct - Quick Construction

**⚠️ Important limitation: Does not support recursive references**

```typescript
// ✅ Quick structure definition in union types
const APIResult = Union(
  Struct({
    success: Literal(true),
    data: String
  }),
  Struct({
    success: Literal(false),
    error: String
  })
)

// ❌ Cannot handle recursive references
const Comment = Struct({
  id: String,
  content: String,
  replies: List(Comment)  // Error: Cannot reference Comment before definition
})
```

---

### Union and Intersection

#### Union - Or Logic

```typescript
// Enum values
const Status = Union(
  Literal('pending'),
  Literal('success'), 
  Literal('error')
)

// Complex union types
const APIResponse = Union(
  Struct({
    status: Literal('success'),
    data: String
  }),
  Struct({
    status: Literal('error'),
    message: String
  })
)
```

#### Intersect - And Logic

```typescript
class BaseUser extends ObjectType {
  id = String
  name = String
}

class AdminUser extends ObjectType {
  role = Literal('admin')
  permissions = List(String)
}

// Combine multiple types
const FullUser = Intersect(BaseUser, AdminUser)
type FullUserType = TypeOf<typeof FullUser>
```

#### Literal - Literal Type

```typescript
const Environment = Union(
  Literal('development'),
  Literal('production'), 
  Literal('test')
)

const HttpMethod = Union(
  Literal('GET'),
  Literal('POST'),
  Literal('PUT'),
  Literal('DELETE')
)
```

---

## Schema Operations

### Type Inference

**Type signature**
```typescript
function validate<T extends SchemaCtor>(
  Ctor: T,
  input: unknown
): ValidationResult<TypeOf<T>>

type ValidationResult<T> = Result<T, ValidationError>
```

**Example**
```typescript
import { Validator } from 'farrow-schema/validator'

function processPayment(payment: TypeOf<typeof Payment>) {
  // payment is fully type-safe
  return payment.amount * 0.1
}

const result = Validator.validate(Payment, unknownData)
if (result.isOk) {
  processPayment(result.value) // Type-safe
}
```

### Built-in Validators

**Type signature**
```typescript
function createSchemaValidator<S extends SchemaCtor>(
  SchemaCtor: S,
  options?: ValidationOptions
): (input: unknown) => ValidationResult<TypeOf<S>>
```

**Example**
```typescript
// Create dedicated validator
const validateUser = createSchemaValidator(User, { strict: true })

// Use in API
app.post('/users', (req, res) => {
  const result = validateUser(req.body)
  
  if (result.isErr) {
    return res.status(400).json({
      error: result.value.message,
      details: result.value.path
    })
  }
  
  const user = result.value // Fully validated and type-safe
  return res.json(createUser(user))
})
```

### Custom Validators

**Type signature**
```typescript
abstract class ValidatorType<T = unknown> extends Schema {
  __type: T
  
  abstract validate(input: unknown): ValidationResult<T>
  
  Ok(value: T): ValidationResult<T>
  Err(message: string, path?: (string | number)[]): ValidationResult<T>
}
```

**Example**
```typescript
import { ValidatorType, Validator } from 'farrow-schema/validator'

class EmailType extends ValidatorType<string> {
  validate(input: unknown) {
    if (typeof input !== 'string') {
      return this.Err('Expected string')
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(input)) {
      return this.Err('Invalid email format')
    }
    
    return this.Ok(input)
  }
}

const Email = new EmailType()
```

**Example**
```typescript
// String length validator
const StringLength = (min: number, max: number) => {
  return class StringLength extends ValidatorType<string> {
    validate(input: unknown) {
      const result = Validator.validate(String, input)
      if (result.isErr) return result
      
      if (result.value.length < min || result.value.length > max) {
        return this.Err(`String length must be between ${min} and ${max}`)
      }
      
      return this.Ok(result.value)
    }
  }
}

// Number range validator
const NumberRange = (min: number, max: number) => {
  return class NumberRange extends ValidatorType<number> {
    validate(input: unknown) {
      const result = Validator.validate(Number, input)
      if (result.isErr) return result
      
      if (result.value < min || result.value > max) {
        return this.Err(`Number must be between ${min} and ${max}`)
      }
      
      return this.Ok(result.value)
    }
  }
}

// Usage
class User extends ObjectType {
  name = new (StringLength(2, 50))()
  age = new (NumberRange(0, 120))()
}
```

---

### Field Selection and Transformation

#### TypeOf - Extract TypeScript Type

**Type signature**
```typescript
type TypeOf<T extends SchemaCtor | Schema> = 
  T extends new () => { __type: infer U } ? U : never
```

**Example**
```typescript
class User extends ObjectType {
  name = String
  email = String
  age = Number
}

type UserType = TypeOf<typeof User>
// Equivalent to:
// type UserType = {
//   name: string
//   email: string  
//   age: number
// }

function createUser(userData: UserType): UserType {
  return {
    name: userData.name,
    email: userData.email,
    age: userData.age
  }
}
```

#### pickObject - Select ObjectType Fields

**Type signature**
```typescript
function pickObject<T extends ObjectType, Keys extends SchemaField<T, keyof T>[]>(
  Ctor: new () => T,
  keys: Keys
): PickObject<T, Keys>
```

**Example**
```typescript
class FullUser extends ObjectType {
  id = String
  name = String
  email = String
  password = String
  createdAt = Date
}

// Pick specific fields
const PublicUser = pickObject(FullUser, ['id', 'name'])
const AuthUser = pickObject(FullUser, ['id', 'name', 'email'])

type PublicUserType = TypeOf<typeof PublicUser>
// { id: string; name: string }

type AuthUserType = TypeOf<typeof AuthUser>
// { id: string; name: string; email: string }
```

#### omitObject - Exclude ObjectType Fields

**Type signature**
```typescript
function omitObject<T extends ObjectType, Keys extends SchemaField<T, keyof T>[]>(
  Ctor: new () => T,
  keys: Keys
): OmitObject<T, Keys>
```

**Example**
```typescript
// Exclude sensitive fields
const SafeUser = omitObject(FullUser, ['password'])

type SafeUserType = TypeOf<typeof SafeUser>
// { id: string; name: string; email: string; createdAt: Date }

const UserInput = omitObject(FullUser, ['id', 'createdAt'])

type UserInputType = TypeOf<typeof UserInput>
// { name: string; email: string; password: string }
```

#### pickStruct - Select Struct Fields

**Type signature**
```typescript
function pickStruct<T extends StructType, Keys extends (keyof T['descriptors'])[]>(
  struct: T,
  keys: Keys
): PickStruct<T, Keys>
```

**Example**
```typescript
const FullUserStruct = Struct({
  id: String,
  name: String,
  email: String,
  password: String,
  createdAt: Date
})

// Pick specific fields
const PublicUserStruct = pickStruct(FullUserStruct, ['id', 'name'])

type PublicUserType = TypeOf<typeof PublicUserStruct>
// { id: string; name: string }
```

#### omitStruct - Exclude Struct Fields

**Type signature**
```typescript
function omitStruct<T extends StructType, Keys extends (keyof T['descriptors'])[]>(
  struct: T,
  keys: Keys
): OmitStruct<T, Keys>
```

**Example**
```typescript
// Exclude sensitive fields
const SafeUserStruct = omitStruct(FullUserStruct, ['password'])

type SafeUserType = TypeOf<typeof SafeUserStruct>
// { id: string; name: string; email: string; createdAt: Date }
```

#### partial - Convert to Optional Fields

**Type signature**
```typescript
function partial<T extends ObjectType>(
  Ctor: new () => T
): PartialObject<T>

function partialStruct<T extends StructType>(
  struct: T  
): PartialStruct<T>
```

**Example**
```typescript
class User extends ObjectType {
  id = String
  name = String
  email = String
}

const PartialUser = partial(User)

type PartialUserType = TypeOf<typeof PartialUser>
// { id?: string; name?: string; email?: string }

const PartialUserStruct = partialStruct(UserStruct)

type PartialUserStructType = TypeOf<typeof PartialUserStruct>
// { id?: string; name?: string; email?: string }
```

#### required - Convert to Required Fields

**Type signature**
```typescript
function required<T extends ObjectType>(
  Ctor: new () => T
): RequiredObject<T>

function requiredStruct<T extends StructType>(
  struct: T
): RequiredStruct<T>
```

**Example**
```typescript
class OptionalUser extends ObjectType {
  id = Optional(String)
  name = Optional(String)
  email = Optional(String)
}

const RequiredUser = required(OptionalUser)

type RequiredUserType = TypeOf<typeof RequiredUser>
// { id: string; name: string; email: string }

const RequiredUserStruct = requiredStruct(OptionalUserStruct)

type RequiredUserStructType = TypeOf<typeof RequiredUserStruct>
// { id: string; name: string; email: string }
```

---

## Error Handling

farrow-schema uses functional error handling patterns.

```typescript
import { Result, Ok, Err } from 'farrow-schema/result'

function processUser(data: unknown): Result<UserType, string> {
  const result = Validator.validate(User, data)
  
  if (result.isErr) {
    return Err(`Validation failed: ${result.value.message}`)
  }
  
  if (result.value.age < 18) {
    return Err('User must be at least 18 years old')
  }
  
  return Ok(result.value)
}

// Usage
const result = processUser(unknownData)
if (result.isOk) {
  console.log('User processed:', result.value)
} else {
  console.error('Error:', result.value)
}
```

### ValidationError - Validation Error

```typescript
// Error contains detailed information
interface ValidationError {
  message: string
  path: (string | number)[]
  input: unknown
}

// Example error
const error = {
  message: 'Expected string, got number',
  path: ['user', 'name'],
  input: 123
}
```

---

## Practical Examples

### Form Validation

```typescript
// User registration form
class UserRegistration extends ObjectType {
  username = new (StringLength(3, 20))()
  email = new EmailType()
  password = new (StringLength(8, 128))()
  confirmPassword = String
  age = new (NumberRange(13, 120))()
  terms = Literal(true)
}

const validateRegistration = createSchemaValidator(UserRegistration)

// API endpoint
app.post('/register', (req, res) => {
  const result = validateRegistration(req.body)
  
  if (result.isErr) {
    return res.status(400).json({
      error: 'Validation failed',
      details: result.value
    })
  }
  
  const userData = result.value
  if (userData.password !== userData.confirmPassword) {
    return res.status(400).json({
      error: 'Passwords do not match'
    })
  }
  
  // Continue with registration...
})
```

### API Interface Definition

```typescript
// User CRUD interfaces
class User extends ObjectType {
  id = String
  name = String
  email = String
  role = Union([Literal('admin'), Literal('user')])
  createdAt = Date
  updatedAt = Date
}

const CreateUserInput = omitObject(User, ['id', 'createdAt', 'updatedAt'])
const UpdateUserInput = partial(omitObject(User, ['id', 'createdAt', 'updatedAt']))

const APIResponse = <T extends Schema>(dataSchema: T) => Union(
  Struct({
    success: Literal(true),
    data: dataSchema
  }),
  Struct({
    success: Literal(false),
    error: String,
    code: Optional(Number)
  })
)

type CreateUserInputType = TypeOf<typeof CreateUserInput>
type UpdateUserInputType = TypeOf<typeof UpdateUserInput>
type APIResponseType = TypeOf<typeof APIResponse>
```

### Configuration Validation

```typescript
// Application configuration
class DatabaseConfig extends ObjectType {
  host = String
  port = new (NumberRange(1, 65535))()
  database = String
  username = String
  password = String
  ssl = Optional(Boolean)
  timeout = Optional(new (NumberRange(1000, 60000))())
}

class RedisConfig extends ObjectType {
  host = String
  port = new (NumberRange(1, 65535))()
  password = Optional(String)
  db = Optional(new (NumberRange(0, 15))())
}

class AppConfig extends ObjectType {
  port = new (NumberRange(1, 65535))()
  env = Union([
    Literal('development'),
    Literal('production'),
    Literal('test')
  ])
  database = DatabaseConfig
  redis = RedisConfig
  cors = {
    origin: Union([String, List(String)]),
    credentials: Boolean
  }
}

// Load and validate configuration
function loadConfig(): TypeOf<typeof AppConfig> {
  const configData = JSON.parse(fs.readFileSync('config.json', 'utf8'))
  const result = Validator.validate(AppConfig, configData)
  
  if (result.isErr) {
    throw new Error(`Invalid configuration: ${result.value.message}`)
  }
  
  return result.value
}
```

---

## Best Practices

### 1. Use ObjectType for Structure Definition

```typescript
// ✅ Recommended: Use ObjectType
class User extends ObjectType {
  id = String
  name = String
  email = String
}

// ❌ Not recommended: Complex inline objects
const User = Struct({
  id: String,
  name: String,
  profile: Struct({
    bio: String,
    social: Struct({
      twitter: String
    })
  })
})
```

### 2. Proper Use of Union Types

```typescript
// ✅ Recommended: Union types with discriminating fields
const Event = Union(
  Struct({
    type: Literal('click'),
    element: String
  }),
  Struct({
    type: Literal('scroll'),
    position: Number
  })
)
```

### 3. Error Handling Patterns

```typescript
// ✅ Recommended: Unified error handling
function processData(input: unknown): Result<ProcessedData, string> {
  const validation = Validator.validate(DataSchema, input)
  if (validation.isErr) {
    return Err(`Validation failed: ${validation.value.message}`)
  }
  
  // Business logic processing
  try {
    const processed = processBusinessLogic(validation.value)
    return Ok(processed)
  } catch (error) {
    return Err(`Processing failed: ${error.message}`)
  }
}
```

### 4. Type Extraction and Reuse

```typescript
// ✅ Recommended: Extract common types
type UserType = TypeOf<typeof User>
type CreateUserType = TypeOf<typeof CreateUserInput>

// Use in functions
function createUser(data: CreateUserType): Promise<UserType> {
  // Implementation
}
```