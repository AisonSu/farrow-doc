# Farrow Schema 渐进式学习指南

> 🎯 **面向用户的渐进式学习，从基础到实战应用**  
> 🎮 **从入门到真香的类型安全之旅**

---

## 为什么选择 farrow-schema？

假设你正在开发一个用户注册功能。使用传统方式，你需要：

```typescript
// 1. 定义 TypeScript 接口
interface User {
  name: string
  email: string
  age: number
}

// 2. 编写验证函数（开始怀疑人生）
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

// 3. 还要维护两份定义的同步... 😭
// 4. 产品经理：能不能再加个字段？
// 5. 你：...（内心崩溃）
```

使用 farrow-schema，生活突然美好了起来：

```typescript
import { ObjectType, String, Number, Int } from 'farrow-schema'

class User extends ObjectType {
  name = String
  email = EmailType  // 自定义验证器
  age = Number
}

// 就这样！类型和验证都有了 🎉
// 产品经理：再加个字段？
// 你：没问题，一行搞定！
```

---

## 基础概念：从简单开始

### 定义你的第一个 Schema

让我们从一个电商网站的商品开始（毕竟谁不想开网店赚钱呢？）：

```typescript
import { ObjectType, String, Number, Int, Float, Boolean, List, Optional } from 'farrow-schema'

class Product extends ObjectType {
  id = Int                // 商品ID（整数）
  name = String           // 商品名称（比如"程序员防脱洗发水"）
  price = Float           // 价格（9999.99 - 因为程序员有钱）
  inStock = Boolean       // 是否有货（永远是 false，因为太抢手）
  tags = List(String)     // 标签列表 ["防脱", "程序员专属", "bug修复器"]
  description = Optional(String)  // 可选的描述（懒得写就不写）
}
```

### 获取 TypeScript 类型

TypeScript 的类型推导比你的初恋还要贴心：

```typescript
import { TypeOf } from 'farrow-schema'

type ProductType = TypeOf<typeof Product>
// 自动推导为：
// {
//   name: string
//   price: number
//   inStock: boolean
//   tags: string[]
//   description?: string  // 看，连可选都帮你推导好了
// }

// 再也不用手动维护类型同步了！🎊
```

### 验证数据

验证用户输入，让黑客哭去吧：

```typescript
import { Validator } from 'farrow-schema/validator'

const productData = {
  name: "iPhone 15",
  price: 999,  // 苹果：我们卖的不是手机，是信仰
  inStock: true,
  tags: ["smartphone", "apple", "卖肾专用"]
}

const result = Validator.validate(Product, productData)
if (result.isOk) {
  console.log('验证成功:', result.value)
  // 可以愉快地存数据库了
} else {
  console.log('验证失败:', result.value.message)
  // 告诉用户：你的数据有问题，别想蒙混过关！
}
```

---

## 进阶用法：处理真实场景

### 嵌套对象：直接使用对象字面量

当你需要嵌套结构时，直接写就完事了（就像俄罗斯套娃，但更有趣）：

```typescript
class Order extends ObjectType {
  id = String
  
  // 客户信息（知道你是谁才能送货）
  customer = {
    name: String,
    email: String,
    phone: Optional(String)  // 社恐患者可以不填
  }
  
  // 商品列表（买买买！）
  items = List({
    productId: String,
    quantity: Number,    // 库存：你要几个？用户：全要！
    price: Number        // 付款时的价格，防止商家偷偷涨价
  })
  
  // 配送地址（送到火星也要加运费）
  shippingAddress = {
    street: String,
    city: String,
    country: String,
    zipCode: String      // 填错了包裹就去环游世界了
  }
}
```

### 联合类型：处理多种可能

生活充满了选择，代码也是：

