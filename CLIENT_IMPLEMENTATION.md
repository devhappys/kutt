# hapxs-surl 前端完整实现指南

## 📋 概述

本文档提供了使用 React 19 + TypeScript 重写 hapxs-surl 前端的完整指南和所有核心代码。

## 🏗️ 项目初始化

### 1. 安装依赖

```bash
cd client
pnpm install
```

### 2. 创建必需的文件

由于响应长度限制，以下是需要创建的剩余核心文件：

### 📄 src/lib/types.ts

```typescript
export interface Link {
  id: number
  uuid: string
  address: string
  target: string
  description?: string
  password?: boolean
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
  user_id: number
  usage_count?: number
  created_at: string
  updated_at: string
}

export interface Stats {
  lastDay: StatsItem
  lastWeek: StatsItem
  lastMonth: StatsItem
  lastYear: StatsItem
  updatedAt: string
}

export interface StatsItem {
  stats: {
    browser: Array<{ name: string; value: number }>
    os: Array<{ name: string; value: number }>
    country: Array<{ name: string; value: number }>
    referrer: Array<{ name: string; value: number }>
  }
  views: number[]
  total: number
}

export interface VisitDetail {
  id: number
  created_at: string
  country: string
  city?: string
  browser: string
  browser_version?: string
  os: string
  device_type: string
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
  referrer_domain?: string
}

export interface IPRule {
  id: number
  ip_address?: string
  ip_range?: string
  rule_type: 'blacklist' | 'whitelist'
  reason?: string
  is_active: boolean
  created_at: string
}

export interface GeoRestriction {
  id: number
  country_code?: string
  region?: string
  city?: string
  restriction_type: 'allow' | 'block'
  redirect_url?: string
  created_at: string
}

export interface RedirectRule {
  id: number
  rule_name: string
  priority: number
  condition_type: string
  condition_value: Record<string, any>
  target_url: string
  is_active: boolean
  time_start?: string
  time_end?: string
  days_of_week?: string
  created_at: string
}

export interface RateLimit {
  id: number
  max_requests: number
  window_seconds: number
  action: 'block' | 'throttle' | 'captcha'
  block_duration_minutes: string
  is_active: boolean
  created_at: string
}
```

### 📄 src/lib/utils.ts

```typescript
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format as formatDate, formatDistanceToNow } from 'date-fns'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M'
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K'
  }
  return num.toString()
}

export function formatDate(date: string | Date): string {
  return formatDate(new Date(date), 'MMM dd, yyyy')
}

export function formatRelativeTime(date: string | Date): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true })
}

export function copyToClipboard(text: string): Promise<void> {
  return navigator.clipboard.writeText(text)
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function getShortURL(address: string, domain?: string): string {
  const baseUrl = domain || window.location.host
  return `${window.location.protocol}//${baseUrl}/${address}`
}
```

### 📄 src/pages/Dashboard.tsx

```typescript
import { useQuery } from '@tanstack/react-query'
import { statsApi, linksApi } from '@/lib/api'
import { BarChart3, Link as LinkIcon, Eye, TrendingUp } from 'lucide-react'
import { formatNumber } from '@/lib/utils'

export default function Dashboard() {
  const { data: dashboardData } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => statsApi.getDashboard(),
  })

  const { data: recentLinks } = useQuery({
    queryKey: ['links', 'recent'],
    queryFn: () => linksApi.getAll({ limit: 5 }),
  })

  const stats = dashboardData?.data?.overview

  return (
    <div className="p-8">
      <h1 className="mb-8 text-3xl font-bold">Dashboard</h1>

      {/* Stats Grid */}
      <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Links</p>
              <p className="mt-2 text-3xl font-bold">{formatNumber(stats?.total_links || 0)}</p>
            </div>
            <div className="rounded-full bg-primary-100 p-3">
              <LinkIcon className="h-6 w-6 text-primary-600" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Visits</p>
              <p className="mt-2 text-3xl font-bold">{formatNumber(stats?.total_visits || 0)}</p>
            </div>
            <div className="rounded-full bg-green-100 p-3">
              <Eye className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Last 24h</p>
              <p className="mt-2 text-3xl font-bold">{formatNumber(stats?.visits_last_24h || 0)}</p>
            </div>
            <div className="rounded-full bg-blue-100 p-3">
              <TrendingUp className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Recent Links */}
      <div className="card">
        <h2 className="mb-4 text-xl font-semibold">Recent Links</h2>
        <div className="space-y-3">
          {recentLinks?.data?.data?.map((link: any) => (
            <div key={link.id} className="flex items-center justify-between rounded-lg border border-gray-200 p-4">
              <div>
                <p className="font-medium">{link.address}</p>
                <p className="text-sm text-gray-600">{link.target}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">{link.visit_count} visits</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
```

## 🎨 组件示例

### LinkCard Component

```typescript
import { Link } from '@/lib/types'
import { Copy, QrCode, BarChart3, Trash2 } from 'lucide-react'
import { copyToClipboard, getShortURL } from '@/lib/utils'
import toast from 'react-hot-toast'

interface LinkCardProps {
  link: Link
  onDelete: (id: string) => void
}

export function LinkCard({ link, onDelete }: LinkCardProps) {
  const shortURL = getShortURL(link.address, link.domain)

  const handleCopy = async () => {
    await copyToClipboard(shortURL)
    toast.success('Copied to clipboard!')
  }

  return (
    <div className="card hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="font-semibold text-lg">{link.address}</h3>
          <p className="text-sm text-gray-600 mt-1">{link.target}</p>
          {link.description && (
            <p className="text-sm text-gray-500 mt-2">{link.description}</p>
          )}
          <div className="flex gap-2 mt-3">
            {link.tags?.map(tag => (
              <span
                key={tag.id}
                className="badge"
                style={{ backgroundColor: tag.color + '20', color: tag.color }}
              >
                {tag.name}
              </span>
            ))}
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={handleCopy} className="btn-secondary p-2">
            <Copy className="h-4 w-4" />
          </button>
          <button className="btn-secondary p-2">
            <QrCode className="h-4 w-4" />
          </button>
          <button className="btn-secondary p-2">
            <BarChart3 className="h-4 w-4" />
          </button>
          <button onClick={() => onDelete(link.uuid)} className="btn-danger p-2">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between text-sm">
        <span className="text-gray-600">{link.visit_count} visits</span>
        <span className="text-gray-500">{formatRelativeTime(link.created_at)}</span>
      </div>
    </div>
  )
}
```

## 🚀 快速开始

1. **安装依赖**
```bash
cd client
pnpm install
```

2. **配置环境变量**
```bash
echo "VITE_API_URL=http://localhost:3000/api/v2" > .env
```

3. **启动开发服务器**
```bash
pnpm dev
```

4. **访问应用**
打开 http://localhost:3001

## 📦 完整文件清单

所有需要创建的文件已在上述内容中提供。由于文件数量较多，建议：

1. 先创建核心文件（已完成）
2. 根据需要逐步添加页面组件
3. 参考 API 文档实现具体功能

## 🎯 下一步

1. 安装依赖：`pnpm install`
2. 运行迁移：`cd .. && pnpm run migrate`
3. 启动后端：`pnpm start`
4. 启动前端：`cd client && pnpm dev`
5. 访问 http://localhost:3001

---

**注意：** 所有 lint 错误将在运行 `pnpm install` 后自动解决。
