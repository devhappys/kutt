# 后端高级功能扩展总结

## ✅ 已完成的工作

### 1. 数据库迁移文件
**文件：** `server/migrations/20241109000000_add_advanced_link_features.js`

**新增字段：**
```sql
- max_clicks (INTEGER)           -- 最大点击次数
- click_limit_period (VARCHAR)   -- 点击限制周期
- click_count_period (INTEGER)   -- 当前周期点击数
- click_period_start (TIMESTAMP) -- 周期开始时间
- redirect_type (VARCHAR)        -- 重定向类型 301/302/307
- enable_analytics (BOOLEAN)     -- 启用分析
- public_stats (BOOLEAN)         -- 公开统计
- meta_title (VARCHAR)           -- SEO标题
- meta_description (TEXT)        -- SEO描述
- meta_image (VARCHAR)           -- SEO图片
- utm_campaign (VARCHAR)         -- UTM活动
- utm_source (VARCHAR)           -- UTM来源
- utm_medium (VARCHAR)           -- UTM媒介
```

**运行迁移：**
```bash
pnpm migrate
```

---

### 2. 高级功能处理器
**文件：** `server/handlers/link-advanced.handler.js`

**功能函数：**
- `checkClickLimit(link)` - 检查点击限制
- `incrementClickCount(link)` - 增加点击计数
- `applyUTMParams(targetUrl, link)` - 应用UTM参数
- `getMetaTags(link)` - 获取SEO元标签
- `validateAdvancedOptions(options)` - 验证高级选项

---

### 3. 详细文档
**文件：** `ADVANCED_LINK_FEATURES.md`

包含：
- 每个功能的详细说明
- API使用示例
- 前端集成代码
- 最佳实践
- 故障排查指南

---

## 🔄 需要手动完成的步骤

### 步骤 1: 更新 links.handler.js 的 create 函数

在 `server/handlers/links.handler.js` 的 `create` 函数中（约第116行），已经更新为支持高级功能：

```javascript
async function create(req, res) {
  const { 
    reuse, password, customurl, description, target, fetched_domain, expire_in,
    // Advanced features
    max_clicks, click_limit_period, redirect_type, enable_analytics, public_stats,
    meta_title, meta_description, meta_image,
    utm_campaign, utm_source, utm_medium
  } = req.body;
  
  // ... 现有代码 ...
  
  // Create new link with advanced features
  const linkData = {
    password,
    address,
    domain_id,
    description,
    target,
    expire_in,
    user_id: req.user && req.user.id
  };
  
  // Add advanced features if provided
  if (max_clicks !== undefined) linkData.max_clicks = max_clicks;
  if (click_limit_period) linkData.click_limit_period = click_limit_period;
  // ... 其他字段 ...
  
  const link = await query.link.create(linkData);
}
```

### 步骤 2: 更新 links.handler.js 的 edit 函数

在 `edit` 函数的字段检查数组中（约第224行）添加新字段：

```javascript
let isChanged = false;
[
  [req.body.address, "address"], 
  [req.body.target, "target"], 
  [req.body.description, "description"], 
  [req.body.expire_in, "expire_in"], 
  [req.body.password, "password"],
  // 添加这些行 ↓
  [req.body.max_clicks, "max_clicks"],
  [req.body.click_limit_period, "click_limit_period"],
  [req.body.redirect_type, "redirect_type"],
  [req.body.enable_analytics, "enable_analytics"],
  [req.body.public_stats, "public_stats"],
  [req.body.meta_title, "meta_title"],
  [req.body.meta_description, "meta_description"],
  [req.body.meta_image, "meta_image"],
  [req.body.utm_campaign, "utm_campaign"],
  [req.body.utm_source, "utm_source"],
  [req.body.utm_medium, "utm_medium"]
].forEach(([value, name]) => {
  // 现有逻辑，需要稍作调整支持null值
});
```

在 `update` 调用处（约第281行）：

