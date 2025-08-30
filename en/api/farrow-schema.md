# farrow-schema API Reference

farrow-schema is a powerful Schema definition and validation system that provides runtime type validation and TypeScript type inference capabilities.

## Installation

```bash
npm install farrow-schema
```

## Basic Types

### Primitives

#### String - String Type

```typescript
import { String } from 'farrow-schema'

const nameSchema = String
const result = String.safeParse('hello') // { success: true, output: 'hello' }
```

#### Int - Integer Type

```typescript
import { Int } from 'farrow-schema'

const ageSchema = Int
const result = Int.safeParse(25) // { success: true, output: 25 }
const error = Int.safeParse(25.5) // { success: false, error: ValidationError }
```

#### Float - Floating Point Type

```typescript
import { Float } from 'farrow-schema'

const priceSchema = Float
const result = Float.safeParse(19.99) // { success: true, output: 19.99 }
```

#### Number - Number Type (integer and floating point)

```typescript
import { Number } from 'farrow-schema'

const numberSchema = Number
const result1 = Number.safeParse(42) // { success: true, output: 42 }
const result2 = Number.safeParse(3.14) // { success: true, output: 3.14 }
```

#### Boolean - Boolean Type

```typescript
import { Boolean } from 'farrow-schema'

const activeSchema = Boolean
const result = Boolean.safeParse(true) // { success: true, output: true }
```

#### Date - Date Type

```typescript
import { Date } from 'farrow-schema'

const timestampSchema = Date
const result = Date.safeParse(new Date()) // { success: true, output: Date }
const result2 = Date.safeParse('2023-12-25') // Auto-converted to Date object
```

#### JSON - JSON Type

```typescript
import { JSON } from 'farrow-schema'

const dataSchema = JSON
const result = JSON.safeParse({ key: 'value' }) // Accepts any serializable value
```

#### ID - Identifier Type

```typescript
import { ID } from 'farrow-schema'

const userIdSchema = ID
const result = ID.safeParse('user_123') // { success: true, output: 'user_123' }
// ID is essentially a non-empty string
```

### Literal Types

#### Literal - Exact Value Matching

```typescript
import { Literal } from 'farrow-schema'

const statusSchema = Literal('active')
const themeSchema = Literal('dark')
const countSchema = Literal(42)

// Usage examples
const result1 = statusSchema.safeParse('active') // Success
const result2 = statusSchema.safeParse('inactive') // Failure
```

## Composite Types

### ObjectType - Object Type

#### Basic Usage

```typescript
import { ObjectType, String, Int } from 'farrow-schema'

class User extends ObjectType {
  id = Int
  name = String
  email = String
}

// Validation usage
const userData = { id: 1, name: 'Alice', email: 'alice@example.com' }
const result = User.safeParse(userData)
// result.success === true, result.output is type-safe User object

// Get TypeScript type
type UserType = TypeOf<typeof User>
// { id: number; name: string; email: string }
```

#### Nested Objects

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

// Usage
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

#### Optional and Nullable Fields

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

### List - Array Type

```typescript
import { List, String, Int } from 'farrow-schema'

// Basic arrays
const numbersSchema = List(Int)
const tagsSchema = List(String)

// Object arrays
const usersSchema = List(User)

// Nested arrays
const matrixSchema = List(List(Int)) // number[][]

// Usage examples
const numbers = [1, 2, 3, 4, 5]
const result = numbersSchema.safeParse(numbers) // Success

const users = [
  { id: 1, name: 'Alice', email: 'alice@example.com' },
  { id: 2, name: 'Bob', email: 'bob@example.com' }
]
const usersResult = usersSchema.safeParse(users) // Success
```

### Struct - Structure Type

```typescript
import { Struct, String, Int } from 'farrow-schema'

// Define structure using object literal
const UserStruct = Struct({
  id: Int,
  name: String,
  email: String
})

// Get type
type UserStructType = TypeOf<typeof UserStruct>
// { id: number; name: string; email: string }

// ObjectType vs Struct
// ObjectType: class syntax, suitable for complex inheritance scenarios
// Struct: object literal, more lightweight, suitable for simple structures
```

### Union - Union Type

#### Basic Union Type

```typescript
import { Union, Literal, String, Int } from 'farrow-schema'

// Literal union
const StatusSchema = Union([
  Literal('pending'),
  Literal('approved'),
  Literal('rejected')
])

// Mixed type union
const ValueSchema = Union([String, Int, Boolean])

// Type inference
type Status = TypeOf<typeof StatusSchema> // 'pending' | 'approved' | 'rejected'
type Value = TypeOf<typeof ValueSchema>   // string | number | boolean
```

