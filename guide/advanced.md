# 深入 Farrow

一旦你掌握了 [基础教程](./essentials) 中的核心概念，就可以深入探索 Farrow 的高级功能了。

本章节包含了 Farrow 框架的所有高级特性，每个主题都有详细的讲解和实例。

## 🛣️ 高级路由

### [路由参数进阶](./advanced-routing)

深入了解 Farrow 的路由系统，包括：
- 复杂的路径参数模式
- 高级查询参数处理
- 路由匹配优化
- 动态路由生成

### [高级路由技术](./flexible-routing)

掌握 Farrow 的高级路由能力：
- **match 方法详解** - 复杂的路由匹配和验证
- **静态文件服务** - 安全的 serve 方法使用
- **自定义响应处理** - Response.custom() 的强大功能
- **条件路由与中间件** - 基于时间、地理位置、设备的路由
- **高级中间件组合** - 构建复杂的处理链

## 📝 Schema 深入

### [Schema 高级类型](./advanced-schema)

掌握 Farrow Schema 的所有高级类型：
- **基础类型扩展** - Int, Float, Date, Any 等
- **复合类型** - List, Optional, Nullable, Record, Tuple
- **结构化类型** - ObjectType, Struct 详解
- **联合与交集** - Union, Intersect, Literal 完整用法
- **自定义验证器** - ValidatorType 和业务逻辑验证

### [Schema 操作与变换](./schema-operations)

学习 Schema 的高级操作：
- **字段选择** - pickObject, omitObject 详解
- **类型变换** - partial, required 的应用场景
- **Schema 组合** - 如何组合和继承 Schema
- **类型推导** - TypeOf 的使用和最佳实践

## 🔗 Pipeline 深度解析

### [Pipeline 核心概念](./pipeline-concepts)

深入理解 Pipeline 的工作原理和高级用法：
- **Container 概念详解** - 什么是 Container，为什么需要它
- **上下文隔离机制** - 并发安全的原理
- **Pipeline 生命周期** - 从创建到执行的完整流程
- **usePipeline 详解** - 上下文继承的原理和用法
- **手动创建 Container** - 测试和多环境场景应用
- **Pipeline 组合模式** - 如何组合多个 Pipeline
- **异步 Pipeline** - createAsyncPipeline 的高级用法
- **错误处理和传播** - Pipeline 中的异常处理

---

## 学习建议

1. **按需学习** - 你不需要掌握所有高级特性才能使用 Farrow
2. **实践驱动** - 每个主题都包含完整的代码示例，建议边学边练
3. **循序渐进** - 建议按照上述顺序学习，后面的主题会用到前面的概念
4. **参考 API** - 配合 [API 参考文档](../api/) 获得完整的函数签名和选项

::: tip 💡 提示
如果你在特定场景下遇到问题，可以直接跳到相关章节。每个主题都是相对独立的。
:::

## 快速导航

| 我想要... | 推荐阅读 |
|----------|----------|
| 处理复杂的 URL 参数 | [路由参数进阶](./advanced-routing) |
| 自定义路由匹配逻辑 | [高级路由技术](./flexible-routing) |
| 验证复杂的数据结构 | [Schema 高级类型](./advanced-schema) |
| 组合和复用验证逻辑 | [Schema 操作与变换](./schema-operations) |
| 理解 Pipeline 的工作原理 | [Pipeline 核心概念](./pipeline-concepts) |
| 组合多个处理流程 | [Pipeline 核心概念](./pipeline-concepts) |