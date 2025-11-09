# 安全增强和智能重定向功能文档

## 🔒 功能概述

本文档介绍 hapxs-surl 新增的安全增强和智能重定向功能，让您能够更精细地控制链接访问权限和实现个性化的重定向策略。

---

## 🛡️ 安全增强功能

### 1. IP 黑白名单

控制哪些 IP 地址可以访问您的短链接。

#### 功能特性
- ✅ IP 地址黑名单（阻止特定 IP）
- ✅ IP 地址白名单（只允许特定 IP）
- ✅ IP 范围支持（CIDR 表示法）
- ✅ 每个规则可添加原因说明
- ✅ 可启用/禁用规则

#### API 端点

**获取 IP 规则**
```http
GET /api/v2/security/links/:linkId/ip-rules
Headers: X-API-KEY: your-api-key
```

**添加 IP 规则**
```http
POST /api/v2/security/links/:linkId/ip-rules
Headers: X-API-KEY: your-api-key
Content-Type: application/json

{
  "ip_address": "192.168.1.100",
  "rule_type": "blacklist",
  "reason": "Suspicious activity detected"
}
```

**更新 IP 规则**
```http
PATCH /api/v2/security/ip-rules/:id
Headers: X-API-KEY: your-api-key
Content-Type: application/json

{
  "is_active": false
}
```

**删除 IP 规则**
```http
DELETE /api/v2/security/ip-rules/:id
Headers: X-API-KEY: your-api-key
```

#### 规则类型

| 类型 | 说明 | 行为 |
|------|------|------|
| blacklist | 黑名单 | 阻止列表中的 IP 访问 |
| whitelist | 白名单 | 只允许列表中的 IP 访问 |

**优先级：** 白名单优先于黑名单

#### 使用示例

```javascript
// 添加 IP 黑名单
await fetch('/api/v2/security/links/LINK_UUID/ip-rules', {
  method: 'POST',
  headers: {
    'X-API-KEY': 'your-api-key',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    ip_address: '10.0.0.50',
    rule_type: 'blacklist',
    reason: 'Bot detected'
  })
});

// 添加 IP 白名单（只允许公司内网访问）
await fetch('/api/v2/security/links/LINK_UUID/ip-rules', {
  method: 'POST',
  headers: {
    'X-API-KEY': 'your-api-key',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    ip_range: '192.168.1.0/24',
    rule_type: 'whitelist',
    reason: 'Internal network only'
  })
});
```

---

### 2. 地理位置访问限制

根据访问者的地理位置控制链接访问。

#### 功能特性
- ✅ 按国家/地区限制
- ✅ 按城市限制
- ✅ 允许/阻止模式
- ✅ 被阻止地区可重定向到替代 URL

#### API 端点

**获取地理限制**
```http
GET /api/v2/security/links/:linkId/geo-restrictions
Headers: X-API-KEY: your-api-key
```

**添加地理限制**
```http
POST /api/v2/security/links/:linkId/geo-restrictions
Headers: X-API-KEY: your-api-key
Content-Type: application/json

{
  "country_code": "CN",
  "restriction_type": "allow",
  "redirect_url": "https://example.com/cn"
}
```

**删除地理限制**
```http
DELETE /api/v2/security/geo-restrictions/:id
Headers: X-API-KEY: your-api-key
```

#### 使用场景

**场景 1：仅允许特定国家访问**
```javascript
// 只允许美国和加拿大访问
const countries = ['US', 'CA'];
for (const country of countries) {
  await addGeoRestriction({
    link_id: linkId,
    country_code: country,
    restriction_type: 'allow'
  });
}
```

**场景 2：阻止特定地区并重定向**
```javascript
// 阻止中国访问，重定向到中文版页面
await addGeoRestriction({
  link_id: linkId,
  country_code: 'CN',
  restriction_type: 'block',
  redirect_url: 'https://example.com/zh-cn'
});
```

---

### 3. 访问频率限制（防 DDoS）

防止单个 IP 短时间内频繁访问链接。

#### 功能特性
- ✅ 自定义请求次数和时间窗口
- ✅ 多种处理动作（阻止/限流/验证码）
- ✅ 可配置阻止持续时间
- ✅ 自动记录违规行为

#### API 端点

**获取速率限制规则**
```http
GET /api/v2/security/links/:linkId/rate-limits
Headers: X-API-KEY: your-api-key
```

**添加速率限制规则**
```http
POST /api/v2/security/links/:linkId/rate-limits
Headers: X-API-KEY: your-api-key
Content-Type: application/json

{
  "max_requests": 10,
  "window_seconds": 60,
  "action": "block",
  "block_duration_minutes": "30"
}
```

**删除速率限制规则**
```http
DELETE /api/v2/security/rate-limits/:id
Headers: X-API-KEY: your-api-key
```

#### 参数说明

| 参数 | 类型 | 说明 | 示例 |
|------|------|------|------|
| max_requests | integer | 最大请求次数 | 10 |
| window_seconds | integer | 时间窗口（秒） | 60 |
| action | string | 处理动作 | block/throttle/captcha |
| block_duration_minutes | string | 阻止持续时间（分钟） | "30" |

