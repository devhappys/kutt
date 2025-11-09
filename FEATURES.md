# 新增功能说明

## 🏷️ 标签系统 (Tags System)

标签系统允许您为链接添加标签，更好地组织和管理您的短链接。

### 功能特性

- ✅ 创建、编辑、删除标签
- ✅ 为标签设置自定义颜色
- ✅ 为链接添加多个标签
- ✅ 按标签筛选和搜索链接
- ✅ 查看标签使用统计

### API 端点

#### 1. 获取所有标签
```http
GET /api/v2/tags
Headers: X-API-KEY: your-api-key
```

**响应示例：**
```json
{
  "data": [
    {
      "id": 1,
      "name": "工作",
      "color": "#3b82f6",
      "user_id": 1,
      "created_at": "2025-01-09T07:30:00.000Z",
      "updated_at": "2025-01-09T07:30:00.000Z",
      "usage_count": 5
    }
  ]
}
```

#### 2. 创建标签
```http
POST /api/v2/tags
Headers: X-API-KEY: your-api-key
Content-Type: application/json

{
  "name": "工作",
  "color": "#3b82f6"
}
```

#### 3. 更新标签
```http
PATCH /api/v2/tags/:id
Headers: X-API-KEY: your-api-key
Content-Type: application/json

{
  "name": "个人项目",
  "color": "#ef4444"
}
```

#### 4. 删除标签
```http
DELETE /api/v2/tags/:id
Headers: X-API-KEY: your-api-key
```

#### 5. 获取标签下的所有链接
```http
GET /api/v2/tags/:id/links
Headers: X-API-KEY: your-api-key
```

#### 6. 为链接添加标签
```http
POST /api/v2/tags/links/:linkId
Headers: X-API-KEY: your-api-key
Content-Type: application/json

{
  "tag_ids": [1, 2, 3]
}
```

#### 7. 从链接移除标签
```http
DELETE /api/v2/tags/links/:linkId
Headers: X-API-KEY: your-api-key
Content-Type: application/json

{
  "tag_ids": [1, 2]
}
```

#### 8. 创建链接时添加标签
```http
POST /api/v2/links
Headers: X-API-KEY: your-api-key
Content-Type: application/json

{
  "target": "https://example.com",
  "tag_ids": [1, 2]
}
```

---

## 📱 QR 码生成 (QR Code Generation)

自动为每个短链接生成 QR 码，支持多种格式和自定义样式。

### 功能特性

- ✅ 生成 PNG、SVG 或 Data URL 格式的 QR 码
- ✅ 自定义 QR 码大小
- ✅ 自定义 QR 码颜色
- ✅ 批量生成 QR 码
- ✅ 直接下载或嵌入网页

### API 端点

#### 1. 生成单个 QR 码

**PNG 格式（默认）：**
```http
GET /api/v2/qrcode/:linkId?format=png&size=300
Headers: X-API-KEY: your-api-key (可选，用于私有链接)
```

**SVG 格式：**
```http
GET /api/v2/qrcode/:linkId?format=svg&size=300
```

**Data URL 格式：**
```http
GET /api/v2/qrcode/:linkId?format=dataurl&size=300
```

**响应示例（dataurl）：**
```json
{
  "data_url": "data:image/png;base64,iVBORw0KGgoAAAANSUh...",
  "link": "https://kutt.it/abc123"
}
```

#### 2. 自定义 QR 码样式

```http
GET /api/v2/qrcode/:linkId?format=png&size=500&color=%23000000&bgColor=%23ffffff
```

**参数说明：**
- `format`: QR 码格式 (`png`, `svg`, `dataurl`)，默认 `png`
- `size`: QR 码尺寸（像素），范围 100-2000，默认 300
- `color`: QR 码前景色（十六进制），默认 `#000000`
- `bgColor`: QR 码背景色（十六进制），默认 `#ffffff`

#### 3. 批量生成 QR 码

```http
POST /api/v2/qrcode/batch?format=dataurl&size=300
Headers: X-API-KEY: your-api-key
Content-Type: application/json

{
  "link_ids": ["uuid1", "uuid2", "uuid3"]
}
```

**响应示例：**
```json
{
  "data": [
    {
      "link_id": "uuid1",
      "address": "abc123",
      "data_url": "data:image/png;base64,iVBORw0KG...",
      "link": "https://kutt.it/abc123"
    },
    {
      "link_id": "uuid2",
      "error": "Link not found"
    }
  ]
}
```

