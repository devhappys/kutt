# 高级统计功能文档

## 📊 功能概述

高级统计功能为 hapxs-surl 提供了强大的数据分析能力，包括详细的访问记录、UTM 参数追踪、实时统计、转化漏斗分析等。

### 主要功能

- ✅ **详细访问记录** - 记录每次访问的完整信息
- ✅ **UTM 参数追踪** - 追踪营销活动效果
- ✅ **访问热力图** - 可视化时间分布
- ✅ **实时统计** - 实时监控链接访问情况
- ✅ **转化漏斗** - 分析用户转化路径
- ✅ **A/B 测试** - 比较不同链接的表现
- ✅ **设备分析** - 详细的设备和浏览器统计
- ✅ **数据导出** - 导出为 CSV 或 JSON 格式

---

## 🗃️ 数据库结构

### visit_details 表

存储每次访问的详细信息：

| 字段 | 类型 | 说明 |
|------|------|------|
| id | BIGINT | 主键 |
| link_id | INTEGER | 链接 ID |
| user_id | INTEGER | 用户 ID |
| ip_address | VARCHAR(45) | 访问者 IP |
| country | VARCHAR(2) | 国家代码 |
| city | VARCHAR(100) | 城市 |
| region | VARCHAR(100) | 地区 |
| browser | VARCHAR(50) | 浏览器 |
| browser_version | VARCHAR(20) | 浏览器版本 |
| os | VARCHAR(50) | 操作系统 |
| os_version | VARCHAR(20) | 系统版本 |
| device_type | VARCHAR(20) | 设备类型 |
| device_brand | VARCHAR(50) | 设备品牌 |
| device_model | VARCHAR(50) | 设备型号 |
| referrer | VARCHAR(500) | 来源 URL |
| referrer_domain | VARCHAR(255) | 来源域名 |
| **utm_source** | VARCHAR(255) | UTM 来源 |
| **utm_medium** | VARCHAR(255) | UTM 媒介 |
| **utm_campaign** | VARCHAR(255) | UTM 活动 |
| **utm_term** | VARCHAR(255) | UTM 关键词 |
| **utm_content** | VARCHAR(255) | UTM 内容 |
| language | VARCHAR(10) | 语言 |
| screen_resolution | VARCHAR(20) | 屏幕分辨率 |
| is_bot | BOOLEAN | 是否机器人 |
| is_unique | BOOLEAN | 是否唯一访问 |
| created_at | DATETIME | 访问时间 |

---

## 🔧 API 端点

### 1. 用户仪表板

获取用户的统计概览。

```http
GET /api/v2/stats/dashboard
Headers: X-API-KEY: your-api-key
```

**响应示例：**
```json
{
  "overview": {
    "total_links": 25,
    "total_visits": 1523,
    "visits_last_24h": 127
  },
  "top_links": [
    {
      "uuid": "abc123",
      "address": "promo",
      "target": "https://example.com/promo",
      "visit_count": 450,
      "created_at": "2025-01-01T00:00:00.000Z"
    }
  ],
  "top_campaigns": [
    {
      "name": "summer-sale",
      "visits": 234
    }
  ]
}
```

---

### 2. 详细访问记录

获取链接的详细访问记录，支持筛选和分页。

```http
GET /api/v2/stats/links/:linkId/visits?limit=100&skip=0
Headers: X-API-KEY: your-api-key
```

**查询参数：**
- `limit` - 每页数量（默认 100，最大 1000）
- `skip` - 跳过数量
- `start_date` - 开始日期（ISO 8601）
- `end_date` - 结束日期（ISO 8601）
- `country` - 按国家筛选
- `browser` - 按浏览器筛选
- `os` - 按操作系统筛选
- `device_type` - 按设备类型筛选（desktop, mobile, tablet）
- `utm_source` - 按 UTM 来源筛选
- `utm_medium` - 按 UTM 媒介筛选
- `utm_campaign` - 按 UTM 活动筛选
- `is_bot` - 是否机器人（true/false）

