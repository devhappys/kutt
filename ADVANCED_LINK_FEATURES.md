# 高级链接功能文档

## 新增功能列表

### 1. 点击限制 (Click Limits)

**功能描述：** 限制短链接的点击次数，超过限制后自动失效。

**使用场景：**
- 限量优惠券链接
- 临时分享链接
- 活动报名链接

**API参数：**
```javascript
{
  "max_clicks": 100,              // 最大点击次数 (1-1,000,000)
  "click_limit_period": "day"     // 周期: hour, day, week, month, total
}
```

**示例：**
```bash
# 创建每天最多100次点击的链接
POST /api/v2/links
{
  "target": "https://example.com",
  "max_clicks": 100,
  "click_limit_period": "day"
}

# 创建总共只能点击50次的链接
POST /api/v2/links
{
  "target": "https://example.com",
  "max_clicks": 50,
  "click_limit_period": "total"
}
```

---

### 2. 重定向类型 (Redirect Type)

**功能描述：** 自定义HTTP重定向状态码。

**使用场景：**
- SEO优化（301永久重定向）
- 临时重定向（302/307）
- 保留请求方法（307 vs 302）

**API参数：**
```javascript
{
  "redirect_type": "301"  // 可选: "301", "302", "307"
}
```

**区别说明：**
- `301` - 永久重定向，对SEO友好
- `302` - 临时重定向（默认）
- `307` - 临时重定向，保持原始HTTP方法

---

### 3. 分析控制 (Analytics Control)

**功能描述：** 控制是否收集访问统计数据。

**使用场景：**
- 隐私敏感链接
- 内部测试链接
- 节省存储空间

**API参数：**
```javascript
{
  "enable_analytics": false  // true (默认) 或 false
}
```

---

### 4. 公开统计 (Public Stats)

**功能描述：** 允许任何人查看链接统计数据（无需登录）。

**使用场景：**
- 公开活动链接
- 透明度展示
- 分享统计数据

**API参数：**
```javascript
{
  "public_stats": true  // false (默认) 或 true
}
```

**公开统计URL：**
```
https://yourdomain.com/{short-url}+
```

---

### 5. SEO元标签 (SEO Meta Tags)

**功能描述：** 自定义链接预览的标题、描述和图片。

**使用场景：**
- 社交媒体分享优化
- 品牌展示
- 提高点击率

**API参数：**
```javascript
{
  "meta_title": "Custom Title",           // 最多200字符
  "meta_description": "Description...",   // 最多500字符
  "meta_image": "https://example.com/image.jpg"
}
```

**效果：**
社交媒体平台（Twitter、Facebook、LinkedIn等）会显示自定义的预览卡片。

---

### 6. 默认UTM参数 (Default UTM Parameters)

**功能描述：** 自动为目标URL添加UTM追踪参数。

**使用场景：**
- Google Analytics追踪
- 营销活动追踪
- 流量来源分析

**API参数：**
```javascript
{
  "utm_campaign": "summer_sale",
  "utm_source": "twitter",
  "utm_medium": "social"
}
```

**自动转换：**
```
目标URL: https://example.com/product
↓
实际跳转: https://example.com/product?utm_campaign=summer_sale&utm_source=twitter&utm_medium=social
```

---

## 完整创建示例

### 高级营销链接

```bash
POST /api/v2/links
Content-Type: application/json
X-API-KEY: your-api-key

{
  "target": "https://shop.example.com/sale",
  "customurl": "summer-sale",
  "description": "夏季大促销",
  
  // 点击限制
  "max_clicks": 1000,
  "click_limit_period": "week",
  
  // SEO优化
  "redirect_type": "301",
  "meta_title": "夏季大促 - 5折起！",
  "meta_description": "限时优惠，全场商品5折起，仅限本周！",
  "meta_image": "https://cdn.example.com/summer-sale.jpg",
  
  // UTM追踪
  "utm_campaign": "summer_2024",
  "utm_source": "email",
  "utm_medium": "newsletter",
  
  // 分析设置
  "enable_analytics": true,
  "public_stats": true,
  
  // 基础功能
  "password": "secret123",
  "expire_in": "7d",
  "tag_ids": [1, 2, 3]
}
```

**响应：**
```json
{
  "id": "uuid-here",
  "address": "summer-sale",
  "target": "https://shop.example.com/sale",
  "link": "https://yourdomain.com/summer-sale",
  "visit_count": 0,
  "max_clicks": 1000,
  "click_limit_period": "week",
  "click_count_period": 0,
  "redirect_type": "301",
  "enable_analytics": true,
  "public_stats": true,
  "meta_title": "夏季大促 - 5折起！",
  // ... 其他字段
}
```

---

## 编辑链接

所有高级功能都可以在创建后编辑：

```bash
PATCH /api/v2/links/{id}
{
  "max_clicks": 2000,              // 增加点击限制
  "meta_title": "Updated Title",   // 更新元标题
  "public_stats": false            // 关闭公开统计
}
```

---

## 访问时的行为

### 点击限制检查流程

```
用户访问短链接
  ↓
检查是否有 max_clicks 设置
  ↓ 有
检查当前周期的点击数
  ↓
未超限 → 允许访问 + 计数+1
  ↓
超限 → 返回 410 Gone 或自定义错误页
```