```typescript
import { Union, Literal } from 'farrow-schema'

// 订单状态（从下单到收货的心路历程）
class Order extends ObjectType {
  status = Union(
    Literal('pending'),    // 待处理（老板还在睡觉）
    Literal('processing'), // 处理中（老板醒了）
    Literal('shipped'),    // 已发货（在路上飞奔）
    Literal('delivered')   // 已送达（终于到了！）
  )
}

// 支付方式（钱不够？试试分期！）
const PaymentMethod = Union(
  {
    type: Literal('credit_card'),
    cardNumber: String,
    cvv: String,
    expiryDate: String  // 2099年到期，希望那时候还在用信用卡
  },
  {
    type: Literal('paypal'),
    email: String       // PayPal: 让转账像发邮件一样简单（并不）
  },
  {
    type: Literal('bank_transfer'),
    accountNumber: String,
    routingNumber: String  // 填错一个数字，钱就去度假了
  }
)

// TypeScript 会自动识别不同的类型（比 AI 还聪明）
function processPayment(payment: TypeOf<typeof PaymentMethod>) {
  switch (payment.type) {
    case 'credit_card':
      // TypeScript 知道这里有 cardNumber, cvv, expiryDate
      console.log(payment.cardNumber)
      // 信用卡：先花未来的钱，让未来的自己烦恼去吧
      break
    case 'paypal':
      // TypeScript 知道这里有 email
      console.log(payment.email)
      // PayPal：国际转账利器（手续费也是国际水平）
      break
    case 'bank_transfer':
      // TypeScript 知道这里有 accountNumber, routingNumber
      console.log(payment.accountNumber)
      // 银行转账：最传统的方式，也是最慢的
      break
  }
}
```

### 递归结构：评论系统

递归，程序员的浪漫（也是面试官的最爱）：

```typescript
// 评论可以有回复，回复也可以有回复（套娃警告！）
class Comment extends ObjectType {
  id = String
  content = String        // "沙发！" "板凳！" "地板！"
  author = String         // "键盘侠123"
  createdAt = Date
  replies = List(Comment)  // 直接引用自己！递归的魅力
}

// 分类树（像家谱一样复杂）
class Category extends ObjectType {
  name = String
  slug = String
  parent = Optional(Category)     // 认爸爸
  children = List(Category)       // 生孩子
}

// 社交网络（错综复杂的人际关系）
class User extends ObjectType {
  id = String
  name = String
  friends = List(User)      // 朋友（表面的）
  following = List(User)    // 关注（偷偷观察的）
  followers = List(User)    // 粉丝（也在偷偷观察你的）
}
```

---

## 实用技巧：让代码更优雅

### 创建 API 专用的 Schema

在实际项目中，不同的 API 需要不同的数据（就像不同的场合需要不同的衣服）：

```typescript
import { pickObject, omitObject, partial } from 'farrow-schema'

// 完整的用户模型（所有信息都在这里）
class User extends ObjectType {
  id = String
  username = String
  email = String
  password = String        // 加密存储，不然会上热搜
  profile = {
    firstName: String,
    lastName: String,
    avatar: Optional(String),    // 头像（不传就用默认的蓝色小人）
    bio: Optional(String)        // 个人简介（"这个人很懒，什么都没写"）
  }
  createdAt = Date
  updatedAt = Date
}

// 用户注册：只需要基本信息（别一上来就要身份证）
const UserRegistration = pickObject(User, ['username', 'email', 'password'])

// 用户资料：不包含敏感信息（密码是秘密！）
const UserProfile = omitObject(User, ['password'])

// 用户更新：所有字段都是可选的（想改啥改啥）
const UserUpdate = partial(pickObject(User, ['username', 'profile']))

// 在 API 中使用
app.post('/api/register', async (req, res) => {
  const result = Validator.validate(UserRegistration, req.body)
  if (result.isErr) {
    return res.status(400).json({ 
      error: result.value.message,
      translation: "你的输入有问题，重新来过吧少年！"
    })
  }
  // result.value 的类型是 { username: string, email: string, password: string }
  const user = await createUser(result.value)
  res.json({ 
    message: "注册成功！欢迎加入我们的大家庭！",
    user 
  })
})
```

### 自定义验证器

内置类型不够用？自己动手，丰衣足食：

```typescript
import { ValidatorType, Validator } from 'farrow-schema/validator'
import { String } from 'farrow-schema'

// 邮箱验证器（拒绝 test@test.com）
class EmailType extends ValidatorType<string> {
  validate(input: unknown) {
    const result = Validator.validate(String, input)
    if (result.isErr) return result
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(result.value)) {
      return this.Err('这不是邮箱吧？你确定不是在开玩笑？')
    }
    
    // 彩蛋：拒绝测试邮箱
    if (result.value === 'test@test.com') {
      return this.Err('认真点！test@test.com 不是真实邮箱！')
    }
    
    return this.Ok(result.value)
  }
}

// 带参数的验证器：字符串长度（灵活定制）
const StringLength = (min: number, max: number) => {
  return class extends ValidatorType<string> {
    validate(input: unknown) {
      const result = Validator.validate(String, input)
      if (result.isErr) return result
      
      if (result.value.length < min) {
        return this.Err(`太短了！至少需要 ${min} 个字符（别偷懒）`)
      }
      if (result.value.length > max) {
        return this.Err(`太长了！最多 ${max} 个字符（写作文呢？）`)
      }
      
      return this.Ok(result.value)
    }
  }
}

// 使用自定义验证器
class User extends ObjectType {
  email = EmailType
  username = StringLength(3, 20)   // 用户名：不能太短也不能太长
  password = StringLength(8, 100)  // 密码：要安全但别太变态
  bio = Optional(StringLength(0, 500))  // 个人简介：可选，但别写小说
}
```

