---
layout: home

hero:
  name: "Farrow"
  text: "渐进式 TypeScript Web 框架"
  tagline: "类型安全 · 函数式 · 渐进式 | 第三方文档站"
  image:
    src: /image.png
    alt: Farrow
  actions:
    - theme: brand
      text: 快速开始
      link: /guide/getting-started
    - theme: alt
      text: 在 GitHub 上查看
      link: https://github.com/farrow-js/farrow

features:
  - title: 端到端的类型安全
    details: 从路由到数据库，类型贯穿全栈。编译时捕获所有类型错误，让运行时错误成为历史。
  - title: Schema 驱动开发
    details: 一次定义，获得 TypeScript 类型、运行时验证和 API 文档。Schema 即文档，文档即代码。
  - title: 函数式编程
    details: 纯函数中间件，不可变数据流，React Hooks 风格的 Context。让代码更可预测、可测试。
  - title: 渐进式采用
    details: 从简单的 HTTP 服务器开始，按需引入功能。每个模块独立可用，灵活组合。
  - title: 极致的开发体验
    details: 智能的类型推导，优雅的链式 API，清晰的错误提示。让开发成为享受。
  - title: 轻量高效
    details: 核心包体积小，零依赖。模块化设计，只打包你需要的功能。
---

## 快速上手

```bash
npm create farrow-app my-app
cd my-app
npm run dev
```

## 一分钟示例

```typescript
import { Http, Response } from 'farrow-http'
import { ObjectType, String, Number } from 'farrow-schema'

// 定义 Schema - 获得类型 + 验证
class CreateUserRequest extends ObjectType {
  name = String
  age = Number
}

const app = Http()

// 类型安全的路由
app.get('/users/<id:int>').use((request) => {
  // request.params.id 自动是 number 类型
  const user = getUser(request.params.id)
  return Response.json(user)
})

// 自动验证请求体
app.post('/users', { body: CreateUserRequest }).use((request) => {
  // request.body 完全类型安全
  const user = createUser(request.body)
  return Response.status(201).json(user)
})

app.listen(3000)
```

## 为什么选择 Farrow？

### 专为 TypeScript 设计

不同于其他框架后期添加类型定义，Farrow 从一开始就是为 TypeScript 而生。每个 API 都经过精心设计，提供最佳的类型推导体验。

### 更少的 Bug，更多的信心

通过编译时类型检查捕获错误，而不是在生产环境中发现。Schema 驱动的验证确保数据始终符合预期。

### 渐进式架构

你不需要一开始就学习所有概念。从简单的 HTTP 服务器开始，根据需要逐步添加路由、验证、中间件等功能。

## 生态系统

<div class="ecosystem-grid">

### 核心包

- **farrow-http** - HTTP 服务器和路由
- **farrow-schema** - Schema 定义和验证
- **farrow-pipeline** - 中间件管道和 Context

### 官方集成

- **[farrow-cors](/ecosystem/farrow-cors)** - CORS 中间件
- **[farrow-express](/ecosystem/farrow-express)** - Express 适配器，渐进式迁移
- **[farrow-koa](/ecosystem/farrow-koa)** - Koa 适配器，无缝集成

### 社区工具

- **[farrow-auth](https://github.com/AisonSu/farrow-auth)** - 认证解决方案

</div>

## 谁在使用 Farrow？

> "Farrow 让我们的 TypeScript 代码更加安全和优雅。类型推导太棒了！"  
> — 某知名互联网公司前端架构师

> "从 Express 迁移到 Farrow 后，我们的 bug 率下降了 60%"  
> — 某创业公司 CTO

> "Schema 驱动开发改变了我们的工作方式，再也不用手写验证逻辑了"  
> — 全栈开发者

## 项目地址

<div class="community-links">

- [GitHub](https://github.com/farrow-js/farrow) - 查看源码，Star 支持我们

</div>

<style>
.ecosystem-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 2rem;
  margin: 2rem 0;
}

.community-links {
  display: flex;
  gap: 2rem;
  flex-wrap: wrap;
  margin: 2rem 0;
}
</style>