#### 使用示例

```javascript
// 限制每分钟最多10次访问
await fetch('/api/v2/security/links/LINK_UUID/rate-limits', {
  method: 'POST',
  headers: {
    'X-API-KEY': 'your-api-key',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    max_requests: 10,
    window_seconds: 60,
    action: 'block',
    block_duration_minutes: '30'
  })
});

// 高流量链接：每小时最多100次
await fetch('/api/v2/security/links/LINK_UUID/rate-limits', {
  method: 'POST',
  headers: {
    'X-API-KEY': 'your-api-key',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    max_requests: 100,
    window_seconds: 3600,
    action: 'block',
    block_duration_minutes: '60'
  })
});
```

#### 响应示例（超出限制）

当访问者超出限制时，会收到 429 状态码：

```json
{
  "error": "Rate limit exceeded",
  "retry_after": 1800,
  "blocked_until": "2025-01-09T11:30:00.000Z"
}
```

响应头：
```
HTTP/1.1 429 Too Many Requests
Retry-After: 1800
X-RateLimit-Reset: 2025-01-09T11:30:00.000Z
```

---

## 🎯 智能重定向功能

根据访问者的设备、地理位置、时间等条件，智能重定向到不同的目标页面。

### 功能特性
- ✅ 设备类型重定向（桌面/移动/平板）
- ✅ 浏览器类型重定向
- ✅ 操作系统重定向
- ✅ 地理位置重定向
- ✅ 语言重定向
- ✅ 时间段重定向
- ✅ 来源（referrer）重定向
- ✅ 规则优先级支持

### API 端点

**获取重定向规则**
```http
GET /api/v2/security/links/:linkId/redirect-rules
Headers: X-API-KEY: your-api-key
```

**添加重定向规则**
```http
POST /api/v2/security/links/:linkId/redirect-rules
Headers: X-API-KEY: your-api-key
Content-Type: application/json

{
  "rule_name": "Mobile Users",
  "priority": 10,
  "condition_type": "device",
  "condition_value": {
    "device": "mobile"
  },
  "target_url": "https://m.example.com"
}
```

**更新重定向规则**
```http
PATCH /api/v2/security/redirect-rules/:id
Headers: X-API-KEY: your-api-key
Content-Type: application/json

{
  "is_active": false
}
```

**删除重定向规则**
```http
DELETE /api/v2/security/redirect-rules/:id
Headers: X-API-KEY: your-api-key
```

### 条件类型

| 类型 | 说明 | 示例值 |
|------|------|--------|
| device | 设备类型 | mobile, desktop, tablet |
| browser | 浏览器 | chrome, safari, firefox |
| os | 操作系统 | windows, macos, ios, android |
| country | 国家 | ["us", "uk", "ca"] |
| language | 语言 | ["en", "zh", "ja"] |
| time | 时间段 | 配合 time_start 和 time_end |
| referrer | 来源网站 | "facebook.com" |

### 使用场景

#### 场景 1：移动端重定向

移动设备访问时跳转到移动版页面：

```javascript
await addRedirectRule({
  link_id: linkId,
  rule_name: 'Mobile Redirect',
  priority: 10,
  condition_type: 'device',
  condition_value: {
    device: 'mobile'
  },
  target_url: 'https://m.example.com'
});
```

#### 场景 2：地理位置重定向

不同国家访问不同页面：

```javascript
// 中国用户跳转中文页面
await addRedirectRule({
  link_id: linkId,
  rule_name: 'China Users',
  priority: 20,
  condition_type: 'country',
  condition_value: {
    country: ['cn']
  },
  target_url: 'https://example.com/zh-cn'
});

// 日本用户跳转日文页面
await addRedirectRule({
  link_id: linkId,
  rule_name: 'Japan Users',
  priority: 20,
  condition_type: 'country',
  condition_value: {
    country: ['jp']
  },
  target_url: 'https://example.com/ja'
});
```

#### 场景 3：时间段重定向

工作时间和非工作时间跳转不同页面：

```javascript
// 工作时间（9:00-18:00）跳转到客服页面
await addRedirectRule({
  link_id: linkId,
  rule_name: 'Business Hours',
  priority: 15,
  condition_type: 'time',
  condition_value: {},
  target_url: 'https://example.com/support',
  time_start: '09:00',
  time_end: '18:00',
  days_of_week: '1,2,3,4,5' // Monday to Friday
});

// 非工作时间跳转到自助服务页面
await addRedirectRule({
  link_id: linkId,
  rule_name: 'After Hours',
  priority: 5,
  condition_type: 'time',
  condition_value: {},
  target_url: 'https://example.com/self-service',
  time_start: '18:00',
  time_end: '09:00'
});
```

#### 场景 4：来源重定向

从社交媒体来的流量跳转到特定页面：

```javascript
// 从 Facebook 来的访问跳转到社交媒体专用页面
await addRedirectRule({
  link_id: linkId,
  rule_name: 'Facebook Traffic',
  priority: 12,
  condition_type: 'referrer',
  condition_value: {
    referrer: 'facebook.com'
  },
  target_url: 'https://example.com/from-facebook'
});
```