### Optional vs Nullable

这两个的区别，就像"没带钱"和"带了0元"的区别：

```typescript
class UserProfile extends ObjectType {
  // Optional: 字段可能不存在（没填就是没填）
  bio = Optional(String)        // { bio?: string }
  
  // Nullable: 字段存在但可能为 null（明确表示"我不想填"）
  avatar = Nullable(String)     // { avatar: string | null }
  
  // 两者结合：既可能不存在，也可能为 null（薛定谔的字段）
  website = Optional(Nullable(String))  // { website?: string | null }
}

// 实际使用中的区别
const profile1 = {
  avatar: null,    // ✅ Nullable 允许（我就是不想要头像）
  // bio 不存在    // ✅ Optional 允许（懒得写简介）
}

const profile2 = {
  bio: "我是一个有故事的人",    // ✅ 提供了值
  avatar: "handsome.jpg"        // ✅ 提供了值（自信！）
}
```

### 灵活的字段控制

用 `required` 和 `partial` 玩转字段（像变形金刚一样灵活）：

```typescript
// 活动信息
class Event extends ObjectType {
  title = String                      // 标题必填（没标题怎么吸引人？）
  description = Optional(String)      // 描述可选（懒得写就算了）
  location = Optional(String)         // 地点可选（线上活动不需要）
  startTime = Optional(Date)          // 开始时间可选（随缘开始）
  endTime = Optional(Date)            // 结束时间可选（随缘结束）
}

// 创建草稿：只需要标题（先占个坑）
const DraftEvent = Event

// 发布活动：所有字段都必填（认真起来了）
const PublishedEvent = required(Event)

// 更新活动：所有字段都可选（想改哪个改哪个）
const UpdateEvent = partial(Event)

// 实际使用
function saveDraft(data: TypeOf<typeof DraftEvent>) {
  // data.title 是必填的
  // 其他字段都是可选的
  console.log("草稿已保存，慢慢完善吧")
}

function publishEvent(data: TypeOf<typeof PublishedEvent>) {
  // 所有字段都是必填的
  console.log(data.description)  // string（不是 string | undefined）
  console.log("活动发布成功！准备迎接参与者吧！")
}
```

---

## 实战示例：构建一个博客系统

让我们构建一个博客系统（每个程序员都要有自己的博客，即使没人看）：

