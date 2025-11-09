# Docker Compose 更新指南

## 🔧 需要更新的配置

由于 Dockerfile 的工作目录已从 `/hapxs-surl` 更改为 `/app`，所有 docker-compose 文件都需要相应更新。

## ✅ 已自动更新的文件

- ✅ `docker-compose.postgres.yml`
- ✅ `docker-compose.sqlite-redis.yml`

## 📝 需要手动更新的文件

### 1. `docker-compose.yml`

**查找并替换以下内容：**

```yaml
# 旧配置
volumes:
  - custom:/hapxs-surl/custom

# 新配置
volumes:
  - custom:/app/custom
```

**添加 3001 端口映射（如果需要前端开发服务器）：**

```yaml
# 旧配置
ports:
  - 3000:3000

# 新配置
ports:
  - 3000:3000
  - 3001:3001  # 前端开发服务器
```

### 2. `docker-compose.mariadb.yml`

如果存在此文件，进行相同的更新：

```yaml
services:
  server:
    build:
      context: .
    volumes:
      - custom:/app/custom  # 从 /hapxs-surl/custom 改为 /app/custom
    environment:
      DB_CLIENT: mysql
      DB_HOST: mariadb
      DB_PORT: 3306
      REDIS_ENABLED: true
      REDIS_HOST: redis
      REDIS_PORT: 6379
    ports:
      - 3000:3000
      - 3001:3001  # 添加此行
    depends_on:
      mariadb:
        condition: service_healthy
      redis:
        condition: service_started
```

## 🚀 完整的 docker-compose.yml 模板

这是一个推荐的完整配置模板：

```yaml
version: '3.8'

services:
  server:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: kutt-server
    restart: unless-stopped
    volumes:
      - custom:/app/custom
      # 如果使用 SQLite：
      # - db_data_sqlite:/var/lib/hapxs-surl
    environment:
      # 数据库配置
      DB_CLIENT: ${DB_CLIENT:-sqlite}  # pg, mysql, sqlite
      DB_HOST: ${DB_HOST:-}
      DB_PORT: ${DB_PORT:-}
      DB_NAME: ${DB_NAME:-}
      DB_USER: ${DB_USER:-}
      DB_PASSWORD: ${DB_PASSWORD:-}
      
      # SQLite 配置（如果使用 SQLite）
      DB_FILENAME: ${DB_FILENAME:-/var/lib/hapxs-surl/data.sqlite}
      
      # Redis 配置
      REDIS_ENABLED: ${REDIS_ENABLED:-true}
      REDIS_HOST: ${REDIS_HOST:-redis}
      REDIS_PORT: ${REDIS_PORT:-6379}
      
      # 应用配置
      SITE_NAME: ${SITE_NAME:-Kutt}
      DEFAULT_DOMAIN: ${DEFAULT_DOMAIN:-localhost:3000}
      LINK_LENGTH: ${LINK_LENGTH:-6}
      JWT_SECRET: ${JWT_SECRET:-your-secret-key}
      
      # 邮件配置（可选）
      MAIL_HOST: ${MAIL_HOST:-}
      MAIL_PORT: ${MAIL_PORT:-}
      MAIL_SECURE: ${MAIL_SECURE:-}
      MAIL_USER: ${MAIL_USER:-}
      MAIL_PASSWORD: ${MAIL_PASSWORD:-}
      MAIL_FROM: ${MAIL_FROM:-}
      
      # 其他
      NODE_ENV: production
    ports:
      - "${PORT:-3000}:3000"
      - "3001:3001"  # 前端开发服务器（可选）
    depends_on:
      - redis
    networks:
      - kutt-network

  redis:
    image: redis:7-alpine
    container_name: kutt-redis
    restart: unless-stopped
    volumes:
      - redis_data:/data
    expose:
      - 6379
    networks:
      - kutt-network
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  # 可选：PostgreSQL 数据库
  # postgres:
  #   image: postgres:15-alpine
  #   container_name: kutt-postgres
  #   restart: unless-stopped
  #   environment:
  #     POSTGRES_DB: ${DB_NAME:-kutt}
  #     POSTGRES_USER: ${DB_USER:-kutt}
  #     POSTGRES_PASSWORD: ${DB_PASSWORD:-changeme}
  #   volumes:
  #     - db_data_pg:/var/lib/postgresql/data
  #   expose:
  #     - 5432
  #   networks:
  #     - kutt-network
  #   healthcheck:
  #     test: ["CMD", "pg_isready", "-U", "${DB_USER:-kutt}"]
  #     interval: 10s
  #     timeout: 5s
  #     retries: 5

  # 可选：MariaDB 数据库
  # mariadb:
  #   image: mariadb:10.11
  #   container_name: kutt-mariadb
  #   restart: unless-stopped
  #   environment:
  #     MYSQL_DATABASE: ${DB_NAME:-kutt}
  #     MYSQL_USER: ${DB_USER:-kutt}
  #     MYSQL_PASSWORD: ${DB_PASSWORD:-changeme}
  #     MYSQL_ROOT_PASSWORD: ${DB_ROOT_PASSWORD:-changeme}
  #   volumes:
  #     - db_data_mysql:/var/lib/mysql
  #   expose:
  #     - 3306
  #   networks:
  #     - kutt-network
  #   healthcheck:
  #     test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
  #     interval: 10s
  #     timeout: 5s
  #     retries: 5

volumes:
  custom:
  redis_data:
  # db_data_sqlite:  # 如果使用 SQLite
  # db_data_pg:      # 如果使用 PostgreSQL
  # db_data_mysql:   # 如果使用 MariaDB

networks:
  kutt-network:
    driver: bridge
```

