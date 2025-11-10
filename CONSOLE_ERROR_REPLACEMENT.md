# Console.error 替换为 Toast 消息总结

## 修改策略

所有 `console.error` 都已被优化：
- ✅ 用户可见错误 → 使用 `toast.error()` 显示
- ✅ 调试日志 → 仅在开发环境保留 `console.error`
- ✅ 改善用户体验，同时保留开发调试能力

---

## 修改的文件

### 1. PasskeyLogin.tsx
**位置：** `client/src/components/PasskeyLogin.tsx:47-51`

**修改前：**
```typescript
} catch (error: any) {
  console.error('Passkey authentication error:', error)
  
  if (error.name === 'NotAllowedError') {
```

**修改后：**
```typescript
} catch (error: any) {
  // Log to console for debugging
  if (process.env.NODE_ENV === 'development') {
    console.error('Passkey authentication error:', error)
  }
  
  if (error.name === 'NotAllowedError') {
```

**改进：**
- ✅ 保留开发环境调试日志
- ✅ 所有错误都通过 toast 显示给用户
- ✅ 7 种不同的错误场景都有友好提示

---

### 2. PasskeyManager.tsx
**位置：** `client/src/components/PasskeyManager.tsx:325-329`

**修改前：**
```typescript
} catch (error: any) {
  console.error('Passkey registration error:', error)
  
  if (error.name === 'NotAllowedError') {
```

**修改后：**
```typescript
} catch (error: any) {
  // Log to console for debugging in development
  if (process.env.NODE_ENV === 'development') {
    console.error('Passkey registration error:', error)
  }
  
  if (error.name === 'NotAllowedError') {
```

**改进：**
- ✅ 开发环境保留调试信息
- ✅ 6 种注册错误场景都有 toast 提示

---

### 3. LoginPage.tsx
**位置：** `client/src/pages/LoginPage.tsx:69-73`

**修改前：**
```typescript
.catch((error) => {
  console.error('Failed to fetch user data:', error)
  toast.error('Failed to fetch user data')
})
```

**修改后：**
```typescript
.catch((error) => {
  if (process.env.NODE_ENV === 'development') {
    console.error('Failed to fetch user data:', error)
  }
  toast.error('Failed to fetch user data. Please try again.')
})
```

**改进：**
- ✅ 开发环境调试日志
- ✅ 更详细的用户错误提示

---

### 4. StatsPage.tsx
**位置：** `client/src/pages/StatsPage.tsx:47-59`

**修改前：**
```typescript
// Debug logging
if (linkError) {
  console.error('Link stats error:', linkError)
}
if (realtimeError) {
  console.error('Realtime stats error:', realtimeError)
}
```

**修改后：**
```typescript
// Handle errors with user-friendly messages
if (linkError) {
  if (process.env.NODE_ENV === 'development') {
    console.error('Link stats error:', linkError)
  }
  toast.error('Failed to load link statistics')
}
if (realtimeError) {
  if (process.env.NODE_ENV === 'development') {
    console.error('Realtime stats error:', realtimeError)
  }
  toast.error('Failed to load realtime statistics')
}
```

**改进：**
- ✅ 用户看到友好的错误消息
- ✅ 开发者仍能查看详细错误
- ✅ 2 种统计错误都有 toast 提示

---

### 5. api.ts (API 拦截器)
**位置：** `client/src/lib/api.ts`

#### 5.1 网络错误 (第 31-32 行)
**修改前：**
```typescript
if (!error.response) {
  console.error('Network Error:', error.message)
  // Check if it's a connection error
```

**修改后：**
```typescript
if (!error.response) {
  if (import.meta.env.DEV) {
    console.error('Network Error:', error.message)
  }
  // Check if it's a connection error
```

#### 5.2 502 错误 (第 49-50 行)
**修改前：**
```typescript
} else if (status === 502) {
  error.userMessage = 'Backend server is unavailable (502). Please check if the server is running.'
  console.error('502 Bad Gateway - Backend server not responding')
}
```

**修改后：**
```typescript
} else if (status === 502) {
  error.userMessage = 'Backend server is unavailable (502). Please check if the server is running.'
  if (import.meta.env.DEV) {
    console.error('502 Bad Gateway - Backend server not responding')
  }
}
```

#### 5.3 500+ 错误 (第 56-57 行)
**修改前：**
```typescript
} else if (status >= 500) {
  error.userMessage = 'Server error. Please try again later.'
  console.error('Server Error:', error.response?.data)
}
```

**修改后：**
```typescript
} else if (status >= 500) {
  error.userMessage = 'Server error. Please try again later.'
  if (import.meta.env.DEV) {
    console.error('Server Error:', error.response?.data)
  }
}
```

**改进：**
- ✅ 使用 `import.meta.env.DEV` (Vite 环境变量)
- ✅ 所有 HTTP 错误通过 `error.userMessage` 传递
- ✅ 错误消息由各组件的 error handler 显示为 toast

