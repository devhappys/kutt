# 故障排除指南 (Troubleshooting Guide)

## 502 Bad Gateway 错误

### 问题症状
- 前端显示 502 错误
- API 请求失败
- 控制台显示 "Failed to load resource: the server responded with a status of 502"

### 可能原因

1. **后端服务器未启动**
   - 检查后端是否正在运行
   - 运行: `pnpm dev` 或 `pnpm start`

2. **数据库连接问题**
   - 检查 `.env` 文件中的数据库配置
   - 确认数据库服务正在运行

3. **2FA 数据库迁移缺失**
   - 数据库缺少 `twofa_secret`, `twofa_enabled`, `twofa_backup_codes` 字段
   - 解决方案：手动添加字段或跳过2FA功能

### 解决步骤

#### 1. 检查后端服务器

```bash
# 查看后端进程
ps aux | grep node

# 或在Windows上
tasklist | findstr node
```

#### 2. 手动添加2FA数据库字段 (MySQL)

```sql
ALTER TABLE users 
ADD COLUMN twofa_secret VARCHAR(255) NULL,
ADD COLUMN twofa_enabled BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN twofa_backup_codes TEXT NULL;
```

#### 3. 手动添加2FA数据库字段 (PostgreSQL)

```sql
ALTER TABLE users 
ADD COLUMN twofa_secret VARCHAR(255),
ADD COLUMN twofa_enabled BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN twofa_backup_codes TEXT;
```

#### 4. 重启服务

```bash
# 停止所有服务
# Ctrl+C 或 kill 进程

# 重新启动后端
cd /path/to/kutt
pnpm dev

# 重新启动前端（新终端）
cd /path/to/kutt/client
pnpm dev
```

#### 5. 检查环境配置

**后端 `.env` 文件示例:**
```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=kutt
DB_CLIENT=mysql2

REDIS_ENABLED=false
SITE_NAME=Hapxs SUrl
DEFAULT_DOMAIN=s.hapxs.com
```

**前端 `client/.env.development` 文件:**
```env
VITE_API_URL=http://localhost:3000/api/v2
```

### 开发环境建议配置

1. **使用本地API**
   - 确保 `client/.env.development` 存在
   - API URL 设置为 `http://localhost:3000/api/v2`

2. **代理配置**
   - Vite 已配置代理，会自动转发 `/api` 请求到后端
   - 前端运行在 `http://localhost:3001`
   - 后端运行在 `http://localhost:3000`

3. **完整启动流程**

```bash
# 1. 启动后端
cd /path/to/kutt
pnpm dev

# 2. 在新终端启动前端
cd /path/to/kutt/client
pnpm dev

# 3. 访问
# 前端: http://localhost:3001/app
# 后端: http://localhost:3000/api/v2
```

## 常见错误

### Error: Unknown column 'twofa_secret'

**原因:** 数据库缺少2FA相关字段

**解决:** 
1. 执行上述SQL语句添加字段
2. 或临时禁用2FA功能（前端不调用2FA API）

### ECONNREFUSED

**原因:** 无法连接到后端服务器

**解决:**
1. 确认后端正在运行
2. 检查端口是否正确（默认3000）
3. 检查防火墙设置

### Network Error

**原因:** 前端无法连接到API

**解决:**
1. 检查 VITE_API_URL 配置
2. 确认CORS设置正确
3. 验证后端健康检查: `curl http://localhost:3000/health`

## 调试技巧

1. **查看后端日志**
```bash
# 后端应该显示详细的错误信息
pnpm dev
```

2. **查看前端网络请求**
   - 打开浏览器开发者工具
   - Network 标签页
   - 查看失败的请求详情

3. **测试API连接**
```bash
# 测试健康检查
curl http://localhost:3000/health

# 测试API端点
curl http://localhost:3000/api/v2/health
```

4. **清除缓存**
```bash
# 清除前端构建缓存
cd client
rm -rf node_modules/.vite
rm -rf dist

# 重新安装依赖
pnpm install
```

## 需要帮助？

如果问题仍未解决，请：
1. 查看完整的错误日志
2. 检查数据库连接
3. 确认所有环境变量设置正确
4. 提供错误堆栈信息以便进一步诊断
