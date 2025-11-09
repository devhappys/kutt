# 内存监控系统

## 概述

后端服务集成了自动内存监控系统，限制内存使用不超过 **500MB**，确保服务稳定运行。

## 功能特性

### 自动监控
- ✅ 每30秒检查一次内存使用情况
- ✅ 当内存达到400MB（80%阈值）时发出警告
- ✅ 当内存达到475MB（95%阈值）时进入临界状态
- ✅ 自动触发垃圾回收和缓存清理

### Node.js 配置
服务启动时使用以下参数：
```bash
node --expose-gc --max-old-space-size=500 server/server.js
```

- `--expose-gc`: 允许手动触发垃圾回收
- `--max-old-space-size=500`: 限制堆内存为500MB

## API 端点

### 1. 健康检查（公开）
```http
GET /api/v2/health
```

**响应示例：**
```json
{
  "status": "ok",
  "uptime": "2h 15m 30s",
  "memory": {
    "current": {
      "rss": 245,
      "heapTotal": 180,
      "heapUsed": 156,
      "external": 12
    },
    "limit": 500,
    "percentage": 31,
    "status": "healthy",
    "thresholds": {
      "warning": 400,
      "critical": 475,
      "limit": 500
    }
  },
  "timestamp": "2025-11-09T13:50:00.000Z"
}
```

### 2. 详细内存统计（需要管理员权限）
```http
GET /api/v2/health/memory
Authorization: Bearer <admin_token>
```

**响应示例：**
```json
{
  "current": {
    "rss": 245,
    "heapTotal": 180,
    "heapUsed": 156,
    "external": 12
  },
  "limit": 500,
  "percentage": 31,
  "status": "healthy",
  "thresholds": {
    "warning": 400,
    "critical": 475,
    "limit": 500
  },
  "process": {
    "pid": 12345,
    "uptime": 8130.5,
    "platform": "linux",
    "nodeVersion": "v18.11.9",
    "cpuUsage": {
      "user": 5000000,
      "system": 2000000
    }
  }
}
```

### 3. 手动触发垃圾回收（需要管理员权限）
```http
POST /api/v2/health/gc
Authorization: Bearer <admin_token>
```

**响应示例：**
```json
{
  "message": "Garbage collection triggered",
  "freed": "25MB",
  "before": {
    "rss": 245,
    "heapTotal": 180,
    "heapUsed": 156,
    "external": 12
  },
  "after": {
    "rss": 220,
    "heapTotal": 180,
    "heapUsed": 131,
    "external": 12
  }
}
```

### 4. 清理缓存（需要管理员权限）
```http
POST /api/v2/health/clear-cache
Authorization: Bearer <admin_token>
```

**响应示例：**
```json
{
  "message": "Caches cleared",
  "clearedItems": 156,
  "memoryFreed": "18MB",
  "before": {
    "rss": 245,
    "heapTotal": 180,
    "heapUsed": 156,
    "external": 12
  },
  "after": {
    "rss": 227,
    "heapTotal": 180,
    "heapUsed": 138,
    "external": 12
  }
}
```

## 内存状态说明

### Healthy（健康）
- 内存使用 < 400MB
- 正常运行，无需干预

### Warning（警告）
- 内存使用 400MB - 475MB
- 系统开始监控，可能触发垃圾回收

### Critical（临界）
- 内存使用 >= 475MB
- 自动采取以下措施：
  1. 立即清理Redis缓存
  2. 触发强制垃圾回收
  3. 清理过期的缓存条目
  4. 记录详细日志

## 监控日志

### 正常日志
```
[Memory Monitor] Starting memory monitoring (limit: 500MB, check interval: 30s)
[Memory Monitor] Initial memory usage: {
  "rss": 120,
  "heapTotal": 80,
  "heapUsed": 65,
  "external": 8
}
[Memory Monitor] Periodic report: Heap 156/180MB, RSS 245MB, External 12MB
```

### 警告日志
```
[Memory Monitor] WARNING: Memory usage at 420MB (84%)
[Memory Monitor] Garbage collection freed 25MB
```

### 临界日志
```
[Memory Monitor] CRITICAL: Memory usage at 480MB (96%)
[Memory Monitor] Clearing caches to free up memory...
[Memory Monitor] Cleared 156 Redis cache entries
[Memory Monitor] Garbage collection freed 30MB
```

### 持续高内存日志
```
[Memory Monitor] ALERT: Memory remains critically high after 3 attempts to free memory
[Memory Monitor] Current usage: {
  "rss": 485,
  "heapTotal": 500,
  "heapUsed": 478,
  "external": 15
}
```

## 自动清理策略

### Redis缓存清理
- 清理TTL < 5分钟的缓存条目
- 优先清理访问统计缓存
- 保留用户会话和重要数据

### 垃圾回收触发条件
- 内存达到警告阈值（400MB）且距上次GC超过1分钟
- 内存达到临界阈值（475MB）且距上次GC超过10秒
- 管理员手动触发

### 模块缓存清理
- 清理非核心模块的require缓存
- 保留Express等关键依赖
- 仅清理查询结果和临时模块

## 最佳实践

### 开发环境
```bash
# 启动开发服务器（已包含内存监控）
pnpm dev
```

### 生产环境
```bash
# 启动生产服务器
pnpm start

# 使用PM2（推荐）
pm2 start server/server.js --name kutt \
  --node-args="--enable-source-maps --expose-gc --max-old-space-size=500"
```

### Docker部署
在`Dockerfile`中确保启动命令包含内存限制：
```dockerfile
CMD ["node", "--enable-source-maps", "--expose-gc", "--max-old-space-size=500", "server/server.js"]
```

### 监控建议
1. **定期检查** `/api/v2/health` 端点
2. **设置告警** 当status为"critical"时通知运维
3. **分析日志** 查找内存使用模式
4. **优化代码** 如果频繁达到警告阈值

## 故障排查

### 内存持续增长
1. 检查是否有内存泄漏
2. 查看Redis缓存大小
3. 检查长时间运行的队列任务
4. 分析慢查询和大数据集

### 频繁触发GC
1. 减少同时处理的请求数
2. 优化数据库查询
3. 增加缓存过期时间
4. 考虑分布式部署

### 性能下降
1. 检查CPU使用率
2. 查看数据库连接数
3. 监控Redis性能
4. 分析访问日志

## 内存指标说明

- **RSS (Resident Set Size)**: 进程占用的物理内存总量
- **Heap Total**: V8引擎分配的堆内存总量
- **Heap Used**: 实际使用的堆内存
- **External**: V8外部分配的内存（如Buffer）

## 相关文件

- `server/utils/memoryMonitor.js` - 内存监控核心逻辑
- `server/handlers/health.handler.js` - 健康检查API处理
- `server/routes/health.routes.js` - 健康检查路由
- `server/server.js` - 启动内存监控
- `package.json` - Node.js启动参数配置
