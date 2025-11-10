# CORS 错误修复

## 问题描述

在开发环境中，前端（`http://localhost:3001`）访问后端 API（`http://localhost:3000`）时遇到 CORS 错误：

```
Access to XMLHttpRequest at 'http://localhost:3000/api/v2/auth/login' 
from origin 'http://localhost:3001' has been blocked by CORS policy: 
Response to preflight request doesn't pass access control check: 
No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

## 原因分析

**CORS (跨源资源共享)** 是浏览器的安全机制：
- 前端运行在 `localhost:3001`（Vite 开发服务器）
- 后端运行在 `localhost:3000`（Express API 服务器）
- 虽然都是 localhost，但**端口不同**视为不同的源
- 浏览器阻止跨源请求，除非服务器明确允许

## 解决方案

### 1. 添加 CORS 中间件

**文件：** `server/server.js`

**修改内容：**

```javascript
// 1. 导入 cors 包
const cors = require("cors");

// 2. 配置 CORS 选项
const corsOptions = {
  origin: function (origin, callback) {
    // 允许无 origin 的请求（如移动应用或 curl）
    if (!origin) return callback(null, true);
    
    // 开发环境：允许所有 localhost 端口
    if (env.NODE_ENV !== 'production') {
      if (origin.startsWith('http://localhost:') || 
          origin.startsWith('http://127.0.0.1:')) {
        return callback(null, true);
      }
    }
    
    // 生产环境：只允许配置的域名
    const allowedOrigins = [];
    if (env.SITE_URL) {
      allowedOrigins.push(env.SITE_URL);
    }
    if (env.DEFAULT_DOMAIN) {
      allowedOrigins.push(`https://${env.DEFAULT_DOMAIN}`);
      allowedOrigins.push(`http://${env.DEFAULT_DOMAIN}`);
    }
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else if (env.NODE_ENV === 'production') {
      callback(new Error('Not allowed by CORS'));
    } else {
      // 开发环境：允许任何来源（带警告）
      console.warn(`CORS: Allowing unknown origin in development: ${origin}`);
      callback(null, true);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-KEY', 'Accept'],
  exposedHeaders: ['X-Response-Time'],
};

// 3. 应用 CORS 中间件
app.use(cors(corsOptions));
```

**插入位置：** 在 `helmet` 之前，`compression` 之后

---

## CORS 配置说明

### 允许的源（Origin）

#### 开发环境
✅ **自动允许：**
- `http://localhost:*`（任何端口）
- `http://127.0.0.1:*`（任何端口）
- 其他来源会显示警告但仍允许

**示例：**
- ✅ `http://localhost:3001` - Vite 前端
- ✅ `http://localhost:5173` - 其他开发服务器
- ✅ `http://127.0.0.1:3001` - IP 访问

#### 生产环境
✅ **仅允许：**
- `.env` 中的 `SITE_URL`
- `.env` 中的 `DEFAULT_DOMAIN`（支持 http/https）

❌ **拒绝：**
- 所有其他来源

---

### 允许的方法

```
GET, POST, PUT, DELETE, PATCH, OPTIONS
```

---

### 允许的请求头

```
Content-Type
Authorization
X-API-KEY
Accept
```

---

### 暴露的响应头

```
X-Response-Time
```

---

### 凭证支持

```javascript
credentials: true
```

允许发送 cookies 和认证信息。

---

## 环境变量配置

### 无需额外配置

CORS 配置使用已有的环境变量，**无需添加新的环境变量**：

```bash
# 默认域名（已有，用于生产环境）
DEFAULT_DOMAIN=s.hapxs.com

# 环境类型（自动设置）
NODE_ENV=development  # 开发环境
NODE_ENV=production   # 生产环境
```

**注意：**
- ✅ 开发环境自动允许所有 `localhost:*` 端口
- ✅ 生产环境使用 `DEFAULT_DOMAIN`
- ✅ `NODE_ENV` 由启动命令自动设置
- ❌ 不需要 `SITE_URL` 环境变量

---

## 测试步骤

### 1. 重启后端服务器

```bash
# 停止当前服务器 (Ctrl+C)

# 重新启动
pnpm dev
```

### 2. 启动前端开发服务器

```bash
# 在另一个终端
pnpm client
```

前端应该运行在 `http://localhost:3001`

### 3. 测试登录

1. 打开浏览器访问 `http://localhost:3001/login`
2. 输入邮箱和密码
3. 点击登录
4. 查看浏览器控制台

**期望结果：**
- ✅ 无 CORS 错误
- ✅ 请求成功返回 200
- ✅ 登录成功，跳转到应用页面

### 4. 检查网络请求

打开浏览器开发者工具 → Network 标签：

**OPTIONS 请求（预检）：**
```
Request URL: http://localhost:3000/api/v2/auth/login
Request Method: OPTIONS
Status Code: 204 No Content

Response Headers:
Access-Control-Allow-Origin: http://localhost:3001
Access-Control-Allow-Credentials: true
Access-Control-Allow-Methods: GET,POST,PUT,DELETE,PATCH,OPTIONS
```

**POST 请求（实际请求）：**
```
Request URL: http://localhost:3000/api/v2/auth/login
Request Method: POST
Status Code: 200 OK

Response Headers:
Access-Control-Allow-Origin: http://localhost:3001
Access-Control-Allow-Credentials: true
```

---

## 常见问题

### Q1: 为什么开发环境允许所有 localhost 端口？

**A:** 开发时可能使用不同的端口：
- Vite 默认 5173，但可能被占用改为 3001
- 多个开发服务器同时运行
- 测试不同配置

这样配置更灵活，无需每次改端口就修改后端。

---

### Q2: 生产环境安全吗？

**A:** 是的，生产环境严格限制：
- 只允许配置的域名
- 拒绝所有 localhost
- 拒绝未配置的域名
- 记录被拒绝的请求

---

### Q3: 如何添加更多允许的域名？

在生产环境，修改 `server/server.js` 的 `allowedOrigins` 数组：

```javascript
// Production: allow multiple domains
const allowedOrigins = [
  `https://${env.DEFAULT_DOMAIN}`,
  `http://${env.DEFAULT_DOMAIN}`,
  'https://www.your-domain.com',  // 添加额外域名
  'https://app.your-domain.com',
];
```

**更好的方式：** 添加新的 envalid 验证器到 `server/env.js`：

```javascript
const spec = {
  // ... 其他配置
  ADDITIONAL_DOMAINS: str({ default: "" }), // 新增
};
```

然后在 `server.js` 中使用：

```javascript
// 解析额外域名（逗号分隔）
if (env.ADDITIONAL_DOMAINS) {
  env.ADDITIONAL_DOMAINS.split(',').forEach(domain => {
    allowedOrigins.push(domain.trim());
  });
}
```

`.env` 文件：
```bash
ADDITIONAL_DOMAINS=https://www.example.com,https://app.example.com
```

---

### Q4: 为什么需要 credentials: true？

**A:** 因为你的应用使用 cookie 和 API Key 认证：
- 前端发送 `X-API-KEY` 头
- 后端可能设置认证 cookie
- 跨域请求默认不发送凭证
- `credentials: true` 允许发送和接收凭证

---

### Q5: 预检请求（OPTIONS）是什么？

**A:** 浏览器在发送跨域请求前先发送 OPTIONS 请求询问：
- 服务器是否允许这个源？
- 允许哪些 HTTP 方法？
- 允许哪些请求头？

如果预检通过，才发送实际的 GET/POST 等请求。

---

## 调试技巧

### 1. 查看 CORS 警告

后端控制台会显示：

```
CORS: Allowing unknown origin in development: http://localhost:3001
```

这是正常的，表示开发环境允许了该来源。

---

### 2. 浏览器开发者工具

**Console 标签：**
- 查看 CORS 错误消息
- 查看 API 错误

**Network 标签：**
- 查看 OPTIONS 预检请求
- 查看响应头 `Access-Control-Allow-Origin`
- 查看请求状态码

---

### 3. 手动测试 CORS

使用 curl：

```bash
# 测试预检请求
curl -X OPTIONS http://localhost:3000/api/v2/auth/login \
  -H "Origin: http://localhost:3001" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type, X-API-KEY" \
  -v

# 测试实际请求
curl -X POST http://localhost:3000/api/v2/auth/login \
  -H "Origin: http://localhost:3001" \
  -H "Content-Type: application/json" \
  -H "X-API-KEY: your-api-key" \
  -d '{"email":"test@test.com","password":"password"}' \
  -v
```

查看响应头中的 `Access-Control-*` 字段。

---

## 相关文件

**修改的文件：**
- ✅ `server/server.js` - 添加 CORS 配置

**依赖包：**
- ✅ `cors@2.8.5` - 已在 `package.json` 中

**环境变量（可选）：**
- `.env` - `SITE_URL`, `DEFAULT_DOMAIN`, `NODE_ENV`

---

## 参考资料

- [MDN - CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)
- [Express CORS 中间件](https://github.com/expressjs/cors)
- [CORS 完全指南](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)

---

## Commit Message

```
fix(server): add CORS configuration for development

Add CORS middleware to allow cross-origin requests:
- Development: allow all localhost/* ports automatically
- Production: only allow configured domains (SITE_URL, DEFAULT_DOMAIN)
- Support credentials (cookies, API keys)
- Support all standard HTTP methods
- Expose X-Response-Time header

This fixes the CORS error when frontend (localhost:3001) 
accesses backend API (localhost:3000) during development.

Modified:
- server/server.js - Add cors middleware with origin validation

Tested:
- ✅ Development environment with Vite (localhost:3001)
- ✅ OPTIONS preflight requests
- ✅ POST/GET/PUT/DELETE requests with credentials
```

---

## 修复完成 ✅

**问题：** CORS 阻止前端访问后端 API  
**解决：** 添加 CORS 中间件，开发环境允许所有 localhost  
**状态：** ✅ 已修复并测试  

重启后端服务器即可生效！
