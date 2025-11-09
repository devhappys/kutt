# hapxs-surl Client - React 19 + TypeScript Frontend

现代化的 hapxs-surl URL 短链接系统前端应用，使用 React 19、TypeScript、Vite 和 TailwindCSS 构建。

## 🚀 技术栈

- **React 19** - 最新版本的 React
- **TypeScript** - 类型安全
- **Vite** - 快速的构建工具
- **TailwindCSS** - 实用优先的 CSS 框架
- **React Router v6** - 路由管理
- **TanStack Query** - 数据获取和状态管理
- **Zustand** - 轻量级状态管理
- **Axios** - HTTP 客户端
- **Lucide React** - 图标库
- **Recharts** - 图表库
- **React Hot Toast** - 通知提示

## 📦 功能模块

### ✅ 已实现的功能

1. **🔐 用户认证**
   - 登录/注册
   - API Key 管理
   - 持久化登录状态

2. **🔗 链接管理**
   - 创建短链接
   - 编辑链接信息
   - 删除链接
   - 批量操作
   - 搜索和筛选

3. **🏷️ 标签系统**
   - 创建和管理标签
   - 为链接添加标签
   - 按标签筛选
   - 自定义标签颜色

4. **📱 QR 码生成**
   - 生成 PNG/SVG/Data URL
   - 自定义尺寸和颜色
   - 批量生成
   - 一键下载

5. **📊 高级统计**
   - 实时访问统计
   - 详细访问记录
   - UTM 参数追踪
   - 访问热力图（24h×7days）
   - 设备和浏览器分析
   - 转化漏斗分析
   - A/B 测试对比
   - 数据导出（CSV/JSON）

6. **🔒 安全管理**
   - IP 黑白名单
   - 地理位置限制
   - 访问频率限制
   - 规则管理

7. **🎯 智能重定向**
   - 设备类型重定向
   - 地理位置重定向
   - 浏览器重定向
   - 时间段重定向
   - 规则优先级管理

## 📁 项目结构

```
client/
├── src/
│   ├── components/          # 可复用组件
│   │   ├── Layout.tsx       # 主布局
│   │   ├── LinkCard.tsx     # 链接卡片
│   │   ├── TagBadge.tsx     # 标签徽章
│   │   ├── QRCodeModal.tsx  # QR码弹窗
│   │   └── ...
│   ├── pages/              # 页面组件
│   │   ├── HomePage.tsx    # 首页
│   │   ├── Dashboard.tsx   # 仪表板
│   │   ├── LinksPage.tsx   # 链接管理
│   │   ├── TagsPage.tsx    # 标签管理
│   │   ├── StatsPage.tsx   # 统计页面
│   │   ├── SecurityPage.tsx # 安全管理
│   │   ├── SettingsPage.tsx # 设置
│   │   └── LoginPage.tsx   # 登录
│   ├── lib/               # 工具库
│   │   ├── api.ts         # API 客户端
│   │   ├── utils.ts       # 工具函数
│   │   └── types.ts       # 类型定义
│   ├── stores/            # 状态管理
│   │   └── authStore.ts   # 认证状态
│   ├── hooks/             # 自定义 Hooks
│   │   ├── useLinks.ts
│   │   ├── useTags.ts
│   │   └── useStats.ts
│   ├── App.tsx            # 根组件
│   ├── main.tsx           # 入口文件
│   └── index.css          # 全局样式
├── public/                # 静态资源
├── index.html            # HTML 模板
├── package.json          # 依赖配置
├── tsconfig.json         # TypeScript 配置
├── vite.config.ts        # Vite 配置
└── tailwind.config.js    # TailwindCSS 配置
```

## 🛠️ 开发指南

### 安装依赖

```bash
cd client
pnpm install
```

### 开发模式

```bash
pnpm dev
```

应用将在 `http://localhost:3001` 启动，API 代理到 `http://localhost:3000`

### 构建生产版本

```bash
pnpm build
```

构建产物在 `dist/` 目录

### 预览生产版本

```bash
pnpm preview
```

## 🔧 环境变量

创建 `.env` 文件：

```env
VITE_API_URL=http://localhost:3000/api/v2
```

## 📱 页面说明

### 1. 首页 (HomePage)
- 快速创建短链接
- 功能介绍
- 登录/注册入口

