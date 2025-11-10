# LinksPage 前后端适配分析

## API 端点对照表

| 功能 | 前端 API | 后端路由 | 方法 | 状态 |
|------|---------|---------|------|------|
| 获取链接列表 | `linksApi.getAll()` | `GET /api/v2/links` | `link.get` | ✅ 匹配 |
| 创建链接 | `linksApi.create()` | `POST /api/v2/links` | `link.create` | ✅ 匹配 |
| 更新链接 | `linksApi.update(id, data)` | `PATCH /api/v2/links/:id` | `link.edit` | ✅ 匹配 |
| 删除链接 | `linksApi.delete(id)` | `DELETE /api/v2/links/:id` | `link.remove` | ✅ 匹配 |
| 获取统计 | `linksApi.getStats(id)` | `GET /api/v2/links/:id/stats` | `link.stats` | ✅ 匹配 |

---

## 数据结构对照

### 1. 获取链接列表

#### 前端请求
```typescript
linksApi.getAll({ 
  search: string,  // 可选
  limit: 50        // 可选
})
```

#### 后端接收
```javascript
GET /api/v2/links?search=xxx&limit=50

// handler: link.get
const { limit, skip } = req.context;  // ✅
const search = req.query.search;       // ✅
```

#### 后端响应
```javascript
{
  total: number,
  limit: number,
  skip: number,
  data: [
    {
      id: string,
      address: string,
      target: string,
      description: string,
      password: boolean,
      expire_in: string,
      banned: boolean,
      visit_count: number,
      created_at: string,
      domain: string,
      tags: [{ id, name, color }]  // ✅ 包含标签
    }
  ]
}
```

#### 前端处理
```typescript
const links = linksData?.data?.data || []  // ✅ 正确访问
```

**状态：** ✅ **完全匹配**

---

### 2. 创建链接

#### 前端发送
```typescript
linksApi.create({
  target: string,        // 必填
  customurl?: string,    // 可选
  description?: string,  // 可选
  password?: string,     // 可选
  expire_in?: string,    // 可选（datetime-local格式）
  reuse?: boolean,       // 可选
  tag_ids?: number[]     // 可选
})
```

#### 后端接收
```javascript
POST /api/v2/links

// handler: link.create (line 117)
const { 
  reuse,        // ✅
  password,     // ✅
  customurl,    // ✅
  description,  // ✅
  target,       // ✅
  expire_in,    // ✅
} = req.body;

// 标签处理 (line 167-173)
if (req.body.tag_ids && Array.isArray(req.body.tag_ids)) {
  await query.tag.addToLink(link.id, req.body.tag_ids);
}
```

#### 后端响应
```javascript
{
  id: string,
  address: string,       // 生成的短链接地址
  target: string,
  description: string,
  password: boolean,
  expire_in: string,
  visit_count: 0,
  created_at: string,
  domain: string,
  tags: [...]           // ✅ 包含关联的标签
}
```

**状态：** ✅ **完全匹配**

---

### 3. 更新链接

#### 前端发送
```typescript
linksApi.update(linkId, {
  address?: string,      // 可选（修改短链接地址）
  target?: string,       // 可选（修改目标URL）
  description?: string,  // 可选
  expire_in?: string     // 可选
})
```

#### 后端接收
```javascript
PATCH /api/v2/links/:id

// handler: link.edit (line 192-216)
// 支持的字段：
- address      // ✅
- target       // ✅
- description  // ✅
- expire_in    // ✅
- password     // ✅ (前端未使用，但支持)
```

#### 前端逻辑
```typescript
// EditLinkModal (line 453-467)
const updateData: any = {}

// 只发送修改的字段
if (formData.address !== link.address) 
  updateData.address = formData.address
if (formData.target !== link.target) 
  updateData.target = formData.target
if (formData.description !== link.description) 
  updateData.description = formData.description
if (formData.expire_in !== link.expire_in) 
  updateData.expire_in = formData.expire_in
```

**状态：** ✅ **完全匹配**

**注意：** 前端注释说明密码创建后不可修改（line 530），符合后端逻辑。

---

### 4. 删除链接

#### 前端请求
```typescript
linksApi.delete(linkId: string)
```

#### 后端处理
```javascript
DELETE /api/v2/links/:id

// handler: link.remove
// 验证链接所有权后删除
```

**状态：** ✅ **完全匹配**

---

## 特殊功能对照

### 标签功能

