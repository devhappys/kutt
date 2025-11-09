# 新功能安装指南

本指南将帮助您安装和配置新添加的标签系统和 QR 码生成功能。

## 📦 安装步骤

### 1. 安装依赖

项目已添加了 `qrcode` 包作为依赖。运行以下命令安装：

```bash
npm install
```

这将安装所有依赖，包括新添加的 `qrcode@1.5.4`。

### 2. 运行数据库迁移

执行数据库迁移以创建标签相关的表：

```bash
npm run migrate
```

这将创建以下数据库表：
- `tags` - 存储用户的标签
- `link_tags` - 链接和标签的多对多关系表

### 3. 启动应用

```bash
# 开发模式
npm run dev

# 生产模式
npm start
```

### 4. 验证安装

访问以下端点验证新功能是否正常工作：

```bash
# 检查 API 健康状态
curl http://localhost:3000/api/v2/health

# 测试标签 API（需要先登录获取 API Key）
curl -H "X-API-KEY: your-api-key" http://localhost:3000/api/v2/tags
```

## 🔧 配置选项

无需额外配置，新功能开箱即用。所有现有的环境变量配置保持不变。

## 🧪 测试新功能

### 测试标签系统

1. **创建标签**
```bash
curl -X POST http://localhost:3000/api/v2/tags \
  -H "X-API-KEY: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{"name":"测试标签","color":"#3b82f6"}'
```

2. **获取所有标签**
```bash
curl -H "X-API-KEY: your-api-key" \
  http://localhost:3000/api/v2/tags
```

3. **创建带标签的链接**
```bash
curl -X POST http://localhost:3000/api/v2/links \
  -H "X-API-KEY: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "target":"https://github.com",
    "description":"GitHub 首页",
    "tag_ids":[1]
  }'
```

### 测试 QR 码生成

1. **生成 PNG 格式 QR 码**
```bash
curl -o qrcode.png \
  "http://localhost:3000/api/v2/qrcode/LINK_UUID?format=png&size=300"
```

2. **生成 SVG 格式 QR 码**
```bash
curl -o qrcode.svg \
  "http://localhost:3000/api/v2/qrcode/LINK_UUID?format=svg&size=300"
```

3. **获取 Data URL**
```bash
curl "http://localhost:3000/api/v2/qrcode/LINK_UUID?format=dataurl&size=300"
```

## 🐳 Docker 部署

如果您使用 Docker，请按照以下步骤操作：

### 1. 重新构建镜像

```bash
docker compose build
```

### 2. 运行迁移

```bash
docker compose run --rm hapxs-surl npm run migrate
```

### 3. 启动服务

```bash
docker compose up -d
```

## 🔄 从旧版本升级

如果您已经在运行 hapxs-surl，升级步骤如下：

1. **备份数据库**（重要！）
```bash
# SQLite
cp db/data.db db/data.db.backup

# PostgreSQL
pg_dump -U your_user hapxs-surl > hapxs-surl_backup.sql

# MySQL
mysqldump -u your_user -p hapxs-surl > hapxs-surl_backup.sql
```

2. **拉取最新代码**
```bash
git pull origin main
```

3. **安装新依赖**
```bash
npm install
```

4. **运行迁移**
```bash
npm run migrate
```

5. **重启应用**
```bash
# 如果使用 PM2
pm2 restart hapxs-surl

# 如果使用 systemd
sudo systemctl restart hapxs-surl

# 如果使用 Docker
docker compose restart
```

## 📊 数据库结构

### tags 表
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键 |
| name | VARCHAR(100) | 标签名称 |
| color | VARCHAR(20) | 标签颜色（十六进制） |
| user_id | INTEGER | 用户 ID（外键） |
| created_at | DATETIME | 创建时间 |
| updated_at | DATETIME | 更新时间 |

**索引：**
- `user_id` - 加速用户标签查询
- `name` - 加速标签名称搜索
- `(user_id, name)` - 唯一约束

### link_tags 表
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键 |
| link_id | INTEGER | 链接 ID（外键） |
| tag_id | INTEGER | 标签 ID（外键） |
| created_at | DATETIME | 创建时间 |
| updated_at | DATETIME | 更新时间 |

**索引：**
- `link_id` - 加速链接标签查询
- `tag_id` - 加速标签链接查询
- `(link_id, tag_id)` - 唯一约束

## ⚠️ 注意事项

1. **性能优化**
   - 标签查询已添加索引，性能良好
   - 建议为每个链接添加不超过 10 个标签
   - QR 码生成是实时的，不会存储在数据库中

2. **权限控制**
   - 用户只能管理自己的标签
   - 标签只能关联到用户自己的链接
   - QR 码可以为任何公开链接生成

3. **数据迁移**
   - 迁移是幂等的，可以安全地多次运行
   - 现有数据不会受到影响
   - 迁移会自动检测是否已创建表

## 🐛 故障排除

### 迁移失败

**错误：table already exists**
```bash
# 这是正常的，表可能已经存在
# 迁移脚本会自动检测并跳过
```

**错误：foreign key constraint fails**
```bash
# 确保 users 和 links 表存在
npm run migrate
```

### 依赖安装失败

```bash
# 清除缓存重新安装
rm -rf node_modules package-lock.json
npm install
```

### QR 码生成失败

**错误：Cannot find module 'qrcode'**
```bash
# 重新安装依赖
npm install qrcode
```

## 📚 相关文档

- [功能使用文档](./FEATURES.md)
- [API 文档](https://docs.hapxs-surl.it)
- [主 README](./README.md)

## 🆘 获取帮助

如果遇到问题：
1. 查看 [GitHub Issues](https://github.com/devhappys/hapxs-surl/issues)
2. 提交新的 Issue，包含详细的错误信息
3. 加入社区讨论

## ✅ 检查清单

安装完成后，请确认：

- [ ] 依赖已安装 (`npm install` 成功)
- [ ] 数据库迁移已运行 (`npm run migrate` 成功)
- [ ] 应用可以正常启动
- [ ] 可以创建标签
- [ ] 可以为链接添加标签
- [ ] 可以生成 QR 码
- [ ] API 端点正常响应

恭喜！您已成功安装新功能。🎉