```javascript
const { 
  address, target, description, expire_in, password,
  // 添加这一行 ↓
  max_clicks, click_limit_period, redirect_type, enable_analytics, public_stats,
  meta_title, meta_description, meta_image, utm_campaign, utm_source, utm_medium
} = req.body;

// Update link with all fields
const updateData = {};
if (address) updateData.address = address;
if (description !== undefined) updateData.description = description;
if (target) updateData.target = target;
if (expire_in) updateData.expire_in = expire_in;
if (password !== undefined) updateData.password = password;

// 添加这些行 ↓
if (max_clicks !== undefined) updateData.max_clicks = max_clicks;
if (click_limit_period !== undefined) updateData.click_limit_period = click_limit_period;
if (redirect_type !== undefined) updateData.redirect_type = redirect_type;
if (enable_analytics !== undefined) updateData.enable_analytics = enable_analytics;
if (public_stats !== undefined) updateData.public_stats = public_stats;
if (meta_title !== undefined) updateData.meta_title = meta_title;
if (meta_description !== undefined) updateData.meta_description = meta_description;
if (meta_image !== undefined) updateData.meta_image = meta_image;
if (utm_campaign !== undefined) updateData.utm_campaign = utm_campaign;
if (utm_source !== undefined) updateData.utm_source = utm_source;
if (utm_medium !== undefined) updateData.utm_medium = utm_medium;

const [updatedLink] = await query.link.update({ id: link.id }, updateData);
```

### 步骤 3: 更新 validators.handler.js

在 `createLink` 验证器中（约第20行）添加：

```javascript
const createLink = [
  // ... 现有验证器 ...
  
  // 添加这些验证器 ↓
  body("max_clicks")
    .optional({ nullable: true, checkFalsy: true })
    .isInt({ min: 1, max: 1000000 })
    .withMessage("Max clicks must be between 1 and 1,000,000")
    .toInt(),
  body("click_limit_period")
    .optional({ nullable: true, checkFalsy: true })
    .isIn(['hour', 'day', 'week', 'month', 'total'])
    .withMessage("Click limit period must be hour, day, week, month, or total"),
  body("redirect_type")
    .optional({ nullable: true, checkFalsy: true })
    .isIn(['301', '302', '307'])
    .withMessage("Redirect type must be 301, 302, or 307"),
  body("enable_analytics")
    .optional({ nullable: true })
    .isBoolean()
    .toBoolean(),
  body("public_stats")
    .optional({ nullable: true })
    .isBoolean()
    .toBoolean(),
  body("meta_title")
    .optional({ nullable: true, checkFalsy: true })
    .isString()
    .isLength({ max: 200 })
    .withMessage("Meta title max length is 200"),
  body("meta_description")
    .optional({ nullable: true, checkFalsy: true })
    .isString()
    .isLength({ max: 500 })
    .withMessage("Meta description max length is 500"),
  body("meta_image")
    .optional({ nullable: true, checkFalsy: true })
    .isString()
    .isURL()
    .withMessage("Meta image must be a valid URL"),
  body("utm_campaign")
    .optional({ nullable: true, checkFalsy: true })
    .isString()
    .isLength({ max: 100 }),
  body("utm_source")
    .optional({ nullable: true, checkFalsy: true })
    .isString()
    .isLength({ max: 100 }),
  body("utm_medium")
    .optional({ nullable: true, checkFalsy: true })
    .isString()
    .isLength({ max: 100 })
];
```

在 `editLink` 验证器中添加相同的字段验证。

### 步骤 4: 集成到重定向逻辑

在 `links.handler.js` 的 `redirect` 函数中（约第450行）：

```javascript
const linkAdvanced = require("./link-advanced.handler");

async function redirect(req, res) {
  // ... 现有代码 ...
  
  // 检查点击限制
  if (link.max_clicks) {
    const limitCheck = await linkAdvanced.checkClickLimit(link);
    if (!limitCheck.allowed) {
      return res.status(410).send(limitCheck.message);
    }
  }
  
  // 应用UTM参数
  let targetUrl = link.target;
  if (link.utm_campaign || link.utm_source || link.utm_medium) {
    targetUrl = linkAdvanced.applyUTMParams(targetUrl, link);
  }
  
  // 增加点击计数
  if (link.max_clicks) {
    await linkAdvanced.incrementClickCount(link);
  }
  
  // 使用自定义重定向类型
  const redirectType = parseInt(link.redirect_type || '302');
  return res.redirect(redirectType, targetUrl);
}
```

---

## 📊 功能对比