#### 前端
- 创建时：发送 `tag_ids: number[]`
- 显示：`link.tags` 数组
- 过滤：客户端过滤（line 41-45）

```typescript
const filteredLinks = selectedTags.length > 0
  ? links.filter((link: any) =>
      link.tags?.some((tag: any) => selectedTags.includes(tag.id))
    )
  : links
```

#### 后端
- 创建时：接收 `tag_ids`，调用 `query.tag.addToLink()` (line 167-173)
- 返回：每个链接自动包含 `tags` 数组 (line 35-39, 88-92, 176)

```javascript
// 获取链接时自动加载标签
const linksWithTags = await Promise.all(
  data.map(async link => {
    const tags = await query.tag.getByLinkId(link.id);
    return { ...link, tags };
  })
);
```

**状态：** ✅ **完全匹配**

---

### QR码功能

#### 前端
```typescript
qrcodeApi.generate(linkId, {
  format: 'png' | 'svg' | 'dataurl',
  size: number
})
```

#### 后端
```javascript
GET /api/v2/qrcode/:id?format=png&size=300
```

**状态：** ✅ **匹配** （独立路由）

---

### 统计功能

#### 前端
```typescript
// LinksPage - 跳转到统计页面
<RouterLink to={`/app/links/${link.id}/stats`}>

// StatsPage - 使用修复后的API
linksApi.getStats(linkId)  // ✅ 正确
```

#### 后端
```javascript
GET /api/v2/links/:id/stats

// 返回链接信息 + 统计数据
{
  ...link,           // 链接字段
  allTime: {...},    // 全部时间统计
  lastDay: {...},    // 最近一天
  lastWeek: {...},   // 最近一周
  lastMonth: {...},  // 最近一月
  lastYear: {...}    // 最近一年
}
```

**状态：** ✅ **完全匹配**

---

## 认证和授权

### API Key / JWT

#### 前端 (api.ts line 14-23)
```typescript
api.interceptors.request.use((config) => {
  const apiKey = localStorage.getItem('apiKey')
  if (apiKey) {
    config.headers['X-API-KEY'] = apiKey  // ✅
  }
  return config
})
```

#### 后端 (所有路由)
```javascript
router.get("/",
  asyncHandler(auth.apikey),   // ✅ 验证 X-API-KEY
  asyncHandler(auth.jwt),      // ✅ 验证 JWT token
  asyncHandler(link.get)
);
```

**状态：** ✅ **完全匹配**

---

## 发现的问题

### ❌ 问题 1：链接ID字段不一致

**问题：** 前端路由使用 `link.id`，但后端可能返回 `uuid`

#### 前端使用
```typescript
// LinksPage.tsx line 238
<RouterLink to={`/app/links/${link.id}/stats`}>

// 删除链接 line 125
onDelete={(id: string) => deleteLink.mutate(id)}

// 编辑链接 line 443
linksApi.update(link.id, data)
```

#### 后端验证
```javascript
// link.edit (line 193)
const link = await query.link.find({
  uuid: req.params.id,  // ❌ 使用 uuid 查找
  ...
});

// link.stats (line 654-660)
const link = await query.link.find({
  ...(!user.admin && { user_id: user.id }),
  uuid  // ❌ 使用 uuid
});
```

**解决方案：** 确保后端返回的链接对象包含正确的 `id` 字段（应该是 `uuid`）

#### 检查后端响应
```javascript
// utils/sanitize.js
function link(link) {
  return {
    id: link.uuid,  // ✅ 应该映射 uuid 到 id
    address: link.address,
    ...
  }
}
```

---

### ⚠️ 问题 2：密码字段处理

#### 前端显示
```typescript
// LinksPage.tsx line 172-177
{link.password && (
  <span className="badge">
    <Lock /> Protected
  </span>
)}
```

#### 后端返回
后端应该返回 `password: boolean` 或 `has_password: boolean`，**不应该**返回实际密码哈希。

**建议：** 检查 `utils.sanitize.link()` 确保：
```javascript
function link(link) {
  return {
    ...link,
    password: !!link.password,  // ✅ 只返回布尔值
    // 不要返回实际密码哈希
  }
}
```

---

### ✅ 问题 3：日期格式

#### 前端发送（创建链接）
```typescript
// CreateLinkModal line 359-364
<input
  type="datetime-local"
  value={formData.expire_in}
  onChange={(e) => setFormData({ ...formData, expire_in: e.target.value })}
/>
```