#### 场景 5：浏览器特定重定向

```javascript
// Safari 用户需要特殊处理
await addRedirectRule({
  link_id: linkId,
  rule_name: 'Safari Users',
  priority: 8,
  condition_type: 'browser',
  condition_value: {
    browser: 'safari'
  },
  target_url: 'https://example.com/safari-optimized'
});
```

### 规则优先级

- 优先级数字越大，规则越优先执行
- 匹配到规则后立即重定向，不再检查后续规则
- 如果没有规则匹配，跳转到链接的默认目标 URL

**优先级示例：**
```
Priority 20: Country = CN → redirect to /zh-cn
Priority 15: Device = mobile → redirect to /m
Priority 10: Browser = Safari → redirect to /safari
Priority 5:  Time = After Hours → redirect to /closed
```

---

## 🔐 启用功能

创建安全规则或智能重定向规则后，对应的功能会自动在链接上启用。您也可以通过更新链接来手动控制：

```javascript
// 更新链接以启用/禁用功能
await fetch('/api/v2/links/LINK_UUID', {
  method: 'PATCH',
  headers: {
    'X-API-KEY': 'your-api-key',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    ip_restriction_enabled: true,
    geo_restriction_enabled: true,
    smart_redirect_enabled: true,
    rate_limit_enabled: true
  })
});
```

---

## 📊 执行顺序

当访问者访问短链接时，检查顺序如下：

1. **保留 URL 检查** - 检查是否为系统保留URL
2. **自定义域检查** - 检查是否使用自定义域
3. **链接存在检查** - 验证链接是否存在
4. **封禁检查** - 检查链接是否被封禁
5. **信息页面检查** - 检查是否请求链接信息
6. **🔒 IP 限制检查** - 验证 IP 是否被允许
7. **🔒 地理限制检查** - 验证地理位置是否被允许
8. **🔒 速率限制检查** - 验证是否超出访问频率
9. **🎯 智能重定向检查** - 匹配重定向规则
10. **密码保护检查** - 如果有密码，验证密码
11. **记录访问统计**
12. **执行重定向** - 跳转到目标URL

---

## 💡 最佳实践

### 安全配置

1. **分层防护**
   - 先使用 IP 白名单限制访问范围
   - 再使用黑名单阻止已知恶意 IP
   - 最后配置速率限制防止暴力访问

2. **地理限制**
   - 对敏感内容使用地理限制
   - 为被阻止地区提供替代页面
   - 定期审查和更新限制规则

3. **速率限制**
   - 根据链接类型设置合理的限制
   - 普通链接：10-20次/分钟
   - 高流量链接：50-100次/分钟
   - API 端点：更严格的限制

### 智能重定向

1. **规则设计**
   - 使用清晰的规则命名
   - 合理设置优先级
   - 避免规则冲突

2. **性能优化**
   - 不要创建过多规则
   - 优先级高的规则放在前面
   - 定期清理不使用的规则

3. **用户体验**
   - 确保移动端体验优化
   - 提供本地化内容
   - 测试不同场景的重定向

---

## 🧪 测试

### 测试 IP 限制

```bash
# 使用特定 IP 测试（通过代理）
curl -H "X-Forwarded-For: 192.168.1.100" \
  http://localhost:3000/your-short-link
```

### 测试地理限制

```bash
# 模拟不同国家
curl -H "cf-ipcountry: CN" \
  http://localhost:3000/your-short-link
```

### 测试速率限制

```bash
# 快速连续请求
for i in {1..15}; do
  curl http://localhost:3000/your-short-link
  echo "Request $i completed"
done
```

### 测试智能重定向

```bash
# 测试移动端重定向
curl -A "Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)" \
  http://localhost:3000/your-short-link

# 测试桌面端重定向
curl -A "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/91.0" \
  http://localhost:3000/your-short-link
```

---

## 🔧 故障排除

### 问题：IP 限制不生效

**检查：**
1. 确认 `ip_restriction_enabled` 为 true
2. 检查 IP 规则是否 `is_active`
3. 验证 IP 地址是否正确

### 问题：智能重定向不工作

**检查：**
1. 确认 `smart_redirect_enabled` 为 true
2. 检查规则的 `is_active` 状态
3. 验证 condition_value 格式正确
4. 检查规则优先级

### 问题：速率限制过于严格

**解决：**
1. 增加 `max_requests` 值
2. 延长 `window_seconds` 时间窗口
3. 减少 `block_duration_minutes`

---

## 📚 相关文档

- [基础功能文档](./FEATURES.md)
- [高级统计文档](./ADVANCED_STATS.md)
- [安装指南](./INSTALLATION_GUIDE.md)
- [API 文档](https://docs.hapxs-surl.it)

---

## 🆘 获取帮助

如有问题或建议：
- GitHub Issues: https://github.com/devhappys/hapxs-surl/issues
- 社区讨论

---

**实现日期：** 2025-11-09  
**版本：** hapxs-surl v3.2.3+  

🔒 **安全增强和智能重定向功能现已完成并可投入使用！**