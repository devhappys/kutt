# Docker 用户权限配置指南

## ✅ 已实施的安全改进

### 1. 非 Root 用户

Dockerfile 现在创建并使用专用的非 root 用户：

- **用户名**: `kutt`
- **用户 ID**: `1000`
- **组名**: `kutt`
- **组 ID**: `1000`
- **家目录**: `/app`

### 2. 为什么使用非 Root 用户？

#### 安全优势

| 方面 | Root 用户 | 非 Root 用户 (kutt) |
|------|----------|---------------------|
| **容器逃逸风险** | ⚠️ 高 - 可能获得主机 root 权限 | ✅ 低 - 权限受限 |
| **文件系统保护** | ❌ 可修改任何文件 | ✅ 只能修改授权的文件 |
| **进程隔离** | ⚠️ 可能影响其他进程 | ✅ 独立隔离 |
| **最小权限原则** | ❌ 违反 | ✅ 遵循 |

#### 解决的问题

1. **ENOENT 错误** - 权限问题导致找不到文件
2. **Volume 挂载问题** - 主机和容器权限不匹配
3. **安全合规** - 符合 Docker 安全最佳实践

## 📋 Dockerfile 改进详解

### 创建用户

```dockerfile
# create non-root user and group
RUN addgroup -g 1000 kutt && \
    adduser -D -u 1000 -G kutt -h /app kutt
```

**参数说明：**
- `-g 1000`: 指定组 ID 为 1000（与大多数 Linux 用户匹配）
- `-D`: 不设置密码
- `-u 1000`: 指定用户 ID 为 1000
- `-G kutt`: 添加到 kutt 组
- `-h /app`: 设置家目录

### 设置文件所有权

```dockerfile
# copy with correct ownership
COPY --chown=kutt:kutt server ./server
COPY --chown=kutt:kutt custom ./custom
```

**作用：**
- 复制文件时直接设置所有者为 `kutt:kutt`
- 避免额外的 `chown` 命令
- 减少镜像层大小

### 切换用户

```dockerfile
# switch to non-root user
USER kutt
```

**效果：**
- 后续所有命令以 `kutt` 用户执行
- 容器启动时以 `kutt` 用户运行应用

## 🔧 Docker Compose 配置

### 推荐配置

```yaml
services:
  server:
    build:
      context: .
    # 指定用户（可选，Dockerfile 已设置）
    user: "1000:1000"
    volumes:
      # 确保 volumes 权限正确
      - custom:/app/custom
      - db_data:/var/lib/hapxs-surl
    environment:
      # 应用配置...
      HOME: /app
```

### Volume 权限配置

#### 方法 1: 使用命名卷（推荐）

```yaml
volumes:
  custom:
    driver: local
    driver_opts:
      type: none
      o: bind
      device: ./custom
  db_data:
    driver: local
```

**优势：**
- Docker 自动管理权限
- 跨平台兼容
- 数据持久化

#### 方法 2: 绑定挂载（开发环境）

```yaml
services:
  server:
    volumes:
      - ./custom:/app/custom:rw
      - ./db:/var/lib/hapxs-surl:rw
```

**设置主机目录权限：**

**Linux/Mac:**
```bash
# 创建目录
mkdir -p custom db

# 设置所有者为当前用户（UID 1000）
sudo chown -R 1000:1000 custom db

# 或设置为当前用户
chown -R $USER:$USER custom db

# 设置权限
chmod -R 755 custom
chmod -R 755 db
```

**Windows (WSL2):**
```powershell
# 在 WSL 中执行
mkdir -p custom db
chown -R 1000:1000 custom db
```

## 🚀 部署步骤

### 1. 清理旧容器和镜像

```bash
# 停止并删除容器
docker-compose down -v

# 删除旧镜像（可选）
docker rmi $(docker images -q kutt*)
```

### 2. 重新构建

```bash
# 无缓存构建
docker-compose build --no-cache

# 或指定服务
docker-compose build --no-cache server
```

### 3. 创建并设置 Volumes

```bash
# 创建 volumes
docker volume create kutt_custom
docker volume create kutt_db_data

# 检查 volumes
docker volume ls
docker volume inspect kutt_custom
```

### 4. 启动服务

```bash
# 启动
docker-compose up -d

# 查看日志
docker-compose logs -f server
```

### 5. 验证权限

```bash
# 进入容器
docker-compose exec server sh

# 检查当前用户
whoami  # 应该显示 "kutt"
id      # 应该显示 uid=1000(kutt) gid=1000(kutt)

# 检查文件权限
ls -la /app
ls -la /var/lib/hapxs-surl

# 测试写入权限
touch /app/test.txt
rm /app/test.txt

# 退出
exit
```

## 🐛 故障排查

### 问题 1: Permission Denied

**错误信息：**
```
Error: EACCES: permission denied, open '/app/custom/something'
```

**解决方案：**

```bash
# 停止容器
docker-compose down

# 检查 volume 权限
docker volume inspect kutt_custom

# 删除并重新创建 volume
docker volume rm kutt_custom
docker volume create kutt_custom

# 或在主机上修复权限（绑定挂载）
sudo chown -R 1000:1000 ./custom
```

### 问题 2: 仍然显示 Root 用户

**检查：**
```bash
docker-compose exec server id
```