### 2. 仪表板 (Dashboard)
- 概览统计
- 最近链接
- 快速操作
- 热门标签

### 3. 链接管理 (LinksPage)
- 链接列表
- 创建/编辑/删除
- 标签管理
- 搜索筛选
- 批量操作
- QR 码生成

### 4. 标签管理 (TagsPage)
- 标签列表
- 创建/编辑/删除标签
- 自定义颜色
- 使用统计

### 5. 统计分析 (StatsPage)
- 实时访问数据
- 访问热力图
- UTM 分析
- 设备统计
- 转化漏斗
- A/B 测试
- 数据导出

### 6. 安全管理 (SecurityPage)
- IP 规则管理
- 地理限制
- 速率限制
- 智能重定向规则

### 7. 设置 (SettingsPage)
- 个人信息
- API Key 管理
- 偏好设置

## 🎨 UI 组件

### 按钮样式

```tsx
<button className="btn-primary">Primary Button</button>
<button className="btn-secondary">Secondary Button</button>
<button className="btn-danger">Danger Button</button>
```

### 输入框

```tsx
<input type="text" className="input" placeholder="Enter text" />
```

### 卡片

```tsx
<div className="card">
  <h2>Card Title</h2>
  <p>Card content</p>
</div>
```

### 徽章

```tsx
<span className="badge bg-blue-100 text-blue-800">Tag Name</span>
```

## 🔌 API 集成

所有 API 调用都在 `src/lib/api.ts` 中定义：

```typescript
import { linksApi, tagsApi, statsApi, securityApi } from '@/lib/api'

// 获取链接列表
const { data } = await linksApi.getAll({ limit: 10 })

// 创建标签
const tag = await tagsApi.create({ name: 'Marketing', color: '#22c55e' })

// 获取统计数据
const stats = await statsApi.getDashboard()
```

## 📊 状态管理

使用 Zustand 管理全局状态：

```typescript
import { useAuthStore } from '@/stores/authStore'

function Component() {
  const { user, isAuthenticated, logout } = useAuthStore()
  
  return <div>{user?.email}</div>
}
```

## 🎯 自定义 Hooks

使用 TanStack Query 进行数据获取：

```typescript
import { useQuery, useMutation } from '@tanstack/react-query'
import { linksApi } from '@/lib/api'

function useLinks() {
  return useQuery({
    queryKey: ['links'],
    queryFn: () => linksApi.getAll(),
  })
}

function useCreateLink() {
  return useMutation({
    mutationFn: linksApi.create,
    onSuccess: () => {
      // 刷新列表
      queryClient.invalidateQueries(['links'])
    },
  })
}
```

## 🚢 部署

### 构建

```bash
pnpm build
```

### 部署到服务器

将 `dist/` 目录内容部署到 Web 服务器。

### Nginx 配置示例

```nginx
server {
    listen 80;
    server_name your-domain.com;

    root /path/to/dist;
    index index.html;

    # SPA 路由支持
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API 代理
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 🔥 性能优化

1. **代码分割** - 使用 React.lazy 和 Suspense
2. **图片优化** - 使用 WebP 格式
3. **缓存策略** - TanStack Query 自动缓存
4. **Tree Shaking** - Vite 自动优化
5. **懒加载** - 路由和组件按需加载

## 🐛 调试

### 开发者工具

- React DevTools
- TanStack Query DevTools (已集成)
- Redux DevTools (Zustand 支持)

### 日志

```typescript
console.log('[API]', response.data)
```

## 📝 代码规范

- ESLint - 代码检查
- TypeScript - 类型检查
- Prettier - 代码格式化（可选）

运行检查：

```bash
pnpm lint
```

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支
3. 提交更改
4. 推送到分支
5. 创建 Pull Request

## 📄 许可证

MIT License

## 🆘 故障排除

### 问题：依赖安装失败

```bash
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

### 问题：API 请求失败

检查 `.env` 文件中的 `VITE_API_URL` 配置是否正确。

### 问题：构建失败

```bash
pnpm build --debug
```

## 📞 支持

- GitHub Issues: [提交问题](https://github.com/devhappys/hapxs-surl/issues)
- 文档: 查看 `FEATURES.md`

---

**开发日期：** 2025-01-09  
**版本：** 3.3.0  
**框架：** React 19 + TypeScript  

🚀 **Happy Coding!**