**响应示例：**
```json
{
  "data": [
    {
      "id": 1,
      "created_at": "2025-01-09T10:30:00.000Z",
      "country": "us",
      "city": "New York",
      "browser": "chrome",
      "browser_version": "120.0",
      "os": "windows",
      "device_type": "desktop",
      "utm_campaign": "summer-sale",
      "utm_source": "facebook",
      "utm_medium": "social",
      "referrer_domain": "facebook.com"
    }
  ],
  "total": 1523,
  "limit": 100,
  "skip": 0
}
```

---

### 3. 访问热力图

获取访问时间分布热力图。

```http
GET /api/v2/stats/links/:linkId/heatmap?period=week
Headers: X-API-KEY: your-api-key
```

**查询参数：**
- `period` - 时间范围（day, week, month）

**响应示例：**
```json
{
  "heatmap": [
    [0, 2, 5, 8, 12, 15, 20, 25, 18, 12, 8, 5, 3, 2, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [/* 星期一的24小时数据 */],
    [/* 星期二的24小时数据 */]
  ],
  "period": "week",
  "startDate": "2025-01-02T00:00:00.000Z",
  "endDate": "2025-01-09T10:30:00.000Z"
}
```

**热力图数据格式：**
- 7行（0=星期日，6=星期六）
- 24列（0-23小时）
- 数值表示该时间段的访问次数

---

### 4. UTM 活动统计

获取 UTM 参数的统计信息。

```http
GET /api/v2/stats/links/:linkId/utm?start_date=2025-01-01&end_date=2025-01-31
Headers: X-API-KEY: your-api-key
```

**响应示例：**
```json
{
  "campaigns": [
    {
      "name": "summer-sale",
      "visits": 450,
      "unique_visitors": 320
    },
    {
      "name": "winter-promo",
      "visits": 280,
      "unique_visitors": 195
    }
  ],
  "sources": [
    {
      "name": "facebook",
      "visits": 520
    },
    {
      "name": "google",
      "visits": 380
    }
  ],
  "mediums": [
    {
      "name": "social",
      "visits": 600
    },
    {
      "name": "email",
      "visits": 400
    }
  ]
}
```

---

### 5. 实时统计

获取链接的实时访问统计。

```http
GET /api/v2/stats/links/:linkId/realtime
Headers: X-API-KEY: your-api-key
```

**响应示例：**
```json
{
  "last_15_min": 12,
  "last_hour": 45,
  "last_24_hours": 523,
  "active_visitors": 3,
  "recent_visits": [
    {
      "country": "us",
      "city": "San Francisco",
      "browser": "chrome",
      "os": "macos",
      "device_type": "desktop",
      "referrer_domain": "google.com",
      "utm_campaign": "ppc-campaign",
      "created_at": "2025-01-09T10:28:00.000Z"
    }
  ],
  "timestamp": "2025-01-09T10:30:00.000Z"
}
```

---

### 6. 设备统计

获取设备类型、浏览器和操作系统的详细统计。

```http
GET /api/v2/stats/links/:linkId/devices?start_date=2025-01-01
Headers: X-API-KEY: your-api-key
```

**响应示例：**
```json
{
  "device_types": [
    {
      "type": "mobile",
      "count": 650
    },
    {
      "type": "desktop",
      "count": 450
    },
    {
      "type": "tablet",
      "count": 120
    }
  ],
  "browsers": [
    {
      "name": "chrome",
      "version": "120.0",
      "count": 580
    },
    {
      "name": "safari",
      "version": "17.2",
      "count": 320
    }
  ],
  "operating_systems": [
    {
      "name": "ios",
      "version": "17.2",
      "count": 420
    },
    {
      "name": "windows",
      "version": "11",
      "count": 380
    }
  ]
}
```

---

### 7. 转化漏斗分析

分析多个链接的转化路径。

```http
POST /api/v2/stats/funnel?start_date=2025-01-01&end_date=2025-01-31
Headers: X-API-KEY: your-api-key
Content-Type: application/json

{
  "link_ids": ["uuid1", "uuid2", "uuid3"]
}
```

**响应示例：**
```json
{
  "steps": [
    {
      "step": 1,
      "link_id": 123,
      "link_address": "landing",
      "link_uuid": "uuid1",
      "total_visits": 1000,
      "unique_visitors": 850,
      "drop_off_rate": "0.00"
    },
    {
      "step": 2,
      "link_id": 124,
      "link_address": "signup",
      "link_uuid": "uuid2",
      "total_visits": 650,
      "unique_visitors": 580,
      "drop_off_rate": "31.76"
    },
    {
      "step": 3,
      "link_id": 125,
      "link_address": "purchase",
      "link_uuid": "uuid3",
      "total_visits": 340,
      "unique_visitors": 320,
      "drop_off_rate": "44.83"
    }
  ],
  "total_conversion_rate": "37.65"
}
```