## 🔍 关键修复点

### 问题 1: ENOENT 错误 - 找不到 package.json

**原因：** 工作目录不一致
**解决方案：** 将所有 volumes 路径从 `/hapxs-surl` 更新为 `/app`

```yaml
# ❌ 错误
volumes:
  - custom:/hapxs-surl/custom

# ✅ 正确
volumes:
  - custom:/app/custom
```

### 问题 2: 端口配置

Dockerfile 现在暴露了两个端口：
- **3000**: 后端 API 和生产环境前端
- **3001**: 前端开发服务器（可选）

```yaml
ports:
  - 3000:3000      # 主应用端口
  - 3001:3001      # 前端开发端口（可选）
```

## 📋 更新步骤

1. **备份现有配置**
   ```bash
   cp docker-compose.yml docker-compose.yml.backup
   ```

2. **更新路径**
   - 搜索所有 `/hapxs-surl/custom` 
   - 替换为 `/app/custom`

3. **添加端口映射**（如果需要）
   ```yaml
   ports:
     - 3000:3000
     - 3001:3001
   ```

4. **重建容器**
   ```bash
   docker-compose down
   docker-compose build --no-cache
   docker-compose up -d
   ```

## ⚠️ 重要说明

### 为什么不能自动更新？

- `docker-compose.yml` 在 `.gitignore` 中
- `docker-compose.mariadb.yml` 在 `.gitignore` 中
- 这些文件通常包含敏感配置，每个部署环境可能不同

### 数据迁移

如果你已经有运行中的容器，volumes 数据会保留。但为安全起见：

```bash
# 1. 导出现有数据
docker-compose exec server sh -c "cd /hapxs-surl && tar czf /tmp/backup.tar.gz custom/"
docker cp <container_id>:/tmp/backup.tar.gz ./backup.tar.gz

# 2. 更新配置并重建

# 3. 恢复数据（如果需要）
docker cp ./backup.tar.gz <new_container_id>:/tmp/
docker-compose exec server sh -c "cd /app && tar xzf /tmp/backup.tar.gz"
```

## ✅ 验证配置

更新后，运行以下命令验证：

```bash
# 1. 检查配置语法
docker-compose config

# 2. 查看服务状态
docker-compose ps

# 3. 查看日志
docker-compose logs -f server

# 4. 进入容器检查
docker-compose exec server sh
ls -la /app
cat /app/package.json
```

## 🎯 快速修复脚本

创建 `fix-docker-compose.sh` 脚本：

```bash
#!/bin/bash

echo "🔧 Fixing docker-compose configurations..."

# 更新所有 docker-compose 文件
for file in docker-compose*.yml; do
  if [ -f "$file" ]; then
    echo "📝 Updating $file..."
    sed -i.bak 's|/hapxs-surl/custom|/app/custom|g' "$file"
    echo "✅ $file updated"
  fi
done

echo "🎉 All files updated!"
echo "💾 Backup files created with .bak extension"
echo ""
echo "Next steps:"
echo "1. Review changes: git diff"
echo "2. Rebuild: docker-compose build --no-cache"
echo "3. Restart: docker-compose up -d"
```

运行脚本：
```bash
chmod +x fix-docker-compose.sh
./fix-docker-compose.sh
```

## 📞 需要帮助？

如果遇到问题，检查以下几点：

1. ✅ Dockerfile WORKDIR 是否为 `/app`
2. ✅ docker-compose volumes 是否指向 `/app/custom`
3. ✅ 是否使用 `--no-cache` 重新构建
4. ✅ 环境变量是否正确配置
5. ✅ 端口是否被占用

查看详细日志：
```bash
docker-compose logs -f --tail=100 server
```