#### Discriminated Union

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

// Usage
const successResult = { type: 'success', data: 'Hello World' }
const errorResult = { type: 'error', message: 'Not Found', code: 404 }

type Result = TypeOf<typeof ResultSchema>
// { type: 'success'; data: string } | { type: 'error'; message: string; code: number }
```

### Tuple - Tuple Type

```typescript
import { Tuple, String, Int, Boolean } from 'farrow-schema'

// Fixed-length arrays
const PointSchema = Tuple([Int, Int])           // [number, number]
const PersonSchema = Tuple([String, Int])       // [string, number]
const ConfigSchema = Tuple([String, Int, Boolean]) // [string, number, boolean]

// Usage example
const point = [10, 20]
const result = PointSchema.safeParse(point) // { success: true, output: [10, 20] }

type Point = TypeOf<typeof PointSchema> // [number, number]
```

### Record - Record Type

```typescript
import { Record, String, Int } from 'farrow-schema'

// Key-value pair structure
const ScoresSchema = Record(String, Int) // Record<string, number>
const ConfigSchema = Record(String, String) // Record<string, string>

// Usage example
const scores = {
  alice: 95,
  bob: 87,
  charlie: 92
}

const result = ScoresSchema.safeParse(scores) // Success
type Scores = TypeOf<typeof ScoresSchema> // Record<string, number>
```

## Modifiers and Tools

### Optional - Optional Type

```typescript
import { Optional, String, Int } from 'farrow-schema'

const optionalName = Optional(String)    // string | undefined
const optionalAge = Optional(Int)        // number | undefined

class User extends ObjectType {
  id = Int
  name = String
  bio = Optional(String)  // Optional field
}
```

### Nullable - Nullable Type

```typescript
import { Nullable, String, Date } from 'farrow-schema'

const nullableName = Nullable(String)       // string | null
const nullableDate = Nullable(Date)         // Date | null

class Post extends ObjectType {
  title = String
  publishedAt = Nullable(Date)  // Publish date that may be null
}
```

### Readonly - Readonly Type

```typescript
import { Readonly, String, Int } from 'farrow-schema'

const readonlyUser = Readonly(Struct({
  id: Int,
  name: String
}))

type ReadonlyUserType = TypeOf<typeof readonlyUser>
// { readonly id: number; readonly name: string }
```

### Strict - Strict Mode

```typescript
import { Strict, Struct, String, Int } from 'farrow-schema'

// Disallow extra fields
const StrictUser = Strict(Struct({
  id: Int,
  name: String
}))

// This will fail - contains extra email field
const result = StrictUser.safeParse({
  id: 1,
  name: 'Alice',
  email: 'alice@example.com' // Extra field
})
```

### NonEmpty - Non-empty Type

```typescript
import { NonEmpty, String, List } from 'farrow-schema'

const nonEmptyString = NonEmpty(String)    // Non-empty string
const nonEmptyList = NonEmpty(List(Int))   // Non-empty array

// Usage examples
nonEmptyString.safeParse('')       // Failure
nonEmptyString.safeParse('hello')  // Success

nonEmptyList.safeParse([])         // Failure
nonEmptyList.safeParse([1, 2, 3])  // Success
```

## Schema Operation Tools

### pickStruct() - Select Fields

```typescript
import { pickStruct } from 'farrow-schema'

class User extends ObjectType {
  id = Int
  name = String
  email = String
  password = String
  createdAt = Date
}

// Select specific fields
const PublicUser = pickStruct(User, ['id', 'name', 'email'])
// { id: number; name: string; email: string }

const UserSummary = pickStruct(User, ['id', 'name'])
// { id: number; name: string }
```

### omitStruct() - Exclude Fields

```typescript
import { omitStruct } from 'farrow-schema'

// Exclude sensitive fields
const SafeUser = omitStruct(User, ['password'])
// { id: number; name: string; email: string; createdAt: Date }

const PublicUser = omitStruct(User, ['password', 'email'])
// { id: number; name: string; createdAt: Date }
```

### partialStruct() - Make All Fields Optional

```typescript
import { partialStruct } from 'farrow-schema'

// Partial data for updates
const UpdateUser = partialStruct(User)
// { id?: number; name?: string; email?: string; password?: string; createdAt?: Date }

// Use case: PATCH requests
const updateData = { name: 'New Name' } // Only update name
const result = UpdateUser.safeParse(updateData) // Success
```

### requiredStruct() - Make All Fields Required

```typescript
import { requiredStruct } from 'farrow-schema'

