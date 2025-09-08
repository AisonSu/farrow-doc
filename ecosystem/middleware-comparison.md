# 中间件生态对比

Farrow 框架与 Express.js、Koa.js 中间件生态的全面对比分析。

## 主流中间件生态对比

| 功能分类 | Express.js | Koa.js | Farrow 框架 | 推荐方案 | 状态说明 |
|---------|-----------|---------|-----------------|---------|----------|
| **身份认证** | ✅ passport, express-jwt, express-session | ✅ koa-passport, koa-jwt, koa-session | ✅ farrow-auth-session, farrow-auth-jwt | **应用层** | **社区方案可用** |
| **文件上传** | ✅ multer, express-fileupload | ✅ multer, koa-multer, @koa/multer | 🚧 规划中 | **应用层** | 空缺，需开发 |
| **数据验证** | ✅ joi, express-validator, yup | ✅ joi, koa-validate, yup | ✅ farrow-schema | **应用层** | **Farrow 内置优势** |
| **路由系统** | ✅ express.Router | ✅ koa-router, @koa/router | ✅ farrow-http | **应用层** | **Farrow 内置优势** |
| **错误处理** | ✅ 回调式错误处理 | ✅ 异常捕获 + onerror | ✅ 函数式错误处理 | **应用层** | **Farrow 架构优势** |
| **请求解析** | ✅ body-parser, express.json | ✅ koa-bodyparser, koa-body | ✅ farrow-http 内置 | **应用层** | **Farrow 内置优势** |
| **CORS 处理** | ✅ cors | ✅ @koa/cors | ✅ farrow-cors | **Nginx 优先** | 官方包可用，但推荐 Nginx |
| **压缩响应** | ✅ compression | ✅ koa-compress | ❌ 无开发打算 | **Nginx 优先** | 推荐 `gzip on;` |
| **静态文件** | ✅ express.static | ✅ koa-static, koa-static-cache | ✅ 内置 serve 方法 | **Nginx 优先** | Farrow 有内置支持，但推荐 Nginx |
| **缓存控制** | ✅ express-cache-controller | ✅ koa-cache-control | ❌ 无开发打算 | **Nginx 优先** | 推荐 `expires` 指令 |
| **限流防护** | ✅ express-rate-limit | ✅ koa-ratelimit | ❌ 无开发打算 | **Nginx 优先** | 推荐 `limit_req` |
| **安全防护** | ✅ helmet, express-security | ✅ koa-helmet | ✅ farrow-helmet (但推荐 Nginx) | **Nginx 优先** | 社区方案存在，但推荐 `add_header` |
| **访问日志** | ✅ morgan, winston | ✅ koa-logger, koa-pino-logger | 🔄 双向互补 | **分层处理** | 网关+应用双重日志 |
| **反向代理** | ✅ http-proxy-middleware | ✅ koa-proxies | ❌ 无开发打算 | **Nginx 优先** | 推荐 `proxy_pass` |

## Nginx/OpenResty 与应用层分工建议

### 功能分层原则

现代 Web 应用架构中，许多传统"中间件"功能更适合在**网关层（Nginx/OpenResty）**处理，应用层专注于**业务逻辑**。

| 能力 | Nginx/OpenResty 实现 | Express/Koa 中间件 | Farrow 建议 | 结论与优势 |
|------|-------------------|------------------|------------|-----------|
| **压缩响应** | `gzip on;` + Brotli 模块 | `compression`, `koa-compress` | ❌ 无开发打算 | **Nginx 优先**：性能更好，支持预压缩文件 |
| **静态资源** | `location` + `root/alias` | `express.static`, `koa-static` | ❌ 无开发打算 | **Nginx 优先**：吞吐量高，缓存机制完善 |
| **缓存控制** | `expires`, `etag on;` | 各种缓存中间件 | ❌ 无开发打算 | **Nginx 优先**：统一缓存策略，减少应用负担 |
| **限流防护** | `limit_req`, `limit_conn` | `express-rate-limit` 等 | ❌ 无开发打算 | **Nginx 优先**：边缘拦截，保护后端资源 |
| **CORS 处理** | `add_header` 指令 | `cors`, `@koa/cors` | ✅ farrow-cors (但推荐 Nginx) | **Nginx 优先**：减少应用层配置复杂度 |
| **安全响应头** | `add_header` (CSP, HSTS 等) | `helmet` 系列 | ❌ 无开发打算 | **Nginx 优先**：统一安全策略管理 |
| **反向代理** | `proxy_pass` + 负载均衡 | `http-proxy-middleware` | ❌ 无开发打算 | **Nginx 优先**：协议支持全面，连接管理优秀 |
| **访问日志** | `access_log` + 自定义格式 | `morgan`, `koa-logger` | 🔄 **互补** | **分层记录**：网关记录请求，应用记录业务 |

### Nginx 配置示例

```nginx
# nginx.conf
server {
    listen 80;
    server_name api.example.com;
    
    # 压缩配置
    gzip on;
    gzip_types text/plain application/json application/javascript text/css;
    
    # 安全响应头
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    # CORS 处理
    add_header Access-Control-Allow-Origin "https://app.example.com" always;
    add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
    
    # 限流配置
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req zone=api burst=20 nodelay;
    
    # 静态资源
    location /static/ {
        root /var/www;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # 反向代理到 Farrow 应用
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

### Farrow 应用专注业务

```typescript
// Farrow 应用只关注核心业务逻辑
const app = Http()

// 身份认证中间件
const authenticate = async (req: RequestInfo, next: Next) => {
  const token = req.headers?.authorization?.replace('Bearer ', '')
  if (!token) {
    return Response.status(401).json({ error: 'No token' })
  }
  
  try {
    const user = jwt.verify(token, secret)
    AuthContext.set(user)
    return next(req)
  } catch (error) {
    return Response.status(401).json({ error: 'Invalid token' })
  }
}

// 用户 API（内置类型安全）
app.post('/users', {
  body: UserCreateSchema  // Schema 验证
}).use(authenticate)
  .use((req) => {
    const user = createUser(req.body)
    return Response.status(201).json(user)
  })

// 不需要处理：压缩、CORS、限流、静态文件等
// 这些都由 Nginx 层处理
```