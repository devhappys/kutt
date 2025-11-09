# Redis Queue Management Guide

## 问题：Visit Job Stalled

### 什么是 "stalled" 任务？

当 Bull 队列中的任务在处理时超过锁定时间（lock duration）仍未完成，会被标记为 "stalled"（停滞）。

**常见原因：**
1. ⏱️ 任务处理时间过长（超过60秒）
2. 💥 Worker 进程崩溃或被强制终止
3. 🔌 Redis 连接暂时中断
4. 🔄 服务器重启时留下未完成的任务

---

## 解决方案

### 方法 1：重启服务器（推荐）

重启会自动清理所有 stalled 任务：

```bash
# 停止服务器（Ctrl+C）
# 重新启动
pnpm dev
```

**启动时会看到：**
```
[Redis] Connected successfully
[Redis] Ready to accept commands
[Visit Queue] Queue ready, cleaning up old jobs...
[Visit Queue] Found 10 stalled jobs, cleaning...
[Visit Queue] Cleanup complete
```

### 方法 2：手动清理队列

使用清理脚本：

```bash
node server/scripts/clean-queue.js
```

**输出示例：**
```
🔧 Connecting to Redis queue...

📊 Current queue stats:
   Waiting: 0
   Active: 0
   Completed: 523
   Failed: 15
   Delayed: 0
   Stalled: 12

🧹 Cleaning queue...
   ✓ Removed 523 completed jobs
   ✓ Removed 15 failed jobs

⚠️  Found 12 stalled jobs, moving to failed...
   ✓ Removed 12 failed (including stalled) jobs

✅ Final queue stats:
   Waiting: 0
   Active: 0
   Completed: 0
   Failed: 0
   Delayed: 0

✨ Queue cleaned successfully!
```

### 方法 3：Redis CLI 手动清理

```bash
# 连接到 Redis
redis-cli

# 查看所有 Bull 队列的键
KEYS bull:visit:*

# 删除所有 visit 队列数据（谨慎使用！）
EVAL "return redis.call('del', unpack(redis.call('keys', 'bull:visit:*')))" 0

# 或者删除特定的 stalled 键
DEL bull:visit:stalled
```

---

## 队列优化配置

### 当前配置（已优化）

```javascript
// server/queues/queues.js
settings: {
  maxStalledCount: 1,        // 只重试一次
  lockDuration: 60000,       // 60秒锁定时间（增加了）
  lockRenewTime: 30000,      // 每30秒续锁
  stalledInterval: 30000,    // 每30秒检查stalled任务
}
```

### 启动时自动清理

服务器启动时会：
1. ✅ 清理所有已完成的任务
2. ✅ 清理所有失败的任务
3. ✅ 将所有 stalled 任务移至失败队列
4. ✅ 清理失败队列

### 定期清理

每分钟自动清理：
- 5秒前完成的任务
- 10秒前失败的任务

---

## 监控队列健康

### 查看队列状态

使用 Redis CLI：

```bash
redis-cli

# 查看队列中的任务数量
HLEN bull:visit:id

# 查看等待中的任务
LLEN bull:visit:wait

# 查看活动中的任务
ZCARD bull:visit:active

# 查看失败的任务
ZCARD bull:visit:failed

# 查看 stalled 任务
ZCARD bull:visit:stalled
```

### 日志监控

服务器日志会显示：

```bash
# 正常情况
[Visit Queue] Cleaning up old jobs...
[Visit Queue] Cleanup complete

# 发现 stalled 任务
[Visit Queue] Found 5 stalled jobs, cleaning...
[Visit Queue] Job stalled: 1234 - will be retried once

# 任务失败
[Visit Queue] Job failed: 5678 Error: ...
```

---

## 预防措施

### 1. 适当的锁定时间

确保 `lockDuration` 足够长：
- 简单任务：30秒
- 复杂任务：60秒
- 非常复杂：120秒

```javascript
lockDuration: 60000, // 60 秒
```

### 2. 优化任务处理器

确保 visit 处理器高效：

```javascript
// server/queues/visit.js
module.exports = async function({ data }) {
  try {
    // 使用异步操作
    await query.visit.add(...)
    await statsQuery.addDetailedVisit(...)
  } catch (error) {
    console.error("Visit processing error:", error);
    throw error; // 让任务失败而不是超时
  }
}
```

### 3. 合理的并发数

```javascript
// 根据服务器性能调整
visit.process(12, path.resolve(__dirname, "visit.js"));
```

### 4. 错误处理

确保所有异步操作都有错误处理：

```javascript
try {
  await someAsyncOperation();
} catch (error) {
  console.error(error);
  throw error; // 重要：抛出错误以标记任务失败
}
```

---

## 常见问题

### Q: 为什么会出现这么多 stalled 任务？

**A:** 通常是因为：
1. 服务器之前崩溃或被强制终止
2. Redis 连接临时中断
3. 任务处理时间过长
4. 之前的 lockDuration 设置太短（30秒）

### Q: Stalled 任务会被重新处理吗？

**A:** 是的，stalled 任务会被重试一次（`maxStalledCount: 1`）。如果再次失败，会被移至失败队列并删除。

### Q: 删除 stalled 任务会丢失数据吗？

**A:** 不会。访问统计是"尽力而为"的系统：
- 大多数访问会被正确记录
- 少量失败的访问不会影响整体统计
- 用户体验不受影响（重定向仍然工作）

### Q: 如何完全禁用队列？

**A:** 设置环境变量：

```bash
REDIS_ENABLED=false
```

这会使用内存队列（带背压机制），但不会持久化。

---

## 性能建议

### 生产环境

```bash
# .env
REDIS_ENABLED=true
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
```

**优点：**
- ✅ 任务持久化
- ✅ 支持高并发
- ✅ 自动重试失败任务

### 小规模部署

```bash
REDIS_ENABLED=false
```

**优点：**
- ✅ 无需额外服务
- ✅ 更简单的部署
- ✅ 内置背压保护

**限制：**
- ⚠️ 任务不持久化
- ⚠️ 服务器重启会丢失队列

---

## 故障排查步骤

1. **检查 Redis 连接**
   ```bash
   redis-cli ping
   # 应该返回: PONG
   ```

2. **查看队列状态**
   ```bash
   node server/scripts/clean-queue.js
   ```

3. **检查服务器日志**
   ```bash
   # 查找错误信息
   grep "Visit Queue" logs/server.log
   ```

4. **重启服务器**
   ```bash
   pnpm dev
   ```

5. **如果问题持续**
   - 增加 `lockDuration` 到 120000 (2分钟)
   - 减少并发数到 6
   - 检查数据库性能

---

## 相关文件

- `server/queues/queues.js` - 队列配置
- `server/queues/visit.js` - 访问处理器
- `server/scripts/clean-queue.js` - 清理脚本
- `MEMORY_MONITORING.md` - 内存监控文档
- `PERFORMANCE_OPTIMIZATIONS.md` - 性能优化文档