class PartialUser extends ObjectType {
  id = Optional(Int)
  name = Optional(String)
  email = Optional(String)
}

// Force all fields to be required
const RequiredUser = requiredStruct(PartialUser)
// { id: number; name: string; email: string }
```

### intersectStruct() - Merge Structures

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

// Merge two structures
const FullUser = intersectStruct([BaseUser, UserExtension])
// { id: number; name: string; email: string; createdAt: Date }
```

## Validation System

### Basic Validation Methods

#### safeParse() - Safe Parsing

```typescript
const result = schema.safeParse(input)

if (result.success) {
  // Validation successful
  console.log(result.output) // Type-safe result
} else {
  // Validation failed
  console.error(result.error.message)
  console.error(result.error.path) // Error field path
}
```

#### parse() - Direct Parsing (may throw exception)

```typescript
try {
  const result = schema.parse(input) // Direct return or throw exception
  console.log(result)
} catch (error) {
  console.error('Validation failed:', error.message)
}
```

### Validation Error Handling

#### ValidationError Structure

```typescript
interface ValidationError {
  message: string                    // Error description
  path: (string | number)[]         // Error path ['user', 'profile', 'email']
  expected: any                     // Expected type
  actual: any                       // Actual received value
  issues: ValidationIssue[]         // Detailed error list
}

// Actual usage
const userSchema = Struct({
  profile: Struct({
    email: String
  })
})

const result = userSchema.safeParse({
  profile: { email: 123 } // Type error
})

if (!result.success) {
  console.log(result.error.path)     // ['profile', 'email']
  console.log(result.error.message)  // 'Expected string, received number'
  console.log(result.error.actual)   // 123
}
```

### Custom Validators

#### Creating Custom Schema

```typescript
import { SchemaCtor } from 'farrow-schema'

// Email validator
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

// Range validator
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

// Use custom validators
class User extends ObjectType {
  email = Email
  age = Range(0, 150)
}
```

#### Composing Validators

```typescript
// Create reusable validator combinations
const PositiveInt = SchemaCtor((input: unknown) => {
  const intResult = Int.safeParse(input)
  if (!intResult.success) return intResult
  
  if (intResult.output <= 0) {
    return { tag: 'fail', error: 'Must be positive' }
  }
  
  return { tag: 'success', output: intResult.output }
})

const Price = Range(0, 999999)  // Price range
const Quantity = PositiveInt    // Positive integer quantity
```

## Transformers

### Basic Transformation

```typescript
import { transform } from 'farrow-schema'

// String transformation
const TrimmedString = transform(String, (str) => str.trim())
const UppercaseString = transform(String, (str) => str.toUpperCase())

// Number transformation
const RoundedNumber = transform(Float, (num) => Math.round(num))

// Usage
const result = TrimmedString.safeParse('  hello world  ')
// { success: true, output: 'hello world' }
```

### Complex Transformation

```typescript
// Date string transformation
const DateFromString = transform(String, (str) => {
  const date = new Date(str)
  if (isNaN(date.getTime())) {
    throw new Error('Invalid date string')
  }
  return date
})

// JSON string transformation
const JSONFromString = transform(String, (str) => {
  try {
    return JSON.parse(str)
  } catch {
    throw new Error('Invalid JSON string')
  }
})

// Usage
class Event extends ObjectType {
  name = String
  date = DateFromString  // String auto-converted to Date
  metadata = JSONFromString  // JSON string auto-parsed
}
```

## Type Inference

### TypeOf - Get TypeScript Type

```typescript
import { TypeOf } from 'farrow-schema'

// Basic type inference
type StringType = TypeOf<typeof String> // string
type IntType = TypeOf<typeof Int>       // number

// Complex type inference
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

// Union type inference
const StatusSchema = Union([
  Literal('active'),
  Literal('inactive'),
  Literal('pending')
])

type Status = TypeOf<typeof StatusSchema> // 'active' | 'inactive' | 'pending'
```

### Advanced Type Tools

#### Conditional Type Inference

```typescript
// Extract optional fields
type OptionalKeys<T> = {
  [K in keyof T]: T[K] extends { __type: 'optional' } ? K : never
}[keyof T]

// Extract required fields
type RequiredKeys<T> = Exclude<keyof T, OptionalKeys<T>>

// Extract array element type
type ArrayElement<T> = T extends List<infer U> ? TypeOf<U> : never
```

## Complete Example

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

// ===== Custom Validators =====
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

// ===== Schema Definitions =====
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

// ===== Schema Operations =====
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