---

### 8. A/B 测试统计

比较多个链接变体的表现。

```http
POST /api/v2/stats/abtest?start_date=2025-01-01&end_date=2025-01-31
Headers: X-API-KEY: your-api-key
Content-Type: application/json

{
  "link_ids": ["variant-a-uuid", "variant-b-uuid"]
}
```

**响应示例：**
```json
{
  "variants": [
    {
      "link_id": 123,
      "link_address": "promo-v1",
      "link_uuid": "variant-a-uuid",
      "link_target": "https://example.com/promo-v1",
      "total_visits": 520,
      "unique_visitors": 450,
      "percentage_of_total": "52.00",
      "conversion_rate": "86.54"
    },
    {
      "link_id": 124,
      "link_address": "promo-v2",
      "link_uuid": "variant-b-uuid",
      "link_target": "https://example.com/promo-v2",
      "total_visits": 480,
      "unique_visitors": 420,
      "percentage_of_total": "48.00",
      "conversion_rate": "87.50"
    }
  ],
  "summary": {
    "total_visits": 1000,
    "total_unique_visitors": 870,
    "best_performing": {
      "link_address": "promo-v2",
      "conversion_rate": "87.50"
    }
  }
}
```

---

### 9. 导出统计数据

导出链接的统计数据为 CSV 或 JSON 格式。

```http
GET /api/v2/stats/links/:linkId/export?format=csv&start_date=2025-01-01
Headers: X-API-KEY: your-api-key
```

**查询参数：**
- `format` - 导出格式（csv 或 json，默认 csv）
- `start_date` - 开始日期
- `end_date` - 结束日期

**CSV 格式示例：**
```csv
created_at,country,city,browser,browser_version,os,device_type,utm_campaign,utm_source
2025-01-09T10:30:00.000Z,us,New York,chrome,120.0,windows,desktop,summer-sale,facebook
2025-01-09T10:25:00.000Z,uk,London,safari,17.2,macos,desktop,winter-promo,google
```

**JSON 格式示例：**
```json
{
  "link": {
    "address": "promo",
    "target": "https://example.com/promo",
    "created_at": "2025-01-01T00:00:00.000Z"
  },
  "visits": [/* 访问记录数组 */],
  "exported_at": "2025-01-09T10:30:00.000Z"
}
```

---

## 🎯 UTM 参数追踪

### 如何使用 UTM 参数

在创建短链接时，目标 URL 中的 UTM 参数会自动被追踪。

**示例：**
```bash
curl -X POST https://hapxs-surl.com/api/v2/links \
  -H "X-API-KEY: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "target": "https://example.com?utm_source=facebook&utm_medium=social&utm_campaign=summer-sale"
  }'
```

当用户访问短链接时，系统会自动记录 UTM 参数。

### 标准 UTM 参数

| 参数 | 说明 | 示例 |
|------|------|------|
| utm_source | 流量来源 | facebook, google, newsletter |
| utm_medium | 营销媒介 | social, email, cpc |
| utm_campaign | 活动名称 | summer-sale, product-launch |
| utm_term | 付费关键词 | running+shoes |
| utm_content | 区分内容 | banner-a, text-link |

---

## 📈 使用场景

### 1. 营销活动追踪

追踪不同营销渠道的效果：

```javascript
// 创建多个带 UTM 的链接
const channels = [
  { source: 'facebook', medium: 'social' },
  { source: 'google', medium: 'cpc' },
  { source: 'newsletter', medium: 'email' }
];

for (const channel of channels) {
  const url = `https://example.com/promo?utm_source=${channel.source}&utm_medium=${channel.medium}&utm_campaign=summer-sale`;
  
  await createLink({
    target: url,
    customurl: `promo-${channel.source}`
  });
}