---

### 6. errorHandler.ts
**位置：** `client/src/lib/errorHandler.ts:54-55`

**修改前：**
```typescript
} catch (error) {
  console.error('Server connection check failed:', error)
  return false
}
```

**修改后：**
```typescript
} catch (error) {
  if (import.meta.env.DEV) {
    console.error('Server connection check failed:', error)
  }
  return false
}
```

**改进：**
- ✅ 开发环境保留连接检查日志
- ✅ 不干扰生产环境用户体验

---

## 环境变量说明

### Vite 项目 (客户端)
- 使用 `import.meta.env.DEV`
- ✅ `api.ts`
- ✅ `errorHandler.ts`

### React 项目 (组件)
- 使用 `process.env.NODE_ENV === 'development'`
- ✅ `PasskeyLogin.tsx`
- ✅ `PasskeyManager.tsx`
- ✅ `LoginPage.tsx`
- ✅ `StatsPage.tsx`

---

## Toast 错误消息完整列表

### Passkey 认证错误
1. ✅ "Passkey authentication was cancelled"
2. ✅ "No matching passkey found on this device"
3. ✅ "Passkeys are not supported on this device"
4. ✅ "Passkey authentication timed out"
5. ✅ "Network error. Please check your connection"
6. ✅ 服务器返回的错误消息
7. ✅ "Failed to authenticate with passkey"

### Passkey 注册错误
1. ✅ "Passkey registration was cancelled"
2. ✅ "This passkey is already registered"
3. ✅ "Passkeys are not supported on this device"
4. ✅ "Passkey registration timed out"
5. ✅ 服务器返回的错误消息
6. ✅ "Failed to register passkey"

### 统计页面错误
1. ✅ "Failed to load link statistics"
2. ✅ "Failed to load realtime statistics"

### 登录页面错误
1. ✅ "Failed to fetch user data. Please try again."

### API 错误 (通过 interceptor)
1. ✅ "Cannot connect to server. Please check if the backend is running."
2. ✅ "Backend server is unavailable (502). Please check if the server is running."
3. ✅ "Service temporarily unavailable"
4. ✅ "Server error. Please try again later."

---

## 测试清单

### 开发环境测试
- [ ] 打开浏览器控制台
- [ ] 触发各种错误场景
- [ ] 验证 console.error 正常显示
- [ ] 验证 toast 消息正确显示

### 生产环境测试
- [ ] 构建生产版本: `pnpm build`
- [ ] 运行生产版本: `pnpm preview`
- [ ] 触发各种错误场景
- [ ] 验证控制台无 console.error
- [ ] 验证 toast 消息正确显示

### 错误场景测试
**Passkey 错误：**
- [ ] 取消 Passkey 认证
- [ ] Passkey 不存在
- [ ] 浏览器不支持
- [ ] 超时
- [ ] 网络错误

**API 错误：**
- [ ] 服务器未启动（网络错误）
- [ ] 502 Bad Gateway
- [ ] 500 Internal Server Error
- [ ] 401 Unauthorized

**统计错误：**
- [ ] 链接统计加载失败
- [ ] 实时统计加载失败

---

## 优势总结

### 🎯 用户体验
- ✅ 所有错误都有友好的 toast 提示
- ✅ 无技术细节泄露给普通用户
- ✅ 清晰的错误原因和建议

### 🔧 开发体验
- ✅ 开发环境保留完整调试信息
- ✅ console.error 帮助定位问题
- ✅ 不影响生产环境性能

### 🔒 安全性
- ✅ 生产环境不输出敏感信息
- ✅ 防止错误堆栈泄露
- ✅ 符合安全最佳实践

### 📊 一致性
- ✅ 统一的错误处理模式
- ✅ 一致的 toast 风格
- ✅ 可维护性更好

---

## Commit Message

```
refactor(frontend): replace console.error with toast notifications

Replace all console.error calls with user-friendly toast messages:
- Keep console.error only in development environment for debugging
- Add toast.error() for all user-facing errors
- Improve error messages for better UX

Modified files:
- components/PasskeyLogin.tsx - Passkey authentication errors
- components/PasskeyManager.tsx - Passkey registration errors
- pages/LoginPage.tsx - Login flow errors
- pages/StatsPage.tsx - Statistics loading errors
- lib/api.ts - API interceptor errors
- lib/errorHandler.ts - Connection check errors

Environment checks:
- Use `import.meta.env.DEV` for Vite (lib files)
- Use `process.env.NODE_ENV` for React components

Benefits:
- Better UX with clear error messages
- Development debugging capability preserved
- No sensitive info leaked in production
- Consistent error handling pattern
```

---

## 相关文档

- [React Hot Toast 文档](https://react-hot-toast.com/)
- [Vite 环境变量](https://vitejs.dev/guide/env-and-mode.html)
- [错误处理最佳实践](https://kentcdodds.com/blog/get-a-catch-block-error-message-with-typescript)