### UTM参数应用

```
用户访问: https://yourdomain.com/abc
  ↓
链接配置: utm_source=twitter
  ↓
实际跳转: https://target.com?utm_source=twitter
```

---

## 数据库字段

新增字段列表：

```sql
-- 点击限制
max_clicks INTEGER NULL
click_limit_period VARCHAR(20) NULL
click_count_period INTEGER DEFAULT 0
click_period_start TIMESTAMP NULL

-- 重定向
redirect_type VARCHAR(3) DEFAULT '302'

-- 分析
enable_analytics BOOLEAN DEFAULT true
public_stats BOOLEAN DEFAULT false

-- SEO
meta_title VARCHAR(200) NULL
meta_description TEXT NULL
meta_image VARCHAR(2048) NULL

-- UTM
utm_campaign VARCHAR(100) NULL
utm_source VARCHAR(100) NULL
utm_medium VARCHAR(100) NULL
```

---

## API端点总结

### 创建链接
```
POST /api/v2/links
```
支持所有新字段

### 编辑链接
```
PATCH /api/v2/links/:id
```
支持所有新字段

### 公开统计
```
GET /api/v2/stats/public/:address
```
如果 `public_stats=true`，返回统计数据

---

## 前端集成示例

### React组件示例

```tsx
// CreateAdvancedLink.tsx
function CreateAdvancedLink() {
  const [formData, setFormData] = useState({
    target: '',
    customurl: '',
    max_clicks: '',
    click_limit_period: 'total',
    redirect_type: '302',
    enable_analytics: true,
    public_stats: false,
    meta_title: '',
    meta_description: '',
    meta_image: '',
    utm_campaign: '',
    utm_source: '',
    utm_medium: ''
  })

  const createLink = useMutation({
    mutationFn: (data) => linksApi.create(data),
    onSuccess: () => toast.success('Advanced link created!')
  })

  return (
    <form onSubmit={(e) => {
      e.preventDefault()
      createLink.mutate(formData)
    }}>
      {/* Basic fields */}
      <input name="target" required />
      
      {/* Advanced: Click Limits */}
      <div>
        <label>Max Clicks</label>
        <input type="number" name="max_clicks" min="1" max="1000000" />
        <select name="click_limit_period">
          <option value="hour">Per Hour</option>
          <option value="day">Per Day</option>
          <option value="week">Per Week</option>
          <option value="month">Per Month</option>
          <option value="total">Total</option>
        </select>
      </div>

      {/* Advanced: SEO Meta */}
      <div>
        <label>Meta Title</label>
        <input name="meta_title" maxLength={200} />
        
        <label>Meta Description</label>
        <textarea name="meta_description" maxLength={500} />
        
        <label>Meta Image URL</label>
        <input type="url" name="meta_image" />
      </div>

      {/* Advanced: UTM Parameters */}
      <div>
        <label>UTM Campaign</label>
        <input name="utm_campaign" />
        
        <label>UTM Source</label>
        <input name="utm_source" />
        
        <label>UTM Medium</label>
        <input name="utm_medium" />
      </div>

      {/* Advanced: Options */}
      <div>
        <label>
          <input type="checkbox" name="enable_analytics" />
          Enable Analytics
        </label>
        
        <label>
          <input type="checkbox" name="public_stats" />
          Public Statistics
        </label>
        
        <label>Redirect Type</label>
        <select name="redirect_type">
          <option value="301">301 Permanent</option>
          <option value="302">302 Temporary (default)</option>
          <option value="307">307 Temporary (preserve method)</option>
        </select>
      </div>

      <button type="submit">Create Link</button>
    </form>
  )
}
```

---

## 最佳实践

### 1. 点击限制
- ✅ 用于限量资源（优惠券、名额）
- ✅ 设置合理的周期（避免过于严格）
- ⚠️ 总点击限制慎用（无法重置）

### 2. SEO元标签
- ✅ 使用高质量图片（1200x630px推荐）
- ✅ 标题简洁有力（50-60字符）
- ✅ 描述清晰（150-160字符）

### 3. UTM参数
- ✅ 遵循Google Analytics命名规范
- ✅ 使用小写和下划线
- ✅ 保持一致性

### 4. 公开统计
- ⚠️ 谨慎使用（可能泄露商业信息）
- ✅ 适合公开活动和透明度展示

---

## 故障排查

### 点击限制不生效
1. 检查 `max_clicks` 和 `click_limit_period` 是否都设置
2. 检查数据库迁移是否成功执行
3. 查看 `click_count_period` 字段值

### UTM参数未添加
1. 确认目标URL格式正确
2. 检查 UTM 字段是否正确保存
3. 查看重定向日志

### Meta标签不显示
1. 确认字段已保存到数据库
2. 检查前端预览实现
3. 使用社交媒体调试工具测试

---

## 迁移指南

运行迁移：
```bash
pnpm migrate
```

回滚：
```bash
npx knex migrate:down --knexfile knexfile.js
```

---

## 相关文档

- [FRONTEND_BACKEND_COMPATIBILITY.md](./FRONTEND_BACKEND_COMPATIBILITY.md)
- [API Documentation](./docs/api/)
- [Security Features](./SECURITY_AND_SMART_REDIRECT.md)