**限制：**
- 每次最多批量生成 50 个 QR 码
- 批量生成仅支持 `dataurl` 格式

---

## 🚀 使用示例

### JavaScript/Node.js

```javascript
// 创建标签
const createTag = async () => {
  const response = await fetch('https://kutt.it/api/v2/tags', {
    method: 'POST',
    headers: {
      'X-API-KEY': 'your-api-key',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: '营销活动',
      color: '#22c55e'
    })
  });
  const data = await response.json();
  console.log(data);
};

// 创建带标签的链接
const createLinkWithTags = async () => {
  const response = await fetch('https://kutt.it/api/v2/links', {
    method: 'POST',
    headers: {
      'X-API-KEY': 'your-api-key',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      target: 'https://example.com',
      description: '产品页面',
      tag_ids: [1, 2]
    })
  });
  const link = await response.json();
  console.log(link);
};

// 生成 QR 码
const generateQRCode = async (linkId) => {
  const response = await fetch(
    `https://kutt.it/api/v2/qrcode/${linkId}?format=dataurl&size=400`,
    {
      headers: {
        'X-API-KEY': 'your-api-key'
      }
    }
  );
  const data = await response.json();
  
  // 在 HTML 中显示
  document.getElementById('qrcode').src = data.data_url;
};
```

### Python

```python
import requests

API_KEY = 'your-api-key'
BASE_URL = 'https://kutt.it/api/v2'
HEADERS = {'X-API-KEY': API_KEY}

# 创建标签
def create_tag(name, color='#3b82f6'):
    response = requests.post(
        f'{BASE_URL}/tags',
        headers={**HEADERS, 'Content-Type': 'application/json'},
        json={'name': name, 'color': color}
    )
    return response.json()

# 创建带标签的链接
def create_link_with_tags(target, tag_ids):
    response = requests.post(
        f'{BASE_URL}/links',
        headers={**HEADERS, 'Content-Type': 'application/json'},
        json={'target': target, 'tag_ids': tag_ids}
    )
    return response.json()

# 下载 QR 码
def download_qrcode(link_id, filename='qrcode.png'):
    response = requests.get(
        f'{BASE_URL}/qrcode/{link_id}?format=png&size=500',
        headers=HEADERS
    )
    with open(filename, 'wb') as f:
        f.write(response.content)
```

### cURL

```bash
# 创建标签
curl -X POST https://kutt.it/api/v2/tags \
  -H "X-API-KEY: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{"name":"工作","color":"#3b82f6"}'

# 创建带标签的链接
curl -X POST https://kutt.it/api/v2/links \
  -H "X-API-KEY: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{"target":"https://example.com","tag_ids":[1,2]}'

# 下载 QR 码
curl -o qrcode.png \
  "https://kutt.it/api/v2/qrcode/LINK_UUID?format=png&size=500" \
  -H "X-API-KEY: your-api-key"
```

---

## 📋 数据库迁移

在使用新功能之前，请运行数据库迁移：

```bash
npm run migrate
```

这将创建以下表：
- `tags` - 存储标签信息
- `link_tags` - 链接和标签的关联表

---

## 💡 最佳实践

### 标签管理
1. **使用描述性标签名称**：如 "营销活动"、"产品页面"、"测试"
2. **颜色编码**：为不同类型的链接使用不同颜色
3. **定期清理**：删除未使用的标签以保持整洁

### QR 码生成
1. **选择合适尺寸**：
   - 移动端预览：200-300px
   - 打印材料：500-1000px
   - 海报/横幅：1000-2000px
2. **保持对比度**：使用深色前景和浅色背景
3. **测试扫描**：生成后测试 QR 码的可扫描性

---

## 🔧 故障排除

### 标签相关问题

**问题：创建标签时提示 "A tag with this name already exists"**
- 原因：同一用户不能有重名标签
- 解决：使用不同的标签名称

**问题：无法为链接添加标签**
- 检查链接 ID 是否正确
- 确认标签 ID 属于当前用户
- 验证 API Key 是否有效

### QR 码相关问题

**问题：QR 码无法扫描**
- 确保尺寸至少为 200px
- 检查前景色和背景色对比度
- 避免使用过于复杂的颜色

**问题：批量生成失败**
- 确保 link_ids 数量不超过 50
- 检查是否使用了 dataurl 格式
- 验证所有链接 ID 是否有效

---

## 📚 更多信息

如有问题或建议，请访问：
- GitHub Issues: https://github.com/thedevs-network/kutt/issues
- API 文档: https://docs.kutt.it