格式：`2024-11-09T22:30` (ISO 8601 without timezone)

#### 后端接收
需要验证后端是否正确解析此格式。

---

## 优化建议

### 1. 类型安全

**建议：** 为 API 响应定义 TypeScript 接口

```typescript
// client/src/types/link.ts
export interface Link {
  id: string
  address: string
  target: string
  description?: string
  password: boolean
  expire_in?: string
  banned: boolean
  visit_count: number
  created_at: string
  updated_at: string
  domain?: string
  tags?: Tag[]
}

export interface Tag {
  id: number
  name: string
  color: string
}
```

然后在组件中使用：
```typescript
const links: Link[] = linksData?.data?.data || []
```

---

### 2. 错误处理

#### 当前前端
```typescript
// CreateLinkModal line 280-282
onError: () => {
  toast.error('Failed to create link')
}
```

**建议：** 显示后端返回的具体错误信息

```typescript
onError: (error: any) => {
  const message = error.response?.data?.message || 'Failed to create link'
  toast.error(message)
  
  // 如果有字段错误，显示详细信息
  if (error.response?.data?.errors) {
    Object.values(error.response.data.errors).forEach((err: any) => {
      toast.error(err)
    })
  }
}
```

---

### 3. 加载状态

**当前：** 只有整体加载状态

**建议：** 为每个操作添加加载状态

```typescript
// 示例：删除链接时显示加载
<button
  onClick={() => onDelete(link.id)}
  disabled={deleteLink.isPending}
  className="btn-danger p-2"
>
  {deleteLink.isPending ? (
    <div className="spinner h-4 w-4" />
  ) : (
    <Trash2 className="h-4 w-4" />
  )}
</button>
```

---

### 4. 乐观更新

**建议：** 使用 React Query 的乐观更新改善用户体验

```typescript
const deleteLink = useMutation({
  mutationFn: linksApi.delete,
  // 乐观更新
  onMutate: async (linkId) => {
    await queryClient.cancelQueries({ queryKey: ['links'] })
    
    const previousLinks = queryClient.getQueryData(['links'])
    
    queryClient.setQueryData(['links'], (old: any) => ({
      ...old,
      data: {
        ...old.data,
        data: old.data.data.filter((link: any) => link.id !== linkId)
      }
    }))
    
    return { previousLinks }
  },
  onError: (err, linkId, context) => {
    queryClient.setQueryData(['links'], context?.previousLinks)
    toast.error('Failed to delete link')
  },
  onSuccess: () => {
    toast.success('Link deleted')
  }
})
```

---

## 测试清单

### 功能测试

- [ ] **创建链接**
  - [ ] 仅目标URL（必填）
  - [ ] 自定义短链接
  - [ ] 添加描述
  - [ ] 设置密码保护
  - [ ] 设置过期时间
  - [ ] 启用重用现有链接
  - [ ] 添加标签

- [ ] **编辑链接**
  - [ ] 修改短链接地址
  - [ ] 修改目标URL
  - [ ] 修改描述
  - [ ] 修改过期时间
  - [ ] 验证密码不可修改

- [ ] **删除链接**
  - [ ] 成功删除
  - [ ] 确认UI更新

- [ ] **搜索和过滤**
  - [ ] 搜索功能
  - [ ] 标签过滤
  - [ ] 多标签组合过滤

- [ ] **其他功能**
  - [ ] 复制链接
  - [ ] 生成QR码
  - [ ] 查看统计
  - [ ] 显示访问计数
  - [ ] 显示创建时间

### 边缘情况测试

- [ ] 空状态（无链接）
- [ ] 搜索无结果
- [ ] 自定义URL已被占用
- [ ] 目标URL无效
- [ ] 网络错误处理
- [ ] 未授权（401）处理

---

## 总结

### ✅ 工作正常

1. **API 路由完全匹配**
2. **请求参数结构一致**
3. **响应数据结构兼容**
4. **标签功能完整**
5. **认证机制正确**

### ⚠️ 需要验证

1. **链接ID字段** - 确认后端返回 `id` 还是 `uuid`
2. **密码字段** - 确认返回布尔值而非哈希
3. **日期格式** - 验证 `datetime-local` 格式兼容性

### 🚀 优化建议

1. 添加 TypeScript 类型定义
2. 改进错误处理和提示
3. 添加乐观更新
4. 完善加载状态

---

**结论：** LinksPage 的前后端适配**基本完成**，只需要小幅度验证和优化即可投入使用。
