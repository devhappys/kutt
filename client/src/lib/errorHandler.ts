import toast from 'react-hot-toast'

export interface ApiError {
  response?: {
    status: number
    data?: {
      message?: string
      error?: string
    }
  }
  userMessage?: string
  message: string
  code?: string
}

/**
 * 处理API错误并显示用户友好的提示
 */
export function handleApiError(error: any, defaultMessage = 'An error occurred') {
  const apiError = error as ApiError
  
  // 优先使用自定义的用户消息
  if (apiError.userMessage) {
    toast.error(apiError.userMessage)
    return
  }
  
  // 使用服务器返回的错误消息
  if (apiError.response?.data?.message) {
    toast.error(apiError.response.data.message)
    return
  }
  
  if (apiError.response?.data?.error) {
    toast.error(apiError.response.data.error)
    return
  }
  
  // 使用默认消息
  toast.error(defaultMessage)
}

/**
 * 检查服务器连接状态
 */
export async function checkServerConnection(apiBaseUrl: string): Promise<boolean> {
  try {
    const response = await fetch(`${apiBaseUrl.replace('/api/v2', '')}/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000), // 5秒超时
    })
    return response.ok
  } catch (error) {
    console.error('Server connection check failed:', error)
    return false
  }
}

/**
 * 格式化错误消息以便显示
 */
export function formatErrorMessage(error: any): string {
  if (typeof error === 'string') {
    return error
  }
  
  const apiError = error as ApiError
  
  if (apiError.userMessage) {
    return apiError.userMessage
  }
  
  if (apiError.response?.data?.message) {
    return apiError.response.data.message
  }
  
  if (apiError.message) {
    return apiError.message
  }
  
  return 'An unknown error occurred'
}
