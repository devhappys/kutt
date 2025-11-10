# 修复 "Unauthorized" 错误

## 错误现象

后端日志显示：
```
[backend] Unauthorized.
[backend] Unauthorized.
[backend] Unauthorized.
```

## 原因分析

### 1. 用户未登录

最常见的原因是**用户没有登录**就访问了需要认证的页面。

**检查方法：**
1. 打开浏览器控制台（F12）
2. 查看 Console 标签
3. 应该看到：`Auth state: { isAuthenticated: false, hasApiKey: false }`

### 2. API Key 丢失

localStorage 中的 `apiKey` 可能被清除了。

**检查方法：**
1. 打开浏览器控制台（F12）
2. 进入 Application 标签 → Local Storage
3. 查看是否有 `apiKey` 条目

### 3. API Key 无效

apiKey 可能过期或已被删除。

---

## 解决方案

### 方案 1: 重新登录（推荐）

**步骤：**

1. **访问登录页面**
   ```
   http://localhost:3001/login
   ```

2. **输入邮箱和密码**

3. **点击登录**

4. **登录成功后**会自动跳转到 `/app`

5. **验证**浏览器控制台应该显示：
   ```
   Auth state: { isAuthenticated: true, hasApiKey: true }
   ```

---

### 方案 2: 清除缓存后重新登录

如果重新登录仍然失败：

**步骤：**

1. **打开开发者工具**（F12）

2. **右键点击刷新按钮** → 选择 "清空缓存并硬性重新加载"

3. **或者手动清除：**
   - Application 标签
   - Storage → Clear site data
   - 点击 "Clear site data"

4. **关闭浏览器标签页**

5. **重新打开** `http://localhost:3001/login`

6. **重新登录**

---

### 方案 3: 检查后端 API Key

如果问题仍然存在，可能是后端的 API Key 验证有问题。

**检查后端日志：**

查看完整的错误信息：
```bash
# 后端控制台应该显示
GET /api/v2/links 401 Unauthorized
```

**验证 API Key 格式：**

1. **打开浏览器控制台**
2. **检查请求头**：
   ```javascript
   // 在 Network 标签中查看请求
   // Headers → Request Headers
   X-API-KEY: your-api-key-here
   ```

3. **验证 API Key 存在**且不是 `null` 或 `undefined`

---

## 技术细节

### 认证流程

1. **用户登录**
   ```
   POST /api/v2/auth/login
   → 返回 { user, apikey }
   ```

2. **前端存储 API Key**
   ```javascript
   localStorage.setItem('apiKey', apikey)
   useAuthStore.setAuth(user, apikey)
   ```

3. **后续请求自动附加**
   ```javascript
   // api.ts interceptor
   config.headers['X-API-KEY'] = localStorage.getItem('apiKey')
   ```

4. **后端验证**
   ```javascript
   // passport localapikey strategy
   // 验证 X-API-KEY header
   ```

---

### 修复内容

**已修复的文件：**

1. **`client/src/stores/authStore.ts`**
   - 添加 `onRehydrateStorage` 钩子
   - 确保 localStorage 和 store 状态同步
   - 正确设置 `isAuthenticated`

2. **`client/src/App.tsx`**
   - 添加调试日志（开发环境）
   - 改进路由保护逻辑
   - 使用 `replace` 属性避免历史记录堆积

---

## 调试技巧

### 1. 查看认证状态

在浏览器控制台运行：

```javascript
// 查看 localStorage
console.log('apiKey:', localStorage.getItem('apiKey'))

// 查看 zustand store
console.log('Auth store:', JSON.parse(localStorage.getItem('auth-storage')))
```

### 2. 查看 API 请求

打开 Network 标签：

1. **找到失败的请求**（401 状态）

2. **查看 Request Headers**
   ```
   X-API-KEY: should-have-a-value-here
   ```

3. **如果没有 X-API-KEY**
   - 说明前端没有发送 API Key
   - 用户需要重新登录

4. **如果有 X-API-KEY 但仍然 401**
   - API Key 可能无效
   - 需要重新登录获取新的 API Key

### 3. 测试 API Key

```bash
# 使用 curl 测试
curl -H "X-API-KEY: your-api-key" http://localhost:3000/api/v2/links
```

**期望结果：**
- ✅ 200 OK - API Key 有效
- ❌ 401 Unauthorized - API Key 无效

---

## 常见问题

### Q1: 为什么刷新页面后需要重新登录？

**A:** 正常情况下不需要。如果需要重新登录，可能是：
- localStorage 被清除
- 浏览器隐私模式
- 浏览器扩展清除了 cookies/storage

### Q2: 可以自动记住登录状态吗？

**A:** 已经支持！使用 zustand 的 `persist` 中间件：
- ✅ 自动保存到 localStorage
- ✅ 刷新页面自动恢复
- ✅ 关闭浏览器后再打开仍然登录

### Q3: Unauthorized 错误会影响什么？

**A:** 
- ❌ 无法访问受保护的页面
- ❌ API 请求失败
- ✅ 登录页面仍然可以访问
- ✅ 首页仍然可以访问

### Q4: 如何避免 Unauthorized 错误？

**A:** 
1. ✅ 确保登录成功
2. ✅ 不要手动清除 localStorage
3. ✅ 使用正常的登出功能
4. ✅ 不要在多个标签页同时登出

---

## 测试步骤

### 完整测试流程

1. **清除所有数据**
   ```javascript
   localStorage.clear()
   ```

2. **访问登录页面**
   ```
   http://localhost:3001/login
   ```

3. **登录**
   - 输入邮箱和密码
   - 点击 "Login"

4. **验证登录成功**
   - 浏览器控制台显示：`Auth state: { isAuthenticated: true, hasApiKey: true }`
   - 自动跳转到 `/app`

5. **访问链接页面**
   ```
   http://localhost:3001/app/links
   ```

6. **验证 API 请求**
   - Network 标签中没有 401 错误
   - 链接列表正常加载

7. **刷新页面**
   - 仍然保持登录状态
   - 数据正常加载

8. **关闭浏览器后重新打开**
   - 访问 `http://localhost:3001/app`
   - 仍然保持登录状态

---

## 相关文件

**前端：**
- `client/src/stores/authStore.ts` - 认证状态管理
- `client/src/lib/api.ts` - API 请求拦截器
- `client/src/App.tsx` - 路由保护

**后端：**
- `server/handlers/auth.handler.js` - 认证处理器
- `server/passport.js` - Passport 策略配置

---

## 完成 ✅

**问题：** 后端一直返回 Unauthorized  
**原因：** 用户未登录或 API Key 丢失  
**解决：** 重新登录并验证认证状态  
**状态：** ✅ 已添加调试日志和状态同步修复

---

## Commit Message

```
fix(auth): improve authentication state synchronization

Fix "Unauthorized" issues caused by state sync problems:

Frontend changes:
- Add onRehydrateStorage hook to authStore for localStorage sync
- Ensure isAuthenticated correctly reflects apiKey presence
- Add debug logging for auth state in development
- Use replace prop in protected route navigation

This ensures:
- ✅ localStorage and zustand store stay in sync
- ✅ Authentication state persists across page refreshes
- ✅ Better debugging with dev console logs
- ✅ Cleaner navigation history

Modified:
- client/src/stores/authStore.ts
- client/src/App.tsx

Test: Clear localStorage → Login → Refresh → Should stay authenticated
```
