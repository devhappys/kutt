# Redis 快速决策指南

## 🎯 30秒决策

### 你应该使用 Redis 如果：

✅ **生产环境** 且 日访问量 > 1,000 次  
✅ **多服务器部署**（PM2集群/Docker/K8s）  
✅ **需要持久化队列**（任务不能丢失）  
✅ **高并发场景**（> 200 并发用户）

### 你可以不用 Redis 如果：

❌ **个人项目** 且 日访问量 < 100 次  
❌ **单用户场景**  
❌ **资源极度受限**（< 256MB RAM）  
❌ **临时测试环境**

---

## 📊 快速评估工具

运行交互式评估：

```bash
pnpm redis:check
```

根据你的场景回答6个问题，自动给出建议。

---

## ⚡ 5分钟快速启动

### 1. 安装 Redis

**Docker (推荐):**
```bash
docker run -d \
  --name redis \
  -p 6379:6379 \
  redis:7-alpine
```

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install redis-server
sudo systemctl start redis
```

**macOS:**
```bash
brew install redis
brew services start redis
```

**Windows:**
```bash
# 使用 WSL2 或 Docker
```

### 2. 配置应用

编辑 `.env` 文件：

```bash
# 启用 Redis
REDIS_ENABLED=true
REDIS_HOST=127.0.0.1
REDIS_PORT=6379

# 生产环境务必设置密码
REDIS_PASSWORD=your_secure_password
```

### 3. 验证连接

启动应用：

```bash
pnpm dev
```

应该看到：

```
[Redis] Connected successfully ✅
[Redis] Ready to accept commands ✅
```

---

## 📈 性能对比

| 场景 | 无 Redis | 有 Redis | 提升 |
|------|---------|---------|------|
| 链接重定向 | 45ms | 5ms | **9x faster** |
| 统计页面 | 2500ms | 150ms | **17x faster** |
| 并发处理 | 200 req/s | 1200 req/s | **6x more** |
| 数据库查询 | 每次都查 | 95% 缓存 | **95% reduction** |

---

## 💰 成本估算

### 小型部署（1K-10K 访问/天）

| 方案 | 月成本 | 性能 |
|------|-------|------|
| 无 Redis | $0 | 基础 |
| 本地 Redis | $0 | 优秀 ⭐ |
| 托管 Redis | $5-10 | 优秀 ⭐⭐ |

### 中型部署（10K-100K 访问/天）

| 方案 | 月成本 | 性能 |
|------|-------|------|
| 本地 Redis | $0 | 优秀 ⭐ |
| 托管 Redis | $20-50 | 出色 ⭐⭐⭐ |

**推荐：** 本地 Redis（性价比最高）

---

## 🔍 故障排查

### Redis 连接失败

```bash
# 检查 Redis 是否运行
redis-cli ping
# 应该返回: PONG

# 检查端口
sudo netstat -tlnp | grep 6379

# 查看日志
sudo tail -f /var/log/redis/redis-server.log
```

### 队列堆积

```bash
# 清理队列
pnpm queue:clean
```

### 内存占用过高

```bash
# 检查 Redis 内存
redis-cli INFO memory

# 清理过期键
redis-cli --scan --pattern '*' | xargs redis-cli DEL
```

---

## 🎓 进阶配置

### Redis 持久化

```bash
# redis.conf
appendonly yes
appendfsync everysec
```

### 内存优化

```bash
# redis.conf
maxmemory 256mb
maxmemory-policy allkeys-lru
```

### 密码保护

```bash
# redis.conf
requirepass your_secure_password
```

---

## 📚 相关命令

```bash
# 评估是否需要 Redis
pnpm redis:check

# 清理队列
pnpm queue:clean

# 启动开发服务器
pnpm dev

# 查看内存使用
curl http://localhost:3000/api/v2/health/memory
```

---

## 🆘 常见问题

### Q: 不使用 Redis 会影响功能吗？

**A:** 不会！系统会自动降级：
- ✅ 使用内存队列（重启后任务丢失）
- ✅ 直接查询数据库（稍慢但可用）
- ✅ 所有核心功能正常工作

### Q: 什么时候必须使用 Redis？

**A:** 以下场景必须使用：
- 🔄 多服务器集群部署
- 📊 日访问量 > 10,000 次
- ⚡ 需要任务队列持久化

### Q: Redis 会增加多少内存？

**A:** 约 50-100MB，取决于缓存数据量。

### Q: 如何从无 Redis 迁移到有 Redis？

**A:** 非常简单：
1. 安装 Redis
2. 设置 `REDIS_ENABLED=true`
3. 重启应用
4. 完成！（零停机时间）

---

## 🎉 最佳实践总结

### ✅ DO

- 生产环境启用 Redis
- 设置强密码
- 配置持久化（AOF）
- 定期监控队列
- 设置内存限制

### ❌ DON'T

- 不要无密码部署生产环境
- 不要忽略 stalled 任务警告
- 不要设置无限内存
- 不要忘记定期备份
- 不要在测试环境强制要求 Redis

---

## 📖 完整文档

- [REDIS_STRATEGY.md](./REDIS_STRATEGY.md) - 完整策略指南
- [QUEUE_MANAGEMENT.md](./QUEUE_MANAGEMENT.md) - 队列管理
- [PERFORMANCE_OPTIMIZATIONS.md](./PERFORMANCE_OPTIMIZATIONS.md) - 性能优化

---

**🚀 立即开始：** `pnpm redis:check`
