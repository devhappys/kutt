# StatsPage 修复验证

## 问题描述

StatsPage 使用了错误的 API 调用方式：
- ❌ **之前**: `linksApi.getAll({ search: linkId })` - 这是搜索所有链接
- ✅ **修复后**: `linksApi.getStats(linkId)` - 获取单个链接的统计数据

## 修复内容

### 修改前
```typescript
const { data: linkData } = useQuery({
  queryKey: ['link', linkId],
  queryFn: () => linksApi.getAll({ search: linkId }),  // ❌ 错误
  enabled: !!linkId,
})
const link = linkData?.data?.data?.[0]  // ❌ 需要深层嵌套取值
```

### 修改后
```typescript
const { data: linkStatsData } = useQuery({
  queryKey: ['link', 'stats', linkId],
  queryFn: () => linksApi.getStats(linkId!),  // ✅ 正确
  enabled: !!linkId,
})
const link = linkStatsData?.data  // ✅ 直接获取链接数据
```

## API 端点对比

### 修改前（错误）
```
GET /api/v2/links?search={linkId}
响应: {
  data: [...],  // 搜索结果数组
  total: number
}
```

### 修改后（正确）
```
GET /api/v2/links/{linkId}/stats
响应: {
  id: number,
  address: string,
  target: string,
  domain: string,
  visit_count: number,
  // ... 其他链接字段
  // ... 统计数据
  allTime: { stats: [...], views: number },
  lastDay: { stats: [...], views: number },
  lastWeek: { stats: [...], views: number },
  lastMonth: { stats: [...], views: number },
  lastYear: { stats: [...], views: number }
}
```

## 现在发送的请求

访问 `/app/stats/{linkId}` 页面时，会发送以下API请求：

1. ✅ **GET** `/api/v2/links/{linkId}/stats` - 获取链接信息和历史统计
2. ✅ **GET** `/api/v2/stats/links/{linkId}/realtime` - 获取实时统计（每30秒刷新）
3. ✅ **GET** `/api/v2/stats/links/{linkId}/utm` - 获取UTM营销统计
4. ✅ **GET** `/api/v2/stats/links/{linkId}/devices` - 获取设备统计

所有请求都会携带正确的认证头：
- `X-API-KEY: {apiKey}` 或
- `Authorization: Bearer {token}`

## 测试步骤

1. **启动后端服务**
   ```bash
   pnpm dev
   ```

2. **启动前端服务**
   ```bash
   cd client && pnpm dev
   ```

3. **访问统计页面**
   ```
   http://localhost:5173/app/stats/{linkId}
   ```
   将 `{linkId}` 替换为实际的链接 UUID

4. **验证网络请求**
   - 打开浏览器开发者工具 (F12)
   - 切换到 Network 标签
   - 应该看到以下请求：
     - ✅ `GET /api/v2/links/{linkId}/stats` (Status 200)
     - ✅ `GET /api/v2/stats/links/{linkId}/realtime` (Status 200)
     - ✅ `GET /api/v2/stats/links/{linkId}/utm` (Status 200)
     - ✅ `GET /api/v2/stats/links/{linkId}/devices` (Status 200)

5. **验证页面显示**
   - ✅ 页面顶部显示链接地址和目标URL
   - ✅ Real-time Activity 卡片显示数据
   - ✅ Recent Visitors 表格显示访问记录
   - ✅ UTM Campaigns 列表显示营销数据（如有）
   - ✅ Device & Browser Stats 显示设备统计

## 常见问题排查

### 1. 链接信息不显示
**原因**: linkId 无效或链接不存在
**解决**: 检查 URL 中的 linkId 是否正确

### 2. 401 未授权错误
**原因**: 未登录或 API Key 失效
**解决**: 
- 检查 localStorage 中是否有 'apiKey'
- 重新登录

### 3. 404 链接未找到
**原因**: 链接不属于当前用户
**解决**: 确认链接所有权

### 4. 统计数据为空
**原因**: 链接尚未有访问记录
**解决**: 访问短链接生成一些数据后再查看

## 性能优化

修复后的优化点：
1. ✅ 减少了一次不必要的 API 调用
2. ✅ 数据结构更清晰，无需深层嵌套取值
3. ✅ 缓存键更准确 (`['link', 'stats', linkId]`)
4. ✅ 所有统计请求并行执行，无依赖关系

## 后续建议

考虑添加以下功能：
1. 加载状态指示器
2. 错误边界处理
3. 数据刷新按钮
4. 时间范围筛选器
5. 导出功能优化