// ===== Type Inference =====
type UserType = TypeOf<typeof User>
type CreateUserType = TypeOf<typeof CreateUserRequest>
type UpdateUserType = TypeOf<typeof UpdateUserRequest>
type PublicUserType = TypeOf<typeof PublicUser>

// ===== Actual Usage =====
const userData = {
  username: 'alice_dev',
  email: 'ALICE@EXAMPLE.COM', // Will be converted to lowercase
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

// Validate create user request
const createResult = CreateUserRequest.safeParse({
  username: 'alice_dev',
  email: 'alice@example.com',
  profile: {
    firstName: 'Alice',
    lastName: 'Johnson'
  }
})

if (createResult.success) {
  console.log('User data validation successful:', createResult.output)
  // createResult.output is type-safe
} else {
  console.error('Validation failed:', createResult.error.message)
  console.error('Error path:', createResult.error.path)
}

// Validate update request (partial data)
const updateResult = UpdateUserRequest.safeParse({
  profile: {
    bio: 'Senior full-stack developer'
  },
  settings: {
    theme: 'light'
  }
})

// Use in API
import { Http, Response } from 'farrow-http'

const app = Http()

app.post('/users', {
  body: CreateUserRequest
}).use((request) => {
  // request.body is validated and type-safe
  const user = createUser(request.body)
  return Response.status(201).json(user)
})

app.put('/users/<id:int>', {
  body: UpdateUserRequest
}).use((request) => {
  // Both request.body and request.params are type-safe
  const updated = updateUser(request.params.id, request.body)
  return Response.json(updated)
})

app.get('/users/<id:int>').use((request) => {
  const user = getUser(request.params.id)
  if (!user) {
    return Response.status(404).json({ error: 'User not found' })
  }
  
  // Return public information (exclude sensitive fields)
  const publicUserResult = PublicUser.safeParse(user)
  return Response.json(publicUserResult.success ? publicUserResult.output : null)
})

// ===== Error Handling Example =====
const invalidUser = {
  username: 'ab', // Too short
  email: 'not-an-email', // Invalid email
  profile: {
    firstName: '', // Empty string
    // lastName missing
  }
}

const result = CreateUserRequest.safeParse(invalidUser)
if (!result.success) {
  console.log('Detailed error information:')
  result.error.issues.forEach(issue => {
    console.log(`- ${issue.path.join('.')}: ${issue.message}`)
  })
  /*
  Output:
  - username: Username must be 3-20 characters
  - email: Invalid email format  
  - profile.firstName: String cannot be empty
  - profile.lastName: Required field is missing
  */
}
```

## Best Practices

### 1. Naming Conventions

```typescript
// Recommended: Clear naming
const UserCreateRequest = Struct({ ... })
const UserUpdateRequest = partialStruct(User)
const PublicUserResponse = omitStruct(User, ['password'])

// Avoid: Ambiguous naming
const UserData = Struct({ ... })
const UserStuff = Struct({ ... })
```

### 2. Proper Use of Modifiers

```typescript
// Recommended: Clear semantics
class User extends ObjectType {
  id = Int                    // Required field
  email = Email              // Required field
  bio = Optional(String)     // Optional field
  deletedAt = Nullable(Date) // Nullable field (soft delete)
}

// Avoid: Excessive use of Optional
class BadUser extends ObjectType {
  id = Optional(Int)         // ID should be required
  email = Optional(Email)    // Email is usually required
}
```

### 3. Reuse and Composition

```typescript
// Recommended: Create reusable components
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

### 4. Progressive Validation

```typescript
// Recommended: From simple to complex
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

### 5. Error Handling Strategy

```typescript
// Recommended: Unified error handling
function parseUserSafely(data: unknown): UserType | null {
  const result = User.safeParse(data)
  
  if (result.success) {
    return result.output
  }
  
  // Log detailed errors for debugging
  console.error('User validation failed:', {
    issues: result.error.issues,
    input: data
  })
  
  return null
}

// Use in HTTP
app.post('/users', {
  body: User
}, {
  onSchemaError: (error, input) => {
    // Return user-friendly error messages
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

## Summary

Congratulations! You've mastered the complete farrow-schema API:

- **Basic Types**: String, Int, Boolean and other basic building blocks
- **Composite Types**: ObjectType, List, Union and other complex structures
- **Modifiers**: Optional, Nullable, Strict and other type modifiers
- **Utility Functions**: pickStruct, omitStruct and other Schema operation tools
- **Validation System**: Type-safe validation and error handling
- **Type Inference**: Complete TypeScript type support

Now you can build type-safe, maintainable data validation systems!