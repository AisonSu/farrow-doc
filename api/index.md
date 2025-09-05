# API 参考

Farrow 提供了一套完整的 API 来构建类型安全的 Web 应用。本文档提供了所有核心模块的详细 API 参考。

## 核心模块

### [farrow-http](/api/farrow-http)
**TypeScript 优先的 Web 框架** - 提供类型安全的路由和自动验证功能

- HTTP/HTTPS 服务器创建和配置
- 类型安全的路由模式和自动验证
- 强大的 Response 构建系统
- 模块化路由器和中间件系统
- 上下文管理和错误处理
- 静态文件服务和 CORS 集成
- Express 集成支持

### [farrow-schema](/api/farrow-schema)
**强大的类型验证和序列化库** - 通过类型驱动设计轻松处理数据

- 完整的基础类型系统（String、Number、Boolean、Date、ID）
- 灵活的复合类型（List、Optional、Nullable、Record、Tuple）
- 结构化类型定义（ObjectType、Struct）
- 联合与交集类型（Union、Intersect、Literal）
- Schema 操作工具（pickObject、omitObject、partial、required）
- 内置和自定义验证器系统
- 完整的 TypeScript 类型推导支持

### [farrow-pipeline](/api/farrow-pipeline)
**类型安全的中间件管道库** - 提供函数式编程风格的请求处理

- 同步和异步 Pipeline 创建
- 类型安全的上下文管理系统
- Container 概念和依赖注入
- Pipeline 组合和中间件执行
- 实用工具和错误处理
- 异步追踪支持

## 快速导航

### HTTP 服务

#### 入门指南
- [安装和快速开始](/api/farrow-http#安装和快速开始) - 5分钟上手
- [基础示例](/api/farrow-http#基础示例) - 常用代码模板
- [完整示例](/api/farrow-http#完整示例) - 生产级应用代码

#### 核心 API
- [服务器创建](/api/farrow-http#服务器创建) - `Http()`, `Https()`, 配置选项
- [路由定义](/api/farrow-http#路由定义) - `get()`, `post()`, `match()` 等
- [响应构建](/api/farrow-http#响应构建) - Response 对象和方法
- [中间件](/api/farrow-http#中间件) - `use()`, 洋葱模型, 错误处理

#### 高级功能  
- [路由器系统](/api/farrow-http#路由器系统) - `Router()`, `route()`, 模块化
- [上下文管理](/api/farrow-http#上下文管理) - Context, hooks, 请求隔离
- [错误处理](/api/farrow-http#错误处理) - 异常处理机制
- [静态文件](/api/farrow-http#静态文件) - `serve()`, 安全保护
- [测试支持](/api/farrow-http#测试) - 测试配置和示例

### Schema 验证

#### 基础类型
- [`String`](/api/farrow-schema#string---字符串类型) - 字符串验证
- [`Number`](/api/farrow-schema#number---数值类型) - 数值验证
- [`Boolean`](/api/farrow-schema#boolean---布尔类型) - 布尔值验证
- [`Date`](/api/farrow-schema#date---日期类型) - 日期验证
- [`ID`](/api/farrow-schema#id---标识符类型) - 标识符类型

#### 复合类型
- [`List`](/api/farrow-schema#list---数组类型) - 数组类型验证
- [`Optional`](/api/farrow-schema#optional---可选类型) - 可选字段
- [`Nullable`](/api/farrow-schema#nullable---可空类型) - 可空类型
- [`Record`](/api/farrow-schema#record---键值对类型) - 键值对类型
- [`Tuple`](/api/farrow-schema#tuple---元组类型) - 元组类型

#### 结构化类型
- [`ObjectType`](/api/farrow-schema#objecttype---结构化对象) - 对象类型定义
- [`Struct`](/api/farrow-schema#struct---快速构建) - 结构体定义
- [`Union`](/api/farrow-schema#union---或逻辑) - 联合类型
- [`Intersect`](/api/farrow-schema#intersect---且逻辑) - 交集类型

#### 工具函数
- [`TypeOf`](/api/farrow-schema#typeof---提取-typescript-类型) - 类型推导
- [`pickObject`](/api/farrow-schema#pickobject---选择-objecttype-字段) - 选择字段
- [`omitObject`](/api/farrow-schema#omitobject---排除-objecttype-字段) - 排除字段
- [`partial`](/api/farrow-schema#partial---转为可选字段) - 转为可选

### Pipeline 系统

#### Pipeline 创建
- [`createPipeline()`](/api/farrow-pipeline#createpipeline) - 创建同步管道
- [`createAsyncPipeline()`](/api/farrow-pipeline#createasyncpipeline) - 创建异步管道
- [`usePipeline()`](/api/farrow-pipeline#usepipeline) - 使用 Pipeline

#### Context 管理
- [`createContext()`](/api/farrow-pipeline#createcontext) - 创建上下文
- [`createContainer()`](/api/farrow-pipeline#createcontainer) - 创建容器
- [Container 概念](/api/farrow-pipeline#container-概念) - 依赖注入容器

## API 规范

### 命名约定

- **类型**: PascalCase (如 `ObjectType`, `HttpError`)
- **函数**: camelCase (如 `createContext`, `pickStruct`)
- **常量**: UPPER_CASE (如 `DEFAULT_PORT`)
- **文件**: kebab-case (如 `farrow-http`)

### 类型标注

所有 API 都包含完整的 TypeScript 类型定义：

```typescript
// 函数签名
function createContext<T>(defaultValue: T): Context<T>

// 类型定义
type RequestInfo = {
  readonly pathname: string
  readonly method?: string
  readonly query?: RequestQuery
  readonly body?: any
  readonly headers?: RequestHeaders
  readonly cookies?: RequestCookies
}
```