// 查看各渠道效果
const utmStats = await fetch(
  'https://hapxs-surl.com/api/v2/stats/links/LINK_ID/utm',
  { headers: { 'X-API-KEY': 'your-api-key' } }
);
```

### 2. A/B 测试

测试不同落地页的效果：

```javascript
// 创建两个变体
const variantA = await createLink({
  target: 'https://example.com/landing-v1',
  customurl: 'landing-a'
});

const variantB = await createLink({
  target: 'https://example.com/landing-v2',
  customurl: 'landing-b'
});

// 比较结果
const results = await fetch(
  'https://hapxs-surl.com/api/v2/stats/abtest',
  {
    method: 'POST',
    headers: {
      'X-API-KEY': 'your-api-key',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      link_ids: [variantA.uuid, variantB.uuid]
    })
  }
);
```

### 3. 转化漏斗分析

分析用户从访问到转化的路径：

```javascript
const funnel = [
  'homepage-link',
  'product-link',
  'checkout-link',
  'thankyou-link'
];

const results = await fetch(
  'https://hapxs-surl.com/api/v2/stats/funnel',
  {
    method: 'POST',
    headers: {
      'X-API-KEY': 'your-api-key',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      link_ids: funnel
    })
  }
);

console.log(`总转化率: ${results.total_conversion_rate}%`);
```

### 4. 实时监控

监控链接的实时访问情况：

```javascript
setInterval(async () => {
  const stats = await fetch(
    'https://hapxs-surl.com/api/v2/stats/links/LINK_ID/realtime',
    { headers: { 'X-API-KEY': 'your-api-key' } }
  );
  
  console.log(`当前活跃访客: ${stats.active_visitors}`);
  console.log(`最近15分钟访问: ${stats.last_15_min}`);
}, 60000); // 每分钟更新
```

---

## 📊 数据可视化建议

### 热力图可视化

使用热力图数据创建可视化图表：

```javascript
// 使用 Chart.js 或其他图表库
const heatmapData = await fetch(
  'https://hapxs-surl.com/api/v2/stats/links/LINK_ID/heatmap?period=week',
  { headers: { 'X-API-KEY': 'your-api-key' } }
);

// heatmapData.heatmap 是 7x24 的二维数组
// 可以使用热力图库如 heatmap.js 进行可视化
```

### 时间序列图表

基于访问记录创建时间序列图：

```javascript
const visits = await fetch(
  'https://hapxs-surl.com/api/v2/stats/links/LINK_ID/visits?start_date=2025-01-01&limit=1000',
  { headers: { 'X-API-KEY': 'your-api-key' } }
);

// 按小时聚合
const hourly = {};
visits.data.forEach(visit => {
  const hour = visit.created_at.substring(0, 13); // YYYY-MM-DDTHH
  hourly[hour] = (hourly[hour] || 0) + 1;
});
```

---

## 🔧 性能优化建议

1. **使用分页** - 大量数据时使用 limit 和 skip 参数
2. **日期范围筛选** - 使用 start_date 和 end_date 限制数据量
3. **缓存结果** - 对于不经常变化的数据，考虑客户端缓存
4. **批量导出** - 大量数据使用导出功能而非API调用
5. **索引优化** - 数据库已对常用查询字段建立索引

---

## 🐛 故障排除

### 问题：没有数据

**可能原因：**
- 新功能需要运行数据库迁移
- 链接还没有新的访问记录

**解决方案：**
```bash
# 运行迁移
npm run migrate

# 访问链接以生成测试数据
```

### 问题：UTM 参数未被追踪

**可能原因：**
- 链接的 utm_tracking_enabled 被禁用
- UTM 参数在目标 URL 中而非访问短链接时

**解决方案：**
确保 UTM 参数在目标 URL 中，系统会自动提取和追踪。

### 问题：实时统计延迟

**可能原因：**
- 数据库写入延迟
- 缓存未更新

**解决方案：**
实时统计有轻微延迟是正常的（通常<1分钟）。

---

## 📚 相关文档

- [基础功能文档](./FEATURES.md)
- [API 文档](https://docs.hapxs-surl.it)
- [安装指南](./INSTALLATION_GUIDE.md)

---

## 🆘 获取帮助

如有问题或建议：
1. 查看 [GitHub Issues](https://github.com/devhappys/hapxs-surl/issues)
2. 提交新的 Issue
3. 加入社区讨论