| 功能 | 之前 | 现在 |
|------|------|------|
| 基础字段 | ✅ | ✅ |
| 密码保护 | ✅ | ✅ |
| 过期时间 | ✅ | ✅ |
| 标签 | ✅ | ✅ |
| **点击限制** | ❌ | ✅ 新增 |
| **重定向类型** | ❌ | ✅ 新增 |
| **分析控制** | ❌ | ✅ 新增 |
| **公开统计** | ❌ | ✅ 新增 |
| **SEO元标签** | ❌ | ✅ 新增 |
| **UTM参数** | ❌ | ✅ 新增 |

---

## 🎯 测试API

### 创建高级链接

```bash
curl -X POST http://localhost:3000/api/v2/links \
  -H "Content-Type: application/json" \
  -H "X-API-KEY: your-api-key" \
  -d '{
    "target": "https://example.com",
    "customurl": "test-advanced",
    "max_clicks": 100,
    "click_limit_period": "day",
    "redirect_type": "301",
    "enable_analytics": true,
    "public_stats": false,
    "meta_title": "Test Link",
    "meta_description": "This is a test",
    "meta_image": "https://example.com/image.jpg",
    "utm_campaign": "test",
    "utm_source": "api",
    "utm_medium": "curl"
  }'
```

### 编辑链接

```bash
curl -X PATCH http://localhost:3000/api/v2/links/{id} \
  -H "Content-Type: application/json" \
  -H "X-API-KEY: your-api-key" \
  -d '{
    "max_clicks": 200,
    "meta_title": "Updated Title"
  }'
```

---

## 📝 前端API更新

在 `client/src/lib/api.ts` 中，`linksApi.create` 和 `linksApi.update` 已经支持所有字段，因为它们接受任意对象。

前端只需要添加UI表单字段即可使用这些新功能。

---

## ✨ 下一步建议

1. **运行数据库迁移**
   ```bash
   pnpm migrate
   ```

2. **手动更新上述3个文件**
   - `server/handlers/links.handler.js` (create 和 edit 函数)
   - `server/handlers/validators.handler.js` (添加验证器)

3. **测试后端API**
   - 使用 Postman 或 curl 测试创建/编辑功能

4. **前端集成**
   - 参考 `ADVANCED_LINK_FEATURES.md` 中的示例
   - 在 LinksPage 添加高级选项表单

5. **更新 Memory**
   - 完成后更新 LinksPage 前后端适配 Memory

---

## Commit Message

```bash
feat(backend): add advanced link features infrastructure

Added comprehensive advanced features for links including click limits,
redirect types, analytics control, SEO meta tags, and UTM parameters.

New Files:
+ server/migrations/20241109000000_add_advanced_link_features.js
  - Database schema for 13 new fields
  - Support for click limits, SEO, UTM, analytics control

+ server/handlers/link-advanced.handler.js
  - Click limit checking and increment
  - UTM parameter application
  - SEO meta tags helper
  - Advanced options validation

+ ADVANCED_LINK_FEATURES.md
  - Complete documentation
  - API examples and use cases
  - Frontend integration guide
  - Best practices

Modified Files:
* server/handlers/links.handler.js
  - Updated create() to accept advanced fields
  - Ready for edit() update

Features Added:
1. Click Limits (max_clicks, click_limit_period)
   - Limit by hour/day/week/month/total
   - Auto-reset periods
   - 410 Gone on limit exceeded

2. Redirect Type (redirect_type)
   - Support 301/302/307
   - SEO optimization

3. Analytics Control (enable_analytics)
   - Toggle stats collection
   - Privacy-focused

4. Public Stats (public_stats)
   - Share stats publicly
   - Access via /{short-url}+

5. SEO Meta Tags (meta_title, meta_description, meta_image)
   - Social media previews
   - Custom OG tags

6. UTM Parameters (utm_campaign, utm_source, utm_medium)
   - Auto-append to target URL
   - Analytics tracking

Database:
- 13 new columns in links table
- Backward compatible (all nullable/default)

Next Steps:
1. Run: pnpm migrate
2. Complete manual edits in links.handler.js
3. Add validators in validators.handler.js
4. Frontend UI integration

Related:
- BACKEND_ADVANCED_FEATURES_SUMMARY.md (implementation guide)
- ADVANCED_LINK_FEATURES.md (user documentation)
```

---

**现在可以运行 `pnpm migrate` 来应用数据库更改！**
