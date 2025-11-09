# Passkey Two-Factor Authentication (2FA) 完整指南

本指南详细介绍如何在 Kutt URL Shortener 中使用 Passkey（WebAuthn）进行双因素认证。

## 📋 目录

- [功能概述](#功能概述)
- [系统要求](#系统要求)
- [安装步骤](#安装步骤)
- [配置说明](#配置说明)
- [使用指南](#使用指南)
- [API 文档](#api-文档)
- [故障排除](#故障排除)

## 🎯 功能概述

### 什么是 Passkey？

Passkey 是基于 WebAuthn 标准的现代身份验证方法，允许用户使用：
- **生物识别**：Face ID、Touch ID、Windows Hello
- **安全密钥**：YubiKey、Titan Key 等硬件密钥
- **设备 PIN**：设备的 PIN 码或图案锁

### 主要优势

✅ **更安全**：基于公钥加密，无法被钓鱼攻击窃取  
✅ **更便捷**：无需记忆或输入密码，一键登录  
✅ **跨平台**：支持所有主流浏览器和操作系统  
✅ **离线可用**：某些场景下可在无网络环境使用

### 与传统 2FA 的对比

| 特性 | Passkey (WebAuthn) | TOTP (Google Authenticator) |
|------|-------------------|------------------------------|
| 安全性 | ⭐⭐⭐⭐⭐ 抗钓鱼 | ⭐⭐⭐⭐ 可被钓鱼 |
| 便捷性 | ⭐⭐⭐⭐⭐ 一键登录 | ⭐⭐⭐ 需输入代码 |
| 设备依赖 | 需要兼容设备 | 需要应用程序 |
| 跨设备同步 | ⭐⭐⭐⭐ (iCloud/Google) | ⭐⭐ 手动设置 |

## 💻 系统要求

### 浏览器支持

- ✅ Chrome 67+ / Edge 18+
- ✅ Firefox 60+
- ✅ Safari 13+
- ✅ Opera 54+

### 操作系统支持

- ✅ Windows 10+ (Windows Hello)
- ✅ macOS 10.15+ (Touch ID / Face ID)
- ✅ iOS 14+ / iPadOS 14+ (Face ID / Touch ID)
- ✅ Android 7+ (指纹 / 面部识别)

### 服务器要求

- Node.js 18+
- HTTPS 连接（生产环境必需）
- 支持的数据库：PostgreSQL / MySQL / SQLite

## 🚀 安装步骤

### 1. 安装依赖

在项目根目录运行：

```bash
# 安装后端依赖
pnpm install

# 安装前端依赖
cd client
pnpm install
cd ..
```

新增的依赖包括：
- **后端**：`@simplewebauthn/server@^10.0.1`
- **前端**：`@simplewebauthn/browser@^10.0.0`

### 2. 运行数据库迁移

创建必要的数据库表：

```bash
pnpm migrate
```

这将创建：
- `passkeys` 表：存储用户的 Passkey 凭证
- `users` 表新增字段：`passkey_enabled`（布尔值）

### 3. 配置环境变量

编辑 `.env` 文件，添加 Passkey 配置：

```env
# Passkey Configuration
PASSKEY_RP_ID=localhost                    # 开发环境
PASSKEY_ORIGIN=http://localhost:3000       # 开发环境

# 生产环境示例
# PASSKEY_RP_ID=yourdomain.com
# PASSKEY_ORIGIN=https://yourdomain.com
```

**重要说明**：
- `PASSKEY_RP_ID`：域名（不含协议和端口）
- `PASSKEY_ORIGIN`：完整 URL（包含协议）
- 生产环境**必须使用 HTTPS**

### 4. 启动应用

```bash
# 开发环境（前后端同时启动）
pnpm dev:all

# 或分别启动
pnpm dev          # 后端
pnpm client       # 前端（新终端）
```

## ⚙️ 配置说明

### 数据库表结构

#### `passkeys` 表

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | STRING | 主键，唯一标识符 |
| `user_id` | INTEGER | 关联用户 ID（外键） |
| `name` | STRING | Passkey 名称（用户自定义） |
| `credential_id` | TEXT | Base64URL 编码的凭证 ID |
| `credential_public_key` | TEXT | Base64URL 编码的公钥 |
| `counter` | INTEGER | 签名计数器（防重放攻击） |
| `transports` | STRING | 传输方式（逗号分隔） |
| `created_at` | TIMESTAMP | 创建时间 |
| `last_used` | TIMESTAMP | 最后使用时间 |

#### `users` 表新增字段

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `passkey_enabled` | BOOLEAN | `false` | 是否启用 Passkey 2FA |

### 环境变量详解

```env
# 必需配置
PASSKEY_RP_ID=localhost        # Relying Party ID
PASSKEY_ORIGIN=http://localhost:3000  # Relying Party Origin

# 可选配置
SITE_NAME=Kutt                 # 显示在认证提示中的站点名称
```

**最佳实践**：
- 开发环境：使用 `localhost` 和 `http://`
- 生产环境：使用实际域名和 `https://`
- 子域名：使用顶级域名作为 `RP_ID`（如 `example.com`）

## 📖 使用指南

### 用户端操作

#### 1. 注册 Passkey

1. 登录账户
2. 进入 **Settings** > **Security**
3. 找到 **Passkeys** 部分
4. 点击 **Add Passkey** 按钮
5. 输入 Passkey 名称（如"iPhone"、"Windows Hello"）
6. 点击 **Create Passkey**
7. 按照浏览器提示完成认证：
   - **Windows**：使用 Windows Hello（PIN/指纹/面部识别）
   - **macOS**：使用 Touch ID 或密码
   - **iOS/Android**：使用 Face ID/Touch ID/指纹
8. 注册成功！

#### 2. 使用 Passkey 登录

1. 访问登录页面
2. 输入邮箱地址
3. 点击 **Sign in with Passkey** 按钮
4. 按照浏览器提示进行身份验证
5. 自动登录成功！

#### 3. 管理 Passkeys

在 Settings 页面可以：
- ✏️ **重命名** Passkey
- 🗑️ **删除** Passkey（需要密码确认）
- 📊 查看 Passkey **创建时间**和**最后使用时间**

### 管理员配置

#### 强制启用 Passkey

修改 `server/handlers/auth.handler.js`：

```javascript
// 在 login 函数中添加检查
if (!user.passkey_enabled && env.REQUIRE_PASSKEY) {
  throw new CustomError("Please enable Passkey authentication.", 403);
}
```

添加环境变量：

```env
REQUIRE_PASSKEY=true
```

#### 禁用传统密码登录

在用户至少注册一个 Passkey 后，可以禁用密码登录：

```javascript
// 修改 login 路由
if (user.passkey_enabled) {
  throw new CustomError("Please use Passkey to sign in.", 400);
}
```

## 📚 API 文档

### 注册流程

#### 1. 初始化注册

```http
POST /api/v2/auth/passkey/register/init
Authorization: Bearer <JWT_TOKEN>
```

**响应示例**：
```json
{
  "challenge": "base64url-encoded-challenge",
  "rp": {
    "name": "Kutt",
    "id": "localhost"
  },
  "user": {
    "id": "1",
    "name": "user@example.com",
    "displayName": "user@example.com"
  },
  "pubKeyCredParams": [...],
  "timeout": 60000,
  "excludeCredentials": [...],
  "authenticatorSelection": {...},
  "attestation": "none"
}
```

#### 2. 验证注册

```http
POST /api/v2/auth/passkey/register/verify
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "credential": {
    "id": "credential-id",
    "rawId": "...",
    "response": {
      "attestationObject": "...",
      "clientDataJSON": "..."
    },
    "type": "public-key"
  },
  "name": "My iPhone"
}
```

**响应示例**：
```json
{
  "success": true,
  "message": "Passkey registered successfully.",
  "passkey": {
    "id": "pk_abc123",
    "name": "My iPhone",
    "created_at": "2025-01-10T12:00:00Z"
  }
}
```

### 认证流程

#### 1. 初始化认证

```http
POST /api/v2/auth/passkey/authenticate/init
Content-Type: application/json

{
  "email": "user@example.com"
}
```

**响应示例**：
```json
{
  "challenge": "base64url-encoded-challenge",
  "timeout": 60000,
  "rpId": "localhost",
  "allowCredentials": [
    {
      "id": "credential-id-1",
      "type": "public-key",
      "transports": ["internal"]
    }
  ],
  "userVerification": "preferred"
}
```

#### 2. 验证认证

```http
POST /api/v2/auth/passkey/authenticate/verify
Content-Type: application/json

{
  "email": "user@example.com",
  "credential": {
    "id": "credential-id",
    "rawId": "...",
    "response": {
      "authenticatorData": "...",
      "clientDataJSON": "...",
      "signature": "...",
      "userHandle": "..."
    },
    "type": "public-key"
  }
}
```

**响应示例**：
```json
{
  "token": "jwt-token",
  "user": {
    "id": 1,
    "email": "user@example.com"
  },
  "apikey": "api-key-here"
}
```

### 管理 API

#### 列出所有 Passkeys

```http
GET /api/v2/auth/passkey/list
Authorization: Bearer <JWT_TOKEN>
```

#### 删除 Passkey

```http
DELETE /api/v2/auth/passkey/:id
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "password": "user-password"
}
```

#### 重命名 Passkey

```http
PATCH /api/v2/auth/passkey/:id/rename
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "name": "New Name"
}
```

#### 获取状态

```http
GET /api/v2/auth/passkey/status
Authorization: Bearer <JWT_TOKEN>
```

**响应示例**：
```json
{
  "enabled": true,
  "count": 2
}
```

## 🔧 故障排除

### 常见问题

#### 1. "Passkeys are not supported in this browser"

**原因**：浏览器不支持 WebAuthn API

**解决方案**：
- 更新浏览器到最新版本
- 使用支持的浏览器（Chrome、Firefox、Safari、Edge）
- 检查浏览器是否禁用了 WebAuthn

#### 2. "The operation either timed out or was not allowed"

**原因**：用户取消了认证或超时

**解决方案**：
- 重新尝试
- 确保在 60 秒内完成认证
- 检查设备的生物识别功能是否正常

#### 3. "This origin is not allowed"

**原因**：`PASSKEY_ORIGIN` 配置与实际 URL 不匹配

**解决方案**：
```env
# 确保配置正确
PASSKEY_RP_ID=yourdomain.com
PASSKEY_ORIGIN=https://yourdomain.com

# 端口要匹配
# 错误：PASSKEY_ORIGIN=https://yourdomain.com:3000
# 正确：PASSKEY_ORIGIN=https://yourdomain.com
```

#### 4. 生产环境无法注册 Passkey

**原因**：生产环境未使用 HTTPS

**解决方案**：
- WebAuthn **必须在 HTTPS 环境**下运行（localhost 除外）
- 配置 SSL 证书
- 使用反向代理（Nginx/Caddy）启用 HTTPS

#### 5. "Challenge not found or expired"

**原因**：Challenge 过期或服务器重启

**解决方案**：
- 重新开始注册/认证流程
- **生产环境**：使用 Redis 存储 challenges
- 修改 `passkey.handler.js` 使用 Redis：

```javascript
// 使用 Redis 存储 (推荐生产环境)
const redis = require('../redis');
const CHALLENGE_TTL = 60; // 60 秒

// 存储 challenge
await redis.set(`passkey:challenge:${user.id}`, challenge, 'EX', CHALLENGE_TTL);

// 获取 challenge
const challenge = await redis.get(`passkey:challenge:${user.id}`);

// 删除 challenge
await redis.del(`passkey:challenge:${user.id}`);
```

### 调试技巧

#### 启用详细日志

在 `passkey.handler.js` 中添加：

```javascript
console.log('Registration options:', JSON.stringify(options, null, 2));
console.log('Credential received:', JSON.stringify(credential, null, 2));
console.log('Verification result:', verification);
```

#### 浏览器控制台检查

```javascript
// 检查 WebAuthn 支持
console.log('PublicKeyCredential supported:', window.PublicKeyCredential !== undefined);

// 检查平台认证器
PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
  .then(available => console.log('Platform authenticator:', available));
```

## 🎓 最佳实践

### 安全性

1. ✅ **始终使用 HTTPS**（生产环境）
2. ✅ **验证 RP ID** 与域名匹配
3. ✅ **检查签名计数器**（防重放攻击）
4. ✅ **存储挑战时设置过期时间**
5. ✅ **使用 Redis** 存储临时数据（生产环境）

### 用户体验

1. ✅ **提供清晰的命名提示**："My iPhone"、"Work Laptop"
2. ✅ **显示最后使用时间**
3. ✅ **允许多个 Passkeys**（备份）
4. ✅ **保留密码登录选项**（兼容性）
5. ✅ **提供详细的错误信息**

### 性能优化

1. ✅ **使用 Redis** 缓存 challenges
2. ✅ **限制 Passkey 数量**（每用户 5-10 个）
3. ✅ **定期清理过期 challenges**
4. ✅ **索引数据库字段**（`credential_id`、`user_id`）

## 📝 Commit 信息

完成后使用以下 commit 信息：

```
feat: add Passkey (WebAuthn) two-factor authentication support

Implemented comprehensive Passkey 2FA system with full frontend and backend integration:

Backend:
- Add database migration for passkeys table and user passkey_enabled field
- Implement passkey.handler.js with registration and authentication flows
- Add passkey queries for CRUD operations
- Integrate @simplewebauthn/server for WebAuthn protocol
- Add 8 new API endpoints for passkey management
- Support platform authenticators (Windows Hello, Touch ID, Face ID)

Frontend:
- Implement PasskeyManager component for user passkey management
- Add PasskeyLogin component for passwordless authentication
- Integrate @simplewebauthn/browser for WebAuthn client operations
- Add passkey API functions to api.ts
- Support multiple passkeys per user with rename/delete functionality

Features:
- Biometric authentication (Face ID, Touch ID, Windows Hello)
- Hardware security key support (YubiKey, Titan Key)
- Phishing-resistant authentication
- Counter-based replay protection
- Last used timestamp tracking
- User-friendly passkey naming

Configuration:
- Add PASSKEY_RP_ID and PASSKEY_ORIGIN environment variables
- Support both development (localhost) and production (HTTPS) environments
- Comprehensive documentation in PASSKEY_2FA_GUIDE.md

Breaking Changes: None (backward compatible, existing auth methods still work)
```

## 🔗 相关资源

- [WebAuthn 官方规范](https://www.w3.org/TR/webauthn/)
- [SimpleWebAuthn 文档](https://simplewebauthn.dev/)
- [MDN WebAuthn 指南](https://developer.mozilla.org/en-US/docs/Web/API/Web_Authentication_API)
- [FIDO Alliance](https://fidoalliance.org/)

---

**版本**: 1.0.0  
**最后更新**: 2025-01-10  
**维护者**: Kutt 开发团队