**如果显示 uid=0(root)，检查：**

1. Dockerfile 是否有 `USER kutt`
2. docker-compose.yml 中是否有 `user: root` 覆盖
3. 是否使用了旧的镜像缓存

**解决：**
```bash
docker-compose build --no-cache
docker-compose up -d --force-recreate
```

### 问题 3: ENOENT - /kutt/package.json

**原因：** 可能是环境变量或配置文件中硬编码了路径

**检查位置：**

1. **环境变量：**
```bash
docker-compose exec server env | grep -i kutt
docker-compose exec server env | grep -i workdir
```

2. **package.json scripts：**
```bash
docker-compose exec server cat /app/package.json
```

3. **进程工作目录：**
```bash
docker-compose exec server pwd
docker-compose exec server sh -c "cd /app && pwd"
```

**修复：**
- 确保所有路径引用 `/app` 而非 `/kutt` 或 `/hapxs-surl`
- 检查 CMD 命令是否正确

### 问题 4: Database Migration 失败

**错误：**
```
Error: EACCES: permission denied, mkdir '/var/lib/hapxs-surl'
```

**解决：**

1. **检查目录权限：**
```bash
docker-compose exec server ls -la /var/lib/
```

2. **重新构建镜像：**
```bash
docker-compose build --no-cache
```

3. **手动修复（临时）：**
```bash
docker-compose exec -u root server chown -R kutt:kutt /var/lib/hapxs-surl
docker-compose restart server
```

## 📊 权限验证清单

运行此脚本验证所有权限配置：

```bash
#!/bin/bash

echo "🔍 Docker 权限验证"
echo "===================="
echo ""

echo "1️⃣ 检查容器用户..."
USER_INFO=$(docker-compose exec -T server id)
echo "$USER_INFO"
if [[ $USER_INFO == *"uid=1000(kutt)"* ]]; then
    echo "✅ 用户正确"
else
    echo "❌ 用户错误"
fi
echo ""

echo "2️⃣ 检查 /app 权限..."
docker-compose exec -T server ls -ld /app
echo ""

echo "3️⃣ 检查 package.json 位置..."
if docker-compose exec -T server test -f /app/package.json; then
    echo "✅ /app/package.json 存在"
else
    echo "❌ /app/package.json 不存在"
fi
echo ""

echo "4️⃣ 检查数据目录权限..."
docker-compose exec -T server ls -ld /var/lib/hapxs-surl
echo ""

echo "5️⃣ 检查写入权限..."
if docker-compose exec -T server sh -c "touch /app/test.txt && rm /app/test.txt"; then
    echo "✅ 写入权限正常"
else
    echo "❌ 写入权限异常"
fi
echo ""

echo "6️⃣ 检查进程..."
docker-compose exec -T server ps aux | grep node
echo ""

echo "===================="
echo "✅ 验证完成"
```

保存为 `check-permissions.sh` 并运行：
```bash
chmod +x check-permissions.sh
./check-permissions.sh
```

## 🔐 安全最佳实践

### 1. 永远不要在生产环境使用 Root

```dockerfile
# ❌ 错误
FROM node:24-alpine
# ... 没有创建用户
CMD ["node", "server.js"]

# ✅ 正确
FROM node:24-alpine
RUN addgroup -g 1000 appuser && adduser -D -u 1000 -G appuser appuser
USER appuser
CMD ["node", "server.js"]
```

### 2. 最小权限原则

只给应用所需的最小权限：

```dockerfile
# 只设置必要目录的权限
RUN chown kutt:kutt /app /var/lib/hapxs-surl

# 设置只读权限（如果可能）
COPY --chown=kutt:kutt --chmod=444 config.json ./
```

### 3. 使用 .dockerignore

防止敏感文件进入镜像：

```
.git
.env
*.key
*.pem
node_modules
```

### 4. 扫描镜像安全漏洞

```bash
# 使用 Docker Scout
docker scout cves kutt:latest

# 使用 Trivy
trivy image kutt:latest
```

## 📖 参考资源

- [Docker Security Best Practices](https://docs.docker.com/develop/security-best-practices/)
- [Node.js Docker Best Practices](https://github.com/nodejs/docker-node/blob/main/docs/BestPractices.md)
- [OWASP Docker Security](https://cheatsheetseries.owasp.org/cheatsheets/Docker_Security_Cheat_Sheet.html)

## 🎯 总结

### 关键改进

✅ **创建专用用户** - UID/GID 1000  
✅ **设置文件所有权** - 使用 `--chown` 标志  
✅ **切换到非 Root** - `USER kutt`  
✅ **正确的目录权限** - `/app` 和 `/var/lib/hapxs-surl`  
✅ **环境变量配置** - `HOME=/app`  

### 安全级别

| 配置 | 之前 | 现在 |
|------|------|------|
| 用户 | root (UID 0) | kutt (UID 1000) |
| 权限 | 完全访问 | 受限访问 |
| 安全等级 | ⚠️ 低 | ✅ 高 |

### 下一步

1. ✅ 重新构建镜像
2. ✅ 运行权限验证脚本
3. ✅ 测试应用功能
4. ✅ 检查日志确认无错误
5. ✅ 部署到生产环境

如有问题，请参考故障排查部分！