```typescript
import { 
  ObjectType, String, Number, Boolean, Date, 
  List, Optional, Union, Literal,
  TypeOf, pickObject, omitObject, partial
} from 'farrow-schema'

// 文章模型（你的思想结晶）
class Article extends ObjectType {
  id = String
  title = String          // 标题党必备
  slug = String           // SEO 友好的 URL
  content = String        // 正文（支持 Markdown，程序员的最爱）
  excerpt = Optional(String)  // 摘要（懒得写就自动截取）
  
  author = {
    id: String,
    name: String,        // 作者大名
    avatar: Optional(String)  // 头像（不传就是神秘人）
  }
  
  status = Union(
    Literal('draft'),      // 草稿（写了一半去摸鱼了）
    Literal('published'),  // 已发布（终于写完了！）
    Literal('archived')    // 已归档（过时的内容）
  )
  
  tags = List(String)      // 标签（SEO 优化必备）
  
  metadata = {
    views: Number,         // 浏览量（大部分是自己点的）
    likes: Number,         // 点赞数（妈妈的点赞也算）
    commentsCount: Number  // 评论数（包括自己的测试评论）
  }
  
  publishedAt = Optional(Date)  // 发布时间
  createdAt = Date
  updatedAt = Date
}

// 评论模型（键盘侠的战场）
class Comment extends ObjectType {
  id = String
  articleId = String
  content = String         // 评论内容（友善发言，不要互喷）
  
  author = {
    name: String,          // 昵称（"路过的大神"）
    email: EmailType,      // 邮箱（用于显示 Gravatar 头像）
    website: Optional(String)  // 个人网站（顺便推广一下）
  }
  
  replies = List(Comment)  // 支持嵌套回复（吵架更方便了）
  
  createdAt = Date
}

// API Schema
const CreateArticleInput = pickObject(Article, ['title', 'content', 'excerpt', 'tags'])
const UpdateArticleInput = partial(CreateArticleInput)
const ArticleResponse = omitObject(Article, ['updatedAt'])

const CreateCommentInput = {
  content: StringLength(1, 1000),  // 评论别太长（写论文呢？）
  author: {
    name: StringLength(1, 50),     // 昵称别太长
    email: EmailType,
    website: Optional(String)
  }
}

// Express API 实现
import express from 'express'
import { Validator } from 'farrow-schema/validator'

const app = express()

// 创建文章
app.post('/api/articles', authenticate, async (req, res) => {
  const result = Validator.validate(CreateArticleInput, req.body)
  
  if (result.isErr) {
    return res.status(400).json({
      error: result.value.message,
      field: result.value.path?.join('.'),
      advice: "检查一下你的输入，别让 bug 跑出来！"
    })
  }
  
  const article = await createArticle({
    ...result.value,
    authorId: req.user.id,
    status: 'draft'  // 先存草稿，想清楚再发布
  })
  
  res.json({ 
    message: "文章创建成功！是时候展示你的才华了！",
    article 
  })
})

// 添加评论
app.post('/api/articles/:id/comments', async (req, res) => {
  const result = Validator.validate(CreateCommentInput, req.body)
  
  if (result.isErr) {
    return res.status(400).json({
      error: result.value.message,
      field: result.value.path?.join('.'),
      hint: "评论要友善哦，做一个文明的网友！"
    })
  }
  
  const comment = await createComment({
    ...result.value,
    articleId: req.params.id
  })
  
  res.json({
    message: "评论成功！感谢你的参与！",
    comment
  })
})
```

---

## 设计原则：写出更好的 Schema

### 1. 静态定义，不要动态生成

```typescript
// ✅ 好：静态定义（TypeScript 会感谢你的）
class User extends ObjectType {
  name = String
  email = String
}

// ❌ 不好：动态生成（TypeScript：我太难了）
function createSchema(fields: any) {
  return Struct(fields)  // 失去了类型安全，bug 在偷笑
}
```

### 2. 为不同场景创建专门的 Schema

```typescript
// ✅ 好：每个场景有专门的 Schema（各司其职）
const UserRegistration = pickObject(User, ['email', 'password'])
const UserLogin = pickObject(User, ['email', 'password'])
const UserProfile = omitObject(User, ['password'])

// ❌ 不好：一个 Schema 试图适配所有场景（累死它了）
class UniversalUser extends ObjectType {
  // 100 个字段，99 个 Optional
  // 维护的人会恨你的
}
```

### 3. Schema 只负责数据格式，业务逻辑分离

```typescript
// ✅ 好：Schema 只管格式（专注做好一件事）
class EmailType extends ValidatorType<string> {
  validate(input: unknown) {
    // 只验证邮箱格式
    if (!isValidEmailFormat(input)) {
      return this.Err('邮箱格式不正确')
    }
    return this.Ok(input)
  }
}

// 业务逻辑在服务层（该它操心的事）
async function registerUser(data: UserInput) {
  // Schema 验证
  const validation = Validator.validate(UserRegistration, data)
  if (validation.isErr) throw new Error(validation.value.message)
  
  // 业务逻辑
  if (await emailExists(data.email)) {
    throw new Error('邮箱已被注册（换一个吧）')
  }
  
  return await createUser(data)
}
```

---

## 下一步

恭喜你！现在你已经掌握了 farrow-schema 的精髓。是时候去征服世界了（至少是你的项目）：

1. 查看 [API 参考](/api/farrow-schema) - 了解所有可用的 API（工具箱里的每个工具）
2. 开始在你的项目中使用 farrow-schema（别忘了给个 star ⭐）

记住：**好的 Schema 设计能让 bug 无处遁形，让同事对你刮目相看！**

**开始使用 farrow-schema，让你的 TypeScript 项目更加类型安全！** 🚀

*P.S. 如果这个库帮到了你，记得请作者喝杯咖啡 ☕（虽然作者可能更需要睡眠）*