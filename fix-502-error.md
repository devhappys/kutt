# 快速修复 502 错误

## 立即执行的步骤

### 1. 检查后端是否运行

打开新的终端/PowerShell窗口：

```powershell
# 进入项目根目录
cd f:\Repositories\GitHub\kutt

# 启动后端服务器
pnpm dev
```

**期望输出:**
```
> hapxs-surl@3.2.3 dev
> node --enable-source-maps --watch-path=./server --watch-path=./custom server/server.js

Server listening on http://localhost:3000
```

如果看到数据库错误，继续下一步。

### 2. 添加2FA数据库字段（如果使用MySQL）

连接到你的MySQL数据库：

```sql
USE kutt;  -- 或你的数据库名称

-- 添加2FA字段
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS twofa_secret VARCHAR(255) NULL,
ADD COLUMN IF NOT EXISTS twofa_enabled BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS twofa_backup_codes TEXT NULL;

-- 验证字段已添加
DESCRIBE users;
```

### 3. 重启前端开发服务器

打开新的终端窗口：

```powershell
# 进入客户端目录
cd f:\Repositories\GitHub\kutt\client

# 停止当前运行的前端（如果有）
# Ctrl + C

# 重新启动前端
pnpm dev
```

### 4. 清除浏览器缓存

1. 打开浏览器开发者工具 (F12)
2. 右键点击刷新按钮
3. 选择"清空缓存并硬性重新加载"

### 5. 验证修复

访问: `http://localhost:3001/app`

应该能够正常加载页面并进行API请求。

## 如果仍然502错误

### 检查端口占用

```powershell
# 检查3000端口是否被占用
netstat -ano | findstr :3000

# 如果被占用，找到PID并关闭进程
taskkill /PID <进程ID> /F
```

### 检查后端日志

查看后端终端窗口的详细错误信息，特别注意：
- 数据库连接错误
- 端口冲突
- 模块加载失败

### 临时禁用2FA（如果数据库迁移失败）

编辑 `server/handlers/twofa.handler.js`，所有函数都已添加了数据库字段检查，应该不会崩溃。

## 开发环境配置文件已创建

以下文件已自动创建：

- ✅ `client/.env.development` - 本地开发API配置
- ✅ `client/.env.production` - 生产环境API配置  
- ✅ `client/src/lib/errorHandler.ts` - 改进的错误处理
- ✅ `TROUBLESHOOTING.md` - 详细故障排除指南

## 当前配置

**后端:** `http://localhost:3000`
**前端:** `http://localhost:3001`
**API代理:** 前端会自动代理 `/api` 请求到后端

## 需要进一步帮助？

查看详细的故障排除指南：
- 阅读 `TROUBLESHOOTING.md`
- 检查后端控制台的完整错误日志
- 验证 `.env` 文件配置正确
